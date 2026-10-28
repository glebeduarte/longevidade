import { useEffect, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, Check, Phone, Plus, X } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { Aviso, Botao } from '../../components/ui'
import { COR, Icone, Rosto, type Tema } from '../../components/icones'
import { useVista } from '../../lib/vista'
import { dataLonga } from '../../lib/programa'
import {
  ALERTAS_GERAIS, ALERTAS_GLP1, ALERTAS_THM, EFEITOS_THM, FOME, GERAL, HIDRATACAO, MEDICACAO, MOTIVO_THM, MUDANCAS, PROTEINA,
  QUAIS_THM, SANGRAMENTO, SINTOMAS_GLP1, faltando, textoReacao, vazio, type BlocoGlp1, type BlocoThm, type CheckinV2,
} from '../../lib/checkin'
import { Cabecalho, usePrograma } from './app'

const CHAVE = 'longevidade:rascunho-checkin-v2'
const campo = 'w-full rounded-lg border border-controle bg-folha px-3.5 text-[16px] focus:outline-none focus:border-cafe min-h-[48px]'

function Bloco({ titulo, tema, children, sub }: { titulo: string; tema: Tema; children: ReactNode; sub?: string }) {
  return (
    <section className="cartao p-4 flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <Icone tema={tema} fundo tamanho={44} />
        <div><h2 className="titulo-bloco">{titulo}</h2>{sub && <p className="text-meta text-apoio">{sub}</p>}</div>
      </div>
      {children}
    </section>
  )
}
function Pergunta({ texto, children }: { texto: string; children: ReactNode }) {
  return <fieldset className="flex flex-col gap-2"><legend className="text-[16px] font-medium mb-2 leading-snug">{texto}</legend>{children}</fieldset>
}
function Escolha<K extends string>({ opcoes, valor, onChange, colunas = 1 }: { opcoes: Array<[K, string]>; valor?: K; onChange: (k: K) => void; colunas?: 1 | 2 | 3 }) {
  return (
    <div className={`grid gap-2 ${colunas === 2 ? 'grid-cols-2' : colunas === 3 ? 'grid-cols-3' : ''}`} role="radiogroup">
      {opcoes.map(([k, r]) => (
        <button key={k} type="button" role="radio" aria-checked={valor === k} onClick={() => onChange(k)}
          className={`text-left min-h-[48px] px-4 rounded-lg border text-[15px] leading-snug ${valor === k ? 'bg-cafe text-creme border-cafe' : 'bg-folha border-borda'}`}>{r}</button>
      ))}
    </div>
  )
}
function Varias({ opcoes, valor, onChange }: { opcoes: string[]; valor: string[]; onChange: (v: string[]) => void }) {
  return (
    <div className="flex flex-col gap-2">
      {opcoes.map(o => {
        const on = valor.includes(o)
        return (
          <button key={o} type="button" role="checkbox" aria-checked={on} onClick={() => onChange(on ? valor.filter(x => x !== o) : [...valor, o])}
            className={`text-left min-h-[48px] px-4 rounded-lg border text-[15px] flex items-center gap-3 ${on ? 'border-cafe bg-ativo/60' : 'bg-folha border-borda'}`}>
            <span className={`w-5 h-5 shrink-0 rounded grid place-items-center border ${on ? 'bg-cafe border-cafe text-creme' : 'border-apoio/50'}`}>{on && <Check className="w-3.5 h-3.5" />}</span>{o}
          </button>
        )
      })}
    </div>
  )
}
function Nota({ rotulo, tema, valor, onChange, min, max }: { rotulo: string; tema: Tema; valor?: number; onChange: (n: number) => void; min: string; max: string }) {
  const [claro, forte] = COR[tema]
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-3">
        <p className="text-[16px] font-medium flex-1">{rotulo}</p>
        {valor != null && <span className="flex items-center gap-2"><span className="text-corpo tabular-nums">{valor} de 10</span><Rosto valor={valor} tamanho={30} /></span>}
      </div>
      <div className="grid grid-cols-6 sm:grid-cols-11 gap-1.5" role="radiogroup" aria-label={rotulo}>
        {Array.from({ length: 11 }, (_, n) => (
          <button key={n} type="button" role="radio" aria-checked={valor === n} aria-label={`${n} de 10`} onClick={() => onChange(n)}
            style={valor === n ? { background: forte, color: '#fffdfa' } : { background: claro }}
            className="h-12 rounded-lg text-[17px] font-medium tabular-nums active:scale-95 text-texto">{n}</button>
        ))}
      </div>
      <div className="flex justify-between text-meta text-apoio"><span>0 · {min}</span><span>{max} · 10</span></div>
    </div>
  )
}
function Dias({ valor, onChange, extra }: { valor?: number | 'sem_meta'; onChange: (v: number | 'sem_meta') => void; extra?: [string, string] }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-8 gap-1.5">
        {Array.from({ length: 8 }, (_, n) => (
          <button key={n} type="button" role="radio" aria-checked={valor === n} aria-label={`${n} dias`} onClick={() => onChange(n)}
            className={`h-12 rounded-lg border text-[17px] tabular-nums ${valor === n ? 'bg-cafe text-creme border-cafe' : 'bg-folha border-borda'}`}>{n}</button>
        ))}
      </div>
      {extra && <button type="button" role="radio" aria-checked={valor === extra[0]} onClick={() => onChange(extra[0] as 'sem_meta')}
        className={`min-h-[44px] px-4 rounded-lg border text-[15px] self-start ${valor === extra[0] ? 'bg-cafe text-creme border-cafe' : 'bg-folha border-borda'}`}>{extra[1]}</button>}
    </div>
  )
}
const NumCampo = ({ rotulo, valor, onChange, sufixo }: { rotulo: string; valor?: number | null; onChange: (v: number | null) => void; sufixo?: string }) => (
  <label className="flex flex-col gap-1.5 text-corpo">{rotulo}
    <span className="relative"><input inputMode="decimal" value={valor ?? ''} onChange={e => onChange(e.target.value ? Number(e.target.value.replace(',', '.')) : null)} className={`${campo} ${sufixo ? 'pr-14' : ''}`} />
      {sufixo && <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-apoio">{sufixo}</span>}</span>
  </label>
)
const Texto = ({ rotulo, valor, onChange, linhas = 2, dica }: { rotulo: string; valor?: string; onChange: (v: string) => void; linhas?: number; dica?: string }) => (
  <label className="flex flex-col gap-1.5 text-corpo">{rotulo}
    <textarea rows={linhas} value={valor ?? ''} placeholder={dica} onChange={e => onChange(e.target.value)} className={`${campo} !h-auto py-2.5`} />
  </label>
)

/** Check-in semanal da paciente, referente aos últimos sete dias. */
export function CheckinPaciente() {
  const { aberto, proximoCheckin, checkins, carregar } = usePrograma()
  const vista = useVista()
  const [a, setA] = useState<CheckinV2>(vazio)
  const [trat, setTrat] = useState<{ glp1: boolean; thm: boolean }>({ glp1: false, thm: false })
  const [fase, setFase] = useState<'form' | 'enviando' | 'ok' | 'erro'>('form')
  const [erro, setErro] = useState('')

  useEffect(() => {
    try { const r = localStorage.getItem(CHAVE); if (r) setA({ ...vazio(), ...JSON.parse(r) }) } catch { /* sem rascunho */ }
    supabase.rpc('meus_tratamentos', { pid: vista?.pid ?? null }).then(({ data }) => data && setTrat(data as { glp1: boolean; thm: boolean }))
  }, [])
  useEffect(() => { try { localStorage.setItem(CHAVE, JSON.stringify(a)) } catch { /* sem armazenamento */ } }, [a])

  const set = <K extends keyof CheckinV2>(k: K, v: CheckinV2[K]) => setA(x => ({ ...x, [k]: v }))
  const g = a.glp1 ?? { sintomas: [] }, t = a.thm ?? { quais: [], efeitos: [] }
  const setG = (p: Partial<BlocoGlp1>) => set('glp1', { ...g, ...p })
  const setT = (p: Partial<BlocoThm>) => set('thm', { ...t, ...p })
  const listaAlertas = [...ALERTAS_GERAIS, ...(trat.glp1 ? ALERTAS_GLP1 : []), ...(trat.thm ? ALERTAS_THM : [])]
  const falta = faltando(a, trat.glp1, trat.thm)
  const historico = checkins.filter(c => c.status === 'respondido' || c.status === 'atendido').reverse().slice(0, 6)

  async function enviar() {
    setFase('enviando')
    const final: CheckinV2 = { ...a, glp1: trat.glp1 ? g : undefined, thm: trat.thm ? t : undefined }
    const reacao_texto = textoReacao(final)
    final.reacao = !!reacao_texto; final.reacao_texto = reacao_texto
    const { error } = await supabase.rpc('salvar_checkin', { cid: aberto?.id ?? null, p_answers: final, pid: vista?.pid ?? null })
    if (error) { setErro(error.message); return setFase('erro') }
    try { localStorage.removeItem(CHAVE) } catch { /* sem armazenamento */ }
    setFase('ok'); carregar()
  }

  if (fase === 'ok') {
    return (
      <div className="px-4 pt-8 flex flex-col gap-4 items-start">
        <Check className="w-7 h-7 text-oliva" />
        <h1 className="titulo-pagina !text-[28px] leading-tight">Check-in salvo</h1>
        {a.alertas.length > 0 ? <Emergencia /> : (
          <p className="text-[16px] text-apoio leading-relaxed">Obrigada. A equipe lê os check-ins e responde no contato de sexta-feira. A resposta aparece na tela inicial e no seu e-mail.</p>
        )}
        <Link to="/app"><Botao>Voltar ao início</Botao></Link>
      </div>
    )
  }

  return (
    <div className="px-4 pt-6 flex flex-col gap-5">
      <Cabecalho titulo="Check-in da semana" sub={aberto ? `Referente a ${dataLonga(aberto.due_date)}.` : proximoCheckin ? `O próximo agendado abre em ${dataLonga(proximoCheckin.due_date)}. Você pode responder agora se quiser.` : undefined} />
      <div className="rounded-xl bg-tom px-4 py-3.5 text-[15px] leading-relaxed">
        Responda considerando os <b>últimos sete dias</b>. Suas respostas ajudam a acompanhar sua evolução e a tolerância ao tratamento.
        Nosso ponto de contato é às <b>sextas-feiras</b>. Este formulário não é acompanhado em tempo real: se houver sintomas intensos ou sinais de alerta, procure atendimento sem esperar pelo check-in.
      </div>

      <Bloco titulo="Sua semana" tema="checkin">
        <Pergunta texto="1. Como você se sentiu nesta semana, de modo geral?"><Escolha opcoes={GERAL} valor={a.geral} onChange={v => set('geral', v)} /></Pergunta>
        <Nota rotulo="2. Energia e disposição" tema="metabolismo" valor={a.energia} onChange={v => set('energia', v)} min="sem energia" max="muita disposição" />
        <Nota rotulo="3. Qualidade do sono" tema="sono" valor={a.sono} onChange={v => set('sono', v)} min="péssimo" max="ótimo" />
        <Nota rotulo="4. Humor e bem-estar emocional" tema="humor" valor={a.humor} onChange={v => set('humor', v)} min="muito para baixo" max="muito bem" />
      </Bloco>

      <Bloco titulo="Hábitos" tema="alimentacao">
        <Pergunta texto="5. Em quantos dias conseguiu cumprir as metas de alimentação combinadas?">
          <Dias valor={a.dias_alimentacao} onChange={v => set('dias_alimentacao', v)} extra={['sem_meta', 'Não havia meta definida']} />
        </Pergunta>
        <Pergunta texto="6. Em quantos dias fez atividade física?">
          <Dias valor={a.dias_atividade} onChange={v => set('dias_atividade', v as number)} />
        </Pergunta>
        {typeof a.dias_atividade === 'number' && a.dias_atividade > 0 && (
          <Pergunta texto="Quantos desses dias tiveram exercícios de força?">
            <Dias valor={a.dias_forca} onChange={v => set('dias_forca', Math.min(v as number, a.dias_atividade as number))} />
          </Pergunta>
        )}
        <Pergunta texto="7. Conseguiu manter a hidratação combinada?"><Escolha opcoes={HIDRATACAO} valor={a.hidratacao} onChange={v => set('hidratacao', v)} /></Pergunta>
        {a.hidratacao && a.hidratacao !== 'maioria' && <Texto rotulo="Qual foi a dificuldade?" valor={a.hidratacao_dificuldade} onChange={v => set('hidratacao_dificuldade', v)} />}
        <NumCampo rotulo="Seu peso nesta semana" valor={a.peso} onChange={v => set('peso', v)} sufixo="kg" />
      </Bloco>

      <Bloco titulo="Medicamentos e sintomas" tema="medicacao">
        <Pergunta texto="8. Usou os medicamentos conforme a prescrição?"><Escolha opcoes={MEDICACAO} valor={a.medicacao} onChange={v => set('medicacao', v)} /></Pergunta>
        {a.medicacao && a.medicacao !== 'sim' && <Texto rotulo="Conte o que aconteceu" valor={a.medicacao_detalhe} onChange={v => set('medicacao_detalhe', v)} />}
        <Pergunta texto="9. Teve algum sintoma novo ou piora de um sintoma anterior?">
          <Escolha colunas={2} opcoes={[['nao', 'Não'], ['sim', 'Sim']]} valor={a.sintoma_novo == null ? undefined : a.sintoma_novo ? 'sim' : 'nao'}
            onChange={v => setA(x => ({ ...x, sintoma_novo: v === 'sim', sintomas: v === 'sim' && !x.sintomas.length ? [{ qual: '', inicio: '', relato: '' }] : x.sintomas }))} />
        </Pergunta>
        {a.sintoma_novo && a.sintomas.map((s, i) => (
          <div key={i} className="rounded-lg bg-tom p-3.5 flex flex-col gap-3">
            <div className="flex items-center justify-between"><p className="rotulo">Sintoma {i + 1}</p>
              {a.sintomas.length > 1 && <button type="button" onClick={() => set('sintomas', a.sintomas.filter((_, j) => j !== i))} aria-label="Remover sintoma" className="w-9 h-9 grid place-items-center rounded hover:bg-ativo"><X className="w-4 h-4" /></button>}
            </div>
            <label className="flex flex-col gap-1.5 text-corpo">Qual foi o sintoma?<input value={s.qual} onChange={e => set('sintomas', a.sintomas.map((x, j) => j === i ? { ...x, qual: e.target.value } : x))} className={campo} /></label>
            <label className="flex flex-col gap-1.5 text-corpo">Quando começou?<input value={s.inicio} placeholder="Ex.: terça, há 3 dias" onChange={e => set('sintomas', a.sintomas.map((x, j) => j === i ? { ...x, inicio: e.target.value } : x))} className={campo} /></label>
            <Texto rotulo="Como estava se sentindo, o que fez e como está agora?" valor={s.relato} linhas={3} onChange={v => set('sintomas', a.sintomas.map((x, j) => j === i ? { ...x, relato: v } : x))} />
          </div>
        ))}
        {a.sintoma_novo && <button type="button" onClick={() => set('sintomas', [...a.sintomas, { qual: '', inicio: '', relato: '' }])} className="self-start inline-flex items-center gap-1.5 text-[15px] text-cafe"><Plus className="w-4 h-4" />Outro sintoma</button>}
        <Pergunta texto="10. Houve alguma mudança importante?">
          <Varias opcoes={MUDANCAS} valor={a.mudancas} onChange={v => set('mudancas', v)} />
          {!a.mudancas.length && <p className="text-meta text-apoio">Se nada mudou, deixe em branco.</p>}
        </Pergunta>
      </Bloco>

      {trat.glp1 && (
        <Bloco titulo="Seu tratamento com GLP-1" tema="medicacao" sub="Tirzepatida, semaglutida e similares">
          <Pergunta texto="Como esteve sua fome?"><Escolha opcoes={FOME} valor={g.fome} onChange={v => setG({ fome: v })} /></Pergunta>
          <Pergunta texto="Conseguiu fazer as refeições e comer as proteínas combinadas?"><Escolha colunas={3} opcoes={PROTEINA} valor={g.proteina} onChange={v => setG({ proteina: v })} /></Pergunta>
          <Pergunta texto="Teve algum destes sintomas?"><Varias opcoes={SINTOMAS_GLP1} valor={g.sintomas} onChange={v => setG({ sintomas: v })} /></Pergunta>
          {(g.sintomas.includes('Diarreia') || g.sintomas.includes('Vômitos')) && (
            <div className="rounded-lg bg-tom p-3.5 grid grid-cols-2 gap-3">
              <NumCampo rotulo="Episódios no pior dia" valor={g.dv_episodios} onChange={v => setG({ dv_episodios: v })} />
              <NumCampo rotulo="Há quantos dias?" valor={g.dv_dias} onChange={v => setG({ dv_dias: v })} />
              <Pergunta texto="Consegue beber líquidos?"><Escolha colunas={2} opcoes={[['s', 'Sim'], ['n', 'Não']]} valor={g.dv_liquidos == null ? undefined : g.dv_liquidos ? 's' : 'n'} onChange={v => setG({ dv_liquidos: v === 's' })} /></Pergunta>
              <Pergunta texto="Está urinando normalmente?"><Escolha colunas={2} opcoes={[['s', 'Sim'], ['n', 'Não']]} valor={g.dv_urina == null ? undefined : g.dv_urina ? 's' : 'n'} onChange={v => setG({ dv_urina: v === 's' })} /></Pergunta>
            </div>
          )}
          {g.sintomas.includes('Prisão de ventre') && <NumCampo rotulo="Há quantos dias não evacua?" valor={g.constipacao_dias} onChange={v => setG({ constipacao_dias: v })} sufixo="dias" />}
        </Bloco>
      )}

      {trat.thm && (
        <Bloco titulo="Sua terapia hormonal" tema="fogacho">
          <Pergunta texto="Como ficaram os sintomas que motivaram o tratamento?"><Escolha colunas={3} opcoes={MOTIVO_THM} valor={t.motivo} onChange={v => setT({ motivo: v })} /></Pergunta>
          <Pergunta texto="Quais sintomas?"><Varias opcoes={QUAIS_THM} valor={t.quais} onChange={v => setT({ quais: v })} /></Pergunta>
          <input value={t.quais_outro ?? ''} onChange={e => setT({ quais_outro: e.target.value })} placeholder="Outro sintoma" className={campo} aria-label="Outro sintoma" />
          <Pergunta texto="Teve sangramento vaginal?"><Escolha opcoes={SANGRAMENTO} valor={t.sangramento} onChange={v => setT({ sangramento: v })} /></Pergunta>
          {t.sangramento && t.sangramento !== 'nao' && (
            <div className="rounded-lg bg-tom p-3.5 flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-3">
                <label className="flex flex-col gap-1.5 text-corpo">Quando começou?<input value={t.sang_inicio ?? ''} onChange={e => setT({ sang_inicio: e.target.value })} className={campo} /></label>
                <NumCampo rotulo="Quantos dias durou?" valor={t.sang_dias} onChange={v => setT({ sang_dias: v })} />
              </div>
              <Pergunta texto="Quantidade"><Escolha colunas={3} opcoes={[['pouco', 'Pouco'], ['moderado', 'Moderado'], ['intenso', 'Intenso']]} valor={t.sang_qtd} onChange={v => setT({ sang_qtd: v })} /></Pergunta>
              <Varias opcoes={['Teve coágulos', 'Teve dor', 'Sangrou depois da relação']}
                valor={[t.sang_coagulos && 'Teve coágulos', t.sang_dor && 'Teve dor', t.sang_pos_relacao && 'Sangrou depois da relação'].filter(Boolean) as string[]}
                onChange={v => setT({ sang_coagulos: v.includes('Teve coágulos'), sang_dor: v.includes('Teve dor'), sang_pos_relacao: v.includes('Sangrou depois da relação') })} />
            </div>
          )}
          <Pergunta texto="Teve algum destes efeitos?"><Varias opcoes={EFEITOS_THM} valor={t.efeitos} onChange={v => setT({ efeitos: v })} /></Pergunta>
        </Bloco>
      )}

      <Bloco titulo="Para o próximo contato" tema="nota">
        <Texto rotulo="11. Qual foi sua principal conquista nesta semana?" valor={a.conquista} onChange={v => set('conquista', v)} />
        <Texto rotulo="E sua maior dificuldade?" valor={a.dificuldade} onChange={v => set('dificuldade', v)} />
        <Texto rotulo="12. Qual dúvida gostaria de priorizar no próximo contato?" valor={a.duvida} onChange={v => set('duvida', v)} />
      </Bloco>

      <section className="rounded-xl border-2 border-terracota/50 bg-[#fbeee9] p-4 flex flex-col gap-3">
        <div className="flex items-center gap-2.5"><AlertTriangle className="w-5 h-5 text-terracota" /><h2 className="titulo-bloco">Sinais que não esperam a sexta-feira</h2></div>
        <p className="text-[15px] leading-relaxed">Marque se você tem agora algum destes sinais. Se tiver, procure atendimento imediatamente.</p>
        <Varias opcoes={listaAlertas} valor={a.alertas} onChange={v => set('alertas', v)} />
        {a.alertas.length > 0 && <Emergencia />}
      </section>

      {fase === 'erro' && <Aviso tipo="erro">Não foi possível salvar{erro ? ` (${erro})` : ''}. Suas respostas continuam guardadas neste aparelho, tente de novo.</Aviso>}
      {vista && <Aviso>Modo visualização: ao salvar, o check-in fica registrado na ficha desta paciente.</Aviso>}
      {falta.length > 0 && <p className="text-corpo text-apoio">Falta responder: {falta.join(', ')}.</p>}
      <Botao className="w-full !h-12" disabled={falta.length > 0 || fase === 'enviando'} onClick={enviar}>{fase === 'enviando' ? 'Salvando' : 'Salvar check-in'}</Botao>

      {historico.length > 0 && (
        <section className="flex flex-col gap-3" aria-labelledby="t-hist">
          <h2 id="t-hist" className="titulo-bloco">Check-ins anteriores</h2>
          <ul className="cartao divide-y divide-regra overflow-hidden">
            {historico.map(c => (
              <li key={c.id} className="px-4 py-3">
                <div className="flex items-baseline justify-between"><p className="text-corpo font-medium">{dataLonga(c.due_date)}</p><p className="text-meta text-apoio">{c.reply ? 'Respondido' : 'Aguardando resposta'}</p></div>
                {(c.answers as CheckinV2 | null)?.duvida && <p className="text-meta text-apoio mt-0.5">Sua dúvida: {(c.answers as CheckinV2).duvida}</p>}
                {c.answers?.mensagem && <p className="text-meta text-apoio mt-0.5">Você: {c.answers.mensagem}</p>}
                {c.reply && <p className="text-corpo mt-2 pl-3 border-l-2 border-cobre">{c.reply}</p>}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}

function Emergencia() {
  return (
    <div className="rounded-lg bg-folha border border-terracota/40 p-4 flex flex-col gap-2.5">
      <p className="text-[16px] font-medium text-terracota">Procure atendimento agora. Não espere pelo retorno da equipe.</p>
      <p className="flex items-center gap-3 text-[16px]"><Phone className="w-5 h-5 text-terracota" /><span><b>SAMU 192</b> ou o pronto-socorro mais próximo</span></p>
      <p className="text-corpo text-apoio">Ao salvar, a Dra. Bartira recebe um alerta urgente.</p>
    </div>
  )
}
