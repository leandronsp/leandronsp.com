---
title: "Entendendo UNIX pipes"
slug: "entendendo-unix-pipes-3k56"
published_at: "2022-06-15 03:35:29Z"
language: "en"
status: "published"
tags: ["unix", "linux", "pipe"]
---

Basicamente, a todo comando UNIX é atribuído um conjunto de [streams](https://en.wikipedia.org/wiki/Standard_streams), que são canais de comunicação. Ou seja, um comando pode enviar dados para uma stream de saída (STDOUT), ler dados de uma stream de entrada (STDIN) e escrever dados em uma stream de falhas/erros (STDERR). 

Cada stream é representada por um número inteiro através de [file descriptors](https://en.wikipedia.org/wiki/File_descriptor):

- 0: stream de entrada
- 1: stream de saída
- 2: stream de erros

## UNIX e comunicação de processos
Por padrão, processos no sistema operacional são isolados. Mas para uso real, um processo precisa se comunicar com outros através do **envio de mensagens**. 

Os streams de comunicação são, portanto, uma forma de comunicação *entre processos*, também chamada de [Inter-Process communication](https://en.wikipedia.org/wiki/Inter-process_communication), ou **IPC**.

## Redirecionamento do STDOUT
Quando executamos comandos UNIX, a stream padrão de saída é o próprio screen, ou `STDOUT`. 
```bash
$ echo 'Olá!'
```
```
Olá!
```
Isto mostra no screen a palavra `Olá`. Mas podemos redirecionar o output para um arquivo à parte para ser **consultado depois**. Este redirecionamento deve ser feito com os sinais `>` (para stdout e stderr) ou `<` (para stdin).

Em cada sinal deve ser prefixado o número do file descriptor correspondente.
```bash
# o stdout 1 está sendo redirecionado para out.log

$ echo 'Olá!' 1> out.log 

### DICA BÔNUS
# Se omitirmos o número do file descriptor, por padrão o UNIX
# entende que é o STDOUT!!!!1
$ echo 'Olá!' > out.log 
```
Com redirecionamento, o sistema "muda" o comportamento padrão do stream. Neste caso, não vemos mais a palavra sendo enviada para o screen. Precisamos então consultar o arquivo:
```bash
$ cat out.log
```
```
Olá!
```
## Redirecionamento do STDIN
Vamos imaginar um cenário onde queremos gerar hash de um conteúdo utilizando `md5`. 

O comando md5 recebe um arquivo como **input**. Como o STDIN por padrão lê do screen (e fica a espera de dados a partir do teclado), podemos redirecionar o STDIN (0) tal como fizemos com o STDOUT (1), de forma que o input seja lido a partir de um arquivo, e não do teclado:
```bash
$ echo 'my precious' > rawcontent.txt # redireciona stdout 1
$ md5 0< rawcontent.txt               # redireciona stdin 0
```
```
2a5f942537474f69e4bca57711ae6ff2
```
## E o STDERR?
Assim como fazemos para o STDOUT com o sinal `>`, podemos redirecionar o STDERR (erros ocorridos durante o comando) para outro lugar:
```bash
$ md5 rawcontent.txt 2> md5err.log
```
Nesse caso, como o comando não lança nenhum erro, o arquivo `md5err.log` está vazio e o output foi enviado para o STDOUT. 
```bash
$ md5 filenotfound 2> md5err.log
$ cat md5err.log
```
```
md5: filenotfound: No such file or directory
```
Inclusive podemos fazer redirecionamento de todas as saídas no mesmo comando:
```bash
$ md5 rawcontent.txt > md5out.log 2> md5err.log
```
Ou então, fazer com que o STDERR seja redirecionado para o STDOUT:
```bash
$ md5 rawcontent.txt > md5out.log 2>&1
```

## UNIX pipelines
E se quisermos continuar criando uma "pipeline" de transformação dos dados, de forma que ao fim do md5, queremos transformar o conteúdo em base64?

Podemos continuar redirecionando "outs e ins" quantas vezes quisermos em múltiplos comandos:
```bash
$ echo 'my precious' > rawcontent.txt
$ md5 0< rawcontent.txt > md5content.txt
$ base64 0< md5content.txt
```
```
MmE1Zjk0MjUzNzQ3NGY2OWU0YmNhNTc3MTFhZTZmZjIK
```
Mas esta cadeia de múltiplos comandos ficaria ilegível e difícil de manter. Sem contar que tantos aquivos de redirecionamento vão ficar ocupando espaço de armazenamento o que nos obrigaria a ter uma rotina para apagar tais arquivos.

Podemos recorrer aos **[pipes anônimos](https://en.wikipedia.org/wiki/Anonymous_pipe)** `|`, ou **unnamed pipes**, que basicamente *redirecionam o stdout de um comando para o stdin do outro comando na sequência*. 

E diferente dos arquivos de redirecionamento, os pipes anônimos funcionam como file descriptor "temporários" que são apagados ao término do comando. 
```bash
$ echo 'my precious' | md5 | base64
```
```
MmE1Zjk0MjUzNzQ3NGY2OWU0YmNhNTc3MTFhZTZmZjIK
```
Lindo, não é?

## Conclusão
Neste artigo, tentei demonstrar o funcionamento básico de UNIX pipelines, que utilizam **pipes anônimos** para que diferentes processos possam comunicar entre si. 

[Este artigo do Marcell Cruz](https://dev.to/____marcell/bidirectional-piping-how-to-make-two-programs-communicate-with-each-other-2ke9) é bastante elucidativo e me ajudou a despertar interesse em dissecar o tema para produzir mais conteúdo de UNIX em pt-BR.

No [artigo a seguir](https://dev.to/leandronsp/implementando-um-simples-background-job-com-unix-named-pipes-3eja) mostro como funcionam **UNIX named pipes** e como isto abre portas para a implementação de um simples background job em Shell script. 

Stay tuned!






