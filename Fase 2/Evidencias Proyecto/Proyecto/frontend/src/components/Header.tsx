import { Button } from "./ui/button"
import { Menu } from "lucide-react"
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from "./ui/sheet"

interface HeaderProps {
  onUserClick?: () => void
  onAllServicesClick?: () => void
  onReviewsClick?: () => void
  onHowItWorksClick?: () => void
  onContactClick?: () => void
  onLogoClick?: () => void
}

export default function Header({ onUserClick, onAllServicesClick, onReviewsClick, onHowItWorksClick, onContactClick, onLogoClick }: HeaderProps) {
  return (
    <header className="bg-white shadow-sm border-b">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14 sm:h-16">
          {/* Logo */}
          <div className="flex items-center">
            <div className="flex-shrink-0">
              {onLogoClick ? (
                <button onClick={onLogoClick} className="text-left">
                  <h1 className="text-xl sm:text-2xl text-primary">ServiHogar</h1>
                </button>
              ) : (
                <h1 className="text-xl sm:text-2xl text-primary">ServiHogar</h1>
              )}
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-6 lg:space-x-8">
            <button onClick={onAllServicesClick} className="text-gray-900 hover:text-primary transition-colors">
              Servicios
            </button>
            <button onClick={onHowItWorksClick} className="text-gray-900 hover:text-primary transition-colors">
              Cómo Funciona
            </button>
            <button onClick={onReviewsClick} className="text-gray-900 hover:text-primary transition-colors">
              Reseñas
            </button>
            {onContactClick ? (
              <button onClick={onContactClick} className="text-gray-900 hover:text-primary transition-colors">Contacto</button>
            ) : (
              <a href="#contacto" className="text-gray-900 hover:text-primary transition-colors">Contacto</a>
            )}
          </nav>

          {/* Contact Button */}
          <div className="hidden md:flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
        
            </div>
            <Button onClick={onUserClick} size="sm" className="lg:px-6">
              Iniciar Sesión
            </Button>
          </div>

          {/* Mobile menu */}
          <div className="md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="w-10 h-10">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent className="w-[300px] sm:w-[350px]">
                <SheetTitle className="sr-only">Menú de navegación</SheetTitle>
                <SheetDescription className="sr-only">
                  Navegación principal del sitio ServiHogar
                </SheetDescription>
                <div className="flex flex-col space-y-6 mt-8">
                  <button onClick={onAllServicesClick} className="text-left text-lg py-2 hover:text-primary transition-colors">
                    Servicios
                  </button>
                  <button onClick={onHowItWorksClick} className="text-left text-lg py-2 hover:text-primary transition-colors">
                    Cómo Funciona
                  </button>
                  <button onClick={onReviewsClick} className="text-left text-lg py-2 hover:text-primary transition-colors">
                    Reseñas
                  </button>
                  {onContactClick ? (
                    <button onClick={onContactClick} className="text-left text-lg py-2 hover:text-primary transition-colors">Contacto</button>
                  ) : (
                    <a href="#contacto" className="text-lg py-2 hover:text-primary transition-colors">Contacto</a>
                  )}
                  <div className="pt-6 space-y-4 border-t border-gray-200">
                    <div className="flex items-center space-x-3 text-sm text-gray-600">
                      
                    </div>
                    <Button className="w-full" size="lg" onClick={onUserClick}>
                      Iniciar Sesión
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  )
}