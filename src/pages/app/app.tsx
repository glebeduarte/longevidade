import { useEffect, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, CalendarDays, ClipboardList, LogOut, MessageCircle, PlayCircle } from 'lucide-react'
import { useAuth } from '../../auth/AuthProvider'
import { supabase } from '../../lib/supabase'
import { Borboleta } from '../../components/ui'
import { usePendentes } from './questionarios'

type Matricula = { start_date: string; end_date: string; programs: { name: string; duration_months: number } | null }

function saudacao() {
  const h = new Date().getHours()
  return h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite'
}

export function Inicio() {
  const { profile, signOut } = useAuth()
  const [m, setM] = useState<Matricula | null>(null)
  const pend = usePendentes()

  useEffect(() => {
    supabase.from('enrollments').select('start_date, end_date, programs(name, duration_months)').eq('status', 'ativa')
      .order('start_date', { ascending: false }).limit(1).maybeSingle()
      .then(({ data }) => setM(data as unknown as Matricula | null))
  }, [])

  const mes = m ? Math.min(m.programs?.duration_months ?? 6, Math.max(1, Math.ceil((Date.now() - new Date(m.start_date).getTime()) / (30.4 * 864e5)))) : 0
  const total = m?.programs?.duration_months ?? 6
  const nome = profile?.full_name?.split(' ')[0]

  return (
    <div className="px-4 pt-6 flex flex-col gap-5">
      <header>
        <h1 className="titulo-pagina !text-[30px]">{saudacao()}{nome ? `, ${nome}` : ''}.</h1>
        <p className="mt-1 text-corpo text-apoio first-letter:uppercase">{new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
      </header>

      <section className="relative overflow-hidden rounded-xl bg-cafe text-creme p-5">
        <Borboleta className="absolute -right-10 -top-6 w-48 h-36 text-areia/[0.1]" />
        <div className="relative flex flex-col gap-5">
          <p className="text-corpo text-areia">{m?.programs?.name ?? 'Programa Longevidade'}</p>
          {m ? (
            <>
              <p className="text-[30px] leading-none tabular-nums">Mês {mes} <span className="text-areia/80 text-bloco">de {total}</span></p>
              <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${total}, minmax(0, 1fr))` }} aria-hidden="true">
                {Array.from({ length: total }, (_, i) => <span key={i} className={`h-1.5 rounded-full ${i < mes ? 'bg-areia' : 'bg-areia/20'}`} />)}
              </div>
              <p className="text-corpo text-areia/80">Até {new Date(m.end_date).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' })}</p>
            </>
          ) : (
            <p className="font-display text-[24px] leading-tight">Seu acompanhamento começa no primeiro encontro.</p>
          )}
        </div>
      </section>

      <div className="cartao divide-y divide-regra overflow-hidden">
        {!!pend?.length && <Atalho to="/app/questionarios" destaque icone={<ClipboardList className="w-5 h-5" strokeWidth={1.5} />} titulo={`${pend.length} questionário${pend.length > 1 ? 's' : ''} para responder`} texto="Leva poucos minutos e prepara seu encontro" />}
        <Atalho to="/app/checkin" icone={<MessageCircle className="w-5 h-5" strokeWidth={1.5} />} titulo="Check-in" texto="Nenhum pendente agora" />
        <Atalho to="/app/protocolo" icone={<ClipboardList className="w-5 h-5" strokeWidth={1.5} />} titulo="Meu protocolo" texto="Tudo o que foi orientado na consulta" />
        <div className="px-4 py-3.5 flex items-center gap-3.5 min-h-[64px]">
          <CalendarDays className="w-5 h-5 text-apoio shrink-0" strokeWidth={1.5} />
          <div className="flex-1"><p className="text-corpo font-medium">Próximo encontro</p><p className="text-meta text-apoio">A confirmar com a clínica</p></div>
        </div>
      </div>

      <section className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between">
          <h2 className="titulo-bloco">Vídeos para lembrar</h2>
          <span className="text-meta text-apoio">4 vídeos curtos</span>
        </div>
        <div className="flex gap-3 overflow-x-auto -mx-4 px-4 pb-2 snap-x">
          {['Sangramento no início da reposição', 'Para que serve cada medicação', 'Como aplicar a caneta', 'Como medir peso e cintura'].map(t => (
            <div key={t} className="snap-start shrink-0 w-44 aspect-[4/5] max-w-full rounded-lg bg-tom p-4 flex flex-col justify-between">
              <PlayCircle className="w-7 h-7 text-cafe/60" strokeWidth={1.2} />
              <p className="text-bloco font-medium leading-snug">{t}</p>
            </div>
          ))}
        </div>
      </section>

      <button onClick={signOut} className="self-start inline-flex items-center gap-2 text-corpo text-apoio hover:text-texto"><LogOut className="w-4 h-4" />Sair</button>
    </div>
  )
}

function Atalho({ to, icone, titulo, texto, destaque }: { to: string; icone: ReactNode; titulo: string; texto: string; destaque?: boolean }) {
  return (
    <Link to={to} className="group px-4 py-3.5 flex items-center gap-3.5 min-h-[64px] hover:bg-tom/60 transition-colors">
      <span className={`shrink-0 ${destaque ? 'text-terracota' : 'text-apoio'}`}>{icone}</span>
      <div className="flex-1 min-w-0"><p className={`text-corpo font-medium ${destaque ? 'text-[#7c3f29]' : ''}`}>{titulo}</p><p className="text-meta text-apoio truncate">{texto}</p></div>
      <ArrowRight className="w-4 h-4 text-apoio group-hover:translate-x-0.5 transition-transform" strokeWidth={1.6} />
    </Link>
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
