import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider, Outlet, useNavigate } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import Header from './components/Header'
import Footer from './components/Footer'
import ServiciosPage from './pages/Servicios'
import ComoFuncionaPage from './pages/ComoFunciona'
import ResenasPage from './pages/Resenas'
import ContactoPage from './pages/Contacto'
import TerminosPage from './pages/Terminos'
import PrivacidadPage from './pages/Privacidad'
import NotFoundPage from './pages/NotFound'
import LoginPage from './pages/Login'
import RegisterPage from './pages/Register'
import PasswordResetConfirmPage from './pages/PasswordResetConfirm'
import ProfesionalPage from './pages/Profesional.tsx'
import VerificadorPage from './pages/Verificador.tsx'
import ClientePage from './pages/Cliente'
import AdminPage from './pages/Admin'
import { AuthProvider } from './lib/auth'
import { Toaster } from 'sonner'

function Layout() {
  const navigate = useNavigate()
  
  const handleContactClick = () => {
    // Si estamos en la página principal, hacer scroll al contacto
    if (window.location.pathname === '/') {
      const contactElement = document.getElementById('contacto')
      if (contactElement) {
        contactElement.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    } else {
      // Si estamos en otra página, navegar a la página de contacto
      navigate('/contacto')
    }
  }
  
  return (
    <div className="min-h-screen flex flex-col">
      <Header
        onAllServicesClick={() => navigate('/servicios')}
        onHowItWorksClick={() => navigate('/como-funciona')}
        onReviewsClick={() => navigate('/resenas')}
        onContactClick={handleContactClick}
        onUserClick={() => navigate('/login')}
        onLogoClick={() => navigate('/')}
      />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}

// Layout para páginas autenticadas (sin Header público ni Footer)
function AuthenticatedLayout() {
  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  )
}

// Layout para páginas de autenticación (login/register) sin Header ni Footer
function AuthLayout() {
  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  )
}

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <App /> },
      { path: 'servicios', element: <ServiciosPage /> },
      { path: 'como-funciona', element: <ComoFuncionaPage /> },
      { path: 'resenas', element: <ResenasPage /> },
      { path: 'contacto', element: <ContactoPage /> },
      { path: 'terminos', element: <TerminosPage /> },
      { path: 'privacidad', element: <PrivacidadPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
  {
    path: '/',
    element: <AuthLayout />,
    children: [
      { path: 'login', element: <LoginPage /> },
      { path: 'register', element: <RegisterPage /> },
      { path: 'reset-password', element: <PasswordResetConfirmPage /> },
    ],
  },
  {
    path: '/',
    element: <AuthenticatedLayout />,
    children: [
      { path: 'profesional', element: <ProfesionalPage /> },
      { path: 'verificador', element: <VerificadorPage /> },
      { path: 'cliente', element: <ClientePage /> },
      { path: 'admin', element: <AdminPage /> },
    ],
  },
])

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <RouterProvider router={router} />
      <Toaster richColors closeButton position="top-center" />
    </AuthProvider>
  </StrictMode>,
)
