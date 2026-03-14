import { createContext, useContext, useReducer, useEffect } from "react";

const AppContext = createContext();

const GRADE_SYMBOLS = {
  1: ["+", "−", "="],
  2: ["+", "−", "×", "="],
  3: ["+", "−", "×", "÷", "="],
  4: ["+", "−", "×", "÷", "=", "( )", "<", ">"],
  5: ["+", "−", "×", "÷", "=", "( )", "<", ">", "²", "½"],
  6: ["+", "−", "×", "÷", "=", "( )", "²", "³", "%", "½", "|x|"],
  7: [
    "+",
    "−",
    "×",
    "÷",
    "=",
    "( )",
    "²",
    "³",
    "√",
    "%",
    "π",
    "½",
    "|x|",
    "−x",
  ],
  8: [
    "+",
    "−",
    "×",
    "÷",
    "=",
    "( )",
    "²",
    "³",
    "√",
    "∛",
    "%",
    "π",
    "xⁿ",
    "½",
    "|x|",
    "−x",
  ],
  9: [
    "+",
    "−",
    "×",
    "÷",
    "=",
    "( )",
    "²",
    "³",
    "√",
    "∛",
    "%",
    "π",
    "xⁿ",
    "½",
    "|x|",
    "−x",
    "≤",
    "≥",
    "≠",
  ],
  10: [
    "+",
    "−",
    "×",
    "÷",
    "=",
    "( )",
    "²",
    "³",
    "√",
    "∛",
    "%",
    "π",
    "xⁿ",
    "½",
    "|x|",
    "−x",
    "≤",
    "≥",
    "≠",
    "log",
    "∞",
  ],
  11: [
    "+",
    "−",
    "×",
    "÷",
    "=",
    "( )",
    "²",
    "³",
    "√",
    "∛",
    "%",
    "π",
    "xⁿ",
    "n!",
    "½",
    "|x|",
    "−x",
    "≤",
    "≥",
    "≠",
    "log",
    "sin",
    "cos",
    "tan",
    "∞",
    "Σ",
  ],
  12: [
    "+",
    "−",
    "×",
    "÷",
    "=",
    "( )",
    "²",
    "³",
    "√",
    "∛",
    "%",
    "π",
    "xⁿ",
    "n!",
    "½",
    "|x|",
    "−x",
    "≤",
    "≥",
    "≠",
    "log",
    "sin",
    "cos",
    "tan",
    "∞",
    "Σ",
    "∫",
    "lim",
    "Δ",
    "θ",
  ],
};

const SYMBOL_INSERT = {
  "+": " + ",
  "−": " − ",
  "×": " × ",
  "÷": " ÷ ",
  "=": " = ",
  "( )": "()",
  "<": " < ",
  ">": " > ",
  "≤": " ≤ ",
  "≥": " ≥ ",
  "≠": " ≠ ",
  "²": "²",
  "³": "³",
  "√": "√()",
  "∛": "∛()",
  "%": "%",
  π: "π",
  xⁿ: "^",
  "n!": "!",
  "½": "/",
  "|x|": "| |",
  "−x": "−",
  log: "log()",
  sin: "sin()",
  cos: "cos()",
  tan: "tan()",
  "∞": "∞",
  Σ: "Σ",
  "∫": "∫",
  lim: "lim ",
  Δ: "Δ",
  θ: "θ",
};

const MODELS = {
  fast: {
    name: "Fast",
    icon: "⚡",
    cost: 0,
    desc: "Quick answers for simple questions",
    color: "#00b894",
  },
  advanced: {
    name: "Advanced",
    icon: "🧠",
    cost: 5,
    desc: "Deep analysis & error breakdown",
    color: "#6C5CE7",
  },
  pro: {
    name: "Pro",
    icon: "🚀",
    cost: 10,
    desc: "Best model for hard equations",
    color: "#f0932b",
  },
};

const PLANS = {
  free: { name: "Free", credits: 50, price: 0 },
  pro: { name: "Pro", credits: 200, price: 3.99 },
  max: { name: "Max", credits: Infinity, price: 9.99 },
};

/* ── Account helpers ── */
function loadAccounts() {
  try {
    const data = localStorage.getItem("mathquest-accounts");
    if (data) return JSON.parse(data);
  } catch {}
  return {};
}

function saveAccounts(accounts) {
  localStorage.setItem("mathquest-accounts", JSON.stringify(accounts));
}

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

/* ── State persistence ── */
function loadState() {
  try {
    const saved = localStorage.getItem("mathquest-v2");
    if (saved) return JSON.parse(saved);
  } catch {}
  return null;
}

const freshState = {
  screen: "auth",
  currentAccount: null,
  isGuest: false,
  user: null,
  credits: 50,
  totalCreditsUsed: 0,
  selectedModel: "fast",
  chats: [],
  activeChatId: null,
};

/* ── Migration & init ── */
const saved = loadState();
let initialState;
if (saved) {
  // Migrate old flat chatMessages → chats array
  if (saved.chatMessages && !saved.chats) {
    const id = genId();
    saved.chats =
      saved.chatMessages.length > 0
        ? [
            {
              id,
              title: saved.chatMessages[0]?.text?.slice(0, 30) || "Chat",
              messages: saved.chatMessages,
              createdAt: Date.now(),
            },
          ]
        : [];
    saved.activeChatId = saved.chats[0]?.id || null;
    delete saved.chatMessages;
  }
  // Force auth screen if not logged in
  if (!saved.currentAccount && !saved.isGuest) {
    saved.screen = "auth";
  }
  initialState = { ...freshState, ...saved };
} else {
  initialState = { ...freshState };
}

/* ── Reducer ── */
function reducer(state, action) {
  switch (action.type) {
    case "LOGIN": {
      const { username, accountData } = action.payload;
      const base = {
        ...freshState,
        screen: "chat",
        currentAccount: username,
        isGuest: false,
      };
      if (accountData && accountData.user) {
        // Restore saved state
        return { ...base, ...accountData };
      }
      // Account exists but never finished onboarding
      return { ...base, screen: "onboarding" };
    }

    case "SIGNUP": {
      const { username } = action.payload;
      return {
        ...freshState,
        screen: "onboarding",
        currentAccount: username,
        isGuest: false,
      };
    }

    case "GUEST_LOGIN": {
      const chatId = genId();
      return {
        ...freshState,
        screen: "chat",
        currentAccount: null,
        isGuest: true,
        user: { name: "Guest", grade: "5", avatar: "👤", plan: "free" },
        credits: Infinity,
        chats: [
          {
            id: chatId,
            title: "New Chat",
            messages: [],
            createdAt: Date.now(),
          },
        ],
        activeChatId: chatId,
      };
    }

    case "SETUP_USER": {
      const chatId = genId();
      return {
        ...state,
        user: action.payload,
        credits: 50,
        screen: "chat",
        chats: [
          {
            id: chatId,
            title: "New Chat",
            messages: [],
            createdAt: Date.now(),
          },
        ],
        activeChatId: chatId,
      };
    }

    case "NAVIGATE":
      return { ...state, screen: action.payload };

    case "SET_MODEL":
      return { ...state, selectedModel: action.payload };

    case "SEND_USER_MSG": {
      const { text, model } = action.payload;
      const info = MODELS[model];
      const newCredits =
        state.isGuest || state.user?.plan === "max"
          ? state.credits
          : state.credits - info.cost;
      const newChats = state.chats.map((c) => {
        if (c.id !== state.activeChatId) return c;
        const newMsgs = [
          ...c.messages,
          { role: "user", text, model, time: Date.now() },
        ];
        const title =
          c.messages.length === 0
            ? text.slice(0, 30) + (text.length > 30 ? "…" : "")
            : c.title;
        return { ...c, messages: newMsgs, title };
      });
      return {
        ...state,
        credits: newCredits,
        totalCreditsUsed: state.totalCreditsUsed + info.cost,
        chats: newChats,
      };
    }

    case "RECEIVE_BOT_MSG": {
      const { text, model } = action.payload;
      const newChats = state.chats.map((c) => {
        if (c.id !== state.activeChatId) return c;
        return {
          ...c,
          messages: [
            ...c.messages,
            { role: "bot", text, model, time: Date.now() },
          ],
        };
      });
      return { ...state, chats: newChats };
    }

    case "CREDIT_ERROR": {
      const { text, model } = action.payload;
      const info = MODELS[model];
      const newChats = state.chats.map((c) => {
        if (c.id !== state.activeChatId) return c;
        return {
          ...c,
          messages: [
            ...c.messages,
            { role: "user", text, model, time: Date.now() },
            {
              role: "bot",
              text: `❌ Not enough credits! **${info.name}** costs ${info.cost} credits but you have ${state.credits}.\n\nUpgrade your plan or use **Fast** (free)!`,
              model,
              time: Date.now() + 1,
            },
          ],
        };
      });
      return { ...state, chats: newChats };
    }

    case "NEW_CHAT": {
      const chatId = genId();
      return {
        ...state,
        chats: [
          {
            id: chatId,
            title: "New Chat",
            messages: [],
            createdAt: Date.now(),
          },
          ...state.chats,
        ],
        activeChatId: chatId,
      };
    }

    case "SWITCH_CHAT":
      return { ...state, activeChatId: action.payload };

    case "DELETE_CHAT": {
      const remaining = state.chats.filter((c) => c.id !== action.payload);
      if (remaining.length === 0) {
        const chatId = genId();
        return {
          ...state,
          chats: [
            {
              id: chatId,
              title: "New Chat",
              messages: [],
              createdAt: Date.now(),
            },
          ],
          activeChatId: chatId,
        };
      }
      return {
        ...state,
        chats: remaining,
        activeChatId:
          state.activeChatId === action.payload
            ? remaining[0].id
            : state.activeChatId,
      };
    }

    case "CLEAR_CHAT": {
      const newChats = state.chats.map((c) => {
        if (c.id !== state.activeChatId) return c;
        return { ...c, messages: [], title: "New Chat" };
      });
      return { ...state, chats: newChats };
    }

    case "SET_PLAN": {
      const plan = action.payload;
      const cr = plan === "max" ? Infinity : plan === "pro" ? 200 : 50;
      return {
        ...state,
        user: { ...state.user, plan },
        credits: Math.max(state.credits, cr),
      };
    }

    case "SET_API_KEY":
      return { ...state, apiKey: action.payload };

    case "LOGOUT": {
      if (state.currentAccount) {
        const accounts = loadAccounts();
        if (accounts[state.currentAccount]) {
          accounts[state.currentAccount].savedState = {
            user: state.user,
            credits: state.credits,
            totalCreditsUsed: state.totalCreditsUsed,
            selectedModel: state.selectedModel,
            chats: state.chats,
            activeChatId: state.activeChatId,
          };
          saveAccounts(accounts);
        }
      }
      localStorage.removeItem("mathquest-v2");
      return { ...freshState };
    }

    default:
      return state;
  }
}

export {
  GRADE_SYMBOLS,
  SYMBOL_INSERT,
  MODELS,
  PLANS,
  loadAccounts,
  saveAccounts,
};

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    localStorage.setItem("mathquest-v2", JSON.stringify(state));
    if (state.currentAccount) {
      const accounts = loadAccounts();
      if (accounts[state.currentAccount]) {
        accounts[state.currentAccount].savedState = {
          user: state.user,
          credits: state.credits,
          totalCreditsUsed: state.totalCreditsUsed,
          selectedModel: state.selectedModel,
          chats: state.chats,
          activeChatId: state.activeChatId,
        };
        saveAccounts(accounts);
      }
    }
  }, [state]);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be inside AppProvider");
  return ctx;
}
