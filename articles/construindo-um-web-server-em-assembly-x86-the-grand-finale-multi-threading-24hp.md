---
title: "Construindo um web server em Assembly x86, the grand finale, multi-threading"
slug: "construindo-um-web-server-em-assembly-x86-the-grand-finale-multi-threading-24hp"
published_at: "2024-07-14 02:37:25Z"
language: "pt-BR"
status: "published"
tags: ["braziliandevs", "assembly"]
---

Uma vez que temos um [web server funcional](https://dev.to/leandronsp/construindo-um-web-server-em-assembly-x86-parte-v-finalmente-o-server-9e5), podemos dar o próximo (e último) passo, que é deixar o servidor **minimamente escalável** fazendo uso de uma pool de threads. 

Neste artigo, vamos mergulhar nas entranhas da implementação de uma pool de threads com sincronização através de locks, e para atingir tal feito em assembly abordaremos filas, alocação dinâmica de memória e controle de locks com futex.

Ao fim deste artigo, que é o último da saga, teremos uma visão mais holística sobre como funciona um web server e como uma pool de threads poderia ser implementada em linguagens de baixo nível.

Respira e vem comigo, esta última parte será uma avalanche de conceitos.

---

## Agenda

* [Simulando a latência com nanosleep](#simulando-a-latência-com-nanosleep)
* [Simulando requests em escala com xargs](#simulando-requests-em-escala-com-xargs)
* [Concorrência com forking de processos](#concorrência-com-forking-de-processos)
* [Concorrência com clone de processo](#concorrência-com-clone-de-processo)
* [Concorrência com threads](#concorrência-com-threads)
  * [Entendendo a criação de uma thread](#entendendo-a-criação-de-uma-thread)
  * [Thread flags](#thread-flags)
  * [Alocação de memória com brk](#alocação-de-memória-com-brk)
  * [Modificando o server para suportar multi-threading](#modificando-o-server-para-suportar-multi--threading)
* [Concorrência com thread pool](#concorrência-com-thread-pool)
  * [Uma thread em loop](#uma-thread-em-loop)
  * [5 threads em loop](#5-threads-em-loop)
  * [Sincronização com futex](#sincronização-com-futex)
* [Alocação de memória com mmap](#alocação-de-memória-com-mmap)
* [Conclusão](#conclusão)
* [Referências](#referências)

---

## Simulando a latência com nanosleep
Quando uma requisição é feita a um web server, o tempo de resposta total é um somatório de toda a latência envolvida na comunicação, desde o momento em que o pedido sai da origem (client), passando pela rede de computadores (internet), chegando no destino (server), **sendo processado**, para então a resposta fazer o caminho inverso até voltar ao client.

Quanto maior a latência em qualquer parte do processo, maior o tempo de resposta, e portanto menor a capacidade de entregar respostas de diferentes requisições em um determinado intervalo de tempo.


![server-database](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/89cfxfykz32gd02sdjci.png)

> A esta capacidade de processar requisições em um intervalo de tempo chamamos de **throughput**. O que queremos no fim das contas é _aumentar o throughput sem comprometer a latência_. Esta é uma das premissas para sistemas escaláveis, mas o foco deste artigo não será em escalabilidade necessariamente.

No artigo anterior, finalizamos o web server que apenas responde no socket uma mensagem HTML contendo "Hello, world". A seguir o código inicial do server, que será a base para o restante do artigo:

```asm
global _start

%define SYS_socket 41
%define SYS_bind 49
%define SYS_listen 50
%define SYS_accept4 288
%define SYS_write 1
%define SYS_close 3

%define AF_INET 2
%define SOCK_STREAM 1
%define SOCK_PROTOCOL 0
%define BACKLOG 2
%define CR 0xD
%define LF 0xA

section .data
sockaddr:
	sa_family: dw AF_INET   ; 2 bytes
	port: dw 0xB80B         ; 2 bytes
	ip_addr: dd 0           ; 4 bytes
	sin_zero: dq 0          ; 8 bytes
response: 
	headline: db "HTTP/1.1 200 OK", CR, LF
	content_type: db "Content-Type: text/html", CR, LF
	content_length: db "Content-Length: 22", CR, LF
	crlf: db CR, LF
	body: db "<h1>Hello, World!</h1>"
responseLen: equ $ - response

section .bss
sockfd: resb 1

section .text
_start:
.socket:
	; int socket(int domain, int type, int protocol)
	mov rdi, AF_INET
	mov rsi, SOCK_STREAM
	mov rdx, SOCK_PROTOCOL
	mov rax, SYS_socket
	syscall
.bind:
	mov [sockfd], rax
	; int bind(int sockfd, const struct sockaddr *addr, socklen_t addrlen)
	mov rdi, [sockfd]
	mov rsi, sockaddr
	mov rdx, 16
	mov rax, SYS_bind
	syscall
.listen:
	; int listen(int sockfd, int backlog)
	mov rdi, [sockfd]
	mov rsi, BACKLOG
	mov rax, SYS_listen
	syscall
.accept:
	; int accept(int sockfd, struct *addr, int addrlen, int flags)
	mov rdi, [sockfd]
	mov rsi, 0
	mov rdx, 0
	mov r10, 0
	mov rax, SYS_accept4
	syscall
	mov r8, rax
	call handle
	jmp .accept
handle:
	; int write(fd)
	mov rdi, r8
	mov rsi, response
	mov rdx, responseLen
	mov rax, SYS_write
	syscall

	; int close(fd)
	mov rdi, r8
	mov rax, SYS_close
	syscall
	ret
```

Até aqui tudo normal. A rotina `accept` fica em loop chamando a rotina `handle` que escreve "Hello, world" na resposta de cada requisição que chega no socket.

Com _strace_, podemos ver as chamadas que foram feitas após uma requisição com _curl_:

```bash
socket(AF_INET, SOCK_STREAM, IPPROTO_IP) = 3
bind(3, {sa_family=AF_INET, sin_port=htons(3000), sin_addr=inet_addr("0.0.0.0")}, 16) = 0
listen(3, 2)                            = 0
accept4(3, NULL, NULL, 0)               = 4
write(4, "HTTP/1.1 200 OK\r\nContent-Type: t"..., 86) = 86
close(4)                                = 0
accept4(3, NULL, NULL, 0
```

> **socket**, bind, listen, para então iniciar o **accept**, que ao receber uma requisição HTTP, passa para **write**, **close** e então voltar ao **accept** novamente em loop.

Para simular um pouco de latência, vamos fazer com que a resposta demore cerca de 1 segundo, e para tanto precisamos utilizar uma syscall no Linux chamada `nanosleep`, que suspende a execução da thread atual até atingir um tempo decorrido especificado com base no relógio monotônico do sistema:

Primeiro definimos a syscall, que tem o código 35:

```as
%define SYS_nanosleep 35
```

Na rotina `handle`, antes de escrever a resposta no socket, fazemos a chamada de sistema para **nanosleep** passando como argumento uma struct que representa um _timespec_, que contempla o tempo decorrido em segundos e nano-segundos:

```as
handle:
	; int nanosleep(timespec duration)
	lea rdi, [timespec]
	mov rax, SYS_nanosleep
	syscall

	; int write(fd)
	...

	; int close(fd)
	...
```

E na seção de dados, definimos o tempo decorrido em segundos, que são os primeiros 8 bytes da struct, deixando a _zero_ os 8 bytes restantes que representam o tempo em nano-segundos

```as
section .data
timespec:
	tv_sec: dq 1
	tv_nsec: dq 0
```

> Neste exemplo queremos que o sleep seja de 1 segundo

Com _strace_, podemos ver que a syscall `nanosleep` foi executada após o **accept** e antes do **write**:

```bash
socket(AF_INET, SOCK_STREAM, IPPROTO_IP) = 3
bind(3, {sa_family=AF_INET, sin_port=htons(3000), sin_addr=inet_addr("0.0.0.0")}, 16) = 0
listen(3, 2)                            = 0

accept4(3, NULL, NULL, 0)               = 4
nanosleep({tv_sec=1, tv_nsec=0}, NULL)  = 0
write(4, "HTTP/1.1 200 OK\r\nContent-Type: t"..., 86) = 86

close(4)                                = 0
accept4(3, NULL, NULL, 0
```

Calculando o tempo decorrido com o utilitário `time`:

```bash
$ time curl localhost:3000

<h1>Hello, World!</h1>
real    0m1.040s
user    0m0.005s
sys     0m0.009s
```

Podemos também encurtar a resposta do time trazendo apenas o tempo real, exportando a variável na sessão shell atual ou adicionando no `bashrc`:

```bash
export TIMEFORMAT=%R

$ time curl localhost:3000
<h1>Hello, World!</h1>1.036
```

_Yay!_ Já conseguimos simular uma latência de 1 segundo em Assembly. Agora vamos ver se nosso web server tem a capacidade de atender a **requests em escala**.

---
## Simulando requests em escala com xargs

Para começar, vamos simular 10 requests sequenciais com curl. Poderíamos ficar digitando `curl localhost:3000` 10 vezes, ou então ser pragmáticos, automatizar sem reinventar a roda e nem instalar nada adicional no sistema.

> Como?

_xargs._

**xargs** é um utilitário presente na maioria dos sistemas operacionais UNIX-like, que lê strings a partir de arquivos ou standard input e utiliza estas strings como argumentos para comandos arbitrários.

Vamos ter como exemplo uma sequência de 1 a 10 em bash:

```bash
$ echo ${1..10}
1 2 3 4 5 6 7 8 9 10
```

Podemos utilizar cada valor do **echo** como argumento para o xargs:

```bash
$ echo {1..10} | xargs -n1
1
2
3
4
5
6
7
8
9
10
```

A opção `-n1` significa a quantidade de argumentos que serão usados para o comando que vem a seguir ao xargs, que no caso queremos apenas 1 argumento, o que neste caso tanto faz pois não queremos fazer nada com o argumento: queremos apenas executar o comando **curl** 10 vezes.

Podemos então agora executar o **curl** com o time para saber o tempo decorrido de cada request:

```bash
$ time echo {1..10} | xargs -n1 bash -c "time curl localhost:3000"

<h1>Hello, World!</h1>1.037
<h1>Hello, World!</h1>1.033
<h1>Hello, World!</h1>1.025
<h1>Hello, World!</h1>1.037
<h1>Hello, World!</h1>1.032
<h1>Hello, World!</h1>1.026
<h1>Hello, World!</h1>1.019
<h1>Hello, World!</h1>1.046
<h1>Hello, World!</h1>1.053
<h1>Hello, World!</h1>1.041
10.426
```

Claramente, vemos que cada request demorou cerca de 1 segundo, o que no total o tempo decorrido foi de **10,4** segundos. Esta é a latência total para o caso de fazermos requisições sequenciais.

E se fizermos **requisições simultâneas**? Num cenário mais próximo do real, vamos supor que nossa aplicação web recebe 10 requisições no mesmo segundo em horários de pico.

Para isto, conseguimos também utilizar o **xargs** para simular, através da opção `-P`, que representa a quantidade de processos simultâneos que o xargs irá utilizar para realizar os comandos. 

> Incrível! Com isto nosso web server atende 10 requisições simultâneas, fazendo com que o throughput total dos 10 requests fique em torno de 1 segundo, certo?

_Calma, calabreso_, vamos testar.

```bash
$ time echo {1..10} | xargs -n1 -P10 bash -c "time curl localhost:3000"

<h1>Hello, World!</h1>1.053
<h1>Hello, World!</h1>2.071
<h1>Hello, World!</h1>3.076
<h1>Hello, World!</h1>4.087
<h1>Hello, World!</h1>5.088
<h1>Hello, World!</h1>6.106
<h1>Hello, World!</h1>7.140
<h1>Hello, World!</h1>8.154
<h1>Hello, World!</h1>9.168
<h1>Hello, World!</h1>10.183
10.214
```

**Não melhorou nada!** Ter 10 requests simultâneos não quer dizer que nosso server consiga atender os 10 requests ao mesmo tempo. Muito pelo contrário, pode até piorar e prejudicar a latência total, pois há diversos requests na fila esperando para serem atendidos.

- o primeiro request demora 1 segundo
- o segundo request chega ao mesmo tempo mas demora 2 segundos
- o terceiro request chega ao mesmo tempo mas demora 3 segundos
- e assim sucessivamente...

Nosso server é síncrono, e com isto podemos criar gargalos. Precisamos então que o server consiga lidar com **concorrência**.

---
## Concorrência com forking de processos

Uma das formas primitivas de concorrência e escalar um web server para atender mais de um request em simultâneo é com o uso de **processos**. Como cada processo no sistema operacional tem sua *memória isolada* dos demais, podemos fazer com que cada request seja atendido em um processo diferente.

Para entender esta técnica, precisamos compreender que _todo programa de computador_ roda em um **processo** no sistema operacional, e isto vimos bastante nos artigos anteriores. Dentro deste processo, o programa ainda roda em uma unidade de execução no SO chamada **thread**. 

> Todo processo tem uma thread chamada _thread principal_, que é onde está sendo executado o programa

No exemplo anterior, quando chamamos o _sleep_, a thread que está sendo suspensa por um tempo determinado é justamente a **thread principal** do programa.

A thread compartilha a memória do processo o qual ela faz parte, mas como precisamos criar **outro processo**, temos de fazer um _forking_, que basicamente *cria um processo filho copiando tudo* o que o programa principal tem.


![forking de processos](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/fhz3hnrjktfwv33zqdpv.png)

Repare que cada processo filho tem uma cópia do processo principal. O loop é basicamente o **accept** do nosso web server, que fica em loop. Desta forma cada request pode ser atendido por um processo diferente, **de forma concorrente**.

Podemos fazer forking de processo com o uso da syscall _fork_:

```as
%define SYS_fork 57
```

A rotina _handle_ mantém igual, com o sleep antes de escrever a resposta no socket:

```as
handle:
	lea rdi, [timespec]
	mov rax, SYS_nanosleep
	syscall

	; int write(fd)
	mov rdi, r8
	mov rsi, response
	mov rdx, responseLen
	mov rax, SYS_write
	syscall

	; int close(fd)
	mov rdi, r8
	mov rax, SYS_close
	syscall
	ret
```

E na rotina **accept**, adicionamos a chamada do fork logo após o request chegar no socket:

```as
.accept:
	; int accept(int sockfd, struct *addr, int addrlen, int flags)
	mov rdi, [sockfd]
	mov rsi, 0
	mov rdx, 0
	mov r10, 0
	mov rax, SYS_accept4
	syscall
	mov r8, rax

	; fork de processo
	mov rax, SYS_fork
	syscall

	; se o retorno do fork for ZERO, significa que está sendo executado
	; a partir do processo filho. Então a rotina "handle" é executada
	test rax, rax
	jz handle

	; quando o retorno não é ZERO, significa que a execução do programa 
	; principal continuou. Então o processo principal volta para o loop
	jmp .accept
```

* depois de uma chamada ao **fork**, a syscall retorna ZERO quando se está dentro do processo filho. Neste caso, a execução do processo filho continua com a rotina _handle_ e depois termina
* após a chamada do fork, se o retorno NÃO for ZERO, significa que a execução é do programa principal, então neste caso volta-se ao loop para esperar um novo request no socket

Ao executar com strace, podemos ver várias chamadas à syscall _fork_:

```bash
socket(AF_INET, SOCK_STREAM, IPPROTO_IP) = 3
bind(3, {sa_family=AF_INET, sin_port=htons(3000), sin_addr=inet_addr("0.0.0.0")}, 16) = 0
listen(3, 2)                            = 0
accept4(3, NULL, NULL, 0)               = 4
fork(strace: Process 12787 attached
)                                  = 12787
[pid 12786] accept4(3, NULL, NULL, 0 <unfinished ...>
[pid 12787] nanosleep({tv_sec=1, tv_nsec=0},  <unfinished ...>
[pid 12786] <... accept4 resumed>)      = 5
[pid 12786] fork(strace: Process 12788 attached
)                      = 12788
[pid 12788] nanosleep({tv_sec=1, tv_nsec=0},  <unfinished ...>
[pid 12786] accept4(3, NULL, NULL, 0)   = 6
[pid 12786] fork(strace: Process 12789 attached
)                      = 12789
[pid 12786] accept4(3, NULL, NULL, 0)   = 7
[pid 12786] fork( <unfinished ...>
[pid 12789] nanosleep({tv_sec=1, tv_nsec=0}, strace: Process 12790 attached
 <unfinished ...>
[pid 12786] <... fork resumed>)         = 12790
[pid 12790] nanosleep({tv_sec=1, tv_nsec=0},  <unfinished ...>
[pid 12786] accept4(3, NULL, NULL, 0)   = 8
[pid 12786] fork(strace: Process 12791 attached
```

E os tempos de resposta para 10 requests simultâneos:

```bash
$ time echo {1..10} | xargs -n1 -P10 bash -c "time curl localhost:3000"

<h1>Hello, World!</h1>1.049
<h1>Hello, World!</h1><h1>Hello, World!</h1><h1>Hello, World!</h1><h1>Hello, World!</h1>1.051
1.053
1.052
1.055
<h1>Hello, World!</h1>1.051
<h1>Hello, World!</h1>1.052
<h1>Hello, World!</h1>1.056
<h1>Hello, World!</h1>2.106
<h1>Hello, World!</h1>2.116
2.138
```

Yay! Podemos ver que os requests são atendidos de forma concorrente, e que o tempo total ficou em **2,1 segundos** para 10 requests simultâneos!

> Lembrando que, quando estamos lidando com concorrência, não temos controle da ordem de execução dos processos, que são escalonados pelo sistema operacional. Esta preempção de processos pode fazer com que um request que chegou depois seja atendido primeiro. É uma das características de _race condition_ e é por isso que vemos os requests chegando fora de ordem.

Mas no nosso caso não importa. Cada request é único e não depende do anterior.

---
## Concorrência com clone de processo

Outra forma muito similar à chamada _fork_ é através da syscall **clone**, que basicamente clona um processo, tal como fizemos no exemplo anterior, garantindo isolamento e concorrência.

```as
%define SYS_clone 56
```

E a diferença é que chamamos a syscall de clone, ao invés da syscall fork:

```as
.accept:
	; int accept(int sockfd, struct *addr, int addrlen, int flags)
	mov rdi, [sockfd]
	mov rsi, 0
	mov rdx, 0
	mov r10, 0
	mov rax, SYS_accept4
	syscall
	mov r8, rax

	; chamada à syscall clone
	; com argumentos a ZERO, significa que será feito um clone do processo
	mov rdi, 0
	mov rsi, 0
	mov rax, SYS_clone
	syscall

	; se o retorno for zero, execução é a partir do processo filho
	test rax, rax
	jz handle

	; continuação da execução do processo principal
	jmp .accept
```

- depois de uma chamada ao **clone**, a syscall retorna ZERO quando se está dentro do processo filho. Neste caso, a execução do processo filho continua com a rotina _handle_ e depois termina
* após a chamada do clone, se o retorno NÃO for ZERO, significa que a execução é do programa principal, então neste caso volta-se ao loop para esperar um novo request no socket

Executamos com strace e:

```bash
<h1>Hello, World!</h1><h1>Hello, World!</h1>1.062
1.064
<h1>Hello, World!</h1><h1>Hello, World!</h1>1.063
1.061
<h1>Hello, World!</h1><h1>Hello, World!</h1>1.071
1.061
<h1>Hello, World!</h1>1.059
<h1>Hello, World!</h1>1.069
<h1>Hello, World!</h1><h1>Hello, World!</h1>2.135
2.128
2.148
```

Ainda servindo 10 requests simultâneos **perto dos 2 segundos**! _Not bad_. 

Entretanto, forking ou clone de processos leva a um **gasto excessivo de memória**, pois cada processo filho é exatamente uma cópia do processo principal. Se o principal tem 200MB de memória, com 4 forks teríamos um gasto total de 800MB de memória.

Chegou o momento de falarmos das **threads**.

---
## Concorrência com threads

Vamos relembrar o que falamos no início do artigo:

> Todo processo tem uma thread chamada _thread principal_, que é onde está sendo executado o programa

Apesar de todo programa rodar dentro de uma thread, podemos também criar mais threads que **compartilham a memória do mesmo processo**, e para isto podemos fazer uso da mesma syscall **clone**, mas passando argumentos diferentes que tornam este clone uma _thread dentro do mesmo processo_, e não uma cópia inteira do processo.

Desta forma, ficamos sempre com UM processo mas atendendo requests em threads diferentes, **gastando assim menos memória** se comparado com forking de processos.


![threads](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/vszydp3du1ntg72xizmd.png)

### Entendendo a criação de uma thread

Antes de adaptarmos o código do server para utilizar threads, vamos dar um passo atrás e entender como se cria uma thread em Assembly.

Para criar uma thread, fazemos uso da syscall **clone**. De acordo com a [documentação](https://man7.org/linux/man-pages/man2/clone.2.html), a syscall clone cria um processo "filho", similar ao que fizemos no fork. Mas a diferença é que a syscall clone permite um maior controle sobre o que será compartilhado entre o processo principal e o processo filho.

```as
%define SYS_clone 56
```

Coisas que podem ser compartilhadas (ou não):

- espaço de endereço de memória virtual
- tabela de descritores de arquivos
- tabela de handlers de sinais
- entre outros recursos...

> No exemplo anterior utilizamos a syscall clone passando argumentos a ZERO, o que significa que não queríamos compartilhar nada entre os processos, portanto uma cópia seria feita como no forking de processos

Para a execução da syscall, precisamos enviar 2 argumentos:
- **rdi**: representa as _flags_, que modificam o comportamento do que será compartilhado com o processo filho (thread)
- **rsi**: ponteiro para a função que a thread irá executar, que precisa ser definido dentro de uma **área reservada na memória**, ou seja, precisamos alocar um novo bloco de memória para a thread poder colocar a função e seus argumentos

Portanto, para criar uma thread, precisamos de **thread flags** e **alocação de memória**.
### Thread flags

Em RDI, vamos passar as seguintes flags:

- **CLONE_VM**: processo principal e processo filho compartilham o mesmo espaço de memória virtual
- **CLONE_FS**: processos compartilham o mesmo sistema de arquivos
- **CLONE_FILES**: processos compartilham a mesma tabela de descritor de arquivos (file descriptor table)
- **CLONE_SIGHAND**: processos compartilham a mesma tabela de handlers de sinais (signal handlers)
- **CLONE_PARENT**: processos compartilham o mesmo parent, ou seja, o processo "filho" na verdade é filho do processo parent do processo original (mesmo porque estamos falando de uma thread que compartilha o mesmo processo)
- **CLONE_THREAD**: o processo filho é colocado no mesmo grupo de threads do processo original
- **CLONE_IO**: processos compartilham o mesmo contexto de I/O

 > No fim das contas, estamos criando um processo "filho" mas que compartilha recursos com o processo principal. **Este é o princípio da thread.**

```as
mov rdi, CLONE_VM|CLONE_FS|CLONE_FILES|CLONE_SIGHAND|CLONE_PARENT|CLONE_THREAD|CLONE_IO
```

### Alocação de memória com brk

 Em RSI, precisamos indicar o ponteiro para a função na memória, neste caso o ponteiro da rotina **handle**, que tem a lógica de imprimir a mensagem  e etc. Mas aqui não basta indicar o ponteiro, mas sim em **que região da memória** do processo a thread irá armazenar a função, seus argumentos e variáveis locais.

> Cada thread precisa ter sua própria região na memória para armazenar a função e argumentos. É como se a thread tivesse uma área de "stack" só dela

Para alocar memória, vamos relembrar como funciona o layout de um programa na memória:


![layout de memória](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/co0lxnlhbx2nz7uhx4k6.png)

Nos endereços de memória mais baixos, temos o programa, e a seguir temos os _dados estáticos_ (data). No topo, que é onde ficam os endereços mais altos, temos a _stack_.

E no meio, o que temos **a seguir a seção de dados** é uma área enorme disponível na memória. A syscall **brk** permite mudar o ponto onde _termina a seção de dados_, também chamado de **program break**.

Podemos ficar mudando este break em direção aos endereços mais altos. Por exemplo, se chamarmos a syscall brk passando argumento ZERO, ela devolve o endereço de memória do program break, que é onde termina a seção de dados:

```as
%define SYS_brk 12

...

mov rdi, 0
mov rax, SYS_brk
syscall
```

O que temos em RAX é `0x403000`, que é exatamente o endereço de memória onde termina a seção de dados. Vamos modificar o break **andando UM byte pra frente**:

```as
mov rdi, rax
add rdi, 1
mov rax, SYS_brk
syscall
```

Agora, RAX traz o endereço do novo program break, que é `0x403001`. Ou seja, agora podemos manipular este endereço de memória no nosso programa.


![program break](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/d32sk2d6w5eitngvri0y.png)

> E o quê isto tem a ver com a thread? 

Podemos alocar **uma quantidade arbitrária de bytes** para a thread utilizar nesta área na memória. Como o break é sempre modificado, a próxima thread irá utilizar outra área de memória, e assim sucessivamente!


![criação de threads](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/bir1ll5slqqmsmhu7q25.png)

### Um "Hello, world" com threads em Assembly

Vamos escrever um exemplo simples antes de ir para o web server. Primeiro, definimos as constantes, dentre elas as syscalls e as flags pra criação de threads:

```as
global _start

%define SYS_brk 12
%define SYS_clone 56
%define SYS_write 1        
%define SYS_exit 60

%define STDOUT 1
%define CHILD_STACK_SIZE 4096

%define CLONE_VM 0x00000100
%define CLONE_FS 0x00000200
%define CLONE_FILES 0x00000400
%define CLONE_PARENT 0x00008000
%define CLONE_THREAD 0x00010000
%define CLONE_IO 0x80000000
%define CLONE_SIGHAND 0x00000800
```

A seguir, na seção de dados, temos a mensagem "Hello, world" que a thread irá imprimir:

```as
section .data
msg: db "Hello"
msgLen: equ $ - msg
```

Na seção _text_, o entrypoint do programa faz uma chamada à rotina da _thread_ e a seguir termina:

```as
section .text
_start:
	call thread

	mov rdi, 0
	mov rax, SYS_exit
	syscall
```

Agora, a definição da rotina `handle` que a thread irá executar:

```as
handle:
	mov rdi, STDOUT
	mov rsi, msg
	mov rdx, msgLen
	mov rax, SYS_write
	syscall

	mov rdi, 0
	mov rax, SYS_exit
	syscall
```

> A thread imprime a mensagem no STDOUT e termina. Sim, a thread precisa terminar, caso contrário o sistema emite um segmentation fault

E por fim, vamos detalhar o processo da rotina da _thread_ (explicação nos comentários do exemplo a seguir):

```as
thread:
	; Busca o break atual e guarda em RDX. Na primeira vez, o valor
	; é 0x403000
	mov rdi, 0
	mov rax, SYS_brk
	syscall
	mov rdx, rax

	; Modifica o break atual andando 4096 bytes à frente.
	; Após esta chamada, o break passa a ser 0x404000
	mov rdi, rax
	add rdi, CHILD_STACK_SIZE
	mov rax, SYS_brk
	syscall

	; (1) Thread flags: como deve ser feito o compartilhamento de recursos
	; entre o processo principal e o processo filho
	mov rdi, CLONE_VM|CLONE_FS|CLONE_FILES|CLONE_SIGHAND|CLONE_PARENT|CLONE_THREAD|CLONE_IO
	
	; (2a) Endereço de memória em RSI: é o break atual + 4096 bytes.
	; Retiramos também 8 bytes para caber o ponteiro da função
	lea rsi, [rdx + CHILD_STACK_SIZE - 8]

	; (2b) No endereço em RSI colocamos o ponteiro da função "handle".
	; Como endereçamento em x86_64 é de 8 bytes, é por isto
	; que no passo anterior fizemos [rdx + 4096 - 8]
	mov qword [rsi], handle
	mov rax, SYS_clone
	syscall
	ret
```

E pronto, ao executar o programa, temos a mensagem "Hello" na saída do programa que foi feita pela thread.

Caso o programa principal faça `call thread` 2 vezes, a próxima thread irá ter em RSI o break modificado, iniciando em `0x404000`.

### Modificando o server para suportar multi-threading

Agora vamos trazer o código necessário para modificar o server:

```as
%define SYS_clone 56
%define SYS_brk 12
```

Thread flags:

```as
%define CHILD_STACK_SIZE 4096
%define CLONE_VM 0x00000100
%define CLONE_FS 0x00000200
%define CLONE_FILES 0x00000400
%define CLONE_PARENT 0x00008000
%define CLONE_THREAD 0x00010000
%define CLONE_IO 0x80000000
%define CLONE_SIGHAND 0x00000800
```

Rotina *accept*:

```as
.accept:
	; int accept(int sockfd, struct *addr, int addrlen, int flags)
	mov rdi, [sockfd]
	mov rsi, 0
	mov rdx, 0
	mov r10, 0
	mov rax, SYS_accept4
	syscall
	mov r8, rax

	; Chamada da thread. Irá ser executada assincronamente tal como no
	; forking de processos, mas compartilhando a memória do
	; processo principal
	call thread

	; Processo principal volta para o loop
	jmp .accept
```

Definição da _thread_:

```as
thread:
	mov rdi, 0
	mov rax, SYS_brk
	syscall
	mov rdx, rax

	mov rdi, rax
	add rdi, CHILD_STACK_SIZE
	mov rax, SYS_brk
	syscall

	mov rdi, CLONE_VM|CLONE_FS|CLONE_FILES|CLONE_SIGHAND|CLONE_PARENT|CLONE_THREAD|CLONE_IO
	lea rsi, [rdx + CHILD_STACK_SIZE - 8]
	mov qword [rsi], handle
	mov rax, SYS_clone
	syscall
	ret
```

> Aqui seguimos o mesmo padrão do exemplo anterior: aloca memória com brk e a seguir executa a syscall clone com as flags de compartilhamento de recursos

E a lógica da rotina _handle_ **que será executada pela thread**, que faz o _sleep_, a seguir escreve no socket a mensagem, fecha o socket da requisição e por fim termina sua execução:

```as
handle:
	lea rdi, [timespec]
	mov rax, SYS_nanosleep
	syscall

	; int write(fd)
	mov rdi, r8
	mov rsi, response
	mov rdx, responseLen
	mov rax, SYS_write
	syscall

	; int close(fd)
	mov rdi, r8
	mov rax, SYS_close
	syscall

	mov rdi, 0
	mov rax, SYS_exit
	syscall
```

Com 1 chamada isolada, temos o seguinte output com strace:

```bash
socket(AF_INET, SOCK_STREAM, IPPROTO_IP) = 3
bind(3, {sa_family=AF_INET, sin_port=htons(3000), sin_addr=inet_addr("0.0.0.0")}, 16) = 0
listen(3, 2)                            = 0
accept4(3, NULL, NULL, 0)               = 4
brk(NULL)                               = 0x9da000
brk(0x9db000)                           = 0x9db000
clone(child_stack=0x9daff8, flags=CLONE_VM|CLONE_FS|CLONE_FILES|CLONE_SIGHAND|CLONE_PARENT|CLONE_THREAD|CLONE_IOstrace: Process 13078 attached
) = 13078
[pid 13078] nanosleep({tv_sec=1, tv_nsec=0},  <unfinished ...>
[pid 13077] accept4(3, NULL, NULL, 0 <unfinished ...>
[pid 13078] <... nanosleep resumed>0x9daff8) = 0
[pid 13078] write(4, "HTTP/1.1 200 OK\r\nContent-Type: t"..., 86) = 86
[pid 13078] close(4)                    = 0
[pid 13078] exit(0)                     = ?
[pid 13078] +++ exited with 0 +++
<... accept4 resumed>)                  = ? ERESTARTSYS (To be restarted if SA_RESTART is set)
--- SIGWINCH {si_signo=SIGWINCH, si_code=SI_KERNEL} ---
accept4(3, NULL, NULL, 0
```

Vamos reparar na sequência de chamadas:

- depois do accept, foi feita uma chamada a **brk** modificando o program break (alocando memória)
- a seguir, vemos a chamada **clone**, que acoplou o processo filho 13078
- a thread (13078) é suspensa com **nanosleep** por 1 segundo
- o processo principal (13077) volta para o **accept** e fica a espera de mais requests
- a thread **escreve** no socket
- a thread **fecha** o socket
- a thread é encerrada com **exit**

Agora, simulando os 10 requests simultâneos:

```bash
<h1>Hello, World!</h1>1.060
<h1>Hello, World!</h1>1.064
<h1>Hello, World!</h1>1.064
<h1>Hello, World!</h1>1.062
<h1>Hello, World!</h1>1.068
<h1>Hello, World!</h1>1.073
<h1>Hello, World!</h1><h1>Hello, World!</h1><h1>Hello, World!</h1><h1>Hello, World!</h1>2.098
2.094
2.097
2.091
2.113
```

_Superb!_ Temos o mesmo tempo total de **2,1 segundos** mas gastando **muito menos memória**!

Entretanto, temos um pequeno problema. Imagina que num momento de grande número de acessos, a nossa aplicação recebe 1000 requests concorrentes. E se receber 5000? Ou então **dezenas de milhares** de requests simultâneos?

Uma **chamada de sistema tem custo**. O sistema operacional oferece um limite de threads que podem ser criadas ao mesmo tempo por processo. Se deixarmos assim, nossa aplicação corre um grande risco de ultrapassar esse limite, além de que chamadas a _brk + clone_ têm seus custos de criação.

E se pudéssemos reciclar um número limitado de threads? Sim, estamos falando de **pool de threads**.

---

## Concorrência com thread pool

A forma mais comum de trabalhar com thread é com _thread pool_. Basicamente, definimos um número arbitrário de threads **que nunca terminam**, mas ficam em loop consumindo mensagens de alguma estrutura de dados. Esta estrutura pode ser uma **fila**.


![thread pool](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/i8ysvzs13lo7jju7opfs.png)

### Uma thread em loop

Vamos inicialmente definir que teremos apenas UMA thread em loop lendo mensagens da fila. O processo deverá ser o seguinte:

- processo principal inicia uma thread
- a thread fica em loop lendo mensagens (socket) da fila. Quando tiver vazia, repete o loop. Quando houver algum socket na fila, a thread executa a lógica que é fazer o _nanosleep_, escrever no socket, fechar o socket, e voltar para o loop de leitura da fila
- processo principal continua execução após criação da thread, onde fica em loop lendo requisições que chegam no socket (accept). Quando uma requisição chega, adiciona o socket na fila e volta para o loop do **accept**.

Vamos passo a passo, começando pelas constantes:

```as
global _start

%define SYS_socket 41
%define SYS_bind 49
%define SYS_listen 50
%define SYS_accept4 288
%define SYS_write 1
%define SYS_close 3

%define SYS_nanosleep 35
%define SYS_clone 56
%define SYS_brk 12
%define SYS_exit 60

%define AF_INET 2
%define SOCK_STREAM 1
%define SOCK_PROTOCOL 0
%define BACKLOG 2
%define CR 0xD
%define LF 0xA

%define CHILD_STACK_SIZE 4096
%define CLONE_VM 0x00000100
%define CLONE_FS 0x00000200
%define CLONE_FILES 0x00000400
%define CLONE_PARENT 0x00008000
%define CLONE_THREAD 0x00010000
%define CLONE_IO 0x80000000
%define CLONE_SIGHAND 0x00000800
```

A seguir, a seção de dados:

```as
section .data
sockaddr:
	sa_family: dw AF_INET   ; 2 bytes
	port: dw 0xB80B         ; 2 bytes
	ip_addr: dd 0           ; 4 bytes
	sin_zero: dq 0          ; 8 bytes
response: 
	headline: db "HTTP/1.1 200 OK", CR, LF
	content_type: db "Content-Type: text/html", CR, LF
	content_length: db "Content-Length: 22", CR, LF
	crlf: db CR, LF
	body: db "<h1>Hello, World!</h1>"
responseLen: equ $ - response
timespec:
	tv_sec: dq 1
	tv_nsec: dq 0
queuePtr: db 0

section .bss
sockfd: resb 8
queue: resb 8
```

Repare que a fila representa 8 bytes fixos (para nosso exemplo é o suficiente), utilizando também um ponteiro para manipular a fila. 

Seguindo com o código, o programa inicia logo disparando a thread:

```as
section .text
_start:
	call thread        
```

A seguir vêm as rotinas habituais (vou omitir pra poupar caracteres neste artigo): _socket, bind e listen_.

O **accept** fica da seguinte forma:

```as
.accept:
	; int accept(int sockfd, struct *addr, int addrlen, int flags)
	mov rdi, [sockfd]
	mov rsi, 0
	mov rdx, 0
	mov r10, 0
	mov rax, SYS_accept4
	syscall

	mov r8, rax
	call enqueue

	jmp .accept
```

Okay, agora, ao invés de _chamar uma thread_, o programa principal enfileira o socket da requisição. Lógica do `enqueue`:

```as
enqueue:
	xor rdx, rdx
	mov dl, [queuePtr]	
	mov [queue + rdx], r8	
	inc byte [queuePtr]
	ret
```

Aqui, estamos manipulando o ponteiro em `queue` utilizando `queuePtr`, incrementando um byte quando algo é adicionado na fila.

Agora vamos à implementação da rotina da thread:

```as
thread:
	mov rdi, 0
	mov rax, SYS_brk
	syscall
	mov rdx, rax

	mov rdi, rax
	add rdi, CHILD_STACK_SIZE
	mov rax, SYS_brk
	syscall

	mov rdi, CLONE_VM|CLONE_FS|CLONE_FILES|CLONE_SIGHAND|CLONE_PARENT|CLONE_THREAD|CLONE_IO
	lea rsi, [rdx + CHILD_STACK_SIZE - 8]
	mov qword [rsi], handle
	mov rax, SYS_clone
	syscall
	ret
```

Nada de novo por enquanto. O que modifica é a rotina _handle_ (explicação detalhada nos comentários):

```as
handle:
	; Verifica se a fila está vazia. Se estiver, fica em loop infinito.
	; Repare que este código não está otimizado. Loop infinito 
	; acarreta alto consumo de CPU. Nas próximas seções vamos resolver isto.
	; Por ora, vamos aceitar este consumo de CPU.
	cmp byte [queuePtr], 0
	je handle

	; Remove (faz pop) da fila de socket, e guarda em R8.
	call dequeue
	mov r8, rax

	; Processo normal, faz o nanosleep de 1 segundo simulando latência
	lea rdi, [timespec]
	mov rax, SYS_nanosleep
	syscall

	; Escreve no socket que está em R8
	; int write(fd)
	mov rdi, r8
	mov rsi, response
	mov rdx, responseLen
	mov rax, SYS_write
	syscall

	; Fecha o socket
	; int close(fd)
	mov rdi, r8
	mov rax, SYS_close
	syscall

	; Volta para o início (loop)
	jmp handle
```

E por último, a lógica da rotina _dequeue_:

```as
dequeue:
	xor rax, rax
	xor rsi, rsi

	mov al, [queue]
	mov rcx, 0
.loop_dequeue:
	cmp byte [queuePtr], 0
	je .return_dequeue

	cmp cl, [queuePtr]
	je .done_dequeue

	; shift
	xor r10, r10
	mov r10b, [queue + rcx + 1]
	mov byte [queue + rcx], r10b

	inc rcx
	jmp .loop_dequeue
.done_dequeue:
	dec byte [queuePtr]
.return_dequeue:
	ret
```

> Por enquanto não vou entrar em detalhes em como trabalhar com filas em Assembly. Vou deixar estes detalhes para outro artigo, que irá tratar especificamente de arrays, filas e listas ligadas. Em breve!

Pronto, já podemos executar o server e...

```bash
<h1>Hello, World!</h1>1.042
<h1>Hello, World!</h1>2.059
<h1>Hello, World!</h1>3.071
<h1>Hello, World!</h1>4.083
<h1>Hello, World!</h1>5.090
<h1>Hello, World!</h1>6.094
<h1>Hello, World!</h1>7.112
<h1>Hello, World!</h1>8.121
<h1>Hello, World!</h1>9.140
<h1>Hello, World!</h1>10.150
10.166
```

_Ouch!_ Voltamos aos 10 segundos. Mas isto se deve ao fato de termos apenas *uma thread* em loop. Vamos aumentar o número de threads na pool.

### 5 threads em loop

A seguir modificamos o programa para inicializar 5 threads, para que desta forma nosso server tenha mais capacidade em atender requests simultâneos:

```as
section .text
_start:
.initialize_pool:
	mov r8, 0
.pool:
	call thread        
	inc r8
	cmp r8, 5
	je .socket
	jmp .pool
....
....
```

Com este loop fazemos `call thread` 5 vezes, pelo que cada thread, e ainda utilizando o exemplo anterior, irá ficar em loop buscando mensagens na fila.

Executamos o código com 1 request e temos sucesso:

```bash
$ time curl localhost:3000

<h1>Hello, World!</h1>1.022
```

Mas no output do strace, após a resposta, vemos uma sequência de erros das threads:

```bash
<h1>Hello, World!</h1>[pid 13483] write(4, "HTTP/1.1 200 OK\r\nContent-Type: t"..., 86 <unfinished ...>
[pid 13482] write(0, "HTTP/1.1 200 OK\r\nContent-Type: t"..., 86 <unfinished ...>
[pid 13480] write(0, "HTTP/1.1 200 OK\r\nContent-Type: t"..., 86 <unfinished ...>
[pid 13484] <... write resumed>)        = 86
[pid 13481] write(4, "HTTP/1.1 200 OK\r\nContent-Type: t"..., 86HTTP/1.1 200 OK
Content-Type: text/html
Content-Length: 22

<h1>Hello, World!</h1> <unfinished ...>
[pid 13480] <... write resumed>)        = 86
HTTP/1.1 200 OK
Content-Type: text/html
Content-Length: 22

<h1>Hello, World!</h1>[pid 13484] close(0 <unfinished ...>
[pid 13483] <... write resumed>)        = 86
[pid 13482] <... write resumed>)        = 86
[pid 13480] close(0 <unfinished ...>
[pid 13484] <... close resumed>)        = 0
[pid 13481] <... write resumed>)        = 86
[pid 13484] nanosleep({tv_sec=1, tv_nsec=0},  <unfinished ...>
[pid 13483] close(4 <unfinished ...>
[pid 13482] close(0 <unfinished ...>
[pid 13481] close(4 <unfinished ...>
[pid 13480] <... close resumed>)        = -1 EBADF (Bad file descriptor)
[pid 13483] <... close resumed>)        = 0
[pid 13482] <... close resumed>)        = -1 EBADF (Bad file descriptor)
[pid 13481] <... close resumed>)        = -1 EBADF (Bad file descriptor)
```

A thread tentou fechar o socket descriptor da requisição mas outra thread tentou ler o socket de forma concorrente (Bad file descriptor). 

Quando envolve **mais de uma thread** consumindo o mesmo recurso (neste caso a fila), precisamos de um mecanismo de **sincronização**, que no caso são _locks_.

### Sincronização com futex

Com _locks_, conseguimos controlar o acesso a um recurso compartilhado _entre diferentes threads_. 

Através da syscall **futex**, podemos suspender uma thread baseando-se em uma "variável condicional". De forma oposta, podemos _tornar uma thread de volta à execução_ baseando-se também na variável condicional.

Esta técnica de _variável condicional_ (condvar) é um primitivo de sincronização bastante utilizado. No nosso caso para controle da fila, queremos o seguinte cenário:

- a thread verifica se há algo na fila. Caso a fila esteja vazia, a thread é suspensa com _futex wait_ através de uma variável condicional
- quando algo for adicionado na fila, outra thread/processo "emite um sinal" chamando a syscall _futex wake_ na mesma variável condicional. 
- quando o sinal é emitido, neste momento a thread que tem o acesso ao lock (variável condicional) é trazida de volta ao contexto, então lê a mensagem da fila e executa a ação necessária. Após, se a fila estiver vazia, repete o processo com _futex wait_ e fica novamente suspensa

> Desta forma, garantimos que as threads não ficam consumindo a CPU em loop indefinidamente

Modificando o código, começamos por definir a syscall:

```as
%define SYS_futex 202
```

A seguir, na seção de dados `.bss` declaramos a _variável condicional_ ocupando 8 bytes, que será utilizada como sincronização do futex:

```as
section .bss
...
condvar: resb 8
```

Na rotina `enqueue`, _emitimos o sinal_ após o socket ser adicionado na fila:

```as
enqueue:
	xor rdx, rdx
	mov dl, [queuePtr]	
	mov [queue + rdx], r8	
	inc byte [queuePtr]

	call emit_signal
	ret
```

A lógica o _emit_signal_ (explicação nos comentários):

```as
emit_signal:
   ; Endereço de memória para a variável condicional (8 bytes)
   mov rdi, condvar
   
   ; Flags do Futex (WAKE), que irá trazer a thread
   ; de volta ao contexto
   mov rsi, FUTEX_WAKE | FUTEX_PRIVATE_FLAG 

   ; Argumentos adicionais, que neste caso vamos deixar a ZERO
   xor rdx, rdx
   xor r10, r10
   xor r8, r8

   ; Chamada da syscall
   mov rax, SYS_futex
   syscall
   ret
```

Agora, modificamos a rotina _handle_:

```as
handle:	
	; Caso a fila esteja vazia, fazemos jump para "wait"
	cmp byte [queuePtr], 0         
	je .wait           

	; Faz pop do socket da fila e segue o fluxo normal
	call dequeue      
	mov r10, rax

	lea rdi, [timespec]
	mov rax, SYS_nanosleep
	syscall

	; int write(fd)
	mov rdi, r10
	mov rsi, response
	mov rdx, responseLen
	mov rax, SYS_write
	syscall

	; int close(fd)
	mov rdi, r10
	mov rax, SYS_close
	syscall

	; Volta para o início
	jmp handle       
.wait:
	; Chamada para wait_condvar, que vai suspender a thread atual com FUTEX
	call wait_condvar 
	jmp handle       
```

E, por último e não menos importante, a lógica da rotina _wait_condvar_, que suspende a thread de execução:

```as
wait_condvar:
   ; Endereço de memória para a variável condicional (8 bytes)
   mov rdi, condvar   

   ; Flags do Futex (WAIT), que irá suspender a thread
   mov rsi, FUTEX_WAIT | FUTEX_PRIVATE_FLAG 
   xor rdx, rdx
   xor r10, r10              
   xor r8, r8               
   mov rax, SYS_futex
   syscall
   test rax, rax
   jz .done_condvar
.done_condvar:
   ret
```

Assim que iniciamos o server com _strace_, podemos ver as syscalls em ação:

```bash
brk(NULL)                               = 0x155c000
brk(0x155d000)                          = 0x155d000
clone(child_stack=0x155cff8, flags=CLONE_VM|CLONE_FS|CLONE_FILES|CLONE_SIGHAND|CLONE_PARENT|CLONE_THREAD|CLONE_IOstrace: Process 13539 attached
) = 13539
[pid 13539] futex(0x402088, FUTEX_WAIT_PRIVATE, 0, NULL <unfinished ...>
[pid 13538] brk(NULL)                   = 0x155d000
[pid 13538] brk(0x155e000)              = 0x155e000
[pid 13538] clone(child_stack=0x155dff8, flags=CLONE_VM|CLONE_FS|CLONE_FILES|CLONE_SIGHAND|CLONE_PARENT|CLONE_THREAD|CLONE_IOstrace: Process 13540 attached
) = 13540
[pid 13540] futex(0x402088, FUTEX_WAIT_PRIVATE, 0, NULL <unfinished ...>
[pid 13538] brk(NULL)                   = 0x155e000
[pid 13538] brk(0x155f000)              = 0x155f000
[pid 13538] clone(child_stack=0x155eff8, flags=CLONE_VM|CLONE_FS|CLONE_FILES|CLONE_SIGHAND|CLONE_PARENT|CLONE_THREAD|CLONE_IOstrace: Process 13541 attached
) = 13541
[pid 13541] futex(0x402088, FUTEX_WAIT_PRIVATE, 0, NULL <unfinished ...>
[pid 13538] brk(NULL)                   = 0x155f000
[pid 13538] brk(0x1560000)              = 0x1560000
[pid 13538] clone(child_stack=0x155fff8, flags=CLONE_VM|CLONE_FS|CLONE_FILES|CLONE_SIGHAND|CLONE_PARENT|CLONE_THREAD|CLONE_IOstrace: Process 13542 attached
) = 13542
[pid 13542] futex(0x402088, FUTEX_WAIT_PRIVATE, 0, NULL <unfinished ...>
[pid 13538] brk(NULL)                   = 0x1560000
[pid 13538] brk(0x1561000)              = 0x1561000
[pid 13538] clone(child_stack=0x1560ff8, flags=CLONE_VM|CLONE_FS|CLONE_FILES|CLONE_SIGHAND|CLONE_PARENT|CLONE_THREAD|CLONE_IOstrace: Process 13543 attached
) = 13543
[pid 13538] socket(AF_INET, SOCK_STREAM, IPPROTO_IP <unfinished ...>
[pid 13543] futex(0x402088, FUTEX_WAIT_PRIVATE, 0, NULL <unfinished ...>
[pid 13538] <... socket resumed>)       = 3
[pid 13538] bind(3, {sa_family=AF_INET, sin_port=htons(3000), sin_addr=inet_addr("0.0.0.0")}, 16) = 0
[pid 13538] listen(3, 2)                = 0
[pid 13538] accept4(3, NULL, NULL, 0)   = ? ERESTARTSYS (To be restarted if SA_RESTART is set)
[pid 13538] --- SIGWINCH {si_signo=SIGWINCH, si_code=SI_KERNEL} ---
[pid 13538] accept4(3, NULL, NULL, 0
```

Repare que cada thread faz a chamada a futex com _FUTEX WAIT_, e isto vemos acontecer 5 vezes no trace. Ou seja, as 5 threads estão suspensas **sem consumir CPU**.

Ao fazer o primeiro request, temos o seguinte resultado:

```bash
)   = 4
[pid 13538] futex(0x402088, FUTEX_WAKE_PRIVATE, 0) = 1
[pid 13539] <... futex resumed>)        = 0
[pid 13538] accept4(3, NULL, NULL, 0 <unfinished ...>
[pid 13539] nanosleep({tv_sec=1, tv_nsec=0}, NULL) = 0
[pid 13539] write(4, "HTTP/1.1 200 OK\r\nContent-Type: t"..., 86) = 86
[pid 13539] close(4)                    = 0
[pid 13539] futex(0x402088, FUTEX_WAIT_PRIVATE, 0, NULL
```

- o processo principal recebeu a mensagem no socket, enfileirou e executou *futex* com **FUTEX_WAKE**
- uma das threads foi trazida de volta ao contexto e fez a sua devida execução (nanosleep + write + close)
- o processo principal voltou para o accept a espera de mais requests no socket
- a thread terminou seu trabalho, viu que não tinha mais nada na fila e executou _futex_ com **FUTEX_WAIT**, ficando novamente suspensa

Finalmente, podemos executar 10 requests simultâneos e...

```bash
<h1>Hello, World!</h1><h1>Hello, World!</h1><h1>Hello, World!</h1>1.079
1.082
1.083
<h1>Hello, World!</h1><h1>Hello, World!</h1>1.062
1.083
<h1>Hello, World!</h1><h1>Hello, World!</h1>2.087
2.088
<h1>Hello, World!</h1>2.100
<h1>Hello, World!</h1>2.101
<h1>Hello, World!</h1>2.110
2.127
```

_Nice!_ Com uma pool de 5 threads, conseguimos atingir **2,1 segundos** para 10 requests concorrentes. Agora temos concorrência consumindo muito menos recursos:

- menos memória, pois não é forking de processos
- menos CPU, pois as threads não ficam em loop infinito
- menos latência, pois com uma limitação de 5 threads, novos requests não criam novas threads

---
## Alocação de memória com mmap

Um problema comum ao utilizar _brk_ é que a memória pode ficar fragmentada. Uma vez que o program break foi modificado, aquela memória pode ser utilizada, mas torna muito difícil ser reciclada. 

Uma forma de lidar com este problema de fragmentação é utilizar uma syscall que trata de reservar uma área na memória que pode ser reciclada futuramente. Estamos falando da syscall **mmap**.

```as
thread:
	mov rdi, 0x0
	mov rsi, CHILD_STACK_SIZE
	mov rdx, PROT_WRITE | PROT_READ
	mov r10, MAP_ANONYMOUS | MAP_PRIVATE | MAP_GROWSDOWN
	mov rax, SYS_mmap
	syscall

	mov rdi, CLONE_VM|CLONE_FS|CLONE_FILES|CLONE_SIGHAND|CLONE_PARENT|CLONE_THREAD|CLONE_IO
	lea rsi, [rax + CHILD_STACK_SIZE - 8]
	mov qword [rsi], handle
	mov rax, SYS_clone
	syscall
	ret
```

Ao invés de chamar _brk_, podemos chamar **mmap**, especificando:

- **rdi**: endereço de memória onde deve ser mapeado. Se tiver ZERO, o sistema operacional se encarrega de trazer um endereço de memória disponível
- **rsi**: tamanho do espaço reservado na memória. No nosso caso, queremos 4096 bytes para a thread
- **rdx**: proteção de memória, neste caso queremos que a memória possa ser tanto escrita (PROT_WRITE) quanto lida (PROT_READ) pela thread
- **r10**: flags de mapeamento
	- **MAP_ANONYMOUS**: o mapeamento não é associado a nenhum arquivo ou descritor de arquivo (modo anônimo)
	- **MAP_PRIVATE**: mapeamento privado com _copy-on-write_, ou seja, os dados serão copiados à medida em que são escritos
	- **MAP_GROWSDOWN**: o mapeamento é usado no formato "stack", ou seja, o mapeamento é dos endereços maiores em direção aos menores

Com _mmap_, podemos fazer uso da sua contrapartida, a syscall **unmmap**, que permite reciclar uma determinada área na memória que não é mais utilizada, evitando fragmentação.

> Esta técnica é muito utilizada pela libc através da função **malloc**. Com mmap podemos definir uma memória heap para nosso programa

É isto, na prática não terá nenhum efeito com relação ao exemplo anterior. Mas esta seção foi apenas para trazer uma forma diferente de alocar memória para a thread.

---
## Conclusão

Ufa! Finalmente chegamos ao final da saga. Passamos por uma [introdução](https://dev.to/leandronsp/construindo-um-web-server-em-assembly-x86-parte-i-introducao-14p5), onde a seguir fizemos uma abordagem pela [história e arquitetura de computadores](https://dev.to/leandronsp/construindo-um-web-server-em-assembly-x86-parte-ii-historia-e-arquitetura-2jb9), para então analisar [código de máquina](https://dev.to/leandronsp/construindo-um-web-server-em-assembly-x86-parte-iii-codigo-de-maquina-bgk), que foi a base para entrar em [assembly x86](https://dev.to/leandronsp/construindo-um-web-server-em-assembly-x86-parte-iv-um-assembly-modesto-oif) de fato, para finalmente [concluir o desenvolvimento do web server](https://dev.to/leandronsp/construindo-um-web-server-em-assembly-x86-parte-v-finalmente-o-server-9e5).

Este último artigo foi uma abordagem para multi-threading em Assembly, passando por conceitos de concorrência como _forking de processos_, **clone**, threading, pool de threads e sincronização com locks.

Declaro aqui então o fim da **saga desenvolvendo um web server em Assembly x86**.

_Até a próxima saga!_

---

## Referências

<sub>
Synchronization: mutexes and condition variables
https://cs61.seas.harvard.edu/site/2018/Synch3/
Synchronization, atomics and mutexes
https://cs.brown.edu/courses/csci0300/2023/notes/l22.html
Basics of Futexes
https://eli.thegreenplace.net/2018/basics-of-futexes/
Raw Linux threads via syscalls
https://nullprogram.com/blog/2015/05/15/
Condition variables with Futex
https://www.remlab.net/op/futex-condvar.shtml
</sub>
