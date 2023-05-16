use std::{fmt::LowerExp, num::ParseIntError, str::FromStr};

use convert::from_f64;
use format::{to_decimal, FormatOptions};
use num_traits::Float;

mod convert;
mod double;
mod format;
mod iter_pad;
mod ops;
mod ord;
mod parsing;

#[derive(Debug, Clone, Copy)]
pub struct NRNumber<T> {
    numerator: T,
    denominator: T,
}

impl<T: Float + std::fmt::Debug> FromStr for NRNumber<T> {
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

impl<T: Float + LowerExp + std::fmt::Debug> NRNumber<T> {
    pub fn from_float(value: T) -> NRNumber<T> {
        from_f64(value)
    }
}

impl<T: Float> NRNumber<T> {
    pub fn to_float(&self) -> T {
        self.numerator / self.denominator
    }

    pub fn to_decimal(&self, options: FormatOptions) -> String {
        to_decimal(self, &options)
    }
}
