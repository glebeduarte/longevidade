import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Link, NavLink, Outlet, useLocation, useParams } from 'react-router-dom'
import { ArrowRight, Clock, MapPin, Menu, MessageCircle, X } from 'lucide-react'
import { useAuth } from '../../auth/AuthProvider'
import {
  APP_PACIENTE, CONTATO, FASES, INICIO, LOCAIS, NAV, PERGUNTAS, PLANOS, ROTEIRO, ROTEIRO_FIM, SOBRE, TEMAS, linkAgendar,
} from '../../lib/site'
import { CartaoMaterial, useMateriais } from './material'

/* As pranchas de Maria Sibylla Merian (1705): a metamorfose que dá nome à marca. */
const PRANCHAS = {
  lagarta: { src: '/site/merian-3.jpg', legenda: 'Lagarta, casulo e mariposa. Maria Sibylla Merian, 1705.' },
  folhas: { src: '/site/merian-1.jpg', legenda: 'Metamorfose da Arsenura armida. Maria Sibylla Merian, 1705.' },
  voo: { src: '/site/merian-2.jpg', legenda: 'Borboletas sobre a romã. Maria Sibylla Merian, 1705.' },
  pimenta: { src: '/site/merian-4.jpg', legenda: 'Pimenteira com borboleta, crisálida e lagarta. Maria Sibylla Merian, c. 1702.' },
}

const VIDEO = { src: '/site/metamorfose.jpg', video: '/site/metamorfose.mp4', legenda: 'Uma monarca deixa a crisálida. Vídeo de Danmation, CC BY 3.0.' }

function usePagina(titulo: string, descricao: string) {
  useEffect(() => {
    document.title = titulo ? `${titulo} · Dra. Bartira Rebouças` : 'Dra. Bartira Rebouças · Endocrinologista em Natal'
    let m = document.querySelector('meta[name="description"]')
    if (!m) { m = document.createElement('meta'); m.setAttribute('name', 'description'); document.head.appendChild(m) }
    m.setAttribute('content', descricao)
  }, [titulo, descricao])
}

/** Entrada escalonada: cada bloco .rv ganha .vis ao entrar na tela (uma vez). */
function useRevelar(chave: string) {
  useEffect(() => {
    if (!('IntersectionObserver' in window)) { document.querySelectorAll('.rv').forEach(e => e.classList.add('vis')); return }
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('vis'); io.unobserve(e.target) } }), { rootMargin: '0px 0px -10% 0px' })
    const olhar = () => document.querySelectorAll('.rv:not(.vis)').forEach(e => io.observe(e))
    olhar()
    const mo = new MutationObserver(olhar)
    mo.observe(document.body, { childList: true, subtree: true })
    return () => { io.disconnect(); mo.disconnect() }
  }, [chave])
}

const externo = (href: string) => href.startsWith('http')
function Agendar({ claro = false, rotulo = 'Agendar consulta', className = '' }: { claro?: boolean; rotulo?: string; className?: string }) {
  const href = linkAgendar(), cls = `site-btn ${claro ? 'site-btn-claro' : ''} ${className}`
  return externo(href)
    ? <a href={href} target="_blank" rel="noreferrer" className={cls}><MessageCircle className="w-4 h-4" />{rotulo}</a>
    : <Link to={href} className={cls}>{rotulo}<ArrowRight className="w-4 h-4" /></Link>
}

// ---------- Layout ----------
export function LayoutSite() {
  const { session, profile } = useAuth()
  const [menu, setMenu] = useState(false)
  const { pathname, hash } = useLocation()
  useEffect(() => { setMenu(false); if (!hash) window.scrollTo(0, 0) }, [pathname, hash])
  useRevelar(pathname)
  const area = !session ? { to: '/entrar', r: 'Área da paciente' } : profile?.role === 'paciente' ? { to: '/app', r: 'Abrir meu app' } : { to: '/painel', r: 'Ir para o painel' }

  return (
    <div className="site min-h-svh bg-fundo text-texto flex flex-col">
      <header className="sticky top-0 z-30 bg-fundo">
        <div className="site-wrap h-[76px] flex items-center gap-8">
          <Link to="/" className="flex items-center gap-3 shrink-0 group" aria-label="Dra. Bartira Rebouças, início">
            <img src="/marca-bartira.svg" alt="" className="w-9 h-9 transition-transform duration-500 group-hover:rotate-[-8deg]" />
            <span className="site-display text-[24px] leading-none">Bartira Rebouças</span>
          </Link>
          <nav className="hidden lg:flex items-center gap-7 ml-auto" aria-label="Principal">
            {NAV.map(([to, r]) => (
              <NavLink key={to} to={to} className={({ isActive }) => `text-[18px] transition-colors ${isActive ? 'text-texto' : 'text-apoio hover:text-texto'}`}>{r}</NavLink>
            ))}
            <Link to={area.to} className="text-[18px] text-apoio hover:text-texto transition-colors">{area.r}</Link>
          </nav>
          <div className="hidden lg:block"><Agendar className="!h-11 !px-5 !text-[14px]" /></div>
          <button className="lg:hidden ml-auto w-11 h-11 grid place-items-center rounded-full hover:bg-tom transition-colors" onClick={() => setMenu(!menu)} aria-expanded={menu} aria-label="Menu">
            {menu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
        {menu && (
          <nav className="lg:hidden bg-fundo site-wrap pb-8 pt-2 flex flex-col fase-resposta" aria-label="Principal">
            {NAV.map(([to, r]) => <Link key={to} to={to} className="py-3 site-display text-[32px]">{r}</Link>)}
            <Link to={area.to} className="py-3 text-[18px] text-apoio">{area.r}</Link>
            <div className="mt-4"><Agendar /></div>
          </nav>
        )}
      </header>

      <main className="flex-1"><Outlet /></main>

      <footer className="site-wrap pt-[clamp(64px,8vw,120px)] pb-8 text-[14px]">
        <div className="rv flex items-end gap-[2vw]">
          <img src="/marca-bartira.svg" alt="" className="w-[9vw] min-w-14 voo" />
          <p className="site-display text-[clamp(52px,11.5vw,180px)] leading-[.85] tracking-[-0.03em] lg:whitespace-nowrap">Bartira Rebouças</p>
        </div>
        <div className="mt-12 grid gap-y-3 md:grid-cols-[1fr_auto_1fr] items-baseline">
          <p className="text-apoio">Dra. Bartira Rebouças, endocrinologista · {CONTATO.crm} · {CONTATO.rqe}</p>
          <nav className="flex flex-wrap gap-x-6 gap-y-2" aria-label="Rodapé">
            {NAV.map(([to, r]) => <Link key={to} to={to} className="hover:text-cobre transition-colors">{r}</Link>)}
            <a href={CONTATO.instagram} target="_blank" rel="noreferrer" className="hover:text-cobre transition-colors">Instagram</a>
          </nav>
          <p className="md:text-right text-apoio">© {new Date().getFullYear()} · <Link to="/privacidade" className="text-texto hover:text-cobre">Privacidade</Link></p>
        </div>
        <p className="mt-6 text-[14px] text-apoio max-w-[75ch]">
          As informações deste site não substituem a consulta médica. Pranchas de Maria Sibylla Merian (1702 a 1705), domínio público, via Wikimedia Commons.
          Vídeo: <a className="underline" href="https://commons.wikimedia.org/wiki/File:Monarch_Butterfly_Emerging_from_Chrysalis.webm">"Monarch Butterfly Emerging from Chrysalis"</a>, Danmation, <a className="underline" href="https://creativecommons.org/licenses/by/3.0">CC BY 3.0</a>, recortado e acelerado.
          Foto de Ponta Negra: <a className="underline" href="https://commons.wikimedia.org/wiki/File:Vista_do_Morro_do_Careca_em_Ponta_Negra_pela_manh%C3%A3.jpg">"Vista do Morro do Careca em Ponta Negra pela manhã"</a>, Ppulbatu, <a className="underline" href="https://creativecommons.org/licenses/by/4.0">CC BY 4.0</a>.
        </p>
      </footer>

      {CONTATO.whatsapp && (
        <a href={linkAgendar()} target="_blank" rel="noreferrer" aria-label="Falar pelo WhatsApp"
          className="fixed right-4 bottom-4 z-30 w-14 h-14 rounded-full bg-oliva text-creme grid place-items-center transition-transform hover:scale-105">
          <MessageCircle className="w-6 h-6" />
        </a>
      )}
    </div>
  )
}

// ---------- Palco fixo ----------
type Quadro = { src: string; alt?: string; legenda?: string; prancha?: boolean; foco?: string; video?: string }
/** Duas colunas: leitura à esquerda, palco fixo à direita que troca de quadro conforme a seção ativa. */
/** No celular o palco não acompanha a rolagem: a prancha da seção aparece junto do texto. */
function QuadroMovel({ q }: { q: { src: string; legenda: string } }) {
  return <figure className="lg:hidden mt-10 bg-tom rounded-[4px] p-6"><img src={q.src} alt={q.legenda} className="w-full max-h-[60svh] object-contain" loading="lazy" /><figcaption className="mt-3 text-[14px] text-apoio">{q.legenda}</figcaption></figure>
}

function Palco({ quadros, children }: { quadros: Quadro[]; children: ReactNode }) {
  const [ativo, setAtivo] = useState(0)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const secs = [...(ref.current?.querySelectorAll<HTMLElement>('[data-quadro]') ?? [])]
    const io = new IntersectionObserver(es => es.forEach(e => e.isIntersecting && setAtivo(Number((e.target as HTMLElement).dataset.quadro))), { rootMargin: '-45% 0px -45% 0px' })
    secs.forEach(s => io.observe(s))
    return () => io.disconnect()
  }, [])
  const q = quadros[ativo] ?? quadros[0]
  return (
    <div ref={ref} className="site-wrap grid lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] gap-x-[clamp(32px,5vw,96px)]">
      <div className="order-2 lg:order-1 min-w-0">{children}</div>
      <div className="order-1 lg:order-2 relative">
        <div className="lg:sticky lg:top-[88px] h-[34svh] lg:h-[calc(100svh-112px)] -mx-[clamp(20px,3vw,40px)] lg:mx-0 overflow-hidden lg:rounded-[4px] bg-tom palco">
          {quadros.map((x, i) => x.video ? (
            <video key={x.video + i} src={x.video} poster={x.src} muted loop playsInline autoPlay aria-hidden="true"
              className={`palco-video ${i === ativo ? 'on' : ''}`} />
          ) : (
            <img key={x.src + i} src={x.src} alt={i === ativo ? (x.alt ?? x.legenda ?? '') : ''} aria-hidden={i !== ativo}
              className={`${i === ativo ? 'on' : ''} ${x.prancha ? 'prancha' : ''}`} style={x.foco ? { objectPosition: x.foco } : undefined}
              loading={i ? 'lazy' : 'eager'} />
          ))}
          {q.legenda && <p key={q.legenda} className="absolute left-4 bottom-3 right-4 text-[14px] text-apoio fase-resposta">{q.legenda}</p>}
        </div>
      </div>
    </div>
  )
}

// ---------- Início ----------
export function SiteInicio() {
  usePagina('', INICIO.texto)
  const quadros: Quadro[] = [
    { src: '/dra-bartira.jpg', alt: 'Dra. Bartira Rebouças em seu consultório', foco: '50% 25%' },
    { ...VIDEO },
    { ...PRANCHAS.folhas, prancha: true },
    { ...PRANCHAS.voo, prancha: true },
    { src: '/dra-bartira.jpg', alt: 'Dra. Bartira Rebouças', foco: '50% 22%' },
  ]
  return (<>
    <Palco quadros={quadros}>
      <section data-quadro="0" className="lg:min-h-[calc(100svh-76px)] flex flex-col justify-center pt-8 pb-16 lg:py-16">
        <div className="rv flex flex-col">
          <img src="/marca-bartira.svg" alt="" className="hidden lg:block w-14 h-14 voo" />
          <h1 className="site-display text-[clamp(52px,6.4vw,104px)] lg:mt-8 max-w-[9ch]">{INICIO.titulo}</h1>
          <p className="mt-6 lg:mt-8 text-[clamp(18px,1.35vw,21px)] leading-relaxed max-w-[38ch]">{INICIO.texto}</p>
          <div className="mt-8 lg:mt-10 flex flex-wrap items-center gap-x-7 gap-y-4">
            <Agendar />
            <Link to="/programa" className="site-link text-[18px]">Como funciona o programa</Link>
          </div>
          <p className="mt-10 text-[14px] text-apoio">{CONTATO.crm} · {CONTATO.rqe} · Clínica Equilibre e Instituto Spinel, Natal</p>
        </div>
      </section>

      <section data-quadro="1" className="py-[clamp(80px,12vw,200px)]" aria-labelledby="t-intro">
        <div className="rv flex flex-col gap-6 max-w-[34ch] text-[18px] leading-[1.65]">
          <h2 id="t-intro" className="site-h2">O corpo muda de fase</h2>
          {INICIO.intro.map((p, i) => <p key={i} className={i === 0 ? 'font-medium' : ''}>{p}</p>)}
        </div>
        <figure className="lg:hidden mt-10"><video src={VIDEO.video} poster={VIDEO.src} muted loop playsInline autoPlay className="w-full rounded-[4px]" aria-hidden="true" /><figcaption className="mt-3 text-[14px] text-apoio">{VIDEO.legenda}</figcaption></figure>
      </section>

      <section data-quadro="2" className="py-[clamp(60px,8vw,140px)]" aria-labelledby="t-fase"><QualFase /><QuadroMovel q={PRANCHAS.folhas} /></section>

      <section data-quadro="3" className="py-[clamp(80px,10vw,180px)]" aria-labelledby="t-roteiro"><Roteiro /><QuadroMovel q={PRANCHAS.voo} /></section>

      <section data-quadro="4" className="py-[clamp(80px,10vw,180px)]" aria-labelledby="t-carta"><Carta /></section>
    </Palco>

    <TemasMenu />
    <Planos />
    <MateriaisHome />
    <Perguntas />
    <Fechamento />
  </>)
}

/** O elemento vivo: a visitante escolhe o que vive hoje e lê em que fase provavelmente está. */
function QualFase() {
  const [id, setId] = useState<string | null>(null)
  const f = FASES.find(x => x.id === id)
  return (
    <div className="flex flex-col">
      <div className="rv">
        <h2 id="t-fase" className="site-h2">Em que fase você está?</h2>
        <p className="mt-4 text-[18px] max-w-[40ch]">Escolha o que mais se parece com a sua menstruação hoje.</p>
      </div>
      <div className="rv mt-8 flex flex-col gap-2.5" role="radiogroup" aria-label="Como está sua menstruação">
        {FASES.map(x => (
          <button key={x.id} role="radio" aria-checked={id === x.id} onClick={() => setId(x.id)}
            className={`fase-opcao text-left px-5 py-4 rounded-[4px] text-[18px] ${id === x.id ? 'bg-cafe text-creme' : 'bg-tom hover:bg-ativo'}`}>{x.pergunta}</button>
        ))}
      </div>
      <div aria-live="polite">
        {f && (
          <div key={f.id} className="fase-resposta mt-6 bg-folha rounded-[4px] p-6 sm:p-7">
            <p className="site-display text-[clamp(32px,2.8vw,44px)]">{f.fase}</p>
            <p className="mt-3 text-[18px] leading-relaxed">{f.texto}</p>
            <p className="mt-3 text-[18px] leading-relaxed text-oliva font-medium">{f.cuidado}</p>
            <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3"><Agendar rotulo="Quero uma avaliação" /><span className="text-[14px] text-apoio">Orientação geral. A fase é confirmada na consulta.</span></div>
          </div>
        )}
      </div>
    </div>
  )
}

/** O programa impresso como um roteiro, com borda serrilhada. */
function Roteiro() {
  return (
    <div className="flex flex-col">
      <div className="rv">
        <h2 id="t-roteiro" className="site-h2">Seis meses de acompanhamento</h2>
        <p className="mt-4 text-[18px] max-w-[40ch]">O programa Longevidade tem começo, meio e fim. É assim que ele acontece.</p>
      </div>
      <div className="slip rv mt-10 bg-folha px-6 sm:px-8 pt-7 pb-12 max-w-[560px] text-[18px] tabular-nums">
        {ROTEIRO.map(g => (
          <div key={g.quando} className="mb-7">
            <p className="font-semibold text-[18px]">{g.quando}</p>
            {g.itens.map(([o, q]) => (
              <div key={o} className="flex items-end gap-3 mt-3"><span className="max-w-[30ch]">{o}</span><span className="pontos" aria-hidden="true" /><span className="text-apoio whitespace-nowrap">{q}</span></div>
            ))}
          </div>
        ))}
        <div className="bg-cafe text-creme -mx-6 sm:-mx-8 px-6 sm:px-8 py-3 flex items-center justify-between gap-4 font-medium">
          <span>{ROTEIRO_FIM[0]}</span><span className="whitespace-nowrap">{ROTEIRO_FIM[1]}</span>
        </div>
      </div>
    </div>
  )
}

/** Carta em primeira pessoa, com assinatura. */
function Carta() {
  return (
    <div className="rv flex flex-col gap-6 max-w-[36ch] text-[18px] leading-[1.65]">
      <h2 id="t-carta" className="site-h2">Uma palavra antes da consulta</h2>
      <img src="/dra-bartira-rosto.jpg" alt="" className="w-16 h-16 rounded-full object-cover" />
      {SOBRE.paragrafos.map((p, i) => <p key={i}>{p}</p>)}
      <div>
        <p className="site-display italic text-[32px]">Bartira Rebouças</p>
        <p className="text-[14px] text-apoio mt-1">Endocrinologista · {CONTATO.crm}</p>
      </div>
      <Link to="/sobre" className="site-link text-[18px] self-start">Formação e trajetória</Link>
    </div>
  )
}

/** Os temas como um cardápio impresso sobre campo café. */
function TemasMenu() {
  return (
    <section className="bg-cafe text-creme py-[clamp(90px,12vw,200px)]" aria-labelledby="t-temas">
      <div className="site-wrap grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)] gap-12 items-start">
        <div className="rv lg:sticky lg:top-28">
          <h2 id="t-temas" className="site-h2">O que eu trato no consultório</h2>
          <p className="mt-5 text-[18px] text-areia max-w-[34ch]">Sintomas e condições que mudam com os hormônios. Escolha um assunto para ler mais.</p>
          <div className="mt-10 w-[min(320px,70%)] overflow-hidden rounded-[4px]"><img src="/site/merian-4.jpg" alt="Pimenteira com borboleta, crisálida e lagarta, de Maria Sibylla Merian" className="w-full deriva" loading="lazy" /></div>
        </div>
        <div className="rv bg-fundo text-texto rounded-[4px] p-[clamp(24px,4vw,56px)]">
          {TEMAS.map(t => (
            <Link key={t.slug} to={`/temas/${t.slug}`} className="group block py-5">
              <span className="flex items-end gap-3">
                <span className="site-display text-[clamp(26px,2.2vw,34px)] group-hover:text-cobre transition-colors">{t.titulo}</span>
                <span className="pontos" aria-hidden="true" />
                <ArrowRight className="w-5 h-5 shrink-0 -translate-y-1.5 transition-transform group-hover:translate-x-1" />
              </span>
              <span className="block mt-1.5 text-[18px] text-apoio max-w-[46ch]">{t.resumo}</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

/** Dois campos de cor lado a lado; a largura diz qual pesa mais. */
function Planos() {
  const [ess, comp, anual] = PLANOS
  return (
    <section aria-labelledby="t-planos">
      <h2 id="t-planos" className="sr-only">Formatos do programa Longevidade</h2>
      <div className="grid lg:grid-cols-[5fr_7fr]">
        <div className="bg-areia/70 px-[clamp(24px,4vw,64px)] py-[clamp(56px,7vw,110px)] flex flex-col min-h-[70svh]">
          <div className="rv">
            <h3 className="site-display text-[clamp(48px,5vw,80px)]">{ess.nome}</h3>
            <p className="mt-4 text-[21px] max-w-[26ch]">Para começar com uma avaliação completa e um plano claro.</p>
            <p className="mt-6 text-[18px] max-w-[40ch]">{ess.encontros}, avaliação, protocolo por escrito, check-in semanal pelo app e o Mapa da Saúde ao final.</p>
          </div>
          <div className="mt-auto pt-12 flex flex-wrap items-end justify-between gap-6">
            <p className="site-display text-[clamp(56px,7vw,112px)] leading-none">6 meses</p>
            <Agendar rotulo="Quero conversar" />
          </div>
        </div>
        <div className="bg-oliva text-creme px-[clamp(24px,4vw,64px)] py-[clamp(56px,7vw,110px)] flex flex-col min-h-[70svh]">
          <div className="rv">
            <h3 className="site-display text-[clamp(48px,5vw,80px)]">{comp.nome}</h3>
            <p className="mt-4 text-[21px] max-w-[30ch]">Para cuidar de tudo de uma vez, com especialistas parceiros.</p>
            <p className="mt-6 text-[18px] max-w-[46ch]">Tudo do Essencial, mais consulta com cardiologista e com nutricionista parceiros. Também em versão {anual.nome.toLowerCase()}: {anual.duracao}, {anual.encontros.replace(' com a Dra. Bartira', '')}.</p>
          </div>
          <div className="mt-auto pt-12 flex flex-wrap items-end justify-between gap-6">
            <p className="site-display text-[clamp(56px,7vw,112px)] leading-none">6 ou 12 meses</p>
            <Agendar claro rotulo="Quero conversar" />
          </div>
        </div>
      </div>
      <p className="site-wrap mt-5 text-[14px] text-apoio">Valores e condições são informados no agendamento.</p>
    </section>
  )
}

function MateriaisHome() {
  const lista = useMateriais(true)
  if (!lista?.length) return null
  return (
    <section className="site-wrap py-[clamp(90px,10vw,180px)]" aria-labelledby="t-mat">
      <div className="rv max-w-3xl">
        <h2 id="t-mat" className="site-h2">Para ler com calma</h2>
        <p className="mt-4 text-[18px]">Materiais gratuitos escritos pela Dra. Bartira.</p>
      </div>
      <div className="rv mt-12 grid md:grid-cols-2 gap-6">{lista.map(m => <CartaoMaterial key={m.id} m={m} />)}</div>
    </section>
  )
}

/** Perguntas como texto corrido, sem sanfona. */
function Perguntas() {
  return (
    <section className="site-wrap pb-[clamp(90px,10vw,180px)] grid lg:grid-cols-[3fr_9fr] gap-10" aria-labelledby="t-faq">
      <div className="rv"><h2 id="t-faq" className="site-h2 !text-[clamp(32px,2.6vw,40px)]">Dúvidas comuns</h2></div>
      <div className="rv lg:columns-2 gap-14 text-[18px] leading-[1.6]">
        {PERGUNTAS.map(([q, r]) => <p key={q} className="mb-6 break-inside-avoid"><b className="font-medium">{q}</b> <span>{r}</span></p>)}
      </div>
    </section>
  )
}

/** A metamorfose em três tempos, como nas pranchas de Merian. */
function TresTempos() {
  const tempos: Array<[string, string, string]> = [
    ['/site/merian-3.jpg', 'Antes da transição', 'Avaliar com calma, antes que os sintomas apareçam.'],
    ['/site/merian-1.jpg', 'Perimenopausa', 'Tratar os sintomas e ajustar a rotina à nova fase.'],
    ['/site/merian-2.jpg', 'Depois da menopausa', 'Proteger ossos, coração, músculos e energia.'],
  ]
  return (
    <section className="site-wrap py-[clamp(90px,10vw,170px)]" aria-labelledby="t-tempos">
      <div className="rv max-w-3xl"><h2 id="t-tempos" className="site-h2">Cada fase pede um cuidado</h2></div>
      <div className="rv mt-12 grid sm:grid-cols-3 gap-6">
        {tempos.map(([src, t, x]) => (
          <figure key={t} className="group">
            <div className="bg-tom rounded-[4px] p-6 aspect-[4/5] overflow-hidden"><img src={src} alt={`Prancha de Maria Sibylla Merian: ${t.toLowerCase()}`} className="w-full h-full object-contain transition-transform duration-700 group-hover:scale-[1.04]" loading="lazy" /></div>
            <figcaption className="mt-4"><span className="block site-display text-[32px]">{t}</span><span className="block mt-1 text-[18px]">{x}</span></figcaption>
          </figure>
        ))}
      </div>
    </section>
  )
}

/** Foto de Natal, texto na metade calma. */
function Fechamento() {
  return (<>
    <TresTempos />
    <section className="relative" aria-labelledby="t-fim">
      <div className="relative h-[70svh] lg:h-[90svh] overflow-hidden">
        <img src="/site/ponta-negra.jpg" alt="Morro do Careca visto da praia de Ponta Negra, em Natal, pela manhã" className="absolute inset-0 w-full h-full object-cover object-[35%_50%] deriva" loading="lazy" />
        <div className="absolute inset-0 bg-texto/35 hidden lg:block" />
        <div className="hidden lg:flex absolute inset-0 site-wrap items-end pb-[10svh]">
          <div className="rv ml-auto w-[44%] text-creme flex flex-col items-start gap-6">
            <h2 id="t-fim" className="site-display text-[clamp(44px,4vw,68px)]">Vamos começar pela conversa</h2>
            <p className="text-[18px] max-w-[38ch]">Atendimento na Clínica Equilibre e no Instituto Spinel, em Natal. A equipe ajuda a escolher o melhor horário.</p>
            <Agendar claro />
          </div>
        </div>
      </div>
      <div className="lg:hidden bg-cafe text-creme site-wrap py-14 flex flex-col gap-5">
        <p className="site-display text-[44px]">Vamos começar pela conversa</p>
        <p className="text-[18px] text-areia">Atendimento na Clínica Equilibre e no Instituto Spinel, em Natal.</p>
        <div><Agendar claro /></div>
      </div>
    </section>
  </>)
}

/** Abertura das páginas internas: título grande e uma frase, sem rótulo. */
function Abertura({ titulo, texto }: { titulo: string; texto?: string }) {
  return (
    <section className="site-wrap pt-[clamp(48px,7vw,120px)] pb-[clamp(40px,5vw,80px)]">
      <div className="rv max-w-4xl">
        <h1 className="site-display text-[clamp(46px,5.4vw,88px)] max-w-[14ch]">{titulo}</h1>
        {texto && <p className="mt-6 text-[clamp(18px,1.35vw,21px)] leading-relaxed max-w-[44ch]">{texto}</p>}
      </div>
    </section>
  )
}

// ---------- Sobre ----------
export function SiteSobre() {
  usePagina('Sobre', SOBRE.resumo)
  return (<>
    <Palco quadros={[{ src: '/dra-bartira.jpg', alt: 'Dra. Bartira Rebouças', foco: '50% 25%' }, { ...PRANCHAS.pimenta, prancha: true }]}>
      <section data-quadro="0" className="pt-[clamp(40px,6vw,110px)] pb-16">
        <div className="rv">
          <h1 className="site-display text-[clamp(46px,5.2vw,84px)] max-w-[12ch]">Dra. Bartira Rebouças</h1>
          <p className="mt-6 text-[21px] leading-relaxed max-w-[36ch]">{SOBRE.resumo}</p>
          <div className="mt-8"><Agendar /></div>
        </div>
        <div className="rv mt-14 flex flex-col gap-6 max-w-[38ch] text-[18px] leading-[1.65]">
          {SOBRE.paragrafos.map((p, i) => <p key={i}>{p}</p>)}
        </div>
      </section>
      <section data-quadro="1" className="py-[clamp(60px,8vw,140px)]" aria-labelledby="t-formacao">
        <div className="rv">
          <h2 id="t-formacao" className="site-h2">Formação</h2>
          <ul className="mt-8 flex flex-col gap-4 text-[18px]">{SOBRE.formacao.map(f => <li key={f} className="bg-tom rounded-[4px] px-5 py-4">{f}</li>)}</ul>
          <p className="mt-6 text-[14px] text-apoio">{CONTATO.crm} · {CONTATO.rqe}</p>
          <div className="mt-10"><Agendar /></div>
        </div>
      </section>
    </Palco>
    <Fechamento />
  </>)
}

// ---------- Programa ----------
export function SitePrograma() {
  usePagina('Programa Longevidade', 'Acompanhamento de 6 ou 12 meses para mulheres no climatério, com encontros presenciais e check-in semanal pelo app.')
  return (<>
    <Palco quadros={[{ ...PRANCHAS.lagarta, prancha: true }, { ...PRANCHAS.folhas, prancha: true }, { ...PRANCHAS.voo, prancha: true }]}>
      <section data-quadro="0" className="pt-[clamp(40px,6vw,110px)] pb-12">
        <div className="rv">
          <h1 className="site-display text-[clamp(46px,5.2vw,84px)] max-w-[12ch]">Programa Longevidade</h1>
          <p className="mt-6 text-[21px] leading-relaxed max-w-[38ch]">Em vez de consultas soltas, um acompanhamento com começo, meio e fim: avaliação completa, protocolo por escrito e contato toda semana com a equipe.</p>
          <div className="mt-10"><Agendar /></div>
        </div>
      </section>
      <section data-quadro="1" className="py-[clamp(60px,8vw,140px)]" aria-labelledby="t-roteiro"><Roteiro /></section>
      <section data-quadro="2" className="py-[clamp(60px,8vw,140px)]" aria-labelledby="t-app">
        <div className="rv">
          <h2 id="t-app" className="site-h2">O acompanhamento no seu celular</h2>
          <p className="mt-4 text-[18px] max-w-[40ch]">Durante o programa você usa um aplicativo próprio, com letra grande e simples de usar.</p>
          <ul className="mt-8 flex flex-col gap-3 text-[18px]">{APP_PACIENTE.map(x => <li key={x} className="bg-tom rounded-[4px] px-5 py-4">{x}</li>)}</ul>
        </div>
      </section>
    </Palco>
    <Planos />
    <div className="pt-[clamp(90px,10vw,160px)]"><Perguntas /></div>
    <Fechamento />
  </>)
}

// ---------- Temas ----------
export function SiteTemas() {
  usePagina('Temas', 'Climatério, menopausa, terapia hormonal, peso, sono, saúde óssea e tireoide.')
  return (<>
    <Abertura titulo="Temas" texto="Textos curtos sobre o que mais aparece no consultório. Conteúdo informativo, que não substitui a consulta." />
    <TemasMenu />
    <Fechamento />
  </>)
}

export function SiteTema() {
  const { slug } = useParams()
  const t = TEMAS.find(x => x.slug === slug)
  usePagina(t?.titulo ?? 'Tema', t?.resumo ?? '')
  if (!t) return <Abertura titulo="Tema não encontrado" texto="Volte para a lista de temas." />
  const prancha = Object.values(PRANCHAS)[TEMAS.indexOf(t) % 4]
  const outros = TEMAS.filter(x => x.slug !== t.slug).slice(0, 4)
  return (
    <><Palco key={t.slug} quadros={[{ ...prancha, prancha: true }]}>
      <section data-quadro="0" className="pt-[clamp(40px,6vw,110px)] pb-20">
        <div className="rv">
          <h1 className="site-display text-[clamp(44px,5vw,80px)] max-w-[12ch]">{t.titulo}</h1>
          <p className="mt-5 text-[21px] leading-relaxed max-w-[34ch]">{t.resumo}</p>
          <div className="mt-8"><Agendar /></div>
        </div>
        <article className="rv mt-12 flex flex-col gap-6 max-w-[40ch] text-[18px] leading-[1.7]">
          {t.corpo.map((p, k) => <p key={k}>{p}</p>)}
        </article>
        <div className="rv mt-12 bg-tom rounded-[4px] p-6 flex flex-col sm:flex-row sm:items-center gap-5 max-w-[560px]">
          <img src="/dra-bartira-rosto.jpg" alt="" className="w-16 h-16 rounded-full object-cover" />
          <p className="flex-1 text-[18px]">Quer conversar sobre isso com a Dra. Bartira?</p>
          <Agendar rotulo="Agendar" />
        </div>
        <div className="rv mt-16">
          <h2 className="text-[21px] font-medium">Outros temas · <Link to="/temas" className="site-link">ver todos</Link></h2>
          <div className="mt-3 flex flex-col">{outros.map(o => <Link key={o.slug} to={`/temas/${o.slug}`} className="group flex items-end gap-3 py-3"><span className="site-display text-[32px] group-hover:text-cobre transition-colors">{o.titulo}</span><span className="pontos" /><ArrowRight className="w-4 h-4 -translate-y-1.5 transition-transform group-hover:translate-x-1" /></Link>)}</div>
        </div>
      </section>
    </Palco><Fechamento /></>
  )
}

// ---------- Conteúdos ----------
export function SiteConteudos() {
  usePagina('Conteúdos', 'Guia, e-book e conteúdos da Dra. Bartira sobre climatério e longevidade feminina.')
  const materiais = useMateriais()
  return (<>
    <Abertura titulo="Para entender melhor essa fase" texto="Materiais gratuitos escritos pela Dra. Bartira e textos sobre climatério, menopausa e longevidade." />
    <section className="site-wrap pb-[clamp(80px,8vw,140px)]" aria-label="Materiais">
      {materiais === null ? <p className="text-apoio">Carregando</p> : materiais.length === 0 ? <p className="text-[18px] text-apoio">Novos materiais em breve.</p> : (
        <div className="rv grid md:grid-cols-2 gap-6">{materiais.map(m => <CartaoMaterial key={m.id} m={m} />)}</div>
      )}
    </section>
    <TemasMenu />
    <Fechamento />
  </>)
}

// ---------- Contato ----------
export function SiteContato() {
  usePagina('Contato e agendamento', 'Agende sua consulta com a Dra. Bartira Rebouças em Natal.')
  return (<>
    <Palco quadros={[{ src: '/site/ponta-negra.jpg', alt: 'Praia de Ponta Negra e o Morro do Careca, em Natal', foco: '35% 50%' }]}>
      <section data-quadro="0" id="agendar" className="pt-[clamp(40px,6vw,110px)] pb-20 scroll-mt-24">
        <div className="rv">
          <h1 className="site-display text-[clamp(46px,5.2vw,84px)] max-w-[12ch]">Agende sua consulta</h1>
          <p className="mt-6 text-[21px] leading-relaxed max-w-[36ch]">Fale com a equipe para escolher o local e o horário. Ela também ajuda com valores e preparo para a consulta.</p>
          <div className="mt-10">{CONTATO.whatsapp ? <Agendar rotulo="Chamar no WhatsApp" /> : <><a href="#locais" className="site-btn">Ver os locais de atendimento<ArrowRight className="w-4 h-4" /></a><p className="mt-5 text-[18px] max-w-[40ch]">O número de agendamento pelo WhatsApp será publicado em breve.</p></>}</div>
        </div>
        <div id="locais" className="rv mt-16 flex flex-col gap-4 max-w-[520px] scroll-mt-24">
          {LOCAIS.map(l => (
            <div key={l.nome} className="bg-folha rounded-[4px] p-6 flex flex-col gap-3">
              <h2 className="site-display text-[32px]">{l.nome}</h2>
              <p className="flex gap-3 text-[18px]"><MapPin className="w-5 h-5 text-cobre shrink-0 mt-1" />{l.endereco}</p>
              <p className="flex gap-3 text-[18px] text-apoio"><Clock className="w-5 h-5 text-cobre shrink-0 mt-1" />{l.horario}</p>
              {l.mapa && <a href={l.mapa} target="_blank" rel="noreferrer" className="site-link text-[18px] self-start">Ver no mapa</a>}
            </div>
          ))}
        </div>
      </section>
    </Palco>
    <TresTempos />
  </>)
}

// ---------- Privacidade ----------
export function SitePrivacidade() {
  usePagina('Política de privacidade', 'Como tratamos os dados de quem visita o site e das pacientes.')
  // CONFIRMAR: responsável pelos dados (pessoa ou clínica) e revisão jurídica
  const itens: Array<[string, string]> = [
    ['Quem é responsável', 'Dra. Bartira Rebouças, endocrinologista, responsável pelo tratamento dos dados coletados neste site e no app das pacientes.'],
    ['Que dados coletamos no site', 'Quando você pede um material gratuito, guardamos nome, e-mail e, se você informar, WhatsApp, para enviar o material e conteúdos da Dra. Bartira. Quando fala com a equipe pelo WhatsApp, os dados são usados só para o agendamento.'],
    ['Dados das pacientes', 'No app, guardamos dados de saúde informados pela paciente e pela equipe, com acesso restrito à médica e a quem ela autorizar. Cada abertura de ficha fica registrada.'],
    ['Seus direitos', 'Você pode pedir acesso, correção ou exclusão dos seus dados a qualquer momento, pelo contato da equipe.'],
  ]
  return (<>
    <Abertura titulo="Política de privacidade" texto="Versão inicial, em revisão." />
    <article className="site-wrap pb-24 grid gap-10 max-w-4xl">
      {itens.map(([t, x]) => <div key={t} className="rv"><h2 className="text-[21px] font-medium">{t}</h2><p className="mt-2 text-[18px] leading-relaxed">{x}</p></div>)}
    </article>
  </>)
}
