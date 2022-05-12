import { DivisionByZeroError } from "../common";
import { NRNumber } from "./NRNumber";
import { NRRationalInput } from "./parser";

describe("neg", () => {
  it("negates a value", () => {
    expect(new NRNumber("1.23").neg().toString()).toBe("-1.23");
    expect(new NRNumber("-1.23").neg().toString()).toBe("1.23");
  });
});

describe("abs", () => {
  it("returns the absolute value of a number", () => {
    expect(new NRNumber("1.23").abs().toString()).toBe("1.23");
    expect(new NRNumber("-1.23").abs().toString()).toBe("1.23");
  });
});

describe("inv", () => {
  it("inverts a number", () => {
    function t(a: NRRationalInput, r: string) {
      const nrn = new NRNumber(a);
      const originalStr = nrn.toString();
      const inverse = nrn.inv();
      expect(inverse.toString()).toBe(r);
      expect(inverse.inv().toString()).toBe(originalStr);
    }

    t("1.25", "0.8");
    t("-1.25", "-0.8");
    t("2.2", "0.45454545454545454545");

    // Borrowed from Bignumber.js
    t("1", "1");
    t("-45", "-0.02222222222222222222");
    t("22", "0.04545454545454545455");
    t("144", "0.00694444444444444444");
    t("6.1915", "0.16151174997981103125");
    t("-1.02", "-0.98039215686274509804");
    t("0.09", "11.11111111111111111111");
    t("-0.0001", "-10000");
    t("4.001", "0.24993751562109472632");
  });

  it("throws when inverting zero", () => {
    const zero = new NRNumber("0");
    expect(() => zero.inv()).toThrowError(DivisionByZeroError);
  });
});

describe.only("add", () => {
  it.only("adds two numbers", () => {
    function t(a: NRRationalInput, b: NRRationalInput, r: string) {
      expect(new NRNumber(a).add(b).toDecimalString({ maxDecimals: 47 })).toBe(
        r
      );
    }

    // t("0.1", "0.2", "0.3");
    // t("0.1", "-0.2", "-0.1");
    // t("0.1", "0.9", "1");
    // t(1, Number.EPSILON, "1.00000000000000022204460492503130808472633361816");

    // Borrowed Bignumber.js
    // t(1, "-1.02", "-0.02");
    // t(-0.01, "0.01", "0");
    // t("0.0000023432495704937", "-0.0000023432495704937", "0");
    // t("03.333", -4, "-0.667");
    t(43534.5435, "0.054645", "43534.598145");
    // t("-34", "1679140391.9", "1679140357.9");
    // t("-316537.13", "5.849231740", "-316531.28076826");
  });
});

describe("sub", () => {
  it("subtracts two numbers", () => {
    expect(new NRNumber("0.1").sub("0.2").toString()).toBe("-0.1");
    expect(new NRNumber("-0.1").sub("0.2").toString()).toBe("-0.3");
  });
});
