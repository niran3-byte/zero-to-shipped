import { useRef, useState } from "react";

// The picker + drop target + JD box. It owns nothing about the request: it
// validates the file, then hands { file, jobDescription } up to App, which is
// where the single piece of "what is happening right now" state lives.

// 4 MB, not 5: the API runs on Vercel, which caps a request body at 4.5 MB before
// it reaches the server. Checking against the same number the server enforces
// means an oversized file is stopped here, with a clear message, instead of
// dying at the platform edge as an unexplained failure.
const MAX_BYTES = 4 * 1024 * 1024;

function validate(file) {
  const looksLikePdf = file.type === "application/pdf" || /\.pdf$/i.test(file.name);
  if (!looksLikePdf) return "That's not a PDF. Export your resume as a PDF and try again.";
  if (file.size > MAX_BYTES) return "That file is over 4 MB. Try a smaller export.";
  if (file.size === 0) return "That file is empty.";
  return null;
}

export default function UploadForm({ onSubmit }) {
  const [file, setFile] = useState(null);
  const [jobDescription, setJobDescription] = useState("");
  const [error, setError] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef(null);

  // One code path for both inputs: click-to-browse and drag-and-drop.
  function accept(candidate) {
    if (!candidate) return;
    const problem = validate(candidate);
    if (problem) {
      setError(problem);
      setFile(null);
      if (inputRef.current) inputRef.current.value = ""; // allow re-picking the same file
      return;
    }
    setError("");
    setFile(candidate);
  }

  function handleSubmit(event) {
    event.preventDefault();
    if (!file) {
      setError("Pick a resume PDF first.");
      return;
    }
    if (jobDescription.trim().length < 20) {
      setError("Paste the job description too — it's the other half of the comparison.");
      return;
    }
    onSubmit({ file, jobDescription });
  }

  return (
    <form className="upload-flow" onSubmit={handleSubmit} noValidate>
      <label
        className={"dropzone" + (isDragging ? " is-dragging" : "")}
        htmlFor="file-input"
        tabIndex={0}
        onDragEnter={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          setIsDragging(false);
        }}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          accept(e.dataTransfer.files[0]);
        }}
        onKeyDown={(e) => {
          // A <label> is not a real button, so Enter/Space needs handling by hand.
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
      >
        <input
          ref={inputRef}
          type="file"
          id="file-input"
          accept="application/pdf,.pdf"
          hidden
          onChange={(e) => accept(e.target.files[0])}
        />
        <svg className="dropzone-icon" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 16V4m0 0L7.5 8.5M12 4l4.5 4.5" />
          <path d="M4 15v3a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3v-3" />
        </svg>
        <span className="dropzone-title">
          {file ? file.name : "Drop your resume here"}
        </span>
        <span className="dropzone-sub">
          {file ? "PDF selected — drop another to replace it" : "or browse — PDF only, up to 4 MB"}
        </span>
      </label>

      <label className="field">
        <span className="field-label">Job description</span>
        <textarea
          className="jd-input"
          rows={6}
          placeholder="Paste the job posting here — the responsibilities and required skills."
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
        />
      </label>

      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}

      <button className="btn btn-primary" type="submit" disabled={!file}>
        Analyze resume
      </button>
    </form>
  );
}
