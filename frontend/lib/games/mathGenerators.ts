/**
 * Algorithmic generators for math games.
 * All functions are pure and seeded by a counter so React can call them
 * repeatedly without producing duplicates within a session.
 */

// ─── Tiny PRNG (mulberry32) ───────────────────────────────────────────────────
// Used when we need deterministic output from a seed (e.g. during SSR).
// For client-side random, pass undefined and Math.random() is used.
function rng(seed?: number): () => number {
  if (seed === undefined) return Math.random;
  let s = seed | 0;
  return () => {
    s |= 0; s = s + 0x6d2b79f5 | 0;
    let t = Math.imul(s ^ s >>> 15, 1 | s);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

function pick<T>(arr: T[], rand: () => number): T {
  return arr[Math.floor(rand() * arr.length)];
}

function range(min: number, max: number, rand: () => number): number {
  return min + Math.floor(rand() * (max - min + 1));
}

// ─── SequenceSleuth ───────────────────────────────────────────────────────────

export type SequenceDifficulty = 'easy' | 'medium' | 'hard';

export interface SequenceQuestion {
  terms: number[];      // first 5 shown
  answer: number;       // 6th term
  patternName: string;
  explanation: string;
  difficulty: SequenceDifficulty;
}

export function generateSequence(seed?: number): SequenceQuestion {
  const r = rng(seed);
  const kind = Math.floor(r() * 10); // 0-9

  if (kind <= 1) {
    // Arithmetic
    const a = range(1, 20, r);
    const d = range(1, 15, r);
    const terms = Array.from({ length: 6 }, (_, i) => a + d * i);
    return {
      terms: terms.slice(0, 5), answer: terms[5],
      patternName: 'Arithmetic sequence',
      explanation: `Each term increases by ${d}. Next = ${terms[4]} + ${d} = ${terms[5]}.`,
      difficulty: 'easy',
    };
  }
  if (kind === 2) {
    // Arithmetic with negative difference
    const a = range(50, 120, r);
    const d = range(2, 12, r);
    const terms = Array.from({ length: 6 }, (_, i) => a - d * i);
    return {
      terms: terms.slice(0, 5), answer: terms[5],
      patternName: 'Descending arithmetic sequence',
      explanation: `Each term decreases by ${d}. Next = ${terms[4]} − ${d} = ${terms[5]}.`,
      difficulty: 'easy',
    };
  }
  if (kind === 3) {
    // Geometric (small ratio)
    const a = range(1, 5, r);
    const ratio = pick([2, 3], r);
    const terms = Array.from({ length: 6 }, (_, i) => a * Math.pow(ratio, i));
    return {
      terms: terms.slice(0, 5), answer: terms[5],
      patternName: `Geometric sequence (×${ratio})`,
      explanation: `Each term is multiplied by ${ratio}. Next = ${terms[4]} × ${ratio} = ${terms[5]}.`,
      difficulty: 'medium',
    };
  }
  if (kind === 4) {
    // Perfect squares
    const start = range(1, 8, r);
    const terms = Array.from({ length: 6 }, (_, i) => (start + i) ** 2);
    return {
      terms: terms.slice(0, 5), answer: terms[5],
      patternName: 'Perfect squares',
      explanation: `Terms are ${start}², ${start+1}², … The next is ${start+5}² = ${terms[5]}.`,
      difficulty: 'medium',
    };
  }
  if (kind === 5) {
    // Perfect cubes
    const start = range(1, 5, r);
    const terms = Array.from({ length: 6 }, (_, i) => (start + i) ** 3);
    return {
      terms: terms.slice(0, 5), answer: terms[5],
      patternName: 'Perfect cubes',
      explanation: `Terms are ${start}³, ${start+1}³, … The next is ${start+5}³ = ${terms[5]}.`,
      difficulty: 'medium',
    };
  }
  if (kind === 6) {
    // Triangular numbers T(n) = n(n+1)/2
    const start = range(1, 8, r);
    const terms = Array.from({ length: 6 }, (_, i) => {
      const n = start + i;
      return n * (n + 1) / 2;
    });
    return {
      terms: terms.slice(0, 5), answer: terms[5],
      patternName: 'Triangular numbers',
      explanation: `T(n) = n(n+1)/2. The next is T(${start+5}) = ${start+5}×${start+6}/2 = ${terms[5]}.`,
      difficulty: 'medium',
    };
  }
  if (kind === 7) {
    // Fibonacci-like (a, b, a+b, a+2b, …)
    const a = range(1, 8, r);
    const b = range(1, 8, r);
    const terms: number[] = [a, b];
    for (let i = 2; i < 6; i++) terms.push(terms[i-1] + terms[i-2]);
    return {
      terms: terms.slice(0, 5), answer: terms[5],
      patternName: 'Fibonacci-style sequence',
      explanation: `Each term = sum of the two before it. Next = ${terms[3]} + ${terms[4]} = ${terms[5]}.`,
      difficulty: 'medium',
    };
  }
  if (kind === 8) {
    // Powers of 2 offset
    const offset = range(0, 10, r);
    const terms = Array.from({ length: 6 }, (_, i) => Math.pow(2, i + 1) + offset);
    return {
      terms: terms.slice(0, 5), answer: terms[5],
      patternName: `Powers of 2 + ${offset}`,
      explanation: `Terms are 2¹+${offset}, 2²+${offset}, … Next = 2⁶+${offset} = ${terms[5]}.`,
      difficulty: 'hard',
    };
  }
  // kind === 9: quadratic n² + an + b
  const a = range(1, 5, r);
  const b = range(0, 10, r);
  const start = range(1, 5, r);
  const terms = Array.from({ length: 6 }, (_, i) => {
    const n = start + i;
    return n * n + a * n + b;
  });
  return {
    terms: terms.slice(0, 5), answer: terms[5],
    patternName: 'Quadratic sequence',
    explanation: `Formula: n² + ${a}n + ${b}. Next (n=${start+5}): ${start+5}² + ${a}×${start+5} + ${b} = ${terms[5]}.`,
    difficulty: 'hard',
  };
}

// ─── FractionFaceOff ──────────────────────────────────────────────────────────

export interface FractionItem {
  display: string;  // e.g. "3/4", "0.75", "75%"
  value: number;    // decimal for comparison
  type: 'fraction' | 'decimal' | 'percent' | 'mixed';
}

export interface FractionSet {
  items: FractionItem[];       // shuffled
  correctOrder: number[];      // indices into items[], ascending by value
  difficulty: SequenceDifficulty;
  points: number;
}

function gcd(a: number, b: number): number { return b === 0 ? a : gcd(b, a % b); }

function simplify(num: number, den: number): [number, number] {
  const g = gcd(Math.abs(num), Math.abs(den));
  return [num / g, den / g];
}

export function generateFractionSet(seed?: number): FractionSet {
  const r = rng(seed);
  const difficulty: SequenceDifficulty = pick(['easy', 'easy', 'medium', 'medium', 'hard'], r);
  const count = difficulty === 'easy' ? 4 : difficulty === 'medium' ? 5 : 6;

  // Generate unique decimal values in (0, 2]
  const values = new Set<number>();
  while (values.size < count) {
    let v: number;
    if (difficulty === 'easy') {
      // Simple fractions: denominator 2,3,4,5,8,10
      const den = pick([2, 3, 4, 5, 8, 10], r);
      const num = range(1, den - 1, r);
      const [sn, sd] = simplify(num, den);
      v = Math.round((sn / sd) * 1000) / 1000;
    } else if (difficulty === 'medium') {
      // Mix fractions + decimals + percents
      const den = pick([3, 4, 5, 6, 8, 10, 12], r);
      const num = range(1, den * 2 - 1, r);
      v = Math.round((num / den) * 1000) / 1000;
    } else {
      // Mixed numbers and harder fractions
      const whole = range(0, 2, r);
      const den = pick([3, 5, 6, 7, 8, 9, 11, 12], r);
      const num = range(1, den - 1, r);
      v = Math.round((whole + num / den) * 1000) / 1000;
    }
    if (!values.has(v)) values.add(v);
  }

  const sorted = [...values].sort((a, b) => a - b);

  const items: FractionItem[] = sorted.map((v, i) => {
    const typeRoll = r();
    let display: string;
    let type: FractionItem['type'];

    if (typeRoll < 0.33 && difficulty !== 'easy') {
      // Decimal
      display = v.toFixed(difficulty === 'hard' ? 3 : 2);
      type = 'decimal';
    } else if (typeRoll < 0.55 && difficulty !== 'easy') {
      // Percent
      display = `${Math.round(v * 100)}%`;
      type = 'percent';
    } else {
      // Fraction (find a close rational)
      const whole = Math.floor(v);
      const frac = v - whole;
      const den = pick(difficulty === 'easy' ? [2,3,4,5,10] : [3,4,5,6,7,8,10,12], r);
      const num = Math.round(frac * den);
      const [sn, sd] = simplify(Math.max(1, num), den);
      if (whole > 0 && frac > 0.01) {
        display = `${whole} ${sn}/${sd}`;
        type = 'mixed';
      } else if (frac < 0.01) {
        display = `${whole}`;
        type = 'fraction';
      } else {
        display = `${sn}/${sd}`;
        type = 'fraction';
      }
    }
    return { display, value: v, type };
  });

  // Shuffle items and track correct order by index
  const shuffled = [...items].sort(() => r() - 0.5);
  const correctOrder = sorted.map(sv => shuffled.findIndex(it => it.value === sv));

  return {
    items: shuffled,
    correctOrder,
    difficulty,
    points: difficulty === 'easy' ? 10 : difficulty === 'medium' ? 15 : 20,
  };
}

// ─── MathHangman ─────────────────────────────────────────────────────────────

export interface HangmanTarget {
  word: string;         // digits as string, e.g. "144"
  hint: string;         // e.g. "I am 12 squared"
  category: string;
  difficulty: SequenceDifficulty;
}

function isPrime(n: number): boolean {
  if (n < 2) return false;
  if (n === 2) return true;
  if (n % 2 === 0) return false;
  for (let i = 3; i * i <= n; i += 2) if (n % i === 0) return false;
  return true;
}

export function generateHangmanTargets(count: number, seed?: number): HangmanTarget[] {
  const r = rng(seed);
  const targets: HangmanTarget[] = [];
  const used = new Set<number>();

  const generators: Array<() => HangmanTarget | null> = [
    // Perfect squares 2–25
    () => {
      const base = range(2, 25, r);
      const n = base * base;
      if (used.has(n)) return null;
      used.add(n);
      return { word: String(n), hint: `I am ${base} squared (${base}²)`, category: 'Perfect square', difficulty: base <= 12 ? 'easy' : base <= 18 ? 'medium' : 'hard' };
    },
    // Perfect cubes 2–12
    () => {
      const base = range(2, 12, r);
      const n = base ** 3;
      if (used.has(n)) return null;
      used.add(n);
      return { word: String(n), hint: `I am ${base} cubed (${base}³)`, category: 'Perfect cube', difficulty: base <= 5 ? 'easy' : base <= 8 ? 'medium' : 'hard' };
    },
    // Primes between 10 and 300
    () => {
      let n = range(10, 300, r);
      // find nearest prime
      while (!isPrime(n) && n < 310) n++;
      if (!isPrime(n) || used.has(n)) return null;
      used.add(n);
      return { word: String(n), hint: `I am a prime number (divisible only by 1 and myself)`, category: 'Prime number', difficulty: n < 50 ? 'easy' : n < 150 ? 'medium' : 'hard' };
    },
    // Triangular numbers T(n) = n(n+1)/2, n=3..20
    () => {
      const base = range(3, 20, r);
      const n = base * (base + 1) / 2;
      if (used.has(n)) return null;
      used.add(n);
      return { word: String(n), hint: `I am the ${base}th triangular number: ${base}×${base+1}÷2`, category: 'Triangular number', difficulty: base <= 8 ? 'easy' : base <= 14 ? 'medium' : 'hard' };
    },
    // Powers of 2: 4,8,16…4096
    () => {
      const exp = range(2, 12, r);
      const n = 2 ** exp;
      if (used.has(n)) return null;
      used.add(n);
      return { word: String(n), hint: `I am 2 to the power of ${exp} (2^${exp})`, category: 'Power of 2', difficulty: exp <= 5 ? 'easy' : exp <= 9 ? 'medium' : 'hard' };
    },
    // Fibonacci numbers
    () => {
      const fibs = [8, 13, 21, 34, 55, 89, 144, 233, 377, 610, 987];
      const n = pick(fibs, r);
      if (used.has(n)) return null;
      used.add(n);
      const idx = fibs.indexOf(n) + 6; // approximate position in Fibonacci sequence
      return { word: String(n), hint: `I am a Fibonacci number — the sum of the two preceding Fibonacci numbers`, category: 'Fibonacci number', difficulty: n < 100 ? 'easy' : n < 400 ? 'medium' : 'hard' };
    },
    // Multiples of 11
    () => {
      const mult = range(11, 99, r);
      const n = mult * 11;
      if (used.has(n)) return null;
      used.add(n);
      return { word: String(n), hint: `I am ${mult} × 11. Hint: alternating digit sum is divisible by 11`, category: 'Multiple of 11', difficulty: mult <= 30 ? 'easy' : mult <= 60 ? 'medium' : 'hard' };
    },
    // Factorial
    () => {
      const base = pick([6, 7, 24, 120, 720, 5040], r);
      const labels: Record<number, string> = { 6: '3!', 7: '7', 24: '4!', 120: '5!', 720: '6!', 5040: '7!' };
      const n = base;
      if (used.has(n)) return null;
      used.add(n);
      const diff: SequenceDifficulty = n <= 24 ? 'easy' : n <= 720 ? 'medium' : 'hard';
      return { word: String(n), hint: `I am a factorial: ${labels[n]}`, category: 'Factorial', difficulty: diff };
    },
  ];

  let attempts = 0;
  while (targets.length < count && attempts < count * 20) {
    attempts++;
    const gen = pick(generators, r);
    const result = gen();
    if (result) targets.push(result);
  }

  return targets;
}

// ─── OperationBuilder ─────────────────────────────────────────────────────────

export interface OperationPuzzle {
  numbers: number[];    // e.g. [3, 5, 2]
  target: number;
  correctOps: string[]; // e.g. ['+', '×']
  difficulty: SequenceDifficulty;
  points: number;
}

const OPS = ['+', '−', '×', '÷'] as const;
type Op = typeof OPS[number];

function applyOp(a: number, b: number, op: Op): number | null {
  if (op === '+') return a + b;
  if (op === '−') return a - b;
  if (op === '×') return a * b;
  if (op === '÷') {
    if (b === 0 || a % b !== 0) return null; // integer division only
    return a / b;
  }
  return null;
}

function evalLeftToRight(nums: number[], ops: Op[]): number | null {
  let acc: number | null = nums[0];
  for (let i = 0; i < ops.length; i++) {
    if (acc === null) return null;
    acc = applyOp(acc, nums[i + 1], ops[i]);
  }
  return acc;
}

export function generateOperationPuzzle(seed?: number): OperationPuzzle {
  const r = rng(seed);
  const difficulty: SequenceDifficulty = pick(['easy', 'easy', 'medium', 'medium', 'hard'], r);
  const numCount = difficulty === 'easy' ? 2 : difficulty === 'medium' ? 3 : 4;

  for (let attempt = 0; attempt < 200; attempt++) {
    // Generate numbers
    const nums = Array.from({ length: numCount }, () =>
      difficulty === 'easy' ? range(1, 12, r) : range(1, 20, r)
    );

    // Generate ops
    const allowedOps: Op[] = difficulty === 'easy'
      ? ['+', '−']
      : difficulty === 'medium'
      ? ['+', '−', '×']
      : ['+', '−', '×', '÷'];

    const ops = Array.from({ length: numCount - 1 }, () => pick(allowedOps, r));

    const result = evalLeftToRight(nums, ops as Op[]);
    if (result === null || result <= 0 || result > 200 || !Number.isInteger(result)) continue;

    return {
      numbers: nums,
      target: result,
      correctOps: ops,
      difficulty,
      points: difficulty === 'easy' ? 10 : difficulty === 'medium' ? 15 : 20,
    };
  }

  // Fallback: guaranteed easy puzzle
  const a = range(2, 9, r);
  const b = range(2, 9, r);
  return { numbers: [a, b], target: a + b, correctOps: ['+'], difficulty: 'easy', points: 10 };
}

// ─── NumberConnections ────────────────────────────────────────────────────────

export interface NumberGroup {
  label: string;
  numbers: number[];
  color: 'yellow' | 'green' | 'blue' | 'purple';
}

export interface NumberConnectionsPuzzle {
  groups: NumberGroup[];
}

type GroupColor = 'yellow' | 'green' | 'blue' | 'purple';
const GROUP_COLORS: GroupColor[] = ['yellow', 'green', 'blue', 'purple'];

function rangeArr(start: number, count: number, step = 1): number[] {
  return Array.from({ length: count }, (_, i) => start + i * step);
}

function squaresInRange(min: number, max: number): number[] {
  const result: number[] = [];
  for (let i = 1; i * i <= max; i++) if (i * i >= min) result.push(i * i);
  return result;
}

function primesInRange(min: number, max: number): number[] {
  const result: number[] = [];
  for (let n = min; n <= max; n++) if (isPrime(n)) result.push(n);
  return result;
}

function triangularsInRange(min: number, max: number): number[] {
  const result: number[] = [];
  for (let n = 1; ; n++) {
    const t = n * (n + 1) / 2;
    if (t > max) break;
    if (t >= min) result.push(t);
  }
  return result;
}

export function generateNumberConnectionsPuzzle(seed?: number): NumberConnectionsPuzzle {
  const r = rng(seed);

  // Pool of potential group generators — each returns null if can't produce 4 unique items
  type GroupGen = (avoid: Set<number>) => { label: string; numbers: number[] } | null;

  const gens: GroupGen[] = [
    (avoid) => {
      const m = range(2, 15, r);
      const nums = rangeArr(m, 4, m).filter(n => !avoid.has(n));
      if (nums.length < 4) return null;
      return { label: `Multiples of ${m}`, numbers: nums.slice(0, 4) };
    },
    (avoid) => {
      const start = range(1, 8, r);
      const sq = squaresInRange(start * start, (start + 6) * (start + 6))
        .filter(n => !avoid.has(n));
      if (sq.length < 4) return null;
      return { label: 'Perfect squares', numbers: sq.slice(0, 4) };
    },
    (avoid) => {
      const min = range(2, 30, r);
      const ps = primesInRange(min, min + 40).filter(n => !avoid.has(n));
      if (ps.length < 4) return null;
      return { label: `Prime numbers (${ps[0]}–${ps[3]})`, numbers: ps.slice(0, 4) };
    },
    (avoid) => {
      const ts = triangularsInRange(1, 120).filter(n => !avoid.has(n));
      if (ts.length < 4) return null;
      const start = Math.floor(r() * (ts.length - 4));
      return { label: 'Triangular numbers', numbers: ts.slice(start, start + 4) };
    },
    (avoid) => {
      const exp = range(1, 7, r);
      const base = pick([2, 3], r);
      const nums = Array.from({ length: 4 }, (_, i) => base ** (exp + i)).filter(n => !avoid.has(n));
      if (nums.length < 4) return null;
      return { label: `Powers of ${base} (${base}^${exp}–${base}^${exp+3})`, numbers: nums };
    },
    (avoid) => {
      const m = pick([2, 5, 10], r);
      const start = range(m, m * 3, r);
      const nums = Array.from({ length: 4 }, (_, i) => start + m * i).filter(n => !avoid.has(n));
      if (nums.length < 4) return null;
      return { label: `Ends in ${m === 10 ? '0' : m === 5 ? '0 or 5' : 'even digit'}`, numbers: nums };
    },
    (avoid) => {
      // Numbers with digit sum divisible by 3
      const pool: number[] = [];
      for (let n = 12; n <= 99; n++) {
        const ds = String(n).split('').reduce((a, d) => a + parseInt(d), 0);
        if (ds % 3 === 0 && !avoid.has(n)) pool.push(n);
      }
      if (pool.length < 4) return null;
      const start = Math.floor(r() * (pool.length - 4));
      return { label: 'Divisible by 3 (digit sum rule)', numbers: pool.slice(start, start + 4) };
    },
    (avoid) => {
      // Fibonacci numbers available
      const fibs = [1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144].filter(n => !avoid.has(n));
      if (fibs.length < 4) return null;
      const start = Math.floor(r() * (fibs.length - 4));
      return { label: 'Fibonacci numbers', numbers: fibs.slice(start, start + 4) };
    },
    (avoid) => {
      // Perfect cubes
      const cubes = Array.from({ length: 8 }, (_, i) => (i + 2) ** 3).filter(n => !avoid.has(n));
      if (cubes.length < 4) return null;
      const start = Math.floor(r() * (cubes.length - 4));
      return { label: 'Perfect cubes', numbers: cubes.slice(start, start + 4) };
    },
    (avoid) => {
      // Numbers with exactly 2 factors (primes)
      const min = range(30, 80, r);
      const ps = primesInRange(min, min + 60).filter(n => !avoid.has(n));
      if (ps.length < 4) return null;
      return { label: 'Prime numbers', numbers: ps.slice(0, 4) };
    },
  ];

  const groups: NumberGroup[] = [];
  const used = new Set<number>();

  // Shuffle generators and pick 4
  const shuffledGens = [...gens].sort(() => r() - 0.5);
  for (const gen of shuffledGens) {
    if (groups.length === 4) break;
    const result = gen(used);
    if (!result) continue;
    result.numbers.forEach(n => used.add(n));
    groups.push({ ...result, color: GROUP_COLORS[groups.length] });
  }

  // Fallback: if we couldn't generate 4 clean groups, pad with multiples
  let fallbackMultiple = 2;
  while (groups.length < 4) {
    while (rangeArr(fallbackMultiple, 4, fallbackMultiple).some(n => used.has(n))) fallbackMultiple++;
    const nums = rangeArr(fallbackMultiple, 4, fallbackMultiple);
    nums.forEach(n => used.add(n));
    groups.push({ label: `Multiples of ${fallbackMultiple}`, numbers: nums, color: GROUP_COLORS[groups.length] });
    fallbackMultiple++;
  }

  return { groups };
}
