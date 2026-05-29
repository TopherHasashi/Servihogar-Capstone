import { Phone, Mail, MapPin, Facebook, Instagram } from "lucide-react"
import { useNavigate, useLocation } from "react-router-dom"

// Icono personalizado para X (anteriormente Twitter)
const XIcon = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    className={className}
    fill="currentColor"
    aria-hidden="true"
  >
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
)

export default function Footer() {
  const navigate = useNavigate()
  const location = useLocation()

  const handleContactClick = () => {
    if (location.pathname === '/') {
      const contactElement = document.getElementById('contacto')
      if (contactElement) {
        contactElement.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    } else {
      navigate('/contacto')
    }
  }

  return (
    <footer className="bg-gray-900 text-white">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {/* Company Info */}
          <div className="sm:col-span-2 lg:col-span-1">
            <h3 className="text-xl sm:text-2xl mb-3 sm:mb-4">ServiHogar</h3>
            <p className="text-gray-400 mb-4 leading-relaxed text-sm sm:text-base">
              Conectamos tu hogar con los mejores profesionales en servicios domésticos. 
              Calidad garantizada y servicio confiable.
            </p>
            <div className="flex space-x-4">
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="https://x.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
                <XIcon className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Services */}
          <div>
            <h4 className="text-base sm:text-lg mb-3 sm:mb-4">Servicios</h4>
            <ul className="space-y-2 text-gray-400 text-sm sm:text-base">
              <li><button onClick={() => navigate('/servicios')} className="hover:text-white transition-colors text-left">Gasfitería</button></li>
              <li><button onClick={() => navigate('/servicios')} className="hover:text-white transition-colors text-left">Limpieza del Hogar</button></li>
              <li><button onClick={() => navigate('/servicios')} className="hover:text-white transition-colors text-left">Jardinería</button></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-base sm:text-lg mb-3 sm:mb-4">Empresa</h4>
            <ul className="space-y-2 text-gray-400 text-sm sm:text-base">
              <li><button onClick={() => navigate('/como-funciona')} className="hover:text-white transition-colors text-left">Cómo Funciona</button></li>
              <li><button onClick={() => navigate('/resenas')} className="hover:text-white transition-colors text-left">Reseñas</button></li>
              <li><button onClick={() => navigate('/terminos')} className="hover:text-white transition-colors text-left">Términos y Condiciones</button></li>
              <li><button onClick={() => navigate('/privacidad')} className="hover:text-white transition-colors text-left">Política de Privacidad</button></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-base sm:text-lg mb-3 sm:mb-4">Contacto</h4>
            <div className="space-y-3 text-gray-400 text-sm sm:text-base">
              <div className="flex items-center space-x-3">
                <Phone className="w-4 h-4 flex-shrink-0" />
                <a href="tel:+56912345678" className="hover:text-white transition-colors">+56 9 1234 5678</a>
              </div>
              <div className="flex items-center space-x-3">
                <Mail className="w-4 h-4 flex-shrink-0" />
                <a href="mailto:contacto@servihogar.cl" className="hover:text-white transition-colors break-all">contacto@servihogar.cl</a>
              </div>
              <div className="flex items-center space-x-3">
                <MapPin className="w-4 h-4 flex-shrink-0" />
                <button onClick={handleContactClick} className="hover:text-white transition-colors text-left">Concepción, Chile</button>
              </div>
            </div>
            
            <div className="mt-4 sm:mt-6">
              <h5 className="text-white mb-2 text-sm sm:text-base">Horarios de Atención</h5>
              <div className="text-xs sm:text-sm text-gray-400">
                <p>Lun - Vie: 9:00 AM - 18:00 PM</p>
                <p>Sáb: 9:00 AM - 14:00 PM</p>
                <p className="text-gray-500 mt-1">Domingo cerrado</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 mt-8 sm:mt-12 pt-6 sm:pt-8">
          <div className="flex justify-center">
            <div className="text-gray-400 text-xs sm:text-sm text-center">
              © 2025 ServiHogar. Todos los derechos reservados.
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}