---
title: "Kubernetes 101, part I, the fundamentals"
slug: "kubernetes-101-part-i-the-fundamentals-23a1"
published_at: "2023-02-23 02:25:00Z"
language: "en"
status: "published"
tags: []
---

It's been a while I wanted to take a time to sit down and write about _Kubernetes_. **The time has come.**

In short, [Kubernetes](https://kubernetes.io/) is an open-source system for **automating and managing containerized applications**. _Kubernetes is all about containers._ 

---

:exclamation: _If you don't have much idea of what **a container is**, please refer to my [Docker 101 series](https://leandronsp.com/articles/kubernetes-101-part-i-the-fundamentals-23a1) first and then come back to this one. Thereby you'll be more prepared to understand Kubernetes._ 

Disclaimer said, let's see the problem all this "K8s thing" tries to solve.

---

## :package: Containers management
Suppose we have a complex system that is composed by:

* A Backoffice written in Ruby
* Various databases running PostgreSQL
* A report system written in Java
* A Chat app written in Erlang
* A Frontoffice written in NodeJS

Okay, this architecture is quite heterogeneous, but it serves the purpose of this article. In addition, we **run everything in containers**:


![a1](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/2fqe02nlekeupwbkr4o4.png)

Assume we have to ensure maximum availability and scalability of the "Frontoffice" application, because eventually it is the application that final users consume. Here, the system **requires at least** 2 Frontoffice containers running:


![a2](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/dltlhau8is0u26vbtxkh.png)

Moreover, there's another functional requirement that the Chat app cannot be down for much time, and in case it goes down, we should **make sure it is started again**, having the capability of **self-healing**:


![a3](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/4efwffltg9vouvxle8ec.png)

Now think of an architecture where we have _dozens if not hundreds_ of containers:

![a4](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/iu8njsodwahkfbsshbau.png)

**Container management is not easy**, that's where Kubernetes comes in.

---
## :scroll: A bit of history

After 15 years of running complex workloads internally, **Google** decided to make public their former container management tool called "Borg". 

In 2014, the launch was made and they named it "Kubernetes". The tool went **open-source** and the community soon embraced it.

Kubernetes is written in **Golang**, initially it used to support only Docker containers but later support to other container runtimes have come too, such as _containerd and CRI-O_.

### :cloud: Cloud Native Computing Foundation
In 2015 the [Linux Foundation](https://www.linuxfoundation.org/) created a foundation branch that aims for supporting open-source projects that _run and manage containers_ in the cloud computing. 

Then, the **Cloud Native Computing Foundation**, or [CNCF](https://www.cncf.io/), was created.

Less than a year later, **Kubernetes was introduced** as the _first CNCF graduated project ever_.

Currently as of 2023, a **lot of companies and big players run Kubernetes** on their infrastructure, Amazon, Google, Microsoft, RedHat, VMWare to name a few.

---

## Kubernetes Architecture
Here's a brief picture of how a Kubernetes architecture looks like:

![architecture](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/ktn922ak6lykt2jp85qd.png)

In the above scenario, we have a k8s cluster that consists of "4 machines" (or **virtual machines** that's more common nowadays), being:

* 1 machine called **Control Plane**, in which the cluster is created and is _responsible to accept new machines_ (or nodes) on the cluster
* 3 other machines called **Nodes**, which will contain _all the managed containers_ by the cluster.

### :thumbsup: A rule of thumb
_All the running containers_ establish what we call the **cluster state**.

In Kubernetes, **we declare the desired state** of the cluster by making HTTP requests to the Kubernetes API, and Kubernetes will "work hard" to achieve the desired state. 

_However, making plain HTTP requests in order to declare the state can be somewhat cumbersome, error prone and a tedious job._ How about having some **CLI in the command-line** which would do the hard work of authenticating and making HTTP requests?

Meet [kubectl](https://kubernetes.io/docs/reference/kubectl/).

### :bust_in_silhouette: Creating objects in the cluster
Kubernetes treats **everything in the cluster as objects**, where objects can have **different types** (kind).

```bash
$ kubectl run nginx --image=nginx
pod/nginx created
```

The following picture describes such interaction where we use the `kubectl` CLI which will perform a request to the control plane API:

![b1](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/cvip2022mznsnof13dt2.png)

But **what's a Pod?**, you may be wondering. **Pod is the smallest object unit** we can interact with. 

Pods could be like containers, however **Pods can contain multiple containers.**

![b2](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/s2si31ffi0mhp19nymxo.png)

---

## :mag_right: Architecture Flow
Now let's dig into the _flow of creating objects_, on how the cluster performs the **pod scheduling and state updates**.

That's supposed to be a brief architecture flow, so we can understand better the k8s architecture.

### :point_right: Control Plane Scheduler
The **Control Plane Scheduler** looks out for the next available node and schedules the object/pod to it.

![c1](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/4i63xb3oyig5vivmisf6.png)

### :point_right: Node Kubelet
Each node contains a component called **Kubelet**, which **admits objects coming from the Scheduler** and, using the _container runtime_ installed in the node (could be Docker, containerd, etc), creates the object in the node.


![c2](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/1799rgdv7aszhol0rjbj.png)

### :point_right: etcd
In the Control Plane there's a component called [etcd](https://etcd.io/) which is a **distributed key-value store** that works well in distributed systems and cluster of machines. _It's a good fit for Kubernetes._

K8s uses etcd to persist and keep the current state.

![c3](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/lmq9zb8xhvmt4m5s9vyl.png)

### :hand: A bit of networking in Kubernetes
Suppose we have two NGINX pods in the cluster, a **server** and a **client**:
```bash
$ kubectl run server --image=nginx
pod/server created

$ kubectl run client --image=nginx
pod/client created
```

Assume we want to reach the `server`, how do we reach such pod in the port 80?

In containerized applications, by default, **containers are isolated** and do not share the host network. _Neither do Pods_.

We can only request the `localhost:80` within the `server` Pod. How do we **execute commands in a running pod**?

```bash
$ kubectl exec server -- curl localhost

<html>
...
```
It works, but **only requesting within the pod**. 

How about requesting the _server_ **from the client**, is it possible? Yes, because _each Pod receives an internal IP_ in the cluster.

```bash
$ kubectl describe pod server | grep IP
IP: 172.17.0.6
```
Now, we can perform the request to the server from the `client` using the server internal IP:
```bash
$ kubectl exec client -- curl 172.17.0.6

<html>
...
```
However, in case we perform a deploy, i.e change the old `server` Pod to a _newer Pod_, **there's no guarantee that the new Pod will get the same previous IP**.

We need some mechanism of **pod discovery**, where we can declare a _special object_ in Kubernetes that **will give a name** to a given pod. Therefore, within the cluster, we could **reach Pods by their names** instead of internal IP's.

Such special object is called **Service**.

### :point_right: Controller Manager
The _Control Plane_ also employs a component called **Controller Manager**. It's responsible to receive a request for special objects like **Services** and expose them via service discovery.

All we have to do is issuing `kubectl expose` and the control plane will do the job.

```bash
$ kubectl expose pod server --port=80 --target-port=80

service/server exposed
```
Then we are able to **reach the `server` pod by its name**, instead of its internal IP:
```bash
$ kubectl exec client -- curl server

<html>
...
```
Let's look at what happened in the architecture flow. First, the `kubectl expose` command issued the creation of the **Service object**:

![c4](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/jo5p6f909ob6uhhb02oi.png)

Then, the **Controller Manager** exposes the Pod via service discovery:


![c5](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/kerdb0cb04bk0z1pojob.png)

Afterwards, the controller manager _routes_ to the `kube-proxy` component that is running in the node, which will **create the Service object** for the respective Pod. At the end of the process, the state is persisted in `etcd`.


![c6](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/zmipyze46b6s6grlcz94.png)

### :point_right: Cloud Controller
Another controller that exists in the control plane is the **Cloud Controller**, responsible for receiving requests to create objects and **interacting with the underlying cloud provider** if needed.

For example, when we create a Service object of type `LoadBalancer`, the **Cloud Controller** _will create a LB_ in the underlying provider, be it AWS, GCP, Azure etc


![c7](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/b1pgcu7djxq5sk3lbtvr.png)

---

## :100: The final overview
After learning about the kubernetes architecture, let's summarize the **main architecture flow** in one picture:

![overview](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/coflj69ddtv7wj2lwpcy.png)

---
This post was an _introduction to Kubernetes_ along with an overview to its **main architecture**. 

We also learned about some building block objects like **Pods and Services**.

In the upcoming posts, we'll see a more detailed view about Kubernetes _workloads, configuration and networking_. 

Stay tuned!





