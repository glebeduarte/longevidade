# Mapa de saúde, questionários e bioimpedância

Base: laudo atual gerado pelo Life (exemplo anonimizável da paciente I.X.), questionário de estilo de vida da Dra. Bartira e ficha InBody 270 da Clínica Equilibre.

## 1. Estrutura do mapa (4 páginas no modelo atual)

| Página | Conteúdo | Origem dos dados |
|---|---|---|
| Indicadores de saúde | Metabolismo, Fígado, Cardiovascular, Rins, com valor, data e faixa colorida | Exames, bioimpedância, sinais vitais |
| Estilo de vida | Humor, Sono, Alimentação, Álcool, Cigarro, Atividade física | Questionários |
| Força e riscos | Força física, risco cardiovascular 10 anos, risco de diabetes 5 anos, recomendações | Teste de força, cálculos de risco, texto da médica |
| Perfil de saúde | Problemas encontrados, nota de saúde 0 a 100, radar com 10 eixos | Consolidação de tudo acima |

Escala de cores em 5 faixas: ruim, atenção, normal, bom, ótimo.
No app, usar a paleta do design system em vez do arco-íris do Life, mantendo a ordem das faixas.

Eixos do radar: Humor, Alimentação, Físico, Fígado, Escassez de doenças, Cardiovascular, Metabolismo, Rins, Sono, Relação com álcool e cigarro.

## 2. Indicadores (página 1)

| Grupo | Indicador | Unidade | Fonte |
|---|---|---|---|
| Metabolismo | Peso | kg | InBody |
| Metabolismo | Percentual de gordura | % | InBody (PGC) |
| Metabolismo | Vitamina B12 | pg/ml | Exame |
| Metabolismo | TSH | mU/L | Exame |
| Metabolismo | Hemoglobina glicada (HbA1c) | % | Exame |
| Metabolismo | Vitamina D | ng/ml | Exame |
| Metabolismo | IMC | kg/m² | InBody ou calculado |
| Metabolismo | Circunferência abdominal | cm | Medida no encontro |
| Metabolismo | Ferritina | ng/ml | Exame |
| Fígado | TGO, TGP, GGT | U/L | Exame |
| Fígado | FIB-4 | índice | Calculado (idade, TGO, TGP, plaquetas) |
| Cardiovascular | Capacidade cardiopulmonar | ml/kg/min | Estimada por questionário ou teste |
| Cardiovascular | Frequência cardíaca | bpm | Encontro |
| Cardiovascular | Pressão arterial | mmHg | Encontro |
| Cardiovascular | HDL, LDL, colesterol total/HDL, triglicerídeos | mg/dl | Exame |
| Rins | Função renal (TFG) | ml/min/1,73m² | Calculada (CKD-EPI, creatinina, idade, sexo) |
| Rins | Creatinina | mg/dl | Exame |

## 3. Questionários (página 2)

| Domínio | Instrumento | Itens | Faixa | Interpretação |
|---|---|---|---|---|
| Humor | PHQ-9 | 9 + 1 funcional | 0 a 27 | 0-4 mínimo, 5-9 leve, 10-14 moderado, 15-19 moderadamente grave, 20-27 grave |
| Ansiedade | GAD-7 | 7 + 1 funcional | 0 a 21 | 0-4 mínima, 5-9 leve, 10-14 moderada, 15-21 grave |
| Sono | ISI | 7 | 0 a 28 | 0-7 sem insônia, 8-14 subclínica, 15-21 moderada, 22-28 grave |
| Apneia | STOP-BANG | 8 sim/não | 0 a 8 | 0-2 baixo, 3-4 intermediário, 5-8 alto, com regra alternativa |
| Alimentação | DST | 8 | 0 a 16 | ≥12 baixo risco, 8-11 moderado, ≤7 alto |
| Alimentação | Vegetais, frutas, integrais | 1 + 2 + 4 | porções/dia | Integrais: meta 3 porções/dia, 4 faixas |
| Alimentação | Ultraprocessados (Nova-UPF) | 23 sim/não, dia anterior | 0 a 23 | 0-4 baixo, 5-9 intermediário, ≥10 alto. Leitura longitudinal |
| Álcool | AUDIT-C | 3 | 0 a 12 | Mulheres ≥3 consumo de risco |
| Cigarro | Cigarros/dia | 1 | contagem | 1-9 leve, 10-19 moderado, ≥20 pesado |
| Atividade | Aeróbico, força, flexibilidade, equilíbrio, passos | 5 | min/semana, vezes/semana, passos/dia | Meta aeróbico 150-300 min moderado; força ≥2x |

Regra obrigatória: **item 9 do PHQ-9 com qualquer resposta acima de zero gera alerta à médica no mesmo dia**, independentemente da pontuação total, e mostra à paciente a orientação de buscar ajuda imediata (CVV 188, SAMU 192). Esse alerta entra no mesmo fluxo da sinalização de reação adversa.

## 4. Bioimpedância (InBody 270)

Campos da ficha a guardar por medição:

- Composição: água corporal total, proteína, minerais, massa de gordura, peso
- Músculo e gordura: massa muscular esquelética, massa livre de gordura
- Obesidade: IMC, PGC, relação cintura-quadril, nível de gordura visceral, grau de obesidade
- Segmentar magra e gordura: braço direito, braço esquerdo, tronco, perna direita, perna esquerda (kg e %)
- Outros: pontuação InBody, taxa metabólica basal, SMI, ingestão calórica recomendada, peso ideal, controles de peso, gordura e músculo
- Impedância por segmento a 20 e 100 kHz (guardar, não mostrar à paciente)

Fluxo: equipe envia foto ou PDF da ficha e lança os valores ao lado. O arquivo original fica guardado.
A ficha também traz o histórico do próprio aparelho; o app passa a ser a fonte do histórico.

## 5. O que o app calcula e o que a médica decide

Calcula sozinho, com fórmula publicada: escores dos questionários e suas faixas, IMC, TFG, FIB-4, relação colesterol total/HDL, risco cardiovascular em 10 anos (Framingham).

Depende de definição da médica antes de construir:
- faixas de cor de cada exame (ruim a ótimo), que no Life não são as faixas de referência do laboratório
- como cada eixo do radar vira nota de 0 a 100
- como a nota de saúde geral é composta
- qual modelo usar no risco de diabetes em 5 anos
- teste de força: qual teste gera as repetições (sentar e levantar em 30 s?) e as faixas
- capacidade cardiopulmonar: qual questionário de estimativa

Decide sempre: lista de problemas encontrados e recomendações. O app sugere a partir das faixas, a médica edita e aprova antes de a paciente ver.

## 6. Pontos de atenção

- Licenças: PHQ-9 e GAD-7 são de uso livre. ISI e STOP-BANG têm detentores de direitos; o uso clínico costuma ser liberado, mas o uso em software precisa ser confirmado com os detentores antes de publicar.
- O laudo atual sai assinado com o nome civil completo da médica e "Powered by lifeup". No app, sai só com a marca dela.
