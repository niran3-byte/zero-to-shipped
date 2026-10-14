import multer from "multer";
import { isPdfFile } from "../utils.js";

// Memory storage, not disk: the PDF lives as a Buffer for the length of the
// request and is never written anywhere. That is a simpler privacy story than a
// temp file you then have to remember to delete (and a stored-upload risk you
// would have to defend against if you did write it).
//
// Exported as ready-made middleware so the route reads as a list of steps
// (`uploadResume, analyzeResume`) rather than as configuration.
export const uploadResume = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB, matching the frontend's check
  fileFilter(_req, file, cb) {
    // Pass a flag, not an Error: multer passes Errors through to the global
    // handler as 500s, but a wrong file type is the client's mistake — a 400,
    // which the controller turns into a proper message when req.file is absent.
    cb(null, isPdfFile(file));
  },
}).single("resume");
