import { SafeDecimal, SafeDecimalInput } from "./SafeDecimal";
import { describe, it, expect } from "vitest";

describe("neg", () => {
  it("negates a value", () => {
    expect(new SafeDecimal("1.23").neg().toString()).toBe("-1.23");
    expect(new SafeDecimal("-1.23").neg().toString()).toBe("1.23");
  });
});

describe("abs", () => {
  it("returns the absolute value of a number", () => {
    expect(new SafeDecimal("1.23").abs().toString()).toBe("1.23");
    expect(new SafeDecimal("-1.23").abs().toString()).toBe("1.23");
  });
});

describe("inv", () => {
  it("inverts a number", () => {
    function t(a: SafeDecimalInput, r: string) {
      const nrn = new SafeDecimal(a);
      const originalStr = nrn.toString();
      const inverse = nrn.inv()!;
      expect(inverse.toString({ maxDecimals: 20 })).toBe(r);
      expect(inverse.inv()!.toString({ maxDecimals: 20 })).toBe(originalStr);
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

  it("returns null when inverting zero", () => {
    const zero = new SafeDecimal("0");
    expect(zero.inv()).toBe(null);
  });
});

describe("add", () => {
  it("adds two numbers", () => {
    function t(a: SafeDecimalInput, b: SafeDecimalInput, r: string) {
      expect(new SafeDecimal(a).add(b).toString({ maxDecimals: 47 })).toBe(r);
    }

    t(0.1, 0.2, "0.3");
    t("0.1", "0.2", "0.3");
    t("0.1", "-0.2", "-0.1");
    t("0.1", "0.9", "1");
    t(1, Number.EPSILON, "1.00000000000000022204460492503130808472633361816");

    // Borrowed Bignumber.js
    t(1, "-1.02", "-0.02");
    t(-0.01, "0.01", "0");
    t("0.0000023432495704937", "-0.0000023432495704937", "0");
    t("03.333", -4, "-0.667");
    // On BigNumber.js 43534.5435 is passed as a regular number. However, the number has loss of precision which causes an incorrect result.
    t("43534.5435", "0.054645", "43534.598145");
    t("-34", "1679140391.9", "1679140357.9");
    t("-316537.13", "5.849231740", "-316531.28076826");
  });
});

describe("sub", () => {
  it("subtracts two numbers", () => {
    expect(new SafeDecimal("0.1").sub("0.2").toString()).toBe("-0.1");
    expect(new SafeDecimal("-0.1").sub("0.2").toString()).toBe("-0.3");
  });
});
