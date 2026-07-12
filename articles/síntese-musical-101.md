---
title: "Síntese musical 101: do zero à nota Lá"
status: published
language: "pt-BR"
published_at: "2026-07-11 20:58:04"

---

Já faz um tempo que venho estudando sobre síntese musical e buscando entender melhor sobre os fundamentos por trás do som. Resolvi então condensar o conteúdo e escrever um artigo (e por que não uma sequência de artigos) sobre este tema. 

## Agenda

* [First things first: o que é som?](#first-things-first-o-que-é-som)
* [Som digital e transdução](#som-digital-e-transdução)
* [PCM: como um programa gera som](#pcm-como-um-programa-gera-som)
* [Gerando som com Ruby: nosso primeiro oscilador](#gerando-som-com-ruby-nosso-primeiro-oscilador)
  * [Trigonometria, função seno e a matemática por trás do som](#trigonometria-função-seno-e-a-matemática-por-trás-do-som)
  * [Onda senoidal](#onda-senoidal)
  * [Taxa de amostragem e frequência](#taxa-de-amostragem-e-frequência)
  * [Ouvindo a nota Lá 440Hz](#ouvindo-a-nota-lá-440hz)
  * [O problema com poucas fotos por ciclo](#o-problema-com-poucas-fotos-por-ciclo)
  * [Teorema de Nyquist e padrão CD](#teorema-de-nyquist-e-padrão-cd)
* [Curiosidade sobre frequências](#curiosidade-sobre-frequências)
* [Conclusão](#conclusão)
* [Referências](#referências)

## First things first: o que é som?

Som é uma onda de pressão no ar. O alto-falante vibra pra frente e pra trás, empurrando e puxando as moléculas de ar, criando uma _perturbação_. Esta perturbação tem o formato de uma **onda mecânica** e viaja pelo espaço. Quando chega no tímpano, ele vibra junto, então o cérebro **interpreta a vibração** como som.

Podemos definir qualquer som através de 3 propriedades fundamentais:

**Frequência (Hz)**

Quantas vezes a onda _oscila por segundo_. Frequência alta, som agudo. Frequência baixa, som grave. A nota _Lá_ da orquestra vibra 440 vezes por segundo.

**Amplitude**

O _tamanho_ da oscilação. Quanto mais o alto-falante se desloca, mais ar ele move, portanto mais alto é o som.

**Timbre**

O formato da onda. Um Lá 440 tocado no piano não é igual ao Lá 440 na flauta. A frequência é a mesma, mas o desenho da onda é diferente. Isso é o *timbre*.

![Onda sonora](/images/s-ntese-musical-101-jumping-jax-tfwqjowep8-unsplash.jpg)

## Som digital e transdução

Quando falamos de som digital no contexto de um eletrônico como computador ou celular, como podemos "gerar" som a partir do nada? Sabendo que som é uma _onda de energia mecânica_, temos que de alguma forma criar esta onda **a partir de sinais elétricos**, que é o que um computador entende.

A esta conversão de elétrico para mecânico (ou vice-versa) chamamos de **transdução**, que é a conversão de energia de um domínio para outro.

No nosso caso, temos dois dispositivos no computador que fazem esse papel:

- **Microfone**, que é a entrada de som. Converte sinal mecânico em elétrico, podendo viajar pelo computador e pela rede
- **Alto-falante**, que é a saída de som. Converte sinal elétrico em mecânico, que faz as membranas vibrarem, gerando a onda mecânica que propaga pelo ar

Uma vez que entendemos estes princípios, não fica difícil perceber que, para gerar som no computador _a partir do nada_, precisamos controlar via programa de computador os sinais que chegam no alto-falante. Ou seja, é necessário haver algum tipo de _ponte_ entre o código e o dispositivo.

Esta "ponte" se chama _Pulse Code Modulation_, ou **PCM**.

## PCM: como um programa gera som

O computador não envia "som" pro alto-falante. Ele envia uma sequência de números. Cada número representa a posição da membrana do alto-falante _num determinado instante no tempo_. Isto se chama **PCM**, ou _pulse code modulation_.

Funciona assim: numa amostragem de milhares de vezes por segundo (já vamos entender por que "milhares"), o computador manda um número pro driver de áudio. Esse número geralmente é um inteiro de 16 bits com sinal (signed int), variando de -32.768 a 32.767. 

Zero é a membrana _em repouso_, ou seja, sem emitir som. 32.767 é a membrana totalmente empurrada pra frente, e -32.768 é totalmente puxada pra trás. O driver _converte esses números em voltagem_, então o alto-falante _converte voltagem em movimento_.

O ar vibra. Fim.

Esse fluxo de números é o que chamamos de **áudio digital**. E a beleza disso é que qualquer programa que escreva a sequência certa de números no formato certo está, essencialmente, gerando som.

Ferramentas como o **SoX** (`play` no macOS, Linux etc) servem de ponte. Lê PCM cru do _STDIN_ e joga pro driver de áudio. Nosso trabalho é só produzir os números certos, e o resto é física fazendo o seu trabalho.

![áudio digital](/images/s-ntese-musical-101-screenshot-2026-06-21-at-23-51-28.png)

Deixei a onda sonora representada em um plano cartesiano (eixo x e y) propositalmente. Em breve vamos entender toda a matemática por trás disso. Mas antes, vamos ver com código Ruby como gerar som.

## Gerando som com Ruby: nosso primeiro oscilador

Para este artigo, vou escolher Ruby por ser uma linguagem com sintaxe simples, elegante e didática para explicar diversos conceitos. Lembra que eu disse no início que som é uma perturbação no ar? É esta perturbação que precisa ser gerada, portanto nosso código deve fazer o papel de um _oscilador_, que faz o alto-falante "oscilar" e consequentemente gerar a perturbação (som).

### Trigonometria, função seno e a matemática por trás do som

O que eu acho mais interessante na síntese musical é poder aprofundar em conceitos de física e matemática. Meu intuito aqui não é tornar as coisas difíceis, muito pelo contrário, quero tornar simples essa compreensão da matemática de modo que possamos ver _beleza_ nisso tudo, talvez ajudando a encontrar algum sentido nas aulas do colégio.

Qual problema queremos resolver ao gerar um som? A ideia é representar um movimento de _vai-e-vem_, suave. Algo que começa em repouso (x=0, y=0), sobe, desce, _cruza o zero de novo_, vai pro negativo, volta, repete. Isso é **vibração**.

Na matemática, isso aparece em **movimento circular**. Imagina um ponto girando numa circunferência a velocidade constante. Se você olhar só a altura desse ponto (eixo y) enquanto ele gira, ela sobe, desce, cruza o centro, repete. Exatamente o vai-e-vem que queremos.

![movimento circular](/images/s-ntese-musical-101-screenshot-2026-06-22-at-00-23-57.png)

A _altura do ponto em função de quão longe ele girou_ é a **função seno**. O "ângulo" é apenas uma medida de quão longe o ponto andou no círculo (a trigonometria estuda isso), onde:

- 0° = partida
- 90° = topo
- 180° = lado oposto
- 270° = base
- 360° = volta ao início

![circunferencia](/images/s-ntese-musical-101-screenshot-2026-06-22-at-00-29-09.png)

Logo, **sin(ø)** nos dá o _deslocamento vertical_ de um ponto que gira. Se eu quero que o alto-falante vibre, é exatamente esse valor que eu mando pra membrana, o resultado da função seno. A membrana sobe e desce igual a altura do ponto no círculo.

```ruby
# ruby oscillator.rb
# x = tempo (índice da amostra)
# y = amplitude (deslocamento da membrana, entre -1 e 1)

x = 0
y = Math.sin(x)

puts "x=#{x}  ->  y=#{y}"
```
Este código bem naive resulta em `x=0 -> y=0.0`. Ou seja, representa o alto-falante em _repouso_:

```
(x=0, y=0)

        y (amplitude)
        ^
        |
     +1 |
        |
        |
        |
      0 |*
        |
        |
        |
     -1 |
        |
        +------------------> x (tempo)
```

O argumento de `sin(x)` é em _radianos_, que é como medimos distância no círculo. Meia-volta no círculo é representada por π (pi). Logo, uma volta completa é o dobro disso, 2π. Um quarto, π/2. 

Ruby tem `Math::PI` para isso. Conforme `x` avança de 0 a 2π, o seno completa um ciclo inteiro de vai-e-vem. É esse ciclo que empurra a membrana do alto-falante.

* `x=0` -> altura 0, que significa 0° na circunferência
* `x=π/2` -> altura 1 (topo), que significa 90°
* `x=π` -> altura 0 de novo (meio), 180°
* `x=3π/2` -> altura -1 (base), 270°
* `x=2π` -> altura 0 (volta completa), 360°

> _OMG!_ Agora sim tudo faz sentido!!111

Agora voltando ao código, o que acontece se `x=π/2`?

```ruby
x = Math::PI / 2
y = Math.sin(x)

puts "x=#{x}  ->  y=#{y}"
```

```
x=1.5707963267948966  ->  y=1.0

   (x=π/2, y=1.0)

           y (amplitude)
           ^
           |
        +1 |     *
           |
           |
           |
         0 |.....
           |
           |
           |
        -1 |
           |
           +------------------> x (tempo)
                    π/2
```

O ponto `*` subiu pro topo. O ponto no círculo andou 90° e a altura da membrana vai junto. E se `x=π`?

```ruby
x = Math::PI
y = Math.sin(x).round(10)

puts "x=#{x}  ->  y=#{y}"

# x=3.141592653589793  ->  y=0.0

   (x=π, y≈0.0)

           y (amplitude)
           ^
           |
        +1 |
           |
           |
           |
         0 |.....*
           |
           |
           |
        -1 |
           |
           +------------------> x (tempo)
                    π
```

Se formos executar um ponto de cada vez dessas amostras, podemos representar o som da seguinte forma no gráfico:

```
# x = 0                    -> sin(x) = 0  -> meio
# x = Math::PI / 2         -> sin(x) = 1  -> topo
# x = Math::PI             -> sin(x) = 0  -> meio
# x = 3 * (Math::PI / 2)   -> sin(x) = -1 -> base
# x = 2 * Math::PI         -> sin(x) = 0  -> meio

           y (amplitude)
           ^
           |
        +1 |     *
           |
           |
           |
         0 |*.............*.................*..........
           |
           |
           |
        -1 |                      * 
           |
           +--+---+-------+-------+---------+------> x (tempo)
              0    π/2    π      3π/2       2π
```

Repare como que os pontos conectados formam uma **onda**. Mas estamos utilizando valores absolutos. Precisamos de uma amostragem muito maior para de fato desenhar uma onda pura, e é aqui que entramos no conceito de **onda senoidal**.

### Onda senoidal

Uma **onda senoidal** é uma onda pura, a curva matemática que acabamos de ver, que descreve uma _oscilação repetitiva e suave_. Suave porque neste exemplo não há discrepâncias entre os pontos, pelo que são representados por algum valor entre -1 e 1.

Para uma melhor representação da onda, precisamos de mais _amostras_, e não apenas aquelas 5 absolutas que executamos. A seguir temos uma onda que representa 10 amostras no tempo:

```ruby
# x = tempo (índice da amostra)
# y = amplitude (deslocamento da membrana, entre -1 e 1)

samples = 10

samples.times.each do |i|
  x = i
  y = Math.sin(x)
  puts "x=#{x}  ->  y=#{y.round(2)}"
end
```

```
x=0  ->  y=0.0
x=1  ->  y=0.84
x=2  ->  y=0.91
x=3  ->  y=0.14
x=4  ->  y=-0.76
x=5  ->  y=-0.96
x=6  ->  y=-0.28
x=7  ->  y=0.66
x=8  ->  y=0.99
x=9  ->  y=0.41

           y (amplitude)
           ^
           |
        +1 |          *  *                    *
           |       *        *              *    *
           |     *            *          *        *
           |
         0 |*                                        *---*
           |                  *      *
           |                    *  *
           |
        -1 |                      *
           |
           +--+--+--+--+--+--+--+--+--+--+--> x (tempo)
              0  1  2  3  4  5  6  7  8  9
```

Cada amostra é uma "foto" da onda no tempo, como já vimos na seção anterior. Só que desta vez, percorremos _N vezes_ onde para cada _N_ calculamos o `sin(N)`. Simples assim.

Essas 10 amostras desenham uma onda bonita. Mas quanto tempo elas duram? Qual a _nota_ que elas tocam? Sem responder "quantas amostras por segundo", a gente não tem som, só tem desenho.

### Taxa de amostragem e frequência

Até agora usamos `sin(i)`, onde `i` avança de 1 em 1. Uma volta completa leva ~6.28 amostras (2π). Funcionou para desenhar a onda no papel, mas e pro som?

Com _taxa de amostragem_, ou **sample rate**, temos um relógio: _N amostras por segundo_. Agora cada `i` não é mais um passo qualquer, é um passo de **1/N** de segundo. Aquelas 10 amostras da seção anterior, tocadas a 10 amostras por segundo, durariam 1 segundo. As mesmas 10 amostras, tocadas a 8000 por segundo, passariam em pouco mais de 1 milissegundo, um estalo. 

Os números são os mesmos, o que muda é o relógio. A taxa de amostragem é o que _transforma desenho em som_.

E a nota? Se eu quero um Lá 440Hz, preciso que a onda **complete 440 ciclos por segundo**. Lembra que um ciclo são 2π radianos? Por segundo, o argumento do seno precisa avançar `440 * 2π` radianos. E como tenho `N` amostras por segundo, cada amostra avança `(440 * 2π) / N`. Com isto, a fórmula passa a ser:

```
sin(2π x freq x i / sample_rate)
```

> Okay Leandro, mas qual o número certo de amostras por segundo?

Depende do que queremos representar, e a resposta completa passa pelo _limite do ouvido humano_, que vamos ver mais adiante. Por enquanto, vamos de um número modesto: 8000 amostras por segundo, o mesmo da telefonia antiga. Se dava pro telefone carregar uma voz, dá pra carregar uma nota Lá:

```ruby
# oscilador com sample rate
# x = tempo (índice da amostra)
# y = amplitude (deslocamento da membrana, entre -1 e 1)

SAMPLE_RATE = 8_000   # amostras por segundo
DURATION    = 1       # segundos
FREQUENCY   = 440     # Hz (Lá)

samples = (SAMPLE_RATE * DURATION).to_i

samples.times do |i|
  x = 2 * Math::PI * FREQUENCY * i / SAMPLE_RATE
  y = Math.sin(x)

  puts "x=#{x.round(4)}  ->  y=#{y.round(4)}"
end
```

Um ciclo de 440Hz a 8000 samples/s dá ~18 amostras por ciclo. Mostrando as primeiras 20:

```
   x=0.0     ->  y=0.0
   x=0.3456  ->  y=0.3387
   x=0.6912  ->  y=0.6374
   x=1.0367  ->  y=0.8607
   x=1.3823  ->  y=0.9823
   x=1.7279  ->  y=0.9877
   x=2.0735  ->  y=0.8763
   x=2.419   ->  y=0.6613
   x=2.7646  ->  y=0.3681
   x=3.1102  ->  y=0.0314
   x=3.4558  ->  y=-0.309
   x=3.8013  ->  y=-0.6129
   x=4.1469  ->  y=-0.8443
   x=4.4925  ->  y=-0.9759
   x=4.8381  ->  y=-0.9921
   x=5.1836  ->  y=-0.891
   x=5.5292  ->  y=-0.6845
   x=5.8748  ->  y=-0.3971
   x=6.2204  ->  y=-0.0628
   x=6.5659  ->  y=0.279
```

```
           y (amplitude)
           ^
           |
        +1 |        * **
           |      *      *
           |     *        *
           |    *          *
         0 |*--*------------*------*---
           |                  *  *
           |                   **
           |
        -1 |                    *
           |
           +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+--> x (tempo)
             0 1 2 3 4 5 6 7 8 9 ...    19
                                 (amostras)
```

Vamos tentar ouvir esta onda?

### Ouvindo a nota Lá 440Hz

```ruby
# oscilador que toca, gera PCM cru e cospe no stdout
# x = tempo (índice da amostra)
# y = amplitude (deslocamento da membrana, entre -1 e 1)

SAMPLE_RATE = 8_000  # amostras por segundo (telefone antigo)
DURATION    = 1       # segundos
FREQUENCY   = 440     # Hz (Lá)

samples = (SAMPLE_RATE * DURATION).to_i

$stdout.binmode

samples.times do |i|
  x = 2 * Math::PI * FREQUENCY * i / SAMPLE_RATE
  y = Math.sin(x)

  $stdout.write([y.round].pack("s<"))
end
```

Pra ouvir:

```bash
ruby osc.rb | play -q -t raw -r 8000 -e signed -b 16 -c 1 -
```

Não dá pra ouvir nada ainda, pelo menos não para os ouvidos humanos. O motivo está no `y.round`: _sin(x)_ devolve valores entre -1 e 1, que arredondados viram 0, 1 ou -1. Numa escala que vai de -32.768 a 32.767, é uma membrana praticamente parada, se deslocando 0,003% do curso. Tem som ali, **mas baixo demais**.

Lembra da **amplitude**, lá do começo do artigo? O tamanho da oscilação, que define o volume. É exatamente ela que está faltando aqui. Basta multiplicar o seno por um fator: `sin(x) * 32_767` empurra a membrana no curso inteiro, volume máximo. Não vamos abusar dos nossos ouvidos pra já, então um número modesto como 2000 é razoável:

```ruby
# oscilador que toca, gera PCM cru e cospe no stdout
# x = tempo (índice da amostra)
# y = amplitude (deslocamento da membrana, entre -1 e 1)

SAMPLE_RATE = 8_000   # amostras por segundo
DURATION    = 1       # segundos
FREQUENCY   = 440     # Hz (Lá)
AMPLITUDE = 2_000

samples = (SAMPLE_RATE * DURATION).to_i

$stdout.binmode

samples.times do |i|
  x = 2 * Math::PI * FREQUENCY * i / SAMPLE_RATE
  y = Math.sin(x) * AMPLITUDE  # escala pra range audível

  $stdout.write([y.round].pack("s<"))
end
```

> Se o volume tiver muito baixo, experimenta aumentar o volume do teu alto-falante, ou então aumentar a amplitude no script. Mas vai aos poucos, pra não judiar do ouvido...

![La 440Hz](/images/s-ntese-musical-101-s-ntese-musical-101-onda-440hz.gif)

### O problema com poucas fotos por ciclo

Antes de seguir, brinca um pouco com o script, a constante `FREQUENCY` está aí pra isso. Um detalhe musical que ajuda na brincadeira: dobrar a frequência sobe a nota em exatamente uma oitava. Então 880 é o mesmo Lá, uma oitava acima. Troca pra 880, e você vai escutar um Lá mais agudo, como esperado.

Vai dobrando pra 1760, depois 3520, que deve ser ainda mais agudo, e a lógica segue de pé. Agora dobra mais uma vez, pra 7040, que deveria ser o apito mais insuportável de todos neste exemplo.

> Mas o som desceu. Em vez do Lá agudíssimo, saiu uma nota mais grave que algumas anteriores.

Pedimos 7040 oscilações por segundo e o alto-falante _entregou menos de mil_. Alguma coisa quebrou no caminho.

O sample rate é um orçamento fixo: 8000 fotos por segundo, não importa a frequência. Quanto mais agudo o som, _mais ciclos disputam essas fotos_, e cada ciclo fica com menos:

- 440Hz -> ~18 fotos por ciclo
- 880Hz -> ~9
- 1760Hz -> ~4.5
- 3520Hz -> ~2.3
- 7040Hz -> ~1.1

Uma foto por ciclo. Entre uma "foto" e outra, a onda dá quase uma volta completa no círculo. 

> Em meio a algumas pesquisas que fiz, descobri que em filmes antigos no cinema havia um efeito parecido. A roda de uma carroça parecia girar devagar, ou até mesmo pra trás, porque entre um frame e outro do filme ela deu quase uma volta inteira.

No caso do filme, a câmera não tem como saber, ela só registra a diferença. Com a nossa onda é igual, pedimos 7040 voltas por segundo, mas as 8000 fotos só registram a diferença, onde `8000 - 7040 = 960` oscilações por segundo.

Esse disfarce tem nome, e se chama **aliasing**. Entramos, então, no **teorema de Nyquist**.

### Teorema de Nyquist e padrão CD

Para registrar um ciclo de verdade, precisamos de no _mínimo duas fotos_, uma pegando a subida da onda e outra a descida. Disso é que sai o **teorema de Nyquist**, que determina:

> A taxa de amostragem precisa ser maior que o **dobro da frequência mais alta** que queremos reproduzir

Com 8000 amostras por segundo, o teto é de 4000Hz. A 3520 passamos raspando, e a 7040 nem chegamos perto. De quebra, isso explica o "telefone antigo" dos comentários: a voz humana vive abaixo de ~3400Hz, então 8000 amostras dão conta de uma ligação.

> Por essa você não esperava, fala aí!?

E finalmente dá pra responder o porquê dos "milhares" lá da seção de PCM. O ouvido humano escuta até por volta de 20.000Hz. Pelo teorema, reproduzir tudo que um humano ouve exige mais de 40.000 amostras por segundo. O padrão da indústria de CD (Compact Disc) usa 44100, os 40 mil com alguma folga.

Com isto, podemos adaptar o script anterior para usar o padrão CD, e assim conseguimos ouvir frequências maiores. **Mas cuidado**, frequências muito altas podem ser bastante incômodas podendo causar enjoo, náuseas e dores de cabeça. Muita cautela ao brincar com frequência de som. _Been there, done that_.

```ruby
SAMPLE_RATE = 44_100   # amostras por segundo (padrão CD)
DURATION    = 1        # segundos
FREQUENCY   = 7040     # Hz
AMPLITUDE = 2_000

samples = (SAMPLE_RATE * DURATION).to_i

$stdout.binmode

samples.times do |i|
  x = 2 * Math::PI * FREQUENCY * i / SAMPLE_RATE
  y = Math.sin(x) * AMPLITUDE  # escala pra range audível

  $stdout.write([y.round].pack("s<"))
end

# Pra ouvir:
# ruby osc.rb | play -q -t raw -r 44100 -e signed -b 16 -c 1 -
```

Agora, a 7040Hz vai tocar um apito insuportável. Só tente se tiver coragem e quiser lidar com as consequências. Pior ainda se aumentar pra 14080Hz e assim por diante (lembrando do limite que o ser humano ouve de ~20.000Hz)

---

## Curiosidade sobre frequências

As frequências podem ser percebidas de formas diferentes na natureza, e as faixas podem variar por indivíduo.

**Humanos**: ~20Hz a 20.000Hz

O teto cai com a idade, um processo chamado **presbiacusia**, onde aos 20 anos de idade a sensibilidade acima de ~15.000Hz começa a sumir. Depois dos 40, muita gente não passa dos 12.000Hz

> Inclusive existe um truque disso, que é o _mosquito tone_. Um tom de 17.000Hz que adolescentes escutam e a maioria dos adultos acima de 30 não. Lojas já usaram isso pra afastar jovens sem incomodar clientes mais velhos

Outros animais na natureza ouvem muito além. Tudo acima de 20.000Hz é **ultrassom**, inaudível para nós, mas corriqueiro para eles. Faixa aproximada do limite superior:

- **Cão**: ~60.000Hz, daí o apito de cachorro funcionar, ele está no ultrassom pra você
- **Gato**: ~79.000Hz, ainda mais agudo que o cão
- **Morcego**: ~120.000Hz
- **Golfinho**: ~150.000Hz, sim os fofinhos dos oceanos escutam a esse nível de frequência

Existe também o outro extremo, o **infrassom**. Abaixo de ~20Hz também não ouvimos. O elefante é o oposto do morcego: seu forte é o grave, comunicando-se por volta de **freaking ~17Hz**, com ondas que viajam quilômetros pela savana. Baleias fazem parecido no oceano.

O ultrassom médico, aquele da ecografia, não usa milhares e sim _milhões_ de Hz (1 a 18 Mhz). É a mesma física de onda deste artigo, só que numa escala em que o número já perdeu qualquer relação com "som" no sentido que a gente escuta.

---

## Conclusão

Neste artigo, partimos de uma pergunta simples, do zero, definindo o que é som, e fomos descendo até os números que fazem o alto-falante vibrar. Vimos que som é uma _perturbação no ar_, uma **onda mecânica** que o ouvido interpreta.

Passamos pela transdução, aprendemos como gerar som a partir do nada no computador e entendemos como tudo vira uma sequência de números no formato PCM. A partir daí a matemática **com a função seno** entrou em cena, e o que parecia abstrato nas aulas de colégio ganhou sentido.

Com a _taxa de amostragem_ demos um relógio para esses números, transformando desenho em som, e com a _amplitude_ demos volume. Por fim, esbarramos no _aliasing_ chegando ao teorema de Nyquist, que explica de onde vêm os 44100 do CD e por que o telefone antigo se contentava com 8000.

Até aqui só geramos ondas senoidais puras, que na prática nenhum instrumento produz sozinho. E é justamente esse o assunto do próximo artigo, onde vamos **somar ondas**, conhecer os **harmônicos** e finalmente entender por que cada instrumento tem a sua voz.

Espero que estes fundamentos tenham sido apresentados de forma didática. _Stay tuned!_

---

## Referências

https://en.wikipedia.org/wiki/Pulse-code_modulation
https://en.wikipedia.org/wiki/Nyquist–Shannon_sampling_theorem
https://en.wikipedia.org/wiki/Aliasing
https://en.wikipedia.org/wiki/44,100_Hz
https://en.wikipedia.org/wiki/Hearing_range
https://en.wikipedia.org/wiki/Sine_wave
http://sox.sourceforge.net/
