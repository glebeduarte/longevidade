import { Fragment, useEffect, useState, type ReactNode } from 'react'
import { Link, NavLink, Outlet, useLocation, useParams } from 'react-router-dom'
import { ArrowRight, ArrowUpRight, Check, Clock, MapPin, Menu, MessageCircle, X } from 'lucide-react'
import { useAuth } from '../../auth/AuthProvider'
import {
  CONTATO, FASES, INICIO, LOCAIS, NAV, PERGUNTAS, PROGRAMA, SOBRE, TEMAS, linkAgendar,
} from '../../lib/site'
import { CartaoMaterial, useMateriais } from './material'

/* Imagens do site: fotos da doutora, aplicações da marca e a metamorfose em vídeo. */
const FOTOS = {
  retrato: { src: '/dra-bartira.jpg', alt: 'Dra. Bartira Rebouças em seu consultório', foco: '50% 22%' },
  xicara: { src: '/site/xicara.jpg', alt: 'Xícara com a marca da Dra. Bartira Rebouças sobre mármore', foco: '45% 55%' },
  cartao: { src: '/site/cartao.jpg', alt: 'Cartões de visita da Dra. Bartira Rebouças', foco: '55% 50%' },
  pasta: { src: '/site/pasta.jpg', alt: 'Pasta com a marca da Dra. Bartira Rebouças: Toda transformação começa com o cuidado', foco: '50% 50%' },
  natal: { src: '/site/ponta-negra.jpg', alt: 'Morro do Careca visto da praia de Ponta Negra, em Natal, pela manhã', foco: '35% 50%' },
}
const VIDEO = { src: '/site/metamorfose.jpg', video: '/site/metamorfose.mp4', legenda: 'Uma monarca deixa a crisálida. Vídeo de Danmation, CC BY 3.0.' }
type Foto = { src: string; alt: string; foco?: string }
const QUADRO_VIDEO: Foto = { src: VIDEO.src, alt: '' }
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
/** Cabeçalho que sai do caminho ao descer e volta ao subir. */
function useTopoOculto() {
  const [oculto, setOculto] = useState(false)
  useEffect(() => {
    let ultimo = window.scrollY
    const f = () => { const y = window.scrollY; setOculto(y > 160 && y > ultimo); ultimo = y }
    window.addEventListener('scroll', f, { passive: true })
    return () => window.removeEventListener('scroll', f)
  }, [])
  return oculto
}

function Marca({ claro = false }: { claro?: boolean }) {
  return (
    <Link to="/" className="flex items-center gap-3 shrink-0 group" aria-label="Dra. Bartira Rebouças, início">
      <img src={claro ? '/marca/simbolo-claro.png' : '/marca/simbolo.png'} alt="" className="h-8 sm:h-9 w-auto transition-transform duration-700 group-hover:scale-110" />
      <span className="site-display text-[19px] sm:text-[23px] leading-none whitespace-nowrap">Dra. Bartira Rebouças</span>
    </Link>
  )
}

export function LayoutSite() {
  const { session, profile } = useAuth()
  const [menu, setMenu] = useState(false)
  const { pathname, hash } = useLocation()
  const oculto = useTopoOculto()
  useEffect(() => { setMenu(false); if (!hash) window.scrollTo(0, 0) }, [pathname, hash])
  useEffect(() => { document.body.style.overflow = menu ? 'hidden' : ''; return () => { document.body.style.overflow = '' } }, [menu])
  useRevelar(pathname)
  const area = !session ? { to: '/entrar', r: 'Área da paciente' } : profile?.role === 'paciente' ? { to: '/app', r: 'Abrir meu app' } : { to: '/painel', r: 'Ir para o painel' }

  return (
    <div className="site min-h-svh bg-fundo text-texto flex flex-col">
      <header className={`topo sticky top-0 z-30 bg-fundo ${oculto && !menu ? 'oculto' : ''}`}>
        <div className="site-wrap h-[80px] flex items-center gap-8">
          <Marca />
          <nav className="hidden lg:flex items-center gap-1 ml-auto" aria-label="Principal">
            {NAV.map(([to, r]) => (
              <NavLink key={to} to={to} className={({ isActive }) => `px-4 h-10 inline-flex items-center rounded-full text-[15px] transition-colors ${isActive ? 'bg-tom text-texto' : 'text-apoio hover:text-texto hover:bg-tom/60'}`}>{r}</NavLink>
            ))}
          </nav>
          <div className="hidden lg:flex items-center gap-5">
            <Link to={area.to} className="text-[15px] text-apoio hover:text-texto transition-colors">{area.r}</Link>
            <Agendar className="!h-11 !px-5 !text-[14px]" />
          </div>
          <button className="lg:hidden ml-auto shrink-0 h-11 px-3.5 inline-flex items-center gap-2 rounded-full bg-tom text-[15px]" onClick={() => setMenu(true)} aria-expanded={menu} aria-label="Abrir menu">
            <Menu className="w-5 h-5" />Menu
          </button>
        </div>
      </header>

      {menu && (
        <div className="menu-tela fixed inset-0 z-40 bg-cafe text-creme flex flex-col overflow-y-auto" role="dialog" aria-modal="true" aria-label="Menu">
          <div className="site-wrap h-[80px] flex items-center">
            <Marca claro />
            <button className="ml-auto h-11 px-4 inline-flex items-center gap-2 rounded-full bg-creme/10 text-[15px]" onClick={() => setMenu(false)} aria-label="Fechar menu"><X className="w-5 h-5" />Fechar</button>
          </div>
          <nav className="site-wrap flex-1 flex flex-col justify-center py-10" aria-label="Principal">
            <Link to="/" className="py-2 site-display text-[44px]">Início</Link>
            {NAV.map(([to, r], i) => <Link key={to} to={to} className="py-2 site-display text-[44px]" style={{ animationDelay: `${80 + i * 60}ms` }}>{r}</Link>)}
            <Link to={area.to} className="mt-6 py-2 text-[17px] text-areia">{area.r}</Link>
          </nav>
          <div className="site-wrap pb-10 flex flex-col gap-4">
            <Agendar claro />
            <p className="text-[14px] text-areia">{CONTATO.crm} · {CONTATO.rqe} · Natal</p>
          </div>
        </div>
      )}

      <main className="flex-1"><Outlet /></main>

      <footer className="site-wrap pt-20 pb-6 text-[14px] text-apoio">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <Link to="/" className="flex items-center gap-2 text-texto"><img src="/marca/simbolo.png" alt="" className="h-5 w-auto" />Dra. Bartira Rebouças</Link>
          <span>Endocrinologista · {CONTATO.crm} · {CONTATO.rqe}</span>
          <nav className="flex flex-wrap gap-x-5 gap-y-2 md:ml-auto" aria-label="Rodapé">
            {NAV.map(([to, r]) => <Link key={to} to={to} className="hover:text-texto transition-colors">{r}</Link>)}
            <a href={CONTATO.instagram} target="_blank" rel="noreferrer" className="hover:text-texto transition-colors">Instagram</a>
            <Link to="/privacidade" className="hover:text-texto transition-colors">Privacidade</Link>
          </nav>
        </div>
        <p className="mt-4 text-[14px] leading-relaxed text-apoio max-w-[75ch]">
          © {new Date().getFullYear()} · As informações deste site não substituem a consulta médica.
          Vídeo: <a className="underline" href="https://commons.wikimedia.org/wiki/File:Monarch_Butterfly_Emerging_from_Chrysalis.webm">"Monarch Butterfly Emerging from Chrysalis"</a>, Danmation, <a className="underline" href="https://creativecommons.org/licenses/by/3.0">CC BY 3.0</a>, recortado e acelerado.
          Foto: <a className="underline" href="https://commons.wikimedia.org/wiki/File:Vista_do_Morro_do_Careca_em_Ponta_Negra_pela_manh%C3%A3.jpg">"Vista do Morro do Careca em Ponta Negra pela manhã"</a>, Ppulbatu, <a className="underline" href="https://creativecommons.org/licenses/by/4.0">CC BY 4.0</a>.
        </p>
      </footer>

      {CONTATO.whatsapp && (
        <a href={linkAgendar()} target="_blank" rel="noreferrer" aria-label="Falar pelo WhatsApp"
          className="fixed right-4 bottom-4 z-30 w-14 h-14 rounded-full bg-cafe text-creme grid place-items-center transition-transform hover:scale-105">
          <MessageCircle className="w-6 h-6" />
        </a>
      )}
    </div>
  )
}

// ---------- Blocos ----------
/* O motivo da página: a volta oval da asa da borboleta. Ela vira a máscara de toda foto,
   o botão, o marcador das listas e a curva da faixa final. */

/** Foto dentro da asa. `abre` dá a ela a entrada de obturador (só na foto principal). */
function Asa({ f, className = '', video, abre = false }: { f: Foto; className?: string; video?: string; abre?: boolean }) {
  return (
    <div className={`asa-foto ${abre ? 'obturador' : ''} ${className}`}>
      {video
        ? <video src={video} poster={f.src} muted loop playsInline autoPlay aria-hidden="true" style={{ objectPosition: f.foco }} />
        : <img src={f.src} alt={f.alt} loading={abre ? 'eager' : 'lazy'} style={{ objectPosition: f.foco }} />}
    </div>
  )
}

/** Marcador de lista: a asa em tamanho de texto. */
const Ponto = ({ claro = false }: { claro?: boolean }) => <span aria-hidden="true" className={`inline-block w-[0.62em] h-[0.95em] rounded-[50%] rotate-[-24deg] shrink-0 mt-[0.32em] ${claro ? 'bg-areia' : 'bg-areia'}`} />

/** Foto em miniatura dentro da linha de texto. */
const Mini = ({ f, largo = false }: { f: Foto; largo?: boolean }) => (
  <span className={`mini ${largo ? 'w-[1.6em]' : 'w-[1em]'}`} aria-hidden="true"><img src={f.src} alt="" loading="lazy" style={{ objectPosition: f.foco }} /></span>
)

/** Texto e foto lado a lado. A foto vem dentro da asa. No celular o texto vem primeiro. */
function Duo({ f, video, inverso = false, id, rotulo, className = '', children }: { f: Foto; video?: string; inverso?: boolean; id?: string; rotulo?: string; className?: string; children: ReactNode }) {
  return (
    <section id={id} aria-labelledby={rotulo} className={`site-wrap grid lg:grid-cols-2 gap-x-[clamp(40px,6vw,120px)] gap-y-12 items-center py-[clamp(64px,8vw,140px)] ${className}`}>
      <div className={`rv order-2 flex justify-center ${inverso ? 'lg:order-2' : 'lg:order-1'}`}><Asa f={f} video={video} className="w-[min(100%,460px)] aspect-[3/4]" /></div>
      <div className={`min-w-0 order-1 ${inverso ? 'lg:order-1' : 'lg:order-2'}`}>{children}</div>
    </section>
  )
}

// ---------- Início ----------
export function SiteInicio() {
  usePagina('', INICIO.texto)
  return (<>
    {/* Abertura: a asa gigante entra pela direita, com a doutora dentro */}
    <section className="relative overflow-hidden lg:h-[calc(100svh-80px)] min-h-[620px]">
      <Asa f={FOTOS.retrato} abre className="hidden lg:block absolute w-[78svh] h-[118svh] left-[58%] top-[-12svh] rotate-[-14deg] !rounded-[50%]" />
      <div className="site-wrap relative h-full flex items-center py-14">
        <div className="rv flex flex-col lg:w-[50%]">
          <h1 className="site-display text-[clamp(52px,6.4vw,100px)] max-w-[9ch]">{INICIO.titulo}</h1>
          <p className="mt-7 text-[clamp(17px,1.3vw,19px)] leading-relaxed max-w-[36ch]">{INICIO.texto}</p>
          <div className="mt-9 flex flex-wrap items-center gap-x-7 gap-y-4">
            <Agendar />
            <Link to="/programa" className="site-link text-[17px]">Conheça o programa Longevidade</Link>
          </div>
          <p className="mt-10 text-[14px] text-apoio">{CONTATO.crm} · {CONTATO.rqe} · Natal</p>
        </div>
      </div>
      <div className="lg:hidden relative h-[78vw] overflow-hidden">
        <Asa f={FOTOS.retrato} abre className="absolute w-[92vw] h-[130vw] left-[4vw] top-0 !rounded-[50%]" />
      </div>
    </section>

    {/* Uma frase, com as fotos dentro da linha */}
    <section className="site-wrap py-[clamp(96px,18vh,200px)]" aria-label="O climatério">
      <p className="rv mx-auto max-w-[28ch] lg:max-w-[34ch] lg:text-center site-display text-[clamp(22px,2.5vw,36px)] leading-[1.25]">
        <span>Calorões à noite <Mini f={QUADRO_VIDEO} largo />, cansaço que não passa <Mini f={FOTOS.xicara} />, peso e humor que mudam <Mini f={FOTOS.natal} largo />: tudo isso tem nome, explicação e tratamento.</span>
      </p>
    </section>

    <Etapas />
    <Duo f={QUADRO_VIDEO} video={VIDEO.video} rotulo="t-fase" inverso className="!pt-0"><QualFase /></Duo>
    <Painel />
    <TemasFrase />
    <MateriaisHome />
    <Perguntas />
    <Fechamento />
  </>)
}

/** Como funciona: três etapas, cada uma maior que a anterior. */
function Etapas() {
  const e: Array<[string, string, Foto, string, string]> = [
    ['Primeiro, escutar', 'Consulta longa, com sua história, seus sintomas e seus exames.', FOTOS.cartao, 'bg-tom', 'lg:h-[34svh]'],
    ['Depois, um plano', 'Protocolo por escrito, com o porquê de cada escolha.', FOTOS.pasta, 'bg-areia', 'lg:h-[48svh]'],
    ['Então, acompanhar', 'Retornos e check-ins até ver a mudança nos exames e no dia a dia.', FOTOS.xicara, 'bg-cafe', 'lg:h-[64svh]'],
  ]
  return (
    <section className="site-wrap pb-[clamp(90px,10vw,170px)]" aria-labelledby="t-etapas">
      <div className="grid lg:grid-cols-12 gap-[10px] items-end">
        {e.map(([t, x, f, cor, h], i) => (
          <div key={t} className={`rv ${['lg:col-span-3', 'lg:col-span-4', 'lg:col-span-5'][i]} flex flex-col`}>
            {i === 0 && <h2 id="t-etapas" className="site-h2 mb-10 lg:mb-[14svh] max-w-[12ch]">Como eu cuido</h2>}
            <div className={`${cor} ${h} h-[60vw] rounded-[4px] grid place-items-center overflow-hidden`}>
              <Asa f={f} className="h-[80%] aspect-[3/4]" />
            </div>
            <p className="mt-4 text-[20px] font-medium">{t}</p>
            <p className="mt-1 text-[16px] text-apoio max-w-[36ch]">{x}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

/** Painel café: a carta da doutora, com o retrato cortado pela borda de baixo. */
function Painel() {
  return (
    <section className="px-[10px] sm:px-5" aria-labelledby="t-carta">
      <div className="relative bg-cafe text-creme rounded-[4px] overflow-hidden lg:min-h-[108svh] grid lg:grid-cols-[1fr_minmax(0,620px)] gap-10 p-[clamp(24px,4vw,56px)] pb-0 lg:pb-0">
        <div className="rv flex flex-col">
          <h2 id="t-carta" className="site-display text-[clamp(40px,4.4vw,64px)]">Antes da consulta</h2>
          <div className="hidden lg:flex flex-1 items-end justify-start pt-10">
            <Asa f={FOTOS.retrato} className="w-[min(34vw,520px)] aspect-[3/4] translate-y-[22%]" />
          </div>
        </div>
        <div className="rv flex flex-col gap-10 lg:pt-4 pb-10 lg:pb-20 text-[16px] leading-[1.7]">
          {SOBRE.paragrafos.map((p, i) => (
            <div key={i}>
              {i === 0 && <p className="text-[22px] mb-3">Por que eu faço assim</p>}
              <p className="text-creme/90 max-w-[46ch]">{p}</p>
            </div>
          ))}
          <div>
            <p className="site-display italic text-[30px]">Bartira Rebouças</p>
            <p className="text-[14px] text-areia mt-1">Endocrinologista · {CONTATO.crm}</p>
          </div>
          <div className="flex flex-wrap items-center gap-6"><Agendar claro /><Link to="/sobre" className="text-[16px] underline underline-offset-4 decoration-areia">Formação e trajetória</Link></div>
        </div>
        <div className="lg:hidden flex justify-center"><Asa f={FOTOS.retrato} className="w-[86vw] aspect-[3/4] translate-y-[25%] -mt-[10%]" /></div>
      </div>
    </section>
  )
}

/** Os temas como um parágrafo: cada assunto é um link, com sua foto na linha. */
function TemasFrase() {
  const [a, b, c, d] = TEMAS
  const L = ({ t }: { t: typeof a }) => t ? <Link to={`/temas/${t.slug}`} className="underline decoration-areia decoration-[2px] underline-offset-[6px] hover:decoration-cafe transition-colors">{t.titulo.toLowerCase()}</Link> : null
  return (
    <section className="site-wrap py-[clamp(96px,12vw,200px)]" aria-labelledby="t-temas">
      <h2 id="t-temas" className="sr-only">O que eu trato</h2>
      <p className="rv max-w-[40ch] site-display text-[clamp(22px,2.5vw,36px)] leading-[1.3]">
        <span>No consultório eu cuido de <L t={a} /> <Mini f={QUADRO_VIDEO} largo />, avalio com você a <L t={b} /> <Mini f={FOTOS.pasta} largo />, acompanho <L t={c} /> e trato <L t={d} /> <Mini f={FOTOS.xicara} largo />.</span>
      </p>
      <div className="rv mt-16 lg:ml-[50%] flex flex-col gap-6 max-w-[44ch]">
        <p className="text-[18px]">Sintomas e condições que mudam com os hormônios. Cada tema tem um texto curto para ler antes da consulta.</p>
        <Link to="/temas" className="site-btn self-start">Ver todos os temas<ArrowRight className="w-4 h-4" /></Link>
      </div>
    </section>
  )
}

/** Perguntas arquivadas como fichas com aba: uma aberta por vez. */
function Fichas({ itens, titulo, id }: { itens: Array<[string, string]>; titulo: string; id: string }) {
  const [aberta, setAberta] = useState(0)
  const cores = ['bg-tom', 'bg-folha']
  return (
    <section className="site-wrap py-[clamp(90px,10vw,170px)]" aria-labelledby={id}>
      <div className="lg:w-[66%] lg:mx-auto">
        <h2 id={id} className="rv site-h2 mb-12">{titulo}</h2>
        <div className="rv flex flex-col">
          {itens.map(([q, r], i) => (
            <div key={q} className={`rounded-[4px] ${aberta === i ? 'bg-areia' : cores[i % 2]} ${i ? 'mt-2' : ''} transition-colors`}>
              <button className="w-full text-left px-6 py-5 flex items-start gap-4" aria-expanded={aberta === i} onClick={() => setAberta(i)}>
                <span className="flex-1 text-[19px] font-medium">{q}</span>
                <span aria-hidden="true" className={`mt-1 w-5 h-7 rounded-[50%] border-2 border-cafe transition-colors ${aberta === i ? 'bg-cafe' : ''}`} />
              </button>
              {aberta === i && <p className="fase-resposta px-6 pb-8 text-[17px] leading-relaxed max-w-[56ch]">{r}</p>}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
const Perguntas = () => <Fichas itens={PERGUNTAS} titulo="Dúvidas comuns" id="t-faq" />

/** Lista completa de temas (página Temas e Conteúdos). */
function TemasMenu() {
  return (
    <section className="site-wrap py-[clamp(64px,8vw,140px)]" aria-label="Temas">
      <div className="rv grid md:grid-cols-2 gap-x-16">
        {TEMAS.map(t => (
          <Link key={t.slug} to={`/temas/${t.slug}`} className="group flex gap-4 py-6">
            <Ponto />
            <span>
              <span className="block site-display text-[clamp(26px,2.2vw,32px)] group-hover:text-cobre transition-colors">{t.titulo}</span>
              <span className="block mt-1.5 text-[17px] text-apoio max-w-[46ch]">{t.resumo}</span>
            </span>
          </Link>
        ))}
      </div>
    </section>
  )
}

/** Fecho de toda página: a faixa inteira é o botão, com a curva da asa no topo. */
function Fechamento() {
  const href = linkAgendar(), fora = externo(href)
  const dentro = (<>
    <span className="absolute left-[clamp(20px,6vw,96px)] top-[22%] text-[17px] sm:text-[20px] max-w-[30ch]">Fale com a equipe e escolha o melhor horário em Natal.</span>
    <ArrowUpRight className="absolute right-[clamp(20px,6vw,96px)] top-[21%] w-9 h-9 sm:w-12 sm:h-12" strokeWidth={1.4} aria-hidden="true" />
    <span className="site-display absolute left-0 right-0 bottom-3 text-center leading-[0.8] text-[clamp(64px,19vw,300px)]">Agendar</span>
  </>)
  const cls = 'fecho relative block mt-10 h-[46svh] sm:h-[60svh] bg-areia text-texto overflow-hidden'
  return fora
    ? <a href={href} target="_blank" rel="noreferrer" className={cls} aria-label="Agendar consulta">{dentro}</a>
    : <Link to={href} className={cls} aria-label="Agendar consulta">{dentro}</Link>
}

/** Abertura das páginas internas: título grande e uma frase. */
function Abertura({ titulo, texto }: { titulo: string; texto?: string }) {
  return (
    <section className="site-wrap pt-[clamp(48px,7vw,120px)] pb-[clamp(40px,5vw,80px)]">
      <div className="rv max-w-4xl">
        <h1 className="site-display text-[clamp(46px,5.4vw,88px)] max-w-[14ch]">{titulo}</h1>
        {texto && <p className="mt-6 text-[clamp(17px,1.3vw,20px)] leading-relaxed max-w-[44ch]">{texto}</p>}
      </div>
    </section>
  )
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


// ---------- Sobre ----------
export function SiteSobre() {
  usePagina('Sobre', SOBRE.resumo)
  return (<>
    <>
      <Duo f={FOTOS.retrato} inverso>
        <div className="rv">
          <h1 className="site-display text-[clamp(46px,5.2vw,84px)] max-w-[12ch]">Dra. Bartira Rebouças</h1>
          <p className="mt-6 text-[21px] leading-relaxed max-w-[36ch]">{SOBRE.resumo}</p>
          <div className="mt-8"><Agendar /></div>
        </div>
        <div className="rv mt-14 flex flex-col gap-6 max-w-[38ch] text-[18px] leading-[1.65]">
          {SOBRE.paragrafos.map((p, i) => <p key={i}>{p}</p>)}
        </div>
      </Duo>
      <Duo f={FOTOS.cartao} rotulo="t-formacao">
        <div className="rv">
          <h2 id="t-formacao" className="site-h2">Formação</h2>
          <ul className="mt-8 flex flex-col gap-4 text-[18px]">{SOBRE.formacao.map(f => <li key={f} className="bg-tom rounded-[4px] px-5 py-4">{f}</li>)}</ul>
          <p className="mt-6 text-[14px] text-apoio">{CONTATO.crm} · {CONTATO.rqe}</p>
          <div className="mt-10"><Agendar /></div>
        </div>
      </Duo>
    </>
    <Etapas />
    <Fechamento />
  </>)
}

// ---------- Programa ----------
const marca = (v: string | boolean, claro = false) => v === true ? <Check className={`w-5 h-5 mx-auto ${claro ? 'text-creme' : 'text-oliva'}`} aria-label="incluído" /> : v === false ? <span className={claro ? 'text-creme/60' : 'text-apoio/60'} aria-label="não incluído">·</span> : v

export function SitePrograma() {
  usePagina('Programa Longevidade', 'Acompanhamento de 6 ou 12 meses para mulheres no climatério: encontros, medidas comparadas, protocolo por escrito e check-in semanal.')
  const P = PROGRAMA
  return (<>
    <>
      <Duo f={QUADRO_VIDEO} inverso video={VIDEO.video}>
        <div className="rv">
          <h1 className="site-display text-[clamp(52px,6vw,96px)] max-w-[10ch]">{P.titulo}</h1>
          <p className="mt-6 text-[clamp(21px,1.6vw,26px)] leading-snug max-w-[26ch]">{P.sub}</p>
          <p className="mt-6 text-[18px] leading-relaxed max-w-[42ch]">{P.tese}</p>
          <div className="mt-10 flex flex-wrap items-center gap-x-7 gap-y-4"><Agendar rotulo="Quero falar com a equipe" /><a href="#comparativo" className="site-link text-[18px]">Ver os formatos</a></div>
        </div>
      </Duo>

      <Duo f={FOTOS.pasta} rotulo="t-jornada">
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
      </Duo>

      <Duo f={FOTOS.xicara} inverso rotulo="t-medidas">
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
      </Duo>

      <Duo f={FOTOS.cartao} rotulo="t-entregas">
        <div className="rv"><h2 id="t-entregas" className="site-h2">O que você recebe</h2>
          <p className="mt-4 text-[18px] max-w-[40ch]">Documentos por escrito e um app para levar o acompanhamento no bolso.</p></div>
        <dl className="rv mt-10 grid sm:grid-cols-2 gap-x-8 gap-y-8">
          {P.entregas.map(([t, x]) => <div key={t}><dt className="site-display text-[32px] leading-tight">{t}</dt><dd className="mt-2 text-[18px] leading-relaxed">{x}</dd></div>)}
        </dl>
      </Duo>
    </>

    <section className="bg-cafe text-creme py-[clamp(90px,11vw,180px)]" aria-labelledby="t-tempo">
      <div className="site-wrap">
        <div className="rv max-w-3xl"><h2 id="t-tempo" className="site-h2">Por que seis meses</h2>
          <p className="mt-4 text-[18px] text-areia max-w-[48ch]">Cada parte do corpo responde no seu tempo. O programa acompanha todos eles, um de cada vez.</p></div>
        <ol className="rv tempo-linha mt-16 grid sm:grid-cols-5 gap-10 sm:gap-6 relative">
          <span className="tempo-barra hidden sm:block absolute left-0 right-0 top-[27px] h-[6px] rounded-full bg-areia/25" aria-hidden="true"><span className="block h-full rounded-full bg-areia origin-left" /></span>
          {P.tempos.map(([q, t, x], i) => (
            <li key={q} className="relative flex flex-col">
              <span className="relative z-10 w-[60px] h-[60px] rounded-full bg-cafe grid place-items-center" aria-hidden="true">
                <img src="/marca/simbolo-claro.png" alt="" className="h-auto" style={{ width: 22 + i * 6 }} />
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

    <section className="site-wrap py-[clamp(90px,11vw,180px)] grid lg:grid-cols-[5fr_7fr] gap-12" aria-labelledby="t-suporte">
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

    <Fichas itens={P.perguntas} titulo="Dúvidas sobre o programa" id="t-faq-p" />

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
  const foto = [FOTOS.xicara, FOTOS.pasta, FOTOS.cartao, FOTOS.retrato][TEMAS.indexOf(t) % 4]
  const outros = TEMAS.filter(x => x.slug !== t.slug).slice(0, 4)
  return (
    <Fragment key={t.slug}>
      <Duo f={foto} inverso>
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
      </Duo>
    <Etapas />
    <Fechamento /></Fragment>
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
    <>
      <Duo f={FOTOS.natal} inverso id="agendar">
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
      </Duo>
    </>
    <Etapas />
    <Perguntas />
    
    <Fechamento />
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
