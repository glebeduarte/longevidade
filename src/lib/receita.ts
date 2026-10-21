/** Leitura de receitas digitais da Memed (PDF) e regras de validade. */

export type ItemReceita = { nome: string; principio: string; quantidade: string; posologia: string }
export type TipoReceita = 'simples' | 'retencao' | 'controle_especial' | 'antimicrobiano'
export type DadosReceita = {
  numero: string; emitida_em: string; tipo: TipoReceita; uso_continuo: boolean
  token: string; codigo: string; paciente_nome: string; itens: ItemReceita[]
}

export const TIPO_RECEITA: Record<TipoReceita, string> = {
  simples: 'Receita simples',
  retencao: 'Receita retida na farmácia',
  controle_especial: 'Controle especial (retida)',
  antimicrobiano: 'Antimicrobiano (retida)',
}

const GLP1 = /tirzepatida|semaglutida|liraglutida|dulaglutida|exenatida|lixisenatida|mounjaro|ozempic|wegovy|rybelsus|saxenda|victoza|trulicity/i
const ANTIMICROBIANO = /amoxicilina|azitromicina|cefalexina|ciprofloxacino|levofloxacino|doxiciclina|nitrofuranto[ií]na|fosfomicina|sulfametoxazol|clindamicina|metronidazol|claritromicina/i

/** Validade sugerida em dias. A médica sempre confere antes de salvar. */
export function diasDeValidade(tipo: TipoReceita, itens: ItemReceita[]) {
  const texto = itens.map(i => `${i.nome} ${i.principio}`).join(' ')
  if (tipo === 'antimicrobiano') return 10
  if (tipo === 'controle_especial') return 30
  if (tipo === 'retencao') return GLP1.test(texto) ? 90 : 30
  return 180
}

export function somarDias(iso: string, dias: number) {
  const d = new Date(`${iso}T12:00:00`); d.setDate(d.getDate() + dias)
  return d.toISOString().slice(0, 10)
}

const QTD = /\s+(\d+\s+(?:embalage(?:m|ns)|caixas?|frascos?|unidades?|ampolas?|comprimidos?|c[áa]psulas?|tubos?|bisnagas?|canetas?|refis|refil|sach[êe]s?)(?:\s*\([^)]*\))?)\s*$/i
const VERBO = /^(administrar|aplicar|tomar|usar|utilizar|ingerir|passar|diluir|colocar|inalar|pingar|mastigar|dissolver|massagear|em caso|se )/i
const FIM_ITENS = /^(memed\b|endere[çc]o:|assinado digitalmente|token|\*para validar|avenida|rua )/i

/** Interpreta as linhas de texto de uma receita Memed. */
export function lerMemed(paginas: string[][]): DadosReceita {
  const todas = paginas.flat()
  const tudo = todas.join('\n')
  const p1 = paginas[0] ?? []

  const itens: ItemReceita[] = []
  let atual: ItemReceita | null = null
  for (const l of p1) {
    const m = l.match(/^\s*\d+\.\s+(.+)$/)
    if (m) {
      const q = m[1].match(QTD)
      atual = { nome: (q ? m[1].slice(0, q.index) : m[1]).trim(), principio: '', quantidade: q?.[1] ?? '', posologia: '' }
      itens.push(atual); continue
    }
    if (!atual) continue
    if (FIM_ITENS.test(l.trim())) { atual = null; continue }
    const t = l.trim(); if (!t) continue
    if (!atual.principio && !atual.posologia && !VERBO.test(t) && t.length < 90) atual.principio = t
    else atual.posologia = `${atual.posologia} ${t}`.trim()
  }

  const data = tudo.match(/Data e hora:\s*(\d{2})\/(\d{2})\/(\d{4})/)
  const emitida_em = data ? `${data[3]}-${data[2]}-${data[1]}` : new Date().toISOString().slice(0, 10)
  const tipo: TipoReceita = /CONTROLE ESPECIAL/i.test(tudo) ? 'controle_especial'
    : /SUJEITA À RETENÇÃO|SUJEITA A RETENÇÃO/i.test(tudo) ? (ANTIMICROBIANO.test(tudo) ? 'antimicrobiano' : 'retencao') : 'simples'
  const nome = tudo.match(/Nome:.*?\s{2,}Nome:\s*(.+)/)

  return {
    numero: tudo.match(/N\.?º\s*([\d.\-]+)/)?.[1] ?? '',
    emitida_em, tipo,
    uso_continuo: /uso cont[íi]nuo/i.test(tudo),
    token: tudo.match(/Token \(Farm[áa]cia\):\s*(\w+)/)?.[1] ?? tudo.match(/Token:\s*(\w+)/)?.[1] ?? '',
    codigo: tudo.match(/C[óo]digo de desbloqueio \(Paciente\):\s*(\w+)/)?.[1] ?? '',
    paciente_nome: nome?.[1].trim() ?? '',
    itens,
  }
}

/** Extrai o texto do PDF em linhas, na ordem visual. */
export async function textoDoPdf(arquivo: File): Promise<string[][]> {
  const pdfjs = await import('pdfjs-dist')
  const worker = (await import('pdfjs-dist/build/pdf.worker.min.mjs?url')).default
  pdfjs.GlobalWorkerOptions.workerSrc = worker
  const doc = await pdfjs.getDocument({ data: new Uint8Array(await arquivo.arrayBuffer()) }).promise
  const paginas: string[][] = []
  for (let p = 1; p <= doc.numPages; p++) {
    const c = await (await doc.getPage(p)).getTextContent()
    type It = { str: string; transform: number[]; width: number }
    const linhas = new Map<number, It[]>()
    for (const it of c.items as It[]) {
      if (!it.str) continue
      const y = Math.round(it.transform[5])
      const k = [...linhas.keys()].find(k => Math.abs(k - y) <= 2) ?? y
      if (!linhas.has(k)) linhas.set(k, [])
      linhas.get(k)!.push(it)
    }
    paginas.push([...linhas.entries()].sort((a, b) => b[0] - a[0]).map(([, its]) => {
      its.sort((a, b) => a.transform[4] - b.transform[4])
      let s = '', fim: number | null = null
      for (const i of its) {
        if (fim !== null) s += i.transform[4] - fim > 8 ? '  ' : i.transform[4] - fim > 0.5 ? ' ' : ''
        s += i.str; fim = i.transform[4] + i.width
      }
      return s
    }))
  }
  return paginas
}

/** Receita vigente: hoje está entre a emissão e a validade. */
export const receitaValida = (valida_ate: string) => valida_ate >= new Date().toLocaleDateString('sv-SE')
