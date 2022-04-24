# Non-recurring Decimals

Library that solves the `0.1 + 0.2 != 0.3` problem with fractions, to avoid using numbers with recurring decimals.

WIP - This package is not exporting anything yet.

## Usage

TODO

## Explanation

Warning: long section ahead, it covers the theory behind this library.

Currently there's a common misconception that `0.1 + 0.2 != 0.3` in JavaScript is due to the fact that it uses floating point numbers.

However, that's not exactly right. Although it's true that `0.1`, `0.2` and `0.3` (and infinite many others) can't be represented accurately in JavaScript, it's not because it uses floating points. The reason is that when these numbers are represented as binary decimals, they have recurring decimals that at some point need to be cut off, which result in a slightly different value than the one intended. Floating points in JS have a mantissa of 52 bits, so past those binary decimals all information for that number is lost.

Let's remember what are decimals exactly. In base 10, when you have a number for instance `12.34`, what this is actually representing is:

```
10^1 10^0 . 10^-1 10^-2
 1    2   .   3     4

(1 x 10) + (2 * 1) + (3 / 10) + (4 / 100) = 12.34
```

The decimal representation only means a sum of values, where every position is just a different factor on base 10.

Starting from the decimal separator, to the left side they keep raising 10^n - The first value is the units (10^0), the second value is the tens (10^1), the third value is the hundreds (10^100) and so on.

And from the decimal separator to the right side, it's the opposite: it divides them by each power of ten. So the first digit is multiplied by 1/10, the second digit is multiplied by 1/100, and so on.

So `0.1` is just the decimal representation in base 10 of the fraction `1/10`. `0.2` is the decimal representation of the fraction `2/10` which can be simplified to `1/5`, and `0.3` is the decimal representation of `3/10`.

We can use the same definition of decimals but applied to base 2, which is the base that computers use, to understand the problem. As an example let's first transform `5.3125` to binary. To transform the decimals, we will use an algorithm that's quite simple: to get the next decimal, you multiply the value by the base (2), and extract the unit value from the result. The algorithm ends when the value reaches 0.

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

`5.3125` in decimal is the same as `101.0101` in binary. Note that although it's still a decimal, precision won't be lost as long as our mantissa is longer than the number of decimals the number has.

However, if we try to represent `0.3` in binary, we find ourselves in a loop when running the algorithm above:

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
// And it will keep going on forever, the value will never be 0.

0.3 = 1/2 + 1/32 + 1/64 + 1/512 + ...

2^0 . 2^-1 2^-2 2^-3 2^-4 2^-5 2^-6 2^-7 ...
0   .  0     1    0    0    1    1   0 ...
```

So `0.3` in base 10 is `0.01001100110011001...` with 1001 recurring in base 2. And now we have a problem, because JS floats have a mantissa of 52 bits, which is really long, but it can only fit the first 52 digits out of the infinite many others.

But the same would happen if we were to use fixed point notation - The difference between fixed point and floating point is that with floating point is like scientific notation: Some bits are reserved for the exponent, and the rest is the mantissa, essentially moving the decimal point up or down through the mantissa. On the other hand, Fixed point you have a specific number of bits for the integer part, and a specific number of bits for the decimals, so you still have to cut the decimal at some point or another. When working with these decimals, the only solution would be to have an infinite amount of bits to store all those decimals, something that's currently not possible<sup>[Citation Needed]</sup>.

This raises a question: What decimals are representable in base 2 without loss of precision? Any rational number whose denominator is a power of 2. The example I picked earlier `5.3125` is the rational number `85 / 16`, so it's representable as a decimal base 2 without loss of precision.

For this reason, `1/10`, `1/5` and `3/10` have recurring decimals in base 2: They all have `5` as factor on the denominator, but they are representable in base 10 without recurring numbers, because base 10 allows factors `2` and `5`. However, if one of the factors were any other prime number, then you will get recurring decimals in base 10, e.g. `1/3 = 0.3333..., 22/9 = 2.4444..., 1/7 = 0.142857142857...., 38/15 = 2.5333...`

Note that if computers were to work in base 3 instead of base 2, then `1/3` and `22/9` would be numbers that wouldn't have precision issues, but would have in base 10: In base 3 `1/3` is just `0.1`, and `22/9` is `2.11`.

A common way of fixing this is to avoid decimals altogether, usually multiplying these numbers by powers of 10. For instance, applications that work with numbers that are usually divided into hundreds (e.g. currencies with cents as division) store numeric values as "number of cents", essentially multiplying every value by 100.

One of the utilities that this package exports `RationalNumber` is a generalization of this solution, so that it works for any decimal, not only the ones with a specific division (e.g. by 100).

With rational numbers, instead of storing a single decimal number, you store two integers (e.g. `0.2 = 1/5, 0.25 = 1/4, 3.33.. = 10/3, etc.`. And then every operation is just operation with rationals, which comes down to integer operations. When you want to get the actual value, you perform the division.

As mentioned, this is a just generalization of the "Multiply everything by a power of 10". In the case when working with currencies with cents, when you have a variable `cost = 335` this is actually representing the rational number `335 / 100 = 3.35`. In this case though, `RationalNumber` would internally represent this fraction as the simplified form `67 / 20`, because it's generalized to accept any fraction, not only the ones with denominator 100.

These `RationalNumber` have true arbitrary precision, because as they are integers, they can be stored as bigints. However, operations with rational numbers are significantly more expensive than just doing it with numbers directly (e.g. to add two rational numbers you need to run the Euclidean algorithm to find the least common multiple of the denominators), and if these bigints keep growing the operation gets even more expensive.

Most of the time though, you don't really need arbitrary precision - What really matters is the top N most significant digits (with floats it's 52 bits, which is plenty), so the main export of this package is a set of utilities that avoid recurring decimals but still work as floats, so there's really no danger of the inner values getting bigger and bigger.

Essentially, it's like a rational number but where both numerator and denominator are decimals, but "Safe decimals". Those that can be represented in base 2 without recurring decimals.

In the case of the previous example of 3.35, without the constraint of integers, the fraction `67 / 20` becomes `16.75 / 5`. `16.75` is still representable in binary, it's `10000.11`, so no precision is lost - no mathematical error happens. When we need to get the _actual_ result 3.35, we can compute it and write it as base 10 string without losing any precision at all, and we don't need to work with bigints, which they are really not necessary because we're working with numbers with less than 52 significant digits.

As another example, let's do the operation `0.3333…/0.1`, and see what inner values does the library have:

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