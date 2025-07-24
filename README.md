# 🧠 JobFit AI

JobFit AI is an intelligent resume analyzer that matches a candidate’s CV with a job description using OpenAI's language model. It scores compatibility and gives tailored feedback — all from a sleek Next.js interface.

🔗 **Live Demo:** [https://jobfit-ai-production.up.railway.app](https://jobfit-ai-production.up.railway.app)

---

## 📂 Project Structure

```bash
jobfit-ai/
├── public/                # Static assets
├── src/
│   ├── app/
│   │   └── api/analyze/   # API route that uses OpenAI
│   ├── components/        # React components (UI, analyzer)
│   └── styles/            # Tailwind & global styles
├── types/                 # Custom TypeScript definitions
├── .env.local             # Environment variables (not committed)
└── README.md              # Project documentation



## 🧠 AI Prompt Example
You are a career coach AI. Given the following resume and job description, analyze how well the candidate fits the job.
Give a score out of 100 for the fit, and provide suggestions for improvement.

End your message with this note:
"⚠️ Reality Check:
Even with a strong match, you may still get ghosted... or the dreaded “leider” email 😔.

Keep applying, keep refining. One 'yes' is all you need."


## 🛠️ Tech Stack
Next.js 15 (App Router)

React 18 with TypeScript

Tailwind CSS

pdfjs-dist – PDF parsing on client

pdf-parse – PDF parsing on server

OpenAI / OpenRouter – AI-based analysis

Railway – Deployment

GitHub – Version control

---

## 🧪 Running Locally
Prerequisites
Node.js (v18+)

pnpm / npm / yarn

OpenAI API Key (or via OpenRouter)

Steps
bash
Copy
Edit
git clone https://github.com/johnnibal/jobfit-ai
cd jobfit-ai

pnpm install



pnpm dev