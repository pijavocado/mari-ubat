import { randomUUID } from "node:crypto";
import { and, eq, gte } from "drizzle-orm";
import { db } from "@/lib/db/client";
import {
  clinics,
  commitments,
  groupBuys,
  purchaseHistory,
  recoveryEvents,
  recoveryRecommendations,
  type GroupBuy,
  type RecoveryEvent,
} from "@/lib/db/schema";
import type { Result, RiskLabel } from "@/lib/domain/types";
import { calculateGroupBuyStatus } from "@/lib/domain/groupBuy";

/** How far back "recent" momentum looks, and how many units in that window counts as healthy. */
const MOMENTUM_WINDOW_MS = 6 * 60 * 60 * 1000;
const MOMENTUM_TARGET_UNITS = 20;

export interface RiskInputs {
  remainingQuantity: number;
  targetQuantity: number;
  shortfallRatio: number;
  hoursRemaining: number;
  timePressure: number;
  unitsAddedRecently: number;
  momentumTarget: number;
  momentumPenalty: number;
}

export interface RiskAssessment {
  riskScore: number;
  riskPercent: number;
  riskLabel: RiskLabel;
  inputs: RiskInputs;
}

/**
 * Deterministic, explainable risk score — see docs/PLAN.md's "Explainable
 * AI rules model". `viewingClinicId`, when given, excludes that clinic's
 * own commitments from the momentum term: momentum is meant to capture
 * whether *other* clinics are still actively joining, not the fact that the
 * person currently looking at the assessment just acted themselves — a
 * clinic's own join shouldn't be read as reassuring evidence to itself.
 */
export async function calculateRecoveryRisk(
  groupBuyId: string,
  viewingClinicId?: string,
  now: number = Date.now(),
): Promise<RiskAssessment | null> {
  const [groupBuy] = await db.select().from(groupBuys).where(eq(groupBuys.id, groupBuyId)).limit(1);
  if (!groupBuy) return null;

  const remainingQuantity = Math.max(0, groupBuy.targetQuantity - groupBuy.currentQuantity);
  const shortfallRatio = groupBuy.targetQuantity > 0 ? remainingQuantity / groupBuy.targetQuantity : 0;

  const hoursRemaining = Math.max(0, (groupBuy.deadlineAt - now) / (60 * 60 * 1000));
  const timePressure = 1 - hoursRemaining / 24;

  const recent = await db
    .select()
    .from(commitments)
    .where(and(eq(commitments.groupBuyId, groupBuyId), gte(commitments.createdAt, now - MOMENTUM_WINDOW_MS)));
  const unitsAddedRecently = recent
    .filter((c) => c.clinicId !== viewingClinicId)
    .reduce((sum, c) => sum + c.quantity, 0);
  const momentumPenalty = 1 - Math.min(1, unitsAddedRecently / MOMENTUM_TARGET_UNITS);

  const raw = 0.25 * shortfallRatio + 0.55 * timePressure + 0.2 * momentumPenalty;
  const riskScore = Math.min(1, Math.max(0, raw));
  const riskPercent = Math.round(riskScore * 100);
  const riskLabel: RiskLabel = riskScore >= 0.65 ? "AT_RISK" : riskScore >= 0.4 ? "MEDIUM" : "LOW";

  return {
    riskScore,
    riskPercent,
    riskLabel,
    inputs: {
      remainingQuantity,
      targetQuantity: groupBuy.targetQuantity,
      shortfallRatio,
      hoursRemaining,
      timePressure,
      unitsAddedRecently,
      momentumTarget: MOMENTUM_TARGET_UNITS,
      momentumPenalty,
    },
  };
}

export interface EligibleClinicInputs {
  usualQuantity: number;
  averageReorderIntervalDays: number;
  daysSinceLastPurchase: number;
}

export interface EligibleReorderResult {
  eligibleClinics: EligibleClinicInputs[];
  eligibleClinicCount: number;
  /** Raw sum of eligible clinics' usual quantities — uncapped, for the explanation. */
  potentialRecoveredQuantity: number;
}

/**
 * Historical buyers whose usual reorder window has arrived. Returns figures
 * only — no clinic name or id leaves this function, keeping the recommendation
 * anonymous by construction rather than by the caller remembering to hide it.
 */
export async function getEligibleReorderClinics(groupBuyId: string): Promise<EligibleReorderResult | null> {
  const [groupBuy] = await db.select().from(groupBuys).where(eq(groupBuys.id, groupBuyId)).limit(1);
  if (!groupBuy) return null;

  if (calculateGroupBuyStatus(groupBuy) === "EXPIRED") {
    return { eligibleClinics: [], eligibleClinicCount: 0, potentialRecoveredQuantity: 0 };
  }

  const alreadyCommitted = await db
    .select({ clinicId: commitments.clinicId })
    .from(commitments)
    .where(eq(commitments.groupBuyId, groupBuyId));
  const committedClinicIds = new Set(alreadyCommitted.map((row) => row.clinicId));

  const history = await db
    .select({ history: purchaseHistory, clinic: clinics })
    .from(purchaseHistory)
    .innerJoin(clinics, eq(purchaseHistory.clinicId, clinics.id))
    .where(eq(purchaseHistory.productId, groupBuy.productId));

  const eligibleClinics = history
    .filter(
      ({ history: h, clinic }) =>
        clinic.verificationStatus === "VERIFIED" &&
        !committedClinicIds.has(clinic.id) &&
        h.usualQuantity > 0 &&
        h.daysSinceLastPurchase >= h.averageReorderIntervalDays * 0.8,
    )
    .map(({ history: h }) => ({
      usualQuantity: h.usualQuantity,
      averageReorderIntervalDays: h.averageReorderIntervalDays,
      daysSinceLastPurchase: h.daysSinceLastPurchase,
    }));

  return {
    eligibleClinics,
    eligibleClinicCount: eligibleClinics.length,
    potentialRecoveredQuantity: eligibleClinics.reduce((sum, c) => sum + c.usualQuantity, 0),
  };
}

export async function getRecoveryEvent(groupBuyId: string): Promise<RecoveryEvent | null> {
  const [event] = await db.select().from(recoveryEvents).where(eq(recoveryEvents.groupBuyId, groupBuyId)).limit(1);
  return event ?? null;
}

export interface SimulateRecoveryResult {
  groupBuy: GroupBuy;
  event: RecoveryEvent;
}

/**
 * Simulates other clinics acting on the AI's recommendation. Adds just
 * enough recovered demand to close the remaining gap (never more than the
 * group actually needs), logs an audit record of the recommendation that
 * justified it, and is idempotent — a second call is rejected rather than
 * double-counting.
 */
export async function simulateDemandRecovery(groupBuyId: string): Promise<Result<SimulateRecoveryResult>> {
  const [groupBuy] = await db.select().from(groupBuys).where(eq(groupBuys.id, groupBuyId)).limit(1);
  if (!groupBuy) return { ok: false, error: "This group buy is no longer available." };

  const [existingEvent] = await db.select().from(recoveryEvents).where(eq(recoveryEvents.groupBuyId, groupBuyId)).limit(1);
  if (existingEvent) return { ok: false, error: "Recovery has already been simulated for this group buy." };

  const status = calculateGroupBuyStatus(groupBuy);
  if (status === "EXPIRED") return { ok: false, error: "This group buy has expired." };
  if (status === "MOQ_REACHED" || status === "READY_FOR_FULFILMENT") {
    return { ok: false, error: "This group has already reached its target quantity." };
  }

  const [eligible, risk] = await Promise.all([
    getEligibleReorderClinics(groupBuyId),
    calculateRecoveryRisk(groupBuyId),
  ]);
  if (!eligible || !risk) return { ok: false, error: "This group buy is no longer available." };

  const remaining = Math.max(0, groupBuy.targetQuantity - groupBuy.currentQuantity);
  const recoveredQuantity = Math.min(eligible.potentialRecoveredQuantity, remaining);
  if (recoveredQuantity <= 0) {
    return { ok: false, error: "No recoverable demand is available for this group buy." };
  }

  const now = Date.now();

  await db
    .insert(recoveryRecommendations)
    .values({
      id: randomUUID(),
      groupBuyId,
      riskScore: risk.riskPercent,
      eligibleClinicCount: eligible.eligibleClinicCount,
      potentialRecoveredQuantity: eligible.potentialRecoveredQuantity,
      explanation:
        "Remaining quantity is high relative to time left, and recent group demand has slowed; eligible clinics are approaching their usual reorder window.",
      createdAt: now,
    })
    .run();

  const event: RecoveryEvent = {
    id: randomUUID(),
    groupBuyId,
    recoveredQuantity,
    source: "SIMULATED_REORDER",
    createdAt: now,
  };
  await db.insert(recoveryEvents).values(event).run();

  const newQuantity = Math.min(groupBuy.targetQuantity, groupBuy.currentQuantity + recoveredQuantity);
  const newStatus = newQuantity >= groupBuy.targetQuantity ? "MOQ_REACHED" : groupBuy.status;

  await db
    .update(groupBuys)
    .set({
      currentQuantity: newQuantity,
      status: newStatus,
      completedAt: newStatus === "MOQ_REACHED" ? now : groupBuy.completedAt,
    })
    .where(eq(groupBuys.id, groupBuyId))
    .run();

  const updatedGroupBuy: GroupBuy = {
    ...groupBuy,
    currentQuantity: newQuantity,
    status: newStatus,
    completedAt: newStatus === "MOQ_REACHED" ? now : groupBuy.completedAt,
  };

  return { ok: true, data: { groupBuy: updatedGroupBuy, event } };
}
