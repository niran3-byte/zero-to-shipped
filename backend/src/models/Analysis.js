import mongoose from "mongoose";

// One document per analysis. Note what is NOT here: the uploaded PDF. The file
// is parsed in memory and discarded; only the extracted text and the result are
// kept, which is the smaller, less sensitive thing to store.
const analysisSchema = new mongoose.Schema(
  {
    resumeFilename: { type: String, required: true },
    jobDescriptionText: { type: String, required: true },
    resumeText: { type: String, required: true },
    score: { type: Number, required: true, min: 0, max: 100 },
    found: { type: [String], default: [] },
    missing: { type: [String], default: [] },
    // Which matcher produced this, so keyword-era rows stay identifiable once
    // the AI scorer is added and old and new rows can be compared.
    source: { type: String, default: "keyword" },
  },
  { timestamps: true }
);

export default mongoose.model("Analysis", analysisSchema);
