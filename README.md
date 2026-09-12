# Mari Ubat — Running the Prototype

A Next.js prototype for pooled clinic medicine demand ("bulk-buying power
without bulk-buying the inventory"). See [docs/PLAN.md](docs/PLAN.md) for the
full product spec and versioned build plan.

## Stack

- **Next.js 15** (App Router) + **React 19**, **TypeScript**
- **Tailwind CSS**
- **Drizzle ORM** over **SQLite** (local) / **Turso/libSQL** (hosted demo)
- Rules-based "AI" (no external AI API) and simulated commitments — no real
  payments, credentials, or medical data

## 1. Prerequisites

- [Node.js](https://nodejs.org/) 20+ installed
- This repo cloned/downloaded locally

## 2. Install dependencies

```bash
npm install
```

### Windows: "running scripts is disabled on this system"

If PowerShell refuses to run `npm` with an `UnauthorizedAccess` /
`PSSecurityException` error, it's blocking npm's `.ps1` launcher, not this
project. Fix it once with:

```powershell
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
```

Or sidestep it per-command with `npm.cmd install` / run commands from
`cmd.exe` instead of PowerShell.

## 3. Configure environment variables

Copy the example file:

```bash
cp .env.example .env
```

```env
DATABASE_URL=file:./data/clinic-group-buy.db
NEXT_PUBLIC_APP_NAME=Mari Ubat
```

The default `DATABASE_URL` creates a local SQLite file — no external database
needed for local development.

## 4. Set up and seed the database

```bash
npm run db:setup   # creates tables
npm run db:seed    # loads demo clinics, products, and the Amoxicillin group buy
```

Re-run `npm run db:seed` any time you want to reset the seeded demo data back
to its starting state.

## 5. Start the dev server

```bash
npm run dev
```

Wait for:

```
▲ Next.js 15.x.x
- Local: http://localhost:3000
✓ Ready in ...
```

Then open **http://localhost:3000** in your browser.

> **Note:** on machines where a security/Application Control policy blocks
> Next.js's native SWC binary (you'd see `Failed to load SWC binary for
> win32/x64`), `npm run dev` and `npm run build` here already run through
> `scripts/dev.mjs` / `scripts/build.mjs`, which force the WASM fallback
> automatically — no extra steps needed. If you ever want the native version
> for comparison, use `npm run dev:native` / `npm run build:native`.

## 6. Try the demo journey

1. Click **"Join as a clinic"** on the landing page.
2. Fill in the registration form (no password or documents needed) and
   submit — verification is simulated instantly.
3. You'll land on the **clinic dashboard**, showing your clinic, a verified
   badge, and the live Amoxicillin group-buy card.
4. Use **"Reset demo"** on the dashboard at any time to clear your session
   and start over as a new visitor.
5. Click **"Browse medicines"** to open the catalogue. Search by name or
   filter by category — try "Amoxicillin" to see the live group-buy
   progress, or open Paracetamol/Omeprazole/Metformin to see the
   simplified "opening soon" state for medicines without an active group
   buy yet.
6. Click any product card ("View group buy") to open its detail page with
   full pricing, MOQ, and pooled-progress information.
7. On Amoxicillin's detail page, enter a quantity (defaults to 10 boxes,
   matching the plan's demo scenario) and click **"Join group buy"** —
   estimated total and savings update live as you type. This is a
   simulated commitment; no real order or payment is made.
8. You're redirected to the **group tracking page**, showing pooled demand
   move from 82/100 to 92/100, your locked-in price, and your savings.
   Revisiting the product page now shows an "already joined" summary
   instead of the form — refreshing or resubmitting never double-counts
   your commitment.
9. **"Reset demo"** on the dashboard also rolls back any commitment you
   made, so the shared demo scenario can be replayed from a clean 82/100
   state.
10. The countdown on the product, tracking, and dashboard pages ticks live
    (once per second) instead of showing a static string, and progress bars
    animate in on load. Group status (Open / MOQ reached / Expired) is
    computed from the stored quantity and deadline every time it's shown,
    not just read from a column — so it's always accurate even if nothing
    has written to that group buy recently.
11. From the tracking page, open the **AI Procurement Assistant** — a
    deterministic, rule-based risk score (not an external AI model) computed
    from the group's own shortfall, time remaining, and momentum. With the
    seeded scenario (join 10 boxes, leaving 8 to go) it correctly comes back
    "at risk," and shows the actual eligible-clinic figures behind the
    recommendation (usual order size, reorder interval, days since last
    order) with no clinic names attached.
12. Open your **Inbox** (from the nav menu, or a "N new alerts" teaser on
    the dashboard) — visiting it auto-generates a low-stock alert for any
    open group buy you haven't joined, referencing the exact shortfall
    (e.g. "still needs 8 more boxes") and your reorder pattern. Click
    **"Bring me there"** to jump to the product (marks it acted on), or
    **"No, thank you"** to dismiss it in place. It's only ever generated
    once per group buy, so revisiting the inbox never spams you.
13. Click **"Notify me when MOQ is reached"** to simulate other verified
    clinics reordering — pooled demand moves to exactly 100/100 and the
    group's status flips to MOQ reached (clearly labelled as demo behavior,
    and can only fire once per group buy). Instead of jumping straight to
    the tracking page, you're sent to your **Inbox**, where a "MOQ reached"
    alert is waiting. Click **"Bring me there"** on it to go to the
    tracking page.
14. Once MOQ is reached, the tracking page shows a **"Pay now"** button.
    Fill in the payment, billing, and mailing sections (card number,
    expiry, CVC, billing name/address, delivery address — all simulated;
    only the card's last 4 digits are ever kept) and submit. The group buy
    transitions to "Ready for fulfilment."
15. You land on the **order status page** — final price, total savings,
    order status, and an estimated delivery date computed from the payment
    time. Revisiting "Pay now" afterward redirects straight here instead of
    letting you pay twice.
16. Click **"Explore more products"** to return to the catalogue and start
    another group buy. **"Reset demo"** rolls back the commitment, the
    recovery event, the order, *and* your own pending notifications, so the
    whole scenario replays cleanly from 82/100 every time.
17. Open **http://localhost:3000/supplier** — a minimal, public read-only
    view of every group buy with a paid order still waiting to ship: product
    picture, name, MOQ, and how many doctors joined (never who). Click
    **"Proceed to delivery"** to mark it shipped — the clinic's own order
    page immediately reflects "Out for delivery."

Later versions (see [docs/PLAN.md](docs/PLAN.md)) add the public deployment
and final hackathon-ready polish.

## Troubleshooting

- **Port 3000 already in use / page won't update / stale-looking page:**
  Another dev server instance may still be running. Stop it, delete the
  `.next` folder, and restart:
  ```bash
  rm -rf .next
  npm run dev
  ```
- **Dashboard says "No active group buys yet":** the database hasn't been
  seeded — run `npm run db:seed`.
- **Changed the schema:** re-run `npm run db:setup` (or delete
  `data/clinic-group-buy.db` and re-seed) to apply table changes.

## Useful scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the local dev server |
| `npm run build` | Production build (WASM-safe) |
| `npm run start` | Run a production build locally |
| `npm run lint` | Type-check with `tsc --noEmit` |
| `npm run db:setup` | Create database tables |
| `npm run db:seed` | Load fictional demo data |
