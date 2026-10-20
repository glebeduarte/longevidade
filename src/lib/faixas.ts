export type Nivel = 'ruim' | 'atencao' | 'normal' | 'bom' | 'otimo'

export const NIVEL: Record<Nivel, { rotulo: string; cor: string; fundo: string }> = {
  ruim: { rotulo: 'Ruim', cor: 'text-terracota', fundo: 'bg-terracota' },
  atencao: { rotulo: 'Atenção', cor: 'text-cobre', fundo: 'bg-cobre' },
  normal: { rotulo: 'Normal', cor: 'text-apoio', fundo: 'bg-apoio' },
  bom: { rotulo: 'Bom', cor: 'text-oliva', fundo: 'bg-oliva/70' },
  otimo: { rotulo: 'Ótimo', cor: 'text-oliva', fundo: 'bg-oliva' },
}

// Data só com dia (AAAA-MM-DD) é lida no fuso local, para não voltar um dia no Brasil.
export const dataBR = (d: string) => (/^\d{4}-\d{2}-\d{2}$/.test(d) ? new Date(`${d}T12:00:00`) : new Date(d)).toLocaleDateString('pt-BR')
export const num = (v: number | null | undefined, casas = 1) =>
  v == null ? '·' : v.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: casas })
