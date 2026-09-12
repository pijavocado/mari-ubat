"use client";

import { useActionState } from "react";
import { submitClinicRegistration, type RegisterFormState } from "./actions";

const initialState: RegisterFormState = null;

export function RegisterForm() {
  const [state, formAction, isPending] = useActionState(submitClinicRegistration, initialState);

  return (
    <form action={formAction} className="mt-8 space-y-5 text-left">
      <div>
        <label className="text-xs font-semibold uppercase tracking-[0.12em] text-blue" htmlFor="name">
          Clinic name
        </label>
        <input
          id="name"
          name="name"
          required
          className="mt-2 w-full rounded-xl border border-navy/15 px-4 py-3 text-sm text-navy outline-none transition focus:border-blue focus:ring-4 focus:ring-blue/10"
          placeholder="Harbour Family Clinic"
        />
      </div>
      <div>
        <label className="text-xs font-semibold uppercase tracking-[0.12em] text-blue" htmlFor="registrationNumber">
          Clinic registration number
        </label>
        <input
          id="registrationNumber"
          name="registrationNumber"
          required
          className="mt-2 w-full rounded-xl border border-navy/15 px-4 py-3 text-sm text-navy outline-none transition focus:border-blue focus:ring-4 focus:ring-blue/10"
          placeholder="DEMO-000123"
        />
      </div>
      <div>
        <label className="text-xs font-semibold uppercase tracking-[0.12em] text-blue" htmlFor="contactName">
          Primary contact name
        </label>
        <input
          id="contactName"
          name="contactName"
          required
          className="mt-2 w-full rounded-xl border border-navy/15 px-4 py-3 text-sm text-navy outline-none transition focus:border-blue focus:ring-4 focus:ring-blue/10"
          placeholder="Dr. Alex Tan"
        />
      </div>

      <div className="space-y-3 pt-1">
        <label className="flex items-start gap-3 text-sm leading-6 text-slate">
          <input type="checkbox" name="credentialConfirmed" className="mt-1 h-4 w-4 rounded border-navy/25 text-blue focus:ring-blue/30" />
          I hold a valid professional credential.
        </label>
        <label className="flex items-start gap-3 text-sm leading-6 text-slate">
          <input type="checkbox" name="demoAcknowledged" className="mt-1 h-4 w-4 rounded border-navy/25 text-blue focus:ring-blue/30" />
          This is a demo — verification is simulated.
        </label>
      </div>

      {state?.error ? (
        <p className="rounded-lg border border-blue/25 bg-sky/50 px-3.5 py-2.5 text-sm font-semibold text-navy">
          {state.error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isPending}
        className="display-font w-full rounded-full bg-navy px-5 py-3.5 text-sm text-white transition hover:bg-navy-2 disabled:opacity-60"
      >
        {isPending ? "Verifying…" : "Register clinic"}
      </button>
    </form>
  );
}
