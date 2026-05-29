import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import { Badge } from "./ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar"
import { 
  Search, 
  MapPin, 
  Star,
  Filter,
  CheckCircle
} from "lucide-react"
import { apiGet } from "../lib/api"

import { formatLocationName } from "../lib/locationFormatter"

interface AllServicesProps {
  onServiceSelect: (professional: any) => void
}

export default function AllServices({ onServiceSelect }: AllServicesProps) {
  const BIOBIO_REGION_NAME = "Biobío"
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedService, setSelectedService] = useState("")
  const [selectedRegion, setSelectedRegion] = useState(BIOBIO_REGION_NAME)
  const [selectedCommune, setSelectedCommune] = useState("")
  const [communes, setCommunes] = useState<string[]>([])
  const [priceRange, setPriceRange] = useState("")
  const [rating, setRating] = useState("")
  const [selectedGender, setSelectedGender] = useState("")
  const [selectedAgeRange, setSelectedAgeRange] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [professionals, setProfessionals] = useState<any[]>([])

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

  // Servicios disponibles
  /* const services = [
    { id: "gasfiteria", name: "Gasfitería", icon: Wrench },
    { id: "limpieza", name: "Limpieza del Hogar", icon: Home },
    { id: "jardineria", name: "Jardinería", icon: Scissors }
  ] */

  // Cargar comunas de Biobío desde la API
  useEffect(() => {
    const fetchCommunes = async () => {
      try {
        const regions: any[] = await apiGet("/api/geo/regiones/")
        const biobio = regions.find((r) =>
          r.nombre?.toLowerCase().includes("biob") || r.codigo === "VIII"
        )
        if (!biobio) return
        const comunas: any[] = await apiGet(`/api/geo/comunas/?region_id=${biobio.id}`)
        setCommunes(comunas.map((c: any) => c.nombre).sort((a, b) => a.localeCompare(b, "es")))
      } catch (e) {
        console.error("Failed to load communes", e)
      }
    }
    fetchCommunes()
  }, [])

  // Cargar servicios reales desde API
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      setError(null)
      try {
        // Construir query básica; filtros locales se aplican en cliente por ahora
        const list = await apiGet(`/api/services/search/`)
        setProfessionals(Array.isArray(list) ? list : [])
      } catch (e: any) {
        console.error('Failed to load services', e)
        setError('No se pudieron cargar los servicios')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  // Filtrar profesionales
  const filteredProfessionals = professionals.filter(prof => {
    const matchesSearch = prof.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         prof.service.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesService = !selectedService || selectedService === "all" || prof.service === selectedService
    const matchesRegion = !selectedRegion || selectedRegion === "all" || prof.region === selectedRegion
    const matchesCommune = !selectedCommune || selectedCommune === "all" || prof.commune === selectedCommune
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center items-center h-14 sm:h-16">
            <div className="flex items-center gap-2 sm:gap-3">
              <h1 className="text-base sm:text-xl truncate">Buscar Profesionales</h1>
              <Badge variant="outline" className="hidden sm:inline-flex">ServiHogar</Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Barra de búsqueda arriba */}
        <Card className="mb-6">
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
            </div>
          </CardContent>
        </Card>

        {/* Layout responsivo */}
        <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
          {/* Sidebar de filtros */}
          <div className="w-full lg:w-80 lg:flex-shrink-0">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="w-5 h-5" />
                  Filtros
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Filtro por Servicio */}
                <div className="space-y-2">
                  <Label>Servicio</Label>
                  <Select value={selectedService} onValueChange={setSelectedService}>
                    <SelectTrigger className="bg-white">
                      <SelectValue placeholder="Todos los servicios" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border shadow-lg">
                      <SelectItem value="all" className="hover:bg-gray-100 focus:bg-gray-100">Todos los servicios</SelectItem>
                      <SelectItem value="Gasfitería" className="hover:bg-gray-100 focus:bg-gray-100">Gasfitería</SelectItem>
                      <SelectItem value="Limpieza del Hogar" className="hover:bg-gray-100 focus:bg-gray-100">Limpieza del Hogar</SelectItem>
                      <SelectItem value="Jardinería" className="hover:bg-gray-100 focus:bg-gray-100">Jardinería</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Filtro por Región */}
                <div className="space-y-2">
                  <Label>Región</Label>
                  <Select value={selectedRegion} onValueChange={handleRegionChange} disabled>
                    <SelectTrigger className="bg-white">
                      <SelectValue placeholder={BIOBIO_REGION_NAME} />
                    </SelectTrigger>
                    <SelectContent className="bg-white border shadow-lg max-h-60 overflow-y-auto">
                      <SelectItem value={BIOBIO_REGION_NAME} className="hover:bg-gray-100 focus:bg-gray-100">
                        {BIOBIO_REGION_NAME}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Filtro por Comuna */}
                <div className="space-y-2">
                  <Label>Comuna</Label>
                  <Select 
                    value={selectedCommune} 
                    onValueChange={setSelectedCommune}
                    disabled={!selectedRegion || selectedRegion === "all"}
                  >
                    <SelectTrigger className="bg-white">
                      <SelectValue placeholder="Todas las comunas" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border shadow-lg max-h-60 overflow-y-auto">
                      <SelectItem value="all" className="hover:bg-gray-100 focus:bg-gray-100">Todas las comunas</SelectItem>
                      {communes.map((commune) => (
                        <SelectItem key={commune} value={commune} className="hover:bg-gray-100 focus:bg-gray-100">
                          {commune}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Filtro por Calificación */}
                <div className="space-y-2">
                  <Label>Calificación mínima</Label>
                  <Select value={rating} onValueChange={setRating}>
                    <SelectTrigger className="bg-white">
                      <SelectValue placeholder="Cualquier calificación" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border shadow-lg">
                      <SelectItem value="all" className="hover:bg-gray-100 focus:bg-gray-100">Cualquier calificación</SelectItem>
                      <SelectItem value="5" className="hover:bg-gray-100 focus:bg-gray-100">5 estrellas (4.8+)</SelectItem>
                      <SelectItem value="4" className="hover:bg-gray-100 focus:bg-gray-100">4+ estrellas</SelectItem>
                      <SelectItem value="3" className="hover:bg-gray-100 focus:bg-gray-100">3+ estrellas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Filtro por Rango de Precio */}
                <div className="space-y-2">
                  <Label>Rango de precio</Label>
                  <Select value={priceRange} onValueChange={setPriceRange}>
                    <SelectTrigger className="bg-white">
                      <SelectValue placeholder="Cualquier precio" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border shadow-lg">
                      <SelectItem value="all" className="hover:bg-gray-100 focus:bg-gray-100">Cualquier precio</SelectItem>
                      <SelectItem value="low" className="hover:bg-gray-100 focus:bg-gray-100">$10.000 - $20.000</SelectItem>
                      <SelectItem value="medium" className="hover:bg-gray-100 focus:bg-gray-100">$20.001 - $30.000</SelectItem>
                      <SelectItem value="high" className="hover:bg-gray-100 focus:bg-gray-100">$30.001+</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Filtro por Género */}
                <div className="space-y-2">
                  <Label>Género</Label>
                  <Select value={selectedGender} onValueChange={setSelectedGender}>
                    <SelectTrigger className="bg-white">
                      <SelectValue placeholder="Cualquier género" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border shadow-lg">
                      <SelectItem value="all" className="hover:bg-gray-100 focus:bg-gray-100">Cualquier género</SelectItem>
                      <SelectItem value="masculino" className="hover:bg-gray-100 focus:bg-gray-100">Masculino</SelectItem>
                      <SelectItem value="femenino" className="hover:bg-gray-100 focus:bg-gray-100">Femenino</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Filtro por Rango de Edad */}
                <div className="space-y-2">
                  <Label>Rango de edad</Label>
                  <Select value={selectedAgeRange} onValueChange={setSelectedAgeRange}>
                    <SelectTrigger className="bg-white">
                      <SelectValue placeholder="Cualquier edad" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border shadow-lg">
                      <SelectItem value="all" className="hover:bg-gray-100 focus:bg-gray-100">Cualquier edad</SelectItem>
                      <SelectItem value="18-30" className="hover:bg-gray-100 focus:bg-gray-100">18-30 años</SelectItem>
                      <SelectItem value="31-40" className="hover:bg-gray-100 focus:bg-gray-100">31-40 años</SelectItem>
                      <SelectItem value="41-50" className="hover:bg-gray-100 focus:bg-gray-100">41-50 años</SelectItem>
                      <SelectItem value="51+" className="hover:bg-gray-100 focus:bg-gray-100">51+ años</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Contenido principal - Lista de profesionales */}
          <div className="flex-1">
            {/* Contador de resultados */}
            <div className="mb-6">
              <p className="text-gray-600">
                {filteredProfessionals.length} profesional{filteredProfessionals.length !== 1 ? 'es' : ''} encontrado{filteredProfessionals.length !== 1 ? 's' : ''}
              </p>
            </div>

            {/* Lista de profesionales */}
            {loading && (
              <Card>
                <CardContent className="py-10 text-center text-gray-500">Cargando servicios...</CardContent>
              </Card>
            )}
            {error && !loading && (
              <Card>
                <CardContent className="py-10 text-center text-red-600">{error}</CardContent>
              </Card>
            )}
            <div className="grid gap-4">
              {!loading && !error && filteredProfessionals.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Search className="w-12 h-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-600 mb-2">
                      No se encontraron profesionales
                    </h3>
                    <p className="text-gray-500 text-center">
                      Intenta ajustar los filtros de búsqueda para obtener más resultados
                    </p>
                  </CardContent>
                </Card>
              ) : (
                filteredProfessionals.map((professional) => (
                  <Card key={professional.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex gap-6">
                        {/* Avatar y verificación */}
                        <div className="flex-shrink-0">
                          <div className="relative">
                            <Avatar className="w-20 h-20">
                              <AvatarImage src={professional.avatar} alt={professional.name} />
                              <AvatarFallback>
                                {professional.name.split(' ').map((n: string) => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            {professional.verified && (
                              <div className="absolute -bottom-1 -right-1 bg-green-600 rounded-full p-1">
                                <CheckCircle className="w-4 h-4 text-white" />
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Información principal */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h3 className="text-lg font-semibold">{professional.name}</h3>
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <MapPin className="w-4 h-4" />
                                  <span>
                                    {professional.commune && professional.region
                                      ? `${formatLocationName(professional.commune)}, ${formatLocationName(professional.region)}`
                                      : professional.location
                                        ? professional.location.split(',').map(formatLocationName).join(', ')
                                        : ''}
                                  </span>
                              </div>
                            </div>
                            <Badge variant="secondary">{professional.service}</Badge>
                          </div>

                          <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                            {professional.description}
                          </p>

                          {/* Calificación y reseñas */}
                          <div className="flex items-center gap-4 mb-3">
                            <div className="flex items-center gap-1">
                              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                              <span className="font-medium">{professional.rating}</span>
                              <span className="text-sm text-gray-500">
                                ({professional.reviews} reseñas)
                              </span>
                            </div>
                            <div className="text-sm text-gray-600">
                              {professional.experience} de experiencia
                            </div>
                          </div>

                          {/* Precio y botón de acción */}
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="text-2xl font-bold text-green-600">
                                ${professional.basePrice.toLocaleString()}
                              </span>
                              {professional.durationType === "range" && (
                                <p className="text-sm text-gray-500">
                                  Duración estimada: {formatDuration(professional.minDuration)}-{formatDuration(professional.maxDuration)}
                                </p>
                              )}
                              {professional.durationType === "fixed" && (
                                <p className="text-sm text-gray-500">
                                  Duración estimada: {formatDuration(professional.fixedDuration)}
                                </p>
                              )}
                            </div>
                            <Button 
                              onClick={() => onServiceSelect(professional)}
                              className="px-6"
                            >
                              Ver Servicio
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}