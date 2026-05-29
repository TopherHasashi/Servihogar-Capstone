import AdminDashboardBI from "../components/admin/AdminDashboardBI"
import { useAuth } from "../lib/auth"
import { Navigate, useNavigate } from "react-router-dom"

export default function AdminPage() {
  const { user, loading, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

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

  if (user.effective_role !== "administrador") {
    if (user.effective_role === "profesional") return <Navigate to="/profesional" replace />
    if (user.effective_role === "verificador") return <Navigate to="/verificador" replace />
    return <Navigate to="/cliente" replace />
  }

  return <AdminDashboardBI onLogout={handleLogout} />
}
