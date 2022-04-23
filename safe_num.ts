export interface SafeNumber {
  readonly n: number;
  readonly d: number;
}

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
export function toFractionString(a: SafeNumber, radix?: number) {
  return `${a.n.toString(radix)}/${a.d.toString(radix)}`;
}

export enum Rounding {
  Up = "up",
  Down = "down",
  Ceil = "ceil",
  Floor = "floor",
  Even = "even",
  HalfUp = "half-up",
  HalfDown = "half-down",
  HalfCeil = "half-ceil",
  HalfFloor = "half-floor",
  HalfEven = "half-even",
}
export function toDecimalString(
  a: SafeNumber,
  options?: { radix?: number; maxDecimals?: number; rounding?: Rounding }
) {
  const {
    radix = 10,
    maxDecimals = 20,
    rounding = Rounding.HalfCeil,
  } = options ?? {};
  const sign = a.n < 0 ? "-" : "";
  const num = Math.abs(a.n);
  const den = a.d;

  // Split fractional part from integer part
  let integerPart = Math.floor(num / den);
  const fractionalPart = num - integerPart * den;

  if (fractionalPart === 0) {
    return sign + integerPart.toString(radix);
  }

  let decimalPart = BigInt(0);
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

  TODO precision on this step is lost on recurring numbers with big decimals.
  We'll have to use bigint (try new NRN(2.2).toDecimalString({ maxDecimals: 20 }),
  the result is worse than Bignumber.js)
  */
  let fraction: SafeNumber = { n: fractionalPart, d: den };
  let power = radix;
  const bigRadix = BigInt(radix);
  for (let i = 0; i < maxDecimals && fraction.n !== 0; i++) {
    /** To compare x / p < a / b, we can simplify:
     * (x / p) < (a / b)
     * => x < (a * p) / b
     */
    const x = Math.floor((fraction.n * power) / fraction.d);
    decimalPart = decimalPart * bigRadix + BigInt(x);
    fraction = sub(fraction, { n: x, d: power });
    power = power * radix;
  }

  let decimalStr = "";
  if (fraction.n !== 0) {
    // The number is truncated. Meaning positive got smaller, Negative got even more negative.
    // This means rounding after the algorithm above is towards -Infinity: Rounding.Floor

    function increment() {
      if (maxDecimals === 0) {
        integerPart++;
      } else {
        decimalPart++;
      }
    }
    function awayFromZero() {
      if (sign === "-") {
        // Already away from 0
      } else {
        increment();
      }
    }
    function towardsZero() {
      if (sign === "-") {
        increment();
      } else {
        // Already closer to 0
      }
    }
    function towardsInfinity() {
      increment();
    }
    function awayFromInfinity() {
      // Already rounded away from infinity
    }
    function towardsEven() {
      if (
        (maxDecimals === 0 && integerPart % 2 === 1) ||
        decimalPart % 2n === 1n
      ) {
        increment();
      }
    }
    function nearestNeighbor(halfCase: () => void) {
      // -: is less than half, 0: it's half, +: more than half
      const halfDifference = 2 * fraction.n - fraction.d;

      if (halfDifference === 0) {
        halfCase();
      } else if (halfDifference < 0) {
        // Already truncated down
      } else if (halfDifference > 0) {
        increment();
      }
    }

    switch (rounding) {
      case Rounding.Up:
        awayFromZero();
        break;
      case Rounding.Down: // -> 0 <-
        towardsZero();
        break;
      case Rounding.Ceil: // -> Infinity
        towardsInfinity();
        break;
      case Rounding.Floor: // <- Infinity
        awayFromInfinity();
        break;
      case Rounding.Even:
        towardsEven();
        break;
      case Rounding.HalfUp:
        nearestNeighbor(awayFromZero);
        break;
      case Rounding.HalfDown:
        nearestNeighbor(towardsZero);
        break;
      case Rounding.HalfCeil:
        nearestNeighbor(towardsInfinity);
        break;
      case Rounding.HalfFloor:
        nearestNeighbor(awayFromInfinity);
        break;
      case Rounding.HalfEven:
        nearestNeighbor(towardsEven);
        break;
    }
    decimalStr = decimalPart.toString(radix);
    // Strip away 0's that might have happened
    decimalStr = decimalStr.replace(/0+$/, "");
  } else {
    decimalStr = decimalPart.toString(radix);
  }

  return (
    sign + integerPart.toString(radix) + (decimalStr ? "." + decimalStr : "")
  );
}
export function toFixed(
  a: SafeNumber,
  decimals: number,
  options?: { radix?: number; rounding?: Rounding }
) {
  const result = toDecimalString(a, { maxDecimals: decimals, ...options });

  const decimalPosition = result.indexOf(".");
  if (decimalPosition >= 0) {
    return result.padEnd(
      result.length + (decimals - (result.length - decimalPosition - 1)),
      "0"
    );
  }
  return (result + ".").padEnd(result.length + 1 + decimals, "0");
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

export type SafeNumberInput = SafeNumber | string | number;
function fromInput(input: SafeNumberInput): SafeNumber {
  if (typeof input === "object") {
    return input;
  }
  if (typeof input === "string") {
    return fromDecimalString(input);
  }
  return fromNumber(input);
}

// Stands for No recurring number
export class NRN implements SafeNumber {
  public readonly d: number;
  public readonly n: number;

  constructor(input: SafeNumberInput) {
    const safeNumber = fromInput(input);
    this.d = safeNumber.d;
    this.n = safeNumber.n;

    // This one avoids creating a new object
    // Not recommended through https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/setPrototypeOf
    // const safeNumber: any = fromInput(input);
    // Object.setPrototypeOf(safeNumber, NRN.prototype);
    // return safeNumber;
  }

  public toNumber() {
    return toNumber(this);
  }

  public toDecimalString(options?: {
    radix?: number;
    maxDecimals?: number;
    rounding?: Rounding;
  }) {
    return toDecimalString(this, options);
  }
  public toFractionString(radix?: number) {
    return toFractionString(this, radix);
  }
  public toString(radix?: number) {
    return this.toDecimalString({ radix });
  }
  public toFixed(
    decimals: number,
    options?: { radix?: number; rounding?: Rounding }
  ) {
    return toFixed(this, decimals, options);
  }

  public neg() {
    return new NRN(neg(this));
  }
  public abs() {
    return new NRN(abs(this));
  }
  public inv() {
    return new NRN(inv(this));
  }
  public add(b: SafeNumberInput) {
    return new NRN(add(this, fromInput(b)));
  }
  public sub(b: SafeNumberInput) {
    return new NRN(sub(this, fromInput(b)));
  }
  public mul(b: SafeNumberInput) {
    return new NRN(mul(this, fromInput(b)));
  }
  public div(b: SafeNumberInput) {
    return new NRN(div(this, fromInput(b)));
  }

  // Functions that can result in irrational numbers: Meaning precision is not guaranteed on these ones.
  public log() {
    return new NRN(log(this));
  }
  public log10() {
    return new NRN(log10(this));
  }
  public log2() {
    return new NRN(log2(this));
  }

  // The following perform the division before, so precision can be lost before running the function
  public sin() {
    return new NRN(sin(this));
  }
  public cos() {
    return new NRN(cos(this));
  }
  public tan() {
    return new NRN(tan(this));
  }
  public exp() {
    return new NRN(exp(this));
  }
  public pow(b: SafeNumberInput) {
    return new NRN(pow(this, fromInput(b)));
  }

  // Assumes number is reduced. -1 = a is bigger, 0 = both are equal, 1 = b is bigger.
  public cmp(b: SafeNumberInput) {
    return cmp(this, fromInput(b));
  }
}

export const ZERO = new NRN(0);
export const ONE = new NRN(1);
export const PI = new NRN(Math.PI);
export const E = new NRN(Math.E);
