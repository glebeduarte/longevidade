/** Módulos de risco do material da Dra. Bartira (28/10/2026): PREVENT, ajustes FRAX Brasil, TEV, preensão e cálcio. */

// ---------- PREVENT (AHA), modelo base ----------
// Coeficientes oficiais (Khan et al., Circulation 2024), na ordem dos preditores abaixo,
// conferidos com o pacote preventr (CRAN). Validação: exemplo da Tabela S25 em riscos.test.
const PREVENT: Record<'10yr' | '30yr', Record<string, number[]>> = {
  '10yr': {
    female_total_cvd: [0.793933, 0.030524, -0.160686, -0.2394, 0.360078, 0.86676, 0.536074, 0.0, 0.0, 0.604592, 0.043377, 0.315167, -0.147765, -0.066361, 0.119788, -0.081972, 0.030677, -0.094635, -0.27057, -0.078715, 0.0, -0.163781, -3.307728],
    male_total_cvd: [0.768853, 0.073617, -0.095443, -0.434735, 0.336266, 0.769286, 0.438687, 0.0, 0.0, 0.537898, 0.016483, 0.288879, -0.133735, -0.047592, 0.150273, -0.051787, 0.019117, -0.104948, -0.225195, -0.089507, 0.0, -0.15437, -3.031168],
    female_ascvd: [0.719883, 0.117697, -0.151185, -0.083536, 0.359285, 0.834858, 0.483108, 0.0, 0.0, 0.486462, 0.039778, 0.226531, -0.059237, -0.039576, 0.084442, -0.056784, 0.032569, -0.103598, -0.241754, -0.079114, 0.0, -0.167149, -3.819975],
    male_ascvd: [0.709985, 0.165866, -0.114429, -0.283721, 0.323998, 0.71896, 0.395697, 0.0, 0.0, 0.369007, 0.020362, 0.203652, -0.086558, -0.032292, 0.114563, -0.03, 0.023275, -0.092702, -0.201852, -0.097053, 0.0, -0.121708, -3.500655],
    female_heart_failure: [0.899823, 0.0, 0.0, -0.455977, 0.35765, 1.038346, 0.583916, -0.007229, 0.299771, 0.745164, 0.055709, 0.353444, 0.0, -0.098151, 0.0, 0.0, 0.0, -0.094666, -0.358104, -0.115945, -0.003878, -0.188429, -4.310409],
    male_heart_failure: [0.897264, 0.0, 0.0, -0.681147, 0.363446, 0.923776, 0.502374, -0.048584, 0.372693, 0.692692, 0.025183, 0.298092, 0.0, -0.049773, 0.0, 0.0, 0.0, -0.12892, -0.304092, -0.140169, 0.006813, -0.179778, -3.946391],
  },
  '30yr': {
    female_total_cvd: [0.550308, -0.092837, 0.040979, -0.166331, -0.162865, 0.32995, 0.679389, 0.319611, 0.0, 0.0, 0.18571, 0.055353, 0.2894, -0.075688, -0.056367, 0.107102, -0.075144, 0.030179, -0.099878, -0.320617, -0.160786, 0.0, -0.145079, -1.318827],
    male_total_cvd: [0.462731, -0.098428, 0.083609, -0.102982, -0.214035, 0.290432, 0.533128, 0.214191, 0.0, 0.0, 0.115556, 0.060378, 0.232714, -0.027211, -0.038449, 0.134192, -0.051176, 0.016587, -0.110144, -0.258594, -0.156641, 0.0, -0.116678, -1.148204],
    female_ascvd: [0.46692, -0.089312, 0.12569, -0.154225, -0.001809, 0.322949, 0.629671, 0.268292, 0.0, 0.0, 0.100106, 0.049966, 0.187529, 0.015248, -0.027612, 0.073615, -0.052196, 0.031692, -0.10461, -0.272779, -0.153091, 0.0, -0.129915, -1.974074],
    male_ascvd: [0.39941, -0.093748, 0.174464, -0.120203, -0.066512, 0.275304, 0.479026, 0.178263, 0.0, 0.0, -0.021879, 0.060255, 0.142118, 0.0136, -0.021826, 0.101315, -0.031262, 0.020673, -0.092093, -0.215995, -0.154881, 0.0, -0.071255, -1.736444],
    female_heart_failure: [0.625437, -0.098304, 0.0, 0.0, -0.391924, 0.314229, 0.833079, 0.343865, 0.059487, 0.252554, 0.298164, 0.066716, 0.333921, 0.0, -0.089318, 0.0, 0.0, 0.0, -0.09743, -0.404855, -0.198299, -0.003562, -0.156421, -2.205379],
    male_heart_failure: [0.568154, -0.104839, 0.0, 0.0, -0.476156, 0.30324, 0.684034, 0.265627, 0.083311, 0.26999, 0.25418, 0.063892, 0.258363, 0.0, -0.039194, 0.0, 0.0, 0.0, -0.126912, -0.327357, -0.204302, -0.018283, -0.134262, -1.95751],
  },
}

export type EntradaPrevent = {
  sexo: 'F' | 'M'; idade: number; pas: number; ct: number; hdl: number; tfg: number; imc: number
  diabetes: boolean; fuma: boolean; estatina: boolean; antiHas: boolean
}
export type Desfechos = { cvd: number; ascvd: number; ic: number }

export const LIMITES_PREVENT: Record<string, [number, number, string]> = {
  idade: [30, 79, 'Idade'], pas: [90, 200, 'PAS'], ct: [130, 320, 'Colesterol total'], hdl: [20, 100, 'HDL'],
  tfg: [15, 140, 'TFGe'], imc: [18.5, 39.9, 'IMC'],
}

export function foraDosLimites(e: Partial<EntradaPrevent>) {
  return Object.entries(LIMITES_PREVENT).filter(([k, [a, b]]) => {
    const v = e[k as keyof EntradaPrevent] as number | undefined
    return v == null || Number.isNaN(v) || v < a || v > b
  }).map(([, [a, b, n]]) => `${n} (${a} a ${b})`)
}

function preditores(e: EntradaPrevent, anos: '10yr' | '30yr') {
  const age = (e.idade - 55) / 10
  const nonHdl = (e.ct - e.hdl) * 0.02586 - 3.5
  const hdl = (e.hdl * 0.02586 - 1.3) / 0.3
  const sbpLt = (Math.min(e.pas, 110) - 110) / 20, sbpGe = (Math.max(e.pas, 110) - 130) / 20
  const dm = +e.diabetes, smk = +e.fuma, bp = +e.antiHas, st = +e.estatina
  const bmiLt = (Math.min(e.imc, 30) - 25) / 5, bmiGe = (Math.max(e.imc, 30) - 30) / 5
  const egLt = (Math.min(e.tfg, 60) - 60) / -15, egGe = (Math.max(e.tfg, 60) - 90) / -15
  const x = [age, nonHdl, hdl, sbpLt, sbpGe, dm, smk, bmiLt, bmiGe, egLt, egGe, bp, st, bp * sbpGe, st * nonHdl,
    age * nonHdl, age * hdl, age * sbpGe, age * dm, age * smk, age * bmiGe, age * egLt, 1]
  if (anos === '30yr') x.splice(1, 0, age * age)
  return x
}

function modelo(e: EntradaPrevent, anos: '10yr' | '30yr'): Desfechos {
  const s = e.sexo === 'F' ? 'female' : 'male', x = preditores(e, anos)
  const p = (nome: string) => { const lo = PREVENT[anos][`${s}_${nome}`].reduce((t, b, i) => t + b * x[i], 0); return Math.exp(lo) / (1 + Math.exp(lo)) }
  return { cvd: p('total_cvd'), ascvd: p('ascvd'), ic: p('heart_failure') }
}

/** Risco absoluto em 10 anos (30 a 79) e em 30 anos (30 a 59). */
export function prevent(e: EntradaPrevent) {
  return { dez: modelo(e, '10yr'), trinta: e.idade <= 59 ? modelo(e, '30yr') : null }
}

/** Classificação do ASCVD em 10 anos (AHA/ACC 2026). Não vale para DCV total nem IC. */
export function classeAscvd(r: number): { rotulo: string; nivel: 'otimo' | 'normal' | 'atencao' | 'ruim' } {
  if (r < 0.03) return { rotulo: 'Baixo', nivel: 'otimo' }
  if (r < 0.05) return { rotulo: 'Limítrofe', nivel: 'normal' }
  if (r < 0.10) return { rotulo: 'Intermediário', nivel: 'atencao' }
  return { rotulo: 'Alto', nivel: 'ruim' }
}

// ---------- FRAX Brasil 2.0: ajustes ABRASSO sobre o resultado oficial ----------
export type AjusteFrax = { id: string; rotulo: string; fom: number; fq: number }
export const AJUSTES_FRAX: AjusteFrax[] = [
  { id: 'nenhum', rotulo: 'Nenhum ajuste', fom: 1, fq: 1 },
  { id: 'gc75', rotulo: 'Glicocorticoide ≥7,5 mg/dia', fom: 1.15, fq: 1.20 },
  { id: 'fx2', rotulo: 'Duas fraturas prévias', fom: 1.10, fq: 1.10 },
  { id: 'fx3', rotulo: 'Três fraturas prévias', fom: 1.20, fq: 1.20 },
  { id: 'fx4', rotulo: 'Quatro ou mais fraturas prévias', fom: 1.30, fq: 1.30 },
  { id: 'queda1', rotulo: 'Uma queda no último ano', fom: 1.20, fq: 1.20 },
  { id: 'queda2', rotulo: 'Duas quedas no último ano', fom: 1.30, fq: 1.50 },
  { id: 'queda3', rotulo: 'Três ou mais quedas no último ano', fom: 1.70, fq: 2.00 },
  { id: 'tscore', rotulo: 'Divergência de T-score (FOM ×1,10 por ponto)', fom: 1.10, fq: 1 },
]
/** Aplica um único fator, o mais relevante, como orienta a ABRASSO. */
export function ajustarFrax(fom: number, fq: number, id: string, pontosT = 1) {
  const a = AJUSTES_FRAX.find(x => x.id === id) ?? AJUSTES_FRAX[0]
  const mFom = id === 'tscore' ? a.fom ** Math.max(1, Math.round(pontosT)) : a.fom
  return { fom: Math.min(100, fom * mFom), fq: Math.min(100, fq * a.fq), ajuste: a }
}

// ---------- TEV: triagem antes da terapia hormonal ----------
export type EntradaTev = {
  previo: 'nao' | 'sim'; previo_detalhe?: string
  familiar: 'nao' | 'sim' | 'desconhecido'; familiar_detalhe?: string
  trombofilia: 'nao' | 'sim' | 'desconhecido'; trombofilia_detalhe?: string
  idade?: number; imc?: number; tabagismo: 'nunca' | 'ex' | 'atual'; cancer: boolean
  cirurgia: boolean; cirurgia_detalhe?: string; estrogeno: 'nenhum' | 'oral' | 'transdermico'; estrogeno_dose?: string; outros?: string
}
export type NivelTev = 'sem' | 'avaliar' | 'prioritario'
export const ROTULO_TEV: Record<NivelTev, string> = {
  sem: 'Sem fatores identificados', avaliar: 'Fatores que exigem avaliação', prioritario: 'Alerta clínico prioritário',
}
export function triagemTev(e: EntradaTev): { nivel: NivelTev; motivos: string[] } {
  const p: string[] = [], a: string[] = []
  if (e.previo === 'sim') p.push('TEV prévio')
  if (e.trombofilia === 'sim') p.push('Trombofilia conhecida')
  if (e.cancer) p.push('Câncer ativo')
  if (e.familiar === 'sim') a.push('TEV em familiar de 1º grau')
  if (e.trombofilia === 'desconhecido') a.push('Trombofilia: desconhecido')
  if ((e.imc ?? 0) >= 30) a.push('IMC ≥ 30')
  if (e.tabagismo === 'atual') a.push('Tabagismo atual')
  if (e.cirurgia) a.push('Cirurgia ou imobilização recente')
  if (e.estrogeno === 'oral') a.push('Estrogênio oral (maior risco que transdérmico)')
  if (e.outros?.trim()) a.push(`Outros: ${e.outros.trim()}`)
  return { nivel: p.length ? 'prioritario' : a.length ? 'avaliar' : 'sem', motivos: [...p, ...a] }
}

// ---------- Força de preensão (EWGSOP2) ----------
export const CORTE_PREENSAO = { F: 16, M: 27 }
export function preensao(sexo: 'F' | 'M', tentativas: number[]) {
  const validas = tentativas.filter(v => v > 0)
  const max = validas.length ? Math.max(...validas) : null
  return { max, baixa: max != null && max < CORTE_PREENSAO[sexo], corte: CORTE_PREENSAO[sexo] }
}

// ---------- Cálcio alimentar ----------
export type Alimento = { id: string; nome: string; porcao: string; mg: number; faixa?: string }
export const ALIMENTOS: Alimento[] = [
  { id: 'leite', nome: 'Leite de vaca', porcao: '200 mL', mg: 240 },
  { id: 'iogurte', nome: 'Iogurte natural', porcao: '170 g', mg: 200 },
  { id: 'coalhada', nome: 'Coalhada natural', porcao: '170 g', mg: 200, faixa: 'varia por produto' },
  { id: 'minas', nome: 'Queijo minas frescal', porcao: '30 g', mg: 170, faixa: 'varia por produto' },
  { id: 'mucarela', nome: 'Muçarela', porcao: '30 g', mg: 185, faixa: '150 a 220 mg' },
  { id: 'parmesao', nome: 'Parmesão', porcao: '20 g', mg: 220, faixa: '200 a 240 mg' },
  { id: 'ricota', nome: 'Ricota', porcao: '50 g', mg: 115, faixa: '100 a 130 mg' },
  { id: 'leite_po', nome: 'Leite em pó', porcao: '20 g', mg: 220, faixa: '180 a 260 mg' },
  { id: 'vegetal', nome: 'Bebida vegetal fortificada', porcao: '200 mL', mg: 240, faixa: 'usar o rótulo' },
]
export type ItemCalcio = { nome: string; mg: number; porcoes: number; vezes: number; por: 'dia' | 'semana' }
/** mg/dia = mg da porção × porções × vezes por semana ÷ 7 (diário conta 7 vezes por semana). */
export const mgDia = (i: ItemCalcio) => (i.mg * i.porcoes * (i.por === 'dia' ? i.vezes * 7 : i.vezes)) / 7
export function metaCalcio(sexo: 'F' | 'M', idade: number | null) {
  if (idade == null) return 1000
  if (sexo === 'F') return idade >= 51 ? 1200 : 1000
  return idade >= 71 ? 1200 : 1000
}
export function calcio(itens: ItemCalcio[], meta: number) {
  const total = itens.reduce((t, i) => t + mgDia(i), 0)
  return { total, meta, diferenca: total - meta, pct: (total / meta) * 100, atingiu: total >= meta }
}
