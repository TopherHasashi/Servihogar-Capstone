import { useState, useEffect } from "react"
import { toast } from "sonner"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs"
import { Button } from "../ui/button"
import { Alert, AlertDescription } from "../ui/alert"
import { Badge } from "../ui/badge"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog"
import { apiGetAuth, apiPutAuth } from "../../lib/api"
import { 
  Users, 
  CheckCircle, 
  AlertCircle,
  Star,
  BarChart3,
  LogOut,
  Loader2,
  TrendingUp,
  TrendingDown,
  Clock,
  UserCheck,
  ShieldAlert,
  ClipboardList,
  Activity,
  UserPlus,
  Wrench,
  FileWarning,
  Award,
  XCircle,
  Timer,
  CalendarDays,
  Phone,
  IdCard,
} from "lucide-react"

interface AdminDashboardBIProps {
  onLogout: () => void
}

interface DashboardData {
  kpis?: {
    totalRevenue: number
    monthlyGrowth: number
    activeUsers: number
    userGrowth: number
    activeProfessionals: number
    professionalGrowth: number
    avgRating: number
    ratingChange: number
    completionRate: number
    avgResponseTime: number
  }
  professionalMetrics?: {
    total: number
    active: number
    topPerformers: number
    avgServicesPerMonth: number
  }
  serviceDistribution?: Array<{
    name: string
    value: number
    revenue: number
    avgPrice: number
  }>
  metadata?: {
    periodStart: string
    periodEnd: string
    totalReviews: number
  }
  stats?: {
    completedServices?: number
    cancelledServices?: number
    pendingServices?: number
    confirmedServices?: number
    inProgressServices?: number
    newRequestsThisMonth?: number
    totalUsersAllTime?: number
    newUsersThisMonth?: number
    pendingDocVerifications?: number
    pendingServiceVerifications?: number
    avgRatingQuality?: number
    avgRatingPunctuality?: number
    avgRatingCommunication?: number
  }
  requestsTrend?: Array<{ date: string; count: number }>
  topProfessionals?: Array<{ name: string; reviews: number; rating: number }>
}

interface User {
  rut: string
  digito_verificador?: string
  rut_formateado?: string
  nombres?: string
  apellidos?: string
  nombre_completo?: string
  email?: string
  rol?: string
  activo: boolean
  telefono?: string
  fecha_registro?: string
  ultima_actividad?: string
  solicitudes_como_cliente?: number
  solicitudes_como_profesional?: number
  servicios_activos?: string[]
}

const getUserDisplayName = (user: User) => {
  return user.nombre_completo || `${user.nombres || 'Usuario'} ${user.apellidos || ''}`.trim() || 'Usuario'
}

const getRoleLabel = (rol?: string) => {
  if (rol === 'profesional') return 'Trabajador'
  if (rol === 'cliente') return 'Cliente'
  return rol ? rol.charAt(0).toUpperCase() + rol.slice(1) : 'N/A'
}

export default function AdminDashboardBI({ onLogout }: AdminDashboardBIProps) {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [usersError, setUsersError] = useState<string | null>(null)
  const [disablingUser, setDisablingUser] = useState<string | null>(null)
  const [userPendingConfirm, setUserPendingConfirm] = useState<User | null>(null)

  // Cargar datos del dashboard
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true)
        const data = await apiGetAuth('/api/admin/dashboard/summary/')
        setDashboardData(data)
        setError(null)
      } catch (err: any) {
        console.error('Error cargando datos del dashboard:', err)
        setError(err.message || 'Error cargando datos del dashboard')
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  // Cargar usuarios para el Centro de Operaciones
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoadingUsers(true)
        const data = await apiGetAuth('/api/admin/operations/users/')
        setUsers(Array.isArray(data.users) ? data.users : [])
        setUsersError(null)
      } catch (err: any) {
        console.error('Error cargando usuarios:', err)
        setUsers([])
        setUsersError(err.message || 'Error cargando usuarios')
      } finally {
        setLoadingUsers(false)
      }
    }

    fetchUsers()
  }, [])

  // Datos para usar en el componente
  const kpis = dashboardData?.kpis
  const stats = dashboardData?.stats || {}
  const profMetrics = dashboardData?.professionalMetrics
  const serviceDist = dashboardData?.serviceDistribution || []
  const trend = dashboardData?.requestsTrend || []
  const topProfs = dashboardData?.topProfessionals || []
  const meta = dashboardData?.metadata

  // Helper: badge de crecimiento
  const GrowthBadge = ({ value }: { value: number }) => {
    if (value === 0) return <span className="text-xs text-gray-400">Sin cambio</span>
    return value > 0
      ? <span className="flex items-center gap-1 text-xs text-green-600"><TrendingUp className="w-3 h-3" />+{value}%</span>
      : <span className="flex items-center gap-1 text-xs text-red-500"><TrendingDown className="w-3 h-3" />{value}%</span>
  }

  // Helper: mini barra de porcentaje
  const ProgressBar = ({ value, max, color = "bg-blue-500" }: { value: number; max: number; color?: string }) => {
    const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0
    return (
      <div className="w-full bg-gray-100 rounded-full h-2 mt-2">
        <div className={`${color} h-2 rounded-full transition-all`} style={{ width: `${pct}%` }} />
      </div>
    )
  }

  const totalRequests = (stats.completedServices || 0) + (stats.cancelledServices || 0) +
    (stats.pendingServices || 0) + (stats.confirmedServices || 0) + (stats.inProgressServices || 0)

  const trendMax = trend.length > 0 ? Math.max(...trend.map(t => t.count)) : 1

  // Manejar deshabilitar/habilitar usuario
  const handleToggleUserDisable = async (user: User) => {
    try {
      setDisablingUser(user.rut)
      const nuevoEstado = !user.activo

      // Optimistic update
      setUsers((prev) =>
        prev.map((u) => (u.rut === user.rut ? { ...u, activo: nuevoEstado } : u))
      )

      // Enviar al backend
      const result = await apiPutAuth(`/api/admin/operations/users/${user.rut}/toggle-status/`, { 
        activo: nuevoEstado 
      })

      if (nuevoEstado) {
        toast.success('Usuario habilitado')
      } else {
        const cancelledCount = result?.cancelled_requests ?? 0
        toast.success(
          cancelledCount > 0
            ? `Usuario deshabilitado. Se cancelaron ${cancelledCount} solicitud(es) pendiente(s)/confirmada(s) y se notificó a los usuarios involucrados.`
            : 'Usuario deshabilitado'
        )
      }
    } catch (err: any) {
      console.error('Error actualizando usuario:', err)
      toast.error('Error actualizando usuario: ' + err.message)
      // Revert optimistic update
      setUsers((prev) =>
        prev.map((u) => (u.rut === user.rut ? { ...u, activo: user.activo } : u))
      )
    } finally {
      setDisablingUser(null)
    }
  }

  // Solicita confirmación antes de deshabilitar; habilitar no requiere confirmación
  const handleRequestToggleUserDisable = (user: User) => {
    if (user.activo) {
      setUserPendingConfirm(user)
    } else {
      handleToggleUserDisable(user)
    }
  }

  const confirmDisableUser = () => {
    if (userPendingConfirm) {
      handleToggleUserDisable(userPendingConfirm)
      setUserPendingConfirm(null)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-40">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <BarChart3 className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="font-bold text-xl">Panel de Administración</h1>
                <p className="text-sm text-gray-500">Business Intelligence Dashboard</p>
              </div>
            </div>
            <Button onClick={onLogout} variant="outline">
              <LogOut className="w-4 h-4 mr-2" />
              Cerrar Sesión
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <Loader2 className="w-12 h-12 animate-spin mx-auto text-blue-600 mb-4" />
              <p className="text-gray-600">Cargando datos del dashboard...</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <Alert className="border-red-200 bg-red-50 mb-6">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {/* Dashboard Content */}
        {!loading && !error && (
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="overview">Resumen de Estadísticas</TabsTrigger>
              <TabsTrigger value="operations">Centro de Operaciones</TabsTrigger>
            </TabsList>

            {/* TAB: RESUMEN DE ESTADÍSTICAS */}
            <TabsContent value="overview" className="space-y-6">

              {/* Periodo activo */}
              {meta && (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <CalendarDays className="w-4 h-4" />
                  <span>Métricas del periodo: <strong>{new Date(meta.periodStart).toLocaleDateString('es-CL')}</strong> — <strong>{new Date(meta.periodEnd).toLocaleDateString('es-CL')}</strong></span>
                  <Badge variant="outline" className="ml-2">{meta.totalReviews} reseñas en el periodo</Badge>
                </div>
              )}

              {/* ── SECCIÓN 1: KPIs PRINCIPALES (30 días) ── */}
              <div>
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">KPIs — últimos 30 días</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-medium text-gray-600">Usuarios Activos</CardTitle>
                        <Users className="w-4 h-4 text-blue-600" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{(kpis?.activeUsers ?? 0).toLocaleString('es-CL')}</div>
                      <div className="mt-1"><GrowthBadge value={kpis?.userGrowth ?? 0} /></div>
                      <p className="text-xs text-gray-400 mt-1">vs. 30 días anteriores</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-medium text-gray-600">Profesionales Activos</CardTitle>
                        <UserCheck className="w-4 h-4 text-indigo-600" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{(kpis?.activeProfessionals ?? 0).toLocaleString('es-CL')}</div>
                      <div className="mt-1"><GrowthBadge value={kpis?.professionalGrowth ?? 0} /></div>
                      <p className="text-xs text-gray-400 mt-1">vs. 30 días anteriores</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-medium text-gray-600">Calificación Promedio</CardTitle>
                        <Star className="w-4 h-4 text-yellow-500" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{(kpis?.avgRating ?? 0).toFixed(1)} <span className="text-base">⭐</span></div>
                      <div className="mt-1">
                        {(kpis?.ratingChange ?? 0) !== 0
                          ? <GrowthBadge value={kpis?.ratingChange ?? 0} />
                          : <span className="text-xs text-gray-400">Sin cambio</span>}
                      </div>
                      <p className="text-xs text-gray-400 mt-1">Basado en {meta?.totalReviews ?? 0} reseñas</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-medium text-gray-600">Tasa de Completación</CardTitle>
                        <Activity className="w-4 h-4 text-green-600" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{kpis?.completionRate ?? 0}%</div>
                      <ProgressBar value={kpis?.completionRate ?? 0} max={100} color="bg-green-500" />
                      <p className="text-xs text-gray-400 mt-1">Solicitudes completadas / totales</p>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* ── SECCIÓN 2: ESTADO DE SOLICITUDES (histórico) ── */}
              <div>
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Estado de Solicitudes — Histórico</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                  <Card className="border-green-200 bg-green-50">
                    <CardHeader className="pb-1">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <CardTitle className="text-xs font-medium text-green-700">Completadas</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-green-700">{(stats.completedServices ?? 0).toLocaleString('es-CL')}</div>
                      <ProgressBar value={stats.completedServices ?? 0} max={totalRequests} color="bg-green-500" />
                    </CardContent>
                  </Card>

                  <Card className="border-yellow-200 bg-yellow-50">
                    <CardHeader className="pb-1">
                      <div className="flex items-center gap-2">
                        <ClipboardList className="w-4 h-4 text-yellow-600" />
                        <CardTitle className="text-xs font-medium text-yellow-700">Pendientes</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-yellow-700">{(stats.pendingServices ?? 0).toLocaleString('es-CL')}</div>
                      <ProgressBar value={stats.pendingServices ?? 0} max={totalRequests} color="bg-yellow-400" />
                    </CardContent>
                  </Card>

                  <Card className="border-blue-200 bg-blue-50">
                    <CardHeader className="pb-1">
                      <div className="flex items-center gap-2">
                        <UserCheck className="w-4 h-4 text-blue-600" />
                        <CardTitle className="text-xs font-medium text-blue-700">Confirmadas</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-blue-700">{(stats.confirmedServices ?? 0).toLocaleString('es-CL')}</div>
                      <ProgressBar value={stats.confirmedServices ?? 0} max={totalRequests} color="bg-blue-500" />
                    </CardContent>
                  </Card>

                  <Card className="border-purple-200 bg-purple-50">
                    <CardHeader className="pb-1">
                      <div className="flex items-center gap-2">
                        <Wrench className="w-4 h-4 text-purple-600" />
                        <CardTitle className="text-xs font-medium text-purple-700">En Progreso</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-purple-700">{(stats.inProgressServices ?? 0).toLocaleString('es-CL')}</div>
                      <ProgressBar value={stats.inProgressServices ?? 0} max={totalRequests} color="bg-purple-500" />
                    </CardContent>
                  </Card>

                  <Card className="border-red-200 bg-red-50">
                    <CardHeader className="pb-1">
                      <div className="flex items-center gap-2">
                        <XCircle className="w-4 h-4 text-red-600" />
                        <CardTitle className="text-xs font-medium text-red-700">Canceladas</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-red-700">{(stats.cancelledServices ?? 0).toLocaleString('es-CL')}</div>
                      <ProgressBar value={stats.cancelledServices ?? 0} max={totalRequests} color="bg-red-400" />
                    </CardContent>
                  </Card>
                </div>
                {totalRequests > 0 && (
                  <p className="text-xs text-gray-400 mt-2 text-right">Total histórico: {totalRequests.toLocaleString('es-CL')} solicitudes</p>
                )}
              </div>

              {/* ── SECCIÓN 3: USUARIOS & PROFESIONALES ── */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Usuarios */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Users className="w-4 h-4 text-blue-600" /> Usuarios
                    </CardTitle>
                    <CardDescription>Registros e incorporaciones</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center py-2 border-b">
                      <span className="text-sm text-gray-600">Total registrados</span>
                      <span className="font-bold text-lg">{(stats.totalUsersAllTime ?? 0).toLocaleString('es-CL')}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b">
                      <span className="text-sm text-gray-600">Nuevos este mes</span>
                      <span className="flex items-center gap-2 font-semibold text-green-600">
                        <UserPlus className="w-4 h-4" />
                        +{(stats.newUsersThisMonth ?? 0).toLocaleString('es-CL')}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b">
                      <span className="text-sm text-gray-600">Activos (30 días)</span>
                      <span className="font-bold">{(kpis?.activeUsers ?? 0).toLocaleString('es-CL')}</span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-sm text-gray-600">Solicitudes nuevas este mes</span>
                      <span className="font-bold">{(stats.newRequestsThisMonth ?? 0).toLocaleString('es-CL')}</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Profesionales */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <UserCheck className="w-4 h-4 text-indigo-600" /> Profesionales
                    </CardTitle>
                    <CardDescription>Desempeño y verificación</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center py-2 border-b">
                      <span className="text-sm text-gray-600">Total profesionales</span>
                      <span className="font-bold text-lg">{(profMetrics?.total ?? 0).toLocaleString('es-CL')}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b">
                      <span className="text-sm text-gray-600">Top performers (≥4.8★)</span>
                      <span className="flex items-center gap-2 font-semibold text-yellow-600">
                        <Award className="w-4 h-4" />
                        {(profMetrics?.topPerformers ?? 0).toLocaleString('es-CL')}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b">
                      <span className="text-sm text-gray-600">Prom. servicios / profesional / mes</span>
                      <span className="font-bold">{profMetrics?.avgServicesPerMonth ?? 0}</span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-sm text-gray-600 flex items-center gap-1">
                        <Timer className="w-3.5 h-3.5" /> Tiempo prom. de respuesta
                      </span>
                      <span className="font-bold">{kpis?.avgResponseTime ?? 0}h</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* ── SECCIÓN 4: VERIFICACIONES PENDIENTES + CALIFICACIONES ── */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Verificaciones */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <ShieldAlert className="w-4 h-4 text-orange-500" /> Verificaciones Pendientes
                    </CardTitle>
                    <CardDescription>Ítems que requieren revisión</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-orange-50 border border-orange-200">
                      <div className="flex items-center gap-3">
                        <FileWarning className="w-5 h-5 text-orange-500" />
                        <div>
                          <p className="text-sm font-medium">Documentos pendientes</p>
                          <p className="text-xs text-gray-500">Documentos de profesionales sin revisar</p>
                        </div>
                      </div>
                      <Badge variant={stats.pendingDocVerifications ? "destructive" : "secondary"} className="text-base px-3 py-1">
                        {stats.pendingDocVerifications ?? 0}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-yellow-50 border border-yellow-200">
                      <div className="flex items-center gap-3">
                        <ClipboardList className="w-5 h-5 text-yellow-600" />
                        <div>
                          <p className="text-sm font-medium">Servicios pendientes</p>
                          <p className="text-xs text-gray-500">Servicios esperando aprobación</p>
                        </div>
                      </div>
                      <Badge variant={stats.pendingServiceVerifications ? "destructive" : "secondary"} className="text-base px-3 py-1">
                        {stats.pendingServiceVerifications ?? 0}
                      </Badge>
                    </div>
                    <div className="pt-2 text-xs text-gray-400 text-right">
                      Total pendiente: {((stats.pendingDocVerifications ?? 0) + (stats.pendingServiceVerifications ?? 0))} ítem(s)
                    </div>
                  </CardContent>
                </Card>

                {/* Dimensiones de calificación */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Star className="w-4 h-4 text-yellow-500" /> Calificaciones por Dimensión
                    </CardTitle>
                    <CardDescription>Promedio histórico de todas las reseñas</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {[
                      { label: "Calidad del trabajo", value: stats.avgRatingQuality ?? 0, color: "bg-yellow-400" },
                      { label: "Puntualidad", value: stats.avgRatingPunctuality ?? 0, color: "bg-blue-400" },
                      { label: "Comunicación", value: stats.avgRatingCommunication ?? 0, color: "bg-purple-400" },
                    ].map(({ label, value, color }) => (
                      <div key={label}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-600">{label}</span>
                          <span className="font-semibold">{value.toFixed(2)} ⭐</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2">
                          <div className={`${color} h-2 rounded-full transition-all`} style={{ width: `${(value / 5) * 100}%` }} />
                        </div>
                      </div>
                    ))}
                    <p className="text-xs text-gray-400 pt-1">Escala 1–5 estrellas</p>
                  </CardContent>
                </Card>
              </div>

              {/* ── SECCIÓN 5: TENDENCIA (últimos 7 días) + TOP PROFESIONALES ── */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Tendencia de solicitudes */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <BarChart3 className="w-4 h-4 text-blue-600" /> Solicitudes — Últimos 7 días
                    </CardTitle>
                    <CardDescription>Volumen diario de solicitudes creadas</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {trend.length === 0 ? (
                      <p className="text-sm text-gray-400 text-center py-4">Sin datos de tendencia</p>
                    ) : (
                      <div className="space-y-2">
                        {trend.map((d) => (
                          <div key={d.date} className="flex items-center gap-3">
                            <span className="text-xs text-gray-500 w-20 shrink-0">
                              {new Date(d.date + 'T12:00:00').toLocaleDateString('es-CL', { weekday: 'short', day: '2-digit', month: '2-digit' })}
                            </span>
                            <div className="flex-1 bg-gray-100 rounded-full h-5 relative">
                              <div
                                className="bg-blue-500 h-5 rounded-full flex items-center justify-end pr-2 transition-all"
                                style={{ width: `${Math.max(8, (d.count / trendMax) * 100)}%` }}
                              >
                                <span className="text-white text-xs font-semibold">{d.count}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Top profesionales */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Award className="w-4 h-4 text-yellow-500" /> Top 5 Profesionales
                    </CardTitle>
                    <CardDescription>Mejor calificados por promedio general</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {topProfs.length === 0 ? (
                      <p className="text-sm text-gray-400 text-center py-4">Sin datos de profesionales</p>
                    ) : (
                      <div className="space-y-3">
                        {topProfs.map((p, i) => (
                          <div key={p.name} className="flex items-center gap-3">
                            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${i === 0 ? 'bg-yellow-400 text-white' : i === 1 ? 'bg-gray-300 text-gray-700' : i === 2 ? 'bg-amber-600 text-white' : 'bg-gray-100 text-gray-500'}`}>
                              {i + 1}
                            </span>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{p.name}</p>
                              <p className="text-xs text-gray-400">{p.reviews} reseña{p.reviews !== 1 ? 's' : ''}</p>
                            </div>
                            <span className="text-sm font-bold text-yellow-600 shrink-0">{p.rating.toFixed(2)} ⭐</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* ── SECCIÓN 6: DISTRIBUCIÓN POR CATEGORÍA ── */}
              {serviceDist.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <BarChart3 className="w-4 h-4 text-indigo-600" /> Distribución por Categoría — Últimos 30 días
                    </CardTitle>
                    <CardDescription>Solicitudes agrupadas por tipo de servicio</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {serviceDist.map((s) => {
                        const distMax = Math.max(...serviceDist.map(x => x.value))
                        return (
                          <div key={s.name} className="flex items-center gap-3">
                            <span className="text-sm text-gray-600 w-36 shrink-0 truncate">{s.name}</span>
                            <div className="flex-1 bg-gray-100 rounded-full h-5 relative">
                              <div
                                className="bg-indigo-500 h-5 rounded-full flex items-center justify-end pr-2 transition-all"
                                style={{ width: `${Math.max(8, (s.value / distMax) * 100)}%` }}
                              >
                                <span className="text-white text-xs font-semibold">{s.value}</span>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                    <p className="text-xs text-gray-400 mt-3 text-right">
                      Total en el periodo: {serviceDist.reduce((a, s) => a + s.value, 0)} solicitudes
                    </p>
                  </CardContent>
                </Card>
              )}

            </TabsContent>

            {/* TAB: OPERACIONES - Vista de Usuarios */}
            <TabsContent value="operations" className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold">Centro de Operaciones</h2>
                <p className="text-gray-600">Gestión de cuentas de usuario</p>
              </div>

              {loadingUsers ? (
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                      <span className="ml-3 text-gray-600">Cargando usuarios...</span>
                    </div>
                  </CardContent>
                </Card>
              ) : usersError ? (
                <Alert className="border-red-200 bg-red-50">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-800">{usersError}</AlertDescription>
                </Alert>
              ) : users.length === 0 ? (
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-sm text-gray-600">No se encontraron usuarios.</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {users.map((u) => (
                    <Card key={u.rut}>
                      <CardContent className="flex items-center justify-between pt-6">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <div className="font-medium">{getUserDisplayName(u)}</div>
                            <Badge variant={u.rol === 'profesional' ? 'default' : 'secondary'}>
                              {getRoleLabel(u.rol)}
                            </Badge>
                          </div>
                          <div className="text-sm text-gray-500">{u.email}</div>
                          <div className="flex items-center gap-4 flex-wrap text-xs text-gray-400 mt-1">
                            <span className="flex items-center gap-1">
                              <IdCard className="w-3 h-3" />
                              {u.rut_formateado || u.rut}
                            </span>
                            {u.telefono && (
                              <span className="flex items-center gap-1">
                                <Phone className="w-3 h-3" />
                                {u.telefono}
                              </span>
                            )}
                          </div>
                          {u.rol === 'profesional' && (
                            <div className="flex items-start gap-1 mt-2">
                              <Wrench className="w-3 h-3 text-gray-400 mt-1 shrink-0" />
                              {u.servicios_activos && u.servicios_activos.length > 0 ? (
                                <div className="flex flex-wrap gap-1">
                                  {u.servicios_activos.map((servicio) => (
                                    <Badge key={servicio} variant="outline" className="text-xs">
                                      {servicio}
                                    </Badge>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-xs text-gray-400">Sin servicios activos</span>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-sm text-gray-600 px-3 py-1 bg-gray-100 rounded">
                            {u.activo ? 'Activo' : 'Deshabilitado'}
                          </div>
                          <Button
                            variant={u.activo ? 'destructive' : 'secondary'}
                            size="sm"
                            disabled={disablingUser === u.rut}
                            onClick={() => handleRequestToggleUserDisable(u)}
                          >
                            {disablingUser === u.rut ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Procesando...
                              </>
                            ) : u.activo ? 'Deshabilitar' : 'Habilitar'}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>

      {/* Confirmación antes de deshabilitar una cuenta */}
      <AlertDialog open={!!userPendingConfirm} onOpenChange={(open) => !open && setUserPendingConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Deshabilitar esta cuenta?</AlertDialogTitle>
            <AlertDialogDescription>
              {userPendingConfirm && (
                <>
                  Estás a punto de deshabilitar la cuenta de <strong>{getUserDisplayName(userPendingConfirm)}</strong>.
                  {' '}Si tiene solicitudes de servicio pendientes o confirmadas (como cliente o profesional),
                  se cancelarán automáticamente y se notificará a los usuarios involucrados indicando el motivo.
                  Esta acción no se puede deshacer fácilmente.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setUserPendingConfirm(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDisableUser} className="bg-red-600 hover:bg-red-700 text-white">
              Sí, deshabilitar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
