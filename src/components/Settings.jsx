import { useApp, PLANS } from "../store/AppContext";

export default function Settings({ onClose }) {
  const { state, dispatch } = useApp();
  const { user, theme } = state;

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    dispatch({ type: "SET_THEME", payload: next });
  };

  const selectPlan = (plan) => {
    if (plan === (user?.plan || "free")) return;
    dispatch({ type: "SET_PLAN", payload: plan });
  };

  const logout = () => {
    dispatch({ type: "LOGOUT" });
    onClose();
  };

  const plans = [
    { key: "free", icon: "\u2728", detail: "50 credits/month", price: "Free" },
    { key: "pro", icon: "\uD83D\uDC8E", detail: "200 credits/month", price: "$3.99/mo" },
    { key: "max", icon: "\uD83D\uDC51", detail: "1,000 credits/month", price: "$9.99/mo" },
  ];

  return (
    <div className="settings-overlay" onClick={onClose}>
      <div className="settings-panel" onClick={(e) => e.stopPropagation()}>
        <h2>
          Settings
          <button className="settings-close" onClick={onClose}>&times;</button>
        </h2>

        <div className="settings-section">
          <h3>Appearance</h3>
          <div className="settings-row">
            <div>
              <div className="settings-row-label">Dark Mode</div>
              <div className="settings-row-desc">Switch between light and dark theme</div>
            </div>
            <button
              className={`toggle ${theme === "dark" ? "on" : ""}`}
              onClick={toggleTheme}
            />
          </div>
        </div>

        <div className="settings-section">
          <h3>Plan</h3>
          <div className="settings-plans">
            {plans.map((p) => (
              <div
                key={p.key}
                className={`settings-plan-card ${(user?.plan || "free") === p.key ? "active" : ""}`}
                onClick={() => selectPlan(p.key)}
              >
                <div className="settings-plan-left">
                  <span className="settings-plan-icon">{p.icon}</span>
                  <div>
                    <span className="settings-plan-name">{PLANS[p.key].name}</span>
                    <span className="settings-plan-detail">{p.detail}</span>
                  </div>
                </div>
                {(user?.plan || "free") === p.key ? (
                  <span className="settings-plan-tag">Current</span>
                ) : (
                  <span className="settings-plan-price">{p.price}</span>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="settings-section">
          <h3>Account</h3>
          <button className="settings-logout" onClick={logout}>
            Log Out
          </button>
        </div>
      </div>
    </div>
  );
}
