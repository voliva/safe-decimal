import { DivisionByZeroError } from "../common";
import { NRNumber } from "./NRNumber";

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

// TODO add tests that should pass in here but fail on BigNumber
describe("inv", () => {
  it("inverts a number", () => {
    expect(new NRNumber("1.25").inv().toString()).toBe("0.8");
    expect(new NRNumber("0.8").inv().toString()).toBe("1.25");

    expect(new NRNumber("-1.25").inv().toString()).toBe("-0.8");
  });

  it("throws when inverting zero", () => {
    const zero = new NRNumber("0");
    expect(() => zero.inv()).toThrowError(DivisionByZeroError);
  });
});

describe("add", () => {
  it("adds two numbers", () => {
    expect(new NRNumber("0.1").add("0.2").toString()).toBe("0.3");
    expect(new NRNumber("0.1").add("-0.2").toString()).toBe("-0.1");
    expect(new NRNumber("0.1").add("0.9").toString()).toBe("1");
  });
});

describe("sub", () => {
  it("subtracts two numbers", () => {
    expect(new NRNumber("0.1").sub("0.2").toString()).toBe("-0.1");
    expect(new NRNumber("-0.1").sub("0.2").toString()).toBe("-0.3");
  });
});
