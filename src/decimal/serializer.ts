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

  const decimalPart: number[] = [];
  for (let i = 0; i < maxDecimals && fractionalPart !== 0; i++) {
    // Multiply a/b by radix, extract integer, repeat.
    fractionalPart *= radix;
    const integerValue = Math.floor(fractionalPart / den);
    fractionalPart = fractionalPart - integerValue * den;

    decimalPart.push(integerValue);
  }
  const totalDecimals = decimalPart.length;

  let decimalStr = "";
  if (fractionalPart !== 0) {
    function increment() {
      let done = false;
      for (let d = totalDecimals - 1; d >= 0; d--) {
        decimalPart[d]++;
        if (decimalPart[d] == radix) {
          decimalPart[d] = 0;
        } else {
          done = true;
          break;
        }
      }
      if (!done) {
        integerPart++;
      }
    }

    // The number is truncated. Meaning both positive and negative got towards zero: positive got smaller, negative got larger.
    // This means rounding after the algorithm above is Rounding.Down
    function awayFromZero() {
      increment();
    }
    function towardsZero() {
      // Already rounded towards zero
    }
    function towardsInfinity() {
      if (sign === "-") {
        // Already closer to infinity
      } else {
        increment();
      }
    }
    function awayFromInfinity() {
      if (sign === "-") {
        increment();
      } else {
        // Already away from to infinity
      }
    }
    function towardsEven() {
      if (
        (maxDecimals === 0 && integerPart % 2 === 1) ||
        decimalPart[totalDecimals - 1] % 2 === 1
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
      case Rounding.Up: // <- 0 ->
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
    decimalStr = decimalPart.map((v) => v.toString(radix)).join("");
    // Strip away 0's that might have happened on the end
    decimalStr = decimalStr.replace(/0+$/, "");
  } else {
    decimalStr = decimalPart.map((v) => v.toString(radix)).join("");
  }

  if (integerPart === 0 && !decimalStr) {
    // Avoid sign
    return "0";
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
