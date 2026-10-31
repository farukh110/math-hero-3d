import { factorString, factorsOf, hcfOf, lcmOf, list, multiplesOf } from "@/utils/math";
import type { AttemptResult, PuzzleDef } from "@/types/puzzle";

/** The mathematically correct answer, computed (never stored). */
export function answerOf(p: PuzzleDef): number {
  return p.kind === "hcf" ? hcfOf(p.numbers) : lcmOf(p.numbers);
}

/**
 * Judge one attempt. HCF: attempt = group size. LCM: attempt = step number.
 * This is the only place success is decided.
 */
export function evaluateAttempt(p: PuzzleDef, attempt: number): AttemptResult {
  if (!Number.isInteger(attempt) || attempt < 1) {
    return { status: "wrong", message: "Pick a whole number of 1 or more." };
  }
  return p.kind === "hcf" ? evalHcf(p, attempt) : evalLcm(p, attempt);
}

function evalHcf(p: PuzzleDef, g: number): AttemptResult {
  const best = hcfOf(p.numbers);
  const leftovers = p.numbers.map((n) => n % g);
  if (leftovers.every((r) => r === 0)) {
    if (g === best) {
      return { status: "correct", message: `Perfect! Groups of ${g} use every crystal.` };
    }
    return {
      status: "valid-not-best",
      message: `Groups of ${g} work for both piles, but the groups can be even bigger. Try a larger number!`,
    };
  }
  const parts = p.numbers
    .map((n, i) => (leftovers[i] ? `${leftovers[i]} of the ${n} crystals ${leftovers[i] === 1 ? "is" : "are"} left over` : null))
    .filter(Boolean)
    .join(" and ");
  return {
    status: "wrong",
    message: `Not quite - with groups of ${g}, ${parts}. Every crystal must be used, so try another size.`,
  };
}

function evalLcm(p: PuzzleDef, step: number): AttemptResult {
  const best = lcmOf(p.numbers);
  const missing = p.numbers.filter((n) => step % n !== 0);
  if (missing.length === 0) {
    if (step === best) {
      return { status: "correct", message: `Yes! At step ${step} every fountain sprays together.` };
    }
    return {
      status: "valid-not-best",
      message: `All fountains spray together at step ${step}, but that is not the FIRST time. Look for an earlier stone!`,
    };
  }
  const who = missing.map((n) => `the every-${n} fountain`).join(" and ");
  return {
    status: "wrong",
    message: `At step ${step}, ${who} stays quiet (${step} is not in its times table). Find the first step where all of them spray.`,
  };
}

/** Explanation text generated from the puzzle's real numbers. */
export function explain(p: PuzzleDef): string[] {
  const [a, b] = p.numbers;
  if (p.kind === "hcf") {
    const ans = hcfOf(p.numbers);
    const lines = p.numbers.map((n) => `Factors of ${n}: ${list(factorsOf(n))}`);
    return [
      ...lines,
      `Common factors: ${list(factorsOf(ans))}. The greatest is ${ans}.`,
      `${a} ÷ ${ans} = ${a / ans} groups and ${b} ÷ ${ans} = ${b / ans} groups, with nothing left over.`,
      `Prime factors: ${a} = ${factorString(a)}, ${b} = ${factorString(b)}. Multiply the shared ones to get ${ans}.`,
      `No bigger number divides both ${a} and ${b} exactly, so HCF(${a}, ${b}) = ${ans}.`,
    ];
  }
  const ans = lcmOf(p.numbers);
  const lines = p.numbers.map((n) => `Multiples of ${n}: ${list(multiplesOf(n, ans))}`);
  const out = [...lines, `The first number that appears in every list is ${ans}, so LCM = ${ans}.`];
  if (p.numbers.length === 2) {
    const h = hcfOf(p.numbers);
    out.push(`Check: LCM = (${a} × ${b}) ÷ HCF = ${a * b} ÷ ${h} = ${ans}.`);
  } else {
    out.push(
      `Prime factors: ${p.numbers.map((n) => `${n} = ${factorString(n)}`).join(", ")}. Take each prime at its highest power.`,
    );
  }
  return out;
}
