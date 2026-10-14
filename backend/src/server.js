import "dotenv/config";
import express from "express";
import cors from "cors";
import analyzeRoutes from "./routes/analyze.js";
import { connectDB } from "./config/db.js";

const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/zero_to_shipped";

const app = express();

// In dev the frontend talks to Vite (:5173) and Vite proxies /api to us, so the
// browser never makes a cross-origin request. CORS is still allowed here so you
// can curl :5000 or point a different client at it during development.
app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
  })
);
app.use(express.json({ limit: "1mb" }));

// Health first, so `curl localhost:5000/api/health` answers even if the DB is down.
app.use("/api", analyzeRoutes);

// Multer rejects an oversized upload with this code; translate it into a message
// the frontend can show rather than a bare 500.
app.use((err, _req, res, _next) => {
  console.error("[error]", err);
  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(413).json({ error: "That PDF is over 5 MB. Try a smaller export." });
  }
  res.status(500).json({ error: "Unexpected server error." });
});

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
