import { useEffect, useState } from "react"
import { useSearchParams } from "react-router-dom"
import { Button } from "../ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar"
import SearchTab from "./tabs/SearchTab"
import RequestsTab from "./tabs/RequestsTab"
import ProfileTab from "./tabs/ProfileTab"
import ProfessionalTabMultiService from "./tabs/ProfessionalTabMultiService"
import { apiGetAuth, apiPost, apiPostForm } from "../../lib/api"
import { toast } from "sonner"
import { 
  User, 
  LogOut, 
  Search, 
  Calendar,
  Briefcase
} from "lucide-react"

interface UserDashboardProps {
  user: any
  onLogout: () => void
}

export default function UserDashboard({ user, onLogout }: UserDashboardProps) {
  const [searchParams, setSearchParams] = useSearchParams()
  
  // Leer el tab principal desde la URL, o usar "search" por defecto
  const mainTabFromUrl = searchParams.get('mainTab') || 'search'
  const [activeTab, setActiveTab] = useState(mainTabFromUrl)
  
  // Estado de solicitud profesional: none | pending | rejected | approved
  const [professionalStatus, setProfessionalStatus] = useState<'none' | 'pending' | 'rejected' | 'approved'>('none')
  const [rejectionReason, setRejectionReason] = useState<string | null>(null)

  // Mis solicitudes reales (como cliente)
  const [serviceRequests, setServiceRequests] = useState<any[]>([])

  // Función para cambiar de tab (actualiza estado y URL)
  const handleTabChange = (newTab: string) => {
    setActiveTab(newTab)
    
    // Si cambia a "professional", agregar por defecto el subtab "overview"
    if (newTab === 'professional') {
      setSearchParams({ mainTab: 'professional', subTab: 'overview' }, { replace: true })
    } else {
      setSearchParams({ mainTab: newTab }, { replace: true })
    }
  }

  // Datos simulados de solicitudes COMO PROFESIONAL (servicios que le han reservado)
  // Solo existen si el usuario ya es profesional
  // Reservas recibidas como profesional
  const [professionalBookings, setProfessionalBookings] = useState<any[]>([])

  // Cargar "Mis Solicitudes" reales desde backend
  useEffect(() => {
    const load = async () => {
      try {
        const clientReqs = await apiGetAuth('/api/my/requests/?as=client')
        // Mapea incluyendo estado de reseña si existe para deshabilitar el botón tras refresco
        setServiceRequests((clientReqs || []).map((r: any) => ({
          id: r.id,
          professional: r.professional,
          service: r.service,
          date: r.date,
          time: r.time,
          status: r.status,
          price: r.price,
          region: r.region || '',
          comuna: r.comuna || '',
          rating: typeof r.rating === 'number' ? r.rating : null,
          review: r.comentario || null,
        })))
      } catch {
        setServiceRequests([])
      }

      if (user.isProfessional) {
        try {
          const profReqs = await apiGetAuth('/api/my/requests/?as=professional')
          setProfessionalBookings((profReqs || []).map((r: any) => ({
            id: r.id,
            client: r.client,
            service: r.service,
            date: r.date,
            time: r.time,
            status: r.status,
            price: r.price,
            address: r.address,
            phone: r.phone,
            description: r.description || '',
            region: r.region || '',
            comuna: r.comuna || '',
          })))
        } catch {
          setProfessionalBookings([])
        }
      } else {
        setProfessionalBookings([])
      }
    }
    load()
  }, [user.isProfessional])

  // Acciones del profesional sobre reservas
  const handleConfirmBooking = async (id: string) => {
    try {
      await apiPost(`/api/requests/${id}/confirm/`, {}, { auth: true })
      setProfessionalBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'Confirmado' } : b))
    } catch (e) {
      console.error('No se pudo confirmar la solicitud', e)
      toast.error('No se pudo confirmar la solicitud. Intenta nuevamente.')
    }
  }

  const handleCancelBooking = async (id: string, reason: string) => {
    try {
      await apiPost(`/api/requests/${id}/cancel/`, { razon: reason }, { auth: true })
      setProfessionalBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'Cancelado' } : b))
    } catch (e: any) {
      console.error('No se pudo cancelar la solicitud', e)
      const errorMsg = e?.response?.data?.message || 'No se pudo cancelar la solicitud. Intenta nuevamente.'
      toast.error(errorMsg)
    }
  }

  // Cancelación por parte del cliente en "Mis Solicitudes"
  const handleCancelClientRequest = async (id: string, reason: string) => {
    try {
      await apiPost(`/api/requests/${id}/cancel/`, { razon: reason }, { auth: true })
      setServiceRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'Cancelado' } : r))
    } catch (e: any) {
      console.error('No se pudo cancelar la solicitud (cliente)', e)
      const errorMsg = e?.response?.data?.message || 'No se pudo cancelar la solicitud. Intenta nuevamente.'
      toast.error(errorMsg)
    }
  }

  // Simular datos del perfil profesional multiservicio si ya es profesional
  const [userProfessionalProfile, setUserProfessionalProfile] = useState(
    user.isProfessional ? {
      id: "profile-001",
      userId: user.id,
      generalDescription: "",
      generalVerificationStatus: "approved" as const,
      averageRating: 0,
      totalJobs: 0,
      totalEarnings: 0,
      isActive: true,
      acceptsNewJobs: true,
      services: [] as any[]
    } : null
  )

  // Cargar estado real del perfil/servicios del usuario y decidir si habilitar panel profesional
  useEffect(() => {
    let ignore = false
    ;(async () => {
      try {
        const data = await apiGetAuth('/api/my/services/')
        if (ignore) return
        const normalizeStatus = (v: any): 'pending' | 'approved' | 'rejected' | 'suspended' => {
          const s = (typeof v === 'string' ? v : '').toLowerCase()
          if (s === 'aprobado' || s === 'approved') return 'approved'
          if (s === 'rechazado' || s === 'rejected') return 'rejected'
          if (s === 'suspendido' || s === 'suspended') return 'suspended'
          return 'pending'
        }
        // Construir perfil mínimo desde datos reales (solo si ya está aprobado)
        const mappedServices = (data.servicios || []).map((s: any) => ({
          id: s.id_servicio_profesional,
          categoryId: s.categoria, // solo nombre por ahora
          categoryName: s.categoria,
          experience: s.anos_experiencia,
          description: s.descripcion,
          durationType: s.tipo_duracion === 'fija' ? 'fixed' : 'range',  // Mapear a inglés
          fixedDuration: s.duracion_fija_minutos || 0,
          minDuration: s.duracion_minima_minutos || 0,
          maxDuration: s.duracion_maxima_minutos || 0,
          priceFixed: s.precio_fijo,
          // Visibilidad en buscador controlada por backend; si no viene, fallback a aprobado
          isActive: (typeof s.visible === 'boolean') ? !!s.visible : (s.estado_verificacion === 'aprobado'),
          isAvailable: s.estado_verificacion === 'aprobado',
          verificationStatus: normalizeStatus(s.estado_verificacion),
          razon_rechazo: s.razon_rechazo,
          rating: typeof s.calificacion_promedio === 'number' ? s.calificacion_promedio : 0,
          completedJobs: typeof s.completados === 'number' ? s.completados : 0,
          totalEarnings: 0,
        }))
        const estadoRaw: string | null = data.estado_general || null
        const estado = (estadoRaw || '').toLowerCase()
        const stats = data.estadisticas || { trabajos_completados: 0, calificacion_promedio: 0.0, ganancias_totales: 0 }
        
        if (estado === 'aprobado' || estado === 'approved') {
          const profile = {
            id: 'profile-remote',
            userId: user.id,
            generalDescription: '',
            generalVerificationStatus: 'approved' as const,
            averageRating: stats.calificacion_promedio || 0,
            totalJobs: stats.trabajos_completados || 0,
            totalEarnings: stats.ganancias_totales || 0,
            isActive: true,
            acceptsNewJobs: true,
            services: mappedServices,
          }
          setUserProfessionalProfile(profile as any)
          setProfessionalStatus('approved')
          user.isProfessional = true
          setRejectionReason(null)
        } else if (estado === 'pendiente' || estado === 'pending') {
          setProfessionalStatus('pending')
          setUserProfessionalProfile(null)
          setRejectionReason(null)
        } else if (estado === 'rechazado' || estado === 'rejected') {
          setProfessionalStatus('rejected')
          setUserProfessionalProfile(null)
          // Tomar el motivo del último servicio rechazado si existe
          const rej = mappedServices.find((s: any) => s.verificationStatus === 'rechazado' && s.razon_rechazo)
          setRejectionReason(rej?.razon_rechazo || 'Solicitud rechazada por verificación')
        } else {
          setProfessionalStatus('none')
          setUserProfessionalProfile(null)
          setRejectionReason(null)
        }
      } catch (err) {
        console.error('[my/services] Error al cargar perfil profesional:', err)
        // Si 400 (no tiene usuario en dominio) o 401, ignorar
      }
    })()
    return () => { ignore = true }
  }, [])

  // La pestaña de búsqueda ahora consume el endpoint público /api/services/search/ directamente

  const handleMarkAsCompleted = async (requestId: string) => {
    try {
      await apiPost(`/api/requests/${requestId}/complete/`, {}, { auth: true })
      
      // Actualizar el estado local
      setServiceRequests(prev => 
        prev.map(req => 
          req.id === requestId 
            ? { ...req, status: "Completado" }
            : req
        )
      )
      
      // Proceso completado exitosamente - sin mensaje emergente
    } catch (e: any) {
      console.error('Error al marcar como completado:', e)
      toast.error(e.message || 'No se pudo marcar como completado. Intenta nuevamente.')
    }
  }

  const handleSubmitReview = async (reviewData: any) => {
    try {
      const payload = {
        comentario: (reviewData.comment || '').trim(),
        calificacion_calidad: reviewData.calificacion_calidad || reviewData.ratings?.calificacion_calidad || 0,
        calificacion_puntualidad: reviewData.calificacion_puntualidad || reviewData.ratings?.calificacion_puntualidad || 0,
        calificacion_comunicacion: reviewData.calificacion_comunicacion || reviewData.ratings?.calificacion_comunicacion || 0,
      }
      await apiPost(`/api/requests/${reviewData.serviceRequestId}/review/`, payload, { auth: true })
      setServiceRequests(prev => 
        prev.map(req => 
          req.id === reviewData.serviceRequestId 
            ? { 
                ...req, 
                rating: reviewData.averageRating,
                review: reviewData.comment,
                detailedRatings: reviewData.ratings
              }
            : req
        )
      )
    } catch (e: any) {
      toast.error(e?.message || 'No se pudo enviar la reseña. Intenta nuevamente.')
    }
  }

  const handleUpdateUser = (userData: any) => {
    // En una app real esto se enviaría al backend
    console.log("Actualizando datos de usuario:", userData)
  }

  const handleUpdateProfessionalProfile = (profile: any) => {
    setUserProfessionalProfile(profile)
  }

  const handleBecomeProfessional = async (profileData: any) => {
    // Enviar solicitud real al backend para crear perfil y primer servicio en estado pendiente
    try {
      const firstService = profileData.services?.[0]
      if (!firstService) throw new Error('Falta el primer servicio')
      // Si vienen archivos adjuntos en profileData, enviar como multipart/form-data
      if (profileData.__files) {
        const fd = new FormData()
        fd.append('general_description', profileData.generalDescription || '')
        fd.append('category_slug', (firstService.categoryId || '').toString())
        fd.append('experience', firstService.experience || '')
        fd.append('description', firstService.description || '')
        fd.append('duration_type', firstService.durationType || 'fixed')
        if (firstService.fixedDuration != null) fd.append('fixed_duration', String(firstService.fixedDuration))
        if (firstService.minDuration != null) fd.append('min_duration', String(firstService.minDuration))
        if (firstService.maxDuration != null) fd.append('max_duration', String(firstService.maxDuration))
        fd.append('price_fixed', String(firstService.priceFixed))
        if (profileData.__files.certificate) {
          fd.append('certificate', profileData.__files.certificate)
        }
        if (Array.isArray(profileData.__files.experience)) {
          for (const f of profileData.__files.experience) {
            fd.append('experience_docs', f)
          }
        }
        await apiPostForm('/api/professional/apply/', fd, { auth: true })
      } else {
        await apiPost('/api/professional/apply/', {
          general_description: profileData.generalDescription,
          category_slug: (firstService.categoryId || '').toString(),
          experience: firstService.experience,
          description: firstService.description,
          duration_type: firstService.durationType,
          fixed_duration: firstService.fixedDuration,
          min_duration: firstService.minDuration,
          max_duration: firstService.maxDuration,
          price_fixed: firstService.priceFixed,
        }, { auth: true })
      }
      // No habilitar panel ni marcar como profesional hasta que verificador apruebe
      setProfessionalStatus('pending')
      setUserProfessionalProfile(null)
      if (activeTab !== 'professional') setActiveTab('professional')
    } catch (e: any) {
      toast.error(e?.message || 'Error desconocido')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
  <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-3 sm:py-4">
            <div className="flex items-center space-x-3 sm:space-x-4 min-w-0 flex-1">
              <Avatar className="w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback>
                  <User className="w-5 h-5 sm:w-6 sm:h-6" />
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <h1 className="text-lg sm:text-xl font-semibold text-gray-900 truncate">
                  Bienvenido, {user.name}
                </h1>
                <p className="text-xs sm:text-sm text-gray-500">Panel de Usuario</p>
              </div>
            </div>
            <Button 
              variant="outline" 
              onClick={onLogout}
              className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 flex-shrink-0"
              size="sm"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Cerrar Sesión</span>
              <span className="sm:hidden">Salir</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
  <div className="w-full px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4 sm:space-y-6">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto">
            <TabsTrigger value="search" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 sm:py-3 text-xs sm:text-sm">
              <Search className="w-4 h-4" />
              <span className="hidden sm:inline">Buscar Servicios</span>
              <span className="sm:hidden">Buscar</span>
            </TabsTrigger>
            <TabsTrigger value="requests" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 sm:py-3 text-xs sm:text-sm">
              <Calendar className="w-4 h-4" />
              <span className="hidden sm:inline">Mis Solicitudes</span>
              <span className="sm:hidden">Solicitudes</span>
            </TabsTrigger>
            <TabsTrigger value="profile" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 sm:py-3 text-xs sm:text-sm">
              <User className="w-4 h-4" />
              <span className="hidden sm:inline">Mi Perfil</span>
              <span className="sm:hidden">Perfil</span>
            </TabsTrigger>
            <TabsTrigger value="professional" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 sm:py-3 text-xs sm:text-sm">
              <Briefcase className="w-4 h-4" />
              <span className="hidden sm:inline">{user.isProfessional ? "Panel Profesional" : "Ser Profesional"}</span>
              <span className="sm:hidden">{user.isProfessional ? "Profesional" : "Unirse"}</span>
            </TabsTrigger>
          </TabsList>

          {/* Search Services Tab */}
          <TabsContent value="search">
            <SearchTab 
              user={user}
            />
          </TabsContent>

          {/* Requests Tab */}
          <TabsContent value="requests">
            <RequestsTab 
              serviceRequests={serviceRequests}
              professionalBookings={professionalBookings}
              onMarkAsCompleted={handleMarkAsCompleted}
              onSubmitReview={handleSubmitReview}
              onConfirmBooking={handleConfirmBooking}
              onCancelBooking={handleCancelBooking}
              onCancelClient={handleCancelClientRequest}
            />
          </TabsContent>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <ProfileTab 
              user={user}
              onUpdateUser={handleUpdateUser}
            />
          </TabsContent>

          {/* Professional Tab */}
          <TabsContent value="professional">
            {/* Estado de solicitud: pendiente o rechazada */}
            {professionalStatus === 'pending' && (
              <div className="mb-4 p-3 border border-yellow-200 bg-yellow-50 rounded-md text-sm text-yellow-800">
                Tu solicitud para crear el perfil profesional está en revisión. Te avisaremos cuando sea aprobada.
              </div>
            )}
            {professionalStatus === 'rejected' && (
              <div className="mb-4 p-3 border border-red-200 bg-red-50 rounded-md text-sm text-red-700">
                Tu última solicitud fue rechazada. Motivo: {rejectionReason}
              </div>
            )}
            <ProfessionalTabMultiService 
              user={user}
              userProfessionalProfile={userProfessionalProfile}
              onUpdateProfessionalProfile={handleUpdateProfessionalProfile}
              onBecomeProfessional={handleBecomeProfessional}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}