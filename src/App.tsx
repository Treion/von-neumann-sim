import { Routes, Route } from 'react-router'
import { SimulatorPage } from './pages/SimulatorPage'
import { LandingPage } from './pages/LandingPage'
import Login from "./pages/Login"
import NotFound from "./pages/NotFound"

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/simulator" element={<SimulatorPage />} />
      <Route path="/login" element={<Login />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
