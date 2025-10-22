---
title: "Implementando um simples background job com UNIX named pipes"
slug: "implementando-um-simples-background-job-com-unix-named-pipes-3eja"
published_at: "2022-06-15 04:42:22Z"
language: "pt-BR"
status: "published"
tags: ["unix", "linux", "pipes"]
---

No [último artigo](https://leandronsp.com/articles/entendendo-unix-pipes-3k56) vimos o funcionamento de UNIX streams, pipes e mais precisamente, **anonymous pipes**. E que estes canais são uma das bases de comunicação entre diferentes processos. 

Neste artigo vamos explorar "pipes nomeados", ou [named pipes](https://en.wikipedia.org/wiki/Named_pipe), e como este modelo de dados pode ajudar a entender o funcionamento de um background job. 

## Anonymous pipes são FIFO
[FIFO](https://en.wikipedia.org/wiki/FIFO_(computing_and_electronics)) remete a "First in, first out", que significa

> Primeiro a entrar, primeiro a sair

Parece com filas né? Mas entretanto...

### São unidirecionais
...pois caminham apenas em um sentido, e nunca de forma "bidirecional":
```bash
### ----> going this way ---->
$ echo 'my precious' | md5 | base64
```

Para que sejam bidirecionais, seria preciso que um processo enviasse mensagem de volta para o outro. 

E há uma solução para isto.

## Named pipes
Com o comando `mkfifo`, podemos criar uma pipe nomeada e usá-la entre diferentes comandos para comunicação através dos streams. 

Para criar comunicação bidirecional, teríamos que criar duas FIFO, mas para nosso simples exemplo, vamos manter unidirecional com apenas uma FIFO. 

Esta pipe poderá servir como uma fila FIFO:
```bash
$ mkfifo myqueue
$ ls -la myqueue
```
```
prw-r--r--  1 leandronsp  staff     0B Jun 14 23:09 myqueue
```

### Utilizando o pipe
Podemos jogar saídas de comandos para dentro do pipe, por exemplo com este processo "escritor":
```bash
$ echo 'my precious' | base64 > myqueue
```
O processo fica bloqueado à espera que algum outro processo "leitor" leia da fila. Em outra janela:
```bash
$ cat myqueue
```
```
bXkgcHJlY2lvdXMK
```
O inverso também pode acontecer, onde começamos pelo leitor:
```bash
$ cat myqueue
```
Que fica bloqueado à espera de "mensagens na fila". E assim outro processo escritor pode enviar a mensagem:
```bash
echo 'my precious' | base64 > myqueue
```
*Janela do leitor*:
```
bXkgcHJlY2lvdXMK
```
## Processamento assíncrono
Esta funcionalidade básica abre portas para o processamento assíncrono de mensagens, onde podemos ter um "worker" que fica *infinitamente* à espera de mensagens no pipe, ao passo que diferentes "publicadores" colocam mensagens no pipe de forma **assíncrona**. 

Estamos falando de **[background jobs](https://en.wikipedia.org/wiki/Background_process)**. 

### Criando um worker que decodifica base64
Vamos então criar um worker simples em Shell script que recebe uma mensagem codificada em base64, decodifica, mostra-a no screen (STDOUT) e volta para o loop à espera de mais mensagens no pipe:
`sidequack.sh`
```bash
#!/bin/bash
## Cria o named pipe
mkfifo myqueue

echo "Waiting for jobs in the queue..."

## Loop infinito
while true
do
  ## Bloqueia à espera de mensagem no pipe
  ENCODED=`cat myqueue`

  ## Nova mensagem chegou no pipe...
  echo "Going to perform Job..."
  echo "Encoded: $ENCODED | Decoded: `echo $ENCODED | base64 -d`"
done
```
```bash
bash sidequack.sh
```
```
Waiting for jobs in the queue...
```
Agora, em outra janela, podemos colocar no pipe diferentes "jobs" a serem processados:
```bash
echo 'my precious' | base64 > myqueue
echo 'pipes are awesome' | base64 > myqueue
```
Podemos consultar no terminal do worker:
```
Going to perform Job...                                       
Encoded: bXkgcHJlY2lvdXMK | Decoded: my precious
              
Going to perform Job...                                       
Encoded: cGlwZXMgYXJlIGF3ZXNvbWUK | Decoded: pipes are awesome
```
## Conclusão
Este artigo foi uma tentativa de mostrar o funcionamento de UNIX named pipes e como podem ser usados para comunicação entre diferentes processos através de estruturas FIFO, com a demonstração da implementação de um simples background job. 


