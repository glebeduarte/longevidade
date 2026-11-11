// Prévia e formatação dos e-mails no painel. O visual vem do mesmo arquivo usado pelo envio (supabase/functions/_shared/modelo.ts).
import { montar, type Modelo } from '../../supabase/functions/_shared/modelo.ts'

export const SITE_URL = 'https://bartirareboucas.com.br'
export const previa = (m: Modelo) => montar(m, { APP: SITE_URL, SITE: SITE_URL })

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const P = 'style="margin:0 0 14px"'

/** Formatação simples para quem não escreve HTML: **negrito**, *itálico*, [texto](link), linhas com "- " viram lista, linha em branco separa parágrafos. */
function inline(t: string) {
  return esc(t)
    .replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')
    .replace(/(^|[^*])\*(?!\s)(.+?)\*/g, '$1<i>$2</i>')
    .replace(/\[([^\]]+)\]\(((?:https?:\/\/|\/)[^\s)]+)\)/g, (_, txt, url) => `<a href="${url.startsWith('/') ? SITE_URL + url : url}" style="color:#4a382d">${txt}</a>`)
}

export function textoParaHtml(texto: string): string {
  return texto.replace(/\r/g, '').trim().split(/\n\s*\n/).map(bloco => {
    const linhas = bloco.split('\n')
    if (linhas.every(l => /^\s*[-•]\s+/.test(l))) {
      return `<ul style="margin:0 0 14px;padding-left:20px">${linhas.map(l => `<li style="margin:0 0 6px">${inline(l.replace(/^\s*[-•]\s+/, ''))}</li>`).join('')}</ul>`
    }
    return `<p ${P}>${linhas.map(inline).join('<br>')}</p>`
  }).join('')
}

export const destaqueParaHtml = (t: string) => t.trim() ? t.trim().split('\n').map(inline).join('<br>') : null
