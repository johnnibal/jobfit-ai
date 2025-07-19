# 📝 Changelog

## [v0.1.0] – MVP Complete

### ✅ Added
- `/analyze` page with form for CV and Job Description
- PDF upload and parsing with `pdfjs-dist`
- Integration with Claude 3 (via OpenRouter)
- Type-safe client-side PDF parsing
- Response display from AI result

### 🐞 Fixed
- Next.js worker error with `pdfjs-dist`
- Model not found errors (`gpt-3.5-turbo`, `openai/gpt-4`) with OpenRouter
- TypeScript error: "Unexpected any" using union type guard
- API 500 error from invalid `.env` or OpenAI key
