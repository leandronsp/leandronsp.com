---
title: "Construindo um web server em Assembly x86, parte III, código de máquina"
slug: "construindo-um-web-server-em-assembly-x86-parte-iii-codigo-de-maquina-bgk"
published_at: "2024-04-23 23:18:02Z"
language: "pt-BR"
status: "published"
tags: ["assembly", "braziliandevs"]
---

Agora que já temos uma [base de entendimento](https://leandronsp.com/articles/construindo-um-web-server-em-assembly-x86-parte-ii-historia-e-arquitetura-2jb9) sobre hierarquia de memória, arquitetura de CPU e registradores, vamos aplicar estes conceitos em exemplos práticos: construindo programas de computador.

_Mas o que é um programa de computador?_

Teremos a resposta para esta pergunta ao longo deste artigo. Vamos abordar muitos conceitos, desde código de máquina (o mais importante na minha opinião), a sistemas de numeração binário, decimal e hexadecimal.

Iremos também compreender opcodes, chamadas de sistema, modo kernel, libc, ASCII, standard streams; e alterar arquivos binários em hexadecimal.

Ao final deste artigo vamos estar em um patamar de entendimento mais holístico de como um programa é interpretado na CPU. 

Ainda não entraremos em Assembly. Foi escolhido desta forma pois o intuito com esta saga é detalhar ao máximo como as peças de encaixam, e acredito que trazer Assembly sem explicar outros conceitos primordiais pode confundir bastante. 

Também não é esperado que você escreva os códigos de máquina deste artigo, pois aqui [neste link](https://github.com/leandronsp/monica/blob/main/example) providencio o binário já pronto para que você possa acompanhar com as ferramentas que irei utilizar. Basta apenas baixar o arquivo binário no link fornecido e atribuir permissão de execução com `chmod +x`, se necessário.

> Lembrando que é importante que esteja em um ambiente Linux, caso contrário não irá funcionar. Se estiver em outro ambiente e não puder virtualizar, poderá acompanhar esta saga apenas lendo, pois a ideia é também trazer muitos conceitos fundamentais de baixo-nível

Ainda não será o código do web server, o programa proposto neste post é bastante simples, mas estamos quase lá. Vamos focar em conceitos fundamentais para que futuros artigos, que cobrem o desenvolvimento do web server, possam ser melhor compreendidos.

Sem mais delongas, prepare-se para a partir de agora entrar numa espiral de código de máquina e manipulação de memória. 

---
## Agenda

* [O que é um programa de computador](#o-que-é-um-programa-de-computador)
  * [Sistemas Operacionais e Processos](#sistemas-operacionais-e-processos)
  * [Um programa deve sempre terminar](#um-programa-deve-sempre-terminar)
* [Nosso primeiro programa](#nosso-primeiro-programa)
  * [A linguagem das CPU's, o sistema binário](#a-linguagem-das-cpus-o-sistema-binário)
  * [O famoso sistema decimal](#o-famoso-sistema-decimal)
  * [Hexadecimal, o queridinho dos computadores](#hexadecimal-o-queridinho-dos-computadores)
  * [Opcodes](#opcodes)
  * [Endianness](#endianness)
* [Nosso segundo programa](#nosso-segundo-programa)
  * [Alocando dados na memória do programa](#alocando-dados-na-memória-do-programa)
  * [ASCII](#ascii)
  * [Syscalls](#syscalls)
  * [Montando a syscall write](#montando-a-syscall-write)
  * [Montando a syscall exit](#montando-a-syscall-exit)
* [Manipulando o nosso programa](#manipulando-o-nosso-programa)
* [A vida de quem programa é assim?](#a-vida-de-quem-programa-é-assim)
* [Conclusão](#conclusão)
* [Referências](#referências)

---

## O que é um programa de computador
Como já vimos na parte II, a função primordial de uma CPU é ler uma instrução da memória, decodificar, executar e armazenar o resultado de volta na memória.


![CPU decodifica instrução](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/74pip1fwevxzhlgtskrq.png)

Então a grosso modo, um programa de computador é um conjunto de instruções pra a CPU processar. Em um cenário típico, teríamos diversos programas diferentes **lendo e escrevendo** da mesma memória do computador:

![programas e memória](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/v04zatlsnnkesdegjknq.png)

Mas um potencial problema, é que neste cenário poderíamos ter dois diferentes programas acessando ou modificando o mesmo endereço de memória:


![conflito em memória](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/rcdxz981arzq3d9h5e1b.png)

Pra resolver isto, precisamos agrupar as instruções de um programa de modo a "isolar" de outros programas que também estão rodando no computador. 

É aí que entra um dos papéis do **sistema operacional** com o conceito de _processos_.

> Lembrando que nesta saga, vamos focar apenas em sistemas UNIX-like, mais precisamente distruibuições GNU/Linux

### 🔵 Sistemas Operacionais e Processos
Cada programa executado no SO é encapsulado em uma estrutura chamada _processo_, que vai ter uma área virtual na memória principal.

Na prática, cada programa vai ter seu próprio "0x10000", isolado dos demais.

![sistemas operacionais e processos](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/ra2p8vkdu9pu3tgthvsk.png)

### 🔵 Um programa deve sempre terminar
Como o SO aloca recursos de memória (dentre outros) para o processo, nosso programa precisa indicar quando termina.

Desta forma aquele espaço reservado de memória fica livre para ser utilizado por outro processo. Isto evita problemas como vazamento de memória entre outros.

![program exit](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/bh2z34wvdqii8nz7w3bm.png)

Caso isto não seja feito, o SO vai lançar uma exceção e o programa não pode ser admitido como processo.

---

## Nosso primeiro programa

Vamos trabalhar inicialmente com um exemplo bastante simples. Um programa que _não faz nada_.

> Nossa Leandro, como assim um programa que não faz nada?

Sim, parece estranho para linguagens de mais alto nível. Mas pensando em CPU isto já é alguma coisa, pelo que precisamos de ao menos algumas instruções para um programa que "não faz nada": **o programa precisa terminar**, lembra?.

### 🔵 A linguagem das CPU's, o sistema binário
Pensando na CPU como um dispositivo eletrônico, esta só entende pulso elétrico. Mas conseguimos abstrair tais pulsos como 0 ou 1. 

Consequentemente, quando falamos em código de máquina para uma CPU estamos falando em instruções que utilizam _sistema binário_, composto de 0 ou 1.

Nosso programa que não faz nada além de "terminar" pode ser representado então pelo seguinte conjunto de instruções:

> Não se preocupe em escrever o programa. Por enquanto são só exemplos de código de máquina para que possamos entender bem os conceitos

```
10111111 00000001 00000000 00000000 00000000   
10111000 00111100 00000000 00000000 00000000  
00001111 00000101                            
```

No sistema binário, cada símbolo é chamado de **bit**. Este simples programa tem 12 conjuntos de 8 bits cada. _Conte você mesmo para confirmar!_

O **sistema binário** tem esse nome porque só fornece dois tipos de símbolos para representar números. Vamos contar:
```
0
1
```
Acabou. Com 1 dígito podemos ter 2 combinações apenas. Mas e se quisermos representar mais números? Aí nos resta ficar combinando com mais dígitos.

Para 2 dígitos, conseguimos aumentar para 4 combinações:
```
00
01
10
11
```
Se quisermos continuar, temos que entrar com 3 dígitos, sempre começando com o mais à esquerda possível, o que nos dá 8 combinações:
```
000 
001 
010 
100
100 
101 
110 
111
```

Com isto, temos um padrão:

* 1 dígito: 2 combinações
* 2 dígitos: 4 combinações
* 3 dígitos: 8 combinações

Repare no padrão de exponenciação. Estamos pegando o número 2 como base e aplicando o número do dígito como expoente:

_numero de símbolos ^ número de dígitos_

* 2^1 = 2
* 2^2 = 4
* 2^3 = 8

Extrapolando para 4 ou mais dígitos, podemos chegar na seguinte conclusão:

* 2^4 = 16 combinações
* 2^5 = 32 combinações
* 2^6 = 64 combinações
* 2^7 = 128 combinações
* 2^8 = 256 combinações

E assim por diante...

> Você tá brincando com minha cara, né Leandro? Vim aqui pra ficar escovando bit?

Não exatamente. No programa, cada conjunto ali de 8 bits (chamado de **byte**) tem um significado para a CPU, o que faz nosso programa ter 12 bytes. 

E como não somos uma CPU, estamos nada preocupados em representar instruções em bits, vamos então converter para o sistema decimal para conseguirmos representar nosso **mesmo programa** de forma mais simples e intuitiva.

### 🔵 O famoso sistema decimal
Já estamos habituados com o sistema decimal. Muitos números no nosso dia-dia são representados através do sistema decimal.

Falamos de números como "dez", "cento e quinze", "quarenta e dois" sem qualquer problema, pois foi o que aprendemos desde a primeira infância. Nosso cérebro já fixou o aprendizado tão intrinsicamente, que sequer pensamos que se trata de um sistema de numeração como qualquer outro.

Vamos por um momento _esquecer_ que sabemos sistema decimal e aplicar as mesmas regras que aplicamos para o sistema binário.

Repetindo mais uma vez, no sistema binário temos à disposição apenas dois símbolos: 0 e 1. 

> E no decimal? 

Temos **dez** símbolos à disposição, que são:

```
0 1 2 3 4 5 6 7 8 9
```
Tal como no sistema binário, com 1 dígito apenas temos essas 10 possibilidades acima.

Já chegou no nove? Acabaram as combinações? Não tem problema, vamos subir pra _dois dígitos_ sempre começando pelo dígito mais à equerda possível:

```
00 01 02 03 04 05 06 07 08 09
10 11 12 13 14 15 16 17 18 19
20 21 22 23 24 25 26 27 28 29
...
...........................99
```
Olha só, com apenas dois dígitos no sistema decimal, podemos combinar 100 números diferentes!

O padrão é o mesmo no sistema binário, podemos logo aplicar exponenciação da base, sendo:

_numero de símbolos ^ número de dígitos_

Portanto:

* 10^2 = 100 combinações
* 10^3 = 1000 combinações
* 10^4 = 10000 combinações
* etc etc etc

### Convertendo binário em decimal
Uma vez que entendendo sistemas de numeração binário e decimal, podemos "compactar" nosso programa inicial de binário para decimal de modo a termos uma leitura mais intuitiva, não?

Aplicando a regra de exponenciação, não fica difícil fazer a conversão:

* 0 é sempre 0, pois este símbolo está presente em ambos sistemas de numeração
* Mesmo vale para 1, pois está presente em ambos

Se quisermos então converter `10` (que é o próximo número depois de 1 em binário) de binário pra decimal, vamos aplicar a seguinte regra:

_dígito x 2^posição do dígito_

..._somando o resultado_ de cada operação em dígito, onde a posição **mais à direita possível** começa com _zero_, pois de acordo com a senhora matemática, qualquer número elevado a _zero_ é *UM**.

Com isto:

* 10 = _(1 x 2^1) + (0 x 2^0)_ = 2 + 0 = **2**

Vamos extrapolar um pouquinho?

* 11 = _(1 x 2^1) + (1 x 2^0)_ = 2 + 1 = **3**
* 100 = _(1 x 2^2) + (0 x 2^1) + (0 x 2^0)_ = 2 + 0 + 0 = **4**

Yay! _Nice, uh?_

Agora vamos converter _byte a byte_ do nosso programa:

```
10111111 00000001 00000000 00000000 00000000   
10111000 00111100 00000000 00000000 00000000  
00001111 00000101                            
```

* 10111111 = _(1 x 2^7) + (0 x 2^6) ..._ = **191**
* 00000001 = _(0 x 2^7) + (0 x 2^6) ... + (1 + 2^0)_ = **1**
* etc etc etc até chegar ao 12º byte

Temos então um programa convertido para decimal da seguinte forma:

```
191 1 0 0 0
184 60 0 0 0
15 5
```

Entretanto, não é comum representar sistema decimal para instruções de CPU, pois cada byte (8 bits) não seria dividido em partes iguais no sistema decimal, o que poderia causar um _desalinhamento_, criando buracos desnecessários na memória.

> Uma forma de ver este problema é que o sistema decimal composto de 10 símbolos não é divisível por 8 (resto 2), que é a quantidade de bits em um byte

E se tivéssemos um sistema de numeração com uma _quantidade de dígitos_ que fosse divisível por 8? 

Sabendo que 16 é divisível por 8 (resto 0) e não causaria desalinhamento entre bits pra representar um programa, será que existe um sistema de numeração de 16 símbolos para podermos **compactar ainda mais** a representação textual do nosso programa?

Sim, estamos falando do **sistema hexadecimal**.

### 🔵 Hexadecimal, o queridinho dos computadores
Certamente você já ouviu falar, viu ou até praticou hexadecimal. Similar ao que fizemos com sistema decimal, vamos esquecer tudo o que sabemos sobre hexadecimal e aplicar algumas regras. 

Quantos símbolos temos à disposição? 16.

> Daí o nome: **hexa**, representando 6, e **decimal** representando 10. DEZ + SEIS!!!!!111

Os primeiros 10 símbolos são exatamente como no decimal:

```
0 1 2 3 4 5 6 7 8 9
```
E quanto aos 6 **símbolos** restantes? Poderíamos representar emojis, gifs animados ou derivados de batata, mas seria muito mais simples representarmos as primeiras 6 letras do alfabeto, não?

```
0 1 2 3 4 5 6 7 8 9 A B C D E F
```

As regras pra combinar são as mesmas, sempre do mais à esquerda possível:

```
0 1 2 3 4 5 6 7 8 9 A B C D E F
10 11 12 13 14 15 16 17 18 19 ?
```
Qual seria o próximo? 20?

> Não, jovem, vamos combinar com as letras restantes

```
...
19
1A
1B
1C
1D
1E
1F
```
Agora sim, as combinações com o dígito 2:

```
20 21 22 23 24 25 26 27 28 29 2A 2B 2C 2D 2E 2F 
30 31 32 33 34 ............................. 3F 
...........................99................9F
100
```

Com apenas 2 dígitos no sistema hexadecimal, podemos ter 256 combinações de números diferentes!

* em binário, 2 dígitos = 4 combinações
* em decimal, 2 dígitos = 100 combinações
* em hexa, 2 dígitos = 256 combinações

Por exemplo, para termos 256 combinações com 2 símbolos `FF`, precisaríamos de 8 símbolos `1111 1111` no sistema binário, **obviamente ocupando mais espaço** pra representar e visualizar programas.

_O céu é o limite 🚀_

Aplicando regra de exponenciação para convertermos pra decimal, vamos ter o seguinte:

* do 0 ao 9 é tudo igual
* A = 10, B = 11, C = 12, D = 13, E = 14, F = 15

Onde:

_dígito do sistema * 16^posição do dígito_

Com isto, convertendo `1A` e `FF` para decimal, ficaria:

* 1A = _(1 * 16^1) + (10 * 16^0)_ = 16 + 10 = **26**
* FF = _(15 * 16^1) + (15 * 16^0)_ = 240 + 15 = **255**

> Ok, mas precisamos converter de binário para hexa

Com razão, como podemos converter o byte **11111111** para hexadecimal? Dá pra fazer por dedução da conversão decimal, por exemplo:

* sabendo que o byte **11111111** representa 255 em decimal, e sabendo que `FF` em decimal é 255,  portanto concluímos que `11111111 = FF`
* se dividirmos o byte em 2 partes, podemos calcular que `1111 = F`, portanto chegamos no mesmo resultado

Geralmente empregamos a técnica de dividir o byte em 2 partes de 4 bits cada. Assim fica mais fácil visualizar.

O simples programa original escrito em binário, fica então convertido em hexadecimal da seguinte forma:

```
BF 01 00 00 00 
B8 3C 00 00 00 
0F 05          
```

Opa! Já conseguimos ter uma leitura mais intuitiva, certo? Mas que raios significa `BF 01`, `B8 3C` ou `0F 05` na CPU?

### 🔵 Opcodes
Cada CPU possui uma arquitetura específica. Falando de x64 (ou x86_64), esta traz um conjunto de **opcodes** no manual que representam as instruções disponíveis, registradores entre outras operações de CPU.

De acordo com o [manual](http://ref.x86asm.net/coder64.html):

* o opcode `BF` move um valor imediato para o registrador RDI
* `01 00 00 00`: valor imediato hexa que representa `1` em decimal, mas na ordem inversa no formato **little-endian** (vamos falar de endianness mais a seguir)
* o opcode `B8` move um valor imediato para o registrador RAX
* `3C 00 00 00`: valor imediato hexa que representa `60` em decimal, mas na ordem inversa no formato **little-endian**
* o opcode `0F 05` entra no modo "kernel" do SO e aguarda a resposta de uma chamada de sistema (syscall)

Mas por quê os bytes são representados na ordem inversa nesta arquitetura de CPU?

### 🔵 Endianness
O conceito de **endianness** está relacionado com a forma que CPU's lêem e processam bytes na memória.

Vamos trazer o exemplo de um byte em binário, `10000001`, que sabemos que é `129` em decimal. Prestando atenção nos expoentes:

_2^7 + 2^6 + 2^5 + 2^4 + 2^3 + 2^2 + 2^1 + 2^0_

* o bit mais à esquerda, _1 x 2^7_ = 128
* somado com o bit mais à direita, _1 x 2^0_ = 1
* o restante dos bits está tudo a zero, não precisam entrar pra soma

Podemos inferir que os bits mais à direita _não têm tanto peso_ no valor final, por isso são chamados **bits menos significativos**.

> O bit da direita incorporou apenas o valor **1** pro resultado final

Da mesma forma, os bits mais à esquerda _têm mais peso_ no valor final, por isso são chamados de **bits mais significativos**.

> O bit da esquerda incorporou **128** pro resultado final, trazendo mais significância

Esta propriedade de definir significância de bits é chamada de _endianness_. Diferentes arquiteturas de CPU podem decidir ler do mais significativo ao menos significativo (padrão intuitivo de leitura, big-endian) ou do menos significativo ao mais significativo (little-endian).

A decisão passa por fatores históricos ou por facilitar manipulação de ponteiros. Diferentes sistemas podem decidir por inverter a leitura/escrita ou não dos bytes.

Na CPU x86_64, o formato é **little-endian**, portanto em hexa o valor de 4 bytes `00 0D 00 3C` passa a ser `3C 00 0D 00` no formato little-endian.

Concluindo, vamos adicionar comentários ao nosso pseudo-programa:

```
BF 01 00 00 00  ; MOVE 1 PARA RDI
B8 3C 00 00 00  ; MOVE 60 PARA RAX
0F 05           ; CHAMADA DE SISTEMA (SYSCALL)
```

Como a CPU sabe qual syscall deve executar? Por padrão, o número da syscall fica no registrador `RAX`. E como saber qual o número da syscall?

Neste [link](https://x64.syscall.sh/), temos uma lista completa de todas as syscalls da arquitetura x64, e ali podemos conferir que a syscall `exit` do kernel representa o número 60 decimal, ou _3C_ hexa. É exatamente o que a instrução `B8 3C` está fazendo! 

Mais a seguir neste artigo vamos aprofundar no mundo das syscalls e chamadas do kernel.

---

## Nosso segundo programa
Até agora vimos apenas o código de máquina de um programa que não faz nada (apenas termina), mas foi bastante útil para entendermos sistema binário, hexadecimal e outros conceitos.

> Continuaremos ainda explorando código de máquina. Não precisa escrever nada, mas pode acompanhar com o [código que disponibilizei](https://github.com/leandronsp/monica/blob/main/example) no início do artigo e rodar os comandos em Linux

Vamos agora elaborar um hipotético programa que imprime "Hello, World" na saída (STDOUT). Para isto, devemos:

* alocar memória para a string "Hello, World"

> Sim, dados ficam na memória junto com o programa, lembra?

* escrever a string na saída STDOUT, que é a saída padrão do programa (em outras palavras, a "tela")

> Se quiser mais detalhes do que é STDOUT, standard streams e redirecionamento de streams, sugiro ler [outros artigos](https://leandronsp.com/articles/entendendo-unix-pipes-3k56) que escrevi sobre UNIX pipes

* terminar o programa

_Alocar, imprimir, terminar_. Escrever no STDOUT é uma chamada de sistema, e terminar o programa é **outra** chamada de sistema. Portanto, temos:

* uma alocação de dados na memória do programa
* 2 chamadas de sistema

### 🔵 Alocando dados na memória do programa
Em linguagem de máquina, fazemos alocação byte a byte, e sabendo que queremos alocar "Hello, World" _literalmente_, como representar cada letra, o caracter _vírgula_ e o caracter _espaço_ na memória?

Precisamos de uma tradução dos caracteres para representação decimal ou hexadecimal. É isso mesmo que você está lendo, vamos entrar em **ASCII**.

### 🔵 ASCII
ASCII (American Standard Code for Information Interchange), é um padrão para codificação de caracteres em comunicação eletrônica, criado nos anos 60.

O padrão ASCII estabeleceu inicialmente 7 bits para cada caracter e foi concebido para suportar caracteres presentes somente na língua inglesa. Por conta desta limitação, tem suporte para um máximo de 128 caracteres (2^7) que abordam os dígitos decimais, caracteres especais e letras do alfabeto, maiúsculas e minúsculas.

![tabela ASCII](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/t80bwvjweywmtmghmnvt.png)

Mais tarde veio uma extensão da tabela com um bit a mais portanto suportando mais caracteres como acentuações, porém ainda com limitações para suportar outros idiomas e caracteres especiais.

Tempos depois surgiu o padrão **Unicode**, que adiciona a capacidade de codificação de tamanho variável, permitindo assim uma multitude de caracteres e alfabetos de diversos idiomas.

> Unicode também contempla a mesma tabela ASCII nos primeiros 128 caracteres por questões de retrocompatibilidade em sistemas. Portanto, apesar de sistemas modernos utilizarem esquemas de codificação Unicode tais como UTF-8, neste artigo focaremos na terminologia ASCII por ser suficiente nos nossos exemplos

Podemos verificar na tabela ASCII que os códigos hexa de cada caractere da nossa string são:

```
H: 0x48     
e: 0x65     
l: 0x6C     
l: 0x6C     
o: 0x6F
,: 0x2C
[space]: 0x20
W: 0x57
o: 0x6F
r: 0x72
l: 0x6C
d: 0x64
[newLine]: 0xA
```

> **0x** é uma notação, um prefixo para determinar que o número depois de _x_ é um hexadecimal

Com isto podemos então escrever os primeiros bytes hexa do nosso programa:

```
48 65 6C 6C 6F 2C 20 57 6F 72 6C 64 0A
```

Nice, agora vamos "montar" as instruções para a syscall que _escreve no STDOUT_. Como o kernel faz isso? 

### 🔵 Syscalls
Syscalls são **chamadas de sistema** onde o programa sai do modo "user" e entra no modo "kernel". Basicamente, o programa fica à espera que o kernel do sistema operacional execute a função que foi solicitada.

Apesar de [neste link](https://x64.syscall.sh/) estar tudo compilado, temos que entender um fator muito importante sobre o kernel que estamos trabalhando, e se trata do **kernel Linux**.

O [kernel Linux](https://en.wikipedia.org/wiki/Linux_kernel) foi escrito em C na virada da década de 80 para 90, e por ser escrito em C, todas as chamadas de sistema são declaradas em C.

Por exemplo, no [manual de system calls](https://man7.org/linux/man-pages/index.html) do kernel podemos pesquisar sobre qualquer chamada de sistema ou comando utilitário.

A chamada que queremos utilizar pra escrever no STDOUT se chama [write](https://man7.org/linux/man-pages/man2/write.2.html), e é definida pela função:

```c
ssize_t write(int fd, const void buf[.count], size_t count);
```

...que está presente na biblioteca padrão C (libc), que o kernel incorpora. 

Para distribuições GNU, que é o meu caso utilizando Ubuntu, há um repositório mirror do `glibc` que é a biblioteca padrão em C para sistemas GNU/Linux.

Repara que a função `write` espera 3 argumentos:

* `fd`, ou file descriptor, que no nosso caso é o STDOUT, representado pelo valor 1

> 💡 **STDIN** representa 0 e **STDERR** representa 2. Tá lá no nosso outro artigo sobre Bash e UNIX pipes, corre dar uma olhada

* `buf`, ou buffer, que é o ponteiro para o início do buffer de dados. No caso de escrever "Hello, World" com quebra de linha, o buf apontaria para o início da string "Hello, World\n" na memória.
* `count`, que é o tamanho do buffer de dados a ser escrito. Para a string "Hello, World\n", o count seria 13, pois isso inclui os 12 caracteres da string mais 1 byte para a quebra de linha.

### 🔵 Montando a syscall write

Para montar uma chamada de sistema, é necessário seguir uma _interface_ que determina como um programa deve comunicar com o sistema operacional.

Quem determina isto é a ABI (Application Binary Interface), que define como estruturas de dados ou funções computacionais conversam entre si. 

Como precisamos chamar uma função do kernel Linux, vamos utilizar as [convenções determinadas](https://en.wikipedia.org/wiki/X86_calling_conventions) por este sistema operacional e a arquitetura da CPU em questão.

Com isto, podemos montar as instruções utilizando registradores para a syscall `write`. Novamente seguindo [esta tabela](https://x64.syscall.sh/
) (que ajuda muito), vamos fazer instrução por instrução:

👉 **ARG0**
O primeiro argumento da função vai no registrador RDI, e aqui vamos colocar o valor `1` que representa o _file descriptor_ STDOUT. Em hexa, o [manual x86](http://ref.x86asm.net/coder64.html) diz que o opcode hexa é `BF`, seguido do hexa `00 00 00 01` em formato little-endian:

```
BF 01 00 00 00
```

👉 **ARG1**
O segundo argumento é o ponteiro para o buffer onde começa a string na memória, movido para o registrador RSI. 

Como a string fica no começo do programa, geralmente este endereço fica em `0x401000`. Portanto, o opcode para o `move` no registrador é `48 BE` e o valor do endereço de memoria no formato little-endian em hexa, `00 10 40`

```
48 BE 00 10 40 
```

👉 **ARG2**
Já o terceiro argumento da função vai para o registrador RDX, que representa o tamanho do buffer em bytes a ser escrito no file descriptor definido no registrador RDI (ARG0).

O opcode é o `BA` e o valor é `13` em hexa, que é `00 00 00 0D` só que no formato little-endian:

```
BA 0D 00 00 00
```

Agora, vamos colocar no registrador RAX o número da syscall **write**, que de acordo com [esta tabela](https://x64.syscall.sh/) (sempre esta tabela, habitue-se a ela), é o número 1, mas em hexa e little-endian:

```
B8 01 00 00 00
```

> Falei bastante desta tabela, de syscalls e little-endian aqui, nos próximos artigos vou falar cada vez menos. A ideia é focar em outras coisas e estes detalhes estarem já bem fundamentados

Por último, vamos montar a instrução da syscall em si, que é o opcode:

```
0F 05
```

Trecho final da syscall write:

```
48 65 6C 6C 6F 2C 20 57 6F 72 6C 64 0A ; "Hello, World"

BF 01 00 00 00                 ; MOV 1 para RDI
48 BE 00 10 40                 ; MOV 0x401000 para RSI
BA 0D 00 00 00                 ; MOV 13 para RDX
B8 01 00 00 00                 ; MOV 1 para RAX (write)
0F 05                          ; SYSCALL
```

A syscall `write` já tá montada, agora falta terminar o programa.

### 🔵 Montando a syscall exit
A API da chamada de sistema **exit** pode ser consultada no [manual](https://man7.org/linux/man-pages/man2/_exit.2.html), e tem a seguinte assinatura no `glibc`:

```c
void _exit(int status);
```

👉 **ARG0**
O primeiro argumento é o status de término, que de acordo com a especificação [POSIX](https://en.wikipedia.org/wiki/POSIX), pode ser qualquer inteiro de 0 a 255 mas sendo o 0 indicando que o progama terminou sem erros.

```
BF 00 00 00 00
```

Agora, vamos ao trecho final da syscall _exit_:

```
BF 00 00 00 00          ; MOV 0 para RDI
B8 3C 00 00 00          ; MOV 60 para RAX (exit)
0F 05                   ; SYSCALL
```

Programa completo:

```
48 65 6C 6C 6F 2C 20 57 6F 72 6C 64 0A
BF 01 00 00 00 
48 BE 00 10 40
BA 0D 00 00 00 
B8 01 00 00 00 
0F 05          
BF 00 00 00 00 
B8 3C 00 00 00 
0F 05          
```

Tomando como exemplo o [binário que disponibilizei](https://github.com/leandronsp/monica/blob/main/example), ele tem mais bytes por conta de headers necessários para o próprio sistema operacional admitir o programa. 

Vamos executar o binário:

```bash
$ ./example

Hello, world
```

_Yay! Que dia, hein?_

---
## Manipulando o nosso programa
Com o arquivo binário em mãos, e sugiro baixar do [repositório](https://github.com/leandronsp/monica/blob/main/example), vamos utilizar o utilitário `xxd` que faz um dump de hexa de qualquer binário, e com ele podemos reparar que o binário vai ter, a partir do byte _4096_, a mesma quantidade de bytes que escrevemos aqui neste artigo:

```bash
xxd -s 4096 -g1 -c8 -l52 example

00001000: 48 65 6c 6c 6f 2c 20 57  Hello, W
00001008: 6f 72 6c 64 0a bf 01 00  orld....
00001010: 00 00 48 be 00 10 40 00  ..H...@.
00001018: 00 00 00 00 ba 0d 00 00  ........
00001020: 00 b8 01 00 00 00 0f 05  ........
00001028: bf 00 00 00 00 b8 3c 00  ......<.
00001030: 00 00 0f 05              ....
```

_Maravilhoso, não?_

E por fim, antes de concluir este artigo que por si só dá quase uma saga, vamos alterar o binário direto em código de máquina utilizando o utilitário `hexedit`.

> Esta dica peguei em [vídeos do Blau Araújo](https://www.youtube.com/@debxp). Ele é realmente fantástico e traz conteúdo de primeira. Pra mim é a melhor referência para conteúdo de baixo nível em pt-BR

Para mudar o binário, rodamos o comando:

```bash
hexedit --color example
```
Que vai abrir um editor bastante específico. Com `/`, podemos buscar por um hexa, por exemplo "48", que vai levar para o início da string. 

Vamos trocar o "W" maiúsculo por "w" minúsculo, diretamente em código de máquina, que significa trocar o byte **57** da tabela ASCII por **77**:

Então:
```
48 65 6C 6C  6F 2C 20 57  6F 72 6C 64  0A 
```
Passa a ser:
```
48 65 6C 6C  6F 2C 20 77  6F 72 6C 64  0A 
```
Gravar o arquivo com **ctrl+s** e depois **ctrl+c** para sair. Executar novamente e:

```bash
$ ./example

Hello, world
```

_MEO DEOS, impressionante!!!!111_

---
## A vida de quem programa é assim?
Leitores mais atentos devem estar se perguntando:

> É sempre assim a vida de quem programa? Ficar escovando bits e mudar diretamente código de máquina em hexadecimal?

Para a maioria esmagadora dos casos, não.

E se a gente criasse um programa tradutor que nos permitisse _montar as instruções_ em uma linguagem mais _human-friendly_ e traduzisse para o código de máquina tal o que vimos aqui neste artigo?

Estamos falando de **assemblers**, que são montadores que permitem escrever em uma linguagem de montagem específica de uma arquitetura (um assembly) e converter para os opcodes, as instruções de CPU.

Reforçando, nesta saga vamos focar no montador NASM para a linguagem Assembly x86 de 64-bits em sistemas GNU/Linux.

---
## Conclusão
Jornada longa essa, hein? Este artigo cobriu diversos conceitos fundamentais, tais como sistema binário, hexadecimal, opcodes, syscalls, libc, ASCII...

Estes conceitos fundamentam o entendimento para escrever código Assembly, que será o tema principal dos próximos artigos.

No próximo artigo, vamos abordar conceitos básicos de Assembly, buscando converter o simples programa que fizemos neste artigo em um **asm** (atalho pra dizer "assembly") bem organizadinho. 

Em seguida, iremos entrar nas syscalls de socket, bind e accept justamente para montarmos o código do nosso web server. Vamos também manipular buffer de arquivos, alocar dados dinamicamente na memória, trabalhar com threads, locks, criar fila na mão, enfim, ainda há muita coisa por vir. Isto aqui é apenas _a ponta do iceberg_.

Não será um tutorial, mas vamos falar de mnemonics, endereçamento de memória, segmentos de memória, layout de memória de um programa, debugging com **gdb** entre outras coisas.

Fiquem ligades!

---

## Referências

<sub>
Blau Araújo, material de curso de Assembly
https://codeberg.org/blau_araujo/assembly-nasm-x86_64/raw/branch/main/pdf/aula01.pdf
Felix Cloutier, "x86 instruction reference"
https://www.felixcloutier.com/x86/
ASCII Table
https://upload.wikimedia.org/wikipedia/commons/thumb/1/1b/ASCII-Table-wide.svg/2560px-ASCII-Table-wide.svg.png
POSIX, Wikipedia
https://en.wikipedia.org/wiki/POSIX
ASM x86 Manual
http://ref.x86asm.net/coder64.html
Syscalls table
https://x64.syscall.sh/
Linux Kernel, Wikipedia
https://en.wikipedia.org/wiki/Linux_kernel
ABI, Wikipedia
https://en.wikipedia.org/wiki/Application_binary_interface
x86 calling conventions
https://en.wikipedia.org/wiki/X86_calling_conventions
</sub>
