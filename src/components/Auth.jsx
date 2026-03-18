import { useState } from "react";
import { useApp, loadAccounts, saveAccounts } from "../store/AppContext";

export default function Auth() {
  const { dispatch } = useApp();
  const [mode, setMode] = useState("login");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  function handleLogin() {
    if (!username.trim() || !password) {
      setError("Please fill in all fields");
      return;
    }
    const accounts = loadAccounts();
    const key = username.trim().toLowerCase();
    const account = accounts[key];
    if (!account) {
      setError("Account not found");
      return;
    }
    if (account.password !== password) {
      setError("Wrong password");
      return;
    }
    dispatch({
      type: "LOGIN",
      payload: {
        username: key,
        accountData: account.savedState || {},
      },
    });
  }

  function handleSignup() {
    if (!username.trim() || !email.trim() || !password) {
      setError("Please fill in all fields");
      return;
    }
    if (username.trim().length < 3) {
      setError("Username must be at least 3 characters");
      return;
    }
    if (!email.includes("@")) {
      setError("Please enter a valid email");
      return;
    }
    if (password.length < 4) {
      setError("Password must be at least 4 characters");
      return;
    }
    const accounts = loadAccounts();
    const key = username.trim().toLowerCase();
    if (accounts[key]) {
      setError("Username already taken");
      return;
    }
    accounts[key] = { email: email.trim().toLowerCase(), password, savedState: {} };
    saveAccounts(accounts);
    dispatch({ type: "SIGNUP", payload: { username: key } });
  }

  function handleGuest() {
    dispatch({ type: "GUEST_LOGIN" });
  }

  const submit = mode === "login" ? handleLogin : handleSignup;

  return (
    <div className="auth-screen">
      <div className="auth-container">
        <div className="auth-logo">{"\ud83d\udcd0"}</div>
        <h1 className="auth-title">MathQuest</h1>
        <p className="auth-subtitle">Your AI-Powered Math Tutor</p>

        <div className="auth-tabs">
          <button
            className={`auth-tab ${mode === "login" ? "active" : ""}`}
            onClick={() => { setMode("login"); setError(""); }}
          >
            Sign In
          </button>
          <button
            className={`auth-tab ${mode === "signup" ? "active" : ""}`}
            onClick={() => { setMode("signup"); setError(""); }}
          >
            Create Account
          </button>
        </div>

        <div className="auth-form">
          <div className="auth-field">
            <label>Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => { setUsername(e.target.value); setError(""); }}
              placeholder="Enter username"
            />
          </div>

          {mode === "signup" && (
            <div className="auth-field">
              <label>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(""); }}
                placeholder="you@email.com"
              />
            </div>
          )}

          <div className="auth-field">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(""); }}
              onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
              placeholder="Enter password"
            />
          </div>

          {error && <div className="auth-error">{error}</div>}

          <button className="auth-btn submit-btn" onClick={submit}>
            {mode === "login" ? "Login" : "Create Account"}
          </button>

          <div className="auth-divider">
            <span>OR</span>
          </div>

          <button className="auth-btn guest-btn" onClick={handleGuest}>
            Continue as Guest
          </button>
        </div>
      </div>
    </div>
  );
}