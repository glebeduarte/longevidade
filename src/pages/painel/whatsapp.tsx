import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { Aviso, Botao, Titulo } from '../../components/ui'

type Envio = { id: string; event: string; vars: Record<string, string>; created_at: string; sent_at: string | null; status_http: number | null; error: string | null }

const EVENTOS: Record<string, string> = {
  checkin_respondido: 'Check-in respondido',
  questionario_respondido: 'Questionário respondido',
}

export function WhatsApp() {
  const [numero, setNumero] = useState('')
  const [msg, setMsg] = useState<{ tipo: 'ok' | 'erro'; t: string } | null>(null)
  const [ocupado, setOcupado] = useState(false)
  const [hist, setHist] = useState<Envio[]>([])

  const carregar = () => {
    supabase.rpc('whatsapp_aviso_numero').then(({ data }) => setNumero((data as string) ?? ''))
    supabase.from('whatsapp_outbox').select('*').order('created_at', { ascending: false }).limit(30).then(({ data }) => setHist((data as Envio[]) ?? []))
  }
  useEffect(carregar, [])

  const salvar = async () => {
    setOcupado(true); setMsg(null)
    const { data, error } = await supabase.rpc('salvar_whatsapp_aviso', { p_numero: numero })
    setOcupado(false)
    if (error) return setMsg({ tipo: 'erro', t: error.message })
    setNumero((data as string) ?? '')
    setMsg({ tipo: 'ok', t: data ? 'Número salvo.' : 'Avisos por WhatsApp desligados.' })
  }

  const testar = async () => {
    setOcupado(true); setMsg(null)
    const { data, error } = await supabase.functions.invoke('enviar-whatsapp', { body: { teste: true } })
    setOcupado(false)
    if (error || !data?.ok) return setMsg({ tipo: 'erro', t: 'O teste não foi enviado. ' + (data?.texto ?? data?.erro ?? error?.message ?? '') })
    setMsg({ tipo: 'ok', t: 'Mensagem de teste enviada. Confira o WhatsApp.' })
  }

  return (
    <div className="flex flex-col gap-8">
      <Titulo rotulo="Configurações" sub="Quando uma paciente responde um check-in ou um questionário, chega um aviso neste WhatsApp. A mensagem traz só o nome e o link do painel.">Avisos por WhatsApp</Titulo>

      <section className="cartao p-5 flex flex-col gap-4 max-w-xl">
        <label className="flex flex-col gap-1.5">
          <span className="text-meta text-apoio">Número que recebe os avisos (DDD e número)</span>
          <input value={numero} onChange={e => setNumero(e.target.value)} className="campo" inputMode="tel" placeholder="84999998888" />
        </label>
        <p className="text-meta text-apoio">Deixe em branco para desligar os avisos.</p>
        <div className="flex flex-wrap gap-2">
          <Botao onClick={salvar} disabled={ocupado}>Salvar</Botao>
          <Botao variante="linha" onClick={testar} disabled={ocupado || !numero}>Enviar teste</Botao>
        </div>
        {msg && <Aviso tipo={msg.tipo}>{msg.t}</Aviso>}
      </section>

      <section className="cartao divide-y divide-regra">
        <h2 className="px-5 py-4 text-[15px] font-medium">Últimos envios</h2>
        {hist.length === 0 && <p className="px-5 py-4 text-apoio">Nenhum aviso enviado ainda.</p>}
        {hist.map(h => (
          <div key={h.id} className="px-5 py-3 flex flex-wrap justify-between gap-2">
            <span>{EVENTOS[h.event] ?? h.event} · {h.vars?.paciente}</span>
            <span className={`text-meta ${h.sent_at ? 'text-apoio' : 'text-[#7c3f29]'}`}>
              {new Date(h.created_at).toLocaleString('pt-BR')} · {h.sent_at ? 'enviado' : h.error ? `erro ${h.status_http ?? ''}` : 'na fila'}
            </span>
          </div>
        ))}
      </section>
    </div>
  )
}
