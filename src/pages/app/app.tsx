import { useAuth } from '../../auth/AuthProvider'
import { Aviso, Titulo } from '../../components/ui'

export function Inicio() {
  const { profile, signOut } = useAuth()
  return (
    <div className="px-6 pt-6 flex flex-col gap-8">
      <Titulo rotulo={new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}>
        Bom dia, {profile?.full_name?.split(' ')[0] ?? ''}
      </Titulo>
      <Aviso>Seu protocolo, vídeos e check-ins aparecem aqui assim que a Dra. Bartira publicar.</Aviso>
      <button onClick={signOut} className="text-sm text-apoio underline underline-offset-4 self-start">Sair</button>
    </div>
  )
}

export function EmBreve({ titulo, texto }: { titulo: string; texto: string }) {
  return (
    <div className="px-6 pt-6 flex flex-col gap-6">
      <Titulo>{titulo}</Titulo>
      <Aviso>{texto}</Aviso>
    </div>
  )
}
