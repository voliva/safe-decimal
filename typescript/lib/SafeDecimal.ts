import { abs, add, cmp, div, eq, inv, mul, neg, sub } from "./ops";
import { SafeFraction } from "./safeFraction";

export class SafeDecimal implements SafeFraction {
  public readonly n: number;
  public readonly d: number;

  constructor(input: SafeFraction) {
    this.n = input.n;
    this.d = input.d;
  }

  public inv() {
    const result = inv(this);
    if (!result) return null;
    return new SafeDecimal(result);
  }
  public abs() {
    return new SafeDecimal(abs(this));
  }
  public add(rhs: SafeFraction) {
    return new SafeDecimal(add(this, rhs));
  }
  public neg() {
    return new SafeDecimal(neg(this));
  }
  public sub(rhs: SafeFraction) {
    return new SafeDecimal(sub(this, rhs));
  }
  public mul(rhs: SafeFraction) {
    return new SafeDecimal(mul(this, rhs));
  }
  public div(rhs: SafeFraction) {
    const result = div(this, rhs);
    if (!result) return null;
    return new SafeDecimal(result);
  }
  public cmp(rhs: SafeFraction): -1 | 0 | 1 {
    return cmp(this, rhs);
  }
  public eq(rhs: SafeFraction): boolean {
    return eq(this, rhs);
  }
}
