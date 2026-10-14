# 0 to Shipped — API

Express server that takes a resume PDF plus a job description and returns a match
score with the skills found and missing. Scoring is deterministic keyword matching
for now; the AI matcher drops in behind `src/services/analyzer.js`.

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
```

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
| `GET` | `/api/health` | — | `{ ok, db }` |
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
  middleware/upload.js   # multer: PDF-only, 5 MB, memory storage
  middleware/notFound.js # unmatched route -> 404 ApiError
  middleware/errorHandler.js  # the single error -> response formatter
  utils.js               # ApiError, isPdfFile
  routes/analyze.js            # the API map: path -> middleware -> controller
  services/pdf.js        # Buffer -> text, via pdf-parse
  services/analyzer.js   # text -> score; the AI seam
```

## Adding the AI matcher

`analyzer.js` exports `scoreResume(resumeText, jobDescriptionText)` returning
`{ score, found, missing, source }`. Replace its body with a call to a model and
return `source: "ai"`. Nothing else in the server or the frontend needs to change,
and `source` is stored on each row so old scores stay attributable.
