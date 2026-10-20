import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { Plus, Trash2, X } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../auth/AuthProvider'
import { Aviso, Botao } from '../../components/ui'
import { LinhaIndicador, TOM } from '../../components/regua'
import { Icone, degrade, temaDoSistema } from '../../components/icones'
import { NIVEL, dataBR } from '../../lib/faixas'
import { GRUPOS, calculados, fmt, idadeEm, nivelDe, ultimas, type Indicador, type Medida } from '../../lib/clinica'

const campo = 'campo'
const MEDIDAS_ENCONTRO = ['altura', 'peso', 'cintura', 'pescoco', 'pgc', 'pas', 'pad', 'fc', 'preensao', 'sentar_levantar', 'vo2']
const n = (s: string) => (s.trim() === '' ? null : Number(s.replace(',', '.')))

export function AbaExames({ pid, nascimento, podeLancar, bio }: { pid: string; nascimento: string | null; podeLancar: boolean; bio: ReactNode }) {
  const { session } = useAuth()
  const [cat, setCat] = useState<Indicador[]>([])
  const [med, setMed] = useState<Medida[]>([])
  const [vista, setVista] = useState<'grupos' | 'grade'>('grupos')
  const [aberto, setAberto] = useState<string | null>(null)
  const [painel, setPainel] = useState<null | 'medidas' | 'exames'>(null)

  const carregar = () => supabase.from('measurements').select('id, code, value, measured_at, note').eq('patient_id', pid).order('measured_at', { ascending: false })
    .then(({ data }) => setMed((data as Medida[]) ?? []))
  useEffect(() => {
    supabase.from('indicator_catalog').select('*').order('sort').then(({ data }) => setCat((data as Indicador[]) ?? []))
    carregar()
  }, [pid])

  const ult = useMemo(() => ultimas(med), [med])
  const calc = useMemo(() => calculados(ult, idadeEm(nascimento)), [ult, nascimento])
  const porCodigo = useMemo(() => new Map(cat.map(c => [c.code, c])), [cat])
  const semRevisao = cat.some(c => c.bands.length && !c.reviewed)

  async function apagar(id: string) {
    await supabase.from('measurements').delete().eq('id', id); carregar()
  }

  const grupos = Object.keys(GRUPOS).map(g => ({
    g,
    itens: cat.filter(c => c.grp === g && c.code !== 'altura' && (c.core || ult.has(c.code))),
    calc: calc.filter(c => c.grp === g),
  })).filter(x => x.itens.length || x.calc.length)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-3">
        <div role="tablist" aria-label="Forma de ver" className="segmentado">
          {([['grupos', 'Por sistema'], ['grade', 'Grade por data']] as const).map(([k, r]) => (
            <button key={k} role="tab" aria-selected={vista === k} onClick={() => setVista(k)}
              >{r}</button>
          ))}
        </div>
        <Legenda />
        {podeLancar && (
          <div className="ml-auto flex gap-2">
            <Botao variante={painel === 'medidas' ? 'cheio' : 'linha'} onClick={() => setPainel(painel === 'medidas' ? null : 'medidas')}>Medidas do encontro</Botao>
            <Botao variante={painel === 'exames' ? 'cheio' : 'linha'} onClick={() => setPainel(painel === 'exames' ? null : 'exames')}>Lançar exames</Botao>
          </div>
        )}
      </div>

      {painel === 'medidas' && <LancarMedidas pid={pid} cat={porCodigo} autor={session?.user.id} aoSalvar={() => { setPainel(null); carregar() }} />}
      {painel === 'exames' && <LancarExames pid={pid} cat={cat} autor={session?.user.id} aoSalvar={() => { setPainel(null); carregar() }} />}

      {semRevisao && <Aviso>As faixas de cor estão no padrão inicial e aguardam a revisão da médica em Faixas dos indicadores.</Aviso>}

      {vista === 'grupos' ? (
        <div className="lg:columns-2 gap-4 [&>*]:break-inside-avoid [&>*]:mb-4">
          {grupos.map(({ g, itens, calc: cs }) => (
            <section key={g} className="rounded-lg border border-borda px-5 pt-4 pb-2" style={{ background: degrade(temaDoSistema(g)) }} aria-labelledby={`g-${g}`}>
              <h2 id={`g-${g}`} className="titulo-bloco pb-1 flex items-center gap-2.5"><Icone tema={temaDoSistema(g)} fundo tamanho={36} className="!bg-folha/80" />{GRUPOS[g]}</h2>
              <div className="divide-y divide-regra">
                {itens.map(c => {
                  const hist = ult.get(c.code) ?? []
                  const [u, a] = hist
                  const ab = aberto === c.code
                  return (
                    <div key={c.code}>
                      <button className="w-full text-left" onClick={() => setAberto(ab ? null : c.code)} aria-expanded={ab} disabled={!hist.length}>
                        <LinhaIndicador nome={c.name} valor={u?.value ?? null} unidade={c.unit} bands={c.bands} anterior={a?.value}
                          data={u ? dataBR(u.measured_at) : undefined} nota={hist.length > 1 ? `${hist.length} registros` : undefined} />
                      </button>
                      {ab && (
                        <ul className="pb-4 -mt-1 flex flex-col">
                          {hist.map(h => {
                            const nv = nivelDe(h.value, c.bands)
                            return (
                              <li key={h.id} className="group flex items-center gap-3 py-1.5 text-corpo tabular-nums">
                                <span className={`w-2 h-2 rounded-full ${nv ? TOM[nv] : 'bg-areia'}`} aria-hidden="true" />
                                <span className="w-24 text-apoio">{dataBR(h.measured_at)}</span>
                                <span>{fmt(h.value, 2)} {c.unit}</span>
                                {nv && <span className={`text-meta ${NIVEL[nv].cor}`}>{NIVEL[nv].rotulo}</span>}
                                {podeLancar && (
                                  <button onClick={() => apagar(h.id)} aria-label={`Apagar registro de ${dataBR(h.measured_at)}`}
                                    className="ml-auto text-apoio hover:text-terracota opacity-0 group-hover:opacity-100 focus:opacity-100"><Trash2 className="w-4 h-4" /></button>
                                )}
                              </li>
                            )
                          })}
                        </ul>
                      )}
                    </div>
                  )
                })}
                {cs.map(c => <LinhaIndicador key={c.code} nome={c.name} valor={c.value} unidade={c.unit} bands={c.bands} nota={`Calculado · ${c.formula}`} />)}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <Grade cat={cat} med={med} />
      )}

      <section aria-labelledby="t-bio" className="flex flex-col gap-4 pt-4">
        <h2 id="t-bio" className="titulo-bloco flex items-center gap-2.5"><Icone tema="peso" fundo tamanho={36} />Bioimpedância</h2>
        {bio}
      </section>
    </div>
  )
}

function Legenda() {
  return (
    <ul className="flex flex-wrap items-center gap-x-4 gap-y-1 text-meta text-apoio" aria-label="Legenda das faixas">
      {(['ruim', 'atencao', 'normal', 'bom', 'otimo'] as const).map(k => (
        <li key={k} className="inline-flex items-center gap-1.5"><span className={`w-3 h-2 rounded-full ${TOM[k]}`} />{NIVEL[k].rotulo}</li>
      ))}
    </ul>
  )
}

/** Grade exame × data, como a tabela do Life Up, com a cor da faixa em cada célula. */
function Grade({ cat, med }: { cat: Indicador[]; med: Medida[] }) {
  const datas = [...new Set(med.map(m => m.measured_at))].sort().reverse().slice(0, 8)
  const linhas = cat.filter(c => med.some(m => m.code === c.code))
  if (!linhas.length) return <section className="cartao p-8 text-corpo text-apoio">Nenhum exame ou medida lançado ainda.</section>
  return (
    <section className="cartao overflow-x-auto">
      <table className="w-full text-corpo min-w-[560px]">
        <thead>
          <tr>
            <th className="text-left text-meta text-apoio font-normal py-2.5 px-5 sticky left-0 bg-folha">Indicador</th>
            {datas.map(d => <th key={d} className="text-right text-meta text-apoio font-normal py-2.5 px-4 tabular-nums">{dataBR(d)}</th>)}
          </tr>
        </thead>
        <tbody>
          {linhas.map(c => (
            <tr key={c.code} className="border-b border-areia/40 last:border-0">
              <th scope="row" className="text-left font-normal py-2.5 px-5 sticky left-0 bg-folha">{c.name} <span className="text-meta text-apoio">{c.unit}</span></th>
              {datas.map(d => {
                const m = med.find(x => x.code === c.code && x.measured_at === d)
                const nv = m ? nivelDe(m.value, c.bands) : null
                return (
                  <td key={d} className="py-2.5 px-4 text-right tabular-nums">
                    {m ? <span className="inline-flex items-center gap-2">{fmt(m.value, 2)}<span className={`w-2 h-2 rounded-full ${nv ? TOM[nv] : 'bg-areia/50'}`} title={nv ? NIVEL[nv].rotulo : 'Sem faixa'} /></span>
                      : <span className="text-apoio/50">·</span>}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}

function LancarMedidas({ pid, cat, autor, aoSalvar }: { pid: string; cat: Map<string, Indicador>; autor?: string; aoSalvar: () => void }) {
  const [data, setData] = useState(() => new Date().toISOString().slice(0, 10))
  const [v, setV] = useState<Record<string, string>>({})
  const [erro, setErro] = useState(false)
  const peso = n(v.peso ?? ''), alt = n(v.altura ?? '')
  const imc = peso && alt ? peso / (alt / 100) ** 2 : null

  async function salvar() {
    const rows = MEDIDAS_ENCONTRO.map(code => ({ code, value: n(v[code] ?? '') })).filter(r => r.value != null && !Number.isNaN(r.value))
      .map(r => ({ ...r, patient_id: pid, measured_at: data, created_by: autor }))
    const { error } = await supabase.from('measurements').insert(rows)
    if (error) return setErro(true)
    aoSalvar()
  }

  return (
    <section className="cartao p-5 md:p-6 flex flex-col gap-6" aria-labelledby="t-lm">
      <div className="flex flex-wrap items-end gap-4">
        <h2 id="t-lm" className="titulo-bloco mr-auto">Medidas do encontro</h2>
        <label className="flex items-center gap-3 text-corpo text-apoio">Data
          <input type="date" value={data} onChange={e => setData(e.target.value)} className={`${campo} w-auto`} /></label>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-5 gap-y-4">
        {MEDIDAS_ENCONTRO.map(code => {
          const c = cat.get(code)
          if (!c) return null
          return (
            <label key={code} className="flex flex-col gap-1.5">
              <span className="text-meta text-apoio">{c.name} <span className="text-apoio/70">{c.unit}</span></span>
              <input inputMode="decimal" value={v[code] ?? ''} onChange={e => setV({ ...v, [code]: e.target.value })} className={campo} />
            </label>
          )
        })}
        <div className="flex flex-col gap-1.5">
          <span className="text-meta text-apoio">IMC <span className="text-apoio/70">calculado</span></span>
          <p className="min-h-[44px] flex items-center text-[20px] tabular-nums">{imc ? fmt(imc) : '·'}</p>
        </div>
      </div>
      <p className="text-meta text-apoio">Força: preensão palmar em kgf e sentar e levantar da cadeira em 30 segundos. O VO2 é lançado quando houver teste ou estimativa.</p>
      {erro && <Aviso tipo="erro">Não foi possível salvar. Confira os valores.</Aviso>}
      <Botao onClick={salvar} className="self-start" disabled={!Object.values(v).some(x => x.trim())}>Salvar medidas</Botao>
    </section>
  )
}

function LancarExames({ pid, cat, autor, aoSalvar }: { pid: string; cat: Indicador[]; autor?: string; aoSalvar: () => void }) {
  const [data, setData] = useState(() => new Date().toISOString().slice(0, 10))
  const [linhas, setLinhas] = useState<Array<{ code: string; valor: string }>>([])
  const [code, setCode] = useState('')
  const [valor, setValor] = useState('')
  const [erro, setErro] = useState(false)
  const exames = cat.filter(c => c.kind === 'exame')
  const principais = exames.filter(c => c.core), outros = exames.filter(c => !c.core)
  const nome = (k: string) => cat.find(c => c.code === k)

  function incluir() {
    if (!code || n(valor) == null) return
    setLinhas([...linhas.filter(l => l.code !== code), { code, valor }]); setCode(''); setValor('')
  }
  async function salvar() {
    const { error } = await supabase.from('measurements').insert(linhas.map(l => ({ patient_id: pid, code: l.code, value: n(l.valor), measured_at: data, created_by: autor })))
    if (error) return setErro(true)
    aoSalvar()
  }

  return (
    <section className="cartao p-5 md:p-6 flex flex-col gap-6" aria-labelledby="t-le">
      <div className="flex flex-wrap items-end gap-4">
        <h2 id="t-le" className="titulo-bloco mr-auto">Lançar exames</h2>
        <label className="flex items-center gap-3 text-corpo text-apoio">Data da coleta
          <input type="date" value={data} onChange={e => setData(e.target.value)} className={`${campo} w-auto`} /></label>
      </div>
      <form onSubmit={e => { e.preventDefault(); incluir() }} className="grid sm:grid-cols-[minmax(0,1fr)_160px_auto] gap-3 items-end">
        <label className="flex flex-col gap-1.5">
          <span className="text-meta text-apoio">Exame</span>
          <select value={code} onChange={e => setCode(e.target.value)} className={campo}>
            <option value="">Escolha o exame</option>
            <optgroup label="Principais">{principais.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}</optgroup>
            <optgroup label="Outros">{outros.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}</optgroup>
          </select>
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-meta text-apoio">Resultado {code ? <span className="text-apoio/70">{nome(code)?.unit}</span> : null}</span>
          <input inputMode="decimal" value={valor} onChange={e => setValor(e.target.value)} className={campo} />
        </label>
        <Botao type="submit" variante="linha" disabled={!code || !valor.trim()} className="min-h-[44px]"><Plus className="w-4 h-4" />Incluir</Botao>
      </form>

      {linhas.length > 0 && (
        <ul className="flex flex-col">
          {linhas.map(l => {
            const c = nome(l.code)!, nv = nivelDe(n(l.valor), c.bands)
            return (
              <li key={l.code} className="flex items-center gap-3 py-2 border-b border-regra text-corpo">
                <span className={`w-2 h-2 rounded-full ${nv ? TOM[nv] : 'bg-areia'}`} aria-hidden="true" />
                <span className="flex-1">{c.name}</span>
                <span className="tabular-nums">{l.valor} {c.unit}</span>
                <button onClick={() => setLinhas(linhas.filter(x => x.code !== l.code))} aria-label={`Remover ${c.name}`} className="text-apoio hover:text-terracota"><X className="w-4 h-4" /></button>
              </li>
            )
          })}
        </ul>
      )}
      {erro && <Aviso tipo="erro">Não foi possível salvar. Confira os valores.</Aviso>}
      <Botao onClick={salvar} disabled={!linhas.length} className="self-start">Salvar {linhas.length || ''} exame{linhas.length === 1 ? '' : 's'}</Botao>
    </section>
  )
}

