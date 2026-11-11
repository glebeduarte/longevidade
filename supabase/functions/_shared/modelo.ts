// Modelo visual dos e-mails. Sem dependência de Deno: o painel usa este mesmo arquivo na prévia do editor de e-mails.
// Tabelas e estilos inline para funcionar no Gmail, Outlook e Apple Mail.
export const C = { fundo: '#f3eee7', cartao: '#fffdfa', borda: '#e6ddd1', texto: '#3a2b22', apoio: '#76665a', cafe: '#4a382d', creme: '#f3eee7', terracota: '#9a5a42', areia: '#d8cbb9' }

export type Modelo = {
  rotulo: string            // linha curta em caixa alta acima do título
  titulo: string
  corpo: string             // HTML simples (parágrafos, <b>, <br>, listas)
  botao?: [string, string] | null
  destaque?: string | null  // caixa com fundo areia (citação, resposta da equipe, dados)
  rodape?: 'paciente' | 'site' | 'interno'
  sair?: string | null      // link de descadastro
  motivo?: string | null    // frase antes do link de descadastro
  previa?: string           // texto que aparece na prévia da caixa de entrada
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

export function montar(m: Modelo, base: { APP: string; SITE: string }): string {
  const { APP, SITE } = base
  const LOGO = `${APP}/marca/logo-escuro.png`
  const rodape = m.rodape === 'interno'
    ? 'Aviso automático do sistema Longevidade. Não responda este e-mail.'
    : `Dra. Bartira Rebouças · Endocrinologia · CRM-RN 5297 · RQE 2986<br>Clínica Equilibre · Instituto Espinel · Natal/RN`
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><title>${esc(m.titulo)}</title></head>
<body style="margin:0;padding:0;background:${C.fundo};-webkit-text-size-adjust:100%">
<div style="display:none;max-height:0;overflow:hidden;opacity:0">${esc(m.previa ?? m.titulo)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.fundo}"><tr><td align="center" style="padding:36px 14px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px">
<tr><td align="center" style="padding:0 0 26px"><a href="${SITE}"><img src="${LOGO}" alt="Dra. Bartira Rebouças" width="190" style="display:block;width:190px;max-width:60%;height:auto;border:0"></a></td></tr>
<tr><td style="background:${C.cartao};border:1px solid ${C.borda};padding:40px 36px 36px">
<p style="margin:0 0 14px;font-family:Helvetica,Arial,sans-serif;font-size:11px;letter-spacing:2.5px;text-transform:uppercase;color:${C.apoio}">${esc(m.rotulo)}</p>
<h1 style="margin:0;font-family:Georgia,'Times New Roman',serif;font-weight:normal;font-size:28px;line-height:34px;color:${C.texto}">${esc(m.titulo)}</h1>
<div style="width:40px;height:1px;background:${C.terracota};margin:20px 0 24px;line-height:1px;font-size:1px">&nbsp;</div>
<div style="font-family:Helvetica,Arial,sans-serif;font-size:16px;line-height:26px;color:${C.texto}">${m.corpo}</div>
${m.destaque ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0 4px"><tr><td style="background:${C.fundo};border-left:3px solid ${C.areia};padding:18px 20px;font-family:Helvetica,Arial,sans-serif;font-size:15px;line-height:24px;color:${C.texto}">${m.destaque}</td></tr></table>` : ''}
${m.botao ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:30px 0 4px"><tr><td style="background:${C.cafe}"><a href="${m.botao[1]}" style="display:inline-block;padding:15px 28px;font-family:Helvetica,Arial,sans-serif;font-size:13px;letter-spacing:1.5px;text-transform:uppercase;color:${C.creme};text-decoration:none">${esc(m.botao[0])}</a></td></tr></table>` : ''}
</td></tr>
<tr><td align="center" style="padding:26px 10px 0;font-family:Georgia,'Times New Roman',serif;font-style:italic;font-size:16px;color:${C.cafe}">Ciência e acolhimento</td></tr>
<tr><td align="center" style="padding:10px 10px 0;font-family:Helvetica,Arial,sans-serif;font-size:12px;line-height:19px;color:${C.apoio}">${rodape}</td></tr>
${m.sair ? `<tr><td align="center" style="padding:14px 10px 0;font-family:Helvetica,Arial,sans-serif;font-size:12px;color:${C.apoio}">${m.motivo ?? 'Você recebe estes e-mails porque pediu um material no site.'} <a href="${m.sair}" style="color:${C.apoio}">Não quero mais receber</a>.</td></tr>` : ''}
</table></td></tr></table></body></html>`
}
