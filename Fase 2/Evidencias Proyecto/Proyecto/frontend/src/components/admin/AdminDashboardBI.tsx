import { useState, useEffect } from "react"
import { toast } from "sonner"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs"
import { Button } from "../ui/button"
import { Alert, AlertDescription } from "../ui/alert"
import { apiGetAuth, apiPutAuth } from "../../lib/api"
import { 
  Users, 
  CheckCircle, 
  AlertCircle,
  Star,
  BarChart3,
  LogOut,
  Loader2
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
    avgStars?: number
    totalUsers?: number
  }
}

interface User {
  rut: string
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
}

export default function AdminDashboardBI({ onLogout }: AdminDashboardBIProps) {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [usersError, setUsersError] = useState<string | null>(null)
  const [disablingUser, setDisablingUser] = useState<number | null>(null)

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
  const basicStats = dashboardData?.stats || {
    completedServices: 0,
    cancelledServices: 0,
    avgStars: dashboardData?.kpis?.avgRating || 0,
    totalUsers: dashboardData?.kpis?.activeUsers || 0
  }

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
      await apiPutAuth(`/api/admin/operations/users/${user.rut}/toggle-status/`, { 
        activo: nuevoEstado 
      })
      toast.success(nuevoEstado ? 'Usuario habilitado' : 'Usuario deshabilitado')
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium text-gray-600">Servicios Completados</CardTitle>
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{basicStats.completedServices?.toLocaleString() || 0}</div>
                    <p className="text-sm text-gray-500 mt-1">Conteo total</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium text-gray-600">Servicios Cancelados</CardTitle>
                      <AlertCircle className="w-4 h-4 text-red-600" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{basicStats.cancelledServices?.toLocaleString() || 0}</div>
                    <p className="text-sm text-gray-500 mt-1">Conteo total</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium text-gray-600">Promedio Estrellas</CardTitle>
                      <Star className="w-4 h-4 text-yellow-600" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{basicStats.avgStars?.toFixed(1) || '0.0'} ⭐</div>
                    <p className="text-sm text-gray-500 mt-1">Calificación</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium text-gray-600">Usuarios</CardTitle>
                      <Users className="w-4 h-4 text-blue-600" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{basicStats.totalUsers?.toLocaleString() || 0}</div>
                    <p className="text-sm text-gray-500 mt-1">Usuarios activos</p>
                  </CardContent>
                </Card>
              </div>
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
                    <Card key={u.id}>
                      <CardContent className="flex items-center justify-between pt-6">
                        <div className="flex-1">
                          <div className="font-medium">{u.first_name || 'Usuario'} {u.last_name || ''}</div>
                          <div className="text-sm text-gray-500">{u.email}</div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-sm text-gray-600 px-3 py-1 bg-gray-100 rounded">
                            {u.disabled ? 'Deshabilitado' : 'Activo'}
                          </div>
                          <Button
                            variant={u.disabled ? 'secondary' : 'destructive'}
                            size="sm"
                            disabled={disablingUser === u.id}
                            onClick={() => handleToggleUserDisable(u)}
                          >
                            {disablingUser === u.id ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Procesando...
                              </>
                            ) : u.disabled ? (
                              'Habilitar'
                            ) : (
                              'Deshabilitar'
                            )}
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
    </div>
  )
}
