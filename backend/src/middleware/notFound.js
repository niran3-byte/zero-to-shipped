import { ApiError } from "../utils.js";

// Runs when no route matched. Turning it into an ApiError means the one error
// handler below is the only place that formats an error response.
export function notFound(req, _res, next) {
  next(new ApiError(404, `No route for ${req.method} ${req.originalUrl}`));
}
