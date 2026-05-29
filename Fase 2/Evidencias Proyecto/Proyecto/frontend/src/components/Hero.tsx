import { Button } from "./ui/button"
import { ImageWithFallback } from "./figma/ImageWithFallback"
import { CheckCircle, Clock, Shield } from "lucide-react"

interface HeroProps {
  onAllServicesClick?: () => void
  onUserClick?: () => void
}

export default function Hero({ onAllServicesClick, onUserClick }: HeroProps) {
  return (
    <section className="bg-gradient-to-r from-blue-50 to-indigo-50 py-8 sm:py-16 lg:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Text Content */}
          <div>
            <h1 className="text-3xl sm:text-4xl lg:text-6xl text-gray-900 mb-4 sm:mb-6 leading-tight">
              Servicios para el hogar{" "}
              <span className="text-primary">profesionales</span> y confiables
            </h1>
            <p className="text-lg sm:text-xl text-gray-600 mb-6 sm:mb-8">
              Conectamos tu hogar con los mejores profesionales en gasfitería, 
              limpieza y jardinería. Calidad garantizada y servicio rápido.
            </p>
            
            {/* Features */}
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 mb-6 sm:mb-8">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                <span className="text-gray-700 text-sm sm:text-base">Profesionales verificados</span>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="w-5 h-5 text-blue-500 flex-shrink-0" />
                <span className="text-gray-700 text-sm sm:text-base">Servicio 24/7</span>
              </div>
              <div className="flex items-center space-x-2">
                <Shield className="w-5 h-5 text-purple-500 flex-shrink-0" />
                <span className="text-gray-700 text-sm sm:text-base">Garantía total</span>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <Button size="lg" className="px-6 sm:px-8 w-full sm:w-auto" onClick={onUserClick}>
                Registrate Ahora
              </Button>
              <Button variant="outline" size="lg" className="px-6 sm:px-8 w-full sm:w-auto" onClick={onAllServicesClick}>
                Ver Todos los Servicios
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 sm:gap-6 mt-8 sm:mt-12 pt-6 sm:pt-8 border-t border-gray-200">
              <div className="text-center">
                <div className="text-xl sm:text-2xl text-primary mb-1">500+</div>
                <div className="text-xs sm:text-sm text-gray-600">Servicios realizados</div>
              </div>
              <div className="text-center">
                <div className="text-xl sm:text-2xl text-primary mb-1">4.9★</div>
                <div className="text-xs sm:text-sm text-gray-600">Calificación promedio</div>
              </div>
              <div className="text-center">
                <div className="text-xl sm:text-2xl text-primary mb-1">24h</div>
                <div className="text-xs sm:text-sm text-gray-600">Tiempo de respuesta</div>
              </div>
            </div>
          </div>

          {/* Image */}
          <div className="relative mt-8 lg:mt-0">
            <div className="relative">
              <ImageWithFallback
                src="https://images.unsplash.com/photo-1704940681667-54510c1fc4e3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxob21lJTIwc2VydmljZXMlMjBwcm9mZXNzaW9uYWx8ZW58MXx8fHwxNzU3NTQyOTA5fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                alt="Profesional de servicios para el hogar"
                className="rounded-2xl shadow-2xl w-full h-[300px] sm:h-[400px] lg:h-[500px] object-cover"
              />
              
              {/* Floating Card - Hidden on mobile */}
              <div className="hidden sm:block absolute -bottom-6 -left-6 bg-white rounded-lg shadow-lg p-4 border">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  <div>
                    <div className="text-sm text-gray-900">Profesional disponible</div>
                    <div className="text-xs text-gray-500">Respuesta inmediata</div>
                  </div>
                </div>
              </div>
              
              {/* Mobile Floating Card */}
              <div className="sm:hidden absolute -bottom-3 left-1/2 transform -translate-x-1/2 bg-white rounded-lg shadow-lg p-3 border">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <div>
                    <div className="text-xs text-gray-900">Profesional disponible</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}