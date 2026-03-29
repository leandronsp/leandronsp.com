---
title: "Deploy to Kubernetes using Github Actions (including Slack notification)"
slug: "deploy-to-kubernetes-using-github-actions-including-slack-notification"
published_at: "2021-04-14 23:48:05Z"
language: "en"
status: "published"
tags: ["github", "aws", "eks", "kubernetes"]
---

In this guide we'll cover the full cycle of deploying to Kubernetes using [Github Actions](https://github.com/features/actions). Batteries included:

- Kubernetes cluster running in [AWS EKS](https://docs.aws.amazon.com/eks/latest/userguide/what-is-eks.html)
- Docker images stored in [AWS ECR](https://aws.amazon.com/ecr/)
- **Bonus:** notification to _Slack_

The Github workflow will be triggered at _every commit on pull request_, and its steps are described as follows:

- git checkout
- login to AWS ECR (credentials needed)
- build Docker image
- push Docker image to ECR
- deploy to EKS using `kubectl`
- send notification to Slack (needs webhook URL)

## Github Action
Let's place our file under `.github/workflows/release.yml`. Then, we start by configuring the workflow trigger:
```yaml
name: Release

on:
  pull_request:
    branches: [main]
```
Such trigger will run right after we open and at every commit on the pull request.

Next, we define the env variables that will be used across steps:
```yaml
env:
  RELEASE_REVISION: "pr-${{ github.event.pull_request.number }}-${{ github.event.pull_request.head.sha }}"
  AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
  AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
  AWS_REGION: ${{ secrets.AWS_REGION }}
  KUBE_CONFIG_DATA: ${{ secrets.KUBE_CONFIG_DATA }}
  KUBE_NAMESPACE: production
  ECR_REPOSITORY: my-cool-application
  SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
```
Env explained:
- `RELEASE_REVISION`: the tag that we'll use on the Docker image
- `AWS_ACCESS_KEY_ID | AWS_SECRET_ACCESS_KEY`: used in [configure aws credentials action](https://github.com/aws-actions/configure-aws-credentials)
- `KUBE_CONFIG_DATA`: used in [kubectl aws eks action](https://github.com/kodermax/kubectl-aws-eks)
- `ECR_REPOSITORY`: used in [aws ecr action](https://github.com/aws-actions/amazon-ecr-login)
- `SLACK_WEBHOOK_URL`: used in [slack notification action](https://github.com/rtCamp/action-slack-notify)

Now, let's start writing the job, after which we'll declare the steps:
```yaml
jobs:                                            
  release:                                       
    name: Release                                
    runs-on: ubuntu-latest                       
    steps:                                       
     ... [steps be at this level]
```  
#### Step - Cancel Previous Runs
This step instructs Github to cancel any current run for this job on this very repository.   
```yaml
- name: Cancel Previous Runs               
  uses: styfle/cancel-workflow-action@0.4.1
  with:                                    
    access_token: ${{ github.token }}      
```
#### Step - Checkout
Performs the git checkout at this specific commit.
```yaml
- name: Checkout                                  
  uses: actions/checkout@v2                       
  with:                                           
    ref: ${{ github.event.pull_request.head.sha }}
```
#### Step - Configure AWS credentials
This steps uses the AWS credentials defined in the `env` section.
```yaml
- name: Configure AWS credentials                          
  uses: aws-actions/configure-aws-credentials@v1           
  with:                                                    
    aws-access-key-id: ${{ env.AWS_ACCESS_KEY_ID }}        
    aws-secret-access-key: ${{ env.AWS_SECRET_ACCESS_KEY }}
    aws-region: ${{ env.AWS_REGION }}
```
#### Step - Login to AWS ECR
Performs the login to AWS ECR, using the AWS credentials configured in the previous step.
```yaml
- name: Login to Amazon ECR            
  id: login-ecr                        
  uses: aws-actions/amazon-ecr-login@v1
```
#### Step - Setup Docker buildx cache
These two steps are very important for the performance of building image. A few key notes:
- Github Actions, like every CI runner in the cloud, is _ephemeral_, which means a new instance is virtualized every time we perform a new workflow job
- Due to this ephemerality, we cannot rely on the native Docker layer caching

The above constraints would make our build time very slow, since every layer in **Dockerfile** will be evaluated across builds.

But thanks to this [action](https://github.com/docker/setup-buildx-action), we can make use of the [buildkit CLI](https://github.com/moby/buildkit) to cache Docker layers. Then, in combination with [native Github actions cache](https://github.com/actions/cache), we can rely on this cache strategy, thus optimizing build time.
```yaml
- name: Set up Docker Buildx                             
  id: buildx                                             
  uses: docker/setup-buildx-action@master                
- name: Docker cache layers                              
  uses: actions/cache@v2                                 
  with:                                                  
    path: /tmp/.buildx-cache                             
    key: ${{ runner.os }}-single-buildx-${{ github.sha }}
    restore-keys: |                                      
      ${{ runner.os }}-single-buildx                     
```
#### Step - Build & Push the image to the registry
This step covers building the Docker image with `buildx` to optimize build time, and pushing it to AWS ECR, which was previously configured in "Login to Amazon ECR". 

The example assumes we have a target named "release" in the Dockerfile.
```yaml
- name: Build & Push Image                                                                                      
  env:                                                                                                          
    ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}                                                       
    RELEASE_IMAGE: ${{ steps.login-ecr.outputs.registry }}/${{ env.ECR_REPOSITORY }}:${{ env.RELEASE_REVISION }}
  run: |
    docker buildx create --use

    docker buildx build \                                
      --cache-from=type=local,src=/tmp/.buildx-cache \   
      --cache-to=type=local,dest=/tmp/.buildx-cache-new \
      --tag ${{ env.RELEASE_IMAGE }} \                           
      --target release \                                 
      --push \                                           
      .                                                  
    
    rm -rf /tmp/.buildx-cache
    mv /tmp/.buildx-cache-new /tmp/.buildx-cache
```
Step explained:

- `docker buildx create --use`: creates a new build context for buildx and sets it as the current context
- `docker buildx build ...`: builds the image using the cache configured/restored in the previous steps "Docker cache layers". After build, it uploads the image to the pre-configured registry using the `--push` option
- `rm | mv ...`: we have to renew the cache at every run, otherwise we may reach the 5GB limit of storage on Githb Actions

#### Step - Deploy to Kubernetes cluster
Once we have the image uploaded to the registry, we can send a command to kubernetes to perform the deploy.
```yaml
- name: Deploy to Kubernetes cluster                                                                            
  uses: kodermax/kubectl-aws-eks@master                                                                         
  env:                                                                                                          
    RELEASE_IMAGE: ${{ steps.login-ecr.outputs.registry }}/${{ env.ECR_REPOSITORY }}:${{ env.RELEASE_REVISION }}
  with:                                                                                                         
    args: set image deployment/my-pod app=${{ env.RELEASE_IMAGE }} --record -n $KUBE_NAMESPACE   
```
Here we are using `kubectl set image` but it could be `kubectl rollout` or any other command, as needed.

Additionally, we can include a step to check the deployment:
```yaml
- name: Verify Kubernetes deployment                               
  uses: kodermax/kubectl-aws-eks@master                            
  with:                                                            
    args: rollout status deploy my-pod -n $KUBE_NAMESPACE 
```
#### Step - Slack notification
After a succeeded deployment, we can use [this action](https://github.com/rtCamp/action-slack-notify) to send a notification to Slack. 
```yaml
- name: Slack notification                                
  uses: rtCamp/action-slack-notify@master                 
  env:                                                    
    SLACK_CHANNEL: my_cool_channel                   
    SLACK_MESSAGE: 'Just deployed our cool application!'
    SLACK_TITLE: 'Deploy'                         
    SLACK_USERNAME: 'Some Bot'                           
    SLACK_ICON: "[icon URL]"
    SLACK_COLOR: '#228B22'                                
    SLACK_WEBHOOK: ${{ secrets.SLACK_WEBHOOK_URL }}       
    MSG_MINIMAL: true  
```           
## Wrapping up
In this guide we configured the full cycle of building a Docker image, uploading it to a registry, performing the deployment to Kubernetes and sending a notification to Slack.

In the upcoming posts we'll see how to optimize build time of dependencies' installation inside the Docker image (a.k.a `bundle install` for Ruby developers), using a cache strategy that relies on AWS S3. 
