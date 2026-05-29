import { useEffect, useRef, useState } from "react"
import { useSearchParams } from "react-router-dom"
import { API_URL, apiPostForm, apiPutAuth } from "../../../lib/api"
import { toast } from "sonner"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../../ui/alert-dialog"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../ui/card"
import { Button } from "../../ui/button"
import { Input } from "../../ui/input"
import { Label } from "../../ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../ui/select"
import { Textarea } from "../../ui/textarea"
import { Badge } from "../../ui/badge"
import { Alert, AlertDescription } from "../../ui/alert"
import { Switch } from "../../ui/switch"
import ProfessionalScheduleManagerAdvanced from "../ProfessionalScheduleManagerAdvanced"
import { Separator } from "../../ui/separator"
import { 
  Briefcase,
  Star,
  CheckCircle,
  Edit,
  Save,
  X,
  Plus,
  Upload,
  FileText,
  AlertCircle,
  Eye,
  EyeOff
} from "lucide-react"

interface ProfessionalService {
  id: string
  categoryId: string
  categoryName: string
  experience: string
  description: string
  durationType: 'fixed' | 'range'
  fixedDuration?: number
  minDuration?: number
  maxDuration?: number
  priceFixed: number
  isActive: boolean
  isAvailable: boolean
  verificationStatus: 'pending' | 'approved' | 'rejected' | 'suspended'
  rating: number
  completedJobs: number
  totalEarnings: number
}

interface ProfessionalProfile {
  id: string
  userId: string
  generalDescription: string
  professionalPhone?: string // Opcional, no se usa
  generalVerificationStatus: 'pending' | 'approved' | 'rejected' | 'suspended'
  averageRating: number
  totalJobs: number
  totalEarnings: number
  isActive: boolean
  acceptsNewJobs: boolean
  services: ProfessionalService[]
}

interface ProfessionalTabMultiServiceProps {
  user: any
  userProfessionalProfile: ProfessionalProfile | null
  onUpdateProfessionalProfile: (profile: ProfessionalProfile) => void
  onBecomeProfessional: (formData: any) => void
}

export default function ProfessionalTabMultiService({ 
  user, 
  userProfessionalProfile, 
  onUpdateProfessionalProfile,
  onBecomeProfessional 
}: ProfessionalTabMultiServiceProps) {
  const [searchParams, setSearchParams] = useSearchParams()
  
  // Leer el subtab desde la URL, o usar "services" por defecto
  const subTabFromUrl = searchParams.get('subTab') || 'services'
  const [professionalTab, setProfessionalTab] = useState(subTabFromUrl)
  
  const [showProfessionalForm, setShowProfessionalForm] = useState(false)
  const [editingService, setEditingService] = useState<string | null>(null)
  const [showAddServiceForm, setShowAddServiceForm] = useState(false)
  const [_editingProfile, setEditingProfile] = useState(false)
  const [editServiceForm, setEditServiceForm] = useState<any>({})
  const [saveError, setSaveError] = useState<string | null>(null)
  const newExpInputRef = useRef<HTMLInputElement | null>(null)

  // Confirm dialog state (replaces window.confirm)
  const [confirmDialog, setConfirmDialog] = useState<{ message: string; resolve: (ok: boolean) => void } | null>(null)
  const showConfirm = (message: string): Promise<boolean> =>
    new Promise(resolve => setConfirmDialog({ message, resolve }))

  // Categorías de servicios disponibles
  const [serviceCategories, setServiceCategories] = useState<{ id: string; name: string; slug: string }[]>([])

  // Función para cambiar de subtab (actualiza estado y URL manteniendo el mainTab)
  const handleTabChange = (newSubTab: string) => {
    setProfessionalTab(newSubTab)
    const mainTab = searchParams.get('mainTab') || 'professional'
    setSearchParams({ mainTab, subTab: newSubTab }, { replace: true })
  }

  useEffect(() => {
    // Cargar categorías desde API
    fetch(`${API_URL}/api/categories/`)
      .then(r => r.json())
      .then((rows) => setServiceCategories(rows.map((x: any) => ({ id: x.id, name: x.nombre, slug: x.slug }))))
      .catch(() => setServiceCategories([]))
  }, [])

  // Estado para formulario de nuevo servicio
  const [newServiceForm, setNewServiceForm] = useState({
    categoryId: "",
    experience: "",
    description: "",
    durationType: "fixed" as 'fixed' | 'range',
    fixedDuration: 60,
    minDuration: 60,
    maxDuration: 240,
    priceFixed: 25000
  })
  const [newServiceExperienceFiles, setNewServiceExperienceFiles] = useState<File[]>([])

  // Estado para editar perfil general
  const [profileForm, _setProfileForm] = useState({
    generalDescription: userProfessionalProfile?.generalDescription || "",
    acceptsNewJobs: userProfessionalProfile?.acceptsNewJobs ?? true
  })

  // Estado para formulario inicial de profesional
  const [initialProfessionalForm, setInitialProfessionalForm] = useState({
    generalDescription: "",
    firstServiceCategory: "",
    firstServiceExperience: "",
    firstServiceDescription: "",
    firstServiceDurationType: "fixed" as 'fixed' | 'range',
    firstServiceFixedDuration: 60,
    firstServiceMinDuration: 60,
    firstServiceMaxDuration: 240,
    firstServicePrice: 25000
  })

  // Uploads estado inicial (UI-only por ahora)
  const [certificateFile, setCertificateFile] = useState<File | null>(null)
  const [experienceFiles, setExperienceFiles] = useState<File[]>([])
  const certInputRef = useRef<HTMLInputElement | null>(null)
  const expInputRef = useRef<HTMLInputElement | null>(null)

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

  // Función para convertir formato de horas a minutos
  // Nota: función de parseo no utilizada eliminada para evitar advertencias de TypeScript

  const handleAddService = async () => {
    if (!userProfessionalProfile) return
    if (!newServiceForm.categoryId || !newServiceForm.description) {
      toast.error('Completa categoría y descripción')
      return
    }
    if (newServiceExperienceFiles.length === 0) {
      toast.error('Debes adjuntar al menos un documento de experiencia')
      return
    }

    // Enviar al backend para crear servicio adicional en estado pendiente
    try {
      const fd = new FormData()
      fd.append('general_description', userProfessionalProfile.generalDescription || newServiceForm.description || 'Solicitud de servicio adicional')
      fd.append('category_slug', newServiceForm.categoryId)
      fd.append('experience', newServiceForm.experience)
      fd.append('description', newServiceForm.description)
      fd.append('duration_type', newServiceForm.durationType)
      if (newServiceForm.durationType === 'fixed') {
        fd.append('fixed_duration', String(newServiceForm.fixedDuration))
      } else {
        fd.append('min_duration', String(newServiceForm.minDuration))
        fd.append('max_duration', String(newServiceForm.maxDuration))
      }
      fd.append('price_fixed', String(newServiceForm.priceFixed))
      for (const f of newServiceExperienceFiles) {
        fd.append('experience_docs', f)
      }

      await apiPostForm('/api/professional/apply/', fd, { auth: true })

      // Reflejar inmediatamente en UI como pendiente
      const newService: ProfessionalService = {
        id: `service-${Date.now()}`,
        categoryId: newServiceForm.categoryId,
        categoryName: serviceCategories.find(c => c.slug === newServiceForm.categoryId || c.id === newServiceForm.categoryId)?.name || "",
        experience: newServiceForm.experience,
        description: newServiceForm.description,
        durationType: newServiceForm.durationType,
        fixedDuration: newServiceForm.durationType === 'fixed' ? newServiceForm.fixedDuration : undefined,
        minDuration: newServiceForm.durationType === 'range' ? newServiceForm.minDuration : undefined,
        maxDuration: newServiceForm.durationType === 'range' ? newServiceForm.maxDuration : undefined,
        priceFixed: newServiceForm.priceFixed,
        isActive: true,
        isAvailable: true,
        verificationStatus: 'pending',
        rating: 0,
        completedJobs: 0,
        totalEarnings: 0
      }

      const updatedProfile = {
        ...userProfessionalProfile,
        services: [...userProfessionalProfile.services, newService]
      }
      onUpdateProfessionalProfile(updatedProfile)

      // Reset de formulario
      setShowAddServiceForm(false)
      setNewServiceForm({
        categoryId: "",
        experience: "",
        description: "",
        durationType: "fixed",
        fixedDuration: 60,
        minDuration: 60,
        maxDuration: 240,
        priceFixed: 25000
      })
      setNewServiceExperienceFiles([])
      toast.success('Solicitud enviada al verificador. Te avisaremos cuando se revise.')
    } catch (e: any) {
      toast.error(e?.message || 'Error desconocido')
    }
  }

  /**
   * Alterna la visibilidad de un servicio profesional.
   * Validaciones:
   * - UUID válido
   * - Advertencia al deshabilitar (UX)
   * - Manejo de errores específicos del backend (ej: reservas activas)
   */
  const handleToggleServiceActive = async (serviceId: string) => {
    if (!userProfessionalProfile) return
    
    // Validar que el ID sea un UUID (ruta backend exige <uuid:service_id>)
    const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/
    if (!uuidRegex.test(serviceId)) {
      toast.error('Este servicio aún no tiene un ID válido (posible servicio simulado o no aprobado).')
      return
    }
    
    const target = userProfessionalProfile.services.find(s => s.id === serviceId)
    if (!target) {
      console.error('Servicio no encontrado en estado local:', serviceId)
      return
    }
    
    const next = !target.isActive
    const approved = target.verificationStatus === 'approved'
    const suspended = target.verificationStatus === 'suspended'
    
    console.log('🔍 Toggle Debug Info:', {
      serviceId,
      serviceName: target.categoryName,
      currentIsActive: target.isActive,
      nextIsActive: next,
      verificationStatus: target.verificationStatus,
      approved,
      suspended
    })
    
    // Si no está aprobado NI suspendido (ej: pending, rejected), no enviar al backend
    if (!approved && !suspended) {
      console.warn('⚠️ Servicio en estado:', target.verificationStatus, '- solo actualización local')
      onUpdateProfessionalProfile({
        ...userProfessionalProfile,
        services: userProfessionalProfile.services.map(s => s.id === serviceId ? { ...s, isActive: next } : s)
      })
      return
    }
    
    // Advertencia al DESHABILITAR
    if (target.isActive) {
      const userConfirmed = await showConfirm(
        "Al deshabilitar este servicio ya no aparecerás en búsquedas públicas y los clientes no podrán hacer nuevas reservas. Si tienes reservas futuras activas, debes cancelarlas primero. ¿Deseas continuar?"
      )
      
      if (!userConfirmed) {
        return // Usuario canceló
      }
    }
    
    // Optimistic UI
    onUpdateProfessionalProfile({
      ...userProfessionalProfile,
      services: userProfessionalProfile.services.map(s => s.id === serviceId ? { ...s, isActive: next } : s)
    })
    
    console.log('📤 Enviando petición al backend:', {
      url: `/api/services/${serviceId}/visibility/`,
      body: { is_active: next }
    })
    
    try {
      const response = await apiPutAuth(`/api/services/${serviceId}/visibility/`, { is_active: next })
      
      console.log('📥 Respuesta del backend:', response)
      
      // Verificar respuesta del backend
      if (response?.ok === false) {
        throw new Error(response.message || 'Error al cambiar visibilidad del servicio')
      }
      
      // Actualizar con el valor real del servidor
      if (response && typeof response.is_active === 'boolean') {
        onUpdateProfessionalProfile({
          ...userProfessionalProfile,
          services: userProfessionalProfile.services.map(s => 
            s.id === serviceId 
              ? { 
                  ...s, 
                  isActive: response.is_active,
                  verificationStatus: response.is_active ? 'approved' : 'suspended'
                } 
              : s
          )
        })
      }
      
      // Éxito: mostrar confirmación breve si es necesario
      console.log('✅ Servicio actualizado exitosamente:', response)
      
    } catch (e: any) {
      console.error('❌ Error al cambiar visibilidad:', e)
      
      // Rollback de actualización optimista
      onUpdateProfessionalProfile({
        ...userProfessionalProfile,
        services: userProfessionalProfile.services.map(s => s.id === serviceId ? { ...s, isActive: !next } : s)
      })
      
      // Manejo de errores específicos
      const errorData = e?.response?.data || e
      const errorMsg = errorData?.message || e?.message || 'Error desconocido al cambiar estado del servicio'
      
      // Caso especial: reservas activas
      if (errorData?.active_reservations && errorData.active_reservations > 0) {
        toast.error(`No se puede deshabilitar el servicio: ${errorMsg}. Reservas activas: ${errorData.active_reservations}. Gestiona las reservas pendientes antes de deshabilitarlo.`)
      } 
      // Caso especial: estado no permitido
      else if (errorMsg.toLowerCase().includes('estado')) {
        toast.error(`Estado no válido: ${errorMsg}. Solo puedes alternar servicios aprobados o suspendidos.`)
      }
      // Error genérico
      else {
        toast.error(errorMsg)
      }
      
      console.error('Error al cambiar visibilidad:', e)
    }
  }

  // Nota: Si se necesita eliminar servicios en el futuro, agregar lógica aquí

  const handleBecomeProfessional = () => {
    // Crear perfil profesional inicial con primer servicio
    const initialProfile: ProfessionalProfile = {
      id: `profile-${Date.now()}`,
      userId: user.id,
      generalDescription: initialProfessionalForm.generalDescription,
      professionalPhone: "", // Sin teléfono profesional
      generalVerificationStatus: 'pending',
      averageRating: 0,
      totalJobs: 0,
      totalEarnings: 0,
      isActive: true,
      acceptsNewJobs: true,
      services: [{
        id: `service-${Date.now()}`,
        categoryId: initialProfessionalForm.firstServiceCategory,
  categoryName: serviceCategories.find(c => c.slug === initialProfessionalForm.firstServiceCategory || c.id === initialProfessionalForm.firstServiceCategory)?.name || "",
        experience: initialProfessionalForm.firstServiceExperience,
        description: initialProfessionalForm.firstServiceDescription,
        durationType: initialProfessionalForm.firstServiceDurationType,
        fixedDuration: initialProfessionalForm.firstServiceDurationType === 'fixed' ? initialProfessionalForm.firstServiceFixedDuration : undefined,
        minDuration: initialProfessionalForm.firstServiceDurationType === 'range' ? initialProfessionalForm.firstServiceMinDuration : undefined,
        maxDuration: initialProfessionalForm.firstServiceDurationType === 'range' ? initialProfessionalForm.firstServiceMaxDuration : undefined,
        priceFixed: initialProfessionalForm.firstServicePrice,
        isActive: true,
        isAvailable: true,
        verificationStatus: 'pending',
        rating: 0,
        completedJobs: 0,
        totalEarnings: 0
      }]
    }

    // Adjuntar archivos al payload para envío multipart en el contenedor
    const payload: any = {
      ...initialProfile,
      __files: {
        certificate: certificateFile,
        experience: experienceFiles,
      }
    }

    onBecomeProfessional(payload)
    setShowProfessionalForm(false)
  }

  const handleStartEditService = (service: ProfessionalService) => {
    setEditServiceForm({
      id: service.id,
      experience: service.experience,
      description: service.description,
      durationType: service.durationType,
      fixedDuration: service.fixedDuration || 60,
      minDuration: service.minDuration || 60,
      maxDuration: service.maxDuration || 240,
      priceFixed: service.priceFixed
    })
    setEditingService(service.id)
  }

  const handleSaveEditService = async () => {
    if (!userProfessionalProfile || !editingService) return

    try {
      setSaveError(null) // Limpiar errores anteriores
      
      // Preparar datos para el backend
      const updateData: any = {}
      
      if (editServiceForm.experience !== undefined) {
        updateData.anos_experiencia = editServiceForm.experience
      }
      if (editServiceForm.description !== undefined) {
        updateData.descripcion = editServiceForm.description
      }
      if (editServiceForm.durationType !== undefined) {
        // Mapear de inglés a español para el backend
        updateData.tipo_duracion = editServiceForm.durationType === 'fixed' ? 'fija' : 'rango'
        
        // Limpiar campos según el tipo de duración
        if (editServiceForm.durationType === 'fixed') {
          updateData.duracion_fija_minutos = editServiceForm.fixedDuration
          // Limpiar campos de rango
          updateData.duracion_minima_minutos = null
          updateData.duracion_maxima_minutos = null
        } else {
          // Limpiar campo de duración fija
          updateData.duracion_fija_minutos = null
          updateData.duracion_minima_minutos = editServiceForm.minDuration
          updateData.duracion_maxima_minutos = editServiceForm.maxDuration
        }
      } else {
        // Si no se cambió el tipo, solo actualizar los valores modificados
        if (editServiceForm.fixedDuration !== undefined) {
          updateData.duracion_fija_minutos = editServiceForm.fixedDuration
        }
        if (editServiceForm.minDuration !== undefined) {
          updateData.duracion_minima_minutos = editServiceForm.minDuration
        }
        if (editServiceForm.maxDuration !== undefined) {
          updateData.duracion_maxima_minutos = editServiceForm.maxDuration
        }
      }
      if (editServiceForm.priceFixed !== undefined) {
        updateData.precio_fijo = editServiceForm.priceFixed
      }

      // Llamar al endpoint para guardar en el backend
      await apiPutAuth(`/api/services/${editingService}/details/`, updateData)

      // Actualizar el estado local
      const updatedProfile = {
        ...userProfessionalProfile,
        services: userProfessionalProfile.services.map(service =>
          service.id === editingService
            ? {
                ...service,
                experience: editServiceForm.experience ?? service.experience,
                description: editServiceForm.description ?? service.description,
                durationType: editServiceForm.durationType ?? service.durationType,
                // Si cambiamos a 'fixed', usar el valor editado o mantener el original, y limpiar rangos
                fixedDuration: editServiceForm.durationType === 'fixed' 
                  ? (editServiceForm.fixedDuration ?? service.fixedDuration) 
                  : (editServiceForm.durationType === 'range' ? 0 : service.fixedDuration),
                // Si cambiamos a 'range', usar los valores editados o mantener originales, y limpiar fijo
                minDuration: editServiceForm.durationType === 'range' 
                  ? (editServiceForm.minDuration ?? service.minDuration) 
                  : (editServiceForm.durationType === 'fixed' ? 0 : service.minDuration),
                maxDuration: editServiceForm.durationType === 'range' 
                  ? (editServiceForm.maxDuration ?? service.maxDuration) 
                  : (editServiceForm.durationType === 'fixed' ? 0 : service.maxDuration),
                priceFixed: editServiceForm.priceFixed ?? service.priceFixed
              }
            : service
        )
      }

      onUpdateProfessionalProfile(updatedProfile)
      setEditingService(null)
      setEditServiceForm({})
    } catch (error: any) {
      console.error('Error saving service:', error)
      setSaveError(error?.response?.data?.message || error?.message || 'Error desconocido al guardar el servicio')
    }
  }

  const handleCancelEditService = () => {
    setEditingService(null)
    setEditServiceForm({})
    setSaveError(null)
  }

  const _handleUpdateProfile = () => {
    if (!userProfessionalProfile) return

    const updatedProfile = {
      ...userProfessionalProfile,
      ...profileForm
    }

    onUpdateProfessionalProfile(updatedProfile)
    setEditingProfile(false)
  }

  const getAvailableCategories = () => {
    if (!userProfessionalProfile) return serviceCategories
    const usedCategoryIds = userProfessionalProfile.services.map(s => s.categoryId)
    return serviceCategories.filter(cat => !usedCategoryIds.includes(cat.slug) && !usedCategoryIds.includes(cat.id))
  }

  const getVerificationStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { variant: "outline" as const, color: "text-yellow-600", text: "Pendiente" },
      approved: { variant: "outline" as const, color: "text-green-600", text: "Aprobado" },
      rejected: { variant: "outline" as const, color: "text-red-600", text: "Rechazado" },
      suspended: { variant: "outline" as const, color: "text-red-600", text: "Suspendido" }
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending

    return (
      <Badge variant={config.variant} className={config.color}>
        {config.text}
      </Badge>
    )
  }

  // Si no es profesional (aún no aprobado), mostrar formulario para enviar solicitud inicial
  if (!userProfessionalProfile && !showProfessionalForm) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="w-5 h-5" />
              Únete como Profesional
            </CardTitle>
            <CardDescription>
              Ofrece tus servicios en ServiHogar y comienza a generar ingresos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-gray-600">
                Como profesional en ServiHogar podrás:
              </p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  Ofrecer múltiples servicios (Gasfitería, Limpieza, Jardinería)
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  Habilitar/deshabilitar servicios según tu disponibilidad
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  Configurar precios independientes para cada servicio
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  Gestionar tu horario y disponibilidad
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  Recibir calificaciones y comentarios de clientes
                </li>
              </ul>
              <Button onClick={() => setShowProfessionalForm(true)} className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                Comenzar como Profesional
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Formulario inicial para convertirse en profesional
  if (showProfessionalForm && !userProfessionalProfile) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Crear Perfil Profesional</CardTitle>
            <CardDescription>
              Completa tu información para comenzar a ofrecer servicios
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Información General */}
            <div className="space-y-4">
              <h4 className="font-medium">Información General</h4>
              <div className="space-y-4">
                <div>
                  <Label>Descripción General</Label>
                  <Textarea
                    placeholder="Describe tu experiencia y enfoque profesional general..."
                    value={initialProfessionalForm.generalDescription}
                    onChange={(e) => setInitialProfessionalForm((prev: any) => ({
                      ...prev,
                      generalDescription: e.target.value
                    }))}
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Primer Servicio */}
            <div className="space-y-4">
              <h4 className="font-medium">Tu Primer Servicio</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Categoría de Servicio</Label>
                  <Select
                    value={initialProfessionalForm.firstServiceCategory}
                    onValueChange={(value) => setInitialProfessionalForm((prev: any) => ({
                      ...prev,
                      firstServiceCategory: value
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={serviceCategories.length ? "Selecciona una categoría" : "No hay categorías disponibles"} />
                    </SelectTrigger>
                    <SelectContent>
                        {serviceCategories.map(category => (
                          <SelectItem key={category.slug} value={category.slug}>
                            {category.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Años de Experiencia</Label>
                  <Select
                    value={initialProfessionalForm.firstServiceExperience}
                    onValueChange={(value) => setInitialProfessionalForm((prev: any) => ({
                      ...prev,
                      firstServiceExperience: value
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona experiencia" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 año</SelectItem>
                      <SelectItem value="2">2 años</SelectItem>
                      <SelectItem value="3">3 años</SelectItem>
                      <SelectItem value="4">4 años</SelectItem>
                      <SelectItem value="5+">5+ años</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Descripción del Servicio</Label>
                <Textarea
                  placeholder="Describe tu experiencia específica en este servicio..."
                  value={initialProfessionalForm.firstServiceDescription}
                    onChange={(e) => setInitialProfessionalForm((prev: any) => ({
                    ...prev,
                    firstServiceDescription: e.target.value
                  }))}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Tipo de Duración</Label>
                  <Select
                    value={initialProfessionalForm.firstServiceDurationType}
                    onValueChange={(value: 'fixed' | 'range') => setInitialProfessionalForm((prev: any) => ({
                      ...prev,
                      firstServiceDurationType: value
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fixed">Duración Fija</SelectItem>
                      <SelectItem value="range">Rango de Duración</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {initialProfessionalForm.firstServiceDurationType === 'fixed' ? (
                  <div>
                    <Label>Duración (minutos)</Label>
                    <Input
                      type="number"
                      value={initialProfessionalForm.firstServiceFixedDuration}
                      onChange={(e) => setInitialProfessionalForm((prev: any) => ({
                        ...prev,
                        firstServiceFixedDuration: parseInt(e.target.value)
                      }))}
                      min="30"
                      max="480"
                      step="30"
                    />
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label>Min (min)</Label>
                      <Input
                        type="number"
                        value={initialProfessionalForm.firstServiceMinDuration}
                        onChange={(e) => setInitialProfessionalForm((prev: any) => ({
                          ...prev,
                          firstServiceMinDuration: parseInt(e.target.value)
                        }))}
                        min="30"
                        max="240"
                        step="30"
                      />
                    </div>
                    <div>
                      <Label>Max (min)</Label>
                      <Input
                        type="number"
                        value={initialProfessionalForm.firstServiceMaxDuration}
                        onChange={(e) => setInitialProfessionalForm((prev: any) => ({
                          ...prev,
                          firstServiceMaxDuration: parseInt(e.target.value)
                        }))}
                        min="60"
                        max="480"
                        step="30"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div>
                <Label>Precio Fijo del Servicio (CLP)</Label>
                <Input
                  type="number"
                  value={initialProfessionalForm.firstServicePrice}
                  onChange={(e) => setInitialProfessionalForm((prev: any) => ({
                    ...prev,
                    firstServicePrice: parseInt(e.target.value)
                  }))}
                  min="10000"
                  step="1000"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Precio fijo que cobrarás por este servicio, independiente del tiempo exacto
                </p>
              </div>
            </div>

            <Separator />

            {/* Documentación Requerida - Primera Solicitud */}
            <div className="space-y-4">
              <h4 className="font-medium">Documentación Requerida</h4>
              
              <Alert>
                <FileText className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-2">
                    <p className="font-medium">Para tu primera solicitud debes presentar:</p>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      <li>Certificado de Antecedentes (obligatorio, solo se solicita una vez)</li>
                      <li>Documentación que respalde tu experiencia en {initialProfessionalForm.firstServiceCategory ? serviceCategories.find(c => c.slug === initialProfessionalForm.firstServiceCategory || c.id === initialProfessionalForm.firstServiceCategory)?.name : 'el servicio seleccionado'}</li>
                    </ul>
                    <p className="text-xs text-gray-600 mt-2">
                      El certificado de antecedentes puedes solicitarlo en chileatiende.gob.cl
                    </p>
                  </div>
                </AlertDescription>
              </Alert>

              <div className="space-y-3">
                <div>
                  <Label>Certificado de Antecedentes (Obligatorio) *</Label>
                  <div
                    className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center mt-2 cursor-pointer hover:bg-gray-50"
                    onClick={() => certInputRef.current?.click()}
                  >
                    <Upload className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">
                      Arrastra tu certificado aquí o haz clic para seleccionar
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      PDF, JPG, PNG (máx. 5MB)
                    </p>
                    {certificateFile && (
                      <p className="text-sm text-green-700 mt-2">
                        Seleccionado: {certificateFile.name}
                      </p>
                    )}
                    <input
                      ref={certInputRef}
                      type="file"
                      accept="application/pdf,image/*"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0] || null
                        if (f && f.size > 5 * 1024 * 1024) {
                          toast.error('Archivo supera 5MB')
                          e.currentTarget.value = ''
                          return
                        }
                        setCertificateFile(f)
                      }}
                    />
                  </div>
                </div>

                <div>
                  <Label>Documentación de Experiencia *</Label>
                  <p className="text-xs text-gray-500 mb-2">
                    Sube certificados, cartas de recomendación, facturas, boletas u otros documentos que respalden tu experiencia
                  </p>
                  <div
                    className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:bg-gray-50"
                    onClick={() => expInputRef.current?.click()}
                  >
                    <Upload className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">
                      Arrastra archivos aquí o haz clic para seleccionar
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      PDF, JPG, PNG (máx. 5MB cada uno) - Puedes subir varios archivos
                    </p>
                    {experienceFiles.length > 0 && (
                      <div className="mt-2 text-left">
                        <p className="text-xs font-medium text-gray-600 mb-1">Archivos seleccionados:</p>
                        <ul className="text-xs list-disc list-inside space-y-1 max-h-24 overflow-auto">
                          {experienceFiles.map((f, idx) => (
                            <li key={idx}>{f.name}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    <input
                      ref={expInputRef}
                      type="file"
                      accept="application/pdf,image/*"
                      multiple
                      className="hidden"
                      onChange={(e) => {
                        const fl = Array.from(e.target.files || [])
                        const valid = fl.filter(f => f.size <= 5 * 1024 * 1024)
                        if (valid.length !== fl.length) {
                          toast.warning('Se ignoraron archivos > 5MB')
                        }
                        setExperienceFiles(valid)
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button 
                onClick={handleBecomeProfessional} 
                className="flex-1"
                disabled={
                  !initialProfessionalForm.firstServiceCategory ||
                  !initialProfessionalForm.generalDescription ||
                  !certificateFile ||
                  experienceFiles.length === 0
                }
              >
                <Save className="w-4 h-4 mr-2" />
                Crear Perfil Profesional
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowProfessionalForm(false)}
                className="flex-1"
              >
                <X className="w-4 h-4 mr-2" />
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Panel principal para profesionales existentes
  if (!userProfessionalProfile) return null

  return (
    <>
      <div className="space-y-6">
      <Tabs value={professionalTab} onValueChange={handleTabChange}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="services">Servicios</TabsTrigger>
          <TabsTrigger value="schedule">Horarios</TabsTrigger>
        </TabsList>

        <TabsContent value="services" className="space-y-6">
          {/* Header con botón agregar */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Mis Servicios</h3>
              <p className="text-sm text-gray-600">Gestiona los servicios que ofreces</p>
            </div>
            <Button
              onClick={() => setShowAddServiceForm(true)}
              disabled={getAvailableCategories().length === 0}
              title={getAvailableCategories().length === 0 ? "Ya ofreces todos los servicios disponibles" : "Agregar nuevo servicio"}
            >
              <Plus className="w-4 h-4 mr-2" />
              Agregar Servicio
            </Button>
          </div>

          {/* Formulario para agregar servicio */}
          {showAddServiceForm && (
            <Card>
              <CardHeader>
                <CardTitle>Agregar Nuevo Servicio</CardTitle>
                <CardDescription>
                  Configura un nuevo servicio para ofrecer a tus clientes
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Categoría de Servicio</Label>
                    <Select
                      value={newServiceForm.categoryId}
                      onValueChange={(value) => setNewServiceForm((prev: any) => ({
                        ...prev,
                        categoryId: value
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona una categoría" />
                      </SelectTrigger>
                      <SelectContent>
                        {getAvailableCategories().map(category => (
                          <SelectItem key={category.slug} value={category.slug}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Años de Experiencia</Label>
                    <Select
                      value={newServiceForm.experience}
                      onValueChange={(value) => setNewServiceForm((prev: any) => ({
                        ...prev,
                        experience: value
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona experiencia" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 año</SelectItem>
                        <SelectItem value="2">2 años</SelectItem>
                        <SelectItem value="3">3 años</SelectItem>
                        <SelectItem value="4">4 años</SelectItem>
                        <SelectItem value="5+">5+ años</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label>Descripción del Servicio</Label>
                  <Textarea
                    placeholder="Describe tu experiencia específica en este servicio..."
                    value={newServiceForm.description}
                    onChange={(e) => setNewServiceForm((prev: any) => ({
                      ...prev,
                      description: e.target.value
                    }))}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Tipo de Duración</Label>
                    <Select
                      value={newServiceForm.durationType}
                      onValueChange={(value: 'fixed' | 'range') => setNewServiceForm((prev: any) => ({
                        ...prev,
                        durationType: value
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fixed">Duración Fija</SelectItem>
                        <SelectItem value="range">Rango de Duración</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {newServiceForm.durationType === 'fixed' ? (
                    <div>
                      <Label>Duración (minutos)</Label>
                      <Input
                        type="number"
                        value={newServiceForm.fixedDuration}
                        onChange={(e) => setNewServiceForm((prev: any) => ({
                          ...prev,
                          fixedDuration: parseInt(e.target.value)
                        }))}
                        min="30"
                        max="480"
                        step="30"
                      />
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label>Min (min)</Label>
                        <Input
                          type="number"
                          value={newServiceForm.minDuration}
                          onChange={(e) => setNewServiceForm((prev: any) => ({
                            ...prev,
                            minDuration: parseInt(e.target.value)
                          }))}
                          min="30"
                          max="240"
                          step="30"
                        />
                      </div>
                      <div>
                        <Label>Max (min)</Label>
                        <Input
                          type="number"
                          value={newServiceForm.maxDuration}
                          onChange={(e) => setNewServiceForm((prev: any) => ({
                            ...prev,
                            maxDuration: parseInt(e.target.value)
                          }))}
                          min="60"
                          max="480"
                          step="30"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <Label>Precio Fijo del Servicio (CLP)</Label>
                  <Input
                    type="number"
                    value={newServiceForm.priceFixed}
                    onChange={(e) => setNewServiceForm((prev: any) => ({
                      ...prev,
                      priceFixed: parseInt(e.target.value)
                    }))}
                    min="10000"
                    step="1000"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Precio fijo que cobrarás por este servicio, independiente del tiempo exacto
                  </p>
                </div>

                <Separator />

                {/* Documentación para servicio adicional */}
                <div className="space-y-3">
                  <h4 className="font-medium">Documentación de Experiencia</h4>
                  
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <div className="space-y-2">
                        <p className="text-sm">
                          Para agregar este nuevo servicio, debes presentar documentación que respalde tu experiencia en {newServiceForm.categoryId ? serviceCategories.find(c => c.slug === newServiceForm.categoryId || c.id === newServiceForm.categoryId)?.name : 'la categoría seleccionada'}.
                        </p>
                        <p className="text-xs text-green-600 font-medium">
                          ✓ No necesitas volver a subir el certificado de antecedentes (ya verificado)
                        </p>
                      </div>
                    </AlertDescription>
                  </Alert>

                  <div>
                    <Label>Documentación de Experiencia para este Servicio *</Label>
                    <p className="text-xs text-gray-500 mb-2">
                      Sube certificados, cartas de recomendación, facturas, boletas u otros documentos que respalden tu experiencia en esta área
                    </p>
                    <div
                      className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:bg-gray-50"
                      onClick={() => newExpInputRef.current?.click()}
                    >
                      <Upload className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">
                        Arrastra archivos aquí o haz clic para seleccionar
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        PDF, JPG, PNG (máx. 5MB cada uno) - Puedes subir varios archivos
                      </p>
                      {newServiceExperienceFiles.length > 0 && (
                        <div className="mt-2 text-left">
                          <p className="text-xs font-medium text-gray-600 mb-1">Archivos seleccionados:</p>
                          <ul className="text-xs list-disc list-inside space-y-1 max-h-24 overflow-auto">
                            {newServiceExperienceFiles.map((f, idx) => (
                              <li key={idx}>{f.name}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      <input
                        ref={newExpInputRef}
                        type="file"
                        accept="application/pdf,image/*"
                        multiple
                        className="hidden"
                        onChange={(e) => {
                          const fl = Array.from(e.target.files || [])
                          const valid = fl.filter(f => f.size <= 5 * 1024 * 1024)
                          if (valid.length !== fl.length) {
                            toast.warning('Se ignoraron archivos > 5MB')
                          }
                          setNewServiceExperienceFiles(valid)
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button 
                    onClick={handleAddService}
                    disabled={!newServiceForm.categoryId || !newServiceForm.description || newServiceExperienceFiles.length === 0}
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Enviar para Verificación
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setShowAddServiceForm(false)}
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancelar
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Lista de servicios */}
          <div className="grid gap-4">
            {userProfessionalProfile.services.map(service => (
              <Card key={service.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge variant="secondary">{service.categoryName}</Badge>
                      {getVerificationStatusBadge(service.verificationStatus)}
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={service.isActive}
                          onCheckedChange={() => handleToggleServiceActive(service.id)}
                          disabled={
                            service.verificationStatus !== 'approved' && 
                            service.verificationStatus !== 'suspended'
                          }
                        />
                        {service.verificationStatus === 'pending' && (
                          <span className="text-sm text-amber-600 dark:text-amber-400">
                            En verificación
                          </span>
                        )}
                        {service.verificationStatus === 'rejected' && (
                          <span className="text-sm text-red-600 dark:text-red-400">
                            Rechazado
                          </span>
                        )}
                        {(service.verificationStatus === 'approved' || service.verificationStatus === 'suspended') && (
                          <span className="text-sm text-gray-600">
                            {service.isActive ? "Activo" : "Suspendido"}
                          </span>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => editingService === service.id ? handleCancelEditService() : handleStartEditService(service)}
                    >
                      {editingService === service.id ? (
                        <X className="w-4 h-4" />
                      ) : (
                        <Edit className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {editingService === service.id ? (
                    /* Modo edición */
                    <div className="space-y-4">
                      {saveError && (
                        <Alert variant="destructive">
                          <AlertDescription className="flex items-center justify-between">
                            <span>{saveError}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSaveError(null)}
                              className="h-auto p-1 hover:bg-transparent"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </AlertDescription>
                        </Alert>
                      )}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label>Años de Experiencia</Label>
                          <Select
                            value={editServiceForm.experience}
                            onValueChange={(value) => setEditServiceForm((prev: any) => ({
                              ...prev,
                              experience: value
                            }))}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="1">1 año</SelectItem>
                              <SelectItem value="2">2 años</SelectItem>
                              <SelectItem value="3">3 años</SelectItem>
                              <SelectItem value="4">4 años</SelectItem>
                              <SelectItem value="5+">5+ años</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label>Precio Fijo (CLP)</Label>
                          <Input
                            type="number"
                            value={editServiceForm.priceFixed}
                            onChange={(e) => setEditServiceForm((prev: any) => ({
                              ...prev,
                              priceFixed: parseInt(e.target.value)
                            }))}
                            min="10000"
                            step="1000"
                          />
                        </div>
                      </div>

                      <div>
                        <Label>Descripción</Label>
                        <Textarea
                          value={editServiceForm.description}
                          onChange={(e) => setEditServiceForm((prev: any) => ({
                            ...prev,
                            description: e.target.value
                          }))}
                          rows={3}
                        />
                      </div>

                      <div className="space-y-4">
                        <div>
                          <Label>Tipo de Duración</Label>
                          <Select
                            value={editServiceForm.durationType}
                            onValueChange={(value: 'fixed' | 'range') => setEditServiceForm((prev: any) => ({
                              ...prev,
                              durationType: value
                            }))}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="fixed">Duración Fija</SelectItem>
                              <SelectItem value="range">Rango de Duración</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {editServiceForm.durationType === 'fixed' ? (
                          <div>
                            <Label>Duración</Label>
                            <Input
                              type="number"
                              value={editServiceForm.fixedDuration}
                              onChange={(e) => setEditServiceForm((prev: any) => ({
                                ...prev,
                                fixedDuration: parseInt(e.target.value)
                              }))}
                              min="30"
                              max="480"
                              step="30"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                              En minutos. Ejemplo: 60 = 1h, 90 = 1h30min
                            </p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label>Duración Mínima</Label>
                              <Input
                                type="number"
                                value={editServiceForm.minDuration}
                                onChange={(e) => setEditServiceForm((prev: any) => ({
                                  ...prev,
                                  minDuration: parseInt(e.target.value)
                                }))}
                                min="30"
                                max="240"
                                step="30"
                              />
                              <p className="text-xs text-gray-500 mt-1">En minutos</p>
                            </div>
                            <div>
                              <Label>Duración Máxima</Label>
                              <Input
                                type="number"
                                value={editServiceForm.maxDuration}
                                onChange={(e) => setEditServiceForm((prev: any) => ({
                                  ...prev,
                                  maxDuration: parseInt(e.target.value)
                                }))}
                                min="60"
                                max="480"
                                step="30"
                              />
                              <p className="text-xs text-gray-500 mt-1">En minutos</p>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <Button onClick={handleSaveEditService}>
                          <Save className="w-4 h-4 mr-2" />
                          Guardar Cambios
                        </Button>
                        <Button variant="outline" onClick={handleCancelEditService}>
                          <X className="w-4 h-4 mr-2" />
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    /* Modo visualización */
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div>
                          <span className="text-sm text-gray-500">Experiencia:</span>
                          <p className="font-medium">{service.experience} años</p>
                        </div>
                        <div>
                          <span className="text-sm text-gray-500">Precio Fijo:</span>
                          <p className="font-semibold text-green-600">${service.priceFixed.toLocaleString()}</p>
                        </div>
                        <div>
                          <span className="text-sm text-gray-500">Duración:</span>
                          <p className="font-medium">
                            {service.durationType === 'fixed' 
                              ? `${formatDuration(service.fixedDuration || 0)} (fijo)`
                              : `${formatDuration(service.minDuration || 0)}-${formatDuration(service.maxDuration || 0)}`
                            }
                          </p>
                        </div>
                        <div>
                          <span className="text-sm text-gray-500">Calificación:</span>
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                            <span className="font-medium">{service.rating.toFixed(1)}</span>
                            <span className="text-sm text-gray-500">({service.completedJobs} trabajos)</span>
                          </div>
                        </div>
                      </div>
                      <div className="mt-4">
                        <span className="text-sm text-gray-500">Descripción:</span>
                        <p className="text-sm mt-1">{service.description}</p>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {userProfessionalProfile.services.length === 0 && (
            <Card>
              <CardContent className="text-center py-8">
                <Briefcase className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="font-medium text-gray-600 mb-2">No tienes servicios activos</h3>
                <p className="text-sm text-gray-500 mb-4">
                  Agrega tu primer servicio para comenzar a recibir solicitudes
                </p>
                <Button onClick={() => setShowAddServiceForm(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Agregar Primer Servicio
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="schedule">
          <ProfessionalScheduleManagerAdvanced 
            professionalServices={userProfessionalProfile.services}
          />
        </TabsContent>
      </Tabs>
    </div>
    {confirmDialog && (
      <AlertDialog open={true} onOpenChange={() => { confirmDialog.resolve(false); setConfirmDialog(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar acción</AlertDialogTitle>
            <AlertDialogDescription>{confirmDialog.message}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => { confirmDialog.resolve(false); setConfirmDialog(null) }}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => { confirmDialog.resolve(true); setConfirmDialog(null) }}>Continuar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    )}
    </>
  )
}