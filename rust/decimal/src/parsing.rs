use std::num::ParseIntError;

use crate::{double::construct_double, iter_pad::PadTrait, ops::simplify, NRNumber};

pub fn from_integer(integer: &str) -> Result<NRNumber, ParseIntError> {
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

pub fn from_parts(integer_part: &str, fractional_part: &str) -> Result<NRNumber, ParseIntError> {
    let (is_negative, radix, integer_numerator) = extract_prefix(integer_part)?;
    let integer_part_rational = NRNumber {
        numerator: integer_numerator as f64,
        denominator: 1.0,
    };

    let fractional_part_rational = match radix {
        2 => fractional_part_2(fractional_part),
        8 => fractional_part_8(fractional_part),
        10 => fractional_part_10(fractional_part),
        16 => fractional_part_16(fractional_part),
        _ => unreachable!(),
    }?;

    let parsed = integer_part_rational + fractional_part_rational;
    if is_negative {
        return Ok(-parsed);
    }
    return Ok(parsed);
}

pub fn fractional_part_10(fractional_part: &str) -> Result<NRNumber, ParseIntError> {
    let len = fractional_part.len().min(22);
    if len == 0 {
        return Ok(NRNumber {
            numerator: 0.0,
            denominator: 1.0,
        });
    }
    let fractional_part = &fractional_part[0..len];
    let denominator = (5.0_f64).powf(fractional_part.len() as f64);

    let correction = (2.0_f64).powf(fractional_part.len() as f64);
    let numerator = u128::from_str_radix(fractional_part, 10)? as f64 / correction;
    Ok(NRNumber {
        numerator,
        denominator,
    })
}

pub fn fractional_part_2(fractional_part: &str) -> Result<NRNumber, ParseIntError> {
    let first_one = fractional_part.find('1');
    if first_one.is_none() {
        return Ok(NRNumber {
            numerator: 0.0,
            denominator: 1.0,
        });
    }

    // exponent is negative
    let (fractional_part, exponent) = first_one
        .map(|pos| (&fractional_part[(pos + 1)..], -(pos as i16 + 1)))
        .unwrap();

    let mantissa = fractional_part
        .chars()
        .take(52)
        .map(|v| if v == '0' { 0 } else { 1 })
        .pad(52, 0)
        .fold(0_u64, |acc, x| acc << 1 | x);

    Ok(simplify(construct_double(0, exponent, mantissa), 1.0))
}

pub fn fractional_part_8(fractional_part: &str) -> Result<NRNumber, ParseIntError> {
    let binary_rep = fractional_part
        .chars()
        .map(|c| match c {
            '0' => "000",
            '1' => "001",
            '2' => "010",
            '3' => "011",
            '4' => "100",
            '5' => "101",
            '6' => "110",
            '7' => "111",
            _ => todo!("Throw ParseIntError"),
        })
        .fold(String::new(), |acc, v| acc + v);

    fractional_part_2(&binary_rep)
}

pub fn fractional_part_16(fractional_part: &str) -> Result<NRNumber, ParseIntError> {
    let binary_rep = fractional_part
        .chars()
        .map(|c| match c.to_ascii_lowercase() {
            '0' => "0000",
            '1' => "0001",
            '2' => "0010",
            '3' => "0011",
            '4' => "0100",
            '5' => "0101",
            '6' => "0110",
            '7' => "0111",
            '8' => "1000",
            '9' => "1001",
            'a' => "1010",
            'b' => "1011",
            'c' => "1100",
            'd' => "1101",
            'e' => "1110",
            'f' => "1111",
            _ => todo!("Throw ParseIntError"),
        })
        .fold(String::new(), |acc, v| acc + v);

    fractional_part_2(&binary_rep)
}

fn extract_prefix(value: &str) -> Result<(bool, u32, u128), ParseIntError> {
    let is_negative = value.starts_with("-");
    let value = value.trim_start_matches(|c| c == '-' || c == '+');
    let len = value.len().min(2);
    let radix = match &value[..len] {
        "0b" => 2,
        "0o" => 8,
        "0x" => 16,
        _ => 10,
    };
    let value = if radix == 10 { value } else { &value[2..] };

    Ok((is_negative, radix, u128::from_str_radix(value, radix)?))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn it_parses_numbers_in_base_10() {
        assert_eq!(from_parts("12", "34").unwrap().to_f64(), 12.34);
        assert_eq!(from_parts("0", "1").unwrap().to_f64(), 0.1);
        assert_eq!(from_parts("+0", "2").unwrap().to_f64(), 0.2);
        assert_eq!(from_parts("0", "").unwrap().to_f64(), 0.0);
        assert_eq!(from_parts("3", "").unwrap().to_f64(), 3.0);
        assert_eq!(from_parts("-3", "2").unwrap().to_f64(), -3.2);
        assert_eq!(
            from_parts(&u128::MAX.to_string(), "").unwrap().to_f64(),
            u128::MAX as f64
        );
    }
}
