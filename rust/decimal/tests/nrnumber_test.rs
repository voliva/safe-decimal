use bigdecimal::BigDecimal;
use decimal::NRNumber;
use std::str::FromStr;
use std::time::SystemTime;

#[test]
fn it_adds_two() {
    let start = SystemTime::now();

    let mut value = NRNumber::from(0.1);
    let multiplier = NRNumber::from(1.001);
    // println!("{:?} {:?}", value, multiplier);

    for _ in 0..1000 {
        value = value * multiplier;
        // println!("{:?} = {}", value, value.to_float());
    }

    println!(
        "Result a: {}, time: {}us",
        value.to_float(),
        SystemTime::now().duration_since(start).unwrap().as_micros()
    );

    let start = SystemTime::now();

    let mut value = BigDecimal::from_str("0.1").unwrap();
    let multiplier = BigDecimal::from_str("1.001").unwrap();

    for _ in 0..1000 {
        value = value * multiplier.clone()
    }

    println!(
        "Result b: {}, time: {}us",
        value.to_string(),
        SystemTime::now().duration_since(start).unwrap().as_micros()
    )
}
