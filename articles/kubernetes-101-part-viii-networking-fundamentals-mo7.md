---
title: "Kubernetes 101, part VIII, networking fundamentals"
slug: "kubernetes-101-part-viii-networking-fundamentals-mo7"
published_at: "2023-05-13 01:56:54Z"
language: "en"
status: "published"
tags: ["kubernetes", "docker"]
---

So far, we have gained an understanding of the primary workload objects in Kubernetes. 

These objects enable us to effectively run and manage multiple applications within the cluster. Additionally, we can get benefits from various deployment strategies, create stateful applications, as well as execute and schedule jobs.

In order to function cohesively, applications (Pods) within the cluster rely on communication between each other.

![client server communication](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/lmapl9zjy81nzhxiozhd.png)

Let's create a Pod named **server** which runs an NGINX server within it:

```bash
$ kubectl run server --image=nginx
pod/server created
```
---
## 🔵 Pod's internal IP
Like everything on the internet, Pods in the Kubernetes cluster are assigned **internal IP addresses**, enabling communication between them using these IPs.

```bash
$ kubectl describe pod/server | grep IP
172.17.0.5
```
Now, let's start a new Pod named **client**, that executes a `curl` command to communicate with the server, and then terminates.

```bash
$ kubectl run client \
    --image=alpine/curl \
    -it \
    --rm \
    --restart=Never \
    --command \
    -- curl http://172.17.0.5/
```
* we are using the image `alpine/curl` so there's no need to install the `curl` command
* the command `curl` performs and HTTP request to the server Pod, on the port 80 (HTTP)
* after finishing the `curl` command, the Pod is asked to **nerver restart**, otherwise Kubernetes will perform constant restarts

Here's the output:
```text
<!DOCTYPE html>
<html>
...
<body>
<h1>Welcome to nginx!</h1>
...
```
...and then:
```text
pod "client" deleted
```


![pods communicating](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/avkwnd916cve7kledf4i.png)

_That's pretty nice, uh_?

---

> 🤔
Pods, similar to containers, are designed to be ephemeral. Whenever a Pod is restarted by a Deployment or another controller, there is no guarantee that the new Pod will receive the same IP address as before.

![pods 2](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/jy1rwj3rv3kevvuqm6ag.png)

Pods should communicate with each other through a Kubernetes **object** that provides a more reliable internal IP address, rather than relying on the **ephemeral nature** of individual Pod IP addresses. 

_Yes_, we are talking about **Services**.

---

## 🔵 Services
By placing Pods "behind" a Service, other Pods can communicate with them using the IP address of the Service rather than the individual Pod IP addresses.

```bash
$ kubectl expose pod server \
    --name=server \
    --type=ClusterIP \
    --port=80 \
    --target-port=80

service/server exposed
```

The `kubectl expose` command requires the following parameters:

* the `name` of the service
* the `type` of the service, where the default type is **ClusterIP**. Other types will be discussed later in this post
* the `port` on which the service will listen
* the `target-port` of the Pod to which the service will forward messages

Let's check the service IP address:

```bash
$ kubectl get svc

NAME         TYPE        CLUSTER-IP    EXTERNAL-IP   PORT(S)   AGE
server       ClusterIP   10.43.205.0   <none>        80/TCP    7s
```
The **CLUSTER-IP** obtained when exposing a service in Kubernetes should be used for communication. It provides a more reliable and stable IP address compared to individual Pod IPs, which can change frequently due to their ephemeral nature.

> ⚠️
Unless you manually delete the Service using `kubectl delete`, creating a new Service will result in a change in the assigned **CLUSTER-IP**.

Now, from a client Pod, let's run the **curl** command to `10.42.205.0`, which is the Service's IP address:

```bash
$ kubectl run client \
    --image=alpine/curl \
    -it \
    --rm \
    --restart=Never \
    --command \
    -- curl http://10.43.205.0/
```
Which outputs:
```text
<!DOCTYPE html>
<html>
...
<body>
<h1>Welcome to nginx!</h1>
...
```

![service IP](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/5o74witlsu94q955w0hq.png)

### 👉 DNS for Services
Kubernetes offers an **internal DNS table** for each Service, enabling us to use a fixed name instead of an IP address. By leveraging this DNS resolution, the Service can effectively forward messages to the underlying Pods.

The pattern for the Service address is specified by:

```
[service-name].[namespace].svc.cluster.local
```
Let's update our example as follows:

```text
$ curl http://server.default.svc.cluster.local/

<!DOCTYPE html>
<html>
...
<body>
<h1>Welcome to nginx!</h1>
...
```
_Super Yay!_


![service DNS](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/vxnqmmkgv5gj4y91cne8.png)

> 🤔
There are situations where we may need to access a Service from an arbitrary port on the Kubernetes Node itself. 

This access allows communication with the Node **through the specified port**, which is then forwarded to the _Service_. 

The Service, in turn, **forwards the message to the underlying Pods** associated with it. 

This enables external access to the Service **from outside the cluster** via the Node's port forwarding mechanism.

### 👉 Service NodePort
This type of Kubernetes Service is assigned an _internal cluster IP_ and, in addition, **opens a port** within the range of `30000-32767` on **every node in the cluster**.

For instance, let's consider a scenario where our Service is configured to expose the node port `32420`, and we have a cluster consisting of 4 nodes:

* 10.40.50.1
* 10.40.50.2
* 10.40.50.3
* 10.40.50.4

The Service ensures that the same port (32420 in this example) is opened on all nodes, and any traffic directed to that port will be forwarded to the Service, which is then forwarded to the underlying Pods.

_You're right_, Services in Kubernetes act like **load balancers**!

```bash
$ kubectl expose pod server \
    --name=server \
    --type=NodePort \
    --port=80 \
    --target-port=80
```
Then, let's get the port that was opened, in this case, the port `30942`:
```bash
$ kubectl get svc

NAME         TYPE        CLUSTER-IP    EXTERNAL-IP   PORT(S)        AGE
server       NodePort    10.43.23.47   <none>        80:30942/TCP   103s
```

Disclaimer:

> The following commands may not work on your environment, as it will depend where you're running your Kubernetes cluster. In my case, I'm using colima in OSX.

Let's get the node name:

```
$ kubectl get nodes

NAME     STATUS   ROLES                  AGE    VERSION
colima   Ready    control-plane,master   111m   v1.25.0+k3s1
```
Then, let's figure out the Node IP address. As I'm using locally, it's my "virtual machine" IP:

```bash
$ kubectl describe node colima | grep InternalIP
192.168.106.2
```
Now, we can perform the `curl` directly to the Node IP and Port:

```text
$ kubectl run ...
    ...
    curl http://192.168.106.2:30942/

<!DOCTYPE html>
<html>
...
<body>
<h1>Welcome to nginx!</h1>
...
```


![service node port](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/2zxgkvkrp9jk3hivuygu.png)

### 👉 Accessing multiple Nodes IP's

**Manually accessing** each Node IP can be tedious and prone to errors. To simplify this process, we can introduce a "proxy" in front of our cluster.

There are multiple solutions available, and **NGINX** is one of them. Before diving into Kubernetes-specific solutions, let's first explore a potential approach with NGINX outside of the cluster. 

Once we understand that, we can move on to leveraging the features that Kubernetes offers.

### 👉 The hard way, an NGINX reverse proxy
A little disclaimer:

> I'm not going into details of NGINX features, you can check the NGINX documentation anytime.

That said, let's configure our **site config**, named "acme.conf":

```text
server {
  listen       80;
  listen  [::]:80;
  server_name  localhost;

  location / {
    proxy_set_header  X-Real-IP  $remote_addr;
    proxy_set_header  X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header Host $http_host;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_redirect off;
    proxy_pass http://192.168.106.2:30942;
  }
}
```
Please note that our **NGINX Load Balancer** will proxy messages to the Node IP and Port, which we refer to as our "backend" in NGINX terminology. 

We have the flexibility to add as many "backends" as needed, in case we want to add more Kubernetes Nodes.

Time to start the NGINX container, which will use the `host` network and will get a mounted volume for our site config:

```bash
$ docker run -d --rm \
    --name nginx-lb \
    --net=host \
    -v $(pwd)/acme.conf:/etc/nginx/conf.d/acme.conf \
    nginx
```
Now, we can **curl** to `localhost` as the NGINX will proxy to every node (site) in our cluster:

```text
$ curl localhost

<!DOCTYPE html>
<html>
...
<body>
<h1>Welcome to nginx!</h1>
...
```

![proxy with NGINX](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/2ciy09hspvg8e3snx4u3.png)

However, managing a separate proxy is not ideal in a cloud-native environment like Kubernetes. 

Luckily, Kubernetes provides a more native solution: the Service type **LoadBalancer**.

### 👉 Service LoadBalancer
On cloud providers that offer **load balancer support**, the _LoadBalancer_ Service type in Kubernetes will automatically request a load balancer from the underlying provider. 

This setup provides a single entrypoint for our Service, and the load balancer will handle opening the necessary ports on every Node, ensuring efficient routing of traffic.

> In my development environment, `colima` brings a virtual integrated load balancer, which will expose my "localhost" to the underlying Service.

Creating the Service:

```bash
$ kubectl expose pod server \
    --name=server \
    --type=LoadBalancer \
    --port=80 \
    --target-port=80
```

Thus, we can confirm that when utilizing the LoadBalancer Service type in Kubernetes, the Service will be assigned both a cluster IP for internal communication and a node port for external access:

```bash
$ kubectl get svc

server       LoadBalancer   10.43.168.46   192.168.106.2   80:31995/TCP   79s
```
We can curl to the cluster IP, Node as well as to the localhost:

```bash
# Cluster IP, from internal resources such as Pods
$ curl http://10.43.168.46/

# NodePort, from external host
$ curl http://192.168.106.2:31995/

# LoadBalancer, from external host
$ curl localhost
```
The three `curl` commands will get to the same output:

```text
<!DOCTYPE html>
<html>
...
<body>
<h1>Welcome to nginx!</h1>
...
```
![service load balancer](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/hi9ryesrugf5rm1hhy90.png)

### 👉 The limitations of using Service LoadBalancer

However, it's important to understand some limitations of using Services as LoadBalancers in Kubernetes.

Let's create another Pod named `other-server`:

```bash
$ kubectl run other-server --image=nginx
```

Now, expose the `other-server` as a Service LoadBalancer:

```bash
$ kubectl expose pod other-server \
    --name=other-server \
    --type=LoadBalancer \
    --port=80 \
    --target-port=80
```
Then, check the services:

```bash
$ kubectl get svc

NAME           TYPE           CLUSTER-IP     EXTERNAL-IP     PORT(S)        AGE
server         LoadBalancer   10.43.168.46   192.168.106.2   80:31995/TCP   15m
other-server   LoadBalancer   10.43.43.51    <pending>       80:32344/TCP   52s
```

Please note that the `other-server` Service LoadBalancer does not get an external IP. That's because the `localhost` address is already available to the previous Service called `server`.

So, our `other-server` Service:

* can curl to cluster IP
* can curl to ports in the node
* cannot curl to localhost


![lb 2](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/7yt5ycicgjwyh2z3gz30.png)

In short, the limitations of Service LoadBalancers can be described as follows:

* **cloud provider dependency**: as it relies on the underlying cloud provider's load balancing capabilities, it may not be available or supported in all cloud environments.

* **limited protocol support**: LoadBalancer Services typically support TCP and UDP protocols. Support for other protocols, such as SCTP or WebSocket, may vary depending on the cloud provider and Kubernetes version.

* **expensive cost**: leveraging an external load balancer from the cloud provider can involve additional costs, as some providers charge for load balancer usage.

...among others.


![lb 3](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/478l47gwih459str41wl.png)

### 👉 Let's bring NGINX back
Let's recap our proposed solution using NGINX, an open-source solution that is not tied to any specific cloud provider. However, it's important to note that our solution placed NGINX outside of the cluster, acting as a separate component.

How about incorporating NGINX within the cluster? This would involve deploying NGINX as a part of the Kubernetes cluster, providing an architecture similar as follows:

![nginx in the cluster](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/umo5td1pok409wue6kj8.png)

* NGINX would act as a "controller" within the cluster, responsible for opening ports on every Node and receiving messages.
* some sort of "rules table", similar to **NGINX's site configurations**, would be employed to forward messages from NGINX to the appropriate internal Services (ClusterIP).


_Enter Ingress Controllers_.

---

## 🔵 Ingress Controllers
Kubernetes allows the creation of new controllers using Custom Resource Definitions (CRDs), which extend the functionality beyond the basic Workload controllers.

An **Ingress Controller** must be installed in the cluster in order to offer capabilities of proxying like NGINX. 

Luckily, there's a controller called **NGINX Ingress Controller**, which is open-source and widely used.

It can be installed in various ways, including through `kubectl`:

```bash
$ kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.1.0/deploy/static/provider/cloud/deploy.yaml
```

Let's check the Pods that were created in the namespace `ingress-nginx`:
```bash
$ kubectl get pods -n ingress-nginx

NAME                                       READY   STATUS      RESTARTS        AGE
ingress-nginx-admission-create-cvw5d       0/1     Completed   0               44h
ingress-nginx-admission-patch-nhhtr        0/1     Completed   1               44h
ingress-nginx-controller-8d8d76dd7-949dc   1/1     Running     1 (6h45m ago)   44h
```
If we dig into the Pod `ingress-nginx-controller-8d8d76dd7-949dc` details, we'll find out that's running an NGINX server within it!

Also, by checking the services in the `ingress-nginx` namespace:

```bash
$ kubectl get svc -n ingress-nginx

NAME                                 TYPE           CLUSTER-IP     EXTERNAL-IP     PORT(S)                      AGE
ingress-nginx-controller-admission   ClusterIP      10.43.26.101   <none>          443/TCP                      44h
ingress-nginx-controller             LoadBalancer   10.43.119.0    192.168.106.2   80:30834/TCP,443:31247/TCP   44h
```
We can see that we have a Service LoadBalancer called `ingress-nginx-controller` that will route only to the ingress controller Pods.

_Pretty awesome, uh?_

Time to apply the rules that the NGINX Ingress Controller will use to forward messages to our underlying Services.

Yes, **let's learn about Ingress**.

### 👉 The Ingress object
In summary, Ingress is a Kubernetes object that is associated with an Ingress Controller (such as NGINX or any other controller). 

It enables the application of various controller-specific features to _backend services_, providing a way to manage external access and apply routing, load balancing, and other functionalities within the Kubernetes cluster.

Let's create an `IngressClass` that represents our IngressController:

```yaml
apiVersion: networking.k8s.io/v1
kind: IngressClass
metadata:
  name: my-ingress-class
spec:
  controller: k8s.io/ingress-nginx
```

Then, we create an `Ingress` object that associates with the appropriate `IngressClass` and applies a set of rules to the backend services. 

These rules define the desired behavior and configuration for routing and accessing the Services, in this case using the **path**.

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: server-ingress
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /
spec:
  ingressClassName: my-ingress-class
  rules:
    - host: localhost
      http:
        paths:
          - path: /server
            pathType: Prefix
            backend:
              service:
                name: server
                port:
                  number: 80
          - path: /other-server
            pathType: Prefix
            backend:
              service:
                name: other-server
                port:
                  number: 80
```
Now, we can use **curl** with `localhost` as the endpoint since the Ingress Controller, in this case NGINX, is configured to handle different paths. 

NGINX will then forward the requests to their respective internal Services, which in turn will forward them to the underlying Pods serving the requested application or service.

This allows us to easily test and access the different services within the cluster using the specified paths.

```text
$ curl localhost/server
$ curl localhost/other-server
```
Yay!


![NGINX ingress controller](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/k1mmc6o2hf9wn01zgc42.png)

### 👉 A note about Ingress  Controllers in the Cloud

Please note that when using an Ingress Controller in a cloud environment, a **load balancer will be provisioned**. 

However, unlike _Services of type LoadBalancer_ where each Service has its own dedicated load balancer, when using an Ingress Controller, typically _only one cloud load balancer will be created_, because a **Service LoadBalancer is automatically created**.

This shared load balancer will handle the routing and load balancing for multiple backend services defined within the **Ingress** configuration. This approach helps optimize resource utilization and reduces the overhead of managing individual load balancers for each Service.

---

## Wrapping Up

In this guide, we have explored the **fundamentals of networking in Kubernetes**. 

We covered the essential concepts of Pods with their **internal IP addresses**, different types of **Services**, and discussed certain limitations. We also explored how **Ingress Controllers** address those limitations.

In the upcoming posts, we will continue to delve into the foundational aspects of Kubernetes. 

_Stay tuned_ for more insightful content on Kubernetes fundamentals!

---

## References

[Kubernetes Services](https://kubernetes.io/docs/concepts/services-networking/service/)
[Kubernetes Ingress](https://kubernetes.io/docs/concepts/services-networking/ingress/)
[Ingress Controllers](https://kubernetes.io/docs/concepts/services-networking/ingress-controllers/)
[NGINX documentation](https://nginx.org/en/docs/)
[NGINX ingress-controller Docker image](https://hub.docker.com/r/nginx/nginx-ingress)

---

_This post was written with the assistance of ChatGPT, which helped with some "eye candy" on grammar._
