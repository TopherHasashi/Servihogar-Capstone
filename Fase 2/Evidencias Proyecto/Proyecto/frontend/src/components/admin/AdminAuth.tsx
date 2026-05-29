import { useState } from "react"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Label } from "../ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"
import { Alert, AlertDescription } from "../ui/alert"
import { Shield, Eye, EyeOff, ArrowLeft } from "lucide-react"
import { apiPost, clearTokens, saveTokens } from "../../lib/api"
import { useAuth } from "../../lib/auth"
import { useNavigate } from "react-router-dom"

interface AdminAuthProps {
  onLogin: (user: any) => void
  onBack: () => void
}

export default function AdminAuth({ onLogin, onBack }: AdminAuthProps) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { refreshUser } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      const tokens = await apiPost('/api/auth/login/', { username: email, password })
      const access = tokens?.access || tokens?.access_token
      const refresh = tokens?.refresh || tokens?.refresh_token
      if (!access || !refresh) {
        throw new Error('No se recibieron tokens del servidor')
      }
      saveTokens({ access, refresh })
      const user = await refreshUser()
      if (!user) {
        clearTokens()
        throw new Error('No se pudo cargar el perfil del usuario')
      }
      if (user.effective_role !== 'administrador') {
        clearTokens()
        throw new Error('Tu usuario no tiene permisos de administrador')
      }
      onLogin(user)
      navigate('/admin', { replace: true })
    } catch (err: any) {
      const message = err?.message || 'Credenciales incorrectas. Verifica tu email y contraseña.'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={onBack}
          className="mb-6 text-white hover:text-slate-300 hover:bg-slate-800"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver al Inicio
        </Button>

        <Card className="shadow-2xl border-slate-700 bg-slate-800">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-slate-700 rounded-full flex items-center justify-center">
              <Shield className="w-8 h-8 text-blue-400" />
            </div>
            <div>
              <CardTitle className="text-2xl text-white">Panel de Administración</CardTitle>
              <CardDescription className="text-slate-400">
                Acceso exclusivo para administradores de ServiHogar
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {error && (
              <Alert variant="destructive" className="bg-red-900/20 border-red-700">
                <AlertDescription className="text-red-300">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-300">Email Administrativo</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@servihogar.cl"
                  required
                  className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400 focus:border-blue-400"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-300">Contraseña</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••••••"
                    required
                    className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400 focus:border-blue-400 pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 text-slate-400 hover:text-white hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                disabled={isLoading}
              >
                {isLoading ? "Verificando..." : "Acceder al Panel"}
              </Button>
            </form>

            <div className="mt-6 p-4 bg-slate-700/50 rounded-lg border border-slate-600">
              <h4 className="text-sm font-medium text-slate-300 mb-2">🔑 Acceso Administrativo</h4>
              <p className="text-xs text-slate-400">
                Ingresa las credenciales del administrador registradas en la plataforma.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Security Notice */}
        <div className="mt-6 text-center">
          <p className="text-xs text-slate-400">
            🔒 Acceso seguro protegido por autenticación avanzada
          </p>
        </div>
      </div>
    </div>
  )
}