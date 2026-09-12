import { listOrdersReadyForDelivery } from "@/lib/domain/supplier";
import { categorySwatch } from "@/app/medicines/presentation";
import { CapsuleIcon, PackageIcon } from "@/components/icons";
import { proceedToDeliveryAction } from "./actions";

export default async function SupplierPage() {
  const readyOrders = await listOrdersReadyForDelivery();

  return (
    <main className="min-h-screen bg-paper px-6 py-10 lg:px-10">
      <div className="mx-auto max-w-3xl">
        <header>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue">Supplier view</p>
          <h1 className="display-font mt-2 text-4xl text-navy">Orders ready for fulfilment</h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-slate">
            Each aggregate order below has reached its minimum order quantity and been paid for. The supplier ships
            one combined order — individual clinics are never identified.
          </p>
        </header>

        {readyOrders.length > 0 ? (
          <div className="mt-8 space-y-4">
            {readyOrders.map((summary) => (
              <div
                key={summary.groupBuyId}
                className="flex flex-col gap-4 rounded-2xl bg-white p-5 shadow-soft sm:flex-row sm:items-center"
              >
                <div
                  className={`flex h-20 w-20 shrink-0 items-center justify-center rounded-xl ${categorySwatch(summary.category)}`}
                >
                  <CapsuleIcon className="h-9 w-9 text-navy/30" />
                </div>

                <div className="flex-1">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-blue">{summary.category}</p>
                  <h2 className="display-font mt-1 text-lg text-navy">
                    {summary.productName} <span className="font-normal text-slate">{summary.productStrength}</span>
                  </h2>
                  <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs text-slate">
                    <span>MOQ: {summary.targetQuantity} boxes</span>
                    <span>{summary.doctorCount} doctors joined</span>
                    <span>{summary.readyOrderCount} order{summary.readyOrderCount === 1 ? "" : "s"} to ship</span>
                  </div>
                </div>

                <form action={proceedToDeliveryAction.bind(null, summary.groupBuyId)}>
                  <button
                    type="submit"
                    className="display-font inline-flex w-full items-center justify-center gap-1.5 rounded-full bg-navy px-5 py-2.5 text-sm text-white transition hover:bg-navy-2 sm:w-auto"
                  >
                    <PackageIcon className="h-4 w-4" aria-hidden="true" /> Proceed to delivery
                  </button>
                </form>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-8 rounded-2xl bg-white p-6 text-sm text-slate shadow-soft">
            No orders ready for fulfilment yet.
          </p>
        )}

        <p className="mt-8 text-[11px] text-slate">
          Prototype supplier view · simulated fulfilment only, no real delivery is dispatched.
        </p>
      </div>
    </main>
  );
}
