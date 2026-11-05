import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { Copy, Download, ExternalLink, FileText, Image as ImageIcon, Pencil, Plus, Search, Star, Trash2, Upload } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { Abas, Aviso, Botao, Selo, Titulo } from '../../components/ui'
import { dataBR } from '../../lib/faixas'
import { Capa, urlMaterial, type Landing } from '../site/material'
import { Chave, Folha } from './painel'

type Lead = { id: string; landing_id: string; nome: string; email: string; whatsapp: string | null; origem: Record<string, string>; vezes: number; created_at: string; updated_at: string }
type Aba = 'landings' | 'leads'

const SITE = 'https://longevidade-black.vercel.app'
const slugar = (t: string) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60)
const VAZIA: Omit<Landing, 'id' | 'created_at' | 'updated_at'> = {
  slug: '', titulo: '', tipo: 'E-book', chamada: 'E-book gratuito', subtitulo: '', descricao: '', beneficios: [], botao: 'Quero receber',
  obrigado: 'Pronto! Seu material está liberado abaixo e também foi enviado para o seu e-mail.', arquivo_path: null, capa_path: null,
  ativa: false, destaque: false, ordem: 0,
}

export function SiteGestao() {
  const [aba, setAba] = useState<Aba>(() => (new URLSearchParams(location.search).get('aba') as Aba) || 'landings')
  const [landings, setLandings] = useState<Landing[] | null>(null)
  const [leads, setLeads] = useState<Lead[] | null>(null)
  const [editando, setEditando] = useState<(Partial<Landing> & typeof VAZIA) | null>(null)

  const carregar = () => {
    supabase.from('landing_pages').select('*').order('ordem').then(({ data }) => setLandings((data as Landing[]) ?? []))
    supabase.from('leads').select('*').order('created_at', { ascending: false }).limit(2000).then(({ data }) => setLeads((data as Lead[]) ?? []))
  }
  useEffect(carregar, [])
  const trocar = (k: Aba) => { setAba(k); history.replaceState(null, '', `?aba=${k}`) }
  const porLanding = useMemo(() => {
    const m = new Map<string, number>(); (leads ?? []).forEach(l => m.set(l.landing_id, (m.get(l.landing_id) ?? 0) + 1)); return m
  }, [leads])

  async function alternar(l: Landing, campo: 'ativa' | 'destaque') {
    setLandings(ls => ls?.map(x => (x.id === l.id ? { ...x, [campo]: !x[campo] } : x)) ?? null)
    await supabase.from('landing_pages').update({ [campo]: !l[campo], updated_at: new Date().toISOString() }).eq('id', l.id)
    carregar()
  }

  return (
    <div className="flex flex-col gap-6">
      <Titulo sub="Materiais com página de captura, o que aparece na página inicial do site e os contatos captados."
        acao={aba === 'landings' && <Botao onClick={() => setEditando({ ...VAZIA, ordem: (landings?.length ?? 0) + 1 })}><Plus className="w-4 h-4" />Nova landing page</Botao>}>Site</Titulo>
      <Abas rotulo="Seções do site" atual={aba} aoTrocar={trocar} itens={[['landings', 'Landing pages'], ['leads', 'Leads', leads ? <Selo key="n">{leads.length}</Selo> : null]]} />

      {aba === 'landings' && (
        <div className="flex flex-col gap-4">
          <div className="painel-tom px-4 py-3 text-corpo flex flex-wrap gap-x-6 gap-y-1">
            <span><b>No ar</b>: a landing page abre para o público e o material aparece em Conteúdos.</span>
            <span className="inline-flex items-center gap-1.5"><Star className="w-4 h-4 fill-cobre text-cobre" /><b>Estrela</b>: o material também aparece na página inicial.</span>
          </div>
          {landings === null && <p className="text-apoio">Carregando</p>}
          {landings?.map(l => (
            <article key={l.id} className={`cartao p-4 sm:p-5 flex flex-col sm:flex-row gap-5 ${l.ativa ? '' : 'opacity-80'}`}>
              <Capa m={l} className="w-20 shrink-0 self-start" />
              <div className="flex-1 min-w-0 flex flex-col gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="titulo-bloco">{l.titulo}</h2>
                  <Selo>{l.tipo}</Selo>
                  {l.ativa ? <Selo tom="ok">No ar</Selo> : <Selo>Fora do ar</Selo>}
                  {!l.arquivo_path && <Selo tom="alerta">Sem PDF</Selo>}
                </div>
                <p className="text-corpo text-apoio line-clamp-2">{l.subtitulo}</p>
                <div className="flex items-center gap-4 flex-wrap text-corpo">
                  <span className="tabular-nums"><b>{porLanding.get(l.id) ?? 0}</b> leads</span>
                  <a href={`/material/${l.slug}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-cafe hover:underline">/material/{l.slug}<ExternalLink className="w-3.5 h-3.5" /></a>
                  <button onClick={() => navigator.clipboard?.writeText(`${SITE}/material/${l.slug}`)} className="inline-flex items-center gap-1 text-apoio hover:text-texto"><Copy className="w-3.5 h-3.5" />Copiar link</button>
                </div>
              </div>
              <div className="flex sm:flex-col items-center sm:items-end gap-4 sm:gap-3 shrink-0">
                <label className="flex items-center gap-2 text-corpo">No ar<Chave ligado={l.ativa} aoTrocar={() => alternar(l, 'ativa')} rotulo={`Colocar ${l.titulo} no ar`} /></label>
                <button onClick={() => alternar(l, 'destaque')} aria-pressed={l.destaque} title={l.destaque ? 'Na página inicial' : 'Mostrar na página inicial'}
                  className={`inline-flex items-center gap-1.5 text-corpo ${l.destaque ? 'text-cobre' : 'text-apoio hover:text-texto'}`}>
                  <Star className={`w-5 h-5 ${l.destaque ? 'fill-cobre' : ''}`} />{l.destaque ? 'Na página inicial' : 'Fora da inicial'}
                </button>
                <Botao variante="linha" tamanho="sm" onClick={() => setEditando({ ...l })}><Pencil className="w-4 h-4" />Editar</Botao>
              </div>
              {l.destaque && !l.ativa && <p className="sm:hidden text-meta text-apoio">Com estrela, mas fora do ar: só aparece na inicial quando estiver no ar.</p>}
            </article>
          ))}
        </div>
      )}

      {aba === 'leads' && <Leads leads={leads} landings={landings ?? []} aoMudar={carregar} />}

      <Folha aberto={!!editando} titulo={editando?.id ? 'Editar landing page' : 'Nova landing page'} sub="Mesma estrutura das demais: capa, textos, benefícios e formulário." onFechar={() => setEditando(null)}>
        {editando && <Editor l={editando} aoSalvar={() => { setEditando(null); carregar() }} />}
      </Folha>
    </div>
  )
}

function Campo({ rotulo, dica, children }: { rotulo: string; dica?: string; children: ReactNode }) {
  return <label className="flex flex-col gap-1.5"><span className="text-corpo font-medium">{rotulo}</span>{children}{dica && <span className="text-meta text-apoio">{dica}</span>}</label>
}

function Editor({ l, aoSalvar }: { l: Partial<Landing> & typeof VAZIA; aoSalvar: () => void }) {
  const [f, setF] = useState(l)
  const [beneficios, setBeneficios] = useState(l.beneficios.join('\n'))
  const [slugManual, setSlugManual] = useState(!!l.id)
  const [envio, setEnvio] = useState<string | null>(null)
  const [erro, setErro] = useState('')
  const [salvando, setSalvando] = useState(false)
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF(x => ({ ...x, [k]: v }))

  async function subir(tipo: 'arquivo_path' | 'capa_path', arq?: File) {
    if (!arq) return
    if (tipo === 'arquivo_path' && arq.type !== 'application/pdf') return setErro('O material precisa ser um PDF.')
    if (tipo === 'capa_path' && !/^image\/(jpeg|png|webp)$/.test(arq.type)) return setErro('A capa precisa ser JPG, PNG ou WebP.')
    setErro(''); setEnvio(tipo)
    const ext = arq.name.split('.').pop()?.toLowerCase() ?? 'pdf'
    const caminho = `${f.slug || 'material'}/${crypto.randomUUID()}.${ext}`
    const { error } = await supabase.storage.from('materiais').upload(caminho, arq, { contentType: arq.type })
    setEnvio(null)
    if (error) return setErro('Não foi possível enviar o arquivo.')
    set(tipo, caminho)
  }

  async function salvar() {
    setErro('')
    if (!f.titulo.trim()) return setErro('Dê um título ao material.')
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(f.slug)) return setErro('O endereço só pode ter letras minúsculas, números e hífens.')
    setSalvando(true)
    const linha = {
      slug: f.slug, titulo: f.titulo.trim(), tipo: f.tipo, chamada: f.chamada?.trim() || null, subtitulo: f.subtitulo?.trim() || null,
      descricao: f.descricao?.trim() || null, beneficios: beneficios.split('\n').map(x => x.trim()).filter(Boolean), botao: f.botao.trim() || 'Quero receber',
      obrigado: f.obrigado.trim(), arquivo_path: f.arquivo_path, capa_path: f.capa_path, ativa: f.ativa, destaque: f.destaque, ordem: f.ordem,
      updated_at: new Date().toISOString(),
    }
    const { error } = f.id ? await supabase.from('landing_pages').update(linha).eq('id', f.id) : await supabase.from('landing_pages').insert(linha)
    setSalvando(false)
    if (error) return setErro(error.message.includes('duplicate') ? 'Já existe uma landing page com esse endereço.' : 'Não foi possível salvar.')
    aoSalvar()
  }

  const campo = 'campo'
  return (
    <div className="flex flex-col gap-5">
      <div className="flex gap-4 items-start">
        <Capa m={f} className="w-24 shrink-0" />
        <div className="flex flex-col gap-2 text-corpo">
          <label className="inline-flex items-center gap-2 cursor-pointer text-cafe hover:underline"><ImageIcon className="w-4 h-4" />{envio === 'capa_path' ? 'Enviando' : f.capa_path ? 'Trocar capa' : 'Enviar capa (opcional)'}
            <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={e => { subir('capa_path', e.target.files?.[0]); e.target.value = '' }} /></label>
          {f.capa_path && <button onClick={() => set('capa_path', null)} className="self-start text-apoio hover:text-terracota">Usar capa automática</button>}
          <p className="text-meta text-apoio">Sem imagem, a capa é desenhada com a marca.</p>
        </div>
      </div>

      <div className="rounded-lg border border-controle p-3 flex items-center gap-3">
        <FileText className="w-5 h-5 text-apoio shrink-0" />
        <div className="flex-1 min-w-0 text-corpo">
          {f.arquivo_path ? <a href={urlMaterial(f.arquivo_path)} target="_blank" rel="noreferrer" className="text-cafe hover:underline truncate block">PDF enviado</a> : <span className="text-terracota">Nenhum PDF ainda</span>}
          <span className="text-meta text-apoio">É o arquivo que o lead baixa e recebe por e-mail.</span>
        </div>
        <label className="inline-flex items-center gap-1.5 h-9 px-3 rounded border border-controle bg-folha text-[13px] cursor-pointer hover:border-cafe/60"><Upload className="w-4 h-4" />{envio === 'arquivo_path' ? 'Enviando' : f.arquivo_path ? 'Trocar' : 'Enviar PDF'}
          <input type="file" accept="application/pdf" className="sr-only" onChange={e => { subir('arquivo_path', e.target.files?.[0]); e.target.value = '' }} /></label>
      </div>

      <Campo rotulo="Título"><input value={f.titulo} onChange={e => { set('titulo', e.target.value); if (!slugManual) set('slug', slugar(e.target.value)) }} className={campo} /></Campo>
      <Campo rotulo="Endereço da página" dica={`${SITE.replace('https://', '')}/material/${f.slug || '...'}`}>
        <input value={f.slug} onChange={e => { setSlugManual(true); set('slug', slugar(e.target.value)) }} className={campo} />
      </Campo>
      <div className="grid grid-cols-2 gap-3">
        <Campo rotulo="Tipo">
          <select value={f.tipo} onChange={e => set('tipo', e.target.value)} className={campo}>
            {['E-book', 'Guia', 'Checklist', 'Planilha', 'Aula', 'Material'].map(t => <option key={t}>{t}</option>)}
          </select>
        </Campo>
        <Campo rotulo="Ordem"><input type="number" value={f.ordem} onChange={e => set('ordem', Number(e.target.value))} className={campo} /></Campo>
      </div>
      <Campo rotulo="Chamada curta" dica="Aparece acima do título. Ex.: E-book gratuito"><input value={f.chamada ?? ''} onChange={e => set('chamada', e.target.value)} className={campo} /></Campo>
      <Campo rotulo="Promessa em uma frase"><textarea rows={2} value={f.subtitulo ?? ''} onChange={e => set('subtitulo', e.target.value)} className={`${campo} py-2`} /></Campo>
      <Campo rotulo="Descrição"><textarea rows={4} value={f.descricao ?? ''} onChange={e => set('descricao', e.target.value)} className={`${campo} py-2`} /></Campo>
      <Campo rotulo="O que a pessoa vai encontrar" dica="Um item por linha."><textarea rows={5} value={beneficios} onChange={e => setBeneficios(e.target.value)} className={`${campo} py-2`} /></Campo>
      <Campo rotulo="Texto do botão"><input value={f.botao} onChange={e => set('botao', e.target.value)} className={campo} /></Campo>
      <Campo rotulo="Mensagem depois do cadastro"><textarea rows={2} value={f.obrigado} onChange={e => set('obrigado', e.target.value)} className={`${campo} py-2`} /></Campo>

      <div className="painel-tom p-4 flex flex-col gap-3">
        <label className="flex items-center justify-between gap-3 text-corpo"><span><b>No ar</b><span className="block text-meta text-apoio">A página abre para o público.</span></span><Chave ligado={f.ativa} aoTrocar={() => set('ativa', !f.ativa)} rotulo="No ar" /></label>
        <label className="flex items-center justify-between gap-3 text-corpo"><span className="inline-flex items-center gap-1.5"><Star className={`w-4 h-4 ${f.destaque ? 'fill-cobre text-cobre' : ''}`} /><span><b>Página inicial</b><span className="block text-meta text-apoio">Mostra o material na home do site.</span></span></span><Chave ligado={f.destaque} aoTrocar={() => set('destaque', !f.destaque)} rotulo="Página inicial" /></label>
        {f.ativa && !f.arquivo_path && <p className="text-meta text-terracota">Atenção: no ar sem PDF, o lead se cadastra mas recebe só um aviso de que o arquivo chega depois.</p>}
      </div>

      {erro && <Aviso tipo="erro">{erro}</Aviso>}
      <Botao onClick={salvar} disabled={salvando || !!envio} className="w-full">{salvando ? 'Salvando' : 'Salvar landing page'}</Botao>
    </div>
  )
}

function Leads({ leads, landings, aoMudar }: { leads: Lead[] | null; landings: Landing[]; aoMudar: () => void }) {
  const [filtro, setFiltro] = useState('todos')
  const [busca, setBusca] = useState('')
  const [apagar, setApagar] = useState<string | null>(null)
  const nome = (id: string) => landings.find(l => l.id === id)?.titulo ?? '·'
  const lista = (leads ?? []).filter(l => (filtro === 'todos' || l.landing_id === filtro)
    && (!busca.trim() || `${l.nome} ${l.email} ${l.whatsapp ?? ''}`.toLowerCase().includes(busca.trim().toLowerCase())))

  function exportar() {
    const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`
    const linhas = [['Nome', 'E-mail', 'WhatsApp', 'Material', 'Primeiro cadastro', 'Último cadastro', 'Vezes', 'Origem (utm_source)', 'Campanha (utm_campaign)']]
      .concat(lista.map(l => [l.nome, l.email, l.whatsapp ?? '', nome(l.landing_id), dataBR(l.created_at), dataBR(l.updated_at), String(l.vezes), l.origem?.utm_source ?? '', l.origem?.utm_campaign ?? '']))
    const csv = '﻿' + linhas.map(r => r.map(esc).join(';')).join('\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
    a.download = `leads-${new Date().toISOString().slice(0, 10)}.csv`; a.click()
  }
  async function excluir(id: string) { await supabase.from('leads').delete().eq('id', id); setApagar(null); aoMudar() }

  const hoje = new Date(); const semana = new Date(hoje.getTime() - 7 * 864e5).toISOString()
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="cartao p-4"><p className="rotulo">Total</p><p className="numero">{leads?.length ?? 0}</p></div>
        <div className="cartao p-4"><p className="rotulo">Últimos 7 dias</p><p className="numero">{(leads ?? []).filter(l => l.created_at >= semana).length}</p></div>
        {landings.slice(0, 2).map(l => <div key={l.id} className="cartao p-4"><p className="rotulo truncate">{l.titulo}</p><p className="numero">{(leads ?? []).filter(x => x.landing_id === l.id).length}</p></div>)}
      </div>
      <div className="flex flex-wrap gap-3 items-center">
        <select value={filtro} onChange={e => setFiltro(e.target.value)} className="campo !w-auto">
          <option value="todos">Todos os materiais</option>
          {landings.map(l => <option key={l.id} value={l.id}>{l.titulo}</option>)}
        </select>
        <label className="relative flex-1 min-w-[200px]"><Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-apoio" />
          <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar por nome, e-mail ou WhatsApp" className="campo pl-9" /></label>
        <Botao variante="linha" onClick={exportar} disabled={!lista.length}><Download className="w-4 h-4" />Exportar planilha</Botao>
      </div>
      {leads === null ? <p className="text-apoio">Carregando</p> : lista.length === 0 ? <p className="text-corpo text-apoio">Nenhum lead {leads.length ? 'com esse filtro' : 'ainda. Divulgue o link de uma landing page para começar'}.</p> : (
        <div className="cartao overflow-x-auto">
          <table className="w-full text-corpo">
            <thead><tr className="text-left text-meta text-apoio border-b border-borda">
              <th className="px-4 py-3 font-normal">Nome</th><th className="px-4 py-3 font-normal">Contato</th><th className="px-4 py-3 font-normal">Material</th>
              <th className="px-4 py-3 font-normal">Data</th><th className="px-4 py-3 font-normal">Origem</th><th className="px-4 py-3" />
            </tr></thead>
            <tbody>
              {lista.map(l => (
                <tr key={l.id} className="border-b border-regra last:border-0 align-top">
                  <td className="px-4 py-3 font-medium">{l.nome}{l.vezes > 1 && <span className="block text-meta text-apoio font-normal">cadastrou {l.vezes} vezes</span>}</td>
                  <td className="px-4 py-3"><a href={`mailto:${l.email}`} className="text-cafe hover:underline">{l.email}</a>
                    {l.whatsapp && <a href={`https://wa.me/${l.whatsapp.replace(/\D/g, '').replace(/^(?!55)/, '55')}`} target="_blank" rel="noreferrer" className="block text-apoio hover:text-texto">{l.whatsapp}</a>}</td>
                  <td className="px-4 py-3">{nome(l.landing_id)}</td>
                  <td className="px-4 py-3 tabular-nums whitespace-nowrap">{dataBR(l.created_at)}</td>
                  <td className="px-4 py-3 text-apoio">{l.origem?.utm_source || (l.origem?.referrer ? new URL(l.origem.referrer).hostname : 'direto')}</td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    {apagar === l.id
                      ? <><button onClick={() => excluir(l.id)} className="text-terracota font-medium">Confirmar</button><button onClick={() => setApagar(null)} className="ml-3 text-apoio">Cancelar</button></>
                      : <button onClick={() => setApagar(l.id)} aria-label={`Excluir ${l.nome}`} className="text-apoio hover:text-terracota"><Trash2 className="w-4 h-4" /></button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="text-meta text-apoio">Excluir um lead apaga os dados da pessoa, como pede a LGPD quando ela solicita.</p>
    </div>
  )
}
