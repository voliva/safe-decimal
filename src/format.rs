use std::cmp::Ordering;

use num_traits::Float;

use crate::SafeDecimal;

#[derive(Debug, Clone, Copy)]
enum RoundingDirection {
    Up,
    Down,
    Ceil,
    Floor,
    Even,
}

#[derive(Debug, Clone)]
pub struct Rounding {
    direction: RoundingDirection,
    nearest: bool,
}

impl Rounding {
    pub const UP: Rounding = Rounding {
        direction: RoundingDirection::Up,
        nearest: false,
    };
    pub const DOWN: Rounding = Rounding {
        direction: RoundingDirection::Down,
        nearest: false,
    };
    pub const CEIL: Rounding = Rounding {
        direction: RoundingDirection::Ceil,
        nearest: false,
    };
    pub const FLOOR: Rounding = Rounding {
        direction: RoundingDirection::Floor,
        nearest: false,
    };
    pub const EVEN: Rounding = Rounding {
        direction: RoundingDirection::Even,
        nearest: false,
    };
    pub const HALF_UP: Rounding = Rounding {
        direction: RoundingDirection::Up,
        nearest: true,
    };
    pub const HALF_DOWN: Rounding = Rounding {
        direction: RoundingDirection::Down,
        nearest: true,
    };
    pub const HALF_CEIL: Rounding = Rounding {
        direction: RoundingDirection::Ceil,
        nearest: true,
    };
    pub const HALF_FLOOR: Rounding = Rounding {
        direction: RoundingDirection::Floor,
        nearest: true,
    };
    pub const HALF_EVEN: Rounding = Rounding {
        direction: RoundingDirection::Even,
        nearest: true,
    };
}

#[derive(Debug, Clone, Copy)]
pub enum Radix {
    Binary,
    Octal,
    Decimal,
    Hexadecimal,
}

impl Radix {
    fn value(&self) -> f64 {
        match self {
            Radix::Binary => 2.0,
            Radix::Octal => 8.0,
            Radix::Decimal => 10.0,
            Radix::Hexadecimal => 16.0,
        }
    }
    fn format(&self, integer: u64) -> String {
        match self {
            Radix::Binary => format!("{:b}", integer),
            Radix::Octal => format!("{:o}", integer),
            Radix::Decimal => format!("{}", integer),
            Radix::Hexadecimal => format!("{:x}", integer),
        }
    }
}

#[derive(Debug, Clone)]
pub struct FormatOptions {
    radix: Radix,
    max_decimals: usize,
    rounding: Rounding,
}

impl Default for FormatOptions {
    fn default() -> Self {
        Self {
            radix: Radix::Decimal,
            max_decimals: 16,
            rounding: Rounding::HALF_CEIL,
        }
    }
}
impl FormatOptions {
    pub fn radix(mut self, radix: Radix) -> Self {
        self.radix = radix;
        self
    }
    pub fn max_decimals(mut self, max_decimals: usize) -> Self {
        self.max_decimals = max_decimals;
        self
    }
    pub fn rounding(mut self, rounding: Rounding) -> Self {
        self.rounding = rounding;
        self
    }
}

pub fn to_decimal<T: Float + PartialOrd>(
    value: &SafeDecimal<T>,
    options: &FormatOptions,
) -> String {
    let sign = if value.numerator < num_traits::zero() {
        "-"
    } else {
        ""
    };
    let mut numerator = value.numerator.abs();
    let denominator = value.denominator;

    let mut integer_part = (numerator / denominator).trunc().to_u64().unwrap();

    // numerator and denominator are both safe.
    // multiplying an integer by a safe number gives a safe number.
    // subtracting two safe numbers also gives a safe number.
    numerator = numerator - T::from(integer_part).unwrap() * denominator;

    let mut decimal_part = Vec::with_capacity(options.max_decimals);
    for _ in 0..options.max_decimals {
        if numerator == num_traits::zero() {
            break;
        }

        // Multiply a/b by radix, extract integer, repeat.
        numerator = numerator * T::from(10).unwrap();
        let div_result = (numerator / denominator).trunc();
        decimal_part.push(div_result.to_u8().unwrap());

        numerator = numerator - div_result * denominator;
    }

    if numerator != num_traits::zero() {
        let is_negative = sign == "-";
        let is_odd = options.max_decimals == 0 && integer_part % 2 == 1
            || decimal_part[decimal_part.len() - 1] % 2 == 1;
        let half_cmp = (T::from(2).unwrap() * numerator)
            .partial_cmp(&denominator)
            .unwrap_or(Ordering::Equal);

        if options
            .rounding
            .should_increment(is_negative, is_odd, half_cmp)
        {
            integer_part += increment(&mut decimal_part, &options.radix);
        }
    }

    let decimal_str = decimal_part
        .into_iter()
        .map(|d| char_to_str(d))
        .collect::<String>()
        .trim_end_matches('0')
        .to_owned();

    if integer_part == 0 && decimal_str.len() == 0 {
        // Avoid sign
        return "0".to_owned();
    }

    let decimal_str = if decimal_str.len() > 0 {
        ".".to_owned() + &decimal_str
    } else {
        decimal_str
    };

    return format!(
        "{}{}{}",
        sign,
        options.radix.format(integer_part),
        decimal_str
    );
}

fn increment(decimals: &mut Vec<u8>, radix: &Radix) -> u64 {
    for d in (0..decimals.len()).rev() {
        if decimals[d] < radix.value() as u8 - 1 {
            decimals[d] += 1;
            return 0;
        }
        decimals[d] = 0;
    }
    return 1;
}

impl RoundingDirection {
    fn should_increment(&self, is_negative: bool, is_odd: bool) -> bool {
        match self {
            RoundingDirection::Up => {
                // <- 0 ->
                true
            }
            RoundingDirection::Down => {
                // -> 0 <-
                false
            }
            RoundingDirection::Ceil => {
                // -> Infinity
                !is_negative
            }
            RoundingDirection::Floor => {
                // <- Infinity
                is_negative
            }
            RoundingDirection::Even => {
                // <- Infinity
                is_odd
            }
        }
    }
}

impl Rounding {
    fn should_increment(&self, is_negative: bool, is_odd: bool, half_cmp: Ordering) -> bool {
        if !self.nearest {
            return self.direction.should_increment(is_negative, is_odd);
        }

        match half_cmp {
            Ordering::Equal => self.direction.should_increment(is_negative, is_odd),
            Ordering::Less => false,
            Ordering::Greater => true,
        }
    }
}

fn char_to_str(num: u8) -> char {
    if num >= 10 {
        ('a' as u8 + (num - 10)) as char
    } else {
        ('0' as u8 + num) as char
    }
}
