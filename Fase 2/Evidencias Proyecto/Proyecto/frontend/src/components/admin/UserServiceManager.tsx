import { useEffect, useState } from "react"
import { toast } from "sonner"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"
import { Badge } from "../ui/badge"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select"
import { apiGet, apiGetAuth, apiPutAuth } from "../../lib/api"
import {
  Loader2,
  Search,
  Star,
  Phone,
  Mail,
  IdCard,
  Briefcase,
  Users,
  CalendarClock,
  Wrench,
  MessageSquare,
  AlertTriangle,
  MapPin,
} from "lucide-react"

interface UserListItem {
  rut: string
  rut_formateado?: string
  nombres: string
  apellidos: string
  nombre_completo: string
  email: string
  telefono?: string
  rol: string
  activo: boolean
  fecha_registro?: string | null
  solicitudes_como_cliente?: number
  solicitudes_como_profesional?: number
  servicios_activos?: string[]
  comuna_nombre?: string | null
  region_nombre?: string | null
  comuna_id?: string | null
  region_id?: string | null
  calificacion_promedio?: number | null
}

interface GeoOption {
  id: string
  nombre: string
}

interface ServiceDetail {
  id: string
  categoria: string
  descripcion: string
  anos_experiencia: string
  precio_fijo: number
  trabajos_completados: number
  trabajos_cancelados: number
  estado_verificacion: string
  calificacion_promedio: number | null
  total_resenas: number
}

interface TransactionEntry {
  id: string
  titulo: string
  fecha: string
  precio: number
  estado: "pendiente" | "confirmado" | "completado" | "cancelado"
  contraparte: string
  categoria: string | null
  resena_comentario: string | null
  resena_calificacion: number | null
  resena_calidad: number | null
  resena_puntualidad: number | null
  resena_comunicacion: number | null
}

interface UserServiceHistory {
  user: {
    rut: string
    rut_formateado: string
    nombre_completo: string
    email: string
    telefono: string
    activo: boolean
    fecha_registro: string | null
    ultima_actividad: string | null
  }
  is_professional: boolean
  overall_rating: number | null
  total_reviews: number
  services: ServiceDetail[]
  professional_history: TransactionEntry[]
  client_history: TransactionEntry[]
}

const ESTADO_LABELS: Record<string, string> = {
  pendiente: "Pendiente",
  confirmado: "Confirmado",
  completado: "Completado",
  cancelado: "Cancelado",
}

const ESTADO_STYLES: Record<string, string> = {
  pendiente: "bg-yellow-100 text-yellow-800 border-yellow-200",
  confirmado: "bg-blue-100 text-blue-800 border-blue-200",
  completado: "bg-green-100 text-green-800 border-green-200",
  cancelado: "bg-red-100 text-red-800 border-red-200",
}

function EstadoBadge({ estado }: { estado: string }) {
  return (
    <Badge className={ESTADO_STYLES[estado] || "bg-gray-100 text-gray-800 border-gray-200"}>
      {ESTADO_LABELS[estado] || estado}
    </Badge>
  )
}

function StarRating({ value }: { value: number | null }) {
  if (value === null || value === undefined) {
    return <span className="text-xs text-gray-400">Sin calificación</span>
  }
  return (
    <span className="flex items-center gap-1 text-sm font-medium text-yellow-600">
      <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
      {value.toFixed(1)}
    </span>
  )
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP" }).format(value || 0)
}

function formatDate(value?: string | null) {
  if (!value) return "—"
  try {
    return new Date(value).toLocaleDateString("es-CL", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  } catch {
    return value
  }
}

function TransactionList({ entries, emptyLabel }: { entries: TransactionEntry[]; emptyLabel: string }) {
  if (entries.length === 0) {
    return (
      <div className="text-center py-8 text-sm text-gray-500">
        {emptyLabel}
      </div>
    )
  }
  return (
    <div className="space-y-3">
      {entries.map((entry) => (
        <Card key={entry.id}>
          <CardContent className="pt-4 space-y-2">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div>
                <p className="font-medium">{entry.titulo}</p>
                <p className="text-xs text-gray-500">{entry.categoria || "Servicio"}</p>
              </div>
              <EstadoBadge estado={entry.estado} />
            </div>
            <div className="flex items-center gap-4 flex-wrap text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <CalendarClock className="w-3 h-3" />
                {formatDate(entry.fecha)}
              </span>
              <span className="font-medium text-gray-700">{formatCurrency(entry.precio)}</span>
              <span>Contraparte: {entry.contraparte}</span>
            </div>
            {entry.estado === "completado" && (
              <div className="mt-2 border-t pt-2">
                {entry.resena_calificacion !== null ? (
                  <div className="space-y-1">
                    <StarRating value={entry.resena_calificacion} />
                    {entry.resena_comentario && (
                      <p className="text-sm text-gray-600 flex items-start gap-1">
                        <MessageSquare className="w-3 h-3 mt-1 shrink-0 text-gray-400" />
                        {entry.resena_comentario}
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400">Sin reseña</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function UserDetailDialog({
  rut,
  open,
  onOpenChange,
}: {
  rut: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<UserServiceHistory | null>(null)

  useEffect(() => {
    if (!open || !rut) return
    let cancelled = false
    const load = async () => {
      try {
        setLoading(true)
        const result = await apiGetAuth(`/api/admin/operations/users/${rut}/service-history/`)
        if (!cancelled) setData(result)
      } catch (err: any) {
        console.error("Error cargando historial de usuario:", err)
        toast.error("Error cargando historial del usuario")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [open, rut])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detalle de Usuario</DialogTitle>
          <DialogDescription>
            Información general, servicios ofrecidos e historial transaccional
          </DialogDescription>
        </DialogHeader>

        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <span className="ml-3 text-gray-600">Cargando información...</span>
          </div>
        )}

        {!loading && data && (
          <div className="space-y-6">
            {/* Información general */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <CardTitle className="text-lg">{data.user.nombre_completo}</CardTitle>
                  <Badge variant={data.user.activo ? "default" : "destructive"}>
                    {data.user.activo ? "Activo" : "Deshabilitado"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-600">
                <span className="flex items-center gap-2">
                  <IdCard className="w-4 h-4 text-gray-400" /> {data.user.rut_formateado}
                </span>
                <span className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-gray-400" /> {data.user.email}
                </span>
                {data.user.telefono && (
                  <span className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-400" /> {data.user.telefono}
                  </span>
                )}
                <span className="flex items-center gap-2">
                  <CalendarClock className="w-4 h-4 text-gray-400" /> Registrado: {formatDate(data.user.fecha_registro)}
                </span>
                {data.is_professional && (
                  <span className="flex items-center gap-2 sm:col-span-2">
                    <Star className="w-4 h-4 text-yellow-500" />
                    Calificación general: <StarRating value={data.overall_rating} />
                    <span className="text-xs text-gray-400">({data.total_reviews} reseñas)</span>
                  </span>
                )}
              </CardContent>
            </Card>

            {/* Servicios ofrecidos (si es profesional) */}
            {data.is_professional && (
              <div>
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <Wrench className="w-4 h-4" /> Servicios que ofrece
                </h3>
                <div className="space-y-3">
                  {data.services.map((svc) => (
                    <Card key={svc.id}>
                      <CardContent className="pt-4 space-y-2">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <p className="font-medium">{svc.categoria}</p>
                          <Badge variant="outline" className="capitalize">{svc.estado_verificacion}</Badge>
                        </div>
                        <p className="text-sm text-gray-600">{svc.descripcion}</p>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-gray-500">
                          <span>Experiencia: {svc.anos_experiencia} años</span>
                          <span className="font-medium text-gray-700">{formatCurrency(svc.precio_fijo)}</span>
                          <span>Completados: {svc.trabajos_completados}</span>
                          <span>Cancelados: {svc.trabajos_cancelados}</span>
                        </div>
                        <StarRating value={svc.calificacion_promedio} />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Historial transaccional */}
            <Tabs defaultValue={data.is_professional ? "professional" : "client"}>
              <TabsList className={`grid w-full ${data.is_professional ? "grid-cols-2" : "grid-cols-1"}`}>
                {data.is_professional && (
                  <TabsTrigger value="professional">Historial como Profesional</TabsTrigger>
                )}
                <TabsTrigger value="client">Historial como Cliente</TabsTrigger>
              </TabsList>
              {data.is_professional && (
                <TabsContent value="professional" className="mt-4">
                  <TransactionList
                    entries={data.professional_history}
                    emptyLabel="No tiene solicitudes recibidas como profesional."
                  />
                </TabsContent>
              )}
              <TabsContent value="client" className="mt-4">
                <TransactionList
                  entries={data.client_history}
                  emptyLabel="No tiene solicitudes realizadas como cliente."
                />
              </TabsContent>
            </Tabs>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

function UserCard({
  user,
  onViewDetail,
  onToggleStatus,
  toggling,
}: {
  user: UserListItem
  onViewDetail: (rut: string) => void
  onToggleStatus: (user: UserListItem) => void
  toggling: boolean
}) {
  const hasLowRating =
    user.rol === "profesional" &&
    user.calificacion_promedio !== null &&
    user.calificacion_promedio !== undefined &&
    user.calificacion_promedio <= 2

  return (
    <Card className={hasLowRating ? "border-red-300" : undefined}>
      <CardContent className="flex items-center justify-between pt-6 gap-4 flex-wrap">
        <div className="flex-1 min-w-[220px]">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="font-medium">{user.nombre_completo}</div>
            <Badge variant={user.activo ? "default" : "destructive"}>
              {user.activo ? "Activo" : "Deshabilitado"}
            </Badge>
            {hasLowRating && (
              <Badge variant="destructive" className="flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                Calificación baja ({user.calificacion_promedio?.toFixed(1)}★)
              </Badge>
            )}
          </div>
          <div className="text-sm text-gray-500">{user.email}</div>
          <div className="flex items-center gap-4 flex-wrap text-xs text-gray-400 mt-1">
            <span className="flex items-center gap-1">
              <IdCard className="w-3 h-3" /> {user.rut_formateado || user.rut}
            </span>
            {user.telefono && (
              <span className="flex items-center gap-1">
                <Phone className="w-3 h-3" /> {user.telefono}
              </span>
            )}
            {(user.comuna_nombre || user.region_nombre) && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {[user.comuna_nombre, user.region_nombre].filter(Boolean).join(", ")}
              </span>
            )}
            {user.rol === "profesional" ? (
              <span>Reservas recibidas: {user.solicitudes_como_profesional ?? 0}</span>
            ) : (
              <span>Reservas realizadas: {user.solicitudes_como_cliente ?? 0}</span>
            )}
          </div>
          {hasLowRating && (
            <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              Posible motivo de deshabilitación de cuenta por bajo desempeño
            </p>
          )}
          {user.rol === "profesional" && user.servicios_activos && user.servicios_activos.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {user.servicios_activos.map((s) => (
                <Badge key={s} variant="outline" className="text-xs">{s}</Badge>
              ))}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => onViewDetail(user.rut)}>
            Ver historial
          </Button>
          <Button
            size="sm"
            variant={user.activo ? "destructive" : "secondary"}
            disabled={toggling}
            onClick={() => onToggleStatus(user)}
          >
            {toggling ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Procesando...
              </>
            ) : user.activo ? "Deshabilitar" : "Habilitar"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export default function UserServiceManager() {
  const [subTab, setSubTab] = useState<"profesionales" | "clientes">("profesionales")
  const [professionals, setProfessionals] = useState<UserListItem[]>([])
  const [clients, setClients] = useState<UserListItem[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState("")
  const [selectedRut, setSelectedRut] = useState<string | null>(null)
  const [showDetail, setShowDetail] = useState(false)
  const [togglingRut, setTogglingRut] = useState<string | null>(null)
  const [pendingDisable, setPendingDisable] = useState<UserListItem | null>(null)
  const [regionOptions, setRegionOptions] = useState<GeoOption[]>([])
  const [comunaOptions, setComunaOptions] = useState<GeoOption[]>([])
  const [regionFilter, setRegionFilter] = useState<string>("all")
  const [comunaFilter, setComunaFilter] = useState<string>("all")

  // Regiones habilitadas (misma fuente que usa el registro y el buscador de servicios)
  useEffect(() => {
    apiGet("/api/geo/regiones/")
      .then((rows: any[]) => setRegionOptions(Array.isArray(rows) ? rows.map((r) => ({ id: r.id, nombre: r.nombre })) : []))
      .catch(() => setRegionOptions([]))
  }, [])

  // Comunas habilitadas de la región seleccionada
  useEffect(() => {
    if (regionFilter === "all") {
      setComunaOptions([])
      setComunaFilter("all")
      return
    }
    apiGet(`/api/geo/comunas/?region_id=${encodeURIComponent(regionFilter)}`)
      .then((rows: any[]) => setComunaOptions(Array.isArray(rows) ? rows.map((c) => ({ id: c.id, nombre: c.nombre })) : []))
      .catch(() => setComunaOptions([]))
    setComunaFilter("all")
  }, [regionFilter])

  const fetchList = async (role: "profesional" | "cliente") => {
    const params = new URLSearchParams({ role, page_size: "100" })
    if (search) params.append("search", search)
    if (regionFilter !== "all") params.append("region_id", regionFilter)
    if (comunaFilter !== "all") params.append("comuna_id", comunaFilter)
    const data = await apiGetAuth(`/api/admin/operations/users/?${params.toString()}`)
    return (data.users || []) as UserListItem[]
  }

  const loadAll = async () => {
    try {
      setLoading(true)
      const [profs, clis] = await Promise.all([
        fetchList("profesional"),
        fetchList("cliente"),
      ])
      setProfessionals(profs)
      setClients(clis)
    } catch (err: any) {
      console.error("Error cargando gestor de servicios:", err)
      toast.error("Error cargando usuarios")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const timeout = setTimeout(() => {
      loadAll()
    }, 300)
    return () => clearTimeout(timeout)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, regionFilter, comunaFilter])

  const handleViewDetail = (rut: string) => {
    setSelectedRut(rut)
    setShowDetail(true)
  }

  const applyStatusUpdate = (rut: string, activo: boolean) => {
    setProfessionals((prev) => prev.map((u) => (u.rut === rut ? { ...u, activo } : u)))
    setClients((prev) => prev.map((u) => (u.rut === rut ? { ...u, activo } : u)))
  }

  const performToggle = async (user: UserListItem) => {
    const nuevoEstado = !user.activo
    try {
      setTogglingRut(user.rut)
      applyStatusUpdate(user.rut, nuevoEstado)
      const result = await apiPutAuth(`/api/admin/operations/users/${user.rut}/toggle-status/`, {
        activo: nuevoEstado,
      })
      if (nuevoEstado) {
        toast.success("Usuario habilitado")
      } else {
        const cancelledCount = result?.cancelled_requests ?? 0
        toast.success(
          cancelledCount > 0
            ? `Usuario deshabilitado. Se cancelaron ${cancelledCount} solicitud(es) pendiente(s)/confirmada(s) y se notificó a los usuarios involucrados.`
            : "Usuario deshabilitado"
        )
      }
    } catch (err: any) {
      console.error("Error actualizando usuario:", err)
      toast.error("Error actualizando usuario: " + err.message)
      applyStatusUpdate(user.rut, user.activo)
    } finally {
      setTogglingRut(null)
    }
  }

  const handleToggleStatus = (user: UserListItem) => {
    if (user.activo) {
      setPendingDisable(user)
    } else {
      performToggle(user)
    }
  }

  const confirmDisable = () => {
    if (pendingDisable) {
      performToggle(pendingDisable)
      setPendingDisable(null)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Gestor de Servicios por Usuario</h2>
        <p className="text-gray-600">
          Visualiza profesionales con sus servicios e historial, y clientes con su historial de reservas
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative max-w-md flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Buscar por nombre, email o RUT..."
            className="pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <Select value={regionFilter} onValueChange={setRegionFilter}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <MapPin className="w-4 h-4 mr-1 text-gray-400" />
            <SelectValue placeholder="Región" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las regiones</SelectItem>
            {regionOptions.map((r) => (
              <SelectItem key={r.id} value={r.id}>{r.nombre}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={comunaFilter} onValueChange={setComunaFilter} disabled={regionFilter === "all"}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Comuna" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las comunas</SelectItem>
            {comunaOptions.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Tabs value={subTab} onValueChange={(v) => setSubTab(v as "profesionales" | "clientes")}>
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="profesionales" className="flex items-center gap-2">
            <Briefcase className="w-4 h-4" /> Profesionales ({professionals.length})
          </TabsTrigger>
          <TabsTrigger value="clientes" className="flex items-center gap-2">
            <Users className="w-4 h-4" /> Clientes ({clients.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profesionales" className="space-y-4 mt-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
              <span className="ml-3 text-gray-600">Cargando profesionales...</span>
            </div>
          ) : professionals.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-gray-600">No se encontraron profesionales.</p>
              </CardContent>
            </Card>
          ) : (
            professionals.map((u) => (
              <UserCard
                key={u.rut}
                user={u}
                onViewDetail={handleViewDetail}
                onToggleStatus={handleToggleStatus}
                toggling={togglingRut === u.rut}
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="clientes" className="space-y-4 mt-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
              <span className="ml-3 text-gray-600">Cargando clientes...</span>
            </div>
          ) : clients.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-gray-600">No se encontraron clientes.</p>
              </CardContent>
            </Card>
          ) : (
            clients.map((u) => (
              <UserCard
                key={u.rut}
                user={u}
                onViewDetail={handleViewDetail}
                onToggleStatus={handleToggleStatus}
                toggling={togglingRut === u.rut}
              />
            ))
          )}
        </TabsContent>
      </Tabs>

      <UserDetailDialog rut={selectedRut} open={showDetail} onOpenChange={setShowDetail} />

      <AlertDialog open={!!pendingDisable} onOpenChange={(open) => !open && setPendingDisable(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Deshabilitar esta cuenta?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDisable && (
                <>
                  Estás a punto de deshabilitar la cuenta de <strong>{pendingDisable.nombre_completo}</strong>.
                  {" "}Si tiene solicitudes de servicio pendientes o confirmadas (como cliente o profesional),
                  se cancelarán automáticamente y se notificará a los usuarios involucrados indicando el motivo.
                  Esta acción no se puede deshacer fácilmente.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPendingDisable(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDisable} className="bg-red-600 hover:bg-red-700 text-white">
              Sí, deshabilitar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
