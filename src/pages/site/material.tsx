import { useEffect, useState, type FormEvent } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { ArrowRight, Check, Download, Lock } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { CONTATO } from '../../lib/site'

export type Landing = {
  id: string; slug: string; titulo: string; tipo: string; chamada: string | null; subtitulo: string | null; descricao: string | null
  beneficios: string[]; botao: string; obrigado: string; arquivo_path: string | null; capa_path: string | null
  ativa: boolean; destaque: boolean; ordem: number; created_at: string; updated_at: string
}

export const urlMaterial = (path: string | null) => (path ? supabase.storage.from('materiais').getPublicUrl(path).data.publicUrl : '')

/** Materiais no ar (para o site). Com `soDestaque`, só os marcados com estrela (página inicial). */
export function useMateriais(soDestaque = false) {
  const [lista, setLista] = useState<Landing[] | null>(null)
  useEffect(() => {
    let q = supabase.from('landing_pages').select('*').eq('ativa', true).order('ordem')
    if (soDestaque) q = q.eq('destaque', true)
    q.then(({ data }) => setLista((data as Landing[]) ?? []))
  }, [soDestaque])
  return lista
}

/** Capa do material: a imagem enviada no painel ou uma capa desenhada com a marca. */
export function Capa({ m, className = '', grande = false }: { m: Pick<Landing, 'titulo' | 'tipo' | 'capa_path'>; className?: string; grande?: boolean }) {
  if (m.capa_path) return <img src={urlMaterial(m.capa_path)} alt={`Capa: ${m.titulo}`} className={`object-cover aspect-[3/4] h-auto self-start rounded-xl shadow-lg ${className}`} />
  return (
    <div lang="pt-BR" className={`rounded-xl bg-cafe text-creme ${grande ? 'p-5' : 'p-2.5'} flex flex-col justify-between shadow-lg aspect-[3/4] h-auto self-start overflow-hidden break-words [hyphens:auto] ${className}`} role="img" aria-label={`Capa: ${m.titulo}`}>
      <img src="/marca-bartira.svg" alt="" className={`${grande ? 'w-9 p-1.5' : 'w-5 p-0.5'} bg-creme rounded-full`} />
      <div>
        <p className={`${grande ? 'text-[11px]' : 'text-[8px]'} tracking-[0.2em] uppercase text-areia`}>{m.tipo}</p>
        <p className={`font-display leading-[1.05] mt-1 ${grande ? 'text-[19px] sm:text-[24px]' : 'text-[12px]'}`}>{m.titulo}</p>
        {grande && <><span className="block w-8 h-px bg-areia/60 mt-3" /><p className="mt-2 text-[11px] text-areia/80">Dra. Bartira Rebouças</p></>}
      </div>
    </div>
  )
}

/** Cartão usado na página inicial e em Conteúdos. */
export function CartaoMaterial({ m }: { m: Landing }) {
  return (
    <Link to={`/material/${m.slug}`} className="group cartao p-5 sm:p-6 flex gap-5 items-center hover:border-controle transition-colors">
      <Capa m={m} className="w-24 sm:w-28 shrink-0" />
      <div className="min-w-0">
        <p className="text-[12px] tracking-[0.18em] uppercase text-cobre">{m.chamada || m.tipo}</p>
        <h3 className="font-display text-[26px] leading-tight mt-1">{m.titulo}</h3>
        {m.subtitulo && <p className="mt-2 text-[16px] text-apoio leading-relaxed">{m.subtitulo}</p>}
        <span className="mt-3 inline-flex items-center gap-2 text-[15px] text-cafe">{m.botao}<ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" /></span>
      </div>
    </Link>
  )
}

/** Landing page de captura: /material/:slug */
export function LandingMaterial() {
  const { slug } = useParams()
  const [busca] = useSearchParams()
  const [m, setM] = useState<Landing | null | undefined>(undefined)
  const [f, setF] = useState({ nome: '', email: '', whatsapp: '', ok: false })
  const [fase, setFase] = useState<'form' | 'enviando' | 'pronto'>('form')
  const [erro, setErro] = useState('')
  const [arquivo, setArquivo] = useState<string | null>(null)

  useEffect(() => {
    supabase.from('landing_pages').select('*').eq('slug', slug!).eq('ativa', true).maybeSingle().then(({ data }) => setM((data as Landing) ?? null))
  }, [slug])
  useEffect(() => {
    if (!m) return
    document.title = `${m.titulo} · Dra. Bartira Rebouças`
    document.querySelector('meta[name="description"]')?.setAttribute('content', m.subtitulo ?? m.titulo)
  }, [m])

  async function enviar(e: FormEvent) {
    e.preventDefault(); setErro('')
    if (!f.ok) return setErro('Para receber o material, marque que concorda com o uso dos seus dados.')
    setFase('enviando')
    const origem = Object.fromEntries(['utm_source', 'utm_medium', 'utm_campaign', 'utm_content'].map(k => [k, busca.get(k)]).filter(([, v]) => v))
    if (document.referrer) (origem as Record<string, string>).referrer = document.referrer
    const { data, error } = await supabase.rpc('capturar_lead', {
      p_slug: m!.slug, p_nome: f.nome, p_email: f.email, p_whatsapp: f.whatsapp, p_consentimento: f.ok, p_origem: origem,
    })
    if (error) { setFase('form'); return setErro(error.message.includes('inválido') ? 'Confira o seu e-mail.' : error.message.includes('nome') ? 'Informe seu nome.' : 'Não foi possível enviar agora. Tente de novo em instantes.') }
    setArquivo((data as { arquivo: string | null } | null)?.arquivo ?? null)
    setFase('pronto')
  }

  if (m === undefined) return <div className="max-w-6xl mx-auto px-5 py-24 text-apoio">Carregando</div>
  if (m === null) return (
    <div className="max-w-3xl mx-auto px-5 py-24 flex flex-col gap-4 items-start">
      <h1 className="font-display text-[44px] leading-tight">Este material não está disponível no momento.</h1>
      <Link to="/conteudos" className="inline-flex items-center gap-2 text-[16px] text-cafe hover:underline underline-offset-4">Ver outros conteúdos<ArrowRight className="w-4 h-4" /></Link>
    </div>
  )

  return (
    <>
      <section className="bg-tom/60 overflow-hidden">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 py-12 sm:py-20 grid lg:grid-cols-[1.15fr_1fr] gap-10 lg:gap-16 items-start">
          <div className="flex flex-col gap-8">
            <div className="flex gap-6 items-start">
              <Capa m={m} grande className="w-32 sm:w-48 shrink-0 rotate-[-3deg]" />
              <div className="pt-2">
                <p className="text-[12px] tracking-[0.22em] uppercase text-cobre">{m.chamada || m.tipo}</p>
                <h1 className="font-display text-[34px] sm:text-[60px] leading-[1.02] mt-3 break-words [hyphens:auto]" lang="pt-BR">{m.titulo}</h1>
              </div>
            </div>
            {m.subtitulo && <p className="text-[20px] sm:text-[22px] leading-snug">{m.subtitulo}</p>}
            {m.descricao && <p className="text-[17px] leading-relaxed text-apoio">{m.descricao}</p>}
            {m.beneficios.length > 0 && (
              <div>
                <p className="text-[12px] tracking-[0.22em] uppercase text-cobre">O que você vai encontrar</p>
                <ul className="mt-4 flex flex-col gap-3">
                  {m.beneficios.map(b => <li key={b} className="flex gap-3 text-[17px]"><span className="w-6 h-6 rounded-full bg-oliva/15 text-oliva grid place-items-center shrink-0 mt-0.5"><Check className="w-4 h-4" /></span>{b}</li>)}
                </ul>
              </div>
            )}
            <div className="flex items-center gap-4 pt-2">
              <img src="/dra-bartira-rosto.jpg" alt="" className="w-14 h-14 rounded-full object-cover" />
              <p className="text-[15px] leading-snug">Escrito pela <b>Dra. Bartira Rebouças</b><br /><span className="text-apoio">Endocrinologista · {CONTATO.crm}</span></p>
            </div>
          </div>

          <div id="receber" className="lg:sticky lg:top-24 rounded-2xl bg-folha border border-borda p-6 sm:p-8 shadow-sm">
            {fase === 'pronto' ? (
              <div className="flex flex-col gap-5">
                <span className="w-12 h-12 rounded-full bg-oliva text-creme grid place-items-center"><Check className="w-6 h-6" /></span>
                <h2 className="font-display text-[34px] leading-tight">Obrigada, {f.nome.trim().split(' ')[0]}!</h2>
                <p className="text-[17px] leading-relaxed text-apoio">{m.obrigado}</p>
                {arquivo
                  ? <a href={urlMaterial(arquivo)} target="_blank" rel="noreferrer" className="h-14 rounded-full bg-cafe text-creme inline-flex items-center justify-center gap-2 text-[17px] font-medium hover:bg-texto"><Download className="w-5 h-5" />Baixar {m.tipo.toLowerCase()}</a>
                  : <p className="text-[15px] rounded-lg bg-tom px-4 py-3">O arquivo será enviado para o seu e-mail assim que estiver pronto.</p>}
                <Link to="/programa" className="inline-flex items-center gap-2 text-[15px] text-cafe hover:underline underline-offset-4">Conheça o programa Longevidade<ArrowRight className="w-4 h-4" /></Link>
              </div>
            ) : (
              <form onSubmit={enviar} className="flex flex-col gap-4" noValidate>
                <h2 className="font-display text-[30px] leading-tight">Receba gratuitamente</h2>
                <p className="text-[15px] text-apoio -mt-2">Preencha e o material é liberado na hora.</p>
                <label className="flex flex-col gap-1.5 text-[15px] font-medium">Seu nome
                  <input required autoComplete="name" value={f.nome} onChange={e => setF({ ...f, nome: e.target.value })} className="campo !min-h-[52px] text-[16px]" />
                </label>
                <label className="flex flex-col gap-1.5 text-[15px] font-medium">Seu melhor e-mail
                  <input required type="email" autoComplete="email" inputMode="email" value={f.email} onChange={e => setF({ ...f, email: e.target.value })} className="campo !min-h-[52px] text-[16px]" />
                </label>
                <label className="flex flex-col gap-1.5 text-[15px] font-medium">WhatsApp <span className="font-normal text-apoio -mt-1 text-[13px]">opcional</span>
                  <input type="tel" autoComplete="tel" inputMode="tel" value={f.whatsapp} onChange={e => setF({ ...f, whatsapp: e.target.value })} placeholder="(84) 9 0000-0000" className="campo !min-h-[52px] text-[16px]" />
                </label>
                <label className="flex gap-3 items-start text-[14px] leading-snug text-apoio cursor-pointer">
                  <input type="checkbox" checked={f.ok} onChange={e => setF({ ...f, ok: e.target.checked })} className="mt-0.5 w-5 h-5 accent-cafe shrink-0" />
                  <span>Concordo em receber este material e conteúdos da Dra. Bartira Rebouças por e-mail. Posso cancelar quando quiser. Veja a <Link to="/privacidade" className="underline underline-offset-2">política de privacidade</Link>.</span>
                </label>
                {erro && <p className="text-[14px] text-terracota" role="alert">{erro}</p>}
                <button type="submit" disabled={fase === 'enviando'} className="h-14 rounded-full bg-cafe text-creme text-[17px] font-medium inline-flex items-center justify-center gap-2 hover:bg-texto disabled:opacity-50">
                  {fase === 'enviando' ? 'Enviando' : m.botao}{fase !== 'enviando' && <ArrowRight className="w-5 h-5" />}
                </button>
                <p className="flex items-center gap-2 text-[12px] text-apoio"><Lock className="w-3.5 h-3.5" />Seus dados ficam protegidos e não são compartilhados.</p>
              </form>
            )}
          </div>
        </div>
      </section>
    </>
  )
}
