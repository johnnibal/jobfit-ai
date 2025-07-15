HEAD
# 💼 JobFit.AI – AI-Powered Resume Matcher

JobFit.AI is a full-stack AI tool that analyzes how well a developer's resume matches a job description. It uses Claude (via OpenRouter) to extract a fit score, identify gaps, and suggest personalized improvements.

## 🚀 Features

- ✅ Upload a CV as a **PDF** or paste plain text
- ✅ Paste any **job description**
- ✅ Uses **Claude 3** via OpenRouter to return:
  - Fit score (0–100)
  - Missing skills
  - Tailored suggestions
- ✅ Built with **Next.js (App Router)**, **TypeScript**, **TailwindCSS**
- ✅ Secure: PDF parsing is done client-side for privacy

## 🧠 Tech Stack

- **Frontend**: Next.js (App Router), TailwindCSS, TypeScript
- **LLM Backend**: Claude 3 via [OpenRouter](https://openrouter.ai)
- **PDF Parsing**: `pdfjs-dist` (client-side)
- **Deployment**: Vercel (recommended)

## 📄 How to Run

```bash
git clone https://github.com/your-username/jobfit-ai.git
cd jobfit-ai
npm install
=======
This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
e63e088 (docs: add changelog and LLM integration notes)
