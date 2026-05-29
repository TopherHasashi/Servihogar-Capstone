import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"
import { Button } from "../ui/button"
import { Badge } from "../ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar"
import { Alert, AlertDescription } from "../ui/alert"
import { Label } from "../ui/label"
import { Textarea } from "../ui/textarea"
import { Input } from "../ui/input"
import { apiGet, apiGetAuth, apiPostAuth, API_URL } from "../../lib/api"
import {
  Calendar,
  Clock,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Star,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  User,
} from "lucide-react"

interface ServiceBookingProps {
  professional: any
  user?: any
  onBack: () => void
  onBookingComplete: (booking: any) => void
}

interface SlotItem {
  start: string
  end: string
}

interface DayAvailability {
  date: string
  slots: SlotItem[]
}

export default function ServiceBooking({ professional, user, onBack, onBookingComplete }: ServiceBookingProps) {
  const serviceId = professional?.id_servicio_profesional ?? professional?.service_id ?? professional?.id

  // Calendar navigation
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const [viewDate, setViewDate] = useState<Date>(new Date(today))
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [selectedSlot, setSelectedSlot] = useState<SlotItem | null>(null)

  // Availability data
  const [availability, setAvailability] = useState<DayAvailability[]>([])
  const [loadingAvailability, setLoadingAvailability] = useState(false)
  const [availError, setAvailError] = useState<string | null>(null)

  // Booking form
  const [description, setDescription] = useState("")
  const [address, setAddress] = useState(user?.dominio?.direccion ?? user?.address ?? "")
  const [submitting, setSubmitting] = useState(false)
  const [bookingError, setBookingError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [completedBooking, setCompletedBooking] = useState<any>(null)

  // Fetch availability for the viewed month window
  useEffect(() => {
    if (!serviceId) return
    const start = formatDate(viewDate)
    const end = formatDate(addDays(viewDate, 30))
    setLoadingAvailability(true)
    setAvailError(null)
    apiGet(`/api/services/${serviceId}/availability/?start=${start}&end=${end}`)
      .then((data: any) => setAvailability(data?.days ?? []))
      .catch((err: any) => setAvailError(err?.message ?? "Error al cargar disponibilidad"))
      .finally(() => setLoadingAvailability(false))
  }, [serviceId, viewDate])

  function formatDate(d: Date): string {
    return d.toISOString().slice(0, 10)
  }

  function addDays(d: Date, n: number): Date {
    const r = new Date(d)
    r.setDate(r.getDate() + n)
    return r
  }

  function getCalendarDays(): Date[] {
    const year = viewDate.getFullYear()
    const month = viewDate.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const days: Date[] = []
    // Padding before first day (Mon=0 … Sun=6)
    const startDow = (firstDay.getDay() + 6) % 7
    for (let i = 0; i < startDow; i++) days.push(new Date(year, month, 1 - startDow + i))
    for (let d = 1; d <= lastDay.getDate(); d++) days.push(new Date(year, month, d))
    // Padding after last day to complete weeks
    const remaining = 7 - (days.length % 7)
    if (remaining < 7) for (let i = 1; i <= remaining; i++) days.push(new Date(year, month + 1, i))
    return days
  }

  function slotsForDate(dateStr: string): SlotItem[] {
    return availability.find((d) => d.date === dateStr)?.slots ?? []
  }

  function isCurrentMonth(d: Date): boolean {
    return d.getMonth() === viewDate.getMonth() && d.getFullYear() === viewDate.getFullYear()
  }

  function isPast(d: Date): boolean {
    return d < today
  }

  function hasSlots(d: Date): boolean {
    return slotsForDate(formatDate(d)).length > 0
  }

  function prevMonth() {
    setViewDate((v) => new Date(v.getFullYear(), v.getMonth() - 1, 1))
    setSelectedDate(null)
    setSelectedSlot(null)
  }

  function nextMonth() {
    setViewDate((v) => new Date(v.getFullYear(), v.getMonth() + 1, 1))
    setSelectedDate(null)
    setSelectedSlot(null)
  }

  function handleSelectDate(d: Date) {
    if (isPast(d) || !hasSlots(d)) return
    const ds = formatDate(d)
    setSelectedDate(ds === selectedDate ? null : ds)
    setSelectedSlot(null)
  }

  async function handleBook() {
    if (!selectedDate || !selectedSlot) return
    setSubmitting(true)
    setBookingError(null)
    try {
      const result = await apiPostAuth(`/api/services/${serviceId}/book/`, {
        date: selectedDate,
        start: selectedSlot.start,
        descripcion: description,
        address,
      })
      setCompletedBooking(result)
      setSuccess(true)
    } catch (err: any) {
      setBookingError(err?.message ?? "No se pudo realizar la reserva")
    } finally {
      setSubmitting(false)
    }
  }

  const calDays = getCalendarDays()
  const selectedSlots = selectedDate ? slotsForDate(selectedDate) : []
  const monthName = viewDate.toLocaleDateString("es-CL", { month: "long", year: "numeric" })
  const profesionalName = `${professional?.nombres ?? professional?.first_name ?? ""} ${professional?.apellidos ?? professional?.last_name ?? ""}`.trim()
  const categoria = professional?.categoria ?? professional?.category ?? ""
  const precio = professional?.precio_fijo ?? professional?.price ?? 0
  const rating = professional?.calificacion_promedio ?? professional?.rating ?? null
  const avatarUrl = professional?.avatar ?? professional?.foto_perfil_url ?? null

  if (success && completedBooking) {
    return (
      <div className="space-y-4 max-w-lg mx-auto py-6">
        <Card>
          <CardContent className="pt-8 pb-8 flex flex-col items-center gap-4 text-center">
            <CheckCircle className="h-16 w-16 text-green-500" />
            <h2 className="text-xl font-bold text-green-700">¡Reserva realizada!</h2>
            <p className="text-gray-600 text-sm">
              Tu solicitud fue enviada al profesional. Quedará en estado <strong>Pendiente</strong> hasta que la confirme.
            </p>
            <div className="text-sm text-gray-500 space-y-1">
              <p><span className="font-medium">Fecha:</span> {selectedDate}</p>
              <p><span className="font-medium">Hora:</span> {selectedSlot?.start} – {selectedSlot?.end}</p>
              {completedBooking.duracion_minutos && (
                <p><span className="font-medium">Duración:</span> {completedBooking.duracion_minutos} min</p>
              )}
              <p><span className="font-medium">Precio:</span> ${precio?.toLocaleString("es-CL")}</p>
            </div>
            <div className="flex gap-2 mt-2">
              <Button variant="outline" onClick={onBack}>Volver a búsqueda</Button>
              <Button onClick={() => onBookingComplete(completedBooking)}>Ver mis solicitudes</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h2 className="text-lg font-semibold">Reservar servicio</h2>
      </div>

      {/* Professional summary */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              {avatarUrl ? <AvatarImage src={avatarUrl} alt={profesionalName} /> : null}
              <AvatarFallback><User className="h-6 w-6" /></AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{profesionalName}</p>
              <p className="text-sm text-gray-500">{categoria}</p>
            </div>
            <div className="text-right shrink-0">
              <p className="font-semibold text-green-600">${precio?.toLocaleString("es-CL")}</p>
              {rating !== null && rating > 0 && (
                <div className="flex items-center gap-1 justify-end text-xs text-yellow-500">
                  <Star className="h-3 w-3 fill-current" />
                  <span>{Number(rating).toFixed(1)}</span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Calendar */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <Button variant="ghost" size="icon" onClick={prevMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <CardTitle className="text-sm capitalize">{monthName}</CardTitle>
              <Button variant="ghost" size="icon" onClick={nextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loadingAvailability ? (
              <p className="text-center text-xs text-gray-400 py-6">Cargando disponibilidad…</p>
            ) : availError ? (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs">{availError}</AlertDescription>
              </Alert>
            ) : (
              <>
                {/* Weekday headers */}
                <div className="grid grid-cols-7 mb-1">
                  {["Lu", "Ma", "Mi", "Ju", "Vi", "Sa", "Do"].map((d) => (
                    <div key={d} className="text-center text-xs text-gray-400 font-medium py-1">{d}</div>
                  ))}
                </div>
                {/* Days */}
                <div className="grid grid-cols-7 gap-0.5">
                  {calDays.map((d, i) => {
                    const ds = formatDate(d)
                    const inMonth = isCurrentMonth(d)
                    const past = isPast(d)
                    const avail = inMonth && !past && hasSlots(d)
                    const sel = ds === selectedDate
                    return (
                      <button
                        key={i}
                        onClick={() => handleSelectDate(d)}
                        disabled={!avail}
                        className={[
                          "aspect-square rounded-lg text-xs font-medium transition-colors",
                          !inMonth ? "text-gray-200" : "",
                          past && inMonth ? "text-gray-300 cursor-not-allowed" : "",
                          avail && !sel ? "bg-green-50 text-green-700 hover:bg-green-100 cursor-pointer" : "",
                          sel ? "bg-green-600 text-white" : "",
                          !avail && inMonth && !past ? "text-gray-400 cursor-not-allowed" : "",
                        ].join(" ")}
                      >
                        {d.getDate()}
                      </button>
                    )
                  })}
                </div>
                <div className="flex items-center gap-2 mt-3 text-xs text-gray-500">
                  <span className="inline-block w-3 h-3 rounded bg-green-100 border border-green-300" />
                  Disponible
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Slots + form */}
        <div className="space-y-4">
          {/* Time slots */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Clock className="h-4 w-4" />
                {selectedDate
                  ? `Horarios — ${new Date(selectedDate + "T00:00:00").toLocaleDateString("es-CL", { weekday: "long", day: "numeric", month: "long" })}`
                  : "Selecciona un día"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!selectedDate ? (
                <p className="text-xs text-gray-400 py-2">Elige un día con disponibilidad en el calendario.</p>
              ) : selectedSlots.length === 0 ? (
                <p className="text-xs text-gray-400 py-2">No hay horarios disponibles para este día.</p>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {selectedSlots.map((slot, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedSlot(slot.start === selectedSlot?.start ? null : slot)}
                      className={[
                        "rounded-lg border px-2 py-1.5 text-xs font-medium transition-colors",
                        selectedSlot?.start === slot.start
                          ? "border-green-600 bg-green-600 text-white"
                          : "border-gray-200 hover:border-green-400 hover:bg-green-50",
                      ].join(" ")}
                    >
                      {slot.start} – {slot.end}
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Booking details form */}
          {selectedSlot && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Detalles de la reserva</CardTitle>
                <CardDescription className="text-xs">
                  {selectedDate} a las {selectedSlot.start} · ${precio?.toLocaleString("es-CL")}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label htmlFor="address" className="text-xs">Dirección del servicio</Label>
                  <div className="flex items-center gap-1 mt-1">
                    <MapPin className="h-3 w-3 text-gray-400 shrink-0" />
                    <Input
                      id="address"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Ingresa la dirección"
                      className="text-xs h-8"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="description" className="text-xs">Descripción (opcional)</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe lo que necesitas…"
                    className="text-xs resize-none mt-1"
                    rows={3}
                  />
                </div>
                {bookingError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-xs">{bookingError}</AlertDescription>
                  </Alert>
                )}
                <Button onClick={handleBook} disabled={submitting || !address.trim()} className="w-full">
                  {submitting ? "Reservando…" : "Confirmar reserva"}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
