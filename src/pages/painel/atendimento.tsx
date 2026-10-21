import { ReceitasEquipe } from '../../components/receitas'
import { useEffect, useMemo, useState } from 'react'
import { Check, Copy, Plus, Search, X } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { Icone } from '../../components/icones'
import { useAuth } from '../../auth/AuthProvider'
import { Botao } from '../../components/ui'
import { dataBR } from '../../lib/faixas'
import { calculados, idadeEm, nivelDe, ultimas, type Indicador, type Medida } from '../../lib/clinica'

type Nota = { id: string; kind: 'evolucao' | 'anotacao'; noted_at: string; body: string; author: string | null; profiles: { full_name: string | null } | null }
type Problema = { id: string; title: string; detail: string | null; active: boolean; created_at: string; resolved_at: string | null }
type Conduta = { id: string; kind: 'medicacao' | 'plano'; title: string; detail: string | null; active: boolean; started_at: string; ended_at: string | null; prescription_id?: string | null }

const MODELOS: Record<string, string> = {
  'Primeiro encontro': `Queixa principal:

História da doença atual:

Climatério: data da última menstruação, fogachos, sono, humor, libido, sintomas urogenitais.

Antecedentes pessoais:

Antecedentes familiares:

Medicações em uso:

Hábitos: alimentação, atividade física, álcool, tabagismo.

Exame físico: PA, FC, peso, altura, cintura.

Impressão:

Conduta:`,
  'Encontro de seguimento': `Como chegou desde o último encontro:

Adesão ao protocolo:

Sintomas: fogachos, sono, humor, energia.

Exames e medidas novos:

Impressão:

Ajustes no protocolo:`,
}

const campo = 'campo'

export function AbaAtendimento({ pid, nascimento }: { pid: string; nascimento: string | null }) {
  return (
    <div className="grid xl:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)] gap-6 items-start">
      <div className="flex flex-col gap-6 min-w-0">
        <Evolucao pid={pid} />
        <Condutas pid={pid} />
      </div>
      <div className="flex flex-col gap-6 min-w-0">
        <Problemas pid={pid} nascimento={nascimento} />
      </div>
    </div>
  )
}

function Evolucao({ pid }: { pid: string }) {
  const { session, profile } = useAuth()
  const [notas, setNotas] = useState<Nota[]>([])
  const [texto, setTexto] = useState('')
  const [tipo, setTipo] = useState<'evolucao' | 'anotacao'>('evolucao')
  const [data, setData] = useState(() => new Date().toISOString().slice(0, 10))
  const [busca, setBusca] = useState('')
  const [filtro, setFiltro] = useState<'todas' | 'evolucao' | 'anotacao'>('todas')
  const [aberta, setAberta] = useState<string | null>(null)
  const [msg, setMsg] = useState<{ t: 'ok' | 'erro'; m: string } | null>(null)
  const [copiado, setCopiado] = useState<string | null>(null)

  const carregar = () => supabase.from('clinical_notes').select('id, kind, noted_at, body, author, profiles:author(full_name)')
    .eq('patient_id', pid).order('noted_at', { ascending: false }).order('created_at', { ascending: false })
    .then(({ data }) => setNotas((data as unknown as Nota[]) ?? []))
  useEffect(() => { carregar() }, [pid])

  async function salvar() {
    setMsg(null)
    const { error } = await supabase.from('clinical_notes').insert({ patient_id: pid, kind: tipo, noted_at: data, body: texto.trim(), author: session?.user.id })
    if (error) return setMsg({ t: 'erro', m: 'Não foi possível salvar. Tente de novo.' })
    setTexto(''); setMsg({ t: 'ok', m: tipo === 'evolucao' ? 'Evolução salva.' : 'Anotação salva.' }); carregar()
  }

  async function copiar(n: Nota) {
    await navigator.clipboard.writeText(`${dataBR(n.noted_at)}\n\n${n.body}`)
    setCopiado(n.id); setTimeout(() => setCopiado(null), 1600)
  }

  const visiveis = useMemo(() => notas.filter(n =>
    (filtro === 'todas' || n.kind === filtro) && (!busca || n.body.toLowerCase().includes(busca.toLowerCase()))), [notas, filtro, busca])

  return (
    <section className="cartao" aria-labelledby="t-evolucao">
      <div className="px-5 pt-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 id="t-evolucao" className="titulo-bloco flex items-center gap-2.5"><Icone tema="nota" fundo tamanho={36} />Evolução clínica</h2>
          <p className="text-meta text-apoio mt-0.5">Visível só para você e para a equipe com acesso clínico.</p>
        </div>
        <div role="radiogroup" aria-label="Tipo de registro" className="segmentado">
          {([['evolucao', 'Evolução'], ['anotacao', 'Anotação interna']] as const).map(([k, r]) => (
            <button key={k} role="radio" aria-checked={tipo === k} onClick={() => setTipo(k)}
              >{r}</button>
          ))}
        </div>
      </div>

      <div className="p-5 flex flex-col gap-3">
        <div className="flex flex-wrap gap-3">
          <label className="sr-only" htmlFor="ev-data">Data do registro</label>
          <input id="ev-data" type="date" value={data} onChange={e => setData(e.target.value)} className={`${campo} min-h-[44px] w-auto`} />
          <label className="sr-only" htmlFor="ev-modelo">Modelo de anamnese</label>
          <select id="ev-modelo" value="" className={`${campo} min-h-[44px] w-auto text-apoio`}
            onChange={e => { const m = MODELOS[e.target.value]; if (m) setTexto(t => (t.trim() ? `${t}\n\n${m}` : m)) }}>
            <option value="">Inserir modelo de anamnese</option>
            {Object.keys(MODELOS).map(k => <option key={k}>{k}</option>)}
          </select>
        </div>
        <label className="sr-only" htmlFor="ev-texto">Texto do registro</label>
        <textarea id="ev-texto" value={texto} onChange={e => setTexto(e.target.value)} rows={12}
          placeholder={tipo === 'evolucao' ? 'Descreva o encontro. O texto fica no histórico da paciente.' : 'Nota interna, fora da evolução.'}
          className={`${campo} py-4 leading-relaxed resize-y min-h-[240px]`} />
        <div className="flex items-center gap-4">
          <Botao disabled={!texto.trim()} onClick={salvar}>{tipo === 'evolucao' ? 'Salvar evolução' : 'Salvar anotação'}</Botao>
          {msg && <span className={`text-corpo ${msg.t === 'ok' ? 'text-oliva' : 'text-terracota'}`} role="status">{msg.m}</span>}
        </div>
      </div>

      <div className="border-t border-borda">
        <div className="px-5 py-4 flex flex-wrap items-center gap-3">
          <h3 className="titulo-bloco mr-auto">Histórico <span className="text-apoio text-base">{notas.length}</span></h3>
          <div className="relative">
            <Search className="w-4 h-4 text-apoio absolute left-3 top-1/2 -translate-y-1/2" />
            <label className="sr-only" htmlFor="ev-busca">Buscar no histórico</label>
            <input id="ev-busca" value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar" className={`${campo} min-h-[40px] pl-9 w-48`} />
          </div>
          <label className="sr-only" htmlFor="ev-filtro">Filtrar</label>
          <select id="ev-filtro" value={filtro} onChange={e => setFiltro(e.target.value as typeof filtro)} className={`${campo} min-h-[40px] w-auto`}>
            <option value="todas">Tudo</option><option value="evolucao">Evoluções</option><option value="anotacao">Anotações</option>
          </select>
        </div>
        {visiveis.length === 0 ? (
          <p className="px-5 pb-5 text-corpo text-apoio">{notas.length ? 'Nada encontrado com esse filtro.' : 'Nenhum registro ainda. A primeira evolução aparece aqui.'}</p>
        ) : (
          <ol className="pb-2">
            {visiveis.map(n => {
              const ab = aberta === n.id
              return (
                <li key={n.id} className="px-5 py-4 border-t border-regra first:border-t-0">
                  <div className="flex items-baseline gap-3">
                    <p className="font-medium tabular-nums">{dataBR(n.noted_at)}</p>
                    <p className="text-meta text-apoio">{n.kind === 'anotacao' ? 'Anotação interna' : 'Evolução'}{n.profiles?.full_name && n.author !== profile?.id ? ` · ${n.profiles.full_name}` : ''}</p>
                    <button onClick={() => copiar(n)} className="ml-auto text-meta text-apoio hover:text-texto inline-flex items-center gap-1.5">
                      {copiado === n.id ? <><Check className="w-3.5 h-3.5" />Copiado</> : <><Copy className="w-3.5 h-3.5" />Copiar</>}
                    </button>
                  </div>
                  <p className={`mt-2 text-[15px] leading-relaxed whitespace-pre-wrap ${ab ? '' : 'line-clamp-3'}`}>{n.body}</p>
                  {n.body.split('\n').length > 3 || n.body.length > 260 ? (
                    <button onClick={() => setAberta(ab ? null : n.id)} className="mt-1 text-corpo text-cafe hover:underline">{ab ? 'Recolher' : 'Ler tudo'}</button>
                  ) : null}
                </li>
              )
            })}
          </ol>
        )}
      </div>
    </section>
  )
}

function Condutas({ pid }: { pid: string }) {
  const { session } = useAuth()
  const [lista, setLista] = useState<Conduta[]>([])
  const [novo, setNovo] = useState<{ kind: 'medicacao' | 'plano'; title: string; detail: string } | null>(null)
  const [historico, setHistorico] = useState(false)

  const carregar = () => supabase.from('conducts').select('*').eq('patient_id', pid).order('started_at', { ascending: false })
    .then(({ data }) => setLista((data as Conduta[]) ?? []))
  useEffect(() => { carregar() }, [pid])

  async function salvar() {
    if (!novo?.title.trim()) return
    await supabase.from('conducts').insert({ patient_id: pid, kind: novo.kind, title: novo.title.trim(), detail: novo.detail.trim() || null, created_by: session?.user.id })
    setNovo(null); carregar()
  }
  async function encerrar(c: Conduta) {
    await supabase.from('conducts').update({ active: false, ended_at: new Date().toISOString().slice(0, 10) }).eq('id', c.id)
    carregar()
  }

  const ativas = lista.filter(c => c.active)
  const encerradas = lista.filter(c => !c.active)

  return (
    <section className="cartao" aria-labelledby="t-condutas">
      <div className="px-5 pt-4 pb-2 flex items-end justify-between gap-4">
        <h2 id="t-condutas" className="titulo-bloco flex items-center gap-2.5"><Icone tema="medicacao" fundo tamanho={36} />Condutas ativas</h2>
        {encerradas.length > 0 && (
          <button onClick={() => setHistorico(!historico)} className="text-corpo text-apoio hover:text-texto">
            {historico ? 'Ocultar encerradas' : `Ver encerradas (${encerradas.length})`}
          </button>
        )}
      </div>
      <div className="grid md:grid-cols-2">
        {(['medicacao', 'plano'] as const).map((k, i) => {
          const itens = (historico ? lista : ativas).filter(c => c.kind === k)
          return (
            <div key={k} className={`px-5 pb-5 pt-2 flex flex-col gap-3 ${i ? 'md:border-l border-t md:border-t-0 border-borda' : ''}`}>
              <p className="rotulo">{k === 'medicacao' ? 'Medicações' : 'Plano e combinados'}</p>
              {itens.length === 0 && <p className="text-corpo text-apoio">{k === 'medicacao' ? 'Nenhuma medicação ativa.' : 'Nenhum combinado ativo.'}</p>}
              <ul className="flex flex-col">
                {itens.map(c => (
                  <li key={c.id} className={`group py-2.5 border-b border-regra last:border-0 flex gap-3 ${c.active ? '' : 'opacity-55'}`}>
                    <div className="flex-1 min-w-0">
                      <p className="text-[15px]">{c.title}</p>
                      <p className="text-meta text-apoio">{c.prescription_id ? 'Com receita · ' : ''}{c.detail ? `${c.detail} · ` : ''}desde {dataBR(c.started_at)}{c.ended_at ? ` até ${dataBR(c.ended_at)}` : ''}</p>
                    </div>
                    {c.active && (
                      <button onClick={() => encerrar(c)} aria-label={`Encerrar ${c.title}`}
                        className="text-meta text-apoio hover:text-terracota opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity">Encerrar</button>
                    )}
                  </li>
                ))}
              </ul>
              {novo?.kind === k ? (
                <div className="flex flex-col gap-2">
                  <label className="sr-only" htmlFor={`cd-${k}`}>Nome</label>
                  <input id={`cd-${k}`} autoFocus value={novo.title} onChange={e => setNovo({ ...novo, title: e.target.value })}
                    placeholder={k === 'medicacao' ? 'Ex.: Estradiol gel 0,75 mg' : 'Ex.: Caminhar 30 min, 5x por semana'} className={`${campo} min-h-[44px]`} />
                  <label className="sr-only" htmlFor={`cdd-${k}`}>Posologia ou detalhe</label>
                  <input id={`cdd-${k}`} value={novo.detail} onChange={e => setNovo({ ...novo, detail: e.target.value })}
                    placeholder={k === 'medicacao' ? 'Posologia' : 'Detalhe'} className={`${campo} min-h-[44px]`}
                    onKeyDown={e => e.key === 'Enter' && salvar()} />
                  <div className="flex gap-2">
                    <Botao onClick={salvar} disabled={!novo.title.trim()} className="min-h-[42px] px-5">Adicionar</Botao>
                    <Botao variante="texto" onClick={() => setNovo(null)}>Cancelar</Botao>
                  </div>
                </div>
              ) : (
                <button onClick={() => setNovo({ kind: k, title: '', detail: '' })} className="self-start inline-flex items-center gap-1.5 text-corpo text-cafe hover:underline">
                  <Plus className="w-4 h-4" />{k === 'medicacao' ? 'Adicionar medicação' : 'Adicionar combinado'}
                </button>
              )}
            </div>
          )
        })}
      </div>
      <ReceitasEquipe pid={pid} aoMudar={carregar} />
    </section>
  )
}

function Problemas({ pid, nascimento }: { pid: string; nascimento: string | null }) {
  const { session } = useAuth()
  const [lista, setLista] = useState<Problema[]>([])
  const [cat, setCat] = useState<Indicador[]>([])
  const [med, setMed] = useState<Medida[]>([])
  const [ignorados, setIgnorados] = useState<string[]>([])
  const [todas, setTodas] = useState(false)
  const [novo, setNovo] = useState('')
  const [detalhe, setDetalhe] = useState('')

  const carregar = () => supabase.from('problems').select('*').eq('patient_id', pid).order('created_at', { ascending: false })
    .then(({ data }) => setLista((data as Problema[]) ?? []))
  useEffect(() => {
    carregar()
    supabase.from('indicator_catalog').select('*').then(({ data }) => setCat((data as Indicador[]) ?? []))
    supabase.from('measurements').select('id, code, value, measured_at, note').eq('patient_id', pid).then(({ data }) => setMed((data as Medida[]) ?? []))
  }, [pid])

  // Sugestões: indicadores na faixa ruim ou atenção que ainda não viraram problema
  const sugestoes = useMemo(() => {
    const ult = ultimas(med)
    const titulos = new Set(lista.map(p => p.title.toLowerCase()))
    const itens = [
      ...cat.map(c => ({ name: c.name, unit: c.unit, bands: c.bands, v: ult.get(c.code)?.[0] })).filter(x => x.v).map(x => ({ ...x, value: x.v!.value, data: x.v!.measured_at })),
      ...calculados(ult, idadeEm(nascimento)).map(c => ({ name: c.name, unit: c.unit, bands: c.bands, value: c.value, data: '' })),
    ]
    return itens.map(x => ({ ...x, nivel: nivelDe(x.value, x.bands) }))
      .filter(x => (x.nivel === 'ruim' || x.nivel === 'atencao'))
      .map(x => ({ nivel: x.nivel, titulo: `${x.name} ${x.nivel === 'ruim' ? 'fora da faixa' : 'em atenção'}`, detalhe: `${x.value.toLocaleString('pt-BR', { maximumFractionDigits: 2 })} ${x.unit}${x.data ? ` em ${dataBR(x.data)}` : ''}` }))
      .filter(s => !titulos.has(s.titulo.toLowerCase()) && !ignorados.includes(s.titulo))
      .sort((a, b) => (a.nivel === 'ruim' ? 0 : 1) - (b.nivel === 'ruim' ? 0 : 1))
  }, [cat, med, lista, ignorados, nascimento])

  async function adicionar(title: string, detail: string | null) {
    await supabase.from('problems').insert({ patient_id: pid, title, detail, created_by: session?.user.id })
    setNovo(''); setDetalhe(''); carregar()
  }
  async function alternar(p: Problema) {
    await supabase.from('problems').update({ active: !p.active, resolved_at: p.active ? new Date().toISOString() : null }).eq('id', p.id)
    carregar()
  }

  const ativos = lista.filter(p => p.active), resolvidos = lista.filter(p => !p.active)

  return (
    <section className="cartao" aria-labelledby="t-problemas">
      <div className="px-5 pt-4 pb-4">
        <h2 id="t-problemas" className="titulo-bloco flex items-center gap-2.5"><Icone tema="alerta" fundo tamanho={36} />Lista de problemas</h2>
        <p className="text-meta text-apoio mt-0.5">{ativos.length} ativo{ativos.length === 1 ? '' : 's'}{resolvidos.length ? ` · ${resolvidos.length} resolvido${resolvidos.length === 1 ? '' : 's'}` : ''}</p>
      </div>

      {sugestoes.length > 0 && (
        <div className="mx-5 mb-4 rounded-lg bg-tom p-3 flex flex-col gap-1">
          <p className="rotulo px-1 pb-1">Sugeridos pelos exames · {sugestoes.length}</p>
          {(todas ? sugestoes : sugestoes.slice(0, 3)).map(s => (
            <div key={s.titulo} className="flex items-center gap-2.5 rounded bg-folha px-3 py-2">
              <span className={`w-2 h-2 rounded-full shrink-0 ${s.nivel === 'ruim' ? 'bg-terracota' : 'bg-cobre/70'}`} aria-hidden="true" />
              <div className="flex-1 min-w-0">
                <p className="text-corpo truncate">{s.titulo}</p>
                <p className="text-meta text-apoio">{s.detalhe}</p>
              </div>
              <button onClick={() => adicionar(s.titulo, s.detalhe)} className="h-8 px-2 rounded text-meta font-medium text-cafe hover:bg-tom inline-flex items-center gap-1"><Plus className="w-3.5 h-3.5" />Incluir</button>
              <button onClick={() => setIgnorados([...ignorados, s.titulo])} aria-label={`Ignorar ${s.titulo}`} title="Ignorar" className="w-8 h-8 grid place-items-center rounded text-apoio hover:text-texto hover:bg-tom"><X className="w-4 h-4" /></button>
            </div>
          ))}
          {sugestoes.length > 3 && (
            <button onClick={() => setTodas(!todas)} className="self-start px-1 pt-1 text-meta text-cafe hover:underline">{todas ? 'Mostrar menos' : `Ver mais ${sugestoes.length - 3}`}</button>
          )}
        </div>
      )}

      <ul>
        {[...ativos, ...resolvidos].map(p => (
          <li key={p.id} className="px-5 py-3.5 border-t border-regra flex gap-3 items-start">
            <button onClick={() => alternar(p)} aria-label={p.active ? `Marcar ${p.title} como resolvido` : `Reabrir ${p.title}`}
              className={`mt-0.5 w-5 h-5 shrink-0 border grid place-items-center transition-colors ${p.active ? 'border-areia hover:border-cafe' : 'bg-oliva border-oliva text-creme'}`}>
              {!p.active && <Check className="w-3.5 h-3.5" />}
            </button>
            <div className={`min-w-0 ${p.active ? '' : 'opacity-55'}`}>
              <p className={`text-[15px] ${p.active ? '' : 'line-through decoration-apoio/50'}`}>{p.title}</p>
              {p.detail && <p className="text-meta text-apoio mt-0.5 leading-relaxed">{p.detail}</p>}
            </div>
          </li>
        ))}
      </ul>
      {lista.length === 0 && sugestoes.length === 0 && <p className="px-5 pb-2 text-corpo text-apoio">Nenhum problema registrado.</p>}

      <form className="p-5 border-t border-borda flex flex-col gap-2" onSubmit={e => { e.preventDefault(); if (novo.trim()) adicionar(novo.trim(), detalhe.trim() || null) }}>
        <label className="sr-only" htmlFor="pb-novo">Novo problema</label>
        <input id="pb-novo" value={novo} onChange={e => setNovo(e.target.value)} placeholder="Novo problema, ex.: Sarcopenia" className={`${campo} min-h-[44px]`} />
        {novo && (<>
          <label className="sr-only" htmlFor="pb-det">Descrição curta</label>
          <input id="pb-det" value={detalhe} onChange={e => setDetalhe(e.target.value)} placeholder="Descrição curta (opcional)" className={`${campo} min-h-[44px]`} />
        </>)}
        <Botao type="submit" variante="linha" disabled={!novo.trim()} className="self-start min-h-[42px] px-5"><Plus className="w-4 h-4" />Adicionar</Botao>
      </form>
      
    </section>
  )
}

