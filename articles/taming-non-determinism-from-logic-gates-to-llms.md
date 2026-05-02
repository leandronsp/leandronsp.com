---
title: "Taming non-determinism: from logic gates to LLMs"
slug: "taming-non-determinism-from-logic-gates-to-llms"
published_at: "2026-02-19 03:27:13Z"
language: "en"
status: "published"
tags: ["AI", "LLM", "ANN"]
---

Or: _how engineering keeps turning chaos into reliable computation. And why agentic AI still hasn't solved this._

There's a pattern that repeats across the entire history of computing: we take something fundamentally **non-deterministic** and engineer enough layers on top of it until it behaves deterministically. Logic gates did it. Artificial neural networks (ANNs) replicated it at some level. LLMs are the next frontier, and the hardest one yet.

In this article, we'll explore how engineering is crucial to addressing non-determinism, and analyze the current state of the art for LLMs.

---

## Agenda

* [Part I - The lie inside a logic gate](#part-i---the-lie-inside-a-logic-gate)
  * [Noise margins](#noise-margins)
  * [The CPU clock](#the-cpu-clock)
* [Part II - Aspirina: teaching non-determinism to behave](#part-ii---aspirina-teaching-non-determinism-to-behave)
  * [Where the chaos lives](#where-the-chaos-lives---unleash-the-madness)
  * [Composition does the rest](#composition-does-the-rest)
  * [The cost compared](#the-cost-compared)
* [Part III - LLMs and the "Unresolved Problem"](#part-iii---llms-and-the-unresolved-problem)
  * [Tests as noise margins](#tests-as-noise-margins)
  * [The agentic loop as clock](#the-agentic-loop-as-clock)
  * [The type system and compiler](#the-type-system-and-compiler-as-low-level-validators)
  * [What's missing: timing analysis](#whats-missing-the-equivalent-of-timing-analysis)
  * [How to mitigate that?](#how-to-mitigate-that)
* [Conclusion](#conclusion)

---

## Part I - The lie inside a logic gate

A [logic gate](https://en.wikipedia.org/wiki/Logic_gate) is taught in school as a simple binary machine. You give it 0s and 1s, you get 0s and 1s back. 

AND, OR and XOR are example of logic gates. They are clean, mathematical, deterministic. And that's a useful _fiction_.

At the physical level, a gate is a transistor (or a few of them) through which electrons flow. Electrons don't care about your **Boolean algebra**. The voltage on a wire is a continuous, analog value that fluctuates due to thermal noise, manufacturing variance, electromagnetic interference, and even cosmic radiation flipping bits in memory.

> Fun fact: in May 2003, in Belgium, an electronic voting machine gave a candidate [exactly 4096 extra votes](https://en.wikipedia.org/wiki/Electronic_voting_in_Belgium). More than she could possibly have received. After investigation, the error was attributed to the **spontaneous creation of a 13th bit in the memory of the computer**. The leading explanation: a cosmic ray flipped a single bit, turning a 0 into a 1 at position 2^12, adding exactly 4096 to the candidate count.

Ok, but how does the industry get determinism out of this mess?

### Noise margins
  Engineers define voltage thresholds: anything below 0.8V is a `0`, anything above 2.0V is a `1`. The zone between those values is declared "forbidden". The circuit is designed to never operate stably there. This isn't physics; it's an engineering contract. ([More on noise margins](https://en.wikipedia.org/wiki/Noise_margin))

### The CPU clock
A CPU clock isn't just a metronome. It's also a _sampling strategy_. You let the signal propagate through the gate (which takes time, called **propagation delay**), and only read the value at a specific moment: the _clock edge_. By then, the signal has had time to cross the threshold and stabilise. Timing is calculated to guarantee this.

**But when timing fails, things may get weird**. If a signal is sampled while it's still in the forbidden zone, a flip-flop can enter [metastability](https://en.wikipedia.org/wiki/Metastability_(electronics)), which is an unstable equilibrium where the output isn't quite `0` or `1` and can oscillate for an indeterminate time. This may cause real crashes in real systems. 

> Think of metastability as what happens when two clocks on a wall are unsynchronized. Each showing a slightly different time. "What time is it right now?", one may ask. The answer depends on which clock you look at, but you can't decide which one is right.

Inside the CPU, when facing a forbidden zone, the flip-flop faces the same dilemma. It can't decide if it's a `0` or a `1`, which can corrupt the system state. Engineers mitigate this with synchronizer chains, but never eliminate it entirely.

_It's the non-determinism of physics leaking through the engineering abstraction_!

**The key insight**: the determinism of digital computing is not a property of nature. It's an _engineering achievement_. It's paid with noise margins, timing analysis and careful design.

Yes, it's all about **engineering**.

---

## Part II - Aspirina: teaching non-determinism to behave

[Aspirina](https://github.com/leandronsp/aspirina) is my personal project that builds a complete CPU entirely from artificial neural networks (ANNs) trained to behave as logic gates, written in Rust. 

> Actually I created the [very first version](https://github.com/leandronsp/morphine) almost 10 years ago in Elixir, when I was learning about ANNs and Elixir. Recently I decided to write a Rust version while I was learning Rust. 

The inversion from Part I brings the beauty: instead of physical electrons that need to be tamed into bits, here we have ANNs - _systems whose weights are initialised randomly and whose outputs are continuous floating-point numbers_ - that need to be tamed into `0` and `1` too.

The non-determinism here is introduced deliberately, and then engineered away. Bear with me.

### Where the chaos lives - unleash the madness
A neural network starts with random weights. Its output for any input is whatever the math happens to produce. Not `0`, not `1`, but something like `0.6312`. In case you missed, I already have an article in my blog about [neural networks](https://leandronsp.com/articles/ai-ruby-an-introduction-to-neural-networks-23f3). 

**Backpropagation is the engineering response**. It's the algorithm that adjusts the weights iteratively, measuring how wrong the output is (the _loss_) and leading weights in the direction that reduces the error. Run this for 10,000 epochs - 10,000 passes over the training data - and the network converges to weights that produce `0.002` for inputs that should be `0`, and `0.997` for inputs that should be `1`.

The [sigmoid function](https://en.wikipedia.org/wiki/Sigmoid_function) (a.k.a the _logistic curve_) does in Aspirina what noise margins do in hardware: it squashes any continuous value into the range `0..1`. It doesn't give you exact binary outputs, but it pushes values toward the extremes.

> And that's exactly what we need

Combined with a threshold decision - below `0.5` we could consider `0`, above `0.5` we consider `1` -, we get in Aspirina the same effect: a circuit that _behaves deterministically_ even though its internals are continuous and learned.

### Composition does the rest
Once gates are trained, they're composed to:

```
XOR + AND => Half Adder => Full Adder => 4-bit ALU => Memory => Registers => CPU => Assembler => Interpreter
```
Each layer treats the layer below as if it were perfectly deterministic, which is **exactly the abstraction hierarchy** of real hardware.

The non-determinism was contained at the lowest level (training), and every layer above it benefits from the illusion of determinism. 

Yes, **determinism is an illusion**. Deal with it.

### The cost compared
Compute time during training. Just as chip fabrication invests energy upfront to create reliable silicon, Aspirina invests 10,000 epochs upfront to create reliable logic. After that, inference is cheap and stable.

Now, _enter LLMs_.

---

## Part III - LLMs and the "Unresolved Problem"
A [large language model](https://en.wikipedia.org/wiki/Large_language_model) (LLM) is non-deterministic in a deeper and more stubborn way than either of the above.

Its weights are the result of a stochastic training process over vast data. Its output is sampled probabilistically (even with `temperature=0`), and there's pseudo-randomness baked in. And crucially, unlike a neural network trained on a clean truth table, an LLM's "correct output" for most inputs is _fundamentally ambiguous_.

Yet we're building agentic systems (Claude Code, Codex, Cursor etc) that use LLMs to write, run and iterate on code autonomously. **How do we tame this?**

The pattern repeats, but the engineering is particularly _messier_ on LLM's.

### Tests as noise margins
A test suite could behave as a binary verdict on the LLM's  output: _green or red_. It doesn't matter if the model generated three different valid implementations in three runs: if all tests pass, they're equivalent from the system's perspective. The non-determinism of the model is _contained_ below the threshold of "passes tests". This works, but only as well as the tests themselves. And unlike voltage thresholds, test coverage is always incomplete.

### The agentic loop as clock
An agentic system like Claude Code doesn't generate once and deliver. It reads state (files, compiler output, test results), acts, observes the new state, and repeats. This feedback loop is structurally similar to the _fetch-decode-execute_ cycle of a CPU or the iterative of Aspirina. Each iteration constrains the space of valid next actions. Errors are observable, and the agent can correct.

### The type system and compiler as low-level validators
In a Rust project like Aspirina, the borrow checker *rejects invalid outputs before tests even run*. _The LLM can generate wrong code and hallucinate, the compiler then refuses it, the agent observes the error message, and iterates._ 

**This is a lower-level noise margin**: just a formal filter beneath the test layer and type system. 

> And that's why I think that languages with strict compilers like Rust will thrive in the agentic era. Let's see.

### What's missing: the equivalent of timing analysis
In hardware, engineers can _prove_ that a circuit will work at a given clock frequency. They run static timing analysis and guarantee that every signal stabilises before every clock edge. There's no equivalent for agentic LLM systems.

We don't know how many iterations an agent will need. We can't bound the convergence time. We can't guarantee termination. An agent can loop indefinitely, or enter what I'd call "agentic metastability": making and undoing the same change repeatedly, unable to reach a stable state.

Anyone who has used Claude Code or Codex for long enough has seen this - the model oscillates between two approaches, each creating a problem that motivates reverting to the other.

> Despite we can retry, add guardrails, skills, and set token budgets, in the end, we can't prove termination the way a hardware engineer proves timing closure on metastability

### How to mitigate that?
In hardware, the fix for metastability is **design**. In agentic systems, the analog fix is **clearer context, more granular tests, explicit checkpoints and tighter feedback loops**; which can be described with the following practical list of skills I created and have been using on a daily basis for every project in production:

* **PO (product owner)**: agent receives a prompt and outputs a well-scoped task based on initial requirements and prior knowledge on the codebase. Clearer context.
* **TDD (test-driven development)**: the developer agent outputs the code, guided by TDD - red, green, refactor. Granular tests as noise margins.
* **Review**: agent and human checks before merging. Explicit checkpoint.
* **Small PRs**: small PR's enable development and testing with reviewable increments. Tighter feedback loops.

Yes, that's **software engineering practices** all the way down (and they are not new). Yet we don't have the formal tools _to prove_ these fixes work. It's totally empirical. 

---
## Conclusion
At least for me, what's interesting is that each level's "solved" status depends on _bounded, well-defined tasks_. Logic gates are deterministic for Boolean logic. Aspirina's networks converge reliably because truth tables are finite and exact. LLMs work well on narrow, testable tasks with earlier and good feedback.

The frontier is: **what does it take to engineer reliable agentic behaviour on open-ended, ambiguous, long-horizon tasks?** The answer probably looks like what came before: more layers of verification, better sampling strategies (the clock), formal specifications (the truth table), and tools that can analyse convergence before execution. *We just don't have those yet*.

Non-determinism doesn't go away. It never has. We just keep finding better ways to push it where it can't hurt us. From voltage thresholds to synchronizer chains to temperature tuning. Every generation of computing has faced the same enemy and responded with the same weapon: **engineering**. Besides hype, LLMs are no different. We're just earlier in the cycle.

---

## References

https://en.wikipedia.org/wiki/Logic_gate
https://en.wikipedia.org/wiki/Electronic_voting_in_Belgium
https://en.wikipedia.org/wiki/Noise_margin
https://en.wikipedia.org/wiki/Metastability_(electronics)
https://en.wikipedia.org/wiki/Sigmoid_function
https://en.wikipedia.org/wiki/Large_language_model
https://en.wikipedia.org/wiki/Backpropagation
https://en.wikipedia.org/wiki/Static_timing_analysis
https://github.com/leandronsp/aspirina
https://github.com/leandronsp/morphine
https://leandronsp.com/articles/ai-ruby-an-introduction-to-neural-networks-23f3

