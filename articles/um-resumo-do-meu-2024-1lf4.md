---
title: "Um resumo do meu 2024"
slug: "um-resumo-do-meu-2024-1lf4"
published_at: "2025-10-18 20:05:17Z"
language: "pt-BR"
status: "published"
tags: ["braziliandevs"]
---

31 de Dezembro de 2024.

Sentado no sofá e assistindo Frozen, tive a ideia de escrever sobre minha retrospectiva deste ano. Nunca fiz isso antes, então bora lá, porque acho que foi muita coisa.

---

## Mas antes, um aftermath de 2023

2023 foi um ano bastante agitado pra mim. Passei por uma [tireoidectomia](https://pt.wikipedia.org/wiki/Tiroidectomia) (mas estou bem, obrigado) e também foi o ano em que resolvi fazer "learn in public" e deixar tudo gravado no [meu canal do Youtube](https://www.youtube.com/@leandronsp). 

Iniciei cobrindo a rinha de compiladores, onde submeti [uma versão em Ruby](https://github.com/leandronsp/patropi), e depois fui trazendo [conteúdo para iniciantes](https://www.youtube.com/watch?v=6VSgMbFNUuQ) em Rust. 
Teve também transmissão ao vivo criando uma [Rede Neural Artificial em Ruby](https://www.youtube.com/watch?v=4jY_Vwnm-es), então vi que eu realmente estava gostando de compartilhar minha jornada _coding in public_.

Na parte de artigos, [escrevi muita coisa](https://dev.to/leandronsp) em 2023:

* Introdução ao [Tekton CI/CD](https://leandronsp.com/articles/tekton-ci-part-i-a-gentle-introduction-ilj)
* [Kubernetes 101](https://leandronsp.com/articles/kubernetes-101-part-i-the-fundamentals-23a1)
* Um guia completo cobrindo [os fundamentos de Git](https://leandronsp.com/articles/git-fundamentals-a-complete-guide-do7)
* Criando [redes neurais em Ruby](https://leandronsp.com/articles/ai-ruby-an-introduction-to-neural-networks-23f3)
* Teve até artigo sobre [ponto flutuante](https://leandronsp.com/articles/vencendo-os-numeros-de-ponto-flutuante-um-guia-de-sobrevivencia-4n7n)
* [Fundamentos de recursão](https://leandronsp.com/articles/entendendo-fundamentos-de-recursao-2ap4)
* [Resumo da rinha de compiladores](https://leandronsp.com/articles/compiladores-trampolim-deque-e-thread-pool-dd1) e trampolim
* [Mais Rust](https://leandronsp.com/articles/understanding-the-basics-of-smart-pointers-in-rust-3dff)

E o famoso [Guia Web 101](https://web101.leandronsp.com/) também.

> Mentira, esse guia web foi em 2021, mas eu quis colocar ele aqui só pra fazer propaganda mesmo

---

## As metas para 2024
No fim de 2023 estabeleci algumas metas pra 2024 nessa parte de criação de conteúdo. Mas não foram metas muito arrojadas pois eu queria dar uma desaquecida do que foi o agitado 2023.

Dentre as metas estava continuar explorando Rust; escrever um **guia completo de concorrência**; criar um interpretador em Ruby; fazer lives com Kubernetes; falar sobre tédio e; Awk.

> Sim, Awk

Podemos confirmar isto em meio a tantos rascunhos que tenho nesta plataforma:

![Image description](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/34ejih5wbhkmueyxz0qk.png)

---

## E chegou 2024
Comecei o ano de 2024 focado em me aprofundar em Rust, tanto que em Janeiro até cheguei a criar o [crust](https://github.com/leandronsp/crust) (outro CRUD, mas desta vez em Rust) e o [aspirina](https://github.com/leandronsp/aspirina) (outra rede neural, mas desta vez em Rust) durante algumas lives. Queria também iniciar meus estudos em Rust na parte de I/O assíncrono. Era esse o plano.

_Era_.

### A Rinha de Backend, 2ª edição

Mas aí veio a rinha de backend do Zan pra tirar meu foco e resolvi fazer lives compartilhando minha solução submetida, que inicialmente seria em Ruby, com o [agostinho](https://github.com/leandronsp/agostinho).

[Ledo](https://www.youtube.com/watch?v=VR4mF9TMPws) [engano](https://www.youtube.com/watch?v=5nDfz1dkX2o). Acabei por submeter 5 diferentes soluções:

* 3 em Ruby: [agostinho](https://github.com/leandronsp/agostinho), que usa meus micro frameworks favoritos Adelnor e Chespirito; [tortuga](https://github.com/leandronsp/tortuga) que não usa framework nem biblioteca alguma, o puro suco de uma linguagem criada no Japão; e [tonico](https://github.com/leandronsp/tonico), uma versão sem frameworks que usa I/O assíncrono _all the way down_
* 1 em Rust: [quokka](https://github.com/leandronsp/quokka), criado durante uma live
* e claro, a famosa versão em Bash, [canabrava](https://github.com/leandronsp/canabrava)

Foram muitas horas em lives, inclusive esta onde eu mostrava como criar uma [thread pool e connection pool em Rust](https://www.youtube.com/watch?v=lD3gaazwptk).

> Nossa Leandro, como você arranja tempo pra fazer lives? Eu não consigo ter tempo pra isso

Isso é problema seu, e não meu.

### Um leve sopro do Gleam e o grande tutorial de Assembly

No início do ano notei um pequeno hype em cima do **Gleam**. Decidi [explorar em live](https://www.youtube.com/watch?v=0XTtAra0l8Q). Até que gostei da linguagem, e estava determinado a continuar estudando.

Mas aí minha amiga e meu amigo, algumas pessoas do trabalho começaram a me provocar. Ficavam colocando **Assembly** na minha frente. Foi quando numa 6a feira sem pretensão, no Discord, eu e mais alguns colegas fizemos um [tutorial rápido](https://www.tutorialspoint.com/assembly_programming/index.htm) de Assembly x86. 

Foi quando pensei "ta aí, vou aprender esse negócio e criar um web server multi-threaded simples em Assembly, compartilhando a jornada tanto em artigos quanto em lives".

### A saga do Assembly x86

Fiz várias lives pela manhã (que eu chamava de lives matinais, duh), mostrando o desenvolvimento do web server e minha saga de aprendizado. Foi incrível, pude ter contato com pessoas como o [Blau Araújo](https://www.youtube.com/@debxp) que é referência em conteúdo pt-BR em Assembly e outras coisas de baixo nível. 

Tem um vídeo no meu canal, que é a minha "sincera" reação quando o server finalmente funcionou devolvendo a primeira resposta HTTP, [ao vivo em live](https://www.youtube.com/watch?v=un-7IGJiXeo). 

Não obstante, resolvi também [escrever artigos em live](https://www.youtube.com/watch?v=bMGrJU1eRXU). Me diga, quem em sã consciência acompanha alguém escrevendo um artigo em live durante umas 4 ou 5 horas?

> Não sei quem é mais maluco

Brincadeiras a parte, e ideia é mesmo compartilhar o processo. É sobre o _modus operandi_, a forma como eu quebro o raciocínio em partes na hora de escrever. E também o que me inspira.

No mundo dos artigos, eu [comecei em Abril](https://leandronsp.com/articles/construindo-um-web-server-em-assembly-x86-parte-i-introducao-14p5) a saga "Escrevendo um Web server em Assembly x86". Foram um total de 6 artigos, onde no final conseguimos implementar um web server simples, porém multi-threaded em Assembly. Foram 3 meses escrevendo, fazendo lives e [muitos conceitos abordados](https://github.com/leandronsp/monica), muita coisa mesmo.

Aproveitei também para escrever sobre [Arrays em Assembly x86](https://leandronsp.com/articles/arrays-em-assembly-x86-55hb).

Esta saga foi muito enriquecedora pra mim. Pude aprender e firmar muitos conceitos. Vale muito a pena aprender Assembly e coisas de baixo nível.

### Enfim o "Guia de Concorrência 101"

Quando finalizei a saga de Assembly, resolvi voltar para uma das coisas que eu tinha como meta para 2024: escrever sobre **concorrência**. Este é um tema que estudo há mais de 5 anos quase que diariamente, experimentando e validando conceitos.

Foi então que bem agora, agorinha mesmo (risos) no final de Novembro que comecei a escrever o [guia de concorrência](https://concorrencia101.leandronsp.com/) (pt-BR). Por enquanto já abordei conceitos de concorrência no sistema operacional e como a linguagem C implementa as principais primitivas de concorrência. Mas o intuito é cobrir com mais linguagens de programação: Ruby, Python, PHP, NodeJS, Go, Rust, Elixir, Java, Kotlin e mais o que vier à cabeça.

Com uma brincadeira no bluesky, o [Rodolfo de Nadai](https://bsky.app/profile/rdenadai.com.br) (meu primeiro investidor) deu uma ideia de eu lançar um "buy me a coffee" neste guia. Lancei e gostei da ideia, tanto que no momento são [23 apoiadores](https://concorrencia101.leandronsp.com/agradecimentos) do projeto. Apesar de que faço de forma genuína sem interesse financeiro, pois defendo muito o conhecimento livre, este apoio da galera tem sido crucial para que eu continuasse, desde o apoio com Pix, revisão ou mesmo compartlihamento do conteúdo.

Gratidão a todos vocês que fazem isto acontecer ❤

### Misc

Outras coisas que explorei ao longo deste ano, enquanto ia focando nas coisas de Assembly e concorrência:

* [leandronsp/necelu](https://github.com/leandronsp/necelu), brincando com Lucene em Java (relembrando _the good old days_)
* [open telemetry](https://github.com/leandronsp/otel-rails): OTel é um assunto bem interessante, onde quero me aprofundar em 2025
* [leandronsp/yacs](https://github.com/leandronsp/yacs), Yet Another City Search, uma busca textual ultra-rápida em PostgreSQL em mais de 12 milhões de geonames/cidades

---

## O que esperar pra 2025

Para 2025, espero mergulhar mais fundo em Rust, explorar OpenTelemetry e, quem sabe, encarar outra linguagem inusitada. 

Afinal, aprender nunca é demais. 🚀

**Feliz 2025 a todes <3**
