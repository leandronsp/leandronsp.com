---
title: "Construindo um web server em Assembly x86, parte IV, um assembly modesto"
slug: "construindo-um-web-server-em-assembly-x86-parte-iv-um-assembly-modesto-oif"
published_at: "2024-05-13 11:33:03Z"
language: "pt-BR"
status: "published"
tags: ["computerscience", "braziliandevs", "assembly"]
---

Uma vez que temos [uma compreensão](https://dev.to/leandronsp/construindo-um-web-server-em-assembly-x86-parte-iii-codigo-de-maquina-bgk) sobre sistema binário, hexadecimal, ASCII e código de máquina, chegou o grande momento de entrarmos no assunto principal desta saga: **assembly**.

Vamos iniciar transportando o "Hello, World" feito em código de máquina para assembly x86 e, posteriormente, abordar um exemplo de programa que recebe argumento da linha de comando.

Ao longo deste artigo vamos aprender a base de conceitos como rótulos, segmentos de memória, *muito gdb*, layout de memória, **muita stack**, procedures (subrotinas, ou _funções_), loops, condicionais, flags, tipos de registradores e etc

Aperte os cintos, pois este será um artigo bem extenso. Sugiro ao leitor, - que tem interesse em aprender na prática com esta saga -, que tenha o ambiente preparado e que execute cada exemplo seguindo os passos aqui descritos.

Sem mais delongas, vamos ao que importa.

---

## Agenda

* [Humanizar é preciso](#humanizar-é-preciso)
	* [Mnemonics](#mnemonics)
* [Assemblers](#assemblers)
* [Nosso primeiro programa](#nosso-primeiro-programa)
	* [A chamada de sistema exit](#a-chamada-de-sistema-exit)
	* [Arquivos Objeto](#arquivos-objeto)
	* [Linker](#linker)
* [Depurando o programa](#depurando-o-programa)
	* [O utilitário size](#o-utilitário-size)
	* [Debugging com gdb](#debugging-com-gdb)
	* [Rastreando execução com strace](#rastreando-execução-com-strace)
* [Evoluindo nosso primeiro programa
](#evoluindo-nosso-primeiro-programa)
	* [Alocando bytes para "Hello, World"](#alocando-bytes-para-hello-world)
	* [Adicionando a chamada de sistema write](#adicionando-a-chamada-de-sistema-write)
	* [Layout de memória](#layout-de-memória)
	* [Definindo constantes](#definindo-constantes)
* [Um programa mais sofisticado](#um-programa-mais-sofisticado)
	* [Definindo labels](#definindo-labels)
	* [Desvio de fluxo com jump](#desvio-de-fluxo-com-jump)
	* [Desvio de fluxo com call](#desvio-de-fluxo-com-call)
	* [Brincando com pilhas](#brincando-com-pilhas)
	* [Calculando tamanho dinamicamente com loop](#calculando-tamanho-dinamicamente-com-loop)
	* [RFLAGS](#rflags)
	* [Botando mais pilha no negócio](#botando-mais-pilha-no-negócio)
	* [Depurando o programa final com strace](#depurando-o-programa-final-com-strace)
* [Falando um pouco de registradores](#falando-um-pouco-de-registradores)
	* [Propósito dos registradores](#propósito-dos-registradores)
	* [Registradores de propósito geral](#registradores-de-propósito-geral)
	* [Registradores especiais](#registradores-especiais)
	* [Precisamos sempre utilizar todos os 64 bits?](#precisamos-sempre-utilizar-todos-os-64-bits)
* [Uma side note sobre stack frames](#uma-side-note-sobre-stack-frames)
* [Conclusão](#conclusão)
* [Referências](#referências)

---

> Antes de iniciar, quero novamente deixar uma menção especial ao excelente [curso gratuito de Assembly x86](https://www.youtube.com/watch?v=Ej6U-qk0bdE&list=PLXoSGejyuQGohd0arC7jRBqVdQqf5GqKJ) do [Blau Araújo](https://www.youtube.com/@debxp). É importante reforçar o quanto este material dele é necessário e foi crucial para que eu pudesse fundamentar diversos conceitos explorados ao longo desta saga

## Humanizar é preciso

Como vimos no artigo anterior, CPU só entende código de máquina:

```
48 65 6C 6C 6F 2C 20 57 6F 72 6C 64 0A  ; Hello, World

BF 01 00 00 00     ; RDI ⬅️ 1
48 BE 00 10 40     ; RSI ⬅️ 0x401000
BA 0D 00 00 00     ; RDX ⬅️ 13
B8 01 00 00 00     ; RAX ⬅️ 1
0F 05              ; SYSCALL
BF 00 00 00 00     ; RDI ⬅️ 0
B8 3C 00 00 00     ; RAX ⬅️ 60
0F 05              ; SYSCALL
```
Entretanto, para uma pessoa desenvolvedora manter um programa em código de máquina, é preciso ter muita paciência e atenção ao detalhe, pelo que também manter programas assim é muito propenso a bugs.

Precisamos de alguma forma, representar cada instrução em código de máquina em uma linguagem mais "human-friendly". 

### Mnemonics

É aí que entram os **mnemonics**, que são uma forma textual de representar informações visando facilitar a memorização para o cérebro humano.

Ao invés de trabalharmos com `BF 01 00 00 00`, podemos trocar por `MOV RDI, 1`, que significa:

> estou movendo o valor imediato 1 para o registrador RDI

E assim vamos _montando_ instrução por instrução, tal e qual faríamos com código de máquina, mas utilizando uma _linguagem_ de fácil memorização.

Mas a CPU não entende essa "linguagem". Temos de construir um *programa* que faz a _tradução_ de mnemonics para _código de máquina_, ou seja, de `MOV RSI, 1` para `BF 01 00 00 00`.

![assembly](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/m7zzy20fad71wg461cpt.png)

Estamos falando de _montadores_, ou simplesmente **assemblers**.

---

## Assemblers

Ao longo do tempo, foram desenvolvidos diversos assemblers para diferentes arquiteturas. 

Para arquitetura x86, há diversos assemblers já construídos, GNU Assembler (as), NASM, FASM, pra mencionar alguns.

Assemblers para esta arquitetura em específico podem seguir 2 tipos de sintaxe que são predominantes:

* AT&T, desenvolvida pela AT&T corporation
* Intel, desenvolvida pela Intel

Nesta saga, vamos focar no Assembler **NASM** para arquitetura X86 64-bits (x64), com _sintaxe Intel_ e rodando em sistema GNU/Linux, como já mencionamos algumas vezes em artigos anteriores.

* Arquitetura x86_64 (x64)
* Sistema Operacional GNU/Linux (Ubuntu)
* Assembler NASM 2.16.01 
* GNU ld 2.38 (ligador, ou linker)
* Debugger GNU gdb 12.1
* strace 5.16 (tracing de syscalls)

Uma vez que definimos as ferramentas utilizadas, vamos seguir traduzindo o "Hello, World" para asm x86 enquanto entendemos o uso de cada uma delas.

> A partir de agora, quando me referir a Assembly ou simplesmente "asm", leia-se _Assembly x86_64_

---

## Nosso primeiro programa

Em Assembly, todo programa deve ter um ponto de entrada, também chamado de **entry point**:

```as
global _start

_start:
	; código do programa vai aqui
```

E a primeira coisa que nosso programa vai fazer é sair:

> kkkkkkkkkk

### A chamada de sistema exit

Brincadeiras à parte, a chamada de sistema que precisamos executar é a `exit`, definida da seguinte forma no `glibc`:

```c
void _exit(int status);
```

Com isto, temos de seguir a lógica para montar as instruções tal como fizemos com os opcodes, que seguindo  [a mesma tabela de syscalls](https://x64.syscall.sh/), é:

* nome da syscall vai em RAX
* primeiro argumento (o status de erro) vai em RDI

```as
global _start

_start:
	mov rdi, 0   ; error status
	mov rax, 60  ; nome da syscall: SYS_exit
	syscall       
```

Este programa simplesmente faz aquilo que mencionamos no artigo anterior: _que todo programa deve terminar_.

* `mov rdi, 0` move o valor imediato 1 para o registrador RDI; vai representar o error code da syscall **exit**: 0 para término sem erros
* `mov rax, 60` move o valor imediato 60 para o registrador RAX; vai representar o nome da syscall em si, **exit**
* `syscall` faz a chamada de sistema da syscall **exit**, definida em RAX

Para que o programa seja compilado, precisamos primeiro fazer a "montagem" das instruções com NASM:

```bash
$ nasm -f elf64 hello.asm -o hello.o
```

* `-f elf64`: arquitetura de destino, x64
* `hello.asm` input, ou seja, o arquivo que contém o código fonte
* `-o hello.o`: define saída para o arquivo `hello.o`

> Mas o quê é este arquivo `hello.o`?

### Arquivos objeto

Arquivo objeto (**Object File**) é um arquivo que contém código de máquina gerado por um assembler ou compilador.

Porém este arquivo ainda não é um _executável_ final, porque podemos querer combinar com outros arquivos objeto e bibliotecas nativas do SO.

A partir deste arquivo, que geralmente tem a extensão `.o`, podemos utilizar outro programa para "ligar" com outros arquivos, se necessário, no intuito de gerar um arquivo com código de máquina final e executável.

Este programa se chama **linker**, pelo que utilizaremos a versão padrão do `ld` que vem com o GNU no nosso sistema operacional GNU/Linux.

### Linker

_Linker_ é o programa responsável por, a partir de um ou mais arquivos objeto, gerar um arquivo final executável com o código de máquina.

Como já geramos anteriormente o arquivo objeto `hello.o` utilizando o assembler NASM, podemos concluir o processo de compilação do nosso programa fonte asm x86 com `ld`

```bash
$ ld hello.o -o hello
```

E agora, vamos rodar o binário final executável `hello`:

```bash
$ ./hello
echo $?
0
```

_Hurray!_ Nosso primeiro programa em Assembly concluído com sucesso!

Contudo, vamos lembrar de um ponto importante que vimos na parte II da saga: que o _programa e seus dados ficam na memória_. Queremos entender **o que está acontecendo na memória** com este simples programa. 

---

## Depurando o programa

Uma das etapas mais importantes, senão a mais  importante, em desenvolvimento de software, é a _depuração_ (ou debugging, em inglês). 

Depurar é o ato de conseguir interceptar a execução do programa, analisar o estado, alterar o estado, adicionar pontos de parada (breakpoints) entre outras técnicas. 

O processo de depuração também consiste em analisar a saída do programa como um todo, seu tamanho e trace de chamadas no sistema operacional.

### O utilitário size

Vamos iniciar o processo de depuração do nosso programa analisando o tamanho, com o utilitário GNU _size_:

```bash
$ size hello

   text    data     bss     dec     hex filename
     12       0       0      12       c hello
```

> Mas o quê significa "text, data, bss, etc"?

Cada programa no sistema operacional é dividido em _seções_, que representam alguma característica para o sistema operacional. 


![layout de memória](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/lv9edus1e9nxw4b24cxq.png)

**text**
Esta seção contém todo o código fonte do programa, e assim o SO sabe que precisa buscar esta seção na memória principal

**data**
Seção de dados inicializados na memória

**bss** 
Seção de dados não-inicializados na memória

O comando **size** traz justamente o tamanho (em bytes) de cada seção. 

> `dec` e `hex` não são seções, são apenas a representação do valor total (em bytes) tanto em decimal quanto hexadecimal

* `text`: esta seção contém todo o código fonte do nosso programa, também chamado de "texto"
* `data`: seção de dados inicializados, logo a seguir neste artigos entramos em detalhe
* `bss`: seção de dados não-inicializados, logo a seguir também falaremos deste
* `dec`: o tamanho total em decimal
* `hex`: o tamanho total em hexadecimal

Nosso programa por enquanto só tem a seção text, que é exatamente todo o código a partir do rótulo `_start`.

> Nossa, Leandro, nosso programa tem apenas 12 bytes?

Aparentemente sim. Vamos confirmar:

```bash
$ ls -lh hello

...... 4.6K ... hello
```

> Como assim o arquivo tem 4,6Kb? O programa não ocupa 12 bytes apenas? 

Bom, isto ocorre por causa dos headers que são adicionados pelo linker, que contém informação relevante para que o sistema operacional possa admitir a execução do arquivo.

Vamos novamente utilizar o comando `size` mas desta vez:

```bash
$ size --format sysv --radix 16 hello

hello  :
section   size       addr
.text    0xc   0x401000
Total    0xc
```

A opção `--format` indica o formato `sysv` que traz também os símbolos. E a opção `--radix 16` permite visualizar o tamanho de cada seção em hexadecimal.

Na seção size, `0xc` representa o número 12 em decimal. Nada de novo aqui. Mas se repararmos na coluna `addr`, temos um valor hexadecimal para a seção text (0x401000).

Já vimos isto no artigo anterior, que `0x401000` se referia ao endereço em hexadecimal de memória virtual que indica o início do programa, lembra?

Hora de confirmar isto com uma análise mais profunda na depuração, chegou o momento de utilizarmos GNU _gdb_.
### Debugging com GDB

GDB é um depurador (_debugger_ em inglês) que permite ver o que está acontecendo dentro de um programa *em execução*.

Com um depurador, podemos analisar as informações estáticas contidas no binário do programa, estabelecer *breakpoints* (pontos de parada) em qualquer parte do código, executar e analisar mudanças de estado do programa durante sua execução.

Para habilitar o programa com `gdb`, precisamos montar o programa com a opção `-g`, que exporta símbolos necessários para depuração:

```bash
$ nasm -g -f elf64 hello.asm -o hello.o
$ ld hello.o -o hello
```

Podemos verificar os símbolos exportados no binário com o comando size novamente:

```bash
$ size --format sysv --radix 16 hello

hello  :
section           size       addr
.text              0xc   0x401000
.debug_aranges    0x30        0x0
.debug_info       0x75        0x0
.debug_abbrev     0x1d        0x0
.debug_line       0x3d        0x0
Total            0x10b

##############

$ ls -lh hello
...... 5.1K ... hello
```

Como demonstrado acima, o binário agora contém seções adicionais de "debug" que serão utilizadas pelo _gdb_, e consequentemente o tamanho do programa teve um acréscimo de ~~500MB~~ 512 bytes!

Sem mais delongas, vamos entrar no `gdb`:

```bash
$ gdb --quiet

(gdb)
```

E agora, dentro do shell gdb, podemos utilizar diversos comandos de depuração. O comando `help` traz a lista de _classes de comandos_ disponíveis:

```
help

...
aliases -- User-defined aliases of other commands.
breakpoints -- Making program stop at certain points.
data -- Examining data.
files -- Specifying and examining files.
internals -- Maintenance commands.
obscure -- Obscure features.
running -- Running the program.
stack -- Examining the stack.
status -- Status inquiries.
support -- Support facilities.
text-user-interface -- TUI is the GDB text based interface.
tracepoints -- Tracing of program execution without stopping the program.
user-defined -- User-defined commands.
...
```

> Para o escopo deste artigo vamos utilizar apenas alguns comandos para depuração, mas a lista de comandos disponíveis é [gigante](https://visualgdb.com/gdbreference/commands/). Deixo o desafio ao leitor para se aventurar com o `help` do gdb e brincar de depurar qualquer binário executável

Como queremos depurar o binário _hello_, podemos carregar os símbolos utilizando o comando `file`:

```bash
(gdb) file hello
Reading symbols from hello...
(gdb)
```

O comando `info files` traz alguns insights:

```bash
(gdb) info files
Symbols from "/code/asm-x64/hello".
Local exec file:
        `/code/asm-x64/hello', file type elf64-x86-64.
        Entry point: 0x401000
        0x0000000000401000 - 0x000000000040100c is .text
(gdb)
```

Que interessante! O entry point do programa começa justamente em `0x401000`, que é o que está definido na seção `.text`.

Para visualizar o código fonte do programa, utilizamos o comando `list`:

```bash
(gdb) list
1       global _start
2
3       _start:
4               mov rdi, 0   ; error code
5               mov rax, 60  ; SYS_exit
6               syscall
(gdb)
```

> Lembrando que o programa ainda não está em execução, estamos apenas analisando o binário executável com o gdb

Com o comando `x`, de _examine_, podemos examinar o rótulo `_start` que é o ponto de entrada do programa:

```bash
(gdb) x _start
0x401000 <_start>:      0x000000bf
(gdb)
```

Se quisermos executar o programa, podemos fazê-lo com o comando `run`:

```bash
(gdb) run
Starting program: /code/asm-x64/hello
[Inferior 1 (process 7991) exited normally]
(gdb)
```

Entretanto, podemos definir breakpoints antes de executar, assim temos controle do estado do programa **em execução**:

```bash
# Aqui, definimos um ponto de parada no rótulo _start_
(gdb) break _start
Breakpoint 1 at 0x401000: file hello.asm, line 4.

# Info sobre breakpoints
(gdb) info breakpoints
Num     Type           Disp Enb Address            What
1       breakpoint     keep y   0x0000000000401000 hello.asm:4
(gdb)
```

Agora sim, vamos executar:

```bash
(gdb) run
Starting program: /code/asm-x64/hello

Breakpoint 1, _start () at hello.asm:4
4               mov rdi, 0   ; error code
(gdb)
```

O programa está parado na linha 4 como solicitado. Esta linha no código **não foi avaliada**, pelo que podemos analisar e alterar o estado do programa:

```bash
# Neste momento o valor no registrador RDI está 0 (default)
(gdb) info register rdi
rdi            0x0                 0

# Mudamos o valor do registrador para 42
(gdb) set $rdi = 42

# Agora verificamos que foi modificado diretamente do GDB
(gdb) info register rdi
rdi            0x2a                42
(gdb)
```

Para avaliar a linha atual, utilizamos o comando `next`:

```bash
(gdb) next
5               mov rax, 60  ; SYS_exit

# E podemos agora verificar que o valor de RDI foi modificado para 0, 
# conforme descrito no programa
(gdb) info register rdi
rdi            0x0                 0
(gdb)
```

Poderíamos continuar indo linha a linha com `next`, ou então continuar a execução do programa com `continue` que pára no próximo ponto de parada ou executa todas as instruções que faltam até terminar o programa.

```bash
# Inicia execução e pára no primeiro breakpoint definido
(gdb) run
Starting program: /Users/leandronsp/Documents/code/asm-x64/hello

Breakpoint 1, _start () at hello.asm:4
4               mov rdi, 0   ; error code

# Continua execução. Neste caso termina o programa pois
# não há mais breakpoints a partir deste ponto
(gdb) continue
Continuing.
[Inferior 1 (process 8000) exited normally]
(gdb)
```

Pronto, terminamos a demonstração do primeiro programa com `gdb`. Para sair, utilizamos o comando `exit`.

### Rastreando execução com strace

O utilitário `strace` permite rastrear todas as chamadas de sistema e sinais que um programa faz. É bastante útil quando queremos saber o que pode ter acontecido com determinada _syscall_, quais parâmetros foram enviados e o que a syscall retornou. 

```bash
$ strace ./hello

execve("./hello", ["./hello"], 0x7ffc504b5710 /* 24 vars */) = 0
exit(0)                                 = ?
+++ exited with 0 +++
```

Vamos entender a saída do **strace** por partes.

__execve("./hello", ["./hello"], 0x7ffc504b5710 /_ 24 vars _/) = 0:__

* `execve` é uma chamada do Linux que executa um determinado programa
* `./hello` é o caminho para o programa que será executado
* `["./hello"]` é a lista de argumentos passados para o programa. Como só há o nome do programa (que entra na lista _ARGV_), indica que este programa não recebe argumentos extras na linha de comando
* `0x7ffc504b5710` é o endereço de memória onde as variáveis de ambiente do processo em execução estão armazenadas
* `/* 24 vars */` indica que há 24 variáveis de ambiente definidas no shell atual
* `=0` é o resultado da chamada `execve`, o que significa que foi bem-sucedido e executado com sucesso

**exit(0) = ?:**

* `exit` é a chamada de sistema (syscall) feita no sistema operacional, e geralmente é definida no `libc`, sendo no caso de sistema GNU, `glibc`. Foi o valor _60_ passado para o registrador RAX, lembra?
* `(0)` é o parâmetro passado para a função, que neste caso foi o que determinamos no registrador RDI, indicando que nosso programa em execução vai terminar _sem erros_
* `= ?` indica que o resultado da chamada de sistema não é conhecido, ou seja não houve um retorno _explícito_ de valor da chamada de sistema

**+++ exited with 0 +++:**

* `+++` sinaliza o início de uma mensagem de saída do strace
* `exited with 0` indica que o programa terminou sem erros
* `+++` sinaliza o fim da mensagem de saída

Uma vez que entendemos como depurar nosso programa, podemos evolui-lo para imprimir a mensagem "Hello, World" na saída do terminal.

---

## Evoluindo nosso primeiro programa

Vamos agora evoluir o programa anterior para que possamos imprimir a mensagem "Hello, World" na saída padrão `STDOUT`.

Para isto, conforme vimos na parte III da saga, "Código de Máquina", vamos por partes.

### Alocando bytes para "Hello, World"

Precisamos primeiro definir os bytes de cada caracter da string em _hexadecimal_ de acordo com a tabela ASCII, que resulta em `48 65 6C 6C 6F 2C 20 57 6F 72 6C 64 0A`.

> 0x48 para "H", 0x65 para "e", 0x6C para "l" e assim por diante...

Portanto, se quisermos evoluir o primeiro programa que contém apenas a syscall `exit`, podemos começar por definir a string utilizando a diretiva `db` que significa _define byte_, utilizando o endereço do primeiro byte em um rótulo que iremos chamar de _msg_:

```as
global _start

msg: db 0x48, 0x65, 0x6C, 0x6C, 0x6F, \
		0x2C, 0x20, 0x57, 0x6F, 0x72, \
		0x6C, 0x64, 0xA

_start:
	mov rdi, 0   ; error code
	mov rax, 60  ; SYS_exit
	syscall       
```

Antes de sair adicionando mais código, vamos utilizar o `gdb` para analisar o que esta mudança provoca na memória:

```bash
# Examinar o que há no rótulo msg
(gdb) x msg
0x401000 <msg>: 0x6c6c6548

# Examinar o que há no rótulo _start
(gdb) x _start
0x40100d <_start>:      0x000000bf
(gdb)
```

Ora ora, o que temos aqui? 

* `msg` aponta para o endereço `0x401000` que era o endereço usado pelo `_start` no nosso programa anterior
* e agora `_start` aponta para outro endereço, `0x40100d` que está **13 bytes** ("d" em hexa) acima de `msg`, exatamente os 13 bytes da string "Hello, World" adicionado com quebra de linha!!!!!1

> Superb! Mas o que significa o valor `0x6c6c6548`?

Se analisarmos com calma, dá pra perceber que se trata dos caracteres da string em ASCII segundo o que foi definido no programa. Mas eles estão _invertidos_, lembra de endianness que foi explicado no artigo anterior?

Então, esta arquitetura segue o padrão little-endian, onde os bytes são armazenados na ordem inversa, do menos relevante (expoentes menores da base 2) para o mais relevante (expoentes maiores).

Voltando ao gdb, podemos confirmar que todos os bytes da string estão alocados trabalhando com ponteiros de 4 em 4 bytes:

```bash
(gdb) x msg
0x401000 <msg>: 0x6c6c6548 ; Hell

(gdb) x msg+4
0x401004:       0x57202c6f ; o, W

(gdb) x msg+8
0x401008:       0x646c726f ; orld
```

Ou então, o comando `x` permite passar uma quantidade junto com o formato de apresentação, por exemplo queremos que traga os primeiros _13 hexabytes_ a partir do ponteiro **msg**:

```bash
(gdb) x/13xb msg
0x401000 <msg>: 0x48    0x65    0x6c    0x6c    0x6f    0x2c    0x20    0x57
0x401008:       0x6f    0x72    0x6c    0x64    0x0a
```

Exatamente os hexadecimais da string "Hello, World" com quebra de linha!

Mas em Assembly, não precisamos definir os bytes de uma string em hexadecimal. Podemos utilizar os _quotes literais_, assim o programa fica menos verboso e o assembler faz o processo de traduzir o caracter para o hexadecimal da tabela ASCII:

```as
msg: db "Hello, World", 0xA
```

> Não conseguimos representar a quebra de linha dentro de quotes literais, então vamos manter esta com 0xA

### Adicionando a chamada de sistema write

Como já sabemos, o programa precisa utilizar a syscall `write` para escrever na saída, que está definida da seguinte forma no `glibc`:

```c
ssize_t write(int fd, const void buf[.count], size_t count);
```

* nome da syscall vai em RAX
* primeiro argumento (file descriptor, no caso o _STDOUT_) vai em RDI
* segundo argumento (ponteiro para o início do buffer) vai em RSI
* terceiro argumento (quantidade de bytes a serem escritos) vai em RDX

```as
global _start

msg: db "Hello, World", 0xA
_start:
	;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
	; Chamada de sistema
	; glibc -> ssize_t write(int fd, 
							 const void buf[.count], 
							 size_t count)
	;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
	mov rdi, 1   ; STDOUT
	mov rsi, msg ; ponteiro para o início da string
	mov rdx, 13  ; quantidade de bytes a serem escritos
	mov rax, 1   ; nome da syscall: SYS_write
	syscall      ; chamada de sistema

	;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
	; Chamada de sistema
	; glibc -> void _exit(int status)
	;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
	mov rdi, 0   ; erro de saída
	mov rax, 60  ; nome da syscall: SYS_exit
	syscall           
```

Ao compilar o programa com `nasm + ld`, seguindo a mesma lógica do primeiro programa, temos de fato a saída tão desejada:

```
$ ./hello
Hello, World
```

_Yay! que dia maravilhoso!_

Vamos ver como fica o trace disso tudo agora?

```bash
$ strace ./hello

execve("./hello", ["./hello"], 0x7fff139437f0 /* 24 vars */) = 0
write(1, "Hello, World\n", 13Hello, World
)          = 13
exit(0)                                 = ?
+++ exited with 0 +++
```

Wow, podemos ver que, agora, o programa executa primeiro a syscall `write`, que retorna o valor `13`, que é quantidade de bytes escritos _com sucesso_; e a seguir executa a syscall `exit`, também com sucesso, indicando que nosso programa imprime a string na saída e termina sem erros.

Como ficou o tamanho do programa agora?

```bash
$ size hello

   text    data     bss     dec     hex filename
     52       0       0      52      34 hello
```

Hmm, parece que a seção `text` aumentou de tamanho, que é a adição da string "Hello, World" e das instruções para a syscall `write`. Mas por enquanto é a única seção existente:

```bash
$ size --format sysv --radix 16 hello

hello  :
section           size       addr
.text             0x34   0x401000
(omitindo seções de debug)
Total            0x139

```

Podemos ver que a string definida no rótulo `msg`, que começa no endereço `0x401000` está contida na seção `.text`. 

> Isto é um problema?

Mais ou menos:

1. O rótulo `msg` , que é um "dado", contendo a string, está definido num endereço de memória **anterior**, ou seja, em endereço de memória mais baixo em direção a 0
2. O rótulo `_start`, que é o início do programa, está definido num endereço **posterior**, ou seja, em endereço de memória mais alto com relação à string

No sistema operacional, todo programa é encapsulado em um processo tal como vimos no artigo anterior. E sendo um processo, é submetido a um "layout" que deve seguir algumas regras.

### Layout de memória

Fazendo paralelo com a saída do comando `size`, a memória do programa segue um layout, que basicamente contém as seguintes seções, ou _segmentos_ de memória:

* text
* data
* bss

Já falamos disto anteriormente neste artigo, mas basicamente na seção `text` fica todo o código, instruções do programa.

Na seção `data`, ficam dados inicializados (aqui deveria estar a nossa string). E na seção `bss` vão os dados não-inicializados, mas já com uma área pré-alocada na memória.

Em termos de **espaço virtual de memória** do programa, a seção `text` deve ficar nos endereços de memória mais baixos, próximos ao entry point `0x401000`. 

Com isto, o programa deve crescer a partir da seção `text` em direção a `data` e `bss`, dos menores endereços de memória para os maiores (da esquerda pra direita):

```
text -> data -> bss
```

Ou então, analisando numa imagem em vertical, de baixo pra cima:

![layout de memoria 2](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/yy0iqqbaz3ox378srcw6.png)

Existem mais seções no layout mas vamos adicioná-las à medida que avançamos no artigo. Por agora, como nosso programa está tratando dados (`msg`) como `text`, devemos colocar na seção correta, que é `data`:

```as
global _start

; segmento de dados (endereços mais altos)
section .data
msg: db "Hello, World", 0xA

; segmento de texto (endereços mais baixos)
section .text
_start:
	mov rdi, 1   ; STDOUT
	mov rsi, msg ; ponteiro para o início da string
	mov rdx, 13  ; quantidade de bytes a serem escritos
	mov rax, 1   ; nome da syscall: SYS_write
	syscall      ; chamada de sistema

	mov rdi, 0   ; erro de saída
	mov rax, 60  ; nome da syscall: SYS_exit
	syscall  
```

Com `gdb`, podemos conferir que agora estamos obedecendo o layout de memória estabelecido para o programa:

```bash
(gdb) x _start
0x401000 <_start>:      0x000000bf

(gdb) x &msg
0x402000 <msg>: 0x6c6c6548
(gdb)
```

> Note que para acessar `msg` no segmento de dados, precisamos examinar através da _referência_, com o operador `&`

### Definindo constantes

Em Assembly podemos definir constantes que podem ser reutilizadas em diversas partes do programa, evitando assim alguma redundância com repetição de código e valores.

A diretiva `%define` permite definir valores constantes tanto para string quanto números:

```as
global _start

%define SYS_write 1
%define SYS_exit 60
%define EXIT_STATUS 1
%define STDOUT 1
%define NEWLINE 0xA

section .data
msg: db "Hello, World", NEWLINE

section .text
_start:
	mov rdi, STDOUT
	mov rsi, msg 
	mov rdx, 13
	mov rax, SYS_write
	syscall      

	mov rdi, EXIT_STATUS
	mov rax, SYS_exit
	syscall  
```

Podemos também definir uma constante baseada em uma expressão aritmética. Por exemplo, ao invés de deixarmos o tamanho em bytes com valor fixo _13_, podemos fazer que isto seja calculado com base em aritmética de ponteiros na memória com a diretiva `equ`:

```as
...
section .data
msg: db "Hello, World", NEWLINE
msgLen: equ $ - msg
...
```

O operador `$` tem o ponteiro de memória para o último byte no programa, no caso o `NEWLINE` definido na linha anterior. Ao subtrair do ponteiro `msg` com a expressão `$ - msg`, temos o tamanho em bytes calculado e desta forma não precisa ser um valor fixo em RDX:

```as
global _start

%define SYS_write 1
%define SYS_exit 60
%define EXIT_STATUS 1
%define STDOUT 1
%define NEWLINE 0xA

section .data
msg: db "Hello, World", NEWLINE
msgLen: equ $ - msg

section .text
_start:
	mov rdi, STDOUT
	mov rsi, msg 
	mov rdx, msgLen
	mov rax, SYS_write
	syscall      

	mov rdi, EXIT_STATUS
	mov rax, SYS_exit
	syscall  
```

_Wonderful! Nosso programa agora tá muito mais elegante!_

Ufa, parece que terminamos o nosso primeiro programa e este por si só já foi uma jornada longa. Mas tenha um pouco mais de paciência, **vem comigo**, pois chegou o momento de escrevermos um programa um pouco mais sofisticado. 

Hora de explorar mais funcionalidades no Assembly e entrar no mundo da _stack_.

---

## Um programa mais sofisticado

Vamos começar por um programa simples e evoluindo conforme depuramos e entendemos a memória. Ao fim, o programa deve ser capaz de receber um nome através dos argumentos da linha de comando e imprimir "Hi, `<nome>`". 

Desejado:

```bash
$ ./greeting Leandro
Hi, Leandro
```

### Definindo labels

Já sabemos que o programa precisa imprimir "Hi, " alguma coisa. Então as instruções pra syscall `write` são necessárias, e já fazendo uso de constantes:

```as
global _start

%define SYS_write 1
%define SYS_exit 60
%define STDOUT 1

section .data
greet: db "Hi", 0xA

section .text
_start:
	mov rdi, STDOUT
	mov rsi, greet
	mov rdx, 3
	mov rax, SYS_write
	syscall
	
	mov rdi, 0
	mov rax, SYS_exit
	syscall
```

Este programa imprime "Hi" apenas. Mas podemos melhorar a organização separando em blocos com algum valor _semântico_:

* separar o bloco de `exit`
* separar o bloco de `write`

Assembly emprega o conceito de **labels**, que são rótulos, mas que podem ser definidas em qualquer parte do código. Utilizando o caracter _ponto_ (`.`), o programa fica bem mais expressivo:

```as
global _start

%define SYS_write 1
%define SYS_exit 60
%define STDOUT 1

section .data
greet: db "Hi", 0xA

section .text
_start:
.print:
	mov rdi, STDOUT
	mov rsi, greet
	mov rdx, 3
	mov rax, SYS_write
	syscall
.exit:
	mov rdi, 0
	mov rax, SYS_exit
	syscall
```

Assim como qualquer rótulo, o programa vai executando top-down. O que fizemos aqui foi apenas colocar rótulos em determinadas partes do programa, mas sem _alterar seu fluxo de execução_. 

### Desvio de fluxo com jump

Se quisermos alterar o fluxo de execução, podemos utilizar a instrução `JMP` que altera o fluxo do programa para outro ponto, continuando _a partir desde novo ponto_.

```as
global _start

%define SYS_write 1
%define SYS_exit 60
%define STDOUT 1

section .data
greet: db "Hi", 0xA

section .text
_start:
	; Faz o jump para a label .print, sem passar por .exit
	jmp .print
.exit:
	mov rdi, 0
	mov rax, SYS_exit
	syscall
.print:
	mov rdi, STDOUT
	mov rsi, greet
	mov rdx, 3
	mov rax, SYS_write
	syscall
	
	; Faz o jump para a label .exit, caso contrário o programa não terminaria
	; da forma adequada (todo programa deve terminar)
	jmp .exit
```

Este foi um exemplo bastante simples com jump e desvio de fluxo. Mas é possível também desviar o fluxo, executar a lógica do novo fluxo, e _retornar_ ao ponto anterior.

Entretanto, para que isto funcione, vamos imaginar uma possível solução:

* definir algum registrador "especial" que guarda sempre o ponteiro da próxima instrução
* antes de desviar o fluxo, guardar o endereço de memória da próxima instrução do programa em alguma _estrutura de dados_ para que possa ser resgatado quando a lógica do desvio terminar

Sim, estamos falando do desvio com `call`, `ret`, registradores e pilha.

### Desvio de fluxo com call

Tendo o exemplo anterior, ao invés de fazer `jmp`, vamos utilizar a instrução `call` que faz o desvio para outra rotina:

```as
call .print  ; <------ chamada da rotina
```

Além disso, a última linha da rotina `.print` deve "retornar" o fluxo desviado para o ponto anterior.

```as
.print:
	mov rdi, STDOUT
	mov rsi, greet
	mov rdx, 3
	mov rax, SYS_write
	syscall
	ret  ; <------ retorno da rotina
```

Antes de analisarmos com `gdb` passo a passo, precisamos entender um aspecto importante dos programas no sistema operacional.

Quando um programa é executado, ele é definido em uma estrutura chamada **processo** (já falamos disto no artigo anterior). Todo processo carrega o layout de memória definido no binário do programa, conforme vimos anteriormente:

```
text -> data -> bss
```

Nos endereços mais _altos_ da memória virtual do processo (programa em execução), o sistema operacional também define uma outra estrutura de dados, chamada **stack**, que tem um formato de pilha (LIFO, Last In, First Out).

```
text -> data -> bss ---------> <-------- stack
```


![layout de memória com stack](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/z7lyluh9a4hqkzl3yo7s.png)

A stack fica nos endereços mais altos e carrega informações como argumentos do programa, lista de variáveis de ambiente definidas no _shell_, argumentos para funções entre qualquer informação pertinente para o programa. Stack sempre cresce _para baixo_ em direção aos endereços menores.

**rsp**
Em um programa Assembly x86, é preciso armazenar o ponteiro atual do topo da stack, e esta informação fica no registrador RSP, ou _stack pointer_.

**rip**
Já o ponteiro da instrução atual fica no registrador RIP, ou _instruction pointer_.

Com estes dois registradores conseguimos demonstrar o uso de call e ret para desvio de fluxo. Voltando ao programa:

```as
global _start

%define SYS_write 1
%define SYS_exit 60
%define STDOUT 1

section .data
greet: db "Hi", 0xA

section .text
_start:
	call .print     ; <--------- desvio do fluxo
	
	; aqui neste ponto, já continua a execução normal em direção ao exit
	; para terminar o programa
.exit:
	mov rdi, 0
	mov rax, SYS_exit
	syscall
.print:
	mov rdi, STDOUT
	mov rsi, greet
	mov rdx, 3
	mov rax, SYS_write
	syscall
	ret            ; <---------- retorno ao ponto anterior
```

E agora demonstrando com `gdb`:

```bash
$ gdb greeting

# Breakpoint em _start, início do programa
(gdb) break _start_
(gdb) run

# RIP apontando para 0x401000 (_start), o entry point do programa
(gdb) info register $rip
rip            0x401000            0x401000 <_start>

# RSP apontando para um endereço de memória
# Se formos examinar com x $rsp, temos
# 0x7fffffffe450: 0x00000001, que é a quantidade de argumentos
# passados, no caso 1 representa apenas o nome do programa, ou seja
# não há argumentos na linha de comando
(gdb) i r $rsp
rsp            0x7fffffffe450      0x7fffffffe450
```

Até aqui okay, agora vamos andar um `step` para que o desvio de `call` seja avaliado e analisar o RIP:

```bash
(gdb) step
18              mov rdi, STDOUT

# O RIP andou conforme esperado
(gdb) i r $rip
rip            0x401011            0x401011 <_start.print>

# RIP apontando para 0x000001bf, que é BF 01 00 00 
# Lembra? é o opcode pra MOV RDI, 1
# Exatamente onde paramos
(gdb) x $rip
0x401011 <_start.print>:        0x000001bf
```

E a stack (RSP) como ficou?

```bash
# A pilha andou alguns bytes (no caso foi feito um "push", o que a fez crescer para endereços de memórias menores)
# Lembra? Pilha "cresce pra baixo" na memória
(gdb) i r rsp
rsp            0x7fffffffe448      0x7fffffffe448

# Opaaa, o que temos aqui? 0x00401005
# É alguma pista...
(gdb) x $rsp
0x7fffffffe448: 0x00401005

# Examinando o ponteiro do início do programa...
(gdb) x _start
0x401000 <_start>:      0x00000ce8

# Se andarmos alguns bytes, 
# temos exatamente o endereço da label .exit, 0x401005
(gdb) x _start + 5
0x401005 <_start.exit>: 0x000000bf
```

Se você prestou atenção nos comentários do snippet acima...

> É muito importante prestar atenção em todos os comentários, se não estiver fazendo isso, volte o artigo do início e tente acompanhar *no terminal*, é extremamente importante para entender os conceitos

...se prestarmos a devida atenção, este é o endereço que tá no topo da pilha agora, que foi adicionado pela instrução `call`.

> Ok Leandro, mas como fazemos então para voltar ao ponto anterior?

Calma, jovem. Estamos parados no início da rotina `.print`. Vamos continuar a depuração com `gdb` até parar em `ret`:

```bash
(gdb) next
19              mov rsi, greet
(gdb) next
20              mov rdx, 3
(gdb) next
21              mov rax, SYS_write
(gdb) next
22              syscall
(gdb) next
Hi
_start.print () at greeting.asm:23
23              ret
(gdb)
```

Nice, antes de avaliar a instrução `ret`, podemos ver que RIP andou mas RSP continua na mesma, com o endereço da próxima instrução antes do desvio:

```bash
# RIP aponta para a instrução da linha "ret"
(gdb) x $rip
0x40102c <_start.print+27>:     0x000000c3

# RSP aponta para o endereço de memória que está a instrução .exit, que
# vem a seguir ao desvio feito com "call" lá em cima
(gdb) x $rsp
0x7fffffffe448: 0x00401005
```

Vamos andar com `ret` e....

```bash
# RIP agora aponta para 0x401005, que é a instrução .exit
(gdb) x $rip
0x401005 <_start.exit>: 0x000000bf

# Foi feito "pop" em RSP e agora este aponta para o topo da pilha
# com o valor exato quando estava no início do programa
(gdb) x $rsp
0x7fffffffe450: 0x00000001
(gdb)
```

_OMG!! Acabamos de demonstrar manipulação de registradores e pilhas_.

### Brincando com pilhas

_Pilhas é divertido._ 

> Mas prefiro filas, gosto de tratar as coisas de modo ordenado. Quem chega primeiro precisa ser atendido primeiro kkkkkkkk

Mas com pilhas não é assim. Quem entra por último sai primeiro. 

Com base nisto, como podemos manipular a stack do programa? Vamos alterar um pouco o código adicionando o ponteiro de `greet` na stack:

```as
global _start

%define SYS_write 1
%define SYS_exit 60
%define STDOUT 1

section .data
greet: db "Hi", 0xA

section .text
_start:
	push greet    ; <----- adiciona o ponteiro de greet na stack
	call .print
.exit:
	mov rdi, 0
	mov rax, SYS_exit
	syscall
.print:
	mov rdi, STDOUT
	mov rsi, greet
	mov rdx, 3
	mov rax, SYS_write
	syscall
	ret
```

No `gdb`, vamos colocar um breakpoint na linha da chamada `call`:

```bash
# Breakpoint na linha 13
(gdb) b 13
Breakpoint 1 at 0x401005: file greeting.asm, line 13.

# Run
(gdb) r

# Examinando o topo da pilha
(gdb) x $rsp
0x7fffffffe448: 0x00402000

# Examinando o endereço de memória que tá no topo da pilha
(gdb) x 0x00402000
0x402000 <greet>:       0x2c0a6948
```

_Cool_, temos `0x48 0x69 0x0A` (little-endian), exatamente a string "Hi" seguida de uma quebra de linha. Com esta rica informação, ao invés da rotina `.print` passar pro registrador RSI o ponteiro de `greet`, porque não passar o ponteiro do topo da pilha?

Algo nessa linha:

```as
; ao invés disso (atual)
mov rsi, greet

; que tal mover o ponteiro que tá em rsp (topo da pilha) para rsi
mov rsi, rsp
```

Por enquanto, seguramos esta ideia no bolso. Ainda no `gdb`, vamos continuar analisando a pilha depois de entrar na rotina:

```bash
(gdb) step
_start.print () at greeting.asm:19

# Agora o topo da pilha foi modificado, "call" colocou o endereço de 
# memória da próxima instrução quando voltar do "ret"
(gdb) x $rsp
0x7fffffffe440: 0x0040100a

# O endereço de memória aponta justamente pra próxima instrução quando voltar do "ret", no caso a instrução que tá na label .exit do programa
(gdb) x 0x0040100a
0x40100a <_start.exit>: 0x000000bf
```

Mas agora o topo da pilha estraga nossa ideia de fazer `mov rsi, rsp`, mas podemos fazer aritmética com ponteiros e mover o conteúdo resultante, e é muito fácil:

```bash
# Topo da pilha apontando pra instrução guardada pelo "call"
(gdb) x $rsp
0x7fffffffe440: 0x0040100a

# Topo da pilha + 8 bytes apontando pro endereço onde tá a string "Hi"
(gdb) x $rsp+8
0x7fffffffe448: 0x00402000
```

> Nesta arquitetura, a pilha, assim como os registradores, armazenam por padrão até 8 bytes por cada informação

Então teoricamente, tudo o que precisamos é `mov rsi, [rsp + 8]`

> Note que é preciso usar `[rsp + 8]`, com square brackets é uma forma de fazermos aritmética de ponteiros e acessar o valor resultante da operação na memória, no caso o endereço apontando para a string "Hi"

Para finalizar este primeiro exemplo, é muito importante fazermos "pop" da pilha. Todo `push` deve ter um `pop`, caso contrário podemos gastar a pilha desnecessariamente e talvez chegar a um stack overflow se exagerarmos bastante.

```as
global _start

%define SYS_write 1
%define SYS_exit 60
%define STDOUT 1

section .data
greet: db "Hi", 0xA

section .text
_start:
	push greet             ; <----- push na pilha
	call .print
	pop rbp                ; <----- pop da pilha, jogando o valor em rbp
	                       ; note que rbp é outro registrador de propósito geral,
	                       ; mas que é utilizado para manter a base da pilha
.exit:
	mov rdi, 0
	mov rax, SYS_exit
	syscall
.print:
	mov rdi, STDOUT
	mov rsi, [rsp + 8]     ; <----- 8 bytes depois do topo da pilha está o
	                       ; endereço de memória da string
	mov rdx, 3
	mov rax, SYS_write
	syscall
	ret
```

Podemos reparar 2 coisas:

* A rotina `.print` está ficando bastante genérica, ou seja ela não sabe o que está na pilha, simplesmente move para o registrador RSI e faz a syscall `write`
* A rotina  `.print` ainda usa o tamanho em bytes como valor fixo, no caso 3 bytes. Deveria ser dinâmico também se quisermos fazer com que esta rotina seja bem genérica

Colocamos o tamanho também na pilha? _Nah_, seria mais interessante ainda se calculássemos dinamicamente o que vem da pilha. Para fazer este cálculo, teríamos que "iterar", em forma de _loop_, por cada byte que queremos imprimir, incrementar em um registrador e utilizar isto na syscall.

Vamos entrar no mundo dos **loops** e **condicionais**.

### Calculando tamanho dinamicamente com loop

Combinando labels e jumps, podemos criar um _loop_ em assembly, como neste pequeno exemplo a seguir:

```as
; Um loop infinito sem condição de parada
; Não façam isso

global _start

_start:
.loop
	jmp .loop
```

Entretanto para adicionarmos uma _condição de parada_ do loop, é necessário utilizar uma instrução de **comparação** e outra que **muda algum estado**.

No nosso exemplo, vamos introduzir um *loop* que calcula o tamanho da string _antes de fazer a syscall_. Entendendo a necessidade:

```as
; Pseudo-code

.print:
	mov rdi, STDOUT
	mov rsi, [rsp + 8]   ; string em RSI     
	                       
	mov rdx, ?           ; <--- aqui devemos introduzir um loop que vai
	                     ; modificando o valor de RDX, lendo byte a byte
	                     ; o conteúdo da string
	mov rax, SYS_write
	syscall
	ret
```

Para resolver isto, podemos criar uma **label** chamada `.calculate_size` que contém um `jmp` para ela mesma:

```as
.print:
	mov rsi, [rsp + 8]       ; string em RSI 
	mov rdx, 0               ; RDX começa em 0
.calculate_size:             ; label
	jmp .calculate_size      ; jmp "recursivo"
.done:
	mov rdi, STDOUT
	mov rax, SYS_write
	syscall
	ret
```

Ao rodarmos o programa, _obviamente_ caímos em loop infinito. Precisamos definir uma condição de parada, que consiste em:

* mudar o estado de alguma variável condicional
* desviar o fluxo para outra _label_ quando a condição for verdadeira

Em Assembly, podemos fazer a mudança de estado utilizando a instrução `inc`:

```as
.print:
	mov rsi, [rsp + 8]     
	mov rdx, 0             ; RDX (contador) começa em 0
.calculate_size:
	inc rdx                ; incrementa o valor que está em RDX (linha 23)
	jmp .calculate_size
.done:
	mov rdi, STDOUT
	mov rax, SYS_write
	syscall
	ret
```

Com gdb, verificamos que o valor de RDX está sempre sendo incrementado:

```bash
# Adicionar breakpoint na linha 23 (<<inc rdx>>)
(gdb) break 23
Breakpoint 1 at 0x401021: file live.asm, line 23.

# Executar o programa, que vai no primeiro breakpoint
(gdb) run
Breakpoint 1, _start.calculate_size () at live.asm:23
23              inc rdx

# Continuar execução até o próximo breakpoint ou fim do programa.
# Mas como estamos em loop, o programa vai parar de novo nesta linha
(gdb) continue

# Atalho para "info register rdx"
(gdb) i r rdx
rdx            0x1                 1

# Próxima iteração...
(gdb) continue
(gdb) i r rdx
rdx            0x2                 2

# E assim infinitamente pois não temos ainda a segunda premissa da condição de parada, que é a condicional
(gdb) continue
(gdb) i r rdx
rdx            0x19                25
```

Como podemos elaborar esta condicional, uma vez que o valor em RDX pode ser infinito, logo ter *todas as possibilidades*?

Uma ideia é irmos **consumindo** byte a byte da string até chegar a _zero_. Para isto, podemos definir o fim da string com `0x0` e fazer *aritmética binária* na própria string, consumindo os bytes até chegar a `0x0`!

Eis o exemplo com um pseudo-código:

```as
; "Hi", 0 
; que em hexabyte fica 0x49, 0x69, 0x00

INCREMENT
0x69 0x00   ; consumiu o byte mais à esquerda 0x49

INCREMENT   ; consumiu o byte mais à esquerda 0x69
0x00 0x...
```


![increment em endereço de memória](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/3v83k677xw88fg49dn86.png)

> Nossa Leandro, que fantástico! Podemos então fazer `inc` em um registrador que contém a string, nesse caso o próprio RSI?

_Isso mesmo!_

```as
.....
section .data
greet: db "Hi", 0xA, 0      ; <--- adicionamos o "zero" para identificar o 
                            ; fim da string

.....

.print:
	mov rsi, [rsp + 8]     
	mov rdx, 0
.calculate_size:
	inc rdx                 ; incrementa o valor inteiro em RDX (contador)
	inc rsi                 ; <--- além de incrementar o RDX, incrementamos
	                        ; também o RSI, que contém o endereço de
	                        ; memória para a string. Aritmética em hexabytes
	                        ; vai fazer o efeito de "consumir os bytes até zero
	jmp .calculate_size
.done:
	mov rdi, STDOUT
	mov rax, SYS_write
	syscall
	ret

```

Agora, com `gdb`, vamos verificar o que está acontecendo com nosso programa:

```bash
# Breakpoint na linha <jmp .calculate_size>
(gdb) break 25
Breakpoint 1 at 0x401027: file live.asm, line 25.

(gdb) run

# Cool, o contador RDX foi incrementado
(gdb) i r rdx
rdx            0x1                 1

# Em RSI, temos outro endereço de memória.
# Anteriormente era o início da string, 0x402000, mas agora está
# apontando para 0x402001
(gdb) i r rsi
rsi            0x402001            4202497

# Wow! Temos os bytes da string "i", seguido de "\n", e depois o 0x00
# Parece que o inc RSI funcionou como esperávamos?
(gdb)x /4xb 0x402001
0x402001:       0x69    0x0a    0x00    0x2c

# A vida continua...
(gdb) continue

# Caminho mais curto
# E parece que RSI andou mais ainda, agora apontando para o byte "\n"
(gdb) x $rsi
0x402002:       0x0a

# A vida continua...
(gdb) continue

# O nosso grande momento! Agora RSI aponta para 0x00
(gdb) x $rsi
0x402003:       0x00
```

Tudo o que precisamos fazer, neste momento, é comparar **o valor que está em RSI** com _zero_. Se chegou a zero, significa que podemos *parar o loop*. Vamos verificar o que está no contador RDX (esperamos que seja 3):

```bash
(gdb) i r rdx
rdx            0x3                 3
```

_Yay! Que grande momento!_

Mas como verificar em Assembly se chegou ou não no valor? Existe "IF" e "ELSE" em Assembly?

> Hell no!

Não. Não tem "IF" e "ELSE" em Assembly.

Uma possível solução seria:

* utilizar uma instrução que compare o valor de um registrador ou em algum endereço de memória com **qualquer outro valor**
* esta instrução iria guardar o resultado da comparação em outro registrador "especial"
* utilizar outra instrução para fazer *desvio do fluxo* de acordo com o valor que estive neste registrador especial

Sim, é aí que entramos no tal do registrador **RFLAGS**.

### RFLAGS

O registrador de _flags_ é um registrador de status que mantém sempre o estado atual da CPU, neste caso estamos referindo a uma CPU x86_64, pelo que chamamos este registrador de **RFLAGS**.

Este registrador guarda _opcodes condicionais_, que são resultado de diversas operações lógicas e aritméticas que afetam o estado da CPU.

Voltando ao nosso exemplo, podemos comparar o registrador RSI com o valor 0, e então verificar o que está acontecendo com o registrador `eflags`:

```as
.print:
	mov rsi, [rsp + 8]     
	mov rdx, 0
.calculate_size:
	inc rdx
	inc rsi
	cmp byte [rsi], 0x00   ; <-- aqui comparamos (em byte) o valor que está
	                       ; em RSI com o byte 0x00
	jmp .calculate_size
.done:
	mov rdi, STDOUT
	mov rax, SYS_write
	syscall
	ret
```

E com isto podemos conferir com `gdb`:

```bash
# Breakpoint na linha <cmp byte [rsi], 0x00>
(gdb) break 25

(gdb) run

# O que temos no primeiro byte de RSI? "i", pois o "H" já foi
# consumido no <inc rsi>
(gdb) x /1xb $rsi
0x402002:       0x69

# E no eflags?
# Nossa, temos o IF que estávamos precisando!!!!!11
(gdb) i r eflags
eflags         0x202               [ IF ]
```

> Calma jovem, `IF` não é o que você está pensando!

`IF` é uma flag chamada _interrupt flag_, que está sempre presente no programa em execução. Ela determina se o programa pode ou não sofrer interrupções de hardware. No nosso caso, está sempre habilitada por padrão, e é por este motivo que podemos fazer chamadas de sistema (syscalls).

Continuando no gdb...

```bash
(gdb) continue

# O que temos em RSI? "\n"
(gdb) x /1xb $rsi
0x402002:       0x0a

# Executar a instrução <cmp byte [rsi], 0x00>
(gdb) next

# Ok, segunda iteração continua na mesma, sem flags adicionais
(gdb) i r eflags
eflags         0x202               [ IF ]

######## Próxima iteração ##########

(gdb) continue

# O que temos em RSI? 0x00, cool.
(gdb) x /1xb $rsi
0x402003:       0x00

# Executar a instrução <cmp byte [rsi], 0x00>
(gdb) next

# Outras flags foram adicionadas ao estado: PF e ZF
(gdb) i r eflags
eflags         0x246               [ PF ZF IF ]
```

`PF` é a _parity flag_, que é adicionada quando uma operação aritmética em qualquer registrador resulta em paridade ímpar.

> Não é do escopo deste artigo entrar em detalhes sobre PF, sugiro a leitura [sobre o assunto](https://en.wikipedia.org/wiki/Parity_flag)

Já a `ZF` é chamada **zero flag**, adicionada quando uma operação aritmética resulta em zero, que é exatamente o que estamos buscando aqui.

Agora o que precisamos é desviar o fluxo (lembra do `jmp`) quando a *flag zero está presente*. Para isto, temos a disposição diversas instruções de jump baseadas em flags:

* jz (jump if zero)
* jnz(jump if not zero)
* je (jump if equal)
* jne (jump if not equal)

> Isto pra mencionar apenas algumas, existem muitas outras que podem ser consultadas [aqui](https://en.wikibooks.org/wiki/X86_Assembly/Control_Flow)

Com isto, a instrução que precisamos é a `jz`, que verifica se a flag `ZF` está presente:

```as
.print:
	mov rsi, [rsp + 8]     
	mov rdx, 0
.calculate_size:
	inc rdx
	inc rsi
	cmp byte [rsi], 0x00     ; <--- compara RSI com 0x00. Adiciona a flag ZF                                  ; quando chegar a zero
	jz .done                 ; <--- desvia fluxo para a label ".done" caso a
	                         ; flag ZF esteja presente
	jmp .calculate_size
.done:
	mov rdi, STDOUT
	mov rax, SYS_write
	syscall
	ret
```

Com `gdb`, colocamos o breakpoint na linha `mov rdi, STDOUT` que é depois do loop. Caso o programa fique parado nesta linha, significa que o loop foi concluído com sucesso e os bytes da string devidamente calculados:

```bash
# Breakpoint na linha <mov rdi, STDOUT>
(gdb) break 29

(gdb) run

# Olha o que temos aqui
(gdb) i r rdx rsi
rdx            0x3                 3
rsi            0x402003            4202499

# E se formos examinar a string (com x/s) em RSI, temos isto:
(gdb) x/s $rsi
0x402003:       ""
```

* Em RDX, temos o contador, que está em 3, que é a quantidade de bytes que será passada como terceiro argumento da syscall write. Okay, aqui ficou tudo certo.
* Em RSI, temos `0x402003`, e o valor está vazio, ou `0x00`. Isto é um problema

O problema reside no fato de que RSI precisa ter o ponteiro para a string em si, e as operações de `inc rsi` **modificaram o registrador**, pelo que não queremos que isto aconteça.

Podemos então inicialmente mover o valor que está em RSI para outro registrador temporário, que pode ser um daqueles registradores de _rascunho_, chamados de _draft registers_:

```as
.print:
	mov rsi, [rsp + 8]     
	mov r9, rsi          ; aqui preservamos RSI, movendo o valor para R9
	mov rdx, 0
.calculate_size:
	inc rdx
	inc r9               ; incrementar o valor em R9, preservando assim RSI
	cmp byte [r9], 0x00  ; comparar 0x00 com R9, e não mais RSI
	jz .done
	jmp .calculate_size
.done:
	mov rdi, STDOUT       
	mov rax, SYS_write
	syscall              ; no momento da syscall, RSI está intacto, contendo
	                     ; o ponteiro para o endereço de memória onde está
	                     ; localizada a nossa queridíssima string "Hi"
	ret
```

Após estas alterações, vamos executar o programa completo:

```bash
./greeting
Hi
```

_Que dia maravilhoso!_ Nosso programa imprime a string "Hi" calculando dinamicamente o tamanho dos bytes da string!

> Entretanto, queremos implementar a proposta inicial, não é, Leandro? O programa não tem que ler o nome da linha de comando e imprimir "Hi, Leandro"?

### Botando mais pilha no negócio

Nosso objetivo é chamar `./greeting` com argumento e assim o programa deve imprimir `Hi, ` com o argumento enviado:

```bash
# Objetivo, isto ainda não funciona
./greeting Leandro
Hi, Leandro
```

Se pensarmos um pouco, podemos inferir que qualquer argumento pode ser armazenado na _stack_ do processo, que é quando o programa está em execução.

Com `gdb`, podemos confirmar isto:

```bash
# Breakpoint na primeira linha do programa, depois do _start
(gdb) break 12

# Executa o programa com o argumento "Leandro"
(gdb) run Leandro

# Onde estará Leandro? Na pilha? (rsp)
#      -> x de examine
#      -> /8xb os primeiros 8 hexa bytes
(gdb) x /8xb $rsp
0x7fffffffe450: 0x02    0x00    0x00    0x00    0x00    0x00    0x00    0x00
```

Mas o quê significa esse número 2? Vamos examinar a stack e a ordem das informações contidas nela.

Voltando ao `gdb`, e se lermos os próximos 8 bytes na stack?

```bash
(gdb) x /8xb $rsp + 8
0x7fffffffe458: 0xb1    0xe6    0xff    0xff    0xff    0x7f    0x00    0x00
```

> Lembrando que os bytes são escritos na stack em formato little-endian, ou seja estão invertidos

Com isto, temos um hexadecimal `0x7fffffffe6b1`. Parece um endereço de memória, não?

```bash
# Examinando o endereço de memória no formato de string (/s)
(gdb) x /s 0x7fffffffe6b1
0x7fffffffe6b1: "/Users/..../code/asm-x64/live"
```

Wow, temos o primeiro argumento, também chamado de _ARG0_ que é o nome do programa com o caminho absoluto no sistema operacional.

Andando mais 8 bytes...

```bash
# Endereço de memória...
(gdb) x /8xb $rsp + 16
0x7fffffffe460: 0xdf    0xe6    0xff    0xff    0xff    0x7f    0x00    0x00

# Examinando o valor que está no endereço
(gdb) x /s 0x7fffffffe6df
0x7fffffffe6df: "Leandro"
```

_Yay!_ Temos o nosso argumento, armazenado na stack. É o primeiro argumento, também chamado de _ARG1_.

> Se continuarmos andando na stack de 8 em 8 bytes, vamos passar por todos os argumentos (no nosso caso não há mais), e a seguir vamos chegar no vetor ambiente, que contém todas as variáveis de ambiente contidas no shell que está executando o nosso programa

Com isto, sabemos que o primeiro argumento está localizado em `rsp + 16`:

* `rsp`: quantidade de argumentos
* `rsp + 8`: ARG0, nome do programa
* `rsp + 16`: ARG1, primeiro argumento (se existir)
* `rsp + 24`: ARG2, segundo argumento (se existir)
* e assim sucessivamente...até chegar no vetor de variáveis de ambiente (vetor ambiente)

![layout de memória com stack](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/zs0kmzgwigotv9drklh9.png)

Sabendo que nossa *sub-rotina* `.print` já recebe uma string da stack e calcula dinamicamente o tamanho da string que foi passada, podemos passar pro topo da stack o nosso argumento (que por acaso também está na stack), e em seguida chamada a rotina `.print` novamente:

```as
section .data
greet: db "Hi, ", 0

_start:
	push greet      
	call .print     
	pop rbp     

	; aqui fazemos push pro topo da stack o valor que está em RSP + 16 (ARG1)
	; utilizamos o tipo "qword" que significa "quadword"
	push qword [rsp + 16]
	call .print
	pop rbp
...
```

O quê significa __quadword__? Em assembly podemos definir _tipos de bytes_, que basicamente são grupos de bytes, podendo ou não caber em um registrador ou stack dependendo da arquitetura da CPU.

* **byte**: especifica 1 byte (8-bit)
* **word**: 2 bytes (16-bit)
* **dword**: 4 bytes (32-bit)
* **qword**: 8 bytes (64-bit)
* **tbyte**: 10 bytes

Na arquitetura x86_64, precisamos especificar que o tipo de byte adicionado na stack, quando não vier de um registrador mas sim de um lugar arbitrário na memória ou stack, tem um determinado _tamanho_ em bytes.

Neste caso, estamos utilizando _qword_ que é justamente 8 bytes (ou 64-bit) que representa a arquitetura em questão.

Precisamos adicionar mais um caracter, que é o _newline_, ou `\n`, no fim da mensagem. Para isto, podemos definir um dado inicializado e chamar a rotina `.print` , que já está bem "crescidinha", não?

Programa completo, com comentários:

```as
global _start

%define SYS_write 1
%define SYS_exit 60
%define STDOUT 1

section .data
greet: db "Hi, ", 0
newline: db 0xA, 0

section .text
_start:
	push greet             ; adiciona "Hi, " na stack para print
	call .print     
	pop rbp         

	push qword [rsp + 16]  ; adiciona ARG1 na stack para print
	call .print
	pop rbp

	push newline           ; adiciona newline na stack para print
	call .print
	pop rbp
.exit:                     ; label de término do programa
	mov rdi, 0
	mov rax, SYS_exit
	syscall
.print:                    ; rotina de print no STDOUT
	mov rsi, [rsp + 8]     
	mov r9, rsi
	mov rdx, 0
.calculate_size:           ; loop para calcular tamanho da string
	inc rdx
	inc r9
	cmp byte [r9], 0x00
	jz .done
	jmp .calculate_size
.done:                     ; label para finalizar a rotina print e retornar
	mov rdi, STDOUT
	mov rax, SYS_write
	syscall
	ret
```

Rodamos o programa e:

```bash
./greeting Leandro
Hi, Leandro
```

_OMG! Eu não estou acreditando no que estou vendo!!!!!11_

### Depurando o programa final com strace

Com _strace_, podemos fazer o trace de syscalls do programa final. Olha que maravilha isto:

```bash
$ strace ./greeting Leandro

execve("./greeting", ["./greeting", "Leandro"], 0x7ffc30f75368 /* 24 vars */) = 0
write(1, "Hi, ", 4Hi, )                     = 4
write(1, "Leandro", 7Leandro)                  = 7
write(1, "\n", 1
)                       = 1
exit(0)                                 = ?
+++ exited with 0 +++
```

Foram feitas 4 chamadas de sistema, sendo:

* 1 write, "Hi, "
* 1 write "Leandro"
* 1 write "\\n"
* 1 exit

---

## Falando um pouco de registradores

Até o momento, vimos durante este artigo a utilização de alguns registradores que foram muito úteis para o desenvolvimento do programa, dentre eles _RSI_, _RAX_, _RDX_, _RSP_, _RIP_, _RFLAGS_ e assim por diante.

Mas qual o **propósito de cada registrador**? Posso usar qualquer registrador para qualquer operação, de forma aleatória?

> De forma prática, sim. Mas nem sempre convém.

Nada impede que o teu programa coloque qualquer valor em um registrador arbitrário. Por exemplo, com `gdb` vamos alterar alguns registradores e ver como o programa se comporta:

```bash
# Breakpoint & run
(gdb) break 13
(gdb) run Leandro

# Vamos alterar alguns registradores arbitrários
(gdb) set $rax = 42
(gdb) set $rdx = 33

# Confirmando que foram modificados
(gdb) i r rax rdx
rax            0x2a                42
rdx            0x21                33

# Continuando...
(gdb) continue
Continuing.
Hi, Leandro
[Inferior 1 (process 19231) exited normally]
```

Okay, podemos ver que ter mudado estes registradores para _qualquer valor_ não impactou o programa. No meio do programa, provavelmente eles são sobrescritos novamente e utilizados de acordo com _determinada lógica_.

Mas e se alterarmos, por exemplo, um registrador como o `rip`, que é o _ponteiro da próxima instrução_?

```bash
# Breakpoint & run
(gdb) break 13
(gdb) run Leandro

# Antes de alterar o RIP, podemos ver qual o valor ele carrega,
# que é o ponteiro da próxima instrução
(gdb) i r rip
rip            0x401000            0x401000 <_start>

# Vamos alterar o registrador RIP
(gdb) set $rip = 42

# Confirmando que foi alterando
(gdb) i r rip
rip            0x2a                0x2a

# Continuando...
(gdb) continue
Continuing.
Program received signal SIGSEGV, Segmentation fault.
0x000000000000002a in ?? ()
```

_Ouch!_ Agora o programa não pôde ser finalizado com sucesso. Confirmamos então que nem sempre convém mudar os registradores sem _haver algum critério_.

### Propósito dos registradores

Os registradores, e falando especificamente da arquitetura x86, seguem um **propósito original** para o qual foram designados. Mas também podem ser utilizados em convenções de **chamadas de sistema** tal como vimos na montagem das syscalls `write` e `exit`, e neste caso a utilização correta importa bastante. 

E além disso, alguns registradores contém dados importantes para a execução do programa, tais como o `rip` e `eflags`.

* Propósito original
* Convenções de chamadas
* Funcionamento crítico do programa

Apesar destas características importantes de uso dos registradores, podem haver situações em que utilizar um registrador de propósito geral é o que faz mais sentido para o programa. Vamos a seguir destacar alguns registradores e seus *propósitos originais*.

### Registradores de propósito geral

Podemos categorizar os registradores de uso geral em 2 partes: manipulação de _dados diretos_ ou _endereços de memória_.

**Dados**
Registradores podem manipular dados, que chamamos de _valor imediato_, e nesta categoria podemos utilizar RAX, RBX, RCX, RDX e os registradores de rascunho que vão de R8 a R15.

* **RAX**: operações aritméticas e armazenamento de resultados; também usado para o nome de chamadas de sistema em convenções de chamada (syscalls)
* **RBX**: ponteiro de base, utilizado para o endereço de algumas informações na memória
* **RCX**: geralmente usado como contador, para armazenar a quantidade de vezes que uma instrução deve ser executada
* **RDX**: usado para algumas operações de multiplicação e divisão, muito utilizado para armazenar o resto de operações
* **R8 a R15**: registradores de *rascunho* utilizados para propósito geral

**Endereços de memória**
Registradores também permitem manipular endereços de memória. Nesta categoria temos RSI, RDI, RBP e RSP.

* **RSI**: utilizado como um ponteiro de origem em operações de transferências de dados, frequentemente usado em loops para iterar sobre arrays ou buffers de dados
* **RDI**: utilizado como ponteiro de destino em operações de transferências de dados, frequentemente usado junto com RSI
* **RBP**: frequentemente usado como ponteiro base em operações de memória, para referenciar variáveis locais e parâmetros de função na stack
* **RSP**: ponteiro para o topo da pilha (stack) do programa em execução

### Registradores especiais

Vamos destacar apenas 2 dos registradores considerados "especiais":

* **RFLAGS**: utilizado para armazenar o estado da CPU, frequentemente modificado por instruções aritméticas e controle de paridade binária
* **RIP**: ponteiro de instrução, que sempre contém o endereço da próxima instrução a ser executada. Por exemplo, a instrução `ret` busca o endereço do topo da pilha e modifica o `rip` para que o programa continue a partir daquele ponto


![tipos de registradores](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/z3ospgiir3a2nv78nm96.png)

### Precisamos sempre utilizar todos os 64 bits?

Sabemos que registradores nesta arquitetura **ocupam 64 bits de memória**. Mas e quando o dado que estamos manipulando não precisa dos 64 bits? Conseguimos otimizar o uso de memória?

> A ideia seria algo do tipo "por favor me dê uma fatia dos 64 bits, não preciso de tudo"

Historicamente, como vimos na parte II desta saga, as CPU's x86 não começaram com 64 bits. Evoluíram de 8 bits, para 16, então 32 até chegar em 64 bits.

Para manter compatibilidade, os registradores "legados" podem ser utilizados na arquitetura x64, e assim quando não houver necessidade de utilizar todos os bits do registrador, podemos utilizar uma _fatia menor_.

Por exemplo, o registrador RAX de 64-bits tem o seu equivalente de 32-bits que é o EAX, que **ocupa os 32 bits mais baixos**. 

O registrador EAX, por sua vez, tem o equivalente AX de 8-bits. Dentro deste AX, podemos utilizar ainda a parte **maior** que se chama AH ou a parte **menor** que se chama AL.

> O "H" em AH vem de "high", e consequentemente "L" de AL significa "low". Óbvio, não? :P

Sendo assim, há situações em que ao invés de:

```as
mov rax, 7  ; 1 byte mas ocupa 8 bytes (64 bits)
```

E sabendo que 42 não ocupa 64 bits, podemos mudar para:

```as
mov eax, 7  ; 1 byte mas ocupa 4 bytes (16 bits)
```

Ou então:

```as
mov ax, 7   ; 1 byte ocupando exatamente 1 byte (8 bits)
```

Assim o programa final passa a ocupar menos memória em sua totalidade. 

Seguindo esta lógica, podemos aplicar para todos os registradores, trazendo alguns como exemplo:

* **RAX**: `EAX -> AX -> AH -> AL`
* **RBX**: `EBX -> BX -> BH -> BL`
* **RDX**: `RDX -> DX -> DH -> DL`
* **R8**: `R8W -> R8B`


![fatias de registradores](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/wtp88ythfnm7yj2rhefw.png)

E assim por diante.

---

## Uma side note sobre stack frames

Depois de publicar o artigo, o [Rodrigo Gonçalves de Branco](https://twitter.com/rodrigogbranco) decidiu dar um [feedback ultra detalhado](https://docs.google.com/document/d/10xr0Qm6jatko2dRyQYqXuToXp5DShxl6dhmBnPPUAb4/edit) executando todos os exemplos aqui demonstrados, e um dos insights foi sobre a utilização de stack frames.

> Foi um trabalho fenomenal, meus agradecimentos ao Rodrigo

Voltando ao exemplo dos **argumentos na pilha**, dentro da rotina `_start`, temos a pilha do programa com o seguinte layout:


![rsp antes](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/uaiuvwiltzhlzj5bxner.png)

Quando fazemos a chamada:

```as
...
	push greet    ; adiciona "Hi, " na stack para print
	call .print     
...
```

Estamos basicamente _manipulando a pilha original_ do programa. O `push` vai colocar no topo da pilha (RSP) o endereço de `greet`, como demonstrado a seguir no GDB:

```bash
# Breakpoint no <push greet>
(gdb) break 13   

(gdb) run
(gdb) next

(gdb) x $rsp
0x7fffffffe448: 0x00402000
```

Agora a pilha ficou assim:

![layout com pilha e data](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/3tqkty8gtj5olc876qtd.png)

Se fizermos `step` no GDB, podemos ver que o RSP foi modificado novamente, desta vez adicionando o endereço da próxima instrução por conta da chamada `call`:

```bash
(gdb) step

(gdb) x $rsp
0x7fffffffe440: 0x0040100a
```


![layout com data e text](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/7kis57u2auas91bcebog.png)

_Isso é o que acontece com a pilha em uma simples chamada de rotina com argumentos!_

Bom, sabendo disso, vemos que o argumento que precisamos está em `rsp + 8`, exatamente como no nosso programa original. _So far, so good_.

O problema é que podemos reparar que o RSP é modificado durante as chamadas de funções no programa. Não temos controle sobre isso.

E podem acontecer _comportamentos inesperados_ (bugs?) quando isso ocorre, pelo simples fato de estarmos **apontando dados na pilha** e eles já estarem em posições que não esperávamos.

Para mitigar este potencial problema, podemos preservar a **base da pilha** em algum registrador sempre no início de cada função, desta forma cada rotina/função pode ter sua própria "versão" da pilha sem correr riscos de apontar para o dado errado. 

Esta técnica é chamada de **stack frame**. 

E é pra isso que usamos o **registrador RBP**! No _prólogo_ de cada rotina, adicionamos o `rbp` na pilha e em seguida colocamos o ponteiro de `rsp` dentro do registrador `rbp`, igualando assim ambos registradores:

```as
_start:
    push rbp
    mov rbp, rsp
....
```

![rsp e rbp](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/si286ldan8b9swswr9q0.png)

Repare que esta técnica consiste em _igualar_ RSP com RBP, assim pode-se de forma segura manipular o *ponteiro em RBP*, pois mesmo RSP sendo modificado pelo programa, RBP continua intacto.

Continuando com o programa:

```as
push rbp
mov rbp, rsp
....
push greet
call .print
....
```

Constatamos no GDB que a stack foi alterada, portanto RSP foi modificado para apontar para o endereço da próxima instrução, ao passo que RBP continua apontando pro valor anterior:

```bash
# RBP 
(gdb) x $rbp
0x7fffffffe448: 0x00000000

# RSP aponta para o endereço da próxima instrução 
# antes da chamada da rotina
(gdb) x $rsp
0x7fffffffe438: 0x0040100e

# RSP + 8 aponta para o primeiro argumento da rotina
(gdb) x $rsp + 8
0x7fffffffe440: 0x00402000

# RSP + 16 aponta para o mesmo valor de RBP (base da pilha),
# ou seja, `RBP = RSP + 16` neste caso porque houve um PUSH
# explícito do argumento e também outro push feito pelo CALL
(gdb) x $rsp + 16
0x7fffffffe448: 0x00000000
```

![rbp  = rsp + 16](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/a3fjvaxlpm4g8c41jnl8.png)

E modificando a rotina `.print` para também ter seu próprio stack frame, como fica a pilha depois de executar:

```as
.print:
    push rbp
    mov rbp, rsp
....
```

Analisando com GDB:

```bash
(gdb) x $rbp
0x7fffffffe430: 0xffffe448

(gdb) x $rsp
0x7fffffffe430: 0xffffe448
```

RSP e RBP ficaram igualados novamente, dando uma característica de stack frame, preservando a pilha como podemos ver na imagem a seguir:

![stack frame](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/oyrhiaqltlra50b8fi2w.png)

Portanto, o argumento da rotina, ao invés de ser `rsp + 8`, passa a ser `rbp + 16` por conta da stack frame, ficando da seguinte forma:

```as
.print:                  
	push rbp
	mov rbp, rsp

	mov rsi, [rbp + 16]     
	mov r9, rsi
	mov rdx, 0
```

_Uma coisa importante_: ao final de cada rotina, antes do *retorno*, devemos fazer `pop` do topo da pilha para voltar ao estado original antes do `push rbp` feito no início da rotina:

```as
push rbp
mov rbp, rsp
....
pop rbp
ret
```
Desta forma, ao fazer o `pop rbp`, o que está em RSP é justamente o endereço de retorno antes da chamada da função:


![pop do rbp antes do retorno](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/4kbrojascqyspoa4lhjl.png)

Ao continuar com o programa, a instrução `ret` (já falamos sobre ela anteriormente) faz *pop* do topo da pilha (RSP) e continua a execução do programa na próxima instrução:

```as
_start:
	push rbp
	mov rbp, rsp     ; <--- iguala RSP e RBP

	push greet       ; <--- adiciona <greet> na pilha
	call .print      ; <--- adiciona ponteiro da próxima 
                         ; instrução na pilha
	pop rax          ; <--- faz pop de <greet> da pilha      

............
.print:                 
	push rbp         
	mov rbp, rsp     ; <--- iguala RSP e RBP

	mov rsi, [rbp + 16]     
        .............
	syscall
	pop rbp          ; <--- remove frame RBP da pilha
	ret              ; <--- faz pop do pointeiro da 
                         ; próxima instrução e atualiza RIP
```

![layout depois do ret](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/nrhswxyhluvlc9yvlyem.png)

Quando o fluxo volta para quem chamou a rotina, a próxima instrução deve ser sempre o `pop` dos argumentos que entraram na pilha. 

Neste caso no exemplo anterior estamos fazendo _pop_ do argumento e descartando o valor em RAX com `pop rax`, deixando assim a pilha em seu estado anterior à chamada da rotina:


![final](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/uxp5nup5nzqs19hx3nwb.png)

Ao fim do programa (rotina `_start`), devemos também fazer `pop rbp`, assim a pilha volta ao estado original de quando foi iniciado o programa.

Código completo:

```as
global _start

%define SYS_write 1
%define SYS_exit 60
%define STDOUT 1

section .data
greet: db "Hi, ", 0
newline: db 0xA, 0

section .text
_start:
	push rbp               ; <-- cria um stack frame
	mov rbp, rsp           ; para preservar a pilha

	push greet             ; adiciona "Hi, " na pilha
	call .print            ; chama sub-rotina
	pop rax                ; remove "Hi, " da pilha

	push qword [rbp + 24]  ; adiciona argumento na pilha
	call .print            ; chama sub-rotina
	pop rax                ; remove argumento da pilhha

	push newline           ; adiciona newline na pilha
	call .print            ; chama-subrotina
	pop rax                ; remove newline da pilha

	pop rbp                ; remove RBP da pilha, 
                               ; retornando ao estado original
.exit:               
	mov rdi, 0
	mov rax, SYS_exit
	syscall                ; termina o programa
.print:                   
	push rbp               ; <-- cria um stack frame
	mov rbp, rsp           ; para preservar a pilha

	mov rsi, [rbp + 16]     
	mov r9, rsi
	mov rdx, 0
.calculate_size:               ; loop para calcular tamanho
	inc rdx
	inc r9
	cmp byte [r9], 0x00
	jz .done
	jmp .calculate_size
.done:                     
	mov rdi, STDOUT
	mov rax, SYS_write
	syscall

	pop rbp                ; <--- remove RBP da pilha, 
                               ; retornando ao estado anterior

	ret                    ; <--- retorna fluxo para o
                               ; estado anterior
```


![voltando ao estado original da pilha](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/4zqxli9xe88yxloe21ht.png)
 
É isto. Esta seção foi apenas uma demonstração de como utilizar boas práticas de manipulação da pilha quando utilizamos argumentos em funções, através da técnica de _criar um frame_ como **base da pilha** com o registrador RBP.


---

## Conclusão

É isto, pessoal. Esta parte da saga foi bastante densa. Passamos pela criação de um programa simples em Assembly, ao passo em que íamos depurando o programa com ferramentas como _strace_, _size_ e **muito gdb**.

Também aprendemos sobre labels, tipos de registradores, desvio de fluxo com jmp, call, ret, **muita stack**, depurando tudo e mais um pouco, loops, FLAGS e aritmética de ponteiro.

Apesar de ter sido muito denso, os tópicos aqui abordados servirão de base para entendermos o próximo artigo que já começa pesado com syscalls de rede, para iniciarmos o nosso tão esperado web server.

Nos vemos no próximo artigo!

---

## Referências

<sub>
Mnemonics
https://en.wikipedia.org/wiki/Mnemonic
Comparison of Assemblers
https://en.wikipedia.org/wiki/Comparison_of_assemblers
Linker (computing)
https://en.wikipedia.org/wiki/Linker_(computing)
Assembly x86 tutorial
https://www.tutorialspoint.com/assembly_programming/index.htm
Data segment
https://en.wikipedia.org/wiki/Data_segment
FLAGS register
https://en.wikipedia.org/wiki/FLAGS_register
Debugging with GDB
https://ncona.com/2019/12/debugging-assembly-with-gdb/
GDB command reference
https://visualgdb.com/gdbreference/commands/
GDB cheatsheet
https://cs.brown.edu/courses/cs033/docs/guides/gdb.pdf
[Vídeo] Introdução ao GNU Debugger - Blau Araújo
https://www.youtube.com/watch?v=t9OKpBKbJ4Q
</sub>
