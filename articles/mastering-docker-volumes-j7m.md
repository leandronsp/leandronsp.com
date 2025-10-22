---
title: "Mastering Docker Volumes"
slug: "mastering-docker-volumes-j7m"
published_at: "2022-02-05 01:06:00Z"
language: "en"
status: "published"
tags: ["docker", "containers", "linux"]
---

For those just starting with Docker, I've written some posts on [how to think like containers](https://leandronsp.com/articles/thinking-like-containers-3k24), which I believe to be an *important* mindset to using Docker, as well as [using Docker in development, the right way](https://leandronsp.com/articles/using-docker-in-development-the-right-way-15j3). 

However, if you want to move one step further on mastering Docker, it's important to understand how [volumes](https://docs.docker.com/storage/volumes/) and [networking](https://docs.docker.com/network/) work in Docker. 

In this post, I'll guide you through the Volume basics, [leaving Networking for another post](https://leandronsp.com/articles/mastering-the-docker-networking-2h57). 

## Containers are ephemeral
It's important to keep in mind that containers are ephemeral. Whenever the container finishes executing the _command_, it's completely "shut down". 

```bash
=> docker run node ls

bin
boot
dev
etc
home
lib
media
mnt
opt
proc
root
run
sbin
srv
sys
tmp
usr
var
```
It starts a _new_ container using the image node **and** executes the command `ls` (list files and directories) inside the container. 

The command gives an output and is _finished_. Once the command is finished, the container is shut down and all **its data is lost**. 

## Executing a Javascript program
Let's suppose we have a file containing a very basic Javascript program:

`helloWorld.js`
```js
greeting = (message) => {
  console.log(message)
}

greeting("Hello, world")
```
How can we run this program using containers? One could try to  do something like:
```bash
docker run node node helloWorld.js
```
...which raises the error:
```bash
Error: Cannot find module '/app/helloWorld.js'
...
```
That's because containers are **isolated** and do not share the same Host filesystem.

## Sync data between Host and Container
We have to sync the file `helloWorld.js` with the containers. Docker provides a way to **mount volumes**, which means:

> I want to mount a directory or file _from_ the Host to the Container, so every change made in the Host will be mirrored to the Container, and **vice-versa**. 

You change the file/directory in the Host, the container will see the changes. You change the file/directory in the container, the Host will see the changes. 

Let's sync the `helloWorld.js` with the container:
```bash
docker run 
  -v $(pwd)/docker-101/helloWorld.js:/app/helloWorld.js 
  node 
  node /app/helloWorld.js
```
```bash
Hello, world
```
...where:
* **pwd** refers to the full pathname of the [_current directory_](https://en.wikipedia.org/wiki/Pwd)
* **-v {hostPath}:{containerPath}** mounts the file/directory to the container
* **node** is the image
* **node /app/helloWorld.js** executes the command using the path defined inside the container, `/app/helloWorld.js`

## A real project
Suppose we have a project tree like this:
```bash
/docker-101
  /src
    /components
    components.js
  index.js
```
From inside the `docker-101` directory, we want to run a container using the `index.js` file, but all the files in the `src` folder _must_ be in the container app as well.
```bash
docker run 
  -v $(pwd):/app
  node
  node /app/index.js
```
All the files within the `pwd`, current directory, will be mounted to the `/app` within the container.

What if we want to _enter_ the container and manipulate the files from there?
```bash
docker run 
  -it
  -v $(pwd):/app
  node
  bash
```
...where:
* **-it** instructs Docker to keep the container terminal (bash/shell) open
* **bash** opens a new bash/shell inside the container
```bash
root@8dcbfa6d777c:/# cd /app

root@8dcbfa6d777c:/app# ls
index.js  src

root@8dcbfa6d777c:/app# touch new-file.js

root@8dcbfa6d777c:/app# ls
index.js  new-file.js src

root@8dcbfa6d777c:/app# exit
exit
```
Now, after exiting the container, if we perform `ls` _from the host_, we get:
```bash
index.js    new-file.js src
```
This type of volume is called **Path Volume**.

## Using _mount_ option
Another way to mount volumes is by using the `--mount` option, which specifies the type of the mount, a _source_ and a _target_.

```bash
docker run 
  --mount type=bind,source=$(pwd),target=/app
  node
  node /app/helloWorld.js
```
The `mount` is more explicit, but in most cases using `-v` should be good enough. 
## Another real example
Imagine we want to print the timestamp for current time. We can do this in a lot of ways, but as for now we're going to use the [underscore](http://underscorejs.org) library. 

`index.js`
```js
var _ = require('underscore');

console.log(_.now())
```
We execute `docker run -it -v $(pwd):/app node node /app/index.js` and we get the following error:
```bash
Error: Cannot find module 'underscore'
```
Obviously, we have to add the `underscore` dependency to our project. Let's do it using `npm`:
```bash
docker run 
  -v $(pwd):/app 
  -w /app
  node
  npm add underscore
```
```bash
added 1 package, and audited 2 packages in 2s
```
Note the `-w /app`, which means **working directory**, where we are telling Docker to execute the command from within that directory. In our case, the command `npm add underscore` will be executed inside the `/app` directory in the container. 

Now, we can run our `index.js`:
```bash
docker run 
  -v $(pwd):/app 
  -w /app
  node
  node index.js
```
```bash
1644018496251
```
## Want some NPM cache?
Sometimes we need to speedup the npm process using cache. Inside the container, by default, the `npm` stores  cache at `/root/.npm`. You can check that by running:
```bash
npm config get cache

=> /root/.npm
```
At this moment, we are only syncing the `-v $(pwd):/app` volume. When the container writes the npm cache to `/root/.npm`, we are not syncing back to the Host. 

We learned that we can mount multiple volumes to the container, so let's do that:
```bash
docker run 
  -v $(pwd):/app 
  -v $(pwd)/npm_cache:/root/.npm <---- sync the NPM cache
  -w /app
  node
  npm install underscore
```
When we perform `ls` from the Host, we get the following:
```bash
index.js          node_modules      npm_cache         package-lock.json package.json      src
```
However, we _do not want_ to keep track of "npm_cache" folder in our project. It's not our business. 

What if we wanted to store such cache in another path in the Host, therefore we **do not care where it's stored**?

Docker provides a special type of Volume, where the _path in the Host_ is chosen by Docker, hence the only thing we need to know is **its name**. Docker knows where it is located, but we do not care. 

Yes, they are called **Named Volumes**. 
```bash
docker volume create my-volume

docker volume inspect my-volume
```
```bash
[
    {
        "CreatedAt": "2022-02-05T00:47:59Z",
        "Driver": "local",
        "Labels": {},
        "Mountpoint": "/var/lib/docker/volumes/my-volume/_data",
        "Name": "my-volume",
        "Options": {},
        "Scope": "local"
    }
]
```
The `Mountpoint` is the exact path in the Host. So, every container using this volume will sync their data directly to this mountpoint, leaving us to manage and know the volume by using its name elsewhere, "my-volume".

In our example of underscore, we can start the container using named volumes too:
```bash
docker run 
  -v $(pwd):/app 
  -v npm_cache:/root/.npm <---- named volume in the Host
  -w /app
  node
  npm install underscore
```
This way, Docker will **create** a volume called `npm_cache` and mount it to the container at `/root/.npm`. 

Don't believe me? Go check yourself:
```bash
docker volume inspect npm_cache
```
```bash
[
    {
        "CreatedAt": "2022-02-05T00:51:24Z",
        "Driver": "local",
        "Labels": null,
        "Mountpoint": "/var/lib/docker/volumes/npm_cache/_data",
        "Name": "npm_cache",
        "Options": null,
        "Scope": "local"
    }
]
```
Yay! Much clearer, as we keep the speedup of our npm process.
```bash
docker run 
  -v $(pwd):/app 
  -v npm_cache:/root/.npm
  -w /app
  node
  node index.js
```
```bash
1644022388847
```
## Wrapping up
In this post we learned how to use **Path Volumes** and **Named Volumes** in Docker. 

Path volumes are very helpful when we want to keep track the path in the host, i.e mounting the entire project we are working on. 

Named volumes are handy when we **do not want** to keep track the path in the host, but instead leveraging Docker to choose the `mountpoint` for us, i.e using cache for NPM, Yarn, Ruby bundler, Python packages and so on. 

