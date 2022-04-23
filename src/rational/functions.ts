import { DivisionByZeroError, NegativeRootError } from "../common";

// Only the first number can have sign
export type RationalNumber = [bigint, bigint];

// Assumes only one `.` as decimal separator + optional starting symbol, no exponent.
export function fromDecimalString(s: string): RationalNumber {
  const decimalPosition = s.indexOf(".");
  const decimals = decimalPosition >= 0 ? s.length - decimalPosition - 1 : 0;
  const d = BigInt(10) ** BigInt(decimals);
  const n = BigInt(s.replace(".", ""));

  return reduce([n, d]);
}

export function fromNumber(n: number) {
  return fromDecimalString(
    n.toLocaleString("fullwide", { useGrouping: false })
  );
}

export function toNumber(a: RationalNumber) {
  return Number(a[0]) / Number(a[1]);
}

export function toDecimalString(
  a: RationalNumber,
  options?: { radix: number; maxDecimals: number }
) {
  const { radix = 10, maxDecimals = 10 } = options ?? {};
  const sign = a[0] < 0n ? "-" : "";
  const num = s_abs(a[0]);
  const den = a[1];

  // Split fractional part from integer part
  const integerPart = num / den;
  const fractionalPart = num - integerPart * den;

  if (fractionalPart === 0n) {
    return sign + integerPart.toString(Number(options.radix));
  }

  let decimalStr = "";
  /*
  E.g. radix = 3;

  Is 2/3 < a/b ? No
  Is 1/3 < a/b ? Yes!
  -> Push `1` to decimalStr
  -> update a/b = a/b - 1/3;
  
  Is 2/9 < a/b ? No
  Is 1/9 < a/b ? No
  // 0/9 must be < a/b
  -> Push `0` to decimalStr

  Is 2/27 < a/b ? Yes!
  -> Push `2` to decimalStr
  -> update a/b = a/b - 2/27
  */
  let fraction: RationalNumber = [fractionalPart, den];
  const bigRadix = BigInt(radix);
  let power = bigRadix;
  while (fraction[0] !== 0n && decimalStr.length < maxDecimals) {
    /** To compare x / p < a / b, we can simplify:
     * (x / p) < (a / b)
     * => ((x * b) / (p * b)) < ((a * p) / (p * b))
     * => (x * b) < (a * p)
     * => x < (a * p) / b
     */
    const x = (fraction[0] * power) / fraction[1];
    decimalStr += x;
    fraction = sub(fraction, [x, power]);
    power = power * bigRadix;
  }

  return sign + integerPart.toString(Number(options.radix)) + "." + decimalStr;
}

export function neg(a: RationalNumber): RationalNumber {
  return [-a[0], a[1]];
}
export function abs(a: RationalNumber): RationalNumber {
  return a[0] >= 0 ? a : neg(a);
}
export function inv(a: RationalNumber): RationalNumber {
  if (a[0] === 0n) {
    throw new DivisionByZeroError();
  }

  return a[0] > 0 ? [a[1], a[0]] : [-a[1], -a[0]];
}
export function add(a: RationalNumber, b: RationalNumber) {
  const lcm_val = lcm(a[1], b[1]);
  const num = (a[0] * lcm_val) / a[1] + (b[0] * lcm_val) / b[1];

  // Reduce still needed: e.g. 2/3 + 5/6 = (4+5)/6 = 9/6 = 3/2
  return reduce([num, lcm_val]);
  // return reduce([a[0] * b[1] + b[0] * a[1], a[1] * b[1]]); TODO Benchmark which one is faster
}
export function sub(a: RationalNumber, b: RationalNumber) {
  return add(a, neg(b));
}
export function mul(a: RationalNumber, b: RationalNumber) {
  return reduce([a[0] * b[0], a[1] * b[1]]);
}
export function div(a: RationalNumber, b: RationalNumber) {
  return mul(a, inv(b));
}

export function exp(a: RationalNumber, b: bigint): RationalNumber {
  return [a[0] ** b, a[1] ** b];
}

// Assumes number is reduced. -1 = a is bigger, 0 = both are equal, 1 = b is bigger.
export function cmp(a: RationalNumber, b: RationalNumber): -1 | 0 | 1 {
  return s_cmp(a[0] * b[1], a[1] * b[0]);
}
function s_cmp(a: bigint, b: bigint): -1 | 0 | 1 {
  if (a === b) return 0;
  if (a > b) return -1;
  return 1;
}

// Approximations
// When numbers get too precise, performance can take a big hit. Even the runtime can blow up if numbers get too big
// This function takes a RationalNumber and returns another with smaller denominator that approximates it.
// Mhh.... sometimes it doesn't really aproximate, e.g. approx([173187621363126874672123123423421n,173187621363126874672123123423423n], 4), or any 1/n really
export function approx(a: RationalNumber, depth: number): RationalNumber {
  const sign = a[0] < 0 ? -1n : 1n;

  const integerPart = s_abs(a[0]) / a[1];
  const fractionalPart = s_abs(a[0]) - integerPart * a[1];

  if (depth <= 0 || fractionalPart === 0n) return [sign * integerPart, 1n];

  const result = add_integer(
    inv(approx([a[1], fractionalPart], depth - 1)),
    integerPart
  );
  return [sign * result[0], result[1]];
}
function add_integer(a: RationalNumber, int: bigint): RationalNumber {
  return [a[0] + int * a[1], a[1]];
}

// Very rough approximation
export function root(a: RationalNumber, b: bigint): RationalNumber {
  return [s_root(a[0], b), s_root(a[1], b)];
}
// https://golb.hplar.ch/2018/09/javascript-bigint.html
// https://stackoverflow.com/questions/1375953/how-to-calculate-an-arbitrary-power-root
// https://en.wikipedia.org/wiki/Nth_root#Using_Newton's_method
function s_root(a: bigint, b: bigint) {
  // I'm thinking losing precision converting to number is better than this shit, that also loses precision.
  // Or using the log definition if I fancy it

  if (b === 1n) {
    return a;
  }
  if (a < 0n) {
    // In theory you can do it if b is odd but whatever.
    throw new NegativeRootError();
  }

  // Newton's method to calculate the nth root of A
  const A = a;
  const n = b;
  let x = a; // Initial guess

  while (x ** n !== A) {
    // x = x - (x ** n - A) / (n * x ** (n - 1n));
    x = ((n - 1n) * x + A / x ** (n - 1n)) / n;
  }

  // const visited = new Set<bigint>();
  // let x = a;

  // while (x ** b !== b && !visited.has(x)) {
  //   visited.add(x);
  //   x = ((b - 1n) * x + a / x ** (b - 1n)) / b;
  //   x = (bx - x + a / x ** (b - 1n)) / b;
  // }

  // return x;
}

export function pow(a: RationalNumber, b: RationalNumber) {
  const result = root(exp(a, s_abs(b[0])), b[1]);
  if (a[0] < 0n) {
    return inv(result);
  }
  return result;
}

/// Internal utils
function s_abs(a: bigint) {
  return a < 0n ? -a : a;
}
function gcd(a: bigint, b: bigint) {
  let _a = s_abs(a);
  let _b = s_abs(b);

  while (_b > 0n) {
    let tmp = _b;
    _b = _a % _b;
    _a = tmp;
  }

  return _a;
}
function lcm(a: bigint, b: bigint) {
  return (a * b) / gcd(a, b);
}
// Assumes a valid number (d !== 0n)
function reduce([n, d]: RationalNumber): RationalNumber {
  if (n === 0n) {
    return [0n, 1n];
  }

  const divisor = gcd(n, d);
  return [n / divisor, d / divisor];
}
