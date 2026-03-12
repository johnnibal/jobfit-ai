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

### 3. Set the required environment variable

In Railway, add:

```bash
OPENROUTER_API_KEY=your_openrouter_api_key
```

Without this variable, the UI pages will load but `/api/analyze` will return a server error.

### 4. Railway build/runtime settings

Railway should auto-detect this project as a Next.js app. If you need to set commands manually, use:

```bash
Build command: npm run build
Start command: npm run start
```

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