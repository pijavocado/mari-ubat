import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import {
  clinics,
  commitments,
  demoSessions,
  groupBuys,
  notifications,
  orders,
  recoveryEvents,
  recoveryRecommendations,
  type DemoSession,
} from "@/lib/db/schema";

export const SESSION_COOKIE_NAME = "demo_session_token";
const SESSION_TTL_MS = 24 * 60 * 60 * 1000;

/**
 * Read-only lookup for Server Components. Safe to call anywhere — never
 * mutates the response, so it cannot throw the "cannot set cookies" error.
 */
export async function getCurrentSession(): Promise<DemoSession | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;

  const [session] = await db
    .select()
    .from(demoSessions)
    .where(eq(demoSessions.sessionToken, token))
    .limit(1);

  if (!session) return null;
  if (session.expiresAt < Date.now()) return null;

  return session;
}

/**
 * Returns the visitor's current demo session, creating one (and setting the
 * cookie) if none exists yet. Mutates cookies, so only call this from a
 * Server Action or Route Handler.
 */
export async function createDemoSession(): Promise<DemoSession> {
  const existing = await getCurrentSession();
  if (existing) return existing;

  const now = Date.now();
  const session: DemoSession = {
    id: randomUUID(),
    sessionToken: randomUUID(),
    createdAt: now,
    expiresAt: now + SESSION_TTL_MS,
  };
  await db.insert(demoSessions).values(session).run();

  const store = await cookies();
  store.set(SESSION_COOKIE_NAME, session.sessionToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    expires: new Date(session.expiresAt),
    path: "/",
  });

  return session;
}

/**
 * Clears the visitor's demo data and cookie so they can start a fresh demo.
 * Also rolls back any commitment the clinic made, and any AI recovery they
 * triggered on the same group buy — the seeded group buy is shared across
 * every visitor, so resetting must undo its effect on pooled demand or the
 * demo could never be replayed (a recovery event isn't tied to a clinicId,
 * so it would otherwise survive forever and permanently block re-simulating
 * it). Only call this from a Server Action or Route Handler.
 */
export async function resetDemoSession(): Promise<void> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE_NAME)?.value;

  if (token) {
    const [session] = await db
      .select()
      .from(demoSessions)
      .where(eq(demoSessions.sessionToken, token))
      .limit(1);

    if (session) {
      const sessionClinics = await db.select().from(clinics).where(eq(clinics.demoSessionId, session.id));

      for (const clinic of sessionClinics) {
        const clinicCommitments = await db.select().from(commitments).where(eq(commitments.clinicId, clinic.id));

        for (const commitment of clinicCommitments) {
          const [groupBuy] = await db
            .select()
            .from(groupBuys)
            .where(eq(groupBuys.id, commitment.groupBuyId))
            .limit(1);

          if (groupBuy) {
            const groupBuyRecoveryEvents = await db
              .select()
              .from(recoveryEvents)
              .where(eq(recoveryEvents.groupBuyId, groupBuy.id));
            const recoveredTotal = groupBuyRecoveryEvents.reduce((sum, event) => sum + event.recoveredQuantity, 0);

            const revertedQuantity = Math.max(0, groupBuy.currentQuantity - commitment.quantity - recoveredTotal);
            const wasResolved = groupBuy.status === "MOQ_REACHED" || groupBuy.status === "READY_FOR_FULFILMENT";
            const stillMet = revertedQuantity >= groupBuy.targetQuantity;

            await db
              .update(groupBuys)
              .set({
                currentQuantity: revertedQuantity,
                anonymousClinicCount: Math.max(0, groupBuy.anonymousClinicCount - 1),
                status: wasResolved && !stillMet ? "OPEN" : groupBuy.status,
                completedAt: stillMet ? groupBuy.completedAt : null,
              })
              .where(eq(groupBuys.id, groupBuy.id))
              .run();

            await db.delete(recoveryEvents).where(eq(recoveryEvents.groupBuyId, groupBuy.id)).run();
            await db.delete(recoveryRecommendations).where(eq(recoveryRecommendations.groupBuyId, groupBuy.id)).run();
          }

          await db.delete(orders).where(eq(orders.commitmentId, commitment.id)).run();
        }

        await db.delete(commitments).where(eq(commitments.clinicId, clinic.id)).run();
        await db.delete(notifications).where(eq(notifications.clinicId, clinic.id)).run();
      }

      await db.delete(clinics).where(eq(clinics.demoSessionId, session.id)).run();
      await db.delete(demoSessions).where(eq(demoSessions.id, session.id)).run();
    }
  }

  store.delete(SESSION_COOKIE_NAME);
}
