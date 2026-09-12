import { randomUUID } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { commitments, groupBuys, type Commitment, type GroupBuy } from "@/lib/db/schema";
import type { Result } from "@/lib/domain/types";
import { calculateGroupBuyStatus } from "@/lib/domain/groupBuy";

/** Demo safety cap — plan requires "quantity must not exceed the configured demo maximum". */
export const MAX_COMMITMENT_QUANTITY = 50;

/** A clinic can hold at most one commitment per group buy. */
export async function getCommitmentForClinic(groupBuyId: string, clinicId: string): Promise<Commitment | null> {
  const [commitment] = await db
    .select()
    .from(commitments)
    .where(and(eq(commitments.groupBuyId, groupBuyId), eq(commitments.clinicId, clinicId)))
    .limit(1);

  return commitment ?? null;
}

export interface CreateCommitmentInput {
  groupBuyId: string;
  clinicId: string;
  quantity: number;
  groupPrice: number;
  individualPrice: number;
}

export interface CommitmentResult {
  commitment: Commitment;
  groupBuy: GroupBuy;
}

/**
 * Joins a clinic to a group buy for the given quantity. Idempotent per
 * clinic/group pair — a second call (refresh, double submit) returns the
 * existing commitment instead of creating another or double-counting demand.
 */
export async function createCommitment(input: CreateCommitmentInput): Promise<Result<CommitmentResult>> {
  if (!Number.isInteger(input.quantity) || input.quantity <= 0) {
    return { ok: false, error: "Enter a whole number of boxes greater than zero." };
  }
  if (input.quantity > MAX_COMMITMENT_QUANTITY) {
    return { ok: false, error: `Quantity can't exceed ${MAX_COMMITMENT_QUANTITY} boxes in this demo.` };
  }

  const [groupBuy] = await db.select().from(groupBuys).where(eq(groupBuys.id, input.groupBuyId)).limit(1);
  if (!groupBuy) return { ok: false, error: "This group buy is no longer available." };

  const existing = await getCommitmentForClinic(input.groupBuyId, input.clinicId);
  if (existing) {
    // Already joined — treat as success so a refresh or repeat click never duplicates it.
    return { ok: true, data: { commitment: existing, groupBuy } };
  }

  // Derived, not the stored column: a deadline can lapse without anything
  // ever writing to this row, so time passing must still block new commitments.
  const liveStatus = calculateGroupBuyStatus(groupBuy);
  if (liveStatus === "EXPIRED") {
    return { ok: false, error: "This group buy has expired." };
  }
  if (liveStatus === "MOQ_REACHED" || liveStatus === "READY_FOR_FULFILMENT") {
    return { ok: false, error: "This group has already reached its target quantity." };
  }

  const commitment: Commitment = {
    id: randomUUID(),
    groupBuyId: input.groupBuyId,
    clinicId: input.clinicId,
    quantity: input.quantity,
    unitPrice: input.groupPrice,
    estimatedSavings: input.quantity * (input.individualPrice - input.groupPrice),
    status: "CONFIRMED",
    createdAt: Date.now(),
  };

  const newQuantity = groupBuy.currentQuantity + input.quantity;
  const newStatus = newQuantity >= groupBuy.targetQuantity ? "MOQ_REACHED" : groupBuy.status;

  await db.insert(commitments).values(commitment).run();
  await db
    .update(groupBuys)
    .set({
      currentQuantity: newQuantity,
      anonymousClinicCount: groupBuy.anonymousClinicCount + 1,
      status: newStatus,
      completedAt: newStatus === "MOQ_REACHED" ? Date.now() : groupBuy.completedAt,
    })
    .where(eq(groupBuys.id, groupBuy.id))
    .run();

  const updatedGroupBuy: GroupBuy = {
    ...groupBuy,
    currentQuantity: newQuantity,
    anonymousClinicCount: groupBuy.anonymousClinicCount + 1,
    status: newStatus,
    completedAt: newStatus === "MOQ_REACHED" ? Date.now() : groupBuy.completedAt,
  };

  return { ok: true, data: { commitment, groupBuy: updatedGroupBuy } };
}
