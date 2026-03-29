---
title: "Prometheus on Kubernetes 101"
slug: "prometheus-on-kubernetes-101-296j"
published_at: "2022-07-06 04:31:45Z"
language: "pt-BR"
status: "published"
tags: ["prometheus", "kubernetes", "docker"]
---

[Prometheus](https://prometheus.io/docs/introduction/overview/) é um projeto open-source escrito em Go, criado em 2012 e utilizado para monitoramento e sistema de alerta de aplicações. 

Foi desenvolvido originalmente pela empresa SoundCloud, sendo mais tarde em 2016 admitido pela [CNCF](https://www.cncf.io/) e graduado, depois do Kubernetes, como o segundo projeto cloud-native. 

Ou seja, é um projeto amplamente utilizado e mantido pela comunidade e sua utilização contribui para se atingir [observabilidade](https://www.splunk.com/en_us/data-insider/what-is-observability.html) em aplicações.

## Arquitetura

Sua arquitetura consiste em buscar periodicamente via HTTP, métricas de dados a partir de _exporters ou jobs_, para então agregá-las e guardá-las em um [time-series database](https://en.wikipedia.org/wiki/Time_series_database) (TSDB). 

Com as métricas guardadas, Prometheus oferece uma linguagem própria para fazer queries (PromQL) no database e assim criar dashboards e alertas. 

![prometheus architecture](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/52qysuqu8eplwvimam2m.png)

## Let the games begin
Você pode instalar o Prometheus via binário, imagem Docker ou qualquer outra forma apropriada para teu caso de acordo com o site oficial. 

Mas para este artigo (e um futuro tutorial), vou configurá-lo dentro de um cluster Kubernetes, pois quero inclusive fazer o Prometheus monitorar as apps dentro do cluster e inclusive **monitorar o próprio cluster**. 

_Nota: vou assumir que você tem um cluster fresh de Kubernetes, pronto para receber recursos_.

## First things first
Como boa prática, criamos um namespace chamado `monitoring` onde vamos colocar todos os recursos do nosso tutorial:
```bash
$ kubectl create namespace monitoring

namespace/monitoring created
```

## Prometheus Pod
Vamos criar a pod através do deployment controller, que permite uma melhor gestão da pod. 
```bash
$ kubectl create deployment \
    prometheus-pod \
    --namespace=monitoring \
    --image=prom/prometheus \
    --replicas=1 \
    --port=9090 \
    --dry-run=client \
    --output=yaml > ./prometheus-pod.yml

$ kubectl apply -f ./prometheus-pod.yml

deployment.apps/prometheus-pod created
```
E _boom_! Já temos um Prometheus server prontinho para ser utilizado. 

## Visualizando métricas
Para visualizarmos métricas com PromQL, precisamos acessar o Prometheus via HTTP, que está sendo servido na porta `9090`. 

Mas como os containers no Kubernetes são _isolados_, para fins de teste vamos fazer **port-forward** (encaminhamento de porta) para nosso localhost e assim conseguimos visualizar como se tivesse no próprio OS host. 
```bash
$ kubectl -n monitoring port-forward deploy/prometheus-pod 9090:9090

Forwarding from 127.0.0.1:9090 -> 9090
Forwarding from [::1]:9090 -> 9090
```
![prometheus app](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/uvploj2tvigxrp52cur8.png)

Por padrão, Prometheus vem configurado para exportar suas próprias métricas, embora mais tarde vamos adicionar outros exporters para outras aplicações. 

Dentro do container, vamos verificar a configuração padrão:
```bash
$ cat /etc/prometheus/prometheus.yml

global:
  scrape_interval:     15s
  evaluation_interval: 15s

rule_files:
  # - "first.rules"
  # - "second.rules"

scrape_configs:
  - job_name: prometheus
    static_configs:
      - targets: ['localhost:9090']
```
* `global`: configuração global para todos os jobs/exporters
* `scrape_interval`: frequência de scraping
* `rule_files`: utilizado principalmente para alertas, vamos ignorar por agora
* `scrape_configs`: onde ficam os endpoints para monitoramento

Neste caso, o Prometheus define um job chamado `prometheus` que busca métricas no endpoint `localhost:9090`, que é onde **o próprio Prometheus está sendo servido**. Ou seja, Prometheus monitora a si mesmo :)

Com isso, o Prometheus busca no endpoint um path chamado `/metrics`. Vamos então verificar:
```bash
$ open http://localhost:9090/metrics

...
...
# TYPE promhttp_metric_handler_requests_total counter
promhttp_metric_handler_requests_total{code="200"} 14
promhttp_metric_handler_requests_total{code="500"} 0
promhttp_metric_handler_requests_total{code="503"} 0
```
Importante notar a métrica `promhttp_metric_handler_requests_total`, que com label `200` tem 14 requests. Ou seja, neste momento, eu fiz 14 requests à este endpoint de métricas. Caso eu continue fazendo pedidos ao endpoint, este valor será incrementado. 

Vamos analisar esta métrica no dashboard do Prometheus, em `http://localhost:9090/graph` na tab "Table":
```bash
promhttp_metric_handler_requests_total
```
![prom table](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/wngg4qtytv1sfyoa0ayq.png)

Cool, uh?

Para ficar ainda melhor, vamos analisar a _taxa_ de HTTP requests a este endpoint **ao longo de um determinado tempo**, afinal, é para isto que serve um time-series database.

Na tab "Graph", passamos a métrica para uma função chamada `rate` que irá calcular a taxa de requests que retornaram `200` ao longo de 1 minuto:
```bash
rate(promhttp_metric_handler_requests_total{code="200"}[1m])
```
![prom graph](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/ezowtixqrw86bjgliu70.png)

Podemos notar que o gráfico mostra a taxa aumentando em determinado horário e depois caindo, refletindo quando eu passei a fazer menos requests enquanto escrevia este artigo :P

## Conclusão
Para não ficar muito extenso, vou deixar este artigo como sendo apenas uma introdução amigável ao Prometheus, pois muito do que descrevi aqui está no [first steps](https://prometheus.io/docs/introduction/first_steps/) do site oficial. 

Nos próximos artigos irei explorar ainda mais esta ferramenta, diferentes métricas, exporters e também uma dashboard completa com Grafana. 

Todo o código aqui escrito será compartilhado [neste reposiório](https://github.com/leandronsp/monitoring-101).

Stay tuned!



