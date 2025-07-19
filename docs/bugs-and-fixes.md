# 🐛 Bugs We Solved

### ❌ Next.js: PDF.js worker failed to load

**Error:**

✅ **Fix:**
Downgraded to `pdfjs-dist@3.4.120` and used legacy build:

```ts
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf'


❌ TypeScript: Unexpected any
    Error:
    Unexpected any. Specify a different type.
    ✅ Fix: if ('str' in item) return item.str


❌ OpenAI / Claude model errors
Errors:

Model gpt-4 does not exist

429: You exceeded your current quota

404: No endpoints found for gpt-3.5-turbo

✅ Fix:
Switched to OpenRouter and used Claude 3 Haiku model:
model: 'anthropic/claude-3-haiku'


❌ API 500: Missing API key
Error: The OPENAI_API_KEY environment variable is missing or empty
✅ Fix:
Created .env.local in project root with: 

