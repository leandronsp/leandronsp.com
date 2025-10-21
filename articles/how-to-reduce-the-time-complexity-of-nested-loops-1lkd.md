---
title: "How to reduce the time complexity of nested loops"
slug: "how-to-reduce-the-time-complexity-of-nested-loops-1lkd"
published_at: "2021-12-04 22:11:13Z"
language: "en"
status: "published"
tags: ["programming", "ruby", "algorithms"]
---

In this post I'll demonstrate a way to understand, analyse and reduce the time complexity on algorithms, specially on **nested loops**.

The examples will use Ruby but it can be translated to any programming language.

## Problem
Working throughout a variety of projects, it's not rare to stumble on pieces of code like the following, a "nested loop", which is a loop under another loop:
```ruby
for group in groups
  for user in users
    # do something with the group and user
  end
end
```
Analysing the above code, and assuming we have 100 groups and 100 users:

- for each group (100 times) we iterate over all users (100 times), which leads `100 * 100 = 10000` iterations
- each iteration [has a cost to the CPU](https://en.wikipedia.org/wiki/Central_processing_unit#Clock_rate), so the more iterations we do, the more our algorithm will perform worse
- if the lists grow over time, we can face serious performance issues on such algorithm

In [the Big O notation](https://www.freecodecamp.org/news/big-o-notation-why-it-matters-and-why-it-doesnt-1674cfa8a23c/) analysis, this algorithm may end up having a `squared` time complexity, or `O(n²)`, because `100 * 100 = 100²`. 

## Can we improve it?
With regard to reducing the time complexity of `O(n²)` **squared**, we can work to reduce to `O(n)` **linear** or `O(log(n))` in most cases, which would make our algorithm to perform faster. 

There are some category of problems where it's not possible to reduce in optimal ways, but in our example it's perfectly possible to reduce. 

Let's see how to improve it. 

## Reducing iterations
Remember that at this point, our algorithm will perform 10.000 iterations, `100²`:
```ruby
groups = [1, 2, ....100]
users  = [1, 2, ....100]

for group in groups
  for user in users
...
```
A naive solution is to remove the nested loop:
```ruby
for group in groups
  # do something with group and user
  # now we are missing the user, but we need to fetch the user information from another data structure
end
```
- the algorithm will perform only 100 iterations, much faster
- which means it's **linear**, or `O(n)`

However our algorithm is lo longer working, because we have to fetch the user information *from inside the groups loop*. 

Ideally, for each group we want the fetch the user information in **constant time**, no matter how big is the user's list. 

## Long live the hash tables
In computer science, [data structures](https://www.geeksforgeeks.org/data-structures/) are a VERY important topic to study and understand. In order to fetch the user information in constant time `O(1)`, we can use a [hash table](https://en.wikipedia.org/wiki/Hash_table). 

Ruby provides this data structure out of the box, which is called [Hash](https://ruby-doc.org/core-3.0.3/Hash.html).

### Building a hash
How can we build a hash containing all the information *required* in the groups loop? We must **iterate over all users** and *build the hash* with the needed information.

Such technique is widely used for creating structure like "indices" where the information is accessed via a **key** in constant time `O(1)`. Example:
```ruby
users_idx = {}

for user in users
  users_idx[user[:id]] = ...
end
```
Then wherever we have to fetch the user information, we are able to do it be accessing via `users_idx` and the respective keys. 

## Putting all together
Continuing on the challenge to reduce the iterations on our algorithm, we have to perform the following steps:

- build the "index" with the information to be accessed later
- iterate over the loop and fetch the additional information from the previously created "index"
```ruby
users_idx = {}

for user in users
  users_idx[user[:group_id]] = ...
end

for group in groups
  user_information = users_idx[group[:id]]
  # do something with group AND user information
end
```
But wait, two loops? Isn't it still **squared** `O(n²)`? Let's compare it.

The first solution performs `100 * 100 = 10.000` iterations, whereas the second performs *100 iterations for building the index plus 100 iterations* for iterating over groups, `100 + 100 = 200`. Put simply:
```bash
nested loop:    100 * 100 = 10.000
index AND loop: 100 + 100 = 200
```

It's still WAY lower than the initial `10.000`. We could write even more loops, three, four, five times. It doesn't matter, it will be **linear** `O(n)`, because in terms of time complexity, `O(n) = O(2n) = O(3n)` and so on...

## Comparing both solutions
In [this Gist](https://gist.github.com/leandronsp/70f9effd63007a9d55d29527788d3181) I created the dummy data and the benchmark in order to compare both solutions. 

For small list sizes, there are no practical differences. But with bigger lists, the improvement is perceived.

Here are the results, on **how faster is using the index**:
```bash
10 groups   | 10 users   => 2x   faster
100 groups  | 100 users  => 3x   faster
100 groups  | 100 users  => 31x  faster
1000 groups | 1000 users => 70x  faster
5000 groups | 5000 users => 510x faster
```
## Conclusion
This post is a demonstration on how to analyse, understand and reduce time complexity on algorithms, specifically when we face situations of *nested loops*. 

Most of times, instead of trying to look to another complex solutions such as caching and even more complex ones, understanding algorithms analysis can help us to write good and cheaper solutions. 

Moreover, in case the loops perform **database queries using ORM**, many nested loops can be improved by just using **SQL JOINS**. 






