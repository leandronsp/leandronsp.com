---
title: "Quicksort, a Ruby implementation using Test-driven development"
slug: "quicksort-a-ruby-implementation-using-test-driven-development-10ma"
published_at: "2021-04-16 23:30:24Z"
language: "en"
status: "published"
tags: ["ruby", "quicksort", "algorithms", "tdd"]
---

---
title: Quicksort, a Ruby implementation using Test-driven development
published: true
description: Implementing Quicksort with TDD
tags: ruby,quicksort,algorithms,tdd
cover_image: https://dev-to-uploads.s3.amazonaws.com/uploads/articles/9q0pcat6jd54g5t1o7b7.png
---
[Quicksort](https://en.wikipedia.org/wiki/Quicksort) is a sorting algorithm designed to have a _reasonable time complexity_. 

In average, most implementations of this algorithm are capable of coming to [_O(n log(n))_](https://www.bigocheatsheet.com). It is implemented by many programming languages and platforms, being one of the most important algorithms for sorting.

![Image source: Wikipedia](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/fn68uggpqt7d7krk0hx9.gif)

## Implementation
Its implementation relies on a [divide-and-conquer algorithm](https://en.wikipedia.org/wiki/Divide-and-conquer_algorithm), where it works by selecting a "pivot" element from the list, then partitioning the list into two sub-arrays: the _elements that are smaller than pivot_ (smaller ones); and the _elements that are larger than pivot_ (larger ones), which are then sorted [recursively](https://en.wikipedia.org/wiki/Recursion_(computer_science)).

### Understanding the algorithm
Although it's especially important to understand this algorithm, its implementation is not that _hard_ to realize. 

Observe the following pseudo-code:
```
list = [3, 1, 2]

# it's arbitrary to choose the pivot, however the choice may 
#  impact on the final time complexity. In this guide, we'll 
#  choose the first element for didactic purposes
pivot = 3
remaining = [1, 2]

smaller, larger = partition(pivot, remaining)

-> repeat the process for the smaller list
-> repeat the process for the larger list
```
The above code only cares about partitioning the list into (un)sorted smaller and larger elements than _pivot_. If we repeat the process for each sub-list and **place the pivot in the middle**, we may end up having the following solution:
```
sort(smaller) + pivot + sort(larger)
```
Consider the above explanation just a Quickstart (pun intended) to understand the overall algorithm. 

For many, it's not straightforward to understand recursion, which is why this guide will try to dissecate the internals of Quicksort using [Test-driven development](https://en.wikipedia.org/wiki/Test-driven_development), a great technique and good practice that I use on my daily-basis, mainly when I'm trying to experiment and understand the _unknown_.

## Baby steps to the rescue
When doing TDD, we are encouraged to work in small cycles, or _baby-steps_, in order to fullfil the **red-green-refactor** iteration.

Such technique can help us to understand the Quicksort algorithm. Due to its nature of _divide-and-conquer_, it's a perfect fit for breaking down the steps through the TDD cycle.

First of all, we write a file named `quicksort_test.rb`, which will have our bootstrap code:
```ruby
require 'test/unit'                   
                                      
class QuicksortTest < Test::Unit::Case
  def test_sorting_empty_list
  end
end    
```  
This dummy code will start by sorting an empty array. Run `ruby quicksort_test.rb`. The output should be as follows:
```bash
Finished in 0.0004595 seconds.
-------------------------------------------------------------------------------
1 tests, 0 assertions, 0 failures, 0 errors, 0 pendings, 0 omissions, 0 notifications
100% passed
-------------------------------------------------------------------------------
2176.28 tests/s, 0.00 assertions/s
```
For now, we will write the _sort_ method in the same file for the sake of simplicity.
```ruby
require 'test/unit'                                   

def sort(list)
  []
end                      
                                                      
class QuicksortTest < Test::Unit::TestCase
  def test_sorting_empty_list
    assert_equal [], sort([])
  end                                    
end                                       
```
Run the test again and...YAY! 
![Alt Text](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/3u6m54b9whiy75wi26ap.jpg)

### Test dummy (but important!) scenarios
Yes, dummy scenarios are important. Don't underestimate them.
```ruby
def test_sorting_one_number_only
  assert_equal [42], sort([42])
end                                        
```
```ruby
def sort(list)            
  [42]                     
end                            
```
Pretty cool, uh? And dummy, I know...

Let's sort two numbers:
```ruby
def test_sorting_two_numbers
  assert_equal [8, 42], sort([42, 8])
end                                        
```
```ruby
def sort(list)            
  return [] if list.size == 0 # when the list is empty
  return list if list.size == 1 # when the list has one number

  [8, 42] # OMG!                      
end                            
```
Please, STAHP the _naiveness_!

Ok, let's start to write a more sophisticated test:
```ruby
def test_sorting_multiple numbers
  list = [5, 1, 4, 3, 2]                  
                                          
  assert_equal [1, 2, 3, 4, 5], sort(list)
end                                       
```
### The initial implementation
Suppose our input is an unsorted list:
```ruby
list = [5, 1, 4, 3, 2]  
```
We can start the implementation by choosing the pivot. Already mentioned that, in this guide, we will choose the first element. 

But there are reasons where [choosing the first element as the pivot](https://stackoverflow.com/questions/164163/quicksort-choosing-the-pivot) is not the best performant scenario. This is for learning purposes only, as you can later adapt the algorithm to use another approach for the pivot.
```ruby
pivot = list[0] # 5
```
Then, we should get the remaining list (all elements but the pivot):
```ruby
remaining = list[1..-1] # [1, 4, 3, 2]
```
### Partition recursively

Next step, think about the _partition_, which takes
* the pivot
* the remaining list
* an array of smaller elements than pivot (starts empty)
* an array of larger elements than pivot (starts empty)
```ruby
partition(pivot, remaining, [], [])
```

Why are we starting the smaller/larger arrays as empty? Because we will run this method _recursively_. 

#### A bit of recursion
Ok, but what's recursion? In short:
```ruby
def greet(name)
  puts "Hello #{name}"

  greet(name)
end
```
The above code will run forever, taking all of the memory's process, resulting in a [stack overflow](https://en.wikipedia.org/wiki/Stack_overflow).

We MUST place a stop condition before the recursive call, otherwise we would never stop it:
```ruby
def greet(name, times = 10)
  puts "Hello #{name}"
  return if times == 0

  # decreasing the variable times on the next iteration
  #  next, will be 9
  #  then 8, 7, 6...successively until 0 meets our stop condition
  greet(name, times -= 1) 
end
```
Now, the following example is how we WANT to call the partition. Hold on, I know the method doesn't yet exist, but we are doing baby-steps. A bit of pseudo-code:
```ruby
unsorted_list = [3, 1] 
pivot = 3
remaining = [1]

smaller, larger = partition(pivot, remaining, [], [])

smaller #=> [1]
larger #=> []
```
Let's write the first test for the partition in which there's no remaining numbers. A scenario where all the elements were already partitioned (not yet sorted).

Why we are writing this scenario first? Because we know that, when there's no more elements to partition, we can **stop the recursion** and return the accumulated _smaller_ and _larger_ sub-lists.

```ruby
def test_partition_no_remaining
  pivot     = 5
  remaining = []
  smaller   = [3, 1]
  larger    = [8, 6, 7]

  assert_equal [[3, 1], [8, 6, 7]], partition(pivot, remaining, smaller, larger)
end  
```
```ruby
def partition(pivot, remaining, smaller, larger)
  return [smaller, larger] if remaining == 0         
end
```
This first implementation means that, when the remaining list is empty, we can safely return the sub-arrays and stop the recursion.

Partition of two numbers:
```ruby
def test_partition_two_numbers                       
  pivot = 1                                    
  remaining = [5]  
                                                     
  assert_equal [[], [5]], partition(pivot, remaining, [], [])
end                                                  
```
Here, the remaining list is **not** empty, so we should think on "what is a partition".

We can think of a partition being a method/function that takes a pivot, a list and accumulated smaller/larger arrays related to pivot.

How can we do this recursively? 

* reducing the list
* accumulating the smaller/larger arrays

It's not an easy task to write a test that detach the logic of a recursive piece of code. But we can **isolate** the logic that is responsible to reduce and accumulate, and place it to another method.

So in the `partition` method, we'd have a separate call to the `next_partition` before the recursive call:
```ruby
def partition(pivot, list, smaller = [], larger = [])
  return [smaller, larger] if list.size == 0

  # Here, the method `next_partition` will return the reduced
  #  list (tail|remaining), the "next" smaller (accumulated) and the "next" larger (accumulated)
  tail, next_smaller, next_larger = next_partition(pivot, list, smaller, larger) 

  # Now, as we already have the stop condition in the first
  #  line, we can safely call this method recursively
  partition(pivot, tail, next_smaller, next_larger)        
end                                                  
```
Time to dissecate the `next_partition` before running the test. 

Let's then write a test scenario for the `next_partition` method:
```ruby
#=> next_partition(pivot, tail, smaller, larger)

list = [3, 5, 1, 4, 2]
pivot = 3
remaining = [5, 1, 4, 2]
smaller = []
larger = []

tail, next_smaller, next_larger = next_partition(pivot, remaining, smaller, larger)
 
assert_equal [1, 4, 2], tail
assert_equal [], next_smaller
assert_equal [5], next_larger
```
It may be confused at first but we can interpret this test as being: 

* the unsorted list is [3, 5, 1, 4, 2]
* we chose the pivot as being 3, the first element
* excluding the pivot, the remaining numbers are [5, 1, 4, 2]
* smaller starts empty
* larger starts empty

So, for the next iteration, we have the following data:

* reduced list (tail of remaining) is [1, 4, 2]
* accumulated (next) smaller ones than pivot (3) is []
* accumulated (next) larger ones than pivot (3) is [5]

#### Golden tip
Let's think: the `next_iteration` **should compare** the pivot with the first element of remaining list, and _decide if_ the element should be added to the accumulated smaller or larger arrays!

Let's keep on our iterations, one-by-one (manual recursion):
```ruby
next_tail = [1, 4, 2]
pivot = 3 # still our first pivot
next_smaller = []
next_larger = [5]

next_tail, next_smaller, next_larger = next_partition(pivot, next_tail, next_smaller, next_larger)

assert_equal [4, 2], next_tail
assert_equal [1], next_smaller
assert_equal [5], next_larger

## Next (final) iteration
next_tail = [4]
pivot = 3 # still
next_smaller = [1, 2]
next_larger = [5]

next_tail, next_smaller, next_larger = next_partition(pivot, next_tail, next_smaller, next_larger)

assert_equal [], next_tail
assert_equal [1, 2], next_smaller
assert_equal [4, 5], next_larger
```
Our recursion would stop here because there's no "next tail". All of the initial list was reduced.

In case we had unsorted smaller/larger arrays, we would repeat the process all over again for each sub-array.

Now, we could concatenate the results according to our initial sort logic:
```
# Partition result
* smaller: [1, 2]
* pivot: 3
* larger: [4, 5]

# Sorted = sort(smaller) + [pivot] + sort(larger)
[1, 2] + [3] + [4, 5]
```
YAY!
```
[1, 2, 3, 4, 5]
```
But we don't have the code yet. Looking at this pseudo-code examples, now it's easy to think on the `next_partition` logic:
```ruby
def next_partition(pivot, list, smaller, larger)
  head = list[0]                                
  tail = list[1..-1]                            
                                                
  if head <= pivot                              
    [tail, [head] + smaller, larger]            
  else                                          
    [tail, smaller, [head] + larger]            
  end                                           
end                                             
```
We can test more partition scenarios:
```ruby
def test_partition_three_numbers                 
  assert_equal [[], [6, 8]], partition(3, [8, 6])
end                                              
```
And, finally, sorting multiple numbers
```ruby
 def test_sorting_multiple_numbers                    
   assert_equal [1, 2, 3, 4, 5], sort([5, 3, 1, 2, 4])
   assert_equal [1, 2, 3, 4, 5], sort([3, 5, 1, 4, 2])
   assert_equal [1, 1, 3, 5, 8], sort([3, 1, 8, 1, 5])
 end                                                  
```
### Important note about performance
The examples above do not apply the “in-place” rule of Quicksort. 

Performance may be degraded in time complexity, but the main point here is to demonstrate the overall logic of Quicksort.

## Conclusion
The final code can be seen [in this Gist](https://gist.github.com/leandronsp/0d42a4487f25050ea3b672945328761f).

In this guide we covered the fundamentals of the Quicksort algorithm by using test-driven development. We also did learn a bit about recursion and how to test recursion (manually or not) by isolating the methof/function responsible for reducing/accumulating for the next iteration.

I hope it could be helpful somehow. Feel free to drop a message or comment. 

Follow me @leandronsp in dev.to, twitter and Linkedin.


