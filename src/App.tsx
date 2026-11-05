import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './auth/AuthProvider'
import { LayoutApp, LayoutPainel, Protegido } from './layouts/layouts'
import { DefinirSenha, Entrar, Esqueci } from './pages/auth'
import { Evolucao, Inicio, MeuProtocolo } from './pages/app/app'
import { CheckinPaciente } from './pages/app/checkin'
import { Equipe, Hoje, Pacientes } from './pages/painel/painel'
import { Agenda, FilaCheckins, VerComo, Videos } from './pages/painel/rotina'
import { FichaPaciente } from './pages/painel/ficha'
import { ImprimirMapa } from './pages/painel/mapa'
import { Faixas } from './pages/painel/faixas'
import { Questionarios, Responder } from './pages/app/questionarios'
import Placeholder from './pages/Placeholder'
import { SiteGestao } from './pages/painel/site'
import { LandingMaterial } from './pages/site/material'
import { LayoutSite, SiteContato, SiteConteudos, SiteInicio, SitePrivacidade, SitePrograma, SiteSobre, SiteTema, SiteTemas } from './pages/site/site'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<LayoutSite />}>
            <Route path="/" element={<SiteInicio />} />
            <Route path="/sobre" element={<SiteSobre />} />
            <Route path="/programa" element={<SitePrograma />} />
            <Route path="/temas" element={<SiteTemas />} />
            <Route path="/temas/:slug" element={<SiteTema />} />
            <Route path="/conteudos" element={<SiteConteudos />} />
            <Route path="/contato" element={<SiteContato />} />
            <Route path="/privacidade" element={<SitePrivacidade />} />
            <Route path="/material/:slug" element={<LandingMaterial />} />
          </Route>
          <Route path="/entrar" element={<Entrar />} />
          <Route path="/esqueci" element={<Esqueci />} />
          <Route path="/definir-senha" element={<DefinirSenha />} />

          <Route element={<Protegido papeis={['paciente']} />}>
            <Route path="/app" element={<LayoutApp />}>
              <Route index element={<Inicio />} />
              <Route path="questionarios" element={<Questionarios />} />
              <Route path="questionarios/:id" element={<Responder />} />
              <Route path="protocolo" element={<MeuProtocolo />} />
              <Route path="checkin" element={<CheckinPaciente />} />
              <Route path="evolucao" element={<Evolucao />} />
            </Route>
          </Route>

          <Route element={<Protegido papeis={['medica', 'equipe']} />}>
            <Route path="/painel" element={<LayoutPainel />}>
              <Route index element={<Hoje />} />
              <Route path="pacientes" element={<Pacientes />} />
              <Route path="pacientes/:id" element={<FichaPaciente />} />
              <Route path="equipe" element={<Equipe />} />
              <Route path="agenda" element={<Agenda />} />
              <Route path="checkins" element={<FilaCheckins />} />
              <Route path="videos" element={<Videos />} />
              <Route path="ver-como" element={<VerComo />} />
              <Route path="faixas" element={<Faixas />} />
              <Route path="site" element={<SiteGestao />} />
            </Route>
            <Route path="/painel/pacientes/:id/mapa/:mapaId" element={<ImprimirMapa />} />
          </Route>

          <Route path="*" element={<Placeholder rotulo="404" titulo="Página não encontrada" texto="Volte para o início." />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
