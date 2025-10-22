---
title: "Web basics: a simple HTTP Server in Ruby"
slug: "web-basics-a-simple-http-server-in-ruby-2jj4"
published_at: "2021-05-03 19:10:30Z"
language: "en"
status: "published"
tags: ["ruby", "tdd", "http"]
---

[In the previous article](https://leandronsp.com/articles/web-basics-a-tcp-server-in-ruby-947), we learned the very basics of networking and how to write a simple TCP server in Ruby.

Here, we'll see a simple implementation of an HTTP server in Ruby.

## Dynamic response
As of our example, the TCP server responds with a static message, `Hey, client!`. 

What if we wanted a dynamic response, for instance:

- client A requests, server responds "Hey, A!"
- client B requests, server responds "Hey, B!"

...and so on.

Let's change our test:

`tcp_test.rb`
```ruby
require 'socket'
require 'test/unit'

class ServerTest< Test::Unit::TestCase
  def test_client_a
    server = TCPSocket.open('localhost', 4242)

    request = 'HELLO from client=A'
    server.puts(request)

    response = server.gets
    assert_equal "Hey, A!\n", response

    server.close
  end
end
```
And, as for the server implementation, we'll change a little bit to either:

- loop forever. then for each iteration, waits for a client connection and executes the request-response logic
- look up for a match in the request. If request matches our lookup pattern ([regex](https://en.wikipedia.org/wiki/Regular_expression)), server responds accordingly

`tcp_server.rb`
```ruby
require 'socket'                                        
                                                        
socket = TCPServer.new(4242)                            
                                                        
loop do                                                 
  client = socket.accept                                
  request = client.gets                                 
                                                        
  if result = request.match(/^HELLO from client=(.*?)$/)
    client_id = result[1]                               
    response  = "HEY, #{client_id}!"                     

    client.puts(response)                                                         
  end                                                   
                                                        
  client.close                                          
end                                                     
```
* server accepts a client connection
* server checks if request message matches the regex
* in case of match, server responds to the client

Tests passing, time to move on.

## Upgrading to HTTP
[HTTP](https://en.wikipedia.org/wiki/Hypertext_Transfer_Protocol) is an application layer and protocol used to establish a set of rules for Web applications. HTTP is, essentially, the foundation of Web.

In order to make our client-server to support HTTP, we should request and respond messages using the [HTTP format](https://developer.mozilla.org/en-US/docs/Web/HTTP/Messages).

### HTTP Request
The format of an HTTP request message should be as follows:
```
{verb} {path} HTTP/1.1\r\n
{request_header_1}\r\n
{request_header_2}\r\n
{request_header_n}\r\n
\r\n
{request_body}
```
Notes:
* request headers and request body are optional
* carriage return (`\r\n`) are mandatory

Here's the example of an HTTP request message without headers:
```
GET /customers/42 HTTP/1.1
```
With headers:
```
GET /customers/42 HTTP/1.1
Host: myhost.com
Accept: text/html
```
With  headers and body:
```
POST /customers HTTP/1.1
Content-Type: application/x-www-form-urlencoded
Content-Length: 38

email=test@acme.com&password=pass123
```
### HTTP Response
The format of an HTTP response message isn't much different from the request
```
HTTP/1.1 {status}\r\n
{response_header_1}\r\n
{response_header_2}\r\n
{response_header_n}\r\n
\r\n
{response_body}
```
Notes:
* response headers and response body are optional
* carriage return (`\r\n`) are mandatory

Example of an HTTP response message without headers:
```
HTTP/1.1 204 NoContent
```
With headers:
```
HTTP/1.1 201 Created
Location: http://myhost.com/customers/42
```
With headers and body:
```
HTTP/1.1 200 OK
Content-Type: text/html

<h1>Ola</h1>
```

### Testing
Let's write a test to send an HTTP request message through the TCP socket at the port `80`. _It could be on any other port, e.g `4242`, but let's use port 80 which is the standard for HTTP applications_.

`http_server_test.rb`
```ruby
require 'socket'                                               
require 'test/unit'                                            
                                                               
class ServerTest < Test::Unit::TestCase                        
  def test_http_customer_42                                         
    server = TCPSocket.open('localhost', 80)                 
                                                               
    request = """
      GET /customers/42 HTTP/1.1\r\n
      Accept: plain/text\r\n
      \r\n
    """
           
    server.puts(request)                                       
                                                               
    response = ''                                              
                                                               
    while line = server.gets                                   
      response += line                                         
    end                                                        
                                                               
    expected = """
      HTTP/1.1 200\r\n
      \r\n
      Hey, 42!\n
    """

    assert_equal expected, response
                                                               
    server.close                                               
  end                                                          
end                                                            
```
Then, the server implementation as follows:

`http_server.rb`
```ruby
require 'socket'                                         
                                                         
socket = TCPServer.new(80)                               
                                                         
loop do                                                  
  client = socket.accept                                 
  first_line = client.gets                               
  verb, path, _ = first_line.split                       
                                                         
  if verb == 'GET'                                       
    if result = path.match(/^\/customers\/(.*?)$/)         
      client_id = result[1]                              
      response = "HTTP/1.1 200\r\n\r\nHey, #{client_id}!"
      client.puts(response)                              
    end                                                  
  end                                                    
                                                         
  client.close                                           
end                                                      
                                                         
socket.close  
```
Test should pass!

### HTTP is stateless by default
It's strictly important for us, as developers, to understand one of the main traits of a web server, its _stateless_ nature. 

Such knowledge will save many hours of debugging in the future.

Here are the flow of an HTTP server:

* accepts a new client connection
* reads the client request
* performs some logic based on the client request
* sends a response to the client
* **closes the client connection**
* repeat the process

Note that this loop is important, since the server will **forget** anything that has been exchanged with a specific client. 

**HTTP is stateless by default**. There are ways to make a _persistent stateful HTTP connection_, but that's a topic for another blogpost.

## HTTP Clients
Until now we've been using TDD, so our test plays the role of the "HTTP client". However there are lots of HTTP clients available. 

The Web browser is one of them.

### Web browser

Start the server, open your web browser and visit `http://localhost/customers/42`. The webpage should display the message in just plain text:
```
Hey, 42!
```
Also, check the developer console network of your web browser. You should see something similar to:
![Alt Text](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/g02osuty254vrcv7g5se.png)
_I'm using Safari in this example_.

More HTTP clients:
#### curl
```
ubuntu:~ $ curl -v http://localhost/customers/42
*   Trying 127.0.0.1:80...
* TCP_NODELAY set
* Connected to localhost (127.0.0.1) port 80 (#0)
> GET /customers/42 HTTP/1.1
> Host: localhost
> User-Agent: curl/7.68.0
> Accept: */*
> 
* Mark bundle as not supporting multiuse
< HTTP/1.1 200
* no chunk, no close, no size. Assume close to signal end
< 
Hey, 42!
* Closing connection 0
```
#### Postman
![Alt Text](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/4qmy2wj2nz4lfl5g1lve.png)

## Summary
In this blogpost we've seen what's HTTP and how to implement a simple HTTP server in Ruby. Next post will focus on HTML, CSS and Javascript, which altogether shape the World Wide Web.



