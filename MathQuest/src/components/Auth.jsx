import { useState } from "react";
import { useApp, loadAccounts, saveAccounts } from "../store/AppContext";

export default function Auth() {
  const { dispatch } = useApp();
  const [mode, setMode] = useState("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  function handleLogin() {
    if (!username.trim() || !password) {
      setError("Please fill in all fields");
      return;
    }
    const accounts = loadAccounts();
    const account = accounts[username.trim().toLowerCase()];
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
        username: username.trim().toLowerCase(),
        accountData: account.savedState || {},
      },
    });
  }

  function handleSignup() {
    if (!username.trim() || !password) {
      setError("Please fill in all fields");
      return;
    }
    if (username.trim().length < 3) {
      setError("Username must be at least 3 characters");
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
    accounts[key] = { password, savedState: {} };
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
        <div className="auth-logo">📐</div>
        <h1 className="auth-title">MathQuest</h1>
        <p className="auth-subtitle">Your AI-Powered Math Tutor</p>

        <div className="auth-tabs">
          <button
            className={`auth-tab ${mode === "login" ? "active" : ""}`}
            onClick={() => {
              setMode("login");
              setError("");
            }}
          >
            Sign In
          </button>
          <button
            className={`auth-tab ${mode === "signup" ? "active" : ""}`}
            onClick={() => {
              setMode("signup");
              setError("");
            }}
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
              onChange={(e) => {
                setUsername(e.target.value);
                setError("");
              }}
              placeholder="Enter username"
              maxLength={20}
              onKeyDown={(e) => e.key === "Enter" && submit()}
              autoFocus
            />
          </div>
          <div className="auth-field">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError("");
              }}
              placeholder="Enter password"
              maxLength={30}
              onKeyDown={(e) => e.key === "Enter" && submit()}
            />
          </div>

          {error && <p className="auth-error">{error}</p>}

          <button className="btn btn-primary btn-lg btn-block" onClick={submit}>
            {mode === "login" ? "Sign In →" : "Create Account →"}
          </button>
        </div>

        <div className="auth-divider">
          <span>or</span>
        </div>

        <button className="auth-guest-btn" onClick={handleGuest}>
          Continue as Guest →
        </button>
        <p className="auth-guest-note">Limited AI · No saved progress</p>
      </div>
    </div>
  );
}
