import { useEffect, useState, type ReactNode } from 'react'
import { ArrowLeft, ArrowRight, Check } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../auth/AuthProvider'
import { Botao } from '../../components/ui'
import { TOM } from '../../components/regua'
import { NIVEL, dataBR, num, type Nivel } from '../../lib/faixas'
import { DOMINIOS, FATORES_VAZIO, PASSOS, pior, respondido, type Fatores } from '../../lib/clinica'

export type RespostaQ = { id: string; score: number | null; band_label: string | null; band_level: Nivel | null; submitted_at: string; flagged: boolean; questionnaires: { slug: string; name: string; domain: string } | null }

export function useEstiloDeVida(pid: string) {
  const [resp, setResp] = useState<RespostaQ[] | null>(null)
  useEffect(() => {
    supabase.from('questionnaire_responses').select('id, score, band_label, band_level, submitted_at, flagged, questionnaires(slug, name, domain)')
      .eq('patient_id', pid).order('submitted_at', { ascending: false })
      .then(({ data }) => setResp((data as unknown as RespostaQ[]) ?? []))
  }, [pid])
  const ultima = (slug: string) => resp?.find(r => r.questionnaires?.slug === slug)
  const dominios = DOMINIOS.map(d => {
    const itens = d.slugs.map(ultima).filter(Boolean) as RespostaQ[]
    return { ...d, itens, nivel: pior(itens.map(i => i.band_level)) }
  })
  return { resp, dominios }
}

export function AbaEstilo({ pid, questionarios }: { pid: string; questionarios: ReactNode }) {
  const { dominios, resp } = useEstiloDeVida(pid)
  const esquerda = dominios.filter(d => ['Humor', 'Sono', 'Atividade física'].includes(d.nome))
  const direita = dominios.filter(d => !['Humor', 'Sono', 'Atividade física'].includes(d.nome))

  return (
    <div className="flex flex-col gap-4">
      <div className="grid xl:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)] gap-4 items-start">
        <FatoresDeRisco pid={pid} />
        <section className="cartao" aria-labelledby="t-estilo">
          <div className="px-5 pt-4 pb-2">
            <h2 id="t-estilo" className="titulo-bloco">Estilo de vida</h2>
            <p className="text-meta text-apoio mt-0.5">Última resposta de cada questionário. A cor do domínio é a do resultado mais frágil.</p>
          </div>
          {resp && resp.length === 0 ? (
            <p className="p-5 text-corpo text-apoio">Nenhum questionário respondido ainda. Envie abaixo e as respostas aparecem aqui.</p>
          ) : (
            <div className="grid sm:grid-cols-2 gap-3 px-5 pb-5 pt-2">
              {[...esquerda, ...direita].map(d => (
                <div key={d.nome} className="painel-tom px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${d.nivel ? TOM[d.nivel] : 'bg-areia'}`} aria-hidden="true" />
                    <h3 className="text-corpo font-medium flex-1">{d.nome}</h3>
                    <span className={`text-meta ${d.nivel ? NIVEL[d.nivel].cor : 'text-apoio'}`}>{d.nivel ? NIVEL[d.nivel].rotulo : d.itens.length ? 'Registro' : 'Falta responder'}</span>
                  </div>
                  <ul className="mt-1.5">
                    {d.itens.map(r => (
                      <li key={r.id} className="flex items-baseline gap-2 py-1 text-corpo" title={`Respondido em ${dataBR(r.submitted_at)}`}>
                        <span className="flex-1 min-w-0 text-apoio truncate">{r.questionnaires?.name}{r.flagged && <span className="text-terracota"> · alerta</span>}</span>
                        <span className={`text-right ${r.band_level ? NIVEL[r.band_level].cor : 'text-apoio'}`}>
                          {r.score != null && <span className="tabular-nums text-texto mr-1">{num(r.score, 1)}</span>}{r.band_label ?? 'Registro'}
                        </span>
                      </li>
                    ))}
                    {!d.itens.length && <li className="py-1 text-meta text-apoio">Nenhum questionário deste tema respondido.</li>}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
      {questionarios}
    </div>
  )
}

export function useFatores(pid: string) {
  const [f, setF] = useState<Fatores | null>(null)
  useEffect(() => {
    supabase.from('risk_factors').select('*').eq('patient_id', pid).maybeSingle()
      .then(({ data }) => setF(data ? { ...FATORES_VAZIO, ...(data as Partial<Fatores>) } : { ...FATORES_VAZIO }))
  }, [pid])
  return [f, setF] as const
}

/** O assistente de 8 passos do Life Up, com as mesmas perguntas. */
function FatoresDeRisco({ pid }: { pid: string }) {
  const { session } = useAuth()
  const [f, setF] = useFatores(pid)
  const [passo, setPasso] = useState(0)
  const [salvo, setSalvo] = useState<string | null>(null)
  if (!f) return <section className="cartao p-5 text-corpo text-apoio">Carregando</section>

  const p = PASSOS[passo]
  const feitos = PASSOS.filter(x => x.tipo !== 'varias' ? respondido(f, x.campo) : true).length

  async function gravar(novo: Fatores) {
    setF(novo)
    const { error } = await supabase.from('risk_factors').upsert({ patient_id: pid, ...novo, updated_by: session?.user.id, updated_at: new Date().toISOString() })
    setSalvo(error ? 'Não foi possível salvar' : 'Salvo')
    setTimeout(() => setSalvo(null), 1400)
  }

  const opcao = (ativo: boolean, rotulo: string, aoClicar: () => void, papel: 'radio' | 'checkbox') => (
    <button key={rotulo} role={papel} aria-checked={ativo} onClick={aoClicar}
      className={`w-full text-left px-3.5 min-h-[44px] rounded flex items-center gap-3 border transition-colors ${ativo ? 'border-cafe/70 bg-ativo/60' : 'border-borda bg-folha hover:border-controle'}`}>
      <span className={`w-4 h-4 shrink-0 grid place-items-center border ${papel === 'radio' ? 'rounded-full' : 'rounded-sm'} ${ativo ? 'bg-cafe border-cafe text-creme' : 'border-apoio/50'}`}>
        {ativo && <Check className="w-3 h-3" />}
      </span>
      <span className="text-corpo">{rotulo}</span>
    </button>
  )

  return (
    <section className="cartao flex flex-col" aria-labelledby="t-fatores">
      <div className="px-5 pt-4 flex items-end justify-between gap-4">
        <div>
          <h2 id="t-fatores" className="titulo-bloco">Fatores de risco</h2>
          <p className="text-meta text-apoio mt-0.5">{feitos} de {PASSOS.length} respondidos{salvo ? ` · ${salvo}` : ''}</p>
        </div>
        <div className="flex gap-[3px]" aria-hidden="true">
          {PASSOS.map((x, i) => (
            <button key={i} tabIndex={-1} onClick={() => setPasso(i)}
              className={`w-4 h-1.5 rounded-full ${i === passo ? 'bg-cafe' : respondido(f, x.campo) && (x.tipo !== 'varias' || (f[x.campo] as string[]).length) ? 'bg-oliva/60' : 'bg-areia'}`} />
          ))}
        </div>
      </div>

      <div className="p-5 flex flex-col gap-3 min-h-[360px]">
        <p className="rotulo">Pergunta {passo + 1} de {PASSOS.length}</p>
        <p className="text-[17px] leading-snug font-medium">{p.pergunta}</p>
        <div className="flex flex-col gap-2 mt-1" role={p.tipo === 'varias' ? 'group' : 'radiogroup'}>
          {p.tipo === 'uma' && p.opcoes.map(o => opcao(f[p.campo] === o, o, () => gravar({ ...f, [p.campo]: o }), 'radio'))}
          {p.tipo === 'simnao' && (['Sim', 'Não'] as const).map(o => opcao(f[p.campo] === (o === 'Sim'), o, () => gravar({ ...f, [p.campo]: o === 'Sim' }), 'radio'))}
          {p.tipo === 'varias' && (<>
            {p.opcoes.map(o => {
              const lista = f[p.campo] as string[]
              return opcao(lista.includes(o), o, () => gravar({ ...f, [p.campo]: lista.includes(o) ? lista.filter(x => x !== o) : [...lista, o] }), 'checkbox')
            })}
            {opcao((f[p.campo] as string[]).length === 0, 'Nenhuma destas', () => gravar({ ...f, [p.campo]: [] }), 'checkbox')}
            {p.nota && <p className="text-meta text-apoio mt-1">{p.nota}</p>}
          </>)}
        </div>
      </div>

      <div className="px-5 pb-5 flex justify-between mt-auto">
        <Botao variante="texto" onClick={() => setPasso(Math.max(0, passo - 1))} disabled={passo === 0}><ArrowLeft className="w-4 h-4" />Anterior</Botao>
        {passo < PASSOS.length - 1
          ? <Botao variante="linha" onClick={() => setPasso(passo + 1)}>Próxima<ArrowRight className="w-4 h-4" /></Botao>
          : <span className="text-corpo text-apoio self-center">Respostas salvas a cada toque</span>}
      </div>
    </section>
  )
}
