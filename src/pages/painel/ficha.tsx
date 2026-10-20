import { useEffect, useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowDownRight, ArrowLeft, ArrowUpRight, FileText, Paperclip, Plus, Send } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { can, useAuth } from '../../auth/AuthProvider'
import { Aviso, Botao, Campo, Iniciais, Selo } from '../../components/ui'
import { NIVEL, dataBR, num, type Nivel } from '../../lib/faixas'
import { AbaAtendimento } from './atendimento'
import { AbaExames } from './exames'
import { AbaEstilo } from './estilo'
import { AbaMapa } from './mapa'

type Paciente = { id: string; full_name: string; email: string; phone: string | null; birth_date: string | null; location: string | null; status: string; user_id: string | null }
type Questionario = { id: string; name: string; domain: string; sort: number }
type Envio = { id: string; status: string; created_at: string; questionnaire_id: string; questionnaires: { name: string; domain: string } | null }
type Resposta = { id: string; questionnaire_id: string; score: number | null; band_label: string | null; band_level: Nivel | null; flagged: boolean; submitted_at: string; questionnaires: { name: string; domain: string } | null }

type Aba = 'atendimento' | 'exames' | 'estilo' | 'mapa'
const ABAS: Array<[Aba, string]> = [['atendimento', 'Atendimento'], ['exames', 'Exames e medidas'], ['estilo', 'Estilo de vida'], ['mapa', 'Mapa da saúde']]

function SemAcesso() {
  return <Aviso>Esta parte do prontuário fica visível para a médica e para quem tem acesso clínico.</Aviso>
}

export function FichaPaciente() {
  const { id } = useParams()
  const { profile, perms } = useAuth()
  const [p, setP] = useState<Paciente | null>(null)
  const [aba, setAba] = useState<Aba>(() => (new URLSearchParams(location.search).get('aba') as Aba) || 'atendimento')
  const [mapa, setMapa] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    supabase.from('patients').select('*').eq('id', id).maybeSingle().then(({ data }) => setP(data))
    supabase.rpc('log_access', { pid: id, p_resource: 'ficha' })
    supabase.from('health_maps').select('status').eq('patient_id', id).eq('status', 'em_andamento').maybeSingle().then(({ data }) => setMapa(data ? 'em_andamento' : null))
  }, [id])

  if (!p) return <p className="rotulo">Carregando</p>
  const clinico = can(profile, perms, 'can_view_clinical')
  const podeLancar = can(profile, perms, 'can_upload_measurements')
  const trocar = (k: Aba) => { setAba(k); history.replaceState(null, '', `?aba=${k}`) }
  const idade = p.birth_date ? Math.floor((Date.now() - new Date(p.birth_date).getTime()) / 3.15576e10) : null

  return (
    <div className="flex flex-col gap-8">
      <Link to="/painel/pacientes" className="inline-flex items-center gap-2 text-sm text-apoio hover:text-texto self-start"><ArrowLeft className="w-4 h-4" />Pacientes</Link>
      <div className="flex flex-wrap items-center gap-5">
        <Iniciais nome={p.full_name} className="w-16 h-16 text-2xl" />
        <div className="flex-1 min-w-0">
          <h1 className="font-display text-[40px] leading-none">{p.full_name}</h1>
          <p className="text-sm text-apoio mt-2">
            {[idade != null ? `${idade} anos` : null, p.location === 'spinel' ? 'Instituto Spinel' : p.location === 'equilibre' ? 'Clínica Equilibre' : null, p.email].filter(Boolean).join(' · ')}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {mapa && <button onClick={() => trocar('mapa')}><Selo tom="alerta">Mapa em andamento</Selo></button>}
          {p.user_id ? <Selo tom="ok">Acesso ativo</Selo> : <Selo>Convite enviado</Selo>}
        </div>
      </div>

      <div role="tablist" aria-label="Seções da ficha" className="flex gap-1 border-b border-areia overflow-x-auto">
        {ABAS.map(([k, r]) => (
          <button key={k} role="tab" aria-selected={aba === k} onClick={() => trocar(k)}
            className={`px-5 h-12 text-sm -mb-px border-b-2 whitespace-nowrap transition-colors ${aba === k ? 'border-cafe text-texto' : 'border-transparent text-apoio hover:text-texto'}`}>{r}</button>
        ))}
      </div>

      {aba === 'atendimento' && (clinico ? <AbaAtendimento pid={p.id} nascimento={p.birth_date} /> : <SemAcesso />)}
      {aba === 'exames' && <AbaExames pid={p.id} nascimento={p.birth_date} podeLancar={podeLancar} bio={<AbaBio pid={p.id} podeLancar={podeLancar} />} />}
      {aba === 'estilo' && <AbaEstilo pid={p.id} questionarios={<AbaQuestionarios pid={p.id} podeEnviar={can(profile, perms, 'can_manage_patients')} />} />}
      {aba === 'mapa' && (clinico ? <AbaMapa pid={p.id} /> : <SemAcesso />)}
    </div>
  )
}

export function AbaQuestionarios({ pid, podeEnviar }: { pid: string; podeEnviar: boolean }) {
  const { session } = useAuth()
  const [todos, setTodos] = useState<Questionario[]>([])
  const [envios, setEnvios] = useState<Envio[]>([])
  const [resp, setResp] = useState<Resposta[]>([])
  const [sel, setSel] = useState<Record<string, boolean>>({})
  const [msg, setMsg] = useState<{ t: 'ok' | 'erro'; m: string } | null>(null)

  const carregar = () => {
    supabase.from('questionnaires').select('id, name, domain, sort').eq('active', true).order('sort').then(({ data }) => setTodos(data ?? []))
    supabase.from('questionnaire_assignments').select('id, status, created_at, questionnaire_id, questionnaires(name, domain)').eq('patient_id', pid).eq('status', 'pendente').order('created_at')
      .then(({ data }) => setEnvios((data as unknown as Envio[]) ?? []))
    supabase.from('questionnaire_responses').select('id, questionnaire_id, score, band_label, band_level, flagged, submitted_at, questionnaires(name, domain)').eq('patient_id', pid).order('submitted_at', { ascending: false })
      .then(({ data }) => setResp((data as unknown as Resposta[]) ?? []))
  }
  useEffect(carregar, [pid])

  const pendentes = new Set(envios.map(e => e.questionnaire_id))
  const marcados = Object.keys(sel).filter(k => sel[k])

  async function enviar() {
    setMsg(null)
    const { error } = await supabase.from('questionnaire_assignments').insert(
      marcados.map(q => ({ patient_id: pid, questionnaire_id: q, assigned_by: session?.user.id })))
    if (error) return setMsg({ t: 'erro', m: 'Não foi possível enviar. Tente de novo.' })
    setMsg({ t: 'ok', m: `${marcados.length} questionário(s) enviado(s). Eles aparecem na área da paciente.` })
    setSel({}); carregar()
  }

  // última resposta por questionário, com a anterior para comparar
  const porQ = new Map<string, Resposta[]>()
  resp.forEach(r => porQ.set(r.questionnaire_id, [...(porQ.get(r.questionnaire_id) ?? []), r]))

  return (
    <div className="grid xl:grid-cols-[1.5fr_1fr] gap-6 items-start">
      <section className="cartao">
        <div className="px-6 h-16 flex items-center border-b border-areia/70"><h2 className="font-display text-2xl">Histórico de respostas</h2></div>
        {porQ.size === 0 ? (
          <p className="p-6 text-sm text-apoio">Nenhum questionário respondido ainda.</p>
        ) : (
          <ul className="divide-y divide-areia/60">
            {[...porQ.values()].map(([ult, ant]) => {
              const n = ult.band_level ? NIVEL[ult.band_level] : null
              const delta = ant && ult.score != null && ant.score != null ? ult.score - ant.score : null
              return (
                <li key={ult.id} className="px-6 py-4 flex items-center gap-4">
                  <span className={`w-1.5 self-stretch ${n?.fundo ?? 'bg-areia'}`} aria-hidden="true" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium">{ult.questionnaires?.name}</p>
                    <p className="text-xs text-apoio">{ult.questionnaires?.domain} · {dataBR(ult.submitted_at)}</p>
                  </div>
                  {ult.flagged && <Selo tom="alerta">Alerta</Selo>}
                  <div className="text-right">
                    <p className="font-display text-3xl leading-none tabular-nums">{ult.score != null ? num(ult.score, 2) : '·'}</p>
                    <p className={`text-xs mt-1 ${n?.cor ?? 'text-apoio'}`}>{ult.band_label ?? 'Registro'}</p>
                  </div>
                  {delta != null && delta !== 0 && (
                    <span className="text-xs text-apoio inline-flex items-center w-12 justify-end tabular-nums">
                      {delta > 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}{num(Math.abs(delta), 2)}
                    </span>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </section>

      <div className="flex flex-col gap-6">
        {envios.length > 0 && (
          <section className="cartao p-6 flex flex-col gap-3">
            <p className="rotulo">Aguardando resposta</p>
            {envios.map(e => <p key={e.id} className="text-sm flex justify-between"><span>{e.questionnaires?.name}</span><span className="text-apoio">{dataBR(e.created_at)}</span></p>)}
          </section>
        )}
        {podeEnviar && (
          <section className="cartao p-6 flex flex-col gap-4">
            <p className="rotulo">Enviar questionários</p>
            <div className="flex flex-col gap-1">
              {todos.map(q => {
                const ja = pendentes.has(q.id)
                return (
                  <label key={q.id} className={`flex items-center gap-3 py-2 text-sm ${ja ? 'opacity-50' : 'cursor-pointer'}`}>
                    <input type="checkbox" disabled={ja} className="w-4 h-4 accent-cafe" checked={!!sel[q.id]} onChange={e => setSel({ ...sel, [q.id]: e.target.checked })} />
                    <span className="flex-1">{q.name}</span><span className="text-xs text-apoio">{ja ? 'pendente' : q.domain}</span>
                  </label>
                )
              })}
            </div>
            <div className="flex gap-3">
              <Botao variante="linha" onClick={() => setSel(Object.fromEntries(todos.filter(q => !pendentes.has(q.id)).map(q => [q.id, true])))}>Todos</Botao>
              <Botao disabled={!marcados.length} onClick={enviar} className="flex-1"><Send className="w-4 h-4" />Enviar {marcados.length || ''}</Botao>
            </div>
            {msg && <Aviso tipo={msg.t}>{msg.m}</Aviso>}
          </section>
        )}
      </div>
    </div>
  )
}

type Bio = Record<string, number | null> & { id: string; measured_at: string; file_path: string | null; segmental: Record<string, { magra?: number; gordura?: number }> }

const CAMPOS: Array<[string, string, string]> = [
  ['weight', 'Peso', 'kg'], ['smm', 'Massa muscular esquelética', 'kg'], ['fat_mass', 'Massa de gordura', 'kg'], ['pbf', 'Percentual de gordura', '%'],
  ['bmi', 'IMC', 'kg/m²'], ['body_water', 'Água corporal total', 'L'], ['protein', 'Proteína', 'kg'], ['minerals', 'Minerais', 'kg'],
  ['ffm', 'Massa livre de gordura', 'kg'], ['whr', 'Relação cintura-quadril', ''], ['visceral_level', 'Gordura visceral', 'nível'], ['obesity_degree', 'Grau de obesidade', '%'],
  ['bmr', 'Taxa metabólica basal', 'kcal'], ['smi', 'SMI', 'kg/m²'], ['inbody_score', 'Pontuação InBody', 'pts'], ['recommended_kcal', 'Ingestão recomendada', 'kcal'],
]
const SEG: Array<[string, string]> = [['braco_d', 'Braço direito'], ['braco_e', 'Braço esquerdo'], ['tronco', 'Tronco'], ['perna_d', 'Perna direita'], ['perna_e', 'Perna esquerda']]
const DESTAQUE = ['weight', 'smm', 'fat_mass', 'pbf', 'visceral_level', 'inbody_score']

export function AbaBio({ pid, podeLancar }: { pid: string; podeLancar: boolean }) {
  const { session } = useAuth()
  const [lista, setLista] = useState<Bio[]>([])
  const [abrir, setAbrir] = useState(false)
  const [v, setV] = useState<Record<string, string>>({})
  const [seg, setSeg] = useState<Record<string, { magra: string; gordura: string }>>({})
  const [arquivo, setArquivo] = useState<File | null>(null)
  const [data, setData] = useState(() => new Date().toISOString().slice(0, 16))
  const [msg, setMsg] = useState<{ t: 'ok' | 'erro'; m: string } | null>(null)
  const [salvando, setSalvando] = useState(false)

  const carregar = () => supabase.from('bioimpedance').select('*').eq('patient_id', pid).order('measured_at', { ascending: false })
    .then(({ data }) => setLista((data as Bio[]) ?? []))
  useEffect(() => { carregar() }, [pid])

  const n = (s?: string) => (s == null || s.trim() === '' ? null : Number(s.replace(',', '.')))

  async function salvar(e: FormEvent) {
    e.preventDefault(); setSalvando(true); setMsg(null)
    let file_path: string | null = null
    if (arquivo) {
      const ext = arquivo.name.split('.').pop()?.toLowerCase() ?? 'jpg'
      file_path = `${pid}/bioimpedancia-${Date.now()}.${ext}`
      const { error } = await supabase.storage.from('clinico').upload(file_path, arquivo, { contentType: arquivo.type })
      if (error) { setSalvando(false); return setMsg({ t: 'erro', m: 'Não foi possível enviar o arquivo. Use JPG, PNG ou PDF de até 15 MB.' }) }
    }
    const row: Record<string, unknown> = {
      patient_id: pid, measured_at: new Date(data).toISOString(), file_path, created_by: session?.user.id,
      segmental: Object.fromEntries(SEG.map(([k]) => [k, { magra: n(seg[k]?.magra), gordura: n(seg[k]?.gordura) }])),
    }
    CAMPOS.forEach(([k]) => { row[k] = n(v[k]) })
    const { error } = await supabase.from('bioimpedance').insert(row)
    setSalvando(false)
    if (error) return setMsg({ t: 'erro', m: 'Não foi possível salvar. Confira os valores.' })
    setMsg({ t: 'ok', m: 'Medição salva.' }); setV({}); setSeg({}); setArquivo(null); setAbrir(false); carregar()
  }

  async function abrirArquivo(path: string) {
    const { data } = await supabase.storage.from('clinico').createSignedUrl(path, 60)
    if (data?.signedUrl) window.open(data.signedUrl, '_blank', 'noopener')
  }

  const [ult, ant] = lista

  return (
    <div className="flex flex-col gap-6">
      {msg && <Aviso tipo={msg.t}>{msg.m}</Aviso>}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm text-apoio">{lista.length ? `${lista.length} medição(ões) · última em ${dataBR(ult.measured_at)}` : 'Nenhuma medição ainda.'}</p>
        {podeLancar && <Botao onClick={() => setAbrir(!abrir)} variante={abrir ? 'linha' : 'cheio'}>{abrir ? 'Fechar' : <><Plus className="w-4 h-4" />Nova medição</>}</Botao>}
      </div>

      {abrir && (
        <form onSubmit={salvar} className="cartao p-6 md:p-8 flex flex-col gap-8">
          <div className="grid md:grid-cols-2 gap-6">
            <Campo id="b-data" label="Data e hora do exame" type="datetime-local" required value={data} onChange={e => setData(e.target.value)} />
            <div className="flex flex-col gap-2">
              <span className="rotulo">Ficha da balança</span>
              <label htmlFor="b-arq" className="min-h-[52px] border border-dashed border-areia bg-white/50 px-4 flex items-center gap-3 text-sm cursor-pointer hover:border-cafe">
                <Paperclip className="w-4 h-4 text-apoio" />{arquivo ? arquivo.name : 'Foto ou PDF da ficha InBody'}
              </label>
              <input id="b-arq" type="file" accept="image/*,application/pdf" className="sr-only" onChange={e => setArquivo(e.target.files?.[0] ?? null)} />
            </div>
          </div>
          <fieldset>
            <legend className="font-display text-2xl mb-4">Composição e análises</legend>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {CAMPOS.map(([k, r, u]) => (
                <Campo key={k} id={`b-${k}`} label={u ? `${r} (${u})` : r} inputMode="decimal" value={v[k] ?? ''} onChange={e => setV({ ...v, [k]: e.target.value })} />
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend className="font-display text-2xl mb-4">Análise segmentar (kg)</legend>
            <div className="overflow-x-auto">
              <table className="text-sm w-full min-w-[420px]">
                <thead><tr className="text-left"><th className="rotulo font-medium pb-2">Segmento</th><th className="rotulo font-medium pb-2">Massa magra</th><th className="rotulo font-medium pb-2">Gordura</th></tr></thead>
                <tbody>
                  {SEG.map(([k, r]) => (
                    <tr key={k}>
                      <td className="py-1.5 pr-4">{r}</td>
                      {(['magra', 'gordura'] as const).map(c => (
                        <td key={c} className="py-1.5 pr-4">
                          <label className="sr-only" htmlFor={`s-${k}-${c}`}>{r} {c}</label>
                          <input id={`s-${k}-${c}`} inputMode="decimal" className="w-full min-h-[44px] bg-white/70 border border-areia px-3 focus:outline-none focus:border-cafe"
                            value={seg[k]?.[c] ?? ''} onChange={e => setSeg({ ...seg, [k]: { magra: seg[k]?.magra ?? '', gordura: seg[k]?.gordura ?? '', [c]: e.target.value } })} />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </fieldset>
          <Botao type="submit" disabled={salvando} className="self-start">{salvando ? 'Salvando' : 'Salvar medição'}</Botao>
        </form>
      )}

      {ult && (
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {DESTAQUE.map(k => {
            const c = CAMPOS.find(x => x[0] === k)!
            const d = ant && ult[k] != null && ant[k] != null ? (ult[k] as number) - (ant[k] as number) : null
            return (
              <div key={k} className="cartao p-5">
                <p className="rotulo">{c[1]}</p>
                <p className="font-display text-4xl mt-3 tabular-nums">{num(ult[k] as number)}<span className="text-base text-apoio ml-1">{c[2]}</span></p>
                {d != null && <p className="text-xs text-apoio mt-1 tabular-nums">{d > 0 ? '+' : ''}{num(d)} desde {dataBR(ant.measured_at)}</p>}
              </div>
            )
          })}
        </div>
      )}

      {lista.length > 0 && (
        <section className="cartao overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead><tr className="text-left">
              {['Data', 'Peso', 'Músculo', 'Gordura', '% gordura', 'Visceral', 'Ficha'].map(h => <th key={h} className="rotulo font-medium py-4 px-5 border-b border-areia/70">{h}</th>)}
            </tr></thead>
            <tbody>
              {lista.map(b => (
                <tr key={b.id} className="border-b border-areia/50 last:border-0 tabular-nums">
                  <td className="py-3 px-5">{dataBR(b.measured_at)}</td>
                  <td className="py-3 px-5">{num(b.weight)}</td><td className="py-3 px-5">{num(b.smm)}</td>
                  <td className="py-3 px-5">{num(b.fat_mass)}</td><td className="py-3 px-5">{num(b.pbf)}</td><td className="py-3 px-5">{num(b.visceral_level, 0)}</td>
                  <td className="py-3 px-5">{b.file_path ? <button onClick={() => abrirArquivo(b.file_path!)} className="inline-flex items-center gap-1 text-cafe hover:underline"><FileText className="w-4 h-4" />Abrir</button> : '·'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </div>
  )
}
