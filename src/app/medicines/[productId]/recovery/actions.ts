"use server";

import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/domain/session";
import { getClinicForSession } from "@/lib/domain/clinic";
import { getProductDetail } from "@/lib/domain/product";
import { getCommitmentForClinic } from "@/lib/domain/commitment";
import { simulateDemandRecovery } from "@/lib/domain/recovery";
import { notifyMoqReached } from "@/lib/domain/notification";

/**
 * "Notify me when MOQ is reached" — still simulates the group completing
 * under the hood (the same mechanic as before; there's no other way to
 * close the gap in a single-real-clinic demo), but instead of jumping
 * straight to the tracking page it drops a "MOQ reached" alert in the
 * clinic's own inbox and sends them there. They discover it and click
 * through from the inbox itself, matching what a real notification flow
 * would feel like.
 */
export async function notifyOnMoqReachedAction(productId: string) {
  const session = await getCurrentSession();
  if (!session) redirect(`/medicines/${productId}`);

  const clinic = await getClinicForSession(session.id);
  if (!clinic) redirect(`/medicines/${productId}`);

  const product = await getProductDetail(productId);
  if (!product || !product.groupBuy) redirect(`/medicines/${productId}`);

  const commitment = await getCommitmentForClinic(product.groupBuy.id, clinic.id);
  if (!commitment) redirect(`/medicines/${productId}`);

  const result = await simulateDemandRecovery(product.groupBuy.id);
  if (result.ok) {
    await notifyMoqReached({
      clinicId: clinic.id,
      groupBuyId: product.groupBuy.id,
      productName: product.name,
      productStrength: product.strength,
    });
  }

  redirect("/inbox");
}
