use std::fmt::LowerExp;

use num_traits::Float;

use crate::{
    double::{construct_float, parse_float},
    NRNumber,
};

impl<T: Float> NRNumber<T> {
    pub fn inv(&self) -> Option<NRNumber<T>> {
        if self.numerator == num_traits::zero() {
            None
        } else {
            Some(NRNumber {
                numerator: self.denominator,
                denominator: self.numerator,
            })
        }
    }

    pub fn abs(self) -> NRNumber<T> {
        if self.numerator >= num_traits::zero() {
            self
        } else {
            -self
        }
    }
}

impl<T: Float> std::ops::Add<NRNumber<T>> for NRNumber<T> {
    type Output = Self;

    fn add(self, rhs: NRNumber<T>) -> Self::Output {
        simplify(
            self.numerator * rhs.denominator + rhs.numerator * self.denominator,
            self.denominator * rhs.denominator,
        )
    }
}

impl<T: Float + LowerExp + std::fmt::Debug> std::ops::Add<T> for NRNumber<T> {
    type Output = Self;

    fn add(self, rhs: T) -> Self::Output {
        self + NRNumber::from_float(rhs)
    }
}

impl<T: Float> std::ops::Neg for NRNumber<T> {
    type Output = Self;

    fn neg(self) -> Self::Output {
        return NRNumber {
            numerator: -self.numerator,
            denominator: self.denominator,
        };
    }
}

impl<T: Float> std::ops::Sub for NRNumber<T> {
    type Output = Self;

    fn sub(self, rhs: Self) -> Self::Output {
        self + -rhs
    }
}

impl<T: Float> std::ops::Mul for NRNumber<T> {
    type Output = Self;

    fn mul(self, rhs: Self) -> Self::Output {
        simplify(
            self.numerator * rhs.numerator,
            self.denominator * rhs.denominator,
        )
    }
}

impl<T: Float> std::ops::Div for NRNumber<T> {
    type Output = Self;

    fn div(self, rhs: Self) -> Self::Output {
        self * rhs.inv().expect("Division by zero")
    }
}

pub fn simplify<T: Float>(numerator: T, denominator: T) -> NRNumber<T> {
    if numerator == num_traits::zero() {
        return NRNumber {
            numerator: num_traits::zero(),
            denominator: num_traits::one(),
        };
    }

    let (n_sign, n_exp, n_mant) = parse_float(numerator);
    let (d_sign, d_exp, d_mant) = parse_float(denominator);

    // Goal is to keep this value as close to 0 as posible: Don't let numbers grow past float range.
    // TODO isn't exponent signed!?!
    let exp_sum = n_exp + d_exp;
    let exp_change = exp_sum / 2;

    return NRNumber {
        numerator: construct_float::<T>(n_sign, n_exp - exp_change, n_mant),
        denominator: construct_float::<T>(d_sign, d_exp - exp_change, d_mant),
    };
}
