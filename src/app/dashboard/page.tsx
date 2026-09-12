import { redirect } from "next/navigation";
import Image from "next/image";
import { listProducts } from "@/lib/domain/product";
import { getCurrentSession } from "@/lib/domain/session";
import { getClinicForSession } from "@/lib/domain/clinic";
import { ArrowUpRightIcon, ChartIcon, BellIcon } from "@/components/icons";
import { Tooltip } from "@/components/Tooltip";
import { NavMenu } from "@/components/NavMenu";
import { listPendingNotifications } from "@/lib/domain/notification";
import { resetDemoSessionAction } from "./actions";

// Example dashboard values from docs/PLAN.md — will become real calculations
// once commitments (v0.4) and AI recovery (v0.6) land.
const stats = [
  { label: "Active group buys", value: "1" },
  { label: "Potential savings", value: "RM60" },
  { label: "Upcoming purchase value", value: "RM360" },
  { label: "AI recommendations", value: "1" },
];

const STATUS_LABEL: Record<string, string> = {
  OPEN: "Open",
  AT_RISK: "At risk",
  MOQ_REACHED: "MOQ reached",
  READY_FOR_FULFILMENT: "MOQ reached",
  EXPIRED: "Expired",
};

export default async function DashboardPage() {
  const session = await getCurrentSession();
  if (!session) redirect("/register");

  const clinic = await getClinicForSession(session.id);
  if (!clinic) redirect("/register");

  const [featured] = await listProducts({ search: "Amoxicillin" });
  const groupBuy = featured?.groupBuy ?? null;
  const pendingNotifications = await listPendingNotifications(clinic.id);

  const progressPercent = groupBuy
    ? Math.min(100, Math.round((groupBuy.currentQuantity / groupBuy.targetQuantity) * 100))
    : 0;

  return (
    <main className="min-h-screen bg-paper px-6 py-10 lg:px-10">
      <div className="mx-auto max-w-5xl">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <NavMenu
              groupBuyHref={featured ? `/medicines/${featured.id}/track` : undefined}
              orderHref={featured ? `/medicines/${featured.id}/order` : undefined}
            />
            <Image src="/images/logo.png" alt="Mari Ubat" width={40} height={40} className="shrink-0 rounded-xl" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue">Welcome</p>
              <h1 className="display-font mt-2 text-4xl text-navy">{clinic.name}</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Tooltip label="Verification is simulated for this prototype">
              <span
                tabIndex={0}
                className="inline-flex cursor-help items-center gap-2 rounded-full bg-sky px-4 py-2 text-xs font-semibold uppercase tracking-[0.1em] text-navy"
              >
                <span className="h-2 w-2 rounded-full bg-blue" /> Verified
              </span>
            </Tooltip>
            <form action={resetDemoSessionAction}>
              <button
                type="submit"
                className="rounded-full border border-navy/15 px-4 py-2 text-xs font-semibold text-slate transition hover:border-navy/30 hover:text-navy"
              >
                Reset demo
              </button>
            </form>
          </div>
        </header>

        {pendingNotifications.length > 0 && (
          <a
            href="/inbox"
            className="mt-8 flex items-center gap-3 rounded-2xl bg-sky/50 p-4 shadow-soft transition hover:-translate-y-0.5"
          >
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-navy text-white">
              <BellIcon className="h-4 w-4" aria-hidden="true" />
            </span>
            <p className="flex-1 text-sm font-semibold text-navy">
              {pendingNotifications.length} new alert{pendingNotifications.length === 1 ? "" : "s"} in your inbox
            </p>
            <ArrowUpRightIcon className="h-4 w-4 shrink-0 text-navy" aria-hidden="true" />
          </a>
        )}

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="rounded-2xl bg-white p-5 shadow-soft">
              <p className="text-xs font-semibold uppercase tracking-[0.1em] text-slate">{stat.label}</p>
              <p className="display-font mt-3 text-2xl text-navy">{stat.value}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-lg font-semibold text-navy">Active group buy</h2>
          <div className="flex flex-wrap items-center gap-3">
            {featured && groupBuy && (
              <a
                href={`/medicines/${featured.id}/track`}
                className="display-font inline-flex items-center gap-1.5 rounded-full bg-navy px-5 py-2.5 text-sm text-white transition hover:bg-navy-2"
              >
                <ChartIcon className="h-3.5 w-3.5" aria-hidden="true" /> View group progress
              </a>
            )}
            <a
              href="/medicines"
              className="display-font inline-flex items-center gap-1.5 rounded-full border border-navy/15 px-5 py-2.5 text-sm text-navy transition hover:border-navy/30 hover:bg-navy/5"
            >
              Browse medicines <ArrowUpRightIcon className="h-3.5 w-3.5" aria-hidden="true" />
            </a>
          </div>
        </div>

        {featured && groupBuy ? (
          <a
            href={`/medicines/${featured.id}`}
            className="mt-4 block rounded-3xl bg-navy p-6 text-white shadow-soft transition hover:-translate-y-0.5 sm:p-8"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky/80">{featured.category}</p>
                <h3 className="display-font mt-2 text-2xl">
                  {featured.name} <span className="font-normal text-white/60">{featured.strength}</span>
                </h3>
              </div>
              <span className="rounded-full bg-sky px-3 py-1 text-xs font-semibold text-navy">
                {STATUS_LABEL[groupBuy.status] ?? groupBuy.status}
              </span>
            </div>
            <div className="mt-6 flex items-end justify-between">
              <p className="display-font text-4xl tracking-tight">
                {groupBuy.currentQuantity}
                <span className="text-xl text-white/50"> / {groupBuy.targetQuantity} boxes</span>
              </p>
              <p className="text-sm text-white/60">{groupBuy.anonymousClinicCount} anonymous clinics</p>
            </div>
            <div className="mt-4 h-3 overflow-hidden rounded-full bg-white/10">
              <div className="h-full animate-fill-bar rounded-full bg-sky" style={{ width: `${progressPercent}%` }} />
            </div>
          </a>
        ) : (
          <p className="mt-4 rounded-3xl bg-white p-6 text-sm text-slate shadow-soft">
            No active group buys yet — run <code>npm run db:seed</code> to load demo data.
          </p>
        )}

        <p className="mt-10 text-xs text-slate">Purchasing and clinic identities are simulated in this prototype.</p>
      </div>
    </main>
  );
}
