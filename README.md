# JobFit AI

JobFit AI is a Next.js app that compares a candidate CV against a job description, calculates a match score, highlights gaps, and suggests resume improvements through an AI-powered analysis flow.

## Stack

- Next.js 15 App Router
- React 19 + TypeScript
- Tailwind CSS
- `pdfjs-dist` for client-side PDF extraction
- OpenRouter via the `openai` SDK
- Railway for deployment

## Main Features

- Animated AI-themed landing page
- CV upload and PDF text extraction
- Job description analysis workflow
- Structured AI response with match score, verdict, strengths, gaps, and reality check
- Deployment-ready production build

## Local Development

### Requirements

- Node.js 18 or newer
- npm
- An OpenRouter API key

### Environment Variables

Create a local env file:

```bash
cp .env.example .env.local
```

Then set:

```bash
OPENROUTER_API_KEY=your_openrouter_api_key
```

### Run Locally

```bash
npm install
npm run dev
```

App URLs:

- `http://localhost:3000` for the dev server
- `http://localhost:3000/analyze` for the analyzer page

## Production Checks

Before deploying, run:

```bash
npm run lint
npm run build
```

Both should pass before pushing to GitHub.

## Railway Deployment

This project can be deployed directly from your GitHub repository in Railway.

### 1. Push your latest changes

```bash
git add .
git commit -m "Prepare app for deployment"
git push
```

### 2. Open your Railway project

- Go to your existing Railway project
- Open the service connected to this GitHub repo
- Trigger a redeploy, or push to the connected branch

### 3. Set required environment variables

In Railway → your service → **Variables**, set everything from `.env.example`. Minimum for checkout:

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | Postgres connection (Railway Postgres plugin) |
| `STRIPE_SECRET_KEY` | Stripe **live** secret key (`sk_live_…`) in production |
| `STRIPE_PRO_REPORT_PRICE_ID` | One-time Pro Report price ID (`price_…`) |
| `STRIPE_MONTHLY_PRO_PRICE_ID` | Recurring Monthly Pro price ID |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret (`whsec_…`) |
| `NEXT_PUBLIC_APP_URL` | Your public site URL, e.g. `https://your-app.up.railway.app` |
| `NEXT_PUBLIC_APP_ENV` | `production` |
| `JOBFIT_USAGE_SECRET` | Random string, min 16 chars (cookie signing) |
| `JOBFIT_ENTITLEMENT_SECRET` | Random string, min 16 chars (Pro unlock cookies) |
| `OPENROUTER_API_KEY` | AI analysis |

**Important:** Stripe keys and price IDs must all be from the **same mode** (all live or all test). A test key with live price IDs causes checkout to fail.

After deploy, open `/api/health/checkout` — it lists any missing variables (names only, no secrets).

Run migrations once if the build did not apply them:

```bash
npx prisma migrate deploy
```

Without `DATABASE_URL` / migrations, Pro Report checkout fails when reserving prepaid credit. Without Stripe vars or `JOBFIT_USAGE_SECRET`, both checkout buttons return errors.

### 4. Railway build/runtime settings

Railway should auto-detect this project as a Next.js app. If you need to set commands manually, use:

```bash
Build command: npm run build
Start command: npm run start
```

The build runs `prisma migrate deploy` automatically when `DATABASE_URL` is available at build time.

### 5. Verify after deploy

Check:

- `/` loads correctly
- `/analyze` loads correctly
- CV upload works
- AI analysis returns a score and formatted response

## Deployment Notes

- The PDF parser is loaded only in the browser during file upload, which avoids build-time issues in production.
- The API route now fails cleanly if `OPENROUTER_API_KEY` is missing.
- If Railway has an older deployment cached, a fresh redeploy after pushing the latest code is recommended.