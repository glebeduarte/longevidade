import { useCallback, useEffect, useState } from 'react'
import { Check, ChevronDown, Plus, Trash2, X } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../auth/AuthProvider'
import { Aviso, Bloco, Botao, Selo, Vazio } from '../../components/ui'
import { dataBR } from '../../lib/faixas'
import { COR, Icone, type Tema } from '../../components/icones'
import {
  ADESAO, LOCAL, STATUS_ENCONTRO, TIPO_ITEM, dataHora, dia, hojeISO, mesDoPrograma,
  type Checkin, type Encontro, type ItemProtocolo, type Matricula, type Programa, type Protocolo,
} from '../../lib/programa'

const TEMA_ITEM: Record<ItemProtocolo['tipo'], Tema> = { medicacao: 'protocolo', habito: 'atividade', exame: 'evolucao', orientacao: 'checkin' }
const preco = (c: number) => (c / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })

export function AbaPrograma({ pid, nome, podeGerir, clinico, aoEncerrar }:
  { pid: string; nome: string; podeGerir: boolean; clinico: boolean; aoEncerrar: () => void }) {
  const [mat, setMat] = useState<Matricula | null | undefined>(undefined)
  const [encontros, setEncontros] = useState<Encontro[]>([])
  const [checkins, setCheckins] = useState<Checkin[]>([])

  const carregar = useCallback(() => {
    supabase.from('enrollments').select('*, programs(*)').eq('patient_id', pid).order('start_date', { ascending: false }).limit(1).maybeSingle()
      .then(({ data }) => setMat((data as Matricula) ?? null))
    supabase.from('encounters').select('*').eq('patient_id', pid).order('target_date').then(({ data }) => setEncontros((data as Encontro[]) ?? []))
    supabase.from('checkins').select('*').eq('patient_id', pid).order('due_date').then(({ data }) => setCheckins((data as Checkin[]) ?? []))
  }, [pid])
  useEffect(carregar, [carregar])

  if (mat === undefined) return <p className="text-corpo text-apoio">Carregando</p>
  if (!mat) return podeGerir ? <NovaMatricula pid={pid} aoSalvar={carregar} /> : <Aviso>Esta paciente ainda não foi matriculada em um programa.</Aviso>

  const { mes, total } = mesDoPrograma(mat)
  const respondidos = checkins.filter(c => c.status === 'respondido' || c.status === 'atendido').length
  const vencidos = checkins.filter(c => c.due_date <= hojeISO()).length
  const encerrado = mat.status !== 'ativa'

  return (
    <div className="flex flex-col gap-4">
      <section aria-label="Resumo do programa" className="rounded-lg border border-borda overflow-hidden grid grid-cols-2 lg:grid-cols-4 gap-px bg-borda">
        <div className="bg-folha px-5 py-4"><p className="rotulo">Plano</p><p className="text-bloco font-medium mt-1.5">{mat.programs?.name}</p><p className="text-meta text-apoio">{dataBR(mat.start_date)} a {dataBR(mat.end_date)}</p></div>
        <div className="bg-folha px-5 py-4"><p className="rotulo">Momento</p><p className="numero mt-1">{encerrado ? 'Encerrado' : <>Mês {mes}<span className="text-meta text-apoio"> de {total}</span></>}</p>
          <div className="mt-2 flex gap-1" aria-hidden="true">{Array.from({ length: total }, (_, i) => <span key={i} className={`h-1 flex-1 rounded-full ${i < mes ? 'bg-cafe' : 'bg-tom'}`} />)}</div></div>
        <div className="bg-folha px-5 py-4"><p className="rotulo">Encontros</p><p className="numero mt-1">{encontros.filter(e => e.status === 'realizado').length}<span className="text-meta text-apoio"> de {encontros.filter(e => e.status !== 'cancelado').length} realizados</span></p></div>
        <div className="bg-folha px-5 py-4"><p className="rotulo">Adesão aos check-ins</p><p className="numero mt-1">{vencidos ? Math.round((respondidos / vencidos) * 100) : 0}%<span className="text-meta text-apoio"> · {respondidos} de {vencidos}</span></p></div>
      </section>

      <div className="grid xl:grid-cols-12 gap-4 items-start">
        <div className="xl:col-span-7 flex flex-col gap-4">
          <Encontros lista={encontros} podeGerir={podeGerir && !encerrado} aoMudar={carregar} />
          {clinico && <Protocolos pid={pid} podeEditar={!encerrado} />}
        </div>
        <div className="xl:col-span-5 flex flex-col gap-4">
          <LinhaCheckins lista={checkins} />
          {podeGerir && !encerrado && <Encerrar pid={pid} nome={nome} mat={mat} aoEncerrar={() => { carregar(); aoEncerrar() }} />}
        </div>
      </div>
    </div>
  )
}

function NovaMatricula({ pid, aoSalvar }: { pid: string; aoSalvar: () => void }) {
  const [programas, setProgramas] = useState<Programa[]>([])
  const [sel, setSel] = useState('')
  const [inicio, setInicio] = useState(hojeISO())
  const [erro, setErro] = useState(false)
  useEffect(() => { supabase.from('programs').select('*').eq('active', true).order('price_cents').then(({ data }) => setProgramas((data as Programa[]) ?? [])) }, [])
  const p = programas.find(x => x.id === sel)
  const fim = p ? new Date(dia(inicio).setMonth(dia(inicio).getMonth() + p.duration_months)).toISOString().slice(0, 10) : null

  async function salvar() {
    if (!p || !fim) return
    const { error } = await supabase.from('enrollments').insert({ patient_id: pid, program_id: p.id, start_date: inicio, end_date: fim })
    if (error) return setErro(true)
    aoSalvar()
  }

  return (
    <div className="grid lg:grid-cols-[320px_1fr] gap-x-10 gap-y-4">
      <div>
        <h2 className="titulo-bloco">Matricular no programa</h2>
        <p className="text-corpo text-apoio mt-1">Ao confirmar, o sistema cria os encontros do plano e a agenda de check-ins: semanal no primeiro mês e quinzenal depois.</p>
      </div>
      <div className="painel-tom p-4 flex flex-col gap-3">
        <div role="radiogroup" aria-label="Plano" className="grid sm:grid-cols-3 gap-2">
          {programas.map(x => (
            <button key={x.id} role="radio" aria-checked={sel === x.id} onClick={() => setSel(x.id)}
              className={`text-left rounded-lg border p-3.5 transition-colors ${sel === x.id ? 'border-cafe bg-folha' : 'border-borda bg-folha/70 hover:border-controle'}`}>
              <p className="text-corpo font-medium">{x.name.replace('Longevidade ', '')}</p>
              <p className="text-meta text-apoio mt-0.5">{x.duration_months} meses · {x.encounters} encontros{x.slug === 'completo' ? ' + parceiros' : ''}</p>
              <p className="text-corpo tabular-nums mt-2">{preco(x.price_cents)}</p>
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1.5"><span className="text-corpo font-medium">Início</span>
            <input type="date" value={inicio} onChange={e => setInicio(e.target.value)} className="campo w-auto" /></label>
          {fim && <p className="text-corpo text-apoio pb-3">Termina em {dataBR(fim)}</p>}
          <Botao className="ml-auto" disabled={!p} onClick={salvar}>Matricular</Botao>
        </div>
        {erro && <Aviso tipo="erro">Não foi possível matricular. Tente de novo.</Aviso>}
      </div>
    </div>
  )
}

function Encontros({ lista, podeGerir, aoMudar }: { lista: Encontro[]; podeGerir: boolean; aoMudar: () => void }) {
  const [edit, setEdit] = useState<string | null>(null)
  const [quando, setQuando] = useState('')

  async function mudar(e: Encontro, patch: Partial<Encontro>) {
    await supabase.from('encounters').update(patch).eq('id', e.id); setEdit(null); aoMudar()
  }
  const tom = (s: Encontro['status']) => s === 'realizado' ? 'ok' : s === 'agendado' ? 'escuro' : s === 'faltou' ? 'risco' : 'neutro'

  return (
    <Bloco titulo="Encontros" sub="Gerados pelo plano. Agende, registre a presença ou ajuste a data." semPad>
      <ol className="pb-2">
        {lista.map(e => {
          const prox = e.status === 'agendado' || (e.status === 'previsto' && e.target_date >= hojeISO())
          return (
            <li key={e.id} className="px-5 py-3 border-t border-regra">
              <div className="flex items-center gap-3">
                <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${e.status === 'realizado' ? 'bg-oliva' : e.status === 'agendado' ? 'bg-cafe' : e.status === 'faltou' ? 'bg-terracota' : 'border border-controle'}`} aria-hidden="true" />
                <div className="flex-1 min-w-0">
                  <p className={`text-corpo font-medium ${e.status === 'cancelado' ? 'line-through text-apoio' : ''}`}>{e.title}</p>
                  <p className="text-meta text-apoio">
                    {e.status === 'realizado' && e.done_at && !e.scheduled_at ? `realizado em ${dataBR(e.done_at)}` : e.scheduled_at ? dataHora(e.scheduled_at) : `previsto para ${dataBR(e.target_date)}`}
                    {e.location ? ` · ${LOCAL[e.location]}` : ''}
                  </p>
                </div>
                <Selo tom={tom(e.status)}>{STATUS_ENCONTRO[e.status]}</Selo>
                {podeGerir && prox && (
                  <button onClick={() => { setEdit(edit === e.id ? null : e.id); setQuando(e.scheduled_at ? new Date(new Date(e.scheduled_at).getTime() - new Date().getTimezoneOffset() * 6e4).toISOString().slice(0, 16) : `${e.target_date}T09:00`) }}
                    aria-expanded={edit === e.id} aria-label={`Opções de ${e.title}`} className="w-8 h-8 grid place-items-center rounded hover:bg-tom text-apoio">
                    <ChevronDown className={`w-4 h-4 transition-transform ${edit === e.id ? 'rotate-180' : ''}`} />
                  </button>
                )}
              </div>
              {edit === e.id && (
                <div className="mt-3 ml-5 painel-tom p-3 flex flex-wrap items-end gap-2">
                  <label className="flex flex-col gap-1"><span className="text-meta text-apoio">Data e hora</span>
                    <input type="datetime-local" value={quando} onChange={x => setQuando(x.target.value)} className="campo w-auto" /></label>
                  <Botao tamanho="sm" variante="linha" onClick={() => mudar(e, { status: 'agendado', scheduled_at: new Date(quando).toISOString() })}>{e.scheduled_at ? 'Remarcar' : 'Agendar'}</Botao>
                  <Botao tamanho="sm" onClick={() => mudar(e, { status: 'realizado', done_at: new Date().toISOString() })}><Check className="w-4 h-4" />Realizado</Botao>
                  <Botao tamanho="sm" variante="texto" onClick={() => mudar(e, { status: 'faltou' })}>Faltou</Botao>
                </div>
              )}
            </li>
          )
        })}
      </ol>
    </Bloco>
  )
}

function LinhaCheckins({ lista }: { lista: Checkin[] }) {
  const [aberto, setAberto] = useState<string | null>(null)
  const hoje = hojeISO()
  const passados = lista.filter(c => c.due_date <= hoje || c.status !== 'aberto').reverse()
  const proximo = lista.find(c => c.due_date > hoje && c.status === 'aberto')
  const cor = (c: Checkin) => c.reaction ? 'bg-terracota' : c.status === 'atendido' ? 'bg-oliva' : c.status === 'respondido' ? 'bg-cobre' : c.status === 'perdido' ? 'bg-areia' : 'border border-controle'

  return (
    <Bloco titulo="Check-ins" sub={proximo ? `Próximo em ${dataBR(proximo.due_date)}` : 'Sem check-ins futuros'} semPad>
      <div className="px-5 pb-3 flex flex-wrap gap-1" aria-label="Linha do tempo dos check-ins">
        {lista.map(c => <span key={c.id} title={`${dataBR(c.due_date)} · ${c.status}`} className={`w-3 h-3 rounded-full ${cor(c)} ${c.due_date > hoje ? 'opacity-40' : ''}`} />)}
      </div>
      <div className="px-5 pb-3 flex flex-wrap gap-x-3 gap-y-1 text-meta text-apoio">
        {([['bg-oliva', 'Atendido'], ['bg-cobre', 'Aguardando resposta'], ['bg-terracota', 'Reação relatada'], ['bg-areia', 'Não respondido']] as const).map(([c, r]) => (
          <span key={r} className="inline-flex items-center gap-1.5"><span className={`w-2 h-2 rounded-full ${c}`} />{r}</span>
        ))}
      </div>
      <ul>
        {passados.slice(0, 6).map(c => (
          <li key={c.id} className="border-t border-regra">
            <button className="w-full text-left px-5 py-2.5 flex items-center gap-3 hover:bg-tom/50" onClick={() => setAberto(aberto === c.id ? null : c.id)} aria-expanded={aberto === c.id} disabled={!c.answers}>
              <span className={`w-2 h-2 rounded-full shrink-0 ${cor(c)}`} />
              <span className="text-corpo tabular-nums w-24">{dataBR(c.due_date)}</span>
              <span className="text-meta text-apoio flex-1 truncate">{c.answers?.mensagem || (c.status === 'perdido' ? 'Não respondido' : c.status === 'aberto' ? 'Aberto' : 'Sem mensagem')}</span>
            </button>
            {aberto === c.id && c.answers && <DetalheCheckin c={c} />}
          </li>
        ))}
      </ul>
    </Bloco>
  )
}

export function DetalheCheckin({ c }: { c: Checkin }) {
  const a = c.answers!
  return (
    <div className="px-5 pb-4 flex flex-col gap-2">
      <div className="grid grid-cols-4 gap-2">
        {(['fogachos', 'sono', 'humor', 'energia'] as const).map(k => (
          <div key={k} className="painel-tom px-3 py-2"><p className="text-meta text-apoio capitalize">{k}</p><p className="text-bloco tabular-nums">{a[k] ?? '·'}<span className="text-meta text-apoio">/10</span></p></div>
        ))}
      </div>
      <p className="text-meta text-apoio">{a.adesao ? ADESAO[a.adesao] : ''}{a.peso ? ` · peso em casa ${a.peso} kg` : ''}</p>
      {a.reacao && <p className="text-corpo text-[#7c3f29]">Reação relatada: {a.reacao_texto || 'sem descrição'}</p>}
      {a.mensagem && <p className="text-corpo">“{a.mensagem}”</p>}
      {c.reply && <p className="text-corpo text-apoio border-l-2 border-areia pl-3">Resposta: {c.reply}</p>}
    </div>
  )
}

function Protocolos({ pid, podeEditar }: { pid: string; podeEditar: boolean }) {
  const { session } = useAuth()
  const [lista, setLista] = useState<Protocolo[]>([])
  const [rasc, setRasc] = useState<{ intro: string; items: ItemProtocolo[] } | null>(null)
  const [ver, setVer] = useState<number | null>(null)

  const carregar = () => supabase.from('protocols').select('*').eq('patient_id', pid).order('version', { ascending: false }).then(({ data }) => setLista((data as Protocolo[]) ?? []))
  useEffect(() => { carregar() }, [pid])

  const atual = lista.find(p => p.published_at)
  async function novaVersao() {
    if (atual) return setRasc({ intro: atual.intro ?? '', items: atual.items.map(i => ({ ...i })) })
    const { data } = await supabase.from('conducts').select('kind, title, detail').eq('patient_id', pid).eq('active', true)
    setRasc({ intro: '', items: (data ?? []).map(c => ({ tipo: c.kind === 'medicacao' ? 'medicacao' : 'habito', titulo: c.title, detalhe: c.detail ?? '' })) })
  }
  async function publicar() {
    if (!rasc) return
    await supabase.from('protocols').insert({ patient_id: pid, version: (lista[0]?.version ?? 0) + 1, intro: rasc.intro || null,
      items: rasc.items.filter(i => i.titulo.trim()), published_at: new Date().toISOString(), author: session?.user.id })
    setRasc(null); carregar()
  }
  const mostrado = ver != null ? lista.find(p => p.version === ver) : atual

  return (
    <Bloco titulo="Protocolo" sub={atual ? `Versão ${atual.version} publicada em ${dataBR(atual.published_at!)} · a paciente vê esta versão no app` : 'Nenhuma versão publicada'}
      acao={podeEditar && !rasc ? <Botao tamanho="sm" variante="linha" onClick={novaVersao}><Plus className="w-4 h-4" />{atual ? 'Nova versão' : 'Criar protocolo'}</Botao> : undefined}>
      {rasc ? (
        <div className="flex flex-col gap-3">
          <label className="flex flex-col gap-1.5"><span className="text-corpo font-medium">Mensagem de abertura</span>
            <textarea value={rasc.intro} onChange={e => setRasc({ ...rasc, intro: e.target.value })} rows={2} className="campo !h-auto py-2.5" placeholder="O foco deste momento, na sua voz." /></label>
          <ul className="flex flex-col gap-2">
            {rasc.items.map((it, i) => (
              <li key={i} className="grid grid-cols-[150px_1fr_1fr_auto] max-md:grid-cols-[1fr_auto] gap-2 items-center">
                <select aria-label="Tipo" value={it.tipo} onChange={e => setRasc({ ...rasc, items: rasc.items.map((x, k) => k === i ? { ...x, tipo: e.target.value as ItemProtocolo['tipo'] } : x) })} className="campo">
                  {Object.entries(TIPO_ITEM).map(([k, r]) => <option key={k} value={k}>{r}</option>)}
                </select>
                <input aria-label="Item" value={it.titulo} placeholder="Item" onChange={e => setRasc({ ...rasc, items: rasc.items.map((x, k) => k === i ? { ...x, titulo: e.target.value } : x) })} className="campo max-md:col-span-2" />
                <input aria-label="Como fazer" value={it.detalhe ?? ''} placeholder="Como fazer" onChange={e => setRasc({ ...rasc, items: rasc.items.map((x, k) => k === i ? { ...x, detalhe: e.target.value } : x) })} className="campo" />
                <button onClick={() => setRasc({ ...rasc, items: rasc.items.filter((_, k) => k !== i) })} aria-label="Remover item" className="w-9 h-9 grid place-items-center rounded text-apoio hover:text-terracota hover:bg-tom"><Trash2 className="w-4 h-4" /></button>
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap gap-2">
            <Botao tamanho="sm" variante="suave" onClick={() => setRasc({ ...rasc, items: [...rasc.items, { tipo: 'medicacao', titulo: '', detalhe: '' }] })}><Plus className="w-4 h-4" />Item</Botao>
            <Botao tamanho="sm" variante="texto" className="ml-auto" onClick={() => setRasc(null)}>Cancelar</Botao>
            <Botao tamanho="sm" onClick={publicar} disabled={!rasc.items.some(i => i.titulo.trim())}>Publicar versão {(lista[0]?.version ?? 0) + 1}</Botao>
          </div>
        </div>
      ) : mostrado ? (
        <div className="flex flex-col gap-3">
          {lista.length > 1 && (
            <div className="segmentado self-start" role="tablist" aria-label="Versões">
              {lista.map(p => <button key={p.id} role="tab" aria-selected={(mostrado?.version) === p.version} onClick={() => setVer(p.version)}>v{p.version}</button>)}
            </div>
          )}
          {mostrado.intro && <p className="text-corpo">{mostrado.intro}</p>}
          <ListaProtocolo itens={mostrado.items} />
        </div>
      ) : <Vazio titulo="Sem protocolo ainda" texto="Crie a partir das condutas ativas e publique. A paciente recebe por e-mail e vê no app." />}
    </Bloco>
  )
}

export function ListaProtocolo({ itens }: { itens: ItemProtocolo[] }) {
  return (
    <div className="grid sm:grid-cols-2 gap-3">
      {(Object.keys(TIPO_ITEM) as ItemProtocolo['tipo'][]).filter(t => itens.some(i => i.tipo === t)).map(t => (
        <div key={t} className="rounded-lg px-4 py-3" style={{ background: COR[TEMA_ITEM[t]][0] + '99' }}>
          <p className="flex items-center gap-2 text-corpo font-medium" style={{ color: COR[TEMA_ITEM[t]][1] }}><Icone tema={TEMA_ITEM[t]} tamanho={26} />{TIPO_ITEM[t]}</p>
          <ul className="mt-1">
            {itens.filter(i => i.tipo === t).map((i, k) => (
              <li key={k} className="py-1.5"><p className="text-corpo font-medium">{i.titulo}</p>{i.detalhe && <p className="text-meta text-apoio">{i.detalhe}</p>}</li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}

function Encerrar({ pid, nome, mat, aoEncerrar }: { pid: string; nome: string; mat: Matricula; aoEncerrar: () => void }) {
  const [abrir, setAbrir] = useState(false)
  const [motivo, setMotivo] = useState('Programa concluído')
  const [ok, setOk] = useState(false)
  async function confirmar() {
    const agora = new Date().toISOString()
    await supabase.from('enrollments').update({ status: motivo === 'Programa concluído' ? 'concluida' : 'cancelada' }).eq('id', mat.id)
    await supabase.from('encounters').update({ status: 'cancelado' }).eq('enrollment_id', mat.id).in('status', ['previsto', 'agendado'])
    await supabase.from('checkins').update({ status: 'perdido' }).eq('enrollment_id', mat.id).eq('status', 'aberto')
    await supabase.from('patients').update({ status: 'encerrada', closed_at: agora, closed_reason: motivo }).eq('id', pid)
    setAbrir(false); aoEncerrar()
  }
  return (
    <section className="cartao p-5 flex flex-col gap-3" aria-labelledby="t-encerrar">
      <div className="flex items-start justify-between gap-3">
        <div><h2 id="t-encerrar" className="titulo-bloco">Encerrar programa</h2>
          <p className="text-meta text-apoio mt-0.5">A paciente perde o acesso ao app. Prontuário e exames ficam guardados por 20 anos, como manda a lei.</p></div>
        {!abrir && <Botao tamanho="sm" variante="linha" onClick={() => setAbrir(true)}>Encerrar</Botao>}
      </div>
      {abrir && (
        <div className="painel-tom p-3 flex flex-col gap-2">
          <label className="flex flex-col gap-1.5"><span className="text-corpo font-medium">Motivo</span>
            <select value={motivo} onChange={e => setMotivo(e.target.value)} className="campo">
              <option>Programa concluído</option><option>Desistência</option><option>Mudou de cidade</option><option>Outro</option>
            </select></label>
          <label className="flex items-start gap-2 text-corpo"><input type="checkbox" className="mt-1 w-4 h-4 accent-cafe" checked={ok} onChange={e => setOk(e.target.checked)} />Confirmo o encerramento do acompanhamento de {nome.replace(/\s*\(teste\)/, '')}.</label>
          <div className="flex gap-2 justify-end">
            <Botao tamanho="sm" variante="texto" onClick={() => setAbrir(false)}><X className="w-4 h-4" />Cancelar</Botao>
            <Botao tamanho="sm" disabled={!ok} onClick={confirmar} className="!bg-terracota hover:!bg-[#7c3f29]">Encerrar programa</Botao>
          </div>
        </div>
      )}
    </section>
  )
}
