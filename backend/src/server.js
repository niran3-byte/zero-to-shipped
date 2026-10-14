import "dotenv/config";
import app from "./app.js";
import { connectDB } from "./config/db.js";

// Local development entry point. It loads .env (Vercel injects env vars itself,
// so the serverless function doesn't need dotenv), connects to MongoDB once at
// boot, and listens on a port.
//
// The app itself lives in app.js so the Vercel function can import it without
// this file's listen() side effect. Run this file for local dev; Vercel runs
// api/index.js instead.

const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/zero_to_shipped";

// Connecting is awaited but non-fatal on purpose: the API works without it.
const dbUp = await connectDB(MONGODB_URI);
if (!dbUp) {
  console.warn(
    "[db] running WITHOUT persistence — analyses will not be saved. " +
      "Start MongoDB locally and restart to enable it."
  );
}

app.listen(PORT, () => {
  console.log(`[api] listening on http://localhost:${PORT}`);
});
