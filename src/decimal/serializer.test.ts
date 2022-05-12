import { Rounding } from "../common";
import { NRNumber } from "./NRNumber";

describe("toNumber", () => {
  it("gives the result of the fraction as a number", () => {
    expect(new NRNumber({ n: 1, d: 5 }).toNumber()).toBe(0.2);
  });
});

describe("toFractionString", () => {
  it("gives the result as a fraction of two numbers", () => {
    expect(new NRNumber({ n: 1, d: 5.25 }).toFractionString()).toBe("1/5.25");
  });
});

describe.skip("toRational", () => {
  it("gives the result as a rational number", () => {});
});

describe("toDecimalString", () => {
  describe("serializes to strings", () => {
    it("defaults to base 10 strings", () => {
      expect(new NRNumber(98.76).toDecimalString()).toBe("98.76");
    });

    it("defaults to 20 decimals", () => {
      expect(new NRNumber(10).div(3).toDecimalString()).toBe(
        "3.33333333333333333333"
      );
    });

    it("defaults to rounding half-ceil", () => {
      expect(new NRNumber("1.5").toDecimalString({ maxDecimals: 0 })).toBe("2");
    });

    it("writes numbers in base 16", () => {
      expect(new NRNumber(12.125).toDecimalString({ radix: 16 })).toBe("c.2");
    });

    it("writes numbers in base 2", () => {
      expect(new NRNumber(12.125).toDecimalString({ radix: 2 })).toBe(
        "1100.001"
      );
    });
  });

  describe("rounding modes", () => {
    function roundNum(input: string, rounding: Rounding) {
      return new NRNumber(input).toDecimalString({
        maxDecimals: 2,
        rounding,
      });
    }
    function checkRounding(rounding: Rounding, input: string, output: string) {
      expect(roundNum(input, rounding)).toBe(output);
    }

    it("rounds up (away from zero)", () => {
      checkRounding(Rounding.Up, "0.010", "0.01");
      checkRounding(Rounding.Up, "0.035", "0.04");
      checkRounding(Rounding.Up, "0.0600001", "0.07");
      checkRounding(Rounding.Up, "0.0999999", "0.1");
      checkRounding(Rounding.Up, "1.9999999", "2");

      checkRounding(Rounding.Up, "-0.010", "-0.01");
      checkRounding(Rounding.Up, "-0.035", "-0.04");
      checkRounding(Rounding.Up, "-0.0600001", "-0.07");
      checkRounding(Rounding.Up, "-0.0999999", "-0.1");
      checkRounding(Rounding.Up, "-1.9999999", "-2");
    });

    it("rounds down (towards zero)", () => {
      checkRounding(Rounding.Down, "0.010", "0.01");
      checkRounding(Rounding.Down, "0.035", "0.03");
      checkRounding(Rounding.Down, "0.061", "0.06");
      checkRounding(Rounding.Down, "0.0099999", "0");

      checkRounding(Rounding.Down, "-0.010", "-0.01");
      checkRounding(Rounding.Down, "-0.035", "-0.03");
      checkRounding(Rounding.Down, "-0.061", "-0.06");
      checkRounding(Rounding.Down, "-0.0099999", "0");
    });

    it("rounds ceil (towards +infinity)", () => {
      checkRounding(Rounding.Ceil, "0.010", "0.01");
      checkRounding(Rounding.Ceil, "0.035", "0.04");
      checkRounding(Rounding.Ceil, "0.0600001", "0.07");
      checkRounding(Rounding.Ceil, "0.0999999", "0.1");
      checkRounding(Rounding.Ceil, "1.9999999", "2");

      checkRounding(Rounding.Ceil, "-0.010", "-0.01");
      checkRounding(Rounding.Ceil, "-0.035", "-0.03");
      checkRounding(Rounding.Ceil, "-0.0600001", "-0.06");
      checkRounding(Rounding.Ceil, "-0.0999999", "-0.09");
      checkRounding(Rounding.Ceil, "-1.9999999", "-1.99");
    });

    it("rounds floor (away from +infinity)", () => {
      checkRounding(Rounding.Floor, "0.010", "0.01");
      checkRounding(Rounding.Floor, "0.035", "0.03");
      checkRounding(Rounding.Floor, "0.061", "0.06");
      checkRounding(Rounding.Floor, "0.0099999", "0");

      checkRounding(Rounding.Floor, "-0.010", "-0.01");
      checkRounding(Rounding.Floor, "-0.035", "-0.04");
      checkRounding(Rounding.Floor, "-0.061", "-0.07");
      checkRounding(Rounding.Floor, "-0.0099999", "-0.01");
    });

    it("rounds towards the even number", () => {
      checkRounding(Rounding.Even, "0.010", "0.01");
      checkRounding(Rounding.Even, "0.011", "0.02");
      checkRounding(Rounding.Even, "0.009", "0");

      checkRounding(Rounding.Even, "-0.110", "-0.11");
      checkRounding(Rounding.Even, "-0.111", "-0.12");
      checkRounding(Rounding.Even, "-0.109", "-0.1");
    });

    function checkNearest(rounding: Rounding) {
      checkRounding(rounding, "0.0149", "0.01");
      checkRounding(rounding, "0.0151", "0.02");
      checkRounding(rounding, "-0.0151", "-0.02");
      checkRounding(rounding, "-0.0149", "-0.01");
    }
    const halves = [
      [Rounding.HalfUp, Rounding.Up],
      [Rounding.HalfDown, Rounding.Down],
      [Rounding.HalfCeil, Rounding.Ceil],
      [Rounding.HalfFloor, Rounding.Floor],
      [Rounding.HalfEven, Rounding.Even],
    ];
    halves.forEach(([rounding]) =>
      it(`${rounding} rounds towards the nearest number`, () =>
        checkNearest(rounding))
    );

    function checkHalf(rounding: Rounding, eqRounding: Rounding) {
      checkRounding(rounding, "0.015", roundNum("0.015", eqRounding));
      checkRounding(rounding, "-0.015", roundNum("-0.015", eqRounding));
    }
    halves.forEach(([rounding, eqRounding]) =>
      it(`${rounding} rounds towards the nearest number`, () =>
        checkHalf(rounding, eqRounding))
    );
  });
});
