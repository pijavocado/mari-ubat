import { MenuIcon, XIcon } from "@/components/icons";
import { logoutAction } from "./NavMenu.actions";

export interface NavMenuProps {
  /** "My group buy" target — falls back to the catalogue if there's no active one to link to. */
  groupBuyHref?: string;
  /** "Order" target — falls back to the catalogue if there's no order to link to yet. */
  orderHref?: string;
  /** "light" (default) for the trigger on white/paper backgrounds (e.g. the dashboard); "dark" for the ghost style used on navy sticky headers. */
  variant?: "light" | "dark";
}

const TRIGGER_CLASS = {
  light: "border border-navy/15 text-navy hover:border-navy/30 hover:bg-navy/5",
  dark: "text-white/70 hover:bg-white/10 hover:text-white",
};

/**
 * Icon-triggered side navigation drawer. Built with the checkbox-hack
 * pattern (a hidden checkbox toggled by <label>s) rather than JavaScript, so
 * opening, closing via the backdrop, and closing via the X button all work
 * with zero client-side script — consistent with the rest of the app's
 * server-first approach.
 */
export function NavMenu({ groupBuyHref, orderHref, variant = "light" }: NavMenuProps) {
  const links = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/inbox", label: "Inbox" },
    { href: groupBuyHref ?? "/medicines", label: "My group buy" },
    { href: orderHref ?? "/medicines", label: "Order" },
  ];

  return (
    <>
      <input type="checkbox" id="nav-drawer" className="peer hidden" />

      <label
        htmlFor="nav-drawer"
        aria-label="Open navigation menu"
        className={`grid h-10 w-10 cursor-pointer place-items-center rounded-full transition ${TRIGGER_CLASS[variant]}`}
      >
        <MenuIcon className="h-5 w-5" />
      </label>

      <label
        htmlFor="nav-drawer"
        aria-hidden="true"
        className="fixed inset-0 z-30 bg-navy/40 opacity-0 transition-opacity duration-300 pointer-events-none peer-checked:pointer-events-auto peer-checked:opacity-100"
      />

      <nav
        aria-label="Site navigation"
        className="fixed inset-y-0 left-0 z-40 flex w-72 max-w-[80vw] -translate-x-full flex-col bg-white shadow-soft transition-transform duration-300 peer-checked:translate-x-0"
      >
        <div className="flex items-center justify-between border-b border-navy/10 p-5">
          <span className="display-font text-sm text-navy">Menu</span>
          <label
            htmlFor="nav-drawer"
            aria-label="Close navigation menu"
            className="grid h-9 w-9 cursor-pointer place-items-center rounded-full text-navy transition hover:bg-navy/5"
          >
            <XIcon className="h-4 w-4" />
          </label>
        </div>
        <div className="flex flex-1 flex-col gap-1 p-3">
          {links.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="rounded-lg px-3.5 py-3 text-sm font-semibold text-navy transition hover:bg-paper"
            >
              {link.label}
            </a>
          ))}
        </div>
        <form action={logoutAction} className="border-t border-navy/10 p-3">
          <button
            type="submit"
            className="w-full rounded-lg px-3.5 py-3 text-left text-sm font-semibold text-slate transition hover:bg-paper hover:text-navy"
          >
            Log out
          </button>
        </form>
      </nav>
    </>
  );
}
