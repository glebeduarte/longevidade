import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Printer } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../auth/AuthProvider'
import { Aviso, Borboleta, Botao, Selo } from '../../components/ui'
import { LinhaIndicador } from '../../components/regua'
import { Icone, temaDoDominio, temaDoSistema } from '../../components/icones'
import { NIVEL, dataBR, num, type Nivel } from '../../lib/faixas'
import { FATORES_VAZIO, fmt, type Fatores, type Indicador, type Medida } from '../../lib/clinica'
import { montarRelatorio, pendencias, type EntradaMapa, type Relatorio } from '../../lib/mapa'

type Mapa = { id: string; status: 'em_andamento' | 'finalizado' | 'suspenso'; started_at: string; finished_at: string | null; summary: string | null; recommendations: Record<string, string>; snapshot: Relatorio | null }
type Bloco = { domain: string; level: Nivel; text: string }

function useEntrada(pid: string) {
  const [e, setE] = useState<EntradaMapa | null>(null)
  const carregar = useCallback(async () => {
    const [p, cat, med, fat, resp, prob] = await Promise.all([
      supabase.from('patients').select('full_name, birth_date').eq('id', pid).maybeSingle(),
      supabase.from('indicator_catalog').select('*'),
      supabase.from('measurements').select('id, code, value, measured_at, note').eq('patient_id', pid),
      supabase.from('risk_factors').select('*').eq('patient_id', pid).maybeSingle(),
      supabase.from('questionnaire_responses').select('score, band_label, band_level, submitted_at, questionnaires(slug, name)').eq('patient_id', pid).order('submitted_at', { ascending: false }),
      supabase.from('problems').select('title, detail, active').eq('patient_id', pid),
    ])
    setE({
      nome: p.data?.full_name ?? '', nascimento: p.data?.birth_date ?? null,
      cat: (cat.data as Indicador[]) ?? [], med: (med.data as Medida[]) ?? [],
      fatores: fat.data ? { ...FATORES_VAZIO, ...(fat.data as Partial<Fatores>) } : null,
      respostas: (resp.data as unknown as EntradaMapa['respostas']) ?? [], problemas: prob.data ?? [],
    })
  }, [pid])
  useEffect(() => { carregar() }, [carregar])
  return e
}

export function AbaMapa({ pid }: { pid: string }) {
  const { session, profile } = useAuth()
  const entrada = useEntrada(pid)
  const [mapas, setMapas] = useState<Mapa[] | null>(null)
  const [blocos, setBlocos] = useState<Bloco[]>([])
  const [ver, setVer] = useState<string | null>(null)
  const [rec, setRec] = useState<Record<string, string>>({})
  const [resumo, setResumo] = useState('')
  const [msg, setMsg] = useState<string | null>(null)

  const carregar = () => supabase.from('health_maps').select('*').eq('patient_id', pid).order('started_at', { ascending: false })
    .then(({ data }) => {
      const l = (data as Mapa[]) ?? []
      setMapas(l)
      const aberto = l.find(m => m.status === 'em_andamento')
      if (aberto) { setRec(aberto.recommendations ?? {}); setResumo(aberto.summary ?? '') }
    })
  useEffect(() => {
    carregar()
    supabase.from('recommendation_blocks').select('domain, level, text').order('sort').then(({ data }) => setBlocos((data as Bloco[]) ?? []))
  }, [pid])

  const aberto = mapas?.find(m => m.status === 'em_andamento') ?? null
  const relatorio = useMemo(() => (entrada ? montarRelatorio(entrada) : null), [entrada])
  const pend = useMemo(() => (entrada && aberto ? pendencias(entrada, aberto.started_at) : []), [entrada, aberto])

  // Texto sugerido por domínio, a partir da faixa, até a médica editar
  const sugerido = (dom: string, nivel: Nivel | null) => {
    if (!nivel) return ''
    const alvo = nivel === 'bom' ? 'otimo' : nivel === 'normal' ? 'atencao' : nivel
    return blocos.find(b => b.domain === dom && b.level === alvo)?.text ?? ''
  }
  const recFinal = (dom: string, nivel: Nivel | null) => rec[dom] ?? sugerido(dom, nivel)

  async function iniciar() {
    await supabase.from('health_maps').insert({ patient_id: pid, created_by: session?.user.id }); carregar()
  }
  async function guardar() {
    if (!aberto) return
    await supabase.from('health_maps').update({ recommendations: rec, summary: resumo || null }).eq('id', aberto.id)
    setMsg('Rascunho salvo.'); setTimeout(() => setMsg(null), 1500)
  }
  async function suspender() {
    if (!aberto) return
    await supabase.from('health_maps').update({ status: 'suspenso', finished_at: new Date().toISOString() }).eq('id', aberto.id); carregar()
  }
  async function finalizar() {
    if (!aberto || !relatorio) return
    const recs = Object.fromEntries(relatorio.estilo.map(d => [d.nome, recFinal(d.nome, d.level)]))
    await supabase.from('health_maps').update({
      status: 'finalizado', finished_at: new Date().toISOString(), approved_by: profile?.id,
      recommendations: recs, summary: resumo || null, snapshot: relatorio,
    }).eq('id', aberto.id)
    carregar()
  }

  if (!mapas || !relatorio) return <p className="rotulo">Carregando</p>
  const anteriores = mapas.filter(m => m.status !== 'em_andamento')
  const escolhido = ver ? mapas.find(m => m.id === ver) : null

  if (escolhido?.snapshot) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex flex-wrap items-center gap-3">
          <button onClick={() => setVer(null)} className="inline-flex items-center gap-2 text-corpo text-apoio hover:text-texto"><ArrowLeft className="w-4 h-4" />Mapa atual</button>
          <Selo tom="ok">Finalizado em {dataBR(escolhido.finished_at!)}</Selo>
          <Link to={`/painel/pacientes/${pid}/mapa/${escolhido.id}`} target="_blank" className="ml-auto"><Botao variante="linha"><Printer className="w-4 h-4" />Imprimir</Botao></Link>
        </div>
        <RelatorioMapa r={escolhido.snapshot} recomendacoes={escolhido.recommendations} resumo={escolhido.summary} />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="cartao p-5 flex flex-wrap items-center gap-x-6 gap-y-4">
        <div className="mr-auto">
          <h2 className="titulo-bloco">{aberto ? 'Mapa da saúde em andamento' : 'Mapa da saúde'}</h2>
          <p className="text-meta text-apoio mt-0.5">
            {aberto ? `Aberto em ${dataBR(aberto.started_at)}. A paciente só vê depois de você finalizar.`
              : anteriores.length ? `Último finalizado em ${dataBR(anteriores.find(m => m.status === 'finalizado')?.finished_at ?? anteriores[0].started_at)}.`
              : 'Aplicado no início e no fim do programa.'}
          </p>
        </div>
        {aberto ? (<>
          <Botao variante="texto" onClick={suspender}>Suspender</Botao>
          <Botao variante="linha" onClick={guardar}>Salvar rascunho</Botao>
          <Botao onClick={finalizar}>Revisar e finalizar</Botao>
        </>) : <Botao onClick={iniciar}>Iniciar novo mapa</Botao>}
        {msg && <span className="basis-full text-corpo text-oliva" role="status">{msg}</span>}
      </section>

      {aberto && pend.length > 0 && (
        <section className="flex flex-col gap-2" aria-label="Pendências">
          <p className="rotulo">Pendências antes de finalizar</p>
          <ul className="grid sm:grid-cols-2 xl:grid-cols-4 gap-3">
            {pend.map(p => (
              <li key={p.chave} className="rounded-lg bg-[#f5e7dc] px-4 py-3">
                <p className="text-corpo font-medium text-atencao">{p.rotulo}</p>
                <p className="text-meta text-apoio mt-1 leading-relaxed">{p.detalhe}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      {aberto ? (
        <RelatorioMapa r={relatorio} resumo={resumo} recomendacoes={Object.fromEntries(relatorio.estilo.map(d => [d.nome, recFinal(d.nome, d.level)]))}
          editar={{ rec: (d, t) => setRec({ ...rec, [d]: t }), resumo: setResumo }} />
      ) : (
        <Aviso>Inicie um mapa para reunir exames, medidas, questionários e fatores de risco num relatório para a paciente.</Aviso>
      )}

      {anteriores.length > 0 && (
        <section className="cartao" aria-labelledby="t-hist-mapas">
          <h2 id="t-hist-mapas" className="titulo-bloco px-5 pt-4 pb-3">Mapas anteriores</h2>
          <ul>
            {anteriores.map(m => (
              <li key={m.id} className="px-5 py-3 border-t border-regra flex items-center gap-4 text-corpo">
                <span className="tabular-nums w-28">{dataBR(m.started_at)}</span>
                <span className="text-apoio flex-1">{m.status === 'finalizado' ? `Finalizado em ${dataBR(m.finished_at!)}` : 'Suspenso'}</span>
                {m.snapshot?.nota != null && <span className="tabular-nums">Nota {m.snapshot.nota}</span>}
                {m.snapshot && <button onClick={() => setVer(m.id)} className="text-cafe hover:underline">Ver</button>}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}

type Edicao = { rec: (dominio: string, texto: string) => void; resumo: (t: string) => void }

/** O relatório: o mesmo componente na tela e na impressão. */
export function RelatorioMapa({ r, recomendacoes, resumo, editar }: { r: Relatorio; recomendacoes: Record<string, string>; resumo: string | null; editar?: Edicao }) {
  return (
    <div className="flex flex-col gap-8 relatorio">
      <section className="cartao p-5 md:p-6 grid lg:grid-cols-[minmax(0,1fr)_420px] gap-8 items-center pagina">
        <div>
          <p className="rotulo">Perfil de saúde</p>
          <h2 className="titulo-pagina !text-[28px] mt-1">{r.paciente.nome.replace(/\s*\(teste\)/, '')}</h2>
          <span className="assinatura" />
          <div className="mt-6 flex items-end gap-6">
            <div>
              <p className="text-[40px] leading-none tabular-nums">{r.nota ?? <span className="text-apoio/60">·</span>}<span className="text-bloco text-apoio ml-1">de 100</span></p>
              <p className="text-meta text-apoio mt-2">Nota de saúde de 0 a 100 · cálculo provisório</p>
            </div>
          </div>
          <div className="mt-8">
            <p className="rotulo mb-2">Problemas encontrados</p>
            {r.problemas.length ? (
              <ul className="flex flex-col gap-1.5">
                {r.problemas.map(p => <li key={p.title} className="text-[15px]">{p.title}{p.detail ? <span className="text-apoio text-corpo"> · {p.detail}</span> : null}</li>)}
              </ul>
            ) : <p className="text-corpo text-apoio">Nenhum problema ativo.</p>}
          </div>
          <div className="mt-8">
            <p className="rotulo mb-2">Palavra da médica</p>
            {editar ? (
              <textarea value={resumo ?? ''} onChange={e => editar.resumo(e.target.value)} rows={4} placeholder="Resumo e prioridades para os próximos meses, na sua voz."
                className="w-full campo !h-auto py-2.5 leading-relaxed" />
            ) : <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{resumo || '·'}</p>}
          </div>
        </div>
        <Radar eixos={r.eixos} />
      </section>

      <section className="pagina">
        <h2 className="titulo-bloco !text-[18px] mb-3">Indicadores de saúde</h2>
        <div className="lg:columns-2 gap-4 [&>*]:break-inside-avoid [&>*]:mb-4">
          {r.sistemas.map(s => (
            <div key={s.grp} className="cartao px-5 pt-4 pb-2">
              <h3 className="titulo-bloco flex items-center gap-2.5"><Icone tema={temaDoSistema(s.grp)} fundo tamanho={34} />{s.nome}</h3>
              <div className="divide-y divide-regra">
                {s.itens.map(i => <LinhaIndicador key={i.code} nome={i.name} valor={i.value} unidade={i.unit} bands={i.bands} data={i.date ? dataBR(i.date) : undefined} nota={i.calc ? `Calculado · ${i.calc}` : undefined} />)}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="pagina">
        <h2 className="titulo-bloco !text-[18px] mb-3">Estilo de vida</h2>
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4 items-stretch">
          {r.estilo.map(d => (
            <div key={d.nome} className="cartao p-5 flex flex-col gap-3">
              <div className="flex items-center gap-2.5">
                <Icone tema={temaDoDominio(d.nome)} fundo tamanho={40} />
                <h3 className="titulo-bloco flex-1">{d.nome}</h3>
                <span className={`text-meta ${d.level ? NIVEL[d.level].cor : 'text-apoio'}`}>{d.level ? NIVEL[d.level].rotulo : d.itens.length ? 'Registro' : 'Sem resposta'}</span>
              </div>
              <ul className="text-corpo flex flex-col gap-1">
                {d.itens.map(i => (
                  <li key={i.name} className="flex gap-2"><span className="flex-1 text-apoio truncate">{i.name}</span>
                    <span className={i.level ? NIVEL[i.level].cor : ''}>{i.score != null ? `${num(i.score, 1)} · ` : ''}{i.label ?? 'Registro'}</span></li>
                ))}
              </ul>
              {editar ? (
                <textarea value={recomendacoes[d.nome] ?? ''} onChange={e => editar.rec(d.nome, e.target.value)} rows={3} aria-label={`Recomendação para ${d.nome}`}
                  placeholder="Recomendação para a paciente" className="mt-auto w-full campo !h-auto py-2.5 leading-relaxed" />
              ) : recomendacoes[d.nome] ? <p className="mt-auto text-corpo leading-relaxed">{recomendacoes[d.nome]}</p> : null}
            </div>
          ))}
        </div>
      </section>

      <section className="pagina grid lg:grid-cols-2 gap-4 items-start">
        <div className="cartao px-5 pt-4 pb-2">
          <h2 className="titulo-bloco">Força e capacidade</h2>
          <div className="divide-y divide-regra">
            {r.forca.map(i => <LinhaIndicador key={i.code} nome={i.name} valor={i.value} unidade={i.unit} bands={i.bands} data={i.date ? dataBR(i.date) : undefined} />)}
          </div>
        </div>
        <div className="cartao p-5 flex flex-col gap-3">
          <h2 className="titulo-bloco">Risco cardiovascular em 10 anos</h2>
          {r.risco_cv.valor != null ? (<>
            <p className="text-[40px] leading-none tabular-nums">{fmt(r.risco_cv.valor * 100)}<span className="text-bloco text-apoio ml-0.5">%</span></p>
            <p className={`text-corpo ${NIVEL[r.risco_cv.level!].cor}`}>{NIVEL[r.risco_cv.level!].rotulo}</p>
            <p className="text-meta text-apoio">Escore de Framingham para risco geral de doença cardiovascular (D'Agostino, 2008).</p>
          </>) : <p className="text-corpo text-apoio">{r.risco_cv.motivo}</p>}
          <p className="text-meta text-apoio pt-3 border-t border-borda">Risco de diabetes e estimativa de VO2 aguardam a definição do método pela médica.</p>
        </div>
      </section>
    </div>
  )
}

function Radar({ eixos }: { eixos: Relatorio['eixos'] }) {
  const R = 112, cx = 210, cy = 160, n = eixos.length
  const ponto = (i: number, raio: number) => {
    const a = -Math.PI / 2 + (i / n) * Math.PI * 2
    return [cx + Math.cos(a) * raio, cy + Math.sin(a) * raio]
  }
  const poligono = eixos.map((e, i) => ponto(i, ((e.nota ?? 0) / 100) * R).join(',')).join(' ')
  return (
    <figure className="w-full max-w-[420px] mx-auto">
      <svg viewBox="0 0 420 320" className="w-full" role="img" aria-label="Radar dos dez eixos de saúde">
        {[0.25, 0.5, 0.75, 1].map(k => (
          <polygon key={k} points={eixos.map((_, i) => ponto(i, R * k).join(',')).join(' ')} fill="none" stroke="#d8cbb9" strokeWidth={k === 1 ? 1 : 0.6} />
        ))}
        {eixos.map((_, i) => { const [x, y] = ponto(i, R); return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="#d8cbb9" strokeWidth="0.6" /> })}
        <polygon points={poligono} fill="#4e5839" fillOpacity="0.18" stroke="#4e5839" strokeWidth="1.5" />
        {eixos.map((e, i) => {
          const [x, y] = ponto(i, R + 20)
          const anchor = Math.abs(x - cx) < 8 ? 'middle' : x > cx ? 'start' : 'end'
          return (
            <text key={e.nome} x={x} y={y} textAnchor={anchor} dominantBaseline="middle" fontSize="10.5" fill={e.nota == null ? '#a99a8d' : '#3a2b22'} fontFamily="Jost, sans-serif">
              {e.nome}{e.nota != null ? ` ${e.nota}` : ''}
            </text>
          )
        })}
      </svg>
      <figcaption className="text-meta text-apoio text-center">Eixos sem dado ficam no centro e em cinza.</figcaption>
    </figure>
  )
}

/** Página de impressão de um mapa finalizado. */
export function ImprimirMapa() {
  const { id, mapaId } = useParams()
  const [m, setM] = useState<Mapa | null>(null)
  useEffect(() => {
    supabase.from('health_maps').select('*').eq('id', mapaId!).maybeSingle().then(({ data }) => setM(data as Mapa))
  }, [mapaId])
  if (!m?.snapshot) return <p className="p-10 rotulo">Carregando</p>
  return (
    <main className="max-w-5xl mx-auto px-5 py-10 imprimir">
      <div className="flex items-center justify-between mb-8 print:mb-6">
        <div className="flex items-center gap-3 text-texto">
          <Borboleta className="w-9 h-7 text-cobre" />
          <div className="leading-none">
            <span className="font-display text-[26px]">Mapa da Saúde</span>
            <span className="block mt-1 text-[9px] uppercase tracking-[0.28em] text-apoio">Dra. Bartira Rebouças · Ciência e acolhimento</span>
          </div>
        </div>
        <div className="flex items-center gap-3 print:hidden">
          <Link to={`/painel/pacientes/${id}`} className="text-corpo text-apoio hover:text-texto">Voltar</Link>
          <Botao onClick={() => window.print()}><Printer className="w-4 h-4" />Imprimir ou salvar PDF</Botao>
        </div>
        <p className="hidden print:block text-meta text-apoio">{dataBR(m.finished_at!)}</p>
      </div>
      <RelatorioMapa r={m.snapshot} recomendacoes={m.recommendations} resumo={m.summary} />
    </main>
  )
}
