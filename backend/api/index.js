import app from "../src/app.js";
import { connectDB } from "../src/config/db.js";

// The Vercel entry point: a serverless function, not a server.
//
// Vercel hands this module a request and a response and expects it to return.
// There is no app.listen() here — that is server.js's job locally. Vercel also
// discovers this file automatically for any path under /api, so it needs no
// "builds" entry in vercel.json.
//
// The database connection is the part serverless changes most. On a long-running
// server you connect once at boot; here every cold start is a fresh process, and
// the function may be frozen between requests. So we connect lazily — on the
// first request that needs it — and reuse the connection if the instance is
// still warm. `connecting` caches the in-flight promise, so ten requests
// arriving at a cold instance share one connection rather than opening ten.
let connecting = null;

async function ensureDb() {
  if (!process.env.MONGODB_URI) return false;
  if (!connecting) {
    connecting = connectDB(process.env.MONGODB_URI);
  }
  return connecting;
}

export default async function handler(req, res) {
  // Connect before handling, but never fatal: a database that is down must not
  // stop someone getting their score.
  try {
    await ensureDb();
  } catch (err) {
    console.warn("[db] connect failed on serverless start:", err.message);
  }
  return app(req, res);
}
