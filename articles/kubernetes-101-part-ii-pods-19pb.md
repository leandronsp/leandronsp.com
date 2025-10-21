---
title: "Kubernetes 101, part II, pods"
slug: "kubernetes-101-part-ii-pods-19pb"
published_at: "2023-03-01 05:14:08Z"
language: "en"
status: "published"
tags: ["kubernetes", "docker", "k8s", "containers"]
---

In the [previous post](https://dev.to/leandronsp/kubernetes-101-part-i-the-fundamentals-23a1) we've seen the **fundamentals** of Kubernetes as well as an introduction to its **main architecture**.

Once we got introduced, it's time to explore how we can run an application in Kubernetes.

---

## A wrapper for containers
In Kubernetes, we aren't able to create single containers directly. Instead, for the better, we can **wrap containers into a single unit** which comprises:

* **a specification**: where multiple containers can use the same specification as deployable units
* **a shared storage**: they can use a shared storage so the same volumes are mounted across multiple containers
* **a single network**: containers under the same wrapper can share a single network, so they can communicate to each other

_Comparing to Docker_, such wrapper is similar to `docker-compose.yml`, where different services (containers) can share a common specification, volumes and network.

_Yes, we are talking about Pods_.

---

## Pods
[Pods](https://kubernetes.io/docs/concepts/workloads/pods/) are the **smallest deployable unit** you can create and manage in Kubernetes.

Within Pods, we can group multiple containers that should communicate to each other somehow, either using the **same network or through shared volumes**.

![Different Pods using their containers](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/qgo3zzcmk3fm5dakin5l.png)

_Let's create some Pods._

## Using YAML for good

Up to this point, we've used `kubectl` in order to create pods, for instance:
```bash
$ kubectl run <container_name> --image=<some_image>
```
It works pretty well for running experimental Pods, creating temporary resources and other workloads in k8s (we'll talk about workloads later).

We could create multiple Pods using `kubectl run ...`, but what if we want to _share with other people, team or even the open-source community_ how we **declared our Pods**?

How about sharing in a _VCS repository like Git_ the representation of the **desired state of our application** in k8s using a standard _serialization format_?

Kubernetes brings a serialization format which can be used to represent our Pods, and yes, you may like it or not, it's the well known [YAML](https://en.wikipedia.org/wiki/YAML).

## Creating a Pod
With YAML, we can declare Kubernetes objects using the `kind` attribute. K8s employs many different kind of objects which we'll explore on later posts, but at this moment we'll start with the most common and smallest unit in Kubernetes: **a Pod**.

Our _Pod specification_ should be composed by:

* a container called "server", backed by the `ubuntu` image, that _shares a volume with the Pod_. This container will create in the shared volume a [UNIX named pipe](https://en.wikipedia.org/wiki/Named_pipe), _a.k.a_ FIFO, listening for some message coming into the FIFO.

* a container called "client", also backed by an `ubuntu` image, that _shares a volume with the Pod_. This container will write to the shared volume a simple message called "Hey".


![A Pod sharing a volume with its internal containers](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/hfhviqo9frxk5v7e1eyc.png)

### Expectation
When the server is started, **the FIFO will be created in the shared volume**. The server keeps waiting for some message arriving into the FIFO. 

When the client is started, it will write the message "Hey" into the shared volume.

Afterwards, we _look at the container server logs_, as it should **print the message Hey that was sent by the client**.


![a more detailed overview of Pods using shared volumes](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/4pyk7zsywhi2gdul9ylo.png)

Let's declare the YAMl file `fifo-pod.yml`:
```yaml
kind: Pod
apiVersion: v1
metadata:
  name: fifo-pod
spec:
  volumes:
    - name: queue
      emptyDir: {}
  containers:
    - name: server
      image: ubuntu
      volumeMounts:
        - name: queue
          mountPath: /var/lib/queue
      command: ["/bin/sh"]
      args: ["-c", "mkfifo /var/lib/queue/fifo; cat /var/lib/queue/fifo"]
    - name: client
      image: ubuntu
      volumeMounts:
        - name: queue
          mountPath: /var/lib/queue
      command: ["/bin/sh"]
      args: ["-c", "echo Hey > /var/lib/queue/fifo"]
```
* **kind**: the object kind. In this case, simply Pod
* **metadata name**: the name of the Pod in the cluster, under the current default namespace (we'll talk about namespaces in later posts)
* **volumes**: the shared volume of the Pod. We're using `emptyDir` which will share any empty directory in the Pod's filesystem
* **volumeMounts**: _mounting the Pod's shared volume_ into some directory of the **container's filesystem**
* **command**: the command to be executed in the container

After declaration, we can share the YAMl file with our friends, co-workers etc using Git. But the object is yet to be created in our cluster. We do this by using the command `kubectl apply`:
```bash
$ kubectl apply -f fifo-pod.yml
pod/fifo-pod created
```
Let's check the logs of the `server` container. We can use the command `kubectl logs <pod>` so we get the logs of every container in the Pod. However we want to fetch logs from the `server` container only:
```bash
$ kubectl logs fifo-pod -c server
Hey
```
**Yay! It works!** :rocket:

## Getting the list of Pods
Using `kubectl` we can get the list of Pods in our cluster:
```bash
$ kubectl get pods

NAME         READY   STATUS      RESTARTS      AGE
nginx        1/1     Running     1 (92m ago)   6d3h
fifo-pod     0/2     Completed   0             64m
```
We have a Pod called `nginx` which is `Running` for 6 days. It's quite _comprehensible_, since I've run the `kubectl run nginx --image=nginx` 6 days ago. Also, it's well known that NGINX is a web server that keeps running (listening for TCP connections), so that's why the Pod is still in a **Running** status.

But the Pod `fifo-pod` we just created is returning a `Completed` status. Why?

## Pod Lifecycle
[Pods follow a lifecycle](https://kubernetes.io/docs/concepts/workloads/pods/pod-lifecycle/) in Kubernetes.

Like _containers in Docker_, Pods are **designed to be ephemeral**. Once a Pod is scheduled (assigned) to a Node, the Pod runs on that Node until it stops or is terminated.

A Pod lifecycle works by **phases**. Let's understand each phase.

### Pending
It's when a Pod is **accepted by the cluster** but its _containers are not ready yet_. The Pod is **NOT yet scheduled** to any Node.


![pod phase pending](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/t7n25239y1mv4liyu047.png)

### Running
All **containers are created** and the **Pod has been scheduled** to a Node. 

_At least one of the containers are still running or being started._

![pod phase running](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/z2uhvhf087pc4f0xl6z9.png)

### Succeeded / Failed
If all containers are `Terminated` in success, then the Pod status is `Succeeded`. 

But in case all containers have terminated but at least 1 container terminated in failure, the Pod status is `Failed`.


![pod phase succeeded/failed](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/jewnvxtqlqnir6ad7hw3.png)

### Terminated / Completed
Indicates that all the containers are **terminated** (internally by Kubernetes) or **completed**.

---

## More about Pod Lifecycle
_Pods lifecycle_ is a quite big topic in Kubernetes, covering Pod conditions, readiness, liveness and so on. We'll dig into further details about lifecycles in later posts.

---

## Wrapping Up
This post showed a bit more about _Pods_, which are the **smallest and main deployable unit** in Kubernetes.

On top of that, we also created a Pod with two containers communicating to each other using FIFO and a **shared volume**.

In addition, we've seen a bit about **Pod lifecycle**. Hence, the Pod lifecycle and its lifetime will be crucial to understand the subject of the upcoming post: _self-healing capabilities_ in Kubernetes.

Stay tuned, and Cheers!






