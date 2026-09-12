import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/domain/session";
import { getClinicForSession } from "@/lib/domain/clinic";
import { ChevronLeftIcon } from "@/components/icons";
import { NavMenu } from "@/components/NavMenu";
import { RegisterForm } from "./RegisterForm";

export default async function RegisterPage() {
  const session = await getCurrentSession();
  if (session) {
    const clinic = await getClinicForSession(session.id);
    if (clinic) redirect("/dashboard");
  }

  return (
    <main className="grid min-h-screen place-items-center bg-paper px-6 py-16">
      <div className="fixed left-4 top-4 z-10">
        <NavMenu />
      </div>

      <section className="w-full max-w-lg rounded-3xl bg-white p-8 shadow-soft sm:p-10">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue">Step 1 of 1</p>
        <h1 className="display-font mt-4 text-4xl text-navy">Register your clinic</h1>
        <p className="mt-3 leading-7 text-slate">No password or documents needed — verification is simulated.</p>

        <RegisterForm />

        <a href="/" className="mt-6 inline-flex items-center gap-1 text-sm font-semibold text-blue transition hover:text-navy">
          <ChevronLeftIcon className="h-4 w-4" aria-hidden="true" /> Back to home
        </a>
      </section>
    </main>
  );
}
