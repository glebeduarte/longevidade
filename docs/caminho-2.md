# Caminho 2: programa mais prontuário leve

Objetivo: a Dra. Bartira acompanha as pacientes do programa sem abrir o Life Up. Mesma lógica de trabalho que ela já conhece, com a identidade dela e menos ruído na tela.

## 1. Como o Life Up faz cada coisa (engenharia reversa, 20/10/2026)

Observado navegando no sistema logado, só leitura.

| Módulo Life Up | Entrada | O que calcula ou gera | No Longevidade |
|---|---|---|---|
| Lista de pacientes | cadastro | etiquetas de pendência por paciente: Cadastro, Métricas, Exames, Mapa da Saúde, Questionários desatualizados | Lista com as mesmas pendências, só as que importam para o programa |
| Atendimento: Evolução clínica | texto livre, modelo de anamnese, gravação por IA | histórico de consultas com busca e filtro por período, "Copiar prontuário" | Evolução por encontro com modelo de anamnese, histórico com busca, copiar texto. Sem gravação por IA nesta fase |
| Atendimento: Anotações | texto livre | notas internas fora da evolução | Anotações internas |
| Condutas ativas | medicação, item de plano | lista do que está em curso, histórico | Medicações e plano, com início, fim e histórico |
| Lista de problemas | manual ou sugerida por IA ("Novo", aceitar ou ignorar) | problemas com descrição curta | Lista de problemas manual, com ativo e resolvido. Sugestão automática vem das faixas (ver mapa) |
| Exames/Indicadores: métricas | altura, peso, cintura, pescoço, % gordura | IMC | Medidas do encontro: altura, peso, cintura, pescoço, PA, FC |
| Estimar VO2 máx | força MMSS (kgf), força MMII (repetições), PA, FC | VO2 estimado | Força de preensão, sentar e levantar 30 s, VO2 informado. Método de estimativa aguarda a médica |
| Exames | nome (154 no catálogo, 17 principais no topo), resultado, data | cor em 5 faixas: ruim, atenção, normal, bom, ótimo; histórico por exame | Mesmo catálogo principal, faixas editáveis pela médica, grade exame × data |
| Fatores de risco (8 passos) | etnia; tabagismo; doenças (DM, AIDS, DPOC, câncer); pais com diabetes; medicações (PA, colesterol, humor, sono, diabetes); colonoscopia 10 anos; DCV prematura em parente de 1º grau; DCV própria | risco cardiovascular (não calcula se já há DCV), risco de diabetes, rastreios | Mesmo assistente em 8 passos, mesmas perguntas |
| Estilo de vida | questionários (Depressão 0-27, Ansiedade 0-21, Insônia 0-28, Apneia, Força, Aeróbico, Flexibilidade, Equilíbrio, Passos, Alimentação 0-100 com Vegetais, Frutas, Integrais, Processados, Água, Álcool 0-12, Cigarro) | pontuação, cor e data por domínio | Já temos os 10 instrumentos validados; tela organizada nos mesmos dois blocos |
| Relatório de estilo de vida | escores | página para imprimir com texto padrão por faixa (ex.: "inclua exercícios de equilíbrio, quedas são a 3ª causa de mortalidade após os 65") | Relatório com blocos de recomendação por domínio e faixa, editáveis |
| Mapa da Saúde | tudo acima | "em andamento" com pendências; Revisar e finalizar; Suspender; Mapas prévios; Nota de Saúde | Mapa com o mesmo ciclo: iniciar, pendências, revisar, finalizar, histórico |
| Mapa Populacional | filtros de período, sexo, idade, mapas e questionários finalizados | nota de saúde média | Fase seguinte: visão da turma do programa |
| LifeOracle (IA) | prontuário | resumo pré-consulta, análise de caso, pós-consulta, vacinas | Fora desta fase |

## 2. Decisões de desenho

- A ficha tem quatro abas, na ordem do encontro: **Atendimento**, **Exames e medidas**, **Estilo de vida**, **Mapa da saúde**.
- Uma coluna principal e uma lateral. Nada de painel de IA fixo ocupando um terço da tela.
- As cinco faixas usam a paleta dela: terracota (ruim), cobre (atenção), apoio (normal), oliva clara (bom), oliva (ótimo).
- O elemento próprio do sistema é a **régua**: cada indicador aparece numa faixa de cinco tons com a marca do valor da paciente. A mesma régua serve na tela e no relatório impresso.
- Faixas dos exames nascem com valores padrão marcados como "a revisar". A médica ajusta na tela de faixas e a marca some.

## 3. Pendências para a médica

As cinco decisões de `mapa-de-saude.md` §5 continuam abertas. Até lá:
- a nota de cada eixo é a média das faixas dos indicadores dele e aparece como "provisória";
- risco cardiovascular usa Framingham (D'Agostino 2008), só quando não há DCV;
- risco de diabetes e VO2 não são calculados.
