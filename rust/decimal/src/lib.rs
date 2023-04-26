use std::{num::ParseIntError, str::FromStr};

mod double;
mod iter_pad;
mod ops;
mod ord;
mod parsing;

#[derive(Debug, Clone, Copy)]
pub struct NRNumber {
    numerator: f64,
    denominator: f64,
}

impl FromStr for NRNumber {
    type Err = ParseIntError;

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s.split_once(".") {
            Some((integer_part, fractional_part)) => {
                parsing::from_parts(integer_part, fractional_part)
            }
            None => parsing::from_integer(s),
        }
    }
}
