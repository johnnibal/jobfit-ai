# QA: Pro Report unlock vs prepaid credit (Stripe Test mode)

Staging or local deployment with Stripe **test** keys, OpenRouter reachable, Postgres + Prisma migrated (including `ProReportPendingCredit`).

## Prerequisites (env)

| Variable | Notes |
|---------|-------|
| `STRIPE_SECRET_KEY` | `sk_test_…` |
| `STRIPE_WEBHOOK_SECRET` | Required for webhook checks (use Stripe CLI forwarding locally). |
| `STRIPE_PRO_REPORT_PRICE_ID` | Must be a **Price** id (`price_…`). Do **not** put a Product id (`prod_…`) here. |
| `STRIPE_MONTHLY_PRO_PRICE_ID` | Same — **price** id for Monthly Pro regression. |
| `NEXT_PUBLIC_APP_URL` | Matches where you run the browser (Stripe success redirect). |
| `JOBFIT_ENTITLEMENT_SECRET`, `JOBFIT_USAGE_SECRET` | Min 16 chars; required for entitlement + pending credit cookies in non-demo flows. |
| `JOBFIT_BILLING_DIAGNOSTICS` | Optional **`true`** on staging (Railway `NODE_ENV` is often production): prepaid `confirm-session` failures include `debugReason` / `bindSubtype` JSON for QA. |

**Behavior note (Flow B / prepaid credit):** `POST /api/checkout/pro-report` **without `analysisId`** issues/refreshes the signed **`jobfit_anon`** cookie and **pre-reserves** a `ProReportPendingCredit` row for the new Stripe `session.id` against that anonymous id **before** redirecting to Stripe. `/api/billing/confirm-session` then **requires** a verified `jobfit_anon` cookie (**no silent mint**) and aligns binds using structured diagnostics when `JOBFIT_BILLING_DIAGNOSTICS=true`.

**Automated invariant:** `/api/checkout/pro-report` sends `line_items: [{ price: … }]` built from **`STRIPE_PRO_REPORT_PRICE_ID`** only (`src/app/api/checkout/pro-report/route.ts`). Webhook handlers should **not** be pointed at Product ids instead of Prices.

Stripe metadata contract is covered by `src/lib/billing/proReportStripeCheckoutFields.test.ts`.

---

## 1. Existing analysis unlock (Flow A)

- [ ] Run a **free** analysis until the insights card appears (`analysisId` in URL/state).
- [ ] Click **Unlock Pro Report €4.99** (conversion path with current `analysisId`).
- [ ] Confirm Stripe Checkout line item shows the configured Pro Report **price**.
- [ ] Pay with Stripe test card (e.g. `4242424242424242`).
- [ ] Redirect lands on **`/checkout/success?session_id=…`** and shows **Pro Report unlocked** / payment confirmation (not stuck on verifying forever).
- [ ] Analyzer opens for that run; insights show **full Pro** sections (ATS, cover letter, PDF if applicable).
- [ ] **`POST /api/ats-checklist`** from the UI succeeds for that **`analysisId`**.
- [ ] **`POST /api/cover-letter`** from the UI succeeds for that **`analysisId`**.
- [ ] Hard refresh (`Ctrl+F5`): Pro sections still available (entitlement persisted).
- [ ] Stripe Dashboard → Payment → Checkout Session **`metadata`** includes `jobfit_product=pro_report` and **`analysisId`** (or equivalent via `client_reference_id` aligned with UUID).

Optional API spot-check (authenticated browser session / copy cookies):

- [ ] **`POST /api/billing/claim-pro-report-cookie`** with `{ "analysisId": "<uuid>" }` returns `200` if unlock row exists after payment.

---

## 2. Prepaid Pro Report credit without prior analysis (Flow B)

Perform in **fresh incognito** (or wipe site cookies + storage for your origin).

- [ ] Exhaust **free quota** (`/analyze` repeatedly until quota error), **or** use pricing CTA **Buy Pro Report** that omits `analysisId`.
- [ ] **`POST /api/checkout/pro-report`** checkout from UI should omit `analysisId` (credit mode).
- [ ] Stripe Checkout **`metadata`** (Dashboard): `jobfit_product=pro_report_credit` and **no** `analysisId` key bound to UUID.
- [ ] Complete payment → success page shows **credit ready** messaging (runs one prepaid analysis instruction).
- [ ] Navigate to **`/analyze`**, paste CV/JD longer than threshold, submit.
- [ ] Expected: analysis **completes** even though **quota is 0** (pending credit path in `POST /api/analyze`).
- [ ] Resulting report behaves as **full Pro** (same checks as §1 ATS / letter / insights).
- [ ] Submit **another** CV/JD with same browser/session **without Monthly Pro**.
- [ ] Expected: **blocked** (`429` / quota UX) — prepaid credit consumed once (`consumedAt` set on pending credit row).

If something fails binding:

- [ ] Confirmation still works server-side (`GET /api/billing/confirm-session`) independent of webhook; retry success page once if Stripe briefly reports unpaid.

---

## 3. Security checks

Credit reuse & binding (`ProReportPendingCredit` + cookie):

- [ ] Second analysis after credit run stays **blocked** (see §2).
- [ ] Paid credit row cannot unlock **another UUID**: entitlement + `requirePremiumAccess` only allow **premium APIs** where cookie + **`ProReportUnlock`** match **`analysisId`**.

Unauthorized premium APIs:

- [ ] **`POST /api/cover-letter`** with valid-looking body but **no** entitlement cookie / Monthly Pro → **`403`**.
- [ ] **`POST /api/ats-checklist`** same → **`403`**.

Wrong target analysis:

- [ ] Unlock or credit applies only to **`analysisId`** actually paid or generated; another random UUID stays **locked** (**403** on premium endpoints).

(Optional cross-browser torture test)

- [ ] Finish checkout in Browser A → open success URL copy in Browser B → expect **credit bind conflict** UX / `409` from confirm-session paths documented in backend (same receipt, different anon session).

---

## 4. Monthly Pro regression

- [ ] Start Monthly Pro checkout from pricing/analyzer (**subscription** Checkout).
- [ ] Stripe completes → routed to **`/checkout/subscription-success`** → analyzer with subscription flag/subscription-linked cookies.
- [ ] Billing session shows Monthly Pro active; analyzer allows **another** paid run beyond free quota subject to subscription limits.
- [ ] Refresh: access **persists**.
- [ ] Regression: prepaid Pro flows (§§1–2) unaffected.

---

## 5. Stripe & webhooks

- [ ] Stripe CLI: `stripe listen --forward-to <origin>/api/webhooks/stripe` → trigger test checkout completion.
- [ ] **`checkout.session.completed`** handler returns **`200`** with `{ "received": true }` — check CLI output / logs.
- [ ] **Credit** checkout: webhook creates/updates **`ProReportPendingCredit`** keyed by Stripe session id (`upsertProReportPendingCreditFromPaidSession`). Missing webhook should still recover via **`/api/billing/confirm-session`** on return (manual retest once with webhook paused).

---

## 6. Automated suite (Vitest)

From repo root:

```bash
npm test
npm run build
```

Covers signing for **pending credit cookie**, **Stripe metadata split** Flow A/B, and continues existing **Pro entitlement cookie** suites.
