---
title: "Building a Web server in Bash, part III - Login"
slug: "building-a-web-server-in-bash-part-iii-login-a03"
published_at: "2022-08-01 03:34:27Z"
language: "en"
status: "published"
tags: ["webdev", "linux", "html", "shellscript"]
---

In the [previous posts](https://dev.to/leandronsp/building-a-web-server-in-bash-part-ii-parsing-http-14kg) we've seen how to manipulate sockets using *netcat*. Moreover, we learned how to start reading and parsing an HTTP message using ShellScript. 

_Time to definitely improve our app_.

---

## App requirements
Since our application is a Web application, we should respond in a more appropriate way. Let's define some requirements for our application:

* `GET /login` should render an HTML form containing just a text field called "Name" to perform the login
* `GET /` should render a home page containing the text `Hello, {{name}}`. Where does the `{{name}}` come from? We'll see soon, but we should read the HTTP header `Cookie`. 
* `POST /login` should request with a body containing the name coming from the HTML form. Afterwards, the server responds an `HTTP 301` with a header `Set-Cookie`, so the client could use this cookie to perform future requests such as `GET /`
* `POST /logout` should request with a header `Cookie` containing the name. Afterwards, the server responds an `HTTP 301` with a header `Set-Cookie` using an expiration date in the past. This way, a client HTTP will permanently remove the Cookie. 

### Web fundamentals matter
If you need, read the requirements again. 

**Make no mistake**, this is exactly how a simple web app used to work _prior to the blast of frontend frameworks circa 2015_. 

Software abstractions are good and save us _a lot of time_, but unfortunately they also _keep developers far from the basics_. It's very important for us as developers, to understand **how servers keep sessions across HTTP requests**. 

If you acknowledge that HTTP requests are stateless (the server usually closes the TCP connection at every request), a wide range of capabilities will open for _debugging and troubleshooting_. 

Let's build a **login system**, and as soon as we understand that HTTP requests are stateless, we realize the logins _do not exist_. 

After all, originally, the web mostly uses **HTTP header Cookies** to store user data in the HTTP client-side, _sending those cookies across future requests to the same domain._

## Separate HTTP responses in files
A good practice is to keep our HTTP responses in separate files, thus leading to a more readable and extensible code:

`cat login.html`
```html
HTTP/1.1 200 OK
Content-Type: text/html

<form method="POST" action="/login">
  <input type="text" name="name" />
  <input type="submit" value="Login" />
</form>
```

`cat 404.html`
```html
HTTP/1.1 404 NotFound
Content-Type: text/html

<h1>Sorry, not found</h1>
```
Okay, with HTML files in place, let's see how our function `handleRequest` looks like so far:
```bash
function handleRequest() {
  ## Read request, parse each line and breaks until empty line
  while read line; do
    echo $line
    trline=`echo $line | tr -d '[\r\n]'`

    [ -z "$trline" ] && break

    HEADLINE_REGEX='(.*?)\s(.*?)\sHTTP.*?'
    [[ "$trline" =~ $HEADLINE_REGEX ]] &&
      REQUEST=$(echo $trline | sed -E "s/$HEADLINE_REGEX/\1 \2/")
  done
   
  ## Route to the response handler based on the REQUEST match
  case "$REQUEST" in
    "GET /login") RESPONSE=$(cat login.html) ;;
               *) RESPONSE=$(cat 404.html) ;;
  esac

  echo -e "$RESPONSE" > response
}
```
Yes, much more shorter and readable. 

## Keep the server running forever
Not sure if you noticed, but the server is being closed at every client connection, which is making us to run the server over and over again, at every single time we want to perform a new HTTP request. 

We can keep the server in an infinite loop. By doing this, we no longer need to run the server for every request:
```bash
while true; do
  cat response | nc -lN 3000 | processRequest
done
```
_How cool is that?_

## Nice, but show me some login
Okay. Open `localhost:3000/login` in your web browser, type a name in the form and submit it. 

I'm sure you got the response "Sorry, not found", right?

No problem, now go to the server STDOUT and check the message coming from the HTTP client:
```text
POST /login HTTP/1.1
Host: localhost:3000
Content-Length: 12
....
....
```
What does it mean? 

Following the HTTP standard, web browsers perform a `POST` on a form submit, like we have in `form action=POST`. Upon submission, **every field is then added to the HTTP request body.** 

Please also note that the HTTP message contains a lot of HTTP headers (I'm using Google Chrome), but the HTTP body is nowhere to be found. _Why's that?_

We should keep reading the request body after the empty line, remember? However, we should first acknowledge the "length" of the body, otherwise, _when should we stop reading the remaining bytes_?

Thankfully, the HTTP standard covers that. The web browser has already sent an important header called `Content-Length`. 

Our work is then basically **parsing this header and use it to read the remaining HTTP request message bytes**, the _body_. 

## Reading the HTTP body message
Similar to the headline parsing, inside the reading loop, let's place:
```bash
CONTENT_LENGTH_REGEX='Content-Length:\s(.*?)'

[[ "$trline" =~ $CONTENT_LENGTH_REGEX ]] &&
      CONTENT_LENGTH=`echo $trline | sed -E "s/$CONTENT_LENGTH_REGEX/\1/"`
```
Now, after the reading loop, we should read the remaining bytes in case there's a `Content-Length` header (not always clients send the `Content-Length` header). 
```bash
## Check if Content-Length is not empty
if [ ! -z "$CONTENT_LENGTH" ]; then
  BODY_REGEX='(.*?)=(.*?)'

  ## Read the remaining request body
  while read -n$CONTENT_LENGTH -t1 body; do
    echo $body

    INPUT_NAME=$(echo $body | sed -E "s/$BODY_REGEX/\1/")
    INPUT_VALUE=$(echo $body | sed -E "s/$BODY_REGEX/\2/")
  done
fi
```
Nice. Go and perform a `POST /login`, you should see the body being displayed in the server STDOUT!

Explaining the read:

* `-n {N}`: reads an arbitrary number of bytes from a file or STDIN
* `-t {T}`: timeout to read the entire message from the STDIN
* inside the body reading loop, we parse each line trying to find a match to `field=value` coming from the `POST` HTTP request

_Fantastic!_

## Handle the message
Reading the body message is no way close to the end. We have to handle it in the `switch-case`, remember?

How about refactoring to something like this?
```bash
## Route to the response handlers (functions)
case "$REQUEST" in
  "GET /login")   handle_GET_login ;;
  "GET /")        handle_GET_home ;;
  "POST /login")  handle_POST_login ;;
  *)              handle_not_found ;;
esac
```
All we have to do is implementing the above functions. Let's start the `handle_POST_login`:
```bash
function handle_POST_login() {
  RESPONSE=$(cat post-login.http | \
    sed "s/{{cookie_name}}/$INPUT_NAME/" | \
    sed "s/{{cookie_value}}/$INPUT_VALUE/")
}
```
* reads the `post-login.http` file
* search and replace for a pattern using `sed`
Now, let's check the `post-login.http` file:
```text
HTTP/1.1 301
Location: http://localhost:3000/
Set-Cookie: {{cookie_name}}={{cookie_value}}; path=/; HttpOnly
```
Time to perform the test. Check yourself a dead-simple login _written in ShellScript_!

---
## Finally, the complete implementation

![finally](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/w9pof0kkoybmc41fpao1.png)

### Handle request
First we should:

* setup the FIFO
* put `netcat` in a loop
* handle requests

```bash
#!/bin/bash

## Create the response FIFO
rm -f response
mkfifo response

function handleRequest() {
  ## Read request
  while read line; do
    echo $line
    trline=$(echo $line | tr -d '[\r\n]')

    [ -z "$trline" ] && break

    HEADLINE_REGEX='(.*?)\s(.*?)\sHTTP.*?'
    [[ "$trline" =~ $HEADLINE_REGEX ]] &&
      REQUEST=$(echo $trline | sed -E "s/$HEADLINE_REGEX/\1 \2/")

    CONTENT_LENGTH_REGEX='Content-Length:\s(.*?)'
    [[ "$trline" =~ $CONTENT_LENGTH_REGEX ]] &&
      CONTENT_LENGTH=$(echo $trline | sed -E "s/$CONTENT_LENGTH_REGEX/\1/")

    COOKIE_REGEX='Cookie:\s(.*?)\=(.*?).*?'
    [[ "$trline" =~ $COOKIE_REGEX ]] &&
      read COOKIE_NAME COOKIE_VALUE <<< $(echo $trline | sed -E "s/$COOKIE_REGEX/\1 \2/")
  done

  ## Read body
  if [ ! -z "$CONTENT_LENGTH" ]; then
    BODY_REGEX='(.*?)=(.*?)'

    while read -n$CONTENT_LENGTH -t1 line; do
      echo $line
      trline=`echo $line | tr -d '[\r\n]'`

      [ -z "$trline" ] && break

      read INPUT_NAME INPUT_VALUE <<< $(echo $trline | sed -E "s/$BODY_REGEX/\1 \2/")
    done
  fi

  ## Route to the response handlers
  case "$REQUEST" in
    "GET /login")   handle_GET_login ;;
    "GET /")        handle_GET_home ;;
    "POST /login")  handle_POST_login ;;
    "POST /logout") handle_POST_logout ;;
    *)              handle_not_found ;;
  esac

  echo -e "$RESPONSE" > response
}

echo 'Listening on 3000...'

## Keep server running forever
while true; do
  ## 1. wait for FIFO
  ## 2. creates a socket and listens to the port 3000
  ## 3. as soon as a request message arrives to the socket, pipes it to the handleRequest function
  ## 4. the handleRequest function processes the request message and routes it to the response handler, which writes to the FIFO
  ## 5. as soon as the FIFO receives a message, it's sent to the socket
  ## 6. closes the connection (`-N`), closes the socket and repeat the loop
  cat response | nc -lN 3000 | handleRequest
done
```
In short, the server:

1. waits for FIFO
2. creates a socket and listens to the port 3000
3. as soon as a request message arrives to the socket, pipes it to the handleRequest function
4. the handleRequest function processes the request message and routes it to the response handler, which writes to the FIFO
5. as soon as the FIFO receives a message, it's sent to the socket
6. closes the connection (`-N`), closes the socket and repeat the loop

### Implement the handle response functions
Look at the `switch-case`. It's pretty simple but the functions are yet to be implemented.

Place them before the `handleRequest` function, because ShellScript expects functions to be declared prior to calling.
```bash
function handle_GET_home() {
  RESPONSE=$(cat home.html | \
    sed "s/{{$COOKIE_NAME}}/$COOKIE_VALUE/")
}

function handle_GET_login() {
  RESPONSE=$(cat login.html)
}

function handle_POST_login() {
  RESPONSE=$(cat post-login.http | \
    sed "s/{{cookie_name}}/$INPUT_NAME/" | \
    sed "s/{{cookie_value}}/$INPUT_VALUE/")
}

function handle_POST_logout() {
  RESPONSE=$(cat post-logout.http | \
    sed "s/{{cookie_name}}/$COOKIE_NAME/" | \
    sed "s/{{cookie_value}}/$COOKIE_VALUE/")
}

function handle_not_found() {
  RESPONSE=$(cat 404.html)
}
```
### Place the files accordingly
Now that we have the `handle response` functions, note that all of them expect HTTP/HTML files to exist. Let's create them.
`login.html`
```html
HTTP/1.1 200 OK
Content-Type: text/html

<form method="POST" action="/login">
  <input type="text" name="name" />
  <input type="submit" value="Login" />
</form>
```
`home.html`
```html
HTTP/1.1 200 OK
Content-Type: text/html

<p>Hello, {{name}}</p>

<form method="POST" action="/logout">
  <input type="submit" value="Logout" />
</form>
```
`404.html`
```html
HTTP/1.1 404 NotFound
Content-Type: text/html

<h1>Sorry, not found</h1>
```
`post-login.http`
```text
HTTP/1.1 301
Location: http://localhost:3000/
Set-Cookie: {{cookie_name}}={{cookie_value}}; path=/; HttpOnly
```
`post-logout.http`
```text
HTTP/1.1 301
Location: http://localhost:3000/login
Set-Cookie: {{cookie_name}}={{cookie_value}}; path=/; HttpOnly; Expires=Thu, 01 Jan 1970 00:00:00 GMT
```
---
**So much YAY!**

## Wrapping up
Today we walked through refactoring our Web server. 

We added more capabilities, making it a complete web server _delivering a login, home page and logout features_. 

In the next steps we'll explore the triad of Web: HTML, CSS and JS.



