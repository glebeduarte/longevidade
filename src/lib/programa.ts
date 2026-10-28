import type { CheckinV2 } from './checkin'
export type Programa = { id: string; slug: string; name: string; duration_months: number; encounters: number; price_cents: number }
export type Matricula = { id: string; patient_id: string; program_id: string; start_date: string; end_date: string; status: 'ativa' | 'concluida' | 'cancelada'; programs?: Programa | null }
export type Encontro = {
  id: string; enrollment_id: string; patient_id: string; number: number; kind: 'inicial' | 'seguimento' | 'final' | 'parceiro'
  title: string; target_date: string; scheduled_at: string | null; status: 'previsto' | 'agendado' | 'realizado' | 'faltou' | 'cancelado'
  location: 'equilibre' | 'spinel' | null; notes: string | null; done_at: string | null
  patients?: { full_name: string } | null
}
export type RespostasCheckin = {
  fogachos?: number; sono?: number; humor?: number; energia?: number
  adesao?: 'sim' | 'parcial' | 'nao'; reacao?: boolean; reacao_texto?: string; peso?: number | null; mensagem?: string
}
export type Checkin = {
  id: string; patient_id: string; due_date: string; status: 'aberto' | 'respondido' | 'atendido' | 'perdido'
  answers: (RespostasCheckin & Partial<Omit<CheckinV2, 'sono' | 'humor' | 'energia' | 'peso' | 'reacao' | 'reacao_texto'>>) | null; reaction: boolean; submitted_at: string | null; reply: string | null; replied_at: string | null; reply_seen_at?: string | null
  patients?: { full_name: string } | null
}
export type ItemProtocolo = { tipo: 'medicacao' | 'habito' | 'exame' | 'orientacao'; titulo: string; detalhe?: string }
export type Protocolo = { id: string; patient_id: string; version: number; intro: string | null; items: ItemProtocolo[]; published_at: string | null; created_at: string }
export type Video = { id: string; title: string; description: string | null; url: string; duration_min: number | null; sort: number; active: boolean }

export const TIPO_ITEM: Record<ItemProtocolo['tipo'], string> = {
  medicacao: 'Medicações', habito: 'Hábitos', exame: 'Exames e medidas', orientacao: 'Orientações',
}
export const STATUS_ENCONTRO: Record<Encontro['status'], string> = {
  previsto: 'A agendar', agendado: 'Agendado', realizado: 'Realizado', faltou: 'Faltou', cancelado: 'Cancelado',
}
export const LOCAL: Record<string, string> = { equilibre: 'Clínica Equilibre', spinel: 'Instituto Spinel' }
export const ADESAO: Record<string, string> = { sim: 'Seguiu tudo', parcial: 'Seguiu em parte', nao: 'Não conseguiu seguir' }
export const SINTOMAS: Array<[keyof RespostasCheckin, string, string, string]> = [
  ['fogachos', 'Fogachos', 'nenhum', 'muitos'],
  ['sono', 'Sono', 'péssimo', 'ótimo'],
  ['humor', 'Humor', 'muito para baixo', 'muito bem'],
  ['energia', 'Energia', 'sem energia', 'disposta'],
]

const DIA = 864e5
/** Data local de um AAAA-MM-DD. */
export const dia = (d: string) => new Date(`${d.slice(0, 10)}T12:00:00`)
export const hojeISO = () => new Date(Date.now() - new Date().getTimezoneOffset() * 6e4).toISOString().slice(0, 10)

/** Prazo de resposta: 3 dias úteis depois do envio. */
export function prazo(enviado: string) {
  const d = new Date(enviado)
  let uteis = 0
  while (uteis < 3) { d.setDate(d.getDate() + 1); if (d.getDay() !== 0 && d.getDay() !== 6) uteis++ }
  return d
}
export function prazoTexto(enviado: string) {
  const p = prazo(enviado), dias = Math.ceil((p.getTime() - Date.now()) / DIA)
  return { vencido: dias < 0, texto: dias < 0 ? `prazo vencido há ${-dias} ${-dias === 1 ? 'dia' : 'dias'}` : dias === 0 ? 'vence hoje' : `vence em ${dias} ${dias === 1 ? 'dia' : 'dias'}` }
}

export const dataHora = (d: string) => new Date(d).toLocaleString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
export const dataLonga = (d: string) => dia(d).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' })

export function mesDoPrograma(m: Matricula) {
  const total = m.programs?.duration_months ?? 6
  const mes = Math.min(total, Math.max(1, Math.ceil((Date.now() - dia(m.start_date).getTime()) / (30.44 * DIA))))
  return { mes, total }
}

/** Converte link de YouTube ou Vimeo para o endereço de incorporação. */
export function embed(url: string) {
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([\w-]{6,})/)
  if (yt) return `https://www.youtube-nocookie.com/embed/${yt[1]}`
  const vm = url.match(/vimeo\.com\/(\d+)/)
  if (vm) return `https://player.vimeo.com/video/${vm[1]}`
  return null
}
