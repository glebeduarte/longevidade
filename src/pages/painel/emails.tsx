import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { ArrowLeft, Copy, Mail, Pencil, Plus, Send, Trash2 } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { Aviso, Botao, Selo, Titulo, Vazio } from '../../components/ui'
import { dataBR } from '../../lib/faixas'
import { destaqueParaHtml, previa, textoParaHtml } from '../../lib/email'

type Publico = 'leads' | 'pacientes' | 'todos'
type Campanha = {
  id: string; assunto: string; rotulo: string; titulo: string; texto: string; corpo: string; destaque: string | null
  botao_texto: string | null; botao_link: string | null; previa: string | null; publico: Publico; landing_id: string | null
  status: 'rascunho' | 'enviada'; total: number | null; enviada_em: string | null; created_at: string; updated_at: string
}
type Resumo = { campanha_id: string; enviados: number; pendentes: number; erros: number }
type Contagem = { total: number; pacientes: number; leads: number }

const PUBLICOS: Array<[Publico, string, string]> = [
  ['leads', 'Leads', 'Quem baixou material no site e aceitou receber e-mails.'],
  ['pacientes', 'Pacientes', 'Pacientes ativas do programa.'],
  ['todos', 'Todos', 'Leads e pacientes. Quem está nas duas listas recebe uma vez só.'],
]
const NOME_PUBLICO = Object.fromEntries(PUBLICOS.map(([k, r]) => [k, r])) as Record<Publico, string>
const NOVA = { assunto: '', rotulo: 'Dra. Bartira Rebouças', titulo: '', texto: 'Olá, {nome}!\n\n', destaque: '', botao_texto: '', botao_link: '', previa: '', publico: 'leads' as Publico, landing_id: null as string | null }
type Form = typeof NOVA & { id?: string }

const LINKS: Array<[string, string]> = [['/contato', 'Agendar consulta'], ['/programa', 'Conhecer o programa'], ['/conteudos', 'Ver os materiais'], ['/app', 'Abrir o app']]

export function Emails() {
  const [lista, setLista] = useState<Campanha[] | null>(null)
  const [resumo, setResumo] = useState<Map<string, Resumo>>(new Map())
  const [landings, setLandings] = useState<Array<{ id: string; titulo: string }>>([])
  const [form, setForm] = useState<Form | null>(null)

  const carregar = () => {
    supabase.from('campanhas').select('*').order('created_at', { ascending: false }).then(({ data }) => setLista((data as Campanha[]) ?? []))
    supabase.rpc('resumo_campanhas').then(({ data }) => setResumo(new Map(((data as Resumo[]) ?? []).map(r => [r.campanha_id, r]))))
  }
  useEffect(() => {
    carregar()
    supabase.from('landing_pages').select('id, titulo').order('ordem').then(({ data }) => setLandings(data ?? []))
  }, [])

  const abrir = (c?: Campanha, copia = false) => setForm(c ? {
    id: copia ? undefined : c.id, assunto: c.assunto, rotulo: c.rotulo, titulo: c.titulo, texto: c.texto, destaque: c.destaque ?? '',
    botao_texto: c.botao_texto ?? '', botao_link: c.botao_link ?? '', previa: c.previa ?? '', publico: c.publico, landing_id: c.landing_id,
  } : { ...NOVA })

  if (form) return <Editor inicial={form} landings={landings} aoVoltar={() => { setForm(null); carregar() }} />

  return (
    <div className="flex flex-col gap-6">
      <Titulo sub="E-mails avulsos para os leads, as pacientes ou todos, no mesmo visual dos e-mails automáticos."
        acao={<Botao onClick={() => abrir()}><Plus className="w-4 h-4" />Novo e-mail</Botao>}>E-mails</Titulo>
      {lista === null && <p className="text-apoio">Carregando</p>}
      {lista?.length === 0 && <Vazio titulo="Nenhum e-mail ainda" texto="Escreva o primeiro, veja a prévia e mande um teste para você antes de enviar." acao={<Botao onClick={() => abrir()}><Plus className="w-4 h-4" />Novo e-mail</Botao>} />}
      <div className="flex flex-col gap-3">
        {lista?.map(c => {
          const r = resumo.get(c.id)
          return (
            <article key={c.id} className="cartao p-4 sm:p-5 flex flex-col sm:flex-row gap-4 sm:items-center">
              <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="titulo-bloco truncate">{c.assunto || 'Sem assunto'}</h2>
                  {c.status === 'enviada' ? <Selo tom="ok">Enviado</Selo> : <Selo>Rascunho</Selo>}
                  <Selo tom="escuro">{NOME_PUBLICO[c.publico]}</Selo>
                </div>
                <p className="text-corpo text-apoio">
                  {c.status === 'enviada'
                    ? <>Enviado em {dataBR(c.enviada_em!)} para <b>{c.total}</b> {c.total === 1 ? 'pessoa' : 'pessoas'}
                      {r && <> · {r.enviados} entregues ao provedor{r.pendentes > 0 && <>, {r.pendentes} na fila</>}{r.erros > 0 && <span className="text-terracota">, {r.erros} com erro</span>}</>}</>
                    : <>Editado em {dataBR(c.updated_at)}</>}
                </p>
              </div>
              <div className="flex gap-2 shrink-0">
                {c.status === 'rascunho'
                  ? <Botao variante="linha" tamanho="sm" onClick={() => abrir(c)}><Pencil className="w-4 h-4" />Editar</Botao>
                  : <Botao variante="linha" tamanho="sm" onClick={() => abrir(c, true)}><Copy className="w-4 h-4" />Duplicar</Botao>}
              </div>
            </article>
          )
        })}
      </div>
    </div>
  )
}

function Campo({ rotulo, dica, children }: { rotulo: string; dica?: ReactNode; children: ReactNode }) {
  return <label className="flex flex-col gap-1.5"><span className="text-corpo font-medium">{rotulo}</span>{children}{dica && <span className="text-meta text-apoio">{dica}</span>}</label>
}

function Editor({ inicial, landings, aoVoltar }: { inicial: Form; landings: Array<{ id: string; titulo: string }>; aoVoltar: () => void }) {
  const [f, setF] = useState<Form>(inicial)
  const [contagem, setContagem] = useState<Contagem | null>(null)
  const [msg, setMsg] = useState<{ tipo: 'ok' | 'erro'; t: string } | null>(null)
  const [ocupado, setOcupado] = useState<string | null>(null)
  const [confirmar, setConfirmar] = useState(false)
  const [salvo, setSalvo] = useState(true)
  const set = <K extends keyof Form>(k: K, v: Form[K]) => { setF(x => ({ ...x, [k]: v })); setSalvo(false) }

  useEffect(() => {
    setContagem(null)
    supabase.rpc('contar_destinatarios', { p_publico: f.publico, p_landing: f.publico === 'pacientes' ? null : f.landing_id })
      .then(({ data }) => setContagem(data as Contagem))
  }, [f.publico, f.landing_id])

  const html = useMemo(() => {
    const nome = (s: string) => s.replace(/\{nome\}/g, 'Maria')
    return previa({
      rotulo: f.rotulo || 'Dra. Bartira Rebouças', titulo: nome(f.titulo.trim() || f.assunto || 'Título do e-mail'),
      corpo: nome(textoParaHtml(f.texto)), destaque: destaqueParaHtml(nome(f.destaque)),
      botao: f.botao_texto.trim() && f.botao_link.trim() ? [f.botao_texto.trim(), f.botao_link] : null,
      rodape: f.publico === 'pacientes' ? 'paciente' : 'site', sair: '#',
      motivo: f.publico === 'pacientes' ? 'Você recebe este e-mail porque participa do programa Longevidade.' : 'Você recebe estes e-mails porque se cadastrou no site.',
    })
  }, [f])

  async function salvar(): Promise<string | null> {
    setMsg(null)
    if (!f.assunto.trim()) { setMsg({ tipo: 'erro', t: 'Escreva o assunto.' }); return null }
    if (f.botao_texto.trim() && !f.botao_link.trim()) { setMsg({ tipo: 'erro', t: 'O botão precisa de um link.' }); return null }
    const linha = {
      assunto: f.assunto.trim(), rotulo: f.rotulo.trim() || 'Dra. Bartira Rebouças', titulo: f.titulo.trim(), texto: f.texto,
      corpo: textoParaHtml(f.texto), destaque: destaqueParaHtml(f.destaque), botao_texto: f.botao_texto.trim() || null,
      botao_link: f.botao_link.trim() || null, previa: f.previa.trim() || null, publico: f.publico,
      landing_id: f.publico === 'pacientes' ? null : f.landing_id, updated_at: new Date().toISOString(),
    }
    const r = f.id ? await supabase.from('campanhas').update(linha).eq('id', f.id).select('id').single()
      : await supabase.from('campanhas').insert(linha).select('id').single()
    if (r.error) { setMsg({ tipo: 'erro', t: 'Não foi possível salvar.' }); return null }
    setF(x => ({ ...x, id: r.data.id })); setSalvo(true)
    return r.data.id as string
  }

  const processarFila = () => supabase.functions.invoke('enviar-emails').catch(() => null)

  async function testar() {
    setOcupado('teste')
    const id = await salvar()
    if (id) {
      const { data, error } = await supabase.rpc('testar_campanha', { p_id: id })
      if (error) setMsg({ tipo: 'erro', t: 'Não foi possível enviar o teste.' })
      else { await processarFila(); setMsg({ tipo: 'ok', t: `Teste enviado para ${data}. Confira a caixa de entrada e o spam.` }) }
    }
    setOcupado(null)
  }

  async function enviar() {
    setOcupado('envio')
    const id = await salvar()
    if (id) {
      const { data, error } = await supabase.rpc('disparar_campanha', { p_id: id })
      if (error) { setMsg({ tipo: 'erro', t: error.message.includes('já foi') ? 'Este e-mail já foi enviado.' : 'Não foi possível enviar.' }); setOcupado(null); setConfirmar(false); return }
      await processarFila()
      setOcupado(null); setConfirmar(false)
      alert(`${data} e-mails entraram na fila. Os primeiros saem agora e o restante em lotes a cada 5 minutos.`)
      return aoVoltar()
    }
    setOcupado(null); setConfirmar(false)
  }

  async function excluir() {
    if (f.id && confirm('Excluir este rascunho?')) { await supabase.from('campanhas').delete().eq('id', f.id); aoVoltar() }
  }

  const inserirNome = () => set('texto', f.texto + '{nome}')

  return (
    <div className="flex flex-col gap-6">
      <button onClick={() => { if (salvo || confirm('Sair sem salvar as mudanças?')) aoVoltar() }} className="self-start text-corpo text-apoio hover:text-texto inline-flex items-center gap-1"><ArrowLeft className="w-4 h-4" strokeWidth={1.6} />E-mails</button>
      <Titulo sub="A prévia ao lado mostra o e-mail exatamente como chega, com o nome de exemplo Maria.">{f.id ? 'Editar e-mail' : 'Novo e-mail'}</Titulo>

      <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] gap-6 items-start">
        <div className="flex flex-col gap-5">
          <section className="cartao p-4 sm:p-5 flex flex-col gap-3">
            <h2 className="titulo-bloco">Para quem</h2>
            <div className="grid sm:grid-cols-3 gap-2" role="radiogroup" aria-label="Público">
              {PUBLICOS.map(([k, r, d]) => (
                <button key={k} role="radio" aria-checked={f.publico === k} onClick={() => set('publico', k)}
                  className={`text-left rounded-lg border p-3 transition-colors ${f.publico === k ? 'border-cafe bg-tom' : 'border-controle hover:border-cafe/60'}`}>
                  <span className="text-corpo font-medium block">{r}</span><span className="text-meta text-apoio">{d}</span>
                </button>
              ))}
            </div>
            {f.publico !== 'pacientes' && (
              <Campo rotulo="Leads de qual material">
                <select value={f.landing_id ?? ''} onChange={e => set('landing_id', e.target.value || null)} className="campo">
                  <option value="">Todos os materiais</option>
                  {landings.map(l => <option key={l.id} value={l.id}>{l.titulo}</option>)}
                </select>
              </Campo>
            )}
            <p className="text-corpo">
              {contagem === null ? <span className="text-apoio">Contando destinatários</span> : <>
                <b className="tabular-nums">{contagem.total}</b> {contagem.total === 1 ? 'pessoa vai' : 'pessoas vão'} receber
                {f.publico === 'todos' && <span className="text-apoio"> ({contagem.pacientes} pacientes e {contagem.leads} leads)</span>}.
              </>}
              <span className="block text-meta text-apoio">Ficam de fora quem pediu para sair, leads sem consentimento e contas de teste.</span>
            </p>
          </section>

          <section className="cartao p-4 sm:p-5 flex flex-col gap-4">
            <h2 className="titulo-bloco">Conteúdo</h2>
            <Campo rotulo="Assunto" dica="Use {nome} para o primeiro nome da pessoa."><input value={f.assunto} onChange={e => set('assunto', e.target.value)} className="campo" maxLength={150} /></Campo>
            <Campo rotulo="Texto da prévia na caixa de entrada" dica="Opcional. Aparece ao lado do assunto no Gmail e no celular."><input value={f.previa} onChange={e => set('previa', e.target.value)} className="campo" maxLength={140} /></Campo>
            <div className="grid sm:grid-cols-2 gap-3">
              <Campo rotulo="Linha acima do título"><input value={f.rotulo} onChange={e => set('rotulo', e.target.value)} className="campo" maxLength={60} /></Campo>
              <Campo rotulo="Título" dica="Vazio, repete o assunto."><input value={f.titulo} onChange={e => set('titulo', e.target.value)} className="campo" maxLength={120} /></Campo>
            </div>
            <Campo rotulo="Texto" dica={<>Linha em branco separa parágrafos. <b>**negrito**</b>, <i>*itálico*</i>, [texto](link) e linhas começando com "- " viram lista. <button type="button" onClick={inserirNome} className="text-cafe hover:underline">Inserir {'{nome}'}</button></>}>
              <textarea rows={12} value={f.texto} onChange={e => set('texto', e.target.value)} className="campo py-2 leading-relaxed" />
            </Campo>
            <Campo rotulo="Quadro de destaque" dica="Opcional. Caixa com fundo areia para uma frase, um dado ou uma citação.">
              <textarea rows={3} value={f.destaque} onChange={e => set('destaque', e.target.value)} className="campo py-2" />
            </Campo>
            <div className="grid sm:grid-cols-2 gap-3">
              <Campo rotulo="Texto do botão" dica="Opcional."><input value={f.botao_texto} onChange={e => set('botao_texto', e.target.value)} className="campo" maxLength={40} /></Campo>
              <Campo rotulo="Link do botão" dica="Página do site (/contato) ou endereço completo."><input value={f.botao_link} onChange={e => set('botao_link', e.target.value)} className="campo" list="links-site" /></Campo>
              <datalist id="links-site">{LINKS.map(([u]) => <option key={u} value={u} />)}</datalist>
            </div>
            <div className="flex flex-wrap gap-2">
              {LINKS.map(([u, t]) => (
                <button key={u} type="button" onClick={() => { set('botao_link', u); if (!f.botao_texto.trim()) set('botao_texto', t) }}
                  className="h-8 px-3 rounded-full border border-controle text-meta hover:border-cafe/60">{t}</button>
              ))}
            </div>
          </section>

          {msg && <Aviso tipo={msg.tipo}>{msg.t}</Aviso>}
          <div className="flex flex-wrap gap-2">
            <Botao variante="linha" onClick={salvar} disabled={!!ocupado}>{salvo && f.id ? 'Salvo' : 'Salvar rascunho'}</Botao>
            <Botao variante="linha" onClick={testar} disabled={!!ocupado}><Mail className="w-4 h-4" />{ocupado === 'teste' ? 'Enviando teste' : 'Enviar teste para mim'}</Botao>
            <Botao onClick={() => setConfirmar(true)} disabled={!!ocupado || !contagem?.total}><Send className="w-4 h-4" />Enviar</Botao>
            {f.id && <Botao variante="texto" onClick={excluir} className="ml-auto !text-terracota"><Trash2 className="w-4 h-4" />Excluir</Botao>}
          </div>
          {confirmar && (
            <div className="cartao p-4 border-cafe flex flex-col gap-3" role="alertdialog" aria-label="Confirmar envio">
              <p className="text-corpo">Enviar <b>{f.assunto}</b> para <b>{contagem?.total}</b> {contagem?.total === 1 ? 'pessoa' : 'pessoas'} ({NOME_PUBLICO[f.publico].toLowerCase()})? Depois de enviado, o e-mail não pode ser editado nem cancelado.</p>
              <div className="flex gap-2">
                <Botao onClick={enviar} disabled={!!ocupado}>{ocupado === 'envio' ? 'Enviando' : 'Confirmar envio'}</Botao>
                <Botao variante="linha" onClick={() => setConfirmar(false)} disabled={!!ocupado}>Voltar</Botao>
              </div>
            </div>
          )}
        </div>

        <div className="lg:sticky lg:top-6 flex flex-col gap-2">
          <div className="cartao overflow-hidden">
            <div className="px-4 py-3 border-b border-borda text-corpo">
              <p className="truncate"><b>{f.assunto.replace(/\{nome\}/g, 'Maria') || 'Assunto'}</b></p>
              <p className="text-meta text-apoio truncate">Dra. Bartira Rebouças · {f.previa || f.titulo || f.assunto || 'texto da prévia'}</p>
            </div>
            <iframe title="Prévia do e-mail" srcDoc={html} className="w-full h-[72vh] bg-[#f3eee7]" sandbox="" />
          </div>
        </div>
      </div>
    </div>
  )
}
