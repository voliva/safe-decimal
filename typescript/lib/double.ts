const floatValue = new Float64Array(1);
const floatBigint = new BigUint64Array(floatValue.buffer);

export function parseDouble(value: number): [number, number, number] {
  floatValue[0] = value;
  let valueBits = floatBigint[0];

  // Least 52 bits are mantissa
  const mantissa = Number(valueBits & 0x00_0f_ff_ff_ff_ff_ff_ffn);
  valueBits = valueBits >> 52n;

  // next 11 bits are exponent, in bias notation
  const exponent = Number(valueBits & 0x07_ffn) - 1023;
  valueBits = valueBits >> 11n;

  // Last bit is sign
  let sign = Number(valueBits & 0x01n);

  return [sign, exponent, mantissa];
}

const bigintValue = new BigUint64Array(1);
const bigintFloat = new Float64Array(bigintValue.buffer);

export function constructDouble(
  sign: number,
  exponent: number,
  mantissa: number
) {
  const signPart = BigInt(sign);
  const exponentPart = BigInt(exponent + 1023);
  const valueBits =
    (((signPart << 11n) | exponentPart) << 52n) | BigInt(mantissa);

  bigintValue[0] = valueBits;
  return bigintFloat[0];
}

const MANTISSA_LEN = 52;
export function exponentialForm(value: number): [number, bigint, number] {
  if (Object.is(value, -0)) {
    return [1, 0n, 0];
  }
  if (Object.is(value, 0)) {
    return [0, 0n, 0];
  }

  const [sign, exp, mantissa] = parseDouble(value);
  const bigMantissa = BigInt(mantissa);
  const integerVal = bigMantissa | (1n << BigInt(MANTISSA_LEN));
  const trailingZeroes = countTrailingZeroes(integerVal);

  const adjustedExponent = exp - MANTISSA_LEN + trailingZeroes;

  return [sign, integerVal >> BigInt(trailingZeroes), adjustedExponent];
}

export function fromExponentialForm(sign: number, value: bigint, exp: number) {
  if (value === 0n) {
    return sign === 1 ? -0 : 0;
  }

  // We need to move value to the left so that the first 1 falls out from mantissa_len
  const leadingZeroes = countLeadingZeroes(value);
  const displacement = BigInt(leadingZeroes + MANTISSA_LEN - 63);
  const decimalPartLength = 63 - leadingZeroes;

  exp = exp + decimalPartLength;

  // And we also need to remove the leading 1
  const mask = ~(1n << BigInt(MANTISSA_LEN));
  const correctedValue = Number((value << displacement) & mask);
  return constructDouble(sign, exp, correctedValue);
}

function countLeadingZeroes(value: bigint): number {
  if (value === 0n) {
    return 64;
  }

  const high = Number(value >> 32n);
  const low = Number(value & 0x0ff_ff_ff_ffn);

  const highLz = Math.clz32(high);
  const lowLz = highLz === 32 ? Math.clz32(low) : 0;

  return highLz + lowLz;
}

function countTrailingZeroes(value: bigint): number {
  if (value === 0n) {
    return 64;
  }

  const high = Number(value >> 32n);
  const low = Number(value & 0x0ff_ff_ff_ffn);

  const lowTrz = ctrz(low);
  const highTrz = lowTrz === 32 ? ctrz(high) : 0;

  return lowTrz + highTrz;
}

// from https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/clz32
function ctrz(integer: number) {
  integer >>>= 0; // coerce to Uint32
  if (integer === 0) {
    // skipping this step would make it return -1
    return 32;
  }
  integer &= -integer; // equivalent to `int = int & (~int + 1)`
  return 31 - Math.clz32(integer);
}
