# Free-tier analysis response — manual QA

Server-side gating: `/api/analyze` stores the full LLM output but returns a **preview JSON** for free users. Premium users receive the full `message` on the same request. After Pro unlock, the client fetches `/api/analyze/result?analysisId=…` for the stored full text.

## Automated checks

```bash
npm test -- src/lib/analyze/buildAnalysisPreview.test.ts
```

## Manual network QA (browser DevTools → Network)

### Free tier

1. Use a browser profile with no Monthly Pro and no Pro Report unlock.
2. Run an analysis on `/analyze`.
3. Inspect the **`POST /api/analyze`** response body.
4. Confirm:
   - `fullReportAccess` is `false`
   - `accessTier` is `"free"`
   - Fields present: `analysisId`, `fitScore`, `summary`, `suggestions` (max 3), `lockedPreview`
   - **No** `message` field
   - Response JSON does **not** contain strings from premium sections (e.g. `Gaps / Risks`, `ATS Keyword Checklist`, gap bullets).

### Pro Report (prepaid credit or unlock)

1. On localhost, use Billing sandbox **+1 Pro credit** or complete Pro Report checkout for the run.
2. Run analysis (credit consumed on same request when quota exceeded, or after unlock).
3. Confirm **`POST /api/analyze`** returns `fullReportAccess: true` and a `message` with all sections.

### Monthly Pro

1. Enable Monthly Pro (Stripe or local sandbox).
2. Run analysis.
3. Confirm **`POST /api/analyze`** returns `fullReportAccess: true`, `accessTier: "monthly_pro"`, and full `message`.

### Unlock after free preview

1. Run analysis as free → preview response.
2. Unlock Pro Report for that `analysisId` (checkout or sandbox).
3. Confirm client calls **`GET /api/analyze/result?analysisId=…`** and receives full `message`.
4. ATS checklist and cover letter should work with the fetched full text.

## Database

Production/staging need migration `analysis_snapshots` applied:

```bash
npx prisma migrate deploy
```
