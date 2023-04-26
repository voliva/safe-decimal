use crate::{
    double::{construct_double, parse_double},
    NRNumber,
};

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

pub fn simplify(numerator: f64, denominator: f64) -> NRNumber {
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
