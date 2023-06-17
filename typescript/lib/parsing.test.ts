import { describe, it, expect } from "vitest";
import { SafeDecimal } from "./SafeDecimal";

describe("fromDecimalString", () => {
  function checkParsing(input: string, output = input) {
    const r = new SafeDecimal(input);
    expect(r.toString({ maxDecimals: 20 })).toBe(output);
  }

  it("parses numbers in base 10", () => {
    checkParsing("12.34");
    checkParsing("0.1");
    checkParsing("+0.2", "0.2");
    checkParsing("0");
    checkParsing("-3.2");
    checkParsing(Number.MAX_SAFE_INTEGER.toString());
  });
  it("parses hex numbers", () => {
    checkParsing("0x1A", "26");
    checkParsing("+0x1b", "27");
    checkParsing("0x0.1", "0.0625");
    checkParsing("-0xa.fF", "-10.99609375");
    // Fun stuff: doing this calculation "by hand" on a computer gives a bad result "48879.8702840805053711" because it's missing precision
    checkParsing("0xbeef.decaf", "48879.87028408050537109375");
    // TODO test max precision (another set of tests I guess?)
  });
  it("parses binary numbers", () => {
    checkParsing("0b1010", "10");
    checkParsing("-0b1.11", "-1.75");
    checkParsing("+0b10.0000000001", "2.0009765625");
  });
  it.skip("throws an error with invalid formats", () => {});

  it("gives a fair enough approximation for numbers with lots of decimals", () => {
    expect(new SafeDecimal("0.1234567890123456").toString()).toEqual(
      "0.1234567890123456"
    );

    // This test would break when the numerator + denominator get so big that they lose too much precision.
    const numberStr =
      "0." + new Array(16).fill("12345678901234567890").join("");
    const mustBeginWith = "0.12345678901234567";
    expect(
      new SafeDecimal(numberStr).toString({ maxDecimals: mustBeginWith.length })
    ).toEqual(expect.stringContaining(mustBeginWith));
  });
});

describe("fromNumber", () => {
  it("doesn't lose precision when passing in values not representable in binary", () => {
    expect(new SafeDecimal(0.2).sub("0.2").cmp(0)).toBe(0);
    expect(new SafeDecimal(0.1).add(0.2).cmp(0.3)).toBe(0);
    expect(new SafeDecimal(43534.5435).sub("43534.5435").cmp(0)).toBe(0);
    expect(new SafeDecimal(0.1234567890123456).toString()).toEqual(
      "0.1234567890123456"
    );
  });
});

describe("SafeDecimal.from", () => {
  it("returns the same reference if the value is a SafeDecimal", () => {
    const number = new SafeDecimal("0.1");
    expect(SafeDecimal.from(number)).toBe(number);
  });
  it("parses strings or numbers alike", () => {
    expect(SafeDecimal.from("0.1").toString()).toEqual(
      SafeDecimal.from(0.1).toString()
    );
  });
});
