import { eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { commitments, groupBuys, orders, products } from "@/lib/db/schema";
import type { Result } from "@/lib/domain/types";

/** An order reaches this status once the supplier simulates shipping it. */
export const OUT_FOR_DELIVERY = "OUT_FOR_DELIVERY";

export interface SupplierOrderSummary {
  groupBuyId: string;
  productId: string;
  productName: string;
  productStrength: string;
  category: string;
  /** MOQ for this group buy. */
  targetQuantity: number;
  /** Anonymous count — the supplier sees how many joined, never who. */
  doctorCount: number;
  /** How many paid orders under this group buy are still awaiting delivery. */
  readyOrderCount: number;
}

/**
 * One row per group buy that has at least one paid order still awaiting
 * delivery — this is the supplier's aggregate view: they ship the whole
 * pooled order at once, never see individual clinics (see docs/PLAN.md's
 * "no real supplier integration" / anonymity rules, which this still respects
 * even though a dedicated supplier dashboard was originally out of scope).
 */
export async function listOrdersReadyForDelivery(): Promise<SupplierOrderSummary[]> {
  const rows = await db
    .select({ order: orders, commitment: commitments, groupBuy: groupBuys, product: products })
    .from(orders)
    .innerJoin(commitments, eq(orders.commitmentId, commitments.id))
    .innerJoin(groupBuys, eq(commitments.groupBuyId, groupBuys.id))
    .innerJoin(products, eq(groupBuys.productId, products.id))
    .where(eq(orders.status, "READY_FOR_FULFILMENT"));

  const byGroupBuy = new Map<string, SupplierOrderSummary>();
  for (const row of rows) {
    const existing = byGroupBuy.get(row.groupBuy.id);
    if (existing) {
      existing.readyOrderCount += 1;
      continue;
    }
    byGroupBuy.set(row.groupBuy.id, {
      groupBuyId: row.groupBuy.id,
      productId: row.product.id,
      productName: row.product.name,
      productStrength: row.product.strength,
      category: row.product.category,
      targetQuantity: row.groupBuy.targetQuantity,
      doctorCount: row.groupBuy.anonymousClinicCount,
      readyOrderCount: 1,
    });
  }

  return [...byGroupBuy.values()];
}

/**
 * Simulates the supplier shipping the whole aggregate order for a group buy
 * in one go — marks every paid order under it as out for delivery. No real
 * courier or delivery integration (out of scope), just a status flip the
 * clinic's own order page reflects.
 */
export async function proceedToDelivery(groupBuyId: string): Promise<Result<number>> {
  const groupCommitments = await db
    .select({ id: commitments.id })
    .from(commitments)
    .where(eq(commitments.groupBuyId, groupBuyId));
  const commitmentIds = groupCommitments.map((row) => row.id);
  if (commitmentIds.length === 0) {
    return { ok: false, error: "No paid orders found for this group buy yet." };
  }

  const groupOrders = await db.select().from(orders).where(inArray(orders.commitmentId, commitmentIds));
  const readyOrders = groupOrders.filter((order) => order.status === "READY_FOR_FULFILMENT");
  if (readyOrders.length === 0) {
    return { ok: false, error: "No orders are ready for delivery yet." };
  }

  for (const order of readyOrders) {
    await db.update(orders).set({ status: OUT_FOR_DELIVERY }).where(eq(orders.id, order.id)).run();
  }

  return { ok: true, data: readyOrders.length };
}
