---
title: "Rust, Go, Rinha e I/O"
slug: "rust-go-rinha-e-io-39o2"
published_at: "2023-09-08 03:25:48Z"
language: "pt-BR"
status: "published"
tags: ["braziliandevs", "rust", "ruby", "go"]
---

Este artigo é o início de um formato diferente de conteúdo que quero experimentar, um apanhado (ou resumão, ou dump, como queiram chamar) de coisas que tenho visto nos últimos dias, com uma pegada informal e um leve toque de didática como de costume.

---

## Rust, Go e background jobs
Em 2022 eu estava aprendendo Rust.

Numa bela 4a feira de chuva, fiz um tweet dizendo que iria tentar implementar uma lista duplamente ligada em Rust. Minutos depois, fiz [outro tweet](https://twitter.com/leandronsp/status/1578154810612027392?s=20) dizendo que iria desistir e ver Netflix.

Então desisti do Rust.

Recentemente em 2023 comecei uma saga para aprender Golang. Como a sintaxe me incomodou um pouco, talvez pela verbosidade dos `if err != nil` a dar com telha, decidi continuar kkk

Mas adicionando uma complexidade nisto tudo: voltar a aprender Rust junto com Go. 

> As vezes eu meto dessas, em 2015/16 decidi aprender Elixir e redes neurais artificiais tudo junto, e saiu o [morphine](https://github.com/leandronsp/morphine)

Nesta segunda tentativa com Rust, bateu um sentimento, confesso. _Sentimento bom_, no caso.

Com isto, passei a praticar em Rust e Go (e porque não Ruby) estruturas de dados simples que já estou habituado a implementar (pq pratico muito): filas, pilhas, listas ligadas, mutexes etc etc. E claro, programação em sockets como de praxe.

Desta massarocada toda saiu [um UNIX server](https://gist.github.com/leandronsp/31ad977cf1a68f5d7b3d13d46ab34a8c) em Go, [outro](https://gist.github.com/leandronsp/b72b2b21d2ef8f8f3ccb2ab8af422c2b) em Rust, pelo que indo de milho em milho, saiu um background job em [ambas](https://gist.github.com/leandronsp/c0a7daaa27f75dd65d9fa803db8489ad) distintas [linguagens](https://gist.github.com/leandronsp/90f0e97ef28586c5c996835b311f9ac5).

Cheguei a um [background job em Rust](https://gist.github.com/leandronsp/90f0e97ef28586c5c996835b311f9ac5) muito overkill, vale a pena dar uma olhada, lá abordo lista duplamente ligada, fila duplamente terminada, rpoplpush, blocking queue, DLQ, retries, threads etc.

Tudo isso implementado com os smart pointers em Rust, para resolver problemas inerentes (ok, não são bem problemas) a ownership e borrow checker.

> Em breve vou escrever sobre meu aprendizado em Rust com artigos mais detalhados, preciso arrumar um tempo na minha vida, salvar pinguins na Antártida é mais urgente que isso

Mas se você acha que é  ̶m̶u̶i̶t̶o̶ ̶m̶a̶i̶s̶ ̶e̶l̶e̶g̶a̶n̶t̶e̶ mais fácil ver um código Ruby, [aqui neste arquivo](https://github.com/leandronsp/fun/blob/master/dsa/queues/ruby/background_job.rb) no meu projeto [leandronsp/fun](https://github.com/leandronsp/fun) também abordo um background job em Ruby com os mesmos conceitos aplicados ali em Rust e Go.

---

## Rinha de backend
Entre Julho e Agosto aconteceu na famosa #bolhaDev no Twitter uma competição chamada [rinha de backend](https://github.com/zanfranceschi/rinha-de-backend-2023-q3), criada pelo [Zan do Twitter](https://twitter.com/zanfranceschi) e nosso arauto do sarcasmo [Will Correa](https://twitter.com/wilcorrea). 

A ideia era que as pessoas participantes trouxessem a implementação de uma API definida nas regras da competição.

O desafio tinha como requisito uma arquitetura composta por basicamente **um NGINX** fazendo load balancing para **2 API's** mandando dados para **um banco de dados**, tudo rodando em containers.

> Se você quer saber mais sobre containers e Docker, dê uma olhadinha [nesta série de artigos](https://leandronsp.com/articles/kubernetes-101-part-i-the-fundamentals-23a1) que escrevi centuries ago

Pra deixar mais desafiador ainda, havia uma restrição obrigatória de recursos onde o total de containers não podia exceder o limite de 1.5 CPU's e 3GB de memória. 

Em uma data previamente estipulada, todas as submissões seriam submetidas a test de stress (violento, diga-se de passagem) através de uma ferramenta chamada [Gatling](https://gatling.io/docs/gatling/tutorials/installation/).

Foi uma iniciativa muito bacana pois trouxe à luz pessoas que pouco interagiam por ali e que eram muito talentosas. Deu pra aprender e trocar muita figurinha durante os dias pré-submissão.

Outra coisa boa foi que o [polvo lá do Twitter](https://twitter.com/coproduto) organizou um [encontro presencial](https://www.meetup.com/import-beer/events/295288014/) que iria transmitir a live da rinha, onde deu pra conhecer mais pessoas interessadas no tema.

### Plain Ruby, Chespirito e Roda
Decidi participar submetendo uma versão em Ruby (sem Rails) tentando colocar em prova um web framework muito simples que criei chamado [Chespirito](https://github.com/leandronsp/chespirito).

Infelizmente, durante os testes no meu ambiente local não consegui grandes números com o Chespirito e acabei indo de [Roda](https://github.com/jeremyevans/roda), que por acaso é o pior framework que já vi, pois sou muito hater de DSL's em situações onde não precisamos delas.

Um exemplo da tamanha verbosidade que atingimos com este framework:
```ruby
r.get do              # GET
  r.on "a" do         # GET /a branch
    r.on "b" do       # GET /a/b branch
      r.is "c" do end # GET /a/b/c request
      r.is "d" do end # GET /a/b/d request
    end
  end
end

r.post do             # POST
  r.on "a" do         # POST /a branch
    r.on "b" do       # POST /a/b branch
      r.is "c" do end # POST /a/b/c request
      r.is "e" do end # POST /a/b/e request
    end
  end
end
```

> Escolhi Roda pq me disseram que era rápido. Não comparei com Sinatra, apenas confiei

Submeti então minha versão naquela terça-feira sombria às 22h42 com Roda e [Puma](https://github.com/puma/puma), pois meu ambiente não me ajudou a tirar bons números com I/O assíncrono no [Falcon](https://github.com/socketry/falcon).

> Logo mais chegamos no ponto do meu ambiente 

Portanto, minha submissão ficou assim:

- Multi-threading com Puma, com uma modesta pool de threads 0:5, que é o default no Puma, e sem CPU workers
- [Pool](https://github.com/mperham/connection_pool) de 5 conexões com o PostgreSQL
- PostgreSQL nos defaults (100 max_connections)
- NGINX nos defaults com um ligeiro aumento para 1024 worker_connections

No docker-compose submetido, dividi os recursos da seguinte forma:

- 0.4 CPU | 1GB mem para as API's (x2)
- 0.6 CPU | 0.8GB mem para o PostgreSQL
- 0.1 CPU | 0.2GB mem para o NGINX

Depois vou explicar como que distribuindo melhor os recursos e [diminuindo os números do NGINX e PostgreSQL](https://twitter.com/leandronsp/status/1699568664859603184) fez meu troughput melhorar, mas só consegui fazer isto dias depois da rinha ter terminado.

### O grande momento, the big moment
Minha submissão Ruby ficou em 20º lugar num ranking de 51 submissões funcionais (quase 100 foram submetidas mas muitas não rodaram lá na máquina dos caras), com um total de 24k inserts no banco de dados após o teste de stress com carga dobrada.

Não achei um número ruim mas eu tinha uma noção de que o desafio era muito I/O-bound, coisa que expliquei [nesta thread](https://twitter.com/leandronsp/status/1695470712738210189) do Twitter e também [nesta outra thread](https://twitter.com/leandronsp/status/1699568664859603184) dias depois.

> Se I/O-bound ou CPU-bound são termos esquisitos pra você, sugiro dar um passo atrás e aprender os fundamentos de concorrência em sistemas operacionais, [neste super guia](https://web101.leandronsp.com/) que escrevi anos atrás sobre o funcionamento da Web

### Resumo da ópera
O resumo disto é que depois com mais calma, consegui ajustar melhor meu ambiente de desenvolvimento. Abandonei o [colima](https://github.com/abiosoft/colima) que tava com performance horrível no meu macOS e abracei o [orbstack](https://orbstack.dev/). So far, so good.

Com isto, pude rodar de forma mais assertiva com restrição de recursos os testes de stress no meu ambiente. Tem a ver com a virtualização do orbstack ser mais performática etc e tal.

### A new hope for plain Ruby
Isto abriu portas para que eu voltasse a experimentar Falcon e meu filho Chespirito. Guess what, os números começaram a bater a famigerada dupla Roda/Puma.

Aproveitei também para utilizar o [Portainer](https://www.portainer.io/) para visualizar métricas de CPU e memória dos containers no Docker.

Não apenas isto, também mexi nos meus limites no docker-compose, ficando assim, delegando mais recursos para o PostgreSQL que, tadinho, era o que mais apanhava (parabéns guerreiro, tmj):

- 0.2 CPU | 0.3GB para API's (x2)
- 1 CPU | 1.7GB para PostgreSQL (sim, nessa arquitetura, db sempre gasta mais CPU e memória)
- 0.1 CPU | 0.1GB para o NGINX

Diferente de muitas submissões na rinha, fiquei entre poucos que optaram por não utilizar qualquer estratégia de cache ou batch insert de forma assíncrona. 

Meu intuito sempre foi experimentar algo que acredito muito e que trago nos projetos em que trabalho: não abusar de cache ou estratégia assíncrona onde não precisa. Cache ajuda mas pode trazer muitos desafios e encarecer custos no fim das contas.

> Claro que, para a rinha, tudo era válido. Foi um amontoado positivo de diferentes soluções e troca de conhecimento

Mas como sou chato com custos, eu sempre vou pra solução mais simples possível e que causa menos entropia possível, _até que se prove o contrário_.

Cenário então fica assim:

- I/O não-bloqueante com Falcon, atendendo requests com multitasking cooperativo (Fibers)
- Chespirito, que não faz grande coisa a não ser rotear mensagens do Rack para a lógica devida, mas com código muito mais explícito e sem aquela DSL  ̶h̶o̶r̶r̶o̶r̶o̶s̶a̶ estranha do Roda

Os números melhoraram, indo pra 35k. Not bad. Mas eu tinha uma leve suspeita de que algo errado ainda estava com minha solução. Por ser um desafio muito I/O-heavy, os requests ficavam pouco no Ruby, então eu tinha que melhorar a latência do PostgreSQL.

Foi aí que inverti a lógica. 

### Fechando a torneira
[Nesta thread](https://twitter.com/leandronsp/status/1699568664859603184) compartilhei recentemente como consegui atingir 46k inserts, mas em suma eu basicamente percebi que muitos requests à espera (Gatling judia) fazem aumentar a latência e consequentemente ciclo de CPU para fazer gestão das filas nos sockets. 

Minha ideia então foi não deixar muito requests à espera, mesmo porque as queries no db são muito rápidas (remember kids, índices corretos salvam vidas).

Para atingir isto, resolvi diminuir o PostgreSQL para 30 max_connections e NGINX para 256 worker_connections (podia até ser 128 ou 64 tbh). Na API, como são duas, deixei uma pool de 15 conexões, pois o PostgreSQL neste caso iria até 30.

O resultado trouxe um troughput melhor e garantiu 46k inserts. 

> Em breve vou escrever um artigo mais detalhado sobre esta saga do Ruby na rinha

### E o Bash?
It turns out que também fiz [outra versão](https://github.com/leandronsp/rinha-backend-bash) e submeti, escrita em Bash script, apenas for fun mesmo. Foi produto de um tweet inocente que fiz, o pessoal não perdoou e fez o tweet viralizar, pelo que me senti obrigado e implementar a API em Bash.

Na verdade, como eu já venho de uma saga ensinando fundamentos de computação [nos meus artigos](https://leandronsp.com/articles/building-a-web-server-in-bash-part-i-sockets-2n8b) usando Bash, foi tranquilo fazer uma versão minimamente aceitável com mkfifo e netcat.

Submeti sem grandes pretensões, rodei o teste local apenas uma vez e deu um monte de erro, pensei "freak it vou mandar mesmo assim" e foi.

Para meu deleite, a solução em Bash ficou dentre as 51 funcionais da rinha, conquistando a tão sonhada 51ª posição, com um total de 17 inserts.

> Isso mesmo, 17 inserts

Twitter não perdoa e então começaram a me chamar de "carinha do Bash", "ministro dos scripts Bash" e etc, mas gente **EU NAO PROGRAMO EM BASH**. Sou apenas um dev scriptzero que usa Bash as vezes pra facilitar minha vida e automatizar o que não preciso, mas longe de "manjar" de Bash kkkkk

---

## I/O assíncrono e live coding do Leandro
Com o término da rinha, foi gerado um buzz muito alto em torno de I/O, principalmente o famoso **I/O assíncrono**, ou então como alguns costumam referenciar por **I/O não-bloqueante**.

Em breve escrevo artigos mais formais e detalhados sobre I/O não-bloqueante, mas recentemente fui de [live mesmo](https://www.youtube.com/watch?v=w1ejKYlxhaA), com um formato mais de "explicação", indo lá atrás de forma resumida nos aspectos de concorrência em sistemas operacionais até chegar em I/O não-bloqueante. 

Na [live](https://www.youtube.com/watch?v=w1ejKYlxhaA) eu trouxe exemplos em Ruby, Bash e C. Se você quer dar uma espreitada no que aconteceu por lá, [CLIQUE AQUI](https://www.youtube.com/watch?v=w1ejKYlxhaA).

---

## That's all folks
É isto, o intuito deste breve artigo foi fazer um apanhado das coisas que tenho olhado recentemente, em um formato mais informal como costumo usar no Twitter. 

Espero que o formato possa ser útil, caso contrário irei apenas continuar com aquele formato  ̶c̶h̶a̶t̶o̶ denso e didático.

Claro que não deixarei de escrever os artigos técnicos de costume. E pode ser que eu misture inglês com português e a massarocada toda.

Fiquem ligades.
