import { Fragment, useEffect, useState, type ReactNode } from 'react'
import { Link, NavLink, Outlet, useLocation, useParams } from 'react-router-dom'
import { ArrowRight, Check, ChevronDown, ClipboardList, FileText, LineChart, Smartphone, Stethoscope, type LucideIcon, Clock, MapPin, Menu, MessageCircle, Phone, X } from 'lucide-react'
import { useAuth } from '../../auth/AuthProvider'
import {
  CONTATO, DEPOIMENTOS, DUVIDAS_INICIAIS, FASES, INICIO, LOCAIS, NAV, PERGUNTAS, PROGRAMA, SOBRE, TEMAS, linkAgendar,
} from '../../lib/site'
import { Livro, useMateriais } from './material'

/* Imagens do site: fotos da doutora, aplicações da marca e a metamorfose em vídeo. */
const FOTOS = {
  retrato: { src: '/dra-bartira.jpg', alt: 'Dra. Bartira Rebouças no consultório', foco: '50% 22%' },
  rosto: { src: '/dra-bartira-rosto.jpg', alt: 'Dra. Bartira Rebouças', foco: '50% 40%' },
  mapa: { src: '/site/m-mapa.jpg', alt: 'Mapa da Saúde: a nota e o perfil de cada área', foco: '60% 50%' },
  protocolo: { src: '/site/m-protocolo.jpg', alt: 'Plano de cuidado por escrito, com cada escolha explicada', foco: '50% 50%' },
  checkin: { src: '/site/m-checkin.jpg', alt: 'Check-in da semana no app da paciente', foco: '50% 50%' },
  inicio: { src: '/site/m-inicio.jpg', alt: 'Tela inicial do app, com a resposta da equipe', foco: '50% 50%' },
  evolucao: { src: '/site/m-evolucao.jpg', alt: 'Evolução das medidas no app', foco: '50% 50%' },
  equilibre: { src: '/site/local-equilibre.jpg', alt: 'Recepção da Clínica Equilibre, no Tirol', foco: '50% 60%' },
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
  useEffect(() => { setMenu(false); if (!hash) window.scrollTo(0, 0) }, [pathname, hash])
  useEffect(() => { document.body.style.overflow = menu ? 'hidden' : ''; return () => { document.body.style.overflow = '' } }, [menu])
  useRevelar(pathname)
  const area = !session ? { to: '/entrar', r: 'Área da paciente' } : profile?.role === 'paciente' ? { to: '/app', r: 'Abrir meu app' } : { to: '/painel', r: 'Ir para o painel' }

  return (
    <div className="site min-h-svh bg-fundo text-texto flex flex-col">
      <header className={`topo sticky top-0 z-30 bg-fundo `}>
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
            <a href={CONTATO.youtube} target="_blank" rel="noreferrer" className="hover:text-texto transition-colors">YouTube</a>
            <a href={CONTATO.facebook} target="_blank" rel="noreferrer" className="hover:text-texto transition-colors">Facebook</a>
            <Link to="/privacidade" className="hover:text-texto transition-colors">Privacidade</Link>
          </nav>
        </div>
        <p className="mt-4 text-[14px] leading-relaxed text-apoio max-w-[75ch]">
          © {new Date().getFullYear()} · CNPJ {CONTATO.cnpj} · As informações deste site não substituem a consulta médica.
          Vídeo: <a className="underline" href="https://commons.wikimedia.org/wiki/File:Monarch_Butterfly_Emerging_from_Chrysalis.webm">"Monarch Butterfly Emerging from Chrysalis"</a>, Danmation, <a className="underline" href="https://creativecommons.org/licenses/by/3.0">CC BY 3.0</a>, recortado e acelerado.
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
/* Direção: fotografias em tamanhos desiguais, penduradas como provas numa parede.
   As imagens são o app de verdade, os documentos que a paciente recebe e a própria doutora. */

/** Uma prova: foto de cantos retos, que pode abrir como obturador. */
function Prova({ f, className = '', video, abre = false, legenda }: { f: Foto; className?: string; video?: string; abre?: boolean; legenda?: string }) {
  return (
    <figure className={className}>
      <div className={`prova ${abre ? 'obturador' : ''} h-full`}>
        {video
          ? <video src={video} poster={f.src} muted loop playsInline autoPlay aria-hidden="true" style={{ objectPosition: f.foco }} />
          : <img src={f.src} alt={f.alt} loading={abre ? 'eager' : 'lazy'} style={{ objectPosition: f.foco }} />}
      </div>
      {legenda && <figcaption className="mt-3 text-[14px] text-apoio">{legenda}</figcaption>}
    </figure>
  )
}

/** Texto e uma prova lado a lado (páginas internas). No celular o texto vem primeiro. */
function Duo({ f, video, inverso = false, id, rotulo, className = '', children }: { f: Foto; video?: string; inverso?: boolean; id?: string; rotulo?: string; className?: string; children: ReactNode }) {
  return (
    <section id={id} aria-labelledby={rotulo} className={`site-wrap grid lg:grid-cols-12 gap-x-6 gap-y-12 items-start py-[clamp(72px,9vw,160px)] ${className}`}>
      <div className={`rv order-2 ${inverso ? 'lg:order-2 lg:col-start-8 lg:col-span-5 lg:mt-24' : 'lg:order-1 lg:col-span-5'}`}><Prova f={f} video={video} className="aspect-[4/5]" /></div>
      <div className={`min-w-0 order-1 ${inverso ? 'lg:order-1 lg:col-span-6' : 'lg:order-2 lg:col-start-7 lg:col-span-6 lg:mt-24'}`}>{children}</div>
    </section>
  )
}


// ---------- Início ----------
export function SiteInicio() {
  usePagina('', INICIO.texto)
  return (<>
    {/* 1. Quem é e o que faz */}
    <section className="relative overflow-hidden">
      <div aria-hidden="true" className="textura absolute inset-y-0 left-0 w-[58%] hidden lg:block" />
      <div className="site-wrap relative grid lg:grid-cols-12 gap-x-6 gap-y-10 items-center lg:min-h-[calc(100svh-80px)] pt-6 pb-16 lg:py-10">
        <div className="rv lg:col-span-6 flex flex-col">
          <h1 className="site-display text-[clamp(48px,6vw,96px)] max-w-[11ch]">Ciência e acolhimento</h1>
          <p className="mt-7 text-[clamp(17px,1.35vw,20px)] leading-relaxed max-w-[40ch]">Sou a Dra. Bartira Rebouças, endocrinologista em Natal. Cuido da saúde metabólica e hormonal, com atenção especial às mulheres no climatério, usando exames, escuta e um plano de cuidado por escrito.</p>
          <div className="mt-9 flex flex-wrap items-center gap-x-7 gap-y-4"><Agendar /><a href="#programa" className="site-link text-[17px]">Como eu acompanho você</a></div>
          <p className="mt-10 text-[14px] text-apoio">{CONTATO.crm} · {CONTATO.rqe} · Clínica Equilibre e Instituto Espinel</p>
        </div>
        <div className="lg:col-start-8 lg:col-span-5"><Prova f={FOTOS.retrato} abre className="aspect-[4/5] max-h-[82svh]" /></div>
      </div>
    </section>

    {/* 2. Identificação: palco leve, o vídeo fica enquanto os sintomas passam */}
    <Reconhece />
    <DuvidasIniciais />

    {/* 3. Quem é a Bartira */}
    <section className="bg-cafe text-creme relative overflow-hidden" aria-labelledby="t-quem">
      <div aria-hidden="true" className="textura textura-clara absolute inset-0" />
      <div className="site-wrap relative grid lg:grid-cols-12 gap-x-6 gap-y-12 py-[clamp(90px,11vw,180px)] items-center">
        <div className="rv lg:col-span-5"><Prova f={{ ...FOTOS.retrato, foco: '50% 30%' }} className="aspect-[4/5]" /></div>
        <div className="rv lg:col-start-7 lg:col-span-6 flex flex-col gap-6 text-[17px] leading-[1.7]">
          <h2 id="t-quem" className="site-h2">Quem vai cuidar de você</h2>
          {SOBRE.paragrafos.slice(0, 2).map((p, i) => <p key={i} className={i ? 'text-creme/90' : ''}>{p}</p>)}
          <div className="flex flex-wrap items-center gap-6 mt-2"><p className="site-display italic text-[30px]">Bartira Rebouças</p><Link to="/sobre" className="underline underline-offset-4 decoration-areia hover:decoration-creme">Formação e trajetória</Link></div>
          <dl className="grid grid-cols-2 gap-x-8 gap-y-4 mt-2 text-[16px]">
            <div><dt className="text-areia text-[14px]">Especialidade</dt><dd>Endocrinologia e metabologia</dd></div>
            <div><dt className="text-areia text-[14px]">Registro</dt><dd>{CONTATO.crm} · {CONTATO.rqe}</dd></div>
            <div><dt className="text-areia text-[14px]">Foco</dt><dd>Saúde metabólica, climatério e longevidade</dd></div>
            <div><dt className="text-areia text-[14px]">Atende em</dt><dd>{LOCAIS.map(l => l.nome).join(' e ')}, Natal</dd></div>
          </dl>
        </div>
      </div>
    </section>

    <TemasLista />

    {/* 4. O que muda para você: a fase */}
    <QualFase />

    {/* 5. O programa em etapas */}
    <Jornada />

    <Depoimentos />
    <MateriaisHome />
    <Perguntas />
    <Fechamento />
  </>)
}

/** As três perguntas mais comuns na primeira consulta. */
function DuvidasIniciais() {
  return (
    <section className="site-wrap py-[clamp(80px,10vw,150px)]" aria-labelledby="t-duvidas">
      <h2 id="t-duvidas" className="rv site-h2 max-w-3xl">As perguntas que mais escuto na primeira consulta</h2>
      <ol className="rv mt-10 grid md:grid-cols-3 gap-4">
        {DUVIDAS_INICIAIS.map((d, i) => (
          <li key={d} className="bg-tom p-8 flex flex-col gap-4">
            <span className="text-[14px] tracking-[0.18em] uppercase text-apoio">{String(i + 1).padStart(2, '0')}</span>
            <p className="site-display text-[26px] leading-snug">{d}</p>
          </li>
        ))}
      </ol>
      <p className="rv mt-8 text-[17px] max-w-[60ch]">Cada uma tem resposta, e ela depende da sua história. É por isso que a consulta começa pela escuta e pelos seus exames.</p>
    </section>
  )
}

/** Depoimentos: levam às avaliações públicas, sem reescrever o que as pacientes disseram. */
function Depoimentos() {
  return (
    <section className="bg-areia/50" aria-labelledby="t-depo">
      <div className="site-wrap py-[clamp(80px,10vw,150px)]">
        <div className="rv grid lg:grid-cols-12 gap-8 items-end">
          <div className="lg:col-span-7">
            <h2 id="t-depo" className="site-h2">{DEPOIMENTOS.titulo}</h2>
            <p className="mt-5 text-[18px] max-w-[52ch]">{DEPOIMENTOS.texto}</p>
          </div>
          <div className="lg:col-span-5 flex flex-wrap gap-x-7 gap-y-4 lg:justify-end">
            <a href={CONTATO.avaliacoesDoctoralia} target="_blank" rel="noreferrer" className="site-link text-[17px]">Todas no Doctoralia</a>
            <a href={CONTATO.avaliacoesGoogle} target="_blank" rel="noreferrer" className="site-link text-[17px]">Avaliações no Google</a>
          </div>
        </div>
        <ul className="rv mt-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {DEPOIMENTOS.itens.map(d => (
            <li key={d.autor} className="bg-fundo p-8 flex flex-col gap-5">
              <p className="site-display text-[24px] leading-snug">“{d.texto}”</p>
              <p className="mt-auto text-[15px] text-apoio">{d.autor} · {d.data} · Doctoralia</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

/** Você se reconhece? Duas colunas: o vídeo fica parado enquanto as frases passam. */
function Reconhece() {
  const frases = [
    ['Acorda de madrugada ', 'com calor', ' e não consegue voltar a dormir.'],
    ['Sente um ', 'cansaço que não passa', ' nem nos fins de semana.'],
    ['Vê o ', 'peso mudar de lugar', ', mesmo comendo como sempre.'],
    ['Percebe o ', 'humor oscilar', ' sem um motivo claro.'],
    ['', 'Esquece palavras', ' e perde o fio da conversa.'],
    ['Ouviu que isso é ', 'da idade', ' e que é só aguentar.'],
  ]
  return (
    <section className="bg-tom" aria-labelledby="t-reconhece">
      <div className="site-wrap grid lg:grid-cols-12 gap-x-6 gap-y-10 py-[clamp(90px,11vw,180px)]">
        <div className="lg:col-span-5">
          <div className="lg:sticky lg:top-28">
            <h2 id="t-reconhece" className="rv site-h2">Você se reconhece?</h2>
            <p className="rv mt-4 text-[17px] max-w-[36ch]">Muitas mulheres chegam ao consultório achando que estão sozinhas nisso.</p>
            <Prova f={QUADRO_VIDEO} video={VIDEO.video} className="mt-10 aspect-[4/3] hidden lg:block" legenda={VIDEO.legenda} />
          </div>
        </div>
        <div className="lg:col-start-7 lg:col-span-6 flex flex-col">
          {frases.map(([a, chave, b]) => (
            <p key={chave} className="rv lg:min-h-[34svh] flex items-center"><span className="site-display text-[22px] lg:text-[clamp(26px,2.4vw,34px)] leading-[1.3] max-w-[24ch]">{a}<strong className="font-semibold text-terracota">{chave}</strong>{b}</span></p>
          ))}
          <div className="rv mt-10 lg:mt-0 bg-cafe text-creme p-8">
            <p className="text-[20px] font-medium">Tudo isso tem nome, explicação e tratamento.</p>
            <p className="mt-2 text-[17px] text-creme/90">O climatério é uma transição, como a da lagarta para a borboleta. Cada fase pede um cuidado diferente.</p>
          </div>
        </div>
      </div>
    </section>
  )
}

/** O programa Longevidade em etapas, cada uma com ícone e uma tela ou documento de exemplo. */
function Jornada({ titulo = 'O programa Longevidade', cta = true }: { titulo?: string; cta?: boolean }) {
  const e: Array<[LucideIcon, string, string, Foto]> = [
    [ClipboardList, 'Antes do primeiro encontro', 'Você responde os questionários no app e faz os exames pedidos.', FOTOS.inicio],
    [Stethoscope, 'Consulta inicial', 'Uma conversa longa sobre sua história, seus sintomas e seus riscos.', FOTOS.retrato],
    [FileText, 'Plano por escrito', 'O plano de cuidado com o porquê de cada escolha e o Mapa da Saúde.', FOTOS.protocolo],
    [Smartphone, 'Check-in toda semana', 'Pelo app. A equipe lê, responde e avisa a doutora quando precisa.', FOTOS.checkin],
    [LineChart, 'Encontros de seguimento', 'Nos meses 3 e 6, as mesmas medidas, comparadas com o começo.', FOTOS.evolucao],
  ]
  const [ativa, setAtiva] = useState(0)
  return (
    <section id="programa" className="scroll-mt-20 py-[clamp(90px,11vw,180px)] relative overflow-hidden" aria-labelledby="t-jornada">
      <div className="site-wrap grid lg:grid-cols-12 gap-x-6 gap-y-12">
        <div className="lg:col-span-6">
          <h2 id="t-jornada" className="rv site-h2">{titulo}</h2>
          <p className="rv mt-4 text-[17px] max-w-[44ch]">Seis meses de acompanhamento, com começo, meio e fim. Cada etapa prepara a próxima.</p>
          <ol className="rv mt-10 flex flex-col gap-2">
            {e.map(([Icone, t, x], i) => (
              <li key={t}>
                <button onMouseEnter={() => setAtiva(i)} onFocus={() => setAtiva(i)} onClick={() => setAtiva(i)} aria-pressed={ativa === i}
                  className={`etapa w-full text-left flex gap-5 items-start px-5 py-4 transition-colors ${ativa === i ? 'bg-cafe text-creme' : 'bg-tom hover:bg-ativo'}`}>
                  <span className={`w-11 h-11 rounded-full grid place-items-center shrink-0 ${ativa === i ? 'bg-creme/15' : 'bg-folha'}`}><Icone className="w-5 h-5" strokeWidth={1.6} /></span>
                  <span><span className="block text-[18px] font-medium">{t}</span><span className={`block mt-0.5 text-[16px] ${ativa === i ? 'text-creme/90' : ''}`}>{x}</span></span>
                </button>
              </li>
            ))}
          </ol>
          {cta && <div className="rv mt-10 flex flex-wrap items-center gap-6"><Link to="/programa" className="site-btn">Conhecer o programa<ArrowRight className="w-4 h-4" /></Link><span className="text-[15px] text-apoio">Formatos de 6 ou 12 meses</span></div>}
        </div>
        <div className="lg:col-start-8 lg:col-span-5">
          <div className="lg:sticky lg:top-28 relative aspect-[4/5] bg-areia overflow-hidden">
            {e.map(([, t, , f], i) => (
              <img key={t} src={f.src} alt={i === ativa ? f.alt : ''} aria-hidden={i !== ativa} loading="lazy"
                className={`absolute inset-0 w-full h-full object-cover transition-[opacity,transform] duration-700 ${i === ativa ? 'opacity-100 scale-100' : 'opacity-0 scale-[1.04]'}`} style={{ objectPosition: f.foco }} />
            ))}
          </div>
          <p className="mt-3 text-[14px] text-apoio">Telas e documentos de exemplo, com dados fictícios.</p>
        </div>
      </div>
    </section>
  )
}




/** Temas em duas colunas de links. */
function TemasLista() {
  return (
    <section className="site-wrap py-[clamp(80px,10vw,160px)] grid lg:grid-cols-12 gap-x-6 gap-y-10" aria-labelledby="t-temas">
      <div className="rv lg:col-span-4">
        <h2 id="t-temas" className="site-h2">O que eu trato</h2>
        <p className="mt-5 text-[17px] max-w-[34ch]">Sintomas e condições que mudam com os hormônios. Cada tema tem um texto curto para ler antes da consulta.</p>
      </div>
      <div className="rv lg:col-span-8 grid md:grid-cols-2 gap-x-10">
        {TEMAS.map(t => (
          <Link key={t.slug} to={`/temas/${t.slug}`} className="group py-5">
            <span className="flex items-center gap-3 site-display text-[clamp(24px,2vw,30px)] group-hover:text-cobre transition-colors">{t.titulo}<ArrowRight className="w-5 h-5 shrink-0 transition-transform group-hover:translate-x-1" /></span>
            <span className="block mt-1.5 text-[16px] text-apoio max-w-[44ch]">{t.resumo}</span>
          </Link>
        ))}
      </div>
    </section>
  )
}
const TemasMenu = TemasLista

/** Dúvidas: perguntas abertas uma a uma, ao lado de duas provas. */
function Fichas({ itens, titulo, id }: { itens: Array<[string, string]>; titulo: string; id: string }) {
  return (
    <section className="bg-tom" aria-labelledby={id}>
      <div className="site-wrap grid lg:grid-cols-12 gap-x-6 gap-y-14 py-[clamp(80px,10vw,160px)]">
        <div className="rv lg:col-span-5">
          <h2 id={id} className="site-h2">{titulo}</h2>
          <ul className="mt-6 flex flex-col gap-1 text-[17px]">
            {LOCAIS.map(l => <li key={l.nome}>{l.nome}, Natal</li>)}
            <li>Consulta presencial e teleconsulta</li>
          </ul>
          <div className="mt-10 flex flex-col gap-7">
            {itens.map(([q, r], i) => (
              <details key={q} open={i === 0} className="pergunta group">
                <summary className="flex items-start gap-4 cursor-pointer list-none text-[19px] font-medium">
                  <span className="flex-1">{q}</span><ChevronDown className="w-5 h-5 mt-1 transition-transform group-open:rotate-180" />
                </summary>
                <p className="mt-3 text-[17px] leading-relaxed max-w-[52ch]">{r}</p>
              </details>
            ))}
          </div>
          <div className="mt-10 flex flex-wrap items-center gap-6"><Agendar /><Link to="/programa" className="site-link text-[16px]">Ver o programa</Link></div>
        </div>
        <div className="rv lg:col-start-7 lg:col-span-6 relative lg:-mt-[clamp(80px,10vw,160px)]">
          <Prova f={FOTOS.inicio} className="aspect-[3/4]" />
        </div>
      </div>
    </section>
  )
}
const Perguntas = () => <Fichas itens={PERGUNTAS} titulo="Dúvidas comuns" id="t-faq" />

/** Fecho de toda página: a última foto, com o convite na metade calma. */
function Fechamento() {
  return (
    <section className="bg-cafe text-creme relative overflow-hidden" aria-labelledby="t-fim">
      <div aria-hidden="true" className="textura textura-clara absolute inset-0" />
      <div className="rv site-wrap relative py-[clamp(80px,10vw,150px)] flex flex-col items-start gap-6">
        <h2 id="t-fim" className="site-display text-[clamp(36px,3.4vw,56px)]">Vamos começar pela conversa</h2>
        <p className="text-[17px] max-w-[44ch]">A equipe ajuda a escolher o local e o horário, e explica como se preparar para a primeira consulta.</p>
        <Agendar claro />
      </div>
    </section>
  )
}

/** Abertura das páginas internas, no mesmo desenho da home: texto sobre a textura da logo e uma foto que abre. */
function Cabeca({ titulo, texto, f, video, children }: { titulo: string; texto: string; f: Foto; video?: string; children?: ReactNode }) {
  return (
    <section className="relative overflow-hidden">
      <div aria-hidden="true" className="textura absolute inset-y-0 left-0 w-[58%] hidden lg:block" />
      <div className="site-wrap relative grid lg:grid-cols-12 gap-x-6 gap-y-10 items-center lg:min-h-[calc(88svh-80px)] pt-6 pb-16 lg:py-14">
        <div className="rv lg:col-span-6 flex flex-col">
          <h1 className="site-display text-[clamp(44px,5vw,80px)] max-w-[12ch]">{titulo}</h1>
          <p className="mt-6 text-[clamp(17px,1.35vw,20px)] leading-relaxed max-w-[42ch]">{texto}</p>
          {children}
        </div>
        <div className="lg:col-start-8 lg:col-span-5"><Prova f={f} video={video} abre className="aspect-[4/5] max-h-[78svh]" /></div>
      </div>
    </section>
  )
}

/** Abertura simples (páginas de texto). */
function Abertura({ titulo, texto }: { titulo: string; texto?: string }) {
  return (
    <section className="relative overflow-hidden">
      <div aria-hidden="true" className="textura absolute inset-0" />
      <div className="site-wrap relative pt-[clamp(48px,7vw,120px)] pb-[clamp(48px,6vw,100px)]"><div className="rv max-w-4xl">
        <h1 className="site-display text-[clamp(44px,5vw,80px)] max-w-[14ch]">{titulo}</h1>
        {texto && <p className="mt-6 text-[clamp(17px,1.3vw,20px)] leading-relaxed max-w-[44ch]">{texto}</p>}
      </div></div>
    </section>
  )
}

/** Em que fase você está: pergunta à esquerda, resposta à direita. */
function QualFase() {
  const [id, setId] = useState<string | null>(null)
  const f = FASES.find(x => x.id === id)
  return (
    <section className="site-wrap py-[clamp(80px,10vw,180px)] grid lg:grid-cols-12 gap-x-6 gap-y-10 items-start" aria-labelledby="t-fase">
      <div className="lg:col-span-6">
        <div className="rv"><h2 id="t-fase" className="site-h2">Em que fase você está?</h2>
          <p className="mt-4 text-[17px] max-w-[40ch]">Escolha o que mais se parece com a sua menstruação hoje.</p></div>
        <div className="rv mt-8 flex flex-col gap-2" role="radiogroup" aria-label="Como está sua menstruação">
          {FASES.map(x => (
            <button key={x.id} role="radio" aria-checked={id === x.id} onClick={() => setId(x.id)}
              className={`fase-opcao text-left px-5 py-4 text-[17px] ${id === x.id ? 'bg-cafe text-creme' : 'bg-tom hover:bg-ativo'}`}>{x.pergunta}</button>
          ))}
        </div>
      </div>
      <div className="lg:col-start-8 lg:col-span-5 lg:mt-24" aria-live="polite">
        {f ? (
          <div key={f.id} className="fase-resposta">
            <p className="site-display text-[clamp(32px,3vw,48px)]">{f.fase}</p>
            <p className="mt-4 text-[17px] leading-relaxed">{f.texto}</p>
            <p className="mt-3 text-[17px] leading-relaxed font-medium">{f.cuidado}</p>
            <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-3"><Agendar rotulo="Quero uma avaliação" /></div>
            <p className="mt-4 text-[14px] text-apoio">Orientação geral. A fase é confirmada na consulta.</p>
          </div>
        ) : (
          <div className="rv"><Prova f={FOTOS.evolucao} className="aspect-[4/5] max-w-[420px]" legenda="Na consulta, a fase vira um plano. No app, você acompanha a evolução." /></div>
        )}
      </div>
    </section>
  )
}

function MateriaisHome() {
  const lista = useMateriais()
  if (!lista?.length) return null
  return (
    <section className="relative overflow-hidden bg-areia/50" aria-labelledby="t-mat">
      <div aria-hidden="true" className="textura absolute inset-0" />
      <div className="site-wrap relative py-[clamp(90px,11vw,180px)] grid lg:grid-cols-12 gap-x-6 gap-y-12 items-start">
        <div className="rv lg:col-span-4">
          <h2 id="t-mat" className="site-h2">Para ler com calma</h2>
          <p className="mt-4 text-[17px] max-w-[34ch]">Materiais gratuitos escritos pela Dra. Bartira, para entender o que está mudando no seu corpo.</p>
          <Link to="/conteudos" className="site-link mt-6 inline-block text-[16px]">Ver todos os conteúdos</Link>
        </div>
        <div className="rv lg:col-start-6 lg:col-span-7 grid sm:grid-cols-2 gap-x-8 gap-y-14">
          {lista.map(m => <Livro key={m.id} m={m} />)}
        </div>
      </div>
    </section>
  )
}

// ---------- Sobre ----------
export function SiteSobre() {
  usePagina('Sobre', SOBRE.resumo)
  return (<>
    <Cabeca titulo="Dra. Bartira Rebouças" texto={SOBRE.resumo} f={FOTOS.retrato}>
      <div className="mt-9 flex flex-wrap items-center gap-x-7 gap-y-4"><Agendar /><Link to="/programa" className="site-link text-[17px]">O programa Longevidade</Link></div>
      <p className="mt-10 text-[14px] text-apoio">{CONTATO.crm} · {CONTATO.rqe} · Natal</p>
    </Cabeca>
    <section className="bg-cafe text-creme relative overflow-hidden" aria-labelledby="t-porque">
      <div aria-hidden="true" className="textura textura-clara absolute inset-0" />
      <div className="site-wrap relative grid lg:grid-cols-12 gap-x-6 gap-y-12 py-[clamp(90px,11vw,180px)]">
        <div className="rv lg:col-span-6 flex flex-col gap-6 text-[17px] leading-[1.7]">
          <h2 id="t-porque" className="site-h2">Por que eu faço assim</h2>
          {SOBRE.paragrafos.map((p, i) => <p key={i} className={i ? 'text-creme/90' : ''}>{p}</p>)}
          <p className="site-display italic text-[30px]">Bartira Rebouças</p>
        </div>
        <div className="rv lg:col-start-8 lg:col-span-5">
          <h2 className="text-[20px] font-medium">Formação</h2>
          <ul className="mt-6 flex flex-col gap-2 text-[17px]">{SOBRE.formacao.map(f => <li key={f} className="bg-creme/10 px-5 py-4">{f}</li>)}</ul>
          <h2 className="mt-10 text-[20px] font-medium">Atualização contínua</h2>
          <ul className="mt-6 flex flex-col gap-2 text-[17px]">{SOBRE.atualizacao.map(f => <li key={f} className="bg-creme/10 px-5 py-4">{f}</li>)}</ul>
          <p className="mt-6 text-[14px] text-areia">{CONTATO.crm} · {CONTATO.rqe} · <a href={CONTATO.lattes} target="_blank" rel="noreferrer" className="underline underline-offset-4">Currículo Lattes</a></p>
        </div>
      </div>
    </section>
    <Jornada titulo="Como eu acompanho você" />
    <MateriaisHome />
    <Fechamento />
  </>)
}

// ---------- Programa ----------
const marca = (v: string | boolean, claro = false) => v === true ? <Check className={`w-5 h-5 mx-auto ${claro ? 'text-creme' : 'text-oliva'}`} aria-label="incluído" /> : v === false ? <span className={claro ? 'text-creme/60' : 'text-apoio/60'} aria-label="não incluído">·</span> : v

export function SitePrograma() {
  usePagina('Programa Longevidade', 'Jornada estruturada de cuidado: avaliação dos pilares de saúde, encontros, medidas comparadas, plano de cuidado por escrito e check-in semanal.')
  const P = PROGRAMA
  return (<>
    <>
      <Cabeca titulo={P.titulo} texto={P.tese} f={QUADRO_VIDEO} video={VIDEO.video}>
        <p className="mt-5 text-[clamp(19px,1.5vw,23px)] leading-snug max-w-[30ch] font-medium">{P.sub}</p>
        <div className="mt-9 flex flex-wrap items-center gap-x-7 gap-y-4"><Agendar rotulo="Quero falar com a equipe" /><a href="#comparativo" className="site-link text-[17px]">Ver os formatos</a></div>
      </Cabeca>
      <Jornada titulo="Como o programa acontece" cta={false} />
      <Duo f={FOTOS.checkin} inverso rotulo="t-medidas">
        <div className="rv lg:col-span-full mb-[clamp(60px,8vw,120px)]"><h2 id="t-pilares" className="site-h2">{P.pilares.titulo}</h2>
          <p className="mt-5 text-[18px] max-w-[60ch]">{P.pilares.texto}</p>
          <ul className="mt-10 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">{P.pilares.itens.map(([t, x]) => <li key={t} className="bg-tom p-6"><p className="site-display text-[26px]">{t}</p><p className="mt-2 text-[16px] text-apoio">{x}</p></li>)}</ul>
        </div>
        <div className="rv"><h2 id="t-medidas" className="site-h2">Em todo encontro, tudo comparado</h2>
          <p className="mt-4 text-[18px] max-w-[42ch]">As mesmas medidas, nos mesmos pontos, para enxergar o que mudou desde o último encontro.</p></div>
        <div className="rv mt-10 bg-folha p-6 sm:p-8">
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

      <section className="site-wrap pt-6 pb-[clamp(90px,11vw,180px)]" aria-labelledby="t-entregas">
        <div className="rv grid lg:grid-cols-12 gap-x-6 gap-y-4 items-end">
          <h2 id="t-entregas" className="site-h2 lg:col-span-6">O que você recebe</h2>
          <p className="text-[17px] lg:col-start-8 lg:col-span-5">Documentos por escrito e um app para levar o acompanhamento no bolso. Tudo fica com você.</p>
        </div>
        <ul className="mt-14 grid sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-14">
          {P.entregas.map(([t, x], i) => (
            <li key={t} className="rv entrega group">
              <div className="prova aspect-[4/3]"><img src={`/site/${['e-mapa', 'e-protocolo', 'e-checklist', 'e-plano', 'e-app', 'e-videos'][i]}.jpg`} alt={`Exemplo: ${t}`} loading="lazy" /></div>
              <h3 className="mt-5 site-display text-[clamp(26px,2vw,30px)] leading-tight">{t}</h3>
              <p className="mt-2 text-[17px] leading-relaxed max-w-[38ch]">{x}</p>
            </li>
          ))}
        </ul>
        <p className="rv mt-10 text-[14px] text-apoio">Exemplos ilustrativos, com dados fictícios. Os seus são feitos para você.</p>
      </section>
    </>

    <section className="bg-cafe text-creme py-[clamp(90px,11vw,180px)] relative overflow-hidden" aria-labelledby="t-tempo">
      <div aria-hidden="true" className="textura textura-clara absolute inset-0" />
      <div className="site-wrap relative">
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
        <div className="bg-tom p-7">
          <h3 className="site-display text-[32px]">Consulta avulsa</h3>
          <ul className="mt-5 flex flex-col gap-3 text-[18px]">{P.avulsa.map(x => <li key={x} className="flex gap-3"><X className="w-5 h-5 text-apoio shrink-0 mt-1" />{x}</li>)}</ul>
        </div>
        <div className="hidden md:grid place-items-center"><ArrowRight className="w-8 h-8 text-cobre seta-pulsa" /></div>
        <div className="bg-oliva text-creme p-7">
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
          <div key={s} className={`px-6 py-5 grid sm:grid-cols-[1.1fr_1.3fr_auto] gap-x-6 gap-y-1 items-baseline ${i === P.suporte.length - 1 ? 'bg-areia/60' : 'bg-folha'}`}>
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
    <MateriaisHome />
    <Jornada titulo="Como eu acompanho você" />
    <Fechamento />
  </>)
}

export function SiteTema() {
  const { slug } = useParams()
  const t = TEMAS.find(x => x.slug === slug)
  usePagina(t?.titulo ?? 'Tema', t?.resumo ?? '')
  if (!t) return <Abertura titulo="Tema não encontrado" texto="Volte para a lista de temas." />
  const foto = [FOTOS.checkin, FOTOS.mapa, FOTOS.protocolo, FOTOS.retrato][TEMAS.indexOf(t) % 4]
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
        <div className="rv mt-12 bg-tom p-6 flex flex-col sm:flex-row sm:items-center gap-5 max-w-[560px]">
          <img src="/dra-bartira-rosto.jpg" alt="" className="w-16 h-16 rounded-full object-cover" />
          <p className="flex-1 text-[18px]">Quer conversar sobre isso com a Dra. Bartira?</p>
          <Agendar rotulo="Agendar" />
        </div>
        <div className="rv mt-16">
          <h2 className="text-[21px] font-medium">Outros temas · <Link to="/temas" className="site-link">ver todos</Link></h2>
          <div className="mt-3 flex flex-col">{outros.map(o => <Link key={o.slug} to={`/temas/${o.slug}`} className="group flex items-end gap-3 py-3"><span className="site-display text-[32px] group-hover:text-cobre transition-colors">{o.titulo}</span><span className="pontos" /><ArrowRight className="w-4 h-4 -translate-y-1.5 transition-transform group-hover:translate-x-1" /></Link>)}</div>
        </div>
      </Duo>
    <Jornada titulo="Como eu acompanho você" />
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
        <div className="rv grid sm:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-16">{materiais.map(m => <Livro key={m.id} m={m} />)}</div>
      )}
    </section>
    <TemasMenu />
    <Jornada titulo="Como eu acompanho você" />
    <Fechamento />
  </>)
}

// ---------- Contato ----------
export function SiteContato() {
  usePagina('Contato e agendamento', 'Agende sua consulta com a Dra. Bartira Rebouças em Natal.')
  return (<>
    <Cabeca titulo="Agende sua consulta" texto="Consulta presencial em Natal ou teleconsulta, inclusive para quem mora fora do Brasil. A equipe ajuda a escolher o local e o horário." f={FOTOS.equilibre}>
      <div className="mt-9 flex flex-wrap items-center gap-x-7 gap-y-4">
        {CONTATO.whatsapp ? <Agendar rotulo="Agendar pelo WhatsApp" /> : <a href="#locais" className="site-btn">Ver os locais de atendimento<ArrowRight className="w-4 h-4" /></a>}
        <a href={CONTATO.doctoralia} target="_blank" rel="noreferrer" className="site-link text-[17px]">Agendar on-line pelo Doctoralia</a>
      </div>
      <p className="mt-6 text-[16px] max-w-[48ch]">{CONTATO.horarioEquipe}</p>
      <p className="mt-2 text-[14px] text-apoio max-w-[48ch]">{CONTATO.avisoWhatsapp} Não atendemos planos de saúde. Emitimos nota fiscal para reembolso.</p>
    </Cabeca>
    <section id="locais" className="site-wrap scroll-mt-24 pb-[clamp(90px,10vw,160px)]" aria-labelledby="t-locais">
      <h2 id="t-locais" className="rv site-h2">Onde eu atendo</h2>
      <div className="rv mt-10 grid md:grid-cols-2 gap-4">
        {LOCAIS.map(l => (
          <div key={l.nome} className="bg-tom p-8 flex flex-col gap-3">
            {l.foto && <img src={l.foto.src} alt={l.foto.alt} loading="lazy" className="-mx-8 -mt-8 mb-4 w-[calc(100%+4rem)] aspect-[4/3] object-cover" />}
            <h3 className="site-display text-[32px]">{l.nome}</h3>
            <p className="flex gap-3 text-[17px]"><MapPin className="w-5 h-5 shrink-0 mt-1" />{l.endereco}</p>
            <p className="flex gap-3 text-[17px]"><Clock className="w-5 h-5 shrink-0 mt-1" />{l.horario}</p>
            <p className="flex gap-3 text-[17px]"><Phone className="w-5 h-5 shrink-0 mt-1" />{l.telefone}</p>
            {l.mapa && <a href={l.mapa} target="_blank" rel="noreferrer" className="site-link text-[17px] self-start">Ver no mapa</a>}
          </div>
        ))}
      </div>
    </section>
    <Jornada titulo="Depois de agendar" />
    <Perguntas />
    <Fechamento />
  </>)
}

// ---------- Privacidade ----------
export function SitePrivacidade() {
  usePagina('Política de privacidade', 'Como tratamos os dados de quem visita o site e das pacientes.')
  // CONFIRMAR: responsável pelos dados (pessoa ou clínica) e revisão jurídica
  const itens: Array<[string, string]> = [
    ['Quem é responsável', 'Dra. Bartira Rebouças, endocrinologista, CNPJ 68.262.453/0001-20, responsável pelo tratamento dos dados coletados neste site e no app das pacientes.'],
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
