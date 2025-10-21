---
title: "Entendendo fundamentos de recursão"
slug: "entendendo-fundamentos-de-recursao-2ap4"
published_at: "2023-06-23 23:26:29Z"
language: "pt-BR"
status: "published"
tags: ["programming", "ruby", "braziliandevs"]
---

Se pra você:

* **Recursão** é um tema obscuro ou quer entender mais um pouco sobre;
* **Tail call e TCO** são meios de comunicação alienígena e;
* **Trampoline** é nome de remédio

_Então este artigo é pra você._

Aqui, vou explicar o que são estes termos de forma didática e os problemas que resolvem, com exemplos em **Ruby**. Mas não se preocupe pois os exemplos são bem simples de entender, mesmo porque os conceitos aqui mostrados são _agnósticos a linguagem_.

Portanto, venha comigo nesta viagem **interminável**.

> ✋
Para continuar, volte ao topo do post

---

## Agenda

* [O que é recursão](#o-que-é-recursão)
* [Fibo para os íntimos](#fibo-para-os-íntimos)
* [Tail call](#tail-call)
* [Stack e stack overflow](#stack-e-stack-overflow)
* [Tail call optimization](#tail-call-optimization)
* [Trampoline](#trampoline)
* [Conclusão](#conclusão)
* [Referências](#referências)

---

## O que é recursão

Em programas de computador, somos habituados a **quebrar problemas grandes em problemas menores** por meio do uso de funções ou métodos.

**Recursão** é, de forma extremamente simplificada, uma técnica na computação onde estes problemas são quebrados de forma que uma _determinada função é executada recursivamente_. 

Com isto, a função "chama a si mesma" para resolver alguma computação e continuar sua execução.

---

## Fibo para os íntimos

Um exemplo bastante clássico de recursão é descobrir, dada a **sequência de Fibonacci**, ou Fibo, qual número se encontra em determinada posição.

```
0, 1, 1, 2, 3, 5, 8, 13, 21, 34, 55.........
```
Com isto, a função **fib** traria resultados como:
```
fib(0) = 0
fib(1) = 1
fib(2) = 1
...
fib(7) = 13
fib(10) = 55
```
Temos então uma possível implementação recursiva em Ruby:

```ruby
def fib(position)
  return position if position < 2

  fib(position - 1) + fib(position - 2)
end
```

Este código, entretanto, não é performático. Ao tentar buscar o número da posição 10000 (dez mil) na sequência, o programa fica muito lento pois faz inúmeras chamadas **recursivas redundantes**.

```
                 fib(10)
             /                \
     fib(9)                 fib(8)
        /          \          /   \
fib(8)     fib(7)     fib(7)    fib(6)
  /      \       /       \       /   \
fib(7) fib(6) fib(6) fib(5) fib(6) fib(5)
   /    \     /     \     /     \     /    \
fib(6) fib(5) fib(5) fib(4) fib(5) fib(4) fib(5) fib(4)
  /   \   /   \   /   \   /   \   /   \   /   \   /   \
...
```

Consequentemente, quanto maior o input da função, o tempo de execução deste código tende a crescer de forma exponencial, que em notação **Big-O** seria `O(2^n)`.


![big O exponencial](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/n9udpxmgl34093mpmqvc.png)

É possível reduzir esta complexidade? 

E se tentarmos aplicar uma técnica onde a última chamada da função, ao invés de ser a soma de duas chamadas recursivas, passa a ser apenas **uma chamada recursiva**, sem realizar computações adicionais?

Esta técnica existe e é chamada de **tail call**, ou _tail recursion_.

---

## Tail call
**Tail call**, ou **TC**, consiste em uma função recursiva onde a última chamada recursiva é a própria função sem computação adicional.

Com isto, reduzimos a complexidade de exponencial para linear, como se fosse um simples loop iterando em uma lista de inputs. 

Em notação Big-O isto fica `O(n)`, ou seja, a complexidade cresce de forma linear acompanhando o crescimento do input.

![big O linear](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/z8uj2fzw9090971awu89.png)

Exemplo em Ruby:
```ruby
def fib(position, _current = 0, _next = 1)
  return _current if position < 1

  fib(position - 1, _next, _current + _next)
end
```

Portanto, o número de chamadas recursivas é reduzido drasticamente para algo do tipo:
```
fib(10, 0, 1)
fib(9, 1, 1)
fib(8, 1, 2)
fib(7, 2, 3)
fib(6, 3, 5)
fib(5, 5, 8)
fib(4, 8, 13)
fib(3, 13, 21)
fib(2, 21, 34)
fib(1, 34, 55)
fib(0, 55, 89)
```

Repara como que o número de chamadas recursivas diminuiu, ou seja, o código está seguindo um caminho mais **linear** com esta abordagem.

Assim, ao rodar o programa **fib com TC**, o tempo de execução é exponencialmente menor do que rodar sem TC, ficando _dezenas de milhares de vezes mais rápido_.

> ✋
Claramente um programa que leva tempo exponencial é péssimo em termos de performance, não?

```ruby
# Sem TC
fib(30) # 0.75 segundos

# Com TC
fib(30) # 0.000075 segundos
```

Voltando ao exemplo de `fib(10000)`, ao rodar com TC, vemos que a execução é muito mais rápida, porém:

```
recursion/fib.rb:10:in `fib_tc': stack level too deep (SystemStackError)
        from recursion/fib.rb:10:in `fib_tc'
        from recursion/fib.rb:10:in `fib_tc'
        from recursion/fib.rb:10:in `fib_tc'
        from recursion/fib.rb:10:in `fib_tc'
        from recursion/fib.rb:10:in `fib_tc'
        from recursion/fib.rb:10:in `fib_tc'
        from recursion/fib.rb:10:in `fib_tc'
        from recursion/fib.rb:10:in `fib_tc'
```
_Uh oh_, um **stack overflow!**

Para entender o que está acontecendo, vamos primeiro entender o que raios é uma **stack** e **stack overflow**.

---

## Stack e stack overflow

Quando um programa é executado, é alocada na memória uma estrutura de dados em formato de _pilha_, chamada **Stack**, que é utilizada para guardar os dados que estão sendo utilizados em uma função em execução.

> ✋
Há também outra estrutura na memória do programa chamada **Heap**, que não é uma pilha e tem outras características que vão além do escopo deste artigo. Para entender recursão, focamos apenas na stack

Quando o programa entra em uma função ou método, cada dado é _inserido (push) na stack_. Ao terminar a função, é feita a _remoção (pop) de cada dado_.

![stack](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/rstqf6yz2yph2d7byeuq.png)

A cada chamada de função, é atribuído um novo _stack frame_. Como uma chamada recursiva nunca termina, o runtime não sabe que é preciso fazer "pop" dos dados e finalizar o frame, então a cada chamada, uma nova stack frame é criada e **mais elementos são adicionados** à stack.

Adivinha o que acontece quando adicionamos muitos dados na stack a ponto de **ultrapassar seu limite** na memória do computador?

Sim, acontece o famigerado **Stack overflow** 💥🪲, e isto explica aquele erro no Ruby ao rodar fib de 10000 com tail call.

> ✋
Então quer dizer que calcular o fib de 10000 é um problema impossível de resolver com recursividade?

Calma, algumas linguagens empregam uma técnica de otimização que consiste em utilizar a chamada TC com _apenas um stack frame_, garantindo assim que cada chamada recursiva seja tratada como se fosse **uma iteração num loop primitivo.**

Com isto, é feita a manipulação dos argumentos e dados da função em uma única stack frame, exatamente como se tivéssemos escrito um loop primitivo. E consequentemente, novas chamadas recursivas de cauda não vão provocar estouro na pilha.

A esta técnica chamamos de **Tail call optimization**, ou _TCO_.

---

## Tail call optimization

Devido a sua natureza imperativa, e assim como diversas outras linguagens de propósito geral, _Ruby não traz suporte nativo a TCO_. 

Geralmente esta funcionalidade é mais encontrada em linguagens com forte inclinação ao paradigma funcional, e não ao imperativo.

Mas em Ruby é possível _habilitar o modo TCO_ com uma simples configuração na instrução do runtime do Ruby (YARV), e assim conseguimos executar fib de 10000 sem dor.

```ruby
RubyVM::InstructionSequence.compile_option = {
  tailcall_optimization: true,
  trace_instruction: false
}

def fib(position, _current = 0, _next = 1)
  return _current if position < 1

  fib(position - 1, _next, _current + _next)
end

# TC com TCO
fib(10000) # 0.02 segundos
```
**Superb**! Com TCO habilitado, uma fib 10000 com tail call é executada em _0.02 segundos_!

_Vale lembrar que TCO é uma técnica utilizada não apenas em recursão mas também em otimização de geração de instruções em compiladores,
mas isto foge ao escopo deste artigo._

> ✋
Okay, mas e quando não for possível habilitar TCO para recursão de cauda ou eu estiver programando em uma linguagem que não tenha suporte a TCO?

**Trampoline** para o resgate.

---

## Trampoline

Para entendermos _trampoline_, vamos pensar no problema e em uma possível solução.

Se pensarmos com inteligência, podemos inicialmente concluir que a recursão deve ser evitada, e esta é a _premissa número um_.

```ruby
def fib(position, _current = 0, _next = 1)
  return _current if position < 1

  ###################################
  #### Devemos evitar isso!!!!!! ####
  ###################################
  fib(position - 1, _next, _current + _next)
end
```

Premissa dois, ao invés de retornar uma chamada recursiva diretamente, e se a retornarmos **encapsulada em uma estrutura de função anônima que guarda contexto** para ser executada em outro contexto? 

> Sim, tipo uma closure ou lambda para os mais atentos

Em Ruby, podemos utilizar o conceito de **lambdas**.

```ruby
def fib(position, _current = 0, _next = 1)
  return _current if position < 1
  
  lambda do
    fib(position - 1, _next, _current + _next)
  end
end
```

Se chamarmos `result = fib(0)`, por causa da primeira linha de short-circuit (`position < 1`), o retorno do método é `0`.

Mas se chamarmos `result = fib(10)`, o retorno não será uma chamada recursiva, mas sim o **retorno será uma função anônima** (lambda). 

Com isto, o método é então finalizado e a _stack é limpa_, ou seja, é feito o **pop dos dados** de dentro do método.

Como lambdas guardam contexto, se chamarmos `result.call`, a lambda é executada com o contexto anterior, que pode retornar o número final (caso entre no short-circuit) ou outra lambda com o novo contexto.

E assim, **ficamos em loop até termos o valor final**, enquanto o retorno atual continuar sendo uma lambda. Conseguiu entender o que podemos fazer? 

Sim, um _loop!_

```ruby
result = fib(10000)

while result.is_a?(Proc)
  result = result.call
end

puts result
```
Output (um número mesmo muito grande):

```
33644764876431783266621612005107543310302148460680063906564769974680081442166662368155595513633734025582065332680836159373734790483865268263040892463056431887354544369559827491606602099884183933864652731300088830269235673613135117579297437854413752130520504347701602264758318906527890855154366159582987279682987510631200575428783453215515103870818298969791613127856265033195487140214287532698187962046936097879900350962302291026368131493195275630227837628441540360584402572114334961180023091208287046088923962328835461505776583271252546093591128203925285393434620904245248929403901706233888991085841065183173360437470737908552631764325733993712871937587746897479926305837065742830161637408969178426378624212835258112820516370298089332099905707920064367426202389783111470054074998459250360633560933883831923386783056136435351892133279732908133732642652633989763922723407882928177953580570993691049175470808931841056146322338217465637321248226383092103297701648054726243842374862411453093812206564914032751086643394517512161526545361333111314042436854805106765843493523836959653428071768775328348234345557366719731392746273629108210679280784718035329131176778924659089938635459327894523777674406192240337638674004021330343297496902028328145933418826817683893072003634795623117103101291953169794607632737589253530772552375943788434504067715555779056450443016640119462580972216729758615026968443146952034614932291105970676243268515992834709891284706740862008587135016260312071903172086094081298321581077282076353186624611278245537208532365305775956430072517744315051539600905168603220349163222640885248852433158051534849622434848299380905070483482449327453732624567755879089187190803662058009594743150052402532709746995318770724376825907419939632265984147498193609285223945039707165443156421328157688908058783183404917434556270520223564846495196112460268313970975069382648706613264507665074611512677522748621598642530711298441182622661057163515069260029861704945425047491378115154139941550671256271197133252763631939606902895650288268608362241082050562430701794976171121233066073310059947366875
```

🔑 **Ponto-chave**
E com isto, amigues, temos a técnica **trampoline**: um **loop** primitivo não-recursivo que fica chamando outra função _escrita de forma recursiva_ mas que retorna uma lambda com contexto, **até chegar ao valor final**.

Este código, **sem TCO**, para o **fib de 10000**, leva 0.04 segundos, um resultado muito próximo a TCO e sem causar stack overflow.

_Incrível, não?_ Agora não há desculpas para não escrever uma função de modo recursivo em linguagens que não trazem suporte a TCO 😛

---

## Conclusão

Neste artigo, o intuito foi trazer alguns conceitos que tocam no tema **recursão**. Estes conceitos fazem overlap com temas muito acadêmicos que, por vezes, dificultam o entendimento de pessoas que estão iniciando na área ou que não têm um background muito acadêmico.

Espero ter esclarecido de forma didática o assunto recursão, se puder deixe nos comentários qualquer correção ou informação relevante.

---

## Referências

https://twitter.com/leandronsp/status/1672043065001869312
https://twitter.com/JeffQuesado/status/1671954585987022882
https://en.wikipedia.org/wiki/Fibonacci_sequence
https://en.wikipedia.org/wiki/Recursion
https://www.geeksforgeeks.org/stack-data-structure/
https://en.wikipedia.org/wiki/Tail_call
https://en.wikipedia.org/wiki/Trampoline_(computing)
https://nithinbekal.com/posts/ruby-tco/
https://www.bigocheatsheet.com/
https://ruby-doc.org/core-3.1.0/RubyVM/InstructionSequence.html#method-c-compile_option
