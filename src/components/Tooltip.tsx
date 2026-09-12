import type { ReactNode } from "react";

/**
 * A lightweight, CSS-only tooltip (hover + keyboard focus) for surfacing
 * secondary detail without a permanent line of text. The trigger should be
 * focusable (a button, link, or an element with tabIndex={0}).
 */
export function Tooltip({ label, children }: { label: string; children: ReactNode }) {
  return (
    <span className="group/tip relative inline-flex">
      {children}
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 w-max max-w-[15rem] -translate-x-1/2 rounded-lg bg-navy px-3 py-1.5 text-center text-xs font-medium leading-snug text-white opacity-0 shadow-soft transition duration-150 group-hover/tip:opacity-100 group-focus-within/tip:opacity-100"
      >
        {label}
      </span>
    </span>
  );
}
