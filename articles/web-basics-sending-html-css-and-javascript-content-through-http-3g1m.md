---
title: "Web basics: sending HTML, CSS and Javascript content through HTTP"
slug: "web-basics-sending-html-css-and-javascript-content-through-http-3g1m"
published_at: "2021-05-09 01:23:45Z"
language: "en"
status: "published"
tags: ["ruby", "html", "css", "javascript"]
---

Now that we have [an HTTP server](https://dev.to/leandronsp/web-basics-a-simple-http-server-in-ruby-2jj4) sending plain text content, it's time to enhance the server so it can respond in a more appropriate content type for Web browsers.

## Web standards
In the very beginning of Web, websites did not follow a standard, besides such constraints could take users to a bad navigation experience. 

To mitigate this, the [web standards model](https://www.w3.org/wiki/The_web_standards_model_-_HTML_CSS_and_JavaScript) was created, which then became the foundation of Web, composed by the building blocks HTML, CSS and Javascript.

The idea behind these standards is to establish a well-defined set of *elements, rules and behaviours* for webpages hence providing a better experience for users navigating on Web. 

## Enhance the HTTP server to respond HTML content
Aiming to respond HTML, we should do no more than using [HTML structured elements](https://en.wikipedia.org/wiki/HTML). Let's change our test to expect HTML content from the server response:

```ruby
require 'socket'                                                                               
require 'test/unit'                                                                            
                                                                                               
class ServerTest < Test::Unit::TestCase                                                        
  def test_client_42                                                                           
    server = TCPSocket.open('localhost', 80)                                                    
                                                                                               
    request = "GET /users/42 HTTP/1.1\r\n\r\n"                                                 
    server.puts(request)                                                                       
                                                                                               
    response = ''                                                                              
                                                                                               
    while line = server.gets                                                                   
      response += line                                                                         
    end                                                                                        
                                                                                               
    assert_equal "HTTP/1.1 200\r\nContent-Type: text/html\r\n\r\n<h1>Hey, 42!</h1>\n", response
                                                                                               
    server.close                                                                               
  end                                                                                          
end                                                                                            
```
Note the assertion:
```
HTTP/1.1 200\r\n
Content-Type: text/html\r\n
\r\n
<h1>Hey, 42!</h1> <---- HTMl content in the response body
```
That's enough to go changing the server:
```ruby
...
loop do                                                                                  
  client        = socket.accept                                                          
  first_line    = client.gets                                                            
  verb, path, _ = first_line.split                                                       
                                                                                         
  if verb == 'GET' && matched = path.match(/^\/customers\/(.*?)$/)                       
    user_id  = matched[1]                                                                
    response = "HTTP/1.1 200\r\nContent-Type: text/html\r\n\r\n<h1>Hey, #{user_id}!</h1>"
                                                                                         
    client.puts(response)                                                                
  end                                                                                    
                                                                                         
  client.close                                                                           
end                                                                                      
...
```
Important to note that the header `Content-Type: text/html` is very strict then necessary for some web browsers.

Now, run the test using `make test` which should *pass*. Additionally, test the HTML using curl:
```
curl http://localhost/users/42

=> <h1>Hey, 42!</h1>
```
Open the web browser at `http://localhost/users/42` too and see the content being rendered properly:
![Alt Text](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/m2lap93d9bbtpn6qt6uq.png)
Unlike curl, a web browser is capable of using the header `Content-Type` to render the correct type. Try removing the header from the server response and see that the text will be displayed in plain text:
```html
<h1>Hey, 42!</h1>
```
## CSS to "rule" them all 🥁
What if we wanted to add layout characteristics to our HTML elements? For instance, how to assign the color *red* to the `h1` title?

We can use [CSS](https://en.wikipedia.org/wiki/CSS) to apply layout rules.

#### CSS inline
The most common, despite not encouraged way to write CSS is _inline_ along with the HTMl element, by using the `style` HTMl attribute:
```ruby
body = "<h1 style='color: red'>Hey, #{user_id}!</h1>"
status = 200
response = "HTTP/1.1 #{status}\r\nContent-Type: text/html\r\n\r\n#{body}"

client.puts(response)
...
```
#### CSS in head
It works, but we can separate CSS from the HTML elements so it can be reused for other elements too!
```html
<head>
  <style>
    h1 {
      color: red;
    }
  </style>
</head>

<body>
  <h1>Hey, 42!</h1>
</body>
```
![Alt Text](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/q9fnxzeafxz9f79njvc7.png)
## Adding behaviour with Javascript
[Javascript](https://en.wikipedia.org/wiki/JavaScript) is a programming language used to add runtime behaviour to the HTML elements. 

*Runtime behaviour* means when the HTMl content was already served by the server, as the server closed the connection with the client (web browser), so that the client can leverage on the solely power dynamycs of Javascript.

It can manipulate at various ways, since adding new elements to the page (DOM), removing existing ones, changing their layout rules (CSS), communicating to other websites and so on. 

Every modern web browser comes with a runtime tool for Javascript, so the easiest way to start is opening the [web browser developer tools](https://developer.mozilla.org/en-US/docs/Learn/Common_questions/What_are_browser_developer_tools) and start using it to learn and experiment.

### Changing the element color using Javascript
Let's give the user the ability to click on a button that will change the title's color to blue. Initially, our HTML will look like this:
```html
<head>                                                            
  <style>                                                         
    h1 {                                                          
      color: red;                                                 
    }                                                             
  </style>                                                        
</head>                                                           
                                                                  
<h1>Hey, 42!</h1>                                                 
<button onclick="changeTitleColor()">Change color to blue</button>
                                                                  
<script>                                                          
 function changeTitleColor() {                                    
   let title = document.querySelector('h1');                      
   title.style.color = 'blue';                                    
 }                                                                
</script>                                                         
```
* all the Javascript code will be placed inside the HTML tag `script`
* the `button` element has an *inline* Javascript listener, the `onclick`, which triggers the function `changeTitleColor` when the button is clicked by the user.

### Isolating HTML content from CSS and Javascript
As for the CSS inline, HTML content _should not_ know about CSS rules nor Javascript listeners. Being isolated, it can be reused across multiple HTML files once the application starts growing more.

As such, the representation of our HTML content could be as follows:
```html
<head>                                                                        
  <style>                                                                     
    h1 {                                                                      
      color: red;                                                             
    }                                                                         
  </style>                                                                    
</head>                                                                       
                                                                              
<h1>Hey, 42!</h1>  <---- isolated from CSS flavour                                                            
<button>Change color to blue</button> <---- isolated from Javascript flavour                            
                                                                              
<script>                                                                      
 function changeTitleColor() {                                                
   let title = document.querySelector('h1');                                  
   title.style.color = 'blue';                                                
 }                                                                            
                                                                              
 document.querySelector('button').addEventListener('click', changeTitleColor);
</script>                                                                     
```
* CSS placed under `head`
* HTML isolated from CSS and Javascript
* Javascript placed under `script`

This approach will allow us in the future to even import CSS and Javascript from *different files**, so that we would end up having a file for HTML, other for CSS and yet another for Javascript!

Let's see it in action. In the `server.rb`, we define a "string template" for our structured HTMl, which now is much more rich and complex:

`server.rb`
```ruby
require 'socket'                                                               
                                                                               
socket = TCPServer.new(80)                                                     
                                                                               
template = <<STR                                                               
<head>                                                                         
  <style>                                                                      
    h1 {                                                                       
      color: red;                                                              
    }                                                                          
  </style>                                                                     
</head>                                                                        
                                                                               
<h1>Hey, {{user_id}}!</h1>                                                     
<button>Change color to blue</button>                                          
                                                                               
<script>                                                                       
  function changeTitleColor() {                                                
    let title = document.querySelector('h1');                                  
    title.style.color = 'blue';                                                
  }                                                                            
                                                                               
  document.querySelector('button').addEventListener('click', changeTitleColor);
</script>                                                                      
STR                                                                            
```
Note the `{{user_id}}` "tag". It's not a valid HTML tag, which would make the web browser to render it in plain text. But we want to *replace it* using the real userID, _before the server sends the HTMl to the client_. 

In Ruby, we can do this by using `gsub`:
```ruby
body = template.gsub("{{user_id}}", user_id)
```
## The final implementation
After all of those minor improvements, our server implementation looks like the following:
```ruby
require 'socket'                                                               
                                                                               
socket = TCPServer.new(80)                                                     
                                                                               
template = <<STR                                                               
<head>                                                                         
  <style>                                                                      
    h1 {                                                                       
      color: red;                                                              
    }                                                                          
  </style>                                                                     
</head>                                                                        
                                                                               
<h1>Hey, {{user_id}}!</h1>                                                     
<button>Change color to blue</button>                                          
                                                                               
<script>                                                                       
  function changeTitleColor() {                                                
    let title = document.querySelector('h1');                                  
    title.style.color = 'blue';                                                
  }                                                                            
  document.querySelector('button').addEventListener('click', changeTitleColor);
</script>                                                                      
STR                                                                            
                                                                               
loop do                                                                        
  client        = socket.accept                                                
  first_line    = client.gets                                                  
  verb, path, _ = first_line.split                                             
                                                                               
  if verb == 'GET' && matched = path.match(/^\/customers\/(.*?)$/)             
    user_id  = matched[1]                                                      
    body     = template.gsub("{{user_id}}", user_id)                           
    response = "HTTP/1.1 200\r\nContent-Type: text/html\r\n\r\n#{body}"        
                                                                               
    client.puts(response)                                                      
  end                                                                          
                                                                               
  client.close                                                                 
end                                                                            
```
Then, after opening it in the web browser, we have the result:
![Alt Text](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/of7xgn41xle24pank055.gif)
## Wrapping up
Understanding [how web works](https://developer.mozilla.org/en-US/docs/Learn/Getting_started_with_the_web/How_the_Web_works) is very important for web developers. In this post we learned the third part of the serie of "Web basics 101", which consists of sending HTML content through HTTP. 

HTML is no more than a simple string content following a standard format for webpages. Along with CSS and Javascript being sent over HTTP, they are all the foundation of Web powering modern websites with rich content and usability. 

