---
title: "Tekton CI, part I, a gentle introduction"
slug: "tekton-ci-part-i-a-gentle-introduction-ilj"
published_at: "2023-02-19 06:47:01Z"
language: "en"
status: "published"
tags: ["discuss", "softwaredevelopment", "agile"]
---


In [another post](https://dev.to/leandronsp/cicd-in-a-nutshell-3k6a) I talked about **CI/CD in a nutshell** and its fundamentals, before going further on **Tekton**. _In case you need, I suggest you reading that post before_.

Now that we understand CI/CD practices, the importance of _Cloud Delivery Foundation_ (CDF) as community and that Tekton is a graduated CDF project, we can deep dive into Tekton.

Let's see its internals and a brief yet complete tutorial on **Tekton**, _integrating with Github_, by building and delivering an application from **development to production**.

---

[Tekton](https://tekton.dev/) is an open-source framework for creating CI/CD systems. 

Instead of using a **proprietary** CI/CD tool such as Github Actions, Gitlab, BitBucket or CircleCI, _Tekton_ allows developers to easily create components that will **build, test and deploy** applications, using their own infrastructure.

---

## Is this post for me :question:

* You deploy applications using Docker, _Kubernetes_ or similar
* You use **cloud-native** design to guide you building standardized yet scalable applications in the cloud
* Also, you build and deliver applications using **proprietary** CI/CD tooling in the cloud

_Other than that, you want to give a try running CI/CD in your own infrastructure, maybe having some cost reduction, why not?_

**Then this post is for you.**

## Why Tekton :question:

Advantages of using Tekton as a CI/CD tool:

* We can build reusable components and deploy them into our own infrastructure, similar to what [Gitlab Runners](https://docs.gitlab.com/runner/) do
* Tekton components are simply [Kubernetes Operators](https://kubernetes.io/docs/concepts/extend-kubernetes/operator/) that extend Kubernetes functionalities, so Tekton is very friendly to those who work on Kubernetes clusters
* The general idea is not that far from Gitlab CI, Github Actions or similar: we declare our pipeline usually using a YAML file
* It's open-source
* It's a graduated CDF project, which means a lot of companies are behind its maintenance, Google, Red Hat, SAP, Oracle, to name a few...

After an introduction, time to explore the building blocks of Tekton.

---

## Installation 
In the Kubernetes cluster, we can import all CRD's using `kubectl`. For now, let's install them using the Tekton `pipeline` release:
```bash
kubectl apply \
  --filename \
  https://storage.googleapis.com/tekton-releases/pipeline/latest/release.yaml
```

## Tekton components

The main components of Tektons are:

* Steps
* Tasks
* Pipelines

There are more components to explore, but as for this article we'll focus on these three ones.

---

## Steps
**Steps** are literally _containers_ that run from images, and in essence we can give a **name** and provide an **arbitrary script** in the step.

![Step](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/4gq6dmrlpondwbivk5xe.png)

Nice, but how do we create a `Step` in Tekton?

Simply we can't. Steps are pretty much like `containers` in Kubernetes, and as such we should group them into a higher abstraction similar to _Pods_, which in Tekton is called **Task**.

---

## Tasks
**Tasks** are collections of _steps_, that you define and arrange in a specific order. A Task **executes as a Pod** in the Kubernetes cluster.


![Task](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/nw403yfb3y04xbn7f4t0.png)

Let's create our first Task `hello-task.yml` that should have only one `step` and prints the message `Hello` in the _STDOUT_:
```yaml
apiVersion: tekton.dev/v1beta1
kind: Task
metadata:
  name: hello-task
spec:
  steps:
    - name: hello
      image: ubuntu
      script: >
        echo "Hello"
```
Apply the `yaml` as usual in Kubernetes and check that the task was created in the cluster:
```bash
$ kubectl get tasks

NAME         AGE
hello-task   19s
```
However, we have only the _task definition_. We should be able to **run the task**, which would run a _Task pod_. 

Tekton provides the **TaskRun**, which is an abstraction that runs an underlying Task (`hello-task-run.yml`).
```yaml
apiVersion: tekton.dev/v1beta1
kind: TaskRun
metadata:
  generateName: hello-task-
spec:
  taskRef:
    name: hello-task
```
In this example, we refer the underlying Task using the `taskRef` field. 

Now, for `TaskRun` we have to use the `kubectl create` instead of apply, because the `generateName` does not work with the `apply` command.
```bash
kubectl create -f hello-task-run.yml
```
Checking the `taskruns`:
```bash
$ kubectl get taskruns

NAME                             SUCCEEDED   REASON                    STARTTIME   COMPLETIONTIME
hello-task-xvtgb                 True        Succeeded                 42s         28s
```
And the `pods`:
```bash
$ kubectl get pods

NAME                                 READY   STATUS      RESTARTS   AGE
hello-task-xvtgb-pod                 1/1     Running     0          13s
```
Getting the `pod` logs in order to see if the message `Hello` is echoed:
```bash
$ kubectl logs hello-task-xvtgb-pod

Hello
```

_Tasks are great_, but if we want to build more robust CI/CD pipelines, we should **group tasks** into a higher abstraction, which in Tekton is called **Pipelines**.

---
## Pipelines
**Pipelines** are collections of _tasks_, that you define and arrange in a specific order.

![Task](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/l6ra1wj6l62izk0so1n0.png)

Let's create our first **Pipeline**. In the following example, we'll have a pipeline containing 2 tasks:

* 1 taskRef referencing to the Task previously created
* 1 taskSpec containing the Step for the new Task

```yaml
apiVersion: tekton.dev/v1beta1
kind: Pipeline
metadata:
  name: hello-pipeline
spec:
  tasks:
    - name: hello-task
      taskRef:
        name: hello-task
    - name: bye-task
      taskSpec:
        steps:
          - name: bye
            image: ubuntu
            script: >
              echo "Bye"
```
After `kubectl apply`, we should see the pipeline successfully created:
```bash
$ kubectl get pipelines

NAME                  AGE
hello-pipeline        5s
```
As in Tasks, Pipelines are only _definitions_. We need another abstraction in order to **run the pipeline**, which is called **PipelineRun**.
```yaml
apiVersion: tekton.dev/v1beta1
kind: PipelineRun
metadata:
  generateName: hello-pipeline-
spec:
  pipelineRef:
    name: hello-pipeline
```
Then:
```bash
$ kubectl create -f hello-pipeline-run.yml
```
Check the `pipelineruns`:
```bash
$ kubectl get pipelineruns

NAME                   SUCCEEDED   REASON      STARTTIME   COMPLETIONTIME
hello-pipeline-zbbcr   True        Succeeded   10s         1s
```
And the `pods`:
```bash
$ kubectl get pods

NAME                                  READY   STATUS      RESTARTS   AGE
hello-task-xvtgb-pod                  0/1     Completed   0          25m
hello-pipeline-zbbcr-hello-task-pod   0/1     Completed   0          82s
hello-pipeline-zbbcr-bye-task-pod     0/1     Completed   0          82s
```
Note that we have 2 pods for the `hello-pipeline`, because **each Task runs as a Pod**.

The `hello` task pod:
```bash
$ kubectl logs hello-pipeline-zbbcr-hello-task-pod 

Hello
```

And the `bye` task pod:
```bash
$ kubectl logs hello-pipeline-zbbcr-bye-task-pod 

Bye
```
Yay! :rocket:

---
In this post we've seen an **introduction to Tekton** and an _overview_ on its main components.

In the upcoming posts, we'll see the **Tekton UI Dashboard** and how to **trigger Pipelines** listening to external events such as _Push/PullRequests in Github_. 

Stay tuned!
