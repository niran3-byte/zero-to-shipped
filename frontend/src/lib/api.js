// The only place in the app that knows where the backend is.
//
// There are two deployments and the base URL differs between them:
//
//   Dev:        VITE_API_URL is unset, so the base is the relative "/api".
//               Vite proxies that to localhost:5000 (see vite.config.js) and the
//               browser only ever talks to :5173 — no cross-origin request at all.
//   Production: VITE_API_URL is set to the backend project's URL, e.g.
//               https://zero-to-shipped-api.vercel.app/api
//               because the frontend is a separate Vercel project on a different
//               origin, and no proxy sits between them.
//
// Vite replaces `import.meta.env.VITE_API_URL` at build time with a literal, so
// this is a build-time decision, not a runtime one: change the variable in Vercel
// and you must redeploy the frontend for it to take effect. Vite only exposes
// variables prefixed with VITE_, which is why it is named that way.

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
    // fetch only rejects when the request never got an answer — server down,
    // DNS failure, no network. It also rejects when CORS blocks the response,
    // which in production means the backend's CLIENT_ORIGIN does not list this
    // site. A 4xx/5xx resolves normally and is handled below, which is a
    // distinction worth keeping straight.
    throw new Error(
      "Couldn't reach the server. Check that the API is running and that this site's URL is allowed by CORS."
    );
  }

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(data?.error || `The server returned ${res.status}.`);
  }
  return data;
}
