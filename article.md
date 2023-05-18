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

There's a known problem when working with numbers on computers:

```
0.1 + 0.2 != 0.3
```

It usually shows up when you less expect it, often when you get a result which breaks your beautiful UI with a big `0.30000000000000004` showing up.

There are many solutions that deal with this issue, but I would like to take a step back, understand why it happens, and look if it can be solved in a different way.

There's a common misconception that this problem is due to the fact that computers represent decimal numbers in a floating point format, and that it would be easily solved if computers used fixed point instead.

However, that's not exactly right. In fact, fixed point numbers usually have less precision than floating point numbers, so in most of the cases it would even have a bigger error.

To understand this better, first we need to remember what are decimals

## Decimals in depth

In base 10, when you have a number for instance `12.34`, what this is actually representing is:

```
 1    2   .   3     4
10^1 10^0 . 10^-1 10^-2

(1 * 10) + (2 * 1) + (3 / 10) + (4 / 100) =
   10    +    2    +   0.3    +    0.04

10 + 2 + 0.3 + 0.04 = 12.34
```

The decimal representation only means a sum of values, where every position is just a different factor of the base it's using, in this case base 10.

Starting from the decimal separator, to the left side they keep raising 10^n - The first value is the units (10^0), the second value is the tens (10^1), the third value is the hundreds (10^100) and so on.

And from the decimal separator to the right side, it's the opposite: it divides them by each power of ten. So the first digit is multiplied by 1/10, the second digit is multiplied by 1/100, and so on.

This definition can be used to represent decimal numbers in any other base. As an example, let's do the same but on base 2 for the number `5.3125`.

To get the decimal representation in any base, we can use an algorithm that's really simple: to get the next decimal, you multiply the value by the base, and extract the unit value from the result. The algorithm ends when the value reaches 0.

```
5.3125 = 5 + 0.3125;

2^-1 -> 0.3125 * 2 = 0.625 -> [0]
2^-2 -> 0.625 * 2  = 1.25  -> [1]
2^-3 -> 0.25 * 2   = 0.5   -> [0]
2^-4 -> 0.5 * 2    = 1.0   -> [1]
// We're done, no more decimals

2^2 2^1 2^0 . 2^-1 2^-2 2^-3 2^-4
 1   0   1  .  0    1    0    1

5.3125 -> 101.0101 = 4 + 1 + 1/4 + 1/16
```

`5.3125` in base 10 is represented as `101.0101` in binary, and the result is exact.

However, a problem arises if we try to represent `0.3` in binary, because we find ourselves in a loop when running the algorithm above:

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

> You might be asking "How come if 0.3 isn't representable as a binary number, computers can still print it after storing it to a variable?" As part of transforming a number to a string they just apply some rounding up to some decimals, which depends on the implementation. So even though 0.3 becomes `0.2999999999999999888977697537...` when represented as a double precision binary float, when it's printed out it's rounded to "0.3".
>
> It happens that when adding `0.1 + 0.2` it's adding two slightly larger numbers (because they can't be represented accurately either), and that results with a value slightly larger than 0.3 that doesn't get rounded to "0.3" but to 0.30000000000000004.

Our base 10 system also has the same problem for a lot of other numbers. Let's say we want to transform "0.1" in base 7 to base 10. 0.1 in base 7 just means the result of the fraction `1/7`. We can apply the same algorithm to get the decimal representation but in our base:

```
10^-1 -> 1/7 * 10 = 10/7 = 1 + 3/7 -> [1]
10^-2 -> 3/7 * 10 = 30/7 = 4 + 2/7 -> [4]
10^-3 -> 2/7 * 10 = 20/7 = 2 + 6/7 -> [2]
10^-4 -> 6/7 * 10 = 60/7 = 8 + 4/7 -> [8]
10^-5 -> 4/7 * 10 = 40/7 = 5 + 5/7 -> [5]
10^-6 -> 5/7 * 10 = 50/7 = 7 + 1/7 -> [7]
// This is now repeating from 10^-1
10^-7 -> 1/7 * 10 = 10/7 = 1 + 3/7 -> [1]
10^-8 -> 3/7 * 10 = 30/7 = 4 + 2/7 -> [4]
...
// And it will keep going on forever, the value will never be 0.

1/7 = 1/10 + 4/100 + 2/1000 + 8/10000 + ...

10^0 . 10^-1 10^-2 10^-3 10^-4 10^-5 10^-6 10^-7 ...
0    .   1     4     2     8     5     7     1 ...
```

So in a parallel universe where we use base 7, we would face the issue where we can't represent '0.1' in base 10, because that's 1/7 = 0.142857142857142857...

This raises a question: What makes a number have a finite amount of decimals for a given a base? The answer is any rational number that has a denominator composed with factors from the base.

As an example, in base 10, all numbers that have a denominator composed only by 2 and 5 (which are the factors of 10) will be represented exactly: 4/10 = 0.4, 1/5 = 0.2, 1/25 = 0.04 and so on. But any that has any other prime factor in the denominator will have infinite many decimals: 4/30 = 0.1333..., 8/18 = 0.444...

For this reason, `1/10`, `1/5` and `3/10` have recurring decimals in base 2: They all have `5` as factor on the denominator. `5.3125` on the other hand doesn't have any recurring decimal, because it's `85 / 16`, and 16 is a power of 2.

So the problem comes exclusively from this fact. When working in binary, the only numbers that can be represented exactly in decimal form are the ones which are divided by powers of 2, whereas in our base 10 we don't have this problem for the ones that are also divided by powers of 5. When you have recurring decimals, at some point you need to "cut" and all of that precision gets lost.

But this is completely independent from floating point vs fixed point. Floating point only means that the decimal point can be moved left or right, keeping the original value by multiplying an exponent. In essence, floating point numbers store the number in scientific notation.

Fixed point on the other hand it reserves some space for the integer part, and some space for the decimal part, but that doesn't solve this problem.

Let's work in base 10 to make this more familiar. And let's imagine our variable only has space for 8 characters.

With 8 characters, I could define a floating point format where I have 1 character to store the exponent and 7 to store the significant. With this I can represent the following numbers:

```
// Floating point with 7 significant digits and 1 exponent digit

1/3
= 0.3333333
= 3.333333 * 10^-1
Stored as [3,3,3,3,3,3,3,-1]

1/7
= 0.1428571
= 1.428571 * 10^-1
Stored as [1,4,2,8,5,7,1,-1]
```

On the other hand, a usual practice when working with fixed point is to have half the bits for the integer part, and half the bits for the fractional part. In this case:

```
// Fixed point with 4 integer digits and 4 decimal digits
1/3

= 0.3333333
Stored as [0,0,0,0,3,3,3,3]

1/7
= 0.1428571
= 1.428571 * 10^-1
Stored as [0,0,0,0,1,4,2,8]
```

As you can see, by moving from floating point to fixed point, we lost 2 digits of precision.

I know, you could reserve more space for the decimal part on the fixed point format, but then you lose range on the integer part, whereas on floating point with the current format it can go all the way from 10^-4 up to 10^5.

Each representation have pros and cons, but the one that's most commonly used is floating points, and both of them have the same original problem.

## Common solutions

### Multiplying by 100

A common way of fixing this is to avoid decimals altogether, usually multiplying these numbers by powers of 10. For instance, applications that work with numbers that are usually divided into hundreds (e.g. currencies with cents as division) store numeric values as "number of cents", essentially multiplying every value by 100. This is actually fixed point arithmetic, but applied before parsing it into binary, reserving 2 base-10 digits as decimal part.

However, when doing this you lose on flexibility. It works really well if all you have to do is add up numbers and you know all of them will have a specific amount of digits on base 10.

But this won't work if you deal with numbers with an arbitrary amount of decimals, or if you have to divide, where you can very easily lose precision. And it also makes multiplication trickier, since you have to shift the value to get the correct result (often resulting in more loss of precision).

### Increasing amount of bits + rounding

Another common way of solving this is by using a really big amount of decimal places, coupled with some rounding to have less chance of having this error show up.

This is used by many libraries such as BigDecimal, BigNumber, etc. and most of the time it works. However, it's still not guaranteed, most of this libraries surface the same problem again if you divide a number twice.

And sometimes you need to apply some custom rounding which can get wrong values (e.g. doing a Rounding.CEIL on a number that became 0.30000...00001 will give you 0.31)

Lastly, performance is also often impacted, because often these libraries internally use BigInts which can become slow to operate as the number keeps growing larger.

### Rational numbers

Another alternative is to use a library that represents numbers as rational numbers. These store two integer values a/b and then apply all operations by using basic arithmetic rules on rational numbers.

However, these ones have the problem that as the numbers keep getting more and more complex, both integers 'a' and 'b' keep growing and growing, which can easily cause an overflow. Some libraries mitigate this by using BigInt, but then again they become expensive to do computations (and they have to calculate gcd every time you do any operation to keep them as small as possible).

## Looking at alternatives

Is there any way we can avoid the original problem without using bigints, numbers that can grow indefinitely or doing some rounding?

Let's focus on what makes a number representable in base 2 without recurring decimals. Let's call these **safe numbers** in short.

If all we have are safe numbers, we can operate with them and we will get back another safe number:

```
101.0101 -> 5.3125
+ 1.1011 -> 1.6875
111.0000 -> 7

5.3125 + 1.6875 = 7

101.0101 -> 5.3125
+ 1.1011 -> 1.6875
 11.1010 -> 3.625

5.3125 - 1.6875 = 3.625


     101.0101 -> 5.3125
     * 1.1011 -> 1.6875
     101 0101
    1010 101
   00000 00
  101010 1
 1010101
10001111 0111
1000.11110111 -> 8.96484375

5.3125 * 1.6875 = 8.96484375
```

All of the results are exact, and this makes sense because when adding or subtracting we're just going "column by column", which will never add recurring decimals. And multiplication only uses addition as well, so that won't create recurring decimals.

The only basic arithmetic operation that can give recurring decimals is division. 1 and 3 are both safe numbers, but if you divide 1/3 it gives back 0.333... which has recurring decimals.

The other big limitation of only using safe numbers is that it excludes all of the other numbers (of course).

Looks like safe numbers are the key to the solution, but is there a way we can solve both of these problems?

## What if...

What if we delay the execution of divisions as much as possible, while still using "safe numbers"? All we need to do is just store 2 safe numbers `a` and `b` which together represent the division `a/b`.

This should actually solve both of the limitations they have, since we won't have any division happening until we need to show the number, and we can represent any other rational number, because this solution extends rationals (where both parts are integers).

For example, 3.35 is not representable in binary in exact form. But we can transform this number to a pair `a / b = 5.234375 / 1.5625 = 3.35` where both a and b are safe numbers, they don't have any recurring decimal when represented in base 2: `5.234375 -> 101.001111` and `1.5625 -> 1.1001`.

This has the advantage vs Rational numbers that we can keep both a and b relatively small. By the point we start to lose precision it will be because we've reached the precision limit that we have, but because of the nature of floats only the least significant digits would be lost. In the case of rational numbers, those integers can overflow which result in a completely different number than the one intended.

And because we're in the land of "safe numbers", we can add, subtract and multiply by using basic fraction arithmetic while staying in this land. And the only operation which we couldn't do, division, we can now just easily invert a number (swap `a` and `b`) and multiply it, which is safe as well.

## Implementation

I've implemented this in Rust, and a Typescript implementation is on the way. You can find the repo here (TODO).

Summarizing and just for the sake of an example, here's a possible implementation:

```rs

```

## Benchmark
