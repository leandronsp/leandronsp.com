---
title: "Building a Web server in Bash, part II - parsing HTTP"
slug: "building-a-web-server-in-bash-part-ii-parsing-http-14kg"
published_at: "2022-08-01 03:33:37Z"
language: "en"
status: "published"
tags: ["webdev", "http", "linux", "shellscript"]
---

In the [first part](https://leandronsp.com/articles/building-a-web-server-in-bash-part-i-sockets-2n8b) of this guide, we walked through the basics of netcat `nc` command, from basic UNIX sockets to TCP sockets, all the way writing an _HTML content inside the HTTP response body_. 

Now, let's go further on writing some ShellScript, towards a more sophisticated Web server that delivers features like _login, homepage and logout_.

---

## Just a static response
So far, we've seen just a static response being sent to the socket.
```bash
# -N: closes the client connection when there's no more data to read
$ echo -e 'HTTP/1.1 200\r\n\r\n\r\n<h1>PONG</h1>' | nc -lvN 3000

Listening on 0.0.0.0 3000
```
No matter what kind of requests we send, the response is _still_ always the same:
```bash
$ curl http://localhost:3000/
<h1>PONG</h1>

$ curl http://localhost:3000/users
<h1>PONG</h1>

$ curl -X POST http://localhost:3000/login -d name=Leandro
<h1>PONG</h1>
```

## Providing a dynamic response
We have to find a way to make our response dynamic. It can't be a static string. But how do we achieve that?

Let's think for a bit about a potential solution.

* netcat's STDIN is redirected to some structure like a "queue" (FIFO)
* `netcat` reads a request message from the socket
* the request message is processed then a response is sent to the STDIN. In this case, to the `FIFO` structure
* as the FIFO structure contains the STDIN of the netcat process, it can be then sent to the socket

What's this "FIFO" structure we have learned in the [previous posts](https://leandronsp.com/articles/inter-process-communication-pipes-52nj)? **Yes, named pipes!**

That's a great solution, _isn't it_?

## Using FIFO as the response
Okay, time to write the very first version of our web server.
```bash
$ mkfifo response
$ cat response | nc -lvN 3000

Listening on 0.0.0.0 3000
```
In a second window, perform the HTTP request:
```bash
$ curl http://localhost:3000/
```
We can see the request message arriving to the server's STDOUT but any response is sent back. Because it's a FIFO, and we _haven't yet written_ any message to the FIFO, right?

In a third window, try the following:
```bash
$ echo -e 'HTTP/1.1 200\r\n\r\n\r\n<h1>PONG</h1>' > response
```
Note that in the second window (HTTP client), the message `<h1>PONG</h1>` arrives. And in the first window (the HTTP server), the connection is closed as expected. 

However, the response not yet dynamic. We are writing by ourselves directly in the FIFO. 

We should instead process the request from the STDOUT, parse it somehow, do something, and afterwards, **write a dynamic response to the FIFO**. That will be our _HTTP response_.

All this abstractions should live in the server side process. Time to dive in shell scripting for real.

---

## Processing the HTTP request
Remember first that the HTTP request is sent _from the client side_, **going through the socket**, and finally sent to the _netcat STDOUT_. 

In order to write a more readable code, we should wrap the request processing in a separate shell function. 

Here's the first version of our `server`:
```bash
#!/bin/bash

### Create the response FIFO
rm -f response
mkfifo response

function handleRequest() {
    # 1) Process the request
    # 2) Route request to the correct handler
    # 3) Build a response based on the request
    # 4) Send the response to the named pipe (FIFO)
}

echo 'Listening on 3000...'

cat response | nc -lN 3000 | handleRequest
```
That's pretty much what we need to build the web server. For the sake of simplicity, we're going to keep all the code inside the function `handleRequest`, as we are free to refactor along the way.

Inside the `handleRequest` we should write code that processes the request, parses it and builds the appropriate response which can be sent to the named pipe (FIFO).

As we are piping netcat's STDOUT to the function's STDIN, how do we read the HTTP request? 

_Yes, using the `read` command or `cat`. _

Though, because we have to parse each line of the HTTP request, we're going to use the `read` command in a loop, but first let's recap how an HTTP message looks like.

### Anatomy of an HTTP request message
```text
GET / HTTP/1.1\r\n
```
This is the very first line, also called **headline**. It's a pattern `{http_verb} {path} {protocol_version}` followed by a `\r\n`.

Next, the following lines represent the **HTTP headers**, which can be empty as they are not mandatory. It's a pattern of `{header_name}: {header_value}` followed by a `\r\n`:
```text
Content-Type: text/html\r\n
Connection: keep-alive\r\n
```
Now, the next line is just a single `\r\n` (empty line). **It's mandatory**, because it separates the headers from the remaining HTTP message: **the HTTP body**. 
```text
\r\n
```
Finally, the **HTTP request body**, which is _NOT_ mandatory:
```text
<h1>PING</h1>
```
Let's see the entire HTTP request message:
```text
GET / HTTP/1.1\r\n
Content-Type: text/html\r\n
\r\n
<h1>PING</h1>
```
### Anatomy of an HTTP response message
It's also important to understand the _HTTP response format_. It's quite similar to the HTTP request format, with a slightly difference in the _headline_.

Please note that the headers, empty line and the body have the same format for _both request and response_. 
```text
HTTP/1.1 200\r\n # {protocol_version} {status_code}
Content-Type: text/html\r\n
\r\n
<h1>PONG</h1>
```
## Reading the HTTP request
We should read line by line in a `loop` until we find the empty line `\r\n` (we'll see how to read the HTTP body later in this guide).
```bash
function handleRequest() {
  while read line; do
    echo $line
    trline=`echo $line | tr -d '[\r\n]'`

    if [ -z "$trline" ]; then
      break
    fi
  done

  echo -e 'HTTP/1.1 200\r\n\r\n\r\n</h1>PONG</h1>' > response
}
```
Note the line:
```bash
trline=`echo $line | tr -d '[\r\n]'`
```
...which removes the `\r\n`. Next, in case the `$trline` is empty:
```bash
# -z means empty
if [ -z "$trline" ]; then
  break
fi
```
...we break the loop and keep executing the script after the loop, till we write the response to the FIFO:
```bash
echo -e 'HTTP/1.1 200\r\n\r\n\r\n</h1>PONG</h1>' > response
```
An improved version could be using the `if` one-liner. It's less verbose, and could be as follows:
```bash
[ -z "$trline" ] && break
```
Okay, that's great and all, but the response is not yet dynamic as we expect. 

Trust me, we are almost there. Let's start processing the request using [regular expressions](https://en.wikipedia.org/wiki/Regular_expression) (**regex**) in each request line. 

One could use a lot of alternatives to match regular expressions in bash. At this guide, we're going to use the `sed` command. It's very powerful and flexible.

Inside the `loop`, we check if the line matches the headline regex. In case is does, we save the _verb & path_ in the `REQUEST` variable:
```bash
while read line; do
  echo $line
  trline=`echo $line | tr -d '[\r\n]'`

  [ -z "$trline" ] && break

  HEADLINE_REGEX='(.*?)\s(.*?)\sHTTP.*?'

  [[ "$trline" =~ $HEADLINE_REGEX ]] &&
    REQUEST=$(echo $trline | sed -E "s/$HEADLINE_REGEX/\1 \2/")
done
```
Now, the dynamic response, outside the reading loop:
```bash
case "$REQUEST" in
  "GET /") RESPONSE="HTTP/1.1 200 OK\r\nContent-Type: text/html\r\n\r\n</h1>PONG</h1>" ;;
        *) RESPONSE="HTTP/1.1 404 NotFound\r\n\r\n\r\nNot Found" ;;
esac

echo -e $RESPONSE > response
```
Using the above `switch-case` structure, we can check if:

* the request matches `GET /`, which we respond the message `<h1>PONG</h1>`
* otherwise, we respond a 404 `Not Found` message

Such YAY! Our web server is taking some good shape. 

---

## Wrapping up
We just learned a bit about the _HTTP message format_ as well as some shell scripting, making our server to respond dynamically.

In the upcoming parts we expect to enhance our function `handleRequest` as we add more capabilities to it.
