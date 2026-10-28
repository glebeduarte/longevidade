import type { Nivel } from './faixas'

export type Faixa = { max: number | null; level: Nivel }
export type Indicador = { code: string; name: string; unit: string; grp: string; kind: 'exame' | 'medida'; core: boolean; sort: number; bands: Faixa[]; reviewed: boolean }
export type Medida = { id: string; code: string; value: number; measured_at: string; note: string | null }

export const ORDEM: Nivel[] = ['ruim', 'atencao', 'normal', 'bom', 'otimo']
export const PONTOS: Record<Nivel, number> = { ruim: 10, atencao: 35, normal: 60, bom: 80, otimo: 100 }

export const GRUPOS: Record<string, string> = {
  metabolismo: 'Metabolismo', cardiovascular: 'Cardiovascular', figado: 'Fígado', rins: 'Rins',
  fisico: 'Força e capacidade', hormonios: 'Hormônios', outros: 'Outros',
}

export function nivelDe(v: number | null | undefined, bands: Faixa[]): Nivel | null {
  if (v == null || !bands.length) return null
  for (const b of bands) if (b.max == null || v < b.max) return b.level
  return bands[bands.length - 1].level
}

/** Última medida por código, com a anterior para comparar. */
export function ultimas(lista: Medida[]) {
  const m = new Map<string, Medida[]>()
  ;[...lista].sort((a, b) => b.measured_at.localeCompare(a.measured_at)).forEach(x => m.set(x.code, [...(m.get(x.code) ?? []), x]))
  return m
}

export const idadeEm = (nasc: string | null, ref = new Date()) =>
  nasc ? Math.floor((ref.getTime() - new Date(nasc).getTime()) / 3.15576e10) : null

// Calculados, com fórmula publicada
export type Calculado = { code: string; name: string; unit: string; grp: string; value: number; bands: Faixa[]; formula: string }

const F = (pares: Array<[number | null, Nivel]>): Faixa[] => pares.map(([max, level]) => ({ max, level }))

export function calculados(ult: Map<string, Medida[]>, idade: number | null, sexo: 'F' | 'M' = 'F'): Calculado[] {
  const v = (c: string) => ult.get(c)?.[0]?.value
  const out: Calculado[] = []
  const peso = v('peso'), alt = v('altura')
  if (peso && alt) out.push({ code: 'imc', name: 'IMC', unit: 'kg/m²', grp: 'metabolismo', value: peso / (alt / 100) ** 2, formula: 'peso ÷ altura²',
    bands: F([[18.5, 'atencao'], [25, 'otimo'], [27, 'bom'], [30, 'atencao'], [null, 'ruim']]) })
  const ct = v('ct'), hdl = v('hdl')
  if (ct && hdl) out.push({ code: 'ct_hdl', name: 'Colesterol total / HDL', unit: '', grp: 'cardiovascular', value: ct / hdl, formula: 'CT ÷ HDL',
    bands: F([[3, 'otimo'], [3.5, 'bom'], [4.4, 'normal'], [5, 'atencao'], [null, 'ruim']]) })
  const cr = v('creatinina')
  if (cr && idade != null) {
    const k = sexo === 'F' ? 0.7 : 0.9, a = sexo === 'F' ? -0.241 : -0.302
    const tfg = 142 * Math.min(cr / k, 1) ** a * Math.max(cr / k, 1) ** -1.2 * 0.9938 ** idade * (sexo === 'F' ? 1.012 : 1)
    out.push({ code: 'tfg', name: 'Função renal (TFG)', unit: 'ml/min/1,73m²', grp: 'rins', value: tfg, formula: 'CKD-EPI 2021',
      bands: F([[30, 'ruim'], [60, 'atencao'], [90, 'normal'], [null, 'otimo']]) })
  }
  const tgo = v('tgo'), tgp = v('tgp'), plq = v('plaquetas')
  if (tgo && tgp && plq && idade != null) out.push({ code: 'fib4', name: 'FIB-4', unit: '', grp: 'figado', value: (idade * tgo) / (plq * Math.sqrt(tgp)), formula: 'idade × TGO ÷ (plaquetas × √TGP)',
    bands: F([[1.3, 'otimo'], [2.67, 'atencao'], [null, 'ruim']]) })
  return out
}

/** Framingham, risco geral de DCV em 10 anos (D'Agostino 2008). Retorna fração 0 a 1. */
export function framingham(p: { sexo: 'F' | 'M'; idade: number; ct: number; hdl: number; pas: number; tratada: boolean; fuma: boolean; diabetes: boolean }) {
  const c = p.sexo === 'F'
    ? { age: 2.32888, tc: 1.20904, hdl: -0.70833, sbpU: 2.76157, sbpT: 2.82263, smk: 0.52873, dm: 0.69154, s0: 0.95012, mean: 26.1931 }
    : { age: 3.06117, tc: 1.1237, hdl: -0.93263, sbpU: 1.93303, sbpT: 1.99881, smk: 0.65451, dm: 0.57367, s0: 0.88936, mean: 23.9802 }
  const soma = c.age * Math.log(p.idade) + c.tc * Math.log(p.ct) + c.hdl * Math.log(p.hdl)
    + (p.tratada ? c.sbpT : c.sbpU) * Math.log(p.pas) + (p.fuma ? c.smk : 0) + (p.diabetes ? c.dm : 0)
  return 1 - c.s0 ** Math.exp(soma - c.mean)
}

export const nivelRiscoCV = (r: number): Nivel => (r < 0.05 ? 'otimo' : r < 0.1 ? 'normal' : r < 0.2 ? 'atencao' : 'ruim')

// Fatores de risco: mesmas 8 perguntas do assistente do Life Up
export type Fatores = {
  sex: 'F' | 'M'; ethnicity: string | null; smoking: string | null; diseases: string[]; parent_diabetes: boolean | null
  meds: string[]; colonoscopy: boolean | null; family_cvd: boolean | null; cvd: string[]
}
export const FATORES_VAZIO: Fatores = { sex: 'F', ethnicity: null, smoking: null, diseases: [], parent_diabetes: null, meds: [], colonoscopy: null, family_cvd: null, cvd: [] }

type Passo =
  | { campo: 'ethnicity' | 'smoking'; tipo: 'uma'; pergunta: string; opcoes: string[] }
  | { campo: 'diseases' | 'meds' | 'cvd'; tipo: 'varias'; pergunta: string; opcoes: string[]; nota?: string }
  | { campo: 'parent_diabetes' | 'colonoscopy' | 'family_cvd'; tipo: 'simnao'; pergunta: string }

export const PASSOS: Passo[] = [
  { campo: 'ethnicity', tipo: 'uma', pergunta: 'Etnia', opcoes: ['Branca', 'Preta', 'Parda', 'Asiática', 'Indígena', 'Não declarada'] },
  { campo: 'smoking', tipo: 'uma', pergunta: 'Fuma?', opcoes: ['Não fumante', 'Ex-fumante', 'Leve, até 9 cigarros por dia', 'Moderada, 10 a 19 por dia', 'Pesada, 20 ou mais por dia'] },
  { campo: 'diseases', tipo: 'varias', pergunta: 'Tem alguma destas doenças?', opcoes: ['Diabetes', 'HIV/aids', 'DPOC', 'Câncer em tratamento'] },
  { campo: 'parent_diabetes', tipo: 'simnao', pergunta: 'Pai ou mãe tem diabetes?' },
  { campo: 'meds', tipo: 'varias', pergunta: 'Usa medicação para:', opcoes: ['Pressão alta', 'Colesterol ou triglicerídeos', 'Humor', 'Sono', 'Diabetes ou glicose alta'] },
  { campo: 'colonoscopy', tipo: 'simnao', pergunta: 'Fez colonoscopia nos últimos 10 anos?' },
  { campo: 'family_cvd', tipo: 'simnao', pergunta: 'Parente de primeiro grau com doença cardiovascular precoce (homem antes dos 55, mulher antes dos 65)?' },
  { campo: 'cvd', tipo: 'varias', pergunta: 'Tem ou teve alguma doença cardiovascular?', opcoes: ['Infarto', 'AVC', 'AIT', 'Angina', 'Claudicação intermitente', 'Insuficiência cardíaca', 'Fibrilação atrial', 'Outra'],
    nota: 'Com doença cardiovascular presente, o risco em 10 anos não é calculado.' },
]

export const respondido = (f: Fatores, campo: keyof Fatores) => {
  const v = f[campo]
  return Array.isArray(v) ? true : v != null
}

// Estilo de vida: questionários por domínio, como no relatório do Life Up
export const DOMINIOS: Array<{ nome: string; slugs: string[] }> = [
  { nome: 'Humor', slugs: ['phq9', 'gad7', 'menod'] },
  { nome: 'Sono', slugs: ['isi', 'stopbang'] },
  { nome: 'Alimentação', slugs: ['dst', 'integrais', 'ultraprocessados'] },
  { nome: 'Álcool', slugs: ['auditc'] },
  { nome: 'Cigarro', slugs: ['cigarro'] },
  { nome: 'Atividade física', slugs: ['atividade'] },
  { nome: 'Cognição', slugs: ['brainfog'] },
]

export const pior = (niveis: Array<Nivel | null | undefined>): Nivel | null => {
  const v = niveis.filter(Boolean) as Nivel[]
  return v.length ? v.reduce((a, b) => (ORDEM.indexOf(a) <= ORDEM.indexOf(b) ? a : b)) : null
}

export const fmt = (v: number, casas = 1) => v.toLocaleString('pt-BR', { maximumFractionDigits: casas })
