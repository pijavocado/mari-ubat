"use server";

import { redirect } from "next/navigation";
import { resetDemoSession } from "@/lib/domain/session";

export async function resetDemoSessionAction() {
  await resetDemoSession();
  redirect("/");
}
