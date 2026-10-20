# Design system v2 · Longevidade

Paleta da marca mantida (creme, areia, café, oliva, terracota, cobre), com tons de superfície e texto ajustados para contraste 4,5:1.

## Princípios
- Uma pergunta por tela, respondida pelo maior bloco. A tela Hoje abre com o fato do dia ("1 mapa da saúde aguarda sua revisão").
- Serifa (Cormorant Garamond) com um só trabalho: título da página e nome da paciente. Todo o resto em Jost.
- Números sempre em Jost com algarismos tabulares, alinhados à direita em tabelas.
- Rótulos em caixa normal, 12 a 14 px. Nada de caixa alta espaçada.
- Cor só em dado, status e na ação principal. Café é o botão principal; oliva marca o que está bom; terracota só o que está fora da faixa.
- Superfícies separadas por um passo de tom e uma borda de 1px. Sombra só no que flutua (folha lateral, menu).

## Tokens (tailwind.config.js)
| Papel | Cor |
|---|---|
| fundo (chão) | #f5f1eb |
| folha (cartões, campos) | #fffdfa |
| tom (painel tonal) | #efe8de |
| ativo (navegação) | #e7dfd3 |
| borda / regra / controle | #e6ddd1 / #efe8de / #cfc1b0 |
| texto / apoio | #2e221b / #6b5a4d |
| atenção (texto) | #8a5232 |

Tamanhos: 12 meta, 14 corpo, 16 título de bloco, 24 número, 32 título de página.
Raios: 10 cartões, 6 controles, pílula nos selos.

## Componentes (src/components/ui.tsx)
Titulo, Bloco, Botao (cheio, linha, suave, texto), Campo, Selecao, Selo, Aviso, Vazio, Abas, Iniciais (tom estável por pessoa), Esqueleto.
Classes: .titulo-pagina, .titulo-bloco, .rotulo, .numero, .cartao, .painel-tom, .campo, .segmentado.

## Elemento próprio
A régua de faixas (src/components/regua.tsx): cada indicador na sua faixa de cinco tons com a marca do valor.

## Celular
Barra de 56 px com menu em folha inteira no painel; barra inferior de 4 destinos no app da paciente. Tabelas viram linhas de duas linhas abaixo de 768 px.

Capturas com as pacientes de teste em docs/telas.
