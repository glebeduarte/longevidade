import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { entrarVista } from '../../lib/vista'
import { ExternalLink, Eye, Plus, Send } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { Icone } from '../../components/icones'
import { can, useAuth } from '../../auth/AuthProvider'
import { Aviso, Bloco, Botao, Campo, Iniciais, Selo, Titulo, Vazio } from '../../components/ui'
import { dataBR } from '../../lib/faixas'
import { LOCAL, dataHora, hojeISO, prazoTexto, type Checkin, type Encontro, type Video } from '../../lib/programa'
import { DetalheCheckin } from './programa'

const limpo = (n?: string | null) => (n ?? '').replace(/\s*\(teste\)/, '')

/** Fila de check-ins respondidos, com prazo de 3 dias úteis e reação no topo. */
export function FilaCheckins() {
  const { session, profile, perms } = useAuth()
  const [fila, setFila] = useState<Checkin[] | null>(null)
  const [sel, setSel] = useState<string | null>(null)
  const [resposta, setResposta] = useState('')
  const [feitos, setFeitos] = useState<Checkin[]>([])
  const pode = can(profile, perms, 'can_answer_checkins')

  const carregar = () => {
    supabase.from('checkins').select('*, patients(full_name)').eq('status', 'respondido').order('submitted_at')
      .then(({ data }) => {
        const l = ((data as Checkin[]) ?? []).sort((a, b) => Number(b.reaction) - Number(a.reaction))
        setFila(l); setSel(s => s && l.some(x => x.id === s) ? s : l[0]?.id ?? null)
      })
    supabase.from('checkins').select('*, patients(full_name)').eq('status', 'atendido').order('replied_at', { ascending: false }).limit(5)
      .then(({ data }) => setFeitos((data as Checkin[]) ?? []))
  }
  useEffect(carregar, [])
  const atual = fila?.find(c => c.id === sel) ?? null

  async function responder() {
    if (!atual || !resposta.trim()) return
    await supabase.from('checkins').update({ reply: resposta.trim(), replied_by: session?.user.id, replied_at: new Date().toISOString(), status: 'atendido' }).eq('id', atual.id)
    setResposta(''); carregar()
  }

  return (
    <div className="flex flex-col gap-6">
      <Titulo sub={fila ? `${fila.length} ${fila.length === 1 ? 'check-in aguarda' : 'check-ins aguardam'} resposta · prazo de 3 dias úteis` : undefined}>Check-ins</Titulo>
      {!fila ? <p className="text-corpo text-apoio">Carregando</p> : fila.length === 0 ? (
        <Bloco icone={<Icone tema="checkin" fundo tamanho={36} />} titulo="Fila vazia"><Vazio titulo="Nenhum check-in aguardando resposta" texto="As respostas das pacientes aparecem aqui assim que chegam." /></Bloco>
      ) : (
        <div className="grid lg:grid-cols-[minmax(0,380px)_1fr] gap-4 items-start">
          <section className="cartao overflow-hidden" aria-label="Fila">
            <ul>
              {fila.map((c, i) => {
                const p = prazoTexto(c.submitted_at!)
                return (
                  <li key={c.id} className={i ? 'border-t border-regra' : ''}>
                    <button onClick={() => setSel(c.id)} aria-current={sel === c.id}
                      className={`w-full text-left px-4 py-3 flex items-center gap-3 transition-colors ${sel === c.id ? 'bg-ativo/70' : 'hover:bg-tom/60'}`}>
                      <Iniciais nome={c.patients?.full_name} />
                      <div className="flex-1 min-w-0">
                        <p className="text-corpo font-medium truncate">{limpo(c.patients?.full_name)}</p>
                        <p className={`text-meta ${p.vencido ? 'text-[#7c3f29]' : 'text-apoio'}`}>Enviado {dataBR(c.submitted_at!)} · {p.texto}</p>
                      </div>
                      {c.reaction && <Selo tom="risco">Reação</Selo>}
                    </button>
                  </li>
                )
              })}
            </ul>
          </section>
          {atual && (
            <section className="cartao" aria-labelledby="t-ck">
              <div className="px-5 pt-4 pb-3 flex items-center gap-3">
                <Iniciais nome={atual.patients?.full_name} className="w-10 h-10 text-[14px]" />
                <div className="flex-1 min-w-0">
                  <h2 id="t-ck" className="titulo-bloco">{limpo(atual.patients?.full_name)}</h2>
                  <p className="text-meta text-apoio">Check-in de {dataBR(atual.due_date)}, respondido {dataHora(atual.submitted_at!)}</p>
                </div>
                <Link to={`/painel/pacientes/${atual.patient_id}?aba=programa`} className="text-meta link">Abrir ficha</Link>
              </div>
              {atual.reaction && <div className="px-5 pb-2"><Aviso tipo="erro">Reação relatada. O alerta já está em Avaliar hoje para a médica.</Aviso></div>}
              <DetalheCheckin c={atual} />
              <div className="px-5 pb-5 flex flex-col gap-2 border-t border-regra pt-4">
                <label htmlFor="resp" className="text-corpo font-medium">Resposta para a paciente</label>
                <textarea id="resp" rows={4} value={resposta} onChange={e => setResposta(e.target.value)} disabled={!pode}
                  placeholder={pode ? 'Escreva com calma. A paciente recebe um aviso por e-mail.' : 'Você não tem permissão para responder check-ins.'} className="campo !h-auto py-2.5 leading-relaxed" />
                <div className="flex flex-wrap gap-2">
                  {['Obrigada pelo retorno. Seguimos com o protocolo.', 'Vamos conversar sobre isso no próximo encontro.', 'A Dra. Bartira vai te ligar hoje.'].map(t => (
                    <button key={t} onClick={() => setResposta(t)} disabled={!pode} className="h-8 px-3 rounded-full bg-tom text-meta text-texto hover:bg-ativo">{t}</button>
                  ))}
                </div>
                <Botao className="self-end mt-1" disabled={!pode || !resposta.trim()} onClick={responder}><Send className="w-4 h-4" />Responder e concluir</Botao>
              </div>
            </section>
          )}
        </div>
      )}
      {feitos.length > 0 && (
        <Bloco icone={<Icone tema="checkin" fundo tamanho={36} />} titulo="Respondidos recentemente" semPad>
          <ul className="pb-2">{feitos.map(c => (
            <li key={c.id} className="px-5 py-2.5 border-t border-regra flex items-center gap-3 text-corpo">
              <span className="w-2 h-2 rounded-full bg-oliva" /><span className="font-medium">{limpo(c.patients?.full_name)}</span>
              <span className="text-meta text-apoio flex-1 truncate">{c.reply}</span><span className="text-meta text-apoio tabular-nums">{dataBR(c.replied_at!)}</span>
            </li>))}
          </ul>
        </Bloco>
      )}
    </div>
  )
}

/** Agenda: encontros com data, por dia, e os que ainda precisam ser agendados. */
export function Agenda() {
  const [lista, setLista] = useState<Encontro[] | null>(null)
  useEffect(() => {
    supabase.from('encounters').select('*, patients(full_name)').in('status', ['agendado', 'previsto']).order('target_date')
      .then(({ data }) => setLista((data as Encontro[]) ?? []))
  }, [])
  const agendados = useMemo(() => (lista ?? []).filter(e => e.status === 'agendado' && e.scheduled_at).sort((a, b) => a.scheduled_at!.localeCompare(b.scheduled_at!)), [lista])
  const limite = new Date(Date.now() + 45 * 864e5).toISOString().slice(0, 10)
  const aAgendar = (lista ?? []).filter(e => e.status === 'previsto' && e.target_date <= limite)
  const porDia = useMemo(() => {
    const m = new Map<string, Encontro[]>()
    agendados.forEach(e => { const k = new Date(e.scheduled_at!).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' }); m.set(k, [...(m.get(k) ?? []), e]) })
    return [...m.entries()]
  }, [agendados])

  return (
    <div className="flex flex-col gap-6">
      <Titulo sub={lista ? `${agendados.length} agendados · ${aAgendar.length} para agendar nos próximos 45 dias` : undefined}>Encontros</Titulo>
      <div className="grid lg:grid-cols-12 gap-4 items-start">
        <Bloco className="lg:col-span-7" icone={<Icone tema="encontro" fundo tamanho={36} />} titulo="Agenda" sub="Encontros com data marcada" semPad>
          {!porDia.length ? <div className="px-5 pb-5"><Vazio titulo="Nada agendado" texto="Agende pelo bloco ao lado ou na aba Programa da paciente." /></div> : (
            <div className="pb-2">{porDia.map(([d, es]) => (
              <div key={d}>
                <p className="px-5 pt-3 pb-1 text-meta text-apoio first-letter:uppercase">{d}</p>
                <ul>{es.map(e => (
                  <li key={e.id}>
                    <Link to={`/painel/pacientes/${e.patient_id}?aba=programa`} className="px-5 py-2.5 flex items-center gap-3 hover:bg-tom/60">
                      <span className="w-12 text-corpo font-medium tabular-nums">{new Date(e.scheduled_at!).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                      <Iniciais nome={e.patients?.full_name} />
                      <div className="flex-1 min-w-0"><p className="text-corpo font-medium truncate">{limpo(e.patients?.full_name)}</p><p className="text-meta text-apoio">{e.title}{e.location ? ` · ${LOCAL[e.location]}` : ''}</p></div>
                    </Link>
                  </li>))}
                </ul>
              </div>))}
            </div>
          )}
        </Bloco>
        <Bloco className="lg:col-span-5" icone={<Icone tema="encontro" fundo tamanho={36} />} titulo="Para agendar" sub="Previstos pelo plano, ainda sem data" semPad>
          {!aAgendar.length ? <div className="px-5 pb-5"><Vazio titulo="Tudo em dia" /></div> : (
            <ul className="pb-2">{aAgendar.map(e => (
              <li key={e.id}>
                <Link to={`/painel/pacientes/${e.patient_id}?aba=programa`} className="px-5 py-2.5 flex items-center gap-3 hover:bg-tom/60">
                  <Iniciais nome={e.patients?.full_name} />
                  <div className="flex-1 min-w-0"><p className="text-corpo font-medium truncate">{limpo(e.patients?.full_name)}</p><p className="text-meta text-apoio">{e.title}</p></div>
                  <span className={`text-meta tabular-nums ${e.target_date < hojeISO() ? 'text-[#7c3f29]' : 'text-apoio'}`}>até {dataBR(e.target_date)}</span>
                </Link>
              </li>))}
            </ul>
          )}
        </Bloco>
      </div>
    </div>
  )
}

/** Biblioteca de vídeos da paciente. */
export function Videos() {
  const [lista, setLista] = useState<Video[]>([])
  const [novo, setNovo] = useState({ title: '', description: '', url: '', duration_min: '' })
  const carregar = () => supabase.from('videos').select('*').order('sort').then(({ data }) => setLista((data as Video[]) ?? []))
  useEffect(() => { carregar() }, [])
  async function salvar() {
    await supabase.from('videos').insert({ title: novo.title, description: novo.description || null, url: novo.url, duration_min: Number(novo.duration_min) || null, sort: lista.length + 1 })
    setNovo({ title: '', description: '', url: '', duration_min: '' }); carregar()
  }
  async function alternar(v: Video) { await supabase.from('videos').update({ active: !v.active }).eq('id', v.id); carregar() }

  return (
    <div className="flex flex-col gap-6">
      <Titulo sub="Os vídeos ativos aparecem no início do app da paciente. Aceita links do YouTube, Vimeo ou arquivo de vídeo.">Vídeos de orientação</Titulo>
      {lista.some(v => v.url.includes('exemplo.com')) && <Aviso>Os vídeos com endereço exemplo.com são de demonstração. Troque pelos links reais.</Aviso>}
      <div className="grid lg:grid-cols-12 gap-4 items-start">
        <Bloco className="lg:col-span-7" icone={<Icone tema="video" fundo tamanho={36} />} titulo="Biblioteca" sub={`${lista.filter(v => v.active).length} ativos`} semPad>
          <ul className="pb-2">{lista.map(v => (
            <li key={v.id} className={`px-5 py-3 border-t border-regra flex items-center gap-3 ${v.active ? '' : 'opacity-55'}`}>
              <div className="flex-1 min-w-0"><p className="text-corpo font-medium">{v.title}</p><p className="text-meta text-apoio truncate">{v.description}{v.duration_min ? ` · ${v.duration_min} min` : ''}</p></div>
              <a href={v.url} target="_blank" rel="noopener noreferrer" className="w-8 h-8 grid place-items-center rounded text-apoio hover:bg-tom" aria-label={`Abrir ${v.title}`}><ExternalLink className="w-4 h-4" /></a>
              <Botao tamanho="sm" variante="suave" onClick={() => alternar(v)}>{v.active ? 'Desativar' : 'Ativar'}</Botao>
            </li>))}
          </ul>
        </Bloco>
        <Bloco className="lg:col-span-5" icone={<Icone tema="video" fundo tamanho={36} />} titulo="Novo vídeo">
          <div className="flex flex-col gap-3">
            <Campo id="v-t" label="Título" value={novo.title} onChange={e => setNovo({ ...novo, title: e.target.value })} />
            <Campo id="v-u" label="Link" placeholder="https://youtube.com/..." value={novo.url} onChange={e => setNovo({ ...novo, url: e.target.value })} />
            <Campo id="v-d" label="Descrição curta" value={novo.description} onChange={e => setNovo({ ...novo, description: e.target.value })} />
            <Campo id="v-m" label="Duração em minutos" inputMode="numeric" value={novo.duration_min} onChange={e => setNovo({ ...novo, duration_min: e.target.value })} />
            <Botao onClick={salvar} disabled={!novo.title.trim() || !novo.url.trim()}><Plus className="w-4 h-4" />Adicionar</Botao>
          </div>
        </Bloco>
      </div>
    </div>
  )
}


/** Escolher uma paciente e abrir o app como ela, em modo leitura. */
export function VerComo() {
  const nav = useNavigate()
  const [lista, setLista] = useState<Array<{ id: string; full_name: string; email: string; user_id: string | null; status: string }> | null>(null)
  const [busca, setBusca] = useState('')
  useEffect(() => { supabase.from('patients').select('id, full_name, email, user_id, status').eq('status', 'ativa').order('full_name').then(({ data }) => setLista(data ?? [])) }, [])
  const filtrada = (lista ?? []).filter(p => `${p.full_name} ${p.email}`.toLowerCase().includes(busca.toLowerCase()))
  function abrir(p: { id: string; full_name: string; user_id: string | null }) {
    entrarVista({ pid: p.id, nome: limpo(p.full_name), userId: p.user_id }); nav('/app')
  }
  return (
    <div className="flex flex-col gap-6">
      <Titulo sub="Abre o app exatamente como a paciente vê: programa, check-ins, protocolo, evolução e questionários. Nada que você fizer lá é gravado no lugar dela.">Ver como paciente</Titulo>
      <div className="relative max-w-sm">
        <label htmlFor="vc-busca" className="sr-only">Buscar paciente</label>
        <input id="vc-busca" value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar por nome ou e-mail" className="campo" />
      </div>
      <section className="cartao overflow-hidden" aria-label="Pacientes ativas">
        {!lista ? <p className="p-5 text-corpo text-apoio">Carregando</p> : filtrada.length === 0 ? <div className="p-5"><Vazio titulo="Nenhuma paciente encontrada" /></div> : (
          <ul>{filtrada.map((p, i) => (
            <li key={p.id} className={`px-5 py-3 flex items-center gap-3 ${i ? 'border-t border-regra' : ''}`}>
              <Iniciais nome={p.full_name} />
              <div className="flex-1 min-w-0"><p className="text-corpo font-medium truncate">{p.full_name}</p><p className="text-meta text-apoio truncate">{p.user_id ? 'Já acessou o app' : 'Convite ainda não aceito'} · {p.email}</p></div>
              <Botao tamanho="sm" variante="linha" onClick={() => abrir(p)}><Eye className="w-4 h-4" />Ver como</Botao>
            </li>))}
          </ul>
        )}
      </section>
    </div>
  )
}
