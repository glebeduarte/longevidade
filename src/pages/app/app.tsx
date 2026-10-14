import { useEffect, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, CalendarDays, ClipboardList, LogOut, MessageCircle, PlayCircle } from 'lucide-react'
import { useAuth } from '../../auth/AuthProvider'
import { supabase } from '../../lib/supabase'
import { Borboleta, Selo } from '../../components/ui'

type Matricula = { start_date: string; end_date: string; programs: { name: string; duration_months: number } | null }

function saudacao() {
  const h = new Date().getHours()
  return h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite'
}

export function Inicio() {
  const { profile, signOut } = useAuth()
  const [m, setM] = useState<Matricula | null>(null)

  useEffect(() => {
    supabase.from('enrollments').select('start_date, end_date, programs(name, duration_months)').eq('status', 'ativa')
      .order('start_date', { ascending: false }).limit(1).maybeSingle()
      .then(({ data }) => setM(data as unknown as Matricula | null))
  }, [])

  const mes = m ? Math.min(m.programs?.duration_months ?? 6, Math.max(1, Math.ceil((Date.now() - new Date(m.start_date).getTime()) / (30.4 * 864e5)))) : 0
  const total = m?.programs?.duration_months ?? 6
  const nome = profile?.full_name?.split(' ')[0]

  return (
    <div className="px-5 pt-8 flex flex-col gap-8">
      <header className="entra">
        <p className="rotulo">{new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
        <h1 className="font-display text-[44px] leading-[1.02] mt-3">{saudacao()}{nome ? `, ${nome}` : ''}.</h1>
        <span className="assinatura" />
      </header>

      <section className="relative overflow-hidden bg-cafe text-creme p-6">
        <div className="absolute inset-0 grao opacity-50" aria-hidden="true" />
        <Borboleta className="absolute -right-10 -top-6 w-48 h-36 text-areia/[0.1]" />
        <div className="relative flex flex-col gap-5">
          <p className="rotulo !text-areia/80">{m?.programs?.name ?? 'Programa Longevidade'}</p>
          {m ? (
            <>
              <p className="font-display text-4xl leading-none">Mês {mes} <span className="text-areia/70">de {total}</span></p>
              <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${total}, minmax(0, 1fr))` }} aria-hidden="true">
                {Array.from({ length: total }, (_, i) => <span key={i} className={`h-1 ${i < mes ? 'bg-areia' : 'bg-areia/20'}`} />)}
              </div>
              <p className="text-sm text-areia/80">Até {new Date(m.end_date).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' })}</p>
            </>
          ) : (
            <p className="font-display text-3xl leading-tight">Seu acompanhamento começa no primeiro encontro.</p>
          )}
        </div>
      </section>

      <div className="grid gap-3">
        <Atalho to="/app/checkin" icone={<MessageCircle className="w-5 h-5" strokeWidth={1.5} />} titulo="Check-in" texto="Nenhum pendente agora" />
        <Atalho to="/app/protocolo" icone={<ClipboardList className="w-5 h-5" strokeWidth={1.5} />} titulo="Meu protocolo" texto="Tudo o que foi orientado na consulta" />
        <div className="cartao p-5 flex items-center gap-4">
          <span className="w-11 h-11 grid place-items-center bg-areia/50 text-cafe"><CalendarDays className="w-5 h-5" strokeWidth={1.5} /></span>
          <div className="flex-1"><p className="rotulo">Próximo encontro</p><p className="font-display text-xl mt-1">A confirmar</p></div>
        </div>
      </div>

      <section className="flex flex-col gap-4">
        <div className="flex items-baseline justify-between">
          <h2 className="font-display text-2xl">Para lembrar</h2>
          <Selo>Vídeos</Selo>
        </div>
        <div className="flex gap-3 overflow-x-auto -mx-5 px-5 pb-2 snap-x">
          {['Sangramento no início da reposição', 'Para que serve cada medicação', 'Como aplicar a caneta', 'Como medir peso e cintura'].map(t => (
            <div key={t} className="snap-start shrink-0 w-48 aspect-[4/5] max-w-full bg-[#e6dccd] p-4 flex flex-col justify-between">
              <PlayCircle className="w-7 h-7 text-cafe/60" strokeWidth={1.2} />
              <p className="font-display text-xl leading-tight">{t}</p>
            </div>
          ))}
        </div>
      </section>

      <button onClick={signOut} className="self-start inline-flex items-center gap-2 text-sm text-apoio hover:text-texto"><LogOut className="w-4 h-4" />Sair</button>
    </div>
  )
}

function Atalho({ to, icone, titulo, texto }: { to: string; icone: ReactNode; titulo: string; texto: string }) {
  return (
    <Link to={to} className="cartao p-5 flex items-center gap-4 group hover:border-cafe/40 transition-colors">
      <span className="w-11 h-11 grid place-items-center bg-areia/50 text-cafe">{icone}</span>
      <div className="flex-1 min-w-0"><p className="font-display text-xl">{titulo}</p><p className="text-sm text-apoio truncate">{texto}</p></div>
      <ArrowRight className="w-4 h-4 text-apoio group-hover:translate-x-0.5 transition-transform" />
    </Link>
  )
}

export function EmBreve({ titulo, texto }: { titulo: string; texto: string }) {
  return (
    <div className="px-5 pt-8 flex flex-col gap-8">
      <header>
        <h1 className="font-display text-[44px] leading-[1.02]">{titulo}</h1>
        <span className="assinatura" />
      </header>
      <div className="cartao p-8 flex flex-col items-center text-center gap-3">
        <Borboleta className="w-12 h-9 text-cobre" />
        <p className="text-apoio">{texto}</p>
      </div>
    </div>
  )
}
