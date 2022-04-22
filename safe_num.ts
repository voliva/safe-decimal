export type SafeNumber = {
  n: number;
  d: number;
};

export function fromDecimalString(s: string): SafeNumber {
  // TODO binary, hex, octal
  const decimalPosition = s.indexOf(".");
  const decimals = decimalPosition >= 0 ? s.length - decimalPosition - 1 : 0;

  // Essentially, we move the comma to remove all decimals
  // then store the number as that of a multiple
  const d = 5 ** decimals;
  const n = Number(s.replace(".", "")) / 2 ** decimals;
  return { n, d };
}

export function fromNumber(n: number) {
  return fromScalar(n);
}

export function toNumber(a: SafeNumber) {
  return a.n / a.d;
}

export function toDecimalString(
  a: SafeNumber,
  options?: { radix?: number; maxDecimals?: number }
) {
  // TODO rounding (now it only does floor)
  const { radix = 10, maxDecimals = 20 } = options ?? {};
  const sign = a.n < 0 ? "-" : "";
  const num = Math.abs(a.n);
  const den = a.d;

  // Split fractional part from integer part
  const integerPart = Math.floor(num / den);
  const fractionalPart = num - integerPart * den;

  if (fractionalPart === 0) {
    return sign + integerPart.toString(radix);
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
  let fraction: SafeNumber = { n: fractionalPart, d: den };
  let power = radix;
  while (fraction.n !== 0 && decimalStr.length < maxDecimals) {
    /** To compare x / p < a / b, we can simplify:
     * (x / p) < (a / b)
     * => x < (a * p) / b
     */
    const x = Math.floor((fraction.n * power) / fraction.d);
    decimalStr += x;
    fraction = sub(fraction, { n: x, d: power });
    power = power * radix;
  }

  return sign + integerPart.toString(radix) + "." + decimalStr;
}

export function neg(a: SafeNumber): SafeNumber {
  return { n: -a.n, d: a.d };
}
export function abs(a: SafeNumber): SafeNumber {
  return a.d >= 0 ? a : neg(a);
}
export function inv(a: SafeNumber): SafeNumber {
  if (a.d === 0) {
    throw new Error("Division by 0");
  }

  return a.n > 0 ? { n: a.d, d: a.n } : { n: -a.d, d: -a.n };
}
export function add(a: SafeNumber, b: SafeNumber): SafeNumber {
  return reduce({ n: a.n * b.d + b.n * a.d, d: a.d * b.d });
}
export function sub(a: SafeNumber, b: SafeNumber) {
  return add(a, neg(b));
}
export function mul(a: SafeNumber, b: SafeNumber) {
  return reduce({ n: a.n * b.n, d: a.d * b.d });
}
export function div(a: SafeNumber, b: SafeNumber) {
  return mul(a, inv(b));
}

// Functions that can result in irrational numbers: Meaning precision is not guaranteed on these ones.
export function log(a: SafeNumber) {
  return fromScalar(Math.log(a.n) - Math.log(a.d));
}
export function log10(a: SafeNumber) {
  return fromScalar(Math.log10(a.n) - Math.log10(a.d));
}
export function log2(a: SafeNumber) {
  return fromScalar(Math.log2(a.n) - Math.log2(a.d));
}

// The following perform the division before, so precision can be lost before running the function
export function sin(a: SafeNumber) {
  return fromScalar(Math.sin(a.n / a.d));
}
export function cos(a: SafeNumber) {
  return fromScalar(Math.cos(a.n / a.d));
}
export function tan(a: SafeNumber) {
  return fromScalar(Math.tan(a.n / a.d));
}
export function exp(a: SafeNumber) {
  return fromScalar(Math.exp(a.n / a.d));
}
export function pow(a: SafeNumber, b: SafeNumber) {
  // x^m = exp(m log x)
  return exp(mul(b, log(a)));
}

// Assumes number is reduced. -1 = a is bigger, 0 = both are equal, 1 = b is bigger.
export function cmp(a: SafeNumber, b: SafeNumber): -1 | 0 | 1 {
  return s_cmp(a.n * b.d, a.d * b.n);
}
function s_cmp(a: number, b: number): -1 | 0 | 1 {
  if (a === b) return 0;
  if (a > b) return -1;
  return 1;
}

// Internal utils
function gcd(_a: number, _b: number) {
  let a = Math.abs(_a);
  let b = Math.abs(_b);
  // let f = 1;

  // Shift them until both of them are integers
  while (a !== Math.floor(a) || b !== Math.floor(b)) {
    a = a * 2;
    b = b * 2;
    // f = f * 2;
  }

  while (b > 0) {
    let tmp = b;
    b = a % b;
    a = tmp;
  }

  // return a / f; <-- This would essentially make every `reduce` make every value an integer - Not needed
  return a;
}
// Assumes a valid number (d !== 0n)
function reduce({ n, d }: SafeNumber): SafeNumber {
  if (n === 0) {
    return { n: 0, d: 1 };
  }

  const divisor = gcd(n, d);
  return { n: n / divisor, d: d / divisor };
}

function fromScalar(a: number): SafeNumber {
  return { n: a, d: 1 };
}
