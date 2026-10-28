import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { ExternalLink, Plus, Trash2, X } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../auth/AuthProvider'
import { Aviso, Botao } from '../../components/ui'
import { Icone, degrade, type Tema } from '../../components/icones'
import { NIVEL, dataBR, type Nivel } from '../../lib/faixas'
import { FATORES_VAZIO, calculados, fmt, idadeEm, ultimas, type Fatores, type Medida } from '../../lib/clinica'
import {
  AJUSTES_FRAX, ALIMENTOS, CORTE_PREENSAO, ROTULO_TEV, ajustarFrax, calcio, classeAscvd, foraDosLimites, metaCalcio, mgDia, preensao, prevent, triagemTev,
  type EntradaPrevent, type EntradaTev, type ItemCalcio, type NivelTev,
} from '../../lib/riscos'
import { ETNIAS_GAIL, LIMIAR_GAIL_5, SUBGRUPOS_GAIL, gail, type EntradaGail, type EtniaGail, type SubGail } from '../../lib/gail'

type Tipo = 'prevent' | 'frax' | 'tev' | 'preensao' | 'calcio' | 'gail'
type Avaliacao = { id: string; kind: Tipo; inputs: Record<string, unknown>; result: Record<string, unknown>; resumo: string | null; nivel: Nivel | null; created_at: string }
type Contexto = { idade: number | null; sexo: 'F' | 'M'; v: (c: string) => number | undefined; imc?: number; tfg?: number; f: Fatores; ant?: Record<string, unknown> }

/** Junta o último cálculo salvo com os dados atuais da ficha. Exames mais recentes da ficha prevalecem. */
function comAnterior<T extends object>(base: T, ant: Record<string, unknown> | undefined, daFicha: Array<keyof T> = []): T {
  if (!ant) return base
  const r = { ...base } as Record<string, unknown>
  for (const [k, v] of Object.entries(ant)) if (v !== undefined && v !== null) r[k] = v
  for (const k of daFicha) if ((base as Record<string, unknown>)[k as string] !== undefined) r[k as string] = (base as Record<string, unknown>)[k as string]
  return r as T
}

/** Exames digitados nos cálculos que vão para a ficha quando diferem do último registro. */
const EXAMES_DOS_CALCULOS: Array<[string, string]> = [['pas', 'pas'], ['ct', 'ct'], ['hdl', 'hdl'], ['peso', 'peso'], ['altura', 'altura']]

const campo = 'w-full rounded-md border border-controle bg-folha px-3 text-corpo focus:outline-none focus:border-cafe min-h-[40px]'
const pct = (x: number, casas = 1) => `${fmt(x * 100, casas)}%`
const NIVEL_TEV: Record<NivelTev, Nivel | null> = { sem: null, avaliar: 'atencao', prioritario: 'ruim' }

const MODULOS: Array<{ k: Tipo; titulo: string; sub: string; tema: Tema }> = [
  { k: 'prevent', titulo: 'Risco cardiovascular · PREVENT', sub: 'AHA, risco absoluto em 10 e 30 anos', tema: 'coracao' },
  { k: 'frax', titulo: 'Risco de fratura · FRAX Brasil 2.0', sub: 'Resultado oficial com ajuste ABRASSO', tema: 'exame' },
  { k: 'tev', titulo: 'Tromboembolismo venoso', sub: 'Triagem antes da terapia hormonal', tema: 'alerta' },
  { k: 'preensao', titulo: 'Força de preensão palmar', sub: 'EWGSOP2', tema: 'forca' },
  { k: 'gail', titulo: 'Risco de câncer de mama · Gail', sub: 'BCRAT (NCI), risco em 5 anos e até os 90', tema: 'alerta' },
  { k: 'calcio', titulo: 'Cálcio na alimentação', sub: 'Consumo habitual em mg por dia', tema: 'alimentacao' },
]

export function AbaRiscos({ pid, nascimento }: { pid: string; nascimento: string | null }) {
  const { session } = useAuth()
  const [lista, setLista] = useState<Avaliacao[]>([])
  const [med, setMed] = useState<Medida[]>([])
  const [f, setF] = useState<Fatores>(FATORES_VAZIO)
  const [aberto, setAberto] = useState<Tipo | null>(null)

  const carregar = () => supabase.from('risk_assessments').select('*').eq('patient_id', pid).order('created_at', { ascending: false })
    .then(({ data }) => setLista((data as Avaliacao[]) ?? []))
  useEffect(() => {
    carregar()
    supabase.from('measurements').select('id, code, value, measured_at, note').eq('patient_id', pid).then(({ data }) => setMed((data as Medida[]) ?? []))
    supabase.from('risk_factors').select('*').eq('patient_id', pid).maybeSingle().then(({ data }) => data && setF({ ...FATORES_VAZIO, ...(data as Partial<Fatores>) }))
  }, [pid])

  const ctx = useMemo<Contexto>(() => {
    const ult = ultimas(med), idade = idadeEm(nascimento), sexo = f.sex ?? 'F'
    const calc = calculados(ult, idade, sexo)
    return { idade, sexo, f, v: c => ult.get(c)?.[0]?.value, imc: calc.find(c => c.code === 'imc')?.value, tfg: calc.find(c => c.code === 'tfg')?.value }
  }, [med, f, nascimento])
  const ctxBase = ctx

  async function salvar(kind: Tipo, inputs: object, result: object, resumo: string, nivel: Nivel | null) {
    const { error } = await supabase.from('risk_assessments').insert({ patient_id: pid, kind, inputs, result, resumo, nivel, created_by: session?.user.id })
    if (error) return error
    const ent = inputs as Record<string, unknown>
    const novas = EXAMES_DOS_CALCULOS
      .map(([campo, code]) => ({ code, value: ent[campo] }))
      .filter((m): m is { code: string; value: number } => typeof m.value === 'number' && Number.isFinite(m.value) && m.value !== ctx.v(m.code))
      .map(m => ({ patient_id: pid, code: m.code, value: m.value, note: 'Registrado no cálculo de risco', created_by: session?.user.id }))
    if (novas.length) await supabase.from('measurements').insert(novas)
    setAberto(null); carregar()
    supabase.from('measurements').select('id, code, value, measured_at, note').eq('patient_id', pid).then(({ data }) => setMed((data as Medida[]) ?? []))
    return null
  }
  async function apagar(id: string) { await supabase.from('risk_assessments').delete().eq('id', id); carregar() }

  return (
    <div className="flex flex-col gap-4">
      <Aviso>Os resultados apoiam a decisão clínica e não fazem diagnóstico. Os cortes e regras seguem o material de 28/10/2026 da Dra. Bartira.</Aviso>
      <div className="grid xl:grid-cols-2 gap-4 items-start">
        {MODULOS.map(m => {
          const hist = lista.filter(a => a.kind === m.k)
          const ultimo = hist[0]
          return (
            <section key={m.k} className="cartao overflow-hidden" aria-labelledby={`r-${m.k}`}>
              <div className="px-5 py-4 flex items-center gap-3" style={{ background: degrade(m.tema) }}>
                <Icone tema={m.tema} fundo tamanho={40} className="!bg-folha" />
                <div className="flex-1 min-w-0">
                  <h2 id={`r-${m.k}`} className="titulo-bloco">{m.titulo}</h2>
                  <p className="text-meta text-apoio">{m.sub}</p>
                </div>
                {aberto !== m.k && <Botao variante="linha" tamanho="sm" onClick={() => setAberto(m.k)}><Plus className="w-4 h-4" />{ultimo ? 'Novo' : 'Calcular'}</Botao>}
              </div>
              <div className="p-5 flex flex-col gap-4">
                {aberto === m.k && (() => { const ctx = { ...ctxBase, ant: ultimo?.inputs }; return (
                  <div className="flex flex-col gap-3">
                    {m.k === 'prevent' && <FormPrevent ctx={ctx} salvar={salvar} />}
                    {m.k === 'frax' && <FormFrax ctx={ctx} salvar={salvar} />}
                    {m.k === 'tev' && <FormTev ctx={ctx} salvar={salvar} />}
                    {m.k === 'preensao' && <FormPreensao ctx={ctx} salvar={async (...a) => {
                      const e = await salvar(...a)
                      const max = (a[2] as { max: number | null }).max
                      if (!e && max) await supabase.from('measurements').insert({ patient_id: pid, code: 'preensao', value: max, note: 'Registrada no módulo de preensão', created_by: session?.user.id })
                      return e
                    }} />}
                    {m.k === 'calcio' && <FormCalcio ctx={ctx} salvar={salvar} />}
                    {m.k === 'gail' && <FormGail ctx={ctx} salvar={salvar} />}
                    <Botao variante="texto" onClick={() => setAberto(null)} className="self-start"><X className="w-4 h-4" />Cancelar</Botao>
                  </div>
                ) })()}
                {aberto !== m.k && !ultimo && <p className="text-corpo text-apoio">Nenhum cálculo registrado.</p>}
                {aberto !== m.k && hist.slice(0, 4).map((a, i) => (
                  <div key={a.id} className={`group flex items-start gap-3 ${i ? 'opacity-70' : ''}`}>
                    <span className={`mt-1.5 w-2.5 h-2.5 rounded-full shrink-0 ${a.nivel ? NIVEL[a.nivel].fundo : 'bg-areia'}`} />
                    <div className="flex-1 min-w-0">
                      <p className={i ? 'text-corpo' : 'text-[15px] font-medium'}>{a.resumo}</p>
                      <p className="text-meta text-apoio">{dataBR(a.created_at)}</p>
                    </div>
                    <button onClick={() => apagar(a.id)} aria-label="Apagar cálculo" className="opacity-0 group-hover:opacity-100 focus:opacity-100 text-apoio hover:text-terracota"><Trash2 className="w-4 h-4" /></button>
                  </div>
                ))}
              </div>
            </section>
          )
        })}
      </div>
    </div>
  )
}

type Salvar = (kind: Tipo, inputs: object, result: object, resumo: string, nivel: Nivel | null) => Promise<unknown>

function Num({ rotulo, valor, onChange, sufixo, passo = 'any' }: { rotulo: string; valor: number | undefined; onChange: (v: number | undefined) => void; sufixo?: string; passo?: string }) {
  return (
    <label className="flex flex-col gap-1 text-meta text-apoio">{rotulo}
      <span className="relative">
        <input type="number" step={passo} inputMode="decimal" value={valor ?? ''} onChange={e => onChange(e.target.value === '' ? undefined : Number(e.target.value))} className={`${campo} ${sufixo ? 'pr-16' : ''}`} />
        {sufixo && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-meta text-apoio pointer-events-none">{sufixo}</span>}
      </span>
    </label>
  )
}
function SimNao({ rotulo, valor, onChange }: { rotulo: string; valor: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-2.5 min-h-[36px] text-corpo cursor-pointer">
      <input type="checkbox" className="w-4 h-4 accent-cafe" checked={valor} onChange={e => onChange(e.target.checked)} />{rotulo}
    </label>
  )
}
function Opcoes<T extends string>({ rotulo, valor, opcoes, onChange }: { rotulo: string; valor: T; opcoes: Array<[T, string]>; onChange: (v: T) => void }) {
  return (
    <fieldset className="flex flex-col gap-1">
      <legend className="text-meta text-apoio mb-1">{rotulo}</legend>
      <div className="flex flex-wrap gap-1.5">
        {opcoes.map(([k, r]) => (
          <button key={k} type="button" role="radio" aria-checked={valor === k} onClick={() => onChange(k)}
            className={`px-3 min-h-[36px] rounded-md border text-corpo ${valor === k ? 'bg-cafe text-creme border-cafe' : 'bg-folha border-borda hover:border-controle'}`}>{r}</button>
        ))}
      </div>
    </fieldset>
  )
}
function Resultado({ children, nivel }: { children: ReactNode; nivel?: Nivel | null }) {
  const borda = { ruim: 'border-terracota', atencao: 'border-cobre', normal: 'border-apoio', bom: 'border-oliva/70', otimo: 'border-oliva' }
  return <div className={`rounded-lg px-4 py-3 bg-tom border-l-4 ${nivel ? borda[nivel] : 'border-areia'}`}>{children}</div>
}
function BotaoSalvar({ onClick, disabled }: { onClick: () => Promise<unknown>; disabled?: boolean }) {
  const [s, setS] = useState(false), [erro, setErro] = useState(false)
  return (<>
    {erro && <Aviso tipo="erro">Não foi possível salvar.</Aviso>}
    <Botao className="self-start" disabled={disabled || s} onClick={async () => { setS(true); const e = await onClick(); setErro(!!e); setS(false) }}>{s ? 'Salvando' : 'Salvar no prontuário'}</Botao>
  </>)
}

// ---------- PREVENT ----------
function FormPrevent({ ctx, salvar }: { ctx: Contexto; salvar: Salvar }) {
  const fumaRegistro = /leve|moderada|pesada/i.test(ctx.f.smoking ?? '')
  const [e, setE] = useState<Partial<EntradaPrevent>>(() => comAnterior<Partial<EntradaPrevent>>({
    sexo: ctx.sexo, idade: ctx.idade ?? undefined, pas: ctx.v('pas'), ct: ctx.v('ct'), hdl: ctx.v('hdl'),
    tfg: ctx.tfg ? Math.round(ctx.tfg) : undefined, imc: ctx.imc ? Math.round(ctx.imc * 10) / 10 : undefined,
    diabetes: ctx.f.diseases.includes('Diabetes'), fuma: fumaRegistro,
    antiHas: ctx.f.meds.includes('Pressão alta'), estatina: ctx.f.meds.includes('Colesterol ou triglicerídeos'),
  }, ctx.ant, ['idade', 'pas', 'ct', 'hdl', 'tfg', 'imc']))
  const faltam = foraDosLimites(e)
  const r = faltam.length ? null : prevent(e as EntradaPrevent)
  const cls = r ? classeAscvd(r.dez.ascvd) : null
  const set = (k: keyof EntradaPrevent) => (v: unknown) => setE({ ...e, [k]: v })
  return (<>
    <p className="text-meta text-apoio">Preenchido com os últimos exames e fatores de risco. Confira antes de salvar.</p>
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      <Num rotulo="Idade" valor={e.idade} onChange={set('idade')} sufixo="anos" />
      <Num rotulo="PAS" valor={e.pas} onChange={set('pas')} sufixo="mmHg" />
      <Num rotulo="Colesterol total" valor={e.ct} onChange={set('ct')} sufixo="mg/dL" />
      <Num rotulo="HDL" valor={e.hdl} onChange={set('hdl')} sufixo="mg/dL" />
      <Num rotulo="TFGe" valor={e.tfg} onChange={set('tfg')} sufixo="mL/min" />
      <Num rotulo="IMC" valor={e.imc} onChange={set('imc')} sufixo="kg/m²" />
    </div>
    <Opcoes rotulo="Sexo" valor={e.sexo ?? 'F'} opcoes={[['F', 'Feminino'], ['M', 'Masculino']]} onChange={set('sexo')} />
    <div className="grid sm:grid-cols-2 gap-x-4">
      <SimNao rotulo="Diabetes" valor={!!e.diabetes} onChange={set('diabetes')} />
      <SimNao rotulo="Tabagismo atual" valor={!!e.fuma} onChange={set('fuma')} />
      <SimNao rotulo="Usa estatina ou hipolipemiante" valor={!!e.estatina} onChange={set('estatina')} />
      <SimNao rotulo="Usa anti-hipertensivo" valor={!!e.antiHas} onChange={set('antiHas')} />
    </div>
    {faltam.length > 0 && <p className="text-meta text-terracota">Fora da faixa do modelo ou faltando: {faltam.join(', ')}.</p>}
    {r && cls && (
      <Resultado nivel={cls.nivel}>
        <p className="text-[15px]"><b>ASCVD em 10 anos: {pct(r.dez.ascvd)}</b> · {cls.rotulo}</p>
        <p className="text-corpo text-apoio mt-1">DCV total {pct(r.dez.cvd)} · Insuficiência cardíaca {pct(r.dez.ic)}</p>
        {r.trinta && <p className="text-corpo text-apoio">Em 30 anos: DCV total {pct(r.trinta.cvd)} · ASCVD {pct(r.trinta.ascvd)} · IC {pct(r.trinta.ic)}</p>}
        <p className="text-meta text-apoio mt-2">Cortes AHA/ACC 2026 só para ASCVD em 10 anos: &lt;3% baixo, 3 a &lt;5% limítrofe, 5 a &lt;10% intermediário, ≥10% alto. Modelo validado nos EUA; calibração brasileira não estabelecida.</p>
      </Resultado>
    )}
    <BotaoSalvar disabled={!r} onClick={() => salvar('prevent', e, r!,
      `ASCVD 10 anos ${pct(r!.dez.ascvd)} (${cls!.rotulo.toLowerCase()}) · DCV ${pct(r!.dez.cvd)} · IC ${pct(r!.dez.ic)}`, cls!.nivel)} />
  </>)
}

// ---------- FRAX ----------
function FormFrax({ ctx, salvar }: { ctx: Contexto; salvar: Salvar }) {
  const [e, setE] = useState(() => comAnterior({
    idade: ctx.idade ?? undefined as number | undefined, peso: ctx.v('peso'), altura: ctx.v('altura'),
    fratura: false, paiMae: false, fuma: /leve|moderada|pesada/i.test(ctx.f.smoking ?? ''), glico: false, ar: false, secundaria: false, alcool: false,
    dmo: undefined as number | undefined, fom: undefined as number | undefined, fq: undefined as number | undefined, ajuste: 'nenhum', pontosT: 1, classe: '',
  }, ctx.ant, ['idade', 'peso', 'altura']))
  const set = (k: keyof typeof e) => (v: unknown) => setE({ ...e, [k]: v })
  const r = e.fom != null && e.fq != null ? ajustarFrax(e.fom, e.fq, e.ajuste, e.pontosT) : null
  const nivel: Nivel | null = e.classe === 'Alto' ? 'ruim' : e.classe === 'Intermediário' ? 'atencao' : e.classe === 'Baixo' ? 'bom' : null
  return (<>
    <p className="text-meta text-apoio">O FRAX não é soma de pontos. Preencha os dados, rode a calculadora oficial e traga o resultado. O ajuste ABRASSO usa um único fator, o mais relevante.</p>
    <div className="grid grid-cols-3 gap-3">
      <Num rotulo="Idade" valor={e.idade} onChange={set('idade')} sufixo="anos" />
      <Num rotulo="Peso" valor={e.peso} onChange={set('peso')} sufixo="kg" />
      <Num rotulo="Altura" valor={e.altura} onChange={set('altura')} sufixo="cm" />
    </div>
    <div className="grid sm:grid-cols-2 gap-x-4">
      <SimNao rotulo="Fratura por fragilidade prévia" valor={e.fratura} onChange={set('fratura')} />
      <SimNao rotulo="Pai ou mãe com fratura de quadril" valor={e.paiMae} onChange={set('paiMae')} />
      <SimNao rotulo="Tabagismo atual" valor={e.fuma} onChange={set('fuma')} />
      <SimNao rotulo="Glicocorticoide oral ≥3 meses, ≥5 mg/dia" valor={e.glico} onChange={set('glico')} />
      <SimNao rotulo="Artrite reumatoide" valor={e.ar} onChange={set('ar')} />
      <SimNao rotulo="Osteoporose secundária" valor={e.secundaria} onChange={set('secundaria')} />
      <SimNao rotulo="Álcool ≥3 unidades/dia" valor={e.alcool} onChange={set('alcool')} />
    </div>
    <Num rotulo="DMO do colo femoral (opcional)" valor={e.dmo} onChange={set('dmo')} sufixo="g/cm²" />
    <a href="https://abrasso.org.br/frax-brasil-validacao-app/" target="_blank" rel="noreferrer" className="self-start inline-flex items-center gap-1.5 text-corpo text-cafe hover:underline">Abrir calculadora oficial FRAX Brasil (ABRASSO)<ExternalLink className="w-3.5 h-3.5" /></a>
    <div className="grid grid-cols-2 gap-3">
      <Num rotulo="Resultado oficial: fratura maior (FOM)" valor={e.fom} onChange={set('fom')} sufixo="%" />
      <Num rotulo="Resultado oficial: quadril (FQ)" valor={e.fq} onChange={set('fq')} sufixo="%" />
    </div>
    <label className="flex flex-col gap-1 text-meta text-apoio">Ajuste ABRASSO (escolha só o fator mais relevante)
      <select value={e.ajuste} onChange={ev => set('ajuste')(ev.target.value)} className={campo}>
        {AJUSTES_FRAX.map(a => <option key={a.id} value={a.id}>{a.rotulo}{a.id !== 'nenhum' ? ` · FOM ×${fmt(a.fom, 2)}, FQ ×${fmt(a.fq, 2)}` : ''}</option>)}
      </select>
    </label>
    {e.ajuste === 'tscore' && <Num rotulo="Diferença de T-score (pontos, arredondado)" valor={e.pontosT} onChange={v => set('pontosT')(v ?? 1)} passo="1" />}
    <p className="text-meta text-apoio">DM2: use na calculadora uma das alternativas recomendadas pela ABRASSO, nunca as três somadas.</p>
    <Opcoes rotulo="Classificação pelo gráfico ABRASSO para a idade" valor={e.classe} opcoes={[['Baixo', 'Baixo'], ['Intermediário', 'Intermediário'], ['Alto', 'Alto'], ['', 'Não classificado']]} onChange={set('classe')} />
    {r && (
      <Resultado nivel={nivel}>
        <p className="text-[15px]"><b>FOM {fmt(r.fom, 1)}% · Quadril {fmt(r.fq, 1)}%</b>{e.classe ? ` · ${e.classe}` : ''}</p>
        <p className="text-corpo text-apoio mt-1">{e.ajuste === 'nenhum' ? 'Sem ajuste aplicado.' : `Base ${fmt(e.fom!, 1)}% e ${fmt(e.fq!, 1)}%, ajustado por: ${r.ajuste.rotulo.toLowerCase()}.`}</p>
      </Resultado>
    )}
    <BotaoSalvar disabled={!r} onClick={() => salvar('frax', e, r!,
      `FRAX: FOM ${fmt(r!.fom, 1)}%, quadril ${fmt(r!.fq, 1)}%${e.ajuste !== 'nenhum' ? ' (ajustado)' : ''}${e.classe ? ` · ${e.classe.toLowerCase()}` : ''}`, nivel)} />
  </>)
}

// ---------- TEV ----------
function FormTev({ ctx, salvar }: { ctx: Contexto; salvar: Salvar }) {
  const s = ctx.f.smoking ?? ''
  const [e, setE] = useState<EntradaTev>(() => comAnterior<EntradaTev>({
    previo: 'nao', familiar: 'nao', trombofilia: 'nao', idade: ctx.idade ?? undefined, imc: ctx.imc ? Math.round(ctx.imc * 10) / 10 : undefined,
    tabagismo: /leve|moderada|pesada/i.test(s) ? 'atual' : /ex/i.test(s) ? 'ex' : 'nunca', cancer: ctx.f.diseases.includes('Câncer em tratamento'),
    cirurgia: false, estrogeno: 'nenhum',
  }, ctx.ant, ['idade', 'imc']))
  const set = (k: keyof EntradaTev) => (v: unknown) => setE({ ...e, [k]: v })
  const t = triagemTev(e)
  const txt = (k: keyof EntradaTev, ph: string) => <input value={(e[k] as string) ?? ''} onChange={ev => set(k)(ev.target.value)} placeholder={ph} className={campo} />
  return (<>
    <Opcoes rotulo="TEV prévio" valor={e.previo} opcoes={[['nao', 'Não'], ['sim', 'Sim']]} onChange={set('previo')} />
    {e.previo === 'sim' && txt('previo_detalhe', 'Tipo, data, provocado ou não, recorrência')}
    <Opcoes rotulo="TEV em familiar de 1º grau" valor={e.familiar} opcoes={[['nao', 'Não'], ['sim', 'Sim'], ['desconhecido', 'Desconhecido']]} onChange={set('familiar')} />
    {e.familiar === 'sim' && txt('familiar_detalhe', 'Idade e circunstâncias')}
    <Opcoes rotulo="Trombofilia conhecida" valor={e.trombofilia} opcoes={[['nao', 'Não'], ['sim', 'Sim'], ['desconhecido', 'Desconhecido']]} onChange={set('trombofilia')} />
    {e.trombofilia === 'sim' && txt('trombofilia_detalhe', 'Qual')}
    <div className="grid grid-cols-2 gap-3">
      <Num rotulo="Idade" valor={e.idade} onChange={set('idade')} sufixo="anos" />
      <Num rotulo="IMC" valor={e.imc} onChange={set('imc')} sufixo="kg/m²" />
    </div>
    <Opcoes rotulo="Tabagismo" valor={e.tabagismo} opcoes={[['nunca', 'Nunca'], ['ex', 'Ex'], ['atual', 'Atual']]} onChange={set('tabagismo')} />
    <div className="grid sm:grid-cols-2 gap-x-4">
      <SimNao rotulo="Câncer ativo" valor={e.cancer} onChange={set('cancer')} />
      <SimNao rotulo="Cirurgia ou imobilização recente" valor={e.cirurgia} onChange={set('cirurgia')} />
    </div>
    {e.cirurgia && txt('cirurgia_detalhe', 'Datas')}
    <Opcoes rotulo="Estrogênio atual ou proposto" valor={e.estrogeno} opcoes={[['nenhum', 'Nenhum'], ['oral', 'Oral'], ['transdermico', 'Transdérmico']]} onChange={set('estrogeno')} />
    {e.estrogeno !== 'nenhum' && txt('estrogeno_dose', 'Dose')}
    <label className="flex flex-col gap-1 text-meta text-apoio">Outros fatores
      <input value={e.outros ?? ''} onChange={ev => set('outros')(ev.target.value)} placeholder="Gestação ou puerpério, doença inflamatória, outra condição relevante" className={campo} />
    </label>
    <Resultado nivel={NIVEL_TEV[t.nivel]}>
      <p className="text-[15px] font-medium">{ROTULO_TEV[t.nivel]}</p>
      {t.motivos.length > 0 && <p className="text-corpo text-apoio mt-1">{t.motivos.join(' · ')}</p>}
      <p className="text-meta text-apoio mt-2">Sinalização operacional, sem pontos nem percentual: não há escore validado para TEV em usuárias ambulatoriais de THM. TEV prévio, trombofilia ou câncer ativo pedem avaliação individualizada. Não define elegibilidade para THM. Suspeita de TEV agudo exige avaliação urgente.</p>
    </Resultado>
    <BotaoSalvar onClick={() => salvar('tev', e, t, `TEV: ${ROTULO_TEV[t.nivel].toLowerCase()}${t.motivos.length ? ` (${t.motivos.join(', ')})` : ''}`, NIVEL_TEV[t.nivel])} />
  </>)
}

// ---------- Preensão ----------
function FormPreensao({ ctx, salvar }: { ctx: Contexto; salvar: Salvar }) {
  const [sexo, setSexo] = useState<'F' | 'M'>((ctx.ant?.sexo as 'F' | 'M') ?? ctx.sexo)
  const [mao, setMao] = useState<'direita' | 'esquerda'>((ctx.ant?.mao as 'direita' | 'esquerda') ?? 'direita')
  const [t, setT] = useState<Array<number | undefined>>([undefined, undefined, undefined])
  const [protocolo, setProtocolo] = useState((ctx.ant?.protocolo as string) ?? '')
  const r = preensao(sexo, t.filter((x): x is number => x != null))
  const nivel: Nivel | null = r.max == null ? null : r.baixa ? 'ruim' : 'normal'
  return (<>
    <div className="flex flex-wrap gap-4">
      <Opcoes rotulo="Sexo" valor={sexo} opcoes={[['F', 'Feminino'], ['M', 'Masculino']]} onChange={setSexo} />
      <Opcoes rotulo="Mão" valor={mao} opcoes={[['direita', 'Direita'], ['esquerda', 'Esquerda']]} onChange={setMao} />
    </div>
    <div className="grid grid-cols-3 gap-3">
      {t.map((v, i) => <Num key={i} rotulo={`Tentativa ${i + 1}`} valor={v} onChange={n => setT(t.map((x, j) => (j === i ? n : x)))} sufixo="kg" />)}
    </div>
    <label className="flex flex-col gap-1 text-meta text-apoio">Protocolo (opcional)
      <input value={protocolo} onChange={e => setProtocolo(e.target.value)} placeholder="Ex.: dinamômetro Jamar, sentada, cotovelo a 90°" className={campo} />
    </label>
    {r.max != null && (
      <Resultado nivel={nivel}>
        <p className="text-[15px]"><b>Força máxima {fmt(r.max, 1)} kg</b> · {r.baixa ? 'baixa força' : 'não abaixo do ponto de corte'}</p>
        <p className="text-meta text-apoio mt-1">Corte EWGSOP2: {sexo === 'F' ? 'mulheres' : 'homens'} &lt;{CORTE_PREENSAO[sexo]} kg. Baixa força sugere sarcopenia provável e não confirma sarcopenia isoladamente.</p>
      </Resultado>
    )}
    <BotaoSalvar disabled={r.max == null} onClick={() => salvar('preensao', { sexo, mao, tentativas: t, protocolo }, r,
      `Preensão ${fmt(r.max!, 1)} kg (mão ${mao}) · ${r.baixa ? 'baixa força, sarcopenia provável' : 'acima do corte'}`, nivel)} />
    <p className="text-meta text-apoio">Ao salvar, a força máxima também entra em Exames e medidas.</p>
  </>)
}

// ---------- Cálcio ----------
function FormCalcio({ ctx, salvar }: { ctx: Contexto; salvar: Salvar }) {
  const [itens, setItens] = useState<Array<ItemCalcio & { porcaoTxt: string }>>((ctx.ant?.itens as Array<ItemCalcio & { porcaoTxt: string }>) ?? [])
  const [meta, setMeta] = useState((ctx.ant?.meta as number) ?? metaCalcio(ctx.sexo, ctx.idade))
  const r = calcio(itens, meta)
  const add = (a: { nome: string; mg: number; porcao: string }) => setItens([...itens, { nome: a.nome, mg: a.mg, porcaoTxt: a.porcao, porcoes: 1, vezes: 1, por: 'dia' }])
  const mud = (i: number, k: string, v: unknown) => setItens(itens.map((x, j) => (j === i ? { ...x, [k]: v } : x)))
  const usados = new Set(itens.map(i => i.nome))
  return (<>
    <div className="flex flex-wrap gap-1.5">
      {ALIMENTOS.filter(a => !usados.has(a.nome)).map(a => (
        <button key={a.id} type="button" onClick={() => add(a)} className="px-3 min-h-[34px] rounded-full border border-borda bg-folha hover:border-controle text-corpo inline-flex items-center gap-1"><Plus className="w-3.5 h-3.5" />{a.nome}</button>
      ))}
      <button type="button" onClick={() => add({ nome: '', mg: 0, porcao: 'mg de cálcio elementar' })} className="px-3 min-h-[34px] rounded-full border border-dashed border-controle text-corpo inline-flex items-center gap-1"><Plus className="w-3.5 h-3.5" />Outro alimento ou suplemento</button>
    </div>
    {itens.map((i, k) => (
      <div key={k} className="painel-tom p-3 flex flex-col gap-2">
        <div className="flex gap-2 items-center">
          <input value={i.nome} onChange={e => mud(k, 'nome', e.target.value)} placeholder="Nome" className={campo} aria-label="Alimento" />
          <button onClick={() => setItens(itens.filter((_, j) => j !== k))} aria-label="Remover" className="w-9 h-9 grid place-items-center rounded hover:bg-ativo shrink-0"><X className="w-4 h-4" /></button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 items-end">
          <Num rotulo={`Cálcio por porção (${i.porcaoTxt})`} valor={i.mg} onChange={v => mud(k, 'mg', v ?? 0)} sufixo="mg" />
          <Num rotulo="Porções" valor={i.porcoes} onChange={v => mud(k, 'porcoes', v ?? 0)} />
          <Num rotulo="Vezes" valor={i.vezes} onChange={v => mud(k, 'vezes', v ?? 0)} />
          <Opcoes rotulo="Por" valor={i.por} opcoes={[['dia', 'dia'], ['semana', 'semana']]} onChange={v => mud(k, 'por', v)} />
        </div>
        <p className="text-meta text-apoio">≈ {fmt(mgDia(i), 0)} mg por dia</p>
      </div>
    ))}
    <p className="text-meta text-apoio">Valores aproximados por porção. Para marcas específicas, use o rótulo. Evite contar a mesma porção duas vezes.</p>
    <Num rotulo="Meta diária (padrão pela idade e sexo, editável)" valor={meta} onChange={v => setMeta(v ?? 1000)} sufixo="mg/dia" />
    {itens.length > 0 && (
      <Resultado nivel={r.atingiu ? 'bom' : 'atencao'}>
        <p className="text-[15px]"><b>{fmt(r.total, 0)} mg/dia</b> de {fmt(meta, 0)} · {fmt(r.pct, 0)}% da meta · {r.atingiu ? 'atingiu a meta' : `abaixo da meta em ${fmt(-r.diferenca, 0)} mg`}</p>
        <p className="text-meta text-apoio mt-1">Estimativa de consumo habitual; não diagnostica deficiência.</p>
      </Resultado>
    )}
    <BotaoSalvar disabled={!itens.length} onClick={() => salvar('calcio', { itens, meta }, r,
      `Cálcio ${fmt(r.total, 0)} mg/dia, ${fmt(r.pct, 0)}% da meta de ${fmt(meta, 0)} · ${r.atingiu ? 'atingiu' : 'abaixo da meta'}`, r.atingiu ? 'bom' : 'atencao')} />
  </>)
}

// ---------- Câncer de mama (Gail / BCRAT) ----------
const ETNIA_DO_CADASTRO: Record<string, EtniaGail> = { Branca: 'White', Preta: 'Black', 'Asiática': 'Asian', 'Não declarada': 'Unknown' }
type FormaGail = { idade?: number; etnia?: EtniaGail; sub: SubGail; historico?: 'nao' | 'sim'; genetica?: 'nao' | 'sim' | 'nao_sei'
  biopsia?: '0' | '1' | '99'; nBiopsias?: '1' | '2'; atipia?: '0.93' | '1.82' | '1'; menarca?: '0' | '1' | '2'
  parto?: '98' | '0' | '1' | '2' | '3' | 'ns'; parentes?: '0' | '1' | '2' | 'ns' }

function FormGail({ ctx, salvar }: { ctx: Contexto; salvar: Salvar }) {
  const [e, setE] = useState<FormaGail>(() => { const { entrada: _e, ...ant } = (ctx.ant ?? {}) as Record<string, unknown>; void _e; return comAnterior<FormaGail>({ idade: ctx.idade ?? undefined, etnia: ETNIA_DO_CADASTRO[ctx.f.ethnicity ?? ''], sub: '' }, ctx.ant ? ant : undefined, ['idade']) })
  const set = <K extends keyof FormaGail>(k: K) => (v: FormaGail[K]) => setE(x => ({ ...x, [k]: v }))
  const subs = e.etnia ? SUBGRUPOS_GAIL[e.etnia] : undefined
  const fezBiopsia = e.biopsia === '1'
  const bloqueio = e.historico === 'sim' ? 'historico' : e.genetica === 'sim' ? 'genetica' : null
  const idadeOk = e.idade != null && e.idade >= 35 && e.idade <= 85
  const completo = !bloqueio && e.historico && e.genetica && idadeOk && e.etnia && (!subs || e.sub) && e.biopsia
    && (!fezBiopsia || (e.nBiopsias && e.atipia)) && e.menarca && e.parto && e.parentes
  const entrada: EntradaGail | null = completo ? {
    idade: e.idade!, etnia: e.etnia!, sub: e.sub, biopsia: Number(e.biopsia) as 0 | 1 | 99,
    nBiopsias: Number(e.nBiopsias ?? 1) as 1 | 2, atipia: Number(e.atipia ?? 1) as 0.93 | 1 | 1.82,
    menarca: Number(e.menarca) as 0 | 1 | 2, primeiroParto: (e.parto === 'ns' ? 0 : Number(e.parto)) as EntradaGail['primeiroParto'],
    parentes: (e.parentes === 'ns' ? 0 : Number(e.parentes)) as 0 | 1 | 2,
  } : null
  const r = entrada ? gail(entrada) : null
  const p = (x: number) => `${fmt(x, 1)}%`
  const nivel: Nivel | null = !r ? null : r.cinco >= LIMIAR_GAIL_5 || r.vida >= 20 ? 'ruim' : r.cinco > r.cincoMedia ? 'atencao' : 'normal'
  const comp = (a: number, b: number) => (a > b ? 'acima' : a < b ? 'abaixo' : 'igual')
  return (<>
    <Opcoes rotulo="Já teve câncer de mama, CDIS, CLIS ou radioterapia torácica para linfoma de Hodgkin?" valor={e.historico ?? '' as 'nao'} opcoes={[['nao', 'Não'], ['sim', 'Sim']]} onChange={set('historico')} />
    <Opcoes rotulo="Tem mutação BRCA1/BRCA2 ou síndrome genética que eleve o risco?" valor={e.genetica ?? '' as 'nao'} opcoes={[['nao', 'Não'], ['sim', 'Sim'], ['nao_sei', 'Não sei']]} onChange={set('genetica')} />
    {bloqueio === 'historico' && <Aviso>O modelo de Gail não estima o risco com precisão para quem já teve câncer de mama, CDIS, CLIS ou radioterapia torácica. Siga o protocolo específico de seguimento.</Aviso>}
    {bloqueio === 'genetica' && <Aviso>Para portadoras de BRCA1, BRCA2 ou síndromes hereditárias, use modelos que consideram genética, como CanRisk (BOADICEA) ou Tyrer-Cuzick.</Aviso>}
    {!bloqueio && (<>
      <div className="grid sm:grid-cols-2 gap-3">
        <Num rotulo="Idade (35 a 85)" valor={e.idade} onChange={set('idade')} sufixo="anos" passo="1" />
        <label className="flex flex-col gap-1 text-meta text-apoio">Raça ou etnia (categorias do modelo)
          <select value={e.etnia ?? ''} onChange={ev => setE(x => ({ ...x, etnia: (ev.target.value || undefined) as EtniaGail | undefined, sub: '' }))} className={campo}>
            <option value="">Selecione</option>
            {ETNIAS_GAIL.map(([k, t]) => <option key={k} value={k}>{t}</option>)}
          </select>
        </label>
      </div>
      {ctx.f.ethnicity === 'Parda' && !e.etnia && <p className="text-meta text-apoio">No cadastro consta parda. O modelo não tem essa categoria: escolha a que melhor representa a paciente.</p>}
      {subs && <Opcoes rotulo={e.etnia === 'Hispanic' ? 'Local de nascimento' : 'Subgrupo'} valor={e.sub} opcoes={subs} onChange={set('sub')} />}
      {e.idade != null && !idadeOk && <p className="text-meta text-terracota">O modelo só calcula de 35 a 85 anos.</p>}
      <Opcoes rotulo="Já fez biópsia de mama com resultado benigno?" valor={e.biopsia ?? '' as '0'} opcoes={[['0', 'Não'], ['1', 'Sim'], ['99', 'Não sei']]} onChange={set('biopsia')} />
      {fezBiopsia && (<>
        <Opcoes rotulo="Quantas biópsias?" valor={e.nBiopsias ?? '' as '1'} opcoes={[['1', '1'], ['2', '2 ou mais']]} onChange={set('nBiopsias')} />
        <Opcoes rotulo="Alguma com hiperplasia atípica?" valor={e.atipia ?? '' as '1'} opcoes={[['0.93', 'Não'], ['1.82', 'Sim'], ['1', 'Não sei']]} onChange={set('atipia')} />
      </>)}
      <Opcoes rotulo="Idade da primeira menstruação" valor={e.menarca ?? '' as '0'} opcoes={[['2', '7 a 11'], ['1', '12 a 13'], ['0', '14 ou mais']]} onChange={set('menarca')} />
      <Opcoes rotulo="Idade no primeiro parto de nascido vivo" valor={e.parto ?? '' as '98'} opcoes={[['98', 'Sem filhos'], ['0', 'Antes dos 20'], ['1', '20 a 24'], ['2', '25 a 29'], ['3', '30 ou mais'], ['ns', 'Não sei']]} onChange={set('parto')} />
      <Opcoes rotulo="Parentes de 1º grau (mãe, irmãs, filhas) com câncer de mama" valor={e.parentes ?? '' as '0'} opcoes={[['0', 'Nenhum'], ['1', 'Um'], ['2', 'Mais de um'], ['ns', 'Não sei']]} onChange={set('parentes')} />
    </>)}
    {r && (
      <Resultado nivel={nivel}>
        <p className="text-[15px]"><b>Em 5 anos: {p(r.cinco)}</b> · média {p(r.cincoMedia)} ({comp(r.cinco, r.cincoMedia)} da média)</p>
        <p className="text-[15px]"><b>Até os 90 anos: {p(r.vida)}</b> · média {p(r.vidaMedia)} ({comp(r.vida, r.vidaMedia)} da média)</p>
        <p className="text-meta text-apoio mt-2">Risco de câncer de mama invasivo, comparado com mulheres da mesma idade e etnia nos EUA. Referências usuais: 5 anos ≥1,67% para discutir quimioprevenção; vida ≥20% para rastreio ampliado. Taxas de base norte-americanas (SEER); não considera densidade mamária nem genética.</p>
      </Resultado>
    )}
    <BotaoSalvar disabled={!r} onClick={() => salvar('gail', { ...e, entrada }, r!,
      `Mama (Gail): 5 anos ${p(r!.cinco)} (média ${p(r!.cincoMedia)}) · até 90 anos ${p(r!.vida)} (média ${p(r!.vidaMedia)})`, nivel)} />
  </>)
}
