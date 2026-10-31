// Maths + puzzle validation checks. Run: npm run test:math
import assert from "node:assert/strict";
import { hcfOf, lcmOf, gcd, lcm } from "../src/utils/math.ts";
import { PUZZLES } from "../src/data/puzzles.ts";
import { answerOf, evaluateAttempt, explain } from "../src/systems/puzzles/validate.ts";

assert.equal(gcd(24, 36), 12);
assert.equal(lcm(4, 6), 12);
assert.equal(hcfOf([42, 70]), 14);
assert.equal(lcmOf([3, 5, 6]), 30);
assert.throws(() => hcfOf([0, 5]));
assert.throws(() => lcmOf([4, -2]));
assert.equal(lcm(0, 5), 0);

for (const p of PUZZLES) {
  const a = answerOf(p);
  assert.equal(evaluateAttempt(p, a).status, "correct", p.id);
  for (let n = 1; n <= 400; n++) {
    const s = evaluateAttempt(p, n).status;
    if (n !== a) assert.notEqual(s, "correct", `${p.id} ${n}`);
    const divides = p.kind === "hcf" ? p.numbers.every((x) => x % n === 0) : p.numbers.every((x) => n % x === 0);
    assert.equal(s === "wrong", !divides, `${p.id} ${n}`);
  }
  assert.equal(evaluateAttempt(p, 0).status, "wrong");
  assert.equal(evaluateAttempt(p, 2.5).status, "wrong");
  if (p.kind === "lcm") assert.ok(a <= (p.steps ?? 0), `${p.id}: lane too short for answer ${a}`);
  assert.ok(explain(p).length > 2);
  console.log(p.id, p.classes ? `class ${p.classes}` : "", p.kind, p.numbers.join(","), "->", a);
}
console.log("ALL MATH CHECKS PASSED");
