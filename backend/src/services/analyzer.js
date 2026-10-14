// The scoring engine.
//
// This is the "AI part will be added later" seam. Everything above it — the
// route, the model, the frontend — only knows that something takes
// (resumeText, jobDescriptionText) and returns { score, found, missing, source }.
// Swapping keyword matching for a model means changing this file and nothing else,
// and `source` is what lets stored rows tell you which era they came from.

// A vocabulary of skills to look for. Each alias maps to one canonical name, so
// "node", "nodejs" and "node.js" all count as the same skill instead of three.
// Order within an alias list does not matter; matching is longest-first.
const SKILLS = [
  { name: "JavaScript", aliases: ["javascript", "js", "ecmascript"] },
  { name: "TypeScript", aliases: ["typescript", "ts"] },
  { name: "Python", aliases: ["python"] },
  { name: "Java", aliases: ["java"] },
  { name: "C++", aliases: ["c++", "cpp"] },
  { name: "C#", aliases: ["c#", "csharp", ".net"] },
  { name: "Go", aliases: ["golang", "go lang"] },
  { name: "SQL", aliases: ["sql", "mysql", "sqlite"] },
  { name: "PostgreSQL", aliases: ["postgresql", "postgres"] },
  { name: "MongoDB", aliases: ["mongodb", "mongo"] },
  { name: "Redis", aliases: ["redis"] },
  { name: "Git", aliases: ["git", "github", "gitlab", "version control"] },
  { name: "React", aliases: ["react", "react.js", "reactjs"] },
  { name: "Next.js", aliases: ["next.js", "nextjs"] },
  { name: "Vue", aliases: ["vue", "vue.js", "vuejs"] },
  { name: "Angular", aliases: ["angular"] },
  { name: "HTML & CSS", aliases: ["html", "css", "sass", "scss", "tailwind"] },
  { name: "Accessibility", aliases: ["accessibility", "a11y", "wcag"] },
  { name: "Node.js", aliases: ["node.js", "nodejs", "node"] },
  { name: "Express", aliases: ["express", "express.js", "expressjs"] },
  { name: "REST APIs", aliases: ["rest", "restful", "rest api", "rest apis", "api design"] },
  { name: "GraphQL", aliases: ["graphql", "apollo"] },
  { name: "Docker", aliases: ["docker", "containerization", "containers"] },
  { name: "Kubernetes", aliases: ["kubernetes", "k8s"] },
  { name: "CI/CD", aliases: ["ci/cd", "ci cd", "continuous integration", "github actions", "jenkins"] },
  { name: "Testing", aliases: ["testing", "unit test", "jest", "vitest", "pytest", "cypress", "playwright"] },
  { name: "System design", aliases: ["system design", "architecture", "microservices"] },
  { name: "Cloud (AWS/GCP)", aliases: ["aws", "gcp", "azure", "cloud", "s3", "ec2"] },
  { name: "Data structures", aliases: ["data structures", "algorithms", "dsa"] },
  { name: "Agile / Scrum", aliases: ["agile", "scrum", "kanban"] },
  { name: "Machine learning", aliases: ["machine learning", "ml", "tensorflow", "pytorch", "scikit"] },
];

// Lowercase, and collapse anything that separates words so "Node.js", "node js"
// and "nodejs" all reduce to the same haystack.
function normalize(text) {
  return ` ${text.toLowerCase().replace(/[^a-z0-9+#./]+/g, " ").replace(/\s+/g, " ").trim()} `;
}

// Build one regex per alias, longest alias first, so "rest api" wins over "rest".
// The lookarounds stop "java" from matching inside "javascript" and "go" from
// matching inside "good" — a whole-token match, not a substring one.
function hit(haystack, alias) {
  const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(?<![a-z0-9])${escaped}(?![a-z0-9])`).test(haystack);
}

function skillExistsIn(haystack, skill) {
  return skill.aliases.some((alias) => hit(haystack, alias));
}

/**
 * @param {string} resumeText
 * @param {string} jobDescriptionText
 * @returns {{ score:number, found:string[], missing:string[], source:string }}
 */
export function scoreResume(resumeText, jobDescriptionText) {
  const jd = normalize(jobDescriptionText);
  const resume = normalize(resumeText);

  // Only score against what the posting actually asks for. A skill the resume
  // lists that the JD never mentions is not part of this comparison.
  const required = SKILLS.filter((skill) => skillExistsIn(jd, skill));

  if (required.length === 0) {
    // Nothing recognizable in the JD. Returning 0 with everything "missing"
    // would be a confident wrong answer; say so and let the UI explain.
    return {
      score: 0,
      found: [],
      missing: [],
      source: "keyword",
      note: "No recognized skills were found in the job description.",
    };
  }

  const found = [];
  const missing = [];
  for (const skill of required) {
    (skillExistsIn(resume, skill) ? found : missing).push(skill.name);
  }

  const score = Math.round((found.length / required.length) * 100);

  return { score, found, missing, source: "keyword" };
}
