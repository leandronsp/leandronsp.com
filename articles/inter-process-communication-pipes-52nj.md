---
title: "Inter-process communication: pipes"
slug: "inter-process-communication-pipes-52nj"
published_at: "2022-07-14 03:40:13Z"
language: "en"
status: "published"
tags: ["unix", "linux"]
---

After learning how [OS processes can use file descriptors](https://dev.to/leandronsp/inter-process-communication-files-1m34) for IPC, it's time to analyse another IPC approach: pipes.

---
Let's recap the following example:
```bash
$ echo 'my precious' > rawcontent.txt
$ base64 < rawcontent.txt
```
* the program `echo` sends data to the redirected STDOUT
* the `echo` output is used as the redirected STDIN for the program `base64`

Note the pattern here: it looks like a **pipeline of data transformation**, where the output of the first program is "enqueued" to the input of the second program. 

## UNIX pipelines
UNIX-like systems provide a mechanism for IPC called **pipeline**.

Instead of writing such a sentence in multiple lines, the OS allows us to write the entire sentence in a single line using the operator `|` between programs.
```bash
$ echo 'my precious' | base64

bXkgcHJlY2lvdXMK
```
You've seen this pipe stuff elsewhere, am I right? 

It's called **[anonymous pipe](https://en.wikipedia.org/wiki/Anonymous_pipe)**.

### Anonymous Pipe
Anonymous pipes employ a FIFO (first-in, first-out) communication channel for *one-way*  IPC. 

By *one-way*, it means the data flows in one-direction only. It's the opposite of *bi-direction* communication, where data flows in both directions in a *full-duplex* way.

```bash
$ ps ax | grep docker | tail -n 3

62374 s039  S+     0:05.31 /usr/local/bin/com.docker.cli run -it ubuntu bash
65442 s040  S+     0:02.93 docker run -it ubuntu bash
65445 s040  S+     0:02.86 /usr/local/bin/com.docker.cli run -it ubuntu bash
```
When a **pipe** (`|`) is created, it's opened a *pair of file descriptors*, one for *writing* and other for *reading*. 

Because pipes are *anonymous*, both file descriptors last only as long as the processes, so they are automatically closed when both processes terminate. 

## Named pipes
Similar to anonymous pipes, **named pipes** also employ FIFO (first-in, first-out) communication channel for *one-way*  IPC. 

The main difference is that named pipes are created explicitly using the program `mkfifo <filename>`. A *single file* in the **filesystem** is then created, which will be opened for *reading* by one process and for *writing* by another process. 

```bash
$ mkfifo myqueue
```
A file called **myqueue** is created. The *reader* process can then open the pipe:
```bash
$ cat myqueue
```
The process keeps blocked until a message arrives in the pipe.

Meanwhile, another process can *write* to the pipe:
```bash
# The echo message STDOUT is being redirected to the pipe, because it's a file!
$ echo 'some message' > myqueue
```
Now look at the message arriving in the *reader* process:
```bash
$ cat myqueue

some message
```
Be aware that named pipes *live beyond the processes* they are bound to, hence they should be removed manually when become unused:
```bash
rm myqueue
```

**_Yay!_**

---
## Conclusion
In this article we learned how UNIX-like systems use pipes for IPC. 

Primarily, pipes are a *one-way* communication channel for IPC.

Anonymous pipes use **a pair of file descriptors** and are closed automatically when the process is finished. 

Named pipes use a *named file* in the filesystem and should be closed manually when they are no longer used. 

I hope you could understand a bit more about IPC. In the next post I'll cover UNIX sockets for inter-process communication.


