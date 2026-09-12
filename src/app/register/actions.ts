"use server";

import { redirect } from "next/navigation";
import { createDemoSession } from "@/lib/domain/session";
import { registerClinic } from "@/lib/domain/clinic";

export type RegisterFormState = { error: string } | null;

export async function submitClinicRegistration(
  _prevState: RegisterFormState,
  formData: FormData,
): Promise<RegisterFormState> {
  const credentialConfirmed = formData.get("credentialConfirmed") === "on";
  const demoAcknowledged = formData.get("demoAcknowledged") === "on";

  if (!credentialConfirmed || !demoAcknowledged) {
    return { error: "Please confirm both checkboxes to continue." };
  }

  const session = await createDemoSession();

  const result = await registerClinic({
    demoSessionId: session.id,
    name: String(formData.get("name") ?? ""),
    registrationNumber: String(formData.get("registrationNumber") ?? ""),
    contactName: String(formData.get("contactName") ?? ""),
  });

  if (!result.ok) {
    return { error: result.error };
  }

  redirect("/dashboard");
}
