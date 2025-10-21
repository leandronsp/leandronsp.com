---
title: "Ruby blocks made easy, part II, curry and procs as arguments"
slug: "ruby-blocks-made-easy-part-ii-curry-and-procs-as-arguments-3c25"
published_at: "2021-04-10 23:21:53Z"
language: "en"
status: "published"
tags: ["ruby", "programming", "softwaredevelopment"]
---

---
title: Ruby blocks made easy, part II, curry and procs as arguments
published: true
description: Understanding the fundamentals of Ruby blocks
tags: ruby, programming, softwaredevelopment
cover_image: https://dev-to-uploads.s3.amazonaws.com/uploads/articles/imojdiw5a8hijxe7l633.png
---
[In the previous post](https://dev.to/leandronsp/ruby-blocks-made-easy-part-i-methods-and-procs-ji2), we learned that methods can be transformed into procs to be evaluated _later_.

One thing worth to mention is that, the method itself can be used like a proc: every `Method` structure has a method called `call`:
```ruby
Time.now # => 2021-04-10 17:22:05

Time.method(:now).call # => 2021-04-10 17:22:06
Time.method(:now).to_proc.call # => 2021-04-10 17:22:07

# checking the classes
Time.method(:now).class # => Method
Time.method(:now).to_proc.class # => Proc (lambda)
```
Given that, the `method` structure is good enough to be used in _later evaluations_. In theory, it is NOT a Proc. But in practice, it **behaves** like proc lambdas and _will_ evaluate the expression later.

We can also evaluate methods later with arguments:
```ruby
def multiply(a, b)
  a + b
end

method(:multiply).call(2, 4) # => 8
```
### Proc with arguments (curry)
Sometimes it's useful to define a proc with some _static arguments_, which can be evaluated later along with the dynamic arguments. These arguments can be "curried" to the proc using the method `.curry`:
```ruby
# creates a proc with no curried arguments
#   and calls using two dynamic arguments
method(:multiply).call(2, 4) # => 8

# creates a proc with the first argument curried
#   and calls using one remaining dynamic argument
method(:multiply).curry[2].call(4) # => 8
method(:multiply).curry[3].call(5) # => 15

# checking the class
method(:multiply).class # => Proc
method(:multiply).curry[4].class # => It's also a Proc
```
This feature is powerful because it allows us to write more expressive code:
```ruby
multiply_by_2 = method(:multiply).curry[2]
multiply_by_3 = method(:multiply).curry[3]

multiply_by_2.call(4) # => 8
multiply_by_3.call(6) # => 18
```
### Passing a lambda method as argument to another method
Lambda methods can be passed as arguments to methods like any other valid expression. 
 
Let's suppose we want a method which takes a list of numbers and applies some **calculation** method to each number, returning a new calculated list:
```ruby
def map_numbers(numbers, calculation)
  new_list = []
  for number in numbers
    # `calculation` is a proc, but we don't care about
    #    its logic: we simply evaluate whatever the
    #    calculation is to the number
    new_list << calculation.call(number)
  end
  new_list
end
```
Now, we want to use the method `map_numbers` to take a list of numbers and return a new list with _each number multiplied by 2_:
```ruby
# declaring the list
numbers = [1, 2, 3]

# declaring the "calculation" proc, using the "2" curried
#    as we've seen in the previous example
multiply_by_2 = method(:multiply).curry[2]

map_numbers(numbers, multiply_by_2) # => [2, 4, 6]
```
We can do even better, _in a single line_, applying other calculations as well:
```ruby
# multiplying by 2
map_numbers([1, 2, 3], method(:multiply).curry[2])

# multiplying by 4
map_numbers([1, 2, 3], method(:multiply).curry[4])

# multiplying by 42
map_numbers([1, 2, 3], method(:multiply).curry[42])
```
We could go beyond, supposing we'd have more calculation methods:
```ruby
map_numbers([1, 2, 5], method(:sum_by).curry[2])
map_numbers([2, 4, 9], method(:square_of).curry[3])
```
## Conclusion
We learned that procs can be passed as arguments to another methods and, optionally, can use curried arguments, making our code appear more _declarative_.

[In the next and last post of this series](https://dev.to/leandronsp/ruby-blocks-made-easy-part-iii-grand-finale-blocks-and-syntactic-sugar-4d48), we will unblock more fundamentals and introduce _blocks_.
 



