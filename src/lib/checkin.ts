/** Check-in semanal (material de 28/10/2026): perguntas gerais, blocos por tratamento e sinais de alerta. */

export type Sintoma = { qual: string; inicio: string; relato: string }
export type BlocoGlp1 = {
  fome?: 'maior' | 'igual' | 'menor_ok' | 'muito_baixa'
  proteina?: 'sim' | 'parcial' | 'nao'
  sintomas: string[]
  dv_episodios?: number | null; dv_dias?: number | null; dv_liquidos?: boolean; dv_urina?: boolean
  constipacao_dias?: number | null
}
export type BlocoThm = {
  motivo?: 'melhoraram' | 'iguais' | 'pioraram'; quais: string[]; quais_outro?: string
  sangramento?: 'nao' | 'previsto' | 'fora' | 'nao_sei'
  sang_inicio?: string; sang_dias?: number | null; sang_qtd?: 'pouco' | 'moderado' | 'intenso'
  sang_coagulos?: boolean; sang_dor?: boolean; sang_pos_relacao?: boolean
  efeitos: string[]
}
export type CheckinV2 = {
  v: 2
  geral?: 'muito_bem' | 'bem' | 'regular' | 'mal' | 'muito_mal'
  energia?: number; sono?: number; humor?: number
  dias_alimentacao?: number | 'sem_meta'; dias_atividade?: number; dias_forca?: number
  hidratacao?: 'maioria' | 'alguns' | 'nao'; hidratacao_dificuldade?: string
  medicacao?: 'sim' | 'esqueci' | 'interrompi' | 'diferente'; medicacao_detalhe?: string
  sintoma_novo?: boolean; sintomas: Sintoma[]
  mudancas: string[]
  conquista?: string; dificuldade?: string; duvida?: string
  peso?: number | null
  glp1?: BlocoGlp1; thm?: BlocoThm
  alertas: string[]
  reacao?: boolean; reacao_texto?: string
}

export const GERAL: Array<[NonNullable<CheckinV2['geral']>, string]> = [
  ['muito_bem', 'Muito bem'], ['bem', 'Bem'], ['regular', 'Regular'], ['mal', 'Mal'], ['muito_mal', 'Muito mal'],
]
export const HIDRATACAO: Array<[NonNullable<CheckinV2['hidratacao']>, string]> = [['maioria', 'Na maioria dos dias'], ['alguns', 'Em alguns dias'], ['nao', 'Não']]
export const MEDICACAO: Array<[NonNullable<CheckinV2['medicacao']>, string]> = [
  ['sim', 'Sim, como prescrito'], ['esqueci', 'Esqueci doses'], ['interrompi', 'Interrompi'], ['diferente', 'Usei diferente'],
]
export const MUDANCAS = ['Novo medicamento ou suplemento', 'Infecção', 'Atendimento médico ou internação', 'Cirurgia ou procedimento programado']

export const FOME: Array<[NonNullable<BlocoGlp1['fome']>, string]> = [
  ['maior', 'Maior que antes'], ['igual', 'Sem mudança'], ['menor_ok', 'Menor, mas consigo comer bem'], ['muito_baixa', 'Tão baixa que tenho dificuldade para comer'],
]
export const PROTEINA: Array<[NonNullable<BlocoGlp1['proteina']>, string]> = [['sim', 'Sim'], ['parcial', 'Parcialmente'], ['nao', 'Não']]
export const SINTOMAS_GLP1 = ['Enjoo', 'Vômitos', 'Diarreia', 'Prisão de ventre', 'Refluxo ou azia', 'Estufamento', 'Dor abdominal', 'Tontura', 'Reação no local da aplicação']

export const MOTIVO_THM: Array<[NonNullable<BlocoThm['motivo']>, string]> = [['melhoraram', 'Melhoraram'], ['iguais', 'Ficaram iguais'], ['pioraram', 'Pioraram']]
export const QUAIS_THM = ['Calorões', 'Suor noturno', 'Sono', 'Sintomas íntimos ou urinários']
export const SANGRAMENTO: Array<[NonNullable<BlocoThm['sangramento']>, string]> = [
  ['nao', 'Não'], ['previsto', 'Sim, previsto no esquema'], ['fora', 'Sim, fora do previsto'], ['nao_sei', 'Não sei'],
]
export const EFEITOS_THM = ['Sensibilidade nas mamas', 'Dor de cabeça', 'Enjoo', 'Inchaço', 'Alteração de humor', 'Sonolência', 'Tontura', 'Irritação na pele pelo adesivo, gel ou produto vaginal']

/** Sinais que não devem esperar a sexta-feira. */
export const ALERTAS_GERAIS = [
  'Dor no peito, falta de ar ou tosse com sangue',
  'Inchaço de rosto, língua ou garganta, ou dificuldade para respirar',
]
export const ALERTAS_GLP1 = [
  'Dor forte na barriga que não passa, principalmente indo para as costas',
  'Dor forte do lado direito, em cima da barriga, com febre ou pele e olhos amarelados',
  'Vômitos repetidos, não consigo beber, urino pouco, tontura forte ou desmaio',
  'Barriga muito estufada, com dor, vômitos e sem soltar gases',
  'Hipoglicemia com confusão, desmaio ou precisando de ajuda',
  'Perda súbita ou piora rápida da visão',
]
export const ALERTAS_THM = [
  'Dor e inchaço novos em uma perna',
  'Fraqueza de um lado do corpo, fala alterada ou perda súbita da visão',
  'Dor de cabeça súbita e muito forte, ou com sintomas neurológicos',
  'Sangramento muito intenso, principalmente com tontura, fraqueza ou desmaio',
]

export const vazio = (): CheckinV2 => ({ v: 2, sintomas: [], mudancas: [], alertas: [] })

/** Possíveis reações adversas, em texto curto para o alerta da médica. */
export function textoReacao(a: CheckinV2) {
  const partes: string[] = []
  if (a.sintoma_novo) partes.push(...a.sintomas.filter(s => s.qual.trim()).map(s => `${s.qual.trim()}${s.inicio ? ` (desde ${s.inicio})` : ''}`))
  if (a.glp1?.sintomas.length) partes.push(`GLP-1: ${a.glp1.sintomas.join(', ').toLowerCase()}`)
  if (a.glp1?.fome === 'muito_baixa') partes.push('fome tão baixa que tem dificuldade para comer')
  if (a.thm?.efeitos.length) partes.push(`THM: ${a.thm.efeitos.join(', ').toLowerCase()}`)
  if (a.thm?.sangramento === 'fora') partes.push('sangramento fora do previsto')
  return partes.join('; ')
}

/** Pendências para liberar o envio. */
export function faltando(a: CheckinV2, glp1: boolean, thm: boolean) {
  const f: string[] = []
  if (!a.geral) f.push('como se sentiu')
  if (a.energia == null || a.sono == null || a.humor == null) f.push('notas de energia, sono e humor')
  if (a.dias_alimentacao == null || a.dias_atividade == null) f.push('dias de alimentação e atividade')
  if (!a.hidratacao) f.push('hidratação')
  if (!a.medicacao) f.push('medicamentos')
  if (a.sintoma_novo == null) f.push('sintoma novo')
  if (a.sintoma_novo && !a.sintomas.some(s => s.qual.trim())) f.push('qual foi o sintoma')
  if (glp1 && (!a.glp1?.fome || !a.glp1?.proteina)) f.push('perguntas do GLP-1')
  if (thm && (!a.thm?.motivo || !a.thm?.sangramento)) f.push('perguntas da terapia hormonal')
  return f
}

export const rotulo = <K extends string>(lista: Array<[K, string]>, k?: K) => lista.find(([x]) => x === k)?.[1] ?? '·'
