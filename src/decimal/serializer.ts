import { Rounding } from "../common";
import { NRRational } from "./NRRational";

export function toNumber(a: NRRational) {
  return a.n / a.d;
}
export function toFractionString(a: NRRational, radix?: number) {
  return `${a.n.toString(radix)}/${a.d.toString(radix)}`;
}

export function toDecimalString(
  a: NRRational,
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
  let fractionalPart = num - integerPart * den;

  if (fractionalPart === 0) {
    return sign + integerPart.toString(radix);
  }

  let decimalPart = BigInt(0);
  const bigRadix = BigInt(radix);
  for (let i = 0; i < maxDecimals && fractionalPart !== 0; i++) {
    // Multiply a/b by radix, extract integer, repeat.
    fractionalPart *= radix;
    const integerValue = Math.floor(fractionalPart / den);
    fractionalPart = fractionalPart - integerValue * den;

    decimalPart = decimalPart * bigRadix + BigInt(integerValue);
  }

  let decimalStr = "";
  if (fractionalPart !== 0) {
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
      const halfDifference = 2 * fractionalPart - den;

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
  a: NRRational,
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
