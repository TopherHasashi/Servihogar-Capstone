import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../ui/card"
import { Button } from "../../ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../ui/tabs"
import { Badge } from "../../ui/badge"
import { Alert, AlertDescription } from "../../ui/alert"
import { Textarea } from "../../ui/textarea"
import { Label } from "../../ui/label"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription as AlertDialogDesc,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../../ui/alert-dialog"
import ReviewModal from "../ReviewModal"
// import { apiPost } from "../../../lib/api"
import { 
  Calendar,
  Clock,
  CheckCircle,
  Star,
  MapPin,
  Phone,
  AlertCircle,
  AlertTriangle,
  RefreshCw,
} from "lucide-react"

interface RequestsTabProps {
  serviceRequests: any[]
  professionalBookings: any[]
  onMarkAsCompleted: (requestId: string) => void
  onSubmitReview: (reviewData: any) => void
  onConfirmBooking?: (id: string) => void
  onCancelBooking?: (id: string, reason: string) => void
  onCancelClient?: (id: string, reason: string) => void
  onRefresh?: () => Promise<void>
}

export default function RequestsTab({ 
  serviceRequests, 
  professionalBookings, 
  onMarkAsCompleted,
  onSubmitReview,
  onConfirmBooking,
  onCancelBooking,
  onCancelClient,
  onRefresh,
}: RequestsTabProps) {
  const [requestsTab, setRequestsTab] = useState("client")
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [selectedServiceForReview, setSelectedServiceForReview] = useState<any>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())
  const lastUpdatedRef = useRef<Date>(new Date())

  // Actualizar marca de tiempo cuando cambien los datos
  useEffect(() => {
    lastUpdatedRef.current = new Date()
    setLastUpdated(new Date())
  }, [serviceRequests, professionalBookings])

  const handleManualRefresh = async () => {
    if (!onRefresh || refreshing) return
    setRefreshing(true)
    try {
      await onRefresh()
    } finally {
      setRefreshing(false)
    }
  }

  function formatLastUpdated(d: Date): string {
    const diff = Math.floor((Date.now() - d.getTime()) / 1000)
    if (diff < 5) return 'Ahora mismo'
    if (diff < 60) return `Hace ${diff}s`
    return `Hace ${Math.floor(diff / 60)}min`
  }
  
  // Estados para controlar el diálogo de cancelación
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
  const [cancelReason, setCancelReason] = useState("")
  const [cancelReasonError, setCancelReasonError] = useState("")
  const [currentCancelId, setCurrentCancelId] = useState<string | null>(null)
  const [cancelType, setCancelType] = useState<"client" | "professional">("client")
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case "Completado":
        return "bg-green-100 text-green-600"
      case "Confirmado":
        return "bg-blue-100 text-blue-600"
      case "Pendiente":
        return "bg-yellow-100 text-yellow-600"
      default:
        return "bg-gray-100 text-gray-600"
    }
  }

  const handleOpenReviewModal = (serviceRequest: any) => {
    setSelectedServiceForReview(serviceRequest)
    setShowReviewModal(true)
  }

  const handleCloseReviewModal = () => {
    setShowReviewModal(false)
    setSelectedServiceForReview(null)
  }

  const handleSubmitReview = (reviewData: any) => {
    onSubmitReview(reviewData)
    handleCloseReviewModal()
  }

  const handleOpenCancelDialog = (id: string, type: "client" | "professional") => {
    setCurrentCancelId(id)
    setCancelType(type)
    setCancelReason("")
    setCancelReasonError("")
    setCancelDialogOpen(true)
  }

  const handleCloseCancelDialog = () => {
    setCancelDialogOpen(false)
    setCurrentCancelId(null)
    setCancelReason("")
    setCancelReasonError("")
  }

  const handleConfirmCancel = () => {
    // Validar que la razón tenga al menos 20 caracteres
    if (cancelReason.trim().length < 20) {
      setCancelReasonError("La razón debe tener al menos 20 caracteres")
      return
    }

    // Ejecutar la cancelación según el tipo
    if (currentCancelId) {
      if (cancelType === "client") {
        onCancelClient?.(currentCancelId, cancelReason.trim())
      } else {
        onCancelBooking?.(currentCancelId, cancelReason.trim())
      }
    }

    // Cerrar el diálogo
    handleCloseCancelDialog()
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Mis Solicitudes
            </CardTitle>
            {onRefresh && (
              <button
                onClick={handleManualRefresh}
                disabled={refreshing}
                title="Actualizar solicitudes"
                className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-primary transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">{formatLastUpdated(lastUpdated)}</span>
              </button>
            )}
          </div>
          <CardDescription>
            Gestiona tus servicios solicitados y trabajos realizados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={requestsTab} onValueChange={setRequestsTab} className="space-y-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="client">Como Cliente</TabsTrigger>
              <TabsTrigger value="professional">Como Profesional</TabsTrigger>
            </TabsList>
            
            {/* Tab Como Cliente */}
            <TabsContent value="client" className="space-y-4">
              {serviceRequests.length === 0 ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    No tienes solicitudes de servicios aún. ¡Busca un profesional para comenzar!
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-4">
                  {serviceRequests.map((request) => (
                    <Card key={request.id}>
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-lg">{request.service}</CardTitle>
                            <CardDescription>
                              Profesional: {request.professional}
                            </CardDescription>
                          </div>
                          <Badge className={getStatusColor(request.status)}>
                            {request.status}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-500" />
                            <span className="text-sm">{request.date}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-gray-500" />
                            <span className="text-sm">{request.time}</span>
                          </div>
                          {(request.comuna || request.region) && (
                            <div className="flex items-center gap-2 col-span-2">
                              <MapPin className="w-4 h-4 text-gray-500" />
                              <span className="text-sm">{request.comuna}{request.region ? `, ${request.region}` : ''}</span>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <span className="text-lg font-semibold">
                            ${request.price.toLocaleString()}
                          </span>
                          
                          <div className="flex flex-wrap gap-2">
                            {(request.status === "Pendiente" || request.status === "Confirmado") && (
                              <Button 
                                variant="destructive" 
                                size="sm"
                                onClick={() => handleOpenCancelDialog(request.id, "client")}
                              >
                                Cancelar
                              </Button>
                            )}
                            
                            {request.status === "Confirmado" && (
                              <Button
                                onClick={() => onMarkAsCompleted(request.id)}
                                variant="outline"
                                size="sm"
                                className="flex items-center gap-1"
                              >
                                <CheckCircle className="w-4 h-4" />
                                Marcar Completado
                              </Button>
                            )}
                            
                            {/* Botón Calificar siempre visible pero condicionalmente habilitado */}
                            <Button
                              onClick={() => handleOpenReviewModal(request)}
                              variant={request.status === "Completado" && !request.rating ? "default" : "secondary"}
                              size="sm"
                              className="flex items-center gap-1"
                              disabled={request.status !== "Completado" || !!request.rating}
                              title={
                                request.status !== "Completado" 
                                  ? "Marca el servicio como completado para poder calificar"
                                  : request.rating 
                                  ? "Ya has calificado este servicio"
                                  : "Calificar servicio"
                              }
                            >
                              <Star className={`w-4 h-4 ${
                                request.rating 
                                  ? "fill-yellow-400 text-yellow-400" 
                                  : request.status === "Completado" && !request.rating
                                  ? "text-white"
                                  : "text-gray-400"
                              }`} />
                              {request.rating ? `${request.rating}` : "Calificar"}
                            </Button>
                          </div>
                        </div>
                        
                        {request.review && (
                          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                            <p className="text-sm text-gray-700">{request.review}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Tab Como Profesional */}
            <TabsContent value="professional" className="space-y-4">
              {professionalBookings.length === 0 ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    No tienes reservas de servicios como profesional aún.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-4">
                  {professionalBookings.map((booking) => (
                    <Card key={booking.id}>
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-lg">{booking.service}</CardTitle>
                            <CardDescription>
                              Cliente: {booking.client}
                            </CardDescription>
                          </div>
                          <Badge className={getStatusColor(booking.status)}>
                            {booking.status}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-gray-500" />
                              <span className="text-sm">{booking.date}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4 text-gray-500" />
                              <span className="text-sm">{booking.time}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4 text-gray-500" />
                              <span className="text-sm">{booking.address}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Phone className="w-4 h-4 text-gray-500" />
                              <span className="text-sm">{booking.phone}</span>
                            </div>
                            {(booking.comuna || booking.region) && (
                              <div className="flex items-center gap-2 col-span-2">
                                <MapPin className="w-4 h-4 text-gray-500" />
                                <span className="text-sm">{booking.comuna}{booking.region ? `, ${booking.region}` : ''}</span>
                              </div>
                            )}
                          </div>
                          
                          <div className="p-3 bg-gray-50 rounded-lg">
                            <p className="text-sm text-gray-700">{booking.description}</p>
                          </div>
                          
                          <div className="flex justify-between items-center gap-3">
                            <span className="text-lg font-semibold">
                              ${booking.price.toLocaleString()}
                            </span>
                            <div className="flex gap-2">
                              {booking.status === "Pendiente" && (
                                <>
                                  <Button size="sm" onClick={() => onConfirmBooking?.(booking.id)} className="bg-green-600 hover:bg-green-700">
                                    Aceptar
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="destructive"
                                    onClick={() => handleOpenCancelDialog(booking.id, "professional")}
                                  >
                                    Cancelar
                                  </Button>
                                </>
                              )}
                              {booking.status === "Confirmado" && (
                                <Button 
                                  size="sm" 
                                  variant="destructive"
                                  onClick={() => handleOpenCancelDialog(booking.id, "professional")}
                                >
                                  Cancelar
                                </Button>
                              )}
                            </div>
                          </div>

                          {/* Reseña recibida del cliente */}
                          {booking.status === "Completado" && booking.review_rating !== null && (
                            <div className="mt-3 p-3 rounded-lg bg-yellow-50 border border-yellow-100">
                              <div className="flex items-center gap-2 mb-1">
                                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                <span className="font-semibold text-sm text-yellow-800">
                                  {booking.review_rating.toFixed(1)} — Reseña del cliente
                                </span>
                              </div>
                              <div className="flex gap-3 text-xs text-gray-500 mb-2">
                                {booking.review_calidad !== null && (
                                  <span>Calidad: <strong>{booking.review_calidad}/5</strong></span>
                                )}
                                {booking.review_puntualidad !== null && (
                                  <span>Puntualidad: <strong>{booking.review_puntualidad}/5</strong></span>
                                )}
                                {booking.review_comunicacion !== null && (
                                  <span>Comunicación: <strong>{booking.review_comunicacion}/5</strong></span>
                                )}
                              </div>
                              {booking.review_comment && (
                                <p className="text-sm text-gray-700 italic">"{booking.review_comment}"</p>
                              )}
                            </div>
                          )}
                          {booking.status === "Completado" && booking.review_rating === null && (
                            <p className="mt-2 text-xs text-gray-400 italic">El cliente aún no ha dejado una reseña.</p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Diálogo de Cancelación con Razón Obligatoria */}
      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              ¿Cancelar esta {cancelType === "client" ? "solicitud" : "reserva"}?
            </AlertDialogTitle>
            <AlertDialogDesc>
              {cancelType === "client" 
                ? "El profesional será notificado y el cupo quedará libre."
                : "El cliente será notificado y el cupo quedará libre."}
            </AlertDialogDesc>
          </AlertDialogHeader>

          <div className="space-y-4 py-4">


            <div className="space-y-2">
              <Label htmlFor="cancel-reason" className="text-sm font-medium">
                Razón de cancelación <span className="text-red-600">*</span>
              </Label>
              <Textarea
                id="cancel-reason"
                placeholder="Explica el motivo de la cancelación (mínimo 20 caracteres)..."
                value={cancelReason}
                onChange={(e) => {
                  setCancelReason(e.target.value)
                  if (e.target.value.trim().length >= 20) {
                    setCancelReasonError("")
                  }
                }}
                className={`min-h-[100px] resize-none ${cancelReasonError ? 'border-red-500' : ''}`}
              />
              <div className="flex justify-between items-center text-xs">
                <span className={`${
                  cancelReason.trim().length < 20 
                    ? 'text-gray-500' 
                    : 'text-green-600 font-medium'
                }`}>
                  {cancelReason.trim().length} / 20 caracteres mínimos
                </span>
                {cancelReasonError && (
                  <span className="text-red-600">{cancelReasonError}</span>
                )}
              </div>
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCloseCancelDialog}>
              Volver
            </AlertDialogCancel>
            <Button
              onClick={handleConfirmCancel}
              className="bg-red-600 hover:bg-red-700"
              disabled={cancelReason.trim().length < 20}
            >
              Sí, cancelar
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal de Reseñas */}
      {showReviewModal && selectedServiceForReview && (
        <ReviewModal
          isOpen={showReviewModal}
          onClose={handleCloseReviewModal}
          onSubmit={handleSubmitReview}
          serviceRequest={selectedServiceForReview}
        />
      )}
    </>
  )
}