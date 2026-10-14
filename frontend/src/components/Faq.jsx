export default function Faq() {
  return (
    <section id="faq" className="faq">
      <h2>FAQ</h2>
      <details>
        <summary>Where does my resume go?</summary>
        <p>
          To this app's own API. The PDF is parsed in memory and not written to disk.
          The extracted text is stored with the score if a database is configured
          — you can see the database's status on the health endpoint.
        </p>
      </details>
      <details>
        <summary>Does my resume get sent anywhere else?</summary>
        <p>
          Only if the server is configured with an AI scorer, in which case the
          extracted text of your resume and the job description are sent to The Dev
          Labs' AI endpoint to be compared. If it isn't configured, or the AI is
          unreachable, the comparison is done by keyword matching instead and nothing
          leaves this app. Every result says which matcher scored it.
        </p>
      </details>
      <details>
        <summary>Why does the same pair score the same?</summary>
        <p>
          With keyword matching, yes — it's a fixed calculation over the text, not a
          random number: the share of the posting's skills your resume also contains.
          With the AI scorer, expect the number to move a little between runs, because
          a model doesn't answer identically twice.
        </p>
      </details>
      <details>
        <summary>Is this AI?</summary>
        <p>
          If the server has an AI key, yes — the model scores the comparison.
          Without a key, or if the AI is unreachable, it falls back to keyword
          matching. Every result says which matcher scored it.
        </p>
      </details>
    </section>
  );
}
