pub fn parse_double(value: f64) -> (u8, i16, u64) {
    let value_bits = value.to_bits();
    // Shift 7 bytes to the right + 7 more bits 8X_XX_XX_XX__XX_XX_XX_XX
    let sign = (value_bits >> (8 * 7 + 7)) as u8;
    // Exponent is those 7 bits + extra 4 ones 7F_FX_XX_XX__XX_XX_XX_XX
    // Needs to shift 6 bytes + 4 bits
    let exponent = ((value_bits >> (8 * 6 + 4)) & 0x07_ff) as u16;
    // Mantissa is the last 52 bits 00_0F_FF_FF__FF_FF_FF_FF
    let mantissa = value_bits & 0x00_0F_FF_FF__FF_FF_FF_FF;

    // exponent is in bias notation
    let exponent = (exponent as i16) - 1023;

    (sign, exponent, mantissa)
}
pub fn construct_double(sign: u8, exponent: i16, mantissa: u64) -> f64 {
    let sign = sign as u64;
    let exponent = (exponent + 1023) as u64;
    let value_bits = ((sign << (7 + 4)) | exponent) << (8 * 6 + 4) | mantissa;

    f64::from_bits(value_bits)
}
