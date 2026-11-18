// Envia a fila de WhatsApp (whatsapp_outbox) pelo MasterZap.
// Chamada pelo banco logo após cada aviso e a cada 5 minutos (cabeçalho x-cron-token).
// A médica pode chamar com { teste: true } para mandar uma mensagem de teste ao número cadastrado.
import { createClient } from 'npm:@supabase/supabase-js@2.45.4'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-cron-token',
}
const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { ...cors, 'Content-Type': 'application/json' } })
const API = 'https://app.masterzapbr.com/api/v1/send'

async function enviar(corpo: Record<string, unknown>) {
  const r = await fetch(API, {
    method: 'POST',
    headers: { Authorization: `Bearer ${Deno.env.get('MASTERZAP_API_KEY')}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(corpo),
  })
  const texto = await r.text()
  return { status: r.status, ok: r.status === 200, texto: texto.slice(0, 500) }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (!Deno.env.get('MASTERZAP_API_KEY')) return json({ erro: 'Configure MASTERZAP_API_KEY.' }, 500)
  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
  const corpo = await req.json().catch(() => ({}))

  const token = req.headers.get('x-cron-token')
  const doCron = token ? (await admin.rpc('cron_token_ok', { t: token })).data === true : false
  if (!doCron) {
    const caller = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } } })
    const { data: medica } = await caller.rpc('is_medica')
    if (!medica) return json({ erro: 'Sem permissão.' }, 403)
    if (corpo.teste) {
      const { data: numero } = await caller.rpc('whatsapp_aviso_numero')
      if (!numero) return json({ erro: 'Cadastre o número antes de testar.' }, 400)
      const r = await enviar({ to: numero, text: 'Teste do app Longevidade: os avisos de check-in e questionário vão chegar neste número.' })
      return json(r, r.ok ? 200 : 502)
    }
  }

  const { data: fila } = await admin.from('whatsapp_outbox').select('*').is('sent_at', null).lt('tentativas', 5).order('created_at').limit(40)
  let enviados = 0
  for (const m of fila ?? []) {
    const r = await enviar({ event: m.event, to: m.to_phone, vars: m.vars })
    // 401/404 são erros de configuração: não adianta tentar de novo
    const definitivo = r.ok || r.status === 401 || r.status === 404
    await admin.from('whatsapp_outbox').update({
      sent_at: r.ok ? new Date().toISOString() : null,
      tentativas: definitivo && !r.ok ? 5 : m.tentativas + 1,
      status_http: r.status,
      error: r.ok ? null : r.texto,
    }).eq('id', m.id)
    if (r.ok) enviados++
    await new Promise(ok => setTimeout(ok, 1100)) // limite do MasterZap: 60 por minuto
  }
  return json({ enviados, processados: fila?.length ?? 0 })
})
