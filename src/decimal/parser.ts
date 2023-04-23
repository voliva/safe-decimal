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
    n: Number(s),
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
  const integerPartRational = {
    n: Math.abs(Number(integerPart)),
    d: 1,
  };
  const isNegative = integerPart.startsWith("-");

  // Denominator is going to be 5 ** decimals. If you think about it on paper you would just multiply by
  // powers of 10, but we don't really need the 2 factor because that's already representable in base 2.
  const denominator = 5 ** fractionalPart.length;

  // Doing Number(fractionalPart) gives us the numerator multiplied by the power of 10.
  // But because we did the "5" trick on the denominator, we need to divide by the power of 2.
  const correction = 2 ** fractionalPart.length;
  const numerator = Number(fractionalPart) / correction;
  const fractionPartRational = simplify({
    n: numerator,
    d: denominator,
  });

  const parsed = add(integerPartRational, fractionPartRational);
  if (isNegative) {
    return neg(parsed);
  }
  return parsed;
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
