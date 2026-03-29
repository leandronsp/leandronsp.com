---
title: "Thinking like containers"
slug: "thinking-like-containers-3k24"
published_at: "2022-08-09 14:06:00Z"
language: "en"
status: "published"
tags: ["docker", "linux"]
---

We can't deny how popular [Docker containers](https://www.docker.com/resources/what-container) became on the daily basis of many software developers around the world. Moreover, it is a mainstream technology behind [cloud-native](https://en.wikipedia.org/wiki/Cloud_native_computing) applications such as [Kubernetes](https://en.wikipedia.org/wiki/Kubernetes) and it's used as  the deployment engine at various production systems. 

However, its learning curve is not so friendly for many, considering that the fundamentals of Linux containers is not widely taught. On this post I will try to briefly explain the building block for containers and how to use the Docker container runtime to boost productivity.

## Virtualization
To understand a container, we should understand what is virtualization at first. 

Virtualization is a solution to the problem of isolating and having a completely different environment sharing the same "machine". Each virtualized environment would have its own memory, disk and CPU quotas. For instance:

- Machine RAM: 16GB
- Windows 10 quota: 4GB
- Ubuntu 18.04 quota: 4GB

However, virtualization has a cost: it does not share the same [OS kernel](https://en.wikipedia.org/wiki/Kernel_(operating_system)). In case we want to have a small virtualized web-application in our machine, such app will bootstrap a different kernel and load a lot of runtime libraries.

It's useful for those who want a fully virtualized operating system but not ideal for general-purpose applications. That's where _containers_ come in.

## Containers
Containers are the solution of sharing the same physical resources, the same kernel space, but still isolated. 

In short: **a container is an isolated space in our computer where we can run a different OS, and from that OS we are able to install whatever we want and run any command without affecting our local machine, the host**.

For me, that's exactly the _fascinating part_ of using containers. Following are some benefits I can highlight.

### Experimentation
Since all the needed dependencies belong to the containers, we will no longer face installation problems in our computer, library conflicts, version upgrades and so on. 

All the messy stuff that sometimes, _prevent us from doing more experimentation_. Gone.

### Context switch
Sometimes, many of us work on a variety of projects. Switching contexts may be cumbersome. One project uses the PostgreSQL 9.5 while other uses PostgreSQL 11. Managing two Postgres instances in your local environment? Good luck with that. 

By using containers, context switch is easily as doing:
```bash
$ docker rm -f postgres_9
$ docker run --name postgres_11 postgres:11 
```

### Uniformization
Containers allow to run a different operating system. What about if we choose to run the same production environment in our computer? 

It takes us to a different position where we have _full control_ on the application. That's WAY easier to debug and replicate bugs since we are using the same OS and libraries. 

No more "it works on my machine" or "it DOES NOT work on my machine". 

### Deploy agnostic
The steps to deploy are exactly the same be it on our computer or in the production environment.
```bash
$ docker run --name my_application my_application
```
Furthermore, the container **does not care** about the environment it's running in. We can EASILY push our container to another server and run it from there. Almost _zero_ configuration needed.

Want to try a cheaper cloud-provider? Cool. Your container WILL run there effortlessly.

## Container Runtimes
In order to run containers, we need to install and configure a [container runtime](https://en.wikipedia.org/wiki/Open_Container_Initiative). For the purpose of this article, and due to its popularity, we will use **Docker**.

### First container
So let's suppose we have a new computer with just the Operating System installed. And a browser, of course :)

Assuming that [you have Docker properly configured](https://docs.docker.com/get-docker/), we want to run `bundle install` in some application we have but remember, _we don't have Ruby installed in our computer_.

- we don't want to install Ruby neither its dependencies
- we just wanna run `bundle install` inside the container and that's all

First things first:
```bash
$ docker run ruby:2.7
```
The `run` command takes a pre-defined container _image_ somewhere and starts a container following the **rules** described from that very _image_. Where did the `ruby:2.7` image come from? [Docker Hub](https://hub.docker.com). Think of it like a `Github` for Docker images. 

There are more Container _registries_ but Docker Hub, such as [Github Registry](https://github.com/features/packages), [Amazon ECR](https://aws.amazon.com/ecr/), to name a few. We can change the registry anytime by using the command [docker login](https://docs.docker.com/engine/reference/commandline/login/).

The above command did nothing but showing a message `Switch to inspect mode.`. That's because the default command pre-defined in the image `ruby:2.7` is the `irb`, which means the container will try to allocate a [pseudo-TTY](https://stackoverflow.com/questions/30137135/confused-about-docker-t-option-to-allocate-a-pseudo-tty) so we can interact on that [tty](https://en.wikipedia.org/wiki/Tty_(unix)), or "terminal".

For doing so, we should use a flag option in the `run` command:
```bash
$ docker run -it ruby:2.7

### Options
-t Allocate a pseudo-TTY
-i Keep STDIN open even if not attached
```
Now, we have a full Ruby 2.7 installation ready to receive instructions, right on our computer with no host installation required! 

That's a big YAY, in my point of view :D

### Entering a container
We can run arbitrary commands other than the default:
```bash
$ docker run ruby:2.7 ls
```
It:
- creates the container using the image
- runs the `ls` command inside the container
- exits the container

Knowing that we can run any command, we can run the `bash` command, which will take us right into the container:
```bash
$ docker run -it ruby:2.7 bash

# Remember that the bash, as the same as irb, will 
# allocate a pseudo-TTY
```
What if we try to run `bundle` inside the container?
```bash
$ Could not locale Gemfile
```
Here's why: containers are _isolated_. Think of separate "computers" (containers) inside our computer (host).

How about "copying" our files **from host to container**? We can use [Volumes](https://docs.docker.com/storage/volumes/).
```bash
$ docker run \
    -it \
    -v $(pwd):/app \
    ruby:2.7 \
    bash

## Options
-v source:target, where the source is our current dir on host (pwd), and target a folder we will cal "app" in the container
```
Now, inside the container, we can run `bundle install`. If you are using a common Ruby application with Gemfile, it will start installing the gems using bundler! 

The bundler config and installed gems are located in the standard directory, `/usr/local/bundler`.

### Containers are ephemeral
Try to exit the container and entering it again. Run `bundle install`. What will happen?

_It will install the gems all over again_. Boring. That's because containers are ephemeral and do not persist state. If we want to _keep_ the state of the container, we should *send back anything we want to the host*.  Using what? 

Yes, volumes.
```bash
$ docker run \
    -it \
    -v $(pwd):/app \
    -v bundler_gems:/usr/local/bundler \
    ruby:2.7 \
    bash
```
This time, the volume is a bit different, because it's not using the `relative path`, but using a `named volume` instead. Docker has this feature where we can create _named_ volumes **in the host**, as we don't care where this volume is persisted. Somewhere in our computer, for sure. But we don't care. 

We are just saying:
```
I want to associate anything "inside /usr/local/bundler" 
FROM the container 
TO a volume named "bundler_gems" 
ON the host
```
The first `bundle install` will take time, because the volume is still empty. But from the second time and on, everytime we run a _new container_, Docker will associate the named volume to the `/usr/loca/bundler` inside the container and **vice-versa**. 

That's the nature of volumes: two-way binding. You change from host, it will affect the container. If you change from the container, it will affect the host.

## Conclusion
This article was an introduction on containers and, being more strict, on how to _think_ like a container. 

I think the ride to containers is worth. A bit "fuzzy" at start but it will pay back as soon as we feel we can experiment more on computers.

And in case you want to keep learning it, check out my [series of posts](https://leandronsp.com/articles/kubernetes-101-part-i-the-fundamentals-23a1) about containers and Docker. 
