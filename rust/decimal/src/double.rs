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

pub fn exponential_form<T: Float>(value: T) -> (u8, u64, i32) {
    if value == T::zero() {
        let sign = if value.is_sign_negative() { 1 } else { 0 };
        return (sign, 0, 0);
    }

    let (sign, exp, mantissa) = parse_float(value);
    let mantissa_len = if is_f64::<T>() { 52 } else { 23 };
    let integer_val = mantissa | (1 << mantissa_len);
    // At this point what we've done is move the decimal position mantissa_len positions to the right
    // so result would be `integer_val * 2 ^ (exp - mantissa_len)`
    // However, we can remove trailing zeroes to avoid having a big integer part and small exponent
    let trailing_zeroes = count_trailing_zeroes(integer_val);

    (
        sign,
        integer_val >> trailing_zeroes,
        (exp as i32) - mantissa_len + (trailing_zeroes as i32),
    )
}
pub fn from_exponential_from<T: Float>(sign: u8, value: u64, exp: i32) -> T {
    if value == 0 {
        return T::zero();
    }

    let mantissa_len = if is_f64::<T>() { 52 } else { 23 };
    // We need to move value to the left so that the first 1 falls out from mantissa_len
    let lead_zero = count_leading_zeroes(value);
    let displacement = lead_zero + mantissa_len - 63;
    let decimal_part_length = 63 - lead_zero;

    let exp = (exp + (decimal_part_length as i32)) as i16;

    // And we also need to remove the leading 1
    let mask = !(1_u64 << mantissa_len);
    return construct_float(sign, exp, (value << displacement) & mask);
}

fn count_trailing_zeroes(value: u64) -> u8 {
    if value == 0 {
        return 64;
    }

    let mut result: u8 = 0;

    // keep rightmost set bit (the one that determines the answer) clear all others
    let v = ((value as i64) & -(value as i64)) as u64;

    if v & 0xAAAAAAAAAAAAAAAA != 0 {
        result |= 1;
    }
    if v & 0xCCCCCCCCCCCCCCCC != 0 {
        result |= 2;
    }
    if v & 0xF0F0F0F0F0F0F0F0 != 0 {
        result |= 4;
    }
    if v & 0xFF00FF00FF00FF00 != 0 {
        result |= 8;
    }
    if v & 0xFFFF0000FFFF0000 != 0 {
        result |= 16;
    }
    if v & 0xFFFFFFFF00000000 != 0 {
        result |= 32;
    }

    return result;
}

fn count_leading_zeroes(value: u64) -> u8 {
    if value == 0 {
        return 64;
    }

    let mut v = value;
    v = v | (v >> 1);
    v = v | (v >> 2);
    v = v | (v >> 4);
    v = v | (v >> 8);
    v = v | (v >> 16);
    v = v | (v >> 32);

    return v.count_zeros() as u8;
}

fn is_f64<T: Float>() -> bool {
    T::min_value().to_f64().unwrap() == f64::min_value()
}

#[cfg(test)]
mod tests {
    use super::*;

    fn check_float<T: Float + std::fmt::Debug>(input: T, sign: u8, exponent: i16, mantissa: u64) {
        assert_eq!(parse_float(input), (sign, exponent, mantissa));
        let result = construct_float::<T>(sign, exponent, mantissa);
        if input.is_nan() {
            assert!(result.is_nan());
        } else {
            assert_eq!(result, input);
        }
    }

    #[test]
    fn it_parses_and_constructs_f64() {
        check_float(0.0f64, 0, -1023, 0);
        check_float(-0.0f64, 1, -1023, 0);
        check_float(1.0f64, 0, 0, 0);
        check_float(f64::NAN, 0, 1024, 0x8000000000000);
        check_float(f64::INFINITY, 0, 1024, 0);
        check_float(-f64::INFINITY, 1, 1024, 0);
        check_float(48879.125f64, 0, 15, 0x7DDE400000000);
    }
    // TODO protect against overflows, atm it's not protected

    #[test]
    fn it_parses_and_constructs_f32() {
        check_float(0.0f32, 0, -127, 0);
        check_float(-0.0f32, 1, -127, 0);
        check_float(1.0f32, 0, 0, 0);
        check_float(f32::NAN, 0, 128, 0x400000);
        check_float(f32::INFINITY, 0, 128, 0);
        check_float(-f32::INFINITY, 1, 128, 0);
        check_float(48879.125f32, 0, 15, 0x3EEF20);
    }

    fn check_exponent<T: Float + std::fmt::Debug>(input: T, sign: u8, value: u64, exponent: i32) {
        assert_eq!(exponential_form(input), (sign, value, exponent));
        let result = from_exponential_from::<T>(sign, value, exponent);
        if input.is_nan() {
            assert!(result.is_nan());
        } else {
            assert_eq!(result, input);
        }
    }

    #[test]
    fn it_transforms_exponential_form_f64() {
        check_exponent(0.0f64, 0, 0, 0);
        check_exponent(-0.0f64, 1, 0, 0);
        check_exponent(1.0f64, 0, 1, 0);
        check_exponent(2.0f64, 0, 1, 1);
        check_exponent(-2.0f64, 1, 1, 1);

        check_exponent(0.625f64, 0, 5, -3);
        check_exponent(-0.625f64, 1, 5, -3);
        check_exponent(112.625f64, 0, 901, -3);

        check_exponent(112.0f64, 0, 7, 4);

        // On the representation of floats, the minimum biased exponent can be 1, which resolves to 1 - bias, then the minimum value is when mantissa is all 0
        // This is just 1 * 2 ^ exponent. for f64 the bias is 1023, so the minimum value is just 1 * 2 ^ -1022
        check_exponent(f64::min_positive_value(), 0, 1, 1 - 1023);

        check_exponent(
            f64::max_value(),
            0,
            // Value is 52 bits of mantissa + 1 extra (implicit)
            0x1F_FF_FF_FF_FF_FF_FF,
            // On floating point representation, the maximum possible exponent in biased form is 0x7FE (all ones except the last one, otherwise it becomes Inf/NaN/etc.). Resolving the bias is 0x7FE - bias.
            // But this is used as a representation 1.{mantissa} * 2 ^ exponent.
            // Our function transforms everything to integers, so it moves the comma to the right {mantissa} positions. For every position moved, the exponent is decremented by one
            0x7FE - 1023 - 52,
        );
    }
    // TODO protect against overflows and special values: NaN can't be represented as an exponent.

    #[test]
    fn it_transforms_exponential_form_f32() {
        check_exponent(0.0f32, 0, 0, 0);
        check_exponent(-0.0f32, 1, 0, 0);
        check_exponent(1.0f32, 0, 1, 0);
        check_exponent(2.0f32, 0, 1, 1);
        check_exponent(-2.0f32, 1, 1, 1);

        check_exponent(0.625f32, 0, 5, -3);
        check_exponent(-0.625f32, 1, 5, -3);
        check_exponent(112.625f32, 0, 901, -3);

        check_exponent(112.0f32, 0, 7, 4);

        check_exponent(f32::min_positive_value(), 0, 1, 1 - 127);

        check_exponent(
            f32::max_value(),
            0,
            // Value is 23 bits of mantissa + 1 extra (implicit)
            0x00_FF_FF_FF,
            0x0_FE - 127 - 23,
        );
    }
}
