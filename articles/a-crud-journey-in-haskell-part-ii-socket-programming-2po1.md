---
title: "A CRUD journey in Haskell, part II, Socket programming"
slug: "a-crud-journey-in-haskell-part-ii-socket-programming-2po1"
published_at: "2021-08-10 02:50:43Z"
language: "en"
status: "published"
tags: ["haskell", "networking", "tcp", "ruby"]
---

Assuming that [we've got some introduction](https://leandronsp.com/a-crud-journey-in-haskell-part-i-introduction) to Haskell, let's start doing some Socket programming in order to build a simple TCP server. 

## Requirements

For the purpose of this article, I'll expect that you have some knowledge in client-server architecture, basic networking protocols and TCP/IP. 

You can get a deeper understanding on what's a client-server architecture [by reading this article](https://leandronsp.com/web-basics-a-tcp-server-in-ruby), where we explained some networking fundamentals and created a simple TCP server in [Ruby](https://en.wikipedia.org/wiki/Ruby_(programming_language)). 

## TCP server

First things first, we're going to use the [network package](https://hackage.haskell.org/package/network-2.6.3.1/docs/Network-Socket.html) which exposes the module `Network.Socket` that provides full control over TCP sockets. 

`Server.hs`
```haskell
import Network.Socket

main :: IO ()
main = do
  ...
```
This will pretty much provide some essential functions for Socket programming:

- **sock**: creates a new socket given the address family, socket type and protocol number
- **bind**: binds the socket to an address
- **listen**: listen for connections on the socket specifying the max number of queued connections
- **accept**: accepts a connection and returns a connection socket
- **socketToHandle**: turns a connection socket into a handle, ready to be `read/written`

However, the module `Network.Socket` is not enough. It does not provide functions to manipulate the *handle*. Then, we have to import the module `System.IO` that comes with the [base package](https://hackage.haskell.org/package/base-4.15.0.0/docs/System-IO.html).

```haskell
import Network.Socket
import System.IO

main :: IO ()
main = do
  ...
```
The `System.IO` module provides a lot of functions to manipulate I/O, but for now we will need:

- **hGetLine**: reads a line from the handle
- **hPutStrLn**: writes the String to the handle
- **hClose**: closes the handle

Once we presented all the needed functions for our simple TCP server, let's dig into its implementation.

### Setup and accepting connections

First, let's create a new socket:
```haskell
sock <- socket AF_INET Stream 0
```
Bind the socket to the port `4000`:
```haskell
bind sock (SockAddrInet 4000 0)
```
Listen for connections:
```haskell
listen sock 2
```
And, last but not least, accept a connection:
```haskell
-- the server will keep blocked on this line until a new TCP connection arrives
(conn, _) <- accept sock
```
*The `accept` function returns a pair `(conn, address)`, but at this moment we will ignore the client address and use only the `conn` socket*

Now we have our server ready to accept incoming TCP connections. But yet we can't read/write messages through the socket. 

### Manupulating the client socket

Turn a socket into a handle on read/write mode:
```haskell
handleSock <- socketToHandle conn ReadWriteMode
```
Read a line from the `handle` (read request):
```haskell
line <- hGetLine handleSock
putStrLn $ "Request received: " ++ line
```
Send some response back to the `handle`, of course:
```haskell
hPutStrLn handleSock $ "Hey, client!"
```
Now, we can safely close **that** client socket connection:
```haskell
hClose handleSock
```

## The full implementation

Our TCP server is so simple that its implementation looks like this:
```haskell
import Network.Socket                            
import System.IO                                 
                                                 
main :: IO ()                                    
main = do                                        
  sock <- socket AF_INET Stream 0                
  bind sock (SockAddrInet 4000 0)                
  listen sock 2                                  
  putStrLn "Listening on port 4000..."           
                                                 
  (conn, _) <- accept sock                       
  putStrLn "New connection accepted"             
                                                 
  handleSock <- socketToHandle conn ReadWriteMode
                                                 
  line <- hGetLine handleSock                    
  putStrLn $ "Request received: " ++ line        
                                                 
  hPutStrLn handleSock $ "Hey, client!"          
  hClose handleSock                              
```
In order to test the TCP server, let's use a simple TCP client in Ruby that will connect to the server and send a message:

`client.rb`
```ruby
require 'socket'                              
                                              
server = TCPSocket.open('localhost', 4000)
                                              
server.puts 'Hey Server!'                     
                                              
response = ''                                 
                                              
while line = server.gets                      
  response += line                            
end                                           
                                              
puts "Response received: #{response}"         
                                              
server.close                                  
```

Start the server:
```bash
ghc app/Server.hs -e main

# Listening on port 4000...
```
Run the client:
```bash
ruby client.rb
```
Server output:
```bash
Listening on port 4000...    
New connection accepted      
Request received: Hey Server!
```
Client output:
```bash
Response received: Hey, client!
```

### A note on TCP client-server architecture

Note that our TCP server accepts a new connection, reads/writes to the socket, then **closes** the connection, exiting the program. 

A more reliable server should return back to the `listening connections` after every client socket is closed. It means that it must *loop forever*. 

In functional programming, we can loop over a function using **recursion**:

```haskell
loopForever sock = do                            
  (conn, _) <- accept sock                       
  handleSock <- socketToHandle conn ReadWriteMode
                                                 
  line <- hGetLine handleSock                    
  putStrLn $ "Request received: " ++ line        
                                                 
  hPutStrLn handleSock $ "Hey, client!"          
  hClose handleSock                              
  loopForever sock                               
```
- We moved all the code related to a specific client connection to a new function called `loopForever`
- In the last line, we call the function *recursively*

Final implementation:
```haskell
main :: IO ()                                    
main = do                                        
  sock <- socket AF_INET Stream 0                
  bind sock (SockAddrInet 4000 0)                
  listen sock 2                                  
  putStrLn "Listening on port 4000..."           
                                                 
  loopForever sock                               
                                                 
loopForever :: Socket -> IO ()                   
loopForever sock = do                            
  (conn, _) <- accept sock                       
  handleSock <- socketToHandle conn ReadWriteMode
                                                 
  line <- hGetLine handleSock                    
  putStrLn $ "Request received: " ++ line        
                                                 
  hPutStrLn handleSock $ "Hey, client!"          
  hClose handleSock                              
  loopForever sock                               
```
As for now, our TCP server won't exit after closing each client connection. Long live the Server! 🎉

## Conclusion
In this article we learned how to do some basic Socket programming in Haskell. 

This lesson will be the ground for the upcoming posts, which will cover a more sophisticated kind of message over TCP: *the Hypertext Transfer Protocol (HTTP)*.




