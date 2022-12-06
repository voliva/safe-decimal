import { NRNumber } from "./NRNumber";
import { fromDecimalString, fromInput, fromNumber } from "./parser";
import { toDecimalString } from "./serializer";

describe("fromDecimalString", () => {
  function checkParsing(input: string, output = input) {
    expect(new NRNumber(input).toDecimalString()).toBe(output);
  }

  it("parses numbers in base 10", () => {
    checkParsing("12.34");
    checkParsing("0.1");
    checkParsing("+0.2", "0.2");
    checkParsing("0");
    checkParsing("-3.2");
    checkParsing(Number.MAX_SAFE_INTEGER.toString());
  });
  it.skip("parses hex numbers", () => {
    checkParsing("0x1A", "26");
    checkParsing("+0x1b", "27");
    checkParsing("0x0.1", "0.0625");
    checkParsing("-0xa.fF", "-10.98609375");
    checkParsing("0xbeef.decaf", "48879.8702840805053711");
    // TODO test max precision (another set of tests I guess?)
  });
  it.skip("parses binary numbers", () => {
    checkParsing("0b1010", "10");
    checkParsing("-0b1.11", "-1.75");
    checkParsing("+0b10.0000000001", "2.0009765625");
  });
  it.skip("throws an error with invalid formats", () => {});
});

describe("fromNumber", () => {
  it("doesn't lose precision when passing in values not representable in binary", () => {
    expect(new NRNumber(0.2).sub("0.2").cmp(0)).toBe(0);
    expect(new NRNumber(0.1).add(0.2).cmp(0.3)).toBe(0);

    // It's actually not guaranteed. This test would fail on this case:
    // expect(new NRNumber(43534.5435).sub("43534.5435").cmp(0)).toBe(0);
    // There's nothing much we can do though
  });
});

describe("fromInput", () => {
  it("returns the same reference if the value is a NRN", () => {
    const number = fromDecimalString("0.1");
    expect(fromInput(number)).toBe(number);
  });
  it("parses strings or numbers alike", () => {
    expect(toDecimalString(fromInput("0.1"))).toEqual(
      toDecimalString(fromInput(0.1))
    );
  });
});
