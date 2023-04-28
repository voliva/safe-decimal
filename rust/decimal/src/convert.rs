use crate::{
    parsing::{from_integer, from_parts},
    NRNumber,
};

trait PadEnd {
    fn pad_end(self, len: usize, c: char) -> Self;
}

impl PadEnd for String {
    fn pad_end(self, len: usize, c: char) -> Self {
        let mut result = self;
        while result.len() < len {
            result = result + &c.to_string();
        }
        result
    }
}

pub fn from_f64(value: f64) -> NRNumber {
    /*
     * When we receive a `0.1` if we try to get the maximum precision we will actually get the
     * "bad" representation of the number `0.1 => 0.1000000000000000055511151231257827021181583404541015625`.
     *
     * Languages have some rounding in place so that when you asign `0.1` to a variable and format
     * it it will properly display `0.1`, so we will use this formatting function to get the actual value.
     *
     * For numbers with repeating decimals, we can try our luck by inverting the fractional part of the number.
     * This might get rid of the most simple repeating decimals such as `1/3`. But to get the fractional part
     * we can't use numerical methods either because `123456.1 - 123456.0 != 0.1`, so we still need to work
     * with the string representation.
     */
    let (integer_part, fractional_part) = get_integer_and_fraction(value);
    from_f64_parts(integer_part, fractional_part)
}

fn from_f64_parts(integer_part: String, fractional_part: String) -> NRNumber {
    if fractional_part.len() == 0 {
        return from_parts(&integer_part, "").unwrap();
    }

    // Check if inverting the fractional part gets rid of extra decimals.
    let inverted_fractional_part =
        1.0 / ("0.".to_owned() + &fractional_part).parse::<f64>().unwrap();

    let (inv_integer_part, inv_fractional_part) =
        get_integer_and_fraction(inverted_fractional_part);

    if inv_fractional_part.len() >= fractional_part.len() {
        // If it doesn't, then just return the value as it was.
        return from_parts(&integer_part, &fractional_part).unwrap();
    }

    // We have to ignore the negative symbol and add it at the end, because we're separating the integer from the fraction.
    let is_negative = integer_part.starts_with("-");
    let integer_part_rational = from_integer(&integer_part).unwrap().abs();
    let inv_fractional_part_rational = from_f64_parts(inv_integer_part, inv_fractional_part);

    // Undoing the inversion - At this point all numbers are now represented as fractions, so it's safe to do these operations without losing precision.
    let parsed = integer_part_rational + inv_fractional_part_rational.inv().unwrap();

    if is_negative {
        -parsed
    } else {
        parsed
    }
}

fn get_integer_and_fraction(value: f64) -> (String, String) {
    let exp_repr = format!("{:e}", value);
    let split: Vec<&str> = exp_repr.splitn(2, "e").collect();
    let (numeric, exponent) = (split[0], split[1]);
    let sign = if numeric.starts_with("-") {
        "-".to_owned()
    } else {
        "".to_owned()
    };
    let numeric = numeric.replace(".", "").replace("-", "");
    let exponent = isize::from_str_radix(exponent, 10).unwrap();

    if exponent >= 0 {
        let max_int_pos = numeric.len().min(exponent as usize + 1);
        // Grab the first max_int_pos characters, adding zeroes at the end if needed
        let integer_part = numeric[0..max_int_pos]
            .to_owned()
            .pad_end(exponent as usize + 1, '0');
        let fractional_part = numeric[max_int_pos..].trim_end_matches('0');
        (sign + &integer_part, fractional_part.to_owned())
    } else {
        let zeroes = "".to_owned().pad_end((-exponent) as usize - 1, '0');
        let fractional_part = zeroes + numeric.trim_end_matches('0');
        (sign + "0", fractional_part)
    }
}

#[cfg(test)]
mod tests {
    use crate::format::to_decimal;

    use super::*;

    fn check_float_parsing(value: f64) {
        assert_eq!(from_f64(value).to_f64(), value);
    }
    fn check_num_den(value: NRNumber, num: f64, den: f64) {
        assert_eq!(value.numerator, num);
        assert_eq!(value.denominator, den);
    }

    #[test]
    fn it_converts_values_from_f64() {
        check_float_parsing(0.0);
        check_float_parsing(-0.1);
        check_float_parsing(0.1);
        check_float_parsing(123456.1);
        check_float_parsing(0.1234567890123456);
        assert_eq!(
            to_decimal(from_f64(0.1234567890123456), 17),
            "0.1234567890123456"
        );
    }

    #[test]
    fn its_able_to_decode_simple_repeating_decimals() {
        check_num_den(
            from_f64(10.0 / 21.0), // 1/3 + 1/7
            1.25,
            2.625,
        );
        check_num_den(
            from_f64(16.0 / 21.0), // 1/3 + 3/7
            1.0,
            1.3125,
        );
    }
}
