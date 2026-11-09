# Contexto: app Longevidade e site da Dra. Bartira Rebouças

Atualizado em 09/11/2026. Documento de referência para qualquer conversa sobre a ferramenta e o site: o que é, como está montado, o que já foi construído, como mexer e o que falta.

## Visão geral

- **Cliente:** Dra. Bartira Rebouças, endocrinologista em Natal (CRM-RN 5297, RQE 2986). Atende na Clínica Equilibre e no Instituto Spinel. Foco em climatério, menopausa e longevidade feminina. Assinatura: "Ciência e acolhimento".
- **Um único sistema, três áreas no mesmo endereço:**
  1. **Site público** (raiz do endereço): apresenta a doutora, o programa Longevidade, temas, materiais gratuitos e contato.
  2. **Painel** (/painel): médica e equipe, no computador.
  3. **App da paciente** (/app): no celular, letra grande, público mais velho.
- Substitui o Life Up no chamado "Caminho 2": programa mais prontuário leve, com a identidade dela. Uso exclusivo da doutora e da equipe; não é produto para venda.

## Infraestrutura

| Item | Valor |
| --- | --- |
| Endereço | https://longevidade-black.vercel.app (domínio próprio ainda não ligado) |
| Código | GitHub glebeduarte/longevidade (React, Vite, TypeScript, Tailwind v3) |
| Banco, login e arquivos | Supabase, projeto iabuqhwwpuqfleqmkufz (São Paulo) |
| Publicação | Vercel, projeto "longevidade", deploy automático a cada push na main |
| Funções (Edge) | convidar (convite e cadastro direto com senha), enviar-emails (Resend), receita (download assinado do PDF) |
| Buckets | receitas (privado), materiais (público: PDFs e capas dos materiais do site) |
| E-mails | Resend. **Pendente:** configurar RESEND_API_KEY e EMAIL_REMETENTE. Até lá os e-mails ficam numa fila |

Regras de acesso:
- Ninguém se cadastra sozinho. Pacientes e equipe entram por convite ou cadastro feito no painel.
- Permissões da equipe separadas: cadastrar pacientes, lançar medidas, responder check-ins, ver dados clínicos, parceiro, gerir o site.
- A paciente que sai do programa perde o acesso.
- Visitantes do site (sem login) só leem landing pages ativas e gravam leads pela função capturar_lead.

### Como trabalhar no código (notas para quem for mexer)
- Commits como Glebe Duarte (glebejr@gmail.com). Sempre `git pull --rebase` antes do push: o Glebe também envia mudanças.
- Migrações em supabase/migrations. A ferramenta de migração do Supabase pode cancelar DROP/DELETE; quando isso acontecer, usar novo nome de função ou `alter policy`.
- Verificação de tipos: `./node_modules/.bin/tsc -b` (o `npx tsc` falha).
- Testes visuais usam um mock do Supabase (pasta de QA fora do repositório) com pacientes fictícias; o site público, sem o mock, fica em "Carregando" nos materiais.

## Identidade visual

Há duas identidades em uso, de propósito:

- **Site público e painel (logo):** nova identidade oficial, feita pela equipe de design dela (pasta no Drive "ID visual").
  - Logo: borboleta de traço fino + "Dra. Bartira Rebouças" + "Endocrinologista". Arquivos em public/marca: logo-escuro.png (para fundo claro), logo-claro.png, simbolo.png, simbolo-claro.png.
  - Paleta: café #493c32, taupe #c8baa7, off-white #f9f7f2, tom #f0ebe3, texto #2f2620.
  - Tipografia: Allegin (títulos) e Poppins (texto), arquivos em public/fonts.
  - No código, as cores do site são variáveis CSS dentro da classe .site; o resto do sistema não é afetado.
- **App da paciente e tela de login:** identidade anterior, mantida sem alteração por decisão do Glebe.
  - Paleta creme #f5f1eb, café #4a382d, cobre #a26b55, areia #d8cbb9, oliva #4e5839.
  - Tipografia Cormorant Garamond e Jost. Marca "Longevidade · Dra. Bartira Rebouças" com a borboleta antiga.
  - Ícone de app instalável (borboleta sobre creme).
- **Painel:** usa a logo oficial nova (menu lateral e topo no celular); o restante do visual segue o design system do app.

## Site público

Rotas: / (início), /sobre, /programa, /temas, /temas/:slug, /conteudos, /contato, /privacidade, /material/:slug (landing de captura).
Arquivos: src/pages/site/site.tsx (páginas), src/pages/site/material.tsx (landing, capas, livros), src/lib/site.ts (todos os textos: contato, locais, temas, perguntas, programa).

### Home (narrativa aprovada em 05/11)
1. Abertura: "Ciência e acolhimento", a doutora se apresentando em primeira pessoa, foto dela que abre como obturador, textura leve da logo ao fundo.
2. "Você se reconhece?": coluna fixa com o vídeo da metamorfose e seis frases de identificação que passam ao rolar; fecha com "Tudo isso tem nome, explicação e tratamento".
3. "Quem vai cuidar de você": faixa café com textura, foto, texto, assinatura e dados (especialidade, registro, foco, locais).
4. "Em que fase você está?": interativo, a visitante escolhe como está a menstruação e lê a fase provável.
5. "O programa Longevidade": cinco etapas com ícone; ao passar o mouse ou tocar, a imagem ao lado troca para a tela do app ou o documento da etapa; botão "Conhecer o programa".
6. "O que eu trato": seis temas.
7. "Para ler com calma": materiais como capas de livro, com efeito de abrir no hover.
8. Dúvidas, fechamento com a foto de Ponta Negra e rodapé de uma linha.

### Páginas internas
Mesmo desenho da home: abertura com texto sobre a textura e foto à direita, seção de etapas e fechamento.
- **Sobre:** "Por que eu faço assim" em faixa café, formação, etapas, livros.
- **Programa:** vídeo na abertura, etapas, medidas comparadas (bioimpedância, circunferências, preensão, conduta), "O que você recebe" com mockup de cada entrega (Mapa da Saúde, protocolo, checklist de rotina, plano alimentar, app, biblioteca de vídeos), "Por que seis meses", consulta avulsa x programa, comparativo Essencial/Completo/Anual (sem preços), para quem é e não é, suporte entre encontros, dúvidas.
- **Temas, Conteúdos, Contato e cada tema:** listas, livros, locais e dúvidas.

### Imagens do site
- Fotos reais: dra-bartira.jpg (retrato), dra-bartira-rosto.jpg.
- Mockups montados a partir do app real, com dados fictícios: public/site/m-*.jpg (início do app, check-in, evolução, protocolo, Mapa da Saúde) e public/site/e-*.jpg (uma por entrega). Legenda no site avisa que são exemplos.
- Vídeo "Monarch Butterfly Emerging from Chrysalis" (Danmation, CC BY 3.0) e foto do Morro do Careca (Ppulbatu, CC BY 4.0), creditados no rodapé.
- **Decisões de design:** as fotos de mockup do material da marca (cartão, pasta, xícara) não devem ser usadas, são só exemplos da agência. As pranchas de Merian e o "palco fixo" lateral em todas as páginas foram recusados. Rodapé deve ficar discreto.

### Captura de leads (materiais gratuitos)
- Cada material tem uma landing em /material/:slug com formulário (nome, e-mail, WhatsApp opcional, consentimento LGPD) e liberação do PDF na hora; guarda a origem (UTM e referrer).
- Materiais atuais: guia "Mulheres em Transformação" e e-book "Climatério sem Tabu" (faltam os PDFs reais).
- Painel > Site e leads: criar e editar landing pages (textos, benefícios, botão, mensagem de obrigado, PDF e capa), ligar ou desligar, marcar com estrela para destacar, aba de leads com exportação CSV e exclusão.

## Painel da médica e da equipe

- **Hoje:** pendências do dia, alertas clínicos, pacientes com pendência primeiro.
- **Pacientes:** lista e ficha com as abas:
  - **Atendimento:** evolução clínica, anotações internas, lista de problemas sugerida pelos exames, condutas ativas e receitas (PDF da Memed).
  - **Programa:** matrícula (Essencial ou Completo), encontros, check-ins com leitura completa das respostas, protocolo com versões.
  - **Exames e medidas:** indicadores com faixas, cálculos automáticos (IMC, TFG, FIB-4, CT/HDL) e bioimpedância.
  - **Estilo de vida:** fatores de risco e domínios pelos questionários.
  - **Riscos e cálculos:** PREVENT, FRAX Brasil com ajuste ABRASSO, triagem de TEV, força de preensão, Gail, **FIB-4**, **CKD-EPI 2021** e cálcio na alimentação. Cada cálculo abre preenchido com os últimos exames, é salvo no prontuário com histórico, e exames digitados diferentes do registro vão para a ficha.
  - **Mapa da saúde:** relatório com nota de 0 a 100 e radar por áreas.
- **Check-ins:** fila de respostas para a equipe.
- **Encontros:** agenda.
- **Site e leads:** gestão das landing pages e leads.
- **Configurações:** Ver como paciente, Vídeos (edição, capa, arquivo, ordem), Faixas dos indicadores, Equipe (convite por e-mail ou cadastro com senha).

## App da paciente (não alterar sem pedido explícito)

- **Início:** saudação, programa com o mês atual, resposta da equipe ao check-in em destaque até tocar em "Li a mensagem", atalhos e vídeos.
- **Check-in semanal:** 12 perguntas e peso; blocos de GLP-1 e terapia hormonal só se o tratamento constar nas condutas ou numa receita válida; sintoma novo; "Sinais que não esperam a sexta-feira" geram alerta urgente; rascunho salvo no aparelho.
- **Questionários:** com nota automática.
- **Meu protocolo:** orientações e "Seus medicamentos" (como usar, validade da receita, token e código da farmácia, PDF enquanto válida).
- **Evolução:** gráficos e Mapa da Saúde.

## Regras clínicas implementadas

- **Questionários:** PHQ-9 (item 9 gera alerta), GAD-7, ISI, STOP-Bang, AUDIT-C, alimentação, atividade física, cigarro, Meno-D (0 a 48, sem corte; autoestima 4 gera alerta) e Brain Fog (sem soma; respostas de progressão, família ou autonomia geram alerta).
- **PREVENT:** coeficientes oficiais conferidos com o pacote preventr (CRAN). Cortes AHA/ACC 2026 para ASCVD em 10 anos: <3% baixo, 3 a <5% limítrofe, 5 a <10% intermediário, ≥10% alto.
- **FRAX:** a médica usa a calculadora oficial da ABRASSO e o app aplica um único fator de ajuste.
- **TEV:** três níveis, sem pontos; não decide sobre terapia hormonal.
- **Preensão (EWGSOP2):** <16 kg mulheres, <27 kg homens.
- **Cálcio:** meta 1.000 ou 1.200 mg/dia conforme idade e sexo.
- **FIB-4:** idade × TGO ÷ (plaquetas × √TGP), plaquetas em mil/mm³. <1,30 baixo (≥65 anos: <2,0), 1,30 a 2,67 indeterminado, >2,67 alto. Fonte de referência: hepatitisc.uw.edu.
- **CKD-EPI 2021:** sem fator raça, creatinina em mg/dL, estágios KDIGO G1 ≥90, G2 60 a 89, G3a 45 a 59, G3b 30 a 44, G4 15 a 29, G5 <15. Fonte de referência: calculadora da SBN.
- **Receitas Memed:** validade sugerida pelo tipo: GLP-1 retido 90 dias; controle especial 30; outros com retenção 30; antimicrobiano 10; simples 180.
- **Check-ins:** semanais, abrindo na quinta, para o contato da equipe na sexta.

## Linha do tempo

- **14/10:** questionários com nota, ficha da paciente, bioimpedância.
- **20/10:** Caminho 2 (prontuário, exames, fatores de risco, Mapa da Saúde), programa completo, design system v2, Ver como paciente, pacientes de teste.
- **21/10:** check-in com Salvar, cadastro manual da equipe, resposta do check-in na tela inicial e por e-mail, receitas da Memed.
- **28/10:** Meno-D e Brain Fog, aba Riscos e cálculos, check-in semanal novo, logo/foto/ícone, vídeos, Gail.
- **05/11:** site público completo, captura de leads, nova identidade visual aplicada ao site, home narrativa, páginas internas no mesmo estilo, logo nova no painel.
- **05/11 (tarde):** calculadoras FIB-4 e CKD-EPI 2021; mockups das entregas na página do Programa.

## Pendências

- Configurar o Resend (e-mails ainda em fila).
- Site: número de WhatsApp do agendamento, endereços e horários das duas clínicas, lista de formação da doutora, PDFs e capas reais dos dois materiais, domínio próprio.
- Conferir com a doutora os textos de exemplo dos mockups (checklist, plano alimentar, títulos dos vídeos).
- Trocar os vídeos de exemplo pelos reais.
- Retirar as pacientes de teste antes do uso real (e-mails terminam em @teste.longevidade).
- Revisar os avisos de segurança do Supabase.
- A doutora precisa confirmar: dia de abertura do check-in, lista de remédios que ativa os blocos GLP-1 e THM, faixas dos indicadores.
- Doctoralia: API restrita; caminho viável é sincronizar com o Google Agenda e o app ler essa agenda.
