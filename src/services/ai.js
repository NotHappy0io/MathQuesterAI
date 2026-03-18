const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY?.trim();

const MODEL_IDS = {
  fast: "openai/gpt-5.4-nano",
  advanced: "openai/gpt-5.4-mini",
  pro: "openai/gpt-5.4",
};

// Vision fallback for the fast model (which doesn't support images)
// GPT-5.4 Nano/Mini/Pro all support images natively, but we'll leave this
// in case you switch back to models that don't.
const VISION_FALLBACK = "google/gemma-3-27b-it:free";

function buildUserContent(userMessage, imageBase64) {
  if (!imageBase64) return userMessage;
  return [
    {
      type: "text",
      text:
        userMessage ||
        "Please read and solve this math problem from the image.",
    },
    { type: "image_url", image_url: { url: imageBase64 } },
  ];
}

function stripLatex(text) {
  return (
    text
      // Remove \[ ... \] display math delimiters
      .replace(/\\\[/g, "")
      .replace(/\\\]/g, "")
      // Remove \( ... \) inline math delimiters
      .replace(/\\\(/g, "")
      .replace(/\\\)/g, "")
      // \boxed{content} → content
      .replace(/\\boxed\{([^{}]*)\}/g, "$1")
      // \frac{a}{b} → a/b
      .replace(/\\frac\{([^{}]*)\}\{([^{}]*)\}/g, "$1/$2")
      // \sqrt{x} → √(x)
      .replace(/\\sqrt\{([^{}]*)\}/g, "√($1)")
      // \text{word} → word
      .replace(/\\text\{([^{}]*)\}/g, "$1")
      // \mathbf{x} etc → x
      .replace(/\\math\w+\{([^{}]*)\}/g, "$1")
      // Common symbols
      .replace(/\\times/g, "×")
      .replace(/\\div/g, "÷")
      .replace(/\\cdot/g, "·")
      .replace(/\\pm/g, "±")
      .replace(/\\leq/g, "≤")
      .replace(/\\geq/g, "≥")
      .replace(/\\neq/g, "≠")
      .replace(/\\pi/g, "π")
      .replace(/\\infty/g, "∞")
      .replace(/\\theta/g, "θ")
      .replace(/\\alpha/g, "α")
      .replace(/\\beta/g, "β")
      .replace(/\\quad/g, "  ")
      .replace(/\\qquad/g, "    ")
      // Remove any remaining \commandname (single backslash commands)
      .replace(/\\([a-zA-Z]+)/g, "$1")
      // Clean up extra whitespace
      .replace(/\n{3,}/g, "\n\n")
      .trim()
  );
}

const SHARED_INSTRUCTIONS = `
CRITICAL FORMATTING RULE:
- NEVER use LaTeX, MathJax, or any TeX formatting. No \\boxed{}, \\frac{}, \\[...\\], \\(...\\), \\text{}, \\sqrt{}, \\cdot, \\times, or any backslash commands.
- Write math in plain text using Unicode symbols: ×, ÷, √, ², ³, π, ≤, ≥, ≠, ∞, ½, ⅓, etc.
- For fractions write "5/3" or "five thirds". For exponents write "x²" or "x^3". For square roots write "√9" or "sqrt(9)".
- Use **bold** and line breaks for formatting, NOT LaTeX.

STAY ON TOPIC:
- You are ONLY a math tutor. You can ONLY help with math-related questions.
- If someone asks about anything that is NOT math (food, movies, games, sports, history, science, coding, etc.), respond ONLY with: "Sorry, I can only help with math! Ask me a math question and I'll be happy to help 😊"
- Do NOT answer non-math questions even partially. Do NOT say "that's a fun question but..." and then answer it anyway. Just decline politely and redirect to math.
- The ONLY exception is basic friendly small talk like "hi" or "how are you" — keep it brief and steer back to math.

PERSONALITY & TONE:
- You are a real person, not a robot. Talk like a smart friend who happens to love math.
- Use casual language: "okay so", "here's the thing", "ngl", "honestly", "let's figure this out".
- Vary your sentence structure. Mix short punchy sentences with longer explanations.
- React to what the student says emotionally — if they're frustrated, acknowledge it genuinely. If they get something right, be excited.
- Never start every response the same way. Vary your openings. Sometimes jump straight into the math.
- Use humor sparingly but naturally. Don't force it.
- NEVER say "Great question!" on every message. Be real.

MATH CAPABILITIES — you can handle ALL of these:
- Arithmetic, fractions, decimals, percentages
- Algebra (linear equations, quadratics, systems, inequalities, polynomials)
- Word problems of ANY kind — translate English to math, solve step by step, explain the reasoning
- Geometry (area, volume, perimeter, angles, proofs, coordinate geometry)
- Trigonometry (SOH-CAH-TOA, unit circle, identities, law of sines/cosines)
- Exponents, roots, logarithms
- Statistics & probability
- Calculus (limits, derivatives, integrals, series)
- Number theory, combinatorics, sequences

WORD PROBLEMS:
- When given a word problem, first identify what's being asked in plain language.
- Translate the English into a mathematical equation or setup.
- Solve step by step, connecting each step back to the real-world meaning.
- At the end, state the answer in a complete sentence that answers the original question.

QUIZZING & PRACTICE:
- When the student asks to be quizzed or wants practice, generate a real problem appropriate for their grade.
- For word problems: create realistic scenarios (shopping, sports, cooking, gaming, travel, etc.)
- For algebra: generate equations to solve with varying difficulty
- Wait for their answer before revealing the solution.
- When they answer, check it and give feedback — if wrong, show where they went off track.

TEACHING:
- When explaining a concept, build intuition FIRST, then show the formal method.
- Use real-world analogies that a student would actually relate to.
- Don't just list rules — explain WHY the rules work.
- If a student is confused, try explaining it a completely different way, don't just repeat yourself.

ADAPTIVE BEHAVIOR:
- Pay attention to the conversation history. Notice what they struggle with and what they get right.
- If they keep getting the same type of thing wrong, address the underlying misconception.
- Adjust your language complexity based on how they're responding.
- If they seem advanced, challenge them. If they seem lost, simplify.

ERROR ANALYSIS:
- When a student gets something wrong, don't just give the right answer.
- Figure out what they probably did wrong and explain the specific mistake.
- Show the correct process alongside their likely process so they can see the difference.

FORMATTING:
- Use **bold** for key terms and important results.
- Use line breaks to separate steps — don't create a wall of text.
- Use math notation naturally: ×, ÷, ², √, π, etc.
- For step-by-step solutions, number the steps or use clear visual separation.
`;

const SYSTEM_PROMPTS = {
  fast: (grade, name) =>
    `You're ${name}'s math buddy. They're in grade ${grade}.
${SHARED_INSTRUCTIONS}
RESPONSE STYLE FOR THIS MODEL:
- Keep it concise — aim for 3-8 sentences unless they ask for more detail.
- Give the answer and a quick explanation of how you got there.
- For simple computations, be snappy. For concepts, give the key insight without a full lecture.
- If they need more depth, mention they can switch to Advanced or Pro model.
- Still be warm and human — concise doesn't mean cold.`,

  advanced: (grade, name) =>
    `You're ${name}'s math tutor. They're in grade ${grade}. You're patient, thorough, and genuinely care about them understanding — not just getting the right answer.
${SHARED_INSTRUCTIONS}
RESPONSE STYLE FOR THIS MODEL:
- Break every problem into clear steps with reasoning.
- After solving, mention 1-2 common mistakes and how to avoid them.
- Offer a practice problem when it makes sense.
- Explain the "why" behind each step — build real understanding.
- Use analogies and connect to things a grade ${grade} student would know.
- Medium-length responses — thorough but not overwhelming.`,

  pro: (grade, name) =>
    `You're ${name}'s personal math mentor. They're in grade ${grade}. You're brilliant, deeply knowledgeable, and talk like someone who genuinely finds math beautiful and wants ${name} to see that too.
${SHARED_INSTRUCTIONS}
RESPONSE STYLE FOR THIS MODEL:
- Give the most comprehensive, insightful response you can.
- Show every step with clear reasoning. Connect ideas to the bigger picture.
- When analyzing mistakes, classify them (conceptual vs procedural vs careless) and give strategies.
- Use multiple approaches when relevant — "here's one way, but you could also think of it like..."
- Make math feel fascinating. Show patterns, connections, and elegance.
- After explanations, offer follow-up questions or challenge problems.
- Don't hold back on depth — this is the premium experience.`,
};

const GUEST_SYSTEM_PROMPT = `You are a basic math helper. You can ONLY help with math. If asked about anything other than math, respond: "Sorry, I can only help with math."
Give short, simple answers to math questions. You can do basic arithmetic and simple algebra but keep explanations brief.
Keep responses under 3 sentences. Don't offer practice problems or quizzes unless asked.
If asked something very complex (calculus, advanced trig, proofs), say you can only help with basic math and suggest signing up for the full experience.
Be helpful but brief. No personality, no emojis, no excitement. Just answer the question plainly.
NEVER use LaTeX or TeX formatting (no \\boxed, \\frac, \\[, \\], backslash commands). Write math in plain text with Unicode symbols like ×, ÷, √, ², π.`;

export async function getGuestAIResponse(
  userMessage,
  chatHistory,
  imageBase64,
) {
  if (!OPENROUTER_API_KEY) {
    throw new Error("Missing API key. Set VITE_OPENROUTER_API_KEY.");
  }

  const messages = [{ role: "system", content: GUEST_SYSTEM_PROMPT }];
  const recent = chatHistory.slice(-4);
  for (const msg of recent) {
    messages.push({
      role: msg.role === "user" ? "user" : "assistant",
      content: msg.text,
    });
  }
  messages.push({
    role: "user",
    content: buildUserContent(userMessage, imageBase64),
  });

  const useModel = imageBase64 ? VISION_FALLBACK : MODEL_IDS.fast;

  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENROUTER_API_KEY}`,
    },
    body: JSON.stringify({
      model: useModel,
      messages,
      temperature: 0.3,
      max_tokens: 150,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `API error (${res.status})`);
  }

  const data = await res.json();
  const text = data.choices?.[0]?.message?.content;
  if (!text) throw new Error("No response — try again.");
  return stripLatex(text);
}

export async function getAIResponse(
  model,
  userMessage,
  chatHistory,
  grade,
  userName,
  imageBase64,
) {
  if (!OPENROUTER_API_KEY) {
    throw new Error("Missing API key. Set VITE_OPENROUTER_API_KEY.");
  }

  const buildPrompt = SYSTEM_PROMPTS[model] || SYSTEM_PROMPTS.fast;
  const systemPrompt = buildPrompt(grade, userName);
  const baseModel = MODEL_IDS[model] || MODEL_IDS.fast;

  // All GPT-5.4 models support images natively, so we just use the baseModel
  // unless we're on a non-vision model (like free ones)
  const isGptModel = baseModel.includes("gpt-5.4");
  const aiModel =
    imageBase64 && !isGptModel && model === "fast"
      ? VISION_FALLBACK
      : baseModel;

  const messages = [{ role: "system", content: systemPrompt }];
  // Send recent conversation history based on model tier
  const historyLimit = model === "fast" ? 10 : model === "advanced" ? 20 : 30;
  const recentHistory = chatHistory.slice(-historyLimit);
  for (const msg of recentHistory) {
    messages.push({
      role: msg.role === "user" ? "user" : "assistant",
      content: msg.text,
    });
  }
  messages.push({
    role: "user",
    content: buildUserContent(userMessage, imageBase64),
  });

  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENROUTER_API_KEY}`,
    },
    body: JSON.stringify({
      model: aiModel,
      messages,
      temperature: model === "fast" ? 0.7 : model === "advanced" ? 0.8 : 0.9,
      max_tokens: model === "fast" ? 800 : model === "advanced" ? 2500 : 4096,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    if (res.status === 429)
      throw new Error("Rate limited — wait a moment and try again.");
    throw new Error(err.error?.message || `API error (${res.status})`);
  }

  const data = await res.json();
  const text = data.choices?.[0]?.message?.content;
  if (!text) throw new Error("No response from AI — try again.");
  return stripLatex(text);
}
