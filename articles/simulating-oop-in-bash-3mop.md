---
title: "Simulating OOP in Bash"
slug: "simulating-oop-in-bash-3mop"
published_at: "2022-08-06 01:30:00Z"
language: "en"
status: "published"
tags: ["oop", "bash", "linux"]
---

Everyone knows that OOP stands for "Object-oriented programming". But what is **in fact** OOP? Is it a _Class_? Is it _inheritance_ and polymorphism like we learned across hundreds of tutorials?

Indeed, despite inheritance and polymorphism being **important traits** that complement OOP languages, none of them define the original concepts of OOP. 

In this post, I'll try to demonstrate some elementary OOP concepts while we go together through a _bit of history_ along with a very simple simulation of OOP in, you heard well, **Bash script**.  

---

## The OOP definition
According to the [wikipedia](https://en.wikipedia.org/wiki/Object-oriented_programming):
> OOP is a programming paradigm based on the concept of "objects", which can contain data and code.

In other words, OOP provides a _structure_ where we can group related data or _state_, in the form of **attributes**; and code or _behaviour_, in the form of **functions or methods**.

For instance, we could think of an object that **represents** a _Bank Account_:

![object](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/ilbt443omgvqpf9fs1yu.png)

Everything related to a Bank Account could be grouped into this very single structure, **an object**. 

## How is OOP implemented?
In the early 60's, a bunch of projects such as [Simula](https://en.wikipedia.org/wiki/Simula) emerged with some implementations of "objects". Basically it allowed to hold state and behaviour into a single unit called _object_. 

Later on the 70's, Simula concepts influenced Alan Kay to create [Smalltalk](https://en.wikipedia.org/wiki/Smalltalk), an oriented-object programming language which opened a wide range of OO-based programming languages that came in the upcoming decades. 

Despite of many tutorials and courses prefer focusing on inheritance and polymorphism to explain OOP, I'd like to highlight 2 main traits that are exclusively **elementary and enough** for enabling OOP:

1. objects must be able to **hold a state** (attributes)
2. objects must be able to hold behaviour (functions) and **execute/dispatch those functions dynamically** at run time

## Why Bash?
You may be wondering: _why in this world one would choose Bash to implement OOP_?

I wanted to use a language which is not OOP by design. Also, such a language must not support [lexical scope](https://en.wikipedia.org/wiki/Scope_(computer_science)#Lexical_scope), which is a very important characteristic in order to have the 2nd trait ([dynamic dispatch](https://en.wikipedia.org/wiki/Dynamic_dispatch)) in place.  

[Bash](https://en.wikipedia.org/wiki/Bash_(Unix_shell)) is a command shell and **script language** that is implemented using simple [grammar rules](https://en.wikipedia.org/wiki/Compiler) hence it does not support _lexical scope_. 

Don't worry, we'll understand what is _lexical scope_ later in this post. Let's start the implementation.

---

## First trait: objects must hold state
Can we implement the first trait using Bash? **Let's try.**

Objects must follow some sort of _template_. Then, we're going to create an `Object` function that will represent the object template.
```bash
Object() {
}
```
Pretty simple. Now, we have to call this function with some arguments. Suppose we want to create objects using the following syntax:
```bash
Object account leandroAccount name=Leandro balance=500
```
That would be great, wouldn't it? May we explain the function arguments:

* `$1`: the type of object, in this case, `account`
* `$2`: the reference to the object, `leandroAccount`
* `$3`+: a key-pair structure that should be parsed then saved into the object's internal state

Okay, time to implement the `Object` function. In bash, there's no "internal state" of functions. Indeed, there's a _local scope_ but it can't be used across different "objects" we may create. 

_What should we do then?_ **Use global state.**

It's weird, I know, but it's the only way to define an object's state in Bash, since it has no _lexical scope_.

> Lexical scope is used to define a reserved area in memory for structures that may be evaluated with arbitrary arguments.

But we can do a trick, by **prepending the object's reference** at every attribute, for instance:

* `leandroAccount_name` refers to the leandroAccount's name
* `leandroAccount_balance` refers to the leandroAccount's balance
* `carlosAccount_name` refers to the carlosAccount's name

...and so on.
```bash
Object () {
  # e.g account
  kind=$1
  
  # e.g leandroAccount
  self=$2
  
  shift 
  shift
  
  # iterates over the remaining args
  for arg in "$@"; do
    # e.g name=Leandro becomes ARG_KEY=name ARG_VALUE=Leandro
    read ARG_KEY ARG_VALUE <<< $(echo "$arg" | sed -E "s/(\w+)=(.*?)/\1 \2/")
    
    if [[ ! -z "$ARG_KEY" ]] && [[ ! -z "$ARG_VALUE" ]]; then
      # declare the object's state!!!!
      # e.g export leandroAccount_balance=100
      export ${self}_$ARG_KEY="$ARG_VALUE"        
    fi
  done
}
```
Super nice! Let's play a bit:
```bash
Object account leandroAccount name=Leandro balance=500

echo $leandroAccount_name    # prints Leandro
echo $leandroAccount_balance # prints 500

Object account carlosAccount name=Carlitos balance=800

echo $carlosAccount_name    # prints Carlitos
echo $carlosAccount_balance # prints 800
```
Yay! We just proved that it's possible to implement the first trait, **holding an object's state**, in pure Bash script, _using global scope and object reference_.

So far, so good, isn't it?

## Second trait: objects must support dynamic dispatch
Looking at the [wikipedia](https://en.wikipedia.org/wiki/Dynamic_dispatch):

> Dynamic dispatch is the process of selecting which implementation of a polymorphic operation (method or function) to call at **run time**. It is commonly employed in, and considered a prime characteristic of, object-oriented programming (OOP) languages and systems.

Can we implement this second trait, **important for the object's behaviour**, in Bash? _Let's try_. 

As one could guess, we can implement behaviour using functions. Suppose we want to call functions as follows:
```bash
$leandroAccount_fn_display

Hello, Leandro. Your balance is 100
```
In order to allow _saving the function name_ into the object's scope, we'd have to support **lexical scope**, which opens possibilities for computing techniques and structures such as late bindings and closures.

Unfortunately, Bash has no support for lexical scope due to its simple grammar rules. Remember that it's a _script language_, after all. 

But we can do another trick as well. How about passing the scope (object) **as an argument** to the function? Something like:
```bash
$account_fn_display leandroAccount
```
Let's try it. 

First, we have to define the `display` function:
```bash
display() {
  self=$1

  name=${self}_name
  balance=${self}_balance

  echo "Hello, ${!name}. Your balance is ${!balance}"
}
```
Great. Now, time to create the object using the function as an argument:
```bash
## Note that we're using a different syntax for functions, by prepending a "fn_", otherwise it would conflict with function attributes
Object account leandroAccount name=Leandro balance=500 fn_display
```
And, of course, we have to parse the fn argument in the `Object` function, by just adding the `elif` clause:
```bash
# ... code here

## Parse argument when matching functions
## e.g fn_display -> FUNC=display
read FUNC <<< $(echo "$arg" | sed -E "s/fn_(\w+)$/\1/")
...
elif [[ ! -z "$FUNC" ]] && [[ "$FUNC" != "$self" ]]; then
  ## Define the function in the global scope, prepending the object kind, e.g account_fn_display, user_fn_logout etc
  export ${kind}_fn_$FUNC=$FUNC
fi

# ... code here
```
At this time we are all set, as we can already call the function passing the object to it:
```bash
Object account leandroAccount name=Leandro balance=500 fn_display
Object account carlosAccount name=Carlitos balance=800 fn_display

$account_fn_display leandroAccount
$account_fn_display carlosAccount

#### Result ####
Hello, Leandro. Your balance is 100
Hello, Carlitos. Your balance is 800
```
Super Yay! 

We just proved that it's perfectly possible to implement the second trait in Bash too, by using function local scope, object reference and argument passing. 

Thus, **we can say we can implement OOP in Bash**. Okay, very limited, but possible. 

## Adding more functions
Now, we can unlock the power of OOP in Bash by adding more behaviour as much as we want.

Must implement a `deposit` function? No problem, that should be super easy at this moment:
```bash
deposit() {
  self=$1

  currentBalance=${self}_balance
  amount=$2

  export ${self}_balance=$(($currentBalance + $amount))
}
```
And then:
```bash
Object account leandroAccount name=Leandro balance=100 fn_display fn_deposit

$account_fn_deposit leandroAccount 50
$account_fn_display leandroAccount

## Result
Hello, Leandro. Your balance is 150
```
OMG, _what a wonderful day!_

## Grouping related data and behaviour together
At this moment, we have two functions at the script scope, _with no semantic meaning_. 

We can create another function that would wrap attributes and functions related to "accounts". What about calling such a function, `Account`?
```bash
Account() {
  display() {
    self=$1

    name=${self}_name
    balance=${self}_balance

    echo "Hello, ${!name}. Your balance is ${!balance}"
  }

  deposit() {
    self=$1

    currentBalance=${self}_balance
    amount=$2

    export ${self}_balance=$(($currentBalance + $amount))
  }

  Object account "$@"
  Object account $1 fn_display
  Object account $1 fn_deposit
}
```
No way, **it looks like a `Class`** we see in many Java/C++/Ruby tutorials! 

But it's not a class in Bash. In the end, we're just *simulating OOP*.

However, since Bash relies in global scope because of its scripting language nature, we can organize our code using OOP, then allowing to interacting with objects like the following:
```bash
Account accountA name=Leandro balance=100
Account accountB name=John balance=500

$account_fn_deposit accountA 50

$account_fn_display accountA
$account_fn_display accountB
```

**That's amazing!**

---
## Conclusion
In this article I wanted to explain 2 important traits in OOP by using Bash script. 

[This great blogpost](https://hipersayanx.blogspot.com/2012/12/object-oriented-programming-in-bash.html) inspired me to explore implementing OOP in Bash. I'm not an expert in Bash, but it was very fun and pleasant to play at this matter.

I hope you enjoyed the article, feel free to drop any comments. The code is shared [in this gist](https://gist.github.com/leandronsp/5e7c94ee5b4ea53ed28e9824ca8e243e).

Not to mention, follow me in [Twitter](https://twitter.com/leandronsp) and [Linkedin](https://www.linkedin.com/in/leandronsp/). 
