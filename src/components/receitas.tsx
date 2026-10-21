import { useEffect, useRef, useState } from 'react'
import { AlertTriangle, Download, FileText, Upload, X } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../auth/AuthProvider'
import { Aviso, Botao } from './ui'
import { Icone } from './icones'
import { dataBR } from '../lib/faixas'
import { daPaciente } from '../lib/vista'
import {
  TIPO_RECEITA, diasDeValidade, lerMemed, receitaValida, somarDias, textoDoPdf,
  type DadosReceita, type ItemReceita, type TipoReceita,
} from '../lib/receita'

export type Receita = {
  id: string; patient_id: string; file_path: string; numero: string | null; tipo: TipoReceita
  emitida_em: string; valida_ate: string; uso_continuo: boolean; token: string | null; codigo: string | null
  itens: ItemReceita[]; orientacoes: string | null; active: boolean; created_at: string
}

const campo = 'w-full rounded-md border border-controle bg-folha px-3 text-corpo focus:outline-none focus:border-cafe min-h-[40px]'

export async function baixarReceita(id: string) {
  const { data, error } = await supabase.functions.invoke('receita', { body: { id } })
  if (error || !data?.url) {
    let m = 'Não foi possível baixar a receita.'
    try { m = (await (error as { context?: Response })?.context?.json())?.erro ?? m } catch { /* mantém a mensagem padrão */ }
    throw new Error(m)
  }
  window.location.assign(data.url as string)
}

const diasAte = (iso: string) => Math.round((new Date(`${iso}T12:00:00`).getTime() - new Date(new Date().toLocaleDateString('sv-SE') + 'T12:00:00').getTime()) / 864e5)

function SeloValidade({ r, grande }: { r: Receita; grande?: boolean }) {
  const d = diasAte(r.valida_ate)
  const cls = d < 0 ? 'bg-areia/60 text-apoio' : d <= 7 ? 'bg-[#f5e1d6] text-terracota' : 'bg-[#e3ecd9] text-oliva'
  const txt = d < 0 ? `Vencida em ${dataBR(r.valida_ate)}` : d === 0 ? 'Vence hoje' : `Válida até ${dataBR(r.valida_ate)}${d <= 7 ? ` · faltam ${d} dia${d > 1 ? 's' : ''}` : ''}`
  return <span className={`inline-flex items-center rounded-full px-3 ${grande ? 'py-1.5 text-[15px]' : 'py-0.5 text-meta'} font-medium ${cls}`}>{txt}</span>
}

/** Na ficha (equipe): enviar o PDF, conferir o que foi lido e salvar como conduta. */
export function ReceitasEquipe({ pid, aoMudar }: { pid: string; aoMudar: () => void }) {
  const { session } = useAuth()
  const [lista, setLista] = useState<Receita[]>([])
  const [nome, setNome] = useState('')
  const [arquivo, setArquivo] = useState<File | null>(null)
  const [d, setD] = useState<(DadosReceita & { valida_ate: string; orientacoes: string }) | null>(null)
  const [fase, setFase] = useState<'lendo' | 'salvando' | null>(null)
  const [erro, setErro] = useState('')
  const entrada = useRef<HTMLInputElement>(null)

  const carregar = () => supabase.from('prescriptions').select('*').eq('patient_id', pid).eq('active', true).order('emitida_em', { ascending: false })
    .then(({ data }) => setLista((data as Receita[]) ?? []))
  useEffect(() => {
    carregar()
    supabase.from('patients').select('full_name').eq('id', pid).maybeSingle().then(({ data }) => setNome(data?.full_name ?? ''))
  }, [pid])

  async function escolher(f: File | undefined) {
    if (!f) return
    setErro('')
    if (f.type !== 'application/pdf') return setErro('Envie o PDF da receita.')
    setArquivo(f); setFase('lendo')
    try {
      const lido = lerMemed(await textoDoPdf(f))
      setD({ ...lido, valida_ate: somarDias(lido.emitida_em, diasDeValidade(lido.tipo, lido.itens)), orientacoes: '' })
      if (!lido.itens.length) setErro('Não encontrei os medicamentos no PDF. Preencha abaixo.')
    } catch {
      const hoje = new Date().toLocaleDateString('sv-SE')
      setD({ numero: '', emitida_em: hoje, tipo: 'simples', uso_continuo: false, token: '', codigo: '', paciente_nome: '', itens: [], valida_ate: somarDias(hoje, 180), orientacoes: '' })
      setErro('Não consegui ler este PDF. Preencha os dados abaixo.')
    }
    setFase(null)
  }

  function mudarTipo(tipo: TipoReceita) {
    if (!d) return
    setD({ ...d, tipo, valida_ate: somarDias(d.emitida_em, diasDeValidade(tipo, d.itens)) })
  }
  const item = (i: number, k: keyof ItemReceita, v: string) => d && setD({ ...d, itens: d.itens.map((x, j) => j === i ? { ...x, [k]: v } : x) })

  async function salvar() {
    if (!d || !arquivo) return
    const itens = d.itens.filter(i => i.nome.trim())
    if (!itens.length) return setErro('Inclua pelo menos um medicamento.')
    setFase('salvando'); setErro('')
    const caminho = `${pid}/${crypto.randomUUID()}.pdf`
    const up = await supabase.storage.from('receitas').upload(caminho, arquivo, { contentType: 'application/pdf' })
    if (up.error) { setFase(null); return setErro('Não foi possível enviar o arquivo.') }
    const { data: rx, error } = await supabase.from('prescriptions').insert({
      patient_id: pid, file_path: caminho, numero: d.numero || null, tipo: d.tipo, emitida_em: d.emitida_em, valida_ate: d.valida_ate,
      uso_continuo: d.uso_continuo, token: d.token || null, codigo: d.codigo || null, itens, orientacoes: d.orientacoes.trim() || null, created_by: session?.user.id,
    }).select('id').single()
    if (error || !rx) { setFase(null); return setErro('Não foi possível salvar a receita.') }
    await supabase.from('conducts').insert(itens.map(i => ({
      patient_id: pid, kind: 'medicacao', title: i.nome, detail: i.posologia || null, started_at: d.emitida_em, prescription_id: rx.id, created_by: session?.user.id,
    })))
    setD(null); setArquivo(null); setFase(null); carregar(); aoMudar()
  }

  async function arquivar(r: Receita) {
    await supabase.from('prescriptions').update({ active: false }).eq('id', r.id)
    carregar()
  }

  const primeiro = (s: string) => s.trim().split(/\s+/)[0]?.toLowerCase() ?? ''
  const nomeDiferente = d?.paciente_nome && nome && primeiro(d.paciente_nome) !== primeiro(nome)

  return (
    <div className="px-5 pb-5 pt-4 border-t border-borda flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <p className="rotulo">Receitas</p>
        {!d && (
          <>
            <input ref={entrada} type="file" accept="application/pdf" className="sr-only" id={`rx-${pid}`} onChange={e => { escolher(e.target.files?.[0]); e.target.value = '' }} />
            <Botao variante="linha" tamanho="sm" onClick={() => entrada.current?.click()} disabled={fase === 'lendo'}>
              <Upload className="w-4 h-4" />{fase === 'lendo' ? 'Lendo o PDF' : 'Enviar receita (PDF)'}
            </Botao>
          </>
        )}
      </div>

      {!d && lista.length === 0 && <p className="text-corpo text-apoio">Envie o PDF da Memed. Os medicamentos entram nas condutas e a paciente vê como usar e baixa a receita enquanto ela for válida.</p>}

      {!d && lista.map(r => (
        <div key={r.id} className="painel-tom p-3.5 flex flex-col gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <FileText className="w-4 h-4 text-apoio" />
            <span className="text-corpo font-medium">{TIPO_RECEITA[r.tipo]}</span>
            <span className="text-meta text-apoio">emitida em {dataBR(r.emitida_em)}{r.numero ? ` · n.º ${r.numero}` : ''}</span>
            <span className="ml-auto"><SeloValidade r={r} /></span>
          </div>
          <ul className="text-corpo">{r.itens.map((i, k) => <li key={k}>· {i.nome}{i.quantidade ? <span className="text-apoio"> ({i.quantidade})</span> : null}</li>)}</ul>
          <div className="flex gap-4">
            <button onClick={() => baixarReceita(r.id).catch(e => setErro((e as Error).message))} className="inline-flex items-center gap-1.5 text-corpo text-cafe hover:underline"><Download className="w-4 h-4" />Baixar PDF</button>
            <button onClick={() => arquivar(r)} className="text-corpo text-apoio hover:text-terracota">Arquivar</button>
          </div>
        </div>
      ))}

      {d && (
        <div className="rounded-lg border border-controle bg-folha p-4 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-apoio" />
            <p className="text-corpo font-medium flex-1 truncate">{arquivo?.name}</p>
            <button onClick={() => { setD(null); setArquivo(null); setErro('') }} aria-label="Cancelar" className="w-8 h-8 grid place-items-center rounded hover:bg-tom"><X className="w-4 h-4" /></button>
          </div>
          <p className="text-meta text-apoio">Confira o que foi lido do PDF antes de salvar.</p>
          {nomeDiferente && <Aviso tipo="erro"><span className="inline-flex gap-2"><AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />A receita está em nome de {d.paciente_nome}, e esta ficha é de {nome}. Confira se é o arquivo certo.</span></Aviso>}

          {d.itens.map((i, k) => (
            <div key={k} className="painel-tom p-3 flex flex-col gap-2">
              <div className="flex gap-2">
                <input aria-label="Medicamento" value={i.nome} onChange={e => item(k, 'nome', e.target.value)} className={campo} placeholder="Medicamento" />
                <input aria-label="Quantidade" value={i.quantidade} onChange={e => item(k, 'quantidade', e.target.value)} className={`${campo} !w-36`} placeholder="Quantidade" />
                <button onClick={() => setD({ ...d, itens: d.itens.filter((_, j) => j !== k) })} aria-label="Remover medicamento" className="w-10 shrink-0 grid place-items-center rounded hover:bg-ativo"><X className="w-4 h-4" /></button>
              </div>
              <input aria-label="Princípio ativo" value={i.principio} onChange={e => item(k, 'principio', e.target.value)} className={campo} placeholder="Princípio ativo" />
              <textarea aria-label="Como usar" rows={2} value={i.posologia} onChange={e => item(k, 'posologia', e.target.value)} className={`${campo} py-2`} placeholder="Como usar" />
            </div>
          ))}
          <button onClick={() => setD({ ...d, itens: [...d.itens, { nome: '', principio: '', quantidade: '', posologia: '' }] })} className="self-start text-corpo text-cafe hover:underline">Adicionar medicamento</button>

          <div className="grid sm:grid-cols-2 gap-3">
            <label className="flex flex-col gap-1 text-meta text-apoio">Tipo de receita
              <select value={d.tipo} onChange={e => mudarTipo(e.target.value as TipoReceita)} className={campo}>
                {(Object.keys(TIPO_RECEITA) as TipoReceita[]).map(t => <option key={t} value={t}>{TIPO_RECEITA[t]}</option>)}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-meta text-apoio">Número
              <input value={d.numero} onChange={e => setD({ ...d, numero: e.target.value })} className={campo} />
            </label>
            <label className="flex flex-col gap-1 text-meta text-apoio">Emitida em
              <input type="date" value={d.emitida_em} onChange={e => setD({ ...d, emitida_em: e.target.value, valida_ate: somarDias(e.target.value, diasDeValidade(d.tipo, d.itens)) })} className={campo} />
            </label>
            <label className="flex flex-col gap-1 text-meta text-apoio">Válida até
              <input type="date" value={d.valida_ate} min={d.emitida_em} onChange={e => setD({ ...d, valida_ate: e.target.value })} className={campo} />
            </label>
            <label className="flex flex-col gap-1 text-meta text-apoio">Token da farmácia
              <input value={d.token} onChange={e => setD({ ...d, token: e.target.value })} className={campo} />
            </label>
            <label className="flex flex-col gap-1 text-meta text-apoio">Código de desbloqueio da paciente
              <input value={d.codigo} onChange={e => setD({ ...d, codigo: e.target.value })} className={campo} />
            </label>
          </div>
          <p className="text-meta text-apoio">Validade sugerida pelo tipo ({diasDeValidade(d.tipo, d.itens)} dias). Ajuste se a receita disser outra coisa. Depois dessa data a paciente não consegue mais baixar o PDF.</p>
          <label className="flex items-center gap-2 text-corpo"><input type="checkbox" className="w-4 h-4 accent-cafe" checked={d.uso_continuo} onChange={e => setD({ ...d, uso_continuo: e.target.checked })} />Uso contínuo</label>
          <label className="flex flex-col gap-1 text-meta text-apoio">Orientação extra para a paciente (opcional)
            <textarea rows={2} value={d.orientacoes} onChange={e => setD({ ...d, orientacoes: e.target.value })} className={`${campo} py-2`} placeholder="Ex.: guardar na geladeira, não congelar" />
          </label>
          {erro && <Aviso tipo="erro">{erro}</Aviso>}
          <Botao onClick={salvar} disabled={fase === 'salvando'} className="self-start">{fase === 'salvando' ? 'Salvando' : 'Salvar receita e condutas'}</Botao>
        </div>
      )}
      {!d && erro && <Aviso tipo="erro">{erro}</Aviso>}
    </div>
  )
}

/** No app da paciente: o que ela precisa saber de cada receita e o download dentro da validade. */
export function ReceitasPaciente() {
  const [lista, setLista] = useState<Receita[] | null>(null)
  const [erro, setErro] = useState<Record<string, string>>({})
  const [baixando, setBaixando] = useState<string | null>(null)
  useEffect(() => {
    daPaciente(supabase.from('prescriptions').select('*')).eq('active', true).order('emitida_em', { ascending: false })
      .then(({ data }) => setLista((data as Receita[]) ?? []))
  }, [])
  if (!lista?.length) return null
  const validas = lista.filter(r => receitaValida(r.valida_ate))
  const vencidas = lista.filter(r => !receitaValida(r.valida_ate))

  async function baixar(r: Receita) {
    setBaixando(r.id); setErro({ ...erro, [r.id]: '' })
    try { await baixarReceita(r.id) } catch (e) { setErro({ ...erro, [r.id]: (e as Error).message }) }
    setBaixando(null)
  }

  return (
    <section className="flex flex-col gap-3" aria-labelledby="t-receitas">
      <h2 id="t-receitas" className="titulo-bloco flex items-center gap-2.5"><Icone tema="medicacao" fundo tamanho={40} />Seus medicamentos</h2>
      {[...validas, ...vencidas].map(r => {
        const valida = receitaValida(r.valida_ate)
        return (
          <article key={r.id} className={`cartao p-4 flex flex-col gap-4 ${valida ? '' : 'opacity-75'}`}>
            {r.itens.map((i, k) => (
              <div key={k} className="flex flex-col gap-1.5">
                <p className="text-[18px] font-medium leading-snug">{i.nome}</p>
                {i.principio && <p className="text-corpo text-apoio">{i.principio}</p>}
                {i.posologia && (
                  <div className="mt-1 rounded-lg bg-tom px-4 py-3">
                    <p className="rotulo mb-1">Como usar</p>
                    <p className="text-[17px] leading-relaxed">{i.posologia}</p>
                  </div>
                )}
                {i.quantidade && <p className="text-corpo text-apoio">Quantidade na receita: {i.quantidade}</p>}
              </div>
            ))}
            {r.orientacoes && <p className="text-[16px] leading-relaxed border-l-2 border-cobre pl-3">{r.orientacoes}</p>}

            <div className="border-t border-borda pt-3 flex flex-col gap-2.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-corpo font-medium">{TIPO_RECEITA[r.tipo]}</span>
                <SeloValidade r={r} grande />
              </div>
              {r.tipo !== 'simples' && <p className="text-corpo text-apoio">A farmácia fica com uma via desta receita.{r.uso_continuo ? ' Como é de uso contínuo, dá para comprar mais de uma vez dentro da validade.' : ''}</p>}
              {valida && (r.token || r.codigo) && (
                <div className="grid grid-cols-2 gap-2">
                  {r.token && <div className="rounded-lg bg-tom px-3 py-2"><p className="text-meta text-apoio">Token para a farmácia</p><p className="text-[20px] font-medium tracking-wider tabular-nums">{r.token}</p></div>}
                  {r.codigo && <div className="rounded-lg bg-tom px-3 py-2"><p className="text-meta text-apoio">Seu código de desbloqueio</p><p className="text-[20px] font-medium tracking-wider tabular-nums">{r.codigo}</p></div>}
                </div>
              )}
              {valida
                ? <Botao className="w-full !h-12" onClick={() => baixar(r)} disabled={baixando === r.id}><Download className="w-4 h-4" />{baixando === r.id ? 'Preparando' : 'Baixar receita (PDF)'}</Botao>
                : <p className="text-corpo text-apoio">Esta receita venceu e não pode mais ser usada. Se ainda precisa do medicamento, peça uma nova no check-in.</p>}
              {erro[r.id] && <Aviso tipo="erro">{erro[r.id]}</Aviso>}
            </div>
          </article>
        )
      })}
    </section>
  )
}
