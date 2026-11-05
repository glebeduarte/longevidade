/**
 * Textos do site público. Versão inicial, escrita antes das respostas do briefing.
 * Tudo que estiver marcado com CONFIRMAR depende da Dra. Bartira.
 */
import type { Tema } from '../components/icones'

export const CONTATO = {
  // CONFIRMAR: número do WhatsApp da secretária, só dígitos com DDI e DDD (ex.: 5584999999999)
  whatsapp: '',
  mensagemWhatsapp: 'Olá! Vim pelo site e gostaria de agendar uma consulta com a Dra. Bartira.',
  instagram: 'https://www.instagram.com/', // CONFIRMAR: perfil da Dra. Bartira
  crm: 'CRM-RN 5297',
  rqe: 'RQE 2986',
}

/** Para onde o botão "Agendar consulta" leva. Sem WhatsApp definido, vai para a página de contato. */
export const linkAgendar = () =>
  CONTATO.whatsapp ? `https://wa.me/${CONTATO.whatsapp}?text=${encodeURIComponent(CONTATO.mensagemWhatsapp)}` : '/contato#agendar'

export const LOCAIS = [
  { nome: 'Clínica Equilibre', endereco: 'Endereço a confirmar, Natal/RN', horario: 'Dias e horários a confirmar', mapa: '' },
  { nome: 'Instituto Spinel', endereco: 'Endereço a confirmar, Natal/RN', horario: 'Dias e horários a confirmar', mapa: '' },
]

export const NAV: Array<[string, string]> = [
  ['/sobre', 'Sobre'], ['/programa', 'Programa Longevidade'], ['/temas', 'Temas'], ['/conteudos', 'Conteúdos'], ['/contato', 'Contato'],
]

export const INICIO = {
  sobretitulo: 'Endocrinologia · Climatério e longevidade feminina',
  titulo: 'Seu corpo mudou. Te ajudo a entender e a cuidar dele.',
  texto: 'Acompanho mulheres na perimenopausa, na menopausa e depois dela, com exames, escuta e um plano feito para a sua rotina. Ciência e acolhimento na mesma consulta.',
}

export const PARA_QUEM: Array<{ tema: Tema; titulo: string; texto: string }> = [
  { tema: 'fogacho', titulo: 'Calorões, sono e humor', texto: 'Sintomas do climatério que atrapalham o dia e a noite, e as opções seguras para cada caso.' },
  { tema: 'metabolismo', titulo: 'Peso e metabolismo', texto: 'Ganho de peso, gordura na barriga, glicose e colesterol que mudam com os hormônios.' },
  { tema: 'forca', titulo: 'Ossos, músculos e energia', texto: 'Prevenção de osteoporose e perda de massa muscular para envelhecer com força e autonomia.' },
]

export const PASSOS = [
  { titulo: 'Encontro inicial', texto: 'Uma consulta longa para entender sua história, seus sintomas e seus objetivos.' },
  { titulo: 'Exames e avaliação', texto: 'Exames, bioimpedância, força e questionários de sono, humor e hábitos.' },
  { titulo: 'Seu protocolo', texto: 'Um plano por escrito, com medicações quando indicadas, alimentação, sono e movimento.' },
  { titulo: 'Acompanhamento semanal', texto: 'Check-in toda semana pelo app e resposta da equipe às sextas-feiras.' },
]

export const SOBRE = {
  resumo: 'Endocrinologista em Natal, dedicada à saúde da mulher no climatério e ao envelhecimento com qualidade.',
  // CONFIRMAR: trajetória, formação, títulos e sociedades
  paragrafos: [
    'Escolhi cuidar de mulheres numa fase da vida em que muitas se sentem sozinhas e sem respostas. Calorões, noites mal dormidas, mudanças no corpo e no humor costumam ser tratados como algo a aguentar em silêncio. Não precisa ser assim.',
    'Meu trabalho junta o que a ciência mostra de mais atual com tempo para ouvir. Cada decisão é explicada, cada risco é colocado na mesa, e o plano é construído com a paciente, não para ela.',
    'Também escrevi o guia "Mulheres em Transformação" e o e-book "Climatério sem Tabu", para que mais mulheres tenham acesso a informação clara sobre essa fase.',
  ],
  formacao: [
    // CONFIRMAR: cada item com ano e instituição
    'Graduação em Medicina',
    'Residência em Endocrinologia e Metabologia',
    'Título de especialista em Endocrinologia (RQE 2986)',
  ],
}

export type Plano = { slug: string; nome: string; duracao: string; encontros: string; inclui: string[]; destaque?: boolean }
export const PLANOS: Plano[] = [
  { slug: 'essencial', nome: 'Essencial', duracao: '6 meses', encontros: '3 encontros com a Dra. Bartira',
    inclui: ['Avaliação completa e exames', 'Protocolo personalizado', 'Check-in semanal pelo app', 'Mapa da Saúde ao final'] },
  { slug: 'completo', nome: 'Completo', duracao: '6 meses', encontros: '3 encontros com a Dra. Bartira', destaque: true,
    inclui: ['Tudo do Essencial', 'Consulta com cardiologista parceiro', 'Consulta com nutricionista parceira'] },
  { slug: 'anual', nome: 'Anual', duracao: '12 meses', encontros: '5 encontros com a Dra. Bartira',
    inclui: ['Tudo do Completo', 'Acompanhamento por um ano inteiro', 'Reavaliação de exames ao longo do ano'] },
]

export const APP_PACIENTE = [
  'Seu protocolo sempre à mão, com receitas e como usar cada medicamento',
  'Check-in semanal em poucos minutos',
  'Questionários de sono, humor e hábitos antes dos encontros',
  'Sua evolução em gráficos, encontro após encontro',
]

export const PERGUNTAS: Array<[string, string]> = [
  ['Preciso estar na menopausa para participar?', 'Não. O programa atende mulheres na perimenopausa, quando os ciclos começam a mudar, e depois da menopausa.'],
  ['O programa inclui terapia hormonal?', 'Só quando for indicada e segura para você. Essa decisão é tomada na consulta, depois da avaliação completa.'],
  ['Atende por plano de saúde?', 'A confirmar.'], // CONFIRMAR
  ['Posso fazer as consultas on-line?', 'A confirmar.'], // CONFIRMAR
  ['Como funciona o check-in semanal?', 'Toda semana você responde algumas perguntas pelo app sobre sintomas, sono, hábitos e medicamentos. A equipe lê e responde às sextas-feiras.'],
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
  { slug: 'sono', tema: 'sono', titulo: 'Sono',
    resumo: 'Insônia, despertares e cansaço durante o dia.',
    corpo: [
      'Dormir mal é uma das queixas mais comuns no climatério. Calorões noturnos, ansiedade e apneia do sono estão entre as causas.',
      'Usamos questionários validados para entender o seu sono e tratamos a causa, não só o sintoma.',
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
