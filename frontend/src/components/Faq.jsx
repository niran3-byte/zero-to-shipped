export default function Faq() {
  return (
    <section id="faq" className="faq">
      <h2>FAQ</h2>
      <details>
        <summary>Where does my resume go?</summary>
        <p>
          To the API on your own machine, for the length of the request. The file is
          parsed in memory and not written to disk. Only the extracted text and the
          score are stored, if a database is configured.
        </p>
      </details>
      <details>
        <summary>Why does the same pair always score the same?</summary>
        <p>
          The score is keyword coverage, not a random number: it's the share of the
          posting's skills that your resume's text also contains. Same resume, same
          posting, same score.
        </p>
      </details>
      <details>
        <summary>Is this AI?</summary>
        <p>
          Not yet. The current matcher is deterministic keyword matching, which is why
          it's fast, free and predictable. The scoring step is isolated behind the
          analyzer service so a model can replace it without touching the API route.
        </p>
      </details>
    </section>
  );
}
