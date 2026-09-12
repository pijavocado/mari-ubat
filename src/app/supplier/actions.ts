"use server";

import { revalidatePath } from "next/cache";
import { proceedToDelivery } from "@/lib/domain/supplier";

export async function proceedToDeliveryAction(groupBuyId: string) {
  await proceedToDelivery(groupBuyId);
  revalidatePath("/supplier");
}
