// The labd client — the one place in this project that knows how to talk to
// The Dev Labs' AI endpoint.
//
// This file lives in the backend on purpose. labd does not answer browsers on
// other sites, so a key shipped to the React app is a key anyone who opens dev
// tools can copy, and it would spend that person's allowance. The key stays in
// process.env on the server; the frontend only ever sees the score.
//
// Nothing is remembered between calls, so the caller sends the whole
// conversation every time — for scoring, that is a single user message.

const API_URL = "https://agent.thedevlabs.io/v1/api/chat";

// Vercel caps this function at 30s (backend/vercel.json). Stopping at 20s leaves
// room for the keyword fallback to still return something useful rather than
// having the whole request killed by the platform.
const TIMEOUT_MS = 20_000;

// The status codes labd documents, said in words a learner can act on.
const STATUS_MESSAGES = {
  401: "labd rejected the API key (401) — it is wrong or revoked.",
  402: "The labd allowance is used up (402) — top up at learn.thedevlabs.io/settings#get-more-labd.",
  403: "The labd API is switched off for The Dev Labs right now (403).",
  429: "labd is rate limiting this minute (429) — try again shortly.",
};

/** A failure that came from our side of the call, with labd's status if there was one. */
export class LabdError extends Error {
  constructor(message, status = null) {
    super(message);
    this.name = "LabdError";
    this.status = status;
  }
}

/** True when a key is present, which is what decides between the AI and keyword matchers. */
export function isLabdConfigured() {
  return Boolean(process.env.LABD_API_KEY);
}

/**
 * One turn with labd.
 *
 * @param {{role: "user"|"assistant", content: string}[]} messages - ends on the user's turn
 * @returns {Promise<{content: string, percentLeft: number|null}>}
 * @throws {LabdError} when there is no key, no reachable endpoint, or an error status
 */
export async function chat(messages) {
  const apiKey = process.env.LABD_API_KEY;
  if (!apiKey) throw new LabdError("LABD_API_KEY is not set.");

  let res;
  try {
    res = await fetch(API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`, // the key travels here, and only here
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ messages }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (err) {
    // fetch only rejects when no response arrives at all: DNS, no network, or
    // our own timeout firing. A 4xx/5xx resolves normally and is handled below.
    throw new LabdError(`Could not reach labd: ${err.message}`);
  }

  if (!res.ok) {
    throw new LabdError(
      STATUS_MESSAGES[res.status] ?? `labd returned ${res.status}.`,
      res.status
    );
  }

  const data = await res.json().catch(() => null);
  const content = data?.message?.content;
  if (typeof content !== "string" || !content.trim()) {
    throw new LabdError("labd answered with an empty message.");
  }

  // credits.percentLeft is what remains of the learner's allowance — the same
  // pool as labd in the portal, the editor and the terminal.
  return { content, percentLeft: data?.credits?.percentLeft ?? null };
}
