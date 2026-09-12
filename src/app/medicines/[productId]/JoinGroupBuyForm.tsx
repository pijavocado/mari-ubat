"use client";

import { useActionState, useState } from "react";
import { formatCurrency } from "@/lib/format";
import { joinGroupBuyAction, type JoinGroupBuyState } from "./actions";

const initialState: JoinGroupBuyState = null;
const DEFAULT_QUANTITY = 10;

export function JoinGroupBuyForm({
  productId,
  groupPrice,
  individualPrice,
  maxQuantity,
}: {
  productId: string;
  groupPrice: number;
  individualPrice: number;
  maxQuantity: number;
}) {
  const boundAction = joinGroupBuyAction.bind(null, productId);
  const [state, formAction, isPending] = useActionState(boundAction, initialState);
  const [quantity, setQuantity] = useState(DEFAULT_QUANTITY);

  const safeQuantity = Number.isFinite(quantity) && quantity > 0 ? quantity : 0;
  const total = safeQuantity * groupPrice;
  const savings = safeQuantity * (individualPrice - groupPrice);

  return (
    <form action={formAction} className="mt-5 rounded-lg border border-navy/10 p-4">
      <label htmlFor="quantity" className="text-xs font-semibold uppercase tracking-[0.1em] text-slate">
        Boxes needed
      </label>
      <input
        id="quantity"
        name="quantity"
        type="number"
        inputMode="numeric"
        min={1}
        max={maxQuantity}
        step={1}
        value={quantity}
        onChange={(event) => setQuantity(Math.min(maxQuantity, Math.max(1, Math.round(Number(event.target.value) || 1))))}
        className="mt-2 w-full rounded-lg border border-navy/15 px-4 py-2.5 text-sm text-navy outline-none transition focus:border-blue focus:ring-4 focus:ring-blue/10"
      />

      <div className="mt-3 flex items-center justify-between rounded-lg bg-paper px-4 py-3 text-sm text-slate">
        <span>Estimated total</span>
        <span className="display-font text-navy">{formatCurrency(total)}</span>
      </div>
      <div className="mt-2 flex items-center justify-between rounded-lg bg-sky/40 px-4 py-3 text-sm text-navy">
        <span>Estimated savings</span>
        <span className="display-font text-blue">{formatCurrency(savings)}</span>
      </div>

      <label className="mt-3 flex items-start gap-2.5 text-xs leading-5 text-slate">
        <input
          type="checkbox"
          name="confirmSimulated"
          required
          className="mt-0.5 h-4 w-4 shrink-0 rounded border-navy/25 text-blue focus:ring-blue/30"
        />
        This is a simulated commitment — no real order or payment is made.
      </label>

      {state?.error ? (
        <p className="mt-3 rounded-lg border border-blue/25 bg-sky/50 px-3.5 py-2.5 text-sm font-semibold text-navy">
          {state.error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isPending}
        className="display-font mt-4 w-full rounded-full bg-navy px-6 py-3 text-sm text-white transition hover:bg-navy-2 disabled:opacity-60"
      >
        {isPending ? "Joining…" : "Join group buy"}
      </button>
    </form>
  );
}
