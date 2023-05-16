use decimal::NRNumber;
use std::str::FromStr;

#[test]
fn it_adds_two() {
    let a = NRNumber::from_str("0.1").unwrap();
    let b = NRNumber::from(3.0);
    let result = a * b;

    assert_eq!(0.3, result.to_float());
}
