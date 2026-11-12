/**
 * Textos do site público. Atualizado com as respostas do briefing (09/11/2026).
 * Tudo que estiver marcado com CONFIRMAR depende da Dra. Bartira.
 */
import type { Tema } from '../components/icones'

export const CONTATO = {
  mensagemWhatsapp: 'Olá! Vim pelo site e gostaria de agendar uma consulta com a Dra. Bartira.',
  instagram: 'https://www.instagram.com/dra.bartirareboucas',
  youtube: 'https://www.youtube.com/@BartiraRebou%C3%A7as',
  facebook: 'https://www.facebook.com/search/top?q=Bartira%20End%C3%B3crino', // CONFIRMAR: link direto da página
  doctoralia: 'https://www.doctoralia.com.br/bartira-miridan-reboucas/endocrinologista/natal',
  avaliacoesDoctoralia: 'https://www.doctoralia.com.br/perfil/bartira-miridan-reboucas#profile-reviews',
  avaliacoesGoogle: 'https://share.google/RwSvQlwcipJAcVX0Z',
  lattes: 'https://lattes.cnpq.br/7702452966160555',
  crm: 'CRM-RN 5297',
  rqe: 'RQE 2986',
  cnpj: '68.262.453/0001-20',
  horarioEquipe: 'Equipe no WhatsApp: segunda a sexta, das 7h às 19h, e sábado, das 8h às 12h. Agendamento on-line pelo Doctoralia 24 horas.',
  avisoWhatsapp: 'O WhatsApp é para agendamento e informações administrativas. Orientações clínicas acontecem na consulta e no plano de cuidado.',
}

/** Link do WhatsApp de agendamento de cada local (mesmos números do Linktree). */
export const linkWhatsapp = (numero: string) =>
  `https://wa.me/${numero}?text=${encodeURIComponent(CONTATO.mensagemWhatsapp)}`

export const LOCAIS = [
  { nome: 'Clínica Equilibre', endereco: 'Av. Campos Sales, 901, salas 801/802, Tirol, Natal/RN, 59020-300', telefone: '(84) 99200-5446', whatsapp: '5584992005446',
    horario: 'Segunda, das 13h às 19h. Terça a sexta, das 8h às 13h.', mapa: 'https://share.google/HLzGxzB2sYYGaSWTX', foto: { src: '/site/local-equilibre.jpg', alt: 'Recepção da Clínica Equilibre, no Tirol' } as { src: string; alt: string } | undefined },
  { nome: 'Instituto Espinel', endereco: 'R. Dr. José Gonçalves, 1720, Lagoa Nova, Natal/RN, 59056-570', telefone: '(84) 99926-5863', whatsapp: '5584999265863',
    horario: 'Terça, das 14h às 18h.', mapa: 'https://share.google/KxsHgPtP4gCyhnu1B',
    foto: { src: '/site/local-espinel.jpg', alt: 'Fachada do Instituto Espinel, na Rua Dr. José Gonçalves, em Lagoa Nova' } },
]

export const NAV: Array<[string, string]> = [
  ['/sobre', 'Sobre'], ['/programa', 'Programa Longevidade'], ['/temas', 'Temas'], ['/conteudos', 'Conteúdos'], ['/contato', 'Contato'],
]

export const INICIO = {
  titulo: 'Ciência e acolhimento',
  texto: 'Saúde metabólica, hormonal e longevidade com a Dra. Bartira Rebouças, endocrinologista em Natal. Cuidado individualizado e um plano de cuidado por escrito.',
  intro: [
    'O peso que sobe mesmo quando você tenta. Um cansaço que não passa com descanso. O sono que ficou leve, os calorões, o humor que oscila sem motivo aparente.',
    'Essas mudanças têm explicação e têm tratamento. Hormônios, metabolismo, sono, músculo e alimentação se influenciam, e por isso o cuidado precisa olhar o conjunto.',
    'Meu trabalho é construir com você um plano de cuidado, com decisões explicadas e acompanhamento que continua depois da consulta.',
  ],
}

/** As três dúvidas que mais aparecem na primeira consulta. */
export const DUVIDAS_INICIAIS = [
  'Por que estou ganhando peso ou não consigo emagrecer, mesmo tentando?',
  'Meus sintomas podem estar relacionados às alterações hormonais? Preciso de terapia hormonal?',
  'O que posso fazer para recuperar minha energia, melhorar meu metabolismo e envelhecer com saúde?',
]

/** Avaliações públicas. Os textos dos depoimentos ficam no Doctoralia e no Google, para não serem reescritos aqui. */
export const DEPOIMENTOS = {
  titulo: 'O que dizem as pacientes',
  texto: 'Nota 5 de 5 em 303 opiniões no Doctoralia, todas de consultas verificadas. Trechos copiados das avaliações, com autoria como publicada.',
  // Fonte: doctoralia.com.br/perfil/bartira-miridan-reboucas, consultado em 09/11/2026
  itens: [
    { texto: 'Uma profissional extremamente atenciosa, cuidadosa e competente.', autor: 'Aline', data: 'outubro de 2026' },
    { texto: 'Médica maravilhosa, humana e bastante técnica.', autor: 'A.L.S.S.F.', data: 'outubro de 2026' },
    { texto: 'Ela é muito atenciosa, questiona tudo e orienta direito.', autor: 'Vania', data: 'setembro de 2026' },
    { texto: 'Explicações detalhadas. Atenciosa durante a consulta. Pontual.', autor: 'K.J.B.K.', data: 'agosto de 2026' },
    { texto: 'Bartira é uma profissional exemplar!', autor: 'Izabele Iduino', data: 'outubro de 2026' },
    { texto: 'A melhor endocrinologista!', autor: 'Marina Lino', data: 'setembro de 2026' },
  ],
}

/** "Em que fase você está?": orientação geral, não diagnóstico. */
export const FASES: Array<{ id: string; pergunta: string; fase: string; texto: string; cuidado: string }> = [
  { id: 'regular', pergunta: 'Menstruo todo mês, como sempre', fase: 'Antes da transição',
    texto: 'Os ciclos ainda são regulares, mas a partir dos 40 anos algumas mudanças podem começar antes de a menstruação mudar: sono mais leve, TPM mais forte, ganho de peso.',
    cuidado: 'É o melhor momento para uma avaliação de base: exames, composição corporal, força e hábitos.' },
  { id: 'irregular', pergunta: 'Meus ciclos mudaram: atrasam, adiantam ou falham', fase: 'Perimenopausa',
    texto: 'É a fase de transição. Os hormônios oscilam bastante e os sintomas costumam aparecer: calorões, insônia, irritabilidade, alterações na libido.',
    cuidado: 'Os sintomas têm tratamento, com ou sem hormônios. Vale avaliar agora, antes que eles tomem conta da rotina.' },
  { id: 'menopausa', pergunta: 'Estou há 12 meses ou mais sem menstruar', fase: 'Pós-menopausa',
    texto: 'A menopausa já aconteceu. Alguns sintomas podem continuar por anos, e o cuidado com ossos, coração, músculos e metabolismo ganha importância.',
    cuidado: 'Avaliamos riscos e escolhemos o que proteger primeiro: saúde óssea, cardiovascular e muscular.' },
  { id: 'outro', pergunta: 'Não menstruo por outro motivo (cirurgia, DIU, medicação)', fase: 'Precisa de avaliação',
    texto: 'Sem a menstruação como referência, a fase é identificada pelos sintomas, pela idade e, quando necessário, por exames.',
    cuidado: 'Na consulta, conversamos sobre seu histórico para entender em que momento você está.' },
]

/** O programa como um roteiro impresso. */
export const ROTEIRO: Array<{ quando: string; itens: Array<[string, string]> }> = [
  { quando: 'Primeiro mês', itens: [['Encontro inicial, com tempo para ouvir', '1ª semana'], ['Exames, bioimpedância e força', 'até a 2ª semana'], ['Questionários de sono, humor e hábitos', 'pelo app'], ['Seu plano de cuidado por escrito', 'no app']] },
  { quando: 'Toda semana', itens: [['Check-in sobre sintomas, hábitos e medicamentos', 'quinta-feira'], ['Resposta da equipe', 'sexta-feira']] },
  { quando: 'Ao longo do programa', itens: [['Encontro de seguimento e ajustes', '3º mês'], ['Encontro de encerramento', '6º mês']] },
]
export const ROTEIRO_FIM: [string, string] = ['Seu Mapa da Saúde e um plano para seguir', '6 meses']

export const PARA_QUEM: Array<{ tema: Tema; titulo: string; texto: string }> = [
  { tema: 'metabolismo', titulo: 'Peso e metabolismo', texto: 'Dificuldade para emagrecer, ganho de peso, glicose e colesterol alterados. Emagrecimento saudável e manutenção de peso.' },
  { tema: 'fogacho', titulo: 'Climatério, sono e humor', texto: 'Calorões, noites mal dormidas e oscilação de humor, com as opções seguras para cada caso.' },
  { tema: 'forca', titulo: 'Ossos, músculos e energia', texto: 'Prevenção de osteoporose e perda de massa muscular para envelhecer com força e autonomia.' },
]

export const PASSOS = [
  { titulo: 'Antes da consulta', texto: 'Você recebe o questionário e o pedido de exames, para a consulta já começar com dados.' },
  { titulo: 'Consulta', texto: 'Uma conversa longa sobre sua história, seus sintomas, seus exames e seus objetivos.' },
  { titulo: 'Seu plano de cuidado', texto: 'Um plano por escrito, com medicações quando indicadas, alimentação, sono e movimento.' },
  { titulo: 'Acompanhamento semanal', texto: 'Check-in toda semana pelo app e resposta da equipe às sextas-feiras.' },
]

export const SOBRE = {
  resumo: 'Endocrinologista em Natal há cerca de 20 anos, dedicada à saúde metabólica e hormonal, ao climatério e ao envelhecimento com saúde.',
  paragrafos: [
    'Decidi ser médica inspirada pelo meu pai. Aos 15 anos fui a uma consulta com um endocrinologista, achei tudo tão interessante que decidi ali a especialidade. Um ano depois eu estava na faculdade de medicina.',
    'Hoje atuo especialmente no cuidado de mulheres durante o climatério e no acompanhamento de pacientes com obesidade, diabetes, síndrome metabólica e outras condições endocrinológicas.',
    'A pós-graduação em comportamento alimentar mudou meu jeito de atender. Além do peso, procuro entender as causas daquele jeito de comer e o que a comida representa para cada pessoa. A partir disso, organizo as mudanças de estilo de vida de forma sistemática, para que o peso se mantenha e a energia e a saúde melhorem junto.',
    'Também escrevi o guia "Mulheres em Transformação" e o e-book "Climatério sem Tabu", para que mais pessoas tenham acesso a informação clara.',
  ],
  formacao: [
    'Residência em Clínica Médica e Endocrinologia, Hospital Universitário Onofre Lopes (RQE 2986)',
    'Mestre em Ciências da Saúde pela UFRN, com pesquisa em tecido adiposo, lipodistrofias e risco cardiovascular',
    'Pós-graduação em Comportamento Alimentar',
  ],
  atualizacao: [
    'Publicações em revistas médicas internacionais',
    'Congresso Mundial de Menopausa, Rio de Janeiro, 2026',
    'Cursos de atualização em diabetes, insulinoterapia e saúde metabólica',
    'Educação médica e palestras científicas',
  ],
}

export type Plano = { slug: string; nome: string; duracao: string; encontros: string; inclui: string[]; destaque?: boolean }
export const PLANOS: Plano[] = [
  { slug: 'essencial', nome: 'Essencial', duracao: '6 meses', encontros: '3 encontros com a Dra. Bartira',
    inclui: ['Avaliação completa e exames', 'Plano de cuidado individualizado', 'Check-in semanal pelo app', 'Mapa da Saúde ao final'] },
  { slug: 'completo', nome: 'Completo', duracao: '6 meses', encontros: '3 encontros com a Dra. Bartira', destaque: true,
    inclui: ['Tudo do Essencial', 'Consulta com cardiologista parceiro', 'Consulta com nutricionista parceira'] },
  { slug: 'anual', nome: 'Anual', duracao: '12 meses', encontros: '5 encontros com a Dra. Bartira',
    inclui: ['Tudo do Completo', 'Acompanhamento por um ano inteiro', 'Reavaliação de exames ao longo do ano'] },
]

export const APP_PACIENTE = [
  'Seu plano de cuidado sempre à mão, com receitas e como usar cada medicamento',
  'Check-in semanal em poucos minutos',
  'Questionários de sono, humor e hábitos antes dos encontros',
  'Sua evolução em gráficos, encontro após encontro',
]

export const PERGUNTAS: Array<[string, string]> = [
  ['Com que idade começa o climatério?', 'Na maioria das mulheres, a partir dos 40 anos, alguns anos antes da última menstruação. Pode começar antes, nos casos de menopausa precoce ou prematura.'],
  ['Os sintomas passam sozinhos?', 'Alguns diminuem com os anos, outros persistem por muito tempo. Não é preciso esperar: existem tratamentos para cada caso.'],
  ['Preciso estar na menopausa para participar?', 'Não. O programa atende mulheres na perimenopausa, quando os ciclos começam a mudar, e depois da menopausa.'],
  ['O programa inclui terapia hormonal?', 'Só quando for indicada e segura para você. Essa decisão é tomada na consulta, depois da avaliação completa.'],
  ['Atende por plano de saúde?', 'Não. A consulta é particular, e emitimos nota fiscal para você pedir reembolso ao seu plano.'],
  ['Posso fazer as consultas on-line?', 'Sim. A teleconsulta atende pacientes de fora de Natal, inclusive fora do Brasil.'],
  ['Atende homens?', 'Sim. O foco principal é a saúde da mulher, mas acompanho pacientes homens com obesidade, diabetes e outras condições endocrinológicas.'],
  ['Tem consulta de retorno?', 'Não. Antes da consulta você recebe um questionário e o pedido de exames, para que o encontro já aconteça com os resultados em mãos.'],
  ['Como funciona o check-in semanal?', 'Toda semana você responde algumas perguntas pelo app sobre sintomas, sono, hábitos e medicamentos. A equipe lê e responde às sextas-feiras.'],
  ['Preciso levar exames na primeira consulta?', 'Depois de agendar, a equipe envia o pedido de exames e o questionário. Se você tiver exames recentes, traga também.'],
  ['E se eu tiver um sintoma forte entre os encontros?', 'O app tem uma lista de sinais que não esperam a sexta-feira. Nesses casos, procure atendimento imediato e a equipe é avisada.'],
]

export type TemaSite = { slug: string; tema: Tema; titulo: string; resumo: string; corpo: string[] }
export const TEMAS: TemaSite[] = [
  { slug: 'climaterio-e-menopausa', tema: 'fogacho', titulo: 'Climatério e menopausa',
    resumo: 'O que muda no corpo, quanto tempo dura e o que dá para fazer.',
    corpo: [
      'Climatério é a fase de transição entre a vida reprodutiva e a vida depois da menopausa. Ela costuma começar alguns anos antes da última menstruação e pode trazer calorões, suor noturno, insônia, irritabilidade, queda da libido e ressecamento vaginal.',
      'Menopausa é a data da última menstruação, confirmada depois de 12 meses sem ciclo. Cada mulher atravessa essa fase de um jeito, e os sintomas têm tratamento.',
      'Na consulta avaliamos seus sintomas, seus exames e seus riscos para definir o que faz sentido para você.',
    ] },
  { slug: 'terapia-hormonal', tema: 'humor', titulo: 'Terapia hormonal',
    resumo: 'Quando é indicada, quais são as opções e como avaliamos a segurança.',
    corpo: [
      'A terapia hormonal da menopausa é o tratamento mais eficaz para os calorões e ajuda no sono, no humor e na saúde dos ossos. Ela não é indicada para todas as mulheres.',
      'Antes de qualquer prescrição avaliamos histórico pessoal e familiar, risco de trombose, risco cardiovascular e de câncer de mama. A via de uso e a dose são escolhidas caso a caso.',
      'Para quem não pode ou não quer usar hormônios, existem outras opções de tratamento.',
    ] },
  { slug: 'peso-e-metabolismo', tema: 'metabolismo', titulo: 'Peso e metabolismo',
    resumo: 'Por que o peso muda nessa fase e como cuidar sem fórmulas prontas.',
    corpo: [
      'Com a queda dos hormônios, a gordura tende a se acumular na barriga e o corpo perde massa muscular. Glicose, colesterol e pressão também podem mudar.',
      'O cuidado começa pela avaliação: composição corporal, exames e hábitos. A partir dela montamos um plano de alimentação, movimento e, quando indicado, medicamentos.',
    ] },
  { slug: 'obesidade', tema: 'metabolismo', titulo: 'Obesidade e emagrecimento sustentável',
    resumo: 'Por que é tão difícil emagrecer e manter o peso, e como tratar com método.',
    corpo: [
      'Obesidade é uma doença crônica, com causas biológicas, hormonais e de comportamento. Força de vontade sozinha raramente resolve, e dietas muito restritivas costumam terminar em reganho de peso.',
      'Na consulta, além dos exames e da composição corporal, olhamos para o comportamento alimentar: em que momentos você come, por quê e o que a comida representa na sua rotina.',
      'O plano de cuidado junta alimentação, movimento, sono e, quando indicado, medicamentos. O objetivo é um emagrecimento saudável que se mantenha com o tempo.',
    ] },
  { slug: 'diabetes', tema: 'metabolismo', titulo: 'Diabetes e saúde metabólica',
    resumo: 'Pré-diabetes, diabetes tipo 2, resistência à insulina e síndrome metabólica.',
    corpo: [
      'Glicose alterada, triglicérides altos, pressão elevada e gordura abdominal costumam aparecer juntos. Esse conjunto aumenta o risco de doença do coração e merece cuidado cedo.',
      'O tratamento combina mudança de hábitos e medicamentos quando necessários, com metas claras e acompanhamento dos exames ao longo do tempo.',
    ] },
  { slug: 'prevencao-cardiovascular', tema: 'coracao', titulo: 'Prevenção cardiovascular',
    resumo: 'Colesterol, pressão e risco do coração ao longo do envelhecimento.',
    corpo: [
      'Depois da menopausa o risco cardiovascular da mulher aumenta. Colesterol, pressão, glicose e composição corporal entram no cálculo.',
      'Usamos calculadoras validadas para estimar seu risco e definir o que tratar primeiro, com metas individualizadas.',
    ] },
  { slug: 'sono', tema: 'sono', titulo: 'Sono e composição corporal',
    resumo: 'Insônia, despertares e cansaço durante o dia, e o efeito disso no peso e no músculo.',
    corpo: [
      'Dormir mal é uma das queixas mais comuns no climatério. Calorões noturnos, ansiedade e apneia do sono estão entre as causas.',
      'Dormir pouco também altera o apetite, a glicose e a recuperação muscular. Usamos questionários validados para entender o seu sono e tratamos a causa junto com o sintoma.',
    ] },
  { slug: 'saude-ossea', tema: 'forca', titulo: 'Saúde óssea e muscular',
    resumo: 'Prevenção de osteoporose, fraturas e perda de força.',
    corpo: [
      'Depois da menopausa a perda de massa óssea acelera. Avaliamos o risco de fratura com densitometria e o FRAX, além da ingestão de cálcio e vitamina D.',
      'Força muscular também é medida, porque músculos fortes protegem os ossos e a autonomia.',
    ] },
  { slug: 'tireoide', tema: 'metabolismo', titulo: 'Tireoide',
    resumo: 'Hipotireoidismo, hipertireoidismo e nódulos.',
    corpo: [
      'Alterações da tireoide são comuns em mulheres e podem ter sintomas parecidos com os do climatério, como cansaço, ganho de peso e alteração do humor.',
      'O diagnóstico é feito com exames e o tratamento é acompanhado de perto.',
    ] },
]

/* ---------- Página do Programa Longevidade (sem valores) ---------- */
export const PROGRAMA = {
  titulo: 'Programa Longevidade',
  sub: 'Uma jornada estruturada de cuidado, construída a partir dos seus pilares de saúde.',
  tese: 'Prescrever é a parte simples. Mudar sono, alimentação, força e rotina leva tempo, e não acontece em uma consulta. No programa, cada encontro parte do anterior: os dados são comparados e as mudanças se somam.',
  avulsa: ['Cada visita recomeça do zero', 'Exames lidos um de cada vez', 'Dúvidas guardadas até a próxima consulta', 'Orientação de memória, sem nada por escrito'],
  programa: ['Cada encontro parte do anterior', 'Medidas e exames comparados lado a lado', 'Check-in toda semana com resposta da equipe', 'Plano de cuidado e Mapa da Saúde por escrito, sempre à mão'],
  pilares: {
    titulo: 'Seus pilares de saúde',
    texto: 'O programa começa pela avaliação dos pilares de qualidade de vida e longevidade. A partir do que cada pilar mostra, montamos um plano específico para as áreas que pedem mais atenção.',
    // CONFIRMAR com a Dra. Bartira: lista final e qual pilar entra em cada encontro
    itens: [
      ['Hormônios', 'Sintomas do climatério, tireoide e equilíbrio hormonal.'],
      ['Metabolismo', 'Peso, glicose, colesterol e gordura abdominal.'],
      ['Músculo', 'Massa muscular e força, medidas a cada encontro.'],
      ['Osso', 'Risco de fratura, cálcio e vitamina D.'],
      ['Coração', 'Risco cardiovascular calculado e acompanhado.'],
      ['Sono e humor', 'Questionários validados e tratamento da causa.'],
      ['Alimentação e rotina', 'Comportamento alimentar, movimento e hábitos.'],
    ] as Array<[string, string]>,
  },
  tempos: [
    ['1 semana', 'Você começa a sentir', 'Primeiros ajustes de rotina e de medicação, quando indicada.'],
    ['1 mês', 'Os sintomas costumam ceder', 'Calorões e sono são os primeiros a responder, em geral.'],
    ['3 meses', 'Os exames mostram', 'Primeira comparação objetiva dos exames de sangue.'],
    ['6 meses', 'O corpo muda de composição', 'Músculo, gordura e medidas comparados ao início.'],
    ['12 meses', 'O osso responde', 'Tempo da densitometria comparada, no formato Anual.'],
  ] as Array<[string, string, string]>,
  jornada: [
    ['Antes', 'Você responde os questionários e faz os exames pedidos. Assim o primeiro encontro já começa com dados.'],
    ['Consulta inicial', 'Avaliação completa da sua história, sintomas e riscos. É aqui que conversamos sobre o programa.'],
    ['Mês 1', 'Ajuste fino do plano de cuidado e da tolerância à medicação, com check-in toda semana.'],
    ['Mês 3', 'Encontro de seguimento com a primeira prova objetiva nos exames.'],
    ['Mês 6', 'Encontro de encerramento com tudo comparado e o Mapa da Saúde refeito.'],
  ] as Array<[string, string]>,
  medidas: [
    ['Bioimpedância', 'Músculo, gordura e água, comparados ao encontro anterior'],
    ['Circunferências', 'Abdominal e de pescoço, sempre nos mesmos pontos'],
    ['Força de preensão', 'Dinamometria, um sinal de saúde muscular'],
    ['Conduta', 'Prescrição revista e ajustada ao que mudou'],
  ] as Array<[string, string]>,
  entregas: [
    ['Mapa da Saúde', 'Um retrato da sua saúde por áreas, feito no início e refeito no fim.'],
    ['Plano de cuidado por escrito', 'Tudo o que foi combinado, com cada medicação, para que serve e como usar.'],
    ['Checklist de rotina', 'No máximo duas mudanças por vez, para que elas fiquem.'],
    ['Plano alimentar', 'Quando indicado, com a nutricionista parceira.'],
    ['App da paciente', 'Plano de cuidado, receitas, check-in semanal, questionários e sua evolução em gráficos.'],
    ['Biblioteca de vídeos', 'Como aplicar a medicação, como medir peso e cintura em casa, como se preparar para a consulta.'],
  ] as Array<[string, string]>,
  niveis: ['Essencial', 'Completo', 'Anual'],
  comparativo: [
    ['Duração', '6 meses', '6 meses', '12 meses'],
    ['Encontros com a Dra. Bartira', '3', '3', '5'],
    ['Bioimpedância, circunferências e força', true, true, true],
    ['Plano de cuidado, checklist e check-in semanal', true, true, true],
    ['Biblioteca de vídeos e app', true, true, true],
    ['Mapa da Saúde', '2 vezes', '2 vezes', '3 vezes'],
    ['Avaliação de longevidade', 'básica', 'completa', 'seriada'],
    ['Idade vascular', false, 'início e fim', 'início e fim'],
    ['Avaliação cardiovascular com cardiologista', false, '1 vez', '2 vezes'],
    ['Consultas com nutricionista', false, '2', '3'],
    ['Densitometria comparada', false, false, true],
    ['Prioridade de agenda', false, false, true],
  ] as Array<[string, ...Array<string | boolean>]>,
  paraQuem: ['Mulheres a partir dos 40 anos, ou antes quando há sintomas de climatério (menopausa precoce ou prematura)', 'Quem quer entender o que está acontecendo com o próprio corpo', 'Quem convive com obesidade ou alteração de glicose e colesterol', 'Quem quer prevenir perda óssea, risco cardiovascular e perda de força'],
  naoE: ['Para quem deseja usar anabolizantes ou peptídeos para fins estéticos', 'Para quem espera resultados sem mudar hábitos'],
  suporte: [
    ['Está no seu plano de cuidado', 'Você consulta no app, a qualquer hora', 'na hora'],
    ['Dúvida sobre o tratamento', 'Check-in do programa', 'até 3 dias úteis'],
    ['Possível reação ao tratamento', 'Check-in com sinalização para a médica', 'no mesmo dia'],
    ['Exame que faltou na conduta', 'Contato curto com a equipe', 'até 7 dias'],
    ['Urgência', 'Pronto-socorro, sem esperar o check-in', 'imediato'],
  ] as Array<[string, string, string]>,
  perguntas: [
    ['Os exames estão incluídos?', 'Os exames de laboratório e de imagem são feitos fora, pelo plano de saúde ou particular. A solicitação, a leitura e a comparação fazem parte do programa.'],
    ['A consulta inicial faz parte do programa?', 'Não. Ela é a avaliação completa que vem antes, e é nela que conversamos se o programa faz sentido para você.'],
    ['Posso trocar de formato depois?', 'Sim. É possível começar no Essencial e ampliar, conversando com a equipe.'],
    ['Como falo com a equipe entre os encontros?', 'Pelo check-in do app, toda semana. É por ele que a equipe acompanha você e responde.'],
    ['Onde acontecem os encontros?', 'Na Clínica Equilibre e no Instituto Espinel, em Natal. Alguns encontros podem ser por teleconsulta.'],
  ] as Array<[string, string]>,
}
