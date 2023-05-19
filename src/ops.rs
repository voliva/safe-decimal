use std::fmt::LowerExp;

use num_traits::Float;

use crate::{
    double::{construct_float, exponential_form, from_exponential_from, parse_float},
    SafeDecimal,
};

impl<T: Float> SafeDecimal<T> {
    pub fn inv(&self) -> Option<SafeDecimal<T>> {
        if self.numerator == num_traits::zero() {
            None
        } else {
            if self.numerator.is_sign_negative() {
                Some(SafeDecimal {
                    numerator: -self.denominator,
                    denominator: -self.numerator,
                })
            } else {
                Some(SafeDecimal {
                    numerator: self.denominator,
                    denominator: self.numerator,
                })
            }
        }
    }

    pub fn abs(self) -> SafeDecimal<T> {
        if self.numerator.is_sign_negative() {
            -self
        } else {
            self
        }
    }
}

impl<T: Float + std::fmt::Debug> std::ops::Add<SafeDecimal<T>> for SafeDecimal<T> {
    type Output = Self;

    fn add(self, rhs: SafeDecimal<T>) -> Self::Output {
        let (a, b) = simplify_factors(self.denominator, rhs.denominator);
        // With the precondition that both denominators are positive, a and b will be positive as well.

        // a are the denominator factors in self that are not in rhs
        // b are the denominator factors in rhs that are not in self

        // the lcm of self and rhs' denominators will be crossing those
        // Multiplying both should be safe, because both numbers are safe floats.
        let denominator = self.denominator * b;

        // Then the numerator we also just need to cross that.
        reduce_exponent(SafeDecimal {
            numerator: self.numerator * b + rhs.numerator * a,
            denominator,
        })
    }
}

impl<T: Float + LowerExp + std::fmt::Debug> std::ops::Add<T> for SafeDecimal<T> {
    type Output = Self;

    fn add(self, rhs: T) -> Self::Output {
        self + SafeDecimal::from(rhs)
    }
}

impl<T: Float> std::ops::Neg for SafeDecimal<T> {
    type Output = Self;

    fn neg(self) -> Self::Output {
        return SafeDecimal {
            numerator: -self.numerator,
            denominator: self.denominator,
        };
    }
}

// impl<T: Float> std::ops::Sub for SafeDecimal<T> {
//     type Output = Self;

//     fn sub(self, rhs: Self) -> Self::Output {
//         self + -rhs
//     }
// }

impl<T: Float> std::ops::Mul for SafeDecimal<T> {
    type Output = Self;

    fn mul(self, rhs: Self) -> Self::Output {
        // TODO benchmark, but I think we can easily avoid overflows
        // simplify(
        //     self.numerator * rhs.numerator,
        //     self.denominator * rhs.denominator,
        // )

        let (self_num, rhs_den) = simplify_factors(self.numerator, rhs.denominator);
        let (rhs_num, self_den) = simplify_factors(rhs.numerator, self.denominator);
        reduce_exponent(SafeDecimal {
            numerator: self_num * rhs_num,
            denominator: self_den * rhs_den,
        })
    }
}

impl<T: Float> std::ops::Div for SafeDecimal<T> {
    type Output = Self;

    fn div(self, rhs: Self) -> Self::Output {
        self * rhs.inv().expect("Division by zero")
    }
}

fn simplify_factors<T: Float>(a: T, b: T) -> (T, T) {
    if a == T::zero() {
        return (T::zero(), T::one());
    }
    if b == T::zero() {
        return (T::one(), T::zero());
    }

    let (a_sign, a_int, a_exp) = exponential_form(a);
    let (b_sign, b_int, b_exp) = exponential_form(b);
    // a = a_sign {a_int} * 2 ^ {a_exp}
    // Essentially, it's the integer representation of `a` where all factors of 2 are extracted into an exponent (which can be negative)

    // Remove all common factors from `a` and `b`
    let gcd_int = gcd(a_int, b_int);
    let a_int_simplified = a_int / gcd_int;
    let b_int_simplified = b_int / gcd_int;

    // Remove common 2's: Just move them so that the sum of both is as close to 0 as possible.
    let exp_sum = a_exp + b_exp;
    let exp_change = exp_sum / 2;
    let a_exp_simplified = a_exp - exp_change;
    let b_exp_simplified = b_exp - exp_change;

    return (
        from_exponential_from(a_sign, a_int_simplified, a_exp_simplified),
        from_exponential_from(b_sign, b_int_simplified, b_exp_simplified),
    );
}

fn reduce_exponent<T: Float>(value: SafeDecimal<T>) -> SafeDecimal<T> {
    if value.numerator == num_traits::zero() {
        return SafeDecimal {
            numerator: num_traits::zero(),
            denominator: num_traits::one(),
        };
    }

    let (n_sign, n_exp, n_mant) = parse_float(value.numerator);
    let (d_sign, d_exp, d_mant) = parse_float(value.denominator);

    let exp_sum = n_exp + d_exp;
    let exp_change = exp_sum / 2;

    return SafeDecimal {
        numerator: construct_float::<T>(n_sign, n_exp - exp_change, n_mant),
        denominator: construct_float::<T>(d_sign, d_exp - exp_change, d_mant),
    };
}

fn gcd(a: u64, b: u64) -> u64 {
    let mut x = a;
    let mut y = b;

    while y != 0 {
        let temp = y;
        y = x % y;
        x = temp;
    }

    x
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn it_works() {
        println!("{:?}", simplify_factors(90.0, 420.0));
        println!("{:?}", exponential_form(0.2_f32));
    }
}
