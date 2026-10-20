// Envia os e-mails da fila (email_outbox) pelo Resend e enfileira os lembretes de check-in do dia.
// Segredos necessários: RESEND_API_KEY e EMAIL_REMETENTE (ex.: "Dra. Bartira Rebouças <contato@dominio.com.br>").
// Sem a chave, a função só enfileira e informa quantos e-mails estão pendentes.
import { createClient } from 'npm:@supabase/supabase-js@2.45.4'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}
const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { ...cors, 'Content-Type': 'application/json' } })

const APP = Deno.env.get('APP_URL') ?? 'https://longevidade-glebeduarte.vercel.app'

function html(assunto: string, corpo: string) {
  return `<!doctype html><html lang="pt-BR"><body style="margin:0;background:#f5f1eb;font-family:Helvetica,Arial,sans-serif;color:#2e221b">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 16px">
<table role="presentation" width="100%" style="max-width:520px;background:#fffdfa;border:1px solid #e6ddd1;border-radius:10px">
<tr><td style="padding:28px 28px 8px;font-family:Georgia,serif;font-size:22px">Longevidade</td></tr>
<tr><td style="padding:0 28px;font-size:12px;color:#6b5a4d">Dra. Bartira Rebouças</td></tr>
<tr><td style="padding:24px 28px 8px;font-size:18px;font-weight:600">${assunto}</td></tr>
<tr><td style="padding:0 28px 24px;font-size:15px;line-height:24px">${corpo}</td></tr>
<tr><td style="padding:0 28px 28px"><a href="${APP}" style="display:inline-block;background:#4a382d;color:#f3eee7;text-decoration:none;padding:12px 20px;border-radius:6px;font-size:14px">Abrir o app</a></td></tr>
</table>
<p style="font-size:12px;color:#6b5a4d;margin-top:16px">Ciência e acolhimento</p>
</td></tr></table></body></html>`
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

  // Só a médica (ou a chamada agendada com a chave de serviço) pode disparar
  const auth = req.headers.get('Authorization') ?? ''
  if (!auth.includes(Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)) {
    const caller = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: auth } } })
    const { data: ok } = await caller.rpc('is_medica')
    if (!ok) return json({ erro: 'Sem permissão.' }, 403)
  }

  const { data: lembretes } = await admin.rpc('enfileirar_lembretes')
  const { data: fila } = await admin.from('email_outbox').select('*').is('sent_at', null).order('created_at').limit(50)
  const chave = Deno.env.get('RESEND_API_KEY'), de = Deno.env.get('EMAIL_REMETENTE')
  if (!chave || !de) return json({ lembretes, pendentes: fila?.length ?? 0, aviso: 'Configure RESEND_API_KEY e EMAIL_REMETENTE para enviar.' })

  let enviados = 0
  for (const e of fila ?? []) {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${chave}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: de, to: e.to_email, subject: e.subject, html: html(e.subject, e.body), text: e.body }),
    })
    if (r.ok) { enviados++; await admin.from('email_outbox').update({ sent_at: new Date().toISOString(), error: null }).eq('id', e.id) }
    else await admin.from('email_outbox').update({ error: (await r.text()).slice(0, 300) }).eq('id', e.id)
  }
  return json({ lembretes, enviados, restantes: (fila?.length ?? 0) - enviados })
})
