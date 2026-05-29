import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../ui/card"
import { Button } from "../../ui/button"
import { Input } from "../../ui/input"
import { Label } from "../../ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "../../ui/avatar"
import { 
  User,
  Edit,
  Save,
  X,
  Mail,
  Phone,
  MapPin
} from "lucide-react"
import { apiGet, apiPutAuth, apiPostForm } from "../../../lib/api"
import { useAuth } from "../../../lib/auth"
import { toast } from "sonner"

interface ProfileTabProps {
  user: any
  onUpdateUser: (userData: any) => void
}

export default function ProfileTab({ user, onUpdateUser }: ProfileTabProps) {
  const { refreshUser } = useAuth()
  const [editingProfile, setEditingProfile] = useState(false)
  const [tempUserData, setTempUserData] = useState<any>({})
  
  // Determinar estado profesional desde el rol efectivo cuando esté disponible
  // Usar isProfessional como fallback si effective_role no es confiable
  const isProfessional = user?.isProfessional || 
    (user?.effective_role === 'profesional') || 
    (user?.effective_role === 'administrador')
    
  // Datos dinámicos de regiones/comunas
  const [regions, setRegions] = useState<Array<{ id: string; nombre: string; codigo?: string }>>([])
  const [communes, setCommunes] = useState<Array<{ id: string; nombre: string; codigo?: string; region_id?: string }>>([])
  const [loadingRegions, setLoadingRegions] = useState<boolean>(false)
  const [loadingCommunes, setLoadingCommunes] = useState<boolean>(false)

  // Cargar regiones al montar
  useEffect(() => {
    let ignore = false
    setLoadingRegions(true)
    apiGet('/api/geo/regiones/')
      .then((data: any) => {
        if (ignore) return
        const list = Array.isArray(data) ? data : []
        setRegions(list.map((r: any) => ({ id: String(r.id), nombre: r.nombre, codigo: r.codigo })))
      })
      .catch(() => {})
      .finally(() => { if (!ignore) setLoadingRegions(false) })
    return () => { ignore = true }
  }, [])

  // Preselección inicial: si el usuario tiene dominio.id_comuna, obtener comuna y su región para setear IDs
  useEffect(() => {
    const dominio = (user as any)?.dominio
    const idComuna = dominio?.id_comuna
    if (!editingProfile && idComuna) {
      // Cargar comuna por ID para conocer region_id
      apiGet(`/api/geo/comunas/?comuna_id=${encodeURIComponent(idComuna)}`)
        .then((data: any) => {
          const c = Array.isArray(data) && data.length > 0 ? data[0] : null
          if (c) {
            setTempUserData((prev: any) => ({
              ...prev,
              regionId: String(c.region_id || ''),
              communeId: String(c.id),
              region: user.region || '',
              commune: user.commune || '',
            }))
          }
        })
        .catch(() => {})
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.dominio?.id_comuna, editingProfile])

  // Si ya hay región por nombre y no hay ID, intentar mapear cuando haya regiones cargadas (al entrar a editar)
  useEffect(() => {
    if (!editingProfile) return
    if (!tempUserData.regionId && tempUserData.region && regions.length > 0) {
      const found = regions.find(r => r.nombre === tempUserData.region)
      if (found) {
        setTempUserData((prev: any) => ({ ...prev, regionId: found.id }))
      }
    }
  }, [editingProfile, tempUserData.region, tempUserData.regionId, regions])

  // Cargar comunas cuando cambie regionId en edición
  useEffect(() => {
    let ignore = false
    setCommunes([])
    if (!editingProfile) return
    const rid = tempUserData.regionId
    if (!rid) return
    setLoadingCommunes(true)
    apiGet(`/api/geo/comunas/?region_id=${encodeURIComponent(rid)}`)
      .then((data: any) => {
        if (ignore) return
        const list = Array.isArray(data) ? data : []
        setCommunes(list.map((c: any) => ({ id: String(c.id), nombre: c.nombre, codigo: c.codigo, region_id: String(c.region_id || '') })))
      })
      .catch(() => {})
      .finally(() => { if (!ignore) setLoadingCommunes(false) })
    return () => { ignore = true }
  }, [editingProfile, tempUserData.regionId])

  // Si hay comuna por nombre y no hay ID, mapear cuando se carguen comunas
  useEffect(() => {
    if (!editingProfile) return
    if (!tempUserData.communeId && tempUserData.commune && communes.length > 0) {
      const found = communes.find(c => c.nombre === tempUserData.commune)
      if (found) {
        setTempUserData((prev: any) => ({ ...prev, communeId: found.id }))
      }
    }
  }, [editingProfile, tempUserData.commune, tempUserData.communeId, communes])

  const handleStartEditUserProfile = async () => {
    const base = {
      name: user.name,
      email: user.email,
      phone: user.phone || "",
      address: user.address || "",
      region: user.region || "",
      commune: user.commune || "",
      regionId: tempUserData.regionId || "",
      communeId: tempUserData.communeId || "",
    }
    // Si no tenemos IDs aún y existe dominio.id_comuna, traer comuna para obtener region_id
    const dominio = (user as any)?.dominio
    const idComuna = dominio?.id_comuna
    let preload = { ...base }
    try {
      if ((!preload.regionId || !preload.communeId) && idComuna) {
        const data = await apiGet(`/api/geo/comunas/?comuna_id=${encodeURIComponent(idComuna)}`)
        const c = Array.isArray(data) && data.length > 0 ? data[0] : null
        if (c) {
          preload.regionId = String(c.region_id || '')
          preload.communeId = String(c.id)
        }
      }
    } catch {}
    setTempUserData(preload)
    setEditingProfile(true)
  }

  // Subir avatar y refrescar usuario
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const fd = new FormData()
    fd.append('file', file)
    try {
      await apiPostForm('/api/auth/me/avatar/', fd, { auth: true })
      await refreshUser()
      toast.success('Avatar actualizado')
    } catch (err: any) {
      toast.error(err?.message || 'Error')
    }
  }

  const handleUpdateUserData = async () => {
    try {
      const payload: any = {
        name: tempUserData.name,
        email: tempUserData.email,
        phone: tempUserData.phone,
        address: tempUserData.address,
        gender: tempUserData.gender,
        birth_date: tempUserData.birth_date,
      }
      // NO enviamos region_id ni comuna_id porque están deshabilitados para edición
      // El backend mantendrá los valores existentes
      
      // Actualizar en backend (PUT)
      await apiPutAuth('/api/auth/me/update/', payload)
      
      // Refrescar sesión de usuario
      await refreshUser()
      onUpdateUser?.(payload)
      setEditingProfile(false)
      setTempUserData({})
      toast.success('Perfil actualizado correctamente')
    } catch (e: any) {
      toast.error(e?.message || 'Error desconocido')
    }
  }

  const handleCancelUserEdit = () => {
    setEditingProfile(false)
    setTempUserData({})
  }

  const handleRegionChange = (regionId: string) => {
    const regionName = regions.find(r => r.id === regionId)?.nombre || ""
    setTempUserData((prev: any) => ({
      ...prev,
      regionId,
      region: regionName,
      communeId: "",
      commune: ""
    }))
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="w-5 h-5" />
          Mi Perfil
        </CardTitle>
        <CardDescription>
          Gestiona tu información personal y preferencias
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Avatar y información básica */}
        <div className="flex items-center gap-6">
          <div className="flex flex-col items-center gap-2">
            <Avatar className="w-24 h-24">
              <AvatarImage src={user.avatar || user.profile?.avatar_url} alt={user.name} />
              <AvatarFallback className="text-xl">
                <User className="w-8 h-8" />
              </AvatarFallback>
            </Avatar>
            {editingProfile && (
              <label className="text-xs text-blue-600 hover:underline cursor-pointer">
                Cambiar foto
                <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
              </label>
            )}
          </div>
          <div>
            <h3 className="text-xl font-semibold">{user.name}</h3>
            <p className="text-gray-600">{user.email}</p>
            <div className="mt-2">
              {isProfessional ? (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Profesional Verificado
                </span>
              ) : (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  Cliente
                </span>
              )}
            </div>
          </div>
        </div>

        {editingProfile ? (
          /* Modo edición */
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre completo</Label>
                <Input
                  id="name"
                  value={tempUserData.name}
                  onChange={(e) => setTempUserData((prev: any) => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Correo electrónico</Label>
                <Input
                  id="email"
                  type="email"
                  value={tempUserData.email}
                  onChange={(e) => setTempUserData((prev: any) => ({ ...prev, email: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Teléfono</Label>
                <Input
                  id="phone"
                  value={tempUserData.phone}
                  onChange={(e) => setTempUserData((prev: any) => ({ ...prev, phone: e.target.value }))}
                  placeholder="Ej: +56 9 1234 5678"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Dirección</Label>
                <Input
                  id="address"
                  value={tempUserData.address}
                  onChange={(e) => setTempUserData((prev: any) => ({ ...prev, address: e.target.value }))}
                  placeholder="Ej: Av. Principal 123"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Región</Label>
                <Select value={tempUserData.regionId || ""} onValueChange={handleRegionChange} disabled>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona una región" />
                  </SelectTrigger>
                  <SelectContent>
                    {regions.map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {loadingRegions && (
                  <p className="text-xs text-gray-500">Cargando regiones...</p>
                )}
                <p className="text-xs text-amber-600">
                  🔒 Para cambiar región/comuna, contacta con soporte
                </p>
              </div>
              <div className="space-y-2">
                <Label>Comuna</Label>
                <Select 
                  value={tempUserData.communeId || ""}
                  onValueChange={(communeId) => {
                    const communeName = communes.find(c => c.id === communeId)?.nombre || ""
                    setTempUserData((prev: any) => ({ ...prev, communeId, commune: communeName }))
                  }}
                  disabled
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona una comuna" />
                  </SelectTrigger>
                  <SelectContent>
                    {communes.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {loadingCommunes && (
                  <p className="text-xs text-gray-500">Cargando comunas...</p>
                )}
                <p className="text-xs text-amber-600">
                  🔒 Cambios afectan servicios e historial
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleUpdateUserData} className="flex items-center gap-2">
                <Save className="w-4 h-4" />
                Guardar Cambios
              </Button>
              <Button variant="outline" onClick={handleCancelUserEdit} className="flex items-center gap-2">
                <X className="w-4 h-4" />
                Cancelar
              </Button>
            </div>
          </div>
        ) : (
          /* Modo visualización */
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">Correo electrónico</p>
                    <p>{user.email}</p>
                  </div>
                </div>
                
                {user.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-gray-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">Teléfono</p>
                      <p>{user.phone}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                {user.address && (
                  <div className="flex items-center gap-3">
                    <MapPin className="w-5 h-5 text-gray-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">Dirección</p>
                      <p>{user.address}</p>
                      {user.commune && user.region && (
                        <p className="text-sm text-gray-500">{user.commune}, {user.region}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <Button onClick={handleStartEditUserProfile} className="flex items-center gap-2">
              <Edit className="w-4 h-4" />
              Editar Perfil
            </Button>
          </div>
        )}

        {/* Información adicional */}
        <div className="border-t pt-6">
          <h4 className="font-medium mb-3">Información de la cuenta</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Fecha de registro:</span>
              <span className="ml-2">Enero 2024</span>
            </div>
            <div>
              <span className="text-gray-500">Último acceso:</span>
              <span className="ml-2">Hace 2 horas</span>
            </div>
            <div>
              <span className="text-gray-500">Estado de verificación:</span>
              <span className="ml-2 text-green-600">Verificado</span>
            </div>
            <div>
              <span className="text-gray-500">Tipo de cuenta:</span>
              <span className="ml-2">{isProfessional ? "Profesional" : "Cliente"}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}