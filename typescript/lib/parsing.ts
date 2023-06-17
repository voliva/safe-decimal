import { constructDouble } from "./double";
import { abs, add, inv, neg } from "./ops";
import { SafeFraction } from "./safeFraction";

export function fromString(value: string): SafeFraction {
  const [integer, fraction] = value.split(".");
  return fromParts(integer, fraction ?? "");
}

export function fromNumber(value: number): SafeFraction {
  const [integerPart, fractionalPart] = getIntegerAndFraction(value);
  return fromPartsRecursive(integerPart, fractionalPart);
}

function fromPartsRecursive(
  integerPart: string,
  fractionalPart: string
): SafeFraction {
  if (fractionalPart.length === 0) {
    return fromParts(integerPart, "");
  }

  const invertedFractionalPart = 1.0 / Number("0." + fractionalPart);

  const [invIntegerPart, invFractionalPart] = getIntegerAndFraction(
    invertedFractionalPart
  );

  if (invFractionalPart.length >= fractionalPart.length) {
    return fromParts(integerPart, fractionalPart);
  }

  const isNegative = integerPart.startsWith("-");
  const integerPartRational = abs(fromParts(integerPart, ""));
  const invFractionalPartRational = fromPartsRecursive(
    invIntegerPart,
    invFractionalPart
  );

  const parsed = add(integerPartRational, inv(invFractionalPartRational)!);

  return isNegative ? neg(parsed) : parsed;
}

function getIntegerAndFraction<T extends number>(value: T): [string, string] {
  const [numeric, exponent] = value.toExponential().split("e");
  const sign = numeric.startsWith("-") ? "-" : "";
  const numericWithoutSymbols = numeric.replace(".", "").replace("-", "");
  const parsedExponent = Number(exponent);

  if (parsedExponent < 0) {
    const zeroes = "0".repeat(-(parsedExponent + 1));
    const fractionalPart = zeroes + numericWithoutSymbols.replace(/0+$/, "");
    return [sign + "0", fractionalPart];
  }

  const integerPart = numericWithoutSymbols
    .slice(0, parsedExponent + 1)
    .padEnd(parsedExponent + 1, "0");
  const fractionalPart = numericWithoutSymbols
    .slice(parsedExponent + 1)
    .replace(/0+$/, "");
  return [sign + integerPart, fractionalPart];
}

function fromParts(integerPart: string, fractionalPart: string): SafeFraction {
  const [isNegative, radix, integerNumerator] = extractPrefix(integerPart);
  const integerPartRational: SafeFraction = {
    n: Number(integerNumerator),
    d: 1,
  };

  const fractionalPartFn =
    radix === 2
      ? fractionalPart2
      : radix === 8
      ? fractionalPart8
      : radix === 10
      ? fractionalPart10
      : fractionalPart16;
  const fractionalPartRational = fractionalPartFn(fractionalPart);

  const parsed = add(integerPartRational, fractionalPartRational);
  if (isNegative) {
    return neg(parsed);
  }
  return parsed;
}

function fractionalPart10(fractionalPart: string): SafeFraction {
  if (fractionalPart.length === 0) {
    return {
      n: 0,
      d: 1,
    };
  }
  fractionalPart = fractionalPart.slice(0, 22);
  const denominator = Math.pow(5, fractionalPart.length);
  const correction = 2 ** fractionalPart.length;
  const numerator = Number(fractionalPart) / correction;

  return {
    n: Number(numerator),
    d: denominator,
  };
}

function fractionalPart2(fractionalPart: string): SafeFraction {
  const firstOne = fractionalPart.indexOf("1");
  if (firstOne < 0) {
    return {
      n: 0,
      d: 1,
    };
  }

  fractionalPart = fractionalPart.slice(firstOne + 1);
  // exponent is negative
  const exponent = -(firstOne + 1);

  const mantissa = fractionalPart
    .slice(0, 52)
    .split("")
    .reduce((total, char) => ((total << 1) + char === "1" ? 1 : 0), 0);

  return {
    n: constructDouble(0, exponent, mantissa),
    d: 1,
  };
}

const base8Map = ["000", "001", "010", "011", "100", "101", "110", "111"];
const base16Map = [
  ...base8Map.map((v) => "0" + v),
  ...base8Map.map((v) => "1" + v),
];

function fractionalPart8(fractionalPart: string): SafeFraction {
  const base2 = fractionalPart
    .slice(0, 52 / 3)
    .split("")
    .map((c) => base8Map[Number(c)] ?? "e")
    .join("");
  return fractionalPart2(base2);
}
function fractionalPart16(fractionalPart: string): SafeFraction {
  const base2 = fractionalPart
    .slice(0, 52 / 4)
    .split("")
    .map((c) => base16Map[Number(c)] ?? "e")
    .join("");
  return fractionalPart2(base2);
}

const radixMap: Record<string, number> = {
  "0b": 2,
  "0o": 8,
  "0x": 16,
};
function extractPrefix(value: string): [boolean, number, bigint] {
  const isNegative = value.startsWith("-");
  value = isNegative ? value.slice(1) : value;

  const radixPrefix = value.slice(0, 2);
  const radix = radixMap[radixPrefix] ?? 10;

  return [isNegative, radix, BigInt(value)];
}
