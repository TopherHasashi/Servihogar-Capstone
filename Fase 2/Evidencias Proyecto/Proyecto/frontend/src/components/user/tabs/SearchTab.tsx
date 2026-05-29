import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../ui/card"
import { Button } from "../../ui/button"
import { Input } from "../../ui/input"
import { Label } from "../../ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../ui/select"
import { Badge } from "../../ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "../../ui/avatar"
import ServiceBooking from "../ServiceBooking"
import { apiGet, apiGetAuth } from "../../../lib/api"
import { 
  Search, 
  MapPin, 
  Star,
  Filter,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  X
} from "lucide-react"

interface SearchTabProps {
  professionals?: any[]
  user?: any
  onServiceSelect?: (professional: any) => void
}

export default function SearchTab({ professionals: initialProfessionals = [], user }: SearchTabProps) {
  const BIOBIO_REGION_LABEL = "Región del Biobío"
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedService, setSelectedService] = useState("")
  const [selectedRegion, setSelectedRegion] = useState("")
  const [selectedCommune, setSelectedCommune] = useState("")
  const [priceRange, setPriceRange] = useState("")
  const [rating, setRating] = useState("")
  const [selectedGender, setSelectedGender] = useState("")
  const [selectedAgeRange, setSelectedAgeRange] = useState("")
  const [showServiceBooking, setShowServiceBooking] = useState(false)
  const [selectedProfessional, setSelectedProfessional] = useState<any>(null)
  const [items, setItems] = useState<any[]>(initialProfessionals)
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [regions, setRegions] = useState<Array<{ id: string; nombre: string; codigo?: string }>>([])
  const [communes, setCommunes] = useState<Array<{ id: string; nombre: string; codigo?: string }>>([])
  const [loadingRegions, setLoadingRegions] = useState<boolean>(false)
  const [loadingCommunes, setLoadingCommunes] = useState<boolean>(false)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const normalizeText = (value: string) =>
    value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()

  // Mapeo nombre de servicio -> slug de categoría usado por el backend
  const serviceNameToSlug: Record<string, string> = useMemo(() => ({
    "Gasfitería": "gasfiteria",
    "Limpieza del Hogar": "limpieza",
    "Jardinería": "jardineria",
  }), [])

  // Cargar regiones al montar
  useEffect(() => {
    let ignore = false
    setLoadingRegions(true)
    apiGet('/api/geo/regiones/')
      .then((data) => {
        if (ignore) return
        const list = Array.isArray(data) ? data : []
        setRegions(list.map((r: any) => ({ id: String(r.id), nombre: r.nombre, codigo: r.codigo })))
      })
      .catch(() => {})
      .finally(() => { if (!ignore) setLoadingRegions(false) })
    return () => { ignore = true }
  }, [])

  const availableRegions = useMemo(
    () => regions.filter((r) => normalizeText(r.nombre).includes("biobio")),
    [regions]
  )

  useEffect(() => {
    if (!selectedRegion && availableRegions.length === 1) {
      setSelectedRegion(availableRegions[0].id)
      setSelectedCommune("")
    }
  }, [availableRegions, selectedRegion])

  // Cargar comunas cuando cambie la región seleccionada
  useEffect(() => {
    let ignore = false
    setCommunes([])
    if (!selectedRegion || selectedRegion === 'all') return
    setLoadingCommunes(true)
    apiGet(`/api/geo/comunas/?region_id=${encodeURIComponent(selectedRegion)}`)
      .then((data) => {
        if (ignore) return
        const list = Array.isArray(data) ? data : []
        setCommunes(list.map((c: any) => ({ id: String(c.id), nombre: c.nombre, codigo: c.codigo })))
      })
      .catch(() => {})
      .finally(() => { if (!ignore) setLoadingCommunes(false) })
    return () => { ignore = true }
  }, [selectedRegion])

  // Construir y hacer fetch cuando cambien filtros (lado servidor)
  useEffect(() => {
    let ignore = false
    const controller = new AbortController()

    const timeout = setTimeout(async () => {
      setLoading(true)
      setError(null)
      try {
        const params = new URLSearchParams()
        const q = (searchQuery || '').trim()
        if (q) params.set('q', q)

        const svc = (selectedService || '').trim()
        if (svc && svc !== 'all') {
          const slug = serviceNameToSlug[svc]
          if (slug) params.set('category_slug', slug)
        }

  const reg = (selectedRegion || '').trim()
  if (reg && reg !== 'all') params.set('region_id', reg)

  const com = (selectedCommune || '').trim()
  if (com && com !== 'all') params.set('comuna_id', com)

        // Precio
        if (priceRange && priceRange !== 'all') {
          if (priceRange === 'low') {
            params.set('min_price', '10000')
            params.set('max_price', '20000')
          } else if (priceRange === 'medium') {
            params.set('min_price', '20001')
            params.set('max_price', '30000')
          } else if (priceRange === 'high') {
            params.set('min_price', '30001')
          }
        }

        const qs = params.toString()
        const path = `/api/services/search/${qs ? `?${qs}` : ''}`
        const data = await apiGetAuth(path)
        if (ignore) return
        setItems(Array.isArray(data) ? data : [])
        setCurrentPage(1) // Resetear a la primera página cuando cambien los filtros
      } catch (e: any) {
        if (ignore) return
        if (e?.name !== 'AbortError') setError(e?.message || 'No se pudieron cargar los servicios')
      } finally {
        if (ignore) return
        setLoading(false)
      }
    }, 300) // debounce

    return () => {
      ignore = true
      controller.abort()
      clearTimeout(timeout)
    }
  }, [searchQuery, selectedService, selectedRegion, selectedCommune, priceRange, serviceNameToSlug])

  // Calcular items paginados
  const totalPages = Math.ceil(items.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const _paginatedItems = items.slice(startIndex, endIndex)

  // Generar array de números de página para mostrar
  const getPageNumbers = () => {
    const pages = []
    const maxVisible = 5 // Máximo de números de página visibles
    
    if (totalPages <= maxVisible) {
      // Mostrar todas las páginas si son pocas
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      // Lógica para mostrar páginas con puntos suspensivos
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, '...', totalPages)
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages)
      } else {
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages)
      }
    }
    return pages
  }

  // Función para convertir minutos a formato de horas
  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    
    if (mins === 0) {
      return `${hours}h`
    } else {
      return `${hours}h${mins}min`
    }
  }

  // Servicios disponibles (no usado actualmente)
  // const services = [
  //   { id: "gasfiteria", name: "Gasfitería", icon: Wrench },
  //   { id: "limpieza", name: "Limpieza del Hogar", icon: Home },
  //   { id: "jardineria", name: "Jardinería", icon: Scissors }
  // ]

  // Nombres seleccionados (para comparaciones locales si fuera necesario)
  const selectedRegionName = useMemo(() => regions.find(r => r.id === selectedRegion)?.nombre, [regions, selectedRegion])
  const selectedCommuneName = useMemo(() => communes.find(c => c.id === selectedCommune)?.nombre, [communes, selectedCommune])

  // Filtrar profesionales
  const source = items && items.length > 0 ? items : initialProfessionals
  const filteredProfessionals = source.filter(prof => {
    const matchesSearch = prof.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         prof.service.toLowerCase().includes(searchQuery.toLowerCase())
    // Estos ya se filtran en el servidor, pero los mantenemos por seguridad si llegan datos cacheados
    const matchesService = !selectedService || selectedService === "all" || prof.service === selectedService
  const matchesRegion = !selectedRegion || selectedRegion === "all" || (selectedRegionName ? prof.region === selectedRegionName : true)
  const matchesCommune = !selectedCommune || selectedCommune === "all" || (selectedCommuneName ? prof.commune === selectedCommuneName : true)
    const matchesRating = !rating || rating === "all" || 
                         (rating === "5" && prof.rating >= 4.8) ||
                         (rating === "4" && prof.rating >= 4.0) ||
                         (rating === "3" && prof.rating >= 3.0)
    const matchesPrice = !priceRange || priceRange === "all" ||
                        (priceRange === "low" && prof.basePrice >= 10000 && prof.basePrice <= 20000) ||
                        (priceRange === "medium" && prof.basePrice > 20000 && prof.basePrice <= 30000) ||
                        (priceRange === "high" && prof.basePrice > 30000)
    const matchesGender = !selectedGender || selectedGender === "all" || prof.gender === selectedGender
    const matchesAge = !selectedAgeRange || selectedAgeRange === "all" ||
                      (selectedAgeRange === "18-30" && prof.age >= 18 && prof.age <= 30) ||
                      (selectedAgeRange === "31-40" && prof.age >= 31 && prof.age <= 40) ||
                      (selectedAgeRange === "41-50" && prof.age >= 41 && prof.age <= 50) ||
                      (selectedAgeRange === "51+" && prof.age >= 51)
    
    return matchesSearch && matchesService && matchesRegion && matchesCommune && matchesRating && matchesPrice && matchesGender && matchesAge
  })

  // Limpiar comuna cuando cambia la región
  const handleRegionChange = (value: string) => {
    setSelectedRegion(value)
    setSelectedCommune("") // Limpiar comuna seleccionada cuando cambia la región
  }

  const clearAllFilters = () => {
    setSearchQuery("")
    setSelectedService("")
    setSelectedRegion(availableRegions[0]?.id ?? "")
    setSelectedCommune("")
    setPriceRange("")
    setRating("")
    setSelectedGender("")
    setSelectedAgeRange("")
    setCurrentPage(1)
  }

  const handleBookService = (professional: any) => {
    setSelectedProfessional(professional)
    setShowServiceBooking(true)
  }

  if (showServiceBooking && selectedProfessional) {
    return (
      <ServiceBooking
        professional={selectedProfessional}
        user={user}
        onBack={() => {
          setShowServiceBooking(false)
          setSelectedProfessional(null)
        }}
        onBookingComplete={(booking: any) => {
          console.log('Reserva completada:', booking)
          setShowServiceBooking(false)
          setSelectedProfessional(null)
          // Aquí podrías actualizar el estado global o redirigir
        }}
      />
    )
  }

  return (
    <div className="space-y-6">
      {/* Barra de búsqueda arriba */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            Buscar Profesionales
          </CardTitle>
          <CardDescription>
            Encuentra el profesional perfecto para tu hogar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="search">Buscar</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                id="search"
                placeholder="Nombre o servicio..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            {loading && (
              <p className="text-xs text-gray-500">Cargando servicios...</p>
            )}
            {error && (
              <p className="text-xs text-red-600">{error}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Layout responsivo */}
      <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
        {/* Sidebar de filtros */}
        <div className="w-full lg:w-80 lg:flex-shrink-0">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Filter className="w-5 h-5" />
                  Filtros
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAllFilters}
                  className="text-xs"
                >
                  <X className="w-4 h-4 mr-1" />
                  Limpiar
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 lg:space-y-4">
              {/* Filtro por Servicio */}
              <div className="space-y-2">
                <Label>Servicio</Label>
                <Select value={selectedService} onValueChange={setSelectedService}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos los servicios" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los servicios</SelectItem>
                    <SelectItem value="Gasfitería">Gasfitería</SelectItem>
                    <SelectItem value="Limpieza del Hogar">Limpieza del Hogar</SelectItem>
                    <SelectItem value="Jardinería">Jardinería</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Filtro por Región */}
              <div className="space-y-2">
                <Label>Región</Label>
                <Select
                  value={selectedRegion}
                  onValueChange={handleRegionChange}
                  disabled={availableRegions.length === 1}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={BIOBIO_REGION_LABEL} />
                  </SelectTrigger>
                  <SelectContent>
                    {availableRegions.map(r => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {loadingRegions && (
                  <p className="text-xs text-gray-500">Cargando regiones...</p>
                )}
              </div>

              {/* Filtro por Comuna */}
              <div className="space-y-2">
                <Label>Comuna</Label>
                <Select 
                  value={selectedCommune} 
                  onValueChange={setSelectedCommune}
                  disabled={!selectedRegion || selectedRegion === "all"}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todas las comunas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las comunas</SelectItem>
                    {communes.map(c => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {loadingCommunes && (
                  <p className="text-xs text-gray-500">Cargando comunas...</p>
                )}
              </div>

              {/* Filtro por Calificación */}
              <div className="space-y-2">
                <Label>Calificación mínima</Label>
                <Select value={rating} onValueChange={setRating}>
                  <SelectTrigger>
                    <SelectValue placeholder="Cualquier calificación" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Cualquier calificación</SelectItem>
                    <SelectItem value="5">5 estrellas (4.8+)</SelectItem>
                    <SelectItem value="4">4+ estrellas</SelectItem>
                    <SelectItem value="3">3+ estrellas</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Filtro por Rango de Precio */}
              <div className="space-y-2">
                <Label>Rango de precio</Label>
                <Select value={priceRange} onValueChange={setPriceRange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Cualquier precio" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Cualquier precio</SelectItem>
                    <SelectItem value="low">$10.000 - $20.000</SelectItem>
                    <SelectItem value="medium">$20.001 - $30.000</SelectItem>
                    <SelectItem value="high">$30.001+</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Filtro por Género */}
              <div className="space-y-2">
                <Label>Género</Label>
                <Select value={selectedGender} onValueChange={setSelectedGender}>
                  <SelectTrigger>
                    <SelectValue placeholder="Cualquier género" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Cualquier género</SelectItem>
                    <SelectItem value="masculino">Masculino</SelectItem>
                    <SelectItem value="femenino">Femenino</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Filtro por Rango de Edad */}
              <div className="space-y-2">
                <Label>Rango de edad</Label>
                <Select value={selectedAgeRange} onValueChange={setSelectedAgeRange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Cualquier edad" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Cualquier edad</SelectItem>
                    <SelectItem value="18-30">18-30 años</SelectItem>
                    <SelectItem value="31-40">31-40 años</SelectItem>
                    <SelectItem value="41-50">41-50 años</SelectItem>
                    <SelectItem value="51+">51+ años</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Área principal - Lista de profesionales */}
        <div className="flex-1">
          {loading ? (
            <Card>
              <CardContent className="py-8 sm:py-12">
                <p className="text-sm text-gray-600">Cargando resultados...</p>
              </CardContent>
            </Card>
          ) : filteredProfessionals.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-8 sm:py-12">
                <Search className="w-8 h-8 sm:w-12 sm:h-12 text-gray-400 mb-3 sm:mb-4" />
                <h3 className="text-base sm:text-lg font-semibold text-gray-600 mb-2">
                  No se encontraron profesionales
                </h3>
                <p className="text-sm sm:text-base text-gray-500 text-center">
                  Intenta ajustar los filtros de búsqueda para obtener más resultados
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm sm:text-base text-gray-600">
                  {filteredProfessionals.length} profesional{filteredProfessionals.length !== 1 ? 'es' : ''} encontrado{filteredProfessionals.length !== 1 ? 's' : ''}
                </p>
              </div>
              
              <div className="grid gap-3 sm:gap-4">
                {filteredProfessionals.map((professional) => (
                  <Card key={professional.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4 sm:p-6">
                      <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
                        {/* Avatar y verificación */}
                        <div className="flex-shrink-0 self-center sm:self-start">
                          <div className="relative">
                            <Avatar className="w-16 h-16 sm:w-20 sm:h-20">
                              <AvatarImage src={professional.avatar} alt={professional.name} />
                              <AvatarFallback>
                                {professional.name.split(' ').map((n: string) => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            {professional.verified && (
                              <div className="absolute -bottom-1 -right-1 bg-green-600 rounded-full p-1">
                                <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Información principal */}
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-2 sm:mb-3">
                            <div className="mb-2 sm:mb-0">
                              <h3 className="text-base sm:text-lg font-semibold">{professional.name}</h3>
                              <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                                <MapPin className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                                <span className="truncate">{professional.location}</span>
                              </div>
                            </div>
                            <Badge variant="secondary" className="self-start text-xs">{professional.service}</Badge>
                          </div>

                          <p className="text-gray-600 text-xs sm:text-sm mb-3 line-clamp-2">
                            {professional.description}
                          </p>

                          {/* Calificación y reseñas */}
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-3">
                            <div className="flex items-center gap-1">
                              <Star className="w-3 h-3 sm:w-4 sm:h-4 fill-yellow-400 text-yellow-400" />
                              <span className="font-medium text-sm">{professional.rating}</span>
                              <span className="text-xs sm:text-sm text-gray-500">
                                ({professional.reviews} reseña{professional.reviews !== 1 ? 's' : ''})
                              </span>
                            </div>
                            <div className="text-xs sm:text-sm text-gray-600">
                              {professional.experience} de experiencia
                            </div>
                          </div>

                          {/* Precio y botón de acción */}
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                            <div>
                              <span className="text-lg sm:text-2xl font-bold text-green-600">
                                ${professional.basePrice.toLocaleString()}
                              </span>
                              {professional.durationType === "range" && (
                                <p className="text-xs sm:text-sm text-gray-500">
                                  Duración estimada: {formatDuration(professional.minDuration)}-{formatDuration(professional.maxDuration)}
                                </p>
                              )}
                              {professional.durationType === "fixed" && (
                                <p className="text-xs sm:text-sm text-gray-500">
                                  Duración estimada: {formatDuration(professional.fixedDuration)}
                                </p>
                              )}
                            </div>
                            <Button 
                              onClick={() => handleBookService(professional)}
                              className="px-4 sm:px-6 w-full sm:w-auto"
                              size="sm"
                            >
                              <span className="sm:hidden">Reservar</span>
                              <span className="hidden sm:inline">Reservar Servicio</span>
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Paginación */}
              <div className="flex items-center justify-center gap-2 mt-6">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                
                <div className="flex gap-1">
                  {getPageNumbers().map((page, idx) => (
                    typeof page === 'number' ? (
                      <Button
                        key={idx}
                        variant={currentPage === page ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(page)}
                        className="min-w-[40px]"
                      >
                        {page}
                      </Button>
                    ) : (
                      <span key={idx} className="flex items-center px-2 text-gray-400">
                        {page}
                      </span>
                    )
                  ))}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages || totalPages === 0}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}