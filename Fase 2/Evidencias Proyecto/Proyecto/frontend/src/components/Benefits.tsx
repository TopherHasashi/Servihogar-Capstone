import { Card, CardContent } from "./ui/card"
import { Button } from "./ui/button"
import { Shield, Clock, Users, Award } from "lucide-react"

interface BenefitsProps {
  onUserClick?: () => void
}

const benefits = [
  {
    icon: <Shield className="w-8 h-8" />,
    title: "Profesionales Verificados",
    description: "Todos nuestros profesionales pasan por un riguroso proceso de verificación de identidad, antecedentes y habilidades.",
    color: "bg-blue-500"
  },
  {
    icon: <Clock className="w-8 h-8" />,
    title: "Disponibilidad 24/7",
    description: "Servicios de emergencia disponibles las 24 horas, los 7 días de la semana para cuando más lo necesites.",
    color: "bg-green-500"
  },
  {
    icon: <Award className="w-8 h-8" />,
    title: "Garantía de Calidad",
    description: "Ofrecemos garantía completa en todos nuestros servicios. Si no estás satisfecho, lo arreglamos sin costo.",
    color: "bg-purple-500"
  },
  {
    icon: <Users className="w-8 h-8" />,
    title: "Red de Expertos",
    description: "Más de 500 profesionales calificados en toda la región, especializados en diferentes áreas del hogar.",
    color: "bg-orange-500"
  }
]

export default function Benefits({ onUserClick }: BenefitsProps) {
  return (
    <section className="py-8 sm:py-16 lg:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-12 lg:mb-16">
          <h2 className="text-2xl sm:text-3xl lg:text-5xl text-gray-900 mb-3 sm:mb-4">
            ¿Por Qué Elegirnos?
          </h2>
          <p className="text-base sm:text-lg lg:text-xl text-gray-600 max-w-3xl mx-auto px-4">
            Somos la plataforma líder en servicios para el hogar con estándares de calidad excepcionales
          </p>
        </div>

        {/* Benefits Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8 mb-8 sm:mb-12 lg:mb-16">
          {benefits.map((benefit, index) => (
            <Card key={index} className="text-center hover:shadow-lg transition-all duration-300 border-0 shadow-md group">
              <CardContent className="p-4 sm:p-6 lg:p-8">
                <div className={`${benefit.color} text-white rounded-full w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 flex items-center justify-center mx-auto mb-4 sm:mb-6 group-hover:scale-110 transition-transform [&>svg]:w-5 [&>svg]:h-5 sm:[&>svg]:w-6 sm:[&>svg]:h-6 lg:[&>svg]:w-8 lg:[&>svg]:h-8`}>
                  {benefit.icon}
                </div>
                <h3 className="text-base sm:text-lg lg:text-xl text-gray-900 mb-2 sm:mb-4">
                  {benefit.title}
                </h3>
                <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                  {benefit.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Stats Section */}
        <div className="bg-gradient-to-r from-primary to-blue-600 rounded-xl lg:rounded-2xl p-6 sm:p-8 lg:p-12 text-white">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 text-center">
            <div>
              <div className="text-3xl sm:text-4xl lg:text-5xl mb-1 sm:mb-2">500+</div>
              <div className="text-sm sm:text-base lg:text-lg opacity-90">Profesionales Activos</div>
            </div>
            <div>
              <div className="text-3xl sm:text-4xl lg:text-5xl mb-1 sm:mb-2">10,000+</div>
              <div className="text-sm sm:text-base lg:text-lg opacity-90">Servicios Completados</div>
            </div>
            <div>
              <div className="text-3xl sm:text-4xl lg:text-5xl mb-1 sm:mb-2">4.9★</div>
              <div className="text-sm sm:text-base lg:text-lg opacity-90">Calificación Promedio</div>
            </div>
          </div>
          
          <div className="mt-6 sm:mt-8 pt-6 sm:pt-8 border-t border-white/20 text-center">
            <h3 className="text-lg sm:text-2xl lg:text-3xl mb-3 sm:mb-4">
              Únete a Miles de Clientes Satisfechos
            </h3>
            <p className="text-sm sm:text-base lg:text-lg mb-4 sm:mb-6 opacity-90 max-w-2xl mx-auto px-4">
              Cada día más personas confían en nuestra plataforma para mantener sus hogares en perfectas condiciones
            </p>
            <Button variant="secondary" size="lg" className="bg-white text-primary hover:bg-gray-100 w-full sm:w-auto" onClick={onUserClick}>
              Comenzar Ahora
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}