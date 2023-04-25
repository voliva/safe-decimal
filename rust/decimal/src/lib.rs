use std::{cmp::Ordering, num::ParseIntError, str::FromStr};

#[derive(Debug, Clone, Copy)]
pub struct NRNumber {
    numerator: f64,
    denominator: f64,
}

impl FromStr for NRNumber {
    type Err = ParseIntError;

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s.split_once(".") {
            Some((integer_part, fractional_part)) => from_parts(integer_part, fractional_part),
            None => from_integer(s),
        }
    }
}

impl NRNumber {
    pub fn inv(&self) -> Option<NRNumber> {
        if self.numerator == 0.0 {
            None
        } else {
            Some(NRNumber {
                numerator: self.denominator,
                denominator: self.numerator,
            })
        }
    }

    pub fn abs(self) -> NRNumber {
        if self.numerator >= 0.0 {
            self
        } else {
            -self
        }
    }
}

impl std::ops::Add<NRNumber> for NRNumber {
    type Output = Self;

    fn add(self, rhs: NRNumber) -> Self::Output {
        simplify(
            self.numerator * rhs.denominator + rhs.numerator * self.denominator,
            self.denominator * rhs.denominator,
        )
    }
}

impl std::ops::Neg for NRNumber {
    type Output = Self;

    fn neg(self) -> Self::Output {
        return NRNumber {
            numerator: -self.numerator,
            denominator: self.denominator,
        };
    }
}

impl std::ops::Sub for NRNumber {
    type Output = Self;

    fn sub(self, rhs: Self) -> Self::Output {
        self + -rhs
    }
}

impl std::ops::Mul for NRNumber {
    type Output = Self;

    fn mul(self, rhs: Self) -> Self::Output {
        simplify(
            self.numerator * rhs.numerator,
            self.denominator * rhs.denominator,
        )
    }
}

impl std::ops::Div for NRNumber {
    type Output = Self;

    fn div(self, rhs: Self) -> Self::Output {
        self * rhs.inv().expect("Division by zero")
    }
}

impl Ord for NRNumber {
    fn cmp(&self, other: &Self) -> Ordering {
        s_cmp(
            self.numerator * other.denominator,
            self.denominator * other.numerator,
        )
    }
}
impl PartialOrd for NRNumber {
    fn partial_cmp(&self, other: &Self) -> Option<Ordering> {
        Some(self.cmp(other))
    }
}

impl PartialEq for NRNumber {
    fn eq(&self, other: &Self) -> bool {
        Ordering::is_eq(self.cmp(other))
    }
}
impl Eq for NRNumber {}

fn simplify(numerator: f64, denominator: f64) -> NRNumber {
    if numerator == 0.0 {
        return NRNumber {
            numerator: 0.0,
            denominator: 1.0,
        };
    }

    let (n_sign, n_exp, n_mant) = parse_double(numerator);
    let (d_sign, d_exp, d_mant) = parse_double(denominator);

    // Goal is to keep this value as close to 0 as posible: Don't let numbers grow past float range.
    // TODO isn't exponent signed!?!
    let exp_sum = n_exp + d_exp;
    let exp_change = exp_sum / 2;

    return NRNumber {
        numerator: construct_double(n_sign, n_exp - exp_change, n_mant),
        denominator: construct_double(d_sign, d_exp - exp_change, d_mant),
    };
}

fn s_cmp(a: f64, b: f64) -> std::cmp::Ordering {
    if a == b {
        Ordering::Equal
    } else if a > b {
        Ordering::Greater
    } else {
        Ordering::Less
    }
}

fn from_integer(integer: &str) -> Result<NRNumber, ParseIntError> {
    let (is_negative, _, integer_numerator) = extract_prefix(integer)?;

    let parsed = NRNumber {
        numerator: integer_numerator as f64,
        denominator: 1.0,
    };
    if is_negative {
        return Ok(-parsed);
    }
    return Ok(parsed);
}

fn from_parts(integer_part: &str, fractional_part: &str) -> Result<NRNumber, ParseIntError> {
    let (is_negative, radix, integer_numerator) = extract_prefix(integer_part)?;
    let integer_part_rational = NRNumber {
        numerator: integer_numerator as f64,
        denominator: 1.0,
    };

    let fractional_part = &fractional_part[0..22];
    let denominator = (5.0_f64).powf(fractional_part.len() as f64);

    let correction = (2.0_f64).powf(fractional_part.len() as f64);
    let numerator = i128::from_str_radix(fractional_part, radix)? as f64 / correction;
    let fractional_part_rational = NRNumber {
        numerator,
        denominator,
    };

    let parsed = integer_part_rational + fractional_part_rational;
    if is_negative {
        return Ok(-parsed);
    }
    return Ok(parsed);
}

fn extract_prefix(value: &str) -> Result<(bool, u32, i128), ParseIntError> {
    let is_negative = value.starts_with("-");
    let value = value.trim_start_matches(|c| c == '-' || c == '+');
    let radix = match &value[..2] {
        "0b" => 2,
        "0o" => 8,
        "0x" => 16,
        _ => 10,
    };
    let value = if radix == 10 { value } else { &value[2..] };

    Ok((is_negative, radix, i128::from_str_radix(value, radix)?))
}

fn parse_double(value: f64) -> (u8, u16, u64) {
    let value_bits = value.to_bits();
    // Shift 7 bytes to the right + 7 more bits 8X_XX_XX_XX__XX_XX_XX_XX
    let sign = (value_bits >> (8 * 7 + 7)) as u8;
    // Exponent is those 7 bits + extra 4 ones 7F_FX_XX_XX__XX_XX_XX_XX
    // Needs to shift 6 bytes + 4 bits
    let exponent = ((value_bits >> (8 * 6 + 4)) & 0x07_ff) as u16;
    // Mantissa is the last 52 bits 00_0F_FF_FF__FF_FF_FF_FF
    let mantissa = value_bits & 0x00_0F_FF_FF__FF_FF_FF_FF;

    (sign, exponent, mantissa)
}
fn construct_double(sign: u8, exponent: u16, mantissa: u64) -> f64 {
    let sign = sign as u64;
    let exponent = exponent as u64;
    let value_bits = ((sign << (7 + 4)) | exponent) << (8 * 6 + 4) | mantissa;

    f64::from_bits(value_bits)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn it_works() {
        assert_eq!(4, 4);
    }
}
