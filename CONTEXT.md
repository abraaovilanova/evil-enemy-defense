# Contexto do Domínio

Glossário do projeto. Somente vocabulário — sem detalhes de implementação.
Termos em português; o identificador em código vai em inglês, entre `crases`.

## Run — `Run`

Uma única batalha do Exército do jogador contra a Guarnição de um Estágio,
terminando em
vitória (Guarnição inteira destruída) ou derrota (Exército inteiro morto).
Não é uma sequência de batalhas: cada batalha é uma Run.
A Run é automática: nenhuma decisão do jogador acontece durante ela.

## Defensor — `Defender`

Uma entidade que o jogador precisa destruir: tem Forma, HP, Armadura, Armas e
uma posição no campo. Um Estágio tem vários, reunidos numa Guarnição.

## Guarnição — `Garrison`

O conjunto de Defensores de um Estágio (até cinco). A construção principal fica
no centro do campo e o resto se espalha para os dois lados dela, então parte da
Guarnição fica *atrás* da coluna que entra por um lado.

## Armadura — `armor`

Redução fixa de dano por golpe recebido, dos dois lados: `max(1, dano - armadura)`.
Construções têm Armadura alta e HP moderado; criaturas, o contrário. É o que faz
prédio e monstro jogarem diferente, e não só parecerem diferentes.

## Entrada — `side`

O lado do campo por onde uma parte do Exército entra (esquerda ou direita). Na
montagem o jogador divide as Unidades entre as duas Entradas.

## Forma — `Form`

A aparência e os atributos de um Defensor (ex.: Troll, Torre, Castelo).
Determina HP, Armadura, Armas e se ele **anda**: criaturas caminham na direção
da Unidade mais próxima quando não têm ninguém no alcance; construções são fixas.

## Exército — `Army`

O conjunto de Unidades que o jogador leva para uma Run. Montado fora do combate.

## Unidade — `Unit`

Um atacante individual do Exército. Tem tipo, nível e atributos.

## Estágio — `Stage`

Um encontro fixo e nomeado com uma Guarnição específica. Os Estágios formam uma
linha (1, 2, 3, …), podem ser rejogados para farmar Moedas, e vencer alguns
libera um novo Tipo de Unidade na loja.

## Avanço — `Advance`

A marcha das Unidades da sua Entrada rumo ao centro do campo, sob fogo. Uma
Unidade nunca recua: ela avança até algum Defensor entrar no seu Alcance, e aí
ataca o mais próximo — inclusive um que a esteja perseguindo por trás.

## Alcance — `range`

A distância a partir da qual uma Unidade consegue atacar um Defensor. Unidades
em Alcance param de avançar e atacam o Defensor vivo mais próximo.

## Arma — `Weapon`

Um sistema de ataque do Defensor, com dano, cadência e Regra de Alvo próprios.
Uma Forma tem uma ou mais Armas (ex.: Castelo = canhão + arqueiros).

## Regra de Alvo — `TargetingRule`

Como uma Arma escolhe quem atingir: mais avançado, área, menor HP, etc.
É o principal contrapeso à composição do Exército.

## Tipo de Unidade — `UnitType`

Uma classe de atacante (ex.: Guerreiro, Arqueiro, Catapulta) com Alcance,
velocidade, HP e dano próprios. O jogador **desbloqueia** tipos e sobe o
**nível** deles; não possui estoque de Unidades. Unidades individuais não são
persistentes nem distinguíveis, e a única restrição de quantidade é a
Capacidade — dois limites (estoque *e* Capacidade) seriam redundantes.

## Capacidade — `capacity`

Quantas Unidades cabem no Exército de uma Run. É um limite de escolha: o
jogador seleciona quais tipos e quantos levar, dentro dela.

## Moeda — `Coins`

Recompensa de uma Run, gasta na Meta-progressão. É a soma de quatro parcelas,
acumuladas *durante* a Run e visíveis no HUD: dano causado à Guarnição,
Unidades vivas no fim, bônus de vitória (maior na Primeira Vitória) e uma
parcela de tempo — rapidez, se você venceu; tempo sobrevivido, se perdeu.

## Meta-progressão — `Progression`

Melhorias permanentes ao Exército, feitas entre Runs, compradas com Moedas.

## Derrota parcial

Perder uma Run ainda rende Moedas: o dano causado à Guarnição e o tempo que o
Exército sobreviveu já foram acumulados.
Unidades mortas não são perdidas permanentemente — o Exército é remontado
livremente a cada Run.

## Primeira Vitória

A primeira vez que um Estágio é vencido rende recompensa maior; repetições do
mesmo Estágio rendem menos, para que farmar não domine o loop.
