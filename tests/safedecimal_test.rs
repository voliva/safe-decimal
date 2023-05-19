use bigdecimal::BigDecimal;
use num_rational::Rational64;
use num_traits::{FromPrimitive, ToPrimitive};
use safe_decimal::{FormatOptions, SafeDecimal};
use std::{str::FromStr, time::SystemTime};

#[test]
fn it_compares_to_bigdecimal() {
    // https://github.com/MikeMcl/bignumber.js/issues/80
    // 0.6, 0.7, 0.9

    println!("Inverting issue");
    let value = SafeDecimal::from(0.6).inv().unwrap().inv().unwrap();
    println!("SafeDecimal {}", value.to_decimal(FormatOptions::default()));
    let value = BigDecimal::from_str("0.6").unwrap().inverse().inverse();
    println!("BigDecimal {}", value.to_string());

    let value = SafeDecimal::from(0.7).inv().unwrap().inv().unwrap();
    println!("SafeDecimal {}", value.to_decimal(FormatOptions::default()));
    let value = BigDecimal::from_str("0.7").unwrap().inverse().inverse();
    println!("BigDecimal {}", value.to_string());

    let value = SafeDecimal::from(0.9).inv().unwrap().inv().unwrap();
    println!("SafeDecimal {}", value.to_decimal(FormatOptions::default()));
    let value = BigDecimal::from_str("0.9").unwrap().inverse().inverse();
    println!("BigDecimal {}", value.to_string());

    // Performance
    println!("\nPerformance multiplication");
    let start = SystemTime::now();
    let mut value = SafeDecimal::from(0.1);
    let multiplier = SafeDecimal::from(1.001);

    for _ in 0..1000 {
        value = value * multiplier;
    }

    println!(
        "SafeDecimal: {}, time: {}us",
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
        "BigDecimal {}, time: {}us",
        "-", // value.to_string(),
        SystemTime::now().duration_since(start).unwrap().as_micros()
    );

    println!("\nPerformance addition");
    let start = SystemTime::now();
    let mut value = SafeDecimal::from(0.1);
    let increment = SafeDecimal::from(1.001);

    for _ in 0..1000000 {
        value = value + increment;
    }

    println!(
        "SafeDecimal: {}, time: {}us",
        value.to_float(),
        SystemTime::now().duration_since(start).unwrap().as_micros()
    );

    let start = SystemTime::now();

    let mut value = BigDecimal::from_str("0.1").unwrap();
    let increment = BigDecimal::from_str("1.001").unwrap();

    // It breaks down after just 6 multiplications...
    for _ in 0..1000000 {
        value = value + increment.clone();
    }

    println!(
        "BigDecimal: {}, time: {}us",
        value.to_f64().unwrap(),
        SystemTime::now().duration_since(start).unwrap().as_micros()
    )
}

#[test]
fn it_compares_to_rational() {
    println!("Overflow limit");
    let mut value: SafeDecimal<f64> = SafeDecimal::from(0.1);
    let mut increment = SafeDecimal::from(1.0);
    let factor = SafeDecimal::from(1.5);

    for i in 0..37 {
        value = value + increment;
        increment = increment / factor;
        // Interesting: increment gets to zero
        // if i > 3510 {
        //     println!("SafeDecimal: {i} {:?} {:?}", value, increment);
        // }
    }

    println!("SafeDecimal: {}", value.to_float());

    let mut value = Rational64::from_f64(0.1).unwrap();
    let mut increment = Rational64::from_f64(1.0).unwrap();
    let factor = Rational64::from_f64(1.5).unwrap();

    for i in 0..37 {
        // Blows up if 38
        value = value + increment;
        increment = increment / factor;
    }

    println!("Rational: {}", value.to_f64().unwrap());

    println!("\nPerformance multiplication");
    let start = SystemTime::now();
    let mut value = SafeDecimal::from(0.1);
    let multiplier = SafeDecimal::from(1.001);

    for _ in 0..5 {
        value = value * multiplier;
    }

    println!(
        "SafeDecimal: {}, time: {}us",
        value.to_float(),
        SystemTime::now().duration_since(start).unwrap().as_micros()
    );

    let start = SystemTime::now();

    let mut value = Rational64::from_f64(0.1).unwrap();
    let multiplier = Rational64::from_f64(1.001).unwrap();

    // It breaks down after just 6 multiplications...
    for _ in 0..5 {
        value = value * multiplier;
    }

    println!(
        "Rational: {}, time: {}us",
        value.to_f64().unwrap(),
        SystemTime::now().duration_since(start).unwrap().as_micros()
    );

    println!("\nPerformance addition");
    let start = SystemTime::now();
    let mut value = SafeDecimal::from(0.1);
    let increment = SafeDecimal::from(1.001);

    for _ in 0..1000000 {
        value = value + increment;
    }

    println!(
        "SafeDecimal: {}, time: {}us",
        value.to_float(),
        SystemTime::now().duration_since(start).unwrap().as_micros()
    );

    let start = SystemTime::now();

    let mut value = Rational64::from_f64(0.1).unwrap();
    let increment = Rational64::from_f64(1.001).unwrap();

    for _ in 0..1000000 {
        value = value + increment;
    }

    println!(
        "Rational: {}, time: {}us",
        value.to_f64().unwrap(),
        SystemTime::now().duration_since(start).unwrap().as_micros()
    )
}
