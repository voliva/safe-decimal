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

/*
0.65214321 => No repeats => No, it's 2143 21[43]

1,2,3,4,1,2,5,6
{1}
{12}
{123}
{1234}
{12341, 1234|1}
{123412, 1234|12} 1234 + 2
{1234125}
{12341256}

0.5432104321 => 43210 repeats
1,2,3,4,0,1,2,3,4,5
{1}
{12}
{123}
{1234}
{12340}
{123401, 12340|1}
{1234012, 12340|12}
{12340123, 12340|123}
{123401234, 12340|1234} 12340 + 4
{1234012345}

0.215214321 => No repeats => No, it's 2143 21[43]

1,2,3,4,1,2,5,6
{1}
{12}
{123}
{1234}
{12341, 1234|1}
{123412, 1234|12} 1234 + 2
{1234125}
{12341256}

If I do it like this, then specially in binary, this sequence:

0.1011001110001111

which has no repeats will be detected as
0.[101100111000111]1

So I will just detect EXACT repeats

121121123
{1}
{12}
{121, 12|1}
{1211, x, 121|1}
{12112, 121|12}
{121121, 121|121, 12112|1}
{1211211, 121|121|1, x}
{12112112, 121|121|12}
{121121123, 121|121|x} => Can be greedy and take 12112112 or just the complete cycles 121121. All of these only if at least 2 complete cycles are present.
*/

class Candidate {
  private currentIdx = 0;
  private cyclesCompleted = 0;
  private closed = false;

  constructor(private buffer: number[]) {}

  checkNext(v: number) {
    if (this.closed) {
      return false;
    }
    if (this.buffer[this.currentIdx] === v) {
      this.currentIdx = (this.currentIdx + 1) % this.buffer.length;
      if (this.currentIdx === 0) {
        this.cyclesCompleted++;
      }
      return true;
    }
    this.closed = true;
    return false;
  }

  getResultSequence() {
    if (this.cyclesCompleted < 1) {
      return [];
    }
    return new Array(this.cyclesCompleted + 2).fill(0).flatMap((_, i) => {
      if (i <= this.cyclesCompleted) {
        return this.buffer;
      }
      return this.buffer.slice(0, this.currentIdx);
    });
  }
}

function findRepeats(sequence: number[]) {
  const buffer: number[] = [];
  const candidates: Candidate[] = [];
  sequence.forEach((s) => {
    if (buffer.length === 0) {
      buffer.push(s);
      return;
    }
    if (s === buffer[0]) {
      candidates.push(new Candidate([...buffer]));
    }
    buffer.push(s);
    candidates.forEach((c) => c.checkNext(s));
  });
  return candidates
    .map((c) => c.getResultSequence())
    .filter((seq) => seq.length > 0);
}

function parseDouble(num: number) {
  const reverseBytes = new Uint8Array(new Float64Array([num]).buffer);
  const bytes = reverseBytes.reverse();

  const sign = (bytes[0] & 0x80) >> 7;
  const exponent = ((bytes[0] & 0x7f) << 4) | ((bytes[1] & 0xf0) >> 4);
  let mantissa = BigInt(bytes[1] & 0x0f);
  for (let i = 2; i < 8; i++) {
    mantissa = (mantissa << 8n) | BigInt(bytes[i]);
  }

  // 1 << 31 gives a negative number, so we need BigInt arithmetic
  return [sign, exponent, mantissa] as const;
}

function numToBinarySeq(num: bigint) {
  const result: number[] = [];
  while (num > 0) {
    result.push(Number(num & 0x01n));
    num = num >> 1n;
  }
  return result;
}

function splitRepeatingPart(num: number) {
  const [sign, exponent, mantissa] = parseDouble(num);

  const sequence = numToBinarySeq(mantissa);
  return findRepeats(sequence);
}
