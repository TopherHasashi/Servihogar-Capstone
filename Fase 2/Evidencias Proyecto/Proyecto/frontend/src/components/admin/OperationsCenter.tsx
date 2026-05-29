import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"
import { Badge } from "../ui/badge"
import { Button } from "../ui/button"
import { 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Eye,
  XCircle,
  Loader2,
  TrendingUp,
  Activity
} from "lucide-react"
import { apiGetAuth, apiPutAuth } from "../../lib/api"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../ui/dialog"
import { Textarea } from "../ui/textarea"
import { Label } from "../ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select"

interface ProblematicRequest {
  id_solicitud: string
  estado: string
  fecha_solicitud: string
  fecha_servicio: string
  precio_acordado: number
  descripcion: string
  direccion: string
  comentarios_cancelacion: string | null
  nombre_cliente: string
  email_cliente: string
  telefono_cliente: string
  nombre_profesional: string
  email_profesional: string
  telefono_profesional: string
  nombre_servicio: string
  nombre_categoria: string
  tipo_problema: string
  severidad: string
}

interface OperationsStats {
  active_requests: number
  pending_issues: number
  avg_response_time: number
  success_rate: number
  issue_distribution: Array<{
    tipo: string
    cantidad: number
  }>
}

interface Pagination {
  total: number
  page: number
  page_size: number
  total_pages: number
  has_next: boolean
  has_previous: boolean
}

export default function OperationsCenter() {
  const [problematicRequests, setProblematicRequests] = useState<ProblematicRequest[]>([])
  const [stats, setStats] = useState<OperationsStats | null>(null)
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    page: 1,
    page_size: 20,
    total_pages: 0,
    has_next: false,
    has_previous: false
  })
  const [loading, setLoading] = useState(true)
  const [selectedRequest, setSelectedRequest] = useState<ProblematicRequest | null>(null)
  const [showDialog, setShowDialog] = useState(false)
  const [resolving, setResolving] = useState(false)
  const [resolutionAction, setResolutionAction] = useState<string>('resolved')
  const [resolutionNotes, setResolutionNotes] = useState('')

  useEffect(() => {
    fetchData()
  }, [pagination.page, pagination.page_size])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [requestsData, statsData] = await Promise.all([
        apiGetAuth(`/api/admin/operations/problematic-requests/?page=${pagination.page}&page_size=${pagination.page_size}`),
        apiGetAuth('/api/admin/operations/stats/')
      ])
      
      setProblematicRequests(requestsData.problematic_requests || [])
      if (requestsData.pagination) {
        setPagination(requestsData.pagination)
      }
      setStats(statsData)
    } catch (err: any) {
      console.error('Error cargando datos del centro de operaciones:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleViewDetails = (request: ProblematicRequest) => {
    setSelectedRequest(request)
    setShowDialog(true)
    setResolutionNotes('')
    setResolutionAction('resolved')
  }

  const handleResolve = async () => {
    if (!selectedRequest) return

    // Confirmación antes de resolver
    const confirmMessage = resolutionAction === 'cancelled' 
      ? '¿Estás seguro de cancelar definitivamente esta solicitud? Esta acción no se puede deshacer.'
      : `¿Confirmas marcar este problema como "${resolutionAction}"?`
    
    if (!confirm(confirmMessage)) {
      return
    }

    try {
      setResolving(true)
      await apiPutAuth(`/api/admin/operations/resolve/${selectedRequest.id_solicitud}/`, {
        action: resolutionAction,
        notes: resolutionNotes
      })

      // Actualizar la lista
      await fetchData()
      setShowDialog(false)
      setSelectedRequest(null)
      toast.success('Problema resuelto exitosamente')
    } catch (err: any) {
      console.error('Error resolviendo problema:', err)
      toast.error('Error resolviendo problema: ' + err.message)
    } finally {
      setResolving(false)
    }
  }

  const getSeverityBadge = (severity: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline", className: string }> = {
      high: { variant: "destructive", className: "bg-red-100 text-red-800 border-red-200" },
      medium: { variant: "secondary", className: "bg-yellow-100 text-yellow-800 border-yellow-200" },
      low: { variant: "outline", className: "bg-blue-100 text-blue-800 border-blue-200" }
    }
    
    const config = variants[severity] || variants.low
    
    return (
      <Badge className={config.className}>
        {severity === 'high' ? 'Alta' : severity === 'medium' ? 'Media' : 'Baja'}
      </Badge>
    )
  }

  const getProblemTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      cancelacion_tardia: 'Cancelación Tardía',
      pago_pendiente: 'Pago Pendiente',
      disputa_activa: 'Disputa Activa',
      servicio_incompleto: 'Servicio Incompleto',
      otro: 'Otro'
    }
    return labels[type] || type
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP'
    }).format(value)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-3 text-gray-600">Cargando centro de operaciones...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Solicitudes Activas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold text-blue-600">
                {stats?.active_requests || 0}
              </div>
              <Activity className="w-8 h-8 text-blue-600 opacity-20" />
            </div>
            <p className="text-xs text-gray-500 mt-2">En tiempo real</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Problemas Pendientes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold text-red-600">
                {stats?.pending_issues || 0}
              </div>
              <AlertTriangle className="w-8 h-8 text-red-600 opacity-20" />
            </div>
            <p className="text-xs text-gray-500 mt-2">Requieren atención</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Tiempo de Respuesta</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold text-yellow-600">
                {stats?.avg_response_time.toFixed(1) || 0}h
              </div>
              <Clock className="w-8 h-8 text-yellow-600 opacity-20" />
            </div>
            <p className="text-xs text-gray-500 mt-2">Promedio últimos 30 días</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Tasa de Éxito</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold text-green-600">
                {stats?.success_rate.toFixed(1) || 0}%
              </div>
              <TrendingUp className="w-8 h-8 text-green-600 opacity-20" />
            </div>
            <p className="text-xs text-gray-500 mt-2">Servicios completados</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabla de solicitudes problemáticas */}
      <Card>
        <CardHeader>
          <CardTitle>Solicitudes Problemáticas</CardTitle>
          <CardDescription>
            Requieren atención inmediata ({pagination.total} total)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {problematicRequests.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-500" />
              <p>¡Todo en orden! No hay problemas pendientes.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Profesional</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Problema</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Severidad</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {problematicRequests.map((request) => (
                    <tr key={request.id_solicitud} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-mono">
                        {request.id_solicitud.substring(0, 8)}...
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="font-medium">{request.nombre_cliente}</div>
                        <div className="text-xs text-gray-500">{request.email_cliente}</div>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="font-medium">{request.nombre_profesional}</div>
                        <div className="text-xs text-gray-500">{request.nombre_servicio}</div>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {getProblemTypeLabel(request.tipo_problema)}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {getSeverityBadge(request.severidad)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {new Date(request.fecha_solicitud).toLocaleDateString('es-CL')}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewDetails(request)}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Ver
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Controles de paginación */}
          {problematicRequests.length > 0 && (
            <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span>
                  Mostrando {((pagination.page - 1) * pagination.page_size) + 1} - {Math.min(pagination.page * pagination.page_size, pagination.total)} de {pagination.total} resultados
                </span>
              </div>

              <div className="flex items-center gap-2">
                {/* Selector de items por página */}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Items por página:</span>
                  <Select 
                    value={pagination.page_size.toString()} 
                    onValueChange={(value) => setPagination(prev => ({ ...prev, page: 1, page_size: parseInt(value) }))}
                  >
                    <SelectTrigger className="w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="20">20</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                      <SelectItem value="100">100</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Botones de navegación */}
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPagination(prev => ({ ...prev, page: 1 }))}
                    disabled={!pagination.has_previous}
                  >
                    Primera
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                    disabled={!pagination.has_previous}
                  >
                    Anterior
                  </Button>

                  <span className="px-3 text-sm text-gray-600">
                    Página {pagination.page} de {pagination.total_pages}
                  </span>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                    disabled={!pagination.has_next}
                  >
                    Siguiente
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.total_pages }))}
                    disabled={!pagination.has_next}
                  >
                    Última
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de detalles y resolución */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalles de la Solicitud Problemática</DialogTitle>
            <DialogDescription>
              ID: {selectedRequest?.id_solicitud}
            </DialogDescription>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-6">
              {/* Información del problema */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <Label className="text-xs text-gray-500">Tipo de Problema</Label>
                  <p className="font-medium">{getProblemTypeLabel(selectedRequest.tipo_problema)}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Severidad</Label>
                  <div className="mt-1">{getSeverityBadge(selectedRequest.severidad)}</div>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Estado Actual</Label>
                  <p className="font-medium capitalize">{selectedRequest.estado.replace('_', ' ')}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Monto</Label>
                  <p className="font-medium">{formatCurrency(selectedRequest.precio_acordado)}</p>
                </div>
              </div>

              {/* Información del cliente */}
              <div>
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 text-sm font-bold">C</span>
                  </div>
                  Cliente
                </h4>
                <div className="pl-10 space-y-1 text-sm">
                  <p><strong>Nombre:</strong> {selectedRequest.nombre_cliente}</p>
                  <p><strong>Email:</strong> {selectedRequest.email_cliente}</p>
                  <p><strong>Teléfono:</strong> {selectedRequest.telefono_cliente}</p>
                </div>
              </div>

              {/* Información del profesional */}
              <div>
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-green-600 text-sm font-bold">P</span>
                  </div>
                  Profesional
                </h4>
                <div className="pl-10 space-y-1 text-sm">
                  <p><strong>Nombre:</strong> {selectedRequest.nombre_profesional}</p>
                  <p><strong>Email:</strong> {selectedRequest.email_profesional}</p>
                  <p><strong>Teléfono:</strong> {selectedRequest.telefono_profesional}</p>
                  <p><strong>Servicio:</strong> {selectedRequest.nombre_servicio} - {selectedRequest.nombre_categoria}</p>
                </div>
              </div>

              {/* Detalles del servicio */}
              <div>
                <h4 className="font-semibold mb-2">Detalles del Servicio</h4>
                <div className="space-y-2 text-sm">
                  <p><strong>Descripción:</strong> {selectedRequest.descripcion}</p>
                  <p><strong>Dirección:</strong> {selectedRequest.direccion}</p>
                  <p><strong>Fecha del Servicio:</strong> {formatDate(selectedRequest.fecha_servicio)}</p>
                  <p><strong>Fecha de Solicitud:</strong> {formatDate(selectedRequest.fecha_solicitud)}</p>
                </div>
              </div>

              {/* Comentarios de cancelación */}
              {selectedRequest.comentarios_cancelacion && (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <h4 className="font-semibold mb-2 text-yellow-900">Comentarios/Notas</h4>
                  <p className="text-sm text-yellow-800 whitespace-pre-wrap">
                    {selectedRequest.comentarios_cancelacion}
                  </p>
                </div>
              )}

              {/* Acciones de resolución */}
              <div className="border-t pt-4">
                <h4 className="font-semibold mb-3">Resolver Problema</h4>
                <div className="space-y-4">
                  <div>
                    <Label>Acción a Tomar</Label>
                    <Select value={resolutionAction} onValueChange={setResolutionAction}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="resolved">Marcar como Resuelto</SelectItem>
                        <SelectItem value="completada">Completar Servicio</SelectItem>
                        <SelectItem value="cancelled">Cancelar Definitivamente</SelectItem>
                        <SelectItem value="en_progreso">Poner en Progreso</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Notas de Resolución</Label>
                    <Textarea
                      placeholder="Describe cómo se resolvió el problema..."
                      value={resolutionNotes}
                      onChange={(e) => setResolutionNotes(e.target.value)}
                      rows={4}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              <XCircle className="w-4 h-4 mr-2" />
              Cancelar
            </Button>
            <Button onClick={handleResolve} disabled={resolving || !resolutionNotes.trim()}>
              {resolving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Resolviendo...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Resolver
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
