---
title: "Building a Web server in Bash, the grand finale"
slug: "building-a-web-server-in-bash-the-grand-finale-n14"
published_at: "2022-08-01 03:35:17Z"
language: "en"
status: "published"
tags: ["webdev", "html", "css", "javasccript"]
---

What a journey. In the [previous post](https://dev.to/leandronsp/building-a-web-server-in-bash-part-iii-login-a03) we experienced a refactoring in our ShellScrpit web server, _adding a complete login/logout system to it._

Now, let's finish this guide and enhance our web server with more HTML, styling CSS and dynamic behaviour with _modern Javascript_. 

---
## What's CSS?
[CSS](https://en.wikipedia.org/wiki/CSS) is a stylesheet language used mainly for describe the presentation of HTML documents. In other words, giving style and making our HTML elements _prettier_. 

## What about Javascript?
[Javascript](https://www.w3schools.com/js/) is the world's most popular programming language. 

The [Web foundation](https://webfoundation.org/) decided that HTML pages could go beyond simple static pretty elements: _they can interact dynamically with other elements_, or even interact with other sites and pages. **That's why Javascript was created in the first place**, to bring behaviour to static HTML pages. 

## Adding some style
As for now, the `login.html` looks like as follows:
```html
<form method="POST" action="/login">
  <input type="text" name="name" />
  <input type="submit" value="Login" />
</form>
```
It's just a static form. We could place it to the center, improve the border by making it more round and so on. 

_CSS comes to the rescue._

Just add CSS syntax inside a `<style>` HTML tag, as the web browser will do the correct rendering for you. It's a good practice to place it before the HTML body, in the `<head>` section, since the browser will have the style already loaded upon body rendering.

```html
<html>
  <head>
    <style>
      section {
        display: inline-block;
        margin-left: 40%;
        margin-top: 10%;
      }

      input[name="name"] {
        height: 30px;
        margin-top: 20%;
        border: 1px solid #999;
        border-radius: 4px;
      }
    </style>
  </head>

  <body>
    <section>
      <form method="POST" action="/login">
        <input type="text" name="name" />
        <input type="submit" value="Login" />
      </form>
    </section>
  </body>
</html>
```
Now, let's do the same for the `home.html`:
```html
<html>
  <head>
    <style>
      section {
        display: inline-block;
        margin-left: 40%;
        margin-top: 10%;
      }
    </style>
  </head>

  <body>
    <section>
      <p>Hello, {{name}}</p>

      <form method="POST" action="/logout">
        <input type="submit" value="Logout" />
      </form>
    </section>
  </body>
</html>
```
_Amazing! Our web app is getting a better shape!_

## Adding some dynamic behaviour
Let's assume we want to add a link to the home page (after login), where the user can change to the "Blue Theme" or the "Black Theme". Something like this:

![home page](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/uaoj38qcwssbq7j65mxl.png)

First, we should add the link:
```html
<section>
  <p>Hello, {{name}}</p>

  <form method="POST" action="/logout">
    <input type="submit" value="Logout" />
  </form>

  <a href="javascript:void(0)">Blue theme</a>
</section>
```
The `href="javascript:void(0)"` means that HTTP requests will be disabled in this link, because we're going to use it as a dynamic element in Javascript.

How do we add Javascript to the HTML document? Simply put, inside the HTML tag `<script>`. Good practice to place it **after the HTML body tag**, because if for some reason the script has a bug or some similar, the page is correctly rendered to the user even in the presence of a broken Javascript code (_Web roots 101, peeps_).

```javascript
<script>
  let themeElem = document.querySelector('a');
  let nameElem  = document.querySelector('section > p');

  themeElem.addEventListener('click', function(evt) {
    if (nameElem.style.color == 'blue') {
      nameElem.style.color = 'black';
      themeElem.text = 'Blue theme';
    } else {
      nameElem.style.color = 'blue';
      themeElem.text = 'Black theme';
    }
  })
</script>
```
Let's explain a little bit:

* we query the `p` and `a` elements, because we'll interact with them
* we add an event listener to the anchor `a` element. The listener will wait for **clicks**
* anytime we click in the anchor, the callback function is called
* the rest is just programming basics

I truly recommend you, being a beginner or experienced developer, to explore and dig into the [Javascript documentation](https://developer.mozilla.org/en-US/docs/Web/JavaScript). It's very rich, well-written and full of improvements that we sometimes are not aware of. 

Now, let's see the full version of our `home.html` page:
```html
<html>
  <head>
    <style>
      section {
        display: inline-block;
        margin-left: 40%;
        margin-top: 10%;
      }

      section p {
        color: black;
      }
    </style>
  </head>

  <body>
    <section>
      <p>Hello, {{name}}</p>

      <form method="POST" action="/logout">
        <input type="submit" value="Logout" />
      </form>

      <a href="javascript:void(0)">Blue theme</a>
    </section>
  </body>

  <footer>
    <script>
      let themeElem = document.querySelector('a');
      let nameElem  = document.querySelector('section > p');

      themeElem.addEventListener('click', function(evt) {
        if (nameElem.style.color == 'blue') {
          nameElem.style.color = 'black';
          themeElem.text = 'Blue theme';
        } else {
          nameElem.style.color = 'blue';
          themeElem.text = 'Black theme';
        }
      })
    </script>
  </footer>
</html>
```
---
## Conclusion
It's been a great journey. This post is the last of the guide. I don't know if there will be upcoming posts, but in case it's true, I'll be writing more stuff here and adding it to the guide. 

I hope you enjoyed the guide. All the code written here is shared in [this gist](https://gist.github.com/leandronsp/3a81e488b792235b2be73f8def2f51e6).

Feel free to shout me out at [twitter](https://twitter.com/leandronsp). 



