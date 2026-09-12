import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { orders, type Order } from "@/lib/db/schema";
import type { Result } from "@/lib/domain/types";
import { completeGroupBuy } from "@/lib/domain/groupBuy";

const DELIVERY_LEAD_DAYS = 3;

export async function getOrderForCommitment(commitmentId: string): Promise<Order | null> {
  const [order] = await db.select().from(orders).where(eq(orders.commitmentId, commitmentId)).limit(1);
  return order ?? null;
}

export interface CreateOrderInput {
  commitmentId: string;
  groupBuyId: string;
  cardNumber: string;
  billingName: string;
  billingAddress: string;
  mailingAddress: string;
}

/**
 * Simulates checkout for one clinic's commitment: never processes a real
 * payment (see docs/PLAN.md's "Out of scope" list) — only the card's last 4
 * digits are kept, purely for the confirmation screen. Also completes the
 * shared group buy (MOQ_REACHED → READY_FOR_FULFILMENT), since that
 * transition happens "after the simulated completion action".
 */
export async function createOrder(input: CreateOrderInput): Promise<Result<Order>> {
  const billingName = input.billingName.trim();
  const billingAddress = input.billingAddress.trim();
  const mailingAddress = input.mailingAddress.trim();
  const digitsOnly = input.cardNumber.replace(/\D/g, "");

  if (digitsOnly.length < 12) {
    return { ok: false, error: "Enter a valid card number." };
  }
  if (!billingName || !billingAddress || !mailingAddress) {
    return { ok: false, error: "Please fill in all billing and mailing fields." };
  }

  const existing = await getOrderForCommitment(input.commitmentId);
  if (existing) {
    // Already paid — idempotent, same as commitment/recovery guards elsewhere.
    return { ok: true, data: existing };
  }

  const completion = await completeGroupBuy(input.groupBuyId);
  if (!completion.ok) {
    return { ok: false, error: completion.error };
  }

  const now = Date.now();
  const order: Order = {
    id: randomUUID(),
    commitmentId: input.commitmentId,
    cardLast4: digitsOnly.slice(-4),
    billingName,
    billingAddress,
    mailingAddress,
    status: "READY_FOR_FULFILMENT",
    estimatedDeliveryAt: now + DELIVERY_LEAD_DAYS * 24 * 60 * 60 * 1000,
    createdAt: now,
  };

  await db.insert(orders).values(order).run();

  return { ok: true, data: order };
}
