---
title: "CI/CD in a nutshell"
slug: "cicd-in-a-nutshell-3k6a"
published_at: "2023-02-19 02:44:42Z"
language: "en"
status: "published"
tags: ["ci", "cd", "software", "engineering"]
---

CI/CD is a popular practice that many companies and projects use today. However, sometimes we use these terms mistakenly, but in this article we'll dive into the CI/CD fundamentals, understanding the problem that these practices solve as well as analysing how they fit in today's cloud architecture.

---

## :fire: Merge hell

In the early days of software development, developers used to merge their work with less frequency. _It was a manual job_, so once a month usually, developers would sit together to **merge everything** they worked during the month. 

Resolving conflicts was a _real pain_, not to mention performing tests against a ton of built features. Moreover, deploys and rollbacks used to come with a hell of problems, that's why they call this process **the merge hell**.

## :pray: A new hope

New ideas arose to overcome this problem. Instead of merging work once a month or even worse, developers should merge work _more frequently_, almost daily, why not **multiple times a day**.

The work is merged in the main branch as soon as possible, and upon such a merge, we should ensure the **integrated** source code has **quality, security and correctness.** 

These traits are performed using code style checker (linter), security checks and a good automated test suite. 

This process has a name and it is called [continuous integration](https://martinfowler.com/articles/continuousIntegration.html), or **CI**.

### How can we run a CI process?

Because we work on teams with multiple people sharing a remote Git repository (i.e Github), we can run our CI wherever we want. 

_Could be our computer?_ Yes. 

![Local CI](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/je8yypahh3gg4lyduq5k.png)

In the above picture, we see a CI scenario where we pull the code from a remote repository (integration sync, fetch + merge) and then we perform the needed checks on our own computer.

_But we better run it in the cloud, right?_

## :cloud: Running CI in the cloud

The process of running CI in the Cloud could be implemented as follows:

- **Code integration**: the code repository runs in the cloud using some version control system (Git), for instance Github, Gitlab, etc.

- **Code quality, security and correctness**: at every change, before going to the _main_ branch, **some computer or VM in the cloud** should checkout the code from the repository and perform style/security checks and perform automated tests.

Many companies created CI tools in the cloud so we can use them to run our CI system. Big players specially **Github** and **Gitlab** employ their own CI tools along with code repository (Git) in the cloud.


![Github Actions](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/a8czygi5qn9ar7dozxei.png)

But there are other tools in the cloud such as **CircleCI**, **SemaphoreCI** to name a few, that employ only the CI tooling.

![CircleCI](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/dypibtfnmgnhn8mpk7i1.png)

All these tools are paid somehow, we can use them for free but in case we increase the usage, they can be expensive eventually.

## :rocket: Delivering the application

Okay, it's all good with the "continous integration" part. We have a good CI system in the cloud and we might pay for it as we increase the usage.

_But how do we deliver the application?_

Assuming all the CI checks have been **finished sucessfully**, we can **build/package** our application in a newly generated version and **deliver** it to production, changing the old application to the new one, right?

First, let's say we build the application using our own machine:

![Build locally](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/xncg0sa6t9r69hf0psrj.png)

After building, we should send (push) the package to some sort of "package registry" in the cloud, from which the infrastructure in production will fetch (pull) the new package and "roll out" from the old package to the new one. 

This process of updating the application in production is called **deployment**, and all the process of building/packaging and ensuring the newly version is deployed in production in a sustainable way is called [continuous delivery](https://continuousdelivery.com/), or simply **CD**.

How about offloading the CD process to the cloud, same as we do in CI?


![CD Cloud](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/xzy1qou5mdisiquokcyn.png)

This picture is very common nowadays, many projects are integrated and delivered using the architecture above. Tools such as Github and Gitlab play an important role employing CI/CD for startups and enterprises.

## :heart: Community matters
The process of integrating and delivering an application is so common that many people and companies across the world joined together and created a non-profit open-source community called [Continuous Delivery Foundation](https://cd.foundation/), or **CDF**, that aims for incubating and graduating open-source projects that employ CI/CD systems in a sustainable way.

This community is driven by the same values of other communities namely Linux Foundation, Apache Foundation, [Cloud Native Computing Foundation](https://www.cncf.io/) (CNCF) etc.

---
I hope you enjoyed the reading. In the upcoming posts, I'll be talking about [Tekton CI/CD](https://tekton.dev/), which is a **graduated CDF project**, and how this open-source tool helps delivering cloud-native applications in the cloud.
