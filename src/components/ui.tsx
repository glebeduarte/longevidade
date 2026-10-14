import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from 'react'
import { AlertCircle, Check } from 'lucide-react'

export function Borboleta({ className = 'w-7 h-7' }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 28" className={className} fill="none" stroke="currentColor" strokeWidth="1.2" aria-hidden="true">
      <path d="M20 14C15 5 4 3 4 10s11 9 16 4Z" />
      <path d="M20 14c5-9 16-11 16-4s-11 9-16 4Z" />
      <path d="M20 14c-4 4-10 10-13 8M20 14c4 4 10 10 13 8" opacity=".55" />
    </svg>
  )
}

export function Marca({ claro = false }: { claro?: boolean }) {
  return (
    <div className={`flex items-center gap-3 ${claro ? 'text-creme' : 'text-texto'}`}>
      <Borboleta className={`w-8 h-6 ${claro ? 'text-areia' : 'text-cobre'}`} />
      <div className="leading-none">
        <span className="font-display text-[22px] tracking-wide">Longevidade</span>
        <span className={`block mt-1 text-[9px] uppercase tracking-[0.28em] ${claro ? 'text-areia/80' : 'text-apoio'}`}>Bartira Rebouças</span>
      </div>
    </div>
  )
}

export function Titulo({ rotulo, children, sub }: { rotulo?: string; children: ReactNode; sub?: ReactNode }) {
  return (
    <header className="entra">
      {rotulo && <p className="rotulo">{rotulo}</p>}
      <h1 className="font-display text-[40px] md:text-[52px] leading-[1.02] mt-3 font-normal">{children}</h1>
      <span className="assinatura" />
      {sub && <p className="mt-5 text-apoio leading-relaxed max-w-prose">{sub}</p>}
    </header>
  )
}

export function Botao({ variante = 'cheio', className = '', ...p }: ButtonHTMLAttributes<HTMLButtonElement> & { variante?: 'cheio' | 'linha' | 'texto' }) {
  const base = 'inline-flex items-center justify-center gap-2 min-h-[50px] px-7 text-[12px] font-medium uppercase tracking-[0.18em] transition-all duration-200 disabled:opacity-40 disabled:pointer-events-none'
  const v = {
    cheio: 'bg-cafe text-creme hover:bg-texto shadow-[0_8px_20px_-10px_rgba(58,43,34,0.6)] hover:-translate-y-px',
    linha: 'border border-cafe/30 text-cafe hover:border-cafe hover:bg-cafe/[0.04]',
    texto: 'px-0 min-h-0 text-apoio hover:text-texto normal-case tracking-normal text-sm',
  }[variante]
  return <button className={`${base} ${v} ${className}`} {...p} />
}

export function Campo({ label, id, dica, ...p }: InputHTMLAttributes<HTMLInputElement> & { label: string; id: string; dica?: string }) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="rotulo">{label}</label>
      <input id={id}
        className="min-h-[52px] bg-white/70 border border-areia px-4 text-[15px] placeholder:text-apoio/50 transition-colors focus:outline-none focus:border-cafe focus:bg-white"
        {...p} />
      {dica && <p className="text-xs text-apoio">{dica}</p>}
    </div>
  )
}

export function Selecao({ label, id, children, ...p }: SelectHTMLAttributes<HTMLSelectElement> & { label: string; id: string }) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="rotulo">{label}</label>
      <select id={id} className="min-h-[52px] bg-white/70 border border-areia px-4 text-[15px] focus:outline-none focus:border-cafe" {...p}>{children}</select>
    </div>
  )
}

export function Aviso({ tipo = 'info', children }: { tipo?: 'info' | 'erro' | 'ok'; children: ReactNode }) {
  const estilo = {
    info: 'border-areia bg-white/50 text-apoio',
    erro: 'border-terracota/40 bg-terracota/[0.06] text-terracota',
    ok: 'border-oliva/40 bg-oliva/[0.06] text-oliva',
  }[tipo]
  const Icone = tipo === 'ok' ? Check : AlertCircle
  return (
    <div role={tipo === 'erro' ? 'alert' : 'status'} className={`flex gap-3 items-start border px-4 py-3 text-sm leading-relaxed ${estilo}`}>
      {tipo !== 'info' && <Icone className="w-4 h-4 mt-0.5 shrink-0" />}
      <div>{children}</div>
    </div>
  )
}

export function Selo({ tom = 'neutro', children }: { tom?: 'neutro' | 'ok' | 'alerta' | 'escuro'; children: ReactNode }) {
  const t = {
    neutro: 'bg-areia/50 text-cafe',
    ok: 'bg-oliva/10 text-oliva',
    alerta: 'bg-terracota/10 text-terracota',
    escuro: 'bg-cafe text-creme',
  }[tom]
  return <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.12em] ${t}`}>{children}</span>
}

export function Iniciais({ nome, className = '' }: { nome?: string | null; className?: string }) {
  const i = (nome ?? '?').split(/\s+/).filter(Boolean).slice(0, 2).map(s => s[0]).join('').toUpperCase()
  return <span aria-hidden="true" className={`inline-grid place-items-center w-10 h-10 bg-areia/60 text-cafe font-display text-lg ${className}`}>{i}</span>
}
