---
title: Solving the "floating point precision" problem with... floats?
published: false
description: This article explores a different way of solving the error when adding two decimal numbers, by representing them into "safe versions" of a ratio between two floats.
tags: floats, arithmetic, rust, javascript
# cover_image: https://direct_url_to_image.jpg
# Use a ratio of 100:42 for best results.
# published_at: 2023-05-17 22:12 +0000
---

## The problem

There's a known problem when working with numbers on computers: `0.1 + 0.2 != 0.3`. There are many solutions that deal with this issue, but I would like to take a step back, understand why it happens, and look if it can be solved in a different way.

There's a common misconception that this problem is due to the fact that computers represent decimal numbers in a floating point format, and that it would be easily solved if computers used fixed point instead.

However, that's not exactly right. In fact, fixed point numbers usually have less precision than floating point numbers, so in most of the cases it would even have a bigger error.

The actual reason is that `0.1` and `0.2` are decimal numbers which have recurring decimals when represented in base 2. So when the computer tries to parse this numbers into a variable of a finite length, at some point it needs to cut off those decimals which results in a loss of precision.

Base 10 also has the same problem, but we just take it for granted. How do you represent 1/3 in base 10? 0.3333... at some point you need to cut off. How do you represent 1/7 in base 10? 0.1428... and you also lose some precision when cutting it off before running out of paper.

Floating point only means that the decimal point is moved along those bits, and it stores the original position by an exponent. In essence, floating point numbers store the number in scientific notation.

Fixed point on the other hand it reserves some space for the integer part, and some space for the decimal part, but that doesn't solve this problem.

Let's work in base 10 to make this more familiar. And let's imagine our variable only has space for 8 characters.

With 8 characters, I could define a floating point format where I have 1 character to store the exponent and 7 to store the significant. With this I can represent 1/3 as `[-1,3,3,3,3,3,3,3] = 3.333333 * 10 ^ -1` or 1/7 as `[-1,1,4,2,8,5,7,1] = 1.428571 * 10 ^ -1`.

On the other hand, a usual practice when working with fixed point is to have half the bits for the integer part, and half the bits for the fractional part. So 1/3 would get represented as `[0,0,0,0,3,3,3,3] = 0.3333` and 1/7 as `[0,0,0,0,1,4,2,8] = 0.1428`.

As you can see, by moving from floating point to fixed point, we lost 2 digits of precision. I know, you could reserve more space for the decimal part on the fixed point format, but then you lose range on the integer part, whereas on floating point with the current format it can go all the way from 10^-4 up to 10^5.

## Decimals in depth

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

We can use the same definition of decimals but applied to base 2, which is the base that computers use. As an example let's first transform `5.3125` to binary. To transform the decimals, we will use an algorithm that's quite simple: to get the next decimal, you multiply the value by the base (2), and extract the unit value from the result. The algorithm ends when the value reaches 0.

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

`5.3125` in base 10 is represented as `101.0101` in binary, and the result is exact.

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

So `0.3` in base 10 is `0.01001100110011001...` with 1001 recurring in base 2. And now we have a problem, because double precision floats have a mantissa of 52 bits, which is really long, but it can only fit the first 52 digits out of the infinite many others.

Note how the amount of decimals or the precision of floats doesn't have a play in here. `5.3125` has more decimal digits than `0.3` in base 10, but `5.3125` can be represented exactly in base 2 (it only has 4 binary decimals) whereas `0.3` can't because it has infinite many binary decimals.

> You might be asking "How come if 0.3 isn't representable as a binary number, computers can still print it after storing it to a variable?" As part of transforming a number to a string they just apply some rounding up to some decimals, which depends on the implementation. So even though 0.3 becomes `0.2999999999999999888977697537...` when represented as a double precision float, when it's printed out it's rounded to "0.3". It happens that when adding `0.1 + 0.2` it's adding two slightly larger numbers, and that results with a value slightly larger than 0.3 that doesn't get rounded to "0.3".

This raises a question: What makes a number have a finite amount of decimals for a given a base? The answer is any rational number that has a denominator composed with factors from the base.

As an example, in base 10, all numbers that have a denominator composed only by 2 and 5 (which are the factors of 10) will be represented: 4/10 = 0.4, 1/5 = 0.2, 1/25 = 0.04 and so on. But any that has any other prime factor in the denominator will have infinite many decimals: 4/30 = 0.1333..., 8/18 = 0.444...

For this reason, `1/10`, `1/5` and `3/10` have recurring decimals in base 2: They all have `5` as factor on the denominator. `5.3125` on the other hand doesn't have any recurring decimal, because it's `85 / 16`, and 16 is a power of 2.

It just happens that we're used to write 0.1 as a convenient way of writing 1/10. If we used base 12 instead, then 0.1 would mean 1/12 which in decimal would be 0.08333... not representable with a finite amount of decimals either.

## Common solutions

### Multiplying by 100

A common way of fixing this is to avoid decimals altogether, usually multiplying these numbers by powers of 10. For instance, applications that work with numbers that are usually divided into hundreds (e.g. currencies with cents as division) store numeric values as "number of cents", essentially multiplying every value by 100. This is actually fixed point arithmetic, but applied before parsing it into binary, reserving 2 base-10 digits as decimal part.

However, when doing this you lose on flexibility. It works really well if all you have to do is add up numbers and you know all of them will have a specific amount of digits on base 10.

But this won't work if you deal with numbers with an arbitrary amount of decimals, or if you have to divide, where you can very easily lose precision. And also it makes multiplication trickier.

### Increasing amount of bits + rounding

Another common way of solving this is by using a really big amount of decimal places, coupled with some rounding to have less chance of having this error show up.

This is used by many libraries such as BigDecimal, BigNumber, etc. and most of the time it works. However, it's still not guaranteed, and sometimes you want to apply some custom rounding which can get wrong values (e.g. doing a Rounding.CEIL on a number that became 0.30000...00001 will give you 0.31), plus internally these libraries use BigInts which can become slow as the number keeps growing larger.

### Rational numbers

Another alternative is to use a library that represents numbers as rational numbers. These store two integer values a/b and then apply all operations by using basic arithmetic rules on rational numbers.

However, these ones have the problem that as the numbers keep getting more and more complex, both integers 'a' and 'b' keep growing and growing, which can easily cause an overflow. Some libraries mitigate this by using BigInt, but then again they become expensive to do computations (and they have to calculate gcd every time you do any operation to keep them as small as possible).

## What if...

What if we were to use floats instead? But avoiding any kind of value which is not representable in base 2. We would get faster calculations than when using BigInts, while eliminating the original issue and being absolutely flexible on what numbers you can operate with.

But how can we avoid storing values not representable in base 2? By taking inspiration from Rational numbers!

The idea then is to define a numeric format where we have two numbers 'a' and 'b', but that those in turn are floats. The only restriction is that both 'a' and 'b' must be numbers that are representable in base 2, what I will call "safe numbers" in short.

For example, 3.35 is not representable in binary in exact form. But we can transform this number to a pair `a / b = 5.234375 / 1.5625 = 3.35` where both a and b don't have any recurring decimal when represented in base 2: `5.234375 -> 101.001111` and `1.5625 -> 1.1001`.

This has the advantage vs Rational numbers that we can keep both a and b relatively small. By the point we start to lose precision it will be because we've reached the precision limit that we have, but because of the nature of floats only the least significant digits would be lost. In the case of rational numbers, those numbers can overflow which result in a completely different number.

And once we're in the land of "safe numbers", we can add, subtract and multiply these numbers resulting in more "safe numbers". The only operation which isn't safe is division, but we don't need that. If someone needs to divide two numbers `a/b` and `c/d`, it's the same as inverting `c/d -> d/c` then multiplying `a/b * d/c = (a*d)/(b*c)`.
