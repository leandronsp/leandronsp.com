---
title: "You don't need Kafka: Building a message queue with only two UNIX signals"
slug: "you-dont-need-kafka-building-a-message-queue-with-only-two-unix-signals"
published_at: "2025-10-21 00:06:14Z"
language: "en"
status: "published"
tags: ["kafka", "unix"]
---

Have you ever asked yourself what if we could replace any message broker with a very simple one using only two UNIX signals? Well, I'm not surprised if you didn't. But I did. And I want to share my journey of how I achieved it.

If you want to learn about UNIX signals, binary operations the easy way, how a message broker works under the hood, and a bit of Ruby, this post is for you.

And if you came here just because of the clickbait title, I apologize and invite you to keep reading. It'll be fun, I promise.

![image](/uploads/3491.png)

## It's all about UNIX

A few days ago, I saw some discussion on the internet about how we could send messages between processes. Many people think of sockets, which are the most common way to send messages, even allowing communication across different machines and networks. Some don't even realize that pipes are another way to send messages between processes:
```bash
$ echo 'hello' | base64
aGVsbG8K
```
Here's what's happening:
* The process `echo` is started with the content "hello"
* `echo` is a program that prints the message to _STDOUT_
* Through the pipe, the content in _STDOUT_ is **sent** directly to the _STDINT_ of the `base64` process
* The `base64` process encodes its input to Base64 and then puts the result in _STDOUT_

Note the word "send". Yes, anonymous pipes are a form of **IPC (Inter-process communication).** Other forms of IPC in UNIX include:
* named pipes (mkfifo)
* sockets
* regular files
* or even a simple **signal**

## UNIX signals

According to [Wikipedia](url):
> A UNIX signal is a standardized message sent to a program to trigger specific behaviour, such as quitting or error handling

There are many signals we can send to a process, including:
* SIGTERM - sends a notification to the process to terminate. It can be "trapped," which means the process can do some cleanup work before termination, like releasing OS resources and closing file descriptors
* SIGKILL - sends a termination signal that cannot be trapped or ignored, forcing immediate termination
* SIGINT - the interrupt signal, typically sent when you press `Ctrl+C` in the terminal. It can be trapped, allowing the process to perform cleanup before exiting gracefully
* SIGHUP - the hangup signal, originally sent when a terminal connection was lost. Modern applications often use it to reload configuration files without restarting the process
* SIGQUIT - similar to SIGINT but also generates a core dump for debugging
* SIGSTOP - pauses (suspends) a process. Cannot be trapped or ignored
* SIGCONT - resumes a process that was paused by _SIGSTOP_
* SIGCHLD - sent to a parent process when a child process terminates or stops
* **SIGUSR1** and **SIGUSR2** - user-defined signals that applications can use for custom purposes

## Sending messages using  signals
Okay, we know that signals are a primitive form of IPC. UNIX-like systems provide a syscall called `kill` that sends signals to processes. Historically, this syscall was created solely to terminate processes. But over time, they needed to accommodate other types of signals, so they reused the same syscall for different purposes. 

For instance, let's create a simple Ruby script `sleeper.rb` which sleeps for 60 seconds, nothing more:
```ruby
puts "Process ID: #{Process.pid}"
puts "Sleeping for 60 seconds..."
sleep 60
```
After running we see:
```text
Process ID: 55402
Sleeping for 60 seconds...
```
In another window, we can **send** the `SIGTERM` signal to the process `55402` via syscall `kill`:
```bash
$ kill -SIGTERM 55402
```
And then, in the script session:
```text
[1]    55402 terminated  ruby sleeper.rb
```
### Signal traps
In Ruby, we can also _trap_ a signal using the `trap` method in Ruby:
```ruby
puts "Process ID: #{Process.pid}"
puts "Sleeping for 60 seconds..."

trap('SIGTERM') do 
  puts "Received SIGTERM, exiting gracefully..."
  exit
end

sleep 60
```
Which in turn, after sending the signal, will gracefully:

```text
Process ID: 55536
Sleeping for 60 seconds...
Received SIGTERM, exiting gracefully...
```
After all, we *cannot send messages using signals*. They are a primitive way of sending _standardized messages_ which will trigger specific behaviours. At most, we can trap some signals, but nothing more.

> Okay Leandro, but what's the purpose of this article then?

_Hold on_. That's exactly why I'm here. To prove points by doing useless stuff, like when I [simulated OOP in Bash](https://leandronsp.com/articles/simulating-oop-in-bash-3mop) a couple of years ago (it was fun though).

To understand how we can "hack" UNIX signals and send messages between processes, let's first talk a bit about **binary operations**. Yes, those "zeros" and "ones" you were scared of when you saw them for the first time. But they don't bite (🥁 LOL), I promise.

## What is a message?
If we model a message as a sequence of characters, we could say that at a high-level, messages are simply _strings_. But in memory, they are stored as **bytes**.

We know that bytes are made of bits. In computer terms, what's a bit? It's simply an abstraction representing **only two states**:
* zero
* one

That's it. For instance, using [ASCII](url), we know that the letter "h" has the following codes:

* 104 in decimal
* `0x68` in hexadecimal
* `01101000` in binary

Binary-wise, what if we represented each "0" with a specific signal and each "1" with another? We know that some signals such as SIGTERM, SIGINT, and SIGCONT can be trapped, but intercepting them would harm their original purpose.

But thankfully, UNIX provides two user-defined signals that are perfect for our hacking experiment.

## Sending SIGUSR1 and SIGUSR2
First things first, let's trap those signals in the code:

```ruby
puts "Process ID: #{Process.pid}"
puts "Sleeping forever. Send signals to this process to see how it responds."

trap('SIGUSR1') do 
  puts "Received SIGUSR1 signal"
end

trap('SIGUSR2') do
  puts "Received SIGUSR2 signal"
end

sleep
```
```text
Process ID: 56172
Sleeping forever. Send signals to this process to see how it responds.
```
After sending some `kill -SIGUSR1 56172` and `kill -SIGUSR2 56172`, we can see that the process prints the following content:
```text
Process ID: 56172
Sleeping forever. Send signals to this process to see how it responds.
Received SIGUSR1 signal
Received SIGUSR2 signal
Received SIGUSR2 signal
Received SIGUSR1 signal
Received SIGUSR1 signal
Received SIGUSR2 signal
```
**Signals don't carry data**. But the example we have is perfect for changing to bits, uh?

```text
Received SIGUSR1 signal # 0
Received SIGUSR2 signal # 1
Received SIGUSR2 signal # 1
Received SIGUSR1 signal # 0
Received SIGUSR2 signal # 1
Received SIGUSR1 signal # 0
Received SIGUSR1 signal # 0
Received SIGUSR1 signal # 0
```
That's exactly `01101000`, the binary representation of the letter "h". We're simply **encoding** the letter as a binary representation and sending it via signals

Again, we're **encoding it as a binary** and sending it **via signals**.

_How cool is that_?

![image](/uploads/3299.png)

### Decoding the binary data
On the other side, the receiver should be capable of decoding the message and converting it back to the letter "h":

* sender _encodes_ the message
* receiver _decodes_ the message

So, how do we decode `01101000` (the letter "h" in ASCII)? Let's break it down into a few steps:

1) First, we need to see the 8 bits as individual digits in their respective positions
2) The rightmost bit is at position 0, whereas the leftmost bit is at position 7. This is how we define the most significant bit (**MSB**, the leftmost) and the least significant bit (**LSB**, the rightmost)
3) For this example, we perform a **left shift** operation on each bit and then sum all the values, in this case from MSB to LSB (the order doesn't matter much for now): `(0 << 7) + (1 << 6) + (1 << 5) + (0 << 4) + ... + (0 << 0)`:
_left shift on _zeros_ will always produce a _zero__
* `0 << 7` = `(2 ** 7) * 0` = `128 * 0` = 0 
* `1 << 6` = `(2 ** 6) * 1` = `64 * 1` = 64

Similarly to the remaining bits:
* `1 << 5` = 32
* `0 << 4` = 0
* `1 << 3` = 8
* `0 << 2` = 0
* `0 << 1` = 0
* `0 << 0` = 0

So, our sum becomes, from MSB to LSB:

```text
MSB                          LSB
0   1    1    0   1   0   0   0
0 + 64 + 32 + 0 + 8 + 0 + 0 + 0 = 104
```
104 is exactly the **decimal representation** of the letter "h" in ASCII. 

_How wonderful is that?_

### Sending the letter "h"

Now let's convert these operations to Ruby code. We'll write a simple program `receiver.rb` that receives signals in order from LSB to MSB (positions 0 to 7) and then converts them back to ASCII characters, printing to `STDOUT`.

Basically, we'll **accumulate** bits and whenever we form a complete byte, we'll decode it to its ASCII representation. The very basic implementation of our `accumulate_bit(bit)` method would look like as follows:

```ruby
@position = 0 # start with the LSB
@accumulator = 0

def accumulate_bit(bit)
  # The left shift operator (<<) is used to 
  # shift the bits of the number to the left.
  #
  # This is equivalent of: (2 ** @position) * bit
  @accumulator += (bit << @position)
  return @accumulator if @position == 7 # stop accumulating after 8 bits (byte)

  @position += 1 # move to the next bit position: 0 becomes 1, 1 becomes 2, etc.
end

# Letter "h" in binary is 01101000
# But we'll send from the LSB to the MSB
#
# 0110 1000 (MSB -> LSB) becomes 0001 0110 (LSB -> MSB)
# The order doesn't matter that much, it'll depend on 
# the receiver's implementation.
accumulate_bit(0)
accumulate_bit(0)
accumulate_bit(0)
accumulate_bit(1)
accumulate_bit(0)
accumulate_bit(1)
accumulate_bit(1)
accumulate_bit(0)

puts @accumulator # should print 104, which is the ASCII code for "h"
```
_Pay attention to this code. It's very important and builds the foundation for the next steps. If you didn't get it, go back and read it again. Try it yourself in the terminal or using your preferred programming language._

Now, how to convert the decimal `104` to the ASCII character representation? Luckily, Ruby provides a method called `chr` which does the job:
```ruby
irb> puts 104.chr
=> "h"
```
We could do the same job for the rest of the word "hello", for instance. According to the [ASCII table](https://www.ascii-code.com/), it should be the following:

* `e` in decimal is `101`
* `l` in decimal is `108`
* `o` in decimal is `111`

Let's check if Ruby knows that:

```ruby
104.chr    # "h"
101.chr    # "e"
108.chr    # "l"
111.chr    # "o"
```
We can even "decode" the word to the decimal representation in ASCII:

```ruby
irb> "hello".bytes
=> [104, 101, 108, 108, 111]
```
Now, time to finish our receiver implementation to properly print the letter "h":

```ruby
@position = 0 # start with the LSB
@accumulator = 0

trap('SIGUSR1') { decode_signal(0) }
trap('SIGUSR2') { decode_signal(1) }

def decode_signal(bit)
  accumulate_bit(bit)
  return unless @position == 8 # if not yet accumulated a byte, keep accumulating

  print "Received byte: #{@accumulator} (#{@accumulator.chr})\n"

  @accumulator = 0 # reset the accumulator
  @position = 0 # reset position for the next byte
end

def accumulate_bit(bit)
  # The left shift operator (<<) is used to 
  # shift the bits of the number to the left.
  #
  # This is equivalent of: (2 ** @position) * bit
  @accumulator += (bit << @position)
  @position += 1 # move to the next bit position: 0 becomes 1, 1 becomes 2, etc.
end

puts "Process ID: #{Process.pid}"
sleep
```
_Read that code and its comments. It's very important. Do not continue reading until you really get what's happening here._

* Whenever we get `SIGUSR1`, we accumulate the bit `0`
* When getting `SIGUSR2`, accumulate then the bit `1`
* When accumulator reaches  the position`8`, it means we have a byte. At this moment we should print the ASCII representation using the `.chr` we seen earlier. Then, reset bit position and accumulator

Let's see our receiver in action! Start the receiver in one terminal:

```bash
$ ruby receiver.rb
Process ID: 58219
```

  Great! Now the receiver is listening for signals. In another terminal, let's manually send signals
  to form the letter "h" (which is `01101000` in binary, remember?):

```text
  # Sending from LSB to MSB: 0, 0, 0, 1, 0, 1, 1, 0
  $ kill -SIGUSR1 58219  # 0
  $ kill -SIGUSR1 58219  # 0
  $ kill -SIGUSR1 58219  # 0
  $ kill -SIGUSR2 58219  # 1
  $ kill -SIGUSR1 58219  # 0
  $ kill -SIGUSR2 58219  # 1
  $ kill -SIGUSR2 58219  # 1
  $ kill -SIGUSR1 58219  # 0
```

  And in the receiver terminal, we should see:

```text
Received byte: 104 (h)
```

_How amazing is that?_ We just sent the letter "h" using only two UNIX signals!

But wait. Manually sending 8 signals for each character? That's tedious and error-prone. What if we wanted to send the word "hello"? That's 5 characters × 8 bits = 40 signals to send manually. No way.

_We need a sender._

### Building the sender

The sender's job is the opposite of the receiver: it should encode a message (string) into bits and send them as signals to the receiver process.

Let's think about what we need:

1. Take a message as input (like "hello")
2. Convert each character to its byte representation
3. Extract the 8 bits from each byte
4. Send `SIGUSR1` for bit 0, `SIGUSR2` for bit 1
5. Repeat for all characters

The tricky part here is the step 3: **how do we extract individual bits from a byte?** To extract the bit at position `i`, we can use the following formula:

```text
bit = (byte >> i) & 1
```

Let me break this down:

- `byte >> i` performs a _right shift_ by `i` positions
- `& 1` is a bitwise `AND` operation that extracts only the _rightmost_ bit

For the letter "h" (`01101000` in binary, `104` in decimal):

**Position 0 (LSB):**
* `(104 >> 0)` = `104 / (2 ** 0)` = `104 / 1` = 104
* `01101000` >> 0 = `01101000`
* `01101000` & `00000001` = 0 (_one_ AND _zero_ is _zero_)

**Position 1:**
* `(104 >> 1)` = `104 / (2 ** 1)` = `104 / 2` = 52
* `01101000` >> 1 = `00110100`
* `00110100` & `00000001` = 0

**Position 2:**
* `(104 >> 2)` = `104 / (2 ** 2)` = `104 / 4` = 26
* `01101000` >> 2 = `00011010`
* `00011010` & `00000001` = 0

**Position 3:**
* `(104 >> 3)` = `104 / (2 ** 3)` = `104 / 8` = 13
* `01101000` >> 3 = `00001101`
* `00001101` & `00000001` = 1 (_one_ AND _one_ equals _one_)

And so on for positions 4, 5, 6, and 7. This gives us: `0, 0, 0, 1, 0, 1, 1, 0` — exactly the bits we need from LSB to MSB!

* `(104 >> 0) & 1` = `104 & 1` = 0
* `(104 >> 1) & 1` = `52 & 1` = 0
* `(104 >> 2) & 1` = `26 & 1` = 0
* `(104 >> 3) & 1` = `13 & 1` = 1
* `(104 >> 4) & 1` = `6 & 1` = 0
* `(104 >> 5) & 1` = `3 & 1` = 1
* `(104 >> 6) & 1` = `1 & 1` = 1
* `(104 >> 7) & 1` = `0 & 1` = 0


> Pay close attention to this technique. It's a fundamental operation in low-level programming.

So now time to build the `sender.rb` which is pretty simple:

```ruby
receiver_pid = ARGV[0].to_i
message = ARGV[1..-1].join(' ')

def encode_byte(byte)
  8.times.map do |i|
    # Extract each bit from the byte, starting from the LSB
    (byte >> i) & 1
  end
end

message.bytes.each do |byte|
  encode_byte(byte).each do |bit|
    signal = bit == 0 ? 'SIGUSR1' : 'SIGUSR2'
    Process.kill(signal, receiver_pid)
    sleep 0.001 # Delay to allow the receiver to process the signal
  end
end
```
For each byte (8-bit structure) we extract the bit performing the _right shift_ + _AND_ oprerations. The result is the extracted bit.

In the receiver window:

```bash
$ ruby receiver.rb
Process ID: 68968
```

And in the sender window:

```bash
$ ruby sender.rb 68968 h
```
The receiver will print:
```bash
$ ruby receiver.rb
Process ID: 68968
Received byte: 104 (h)
```
*Processes sending messages with only two signals!* How wonderful is that?

### Sending the "hello" message
Now, sending the hello message is super easy. The sender is already able to send not only a letter but any message using signals:

```bash
$ ruby sender.rb 68968 hello

# And the receiver:
Received byte: 104 (h)
Received byte: 101 (e)
Received byte: 108 (l)
Received byte: 108 (l)
Received byte: 111 (o)
```
Just change the `receiver` implementation a little bit:
```ruby
def decode_signal(bit)
  accumulate_bit(bit)
  return unless @position == 8 # if not yet accumulated a byte, keep accumulating

  print @accumulator.chr # print the byte as a character

  @accumulator = 0 # reset the accumulator
  @position = 0 # reset position for the next byte
end
```
And then:

```bash
$ ruby sender.rb 96875 Hello

# In the receiver's terminal
Process ID: 96875
Hello
```
However, if we send the message again, the receiver will print everything in the same line:
```ruby
$ ruby sender.rb 96875 Hello
$ ruby sender.rb 96875 Hello

# In the receiver's terminal
Process ID: 96875
HelloHello
```
It's obvious: the receiver doesn't know where the sender finished the message, so it's impossible to know where we should stop one message and print the next one on a new line with `\n`.

We should then determine how the sender indicates the end of the message. How about being it all _zeroes_ (`0000 0000`)?

* We send the message: first 5 bytes representing the "hello" message
* Then we send a "NULL terminator", just one byte _0_ (`0000 0000`)

```text
0110 1000 # h
0110 0101 # e
0110 1000 # l
0110 1000 # l
0110 1111 # o
0000 0000 # NULL
```
Hence, when the _receiver_ gets a NULL terminator, it will print a line feed `\n`. Let's change the `sender.rb` first:

```ruby
receiver_pid = ARGV[0].to_i
message = ARGV[1..-1].join(' ')

def encode_byte(byte)
  8.times.map do |i|
    # Extract each bit from the byte, starting from the LSB
    (byte >> i) & 1
  end
end

message.bytes.each do |byte|
  encode_byte(byte).each do |bit|
    signal = bit == 0 ? 'SIGUSR1' : 'SIGUSR2'
    Process.kill(signal, receiver_pid)
    sleep 0.001 # Delay to allow the receiver to process the signal
  end
end

# Send NULL terminator (0000 0000)
8.times do
  Process.kill('SIGUSR1', receiver_pid)
  sleep 0.001 # Delay to allow the receiver to process the signal
end

puts "Message sent to receiver (PID: #{receiver_pid})"
```

Then, the `receiver.rb`:
```ruby
@position = 0 # start with the LSB
@accumulator = 0

trap('SIGUSR1') { decode_signal(0) }
trap('SIGUSR2') { decode_signal(1) }

def decode_signal(bit)
  accumulate_bit(bit)
  return unless @position == 8 # if not yet accumulated a byte, keep accumulating

  if @accumulator.zero? # NULL terminator received
    print "\n"
  else
    print @accumulator.chr # print the byte as a character
  end

  @accumulator = 0 # reset the accumulator
  @position = 0 # reset position for the next byte
end

def accumulate_bit(bit)
  # The left shift operator (<<) is used to 
  # shift the bits of the number to the left.
  #
  # This is equivalent of: (2 ** @position) * bit
  @accumulator += (bit << @position)
  @position += 1 # move to the next bit position: 0 becomes 1, 1 becomes 2, etc.
end

puts "Process ID: #{Process.pid}"
sleep
```
Output:
```text
$ ruby sender.rb 96875 Hello, World!
$ ruby sender.rb 96875 You're welcome
$ ruby sender.rb 96875 How are you?

# Receiver
Process ID: 97176
Hello, World!
You're welcome
How are you?
```
> OMG Leandro! That's amazing!

*Amazing, right?* We just built an entire communication system between two processes using one of the most primitive methods available: **UNIX signals.**

The sky's the limit now! Why not build a *full-fledged message broker* using this crazy technique?

## A modest message broker using UNIX signals

We'll break down the development into three components:

1. **Broker**: the intermediary that routes messages
2. **Consumer**: processes that receive messages
3. **Producer**: processes that send messages

![image](/uploads/3395.png)

1. Let's start with the Broker. It should register itself with the producer, then trap incoming signals, decode them, and enqueue the messages for delivery to consumers via outgoing signals:

```ruby
#!/usr/bin/env ruby

require_relative 'signal_codec'
require_relative 'consumer'

class Broker 
  PID = 'broker.pid'.freeze

  def initialize
    @codec = SignalCodec.new
    @queue = Queue.new
    @consumer_index = 0
  end

  def start 
    register_broker

    trap('SIGUSR1') { process_bit(0) }
    trap('SIGUSR2') { process_bit(1) }
    
    puts "Broker PID: #{Process.pid}"
    puts "Waiting for messages..."

    distribute_messages

    sleep # Keep alive
  end 

  private

  def process_bit(bit)
    @codec.accumulate_bit(bit) do |message|
      @queue.push(message) unless message.empty?
    end
  end

  def register_broker 
    File.write(PID, Process.pid)
    at_exit { File.delete(PID) if File.exist?(PID) }
  end

  def distribute_messages
    Thread.new do
      loop do
        sleep 0.1

        next if @queue.empty?

        consumers = File.exist?(Consumer::FILE) ? File.readlines(Consumer::FILE).map(&:to_i) : []
        next if consumers.empty?

        message = @queue.pop(true) rescue next

        consumer_pid = consumers[@consumer_index % consumers.size]
        @consumer_index += 1

        puts "[SEND] #{message} → Consumer #{consumer_pid}"

        @codec.send_message(message, consumer_pid)
      end
    end
  end
end

if __FILE__ == $0 
  broker = Broker.new
  broker.start
end
```

* The broker registers itself
* Traps incoming signals `USR1` (bit 0) and `USR2` (bit 1)
* Enqueues the messages
* Send messages to consumers using outgoing signals (`USR1` and `USR2` too)

_Note that we're using a module called `SignalCodec` which will be explained soon. Basically this module contains all core components to encode/decode signals and perform bitwise operations._

2. Now the `Consumer` implementation:
```ruby
#!/usr/bin/env ruby

require_relative 'signal_codec'

class Consumer
  FILE = 'consumers.txt'.freeze

  def initialize
    @codec = SignalCodec.new
  end

  def start
    register_consumer

    trap('SIGUSR1') { process_bit(0) }
    trap('SIGUSR2') { process_bit(1) }

    puts "Consumer PID: #{Process.pid}"
    puts "Waiting for messages..."

    sleep # Keep alive
  end

  private

  def process_bit(bit)
    @codec.accumulate_bit(bit) do |message|
      puts "[RECEIVE] #{message}"
    end
  end

  def register_consumer
    File.open(FILE, 'a') { |f| f.puts Process.pid }
    at_exit { deregister_consumer }
  end

  def deregister_consumer
    if File.exist?(FILE)
      consumers = File.readlines(FILE).map(&:strip).reject { |pid| pid.to_i == Process.pid }
      File.write(FILE, consumers.join("\n"))
    end
  end
end

if __FILE__ == $0
  consumer = Consumer.new
  consumer.start
end
```
* The consumer starts and registers itself with the broker
* Consumer then traps incoming signals (bit 0 and bit 1)
* Decodes and prints messages

3. Last but not least, the `Producer` implementation, which is pretty straightforward:

```ruby
#!/usr/bin/env ruby

require_relative 'signal_codec'
require_relative 'broker'

unless File.exist?(Broker::PID)
  abort "Error: Broker not running (#{Broker::PID} not found)"
end

broker_pid = File.read(Broker::PID).strip.to_i
message = ARGV.join(' ')

if message.empty?
  puts "Usage: ruby producer.rb <message>"
  exit 1
end

codec = SignalCodec.new

puts "Sending: #{message}"
codec.send_message(message, broker_pid)
puts "Message sent to broker (PID: #{broker_pid})"
```
* Producer receives a ASCII message from the _STDIN_
* Encode and sends the message to the broker via outgoing signals

So far, this architecture should look familiar. Many broker implementations follow these basic foundations.

> Of course, production-ready implementations are far more robust than this one. Here, we're just poking around with hacking and experimentation

The coolest part is the `SignalCodec` though:

```ruby
class SignalCodec 
  SIGNAL_DELAY = 0.001 # Delay between signals to allow processing

  def initialize
    @accumulator = 0
    @position = 0
    @buffer = []
  end

  def accumulate_bit(bit)
    @accumulator += (bit << @position)
    @position += 1

    if @position == 8 # Byte is complete
      if @accumulator.zero? # Message complete - NULL terminator
        decoded = @buffer.pack("C*").force_encoding('UTF-8')
        yield(decoded) if block_given?
        @buffer.clear
      else 
        @buffer << @accumulator
      end

      @position = 0
      @accumulator = 0
    end
  end

  def send_message(message, pid)
    message.each_byte do |byte|
      8.times do |i|
        bit = (byte >> i) & 1
        signal = bit == 0 ? 'SIGUSR1' : 'SIGUSR2'
        Process.kill(signal, pid)
        sleep SIGNAL_DELAY
      end
    end

    # Send NULL terminator (0000 0000)
    8.times do
      Process.kill('SIGUSR1', pid)
      sleep SIGNAL_DELAY
    end
  end
end
```
If you've been following along, this shouldn't be hard to understand, but I'll break down how this beautiful piece of code works:

* The codec is initialized with the bit position at zero, as well as the accumulator
* A buffer is also initialized to store accumulated bits until a complete byte is formed
* The `accumulate_bit` method should be familiar from our earlier implementation, but it now accepts a closure (block) that lets the caller decide what to do with each decoded byte
* `send_message` encodes a message into bits and sends them via UNIX signals

Everything in action:

![image](/uploads/3170.png)

_How cool, amazing, wonderful, impressive, astonishing is that?_

## Conclusion
Yes, we built a message broker using nothing but **UNIX signals** and a bit of Ruby magic. Sure, **it's not production-ready**, and you definitely shouldn't use this in your next startup (please don't), but that was never the point.

The real takeaway here isn't the broker itself: it's understanding how the fundamentals work. We explored binary operations, UNIX signals, and IPC in a hands-on way that most people never bother with.

We took something "useless" and made it work, just for fun. So next time someone asks you about message brokers, you can casually mention that you once built (or saw) one using just two signals. And if they look at you weird, well, that's their problem. Now go build something equally useless and amazing. The world needs more hackers who experiment just for the fun of it.

*Happy hacking!*


