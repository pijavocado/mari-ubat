import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { clinics, type Clinic } from "@/lib/db/schema";
import type { Result } from "@/lib/domain/types";

export async function getClinicForSession(demoSessionId: string): Promise<Clinic | null> {
  const [clinic] = await db
    .select()
    .from(clinics)
    .where(eq(clinics.demoSessionId, demoSessionId))
    .limit(1);

  return clinic ?? null;
}

export interface RegisterClinicInput {
  demoSessionId: string;
  name: string;
  registrationNumber: string;
  contactName: string;
}

/**
 * Registers a clinic for the current demo session. Verification is
 * simulated: the clinic is marked VERIFIED immediately. Idempotent per
 * session — a session can only ever hold one clinic.
 */
export async function registerClinic(input: RegisterClinicInput): Promise<Result<Clinic>> {
  const name = input.name.trim();
  const registrationNumber = input.registrationNumber.trim();
  const contactName = input.contactName.trim();

  if (!name || !registrationNumber || !contactName) {
    return { ok: false, error: "Please fill in all required fields." };
  }

  const existing = await getClinicForSession(input.demoSessionId);
  if (existing) {
    return { ok: true, data: existing };
  }

  const clinic: Clinic = {
    id: randomUUID(),
    demoSessionId: input.demoSessionId,
    name,
    registrationNumber,
    contactName,
    verificationStatus: "VERIFIED",
    createdAt: Date.now(),
  };
  await db.insert(clinics).values(clinic).run();

  return { ok: true, data: clinic };
}
