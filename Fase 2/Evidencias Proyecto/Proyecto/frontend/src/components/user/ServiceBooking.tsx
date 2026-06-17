import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"
import { Button } from "../ui/button"
import { Badge } from "../ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar"
import { Alert, AlertDescription } from "../ui/alert"
import { Label } from "../ui/label"
import { Textarea } from "../ui/textarea"
import { Input } from "../ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { Separator } from "../ui/separator"
import { apiGet, apiPostAuth } from "../../lib/api"
import {
  Calendar as CalendarIcon,
  Clock,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Star,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  User,
  MessageSquare,
  CreditCard,
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
  available?: boolean
}

interface DayAvailability {
  date: string
  slots: SlotItem[]
}

interface ReviewItem {
  rating: number
  calidad: number
  puntualidad: number
  comunicacion: number
  comment: string
  date: string
}

interface ReviewsData {
  average_rating: number | null
  total_reviews: number
  breakdown: { calidad: number; puntualidad: number; comunicacion: number }
  reviews: ReviewItem[]
}

export default function ServiceBooking({ professional, user, onBack, onBookingComplete }: ServiceBookingProps) {
  const serviceId = professional?.id_servicio_profesional ?? professional?.service_id ?? professional?.id

  // Professional field resolution
  const profesionalName =
    professional?.name ??
    `${professional?.nombres ?? professional?.first_name ?? ""} ${professional?.apellidos ?? professional?.last_name ?? ""}`.trim()
  const categoria = professional?.service ?? professional?.categoria ?? professional?.category ?? ""
  const precio = professional?.basePrice ?? professional?.precio_fijo ?? professional?.price ?? 0
  const rating = professional?.rating ?? professional?.calificacion_promedio ?? null
  const avatarUrl = professional?.avatar ?? professional?.foto_perfil_url ?? null
  const verified = professional?.verificado ?? professional?.verified ?? false
  const location = professional?.region ?? professional?.location ?? ""
  const descriptionText = professional?.descripcion ?? professional?.description ?? ""
  const weeklySchedule = professional?.weeklySchedule ?? null
  const durationType = professional?.durationType ?? "fixed"
  const fixedDuration = professional?.fixedDuration ?? professional?.duracion_minutos ?? 60
  const minDuration = professional?.minDuration ?? 60
  const maxDuration = professional?.maxDuration ?? 240

  // Booking step
  const [bookingStep, setBookingStep] = useState<"datetime" | "details" | "confirmation">("datetime")

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

  // Reviews
  const [reviewsData, setReviewsData] = useState<ReviewsData | null>(null)
  const [showAllReviews, setShowAllReviews] = useState(false)

  // Booking form
  const [serviceDetails, setServiceDetails] = useState({
    address: user?.dominio?.direccion ?? user?.address ?? "",
    phone: user?.telefono ?? user?.phone ?? "",
    description: "",
    specialRequests: "",
    preferredPaymentMethod: "efectivo",
  })
  const [submitting, setSubmitting] = useState(false)
  const [bookingError, setBookingError] = useState<string | null>(null)
  const [completedBooking, setCompletedBooking] = useState<any>(null)

  // Pre-fill user data when it loads
  useEffect(() => {
    if (user) {
      setServiceDetails((prev) => ({
        ...prev,
        address: prev.address || user?.dominio?.direccion || user?.address || "",
        phone: prev.phone || user?.telefono || user?.phone || "",
      }))
    }
  }, [user])

  // Fetch reviews
  useEffect(() => {
    if (!serviceId) return
    apiGet(`/api/services/${serviceId}/reviews/`)
      .then((data: any) => setReviewsData(data))
      .catch(() => {})
  }, [serviceId])

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

  // Calendar helpers
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
    const startDow = (firstDay.getDay() + 6) % 7
    for (let i = 0; i < startDow; i++) days.push(new Date(year, month, 1 - startDow + i))
    for (let d = 1; d <= lastDay.getDate(); d++) days.push(new Date(year, month, d))
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

  function hasAvailableSlots(d: Date): boolean {
    return slotsForDate(formatDate(d)).some((s) => s.available !== false)
  }

  function formatDuration(minutes: number) {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours > 0 && mins > 0) return `${hours}h ${mins}min`
    if (hours > 0) return `${hours}h`
    return `${mins}min`
  }

  function renderStars(r: number, size = "w-4 h-4") {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((s) => (
          <Star key={s} className={`${size} ${s <= r ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`} />
        ))}
      </div>
    )
  }

  function formatReviewDate(dateString: string) {
    const date = new Date(dateString)
    const now = new Date()
    const diffDays = Math.ceil(Math.abs(now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
    if (diffDays === 1) return "Hace 1 día"
    if (diffDays < 7) return `Hace ${diffDays} días`
    if (diffDays < 30) return `Hace ${Math.floor(diffDays / 7)} semana${Math.floor(diffDays / 7) > 1 ? "s" : ""}`
    return date.toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" })
  }

  function getDefaultWeeklySchedule() {
    return {
      monday: { enabled: true, timeSlots: [{ start: "08:00", end: "18:00" }] },
      tuesday: { enabled: true, timeSlots: [{ start: "08:00", end: "18:00" }] },
      wednesday: { enabled: true, timeSlots: [{ start: "08:00", end: "18:00" }] },
      thursday: { enabled: true, timeSlots: [{ start: "08:00", end: "18:00" }] },
      friday: { enabled: true, timeSlots: [{ start: "08:00", end: "18:00" }] },
      saturday: { enabled: true, timeSlots: [{ start: "09:00", end: "14:00" }] },
      sunday: { enabled: false, timeSlots: [] },
    }
  }

  async function handleBook() {
    if (!selectedDate || !selectedSlot) return
    setSubmitting(true)
    setBookingError(null)
    try {
      const result = await apiPostAuth(`/api/services/${serviceId}/book/`, {
        date: selectedDate,
        start: selectedSlot.start,
        descripcion: serviceDetails.description,
        address: serviceDetails.address,
      })
      setCompletedBooking(result)
      setBookingStep("confirmation")
      setTimeout(() => {
        onBookingComplete(result)
      }, 3000)
    } catch (err: any) {
      setBookingError(err?.message ?? "No se pudo realizar la reserva")
    } finally {
      setSubmitting(false)
    }
  }

  const calDays = getCalendarDays()
  const selectedSlots = selectedDate ? slotsForDate(selectedDate) : []
  const monthName = viewDate.toLocaleDateString("es-CL", { month: "long", year: "numeric" })

  // ── Confirmation screen ──────────────────────────────────────────────────────
  if (bookingStep === "confirmation") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-2xl w-full shadow-lg">
          <CardContent className="text-center py-12 px-8">
            <div className="w-20 h-20 bg-gradient-to-r from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
              <CheckCircle className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-3">¡Reserva Enviada!</h2>
            <p className="text-gray-600 mb-8 text-lg">
              Tu solicitud fue enviada al profesional. Quedará en estado <strong>Pendiente</strong> hasta que la confirme.
            </p>
            <div className="bg-gradient-to-r from-gray-50 to-white rounded-lg border p-6 mb-8">
              <h3 className="font-semibold text-gray-900 mb-4">Detalles de tu Reserva</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Profesional</p>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        {avatarUrl && <AvatarImage src={avatarUrl} />}
                        <AvatarFallback className="text-xs">
                          {profesionalName.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{profesionalName}</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Servicio</p>
                    <p className="font-medium">{categoria}</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Fecha y Hora</p>
                    <div className="space-y-1">
                      <p className="font-medium">
                        {selectedDate &&
                          new Date(selectedDate + "T00:00:00").toLocaleDateString("es-ES", {
                            weekday: "long",
                            day: "numeric",
                            month: "long",
                          })}
                      </p>
                      <p className="text-gray-600">{selectedSlot?.start}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Total</p>
                    <p className="font-bold text-green-600 text-lg">${precio?.toLocaleString("es-CL")}</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <CreditCard className="w-5 h-5 text-blue-600 shrink-0" />
                  <div className="text-left">
                    <p className="text-sm font-medium text-blue-800">Pago Presencial</p>
                    <p className="text-xs text-blue-700 mt-1">
                      El pago se realizará directamente con el profesional al momento del servicio (
                      {serviceDetails.preferredPaymentMethod === "efectivo"
                        ? "Efectivo"
                        : serviceDetails.preferredPaymentMethod === "transferencia"
                        ? "Transferencia"
                        : "Por acordar"}
                      )
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-center gap-2 text-blue-600">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600" />
                <p className="text-sm font-medium">Redirigiendo a tus solicitudes…</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // ── Main layout ──────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={onBack} className="text-gray-600">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver
            </Button>
            <div className="flex items-center gap-4 flex-1">
              <Avatar className="h-16 w-16 border-2 border-white shadow-md">
                {avatarUrl && <AvatarImage src={avatarUrl} alt={profesionalName} />}
                <AvatarFallback className="text-lg">
                  {profesionalName.split(" ").map((n: string) => n[0]).join("").slice(0, 2) || (
                    <User className="h-6 w-6" />
                  )}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-2xl font-semibold">{profesionalName}</h1>
                  {verified && (
                    <Badge variant="outline" className="text-green-600 border-green-600 bg-green-50">
                      <CheckCircle className="w-3 h-3 mr-1 text-green-600" />
                      Verificado
                    </Badge>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                  <Badge variant="secondary">{categoria}</Badge>
                  {reviewsData && reviewsData.average_rating !== null ? (
                    <div className="flex items-center gap-1">
                      {renderStars(Math.round(reviewsData.average_rating))}
                      <span className="ml-1 font-medium">
                        {reviewsData.average_rating.toFixed(1)} ({reviewsData.total_reviews} reseña{reviewsData.total_reviews !== 1 ? "s" : ""})
                      </span>
                    </div>
                  ) : rating !== null && rating > 0 ? (
                    <div className="flex items-center gap-1">
                      {renderStars(Math.round(Number(rating)))}
                      <span className="ml-1">{Number(rating).toFixed(1)}</span>
                    </div>
                  ) : null}
                  {location && (
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      <span>{location}</span>
                    </div>
                  )}
                  <span className="text-green-600 font-medium">${precio?.toLocaleString("es-CL")}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Progress indicator */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <div className="flex items-center justify-center gap-8">
            <div className={`flex items-center gap-3 ${bookingStep === "datetime" ? "text-blue-600" : "text-green-600"}`}>
              <div
                className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-medium ${
                  bookingStep === "datetime" ? "border-blue-600 bg-blue-50" : "border-green-600 bg-green-50"
                }`}
              >
                {bookingStep !== "datetime" ? <CheckCircle className="w-5 h-5 text-green-600" /> : "1"}
              </div>
              <span className="font-medium">Fecha y Hora</span>
            </div>
            <div className={`w-24 h-0.5 ${bookingStep === "details" ? "bg-green-600" : "bg-gray-200"}`} />
            <div className={`flex items-center gap-3 ${bookingStep === "details" ? "text-blue-600" : "text-gray-400"}`}>
              <div
                className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-medium ${
                  bookingStep === "details" ? "border-blue-600 bg-blue-50" : "border-gray-300"
                }`}
              >
                2
              </div>
              <span className="font-medium">Detalles y Confirmación</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* ── Main panel ────────────────────────────────────────────────── */}
          <div className="lg:col-span-2 space-y-6">
            {bookingStep === "datetime" && (
              <div className="space-y-6">
                {/* Calendar + time slots */}
                <Card className="shadow-sm">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <CalendarIcon className="w-5 h-5 text-blue-600" />
                      Fecha y Hora
                    </CardTitle>
                    <CardDescription>Elige cuándo necesitas el servicio</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      {/* Calendar grid */}
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <Button variant="ghost" size="icon" onClick={prevMonth}>
                            <ChevronLeft className="h-4 w-4" />
                          </Button>
                          <span className="text-sm font-medium capitalize">{monthName}</span>
                          <Button variant="ghost" size="icon" onClick={nextMonth}>
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                        {loadingAvailability ? (
                          <p className="text-center text-xs text-gray-400 py-6">Cargando disponibilidad…</p>
                        ) : availError ? (
                          <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription className="text-xs">{availError}</AlertDescription>
                          </Alert>
                        ) : (
                          <>
                            <div className="grid grid-cols-7 mb-1">
                              {["Lu", "Ma", "Mi", "Ju", "Vi", "Sa", "Do"].map((d) => (
                                <div key={d} className="text-center text-xs text-gray-400 font-medium py-1">
                                  {d}
                                </div>
                              ))}
                            </div>
                            <div className="grid grid-cols-7 gap-0.5">
                              {calDays.map((d, i) => {
                                const ds = formatDate(d)
                                const inMonth = isCurrentMonth(d)
                                const past = isPast(d)
                                const avail = inMonth && !past && hasAvailableSlots(d)
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
                            <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                              <div className="flex items-center gap-1">
                                <span className="inline-block w-3 h-3 rounded bg-green-100 border border-green-300" />
                                Disponible
                              </div>
                            </div>
                          </>
                        )}
                      </div>

                      {/* Time slots */}
                      <div>
                        <h4 className="font-medium mb-4 text-sm">
                          {selectedDate
                            ? `Horarios para ${new Date(selectedDate + "T00:00:00").toLocaleDateString("es-CL", {
                                weekday: "long",
                                day: "numeric",
                                month: "long",
                              })}`
                            : "Selecciona una fecha para ver horarios disponibles"}
                        </h4>
                        {!selectedDate ? (
                          <div className="text-center py-8 text-gray-500">
                            <CalendarIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                            <p className="text-sm">Selecciona una fecha en el calendario</p>
                          </div>
                        ) : selectedSlots.length === 0 ? (
                          <div className="text-center py-8 text-gray-500">
                            <Clock className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                            <p className="text-sm">No hay horarios disponibles para esta fecha</p>
                            <p className="text-sm">El profesional no trabaja este día</p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 gap-3 max-h-80 overflow-y-auto">
                            {selectedSlots.map((slot, i) => {
                              const isAvailable = slot.available !== false
                              const isSelected = selectedSlot?.start === slot.start
                              return (
                                <button
                                  key={i}
                                  onClick={() => isAvailable && setSelectedSlot(isSelected ? null : slot)}
                                  disabled={!isAvailable}
                                  className={[
                                    "p-3 rounded-lg border-2 text-sm transition-all",
                                    isSelected
                                      ? "border-blue-600 bg-blue-50 text-blue-900"
                                      : isAvailable
                                      ? "border-gray-200 hover:border-blue-300 bg-white cursor-pointer"
                                      : "border-red-100 bg-red-50 text-red-400 cursor-not-allowed opacity-70",
                                  ].join(" ")}
                                >
                                  <div className="font-medium">{slot.start}</div>
                                  <div className="text-xs mt-1">
                                    {isAvailable ? slot.end : "Ocupado"}
                                  </div>
                                </button>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="mt-8 pt-6 border-t">
                      <Button
                        onClick={() => setBookingStep("details")}
                        disabled={!selectedDate || !selectedSlot || selectedSlot.available === false}
                        className="w-full"
                        size="lg"
                      >
                        Continuar con los Detalles
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Reviews */}
                {reviewsData && reviewsData.total_reviews > 0 && (
                  <Card className="shadow-sm">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <MessageSquare className="w-5 h-5 text-blue-600" />
                        Reseñas de Clientes
                      </CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        {renderStars(Math.round(reviewsData.average_rating ?? 0))}
                        <span className="font-bold">{reviewsData.average_rating?.toFixed(1)}</span>
                        <span className="text-sm text-gray-500">
                          ({reviewsData.total_reviews} reseña{reviewsData.total_reviews !== 1 ? "s" : ""})
                        </span>
                      </div>
                      <div className="flex gap-4 mt-2 text-xs text-gray-500">
                        {[
                          { label: "Calidad", val: reviewsData.breakdown.calidad },
                          { label: "Puntualidad", val: reviewsData.breakdown.puntualidad },
                          { label: "Comunicación", val: reviewsData.breakdown.comunicacion },
                        ].map(({ label, val }) => (
                          <div key={label} className="flex items-center gap-1">
                            <span>{label}:</span>
                            <span className="font-medium text-gray-700">{val.toFixed(1)}</span>
                          </div>
                        ))}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {(showAllReviews ? reviewsData.reviews : reviewsData.reviews.slice(0, 5)).map((review, i) => (
                        <div key={i} className="border-b last:border-0 pb-6 last:pb-0">
                          <div className="flex items-start gap-4">
                            <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                              <User className="h-6 w-6 text-gray-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-3 mb-2">
                                {renderStars(Math.round(review.rating))}
                                <span className="text-sm text-gray-500">{formatReviewDate(review.date)}</span>
                              </div>
                              {review.comment && <p className="text-sm text-gray-700">{review.comment}</p>}
                              <div className="flex gap-3 mt-2 text-xs text-gray-400">
                                <span>Calidad: {review.calidad}/5</span>
                                <span>Puntualidad: {review.puntualidad}/5</span>
                                <span>Comunicación: {review.comunicacion}/5</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                      {reviewsData.reviews.length > 5 && (
                        <div className="text-center pt-4 border-t">
                          <Button variant="outline" size="sm" onClick={() => setShowAllReviews((v) => !v)}>
                            {showAllReviews
                              ? "Ver menos"
                              : `Ver todas las reseñas (${reviewsData.reviews.length})`}
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* Details step */}
            {bookingStep === "details" && (
              <Card className="shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <MessageSquare className="w-5 h-5 text-blue-600" />
                    Detalles del Servicio
                  </CardTitle>
                  <CardDescription>Proporciona información adicional para el profesional</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <Label htmlFor="address">Dirección donde se realizará el servicio *</Label>
                    <Input
                      id="address"
                      placeholder="Ej: Av. Providencia 1234, Depto 505, Providencia"
                      value={serviceDetails.address}
                      onChange={(e) => setServiceDetails({ ...serviceDetails, address: e.target.value })}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Teléfono de contacto *</Label>
                    <Input
                      id="phone"
                      placeholder="+56 9 8888 0000"
                      value={serviceDetails.phone}
                      onChange={(e) => setServiceDetails({ ...serviceDetails, phone: e.target.value })}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Descripción del trabajo a realizar *</Label>
                    <Textarea
                      id="description"
                      placeholder="Describe brevemente el trabajo que necesitas"
                      value={serviceDetails.description}
                      onChange={(e) => setServiceDetails({ ...serviceDetails, description: e.target.value })}
                      className="mt-2 resize-none"
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label htmlFor="special-requests">Solicitudes especiales (opcional)</Label>
                    <Input
                      id="special-requests"
                      placeholder="Ej: Preferencia de materiales, herramientas específicas, etc."
                      value={serviceDetails.specialRequests}
                      onChange={(e) => setServiceDetails({ ...serviceDetails, specialRequests: e.target.value })}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label htmlFor="payment-method">Método de pago preferido *</Label>
                    <Select
                      value={serviceDetails.preferredPaymentMethod}
                      onValueChange={(value) =>
                        setServiceDetails({ ...serviceDetails, preferredPaymentMethod: value })
                      }
                    >
                      <SelectTrigger className="mt-2">
                        <SelectValue placeholder="Selecciona método de pago" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="efectivo">Efectivo</SelectItem>
                        <SelectItem value="transferencia">Transferencia bancaria</SelectItem>
                        <SelectItem value="por_acordar">Por acordar con el profesional</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-gray-500 mt-1">
                      El pago se realizará directamente con el profesional al momento del servicio
                    </p>
                  </div>
                  <Alert className="bg-blue-50 border-blue-200">
                    <AlertCircle className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-sm text-blue-800">
                      <strong>Importante:</strong> El pago se realizará de forma presencial cuando el profesional llegue
                      a tu domicilio. Coordina el método de pago directamente con él.
                    </AlertDescription>
                  </Alert>
                  {bookingError && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{bookingError}</AlertDescription>
                    </Alert>
                  )}
                  <div className="flex gap-3 pt-6 border-t">
                    <Button variant="outline" onClick={() => setBookingStep("datetime")} className="flex-1">
                      Volver
                    </Button>
                    <Button
                      onClick={handleBook}
                      disabled={!serviceDetails.address || !serviceDetails.description || submitting}
                      className="flex-1"
                    >
                      {submitting ? "Confirmando…" : "Confirmar Reserva"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* ── Side panel ────────────────────────────────────────────────── */}
          <div className="space-y-6">
            {/* Professional info */}
            <Card className="shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">Información del Profesional</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <Avatar className="h-20 w-20 mx-auto mb-3">
                    {avatarUrl && <AvatarImage src={avatarUrl} />}
                    <AvatarFallback className="text-lg">
                      {profesionalName.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <h3 className="font-semibold">{profesionalName}</h3>
                  <p className="text-sm text-gray-600">{categoria}</p>
                  {reviewsData && reviewsData.average_rating !== null ? (
                    <div className="flex items-center justify-center gap-1 mt-2">
                      {renderStars(Math.round(reviewsData.average_rating))}
                      <span className="text-sm text-gray-600 ml-1">({reviewsData.total_reviews})</span>
                    </div>
                  ) : rating !== null && rating > 0 ? (
                    <div className="flex items-center justify-center gap-1 mt-2">
                      {renderStars(Math.round(Number(rating)))}
                      <span className="text-sm text-gray-600 ml-1">({Number(rating).toFixed(1)})</span>
                    </div>
                  ) : null}
                </div>
                <Separator />
                <div className="space-y-3 text-sm">
                  {location && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span>{location}</span>
                    </div>
                  )}
                  {verified && (
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>Verificado</span>
                    </div>
                  )}
                </div>
                {descriptionText && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="font-medium mb-2">Descripción</h4>
                      <p className="text-sm text-gray-600">{descriptionText}</p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Pricing */}
            <Card className="shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">Información de Precios</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">${precio?.toLocaleString("es-CL")}</div>
                  <div className="text-sm text-gray-600">Precio fijo del servicio</div>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="text-xs text-blue-700 text-center">
                    <strong>Duración estimada:</strong>
                    <br />
                    {durationType === "fixed"
                      ? formatDuration(fixedDuration)
                      : `${formatDuration(minDuration)} - ${formatDuration(maxDuration)}`}
                  </div>
                </div>
                <div className="text-xs text-gray-500 text-center">
                  El precio no varía según el tiempo exacto del trabajo
                </div>
              </CardContent>
            </Card>

          </div>
        </div>
      </div>
    </div>
  )
}

