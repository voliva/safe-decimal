# Non-recurring Decimals

Library that solves the `0.1 + 0.2 != 0.3` problem, that uses fractions to avoid using numbers with recurring decimals.

WIP - This package is not exporting anything yet.

## Usage

TODO

## Explanation

Warning: long section ahead, it covers the theory behind this library.

Currently there's a common misconception that the fact that `0.1 + 0.2 != 0.3` in JavaScript is due to the fact that it uses floating point numbers.

However, that's not exactly right. It's true that `0.1`, `0.2` and `0.3` (and infinite many others) can't be represented accurately in JavaScript, but it's not due to floating point. The problem is that when these numbers are represented as binary decimals, they have recurring decimals that at some point need to be cut off. Floating points in JS has a mantissa of 52 bits, so past those binary decimals information is lost.

Let's remember what are decimals exactly. In base 10, when you have a number for instance `12.34`, what this actually means is:

```
10^1 10^0 . 10^-1 10^-2
 1    2   .   3     4

(1 x 10) + (2 * 1) + (3 / 10) + (4 / 100)
```

it's actually just a sum of values, where every position has just a different factor on base 10.

Starting from the comma, to the left side they keep raising 10^n - The first value is the units (10^0), the second value is the tens (10^1), the third value is the hundreds (10^100) and so on.

And from the comma to the right side, it's the opposite: it divides by each power of ten. So the first digit is multiplied by 1/10, the second digit is multiplied by 1/100, and so on.

Then `0.1` is just the decimal representation of the fraction `1/10` in base 10. `0.2` is the decimal representation of the fraction `2/10` which can be simplified to `1/5`, and `0.3` is the decimal representation of `3/10`.

We can use this definition of a decimal representation for base 2, which is the base that computers use. Let's represent `5.3125`. To transform the decimals, we will use an algorithm that's quite simple: to get the next decimal, you multiply the value by the base (2), and extract the unit value from the result. The algorithm ends when the value reaches 0.

```
5.3125 = 5 + 0.3125;

2^-1 -> 0.3125 * 2 = 0.625 -> [0]
2^-2 -> 0.625 * 2  = 1.25  -> [1]
2^-3 -> 0.25 * 2   = 0.5   -> [0]
2^-4 -> 0.5 * 2    = 1     -> [1]
// We're done, no more decimals

5.3125 = 4 + 1 + 1/4 + 1/16

2^2 2^1 2^0 . 2^-1 2^-2 2^-3 2^-4
 1   0   1  .  0    1    0    1
```

`5.3125` in decimal is the same as `101.0101` in binary, and no precision is lost.

However, when we try to represent e.g. `0.3` in binary, we find ourselves in a loop when running the algorithm above:

```
2^-1 -> 0.3 * 2 = 0.6 -> [0]
2^-2 -> 0.6 * 2 = 1.2 -> [1]
2^-3 -> 0.2 * 2 = 0.4 -> [0]
2^-4 -> 0.4 * 2 = 0.8 -> [0]
2^-5 -> 0.8 * 2 = 1.6 -> [1]
// This is now repeating from 2^-2
2^-6 -> 0.6 * 2 = 1.2 -> [1]
2^-7 -> 0.2 * 2 = 0.4 -> [0]
...
// And it will keep going on forever

0.3 = 1/2 + 1/32 + 1/64 + 1/512 + ...

2^0 . 2^-1 2^-2 2^-3 2^-4 2^-5 2^-6 2^-7 ...
0   .  0     1    0    0    1    1   0 ...
```

So `0.3` in decimal is `0.01001100110011001...` with 1001 recurring. And now we have a problem, because JS floats have a mantissa of 52 bits, which is really long, but because it has to cut, there's precision that gets lost. But the same would happen if you use fixed point - With fixed point representation you still have decimals, with the difference that the position of the comma within your number is set beforehand, it's fixed in position. But you still cut the decimal at some point or another.

So what decimals are representable in base 2 without loss of precision? Any rational number whose denominator is a power of 2. The example I picked earlier `5.3125` is the rational number `85 / 16`, so it's representable as a decimal base 2 without loss of precision.

For this reason, `1/10`, `1/5` and `3/10` are not representable in base 2 without losing some detail, but they are representable in base 10 without recurring numbers. However, if one of the factors of the denominator of a simplified fraction is not `2` or `5` (which are the factors of the value of the base - 10), then you get recurring decimals, e.g. `1/3 = 0.3333..., 22/9 = 2.4444..., 1/7 = 0.142857142857...., 38/15 = 2.5333...`

Note that if computers were to work in base 3 instead of base 2, then `1/3` and `4/9` would be numbers that wouldn't have precision issues in computers, but would have in base 10: `1/3` is just `0.1` in base 3, and `22/9` is `2.11`.

A common way of fixing this is to multiply these numbers by 10 until they are integers. For instance, applications that work with numbers that are divisible by 100 (e.g. any shopping site that uses USD or EUR) store numeric values as "number of cents", essentially multiplying every value by 100 getting rid of all decimals. However, in order to avoid dealing with recurring decimal issues, it's not necessary to multiply by 100. Multiplying the decimal values by 25 instead would suffice, because we eliminate the two 5 factors in the denominator, and every number, even if it's still a float, it would always be representable in base 2 without recurring decimals.

One of the utilities that this package exports `RationalNumber` is a generalization of this solution, so that it works for any decimal, not only the ones with a specific division (e.g. by 100).

With rational numbers, instead of storing a single decimal number, you store two integers (e.g. `0.2 = 1/5, 0.25 = 1/4, 3.33.. = 10/3, etc.`. And then every operation is just operation with rationals, which comes down to integer operations. When you want to get the actual value, you perform the division.

These `RationalNumber` have true arbitrary precision, because as they are integers, they can be stored as bigints. However, operations with rational numbers are significantly more expensive than just doing it with numbers directly (e.g. to add two rational numbers you need to run the Euclidean algorithm to find the least common multiple of the denominators), and if these bigints keep growing the operation gets even more expensive.

Most of the time though, you don't really need arbitrary precision - What really matters is the top N most significant digits (with floats it's 52 bits, which is plenty), so the main export of this package is a set of utilities that avoid recurring decimals but still work as floats, so there's really no danger of the inner values getting bigger and bigger.

Essentially, it's like a rational number but where both numerator and denominator are decimals, but "Safe decimals". Those that can be represented in base 2 without recurring decimals.

As an example, let's do the operation `0.3333…/0.1`, and see what inner values does the library have:

```ts
const aThird = new NRNumber(1).div(3); // or new NRNumber({n: 1, d: 3})
console.log(aThird); // { n: 1, d: 3 }

const zeroOne = new NRNumber("0.1");
console.log(zeroOne); // { n: 0.5, d: 5 }

const division = aThird.div(zeroOne);
console.log(division); // { n: 5, d: 1.5 }
// Note: dividing rational numbers a / b
// numerator   = a.numerator * b.denominator; 1 * 5 = 5
// denominator = a.denominator * b.numerator; 3 * 0.5 = 1.5
console.log(division.toDecimalString()); // 3.33333333333333333333
```

This way it has the best of both worlds: One one side, all operations are really optimized (and can work with runtimes that don't support BigInt - As of this writing (early 2022), ReactNative on Android doesn't). On the other hand, there's zero risk of getting operation errors due to recurring numbers.

## License

MIT

Copyright 2022 Víctor Oliva

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.