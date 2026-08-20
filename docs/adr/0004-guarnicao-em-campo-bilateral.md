# O Estágio tem uma Guarnição, num campo com dois lados

O Defender deixou de ser uma entidade única. Um Estágio agora tem uma
**Guarnição**: até cinco Defensores, cada um com Forma, HP, Armadura, Armas e
**posição** no campo. O campo passou a ter a construção principal no centro
(x = 0) e duas entradas, uma em cada extremidade; na montagem, o jogador
**divide o Exército** entre a entrada da esquerda e a da direita.

Consequências que valem mais que a decisão em si:

- **Criaturas andam, construções não.** Uma criatura sem ninguém no alcance
  caminha na direção da Unidade viva mais próxima, então a Guarnição do lado
  oposto fecha o cerco enquanto a coluna bate na construção central. É o relógio
  natural da Run — continua não existindo tempo-limite (Q13 original).
- **Unidade nunca recua.** Ela avança rumo ao centro e só para quando algum
  Defensor entra no seu Alcance; aí ataca o mais próximo, de qualquer lado.
  Perseguir o inimigo mais próximo em qualquer direção faria a coluna oscilar
  entre duas ameaças e o jogador não conseguiria explicar o que viu.
- **Armadura dos dois lados.** Dano recebido é `max(1, dano - armadura)`. É o
  que faz construção jogar diferente de criatura: prédio tem Armadura alta e
  humilha Arma de tiro fraco e rápido; criatura tem HP alto e Armadura baixa.

A alternativa era manter um Defensor único e simular variedade só com números,
o que deixaria "torre" e "monstro" sendo a mesma coisa com sprites diferentes.
