"use server";

import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/domain/session";
import { getClinicForSession } from "@/lib/domain/clinic";
import { getProductDetail } from "@/lib/domain/product";
import { getCommitmentForClinic } from "@/lib/domain/commitment";
import { createOrder } from "@/lib/domain/order";

export type PaymentFormState = { error: string } | null;

export async function submitPaymentAction(
  productId: string,
  _prevState: PaymentFormState,
  formData: FormData,
): Promise<PaymentFormState> {
  const session = await getCurrentSession();
  if (!session) redirect(`/medicines/${productId}`);

  const clinic = await getClinicForSession(session.id);
  if (!clinic) redirect(`/medicines/${productId}`);

  const product = await getProductDetail(productId);
  if (!product || !product.groupBuy) redirect(`/medicines/${productId}`);

  const commitment = await getCommitmentForClinic(product.groupBuy.id, clinic.id);
  if (!commitment) redirect(`/medicines/${productId}`);

  if (formData.get("confirmSimulated") !== "on") {
    return { error: "Please confirm this is a simulated payment." };
  }

  const result = await createOrder({
    commitmentId: commitment.id,
    groupBuyId: product.groupBuy.id,
    cardNumber: String(formData.get("cardNumber") ?? ""),
    billingName: String(formData.get("billingName") ?? ""),
    billingAddress: String(formData.get("billingAddress") ?? ""),
    mailingAddress: String(formData.get("mailingAddress") ?? ""),
  });

  if (!result.ok) {
    return { error: result.error };
  }

  redirect(`/medicines/${productId}/order`);
}
