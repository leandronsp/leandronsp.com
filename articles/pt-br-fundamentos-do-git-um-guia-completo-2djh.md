---
title: "[pt-BR] Fundamentos do Git, um guia completo"
slug: "pt-br-fundamentos-do-git-um-guia-completo-2djh"
published_at: "2023-05-24 01:41:50Z"
language: "pt-BR"
status: "published"
tags: ["git", "linux", "braziliandevs"]
---

Se você já trabalha com [Git](https://git-scm.com/book/en/v2) diariamente, mas deseja ter uma boa compreensão dos **fundamentos** do Git, então este post é para você.

Aqui, você terá a chance de verdadeiramente entender a **arquitetura do Git** e como comandos como **add, checkout, reset, commit, merge, rebase, cherry-pick, pull, push** e **tag** funcionam internamente.

*Não deixe o Git te dominar*, aprenda os fundamentos do Git e **domine o Git em vez disso**.

Prepare-se, um **guia completo sobre o Git** está prestes a começar.

---

## 💡 Primeiro as coisas mais importantes

Você deve praticar *enquanto lê* este post.

Acompanhando, vamos primeiro criar um novo projeto chamado `git-101` e depois inicializar um repositório git com o comando `git init`:

```bash
$ mkdir git-101
$ cd git-101
```

O CLI do Git fornece dois tipos de comandos:

* **plumbing**, que consiste em *comandos de baixo nível* usados internamente pelo Git nos bastidores quando os usuários digitam comandos *de alto nível*
    
* **porcelain**, que são os comandos *de alto nível* comumente usados pelos usuários do Git
    

Neste guia, veremos como os **comandos plumbing se relacionam com os comandos porcelain** que usamos no dia a dia.

---

## ⚙️ A arquitetura do Git

Dentro do projeto *que contém um repositório Git*, podemos verificar os componentes do Git:

```bash
$ ls -F1 .git/

HEAD
config
description
hooks/
info/
objects/
refs/
```

Vamos nos concentrar nos principais:

* .git/objects/
    
* .git/refs
    
* HEAD
    

Vamos analisar cada componente **em detalhes**.

---

## 💾 O Banco de Dados de Objetos

Usando a ferramenta UNIX `find`, podemos ver a estrutura da pasta `.git/objects`:

```bash
$ find .git/objects

.git/objects
.git/objects/pack
.git/objects/info
```

No Git, tudo é persistido na estrutura `.git/objects`, que é o **Banco de Dados de Objetos do Git**.

Que tipo de conteúdo podemos persistir no Git? *Qualquer tipo*.

> 🤔 **Espere!**
> 
> Como isso é possível?

Através do uso de [funções hash](https://en.wikipedia.org/wiki/Hash_function).

### 🔵 Hashing for the rescue

Uma **função hash** *mapeia dados de tamanho arbitrário e dinâmico em valores de tamanho fixo*. Ao fazer isso, podemos armazenar/persistir qualquer coisa, porque o valor final terá sempre o *mesmo tamanho*.

Implementações ruins de funções hash podem facilmente levar a **colisões**, onde dois dados de tamanho dinâmico diferentes podem mapear para o mesmo valor final de hash de tamanho fixo.

[SHA-1](https://en.wikipedia.org/wiki/SHA-1) é uma implementação bem conhecida da função hash que é geralmente segura e raramente tem colisões.

Vamos pegar, por exemplo, o hash da string `

my precious`:

```bash
$ echo -e "my precious" | openssl sha1
fa628c8eeaa9527cfb5ac39f43c3760fe4bf8bed
```

*Observação: Se você estiver usando o Linux, pode usar o comando* `sha1sum` *em vez de* `OpenSSL`.

### 🔵 Comparando diferenças no conteúdo

Um *bom hashing* é uma prática segura onde **não podemos conhecer o valor original**, ou seja, fazer engenharia reversa.

Caso queiramos saber *se o valor mudou*, basta envolver o valor na função de hash e *voilà*, podemos comparar a diferença:

```bash
$ echo -e "my precious" | openssl sha1
fa628c8eeaa9527cfb5ac39f43c3760fe4bf8bed

$ echo -e "no longer my precious" | openssl sha1
2e71c9ae2ef57194955feeaa99f8543ea4cd9f9f
```

Se os *hashes forem diferentes*, então podemos assumir que o **valor mudou**.

Você consegue ver uma oportunidade aqui? Que tal usar **SHA-1** para armazenar dados e *apenas acompanhar tudo* comparando hashes?

Isso é exatamente o que o Git faz internamente 🤯.

### 🔵 Git e SHA-1

**O Git usa o SHA-1 para gerar hashes** de tudo e armazena no diretório `.git/objects`. *Simples assim!*

O comando **plumbing** `hash-object` faz o trabalho:

```bash
$ echo "my precious" | git hash-object --stdin
8b73d29acc6ae79354c2b87ab791aecccf51701f
```

Vamos comparar com a versão `OpenSSL`:

```bash
$ echo -e "my precious" | openssl sha1
fa628c8eeaa9527cfb5ac39f43c3760fe4bf8bed
```

**Oooops**... é bastante diferente. Isso ocorre porque o Git *adiciona uma palavra específica* seguida pelo *tamanho do conteúdo* e o delimitador `\0`. Essa palavra é o que o Git chama de **tipo do objeto**.

Sim, *objetos do Git têm tipos*. O primeiro que vamos ver é **o objeto blob**.

### 🔵 O objeto blob

Quando enviamos, por exemplo, a string "my precious" para o comando `hash-object`, o Git adiciona o padrão `{tipo_do_objeto} {tamanho_do_conteúdo}\0` à função SHA-1, para que fique:

```text
blob 12\0myprecious
```

Então:

```bash
$ echo -e "blob 12\0my precious" | openssl sha1
8b73d29acc6ae79354c2b87ab791aecccf51701f

$ echo "my precious" | git hash-object --stdin
8b73d29acc6ae79354c2b87ab791aecccf51701f
```

**Yay!** 🎉

### 🔵 Armazenando blobs no banco de dados

Mas o comando `hash-object` em si não persiste no diretório `.git/objects`. Devemos acrescentar a opção `-w` e o objeto será persistido:

```bash
$ echo "my precious" | git hash-object --stdin -w
8b73d29acc6ae79354c2b87ab791aecccf51701f

$ find .git/objects
...
.git/objects/8b
.git/objects/8b/73d29acc6ae79354c2b87ab791aecccf51701f

### Ou, simplesmente
$ find .git/objects -type f
.git/objects/8b/73d29acc6ae79354c2b87ab791aecccf51701f
```

![o primeiro objeto](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/9m8l1485y5a0d8cwog1o.png)

### 🔵 Lendo o conteúdo de um blob

Já sabemos que, por razões criptográficas, não é possível ler o conteúdo de um blob a partir de sua versão de hash.

> 🤔 Ok, mas espere.
> 
> Como o Git *descobre o valor original*?

Ele usa o hash como uma **chave que aponta para um valor**, que é o *próprio conteúdo original* usando um algoritmo de compressão chamado [Zlib](https://en.wikipedia.org/wiki/Zlib), que **compacta o conteúdo** e o armazena no banco de dados de objetos, economizando assim espaço de armazenamento.

O comando **plumbing** `cat-file` faz o trabalho, de forma que, *dada uma chave*, ele descomprime os dados compactados e obtém o conteúdo original:

```bash
$ git cat-file -p 8b73d29acc6ae79354c2b87ab791aecccf51701f
my precious
```

No caso de você estar imaginando, isso mesmo, **o Git é um banco de dados chave-valor**!

![nosql](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/jhjl5r81esbokdfo6gqs.png)

### 🔵 Promovendo blobs

Ao usar o Git, queremos trabalhar no conteúdo e **compartilhá-lo com outras pessoas**.

Comumente, depois de trabalhar em vários arquivos/blobs, estamos prontos para *compartilhá-los e assinar nossos nomes para o trabalho final*.

Em outras palavras, precisamos **agrupar, promover e adicionar metadados aos nossos blobs**. Esse processo funciona da seguinte forma:

1. Adicionar o blob a uma *área de preparação* (staging area)
    
2. Agrupar **todos os blobs** na área de preparação em uma *estrutura de árvore*
    
3. Adicionar **metadados** à *estrutura de árvore* (nome do autor, data, uma mensagem semântica)
    

Vamos ver os *passos acima em detalhes*.

### 🔵 Área de preparação, o índice

O comando **plumbing** `update-index` permite adicionar um blob à área de preparação (stage) e dar um nome a ele:

```bash
$ git update-index \
    --add \
    --cacheinfo 100644 \
    8b73d29acc6ae79354c2b87ab791aecccf51701f \
    index.txt
```

* `--add`: adiciona o blob à área de preparação, também chamada de **índice**
    
* `--cacheinfo`: usado para registrar um arquivo que ainda não está no diretório de trabalho
    
* o hash do blob
    
* `index.txt`: um nome para o blob no índice
    

![o índice do Git](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/dhcrrhbui33ao66muizk.png)

Onde o Git *armazena o índice*?

```bash
$ cat .git/index

DIRCsҚjT¸zQp    index.txtÆ
                          7CJVVÙ
```

No entanto, não é legível para humanos, está compactado usando Zlib.

Podemos adicionar quantos blobs quisermos ao índice, por exemplo:

```bash
$ git update-index {sha-1} f1.txt
$ git update-index {sha-1} f2.txt
```

Após adicionar blobs ao índice, podemos agrupá-los em uma **estrutura de árvore** que está pronta para ser promovida.

### 🔵 O objeto Tree

Ao usar o comando **plumbing** `write-tree`, **o Git agrupa todos os blobs que foram adicionados ao índice** e cria outro objeto na pasta `.git/objects`:

```bash
$ git write-tree
3725c9e313e5ae764b2451a8f3b1415bf67cf471
```

Verificando a pasta `.git/objects`, observe que um novo objeto foi criado:

```bash
$ find .git/objects

### O novo objeto
.git/objects/37
.git/objects/37/25c9e313e5ae764b2451a8f3b1415bf67cf471

### O blob criado anteriormente
.git/objects/8b
.git/objects/8b/73d29acc6ae79354c2b87ab791aecccf51701f
```

Vamos recuperar o valor original usando `cat-file` para entender melhor:

```bash
### Usando a opção -t, obtemos o tipo do objeto
$ git cat-file -t 3725c9e313e5ae764b2451a8f3b1415bf67cf471
tree

$ git cat-file -p 3725c9e313e5ae764b2451a8f3b1415bf67cf471
100644 blob 8b73d29acc6ae79354c2b87ab791aecccf51701f index.txt
```

Isso é uma saída interessante, é bastante diferente do blob que *retornou o conteúdo original*.

*No objeto de árvore*, o Git retorna **todos os objetos que foram adicionados ao índice**.

```text
100644 blob 8b73d29acc6ae79354c2b87ab791aecccf51701f index.txt
```

* `100644`: o cacheinfo
    
* `blob`: o tipo do objeto
    
* o hash do blob
    
* o nome do blob
    

![o objeto de árvore](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/sf62qc9mlvcgde8hzyb2.png)

Uma vez que a promoção é concluída, **hora de adicionar alguns metadados à árvore**, para que possamos declarar o nome do autor, a data e assim por diante.

### 🔵 O objeto commit

O comando **plumbing** `commit-tree` recebe uma árvore, uma mensagem de commit e cria outro objeto na pasta `.git/objects`:

```bash
$ git commit-tree 3725c -m 'meu commit precioso'
505555f4f07d90ae14a0f2e67cba7f7b9af539ee
```

Que tipo de objeto é esse?

```bash
$ find .git/objects
...
.git/objects/50
.git/objects/50/5555f4f07d90ae14a0f2e67cba7f7b9af539ee

### cat-file
$ git cat-file -t 505555f4f07d90ae14a0f2e67cba7f7b9af539ee
commit
```

E qual é o seu valor?

```bash
$ git cat-file -p 505555f4f07d90ae14a0f2e67cba7f7b9af539ee

tree 3725c9e313e5ae764b2451a8f3b1415bf67cf471
author leandronsp <leandronsp@example.com> 1678768514 -0300
committer leandronsp <leandronsp@example.com> 1678768514 -0300

meu commit precioso
```

* `tree 3725c`: **a árvore referenciada**
    
* autor/confirmador
    
* a mensagem do commit **meu commit precioso**
    

![a árvore de commits](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/rx73s2uu3uyi8367a47y.png)

> 🤯 OMG! Estou vendo um padrão aqui?

Além disso, os commits podem fazer referência a outros commits:

```bash
$ git commit-tree 3725c -p 50555 -m 'segundo commit'
5ea578a41333bae71527db537072534a199a0b67
```

Onde a opção `-p` permite fazer referência a um **commit pai**:

```bash
$ git cat-file -p 5ea578a41333bae71527db537072534a199a0b67

tree 3725c9e313e5ae764b2451a8f3b1415bf67cf471
parent 505555f4f07d90ae14a0f2e67cba7f7b9af539ee
author leandronsp <leandronsp@gmail.com> 1678768968 -0300
committer leandronsp <leandronsp@gmail.com> 1678768968 -0300

segundo commit
```

Podemos ver que, *dado um commit com um commit pai*, podemos percorrer **todos os commits recursivamente**, *através de todas as suas árvores*, até chegarmos aos **blobs finais**.

Uma solução potencial:

```bash
$ git cat-file -p <sha1-do-primeiro-commit>
$ git cat-file -p <sha1-da-árvore-do-primeiro-commit>
$ git cat-file -p <sha1-do-commit-pai-do-primeiro-commit>
$ git cat-file -p <sha1-do-commit-pai>
...
```

E assim por diante. Bem, *você chegou ao ponto*.

### 🔵 Log for the rescue

O comando **porcelain** `git log` resolve esse problema, percorrendo *todos os commits, seus parents e árvores*, nos dando uma perspectiva de uma **linha do tempo do nosso trabalho**.

```bash
$ git log 5ea57

commit 5ea578a41333bae71527db537072534a199a0b67
Author: leandronsp <leandronsp@gmail.com>
Date:   Seg Mar 13 22:42:48 2023 -0300

    segundo commit

commit 505555f4f07d90ae14a0f2e67cba7f7b9af539ee
Author: leandronsp <leandronsp@gmail.com>
Date:   Seg Mar 13 22:35:14 2023 -0300

    meu commit precioso
```

> 🤯 OMG!
> 
> O Git é um banco de dados de grafos gigante e leve, baseado em chave-valor!

### 🔵 O Grafo do Git

Dentro do Git, podemos *manipular objetos como ponteiros em grafos*.

![o grafo do Git](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/xwj38c1zvimxfxpfzcq1.png)

* **Blobs** são instantâneos de dados/arquivos
    
* **Trees** são conjuntos de blobs ou outras árvores
    
* **Commits** fazem referência a árvores e/ou outros commits, adicionando metadados
    

Isso é muito legal e tudo mais. Mas usar `sha1` no comando `git log` pode ser trabalhoso.

Que tal **dar nomes aos hashes**? É aí que entram as **Referências**.

---

## Referências do Git

As referências estão localizadas na pasta `.git/refs`:

```bash
$ find .git/refs

.git/refs/
.git/refs/heads
.git/refs/tags
```

### 🔵 Dando nomes aos commits

Podemos associar qualquer hash de commit a um nome arbitrário localizado em `.git/refs/heads`, por exemplo:

```bash
echo 5ea578a41333bae71527db537072534a199a0b67 > .git/refs/heads/test
```

Agora, vamos usar o `git log` usando a nova referência:

```bash
$ git log test

commit 5ea578a41333bae71527db537072534a199a0b67
Author: leandronsp <leandronsp@gmail.com>
Date:   Seg Mar 13 22:42:48 2023 -0300

    segundo commit

commit 505555f4f07d90ae14a0f2e67cba7f7b9af539ee
Author: leandronsp <leandronsp@gmail.com>
Date:   Seg Mar 13 22:35:14 2023 -0300

    meu commit precioso
```

Ainda melhor, o Git fornece o comando **plumbing** `update-ref`, para que possamos usá-lo para atualizar a associação de um commit a uma referência:

```bash
$ git update-ref refs/heads/test 5ea578a41333bae71527db537072534a199a0b67
```

*Parece familiar, não é mesmo?* Sim, estamos falando de **branches**.

### 🔵 Branches

Branches são referências que apontam para um commit específico.

Como as branches representam o comando `update-ref`, o *hash do commit pode ser alterado* a qualquer momento, ou seja, **uma referência de branch é mutável**.

![branches](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/a00yup5tew9hrmnr96xg.png)

Por um momento, vamos pensar em como funciona um `git log` sem argumentos:

```bash
$ git log

fatal: sua branch atual 'main' não tem nenhum commit ainda
```

> 🤔 Hmmm...
> 
> Como o Git *sabe que minha branch atual é a "main"*?

### 🔵 HEAD

A referência HEAD está localizada em `.git/HEAD`. É um único arquivo que aponta para uma *referência de cabeça* (branch):

```bash
$ cat .git/HEAD

ref: refs/heads/main
```

Da mesma forma, usando um comando **porcelain**:

```bash
$ git branch
* main
```

Usando o comando **plumbing** `symbolic-ref`, podemos manipular para *qual branch a HEAD aponta*:

```bash
$ git symbolic-ref HEAD refs/heads/test

### Verificar a branch atual
$ git branch
* test
```

Assim como `update-ref` nas branches, podemos atualizar a HEAD usando `symbolic-ref` a qualquer momento.

![symbolic ref](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/toezd1b9r5zlrezmwb27.png)

Na imagem abaixo, vamos mudar nossa HEAD da branch **main** para a branch **fix**:

![atualizando a head](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/01nz6085jlze4nqlza9d.png)

Sem argumentos, o comando `git log` percorre o commit raiz que é referenciado pela branch atual (HEAD):

```bash
$ git log

commit 5ea578a41333bae71527db537072534a199a0b67 (HEAD -> test)
Author: leandronsp <leandronsp@gmail.com>
Date:   Ter Mar 14 01:42:48 2023 -0300

    segundo commit

commit 505555f4f07d90ae14a0f2e67cba7f7b9af539ee
Author: leandronsp <leandronsp@gmail.com>
Date:   Ter Mar 14 01:35:14 2023 -0300

    meu commit precioso
```

Até agora, aprendemos a arquitetura e os principais componentes do Git, juntamente com os **comandos plumbing**, que são mais *baixo nível*.

Agora é hora de associar todo esse conhecimento com os **comandos de alto nível** que usamos diariamente.

---

## 🍽️ Porcelain, os comandos de alto nível

O Git traz mais comandos *de alto nível* que podemos usar sem a necessidade de manipular objetos e referências diretamente.

Esses comandos são chamados de **comandos porcelain**.

### 🔵 git add

O comando `git add` recebe arquivos no **diretório de trabalho** como argumentos, *salva-os como blobs* no banco de dados e os adiciona *ao index*.

![git add](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/tmfcfn23v1yvesjk9mzz.png)

Em resumo, `git add`:

1. executa `hash-object` para cada arquivo argumento
    
2. executa `update-index` para cada arquivo argumento
    

### 🔵 git commit

`git commit` recebe uma mensagem como argumento, agrupa todos os arquivos previamente adicionados ao index e cria um **objeto commit**.

Primeiro, ele executa `write-tree`:

![commit write tree](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/imc0yzk6cn98hd3d09gf.png)

Em seguida, ele executa `commit-tree`:

![commit commit-tree](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/tix2m469gnkqp2hes7k0.png)

```bash
$ git commit -m 'mais um commit'

[test b77b454] mais um commit
 1 arquivo alterado, 1 exclusão(-)
 exclusão do modo 100644 index.txt
```

---

## 🕸️ Manipulando ponteiros no Git

Os seguintes comandos **porcelain** são amplamente utilizados, manipulando as **referências do Git** nos bastidores.

Supondo que acabamos de clonar um projeto onde a **HEAD** está apontando para a **branch main**, que aponta para o commit **C1**:

![git clone](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/v78l7749er21w7qzbjll.png)

Como podemos **criar uma nova branch** a partir da HEAD atual e *mover a HEAD para esta nova branch*?

### 🔵 git checkout

Ao usar o `git checkout` com a opção `-b`, o Git criará uma nova branch a partir da atual (HEAD) e moverá a HEAD para esta nova branch.

```bash
### HEAD
$ git branch
* main

### Cria uma nova branch "fix" usando o mesmo SHA-1 de referência
#### da HEAD atual
$ git checkout -b fix
Switched to a new branch 'fix'

### HEAD
$ git branch
* fix
main
```

Qual comando **plumbing** é responsável por mover a HEAD? Exatamente, *symbolic-ref*.

![git checkout -b fix](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/3yhvz46cb9mdj720wxlu.png)

Em seguida, fazemos algum trabalho na **branch fix** e depois executamos `git commit`, que adicionará um novo commit chamado **C3**:

![git commmit](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/6qmbh90fxn2o63wr7gpt.png)

Ao executar `git checkout`, podemos alternar a HEAD entre diferentes branches:

![git checkout ultimate](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/b5i2b8mnp7zkrs9uguha.png)

Às vezes, podemos querer **mover o commit para o qual uma branch aponta**.

Já sabemos que o comando **plumbing** `update-ref` faz isso:

```bash
$ git update-ref refs/heads/fix 356c2
```

Na linguagem do **porcelain**, apresento a você o **git reset**.

### 🔵 git reset

O comando **porcelain** `git reset` executa internamente o **update-ref**, então só precisamos fazer:

```bash
$ git reset 356c2
```

Mas como o Git sabe qual branch mover? Bem, o *git reset* **move a branch para a qual a HEAD está apontando**.

![git reset](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/ki3dzr73q7xb7kpz7704.png)

E quando há *diferenças* entre as revisões? Ao usar o `reset`, o Git move o ponteiro mas **mantém todas as diferenças na área de preparação** (index).

```bash
$ git reset b77b
```

Verificando com `git status`:

```bash
$ git status

On branch fix
Untracked files:
  (use "git add <file>..." to include in what will be committed)
        another.html
        bye.html
        hello.html

nothing added to commit but untracked files present (use "git add" to track)
```

*A revisão do commit foi alterada na* ***branch fix*** *e todas as diferenças foram* ***movidas para o index***.

Ainda assim, o que devemos fazer se quisermos **resetar E descartar** todas as diferenças? Basta adicionar a opção `--hard`:

![git reset hard](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/zhlcot7lpmuo57jmo5a1.png)

Ao usar `git reset --hard`, quaisquer diferenças entre as revisões **serão descartadas** e elas *não aparecerão no index*.

### 💡 Dica de ouro sobre mover uma branch

Caso queiramos executar o *plumbing*

 `update-ref` em outra branch, não é necessário fazer checkout da branch como é necessário no **git reset**.

Podemos usar o comando **porcelain** `git branch -f source target`:

```bash
$ git branch -f main b77b
```

Nos bastidores, ele executa um `git reset --hard` na branch de origem. Vamos verificar para qual commit a **branch main** está apontando:

```bash
$ git log main --pretty=oneline -n1
b77b454a9a507f839880879a895ac4f241177a28 (main) another commit
```

Também confirmamos que a **branch fix** ainda está apontando para o commit `369cd`:

```bash
$ git log fix --pretty=oneline -n1
369cd96b1f1ef6fa7de1ff2ed12e15be979dcffa (HEAD -> fix, test) add files
```

Fizemos um "git reset" *sem mover a HEAD*!

![git branch -f](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/7v7faopa858go3zkrygq.png)

Não é raro, *em vez de mover um ponteiro de branch*, queremos **aplicar um commit específico à branch atual**.

Conheça o **cherry-pick**.

### 🔵 git cherry-pick
**cherry-pick** é um comando **porcelain** que nos permite aplicar um commit arbitrário na branch atual.

Considere o seguinte cenário:

![cenário 42](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/i0n7mldmwq8p3be6bzlf.png)

- **main** aponta para C3 - C2 - C1
- **fix** aponta para C5 - C4 - C2 - C1
- **HEAD** aponta para fix

Na *branch fix*, estamos **sem o commit C3**, que está sendo referenciado pela *branch main*.

Podemos aplicá-lo executando `git cherry-pick C3`:

![cherry pick A](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/uvw4m2fom52ggxvn0o13.png)

Observe que:

- o **commit C3** será clonado em um novo commit chamado **C3'**
- esse novo commit fará referência ao commit C5
- **fix moverá o ponteiro para C3'**
- *HEAD continua apontando para fix*

Depois de aplicar as alterações, o grafo será representado da seguinte forma:

![cherry pick B](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/2gqsdauqv0alwrb4w4ol.png)

Existe outra maneira de mover o ponteiro de uma branch. Consiste em *aplicar um commit arbitrário de outra branch*, mas **mesclar as diferenças**, se necessário.

Você não está errado, estamos falando de **git merge** aqui.

### 🔵 git merge

Vamos descrever o seguinte cenário:

![outro cenário](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/61lv3lp1bsi3o7ingaxq.png)

- main aponta para C3 - C2 - C1
- fix aponta para C4 - C3 - C2 - C1
- HEAD aponta para main

Queremos aplicar a branch fix na branch atual (main), *também conhecido como* realizar um **git merge fix**.

Observe que a **branch fix contém todos os commits pertencentes à branch main** (C3 - C2 - C1), tendo apenas *um commit à frente* da main (C4).

Nesse caso, a branch main será "encaminhada", apontando para o mesmo commit da branch fix.

Esse tipo de merge é chamado de **fast-forward**, como descrito na imagem abaixo:

![fast forward](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/m6zh34jsvg46wly76qcq.png)

### Quando o fast-forward não é possível

Às vezes, a estrutura atual do nosso estado na árvore não permite o fast-forward. Veja o cenário abaixo:

![cenário 44](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/a4tsezqc59orz8a2o2nb.png)

Nesse caso, a branch que será mesclada - **branch fix** no exemplo acima - *não contém um ou mais commits* da branch atual (main): **o commit C3**.

Portanto, *o fast-forward não é possível*.

No entanto, para que a mesclagem seja bem-sucedida, o Git realiza uma técnica chamada **Snapshotting**, composta pelas seguintes etapas.

Prime

iro, o Git busca o **próximo parente comum** entre as duas branches, neste exemplo, o commit **C2**.

![mesclagem common parent](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/1s3sfasy9216hhq8lzo5.png)

Em segundo lugar, o Git tira um **snapshot do target**, que é o commit da branch C3:

![snapshot do target](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/r5b784w4wejqx7xawynu.png)

Terceiro, o Git tira um **snapshot do source**, que é o commit da branch C5:

![snapshot do source](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/ouc15w3h73xwub9vuorn.png)

Por fim, o Git cria automaticamente um commit de mesclagem (C6) e o aponta para dois pais respectivamente: C3 (target) e C5 (source):

![commit de mesclagem](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/q030zd9jjl0nb17i871j.png)

Você já se perguntou por que sua árvore Git exibe alguns commits que foram criados **automaticamente**?

*Não se engane*, esse processo de mesclagem é chamado de **mesclagem de três vias**, ou _three-way merge_!

![mesclagem de três vias](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/05j8ntrxzax8ruydehl1.png)

A seguir, vamos explorar *outra técnica de mesclagem* em que o fast-forward não é possível, mas, em vez de snapshotting e commit automático de mesclagem, o Git aplica as diferenças **em cima da branch source**.

Sim, esse é o **git rebase**.

### 🔵 git rebase

Considere a seguinte imagem:

![cenário 55](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/n6u9hkcopd56anjjt6s7.png)

- main aponta para C3 - C2 - C1
- fix aponta para C5 - C4 - C2 - C1
- HEAD aponta para fix

Queremos **rebase** a branch main na branch fix, executando `git rebase main`. Mas como funciona o *git rebase*?

👉 **git reset**

Primeiro, o Git executa um **git reset main**, onde a branch fix apontará para o mesmo ponteiro da branch main: *C3 - C2 - C1*.

![rebase:reset](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/qq56zo5l7v6urjib67n0.png)

Neste momento, os commits C5 - C4 *não têm referências*.

👉 **git cherry-pick**

Em segundo lugar, o Git executa um **git cherry-pick C5** na branch atual:

![rebase:cherry-pick](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/ucbxeoflzk8izrb2w621.png)

Observe que, durante o *processo de cherry-pick*, os commits cherry-pickados são clonados, portanto, o hash final será alterado: **C5 - C4 se torna C5' - C4'**.

Depois do cherry-pick, podemos ter o seguinte cenário:

![rebase-cherry-pick-b](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/q65tu7b5h3zj1ma2b0gj.png)

👉 **git reset novamente**

Por último, o Git realizará um **git reset C5'**, para que o ponteiro da branch fix seja movido *de C3 para C5'*.

O processo de rebase está concluído.

![rebase:finish](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/jjs73j725nbmjiau9nwc.png)

Até agora, trabalhamos com *branches locais*, ou seja, em nossa máquina. Hora de aprender como trabalhar com **branches remotas**, que estão sincronizadas com *repositórios remotos na internet*.

---

## 🌐 Branches remotas

Para trabalhar com branches remotas, precisamos *adicionar um remote* ao nosso repositório local, usando o comando **porcelain** `git remote`.

```bash
$ git remote add origin git@github.com/myaccount/myrepo.git
```

Os remotes estão localizados na pasta `.git/refs/remotes`:

```bash
$ find .git/refs
...
.git/refs/remotes/origin
.git/refs/remotes/origin/main
```

### 🔵 Buscar do remoto

Como **sincronizar** a branch remota com nossa branch local?

O Git fornece **duas etapas**:

👉 **git fetch**

Usando o comando **porcelain** `git fetch origin main`, o Git fará o download da branch remota e a sincronizará com uma nova branch local chamada **origin/main**, também conhecida como **branch upstream**.

![fetch](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/9hii3cz4cjttk4pqnwzx.png)

👉 **git merge**

Após buscar e sincronizar a branch upstream, podemos executar um `git merge origin/main` e, como a upstream está à frente da nossa branch local, o Git aplicará com segurança um **merge fast-forward**.

![fetch merge ff](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/86x06eev8316smdlz8i2.png)

No entanto, *fetch + merge* pode ser repetitivo, pois estaríamos sincronizando as branches local/remota várias vezes ao dia.

Mas hoje é *nosso dia de sorte*, e o Git fornece o comando **git pull**, que realiza o fetch + merge em nosso nome.

👉 **git pull**

Com o `git pull`, o Git executará o fetch (sincronizar o remoto com a branch upstream) e, em seguida, mesclará a branch upstream na branch local.

![git pull](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/ce7lb2f2bxpeoigfqbyr.png)

Ok, vimos como baixar/transferir alterações do remoto. Por outro lado, como enviar alterações locais para o remoto?

### 🔵 Enviar para o remoto

O Git fornece um comando **porcelain** chamado `git push`:

👉 **git push**

Ao executar `git push origin main`, primeiro o Git enviará as alterações para o remoto:

![push A](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/t6peyj4lcpdisu5310qx.png)

Em seguida, o

 Git mesclará a branch upstream `origin/main` com a branch local `main`:

![push B](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/nafbkbjsqioiljaeaqkw.png)

No final do **processo de push**, temos a seguinte imagem:

![push end](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/jcq5u4t60i15qm8127jd.png)

Onde:

- O remoto foi atualizado (alterações locais enviadas para o remoto)
- main aponta para C4
- origin/main aponta para C4
- HEAD aponta para main

### 🔵 Dando nomes imutáveis para commits

Até agora, aprendemos que as **branches são simplesmente referências mutáveis para commits**, é por isso que podemos mover o ponteiro de uma branch a qualquer momento.

No entanto, o Git também fornece uma maneira de *dar referências imutáveis*, que não podem ter seus ponteiros alterados (a menos que você as exclua e as crie novamente).

As referências imutáveis são úteis quando queremos *rotular/marcar commits* que estão prontos para algum lançamento de produção, por exemplo.

Sim, estamos falando das **tags**.

👉 **git tag**

Usando o comando **porcelain** `git tag`, podemos dar nomes aos commits, mas não podemos executar reset ou qualquer outro comando que possa alterar o ponteiro.

![git tag](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/pm62925zwulfu2vijjie.png)

É bastante útil para a versão de lançamentos. As tags estão localizadas na pasta `.git/refs/tags`:

```bash
$ find .git/refs

...
.git/refs/tags
.git/refs/tags/v1.0
```

*Se quisermos alterar o ponteiro da tag, precisamos excluí-la e criar outra com o mesmo nome*.

---

## 💡 Git reflog

Por último, mas não menos importante, há um comando chamado `git reflog` que mantém todas as alterações que fizemos em nosso repositório local.

```bash
$ git reflog

369cd96 (HEAD -> fix, test) HEAD@{0}: reset: moving to main
b77b454 (main) HEAD@{1}: reset: moving to b77b
369cd96 (HEAD -> fix, test) HEAD@{2}: checkout: moving from main to fix
369cd96 (HEAD -> fix, test) HEAD@{3}: checkout: moving from fix to main
369cd96 (HEAD -> fix, test) HEAD@{4}: checkout: moving from main to fix
369cd96 (HEAD -> fix, test) HEAD@{5}: checkout: moving from fix to main
369cd96 (HEAD -> fix, test) HEAD@{6}: checkout: moving from main to fix
369cd96 (HEAD -> fix, test) HEAD@{7}: checkout: moving from test to main
369cd96 (HEAD -> fix, test) HEAD@{8}: checkout: moving from main to test
369cd96 (HEAD -> fix, test) HEAD@{9}: checkout: moving from test to main
369cd96 (HEAD -> fix, test) HEAD@{10}: commit: add files
b77b454 (main) HEAD@{11}: commit: another commit
5ea578a HEAD@{12}:
```

**É bastanteútil** se quisermos *voltar e avançar* na linha do tempo do Git. Juntamente com *reset, cherry-pick e similares*, é uma ferramenta poderosa se quisermos dominar o Git.

---

## Conclusão

Que jornada longa!

Este artigo foi um pouco longo, mas pude abordar os principais tópicos que considero importantes para entender sobre o Git.

Espero que, depois de ler este artigo, você se sinta mais confiante ao usar o Git, resolver conflitos diários e situações complicadas durante um processo de merge/rebase.

Siga-me no [Twitter](https://twitter.com/leandronsp) e confira meu blog [leandronsp.com](http://leandronsp.com), onde também escrevo alguns artigos técnicos.

Até mais!

---

_Este artigo é uma tradução **by ChatGPT** do meu artigo original [Git fundamentals, a complete guide](https://leandronsp.com/articles/git-fundamentals-a-complete-guide-do7)._
