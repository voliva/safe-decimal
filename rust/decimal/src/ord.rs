use std::cmp::Ordering;

use num_traits::Float;

use crate::NRNumber;

impl<T: Float> Ord for NRNumber<T> {
    fn cmp(&self, other: &Self) -> Ordering {
        s_cmp(
            self.numerator * other.denominator,
            self.denominator * other.numerator,
        )
    }
}
impl<T: Float> PartialOrd for NRNumber<T> {
    fn partial_cmp(&self, other: &Self) -> Option<Ordering> {
        Some(self.cmp(other))
    }
}

impl<T: Float> PartialEq for NRNumber<T> {
    fn eq(&self, other: &Self) -> bool {
        Ordering::is_eq(self.cmp(other))
    }
}
impl<T: Float> Eq for NRNumber<T> {}

fn s_cmp<T: Float>(a: T, b: T) -> std::cmp::Ordering {
    if a == b {
        Ordering::Equal
    } else if a > b {
        Ordering::Greater
    } else {
        Ordering::Less
    }
}
