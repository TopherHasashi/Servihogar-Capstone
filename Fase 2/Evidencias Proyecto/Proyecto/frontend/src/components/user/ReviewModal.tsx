import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../ui/dialog"
import { Button } from "../ui/button"
import { Label } from "../ui/label"
import { Textarea } from "../ui/textarea"
import { Card, CardContent } from "../ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar"
import { Alert, AlertDescription } from "../ui/alert"
import { 
  Star, 
  Check,
  AlertCircle,
  User
} from "lucide-react"

interface ReviewModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (reviewData: any) => void
  serviceRequest: {
    id: string
    professional: string
    service: string
    date: string
    time: string
    price: number
  }
}

interface Criteria {
  id: string
  name: string
  description: string
}

export default function ReviewModal({ isOpen, onClose, onSubmit, serviceRequest }: ReviewModalProps) {
  // Criterios fijos alineados a la tabla `resena` del backend
  // Columnas: calificacion_calidad, calificacion_puntualidad, calificacion_comunicacion
  const criteria: Criteria[] = [
    { id: "calificacion_calidad", name: "Calidad", description: "Calidad del trabajo realizado" },
    { id: "calificacion_puntualidad", name: "Puntualidad", description: "Llegó a la hora acordada" },
    { id: "calificacion_comunicacion", name: "Comunicación", description: "Claridad y trato durante el servicio" },
  ]
  
  // Estado para las calificaciones por criterio (1-5 estrellas)
  const [ratings, setRatings] = useState<{ [key: string]: number }>({})
  
  // Estado para el comentario
  const [comment, setComment] = useState("")
  
  // Estado para el envío
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  // Función para establecer calificación de un criterio
  const setRating = (criteriaId: string, rating: number) => {
    setRatings(prev => ({ ...prev, [criteriaId]: rating }))
  }

  // Calcular promedio de calificaciones
  const calculateAverageRating = () => {
    const validRatings = Object.values(ratings).filter((rating) => rating > 0)
    if (validRatings.length === 0) return 0
    const sum = validRatings.reduce((acc, rating) => acc + rating, 0)
    return Math.round((sum / validRatings.length) * 10) / 10 // Redondear a 1 decimal
  }

  // Función para renderizar estrellas
  const renderStars = (criteriaId: string, currentRating: number) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setRating(criteriaId, star)}
            className={`w-6 h-6 transition-colors ${
              star <= currentRating
                ? "text-yellow-400 hover:text-yellow-500"
                : "text-gray-300 hover:text-yellow-300"
            }`}
          >
            <Star className="w-full h-full fill-current" />
          </button>
        ))}
      </div>
    )
  }

  // Validar que todos los criterios tengan calificación
  const isValid = () => {
    return criteria.every(criterion => ratings[criterion.id] > 0) && comment.trim().length > 0
  }

  // Función para enviar reseña
  const handleSubmit = async () => {
    if (!isValid()) return

    setIsSubmitting(true)
    
    // Simular envío
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    const averageRating = calculateAverageRating()
    
    const reviewData = {
      serviceRequestId: serviceRequest.id,
      comment: comment.trim(),
      averageRating,
      date: new Date().toISOString(),
      // Mapeo directo a columnas de DB para facilitar el backend
      calificacion_calidad: ratings["calificacion_calidad"] || 0,
      calificacion_puntualidad: ratings["calificacion_puntualidad"] || 0,
      calificacion_comunicacion: ratings["calificacion_comunicacion"] || 0,
      // También enviamos el objeto por compatibilidad con otras vistas
      ratings,
    }
    
    onSubmit(reviewData)
    setShowSuccess(true)
    
    // Cerrar modal después de mostrar éxito
    setTimeout(() => {
      setIsSubmitting(false)
      setShowSuccess(false)
      onClose()
      // Limpiar formulario
      setRatings({})
      setComment("")
    }, 2000)
  }

  const averageRating = calculateAverageRating()
  const allCriteriaRated = criteria.every(criterion => ratings[criterion.id] > 0)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-500" />
            Calificar Servicio
          </DialogTitle>
          <DialogDescription>
            Comparte tu experiencia con {serviceRequest.professional}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Información del servicio */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <Avatar className="w-12 h-12">
                  <AvatarImage src="" alt={serviceRequest.professional} />
                  <AvatarFallback>
                    <User className="w-6 h-6" />
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold">{serviceRequest.professional}</h3>
                  <p className="text-sm text-gray-600">{serviceRequest.service}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                <div>
                  <span className="font-medium">Fecha:</span> {serviceRequest.date}
                </div>
                <div>
                  <span className="font-medium">Hora:</span> {serviceRequest.time}
                </div>
                <div>
                  <span className="font-medium">Precio:</span> ${serviceRequest.price.toLocaleString()}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Calificación por criterios */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Califica cada aspecto del servicio</h3>
            
            {criteria.map((criterion) => (
              <Card key={criterion.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h4 className="font-medium">{criterion.name}</h4>
                      <p className="text-sm text-gray-600">{criterion.description}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {renderStars(criterion.id, ratings[criterion.id] || 0)}
                      {ratings[criterion.id] && (
                        <span className="text-sm font-medium text-gray-700 ml-2">
                          {ratings[criterion.id]}
                        </span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Promedio de calificación */}
          {allCriteriaRated && (
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-center gap-2">
                  <span className="text-lg font-semibold">Calificación promedio:</span>
                  <div className="flex items-center gap-1">
                    <Star className="w-6 h-6 text-yellow-400 fill-current" />
                    <span className="text-xl font-bold">{averageRating}</span>
                    <span className="text-gray-600">/5</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Comentario */}
          <div className="space-y-2">
            <Label htmlFor="comment">Comentario</Label>
            <Textarea
              id="comment"
              placeholder="Comparte los detalles de tu experiencia..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              className="resize-none"
            />
            <p className="text-xs text-gray-500">
              Mínimo 10 caracteres ({comment.length}/10)
            </p>
          </div>

          {/* Validación */}
          {!allCriteriaRated && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Por favor califica todos los aspectos del servicio para continuar.
              </AlertDescription>
            </Alert>
          )}

          {/* Estado de éxito */}
          {showSuccess && (
            <Alert className="border-green-200 bg-green-50">
              <Check className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                ¡Reseña enviada exitosamente! Gracias por tu feedback.
              </AlertDescription>
            </Alert>
          )}

          {/* Botones de acción */}
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={!isValid() || isSubmitting}
              className="min-w-[120px]"
            >
              {isSubmitting ? "Enviando..." : "Enviar Reseña"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}