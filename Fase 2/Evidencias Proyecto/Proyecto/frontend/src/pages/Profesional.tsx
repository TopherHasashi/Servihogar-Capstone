import UserDashboard from "../components/user/UserDashboardModular"
import { useAuth } from "../lib/auth"
import { Navigate } from "react-router-dom"

export default function ProfesionalPage() {
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

  if (user.effective_role !== "profesional") {
    // Redirige según el rol efectivo si no es profesional
    if (user.effective_role === "verificador") return <Navigate to="/verificador" replace />
    return <Navigate to="/" replace />
  }

  const unifiedUser = {
    id: user.id,
    name: `${(user.first_name || "").trim()} ${(user.last_name || "").trim()}`.trim() || user.username,
    email: user.email,
    phone: user.profile?.phone || "",
    district: user.profile?.district || "",
    region: user.profile?.region || "",
    address: user.profile?.address || "",
    isProfessional: true,
    avatar: (user as any)?.avatar || ((user as any)?.profile?.avatar_url) || "",
    // Incluir dominio para acceder a id_comuna
    dominio: (user as any)?.dominio,
    // Incluir effective_role para determinar permisos
    effective_role: user.effective_role,
  }

  return <UserDashboard user={unifiedUser} onLogout={logout} />
}
