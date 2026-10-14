// Score → headline, summary and colour. Presentation lives in the frontend, so
// the backend stays a plain data service: it returns numbers and skill names,
// and this decides how they read on screen.

export function verdict(score) {
  if (score >= 85) {
    return {
      headline: "Strong match — ready to send",
      summary:
        "The posting's expected skills are nearly all covered by your resume. Tighten the bullet points so the impact numbers are impossible to miss.",
      color: "var(--accent)",
    };
  }
  if (score >= 65) {
    return {
      headline: "Solid, with visible gaps",
      summary:
        "Most of what the job asks for is in there. Close two or three of the missing skills — ideally with a shipped project — and this jumps a tier.",
      color: "var(--accent-2)",
    };
  }
  if (score >= 40) {
    return {
      headline: "Workable, but it reads thin",
      summary:
        "A reviewer comparing you to this posting will see the basics and stop. Add the missing tools to real projects before you list them here.",
      color: "var(--warn)",
    };
  }
  return {
    headline: "Needs work before it goes out",
    summary:
      "Too many of the skills this posting asks for are absent. Build one project that touches the missing list, then rewrite the resume around it.",
    color: "var(--danger)",
  };
}
