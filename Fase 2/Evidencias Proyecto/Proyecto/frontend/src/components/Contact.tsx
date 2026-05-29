import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { Textarea } from "./ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import { 
  MapPin, 
  Phone, 
  Mail, 
  Clock, 
  MessageCircle,
  Send
} from "lucide-react"

export default function Contact() {
  return (
    <section id="contacto" className="py-12 sm:py-16 lg:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-2xl sm:text-3xl lg:text-5xl text-gray-900 mb-3 sm:mb-4">
            Contáctanos
          </h2>
          <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto">
            ¿Tienes preguntas o necesitas ayuda? Estamos aquí para apoyarte en todo momento
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12">
          {/* Contact Information */}
          <div className="space-y-6 sm:space-y-8 order-2 lg:order-1">
            <div>
              <h3 className="text-xl sm:text-2xl text-gray-900 mb-4 sm:mb-6">
                Información de Contacto
              </h3>
              <div className="space-y-4 sm:space-y-6">
                <div className="flex items-start gap-3 sm:gap-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Phone className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm sm:text-base text-gray-900 mb-1">Teléfono</p>
                    <p className="text-sm sm:text-base text-gray-600">+56 2 2345 6789</p>
                    <p className="text-xs sm:text-sm text-gray-500">Atención 24/7 para emergencias</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 sm:gap-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Mail className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm sm:text-base text-gray-900 mb-1">Email</p>
                    <p className="text-sm sm:text-base text-gray-600">contacto@servihogar.cl</p>
                    <p className="text-xs sm:text-sm text-gray-500">Respuesta en menos de 2 horas</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 sm:gap-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm sm:text-base text-gray-900 mb-1">Oficina Central</p>
                    <p className="text-sm sm:text-base text-gray-600">Providencia 1234, Oficina 567</p>
                    <p className="text-sm sm:text-base text-gray-600">Santiago, Chile</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 sm:gap-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm sm:text-base text-gray-900 mb-1">Horarios de Atención</p>
                    <p className="text-sm sm:text-base text-gray-600">Lunes a Viernes: 8:00 - 20:00</p>
                    <p className="text-sm sm:text-base text-gray-600">Sábados: 9:00 - 18:00</p>
                    <p className="text-sm sm:text-base text-gray-600">Domingos: 10:00 - 16:00</p>
                  </div>
                </div>
              </div>
            </div>

            {/* WhatsApp CTA */}
            <Card className="bg-green-50 border-green-200">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-500 rounded-lg flex items-center justify-center">
                    <MessageCircle className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm sm:text-base text-gray-900 mb-1">Chat directo por WhatsApp</h4>
                    <p className="text-xs sm:text-sm text-gray-600">Obtén ayuda inmediata para emergencias</p>
                  </div>
                  <Button size="sm" className="bg-green-500 hover:bg-green-600">
                    Chatear
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Contact Form */}
          <Card className="order-1 lg:order-2">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <Send className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                Envíanos un mensaje
              </CardTitle>
              <CardDescription className="text-sm sm:text-base">
                Completa el formulario y te responderemos a la brevedad
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6 pt-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-sm sm:text-base">Nombre *</Label>
                  <Input id="firstName" placeholder="Tu nombre" required className="text-sm sm:text-base" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-sm sm:text-base">Apellido *</Label>
                  <Input id="lastName" placeholder="Tu apellido" required className="text-sm sm:text-base" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm sm:text-base">Email *</Label>
                <Input id="email" type="email" placeholder="tu@email.com" required className="text-sm sm:text-base" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm sm:text-base">Teléfono</Label>
                <Input id="phone" type="tel" placeholder="+56 9 XXXX XXXX" className="text-sm sm:text-base" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject" className="text-sm sm:text-base">Asunto *</Label>
                <Select>
                  <SelectTrigger className="text-sm sm:text-base">
                    <SelectValue placeholder="Selecciona un asunto" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">Consulta general</SelectItem>
                    <SelectItem value="service">Sobre un servicio</SelectItem>
                    <SelectItem value="professional">Quiero ser profesional</SelectItem>
                    <SelectItem value="support">Soporte técnico</SelectItem>
                    <SelectItem value="complaint">Reclamo</SelectItem>
                    <SelectItem value="suggestion">Sugerencia</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="message" className="text-sm sm:text-base">Mensaje *</Label>
                <Textarea 
                  id="message" 
                  placeholder="Describe tu consulta o mensaje..."
                  className="min-h-[100px] sm:min-h-[120px] resize-none text-sm sm:text-base"
                  required
                />
              </div>

              <Button className="w-full" size="lg">
                <Send className="w-4 h-4 mr-2" />
                Enviar Mensaje
              </Button>

              <p className="text-xs sm:text-sm text-gray-500 text-center">
                * Campos obligatorios. Responderemos en un máximo de 2 horas hábiles.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
}