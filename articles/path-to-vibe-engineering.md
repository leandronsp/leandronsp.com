---
title: Path to Vibe Engineering
slug: "path-to-vibe-engineering"
status: published
language: "en"
published_at: "2026-05-02 00:12:42"
---

2026, what a year to be alive. AI, LLMs, agents, agentic coding. On one side, the hype train. On the other, narratives built to invalidate everything the hype touches.

In this article I'll dig into the limitations and benefits of using LLMs for coding and how to bring **engineering** back to the landscape, which I call _vibe engineering_. I aim to help readers on a path to vibe engineering, so this is for working engineers, not first-day coders.

In the end you'll realize that **it's not about speed, it's about confidence**.

Purely empirical, unpretentious, and potentially poetic. Reflections from someone who uses AI daily but doesn't sell courses or posts horror stories. Embrace pragmatism, avoid the radicals, grab a coffee and let's go.

---

## Agenda

* First things first: my journey to agentic coding
* Engineering, Agile & AI
* Vibe (Coding?) Engineering
* My showcase in AI
* Approaching the end, here are my takes
* My 70/30 model: learning and sharpening fundamentals
* Final words
* Disclosure

---

## First things first: my journey to agentic coding

Back in 2022, I was skeptical. ChatGPT 3.5 was peak hype, while most people were testing these new "chat" capabilities. Developers also started looking into it, and I was no different. However, something was off in my mind: asking a probabilistic model to reason about my code was not accurate. Nor right.

The upcoming years went nuts in terms of AI & coding. I tried my best to get rid of AI from my programming routine. While other developers were struggling with ChatGPT to output a lot of spaghetti code, I was crafting Assembly on live streams. AI outputs were never satisfactory. "They" had no access to my codebase to understand and reason with more confidence.

Fast forward to 2025.

### Claude Code
In the middle of 2025, I was still coding manually, like an _artisan_. At every coding task I used to open my [NeoVim](https://github.com/leandronsp/dotfiles) and get to work.

Then, I looked around and realized I was the only one not using AI. I attended a private talk at my current employer and I asked which AI models I could start using since I'm a NeoVim user and I was not keen on using Cursor or another IDE. The answer was: _Claude Code_.

It changed everything.

Within a week, I noticed a slight increase in speed, but not the **speed boost** people talk about. Something was still missing.

### It's not about speed, it's about confidence
Soon I realized that using AI, more specifically Claude Code (Sonnet 3.5, at the time), I could deliver with more _confidence_. Despite still being capable of writing and reading code, an LLM is orders of magnitude faster at retrieving and processing context from any codebase. For instance, my first steps involved [reading about best practices](http://code.claude.com/docs/en/best-practices#explore-first-then-plan-then-code) of using Claude Code. Also, an LLM is way more capable of writing/dumping huge amounts of code - which of course, brings some tradeoffs.

On the other hand, even with flagship models, an LLM _does not reason_ like humans. I think we have more reasoning capacity, understanding context and requirements more broadly than LLMs.

That said, this combination of leveraging an LLM to get context and provide information so we can reason about it, reflect and decide is indeed a _game changer_. Hence, I started delivering my tasks with **way more** confidence with AI assistance. 

As a software engineer, I realized I can implement new features, fix bugs, refactor complex codebases and handle more complex tasks that would take me more time. By applying best **software engineering and agile practices**, I can go beyond, delivering with quality.

But what are those _software engineering and agile practices_ we're talking about?

---

## Engineering, Agile & AI

I'd like to introduce this topic by first talking about **Software Engineering**. It's not about _writing code_, it never was, and I'm pretty sure you're sick of hearing this statement many times on the social networks.

Software engineering is about **managing complexity** through practices that give you confidence in what you build. It involves testing, design, refactoring, code review and all that sort of practices many of us do on a daily basis. We should know when to scope something, when to break it down, when to ship and when to _say no_.

> Yes, sometimes just saying "no" is the right call, but respectful, of course

As for **agile**, being agile is not about using a tool or some agile framework. Neither about hiring dozens of agile coaches. Truly agile embraces short cycles, working software, responding to change over following a plan. It's a _culture_.

Everything under an agile culture leans toward feedback loops. Pair programming and retrospectives provide feedback loops. Talking to designers, refining stories, writing spikes, promoting R&D. The whole point is to _learn fast, fail fast, and correct course_.

### Fundamentals matter

Almost everyone in tech has already faced that moment where something breaks in production, and you realize the bug wasn't a lack of tooling, or a missing requirement. It was **a gap in fundamentals**. Hard to admit that, I know, but the sooner you realize that, the better you get at the software crafting.

When you know the fundamentals, you read code and introspect systems differently. You start having a broader and holistic vision of the whole system. You spot the shortcut before it becomes a regression, and you **ask the right question** before the wrong code ships.

Got it?

> You should **ask the right question** before the wrong solution lands in production

That's why fundamentals are so important. Even more now, in the _AI agentic era_. That gut feeling, the one that comes from years of writing, reading, breaking, and fixing code, that's not something an AI model gives you. That's something you _earn_.

And here's where the irony kicks in: the more capable AI gets at generating code, the more you need fundamentals to work with it, not less. If you can't evaluate what the AI produces, if you can't tell whether the test it wrote actually covers the edge case, if you can't spot the subtle bug in a 3-line diff that looks perfectly clean, then you're not engineering, you're rubber-stamping.

Fundamentals are what turn an LLM's output **from a suggestion into a deliberate decision**.

### Building the bridge

Now here's the thing. LLMs don't bring any of that, because they generate code at scale. They won't tell you if that code is right. Furthermore, they don't validate assumptions, don't catch regressions or question a misleading requirement. 

All of that is still _on you_.

So the question isn't whether AI replaces engineering practices, because it won't. The question is how to use **these engineering and agile practices to work with AI**, hence increasing quality while delivering solutions to real problems.

### A note about SDD and agent orchestration

> "Okay Leandro, so you mean we should do SDD and orchestrate dozens of agents?"

_Hell no_, definitely not. I'm not in this game to overcomplicate things. I think that SDD (or Spec-Driven Development) is fine, but the term is overly inflated and many people are taking SDD like _creating a lot of markdown files upfront then orchestrating with dozens of agents_.

What documentation enthusiasts are doing with SDD and plenty of agents is actually _waterfall_. I'm not very fond of waterfall for software development, because in the waterfall model we don't have feedback loops and I'm pretty sure that even with all that documentation upfront and multiple agents that dump code at the speed of light, _rework will be needed_. Requirements will be missed. Someone will forget important details and the AI won't catch those missing requirements as if it was something _magical_.

I think our industry evolved for decades to finally **get shit done** with agile practices and all of a sudden we're doing waterfall again? Please, no.

What I'm going to share here is a simple process with ancient engineering & AI practices that I believe will work for most people in tech, working for startups or even enterprises. We'll dig further into these practices in the upcoming sections.

---

## Vibe (Coding?) Engineering

_Vibe coding_ has been a hot topic lately. Karpathy coined the term, and suddenly a massive number of tech enthusiasts became _coders_. I'm not against it. I believe that vibe coding genuinely unlocks potential for people who want to build products, people who think in terms of what they want to create, not what syntax they need to type.

> I even consider myself a **vibe coder** despite years of experience writing software for a variety of companies using different programming languages. Not to mention I'm seasoned at different levels of architecture, yet I know I always have a lot of knowledge gaps to fill

But let me bring a new term that I don't see many people talking about: **vibe engineering**. That's not a rejection of vibe coding, but an enhancement instead.

The practices I'm about to walk through aren't new though, and that's exactly the point. Refine, scope, test, pair, review, debug with _discipline_. These are the things _you should have been doing even before AI_, practices that kept software reliable before AI, and they're the stuff that keep AI-generated software reliable now.

The difference is that skipping them used to mean a bug in production. Skipping them with AI in the loop means **a bug in production that you didn't even write** and worse, **you can't explain and reason about**.

Let's get into the practices.

### Engineering practices for the AI era

This is where most AI coding discussions fall apart. Either you're told to "just prompt harder" or you're told to "never trust the output". Both miss the point. The practices aren't new, and they don't change because agentic AI is here, they just become more important.

**Refine before you build**

This is non-negotiable. I don't necessarily mean to exaggerate on SDD (Spec driven development) - because I believe people are losing the point about SDD and I can talk about it in another post -, but before touching a keyboard, before opening an agent, **you need to know what you're building and why**.

I use a skill [called "po"](https://github.com/leandronsp/dotfiles/blob/main/claude/.claude/skills/po/SKILL.md) (which acts like a _Product Owner_) that forces me to write a PRD - product requirements document -, before any code. Not because I love documentation, but because the agent will hallucinate scope if _I don't carve it myself_. A vague prompt gives you vague code, whereas a refined one gives you scoped and testable deliverables. Refine first, then build.

**Break work into small deliverables**

If your prompt asks for more than a few hundred lines of output, maybe better to step back and break down the requirements. I have a personal threshold: above 500 lines of diff and I start questioning whether the scope is right. 

Small diffs are reviewable diffs, which make them easy to test and validate. The agent handles **small scoped tasks far better** than large ambiguous ones.

For instance, I usually write a prompt to break down in small pieces _before I start using the `/po` skill_:

```
I want to add RSS feed generation to the blog engine.
The feed should produce valid RSS 2.0 XML with:
- channel metadata (title, link, description, whatever else is needed for a RSS)
- items for each published post (title, link, published date, description)

Before writing any code, let's break this into small, independent deliverables.
Give me a roadmap with clear order, where each step produces something 
I can refine, test and validate on its own
```
The key word here is **before**. I'm not asking the agent to build anything yet - because coding agents _WILL try to build something_ -, I'm asking it to plan.

Look, I'm not saying anything about the famous "plan mode", I'm not even using it anymore. The output is a mini roadmap, something like:

1. Define the RSS data model (structs for channel and item)
2. Implement XML escaping for special characters
3. Build the feed header (channel metadata)
4. Build the feed items (post to RSS item mapping)
5. Wire it all together and validate against the RSS 2.0 spec

Of course the **first output is almost always not ready yet**. I refine the ROADMAP. I leave comments before we decide the final version, and iterate over and over until **my requirements are satisfied**.

Then, once I'm comfortable with the roadmap, I refine one deliverable at a time. I take step 1, run `/po` to write a proper PRD just for that piece, then `/dev`, [my skill for coding](https://github.com/leandronsp/dotfiles/blob/main/claude/.claude/skills/dev/SKILL.md), to implement it.

Test, validate, deliver. What I learn from step 1 _might change now I approach step 2_, or even reshape the roadmap itself.

> Yes, that's the truly agile development. Not about SCRUM, not about KANBAN. That's all about _embracing changes_. If you are in this game and not keen to embrace changes during the whole cycle of software development, well...I have bad news for you

I don't refine everything upfront, and that's why I'm not very fond of the "SDD" people are selling nowadays. All this _SDD thing_ are a huge pile of requirements that **will change**, no matter how many agents I have working for me. Completely wasteful on my workflow.

I refine the first thing, ship it, learn, adjust if needed, move to the next one. This is agile applied to AI-assisted work, and it works precisely because the agent performs best on small, scoped tasks. Give it a destination, not a **map of the entire country**.

**Test first, always**

TDD is not a methodology debate for me, it's a survival tool. When an LLM writes code, you need a failing test that proves what you expect before the code even exists. Write the test, see it fail, let the agent make it pass, then verify.

This feedback loop, `RED -> GREEN -> REFACTOR` is nothing new, but it's the closest thing to determinism you'll get from a _probabilistic model_.

> I wrote an article this year about [Taming non-determinism: from logic gates to LLMs](https://leandronsp.com/articles/taming-non-determinism-from-logic-gates-to-llms), in case you want to have a deeper understanding of non-determinism

My [skill "dev"](https://github.com/leandronsp/dotfiles/blob/main/claude/.claude/skills/dev/SKILL.md) relies on TDD from the very start. I invite you to take a look into it.

**Pair with the agent**

I don't mean to sit back and watch it generate 800 lines. I mean **treat the agent like a pair programming partner**. You drive, the agent suggests and reviews. Or the agent drives, you suggest and review.

Again, my `/dev` skill covers different modes for development: 

a) `agent-pair` - two subagents working adversarially, one writes, one gates

b) `solo` - the agent does the work but narrates every step

c) `pair-with-me` - me and the agent actually pairing, discussing before coding

At any mode, the skill is ready to work with TDD, no bullshit included. Pick the mode that matches the task, but always stay in the loop.

**Review the output**

Every. Single. Time. An LLM's output is a suggestion, not a decision. My ["review" skill](https://github.com/leandronsp/dotfiles/blob/main/claude/.claude/skills/review/SKILL.md) spawns three parallel reviewer agents. One for security, one for performance, and one for quality. Then a _red-team auditor_ that checks the reviewers themselves. It sounds excessive until you've shipped a bug that looked perfectly clean in a 400-line diff. If you're not reviewing, you're rubber-stamping.

Even so, you must review the auditor's final review. Don't take _any LLM output_ as a source of truth. An LLM's output **should never be the final destination**, but using it with the correct tooling, it'll take you _some steps forward_.

**Debug with discipline**

When something breaks, don't just prompt the agent to "fix it". I know, it's tempting to drop a screenshot and ask the LLM to solve it. With a good LLM model and correct skills, this naive prompting will provide the right output very often, but sometimes it simply won't get out of the loop. Humans get stuck, so do AIs.

_Tip:_ reproduce the bug with a failing test first. Actually, that's a practice I've always tried to apply on my workflow way before agentic AI. If there's some skill I'd pick and say that every good engineer should sharpen, it's the **ability to reproduce anything with a failing test**. Many engineers, including the senior ones, fail at this important step while debugging.

> In a distributed system, debugging is very hard. Sometimes a failing test is not enough, but if you spend some time trying to write as many failing tests as possible, you'll eventually get there. The "test-driven" mindset is winner IMHO. "Follow the data and write a failing test for it" is the best engineering advice I've ever heard.

Speaking of AI, I have a ["bugfix" skill](https://github.com/leandronsp/dotfiles/blob/main/claude/.claude/skills/bugfix/SKILL.md) that enforces this: understand the bug, scout the codebase, write a failing test for the _right reason_, then fix. No test, no fix. Of course, agents usually write any poor test just to make it pass, but if you enforce it with a good skill, the agent will go to the right path guarded by good engineering practices **you** provided in the skill or prompt.

The agent will happily patch symptoms all day if you let it. A failing test forces both you and the agent to prove you actually **fixed the root cause**.

Now time to show what all this looks like in practice.

---

## My showcase in AI

I want to highlight _three real use cases_ where I applied those engineering practices and could be successful with it. Despite using AI for personal projects, I've been using agentic AI for **delivering value to real customers in production**, critical projects and demanding features. It's not a playground as many may argue: _it's serious work_.

### Case 1: Debugging a PDF rendering bug

I was working on a task where customers weren't able to download _some PDFs_ generated by the platform, affecting critical workflows in production. Pay attention to the "some PDFs" part. Not all of them.

Logs pointed that some PDFs were failing to parse, leading the troubleshooting to go look at _broken PDFs_. In the "PDF world", everything is messy. Writer and reader tools don't always come to an agreement, despite the PDF itself having a public specification.

I got some broken PDFs and started looking into them, as they were opening normally in my PDF reader. The problem was somewhere in our **merge PDF process**, which is backed by _Ghostscript_, a well-known tool for printing and PDF manipulation.

With this information in place, instead of pasting the bug report into an agent and saying "fix it", I called my `/bugfix` skill. And you'll see how a good skill and a failing test win.

The skill started by understanding the bug: what's broken, when it happens, what's the expected behaviour. Then it scouted the codebase, reading the PDF parsing code, tracing data flow, checking git history for recent changes. 

It came back with a hypothesis: the _outline builder_ within the PDF content was pushing a parent reference into its own children, creating a cycle.

The critical step: write a test that fails. The skill produced a minimal test case that created a PDF outline with two levels, asserted that traversing the outline tree terminates, and the test failed, proving the bug existed.

> Once we can prove the bug exists with the _right failing test_, the dopamine levels skyrocket :P

**The "senior" moment**

First, I let the AI go for a fix, but as soon as I noticed it got stuck in a loop after two or three failed approaches, I decided to enter the loop and become a **real senior**. My instinct was that something in the _Ghostscript_ process was not recognizing the circular outlines. But Ghostscript is an external tool that I don't have control over. The only thing I could do was to try a variety of different _command line flags_ in a "trial-and-error process". Not good.

The _senior_ moment became when I asked the agent to analyze the **Ghostscript process** using some tooling in my macOS, which is an operating system based on BSD.

For freak's sake, the agent pulled out the utility `sample` against the `gs` process and then got the process's call stack.

And _boom_! My little boy got the exact part of the _Ghostscript stacktrace_ where the circular reference was stuck in an infinite loop. The fix was just using the correct flag to "ignore" circular outlines. Easy peasy.

Could I hit the same destination without AI? Hell yes, but I would have spent too many hours on it, maybe days. The whole process took me **only 20 minutes**. More importantly, the bug is now captured in a test. If it ever regresses, I'll know immediately.

### Case 2: Building a feature from scratch, product to code

[ChessWAV](https://github.com/leandronsp/chesswav) is a Rust project that turns chess games into audio. It's not a simple CRUD. It's chess logic, graph manipulation, sine waves, mathematical stuff and all. The REPL had a working board display, but it was appending a new board after every move, scrolling the terminal endlessly. No move history, no file labels on both sides. I wanted to fix that.

Instead of jumping to code, I started with `/po in-place board rendering with move list sidebar`. The skill walked me through writing a proper PRD: what the rendering should look like, how ANSI cursor escapes work for in-place updates, how each display strategy (sprite, unicode, ascii) affects layout calculations. Edge cases like switching display modes mid-game and cursor-up calculations across different board heights.

> In case you don't believe me and think I could be making this up, please refer to my [issue in Github](https://github.com/leandronsp/chesswav/issues/9), the [pull request](https://github.com/leandronsp/chesswav/pull/10), all of it done **during a live stream** (pt-BR) in my [Youtube channel](https://www.youtube.com/watch?v=Da4BYe_gV0Y)

The PRD took maybe ten minutes and saved me from _scope creep_ on what could have been a bottomless rendering rabbit hole. Of course I had two or three iterations before I agreed on the PRD, but that's the true productivity power of using agentic AI IMHO.

After the issue was created, I handed it to `/dev`, no further prompting, just pasted the issue URL, then it scouted the codebase, asked clarifying questions about the existing display strategy pattern, proposed test cases, and only after did it start coding.

Every cycle was RED then GREEN. The whole feature shipped in three incremental diffs: cursor-up logic and layout height calculation first, then the move list sidebar, then the re-rendering flow that ties it together. 

Before opening the PR, I ran the `/review` skill which gloriously gave me some hints on refactoring. I looked at the code afterwards, though it wasn't too bad, I suggested some refactoring to make the code cleaner. You can see the [code yourself](https://github.com/leandronsp/chesswav/pull/10), as the final PR was only 369 additions across 3 files. Not 2000 lines of "here's the whole thing". Small, reviewable, tested increments. Each one I could understand, validate and _ship with confidence_.

And before someone argues:

> But Leandro, you're doing engineering as usual. Why the need of using AI at all?

Let's be honest here. I'm a seasoned software engineer and I'm **pretty sure** I couldn't deliver this kind of complexity in a matter of minutes or hours with confidence. That's not AI-slop, go check yourself. This use case is the difference between prompting "add in-place board rendering" and **engineering your way to it**.

I kindly invite you to truly experiment on this flow. Give engineering & AI an honest chance.

> Unless you're a radical who's not keen to learn and evolve. If that's the case, well...you shouldn't be reading my blog at this point. Feel free to close this tab now. Radicals are not welcome here.

### Case 3: Review before you ship

I had just finished a refactor of the markdown rendering pipeline for [DevTUI](https://github.com/leandronsp/devtui), the blog engine I created, using it to write this very blog post. The diff was around 300 lines, which is already pushing my comfort zone. I ran `/review` on the changes.

The skill pulled the diff, launched a scout to understand the surrounding code, then spawned three parallel reviewers. Security checked for injection risks in the HTML output. Performance looked for unnecessary allocations in the hot path. Quality examined whether the refactor actually improved the design or just moved code around. 

Then the red-team auditor cross-checked all three reports, **catching a false positive** from the security reviewer and flagging a blind spot the others missed: the refactor had changed the order of markdown preprocessing steps, which would silently break nested blockquotes on certain inputs.

I would not have caught that by skimming the diff. **The fix was two lines**, but finding it required reading the diff against the full context of how the pipeline processes input.

That's what review gives you, not just "looks good" - which many developers already do -, but actual evidence that your change does what you think it does.

---

## Approaching the end, here are my takes

Everything I described above, the skills, the TDD discipline, the review workflow, **it's not magic**. It's configuration and intentionality. Next are a few things from my setup that make this work. Also comes with a few takes, read it with discretion.

### Write your own CLAUDE.md (or AGENTS.md)

This is the most impactful single thing you can do. My personal `~/.claude/CLAUDE.md` (check the correct configuration and conventions for your harness) is my [development philosophy distilled](https://github.com/leandronsp/dotfiles/blob/main/claude/.claude/CLAUDE.md) into a file the agent reads on every session. It should be short. It says things like "deletion beats addition", "TDD for non-trivial work", "search the codebase first", "baby steps". Without it, the agent follows its own defaults, and those defaults are optimized for generating output, not for _engineering_. 

Write yours, be opinionated. The more specific, the better.

### Create skills for your recurring workflows

My `/po`, `/dev`, `/bugfix` and `/review` skills encode processes I actually follow. Not theoretical best practices, but the way I work. A skill is just a markdown file that tells the agent what to do, step by step, with gates and waits. If you find yourself repeating the same process, write it down once and let the skill enforce it. That's how you get TDD from a model that defaults to dumping code.

And that's the main reason I avoid importing other's skills I don't fully understand or control. I avoid using repos with thousands of skills or "following some framework". I think we should pick up skills with caution. Always better to start from a reference and then craft a few of your own.

Feel free to [pick up my skills](https://github.com/leandronsp/dotfiles/tree/main/claude/.claude/skills), but use your agent to explain about them, refine and adapt to your own workflow.

### Set up hooks for flow state

I [have a shell hook](https://github.com/leandronsp/dotfiles/tree/main/claude/.claude/hooks) that plays a sound and flashes my Tmux window when the agent finishes, so I don't sit staring at a terminal waiting. Another hook loads context from my Obsidian vault at session start, so the agent already knows my project history. Small things that compound.

### Use adversarial agents

My `/dev` skill runs two subagents in pair mode: a driver that writes code and a navigator that gates every step. The navigator doesn't rubber-stamp. It pushes back on test scope, challenges minimum implementations, flags premature abstractions. This costs a bit more tokens, I know, but saves you from the model's tendency to over build. 

One agent writing unchecked code is vibe coding. Two agents checking each other is closer to pair programming.

### It's not just Claude

I've been running GLM 5.1 and Kimi 2.6 for personal projects and I'm genuinely impressed. Both are strong models that hold their own for coding tasks. The important thing is that my skills, my CLAUDE.md, my memory, they're all model-agnostic configuration files. I can switch models and the process stays the same.

I've been using opencode and pi-agent alongside Claude Code, and both harnesses read from the same `~/.claude` configuration. Same skills, same rules, same workflows. Pi-agent works with extensions instead of Claude's hook system, so there are slight differences, but the core setup translates. They are **way cheaper** too.

The discipline is in the configuration, not in the model. Pick whatever works for your budget and preference, but bring your own process.

### AI only reflects your capability

I'm going to be blunt here. The quality of AI-assisted work is **directly proportional to the quality of the person guiding it**. If you don't know how to write a test, the agent won't write a meaningful test. If you don't know how to review a diff, the agent's output passes your eyes without triggering a single alarm. If you don't understand your system's architecture - and here's the catch -, _you can't tell the agent where to look_, and it will simply **guess**. Sometimes right, often wrong, and you won't know which is which.

This is not a flaw in AI. It's a mirror. The agent amplifies what you bring. Bring fundamentals, and you get leverage. Bring ignorance, and you get confident ignorance at scale.

That's why I keep my craft projects. Assembly, Rust from scratch, neural networks without frameworks. Not because I'm nostalgic, but because that's where I build synaptic connections that make me deliver better with AI. 

Skip it, and you're not vibe engineering. You're _vibe hoping_.

---

## My 70/30 model: learning and sharpening fundamentals

Seventy percent AI-assisted work, shipping, delivering. Thirty percent manual coding, learning, building intuition. **The 30% is what makes the 70% work**. Without fundamentals, you become a prompt engineer who can't debug. With only fundamentals, you ship slower than the field. _Why not both?_

Again, **avoid the radicals**.

> "But how to keep learning and sharpening the fundamentals?"

How do I keep the 30% effective? How do I code, learn, and get intuition from the decisions? Ironically, the answer is in the _LLM itself_. Yes, we can leverage the LLM as a pair programming partner, remember the topic from earlier?

When I'm coding manually, I leave the agent open reading my code, doing TDD with me, where **I'm the driver, the agent is the navigator**. It watches my changes and provides feedback in real-time, which I can reason about, get intuition and iterate until I get a solution that I fully understand. Whenever I feel I'm good with the current development, the rest is only ceremony and boilerplate, then I switch to vibe coding and the agent finishes the boring work.

My skill `/dev` also covers this mode, which I call `pair-with-me`. Every time I want to code and learn something new, I'm using this mode. Otherwise, I'm doing engineering around agents as I already distilled throughout this whole article.

Here's [another live stream](https://www.youtube.com/watch?v=GWQ1OxnOKcQ) where I'm studying using this technique (pt-BR), which I use daily too.

---

## Final words

I started this article saying I'd been procrastinating on writing it. Now I understand why. This isn't a hot take or a framework pitch. It's the distillation of months of trial and error, of shipping real features to real customers, of getting stuck in agent loops and finding my way out.

The message is simple: _vibe coding is real and it's powerful_. But vibe coding without engineering is just faster ways to produce code you can't explain, debug or maintain.

**Vibe engineering** is what happens when you take that speed and pair it with discipline. Not the kind of discipline that slows you down, but the kind **that makes speed sustainable**.

> Yet I can't understand why so many "seniors" struggle to see this simple conclusion

And for the love of whatever you believe in, **don't skip the fundamentals**. Any content about **software architecture** is always the best option. Look, I'm not saying anything about _SOLID or Design Patterns_, because IMHO those are just _coding design_, not _software architecture_. Safe to skim them.

I suggest you find your path to **master how systems are created and how they communicate to each other**. That's the _sweet spot_ for software engineering, and that's an ongoing ability we're never done with.

### Books I recommend

If there's one thing I learned about reading tech books, it's that most of them age like milk. Framework-specific books, language tutorials, "building X with Y", they're outdated before the ink dries. I always avoid those.

What I look for are books that are **timeless**. Books about principles, tradeoffs, and how systems think, not configuration tutorials or one random opinion from a guy from Arizona. You read timeless books once and they keep paying dividends years later because the problems they address haven't changed. We still distribute systems, communicate between services and deal with complexity and uncertainty.

Here are five that I keep coming back to:

- The Mythical Man-Month, Fred Brooks. This book is from 1975 (yup, that old) and it's still right. Adding people to a late project makes it later. Communication overhead grows quadratically. There's no silver bullet.

- The Pragmatic Programmer, Hunt & Thomas. This book taught me that programming is not about syntax, it's about thinking. DRY, tracing bullets, **debugging by thinking**. It's practical without being tied to a language or framework. Timeless.

- Fundamentals of Software Architecture, Richards & Ford. This goes straight to the sweet spot I mentioned. Architecture patterns, tradeoffs, modularity, how to make decisions when there's no right answer. The chapter on _tradeoff analysis_ alone is worth the whole book. You read it and you'll never be the same developer.

- Architecture the Hard Parts, Richards, Ford, Mishra & Sadalage. The sequel in spirit. Where most architecture books show you the happy path, this one shows you the distributed transactions. This is the book that teaches you how systems communicate with each other and why that's where the real complexity lives.

- Extreme Programming Explained: Embrace Change, Kent Beck. The book that gave agile its heart. Not the agile of frameworks and certifications, the agile of short cycles, continuous feedback, and actually embracing change instead of pretending you can plan it away. Everything I said about _feedback loops_, small deliverables, test-first, pair programming, Kent Beck was writing about it in 1999. **Embrace change**.

These five books, together, cover exactly what I mean by the sweet spot. How systems are created, how they communicate, how to manage complexity, and how to make decisions under uncertainty. Read them in any order, but read them.

### And for the best...

_Software engineering is dead. Long live software engineering._

---

## Disclosure

This article was written using a TUI editor I built in Rust called [DevTUI](https://github.com/leandronsp/devtui), with the support of GLM 5.1 via pi-agent for drafting and context.

Every single paragraph came from my head. The LLM never wrote a sentence for me. It questioned, suggested, challenged, and I decided. Much like I use it _daily_.

The identity, opinions, takes and bad jokes in this article are 100% mine. The AI was a pair, not a ghostwriter.
