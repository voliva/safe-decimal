import { DivisionByZeroError, Rounding } from "../common";
import { NRRational } from "./NRRational";

export function neg(a: NRRational): NRRational {
  return { n: -a.n, d: a.d };
}
export function abs(a: NRRational): NRRational {
  return a.n >= 0 ? a : neg(a);
}
export function inv(a: NRRational): NRRational {
  if (a.n === 0) {
    throw new DivisionByZeroError();
  }

  return a.n > 0 ? { n: a.d, d: a.n } : { n: -a.d, d: -a.n };
}
export function add(a: NRRational, b: NRRational): NRRational {
  // TODO benchmark (performance and precision) return reduce({ n: a.n * b.d + b.n * a.d, d: a.d * b.d });

  const lcm_val = lcm(a.d, b.d);
  // lcm_val is a multiple of both a.d and b.d, thus these two divisions should be safe.
  const n = (a.n * lcm_val) / a.d + (b.n * lcm_val) / b.d;

  return reduce({ n, d: lcm_val });
}
export function sub(a: NRRational, b: NRRational) {
  return add(a, neg(b));
}
export function mul(a: NRRational, b: NRRational) {
  return reduce({ n: a.n * b.n, d: a.d * b.d });
}
export function div(a: NRRational, b: NRRational) {
  return mul(a, inv(b));
}

// Functions that can result in irrational numbers: Meaning precision is not guaranteed on these ones.
export function log(a: NRRational) {
  return fromScalar(Math.log(a.n) - Math.log(a.d));
}
export function log10(a: NRRational) {
  return fromScalar(Math.log10(a.n) - Math.log10(a.d));
}
export function log2(a: NRRational) {
  return fromScalar(Math.log2(a.n) - Math.log2(a.d));
}

// The following perform the division before, so precision can be lost before running the function
export function sin(a: NRRational) {
  return fromScalar(Math.sin(a.n / a.d));
}
export function cos(a: NRRational) {
  return fromScalar(Math.cos(a.n / a.d));
}
export function tan(a: NRRational) {
  return fromScalar(Math.tan(a.n / a.d));
}
export function exp(a: NRRational) {
  return fromScalar(Math.exp(a.n / a.d));
}
export function pow(a: NRRational, b: NRRational) {
  // x^m = exp(m log x)
  return exp(mul(b, log(a)));
}

// Assumes number is reduced. -1 = a is bigger, 0 = both are equal, 1 = b is bigger.
export function cmp(a: NRRational, b: NRRational): -1 | 0 | 1 {
  return s_cmp(a.n * b.d, a.d * b.n);
}
function s_cmp(a: number, b: number): -1 | 0 | 1 {
  if (a === b) return 0;
  if (a > b) return -1;
  return 1;
}

// Internal utils
function shiftUntilInteger(a: number, b: number): [bigint, bigint] {
  function shifter(n: number) {
    const shift = () => {
      n = n * 2;
      const r = Math.floor(n);
      n = n - r;
      return r;
    };
    const hasMore = () => n > 0;
    return { shift, hasMore };
  }

  const ai = Math.floor(Math.abs(a));
  const bi = Math.floor(Math.abs(b));
  let ar = BigInt(ai);
  let br = BigInt(bi);
  const as = shifter(Math.abs(a) - ai);
  const bs = shifter(Math.abs(b) - bi);

  // Shift them until both of them are integers
  while (as.hasMore() || bs.hasMore()) {
    ar = (ar << 1n) + BigInt(as.shift());
    br = (br << 1n) + BigInt(bs.shift());
  }

  if (a < 0) {
    ar = -ar;
  }
  if (b < 0) {
    br = -br;
  }

  return [ar, br];
}
function gcd(_a: number, _b: number) {
  let [a, b] = shiftUntilInteger(Math.abs(_a), Math.abs(_b));

  while (b > 0) {
    let tmp = b;
    b = a % b;
    a = tmp;
  }

  return Number(a);
}
function lcm(a: number, b: number) {
  return (a * b) / gcd(a, b);
}

// Assumes a valid number (d !== 0n)
function reduce({ n, d }: NRRational): NRRational {
  if (n === 0) {
    return { n: 0, d: 1 };
  }

  const divisor = gcd(n, d);
  return { n: n / divisor, d: d / divisor };
}

function fromScalar(a: number): NRRational {
  return { n: a, d: 1 };
}
