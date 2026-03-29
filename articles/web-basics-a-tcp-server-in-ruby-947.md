---
title: "Web basics: a TCP Server in Ruby"
slug: "web-basics-a-tcp-server-in-ruby-947"
published_at: "2021-04-30 23:56:54Z"
language: "en"
status: "published"
tags: ["ruby", "tcp", "http", "programming"]
---

This series guide covers the very basics of Web and the building blocks of a Web server. 

If you have ever wondered on how a Web server works and have a basic knowledge of Ruby, this guide is for you.

Essentially, the _main_ elementary units of a web server are:

* Client-server architecture model
* TCP - Transmission Control Protocol
* HTTP - Hypertext Transfer Protocol
* HTML/CSS/Javascript 

## Client-server model
Client-server model is a networking structure that allows different devices connecting to each other over a **computer network**, being [local](https://en.wikipedia.org/wiki/Local_area_network) or [public (Internet)](https://en.wikipedia.org/wiki/Internet). 

Consider two different devices connected to a network:

* the client (web browser) requests a webpage to the server
* the server (another computer in the network) that **serves** the requested webpage to the client

![Alt Text](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/p5j22eyx9s0yo7esonb5.png)

In order to establish a client-server connection, it's essential to indicate some kind of "agreement" among devices. Such agreement holds information like devices location, message being sent and so on. 

This is the [communication protocol](https://en.wikipedia.org/wiki/Communication_protocol), composed by [layers](https://en.wikipedia.org/wiki/OSI_model) ranging from physical material up to application traits.

We won't dig further into all layers but focus only on layers that contain [TCP](https://en.wikipedia.org/wiki/Transmission_Control_Protocol) and [HTTP](https://en.wikipedia.org/wiki/Hypertext_Transfer_Protocol). The following image illustrates the communication layers and its protocols:

![Alt Text](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/1axhzvy9bn9tvjwkp638.png)

## TCP
[Transmission Control Protocol](https://en.wikipedia.org/wiki/Transmission_Control_Protocol) is one of the main transport protocols in the OSI model. It embraces reliability and is responsible to deliver a message from one point to another.

In each device, we have to open **endpoints** that will be used by the TCP to send and receive data. A single computer can open and close thousands of endpoints. Those endpoints are called [Sockets](https://en.wikipedia.org/wiki/Network_socket).

In Ruby we can implement a TCP client-server by using the package [socket](https://ruby-doc.org/stdlib-2.7.0/libdoc/socket/rdoc/Socket.html) which is included in the standard library. 

### TCP Client
Let's create a `TCP client` using `test/unit`, which means: _the test will be the client_.

`tcp_test.rb`
```ruby
require 'socket'
require 'test/unit'

class ServerTest< Test::Unit::TestCase
  def test_tcp_request_response
    server = TCPSocket.open('localhost', 4242)
    
    request = 'Hello, server!'
    server.puts(request)

    response = server.gets
    assert_equal "Hey, client!\n", response

    server.close
  end
end
```
- the test takes into account that we have opened a socket server in the port `4242`
- `localhost` refers to the same local machine, but it could be any valid [location address](https://en.wikipedia.org/wiki/IP_address) in the internet
- the test (client) sends a request message to the server
- the test (client) reads the response message from the server
- the test (client) closes the socket connection to the server

If we try to run the test (`ruby tcp_test.rb`), we'll get the following error:
```
SocketError: getaddrinfo: Name or service not known
```
Which means there's no opened socket server in the port 4242 of localhost. Let's make the test pass.

### TCP Server

`tcp_server.rb`
```ruby
require 'socket'            
                            
socket = TCPServer.new(4242)
                            
client = socket.accept      
request = client.gets       
                            
response = 'Hey, client!'       
client.puts(response)       
                            
client.close                
socket.close                
```
* server creates a new socket in the port 4242
* server accepts connections to the socket and waits for a new connection to come in
* when a new client connection arrives, server reads the request message from the client
* server sends a response message to the client
* server closes the connection with client
* server closes the socket and terminates itself

Because the server must run in a separate process, we have to first:

- start the server, `ruby tcp_server.rb`
- open a new tab or window, and run `ruby tcp_test.rb`

Expectation: the test should _pass_ and the server should _terminate_.
```
1 tests, 1 assertions, 0 failures, 0 errors, 0 pendings, 0 omissions, 0 notifications
100% passed
```
## Wrapping Up
This post was the first part of series and an introduction to the client-server model along with building a simple TCP server in Ruby with TDD. 

In the upcoming posts we'll learn about HTTP.





