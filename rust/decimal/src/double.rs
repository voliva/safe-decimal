use num_traits::Float;

pub fn parse_double(value: f64) -> (u8, i16, u64) {
    let value_bits = value.to_bits();

    // Least 52 bits are mantissa
    let mantissa = value_bits & 0x00_0F_FF_FF__FF_FF_FF_FF;
    let value_bits = value_bits >> 52;

    // next 11 bits are exponent
    let exponent = value_bits & 0x07_ff;
    let value_bits = value_bits >> 11;

    // exponent is in bias notation
    let exponent = (exponent as i16) - 1023;

    // Last bit is sign
    let sign = (value_bits & 0x01) as u8;

    (sign, exponent, mantissa)
}
pub fn construct_double(sign: u8, exponent: i16, mantissa: u64) -> f64 {
    let sign = sign as u64;
    let exponent = (exponent + 1023) as u64;
    let value_bits = ((sign << 11) | exponent) << 52 | mantissa;

    f64::from_bits(value_bits)
}

pub fn parse_single(value: f32) -> (u8, i16, u64) {
    let value_bits = value.to_bits();

    // Least 23 bits are mantissa
    let mantissa = (value_bits & 0x00_7F_FF_FF) as u64;
    let value_bits = value_bits >> 23;

    // next 8 bits are exponent
    let exponent = value_bits & 0x00_ff;
    let value_bits = value_bits >> 8;

    // exponent is in bias notation
    let exponent = (exponent as i16) - 127;

    // Last bit is sign
    let sign = (value_bits & 0x01) as u8;

    (sign, exponent, mantissa)
}
pub fn construct_single(sign: u8, exponent: i16, mantissa: u64) -> f32 {
    let sign = sign as u32;
    let exponent = (exponent + 127) as u32;
    let value_bits = (((sign << 8) | exponent) << 23) | (mantissa as u32);

    f32::from_bits(value_bits)
}

pub fn parse_float<T: Float>(value: T) -> (u8, i16, u64) {
    if is_f64::<T>() {
        parse_double(value.to_f64().unwrap())
    } else {
        parse_single(value.to_f32().unwrap())
    }
}
pub fn construct_float<T: Float>(sign: u8, exponent: i16, mantissa: u64) -> T {
    if is_f64::<T>() {
        T::from(construct_double(sign, exponent, mantissa)).unwrap()
    } else {
        T::from(construct_single(sign, exponent, mantissa)).unwrap()
    }
}

fn is_f64<T: Float>() -> bool {
    T::min_value().to_f64().unwrap() == f64::min_value()
}
