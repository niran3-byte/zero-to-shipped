import { Router } from "express";
import { uploadResume } from "../middleware/upload.js";
import { analyzeResume, health } from "../controllers/analyzeController.js";

// Routes are wiring only: they name a path, the middleware that prepares the
// request, and the controller that handles it. All the logic lives one layer
// down, so this file stays readable as a map of the API.
const router = Router();

// POST /api/analyze
// multipart/form-data: field "resume" (the PDF file) + field "jobDescription" (text)
router.post("/analyze", uploadResume, analyzeResume);

// GET /api/health
router.get("/health", health);

export default router;
