"use server";

import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/domain/session";
import { getClinicForSession } from "@/lib/domain/clinic";
import { getProductDetail } from "@/lib/domain/product";
import { createCommitment } from "@/lib/domain/commitment";

export type JoinGroupBuyState = { error: string } | null;

export async function joinGroupBuyAction(
  productId: string,
  _prevState: JoinGroupBuyState,
  formData: FormData,
): Promise<JoinGroupBuyState> {
  const session = await getCurrentSession();
  if (!session) redirect("/register");

  const clinic = await getClinicForSession(session.id);
  if (!clinic) redirect("/register");

  if (formData.get("confirmSimulated") !== "on") {
    return { error: "Please confirm this is a simulated commitment." };
  }

  const product = await getProductDetail(productId);
  if (!product || !product.groupBuy) {
    return { error: "This medicine isn't in an active group buy." };
  }

  const result = await createCommitment({
    groupBuyId: product.groupBuy.id,
    clinicId: clinic.id,
    quantity: Number(formData.get("quantity")),
    groupPrice: product.groupPrice,
    individualPrice: product.individualPrice,
  });

  if (!result.ok) {
    return { error: result.error };
  }

  redirect(`/medicines/${productId}/track`);
}
