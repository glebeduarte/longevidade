import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Placeholder from './pages/Placeholder'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Placeholder rotulo="Longevidade" titulo="Dra. Bartira Rebouças" texto="Seu corpo mudou, te ajudo a entender e cuidar dele." />} />
        <Route path="/app/*" element={<Placeholder rotulo="Área da paciente" titulo="Em construção" texto="Aqui ficarão seu protocolo, vídeos, check-in e evolução." />} />
        <Route path="/painel/*" element={<Placeholder rotulo="Painel" titulo="Em construção" texto="Área da médica e da equipe." />} />
        <Route path="*" element={<Placeholder rotulo="404" titulo="Página não encontrada" texto="Volte para o início." />} />
      </Routes>
    </BrowserRouter>
  )
}
