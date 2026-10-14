// The only place in the app that knows the backend exists.
//
// Requests go to the relative path /api/analyze. In dev, Vite proxies that to
// the Express server on :5000 (see vite.config.js), so the browser never makes a
// cross-origin request. That single detail is why this app has no CORS problem
// and no hard-coded localhost URL baked into the components.

const API_BASE = "/api";

/**
 * Send a resume PDF and a job description to the backend for scoring.
 *
 * @param {File} resume - the PDF the learner picked
 * @param {string} jobDescription - the pasted JD text
 * @returns {Promise<{score:number, found:string[], missing:string[]}>}
 */
export async function analyzeResume(resume, jobDescription) {
  const body = new FormData();
  body.append("resume", resume);
  body.append("jobDescription", jobDescription);

  let res;
  try {
    res = await fetch(`${API_BASE}/analyze`, { method: "POST", body });
  } catch {
    // fetch only rejects when the request never got an answer — server down,
    // proxy target unreachable, no network. A 4xx/5xx resolves normally and is
    // handled below, which is a distinction worth keeping straight.
    throw new Error(
      "Couldn't reach the server. Is the backend running on http://localhost:5000?"
    );
  }

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(data?.error || `The server returned ${res.status}.`);
  }
  return data;
}
