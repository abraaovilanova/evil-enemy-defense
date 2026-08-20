# A Run é totalmente automática; toda decisão acontece antes dela

O jogador monta o Exército (tipos, quantidades, dentro da Capacidade), inicia a
Run e assiste. Não há envio manual de levas nem habilidades ativas durante o
combate. A decisão de jogo vive na montagem e na Meta-progressão.

Considerou-se deixar o jogador escolher *quando* mandar cada leva — barato de
implementar dado que já existe posição e Avanço, e transformaria a Run em
decisão contínua. Foi rejeitado para manter o foco do jogo no loop
montar → assistir → gastar Moedas.

**Consequência:** o resultado de uma Run é determinado no momento em que ela
começa. Isso é bom (permite simular Runs em teste, e eventualmente pular a
animação) e arriscado: se assistir não for divertido, não há input do jogador
para compensar — a solução terá que ser leitura visual e ritmo, não interação.
