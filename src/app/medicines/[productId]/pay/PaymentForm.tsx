"use client";

import { useActionState, useState } from "react";
import { submitPaymentAction, type PaymentFormState } from "./actions";

const initialState: PaymentFormState = null;
const inputClass =
  "mt-2 w-full rounded-xl border border-navy/15 px-4 py-3 text-sm text-navy outline-none transition focus:border-blue focus:ring-4 focus:ring-blue/10";
const labelClass = "text-xs font-semibold uppercase tracking-[0.12em] text-blue";

export function PaymentForm({ productId }: { productId: string }) {
  const boundAction = submitPaymentAction.bind(null, productId);
  const [state, formAction, isPending] = useActionState(boundAction, initialState);
  const [billingAddress, setBillingAddress] = useState("");
  const [mailingAddress, setMailingAddress] = useState("");
  const [sameAsBilling, setSameAsBilling] = useState(true);

  return (
    <form action={formAction} className="space-y-6">
      <section className="rounded-2xl bg-white p-5 shadow-soft sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.1em] text-slate">Payment details</p>
        <p className="mt-1 text-[11px] text-slate">Simulated — no real card is charged.</p>

        <div className="mt-4">
          <label className={labelClass} htmlFor="cardNumber">Card number</label>
          <input
            id="cardNumber"
            name="cardNumber"
            required
            inputMode="numeric"
            maxLength={19}
            placeholder="4242 4242 4242 4242"
            className={inputClass}
          />
        </div>
        <div className="mt-4 grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass} htmlFor="expiry">Expiry</label>
            <input id="expiry" name="expiry" required placeholder="MM/YY" maxLength={5} className={inputClass} />
          </div>
          <div>
            <label className={labelClass} htmlFor="cvc">CVC</label>
            <input id="cvc" name="cvc" required inputMode="numeric" maxLength={4} placeholder="123" className={inputClass} />
          </div>
        </div>
      </section>

      <section className="rounded-2xl bg-white p-5 shadow-soft sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.1em] text-slate">Billing info</p>
        <div className="mt-4">
          <label className={labelClass} htmlFor="billingName">Billing name</label>
          <input id="billingName" name="billingName" required placeholder="Harbour Family Clinic" className={inputClass} />
        </div>
        <div className="mt-4">
          <label className={labelClass} htmlFor="billingAddress">Billing address</label>
          <textarea
            id="billingAddress"
            name="billingAddress"
            required
            rows={2}
            placeholder="Street, city, postcode"
            value={billingAddress}
            onChange={(event) => {
              setBillingAddress(event.target.value);
              if (sameAsBilling) setMailingAddress(event.target.value);
            }}
            className={`${inputClass} resize-none`}
          />
        </div>
      </section>

      <section className="rounded-2xl bg-white p-5 shadow-soft sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.1em] text-slate">Mailing details</p>
        <label className="mt-3 flex items-center gap-2.5 text-sm text-slate">
          <input
            type="checkbox"
            checked={sameAsBilling}
            onChange={(event) => {
              setSameAsBilling(event.target.checked);
              if (event.target.checked) setMailingAddress(billingAddress);
            }}
            className="h-4 w-4 rounded border-navy/25 text-blue focus:ring-blue/30"
          />
          Same as billing address
        </label>
        {!sameAsBilling && (
          <div className="mt-3">
            <label className={labelClass} htmlFor="mailingAddress">Delivery address</label>
            <textarea
              id="mailingAddress"
              name="mailingAddress"
              required
              rows={2}
              placeholder="Street, city, postcode"
              value={mailingAddress}
              onChange={(event) => setMailingAddress(event.target.value)}
              className={`${inputClass} resize-none`}
            />
          </div>
        )}
        {sameAsBilling && <input type="hidden" name="mailingAddress" value={billingAddress} />}
      </section>

      <label className="flex items-start gap-3 text-xs leading-5 text-slate">
        <input type="checkbox" name="confirmSimulated" required className="mt-0.5 h-4 w-4 shrink-0 rounded border-navy/25 text-blue focus:ring-blue/30" />
        This is a simulated payment — no real transaction is processed.
      </label>

      {state?.error ? (
        <p className="rounded-lg border border-blue/25 bg-sky/50 px-3.5 py-2.5 text-sm font-semibold text-navy">
          {state.error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isPending}
        className="display-font w-full rounded-full bg-navy px-6 py-3.5 text-sm text-white transition hover:bg-navy-2 disabled:opacity-60"
      >
        {isPending ? "Processing…" : "Pay now"}
      </button>
    </form>
  );
}
