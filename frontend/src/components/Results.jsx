// The score ring, the two skill lists, and the reset button.
//
// The ring writes to a CSS variable instead of mutating the DOM: React re-renders
// the component when `score` changes, the dashoffset is computed from it during
// render, and the transition in styles.css animates the difference. The count-up
// is done by animating a small piece of SCORE STATE here, because a number React
// never re-renders cannot move.
import { useEffect, useState } from "react";
import { verdict } from "../lib/verdict.js";

const RING_CIRCUMFERENCE = 2 * Math.PI * 52; // r = 52 in the SVG

export default function Results({ result, onReset }) {
  const { score, found, missing, source } = result;
  const v = verdict(score);
  const displayed = useCountUp(score);

  return (
    <div className="results">
      <div className="score-block">
        <div className="ring">
          <svg viewBox="0 0 120 120" aria-hidden="true">
            <circle className="ring-track" cx="60" cy="60" r="52" />
            <circle
              className="ring-fill"
              cx="60"
              cy="60"
              r="52"
              style={{
                stroke: v.color,
                strokeDasharray: RING_CIRCUMFERENCE,
                strokeDashoffset:
                  RING_CIRCUMFERENCE - (RING_CIRCUMFERENCE * score) / 100,
              }}
            />
          </svg>
          <div className="ring-label">
            <span className="ring-score">{displayed}</span>
            <span className="ring-max">/ 100</span>
          </div>
        </div>
        <div className="score-text">
          <h2>{v.headline}</h2>
          <p className="muted">{v.summary}</p>
        </div>
      </div>

      <div className="skills-grid">
        <SkillColumn
          title="Skills found"
          variant="have"
          names={found}
          emptyText="No matching skills — the posting and the resume look unrelated."
        />
        <SkillColumn
          title="Missing"
          variant="missing"
          names={missing}
          emptyText="Nothing missing. This resume covers the whole posting."
        />
      </div>

      <div className="results-actions">
        <button className="btn btn-primary" type="button" onClick={onReset}>
          Analyze another
        </button>
        <p className="note muted">
          {source === "ai"
            ? "Scored by the AI matcher."
            : "Scored by keyword matching — no AI model involved yet."}
        </p>
      </div>
    </div>
  );
}

function SkillColumn({ title, variant, names, emptyText }) {
  return (
    <div className="skill-col">
      <h3>
        <span className={`dot dot-${variant}`} /> {title}
        <span className="count">{names.length}</span>
      </h3>
      {names.length > 0 ? (
        <ul className={`chips chips-${variant}`}>
          {names.map((name, i) => (
            <li
              key={name}
              style={{ animationDelay: `${Math.min(i * 45, 600)}ms` }}
            >
              {name}
            </li>
          ))}
        </ul>
      ) : (
        <p className="muted empty-note">{emptyText}</p>
      )}
    </div>
  );
}

// Eases a displayed number from 0 to `target` on mount / whenever it changes.
function useCountUp(target, duration = 1000) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    let frame;
    const start = performance.now();

    function tick(now) {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(Math.round(eased * target));
      if (t < 1) frame = requestAnimationFrame(tick);
    }

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, duration]);

  return value;
}
