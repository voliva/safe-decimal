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
  return simplify({ n: a.n * b.d + b.n * a.d, d: a.d * b.d });
}
export function sub(a: NRRational, b: NRRational) {
  return add(a, neg(b));
}
export function mul(a: NRRational, b: NRRational) {
  return simplify({ n: a.n * b.n, d: a.d * b.d });
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
  const bVal = b.n / b.d;
  return simplify({
    n: Math.pow(a.n, bVal),
    d: Math.pow(a.d, bVal),
  });

  // TODO alternative, maybe better for big numbers -> a^b = exp(b log a)
  // But what I like from :point_up: is that for isInteger(b) it gives an exact result. Maybe branch off based on this condition?
  // return exp(mul(b, log(a)));
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

// TODO Benchmark alternative
/**
 * .toExponential() => grab exponent e (it's in base 10)
 * then adjust multiplying/dividing by 2^Math.floor(e * Math.log2(10))
 */
export function simplify(value: NRRational) {
  if (value.n === 0) {
    // This has an exponent with a special meaning
    // TODO check other types of special meaning... can they happen? (NaN, Infinity, etc.)
    return {
      n: 0,
      d: 1,
    };
  }

  const [nSign, nExp, nMant] = parseDouble(value.n);
  const [dSign, dExp, dMant] = parseDouble(value.d);

  // Goal is to keep this value as close to 0 as posible: Don't let numbers grow past float range.
  const expSum = nExp + dExp;
  const expChange = Math.trunc(-expSum / 2);

  return {
    n: constructDouble(nSign, nExp + expChange, nMant),
    d: constructDouble(dSign, dExp + expChange, dMant),
  };
}

// Internal utils
function fromScalar(a: number): NRRational {
  return simplify({ n: a, d: 1 });
}

function parseDouble(num: number) {
  const reverseBytes = new Uint8Array(new Float64Array([num]).buffer);
  const bytes = reverseBytes.reverse();

  const sign = (bytes[0] & 0x80) >> 7;
  const exponent = (((bytes[0] & 0x7f) << 4) | ((bytes[1] & 0xf0) >> 4)) - 1023;

  // to do bitwise I would have to use BigInt - trying without it as a challenge (and "no bigint required" feature)
  let mantissa = bytes[1] & 0x0f;
  for (let i = 2; i < 8; i++) {
    mantissa = mantissa * 2 ** 8 + bytes[i];
  }

  return [sign, exponent, mantissa] as const;
}

function constructDouble(sign: number, exponent: number, mantissa: number) {
  const array = new Uint8Array(8);

  const restoredExponent = exponent + 1023;

  // exponent is 11 bits, we want to put the first 7 into array[0]: displace 4 bits
  array[0] = (sign << 7) | (restoredExponent >> 4);
  // grab the 4 bits from exponent and 4 bits from mantissa
  array[1] =
    ((restoredExponent & 0x0f) << 4) | Math.floor(mantissa / 2 ** (52 - 4));
  for (let i = 2; i < 8; i++) {
    array[i] = Math.floor(mantissa / 2 ** (52 - 4 - 8 * (i - 1))) & 0x0ff;
  }

  return new Float64Array(array.reverse().buffer)[0];
}
