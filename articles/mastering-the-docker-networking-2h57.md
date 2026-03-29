---
title: "Mastering the Docker networking"
slug: "mastering-the-docker-networking-2h57"
published_at: "2022-07-05 03:04:00Z"
language: "en"
status: "published"
tags: ["docker", "linux", "nginx"]
---

Few months ago I demonstrated [through a practical example](https://leandronsp.com/articles/mastering-docker-volumes-j7m) the reasons to understand and take advantage of Docker volumes. 

In this one, I'll try to do the same in regarding the Docker networking. 

If you want to master the **Docker Networking**, this post is for you.

# Containers live in a network
Because of the *isolation* nature of containers, they **do not share** the *host* network, however Docker provides network for them. 

When the Docker Runtime starts, it creates 3 default networks:

```bash
$ docker network ls

NETWORK ID     NAME      DRIVER    SCOPE
5c65c2b3031b   bridge    bridge    local
cf446ef29441   host      host      local
50fd86384bb9   none      null      local
```
Let's understand each one of them.

## The bridge network
First, we can check the configuration by inspecting the network:
```bash
$ docker network inspect bridge

[
    {
        "Name": "bridge",
        "Id": "5c65c2b3031b6d10f357f74f6cb5bf04af13819fca28b5458e00bb6b1d1718ec",
        "Created": "2022-06-27T23:49:43.227773167Z",
        "Scope": "local",
        "Driver": "bridge",
        "EnableIPv6": false,
        "IPAM": {
            "Driver": "default",
            "Options": null,
            "Config": [
                {
                    "Subnet": "172.17.0.0/16",
                    "Gateway": "172.17.0.1"
                }
            ]
        },
        "Internal": false,
        "Attachable": false,
        "Ingress": false,
        "ConfigFrom": {
            "Network": ""
        },
        "ConfigOnly": false,
        "Containers": {},
        "Options": {
            "com.docker.network.bridge.default_bridge": "true",
            "com.docker.network.bridge.enable_icc": "true",
            "com.docker.network.bridge.enable_ip_masquerade": "true",
            "com.docker.network.bridge.host_binding_ipv4": "0.0.0.0",
            "com.docker.network.bridge.name": "docker0",
            "com.docker.network.driver.mtu": "1500"
        },
        "Labels": {}
    }
]
```
We can see that the network, responding through the *Gateway* `172.17.0.1`, has no added containers at this moment.

*Bridge* networks provide **bridge** drivers so containers created in this network receive an **IP address**.

To confirm that, we create an NGINX container:
```bash
$ docker run --name nginx --network bridge -d nginx
```
Great. It's just an NGINX web app running on the container port `80` and serving the traditional HTML page "Welcome to NGINX". 

Was the container added to the network?
```bash
$ docker network inspect bridge

...
        "Containers": {
            "bb283ee626dbc631281fc0c27a1f02f075ab1908800965008a315cedd7f9d438": {
                "Name": "nginx",
                "EndpointID": "f12f67c1d7488f708027c2e948b204ce09743721095d4514c9c24bedf8167191",
                "MacAddress": "02:42:ac:11:00:02",
                "IPv4Address": "172.17.0.2/16",
                "IPv6Address": ""
            }
        },
```
Yes. We can see that the recently created container was added to the `bridge` network and has got the IP Address `172.17.0.2`. 

How can we communicate to a such container using its IP, in other words, can we hit `http://172.17.0.2` and see the "Welcome to NGINX" HTML result?

```bash
$ wget http://172.17.0.2 -O -
Connecting to 172.17.0.2:80...
```
Nope :(

### Containers do not share the host network
Again, **containers do not share the "host" network**. Which means only other containers in the same network (bridge) can talk to each other. 

Okay, can we _run another container_ and hit the NGINX then?
```bash
$ docker run \
    --network bridge \
    alpine \
    sh -c "wget http://172.17.0.2 -O -"

Connecting to 172.17.0.2 (172.17.0.2:80)
writing to stdout
<!DOCTYPE html>
<html>
<head>
<title>Welcome to nginx!</title>
<style>
html { color-scheme: light dark; }
body { width: 35em; margin: 0 auto;
font-family: Tahoma, Verdana, Arial, sans-serif; }
</style>
</head>
<body>
<h1>Welcome to nginx!</h1>
<p>If you see this page, the nginx web server is successfully installed and
working. Further configuration is required.</p>

<p>For online documentation and support please refer to
<a href="http://nginx.org/">nginx.org</a>.<br/>
Commercial support is available at
<a href="http://nginx.com/">nginx.com</a>.</p>

<p><em>Thank you for using nginx.</em></p>
</body>
</html>
-                    100% |********************************|   615  0:00:00 ETA
written to stdout
```
Yay! That's pretty neat. 

### Bridge is already the default network
Just for a matter of saving time, whenever we create containers, they are automatically added to the `bridge` network. 
```bash
$ docker run --name nginx -d nginx
$ docker run alpine sh -c "wget http://172.17.0.2 -O -"
```
It. Just. Works. How cool is that?

### Using the container name instead of IP Address
But remembering the IP Address isn't always good, right? How about using the container name instead of its IP?
```bash
$ docker run --network bridge alpine sh -c "wget http://nginx -O -"

wget: bad address 'nginx'
```
Uh oh :(, the bridge network **does not resolve names to IP addresses**. 

But today, is our lucky day. Docker allows us to use the `bridge` driver and create user-defined custom networks, as easy as doing:
```bash
$ docker network create saturno

NETWORK ID     NAME      DRIVER    SCOPE
5c65c2b3031b   bridge    bridge    local
cf446ef29441   host      host      local
50fd86384bb9   none      null      local
4216c3a16815   saturno   bridge    local
```
The `saturno` network uses the same driver `bridge` used by the **bridge** default network. If we inspect the network using `docker network inspect saturno`, we can see that it has no containers yet and uses the Gateway IP `172.18.0.1`. 

Let's create containers on the *saturno* network:
```bash
$ docker run --name nginx --network saturno -d nginx
```
By inspecting the network again, the container has got the IP `172.18.0.2`. So let's hit the container again:
```bash
$ docker run --network saturno alpine sh -c "wget http://172.18.0.2 -O -"
```
It works. Still we want to check using its name instead:
```bash
$ docker run --network saturno alpine sh -c "wget http://nginx -O -"
```
What a wonderful day, it works!

## The host network
This network is useful when we need to expose the container to the **host network**. 
```bash
$ docker --name nginx --network host -d nginx
```
```bash
$ docker network inspect host

[
    {
        "Name": "host",
        "Id": "cf446ef29441aeaaee2a40cfcf9ad120aedb7c51cf2dbc20cc23e567101d217c",
        "Created": "2022-01-13T21:57:00.2326735Z",
        "Scope": "local",
        "Driver": "host",
        "EnableIPv6": false,
        "IPAM": {
            "Driver": "default",
            "Options": null,
            "Config": []
        },
        "Internal": false,
        "Attachable": false,
        "Ingress": false,
        "ConfigFrom": {
            "Network": ""
        },
        "ConfigOnly": false,
        "Containers": {
            "668c12bbabb8cd28e8cc8666d074fc929214f7b9ddfddfa3d76c8476652c4091": {
                "Name": "nginx",
                "EndpointID": "738ea09ee3d450e9f655440a303a52f219d9ca22fe011eb62dffe7d0351f31de",
                "MacAddress": "",
                "IPv4Address": "",
                "IPv6Address": ""
            }
        },
        "Options": {},
        "Labels": {}
    }
]
```
We can see the container added to the network, but it **has no IP address**, which means other containers cannot talk to it, **only the host**. 

```bash
# Linux only
$ wget http://localhost -O -
```
It works.

*Note: this network works on Linux only. In Docker Desktop for Mac or Windows, we must use another way to expose containers to the host*.

### The -p option
Another way to expose containers to the host goes by using the flag `-p`, which is NOT the host network *per se*, but it **publishes the [container port] to the [host port]**.

```bash
$ docker run --name nginx -p 80:80 -d nginx
$ wget http://localhost -O -
```
It works!
## The none network
Anytime we need to create a **completely** isolated container which **do not talk** to any other containers, we can add it to the `none` network, which uses the driver `null`. 
```bash
$ docker run --name nginx --network none -d nginx
$ docker network inspect none

[
    {
        "Name": "none",
        "Id": "50fd86384bb9cc90d953a624a5ab70b869357027d3cdc7ebc9b4043798dd4f6a",
        "Created": "2022-01-13T21:57:00.224557375Z",
        "Scope": "local",
        "Driver": "null",
        "EnableIPv6": false,
        "IPAM": {
            "Driver": "default",
            "Options": null,
            "Config": []
        },
        "Internal": false,
        "Attachable": false,
        "Ingress": false,
        "ConfigFrom": {
            "Network": ""
        },
        "ConfigOnly": false,
        "Containers": {
            "90a6691b818e164bd2e1f67e8f3a62ce71eaddbe9ac215c370a8a6766204a2b0": {
                "Name": "nginx",
                "EndpointID": "0ed9e33f051f2df2c37b96fc2fdf7df074b73359117a12a81ae4c28ef0ec6877",
                "MacAddress": "",
                "IPv4Address": "",
                "IPv6Address": ""
            }
        },
        "Options": {},
        "Labels": {}
    }
]
```
This network has no Gateway IP hence **do not associate** IP addresses to containers. 

## Bonus points: connecting containers on-the-fly
Sometimes we already have running containers in the default network but for some reason we want to communicate using **name**. 
```bash
$ docker run --name nginx -d nginx
$ docker run --name ruby -dit ruby irb
```
They live in the default `bridge` network, they can talk to each other using IP but **not using their names**, remember?
```bash
$ docker network create saturno
```
The most obvious solution: first _stop them_, then create new ones using the `saturno` network. Correct?

Kinda. But there's no need to stop the containers! Just connect them to existing networks:

How about:
```bash
$ docker network connect saturno nginx
$ docker network connect saturno ruby
$ docker network inspect saturno

        "Containers": {
            "15bcd3a425024c627a57bddb878a11fcd3f43cb4da4576ef05d89b45a96f49ad": {
                "Name": "nginx",
                "EndpointID": "e0ef0bb83b1e553215cf24dcc6c20355a5ca5367e2d02f120b00b4a77c975964",
                "MacAddress": "02:42:ac:13:00:02",
                "IPv4Address": "172.19.0.2/16",
                "IPv6Address": ""
            },
            "6ab4256e8c808ebd16f2e9643e5636df03f58dbfc4778a939df0b286b829babd": {
                "Name": "ruby",
                "EndpointID": "ab3a590379938f8654a0aada7cfab97cc47eb92f3fe89656a2feccc9bd52cbe1",
                "MacAddress": "02:42:ac:13:00:03",
                "IPv4Address": "172.19.0.3/16",
                "IPv6Address": ""
            }
        },
```
Oh my goodness, it made my day!

# Conclusion
This post was a try to explain the main aspects of Docker networking. I hope it helps you to understand a bit more and use it at your needs. 

[The Docker official website](https://docs.docker.com/network/) contains a great introduction to networking as well easy tutorials. 


