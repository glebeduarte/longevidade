import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { entrarVista } from '../../lib/vista'
import { ArrowDownRight, ArrowLeft, Eye, ArrowUpRight, FileText, Paperclip, Plus, Send } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { Icone } from '../../components/icones'
import { can, useAuth } from '../../auth/AuthProvider'
import { Abas, Aviso, Bloco, Botao, Campo, Iniciais, Selo, Vazio } from '../../components/ui'
import { NIVEL, dataBR, num, type Nivel } from '../../lib/faixas'
import { AbaAtendimento } from './atendimento'
import { AbaExames } from './exames'
import { AbaEstilo } from './estilo'
import { AbaMapa } from './mapa'
import { AbaPrograma } from './programa'
import { AbaRiscos } from './riscos'

type Paciente = { id: string; full_name: string; email: string; phone: string | null; birth_date: string | null; location: string | null; status: string; user_id: string | null }
type Questionario = { id: string; name: string; domain: string; sort: number }
type Envio = { id: string; status: string; created_at: string; questionnaire_id: string; questionnaires: { name: string; domain: string } | null }
type Resposta = { id: string; questionnaire_id: string; score: number | null; band_label: string | null; band_level: Nivel | null; flagged: boolean; submitted_at: string; questionnaires: { name: string; domain: string } | null }

type Aba = 'atendimento' | 'programa' | 'exames' | 'estilo' | 'riscos' | 'mapa'
const ABAS: Array<[Aba, string]> = [['atendimento', 'Atendimento'], ['programa', 'Programa'], ['exames', 'Exames e medidas'], ['estilo', 'Estilo de vida'], ['riscos', 'Riscos e cálculos'], ['mapa', 'Mapa da saúde']]

function SemAcesso() {
  return <Aviso>Esta parte do prontuário fica visível para a médica e para quem tem acesso clínico.</Aviso>
}

export function FichaPaciente() {
  const { id } = useParams()
  const { profile, perms } = useAuth()
  const nav = useNavigate()
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

  const local = p.location === 'spinel' ? 'Instituto Spinel' : p.location === 'equilibre' ? 'Clínica Equilibre' : null

  return (
    <div className="flex flex-col gap-5">
      <nav aria-label="Caminho" className="text-corpo text-apoio flex items-center gap-1.5">
        <Link to="/painel/pacientes" className="hover:text-texto inline-flex items-center gap-1"><ArrowLeft className="w-4 h-4" strokeWidth={1.6} />Pacientes</Link>
      </nav>
      <header className="flex flex-wrap items-center gap-x-4 gap-y-3">
        <Iniciais nome={p.full_name} className="w-12 h-12 text-[16px]" />
        <div className="flex-1 min-w-[180px]">
          <h1 className="titulo-pagina !text-[26px] sm:!text-pagina">{p.full_name}</h1>
          <p className="text-corpo text-apoio mt-0.5">
            {[idade != null ? `${idade} anos` : null, local, p.phone].filter(Boolean).join(' · ')}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {profile?.role === 'medica' && p.status === 'ativa' && (
            <Botao tamanho="sm" variante="linha" onClick={() => { entrarVista({ pid: p.id, nome: p.full_name.replace(/\s*\(teste\)/, ''), userId: p.user_id }); nav('/app') }}><Eye className="w-4 h-4" />Ver como paciente</Botao>
          )}
          {mapa && <button onClick={() => trocar('mapa')} className="rounded-full focus-visible:outline-2"><Selo tom="alerta">Mapa em andamento</Selo></button>}
          {p.status === 'encerrada' ? <Selo>Programa encerrado</Selo> : p.user_id ? <Selo tom="ok">Acesso ativo</Selo> : <Selo>Convite enviado</Selo>}
        </div>
      </header>

      <Abas rotulo="Seções da ficha" itens={ABAS} atual={aba} aoTrocar={trocar} />

      {aba === 'atendimento' && (clinico ? <AbaAtendimento pid={p.id} nascimento={p.birth_date} /> : <SemAcesso />)}
      {aba === 'programa' && <AbaPrograma pid={p.id} nome={p.full_name} podeGerir={can(profile, perms, 'can_manage_patients')} clinico={clinico} aoEncerrar={() => supabase.from('patients').select('*').eq('id', p.id).maybeSingle().then(({ data }) => setP(data))} />}
      {aba === 'exames' && <AbaExames pid={p.id} nascimento={p.birth_date} podeLancar={podeLancar} bio={<AbaBio pid={p.id} podeLancar={podeLancar} />} />}
      {aba === 'estilo' && <AbaEstilo pid={p.id} questionarios={<AbaQuestionarios pid={p.id} podeEnviar={can(profile, perms, 'can_manage_patients')} />} />}
      {aba === 'riscos' && (clinico ? <AbaRiscos pid={p.id} nascimento={p.birth_date} /> : <SemAcesso />)}
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
    <div className="grid xl:grid-cols-12 gap-4 items-start">
      <Bloco className="xl:col-span-7" icone={<Icone tema="questionario" fundo tamanho={36} />} titulo="Histórico de respostas" sub="Última resposta de cada questionário, com a variação desde a anterior" semPad>
        {porQ.size === 0 ? (
          <div className="px-5 pb-5"><Vazio titulo="Nenhum questionário respondido ainda" texto="Envie ao lado e as respostas aparecem aqui com escore e faixa." /></div>
        ) : (
          <table className="w-full text-corpo">
            <thead><tr className="text-meta text-apoio text-left">
              <th className="font-normal px-5 py-2">Questionário</th><th className="font-normal px-3 py-2 text-right">Escore</th>
              <th className="font-normal px-3 py-2 hidden sm:table-cell">Faixa</th><th className="font-normal px-5 py-2 text-right">Variação</th>
            </tr></thead>
            <tbody>
              {[...porQ.values()].map(([ult, ant]) => {
                const n = ult.band_level ? NIVEL[ult.band_level] : null
                const delta = ant && ult.score != null && ant.score != null ? ult.score - ant.score : null
                return (
                  <tr key={ult.id} className="border-t border-regra align-top">
                    <td className="px-5 py-3">
                      <p className="font-medium">{ult.questionnaires?.name}</p>
                      <p className="text-meta text-apoio">{ult.questionnaires?.domain} · {dataBR(ult.submitted_at)}{ult.flagged ? ' · ' : ''}{ult.flagged && <span className="text-terracota font-medium">alerta</span>}</p>
                      <p className={`sm:hidden text-meta mt-0.5 ${n?.cor ?? 'text-apoio'}`}>{ult.band_label ?? 'Registro'}</p>
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums text-[15px]">{ult.score != null ? num(ult.score, 1) : <span className="text-apoio/60">·</span>}</td>
                    <td className="px-3 py-3 hidden sm:table-cell"><span className={`inline-flex items-center gap-2 ${n?.cor ?? 'text-apoio'}`}><span className={`w-2 h-2 rounded-full ${n?.fundo ?? 'bg-areia'}`} />{ult.band_label ?? 'Registro'}</span></td>
                    <td className="px-5 py-3 text-right tabular-nums text-apoio">
                      {delta == null ? <span className="text-apoio/60">·</span> : delta === 0 ? '0' : (
                        <span className="inline-flex items-center gap-0.5">{delta > 0 ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}{num(Math.abs(delta), 1)}</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </Bloco>

      <div className="xl:col-span-5 flex flex-col gap-4">
        {envios.length > 0 && (
          <Bloco icone={<Icone tema="questionario" fundo tamanho={36} />} titulo="Aguardando resposta" acao={<Selo tom="alerta">{envios.length}</Selo>}>
            <ul className="flex flex-col">
              {envios.map(e => <li key={e.id} className="flex justify-between py-1.5 text-corpo"><span>{e.questionnaires?.name}</span><span className="text-apoio tabular-nums">enviado {dataBR(e.created_at)}</span></li>)}
            </ul>
          </Bloco>
        )}
        {podeEnviar && (
          <Bloco icone={<Icone tema="questionario" fundo tamanho={36} />} titulo="Enviar questionários" sub="Aparecem na área da paciente e no e-mail dela">
            <div className="flex flex-col -mx-2">
              {todos.map(q => {
                const ja = pendentes.has(q.id)
                return (
                  <label key={q.id} className={`flex items-center gap-3 px-2 h-10 rounded text-corpo ${ja ? 'opacity-50' : 'cursor-pointer hover:bg-tom/60'}`}>
                    <input type="checkbox" disabled={ja} className="w-4 h-4 accent-cafe" checked={!!sel[q.id]} onChange={e => setSel({ ...sel, [q.id]: e.target.checked })} />
                    <span className="flex-1">{q.name}</span><span className="text-meta text-apoio">{ja ? 'pendente' : q.domain}</span>
                  </label>
                )
              })}
            </div>
            <div className="flex gap-2 mt-4">
              <Botao variante="linha" onClick={() => setSel(Object.fromEntries(todos.filter(q => !pendentes.has(q.id)).map(q => [q.id, true])))}>Marcar todos</Botao>
              <Botao disabled={!marcados.length} onClick={enviar} className="flex-1"><Send className="w-4 h-4" strokeWidth={1.8} />Enviar {marcados.length || ''}</Botao>
            </div>
            {msg && <div className="mt-3"><Aviso tipo={msg.t}>{msg.m}</Aviso></div>}
          </Bloco>
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
    <div className="flex flex-col gap-4">
      {msg && <Aviso tipo={msg.t}>{msg.m}</Aviso>}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-corpo text-apoio">{lista.length ? `${lista.length} ${lista.length === 1 ? 'medição' : 'medições'} · última em ${dataBR(ult.measured_at)}` : 'Nenhuma medição de bioimpedância ainda.'}</p>
        {podeLancar && <Botao variante={abrir ? 'linha' : 'suave'} onClick={() => setAbrir(!abrir)}>{abrir ? 'Fechar' : <><Plus className="w-4 h-4" strokeWidth={1.8} />Nova medição</>}</Botao>}
      </div>

      {abrir && (
        <form onSubmit={salvar} className="cartao p-5 md:p-6 flex flex-col gap-6">
          <div className="grid md:grid-cols-2 gap-4">
            <Campo id="b-data" label="Data e hora do exame" type="datetime-local" required value={data} onChange={e => setData(e.target.value)} />
            <div className="flex flex-col gap-1.5">
              <span className="text-corpo font-medium">Ficha da balança</span>
              <label htmlFor="b-arq" className="min-h-[44px] rounded border border-dashed border-controle bg-folha px-3 flex items-center gap-2.5 text-corpo text-apoio cursor-pointer hover:border-cafe">
                <Paperclip className="w-4 h-4" strokeWidth={1.6} />{arquivo ? arquivo.name : 'Foto ou PDF da ficha InBody'}
              </label>
              <input id="b-arq" type="file" accept="image/*,application/pdf" className="sr-only" onChange={e => setArquivo(e.target.files?.[0] ?? null)} />
            </div>
          </div>
          <fieldset>
            <legend className="titulo-bloco mb-3">Composição e análises</legend>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-3">
              {CAMPOS.map(([k, r, u]) => (
                <Campo key={k} id={`b-${k}`} label={u ? `${r} (${u})` : r} inputMode="decimal" value={v[k] ?? ''} onChange={e => setV({ ...v, [k]: e.target.value })} />
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend className="titulo-bloco mb-3">Análise segmentar em kg</legend>
            <div className="overflow-x-auto">
              <table className="text-corpo w-full min-w-[420px]">
                <thead><tr className="text-left text-meta text-apoio"><th className="font-normal pb-2">Segmento</th><th className="font-normal pb-2">Massa magra</th><th className="font-normal pb-2">Gordura</th></tr></thead>
                <tbody>
                  {SEG.map(([k, r]) => (
                    <tr key={k}>
                      <td className="py-1 pr-4">{r}</td>
                      {(['magra', 'gordura'] as const).map(c => (
                        <td key={c} className="py-1 pr-4">
                          <label className="sr-only" htmlFor={`s-${k}-${c}`}>{r} {c}</label>
                          <input id={`s-${k}-${c}`} inputMode="decimal" className="campo"
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
        <section aria-label="Última medição" className="rounded-lg border border-borda overflow-hidden grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-px bg-borda">
          {DESTAQUE.map(k => {
            const c = CAMPOS.find(x => x[0] === k)!
            const d = ant && ult[k] != null && ant[k] != null ? (ult[k] as number) - (ant[k] as number) : null
            return (
              <div key={k} className="bg-folha px-4 py-3.5">
                <p className="rotulo truncate">{c[1]}</p>
                <p className="numero mt-1">{num(ult[k] as number)}<span className="text-meta text-apoio ml-1">{c[2]}</span></p>
                <p className="text-meta text-apoio tabular-nums">{d != null ? `${d > 0 ? '+' : ''}${num(d)} desde ${dataBR(ant.measured_at)}` : 'primeira medição'}</p>
              </div>
            )
          })}
        </section>
      )}

      {lista.length > 0 && (
        <section className="cartao overflow-x-auto">
          <table className="w-full text-corpo min-w-[640px]">
            <thead><tr className="text-meta text-apoio">
              {['Data', 'Peso', 'Músculo', 'Gordura', '% gordura', 'Visceral', 'Ficha'].map((h, i) => <th key={h} className={`font-normal py-2.5 px-4 ${i && i < 6 ? 'text-right' : 'text-left'}`}>{h}</th>)}
            </tr></thead>
            <tbody>
              {lista.map(b => (
                <tr key={b.id} className="border-t border-regra tabular-nums">
                  <td className="py-2.5 px-4">{dataBR(b.measured_at)}</td>
                  <td className="py-2.5 px-4 text-right">{num(b.weight)}</td><td className="py-2.5 px-4 text-right">{num(b.smm)}</td>
                  <td className="py-2.5 px-4 text-right">{num(b.fat_mass)}</td><td className="py-2.5 px-4 text-right">{num(b.pbf)}</td><td className="py-2.5 px-4 text-right">{num(b.visceral_level, 0)}</td>
                  <td className="py-2.5 px-4">{b.file_path ? <button onClick={() => abrirArquivo(b.file_path!)} className="inline-flex items-center gap-1 link"><FileText className="w-4 h-4" strokeWidth={1.6} />Abrir</button> : <span className="text-apoio/60">·</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </div>
  )
}
