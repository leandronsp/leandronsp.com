---
title: "Understanding the basics of Smart Pointers in Rust"
slug: "understanding-the-basics-of-smart-pointers-in-rust-3dff"
published_at: "2023-11-01 04:15:27Z"
language: "en"
status: "published"
tags: ["rust", "datastructures"]
---

In today's post we'll delve into the basics of smart pointers in Rust, while we build from scratch a simple linked list - starting from a singly linked list and then evolving to a doubly one. 

---

## Prelude, intro to Rust

It's not intended to be an introduction about Rust. For that, you can follow along [this blogpost series](https://dev.to/mfcastellani/series/23318) by [@mfcastellani](https://dev.to/mfcastellani).

Also, you can read [his book](https://www.casadocodigo.com.br/products/livro-rust) (pt-BR). Moreover, I have a [live coding video](https://www.youtube.com/watch?v=6VSgMbFNUuQ) where I explored the Rust fundamentals by covering an introduction to Rust, data types, functions, ownership, references, structs/enums and error handling.

Another content about Rust I higly recommend is presented on [this Youtube channel](https://www.youtube.com/watch?v=zWXloY0sslE) by Bruno Rocha, which creates great videos about Rust as well (pt-BR).

> Please note that this post you are currently reading was written during a [live coding session (pt-BR)](https://www.youtube.com/watch?v=bdZe0LjDUyk) where you can follow the process I use to write blogposts in general and how I created this particular one. It's a novel format I'm experimenting with to share content.

However, if you are looking for introdutory content in english only, the Youtube channel [Let's get Rusty](https://www.youtube.com/@letsgetrusty) provides great content on Rust from basics to advanced.

---

No more introduction, let's embark on this journey of **Smart Pointers in Rust**.

---

## Table of Contents

- [First things first](#first-things-first)
- [A linked list using Rust](#a-linked-list-using-rust)
- [Meet the Box smart pointer](#box)
- [Shared ownership using Rc](#rc)
- [Interior mutability with RefCell](#refcell)
- [Weak references on a circular linked list](#thinking-about-a-circular-linked-list)

---

## 👉 First things first
Rust employs a mechanism for dealing with memory management where it prevents dangling references, double free error and other problems related to memory management.

This mechanism is called "ownership" and through [RAII](https://en.wikipedia.org/wiki/Resource_acquisition_is_initialization) (Resource Acquisition Is Initialization), it follows three basic rules:

* Each value in Rust has a single owner
* There are only *one* owner at a time
* When the owner's scope is finished, its associated value is dropped and invalidated

When we need to transfer ownership, in case the value is in the stack (fixed-sized types), Rust performs a *Copy*:

> I'm assuming that all code snippets within this post are being executed inside a `fn main() {}` function

```rust
let age = 20;
let copied_age = age;

println!("copied_age: {}", copied_age);
println!("age: {}", age); // age is still valid because Rust performs a "Copy" for data in the stack
```
As for _dynamically-sized_ types, which live in the heap, Rust performs a *Move*:

```rust
let name = String::from("John");
let other_name = name;

println!("other_name: {}", other_name);
println!("name: {}", name); // name is no loger valid because Rust performs a "Move"

// Error:
// error[E0382]: borrow of moved value: `name`
```

*Copy* literally copies the data in the stack, while the *Move* operation transfers ownership, which means that the former owner is no longer the owner and its reference is completely dropped.

---

## 👉 A Linked List using Rust
A linked list is a data structure which represents a collection of nodes where each node points to the next node. This is basically a **singly linked list**.


![a singly linked list](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/n2et97dstkxf8y265rsv.png)

Also, we can build a linked list where each node points to the previous node as well. In this case, such a list is called **doubly linked list**.


![a doubly linked list](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/eq1gutt2osbn8vwiv5ew.png)

### 🔵 A Singly Linked List

The first version of our linked list will be a singly one. As we evolve to a doubly linked list, we'll bring Rust concepts about ownership, references and smart pointers.

We start by modeling the Node:

```rust
struct Node {
    value: i32,
    next: Node
}
```
We are bound to situations where the **next** pointer points to "nothing", or simply a `null` pointer when the list reaches the end, commonly seen in a variety of programming languages.

But Rust has no `null` pointers. That said, we can represent the `next` pointer by using the enum **Option**, which in Rust gives us two possibilities of types:

* None (the end of the list)
* Some(node)

```rust
struct Node {
    value: i32,
    next: Option<Node>
}

let head = Node { value: 1, next: None };
assert_eq!(1, head.value);
assert_eq!(None, head.next);
```
The above code is not yet compiling:

```
error[E0072]: recursive type `Node` has infinite size
 --> src/main.rs:2:5
  |
2 |     struct Node {
  |     ^^^^^^^^^^^
3 |         value: i32,
4 |         next: Option<Node>
  |                      ---- recursive without indirection
  |
help: insert some indirection (e.g., a `Box`, `Rc`, or `&`) to break the cycle
  |
4 |         next: Option<Box<Node>>
  |                      ++++    +
```

The Rust compiler is saying that _Node_ has unknown size at compile-time and as such it can't be determined, because the "next" pointer points to another Node which points to another Node and so on, infinitely. 

This is a **recursive type**.

In order to solve this problem, we have to help the Rust compiler to use some abstraction which can allocate data on the heap and determine the size of the Node at compile-time, resolving the recursive type.

Such abstraction is called **Box**, which is a smart pointer in Rust.

---

## 👉 Box
By using Box, we want to allocate the data on the heap. 

Also, Box has a known size at compile-time. Being a pointer, the _size of the Box is the pointer size_, which makes it a good fit for recursive types.

The following code compiles sucessfully:

```rust
#[derive(Debug, PartialEq)]
struct Node {
    value: i32,
    next: Option<Box<Node>>
}

let head = Node { value: 1, next: None };

assert_eq!(1, head.value);
assert_eq!(None, head.next);
```

What if we add one more node, called "tail"?

```rust
let tail = Node { value: 2 next: None };
let head = Node { value: 1, next: Some(tail) };
```
As always (the Rust compilers always wins), it won't compile:
```
---- ^^^^ expected `Box<Node>`, found `Node`
```
We have to wrap the tail in a _Box_:
```rust
struct Node {
    value: i32,
    next: Option<Box<Node>>
}

let tail = Box::new(Node { value: 2, next: None });
let head = Node { value: 1, next: Some(tail) };

assert_eq!(1, head.value);
assert_eq!(2, head.next.unwrap().value);
```
* We wrap the tail box in an Option (Some)
* The _head.next_ points to an **Option**. Because it's the enum Option, we have to call `unwrap` to fetch the underlying value

Let's go further in the example and implement a **doubly linked list**, by specifying the _prev_ attribute on the Node struct.

### 🔵 A Doubly Linked List

```rust
struct Node {
    value: i32,
    next: Option<Box<Node>>,
    prev: Option<Box<Node>>,
}

let tail = Box::new(Node { value: 2, prev: None, next: None });
let head = Node { value: 1, prev: None, next: Some(tail) };
```
* the `head.prev` points to `None`
* the `tail.prev` points to `None` (at this moment...)

In order to change the `tail.prev`, we have to mutate its underlying value, from `None` to `Some(head)`. May we change the source code:

```rust
let mut tail = Box::new(Node { value: 2, prev: None, next: None });
let head = Box::new(Node { value: 1, prev: None, next: Some(tail) });

tail.prev = Some(head); // mutating the tail.prev
```

And...

```
error[E0382]: use of moved value: `head.next`
  --> src/main.rs:14:15
   |
9  | let head = Box::new(Node { value: 1, prev: None, next: Some(tail) });
   |     ---- move occurs because `head` has type `Box<Node>`, which does not implement the `Copy` trait
10 |
11 | tail.prev = Some(head);
   |                  ---- value moved here
...
14 | assert_eq!(2, head.next.unwrap().value);
   |               ^^^^^^^^^ value used here after move
```


![a very very explosion](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/znv09sx9a23qp53f4p3k.gif)

_Welcome to the ownership saga in Rust!_

Let's clarify some points here:

First, a Box has **single ownership**, meaning that each value holds one owner at a time. Here, in this line:

```rust
let head = Box::new(Node { value: 1, prev: None, next: Some(tail) }); // value was moved here
```
`Tail` has been *moved*, that's why we cannot use it later, due to ownership rules. 

To fix that, we can make use of the method `clone` implemented in the Box, which will perform a deep copy (clone) of the value in the heap:

```rust
let head = Box::new(Node { value: 1, prev: None, next: Some(tail.clone()) });

tail.prev = Some(head);
```

Additionally, in the following line, `tail.prev` takes ownership of the value of `head`, so the value was moved to the new owner:
```rust
tail.prev = Some(head); // value as moved here
```
Now the solution is calling `clone` as we did in the `tail`:

```rust
tail.prev = Some(head.clone());
```
Here's the current solution for a doubly linked list using Box:
```rust
#[derive(Clone)]
struct Node {
    value: i32,
    next: Option<Box<Node>>,
    prev: Option<Box<Node>>,
}

let mut tail = Box::new(Node { value: 2, prev: None, next: None });
let head = Box::new(Node { value: 1, prev: None, next: Some(tail.clone()) });

tail.prev = Some(head.clone());

assert_eq!(1, head.value);
assert_eq!(2, tail.value);
assert_eq!(2, head.next.unwrap().value);
assert_eq!(1, tail.prev.unwrap().value);
```
By using Box, we've solved the problem but we may end up wasting memory, as demonstrated in the following picture:

![box wasting memory on linked list](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/aj2tz2i7kcpq0cdjzmjb.png)

At this point in time, we have the following abstraction model about ownership, which is single and shares no value in the heap (Box):

![box single ownership](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/6fkmdx1czv6jlulzwqtj.png)

We have to find a way to overcome the single ownership problem. What about _not taking ownership at all_, by using **References** instead?

### 🔵 References & Lifetimes
References in Rust do not take ownership, as they allow to work with the reference of the data which is allocated in the heap.

This way, references can be "borrowed" without taking ownership, and as such they are bound to a mechanism called **borrow checker**.

```rust
let name = String::from("John"); // value in the heap. name is the owner
let other_name = &name; // not a move. other_name has a reference to the value in the heap. name is still the owner

println!("other_name: {}", other_name);
println!("name: {}", name);
```
The above code compiles successfully. The borrow checker ensures that the reference is pointing to some valid value in the heap, thus not "moving" the ownership.

Let's change the code to use References instead of Box:

```rust
struct Node {
    value: i32,
    next: Option<&Node>,
}

let tail = Node { value: 2, next: None };
let head = Node { value: 1, next: Some(&tail) };
```
* The `next` is an enum Option which wraps a *reference to another Node*
* The `head.next` is now using `Some(&tail)` which is a reference to the tail (other node), instead of a Box which takes ownership

But this code won't compile yet:

```
error[E0106]: missing lifetime specifier
 --> src/main.rs:4:18
  |
4 |     next: Option<&Node>,
  |                  ^ expected named lifetime parameter
  |
help: consider introducing a named lifetime parameter
  |
2 ~ struct Node<'a> {
3 |     value: i32,
4 ~     next: Option<&'a Node>,
```
Each reference has an implicit lifetime in the Rust compiler. In our example of a linked list, the compiler can't determine the lifetime of the `next` pointer because it points to another Node which could have a different lifetime.

Because the borrow checker prevents dangling references by using lifetimes, we have to help the compiler by annotating lifetimes in the struct definition:

```rust
struct Node<'a> {
    value: i32,
    next: Option<&'a Node<'a>>,
}

// or, using generics

struct Node<'a, T> {
    value: T,
    next: Option<&'a Node<'a, T>>,
}
```

_It's quite verbose, I know._ 😬

Now the version of a singly linked list using references:

```rust
#[derive(Debug, PartialEq)]
struct Node<'a, T> {
    value: T,
    next: Option<&'a Node<'a, T>>,
}

let tail = Node { value: 2, next: None };
let head = Node { value: 1, next: Some(&tail) };

assert_eq!(1, head.value);
assert_eq!(2, head.next.unwrap().value);
assert_eq!(None, tail.next);
```
* The `Node` and its `next` (reference) node has a lifetime `'a`
* we can use tail/head even after they been applied to the repective nodes, because we took no ownership

But a singly linked list is not enough. We want a doubly one:

```rust
#[derive(Debug, PartialEq)]
struct Node<'a, T> {
    value: T,
    next: Option<&'a Node<'a, T>>,
    prev: Option<&'a Node<'a, T>>,
}

let mut tail = Node { value: 2, prev: None, next: None };
let head = Node { value: 1, prev: None, next: Some(&tail) };

tail.prev = Some(&head);

assert_eq!(1, head.value);
assert_eq!(2, head.next.unwrap().value);
assert_eq!(None, tail.next);
```
We run the code and...
```
error[E0506]: cannot assign to `tail.prev` because it is borrowed
  --> src/main.rs:12:1
   |
10 | let head = Node { value: 1, prev: None, next: Some(&tail) };
   |                                                    ----- `tail.prev` is borrowed here
11 |
12 | tail.prev = Some(&head);
   | ^^^^^^^^^^^^^^^^^^^^^^^ `tail.prev` is assigned to here but it was already borrowed
13 |
14 | assert_eq!(1, head.value);
   | ------------------------- borrow later used here
```

![yet another explosion](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/khry9qxk07s1com4hsik.gif)

_What happened here?_

The **borrow checker** checks at compile-time that we can have only *one mutable reference* at a time in the same scope. 

Our example has a scenario where the `tail.prev` is **mutable** and is already borrowed to the `head`.

That's why we simply *can't implement a doubly linked list* in Rust using references (AFAIK).

Then we should go back to ownership. But what about having a "shared ownership" instead of a "single ownership" like in the Box example?

![ideal scenario for shared ownerhsip](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/p2l5w1f09rr5oyx3bsk0.png)

Enter _Rc_.

---

## 👉 Rc 
Rc stands for **reference counting**, which performs heap allocation, like a Box. 

But unlike Box, it enables _shared ownership_, where one or more owners point to the same value in the heap. Each time an owner _comes to the party_, it increments the counter. When the owner goes out of scope, it decrements the counter. 

Only when all owners are dropped, then the Rc is entirely dropped as well freeing the underlying data from the heap.

Rc brings one caveat: **the reference must be immutable**. Otherwise, it would lead to double-free errors.

```rust
use std::rc::Rc;
let name = Rc::new(String::from("John"));

assert_eq!(1, Rc::strong_count(&name));

let cloned_name = Rc::clone(&name);

assert_eq!(2, Rc::strong_count(&name));
assert_eq!("John", *cloned_name); // Dereference
assert_eq!("John", *name); // Dereference
```

Each time an `Rc` is called `data.clone()` or by using `Rc::clone(&data)`, the data is not being copied on the heap (deep copy). Only the reference is copied and the strong count of references is incremented.

The original owner is still valid after _cloning_ multiple Rc references.

Let's implement the singly linked list using Rc instead of references or Box:

```rust
use std::rc::Rc;

struct Node<T> {
    value: T,
    next: Option<Rc<Node<T>>>
}
```
Cool, now let's add some data to our linked list:

```rust
let tail = Rc::new(Node { value: 2, next: None });
let head = Rc::new(Node { value: 1, next: Some(tail) });

assert_eq!(1, head.value);
assert_eq!(2, head.next.clone().unwrap().value);
```
It simply works! _How cool is that?_

Time to evolve to a doubly linked list using Rc:

```rust
use std::rc::Rc;

struct Node<T> {
    value: T,
    next: Option<Rc<Node<T>>>,
    prev: Option<Rc<Node<T>>>,
}

let tail = Rc::new(Node { value: 2, prev: None, next: None });
let head = Rc::new(Node { value: 1, prev: None, next: Some(Rc::clone(&tail)) });

tail.prev = Some(Rc::clone(&head));

assert_eq!(1, head.value);
assert_eq!(2, head.next.clone().unwrap().value);
```
Instead of deep copy like in Box, the Rc smart pointer only increments the reference counter. Check `Rc::clone(&head)` and `Rc::clone(&tail)`.

But it won't compile:

```
error[E0594]: cannot assign to data in an `Rc`
  --> src/main.rs:24:5
   |
24 |     tail.prev = Some(Rc::clone(&head));
   |     ^^^^^^^^^ cannot assign
```
_Cannot assign data in an Rc!_

Even if we used `let mut tail = ...`, Rc is now allowed to mutate because **all references in Rc are immutable**.

How about _mutating the underlying data_ even if the reference is immutable? We could achieve that by using "unsafe Rust", where **some checks could be done at runtime instead of compile-time.**

Even better, what about Rust providing an abstraction which uses unsafe capabilities under the hood but wrapping in a safe API?

Yes, _we are talking about RefCell_.

---

## 👉 RefCell
**RefCell** is an smart pointer which provides a safe API to mutate underlying data (on the heap) but through immutable references. 

This approach is called **interior mutability**.

The borrow checker won't perform checks, but Rust will check them at runtime. In case we cause a problem regarding mutable data, the program will crash and stop (`panic!`).

```rust
use std::cell::RefCell;

let name = RefCell::new(String::from("John"));
name.borrow_mut().push_str(" Doe");

assert_eq!("John Doe", *name.borrow());
```
* RefCell wraps a String in the heap
* The reference is immutable
* Through `borrow_mut`, we get `RefMut<T>` to mutate the underlying data
* Through `borrow`, we get a `Ref<T>` to read the underlying data

In a RefCell, we can have multiple borrows for reading or **only one borrow mutable** for writing.

With that in place, time to implement our doubly linked list using Rc + RefCell:

```rust
    use std::rc::Rc;
    use std::cell::RefCell;

    struct Node<T> {
        value: T,
        next: Option<Rc<RefCell<Node<T>>>>,
        prev: Option<Rc<RefCell<Node<T>>>>,
    }

    let tail = Rc::new(RefCell::new(Node { value: 2, prev: None, next: None }));
    let head = Rc::new(RefCell::new(Node { value: 1, prev: None, next: Some(Rc::clone(&tail)) }));

    tail.borrow_mut().prev = Some(Rc::clone(&head));

    assert_eq!(1, head.borrow().value);
    assert_eq!(2, head.borrow().next.clone().unwrap().borrow().value);
    assert_eq!(1, tail.borrow().prev.clone().unwrap().borrow().value);
```
Our Node model now is composed of a value and a `next` pointer which basically is:

* an enum Option
* which wraps an Rc (shared ownership)
* which wraps an RefCell (for interior mutability)
* which points to other Node
* and so on and on and on...

With RefCell, every time we have to write, we use `borrow_mut`, and every time we have to read, we use `borrow`.

_How wonderful is that?_

---

## 👉 Thinking about a circular linked list
In order to make our linked list to be circular, we have to make `tail.next` point to the `head`:

```rust
use std::rc::Rc;
use std::cell::RefCell;

struct Node<T> {
    value: T,
    next: Option<Rc<RefCell<Node<T>>>>,
    prev: Option<Rc<RefCell<Node<T>>>>,
}

let tail = Rc::new(RefCell::new(Node { value: 2, prev: None, next: None }));
let head = Rc::new(RefCell::new(Node { value: 1, prev: None, next: Some(Rc::clone(&tail)) }));

tail.borrow_mut().prev = Some(Rc::clone(&head));
tail.borrow_mut().next = Some(Rc::clone(&head));

....
assert_eq!(1, tail.borrow().next.clone().unwrap().borrow().value);
```
What's the challenges of a circular linked list using Rc?

### 🔵 Strong references may never reach zero
Remember that the Rc underlying data is dropped and invalidated when the `Rc::strong_count` reaches zero.

But in a circular linked list, for instance, we may have a **cyclic reference**, which in turn will never make the `strong_count` to reach zero, **leading to memory leaks**.

![cyclic references](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/8z6cj08ae1c2788j1uva.png)

In such a scenario, the `tail.next` is a "weak" reference. Rust provides a way for `Rc` to have a different counter, called `weak_count`. 

Thus, the weak counter will not be used for deciding when Rust should drop the value from the heap.

For solving this problem, Rc brings a method called `downgrade`, which **does not involve ownership at all** and transforms a strong reference into a weak one.

This smart pointer is called **Weak** and it's a weak reference in an _Rc_.

Let's see a basic usage of downgrading or upgrading references in an Rc (see below in the comments):

```rust
use std::rc::Rc;

// Just a strong reference
let name = Rc::new(String::from("John"));
assert_eq!(1, Rc::strong_count(&name));

// Cloning Rc is a strong reference
let _other_name = Rc::clone(&name);
assert_eq!(2, Rc::strong_count(&name));
assert_eq!(0, Rc::weak_count(&name));

// Downgrade makes it a weak reference
let weak_name = Rc::downgrade(&name);
assert_eq!(2, Rc::strong_count(&name));
assert_eq!(1, Rc::weak_count(&name));

// Upgrade makes it a strong reference again
let upgraded_name = weak_name.upgrade().unwrap();
assert_eq!(3, Rc::strong_count(&name));
assert_eq!(1, Rc::weak_count(&name));
assert_eq!("John", *upgraded_name);
```

In a linked list, the `prev` should be the "weak" reference because starting from the head, the Rc has already strong references that make the entire linked list through the `next` pointers.

Now, let's explore the final solution of this entire blogpost, using `Rc` for **shared ownership**, `RefCell` for **interior mutability** and `Rc::Weak` for preventing cyclic references in a linked list:

```rust
use std::rc::Rc;
use std::cell::RefCell;
use std::rc::Weak;

struct Node<T> {
    value: T,
    next: Option<Rc<RefCell<Node<T>>>>,
    prev: Option<Weak<RefCell<Node<T>>>>,
}

let tail = Rc::new(RefCell::new(Node { value: 2, prev: None, next: None }));
let head = Rc::new(RefCell::new(Node { value: 1, prev: None, next: Some(Rc::clone(&tail)) }));

// Weak reference (no ownership)
tail.borrow_mut().prev = Some(Rc::downgrade(&head));

// Strong reference (shared ownership)
tail.borrow_mut().next = Some(Rc::clone(&head));

assert_eq!(1, head.borrow().value);
assert_eq!(2, head.borrow().next.clone().unwrap().borrow().value);
assert_eq!(1, tail.borrow().prev.clone().unwrap().upgrade().unwrap().borrow().value);
assert_eq!(1, tail.borrow().next.clone().unwrap().borrow().value);
```

---

## Wrapping Up
In this very post we demonstrated the fundamentals smart pointers in Rust and the problems they solve about memory management.

This post was written during a [live coding](https://www.youtube.com/watch?v=bdZe0LjDUyk) while building a doubly linked list by explaining fundamental concepts of ownership, references, borrowing and smart pointers.

I hope you had fun while learning a bit more about the _Rust ownership mental model_ as I did.

**Cheers!**

---

## References

https://doc.rust-lang.org/book/

https://en.wikipedia.org/wiki/Smart_pointer

https://ricardomartins.cc/2016/06/08/interior-mutability

https://www.youtube.com/watch?v=6VSgMbFNUuQ


