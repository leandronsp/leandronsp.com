---
title: "A CRUD journey in Haskell, part I, introduction"
slug: "a-crud-journey-in-haskell-part-i-introduction-2c3j"
published_at: "2021-08-03 21:05:28Z"
language: "en"
status: "published"
tags: ["haskell", "programming", "functional"]
---

In the past few days, [I've been learning some Haskell](https://twitter.com/leandronsp/status/1421991890346463233?s=20) after years of seeing people praising this programming language, be it about its expressiveness on writing programs or its pureness of being a "pure" functional programming language free of side-effects. 

## Expressiveness

[After playing](https://github.com/leandronsp/fun/tree/master/haskell) a bit with Haskell, I could realize how much I like such expressiveness in a programming language. 

Additionally, I have backgound programming in Ruby since 2010 and Elixir since 2016. I always loved the way I can write declarative and readable code in those languages, which makes them my 2 preferred languages by far.  

Then I met Haskell. 

## Types

In the late 2000's, I started my career programming in Java. Hence, I have some familiarity working with type declarations and how to use types to ensure some level of correctness. 

However, when learning Haskell, I could realize there's much more I could learn on types. After more than a decade doing mainly [duck type programming](https://en.wikipedia.org/wiki/Duck_typing), I feel I have to do a "mental shift" in order to master types. 

Thankfully, [Haskell does a great job on type inference](https://en.wikipedia.org/wiki/Haskell_(programming_language), which will ease my process on using types. 

## Hello World

In this blogpost series I'll assume you already have [the Haskell environment installed](https://www.haskell.org). In case you want to save your time and your host storage utilization, you can use [Docker](https://hub.docker.com/_/haskell).

A simple hello world using the [ghc](https://en.wikipedia.org/wiki/Glasgow_Haskell_Compiler):
```bash
ghc -e 'putStrLn "Hello World in Haskell!"'
```
This is the most possible simple Hello World in Haskell. 

`ghc` **on the `-e` mode** will interpret the expression `putStrLn "Hello World in Haskell"`, compile it to native code and execute it, all in a single command. 

### What's ghc?

It stands for "Glasgow Haskell Compiler". It's the [most used Haskell compiler implementation](https://en.wikipedia.org/wiki/Glasgow_Haskell_Compiler), having its initial release in the early 90's. 

When we write a Haskell program in a `.hs` source file, we use the `ghc` to compile our program into native code. For instance, let's make another "Hello World" but using the compilation process manually:

`Hello.hs`
```haskell
main = putStrLn "Hello World in Haskell!"
```
Then, compile the program using `ghc`:
```bash
ghc Hello.hs
```
It will compile and generate the binary code in the output file `./Hello`, which can be executed successfully:
```bash
./Hello
```
"Hello World in Haskell!". YAY! 🎉

### Skipping the manual compilation process

Remember our first `Hello World` example, skipping the manual compilation process? The `-e` option can be *a valid Haskell expression, hence function calls are eligible for that*:
```bash
ghc app/Hello.hs -e main
```
The same as calling:
```bash
ghc -e 'putStrLn "Hello World in Haskell!"'
```

## A Quicksort example

Let's write a simple, not-optimized Quicksort algorithm:

`Quicksort.hs`
```
quicksort [] = []                                     
quicksort [pivot] = [pivot]                                
                                                           
quicksort (pivot:tail) =                                   
  (quicksort [smaller | smaller <- tail, smaller <= pivot])
  ++ [pivot] ++                                            
  (quicksort [larger | larger <- tail, larger > pivot])    
```
Now, in order to run the algorithm, it's only a matter of:
```bash
ghc Quicksort.hs -e "quicksort [5, 13, 8, 1, 2, 1, 3]"

# [1, 1, 2, 3, 5, 8, 13]
```
I'll skip explaining the Quicksort solution, but in Haskell we basically used the following features:

- [Pattern Matching](http://learnyouahaskell.com/syntax-in-functions)
- [Recursion](http://learnyouahaskell.com/recursion)
- [List comprehensions](https://wiki.haskell.org/List_comprehension)

## Using the REPL

Haskell comes with a great [REPL](https://en.wikipedia.org/wiki/Read–eval–print_loop) called [GHCi](https://downloads.haskell.org/~ghc/latest/docs/html/users_guide/ghci.html). From the GHCi interpreter, we can load modules and execute their functions right from there:

Enter the REPL:
```bash
ghci
```
Then, inside the REPL, do some math:
```
ghci> 1 + 1
2
```
Load the Quicksort module:
```
ghci> :load Quicksort.hs
[1 of 1] Compiling Main       ( Quicksort.hs, interpreted )
Ok, one module loaded.

ghci> quicksort [2, 3, 1]
[1, 2, 3]
```
And quit the REPL:
```
ghci> :quit
```
### Prelude

Inside the REPL, Haskell loads automatically the basic [Prelude module](https://hackage.haskell.org/package/base-4.15.0.0/docs/Prelude.html) and some standard libraries, such as [IO](https://hackage.haskell.org/package/base-4.15.0.0/docs/System-IO.html) and Complex. Because of that, any function belonging to the Prelude module will be acessible via REPL. 

```
# implicit
ghci> putStrLn "hello from GHCi"

# explicit
ghci> Prelude.putStrLn  "hello from GHCi"
```
## Writing Unit tests

Testing is a good engineering practice agnostic to technology or tooling. Haskell is no different and the community created a great tool for Unit testing called [HUnit](https://hackage.haskell.org/package/HUnit), inspired by the Java JUnit. 

Since it's an external package, we must download it and **import the module** `Test.HUnit` in order to run our first unit test in Haskell. 

We will use [Stack](https://docs.haskellstack.org/en/stable/README/) which comes with a good tooling for creating and managing complex projects in Haskell. 

First of all, let's setup Stack so it will install a `ghc` in an isolated place and give us a buch of useful commands for using packages:
```bash
stack setup
```
Now we are able to install the `HUnit` package:
```bash
stack install HUnit
```
Following, the unit test:

`Tests.hs`
```
import Test.HUnit                                 
                                                  
simpleTest = TestCase (assertEqual "1 equals 1" 1 1)
```
And then, we can run our test:
```bash
stack ghc -- Tests.hs -e "runTestTT simpleTest"
```
Which results in:
```bash
Cases: 1  Tried: 1  Errors: 0  Failures: 0
Counts {cases = 1, tried = 1, errors = 0, failures = 0}
```
Notes: 

- calling `stack` is needed so Stack will load the `HUnit` module into the `ghc`
- the `Test.HUnit` module defines a function called `runTestTT` which we use to run our test

We can even define multiple TestCases at once:
```bash
import Test.HUnit                                              
                                                               
simpleTest = TestCase (assertEqual "1 == 1" 1 1)                
mathTest  = TestCase (assertEqual "10 / 5 equals 2" (10 / 5) 2)
                                                               
tests = TestList [
    TestLabel "simple" simpleTest, 
    TestLabel "math" mathTest]                                   
```
```bash
stack ghc -- Tests.hs -e "runTestTT tests"
```
Or, if preferred, multiple assertions per TestCase:
```
import Test.HUnit                         
                                          
tests = TestCase $ do                     
  assertEqual "1 == 1" 1 1                
  assertEqual "10 / 5 equals 2" (10 / 5) 2
```
## Wrapping Up

In this post we've seen a gentle introduction to the Haskell programming language, writing simple programs using GHC, GHCi and Stack. We also covered how to setup and write unit tests, which are very important to every real-world project. 

I didn't cover **type declarations**, but it will be covered in future posts. 

Moreover, in the upcoming posts, we'll do some Socket programming and create a simple TCP server in Haskell, being the base ground of our simple CRUD application. 
