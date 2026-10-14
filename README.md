# 0 to Shipped — Resume Parser

Upload a resume PDF, paste the job description you're targeting, get a match score
out of 100 with the skills you already cover and the ones you're missing.

```
frontend/   React + Vite single-page app
backend/    Express API + MongoDB
```

## Run it

Two terminals. Backend first:

```bash
cd backend
npm install
npm run dev          # http://localhost:5000
```

Then the frontend:

```bash
cd frontend
npm install
npm run dev          # http://localhost:5173
```

Open http://localhost:5173. See `backend/README.md` for the `.env` file and
getting MongoDB running — the app scores resumes without a database, it just
doesn't save them.

## How the request flows

1. The browser POSTs the PDF and the JD text to `/api/analyze`.
2. Vite's dev proxy forwards `/api/*` to the Express server on `:5000`, so the
   browser only ever sees one origin (`:5173`) and there's no CORS dance.
3. Express hands the PDF to `pdf-parse`, which pulls out the text layer.
4. `scoreResume()` compares the two texts — which skills the JD asks for, and
   which of those the resume also mentions — and returns the score.
5. The result is saved to MongoDB if it's connected, and returned as JSON.

## Where the AI goes

Step 4 is deliberately isolated in `backend/src/services/analyzer.js`, which
exports a pure `scoreResume(resumeText, jobDescriptionText)`. Today it's
deterministic keyword matching; swapping in a model touches that one file.
`source: "keyword" | "ai"` is returned and stored so rows stay attributable.

## Known limitations

- **Scanned PDFs** have no text layer and come back unreadable (422). OCR would
  fix that; it isn't wired up.
- **Keyword matching is literal.** It knows a fixed vocabulary, so a skill
  phrased a way the list doesn't cover reads as missing.
- Analysing spends the resume text on the request and discards the PDF.
