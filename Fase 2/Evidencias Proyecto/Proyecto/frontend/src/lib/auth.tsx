import React from 'react'
import { apiGetAuth, clearTokens } from './api'

export type Profile = {
  rut?: string
  gender?: string
  birth_date?: string
  phone?: string
  region?: string
  district?: string
  address?: string
  role?: 'cliente' | 'profesional' | string
}

export type User = {
  id: number
  username: string
  email: string
  first_name: string
  last_name: string
  profile?: Profile
  is_staff?: boolean
  is_superuser?: boolean
  effective_role?: 'cliente' | 'profesional' | 'verificador' | 'administrador' | string
}

type AuthContextType = {
  user: User | null
  loading: boolean
  logout: () => void
  refreshUser: () => Promise<User | null>
}

const AuthContext = React.createContext<AuthContextType>({ user: null, loading: true, logout: () => {}, refreshUser: async () => null })

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<User | null>(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    let cancelled = false
    refreshUser()
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function logout() {
    clearTokens()
    setUser(null)
  }

  async function refreshUser(): Promise<User | null> {
    try {
      const u = await apiGetAuth('/api/auth/me/')
      setUser(u)
      return u
    } catch {
      setUser(null)
      return null
    }
  }

  return <AuthContext.Provider value={{ user, loading, logout, refreshUser }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return React.useContext(AuthContext)
}
