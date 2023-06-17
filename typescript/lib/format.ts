import { SafeFraction } from "./safeFraction";

export enum Rounding {
  Up,
  Down,
  Ceil,
  Floor,
  Even,
  HalfUp,
  HalfDown,
  HalfCeil,
  HalfFloor,
  HalfEven,
}

export enum Radix {
  Binary = 2,
  Octal = 8,
  Decimal = 10,
  Hexadecimal = 16,
}

export interface FormatOptions {
  radix: Radix;
  rounding: Rounding;
  maxDecimals: number;
}

const defaultOptions: FormatOptions = {
  radix: Radix.Decimal,
  rounding: Rounding.HalfCeil,
  maxDecimals: 16,
};

export function toDecimalString(
  value: SafeFraction,
  options?: Partial<FormatOptions>
): string {
  const fullOptions: FormatOptions = {
    ...defaultOptions,
    ...options,
  };

  const sign = value.n < 0 ? "-" : "";
  let numerator = Math.abs(value.n);
  const denominator = value.d;

  let integerPart = Math.trunc(numerator / denominator);

  numerator = numerator - integerPart * denominator;

  const decimalPart: number[] = [];
  for (let i = 0; i < fullOptions.maxDecimals; i++) {
    if (numerator === 0) {
      break;
    }

    numerator = numerator * fullOptions.radix;
    const div_result = Math.trunc(numerator / denominator);
    decimalPart.push(div_result);

    numerator = numerator - div_result * denominator;
  }

  if (numerator !== 0) {
    function increment() {
      for (let d = decimalPart.length - 1; d >= 0; d--) {
        decimalPart[d]++;
        if (decimalPart[d] == fullOptions.radix) {
          decimalPart[d] = 0;
        } else {
          return;
        }
      }
      integerPart++;
    }

    const isNegative = sign === "-";

    function awayFromZero() {
      increment();
    }
    function towardsZero() {
      // The number is truncated. Meaning both positive and negative got towards zero: positive got smaller, negative got larger.
    }
    function towardsInfinity() {
      if (isNegative) {
        // Already closer to infinity
      } else {
        increment();
      }
    }
    function awayFromInfinity() {
      if (isNegative) {
        increment();
      } else {
        // Already away from to infinity
      }
    }
    function towardsEven() {
      const isOdd =
        (fullOptions.maxDecimals === 0 && integerPart % 2 === 1) ||
        decimalPart[decimalPart.length - 1] % 2 === 1;
      if (isOdd) {
        increment();
      }
    }
    function nearestNeighbor(halfCase: () => void) {
      const halfCmp = 2 * numerator - denominator;
      if (halfCmp === 0) {
        halfCase();
      } else if (halfCmp < 0) {
        // Already truncated down
      } else if (halfCmp > 0) {
        increment();
      }
    }

    switch (fullOptions.rounding) {
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
  }

  let decimalStr = decimalPart
    .map((d) => d.toString(fullOptions.radix))
    .join("")
    .replace(/0+$/, "");

  if (integerPart === 0 && decimalStr.length === 0) {
    // Avoid sign
    return "0";
  }

  decimalStr = decimalStr.length > 0 ? "." + decimalStr : "";

  return sign + integerPart.toString(fullOptions.radix) + decimalStr;
}

export function toNumber(value: SafeFraction) {
  return value.n / value.d;
}
