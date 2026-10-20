import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from 'react'
import { AlertCircle, Check, Info } from 'lucide-react'

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
    <div className={`flex items-center gap-2.5 ${claro ? 'text-creme' : 'text-texto'}`}>
      <Borboleta className={`w-7 h-5 ${claro ? 'text-areia' : 'text-cobre'}`} />
      <div className="leading-none">
        <span className="font-display text-[21px]">Longevidade</span>
        <span className={`block mt-0.5 text-[11px] ${claro ? 'text-areia/80' : 'text-apoio'}`}>Dra. Bartira Rebouças</span>
      </div>
    </div>
  )
}

/** Título da página: serifa da marca, 32px, com a linha de cobre de assinatura. */
export function Titulo({ rotulo, children, sub, acao }: { rotulo?: ReactNode; children: ReactNode; sub?: ReactNode; acao?: ReactNode }) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
      <div className="min-w-0">
        <h1 className="titulo-pagina">{children}</h1>
        {(sub || rotulo) && <p className="mt-2 text-corpo text-apoio max-w-prose">{[rotulo, sub].filter(Boolean).map((x, i) => <span key={i}>{i ? ' · ' : ''}{x}</span>)}</p>}
      </div>
      {acao && <div className="flex flex-wrap gap-2">{acao}</div>}
    </header>
  )
}

type Variante = 'cheio' | 'linha' | 'texto' | 'suave'
export function Botao({ variante = 'cheio', tamanho = 'md', className = '', ...p }:
  ButtonHTMLAttributes<HTMLButtonElement> & { variante?: Variante; tamanho?: 'sm' | 'md' }) {
  const base = 'inline-flex items-center justify-center gap-2 rounded font-medium whitespace-nowrap transition-[background-color,border-color,color,transform] duration-150 active:translate-y-px disabled:opacity-45 disabled:pointer-events-none'
  const t = variante === 'texto' ? '' : tamanho === 'sm' ? 'h-9 px-3.5 text-[13px]' : 'h-10 px-4 text-corpo'
  const v = {
    cheio: 'bg-cafe text-creme hover:bg-texto',
    linha: 'bg-folha border border-controle text-texto hover:border-cafe/60 hover:bg-white',
    suave: 'bg-tom text-texto hover:bg-ativo',
    texto: 'text-cafe hover:text-texto text-corpo underline-offset-4 hover:underline',
  }[variante]
  return <button className={`${base} ${t} ${v} ${className}`} {...p} />
}

export function Campo({ label, id, dica, className = '', ...p }: InputHTMLAttributes<HTMLInputElement> & { label: string; id: string; dica?: string }) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label htmlFor={id} className="text-corpo font-medium text-texto">{label}</label>
      <input id={id} className="campo" {...p} />
      {dica && <p className="text-meta text-apoio">{dica}</p>}
    </div>
  )
}

export function Selecao({ label, id, children, ...p }: SelectHTMLAttributes<HTMLSelectElement> & { label: string; id: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-corpo font-medium text-texto">{label}</label>
      <select id={id} className="campo" {...p}>{children}</select>
    </div>
  )
}

export function Aviso({ tipo = 'info', children }: { tipo?: 'info' | 'erro' | 'ok'; children: ReactNode }) {
  const estilo = {
    info: 'bg-tom text-apoio',
    erro: 'bg-[#f6e6df] text-[#7c3f29]',
    ok: 'bg-[#e8ecdf] text-positivo',
  }[tipo]
  const Icone = tipo === 'ok' ? Check : tipo === 'erro' ? AlertCircle : Info
  return (
    <div role={tipo === 'erro' ? 'alert' : 'status'} className={`flex gap-2.5 items-start rounded-lg px-4 py-3 text-corpo ${estilo}`}>
      <Icone className="w-4 h-4 mt-0.5 shrink-0" strokeWidth={1.75} />
      <div>{children}</div>
    </div>
  )
}

/** Selo: pílula clara com texto escuro do mesmo tom. */
export function Selo({ tom = 'neutro', children }: { tom?: 'neutro' | 'ok' | 'alerta' | 'escuro' | 'risco'; children: ReactNode }) {
  const t = {
    neutro: 'bg-tom text-apoio',
    ok: 'bg-[#e8ecdf] text-positivo',
    alerta: 'bg-[#f5e7dc] text-atencao',
    risco: 'bg-[#f6e3dc] text-[#7c3f29]',
    escuro: 'bg-cafe text-creme',
  }[tom]
  return <span className={`inline-flex items-center gap-1.5 h-6 px-2.5 rounded-full text-meta font-medium whitespace-nowrap ${t}`}>{children}</span>
}

// Cada pessoa ganha um tom claro estável, a partir do nome.
const TINTAS = [['#efe1d6', '#7a4a33'], ['#e4e8da', '#45512f'], ['#ece4d5', '#6a5338'], ['#e6e0ea', '#56465f'], ['#dfe6e4', '#3e5450'], ['#f0dfdc', '#7a3f39']]
export function tinta(nome?: string | null) {
  let h = 0
  for (const c of nome ?? '') h = (h * 31 + c.charCodeAt(0)) >>> 0
  return TINTAS[h % TINTAS.length]
}

export function Iniciais({ nome, className = 'w-9 h-9 text-[13px]' }: { nome?: string | null; className?: string }) {
  const i = (nome ?? '?').replace(/\(.*?\)/g, '').split(/\s+/).filter(Boolean).slice(0, 2).map(s => s[0]).join('').toUpperCase()
  const [bg, fg] = tinta(nome)
  return <span aria-hidden="true" style={{ background: bg, color: fg }} className={`inline-grid place-items-center shrink-0 rounded-full font-medium ${className}`}>{i}</span>
}

/** Bloco com título: o padrão de cartão das telas de trabalho. */
export function Bloco({ titulo, sub, acao, children, className = '', semPad = false, id }:
  { titulo: ReactNode; sub?: ReactNode; acao?: ReactNode; children: ReactNode; className?: string; semPad?: boolean; id?: string }) {
  return (
    <section className={`cartao ${className}`} aria-labelledby={id}>
      <div className="flex items-start justify-between gap-4 px-5 pt-4 pb-3">
        <div className="min-w-0">
          <h2 id={id} className="titulo-bloco">{titulo}</h2>
          {sub && <p className="text-meta text-apoio mt-0.5">{sub}</p>}
        </div>
        {acao && <div className="shrink-0 flex items-center gap-2">{acao}</div>}
      </div>
      <div className={semPad ? '' : 'px-5 pb-5'}>{children}</div>
    </section>
  )
}

/** Estado vazio: mantém o quadro e diz em uma frase o que vem aqui. */
export function Vazio({ titulo, texto, acao }: { titulo: string; texto?: string; acao?: ReactNode }) {
  return (
    <div className="rounded-lg border border-dashed border-controle px-4 py-5 flex flex-wrap items-center gap-x-4 gap-y-2">
      <div className="flex-1 min-w-[200px]">
        <p className="text-corpo font-medium">{titulo}</p>
        {texto && <p className="text-meta text-apoio mt-0.5">{texto}</p>}
      </div>
      {acao}
    </div>
  )
}

/** Abas de seção: sublinhado café, rolam de lado no celular. */
export function Abas<K extends string>({ itens, atual, aoTrocar, rotulo }: { itens: Array<[K, string, ReactNode?]>; atual: K; aoTrocar: (k: K) => void; rotulo: string }) {
  return (
    <div role="tablist" aria-label={rotulo} className="flex gap-6 border-b border-borda overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
      {itens.map(([k, r, extra]) => (
        <button key={k} role="tab" aria-selected={atual === k} onClick={() => aoTrocar(k)}
          className={`relative h-11 text-corpo whitespace-nowrap inline-flex items-center gap-2 transition-colors ${atual === k ? 'text-texto font-medium' : 'text-apoio hover:text-texto'}`}>
          {r}{extra}
          <span className={`absolute left-0 right-0 -bottom-px h-0.5 rounded-full ${atual === k ? 'bg-cafe' : 'bg-transparent'}`} />
        </button>
      ))}
    </div>
  )
}

/** Carregando: a forma final em cinza, sem brilho. */
export function Esqueleto({ linhas = 3 }: { linhas?: number }) {
  return (
    <div className="flex flex-col gap-3" aria-busy="true" aria-label="Carregando">
      {Array.from({ length: linhas }, (_, i) => <span key={i} className="h-4 rounded bg-tom" style={{ width: `${90 - i * 14}%` }} />)}
    </div>
  )
}
