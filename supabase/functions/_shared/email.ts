// Envio pelo Resend. O visual fica em modelo.ts, compartilhado com a prévia do painel.
import { montar as montarBase, type Modelo } from './modelo.ts'
export type { Modelo }
export const APP = Deno.env.get('APP_URL') ?? 'https://longevidade-black.vercel.app'
export const SITE = Deno.env.get('SITE_URL') ?? APP
export const REMETENTE = Deno.env.get('EMAIL_REMETENTE') ?? 'Dra. Bartira Rebouças <contato@bartirareboucas.com.br>'
export const montar = (m: Modelo) => montarBase(m, { APP, SITE })

export function texto(html: string): string {
  return html.replace(/<br\s*\/?>/g, '\n').replace(/<\/p>/g, '\n\n').replace(/<li>/g, '• ').replace(/<\/li>/g, '\n').replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').replace(/\n{3,}/g, '\n\n').trim()
}

export async function enviar(para: string, assunto: string, html: string, extra: Record<string, unknown> = {}) {
  const chave = Deno.env.get('RESEND_API_KEY')
  if (!chave) return { ok: false, erro: 'RESEND_API_KEY ausente' }
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${chave}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: REMETENTE, to: para, subject: assunto, html, text: texto(html), ...extra }),
  })
  return r.ok ? { ok: true } : { ok: false, erro: (await r.text()).slice(0, 300) }
}
