// Small shared helpers. Anything used from more than one layer belongs here
// rather than being copied into two controllers.

/**
 * An error that carries the HTTP status it should produce.
 *
 * Throwing `new ApiError(400, "...")` deep in a controller means the failure
 * message travels up to the error handler intact, and the status is decided at
 * the point that knows why it failed — instead of the controller doing
 * `res.status(400).json(...)` and returning early from every branch.
 */
export class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

/** True if an uploaded file looks like a PDF, by MIME type or extension. */
export function isPdfFile(file) {
  return file.mimetype === "application/pdf" || /\.pdf$/i.test(file.originalname);
}
