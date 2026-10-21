import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Check, LogOut, X } from 'lucide-react'
import { useAuth } from '../../auth/AuthProvider'
import { supabase } from '../../lib/supabase'
import { Aviso, Borboleta, Botao } from '../../components/ui'
import { usePendentes } from './questionarios'
import { dataBR } from '../../lib/faixas'
import { fmt, type Medida } from '../../lib/clinica'
import {
  ADESAO, LOCAL, SINTOMAS, dataHora, dataLonga, embed, hojeISO, mesDoPrograma,
  type Checkin, type Encontro, type Matricula, type Protocolo, type RespostasCheckin, type Video,
} from '../../lib/programa'
import { ListaProtocolo } from '../painel/programa'
import { COR, Icone, Rosto, type Tema } from '../../components/icones'
const TEMA_SINTOMA: Record<string, Tema> = { fogachos: 'fogacho', sono: 'sono', humor: 'humor', energia: 'metabolismo' }
const CORES_VIDEO = [COR.humor[0], COR.alimentacao[0], COR.video[0], COR.sono[0]]
import { RelatorioMapa } from '../painel/mapa'
import type { Relatorio } from '../../lib/mapa'
import { daPaciente, useVista } from '../../lib/vista'

function saudacao() {
  const h = new Date().getHours()
  return h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite'
}

/** Dados do programa da paciente logada (o banco só devolve os dela). */
function usePrograma() {
  const [m, setM] = useState<Matricula | null | undefined>(undefined)
  const [encontros, setEncontros] = useState<Encontro[]>([])
  const [checkins, setCheckins] = useState<Checkin[]>([])
  const carregar = () => {
    daPaciente(supabase.from('enrollments').select('*, programs(*)').eq('status', 'ativa')).order('start_date', { ascending: false }).limit(1).maybeSingle()
      .then(({ data }) => setM((data as Matricula) ?? null))
    daPaciente(supabase.from('encounters').select('*')).order('target_date').then(({ data }) => setEncontros((data as Encontro[]) ?? []))
    daPaciente(supabase.from('checkins').select('*')).order('due_date').then(({ data }) => setCheckins((data as Checkin[]) ?? []))
  }
  useEffect(carregar, [])
  const hoje = hojeISO()
  const aberto = checkins.find(c => c.status === 'aberto' && c.due_date <= hoje) ?? null
  const proximoCheckin = checkins.find(c => c.status === 'aberto' && c.due_date > hoje) ?? null
  const proximo = encontros.find(e => e.status === 'agendado' && e.scheduled_at && e.scheduled_at >= new Date().toISOString())
    ?? encontros.find(e => e.status === 'previsto' && e.target_date >= hoje) ?? null
  return { m, encontros, checkins, aberto, proximoCheckin, proximo, carregar }
}

export function Inicio() {
  const { profile, signOut } = useAuth()
  const vista = useVista()
  const pend = usePendentes()
  const { m, aberto, proximoCheckin, proximo } = usePrograma()
  const [videos, setVideos] = useState<Video[]>([])
  const [tocando, setTocando] = useState<Video | null>(null)
  const trilho = useRef<HTMLDivElement>(null)
  useEffect(() => { supabase.from('videos').select('*').eq('active', true).order('sort').then(({ data }) => setVideos((data as Video[]) ?? [])) }, [])

  const nome = (vista ? vista.nome : profile?.full_name)?.split(' ')[0]
  const prog = m ? mesDoPrograma(m) : null

  return (
    <div className="px-4 pt-6 flex flex-col gap-5">
      <header>
        <h1 className="titulo-pagina !text-[30px]">{saudacao()}{nome ? `, ${nome}` : ''}.</h1>
        <p className="mt-1 text-corpo text-apoio first-letter:uppercase">{new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
      </header>

      <section className="relative overflow-hidden rounded-xl bg-cafe text-creme p-5">
        <Borboleta className="absolute -right-10 -top-6 w-48 h-36 text-areia/[0.1]" />
        <div className="relative flex flex-col gap-4">
          <p className="text-corpo text-areia">{m?.programs?.name ?? 'Programa Longevidade'}</p>
          {m && prog ? (
            <>
              <p className="text-[30px] leading-none tabular-nums">Mês {prog.mes} <span className="text-areia/80 text-bloco">de {prog.total}</span></p>
              <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${prog.total}, minmax(0, 1fr))` }} aria-hidden="true">
                {Array.from({ length: prog.total }, (_, i) => <span key={i} className={`h-1.5 rounded-full ${i < prog.mes ? 'bg-areia' : 'bg-areia/20'}`} />)}
              </div>
              <p className="text-corpo text-areia/90">Até {dataLonga(m.end_date)}</p>
            </>
          ) : m === null ? (
            <p className="font-display text-[24px] leading-tight">Seu acompanhamento começa no primeiro encontro.</p>
          ) : <p className="text-corpo text-areia">Carregando</p>}
        </div>
      </section>

      <div className="cartao divide-y divide-regra overflow-hidden">
        {aberto && <Atalho to="/app/checkin" destaque icone={<Icone tema="checkin" fundo tamanho={44} />} titulo="Seu check-in está aberto" texto="Dois minutos para contar como você está" />}
        {!!pend?.length && <Atalho to="/app/questionarios" destaque icone={<Icone tema="questionario" fundo tamanho={44} />} titulo={`${pend.length} questionário${pend.length > 1 ? 's' : ''} para responder`} texto="Leva poucos minutos e prepara seu encontro" />}
        {!aberto && <Atalho to="/app/checkin" icone={<Icone tema="checkin" fundo tamanho={44} />} titulo="Check-in" texto={proximoCheckin ? `Próximo em ${dataLonga(proximoCheckin.due_date)}` : 'Nenhum pendente agora'} />}
        <Atalho to="/app/protocolo" icone={<Icone tema="protocolo" fundo tamanho={44} />} titulo="Meu protocolo" texto="Tudo o que foi orientado no encontro" />
        <div className="px-4 py-3.5 flex items-center gap-3.5 min-h-[72px]">
          <Icone tema="encontro" fundo tamanho={44} />
          <div className="flex-1">
            <p className="text-corpo font-medium">Próximo encontro</p>
            <p className="text-meta text-apoio">
              {proximo ? (proximo.scheduled_at ? `${dataHora(proximo.scheduled_at)}${proximo.location ? ` · ${LOCAL[proximo.location]}` : ''}` : `Previsto para ${dataLonga(proximo.target_date)}. A clínica vai confirmar o horário.`) : 'A confirmar com a clínica'}
            </p>
          </div>
        </div>
      </div>

      {videos.length > 0 && (
        <section className="flex flex-col gap-3" aria-labelledby="t-videos">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 id="t-videos" className="titulo-bloco">Vídeos para lembrar</h2>
              <span className="text-meta text-apoio">{videos.length} vídeos curtos</span>
            </div>
            {videos.length > 1 && (
              <div className="flex gap-2">
                <button aria-label="Vídeos anteriores" onClick={() => trilho.current?.scrollBy({ left: -200, behavior: 'smooth' })} className="w-12 h-12 rounded-full border border-borda bg-folha grid place-items-center hover:bg-tom"><ArrowLeft className="w-5 h-5" /></button>
                <button aria-label="Próximos vídeos" onClick={() => trilho.current?.scrollBy({ left: 200, behavior: 'smooth' })} className="w-12 h-12 rounded-full border border-borda bg-folha grid place-items-center hover:bg-tom"><ArrowRight className="w-5 h-5" /></button>
              </div>
            )}
          </div>
          <div ref={trilho} className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory scroll-smooth touch-pan-x">
            {videos.map((v, i) => (
              <button key={v.id} onClick={() => setTocando(v)} style={{ background: CORES_VIDEO[i % CORES_VIDEO.length] }} className="snap-start shrink-0 w-44 aspect-[4/5] max-w-full rounded-xl p-4 flex flex-col justify-between text-left hover:brightness-[.97] active:scale-[.99] transition">
                <Icone tema="video" fundo tamanho={44} />
                <span><span className="block text-bloco font-medium leading-snug">{v.title}</span>{v.duration_min && <span className="block text-meta text-apoio mt-1">{v.duration_min} min</span>}</span>
              </button>
            ))}
          </div>
        </section>
      )}

      {tocando && <Player v={tocando} aoFechar={() => setTocando(null)} />}

      {!vista && <button onClick={signOut} className="self-start inline-flex items-center gap-2 text-corpo text-apoio hover:text-texto"><LogOut className="w-4 h-4" />Sair</button>}
    </div>
  )
}

function Player({ v, aoFechar }: { v: Video; aoFechar: () => void }) {
  const src = embed(v.url)
  return (
    <div className="fixed inset-0 z-50 bg-texto/80 flex flex-col justify-center p-4" role="dialog" aria-modal="true" aria-label={v.title}>
      <div className="max-w-2xl w-full mx-auto bg-fundo rounded-xl overflow-hidden">
        <div className="flex items-start gap-3 px-4 pt-4 pb-3">
          <div className="flex-1"><p className="titulo-bloco">{v.title}</p>{v.description && <p className="text-meta text-apoio mt-0.5">{v.description}</p>}</div>
          <button onClick={aoFechar} aria-label="Fechar" className="w-10 h-10 -mr-2 -mt-1 grid place-items-center rounded hover:bg-tom"><X className="w-5 h-5" /></button>
        </div>
        <div className="aspect-video bg-texto">
          {src ? <iframe src={src} title={v.title} className="w-full h-full" allow="autoplay; fullscreen; picture-in-picture" allowFullScreen />
            : /\.(mp4|webm|mov)(\?|$)/i.test(v.url) ? <video src={v.url} controls className="w-full h-full" />
            : <div className="w-full h-full grid place-items-center p-6 text-center"><a href={v.url} target="_blank" rel="noopener noreferrer" className="text-creme underline underline-offset-4">Abrir o vídeo</a></div>}
        </div>
      </div>
    </div>
  )
}

function Atalho({ to, icone, titulo, texto, destaque }: { to: string; icone: ReactNode; titulo: string; texto: string; destaque?: boolean }) {
  return (
    <Link to={to} className={`group px-4 py-3.5 flex items-center gap-3.5 min-h-[72px] transition-colors ${destaque ? 'bg-[#fbf0e9] hover:bg-[#f7e6db]' : 'hover:bg-tom/60'}`}>
      {icone}
      <div className="flex-1 min-w-0"><p className={`text-corpo font-medium ${destaque ? 'text-[#7c3f29]' : ''}`}>{titulo}</p><p className="text-meta text-apoio truncate">{texto}</p></div>
      <ArrowRight className="w-4 h-4 text-apoio group-hover:translate-x-0.5 transition-transform" strokeWidth={1.6} />
    </Link>
  )
}

function Cabecalho({ titulo, sub }: { titulo: string; sub?: string }) {
  return (
    <header>
      <h1 className="titulo-pagina !text-[30px]">{titulo}</h1>
      {sub && <p className="mt-1.5 text-corpo text-apoio leading-relaxed">{sub}</p>}
    </header>
  )
}

const CHAVE_RASCUNHO = 'longevidade:rascunho-checkin'

/** Check-in da paciente: 4 escalas, adesão, reação e recado. */
export function CheckinPaciente() {
  const { aberto, proximoCheckin, checkins, carregar } = usePrograma()
  const [a, setA] = useState<RespostasCheckin>({ adesao: undefined, reacao: false })
  const [fase, setFase] = useState<'form' | 'enviando' | 'ok' | 'erro'>('form')
  const [erro, setErro] = useState('')
  useEffect(() => { try { const r = localStorage.getItem(CHAVE_RASCUNHO); if (r) setA(JSON.parse(r)) } catch { /* sem rascunho */ } }, [])
  useEffect(() => { try { localStorage.setItem(CHAVE_RASCUNHO, JSON.stringify(a)) } catch { /* sem armazenamento */ } }, [a])
  const historico = checkins.filter(c => c.status === 'respondido' || c.status === 'atendido').reverse().slice(0, 6)
  const completo = SINTOMAS.every(([k]) => a[k] != null) && a.adesao && (!a.reacao || (a.reacao_texto ?? '').trim())

  const vista = useVista()
  async function enviar() {
    setFase('enviando')
    const { error } = await supabase.rpc('salvar_checkin', { cid: aberto?.id ?? null, p_answers: a, pid: vista?.pid ?? null })
    if (error) { setErro(error.message); return setFase('erro') }
    try { localStorage.removeItem(CHAVE_RASCUNHO) } catch { /* sem armazenamento */ }
    setFase('ok'); carregar()
  }

  if (fase === 'ok') {
    return (
      <div className="px-4 pt-8 flex flex-col gap-4 items-start">
        <Check className="w-7 h-7 text-oliva" />
        <h1 className="titulo-pagina !text-[28px] leading-tight">Check-in enviado</h1>
        <p className="text-corpo text-apoio">{a.reacao ? 'Você relatou um efeito diferente. A Dra. Bartira foi avisada e a equipe entra em contato hoje.' : 'A equipe responde em até 3 dias úteis. A resposta aparece aqui e no seu e-mail.'}</p>
        <Link to="/app"><Botao>Voltar ao início</Botao></Link>
      </div>
    )
  }

  return (
    <div className="px-4 pt-6 flex flex-col gap-5">
      <Cabecalho titulo="Check-in" sub={aberto ? `Como você esteve nos últimos dias? Referente a ${dataLonga(aberto.due_date)}.` : `Conte como você está hoje.${proximoCheckin ? ` O próximo agendado abre em ${dataLonga(proximoCheckin.due_date)}.` : ''}`} />

      {(
        <div className="flex flex-col gap-4">
          {SINTOMAS.map(([k, rotulo, min, max]) => {
            const tema = TEMA_SINTOMA[k as string], [claro, forte] = COR[tema], v = a[k] as number | undefined
            return (
              <fieldset key={k} className="cartao p-4">
                <legend className="sr-only">{rotulo}</legend>
                <div className="flex items-center gap-3">
                  <Icone tema={tema} fundo tamanho={44} />
                  <p className="titulo-bloco flex-1">{rotulo}</p>
                  {v != null && <span className="flex items-center gap-2"><span className="text-corpo tabular-nums">{v} de 10</span><Rosto valor={v} inverso={k === 'fogachos'} tamanho={32} /></span>}
                </div>
                <div className="mt-3 grid grid-cols-6 sm:grid-cols-11 gap-1.5" role="radiogroup" aria-label={rotulo}>
                  {Array.from({ length: 11 }, (_, n) => (
                    <button key={n} role="radio" aria-checked={v === n} aria-label={`${n} de 10`} onClick={() => setA({ ...a, [k]: n })}
                      style={v === n ? { background: forte, color: '#fffdfa' } : { background: claro }}
                      className="h-12 rounded-lg text-[17px] font-medium tabular-nums transition active:scale-95 text-texto">{n}</button>
                  ))}
                </div>
                <div className="mt-2 flex justify-between text-meta text-apoio"><span>0 · {min}</span><span>{max} · 10</span></div>
              </fieldset>
            )
          })}

          <fieldset className="cartao p-4 flex flex-col gap-2">
            <legend className="text-bloco font-medium float-left w-full mb-2">Conseguiu seguir o protocolo?</legend>
            {(['sim', 'parcial', 'nao'] as const).map(k => (
              <button key={k} role="radio" aria-checked={a.adesao === k} onClick={() => setA({ ...a, adesao: k })}
                className={`text-left min-h-[48px] px-4 rounded-lg border text-[15px] ${a.adesao === k ? 'bg-cafe text-creme border-cafe' : 'bg-folha border-borda'}`}>{ADESAO[k]}</button>
            ))}
          </fieldset>

          <fieldset className="cartao p-4 flex flex-col gap-3">
            <legend className="text-bloco font-medium float-left w-full">Sentiu algum efeito diferente desde que começou ou mudou o protocolo?</legend>
            <p className="text-meta text-apoio">Por exemplo sangramento, dor nas mamas, inchaço, dor de cabeça forte, falta de ar.</p>
            <div className="grid grid-cols-2 gap-2">
              {[false, true].map(v => (
                <button key={String(v)} role="radio" aria-checked={a.reacao === v} onClick={() => setA({ ...a, reacao: v })}
                  className={`min-h-[48px] rounded-lg border text-[15px] ${a.reacao === v ? 'bg-cafe text-creme border-cafe' : 'bg-folha border-borda'}`}>{v ? 'Sim' : 'Não'}</button>
              ))}
            </div>
            {a.reacao && (<>
              <label htmlFor="rx" className="text-corpo font-medium">O que você sentiu e desde quando?</label>
              <textarea id="rx" rows={3} value={a.reacao_texto ?? ''} onChange={e => setA({ ...a, reacao_texto: e.target.value })} className="campo !h-auto py-2.5 text-[15px]" />
              <Aviso tipo="erro">Se for algo forte ou que não melhora, procure atendimento agora. Emergência: SAMU 192.</Aviso>
            </>)}
          </fieldset>

          <div className="cartao p-4 flex flex-col gap-3">
            <label htmlFor="peso" className="text-bloco font-medium">Peso em casa <span className="text-corpo text-apoio font-normal">(opcional)</span></label>
            <input id="peso" inputMode="decimal" placeholder="kg" value={a.peso ?? ''} onChange={e => setA({ ...a, peso: e.target.value ? Number(e.target.value.replace(',', '.')) : null })} className="campo text-[15px] w-40" />
            <label htmlFor="msg" className="text-bloco font-medium mt-1">Quer contar algo para a equipe?</label>
            <textarea id="msg" rows={3} value={a.mensagem ?? ''} onChange={e => setA({ ...a, mensagem: e.target.value })} className="campo !h-auto py-2.5 text-[15px]" />
          </div>

          {fase === 'erro' && <Aviso tipo="erro">Não foi possível salvar{erro ? ` (${erro})` : ''}. Suas respostas continuam guardadas neste aparelho, tente de novo.</Aviso>}
          {vista && <Aviso>Modo visualização: ao salvar, o check-in fica registrado na ficha desta paciente.</Aviso>}
          {!completo && <p className="text-meta text-apoio">Responda as notas e a pergunta do protocolo para liberar o botão.</p>}
          <Botao className="w-full !h-12" disabled={!completo || fase === 'enviando'} onClick={enviar}>{fase === 'enviando' ? 'Salvando' : 'Salvar check-in'}</Botao>
        </div>
      )}

      {historico.length > 0 && (
        <section className="flex flex-col gap-3" aria-labelledby="t-hist">
          <h2 id="t-hist" className="titulo-bloco">Check-ins anteriores</h2>
          <ul className="cartao divide-y divide-regra overflow-hidden">
            {historico.map(c => (
              <li key={c.id} className="px-4 py-3">
                <div className="flex items-baseline justify-between"><p className="text-corpo font-medium">{dataLonga(c.due_date)}</p><p className="text-meta text-apoio">{c.status === 'atendido' ? 'Respondido' : 'Aguardando resposta'}</p></div>
                {c.answers?.mensagem && <p className="text-meta text-apoio mt-0.5">Você: {c.answers.mensagem}</p>}
                {c.reply && <p className="text-corpo mt-2 pl-3 border-l-2 border-cobre">{c.reply}</p>}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}

export function MeuProtocolo() {
  const [lista, setLista] = useState<Protocolo[] | null>(null)
  const [ver, setVer] = useState(false)
  useEffect(() => { daPaciente(supabase.from('protocols').select('*')).not('published_at', 'is', null).order('version', { ascending: false }).then(({ data }) => setLista((data as Protocolo[]) ?? [])) }, [])
  const [atual, ...antigos] = lista ?? []
  return (
    <div className="px-4 pt-6 flex flex-col gap-5">
      <Cabecalho titulo="Meu protocolo" sub={atual ? `Versão ${atual.version}, atualizada em ${dataLonga(atual.published_at!)}.` : undefined} />
      {lista === null ? <p className="text-corpo text-apoio">Carregando</p> : !atual ? (
        <div className="cartao p-6 text-center flex flex-col items-center gap-2"><Borboleta className="w-10 h-7 text-cobre" /><p className="text-corpo text-apoio">Seu protocolo aparece aqui depois do primeiro encontro.</p></div>
      ) : (<>
        {atual.intro && <p className="text-[16px] leading-relaxed">{atual.intro}</p>}
        <ListaProtocolo itens={atual.items} />
        <p className="text-meta text-apoio">Dúvidas sobre o protocolo? Use o check-in para falar com a equipe.</p>
        {antigos.length > 0 && (
          <section className="flex flex-col gap-2">
            <button onClick={() => setVer(!ver)} className="self-start text-corpo link">{ver ? 'Ocultar versões anteriores' : `Ver versões anteriores (${antigos.length})`}</button>
            {ver && antigos.map(p => (
              <div key={p.id} className="cartao p-4 flex flex-col gap-2 opacity-80">
                <p className="text-corpo font-medium">Versão {p.version} · {dataBR(p.published_at!)}</p>
                {p.intro && <p className="text-meta text-apoio">{p.intro}</p>}
                <ul className="text-corpo">{p.items.map((i, k) => <li key={k}>· {i.titulo}</li>)}</ul>
              </div>
            ))}
          </section>
        )}
      </>)}
    </div>
  )
}

/** Gráfico de linha simples, um valor por data. */
function Linha({ pontos, unidade, cor = COR.evolucao }: { pontos: Array<{ d: string; v: number }>; unidade: string; cor?: [string, string] }) {
  if (pontos.length < 2) return <p className="text-meta text-apoio">{pontos.length ? `${fmt(pontos[0].v)} ${unidade} em ${dataBR(pontos[0].d)}. O gráfico aparece a partir da segunda medida.` : 'Sem medidas ainda.'}</p>
  const W = 320, H = 110, P = 10
  const vs = pontos.map(p => p.v), min = Math.min(...vs), max = Math.max(...vs), r = max - min || 1
  const t0 = new Date(pontos[0].d).getTime(), t1 = new Date(pontos[pontos.length - 1].d).getTime(), rt = t1 - t0 || 1
  const xy = pontos.map(p => [P + ((new Date(p.d).getTime() - t0) / rt) * (W - 2 * P), P + (1 - (p.v - min) / r) * (H - 2 * P)])
  const [ux] = xy[xy.length - 1]
  return (
    <svg viewBox={`0 0 ${W} ${H + 18}`} className="w-full" role="img" aria-label={`De ${fmt(pontos[0].v)} para ${fmt(pontos[pontos.length - 1].v)} ${unidade}`}>
      <line x1={P} x2={W - P} y1={H - P} y2={H - P} stroke="#e6ddd1" />
      <polygon points={`${xy[0][0]},${H - P} ${xy.map(p => p.join(',')).join(' ')} ${ux},${H - P}`} fill={cor[0]} opacity=".7" />
      <polyline points={xy.map(p => p.join(',')).join(' ')} fill="none" stroke={cor[1]} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
      {xy.map(([x, y], i) => <circle key={i} cx={x} cy={y} r={i === xy.length - 1 ? 5 : 3.5} fill={i === xy.length - 1 ? cor[1] : '#fffdfa'} stroke={cor[1]} strokeWidth="2" />)}
      <text x={P} y={H + 14} fontSize="13" fill="#5c4c40" fontFamily="Jost">{dataBR(pontos[0].d)}</text>
      <text x={W - P} y={H + 14} fontSize="13" fill="#5c4c40" fontFamily="Jost" textAnchor="end">{dataBR(pontos[pontos.length - 1].d)}</text>
    </svg>
  )
}

export function Evolucao() {
  const [med, setMed] = useState<Medida[]>([])
  const [mapas, setMapas] = useState<Array<{ id: string; finished_at: string; snapshot: Relatorio; recommendations: Record<string, string>; summary: string | null }>>([])
  const [ver, setVer] = useState<string | null>(null)
  const { encontros } = usePrograma()
  useEffect(() => {
    daPaciente(supabase.from('measurements').select('id, code, value, measured_at, note')).in('code', ['peso', 'cintura', 'pgc', 'pas']).order('measured_at').then(({ data }) => setMed((data as Medida[]) ?? []))
    daPaciente(supabase.from('health_maps').select('id, finished_at, snapshot, recommendations, summary')).eq('status', 'finalizado').order('finished_at', { ascending: false })
      .then(({ data }) => setMapas((data as never[]) ?? []))
  }, [])
  const serie = useMemo(() => (code: string) => med.filter(m => m.code === code).map(m => ({ d: m.measured_at, v: Number(m.value) })), [med])
  const mapa = mapas.find(m => m.id === ver)

  if (mapa) {
    return (
      <div className="px-4 pt-6 flex flex-col gap-4">
        <button onClick={() => setVer(null)} className="self-start inline-flex items-center gap-1.5 text-corpo text-apoio"><ArrowLeft className="w-4 h-4" />Minha evolução</button>
        <RelatorioMapa r={mapa.snapshot} recomendacoes={mapa.recommendations} resumo={mapa.summary} />
      </div>
    )
  }

  const cards: Array<[string, string, string, Tema]> = [['peso', 'Peso', 'kg', 'peso'], ['cintura', 'Cintura', 'cm', 'cintura'], ['pgc', 'Gordura corporal', '%', 'gordura'], ['pas', 'Pressão sistólica', 'mmHg', 'coracao']]
  return (
    <div className="px-4 pt-6 flex flex-col gap-5">
      <Cabecalho titulo="Minha evolução" sub="Suas medidas ao longo do programa. Cada encontro acrescenta um ponto." />
      {mapas.length > 0 && (
        <section className="cartao divide-y divide-regra overflow-hidden" aria-label="Mapas da saúde">
          {mapas.map(m => (
            <button key={m.id} onClick={() => setVer(m.id)} className="w-full text-left px-4 py-3.5 flex items-center gap-3.5 hover:bg-tom/60">
              <Icone tema="evolucao" fundo tamanho={44} />
              <div className="flex-1"><p className="text-corpo font-medium">Mapa da Saúde de {dataLonga(m.finished_at.slice(0, 10))}</p><p className="text-meta text-apoio">Nota {m.snapshot?.nota ?? '·'} de 100 · revisado pela Dra. Bartira</p></div>
              <ArrowRight className="w-4 h-4 text-apoio" />
            </button>
          ))}
        </section>
      )}
      <div className="grid gap-3">
        {cards.map(([code, nome, un, tema]) => {
          const s = serie(code), u = s[s.length - 1], p = s[0]
          return (
            <section key={code} className="cartao p-4" aria-label={nome}>
              <div className="flex items-center justify-between gap-3">
                <Icone tema={tema} fundo tamanho={44} />
                <p className="titulo-bloco flex-1">{nome}</p>
                {u && <p className="text-[26px] tabular-nums leading-none">{fmt(u.v)}<span className="text-meta text-apoio ml-1">{un}</span></p>}
              </div>
              {u && p && s.length > 1 && <p className="text-meta text-apoio mt-1">{u.v - p.v > 0 ? '+' : ''}{fmt(u.v - p.v)} {un} desde {dataBR(p.d)}</p>}
              <div className="mt-3"><Linha pontos={s} unidade={un} cor={COR[tema]} /></div>
            </section>
          )
        })}
      </div>
      {encontros.length > 0 && (
        <section className="flex flex-col gap-3" aria-labelledby="t-enc">
          <h2 id="t-enc" className="titulo-bloco">Seus encontros</h2>
          <ol className="cartao divide-y divide-regra overflow-hidden">
            {encontros.filter(e => e.status !== 'cancelado').map(e => (
              <li key={e.id} className="px-4 py-3 flex items-center gap-3">
                <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${e.status === 'realizado' ? 'bg-oliva' : e.status === 'agendado' ? 'bg-cafe' : 'border border-controle'}`} />
                <div className="flex-1"><p className="text-corpo font-medium">{e.title}</p>
                  <p className="text-meta text-apoio">{e.status === 'realizado' ? `Realizado em ${dataBR(e.done_at ?? e.target_date)}` : e.scheduled_at ? dataHora(e.scheduled_at) : `Previsto para ${dataLonga(e.target_date)}`}</p></div>
              </li>
            ))}
          </ol>
        </section>
      )}
    </div>
  )
}

export function EmBreve({ titulo, texto }: { titulo: string; texto: string }) {
  return (
    <div className="px-4 pt-6 flex flex-col gap-5">
      <h1 className="titulo-pagina !text-[30px]">{titulo}</h1>
      <div className="cartao p-6 flex flex-col items-center text-center gap-3">
        <Borboleta className="w-10 h-7 text-cobre" />
        <p className="text-corpo text-apoio">{texto}</p>
      </div>
    </div>
  )
}
