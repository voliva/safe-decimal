use std::cmp::Ordering;

use crate::NRNumber;

impl Ord for NRNumber {
    fn cmp(&self, other: &Self) -> Ordering {
        s_cmp(
            self.numerator * other.denominator,
            self.denominator * other.numerator,
        )
    }
}
impl PartialOrd for NRNumber {
    fn partial_cmp(&self, other: &Self) -> Option<Ordering> {
        Some(self.cmp(other))
    }
}

impl PartialEq for NRNumber {
    fn eq(&self, other: &Self) -> bool {
        Ordering::is_eq(self.cmp(other))
    }
}
impl Eq for NRNumber {}

fn s_cmp(a: f64, b: f64) -> std::cmp::Ordering {
    if a == b {
        Ordering::Equal
    } else if a > b {
        Ordering::Greater
    } else {
        Ordering::Less
    }
}
