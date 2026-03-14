import { useState } from "react";
import { useApp, PLANS } from "../store/AppContext";

export default function Plans() {
  const { state, dispatch } = useApp();
  const [processing, setProcessing] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const currentPlan = state.user?.plan || "free";

  function handleSubscribe(plan) {
    if (plan === currentPlan) return;
    if (plan === "free") {
      dispatch({ type: "SET_PLAN", payload: "free" });
      return;
    }
    setSelectedPlan(plan);
  }

  function confirmSubscribe() {
    setProcessing(true);
    setTimeout(() => {
      dispatch({ type: "SET_PLAN", payload: selectedPlan });
      setProcessing(false);
      setSelectedPlan(null);
    }, 1500);
  }

  return (
    <div className="plans-screen">
      <header className="plans-header">
        <button
          className="btn btn-ghost"
          onClick={() => dispatch({ type: "NAVIGATE", payload: "chat" })}
        >
          ← Back to Chat
        </button>
      </header>

      <div className="plans-hero">
        <h1>Choose Your Plan</h1>
        <p>More credits = more powerful AI help</p>
      </div>

      <div className="plans-grid">
        {/* Free */}
        <div className={`plan-card ${currentPlan === "free" ? "current" : ""}`}>
          <div className="plan-card-badge">🆓</div>
          <h2>Free</h2>
          <div className="plan-price">
            <span className="plan-amount">$0</span>
            <span className="plan-period">/month</span>
          </div>
          <ul className="plan-features">
            <li>✅ 50 credits/month</li>
            <li>✅ Fast model (free)</li>
            <li>✅ Advanced model (5 credits)</li>
            <li>✅ Pro model (10 credits)</li>
            <li>✅ Math symbol toolbar</li>
            <li>✅ Grade-adapted help</li>
          </ul>
          {currentPlan === "free" ? (
            <div className="plan-current-tag">Current Plan</div>
          ) : (
            <button
              className="btn btn-secondary btn-block"
              onClick={() => handleSubscribe("free")}
            >
              Downgrade
            </button>
          )}
        </div>

        {/* Pro */}
        <div
          className={`plan-card plan-card-pro ${currentPlan === "pro" ? "current" : ""}`}
        >
          <div className="plan-popular">Most Popular</div>
          <div className="plan-card-badge">⭐</div>
          <h2>Pro</h2>
          <div className="plan-price">
            <span className="plan-amount">$3.99</span>
            <span className="plan-period">/month</span>
          </div>
          <ul className="plan-features">
            <li>
              ✅ <strong>200 credits/month</strong>
            </li>
            <li>✅ Fast model (free)</li>
            <li>✅ Advanced model (5 credits)</li>
            <li>✅ Pro model (10 credits)</li>
            <li>✅ Math symbol toolbar</li>
            <li>✅ Grade-adapted help</li>
            <li>⭐ 4x more credits than Free</li>
          </ul>
          {currentPlan === "pro" ? (
            <div className="plan-current-tag">Current Plan</div>
          ) : (
            <button
              className="btn btn-primary btn-block btn-lg"
              onClick={() => handleSubscribe("pro")}
            >
              Upgrade to Pro
            </button>
          )}
        </div>

        {/* Max */}
        <div
          className={`plan-card plan-card-max ${currentPlan === "max" ? "current" : ""}`}
        >
          <div className="plan-card-badge">💎</div>
          <h2>Max</h2>
          <div className="plan-price">
            <span className="plan-amount plan-amount-max">$9.99</span>
            <span className="plan-period">/month</span>
          </div>
          <ul className="plan-features">
            <li>
              ✅ <strong>Unlimited credits</strong>
            </li>
            <li>✅ Fast model (free)</li>
            <li>✅ Advanced model (free)</li>
            <li>✅ Pro model (free)</li>
            <li>✅ Math symbol toolbar</li>
            <li>✅ Grade-adapted help</li>
            <li>💎 No limits whatsoever</li>
          </ul>
          {currentPlan === "max" ? (
            <div className="plan-current-tag">Current Plan</div>
          ) : (
            <button
              className="btn btn-premium btn-block btn-lg"
              onClick={() => handleSubscribe("max")}
            >
              Go Unlimited
            </button>
          )}
        </div>
      </div>

      <div className="plans-faq">
        <h3>How Credits Work</h3>
        <div className="faq-grid">
          <div className="faq-card">
            <span>⚡</span>
            <div>
              <strong>Fast — 0 credits</strong>
              <p>Quick tips and short answers. Always free, unlimited use.</p>
            </div>
          </div>
          <div className="faq-card">
            <span>🧠</span>
            <div>
              <strong>Advanced — 5 credits</strong>
              <p>Step-by-step breakdowns, error analysis, practice problems.</p>
            </div>
          </div>
          <div className="faq-card">
            <span>🚀</span>
            <div>
              <strong>Pro — 10 credits</strong>
              <p>
                Best model. Complex equations, deep error diagnosis, full
                solutions.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Checkout modal */}
      {selectedPlan && (
        <div
          className="modal-overlay"
          onClick={() => !processing && setSelectedPlan(null)}
        >
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h3>💳 Checkout (Mockup)</h3>
            <p className="modal-note">This is a demo — no real payment.</p>

            <div className="modal-plan-summary">
              <span>
                {selectedPlan === "pro" ? "⭐" : "💎"}{" "}
                {PLANS[selectedPlan].name}
              </span>
              <span className="modal-plan-price">
                ${PLANS[selectedPlan].price}/month
              </span>
            </div>

            <div className="mock-form">
              <div className="form-group">
                <label>Card Number</label>
                <input type="text" placeholder="4242 4242 4242 4242" disabled />
              </div>
              <div className="form-row-small">
                <div className="form-group">
                  <label>Expiry</label>
                  <input type="text" placeholder="12/28" disabled />
                </div>
                <div className="form-group">
                  <label>CVC</label>
                  <input type="text" placeholder="123" disabled />
                </div>
              </div>
            </div>

            <button
              className="btn btn-primary btn-lg btn-block"
              onClick={confirmSubscribe}
              disabled={processing}
            >
              {processing
                ? "⏳ Processing..."
                : `Subscribe — $${PLANS[selectedPlan].price}/mo`}
            </button>
            <button
              className="btn btn-ghost btn-block"
              onClick={() => setSelectedPlan(null)}
              disabled={processing}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
