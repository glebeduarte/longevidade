import type { Nivel } from './faixas'
import { DOMINIOS, PONTOS, calculados, framingham, idadeEm, nivelDe, nivelRiscoCV, pior, ultimas, type Fatores, type Faixa, type Indicador, type Medida } from './clinica'

export type ItemMapa = { code: string; name: string; unit: string; value: number | null; date: string | null; bands: Faixa[]; level: Nivel | null; calc?: string }
export type DominioMapa = { nome: string; level: Nivel | null; itens: Array<{ name: string; score: number | null; label: string | null; level: Nivel | null; date: string }> }
export type Relatorio = {
  gerado_em: string
  paciente: { nome: string; idade: number | null }
  sistemas: Array<{ grp: string; nome: string; itens: ItemMapa[] }>
  forca: ItemMapa[]
  estilo: DominioMapa[]
  risco_cv: { valor: number | null; level: Nivel | null; motivo: string | null }
  problemas: Array<{ title: string; detail: string | null }>
  eixos: Array<{ nome: string; nota: number | null }>
  nota: number | null
}

export type EntradaMapa = {
  nome: string; nascimento: string | null; cat: Indicador[]; med: Medida[]; fatores: Fatores | null
  respostas: Array<{ score: number | null; band_label: string | null; band_level: Nivel | null; submitted_at: string; questionnaires: { slug: string; name: string } | null }>
  problemas: Array<{ title: string; detail: string | null; active: boolean }>
}

const SISTEMAS: Array<[string, string, string[]]> = [
  ['metabolismo', 'Metabolismo', ['peso', 'imc', 'pgc', 'cintura', 'glicose', 'hba1c', 'tsh', 'b12', 'vitd', 'ferritina']],
  ['figado', 'Fígado', ['tgo', 'tgp', 'ggt', 'fib4']],
  ['cardiovascular', 'Cardiovascular', ['pas', 'pad', 'fc', 'ct', 'hdl', 'ldl', 'tg', 'ct_hdl']],
  ['rins', 'Rins', ['creatinina', 'tfg']],
]

const media = (ns: Array<Nivel | null | undefined>) => {
  const v = ns.filter(Boolean) as Nivel[]
  return v.length ? Math.round(v.reduce((s, n) => s + PONTOS[n], 0) / v.length) : null
}

export function montarRelatorio(e: EntradaMapa): Relatorio {
  const idade = idadeEm(e.nascimento)
  const ult = ultimas(e.med)
  const sexo = e.fatores?.sex ?? 'F'
  const calc = calculados(ult, idade, sexo)
  const item = (code: string): ItemMapa | null => {
    const c = calc.find(x => x.code === code)
    if (c) return { code, name: c.name, unit: c.unit, value: c.value, date: null, bands: c.bands, level: nivelDe(c.value, c.bands), calc: c.formula }
    const i = e.cat.find(x => x.code === code)
    if (!i) return null
    const m = ult.get(code)?.[0]
    return { code, name: i.name, unit: i.unit, value: m?.value ?? null, date: m?.measured_at ?? null, bands: i.bands, level: nivelDe(m?.value, i.bands) }
  }
  const sistemas = SISTEMAS.map(([grp, nome, codes]) => ({ grp, nome, itens: codes.map(item).filter((x): x is ItemMapa => !!x && (x.value != null || !x.calc)) }))
  const forca = ['preensao', 'sentar_levantar', 'vo2'].map(item).filter((x): x is ItemMapa => !!x)

  const estilo: DominioMapa[] = DOMINIOS.map(d => {
    const itens = d.slugs.map(s => e.respostas.find(r => r.questionnaires?.slug === s)).filter(Boolean)
      .map(r => ({ name: r!.questionnaires!.name, score: r!.score, label: r!.band_label, level: r!.band_level, date: r!.submitted_at }))
    return { nome: d.nome, itens, level: pior(itens.map(i => i.level)) }
  })

  // Risco cardiovascular em 10 anos
  let risco_cv: Relatorio['risco_cv'] = { valor: null, level: null, motivo: null }
  const v = (c: string) => ult.get(c)?.[0]?.value
  if (e.fatores?.cvd.length) risco_cv.motivo = 'Não se aplica: doença cardiovascular presente.'
  else if (idade == null || idade < 30 || idade > 74) risco_cv.motivo = 'Calculado entre 30 e 74 anos.'
  else if (!v('ct') || !v('hdl') || !v('pas')) risco_cv.motivo = 'Faltam colesterol total, HDL ou pressão sistólica.'
  else if (!e.fatores?.smoking) risco_cv.motivo = 'Falta responder tabagismo em Fatores de risco.'
  else {
    const r = framingham({
      sexo, idade, ct: v('ct')!, hdl: v('hdl')!, pas: v('pas')!,
      tratada: e.fatores.meds.includes('Pressão alta'),
      fuma: /Leve|Moderada|Pesada/.test(e.fatores.smoking),
      diabetes: e.fatores.diseases.includes('Diabetes') || e.fatores.meds.includes('Diabetes ou glicose alta'),
    })
    risco_cv = { valor: r, level: nivelRiscoCV(r), motivo: null }
  }

  const problemas = e.problemas.filter(p => p.active).map(p => ({ title: p.title, detail: p.detail }))
  const dom = (n: string) => estilo.find(d => d.nome === n)
  const sis = (g: string) => sistemas.find(s => s.grp === g)?.itens.map(i => i.level) ?? []
  const eixos = [
    { nome: 'Humor', nota: media(dom('Humor')!.itens.map(i => i.level)) },
    { nome: 'Alimentação', nota: media(dom('Alimentação')!.itens.map(i => i.level)) },
    { nome: 'Físico', nota: media(forca.map(f => f.level)) },
    { nome: 'Fígado', nota: media(sis('figado')) },
    { nome: 'Escassez de doenças', nota: Math.max(10, 100 - problemas.length * 15) },
    { nome: 'Cardiovascular', nota: media([...sis('cardiovascular'), risco_cv.level]) },
    { nome: 'Metabolismo', nota: media(sis('metabolismo')) },
    { nome: 'Rins', nota: media(sis('rins')) },
    { nome: 'Sono', nota: media(dom('Sono')!.itens.map(i => i.level)) },
    { nome: 'Álcool e cigarro', nota: media([...dom('Álcool')!.itens, ...dom('Cigarro')!.itens].map(i => i.level)) },
  ]
  const comNota = eixos.filter(x => x.nota != null)
  const nota = comNota.length >= 6 ? Math.round(comNota.reduce((s, x) => s + x.nota!, 0) / comNota.length) : null

  return { gerado_em: new Date().toISOString(), paciente: { nome: e.nome, idade }, sistemas, forca, estilo, risco_cv, problemas, eixos, nota }
}

export type Pendencia = { chave: string; rotulo: string; detalhe: string }

export function pendencias(e: EntradaMapa, inicio: string): Pendencia[] {
  const out: Pendencia[] = []
  const desde = (dias: number) => new Date(new Date(inicio).getTime() - dias * 864e5).toISOString().slice(0, 10)
  const recentes = (codes: string[], dias: number) => codes.filter(c => !e.med.some(m => m.code === c && m.measured_at >= desde(dias)))
  const faltaMed = recentes(['peso', 'altura', 'cintura', 'pas', 'fc'], 60)
  if (faltaMed.length) out.push({ chave: 'medidas', rotulo: 'Medidas', detalhe: `Faltam ${faltaMed.map(c => e.cat.find(x => x.code === c)?.name.toLowerCase() ?? c).join(', ')} dos últimos 60 dias.` })
  const faltaEx = recentes(['ct', 'hdl', 'ldl', 'tg', 'glicose', 'hba1c', 'tgo', 'tgp', 'creatinina', 'plaquetas'], 180)
  if (faltaEx.length) out.push({ chave: 'exames', rotulo: 'Exames', detalhe: `${faltaEx.length} exames principais sem resultado nos últimos 6 meses.` })
  const faltaQ = DOMINIOS.filter(d => !d.slugs.some(s => e.respostas.some(r => r.questionnaires?.slug === s && r.submitted_at.slice(0, 10) >= desde(90))))
  if (faltaQ.length) out.push({ chave: 'questionarios', rotulo: 'Questionários', detalhe: `Sem resposta recente: ${faltaQ.map(d => d.nome.toLowerCase()).join(', ')}.` })
  const f = e.fatores
  if (!f || f.smoking == null || f.ethnicity == null || f.parent_diabetes == null || f.colonoscopy == null || f.family_cvd == null)
    out.push({ chave: 'fatores', rotulo: 'Fatores de risco', detalhe: 'Complete os 8 passos na aba Estilo de vida.' })
  if (recentes(['preensao', 'sentar_levantar'], 60).length === 2)
    out.push({ chave: 'forca', rotulo: 'Força', detalhe: 'Sem teste de força nos últimos 60 dias.' })
  return out
}
