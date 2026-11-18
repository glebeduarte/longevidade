import { useEffect, useState } from 'react'
import { Copy, ExternalLink, Paperclip, Search, Trash2 } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { Botao, Selo } from '../../components/ui'
import { dataBR } from '../../lib/faixas'
import { Folha } from './painel'

type Item = { pergunta: string; secao: string; valor?: string | string[]; detalhe?: string }
type PC = {
  id: string; nome: string; nascimento: string | null; telefone: string; email: string
  respostas: Record<string, Item | string | null>; anexos: string[]; lida_em: string | null; created_at: string
}
const LINK = 'https://bartirareboucas.com.br/pre-consulta'

const idade = (d: string | null) => {
  if (!d) return null
  const n = new Date(d + 'T12:00:00'), h = new Date()
  return h.getFullYear() - n.getFullYear() - (h < new Date(h.getFullYear(), n.getMonth(), n.getDate()) ? 1 : 0)
}
const texto = (i: Item) => {
  const v = Array.isArray(i.valor) ? i.valor.join(', ') : i.valor
  return [v, i.detalhe].filter(Boolean).join(' · ') || 'Sem resposta'
}

/** Aba "Pré-consultas" do painel Site: respostas do questionário público /pre-consulta. */
export function PreConsultas() {
  const [lista, setLista] = useState<PC[] | null>(null)
  const [aberta, setAberta] = useState<PC | null>(null)
  const [busca, setBusca] = useState('')
  const [apagar, setApagar] = useState(false)
  const [copiado, setCopiado] = useState(false)

  const carregar = () => supabase.from('pre_consultas').select('*').order('created_at', { ascending: false }).limit(1000)
    .then(({ data }) => setLista((data as PC[]) ?? []))
  useEffect(() => { carregar() }, [])

  async function abrir(p: PC) {
    setAberta(p); setApagar(false)
    if (!p.lida_em) {
      const agora = new Date().toISOString()
      await supabase.from('pre_consultas').update({ lida_em: agora }).eq('id', p.id)
      setLista(l => l?.map(x => (x.id === p.id ? { ...x, lida_em: agora } : x)) ?? null)
    }
  }
  async function verAnexo(caminho: string) {
    const { data } = await supabase.storage.from('pre-consulta').createSignedUrl(caminho, 600)
    if (data?.signedUrl) window.open(data.signedUrl, '_blank', 'noopener')
  }
  async function excluir(p: PC) {
    if (p.anexos.length) await supabase.storage.from('pre-consulta').remove(p.anexos)
    await supabase.from('pre_consultas').delete().eq('id', p.id)
    setAberta(null); carregar()
  }

  const filtrada = (lista ?? []).filter(p => !busca.trim() || `${p.nome} ${p.email} ${p.telefone}`.toLowerCase().includes(busca.trim().toLowerCase()))
  const naoLidas = (lista ?? []).filter(p => !p.lida_em).length

  return (
    <div className="flex flex-col gap-4">
      <div className="cartao p-4 flex flex-wrap gap-3 items-center">
        <p className="text-corpo flex-1 min-w-[220px]">Link público do questionário: <a href={LINK} target="_blank" rel="noreferrer" className="text-cafe hover:underline">{LINK.replace('https://', '')}</a></p>
        <Botao variante="linha" onClick={() => { navigator.clipboard.writeText(LINK); setCopiado(true); setTimeout(() => setCopiado(false), 1500) }}><Copy className="w-4 h-4" />{copiado ? 'Copiado' : 'Copiar link'}</Botao>
        <a href={LINK} target="_blank" rel="noreferrer"><Botao variante="linha"><ExternalLink className="w-4 h-4" />Abrir</Botao></a>
      </div>
      <div className="grid grid-cols-2 gap-3 max-w-md">
        <div className="cartao p-4"><p className="rotulo">Recebidas</p><p className="numero">{lista?.length ?? 0}</p></div>
        <div className="cartao p-4"><p className="rotulo">Não lidas</p><p className="numero">{naoLidas}</p></div>
      </div>
      <label className="relative max-w-md"><Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-apoio" />
        <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar por nome, e-mail ou telefone" className="campo pl-9" /></label>

      {lista === null ? <p className="text-apoio">Carregando</p> : filtrada.length === 0 ? <p className="text-corpo text-apoio">{lista.length ? 'Nenhuma pré-consulta com essa busca.' : 'Nenhuma pré-consulta recebida ainda. Envie o link para quem marcou a primeira consulta.'}</p> : (
        <div className="cartao overflow-x-auto">
          <table className="w-full text-corpo">
            <thead><tr className="text-left text-meta text-apoio border-b border-borda">
              <th className="px-4 py-3 font-normal">Nome</th><th className="px-4 py-3 font-normal">Contato</th><th className="px-4 py-3 font-normal">Recebida</th><th className="px-4 py-3 font-normal" />
            </tr></thead>
            <tbody>
              {filtrada.map(p => (
                <tr key={p.id} onClick={() => abrir(p)} className="border-b border-regra last:border-0 cursor-pointer hover:bg-tom/50">
                  <td className="px-4 py-3 font-medium">{p.nome}{idade(p.nascimento) !== null && <span className="text-apoio font-normal"> · {idade(p.nascimento)} anos</span>}</td>
                  <td className="px-4 py-3">{p.email}<span className="block text-apoio">{p.telefone}</span></td>
                  <td className="px-4 py-3 tabular-nums whitespace-nowrap">{dataBR(p.created_at)}</td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    {p.anexos.length > 0 && <span className="inline-flex items-center gap-1 text-apoio mr-3"><Paperclip className="w-4 h-4" />{p.anexos.length}</span>}
                    {!p.lida_em && <Selo tom="alerta">Nova</Selo>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Folha aberto={!!aberta} titulo={aberta?.nome ?? ''} sub={aberta ? `Recebida em ${dataBR(aberta.created_at)}` : ''} onFechar={() => setAberta(null)}>
        {aberta && (
          <div className="flex flex-col gap-5">
            <div className="text-corpo flex flex-col gap-1">
              {aberta.nascimento && <p>Nascimento: {dataBR(aberta.nascimento)} ({idade(aberta.nascimento)} anos)</p>}
              <p>E-mail: <a href={`mailto:${aberta.email}`} className="text-cafe hover:underline">{aberta.email}</a></p>
              <p>Telefone: <a href={`https://wa.me/${aberta.telefone.replace(/\D/g, '').replace(/^(?!55)/, '55')}`} target="_blank" rel="noreferrer" className="text-cafe hover:underline">{aberta.telefone}</a></p>
              {typeof aberta.respostas._sexo === 'string' && <p>Sexo biológico: {aberta.respostas._sexo}</p>}
            </div>
            {Object.entries(aberta.respostas).filter(([k, v]) => !k.startsWith('_') && v && typeof v === 'object').map(([k, v]) => (
              <div key={k}>
                <p className="text-meta text-apoio">{(v as Item).secao}</p>
                <p className="font-medium">{(v as Item).pergunta}</p>
                <p className="text-corpo whitespace-pre-wrap">{texto(v as Item)}</p>
              </div>
            ))}
            {aberta.anexos.length > 0 && (
              <div className="flex flex-col gap-2">
                <p className="font-medium">Exames anexados</p>
                {aberta.anexos.map(a => (
                  <button key={a} onClick={() => verAnexo(a)} className="inline-flex items-center gap-2 text-left text-cafe hover:underline">
                    <Paperclip className="w-4 h-4 shrink-0" />{a.split('/').pop()?.replace(/^\d+-/, '')}
                  </button>
                ))}
              </div>
            )}
            <div className="pt-3 border-t border-regra">
              {apagar
                ? <p className="text-corpo">Apagar as respostas e os anexos? <button onClick={() => excluir(aberta)} className="text-terracota font-medium ml-2">Confirmar</button><button onClick={() => setApagar(false)} className="ml-3 text-apoio">Cancelar</button></p>
                : <button onClick={() => setApagar(true)} className="inline-flex items-center gap-2 text-apoio hover:text-terracota"><Trash2 className="w-4 h-4" />Excluir pré-consulta</button>}
            </div>
          </div>
        )}
      </Folha>
    </div>
  )
}
