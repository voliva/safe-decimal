
const floatValue = new Float64Array(1);
const floatBigint = new BigUint64Array(floatValue.buffer);


export function parseDouble(value: number) {
  floatValue[0] = value;
  let valueBits = floatBigint[0];

  // Least 52 bits are mantissa
  const mantissa = Number(valueBits & 0x00_0F_FF_FF__FF_FF_FF_FFn);
  valueBits = valueBits >> 52n;

  // next 11 bits are exponent, in bias notation
  const exponent = Number(valueBits & 0x07_ffn) - 1023;
  valueBits = valueBits >> 11n;

  // Last bit is sign
  let sign = Number(valueBits & 0x01n);

  return [sign, exponent, mantissa] as const
}

const bigintValue = new BigUint64Array(1);
const bigintFloat = new Float64Array(bigintValue.buffer);

export function constructDouble(sign: number, exponent: number, mantissa: number) {
  const signPart = BigInt(sign);
  const exponentPart = BigInt(exponent + 1023);
  const valueBits = ((signPart << 11n) | exponentPart) << 52n | BigInt(mantissa);

  bigintValue[0] = valueBits
  return bigintFloat[0];
}
