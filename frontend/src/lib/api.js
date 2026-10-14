// The only place in the app that knows where the backend is.
//
// One origin, two deployments:
//
//   Dev:  the base is the relative "/api". Vite proxies that to localhost:5000
//         (see vite.config.js), so the browser only ever talks to :5173.
//   Prod: the base is still the relative "/api". Vercel services put the backend
//         and the frontend on ONE domain, and the top-level rewrite sends
//         /api/* to the backend service — so this is a same-origin request too.
//
// That sameness is the point: because the path is relative in both places, there
// is no hostname to configure and no CORS preflight, in dev or in production.
// Nothing to set in the Vercel dashboard, and nothing that can drift when a
// preview URL changes.
//
// VITE_API_URL exists only as an escape hatch — for pointing the app at a
// backend on a different origin (a locally-run API while the frontend is
// deployed, say). Vite inlines it at build time, so changing it needs a
// redeploy, and it must carry the host: https://example.com/api

const API_BASE = import.meta.env.VITE_API_URL || "/api";

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
    // fetch only rejects when no response arrived at all: server down, DNS
    // failure, no network. A 4xx/5xx resolves normally and is handled below,
    // which is a distinction worth keeping straight.
    throw new Error(
      "Couldn't reach the server. Check that the API is running, then try again."
    );
  }

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(data?.error || `The server returned ${res.status}.`);
  }
  return data;
}
