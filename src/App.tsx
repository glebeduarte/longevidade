import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './auth/AuthProvider'
import { LayoutApp, LayoutPainel, Protegido } from './layouts/layouts'
import { DefinirSenha, Entrar, Esqueci } from './pages/auth'
import { EmBreve, Inicio } from './pages/app/app'
import { Encontros, Equipe, Hoje, Pacientes } from './pages/painel/painel'
import { FichaPaciente } from './pages/painel/ficha'
import { ImprimirMapa } from './pages/painel/mapa'
import { Faixas } from './pages/painel/faixas'
import { Questionarios, Responder } from './pages/app/questionarios'
import Placeholder from './pages/Placeholder'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/entrar" replace />} />
          <Route path="/entrar" element={<Entrar />} />
          <Route path="/esqueci" element={<Esqueci />} />
          <Route path="/definir-senha" element={<DefinirSenha />} />

          <Route element={<Protegido papeis={['paciente']} />}>
            <Route path="/app" element={<LayoutApp />}>
              <Route index element={<Inicio />} />
              <Route path="questionarios" element={<Questionarios />} />
              <Route path="questionarios/:id" element={<Responder />} />
              <Route path="protocolo" element={<EmBreve titulo="Meu protocolo" texto="Disponível na próxima fase." />} />
              <Route path="checkin" element={<EmBreve titulo="Check-in" texto="Disponível em breve." />} />
              <Route path="evolucao" element={<EmBreve titulo="Minha evolução" texto="Disponível em breve." />} />
            </Route>
          </Route>

          <Route element={<Protegido papeis={['medica', 'equipe']} />}>
            <Route path="/painel" element={<LayoutPainel />}>
              <Route index element={<Hoje />} />
              <Route path="pacientes" element={<Pacientes />} />
              <Route path="pacientes/:id" element={<FichaPaciente />} />
              <Route path="equipe" element={<Equipe />} />
              <Route path="agenda" element={<Encontros />} />
              <Route path="faixas" element={<Faixas />} />
            </Route>
            <Route path="/painel/pacientes/:id/mapa/:mapaId" element={<ImprimirMapa />} />
          </Route>

          <Route path="*" element={<Placeholder rotulo="404" titulo="Página não encontrada" texto="Volte para o início." />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
