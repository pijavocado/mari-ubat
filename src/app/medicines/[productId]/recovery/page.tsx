import { notFound, redirect } from "next/navigation";
import { getProductDetail } from "@/lib/domain/product";
import { getCurrentSession } from "@/lib/domain/session";
import { getClinicForSession } from "@/lib/domain/clinic";
import { getCommitmentForClinic } from "@/lib/domain/commitment";
import { calculateRecoveryRisk, getEligibleReorderClinics, getRecoveryEvent } from "@/lib/domain/recovery";
import { ChevronLeftIcon, SparkleIcon } from "@/components/icons";
import { NavMenu } from "@/components/NavMenu";
import { notifyOnMoqReachedAction } from "./actions";

interface RecoveryPageProps {
  params: Promise<{ productId: string }>;
}

const RISK_LABEL_TEXT: Record<string, string> = {
  LOW: "Low risk",
  MEDIUM: "Medium risk",
  AT_RISK: "At risk",
};

export default async function RecoveryPage({ params }: RecoveryPageProps) {
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
  const moqMet = groupBuy.status === "MOQ_REACHED" || groupBuy.status === "READY_FOR_FULFILMENT";
  const isExpired = groupBuy.status === "EXPIRED";

  const [risk, eligible, existingEvent] = await Promise.all([
    calculateRecoveryRisk(groupBuy.id, clinic.id),
    getEligibleReorderClinics(groupBuy.id),
    getRecoveryEvent(groupBuy.id),
  ]);

  const boundNotify = notifyOnMoqReachedAction.bind(null, productId);

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
        <p className="display-font truncate text-sm">AI Procurement Assistant</p>
      </div>

      <div className="mx-auto max-w-2xl p-4 md:p-6">
        <div className="flex items-start gap-3 rounded-2xl bg-navy p-5 text-white shadow-soft sm:p-6">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-sky text-navy">
            <SparkleIcon className="h-4 w-4" aria-hidden="true" />
          </span>
          <div>
            <p className="display-font text-lg">AI Procurement Assistant</p>
            <p className="mt-1 text-xs leading-5 text-white/60">
              Deterministic, rule-based estimate from this group's own data — not an external forecasting model.
            </p>
          </div>
        </div>

        {isExpired ? (
          <p className="mt-4 rounded-2xl bg-white p-5 text-sm text-slate shadow-soft">
            This group buy has expired — there&apos;s nothing left to recover.
          </p>
        ) : moqMet ? (
          <p className="mt-4 rounded-2xl bg-white p-5 text-sm text-slate shadow-soft">
            This group already reached its target quantity — no recovery needed.{" "}
            <a href={`/medicines/${productId}/track`} className="font-semibold text-blue hover:text-blue-dark">
              View group progress
            </a>
            .
          </p>
        ) : risk && eligible ? (
          <>
            <div className="mt-4 rounded-2xl bg-white p-5 shadow-soft sm:p-6">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-[0.1em] text-slate">Risk assessment</p>
                <span className="rounded-full bg-sky px-3 py-1 text-xs font-semibold text-navy">
                  {risk.riskPercent}% · {RISK_LABEL_TEXT[risk.riskLabel]}
                </span>
              </div>
              <p className="mt-3 text-sm leading-6 text-navy">
                This group buy is {risk.riskLabel === "AT_RISK" ? "at risk" : "being monitored"} because the remaining
                quantity is high relative to the time left, while recent group demand has slowed.
              </p>

              <details className="mt-4 rounded-lg border border-navy/10">
                <summary className="cursor-pointer list-none px-4 py-2.5 text-xs font-semibold text-blue [&::-webkit-details-marker]:hidden">
                  Why this recommendation?
                </summary>
                <div className="border-t border-navy/10 px-4 py-3 text-xs leading-6 text-slate">
                  <p>Current group shortfall: {risk.inputs.remainingQuantity} of {risk.inputs.targetQuantity} boxes</p>
                  <p>Remaining time: {risk.inputs.hoursRemaining.toFixed(1)} hours</p>
                  <p>
                    Recent group-buy momentum: {risk.inputs.unitsAddedRecently} boxes added in the last 6 hours (target{" "}
                    {risk.inputs.momentumTarget})
                  </p>
                </div>
              </details>
            </div>

            <div className="mt-4 rounded-2xl bg-white p-5 shadow-soft sm:p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.1em] text-slate">Recommendation</p>
              <p className="mt-3 text-sm leading-6 text-navy">
                {eligible.eligibleClinicCount} verified clinics may be approaching their usual reorder period for
                this medicine. Their historical purchasing patterns suggest up to {eligible.potentialRecoveredQuantity}{" "}
                additional boxes of potential demand.
              </p>

              {eligible.eligibleClinics.length > 0 && (
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full min-w-[24rem] text-left text-xs">
                    <thead>
                      <tr className="text-slate">
                        <th className="pb-2 font-semibold">Usual order</th>
                        <th className="pb-2 font-semibold">Reorder interval</th>
                        <th className="pb-2 font-semibold">Last ordered</th>
                      </tr>
                    </thead>
                    <tbody className="text-navy">
                      {eligible.eligibleClinics.map((c, index) => (
                        <tr key={index} className="border-t border-navy/10">
                          <td className="py-2">{c.usualQuantity} boxes</td>
                          <td className="py-2">every {c.averageReorderIntervalDays} days</td>
                          <td className="py-2">{c.daysSinceLastPurchase} days ago</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <p className="mt-2 text-[11px] text-slate">No clinic identities are shown.</p>
                </div>
              )}
            </div>

            <div className="mt-4 rounded-2xl border border-dashed border-navy/15 p-5">
              {existingEvent ? (
                <p className="text-sm font-semibold text-navy">
                  We&apos;ve already let you know —{" "}
                  <a href="/inbox" className="text-blue hover:text-blue-dark">
                    check your inbox
                  </a>
                  .
                </p>
              ) : (
                <form action={boundNotify}>
                  <button
                    type="submit"
                    className="display-font w-full rounded-full bg-navy px-6 py-3 text-sm text-white transition hover:bg-navy-2"
                  >
                    Notify me when MOQ is reached
                  </button>
                  <p className="mt-2 text-center text-[11px] text-slate">
                    Demo behavior only — simulates other clinics responding, then alerts you in your inbox.
                  </p>
                </form>
              )}
            </div>
          </>
        ) : null}
      </div>
    </main>
  );
}
