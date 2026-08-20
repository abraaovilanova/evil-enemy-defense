# Simulação de combate contínua, com tick fixo separado do render

O combate acontece num campo contínuo: cada Unidade tem posição em X e velocidade,
e ataca quando `distância ao Defensor <= alcance`. A simulação roda num tick fixo
(alvo: 20/s) independente do `requestAnimationFrame`, para ser determinística e
testável com Vitest.

A alternativa era um campo discreto em faixas, que simplificaria pathing mas
tornaria dano em área e Alcance variável (Q11/Q12) desajeitados, além de exigir
interpolação visual para esconder os saltos — ou seja, o custo do contínuo sem
o benefício.

**Consequência:** todo o estado de combate precisa ser serializável e livre de
`Date.now()` / `Math.random()` não-semeado, senão os testes de balanceamento
deixam de ser reproduzíveis.
