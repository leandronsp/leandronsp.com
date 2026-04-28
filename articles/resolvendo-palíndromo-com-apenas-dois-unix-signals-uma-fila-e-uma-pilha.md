---
title: Palíndromo utilizando dois UNIX signals, uma fila e uma pilha
slug: "palindromo-unix-signals"
published_at: "2026-04-27 20:23:21Z"
language: "pt-BR"
status: published
tags: ["bash"]
---

Palíndromos, palíndromos. Você deve estar se perguntando como veio parar aqui, muito provavelmente já sem paciência pra este assunto por conta da recente trend do twitter no último fim de semana que, convenhamos, ultrapassou alguns limites:

![Print de trending topics do Twitter mostrando 'Palíndromo' no topo da Bolha Dev](/images/untitled-2-screenshot-2026-04-27-at-17-48-31.png)

O assunto subiu para o trending topics global e os gringos ficavam se perguntando:

> Why is palindrome such a hot topic in Brazil now?

_Mal sabem eles que aqui no Brasil TUDO vira meme, até mesmo o "67" deles. Melhoramos o "67" e escalamos para um nível diferenciado. Google pesquisar._

Não vou entrar em detalhes, mas basicamente a "treta" foi criada porque alguém mencionou que não conseguia contratar desenvolvedores pois nenhum candidato passava no teste do palíndromo. O negócio escalou. Teve implementação de palíndromo de todos os tipos e também teve muito meme, que foi a melhor parte pra mim.

Mas vamos lá, quem acompanha meu blog sabe que não escrevo por escrever. Eu gosto de explorar um assunto técnico e ir fundo (lá ele), captando e compartilhando conhecimento no meio do caminho. É pra isso que estou aqui.

---

## Agenda

* [First things first](#first-things-first)
* [Palindromaniacs](#palindromaniacs)
  * [Mas a gente é diferente: UNIX signals + queue + stack](#mas-a-gente-é-diferente-unix-signals--queue--stack)
* [UNIX signals como forma de comunicação](#unix-signals-como-forma-de-comunicação)
  * [Enviando binário com dois UNIX signals](#enviando-binário-com-dois-unix-signals)
  * [Montando bytes a partir dos bits](#montando-bytes-a-partir-dos-bits)
  * [Enviando strings inteiras](#enviando-strings-inteiras)
* [Marcando o fim da mensagem](#marcando-o-fim-da-mensagem)
* [Fila e pilha: o teorema central](#fila-e-pilha-o-teorema-central)
  * [Conectando tudo](#conectando-tudo)
* [Bonus points: Handshake FTW](#bonus-points-handshake-ftw)
* [Conclusão gloriosa](#conclusão-gloriosa)

---

## First things first

E a pedido de muitos, incluindo o brabíssimo Navarro, vamos fazer uma implementação do _palíndromo_ em Bash:

![Tweet do Rodrigo Navarro (@rdrnavarro) cobrando a versão canônica do palíndromo em Bash](/images/untitled-2-screenshot-2026-04-27-at-17-55-06-1.png)

> Por que Bash, Leandro?

Porque entre todos os que submeteram soluções para a [1ª Rinha de Backend](https://github.com/zanfranceschi/rinha-de-backend-2023-q3) e as subsequentes, eu fui o [primeiro da linhagem](https://github.com/leandronsp/rinha-backend-bash) com uma submissão funcional porém nada performática. 

O que era pra ser um meme no Twitter, acabou virando o apelido "carinha do Bash". É sobre isso.

---

## Palindromaniacs

Uma das implementações mais comuns para _palindromania_ chama-se **two pointers**, onde definimos dois ponteiros na string e vamos comparando o primeiro com o último, o segundo com o penúltimo e assim por diante, mexendo nos ponteiros até chegar na _metade da string_. Se todas as comparações derem certo, a palavra é palíndromo. 

Em Bash dá pra implementar isso de forma mais legível usando _substrings_, que é prima do two pointers:

```sh
is_palindrome() {
    local input="$1"
    local length=${#input}

    for ((i=0; i<length/2; i++)) do
        local leftmost=${input:$i:1}
        local rightmost=${input:$((length-1-i)):1}

        [ "$leftmost" != "$rightmost" ] && return 1 # Error status code, IS NOT a palindrome
    done

    return 0 # Success status code, IS a palindrome
}
```

Sem entrar muito em detalhes, vou explicar pois Bash:

* `local input="$1"`: joga o primeiro argumento da linha de comando na variável input
* `local length=${#input}`: pega o tamanho do input
* `for ((i=0; i<length/2; i++))`: itera sobre cada caractere da string até a metade
* `local leftmost=${input:$i:1}`: pega 1 caractere a partir da posição `$i`, ou seja, o mais a esquerda possível
* `local rightmost=${input:$((length-1-i)):1}`: pega 1 caractere a partir da posição `length-1-i`, que vai andando do último pra dentro conforme `i` cresce, ou seja, o mais a direita possível
* `[ "$leftmost" != "$rightmost" ] && return 1`: compara os dois, se forem diferentes, a palavra **não é um** palíndromo

Caso não encontre nenhuma divergência nas comparações, então a palavra **é um** palíndromo, portanto `return 0` com sucesso.

Outras implementações que podemos encontrar:

* inverte a string e compara: essa é mais naive, geralmente `one-liner` e não requer muitos neurônios
* recursão: mais idiomática em linguagens funcionais
* stack: empilha a primeira metade, depois lê a segunda metade desempilhando e comparando a cada caractere
* _e mais_: deque (double-ended queue), programação dinâmica, etc tal e coisa

### Mas a gente é diferente: UNIX signals + queue + stack

Implementar palíndromo no modo tradicional faria Bash e este post serem mais do mesmo. Não tem graça, Bash precisa ser requintado. Então resolvi ~~ser o diferentão~~ inovar e resolver este problema utilizando apenas **dois sinais UNIX, uma fila e uma pilha**. A ideia, em três passos:

* um `sender` que manda a string bit a bit via signals
* um `receiver` que monta cada caractere e empilha em duas estruturas (FIFO e LIFO)
* no final, drena as duas estruturas. Se todo `pop` da pilha bater com todo `dequeue` da fila, é **palíndromo**.

**FIFO** significa _first-in, first-out_. É a nossa fila. E **LIFO** significa _last-in, first-out_, neste caso nossa pilha. Tudo nosso.

![Meme do Bugs Bunny soviético no espírito 'camarada, é tudo nosso'](/images/resolvendo-pal-ndromo-com-apenas-dois-unix-signals-uma-fila-e-uma-pilha-screenshot-2026-04-27-at-23-02-12.png)

Basicamente, estamos explorando duas estruturas de dados primordiais da computação para verificar se uma palavra é palíndromo. E não só, estamos enviando a string [utilizando IPC](https://leandronsp.com/articles/entendendo-unix-pipes-3k56) de uma forma bastante primitiva, com o _envio de sinais_.

Se quiser saber mais detalhes sobre UNIX signals e como os utilizei para construir um pequeno _broker de mensageria_, veja meu artigo [You don't need Kafka: building a message queue with only two UNIX signals](https://leandronsp.com/articles/you-dont-need-kafka-building-a-message-queue-with-only-two-unix-signals). Lá eu explico o necessário sobre envio de sinais e também como implementei a modulação/demodulação de sinais para bits.

---

## UNIX signals como forma de comunicação

O intuito deste artigo não é aprofundar muito nos sinais UNIX, uma vez que já abordei com profundidade no polêmico artigo anterior. Mas a seguir temos um exemplo bastante simples para estarmos na mesma página:

```sh
#!/usr/bin/env bash

trap 'echo "Received signal SIGUSR1"' SIGUSR1

echo "PID: $$"
echo "Rodar em outra sessão shell: kill -SIGUSR1 $$"

while true; do
    sleep 0.5 || true
done
```
```sh
$ bash receiver.sh
PID: 54112
Rodar em outra sessão shell: kill -SIGUSR1 54112
```
Em outra sessão:

```sh
$ kill -SIGUSR1 54112
```

Com isto, _receiver_ imprime `Received signal SIGUSR1` pra cada vez que enviarmos o sinal!

O que é um sinal, afinal? Pra quem nunca ouviu falar, signals são a forma mais primitiva de IPC no UNIX. Você pode mandar `kill -SIGTERM` num processo pra encerrá-lo, `kill -SIGINT` pro mesmo efeito de `Ctrl+C`, e por aí vai. A graça é que o processo que recebe pode _interceptar_ esses signals e _fazer o que quiser_. Esta é a famosa técnica de **signal trap**.

> Nossa, Leandro, mas o `kill` não "mata" o processo? 

Não, ele serve para envio de sinais, incluindo os clássicos `SIGTERM` e `SIGKILL`. Reforço: veja [meu artigo de UNIX signals](https://leandronsp.com/articles/you-dont-need-kafka-building-a-message-queue-with-only-two-unix-signals) para entender as nuances.

### Enviando binário com dois UNIX signals

Quando falamos de IPC primitivo tal como UNIX signals, não conseguimos enviar uma "mensagem" no formato que estamos acostumados (string). Nem bytes. Receber **um** signal é como receber um boolean: ligou ou não ligou. É a representação de apenas _dois estados possíveis_. 

O que UNIX nos entrega são dois sinais _user-defined_, **SIGUSR1** e **SIGUSR2**, livres para usarmos como quisermos. Não conseguimos enviar bytes, mas temos a primitiva necessária para representar um byte: _bits_.

* `SIGUSR1` = **bit 0**
* `SIGUSR2` = **bit 1**

Pronto, acabamos de inventar uma linguagem binária. O `receiver` agora fica assim:

```sh
  #!/usr/bin/env bash

  trap 'echo -n "0"' SIGUSR1
  trap 'echo -n "1"' SIGUSR2

  echo "PID: $$"
  echo "Rodar: kill -SIGUSR1 $$ (bit 0) ou kill -SIGUSR2 $$ (bit 1)"

  while true; do
      sleep 0.5 || true
  done
```

```sh
$ bash ./receiver.sh
PID: 73251
Rodar: kill -SIGUSR1 73251 (bit 0) ou kill -SIGUSR2 73251 (bit 1)

# Em outra sessão:
$ kill -SIGUSR1 73251
$ kill -SIGUSR1 73251
$ kill -SIGUSR1 73251
$ kill -SIGUSR2 73251
$ kill -SIGUSR2 73251
$ kill -SIGUSR2 73251
$ kill -SIGUSR1 73251
$ kill -SIGUSR1 73251
```
O que imprime `0001 1100`, seja lá o que isso significa :)

Agora a gente fala binário. Cada `kill` é um bit chegando no fio. Mas só bit solto não vira muita coisa. **8 bits formam um byte**, e cada byte representa um caractere [ASCII](https://www.matematica.pt/util/resumos/tabela-ascii.php). Por exemplo, a letra `A` tem código ASCII **65**, que em binário é `0100 0001`. 

Se conseguirmos receber esses 8 bits e transformar isso em caractere, conseguimos transmitir _uma string inteira_, um caractere por vez.

### Montando bytes a partir dos bits

Já sabemos que **8 bits formam 1 byte**. E que cada byte representa 1 caractere ASCII. Pra transformar a chuva de SIGUSR1 e SIGUSR2 em texto, o `receiver` precisa **acumular** os bits e, a cada 8, converter em caractere.

Vamos usar uma convenção onde o primeiro bit que chega é o de menor peso (bit 0), o segundo é o bit 1, o terceiro é o bit 2, e assim por diante até o bit 7. Ou seja, vamos utilizar LSB, ou _least significant bit_, que traduzido é "bit menos significativo".

```sh
  #!/usr/bin/env bash

  POSITION=0
  ACCUMULATOR=0

  decode_bit() {
      local bit=$1
      ACCUMULATOR=$(( ACCUMULATOR + (bit << POSITION) ))
      POSITION=$(( POSITION + 1 ))

      if [ "$POSITION" -eq 8 ]; then
          local char
          char=$(printf "\\$(printf '%03o' "$ACCUMULATOR")")
          echo "byte: $ACCUMULATOR | char: $char"
          POSITION=0
          ACCUMULATOR=0
      fi
  }

  trap 'decode_bit 0' SIGUSR1
  trap 'decode_bit 1' SIGUSR2

  echo "PID: $$"

  while true; do
      sleep 0.5 || true
  done
```

Explicando as partes que mais importam:

* `(bit << POSITION)`: _shift_ à esquerda. O bit é empurrado pra posição certa dentro do byte. Se POSITION é 6 e o bit é 1, isso vira `64` (porque `1 << 6 = 64`). Se o bit é 0, fica sempre 0.
* quando POSITION chega em 8, fechamos o byte. Convertemos pro caractere com `printf`, imprimimos e zeramos tudo pro próximo byte

Vamos ver isto funcionando na prática: A letra `A` tem código ASCII 65 como já vimos, que em binário é `0100 0001`. Mandando LSB primeiro, a sequência de bits vira `1 0 0 0 0 0 1 0`:

```sh
$ bash receiver.sh
PID: 80381

# Em outra sessão:
$ kill -SIGUSR2 80381   # 1
$ kill -SIGUSR1 80381   # 0
$ kill -SIGUSR1 80381   # 0
$ kill -SIGUSR1 80381   # 0
$ kill -SIGUSR1 80381   # 0
$ kill -SIGUSR1 80381   # 0
$ kill -SIGUSR2 80381   # 1
$ kill -SIGUSR1 80381   # 0
```
O receiver imprime: `byte: 65 | char: A`. _What a wonderful day, uh?_

Signals viraram bits. Bits viraram byte. Byte virou caractere. Agora dá pra mandar palavras inteiras, onde cada caractere é **apenas uma sequência de 8 bits**, e o `receiver` decodifica um por um conforme chegam.

> Manda mais bytes para ver outras letras: B = 66 = `0100 0010` e assim por diante. Não esquecendo de inverter a ordem dos bits, do LSB pro MSB.

_Nota: poderíamos utilizar o formato MSB (most-significant bit), para não precisarmos inverter os bits no envio, mas pra deixar o código do `receiver` mais simples e seguindo a maioria das convenções, decidi utilizar LSB mesmo_

### Enviando strings inteiras

No momento só conseguimos mandar bits "na mão", utilizando `kill -SIGUSR1` ou `kill -SIGUSR2`, um por um. Porém isso não escala. Precisamos do outro lado da história, um `sender` que recebe uma string e cuida de mandar os bits certos.

A lógica é o "espelho" do `receiver` basicamente:

* pra cada caractere da string, pega o código ASCII
* codifica para bits (8 bits), seguindo convenção LSB
* manda cada bit como SIGUSR1 (0) ou SIGUSR2 (1)

`sender.sh`

```sh
  #!/usr/bin/env bash

  # usage: ./sender.sh <pid> <string>
  PID=$1
  INPUT=$2

  send_bit() {
      if [ "$1" -eq 0 ]; then
          kill -SIGUSR1 "$PID"
      else
          kill -SIGUSR2 "$PID"
      fi
      sleep 0.5
  }

  send_byte() {
      local byte=$1
      local k
      for ((k=0; k<8; k++)); do
          send_bit $(( (byte >> k) & 1 ))
      done
  }

  for ((i=0; i<${#INPUT}; i++)); do
      char="${INPUT:$i:1}"
      code=$(printf '%d' "'$char")
      send_byte "$code"
  done
```

O core está em `send_byte`:

* `(byte >> k) & 1`: pega o k-ésimo bit do byte. Faz shift à direita por `k` posições e aplica `& 1` (máscara) para isolar o bit. Em `k=0`, pega o LSB, em `k=7`, pega o MSB.
* `sleep 0.5` entre bits: signals podem ser perdidos se chegarem rápido demais (o sistema operacional colapsa sinais idênticos pendentes, como forma de "debounce"). Esse delay dá tempo do receiver processar cada um antes do próximo chegar

Conseguimos mandar uma string inteira via signals. Cada caractere viajou como 8 bits via IPC, foi remontado byte a byte, e o receiver imprimiu conforme decodificava. Vamos provar isso na próxima seção, onde também resolvemos o fim de mensagem.

> Nossa, isso é mágica?

Não, é apenas **trap + bit shift + acumulador**.

Entretanto, temos um problema. O receiver não sabe quando a mensagem _acabou_. Ele fica esperando o próximo bit pra sempre, sem poder fazer nada com a string completa.

## Marcando o fim da mensagem

O receiver fica eternamente esperando bits. A gente precisa avisar quando a string acabou. Uma convenção clássica em comunicação binária é o famoso **byte zero** (`0x00`, conhecido como NUL). Isto marca o fim da mensagem. Strings em C usam essa ideia há décadas, então vamos roubar.

No `sender`, basta mandar 8 bits "zeros" logo depois do último caractere:

```sh
  # ...todo o loop de envio dos caracteres...

  # fim da mensagem
  send_byte 0
```

E no `receiver`, quando o byte completo for `0`, em vez de decodificar como caractere, marcamos o fim:

```sh
  if [ "$POSITION" -eq 8 ]; then
      if [ "$ACCUMULATOR" -eq 0 ]; then
          echo ""
          echo "[end of message]"
      else
          local char
          char=$(printf "\\$(printf '%03o' "$ACCUMULATOR")")
          echo -n "$char"
      fi
      POSITION=0
      ACCUMULATOR=0
  fi
```

Vamos rodar tudo:

```sh
# Receiver
$ bash receiver.sh
PID: 15300

# Sender
$ bash sender.sh 15300 ana

# Receiver
ana
[end of message]
```

_Cool, uh?_ Agora temos a base completa de transporte. Bits viram bytes, que viram caracteres, e o NUL fecha a mensagem. Tudo isso com apenas **dois sinais e um trap**.

Contudo, falta a peça principal do post: _a lógica do palíndromo_, implementada via **fila e pilha** conforme prometemos.

---

## Fila e pilha: o teorema central

Vamos esquecer signals por um momento. Esquece também **substrings, índices, two pointers**. Imagina que os caracteres da string chegam um a um, e que precisamos decidir se formam um palíndromo, _sem precisar remontar a string em memória_. É aqui que está o sumo deste artigo! Os signals foram apenas uma "armadilha" que montei pra você, caro leitor.

> Tô brincando, eu quis fazer um trocadilho com "trap". Espero que a piada tenha servido de alguma coisa

Como todo engenheiro de software, temos que fazer a pergunta certa: **que estruturas de dados, sozinhas, decidem palíndromo por construção?** Resposta: uma fila (FIFO) e uma pilha (LIFO).

> Uai, por quê?

Pensa no que cada uma faz:

* **FIFO**: preserva a ordem. Enfileirei `R, A, D, A, R`, desenfileiro `R, A, D, A, R`. Mesma ordem.
* **LIFO**: inverte a ordem. Empilhei `R, A, D, A, R`, desempilho `R, A, D, A, R`. Ordem reversa.

E palíndromo é, por definição, uma string que lida na ordem normal **e** na ordem reversa dá a mesma sequência. Que é exatamente o que acontece se a saída da fila bater com a saída da pilha.

_Supa hot fireeee_

![Meme do Supa Hot Fire reagindo com cara de incrédulo, marcando o clímax da explicação](/images/resolvendo-pal-ndromo-com-apenas-dois-unix-signals-uma-fila-e-uma-pilha-screenshot-2026-04-28-at-01-22-39.png)

Em outras palavras, uma string é palíndromo **se e somente se**, ao empilhar e enfileirar cada caractere em paralelo, todo `pop` da pilha for igual ao `dequeue` da fila. Sem comparação posicional, nem `length / 2`, nem indexação adicional. As duas estruturas _decidem por construção_. Puro suco da computação ao nosso favor.

`palindromer.sh`

```sh
  #!/usr/bin/env bash

  # usage: ./palindromer.sh <string>
  INPUT=$1

  stack=()
  queue=()

  # push and enqueue each char
  for ((i=0; i<${#INPUT}; i++)); do
      char="${INPUT:$i:1}"
      stack+=("$char")
      queue+=("$char")
  done

  # flush both and compare
  while [ "${#stack[@]}" -gt 0 ]; do
      if [ "${stack[-1]}" != "${queue[0]}" ]; then
          echo "false"
          exit 0
      fi
      unset 'stack[-1]'
      queue=("${queue[@]:1}")
  done

  echo "true"
```

* `stack+=("$char")`: append em array é o `push` da pilha
* `queue+=("$char")`: o mesmo append serve como `enqueue` da fila
* `${stack[-1]}`: pega o **topo** da pilha (último elemento, _last-in_)
* `${queue[0]}`: pega a **frente** da fila (primeiro elemento, _first-in_)
* `unset 'stack[-1]'`: remove o topo (`pop`)
* `queue=("${queue[@]:1}")`: reatribui a fila a partir do segundo elemento (`dequeue`)

Rodando tudo:

```sh
$ bash palindromer.sh ANA
true

$ bash palindromer.sh ABC
false

$ bash palindromer.sh RADAR
true
```

Temos então palíndromo com uma fila, uma pilha, e a propriedade matemática que cada uma representa. Agora nos resta plugar tudo isso no `receiver`. Cada caractere que chegar via signals vai direto pras duas estruturas, e quando o NUL chegar, drenamos e respondemos.

### Conectando tudo

A função do `palindromer.sh` recebia uma string como argumento. Aqui, a string não existe inteira em lugar nenhum. Os caracteres chegam, um a cada 8 bits, conforme o sender vai mandando. Mas a lógica é exatamente a mesma. 

Em vez de iterar sobre uma string já pronta, a gente empilha e enfileira **conforme cada caractere chega**. Incrível, não? Desta forma o `receiver` muda um pouco de lógica:

* cada vez que um byte completo é decodificado e **não é** o NUL, a gente empilha e enfileira o caractere
* quando o NUL chega, fazemos a drenagem das duas estruturas e respondemos com `true` ou `false`

```sh
  #!/usr/bin/env bash

  POSITION=0
  ACCUMULATOR=0
  stack=()
  queue=()

  drain_and_decide() {
      while [ "${#stack[@]}" -gt 0 ]; do
          if [ "${stack[-1]}" != "${queue[0]}" ]; then
              echo "false"
              stack=()
              queue=()
              return
          fi
          unset 'stack[-1]'
          queue=("${queue[@]:1}")
      done
      echo "true"
  }

  decode_bit() {
      local bit=$1
      ACCUMULATOR=$(( ACCUMULATOR + (bit << POSITION) ))
      POSITION=$(( POSITION + 1 ))

      if [ "$POSITION" -eq 8 ]; then
          if [ "$ACCUMULATOR" -eq 0 ]; then
              drain_and_decide
          else
              local char
              char=$(printf "\\$(printf '%03o' "$ACCUMULATOR")")
              stack+=("$char")
              queue+=("$char")
          fi
          POSITION=0
          ACCUMULATOR=0
      fi
  }

  trap 'decode_bit 0' SIGUSR1
  trap 'decode_bit 1' SIGUSR2

  echo "PID: $$"

  while true; do
      sleep 0.5 || true
  done
```

Diferença pro receiver da versão anterior:

* duas variáveis globais novas: `stack=()` e `queue=()`
* quando o byte completa, em vez de só imprimir o caractere, a gente manda pra stack e queue
* quando o byte é NUL, em vez de só sinalizar o fim, disparamos o `drain_and_decide` que devolve o veredito

Momento da verdade:

```sh
# Receiver
$ bash receiver.sh
PID: 33485

# Sender
$ bash sender.sh 33485 ANA
$ bash sender.sh 33485 ABC
$ bash sender.sh 33485 RADAR
$ bash sender.sh 33485 SOCORRAMMESUBINOONIBUSEMMARROCOS

# Receiver
true
false
true
true
```

_OMFG!_ Cada string é codificada via signals, e depois a lógica do palíndromo é feita **sem remontar** a string novamente!

---

## Bonus points: Handshake FTW

Até aqui o receiver imprime `true/false` no terminal dele. O sender não fica sabendo de nada. Vamos fechar este ciclo com o receiver devolvendo um signal para o sender imprimir localmente.

Convenção: **SIGUSR2 = palíndromo (true), SIGUSR1 = não é palíndromo (false)**.

O receiver precisa saber quem é o sender. Sender escreve o próprio PID em `/tmp/sender.pid` antes de mandar a string, e configura um trap para receber o veredito:

```sh
# sender.sh
echo $$ > /tmp/sender.pid

RESPONSE=""
trap 'RESPONSE=0' SIGUSR1
trap 'RESPONSE=1' SIGUSR2

# ... send the string ...

# after EOF, RESPONSE was set from verdict
[ "$RESPONSE" = "1" ] && echo "true" || echo "false"
```

Do lado do receiver, o `drain_and_decide` agora termina enviando o signal de volta:

```sh
  verdict() {
      local result=$1
      local pid
      pid=$(cat /tmp/sender.pid 2>/dev/null)

      if [ "$result" = "true" ]; then
          kill -SIGUSR2 "$pid" 2>/dev/null
      else
          kill -SIGUSR1 "$pid" 2>/dev/null
      fi
  }
```

Com isso, sender chama, recebe o veredito via signal, e imprime. Ciclo fechado.

> Mas isso tá lento demais, o `sleep 0.5` por bit dá uns 16 segundos só pra ANA. No caso do "SOCORRAMMESUBINOONIBUSEMMARROCOS", demorou bons minutos...inaceitável

Uma forma de contornar o delay é através de um mecanismo de **handshake**. O receiver responde com um **ACK** depois de cada bit, e o sender só manda o próximo quando recebeu. Como o sender só avança após o ACK, nunca há dois sinais enfileirados, portanto a coalescência é eliminada por construção. Sem fila de sinais pendentes, e sem `sleep` arbitrário.

```sh
# receiver.sh

  ack() {
      local pid
      pid=$(cat /tmp/sender.pid 2>/dev/null)
      [ -n "$pid" ] && kill -SIGUSR1 "$pid" 2>/dev/null
  }

```

E o sender:

```sh
  # sender.sh — espera o ACK no lugar do sleep
  send_bit() {
      RESPONSE=""
      if [ "$1" -eq 0 ]; then
          kill -SIGUSR1 "$RECEIVER_PID"
      else
          kill -SIGUSR2 "$RECEIVER_PID"
      fi
      while [ -z "$RESPONSE" ]; do
          sleep 0.001 || true
      done
  }
```

O **detalhe que muda tudo**: o loop ocioso do receiver também precisa ser tight. Trocamos `sleep 0.5` por `sleep 0.001` no `while true` principal. Sem isso, cada round-trip pagava parte do meio segundo.

```sh
  # receiver.sh
  while true; do
      sleep 0.001 || true
  done
```

Rodando agora:

```sh
$ time bash sender.sh 19204 ANA
true
real    0m0.164s
```

De _16 segundos para 160 milissegundos_. **100x mais rápido!!!!11**. How amazing is that?

---

## Conclusão gloriosa

A treta do palíndromo virou desculpa pra brincar com duas coisas que eu gosto: **UNIX signals** e **estruturas de dados clássicas**. O resultado é isso que acabamos de ver, dois processos conversando por sinais primitivos, e duas estruturas primitivas decidindo palíndromo por construção. Lembrando:

> Uma string é palíndromo **se e somente se** LIFO == FIFO

Esse é o teorema, o resto é adorno. Eu sei que Bash não foi feito pra isso, mas Bash também não foi feito pra rodar a [Rinha de Backend](https://github.com/leandronsp/rinha-backend-bash/) e aqui a gente está, de novo. 

Se gostou dessa aventura, recomendo ler [o pai dela](https://leandronsp.com/articles/you-dont-need-kafka-building-a-message-queue-with-only-two-unix-signals), "You don't need Kafka".

Stay tuned, e bebam água.

---

## Disclosure

Este artigo foi escrito usando uma ferramenta TUI que criei em Rust chamada [leandronsp/devTUI](https://github.com/leandronsp/devtui), com o apoio do Claude Opus 4.7 no refinamento, correção ortográfica e contexto.

_Toda a identidade do artigo é 100% minha, eu não coloco IA pra escrever por mim. LLM serve apenas como um par que navega e dá feedback em tempo real, feature também incluída no DevTUI_.

![Print do DevTUI no Tmux com o Claude Code ao lado](/images/resolvendo-pal-ndromo-com-apenas-dois-unix-signals-uma-fila-e-uma-pilha-screenshot-2026-04-28-at-02-57-58.png)

