import { useState } from "react";
import Header from "./components/Header.jsx";
import UploadForm from "./components/UploadForm.jsx";
import Scanning from "./components/Scanning.jsx";
import Results from "./components/Results.jsx";
import HowItWorks from "./components/HowItWorks.jsx";
import Faq from "./components/Faq.jsx";
import { analyzeResume } from "./lib/api.js";

// The whole upload flow is one state machine: exactly one of these is on screen
// at a time. In the vanilla version that was four `hidden` attributes being
// toggled by hand from three different places, and it was easy to leave two
// visible at once. One `status` string makes the impossible states unrepresentable.
//   idle → scanning → done
//         ↘ scanning → error (back to idle on retry)
export default function App() {
  const [status, setStatus] = useState("idle"); // idle | scanning | done | error
  const [result, setResult] = useState(null);
  const [file, setFile] = useState(null);
  const [error, setError] = useState("");

  async function handleAnalyze({ file: picked, jobDescription }) {
    setFile(picked);
    setError("");
    setStatus("scanning");
    try {
      const data = await analyzeResume(picked, jobDescription);
      setResult(data);
      setStatus("done");
    } catch (err) {
      setError(err.message);
      setStatus("error");
    }
  }

  function handleReset() {
    setResult(null);
    setFile(null);
    setError("");
    setStatus("idle");
    document.getElementById("analyze")?.scrollIntoView({ block: "start" });
  }

  return (
    <>
      <Header />
      <main id="top">
        <section className="hero">
          <p className="eyebrow">Resume parser</p>
          <h1>
            Know exactly what your resume is <span className="grad">missing</span>.
          </h1>
          <p className="lede">
            Drop in your PDF and the job description you're going for. Get a match
            score out of 100, the skills you already cover, and the ones the posting
            asks for that your resume doesn't mention.
          </p>
        </section>

        <section id="analyze" className="panel">
          {status === "idle" && <UploadForm onSubmit={handleAnalyze} />}
          {status === "scanning" && <Scanning file={file} />}
          {status === "done" && <Results result={result} onReset={handleReset} />}
          {status === "error" && (
            <div className="failed">
              <p className="error" role="alert">
                {error}
              </p>
              <button className="btn btn-primary" type="button" onClick={handleReset}>
                Try again
              </button>
            </div>
          )}
        </section>

        <HowItWorks />
        <Faq />
      </main>

      <footer className="site-footer">
        <p>0 to Shipped · a resume-to-job-description matcher.</p>
      </footer>
    </>
  );
}
