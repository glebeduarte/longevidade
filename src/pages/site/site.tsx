import { useEffect, useState, type ReactNode } from 'react'
import { Link, NavLink, Outlet, useLocation, useParams } from 'react-router-dom'
import { ArrowRight, Check, ChevronDown, Clock, Instagram, MapPin, Menu, MessageCircle, X } from 'lucide-react'
import { useAuth } from '../../auth/AuthProvider'
import { Icone, degrade } from '../../components/icones'
import {
  APP_PACIENTE, CONTATO, INICIO, LOCAIS, NAV, PARA_QUEM, PASSOS, PERGUNTAS, PLANOS, SOBRE, TEMAS, linkAgendar,
} from '../../lib/site'
import { CartaoMaterial, useMateriais } from './material'

/** Título e descrição da aba do navegador e das buscas. */
function usePagina(titulo: string, descricao: string) {
  useEffect(() => {
    document.title = titulo ? `${titulo} · Dra. Bartira Rebouças` : 'Dra. Bartira Rebouças · Endocrinologista em Natal'
    let m = document.querySelector('meta[name="description"]')
    if (!m) { m = document.createElement('meta'); m.setAttribute('name', 'description'); document.head.appendChild(m) }
    m.setAttribute('content', descricao)
  }, [titulo, descricao])
}

const externo = (href: string) => href.startsWith('http')

/** Botão principal do site: sempre leva ao agendamento. */
function Agendar({ claro = false, grande = false, rotulo = 'Agendar consulta' }: { claro?: boolean; grande?: boolean; rotulo?: string }) {
  const href = linkAgendar()
  const cls = `inline-flex items-center justify-center gap-2 rounded-full font-medium transition-colors ${grande ? 'h-14 px-7 text-[17px]' : 'h-11 px-5 text-[15px]'} ${claro ? 'bg-creme text-cafe hover:bg-white' : 'bg-cafe text-creme hover:bg-texto'}`
  return externo(href)
    ? <a href={href} target="_blank" rel="noreferrer" className={cls}><MessageCircle className="w-4 h-4" />{rotulo}</a>
    : <Link to={href} className={cls}>{rotulo}<ArrowRight className="w-4 h-4" /></Link>
}

function Secao({ id, tom = false, children, className = '' }: { id?: string; tom?: boolean; children: ReactNode; className?: string }) {
  return <section id={id} className={`${tom ? 'bg-tom/60' : ''} ${className}`}><div className="max-w-6xl mx-auto px-5 sm:px-8 py-16 sm:py-24">{children}</div></section>
}
function Titulo({ sobre, children, sub, centro = false }: { sobre?: string; children: ReactNode; sub?: string; centro?: boolean }) {
  return (
    <div className={`max-w-2xl ${centro ? 'mx-auto text-center' : ''}`}>
      {sobre && <p className="text-[12px] tracking-[0.22em] uppercase text-cobre">{sobre}</p>}
      <h2 className="font-display text-[36px] sm:text-[46px] leading-[1.05] mt-3">{children}</h2>
      {sub && <p className="mt-4 text-[17px] leading-relaxed text-apoio">{sub}</p>}
    </div>
  )
}

// ---------- Layout ----------
export function LayoutSite() {
  const { session, profile } = useAuth()
  const [menu, setMenu] = useState(false)
  const { pathname, hash } = useLocation()
  useEffect(() => { setMenu(false); if (!hash) window.scrollTo(0, 0) }, [pathname, hash])
  const area = !session ? { to: '/entrar', r: 'Área da paciente' } : profile?.role === 'paciente' ? { to: '/app', r: 'Abrir meu app' } : { to: '/painel', r: 'Ir para o painel' }

  return (
    <div className="min-h-screen bg-fundo text-texto flex flex-col">
      <header className="sticky top-0 z-30 bg-fundo/90 backdrop-blur border-b border-borda/70">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 h-[72px] flex items-center gap-6">
          <Link to="/" className="flex items-center gap-3 shrink-0" aria-label="Início">
            <img src="/marca-bartira.svg" alt="" className="w-9 h-9" />
            <span className="leading-none">
              <span className="block font-display text-[22px]">Bartira Rebouças</span>
              <span className="block text-[10px] tracking-[0.25em] uppercase text-cobre mt-1">Endocrinologia</span>
            </span>
          </Link>
          <nav className="hidden lg:flex items-center gap-6 ml-auto" aria-label="Principal">
            {NAV.map(([to, r]) => (
              <NavLink key={to} to={to} className={({ isActive }) => `text-[15px] transition-colors ${isActive ? 'text-texto' : 'text-apoio hover:text-texto'}`}>{r}</NavLink>
            ))}
          </nav>
          <div className="hidden lg:flex items-center gap-3">
            <Link to={area.to} className="text-[15px] text-cafe hover:underline underline-offset-4">{area.r}</Link>
            <Agendar />
          </div>
          <button className="lg:hidden ml-auto w-11 h-11 grid place-items-center rounded-full hover:bg-tom" onClick={() => setMenu(!menu)} aria-expanded={menu} aria-label="Menu">
            {menu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
        {menu && (
          <nav className="lg:hidden border-t border-borda bg-fundo px-5 pb-6 pt-2 flex flex-col" aria-label="Principal">
            {NAV.map(([to, r]) => <Link key={to} to={to} className="py-3.5 text-[18px] border-b border-borda/70">{r}</Link>)}
            <Link to={area.to} className="py-3.5 text-[18px] text-cafe">{area.r}</Link>
            <div className="mt-3"><Agendar grande /></div>
          </nav>
        )}
      </header>

      <main className="flex-1"><Outlet /></main>

      <footer className="bg-cafe text-creme">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 py-14 grid gap-10 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-3">
              <span className="w-11 h-11 rounded-full bg-creme grid place-items-center"><img src="/marca-bartira.svg" alt="" className="w-7 h-7" /></span>
              <span className="font-display text-[24px]">Bartira Rebouças</span>
            </div>
            <p className="mt-4 text-[15px] text-areia leading-relaxed max-w-sm">Endocrinologista. Climatério e longevidade feminina.<br />Ciência e acolhimento.</p>
            <p className="mt-4 text-[13px] text-areia/70">{CONTATO.crm} · {CONTATO.rqe}</p>
          </div>
          <div>
            <p className="text-[12px] tracking-[0.22em] uppercase text-areia/70">Atendimento</p>
            <ul className="mt-4 space-y-3 text-[15px]">
              {LOCAIS.map(l => <li key={l.nome}>{l.nome}<span className="block text-[13px] text-areia/70">{l.endereco}</span></li>)}
            </ul>
          </div>
          <div>
            <p className="text-[12px] tracking-[0.22em] uppercase text-areia/70">Navegue</p>
            <ul className="mt-4 space-y-2.5 text-[15px]">
              {NAV.map(([to, r]) => <li key={to}><Link to={to} className="hover:underline underline-offset-4">{r}</Link></li>)}
              <li><Link to={area.to} className="hover:underline underline-offset-4">{area.r}</Link></li>
              <li><a href={CONTATO.instagram} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 hover:underline underline-offset-4"><Instagram className="w-4 h-4" />Instagram</a></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-creme/10">
          <div className="max-w-6xl mx-auto px-5 sm:px-8 py-5 flex flex-wrap gap-x-6 gap-y-2 text-[13px] text-areia/70">
            <span>© {new Date().getFullYear()} Dra. Bartira Rebouças</span>
            <Link to="/privacidade" className="hover:underline underline-offset-4">Política de privacidade</Link>
            <span>As informações deste site não substituem a consulta médica.</span>
          </div>
        </div>
      </footer>

      {CONTATO.whatsapp && (
        <a href={linkAgendar()} target="_blank" rel="noreferrer" aria-label="Falar pelo WhatsApp"
          className="fixed right-4 bottom-4 z-30 w-14 h-14 rounded-full bg-oliva text-creme grid place-items-center shadow-lg hover:brightness-110">
          <MessageCircle className="w-6 h-6" />
        </a>
      )}
    </div>
  )
}

// ---------- Início ----------
export function SiteInicio() {
  usePagina('', INICIO.texto)
  return (<>
    <section className="relative overflow-hidden">
      <div className="max-w-6xl mx-auto px-5 sm:px-8 pt-10 pb-16 sm:pt-16 sm:pb-24 grid lg:grid-cols-[1.1fr_1fr] gap-10 lg:gap-14 items-center">
        <div className="order-2 lg:order-1">
          <p className="text-[12px] tracking-[0.22em] uppercase text-cobre">{INICIO.sobretitulo}</p>
          <h1 className="font-display text-[44px] sm:text-[64px] leading-[1.02] mt-4">{INICIO.titulo}</h1>
          <p className="mt-6 text-[18px] leading-relaxed text-apoio max-w-xl">{INICIO.texto}</p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Agendar grande />
            <Link to="/programa" className="inline-flex items-center gap-2 text-[16px] text-cafe hover:underline underline-offset-4">Conheça o programa Longevidade<ArrowRight className="w-4 h-4" /></Link>
          </div>
          <p className="mt-8 text-[13px] text-apoio">Dra. Bartira Rebouças · Endocrinologista · {CONTATO.crm} · {CONTATO.rqe}</p>
        </div>
        <div className="order-1 lg:order-2 relative">
          <div className="absolute -inset-4 sm:-inset-6 rounded-[36px] bg-tom rotate-[-2deg]" aria-hidden="true" />
          <img src="/dra-bartira.jpg" alt="Dra. Bartira Rebouças em seu consultório" className="relative w-full aspect-[4/3] lg:aspect-[4/5] object-cover object-[50%_30%] rounded-[28px]" />
          <div className="absolute -bottom-5 left-5 sm:-left-6 bg-folha border border-borda rounded-2xl px-4 py-3 flex items-center gap-3 shadow-sm">
            <img src="/marca-bartira.svg" alt="" className="w-8 h-8" />
            <p className="text-[14px] leading-tight">Ciência e<br />acolhimento</p>
          </div>
        </div>
      </div>
    </section>

    <Secao tom>
      <Titulo sobre="Para quem é" sub="Mulheres a partir dos 40 anos que querem entender o que está mudando e cuidar da saúde para os próximos anos.">Cada fase pede um cuidado diferente</Titulo>
      <div className="mt-12 grid md:grid-cols-3 gap-5">
        {PARA_QUEM.map(c => (
          <div key={c.titulo} className="rounded-2xl p-6 flex flex-col gap-4" style={{ background: degrade(c.tema) }}>
            <Icone tema={c.tema} fundo tamanho={52} className="!bg-folha" />
            <h3 className="text-[20px] font-medium">{c.titulo}</h3>
            <p className="text-[16px] leading-relaxed text-apoio">{c.texto}</p>
          </div>
        ))}
      </div>
      <Link to="/temas" className="mt-8 inline-flex items-center gap-2 text-[16px] text-cafe hover:underline underline-offset-4">Ver todos os temas<ArrowRight className="w-4 h-4" /></Link>
    </Secao>

    <Secao>
      <div className="grid lg:grid-cols-[1fr_1.2fr] gap-12 items-start">
        <Titulo sobre="Programa Longevidade" sub="Um acompanhamento de 6 ou 12 meses, com encontros presenciais e contato toda semana pelo app.">Um plano para a sua saúde, não uma consulta solta</Titulo>
        <ol className="grid sm:grid-cols-2 gap-4">
          {PASSOS.map((p, i) => (
            <li key={p.titulo} className="cartao p-5 flex flex-col gap-2">
              <span className="font-display text-[34px] leading-none text-cobre">{String(i + 1).padStart(2, '0')}</span>
              <h3 className="text-[18px] font-medium">{p.titulo}</h3>
              <p className="text-[15px] leading-relaxed text-apoio">{p.texto}</p>
            </li>
          ))}
        </ol>
      </div>
      <div className="mt-10 flex flex-wrap gap-4"><Agendar /><Link to="/programa" className="inline-flex items-center h-11 px-5 rounded-full border border-controle text-[15px] hover:bg-folha">Como funciona</Link></div>
    </Secao>

    <Secao tom>
      <div className="grid md:grid-cols-[220px_1fr] gap-10 items-center">
        <img src="/dra-bartira-rosto.jpg" alt="Dra. Bartira Rebouças" className="w-44 h-44 md:w-56 md:h-56 rounded-full object-cover ring-8 ring-folha" />
        <div>
          <p className="text-[12px] tracking-[0.22em] uppercase text-cobre">Sobre a Dra. Bartira</p>
          <p className="font-display text-[30px] sm:text-[38px] leading-[1.12] mt-3">"{SOBRE.paragrafos[0].split('. ')[0]}."</p>
          <p className="mt-4 text-[17px] text-apoio leading-relaxed max-w-2xl">{SOBRE.resumo}</p>
          <Link to="/sobre" className="mt-6 inline-flex items-center gap-2 text-[16px] text-cafe hover:underline underline-offset-4">Conheça a trajetória<ArrowRight className="w-4 h-4" /></Link>
        </div>
      </div>
    </Secao>

    <MateriaisHome />

    <ChamadaFinal />
  </>)
}

/** Materiais marcados com estrela no painel. Sem nenhum, a seção some. */
function MateriaisHome() {
  const lista = useMateriais(true)
  if (!lista?.length) return null
  return (
    <Secao>
      <Titulo sobre="Materiais gratuitos" sub="Conteúdos escritos pela Dra. Bartira para quem quer entender melhor essa fase.">Informação clara, sem tabu</Titulo>
      <div className="mt-10 grid md:grid-cols-2 gap-5">{lista.map(m => <CartaoMaterial key={m.id} m={m} />)}</div>
    </Secao>
  )
}

function ChamadaFinal() {
  return (
    <section className="bg-cafe text-creme">
      <div className="max-w-4xl mx-auto px-5 sm:px-8 py-16 sm:py-20 text-center flex flex-col items-center gap-6">
        <img src="/marca-bartira.svg" alt="" className="w-12 h-12 bg-creme rounded-full p-2" />
        <h2 className="font-display text-[36px] sm:text-[48px] leading-[1.05]">Vamos conversar sobre o seu momento?</h2>
        <p className="text-[17px] text-areia max-w-xl">Agende sua consulta. A equipe responde e encontra o melhor horário para você.</p>
        <Agendar claro grande />
      </div>
    </section>
  )
}

function Cabeca({ sobre, titulo, texto }: { sobre: string; titulo: string; texto?: string }) {
  return (
    <section className="bg-tom/60">
      <div className="max-w-6xl mx-auto px-5 sm:px-8 pt-14 pb-12 sm:pt-20 sm:pb-16">
        <p className="text-[12px] tracking-[0.22em] uppercase text-cobre">{sobre}</p>
        <h1 className="font-display text-[42px] sm:text-[58px] leading-[1.03] mt-3 max-w-3xl">{titulo}</h1>
        {texto && <p className="mt-5 text-[18px] leading-relaxed text-apoio max-w-2xl">{texto}</p>}
      </div>
    </section>
  )
}

// ---------- Sobre ----------
export function SiteSobre() {
  usePagina('Sobre', SOBRE.resumo)
  return (<>
    <Cabeca sobre="Sobre" titulo="Dra. Bartira Rebouças" texto={SOBRE.resumo} />
    <Secao>
      <div className="grid lg:grid-cols-[1fr_1.2fr] gap-12 items-start">
        <img src="/dra-bartira.jpg" alt="Dra. Bartira Rebouças" className="w-full aspect-[4/5] object-cover object-[50%_30%] rounded-[28px] lg:sticky lg:top-24" />
        <div className="flex flex-col gap-6">
          {SOBRE.paragrafos.map((p, i) => <p key={i} className={i === 0 ? 'font-display text-[28px] sm:text-[32px] leading-[1.2]' : 'text-[17px] leading-relaxed text-apoio'}>{p}</p>)}
          <div className="mt-4">
            <p className="text-[12px] tracking-[0.22em] uppercase text-cobre">Formação</p>
            <ul className="mt-4 flex flex-col">
              {SOBRE.formacao.map(f => <li key={f} className="py-3.5 border-b border-borda text-[17px] flex gap-3"><Check className="w-5 h-5 text-oliva shrink-0 mt-0.5" />{f}</li>)}
            </ul>
            <p className="mt-4 text-[14px] text-apoio">{CONTATO.crm} · {CONTATO.rqe}</p>
          </div>
          <div className="mt-2"><Agendar /></div>
        </div>
      </div>
    </Secao>
    <ChamadaFinal />
  </>)
}

// ---------- Programa ----------
export function SitePrograma() {
  usePagina('Programa Longevidade', 'Acompanhamento de 6 ou 12 meses para mulheres no climatério, com encontros presenciais e check-in semanal pelo app.')
  const [aberta, setAberta] = useState<number | null>(0)
  return (<>
    <Cabeca sobre="Programa Longevidade" titulo="Um acompanhamento contínuo, do primeiro encontro aos resultados"
      texto="Em vez de consultas soltas, um plano com começo, meio e fim: avaliação completa, protocolo por escrito e contato toda semana com a equipe." />
    <Secao>
      <Titulo sobre="Como funciona">Quatro etapas, um plano só seu</Titulo>
      <ol className="mt-12 grid md:grid-cols-4 gap-6 relative">
        {PASSOS.map((p, i) => (
          <li key={p.titulo} className="relative flex flex-col gap-3">
            <span className="w-12 h-12 rounded-full bg-cafe text-creme grid place-items-center font-display text-[22px]">{i + 1}</span>
            <h3 className="text-[19px] font-medium">{p.titulo}</h3>
            <p className="text-[16px] leading-relaxed text-apoio">{p.texto}</p>
          </li>
        ))}
      </ol>
    </Secao>
    <Secao tom>
      <Titulo sobre="Formatos" sub="Os valores e as condições são informados no agendamento.">Escolha o acompanhamento</Titulo>
      <div className="mt-12 grid md:grid-cols-3 gap-5 items-stretch">
        {PLANOS.map(p => (
          <div key={p.slug} className={`rounded-2xl p-6 flex flex-col gap-5 ${p.destaque ? 'bg-cafe text-creme' : 'bg-folha border border-borda'}`}>
            <div>
              {p.destaque && <span className="text-[11px] tracking-[0.2em] uppercase text-areia">Mais completo em 6 meses</span>}
              <h3 className="font-display text-[34px] leading-none mt-1">{p.nome}</h3>
              <p className={`mt-3 text-[15px] ${p.destaque ? 'text-areia' : 'text-apoio'}`}>{p.duracao} · {p.encontros}</p>
            </div>
            <ul className="flex flex-col gap-2.5 flex-1">
              {p.inclui.map(x => <li key={x} className="flex gap-2.5 text-[16px]"><Check className={`w-5 h-5 shrink-0 mt-0.5 ${p.destaque ? 'text-areia' : 'text-oliva'}`} />{x}</li>)}
            </ul>
            <Agendar claro={p.destaque} rotulo="Quero conversar" />
          </div>
        ))}
      </div>
    </Secao>
    <Secao>
      <div className="grid lg:grid-cols-2 gap-12 items-center">
        <div>
          <Titulo sobre="O app da paciente" sub="Durante o programa você tem um aplicativo próprio, com letra grande e simples de usar.">Tudo do seu acompanhamento no celular</Titulo>
          <ul className="mt-8 flex flex-col gap-3">
            {APP_PACIENTE.map(x => <li key={x} className="flex gap-3 text-[17px]"><Check className="w-5 h-5 text-oliva shrink-0 mt-1" />{x}</li>)}
          </ul>
        </div>
        <div className="mx-auto w-[280px] rounded-[40px] bg-texto p-3 shadow-xl" aria-hidden="true">
          <div className="rounded-[30px] bg-fundo overflow-hidden">
            <div className="px-4 pt-5 pb-3 flex items-center gap-2"><img src="/marca-bartira.svg" alt="" className="w-6 h-6" /><span className="font-display text-[17px]">Longevidade</span></div>
            <div className="px-4"><p className="font-display text-[22px]">Bom dia, Maria.</p></div>
            <div className="m-4 rounded-2xl bg-cafe text-creme p-4">
              <div className="flex items-center gap-2"><img src="/dra-bartira-rosto.jpg" alt="" className="w-9 h-9 rounded-full object-cover" /><span className="text-[12px] text-areia">Longevidade Completo</span></div>
              <p className="mt-3 text-[24px]">Mês 2 <span className="text-[13px] text-areia">de 6</span></p>
              <div className="mt-2 grid grid-cols-6 gap-1">{Array.from({ length: 6 }, (_, i) => <span key={i} className={`h-1 rounded-full ${i < 2 ? 'bg-areia' : 'bg-areia/25'}`} />)}</div>
            </div>
            {[['checkin', 'Check-in da semana'], ['protocolo', 'Meu protocolo'], ['evolucao', 'Minha evolução']].map(([t, r]) => (
              <div key={t} className="mx-4 mb-2 rounded-xl bg-folha border border-borda p-3 flex items-center gap-3"><Icone tema={t as 'checkin'} fundo tamanho={32} /><span className="text-[14px]">{r}</span></div>
            ))}
            <div className="h-4" />
          </div>
        </div>
      </div>
    </Secao>
    <Secao tom>
      <Titulo sobre="Dúvidas">Perguntas frequentes</Titulo>
      <div className="mt-10 max-w-3xl flex flex-col">
        {PERGUNTAS.map(([q, r], i) => (
          <div key={q} className="border-b border-controle/60">
            <button className="w-full py-5 flex items-center gap-4 text-left text-[18px] font-medium" onClick={() => setAberta(aberta === i ? null : i)} aria-expanded={aberta === i}>
              <span className="flex-1">{q}</span><ChevronDown className={`w-5 h-5 shrink-0 transition-transform ${aberta === i ? 'rotate-180' : ''}`} />
            </button>
            {aberta === i && <p className="pb-5 text-[17px] leading-relaxed text-apoio">{r}</p>}
          </div>
        ))}
      </div>
    </Secao>
    <ChamadaFinal />
  </>)
}

// ---------- Temas ----------
export function SiteTemas() {
  usePagina('Temas', 'Climatério, menopausa, terapia hormonal, peso, sono, saúde óssea e tireoide.')
  return (<>
    <Cabeca sobre="Temas" titulo="O que eu trato no consultório" texto="Sintomas e condições que mudam com os hormônios. Escolha um tema para saber mais." />
    <Secao>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {TEMAS.map(t => (
          <Link key={t.slug} to={`/temas/${t.slug}`} className="group rounded-2xl p-6 flex flex-col gap-4 transition-transform hover:-translate-y-0.5" style={{ background: degrade(t.tema) }}>
            <Icone tema={t.tema} fundo tamanho={52} className="!bg-folha" />
            <h2 className="font-display text-[30px] leading-tight">{t.titulo}</h2>
            <p className="text-[16px] leading-relaxed text-apoio flex-1">{t.resumo}</p>
            <span className="inline-flex items-center gap-2 text-[15px] text-cafe">Ler mais<ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" /></span>
          </Link>
        ))}
      </div>
    </Secao>
    <ChamadaFinal />
  </>)
}

export function SiteTema() {
  const { slug } = useParams()
  const t = TEMAS.find(x => x.slug === slug)
  usePagina(t?.titulo ?? 'Tema', t?.resumo ?? '')
  if (!t) return <Cabeca sobre="Temas" titulo="Tema não encontrado" texto="Volte para a lista de temas." />
  const outros = TEMAS.filter(x => x.slug !== t.slug).slice(0, 3)
  return (<>
    <section style={{ background: degrade(t.tema) }}>
      <div className="max-w-3xl mx-auto px-5 sm:px-8 pt-12 pb-12 sm:pt-16">
        <Link to="/temas" className="text-[14px] text-apoio hover:text-texto">← Todos os temas</Link>
        <div className="mt-6"><Icone tema={t.tema} fundo tamanho={60} className="!bg-folha" /></div>
        <h1 className="font-display text-[44px] sm:text-[58px] leading-[1.03] mt-5">{t.titulo}</h1>
        <p className="mt-4 text-[19px] text-apoio">{t.resumo}</p>
      </div>
    </section>
    <article className="max-w-3xl mx-auto px-5 sm:px-8 py-14 flex flex-col gap-6">
      {t.corpo.map((p, i) => <p key={i} className="text-[18px] leading-[1.75]">{p}</p>)}
      <div className="mt-6 rounded-2xl bg-tom p-6 flex flex-col sm:flex-row sm:items-center gap-5">
        <img src="/dra-bartira-rosto.jpg" alt="" className="w-16 h-16 rounded-full object-cover" />
        <p className="flex-1 text-[17px]">Quer conversar sobre isso com a Dra. Bartira?</p>
        <Agendar />
      </div>
      <p className="text-[13px] text-apoio">Conteúdo informativo. Não substitui a avaliação médica individual.</p>
    </article>
    <Secao tom>
      <p className="text-[12px] tracking-[0.22em] uppercase text-cobre">Outros temas</p>
      <div className="mt-6 grid md:grid-cols-3 gap-4">
        {outros.map(o => <Link key={o.slug} to={`/temas/${o.slug}`} className="cartao p-5 flex items-center gap-3 hover:border-controle"><Icone tema={o.tema} fundo tamanho={40} /><span className="text-[17px] flex-1">{o.titulo}</span><ArrowRight className="w-4 h-4 text-apoio" /></Link>)}
      </div>
    </Secao>
  </>)
}

// ---------- Conteúdos ----------
export function SiteConteudos() {
  usePagina('Conteúdos', 'Guia, e-book e conteúdos da Dra. Bartira sobre climatério e longevidade feminina.')
  const materiais = useMateriais()
  return (<>
    <Cabeca sobre="Conteúdos" titulo="Para entender melhor essa fase" texto="Materiais escritos pela Dra. Bartira e conteúdos sobre climatério, menopausa e longevidade." />
    <Secao>
      {materiais === null ? <p className="text-apoio">Carregando</p> : materiais.length === 0 ? <p className="text-[17px] text-apoio">Novos materiais em breve.</p> : (
        <div className="grid md:grid-cols-2 gap-6">{materiais.map(m => <CartaoMaterial key={m.id} m={m} />)}</div>
      )}
    </Secao>
    <Secao tom>
      <Titulo sobre="Temas" sub="Textos curtos sobre os assuntos mais comuns no consultório.">Leia por assunto</Titulo>
      <div className="mt-8 flex flex-wrap gap-3">
        {TEMAS.map(t => <Link key={t.slug} to={`/temas/${t.slug}`} className="h-11 px-5 rounded-full bg-folha border border-borda inline-flex items-center gap-2 text-[15px] hover:border-controle"><Icone tema={t.tema} tamanho={18} />{t.titulo}</Link>)}
      </div>
      <a href={CONTATO.instagram} target="_blank" rel="noreferrer" className="mt-10 inline-flex items-center gap-2 text-[16px] text-cafe hover:underline underline-offset-4"><Instagram className="w-4 h-4" />Mais conteúdos no Instagram</a>
    </Secao>
  </>)
}

// ---------- Contato ----------
export function SiteContato() {
  usePagina('Contato e agendamento', 'Agende sua consulta com a Dra. Bartira Rebouças em Natal.')
  return (<>
    <Cabeca sobre="Contato" titulo="Agende sua consulta" texto="Fale com a equipe para escolher o melhor local e horário." />
    <Secao>
      <div id="agendar" className="grid lg:grid-cols-[1fr_1.2fr] gap-8 items-start scroll-mt-24">
        <div className="rounded-2xl bg-cafe text-creme p-7 flex flex-col gap-5">
          <MessageCircle className="w-8 h-8 text-areia" />
          <h2 className="font-display text-[34px] leading-tight">Atendimento pelo WhatsApp</h2>
          <p className="text-[17px] text-areia leading-relaxed">A equipe responde em horário comercial e ajuda com datas, valores e preparo para a consulta.</p>
          {CONTATO.whatsapp
            ? <Agendar claro grande rotulo="Chamar no WhatsApp" />
            : <p className="text-[15px] rounded-lg bg-creme/10 px-4 py-3">O número de agendamento será publicado em breve.</p>}
        </div>
        <div className="flex flex-col gap-4">
          {LOCAIS.map(l => (
            <div key={l.nome} className="cartao p-6 flex flex-col gap-3">
              <h3 className="font-display text-[28px]">{l.nome}</h3>
              <p className="flex gap-3 text-[16px]"><MapPin className="w-5 h-5 text-cobre shrink-0 mt-0.5" />{l.endereco}</p>
              <p className="flex gap-3 text-[16px] text-apoio"><Clock className="w-5 h-5 text-cobre shrink-0 mt-0.5" />{l.horario}</p>
              {l.mapa && <a href={l.mapa} target="_blank" rel="noreferrer" className="text-[15px] text-cafe hover:underline underline-offset-4">Ver no mapa</a>}
            </div>
          ))}
        </div>
      </div>
    </Secao>
  </>)
}

// ---------- Privacidade ----------
export function SitePrivacidade() {
  usePagina('Política de privacidade', 'Como tratamos os dados de quem visita o site e das pacientes.')
  // CONFIRMAR: responsável pelos dados (pessoa ou clínica) e revisão jurídica
  const itens: Array<[string, string]> = [
    ['Quem é responsável', 'Dra. Bartira Rebouças, endocrinologista, responsável pelo tratamento dos dados coletados neste site e no app das pacientes.'],
    ['Que dados coletamos no site', 'O site não pede cadastro. Quando você fala com a equipe pelo WhatsApp, os dados que você enviar são usados só para o agendamento.'],
    ['Dados das pacientes', 'No app, guardamos dados de saúde informados pela paciente e pela equipe, com acesso restrito à médica e a quem ela autorizar. Cada abertura de ficha fica registrada.'],
    ['Seus direitos', 'Você pode pedir acesso, correção ou exclusão dos seus dados a qualquer momento, pelo contato da equipe.'],
  ]
  return (<>
    <Cabeca sobre="Privacidade" titulo="Política de privacidade" texto="Versão inicial, em revisão." />
    <article className="max-w-3xl mx-auto px-5 sm:px-8 py-14 flex flex-col gap-8">
      {itens.map(([t, x]) => <div key={t}><h2 className="text-[20px] font-medium">{t}</h2><p className="mt-2 text-[17px] leading-relaxed text-apoio">{x}</p></div>)}
    </article>
  </>)
}
