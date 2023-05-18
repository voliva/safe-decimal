use bigdecimal::BigDecimal;
use num_rational::Rational64;
use num_traits::{FromPrimitive, ToPrimitive};
use safe_decimal::{FormatOptions, SafeDecimal};
use std::{str::FromStr, time::SystemTime};

#[test]
fn it_compares_to_bigdecimal() {
    // https://github.com/MikeMcl/bignumber.js/issues/80
    // 0.6, 0.7, 0.9

    let value = SafeDecimal::from(0.6).inv().unwrap().inv().unwrap();
    println!("{}", value.to_decimal(FormatOptions::default()));
    let value = BigDecimal::from_str("0.6").unwrap().inverse().inverse();
    println!("{}", value.to_string());

    let value = SafeDecimal::from(0.7).inv().unwrap().inv().unwrap();
    println!("{}", value.to_decimal(FormatOptions::default()));
    let value = BigDecimal::from_str("0.7").unwrap().inverse().inverse();
    println!("{}", value.to_string());

    let value = SafeDecimal::from(0.9).inv().unwrap().inv().unwrap();
    println!("{}", value.to_decimal(FormatOptions::default()));
    let value = BigDecimal::from_str("0.9").unwrap().inverse().inverse();
    println!("{}", value.to_string());

    // Performance
    let start = SystemTime::now();
    let mut value = SafeDecimal::from(0.1);
    let multiplier = SafeDecimal::from(1.001);
    println!("{:?} {:?}", value, multiplier);

    for _ in 0..10000 {
        value = value * multiplier;
    }

    println!(
        "Result a: {}, time: {}us",
        value.to_float(),
        SystemTime::now().duration_since(start).unwrap().as_micros()
    );

    let start = SystemTime::now();

    let mut value = BigDecimal::from_str("0.1").unwrap();
    let multiplier = BigDecimal::from_str("1.001").unwrap();

    for _ in 0..10000 {
        value = value * multiplier.clone()
    }

    println!(
        "Result b: {}, time: {}us",
        "-", // value.to_string(),
        SystemTime::now().duration_since(start).unwrap().as_micros()
    );

    println!("{:?}", SafeDecimal::from(3.35));
}

#[test]
fn it_compares_to_rational() {
    // Performance
    let start = SystemTime::now();
    let mut value = SafeDecimal::from(0.1);
    let multiplier = SafeDecimal::from(1.001);
    println!("{:?} {:?}", value, multiplier);

    for _ in 0..10 {
        value = value * multiplier;
    }

    println!(
        "Result a: {}, time: {}us",
        value.to_float(),
        SystemTime::now().duration_since(start).unwrap().as_micros()
    );

    let start = SystemTime::now();

    let mut value = Rational64::from_f64(0.1).unwrap();
    let multiplier = Rational64::from_f64(1.001).unwrap();

    // It breaks down after just 6 multiplications...
    for _ in 0..10 {
        value = value * multiplier;
    }

    println!(
        "Result b: {}, time: {}us",
        value.to_f64().unwrap(),
        SystemTime::now().duration_since(start).unwrap().as_micros()
    );

    // Addition
    let start = SystemTime::now();
    let mut value = SafeDecimal::from(0.1);
    let multiplier = SafeDecimal::from(1.001);
    println!("{:?} {:?}", value, multiplier);

    for _ in 0..1000000 {
        value = value + multiplier;
    }

    println!(
        "Result a: {}, time: {}us",
        value.to_float(),
        SystemTime::now().duration_since(start).unwrap().as_micros()
    );

    let start = SystemTime::now();

    let mut value = Rational64::from_f64(0.1).unwrap();
    let multiplier = Rational64::from_f64(1.001).unwrap();

    // It breaks down after just 6 multiplications...
    for _ in 0..1000000 {
        value = value + multiplier;
    }

    println!(
        "Result b: {}, time: {}us",
        value.to_f64().unwrap(),
        SystemTime::now().duration_since(start).unwrap().as_micros()
    )
}
