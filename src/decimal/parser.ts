import { inv } from "./functions";
import { NRRational } from "./NRRational";

export function fromDecimalString(s: string): NRRational {
  // TODO binary, hex, octal
  const decimalPosition = s.indexOf(".");
  if (decimalPosition >= 0) {
    // Trim irrelevant zeroes
    s = s.replace(/0+$/, "");
  }

  // Denominator is going to be 5 ** decimals
  // but we can't let it grow past mantissa = 53-bit precision, because then
  // we lose all precision on the denominator when trying to remove recurring
  // numbers on the numerator.
  // 5^n = 2^53 => n = log5(2^53) = 22.825
  const MAX_DECIMALS = Number.POSITIVE_INFINITY;
  let decimals = decimalPosition >= 0 ? s.length - decimalPosition - 1 : 0;
  s = s.replace(".", "");
  if (decimals > MAX_DECIMALS) {
    const diff = decimals - MAX_DECIMALS;
    const newDecimalPosition = s.length - diff;
    decimals = MAX_DECIMALS;
    s =
      s.substring(0, newDecimalPosition) +
      "." +
      s.substring(newDecimalPosition);
  }

  // Essentially, we move the comma to remove all decimals
  // then store the number as that of a multiple
  const d = 5 ** decimals;
  const n = Number(s) / 2 ** decimals;
  return { n, d };
}

const MAX_SCALE = Number.MAX_SAFE_INTEGER;
export function fromNumber(n: number, scale = 1): NRRational {
  /**
   * This function uses the algorithm that keeps inverting the value to get the fractional representation of that number.
   *
   * Example: 2.54
   * 2.54 = 2 + 0.54 => 2
   * 0.54 = 1 / 1.851851..
   * 1.851851.. = 1 + 0.851851.. => 1
   * 0.851851.. = 1 / 1.173913..
   * 1.173913.. = 1 + 0.173913.. => 1
   * 0.173913.. = 1 / 5.75
   * 5.75 = 5 + 0.75 => 5
   * 0.75 = 1 / 1.33..
   * 1.33 = 1 + 0.33.. => 1
   * 0.33 = 1 / 3
   * 3 = 3 + 0 => 3
   *
   * Then the fractions can start unraveling up...
   * 1.33 = 1 + 0.33.. = 1 + 1/3 = 4/3
   * 0.75 = 1 / 1.33.. = 1 / 4/3 = 3/4
   * 5.75 = 5 + 0.75 = 5 + 3/4 = 23/4
   * 0.173913.. = 1 / 5.75 = 1 / 23/4 = 4/23
   * 1.173913.. = 1 + 0.173913.. = 1 + 4/23 = 27/23
   * 0.851851.. = 1 / 1.173913.. = 1 / 27/23 = 23/27
   * 1.851851.. = 1 + 0.851851.. = 1 + 23/27 = 50/27
   * 0.54 = 1 / 1.851851.. = 1 / 50/27 = 27/50
   * 2.54 = 2 + 0.54 = 2 + 27/50 = 127/50
   *
   * (In this case we could've just multiplied by 100, but you don't want to do it with extremely small numbers such as Number.EPSILON)
   *
   * TODO there's a different way that maybe can be used to optimise this:
   * There's a pattern when constructing these fractions. Given
   * - V[i] is the `i` integer part from the result of the inversions.
   *  - V[0] is the integer part of the original number
   * - F[i] is the fractional representation at step `i`
   *  - F[i].n is the numerator of the fractional representation at step `i`
   *  - F[i].d is the denominator of the fractional representation at step `i`
   * - F[-2] is 0/1
   * - F[-1] is 1/0
   *
   * Then
   * - F[i].n = F[i-2].n + F[i-1].n * V[i]
   * - F[i].d = F[i-2].d + F[i-1].d * V[i]
   *
   * With the example above, we got the V values from inverting 2.54 are:
   * [2,1,1,5,1,3]
   *
   * Expanding this into F's `n` and `d`:
   * i -2 -1 0 1 2 3  4  5
   * V       2 1 1 5  1  3
   * n  0  1 2 3 5 28 33 127
   * d  1  0 1 1 2 11 13 50
   *
   * Result is 127 / 50 again. This shouldn't require recurisivity because we don't need to reach the end to start unraveling.
   */
  const sign = n < 0 ? -1 : 1;
  n = Math.abs(n);

  const s = n.toLocaleString("fullwide", {
    useGrouping: false,
    minimumSignificantDigits: 21,
  });
  const decimalPosition = s.indexOf(".");

  // num = integerPart + decimalPart
  const integerPart = Number(s.substring(0, decimalPosition));
  const decimalPart = Number(s.substring(decimalPosition));

  if (decimalPart === 0 || scale >= MAX_SCALE) {
    return {
      n: sign * n,
      d: 1,
    };
  }

  // num = integerPart + 1 / inverseDecimal
  const inverseDecimal = 1 / decimalPart;

  // num = integerPart + 1 / fraction
  const fraction = fromNumber(inverseDecimal, scale * integerPart);

  // num = integerPart + inverseFraction
  const inverseFraction = inv(fraction);

  return {
    n: sign * (integerPart * inverseFraction.d + inverseFraction.n),
    d: inverseFraction.d,
  };
}

export type NRRationalInput = NRRational | string | number;
export function fromInput(input: NRRationalInput): NRRational {
  if (typeof input === "object") {
    return input;
  }
  if (typeof input === "string") {
    return fromDecimalString(input);
  }
  return fromNumber(input);
}
