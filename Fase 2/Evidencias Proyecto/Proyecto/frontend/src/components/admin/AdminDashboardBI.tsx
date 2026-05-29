import { useState, useEffect } from "react"
import { toast } from "sonner"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs"
// import { Badge } from "../ui/badge"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Label } from "../ui/label"
// Removed unused Select imports
import { Switch } from "../ui/switch"
import { Alert, AlertDescription } from "../ui/alert"
import OperationsCenter from "./OperationsCenter"
import { apiGetAuth, apiPutAuth } from "../../lib/api"
import { 
  Users, 
  DollarSign, 
  TrendingUp,
  CheckCircle, 
  AlertCircle,
  Star,
  BarChart3,
  LogOut,
  // Eye,
  Clock,
  UserCheck,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  AlertTriangle,
  Loader2
} from "lucide-react"

interface AdminDashboardBIProps {
  onLogout: () => void
}

interface DashboardData {
  kpis: {
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
  professionalMetrics: {
    total: number
    active: number
    topPerformers: number
    avgServicesPerMonth: number
  }
  serviceDistribution: Array<{
    name: string
    value: number
    revenue: number
    avgPrice: number
  }>
  metadata: {
    periodStart: string
    periodEnd: string
    totalReviews: number
  }
}

export default function AdminDashboardBI({ onLogout }: AdminDashboardBIProps) {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [systemConfig, setSystemConfig] = useState<any>(null)
  const [configReadOnly, setConfigReadOnly] = useState(false)
  const [loadingConfig, setLoadingConfig] = useState(false)
  const [savingConfig, setSavingConfig] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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

  // Cargar configuración del sistema
  useEffect(() => {
    const fetchSystemConfig = async () => {
      try {
        setLoadingConfig(true)
        const data = await apiGetAuth('/api/admin/config/')
        const readOnly = Boolean(data?.__meta?.readOnly)
        
        // Convertir el formato de la API al formato del estado local
        const config = {
          platformCommission: data.comision_plataforma?.valor || 5,
          minServicePrice: data.precio_minimo_servicio?.valor || 10000,
          maxServicePrice: data.precio_maximo_servicio?.valor || 500000,
          autoApproveVerified: data.auto_aprobar_verificados?.valor || false,
          requireDocuments: data.requerir_documentos?.valor || true,
          maintenanceMode: data.modo_mantenimiento?.valor || false
        }
        
        setSystemConfig(config)
        setConfigReadOnly(readOnly)
      } catch (err: any) {
        console.error('Error cargando configuración del sistema:', err)
        setSystemConfig({
          platformCommission: 5,
          minServicePrice: 10000,
          maxServicePrice: 500000,
          autoApproveVerified: false,
          requireDocuments: true,
          maintenanceMode: false
        })
        setConfigReadOnly(true)
      } finally {
        setLoadingConfig(false)
      }
    }

    fetchSystemConfig()
  }, [])

  // Guardar configuración
  const handleSaveConfig = async () => {
    try {
      setSavingConfig(true)
      
      // Convertir del formato local al formato de la API
      const dataToSend = {
        comision_plataforma: systemConfig.platformCommission,
        precio_minimo_servicio: systemConfig.minServicePrice,
        precio_maximo_servicio: systemConfig.maxServicePrice,
        auto_aprobar_verificados: systemConfig.autoApproveVerified,
        requerir_documentos: systemConfig.requireDocuments,
        modo_mantenimiento: systemConfig.maintenanceMode
      }
      
      await apiPutAuth('/api/admin/config/update/', dataToSend)
      
      toast.success('Configuración guardada exitosamente')
    } catch (err: any) {
      console.error('Error guardando configuración:', err)
      toast.error('Error guardando configuración: ' + err.message)
    } finally {
      setSavingConfig(false)
    }
  }

  // Datos para usar en el componente
  const kpiData = dashboardData?.kpis || {
    totalRevenue: 0,
    monthlyGrowth: 0,
    activeUsers: 0,
    userGrowth: 0,
    activeProfessionals: 0,
    professionalGrowth: 0,
    avgRating: 0,
    ratingChange: 0,
    completionRate: 0,
    avgResponseTime: 0
  }

  const professionalMetrics = dashboardData?.professionalMetrics || {
    total: 0,
    active: 0,
    topPerformers: 0,
    avgServicesPerMonth: 0
  }

  const serviceDistribution = dashboardData?.serviceDistribution || []

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0
    }).format(value)
  }

  const getChangeIcon = (value: number) => {
    return value >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />
  }

  const getChangeColor = (value: number) => {
    return value >= 0 ? "text-green-600" : "text-red-600"
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
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Resumen Ejecutivo</TabsTrigger>
              <TabsTrigger value="operations">Centro de Operaciones</TabsTrigger>
              <TabsTrigger value="config">Configuración</TabsTrigger>
            </TabsList>

          {/* TAB: RESUMEN EJECUTIVO */}
          <TabsContent value="overview" className="space-y-6">
            {/* KPIs Principales */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-gray-600">Ingresos del Mes</CardTitle>
                    <DollarSign className="w-4 h-4 text-green-600" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(kpiData.totalRevenue)}</div>
                  <div className={`flex items-center gap-1 text-sm mt-1 ${getChangeColor(kpiData.monthlyGrowth)}`}>
                    {getChangeIcon(kpiData.monthlyGrowth)}
                    <span>{kpiData.monthlyGrowth}% vs mes anterior</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-gray-600">Usuarios Activos</CardTitle>
                    <Users className="w-4 h-4 text-blue-600" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{kpiData.activeUsers.toLocaleString()}</div>
                  <div className={`flex items-center gap-1 text-sm mt-1 ${getChangeColor(kpiData.userGrowth)}`}>
                    {getChangeIcon(kpiData.userGrowth)}
                    <span>{kpiData.userGrowth}% crecimiento</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-gray-600">Profesionales Activos</CardTitle>
                    <UserCheck className="w-4 h-4 text-purple-600" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{professionalMetrics.active}</div>
                  <div className={`flex items-center gap-1 text-sm mt-1 ${getChangeColor(kpiData.professionalGrowth)}`}>
                    {getChangeIcon(kpiData.professionalGrowth)}
                    <span>{kpiData.professionalGrowth}% crecimiento</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-gray-600">Calificación Promedio</CardTitle>
                    <Star className="w-4 h-4 text-yellow-600" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{kpiData.avgRating} ⭐</div>
                  <div className={`flex items-center gap-1 text-sm mt-1 ${getChangeColor(kpiData.ratingChange)}`}>
                    {getChangeIcon(kpiData.ratingChange)}
                    <span>+{kpiData.ratingChange} puntos</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Métricas Operacionales */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Tiempo de Respuesta</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{kpiData.avgResponseTime}h</div>
                  <p className="text-sm text-gray-500 mt-1">Promedio profesionales</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Tasa de Completación</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{kpiData.completionRate}%</div>
                  <p className="text-sm text-gray-500 mt-1">Servicios finalizados</p>
                </CardContent>
              </Card>
            </div>

            {/* Distribución de Servicios */}
            <Card>
              <CardHeader>
                <CardTitle>Distribución de Servicios</CardTitle>
                <CardDescription>Por tipo de servicio</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {serviceDistribution.map((service, index) => {
                    const colors = ['#3B82F6', '#10B981', '#F59E0B']
                    const total = serviceDistribution.reduce((acc, s) => acc + s.value, 0)
                    const percentage = (service.value / total * 100).toFixed(1)
                    
                    return (
                      <div key={service.name} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: colors[index] }} />
                            <span className="font-medium">{service.name}</span>
                          </div>
                          <span className="text-sm text-gray-600">{service.value} servicios ({percentage}%)</span>
                        </div>
                        <div className="flex items-center justify-between text-sm text-gray-600">
                          <span>{formatCurrency(service.revenue)}</span>
                          <span>Promedio: {formatCurrency(service.avgPrice)}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="h-2 rounded-full transition-all" 
                            style={{ 
                              width: `${percentage}%`,
                              backgroundColor: colors[index]
                            }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Performance de Profesionales */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Total Profesionales</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{professionalMetrics.total}</div>
                  <p className="text-sm text-gray-500 mt-1">{professionalMetrics.active} activos</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Top Performers</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{professionalMetrics.topPerformers}</div>
                  <p className="text-sm text-gray-500 mt-1">Calificación 4.8+</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Servicios Promedio</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{professionalMetrics.avgServicesPerMonth}</div>
                  <p className="text-sm text-gray-500 mt-1">Por profesional/mes</p>
                </CardContent>
              </Card>
            </div>

            {/* Insights */}
            <Card className="border-blue-200 bg-blue-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-blue-600" />
                  Insights Principales
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-3 p-3 bg-white rounded-lg">
                  <TrendingUp className="w-5 h-5 text-green-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium">Crecimiento Sostenido</h4>
                    <p className="text-sm text-gray-600">Ingresos creciendo +18.5% mensual. La plataforma está en expansión acelerada.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-white rounded-lg">
                  <Clock className="w-5 h-5 text-orange-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium">Tiempo de Respuesta Óptimo</h4>
                    <p className="text-sm text-gray-600">{kpiData.avgResponseTime}h promedio de respuesta. Los profesionales están siendo ágiles con las solicitudes.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-white rounded-lg">
                  <Star className="w-5 h-5 text-yellow-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium">Alta Satisfacción de Clientes</h4>
                    <p className="text-sm text-gray-600">Calificación de {kpiData.avgRating}/5.0 indica excelente calidad de servicio en toda la plataforma.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-white rounded-lg">
                  <UserCheck className="w-5 h-5 text-purple-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium">Red de Profesionales en Crecimiento</h4>
                    <p className="text-sm text-gray-600">{professionalMetrics.total} profesionales activos generando {formatCurrency(kpiData.totalRevenue)} mensuales.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>



          {/* TAB: OPERACIONES */}
          <TabsContent value="operations" className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold">Centro de Operaciones</h2>
              <p className="text-gray-600">Gestión de solicitudes problemáticas</p>
            </div>

            <OperationsCenter />
          </TabsContent>

          {/* TAB: CONFIGURACIÓN */}
          <TabsContent value="config" className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold">Configuración del Sistema</h2>
              <p className="text-gray-600">Parámetros de la plataforma</p>
            </div>

            {loadingConfig ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                    <span className="ml-3 text-gray-600">Cargando configuración...</span>
                  </div>
                </CardContent>
              </Card>
            ) : systemConfig ? (
              <>
                {configReadOnly && (
                  <Alert className="border-yellow-200 bg-yellow-50">
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    <AlertDescription className="text-yellow-800">
                      Configuración en modo lectura: el esquema actual no soporta cambios.
                    </AlertDescription>
                  </Alert>
                )}
                <Card>
                  <CardHeader>
                    <CardTitle>Parámetros Comerciales</CardTitle>
                    <CardDescription>Comisiones y precios</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label>Comisión de Plataforma (%)</Label>
                        <Input 
                          type="number" 
                          value={systemConfig.platformCommission}
                          onChange={(e) => setSystemConfig({...systemConfig, platformCommission: Number(e.target.value)})}
                          disabled={configReadOnly}
                          min="0"
                          max="100"
                          step="0.1"
                        />
                        <p className="text-xs text-gray-500">Porcentaje por cada servicio</p>
                      </div>

                      <div className="space-y-2">
                        <Label>Precio Mínimo (CLP)</Label>
                        <Input 
                          type="number" 
                          value={systemConfig.minServicePrice}
                          onChange={(e) => setSystemConfig({...systemConfig, minServicePrice: Number(e.target.value)})}
                          disabled={configReadOnly}
                          min="0"
                          step="1000"
                        />
                        <p className="text-xs text-gray-500">Precio mínimo permitido</p>
                      </div>

                      <div className="space-y-2">
                        <Label>Precio Máximo (CLP)</Label>
                        <Input 
                          type="number" 
                          value={systemConfig.maxServicePrice}
                          onChange={(e) => setSystemConfig({...systemConfig, maxServicePrice: Number(e.target.value)})}
                          disabled={configReadOnly}
                          min="0"
                          step="1000"
                        />
                        <p className="text-xs text-gray-500">Precio máximo permitido</p>
                      </div>
                    </div>

                    <Button onClick={handleSaveConfig} disabled={savingConfig || configReadOnly}>
                      {savingConfig ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Guardando...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Guardar Configuración
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Verificación de Profesionales</CardTitle>
                    <CardDescription>Parámetros de aprobación</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h4 className="font-medium">Aprobación Automática</h4>
                        <p className="text-sm text-gray-600">Para profesionales previamente verificados</p>
                      </div>
                      <Switch 
                        checked={systemConfig.autoApproveVerified}
                        onCheckedChange={(checked) => setSystemConfig({...systemConfig, autoApproveVerified: checked})}
                        disabled={configReadOnly}
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h4 className="font-medium">Documentación Obligatoria</h4>
                        <p className="text-sm text-gray-600">Certificado de antecedentes requerido</p>
                      </div>
                      <Switch 
                        checked={systemConfig.requireDocuments}
                        onCheckedChange={(checked) => setSystemConfig({...systemConfig, requireDocuments: checked})}
                        disabled={configReadOnly}
                      />
                    </div>

                    <Button onClick={handleSaveConfig} disabled={savingConfig || configReadOnly}>
                      {savingConfig ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Guardando...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Guardar Configuración
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>

                <Card className="border-yellow-200">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-yellow-900">
                      <AlertCircle className="w-5 h-5" />
                      Zona de Peligro
                    </CardTitle>
                    <CardDescription>Acciones críticas del sistema</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h4 className="font-medium">Modo Mantenimiento</h4>
                        <p className="text-sm text-gray-600">Deshabilita acceso público temporalmente</p>
                      </div>
                      <Switch 
                        checked={systemConfig.maintenanceMode}
                        onCheckedChange={(checked) => setSystemConfig({...systemConfig, maintenanceMode: checked})}
                        disabled={configReadOnly}
                      />
                    </div>

                    {systemConfig.maintenanceMode && (
                      <Alert className="border-yellow-200 bg-yellow-50">
                        <AlertTriangle className="h-4 w-4 text-yellow-600" />
                        <AlertDescription className="text-yellow-800">
                          Modo mantenimiento <strong>ACTIVADO</strong>. Usuarios no pueden acceder.
                        </AlertDescription>
                      </Alert>
                    )}

                    <Button onClick={handleSaveConfig} disabled={savingConfig || configReadOnly} variant="destructive">
                      {savingConfig ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Guardando...
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="w-4 h-4 mr-2" />
                          Guardar Cambios Críticos
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </>
            ) : (
              <Alert className="border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  Error cargando la configuración del sistema
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>
        </Tabs>
        )}
      </div>
    </div>
  )
}
