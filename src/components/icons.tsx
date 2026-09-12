import type { SVGProps } from "react";

/**
 * A small, consistent line-icon set for the prototype — same stroke weight,
 * rounded joins, and 24×24 grid throughout, so nothing reads as a mismatched
 * emoji dropped into an otherwise custom-drawn interface.
 */
type IconProps = SVGProps<SVGSVGElement>;

const strokeProps = {
  viewBox: "0 0 24 24",
  fill: "none" as const,
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function ChevronLeftIcon(props: IconProps) {
  return (
    <svg {...strokeProps} {...props}>
      <path d="M15 5l-7 7 7 7" />
    </svg>
  );
}

export function ArrowUpRightIcon(props: IconProps) {
  return (
    <svg {...strokeProps} {...props}>
      <path d="M7 17 17 7M9 7h8v8" />
    </svg>
  );
}

export function SearchIcon(props: IconProps) {
  return (
    <svg {...strokeProps} {...props}>
      <circle cx="10.8" cy="10.8" r="6.3" />
      <path d="m20 20-4.6-4.6" />
    </svg>
  );
}

/** A two-tone medicine capsule — the catalogue's placeholder artwork. */
export function CapsuleIcon(props: IconProps) {
  return (
    <svg {...strokeProps} {...props}>
      <rect x="3.2" y="9" width="17.6" height="6" rx="3" transform="rotate(-45 12 12)" />
      <path d="M12 8.3v7.4" transform="rotate(-45 12 12)" />
    </svg>
  );
}

/** Circle-i affordance used to trigger a tooltip with extra detail. */
export function InfoIcon(props: IconProps) {
  return (
    <svg {...strokeProps} {...props}>
      <circle cx="12" cy="12" r="8.4" />
      <path d="M12 11.2v5" />
      <circle cx="12" cy="8.3" r="0.55" fill="currentColor" stroke="none" />
    </svg>
  );
}

/** Classic funnel shape — opens the filter panel. */
export function FilterIcon(props: IconProps) {
  return (
    <svg {...strokeProps} {...props}>
      <path d="M4 5h16l-6.2 7.4V19l-3.6 1.8v-8.4L4 5Z" />
    </svg>
  );
}

/** Small close mark — removes a single filter chip. */
export function XIcon(props: IconProps) {
  return (
    <svg {...strokeProps} {...props}>
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  );
}

/** Card outline with a stripe — the payment step. */
export function CreditCardIcon(props: IconProps) {
  return (
    <svg {...strokeProps} {...props}>
      <rect x="2.5" y="5.5" width="19" height="13" rx="2.2" />
      <path d="M2.5 9.7h19" />
      <path d="M5.5 14.8h4" />
    </svg>
  );
}

/** Delivery box — order status and tracking. */
export function PackageIcon(props: IconProps) {
  return (
    <svg {...strokeProps} {...props}>
      <path d="M3.5 7.3 12 3l8.5 4.3v9.4L12 21l-8.5-4.3Z" />
      <path d="M3.5 7.3 12 11.6l8.5-4.3M12 11.6V21" />
    </svg>
  );
}

/** Bell shape — reorder notifications. */
export function BellIcon(props: IconProps) {
  return (
    <svg {...strokeProps} {...props}>
      <path d="M6 10.5a6 6 0 0 1 12 0c0 4 1.4 5.2 1.4 5.2H4.6S6 14.5 6 10.5Z" />
      <path d="M10.2 18.8a2 2 0 0 0 3.6 0" />
    </svg>
  );
}

/** Three stacked lines — opens the navigation menu. */
export function MenuIcon(props: IconProps) {
  return (
    <svg {...strokeProps} {...props}>
      <path d="M4 6.5h16M4 12h16M4 17.5h16" />
    </svg>
  );
}

/** Progress ring with a check — used for "view group progress" links. */
export function ChartIcon(props: IconProps) {
  return (
    <svg {...strokeProps} {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5v4.8l3.2 2" />
    </svg>
  );
}

export function SparkleIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M12 3.5c.32 2.55 1.02 4.36 2.1 5.44 1.08 1.08 2.9 1.78 5.44 2.1-2.55.32-4.36 1.02-5.44 2.1-1.08 1.08-1.78 2.9-2.1 5.44-.32-2.55-1.02-4.36-2.1-5.44-1.08-1.08-2.9-1.78-5.44-2.1 2.55-.32 4.36-1.02 5.44-2.1 1.08-1.08 1.78-2.9 2.1-5.44Z" />
    </svg>
  );
}
