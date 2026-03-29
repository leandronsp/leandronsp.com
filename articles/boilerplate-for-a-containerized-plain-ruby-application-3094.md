---
title: "Boilerplate for a containerized plain Ruby application"
slug: "boilerplate-for-a-containerized-plain-ruby-application-3094"
published_at: "2021-04-28 23:24:48Z"
language: "en"
status: "published"
tags: ["ruby", "tdd", "docker", "makefile"]
---

Recently I've been poking around automation in order to experiment and build software on destroyable environments, so that I won't mess up with my operating system host.

That's where virtualization and containerization can help: I want to stand on a fast and destroyable environment which can be re-launch as many times as I want.

## Virtualization

[In this Gist](https://gist.github.com/leandronsp/aa034b6bec7b24718ab915fec5e95512) I share how to launch an Ubuntu environment on the host using a lightweight VM manager, called [multipass](http://multipass.run). 

Virtualization is not the focus of this post, as you can check the Gist for further details.

## Containerization

Throughout this post, I will present how to build a plain Ruby containerized application using just Docker and Makefile, such that the boilerplate can be reused everytime we want to create a new app.

### Makefile

Let's create the `Makefile`, which can be a centralized entrypoint for the commands we want to run. It's a good practice to have a Makefile in every app.

`Makefile`
```
console:
  docker run \
    --rm \
    -it \
    -v $(pwd):/$(basename $(pwd)) \
    -w /$(basename $(pwd)) \
    ruby:2.7 \
    bash
```
Makefile is composed by **targets**. Each target can run a specific task which in turn can be a single command or a set of commands. In our example, we are running the `docker run` along with its options:

* `docker run`: creates a new container based on an image
* `--rm`: will remove the container on exit
* `-it`: allows a pseudo-terminal to interact
* `-v $(pwd):/$(basename $(pwd))`: mounts the current directory from host to container
* `-w /$(basename $(pwd))`: sets up the default working dir on container
* `ruby:2.7`: the image from which the container will run. Docker tries to find the image locally, otherwise downloads it from a Docker registry
* `bash`: the command executed on the container. **bash** will request a pseudo-terminal to interact

We can test the target by running:
```
make console
```
It will open the bash from the container.

#### docker-compose

Docker command options can be verbose quickly as we add more complexity to our application. As a means to make it easier to use Docker in development, we can declare our container specification in a single file that can be reused. 

Docker comes with [docker-compose](https://docs.docker.com/compose/) to solve that problem.

`docker-compose.yml`
```
version: '3.9'

services:
  dev:
    image: ruby:2.7
    container_name: my-application
    working_dir: /my-application
    volumes: 
      - ./:/my-application
```
Now, we can change our Makefile to use the docker-compose command:

`Makefile`
```
console:
  docker-compose run dev bash
```

And check it:
```
make console
```
The above configuration does the same job as running `docker run` with volume option, working dir, image and so on. 

Less. Verbosity. 

## Test-driven

Intending to bootstrap our application with TDD, the first file we create is the test file, which runs a simple dummy test. It seems silly, but enough for the purpose of this boilerplate, being able to be enhanced at a later time.

As for Ruby, we're gonna use `test-unit`.

`app_test.rb`
```
require 'test/unit'

class AppTest < Test::Unit::TestCase
  def test_dummy
    assert_equal 1, 1
  end
end
```
However `test/unit` does not come with this standard Ruby, making us to include the gem separately.

`Gemfile`
```
source 'https://rubygems.org'

gem 'test-unit'
```
Now we can run `make console`, and then from inside the container, run the command to install the gem from Gemfile:
```
bundle install
```
Ruby will place the gems by default on `/usr/local/bundle`.

#### Named Volume

We can't forget that everytime we run `make console`, a new container will be created, losing all the gems we have installed. As the application grows, running `bundle install` can be onerous. 

Let's use a named volume to use the host as a "cache":

`docker-compose.yml`
```
version: '3.9'

services:
  dev:
    image: ruby:2.7
    container_name: my-application
    working_dir: /my-application
    volumes: 
      - ./:/my-application
      - rubygems:/usr/local/bundle

volumes:
  rubygems:
```
By doing this way, Docker will use this named volume in host for the gems placed at `/usr/local/bundle` from running containers. 

#### Running the test

As for now we are able to run the test:
```
make console
bundle
ruby app_test.rb
```

#### Improving the test command

Instead of entering the console everytime to run the test, we can run it directly upon container creation:
```
docker-compose run dev ruby app_test.rb
```
The, improving our workflow is easy as follows:

`Makefile`
```
console:                                    
  docker-compose run dev bash               
                                            
utest:                                      
  docker-compose run dev ruby app_test.rb
```
Entering the console to run stuff:
```
make console
```
Running the test:
```
make utest
```

## Conclusion

The purpose of this article was to share a way of creating the boilerplate for a containerized Ruby application, allowing us to experiment and play on destroyable environments, remaining our OS host **untouchable**.

