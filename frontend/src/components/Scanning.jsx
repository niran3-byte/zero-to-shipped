// Shown while the request is in flight. The progress bar is honest about what
// it can know: we cannot read the server's progress, so it eases toward 90% and
// waits there. The real completion is the response arriving, not the bar filling.
import { useEffect, useState } from "react";

const STAGES = ["Uploading…", "Reading text layer…", "Matching skills…", "Scoring…"];

export default function Scanning({ file }) {
  const [pct, setPct] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setPct((current) => (current < 90 ? current + Math.random() * 6 : current));
    }, 220);
    return () => clearInterval(timer);
  }, []);

  const stage = STAGES[Math.min(Math.floor(pct / 25), STAGES.length - 1)];

  return (
    <div className="scanning">
      <div className="scan-file">
        <svg viewBox="0 0 24 24" aria-hidden="true" className="pdf-icon">
          <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5Z" />
          <path d="M14 3v5h5" />
        </svg>
        <span>{file.name}</span>
        <span className="muted">{formatSize(file.size)}</span>
      </div>
      <div
        className="progress"
        role="progressbar"
        aria-labelledby="scan-stage"
        aria-valuemin="0"
        aria-valuemax="100"
        aria-valuenow={Math.round(pct)}
      >
        <div className="progress-bar" style={{ width: `${pct}%` }} />
      </div>
      <p className="scan-stage" id="scan-stage">{stage}</p>
    </div>
  );
}

function formatSize(bytes) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}
