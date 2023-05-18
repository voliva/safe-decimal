use num_traits::float::Float;
use std::num::ParseIntError;

use crate::{double::construct_float, iter_pad::PadTrait, SafeDecimal};

pub fn from_integer<T: Float>(integer: &str) -> Result<SafeDecimal<T>, ParseIntError> {
    let (is_negative, _, integer_numerator) = extract_prefix(integer)?;

    let parsed = SafeDecimal {
        numerator: T::from(integer_numerator).unwrap(),
        denominator: T::from(1).unwrap(),
    };
    if is_negative {
        return Ok(-parsed);
    }
    return Ok(parsed);
}

pub fn from_parts<T: Float + std::fmt::Debug>(
    integer_part: &str,
    fractional_part: &str,
) -> Result<SafeDecimal<T>, ParseIntError> {
    let (is_negative, radix, integer_numerator) = extract_prefix(integer_part)?;
    let integer_part_rational = SafeDecimal {
        numerator: T::from(integer_numerator).unwrap(),
        denominator: T::from(1).unwrap(),
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

pub fn fractional_part_10<T: Float>(
    fractional_part: &str,
) -> Result<SafeDecimal<T>, ParseIntError> {
    let len = fractional_part.len().min(22);
    if len == 0 {
        return Ok(SafeDecimal {
            numerator: T::zero(),
            denominator: T::one(),
        });
    }
    let fractional_part = &fractional_part[0..len];
    let denominator = T::from(5)
        .unwrap()
        .powf(T::from(fractional_part.len()).unwrap());

    let correction = T::from(2)
        .unwrap()
        .powf(T::from(fractional_part.len()).unwrap());
    let numerator = T::from(u128::from_str_radix(fractional_part, 10)?).unwrap() / correction;
    Ok(SafeDecimal {
        numerator,
        denominator,
    })
}

pub fn fractional_part_2<T: Float>(fractional_part: &str) -> Result<SafeDecimal<T>, ParseIntError> {
    let first_one = fractional_part.find('1');
    if first_one.is_none() {
        return Ok(SafeDecimal {
            numerator: num_traits::zero(),
            denominator: num_traits::one(),
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

    Ok(SafeDecimal {
        numerator: construct_float::<T>(0, exponent, mantissa),
        denominator: T::one(),
    })
}

pub fn fractional_part_8<T: Float>(fractional_part: &str) -> Result<SafeDecimal<T>, ParseIntError> {
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

pub fn fractional_part_16<T: Float>(
    fractional_part: &str,
) -> Result<SafeDecimal<T>, ParseIntError> {
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

    fn check_parsing<T: Float + std::fmt::Debug>(integer: &str, fraction: &str, output: T) {
        assert_eq!(
            from_parts::<T>(integer, fraction).unwrap().to_float(),
            output
        );
    }

    #[test]
    fn it_parses_numbers_in_base_10() {
        check_parsing("12", "34", 12.34);
        check_parsing("0", "1", 0.1);
        check_parsing("+0", "2", 0.2);
        check_parsing("0", "", 0.0);
        check_parsing("3", "", 3.0);
        check_parsing("-3", "2", -3.2);
        check_parsing(&u128::MAX.to_string(), "", u128::MAX as f64);
    }

    #[test]
    fn it_parses_numbers_in_hex() {
        check_parsing("0x1A", "", 26.0);
        check_parsing("+0x1b", "", 27.0);
        check_parsing("0x0", "1", 0.0625);
        check_parsing("-0xa", "fF", -10.99609375);
        // TODO check_parsing with string, because it seems that f64 gets cut off after 505
        check_parsing("0xbeef", "decaf", 48879.87028408050537109375);
    }

    #[test]
    fn it_parses_numbers_in_binary() {
        check_parsing("0b1010", "", 10.0);
        check_parsing("-0b1", "11", -1.75);
        check_parsing("+0b10", "0000000001", 2.0009765625);
    }

    #[test]
    fn it_approximates_numbers_with_large_decimals() {
        // println!("{:e}", 123456.1);
        // println!("{:e}", 123456.1 - 123456.0);

        check_parsing("0", "123456789012345678", 0.123456789012345678);
        //   // This test breaks when the numerator + denominator get so big that they lose too much precision.
        //   const numberStr =
        //     "0." + new Array(16).fill("12345678901234567890").join("");
        //   expect(
        //     new SafeDecimal(numberStr).toDecimalString().startsWith("0.1234567890123456")
        //   ).toBe(true);
    }
}
