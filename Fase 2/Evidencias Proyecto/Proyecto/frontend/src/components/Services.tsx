import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card"
import { Button } from "./ui/button"
import { ImageWithFallback } from "./figma/ImageWithFallback"
import { Wrench, Sparkles, Scissors, ArrowRight, Star } from "lucide-react"

interface ServicesProps {
  onServiceClick?: () => void
}

const services = [
  {
    id: 1,
    title: "Gasfitería",
    description: "Reparaciones de tuberías, instalaciones de agua, destapado de desagües y mantenimiento completo.",
    image: "https://images.unsplash.com/photo-1578611709914-0dda0b55f9b0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwbHVtYmluZyUyMHNlcnZpY2UlMjByZXBhaXJ8ZW58MXx8fHwxNzU3NTQyOTA4fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    icon: <Wrench className="w-8 h-8" />,
    price: "Desde $30.000 CLP",
    rating: 4.8,
    services: [
      "Reparación de tuberías",
      "Instalación de llaves",
      "Destapado de desagües",
      "Mantenimiento de tanques",
      "Detección de fugas"
    ]
  },
  {
    id: 2,
    title: "Limpieza del Hogar",
    description: "Limpieza profunda, mantenimiento regular, lavado de alfombras y desinfección completa.",
    image: "https://images.unsplash.com/photo-1581578949510-fa7315c4c350?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxob3VzZSUyMGNsZWFuaW5nJTIwc2VydmljZXxlbnwxfHx8fDE3NTc1MDQyNzB8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    icon: <Sparkles className="w-8 h-8" />,
    price: "Desde $25.000 CLP",
    rating: 4.9,
    services: [
      "Limpieza profunda",
      "Limpieza regular",
      "Lavado de alfombras",
      "Limpieza de ventanas",
      "Desinfección"
    ]
  },
  {
    id: 3,
    title: "Jardinería",
    description: "Diseño de jardines, poda de plantas, mantenimiento de áreas verdes y paisajismo.",
    image: "https://images.unsplash.com/photo-1621958206813-2e9c0441c5b0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxnYXJkZW4lMjBsYW5kc2NhcGluZyUyMHNlcnZpY2V8ZW58MXx8fHwxNzU3NTQyOTA5fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    icon: <Scissors className="w-8 h-8" />,
    price: "Desde $40.000 CLP",
    rating: 4.7,
    services: [
      "Diseño de jardines",
      "Poda de plantas",
      "Mantenimiento de césped",
      "Paisajismo",
      "Riego automático"
    ]
  }
]

export default function Services({ onServiceClick }: ServicesProps) {
  return (
    <section id="servicios" className="py-8 sm:py-16 lg:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-12 lg:mb-16">
          <h2 className="text-2xl sm:text-3xl lg:text-5xl text-gray-900 mb-3 sm:mb-4">
            Nuestros Servicios
          </h2>
          <p className="text-base sm:text-lg lg:text-xl text-gray-600 max-w-3xl mx-auto px-4">
            Ofrecemos una amplia gama de servicios para el hogar con profesionales 
            capacitados y equipos de alta calidad
          </p>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          {services.map((service) => (
            <Card key={service.id} className="group hover:shadow-xl transition-all duration-300 border-0 shadow-lg">
              <div className="relative overflow-hidden rounded-t-lg">
                <ImageWithFallback
                  src={service.image}
                  alt={service.title}
                  className="w-full h-40 sm:h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute top-3 sm:top-4 left-3 sm:left-4 bg-white rounded-full p-1.5 sm:p-2 shadow-md">
                  <div className="text-primary [&>svg]:w-5 [&>svg]:h-5 sm:[&>svg]:w-6 sm:[&>svg]:h-6 lg:[&>svg]:w-8 lg:[&>svg]:h-8">
                    {service.icon}
                  </div>
                </div>
                <div className="absolute top-3 sm:top-4 right-3 sm:right-4 bg-white rounded-full px-2 sm:px-3 py-1 shadow-md">
                  <div className="flex items-center space-x-1">
                    <Star className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-400 fill-current" />
                    <span className="text-xs sm:text-sm">{service.rating}</span>
                  </div>
                </div>
              </div>
              
              <CardHeader className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                  <CardTitle className="text-lg sm:text-xl">{service.title}</CardTitle>
                  <span className="text-primary text-sm sm:text-base font-semibold">{service.price}</span>
                </div>
                <CardDescription className="text-gray-600 text-sm sm:text-base">
                  {service.description}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="p-4 sm:p-6 pt-0">
                <div className="space-y-1.5 sm:space-y-2 mb-4 sm:mb-6">
                  {service.services.map((item, index) => (
                    <div key={index} className="flex items-center space-x-2 text-xs sm:text-sm text-gray-600">
                      <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-primary rounded-full flex-shrink-0"></div>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
                
                <Button className="w-full group" onClick={onServiceClick} size="sm">
                  <span className="sm:hidden">Solicitar</span>
                  <span className="hidden sm:inline">Solicitar Servicio</span>
                  <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>


      </div>
    </section>
  )
}