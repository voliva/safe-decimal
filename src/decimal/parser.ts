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
    return new Array(this.cyclesCompleted + 1)
      .fill(0)
      .flatMap(() => this.buffer);
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
    .filter((seq) => seq.length > 0)
    .reduce((best, v) => (best.length < v.length ? v : best), []);
}

function parseDouble(num: number) {
  const reverseBytes = new Uint8Array(new Float64Array([num]).buffer);
  const bytes = reverseBytes.reverse();

  const sign = (bytes[0] & 0x80) >> 7;
  const exponent = (((bytes[0] & 0x7f) << 4) | ((bytes[1] & 0xf0) >> 4)) - 1023;

  // 1 << 31 gives a negative number because bitwise operations work in int-32, so we need BigInt arithmetic
  let mantissa = BigInt(bytes[1] & 0x0f);
  for (let i = 2; i < 8; i++) {
    mantissa = (mantissa << 8n) | BigInt(bytes[i]);
  }

  return [sign, exponent, mantissa] as const;
}

function constructDouble(sign: number, exponent: number, mantissa: bigint) {
  const array = new Uint8Array(8);

  const restoredExponent = exponent + 1023;

  // exponent is 11 bits, we want to put the first 7 into array[0]: displace 4 bits
  array[0] = (sign << 7) | (restoredExponent >> 4);
  // grab the 4 bits from exponent and 4 bits from mantissa
  array[1] = ((restoredExponent & 0x0f) << 4) | Number(mantissa >> (52n - 4n));
  for (let i = 2; i < 8; i++) {
    array[i] = Number((mantissa >> (52n - 4n - 8n * BigInt(i - 1))) & 0x0ffn);
  }

  return new Float64Array(array.reverse().buffer)[0];
}

// These functions work with a reversed sequence! 123 will return [3,2,1]
function numToBinarySeq(num: bigint) {
  const result: number[] = [];
  while (num > 0) {
    result.push(Number(num & 0x01n));
    num = num >> 1n;
  }
  return result;
}
function binarySeqToNum(seq: number[]): bigint {
  let result = 0n;

  for (let i = seq.length - 1; i >= 0; i--) {
    result = (result << 1n) | BigInt(seq[i]);
  }

  return result;
}

function padStart<T>(arr: Array<T>, value: T, target: number) {
  return [...new Array(Math.max(0, target - arr.length)).fill(value), ...arr];
}
function padEnd<T>(arr: Array<T>, value: T, target: number) {
  return [...arr, ...new Array(Math.max(0, target - arr.length)).fill(value)];
}

export function splitRepeatingPart(num: number) {
  const [sign, exponent, mantissa] = parseDouble(num);

  const sequence = padEnd(numToBinarySeq(mantissa), 0, 52);
  const repeats = findRepeats(sequence);

  const nonRepeatingSeq = sequence.slice(repeats.length);
  const newMantissa = binarySeqToNum(padStart(nonRepeatingSeq, 0, 52));
  const nonRepeatingPart = constructDouble(sign, exponent, newMantissa);

  /** The repeating part is quite challenging.
   * the nonRepeatingPart is just cut from the original. Floats' mantissa always start on 1 which is omitted, so
   * 1.1001000111000111000111 will get cut into 1.1001 => Mantissa is 1001
   * But the repeating part in this case is 0.0000[000111000111000111]
   * The idea I had is that I shift everything to add in more precision before inverting the number, in hopes to increase
   * the likelyhood of receiving the actual result. But if I just shift and extend:
   * 000111000111000111000...
   * I have to update the exponent, but then this mantissa means 1.000111000111... which is wrong.
   * The whole thing has to be shifted again until the first [1] is omitted, to 1.11000111000111...
   * resulting in a mantissa of 11000111000111, with the exponent changed accordingly.
   * And if the exponent underflows, then... we can't really split it
   *
   * Reminder that the sequences in this function are in opposite order, they start on the end of the mantissa
   */
  const paddedRepeatingSeq = [...repeats].reverse();
  const firstOneIdx = paddedRepeatingSeq.indexOf(1);
  if (firstOneIdx < 0) {
    // It's just 0
    console.log("no ones", sequence, repeats);
    return [nonRepeatingPart, 0];
  }
  for (let i = 0; i < 52; i++) {
    paddedRepeatingSeq.push(paddedRepeatingSeq[i]);
  }
  const repeatingSeq = paddedRepeatingSeq
    .slice(firstOneIdx + 1, firstOneIdx + 1 + 52)
    .reverse();

  const repeatingMantissa = binarySeqToNum(repeatingSeq);
  const repeatingExponent =
    exponent - (firstOneIdx + 1) - nonRepeatingSeq.length;
  if (repeatingExponent < -1022) {
    // exponent underflow, can't split number
    console.log("underflow", repeatingExponent, repeatingSeq);
    return [num, 0];
  }

  const repeatingPart = constructDouble(
    sign,
    repeatingExponent,
    repeatingMantissa
  );
  return [nonRepeatingPart, repeatingPart];
}

export function splitIntegerPart(num: number) {
  if (Math.abs(num) < 1) {
    return [0, num];
  }
  if (Math.abs(num) === 1) {
    return [num, 0];
  }

  // Exponent must be >= 0 given the special cases above
  const [sign, exponent, mantissa] = parseDouble(num);
  const binarySeq = padEnd(numToBinarySeq(mantissa), 0, 52);
  const repeats = findRepeats(binarySeq);
  const mantissaSeq = [...binarySeq].reverse();
  const intMantissa = padEnd(mantissaSeq.slice(0, exponent), 0, 52).reverse();
  const integerPart = constructDouble(
    sign,
    exponent,
    binarySeqToNum(intMantissa)
  );

  const fractionMantissa = mantissaSeq.slice(exponent);
  const firstOne = fractionMantissa.indexOf(1);
  if (firstOne < 0) {
    // It's all zeroes - Always has been
    return [num, 0];
  }
  const shiftedMantissa = fractionMantissa.slice(firstOne + 1);
  // const shiftedMantissa = padEnd(
  //   fractionMantissa.slice(firstOne + 1),
  //   0,
  //   52
  // ).reverse();
  for (let i = 0; i < 1; i++) {
    // TODO fill with repeats, figure out index too
  }

  const fractionExponent = -firstOne - 1;
  const fractionPart = constructDouble(
    sign,
    fractionExponent,
    binarySeqToNum(shiftedMantissa)
  );

  return [integerPart, fractionPart];
}
