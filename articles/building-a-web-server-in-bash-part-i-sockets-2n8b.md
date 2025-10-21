---
title: "Building a Web server in Bash, part I - sockets"
slug: "building-a-web-server-in-bash-part-i-sockets-2n8b"
published_at: "2022-08-01 03:32:44Z"
language: "en"
status: "published"
tags: ["webdev", "http", "linux", "shellscript"]
---

Have you ever wondered _how a Web server works under the hood_? Moreover, would you be willing to sharpen your Shell scripting skills?

Maybe this guide is for you. 

Throughout the guide we are going to build, step-by-step, a simple Web server only using **bash**, as we go further across fundamental terms such as sockets, TCP, HTTP and the triad of web: HTML, CSS and Javascript. 

This guide may be a little too long, but it will be divided in smaller parts for a better comprehension.

Make sure you pick up your UNIX-like terminal, prepare your favourite shell (I'm using bash), grab a cup of coffee and let's go in this journey.

---

## First things first
It's very important that you understand some fundamentals like UNIX standard streams and pipes. Unless you are already comfortable with such terms, [please refer to my series of posts about UNIX](https://dev.to/leandronsp/series/18859).

# Meet netcat
[netcat](https://linux.die.net/man/1/nc) is a computer networking utility for manipulating network sockets such as UNIX, TCP or UDP. 

Make sure you have it in your operating system and install it accordingly.

## A recap about Sockets
In regarding sockets, we may explore first the creation of a UNIX socket, then make two different processes communicate to each other through the socket.

There are two types of UNIX sockets: **stream and datagram**.

_Stream sockets_ establish a **connection** between the server and the client, as the data is sent in a **reliable way**. 

_Datagram sockets_ do not create establish a connection, as the data is **NOT sent in a reliable way**.

In this very guide we'll focus only on **Stream sockets**. 

### UNIX sockets
Let's open a terminal and create a socket called `server.sock`:
```bash
$ nc -Uvl server.sock

Bound on server.sock
Listening on server.sock
```
Understanding the command options:

* -U: specifies that it's a UNIX socket
* -v: verbose mode
* -l: ready to listen to connections into the socket

Now, in another terminal, let's create the client that connects to the existing `server.sock`:
```bash
$ nc -Uv server.sock
```
At this moment, note that in the server's STDOUT, a message `Connection received on server.sock` just appeared. It means that a client has connected, thus both client and server are ready to exchange messages through this connection.

Try typing `PING` from the client side, afterwards go to the server side and type `PONG`. _This is how a client-server architecture works!_

### Standard streams, redirection and pipes all the way
Think for a moment what happened to the `nc` (netcat) process:

* the STDIN was kept open until you typed a message
* the STDIN of the `nc` process was sent to the socket
* when any other message arrived in the socket, it was sent to the STDOUT of the `nc` process

Let's assume this pseudo-abstraction based on UNIX pipes:
```bash
# Server
$ {input} | nc -Ul server.sock | {output}

# Client
$ {input} | nc -U server.sock | {output}
```
What we can learn about this? _We are able to pipe a message to the `nc` command_, then afterwards this message can be sent to the socket. 

It applies for both client and server. Let's see it in action in the server side:
```bash
$ echo PONG | nc -Uvl server.sock

Bound on server.sock
Listening on server.sock
```
`nc` receives the data from the pipe normally like any other UNIX command. It takes the data from the STDIN and stores it to be sent to the socket. 

However, because of the `-l` option, the server is listening to messages in the socket first. Anytime a request message arrives, the response message `PONG` is sent back.

Let's see the client side:
```bash
$ echo PING | nc -Uv server.sock

PONG
```
`nc` receives the data from the pipe normally like any other UNIX command. It takes the data from the STDIN and sends it to the socket, because it's not listening like a server. 

It's just a client: **clients connect to sockets, send messages and then finish their work**. 

That's why we see the response message `PONG` arriving as soon as the client connected. 

### Closing the socket
What if we wanted the server socket to be closed right after a client finishes sending the request message? 

The option `-N` does the job. Try using the following in the server side:
```bash
$ echo PONG | nc -UvlN server.sock
```

### Going to the Internet

Okay, but when we talk about a Web server, we mean that server and client live in separate machines. Such machines must then be connected to the **Internet**, which is the most standard, public and decentralised global computer network.

Because of processes living in different computers, using a UNIX socket is not possible. But the [Berkeley Sockets API](https://en.wikipedia.org/wiki/Berkeley_sockets) was created to solve that problem, as it employs more high-level network protocols that implement the same API as of UNIX sockets. 

Such protocols are called TCP or UDP. We're going to use TCP in this post. 

### TCP sockets
[TCP](https://en.wikipedia.org/wiki/Transmission_Control_Protocol) stands for **Transmission Control Protocol**, and lives in the 4th layer of the Networking [OSI model](https://en.wikipedia.org/wiki/OSI_model). 


![OSI model](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/voznsfcoaloyw9s192z9.png)

**Disclaimer**: _just for testing purposes, we'll keep using client-server in the same machine, but it's completely possible to use TCP locally._ 

Creating a TCP server:
```bash
$ echo PONG | nc -lvN 3000

Listening on 0.0.0.0 3000
```
* -l: listens for TCP connections
* -v: verbose mode
* -N: force a client connection to be closed when data transfer is done

And the TCP client:
```bash
$ echo PING | nc -v localhost 3000

Connection to localhost (127.0.0.1) 3000 port [tcp/*] succeeded!
PONG
```
Note that the connection was established right after the client connected to the socket. The server then immediately sent back the response `PONG` to the client.

But we want to exchange a more sophisticated message through the Internet, right? A kind of message that provides flexibility and security. 

**Hello, HTTP!**

## HTTP
[HTTP](https://en.wikipedia.org/wiki/Hypertext_Transfer_Protocol) is a protocol used for transferring multimedia and hypertext over TCP. It's the [fundamental base](https://developer.mozilla.org/en-US/docs/Web/HTTP/Overview) of the Web.

Before exploring a more sophisticated Web server in bash, let's see how to create a _single-line_ HTTP server using `netcat`, directly on the bash session. 

Instead of responding a simple `PONG` text like we've seen over TCP, we can send a more structured message using the HTTP protocol convention:
```bash
$ echo -e 'HTTP/1.1 200\r\nContent-Type: application/text\r\n\r\nPONG' | nc -lvN 3000

Listening on 0.0.0.0 3000
```
Understanding the HTTP response message:
```text
HTTP/1.1 200       
Content-Type: application/text 

PONG 
```
* `HTTP/1.1 200`: HTTP response status code, [in this case 200 means success](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status)
* `Content-Type: application/text`: HTTP response headers. It could be sent multiple headers in the same HTTP message, as well as NO headers **at all** are also allowed
* _empty line_: this is mandatory, in order to differentiate headers and the remaining response body
* `PONG`: content of the remaining response body

Pretty _straightforward and human-readable_, uh?

Now, let's perform the HTTP client:
```bash
$ echo -e 'GET / HTTP/1.1\r\n\r\n\r\nPING' | nc -vN localhost 3000

Connection to localhost (127.0.0.1) 3000 port [tcp/*] succeeded!
HTTP/1.1 200
Content-Type: application/text

PONG
```
The HTTP message, despite of human-readable, it's not readable easily by computers. Hence, different HTTP clients must know the protocol in order to "parse" and display the body message. 

Let's take an example of HTTP client, the `curl` program:
```bash
$ curl http://localhost:3000/ -d PING

PONG
```
Yay! 

### Adding some HTML sprinkle
[HTML](https://en.wikipedia.org/wiki/HTML) is a markup language used for multimedia, structured content and dynamic web pages when used along with CSS and JS. 

For now, let's change the `Content-Type` HTTP header to allow `text/html` and then add a simple HTML tag to the message:
```bash
$ echo -e 'HTTP/1.1 200\r\nContent-Type: text/html\r\n\r\n<h1>PONG</h1>' | nc -lvkN 3000

Listening on 0.0.0.0 3000
```
As for the client:
```bash
$ curl http://localhost:3000/ 

<h1>PONG</h1>
```
Nice! But, despite of being able to parse an HTTP message, aren't `curl` able to render the HTML sent in the response body?

Nope. `curl` can't do that.

Then let's try to use another HTTP client. It's well-known for rendering HTML content, and I'm pretty sure you already used it before: **yes, I'm talking about the Web browser**.

Open `localhost:3000` in your favourite web browser and..._YAY_!

![PONG HTML](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/m31y11q5ek7luvl884ff.png)

That's WHY it's called a **Web browser**, got the point?

## Wrapping up
This is the first part of the guide, where we learned how to manipulate the `netcat` tool, going through some concepts like TCP, HTTP and a very bit of HTML in a one-liner server. 

In the next upcoming parts, we'll keep exploring the fundamentals in order to build a complete Web server written in ShellScript. 
