import { extractText } from "../services/pdf.js";
import { scoreResume } from "../services/analyzer.js";
import { scoreResumeWithAI } from "../services/aiScorer.js";
import { isLabdConfigured } from "../services/labdClient.js";
import { isDbConnected } from "../config/db.js";
import Analysis from "../models/Analysis.js";
import { ApiError } from "../utils.js";

const MIN_JD_LENGTH = 20;

// Why the keyword matcher ran instead of labd, on the most recent fallback.
// Module-level and overwritten each time: it exists so /api/health can say
// "no key set" rather than leaving the learner guessing at a keyword score.
let fallbackReason = null;

/**
 * POST /api/analyze
 *
 * Reads the multipart body (a resume PDF plus a job description), extracts the
 * resume's text, scores it against the JD, and returns the result.
 *
 * Note there is no try/catch here. Express 5 forwards a rejected promise to the
 * error handler, so validation failures just `throw new ApiError(...)` and the
 * controller reads as the happy path plus its guard clauses.
 */
export async function analyzeResume(req, res) {
  const jobDescription = (req.body?.jobDescription ?? "").trim();
  const file = req.file;

  if (!file) {
    throw new ApiError(
      400,
      "Attach a resume PDF in the 'resume' field. PDFs only, up to 4 MB."
    );
  }
  if (jobDescription.length < MIN_JD_LENGTH) {
    throw new ApiError(
      400,
      "Paste the job description — it's the other half of the comparison."
    );
  }

  // Slow, CPU-bound work (pdf.js in a worker) — awaited, never blocked on.
  const resumeText = await extractText(file.buffer);

  if (!resumeText.trim()) {
    throw new ApiError(
      422,
      "No text layer in that PDF — it's probably a scan or an image export. Export a text-based PDF and try again."
    );
  }

  const result = await scoreWithFallback(resumeText, jobDescription);

  await saveAnalysis({ file, jobDescription, resumeText, result });

  res.json(result);
}

/**
 * Pick the best matcher available, and never return nothing.
 *
 * Prefer labd; fall back to the keyword matcher when it returns null.
 */
// labd first, keyword matching as the safety net. scoreResumeWithAI() returns
// null rather than throwing when the key is missing, the allowance is spent, or
// the reply is unusable — so this reads as "prefer the better matcher, never
// leave the learner without an answer", and a labd outage degrades to the
// keyword score instead of a 500.
async function scoreWithFallback(resumeText, jobDescription) {
  const viaAI = await scoreResumeWithAI(resumeText, jobDescription);
  if (viaAI) return viaAI;

  fallbackReason = isLabdConfigured() ? "labd was unavailable" : "no LABD_API_KEY set";
  return scoreResume(resumeText, jobDescription);
}

export function health(_req, res) {
  // Beyond "is the DB attached", report whether the AI matcher is configured and
  // why the last analysis fell back — the difference between "labd scored this"
  // and "you forgot the key", readable from curl instead of buried in a log.
  res.json({
    ok: true,
    db: isDbConnected() ? "connected" : "disconnected",
    scorer: isLabdConfigured() ? "labd" : "keyword",
    lastFallback: fallbackReason,
  });
}

// Persistence is best-effort, and deliberately not the controller's problem: a
// database that is down must not cost the learner their score, which is what
// makes the app usable before mongod is running.
async function saveAnalysis({ file, jobDescription, resumeText, result }) {
  if (!isDbConnected()) {
    console.warn("[db] not connected — returning the score without saving it");
    return;
  }
  try {
    await Analysis.create({
      resumeFilename: file.originalname,
      jobDescriptionText: jobDescription,
      resumeText,
      score: result.score,
      found: result.found,
      missing: result.missing,
      source: result.source,
    });
  } catch (err) {
    console.warn(`[db] could not save analysis: ${err.message}`);
  }
}
