import { Rounding } from "../common";
import {
  abs,
  add,
  cmp,
  cos,
  div,
  exp,
  inv,
  log,
  log10,
  log2,
  mul,
  neg,
  pow,
  sin,
  sub,
  tan,
} from "./functions";
import { NRRational } from "./NRRational";
import { fromInput, NRRationalInput } from "./parser";
import {
  toDecimalString,
  toFixed,
  toFractionString,
  toNumber,
} from "./serializer";

// Stands for No recurring number
export class NRNumber implements NRRational {
  public readonly d: number;
  public readonly n: number;

  constructor(input: NRRationalInput) {
    const safeNumber = fromInput(input);
    this.d = safeNumber.d;
    this.n = safeNumber.n;
  }

  public toNumber() {
    return toNumber(this);
  }

  public toDecimalString(options?: {
    radix?: number;
    maxDecimals?: number;
    rounding?: Rounding;
  }) {
    return toDecimalString(this, options);
  }
  public toFractionString(radix?: number) {
    return toFractionString(this, radix);
  }
  public toString(radix?: number) {
    return this.toDecimalString({ radix });
  }
  public toFixed(
    decimals: number,
    options?: { radix?: number; rounding?: Rounding }
  ) {
    return toFixed(this, decimals, options);
  }

  public neg() {
    return new NRNumber(neg(this));
  }
  public abs() {
    return new NRNumber(abs(this));
  }
  public inv() {
    return new NRNumber(inv(this));
  }
  public add(b: NRRationalInput) {
    return new NRNumber(add(this, fromInput(b)));
  }
  public sub(b: NRRationalInput) {
    return new NRNumber(sub(this, fromInput(b)));
  }
  public mul(b: NRRationalInput) {
    return new NRNumber(mul(this, fromInput(b)));
  }
  public div(b: NRRationalInput) {
    return new NRNumber(div(this, fromInput(b)));
  }

  // Functions that can result in irrational numbers: Meaning precision is not guaranteed on these ones.
  public log() {
    return new NRNumber(log(this));
  }
  public log10() {
    return new NRNumber(log10(this));
  }
  public log2() {
    return new NRNumber(log2(this));
  }

  // The following perform the division before, so precision can be lost before running the function
  public sin() {
    return new NRNumber(sin(this));
  }
  public cos() {
    return new NRNumber(cos(this));
  }
  public tan() {
    return new NRNumber(tan(this));
  }
  public exp() {
    return new NRNumber(exp(this));
  }
  public pow(b: NRRationalInput) {
    return new NRNumber(pow(this, fromInput(b)));
  }

  // Assumes number is reduced. -1 = a is bigger, 0 = both are equal, 1 = b is bigger.
  public cmp(b: NRRationalInput) {
    return cmp(this, fromInput(b));
  }
}

export const ZERO = new NRNumber(0);
export const ONE = new NRNumber(1);
// TODO precalculate - fromNumber could be expensive
export const PI = new NRNumber(Math.PI);
export const E = new NRNumber(Math.E);
