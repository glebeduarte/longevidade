import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react'
import { ChevronRight, Plus, Search, Send, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../auth/AuthProvider'
import { Aviso, Bloco, Botao, Campo, Iniciais, Selecao, Selo, Titulo, Vazio } from '../../components/ui'
import { dataBR } from '../../lib/faixas'
import { idadeEm } from '../../lib/clinica'
import { dataHora, prazoTexto, type Checkin, type Encontro } from '../../lib/programa'

async function convidar(body: Record<string, unknown>) {
  const { data, error } = await supabase.functions.invoke('convidar', {
    body: { ...body, redirect_to: `${location.origin}/definir-senha` },
  })
  if (error) {
    let msg = 'Não foi possível enviar o convite.'
    try { msg = (await (error as { context: Response }).context.json()).erro ?? msg } catch { /* sem corpo */ }
    throw new Error(msg)
  }
  return data
}

const LOCAL: Record<string, string> = { equilibre: 'Clínica Equilibre', spinel: 'Instituto Spinel' }
const nomeLimpo = (n?: string | null) => (n ?? '').replace(/\s*\(teste\)/, '')
const plural = (n: number, s: string, p: string) => `${n} ${n === 1 ? s : p}`
const quando = (d: string) => {
  const dias = Math.floor((Date.now() - new Date(d).getTime()) / 864e5)
  return dias <= 0 ? 'hoje' : dias === 1 ? 'ontem' : dias < 30 ? `há ${dias} dias` : dataBR(d)
}

type Alerta = { id: string; message: string; created_at: string; patient_id: string; patients: { full_name: string } | null }
type MapaAberto = { id: string; started_at: string; patient_id: string; patients: { full_name: string } | null }
type Envio = { id: string; created_at: string; patient_id: string; patients: { full_name: string } | null; questionnaires: { name: string } | null }
type RespostaR = { id: string; submitted_at: string; patient_id: string; band_label: string | null; band_level: string | null; patients: { full_name: string } | null; questionnaires: { name: string } | null }

function LinhaPessoa({ to, nome, linha2, direita }: { to: string; nome: string; linha2: ReactNode; direita?: ReactNode }) {
  return (
    <li>
      <Link to={to} className="group flex items-center gap-3 px-5 py-3 hover:bg-tom/60 transition-colors">
        <Iniciais nome={nome} />
        <div className="flex-1 min-w-0">
          <p className="text-corpo font-medium truncate">{nomeLimpo(nome)}</p>
          <p className="text-meta text-apoio truncate">{linha2}</p>
        </div>
        {direita}
        <ChevronRight className="w-4 h-4 text-apoio/70 group-hover:translate-x-0.5 transition-transform" strokeWidth={1.6} />
      </Link>
    </li>
  )
}

function saudacao() {
  const h = new Date().getHours()
  return h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite'
}

export function Hoje() {
  const { profile } = useAuth()
  const [ativas, setAtivas] = useState<number | null>(null)
  const [alertas, setAlertas] = useState<Alerta[]>([])
  const [mapas, setMapas] = useState<MapaAberto[]>([])
  const [envios, setEnvios] = useState<Envio[]>([])
  const [respostas, setRespostas] = useState<RespostaR[]>([])
  const [fila, setFila] = useState<Checkin[]>([])
  const [agenda, setAgenda] = useState<Encontro[]>([])

  const carregar = () => {
    supabase.from('patients').select('id', { count: 'exact', head: true }).eq('status', 'ativa').then(({ count }) => setAtivas(count ?? 0))
    supabase.from('clinical_alerts').select('id, message, created_at, patient_id, patients(full_name)').is('resolved_at', null).order('created_at')
      .then(({ data }) => setAlertas((data as unknown as Alerta[]) ?? []))
    supabase.from('health_maps').select('id, started_at, patient_id, patients(full_name)').eq('status', 'em_andamento').order('started_at')
      .then(({ data }) => setMapas((data as unknown as MapaAberto[]) ?? []))
    supabase.from('questionnaire_assignments').select('id, created_at, patient_id, patients(full_name), questionnaires(name)').eq('status', 'pendente').order('created_at')
      .then(({ data }) => setEnvios((data as unknown as Envio[]) ?? []))
    supabase.from('questionnaire_responses').select('id, submitted_at, patient_id, band_label, band_level, patients(full_name), questionnaires(name)').order('submitted_at', { ascending: false }).limit(6)
      .then(({ data }) => setRespostas((data as unknown as RespostaR[]) ?? []))
    supabase.from('checkins').select('*, patients(full_name)').eq('status', 'respondido').order('submitted_at')
      .then(({ data }) => setFila(((data as Checkin[]) ?? []).sort((a, b) => Number(b.reaction) - Number(a.reaction))))
    supabase.from('encounters').select('*, patients(full_name)').eq('status', 'agendado').gte('scheduled_at', new Date(Date.now() - 864e5 / 2).toISOString()).order('scheduled_at').limit(5)
      .then(({ data }) => setAgenda((data as Encontro[]) ?? []))
  }
  useEffect(carregar, [])

  async function resolver(id: string) {
    await supabase.from('clinical_alerts').update({ resolved_at: new Date().toISOString(), resolved_by: profile?.id }).eq('id', id)
    carregar()
  }

  // envios pendentes agrupados por paciente
  const porPaciente = useMemo(() => {
    const m = new Map<string, Envio[]>()
    envios.forEach(e => m.set(e.patient_id, [...(m.get(e.patient_id) ?? []), e]))
    return [...m.values()]
  }, [envios])

  const nome = profile?.full_name?.split(' ')[0]
  const fato = alertas.length
    ? `${plural(alertas.length, 'alerta clínico pede', 'alertas clínicos pedem')} avaliação hoje.`
    : fila.length ? `${plural(fila.length, 'check-in aguarda', 'check-ins aguardam')} resposta.`
    : mapas.length ? `${plural(mapas.length, 'mapa da saúde aguarda', 'mapas da saúde aguardam')} sua revisão.`
    : 'Nada urgente por aqui.'
  const hoje = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })

  const kpis: Array<[string, number | null, string]> = [
    ['Alertas abertos', alertas.length, 'Resposta no mesmo dia'],
    ['Check-ins na fila', fila.length, 'Prazo de 3 dias úteis'],
    ['Mapas para revisar', mapas.length, 'Em andamento'],
    ['Pacientes ativas', ativas, 'No programa Longevidade'],
  ]

  return (
    <div className="flex flex-col gap-6">
      <header className="pt-1">
        <h1 className="titulo-pagina">{saudacao()}{nome ? `, ${nome}` : ''}. {fato}</h1>
        <p className="mt-2 text-corpo text-apoio first-letter:uppercase">{hoje}</p>
      </header>

      {/* Indicadores num só cartão dividido */}
      <section aria-label="Resumo" className="rounded-lg border border-borda overflow-hidden grid grid-cols-2 lg:grid-cols-4 gap-px bg-borda">
        {kpis.map(([r, v, n], i) => (
          <div key={r} className="bg-folha px-5 py-4">
            <p className="rotulo">{r}</p>
            <p className={`numero mt-1.5 ${i === 0 && alertas.length ? 'text-terracota' : ''}`}>{v ?? <span className="text-apoio/60">·</span>}</p>
            <p className="text-meta text-apoio mt-0.5">{n}</p>
          </div>
        ))}
      </section>

      {alertas.length > 0 && (
        <section className="cartao border-terracota/40" aria-labelledby="t-alertas">
          <div className="px-5 pt-4 pb-2 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-terracota" aria-hidden="true" />
            <h2 id="t-alertas" className="titulo-bloco">Avaliar hoje</h2>
          </div>
          <ul>
            {alertas.map(a => (
              <li key={a.id} className="px-5 py-3 border-t border-regra flex flex-wrap items-center gap-x-4 gap-y-2">
                <Iniciais nome={a.patients?.full_name} />
                <div className="flex-1 min-w-[220px]">
                  <Link to={`/painel/pacientes/${a.patient_id}`} className="text-corpo font-medium link">{nomeLimpo(a.patients?.full_name)}</Link>
                  <p className="text-meta text-apoio mt-0.5">{a.message}</p>
                </div>
                <span className="text-meta text-apoio tabular-nums">{quando(a.created_at)}</span>
                {profile?.role === 'medica' && <Botao variante="linha" tamanho="sm" onClick={() => resolver(a.id)}>Marcar como avaliado</Botao>}
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="grid lg:grid-cols-12 gap-4 items-start">
        <Bloco className="lg:col-span-7" titulo="Check-ins aguardando resposta" sub="Reações relatadas aparecem primeiro" semPad
          acao={<Link to="/painel/checkins" className="text-meta link">Abrir fila</Link>}>
          {fila.length ? (
            <ul className="pb-2">
              {fila.slice(0, 5).map(c => {
                const p = prazoTexto(c.submitted_at!)
                return <LinhaPessoa key={c.id} to="/painel/checkins" nome={c.patients?.full_name ?? ''}
                  linha2={c.answers?.mensagem || `Check-in de ${dataBR(c.due_date)}`}
                  direita={c.reaction ? <Selo tom="risco">Reação</Selo> : <span className={`text-meta tabular-nums ${p.vencido ? 'text-[#7c3f29]' : 'text-apoio'}`}>{p.texto}</span>} />
              })}
            </ul>
          ) : <div className="px-5 pb-5"><Vazio titulo="Fila vazia" texto="Nenhum check-in esperando resposta." /></div>}
        </Bloco>

        <Bloco className="lg:col-span-5" titulo="Próximos encontros" semPad acao={<Link to="/painel/agenda" className="text-meta link">Agenda</Link>}>
          {agenda.length ? (
            <ul className="pb-2">
              {agenda.map(e => (
                <LinhaPessoa key={e.id} to={`/painel/pacientes/${e.patient_id}?aba=programa`} nome={e.patients?.full_name ?? ''}
                  linha2={`${e.title}${e.location ? ` · ${e.location === 'spinel' ? 'Instituto Spinel' : 'Clínica Equilibre'}` : ''}`}
                  direita={<span className="text-meta text-apoio tabular-nums text-right">{dataHora(e.scheduled_at!)}</span>} />
              ))}
            </ul>
          ) : <div className="px-5 pb-5"><Vazio titulo="Nenhum encontro agendado" texto="Agende na aba Programa da paciente." /></div>}
        </Bloco>

        <Bloco className="lg:col-span-7" titulo="Mapas da saúde para revisar" sub="Abertos e ainda não entregues à paciente" semPad
          acao={mapas.length ? <Selo>{mapas.length}</Selo> : undefined}>
          {mapas.length ? (
            <ul className="pb-2">
              {mapas.map(m => (
                <LinhaPessoa key={m.id} to={`/painel/pacientes/${m.patient_id}?aba=mapa`} nome={m.patients?.full_name ?? ''}
                  linha2={`Aberto ${quando(m.started_at)} · ${dataBR(m.started_at)}`} direita={<span className="hidden sm:inline text-meta text-cafe">Revisar</span>} />
              ))}
            </ul>
          ) : <div className="px-5 pb-5"><Vazio titulo="Nenhum mapa em andamento" texto="Abra um mapa na ficha da paciente no início ou no fim do programa." /></div>}
        </Bloco>

        <Bloco className="lg:col-span-5" titulo="Questionários aguardando resposta" sub="Enviados e ainda não respondidos" semPad>
          {porPaciente.length ? (
            <ul className="pb-2">
              {porPaciente.slice(0, 5).map(g => (
                <LinhaPessoa key={g[0].patient_id} to={`/painel/pacientes/${g[0].patient_id}?aba=estilo`} nome={g[0].patients?.full_name ?? ''}
                  linha2={g.map(e => e.questionnaires?.name).join(', ')} direita={<span className="text-meta text-apoio tabular-nums">{quando(g[0].created_at)}</span>} />
              ))}
            </ul>
          ) : <div className="px-5 pb-5"><Vazio titulo="Tudo respondido" texto="Os questionários enviados aparecem aqui até a paciente responder." /></div>}
        </Bloco>

        <Bloco className="lg:col-span-12" titulo="Respostas recentes" sub="Escore calculado na hora em que a paciente envia" semPad>
          {respostas.length ? (
            <ul className="pb-2">
              {respostas.map(r => (
                <LinhaPessoa key={r.id} to={`/painel/pacientes/${r.patient_id}?aba=estilo`} nome={r.patients?.full_name ?? ''}
                  linha2={`${r.questionnaires?.name} · ${quando(r.submitted_at)}`}
                  direita={r.band_label ? <Selo tom={r.band_level === 'ruim' ? 'risco' : r.band_level === 'atencao' ? 'alerta' : r.band_level === 'otimo' || r.band_level === 'bom' ? 'ok' : 'neutro'}>{r.band_label}</Selo> : undefined} />
              ))}
            </ul>
          ) : <div className="px-5 pb-5"><Vazio titulo="Nenhuma resposta ainda" /></div>}
        </Bloco>

      </div>
    </div>
  )
}

/** Folha lateral para formulários curtos. */
function Folha({ aberto, titulo, sub, onFechar, children }: { aberto: boolean; titulo: string; sub?: string; onFechar: () => void; children: ReactNode }) {
  useEffect(() => {
    if (!aberto) return
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && onFechar()
    addEventListener('keydown', esc); return () => removeEventListener('keydown', esc)
  }, [aberto, onFechar])
  if (!aberto) return null
  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-label={titulo}>
      <button className="absolute inset-0 bg-texto/25" aria-label="Fechar" onClick={onFechar} />
      <div className="relative w-full max-w-[440px] h-full bg-fundo overflow-y-auto shadow-[0_0_40px_rgba(46,34,27,0.18)] entra">
        <div className="flex items-start justify-between gap-4 px-6 pt-6 pb-4">
          <div><h2 className="titulo-pagina !text-[26px]">{titulo}</h2>{sub && <p className="text-corpo text-apoio mt-1">{sub}</p>}</div>
          <button onClick={onFechar} aria-label="Fechar" className="w-9 h-9 -mr-2 grid place-items-center rounded hover:bg-tom"><X className="w-5 h-5" strokeWidth={1.6} /></button>
        </div>
        <div className="px-6 pb-8">{children}</div>
      </div>
    </div>
  )
}

type Paciente = { id: string; full_name: string; email: string; birth_date: string | null; location: string | null; status: string; user_id: string | null; created_at: string }

export function Pacientes() {
  const [lista, setLista] = useState<Paciente[] | null>(null)
  const [mapas, setMapas] = useState<Record<string, string>>({})
  const [busca, setBusca] = useState('')
  const [filtro, setFiltro] = useState<'ativas' | 'convite' | 'encerradas'>('ativas')
  const [abrir, setAbrir] = useState(false)
  const vazio = { full_name: '', email: '', phone: '', birth_date: '', location: 'equilibre' }
  const [f, setF] = useState(vazio)
  const [msg, setMsg] = useState<{ t: 'ok' | 'erro'; m: string } | null>(null)
  const [enviando, setEnviando] = useState(false)

  const carregar = () => {
    supabase.from('patients').select('id, full_name, email, birth_date, location, status, user_id, created_at').order('full_name').then(({ data }) => setLista(data ?? []))
    supabase.from('health_maps').select('patient_id, status, started_at').order('started_at').then(({ data }) =>
      setMapas(Object.fromEntries((data ?? []).map(m => [m.patient_id, m.status]))))
  }
  useEffect(() => { carregar() }, [])

  const contagem = {
    ativas: lista?.filter(p => p.status === 'ativa').length ?? 0,
    convite: lista?.filter(p => p.status === 'ativa' && !p.user_id).length ?? 0,
    encerradas: lista?.filter(p => p.status === 'encerrada').length ?? 0,
  }
  const filtrada = useMemo(() => (lista ?? [])
    .filter(p => filtro === 'encerradas' ? p.status === 'encerrada' : filtro === 'convite' ? p.status === 'ativa' && !p.user_id : p.status === 'ativa')
    .filter(p => `${p.full_name} ${p.email}`.toLowerCase().includes(busca.toLowerCase())), [lista, busca, filtro])

  async function enviar(e: FormEvent) {
    e.preventDefault()
    setEnviando(true); setMsg(null)
    try {
      await convidar({ role: 'paciente', full_name: f.full_name, email: f.email, patient: { phone: f.phone, birth_date: f.birth_date, location: f.location } })
      setMsg({ t: 'ok', m: `Convite enviado para ${f.email}.` })
      setF(vazio); setAbrir(false); carregar()
    } catch (err) { setMsg({ t: 'erro', m: (err as Error).message }) }
    setEnviando(false)
  }

  const mapaSelo = (s?: string) => s === 'em_andamento' ? <Selo tom="alerta">Em andamento</Selo> : s === 'finalizado' ? <Selo tom="ok">Entregue</Selo> : <span className="text-apoio/60">·</span>

  return (
    <div className="flex flex-col gap-6">
      <Titulo sub={`${plural(contagem.ativas, 'paciente ativa', 'pacientes ativas')} no programa`}
        acao={<Botao onClick={() => setAbrir(true)}><Plus className="w-4 h-4" strokeWidth={1.8} />Nova paciente</Botao>}>Pacientes</Titulo>
      {msg && <Aviso tipo={msg.t}>{msg.m}</Aviso>}

      <div className="flex flex-wrap items-center gap-3">
        <div className="segmentado" role="tablist" aria-label="Filtrar pacientes">
          {([['ativas', 'Ativas'], ['convite', 'Convite pendente'], ['encerradas', 'Encerradas']] as const).map(([k, r]) => (
            <button key={k} role="tab" aria-selected={filtro === k} onClick={() => setFiltro(k)}>{r} <span className="tabular-nums text-apoio ml-0.5">{contagem[k]}</span></button>
          ))}
        </div>
        <div className="relative flex-1 min-w-[220px] max-w-sm ml-auto">
          <Search className="w-4 h-4 text-apoio absolute left-3 top-1/2 -translate-y-1/2" strokeWidth={1.6} />
          <label htmlFor="busca" className="sr-only">Buscar paciente</label>
          <input id="busca" value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar por nome ou e-mail" className="campo pl-9" />
        </div>
      </div>

      <section className="cartao overflow-hidden">
        {/* Desktop: tabela */}
        <table className="w-full text-corpo hidden md:table">
          <thead>
            <tr className="text-left text-meta text-apoio">
              <th className="font-normal py-3 px-5">Paciente</th><th className="font-normal py-3 px-4 text-right">Idade</th>
              <th className="font-normal py-3 px-4">Local</th><th className="font-normal py-3 px-4">Mapa da saúde</th>
              <th className="font-normal py-3 px-4">Acesso</th><th className="w-10" />
            </tr>
          </thead>
          <tbody>
            {filtrada.map(p => (
              <tr key={p.id} className="group border-t border-regra hover:bg-tom/50 transition-colors">
                <td className="py-2.5 px-5">
                  <Link to={`/painel/pacientes/${p.id}`} className="flex items-center gap-3">
                    <Iniciais nome={p.full_name} />
                    <span className="min-w-0"><span className="block font-medium truncate group-hover:underline underline-offset-4">{p.full_name}</span><span className="block text-meta text-apoio truncate">{p.email}</span></span>
                  </Link>
                </td>
                <td className="py-2.5 px-4 text-right tabular-nums">{idadeEm(p.birth_date) ?? <span className="text-apoio/60">·</span>}</td>
                <td className="py-2.5 px-4">{LOCAL[p.location ?? ''] ?? <span className="text-apoio/60">·</span>}</td>
                <td className="py-2.5 px-4">{mapaSelo(mapas[p.id])}</td>
                <td className="py-2.5 px-4">{p.status === 'encerrada' ? <Selo>Encerrado</Selo> : p.user_id ? <Selo tom="ok">Ativo</Selo> : <Selo>Convite enviado</Selo>}</td>
                <td className="pr-4"><ChevronRight className="w-4 h-4 text-apoio/60" strokeWidth={1.6} /></td>
              </tr>
            ))}
          </tbody>
        </table>
        {/* Celular: linhas de duas linhas */}
        <ul className="md:hidden">
          {filtrada.map((p, i) => (
            <li key={p.id} className={i ? 'border-t border-regra' : ''}>
              <Link to={`/painel/pacientes/${p.id}`} className="flex items-center gap-3 px-4 py-3 min-h-[60px]">
                <Iniciais nome={p.full_name} />
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{p.full_name}</p>
                  <p className="text-meta text-apoio truncate">{[idadeEm(p.birth_date) ? `${idadeEm(p.birth_date)} anos` : null, LOCAL[p.location ?? ''], mapas[p.id] === 'em_andamento' ? 'mapa em andamento' : null].filter(Boolean).join(' · ')}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-apoio/60" strokeWidth={1.6} />
              </Link>
            </li>
          ))}
        </ul>
        {lista && filtrada.length === 0 && (
          <div className="p-5">
            <Vazio titulo={busca ? 'Nenhum resultado' : lista.length ? 'Ninguém neste filtro' : 'Nenhuma paciente ainda'}
              texto={busca ? 'Tente outro nome ou e-mail.' : lista.length ? undefined : 'Cadastre a primeira paciente. Ela recebe o convite por e-mail para criar a senha.'}
              acao={!lista.length ? <Botao tamanho="sm" onClick={() => setAbrir(true)}><Plus className="w-4 h-4" />Nova paciente</Botao> : undefined} />
          </div>
        )}
        {!lista && <div className="p-5 text-corpo text-apoio">Carregando</div>}
      </section>

      <Folha aberto={abrir} titulo="Nova paciente" sub="Ela recebe o convite por e-mail para criar a senha." onFechar={() => setAbrir(false)}>
        <form onSubmit={enviar} className="flex flex-col gap-4">
          <Campo id="p-nome" label="Nome completo" required value={f.full_name} onChange={e => setF({ ...f, full_name: e.target.value })} />
          <Campo id="p-email" label="E-mail" type="email" required value={f.email} onChange={e => setF({ ...f, email: e.target.value })} />
          <div className="grid grid-cols-2 gap-3">
            <Campo id="p-tel" label="Telefone" inputMode="tel" value={f.phone} onChange={e => setF({ ...f, phone: e.target.value })} />
            <Campo id="p-nasc" label="Nascimento" type="date" value={f.birth_date} onChange={e => setF({ ...f, birth_date: e.target.value })} />
          </div>
          <Selecao id="p-local" label="Local de atendimento" value={f.location} onChange={e => setF({ ...f, location: e.target.value })}>
            <option value="equilibre">Clínica Equilibre</option>
            <option value="spinel">Instituto Spinel</option>
          </Selecao>
          {msg?.t === 'erro' && <Aviso tipo="erro">{msg.m}</Aviso>}
          <Botao type="submit" disabled={enviando} className="mt-2 w-full"><Send className="w-4 h-4" strokeWidth={1.8} />{enviando ? 'Enviando' : 'Cadastrar e enviar convite'}</Botao>
        </form>
      </Folha>
    </div>
  )
}

const PERMS: Array<[string, string, string]> = [
  ['can_manage_patients', 'Cadastrar pacientes', 'Cria fichas e envia convites'],
  ['can_upload_measurements', 'Lançar medidas e exames', 'Bioimpedância, circunferências, exames'],
  ['can_answer_checkins', 'Responder check-ins', 'Atende a fila sem sinalização'],
  ['can_view_clinical', 'Ver dados clínicos', 'Acesso a todas as fichas'],
  ['is_partner', 'Parceiro', 'Vê só as pacientes vinculadas'],
]

type Membro = { id: string; full_name: string | null; email: string | null; active: boolean; team_permissions: Record<string, boolean | string | null> | null }

function Chave({ ligado, aoTrocar, rotulo }: { ligado: boolean; aoTrocar: () => void; rotulo: string }) {
  return (
    <button role="switch" aria-checked={ligado} aria-label={rotulo} onClick={aoTrocar}
      className={`relative w-9 h-5 rounded-full shrink-0 transition-colors ${ligado ? 'bg-oliva' : 'bg-controle'}`}>
      <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${ligado ? 'translate-x-4' : ''}`} />
    </button>
  )
}

export function Equipe() {
  const [lista, setLista] = useState<Membro[] | null>(null)
  const [abrir, setAbrir] = useState(false)
  const vazio = { full_name: '', email: '', perms: {} as Record<string, boolean>, partner_specialty: '' }
  const [f, setF] = useState(vazio)
  const [msg, setMsg] = useState<{ t: 'ok' | 'erro'; m: string } | null>(null)

  const carregar = () => supabase.from('profiles').select('id, full_name, email, active, team_permissions(*)').eq('role', 'equipe').order('full_name')
    .then(({ data }) => setLista((data as unknown as Membro[]) ?? []))
  useEffect(() => { carregar() }, [])

  async function enviar(e: FormEvent) {
    e.preventDefault(); setMsg(null)
    try {
      await convidar({ role: 'equipe', full_name: f.full_name, email: f.email, perms: { ...f.perms, partner_specialty: f.partner_specialty } })
      setMsg({ t: 'ok', m: `Convite enviado para ${f.email}.` })
      setF(vazio); setAbrir(false); carregar()
    } catch (err) { setMsg({ t: 'erro', m: (err as Error).message }) }
  }
  async function alternar(m: Membro, k: string) {
    await supabase.from('team_permissions').upsert({ user_id: m.id, [k]: !m.team_permissions?.[k] }); carregar()
  }
  async function acesso(m: Membro) {
    await supabase.from('profiles').update({ active: !m.active }).eq('id', m.id); carregar()
  }

  return (
    <div className="flex flex-col gap-6">
      <Titulo sub="Cada pessoa vê apenas o que a função dela exige. Toda abertura de ficha fica registrada."
        acao={<Botao onClick={() => setAbrir(true)}><Plus className="w-4 h-4" strokeWidth={1.8} />Convidar pessoa</Botao>}>Equipe e acessos</Titulo>
      {msg && <Aviso tipo={msg.t}>{msg.m}</Aviso>}

      {lista && lista.length === 0 && (
        <div className="grid lg:grid-cols-[320px_1fr] gap-x-10 gap-y-4">
          <div>
            <h2 className="titulo-bloco">Quem pode fazer o quê</h2>
            <p className="text-corpo text-apoio mt-1">Você escolhe as permissões de cada pessoa ao convidar e pode mudar depois.</p>
          </div>
          <div className="painel-tom p-4 flex flex-col gap-1">
            {PERMS.map(([, r, d]) => (
              <div key={r} className="flex items-baseline justify-between gap-4 py-2"><span className="text-corpo">{r}</span><span className="text-meta text-apoio text-right">{d}</span></div>
            ))}
            <div className="pt-3"><Vazio titulo="Nenhuma pessoa na equipe ainda" texto="Convide assistentes e parceiros." acao={<Botao tamanho="sm" variante="linha" onClick={() => setAbrir(true)}>Convidar</Botao>} /></div>
          </div>
        </div>
      )}

      {lista && lista.length > 0 && (
        <div className="grid md:grid-cols-2 gap-4">
          {lista.map(m => (
            <article key={m.id} className={`cartao p-5 flex flex-col gap-4 ${m.active ? '' : 'opacity-60'}`}>
              <div className="flex items-center gap-3">
                <Iniciais nome={m.full_name ?? m.email} className="w-10 h-10 text-[14px]" />
                <div className="min-w-0 flex-1">
                  <p className="titulo-bloco truncate">{m.full_name ?? m.email}</p>
                  <p className="text-meta text-apoio truncate">{m.email}</p>
                </div>
                {m.active ? <Selo tom="ok">Ativo</Selo> : <Selo>Suspenso</Selo>}
              </div>
              <ul className="painel-tom px-4 py-1">
                {PERMS.map(([k, r, d]) => (
                  <li key={k} className="flex items-center gap-4 py-2.5 border-b border-borda/70 last:border-0">
                    <div className="flex-1 min-w-0"><p className="text-corpo">{r}</p><p className="text-meta text-apoio">{d}</p></div>
                    <Chave ligado={!!m.team_permissions?.[k]} aoTrocar={() => alternar(m, k)} rotulo={r} />
                  </li>
                ))}
              </ul>
              <button onClick={() => acesso(m)} className="self-start text-corpo text-apoio hover:text-terracota">{m.active ? 'Suspender acesso' : 'Reativar acesso'}</button>
            </article>
          ))}
        </div>
      )}

      <Folha aberto={abrir} titulo="Convidar pessoa" sub="O convite chega por e-mail." onFechar={() => setAbrir(false)}>
        <form onSubmit={enviar} className="flex flex-col gap-4">
          <Campo id="e-nome" label="Nome" required value={f.full_name} onChange={e => setF({ ...f, full_name: e.target.value })} />
          <Campo id="e-email" label="E-mail" type="email" required value={f.email} onChange={e => setF({ ...f, email: e.target.value })} />
          <fieldset className="flex flex-col gap-2 mt-1">
            <legend className="text-corpo font-medium mb-2">O que pode fazer</legend>
            {PERMS.map(([k, r, d]) => (
              <label key={k} className={`flex gap-3 items-start p-3 rounded-lg border cursor-pointer transition-colors ${f.perms[k] ? 'border-cafe/60 bg-folha' : 'border-borda hover:border-controle'}`}>
                <input type="checkbox" className="mt-0.5 w-4 h-4 accent-cafe" checked={!!f.perms[k]} onChange={e => setF({ ...f, perms: { ...f.perms, [k]: e.target.checked } })} />
                <span><span className="block text-corpo">{r}</span><span className="block text-meta text-apoio mt-0.5">{d}</span></span>
              </label>
            ))}
          </fieldset>
          {f.perms.is_partner && <Campo id="e-esp" label="Especialidade" placeholder="Ex.: nutricionista" value={f.partner_specialty} onChange={e => setF({ ...f, partner_specialty: e.target.value })} />}
          {msg?.t === 'erro' && <Aviso tipo="erro">{msg.m}</Aviso>}
          <Botao type="submit" className="w-full mt-2"><Send className="w-4 h-4" strokeWidth={1.8} />Enviar convite</Botao>
        </form>
      </Folha>
    </div>
  )
}


