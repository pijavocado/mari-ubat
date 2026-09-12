import { notFound, redirect } from "next/navigation";
import { getProductDetail } from "@/lib/domain/product";
import { getCurrentSession } from "@/lib/domain/session";
import { getClinicForSession } from "@/lib/domain/clinic";
import { getCommitmentForClinic } from "@/lib/domain/commitment";
import { calculateRecoveryRisk } from "@/lib/domain/recovery";
import { getOrderForCommitment } from "@/lib/domain/order";
import { formatCurrency } from "@/lib/format";
import { ChevronLeftIcon, SparkleIcon, ArrowUpRightIcon, CreditCardIcon, PackageIcon } from "@/components/icons";
import { CountdownTimer } from "@/components/CountdownTimer";
import { NavMenu } from "@/components/NavMenu";

interface TrackPageProps {
  params: Promise<{ productId: string }>;
}

export default async function GroupBuyTrackingPage({ params }: TrackPageProps) {
  const { productId } = await params;
  const product = await getProductDetail(productId);
  if (!product || !product.groupBuy) notFound();

  const session = await getCurrentSession();
  if (!session) redirect(`/medicines/${productId}`);

  const clinic = await getClinicForSession(session.id);
  if (!clinic) redirect(`/medicines/${productId}`);

  const commitment = await getCommitmentForClinic(product.groupBuy.id, clinic.id);
  if (!commitment) redirect(`/medicines/${productId}`);

  const { groupBuy } = product;
  const progressPercent = Math.min(100, Math.round((groupBuy.currentQuantity / groupBuy.targetQuantity) * 100));
  const moqMet = groupBuy.status === "MOQ_REACHED" || groupBuy.status === "READY_FOR_FULFILMENT";
  const isExpired = groupBuy.status === "EXPIRED";

  const statusMessage = moqMet
    ? "Bulk price unlocked — MOQ reached!"
    : isExpired
      ? "This group buy expired before reaching its target."
      : `${groupBuy.remainingQuantity} more boxes needed`;

  const badgeLabel = moqMet ? "MOQ reached" : isExpired ? "Expired" : "Waiting for MOQ";
  const badgeClass = moqMet ? "bg-sky text-navy" : isExpired ? "bg-white/10 text-white/60" : "bg-white/10 text-white";

  const risk = !moqMet && !isExpired ? await calculateRecoveryRisk(groupBuy.id, clinic.id) : null;
  const order = moqMet ? await getOrderForCommitment(commitment.id) : null;

  return (
    <main className="min-h-screen bg-paper pb-10">
      <div className="sticky top-0 z-10 flex items-center gap-3 bg-navy px-4 py-3.5 text-white">
        <NavMenu variant="dark" groupBuyHref={`/medicines/${productId}/track`} orderHref={`/medicines/${productId}/order`} />
        <a
          href={`/medicines/${productId}`}
          aria-label="Back to product"
          className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-white/70 transition hover:bg-white/10 hover:text-white"
        >
          <ChevronLeftIcon className="h-5 w-5" />
        </a>
        <p className="display-font truncate text-sm">{product.name}</p>
      </div>

      <div className="mx-auto max-w-2xl p-4 md:p-6">
        <div className="rounded-2xl bg-navy p-6 text-white shadow-soft sm:p-8">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky/80">{product.category}</p>
              <h1 className="display-font mt-2 text-2xl">
                {product.name} <span className="font-normal text-white/60">{product.strength}</span>
              </h1>
            </div>
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${badgeClass}`}>{badgeLabel}</span>
          </div>

          <p className="display-font mt-6 text-5xl tracking-tight">
            {groupBuy.currentQuantity}
            <span className="text-2xl text-white/50"> / {groupBuy.targetQuantity} boxes</span>
          </p>
          <div className="mt-4 h-3 overflow-hidden rounded-full bg-white/10">
            <div className="h-full animate-fill-bar rounded-full bg-sky" style={{ width: `${progressPercent}%` }} />
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm text-white/70">
            <span>{statusMessage}</span>
            <CountdownTimer deadlineAt={groupBuy.deadlineAt} />
          </div>
          <p className="mt-2 text-xs text-white/50">
            {groupBuy.anonymousClinicCount} anonymous clinics · no clinic identities are shown
          </p>
        </div>

        {moqMet && (
          <a
            href={order ? `/medicines/${productId}/order` : `/medicines/${productId}/pay`}
            className="display-font mt-4 flex items-center justify-center gap-2 rounded-full bg-navy px-6 py-3.5 text-sm text-white shadow-soft transition hover:bg-navy-2"
          >
            {order ? (
              <>
                <PackageIcon className="h-4 w-4" aria-hidden="true" /> Track order
              </>
            ) : (
              <>
                <CreditCardIcon className="h-4 w-4" aria-hidden="true" /> Pay now
              </>
            )}
          </a>
        )}

        <div className="mt-4 rounded-2xl bg-white p-5 shadow-soft sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-slate">Your commitment</p>
          <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div>
              <p className="text-xs text-slate">Your order</p>
              <p className="display-font mt-1 text-xl text-navy">{commitment.quantity} boxes</p>
            </div>
            <div>
              <p className="text-xs text-slate">Price locked</p>
              <p className="display-font mt-1 text-xl text-navy">{formatCurrency(commitment.unitPrice)}</p>
            </div>
            <div>
              <p className="text-xs text-slate">Total</p>
              <p className="display-font mt-1 text-xl text-navy">{formatCurrency(commitment.quantity * commitment.unitPrice)}</p>
            </div>
            <div>
              <p className="text-xs text-slate">You saved</p>
              <p className="display-font mt-1 text-xl text-blue">{formatCurrency(commitment.estimatedSavings)}</p>
            </div>
          </div>
        </div>

        <a
          href={`/medicines/${productId}/recovery`}
          className="mt-4 flex items-start gap-3 rounded-2xl bg-white p-4 shadow-soft transition hover:-translate-y-0.5"
        >
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-sky text-navy">
            <SparkleIcon className="h-4 w-4" aria-hidden="true" />
          </span>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-navy">AI Procurement Assistant</p>
              {risk && (
                <span className="rounded-full bg-sky px-2 py-0.5 text-[10px] font-semibold text-navy">
                  {risk.riskPercent}% {risk.riskLabel === "AT_RISK" ? "at risk" : risk.riskLabel.toLowerCase()}
                </span>
              )}
            </div>
            <p className="mt-1 text-xs leading-5 text-slate">
              {risk
                ? "See the explainable risk assessment and recommended recovery action."
                : "Explainable demand-recovery risk assessment and recommendation."}
            </p>
          </div>
          <ArrowUpRightIcon className="mt-1 h-4 w-4 shrink-0 text-slate" aria-hidden="true" />
        </a>
      </div>
    </main>
  );
}
