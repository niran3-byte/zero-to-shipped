/* 0 to Shipped — Resume Parser (front-end mock)
 *
 * There is no server, so nothing here reads the inside of your PDF. The file is
 * used only for its name and size, and those are hashed into a seed that drives
 * a deterministic "parse": the same file always produces the same score and the
 * same skill lists. Swap `analyze()` for a real fetch() when you have a backend.
 */

/* ── What a reviewer looks for, and how much each one is worth ── */
const SKILLS = [
  // core language / fundamentals
  { name: "JavaScript", weight: 10 },
  { name: "TypeScript", weight: 7 },
  { name: "Python", weight: 8 },
  { name: "SQL", weight: 8 },
  { name: "Git", weight: 6 },
  // front end
  { name: "React", weight: 8 },
  { name: "HTML & CSS", weight: 5 },
  { name: "Accessibility", weight: 4 },
  // back end / data
  { name: "Node.js", weight: 6 },
  { name: "REST APIs", weight: 7 },
  { name: "PostgreSQL", weight: 5 },
  { name: "Docker", weight: 5 },
  { name: "CI/CD", weight: 4 },
  // signals that separate strong resumes
  { name: "Testing", weight: 6 },
  { name: "System design", weight: 5 },
  { name: "Cloud (AWS/GCP)", weight: 5 },
  { name: "Data structures", weight: 4 },
  { name: "Agile / Scrum", weight: 3 },
];

/* ── Elements ───────────────────────────────────────────────── */
const els = {
  form: document.getElementById("upload-form"),
  dropzone: document.getElementById("dropzone"),
  input: document.getElementById("file-input"),
  error: document.getElementById("error"),
  scanning: document.getElementById("scanning"),
  progress: document.getElementById("progress"),
  progressBar: document.getElementById("progress-bar"),
  scanStage: document.getElementById("scan-stage"),
  scanFilename: document.getElementById("scan-filename"),
  scanFilesize: document.getElementById("scan-filesize"),
  results: document.getElementById("results"),
  ringFill: document.getElementById("ring-fill"),
  scoreValue: document.getElementById("score-value"),
  headline: document.getElementById("score-headline"),
  summary: document.getElementById("score-summary"),
  haveList: document.getElementById("have-list"),
  missingList: document.getElementById("missing-list"),
  haveCount: document.getElementById("have-count"),
  missingCount: document.getElementById("missing-count"),
  reset: document.getElementById("reset"),
};

const RING_CIRCUMFERENCE = 2 * Math.PI * 52; // r = 52 in the SVG
const MAX_BYTES = 5 * 1024 * 1024;

/* ── Deterministic pseudo-randomness ──────────────────────────
 * A tiny hash turns "name + size" into a number, and mulberry32 turns that
 * number into a repeatable stream of 0..1 values. Same file → same result.
 */
function hashString(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ── The "parse" ────────────────────────────────────────────── */
function analyze(file) {
  const rand = mulberry32(hashString(file.name + ":" + file.size));

  // Every skill has a chance of being "found"; higher-weight skills are found
  // slightly more often, so the demo skews toward plausible resumes.
  const found = SKILLS.filter((s) => rand() < 0.3 + s.weight / 20);

  // Guard against an implausibly empty or full result.
  if (found.length < 4) {
    SKILLS.slice(0, 5).forEach((s) => found.indexOf(s) === -1 && found.push(s));
  }

  const missing = SKILLS.filter((s) => !found.includes(s));

  const totalWeight = SKILLS.reduce((sum, s) => sum + s.weight, 0);
  const earnedWeight = found.reduce((sum, s) => sum + s.weight, 0);
  const score = Math.round((earnedWeight / totalWeight) * 100);

  return { found, missing, score };
}

function verdict(score) {
  if (score >= 85) {
    return {
      headline: "Strong resume — ready to send",
      summary:
        "You cover almost everything a reviewer scans for. Tighten the bullet points so the impact numbers are impossible to miss.",
      color: "var(--accent)",
    };
  }
  if (score >= 65) {
    return {
      headline: "Solid, with visible gaps",
      summary:
        "The fundamentals are there. Close two or three of the missing skills — ideally with a shipped project — and this jumps a tier.",
      color: "var(--accent-2)",
    };
  }
  if (score >= 40) {
    return {
      headline: "Workable, but it reads thin",
      summary:
        "A reviewer will see the basics and stop. Add the missing tools to real projects before you list them here.",
      color: "var(--warn)",
    };
  }
  return {
    headline: "Needs work before it goes out",
    summary:
      "Too many expected skills are absent. Build one project that touches the missing list, then rewrite the resume around it.",
    color: "var(--danger)",
  };
}

/* ── Rendering ──────────────────────────────────────────────── */
function formatSize(bytes) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

function fillChips(listEl, names, variant) {
  listEl.innerHTML = "";
  listEl.className = "chips " + variant;
  names.forEach((name, i) => {
    const li = document.createElement("li");
    li.textContent = name;
    li.style.animationDelay = Math.min(i * 45, 600) + "ms";
    listEl.appendChild(li);
  });
}

function showResults(file, result) {
  const v = verdict(result.score);

  els.scanning.hidden = true;
  els.form.hidden = true;
  els.results.hidden = false;

  els.headline.textContent = v.headline;
  els.summary.textContent = v.summary;
  els.ringFill.style.stroke = v.color;

  els.haveCount.textContent = result.found.length;
  els.missingCount.textContent = result.missing.length;
  fillChips(els.haveList, result.found.map((s) => s.name), "chips-have");
  fillChips(els.missingList, result.missing.map((s) => s.name), "chips-missing");

  // Animate the ring: draw it, and count the number up alongside.
  const circumference = RING_CIRCUMFERENCE;
  els.ringFill.style.strokeDasharray = circumference;
  els.ringFill.style.strokeDashoffset = circumference;
  requestAnimationFrame(() => {
    els.ringFill.style.strokeDashoffset =
      circumference - (circumference * result.score) / 100;
  });

  const duration = 1000;
  const start = performance.now();
  function tick(now) {
    const t = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - t, 3);
    els.scoreValue.textContent = Math.round(eased * result.score);
    if (t < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

/* ── The upload flow ────────────────────────────────────────── */
const STAGES = [
  "Uploading…",
  "Reading text layer…",
  "Matching skills…",
  "Scoring…",
];

function showError(message) {
  els.error.textContent = message;
  els.error.hidden = false;
}

function clearError() {
  els.error.hidden = true;
  els.error.textContent = "";
}

function validate(file) {
  const looksLikePdf =
    file.type === "application/pdf" || /\.pdf$/i.test(file.name);
  if (!looksLikePdf) return "That's not a PDF. Export your resume as a PDF and try again.";
  if (file.size > MAX_BYTES) return "That file is over 5 MB. Try a smaller export.";
  if (file.size === 0) return "That file is empty.";
  return null;
}

function handleFile(file) {
  if (!file) return;
  clearError();

  const problem = validate(file);
  if (problem) {
    showError(problem);
    els.input.value = ""; // let them re-pick the same file after fixing it
    return;
  }

  // Scanning state
  els.form.hidden = true;
  els.results.hidden = true;
  els.scanning.hidden = false;
  els.scanFilename.textContent = file.name;
  els.scanFilesize.textContent = formatSize(file.size);
  els.progressBar.style.width = "0%";
  els.progress.setAttribute("aria-valuenow", "0");

  // Animate a fake progress bar through the stages. In a real build each tick
  // would be a fetch() to your parser endpoint.
  let step = 0;
  const totalSteps = 24;
  const timer = setInterval(() => {
    step++;
    const pct = Math.round((step / totalSteps) * 100);
    els.progressBar.style.width = pct + "%";
    els.progress.setAttribute("aria-valuenow", String(pct));
    els.scanStage.textContent =
      STAGES[Math.min(Math.floor((step / totalSteps) * STAGES.length), STAGES.length - 1)];

    if (step >= totalSteps) {
      clearInterval(timer);
      setTimeout(() => showResults(file, analyze(file)), 250);
    }
  }, 60);
}

/* ── Events ─────────────────────────────────────────────────── */
els.input.addEventListener("change", (e) => handleFile(e.target.files[0]));

["dragenter", "dragover"].forEach((type) =>
  els.dropzone.addEventListener(type, (e) => {
    e.preventDefault();
    els.dropzone.classList.add("is-dragging");
  })
);

["dragleave", "drop"].forEach((type) =>
  els.dropzone.addEventListener(type, (e) => {
    e.preventDefault();
    els.dropzone.classList.remove("is-dragging");
  })
);

els.dropzone.addEventListener("drop", (e) => {
  const file = e.dataTransfer.files[0];
  handleFile(file);
});

// The dropzone is a <label for="file-input">, so a click opens the picker for
// free. Enter/Space needs handling by hand because it is not a real button.
els.dropzone.addEventListener("keydown", (e) => {
  if (e.key === "Enter" || e.key === " ") {
    e.preventDefault();
    els.input.click();
  }
});

// Don't let the browser navigate away when a file misses the dropzone.
window.addEventListener("dragover", (e) => e.preventDefault());
window.addEventListener("drop", (e) => e.preventDefault());

els.reset.addEventListener("click", () => {
  clearError();
  els.input.value = "";
  els.results.hidden = true;
  els.scanning.hidden = true;
  els.form.hidden = false;
  els.ringFill.style.strokeDashoffset = RING_CIRCUMFERENCE;
  els.scoreValue.textContent = "0";
  document.getElementById("analyze").scrollIntoView({ block: "start" });
});
