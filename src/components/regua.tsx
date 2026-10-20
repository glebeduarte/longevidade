import { NIVEL, type Nivel } from '../lib/faixas'
import { nivelDe, fmt, type Faixa } from '../lib/clinica'

export const TOM: Record<Nivel, string> = {
  ruim: 'bg-terracota', atencao: 'bg-cobre/70', normal: 'bg-areia', bom: 'bg-oliva/55', otimo: 'bg-oliva',
}

/** A régua: as faixas do indicador lado a lado, com a marca do valor da paciente. */
export function Regua({ valor, bands, compacta = false }: { valor: number | null; bands: Faixa[]; compacta?: boolean }) {
  if (!bands.length) return <div className={`${compacta ? 'h-1.5' : 'h-2'} bg-areia/40`} aria-hidden="true" />
  const atual = nivelDe(valor, bands)
  let i = valor == null ? -1 : bands.findIndex(b => b.max == null || valor < b.max)
  if (i < 0 && valor != null) i = bands.length - 1
  let pos: number | null = null
  if (valor != null && i >= 0) {
    const ini = bands[i - 1]?.max ?? null, fim = bands[i].max
    const lo = ini ?? (fim != null ? fim * 0.75 : 0)
    const hi = fim ?? (ini != null ? ini * 1.3 : lo + 1)
    const t = Math.min(0.92, Math.max(0.08, (valor - lo) / (hi - lo || 1)))
    pos = ((i + t) / bands.length) * 100
  }
  return (
    <div className="relative pt-2" role="img" aria-label={atual ? `Faixa ${NIVEL[atual].rotulo}` : 'Sem valor'}>
      <div className={`flex gap-[2px] ${compacta ? 'h-1.5' : 'h-2'}`}>
        {bands.map((b, k) => (
          <span key={k} className={`flex-1 ${TOM[b.level]} ${k === i ? '' : 'opacity-30'}`} />
        ))}
      </div>
      {pos != null && (
        <span className="absolute top-0 -translate-x-1/2 w-[3px] h-[calc(100%+4px)] bg-texto" style={{ left: `${pos}%` }} aria-hidden="true" />
      )}
    </div>
  )
}

export function LinhaIndicador({ nome, valor, unidade, bands, data, nota, anterior }:
  { nome: string; valor: number | null; unidade: string; bands: Faixa[]; data?: string; nota?: string; anterior?: number | null }) {
  const n = nivelDe(valor, bands)
  const delta = valor != null && anterior != null ? valor - anterior : null
  return (
    <div className="grid grid-cols-[1fr_auto] sm:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_auto] items-end gap-x-6 gap-y-2 py-4">
      <div className="min-w-0">
        <p className="text-[15px] truncate">{nome}</p>
        <p className="text-xs text-apoio mt-0.5">{[data, nota].filter(Boolean).join(' · ') || ' '}</p>
      </div>
      <div className="order-3 sm:order-none col-span-2 sm:col-span-1"><Regua valor={valor} bands={bands} /></div>
      <div className="text-right min-w-[92px]">
        <p className="font-display text-[28px] leading-none tabular-nums">
          {valor == null ? <span className="text-apoio/60">·</span> : fmt(valor)}
          <span className="text-xs text-apoio ml-1 font-sans">{unidade}</span>
        </p>
        <p className={`text-[11px] mt-1 ${n ? NIVEL[n].cor : 'text-apoio'}`}>
          {n ? NIVEL[n].rotulo : valor == null ? 'Sem registro' : 'Sem faixa'}
          {delta != null && delta !== 0 && <span className="text-apoio"> · {delta > 0 ? '+' : ''}{fmt(delta)}</span>}
        </p>
      </div>
    </div>
  )
}
