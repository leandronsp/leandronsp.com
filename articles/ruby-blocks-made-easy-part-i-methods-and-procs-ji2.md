---
title: "Ruby blocks made easy, part I, methods and procs"
slug: "ruby-blocks-made-easy-part-i-methods-and-procs-ji2"
published_at: "2021-04-10 23:17:45Z"
language: "en"
status: "published"
tags: ["ruby", "programming", "softwaredevelopment"]
---

---
title: Ruby blocks made easy, part I, methods and procs
published: true
description: Understanding the fundamentals of Ruby blocks
tags: ruby, programming, softwaredevelopment
cover_image: https://dev-to-uploads.s3.amazonaws.com/uploads/articles/ldzucvwksisneqd8vssa.png
---
Blocks in Ruby are powerful structures that are part of our daily basis as Ruby developers. We see them being used across a variety of standard classes as well as in almost every popular gem. 

A few examples:
```ruby
# print each number within an array
[1, 2, 3].each { |number| puts number }

# usage in some ActiveRecord models 
scope :published, -> { where(published: true) }
has_many :users, -> { order(:name) }

# usage in Devise configuration
Devise.setup do |config|
  # config.encryptor = :sha512
  # ...
end

# usage in Rails views
<%= form_for @user do |form| %>
  // do something with the `form` object
<% end %>
```
The examples could go beyond.

Blocks enable _flexibility and extensibility_. It's practically impossible for any Ruby application to exist without blocks. 

There are [lots of blogposts explaining the differences between blocks, procs and lambdas](https://www.rubyguides.com/2016/02/ruby-procs-and-lambdas/), but in this guide which is a series of articles, I'll explain the fundamentals and try to present, in baby-steps, some common problems and how Ruby blocks can help to solve them. 

## How Ruby evaluates expressions
Everything in Ruby is an expression, so an expression results in a value:
```ruby
# ruby evaluates the expression, which results in a value `2`
1 + 1

# ruby evaluates the expression, which results in a value `2`, and stores the result in the variable `number`
number = 1 + 1
```
Same as calling any method in an Object:
```ruby
# ruby evaluates the method `.now` in the class `Time`,
#  resulting in a value which is the current time,
#  and stores the result in the variable `current_time` 
current_time = Time.now
```
#### Everything in Ruby is an object
For those who are already know that [everything in Ruby is an object](https://dev.to/craigbrad/everything-is-an-object-5184), the following expression is familiar:
```ruby
1.+(2)
```
* `1` is an instance object of the class `Integer`
* The class `Integer` defines a special method, called `+`
* This method takes an argument, which should be an instance of the class `Integer`, in this case, `2`
* The method results in a value, which is `3`

Note that, once:
* everything is object
* objects have methods
* and everything is an expression which results in a value

Then, expressions are all about _calling methods_. Hence, we can come to the conclusion that **expressions are evaluated immediately**.
```ruby
def fetch_current_time
  Time.now
end

current_time = fetch_current_time
```
In the above example, Ruby will evaluate the expression `fetch_current_time`, which is a _method_, then resulting in the value **immediately**, storing the result in the variable `current_time`.
```ruby
current_time # produces 2021-04-10 17:22:06
current_time # produces 2021-04-10 17:22:06
current_time # produces 2021-04-10 17:22:06
current_time # produces 2021-04-10 17:22:06
```
No matter how many times we call the variable: anytime the variable `current_time` is called, it will produce the _same_ value that was already evaluated previously. Expressions are evaluated **only immediately**.

## Evaluating expressions later
What if we wanted to evaluate an expression, _not immediately_, but **later**? Sometimes, we have the need to pass through some variable that contains an expression to be evaluated in _another context_, not in the current one. 

Let's see the implementation for the `fetch_current_time` method:
```ruby
def fetch_current_time
  Time.now
end
```
Let's suppose we want to store this method in some variable, but we want to send this variable to another component, class, whatever context, but *later*. 

### Potential solution
##### This is not Ruby code, just a PSEUDO CODE for didatic purposes
```ruby
current_time = later(fetch_current_time)
```
Then, we **could** have the ability to call `current_time`, producing a different result (time) everytime it is called:
```ruby
current_time.evaluate # produces 2021-04-10 17:22:15
current_time.evaluate # produces 2021-04-10 17:22:16
current_time.evaluate # produces 2021-04-10 17:22:17
```
Note that, everytime time the variable is called, the expression within **is evaluated again**.

### Ruby solution
The Ruby standard API provides a method called `method` which takes an argument which is the method _name_:
```ruby
method(:fetch_current_time)

#<Method: main.fetch_current_time() (irb):91>
```
_Yes, this is weird at first but it is part of the metaprogramming Ruby API. Metaprogramming in Ruby is really powerful. We should learn and use its capabilities **consciously** and with moderation._
```ruby
meth = method(:fetch_current_time)
meth.class # => Method
```
Basically, this is the representation of a _method_. 
It is literally the instance of the class `Method` (remember everything in Ruby is object? Methods included!). 
And as such, it has a method that **transforms the method into an structure that can be evaluated later**. This method is called `.to_proc`:
```ruby
method(:fetch_current_time).to_proc

#<Proc:0x00007fca441d4ed8 (lambda)>
```
* it returns an instance of the class `Proc`
* the class `Proc` is used to include expressions that will be evaluated later
* the `lambda` indicates that this proc is a _lambda_ type. Then, we can say that _method procs are lambdas_

Once we know that, how to use the proc to solve the problem of evaluating the `current_time` variable many times later?
```ruby
current_time = method(:fetch_current_time).to_proc

current_time.call # produces 2021-04-10 17:42:00
current_time.call # produces 2021-04-10 17:42:01
current_time.call # produces 2021-04-10 17:42:02
```
## Conclusion
In this post we learned that Ruby methods can be transformed into Procs to be evaluated later. 

In the upcoming series, we will keep learning the fundamentals of _Ruby blocks_ and see [how to use procs as arguments to methods](https://dev.to/leandronsp/ruby-blocks-made-easy-part-ii-curry-and-procs-as-arguments-3c25).








