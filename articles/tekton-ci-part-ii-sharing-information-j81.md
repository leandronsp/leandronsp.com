---
title: "Tekton CI, part II, sharing information"
slug: "tekton-ci-part-ii-sharing-information-j81"
published_at: "2023-02-19 15:49:26Z"
language: "en"
status: "published"
tags: ["kubernetes", "ci", "linux", "docker"]
---

[In the previous post](https://leandronsp.com/articles/tekton-ci-part-i-a-gentle-introduction-ilj), we viewed an introduction to Tekton and a brief overview through its main components: _Steps, Tasks and Pipelines_.

Now, let's keep exploring the **Tekton building blocks** as we see a complete journey from _development to production_.

---

## :bulb: First things first
We've been using the `kubectl` CLI and, despite it's good enough to work and visualize Tekton components, Tekton provides [its own CLI](https://tekton.dev/docs/cli/) that makes the job a little easier:
```bash
$ tkn pipelinerun list

NAME                   STARTED          DURATION   STATUS
hello-pipeline-x2s8p   26 minutes ago   8s         Succeeded
```
Even better, Tekton provides [a nice UI dashboard](https://tekton.dev/docs/dashboard/) so we can have a better user experience:

![Dashboard](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/cngjhqi3yvz8raz48t74.png)

The good part is that we can `port-forward` the Dashboard since to localhost it's a `service` in Kubernetes. Furthermore, we could deploy an `Ingress` and create our own DNS in production environments.

_For me, that's a great advantage, as I'm having my own CI/CD system under my own DNS._

## :heart: Community matters
Because the Tekton community takes very seriously its adoption and development, many tasks can be reused by the community, so [Tekton Hub](https://hub.tekton.dev/) was created.

One such common task is **cloning an arbitrary Git repository**, then it's time to add this Task to our cluster:

![git clone](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/kg98w0pbz452ohq5fqqs.png)

Using `kubectl`:

```bash
$ kubectl apply -f https://raw.githubusercontent.com/tektoncd/catalog/main/task/git-clone/0.9/git-clone.yaml
```
Or simply `tkn`:
```bash
tkn hub install task git-clone
```
Cool, but how do we use this task? 

---

## A simple pipeline
Our pipeline will be defined by two main tasks:

* git clone (using the Task we imported form the Tekton Hub)
* list directory after clone, issuing a dead simple `ls` command

```yaml
apiVersion: tekton.dev/v1beta1
kind: Pipeline
metadata:
  name: my-pipeline
spec:
  params:
  - name: repo-url
    type: string
  - name: revision
    type: string
  tasks:
  - name: fetch-source
    taskRef:
      name: git-clone
    params:
      - name: url
        value: $(params.repo-url)
      - name: revision
        value: $(params.revision)
  - name: list-source
    runAfter: ["fetch-source"]
    taskRef:
      name: list-source
```
* Pipelines and Tasks allow to declare **params**, that are sent by **PipelineRuns** in _runtime_. In our case, the `repo-url` to clone from and the `revision` (commit or branch)
* The first task is called `fetch-source` which refers to the `git-clone` we imported
* The second task runs after `fetch-source` and is called `list-source`, which refers to another Task called `list-source`

Let's check out the Task `list-source`:
```yaml
apiVersion: tekton.dev/v1beta1
kind: Task
metadata:
  name: list-source
spec:
  steps:
  - name: ls
    image: ubuntu
    script: >
      ls
```
It's just a Pod having an `ubuntu` container which issues the `ls` command. _Very simple, uh?_

### Tasks need to share information through Volumes 

But remember one important thing: **Pods don't share Volumes by default**. Therefore, different tasks do not share information. By which means the task `list-source` won't "see" the cloned repository from the `fetch-source` Task. 

_How does Tekton solve this problem?_ Enter **Workspaces**.

## :package: Workspaces
[Workspaces](https://tekton.dev/docs/pipelines/workspaces/) in Tekton are similar to Volumes in Kubernetes and Docker. Different **Tasks** can share workspaces so data goes over the **Pipeline**.

According to [its documentation](https://hub.tekton.dev/tekton/task/git-clone), the `git-clone` Task requires two params at least: a **url** for fetching the repository and a _Workspace_ named **output**. 

The pipeline/task usually declares the workspace and at runtime (through a **PipelineRun** or a **TaskRun**) the _workspace is mounted_ in Kubernetes.

Workspaces can be **ConfigMaps, Secrets, Persistent Volumes or even a volume EmptyDir** which is discarded when the _TaskRun completes_.

### :pencil: A note to emptyDir
This kind of volume only works **through steps within a Task**, but they _do not work across different Tasks_ within a Pipeline. **For Pipelines use Persistent Volumes instead**.

Let's change our pipeline and task definitions. Add the following to the `spec` node in Pipeline:

```yaml
  ...
  workspaces:
    - name: shared-data
```
It basically declares that the Pipeline will use a workspace called `shared-data`.

Next, in the `tasks` node, declare the workspace required by the task `git-clone` as follows:
```yaml
    ...
    workspaces:
      - name: output
        workspace: shared-data
```
The name of the task workspace is `output` and it refers to the workspace `shared-data` declared in the pipeline section.

Repeat the previous step for the `list-source` task definition, but in this case, let's name the task workspace as `source`, pointing to the `shared-data` workspace declared in the pipeline:
```yaml
    ...
    workspaces:
      - name: source
        workspace: shared-data
```
And now, within the Task `list-source`, we must declare the workspace `source` which will come through the pipeline. So, the Task yaml looks like this:
```yaml
apiVersion: tekton.dev/v1beta1
kind: Task
metadata:
  name: list-source
spec:
  workspaces:
    - name: source
  steps:
  - name: ls
    image: ubuntu
    workingDir: $(workspaces.source.path)
    script: >
      ls
```

## :running: Time to run!
As for now, we apply all the changes but we only have declarations, pipeline and tasks. In order to perform a **PipelineRun**, we must declare how the pipeline workspace `shared-data` will look like. 

In this case, we cannot use `emptyDir`, that's why we'll provide a `volumeClaimTemplate` which uses the standard storage class configured in our cluster, **requesting 1Gb of space**.
```yaml
apiVersion: tekton.dev/v1beta1
kind: PipelineRun
metadata:
  generateName: my-pipeline-
spec:
  pipelineRef:
    name: my-pipeline
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
* providing the `repo-url`, which points to the repository `https://github.com/leandronsp/chespirito.git`
* also provising the `revision`, so the Task performs checkout from the main branch
* and least, but very important, the pipeline workspace `shared-data`, using a `volumeClaimTemplate`

_Run the pipeline and..._


![Pipeline dash](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/63xmm4no9kg9id9yz0w4.png)

:rocket: **How cool is that?** :rocket:

---
In this post we've got into the **Tekton CLI, Dashboard and Tekton Hub**, going through a simple pipeline that uses a Task built by the community to clone an arbitrary repository from Github and list its files in the screen.

During the journey we learned about **Workspaces** and how they solve the problem of _sharing information_ through Steps and Tasks within a Pipeline.

Stay tuned because the upcoming posts will explore how to **listen to Github events** and _trigger our Pipeline_ instead of running it manually.


 


