---
title: "Kubernetes 101, part IV, deployments"
slug: "kubernetes-101-part-iv-deployments-20m3"
published_at: "2023-03-12 21:02:50Z"
language: "en"
status: "published"
tags: ["kubernetes", "docker"]
---

In the [third part](https://leandronsp.com/articles/kubernetes-101-part-iii-controllers-and-self-healing-4ki5), we went a bit further and learned how Kubernetes employs **self-healing capabilities** by using the _controller pattern_ through the utilisation of _workload resources_ such as **ReplicaSets**.

However, it's well-known that most applications require to be _updated frequently_. 

_ReplicaSets_ are useful only for applications that **do NOT need to be updated/deployed constantly**. Almost always we're going to need another object that Kubernetes provides as a _workload resource_: **the deployment object**.

---

## 🚀 Deployment
The Kubernetes [Deployment object](https://kubernetes.io/docs/concepts/workloads/controllers/deployment/) brings a **Deployment Controller** that acts like the **ReplicaSet Controller**, but additionaly it allows a variety of _update strategies_ so the application **won't suffer any downtime**.

### Creating the Deployment
We'll follow the same process as for the **ReplicaSet**, but referencing `kind: Deployment` instead:
```yaml
kind: Deployment
apiVersion: apps/v1
metadata:
  name: nginx
  labels:
    app: nginx
spec:
  ### The number of replicas of the same identical Pod
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
At first glance, it works _exactly like ReplicaSet_. Let's check the `deployment` object in `kubectl`:
```bash
$ kubectl get deployments
NAME    READY   UP-TO-DATE   AVAILABLE   AGE
nginx   2/2     2            2           11s
```
The output explains that we have _2 of 2 replicas_ (Pods) **ready**. 

Checking the Pods:
```bash
$ kubectl get pods
NAME                    READY   STATUS    RESTARTS   AGE
nginx-76d6c9b8c-sk28k   1/1     Running   0          7s
nginx-76d6c9b8c-f25nc   1/1     Running   0          7s
```
Note that, like ReplicaSet, each Pod gets a random unique ID in the cluster (`sk28k` and `f25nc` respectively).


![a deployment resource](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/r8gou89x56ymuwb4m2fx.png)

Until now, it's exactly a ReplicaSet, nothing different from it. _Time to see the differences_.

### Updating a Deployment
A Deployment allows _updates with **no downtime**_. As for our example with _NGINX_, let's demonstrate a simple update like **changing the NGINX version in the Pod**.

First, check the current NGINX version by entering to one of the Pods in the Deployment and executing `nginx -v`:
```bash
$ kubectl exec -it deploy/nginx -- nginx -v
nginx version: nginx/1.23.3
```
Next, we _change the Pod image **through the Deployment**_ by issuing the command `kubectl set image`:
```bash
$ kubectl set image deployment/nginx nginx=nginx:1.22.1
deployment.apps/nginx image updated
```
Checking the Pods, we can see that the **new Pods is being created** while the _current Pods are still running_. 

Hence, **the application is up and running**. _No downtime!_
```bash
$ kubectl get pods
NAME                     READY   STATUS              RESTARTS   AGE
nginx-76d6c9b8c-sk28k    1/1     Running             0          14m
nginx-76d6c9b8c-f25nc    1/1     Running             0          14m
nginx-756fbff4c9-t2pjb   0/1     ContainerCreating   0          8s
```
Then, after all Pods are successfully updated:
```bash
$ kubectl get pods
NAME                     READY   STATUS    RESTARTS   AGE
nginx-756fbff4c9-t2pjb   1/1     Running   0          19s
nginx-756fbff4c9-44g6w   1/1     Running   0          8s
```
Wanna confirm that?
```bash
kubectl exec -it deploy/nginx -- nginx -v
nginx version: nginx/1.22.1
```
_Such a big YAY!_ 🚀

### Bonus: rollout status
`kubectl` provides a command called `rollout status` that can be used during deployments, so the command _keeps blocked until the deployment is finished_. 

It's very useful in **CI/CD systems**:
```bash
### Update the image
$ kubectl set image deployment/nginx nginx=nginx:1.23.1
deployment.apps/nginx image updated

### Check the rollout deployment (blocks until it is finished)
$ kubectl rollout status deployment/nginx
Waiting for deployment "nginx" rollout to finish: 1 out of 2 new replicas have been updated...
Waiting for deployment "nginx" rollout to finish: 1 out of 2 new replicas have been updated...
Waiting for deployment "nginx" rollout to finish: 1 old replicas are pending termination...
Waiting for deployment "nginx" rollout to finish: 1 old replicas are pending termination...
deployment "nginx" successfully rolled out

### Checking the NGINX version
$ kubectl exec -it deploy/nginx -- nginx -v
nginx version: nginx/1.23.1
```
**Kubernetes is wonderful**, _isn't it_?

### 🖼️ Pictures or didn't happen
Okay, sometimes is worth seeing the explanation in pictures for a better comprehension.

👉 The Deployment Controller starts creating a new Pod:

![creating a new pod](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/yqwcys690puygq1urodu.png)

👉 Then, one of the old replicas starts terminating, and a new one starts being created:

![the second step in deployment](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/xuaxefvnp2wveq54x6oc.png)

👉 At the final stage, we have two new running replicas along with two old terminated replicas:

![the third phase](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/6ep0peg0ijos0o9ywh1t.png)

👉 And finally, the application was successfully rolled out:

![successfully rolled out](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/4mka0ey3he86qs6m20ze.png)



### ↩️ Rollbacks
Not rare, when faced in situation where updates are _delivered with bugs_, we may want to **rollback to an earlier version** of our application.

The `kubectl rollout` brings a command `history` where Kubernetes persist all versions given a specific deployment:
```bash
$ kubectl rollout history deployment/nginx
deployment.apps/nginx
REVISION  CHANGE-CAUSE
1         <none>
2         <none>
3         <none>
4         <none>
```
It's natural to think that the current version is the last one (4), but we can check that by using `kubectl describe`:
```bash
$ kubectl describe deployment/nginx | grep revision
Annotations:            deployment.kubernetes.io/revision: 4
```
How about rolling back to the previous version (3)?
```bash
## Rollback to the previous version
$ kubectl rollout undo deployment/nginx 
deployment.apps/nginx rolled back

### Or simply going to a specific version
$ kubectl rollout undo deployment/nginx --to-revision=3

### Follow the deployment
$ kubectl rollout status deployment/nginx
Waiting for deployment "nginx" rollout to finish: 1 old replicas are pending termination...
Waiting for deployment "nginx" rollout to finish: 1 old replicas are pending termination...
deployment "nginx" successfully rolled out

### Check the NGINX version
$ kubectl exec -it deploy/nginx -- nginx -v
nginx version: nginx/1.23.3
```

😱 Unbelievable! 😱 _Rollbacks in Kubernetes is so easy_ that we don't have excuses to not doing rollbacks when needed.

### Why a system rollback is so important
I've seen a lot of projects that **struggle at rollbacks**. Sometimes because the rollback _process is very hard_. And sometimes because people don't have the proficiency in managing rollbacks.

Many people prefer doing Git reverts over application rollback.

_That's a very **wrong move** IMHO_.

Git reverts can be hard **due to conflicts**. The revert will take its time through all the **CI/CD pipeline again**. Until the revert is accepted to go to production, the application is **bleeding** with sometimes _unacceptable bugs_.

Invest time and resources _having a good rollback system_. If you're using Kubernetes, **there's no excuse to not performing rollbacks**, just experiment yourself _how straightforward_ it is.

### Scaling replicas in a Deployment
Additionally, we can scale up (or down) the number of replicas given a Deployment:
```bash
$ kubectl scale deployment/nginx --replicas=5
deployment.apps/nginx scaled
```
Then check the Pods:
```bash
$ kubectl get pods
NAME                     READY   STATUS    RESTARTS   AGE
nginx-799c5dd65b-5ncg2   1/1     Running   0          4m12s
nginx-799c5dd65b-qm2vb   1/1     Running   0          4m8s
nginx-799c5dd65b-pfngc   1/1     Running   0          8s
nginx-799c5dd65b-w49q4   1/1     Running   0          8s
nginx-799c5dd65b-ph6wv   1/1     Running   0          8s
```

---
## Wrapping Up
This post focused mainly on **Deployments** and how we can perform _updates easily_ in Kubernetes **with no downtime**.

Next, we'll see how to manage _stateful applications_ in Kubernetes by using **StatefulSets**.

Stay tuned!
