// ── Safe Recursive Descent Math Expression Evaluator ──────────

function factorial(n) {
  if (n < 0 || n !== Math.floor(n)) return NaN;
  if (n > 170) return Infinity;
  let r = 1;
  for (let i = 2; i <= n; i++) r *= i;
  return r;
}

function tokenize(expr) {
  const tokens = [];
  let i = 0;
  while (i < expr.length) {
    if (/\s/.test(expr[i])) { i++; continue; }
    if (/[\d.]/.test(expr[i])) {
      let num = "";
      while (i < expr.length && /[\d.]/.test(expr[i])) num += expr[i++];
      tokens.push({ type: "num", value: parseFloat(num) });
      continue;
    }
    if (expr[i] === "π") { tokens.push({ type: "num", value: Math.PI }); i++; continue; }
    if (expr.slice(i, i + 2).toLowerCase() === "pi" && (i + 2 >= expr.length || !/[a-z]/i.test(expr[i + 2]))) {
      tokens.push({ type: "num", value: Math.PI }); i += 2; continue;
    }
    const fm = expr.slice(i).match(/^(sqrt|sin|cos|tan|log|ln|abs)/i);
    if (fm) { tokens.push({ type: "fn", value: fm[1].toLowerCase() }); i += fm[1].length; continue; }
    if ("+-*/^!%".includes(expr[i])) { tokens.push({ type: "op", value: expr[i] }); i++; continue; }
    if (expr[i] === "(") { tokens.push({ type: "(" }); i++; continue; }
    if (expr[i] === ")") { tokens.push({ type: ")" }); i++; continue; }
    i++; // skip unknown
  }
  return tokens;
}

class Parser {
  constructor(tokens) { this.t = tokens; this.p = 0; }
  peek() { return this.t[this.p] || null; }
  next() { return this.t[this.p++]; }
  expr() {
    let left = this.term();
    while (this.peek()?.type === "op" && "+-".includes(this.peek().value)) {
      const op = this.next().value;
      const right = this.term();
      left = op === "+" ? left + right : left - right;
    }
    return left;
  }
  term() {
    let left = this.power();
    while (this.peek()?.type === "op" && "*/".includes(this.peek().value)) {
      const op = this.next().value;
      const right = this.power();
      left = op === "*" ? left * right : left / right;
    }
    return left;
  }
  power() {
    let base = this.unary();
    if (this.peek()?.type === "op" && this.peek().value === "^") {
      this.next();
      base = Math.pow(base, this.power());
    }
    if (this.peek()?.type === "op" && this.peek().value === "!") {
      this.next();
      base = factorial(base);
    }
    return base;
  }
  unary() {
    if (this.peek()?.type === "op" && this.peek().value === "-") {
      this.next(); return -this.unary();
    }
    return this.atom();
  }
  atom() {
    const t = this.peek();
    if (!t) throw new Error("unexpected end");
    if (t.type === "num") {
      this.next();
      if (this.peek()?.type === "op" && this.peek().value === "!") {
        this.next(); return factorial(t.value);
      }
      return t.value;
    }
    if (t.type === "fn") {
      const fn = this.next().value;
      if (this.peek()?.type !== "(") throw new Error("expected (");
      this.next();
      const arg = this.expr();
      if (this.peek()?.type !== ")") throw new Error("expected )");
      this.next();
      const funcs = {
        sqrt: Math.sqrt, abs: Math.abs, log: Math.log10, ln: Math.log,
        sin: (x) => Math.sin((x * Math.PI) / 180),
        cos: (x) => Math.cos((x * Math.PI) / 180),
        tan: (x) => Math.tan((x * Math.PI) / 180),
      };
      return (funcs[fn] || Math.abs)(arg);
    }
    if (t.type === "(") {
      this.next();
      const val = this.expr();
      if (this.peek()?.type !== ")") throw new Error("expected )");
      this.next();
      if (this.peek()?.type === "op" && this.peek().value === "!") {
        this.next(); return factorial(val);
      }
      return val;
    }
    throw new Error("unexpected token");
  }
}

function safeEval(expr) {
  try {
    const tokens = tokenize(expr);
    if (tokens.length === 0) return null;
    const p = new Parser(tokens);
    const result = p.expr();
    if (p.p < p.t.length) return null;
    if (typeof result !== "number" || !isFinite(result)) return null;
    return result;
  } catch {
    return null;
  }
}

function fmt(n) {
  if (n === Math.PI) return "π";
  if (Number.isInteger(n)) return n.toString();
  const s = parseFloat(n.toFixed(6)).toString();
  return s.length > 12 ? n.toFixed(4) : s;
}

// ── Normalize math notation in user input ─────────────

function norm(msg) {
  return msg
    .replace(/×/g, "*").replace(/÷/g, "/").replace(/−/g, "-")
    .replace(/²/g, "^2").replace(/³/g, "^3")
    .replace(/√\(/g, "sqrt(").replace(/√(\d)/g, "sqrt($1)")
    .trim();
}

// ── Problem Extractors ────────────────────────────────

function tryPercent(lo) {
  let m = lo.match(/(\d+\.?\d*)\s*%\s*of\s*(\d+\.?\d*)/);
  if (m) {
    const pct = parseFloat(m[1]), num = parseFloat(m[2]);
    const r = (pct / 100) * num;
    return {
      answer: fmt(r),
      steps: [
        `We need ${pct}% of ${num}.`,
        `Convert percent to decimal: ${pct}% = ${pct} ÷ 100 = ${pct / 100}`,
        `Multiply: ${pct / 100} × ${num} = **${fmt(r)}**`,
      ],
    };
  }
  m = lo.match(/what\s+percent(?:age)?\s+(?:is\s+)?(\d+\.?\d*)\s+(?:of|out\s+of)\s+(\d+\.?\d*)/);
  if (m) {
    const part = parseFloat(m[1]), whole = parseFloat(m[2]);
    const r = (part / whole) * 100;
    return {
      answer: fmt(r) + "%",
      steps: [
        `What percent is ${part} of ${whole}?`,
        `Divide: ${part} ÷ ${whole} = ${fmt(part / whole)}`,
        `Multiply by 100: ${fmt(part / whole)} × 100 = **${fmt(r)}%**`,
      ],
    };
  }
  return null;
}

function tryEquation(lo) {
  // ax + b = c  or  ax - b = c
  const cleaned = lo.replace(/solve\s*/i, "").replace(/find\s*/i, "").replace(/what\s+is\s*/i, "").trim();
  const m = cleaned.match(/^(-?\d*\.?\d*)\s*([a-z])\s*([+-])\s*(\d+\.?\d*)\s*=\s*(-?\d+\.?\d*)$/i);
  if (m) {
    const coef = m[1] === "" || m[1] === "-" ? (m[1] === "-" ? -1 : 1) : parseFloat(m[1]);
    const v = m[2];
    const b = parseFloat(m[4]) * (m[3] === "-" ? -1 : 1);
    const c = parseFloat(m[5]);
    const x = (c - b) / coef;
    const undoWhat = b > 0 ? `Subtract ${fmt(Math.abs(b))} from both sides` : `Add ${fmt(Math.abs(b))} to both sides`;
    const steps = [
      `We want to get **${v}** alone.`,
      `Start with: ${coef === 1 ? "" : coef === -1 ? "-" : coef}${v} ${m[3]} ${m[4]} = ${m[5]}`,
      `${undoWhat}: ${coef === 1 ? "" : coef === -1 ? "-" : coef}${v} = ${fmt(c - b)}`,
    ];
    if (coef !== 1 && coef !== -1) {
      steps.push(`Divide both sides by ${coef}: ${v} = ${fmt(c - b)} ÷ ${coef} = **${fmt(x)}**`);
    } else if (coef === -1) {
      steps.push(`Multiply both sides by -1: ${v} = **${fmt(x)}**`);
    } else {
      steps[steps.length - 1] = steps[steps.length - 1].replace(fmt(c - b), `**${fmt(x)}**`);
    }
    const check = coef * x + b;
    steps.push(`\nLet's check: ${coef === 1 ? "" : coef}(${fmt(x)}) ${m[3]} ${m[4]} = ${fmt(check)} ${Math.abs(check - c) < 0.001 ? "✓" : ""}`);
    return { answer: `${v} = ${fmt(x)}`, steps };
  }

  // simple: x = ...  or  just ax = c
  const m2 = cleaned.match(/^(-?\d*\.?\d*)\s*([a-z])\s*=\s*(-?\d+\.?\d*)$/i);
  if (m2) {
    const coef = m2[1] === "" ? 1 : parseFloat(m2[1]);
    const v = m2[2];
    const c = parseFloat(m2[3]);
    const x = c / coef;
    if (coef === 1) return null; // already solved
    return {
      answer: `${v} = ${fmt(x)}`,
      steps: [
        `We have: ${coef}${v} = ${c}`,
        `Divide both sides by ${coef}: ${v} = ${c} ÷ ${coef} = **${fmt(x)}**`,
      ],
    };
  }

  return null;
}

function trySqrt(msg, lo) {
  let m = lo.match(/(?:square\s+root\s+(?:of\s+)?|√\s*)(\d+\.?\d*)/);
  if (!m) m = lo.match(/(?:what\s+is\s+)?sqrt\s*\(?(\d+\.?\d*)\)?/);
  if (m) {
    const n = parseFloat(m[1]);
    const r = Math.sqrt(n);
    const perfect = Number.isInteger(r);
    const steps = [`We need √${n} — what number times itself equals ${n}?`];
    if (perfect) {
      steps.push(`${fmt(r)} × ${fmt(r)} = ${n}`);
      steps.push(`So √${n} = **${fmt(r)}**`);
    } else {
      // simplify
      let best = 1;
      for (let i = Math.floor(Math.sqrt(n)); i >= 2; i--) {
        if (n % (i * i) === 0) { best = i; break; }
      }
      if (best > 1 && Number.isInteger(n)) {
        const inside = n / (best * best);
        steps.push(`${n} = ${best * best} × ${inside}`);
        steps.push(`√${n} = √(${best * best} × ${inside}) = ${best}√${inside}`);
        steps.push(`As a decimal, that's about **${fmt(r)}**`);
      } else {
        steps.push(`${n} isn't a perfect square, so √${n} ≈ **${fmt(r)}**`);
      }
    }
    return { answer: perfect ? fmt(r) : `≈ ${fmt(r)}`, steps };
  }
  return null;
}

function tryPower(msg, lo) {
  // "5 to the power of 3", "5^3", "what is 2 to the 10th"
  let base, exp;
  let m = lo.match(/(\d+\.?\d*)\s*(?:to\s+the\s+(?:power\s+(?:of\s+)?)?|raised\s+to\s+)(\d+\.?\d*)/);
  if (m) { base = parseFloat(m[1]); exp = parseFloat(m[2]); }
  if (!m) {
    m = lo.match(/(\d+\.?\d*)\s*(?:to\s+the\s+)(\d+)(?:st|nd|rd|th)?/);
    if (m) { base = parseFloat(m[1]); exp = parseFloat(m[2]); }
  }
  if (!m) {
    m = msg.match(/(\d+\.?\d*)\s*\^\s*(\d+\.?\d*)/);
    if (m) { base = parseFloat(m[1]); exp = parseFloat(m[2]); }
  }
  if (!m) {
    m = lo.match(/(\d+\.?\d*)\s+(?:squared)/);
    if (m) { base = parseFloat(m[1]); exp = 2; }
  }
  if (!m) {
    m = lo.match(/(\d+\.?\d*)\s+(?:cubed)/);
    if (m) { base = parseFloat(m[1]); exp = 3; }
  }
  if (base !== undefined && exp !== undefined) {
    const r = Math.pow(base, exp);
    const steps = [`We need ${base} to the power of ${exp}.`];
    if (exp <= 6 && Number.isInteger(exp) && exp > 0) {
      const expanded = Array(exp).fill(fmt(base)).join(" × ");
      steps.push(`That means ${base} multiplied by itself ${exp} time${exp > 1 ? "s" : ""}:`);
      steps.push(`${expanded} = **${fmt(r)}**`);
    } else {
      steps.push(`${base}^${exp} = **${fmt(r)}**`);
    }
    return { answer: fmt(r), steps };
  }
  return null;
}

function tryFactorial(msg, lo) {
  // "5!", "5 factorial", "what is 7!"
  let m = lo.match(/(\d+)\s*(?:factorial|!)/);
  if (!m) m = lo.match(/factorial\s*(?:of\s+)?(\d+)/);
  if (m) {
    const n = parseInt(m[1]);
    if (n > 20) return { answer: "very large", steps: [`${n}! is astronomically large — it has ${Math.round(n * Math.log10(n) - n * Math.log10(Math.E) + 0.5 * Math.log10(2 * Math.PI * n))} digits!`] };
    const r = factorial(n);
    const nums = [];
    for (let i = n; i >= 1; i--) nums.push(i);
    const steps = [
      `${n}! means we multiply every number from ${n} down to 1.`,
      `${nums.join(" × ")} = **${fmt(r)}**`,
    ];
    if (n > 3) {
      let running = n;
      const partials = [`${n}`];
      for (let i = n - 1; i >= 1; i--) {
        running *= i;
        partials.push(`× ${i} = ${running}`);
      }
      steps.push(`Step by step: ${partials.join(", ")}`);
    }
    return { answer: fmt(r), steps };
  }
  return null;
}

function tryGeometry(msg, lo) {
  // area of circle with radius R
  let m = lo.match(/area\s+(?:of\s+)?(?:a\s+)?circle\s+(?:with\s+)?(?:radius|r)\s*(?:=|of|is)?\s*(\d+\.?\d*)/);
  if (m) {
    const r = parseFloat(m[1]);
    const area = Math.PI * r * r;
    return {
      answer: fmt(area),
      steps: [
        `Area of a circle = π × r²`,
        `r = ${r}, so: π × ${r}² = π × ${r * r} = **${fmt(area)}**`,
      ],
    };
  }

  // area of rectangle
  m = lo.match(/area\s+(?:of\s+)?(?:a\s+)?rect(?:angle)?\s+(?:with\s+)?(?:length|l)?\s*(\d+\.?\d*)\s*(?:by|×|x|and|,|width|w)\s*(\d+\.?\d*)/);
  if (m) {
    const l = parseFloat(m[1]), w = parseFloat(m[2]);
    return {
      answer: fmt(l * w),
      steps: [`Area of rectangle = length × width`, `${l} × ${w} = **${fmt(l * w)}**`],
    };
  }

  // area of triangle
  m = lo.match(/area\s+(?:of\s+)?(?:a\s+)?triangle\s+(?:with\s+)?(?:base|b)?\s*(\d+\.?\d*)\s+(?:and\s+)?(?:height|h|,)?\s*(\d+\.?\d*)/);
  if (m) {
    const b = parseFloat(m[1]), h = parseFloat(m[2]);
    const area = 0.5 * b * h;
    return {
      answer: fmt(area),
      steps: [`Area of triangle = ½ × base × height`, `½ × ${b} × ${h} = **${fmt(area)}**`],
    };
  }

  // perimeter of rectangle
  m = lo.match(/perimeter\s+(?:of\s+)?(?:a\s+)?rect(?:angle)?\s+(\d+\.?\d*)\s*(?:by|×|x|and|,)\s*(\d+\.?\d*)/);
  if (m) {
    const l = parseFloat(m[1]), w = parseFloat(m[2]);
    const p = 2 * (l + w);
    return {
      answer: fmt(p),
      steps: [`Perimeter = 2 × (length + width)`, `2 × (${l} + ${w}) = 2 × ${l + w} = **${fmt(p)}**`],
    };
  }

  // volume of box/rectangular prism
  m = lo.match(/volume\s+(?:of\s+)?(?:a\s+)?(?:box|rectangular\s+prism)\s+(\d+\.?\d*)\s*(?:by|×|x|,)\s*(\d+\.?\d*)\s*(?:by|×|x|,)\s*(\d+\.?\d*)/);
  if (m) {
    const l = parseFloat(m[1]), w = parseFloat(m[2]), h = parseFloat(m[3]);
    return {
      answer: fmt(l * w * h),
      steps: [`Volume = length × width × height`, `${l} × ${w} × ${h} = **${fmt(l * w * h)}**`],
    };
  }

  // circumference of circle
  m = lo.match(/circumference\s+(?:of\s+)?(?:a\s+)?circle\s+(?:with\s+)?(?:radius|r)\s*(?:=|of|is)?\s*(\d+\.?\d*)/);
  if (m) {
    const r = parseFloat(m[1]);
    return {
      answer: fmt(2 * Math.PI * r),
      steps: [`Circumference = 2πr`, `2 × π × ${r} = **${fmt(2 * Math.PI * r)}**`],
    };
  }

  return null;
}

function tryArithmetic(msg, lo) {
  // "what is 5 + 3", "5 plus 8", "12 times 4", "100 divided by 5"
  const wordOps = lo
    .replace(/what(?:'s| is)\s*/g, "")
    .replace(/\bplus\b/g, "+").replace(/\bminus\b/g, "-")
    .replace(/\btimes\b/g, "*").replace(/\bmultiplied\s+by\b/g, "*")
    .replace(/\bdivided\s+by\b/g, "/").replace(/\bover\b/g, "/")
    .trim();

  const m = wordOps.match(/^(-?\d+\.?\d*)\s*([+\-*/])\s*(-?\d+\.?\d*)$/);
  if (m) {
    const a = parseFloat(m[1]), op = m[2], b = parseFloat(m[3]);
    let result;
    const opName = { "+": "add", "-": "subtract", "*": "multiply", "/": "divide" }[op];
    const opWord = { "+": "Adding", "-": "Subtracting", "*": "Multiplying", "/": "Dividing" }[op];
    if (op === "+") result = a + b;
    else if (op === "-") result = a - b;
    else if (op === "*") result = a * b;
    else if (op === "/") {
      if (b === 0) return { answer: "undefined", steps: ["We can't divide by zero — it's undefined!"] };
      result = a / b;
    }
    const sym = { "+": "+", "-": "−", "*": "×", "/": "÷" }[op];
    return {
      answer: fmt(result),
      steps: [`${a} ${sym} ${b} = **${fmt(result)}**`],
    };
  }
  return null;
}

function tryExpression(msg) {
  const cleaned = norm(msg)
    .replace(/what(?:'s| is)\s*/gi, "")
    .replace(/\bplus\b/gi, "+").replace(/\bminus\b/gi, "-")
    .replace(/\btimes\b/gi, "*").replace(/\bmultiplied\s+by\b/gi, "*")
    .replace(/\bdivided\s+by\b/gi, "/").replace(/\bover\b/gi, "/")
    .replace(/[=?]/g, "").trim();

  if (!/\d/.test(cleaned)) return null;
  if (cleaned.match(/[a-z]{2,}/i) && !cleaned.match(/^(sqrt|sin|cos|tan|log|ln|abs|pi)/i)) return null;

  const result = safeEval(cleaned);
  if (result === null) return null;

  return {
    answer: fmt(result),
    steps: [`${msg.replace(/what(?:'s| is)\s*/gi, "").replace(/[?]/g, "").trim()} = **${fmt(result)}**`],
  };
}

// ── Error checking: "I got X but answer is Y" ────────

function tryErrorCheck(lo) {
  const m = lo.match(/i\s+got\s+(-?\d+\.?\d*)\s+(?:but|and)\s+(?:the\s+)?(?:correct\s+)?(?:answer|it)\s+(?:is|was|should\s+be)\s+(-?\d+\.?\d*)/);
  if (m) {
    const got = parseFloat(m[1]), correct = parseFloat(m[2]);
    const diff = correct - got;
    return {
      answer: `The correct answer is ${fmt(correct)}`,
      isError: true,
      got: fmt(got),
      correct: fmt(correct),
      diff: fmt(diff),
    };
  }

  // "is 45 correct for 8 x 6" or "is 45 right"
  const m2 = lo.match(/is\s+(-?\d+\.?\d*)\s+(?:correct|right)\s+(?:for\s+)?(.+)/);
  if (m2) {
    const claimed = parseFloat(m2[1]);
    const problem = m2[2].trim();
    const actual = safeEval(norm(problem));
    if (actual !== null) {
      const isRight = Math.abs(claimed - actual) < 0.001;
      return {
        answer: isRight ? "Yes!" : `Not quite — it's ${fmt(actual)}`,
        isCheck: true,
        claimed: fmt(claimed),
        actual: fmt(actual),
        correct: isRight,
        problem,
      };
    }
  }

  return null;
}

// ── Quiz Generator ───────────────────────────────────

function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

function generateQuizProblem(grade) {
  const g = parseInt(grade) || 5;
  const pool = [];

  // Addition / subtraction (all grades)
  if (g <= 3) {
    pool.push(() => {
      const a = rand(2, 20), b = rand(2, 20);
      return { q: `What is ${a} + ${b}?`, a: a + b, hint: "Add the two numbers together." };
    });
    pool.push(() => {
      const b = rand(2, 15), a = b + rand(1, 15);
      return { q: `What is ${a} − ${b}?`, a: a - b, hint: "Subtract the smaller from the bigger." };
    });
  }
  if (g >= 2) {
    pool.push(() => {
      const a = rand(2, g <= 4 ? 12 : 25), b = rand(2, g <= 4 ? 12 : 25);
      return { q: `What is ${a} × ${b}?`, a: a * b, hint: `Think of it as ${a} groups of ${b}.` };
    });
  }
  if (g >= 3) {
    pool.push(() => {
      const b = pick([2, 3, 4, 5, 6, 7, 8, 9, 10, 12]);
      const ans = rand(2, 15);
      const a = b * ans;
      return { q: `What is ${a} ÷ ${b}?`, a: ans, hint: `How many times does ${b} go into ${a}?` };
    });
  }
  // Bigger arithmetic
  if (g >= 4) {
    pool.push(() => {
      const a = rand(50, 500), b = rand(50, 500);
      return { q: `What is ${a} + ${b}?`, a: a + b, hint: "Line up the place values and add column by column." };
    });
  }
  // Exponents
  if (g >= 5) {
    pool.push(() => {
      const base = rand(2, 10), exp = rand(2, g >= 8 ? 4 : 3);
      return { q: `What is ${base}^${exp}?`, a: Math.pow(base, exp), hint: `Multiply ${base} by itself ${exp} times.` };
    });
  }
  // Square roots
  if (g >= 6) {
    pool.push(() => {
      const root = rand(2, 12);
      const n = root * root;
      return { q: `What is √${n}?`, a: root, hint: `What number times itself equals ${n}?` };
    });
  }
  // Percent
  if (g >= 6) {
    pool.push(() => {
      const pct = pick([10, 20, 25, 30, 40, 50, 75]);
      const num = rand(2, 20) * 10;
      return { q: `What is ${pct}% of ${num}?`, a: (pct / 100) * num, hint: `Convert ${pct}% to a decimal (${pct / 100}) and multiply.` };
    });
  }
  // Simple equations
  if (g >= 7) {
    pool.push(() => {
      const x = rand(1, 15), coef = rand(2, 6), b = rand(1, 20);
      const c = coef * x + b;
      return { q: `Solve for x: ${coef}x + ${b} = ${c}`, a: x, hint: `Subtract ${b} from both sides, then divide by ${coef}.` };
    });
  }
  // Factorials
  if (g >= 8) {
    pool.push(() => {
      const n = rand(3, 7);
      let r = 1; for (let i = 2; i <= n; i++) r *= i;
      return { q: `What is ${n}!?`, a: r, hint: `Multiply all integers from ${n} down to 1.` };
    });
  }
  // Geometry
  if (g >= 5) {
    pool.push(() => {
      const l = rand(3, 15), w = rand(3, 15);
      return { q: `What's the area of a rectangle with length ${l} and width ${w}?`, a: l * w, hint: "Area = length × width." };
    });
    pool.push(() => {
      const r = rand(2, 10);
      const a = Math.round(Math.PI * r * r * 100) / 100;
      return { q: `What's the area of a circle with radius ${r}? (round to 2 decimals)`, a: a, hint: "Area = π × r². Use 3.14159..." };
    });
  }

  const gen = pick(pool);
  return gen();
}

function generateTopicQuiz(topic) {
  const lo = topic.toLowerCase();
  if (/add|plus|\+/.test(lo)) {
    const a = rand(10, 200), b = rand(10, 200);
    return { q: `What is ${a} + ${b}?`, a: a + b, hint: "Start from the ones column and carry when needed." };
  }
  if (/sub|minus|−/.test(lo)) {
    const b = rand(10, 100), a = b + rand(10, 200);
    return { q: `What is ${a} − ${b}?`, a: a - b, hint: "Borrow from the next column if the top digit is smaller." };
  }
  if (/mult|times|×/.test(lo)) {
    const a = rand(3, 15), b = rand(3, 15);
    return { q: `What is ${a} × ${b}?`, a: a * b, hint: `Think: ${a} groups of ${b}.` };
  }
  if (/div|÷/.test(lo)) {
    const b = rand(2, 12), ans = rand(2, 12), a = b * ans;
    return { q: `What is ${a} ÷ ${b}?`, a: ans, hint: `How many ${b}'s fit into ${a}?` };
  }
  if (/exp|power|\^/.test(lo)) {
    const base = rand(2, 10), exp = rand(2, 4);
    return { q: `What is ${base}^${exp}?`, a: Math.pow(base, exp), hint: `Multiply ${base} by itself ${exp} times.` };
  }
  if (/sqrt|root|√/.test(lo)) {
    const r = rand(2, 15), n = r * r;
    return { q: `What is √${n}?`, a: r, hint: `What number times itself = ${n}?` };
  }
  if (/percent|%/.test(lo)) {
    const pct = pick([10, 20, 25, 50, 75]), num = rand(2, 20) * 10;
    return { q: `What is ${pct}% of ${num}?`, a: (pct / 100) * num, hint: `${pct}% = ${pct / 100} as a decimal. Multiply.` };
  }
  if (/frac/.test(lo)) {
    const n1 = rand(1, 5), d1 = rand(2, 8), n2 = rand(1, 5), d2 = rand(2, 8);
    const lcd = d1 * d2;
    const ans = `${n1 * d2 + n2 * d1}/${lcd}`;
    return { q: `What is ${n1}/${d1} + ${n2}/${d2}? (leave as fraction)`, a: ans, hint: `Find a common denominator first: ${d1} × ${d2} = ${lcd}.` };
  }
  if (/equat|algebra|solve/.test(lo)) {
    const x = rand(1, 12), coef = rand(2, 6), b = rand(1, 20);
    return { q: `Solve: ${coef}x + ${b} = ${coef * x + b}`, a: x, hint: `Subtract ${b}, then divide by ${coef}.` };
  }
  if (/factor|!/.test(lo)) {
    const n = rand(4, 7);
    let r = 1; for (let i = 2; i <= n; i++) r *= i;
    return { q: `What is ${n}!?`, a: r, hint: `Multiply ${n} × ${n - 1} × ... × 1.` };
  }
  // Default: random arithmetic
  const a = rand(5, 50), b = rand(5, 50);
  return { q: `What is ${a} × ${b}?`, a: a * b, hint: `Break it apart: ${a} × ${b}.` };
}

// ── Main Exports ─────────────────────────────────────

export function solveProblem(message) {
  const msg = message.trim();
  const lo = msg.toLowerCase();

  return (
    tryErrorCheck(lo) ||
    tryPercent(lo) ||
    tryEquation(msg, lo) ||
    tryFactorial(msg, lo) ||
    trySqrt(msg, lo) ||
    tryPower(msg, lo) ||
    tryGeometry(msg, lo) ||
    tryArithmetic(msg, lo) ||
    tryExpression(msg) ||
    null
  );
}

export { generateQuizProblem, generateTopicQuiz, fmt };
