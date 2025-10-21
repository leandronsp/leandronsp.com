---
title: "Tekton CI, part III, listen to Github events"
slug: "tekton-ci-part-iii-listen-to-github-events-1h3i"
published_at: "2023-02-19 19:15:03Z"
language: "en"
status: "published"
tags: ["tutorial"]
---

_For this guide I'm assuming you are running a local Kubernetes cluster._

[In the previous article](https://dev.to/leandronsp/tekton-ci-part-ii-sharing-information-j81) we've seen how to share information across a Pipeline using **Workspaces**, leading to a task for cloning a Github repository then ending with anoter task for listing the source files in the cloned repository.

Now, let's understand how to **listen to Github events** and _trigger the Pipeline_ using event bindings.

---

## :ear: Listening to Github events
How to listen to Github events? In other words, when someone **pushes code to some branch or opens a pull request**, how do we get notified from that?

Github (not only Github but other majors like Gitlab too) notifies such events using [Webhooks](https://docs.github.com/en/webhooks-and-events/webhooks/about-webhooks). 

We basically have to configure a webhook in the Github interface, _choose some events_ and **provide a webhook URL** to receive a payload. 

Payload received, we can decide whatever we want with that information. 

In our case, we want to look at the **event type** (if pull request opened for instance), _extract the repo URL_ from the payload and then **run the pipeline providing the repo URL**.

Here's the basic architecture of Webhooks on Github:
![Webhook local](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/iyrw4yc3ey8mlryunvsz.png)

The summary of steps we're going to cover in this post:

1. Create a Tekton **Event Listener**, TriggerBinding and TriggerTemplate
2. Configure the Github Webhook

Let's dive in!

---

## First things first
Install the triggers resources in the cluster:
```bash
$ kubectl apply --filename \
  https://storage.googleapis.com/tekton-releases/triggers/latest/release.yaml

$ kubectl apply --filename \
  https://storage.googleapis.com/tekton-releases/triggers/latest/interceptors.yaml
```

## 1. Create the Event Listener
[Event Listeners](https://tekton.dev/docs/triggers/eventlisteners/) are Tekton components that listen for events at a specified port in your Kubernetes cluster. Listeners are attached to Kubernetes Pods and backed by Services.

Event Listeners need a proper Kubernetes **Service Account** for role access control (RBAC), so the first step is creating the RBAC objects. 

_The Gist with the RBAC yaml can be found_ [here](https://gist.github.com/leandronsp/7cdf211797397ae513fc1d0dc0c5cf8b).

Time to exmplore the `event-listener.yml`:
```yaml
apiVersion: triggers.tekton.dev/v1beta1
kind: EventListener
metadata:
  name: github-pr
spec:
  serviceAccountName: tekton-service-account
  triggers:
    - name: pr-trigger
      bindings:
        - ref: github-pr-trigger-binding
      template:
        ref: github-pr-trigger-template
```
* **serviceAccountName** referes to the RBAC
* each trigger has a name and must provide a **trigger binding and a trigger template**

### Trigger Binding
[Trigger Bindings](https://tekton.dev/docs/triggers/triggerbindings/) are responsible to extract information from the event payload and use such information in the **TriggerTemplate**.
```yaml
apiVersion: triggers.tekton.dev/v1beta1
kind: TriggerBinding
metadata:
  name: github-pr-trigger-binding
spec:
  params:
  - name: revision
    value: $(body.pull_request.head.sha)
  - name: repo-url
    value: $(body.repository.clone_url)
```

### Trigger Template
[Trigger Templates](https://tekton.dev/docs/triggers/triggertemplates/) define the template of the pipeline or task, using the params extracted by the **TriggerBinding**.

```yaml
apiVersion: triggers.tekton.dev/v1beta1
kind: TriggerTemplate
metadata:
  name: github-pr-trigger-template
spec:
  params:
  - name: revision
    default: main
  - name: repo-url
  resourcetemplates:
  - apiVersion: tekton.dev/v1beta1
    kind: PipelineRun
    metadata:
      generateName: my-pipeline-
    spec:
      pipelineRef:
        name: my-pipeline
      workspaces:
      - name: shared-data
        volumeClaimTemplate:
          spec:
            accessModes:
            - ReadWriteOnce
            resources:
              requests:
                storage: 1Gi
      params:
      - name: repo-url
        value: $(tt.params.repo-url)
      - name: revision
        value: $(tt.params.revision)
```
**TriggerTemplate** is similar to **PipelineRun**, except that the _latter is triggered manually_ as we've seen in the previous posts. 

Then, the _TriggerTemplate_ "sends" the needed params to the _PipelineRef_, along with the definition of Workspace volume claim templates.

### Exposing the Event Listener URL
After applying the Trigger resources, we can check that Tekton created a **Kubernetes service** for the event listener:
```bash
$ tkn eventlisteners list

NAME        AGE              URL                                                  AVAILABLE
github-pr   21 minutes ago   http://el-github-pr.default.svc.cluster.local:8080   True
```
All we need is providing this URL `http://el-github-pr.default.svc.cluster.local:8080` to the Github Webhook.

But we have two problems here:

a. The URL is _only accessed within the cluster_. In order to expose it to the `localhost`, we should perform a `port-forward`
b. Github cannot access our `localhost`, so we need to use some sort of "proxy" in the internet that creates a tunnel for our **local computer on the port 8080**. 

First, let's perform the `port-forward`:
```bash
$ kubectl port-forward svc/el-github-pr 8080:8080

Forwarding from 127.0.0.1:8080 -> 8080
Forwarding from [::1]:8080 -> 8080
```
Great, our host is receiving in the port `8080` (localhost:8080), but how do we tunnel Github to our port using some service in the cloud?

[Ngrok](https://ngrok.com/) solves that problem. With ngrok, we simply issue:
```bash
$ ngrok http http://localhost:8080
```
And it outputs a public URL ready to be used across the internet, forwarding to our port `8080` in the `localhost`:

```
Add Single Sign-On to your ngrok dashboard via your Identity Provider: https://ngrok.com/dashSSO

Session Status                online
Account                       Leandro Proença (Plan: Free)
Version                       3.1.1
Region                        South America (sa)
Latency                       23ms
Web Interface                 http://127.0.0.1:4040
Forwarding                    https://95d2-177-9-110-144.sa.ngrok.io -> http://localhost:8080

Connections                   ttl     opn     rt1     rt5     p50     p90
                              0       0       0.00    0.00    0.00    0.00 
```
Nice, look how we've got a random URL (in your case it will be different, okay?):
```
https://95d2-177-9-110-144.sa.ngrok.io
```
:tada:

---
## 2. Configuring the Github Webhook
In the repository settings, go to `Webhooks`:

![Github WH](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/dt819z6nehv7d35o4jer.png)

Fill the form with the following:

* **Payload URL**: paste the URL from Ngrok
* **Content-Type**: application/json
* **Secret**: leave it empty for now
* **Let me select individual events**: _Pull Requests only_

Webhook created, time to create some PR in the repository. 
![PR](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/03foj8ry5vkbsc11ra0d.png)

As we can see next, the pipeline was triggered by the event! :rocket:

![dash](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/f0lnn5mihqf5z564u2aj.png)

:beer: Good times! :beer:

---

## It's all about tests!

At this moment, our pipeline only runs a simple `ls` command in the cloned repository. But we should do even more: style checks, security checks and **automated tests**.

Let's change the pipeline so it _runs_ the **unit tests** in the repository.

```yaml
apiVersion: tekton.dev/v1beta1
kind: Pipeline
metadata:
  name: chespirito-pipeline
spec:
  params:
    - name: repo-url
      type: string
    - name: revision
      type: string
  workspaces:
    - name: shared-data
  tasks:
  - name: fetch-source
    taskRef:
      name: git-clone
    workspaces:
      - name: output
        workspace: shared-data
    params:
      - name: url
        value: $(params.repo-url)
      - name: revision
        value: $(params.revision)
  - name: run-tests
    runAfter: ["fetch-source"]
    taskRef:
      name: run-tests
    workspaces:
      - name: source
        workspace: shared-data
---
apiVersion: tekton.dev/v1beta1
kind: Task
metadata:
  name: run-tests
spec:
  workspaces:
    - name: source
  steps:
  - name: unit-tests
    image: ubuntu
    workingDir: $(workspaces.source.path)
    script: |
      #!/usr/bin/env bash

      docker-compose run --rm ruby bundle install
      docker-compose run --rm ruby ruby -Itest test/all.rb
```
We just created a new pipeline called `chespirito-pipeline`, which uses 2 tasks: `git-clone` and `run-tests`.

The `run-tests` Task comprises of an Ubuntu image, so all we need is to use Docker to **run the tests inside the container**. 

### A note about running docker commands on CI

However, the Ubuntu Docker official image **does not provide a Docker Runtime**, then we need to run some kind of "Docker image" in order to have it ready to run.

Almost every CI environment in the cloud (including ours running on a local Kubernetes cluster) is already running _jobs/tasks in Docker containers_. 

_Eack Task is a container_, so how can we run **Docker in Docker**?

### Docker in Docker

Luckily, the Docker Hub community provides a [Docker image](https://hub.docker.com/_/docker) for running Docker containers inside Docker. 

It's called **Docker-in-Docker**, or _dind_.

For a Kubernetes cluster, there's a minimal setup needed to make it work. We should **mount some specific volumes** and export some **environment variables** so the container will use the correct Docker Runtime in the cluster.

We can use an architectural pattern called [Sidecar Pattern](https://medium.com/nerd-for-tech/microservice-design-pattern-sidecar-sidekick-pattern-dbcea9bed783), which is basically an `initContainer` that uses the **dind image** and mounts volumes so other containers in the same Pod can use the Docker Runtime.

In Tekton, it's no different, and the resource is actually called **Sidecar**, similar to _Step_ within a Task but it runs before the steps.

## Changing the Task
Because of separation of concerns, the only component we have to change is the Task (thanks to how Kubernetes employ important architectural patterns).

```yaml
apiVersion: tekton.dev/v1beta1
kind: Task
metadata:
  name: run-tests
spec:
  workspaces:
    - name: source
  steps:
  - name: unit-tests
    image: docker
    workingDir: $(workspaces.source.path)
    script: |
      docker-compose run --rm ruby bundle install
      docker-compose run --rm ruby ruby -Itest test/all.rb
```
The image used will be `docker`, because we'll run Docker commands for running the unit tests.

Now, we add to this step, the env variables that Docker will use to connect to the runtime:

```yaml
...
    env:
      - name: DOCKER_HOST
        value: tcp://localhost:2376
      - name: DOCKER_TLS_VERIFY
        value: "1"
      - name: DOCKER_CERT_PATH
        value: "/certs/client"
```
Next, declare the `volumeMounts` that will be populated by the sidecar:
```yaml
...
    volumeMounts:
      - mountPath: /certs/client
        name: dind-certs
```
Step defined, let's declare the `sidecar` node, right after the `steps` section:
```yaml
...
  sidecars:
  - name: dind
    image: docker:dind
    securityContext:
      privileged: true
    args:
      - --storage-driver=vfs
      - --userland-proxy=false
      - --debug
    env:
      - name: DOCKER_TLS_CERTDIR
        value: /certs
    volumeMounts:
      - mountPath: /certs/client
        name: dind-certs
      - mountPath: $(workspaces.source.path)
        name: $(workspaces.source.volume)
    readinessProbe:
      periodSeconds: 1
      exec:
        command: ['ls', '/certs/client/ca.pem']
```
The sidecar uses the `docker:dind` image, starts it and then mounts the `/certs` in the volume shared with the step.

Also, it's important to note that the `sidecar` **needs to mount the workspace as a Volume**, since the Docker run will happen in the sidecar.

Finally, we declare the `volumes` section, which can be an `emptyDir` since it's used by steps/sidecars within the same Task:
```yaml
...
  volumes:
    - name: dind-certs
      emptyDir: {}
```
Pipeline applied, time to create the `PipelineRun`:
```yaml
apiVersion: tekton.dev/v1beta1
kind: PipelineRun
metadata:
  generateName: chespirito-pipeline-
spec:
  pipelineRef:
    name: chespirito-pipeline
  params:
  - name: repo-url
    value: https://github.com/leandronsp/chespirito.git
  - name: revision
    value: main
  workspaces:
  - name: shared-data
    volumeClaimTemplate:
      spec:
        accessModes:
        - ReadWriteOnce
        resources:
          requests:
            storage: 1Gi
```
:tada: May we run it and **everything is green!**

## The last piece

Okay, we've run the new `chespirito-pipeline` manually. But now we have to change the `EventListener`, and the only thing needed is:
```yaml
...
      pipelineRef:
        name: chespirito-pipeline
```
Apply some changes in the branch, push to the PR and...

![Wonderful](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/mf827r38r6v97kifmwj8.png)

:tada: **How wonderful is that?** :rocket:

---

In this article we learned about event **listeners, triggers, Github webhooks** and how to integrate all those stuff so we can run the unit tests at some arbitrary project in Github!

Keep in tune, later we'll see how to listen to the "push to main" event and rollout our application in the Kubernetes cluster, which is the "CD part".

Cheers! :beer:
