import { useEffect, useState, type FormEvent } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../auth/AuthProvider'
import { Aviso, Botao, Campo, Titulo } from '../../components/ui'

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

export function Hoje() {
  const { profile } = useAuth()
  const [n, setN] = useState<number | null>(null)
  useEffect(() => {
    supabase.from('patients').select('id', { count: 'exact', head: true }).eq('status', 'ativa').then(({ count }) => setN(count ?? 0))
  }, [])
  return (
    <div className="flex flex-col gap-10 max-w-3xl">
      <Titulo rotulo={new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}>
        Olá, {profile?.full_name?.split(' ')[0] ?? 'bem-vinda'}
      </Titulo>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-areia border border-areia">
        {[['Pacientes ativas', n ?? '·'], ['Reações sinalizadas', '·'], ['Check-ins na fila', '·'], ['Mapas para revisar', '·']].map(([r, v]) => (
          <div key={r as string} className="bg-creme p-5">
            <p className="rotulo">{r}</p>
            <p className="font-display text-4xl mt-2 tabular-nums">{v}</p>
          </div>
        ))}
      </div>
      <Aviso>Check-ins e mapas entram aqui nas próximas fases.</Aviso>
    </div>
  )
}

type Paciente = { id: string; full_name: string; email: string; location: string | null; status: string; user_id: string | null }

export function Pacientes() {
  const [lista, setLista] = useState<Paciente[]>([])
  const [abrir, setAbrir] = useState(false)
  const [f, setF] = useState({ full_name: '', email: '', phone: '', birth_date: '', location: 'equilibre' })
  const [msg, setMsg] = useState<{ t: 'info' | 'erro'; m: string } | null>(null)
  const [enviando, setEnviando] = useState(false)

  const carregar = () => supabase.from('patients').select('id, full_name, email, location, status, user_id').order('full_name').then(({ data }) => setLista(data ?? []))
  useEffect(() => { carregar() }, [])

  async function enviar(e: FormEvent) {
    e.preventDefault()
    setEnviando(true); setMsg(null)
    try {
      await convidar({ role: 'paciente', full_name: f.full_name, email: f.email, patient: { phone: f.phone, birth_date: f.birth_date, location: f.location } })
      setMsg({ t: 'info', m: `Convite enviado para ${f.email}.` })
      setF({ full_name: '', email: '', phone: '', birth_date: '', location: 'equilibre' }); setAbrir(false); carregar()
    } catch (err) { setMsg({ t: 'erro', m: (err as Error).message }) }
    setEnviando(false)
  }

  return (
    <div className="flex flex-col gap-8 max-w-4xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <Titulo rotulo="Cadastro">Pacientes</Titulo>
        <Botao onClick={() => setAbrir(!abrir)} variante={abrir ? 'linha' : 'cheio'}>{abrir ? 'Fechar' : 'Nova paciente'}</Botao>
      </div>
      {msg && <Aviso tipo={msg.t}>{msg.m}</Aviso>}
      {abrir && (
        <form onSubmit={enviar} className="grid sm:grid-cols-2 gap-6 border border-areia p-6">
          <Campo id="p-nome" label="Nome completo" required value={f.full_name} onChange={e => setF({ ...f, full_name: e.target.value })} />
          <Campo id="p-email" label="E-mail" type="email" required value={f.email} onChange={e => setF({ ...f, email: e.target.value })} />
          <Campo id="p-tel" label="Telefone" value={f.phone} onChange={e => setF({ ...f, phone: e.target.value })} />
          <Campo id="p-nasc" label="Nascimento" type="date" value={f.birth_date} onChange={e => setF({ ...f, birth_date: e.target.value })} />
          <div className="flex flex-col gap-2">
            <label htmlFor="p-local" className="rotulo">Local</label>
            <select id="p-local" className="min-h-[48px] bg-transparent border-b border-areia" value={f.location} onChange={e => setF({ ...f, location: e.target.value })}>
              <option value="equilibre">Clínica Equilibre</option>
              <option value="spinel">Instituto Spinel</option>
            </select>
          </div>
          <div className="sm:col-span-2"><Botao type="submit" disabled={enviando}>{enviando ? 'Enviando' : 'Cadastrar e enviar convite'}</Botao></div>
        </form>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="text-left border-b border-areia">
            {['Nome', 'E-mail', 'Local', 'Acesso'].map(h => <th key={h} className="rotulo font-normal py-3 pr-4">{h}</th>)}
          </tr></thead>
          <tbody>
            {lista.map(p => (
              <tr key={p.id} className="border-b border-areia/60">
                <td className="py-3 pr-4">{p.full_name}</td>
                <td className="py-3 pr-4 text-apoio">{p.email}</td>
                <td className="py-3 pr-4">{p.location === 'spinel' ? 'Spinel' : p.location === 'equilibre' ? 'Equilibre' : '·'}</td>
                <td className="py-3 pr-4">{p.status === 'encerrada' ? 'Encerrado' : p.user_id ? 'Ativo' : 'Convite enviado'}</td>
              </tr>
            ))}
            {lista.length === 0 && <tr><td colSpan={4} className="py-6 text-apoio">Nenhuma paciente cadastrada ainda. Use “Nova paciente” para enviar o primeiro convite.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}

const PERMS: Array<[string, string]> = [
  ['can_manage_patients', 'Cadastrar pacientes'],
  ['can_upload_measurements', 'Lançar medidas e exames'],
  ['can_answer_checkins', 'Responder check-ins'],
  ['can_view_clinical', 'Ver dados clínicos de todas'],
  ['is_partner', 'Parceiro (vê só pacientes vinculadas)'],
]

type Membro = { id: string; full_name: string | null; email: string | null; active: boolean; team_permissions: Record<string, boolean> | null }

export function Equipe() {
  const [lista, setLista] = useState<Membro[]>([])
  const [f, setF] = useState<{ full_name: string; email: string; perms: Record<string, boolean>; partner_specialty: string }>({ full_name: '', email: '', perms: {}, partner_specialty: '' })
  const [msg, setMsg] = useState<{ t: 'info' | 'erro'; m: string } | null>(null)

  const carregar = () => supabase.from('profiles').select('id, full_name, email, active, team_permissions(*)').eq('role', 'equipe').order('full_name')
    .then(({ data }) => setLista((data as unknown as Membro[]) ?? []))
  useEffect(() => { carregar() }, [])

  async function enviar(e: FormEvent) {
    e.preventDefault(); setMsg(null)
    try {
      await convidar({ role: 'equipe', full_name: f.full_name, email: f.email, perms: { ...f.perms, partner_specialty: f.partner_specialty } })
      setMsg({ t: 'info', m: `Convite enviado para ${f.email}.` })
      setF({ full_name: '', email: '', perms: {}, partner_specialty: '' }); carregar()
    } catch (err) { setMsg({ t: 'erro', m: (err as Error).message }) }
  }

  async function alternar(m: Membro, k: string) {
    const atual = m.team_permissions?.[k] ?? false
    await supabase.from('team_permissions').upsert({ user_id: m.id, [k]: !atual })
    carregar()
  }

  async function acesso(m: Membro) {
    await supabase.from('profiles').update({ active: !m.active }).eq('id', m.id)
    carregar()
  }

  return (
    <div className="flex flex-col gap-10 max-w-4xl">
      <Titulo rotulo="Acessos">Equipe</Titulo>
      {msg && <Aviso tipo={msg.t}>{msg.m}</Aviso>}
      <form onSubmit={enviar} className="flex flex-col gap-6 border border-areia p-6">
        <p className="rotulo">Convidar pessoa</p>
        <div className="grid sm:grid-cols-2 gap-6">
          <Campo id="e-nome" label="Nome" required value={f.full_name} onChange={e => setF({ ...f, full_name: e.target.value })} />
          <Campo id="e-email" label="E-mail" type="email" required value={f.email} onChange={e => setF({ ...f, email: e.target.value })} />
        </div>
        <fieldset className="flex flex-col gap-3">
          <legend className="rotulo mb-3">O que pode fazer</legend>
          {PERMS.map(([k, r]) => (
            <label key={k} className="flex gap-3 items-center text-sm">
              <input type="checkbox" className="w-5 h-5 accent-cafe" checked={!!f.perms[k]} onChange={e => setF({ ...f, perms: { ...f.perms, [k]: e.target.checked } })} />{r}
            </label>
          ))}
        </fieldset>
        {f.perms.is_partner && <Campo id="e-esp" label="Especialidade" value={f.partner_specialty} onChange={e => setF({ ...f, partner_specialty: e.target.value })} />}
        <div><Botao type="submit">Enviar convite</Botao></div>
      </form>

      <div className="flex flex-col gap-4">
        {lista.map(m => (
          <div key={m.id} className="border-t border-areia pt-4 flex flex-col gap-3">
            <div className="flex flex-wrap justify-between gap-2">
              <div><p className="font-display text-xl">{m.full_name ?? m.email}</p><p className="text-sm text-apoio">{m.email}</p></div>
              <button onClick={() => acesso(m)} className="text-sm underline underline-offset-4 text-terracota">{m.active ? 'Suspender acesso' : 'Reativar acesso'}</button>
            </div>
            <div className="flex flex-wrap gap-2">
              {PERMS.map(([k, r]) => {
                const on = !!m.team_permissions?.[k]
                return <button key={k} onClick={() => alternar(m, k)} aria-pressed={on}
                  className={`text-xs px-3 py-2 border ${on ? 'bg-cafe text-creme border-cafe' : 'border-areia text-apoio'}`}>{r}</button>
              })}
            </div>
          </div>
        ))}
        {lista.length === 0 && <Aviso>Nenhuma pessoa na equipe ainda.</Aviso>}
      </div>
    </div>
  )
}
