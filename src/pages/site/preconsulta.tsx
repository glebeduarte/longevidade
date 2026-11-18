import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Check, Lock, Paperclip, X } from 'lucide-react'
import { supabase } from '../../lib/supabase'

/** Perguntas do questionário pré-consulta. `outro` abre um campo de texto quando a opção é marcada. */
type Pergunta =
  | { id: string; tipo: 'multipla'; texto: string; opcoes: string[]; outro?: string; nenhum?: string }
  | { id: string; tipo: 'unica'; texto: string; opcoes: string[]; detalhe?: { quando: string; rotulo: string } }
  | { id: string; tipo: 'texto'; texto: string; dica?: string }

export const SECOES: Array<{ titulo: string; mulher?: boolean; perguntas: Pergunta[] }> = [
  {
    titulo: 'Objetivo da consulta',
    perguntas: [
      { id: 'motivo', tipo: 'multipla', texto: 'Qual é o principal motivo da consulta?', outro: 'Outro',
        opcoes: ['Controle de peso', 'Diabetes/glicose', 'Menopausa/climatério', 'Tireoide', 'Cansaço', 'Saúde hormonal', 'Saúde óssea', 'Prevenção/longevidade', 'Outro'] },
      { id: 'queixa', tipo: 'texto', texto: 'Qual sua principal queixa e o que espera melhorar?' },
    ],
  },
  {
    titulo: 'Histórico de saúde',
    perguntas: [
      { id: 'doencas', tipo: 'multipla', texto: 'Você tem alguma doença diagnosticada?', nenhum: 'Não', outro: 'Outra',
        opcoes: ['Não', 'Diabetes/pré-diabetes', 'Hipertensão', 'Colesterol alto', 'Obesidade', 'Tireoide', 'Osteoporose', 'Doença cardíaca', 'Doença renal', 'Câncer', 'Outra'] },
      { id: 'cirurgias', tipo: 'unica', texto: 'Já realizou alguma cirurgia ou teve internação importante?', opcoes: ['Não', 'Sim'], detalhe: { quando: 'Sim', rotulo: 'Qual e quando?' } },
      { id: 'medicamentos', tipo: 'unica', texto: 'Faz uso de algum medicamento, vitamina ou suplemento atualmente?', opcoes: ['Não', 'Sim'], detalhe: { quando: 'Sim', rotulo: 'Quais? Informe nome e dose, se souber' } },
      { id: 'lipedema', tipo: 'unica', texto: 'Você acredita que tem lipedema?', opcoes: ['Sim', 'Não', 'Tenho dúvidas'] },
      { id: 'emagrecimento', tipo: 'unica', texto: 'Já utilizou medicamentos para emagrecimento?', opcoes: ['Não', 'Sim'], detalhe: { quando: 'Sim', rotulo: 'Qual(is)?' } },
      { id: 'sono', tipo: 'unica', texto: 'Como avalia seu sono?', opcoes: ['Bom', 'Regular', 'Ruim'] },
    ],
  },
  {
    titulo: 'Saúde da mulher',
    mulher: true,
    perguntas: [
      { id: 'climaterio', tipo: 'multipla', texto: 'Tem sintomas relacionados ao climatério?', nenhum: 'Nenhum',
        opcoes: ['Ondas de calor', 'Suores noturnos', 'Alterações do sono', 'Humor', 'Memória/concentração', 'Ressecamento vaginal', 'Parou de menstruar', 'Nenhum'] },
    ],
  },
  {
    titulo: 'Exames disponíveis',
    perguntas: [
      { id: 'exames_sangue', tipo: 'unica', texto: 'Quando realizou seus últimos exames de sangue?', opcoes: ['Menos de 3 meses', '3 a 12 meses', 'Mais de 1 ano', 'Não lembro'] },
      { id: 'exames_imagem', tipo: 'unica', texto: 'Fez algum exame de imagem relevante (mamografia, densitometria, ultrassonografia etc.)?', opcoes: ['Não', 'Sim'], detalhe: { quando: 'Sim', rotulo: 'Qual e quando?' } },
    ],
  },
]

type Resp = Record<string, { valor?: string | string[]; detalhe?: string }>
const MAX_ARQ = 15 * 1024 * 1024
const TIPOS = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']

function Bloco({ n, titulo, children }: { n: number; titulo: string; children: ReactNode }) {
  return (
    <fieldset className="rounded-[4px] bg-folha p-5 sm:p-8 flex flex-col gap-7">
      <legend className="sr-only">{titulo}</legend>
      <h2 className="font-display text-[28px] sm:text-[32px] leading-tight"><span className="text-cobre">{n}.</span> {titulo}</h2>
      {children}
    </fieldset>
  )
}

const opcaoCls = (on: boolean) => `inline-flex items-center gap-2 min-h-[44px] px-4 rounded-full border text-[16px] cursor-pointer transition-colors select-none
  ${on ? 'bg-cafe text-creme border-cafe' : 'bg-creme border-controle hover:border-cafe'}`

export function PreConsulta() {
  const [id] = useState(() => crypto.randomUUID())
  const [f, setF] = useState({ nome: '', nascimento: '', telefone: '', email: '', sexo: '', ok: false })
  const [r, setR] = useState<Resp>({})
  const [arquivos, setArquivos] = useState<File[]>([])
  const [fase, setFase] = useState<'form' | 'enviando' | 'pronto'>('form')
  const [erro, setErro] = useState('')

  useEffect(() => {
    document.title = 'Questionário pré-consulta · Dra. Bartira Rebouças'
    document.querySelector('meta[name="description"]')?.setAttribute('content', 'Preencha antes da sua primeira consulta com a Dra. Bartira Rebouças.')
  }, [])

  const mulher = f.sexo === 'Feminino'
  const setResp = (pid: string, v: Resp[string]) => setR(x => ({ ...x, [pid]: { ...x[pid], ...v } }))

  function alternar(p: Extract<Pergunta, { tipo: 'multipla' }>, op: string) {
    const atual = (r[p.id]?.valor as string[] | undefined) ?? []
    let novo = atual.includes(op) ? atual.filter(x => x !== op) : [...atual, op]
    if (p.nenhum && op === p.nenhum && novo.includes(op)) novo = [op]
    else if (p.nenhum && op !== p.nenhum) novo = novo.filter(x => x !== p.nenhum)
    setResp(p.id, { valor: novo })
  }

  function anexar(lista: FileList | null) {
    setErro('')
    const novos = Array.from(lista ?? [])
    const ruim = novos.find(a => !TIPOS.includes(a.type) || a.size > MAX_ARQ)
    if (ruim) return setErro(`O arquivo "${ruim.name}" não pode ser enviado. Use PDF ou imagem de até 15 MB.`)
    setArquivos(x => [...x, ...novos].slice(0, 10))
  }

  async function enviar(e: FormEvent) {
    e.preventDefault(); setErro('')
    if (f.nome.trim().split(/\s+/).length < 2) return setErro('Informe seu nome completo.')
    if (!f.nascimento) return setErro('Informe sua data de nascimento.')
    if (f.telefone.replace(/\D/g, '').length < 10) return setErro('Informe um telefone com DDD.')
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(f.email.trim())) return setErro('Confira o seu e-mail.')
    if (!f.ok) return setErro('Para enviar, marque que concorda com o uso dos seus dados para o atendimento.')
    setFase('enviando')

    const caminhos: string[] = []
    for (const a of arquivos) {
      const nome = a.name.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^\w.-]+/g, '_').slice(-80)
      const caminho = `envios/${id}/${Date.now()}-${nome}`
      const { error } = await supabase.storage.from('pre-consulta').upload(caminho, a, { contentType: a.type })
      if (error) { setFase('form'); return setErro(`Não foi possível enviar o arquivo "${a.name}". Tente de novo ou envie sem ele.`) }
      caminhos.push(caminho)
    }

    // Grava as respostas com o texto da pergunta, para a leitura no painel não depender do código
    const respostas: Record<string, unknown> = { _sexo: f.sexo || null }
    for (const s of SECOES) {
      if (s.mulher && !mulher) continue
      for (const p of s.perguntas) respostas[p.id] = { pergunta: p.texto, secao: s.titulo, ...r[p.id] }
    }
    const { error } = await supabase.rpc('enviar_pre_consulta', {
      p_nome: f.nome, p_nascimento: f.nascimento, p_telefone: f.telefone, p_email: f.email,
      p_respostas: respostas, p_anexos: caminhos, p_consentimento: f.ok,
    })
    if (error) {
      setFase('form')
      const m = error.message
      return setErro(m.includes('e-mail') ? 'Confira o seu e-mail.' : m.includes('telefone') ? 'Informe um telefone com DDD.' : m.includes('nome') ? 'Informe seu nome completo.'
        : m.includes('nascimento') ? 'Confira a data de nascimento.' : m.includes('muitos') ? 'Recebemos vários envios com este e-mail. Aguarde um pouco e tente de novo.'
        : 'Não foi possível enviar agora. Tente de novo em instantes.')
    }
    setFase('pronto'); window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (fase === 'pronto') return (
    <section className="site max-w-3xl mx-auto px-5 sm:px-8 py-16 sm:py-24 flex flex-col gap-6 items-start">
      <span className="w-14 h-14 rounded-full bg-oliva text-creme grid place-items-center"><Check className="w-7 h-7" /></span>
      <h1 className="font-display text-[40px] sm:text-[56px] leading-[1.05]">Obrigada, {f.nome.trim().split(' ')[0]}!</h1>
      <p className="text-[19px] leading-relaxed">Suas respostas chegaram para a Dra. Bartira. Elas ajudam a avaliar se é preciso pedir exames antes e a preparar o seu atendimento.</p>
      <Orientacoes />
      <Link to="/" className="inline-flex items-center gap-2 text-[17px] text-cafe hover:underline underline-offset-4">Voltar ao site<ArrowRight className="w-4 h-4" /></Link>
    </section>
  )

  let n = 1
  return (
    <section className="site">
      <div className="max-w-3xl mx-auto px-5 sm:px-8 py-12 sm:py-20 flex flex-col gap-8">
        <header className="flex flex-col gap-4">
          <p className="text-[18px] text-cobre">Primeira consulta</p>
          <h1 className="font-display text-[40px] sm:text-[60px] leading-[1.02]">Questionário pré-consulta</h1>
          <p className="text-[19px] leading-relaxed text-apoio">Preencha antes da sua primeira consulta. As informações ajudam a Dra. Bartira a avaliar a necessidade de exames prévios e a preparar seu atendimento. Leva cerca de 5 minutos.</p>
        </header>

        <form onSubmit={enviar} noValidate className="flex flex-col gap-6">
          <Bloco n={n++} titulo="Identificação">
            <label className="flex flex-col gap-1.5 text-[15px] font-medium">Nome completo
              <input required autoComplete="name" value={f.nome} onChange={e => setF({ ...f, nome: e.target.value })} className="campo !min-h-[52px] text-[18px]" /></label>
            <div className="grid sm:grid-cols-2 gap-5">
              <label className="flex flex-col gap-1.5 text-[15px] font-medium">Data de nascimento
                <input required type="date" autoComplete="bday" max={new Date().toISOString().slice(0, 10)} value={f.nascimento} onChange={e => setF({ ...f, nascimento: e.target.value })} className="campo !min-h-[52px] text-[18px]" /></label>
              <label className="flex flex-col gap-1.5 text-[15px] font-medium">Telefone (WhatsApp)
                <input required type="tel" autoComplete="tel" inputMode="tel" placeholder="(84) 9 0000-0000" value={f.telefone} onChange={e => setF({ ...f, telefone: e.target.value })} className="campo !min-h-[52px] text-[18px]" /></label>
            </div>
            <label className="flex flex-col gap-1.5 text-[15px] font-medium">E-mail
              <input required type="email" autoComplete="email" inputMode="email" value={f.email} onChange={e => setF({ ...f, email: e.target.value })} className="campo !min-h-[52px] text-[18px]" /></label>
            <div className="flex flex-col gap-3">
              <p className="text-[15px] font-medium">Sexo biológico</p>
              <div className="flex flex-wrap gap-2">
                {['Feminino', 'Masculino'].map(o => (
                  <label key={o} className={opcaoCls(f.sexo === o)}>
                    <input type="radio" name="sexo" className="sr-only" checked={f.sexo === o} onChange={() => setF({ ...f, sexo: o })} />{o}</label>
                ))}
              </div>
            </div>
          </Bloco>

          {SECOES.filter(s => !s.mulher || mulher).map(s => (
            <Bloco key={s.titulo} n={n++} titulo={s.titulo}>
              {s.perguntas.map(p => {
                const v = r[p.id]?.valor
                return (
                  <div key={p.id} className="flex flex-col gap-3">
                    <p className="text-[18px] font-medium leading-snug">{p.texto}</p>
                    {p.tipo === 'texto' && (
                      <textarea rows={4} value={(v as string) ?? ''} onChange={e => setResp(p.id, { valor: e.target.value })} className="campo !py-3 text-[17px]" />
                    )}
                    {p.tipo === 'multipla' && (
                      <>
                        <div className="flex flex-wrap gap-2">
                          {p.opcoes.map(o => {
                            const on = ((v as string[]) ?? []).includes(o)
                            return <label key={o} className={opcaoCls(on)}><input type="checkbox" className="sr-only" checked={on} onChange={() => alternar(p, o)} />{on && <Check className="w-4 h-4" />}{o}</label>
                          })}
                        </div>
                        {p.outro && ((v as string[]) ?? []).includes(p.outro) && (
                          <input aria-label={`${p.outro}: qual?`} placeholder="Qual?" value={r[p.id]?.detalhe ?? ''} onChange={e => setResp(p.id, { detalhe: e.target.value })} className="campo text-[17px]" />
                        )}
                        <p className="text-[13px] text-apoio -mt-1">Pode marcar mais de uma opção.</p>
                      </>
                    )}
                    {p.tipo === 'unica' && (
                      <>
                        <div className="flex flex-wrap gap-2">
                          {p.opcoes.map(o => (
                            <label key={o} className={opcaoCls(v === o)}><input type="radio" name={p.id} className="sr-only" checked={v === o} onChange={() => setResp(p.id, { valor: o })} />{o}</label>
                          ))}
                        </div>
                        {p.detalhe && v === p.detalhe.quando && (
                          <input aria-label={p.detalhe.rotulo} placeholder={p.detalhe.rotulo} value={r[p.id]?.detalhe ?? ''} onChange={e => setResp(p.id, { detalhe: e.target.value })} className="campo text-[17px]" />
                        )}
                      </>
                    )}
                  </div>
                )
              })}
              {s.titulo === 'Exames disponíveis' && (
                <div className="flex flex-col gap-3">
                  <p className="text-[18px] font-medium leading-snug">Anexe seus exames recentes <span className="font-normal text-apoio text-[15px]">(opcional)</span></p>
                  <label className="inline-flex items-center gap-2 self-start min-h-[48px] px-5 rounded-full border border-cafe text-cafe cursor-pointer hover:bg-cafe hover:text-creme transition-colors">
                    <Paperclip className="w-4 h-4" />Escolher arquivos
                    <input type="file" multiple accept=".pdf,image/*" className="sr-only" onChange={e => { anexar(e.target.files); e.target.value = '' }} />
                  </label>
                  <p className="text-[13px] text-apoio -mt-1">PDF ou foto, até 15 MB cada, no máximo 10 arquivos.</p>
                  {arquivos.length > 0 && (
                    <ul className="flex flex-col gap-2">
                      {arquivos.map((a, i) => (
                        <li key={i} className="flex items-center gap-3 rounded bg-creme px-3 py-2 text-[15px]">
                          <span className="truncate flex-1">{a.name}</span>
                          <button type="button" aria-label={`Remover ${a.name}`} onClick={() => setArquivos(x => x.filter((_, j) => j !== i))} className="p-1 text-apoio hover:text-terracota"><X className="w-4 h-4" /></button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </Bloco>
          ))}

          <div className="rounded-[4px] bg-tom p-5 sm:p-8"><Orientacoes /></div>

          <label className="flex gap-3 items-start text-[15px] leading-snug text-apoio cursor-pointer">
            <input type="checkbox" checked={f.ok} onChange={e => setF({ ...f, ok: e.target.checked })} className="mt-0.5 w-5 h-5 accent-cafe shrink-0" />
            <span>Concordo que estas informações de saúde sejam usadas pela Dra. Bartira Rebouças e sua equipe para preparar o meu atendimento. Veja a <Link to="/privacidade" className="underline underline-offset-2">política de privacidade</Link>.</span>
          </label>
          {erro && <p className="text-[15px] text-terracota" role="alert">{erro}</p>}
          <button type="submit" disabled={fase === 'enviando'} className="site-btn !h-14 w-full sm:w-auto sm:self-start sm:px-10 disabled:opacity-50">
            {fase === 'enviando' ? 'Enviando' : 'Enviar respostas'}{fase !== 'enviando' && <ArrowRight className="w-5 h-5" />}
          </button>
          <p className="flex items-center gap-2 text-[13px] text-apoio"><Lock className="w-3.5 h-3.5" />Suas respostas só são vistas pela médica e pela equipe dela.</p>
        </form>
      </div>
    </section>
  )
}

function Orientacoes() {
  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-[20px] font-medium">Orientações para o dia da consulta</h2>
      <p className="text-[17px] leading-relaxed">Traga todos os medicamentos, hormônios, vitaminas e suplementos que utiliza, de preferência nas embalagens originais, além de receitas, relatórios e exames anteriores. Para medicamentos que precisam de refrigeração, traga uma foto da embalagem.</p>
    </div>
  )
}
