import { notFound, redirect } from "next/navigation";
import { getProductDetail } from "@/lib/domain/product";
import { getCurrentSession } from "@/lib/domain/session";
import { getClinicForSession } from "@/lib/domain/clinic";
import { getCommitmentForClinic } from "@/lib/domain/commitment";
import { getOrderForCommitment } from "@/lib/domain/order";
import { formatCurrency, formatDate } from "@/lib/format";
import { ChevronLeftIcon, PackageIcon, ArrowUpRightIcon } from "@/components/icons";
import { NavMenu } from "@/components/NavMenu";

interface OrderPageProps {
  params: Promise<{ productId: string }>;
}

const ORDER_STATUS_LABEL: Record<string, string> = {
  READY_FOR_FULFILMENT: "Ready for fulfilment",
  OUT_FOR_DELIVERY: "Out for delivery",
};

export default async function OrderStatusPage({ params }: OrderPageProps) {
  const { productId } = await params;
  const product = await getProductDetail(productId);
  if (!product || !product.groupBuy) notFound();

  const session = await getCurrentSession();
  if (!session) redirect(`/medicines/${productId}`);

  const clinic = await getClinicForSession(session.id);
  if (!clinic) redirect(`/medicines/${productId}`);

  const commitment = await getCommitmentForClinic(product.groupBuy.id, clinic.id);
  if (!commitment) redirect(`/medicines/${productId}`);

  const order = await getOrderForCommitment(commitment.id);
  if (!order) redirect(`/medicines/${productId}/pay`);

  const { groupBuy } = product;
  const total = commitment.quantity * commitment.unitPrice;

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
        <p className="display-font truncate text-sm">Order</p>
      </div>

      <div className="mx-auto max-w-lg p-4 md:p-6">
        <div className="rounded-2xl bg-navy p-6 text-center text-white shadow-soft sm:p-8">
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-sky text-navy">
            <PackageIcon className="h-6 w-6" aria-hidden="true" />
          </span>
          <p className="display-font mt-4 text-2xl">Group Buy Successful</p>
          <p className="mt-1 text-sm text-white/60">
            {groupBuy.currentQuantity} / {groupBuy.targetQuantity} boxes pooled
          </p>
        </div>

        <div className="mt-4 rounded-2xl bg-white p-5 shadow-soft sm:p-6">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-[0.1em] text-slate">Order status</p>
            <span className="rounded-full bg-sky px-3 py-1 text-xs font-semibold text-navy">
              {ORDER_STATUS_LABEL[order.status] ?? order.status}
            </span>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-slate">Your order</p>
              <p className="display-font mt-1 text-xl text-navy">{commitment.quantity} boxes</p>
            </div>
            <div>
              <p className="text-xs text-slate">Final price</p>
              <p className="display-font mt-1 text-xl text-navy">{formatCurrency(commitment.unitPrice)}</p>
            </div>
            <div>
              <p className="text-xs text-slate">Total</p>
              <p className="display-font mt-1 text-xl text-navy">{formatCurrency(total)}</p>
            </div>
            <div>
              <p className="text-xs text-slate">You saved</p>
              <p className="display-font mt-1 text-xl text-blue">{formatCurrency(commitment.estimatedSavings)}</p>
            </div>
          </div>

          <div className="mt-4 rounded-lg bg-paper px-4 py-3.5">
            <p className="text-xs text-slate">Estimated delivery</p>
            <p className="display-font mt-1 text-lg text-navy">
              {formatDate(order.estimatedDeliveryAt)} <span className="text-sm font-normal text-slate">(2–3 business days)</span>
            </p>
            <p className="mt-1 text-[11px] text-slate">Card ending {order.cardLast4} · Delivering to your registered clinic address</p>
          </div>

          <p className="mt-4 text-[11px] leading-5 text-slate">
            The supplier receives one aggregate order for the whole group — your clinic receives only the{" "}
            {commitment.quantity} boxes you committed to.
          </p>
        </div>

        <a
          href="/medicines"
          className="display-font mt-4 flex items-center justify-center gap-1.5 rounded-full bg-navy px-6 py-3 text-sm text-white transition hover:bg-navy-2"
        >
          Explore more products <ArrowUpRightIcon className="h-4 w-4" aria-hidden="true" />
        </a>

        <p className="mt-4 text-center text-[11px] text-slate">
          Simulated order — no real payment, delivery, or supplier fulfilment occurs.
        </p>
      </div>
    </main>
  );
}
