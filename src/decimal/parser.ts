import { add, inv, neg, simplify, sub } from "./functions";
import { NRRational } from "./NRRational";

export function fromDecimalString(s: string): NRRational {
  // TODO binary, hex, octal
  const decimalPosition = s.indexOf(".");
  if (decimalPosition >= 0) {
    // Trim irrelevant zeroes
    s = s.replace(/0+$/, "");
    const [integerPart, fractionalPart] = s.split(".");

    return fromParts(integerPart, fractionalPart);
  }

  return {
    n: Number(s.replace("+", "")),
    d: 1,
  };
}

export function fromNumber(n: number): NRRational {
  // When we receive a number it's really hard to get the original value, because we could have information already lost
  // The best bet is to just use the .toString() method with as bigger precision as posible and roll with it.
  // We might invert the number just once in case we see it reduces the amount of decimals.

  function getIntegerAndFraction(value: number) {
    const expRepr = value.toExponential(15); // 100 would give us best precision, but 15 makes 0.3 stay 0.3
    const [numeric, exponent] = expRepr.split("e");
    const sign = numeric.startsWith("-") ? "-" : "";
    const numericWithoutPoint = numeric.replace(".", "").replace("-", "");
    const expValue = Number(exponent);
    if (expValue >= 0) {
      const zeroes = new Array(
        Math.max(0, expValue - numericWithoutPoint.length + 1)
      )
        .fill("0")
        .join("");
      const integerPart = numericWithoutPoint.slice(0, expValue + 1) + zeroes;
      const fractionalPart = numericWithoutPoint
        .slice(expValue + 1)
        .replace(/0+$/, "");
      return [sign + integerPart, fractionalPart];
    } else {
      const integerPart = "0";
      const zeroes = new Array(-expValue - 1).fill("0").join("");
      const fractionalPart = zeroes + numericWithoutPoint.replace(/0+$/, "");
      return [sign + integerPart, fractionalPart];
    }
  }

  const [integerPart, fractionalPart] = getIntegerAndFraction(n);

  // Invert the fractional part. If we're lucky, we'll get rid of some of the recurring decimals
  const invertedFractionalPart = fractionalPart.length
    ? 1 / Number("0." + fractionalPart)
    : 0;
  const invertedSplit = getIntegerAndFraction(invertedFractionalPart);
  if (invertedSplit[1].length < fractionalPart.length) {
    const isNegative = integerPart.startsWith("-");
    const integerPartRational = {
      n: Math.abs(Number(integerPart)),
      d: 1,
    };

    const parsed = add(
      integerPartRational,
      inv(fromParts(invertedSplit[0], invertedSplit[1]))
    );
    return isNegative ? neg(parsed) : parsed;
  }

  return fromParts(integerPart, fractionalPart);
}

function fromParts(integerPart: string, fractionalPart: string) {
  const isNegative = integerPart.startsWith("-");
  integerPart = integerPart.replace(/^[\+\-]/, "");

  const integerPartRational = {
    n: Number(integerPart),
    d: 1,
  };

  const prefix = integerPart.slice(0, 2);
  const fractionPartRational = prefix.startsWith("0b")
    ? fractionalPart2(fractionalPart)
    : prefix.startsWith("0o")
    ? fractionalPart8(fractionalPart)
    : prefix.startsWith("0x")
    ? fractionalPart16(fractionalPart)
    : fractionalPart10(fractionalPart);

  const parsed = add(integerPartRational, fractionPartRational);
  if (isNegative) {
    return neg(parsed);
  }
  return parsed;
}

function fractionalPart10(fractionalPart: string) {
  // Denominator is going to be 5 ** decimals. If you think about it on paper you would just multiply by
  // powers of 10, but we don't really need the 2 factor because that's already representable in base 2.
  // However, we can't let the number grow too big or we lose precision because they can't be represented. 22 = Math.floor(Log5(Number.MAX_SAFE_INTEGER))
  // This could be avoided by using bigints. Or doing the inverse trick, but then we need to inverse without using division, which I don't know how to do.
  fractionalPart = fractionalPart.slice(0, 22);
  const denominator = 5 ** fractionalPart.length;

  // Doing Number(fractionalPart) gives us the numerator multiplied by the power of 10.
  // But because we did the "5" trick on the denominator, we need to divide by the power of 2.
  const correction = 2 ** fractionalPart.length;
  const numerator = Number(fractionalPart) / correction;
  return simplify({
    n: numerator,
    d: denominator,
  });
}

function fractionalPart2(fractionalPart: string) {
  // We'll be using parseInt, which returns NaN for empty strings
  if (fractionalPart.length === 0) {
    return {
      n: 0,
      d: 1,
    };
  }
  fractionalPart = fractionalPart.slice(0, 53);

  return simplify({
    n: parseInt(fractionalPart, 2),
    d: 2 ** fractionalPart.length,
  });
}

function fractionalPart8(fractionalPart: string) {
  if (fractionalPart.length === 0) {
    return {
      n: 0,
      d: 1,
    };
  }
  fractionalPart = fractionalPart.slice(0, 17);

  return simplify({
    n: parseInt(fractionalPart, 8),
    d: 8 ** fractionalPart.length,
  });
}

function fractionalPart16(fractionalPart: string) {
  if (fractionalPart.length === 0) {
    return {
      n: 0,
      d: 1,
    };
  }
  fractionalPart = fractionalPart.slice(0, 13);

  return simplify({
    n: parseInt(fractionalPart, 16),
    d: 16 ** fractionalPart.length,
  });
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
