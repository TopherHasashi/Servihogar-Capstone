import { Navigate } from 'react-router-dom'
import UserAuth from '../components/user/UserAuth'
import { useAuth } from '../lib/auth'

export default function LoginPage() {
  const { user, loading } = useAuth()

  // Si ya hay sesión activa, salir inmediatamente de /login hacia el panel correspondiente
  if (!loading && user) {
    const role = user.effective_role
    if (role === 'administrador') return <Navigate to="/admin" replace />
    if (role === 'verificador') return <Navigate to="/verificador" replace />
    if (role === 'profesional') return <Navigate to="/profesional" replace />
    return <Navigate to="/cliente" replace />
  }

  const handleLogin = (user: any) => {
    // La navegación post-login la gestiona el propio componente UserAuth
    // (redirige según rol a /admin, /verificador, /profesional o /cliente).
    // Aquí no navegamos para no interrumpir el flujo (evita quedarse en /login).
    console.log('Usuario logueado:', user)
  }

  return (
    <UserAuth onLogin={handleLogin} />
  )
}
