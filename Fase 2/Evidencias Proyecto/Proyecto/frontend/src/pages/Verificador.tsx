import VerifierDashboard from "../components/admin/VerifierDashboard"
import { useAuth } from "../lib/auth"
import { Navigate } from "react-router-dom"

export default function VerificadorPage() {
  const { user, loading, logout } = useAuth()

  if (loading) {
    return (
      <div className="w-full px-4 py-10">
        <p className="text-gray-600">Cargando…</p>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (user.effective_role !== "verificador" && user.effective_role !== "administrador") {
    // Solo verificadores o administradores pueden acceder; el admin podría usar este panel
    if (user.effective_role === "profesional") return <Navigate to="/profesional" replace />
    return <Navigate to="/" replace />
  }

  return <VerifierDashboard onLogout={logout} />
}
