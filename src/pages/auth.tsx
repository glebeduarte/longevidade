import { useState, type FormEvent, type ReactNode } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../auth/AuthProvider'
import { Aviso, Botao, Campo, Marca, Titulo } from '../components/ui'

function Moldura({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-screen flex flex-col px-6 py-10">
      <Marca />
      <div className="flex-1 flex items-center">
        <div className="w-full max-w-sm mx-auto flex flex-col gap-8 py-10">{children}</div>
      </div>
    </main>
  )
}

export function destino(role?: string) {
  return role === 'paciente' ? '/app' : '/painel'
}

export function Entrar() {
  const { session, profile } = useAuth()
  const nav = useNavigate()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(false)

  if (session && profile) return <Navigate to={destino(profile.role)} replace />

  async function enviar(e: FormEvent) {
    e.preventDefault()
    setErro(''); setCarregando(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password: senha })
    setCarregando(false)
    if (error) setErro('E-mail ou senha não conferem. Confira e tente de novo.')
    else nav('/', { replace: true })
  }

  return (
    <Moldura>
      <Titulo rotulo="Área da paciente e da equipe">Entrar</Titulo>
      <form onSubmit={enviar} className="flex flex-col gap-6">
        <Campo id="email" label="E-mail" type="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)} />
        <Campo id="senha" label="Senha" type="password" autoComplete="current-password" required value={senha} onChange={e => setSenha(e.target.value)} />
        {erro && <Aviso tipo="erro">{erro}</Aviso>}
        <Botao type="submit" disabled={carregando}>{carregando ? 'Entrando' : 'Entrar'}</Botao>
      </form>
      <Link to="/esqueci" className="text-sm text-apoio underline underline-offset-4">Esqueci minha senha</Link>
      <Aviso>O acesso é criado pela equipe da Dra. Bartira. Você recebe o convite por e-mail.</Aviso>
    </Moldura>
  )
}

export function Esqueci() {
  const [email, setEmail] = useState('')
  const [enviado, setEnviado] = useState(false)
  const [erro, setErro] = useState('')

  async function enviar(e: FormEvent) {
    e.preventDefault()
    setErro('')
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${location.origin}/definir-senha` })
    if (error) setErro('Não foi possível enviar agora. Tente de novo em alguns minutos.')
    else setEnviado(true)
  }

  return (
    <Moldura>
      <Titulo rotulo="Acesso">Esqueci minha senha</Titulo>
      {enviado ? (
        <Aviso>Se este e-mail tiver cadastro, você vai receber um link para criar uma nova senha.</Aviso>
      ) : (
        <form onSubmit={enviar} className="flex flex-col gap-6">
          <Campo id="email" label="E-mail" type="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)} />
          {erro && <Aviso tipo="erro">{erro}</Aviso>}
          <Botao type="submit">Enviar link</Botao>
        </form>
      )}
      <Link to="/entrar" className="text-sm text-apoio underline underline-offset-4">Voltar para entrar</Link>
    </Moldura>
  )
}

export function DefinirSenha() {
  const { session, profile, refresh } = useAuth()
  const nav = useNavigate()
  const [senha, setSenha] = useState('')
  const [conf, setConf] = useState('')
  const [erro, setErro] = useState('')

  async function enviar(e: FormEvent) {
    e.preventDefault()
    if (senha.length < 8) return setErro('A senha precisa ter pelo menos 8 caracteres.')
    if (senha !== conf) return setErro('As duas senhas não são iguais.')
    const { error } = await supabase.auth.updateUser({ password: senha })
    if (error) return setErro('Não foi possível salvar a senha. Peça um novo link.')
    await refresh()
    nav(destino(profile?.role), { replace: true })
  }

  if (!session) {
    return (
      <Moldura>
        <Titulo rotulo="Acesso">Link expirado</Titulo>
        <Aviso>Este link não vale mais. Peça um novo para criar sua senha.</Aviso>
        <Link to="/esqueci" className="text-sm underline underline-offset-4">Pedir novo link</Link>
      </Moldura>
    )
  }

  return (
    <Moldura>
      <Titulo rotulo="Acesso">Crie sua senha</Titulo>
      <form onSubmit={enviar} className="flex flex-col gap-6">
        <Campo id="senha" label="Nova senha" type="password" autoComplete="new-password" required value={senha} onChange={e => setSenha(e.target.value)} />
        <Campo id="conf" label="Repita a senha" type="password" autoComplete="new-password" required value={conf} onChange={e => setConf(e.target.value)} />
        {erro && <Aviso tipo="erro">{erro}</Aviso>}
        <Botao type="submit">Salvar senha</Botao>
      </form>
    </Moldura>
  )
}

export function Consentimento() {
  const { session, refresh } = useAuth()
  const [termo, setTermo] = useState<{ id: string; version: string; body: string } | null>(null)
  const [aceito, setAceito] = useState(false)
  const [erro, setErro] = useState('')
  const [carregou, setCarregou] = useState(false)

  if (!carregou) {
    setCarregou(true)
    supabase.from('consent_terms').select('id, version, body').not('published_at', 'is', null)
      .order('published_at', { ascending: false }).limit(1).maybeSingle()
      .then(({ data }) => setTermo(data))
  }

  async function confirmar() {
    if (!termo || !session) return
    const { error } = await supabase.from('consents').insert({ user_id: session.user.id, term_id: termo.id, user_agent: navigator.userAgent })
    if (error) return setErro('Não foi possível registrar o aceite. Tente de novo.')
    await refresh()
  }

  return (
    <main className="min-h-screen px-6 py-10">
      <div className="max-w-xl mx-auto flex flex-col gap-8">
        <Marca />
        <Titulo rotulo={termo ? `Versão ${termo.version}` : 'Termo'}>Antes de começar</Titulo>
        <div className="whitespace-pre-line leading-relaxed text-[15px] max-h-[55vh] overflow-y-auto border-y border-areia py-6">
          {termo?.body ?? 'Carregando o termo.'}
        </div>
        <label className="flex gap-3 items-start text-sm">
          <input type="checkbox" className="mt-1 w-5 h-5 accent-cafe" checked={aceito} onChange={e => setAceito(e.target.checked)} />
          Li e aceito o termo de consentimento para tratamento dos meus dados.
        </label>
        {erro && <Aviso tipo="erro">{erro}</Aviso>}
        <Botao disabled={!aceito || !termo} onClick={confirmar}>Continuar</Botao>
      </div>
    </main>
  )
}
