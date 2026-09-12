"use server";

import { redirect } from "next/navigation";
import { resetDemoSession } from "@/lib/domain/session";

/**
 * Shared by the nav drawer's "Log out" button on every page. Functionally
 * identical to the dashboard's "Reset demo" (there's no separate account to
 * log out of in this demo — ending the session and rolling back its data
 * are the same operation) but reachable from anywhere now that the nav is
 * global, not just from the dashboard.
 */
export async function logoutAction() {
  await resetDemoSession();
  redirect("/");
}
