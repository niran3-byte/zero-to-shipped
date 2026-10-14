# 0 to Shipped — API

Express server that takes a resume PDF plus a job description and returns a match
score with the skills found and missing. Scoring uses labd when `LABD_API_KEY`
is set, and falls back to deterministic keyword matching when it is not — each
result carries `source: "ai" | "keyword"` so you can tell which one ran.

## Setup

```bash
cd backend
npm install
```

Create a `.env` by copying `.env.example`, or just write the file directly:

```
MONGODB_URI=mongodb://127.0.0.1:27017/zero_to_shipped
PORT=5000
CLIENT_ORIGIN=http://localhost:5173
LABD_API_KEY=
```

`LABD_API_KEY` is optional. Leave it empty and scoring uses keyword matching;
set it and labd scores instead. Get a key from
learn.thedevlabs.io/settings#api-keys. The key stays on the server — the
frontend never receives it, and it must never be committed.

You need a MongoDB on `MONGODB_URI`. Either your own `mongod`, or:

```bash
docker run -d -p 27017:27017 --name mongo mongo:7
```

The server starts without it and warns — you'll get scores, they just won't be
saved. Only `POST /api/analyze` writes to the database.

## Run

```bash
npm run dev     # nodemon, restarts on save
npm start       # plain node
```

## Try it without the frontend

```bash
curl http://localhost:5000/api/health

curl -X POST http://localhost:5000/api/analyze \
  -F "resume=@/path/to/resume.pdf" \
  -F "jobDescription=We need a React developer with Node.js, SQL and Docker experience."
```

## Endpoints

| Method | Path | Body | Returns |
| --- | --- | --- | --- |
| `GET` | `/api/health` | — | `{ ok, db, scorer, lastFallback }` |
| `POST` | `/api/analyze` | multipart: `resume` (PDF), `jobDescription` (text) | `{ score, found, missing, source }` |

Errors come back as `{ error: "..." }` with a 400 (bad input), 413 (file too
large) or 422 (PDF has no text layer).

## Layout

```
src/
  server.js              # express app, CORS, middleware order, listen
  config/db.js           # mongoose connection (non-fatal on failure)
  models/Analysis.js     # one row per analysis
  controllers/analyzeController.js  # request handling; throws ApiError
  middleware/upload.js   # multer: PDF-only, 4 MB, memory storage
  middleware/notFound.js # unmatched route -> 404 ApiError
  middleware/errorHandler.js  # the single error -> response formatter
  utils.js               # ApiError, isPdfFile
  routes/analyze.js            # the API map: path -> middleware -> controller
  services/pdf.js        # Buffer -> text, via pdf-parse
  services/analyzer.js   # text -> score, keyword matching (the fallback)
  services/labdClient.js # the only file that talks to labd, and holds the key
  services/aiScorer.js   # text -> score, via labd (the preferred matcher)
```

## How the two matchers fit together

`analyzer.js` and `aiScorer.js` export the same shape:
`{ score, found, missing, source }`. The controller prefers the AI scorer and
falls back to keyword matching, so the route, the model and the frontend are
unchanged by which one ran — only `source` differs, and it is stored on each row
so old scores stay attributable.

`aiScorer.js` asks labd for JSON and validates the reply before trusting it. If
the key is missing, the allowance is spent, labd is unreachable, or the reply is
not usable, it returns `null` and the controller quietly uses the keyword score.
`GET /api/health` reports which scorer is configured and why the last request
fell back.
