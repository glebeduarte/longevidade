import { Fragment, useEffect, useRef, useState, type ReactNode } from 'react'
import { Link, NavLink, Outlet, useLocation, useParams } from 'react-router-dom'
import { ArrowRight, Check, Clock, MapPin, Menu, MessageCircle, X } from 'lucide-react'
import { useAuth } from '../../auth/AuthProvider'
import {
  CONTATO, FASES, INICIO, LOCAIS, NAV, PERGUNTAS, PROGRAMA, SOBRE, TEMAS, linkAgendar,
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

      <footer className="site-wrap pt-20 pb-6 text-[14px] text-apoio">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <Link to="/" className="flex items-center gap-2 text-texto"><img src="/marca-bartira.svg" alt="" className="w-5 h-5" />Dra. Bartira Rebouças</Link>
          <span>Endocrinologista · {CONTATO.crm} · {CONTATO.rqe}</span>
          <nav className="flex flex-wrap gap-x-5 gap-y-2 md:ml-auto" aria-label="Rodapé">
            {NAV.map(([to, r]) => <Link key={to} to={to} className="hover:text-texto transition-colors">{r}</Link>)}
            <a href={CONTATO.instagram} target="_blank" rel="noreferrer" className="hover:text-texto transition-colors">Instagram</a>
            <Link to="/privacidade" className="hover:text-texto transition-colors">Privacidade</Link>
          </nav>
        </div>
        <p className="mt-4 text-[13px] leading-relaxed text-apoio max-w-[75ch]">
          © {new Date().getFullYear()} · As informações deste site não substituem a consulta médica. Pranchas de Maria Sibylla Merian (1702 a 1705), domínio público, via Wikimedia Commons.
          Vídeo: <a className="underline" href="https://commons.wikimedia.org/wiki/File:Monarch_Butterfly_Emerging_from_Chrysalis.webm">"Monarch Butterfly Emerging from Chrysalis"</a>, Danmation, <a className="underline" href="https://creativecommons.org/licenses/by/3.0">CC BY 3.0</a>, recortado e acelerado.
          Foto: <a className="underline" href="https://commons.wikimedia.org/wiki/File:Vista_do_Morro_do_Careca_em_Ponta_Negra_pela_manh%C3%A3.jpg">"Vista do Morro do Careca em Ponta Negra pela manhã"</a>, Ppulbatu, <a className="underline" href="https://creativecommons.org/licenses/by/4.0">CC BY 4.0</a>.
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
            <Link to="/programa" className="site-link text-[18px]">Conheça o programa Longevidade</Link>
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

      <section data-quadro="3" className="py-[clamp(80px,10vw,180px)]" aria-labelledby="t-carta"><Carta /></section>
    </Palco>

    <TemasMenu />
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
const marca = (v: string | boolean, claro = false) => v === true ? <Check className={`w-5 h-5 mx-auto ${claro ? 'text-creme' : 'text-oliva'}`} aria-label="incluído" /> : v === false ? <span className={claro ? 'text-creme/60' : 'text-apoio/60'} aria-label="não incluído">·</span> : v

export function SitePrograma() {
  usePagina('Programa Longevidade', 'Acompanhamento de 6 ou 12 meses para mulheres no climatério: encontros, medidas comparadas, protocolo por escrito e check-in semanal.')
  const P = PROGRAMA
  return (<>
    <Palco quadros={[{ ...VIDEO }, { ...PRANCHAS.lagarta, prancha: true }, { ...PRANCHAS.folhas, prancha: true }, { ...PRANCHAS.voo, prancha: true }]}>
      <section data-quadro="0" className="lg:min-h-[calc(100svh-76px)] flex flex-col justify-center pt-8 pb-16">
        <div className="rv">
          <h1 className="site-display text-[clamp(52px,6vw,96px)] max-w-[10ch]">{P.titulo}</h1>
          <p className="mt-6 text-[clamp(21px,1.6vw,26px)] leading-snug max-w-[26ch]">{P.sub}</p>
          <p className="mt-6 text-[18px] leading-relaxed max-w-[42ch]">{P.tese}</p>
          <div className="mt-10 flex flex-wrap items-center gap-x-7 gap-y-4"><Agendar rotulo="Quero falar com a equipe" /><a href="#comparativo" className="site-link text-[18px]">Ver os formatos</a></div>
        </div>
      </section>

      <section data-quadro="1" className="py-[clamp(70px,9vw,150px)]" aria-labelledby="t-jornada">
        <div className="rv"><h2 id="t-jornada" className="site-h2">Como o programa acontece</h2>
          <p className="mt-4 text-[18px] max-w-[40ch]">Uma jornada com começo, meio e fim. Cada etapa prepara a próxima.</p></div>
        <ol className="rv mt-10 flex flex-col">
          {P.jornada.map(([t, x], i) => (
            <li key={t} className="grid grid-cols-[44px_1fr] gap-x-5 pb-8 last:pb-0 relative">
              <span className={`w-11 h-11 rounded-full grid place-items-center site-display text-[22px] ${i === 1 ? 'bg-areia text-texto' : 'bg-cafe text-creme'}`} aria-hidden="true">{i === 0 ? '·' : i}</span>
              {i < P.jornada.length - 1 && <span className="absolute left-[20px] top-12 bottom-1 w-[4px] rounded-full bg-areia/70" aria-hidden="true" />}
              <div><p className="text-[21px] font-medium">{t}</p><p className="mt-1 text-[18px] leading-relaxed max-w-[42ch]">{x}</p></div>
            </li>
          ))}
        </ol>
        <QuadroMovel q={PRANCHAS.lagarta} />
      </section>

      <section data-quadro="2" className="py-[clamp(70px,9vw,150px)]" aria-labelledby="t-medidas">
        <div className="rv"><h2 id="t-medidas" className="site-h2">Em todo encontro, tudo comparado</h2>
          <p className="mt-4 text-[18px] max-w-[42ch]">As mesmas medidas, nos mesmos pontos, para enxergar o que mudou desde o último encontro.</p></div>
        <div className="rv mt-10 bg-folha rounded-[4px] p-6 sm:p-8">
          <div className="grid grid-cols-[1fr_repeat(3,56px)] sm:grid-cols-[1fr_repeat(3,72px)] items-end gap-y-5 text-[14px] text-apoio">
            <span /> {['Início', '3º mês', '6º mês'].map(m => <span key={m} className="text-center">{m}</span>)}
            {P.medidas.map(([t, x], i) => (<Fragment key={t}>
              <div><p className="text-[18px] font-medium text-texto">{t}</p><p className="text-[14px] text-apoio">{x}</p></div>
              {[0, 1, 2].map(k => <span key={k} className="grid place-items-center"><span className="medida-ponto rounded-full bg-oliva" style={{ width: 10 + k * 6, height: 10 + k * 6, transitionDelay: `${i * 120 + k * 160}ms` }} /></span>)}
            </Fragment>))}
          </div>
          <p className="mt-6 text-[14px] text-apoio">Esquema ilustrativo: cada encontro registra as mesmas medidas para comparação.</p>
        </div>
        <QuadroMovel q={PRANCHAS.folhas} />
      </section>

      <section data-quadro="3" className="py-[clamp(70px,9vw,150px)]" aria-labelledby="t-entregas">
        <div className="rv"><h2 id="t-entregas" className="site-h2">O que você recebe</h2>
          <p className="mt-4 text-[18px] max-w-[40ch]">Documentos por escrito e um app para levar o acompanhamento no bolso.</p></div>
        <dl className="rv mt-10 grid sm:grid-cols-2 gap-x-8 gap-y-8">
          {P.entregas.map(([t, x]) => <div key={t}><dt className="site-display text-[32px] leading-tight">{t}</dt><dd className="mt-2 text-[18px] leading-relaxed">{x}</dd></div>)}
        </dl>
        <QuadroMovel q={PRANCHAS.voo} />
      </section>
    </Palco>

    <section className="bg-cafe text-creme py-[clamp(90px,11vw,180px)]" aria-labelledby="t-tempo">
      <div className="site-wrap">
        <div className="rv max-w-3xl"><h2 id="t-tempo" className="site-h2">Por que seis meses</h2>
          <p className="mt-4 text-[18px] text-areia max-w-[48ch]">Cada parte do corpo responde no seu tempo. O programa acompanha todos eles, um de cada vez.</p></div>
        <ol className="rv tempo-linha mt-16 grid sm:grid-cols-5 gap-10 sm:gap-6 relative">
          <span className="tempo-barra hidden sm:block absolute left-0 right-0 top-[27px] h-[6px] rounded-full bg-areia/25" aria-hidden="true"><span className="block h-full rounded-full bg-areia origin-left" /></span>
          {P.tempos.map(([q, t, x], i) => (
            <li key={q} className="relative flex flex-col">
              <span className="relative z-10 w-[60px] h-[60px] rounded-full bg-cafe grid place-items-center" aria-hidden="true">
                <img src="/marca-bartira.svg" alt="" className="rounded-full bg-creme p-2" style={{ width: 30 + i * 6, height: 30 + i * 6 }} />
              </span>
              <p className="mt-5 site-display text-[44px] leading-none">{q}</p>
              <p className="mt-3 text-[18px] font-medium">{t}</p>
              <p className="mt-1 text-[16px] text-areia leading-relaxed">{x}</p>
            </li>
          ))}
        </ol>
        <p className="rv mt-12 text-[14px] text-areia/80 max-w-[70ch]">Tempos aproximados. Cada mulher responde de um jeito, e os resultados dependem do quadro de cada uma.</p>
      </div>
    </section>

    <section className="site-wrap py-[clamp(90px,11vw,180px)]" aria-labelledby="t-diferenca">
      <div className="rv max-w-3xl"><h2 id="t-diferenca" className="site-h2">Consulta avulsa ou programa</h2></div>
      <div className="rv mt-12 grid md:grid-cols-[1fr_auto_1.15fr] gap-6 items-stretch">
        <div className="bg-tom rounded-[4px] p-7">
          <h3 className="site-display text-[32px]">Consulta avulsa</h3>
          <ul className="mt-5 flex flex-col gap-3 text-[18px]">{P.avulsa.map(x => <li key={x} className="flex gap-3"><X className="w-5 h-5 text-apoio shrink-0 mt-1" />{x}</li>)}</ul>
        </div>
        <div className="hidden md:grid place-items-center"><ArrowRight className="w-8 h-8 text-cobre seta-pulsa" /></div>
        <div className="bg-oliva text-creme rounded-[4px] p-7">
          <h3 className="site-display text-[32px]">Programa Longevidade</h3>
          <ul className="mt-5 flex flex-col gap-3 text-[18px]">{P.programa.map(x => <li key={x} className="flex gap-3"><Check className="w-5 h-5 text-areia shrink-0 mt-1" />{x}</li>)}</ul>
        </div>
      </div>
    </section>

    <section id="comparativo" className="bg-tom/70 py-[clamp(90px,11vw,180px)] scroll-mt-20" aria-labelledby="t-comp">
      <div className="site-wrap">
        <div className="rv max-w-3xl"><h2 id="t-comp" className="site-h2">Três formatos, do essencial ao ano inteiro</h2>
          <p className="mt-4 text-[18px] max-w-[52ch]">Cada formato inclui tudo do anterior. A equipe ajuda a escolher o que faz sentido para você.</p></div>
        <div className="rv mt-12 overflow-x-auto -mx-[clamp(20px,3vw,40px)] px-[clamp(20px,3vw,40px)]">
          <table className="w-full min-w-[640px] text-[16px] border-separate border-spacing-0">
            <thead>
              <tr>
                <th className="text-left font-normal text-apoio pb-5 pr-4 w-[38%]"><span className="sr-only">Item</span></th>
                {P.niveis.map((n, i) => (
                  <th key={n} className={`pb-5 px-3 text-center align-bottom ${i === 1 ? 'bg-oliva text-creme rounded-t-[4px] pt-5' : ''}`}>
                    <span className="site-display text-[32px] font-normal">{n}</span>
                    {i === 1 && <span className="block text-[14px] font-normal text-areia mt-1">indicado para a maioria</span>}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {P.comparativo.map(([item, ...v], r) => (
                <tr key={item as string} className={r % 2 ? '' : 'bg-folha/60'}>
                  <th scope="row" className="text-left font-normal py-3.5 pr-4 pl-3">{item}</th>
                  {v.map((c, i) => <td key={i} className={`py-3.5 px-3 text-center ${i === 1 ? 'bg-oliva/95 text-creme' : ''}`}>{marca(c, i === 1)}</td>)}
                </tr>
              ))}
              <tr><td /><td className="pt-6 px-2 text-center"><Agendar rotulo="Conversar" className="!h-11 !px-4 !text-[14px]" /></td><td className="pt-6 px-2 text-center bg-oliva rounded-b-[4px] pb-5"><Agendar claro rotulo="Conversar" className="!h-11 !px-4 !text-[14px]" /></td><td className="pt-6 px-2 text-center"><Agendar rotulo="Conversar" className="!h-11 !px-4 !text-[14px]" /></td></tr>
            </tbody>
          </table>
        </div>
        <p className="rv mt-6 text-[14px] text-apoio">Exames de laboratório e de imagem são feitos fora e não estão incluídos. Valores e condições são informados pela equipe.</p>
      </div>
    </section>

    <section className="grid lg:grid-cols-2" aria-label="Para quem é o programa">
      <div className="bg-areia/60 px-[clamp(24px,5vw,80px)] py-[clamp(70px,8vw,130px)]"><div className="rv">
        <h2 className="site-h2">Para quem é</h2>
        <ul className="mt-8 flex flex-col gap-4 text-[18px]">{P.paraQuem.map(x => <li key={x} className="flex gap-3"><Check className="w-5 h-5 text-oliva shrink-0 mt-1" />{x}</li>)}</ul>
      </div></div>
      <div className="bg-folha px-[clamp(24px,5vw,80px)] py-[clamp(70px,8vw,130px)]"><div className="rv">
        <h2 className="site-h2">Para quem não é</h2>
        <ul className="mt-8 flex flex-col gap-4 text-[18px]">{P.naoE.map(x => <li key={x} className="flex gap-3"><X className="w-5 h-5 text-terracota shrink-0 mt-1" />{x}</li>)}</ul>
      </div></div>
    </section>

    <section className="site-wrap py-[clamp(90px,11vw,180px)] grid lg:grid-cols-[4fr_8fr] gap-12" aria-labelledby="t-suporte">
      <div className="rv"><h2 id="t-suporte" className="site-h2">Entre os encontros, você não fica sozinha</h2>
        <p className="mt-4 text-[18px] max-w-[34ch]">Cada situação tem um caminho e um prazo. Assim nada fica sem resposta.</p></div>
      <div className="rv flex flex-col gap-3">
        {P.suporte.map(([s, onde, prazo], i) => (
          <div key={s} className={`rounded-[4px] px-6 py-5 grid sm:grid-cols-[1.1fr_1.3fr_auto] gap-x-6 gap-y-1 items-baseline ${i === P.suporte.length - 1 ? 'bg-[#f6e3dc]' : 'bg-folha'}`}>
            <p className="text-[18px] font-medium">{s}</p><p className="text-[16px]">{onde}</p><p className="text-[16px] font-medium text-oliva whitespace-nowrap">{prazo}</p>
          </div>
        ))}
      </div>
    </section>

    <section className="site-wrap pb-[clamp(90px,10vw,160px)] grid lg:grid-cols-[3fr_9fr] gap-10" aria-labelledby="t-faq-p">
      <div className="rv"><h2 id="t-faq-p" className="site-h2 !text-[clamp(32px,2.6vw,40px)]">Dúvidas sobre o programa</h2></div>
      <div className="rv lg:columns-2 gap-14 text-[18px] leading-[1.6]">
        {P.perguntas.map(([q, r]) => <p key={q} className="mb-6 break-inside-avoid"><b className="font-medium">{q}</b> <span>{r}</span></p>)}
      </div>
    </section>

    <section className="relative" aria-labelledby="t-fim-p">
      <div className="relative h-[70svh] lg:h-[80svh] overflow-hidden">
        <img src={VIDEO.src} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <video src={VIDEO.video} poster={VIDEO.src} muted loop playsInline autoPlay aria-hidden="true" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-texto/45" />
        <div className="absolute inset-0 site-wrap flex items-end pb-[9svh]">
          <div className="rv text-creme flex flex-col items-start gap-6 lg:ml-auto lg:w-[46%]">
            <h2 id="t-fim-p" className="site-display text-[clamp(42px,4vw,68px)]">Fale com a equipe</h2>
            <p className="text-[18px] max-w-[38ch]">Tire suas dúvidas sobre o programa, os formatos e as datas. A equipe responde e ajuda a marcar sua consulta inicial.</p>
            <Agendar claro rotulo="Quero falar com a equipe" />
          </div>
        </div>
      </div>
    </section>
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
