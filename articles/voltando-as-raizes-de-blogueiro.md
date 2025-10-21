---
title: "Voltando às raízes de blogueiro"
slug: "voltando-as-raizes-de-blogueiro"
published_at: "2025-10-18 20:05:19Z"
language: "pt-BR"
status: "published"
tags: ["blog"]
---

Já faz um tempo que não escrevo aqui no blog. 

E também já faz bastante tempo que tenho o interesse em voltar a escrever mais como fazia antigamente, quando tudo o que tinha era algo na mente e simplesmente convertia em um punhado de texto solto no meu blog, como [essa relíquia](https://leandromaringolo.blogspot.com/) aqui.

Gosto de escrever artigos técnicos, mas por outro lado também gosto de simplesmente sentar e começar a escrever sem grandes pretensões. Só que me faltava algo. Eu só não sabia o que era.

Para entender o que me faltava, vamos dar uns passos atrás e entender o contexto de como eu vinha utilizando plataformas de blogging e o cenário de blogging moderno.

## Blogpost
A primeira plataforma que utilizei foi o [Blogger](https://www.blogger.com/), antigo _blogspot_, onde comecei a escrever meus primeiros artigos quando eu ainda "mexia com TI". **O ano era 2009**. 

Eu compartilhava [estudo de programação](https://leandromaringolo.blogspot.com/) quando tinha terminado a faculdade e também as gambiarras que eu fazia instalando e corrigindo problemas no Windows XP com Service Pack 3®.

Atualmente o editor é assim, mas na época era bastante limitado:

![image](/uploads/835.png)

Não é ruim até, mas repara como que o **espaço não é aproveitado**. E uma coisa que eu sempre prezo ao escrever é, no caso, o _conforto em escrever_. Gosto de uma pegada fluída, com fonte agradável e que tenha um bom contraste. No caso desta plataforma em questão, eu tenho que clicar num botão de "Preview" e assim sou direcionado para outra página, saindo completamente do contexto.

Isso me entristece, muito.

Foram bons momentos como blogueirinho no Blogger, mas fiquei uns anos sem escrever por conta de vários motivos até que...

## Medium
Circa 2014 [decidi experimentar](https://medium.com/@leandronsp) voltar a escrever, mas desta vez no Medium. Fiz apenas um punhado de artigos sem grandes pretensões, mas eu tinha gostado da fluidez (na época) de escrever na plataforma deles.

Entretanto a experiência de escrever ainda tava longe de ser a que eu queria. Mas eu nem sabia o que queria.

![image](/uploads/899.png)

> Cadê o botão de preview? Oh, gosh...

Fast-forward para 2021.

## DEV.to e Hashnode
A plataforma dev.to me pareceu a princípio bastante intuitiva. Tem um lance de comunidade que é bacana, porque para além de ser uma plataforma de blogging é também uma comunidade em volta disso. Sem contar com o **suporte a Markdown** que nos dias de hoje é crucial para escrever artigos.

Decidi [criar uma conta](https://dev.to/leandronsp) lá e desde então tenho **publicado quase 100 artigos**:

![image](/uploads/931.png)

Ao mesmo tempo, a experiência de escrever era a melhor de todas que eu encontrei, mas ainda faltava uma coisa que eu já estava começando a perceber: _preview em tempo real_.

É muito chato você escrever bastante coisa e ter que clicar num botão lá em cima pra abrir outra página que, não raramente, demora pra carregar. É uma experiência que não sou fã 100%.

![image](/uploads/7650.png)

Na mesma época eu queria algo parecido mas que pudesse ter uma "landing page" no estilo dos blogs antigos com um menu customizado com os links que eu quisesse colocar. Para além do suporte a Markdown e um editor fluído. Foi quando conheci o [Hashnode](https://hashnode.com/@leandronsp). 

Com Hashnode, eu pude criar uma página "customizada" com menu e assim organizar melhor meus artigos. Mas me faltava ainda algo mais configurável. 

Pra não mencionar que a experiência de escrita continuava a ser a mesma: _ter que clicar num botão de preview_ que, com uma latência absurda, faz 412 coisas menos mostrar o preview que você verdadeiramente quer naquele momento.

![image](/uploads/995.png)

Acabou que deixei o Hashnode flopar, mas ficou com meu domínio `leandronsp.com` e passei a escrever mais pelo DEV.to mesmo. 

_Era o que tinha pra janta_.

> Mas Leandro, existem ferramentas de visualização de Markdown, você consegue usar isso no Obsidian, na linha de comando, com plugin do Vim, com extensão do VSCode, etc etc

Calma, calabreso. Eu quero apenas escrever, ver em tempo real o que estou escrevendo _sendo renderizado_ e a seguir publicar. That's it. Pra mim o web browser é ainda a ferramenta onde sinto mais conforto ao fazer esse tipo de tarefa.

> Desculpa galera do terminal, mas como um heavy-terminal user e Vimer raiz, eu ainda prefiro blogar no browser

Foi assim até 2 dias atrás.

## A vontade de escrever sobre UNIX signals
Como aqueles momentos em que do nada me vem a cabeça experimentar algo inútil que ninguém pediu e que provavelmente não vai pedir, decidi criar um broker de mensageria utilizando apenas sinais UNIX.

> Em breve publico isto, foi divertido

Então, como de praxe, resolvi sentar pra escrever sobre. No DEV.to como habitual. Mas quer saber?

_Cansei_. 

Resolvi criar meu próprio motor de blog que iria me atender em todos os aspectos que sinto falta nos motores atuais: aproveitar espaço, trazer *preview em tempo real*, navegação fluída, simples e sem muito ruído, tudo com suporte a Markdown.

Eu queria algo mais ou menos assim:

![image](/uploads/7778.png)

Com isto em mente, resolvi criar o [curupira](https://github.com/leandronsp/curupira).

## Curupira
Pra quem já me conhece sabe que sou péssimo com nomes, mas resolvi dar esse nome em homenagem ao nosso folclore brasileiro e ao protetor das nossas matas. Só porque sim.

No intuito de ter uma navegação fluída como a que eu sonhava, decidi utilizar [Phoenix LiveView](https://hexdocs.pm/phoenix_live_view/welcome.html). Em resumo, é uma tecnologia que escala absurdamente por conta da VM que roda por baixo, a _BEAM_. Meu objetivo de ter de um lado o editor para escrever e do outro um preview em tempo real poderia ser finalmente atingido de forma simples. 

É muito, mas muito simples criar apps real-time com Phoenix LiveView. A seguir uma demonstração de como pode ficar a página inicial do curupira:

![image](/uploads/484.png)

Basicamente você tem de um lado uma bio que resume teu blog, e do outro a lista de artigos. _É isto_. Não precisa ser complicado, temos que aproveitar o máximo de espaço possível na tela.

![image](/uploads/516.png)

Dá também pra alternar entre tema claro e escuro:

![image](/uploads/4098.png)

Além de tudo isso, é possível também gerar o site estático a partir de um comando `make`.

> Isto vai ser melhorado em breve, quero também deixar o processo de geração do site estático mais fluído e UX-friendly em um futuro próximo

## leandronsp.com
Após gerar o site estático, mudei o apontamento do meu domínio principal para o Cloudflare Pages, mas poderia ser qualquer outro como Github Pages, Vercel, etc (esta parte ainda está manual no momento, vem mais coisa em breve).

Meu novo site ficou então assim:

![image](/uploads/4194.png)

![image](/uploads/4258.png)

Preferi fazer com que a página do artigo tivesse espaço suficiente para o conteúdo, e não para ruídos.

---

## Conclusão
É isto, pra quem tiver curiosidade em ver o repositório [leandronsp/curupira](https://github.com/leandronsp/curupira), publiquei hoje mas ainda está WIP.

Este artigo já foi escrito com o curupira, e em breve será publicado neste blog.
