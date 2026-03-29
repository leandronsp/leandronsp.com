---
title: "Tekton CI/CD, part IV, continuous delivery"
slug: "tekton-cicd-part-iv-continuous-delivery-206m"
published_at: "2023-02-21 22:13:39Z"
language: "en"
status: "published"
tags: ["firstpost", "career", "discuss"]
---

The [previous post](https://leandronsp.com/articles/tekton-ci-part-iii-listen-to-github-events-1h3i) demonstrated how to _listen to Github events_ and trigger a pipeline based on such event.

So far, the pipeline consists in:

* **fetching** the source code (from Github)
* building a Docker image (using dind) and **running unit tests**

We're still missing the **delivery**, i.e _deploying our application to production_. That's the subject of this article.

---

## First things first

The process of _deploying_ will be as follows:

* **build a Docker image** of the application
* **push** the image to the **Docker registry**
* perform a **rollout deployment** in kubernetes, using `kubectl`

All of these steps will be made using Tekton tasks.

We'll keep using the application [chespirito](https://github.com/leandronsp/chespirito), but we are yet to deploy it to Kubernetes first, create a Docker registry to keep our images and lastly create a Task to perform the rollout with `kubectl`.

## Application and registry setup
In order to setup the application in Kubernetes for the first time, we have to provide the Docker registry, which will be a Deployment Pod in the cluster.

Both Chespirito Pod and Docker registry Pod are described [in this Gist](https://gist.github.com/leandronsp/0dd7a3a3600fe23ecac1d41157373b4f), so feel free to apply them in your cluster (don't forget to change the `image` node because it may differ).

After applying correctly, we may have the following output:
```bash
$ kubectl get pods

NAME                                         READY   STATUS             RESTARTS          AGE
registry-pod-cdd5859d4-v6lrh                 1/1     Running            15 (152m ago)     40h
chespirito-pod-7d6679476f-7txjf              1/1     Running            0               57m
```
---
## To the Pipeline
Now, time to change our pipeline so it basically should cover:

* fetch source
* build (run tests + build an image for release)
* deploy

### Fetch source Task
The `fetch-source` Task will keep intact, nothing to change here, just referencing to the task `git-clone` we imported from the Tekton Hub
```yaml
...
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
```
### Build task
The `build` Task should build an image, run tests at this image and then push such an image to the registry. Pipeline-wise, it should look in this way:
```yaml
...
  - name: build
    runAfter: ["fetch-source"]
    taskRef:
      name: build
    workspaces:
      - name: source
        workspace: shared-data
```
The Task itself consists of two steps:

* unit-tests
* release (push image to the registry)

```yaml
apiVersion: tekton.dev/v1beta1
kind: Task
metadata:
  name: build
spec:
  workspaces:
    - name: source
  stepTemplate:
    image: docker
    workingDir: $(workspaces.source.path)
    env:
      - name: DOCKER_HOST
        value: tcp://localhost:2376
      - name: DOCKER_TLS_VERIFY
        value: "1"
      - name: DOCKER_CERT_PATH
        value: "/certs/client"
    volumeMounts:
      - mountPath: /certs/client
        name: dind-certs
  steps:
    - name: unit-tests
      script: |
        export CI_IMAGE=colima:31320/chespirito:ci

        docker pull $CI_IMAGE || true
        docker build -t $CI_IMAGE .
        docker run --rm $CI_IMAGE bash -c "ruby -Itest test/all.rb"
        docker push $CI_IMAGE
    - name: release
      script: |
        export CI_IMAGE=colima:31320/chespirito:ci
        export RELEASE_IMAGE=colima:31320/chespirito

        docker pull $CI_IMAGE
        docker image tag $CI_IMAGE $RELEASE_IMAGE
        docker push $RELEASE_IMAGE
```
Note that:

* the `stepTemplate` block can be reused across different steps
* we're using the `colima:31320` host because it's the address of the **private-insecure registry** we installed previously [using this Gist](https://gist.github.com/leandronsp/0dd7a3a3600fe23ecac1d41157373b4f)

And last but not least, the `sidecar` playing the role of `docker-in-docker`:

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
        - --insecure-registry=colima:31320
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
  volumes:
    - name: dind-certs
      emptyDir: {}
```
It's quite similar to the sidecar we created in the last article, but this time we added the flag `--insecure-registry` to the command argument. Such flag is very important because **the daemon running in dind is not aware** of the Docker daemon that's running in the cluster itself (after all, it's _Docker in Docker_, remember?)

Moreover, `colima` refers to my hostname in the **colima VM**, as the port `31320` is needed because the Kubernetes service that is exposing the Registry Pod is a `NodePort` service, which means it should be accessible anywhere in the cluster or VM. _Be aware that this hostname may change in your case, get to know your cluster IP first and use it_.

## Run the Pipeline
Okay, time to run everything, but let's create a `PipelineRun` to test it:
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

![dash2](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/axbcqfouz666zhw4qouc.png)
:rocket: **So far, so good.**

But we're still only pushing the image to the registry. Let's go to the last task: **deploy**.

## The continuous delivery, or CD
As far as we can tell, **delivering applications** mean applying patches, updates in a sustainable way, that does not harm the process and ensures the deployment is reliable and secure.

At this moment, we're doing a small part of "CD", which is _pushing an image_ ready for release to some registry. We are yet to use this image to update our production environment, i.e **performing the rollout**.

## Using kubectl
Concerning the use of `kubectl`, we have to use some image from Docker Hub that already brings this tool, otherwise we would have to build an image on our own for that purpose. 

Luckily, the Tekton Hub provides a Task called [kubernetes-actions](https://hub.tekton.dev/tekton/task/kubernetes-actions), then all we have to do is install it and use it as we did in `git-clone`.
```bash
$ kubectl apply -f https://raw.githubusercontent.com/tektoncd/catalog/main/task/kubernetes-actions/0.2/kubernetes-actions.yaml
```
It provides an image and the steps needed to perform any **kubectl action**.

Going back to the pipeline, we have to add a Task to it, right after the `build` Task ref:
```yaml
...
  - name: deploy
    runAfter: ["build"]
    taskRef:
      name: kubernetes-actions
    params:
      - name: "script"
        value: |
          export RELEASE_IMAGE=colima:31320/chespirito

          kubectl set image deployment/chespirito-pod app=$RELEASE_IMAGE --record
          kubectl rollout status deployment/chespirito-pod --timeout 5m
```
* the `script` param is required by the Task in order to run an arbitrary script
* `kubectl set image` allows to **immediately** change image in a deployment pod, which will trigger a **rollout**
* `kubectl rollout status` watches for the deployment to rollout completely

## Run Pipeline, run!
We run the pipeline again, but it may fail because of permissions of the `default` ServiceAccount used by the `kubernetes-action` Task.

That said, we can configure the RBAC for this Task:
```yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: tekton-kubectl-service-account
---
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: tekton-kubectl-role
rules:
- apiGroups:
  - "*"
  resources:
  - pods
  - deployments
  - deployments/scale
  - deployments/status
  verbs:
  - get
  - list
  - watch
  - create
  - delete
  - patch
  - update
---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: tekton-kubectl-binding
subjects:
- kind: ServiceAccount
  name: tekton-kubectl-service-account
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: Role
  name: tekton-kubectl-role
```
The new ServiceAccount `tekton-kubectl-service-account` is allowed to only perform actions in pods and deployments.

Now, we should place the `serviceAccountName` in the `PipelineRun`:
```yaml
apiVersion: tekton.dev/v1beta1
kind: PipelineRun
metadata:
  generateName: chespirito-pipeline-
spec:
  #### Here! ####
  serviceAccountName: tekton-kubectl-service-account
...
```
Run that again and...**everything worked as expected!**

## Last things last
Of course, there's no CI/CD if we have to perform manual actions. Let's add the `serviceAccountName` to our current **Trigger Template** `github-pr-trigger-template` and open a PullRequest at the repository:
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
      generateName: chespirito-pipeline-
    spec:
      #### Here! ####
      serviceAccountName: tekton-kubectl-service-account
...
```
Open the PR and then... 💥

![wonderful](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/98wspclh0vhnonu2pxt3.png)

:rocket: **How amazing is that?** :beer:

---
## The final architecture
The idea behind this series is a new way to think testing, building and delivering cloud-native application.

Since we are in the "cloud-native" era, **running isolated containers** that do other jobs (i.e CI/CD) than the _business-only_ may be cheaper and efficient.

Take a look at how the architecture now looks way more simpler:

![architecture](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/pxgtietff76dk3n2quc8.png)

---
So far, we've seen the complete lifecycle of CI/CD, but we have more to come, for instance configuring a private Git repository (using SSH credentials as Kubernetes secrets) and using Tekton **ClusterInterceptors** to filter specific events and run different pipelines. 

Almost there, stay tuned! :rocket:

