---
title: "Kubernetes 101, part VI, daemonsets"
slug: "kubernetes-101-part-vi-daemonsets-1ph0"
published_at: "2023-04-05 03:46:25Z"
language: "en"
status: "published"
tags: ["kubernetes", "docker"]
---

For most use cases, deploying **core business apps** in Kubernetes using [Deployments](https://leandronsp.com/articles/kubernetes-101-part-iv-deployments-20m3) for stateless applications and [StatefulSets](https://leandronsp.com/articles/kubernetes-101-part-v-statefulsets-5dob) for stateful applications is good enough. 

Not rare, we need to deploy components that will not perform the core business work but **will support the core business** instead. 

Core business apps need _observability_: **application metrics**, latency, CPU-load, etc. Furthermore, core business apps need to _tell how things are going on_, in other words they need a **logging architecture**.

---

## When default logging is not enough
Once we deploy the main core business workload in Kubernetes, wen can check the logs by going through each Pod manually. It can be cumbersome.

Kubernetes provide `kubectl logs` which helps a lot and, by adding a bit of bash script and creativity, we can rapidly check logs of all Pods in the cluster.

But we have to provide a better developer experience (DX) to our team, so only providing `kubectl logs` might be not enough for some cases.

---
## A potential logging solution
How about **collecting and concentrating all logs in a single place**?

What if we had a **single Pod in every Node** responsible for collecting logs and sending them to a common place where developers could _easily fetch the logs_ of the cluster?

In this scenario, every Node would run a single Pod _for collecting logs_. Any time a new Node is created, some kind of "daemon controller" would make sure that a new Pod is scheduled to the new node. Thus, all Nodes would collect logs.

The picture below illustrates this potential solution:

![collecting logs in every node](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/qyyrib8u22mwztlt1pcf.png)

_DaemonSets for the rescue_.

---
## DaemonSet
The Kubernetes [DaemonSet object](https://kubernetes.io/docs/concepts/workloads/controllers/daemonset/) brings a DaemonSet controller that watches for Nodes creation/deletion and works to make sure every Node will have a single Pod replica of the DaemonSet.

[Log collectors](https://en.wikipedia.org/wiki/Log_management) are a perfect fit for this solution.

Let's create a _very dead simple log collector_ just using DaemonSet, Linux and creativity, nothing more.

The YAML file looks like the following:
```yaml
apiVersion: apps/v1
kind: DaemonSet
metadata:
  name: log-collector
spec:
  selector:
    matchLabels:
      app: log-collector
  template:
    metadata:
      labels:
        app: log-collector
    spec:
      containers:
      - name: log-collector
        image: busybox
        command: ["/bin/sh", "-c", "while true; do find /var/log/pods -name '*.log' -print0 | xargs -0 cat >> /logs/all-pods.log; sleep 5; done"]
        volumeMounts:
        - name: all-logs
          mountPath: /logs
        - name: var-log
          mountPath: /var/log/pods
        - name: var-containers
          mountPath: /var/lib/docker/containers
      volumes:
      - name: all-logs
        hostPath:
          path: /logs
      - name: var-log
        hostPath:
          path: /var/log/pods
      - name: var-containers
        hostPath:
          path: /var/lib/docker/containers
```
Some highlights:

* there's no multiple replicas like in Deployments, only a single Pod running on every Node
* In Kubernetes with Docker, by default, all logs are sent to `/var/log/pods` via `/var/lib/docker/containers`. This is located in every Node
* We mount volumes for those `/var/*` locations so we can watch for changes in these folders and send them to a common single location
* In this DaemonSet, we configure to send all logs to `/logs/app-pods.log`, then mounting back the volume in the host

After deploying, in the host, check the logs:
```bash
$ tail -f /logs/app-pods.log

{"log":"2023/04/05 02:29:34 [notice] 1#1: using the \"epoll\" event method\n","stream":"stderr","time":"2023-04-05T02:29:34.687797577Z"}
{"log":"2023/04/05 02:29:34 [notice] 1#1: nginx/1.23.4\n","stream":"stderr","time":"2023-04-05T02:29:34.687806202Z"}
{"log":"2023/04/05 02:29:34 [notice] 1#1: built by gcc 10.2.1 20210110 (Debian 10.2.1-6) \n","stream":"stderr","time":"2023-04-05T02:29:34.687807994Z"}
{"log":"2023/04/05 02:29:34 [notice] 1#1: OS: Linux 5.15.68-0-virt\n","stream":"stderr","time":"2023-04-05T02:29:34.687809452Z"}
{"log":"2023/04/05 02:29:34 [notice] 1#1: getrlimit(RLIMIT_NOFILE): 1048576:1048576\n","stream":"stderr","time":"2023-04-05T02:29:34.687810744Z"}
{"log":"2023/04/05 02:29:34 [notice] 1#1: start worker processes\n","stream":"stderr","time":"2023-04-05T02:29:34.687811994Z"}
{"log":"2023/04/05 02:29:34 [notice] 1#1: start worker process 29\n","stream":"stderr","time":"2023-04-05T02:29:34.687842494Z"}
{"log":"2023/04/05 02:29:34 [notice] 1#1: start worker process 30\n","stream":"stderr","time":"2023-04-05T02:29:34.68784791Z"}
{"log":"2023/04/05 02:29:34 [notice] 1#1: start worker process 31\n","stream":"stderr","time":"2023-04-05T02:29:34.687900494Z"}
{"log":"2023/04/05 02:29:34 [notice] 1#1: start worker process 32\n","stream":"stderr","time":"2023-04-05T02:29:34.687971452Z"}
```
**Yay!** _How cool is that?_

---
## Professionalism is all
Of course, in production, this dead simple log collector won't scale accordingly.

Instead, we can use tooling like [fluentd](https://www.fluentd.org/), [logstash](https://www.elastic.co/logstash/) and similar to do a more robust and scalable work.

---
## Wrapping Up
Today we learned the importance of structuring and **collecting logs** of our applications, no matter where they are deployed.

In Kubernetes, life's a bit easier because it's a **cluster of containers** and as such, we employ a special controller called **DaemonSet** that will make sure we have a log collector Pod _running in every Node_.

Don't miss the next posts where we'll talk about Jobs and CronJobs. 

_Cheers!_


