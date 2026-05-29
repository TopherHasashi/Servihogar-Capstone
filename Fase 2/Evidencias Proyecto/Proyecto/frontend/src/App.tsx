import { useEffect, useState } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { apiGet } from './lib/api'
import { useAuth } from './lib/auth'
import Hero from './components/Hero.tsx'
import Services from './components/Services'
import Benefits from './components/Benefits'
import Contact from './components/Contact'
import './App.css'

function App() {
  // const [count, setCount] = useState(0)
  const [apiStatus, setApiStatus] = useState<string>('...')
  const navigate = useNavigate()
  const { user, loading } = useAuth()

  useEffect(() => {
    apiGet('/api/ping')
      .then((data) => setApiStatus(data?.status ?? 'unknown'))
      .catch((e) => setApiStatus(`error: ${e.message}`))
  }, [])

  // Si el usuario está autenticado, redirigir a su panel según el rol
  if (!loading && user) {
    const role = user.effective_role
    if (role === 'administrador') return <Navigate to="/admin" replace />
    if (role === 'verificador') return <Navigate to="/verificador" replace />
    if (role === 'profesional') return <Navigate to="/profesional" replace />
    return <Navigate to="/cliente" replace />
  }

  if (loading) {
    return (
      <div className="w-full px-4 py-10">
        <p className="text-gray-600">Cargando…</p>
      </div>
    )
  }

  return (
    <div>
      <Hero onAllServicesClick={() => navigate('/servicios')} onUserClick={() => navigate('/servicios')} />
      <Services onServiceClick={() => navigate('/servicios')} />
      <Benefits onUserClick={() => navigate('/servicios')} />
      <Contact />
      <div className="w-full px-4"><div className="py-6 text-sm text-gray-600">API status: {apiStatus}</div></div>
    </div>
  )
}

export default App
