---
title: "Vencendo os números de ponto flutuante: um guia de sobrevivência"
slug: "vencendo-os-numeros-de-ponto-flutuante-um-guia-de-sobrevivencia-4n7n"
published_at: "2023-06-06 04:05:36Z"
language: "pt-BR"
status: "published"
tags: ["computerscience", "braziliandevs"]
---

## TL;DR

Se quer poupar tempo e ir direto ao assunto, para cálculos precisos, prefira decimais de precisão arbitrária ou equivalentes como BigDecimal em vez de números de ponto flutuante.

Além disso, evite arredondamentos desnecessários. Quando necessário, limite o arredondamento apenas na etapa final para manter o máximo de precisão possível.

> Se você tá sem tempo, pode parar por aqui pois estas dicas já são suficientes para a maioria das pessoas

_Mas se você tem curiosidade em entender mais sobre este assunto, sugiro continuar nesta viagem aos números de ponto flutuante_.

---

## Sumário

* [Prólogo](#prólogo)
* [First things first](#first-things-first)
* [Bits não são suficientes](#bits-não-são-suficientes)
* [Bits e inteiros](#bits-e-inteiros)
* [Bits e outros números reais](#bits-e-outros-números-reais)
* [Representação de ponto fixo](#representação-de-ponto-fixo)
* [Representação de ponto flutuante](#representação-de-ponto-flutuante)
* [Problemas e padrões](#problemas-e-padrões)
* [Tipos de dados de ponto flutuante](#tipos-de-dados-de-ponto-flutuante)
* [Problemas de ponto flutuante na prática](#problemas-de-ponto-flutuante-na-prática)
* [Decimais ao resgate](#decimais-ao-resgate)
* [Cuidado com o arredondamento](#cuidado-com-o-arredondamento)
* [Decimais em outras tecnologias](#decimais-em-outras-tecnologias)
* [Conclusão](#conclusão)
* [Referências](#referências)

---

## 📜 Prólogo
Ah, sim, números de **ponto flutuante**.

Essas coisinhas que frequentemente aparecem em conteúdos técnicos, cheios de notações científicas e explicações complexas.

É quase certo que toda pessoa que está envolvida com software já tenha se deparado com a noção de que trabalhar com números de ponto flutuante pode ser **perigoso**, resultando em resultados de aritmética **imprecisos**, entre outros problemas.

No entanto, compreender todas as razões subjacentes por trás desse _tópico crucial em ciência da computação_ pode ser desafiador para muitos.

No post de hoje, iremos aprofundar nos **problemas que os números de ponto flutuante abordam** e explorar as **armadilhas envolvidas**.

Então, pegue uma garrafa de água refrescante e embarque nesta jornada rumo à essência dos números de _ponto flutuante_.

---

## 👍🏼 First things first
Computadores só entendem **linguagem de máquina**.

_Linguagem de máquina_ é uma coleção de "bits" que contém dados e instruções para a CPU. Representamos esses bits como **bits binários** e, como tal, é chamado de **sistema numérico binário** (0 e 1).

```bits
01001001 01001000 11001011 01000001 01001000 10001000
01011001 01001000 01000001 01101001 01001000 01001001
11000001 10001000 01001001 11001010 10001000 01001000
11001001 01001000 11001001 01001000 01001000 01001001
```

Programar diretamente em linguagem de máquina é altamente propenso a erros e muitas vezes ineficiente em diversos cenários. Para lidar com isso, as **linguagens assembly** foram introduzidas ao longo dos anos, servindo como uma ponte entre as especificidades da arquitetura da CPU e um conjunto de instruções de alto nível.

Uma **linguagem assembly** (ou simplesmente **Assembly**) é traduzida em código de máquina por meio de um programa dedicado chamado **Assembler**. Cada arquitetura de CPU geralmente tem seu próprio assembler associado a ela.

Isso permite que programadores trabalhem com um conjunto de instruções mais gerenciável e legível para humanos, que é então traduzido em código de máquina específico para a arquitetura do processador.

```assembly
section .data
    number1 dd 10      ; Define o primeiro número como um float de 32 bits
    number2 dd 20      ; Define o segundo número como um float de 32 bits

section .text
    global _start
_start:
    ; Carrega o primeiro número no registro xmm0
    movss xmm0, dword [number1]
    
    ; Carrega o segundo número no registro xmm1
    movss xmm1, dword [number2]
.....
.....
```

Os avanços no campo da engenharia de computação abriram caminho para o desenvolvimento de linguagens de programação cada vez mais de alto nível que podem ser traduzidas diretamente em instruções de código de máquina.

Ao longo das décadas seguintes, surgiram linguagens como **C, Java e Python**, entre outras, permitindo que cada vez mais pessoas pudessem escrever programas para computador sem necessariamente saber os detalhes de sua arquitetura de CPU.

Essa conquista significativa teve um impacto profundo na indústria, à medida que os computadores se tornaram mais compactos e rápidos, capacitando práticas modernas de engenharia de software para oferecer um valor substancial aos negócios em todo o mundo.

Computadores entendem **bits**, mas seres humanos se comunicam muito além de bits.

---

## 🔵 Bits não são suficientes
Como mencionado anteriormente, os computadores entendem apenas **bits binários**.

Nada mais neste mundo pode ser interpretado por computadores.

Bits. Nada mais.

> 💡 Na verdade, CPUs de computadores eletrônicos entendem apenas a ausência ou presença de tensão, permitindo-nos representar informações usando 0 e 1 (desligado e ligado).

No entanto, a vida real traz desafios em que programas de computador, criados **por pessoas para pessoas**, precisam representar um conjunto mais amplo de caracteres além de apenas 0s e 1s. Isso inclui letras, números decimais, números hexadecimais, caracteres especiais, sinais de pontuação e até mesmo emojis como este 😹.

Conjuntos de caracteres padrão, como os esquemas **ASCII** e **Unicode**, resolvem o desafio de representar números, letras, caracteres especiais, emojis e muito mais dentro do sistema binário.

> ⚠️ Explorar as complexidades da codificação de caracteres com ASCII e Unicode está além do escopo deste artigo. Isto será abordado em futuros posts

_Aqui, nosso foco será especificamente como os computadores trabalham com números na memória_, particularmente números **inteiros**.

---

## 🔵 Bits e inteiros

Vamos utilizar o número _65_ como exemplo. Ele é representado no sistema de numeração **decimal** (base 10), tornando-o um _número real_.

Além disso, ele é classificado como um **número inteiro**.

Ao realizar conversões com base em potências de 2, podemos representar o inteiro 65 como `01000001` em formato binário de 8 bits. Essa representação binária pode ser convertida de volta e para o valor decimal 65.

De uma _perspectiva matemática_, como **65 é um número inteiro**, ele cabe em um único byte (8 bits). Além disso, realizando potências de 2, sabemos que um único byte pode acomodar 256 números:

```
2^8 = 256
```

Falando de forma simplificada, alguém pode assumir que um único byte pode representar inteiros de 0 a 255.

No entanto, inteiros devem representar números _negativos e positivos_. Com isso, como devemos distribuir igualmente esses inteiros em um único byte? 

Empregando uma técnica chamada **complemento de dois**.

### 👉 Complemento de dois

Para distribuir igualmente números inteiros negativos e positivos não fracionários dentro de 8 bits, podemos usar uma técnica chamada **complemento de dois**. Nesta técnica:

* o bit mais à esquerda serve como o **bit de sinal**, indicando se o número é positivo ou negativo
* todos os bits são *invertidos* ou *complementados*
* em seguida, **adicionamos 1** ao valor resultante

Desta forma, um único byte representa inteiros que variam de -128 a 127.

```
2^8 = 256

-127, -126, -125...127, 128
```

### 👉 Utilizando dois bytes para representar inteiros
Ao empregar a técnica do complemento de dois, também podemos representar um intervalo de inteiros usando dois bytes (16 bits). 

Utilizando o conceito de potências de 2, podemos observar que **dois bytes podem acomodar um total de 65536 valores** diferentes:

```
2^16 = 65536
```

Considerando números negativos, o intervalo se estende de -32768 a 32767, inclusive.

Agora, vamos explorar alguns exemplos utilizando o **PostgreSQL**. 

Se você, como eu, é da turma dos _containers_, ter um PostgreSQL server prontinho pra ser utilizado é mamão com açúcar:

```bash
$ docker run --rm -d \
  --name postgres \
  -e POSTGRES_HOST_AUTH_METHOD=trust \
  postgres 
```

Em seguida, acesse o terminal `psql` com o seguinte comando:

```bash
$ docker exec -it postgres psql -U postgres
```

> O quê você está esperando para ir logo aprender sobre [containers](https://dev.to/leandronsp/thinking-like-containers-3k24)?

No PostgreSQL, o tipo de dado que representa um inteiro de dois bytes é chamado **int2** ou **smallint**:

```sql
SELECT 65::int2;
 int2
------
   65
```

Para verificar o tipo de dado, podemos usar a função `pg_typeof`:

```sql
SELECT pg_typeof(65::int2);
 pg_typeof
-----------
 smallint
```

Como **smallint** usa dois bytes, ele só pode acomodar o intervalo que mencionamos anteriormente em termos de bits e inteiros:


```sql
SELECT 32767::int2;
 int2
-------
 32767

SELECT -32767::int2;
 int2
-------
 -32767
```

No entanto, se tentarmos exceder o intervalo:

```sql
SELECT 32768::int2;
ERROR:  smallint out of range
```

_Incrível, não?_

Além do **smallint**, Postgres oferece uma variedade de outros tipos de dados inteiros:

| Tipo de Dado | Descrição                | Intervalo de Inteiros                     |
|--------------|--------------------------|-------------------------------------------|
| smallint     | Inteiro de dois bytes    | -32.768 a 32.767                          |
| integer      | Inteiro de quatro bytes  | -2.147.483.648 a 2.147.483.647            |
| bigint       | Inteiro de oito bytes    | -9.223.372.036.854.775.808 a 9.223.372.036.854.775.807 |

No entanto, todos nós sabemos que o mundo não é apenas composto por inteiros. Inteiros são um subconjunto de um conjunto mais amplo de números chamados **números reais**.

---

## 🔵 Bits e outros números reais

**Números reais** podem incluir inteiros, frações e decimais, tanto racionais quanto irracionais.

Por exemplo, _3.14159_ representa o número real **π** (pi), que é um número irracional. É um decimal _não repetitivo e não terminante_. O valor de π se estende infinitamente sem qualquer padrão em sua representação decimal.

```
3.14159265358979323846....
```

---

Suponha que tenhamos dois bytes (16 bits), que podem representar 65536 inteiros variando de -32768 a 32767.

Quando se trata de representar outros números reais, como decimais, podemos usar uma técnica chamada **ponto fixo** que, apesar de não ser eficiente, pode ser utilizada para fins didáticos neste post.

---

## 🔵 Representação de ponto fixo
Na representação de ponto fixo, dividimos os 16 bits fornecidos em três partes:

### 👉 Bit de sinal
O primeiro bit (mais à esquerda) representa o sinal, sendo 1 para negativo e 0 para positivo.

### 👉 Parte decimal
Os próximos 7 bits representam a parte decimal (fracionária), que pode ter uma precisão de até `0.992188` em nossa simulação:

```
2^-7 + 2^-6 + ... + 2^-1 =
0.992188
```

### 👉 Parte inteira
Os 8 bits restantes representam a parte inteira, que podem ir de -128 a 127 usando complemento de dois:

```
complemento_de_dois(
    2^7 + 2^6 + ... + 2^1 = 
    127
)
```

![ponto fixo](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/56igr6mlwimkho6vlllk.png)

Considerando que a parte inteira, usando 8 bits com complemento de dois, varia de -128 a 127, podemos concluir que, com a **representação de ponto fixo**, os decimais podem variar de **-128.992188 a 127.992188**.

No entanto, essa técnica pode nem sempre ser a mais eficiente. 

Portanto, vamos explorar outra técnica para representar decimais. Sim, estamos falando da mundialmente e amplamente utilizada **representação de ponto flutuante**.

---

## 🔵 Representação de ponto flutuante
Tomando como exemplo 16 bits, na representação de ponto flutuante, também dividimos os 16 bits em três grupos:

### 👉 Bit de sinal
O primeiro bit (mais à esquerda) é usado para representar se o número é negativo (1) ou positivo (0).

### 👉 Parte do expoente
A parte do expoente é atribuída aos próximos X bits. Em nossa simulação, vamos alocar 7 bits para esta parte, enquanto utilizamos o _primeiro bit do expoente_ como sendo o **sinal do expoente**.

Assim, a faixa para o expoente se estende de -63 a 63, acomodando valores negativos e positivos:

```
2^5 + 2^4 + ... 2^1 =
63
```

_Esta parte é crucial para definir a precisão aritmética na representação de ponto flutuante._

### 👉 Mantissa
A parte da **mantissa**, também conhecida como _significante_, usa os 8 bits restantes na nossa simulação, permitindo uma faixa de 1 até 255.

_Como não estamos representando a parte inteira nesta simulação, não é necessário aplicar complemento de dois à mantissa._

🔑 **Agora a parte importante**
Para calcular o maior número de ponto flutuante positivo, multiplicamos a mantissa pelo expoente. É aqui que entra o tal do "ponto flutuante":

```
mantissa X 2^expoente
``` 

Neste caso, o valor máximo positivo seria obtido multiplicando-se **255 por 2^6**, resultando em um número extremamente grande como **2351959869397967831040.0**.

Por outro lado, o número mínimo maior que zero pode ser representado como 1 multiplicado por **2^-63**, ou **0.00000000000000000010842021724855044340074528008699**.

![ponto flutuante](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/mof63oaed96584ajqvbg.png)

Observe que esta simulação é uma representação simplificada com precisão limitada e pode não refletir a precisão de formatos de ponto flutuante ideais ou padronizados.

---

## 🔵 Problemas e padrões
De fato, como mencionado anteriormente, **selecionar um número adequado de bits para a parte do expoente** na representação de ponto flutuante é crucial para mitigar problemas de arredondamento e truncamento ao lidar com números fracionários.

Padrões como o **IEEE 754** foram estabelecidos exatamente para abordar essas preocupações e fornecer um framework consistente para a representação de ponto flutuante. O padrão IEEE 754 define o número de bits alocados para o expoente, mantissa e sinal em formatos de precisão simples (32 bits) e dupla precisão (64 bits).

Esses padrões determinam a representação precisa dos vários componentes de um número de ponto flutuante, as _regras para operações aritméticas_ e como lidar com casos excepcionais.

### 👉 Precisão simples (4 bytes)
Os números de **precisão simples** são representados usando 32 bits de memória.

Eles incluem:

* 1 bit para o sinal do número
* 8 bits para o expoente
* 23 bits para a mantissa

De acordo com os padrões do IEEE, a precisão simples normalmente **manipula de 6 a 9 casas decimais de precisão**.

### 👉 Dupla precisão (8 bytes)
Os números de **dupla precisão** são representados usando 64 bits de memória.

Eles incluem:

* 1 bit para o sinal do número
* 11 bits para o expoente
* 52 bits para a mantissa

De acordo com os padrões do IEEE, a dupla precisão pode **manipular de 15 a 17 casas decimais de precisão**.

_Geralmente, a dupla precisão se encaixa melhor quando a alta precisão é necessária, mas esta por sua vez consome mais memória._

---

## 🔵 Tipos de dados de ponto flutuante
Muitas linguagens de programação e sistemas de banco de dados aderem aos padrões do IEEE 754, e com o PostgreSQL isto não é exceção.

Vamos ver como o Postgres implementa os tipos de dados de ponto flutuante na prática.

O tipo de dado **float4** segue o padrão de precisão simples do IEEE 754, que aloca 1 bit para o sinal, 8 bits para o expoente e 23 bits para a mantissa:

```sql
SELECT 0.3::float4;
 float4
--------
    0.3
```

Por outro lado, o tipo de dado **float8** segue o padrão de dupla precisão do IEEE 754, que aloca 1 bit para o sinal, 11 bits para o expoente e 52 bits para a mantissa:

```sql
SELECT 0.3::float8;
 float8
--------
    0.3

#####################

SELECT 0.3::float;
 float
--------
    0.3
```

_O tipo `float` padrão é equivalente à dupla precisão (float8)._

---

## ☣️ Problemas de ponto flutuante na prática
Vamos mergulhar em cálculos com números de ponto flutuante e ver os **possíveis problemas** na prática.

Considere uma simples soma de `0.1 + 0.2`:

```sql
SELECT 0.1::float + 0.2::float;

 0.30000000000000004
```

Este resultado mostra como problemas de precisão podem surgir em números de ponto flutuante de dupla precisão durante operações aritméticas. 

Mesmo seguindo padrões, não estamos imunes a esses desafios de cálculo com ponto flutuante.

No entanto, há uma estratégia alternativa que envolve um truque maroto utilizando **inteiros**.

### 💡 Um truque com inteiros

Em vez do tipo de dado _float_, podemos trabalhar com **inteiros**. Incorporamos um fator multiplicador com base em uma _escala decimal_ ao armazenar valores e, em seguida, dividimos pelo mesmo fator para restaurar a representação decimal original ao recuperar o valor.

Esse método permite cálculos decimais precisos usando inteiros e escala. O fator multiplicador deve ser escolhido com base na precisão decimal necessária.

Para demonstrar, vamos usar esse truque para realizar `0.1 + 0.2`, com o fator multiplicador **1000**:

```sql
SELECT (0.1 * 1000)::int + (0.2 * 1000)::int;

300
```

Aqui, cada entrada é multiplicada por `1000` e convertida para um inteiro. Para recuperar o valor original sem perder a precisão, dividimos por `1000`:

```sql
SELECT (300 / 1000::float);

0.3
```

_Uau, que técnica incrível!_ 🚀

No entanto, o uso de um fator multiplicador fixo pode ser ineficiente ao lidar com entradas que possuem diferentes casas decimais.

Em vez disso, uma **representação de escala variável** pode ser usada convertendo a entrada em uma string e analisando o número de dígitos decimais, fazendo assim com que o fator multiplicador seja dinâmico para cada número real.

Mas tenha cuidado, representações decimais de escala variável exigem **manipulação cuidadosa de cálculos complexos**, escala decimal precisa e várias outras sutilezas da aritmética decimal, que não é tão trivial.

É aqui que entram os **decimais**.

---

## 🔵 Decimais ao resgate

Decimais lidam com os desafios associados a cálculos aritméticos complexos envolvendo decimais. Ao passo em que eles _reduzem significativamente_ os problemas de precisão comumente encontrados em números de ponto flutuante.

Diversas linguagens de programação e sistemas de banco de dados implementam decimais. PostgreSQL oferece o tipo de dado **decimal**, que oferece uma precisão superior em comparação com floats.

```sql
SELECT 0.1::decimal + 0.2::decimal;
0.3
```

Os decimais também podem ser configurados para **precisão e escala arbitrárias**:

```sql
# Exemplo: aceita números de até 999.99
SELECT 0.1::decimal(5, 2);
0.10

SELECT 999.99::decimal(5, 2);
999.99
```

Convenientemente, o tipo de dado padrão para decimais no PostgreSQL é **numeric**, que é idêntico a _decimal_:

```sql
SELECT pg_typeof(0.1);

numeric
```

---

## ⚠️ Cuidado com o arredondamento

Arredondar números decimais programaticamente pode levar a resultados imprecisos. Por exemplo, a soma `25.986 + -0.4125 + -25.5735` teoricamente deveria resultar em zero:

```sql
SELECT 25.986 + -0.4125 + -25.5735;

0.0000
```

Vamos ilustrar como podemos **arredondar apenas a soma final** para duas casas decimais:

```sql
SELECT ROUND(25.986 + -0.4125 + -25.5735, 2);

0.00
```

_So far, so good_. Tudo funcionando como esperado.

Com tipos de dados adequados, como decimais, o problema aritmético inerente aos números de ponto flutuante já é resolvido.

Todavia, o **arredondamento introduz seu próprio conjunto de desafios**. Mesmo que os decimais sejam excelentes para a precisão e aritmética de dados decimais, as operações de arredondamento envolvem _algum grau de aproximação_.

Para simular um problema com arredondamentos desnecessários, vamos arredondar cada número decimal antes de somá-los:

```sql
SELECT ROUND(25.986, 2) + ROUND(-0.4125, 2) + ROUND(-25.5735, 2);

0.01
```

_OMG e agora?_ 😭

Cada vez que arredondamos um número, estamos adicionando um pouco de imprecisão. _Bit a bit_, o resultado final pode ficar longe do esperado, **pois a memória do computador é finita** e não é possível representar todas as casas decimais possíveis resultantes de uma aritmética arbitrária de números reais.

> Lembra do resultado da `mantissa X 2^expoente`?
Pois então...

Esses exemplos destacam por que **o arredondamento desnecessário deve ser evitado**. Como o arredondamento é uma aproximação, é melhor adiá-lo até a etapa final, ou seja, apenas quando formos _apresentar os dados ao usuário final_.

---

## Decimais em outras tecnologias
Cada linguagem de programação ou ferramenta possui seu próprio tipo de dados para lidar com precisão arbitrária, como os decimais do PostgreSQL.

Ruby oferece a classe [BigDecimal](https://ruby-doc.org/stdlib-2.5.1/libdoc/bigdecimal/rdoc/BigDecimal.html), que facilita a aritmética decimal de ponto flutuante de precisão arbitrária.

Da mesma forma, Java também inclui uma [classe BigDecimal](https://docs.oracle.com/javase/8/docs/api/java/math/BigDecimal.html) para este mesmo propósito.

Golang também não é exceção. Ela possui [aritmética decimal de precisão arbitrária](https://go.dev/src/math/big/decimal.go) que resolve os mesmos problemas.

É crucial verificar se a tecnologia que você está usando oferece suporte a precisão arbitrária como decimais. Se você precisar de uma precisão maior, estas soluções costumam ser mais adequadas do que o uso de números de ponto flutuante brutos.

Ao limite, se precisão for algo crítico para teu negócio e a tecnologia utilizada _não fornece tipos como os big decimals_ de precisão arbitrária, prefira então utilizar **números inteiros com fator multiplicador (100, 1000, 10000, etc)** que contemple as casas decimais suficientes para a precisão necessária.

---

## Conclusão
Neste post, exploramos as complexidades dos números de **ponto flutuante**.

Investigamos também como os computadores compreendem informações por meio do **sistema binário**, desde a representação de inteiros e a ineficiência da representação de ponto fixo para decimais, até chegar aos números de ponto flutuante e suas _limitações_.

Além disso, discutimos como os tipos de dados de precisão arbitrária, como os **decimais**, abordam esses problemas de precisão inerentes aos pontos flutuantes. 

Por fim, discutimos e compartilhamos as melhores práticas para lidar com problemas de _arredondamento_ de números decimais.

Espero que esses tópicos tenham sido apresentados de forma didática, tornando os problemas de ponto flutuante não mais um problema!

_Cheers!_

---

## Referências

https://docs.oracle.com/cd/E19957-01/806-3568/ncg_goldberg.html
https://www.postgresql.org/docs/current/datatype.html
https://en.wikipedia.org/wiki/IEEE_754
https://www.doc.ic.ac.uk/~eedwards/compsys/float/
https://en.wikipedia.org/wiki/Floating-point_error_mitigation
https://en.wikipedia.org/wiki/Single-precision_floating-point_format
https://en.wikipedia.org/wiki/Double-precision_floating-point_format
https://en.wikipedia.org/wiki/Decimal_floating_point
