use crate::NRNumber;

// TODO rounding :scream:
pub fn to_decimal(value: NRNumber, max_decimals: usize) -> String {
    let denominator = value.denominator;
    let mut numerator = value.numerator;

    // Integer part
    let div_result = (numerator / denominator).trunc();
    let mut result = (div_result as i64).to_string();

    // numerator and denominator are both safe.
    // multiplying an integer by a safe number gives a safe number.
    // subtracting two safe numbers also gives a safe number.
    numerator -= div_result * denominator;

    if numerator == 0.0 || max_decimals == 0 {
        return result;
    }

    result += ".";
    for _ in 0..max_decimals {
        numerator = numerator * 10.0;

        let div_result = (numerator / denominator).trunc();
        result += (div_result as i64).to_string().as_str();

        numerator -= div_result * denominator;
        if numerator == 0.0 {
            return result;
        }
    }
    return result;
}
