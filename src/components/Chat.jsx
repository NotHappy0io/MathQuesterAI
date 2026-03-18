import { useState, useRef, useEffect } from "react";
import {
  useApp,
  MODELS,
  GRADE_SYMBOLS,
  SYMBOL_INSERT,
} from "../store/AppContext";
import { getAIResponse, getGuestAIResponse } from "../services/ai";
import Settings from "./Settings";

export default function Chat() {
  const { state, dispatch } = useApp();
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [pendingImage, setPendingImage] = useState(null); // base64 data URL
  const messagesEnd = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);
  const [showSettings, setShowSettings] = useState(false);
  const user = state.user;
  const model = state.isGuest ? "fast" : state.selectedModel;
  const modelInfo = MODELS[model];
  const symbols = GRADE_SYMBOLS[user?.grade] || GRADE_SYMBOLS["5"];

  const activeChat = state.chats.find((c) => c.id === state.activeChatId);
  const chatMessages = activeChat?.messages || [];

  useEffect(() => {
    messagesEnd.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, typing]);

  function insertSymbol(sym) {
    const text = SYMBOL_INSERT[sym] || sym;
    setInput((prev) => prev + text);
    inputRef.current?.focus();
  }

  function handleImageSelect(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return;
    if (file.size > 10 * 1024 * 1024) {
      alert("Image is too large (max 10MB)");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setPendingImage(reader.result);
    reader.readAsDataURL(file);
    // Reset file input so the same file can be re-selected
    e.target.value = "";
  }

  function handlePaste(e) {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const item of items) {
      if (item.type.startsWith("image/")) {
        e.preventDefault();
        const file = item.getAsFile();
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => setPendingImage(reader.result);
        reader.readAsDataURL(file);
        return;
      }
    }
  }

  async function handleSend() {
    if ((!input.trim() && !pendingImage) || typing) return;
    const text =
      input.trim() || (pendingImage ? "Solve this problem from the image" : "");
    const imageToSend = pendingImage;
    const info = MODELS[model];
    setInput("");
    setPendingImage(null);

    if (!state.isGuest && state.credits < info.cost) {
      dispatch({ type: "CREDIT_ERROR", payload: { text, model } });
      return;
    }

    dispatch({
      type: "SEND_USER_MSG",
      payload: { text, model, image: imageToSend },
    });
    setTyping(true);

    try {
      let response;
      if (state.isGuest) {
        response = await getGuestAIResponse(text, chatMessages, imageToSend);
      } else {
        response = await getAIResponse(
          model,
          text,
          chatMessages,
          user?.grade,
          user?.name,
          imageToSend,
        );
      }
      dispatch({ type: "RECEIVE_BOT_MSG", payload: { text: response, model } });
    } catch (err) {
      dispatch({
        type: "RECEIVE_BOT_MSG",
        payload: {
          text: `Hmm, something went wrong: ${err.message}\n\nTry again in a moment.`,
          model,
        },
      });
    } finally {
      setTyping(false);
    }
  }

  const creditsDisplay = state.isGuest ? "—" : state.credits;

  return (
    <div className="chat-screen">
      {/* Sidebar */}
      <aside className="chat-sidebar">
        <div className="sidebar-top">
          <div className="sidebar-user">
            <span className="sidebar-avatar">{user?.avatar}</span>
            <div>
              <span className="sidebar-name">{user?.name}</span>
              <span className="sidebar-grade">
                {state.isGuest ? "Guest Mode" : `Grade ${user?.grade}`}
              </span>
            </div>
          </div>

          {!state.isGuest && (
            <>
              <div className="credit-display">
                <span className="credit-icon">🪙</span>
                <span className="credit-count">{creditsDisplay}</span>
                <span className="credit-label">credits</span>
              </div>

              <div className="plan-badge-area">
                <span className={`plan-badge plan-${user?.plan || "free"}`}>
                  {user?.plan === "max"
                    ? "💎 Max"
                    : user?.plan === "pro"
                      ? "⭐ Pro"
                      : "🆓 Free"}
                </span>
                <span className="plan-credits-info">
                  {user?.plan === "max"
                    ? "1000/mo"
                    : user?.plan === "pro"
                      ? "200/mo"
                      : "50/mo"}
                </span>
              </div>
            </>
          )}

          {state.isGuest && (
            <div className="guest-banner">
              <p>🔒 Limited AI in guest mode</p>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => dispatch({ type: "LOGOUT" })}
              >
                Sign Up for Full Access
              </button>
            </div>
          )}
        </div>

        {/* Chat List */}
        <div className="sidebar-chats">
          <div className="sidebar-chats-header">
            <label className="sidebar-section-label">Chats</label>
            <button
              className="new-chat-btn"
              onClick={() => dispatch({ type: "NEW_CHAT" })}
              title="New Chat"
            >
              +
            </button>
          </div>
          <div className="chat-list">
            {state.chats.map((chat) => (
              <div
                key={chat.id}
                className={`chat-list-item ${chat.id === state.activeChatId ? "active" : ""}`}
                onClick={() =>
                  dispatch({ type: "SWITCH_CHAT", payload: chat.id })
                }
              >
                <span className="chat-list-icon">💬</span>
                <span className="chat-list-title">{chat.title}</span>
                {state.chats.length > 1 && (
                  <button
                    className="chat-list-delete"
                    onClick={(e) => {
                      e.stopPropagation();
                      dispatch({ type: "DELETE_CHAT", payload: chat.id });
                    }}
                    title="Delete chat"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {!state.isGuest && (
          <div className="sidebar-models">
            <label className="sidebar-section-label">AI Model</label>
            {Object.entries(MODELS).map(([key, m]) => (
              <button
                key={key}
                className={`model-btn ${model === key ? "active" : ""}`}
                onClick={() => dispatch({ type: "SET_MODEL", payload: key })}
                style={{ "--model-color": m.color }}
              >
                <span className="model-icon">{m.icon}</span>
                <div className="model-info">
                  <span className="model-name">{m.name}</span>
                  <span className="model-cost">
                    {m.cost === 0 ? "Free" : `${m.cost} credits`}
                  </span>
                </div>
                {model === key && <span className="model-check">✓</span>}
              </button>
            ))}
          </div>
        )}

        <div className="sidebar-bottom">
          {!state.isGuest && (
            <button
              className="sidebar-btn"
              onClick={() => setShowSettings(true)}
            >
              ⚙️ Settings
            </button>
          )}
          {state.isGuest && (
            <button
              className="sidebar-btn danger"
              onClick={() => dispatch({ type: "LOGOUT" })}
            >
              🚪 Exit Guest Mode
            </button>
          )}
        </div>
      </aside>

      {/* Main Chat */}
      <main className="chat-main">
        <header className="chat-topbar">
          <div className="topbar-left">
            <span
              className="topbar-model-icon"
              style={{ background: modelInfo.color }}
            >
              {modelInfo.icon}
            </span>
            <div>
              <h2>MathQuest</h2>
            </div>
          </div>
          {!state.isGuest && (
            <div className="topbar-right">
              <span className="topbar-credits">🪙 {creditsDisplay}</span>
              <span className="topbar-cost">
                {modelInfo.cost === 0 ? "Free" : `−${modelInfo.cost}/msg`}
              </span>
            </div>
          )}
        </header>

        <div className="chat-body">
          {/* Welcome message */}
          {chatMessages.length === 0 && (
            <div className="chat-welcome">
              <h2>Hello, {user?.name || "there"}</h2>
              <p>How can I help you with math today?</p>
              <div className="welcome-suggestions">
                <button
                  onClick={() => setInput("I need help with my homework")}
                >
                  📝 Help with homework
                </button>
                <button onClick={() => setInput("Explain how fractions work")}>
                  🍕 Explain a concept
                </button>
                <button
                  onClick={() =>
                    setInput("I got a question wrong, can you help?")
                  }
                >
                  ❌ Why I got it wrong
                </button>
                <button onClick={() => setInput("Give me a practice problem")}>
                  🎯 Practice problem
                </button>
              </div>
              <div className="welcome-model-hint">
                {state.isGuest ? (
                  <p style={{ opacity: 0.6, fontSize: "0.85em" }}>
                    Guest mode — limited responses. Create an account for full
                    AI tutoring!
                  </p>
                ) : (
                  <>
                    <p>
                      Using{" "}
                      <strong style={{ color: modelInfo.color }}>
                        {modelInfo.icon} {modelInfo.name}
                      </strong>{" "}
                      —{" "}
                      {modelInfo.cost === 0
                        ? "free!"
                        : `${modelInfo.cost} credits per message`}
                    </p>
                    <p
                      style={{
                        opacity: 0.6,
                        fontSize: "0.85em",
                        marginTop: "0.5rem",
                      }}
                    >
                      The AI is still in beta and it can make mistakes.
                    </p>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Messages */}
          {chatMessages.map((msg, i) => (
            <div key={i} className={`msg ${msg.role}`}>
              <span className="msg-avatar">
                {msg.role === "user"
                  ? user?.avatar
                  : MODELS[msg.model]?.icon || "🤖"}
              </span>
              <div
                className={`msg-bubble ${msg.role === "bot" ? `model-${msg.model}` : ""}`}
              >
                {msg.role === "bot" && (
                  <span
                    className="msg-model-tag"
                    style={{ color: MODELS[msg.model]?.color }}
                  >
                    {state.isGuest ? "Guest" : MODELS[msg.model]?.name}
                  </span>
                )}
                <div className="msg-text">
                  {msg.image && (
                    <img
                      src={msg.image}
                      alt="Math problem"
                      className="msg-image"
                    />
                  )}
                  {msg.text.split("\n").map((line, j) => (
                    <p key={j}>{renderLine(line)}</p>
                  ))}
                </div>
              </div>
            </div>
          ))}

          {typing && (
            <div className="msg bot">
              <span className="msg-avatar">{modelInfo.icon}</span>
              <div className={`msg-bubble model-${model}`}>
                <div className="typing-dots">
                  <span />
                  <span />
                  <span />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEnd} />
        </div>

        {/* Symbol Bar */}
        <div className="symbol-bar">
          {symbols.map((sym) => (
            <button
              key={sym}
              className="sym-btn"
              onClick={() => insertSymbol(sym)}
              title={sym}
            >
              {sym}
            </button>
          ))}
        </div>

        {/* Image Preview */}
        {pendingImage && (
          <div className="image-preview-bar">
            <img
              src={pendingImage}
              alt="Upload preview"
              className="image-preview-thumb"
            />
            <button
              className="image-preview-remove"
              onClick={() => setPendingImage(null)}
            >
              ✕
            </button>
          </div>
        )}

        {/* Input */}
        <div className="chat-input-bar">
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            style={{ display: "none" }}
            onChange={handleImageSelect}
          />
          <button
            className="image-upload-btn"
            onClick={() => fileInputRef.current?.click()}
            title="Upload an image of a math problem"
          >
            📷
          </button>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
            onPaste={handlePaste}
            placeholder={
              pendingImage
                ? "Describe what you need help with (or just send)..."
                : state.isGuest
                  ? "Ask a basic math question..."
                  : `Ask ${modelInfo.name} anything about math...`
            }
          />
          <button
            className="send-btn"
            onClick={handleSend}
            disabled={(!input.trim() && !pendingImage) || typing}
            style={{ background: modelInfo.color }}
          >
            Send
          </button>
        </div>
      </main>

      {showSettings && <Settings onClose={() => setShowSettings(false)} />}
    </div>
  );
}

function renderLine(line) {
  // Strip markdown headers (### etc) — just show the text
  line = line.replace(/^#{1,4}\s+/, "");

  // Strip --- horizontal rules
  if (/^-{3,}$/.test(line.trim())) return <br />;

  // Convert bullet markers to •
  line = line.replace(/^[\-\*]\s+/, "• ");

  // Render inline formatting
  const parts = [];
  let remaining = line;
  let key = 0;

  while (remaining) {
    // Only match **bold** — nothing else
    const boldMatch = remaining.match(/\*\*(.+?)\*\*/);

    if (!boldMatch) {
      // Strip any leftover single * or ` by just removing them
      parts.push(<span key={key++}>{remaining.replace(/[*`]/g, "")}</span>);
      break;
    }

    const before = remaining.slice(0, boldMatch.index);
    if (before) {
      parts.push(<span key={key++}>{before.replace(/[*`]/g, "")}</span>);
    }

    parts.push(<strong key={key++}>{boldMatch[1]}</strong>);
    remaining = remaining.slice(boldMatch.index + boldMatch[0].length);
  }

  return parts.length ? parts : line || <br />;
}
