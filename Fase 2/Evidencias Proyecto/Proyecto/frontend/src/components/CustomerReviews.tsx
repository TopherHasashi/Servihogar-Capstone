import { useState } from "react"
import { toast } from "sonner"
import { Card, CardContent } from "./ui/card"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Textarea } from "./ui/textarea"
import { Badge } from "./ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog"
import { Label } from "./ui/label"
import { 
  Star, 
  MessageCircle, 
  ThumbsUp, 
  Camera,
  CheckCircle,
  Plus,
  Search,
  Wrench,
  Sparkles,
  Scissors,
  User
} from "lucide-react"

interface CustomerReviewsProps {
  // Props opcionales si se necesitan en el futuro
}

export default function CustomerReviews({}: CustomerReviewsProps = {}) {
  const [selectedTab, setSelectedTab] = useState("all")
  const [sortBy, setSortBy] = useState("recent")
  const [searchTerm, setSearchTerm] = useState("")
  const [showAddReview, setShowAddReview] = useState(false)
  
  const [newReview, setNewReview] = useState({
    service: "",
    professional: "",
    rating: 0,
    title: "",
    comment: "",
    photos: [] as string[]
  })

  // Datos simulados de reseñas
  const reviews = [
    {
      id: "rev-001",
      customer: {
        name: "María González",
        avatar: "/avatars/maria.jpg",
        verified: true
      },
      service: "Limpieza Profunda del Hogar",
      serviceIcon: <Sparkles className="w-4 h-4" />,
      professional: {
        name: "Ana Martínez",
        speciality: "Limpieza del Hogar"
      },
      rating: 5,
      title: "Excelente servicio, quedé muy satisfecha",
      comment: "Ana llegó puntual y realizó una limpieza increíble. Mi casa quedó impecable, incluso limpió lugares que yo no había notado que estaban sucios. Muy profesional y cuidadosa con mis muebles. Definitivamente la volvería a contratar.",
      date: "2024-01-15",
      likes: 24,
      helpful: 18,
      photos: ["cleaning-before.jpg", "cleaning-after.jpg"],
      professionalResponse: {
        message: "¡Muchas gracias María! Fue un gusto trabajar en tu hogar. Me alegra saber que quedaste satisfecha con el resultado.",
        date: "2024-01-16"
      },
      verified: true
    },
    {
      id: "rev-002", 
      customer: {
        name: "Carlos Rodríguez",
        avatar: "/avatars/carlos.jpg",
        verified: true
      },
      service: "Gasfitería General",
      serviceIcon: <Wrench className="w-4 h-4" />,
      professional: {
        name: "Juan Pérez",
        speciality: "Gasfitería"
      },
      rating: 4,
      title: "Buen trabajo, profesional y rápido",
      comment: "Tenía un problema con la ducha que no salía agua caliente. Juan llegó en el horario acordado, identificó el problema rápidamente y lo solucionó. El precio fue justo y ahora funciona perfectamente.",
      date: "2024-01-12",
      likes: 15,
      helpful: 12,
      photos: [],
      verified: true
    },
    {
      id: "rev-003",
      customer: {
        name: "Patricia Silva",
        avatar: "/avatars/patricia.jpg",
        verified: false
      },
      service: "Mantenimiento de Jardín",
      serviceIcon: <Scissors className="w-4 h-4" />,
      professional: {
        name: "Roberto Lagos",
        speciality: "Jardinería"
      },
      rating: 5,
      title: "Mi jardín nunca se había visto tan bien",
      comment: "Roberto transformó completamente mi jardín. Podó los arbustos con mucha técnica, cortó el pasto de manera pareja y hasta me dio consejos para mantenerlo. Quedé encantada con el resultado y ya programé el próximo mantenimiento.",
      date: "2024-01-10",
      likes: 31,
      helpful: 25,
      photos: ["garden-before.jpg", "garden-after.jpg", "garden-detail.jpg"],
      professionalResponse: {
        message: "¡Gracias Patricia! Me alegra mucho ver que disfrutas de tu jardín. Nos vemos el próximo mes para el mantenimiento.",
        date: "2024-01-11"
      },
      verified: false
    },
    {
      id: "rev-004",
      customer: {
        name: "Luis Morales",
        avatar: "/avatars/luis.jpg", 
        verified: true
      },
      service: "Instalación Eléctrica",
      serviceIcon: <Wrench className="w-4 h-4" />,
      professional: {
        name: "Miguel Torres",
        speciality: "Electricidad"
      },
      rating: 3,
      title: "Trabajo correcto pero tardó más de lo esperado",
      comment: "Miguel instaló varios enchufes en mi oficina en casa. El trabajo quedó bien hecho y funciona todo correctamente, pero se demoró más de las 2 horas estimadas. Al final fueron casi 4 horas. El precio se mantuvo igual, pero hubiera preferido que fuera más rápido.",
      date: "2024-01-08",
      likes: 8,
      helpful: 6,
      photos: [],
      verified: true
    },
    {
      id: "rev-005",
      customer: {
        name: "Andrea Vargas",
        avatar: "/avatars/andrea.jpg",
        verified: true
      },
      service: "Pintura de Interiores",
      serviceIcon: <Wrench className="w-4 h-4" />,
      professional: {
        name: "Pedro Sánchez",
        speciality: "Pintura"
      },
      rating: 5,
      title: "Superó mis expectativas por completo",
      comment: "Pedro pintó toda mi sala y comedor. No solo hizo un trabajo impecable, sino que también me ayudó a elegir los colores y me dio ideas para decorar. Muy limpio en su trabajo, protegió todos los muebles y dejó todo ordenado. Un verdadero profesional.",
      date: "2024-01-05",
      likes: 42,
      helpful: 35,
      photos: ["painting-process.jpg", "final-result.jpg"],
      professionalResponse: {
        message: "¡Muchas gracias Andrea! Fue un proyecto muy lindo de trabajar. Me alegra que hayas quedado contenta con los colores que elegimos.",
        date: "2024-01-06"
      },
      verified: true
    }
  ]

  const serviceTypes = [
    { id: "all", name: "Todos los Servicios", count: reviews.length },
    { id: "gasfiteria", name: "Gasfitería", count: reviews.filter(r => r.service.includes("Gasfitería")).length },
    { id: "limpieza", name: "Limpieza", count: reviews.filter(r => r.service.includes("Limpieza")).length },
    { id: "jardineria", name: "Jardinería", count: reviews.filter(r => r.service.includes("Jardín")).length },
    { id: "otros", name: "Otros", count: reviews.filter(r => !r.service.includes("Gasfitería") && !r.service.includes("Limpieza") && !r.service.includes("Jardín")).length }
  ]

  const filteredReviews = reviews.filter(review => {
    const matchesSearch = review.service.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         review.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         review.comment.toLowerCase().includes(searchTerm.toLowerCase())
    
    let matchesTab = true
    if (selectedTab !== "all") {
      switch (selectedTab) {
        case "gasfiteria":
          matchesTab = review.service.includes("Gasfitería")
          break
        case "limpieza":
          matchesTab = review.service.includes("Limpieza")
          break
        case "jardineria":
          matchesTab = review.service.includes("Jardín")
          break
        case "otros":
          matchesTab = !review.service.includes("Gasfitería") && !review.service.includes("Limpieza") && !review.service.includes("Jardín")
          break
      }
    }
    
    return matchesSearch && matchesTab
  }).sort((a, b) => {
    switch (sortBy) {
      case "rating":
        return b.rating - a.rating
      case "helpful":
        return b.helpful - a.helpful
      case "recent":
      default:
        return new Date(b.date).getTime() - new Date(a.date).getTime()
    }
  })

  const averageRating = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault()
    // Aquí se procesaría la reseña
    toast.success('¡Gracias por tu reseña! Será visible una vez que sea verificada.')
    setShowAddReview(false)
    setNewReview({
      service: "",
      professional: "",
      rating: 0,
      title: "",
      comment: "",
      photos: []
    })
  }

  const renderStars = (rating: number, size: "sm" | "md" | "lg" = "md") => {
    const sizeClasses = {
      sm: "w-3 h-3",
      md: "w-4 h-4", 
      lg: "w-5 h-5"
    }
    
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${sizeClasses[size]} ${
              star <= rating 
                ? "fill-yellow-400 text-yellow-400" 
                : "text-gray-300"
            }`}
          />
        ))}
      </div>
    )
  }

  const renderInteractiveStars = (rating: number, onChange: (rating: number) => void) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className="transition-colors"
          >
            <Star
              className={`w-6 h-6 ${
                star <= rating 
                  ? "fill-yellow-400 text-yellow-400" 
                  : "text-gray-300 hover:text-yellow-200"
              }`}
            />
          </button>
        ))}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-end mb-6">
            <Dialog open={showAddReview} onOpenChange={setShowAddReview}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Escribir Reseña
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Comparte tu experiencia</DialogTitle>
                  <DialogDescription>
                    Ayuda a otros usuarios contando sobre el servicio que recibiste
                  </DialogDescription>
                </DialogHeader>
                
                <form onSubmit={handleSubmitReview} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="service">Servicio recibido</Label>
                      <Select value={newReview.service} onValueChange={(value) => setNewReview({...newReview, service: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona el servicio" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="gasfiteria">Gasfitería General</SelectItem>
                          <SelectItem value="limpieza">Limpieza del Hogar</SelectItem>
                          <SelectItem value="jardineria">Mantenimiento de Jardín</SelectItem>
                          <SelectItem value="electricidad">Instalación Eléctrica</SelectItem>
                          <SelectItem value="pintura">Pintura de Interiores</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="professional">Profesional</Label>
                      <Input
                        id="professional"
                        placeholder="Nombre del profesional"
                        value={newReview.professional}
                        onChange={(e) => setNewReview({...newReview, professional: e.target.value})}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Calificación del servicio</Label>
                    <div className="flex items-center gap-4">
                      {renderInteractiveStars(newReview.rating, (rating) => setNewReview({...newReview, rating}))}
                      <span className="text-sm text-gray-600">
                        {newReview.rating > 0 && `${newReview.rating} de 5 estrellas`}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="title">Título de tu reseña</Label>
                    <Input
                      id="title"
                      placeholder="Resume tu experiencia en pocas palabras"
                      value={newReview.title}
                      onChange={(e) => setNewReview({...newReview, title: e.target.value})}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="comment">Describe tu experiencia</Label>
                    <Textarea
                      id="comment"
                      placeholder="Cuéntanos qué tal fue el servicio, qué te gustó más, si recomendarías al profesional, etc."
                      rows={4}
                      value={newReview.comment}
                      onChange={(e) => setNewReview({...newReview, comment: e.target.value})}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Fotos (opcional)</Label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                      <Camera className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                      <p className="text-sm text-gray-600 mb-2">
                        Agrega fotos del trabajo realizado
                      </p>
                      <Button variant="outline" size="sm" type="button">
                        Seleccionar Fotos
                      </Button>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setShowAddReview(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={!newReview.service || !newReview.rating || !newReview.title || !newReview.comment}>
                      Publicar Reseña
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
          
          <div className="text-center mb-8">
            <h1 className="text-4xl mb-4">Reseñas de Clientes</h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Descubre lo que nuestros clientes opinan sobre los servicios que han recibido
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Card className="text-center">
              <CardContent className="p-6">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <span className="text-3xl">{averageRating.toFixed(1)}</span>
                  <Star className="w-6 h-6 fill-yellow-400 text-yellow-400" />
                </div>
                <div className="text-sm text-gray-600">Promedio General</div>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="p-6">
                <div className="text-3xl mb-2">{reviews.length}</div>
                <div className="text-sm text-gray-600">Total Reseñas</div>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="p-6">
                <div className="text-3xl mb-2">{reviews.filter(r => r.verified).length}</div>
                <div className="text-sm text-gray-600">Verificadas</div>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="p-6">
                <div className="text-3xl mb-2">98%</div>
                <div className="text-sm text-gray-600">Satisfacción</div>
              </CardContent>
            </Card>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  placeholder="Buscar reseñas..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Ordenar por" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Más Recientes</SelectItem>
                <SelectItem value="rating">Mejor Calificación</SelectItem>
                <SelectItem value="helpful">Más Útiles</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Service Tabs */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="mb-8">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-5">
            {serviceTypes.map((service) => (
              <TabsTrigger key={service.id} value={service.id} className="text-sm">
                {service.name}
                <Badge variant="secondary" className="ml-2">
                  {service.count}
                </Badge>
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={selectedTab} className="mt-6">
            {filteredReviews.length === 0 ? (
              <div className="text-center py-12">
                <MessageCircle className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-xl mb-2">No hay reseñas que coincidan</h3>
                <p className="text-gray-600">
                  Intenta con otros términos de búsqueda o explora otras categorías
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {filteredReviews.map((review) => (
                  <Card key={review.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      {/* Review Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-4">
                          <Avatar className="w-12 h-12">
                            <AvatarImage src={review.customer.avatar} />
                            <AvatarFallback>
                              {review.customer.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-medium">{review.customer.name}</h3>
                              {review.customer.verified && (
                                <CheckCircle className="w-4 h-4 text-blue-500" />
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              {review.serviceIcon}
                              <span>{review.service}</span>
                              <span>•</span>
                              <span>Con {review.professional.name}</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          {renderStars(review.rating)}
                          <div className="text-sm text-gray-500 mt-1">
                            {new Date(review.date).toLocaleDateString('es-CL')}
                          </div>
                        </div>
                      </div>

                      {/* Review Content */}
                      <div className="mb-4">
                        <h4 className="text-lg mb-2">{review.title}</h4>
                        <p className="text-gray-700 leading-relaxed">{review.comment}</p>
                      </div>

                      {/* Photos */}
                      {review.photos.length > 0 && (
                        <div className="mb-4">
                          <div className="flex gap-2 overflow-x-auto">
                            {review.photos.map((_, index) => (
                              <div key={index} className="flex-shrink-0">
                                <div className="w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center">
                                  <Camera className="w-6 h-6 text-gray-400" />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Professional Response */}
                      {review.professionalResponse && (
                        <div className="bg-blue-50 p-4 rounded-lg mb-4">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                              <User className="w-4 h-4 text-blue-600" />
                            </div>
                            <span className="font-medium text-blue-900">
                              Respuesta del profesional
                            </span>
                            <span className="text-sm text-blue-600">
                              {new Date(review.professionalResponse.date).toLocaleDateString('es-CL')}
                            </span>
                          </div>
                          <p className="text-blue-800">
                            {review.professionalResponse.message}
                          </p>
                        </div>
                      )}

                      {/* Review Actions */}
                      <div className="flex items-center justify-between pt-4 border-t">
                        <div className="flex items-center gap-4">
                          <Button variant="ghost" size="sm" className="text-gray-600">
                            <ThumbsUp className="w-4 h-4 mr-1" />
                            Útil ({review.helpful})
                          </Button>
                          {review.verified && (
                            <Badge variant="outline" className="text-green-600 border-green-200">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Verificada
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm text-gray-500">
                          {review.likes} personas encontraron esto útil
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* CTA Section */}
        <div className="mt-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-8 text-white text-center">
          <h2 className="text-2xl mb-4">¿Ya usaste nuestros servicios?</h2>
          <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
            Tu opinión es muy importante para nosotros y ayuda a otros usuarios a tomar mejores decisiones. 
            Comparte tu experiencia y ayuda a nuestra comunidad.
          </p>
          <Button 
            size="lg" 
            variant="secondary"
            onClick={() => setShowAddReview(true)}
            className="bg-white text-blue-600 hover:bg-gray-100"
          >
            <MessageCircle className="w-5 h-5 mr-2" />
            Escribir mi Reseña
          </Button>
        </div>
      </div>
    </div>
  )
}