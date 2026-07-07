import { useEffect, useState } from "react"
import { toast } from "sonner"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"
import { Button } from "../ui/button"
import { Badge } from "../ui/badge"
import { Input } from "../ui/input"
import { Label } from "../ui/label"
import { Switch } from "../ui/switch"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select"
import { apiGetAuth, apiPostAuth, apiPutAuth } from "../../lib/api"
import {
  Loader2,
  MapPin,
  ChevronDown,
  ChevronRight,
  Tag,
  Plus,
  Pencil,
  Settings,
} from "lucide-react"

interface RegionItem {
  id: string
  nombre: string
  codigo: string | null
  disponible: boolean
  total_comunas: number
  comunas_disponibles: number
}

interface ComunaItem {
  id: string
  nombre: string
  codigo: string | null
  disponible: boolean
}

interface CategoryItem {
  id: string
  nombre: string
  descripcion: string | null
  descripcion_corta: string | null
  creado_en: string | null
}

function GeoCoverageSection() {
  const [regions, setRegions] = useState<RegionItem[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [comunasByRegion, setComunasByRegion] = useState<Record<string, ComunaItem[]>>({})
  const [loadingComunas, setLoadingComunas] = useState<string | null>(null)
  const [togglingComuna, setTogglingComuna] = useState<string | null>(null)
  const [pendingDisableComuna, setPendingDisableComuna] = useState<{ regionId: string; comuna: ComunaItem } | null>(null)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [selectedRegionToAdd, setSelectedRegionToAdd] = useState<string>("")
  const [addingRegion, setAddingRegion] = useState(false)
  const [pendingAddRegion, setPendingAddRegion] = useState<RegionItem | null>(null)

  const loadRegions = async () => {
    try {
      setLoading(true)
      const data = await apiGetAuth("/api/admin/config/regions/")
      setRegions(Array.isArray(data) ? data : [])
    } catch (err: any) {
      console.error("Error cargando regiones:", err)
      toast.error("Error cargando regiones")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadRegions()
  }, [])

  const loadComunas = async (regionId: string) => {
    try {
      setLoadingComunas(regionId)
      const data = await apiGetAuth(`/api/admin/config/regions/${regionId}/comunas/`)
      setComunasByRegion((prev) => ({ ...prev, [regionId]: Array.isArray(data) ? data : [] }))
    } catch (err: any) {
      console.error("Error cargando comunas:", err)
      toast.error("Error cargando comunas")
    } finally {
      setLoadingComunas(null)
    }
  }

  const handleExpand = (region: RegionItem) => {
    if (expanded === region.id) {
      setExpanded(null)
      return
    }
    setExpanded(region.id)
    if (!comunasByRegion[region.id]) {
      loadComunas(region.id)
    }
  }

  const addedRegions = regions.filter((r) => r.disponible)
  const availableToAdd = regions.filter((r) => !r.disponible)

  const handleOpenAddDialog = () => {
    setSelectedRegionToAdd("")
    setShowAddDialog(true)
  }

  const handleRequestAddRegion = () => {
    const region = regions.find((r) => r.id === selectedRegionToAdd)
    if (!region) {
      toast.error("Selecciona una región para agregar")
      return
    }
    // Pide confirmación explícita antes de agregar la región (acción no instantánea)
    setPendingAddRegion(region)
  }

  const confirmAddRegion = async () => {
    const region = pendingAddRegion
    if (!region) return
    try {
      setAddingRegion(true)
      await apiPostAuth(`/api/admin/config/regions/${region.id}/enable/`, {})
      setRegions((prev) =>
        prev.map((r) =>
          r.id === region.id ? { ...r, disponible: true, comunas_disponibles: r.total_comunas } : r
        )
      )
      toast.success(`Región "${region.nombre}" agregada junto con sus ${region.total_comunas} comuna(s)`)
      setPendingAddRegion(null)
      setShowAddDialog(false)
      setExpanded(region.id)
      loadComunas(region.id)
    } catch (err: any) {
      console.error("Error agregando región:", err)
      toast.error("Error agregando región: " + err.message)
    } finally {
      setAddingRegion(false)
    }
  }

  const applyComunaStatus = (regionId: string, comunaId: string, disponible: boolean) => {
    setComunasByRegion((prev) => ({
      ...prev,
      [regionId]: (prev[regionId] || []).map((c) => (c.id === comunaId ? { ...c, disponible } : c)),
    }))
    setRegions((prev) =>
      prev.map((r) => {
        if (r.id !== regionId) return r
        const delta = disponible ? 1 : -1
        return { ...r, comunas_disponibles: Math.max(0, Math.min(r.total_comunas, r.comunas_disponibles + delta)) }
      })
    )
  }

  const performToggleComuna = async (regionId: string, comuna: ComunaItem) => {
    const nuevoEstado = !comuna.disponible
    try {
      setTogglingComuna(comuna.id)
      applyComunaStatus(regionId, comuna.id, nuevoEstado)
      await apiPutAuth(`/api/admin/config/comunas/${comuna.id}/toggle/`, { disponible: nuevoEstado })
      toast.success(`Comuna ${nuevoEstado ? "habilitada" : "deshabilitada"} correctamente`)
    } catch (err: any) {
      console.error("Error actualizando comuna:", err)
      toast.error("Error actualizando comuna: " + err.message)
      applyComunaStatus(regionId, comuna.id, comuna.disponible)
    } finally {
      setTogglingComuna(null)
    }
  }

  const handleToggleComuna = (regionId: string, comuna: ComunaItem) => {
    if (comuna.disponible) {
      // Deshabilitar requiere advertencia previa
      setPendingDisableComuna({ regionId, comuna })
    } else {
      performToggleComuna(regionId, comuna)
    }
  }

  const confirmDisableComuna = () => {
    if (pendingDisableComuna) {
      performToggleComuna(pendingDisableComuna.regionId, pendingDisableComuna.comuna)
      setPendingDisableComuna(null)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <MapPin className="w-4 h-4 text-blue-600" /> Cobertura Geográfica
            </CardTitle>
            <CardDescription>
              Solo se listan las regiones agregadas a ServiHogar. Una vez agregada, solo sus comunas
              pueden deshabilitarse individualmente. Afecta el registro de nuevos usuarios y los filtros
              de búsqueda de servicios.
            </CardDescription>
          </div>
          <Button size="sm" onClick={handleOpenAddDialog} disabled={loading || availableToAdd.length === 0}>
            <Plus className="w-4 h-4 mr-2" /> Agregar región
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            <span className="ml-3 text-gray-600">Cargando regiones...</span>
          </div>
        ) : addedRegions.length === 0 ? (
          <p className="text-sm text-gray-600">Aún no se ha agregado ninguna región.</p>
        ) : (
          <div className="space-y-2">
            {addedRegions.map((region) => (
              <div key={region.id} className="border rounded-lg">
                <div className="flex items-center justify-between p-3 gap-3 flex-wrap">
                  <button
                    type="button"
                    className="flex items-center gap-2 flex-1 min-w-[200px] text-left"
                    onClick={() => handleExpand(region)}
                  >
                    {expanded === region.id ? (
                      <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
                    )}
                    <div>
                      <p className="font-medium">{region.nombre}</p>
                      <p className="text-xs text-gray-500">
                        {region.comunas_disponibles} de {region.total_comunas} comunas habilitadas
                      </p>
                    </div>
                  </button>
                  <Badge>Agregada</Badge>
                </div>

                {expanded === region.id && (
                  <div className="border-t px-3 py-2 space-y-1 bg-gray-50">
                    {loadingComunas === region.id ? (
                      <div className="flex items-center justify-center py-4">
                        <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                        <span className="ml-2 text-sm text-gray-500">Cargando comunas...</span>
                      </div>
                    ) : (comunasByRegion[region.id] || []).length === 0 ? (
                      <p className="text-xs text-gray-500 py-2">Esta región no tiene comunas registradas.</p>
                    ) : (
                      (comunasByRegion[region.id] || []).map((comuna) => (
                        <div key={comuna.id} className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-gray-100">
                          <span className="text-sm">{comuna.nombre}</span>
                          <div className="flex items-center gap-2">
                            <Badge variant={comuna.disponible ? "outline" : "destructive"} className="text-xs">
                              {comuna.disponible ? "Habilitada" : "Deshabilitada"}
                            </Badge>
                            <Switch
                              checked={comuna.disponible}
                              disabled={togglingComuna === comuna.id}
                              onCheckedChange={() => handleToggleComuna(region.id, comuna)}
                            />
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Agregar región</DialogTitle>
            <DialogDescription>
              Selecciona una región para incorporarla a la cobertura de ServiHogar junto con todas sus
              comunas.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="region-a-agregar">Región</Label>
            {availableToAdd.length === 0 ? (
              <p className="text-sm text-gray-500">Ya se agregaron todas las regiones disponibles.</p>
            ) : (
              <Select value={selectedRegionToAdd} onValueChange={setSelectedRegionToAdd}>
                <SelectTrigger id="region-a-agregar">
                  <SelectValue placeholder="Selecciona una región" />
                </SelectTrigger>
                <SelectContent>
                  {availableToAdd.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.nombre} ({r.total_comunas} comuna{r.total_comunas !== 1 ? "s" : ""})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)} disabled={addingRegion}>
              Cancelar
            </Button>
            <Button
              onClick={handleRequestAddRegion}
              disabled={addingRegion || !selectedRegionToAdd || availableToAdd.length === 0}
            >
              Agregar región
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!pendingAddRegion} onOpenChange={(open) => !open && !addingRegion && setPendingAddRegion(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Agregar esta región?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingAddRegion && (
                <>
                  Estás a punto de agregar <strong>{pendingAddRegion.nombre}</strong> a la cobertura de
                  ServiHogar, junto con sus <strong>{pendingAddRegion.total_comunas}</strong> comuna(s).
                  {" "}A partir de este momento quedará disponible para el registro de nuevos usuarios y
                  para los filtros de búsqueda de servicios.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPendingAddRegion(null)} disabled={addingRegion}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmAddRegion} disabled={addingRegion}>
              {addingRegion ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Agregando...
                </>
              ) : (
                "Sí, agregar región"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!pendingDisableComuna} onOpenChange={(open) => !open && setPendingDisableComuna(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Deshabilitar esta comuna?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDisableComuna && (
                <>
                  Estás a punto de deshabilitar <strong>{pendingDisableComuna.comuna.nombre}</strong>.
                  {" "}Los usuarios ya registrados en esta comuna no se verán afectados, pero dejará de
                  estar disponible para el registro de nuevos usuarios y para los filtros de búsqueda de
                  servicios.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPendingDisableComuna(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDisableComuna} className="bg-red-600 hover:bg-red-700 text-white">
              Sí, deshabilitar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}

function CategoryFormDialog({
  open,
  onOpenChange,
  category,
  onSaved,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  category: CategoryItem | null
  onSaved: () => void
}) {
  const [nombre, setNombre] = useState("")
  const [descripcion, setDescripcion] = useState("")
  const [saving, setSaving] = useState(false)
  const [pendingCreate, setPendingCreate] = useState<{ nombre: string; descripcion: string } | null>(null)
  const isEditing = !!category

  useEffect(() => {
    if (open) {
      setNombre(category?.nombre || "")
      setDescripcion(category?.descripcion || "")
    }
  }, [open, category])

  const performSave = async (nombreFinal: string, descripcionFinal: string) => {
    try {
      setSaving(true)
      if (isEditing && category) {
        await apiPutAuth(`/api/admin/config/categories/${category.id}/`, {
          nombre: nombreFinal,
          descripcion: descripcionFinal || null,
        })
        toast.success("Categoría actualizada correctamente")
      } else {
        await apiPostAuth("/api/admin/config/categories/create/", {
          nombre: nombreFinal,
          descripcion: descripcionFinal || null,
        })
        toast.success("Categoría creada correctamente")
      }
      setPendingCreate(null)
      onOpenChange(false)
      onSaved()
    } catch (err: any) {
      console.error("Error guardando categoría:", err)
      toast.error(err.message || "Error guardando categoría")
    } finally {
      setSaving(false)
    }
  }

  const handleSave = () => {
    const trimmed = nombre.trim()
    if (!trimmed) {
      toast.error("El nombre de la categoría es obligatorio")
      return
    }
    if (isEditing) {
      // Renombrar/editar no requiere confirmación adicional
      performSave(trimmed, descripcion)
    } else {
      // Crear una categoría nueva pide confirmación explícita antes de guardar
      setPendingCreate({ nombre: trimmed, descripcion })
    }
  }

  const confirmCreate = () => {
    if (pendingCreate) {
      performSave(pendingCreate.nombre, pendingCreate.descripcion)
    }
  }

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar categoría" : "Nueva categoría de servicio"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Corrige el nombre o la descripción de la categoría."
              : "Agrega una nueva categoría para que los profesionales puedan ofrecer servicios en ella."}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="categoria-nombre">Nombre</Label>
            <Input
              id="categoria-nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: Gasfitería"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="categoria-descripcion">Descripción (opcional)</Label>
            <Input
              id="categoria-descripcion"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Breve descripción de la categoría"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Guardando...
              </>
            ) : isEditing ? "Guardar cambios" : "Crear categoría"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <AlertDialog open={!!pendingCreate} onOpenChange={(open) => !open && !saving && setPendingCreate(null)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Crear esta categoría?</AlertDialogTitle>
          <AlertDialogDescription>
            {pendingCreate && (
              <>
                Estás a punto de agregar la categoría <strong>{pendingCreate.nombre}</strong> al catálogo
                de servicios. A partir de este momento, los profesionales podrán ofrecer servicios en
                esta categoría.
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setPendingCreate(null)} disabled={saving}>
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction onClick={confirmCreate} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creando...
              </>
            ) : (
              "Sí, crear categoría"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  )
}

function CategoriesSection() {
  const [categories, setCategories] = useState<CategoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingCategory, setEditingCategory] = useState<CategoryItem | null>(null)

  const loadCategories = async () => {
    try {
      setLoading(true)
      const data = await apiGetAuth("/api/admin/config/categories/")
      setCategories(Array.isArray(data) ? data : [])
    } catch (err: any) {
      console.error("Error cargando categorías:", err)
      toast.error("Error cargando categorías")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCategories()
  }, [])

  const handleAdd = () => {
    setEditingCategory(null)
    setShowForm(true)
  }

  const handleEdit = (category: CategoryItem) => {
    setEditingCategory(category)
    setShowForm(true)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <Tag className="w-4 h-4 text-indigo-600" /> Categorías de Servicio
            </CardTitle>
            <CardDescription>
              Crea nuevas categorías o corrige el nombre de una categoría existente.
            </CardDescription>
          </div>
          <Button size="sm" onClick={handleAdd}>
            <Plus className="w-4 h-4 mr-2" /> Nueva categoría
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            <span className="ml-3 text-gray-600">Cargando categorías...</span>
          </div>
        ) : categories.length === 0 ? (
          <p className="text-sm text-gray-600">No hay categorías registradas.</p>
        ) : (
          <div className="space-y-2">
            {categories.map((cat) => (
              <div key={cat.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">{cat.nombre}</p>
                  {cat.descripcion && <p className="text-xs text-gray-500">{cat.descripcion}</p>}
                </div>
                <Button size="sm" variant="outline" onClick={() => handleEdit(cat)}>
                  <Pencil className="w-3.5 h-3.5 mr-2" /> Editar
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <CategoryFormDialog
        open={showForm}
        onOpenChange={setShowForm}
        category={editingCategory}
        onSaved={loadCategories}
      />
    </Card>
  )
}

export default function PlatformSettingsTab() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Settings className="w-6 h-6 text-gray-500" /> Centro de Operaciones
        </h2>
        <p className="text-gray-600">Configuración general de la plataforma ServiHogar</p>
      </div>

      <GeoCoverageSection />
      <CategoriesSection />
    </div>
  )
}
