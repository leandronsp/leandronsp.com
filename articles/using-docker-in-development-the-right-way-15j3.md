---
title: "Using Docker in development the right way"
slug: "using-docker-in-development-the-right-way-15j3"
published_at: "2021-06-29 23:32:00Z"
language: "en"
status: "published"
tags: ["docker", "containers"]
---

_If you are not proficient in Docker, or that topics like containers and virtual machines are still a bit "fuzzy", have problems working with Docker in development but want to learn and work using containers, this article is for you._

Few weeks ago I wrote an article on [Thinking like containers](https://dev.to/leandronsp/thinking-like-containers-3k24), where I did an introduction on containers and explained the problem that containers solve.

## Production usage
The most popular usage of containers is at _production environments_, because the team can pack up the application into an image containing the runtime and all the needed dependencies. 

Such a process helps to deploy the application in isolation and makes it _server-agnostic_, meaning that it can technically be easily deployed at any cloud provider in the world. 

Containers [follow a standard](https://opencontainers.org). They will run homogeneously anywhere.

## Development usage

However, some people advocate for containers and use them in development too. 

One way to do it, is by downloading the application image used in production and running the container locally. 
Pretty cool, because it helps to replicate bugs with ease, since the container doesn't care whether it's running **in a remote server at AWS or in your local machine**. The runtime, dependencies and the application itself: exactly the same as production.

Unless you are trying to replicate some _very specific_ bug, you don't need to download the bloated production image locally. 

### Using Docker the wrong way

![Install Docker](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/pew9nxgbtffi9kccs5ak.jpg)

Try to think on the following scenario: 

- You start working on a new project
- They already use containers (Docker) in production
- You configure your local environment based on the image declared in the `Dockerfile`

All is ok here. 

- You run `docker-compose up`, which then starts building the application _image_, installing hundreds of dependencies needed for the application
- Afterwards, your server is running at `localhost:8080`. Great, you check it and start coding

Everything's pretty ok right here.

But after writing some code, you want to see it in action. You run `docker-compose up` again and that's where you face your worst nightmare: it will install all the dependencies over and over again, at _every time you start up the server_. 

You then realize that Docker and all its container party are a pure **waste of time**. You give up and install all the application environment in your host machine. 

Good luck with that.

### How about fixing the Dockerfile?
Yes, chances are that the Dockerfile is [not following the best practices](https://docs.docker.com/develop/develop-images/dockerfile_best-practices/), which makes very difficult the container usage in _development_.

In this article I won't cover the [best practices](https://docs.docker.com/develop/develop-images/dockerfile_best-practices/) for writing a good Dockerfile, but certainly it will be covered in a future post.

I'll focus on another aspect.  

### Forget how those real projects are using Docker
It sounds counterintuitive at first but my argument is that, if you start using Docker today, and thinking that _containers work exactly like you see in the company's projects_, you are doomed. 

Containers go **beyond** that way. I suggest first learning [how containers work](https://dev.to/leandronsp/thinking-like-containers-3k24 ). Experiment on them. Try out different things and technologies using them.

Then, only then, you can use containers on real projects the right way. 

### What's the right way then?
Let's supposed you don't have NodeJS installed in your host. People would first install NodeJS, depending on your operating system, configure it and do a couple of things before being able to run:
```
node hello_world.js
```
But using Docker, you don't need to install anything else but Docker in your host computer. By doing so, you could run your command _from inside a container_:
```
docker run node hello_world.js
```
In terms of performance, it takes almost the same time as running from the host. It's unnoticeable. 

It also gives you the ability to have a "version manager" out-of-the-box:
```
docker run node:10 hello_world.js
docker run node:12 hello_world.js
```
Now, there's no longer need to change your version manager [every three years](https://www.saashub.com/asdf-vm-alternatives) just because everyone is using "a fancy new cool version manager".

Your host machine will thank you. 

## Tips for using containers (Docker) effectively in development

In the upcoming sections I'll share some tips that maybe will help you to understand the problem containers solve.

### Image !== container

Try to really [understand and use containers](https://docs.docker.com/get-started/overview/), not images. Only then, learn [how images work](https://docs.docker.com/get-started/overview/). Images are your last resort.

### Learn volumes

[Mastering volumes](https://docs.docker.com/storage/volumes/) **will save your life**. Seriously. 

Learn how they work and how then can effectively boost your productivity. 

They are not as hard as they seem to be. 

### Learn the Docker network

Containers are isolated by design. You use them because you don't want to mess up with your host computer. 

But in real projects containers need intercommunication. [Learn how to take advantage of the Docker network](https://docs.docker.com/network/) and let your containers talk to each other.

### Use docker CLI first. Then docker-compose

The [Docker documentation reference](https://docs.docker.com/engine/reference/commandline/cli/) is pretty good and will provide you almost every information you need to make your projects running on Docker.

Use the `docker CLI` heavily. Suffer. Feel the pain on the command-line. 

Then, only then, [go to docker-compose](https://docs.docker.com/compose/) and truly understand how docker-compose CLI helps you even more on a daily basis. 

### Build a pet project using Docker

This is a perfect exercise for learning Docker. Resist the impulse to install or use something from your host. Put your web server in a container. Put your database in a container. 

Build a real pet-project full-stack application from the scratch, this is the best way to get comfortable using Docker. 

You won't regret and never go back. 

## Conclusion
In this article I tried to explain technically why I think Docker is misinterpreted by many developers. 

Arguments such as "Docker is too much", or "Docker is only useful for production", usually come with lack of understanding. There are very well [documented best practices](https://docs.docker.com/develop/dev-best-practices/) around Docker in development that, if correctly applied, will refute those arguments. 

Of course, after all, using Docker in development is not mandatory. It's just a tool, similar to saying you like coding in Vim or VSCode. 







