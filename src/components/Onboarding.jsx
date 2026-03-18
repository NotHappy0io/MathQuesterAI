import { useState } from "react";
import { useApp } from "../store/AppContext";

const AVATARS = [
  "🦊",
  "🐱",
  "🐶",
  "🦁",
  "🐼",
  "🦄",
  "🐸",
  "🐵",
  "🦉",
  "🐯",
  "🧙",
  "🥷",
  "👑",
  "🎯",
  "🚀",
  "🎮",
];
const GRADES = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];

const GRADE_LABELS = {
  1: "1st Grade",
  2: "2nd Grade",
  3: "3rd Grade",
  4: "4th Grade",
  5: "5th Grade",
  6: "6th Grade",
  7: "7th Grade",
  8: "8th Grade",
  9: "9th Grade (Freshman)",
  10: "10th Grade (Sophomore)",
  11: "11th Grade (Junior)",
  12: "12th Grade (Senior)",
};

const GRADE_TOPICS = {
  1: "Counting, basic addition & subtraction",
  2: "Addition, subtraction, intro to multiplication",
  3: "Multiplication, division, fractions intro",
  4: "Multi-digit operations, fractions, decimals",
  5: "Fractions, decimals, volume, coordinates",
  6: "Ratios, percents, integers, expressions",
  7: "Proportions, algebra basics, geometry",
  8: "Linear equations, functions, Pythagorean theorem",
  9: "Algebra I — equations, inequalities, graphing",
  10: "Geometry — proofs, trig intro, circles",
  11: "Algebra II / Pre-Calc — polynomials, logs, trig",
  12: "Calculus / Statistics — limits, derivatives, integrals",
};

export default function Onboarding() {
  const { dispatch } = useApp();
  const [step, setStep] = useState("welcome"); // welcome, grade, name
  const [grade, setGrade] = useState(null);
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState("🦊");

  function handleFinish() {
    if (!name.trim() || !grade) return;
    dispatch({
      type: "SETUP_USER",
      payload: { name: name.trim(), grade, avatar, plan: "free" },
    });
  }

  return (
    <div className="onboarding-screen">
      <div className="onboarding-container">
        {step === "welcome" && (
          <div className="ob-step ob-welcome">
            <div className="ob-logo">📐</div>
            <h1 className="ob-title">MathQuest</h1>
            <p className="ob-subtitle">Your AI-Powered Math Tutor</p>
            <p className="ob-desc">
              Get instant help with any math problem. Three AI models for every
              need — from quick tips to deep explanations.
            </p>
            <div className="ob-models-preview">
              <div className="ob-model-chip fast">⚡ Fast · Free</div>
              <div className="ob-model-chip advanced">
                🧠 Advanced · 5 credits
              </div>
              <div className="ob-model-chip pro">🚀 Pro · 10 credits</div>
            </div>
            <button
              className="btn btn-primary btn-lg"
              onClick={() => setStep("grade")}
            >
              Get Started →
            </button>
          </div>
        )}

        {step === "grade" && (
          <div className="ob-step ob-grade">
            <button className="back-link" onClick={() => setStep("welcome")}>
              ← Back
            </button>
            <h2>What grade are you in?</h2>
            <p className="ob-grade-hint">
              This helps me give you the right level of help and math symbols
            </p>
            <div className="grade-grid">
              {GRADES.map((g) => (
                <button
                  key={g}
                  className={`grade-card ${grade === g ? "selected" : ""}`}
                  onClick={() => setGrade(g)}
                >
                  <span className="grade-number">{g}</span>
                  <span className="grade-label">
                    {GRADE_LABELS[g]
                      .replace(/\d+\w+ Grade\s*/, "")
                      .replace(/[()]/g, "") || `Grade ${g}`}
                  </span>
                  {grade === g && (
                    <span className="grade-topics">{GRADE_TOPICS[g]}</span>
                  )}
                </button>
              ))}
            </div>
            <button
              className="btn btn-primary btn-lg btn-block"
              onClick={() => setStep("name")}
              disabled={!grade}
            >
              Continue →
            </button>
          </div>
        )}

        {step === "name" && (
          <div className="ob-step ob-name">
            <button className="back-link" onClick={() => setStep("grade")}>
              ← Back
            </button>
            <h2>Almost there!</h2>

            <div className="avatar-pick">
              <label>Pick your avatar:</label>
              <div className="avatar-row">
                {AVATARS.map((a) => (
                  <button
                    key={a}
                    className={`av-btn ${avatar === a ? "selected" : ""}`}
                    onClick={() => setAvatar(a)}
                  >
                    {a}
                  </button>
                ))}
              </div>
            </div>

            <div className="name-field">
              <label>Your name:</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="What should I call you?"
                maxLength={20}
                onKeyDown={(e) => e.key === "Enter" && handleFinish()}
                autoFocus
              />
            </div>

            <div className="ob-summary">
              <span className="ob-summary-avatar">{avatar}</span>
              <div>
                <strong>{name || "You"}</strong>
                <span className="ob-summary-grade">
                  Grade {grade} · {GRADE_TOPICS[grade]}
                </span>
              </div>
            </div>

            <button
              className="btn btn-primary btn-lg btn-block"
              onClick={handleFinish}
              disabled={!name.trim()}
            >
              Start Learning! 🚀
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
