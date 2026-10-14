import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from 'react'

export function Titulo({ rotulo, children }: { rotulo?: string; children: ReactNode }) {
  return (
    <div>
      {rotulo && <p className="rotulo">{rotulo}</p>}
      <h1 className="font-display text-4xl leading-tight mt-2">{children}</h1>
      <span className="assinatura" />
    </div>
  )
}

export function Botao({ variante = 'cheio', className = '', ...p }: ButtonHTMLAttributes<HTMLButtonElement> & { variante?: 'cheio' | 'linha' }) {
  const base = 'min-h-[48px] px-6 font-sans text-sm uppercase tracking-[0.14em] transition-colors disabled:opacity-50'
  const v = variante === 'cheio'
    ? 'bg-cafe text-creme hover:bg-texto'
    : 'border border-areia text-texto hover:border-cafe'
  return <button className={`${base} ${v} ${className}`} {...p} />
}

export function Campo({ label, id, ...p }: InputHTMLAttributes<HTMLInputElement> & { label: string; id: string }) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="rotulo">{label}</label>
      <input id={id} className="min-h-[48px] bg-transparent border-b border-areia px-0 py-2 text-base focus:outline-none focus:border-cafe" {...p} />
    </div>
  )
}

export function Aviso({ tipo = 'info', children }: { tipo?: 'info' | 'erro'; children: ReactNode }) {
  return (
    <p role={tipo === 'erro' ? 'alert' : 'status'}
       className={`text-sm leading-relaxed ${tipo === 'erro' ? 'text-terracota' : 'text-apoio'}`}>
      {children}
    </p>
  )
}

export function Marca() {
  return (
    <div className="flex items-baseline gap-3">
      <span className="font-display text-2xl">Longevidade</span>
      <span className="rotulo hidden sm:inline">por Bartira Rebouças</span>
    </div>
  )
}
