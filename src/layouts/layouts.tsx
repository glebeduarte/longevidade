import { useEffect, useState } from 'react'
import { Navigate, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { sairVista, useVista, vistaAtual } from '../lib/vista'
import { CalendarDays, Eye, ClipboardList, MessagesSquare, PlayCircle, SlidersHorizontal, Home, LineChart, LogOut, Menu, MessageCircle, Sun, Users, UserCog, X } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { can, useAuth, type Perms } from '../auth/AuthProvider'
import { Consentimento } from '../pages/auth'
import { Borboleta, Iniciais, Marca } from '../components/ui'
import { supabase } from '../lib/supabase'

function Carregando() {
  return (
    <main className="min-h-screen grid place-items-center">
      <Borboleta className="w-10 h-7 text-cobre animate-pulse" />
    </main>
  )
}

export function Protegido({ papeis }: { papeis: Array<'medica' | 'equipe' | 'paciente'> }) {
  const { session, profile, loading, needsConsent } = useAuth()
  if (loading) return <Carregando />
  if (!session || !profile || !profile.active) return <Navigate to="/entrar" replace />
  const vendo = !!vistaAtual() && profile.role === 'medica' && papeis.includes('paciente')
  if (!papeis.includes(profile.role) && !vendo) return <Navigate to={profile.role === 'paciente' ? '/app' : '/painel'} replace />
  if (needsConsent && !vendo) return <Consentimento />
  return <Outlet />
}

const navApp: Array<{ to: string; rotulo: string; icone: LucideIcon; end?: boolean }> = [
  { to: '/app', rotulo: 'Início', icone: Home, end: true },
  { to: '/app/protocolo', rotulo: 'Protocolo', icone: ClipboardList },
  { to: '/app/checkin', rotulo: 'Check-in', icone: MessageCircle },
  { to: '/app/evolucao', rotulo: 'Evolução', icone: LineChart },
]

export function LayoutApp() {
  const { profile } = useAuth()
  const vista = useVista()
  const nav = useNavigate()
  return (
    <div className="min-h-screen flex flex-col bg-fundo">
      {vista && (
        <div className="sticky top-0 z-30 bg-cafe text-creme">
          <div className="max-w-2xl mx-auto px-4 py-2 flex items-center gap-3">
            <Eye className="w-4 h-4 shrink-0 text-areia" strokeWidth={1.7} />
            <p className="flex-1 text-meta leading-tight">Vendo como <b className="font-medium">{vista.nome}</b>. Somente leitura.</p>
            <button onClick={() => { const pid = vista.pid; sairVista(); nav(`/painel/pacientes/${pid}`) }} className="h-8 px-3 rounded bg-creme/15 hover:bg-creme/25 text-meta font-medium whitespace-nowrap">Sair da visualização</button>
          </div>
        </div>
      )}
      <header className={`sticky ${vista ? 'top-12' : 'top-0'} z-20 bg-fundo border-b border-borda`}>
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <Marca />
          <Iniciais nome={vista ? vista.nome : profile?.full_name ?? profile?.email} className="w-8 h-8 text-[12px]" />
        </div>
      </header>
      <div className="flex-1 pb-24"><div className="max-w-2xl mx-auto"><Outlet /></div></div>
      <nav aria-label="Navegação principal" className="fixed bottom-0 inset-x-0 z-20 bg-folha border-t border-borda pb-[env(safe-area-inset-bottom)]">
        <div className="max-w-2xl mx-auto grid grid-cols-4">
          {navApp.map(({ to, rotulo, icone: I, end }) => (
            <NavLink key={to} to={to} end={end}
              className={({ isActive }) => `flex flex-col items-center gap-1 pt-2.5 pb-2 text-[12px] transition-colors ${isActive ? 'text-cafe font-medium' : 'text-apoio hover:text-texto'}`}>
              {({ isActive }) => (<>
                <span className={`grid place-items-center w-14 h-7 rounded-full transition-colors ${isActive ? 'bg-ativo' : ''}`}><I className="w-[18px] h-[18px]" strokeWidth={isActive ? 1.9 : 1.5} /></span>
                {rotulo}
              </>)}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}

const itensPainel: Array<{ to: string; rotulo: string; icone: LucideIcon; precisa?: keyof Perms | 'medica'; grupo: string }> = [
  { to: '/painel', rotulo: 'Hoje', icone: Sun, grupo: 'Rotina' },
  { to: '/painel/pacientes', rotulo: 'Pacientes', icone: Users, precisa: 'can_manage_patients', grupo: 'Rotina' },
  { to: '/painel/checkins', rotulo: 'Check-ins', icone: MessagesSquare, precisa: 'can_answer_checkins', grupo: 'Rotina' },
  { to: '/painel/agenda', rotulo: 'Encontros', icone: CalendarDays, precisa: 'can_manage_patients', grupo: 'Rotina' },
  { to: '/painel/ver-como', rotulo: 'Ver como paciente', icone: Eye, precisa: 'medica', grupo: 'Configurações' },
  { to: '/painel/videos', rotulo: 'Vídeos', icone: PlayCircle, precisa: 'medica', grupo: 'Configurações' },
  { to: '/painel/faixas', rotulo: 'Faixas dos indicadores', icone: SlidersHorizontal, precisa: 'medica', grupo: 'Configurações' },
  { to: '/painel/equipe', rotulo: 'Equipe e acessos', icone: UserCog, precisa: 'medica', grupo: 'Configurações' },
]

function Navegacao({ aoEscolher }: { aoEscolher?: () => void }) {
  const { profile, perms } = useAuth()
  const [fila, setFila] = useState(0)
  const { pathname } = useLocation()
  useEffect(() => { supabase.from('checkins').select('id', { count: 'exact', head: true }).eq('status', 'respondido').then(({ count }) => setFila(count ?? 0)) }, [pathname])
  const itens = itensPainel.filter(i =>
    !i.precisa || (i.precisa === 'medica' ? profile?.role === 'medica' : can(profile, perms, i.precisa)))
  const grupos = [...new Set(itens.map(i => i.grupo))]
  return (
    <nav aria-label="Painel" className="flex flex-col gap-6">
      {grupos.map((g, gi) => (
        <div key={g} className="flex flex-col gap-0.5">
          {gi > 0 && <p className="px-3 mb-1.5 text-meta text-apoio">{g}</p>}
          {itens.filter(i => i.grupo === g).map(({ to, rotulo, icone: I }) => (
            <NavLink key={to} to={to} end={to === '/painel'} onClick={aoEscolher}
              className={({ isActive }) => `flex items-center gap-2.5 px-3 h-9 rounded text-corpo transition-colors ${isActive ? 'bg-ativo text-texto font-medium' : 'text-apoio hover:bg-tom hover:text-texto'}`}>
              <I className="w-4 h-4 shrink-0" strokeWidth={1.6} /><span className="flex-1">{rotulo}</span>{to === '/painel/checkins' && fila > 0 && <span className="min-w-5 h-5 px-1.5 rounded-full bg-cafe text-creme text-[11px] font-medium grid place-items-center tabular-nums">{fila}</span>}
            </NavLink>
          ))}
        </div>
      ))}
    </nav>
  )
}

function Usuario() {
  const { profile, signOut } = useAuth()
  return (
    <div className="flex items-center gap-2.5 px-2 py-2 rounded-lg">
      <Iniciais nome={profile?.full_name ?? profile?.email} className="w-8 h-8 text-[12px]" />
      <div className="min-w-0 flex-1 leading-tight">
        <p className="text-corpo truncate">{profile?.full_name ?? profile?.email}</p>
        <p className="text-meta text-apoio">{profile?.role === 'medica' ? 'Médica' : 'Equipe'}</p>
      </div>
      <button onClick={signOut} aria-label="Sair" title="Sair" className="w-8 h-8 grid place-items-center rounded text-apoio hover:text-texto hover:bg-tom"><LogOut className="w-4 h-4" strokeWidth={1.6} /></button>
    </div>
  )
}

export function LayoutPainel() {
  const [menu, setMenu] = useState(false)
  const { pathname } = useLocation()
  useEffect(() => setMenu(false), [pathname])
  return (
    <div className="min-h-screen bg-fundo lg:grid lg:grid-cols-[240px_1fr]">
      {/* Desktop: barra lateral no próprio chão da tela, separada por uma linha */}
      <aside className="hidden lg:flex sticky top-0 h-screen flex-col gap-8 px-3 py-5 border-r border-borda">
        <div className="px-3"><Marca /></div>
        <Navegacao />
        <div className="mt-auto"><Usuario /></div>
      </aside>

      {/* Celular e tablet: barra de 56px com o menu em folha inteira */}
      <header className="lg:hidden sticky top-0 z-30 h-14 px-4 flex items-center justify-between bg-fundo border-b border-borda">
        <Marca />
        <button onClick={() => setMenu(true)} aria-label="Abrir menu" aria-expanded={menu} className="w-11 h-11 -mr-2 grid place-items-center rounded text-texto hover:bg-tom"><Menu className="w-5 h-5" strokeWidth={1.6} /></button>
      </header>
      {menu && (
        <div className="lg:hidden fixed inset-0 z-40 bg-fundo flex flex-col px-3 py-3 entra" role="dialog" aria-modal="true" aria-label="Menu">
          <div className="h-12 px-3 flex items-center justify-between">
            <Marca />
            <button onClick={() => setMenu(false)} aria-label="Fechar menu" className="w-11 h-11 -mr-2 grid place-items-center rounded hover:bg-tom"><X className="w-5 h-5" strokeWidth={1.6} /></button>
          </div>
          <div className="mt-6 flex-1"><Navegacao aoEscolher={() => setMenu(false)} /></div>
          <Usuario />
        </div>
      )}

      <main className="min-w-0 px-4 sm:px-6 lg:px-10 py-6 lg:py-9">
        <div className="max-w-[1180px] mx-auto"><Outlet /></div>
      </main>
    </div>
  )
}
