import {
  constructDouble,
  exponentialForm,
  fromExponentialForm,
  parseDouble,
} from "./double";
import { SafeFraction } from "./safeFraction";

export function simplifyFactors(a: number, b: number): [number, number] {
  if (a == 0) {
    return [0, 1];
  }
  if (b == 0) {
    return [1, 0];
  }

  const [aSign, aInt, aExp] = exponentialForm(a);
  const [bSign, bInt, bExp] = exponentialForm(b);
  // a = a_sign {a_int} * 2 ^ {a_exp}
  // Essentially, it's the integer representation of `a` where all factors of 2 are extracted into an exponent (which can be negative)

  // Remove all common factors from `a` and `b`
  const gcdInt = gcd(aInt, bInt);
  const aIntSimplified = aInt / gcdInt;
  const bIntSimplified = bInt / gcdInt;

  // Remove common 2's: Just move them so that the sum of both is as close to 0 as possible.
  const expSum = aExp + bExp;
  const expChange = Math.trunc(expSum / 2);
  const aExpSimplified = aExp - expChange;
  const bExpSimplified = bExp - expChange;

  return [
    fromExponentialForm(aSign, aIntSimplified, aExpSimplified),
    fromExponentialForm(bSign, bIntSimplified, bExpSimplified),
  ];
}

export function reduceExponent(value: SafeFraction): SafeFraction {
  if (value.n === 0) {
    return {
      n: 0,
      d: 1,
    };
  }

  const [nSign, nExp, nMant] = parseDouble(value.n);
  const [dSign, dExp, dMant] = parseDouble(value.d);

  const expSum = nExp + dExp;
  const expChange = Math.trunc(expSum / 2);

  return {
    n: constructDouble(nSign, nExp - expChange, nMant),
    d: constructDouble(dSign, dExp - expChange, dMant),
  };
}

function gcd(a: bigint, b: bigint): bigint {
  let x = a;
  let y = b;

  while (y != 0n) {
    const temp = y;
    y = x % y;
    x = temp;
  }

  return x;
}
