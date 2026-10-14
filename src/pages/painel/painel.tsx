import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react'
import { AlertTriangle, CalendarDays, ClipboardCheck, Map as MapIcon, MessageCircle, Plus, Search, Send, Users, X } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../auth/AuthProvider'
import { Aviso, Botao, Campo, Iniciais, Selecao, Selo, Titulo } from '../../components/ui'

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

const hoje = () => new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })

function Indicador({ rotulo, valor, icone: I, tom = 'neutro', nota }: { rotulo: string; valor: ReactNode; icone: LucideIcon; tom?: 'neutro' | 'alerta'; nota?: string }) {
  return (
    <div className={`cartao p-6 flex flex-col gap-6 ${tom === 'alerta' ? 'border-terracota/40' : ''}`}>
      <div className="flex items-center justify-between">
        <p className="rotulo">{rotulo}</p>
        <span className={`w-9 h-9 grid place-items-center ${tom === 'alerta' ? 'bg-terracota/10 text-terracota' : 'bg-areia/50 text-cafe'}`}><I className="w-4 h-4" strokeWidth={1.6} /></span>
      </div>
      <div>
        <p className={`font-display text-[56px] leading-none tabular-nums ${tom === 'alerta' ? 'text-terracota' : ''}`}>{valor}</p>
        {nota && <p className="text-xs text-apoio mt-2">{nota}</p>}
      </div>
    </div>
  )
}

function Bloco({ titulo, acao, children }: { titulo: string; acao?: ReactNode; children: ReactNode }) {
  return (
    <section className="cartao">
      <div className="flex items-center justify-between px-6 h-16 border-b border-areia/70">
        <h2 className="font-display text-2xl">{titulo}</h2>{acao}
      </div>
      <div className="p-6">{children}</div>
    </section>
  )
}

function Vazio({ icone: I, titulo, texto }: { icone: LucideIcon; titulo: string; texto: string }) {
  return (
    <div className="py-10 flex flex-col items-center text-center gap-3">
      <span className="w-12 h-12 grid place-items-center border border-areia text-cobre"><I className="w-5 h-5" strokeWidth={1.4} /></span>
      <p className="font-display text-xl">{titulo}</p>
      <p className="text-sm text-apoio max-w-xs leading-relaxed">{texto}</p>
    </div>
  )
}

export function Hoje() {
  const { profile } = useAuth()
  const [n, setN] = useState<number | null>(null)
  useEffect(() => {
    supabase.from('patients').select('id', { count: 'exact', head: true }).eq('status', 'ativa').then(({ count }) => setN(count ?? 0))
  }, [])
  const nome = profile?.full_name?.split(' ')[0]
  return (
    <div className="flex flex-col gap-10">
      <Titulo rotulo={hoje()} sub="O que precisa da sua atenção hoje, em ordem de prioridade.">Bom dia{nome ? `, ${nome}` : ''}</Titulo>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        <Indicador rotulo="Reações sinalizadas" valor={0} icone={AlertTriangle} tom="alerta" nota="Resposta no mesmo dia" />
        <Indicador rotulo="Check-ins na fila" valor={0} icone={MessageCircle} nota="Prazo de 3 dias úteis" />
        <Indicador rotulo="Mapas para revisar" valor={0} icone={MapIcon} nota="Aguardando aprovação" />
        <Indicador rotulo="Pacientes ativas" valor={n ?? '·'} icone={Users} nota="No programa Longevidade" />
      </div>
      <div className="grid lg:grid-cols-[1.4fr_1fr] gap-5">
        <Bloco titulo="Fila de check-ins" acao={<Selo>Em breve</Selo>}>
          <Vazio icone={ClipboardCheck} titulo="Nenhum check-in pendente" texto="As respostas das pacientes aparecem aqui com prazo e sinalização de reação." />
        </Bloco>
        <Bloco titulo="Próximos encontros">
          <Vazio icone={CalendarDays} titulo="Agenda livre" texto="Os encontros do programa aparecem aqui quando as matrículas forem criadas." />
        </Bloco>
      </div>
    </div>
  )
}

export function Encontros() {
  return (
    <div className="flex flex-col gap-10">
      <Titulo rotulo="Programa" sub="Encontros previstos e realizados de cada paciente.">Encontros</Titulo>
      <Bloco titulo="Calendário"><Vazio icone={CalendarDays} titulo="Disponível em breve" texto="Entra junto com as matrículas no programa." /></Bloco>
    </div>
  )
}

type Paciente = { id: string; full_name: string; email: string; location: string | null; status: string; user_id: string | null; created_at: string }

function Painel({ aberto, titulo, onFechar, children }: { aberto: boolean; titulo: string; onFechar: () => void; children: ReactNode }) {
  if (!aberto) return null
  return (
    <div className="fixed inset-0 z-40 flex justify-end" role="dialog" aria-modal="true" aria-label={titulo}>
      <button className="absolute inset-0 bg-texto/30 backdrop-blur-[2px]" aria-label="Fechar" onClick={onFechar} />
      <div className="relative w-full max-w-md h-full bg-creme border-l border-areia overflow-y-auto entra">
        <div className="flex items-center justify-between px-7 h-20 border-b border-areia">
          <h2 className="font-display text-3xl">{titulo}</h2>
          <button onClick={onFechar} aria-label="Fechar" className="w-10 h-10 grid place-items-center hover:bg-areia/50"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-7">{children}</div>
      </div>
    </div>
  )
}

export function Pacientes() {
  const [lista, setLista] = useState<Paciente[]>([])
  const [busca, setBusca] = useState('')
  const [abrir, setAbrir] = useState(false)
  const vazio = { full_name: '', email: '', phone: '', birth_date: '', location: 'equilibre' }
  const [f, setF] = useState(vazio)
  const [msg, setMsg] = useState<{ t: 'ok' | 'erro'; m: string } | null>(null)
  const [enviando, setEnviando] = useState(false)

  const carregar = () => supabase.from('patients').select('id, full_name, email, location, status, user_id, created_at').order('full_name').then(({ data }) => setLista(data ?? []))
  useEffect(() => { carregar() }, [])
  const filtrada = useMemo(() => lista.filter(p => `${p.full_name} ${p.email}`.toLowerCase().includes(busca.toLowerCase())), [lista, busca])

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

  const ativas = lista.filter(p => p.status === 'ativa').length
  const pendentes = lista.filter(p => !p.user_id && p.status === 'ativa').length

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <Titulo rotulo="Cadastro" sub={`${ativas} ativas · ${pendentes} com convite aguardando`}>Pacientes</Titulo>
        <Botao onClick={() => setAbrir(true)}><Plus className="w-4 h-4" />Nova paciente</Botao>
      </div>
      {msg && <Aviso tipo={msg.t}>{msg.m}</Aviso>}

      <section className="cartao">
        <div className="px-5 h-16 flex items-center gap-3 border-b border-areia/70">
          <Search className="w-4 h-4 text-apoio" />
          <label htmlFor="busca" className="sr-only">Buscar paciente</label>
          <input id="busca" value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar por nome ou e-mail"
            className="flex-1 bg-transparent h-full text-sm focus:outline-none placeholder:text-apoio/60" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-left">
              {['Paciente', 'Local', 'Acesso', 'Desde'].map(h => <th key={h} className="rotulo font-medium py-4 px-5 border-b border-areia/70">{h}</th>)}
            </tr></thead>
            <tbody>
              {filtrada.map(p => (
                <tr key={p.id} className="border-b border-areia/50 last:border-0 hover:bg-white/50 transition-colors">
                  <td className="py-4 px-5">
                    <div className="flex items-center gap-3">
                      <Iniciais nome={p.full_name} />
                      <div className="min-w-0"><p className="font-medium truncate">{p.full_name}</p><p className="text-apoio text-xs truncate">{p.email}</p></div>
                    </div>
                  </td>
                  <td className="py-4 px-5">{p.location === 'spinel' ? 'Instituto Spinel' : p.location === 'equilibre' ? 'Clínica Equilibre' : '·'}</td>
                  <td className="py-4 px-5">
                    {p.status === 'encerrada' ? <Selo>Encerrado</Selo> : p.user_id ? <Selo tom="ok">Ativo</Selo> : <Selo tom="alerta">Convite enviado</Selo>}
                  </td>
                  <td className="py-4 px-5 text-apoio tabular-nums">{new Date(p.created_at).toLocaleDateString('pt-BR')}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtrada.length === 0 && (
            <Vazio icone={Users} titulo={lista.length ? 'Nenhum resultado' : 'Nenhuma paciente ainda'}
              texto={lista.length ? 'Tente outro nome ou e-mail.' : 'Cadastre a primeira paciente. Ela recebe o convite por e-mail para criar a senha.'} />
          )}
        </div>
      </section>

      <Painel aberto={abrir} titulo="Nova paciente" onFechar={() => setAbrir(false)}>
        <form onSubmit={enviar} className="flex flex-col gap-6">
          <Campo id="p-nome" label="Nome completo" required value={f.full_name} onChange={e => setF({ ...f, full_name: e.target.value })} />
          <Campo id="p-email" label="E-mail" type="email" required dica="O convite para criar a senha vai para este e-mail." value={f.email} onChange={e => setF({ ...f, email: e.target.value })} />
          <div className="grid grid-cols-2 gap-4">
            <Campo id="p-tel" label="Telefone" value={f.phone} onChange={e => setF({ ...f, phone: e.target.value })} />
            <Campo id="p-nasc" label="Nascimento" type="date" value={f.birth_date} onChange={e => setF({ ...f, birth_date: e.target.value })} />
          </div>
          <Selecao id="p-local" label="Local de atendimento" value={f.location} onChange={e => setF({ ...f, location: e.target.value })}>
            <option value="equilibre">Clínica Equilibre</option>
            <option value="spinel">Instituto Spinel</option>
          </Selecao>
          {msg?.t === 'erro' && <Aviso tipo="erro">{msg.m}</Aviso>}
          <Botao type="submit" disabled={enviando} className="mt-2"><Send className="w-4 h-4" />{enviando ? 'Enviando' : 'Cadastrar e enviar convite'}</Botao>
        </form>
      </Painel>
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

export function Equipe() {
  const [lista, setLista] = useState<Membro[]>([])
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
    await supabase.from('team_permissions').upsert({ user_id: m.id, [k]: !m.team_permissions?.[k] })
    carregar()
  }

  async function acesso(m: Membro) {
    await supabase.from('profiles').update({ active: !m.active }).eq('id', m.id)
    carregar()
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <Titulo rotulo="Gestão" sub="Cada pessoa vê apenas o que a função dela exige. Toda abertura de ficha fica registrada.">Equipe e acessos</Titulo>
        <Botao onClick={() => setAbrir(true)}><Plus className="w-4 h-4" />Convidar pessoa</Botao>
      </div>
      {msg && <Aviso tipo={msg.t}>{msg.m}</Aviso>}

      {lista.length === 0 ? (
        <section className="cartao"><Vazio icone={Users} titulo="Nenhuma pessoa na equipe" texto="Convide assistentes e parceiros e escolha o que cada um pode fazer." /></section>
      ) : (
        <div className="grid md:grid-cols-2 gap-5">
          {lista.map(m => (
            <article key={m.id} className={`cartao p-6 flex flex-col gap-5 ${m.active ? '' : 'opacity-60'}`}>
              <div className="flex items-start gap-4">
                <Iniciais nome={m.full_name ?? m.email} className="w-12 h-12 text-xl" />
                <div className="min-w-0 flex-1">
                  <p className="font-display text-2xl leading-tight truncate">{m.full_name ?? m.email}</p>
                  <p className="text-sm text-apoio truncate">{m.email}</p>
                </div>
                {m.active ? <Selo tom="ok">Ativo</Selo> : <Selo>Suspenso</Selo>}
              </div>
              <div className="flex flex-col divide-y divide-areia/60 border-y border-areia/60">
                {PERMS.map(([k, r]) => {
                  const on = !!m.team_permissions?.[k]
                  return (
                    <label key={k} className="flex items-center justify-between py-2.5 text-sm cursor-pointer">
                      {r}
                      <input type="checkbox" checked={on} onChange={() => alternar(m, k)} className="sr-only peer" />
                      <span aria-hidden="true" className="w-9 h-5 bg-areia relative transition-colors peer-checked:bg-oliva peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-cafe after:absolute after:top-0.5 after:left-0.5 after:w-4 after:h-4 after:bg-white after:transition-transform peer-checked:after:translate-x-4" />
                    </label>
                  )
                })}
              </div>
              <button onClick={() => acesso(m)} className="self-start text-sm text-apoio hover:text-terracota">{m.active ? 'Suspender acesso' : 'Reativar acesso'}</button>
            </article>
          ))}
        </div>
      )}

      <Painel aberto={abrir} titulo="Convidar pessoa" onFechar={() => setAbrir(false)}>
        <form onSubmit={enviar} className="flex flex-col gap-6">
          <Campo id="e-nome" label="Nome" required value={f.full_name} onChange={e => setF({ ...f, full_name: e.target.value })} />
          <Campo id="e-email" label="E-mail" type="email" required value={f.email} onChange={e => setF({ ...f, email: e.target.value })} />
          <fieldset className="flex flex-col gap-2">
            <legend className="rotulo mb-3">O que pode fazer</legend>
            {PERMS.map(([k, r, d]) => (
              <label key={k} className={`flex gap-3 items-start p-3 border cursor-pointer transition-colors ${f.perms[k] ? 'border-cafe bg-white/70' : 'border-areia hover:border-apoio/50'}`}>
                <input type="checkbox" className="mt-0.5 w-4 h-4 accent-cafe" checked={!!f.perms[k]} onChange={e => setF({ ...f, perms: { ...f.perms, [k]: e.target.checked } })} />
                <span><span className="block text-sm">{r}</span><span className="block text-xs text-apoio mt-0.5">{d}</span></span>
              </label>
            ))}
          </fieldset>
          {f.perms.is_partner && <Campo id="e-esp" label="Especialidade" placeholder="Ex.: nutricionista" value={f.partner_specialty} onChange={e => setF({ ...f, partner_specialty: e.target.value })} />}
          {msg?.t === 'erro' && <Aviso tipo="erro">{msg.m}</Aviso>}
          <Botao type="submit"><Send className="w-4 h-4" />Enviar convite</Botao>
        </form>
      </Painel>
    </div>
  )
}
