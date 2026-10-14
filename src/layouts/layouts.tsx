import { Navigate, NavLink, Outlet } from 'react-router-dom'
import { can, useAuth, type Perms } from '../auth/AuthProvider'
import { Consentimento } from '../pages/auth'
import { Marca } from '../components/ui'

function Carregando() {
  return <main className="min-h-screen grid place-items-center"><p className="rotulo">Carregando</p></main>
}

export function Protegido({ papeis }: { papeis: Array<'medica' | 'equipe' | 'paciente'> }) {
  const { session, profile, loading, needsConsent } = useAuth()
  if (loading) return <Carregando />
  if (!session) return <Navigate to="/entrar" replace />
  if (!profile || !profile.active) return <Navigate to="/entrar" replace />
  if (!papeis.includes(profile.role)) return <Navigate to={profile.role === 'paciente' ? '/app' : '/painel'} replace />
  if (needsConsent) return <Consentimento />
  return <Outlet />
}

const linkApp = ({ isActive }: { isActive: boolean }) =>
  `flex-1 text-center py-3 text-xs uppercase tracking-[0.14em] ${isActive ? 'text-texto' : 'text-apoio'}`

export function LayoutApp() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="px-6 pt-8 pb-2"><Marca /></header>
      <div className="flex-1 pb-24"><Outlet /></div>
      <nav aria-label="Navegação principal" className="fixed bottom-0 inset-x-0 bg-creme border-t border-areia flex pb-[env(safe-area-inset-bottom)]">
        <NavLink end to="/app" className={linkApp}>Início</NavLink>
        <NavLink to="/app/protocolo" className={linkApp}>Protocolo</NavLink>
        <NavLink to="/app/checkin" className={linkApp}>Check-in</NavLink>
        <NavLink to="/app/evolucao" className={linkApp}>Evolução</NavLink>
      </nav>
    </div>
  )
}

const itensPainel: Array<{ to: string; rotulo: string; precisa?: keyof Perms | 'medica' }> = [
  { to: '/painel', rotulo: 'Hoje' },
  { to: '/painel/pacientes', rotulo: 'Pacientes', precisa: 'can_manage_patients' },
  { to: '/painel/equipe', rotulo: 'Equipe e acessos', precisa: 'medica' },
]

export function LayoutPainel() {
  const { profile, perms, signOut } = useAuth()
  const itens = itensPainel.filter(i =>
    !i.precisa || (i.precisa === 'medica' ? profile?.role === 'medica' : can(profile, perms, i.precisa)))
  const link = ({ isActive }: { isActive: boolean }) =>
    `px-4 py-3 text-sm ${isActive ? 'bg-creme text-texto' : 'text-creme/80 hover:text-creme'}`
  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      <aside className="bg-cafe text-creme md:w-60 px-5 py-6 md:py-10 flex md:flex-col gap-4 md:gap-8 flex-wrap items-center md:items-stretch">
        <span className="font-display text-2xl">Longevidade</span>
        <nav aria-label="Painel" className="flex md:flex-col gap-1 flex-wrap">
          {itens.map(i => <NavLink key={i.to} end to={i.to} className={link}>{i.rotulo}</NavLink>)}
        </nav>
        <div className="md:mt-auto text-sm flex flex-col gap-2 ml-auto md:ml-0">
          <span className="opacity-75">{profile?.full_name ?? profile?.email}</span>
          <button onClick={signOut} className="text-left underline underline-offset-4 opacity-75 hover:opacity-100">Sair</button>
        </div>
      </aside>
      <main className="flex-1 min-w-0 px-6 md:px-12 py-10"><Outlet /></main>
    </div>
  )
}
