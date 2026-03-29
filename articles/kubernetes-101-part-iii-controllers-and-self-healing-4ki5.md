---
title: "Kubernetes 101, part III, controllers and self-healing"
slug: "kubernetes-101-part-iii-controllers-and-self-healing-4ki5"
published_at: "2023-03-12 05:07:31Z"
language: "en"
status: "published"
tags: ["kubernetes", "docker", "k8s", "containers"]
---

The [second part](https://leandronsp.com/articles/kubernetes-101-part-ii-pods-19pb) of this series explained **how Pods work** while building a Pod having two containers communicating to each other using FIFO and a shared volume.

In this post we'll learn about **self-healing systems** and what we can achieve by leveraging Pod management to **Kubernetes workload resources** so they can manage Pods on our behalf.

## 🚂 Accidents will happen

Let's say we have a single _healthy_ node and multiple Pods running in it. What if the node is faced with a _critical hardware failure_, making it _unhealthy_? Remember: **a Kubernetes node is represented by a virtual machine**.


![a node failure](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/937o8xbvyr8q4y88hbwv.png)

Since _they have a lifecycle_, Pods in an _unhealthy_ node will **begin to fail**.

## ⬇️ Application downtime

A new node is required. But provisioning hardware is a _costly_ operation, **it takes time**.

Meanwhile, the **Pod remains failed** in the unhealthy node and the application is suffering a **downtime**.

Once the new node _has joined and is ready to accept_ new Pods, we can start **all the pods manually** using `kubectl` in the newly healthy node, for instance:

```bash
$ kubectl apply -f ./pod.yml
```

![starting pods in the new node](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/5f89pltrpvbwggnzar3i.png)
Until the Pod is _ready and running_, the application remains **out of service**, for example:

![application downtime](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/vu3ihn4kmgvokm2q8rt7.png)

Managing _Pods directly is not efficient_, it can be a cumbersome task not to mention that our application would face multiple downtimes.

We should build a system which is capable of **detecting failures** and also _restarting components_ or applications **automatically** with no human intervention.

We need a [self-healing system](https://techbeacon.com/app-dev-testing/how-develop-self-healing-apps-4-key-patterns).

## 🤖 Self-healing and Robotics
Building a **self-healing system** is crucial for businesses. Anytime our infrastructure suffer disruption, networking or hardware failure, the system should be capable of "healing itself".

_Automation is key._ And a potential solution for self-healing comes from **Robotics**. 

In Robotics, we usually create a **controller** that gets a **desired state** and, by using some sort of **control loop**, it continuously check if the _current state matches the desired state_, trying to come **closer as much as possible**.

![controller and control loop](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/4wdurha0udav30nwd67j.png)

A **thermostat** works exactly using such a _controller pattern_: it continuously checks if the current temperature matches the desired one, trying to **come closer**. Once it gets a match, _the controller turns off the equipment_ and the process is repeated _over and over again_.

Luckily, Kubernetes brings the **controller pattern** that solves our problem so that we don't need to manage Pods directly.

We are talking about [Kubernetes Controllers](https://kubernetes.io/docs/concepts/architecture/controller/).

## Controllers
Kubernetes controllers are **control loops** that watch the cluster state, then take actions to _match the desired state_ as much as possible.

But how do we make use of _controllers_? Kubernetes provides several [Workload Resources](https://kubernetes.io/docs/concepts/workloads/controllers/) so we can rely on them to **manage Pods on our behalf**.

Time to explore one of the main _workload resources_ that guarantees _self-healing capabilities_, the **ReplicaSet**.

---

## ReplicaSet
Using a [ReplicaSet](https://kubernetes.io/docs/concepts/workloads/controllers/replicaset/) controller, we can specify a number of identical Pods. 
```yaml
### The kind of the Kubernetes object
kind: ReplicaSet
apiVersion: apps/v1
metadata:
  name: nginx
spec:
  ### The number of replicas of nginx Pod
  ### The controller will manage the Pods on our behalf
  ### Anytime a Pod goes down, the controller will restart a new one to guarantee that at least 2 nginx Pods are running
  replicas: 2
  selector:
    matchLabels:
      app: nginx
  template:
    metadata:
      labels:
        app: nginx
    spec:
      containers:
      - name: nginx
        image: nginx
```
After applying the YAML file, we should have a representation of a `replicaset` object as follows:
```bash
$ kubectl get replicasets
NAME    DESIRED   CURRENT   READY   AGE
nginx   2         2         2       13m
```
Also, checking the Pods:
```bash
$ kubectl get pods
NAME          READY   STATUS    RESTARTS   AGE
nginx-r5kmn   1/1     Running   0          15m
nginx-k87fz   1/1     Running   0          15m
```
_Note that each Pod has got a **random identifier** in the cluster as a suffix_ `<podLabelMatcher>-<uniqueID>`.

Moreover, we can describe the ReplicaSet in a picture:

![A ReplicaSet controller](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/mjb1be5wt2td2recq2z4.png)

In the above picture, it's important to note that the controller may decide to keep _each Pod in a different Node_. _That's exactly the resilience and self-healing capability we want!_ 

Whenever a Node gets _unhealthy_, we're still keeping a **healthy Node**, thus our application _wouldn't suffer downtime easily_.

### Deleting a Pod of a ReplicaSet
In case we delete a Pod that was created by a ReplicaSet, the controller will start a **new one automatically**:
```bash
$ kubectl delete pod nginx-r5kmn
pod nginx-r5kmn deleted
```
Checking Pods again:
```bash
$ kubectl get pods
NAME          READY   STATUS    RESTARTS   AGE
nginx-k87fz   1/1     Running   0          29m

### The new Pod
nginx-mr2rd   1/1     Running   0          28s
```

### Deleting a ReplicaSet
But in case we want to delete all Pods of a ReplicaSet, we should delete the `replicaset` instead:
```bash
$ kubectl delete replicaset nginx
replicaset.apps "nginx" deleted
```
And the Pods are finally gone:
```bash
$ kubectl get pods
No resources found in default namespace.
```


---
## Wrapping Up
In this post we've seen how network or hardware failures can make an impact on our application, hence the importance of a **self-healing system**.

On top of that, we learned about **Kubernetes controllers** and how they _solve the self-healing problem_, by introducing one of the most important workload resources in Kubernetes: **the ReplicaSet**.

The upcoming posts will still focus on **workload resources**, more precisely about how we can perform **rollout deployments**, define stateful Pods, single-node Pods and Pods that run a single task and then stop (Jobs).

Cheers!
