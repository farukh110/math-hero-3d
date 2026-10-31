/** Pure maths helpers. All puzzle answers are derived from these, never hardcoded. */

export function isPositiveInt(n: number): boolean {
  return Number.isInteger(n) && n > 0;
}

/** Euclid's algorithm. Returns 0 only for gcd(0,0). */
export function gcd(a: number, b: number): number {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b !== 0) {
    [a, b] = [b, a % b];
  }
  return a;
}

/** LCM(a, b) = |a x b| / HCF(a, b). Returns 0 if either input is 0. */
export function lcm(a: number, b: number): number {
  if (a === 0 || b === 0) return 0;
  return Math.abs(a * b) / gcd(a, b);
}

function assertValid(nums: number[]): void {
  if (nums.length < 2 || !nums.every(isPositiveInt)) {
    throw new RangeError("Need at least two positive whole numbers");
  }
}

export function hcfOf(nums: number[]): number {
  assertValid(nums);
  return nums.reduce((acc, n) => gcd(acc, n));
}

export function lcmOf(nums: number[]): number {
  assertValid(nums);
  return nums.reduce((acc, n) => lcm(acc, n));
}

export function factorsOf(n: number): number[] {
  const out: number[] = [];
  for (let i = 1; i <= n; i++) if (n % i === 0) out.push(i);
  return out;
}

export function multiplesOf(n: number, upTo: number): number[] {
  const out: number[] = [];
  for (let m = n; m <= upTo; m += n) out.push(m);
  return out;
}

export function primeFactors(n: number): Map<number, number> {
  const map = new Map<number, number>();
  let rest = n;
  for (let p = 2; p * p <= rest; p++) {
    while (rest % p === 0) {
      map.set(p, (map.get(p) ?? 0) + 1);
      rest /= p;
    }
  }
  if (rest > 1) map.set(rest, (map.get(rest) ?? 0) + 1);
  return map;
}

const SUP = "⁰¹²³⁴⁵⁶⁷⁸⁹";
function sup(n: number): string {
  return String(n)
    .split("")
    .map((d) => SUP[Number(d)])
    .join("");
}

/** e.g. 36 -> "2² × 3²" */
export function factorString(n: number): string {
  if (n === 1) return "1";
  return [...primeFactors(n)]
    .map(([p, e]) => (e === 1 ? `${p}` : `${p}${sup(e)}`))
    .join(" × ");
}

export function list(nums: number[]): string {
  return nums.join(", ");
}
