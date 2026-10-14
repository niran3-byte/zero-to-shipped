import { ApiError } from "../utils.js";

/**
 * The single place an error becomes an HTTP response.
 *
 * Express recognizes this as an error handler because it takes four arguments —
 * that arity is the signal, not the name, so all four must stay. It must also be
 * registered last, after every route.
 *
 * Express 5 forwards rejected promises from async handlers here automatically,
 * which is why the controllers have no try/catch: they just throw.
 */
export function errorHandler(err, _req, res, _next) {
  // Errors we raised deliberately, with their own status and a message meant
  // for the person using the app.
  if (err instanceof ApiError) {
    return res.status(err.status).json({ error: err.message });
  }

  // Multer's own errors arrive here, not as ApiErrors — map the useful ones.
  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(413).json({ error: "That PDF is over 5 MB. Try a smaller export." });
  }
  if (err.code === "LIMIT_UNEXPECTED_FILE") {
    return res.status(400).json({ error: `Unexpected file field '${err.field}'.` });
  }

  // express.json() gives this one a `type` rather than a code.
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ error: "The request body was not valid JSON." });
  }

  // Anything left is a bug on our side: log it in full, tell the client nothing
  // about internals (stack traces in responses leak structure).
  console.error("[error]", err);
  res.status(500).json({ error: "Unexpected server error." });
}
