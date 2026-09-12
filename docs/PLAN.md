# Clinic Group Buy Prototype — Versioned Development Plan

## Summary

Build a public, functional web MVP for a hackathon demonstrating:

> “Bulk-buying power without bulk-buying the inventory.”

The prototype will focus on one clinic journey:

1. Register and verify a clinic.
2. Search a medicine.
3. Select only the required quantity.
4. Join an anonymous group buy.
5. Track live MOQ progress.
6. View an explainable AI risk prediction.
7. Simulate demand recovery from previous buyers.
8. Reach MOQ and confirm the clinic’s order.

The prototype will use:

- Next.js with TypeScript
- Tailwind CSS
- Drizzle ORM
- SQLite locally
- Turso/libSQL for the hosted demo
- Seeded fictional medicine and purchasing data
- Rules-based AI simulation rather than an external AI API
- Simulated commitments instead of real payments
- Session-based demo data so each public visitor gets an independent scenario

The supplier dashboard, real payment, real pharmacy fulfilment, real credential verification, and real patient/medical data are out of scope.

## Product boundaries

### In scope

- Clinic registration
- Simulated clinic verification
- Medicine catalogue
- Group-buy product details
- Quantity-based commitment
- Anonymous participation count
- Live group progress
- Countdown deadline
- Savings calculation
- Explainable AI demand-recovery prediction
- Simulated recovered demand
- Successful group completion
- Order confirmation
- Public deployment
- Resettable demo sessions

### Out of scope

- Real medicine purchasing
- Real payment processing
- Uploading identity or medical documents
- Patient data
- Prescription validation
- Real supplier integrations
- Real delivery tracking
- Multi-role supplier dashboard
- Regulatory or pharmaceutical compliance workflows
- Production-grade authentication

Every screen should clearly identify the environment as a prototype or demo where appropriate.

## Core demo scenario

Use one main product for the judge walkthrough:

- Product: Amoxicillin 500mg
- Individual price: RM42 per box
- Group price: RM36 per box
- MOQ: 100 boxes
- Starting pooled demand: 82 boxes
- Example clinic quantity: 10 boxes
- Starting anonymous clinics: 12
- Remaining quantity before the clinic joins: 18 boxes
- Estimated savings after joining: RM60
- Deadline: approximately 3–4 hours remaining
- Eligible historical buyers: 3 anonymous clinics
- Potential recovered demand: 24 boxes
- Simulated recovered demand required to complete the group: 18 boxes

The application should never reveal the names or exact quantities of other participating clinics.

## User journey and screens

### 1. Landing page

Purpose: communicate the product clearly within five seconds.

Content:

- Headline: “Bulk-buying power without bulk-buying the inventory.”
- Supporting text explaining pooled demand for independent clinics.
- Three benefits:
  - Lower group pricing
  - No bulk inventory requirement
  - Anonymous participation
- Primary CTA: “Join as a Clinic”
- Secondary link: “See how group buying works”

Acceptance criteria:

- A first-time visitor understands that clinics join with their own quantity.
- The page does not describe the product as a generic medicine marketplace.
- The CTA begins the registration journey.

### 2. Clinic registration

Fields:

- Clinic name
- Clinic registration number
- Primary contact name
- Professional credential confirmation checkbox
- Demo-only acknowledgement

Do not collect real documents.

On submission:

- Validate required fields.
- Create a clinic record in the current demo session.
- Mark the clinic as `VERIFIED`.
- Show a verification success state.
- Redirect to the clinic dashboard.

Acceptance criteria:

- Registration takes less than one minute.
- The user does not need a password.
- The screen clearly states that verification is simulated for the prototype.

### 3. Clinic dashboard

Show:

- Clinic name
- Verification badge
- Active group buys
- Potential savings
- Upcoming purchase value
- AI recommendations
- CTA: “Browse medicines”
- Active group-buy card for Amoxicillin 500mg

Example dashboard values:

- Active group buys: 1
- Potential savings: RM60
- Upcoming purchase value: RM360
- AI recommendations: 1

### 4. Medicine catalogue

Features:

- Search by product name
- Filter by category
- Product cards
- Individual price
- Group price
- MOQ
- Current pooled quantity
- Time remaining
- “View group buy” button

Seed at least four fictional catalogue products:

- Amoxicillin 500mg
- Paracetamol 500mg
- Omeprazole 20mg
- Metformin 500mg

Only Amoxicillin needs the complete working journey. Other products may display static or simplified group-buy states.

### 5. Product and group-buy detail page

Display:

- Product name
- Manufacturer label
- Pack size
- Individual price
- Group price
- MOQ
- Current pooled quantity
- Remaining quantity
- Anonymous clinic count
- Countdown deadline
- User quantity input
- Estimated total
- Estimated savings
- “Join group buy” button

Important messaging:

> “You commit only to the quantity your clinic needs. The platform combines your demand with other verified clinics.”

Validation rules:

- Quantity must be a positive integer.
- Quantity must not exceed the configured demo maximum.
- The quantity must not be zero.
- Estimated savings must update immediately.
- The user must confirm that this is a simulated commitment.

### 6. Commitment confirmation

After clicking “Join group buy”:

- Show a confirmation summary.
- Save the clinic’s commitment.
- Increase pooled demand.
- Increase the anonymous clinic count.
- Show the user’s quantity separately from the anonymous total.
- Do not show other clinic names.

Example:

- Your order: 10 boxes
- New pooled demand: 92 / 100 boxes
- Estimated price: RM36 per box
- Estimated savings: RM60
- Status: Waiting for MOQ

The action should be idempotent for the current session so refreshing the page does not duplicate the commitment.

### 7. Group tracking page

This is the main “wow” screen.

Show:

- Product name
- Large progress indicator
- `92 / 100 boxes`
- Remaining quantity
- Anonymous clinic count
- Countdown timer
- User commitment
- Estimated savings
- Current group status
- AI risk banner

Possible status messages:

- “Your group buy is progressing”
- “8 more boxes needed”
- “Bulk price unlocks when MOQ is reached”
- “No clinic identities are shown”

The countdown should be calculated from a stored deadline rather than hard-coded text. Client-side updates may refresh once per second, while server state refreshes periodically.

### 8. AI demand-recovery screen

Title:

> AI Procurement Assistant

Show:

- Group status: “At risk”
- Current progress
- Time remaining
- Risk percentage
- Plain-language explanation
- Number of eligible historical buyers
- Potential recoverable quantity
- Button: “Simulate demand recovery”

Example explanation:

> “This group buy is at risk because the remaining quantity is high relative to the time left, while recent group demand has slowed.”

Example recommendation:

> “Three verified clinics may be approaching their usual reorder period for this medicine. Their historical purchasing patterns suggest up to 24 additional boxes of potential demand.”

The prototype must expose the inputs behind the recommendation:

- Previous purchase quantity
- Average reorder interval
- Days since last purchase
- Current group shortfall
- Remaining time
- Recent group-buy momentum

The UI should not claim that an advanced pharmaceutical forecasting model is being used.

### 9. Simulated recovery result

Because the prototype is clinic-only, do not build three additional clinic accounts.

Instead, provide a clearly labelled simulation control:

> “Notify me when MOQ is reached”

(Originally labelled "Simulate accepted anonymous demand" — renamed once the notification inbox from v0.7/v0.8 existed, since the result is now delivered as an inbox alert rather than an instant redirect. The underlying mechanic is unchanged.)

When activated:

- Create a recovery event.
- Add the required recovered quantity.
- Increase pooled demand to 100 / 100.
- Change the group status to `MOQ_REACHED`.
- Send the clinic a "MOQ reached" notification instead of navigating them there directly.
- Preserve clinic anonymity.

The clinic discovers completion via their own inbox, clicks through from there to the tracking page, and proceeds to payment. The simulated action should be visibly labelled as demo behavior so judges understand that it represents responses from other clinics.

### 10. Order completion page

Show:

- “Group Buy Successful”
- `100 / 100 boxes`
- Clinic’s quantity
- Final price
- Total estimated savings
- Estimated delivery window
- Order status: `READY_FOR_FULFILMENT`
- Explanation that the supplier receives the aggregate order while the clinic receives only its committed quantity

Example:

- Your order: 10 boxes
- Final price: RM36 per box
- Total: RM360
- You saved: RM60
- Estimated delivery: 2–3 business days

No real order should be placed.

## Data model

Use a small relational schema.

### DemoSession

- `id`
- `sessionToken`
- `createdAt`
- `expiresAt`

Each public visitor receives a separate demo session.

### Clinic

- `id`
- `demoSessionId`
- `name`
- `registrationNumber`
- `contactName`
- `verificationStatus`
- `createdAt`

### Product

- `id`
- `name`
- `strength`
- `packSize`
- `manufacturer`
- `individualPrice`
- `groupPrice`
- `category`
- `isActive`

### GroupBuy

- `id`
- `productId`
- `demoSessionId`
- `targetQuantity`
- `currentQuantity`
- `anonymousClinicCount`
- `deadlineAt`
- `status`
- `createdAt`
- `completedAt`

Statuses:

- `OPEN`
- `AT_RISK`
- `MOQ_REACHED`
- `READY_FOR_FULFILMENT`
- `EXPIRED`

### Commitment

- `id`
- `groupBuyId`
- `clinicId`
- `quantity`
- `unitPrice`
- `estimatedSavings`
- `status`
- `createdAt`

Statuses:

- `PENDING`
- `CONFIRMED`
- `CANCELLED`

### PurchaseHistory

- `id`
- `clinicId`
- `productId`
- `usualQuantity`
- `averageReorderIntervalDays`
- `daysSinceLastPurchase`

### RecoveryRecommendation

- `id`
- `groupBuyId`
- `riskScore`
- `eligibleClinicCount`
- `potentialRecoveredQuantity`
- `explanation`
- `createdAt`

### RecoveryEvent

- `id`
- `groupBuyId`
- `recoveredQuantity`
- `source`
- `createdAt`

The system should store only fictional demo data.

## Group-buy state transitions

Implement these transitions explicitly:

```text
OPEN
  → AT_RISK
  → MOQ_REACHED
  → READY_FOR_FULFILMENT

OPEN
  → EXPIRED

AT_RISK
  → MOQ_REACHED
  → EXPIRED
```

Rules:

- A group is `AT_RISK` when the risk score reaches the configured threshold.
- A group becomes `MOQ_REACHED` when current quantity is greater than or equal to target quantity.
- A group becomes `READY_FOR_FULFILMENT` after the simulated completion action.
- An expired group cannot accept new commitments.
- A completed group cannot be committed to again.
- The user’s commitment must never be duplicated by browser refreshes or repeated clicks.

## Explainable AI rules model

Use deterministic calculations.

### Risk score

Calculate:

```text
shortfallRatio = remainingQuantity / targetQuantity

timePressure = 1 - hoursRemaining / 24

momentumPenalty =
  1 - min(1, unitsAddedDuringRecentWindow / momentumTarget)

riskScore =
  0.25 * shortfallRatio
  + 0.55 * timePressure
  + 0.20 * momentumPenalty
```

Clamp the final value between `0` and `1`.

Risk labels:

- Below `0.40`: Low risk
- `0.40–0.64`: Medium risk
- `0.65+`: At risk

Round the UI percentage to the nearest whole number.

### Eligible reorder clinics

A historical buyer is eligible when:

```text
daysSinceLastPurchase >= averageReorderIntervalDays * 0.8
```

and:

- The clinic is verified.
- The clinic has not already committed to the current group.
- The product matches.
- The group has not expired.
- The historical purchase quantity is greater than zero.

Potential recovery quantity is the sum of eligible historical quantities, capped at the remaining MOQ requirement.

The AI screen must explain the recommendation using these actual values.

## Application interfaces

Use server-side domain functions or typed server actions for:

- `createDemoSession()`
- `registerClinic()`
- `listProducts()`
- `getProductGroupBuy()`
- `createCommitment()`
- `calculateGroupBuyStatus()`
- `calculateRecoveryRisk()`
- `getEligibleReorderClinics()`
- `simulateDemandRecovery()`
- `completeGroupBuy()`
- `resetDemoSession()`

Each function should:

- Validate inputs.
- Verify the current demo session.
- Enforce valid state transitions.
- Return typed success or error results.
- Avoid exposing other clinics’ identities.

Expected error states:

- Invalid quantity
- Group expired
- Group already completed
- Duplicate commitment
- Missing demo session
- Product unavailable
- Recovery already simulated

## Versioned development sequence

### Version 0.1 — Foundation

Build:

- Next.js project
- TypeScript configuration
- Tailwind styling
- Database connection
- Drizzle schema
- Seed script
- Shared domain types
- Basic navigation
- Environment configuration

Create the first commit/tag:

```text
v0.1-foundation
```

Exit criteria:

- Application starts locally.
- Database can be created.
- Seed data can be loaded.
- A basic landing page renders.
- No real user data is required.

### Version 0.2 — Demo session and clinic verification

Build:

- Session cookie creation
- Demo session persistence
- Registration form
- Simulated verification
- Dashboard shell
- Verification badge
- Session reset behavior

Commit/tag:

```text
v0.2-clinic-verification
```

Exit criteria:

- A new visitor can register a clinic.
- Refreshing the page preserves the session.
- A separate browser session receives independent demo data.
- No passwords or documents are required.

### Version 0.3 — Catalogue and product discovery

Build:

- Product seed data
- Catalogue page
- Search
- Product cards
- Product detail page
- Pricing and MOQ display
- Group progress display

Commit/tag:

```text
v0.3-catalogue
```

Exit criteria:

- The user can find Amoxicillin 500mg.
- Prices and MOQ are visible.
- The product page explains quantity-based purchasing.
- Non-primary products do not break the experience.

### Version 0.4 — Group-buy commitment

Build:

- Quantity input
- Savings calculator
- Commitment confirmation
- Commitment persistence
- Anonymous pooled progress
- Duplicate-submit protection
- Group-buy tracking page

Commit/tag:

```text
v0.4-group-buy
```

Exit criteria:

- The clinic can commit 10 boxes.
- Progress changes from 82 to 92.
- Savings calculate correctly.
- Only the current clinic’s quantity is identified.
- Refreshing does not create another commitment.

### Version 0.5 — Live tracking and status logic

Build:

- Countdown timer
- Group-buy status service
- Progress animation
- Anonymous clinic count
- Deadline handling
- Expired and completed states
- Readable empty/error states

Commit/tag:

```text
v0.5-live-tracking
```

Exit criteria:

- The group state is derived from stored data.
- The countdown reaches zero safely.
- Expired groups cannot accept commitments.
- MOQ completion changes the interface consistently.

### Version 0.6 — AI demand recovery

Build:

- Purchase-history seed data
- Risk-score calculation
- Reorder eligibility calculation
- AI recommendation UI
- Explanation text
- Simulated recovery event
- Recovery audit record

Commit/tag:

```text
v0.6-ai-recovery
```

Exit criteria:

- The seeded scenario produces an at-risk result.
- The recommendation shows real rule inputs.
- The interface identifies potential demand without exposing clinic identities.
- Simulated recovery moves the group to MOQ reached.

### Version 0.7 — AI Demand Recovery List

Turns the anonymous eligibility calculation from v0.6 into an operational tool: an internal, name-identified list (distinct from the clinic-facing anonymous risk explanation, which never changes) used to actually reach out to eligible clinics.

Build:

- List of clinics with a fixed trend of reordering the same medicine over the same fixed interval (the same reorder-eligibility rule as v0.6, shown by name here)

Commit/tag:

```text
v0.7-recovery-notification-list
```

Exit criteria:

- The list matches exactly the same eligibility rule already used for the anonymous v0.6 explanation.
- Sending notifications is per-clinic idempotent — a clinic already notified isn't notified again.
- The clinic-facing AI screen (v0.6) still never exposes any identity; only this internal list does.

### Version 0.8 — Clinic notification inbox

A dedicated inbox page (`/inbox`, linked from the nav) where a clinic receives an alert about a group buy it hasn't joined that's short of its MOQ, framed around its own reorder pattern. Auto-generated per clinic/group-buy pair (at most once) whenever the clinic visits — this is what actually makes the feature reachable by the one real clinic session this demo gives you, since the name-identified eligibility list built for v0.7 only ever targets fictional historical clinics with no real login.

Build:

- Dedicated inbox page showing every pending alert
- Alert message: the group buy's shortfall against its MOQ, plus "based on your previous purchasing pattern you might be running low"
- "Bring me there" button
- "No, thank you" button
- Dashboard teaser (an unread count linking to the inbox) so it isn't missed

Commit/tag:

```text
v0.8-notification-inbox
```

Exit criteria:

- A pending notification is visible on the clinic's own inbox, nowhere else.
- "Bring me there" takes the clinic to the product and marks the notification acted on.
- "No, thank you" dismisses it without navigating away.
- Revisiting the inbox never creates a duplicate alert for the same group buy.
- Resetting the demo clears a clinic's own notifications along with everything else.

### Version 0.9 — Completion and demo polish

Build:

- Order-success page
- Final price and savings
- Fulfilment status
- Payment button (leads into v0.8's simulated payment process)
- Consistent visual hierarchy
- Loading states
- Toasts or inline feedback
- Mobile-responsive layout
- Empty and error states
- Demo disclaimer

Commit/tag:

```text
v0.9-demo-polish
```

Exit criteria:

- The complete journey can be demonstrated in under five minutes.
- A judge can understand the product without narration.
- The most important progress value is visually dominant.
- The application works on desktop and mobile widths.

### Version 0.10 — Payment process

Once a group buy reaches its target quantity, the committing clinic can complete a **simulated** checkout — this remains a demo, so no real payment is ever processed and only a card's last 4 digits are kept, purely for the confirmation screen.

Build:

- Payment details (card number, expiry, CVC — simulated, never charged)
- Billing info (billing name and address)
- Mailing details (delivery address, defaulting to "same as billing")
- Track order button, shown after payment completes

Commit/tag:

```text
v0.10-payment-process
```

Exit criteria:

- A clinic can only reach payment after the group buy reaches MOQ.
- Submitting payment is idempotent — revisiting or resubmitting never double-charges or duplicates the order.
- The group buy transitions from `MOQ_REACHED` to `READY_FOR_FULFILMENT` once payment completes.
- No full card number is ever persisted.

### Version 0.11 — Order status & exploration

Build:

- Order status (reflecting the group buy's fulfilment state)
- Estimated delivery date
- Explore more products and groups (returns the clinic to the catalogue)

Commit/tag:

```text
v0.11-order-status
```

Exit criteria:

- The order screen is only reachable after payment completes.
- Estimated delivery date is computed from the payment date, not hard-coded.
- The clinic can return to the catalogue in one click to start another group buy.

### Version 0.12 — Public deployment

Deploy:

- Hosted Next.js application
- Turso/libSQL production database
- Production seed data
- Environment variables
- Public demo URL
- Health-check route
- Session isolation
- Reset mechanism

Commit/tag:

```text
v0.12-public-demo
```

Exit criteria:

- A fresh browser can complete the demo.
- Two separate browsers do not share clinic state.
- The deployed database persists correctly.
- No secret values are exposed in client code.
- The application remains usable after repeated demonstrations.

### Version 0.13 — Supplier page

A deliberately minimal exception to this plan's original "no supplier dashboard" scope boundary: a single public, read-only page — no login, no multi-role account system, no real supplier integration — showing the aggregate orders a supplier would ship.

Build:

- Product picture (the same category-tinted placeholder artwork used everywhere else — no real product photos exist)
- Product name
- MOQ
- Number of doctors (the group buy's anonymous clinic count)
- Proceed to delivery button

Commit/tag:

```text
v0.13-supplier-page
```

Exit criteria:

- Only group buys with at least one paid, undelivered order appear.
- Clinic identities are never shown, only the aggregate doctor count.
- "Proceed to delivery" marks every paid order under that group buy as out for delivery in one action, and the clinic's own order page reflects the new status.
- Clicking it again once already delivered has nothing left to act on.

### Version 1.0 — Hackathon-ready release

Complete:

- Full end-to-end test
- Deployment smoke test
- Browser compatibility check
- Demo reset verification
- Screenshots for presentation
- One-minute and five-minute demo scripts
- Final product wording

Commit/tag:

```text
v1.0-hackathon-mvp
```

## Testing plan

### Unit tests

Test:

- Savings calculation
- Quantity validation
- Risk-score calculation
- Risk labels
- Reorder eligibility
- Potential recovered demand
- Group state transitions
- Duplicate commitment protection
- Deadline expiration

### Integration tests

Test:

- Registration creates a verified clinic
- Product catalogue loads seeded products
- Joining a group buy updates pooled quantity
- A commitment belongs only to the current session
- Recovery creates a valid completion event
- Completed groups cannot accept new commitments

### End-to-end test

Run the exact judge journey:

1. Open public URL.
2. Register a demo clinic.
3. Open the catalogue.
4. Select Amoxicillin.
5. Enter 10 boxes.
6. Join the group.
7. Confirm progress is 92 / 100.
8. Open AI recovery.
9. View the 72% risk explanation.
10. Simulate recovered demand.
11. Confirm 100 / 100.
12. Click "Pay now" and complete the simulated payment form.
13. Confirm the order status screen shows "Ready for fulfilment" and an
    estimated delivery date.
14. Click "Explore more products" and confirm it returns to the catalogue.
15. Refresh the browser.
16. Confirm the completed state persists.

### Deployment tests

Verify:

- Production environment variables
- Database connectivity
- Session-cookie behavior
- Mobile layout
- Hard refresh on every route
- Empty/error states
- No console-breaking errors
- No real or sensitive data in the database

## Public demo and privacy defaults

- Use fictional clinic names and fictional purchasing histories.
- Do not upload or store identity documents.
- Do not use patient data.
- Do not connect to real pharmaceutical suppliers.
- Do not imply that the prototype authorizes medicine purchase.
- Display only aggregate demand to the clinic.
- Use a session cookie to isolate each public visitor.
- Include a reset action for demo recovery.
- Keep supplier identity and clinic identity hidden from the group-progress interface.

## Final acceptance criteria

The prototype is ready when:

- A new visitor can complete the entire clinic journey without assistance.
- The core value proposition is visible on the landing page and group-tracking screen.
- The clinic commits only to its own required quantity.
- Anonymous pooled demand is visible.
- The AI feature is explainable from seeded purchase history.
- The group can visibly move from at risk to MOQ reached.
- The final screen communicates savings and fulfilment clearly.
- The public deployment works from a clean browser session.
- The application does not require real payment, real credentials, real medical records, or supplier integration.
