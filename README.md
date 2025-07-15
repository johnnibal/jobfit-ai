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
