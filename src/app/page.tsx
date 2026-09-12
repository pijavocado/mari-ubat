import Image from "next/image";
import { ArrowUpRightIcon, SparkleIcon } from "@/components/icons";

const benefits = [
  {
    number: "01",
    title: "Lower group pricing",
    text: "Pool independent clinic demand to unlock a better price per box.",
  },
  {
    number: "02",
    title: "No bulk inventory",
    text: "Commit only to the quantity your clinic already needs.",
  },
  {
    number: "03",
    title: "Anonymous by default",
    text: "See the group’s momentum without exposing other clinics’ identities.",
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen overflow-hidden bg-paper">
      <header className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-6 lg:px-10">
        <a href="/" className="flex items-center gap-3" aria-label="Mari Ubat home">
          <Image src="/images/logo.png" alt="" width={40} height={40} className="rounded-2xl" />
          <span className="display-font text-sm tracking-[0.16em] text-navy">MARI UBAT</span>
        </a>
        <div className="flex items-center gap-4 text-sm font-semibold text-blue">
          <a className="hidden transition hover:text-navy sm:block" href="#how-it-works">How it works</a>
          <a className="transition hover:text-navy" href="/dashboard">Log in</a>
          <a
            className="display-font rounded-full border border-blue/25 px-4 py-2 text-blue transition hover:border-blue hover:bg-white"
            href="/register"
          >
            Register
          </a>
        </div>
      </header>

      <section className="mx-auto grid w-full max-w-7xl gap-14 px-6 pb-20 pt-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:px-10 lg:pb-28 lg:pt-24">
        <div>
          <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-blue/20 bg-sky/60 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.15em] text-blue">
            <span className="h-2 w-2 rounded-full bg-blue" /> Prototype demo
          </div>
          <h1 className="display-font max-w-3xl text-6xl leading-[1.03] text-navy sm:text-7xl lg:text-[5.5rem]">
            Bulk-buying power without bulk-buying the inventory.
          </h1>
          <p className="mt-8 max-w-xl text-lg leading-8 text-slate">
            Pool demand with other clinics, unlock better pricing, and commit only to what you need.
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-4">
            <a
              href="/register"
              className="display-font inline-flex items-center gap-1.5 rounded-full bg-navy px-6 py-3.5 text-sm text-white shadow-soft transition hover:-translate-y-0.5 hover:bg-navy-2"
            >
              Register <ArrowUpRightIcon className="h-4 w-4" aria-hidden="true" />
            </a>
            <a
              href="/dashboard"
              className="rounded-full border border-navy/15 px-5 py-3.5 text-sm font-semibold text-navy transition hover:border-navy/30 hover:bg-white"
            >
              Log in
            </a>
          </div>
          <p className="mt-6 text-xs leading-5 text-slate">Fictional data only · No real orders, payments, or patient records</p>
        </div>

        <div className="relative mx-auto w-full max-w-xl">
          <div className="relative rounded-[2rem] bg-navy p-5 shadow-soft sm:p-7">
            <div className="flex items-start justify-between border-b border-white/10 pb-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky/80">Live group buy</p>
                <h2 className="display-font mt-2 text-2xl text-white">Amoxicillin <span className="font-normal text-white/60">500mg</span></h2>
              </div>
              <span className="rounded-full bg-sky px-3 py-1 text-xs font-semibold text-navy">At risk</span>
            </div>
            <div className="py-8">
              <div className="flex items-end justify-between">
                <div>
                  <p className="display-font text-5xl tracking-tight text-white">82<span className="text-2xl text-white/45"> / 100</span></p>
                  <p className="mt-2 text-sm text-white/60">boxes pooled · 12 anonymous clinics</p>
                </div>
                <p className="text-right text-sm text-white/60">3h 28m<br /><span className="text-xs">remaining</span></p>
              </div>
              <div className="mt-6 h-3 overflow-hidden rounded-full bg-white/10">
                <div className="h-full w-[82%] rounded-full bg-sky" />
              </div>
              <div className="mt-3 flex justify-between text-xs font-semibold text-white/50"><span>RM36 group price</span><span>18 boxes to go</span></div>
            </div>
            <div className="rounded-2xl bg-white/10 p-4">
              <div className="flex items-start gap-3">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-sky text-navy">
                  <SparkleIcon className="h-4 w-4" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-white">AI demand recovery</p>
                  <p className="mt-1 text-sm leading-6 text-white/60">3 clinics may be due to reorder soon.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="border-t border-navy/10 bg-paper">
        <div className="mx-auto max-w-7xl px-6 py-20 lg:px-10 lg:py-24">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue">A more practical kind of group buying</p>
            <h2 className="display-font mt-4 text-4xl leading-tight text-navy sm:text-5xl">Small commitments. Shared momentum.</h2>
          </div>
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {benefits.map((benefit) => (
              <article key={benefit.number} className="rounded-3xl border border-navy/10 bg-white p-7 shadow-soft transition hover:border-blue/30">
                <p className="display-font text-3xl text-blue">{benefit.number}</p>
                <h3 className="mt-8 text-xl font-semibold text-navy">{benefit.title}</h3>
                <p className="mt-3 leading-7 text-slate">{benefit.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <footer className="mx-auto flex max-w-7xl flex-col gap-3 px-6 py-8 text-xs text-slate sm:flex-row sm:items-center sm:justify-between lg:px-10">
        <span>© 2026 Mari Ubat prototype</span>
        <span>Built for demonstration purposes only</span>
      </footer>
    </main>
  );
}
