import { Router } from "express";
import multer from "multer";
import { extractText } from "../services/pdf.js";
import { scoreResume } from "../services/analyzer.js";
import { isDbConnected } from "../config/db.js";
import Analysis from "../models/Analysis.js";

const router = Router();

// Memory storage, not disk: the PDF lives as a Buffer for the length of the
// request and is never written anywhere. That is a simpler privacy story than
// a temp file you then have to remember to delete (and a stored XSS/upload
// risk you have to defend against if you do write it).
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB, matching the frontend's check
  fileFilter(_req, file, cb) {
    const isPdf =
      file.mimetype === "application/pdf" || /\.pdf$/i.test(file.originalname);
    // Pass a flag, not an Error: multer passes Errors through to the global
    // handler as 500s, but a wrong file type is the client's mistake — a 400.
    cb(null, isPdf);
  },
});

// POST /api/analyze
// multipart/form-data: field "resume" (the PDF file) + field "jobDescription" (text)
router.post("/analyze", upload.single("resume"), async (req, res) => {
  try {
    const jobDescription = (req.body?.jobDescription ?? "").trim();

    if (!req.file) {
      return res.status(400).json({
        error: "Attach a resume PDF in the 'resume' field. PDFs only, up to 5 MB.",
      });
    }
    if (jobDescription.length < 20) {
      return res
        .status(400)
        .json({ error: "Paste the job description — it's the other half of the comparison." });
    }

    // Slow, CPU-bound work (pdf.js in a worker) — awaited, never blocked on.
    const resumeText = await extractText(req.file.buffer);

    if (!resumeText.trim()) {
      return res.status(422).json({
        error:
          "No text layer in that PDF — it's probably a scan or an image export. Export a text-based PDF and try again.",
      });
    }

    const result = scoreResume(resumeText, jobDescription);

    // Persistence is best-effort. Passing through the database not being up
    // means the learner still gets their score — this is the behaviour that
    // makes the app useful before mongod is running.
    if (isDbConnected()) {
      try {
        await Analysis.create({
          resumeFilename: req.file.originalname,
          jobDescriptionText: jobDescription,
          resumeText,
          score: result.score,
          found: result.found,
          missing: result.missing,
          source: result.source,
        });
      } catch (err) {
        console.warn(`[db] could not save analysis: ${err.message}`);
      }
    } else {
      console.warn("[db] not connected — returning the score without saving it");
    }

    res.json(result);
  } catch (err) {
    console.error("[analyze] failed:", err);
    res.status(500).json({ error: "Something went wrong reading that PDF." });
  }
});

// A cheap liveness probe that also reports whether the DB is attached.
router.get("/health", (_req, res) => {
  res.json({ ok: true, db: isDbConnected() ? "connected" : "disconnected" });
});

export default router;
