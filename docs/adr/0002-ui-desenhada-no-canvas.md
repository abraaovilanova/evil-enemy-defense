# Toda a UI é desenhada no canvas, não em HTML

Loja, montagem de Exército e seleção de Estágio são renderizadas no mesmo canvas
da batalha, num "UI kit" próprio (caixas, listas, cursor). O objetivo é o visual
de menu de Final Fantasy 1/2 no NES — fundo azul, borda branca, cursor "▶" — em
resolução baixa (320×180) com upscale em escala inteira e `image-rendering: pixelated`.

HTML/CSS foi considerado e rejeitado: daria botões, scroll e texto de graça, e o
estilo FF é trivial em CSS. A escolha pelo canvas é por controle de pixel e
coesão visual com a batalha, aceitando reimplementar listas, scroll e foco à mão.

**Consequência:** navegação por teclado (cursor FF) é a interface primária e o
mouse é hit-testing manual sobre retângulos que nós mesmos desenhamos. Nada de
acessibilidade nativa do navegador.
