---
title: "Ruby blocks made easy, part III ~grand finale~, blocks and syntactic sugar"
slug: "ruby-blocks-made-easy-part-iii-grand-finale-blocks-and-syntactic-sugar-4d48"
published_at: "2021-04-10 23:25:52Z"
language: "en"
status: "published"
tags: ["ruby", "programming", "softwaredevelopment"]
---

---
title: Ruby blocks made easy, part III ~grand finale~, blocks and syntactic sugar
published: true
description: Understanding the fundamentals of Ruby blocks
tags: ruby, programming, softwaredevelopment
cover_image: https://dev-to-uploads.s3.amazonaws.com/uploads/articles/9ob6kb11iq2ugylftpln.png
---
In this series of posts, we already covered that [_methods can be transformed into procs_](https://dev.to/leandronsp/ruby-blocks-made-easy-part-i-methods-and-procs-ji2) and as such, can be evaluated **later**. Furthermore, we've seen that [procs can be used as arguments to another methods](https://dev.to/leandronsp/ruby-blocks-made-easy-part-ii-curry-and-procs-as-arguments-3c25) and that such procs can optionally use curried arguments. 

Until now, we have been using methods as a way to represent "blocks" of code:
```ruby
def multiply(a, b)
  a * b
end
```
Also, we learned that, in order to evaluate a method **later**, we must transform it into a proc (`method(:some_method)`). In Ruby, we can represent _blocks_ of code to be _evaluated later_ not only in methods, but also creating procs directly:
```ruby
current_time = Proc.new { Time.now }

current_time.call # => 2021-04-10 17:22:06

# It's quite similar to using methods
def current_time
  Time.now
end

method(:current_time).call # => 2021-04-10 17:22:10
```
Then, blocks can represent any **group of code** which will be evaluated later. Blocks can be inline or multiline:
```ruby
# inline block
Proc.new { Time.now }

# multine block
Proc.new do
  Time.now
end
```
Let's take our example in the previous post about `map_numbers` and, instead of creating a method `multiply`, we define a `Proc` directly with a block:
```ruby
multiply = Proc.new { |a, b| a * b } 

multiply.call(2, 3) # => 6
multiply.curry[2].call(4) # => 8
```
Right. Now, remember that the implementation of `map_numbers` takes a proc as the last argument? Then we have nothing to do in that method. It will simply work, because the object passed as argument should respond to a method `call`, so in this case procs already do!
```ruby
multiply = Proc.new { |a, b| a * b } 

map_numbers([1, 2, 3], multiply.curry[2]) # => [2, 4, 6]
```
We could also use another way of creating a proc, which is a `lambda`. There are [slight differences between procs and lambdas](https://www.rubyguides.com/2016/02/ruby-procs-and-lambdas/), but both belong to the same Ruby class: [Proc](https://ruby-doc.org/core-2.6/Proc.html), with lambda being a "type" of Proc.
```ruby
multiply_proc = Proc.new { |a, b| a * b } 
multiply_proc.call(2, 3) # => 6

multiply_lambda = -> (a,b) { a * b } 
multiply_lambda.call(2, 3) # => 6

# let's bring methods into play
def multiply(a, b)
  a * b
end

method(:multiply).call(2, 3) # => 6
```
"Meta" methods, procs, lambdas...they have little differences in practice but they all:
* take blocks
* respond to `.call`
* respond to `.curry`
* and share other similarities...
Take a look at the [Proc](https://ruby-doc.org/core-2.4.0/Proc.html) and [Method](https://ruby-doc.org/core-2.4.0/Method.html) documentation.

YAY! That's so much power!
### A syntactic sugar
Our method `map_numbers` looks like this:
```ruby
def map_numbers(numbers, calculation_proc)
  # logic here
  #  somewhere, it does `calculation_proc.call(number)`
end
```
The standard Ruby gives us a _syntactic sugar_, a keyword called **yield**, which is as similar as calling `some_proc.call`. If we choose to use `yield`, we can omit the `proc` parameter but we have to trust that whoever calls the method, they must _ensure_ the proc was passed as the **last** argument.
```ruby
def map_numbers(numbers)
  new_list = []
  for number in numbers
    new_list << yield(number) # <--- similar as doing the proc call
  end
  new_list
end
```
Now, if we try to call:
```ruby
map_numbers([1, 2, 3], method(:multiply).curry[2])
```
Oh,oh:
```
ArgumentError (wrong number of arguments (given 2, expected 1))
```
That's because, this syntactic sugar has a rule of thumb: the argument cannot be a proc, but a **BLOCK** instead. For doing so, we have to _transform_ our proc into a block, upon the passing argument, by prepending a `&` in the proc object:
```ruby
map_numbers([1, 2, 3], &method(:multiply).curry[2]) # => [2, 4, 6]
```
_The `&` prepend can be used to transform procs into blocks ONLY upon methods passing arguments!_

### Passing blocks to methods
Similar as using blocks to define procs and lambdas, we can also use blocks to be passed to methods. In case there's a block being passed, Ruby _WILL always_ take the block and use it as the **last argument**.
```ruby
map_numbers([1, 2, 3]) { |number| number * 2 } # => [2, 4, 6]
map_numbers([1, 2, 3]) { |number| number * 3 } # ...
map_numbers([1, 2, 3]) { |number| number + 55 } # ...

# multiline
map_numbers([1, 2, 3]) do |number|
  number * 10
end
```
Thankfully, we don't need to create such a method `map_numbers` in our codebase. Ruby has a lot of useful methods in its standard library, and the method `map` is one of them, being part of the [Array](https://ruby-doc.org/core-2.7.0/Array.html) class:
```ruby
[1, 2, 3].map { |number| number * 2 } # => [2, 4, 6]
```
And, since we know that methods can be transformed into procs:
```ruby
multiply_by_two = 2.method(:*) # 2 is an object, don't forget!

[1, 2, 3].map(&multiply_by_two)
```
So, unleash the madness and abuse on the syntactic sugar!
```ruby
[1, 2, 3].map(&2.method(:*)) # multiply by 2
[1, 2, 3].map(&6.method(:+)) # sum by 6
```
### Reducing structures
What if we wanted to sum all numbers in a list? Well, that's a simple algorithm:
```ruby
def sum_all(numbers)
  sum = 0
  for number in numbers
    sum += number
  end
end
```
But how can we write a more *flexible and robust* code that allows to apply any _transformation_, **reducing** the entire list into a single **accumulated** value, no matter if the desired output is a sum or the product of multiplication? 

Yes, we can rely on blocks!
```ruby
def reduce(numbers, initial_acc)
  accumulator = initial_acc
  for number in numbers
    accumulator = yield(accumulator, number)
  end
  accumulator
end
```
Then, we can use our method to apply a bunch of reducers:
```ruby
# sum all numbers
reduce([1, 2, 3], 0) { |acc, number| acc = acc + number }

# multiply all numbers
reduce([1, 2, 3], 1) { |acc, number| acc = acc * number }

# syntactic sugar
reduce([1, 2, 3], 0, &:+) # sum all numbers
reduce([1, 2, 3], 1, &:*) # multiply all numbers
```
Similar to `map`, Ruby also provides a method `reduce` in the standard library:
```ruby
[1, 2, 3].reduce(0) { |acc, number| acc += number }
[1, 2, 3].reduce(1) { |acc, number| acc *= number }

[1, 2, 3].reduce(&:+)
[1, 2, 3].reduce(&:*)
```
## Wrapping up
In this series of blogposts, we tried to cover the fundamentals behind Ruby blocks, such as:
* how Ruby evaluates expressions
* how we can use methods to evaluate expressions later
* methods and procs
* procs as arguments
* curry arguments in procs
* blocks in procs, lambdas and methods
* bonus point to syntactic sugar and the Ruby standard library

I hope you could enjoy and understand a bit more on how Ruby blocks work and how to make a more effective use of them on a daily basis!












