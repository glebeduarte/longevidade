import { Navigate, NavLink, Outlet } from 'react-router-dom'
import { CalendarDays, ClipboardList, Home, LineChart, LogOut, MessageCircle, Sun, Users, UserCog } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { can, useAuth, type Perms } from '../auth/AuthProvider'
import { Consentimento } from '../pages/auth'
import { Borboleta, Iniciais, Marca } from '../components/ui'

function Carregando() {
  return (
    <main className="min-h-screen grid place-items-center">
      <Borboleta className="w-12 h-9 text-cobre animate-pulse" />
    </main>
  )
}

export function Protegido({ papeis }: { papeis: Array<'medica' | 'equipe' | 'paciente'> }) {
  const { session, profile, loading, needsConsent } = useAuth()
  if (loading) return <Carregando />
  if (!session || !profile || !profile.active) return <Navigate to="/entrar" replace />
  if (!papeis.includes(profile.role)) return <Navigate to={profile.role === 'paciente' ? '/app' : '/painel'} replace />
  if (needsConsent) return <Consentimento />
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
  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-20 bg-creme/85 backdrop-blur-md border-b border-areia/60">
        <div className="max-w-2xl mx-auto px-5 h-16 flex items-center justify-between">
          <Marca />
          <Iniciais nome={profile?.full_name ?? profile?.email} className="w-9 h-9 text-base" />
        </div>
      </header>
      <div className="flex-1 pb-28"><div className="max-w-2xl mx-auto"><Outlet /></div></div>
      <nav aria-label="Navegação principal"
        className="fixed bottom-0 inset-x-0 z-20 bg-[#faf7f2]/90 backdrop-blur-md border-t border-areia/70 pb-[env(safe-area-inset-bottom)]">
        <div className="max-w-2xl mx-auto grid grid-cols-4">
          {navApp.map(({ to, rotulo, icone: I, end }) => (
            <NavLink key={to} to={to} end={end}
              className={({ isActive }) => `relative flex flex-col items-center gap-1 py-3 text-[10px] uppercase tracking-[0.16em] transition-colors ${isActive ? 'text-cafe' : 'text-apoio/70 hover:text-apoio'}`}>
              {({ isActive }) => (<>
                <span className={`absolute top-0 h-0.5 w-8 transition-colors ${isActive ? 'bg-terracota' : 'bg-transparent'}`} />
                <I className="w-5 h-5" strokeWidth={isActive ? 1.8 : 1.4} />{rotulo}
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
  { to: '/painel/agenda', rotulo: 'Encontros', icone: CalendarDays, precisa: 'can_manage_patients', grupo: 'Rotina' },
  { to: '/painel/equipe', rotulo: 'Equipe e acessos', icone: UserCog, precisa: 'medica', grupo: 'Gestão' },
]

export function LayoutPainel() {
  const { profile, perms, signOut } = useAuth()
  const itens = itensPainel.filter(i =>
    !i.precisa || (i.precisa === 'medica' ? profile?.role === 'medica' : can(profile, perms, i.precisa)))
  const grupos = [...new Set(itens.map(i => i.grupo))]
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[264px_1fr]">
      <aside className="lg:sticky lg:top-0 lg:h-screen bg-[#ece5da] border-b lg:border-b-0 lg:border-r border-areia flex lg:flex-col">
        <div className="px-6 h-16 lg:h-20 flex items-center shrink-0"><Marca /></div>
        <nav aria-label="Painel" className="flex lg:flex-col gap-1 lg:gap-6 px-3 lg:px-4 lg:py-4 overflow-x-auto items-center lg:items-stretch">
          {grupos.map(g => (
            <div key={g} className="flex lg:flex-col gap-1">
              <p className="rotulo px-3 mb-2 hidden lg:block">{g}</p>
              {itens.filter(i => i.grupo === g).map(({ to, rotulo, icone: I }) => (
                <NavLink key={to} to={to} end={to === '/painel'}
                  className={({ isActive }) => `flex items-center gap-3 px-3 h-11 text-sm whitespace-nowrap transition-colors ${isActive ? 'bg-cafe text-creme' : 'text-cafe/80 hover:bg-white/60 hover:text-texto'}`}>
                  <I className="w-[18px] h-[18px]" strokeWidth={1.5} />{rotulo}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>
        <div className="hidden lg:flex mt-auto m-4 p-3 bg-white/60 border border-areia/70 items-center gap-3">
          <Iniciais nome={profile?.full_name ?? profile?.email} />
          <div className="min-w-0 flex-1">
            <p className="text-sm truncate">{profile?.full_name ?? profile?.email}</p>
            <p className="text-[11px] text-apoio uppercase tracking-[0.14em]">{profile?.role === 'medica' ? 'Médica' : 'Equipe'}</p>
          </div>
          <button onClick={signOut} aria-label="Sair" className="w-9 h-9 grid place-items-center text-apoio hover:text-terracota"><LogOut className="w-4 h-4" /></button>
        </div>
        <button onClick={signOut} aria-label="Sair" className="lg:hidden ml-auto px-5 text-apoio"><LogOut className="w-5 h-5" /></button>
      </aside>
      <main className="min-w-0 px-5 sm:px-8 lg:px-14 py-8 lg:py-14"><div className="max-w-6xl"><Outlet /></div></main>
    </div>
  )
}
