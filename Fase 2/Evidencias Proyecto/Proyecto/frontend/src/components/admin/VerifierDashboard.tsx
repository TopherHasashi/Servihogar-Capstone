import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { Button } from "../ui/button"
import { Badge } from "../ui/badge"
import { ScrollArea } from "../ui/scroll-area"
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "../ui/accordion"
import { Alert, AlertDescription } from "../ui/alert"
import { Input } from "../ui/input"
import { Label } from "../ui/label"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog"
import { toast } from "sonner"
import { 
  CheckCircle, 
  XCircle, 
  Eye, 
  FileText, 
  Download,
  User,
  Calendar,
  MapPin,
  Star,
  ArrowLeft,
  AlertTriangle,
  AlertCircle,
  TrendingUp,
  Award,
  Clock
} from "lucide-react"

interface VerifierDashboardProps {
  onLogout: () => void
}

interface VerifierStats {
  totals: {
    total: number
    pendientes: number
    aprobados: number
    rechazados: number
    suspendidos: number
  }
  today_count: number
  verifier_total: number
  daily_stats: Array<{ fecha: string; cantidad: number }>
  avg_per_day: number
  rut_verificador: string | null
}

interface ProfessionalDocument {
  id: string
  professionalId: string
  professionalName: string
  professionalEmail: string
  specialty: string
  region: string
  commune: string
  submittedDate: string
  status: "pending" | "approved" | "rejected"
  isFirstService: boolean // Indica si es la primera solicitud del profesional
  documents: {
    id: string
    type: "cedula" | "certificado" | "experiencia" | "titulo" | "antecedentes"
    name: string
    url: string
    uploadDate: string
  }[]
  personalInfo: {
    phone: string
    experience: string
    description: string
  }
}

export default function VerifierDashboard({ onLogout }: VerifierDashboardProps) {
  const [selectedProfessional, setSelectedProfessional] = useState<string | null>(null)
  const [viewingDocument, setViewingDocument] = useState<string | null>(null)
  const [viewingDocUrl, setViewingDocUrl] = useState<string | null>(null)
  const [viewingDocName, setViewingDocName] = useState<string | null>(null)
  const [pendingVerifications, setPendingVerifications] = useState<ProfessionalDocument[]>([])
  const [stats, setStats] = useState<VerifierStats | null>(null)
  const [isLoadingStats, setIsLoadingStats] = useState(true)

  // Cargar estadísticas del verificador
  useEffect(() => {
    const API = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'
    fetch(`${API}/api/verifications/stats/`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('auth_access') || ''}` }
    })
      .then(async (r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        const data = await r.json()
        setStats(data)
      })
      .catch(() => {})
      .finally(() => setIsLoadingStats(false))
  }, [])

  useEffect(() => {
    const API = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'
    fetch(`${API}/api/verifications/pending/`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('auth_access') || ''}` }
    })
      .then(async (r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        const arr = await r.json()
        const mapped: ProfessionalDocument[] = arr.map((it: any) => ({
          id: it.id_servicio_profesional,
          professionalId: it.rut_usuario,
          professionalName: `${it.nombres} ${it.apellidos}`.trim(),
          professionalEmail: it.email,
          specialty: it.categoria,
          region: it.region || '',
          commune: it.comuna || '',
          submittedDate: (it.creado_en ? new Date(it.creado_en) : new Date()).toISOString(),
          status: 'pending',
          isFirstService: !!it.es_primer_servicio,
          documents: (it.documentos || []).map((d: any) => ({
            id: d.id_documento_profesional,
            type: d.tipo_documento,
            name: d.nombre_documento,
            url: d.url_archivo,
            uploadDate: d.subido_en || new Date().toISOString()
          })),
          personalInfo: { phone: it.telefono || '', experience: it.anos_experiencia, description: it.descripcion },
        }))
        setPendingVerifications(mapped)
      })
      .catch(() => {})
  }, [])

  const reloadStats = () => {
    const API = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'
    fetch(`${API}/api/verifications/stats/`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('auth_access') || ''}` }
    })
      .then(async (r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        const data = await r.json()
        setStats(data)
      })
      .catch(() => {})
  }

  const handleApprove = async (serviceId: string) => {
    const API = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'
    try {
      const r = await fetch(`${API}/api/verifications/service/${serviceId}/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('auth_access') || ''}`,
        },
        body: JSON.stringify({ action: 'approve' })
      })
      if (!r.ok) throw new Error(`HTTP ${r.status}`)
      setPendingVerifications(prev => prev.filter(p => p.id !== serviceId))
      setSelectedProfessional(null)
      reloadStats()
      toast.success('Servicio aprobado')
    } catch (e: any) {
      toast.error(e?.message || 'Error')
    }
  }

  const handleReject = (serviceId: string) => {
    openRejectDialog(serviceId)
  }

  const getDocumentIcon = (type: string) => {
    switch (type) {
      case "cedula": return <User className="w-4 h-4" />
      case "certificado": return <Star className="w-4 h-4" />
      case "titulo": return <Star className="w-4 h-4" />
      case "experiencia": return <FileText className="w-4 h-4" />
      case "antecedentes": return <CheckCircle className="w-4 h-4" />
      default: return <FileText className="w-4 h-4" />
    }
  }

  const getDocumentTypeName = (type: string) => {
    switch (type) {
      case "cedula": return "Cédula de Identidad"
      case "certificado": return "Certificado Profesional"
      case "titulo": return "Título/Diploma"
      case "experiencia": return "Experiencia Laboral"
      case "antecedentes": return "Antecedentes"
      default: return "Documento"
    }
  }

  const selectedProfData = selectedProfessional 
    ? pendingVerifications.find(p => p.id === selectedProfessional)
    : null

  // Reject dialog state
  const [rejectDialog, setRejectDialog] = useState<{ serviceId: string } | null>(null)
  const [rejectReason, setRejectReason] = useState('')

  const openRejectDialog = (serviceId: string) => {
    setRejectReason('')
    setRejectDialog({ serviceId })
  }

  const confirmReject = async () => {
    if (!rejectDialog) return
    const { serviceId } = rejectDialog
    setRejectDialog(null)
    const API = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'
    try {
      const r = await fetch(`${API}/api/verifications/service/${serviceId}/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('auth_access') || ''}`,
        },
        body: JSON.stringify({ action: 'reject', reason: rejectReason })
      })
      if (!r.ok) throw new Error(`HTTP ${r.status}`)
      setPendingVerifications(prev => prev.filter(p => p.id !== serviceId))
      setSelectedProfessional(null)
      reloadStats()
      toast.success('Servicio rechazado')
    } catch (e: any) {
      toast.error(e?.message || 'Error')
    }
  }

  return (
    <>
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-4 gap-4">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <CheckCircle className="w-6 h-6 text-amber-600" />
              </div>
              <div className="min-w-0">
                <h1 className="text-xl font-medium">Panel de Verificación</h1>
                <p className="text-sm text-gray-600">Verificador de ServiHogar</p>
              </div>
            </div>
            <Button variant="outline" onClick={onLogout} className="w-full sm:w-auto">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Cerrar Sesión
            </Button>
          </div>
        </div>
      </div>

      {/* Panel de Estadísticas */}
      {!isLoadingStats && stats && (
        <div className="w-full px-4 sm:px-6 lg:px-8 py-4 bg-gradient-to-r from-amber-50 to-orange-50 border-b">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            {/* Verificaciones de Hoy */}
            <Card className="bg-white shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm text-gray-600 mb-1">Verificadas Hoy</p>
                    <p className="text-2xl sm:text-3xl font-bold text-green-600">{stats.today_count}</p>
                  </div>
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Total del Verificador */}
            <Card className="bg-white shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm text-gray-600 mb-1">Total Verificadas</p>
                    <p className="text-2xl sm:text-3xl font-bold text-blue-600">{stats.verifier_total}</p>
                  </div>
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <Award className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Pendientes */}
            <Card className="bg-white shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm text-gray-600 mb-1">Pendientes</p>
                    <p className="text-2xl sm:text-3xl font-bold text-amber-600">{stats.totals.pendientes}</p>
                  </div>
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-amber-100 rounded-full flex items-center justify-center">
                    <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 text-amber-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Promedio Diario */}
            <Card className="bg-white shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm text-gray-600 mb-1">Promedio/Día</p>
                    <p className="text-2xl sm:text-3xl font-bold text-purple-600">{stats.avg_per_day}</p>
                  </div>
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-100 rounded-full flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      <div className="w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Lista de Verificaciones Pendientes */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                  <span className="truncate">Verificaciones Pendientes</span>
                  <Badge variant="secondary">{pendingVerifications.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[500px] lg:h-[600px]">
                  <div className="p-4">
                    <Accordion type="single" collapsible className="w-full space-y-2">
                      {Object.values(pendingVerifications.reduce((acc, curr) => {
                        if (!acc[curr.professionalId]) acc[curr.professionalId] = { id: curr.professionalId, name: curr.professionalName, services: [] };
                        acc[curr.professionalId].services.push(curr);
                        return acc;
                      }, {} as Record<string, { id: string, name: string, services: ProfessionalDocument[] }>))
                      .map(group => {
                        group.services.sort((a,b) => new Date(a.submittedDate).getTime() - new Date(b.submittedDate).getTime());
                        return group;
                      })
                      .map((group) => (
                        <AccordionItem key={group.id} value={group.id} className="border bg-gray-50 rounded-lg shadow-sm px-2">
                          <AccordionTrigger className="hover:no-underline text-sm font-semibold text-gray-800 py-3">
                            <div className="flex justify-between items-center w-full pr-2">
                              <span>{group.name}</span>
                              <Badge variant="secondary" className="text-xs ml-2">{group.services.length} solic.</Badge>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="pb-3 space-y-2">
                            {group.services.map((professional, index) => {
                              const isClickable = index === 0; // Solo la primera en la cola de este usuario es revisable
                              return (
                                <Card 
                                  key={professional.id}
                                  className={`transition-all ${
                                    !isClickable ? 'opacity-60 cursor-not-allowed bg-gray-100' : 'cursor-pointer bg-white'
                                  } ${
                                    selectedProfessional === professional.id 
                                      ? 'ring-2 ring-blue-500 bg-blue-50' 
                                      : (isClickable ? 'hover:bg-blue-50/50' : '')
                                  }`}
                                  onClick={() => { if (isClickable) setSelectedProfessional(professional.id) }}
                                >
                                  <CardContent className="p-3 sm:p-4">
                                    <div className="space-y-2">
                                      <div className="flex items-start justify-between gap-2">
                                        <h3 className="font-medium text-sm sm:text-base truncate flex-1 block">
                                          {professional.specialty}
                                        </h3>
                                        <Badge variant="outline" className="text-xs flex-shrink-0">
                                          {professional.isFirstService ? 'Inicial' : 'Adicional'}
                                        </Badge>
                                      </div>
                                      <div className="text-sm text-gray-600 space-y-1">
                                        <div className="flex items-center gap-2">
                                          <Calendar className="w-3 h-3 flex-shrink-0" />
                                          <span className="text-xs sm:text-sm">
                                            {new Date(professional.submittedDate).toLocaleDateString('es-CL')}
                                          </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <MapPin className="w-3 h-3 flex-shrink-0" />
                                          <span className="text-xs sm:text-sm truncate">
                                            {professional.commune}
                                          </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <FileText className="w-3 h-3 flex-shrink-0" />
                                          <span className="text-xs sm:text-sm">
                                            {professional.documents.length} documentos
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                              );
                            })}
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Panel de Detalles */}
          <div className="lg:col-span-2">
            {selectedProfData ? (
              <div className="space-y-6">
                {/* Información del Profesional */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <User className="w-5 h-5" />
                      Información del Profesional
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Tipo de Solicitud */}
                    {selectedProfData.isFirstService ? (
                      <Alert className="bg-blue-50 border-blue-200">
                        <AlertCircle className="h-4 w-4 text-blue-600" />
                        <AlertDescription>
                          <p className="font-medium text-blue-800">Primera Solicitud de Servicio</p>
                          <p className="text-sm text-blue-700">
                            Esta es la primera vez que este profesional solicita verificación. Debe incluir certificado de antecedentes + documentación de experiencia.
                          </p>
                        </AlertDescription>
                      </Alert>
                    ) : (
                      <Alert className="bg-green-50 border-green-200">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <AlertDescription>
                          <p className="font-medium text-green-800">Servicio Adicional</p>
                          <p className="text-sm text-green-700">
                            Este profesional ya fue verificado anteriormente. Solo requiere documentación de experiencia para este nuevo servicio.
                          </p>
                        </AlertDescription>
                      </Alert>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm text-gray-600">Nombre Completo</label>
                        <p className="font-medium text-sm sm:text-base break-words">{selectedProfData.professionalName}</p>
                      </div>
                      <div>
                        <label className="text-sm text-gray-600">Email</label>
                        <p className="font-medium text-sm sm:text-base break-all">{selectedProfData.professionalEmail}</p>
                      </div>
                      <div>
                        <label className="text-sm text-gray-600">Teléfono</label>
                        <p className="font-medium text-sm sm:text-base">{selectedProfData.personalInfo.phone}</p>
                      </div>
                      <div>
                        <label className="text-sm text-gray-600">Servicio Solicitado</label>
                        <p className="font-medium text-sm sm:text-base">{selectedProfData.specialty}</p>
                      </div>
                      <div className="sm:col-span-2">
                        <label className="text-sm text-gray-600">Ubicación</label>
                        <p className="font-medium text-sm sm:text-base">{selectedProfData.commune}, {selectedProfData.region}</p>
                      </div>
                      <div>
                        <label className="text-sm text-gray-600">Experiencia en este Servicio</label>
                        <p className="font-medium text-sm sm:text-base">{selectedProfData.personalInfo.experience}</p>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm text-gray-600">Descripción del Servicio</label>
                      <p className="font-medium text-sm sm:text-base leading-relaxed">{selectedProfData.personalInfo.description}</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Documentos */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      Documentos Subidos
                      <Badge variant="secondary">{selectedProfData.documents.length}</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Indicador de tipo de documentación */}
                      <div className="p-3 bg-gray-50 rounded-lg border">
                        <p className="text-sm font-medium mb-2">Documentación Requerida:</p>
                        <div className="space-y-1 text-sm text-gray-700">
                          {selectedProfData.isFirstService ? (
                            <>
                              <div className="flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-green-600" />
                                <span>Certificado de Antecedentes (obligatorio)</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-green-600" />
                                <span>Documentación de experiencia en {selectedProfData.specialty}</span>
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-gray-400" />
                                <span className="text-gray-500 line-through">Certificado de Antecedentes (ya verificado)</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-green-600" />
                                <span>Documentación de experiencia en {selectedProfData.specialty}</span>
                              </div>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Lista de documentos */}
                      <div className="space-y-3">
                        {selectedProfData.documents.map((document) => (
                          <div key={document.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 border rounded-lg gap-3">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <div className="flex-shrink-0">
                                {getDocumentIcon(document.type)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm sm:text-base truncate">{document.name}</p>
                                <p className="text-xs sm:text-sm text-gray-500">
                                  {getDocumentTypeName(document.type)} • 
                                  {new Date(document.uploadDate).toLocaleDateString('es-CL')}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 w-full sm:w-auto">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => { setViewingDocument(document.id); setViewingDocUrl(document.url); setViewingDocName(document.name); }}
                                className="flex-1 sm:flex-initial text-xs sm:text-sm"
                              >
                                <Eye className="w-4 h-4 mr-1" />
                                Ver
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => window.open(document.url, '_blank')}
                                className="flex-1 sm:flex-initial text-xs sm:text-sm"
                              >
                                <Download className="w-4 h-4 mr-1" />
                                Descargar
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Acciones de Verificación */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5" />
                      Acciones de Verificación
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col sm:flex-row items-center gap-4">
                      <Button
                        onClick={() => handleApprove(selectedProfData.id)}
                        className="bg-green-600 hover:bg-green-700 w-full sm:w-auto"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Aprobar Verificación
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => handleReject(selectedProfData.id)}
                        className="w-full sm:w-auto"
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Rechazar Verificación
                      </Button>
                    </div>
                    <div className="mt-4 space-y-3">
                      <div className="p-3 sm:p-4 bg-amber-50 rounded-lg border border-amber-200">
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                          <div className="text-sm">
                            <p className="font-medium text-amber-800">Importante:</p>
                            <p className="text-amber-700 leading-relaxed">
                              Al aprobar la verificación, todos los documentos se eliminarán automáticamente del sistema por seguridad. 
                              Al rechazar, el profesional recibirá una notificación con el motivo del rechazo.
                            </p>
                          </div>
                        </div>
                      </div>

                      {selectedProfData.isFirstService ? (
                        <div className="p-3 sm:p-4 bg-blue-50 rounded-lg border border-blue-200">
                          <div className="flex items-start gap-2">
                            <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                            <div className="text-sm">
                              <p className="font-medium text-blue-800">Primera Verificación:</p>
                              <p className="text-blue-700 leading-relaxed">
                                Verifica que el certificado de antecedentes esté vigente y corresponda al profesional. También valida la documentación de experiencia para el servicio de {selectedProfData.specialty}.
                              </p>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="p-3 sm:p-4 bg-green-50 rounded-lg border border-green-200">
                          <div className="flex items-start gap-2">
                            <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                            <div className="text-sm">
                              <p className="font-medium text-green-800">Servicio Adicional:</p>
                              <p className="text-green-700 leading-relaxed">
                                El certificado de antecedentes ya fue verificado. Solo valida la documentación de experiencia para {selectedProfData.specialty}.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card className="h-[400px] sm:h-[500px] lg:h-[600px] flex items-center justify-center">
                <CardContent className="text-center p-6">
                  <FileText className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-600 mb-2">
                    Selecciona un profesional para verificar
                  </h3>
                  <p className="text-gray-500 text-sm sm:text-base leading-relaxed">
                    Elige un profesional de la lista para revisar sus documentos y proceder con la verificación.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Modal de Vista de Documento */}
      {viewingDocument && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-6xl w-full max-h-[92vh] overflow-hidden mx-4 shadow-xl">
            <div className="flex items-center justify-between p-3 sm:p-4 border-b bg-gray-50">
              <div className="flex items-center gap-2 min-w-0">
                <FileText className="w-4 h-4 text-gray-600" />
                <h3 className="font-medium text-sm sm:text-base truncate">{viewingDocName || 'Documento'}</h3>
              </div>
              <div className="flex items-center gap-2">
                {viewingDocUrl && (
                  <Button variant="outline" size="sm" onClick={() => window.open(viewingDocUrl!, '_blank')}>
                    <Download className="w-4 h-4 mr-1" /> Abrir en pestaña
                  </Button>
                )}
                <Button variant="ghost" onClick={() => { setViewingDocument(null); setViewingDocUrl(null); setViewingDocName(null); }} size="sm">
                  <XCircle className="w-5 h-5" />
                </Button>
              </div>
            </div>
            <div className="h-[70vh] sm:h-[80vh] bg-white">
              {viewingDocUrl ? (
                (() => {
                  const url = viewingDocUrl
                  const lower = url.toLowerCase()
                  const isImage = lower.endsWith('.png') || lower.endsWith('.jpg') || lower.endsWith('.jpeg') || lower.endsWith('.gif') || lower.endsWith('.webp')
                  // Detect formats; fallback to iframe for non-image (PDF, DOCX, etc.)
                  if (isImage) {
                    return (
                      <div className="w-full h-full flex items-center justify-center p-2 bg-gray-100">
                        <img src={url} alt={viewingDocName || 'Documento'} className="max-w-full max-h-full object-contain rounded" />
                      </div>
                    )
                  }
                  // Para PDF u otros tipos, usar iframe; el navegador intentará mostrarlo o descargarlo
                  return (
                    <iframe
                      key={url}
                      src={url}
                      className="w-full h-full bg-white"
                      title={viewingDocName || 'Documento'}
                    />
                  )
                })()
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-500">
                  No hay vista previa disponible.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
    <Dialog open={!!rejectDialog} onOpenChange={(open) => { if (!open) setRejectDialog(null) }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rechazar servicio</DialogTitle>
          <DialogDescription>Ingresa la razón del rechazo para notificar al profesional.</DialogDescription>
        </DialogHeader>
        <div className="space-y-2 py-2">
          <Label htmlFor="reject-reason">Razón del rechazo</Label>
          <Input
            id="reject-reason"
            value={rejectReason}
            onChange={e => setRejectReason(e.target.value)}
            placeholder="Describe el motivo del rechazo..."
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setRejectDialog(null)}>Cancelar</Button>
          <Button variant="destructive" onClick={confirmReject}>Rechazar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  )
}