import { SafeFraction } from "./safeFraction";
import { reduceExponent, simplifyFactors } from "./simplify";

export function inv(value: SafeFraction): SafeFraction | null {
  if (value.n === 0) return null;

  if (value.n < 0) {
    return {
      n: -value.d,
      d: -value.n,
    };
  }
  return {
    n: value.d,
    d: value.n,
  };
}

export function abs(value: SafeFraction): SafeFraction {
  if (value.n < 0) {
    return {
      n: -value.d,
      d: value.n,
    };
  }
  return {
    ...value,
  };
}

export function add(value: SafeFraction, rhs: SafeFraction): SafeFraction {
  const [a, b] = simplifyFactors(value.d, rhs.d);
  const d = value.d * b;
  return reduceExponent({
    n: value.n * b + rhs.n * a,
    d,
  });
}

export function neg(value: SafeFraction): SafeFraction {
  return {
    n: -value.n,
    d: value.d,
  };
}

export function sub(value: SafeFraction, rhs: SafeFraction): SafeFraction {
  return add(value, neg(rhs));
}

export function mul(value: SafeFraction, rhs: SafeFraction): SafeFraction {
  const [valueNum, rhsDen] = simplifyFactors(value.n, rhs.d);
  const [rhsNum, valueDen] = simplifyFactors(rhs.n, value.d);

  return reduceExponent({
    n: valueNum * rhsNum,
    d: valueDen * rhsDen,
  });
}

export function div(
  value: SafeFraction,
  rhs: SafeFraction
): SafeFraction | null {
  const invRhs = inv(rhs);
  if (invRhs === null) return null;
  return mul(value, invRhs);
}

// Assumes number is reduced. -1 = a is bigger, 0 = both are equal, 1 = b is bigger.
export function cmp(a: SafeFraction, b: SafeFraction): -1 | 0 | 1 {
  return s_cmp(a.n * b.d, a.d * b.n);
}
function s_cmp(a: number, b: number): -1 | 0 | 1 {
  if (a === b) return 0;
  if (a > b) return -1;
  return 1;
}

export function eq(a: SafeFraction, b: SafeFraction): boolean {
  return cmp(a, b) === 0;
}
