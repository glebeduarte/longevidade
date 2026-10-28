import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { entrarVista } from '../../lib/vista'
import { Check, ChevronDown, ChevronUp, ExternalLink, Eye, ImagePlus, Pencil, Plus, Send, Trash2, Upload } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { Icone } from '../../components/icones'
import { can, useAuth } from '../../auth/AuthProvider'
import { Aviso, Bloco, Botao, Campo, Iniciais, Selo, Titulo, Vazio } from '../../components/ui'
import { dataBR } from '../../lib/faixas'
import { LOCAL, dataHora, hojeISO, prazoTexto, capa, type Checkin, type Encontro, type Video } from '../../lib/programa'
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

/** Biblioteca de vídeos da paciente: criar, editar, capa, ordem, ativar e excluir. */
type FormVideo = { id?: string; title: string; description: string; url: string; duration_min: string; thumbnail_url: string }
const VAZIO: FormVideo = { title: '', description: '', url: '', duration_min: '', thumbnail_url: '' }

async function enviarArquivo(arquivo: File, pasta: 'capas' | 'arquivos') {
  const ext = (arquivo.name.split('.').pop() || 'bin').toLowerCase()
  const caminho = `${pasta}/${crypto.randomUUID()}.${ext}`
  const { error } = await supabase.storage.from('videos').upload(caminho, arquivo, { contentType: arquivo.type, upsert: false })
  if (error) throw error
  return supabase.storage.from('videos').getPublicUrl(caminho).data.publicUrl
}

export function Videos() {
  const [lista, setLista] = useState<Video[]>([])
  const [form, setForm] = useState<FormVideo>(VAZIO)
  const [enviando, setEnviando] = useState<'' | 'capa' | 'video'>('')
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')
  const carregar = () => supabase.from('videos').select('*').order('sort').then(({ data }) => setLista((data as Video[]) ?? []))
  useEffect(() => { carregar() }, [])

  const editando = Boolean(form.id)
  const previa = capa({ url: form.url, thumbnail_url: form.thumbnail_url || null })

  function editar(v: Video) {
    setErro('')
    setForm({ id: v.id, title: v.title, description: v.description ?? '', url: v.url, duration_min: v.duration_min ? String(v.duration_min) : '', thumbnail_url: v.thumbnail_url ?? '' })
    document.getElementById('v-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  async function subir(arquivo: File | undefined, tipo: 'capa' | 'video') {
    if (!arquivo) return
    setErro(''); setEnviando(tipo)
    try {
      const url = await enviarArquivo(arquivo, tipo === 'capa' ? 'capas' : 'arquivos')
      setForm(f => tipo === 'capa' ? { ...f, thumbnail_url: url } : { ...f, url })
    } catch { setErro(tipo === 'capa' ? 'Não foi possível enviar a capa. Use JPG, PNG ou WebP.' : 'Não foi possível enviar o vídeo. Use MP4, WebM ou MOV com até 500 MB.') }
    setEnviando('')
  }

  async function salvar() {
    setSalvando(true); setErro('')
    const dados = { title: form.title.trim(), description: form.description.trim() || null, url: form.url.trim(), duration_min: Number(form.duration_min) || null, thumbnail_url: form.thumbnail_url.trim() || null, updated_at: new Date().toISOString() }
    const { error } = form.id
      ? await supabase.from('videos').update(dados).eq('id', form.id)
      : await supabase.from('videos').insert({ ...dados, sort: lista.length + 1 })
    setSalvando(false)
    if (error) { setErro('Não foi possível salvar. Tente de novo.'); return }
    setForm(VAZIO); carregar()
  }

  async function alternar(v: Video) { await supabase.from('videos').update({ active: !v.active }).eq('id', v.id); carregar() }

  async function mover(i: number, d: -1 | 1) {
    const nova = [...lista]
    ;[nova[i], nova[i + d]] = [nova[i + d], nova[i]]
    setLista(nova)
    await Promise.all(nova.map((v, k) => v.sort === k + 1 ? null : supabase.from('videos').update({ sort: k + 1 }).eq('id', v.id)))
    carregar()
  }

  async function excluir(v: Video) {
    if (!window.confirm(`Excluir o vídeo "${v.title}"? As pacientes deixam de ver na hora.`)) return
    await supabase.from('videos').delete().eq('id', v.id)
    if (form.id === v.id) setForm(VAZIO)
    carregar()
  }

  return (
    <div className="flex flex-col gap-6">
      <Titulo sub="Os vídeos ativos aparecem no início do app da paciente, com a capa. Aceita links do YouTube, Vimeo ou arquivo de vídeo enviado aqui.">Vídeos de orientação</Titulo>
      {lista.some(v => v.url.includes('exemplo.com')) && <Aviso>Os vídeos com endereço exemplo.com são de demonstração. Clique em Editar para trocar pelo link real e pela capa.</Aviso>}
      <div className="grid lg:grid-cols-12 gap-4 items-start">
        <Bloco className="lg:col-span-7" icone={<Icone tema="video" fundo tamanho={36} />} titulo="Biblioteca" sub={`${lista.filter(v => v.active).length} ativos de ${lista.length}`} semPad>
          {lista.length === 0 ? <div className="p-5"><Vazio titulo="Nenhum vídeo cadastrado" /></div> : (
          <ul className="pb-2">{lista.map((v, i) => {
            const c = capa(v)
            return (
            <li key={v.id} className={`px-5 py-3 border-t border-regra flex items-center gap-3 ${form.id === v.id ? 'bg-tom/60' : ''}`}>
              <div className={`w-20 aspect-video shrink-0 rounded overflow-hidden bg-tom grid place-items-center ${v.active ? '' : 'opacity-55'}`}>
                {c ? <img src={c} alt="" className="w-full h-full object-cover" /> : <Icone tema="video" tamanho={22} />}
              </div>
              <div className={`flex-1 min-w-0 ${v.active ? '' : 'opacity-55'}`}>
                <p className="text-corpo font-medium truncate">{v.title}</p>
                <p className="text-meta text-apoio truncate">{v.active ? '' : 'Desativado · '}{v.description}{v.duration_min ? ` · ${v.duration_min} min` : ''}</p>
              </div>
              <div className="flex flex-col">
                <button onClick={() => mover(i, -1)} disabled={i === 0} aria-label={`Subir ${v.title}`} className="w-7 h-6 grid place-items-center rounded text-apoio hover:bg-tom disabled:opacity-30"><ChevronUp className="w-4 h-4" /></button>
                <button onClick={() => mover(i, 1)} disabled={i === lista.length - 1} aria-label={`Descer ${v.title}`} className="w-7 h-6 grid place-items-center rounded text-apoio hover:bg-tom disabled:opacity-30"><ChevronDown className="w-4 h-4" /></button>
              </div>
              <a href={v.url} target="_blank" rel="noopener noreferrer" className="w-8 h-8 grid place-items-center rounded text-apoio hover:bg-tom" aria-label={`Abrir ${v.title}`}><ExternalLink className="w-4 h-4" /></a>
              <Botao tamanho="sm" variante="linha" onClick={() => editar(v)}><Pencil className="w-4 h-4" />Editar</Botao>
              <Botao tamanho="sm" variante="suave" onClick={() => alternar(v)}>{v.active ? 'Desativar' : 'Ativar'}</Botao>
              <button onClick={() => excluir(v)} aria-label={`Excluir ${v.title}`} className="w-8 h-8 grid place-items-center rounded text-apoio hover:bg-tom hover:text-terracota"><Trash2 className="w-4 h-4" /></button>
            </li>)
          })}
          </ul>)}
        </Bloco>

        <Bloco id="v-form" className="lg:col-span-5 lg:sticky lg:top-4" icone={<Icone tema="video" fundo tamanho={36} />} titulo={editando ? 'Editar vídeo' : 'Novo vídeo'}>
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <span className="text-corpo font-medium">Capa</span>
              <div className="aspect-video rounded-lg overflow-hidden bg-tom grid place-items-center border border-regra">
                {previa ? <img src={previa} alt="Prévia da capa" className="w-full h-full object-cover" /> : <span className="text-meta text-apoio px-6 text-center">Sem capa. Envie uma imagem ou use um link do YouTube, que traz a capa do próprio vídeo.</span>}
              </div>
              <div className="flex flex-wrap gap-2">
                <label className="inline-flex items-center gap-2 h-9 px-3.5 rounded border border-borda text-[13px] font-medium cursor-pointer hover:bg-tom">
                  <ImagePlus className="w-4 h-4" />{enviando === 'capa' ? 'Enviando' : form.thumbnail_url ? 'Trocar capa' : 'Enviar capa'}
                  <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" disabled={!!enviando} onChange={e => { subir(e.target.files?.[0], 'capa'); e.target.value = '' }} />
                </label>
                {form.thumbnail_url && <Botao tamanho="sm" variante="texto" onClick={() => setForm({ ...form, thumbnail_url: '' })}>Remover capa</Botao>}
              </div>
              <p className="text-meta text-apoio">Formato horizontal 16:9, por exemplo 1280 × 720.</p>
            </div>
            <Campo id="v-t" label="Título" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
            <Campo id="v-u" label="Link do vídeo" placeholder="https://youtube.com/..." value={form.url} onChange={e => setForm({ ...form, url: e.target.value })} />
            <label className="self-start inline-flex items-center gap-2 h-9 px-3.5 rounded border border-borda text-[13px] font-medium cursor-pointer hover:bg-tom">
              <Upload className="w-4 h-4" />{enviando === 'video' ? 'Enviando o vídeo' : 'Ou enviar arquivo de vídeo'}
              <input type="file" accept="video/mp4,video/webm,video/quicktime" className="sr-only" disabled={!!enviando} onChange={e => { subir(e.target.files?.[0], 'video'); e.target.value = '' }} />
            </label>
            <Campo id="v-d" label="Descrição curta" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
            <Campo id="v-m" label="Duração em minutos" inputMode="numeric" value={form.duration_min} onChange={e => setForm({ ...form, duration_min: e.target.value.replace(/\D/g, '') })} />
            {erro && <p className="text-meta text-terracota">{erro}</p>}
            <div className="flex gap-2">
              <Botao onClick={salvar} disabled={salvando || !!enviando || !form.title.trim() || !form.url.trim()}>{editando ? <><Check className="w-4 h-4" />Salvar alterações</> : <><Plus className="w-4 h-4" />Adicionar</>}</Botao>
              {editando && <Botao variante="suave" onClick={() => { setForm(VAZIO); setErro('') }}>Cancelar</Botao>}
            </div>
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
