import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Check, ClipboardList, Phone } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { Botao } from '../../components/ui'

type Envio = { id: string; questionnaire_id: string; created_at: string; questionnaires: { name: string; domain: string; instructions: string | null } | null }
type Pergunta = { id: string; position: number; text: string; kind: 'escolha' | 'sim_nao' | 'numero'; options: Array<{ label: string; value: number }>; alert_if_gt: number | null }

export function usePendentes() {
  const [lista, setLista] = useState<Envio[] | null>(null)
  useEffect(() => {
    supabase.from('questionnaire_assignments').select('id, questionnaire_id, created_at, questionnaires(name, domain, instructions, sort)')
      .eq('status', 'pendente').order('created_at')
      .then(({ data }) => setLista((data as unknown as Envio[]) ?? []))
  }, [])
  return lista
}

export function Questionarios() {
  const lista = usePendentes()
  return (
    <div className="px-5 pt-8 flex flex-col gap-8">
      <header>
        <p className="rotulo">Antes do seu encontro</p>
        <h1 className="font-display text-[44px] leading-[1.02] mt-3">Questionários</h1>
        <span className="assinatura" />
        <p className="mt-5 text-apoio leading-relaxed">Suas respostas chegam direto para a Dra. Bartira e deixam a consulta mais focada no que importa para você.</p>
      </header>
      {lista === null ? <p className="rotulo">Carregando</p> : lista.length === 0 ? (
        <div className="cartao p-8 flex flex-col items-center text-center gap-3">
          <span className="w-12 h-12 grid place-items-center bg-oliva/10 text-oliva"><Check className="w-5 h-5" /></span>
          <p className="font-display text-2xl">Tudo respondido</p>
          <p className="text-sm text-apoio">Quando houver um novo questionário, ele aparece aqui.</p>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {lista.map(e => (
            <li key={e.id}>
              <Link to={`/app/questionarios/${e.id}`} className="cartao p-5 flex items-center gap-4 group hover:border-cafe/40">
                <span className="w-11 h-11 grid place-items-center bg-areia/50 text-cafe"><ClipboardList className="w-5 h-5" strokeWidth={1.5} /></span>
                <div className="flex-1 min-w-0"><p className="font-display text-xl">{e.questionnaires?.name}</p><p className="text-sm text-apoio">{e.questionnaires?.domain}</p></div>
                <ArrowRight className="w-4 h-4 text-apoio group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export function Responder() {
  const { id } = useParams()
  const nav = useNavigate()
  const [envio, setEnvio] = useState<Envio | null>(null)
  const [perguntas, setPerguntas] = useState<Pergunta[]>([])
  const [pacienteId, setPacienteId] = useState<string | null>(null)
  const [i, setI] = useState(0)
  const [resp, setResp] = useState<Record<string, number>>({})
  const [numero, setNumero] = useState('')
  const [fase, setFase] = useState<'respondendo' | 'enviando' | 'fim' | 'apoio' | 'erro'>('respondendo')

  useEffect(() => {
    supabase.from('questionnaire_assignments').select('id, questionnaire_id, created_at, patient_id, questionnaires(name, domain, instructions)').eq('id', id!).maybeSingle()
      .then(({ data }) => {
        if (!data) return
        setEnvio(data as unknown as Envio); setPacienteId((data as { patient_id: string }).patient_id)
        supabase.from('questions').select('id, position, text, kind, options, alert_if_gt').eq('questionnaire_id', data.questionnaire_id).order('position')
          .then(({ data: q }) => setPerguntas((q as Pergunta[]) ?? []))
      })
  }, [id])

  if (!envio || !perguntas.length) return <div className="px-5 pt-10"><p className="rotulo">Carregando</p></div>

  const q = perguntas[i]
  const total = perguntas.length

  async function enviar(final: Record<string, number>) {
    setFase('enviando')
    const { error } = await supabase.from('questionnaire_responses').insert({
      assignment_id: envio!.id, patient_id: pacienteId, questionnaire_id: envio!.questionnaire_id, answers: final,
    })
    if (error) return setFase('erro')
    const alerta = perguntas.some(p => p.alert_if_gt != null && (final[p.id] ?? 0) > p.alert_if_gt)
    setFase(alerta ? 'apoio' : 'fim')
  }

  function escolher(v: number) {
    const novo = { ...resp, [q.id]: v }
    setResp(novo); setNumero('')
    if (i + 1 < total) setI(i + 1)
    else enviar(novo)
  }

  if (fase === 'apoio') {
    return (
      <div className="px-5 pt-10 flex flex-col gap-6">
        <h1 className="font-display text-[40px] leading-[1.05]">Obrigada por responder com sinceridade.</h1>
        <span className="assinatura" />
        <p className="leading-relaxed">Uma das suas respostas fala de pensamentos difíceis. A Dra. Bartira foi avisada e vai entrar em contato com você.</p>
        <div className="cartao p-6 flex flex-col gap-4">
          <p className="font-medium">Se você estiver em sofrimento agora, não espere.</p>
          <p className="flex items-center gap-3"><Phone className="w-5 h-5 text-terracota" /><span><b>CVV 188</b> · ligação gratuita, 24 horas, ou cvv.org.br</span></p>
          <p className="flex items-center gap-3"><Phone className="w-5 h-5 text-terracota" /><span><b>SAMU 192</b> · em caso de emergência</span></p>
          <p className="text-sm text-apoio">Procure também alguém de confiança para ficar com você.</p>
        </div>
        <Botao variante="linha" onClick={() => nav('/app/questionarios')}>Voltar</Botao>
      </div>
    )
  }

  if (fase === 'fim' || fase === 'erro') {
    return (
      <div className="px-5 pt-10 flex flex-col gap-6 items-start">
        <span className={`w-14 h-14 grid place-items-center ${fase === 'fim' ? 'bg-oliva/10 text-oliva' : 'bg-terracota/10 text-terracota'}`}><Check className="w-6 h-6" /></span>
        <h1 className="font-display text-[40px] leading-[1.05]">{fase === 'fim' ? 'Respostas enviadas' : 'Não foi possível enviar'}</h1>
        <p className="text-apoio">{fase === 'fim' ? 'A Dra. Bartira vai analisar junto com seus exames no encontro.' : 'Confira sua conexão e tente de novo.'}</p>
        <Botao onClick={() => nav('/app/questionarios')}>{fase === 'fim' ? 'Continuar' : 'Voltar'}</Botao>
      </div>
    )
  }

  return (
    <div className="px-5 pt-6 flex flex-col gap-8 min-h-[70vh]">
      <div className="flex items-center gap-4">
        <button onClick={() => (i > 0 ? setI(i - 1) : nav('/app/questionarios'))} aria-label="Voltar" className="w-10 h-10 grid place-items-center border border-areia hover:border-cafe"><ArrowLeft className="w-4 h-4" /></button>
        <div className="flex-1">
          <p className="rotulo">{envio.questionnaires?.name} · {i + 1} de {total}</p>
          <div className="mt-2 h-1 bg-areia/60"><div className="h-1 bg-cafe transition-all" style={{ width: `${((i + 1) / total) * 100}%` }} /></div>
        </div>
      </div>
      {i === 0 && envio.questionnaires?.instructions && <p className="text-sm text-apoio leading-relaxed -mb-2">{envio.questionnaires.instructions}</p>}
      <h1 key={q.id} className="font-display text-[32px] leading-[1.12] entra">{q.text}</h1>
      {q.kind === 'numero' ? (
        <form onSubmit={e => { e.preventDefault(); if (numero !== '') escolher(Number(numero.replace(',', '.'))) }} className="flex flex-col gap-4">
          <label htmlFor="num" className="sr-only">Resposta</label>
          <input id="num" inputMode="numeric" autoFocus value={numero} onChange={e => setNumero(e.target.value)}
            className="min-h-[64px] bg-white/70 border border-areia px-5 font-display text-4xl focus:outline-none focus:border-cafe" />
          <Botao type="submit" disabled={numero === ''}>{i + 1 < total ? 'Continuar' : 'Enviar respostas'}</Botao>
        </form>
      ) : (
        <div className="flex flex-col gap-2.5">
          {q.options.map(o => {
            const marcado = resp[q.id] === o.value
            return (
              <button key={o.label} disabled={fase === 'enviando'} onClick={() => escolher(o.value)}
                className={`text-left min-h-[58px] px-5 border text-[16px] transition-colors ${marcado ? 'bg-cafe text-creme border-cafe' : 'bg-[#faf7f2] border-areia hover:border-cafe/50'}`}>
                {o.label}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
