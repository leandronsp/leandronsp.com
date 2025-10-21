---
title: "Construindo um web server em Assembly x86, parte I, introdução"
slug: "construindo-um-web-server-em-assembly-x86-parte-i-introducao-14p5"
published_at: "2024-04-09 03:51:43Z"
language: "pt-BR"
status: "published"
tags: ["assembly", "braziliandevs"]
---

_Assembly_. 

Para alguns, um monstrinho. Pra outros, algo antiquado. Mas pra quem tem curiosidade em entender como as coisas funcionam, **oportunidade**.

Nesta saga que será uma série de artigos, vamos explorar Assembly com NASM para arquitetura *x86-64* em GNU/Linux enquanto desenvolvemos um web server multi-thread bastante simples.

O intuito não está nas capacidades do web server em si, pois este irá apenas responder uma mensagem "Hello, world" em formato HTML, mas sim nos conceitos utilizados para construi-lo.

Para quem não tem muita familiaridade com conceitos de mais baixo-nível em computação e concorrência, não se preocupe, pois queremos com este guia fazer com que temas que são vistos como "complexos" possam ser absorvidos com mais facilidade a quem tem curiosidade, podendo então causar aquela boa impressão no churrasco de domingo ou no jantar de Natal.

> To brincando gente, tá proibido falar de Assembly nestas ocasiões, por favor não façam isso eu imploro

---

## Conteúdo proposto
Ao longo dos artigos vamos passar por diversos conceitos de computação, sendo alguns de forma superficial e outros com um pouco mais de profundidade, podendo mencionar alguns:

* Arquitetura de computadores
* Tipos de arquiteturas
* Padrões, sistema binário e hexadecimal
* Básicos de Assembly x86-64
* Debugging com GDB
* Filesystem, Sockets
* Threads, pool e alocação de memória
* Arrays, filas, ponteiros
* Concorrência e primitivos de sincronização como spinlocks e futex
* Tag `h1` do HTML (LOL)

Poderá haver mais conceitos a serem abordados, mas que serão mapeados e detalhados conforme necessidade.

---

## É um tutorial de Assembly?
Definitivamente, não. 

A ideia aqui é desenvolver de forma prática um servidor web enquanto passamos por conceitos de Assembly e não só, mas também outros temas importantes sobre concorrência.

Se quer fazer um tutorial rápido para se familiarizar com Assembly x86, há [este do tutorials point](https://www.tutorialspoint.com/assembly_programming/index.htm), mas atenção que ele é para 32-bits, sendo que nosso guia será feito em 64-bits (uma vez entendido os conceitos, fica fácil transportar).

---

## É um curso de Assembly?
_Hell no_.

Obviamente, vamos aprender diversos conceitos à medida que avançamos na saga, mas se você tem algum interesse em aprender fundamentos de Assembly de forma bastante didática, sugiro acompanhar a playlist de [Fundamentos de Assembly x86-64](https://www.youtube.com/live/Ej6U-qk0bdE?feature=shared) do Blau Araújo. Ele é referência no assunto em conteúdo pt-BR e já cortou muito mato neste assunto.

---

## Requisitos de ambiente
É esperado que o código seja executado em um sistema UNIX-based, preferencialmente GNU/Linux x86_64 que é onde testamos o código proposto. 

* Sistema Operacional Ubuntu 22.04.4 LTS (GNU/Linux 6.5.0-17-generic x86_64)
* NASM 2.16.01
* GNU ld 2.38 (binutils)

E para debugging (claro, nesta casa fazemos debugging, não somos brincalhões):
* GNU gdb 12.1
* strace 5.16

Para outros ambientes, pode-se optar por rodar o código dentro de um container Docker, seguindo as versões acima apresentadas. 

Exemplo de **Dockerfile** (validar isto plmdds):

```bash
FROM ubuntu
RUN apt-get update && apt-get -y install make binutils gdb build-essential wget strace
WORKDIR /app
RUN wget https://www.nasm.us/pub/nasm/releasebuilds/2.16.01/nasm-2.16.01.tar.gz -O nasm.tar.gz && tar -xzvf nasm.tar.gz && cd nasm-2.16.01 && ./configure && make && make install
```

---

## Será que consigo acompanhar?
Você pode apenas ler e tentar entender os conceitos, ou então ser mais hands-on e escrever código à medida que avança nos artigos. 

Recomendo fortemente que experimente o código e rode em seu próprio computador seguindo os requisitos de ambiente, seja em host, virtualizado ou containerizado.

O repositório com o código completo pode ser encontrado em [leandronsp/magali](https://github.com/leandronsp/magali).

---

Este artigo é o primeiro de uma série que vamos explorar sobre Assembly x86-64 enquanto desenvolvemos um web server do zero, sem enrolação e com muita mão na massa.

No próximo artigo já iremos começar com introdução a arquiteturas de computadores e o básico necessário com as terminologias e um pouco de história dos computadores, padrões e linguagens Assembly.

Stay tuned!
