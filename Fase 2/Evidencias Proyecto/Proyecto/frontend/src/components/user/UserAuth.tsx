import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Label } from "../ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { Checkbox } from "../ui/checkbox"
import { Separator } from "../ui/separator"
import { Alert, AlertDescription, AlertTitle } from "../ui/alert"
import { 
  User, 
  
  Mail, 
  Lock, 
  Phone, 
  MapPin, 
  Home,
  CheckCircle,
  Calendar,
  Star,
  Shield
} from "lucide-react"

interface UserAuthProps {
  onLogin: (user: any) => void
  onAdminLogin?: () => void
  onVerifierLogin?: () => void
  initialTab?: 'login' | 'register'
}

import { apiGet, apiPost, saveTokens } from "../../lib/api"
import { useNavigate, useSearchParams } from "react-router-dom"
import { useAuth } from "../../lib/auth"
import { toast } from "sonner"

export default function UserAuth({ onLogin, initialTab }: UserAuthProps) {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [activeTab, setActiveTab] = useState<'login' | 'register'>(initialTab ?? 'login')
  const [loginForm, setLoginForm] = useState({
    email: "",
    password: ""
  })
  const [loginSubmitting, setLoginSubmitting] = useState(false)
  const [loginError, setLoginError] = useState<string>("")
  
  const [isForgotPassword, setIsForgotPassword] = useState(searchParams.get('forgot') === 'true')
  const [forgotEmail, setForgotEmail] = useState("")
  const [forgotMessage, setForgotMessage] = useState("")
  const [forgotError, setForgotError] = useState("")
  const [forgotLoading, setForgotLoading] = useState(false)

  const [registerForm, setRegisterForm] = useState({
    firstName: "",
    lastName: "",
    rut: "",
    gender: "",
    birthDate: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    region: "",
    district: "",
    address: "",
    acceptTerms: false
  })
  const [registerError, setRegisterError] = useState<string>("")
  const [registerSubmitting, setRegisterSubmitting] = useState(false)
  const { refreshUser } = useAuth()
  
  // Fecha máxima permitida para nacimiento (18+): hoy - 18 años, formato YYYY-MM-DD
  const adultMaxDate = useMemo(() => {
    const today = new Date()
    const d = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate())
    const yyyy = d.getFullYear()
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const dd = String(d.getDate()).padStart(2, '0')
    return `${yyyy}-${mm}-${dd}`
  }, [])

  // Fecha mínima permitida para nacimiento (máx. 105 años): hoy - 105 años
  const oldestMinDate = useMemo(() => {
    const today = new Date()
    const d = new Date(today.getFullYear() - 105, today.getMonth(), today.getDate())
    const yyyy = d.getFullYear()
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const dd = String(d.getDate()).padStart(2, '0')
    return `${yyyy}-${mm}-${dd}`
  }, [])

  // Sincronizar pestaña activa con initialTab cuando cambie (por ejemplo, en /register)
  useEffect(() => {
    if (initialTab && (initialTab === 'login' || initialTab === 'register')) {
      setActiveTab(initialTab)
    }
  }, [initialTab])

  // Carga dinámica de regiones/comunas
  const [regions, setRegions] = useState<{ id: string; nombre: string; codigo: string }[]>([])
  const [communes, setCommunes] = useState<{ id: string; nombre: string; codigo: string }[]>([])
  const [selectedRegionId, setSelectedRegionId] = useState<string>("")
  const [selectedComunaId, setSelectedComunaId] = useState<string>("")
  const [selectedRegionName, setSelectedRegionName] = useState<string>("")
  const [selectedComunaName, setSelectedComunaName] = useState<string>("")
  const [communesSource, setCommunesSource] = useState<'api' | 'static'>('api')

  const normalizeText = (value: string) =>
    value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()

  const normalizeNoSpaces = (value: string) => normalizeText(value).replace(/\s+/g, "")

  const BIOBIO_COMUNAS = [
    "Concepción",
    "Coronel",
    "Chiguayante",
    "Florida",
    "Hualqui",
    "Lota",
    "Penco",
    "San Pedro de la Paz",
    "Santa Juana",
    "Talcahuano",
    "Tomé",
    "Hualpén",
    "Lebu",
    "Arauco",
    "Cañete",
    "Contulmo",
    "Curanilahue",
    "Los Álamos",
    "Tirúa",
    "Los Ángeles",
    "Antuco",
    "Cabrero",
    "Laja",
    "Mulchén",
    "Nacimiento",
    "Negrete",
    "Quilaco",
    "Quilleco",
    "San Rosendo",
    "Santa Bárbara",
    "Tucapel",
    "Yumbel",
    "Alto Biobío",
  ]

  const isBiobioRegion = (region: { nombre: string; codigo?: string }) => {
    const name = normalizeNoSpaces(region.nombre || "")
    const code = String(region.codigo || "").toUpperCase()
    return name.includes("biobio") || code === "VIII" || code === "08" || code === "8"
  }

  const fixMojibake = (value: string) => {
    if (!value) return value
    return value
      .replace(/Ã¡/g, "á")
      .replace(/Ã©/g, "é")
      .replace(/Ã­/g, "í")
      .replace(/Ã³/g, "ó")
      .replace(/Ãº/g, "ú")
      .replace(/Ã±/g, "ñ")
      .replace(/Ã/g, "Á")
      .replace(/Ã‰/g, "É")
      .replace(/Ã/g, "Í")
      .replace(/Ã“/g, "Ó")
      .replace(/Ãš/g, "Ú")
      .replace(/Ã‘/g, "Ñ")
      .replace(/Ã¼/g, "ü")
      .replace(/Ãœ/g, "Ü")
  }

  const formatRegionName = (name: string) => {
    const fixed = fixMojibake(name)
    if (!fixed) return fixed
    return fixed
      .replace(/BioB\?\?o/gi, "Biobio")
      .replace(/BiobÃ­o/gi, "Biobio")
      .replace(/BioBÃ­o/gi, "Biobio")
      .replace(/BioBÃ³o/gi, "Biobio")
  }

  const formatComunaName = (name: string) => {
    const fixed = fixMojibake(name)
    if (!fixed) return fixed
    if (!/[\?\uFFFD]/.test(fixed)) return fixed
    const normalizedInput = normalizeNoSpaces(fixed.replace(/[\?\uFFFD]/g, ""))
    const match = BIOBIO_COMUNAS.find(
      (c) => normalizeNoSpaces(c) === normalizedInput
    )
    return match || fixed
  }

  const availableRegions = useMemo(
    () => regions.filter((r) => isBiobioRegion(r)),
    [regions]
  )

  const getRegionNameById = (regionId: string) => {
    const match = regions.find((r) => r.id === regionId)
    return match?.nombre || ''
  }

  useEffect(() => {
    ;(async () => {
      try {
        const r = await apiGet('/api/geo/regiones/')
        if (Array.isArray(r) && r.length > 0) {
          setRegions(r)
          return
        }
        throw new Error('Empty regions')
      } catch (e) {
        console.warn('No se pudieron cargar regiones', e)
        setRegions([
          { id: 'biobio', nombre: 'Región del Biobío', codigo: 'VIII' } as any,
        ])
        setSelectedRegionId('biobio')
        setSelectedRegionName('Región del Biobío')
        setCommunesSource('static')
        setCommunes(BIOBIO_COMUNAS.map((nombre) => ({
          id: normalizeNoSpaces(nombre),
          nombre,
          codigo: '',
        })))
      }
    })()
  }, [])

  useEffect(() => {
    if (selectedRegionId || regions.length === 0) return
    const pick = regions.find((r) => isBiobioRegion(r))
    if (pick) {
      setSelectedRegionId(pick.id)
      setSelectedRegionName(pick.nombre)
      setSelectedComunaId("")
      setSelectedComunaName("")
    }
  }, [regions, selectedRegionId])

  useEffect(() => {
    ;(async () => {
      if (!selectedRegionId) {
        setCommunes([])
        setSelectedComunaId("")
        setSelectedComunaName("")
        return
      }
      const selectedRegion = regions.find((r: any) => r.id === selectedRegionId)
      if (selectedRegionId === 'biobio' && (!selectedRegion || (selectedRegion as any)._static)) {
        setCommunesSource('static')
        setCommunes(BIOBIO_COMUNAS.map((nombre) => ({
          id: normalizeNoSpaces(nombre),
          nombre,
          codigo: '',
        })))
        return
      }
      try {
        setCommunesSource('api')
        const c = await apiGet(`/api/geo/comunas/?region_id=${selectedRegionId}`)
        if (Array.isArray(c) && c.length > 0) {
          setCommunes(c)
          return
        }
        throw new Error('Empty communes')
      } catch (e) {
        console.warn('No se pudieron cargar comunas', e)
        if (selectedRegion && isBiobioRegion(selectedRegion)) {
          setCommunesSource('static')
          setCommunes(BIOBIO_COMUNAS.map((nombre) => ({
            id: normalizeNoSpaces(nombre),
            nombre,
            codigo: '',
          })))
        }
      }
    })()
  }, [selectedRegionId])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!loginForm.email || !loginForm.password) {
      toast.error('Por favor, completa todos los campos requeridos')
      return
    }
    try {
      setLoginSubmitting(true)
      setLoginError("")
      const tokens = await apiPost('/api/auth/login/', { username: loginForm.email, password: loginForm.password })
      saveTokens(tokens)
      // Navegar de inmediato para evitar quedarse en /login por condiciones de carrera
      navigate('/cliente', { replace: true })
      onLogin?.(tokens)
      // Refrescar usuario en segundo plano y ajustar ruta según rol si corresponde
      ;(async () => {
        try {
          const u = await refreshUser()
          toast.success(`¡Bienvenido${u?.first_name ? ", " + u.first_name : ""}!`)
          const role = u?.effective_role
          if (role === 'administrador') { navigate('/admin', { replace: true }); return }
          if (role === 'verificador') { navigate('/verificador', { replace: true }); return }
          if (role === 'profesional') { navigate('/profesional', { replace: true }); return }
          // Si ya estamos en /cliente, no hacer nada
        } catch { /* ignorar y dejar al usuario en /cliente */ }
      })()
    } catch (err: any) {
      const raw = err?.message || 'Credenciales inválidas'
      const friendly = /active account|credentials|401/i.test(String(raw))
        ? 'Credenciales inválidas: correo o contraseña incorrectos.'
        : String(raw)
      setLoginError(friendly)
      toast.error(friendly)
    } finally {
      setLoginSubmitting(false)
    }
  }

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setForgotLoading(true)
    setForgotError("")
    setForgotMessage("")
    try {
      const BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'
      const response = await fetch(`${BASE_URL}/api/auth/password-reset/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail })
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.message || "Ocurrió un error al solicitar la recuperación")
      }
      setForgotMessage(data.message)
    } catch (err: any) {
      setForgotError(err.message)
    } finally {
      setForgotLoading(false)
    }
  }

  // Utilidades: formato y validación de RUT y teléfono CL
  const formatRut = (value: string) => {
    // Limpia y aplica formato 12.345.678-9
    const clean = value.replace(/[^0-9kK]/g, '').toUpperCase()
    if (!clean) return ''
    const body = clean.slice(0, -1)
    const dv = clean.slice(-1)
    const reversed = body.split('').reverse().join('')
    const withDots = reversed.replace(/(\d{3})(?=\d)/g, '$1.')
    const bodyFormatted = withDots.split('').reverse().join('')
    return `${bodyFormatted}-${dv}`
  }

  const validateRut = (rut: string) => {
    // Calcula dígito verificador
    const clean = rut.replace(/\./g, '').replace(/-/g, '').toUpperCase()
    if (clean.length < 2) return false
    const body = clean.slice(0, -1)
    let dv = clean.slice(-1)
    let sum = 0
    let mul = 2
    for (let i = body.length - 1; i >= 0; i--) {
      sum += parseInt(body[i], 10) * mul
      mul = mul === 7 ? 2 : mul + 1
    }
    const res = 11 - (sum % 11)
    let dvCalc = ''
    if (res === 11) dvCalc = '0'
    else if (res === 10) dvCalc = 'K'
    else dvCalc = String(res)
    return dv === dvCalc
  }

  const formatPhoneCl = (value: string) => {
    // Formato sugerido: +56 9 1234 5678
    let v = value.replace(/[^\d+]/g, '')
    if (!v.startsWith('+')) {
      v = '+56' + v.replace(/^0+/, '')
    }
    // Insertar espacios: +56 9 1234 5678
    const digits = v.replace(/\D/g, '')
    if (digits.startsWith('56')) {
      const rest = digits.slice(2)
      if (rest.length <= 1) return `+56 ${rest}`.trim()
      const p1 = rest.slice(0, 1) // 9
      const p2 = rest.slice(1, 5) // 1234
      const p3 = rest.slice(5, 9) // 5678
      return `+56 ${p1}${p2 ? ' ' + p2 : ''}${p3 ? ' ' + p3 : ''}`.trim()
    }
    return v
  }

  const isRutValid = useMemo(() => registerForm.rut ? validateRut(registerForm.rut) : false, [registerForm.rut])
  const isPhoneValid = useMemo(() => {
    const digits = registerForm.phone.replace(/\D/g, '')
    // +56 9 + 8 dígitos => 11 o 12 dígitos con país
    return digits.length >= 11 && digits.startsWith('56')
  }, [registerForm.phone])

  // Debe ser mayor o igual a 18 años
  const isAdult = useMemo(() => {
    if (!registerForm.birthDate) return false
    return registerForm.birthDate <= adultMaxDate
  }, [registerForm.birthDate, adultMaxDate])

  // Mayor a 105 años no permitido
  const isTooOld = useMemo(() => {
    if (!registerForm.birthDate) return false
    return registerForm.birthDate < oldestMinDate
  }, [registerForm.birthDate, oldestMinDate])

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setRegisterError("")
    const comunaReady = communesSource === 'static'
      ? Boolean(selectedComunaName)
      : Boolean(selectedComunaId || selectedComunaName)
    if (!registerForm.firstName || !registerForm.lastName || !registerForm.rut ||
        !registerForm.gender || !registerForm.birthDate || !registerForm.email ||
        !registerForm.password || !comunaReady || !registerForm.address) {
      toast.error('Por favor, completa todos los campos requeridos')
      return
    }
    if (!isRutValid) {
      toast.error('El RUT ingresado no es válido')
      return
    }
    if (!isAdult) {
      toast.error('Debes ser mayor de 18 años para registrarte en ServiHogar')
      return
    }
    if (isTooOld) {
      toast.error('La edad máxima permitida es 105 años para registrarte en ServiHogar')
      return
    }
    if (registerForm.password !== registerForm.confirmPassword) {
      toast.error('Las contraseñas no coinciden')
      return
    }
    if (!registerForm.acceptTerms) {
      toast.error('Debes aceptar los términos y condiciones')
      return
    }
    try {
      setRegisterSubmitting(true)
      // Limpiar teléfono: remover espacios y caracteres no numéricos excepto '+'
      const cleanPhone = registerForm.phone.replace(/\s/g, '').replace(/[^\d+]/g, '')
      const payload: any = {
        first_name: registerForm.firstName,
        last_name: registerForm.lastName,
        email: registerForm.email,
        password: registerForm.password,
        phone: cleanPhone,
        rut: registerForm.rut,
        gender: registerForm.gender,
        birth_date: registerForm.birthDate,
        address: registerForm.address,
        role: 'cliente',
      }
      payload.region = selectedRegionName || getRegionNameById(selectedRegionId)
      payload.district = selectedComunaName
      if (selectedComunaId) {
        payload.comuna_id = selectedComunaId
      }
      // 1) Crear usuario
      const data = await apiPost('/api/auth/register/', payload)
      // 2) Guardar tokens y refrescar usuario (si falla, no bloquear el flujo)
      saveTokens({ access: data.access, refresh: data.refresh })
      let u = null as any
      try {
        u = await refreshUser()
      } catch (_err) {
        // Silenciar errores de /me si la creación fue exitosa (puede ser un tema temporal de CORS/token)
        console.warn('Registro exitoso, pero falló la actualización de sesión (/api/auth/me).')
      }
      toast.success('Cuenta creada con éxito')
      onLogin?.(data.user)
      const role = u?.effective_role
      if (role === 'administrador') { navigate('/admin'); return }
      if (role === 'verificador') { navigate('/verificador'); return }
      if (role === 'profesional') { navigate('/profesional'); return }
      navigate('/cliente')
    } catch (err: any) {
      // El wrapper ya entrega sólo el mensaje limpio
      let msg = err?.message || 'Error al crear la cuenta. Intenta nuevamente.'
      
      // Mejorar mensajes de error comunes
      if (msg.includes('RUT ya está registrado')) {
        msg = 'Este RUT ya está registrado. Si es tu cuenta, inicia sesión o recupera tu contraseña.'
      } else if (msg.includes('email ya está registrado')) {
        msg = 'Este correo ya está registrado. Si es tu cuenta, inicia sesión o recupera tu contraseña.'
      } else if (msg.includes('Formato de teléfono inválido')) {
        msg = 'El formato del teléfono no es válido. Debe ser +56912345678 o 912345678'
      } else if (msg.includes('comuna')) {
        msg = 'La región o comuna seleccionada no es válida. Por favor, selecciona nuevamente.'
      }
      
      setRegisterError(msg)
      toast.error(msg)
    } finally {
      setRegisterSubmitting(false)
    }
  }

  // Dev creation buttons removed per request: users will log in with seeded credentials.

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl mb-2">Portal de Usuarios</h1>
          <p className="text-gray-600">
            Únete a ServiHogar para solicitar servicios y también ofrecer tus habilidades
          </p>
        </div>

  <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'login' | 'register')} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="login">Iniciar Sesión</TabsTrigger>
            <TabsTrigger value="register">Registrarse</TabsTrigger>
          </TabsList>

          {/* Login Form */}
          <TabsContent value="login">
            <Card className="max-w-md mx-auto">
              {isForgotPassword ? (
                <>
                  <CardHeader className="text-center">
                    <CardTitle className="flex items-center justify-center gap-2">
                      <Lock className="w-5 h-5" />
                      Recuperar Contraseña
                    </CardTitle>
                    <CardDescription>
                      Ingresa tu correo para recibir un enlace de recuperación.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleForgotPassword} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="forgotEmail">Email</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                          <Input
                            id="forgotEmail" type="email" placeholder="tu@email.com" className="pl-10" required
                            value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} />
                        </div>
                      </div>
                      {forgotMessage && (
                        <Alert className="bg-green-50 text-green-800 border-green-200">
                          <AlertDescription>{forgotMessage}</AlertDescription>
                        </Alert>
                      )}
                      {forgotError && (
                        <Alert variant="destructive">
                          <AlertDescription>{forgotError}</AlertDescription>
                        </Alert>
                      )}
                      <Button type="submit" className="w-full" disabled={forgotLoading}>
                        {forgotLoading ? 'Enviando...' : 'Enviar enlace de recuperación'}
                      </Button>
                      <div className="mt-4 text-center">
                        <Button variant="link" className="text-sm" type="button" onClick={() => setIsForgotPassword(false)}>
                          Volver a Iniciar Sesión
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </>
              ) : (
                <>
                  <CardHeader className="text-center">
                    <CardTitle className="flex items-center justify-center gap-2">
                      <User className="w-5 h-5" />
                      Iniciar Sesión
                    </CardTitle>
                    <CardDescription>
                      Accede a tu cuenta de ServiHogar
                    </CardDescription>
                  </CardHeader>
              <CardContent>
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="tu@email.com"
                        className="pl-10"
                        value={loginForm.email}
                        onChange={(e) => { setLoginForm({...loginForm, email: e.target.value}); if (loginError) setLoginError("") }}
                        required
                        aria-invalid={!!loginError}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="password">Contraseña</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        id="password"
                        type="password"
                        placeholder="••••••••"
                        className="pl-10"
                        value={loginForm.password}
                        onChange={(e) => { setLoginForm({...loginForm, password: e.target.value}); if (loginError) setLoginError("") }}
                        required
                        aria-invalid={!!loginError}
                      />
                    </div>
                  </div>

                  {loginError && (
                    <Alert variant="destructive">
                      <AlertTitle>Datos inválidos</AlertTitle>
                      <AlertDescription>{loginError}</AlertDescription>
                    </Alert>
                  )}

                  <Button type="submit" className="w-full" disabled={loginSubmitting}>
                    {loginSubmitting ? 'Iniciando…' : 'Iniciar Sesión'}
                  </Button>
                </form>

                <div className="mt-4 text-center">
                    <Button variant="link" className="text-sm" type="button" onClick={() => setIsForgotPassword(true)}>
                      ¿Olvidaste tu contraseña?
                    </Button>
                  </div>
                
                {/* Dev creation buttons removed. Admin and Verifier credentials are pre-seeded in the backend. */}

                {/* Demo accounts info */}
                <div className="mt-6 space-y-3">
                  <div className="p-4 bg-slate-100 rounded-lg border border-slate-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Shield className="w-4 h-4 text-slate-600" />
                      <h4 className="text-sm font-medium text-slate-700">Acceso Administrativo:</h4>
                    </div>
                    <div className="text-xs text-slate-600 space-y-1">
                      <div><strong>Email:</strong> admin@servihogar.cl</div>
                      <div><strong>Contraseña:</strong> Admin2026!ServiHogar</div>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="w-4 h-4 text-amber-600" />
                      <h4 className="text-sm font-medium text-amber-700">Acceso Verificador:</h4>
                    </div>
                    <div className="text-xs text-amber-600 space-y-1">
                      <div><strong>Email:</strong> verificador@servihogar.cl</div>
                      <div><strong>Contraseña:</strong> Verifier2026!ServiHogar</div>
                    </div>
                  </div>
                </div>

                </CardContent>
                </>
              )}
            </Card>
          </TabsContent>

          {/* Register Form */}
          <TabsContent value="register">
            <Card className="max-w-2xl mx-auto">
              <CardHeader className="text-center">
                <CardTitle className="flex items-center justify-center gap-2">
                  <Home className="w-5 h-5" />
                  Registro de Usuario
                </CardTitle>
                <CardDescription>
                  Crea tu cuenta para solicitar servicios y también ofrecer tus habilidades
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleRegister} className="space-y-6">
                  {registerError ? (
                    <div className="p-3 rounded border border-red-300 bg-red-50 text-red-700 text-sm">
                      {registerError}
                    </div>
                  ) : null}
                  {/* Información Personal */}
                  <div>
                    <h3 className="text-lg mb-4 flex items-center gap-2">
                      <User className="w-5 h-5" />
                      Información Personal
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="firstName">Nombres</Label>
                        <Input
                          id="firstName"
                          placeholder="María José"
                          value={registerForm.firstName}
                          onChange={(e) => setRegisterForm({...registerForm, firstName: e.target.value})}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName">Apellidos</Label>
                        <Input
                          id="lastName"
                          placeholder="González Silva"
                          value={registerForm.lastName}
                          onChange={(e) => setRegisterForm({...registerForm, lastName: e.target.value})}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="rut">RUT *</Label>
                        <Input
                          id="rut"
                          placeholder="12.345.678-9"
                          value={registerForm.rut}
                          onChange={(e) => setRegisterForm({...registerForm, rut: formatRut(e.target.value)})}
                          required
                        />
                        {registerForm.rut && !isRutValid && (
                          <p className="text-xs text-red-600">RUT inválido</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="gender">Género *</Label>
                        <Select 
                          value={registerForm.gender} 
                          onValueChange={(value) => setRegisterForm({...registerForm, gender: value})}
                        >
                          <SelectTrigger className="bg-white">
                            <SelectValue placeholder="Selecciona tu género" />
                          </SelectTrigger>
                          <SelectContent className="bg-white border shadow-lg">
                            <SelectItem value="masculino" className="hover:bg-gray-100 focus:bg-gray-100">Masculino</SelectItem>
                            <SelectItem value="femenino" className="hover:bg-gray-100 focus:bg-gray-100">Femenino</SelectItem>
                            <SelectItem value="no_binario" className="hover:bg-gray-100 focus:bg-gray-100">No binario</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="birthDate">Fecha de Nacimiento *</Label>
                        <div className="relative">
                          <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                          <Input
                            id="birthDate"
                            type="date"
                            className="pl-10"
                            value={registerForm.birthDate}
                            onChange={(e) => setRegisterForm({...registerForm, birthDate: e.target.value})}
                            min={oldestMinDate}
                            max={adultMaxDate}
                            required
                          />
                          {registerForm.birthDate && isTooOld && (
                            <p className="text-xs text-red-600 mt-1">La edad máxima permitida es 105 años para registrarte en ServiHogar</p>
                          )}
                          {registerForm.birthDate && !isTooOld && !isAdult && (
                            <p className="text-xs text-red-600 mt-1">Debes ser mayor de 18 años para registrarte en ServiHogar</p>
                          )}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Teléfono</Label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                          <Input
                            id="phone"
                            placeholder="+56 9 1234 5678"
                            className="pl-10"
                            value={registerForm.phone}
                            onChange={(e) => setRegisterForm({...registerForm, phone: formatPhoneCl(e.target.value)})}
                            required
                          />
                          {registerForm.phone && !isPhoneValid && (
                            <p className="text-xs text-red-600 mt-1">Teléfono chileno inválido</p>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="registerEmail">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                          id="registerEmail"
                          type="email"
                          placeholder="maria.gonzalez@email.com"
                          className="pl-10"
                          value={registerForm.email}
                          onChange={(e) => setRegisterForm({...registerForm, email: e.target.value})}
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Información de Ubicación */}
                  <div>
                    <h3 className="text-lg mb-4 flex items-center gap-2">
                      <MapPin className="w-5 h-5" />
                      Ubicación
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Región</Label>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                          <Select 
                            value={selectedRegionId}
                            onValueChange={(value) => {
                              setSelectedRegionId(value)
                              setSelectedRegionName(getRegionNameById(value))
                              setSelectedComunaId("")
                              setSelectedComunaName("")
                            }}
                            disabled
                          >
                            <SelectTrigger className="pl-10 bg-white">
                              <SelectValue placeholder="Selecciona tu región" />
                            </SelectTrigger>
                            <SelectContent className="bg-white border shadow-lg max-h-60 overflow-y-auto">
                              {availableRegions.map(r => (
                                <SelectItem key={r.id} value={r.id} className="hover:bg-gray-100 focus:bg-gray-100">
                                  {formatRegionName(r.nombre)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Comuna</Label>
                        <Select 
                          value={selectedComunaId}
                          onValueChange={(value) => {
                            setSelectedComunaId(value)
                            const picked = communes.find((c) => c.id === value)
                            setSelectedComunaName(picked ? formatComunaName(picked.nombre) : "")
                          }}
                          disabled={!selectedRegionId}
                        >
                          <SelectTrigger className="bg-white">
                            <SelectValue placeholder={selectedRegionId ? "Selecciona tu comuna" : "Primero selecciona una región"} />
                          </SelectTrigger>
                          <SelectContent className="bg-white border shadow-lg max-h-60 overflow-y-auto">
                            {communes.map(c => (
                              <SelectItem key={c.id} value={c.id} className="hover:bg-gray-100 focus:bg-gray-100">
                                {formatComunaName(c.nombre)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="address">Dirección *</Label>
                      <div className="relative">
                        <Home className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                          id="address"
                          placeholder="Av. Providencia 1234, Piso 5"
                          className="pl-10"
                          value={registerForm.address}
                          onChange={(e) => setRegisterForm({...registerForm, address: e.target.value})}
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Contraseña */}
                  <div>
                    <h3 className="text-lg mb-4 flex items-center gap-2">
                      <Lock className="w-5 h-5" />
                      Seguridad
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="registerPassword">Contraseña</Label>
                        <Input
                          id="registerPassword"
                          type="password"
                          placeholder="••••••••"
                          value={registerForm.password}
                          onChange={(e) => setRegisterForm({...registerForm, password: e.target.value})}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
                        <Input
                          id="confirmPassword"
                          type="password"
                          placeholder="••••••••"
                          value={registerForm.confirmPassword}
                          onChange={(e) => setRegisterForm({...registerForm, confirmPassword: e.target.value})}
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* Términos y Condiciones */}
                  <div className="flex items-start space-x-2">
                    <Checkbox
                      id="terms"
                      checked={registerForm.acceptTerms}
                      onCheckedChange={(checked) => setRegisterForm({...registerForm, acceptTerms: !!checked})}
                      required
                    />
                    <Label htmlFor="terms" className="text-sm">
                      Acepto los{" "}
                      <Button variant="link" className="h-auto p-0 text-sm">
                        términos y condiciones
                      </Button>{" "}
                      y la{" "}
                      <Button variant="link" className="h-auto p-0 text-sm">
                        política de privacidad
                      </Button>
                    </Label>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={registerSubmitting || !registerForm.acceptTerms || !isRutValid || !isPhoneValid || !isAdult || isTooOld}
                  >
                    {registerSubmitting ? 'Creando cuenta…' : 'Crear Cuenta de Usuario'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Benefits Section */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="text-center">
            <CardContent className="p-6">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-lg mb-2">Solicita Servicios</h3>
              <p className="text-sm text-gray-600">
                Encuentra profesionales verificados para cualquier trabajo en tu hogar
              </p>
            </CardContent>
          </Card>
          
          <Card className="text-center">
            <CardContent className="p-6">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-lg mb-2">Ofrece tus Servicios</h3>
              <p className="text-sm text-gray-600">
                Crea un perfil profesional y genera ingresos con tus habilidades
              </p>
            </CardContent>
          </Card>
          
          <Card className="text-center">
            <CardContent className="p-6">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Star className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-lg mb-2">Una Sola Cuenta</h3>
              <p className="text-sm text-gray-600">
                Maneja todo desde un solo lugar: contrata y ofrece servicios
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}