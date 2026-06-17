import { useEffect, useRef, useState, useCallback } from "react"
import { Bell, CheckCheck, X } from "lucide-react"
import { apiGetAuth, apiPost } from "../../lib/api"

// ─── Types ────────────────────────────────────────────────────────────────────

interface Notification {
  id: number
  tipo: NotificationType
  titulo: string
  mensaje: string
  leida: boolean
  extra: Record<string, any>
  creado_en: string
}

type NotificationType =
  | "verification_approved"
  | "verification_rejected"
  | "booking_received"
  | "booking_confirmed"
  | "booking_cancelled"
  | "booking_completed"
  | "review_received"

// ─── Helpers ──────────────────────────────────────────────────────────────────

const TIPO_CONFIG: Record<NotificationType, { icon: string; color: string; bg: string }> = {
  verification_approved: { icon: "✅", color: "text-green-700", bg: "bg-green-50" },
  verification_rejected: { icon: "❌", color: "text-red-700", bg: "bg-red-50" },
  booking_received:      { icon: "📋", color: "text-blue-700", bg: "bg-blue-50" },
  booking_confirmed:     { icon: "✔️", color: "text-indigo-700", bg: "bg-indigo-50" },
  booking_cancelled:     { icon: "🚫", color: "text-orange-700", bg: "bg-orange-50" },
  booking_completed:     { icon: "🎉", color: "text-purple-700", bg: "bg-purple-50" },
  review_received:       { icon: "⭐", color: "text-yellow-700", bg: "bg-yellow-50" },
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "Ahora"
  if (mins < 60) return `Hace ${mins} min`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `Hace ${hrs} h`
  const days = Math.floor(hrs / 24)
  if (days === 1) return "Ayer"
  if (days < 7) return `Hace ${days} días`
  return new Date(iso).toLocaleDateString("es-CL", { day: "numeric", month: "short" })
}

// ─── Component ────────────────────────────────────────────────────────────────

interface NotificationBellProps {
  /** Intervalo en milisegundos para hacer polling. Default: 30 000 ms */
  pollInterval?: number
}

export default function NotificationBell({ pollInterval = 30000 }: NotificationBellProps) {
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchNotifications = useCallback(async () => {
    try {
      const data = await apiGetAuth("/api/notifications/?limit=30")
      setNotifications(data.notifications ?? [])
      setUnreadCount(data.unread_count ?? 0)
    } catch {
      // Silently ignore – user may not be authenticated yet
    }
  }, [])

  // Initial load + polling
  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, pollInterval)
    return () => clearInterval(interval)
  }, [fetchNotifications, pollInterval])

  // Close on outside click
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [open])

  // ── Actions ────────────────────────────────────────────────────────────────
  const markRead = async (id: number) => {
    try {
      await apiPost(`/api/notifications/${id}/read/`, {}, { auth: true })
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, leida: true } : n))
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch {
      /* ignore */
    }
  }

  const markAllRead = async () => {
    setLoading(true)
    try {
      await apiPost("/api/notifications/read-all/", {}, { auth: true })
      setNotifications(prev => prev.map(n => ({ ...n, leida: true })))
      setUnreadCount(0)
    } catch {
      /* ignore */
    } finally {
      setLoading(false)
    }
  }

  const handleBellClick = () => {
    setOpen(prev => !prev)
    if (!open) {
      // Refresh when opening
      fetchNotifications()
    }
  }

  const handleNotificationClick = (n: Notification) => {
    if (!n.leida) markRead(n.id)
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell button */}
      <button
        onClick={handleBellClick}
        aria-label="Notificaciones"
        className="relative p-2 rounded-full text-gray-600 hover:text-primary hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/40"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold leading-none text-white bg-red-500 rounded-full">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 mt-2 w-[360px] max-w-[calc(100vw-1rem)] bg-white border border-gray-200 rounded-xl shadow-xl z-50 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <h3 className="font-semibold text-sm text-gray-800">Notificaciones</h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  disabled={loading}
                  className="flex items-center gap-1 text-xs text-primary hover:underline disabled:opacity-50"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  Marcar todas
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Cerrar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="overflow-y-auto max-h-[420px] divide-y divide-gray-50">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-gray-400 text-sm gap-2">
                <Bell className="w-8 h-8 opacity-30" />
                <span>Sin notificaciones</span>
              </div>
            ) : (
              notifications.map(n => {
                const cfg = TIPO_CONFIG[n.tipo] ?? { icon: "🔔", color: "text-gray-700", bg: "bg-gray-50" }
                return (
                  <button
                    key={n.id}
                    onClick={() => handleNotificationClick(n)}
                    className={`w-full text-left px-4 py-3 flex gap-3 items-start transition-colors hover:bg-gray-50 ${
                      !n.leida ? "bg-blue-50/60" : ""
                    }`}
                  >
                    {/* Icon */}
                    <span
                      className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-base ${cfg.bg}`}
                    >
                      {cfg.icon}
                    </span>

                    {/* Text */}
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium leading-snug ${cfg.color}`}>
                        {n.titulo}
                      </p>
                      <p className="text-xs text-gray-600 mt-0.5 leading-snug line-clamp-2">
                        {n.mensaje}
                      </p>
                      <p className="text-[10px] text-gray-400 mt-1">{timeAgo(n.creado_en)}</p>
                    </div>

                    {/* Unread dot */}
                    {!n.leida && (
                      <span className="flex-shrink-0 mt-1.5 w-2 h-2 bg-blue-500 rounded-full" />
                    )}
                  </button>
                )
              })
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-4 py-2 border-t border-gray-100 text-center">
              <span className="text-xs text-gray-400">
                {unreadCount > 0
                  ? `${unreadCount} notificación${unreadCount > 1 ? "es" : ""} sin leer`
                  : "Todo al día ✓"}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
