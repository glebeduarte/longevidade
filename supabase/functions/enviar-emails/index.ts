// Envia os e-mails da fila (email_outbox) pelo Resend, com o modelo visual de cada tipo.
// Também enfileira os lembretes de check-in e os passos da sequência dos e-books.
// Chamada a cada 5 minutos pelo pg_cron (cabeçalho x-cron-token) ou manualmente pela médica.
// GET ?sair=<token> descadastra o contato da sequência.
import { createClient } from 'npm:@supabase/supabase-js@2.45.4'
import { APP, SITE, type Modelo, enviar, montar } from '../_shared/email.ts'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-cron-token',
}
const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { ...cors, 'Content-Type': 'application/json' } })
const FN = `${Deno.env.get('SUPABASE_URL')}/functions/v1/enviar-emails`

type Item = { id: string; to_email: string; subject: string; body: string; kind: string | null; link: string | null; destaque: string | null; sair_token: string | null; rotulo: string | null; titulo: string | null; botao: string | null }

/** Visual de cada tipo de e-mail. */
function modelo(e: Item): Modelo {
  const p = (t: string) => `<p style="margin:0 0 14px">${t}</p>`
  const corpo = e.body.split(/<br\s*\/?><br\s*\/?>/).map(p).join('')
  const app: [string, string] = ['Abrir o app', `${APP}/app`]
  const painel: [string, string] = ['Abrir o painel', `${APP}/painel`]
  const sair = e.sair_token ? `${FN}?sair=${e.sair_token}` : null
  switch (e.kind) {
    case 'questionario': return { rotulo: 'Programa Longevidade', titulo: e.subject, corpo, destaque: e.destaque, botao: ['Responder o questionário', `${APP}/app`], rodape: 'paciente' }
    case 'mapa': return { rotulo: 'Programa Longevidade', titulo: e.subject, corpo, botao: ['Ver meu Mapa da Saúde', `${APP}/app/evolucao`], rodape: 'paciente' }
    case 'protocolo': return { rotulo: 'Plano de cuidado', titulo: e.subject, corpo, botao: ['Ver meu plano de cuidado', `${APP}/app/protocolo`], rodape: 'paciente' }
    case 'checkin_resposta': return { rotulo: 'Check-in', titulo: e.subject, corpo, destaque: e.destaque, botao: ['Abrir o app', `${APP}/app`], rodape: 'paciente' }
    case 'checkin_lembrete': return { rotulo: 'Check-in da semana', titulo: e.subject, corpo, botao: ['Fazer meu check-in', `${APP}/app/checkin`], rodape: 'paciente' }
    case 'material': return { rotulo: 'Seu material', titulo: e.subject, corpo, botao: e.link ? ['Baixar o material', e.link] : null, rodape: 'site', sair, previa: 'O link para baixar está aqui dentro.' }
    case 'sequencia': return { rotulo: 'Dra. Bartira Rebouças', titulo: e.subject, corpo, destaque: e.destaque, botao: e.link ? [e.link.includes('/contato') ? 'Agendar consulta' : 'Saiba mais', e.link] : null, rodape: 'site', sair }
    case 'campanha':
    case 'campanha_paciente':
    case 'campanha_teste': {
      const motivo = e.kind === 'campanha_paciente' ? 'Você recebe este e-mail porque participa do programa Longevidade.' : 'Você recebe estes e-mails porque se cadastrou no site.'
      return { rotulo: e.rotulo || 'Dra. Bartira Rebouças', titulo: e.titulo || e.subject, corpo: e.body, destaque: e.destaque,
        botao: e.link && e.botao ? [e.botao, e.link] : null, rodape: e.kind === 'campanha_paciente' ? 'paciente' : 'site',
        sair: e.kind === 'campanha_teste' ? `${FN}?sair=teste` : sair, motivo }
    }
    case 'lead': return { rotulo: 'Novo contato pelo site', titulo: e.subject, corpo, destaque: e.destaque, botao: ['Ver contatos no painel', `${APP}/painel/site`], rodape: 'interno' }
    case 'alerta': return { rotulo: 'Alerta do check-in', titulo: e.subject, corpo, botao: painel, rodape: 'interno' }
    default: return { rotulo: 'Dra. Bartira Rebouças', titulo: e.subject, corpo, destaque: e.destaque, botao: app, rodape: 'paciente' }
  }
}

const pagina = (t: string) => new Response(`<!doctype html><html lang="pt-BR"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Dra. Bartira Rebouças</title>
<body style="margin:0;background:#f3eee7;font-family:Helvetica,Arial,sans-serif;color:#3a2b22"><div style="max-width:480px;margin:80px auto;padding:0 24px;text-align:center">
<h1 style="font-family:Georgia,serif;font-weight:normal;font-size:28px">${t}</h1><p><a href="${SITE}" style="color:#4a382d">Voltar ao site</a></p></div></body></html>`, { headers: { 'Content-Type': 'text/html; charset=utf-8' } })

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

  // Descadastro da sequência
  const sair = new URL(req.url).searchParams.get('sair')
  if (sair) {
    const { data } = await admin.rpc('descadastrar_lead', { t: sair })
    return pagina(data ? 'Pronto. Você não vai mais receber estes e-mails.' : 'Este link não é mais válido.')
  }

  // Só a médica, a chave de serviço ou o agendamento podem disparar
  const auth = req.headers.get('Authorization') ?? ''
  const token = req.headers.get('x-cron-token')
  const doCron = token ? (await admin.rpc('cron_token_ok', { t: token })).data === true : false
  if (!doCron && !auth.includes(Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)) {
    const caller = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: auth } } })
    const { data: ok } = await caller.rpc('pode_gerir_site')
    if (!ok) return json({ erro: 'Sem permissão.' }, 403)
  }

  const { data: lembretes } = await admin.rpc('enfileirar_lembretes')
  const { data: sequencia } = await admin.rpc('enfileirar_sequencia')
  const { data: fila } = await admin.from('email_outbox').select('*').is('sent_at', null).order('created_at').limit(50)
  if (!Deno.env.get('RESEND_API_KEY')) return json({ lembretes, sequencia, pendentes: fila?.length ?? 0, aviso: 'Configure RESEND_API_KEY para enviar.' })

  let enviados = 0
  for (const e of (fila ?? []) as Item[]) {
    const m = modelo(e)
    const extra = m.sair ? { headers: { 'List-Unsubscribe': `<${m.sair}>`, 'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click' } } : {}
    const r = await enviar(e.to_email, e.subject, montar(m), extra)
    await new Promise(ok => setTimeout(ok, 550)) // limite do Resend: 2 envios por segundo
    if (r.ok) { enviados++; await admin.from('email_outbox').update({ sent_at: new Date().toISOString(), error: null }).eq('id', e.id) }
    else await admin.from('email_outbox').update({ error: r.erro }).eq('id', e.id)
  }
  return json({ lembretes, sequencia, enviados, restantes: (fila?.length ?? 0) - enviados })
})
