// "Ver como paciente": a médica abre o app da paciente em modo de leitura.
// Guardado na aba do navegador (sessionStorage): some ao fechar a aba.
import { useSyncExternalStore } from 'react'

export type Vista = { pid: string; nome: string; userId: string | null }
const CHAVE = 'longevidade:vista'
const ouvintes = new Set<() => void>()

function ler(): Vista | null {
  try { return JSON.parse(sessionStorage.getItem(CHAVE) ?? 'null') } catch { return null }
}
let atual = ler()

export function entrarVista(v: Vista) {
  try { sessionStorage.setItem(CHAVE, JSON.stringify(v)) } catch { /* sem armazenamento */ }
  atual = v; ouvintes.forEach(f => f())
}
export function sairVista() {
  try { sessionStorage.removeItem(CHAVE) } catch { /* sem armazenamento */ }
  atual = null; ouvintes.forEach(f => f())
}
export function useVista() {
  return useSyncExternalStore(f => { ouvintes.add(f); return () => ouvintes.delete(f) }, () => atual)
}
export const vistaAtual = () => atual

/** Restringe uma consulta à paciente em visualização. Para a própria paciente, o banco já filtra. */
export function daPaciente<T>(q: T, campo = 'patient_id'): T {
  return atual ? (q as unknown as { eq: (c: string, v: string) => T }).eq(campo, atual.pid) : q
}
