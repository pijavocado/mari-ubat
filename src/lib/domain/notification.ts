import { randomUUID } from "node:crypto";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import {
  clinics,
  commitments,
  groupBuys,
  notifications,
  products,
  purchaseHistory,
  type Notification,
} from "@/lib/db/schema";
import type { Result } from "@/lib/domain/types";
import { calculateGroupBuyStatus } from "@/lib/domain/groupBuy";

export interface EligibleClinicForNotification {
  clinicId: string;
  clinicName: string;
  usualQuantity: number;
  averageReorderIntervalDays: number;
  daysSinceLastPurchase: number;
  notified: boolean;
}

/**
 * Same reorder-eligibility rule as the anonymous AI screen
 * (getEligibleReorderClinics), but this one is for an internal, operational
 * view — it identifies clinics by name, since actually notifying someone
 * requires knowing who they are. Kept as a separate function rather than
 * changing the anonymous one, so the clinic-facing risk explanation can
 * never accidentally start leaking identities.
 */
export async function listEligibleClinicsForNotification(groupBuyId: string): Promise<EligibleClinicForNotification[]> {
  const [groupBuy] = await db.select().from(groupBuys).where(eq(groupBuys.id, groupBuyId)).limit(1);
  if (!groupBuy) return [];
  if (calculateGroupBuyStatus(groupBuy) === "EXPIRED") return [];

  const alreadyCommitted = await db
    .select({ clinicId: commitments.clinicId })
    .from(commitments)
    .where(eq(commitments.groupBuyId, groupBuyId));
  const committedIds = new Set(alreadyCommitted.map((row) => row.clinicId));

  const alreadyNotified = await db
    .select({ clinicId: notifications.clinicId })
    .from(notifications)
    .where(eq(notifications.groupBuyId, groupBuyId));
  const notifiedIds = new Set(alreadyNotified.map((row) => row.clinicId));

  const history = await db
    .select({ history: purchaseHistory, clinic: clinics })
    .from(purchaseHistory)
    .innerJoin(clinics, eq(purchaseHistory.clinicId, clinics.id))
    .where(eq(purchaseHistory.productId, groupBuy.productId));

  return history
    .filter(
      ({ history: h, clinic }) =>
        clinic.verificationStatus === "VERIFIED" &&
        !committedIds.has(clinic.id) &&
        h.usualQuantity > 0 &&
        h.daysSinceLastPurchase >= h.averageReorderIntervalDays * 0.8,
    )
    .map(({ history: h, clinic }) => ({
      clinicId: clinic.id,
      clinicName: clinic.name,
      usualQuantity: h.usualQuantity,
      averageReorderIntervalDays: h.averageReorderIntervalDays,
      daysSinceLastPurchase: h.daysSinceLastPurchase,
      notified: notifiedIds.has(clinic.id),
    }));
}

/** Sends (simulated) reorder notifications to every not-yet-notified eligible clinic. */
export async function sendReorderNotifications(groupBuyId: string): Promise<Result<number>> {
  const eligible = await listEligibleClinicsForNotification(groupBuyId);
  const toNotify = eligible.filter((clinic) => !clinic.notified);
  if (toNotify.length === 0) {
    return { ok: false, error: "All eligible clinics have already been notified." };
  }

  const now = Date.now();
  for (const clinic of toNotify) {
    await db
      .insert(notifications)
      .values({
        id: randomUUID(),
        clinicId: clinic.clinicId,
        groupBuyId,
        message:
          "We noticed you're approaching your usual reorder period for this medicine, and your stock might be running low. A group buy is open right now — interested in joining?",
        status: "PENDING",
        createdAt: now,
      })
      .run();
  }

  return { ok: true, data: toNotify.length };
}

export interface LowStockNotificationInput {
  clinicId: string;
  groupBuyId: string;
  productName: string;
  productStrength: string;
  remainingQuantity: number;
}

/**
 * Auto-generates the clinic's own "you might be running low" reminder for a
 * group buy it hasn't joined yet — sent at most once per clinic/group-buy
 * pair, regardless of whether it's since been dismissed or acted on. This is
 * what actually populates the inbox for the one real clinic session this
 * demo gives you (the name-identified eligibility list in
 * listEligibleClinicsForNotification targets fictional historical clinics
 * that can't log in, so it can't be the only way to see this feature work).
 */
export async function ensureLowStockNotification(input: LowStockNotificationInput): Promise<void> {
  const [existing] = await db
    .select()
    .from(notifications)
    .where(and(eq(notifications.clinicId, input.clinicId), eq(notifications.groupBuyId, input.groupBuyId)))
    .limit(1);
  if (existing) return;

  await db
    .insert(notifications)
    .values({
      id: randomUUID(),
      clinicId: input.clinicId,
      groupBuyId: input.groupBuyId,
      message: `This group buy still needs ${input.remainingQuantity} more boxes to reach its minimum order quantity. Based on typical reorder patterns, your clinic might be running low on ${input.productName} ${input.productStrength} — interested in joining?`,
      type: "LOW_STOCK",
      status: "PENDING",
      createdAt: Date.now(),
    })
    .run();
}

export interface MoqReachedNotificationInput {
  clinicId: string;
  groupBuyId: string;
  productName: string;
  productStrength: string;
}

/**
 * Alerts a clinic that a group buy it already joined just reached MOQ —
 * sent from "Notify me when MOQ is reached" once the (simulated) recovery
 * that closes the gap succeeds. Always creates a fresh row: unlike the
 * low-stock reminder this isn't deduped, since it only ever fires once in
 * practice (simulateDemandRecovery itself is one-shot per group buy).
 */
export async function notifyMoqReached(input: MoqReachedNotificationInput): Promise<void> {
  await db
    .insert(notifications)
    .values({
      id: randomUUID(),
      clinicId: input.clinicId,
      groupBuyId: input.groupBuyId,
      message: `Good news — ${input.productName} ${input.productStrength} has reached its minimum order quantity! You're ready to proceed to payment.`,
      type: "MOQ_REACHED",
      status: "PENDING",
      createdAt: Date.now(),
    })
    .run();
}

export interface ClinicNotification {
  id: string;
  message: string;
  type: string;
  productId: string;
  productName: string;
  productStrength: string;
  createdAt: number;
}

/** Pending notifications for the currently logged-in clinic, newest first. */
export async function listPendingNotifications(clinicId: string): Promise<ClinicNotification[]> {
  const rows = await db
    .select({ notification: notifications, groupBuy: groupBuys, product: products })
    .from(notifications)
    .innerJoin(groupBuys, eq(notifications.groupBuyId, groupBuys.id))
    .innerJoin(products, eq(groupBuys.productId, products.id))
    .where(and(eq(notifications.clinicId, clinicId), eq(notifications.status, "PENDING")))
    .orderBy(desc(notifications.createdAt));

  return rows.map(({ notification, product }) => ({
    id: notification.id,
    message: notification.message,
    type: notification.type,
    productId: product.id,
    productName: product.name,
    productStrength: product.strength,
    createdAt: notification.createdAt,
  }));
}

/** "Maybe next time" or "Take me there" — either way, it leaves the active inbox. */
export async function respondToNotification(notificationId: string, action: "dismissed" | "acted"): Promise<void> {
  await db
    .update(notifications)
    .set({ status: action === "acted" ? "ACTED" : "DISMISSED" })
    .where(eq(notifications.id, notificationId))
    .run();
}

export type { Notification };
