export enum Rounding {
  Up = "up",
  Down = "down",
  Ceil = "ceil",
  Floor = "floor",
  Even = "even",
  HalfUp = "half-up",
  HalfDown = "half-down",
  HalfCeil = "half-ceil",
  HalfFloor = "half-floor",
  HalfEven = "half-even",
}

export class DivisionByZeroError extends Error {}
export class NegativeRootError extends Error {}
