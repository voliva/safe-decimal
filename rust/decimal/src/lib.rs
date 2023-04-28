use std::{num::ParseIntError, str::FromStr};

use convert::from_f64;
use format::{to_decimal, FormatOptions};

mod convert;
mod double;
mod format;
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

impl NRNumber {
    pub fn from_f64(value: f64) -> NRNumber {
        from_f64(value)
    }

    pub fn to_f64(&self) -> f64 {
        self.numerator / self.denominator
    }

    pub fn to_decimal(&self, options: FormatOptions) -> String {
        to_decimal(self, &options)
    }
}
