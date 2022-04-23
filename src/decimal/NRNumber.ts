import { Rounding } from "../common";
import {
  abs,
  add,
  cmp,
  cos,
  div,
  exp,
  fromDecimalString,
  fromNumber,
  inv,
  log,
  log10,
  log2,
  mul,
  neg,
  pow,
  SafeNumber,
  sin,
  sub,
  tan,
  toDecimalString,
  toFixed,
  toFractionString,
  toNumber,
} from "./functions";

export type SafeNumberInput = SafeNumber | string | number;
function fromInput(input: SafeNumberInput): SafeNumber {
  if (typeof input === "object") {
    return input;
  }
  if (typeof input === "string") {
    return fromDecimalString(input);
  }
  return fromNumber(input);
}

// Stands for No recurring number
export class NRN implements SafeNumber {
  public readonly d: number;
  public readonly n: number;

  constructor(input: SafeNumberInput) {
    const safeNumber = fromInput(input);
    this.d = safeNumber.d;
    this.n = safeNumber.n;

    // This one avoids creating a new object
    // Not recommended through https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/setPrototypeOf
    // const safeNumber: any = fromInput(input);
    // Object.setPrototypeOf(safeNumber, NRN.prototype);
    // return safeNumber;
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
    return new NRN(neg(this));
  }
  public abs() {
    return new NRN(abs(this));
  }
  public inv() {
    return new NRN(inv(this));
  }
  public add(b: SafeNumberInput) {
    return new NRN(add(this, fromInput(b)));
  }
  public sub(b: SafeNumberInput) {
    return new NRN(sub(this, fromInput(b)));
  }
  public mul(b: SafeNumberInput) {
    return new NRN(mul(this, fromInput(b)));
  }
  public div(b: SafeNumberInput) {
    return new NRN(div(this, fromInput(b)));
  }

  // Functions that can result in irrational numbers: Meaning precision is not guaranteed on these ones.
  public log() {
    return new NRN(log(this));
  }
  public log10() {
    return new NRN(log10(this));
  }
  public log2() {
    return new NRN(log2(this));
  }

  // The following perform the division before, so precision can be lost before running the function
  public sin() {
    return new NRN(sin(this));
  }
  public cos() {
    return new NRN(cos(this));
  }
  public tan() {
    return new NRN(tan(this));
  }
  public exp() {
    return new NRN(exp(this));
  }
  public pow(b: SafeNumberInput) {
    return new NRN(pow(this, fromInput(b)));
  }

  // Assumes number is reduced. -1 = a is bigger, 0 = both are equal, 1 = b is bigger.
  public cmp(b: SafeNumberInput) {
    return cmp(this, fromInput(b));
  }
}

export const ZERO = new NRN(0);
export const ONE = new NRN(1);
export const PI = new NRN(Math.PI);
export const E = new NRN(Math.E);
