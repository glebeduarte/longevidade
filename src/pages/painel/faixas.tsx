import { useEffect, useState } from 'react'
import { Check, Plus, X } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { Aviso, Botao, Titulo } from '../../components/ui'
import { Regua, TOM } from '../../components/regua'
import { NIVEL } from '../../lib/faixas'
import { GRUPOS, ORDEM, type Faixa, type Indicador } from '../../lib/clinica'

const campo = 'campo'

/** Onde a médica define as faixas de cor de cada exame e medida. */
export function Faixas() {
  const [cat, setCat] = useState<Indicador[]>([])
  const [edit, setEdit] = useState<string | null>(null)
  const [rasc, setRasc] = useState<Faixa[]>([])
  const [grupo, setGrupo] = useState('todos')

  const carregar = () => supabase.from('indicator_catalog').select('*').order('sort').then(({ data }) => setCat((data as Indicador[]) ?? []))
  useEffect(() => { carregar() }, [])

  const abrir = (c: Indicador) => { setEdit(c.code); setRasc(c.bands.length ? c.bands : [{ max: null, level: 'normal' }]) }
  async function salvar(code: string) {
    await supabase.from('indicator_catalog').update({ bands: rasc, reviewed: true, updated_at: new Date().toISOString() }).eq('code', code)
    setEdit(null); carregar()
  }
  async function aprovar(code: string) {
    await supabase.from('indicator_catalog').update({ reviewed: true }).eq('code', code); carregar()
  }

  const pendentes = cat.filter(c => c.bands.length && !c.reviewed).length
  const lista = cat.filter(c => grupo === 'todos' || c.grp === grupo)

  return (
    <div className="flex flex-col gap-8">
      <Titulo sub="As cores de cada exame e medida no prontuário e no Mapa da Saúde. Leia de cima para baixo: o valor cai na primeira faixa em que for menor que o limite.">Faixas dos indicadores</Titulo>
      {pendentes > 0 && <Aviso>{pendentes} indicadores estão com a faixa padrão e aguardam sua revisão. Ao salvar ou confirmar, a marca some.</Aviso>}

      <div className="flex flex-wrap gap-2">
        {['todos', ...Object.keys(GRUPOS)].map(g => (
          <button key={g} onClick={() => setGrupo(g)} className={`px-4 h-9 text-corpo border ${grupo === g ? 'bg-cafe text-creme border-cafe' : 'border-areia text-apoio hover:text-texto'}`}>
            {g === 'todos' ? 'Todos' : GRUPOS[g]}
          </button>
        ))}
      </div>

      <section className="cartao divide-y divide-regra">
        {lista.map(c => (
          <div key={c.code} className="px-5 py-4">
            <div className="grid grid-cols-[minmax(0,1fr)_auto] md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_auto] gap-x-6 gap-y-2 items-center">
              <div className="min-w-0">
                <p className="text-[15px]">{c.name} <span className="text-meta text-apoio">{c.unit}</span></p>
                <p className="text-meta text-apoio">{GRUPOS[c.grp]}{c.bands.length ? (c.reviewed ? ' · revisada' : ' · padrão, a revisar') : ' · sem faixa, só registra o valor'}</p>
              </div>
              <div className="order-3 md:order-none col-span-2 md:col-span-1">
                {c.bands.length ? <Regua valor={null} bands={c.bands} compacta /> : null}
                {c.bands.length > 0 && (
                  <p className="text-[11px] text-apoio mt-1.5 tabular-nums">
                    {c.bands.map((b, i) => `${NIVEL[b.level].rotulo} ${i === 0 ? '<' : ''}${b.max != null ? (i === 0 ? b.max : `até ${b.max}`) : 'acima'}`).join('  ·  ')}
                  </p>
                )}
              </div>
              <div className="flex gap-3 justify-end">
                {c.bands.length > 0 && !c.reviewed && <button onClick={() => aprovar(c.code)} className="text-corpo text-oliva hover:underline inline-flex items-center gap-1"><Check className="w-4 h-4" />Confirmar</button>}
                <button onClick={() => (edit === c.code ? setEdit(null) : abrir(c))} className="text-corpo text-cafe hover:underline">{edit === c.code ? 'Fechar' : 'Editar'}</button>
              </div>
            </div>

            {edit === c.code && (
              <div className="mt-4 bg-areia/25 p-4 flex flex-col gap-2">
                {rasc.map((b, i) => (
                  <div key={i} className="flex flex-wrap items-center gap-3 text-corpo">
                    <span className={`w-3 h-3 ${TOM[b.level]}`} aria-hidden="true" />
                    <label className="sr-only" htmlFor={`f-${i}`}>Nível</label>
                    <select id={`f-${i}`} value={b.level} onChange={e => setRasc(rasc.map((x, k) => k === i ? { ...x, level: e.target.value as Faixa['level'] } : x))} className={campo}>
                      {ORDEM.map(o => <option key={o} value={o}>{NIVEL[o].rotulo}</option>)}
                    </select>
                    <span className="text-apoio">{i === rasc.length - 1 ? 'acima do anterior' : 'menor que'}</span>
                    {i < rasc.length - 1 && (
                      <input inputMode="decimal" aria-label="Limite" value={b.max ?? ''} className={`${campo} w-24`}
                        onChange={e => setRasc(rasc.map((x, k) => k === i ? { ...x, max: e.target.value === '' ? null : Number(e.target.value.replace(',', '.')) } : x))} />
                    )}
                    {rasc.length > 1 && <button onClick={() => setRasc(rasc.filter((_, k) => k !== i))} aria-label="Remover faixa" className="text-apoio hover:text-terracota"><X className="w-4 h-4" /></button>}
                  </div>
                ))}
                <div className="flex gap-3 mt-2">
                  <Botao variante="texto" onClick={() => setRasc([...rasc.slice(0, -1), { max: rasc[rasc.length - 2]?.max ?? 0, level: 'normal' } as Faixa, rasc[rasc.length - 1]])}>
                    <Plus className="w-4 h-4" />Faixa
                  </Botao>
                  <Botao onClick={() => salvar(c.code)} className="ml-auto min-h-[42px] px-5">Salvar faixas</Botao>
                </div>
              </div>
            )}
          </div>
        ))}
      </section>
    </div>
  )
}
