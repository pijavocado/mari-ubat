import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { groupBuys, type GroupBuy } from "@/lib/db/schema";
import type { GroupBuyStatus, Result } from "@/lib/domain/types";

export interface GroupBuyFacts {
  currentQuantity: number;
  targetQuantity: number;
  deadlineAt: number;
  /** The stored `groupBuys.status` column — a plain string column in the schema. */
  status: string;
}

/**
 * Derives the live group-buy status from stored facts (quantity vs target,
 * deadline vs now) instead of trusting the persisted `status` column, which
 * only changes when something writes to it. Time passing must still be
 * reflected even when nobody has committed since the deadline lapsed.
 *
 * AT_RISK scoring depends on the recovery-risk formula and purchase-history
 * data introduced in v0.6, so it isn't derived here yet — the stored value
 * is passed through until then.
 */
export function calculateGroupBuyStatus(groupBuy: GroupBuyFacts, now: number = Date.now()): GroupBuyStatus {
  if (groupBuy.status === "READY_FOR_FULFILMENT") return "READY_FOR_FULFILMENT";
  if (groupBuy.currentQuantity >= groupBuy.targetQuantity) return "MOQ_REACHED";
  if (now >= groupBuy.deadlineAt) return "EXPIRED";
  return groupBuy.status === "AT_RISK" ? "AT_RISK" : "OPEN";
}

/** Whether a group buy in this status may accept new commitments. */
export function isAcceptingCommitments(status: GroupBuyStatus): boolean {
  return status === "OPEN" || status === "AT_RISK";
}

/**
 * Marks a group buy ready for fulfilment — "the simulated completion
 * action" per docs/PLAN.md's state transitions, triggered here once a
 * clinic completes the (simulated) payment step. Idempotent.
 */
export async function completeGroupBuy(groupBuyId: string): Promise<Result<GroupBuy>> {
  const [groupBuy] = await db.select().from(groupBuys).where(eq(groupBuys.id, groupBuyId)).limit(1);
  if (!groupBuy) return { ok: false, error: "This group buy is no longer available." };

  const status = calculateGroupBuyStatus(groupBuy);
  if (status !== "MOQ_REACHED" && status !== "READY_FOR_FULFILMENT") {
    return { ok: false, error: "This group hasn't reached its target quantity yet." };
  }
  if (groupBuy.status === "READY_FOR_FULFILMENT") {
    return { ok: true, data: groupBuy };
  }

  const now = Date.now();
  await db
    .update(groupBuys)
    .set({ status: "READY_FOR_FULFILMENT", completedAt: groupBuy.completedAt ?? now })
    .where(eq(groupBuys.id, groupBuyId))
    .run();

  return { ok: true, data: { ...groupBuy, status: "READY_FOR_FULFILMENT", completedAt: groupBuy.completedAt ?? now } };
}
