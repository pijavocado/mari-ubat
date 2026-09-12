"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { respondToNotification } from "@/lib/domain/notification";

/** "No, thank you" — dismiss without navigating away. */
export async function dismissNotificationAction(notificationId: string) {
  await respondToNotification(notificationId, "dismissed");
  revalidatePath("/inbox");
}

/**
 * "Bring me there" — mark it acted on, then send the clinic to wherever
 * makes sense for that alert (the product page to join, or straight to the
 * tracking page to pay once MOQ's already reached).
 */
export async function bringMeThereAction(notificationId: string, href: string) {
  await respondToNotification(notificationId, "acted");
  redirect(href);
}
