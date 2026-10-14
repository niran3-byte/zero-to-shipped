export default function HowItWorks() {
  return (
    <section id="how" className="how">
      <h2>How it works</h2>
      <ol className="steps">
        <li>
          <span className="step-num">01</span>
          <h3>Upload both sides</h3>
          <p>Your resume as a PDF, and the job description you're targeting, as text.</p>
        </li>
        <li>
          <span className="step-num">02</span>
          <h3>Extract</h3>
          <p>The server reads the PDF's text layer and pulls the skills each document names.</p>
        </li>
        <li>
          <span className="step-num">03</span>
          <h3>Compare and score</h3>
          <p>You get a match score, what the posting asks for that you have, and what you're missing.</p>
        </li>
      </ol>
    </section>
  );
}
