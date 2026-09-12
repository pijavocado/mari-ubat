import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/domain/session";
import { getClinicForSession } from "@/lib/domain/clinic";
import { listProducts } from "@/lib/domain/product";
import { getCommitmentForClinic } from "@/lib/domain/commitment";
import { isAcceptingCommitments } from "@/lib/domain/groupBuy";
import { ensureLowStockNotification, listPendingNotifications } from "@/lib/domain/notification";
import { BellIcon } from "@/components/icons";
import { NavMenu } from "@/components/NavMenu";
import { dismissNotificationAction, bringMeThereAction } from "./actions";

const NOTIFICATION_HEADING: Record<string, string> = {
  MOQ_REACHED: "MOQ reached",
  LOW_STOCK: "Possible low stock",
};

function destinationFor(notification: { type: string; productId: string }): string {
  return notification.type === "MOQ_REACHED"
    ? `/medicines/${notification.productId}/track`
    : `/medicines/${notification.productId}`;
}

export default async function InboxPage() {
  const session = await getCurrentSession();
  if (!session) redirect("/register");

  const clinic = await getClinicForSession(session.id);
  if (!clinic) redirect("/register");

  // Auto-generate the clinic's own reminder for any open group buy it
  // hasn't joined yet — idempotent, so revisiting the inbox never spams it.
  const products = await listProducts();
  for (const product of products) {
    if (!product.groupBuy || !isAcceptingCommitments(product.groupBuy.status)) continue;
    const commitment = await getCommitmentForClinic(product.groupBuy.id, clinic.id);
    if (commitment) continue;

    await ensureLowStockNotification({
      clinicId: clinic.id,
      groupBuyId: product.groupBuy.id,
      productName: product.name,
      productStrength: product.strength,
      remainingQuantity: product.groupBuy.remainingQuantity,
    });
  }

  const pending = await listPendingNotifications(clinic.id);

  return (
    <main className="min-h-screen bg-paper px-6 py-10 lg:px-10">
      <div className="mx-auto max-w-2xl">
        <header className="flex items-center gap-3">
          <NavMenu />
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue">Notifications</p>
            <h1 className="display-font mt-2 text-4xl text-navy">Inbox</h1>
          </div>
        </header>

        {pending.length > 0 ? (
          <div className="mt-8 space-y-3">
            {pending.map((notification) => (
              <div key={notification.id} className="flex items-start gap-3 rounded-2xl bg-white p-5 shadow-soft">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-sky text-navy">
                  <BellIcon className="h-4 w-4" aria-hidden="true" />
                </span>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-navy">
                    {NOTIFICATION_HEADING[notification.type] ?? "Notification"} — {notification.productName}{" "}
                    {notification.productStrength}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-slate">{notification.message}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <form action={bringMeThereAction.bind(null, notification.id, destinationFor(notification))}>
                      <button
                        type="submit"
                        className="display-font rounded-full bg-navy px-4 py-2 text-xs text-white transition hover:bg-navy-2"
                      >
                        Bring me there
                      </button>
                    </form>
                    <form action={dismissNotificationAction.bind(null, notification.id)}>
                      <button
                        type="submit"
                        className="rounded-full border border-navy/15 px-4 py-2 text-xs font-semibold text-slate transition hover:border-navy/30 hover:text-navy"
                      >
                        No, thank you
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-8 rounded-2xl bg-white p-6 text-sm text-slate shadow-soft">
            Nothing here right now — we&apos;ll let you know if your stock might be running low on something, or
            once a group buy you&apos;ve joined reaches its MOQ.
          </p>
        )}
      </div>
    </main>
  );
}
