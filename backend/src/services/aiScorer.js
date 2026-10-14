// The AI matcher: resume text + job description -> a score, via labd.
//
// This sits behind the same contract as the keyword matcher in analyzer.js —
// { score, found, missing, source } — which is what keeps the route, the Mongo
// model and the whole frontend unchanged by the upgrade.
//
// Two things here are deliberate and worth keeping:
//
//   1. The model is asked for JSON and nothing else, and the reply is parsed
//      and validated before it is trusted. A model that slips into prose, or
//      returns a score that disagrees with its own lists, would otherwise put a
//      broken number on screen; a genuine failure returns null so the caller can
//      fall back to the keyword matcher instead.
//   2. The task is framed as comparison only. labd should not be inventing
//      skills for the resume or rewriting it — the product answers "which of
//      the posting's asks are covered", and that is the whole ask.

import { chat, LabdError } from "./labdClient.js";

const MAX_CHARS_PER_DOC = 12_000;

// Kept in one place because it doubles as the thing to edit when the output
// shape changes: the prompt and parseReply() have to agree.
const INSTRUCTIONS = `You are the scoring engine inside a resume-to-job-description matcher.

You will be given a RESUME and a JOB DESCRIPTION. Compare them and reply with
ONLY a JSON object, no prose before or after it, in exactly this shape:

{
  "score": <integer 0-100>,
  "found": [<skills the job asks for that the resume evidences>],
  "missing": [<skills the job asks for that the resume does not evidence>]
}

Rules:
- "found" and "missing" must together be exactly the skills the job description
  asks for. Do not add skills of your own and do not list a skill twice.
- Only count a skill as found if the resume actually evidences it. A skill the
  job does not mention is not part of this comparison, however good it is.
- Use short canonical names ("React", "PostgreSQL", "CI/CD").
- score is the percentage of the job's asked-for skills the resume evidences,
  rounded to an integer.
- If the job description is not really a job description, return
  {"score": 0, "found": [], "missing": []} and nothing else.`;

function clip(text) {
  // Guard against a giant paste: the whole conversation is sent on every call,
  // so an unbounded JD is billed and slowed on each one. 12k chars is far more
  // than a real posting needs.
  const trimmed = text.trim();
  return trimmed.length > MAX_CHARS_PER_DOC
    ? `${trimmed.slice(0, MAX_CHARS_PER_DOC)}\n[...truncated]`
    : trimmed;
}

function buildPrompt(resumeText, jobDescriptionText) {
  return [
    INSTRUCTIONS,
    "",
    "RESUME:",
    clip(resumeText),
    "",
    "JOB DESCRIPTION:",
    clip(jobDescriptionText),
  ].join("\n");
}

/**
 * Models like to wrap JSON in a ```json fence. Strip one if it is there.
 */
function stripFence(text) {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  return (fenced ? fenced[1] : text).trim();
}

/**
 * Turn labd's reply into the shape the rest of the app expects.
 *
 * Returns null when the reply cannot be trusted, rather than throwing: the
 * caller falls back to keyword matching on null, and a malformed reply is a
 * reason to fall back, not a reason to fail the learner's request.
 */
function parseReply(content) {
  let parsed;
  try {
    parsed = JSON.parse(stripFence(content));
  } catch {
    return null;
  }

  const score = Math.round(Number(parsed?.score));
  if (!Number.isFinite(score) || score < 0 || score > 100) return null;
  if (!Array.isArray(parsed?.found) || !Array.isArray(parsed?.missing)) return null;

  const clean = (list) =>
    [...new Set(list.filter((s) => typeof s === "string").map((s) => s.trim()).filter(Boolean))];

  const found = clean(parsed.found);
  const missing = clean(parsed.missing);

  // A model can return a score that contradicts its own two lists. When it
  // does, trust the lists — they are the part the UI actually shows — and
  // recompute, so the number on screen always matches the chips underneath it.
  const expected = found.length + missing.length === 0
    ? score
    : Math.round((found.length / (found.length + missing.length)) * 100);
  const consistent = Math.abs(expected - score) <= 2;

  return { score: consistent ? score : expected, found, missing, source: "ai" };
}

/**
 * Score a resume against a job description with labd.
 *
 * @returns {Promise<{score:number, found:string[], missing:string[], source:"ai"}|null>}
 *   null when labd could not be used or did not answer usably — the caller then
 *   falls back to the keyword matcher.
 */
export async function scoreResumeWithAI(resumeText, jobDescriptionText) {
  const prompt = buildPrompt(resumeText, jobDescriptionText);

  let reply;
  try {
    reply = await chat([{ role: "user", content: prompt }]);
  } catch (err) {
    // Logged in full, but never handed to the learner: a missing key or a 402
    // says nothing useful about their resume, and the keyword score they get
    // instead is still a real answer.
    if (err instanceof LabdError) {
      console.warn(`[ai] falling back to keyword matching — ${err.message}`);
    } else {
      console.warn("[ai] falling back to keyword matching —", err);
    }
    return null;
  }

  const result = parseReply(reply.content);
  if (!result) {
    console.warn("[ai] labd replied in an unusable shape — falling back to keyword matching");
    return null;
  }

  if (reply.percentLeft !== null) {
    console.log(`[ai] scored with labd — ${reply.percentLeft}% of the monthly allowance left`);
  }
  return result;
}
