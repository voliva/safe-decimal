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
  console.log(n);
  const sign = n < 0 ? -1 : 1;
  n = Math.abs(n);

  // Seems like we can't do subtractions, but inverting numbers is fine!
  // 3.2 - 3 = 0.20000....018
  // 1 / 3.2 = 0.3125 | 1 / 0.3125 = 3.2

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

  console.log(sign, integerPart, inverseFraction);
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
