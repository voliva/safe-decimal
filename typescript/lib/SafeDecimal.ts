import { FormatOptions, toDecimalString, toNumber } from "./format";
import { abs, add, cmp, div, eq, inv, mul, neg, sub } from "./ops";
import { fromNumber, fromString } from "./parsing";
import { SafeFraction } from "./safeFraction";

export type SafeDecimalInput = SafeFraction | number | string;

export class SafeDecimal implements SafeFraction {
  public readonly n: number;
  public readonly d: number;

  public static from(input: SafeDecimalInput) {
    if (input instanceof SafeDecimal) {
      return input;
    }
    return new SafeDecimal(input);
  }

  constructor(input: SafeDecimalInput) {
    const value =
      typeof input === "object"
        ? input
        : typeof input === "string"
        ? fromString(input)
        : fromNumber(input);
    this.n = value.n;
    this.d = value.d;
  }

  public toString(options?: Partial<FormatOptions>) {
    return toDecimalString(this, options);
  }
  public toFractionString() {
    return `${this.n}/${this.d}`;
  }
  public toNumber() {
    return toNumber(this);
  }

  public inv() {
    const result = inv(this);
    if (!result) return null;
    return new SafeDecimal(result);
  }
  public abs() {
    return new SafeDecimal(abs(this));
  }
  public add(rhs: SafeDecimalInput) {
    return new SafeDecimal(add(this, SafeDecimal.from(rhs)));
  }
  public neg() {
    return new SafeDecimal(neg(this));
  }
  public sub(rhs: SafeDecimalInput) {
    return new SafeDecimal(sub(this, SafeDecimal.from(rhs)));
  }
  public mul(rhs: SafeDecimalInput) {
    return new SafeDecimal(mul(this, SafeDecimal.from(rhs)));
  }
  public div(rhs: SafeDecimalInput) {
    const result = div(this, SafeDecimal.from(rhs));
    if (!result) return null;
    return new SafeDecimal(result);
  }
  public cmp(rhs: SafeDecimalInput): -1 | 0 | 1 {
    return cmp(this, SafeDecimal.from(rhs));
  }
  public eq(rhs: SafeDecimalInput): boolean {
    return eq(this, SafeDecimal.from(rhs));
  }
}
