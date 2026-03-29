---
title: "Construindo um web server em Assembly x86, parte V, finalmente o server"
slug: "construindo-um-web-server-em-assembly-x86-parte-v-finalmente-o-server"
published_at: "2024-05-25 00:14:20Z"
language: "pt-BR"
status: "published"
tags: ["braziliandevs", "assembly", "computerscience"]
---

No [artigo anterior](https://leandronsp.com/articles/construindo-um-web-server-em-assembly-x86-parte-iv-um-assembly-modesto-oif), passamos pelos fundamentos de Assembly, onde foi possível entender alguns conceitos básicos tais como tipos de registradores, **stack**, loops, FLAGS etc, tudo sendo feito com debugging via _GDB_.

Agora, vamos de fato construir um web server muito simples que devolve um HTML com a frase "Hello, World". A meta é chegarmos nisto:


![hello world](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/6745f6h98cph2u50aa8x.png)

O processo para chegarmos a este objetivo consiste em cobrir fundamentos de Web, passando por sockets, TCP e HTTP, enquanto vamos explorando conceitos práticos em Assembly x86.

---

## Agenda

* [Arquitetura Web](#arquitetura-web)
  * [Cliente-servidor](#clienteservidor)
  * [Modelo OSI](#modelo-osi)
  * [Sockets e TCP](#sockets-e-tcp)
  * [HTTP](#http)
* [Como funciona um servidor web](#como-funciona-um-servidor-web)
  * [4 syscalls para o resgate](#4-syscalls-para-o-resgate)
* [Um server modesto em Assembly](#um-server-modesto-em-assembly)
  * [Criando o socket](#criando-o-socket)
  * [Fazendo bind no socket](#fazendo-bind-no-socket)
  * [Preparando para receber conexões](#preparando-para-receber-conexões)
  * [Chegou o momento de aceitar clientes](#chegou-o-momento-de-aceitar-clientes)
  * [Resposta do servidor e fechamento da conexão](#resposta-do-servidor-e-fechamento-da-conexão)
  * [Mas o servidor deve ficar em loop, não?](#mas-o-servidor-deve-ficar-em-loop-não)
* [Conclusão](#conclusão)
* [Referências](#referências)

---

## Arquitetura Web
Para criar um servidor web, precisamos manipular _mensagens HTTP_, que são transportadas via camada de transporte TCP/IP através de uma rede.

Estas mensagens são enviadas entre diferentes dispositivos conectados a uma rede, que pode ser privada (local) ou pública. Regularmente, comunicação HTTP é feita entre 2 dispositivos, sendo um deles o _cliente_ e outro o _servidor_.

Vamos brevemente falar de cada um destes conceitos.

### Cliente-servidor
Numa arquitetura cliente-servidor, temos 2 dispositivos conectados a uma rede de computadores:


![cliente servidor](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/z9io56i8xzadm9cqvepe.png)

Para um servidor web, é necessário que o cliente realize uma **conexão** com o servidor, em seguida faça uma **requisição**, pelo que o servidor deve devolver uma **resposta** e, por último, **fechar a conexão**.

![connect request response](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/maxau6kx9t18u6r049r0.png)

Mas como esta mensagem deve ser enviada? Quem garante a entrega? E caso ocorra falha de sinal na camada física (cabeamento de rede), como assegurar que cada "pacote" da mensagem seja entregue em ordem?

É pra isto que foi criado o **modelo de comunicação OSI**.

### Modelo OSI
OSI é um modelo de referência para comunicação entre diferentes dispositivos através de diferentes redes, que estabelece um conjunto de camadas que vai desde a camada física até a camada de formato de mensagens.


![modelo OSI](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/sdfapddkf7j5uzojvgzg.png)

* **Camada física**: responsável pelo tráfego de informações através de meios físicos, tais como bluetooth, frequência de rádio, cabos etc
* **Camada de enlace de rede**: responsável pela decodificação e codificação de mensagens em frames, do meio físico para o meio digital e vice-versa
* **Camada de rede**: é aqui que definimos protocolos de rede, tais como o _protocolo de internet_, também conhecido como **IP** (Internet Protocol)

> Na web, os dados trafegam geralmente através de uma rede de computadores pública, global e descentralizada, neste caso a Internet

* **Camada de transporte**: camada responsável por características de entrega, tais como definir critérios de confiabilidade e ordem dos pacotes de mensagens. Por exemplo, nesta camada temos o _protocolo de  controle de transmissão_, ou **TCP**
* **Camada de sessão e apresentação**: aqui vão critérios de informações que podem ser vinculadas a uma determinada conexão entre diferentes dispositivos, bem como o formato de apresentação das informações na rede
* **Camada de aplicação**: nesta camada, temos a definição do formato de mensagens em um nível mais "aplicacional", como por exemplo protocolo HTTP (Hypertext Transfer Protocol), FTP, SSH entre outros

Entretanto fica aqui uma questão: como que todo esse modelo de comunicação em rede se converte em algo prático num programa dentro de um sistema operacional?

Chegou o momento de falar sobre _sockets_ e TCP.

### Sockets e TCP
Num computador, todos os programas são encapsulados dentro de uma estrutura chamada _processo_, como vimos em artigos anteriores.

Quando falamos em cliente na aquitetura cliente-servidor, estamos falando de um processo rodando dentro de um computador, e o mesmo vale para o servidor, onde cada processo tem seu próprio identificador, ou _PID_:


![pids](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/7q9yi7cdbs42p0352s24.png)

Sabendo que processos são isolados, foram definidas diferentes formas de comunicação entre processos (também conhecido como IPC, ou _inter process communication_), tais como pipes, arquivos do filesystem, descritores de arquivos e UNIX sockets.

> Estamos baseando a saga em sistema "UNIX-like", mais especificamente GNU/Linux

Ou seja, temos ciência que é possível fazer 2 processos _dentro de um mesmo computador_ se comunicarem através de UNIX sockets. Mas como fazer dois processos em computadores distintos se comunicarem?

Entramos então em **Berkeley Sockets**, que define uma API comum de comunicação utilizando sockets, onde diferentes sockets podem estar no mesmo computador, ou em uma mesma rede local, ou até mesmo em redes diferentes dentro da _Internet_.

É aqui que temos a introdução ao TCP, que é um protocolo de comunicação via sockets. Portanto, para fazer um cliente se comunicar com um servidor, é preciso estabelecer _endpoints de comunicação_, que são basicamente **sockets**, e neste caso para a web, vamos utilizar _sockets TCP_.

Estes sockets são abertos tanto do lado do cliente, quanto no servidor. No servidor, estes sockets são mapeados em descritores de arquivos, que representam um número especial e reservado, também chamado de **porta de comunicação**:


![sockets e tcp](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/j1x249n2k8ajhgvj2fsq.png)

> Ok Leandro, consegui entender o conceito de sockets e TCP. Mas qual deveria ser o formato da mensagem na web?

Com vocês, o _HTTP_.

### HTTP
HTTP é um protocolo de formato de mensagem que faz parte da camada de aplicação.

Com HTTP, a mensagem é definida seguindo padrões de hipertexto, que são basicamente documentos que podem ter ligações com outros documentos em sites diferentes.

Na web, o padrão segue um formato de _headline_, que contém o tipo de pedido, seguido de quebra de linhas com _cabeçalhos_ de metadados e por fim, opcionalmente e dependendo do tipo de pedido, um _corpo_ com a mensagem principal contendo majoritariamente HTML, CSS e Javascript.


![tcp & http](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/7d0w16gxgauxlw4bnwe6.png)

Até agora, passamos por conceitos que formam a web. Como nosso exemplo de web server é bastante simples, estes fundamentos já são o suficiente para entrarmos na próxima seção, que é de fato escrever o web server em Assembly x86.

---

## Como funciona um servidor web
Conforme vimos na seção anterior, arquitetura web passa por manipulação de sockets TCP. 

Tal manipulação é feita via _chamadas de sistema_ (syscalls) no sistema operacional, portanto, para darmos início ao servidor, vamos entender como devem ser criados os sockets a nível do OS.

### 4 syscalls para o resgate
Resumidamente temos que fazer 4 syscalls para termos um server operante, que são:

**socket**
A syscall _socket_ é responsável por criar um endpoint de comunicação de rede e retornar um descritor de arquivo (fd) relativo ao endpoint criado.

Na libc, _socket_ é referenciada pelo número 41 e tem a seguinte assinatura:
```c
int socket(int domain, int type, int protocol)
```

> Lembrando que estamos utilizando arquitetura x86_64, ou x64

**bind**
_bind_ atribui nome e porta ao socket previamente criado. Esta syscall na libc responde pelo número 49 e tem a assinatura a seguir:
```c
int bind(int sockfd, const struct sockaddr *addr, socklen_t addrlen)
```

**listen**
A syscall _listen_ marca o socket criado (precisa ser do tipo stream, no caso TCP) para aceitar conexões. É conhecida pelo número 50 e tem a seguinte assinatura em C:
```c
int listen(int sockfd, int backlog)
```

**accept**
A syscall _accept_ admite uma conexão de um cliente no socket e cria um *novo socket de conexão específico* para aquele cliente. Esta syscall, a princípio, bloqueia o programa e só continua a execução quando uma nova conexão com novo cliente é estabelecida. 

É referenciada pelo número 288 e tem a seguinte assintaura:
```c
int accept(int sockfd, struct *addr, int addrlen, int flags)
```

Em resumo, tudo o que precisamos para criar um web server, independente do programa, linguagem de programação ou tecnologia, é de chamar estas 4 syscalls.

> Não se engane, o teu servidor Express, Rails, Django ou NGINX, faz estas chamadas de sistema por baixo dos panos: _socket, bind, listen e accept_

Sem mais delongas, vamos ver como tudo isto se aplica naquilo que importa para esta saga: **assembly**.

---

## Um server modesto em Assembly
Montar as syscalls para o web server em Assembly não é tão difícil quanto parece. Para começar, vamos fazer a primeira syscall, que é a _socket_. 

### Criando o socket
Como de costume, vamos montar as instruções de acordo com o [manual](https://man7.org/linux/man-pages/man2/socket.2.html) e [tabela de syscalls](https://x64.syscall.sh/).

> Já vimos na seção anterior quais são os números das syscalls e suas respectivas assinaturas na libc

Iniciamos definindo as constantes, apenas as necessárias para a syscall _socket_:

```as
global _start

; syscalls constants
%define SYS_socket 41

; other constants
%define AF_INET 2
%define SOCK_STREAM 1
%define SOCK_PROTOCOL 0
```

Após isto, vamos reservar 1 byte com a diretiva `resb 1` que significa "reservar 1 byte". Este byte será utilizado para armazenar o número do descritor de arquivo que referencia o _socket_ que vai ser criado.

Como **não queremos inicializar** o valor deste byte, não vamos colocar na seção `.data` como temos utilizado até o momento na saga, mas sim na seção `.bss`.

* Na seção `.data`, ficam apenas dados inicializados
* Na seção `.bss`, ficam os dados não-inicializados

```as
section .bss
sockfd: resb 1
```

Vamos relembrar o layout de memória:

![layout de memória](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/3wznvwyjq68cs1ln7aj3.png)

Como vemos na imagem, a seção `.bss` vem a seguir a seção `.data`, ou seja, fica em endereços de memória mais altos que a seção `.data`.

Agora, vamos montar os registradores seguindo a convenção de chamada e a ordem dos parâmetros da função _socket_ na libc:

```as
section .text
_start:
.socket:
	; int socket(int domain, int type, int protocol)
	mov rdi, AF_INET
	mov rsi, SOCK_STREAM
	mov rdx, SOCK_PROTOCOL
	mov rax, SYS_socket
	syscall
	mov [sockfd], rax 
.exit:
	mov rdi, 0
	mov rax, 60
	syscall
```

* **domain**: representa o domínio de comunicação. No caso queremos usar AF_INET, que significa IPv4, e tem o valor 2 conforme especificado no [glibc](https://github.com/bminor/glibc/blob/8f58e412b1e26d2c7e65c13a0ce758fbaf18d83f/bits/socket.h#L78) 
* **type**: representa o tipo de comunicação, que no caso vamos usar SOCK_STREAM que é sequencial, confiável, duplex e baseado em conexão. O valor [conforme glibc](https://github.com/bminor/glibc/blob/8f58e412b1e26d2c7e65c13a0ce758fbaf18d83f/bits/socket.h#L42) é 1
* **protocol**: esta opção é usada no caso da utilização de um protocolo em específico. Neste caso, vamos deixar o valor como 0 que é o default para AF_INET e SOCK_STREAM, _indicando que se trata de um socket TCP_

> Lembrando que existem sockets da família UNIX que não funcionam na camada de rede IP. É possível combinar socket UNIX com SOCK_STREAM, mas neste caso estamos combinando a família AF_INET (IPv4) com o tipo SOCK_STREAM (segmento de bytes, duplex), e esta combinação faz este socket ser TCP. Para mais detalhes sobre sockets, sugiro a leitura de um artigo que escrevi sobre [UNIX Sockets](https://leandronsp.com/articles/building-a-web-server-in-bash-part-i-sockets-2n8b)

Vamos confirmar com GDB?

```bash
# Breakpoint na linha <syscall>
(gdb) break 22

(gdb) run

# Confirmando que os registradores estão com os valores corretos
# antes da execução da syscall...
(gdb) i r rdi rsi rdx rax
rdi            0x2                 2
rsi            0x1                 1
rdx            0x0                 0
rax            0x29                41

# Confirmando que `sockfd` continua com o valor zerado
(gdb) x &sockfd
0x402000 <sockfd>:      0x00000000

(gdb) next
```

Após a execução da syscall, podemos ver que o _retorno da função_, que representa o descritor de arquivo conforme documentação, está armazenado no registrador RAX (de acordo com a convenção de chamada):


```as
(gdb) i r rax
rax            0x3                 3

(gdb) next

(gdb) x &sockfd
0x402000 <sockfd>:      0x00000003
```

Ou seja, após a syscall, temos em `sockfd` o número do socket que acabou de ser criado. 

Executando com _strace_:

```bash
$ strace ./live

execve("./live", ["./live"], 0x7ffca20187e0 /* 24 vars */) = 0
socket(AF_INET, SOCK_STREAM, IPPROTO_IP) = 3
exit(0)                                 = ?
+++ exited with 0 +++
```

Sem erros, _yay!_

Vamos para a próxima syscall.

### Fazendo bind no socket
Agora, é o momento de atribuir um endereço e uma porta como endpoint de comunicação para este socket. É para isto que serve a syscall _bind_.

Analisando a função:

```c
; int bind(int sockfd, const struct sockaddr *addr, socklen_t addrlen)
```

Podemos ver que um dos argumentos é um _ponteiro_ para uma struct na memória. Vamos entender melhor cada argumento.

**sockfd**
Em sockfd vai o inteiro que representa o descritor do socket criado

**sockaddr **addr***
Representa o ponteiro para o endereço de memória que contém uma estrutura de dados que, de acordo com [este guia](https://www.gta.ufrj.br/ensino/eel878/sockets/sockaddr_inman.html), contempla: _family, port, ip_address, sin_zero_, onde sin_zero é apenas padding de preenchimento de bytes.

Para arquitetura x64, esta estrutura deve conter 16 bytes no total, onde:

* 2 bytes são para a _família_ de protocolo
* 2 bytes para a _porta_

* 4 bytes para o _endereço de IP_
* 8 bytes de padding para o _sin_zero_, ou seja, preencher os 8 bytes restantes com ZERO

**addrlen**: tamanho do sockaddr, e já sabemos que são 16 bytes

Uma vez entendidos os parâmetros da função, vamos montar a chamada.


```as
%define SYS_bind 49

; Data types in asm
; (db) byte => 1 byte
; (dw) word => 2 bytes
; (dd) doubleword => 4 bytes
; (dq) quadword => 8 bytes

section .data
sockaddr: 
	family: dw AF_INET   ; 2 bytes
	port: dw 0x0BB8      ; 2 bytes (representa a porta 3000)
	ip_address: dd 0     ; 4 bytes
	sin_zero: dq 0       ; 8 bytes

.bind:
	; int bind(int sockfd, const struct sockaddr *addr, socklen_t addrlen)
	mov rdi, [sockfd]
	mov rsi, sockaddr
	mov rdx, 16
	mov rax, SYS_bind
	syscall
```

Ao validar com GDB, podemos ver que o `sockaddr` está armazenando a estrutura necessária para ser enviada no parâmetro `sockaddr *addr` da syscall:

```bash
# Breakpoint na syscall de bind
(gdb) break 38

(gdb) run

(gdb) x &sockaddr
0x402000 <family>:      0xb80b0002
```

Se buscarmos os 2 primeiros bytes, confirmamos que é o valor 2 (repare que está invertido pois é o padrão little-endian da aquitetura x86_64:

```bash
(gdb) x /2xb &sockaddr
0x402000 <family>:      0x02    0x00
```

Quanto à porta, queremos que o server responda no número 3000. Portanto, verificamos que os próximos 2 bytes representam a porta:

```bash
# Em hexadecimal, 3000 equivale a 0x0BB8, mas por causa do formato
# little-endian da arquitetura x86_64, estamos visualizando 0xB80B
(gdb) x /2xb (void*) &sockaddr+2
0x402002 <port>:        0xb8    0x0b
```

Queremos também que o servidor responda no endereço de IP `0.0.0.0`, então os próximos 4 bytes estarão todos a zero:

```bash
(gdb) x /4xb (void*) &sockaddr+4
0x402004 <ip_address>:  0x00    0x00    0x00    0x00
```

E, por fim, os 8 bytes restantes representando _sin_zero_, todos preenchidos com zero:

```bash
(gdb) x /8xb (void*) &sockaddr+8
0x402008 <sin_zero>:    0x00    0x00    0x00    0x00    0x00    0x00    0x00    0x00
```

Vamos executar com _strace_:

```bash
$ strace ./live

execve("./live", ["./live"], 0x7ffd51ed4650 /* 24 vars */) = 0
socket(AF_INET, SOCK_STREAM, IPPROTO_IP) = 3
bind(3, {sa_family=AF_INET, sin_port=htons(47115), sin_addr=inet_addr("0.0.0.0")}, 16) = 0
exit(0)                                 = ?
+++ exited with 0 +++
```

Ouch! Apesar da função _bind_ ter retornado 0 indicando que não houve erros, temos um pequeno problema. Repare que a _porta_ não está sendo mapeada para o número **3000**, e sim para **47115**, conforme vemos em _htons(47115)_.

**Entendendo a implicação de endianess na syscall bind**
`htons` é uma função de rede utilizada para converter a ordem dos bytes do programa antes de serem utilizados na rede. Como a internet utiliza big-endian, esta função converte a ordem utilizada na arquitetura (no caso da x86_64, little-endian) para o formato big-endian da rede.

Entretanto _htons(47115)_ não é o valor que queremos. O que precisamos é que o mapeamendo seja _htons(3000)_. Por quê isto está acontecendo?

O valor que colocamos em hexadecimal representando _3000_ é _0x0BB8_, mas se prestarmos atenção no GBD, o valor de fato armazenado está com os bytes invertidos para little-endian, que é _0xB80B_. Ocorre que `0xB80B` em decimal é **47115**!!!!!! Aí que está o problema!

Precisamos então inverter os bytes no programa, e assim sendo o valor que será passado para a função htons fica corrigido.

```as
....
section .data
sockaddr: 
	family: dw AF_INET   ; 2 bytes
	port: dw 0xB80B      ; 2 bytes (aqui invertemos os bytes)
	ip_address: dd 0     ; 4 bytes
	sin_zero: dq 0       ; 8 bytes
....
```

E analisando novamente com GDB:

```bash
# Agora sim, apesar de estar invertido, é exatamente este valor que
# queremos que seja passado para htons: 0x0BB8 em decimal é 3000
(gdb) x /2xb (void*) &sockaddr+2
0x402002 <port>:        0x0b    0xb8
```

Executando novamente com _strace_:

```bash
$ strace ./live

execve("./live", ["./live"], 0x7ffd51ed4650 /* 24 vars */) = 0
socket(AF_INET, SOCK_STREAM, IPPROTO_IP) = 3
bind(3, {sa_family=AF_INET, sin_port=htons(3000), sin_addr=inet_addr("0.0.0.0")}, 16) = 0
exit(0)                                 = ?
+++ exited with 0 +++
```

_Superb!_ Podemos ver que a syscall _bind_ foi executada com os parâmetros corretamente, inclusive o `htons(3000)`, então retornando _0_, que indica que não houve qualquer erro.

### Preparando para receber conexões
Próximo passo consiste em preparar o socket para receber conexões, que basicamente é chamar a função `listen`:

```as
%define SYS_listen 50
%define BACKLOG 2

.listen:
	; int listen(int sockfd, int backlog)
	mov rdi, [sockfd]
	mov rsi, BACKLOG
	mov rax, SYS_listen
	syscall
```

Onde _BACKLOG_ significa a quantidade de conexões "pendentes" no socket. Executamos com _strace_ e:

```bash
$ strace ./live

execve("./live", ["./live"], 0x7ffe6b4eea30 /* 24 vars */) = 0
socket(AF_INET, SOCK_STREAM, IPPROTO_IP) = 3
bind(3, {sa_family=AF_INET, sin_port=htons(3000), sin_addr=inet_addr("0.0.0.0")}, 16) = 0
listen(3, 2)                            = 0
exit(0)                                 = ?
+++ exited with 0 +++
```

_Que noite maravilhosa!_ Listen funcionou lindamente, afinal, é uma função muito simples. Agora, hora de aceitar conexões de clientes no socket.

### Chegou o momento de aceitar clientes
O grande momento chegou. Vamos montar as instruções da syscall _accept_, que de acordo com a função em libc, recebe um socket como primeiro argumento e os demais são opcionais.

```as
%define SYS_accept 288

.accept:
	; int accept(int sockfd, struct *addr, int addrlen, int flags)
	mov rdi, [sockfd]
	mov rsi, 0              ; não precisa estabelecer um addr
	mov rdx, 0              ; não precisa do tamanho uma vez que não há addr
	mov r10, 0
	mov rax, SYS_accept
	syscall
```

Se executarmos com GDB, podemos ver que o resultado da syscall fica bloqueado até que uma conexão seja feita:

```bash
# Breakpoint na syscall de socket
(gdb) break 55

(gdb) run
(gdb) next
```

O programa está parado na syscall de socket, aguardando resposta do **kernel**. Para que o kernel responda e o programa continue a execução, é preciso realizar um pedido usando um HTTP client, e neste caso vamos usar o _curl_:

```bash
$ curl localhost:3000
```

Repare que o programa continuou a execução. Vamos ver a resposta que está em RAX:

```bash
(gdb) i r rax
rax            0x4                 4

# Um número diferente do sockfd, que é o socket criado pelo server
(gdb) x &sockfd
0x402010 <sockfd>:      0x00000003

```

Podemos ver que é um número diferente (RAX contém 4 e sockfd contém 3). De acordo com a documentação, este é o número do descritor que representa um novo socket criado para comunicação entre *um cliente específico e o servidor*.

Vamos mover o valor de RAX para R8, apenas para preservar o socket, uma vez que RAX será usado novamente por outras syscalls de accept:

```as
mov r8, rax             ; client socket
```

### Resposta do servidor e fechamento da conexão

Uma outra coisa importante a se fazer é **fechar a conexão** com este socket do cliente depois de ter processado e respondido a requisição.

Vamos implementar a subrotina `.write`, que escreve a resposta na conexão (socket) do cliente:

```as
%define SYS_write 1

%define CR 0xD
%define LF 0xA

section .data
response: 
	headline: db "HTTP/1.1 200 OK", CR, LF
	content_type: db "Content-Type: text/html", CR, LF
	content_length: db "Content-Length: 22", CR, LF
	crlf: db CR, LF
	body: db "<h1>Hello, World!</h1>"
responseLen: equ $ - response

section .text
...
.write:
	; int write(int fd, buffer *bf, int bfLen)
	mov rdi, r8
	mov rsi, response
	mov rdx, responseLen
	mov rax, SYS_write
	syscall
	ret
```

No exemplo acima, assumimos que a string de resposta HTTP aponta para uma estrutura na memória, definida em `.data`. 

> Atenção para CR (carriage return), LF (line feed) que são constantes que representam `\r\n ` que são separadores de linhas definidos pelo protocolo HTTP

Agora, definir a subrotina `.close`, que fecha a conexão com o cliente:

```as
%define SYS_close 3

section .text
...
.close:
	; int close(int fd)
	mov rdi, r8
	mov rax, SYS_close
	syscall
	ret
```

Ligando tudo no _accept_:

```as
section .text
....
.accept:
	; int accept(int sockfd, struct *addr, int addrlen, int flags)
	mov rdi, [sockfd]
	mov rsi, 0              ; não precisa estabelecer um addr
	mov rdx, 0              ; não precisa do tamanho uma vez que não há addr
	mov r10, 0
	mov rax, SYS_accept
	syscall
	mov r8, rax             ; client socket
	call .write             ; escreve no socket
	call .close             ; fecha o socket
	jmp .exit               ; termina o programa
```

E agora, vamos executar o programa com _strace_:

```bash
$ strace ./live

execve("./live", ["./live"], 0x7ffd811567c0 /* 24 vars */) = 0
socket(AF_INET, SOCK_STREAM, IPPROTO_IP) = 3
bind(3, {sa_family=AF_INET, sin_port=htons(3000), sin_addr=inet_addr("0.0.0.0")}, 16) = 0
listen(3, 2)                            = 0
accept4(3, NULL, NULL, 0
```

* primeiro foi feita a syscall _socket_
* a seguir foi feito o _bind_
* depois o _listen_
* e por fim, o _accept_ ficou bloqueado a espera de uma requisição

Em outra janela, vamos fazer a requisição:

```bash
$ curl localhost:3000
<h1>Hello, World!</h1>
```

E no servidor, a saída do strace no final ficou assim:

```bash
write(4, "HTTP/1.1 200 OK\r\nContent-Type: t"..., 86) = 86
close(4)                                = 0
exit(0)                                 = ?
+++ exited with 0 +++
```

Escreveu a resposta com `write`, fechou a conexão com `close`, e depois terminou o programa com `exit`.

_Como não ficar feliz?_

### Mas o servidor deve ficar em loop, não?
Sim, o servidor deve ficar em loop, portanto ao invés de fazer o `jmp .exit`, fazemos `jmp .accept` na última linha da procedure:

```as
...
.accept:
	; int accept(int sockfd, struct *addr, int addrlen, int flags)
	mov rdi, [sockfd]
	mov rsi, 0              ; não precisa estabelecer um addr
	mov rdx, 0              ; não precisa do tamanho uma vez que não há addr
	mov r10, 0
	mov rax, SYS_accept
	syscall
	mov r8, rax             ; client socket
	call .write
	call .close
	jmp .accept             ; <-- MUDANÇA AQUI, mantém o server em loop infinito
```

Assim, o server nunca termina, e quando uma conexão com um cliente é fechada, voltamos no início do loop e ficamos a espera de nova conexão na syscall _accept_.

Código final do server:

```as
global _start

%define SYS_socket 41
%define SYS_bind 49
%define SYS_listen 50
%define SYS_accept 288
%define SYS_write 1
%define SYS_close 3

%define AF_INET 2
%define SOCK_STREAM 1
%define SOCK_PROTOCOL 0
%define BACKLOG 2
%define CR 0xD
%define LF 0xA

; Data types in asm
; byte => 1 byte
; word => 2 bytes
; doubleword => 4 bytes
; quadword => 8 bytes

section .data
sockaddr: 
	family: dw AF_INET   ; 2 bytes
	port: dw 0xB80B      ; 2 bytes (47115 big endian becomes 3000 little endian)
	ip_address: dd 0     ; 4 bytes
	sin_zero: dq 0       ; 8 bytes
sockaddrLen: equ $ - sockaddr
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
	mov [sockfd], rax 
.bind:
	; int bind(int sockfd, const struct sockaddr *addr, socklen_t addrlen)
	mov rdi, [sockfd]
	mov rsi, sockaddr
	mov rdx, sockaddrLen
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
	mov rsi, 0              ; não precisa estabelecer um addr
	mov rdx, 0              ; não precisa do tamanho uma vez que não há addr
	mov r10, 0
	mov rax, SYS_accept
	syscall
	mov r8, rax             ; client socket
	call .write
	call .close
	jmp .accept
.write:
	; int write(int fd, buffer *bf, int bfLen)
	mov rdi, r8
	mov rsi, response
	mov rdx, responseLen
	mov rax, SYS_write
	syscall
	ret
.close:
	; int close(int fd)
	mov rdi, r8
	mov rax, SYS_close
	syscall
	ret
```

Executando tudo com _strace_ e temos:

```bash
$ strace ./live

execve("./live", ["./live"], 0x7fff9fde7840 /* 24 vars */) = 0
socket(AF_INET, SOCK_STREAM, IPPROTO_IP) = 3
bind(3, {sa_family=AF_INET, sin_port=htons(3000), sin_addr=inet_addr("0.0.0.0")}, 16) = 0
listen(3, 2)                            = 0
accept4(3, NULL, NULL, 0)               = 4
write(4, "HTTP/1.1 200 OK\r\nContent-Type: t"..., 86) = 86
close(4)                                = 0
accept4(3, NULL, NULL, 0)               = 4
write(4, "HTTP/1.1 200 OK\r\nContent-Type: t"..., 86) = 86
close(4)                                = 0
accept4(3, NULL, NULL, 0)               = 4
write(4, "HTTP/1.1 200 OK\r\nContent-Type: t"..., 86) = 86
close(4)                                = 0
accept4(3, NULL, NULL, 0
```

No lado do cliente:

```bash
$ curl localhost:3000
<h1>Hello, World!</h1>

$ curl localhost:3000
<h1>Hello, World!</h1>

$ curl localhost:3000
<h1>Hello, World!</h1>
```

### Com vocês, o web browser
Esta saga não teria nenhuma graça se não fosse pra ser executada em um _web browser_, afinal estamos falando de um **web server**, não?

![final hello world](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/qm4v5vqi8jw5578sajjy.png)

---

## Conclusão
Incrivelmente chegamos no final da construção de um modesto web server. Aqui aprendemos conceitos sobre sockets, TCP e HTTP, com uma pitada leve de HTML.

> Fala aí, quem não já conhecia a tag H1 do HTML? kk

Para além de termos visto sobre as syscalls de rede _socket, bind, listen e accept_ em Assembly.

Ainda não chegamos ao fim da saga, pelo que no próximo artigo iremos abordar a criação de **threads** e aprender sobre alocação dinâmica de memória para as threads.

Stay tuned!

_Agradecimentos a [Rodrigo Gonçalves de Branco](https://x.com/rodrigogbranco) por ter revisado este artigo com o devido rigor_

---

## Referências

<sub>
Building a web server in Bash
https://leandronsp.com/articles/tekton-ci-part-i-a-gentle-introduction-ilj
OSI Model
https://en.wikipedia.org/wiki/OSI_model
TCP
https://en.wikipedia.org/wiki/Transmission_Control_Protocol
Berkeley Sockets
https://en.wikipedia.org/wiki/Berkeley_sockets
HTTP
https://en.wikipedia.org/wiki/HTTP
struct sockaddr_in
https://www.gta.ufrj.br/ensino/eel878/sockets/sockaddr_inman.html
</sub>
