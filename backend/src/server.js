import "dotenv/config";
import express from "express";
import cors from "cors";
import analyzeRoutes from "./routes/analyze.js";
import { connectDB } from "./config/db.js";
import { notFound } from "./middleware/notFound.js";
import { errorHandler } from "./middleware/errorHandler.js";

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

// 404 for anything that matched no route...
app.use(notFound);

// ...and the one place an error becomes a response. Must be registered last.
app.use(errorHandler);

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
