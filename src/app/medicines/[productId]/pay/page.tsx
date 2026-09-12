import { notFound, redirect } from "next/navigation";
import { getProductDetail } from "@/lib/domain/product";
import { getCurrentSession } from "@/lib/domain/session";
import { getClinicForSession } from "@/lib/domain/clinic";
import { getCommitmentForClinic } from "@/lib/domain/commitment";
import { getOrderForCommitment } from "@/lib/domain/order";
import { formatCurrency } from "@/lib/format";
import { ChevronLeftIcon, CreditCardIcon } from "@/components/icons";
import { NavMenu } from "@/components/NavMenu";
import { PaymentForm } from "./PaymentForm";

interface PayPageProps {
  params: Promise<{ productId: string }>;
}

export default async function PayPage({ params }: PayPageProps) {
  const { productId } = await params;
  const product = await getProductDetail(productId);
  if (!product || !product.groupBuy) notFound();

  const session = await getCurrentSession();
  if (!session) redirect(`/medicines/${productId}`);

  const clinic = await getClinicForSession(session.id);
  if (!clinic) redirect(`/medicines/${productId}`);

  const commitment = await getCommitmentForClinic(product.groupBuy.id, clinic.id);
  if (!commitment) redirect(`/medicines/${productId}`);

  const existingOrder = await getOrderForCommitment(commitment.id);
  if (existingOrder) redirect(`/medicines/${productId}/order`);

  const moqMet = product.groupBuy.status === "MOQ_REACHED" || product.groupBuy.status === "READY_FOR_FULFILMENT";
  if (!moqMet) redirect(`/medicines/${productId}/track`);

  return (
    <main className="min-h-screen bg-paper pb-10">
      <div className="sticky top-0 z-10 flex items-center gap-3 bg-navy px-4 py-3.5 text-white">
        <NavMenu variant="dark" groupBuyHref={`/medicines/${productId}/track`} orderHref={`/medicines/${productId}/order`} />
        <a
          href={`/medicines/${productId}/track`}
          aria-label="Back to group progress"
          className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-white/70 transition hover:bg-white/10 hover:text-white"
        >
          <ChevronLeftIcon className="h-5 w-5" />
        </a>
        <p className="display-font truncate text-sm">Payment</p>
      </div>

      <div className="mx-auto max-w-lg p-4 md:p-6">
        <div className="flex items-start gap-3 rounded-2xl bg-navy p-5 text-white shadow-soft">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-sky text-navy">
            <CreditCardIcon className="h-4 w-4" aria-hidden="true" />
          </span>
          <div>
            <p className="display-font text-lg">{product.name} {product.strength}</p>
            <p className="mt-1 text-xs leading-5 text-white/60">
              {commitment.quantity} boxes · {formatCurrency(commitment.quantity * commitment.unitPrice)} total
            </p>
          </div>
        </div>

        <div className="mt-5">
          <PaymentForm productId={productId} />
        </div>
      </div>
    </main>
  );
}
