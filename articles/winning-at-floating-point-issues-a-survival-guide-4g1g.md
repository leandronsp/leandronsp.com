---
title: "Winning at floating-point issues: a survival guide"
slug: "winning-at-floating-point-issues-a-survival-guide-4g1g"
published_at: "2023-06-01 04:29:59Z"
language: "en"
status: "published"
tags: ["computerscience", "programming"]
---

## TL;DR

For precise calculations, favor arbitrary-precision decimals or equivalents like BigDecimal over floating-point numbers.

Additionally, avoid unnecessary rounding. When required, limit rounding to the final step to maintain as much accuracy as possible.

---

## Table of contents

* [Prologue](#prologue)
* [First things first](#first-things-first)
* [Bits are not enough](#bits-are-not-enough)
* [Bits and integers](#bits-and-integers)
* [Bits and other real numbers](#bits-and-other-real-numbers)
* [Fixed-point representation](#fixedpoint-representation)
* [Floating-point representation](#floatingpoint-representation)
* [Issues and standards](#issues-and-standards)
* [Floating-point data types](#floatingpoint-data-types)
* [Floating-point issues](#floatingpoint-issues-in-action)
* [Decimals to the rescue](#decimals-to-the-rescue)
* [Beware of rounding](#beware-of-rounding)
* [Decimals in other technologies](#decimals-in-other-technologies)
* [Wrapping Up](#wrapping-up)
* [References](#references)

---

## 📜 Prologue

Oh yes, **floating-point** numbers. 

They frequently appear in technical content, full of scientific notations and complex explanations. 

It's almost certain that every programmer has already faced the notion that working with floating-point numbers can be **perilous**, resulting in **imprecise** arithmetic outcomes, among other issues.

However, comprehending all the underlying reasons behind this _crucial topic in computer science_ can be challenging for many.

In today's post, we will delve into the **problems that floating-point numbers address** and explore the **involved caveats**. 

So, grab a refreshing bottle of water, and let's embark on yet another journey into the realm of _floating-point_ numbers.

---

## 👍🏼 First things first
Computers can only understand **machine language**. 

_Machine language_ is a collection of "bits" that contain data and instructions for the CPU. We represent those bits as **binary bits** and as such, it's called the **base-2 numeral system** (0 and 1).

```bits
01001001 01001000 11001011 01000001 01001000 10001000
01011001 01001000 01000001 01101001 01001000 01001001
11000001 10001000 01001001 11001010 10001000 01001000
11001001 01001000 11001001 01001000 01001000 01001001
```

Programming directly in machine language is highly _error-prone_ and often inefficient in many scenarios. To address this, **assembly languages** were introduced over the years, serving as a bridge between CPU architecture specifics and a higher-level set of instructions.

**Assembly languages** are translated into machine code through a dedicated program called "assembler." Each CPU architecture typically has its own assembler associated with it. 

This allows programmers to work with a more manageable and human-readable instruction set that is then translated into machine code specific to the target architecture.

```assembly
section .data
    number1 dd 10      ; Define the first number as a 32-bit float
    number2 dd 20      ; Define the second number as a 32-bit float

section .text
    global _start
_start:
    ; Load the first number into xmm0 register
    movss xmm0, dword [number1]
    
    ; Load the second number into xmm1 register
    movss xmm1, dword [number2]
.....
.....
```
Advancements in the field of computer engineering have paved the way for the development of increasingly high-level programming languages that can directly translate into machine code instructions.

Over the course of the following decades, languages like **C, Java, and Python**, among others, emerged, enabling individuals with limited knowledge of computer internals to write programs for computers.

This significant accomplishment has had a profound impact on the industry, as computers became more compact and faster, empowering modern software engineering practices to deliver substantial value to businesses worldwide.

---
## 🔵 Bits are not enough
As mentioned earlier, computers solely comprehend **binary bits**. 

Nothing else in this world can be interpreted by computers. 

_Only. Bits._ 

> 💡 Actually, CPUs in electronic computers comprehend only the absence or presence of voltage, allowing us to represent information using 0 and 1 (off and on)

However, real-life scenarios present challenges where computer programs, which are created **by people for people**, need to represent a broader range of characters beyond just 0s and 1s. This includes letters, decimal numbers, hexadecimal numbers, special characters, punctuation marks, and even emojis like 😹.

Standard character sets such as **ASCII** and **Unicode** schemes solve the challenge of representing numbers, letters, special characters, emojis, and more within the binary system.

> ⚠️ Delving into the intricacies of character encoding is beyond the scope of this article. It will be covered in future posts

_Here, our focus will be specifically on how computers work with numbers in memory_, particularly **integers**.

---

## 🔵 Bits and integers
Let's take the number _65_ as an example. It is represented in the **base 10** numeral system, making it a real number. 

Moreover, it is classified as an **integer**.

By performing conversions based on powers of 2, we can represent the integer 65 as `01000001` in an 8-bit binary format. This binary representation can be converted back and forth to the decimal value 65.

From a _mathematical perspective_, since **65 is an integer**, it fits within a single byte (8 bits). Moreover, performing powers of 2, we know that a single byte can accomodate 256 numbers:

```
2^8 = 256
```
Naively speaking, one might assume that a single byte can represent integers ranging from 0 to 255. 

However, integers must represent both _negative and positive_ numbers. How should we evenly distribute those integers in a single byte?

We should employ a technique called **two's complement**.

### 👉 Two's complement

To evenly distribute negative and positive non-fractional integers within 8 bits, we can use a technique called **two's complement**. In this technique:

* the leftmost bit serves as the **sign bit**, indicating whether the number is positive or negative
* all the bits are *flipped or inverted*
* we then **add 1** to the resulting value

This way, a single byte represents integers ranging from -128 to 127.

```
2^8 = 256

-127, -126, -125...127, 128
```

### 👉 Using two bytes
By employing the two's complement technique, we can also represent a range of integers using two bytes (16 bits). Utilizing the concept of powers of 2, we can observe that two bytes can accommodate a total of 65536 different values:

```
2^16 = 65536
```

Considering negative numbers, the range extends from -32768 to 32767, inclusive.

Now, let's explore some examples using **PostgreSQL**. If you prefer to work with containers, setting up a quick `psql` terminal is straightforward. You can achieve it by running the following commands:

```bash
$ docker run --rm -d \
  --name postgres \
  -e POSTGRES_HOST_AUTH_METHOD=trust \
  postgres 
```

Then, access the `psql` terminal with the following command:

```bash
$ docker exec -it postgres psql -U postgres
```

In PostgreSQL, the data type that represents a two-byte integer is called **int2** or **smallint**:

```sql
SELECT 65::int2;
 int2
------
   65
```

To check the data type, we can use the function `pg_typeof`:

```sql
SELECT pg_typeof(65::int2);
 pg_typeof
-----------
 smallint
```

As **smallint** uses two bytes, it can only accommodate the range we mentioned earlier in terms of bits and integers:

```sql
SELECT 32767::int2;
 int2
-------
 32767

SELECT -32767::int2;
 int2
-------
 -32767
```

However, if we attempt to exceed the range:

```sql
SELECT 32768::int2;
ERROR:  smallint out of range
```

Pretty neat, _isn't it_?

In addition to **smallint**, PostgreSQL offers a variety of other integer data types:

| Data Type     | Description                           | Range of Integers                    |
|---------------|---------------------------------------|--------------------------------------|
| smallint      | Two-byte integer                       | -32,768 to 32,767                    |
| integer       | Four-byte integer                      | -2,147,483,648 to 2,147,483,647      |
| bigint        | Eight-byte integer                     | -9,223,372,036,854,775,808 to 9,223,372,036,854,775,807 |

However, we all know that the world is not only integers. Integers are a subset of a broader set of numbers, called **real numbers**.

---

## 🔵 Bits and other real numbers

**Real numbers** can include integers, fractions, and decimals, both rational and irrational.

For instance, _3.14159_ represents the real **number π** (pi), which is an irrational number. It is a _non-repeating and non-terminating decimal_. The value of π extends infinitely without any pattern in its decimal representation.

```
3.14159265358979323846....
```

---

Suppose we have two bytes (16 bits), which can represent 65536 integers ranging from -32768 to 32767.

When it comes to representing other real numbers, such as decimals, we can use a technique called **fixed-point**.

---

## 🔵 Fixed-point representation
In fixed-point representation, we split the provided 16 bits into three sections:

### 👉 Sign bit
The first bit (leftmost) represents the sign, being 1 for negative and 0 for positive.

### 👉 Decimal part
The next 7 bits represent the decimal (fracional) part, which can have a precision of up to `0.992188` in our simulation:

```
2^-7 + 2^-6 + ... + 2^-1 =
0.992188
```

### 👉 Integer part
The remaining 8 bits represent the integer part, which can go up to `127` using two's complement :

```
two_complement(
    2^7 + 2^6 + ... + 2^1 = 
    127
)
```

![fixed point](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/56igr6mlwimkho6vlllk.png)

Considering that the integer part, using 8 bits with two's complement, ranges from -128 to 127, we can conclude that, with _fixed-point representation_, decimals can range from **-128.992188 to 128.992188**.

However, this technique may not always be the most efficient. Let's explore another technique for representing decimals.

Yes, we are talking about the widely used **floating-point** representation.

---

## 🔵 Floating-point representation
Taking 16 bits still as an example, in floating-point representation we also split the 16 bits into three groups:

### 👉 Sign bit
The first bit (leftmost) is used to represent whether the number is negative (1) or positive (0).

### 👉 Exponent part
This crucial component, known as the _floating-point_, is assigned the next X bits, signifying its importance. 

For our simulation, let's allocate 7 bits for the exponent part, while utilizing the first exponent bit for the exponent sign. 

As a result, the range for the exponent extends from -63 to 63, accommodating both negative and positive values:

```
2^5 + 2^4 + ... 2^1 =
63
```

_This part is crucial for defining arithmetic precision in floating-point representation._

### 👉 Mantissa
The **Mantissa** part, also known as the _significand_, takes the remaining 8 bits, allowing for a range of up to 255. 

_As we are not representing the integer part in this simulation, there is no need to apply two's complement to the mantissa._

🔑 **Now the key part**
To calculate the maximum positive floating-point number, we multiply the mantissa by the exponent. 

In this case, the maximum positive value would be obtained by **multiplying 255 by 2^6**, resulting in an exceedingly large number like **2351959869397967831040.0**.

Conversely, the minimum positive number can be represented as 1 multiplied by **2^-63**, or **0.00000000000000000010842021724855044340074528008699**.


![floating-point](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/mof63oaed96584ajqvbg.png)

Please note that this simulation is a simplified representation with limited precision and may not reflect the accuracy of ideal or standardized floating-point formats.

---

## 🔵 Issues and standards
Indeed, as mentioned earlier, **selecting an appropriate number of bits for the exponent part** in floating-point representation is crucial to mitigate issues with rounding and truncation when handling fractional numbers.

Standards like **IEEE 754** were established precisely to address these concerns and provide a consistent framework for floating-point representation. The IEEE 754 standard defines the number of bits allocated to the exponent, mantissa, and sign in both single precision (32 bits) and double precision (64 bits) formats.

These standards determine the precise representation of the various components of a floating-point number, the _rules for arithmetic operations_, and how to handle exceptional cases.

### 👉 Single precision (4 bytes)
**Single precision** numbers are represented using 32 bits of memory. 

They include: 

* 1 bit for the sign of the number 
* 8 bits for the exponent
* 23 bits for the mantissa

According to the IEEE standards, single precision can typically **handle 6 to 9 decimal place precision**.

### 👉 Double precision (8 bytes)
**Double precision** numbers are represented using 64 bits of memory. 

They include: 

* 1 bit for the sign of the number
* 11 bits for the exponent
* 52 bits for the mantissa

According to the IEEE standards, double precision can **handle 15 to 17 decimal places of precision**.

_Usually, double-precision fits better when high precision is mandatory, but it consumes more memory._

---

## 🔵 Floating-point data types
Many programming languages and database systems adhere to the IEEE 754 standards, and PostgreSQL is no exception.

Let's see how PostgreSQL implement float data types in action. 

The datatype **float4** conforms to the IEEE 754 single-precision standard, which allocates 1 bit for the sign, 8 bits for the exponent, and 23 bits for the mantissa:

```sql
SELECT 0.3::float4;
 float4
--------
    0.3
```
Conversely, the datatype **float8** conforms to the IEEE 754 double-precision standard, which allocates 1 bit for the sign, 811bits for the exponent, and 52 bits for the mantissa:

```sql
SELECT 0.3::float8;
 float8
--------
    0.3

#####################

SELECT 0.3::float;
 float
--------
    0.3
```

_The default `float` falls back to double-precision (float8)._

---

## ☣️ Floating-point issues in action
Let's dive into calculations with floating-point numbers and see the **potential issues** in action. 

Take a straightforward sum of `0.1 + 0.2`:

```sql
SELECT 0.1::float + 0.2::float;

 0.30000000000000004
```
This result shows how precision issues can arise in double-precision floating-point numbers during arithmetic operations. Even when following standards, we are not immune to these floating-point calculation challenges. 

However, there's an alternative strategy that involves a nifty trick using **integers**.

### 💡 A trick with integers

Instead of the float data type, we can work with **integers**. We incorporate a multiplier factor based on a _decimal scale_ when storing values, and then divide by the same factor to restore the original decimal representation when retrieving the value.

This method enables precise decimal calculations by leveraging integers and scaling. The multiplier factor should be chosen based on the required decimal precision.

To demonstrate, let's use this trick to perform `0.1 + 0.2`:

```sql
SELECT (0.1 * 1000)::int + (0.2 * 1000)::int;

300
```
Here, each input is multiplied by `1000` and then converted to an integer. To retrieve the original value without losing precision, we divide by `1000`:

```sql
SELECT (300 / 1000::float);

0.3
```
_Yay!_ 🚀

However, using a fixed multiplier factor may be inefficient when dealing with inputs that have varying decimal places.

Instead, a variable-scale representation could be employed by converting the input into a string and parsing the number of decimal digits. 

But be aware, variable-scale decimal representations demand **careful handling of complex calculations**, precise decimal scaling, and various other intricacies of decimal arithmetic.

This is where **decimals** come in.

---

## 🔵 Decimals to the rescue

Decimals address the challenges associated with complex arithmetic calculations involving decimals. They significantly reduce the precision issues commonly encountered with floating-point numbers.

Various programming languages and database systems have implemented decimals. PostgreSQL provides the datatype **decimal**, which offers superior precision compared to floats.

```sql
SELECT 0.1::decimal + 0.2::decimal;
0.3
```
Decimals can also be configured for arbitrary precision and scale:

```sql
# Example: accepts numbers up to 999.99
SELECT 0.1::decimal(5, 2);
0.10

SELECT 999.99::decimal(5, 2);
999.99
```
Handily, the default datatype for decimals in PostgreSQL is **numeric**, which is identical to _decimal_:

```sql
SELECT pg_typeof(0.1);

numeric
```

---

## ⚠️ Beware of rounding

Rounding decimal numbers programmatically can lead to imprecise results. For instance, the sum `25.986 + -0.4125 + -25.5735` should theoretically yield zero:

```sql
SELECT 25.986 + -0.4125 + -25.5735;

0.0000
```

Let's illustrate how we can round only the final sum to two decimal places:

```sql
SELECT ROUND(25.986 + -0.4125 + -25.5735, 2);

0.00
```

So far, so good, it works as expected.

With proper datatypes such as _decimal_, the arithmetic issue inherent to floating-point numbers is already addressed.

But **rounding introduces its own set of challenges**. Even if decimals are excellent for precision and arithmetic of decimal data, rounding operations inherently involve _some degree of approximation_.

Now, let's round each number before summing:

```sql
SELECT ROUND(25.986, 2) + ROUND(-0.4125, 2) + ROUND(-25.5735, 2);

0.01
```
_Uh, oh_ 😭

Every time we round some number, we’re adding a bit of imprecision. _Bit by bit_, the final result might be too far from the expected.

These examples underline why **unnecessary rounding should be avoided**. As rounding is an approximation, it's best to postpone it until the final step, i.e., _when presenting the data to the end user_.

---

## ➕ Decimals in other technologies
Every programming language or technical tool has its own data type for handling arbitrary precision, such as PostgreSQL's decimals.

Ruby offers the [BigDecimal](https://ruby-doc.org/stdlib-2.5.1/libdoc/bigdecimal/rdoc/BigDecimal.html) class, which facilitates arbitrary-precision floating-point decimal arithmetic.

Similarly, Java also includes a [BigDecimal class](https://docs.oracle.com/javase/8/docs/api/java/math/BigDecimal.html).

Go language is no exception; it too has [arbitrary-precision decimal arithmetic](https://go.dev/src/math/big/decimal.go).

It's crucial to verify that the technology you're using provides support for arbitrary precision. If you require greater accuracy, these solutions are often more suitable than using raw floating-point numbers.

---

## Wrapping Up
In this post, we delved into the intricacies of **floating-point** numbers. 

We explored how computers comprehend information through the **binary system**, from integer representation and fixed-point representation's inefficiency for decimals, to floating-point numbers and their _caveats_. 

We also investigated how **arbitrary-precision** data types like **decimal** address these precision issues.Furthermore, we discussed **rounding issues** and shared best practices for dealing with them.

I hope these complex topics have been presented in a way that's easy to understand, making floating-point issues no longer an issue! 

_Cheers!_

---

## References

https://docs.oracle.com/cd/E19957-01/806-3568/ncg_goldberg.html
https://www.postgresql.org/docs/current/datatype.html
https://en.wikipedia.org/wiki/IEEE_754
https://www.doc.ic.ac.uk/~eedwards/compsys/float/
https://en.wikipedia.org/wiki/Floating-point_error_mitigation
https://en.wikipedia.org/wiki/Single-precision_floating-point_format
https://en.wikipedia.org/wiki/Double-precision_floating-point_format
https://en.wikipedia.org/wiki/Decimal_floating_point
