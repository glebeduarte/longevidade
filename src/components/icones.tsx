// Ilustrações próprias do Longevidade: traço suave e preenchimento claro, cada tema com a sua cor.
// Desenhadas em 32x32 para ficarem legíveis em tamanhos grandes, pensando em quem lê com mais dificuldade.
import type { ReactNode } from 'react'

export type Tema = 'humor' | 'sono' | 'alimentacao' | 'alcool' | 'cigarro' | 'atividade' | 'peso' | 'cintura' | 'coracao' | 'gordura' | 'protocolo' | 'checkin' | 'encontro' | 'evolucao' | 'questionario' | 'video' | 'forca' | 'figado' | 'rins' | 'metabolismo' | 'fogacho' | 'fogacho'

/** Cor de cada tema: [fundo claro, traço]. Saem da paleta da marca, com variações quentes. */
export const COR: Record<Tema, [string, string]> = {
  humor: ['#f6e7c8', '#a0702a'],        // mel
  sono: ['#e2e4ee', '#4f5a7a'],         // anil acinzentado
  alimentacao: ['#e3ead6', '#4e5d32'],  // oliva
  alcool: ['#f1dfe0', '#8a4a52'],       // vinho
  cigarro: ['#e9e4dd', '#6b5a4d'],      // fumaça
  atividade: ['#f5e1d6', '#9a5a42'],    // terracota
  peso: ['#ece4d6', '#6a5338'],
  cintura: ['#f3e2d8', '#8f5a3c'],
  coracao: ['#f4dedb', '#9b4a43'],
  gordura: ['#f2e8d2', '#8a6a2c'],
  protocolo: ['#e6e9dc', '#4e5839'],
  checkin: ['#f5e1d6', '#9a5a42'],
  encontro: ['#e2e7ea', '#3f5961'],
  evolucao: ['#e3ead6', '#4e5d32'],
  questionario: ['#f6e7c8', '#8f6424'],
  video: ['#efe2e9', '#7a4a66'],
  forca: ['#f5e1d6', '#9a5a42'],
  figado: ['#f3e2d8', '#8f5a3c'],
  rins: ['#e2e7ea', '#3f5961'],
  metabolismo: ['#f2e8d2', '#8a6a2c'],
  fogacho: ['#f6e0d2', '#a3522e'],
}

const D: Record<Tema, (c: string, f: string) => ReactNode> = {
  humor: (c, f) => (<>
    <circle cx="16" cy="16" r="7" fill={f} stroke={c} strokeWidth="1.6" />
    {[0, 45, 90, 135, 180, 225, 270, 315].map(a => <line key={a} x1="16" y1="4.5" x2="16" y2="6.8" stroke={c} strokeWidth="1.6" strokeLinecap="round" transform={`rotate(${a} 16 16)`} />)}
    <path d="M13 17.2c1.6 1.6 4.4 1.6 6 0" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" />
    <circle cx="13.6" cy="14.3" r=".9" fill={c} /><circle cx="18.4" cy="14.3" r=".9" fill={c} />
  </>),
  sono: (c, f) => (<>
    <path d="M20.5 6.5a10 10 0 1 0 5 15.2A8 8 0 0 1 20.5 6.5Z" fill={f} stroke={c} strokeWidth="1.6" strokeLinejoin="round" />
    <path d="M22 9h3.5L22 13h3.5" fill="none" stroke={c} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
  </>),
  alimentacao: (c, f) => (<>
    <path d="M16 10.5c-2.4-1.6-7-1.4-7.6 3.6-.6 5 2.6 10.6 5.4 10.6 1 0 1.4-.6 2.2-.6s1.2.6 2.2.6c2.8 0 6-5.6 5.4-10.6-.6-5-5.2-5.2-7.6-3.6Z" fill={f} stroke={c} strokeWidth="1.6" strokeLinejoin="round" />
    <path d="M16 10.5c0-2 .6-3.6 2-4.6" fill="none" stroke={c} strokeWidth="1.6" strokeLinecap="round" />
    <path d="M17.5 7.2c1.8-1.6 4.4-1.4 5.4-.6-1 1.8-3.4 2.6-5.4.6Z" fill={c} opacity=".85" />
  </>),
  alcool: (c, f) => (<>
    <path d="M10 6h12c0 6-2.6 9.4-6 9.4S10 12 10 6Z" fill={f} stroke={c} strokeWidth="1.6" strokeLinejoin="round" />
    <path d="M10.6 9.4h10.8" stroke={c} strokeWidth="1.2" opacity=".6" />
    <path d="M16 15.4v8.6M11.5 25.5h9" stroke={c} strokeWidth="1.6" strokeLinecap="round" />
  </>),
  cigarro: (c, f) => (<>
    <rect x="5" y="16" width="19" height="4" rx="1" fill={f} stroke={c} strokeWidth="1.5" />
    <path d="M19 16v4" stroke={c} strokeWidth="1.3" />
    <path d="M24 13c1.5-1.2 1.5-3 0-4.2M26.5 13c1.5-1.2 1.5-3 0-4.2" fill="none" stroke={c} strokeWidth="1.3" strokeLinecap="round" opacity=".7" />
    <path d="M6 26 26 6" stroke={c} strokeWidth="1.8" strokeLinecap="round" />
  </>),
  atividade: (c, f) => (<>
    <path d="M6 20.5c2.6 0 4.2-1.2 5.4-3.4l1.4-2.6 4 1.6c1.8.7 3 2.2 3.6 4l.6 1.8h5c1 0 1.8.8 1.8 1.8v.8H6Z" fill={f} stroke={c} strokeWidth="1.6" strokeLinejoin="round" />
    <path d="M14 16.2l1.6-1.6M16.6 17.2l1.6-1.6" stroke={c} strokeWidth="1.3" strokeLinecap="round" />
    <path d="M6 24.5h22" stroke={c} strokeWidth="1.6" strokeLinecap="round" />
  </>),
  peso: (c, f) => (<>
    <rect x="6" y="7" width="20" height="18" rx="4" fill={f} stroke={c} strokeWidth="1.6" />
    <path d="M11 13a5 5 0 0 1 10 0Z" fill="#fffdfa" stroke={c} strokeWidth="1.4" strokeLinejoin="round" />
    <path d="M16 13l2-2.6" stroke={c} strokeWidth="1.4" strokeLinecap="round" />
  </>),
  cintura: (c, f) => (<>
    <path d="M6 13c0-2.2 4.5-4 10-4s10 1.8 10 4v6c0 2.2-4.5 4-10 4s-10-1.8-10-4Z" fill={f} stroke={c} strokeWidth="1.6" />
    <path d="M6 13c0 2.2 4.5 4 10 4s10-1.8 10-4" fill="none" stroke={c} strokeWidth="1.4" />
    {[10, 13, 16, 19, 22].map(x => <line key={x} x1={x} y1="16.6" x2={x} y2={x % 2 ? 19 : 18.2} stroke={c} strokeWidth="1.1" />)}
  </>),
  coracao: (c, f) => (<>
    <path d="M16 25s-9-5.4-9-11.6C7 10.4 9.2 8 12 8c1.8 0 3.2 1 4 2.4C16.8 9 18.2 8 20 8c2.8 0 5 2.4 5 5.4C25 19.6 16 25 16 25Z" fill={f} stroke={c} strokeWidth="1.6" strokeLinejoin="round" />
    <path d="M9 16h4l1.6-3 2.4 6 1.6-3H23" fill="none" stroke={c} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
  </>),
  gordura: (c, f) => (<>
    <path d="M16 5.5c3 4.6 7 8.6 7 13a7 7 0 0 1-14 0c0-4.4 4-8.4 7-13Z" fill={f} stroke={c} strokeWidth="1.6" strokeLinejoin="round" />
    <path d="M12.6 19.4a3.6 3.6 0 0 0 3 3" fill="none" stroke={c} strokeWidth="1.4" strokeLinecap="round" />
  </>),
  protocolo: (c, f) => (<>
    <rect x="8" y="6.5" width="16" height="20" rx="2.5" fill={f} stroke={c} strokeWidth="1.6" />
    <rect x="12.5" y="5" width="7" height="3.4" rx="1.2" fill="#fffdfa" stroke={c} strokeWidth="1.4" />
    <path d="M11.5 14l1.5 1.5 2.6-2.8M11.5 20l1.5 1.5 2.6-2.8M18 14.4h3M18 20.4h3" fill="none" stroke={c} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
  </>),
  checkin: (c, f) => (<>
    <path d="M7 9a3 3 0 0 1 3-3h12a3 3 0 0 1 3 3v9a3 3 0 0 1-3 3h-7l-5 4v-4h0a3 3 0 0 1-3-3Z" fill={f} stroke={c} strokeWidth="1.6" strokeLinejoin="round" />
    <path d="M12.2 13.6c1.8 1.8 5.8 1.8 7.6 0" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" />
  </>),
  encontro: (c, f) => (<>
    <rect x="6" y="8" width="20" height="18" rx="3" fill={f} stroke={c} strokeWidth="1.6" />
    <path d="M6 13h20M11 5.5v4M21 5.5v4" stroke={c} strokeWidth="1.6" strokeLinecap="round" />
    <path d="M16 22.5s-3.8-2.2-3.8-4.8c0-1.2.9-2.1 2-2.1.8 0 1.4.4 1.8 1 .4-.6 1-1 1.8-1 1.1 0 2 .9 2 2.1 0 2.6-3.8 4.8-3.8 4.8Z" fill={c} />
  </>),
  evolucao: (c, f) => (<>
    <path d="M7 6v19h19" fill="none" stroke={c} strokeWidth="1.6" strokeLinecap="round" />
    <path d="M10 20c3-5 5-2 7.5-6.5S22 9 25 9" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" />
    <path d="M11 24c3-6 5-3 7.5-7.5S22 12 25 12v12Z" fill={f} />
    <circle cx="25" cy="9" r="2" fill={c} />
  </>),
  questionario: (c, f) => (<>
    <circle cx="16" cy="16" r="10" fill={f} stroke={c} strokeWidth="1.6" />
    <path d="M13 13.2a3 3 0 1 1 4.4 2.6c-.9.5-1.4 1.1-1.4 2.1v.6" fill="none" stroke={c} strokeWidth="1.6" strokeLinecap="round" />
    <circle cx="16" cy="21.6" r="1.1" fill={c} />
  </>),
  video: (c, f) => (<>
    <rect x="5.5" y="8" width="21" height="16" rx="3.5" fill={f} stroke={c} strokeWidth="1.6" />
    <path d="M14 12.4v7.2l6-3.6Z" fill={c} />
  </>),
  forca: (c, f) => (<>
    <rect x="4.5" y="12" width="4" height="8" rx="1.2" fill={f} stroke={c} strokeWidth="1.5" />
    <rect x="23.5" y="12" width="4" height="8" rx="1.2" fill={f} stroke={c} strokeWidth="1.5" />
    <rect x="8.5" y="10" width="3.5" height="12" rx="1.2" fill={f} stroke={c} strokeWidth="1.5" />
    <rect x="20" y="10" width="3.5" height="12" rx="1.2" fill={f} stroke={c} strokeWidth="1.5" />
    <path d="M12 16h8" stroke={c} strokeWidth="2" strokeLinecap="round" />
  </>),
  figado: (c, f) => (<>
    <path d="M6 13.5c0-3 3-5.5 8-5.5 4.6 0 12 .4 12 4.4 0 4.8-6.6 10.6-12.4 11.4C9 24.4 6 18 6 13.5Z" fill={f} stroke={c} strokeWidth="1.6" strokeLinejoin="round" />
    <path d="M15 9c-.6 4 0 9 2.4 14" fill="none" stroke={c} strokeWidth="1.3" strokeLinecap="round" opacity=".7" />
  </>),
  rins: (c, f) => (<>
    <path d="M11 6.5c-3.4 0-5 3.6-5 8.4s2 9.6 5.6 9.6c3 0 3-3.4 1.6-5.6-1-1.6-1-3 0-4.4 1.6-2.4 1.4-8-2.2-8Z" fill={f} stroke={c} strokeWidth="1.5" strokeLinejoin="round" />
    <path d="M21 6.5c3.4 0 5 3.6 5 8.4s-2 9.6-5.6 9.6c-3 0-3-3.4-1.6-5.6 1-1.6 1-3 0-4.4-1.6-2.4-1.4-8 2.2-8Z" fill={f} stroke={c} strokeWidth="1.5" strokeLinejoin="round" />
  </>),
  fogacho: (c, f) => (<>
    <path d="M16 4.5c1 4 6.5 6.6 6.5 13a6.5 6.5 0 0 1-13 0c0-3.2 1.6-5 3-6.4.2 2 1 3.2 2.2 3.6C14 11 14.6 7.6 16 4.5Z" fill={f} stroke={c} strokeWidth="1.6" strokeLinejoin="round" />
    <path d="M16 25a3 3 0 0 1-3-3c0-1.8 1.6-2.8 3-4.6 1.4 1.8 3 2.8 3 4.6a3 3 0 0 1-3 3Z" fill={c} opacity=".8" />
  </>),
  metabolismo: (c, f) => (<>
    <circle cx="16" cy="16" r="9.5" fill={f} stroke={c} strokeWidth="1.6" />
    <path d="M17.5 8.5 12 17h4.5l-1.5 6.5L20.5 15H16Z" fill={c} strokeLinejoin="round" />
  </>),
}

/** Ilustração de um tema. `tamanho` em px; `fundo` coloca o desenho num círculo claro da mesma cor. */
export function Icone({ tema, tamanho = 32, fundo = false, className = '' }: { tema: Tema; tamanho?: number; fundo?: boolean; className?: string }) {
  const [f, c] = COR[tema]
  const svg = <svg viewBox="0 0 32 32" width={fundo ? tamanho * 0.62 : tamanho} height={fundo ? tamanho * 0.62 : tamanho} aria-hidden="true">{D[tema](c, fundo ? '#fffdfa' : f)}</svg>
  if (!fundo) return <span className={`inline-grid place-items-center shrink-0 ${className}`}>{svg}</span>
  return <span className={`inline-grid place-items-center shrink-0 rounded-full ${className}`} style={{ width: tamanho, height: tamanho, background: f }}>{svg}</span>
}

/** Tema de um domínio de estilo de vida pelo nome. */
export const temaDoDominio = (nome: string): Tema =>
  ({ Humor: 'humor', Sono: 'sono', 'Alimentação': 'alimentacao', 'Álcool': 'alcool', Cigarro: 'cigarro', 'Atividade física': 'atividade' } as Record<string, Tema>)[nome] ?? 'questionario'

export const temaDoSistema = (grp: string): Tema =>
  ({ metabolismo: 'metabolismo', cardiovascular: 'coracao', figado: 'figado', rins: 'rins', fisico: 'forca', hormonios: 'humor', outros: 'questionario' } as Record<string, Tema>)[grp] ?? 'questionario'

/** Rostinho para escalas de 0 a 10 (0 triste, 10 contente), desenhado, sem emoji. */
export function Rosto({ valor, inverso = false, tamanho = 28 }: { valor: number; inverso?: boolean; tamanho?: number }) {
  const v = inverso ? 10 - valor : valor
  const cor = v <= 3 ? ['#f4dedb', '#9b4a43'] : v <= 6 ? ['#f6e7c8', '#a0702a'] : ['#e3ead6', '#4e5d32']
  const curva = v <= 3 ? 'M11.5 21c2.6-2.6 6.4-2.6 9 0' : v <= 6 ? 'M12 19.5h8' : 'M11.5 18.5c2.6 2.8 6.4 2.8 9 0'
  return (
    <svg viewBox="0 0 32 32" width={tamanho} height={tamanho} aria-hidden="true">
      <circle cx="16" cy="16" r="12" fill={cor[0]} stroke={cor[1]} strokeWidth="1.6" />
      <circle cx="12.5" cy="13.5" r="1.3" fill={cor[1]} /><circle cx="19.5" cy="13.5" r="1.3" fill={cor[1]} />
      <path d={curva} fill="none" stroke={cor[1]} strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  )
}
