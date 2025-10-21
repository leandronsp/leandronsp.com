---
title: "Construindo um web server em Assembly x86, parte II, história e arquitetura"
slug: "construindo-um-web-server-em-assembly-x86-parte-ii-historia-e-arquitetura-2jb9"
published_at: "2024-04-11 23:26:28Z"
language: "pt-BR"
status: "published"
tags: ["assembly", "braziliandevs"]
---

No [artigo anterior](https://dev.to/leandronsp/construindo-um-web-server-em-assembly-x86-parte-i-introducao-14p5) demos uma introdução não-técnica sobre o que será esta saga de Assembly x86 conforme avançamos na construção de um web server.

Agora, chegou o momento de começarmos a de fato falar sobre coisas técnicas. 

Como de costume, não gosto de esgormitar termos complexos sem a devida explicação. Portanto, vamos iniciar a saga trazendo um pouco de contexto histórico, motivações e porque estamos aqui quando o assunto é **computadores**.

> Okay, agora fui filósofo demais. Mas o que mais importa é que o verdadeiro Assembly são os amigos que fazemos no caminho

Sem mais delongas, vamos ao que interessa.

---

## Agenda

* [Um pouco de história](#um-pouco-de-história)
* [Computar informações](#computar-informações)
  * [Máquina de Turing](#máquina-de-turing)
  * [Arquitetura de von Neumann](#arquitetura-de-von-neumann)
  * [O gargalo de von Neumann](#o-gargalo-de-von-neumann)
* [Hierarquia de memória](#hierarquia-de-memória)
  * [Como a CPU executa instruções](#como-a-cpu-executa-instruções)
  * [Registradores de CPU](#registradores-de-cpu)
* [ISA](#isa)
  * [CISC](#cisc)
  * [RISC](#risc)
* [Por quê x86?](#por-quê-x86)
* [Conclusão](#conclusão)
* [Referências](#referências)

---

## Um pouco de história
Ainda muitos milhares de anos a.C, o ser humano precisava realizar cálculos. Um dos instrumentos mais primitivos para esta tarefa era o Ábaco, e certamente você já deve ter visto um:

![abaco](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/4rnhwceutwrg1kxc1amx.jpeg)

Não vou entrar em detalhes em como um Ábaco funciona, sugiro que compre um e experimente. É divertido. Eu usei quando estava no ensino primário (cria dos anos 90, cof cof).

### Computadores mecânicos
Ainda nesta "pré-história" dos computadores e já avançando para uma Europa iluminista (circa século XVII), podemos ver a seguir invenções mecânicas e projetos como a máquina de calcular de Blaise Pascal, depois a máquina analítica de Charles Babbage e então a máquina de tabulação de Herman Hollerith.

![babbage machine](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/96zo1kt2of9iohmx3f02.jpeg)

> 💡 É da máquina de tabulação de Herman Hollerith que vem o nome do seu comprovante de pagamento "holerite"

Estas máquinas eram mecânicas e tinham muitas limitações como não ter uma memória própria para as "instruções", mas foram muito importantes para a evolução, possibilitando mais tarde que Ada Lovelace pudesse escrever o primeiro possível algoritmo para o projeto da máquina de Babbage.

> Pra quem quiser uma explicação excelente e mais completa sobre a história dos computadores e como estes funcionam, sugiro o vídeo [como reinventar um computador do zero](https://www.youtube.com/watch?v=BbnDmeNojFA) do canal Infinitamente.

---

## Computar informações
Na era moderna dos computadores, que se dá início no século XX, é quando acontece a revolução eletrônica através das válvulas e dos transistores. 

Mas não apenas na área da eletrônica. Foi no século XX que vimos a revolução computacional através de um modelo abstrato que abriu portas para muito do que conhecemos hoje em termos de computadores.

Estamos falando da **máquina de Turing**.

### Máquina de Turing
Nos anos 30, o matemático Alan Turing desenvolveu o conceito abstrato de uma máquina que possuía uma fita infinita, dividida em células, e um cabeçote de **leitura/escrita** que movia para frente e para trás na fita, possiblitando modificar o estado atual na máquina.


![turing machine](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/8hpp285hmrzc0txur45m.png)

Basicamente, este modelo de máquina permitiria que certas classes de problemas pudessem ser resolvidas com operações simples. 

Extrapolando, nesta fita, que pode representar um tipo de "memória", é possível armazenar o estado mas também outra máquina, ou seja, temos aqui o conceito de uma máquina de Turing universal, que é capaz de simular outra máquina de Turing.

De forma resumida, podemos colocar na fita tanto o estado (dados) quanto as próprias instruções do programa, mitigando assim o problema de limitação que os computadores primitivos tinham, que era resolver problemas complexos de forma mais simples.

Entretanto, a máquina de Turing era apenas uma abstração. Este conceito de instruções e estado na mesma memória precisava ser concretizado.

_É aí que entra von Neumann_.

### Arquitetura de von Neumann
Von Neumman foi um polímata que propôs um modelo computacional que é utilizado por muitos computadores modernos e dispositivos que usamos hoje em dia.

Neste modelo, temos uma unidade de processamento central, ou CPU, que é responsável por realizar cálculos aritméticos e executar instruções.

Conectada a esta CPU, temos o conceito de _memória_ compartilhada, que vai ser usada para armazenar todas as instruções e estado de um programa de computador.


![von neumann 1](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/b0f759rhez1y6kinc7bf.png)

Esta arquitetura possibilitou que computadores como ENIAC e EDVAC pudessem ser desenvolvidos. O EDVAC, por sua vez, foi um dos precursores na implementação do modelo de von Neumann, com uma CPU que era conectada a uma memória compartilhada e sequencial.

![edvac](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/vmlzomad54zpeapwc2jv.jpeg)

À medida que os componentes computacionais foram ficando mais modernos, os computadores foram ficando menores, mais potentes, versáteis e com utilização de propósito mais geral. 

Então, a arquitetura de von Neumann pode ainda contar com dispositivos de entrada e saída de dados (impressora, teclado, mouse, placa de rede, monitor, etc), também conhecidos como dispositivos I/O:


![von neumann 2](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/fer0xexjvwrt4ooiwbjh.png)

Podemos assumir, então, que quando escrevemos um programa de computador, estamos basicamente manipulando uma memória finita (que tem fim) e dispositivos de entrada e saída de dados, através de instruções que são executadas pela CPU.

Tudo graças ao modelo concreto de von Neumann.

> Vale destacar que há arquiteturas computacionais que não seguem este modelo, mas aqui neste guia estamos focando em computadores de propósito geral

### O gargalo de von Neumann
Esta arquitetura entretanto traz uma limitação. Como o barramento (caminho) entre a CPU e memória é único, tanto instruções quanto dados trafegam pelo mesmo local, levando a um cenário onde a CPU pode ficar limitada em processamento até que todos os dados sejam lidos do barramento.

Uma forma de mitigar este problema é definir diferentes "níveis" de memória, para que a CPU possa ter uma taxa de processamento maior.

Você acertou, vamos falar agora sobre a _hierarquia de memória_.

---

## Hierarquia de memória
Nosso programa manipula memória. 

> Com que frequência? 

Todo tempo.

Para mitigar o problema do gargalo de von Neumann, podemos definir uma hierarquia de memória, assim não só a memória principal (RAM) é "enxergada pela CPU" como memória, mas também outros dispositivos de armazenamento no sistema computacional.

Adicionado a isso, com a modernização de computadores no século XX, foi criada a necessidade de orquestrar e controlar todas as interfaces com o hardware. Temos então a concepção de **sistemas operacionais** para esta tarefa, que começam a surgir em meados dos anos 60/70, dentre eles o UNIX.

Ao tratarmos tudo como memória, podemos introduzir tal __hierarquia__. Portanto, num sistema computacional tratamos tudo (ou quase tudo) como memória e assim o sistema operacional (SO) pode abstrair de um determinado programa onde aquilo na hierarquia se encontra de fato sendo utilizado, deixando então nosso programa "livre" deste detalhe de implementação física.

![hierarquia memoria](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/i09gvyk1ext127w3u1mm.png)

Quanto mais pro topo da hierarquia, menor a capacidade de armazenamento e mais caro. Por exemplo, registradores de  CPU são memórias voláteis que estão no topo.

> Vamos falar sobre registradores mais a seguir na saga

E quanto mais pra base da hierarquia, maior a capacidade e consequentemente mais barato. Exemplo na base são as unidades de armazenamento durável não-voláteis (HD, SSD etc).

No meio temos a memória principal e volátil, tendo como principal exemplo a memória RAM.

A hierarquia de memória desempenha, então, um papel crucial na forma como a CPU gerencia e acessa memória.

### Como a CPU executa instruções
Para que uma CPU execute determinada instrução, é necessário ao menos um ciclo de clock, também chamado popularmente como "giro de CPU", ou _ciclo de CPU_.

Vamos imaginar uma coisa que fica "girando" indefinidamente igual um relógio. De forma simples, é assim que podemos imaginar o clock de uma CPU, como um giro de relógio.

Alguns tipos de instruções podem gastar mais de um ciclo, e determinar quais instruções vão gastar mais ou menos ciclos é algo que é projetado diretamente na **construção da CPU**.

E onde as instruções ficam armazenadas? 

> Isso mesmo, na memória.

Portanto, a CPU precisa buscar a instrução na memória, decodificar, executar e armazenar o resultado de volta na memória. 

Tudo isto faz gastar imensos ciclos de CPU. Ao gastarmos ciclos, a CPU pode bater num limite e não conseguir atender a tantas operações no mesmo segundo. Pra não mencionar a latência que a CPU gasta pra utilizar o barramento físico e "viajar" até a memória principal.

Tomando como premissa a hierarquia de memória, e se ao invés de armazenar o resultado na memória principal, a CPU resolver armazenar dentro da própria CPU?

Conheça os **registradores de CPU**.

### Registradores de CPU
Você já pode estar pensando em cache de CPU, né? Mas calma lá jovem, cache de CPU é outra seara que não pretendo entrar, não por agora.

> Mas que também tem seu lugar na hierarquia de memória

Lembrando (mais uma vez), da hierarquia de memória, de forma muito simplificada:

* topo: registradores
* depois: cache de CPU
* ainda depois: memória principal (RAM)
* beeem depois: memória secundária (HD, SSD)

Quanto mais perto do topo, mais rápido a CPU consegue processar, mas em contrapartida é volátil e também tem menor capacidade de armazenamento.

Então, registradores são apenas memórias de hierarquia mais alta que são preferencialmente usadas para computação porque possuem a menor latência do conjunto de memórias disponíveis.

São nos registradores onde a CPU vai armazenar instruções e dados do programa em execução, de modo a manipular sem precisar ficar dando tantos "saltos" na memória principal, economizando assim latência e ciclos de CPU.

![von neumann - registradores](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/1zzyclx72ff6nyr7b3ag.png)

Vamos pensar nos registradores como "caixinhas" de tamanho fixo que ficam dentro da CPU. 

E como podemos manipular os registradores da CPU? Devemos estabelecer um padrão, que define como controlar o **conjunto de instruções** da CPU.

Precisamos de uma arquitetura de conjunto de instruções, ou **ISA** (_Instruction Set Architecture_).

---

## ISA
ISA serve para definir o conjunto instruções e registradores em uma determinada CPU. O fabricante define a ISA, que pode ser classificada de formas diferentes, determinando quantas operações podem ser feitas por instrução, entre outros aspectos.

Neste artigo vamos destacar 2 abordagens de conjunto de instruções: _CISC e RISC_.

### CISC
CISC, ou **Complex Instruction Set Computing**, é uma arquitetura onde as instruções podem ser agrupadas em conjuntos mais complexos de instruções, permitindo que uma única instrução execute várias operações complexas.

Aqui, determinadas tarefas podem resultar em apenas um ciclo de CPU, o que aumenta eficiência, mas por outro lado, esta complexidade de instruções pode tornar o tempo de execução menos previsível.

Exemplos de arquiteturas CISC incluem System/360, PDP-11 e Intel 8086.

### RISC
Para resolver o problema de instruções muito complexas em CISC, a arquiteura RISC, ou **Reduced Instruction Set Computing**, determina uma execução mais simples com menos instruções, diminuindo assim o número de circuitos e consequentemente ciclos de CPU. O tamanho das instruções geralmente é fixo, resultando em um desempenho mais rápido e previsível.

Exemplos de arquiteturas RISC são MIPS e ARM, sendo ARM atualmente utilizada nos processadores de MacBook M1 em diante.

Este é um dos motivos de um MacBook ARM consumir menos bateria e fazer menos barulho, por exemplo.

### E já que o tema é x86...
Como a saga se trata de x86, especificamente 64-bit (logo mais vamos entender o motivo disso), inicialmente esta arquitetura foi desenvolvida seguindo o padrão CISC, que é o conjunto complexo de instruções.

Entretanto a ISA do x86 foi adaptada para suportar internamente operações simplificadas como encontramos em RISC, portanto pode-se sizer que x86 é um "fake-CISC", que segue um modelo "RISC-ish".

---

## Por quê x86?
Alguns leitores mais atentos devem estar se perguntando: por quê raios x86? O que isto significa?

Bom, pra entender o que é isto, vamos mergulhar um pouco na história dos microprocessadores da Intel.

### Anos 70
Os anos 70 foram primordiais. Além da explosão cambriana de sistemas operacionais, vemos também a consolidação da era dos transistores e assim a evolução das CPU's. 

Do lado Intel, temos o 8080 de 8-bit lançado em 1974, que além de ser utilizado em sistemas industriais, também foi amplamente encontrado nos primeiros computadores pessoais.

### Intel 8086
Esta versão traz consigo conjuntos de instruções de 16-bits e foi um marco na era dos computadores pessoais. É aqui que passa a ser cunhado o termo de família "x86", pois o "x" caracteriza qualquer número que venha antes de "86".

Intuitivo, não?

### Anos 80, a década do Intel x86 
A partir de então, nesta década vimos a chegada do 80286 (286) que suporta também 16-bit + 8-bit de endereçamento de memória; depois, o famoso 80386 (i386), que trouxe uma grande mudança suportando instruções de 32-bit e os famosos registradores `exx` (eax, ebx, eip, etc); para então chegarmos ao 80486 (486), que foi uma melhoria do 386 com suporte a instruções mais avançadas.

> Pra quem tiver curiosidade em saber a especificação da arquitetura x86, está tudo bem documentado num simples [manual de 5000 páginas](https://software.intel.com/en-us/download/intel-64-and-ia-32-architectures-sdm-combined-volumes-1-2a-2b-2c-2d-3a-3b-3c-3d-and-4)

### Anos 90, Pentium e além
O que vem a seguir é a evolução seguindo com os Pentium 586, 686 e depois, uma simplificação dos termos para x86_32 (32-bit) ou x86_64 (64-bit).

Destaca-se os Pentium II, III e os Core "i AlgumaCoisa" que perduram até hoje.

> E os AMD?

Enquanto a Intel dominava o mercado de CPU's, a AMD (Advanced Micro Devices) mexeu os palitinhos e também lançou versões compatíveis com x86, portanto pode-se dizer que, ao desenvolver para arquitetura x86, é possível executar as mesmas instruções em uma CPU fabricada pela AMD.

---

## Conclusão
É isto. Este foi um artigo bastante denso, que cobriu uma breve história dos computadores, passando por modelos computacionais até chegar nas arquiteturas de CPU's e entendermos o que significa aquele "x86" no título do artigo.

No próximo artigo, pretendo trazer brevemente sistema binário e hexadecimal para então começar a apresentar aquilo que estamos todos interessados: linguagem de montagem, ou simplesmente **Assembly**.

_Artigo revisado com carinho por [Jeff Quesado](https://twitter.com/JeffQuesado), o "Coelho da Bolha", e também por [Cadu](https://twitter.com/_____cadu_____), o músico frustrado (same thing)._

---

## Referências

<sub>
Ábaco, Wikipedia
https://pt.wikipedia.org/wiki/%C3%81baco
Máquina analítica, Wikipedia
https://pt.wikipedia.org/wiki/M%C3%A1quina_anal%C3%ADtica
Linguagem Assembly, Wikipedia
https://pt.wikipedia.org/wiki/Linguagem_assembly
Cronologia do x86, Wikipedia
https://pt.wikipedia.org/wiki/X86
Arquitetura de Von Neumann, Wikipedia
https://pt.wikipedia.org/wiki/Arquitetura_de_von_Neumann
Blau Araujo, "Fundamentos de Assembly com NASM"
https://codeberg.org/blau_araujo/assembly-nasm-x86_64
História da Computação, Wikipedia
https://pt.wikipedia.org/wiki/Hist%C3%B3ria_da_computa%C3%A7%C3%A3o
Inifitamente, "Como reinventar um computador do zero"
https://www.youtube.com/watch?v=BbnDmeNojFA
Total Phase, "What's a CPU register"
https://www.totalphase.com/blog/2023/05/what-is-register-in-cpu-how-does-it-work/
Turing Machine, Wikipedia
https://en.wikipedia.org/wiki/Turing_machine
Brilliant, "Turing Machines"
https://brilliant.org/wiki/turing-machines/
Instruction Set Architecture, Wikipedia
https://en.wikipedia.org/wiki/Instruction_set_architecture
</sub>
