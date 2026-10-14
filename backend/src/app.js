import express from "express";
import cors from "cors";
import analyzeRoutes from "./routes/analyze.js";
import { notFound } from "./middleware/notFound.js";
import { errorHandler } from "./middleware/errorHandler.js";

// The Express app lives here, apart from the code that listens.
//
// Why the split: Vercel does not run a listening server. It runs a *function*
// that is handed a request and a response and must return — so it needs to be
// able to `import app` and call it, without this module calling app.listen() as
// a side effect. server.js does the listening; api/index.js is the Vercel
// function. Both build on this one app, which is why there is no second copy of
// the routes to keep in sync.
const app = express();

/**
 * CORS origins. In dev the Vite proxy makes requests same-origin, so this mostly
 * matters once the frontend is deployed somewhere else. CLIENT_ORIGIN accepts a
 * comma-separated list so a preview deploy and the production URL can both be
 * allowed without editing code.
 */
const allowedOrigins = (process.env.CLIENT_ORIGIN || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      // No Origin header: curl, server-to-server, or a same-origin request.
      // Allowing these is correct and is not the same as allowing any website.
      if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
      callback(new Error(`Origin ${origin} is not allowed by CORS.`));
    },
  })
);
app.use(express.json({ limit: "1mb" }));

// Health first, so it answers even if the DB is down.
app.use("/api", analyzeRoutes);

// 404 for anything that matched no route...
app.use(notFound);

// ...and the one place an error becomes a response. Must be registered last.
app.use(errorHandler);

export default app;
