---
title: "Building a dead simple background job in Rust"
slug: "building-a-dead-simple-background-job-in-rust-4m1d"
published_at: "2023-11-12 14:43:13Z"
language: "en"
status: "published"
tags: ["rust"]
---

In today's post we'll explore how to create a basic background job in Rust, simulating Rust channels with a Vector-based queue.

---

## First things first
Generally, a background job operates on one or more threads that continuously consume messages from a queue.

In this post, we'll use a Vector to represent our queue.

This Vector is an instance of the standard Rust library implementation known as **VecDeque**. [VecDeque](https://doc.rust-lang.org/std/collections/struct.VecDeque.html) is a double-ended queue that acts as a growing ring buffer.

## Data model
To make our solution more organized, we can define 3 structs:

### Transmitter
The transmitter (tx) holds an **store**, which is the queue (Vector) encapsulated by a Arc/Mutex; and an **emitter**, which is a Condvar, used for synchronization based on a condition.

### Receiver
The receiver (rx), pretty much like the transmitter, also holds a store and an emitter.

### Channel
Channel holds a transmitter and a receiver.

```rust
struct Transmitter<T> {
    store: Arc<Mutex<VecDeque<T>>>,
    emitter: Arc<Condvar>,
}

struct Receiver<T> {
    store: Arc<Mutex<VecDeque<T>>>,
    emitter: Arc<Condvar>,
}

struct Channel<T> {
    tx: Transmitter<T>,
    rx: Receiver<T>,
}
```

## What is an Arc in Rust?
The queue (VecDeque) is going to be shared across the channel for one or more threads. 

In Rust, such problem requires shared ownership addressed by a **reference counter** (Rc), but since we are in a multi-thread scenario, Rc is not thread-safe, that's why we need an _atomic reference counter_, or simply **Arc**, which is indeed thread-safe.

> You can learn more details about smart pointers by reading my post on [Understanding the basics of smart pointers in Rust](https://leandronsp.com/articles/understanding-the-basics-of-smart-pointers-in-rust-3dff)

## How about Mutex?
Since Arc is a reference counter, its references are immutable. For mutability in the underlying data, we need _interior mutability_ using RefCell.

> My mentioned post about smart pointers also covers interior mutability, check it out for further details

In the same as Rc, _RefCell is not thread-safe_. For a thread-safe scenario, we need to synchronize access to data using _locks_. That's where **mutual exclusion** (Mutex) comes in.

## Okay, and Condvar? What the heck is that?
**Condvar** is a primitive for synchronization in concurrent systems where we can put a thread to "wait" (suspended) until a given condition is met.

For blocking queues, we basically want the following condition (pseudo-code):

```
queue = some_array
mutex = os_lock
emitter = os_condvar

// Thread is suspened until the array gets some data
// There's no CPU consume
while queue is empty
   emitter.wait(mutex)
end

// Someone emitted a signal
data = queue.pop
```
In other process:
```
queue.push(data)
emitter.signal
```

## Data modeling implementation
Now, let's implement the methods `send` and `recv` (receive) in our simulated channel.

### Transmitter
The transmitter (tx) will have a method called **send**, which basically:

* locks the shared queue (`store.lock().unwrap()`)
* pushes data to the queue (`push_back(data)`)
* emits a signal (`emitter.notify_one`) to notify some suspended thread that is waiting for data in the queue

```rust
impl<T> Transmitter<T> {
    fn send(&self, data: T) {
        self.store.lock().unwrap().push_back(data);
        self.emitter.notify_one();
    }
}
```

### Receiver
The receiver (rx) has a method called **recv** (short for _receive_) which:

* creates a lock in the shared queue (`store.lock().unwrap()`)
* suspends the current thread until the condition is met, in other words, **while the queue is empty**, the thread is suspended in the operating system, thus not consuming CPU (`emitter.wait`)
* once the thread is awaken, it can pops the data from the queue (`store.pop_front()`)

```rust
impl<T> Receiver<T> {
    fn recv(&self) -> Option<T> {
        let mut store = self.store.lock().unwrap();

        while store.is_empty() {
            store = self.emitter.wait(store).unwrap();
        }

        store.pop_front()
    }
}
```
Moreover, the Receiver struct can have an extra method called **try_recv** which does not block the thread, not using the Condvar condition:

```rust
fn try_recv(&self) -> Option<T> {
    self.store.lock().unwrap().pop_front()
}
```

### Channel
Once the Transmitter and Receiver are already implemented, the implementation of Channel is a piece of cake:

```rust
impl<T> Channel<T> {
    fn new() -> Self {
        let store = Arc::new(Mutex::new(VecDeque::new()));
        let emitter = Arc::new(Condvar::new());

        Channel {
            tx: Transmitter { store: Arc::clone(&store), emitter: Arc::clone(&emitter) },
            rx: Receiver { store: Arc::clone(&store), emitter: Arc::clone(&emitter) },
        }
    }
}
```
Note that both Mutex and Condvar are encapsulated in an Arc (atomic reference counter), because we have to share them across tx and rx at the same time.

### Main
The **main** function can me implemented as follows:

* create a channel and binds the **tx** and **rx** respectively
* the channel holds a shared Mutex/VecDeque and a Condvar
* tx is used to send data to the channel
* rx is used from the inner thread to receive data from the channel

```rust
fn main() {
    // Initialize channel
    let channel = Channel::new();
    let (tx, rx) = (channel.tx, channel.rx);

    // Push data to the channel
    tx.send("Some job to do: 1");
    tx.send("Another job: 2");

    // Process the channel
    let worker = thread::spawn(move || {
        loop {
            let job = rx.recv(); // we could use try_recv too

            match job {
                Some(job) => println!("Job: {}", job),
                None => break,
            }
        }
    });
    
    // Push more data to the channel
    tx.send("Yet another job");

    worker.join().unwrap();
}
```

We run the code and, **Yay**, everything is working as expected:

```
Job: Some job to do: 1
Job: Another job: 2
Job: Yet another job
```

---

## Rust channels for the rescue
You may be wondering:

> Hey Leandro, why doesn't Rust bring all this stuff already built-in? Do we really need to implement a raw queue and use synchronization primitives on our own every time we want to create a channel for threads? 

_Today is your lucky day_. Indeed Rust brings **Channels**, which employ the same techniques described in this very post, but more robust, of course:

```rust
use std::sync::mpsc;
use std::thread;

fn main() {
    // Initialize channel
    let (tx, rx) = mpsc::channel();

    // Push data to the channel
    tx.send("Some job to do: 1").unwrap();
    tx.send("Another job: 2").unwrap();

    let worker = thread::spawn(move || {
        loop {
            let job = rx.recv();

            match job {
                Ok(job) => println!("Job: {}", job),
                Err(_) => break,
            }
        }
    });

    // Push more data to the channel
    tx.send("Yet another job").unwrap();

    worker.join().unwrap();
}
```

* `mpsc` stands for **multiple producers, single consumer**
* `mpsc::channel` creates a channel with a internal shared queue and returns a transmitter (tx) and a receiver (rx)
* pretty much like our custom implementation, `tx.send` sends data to the channel, whereas `tx.recv` reads/pops data from the channel

_How cool is that_?

---

## References

https://doc.rust-lang.org/book/ch16-00-concurrency.html

https://doc.rust-lang.org/std/vec/struct.Vec.html

https://doc.rust-lang.org/std/collections/struct.VecDeque.html

https://leandronsp.com/articles/understanding-the-basics-of-smart-pointers-in-rust-3dff
