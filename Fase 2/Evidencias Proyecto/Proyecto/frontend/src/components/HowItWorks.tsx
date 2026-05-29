import { Card, CardContent } from "./ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs"
import { 
  Search, 
  Calendar, 
  UserCheck, 
  Shield,
  CheckCircle,
  Users,
  Award,
  FileText,
  AlertCircle,
  Smartphone
} from "lucide-react"

export default function HowItWorks() {
  const customerSteps = [
    {
      step: "1",
      icon: <Search className="w-8 h-8" />,
      title: "Busca y filtra profesionales",
      description: "Explora profesionales verificados por región, comuna, servicio, calificación y precio en pesos chilenos (CLP).",
      details: [
        "3 categorías de Servicios disponibles (Gasfitería, Limpieza, Jardinería)",
        "Filtros por región y comuna de Chile",
        "Filtros por calificación, precio y disponibilidad",
        "Perfiles completos con reseñas reales de clientes"
      ]
    },
    {
      step: "2", 
      icon: <UserCheck className="w-8 h-8" />,
      title: "Selecciona tu profesional",
      description: "Revisa perfiles, reseñas, certificaciones y elige el profesional que mejor se adapte a tus necesidades.",
      details: [
        "Todos los profesionales están verificados en 24-48 horas",
        "Ver reseñas y calificaciones reales",
        "Precios transparentes 'desde' según duración",
        "Horarios semanales disponibles de cada profesional"
      ]
    },
    {
      step: "3",
      icon: <Calendar className="w-8 h-8" />,
      title: "Agenda según disponibilidad",
      description: "Reserva directamente en la agenda del profesional seleccionando fecha, hora y duración del servicio.",
      details: [
        "Calendario en tiempo real del profesional",
        "Horarios configurados por cada profesional",
        "Precios variables según duración del servicio",
        "Información completa antes de confirmar"
      ]
    },
    {
      step: "4",
      icon: <CheckCircle className="w-8 h-8 text-green-600" />,
      title: "Confirma y califica",
      description: "Una vez completado el servicio, confirmas tu satisfacción y calificas la experiencia.",
      details: [
        "Confirma la satisfacción del servicio recibido",
        "Sistema de reseñas y calificaciones",
        "Historial completo de servicios recibidos",
        "Soporte disponible en horarios de oficina"
      ]
    }
  ]

  const professionalSteps = [
    {
      step: "1",
      icon: <FileText className="w-8 h-8" />,
      title: "Registro y documentación",
      description: "Crea tu cuenta unificada, sube tu cédula de identidad y certificados profesionales para verificación.",
      details: [
        "Sistema de cuenta unificada (cliente + profesional)",
        "Subida de cédula de identidad chilena",
        "Certificados y documentación profesional",
        "Información de contacto y experiencia"
      ]
    },
    {
      step: "2",
      icon: <Shield className="w-8 h-8" />,
      title: "Verificación en 24-48 horas",
      description: "Nuestro equipo verifica tu identidad y certificaciones profesionales de forma rigurosa.",
      details: [
        "Validación de cédula de identidad",
        "Verificación de certificados profesionales",
        "Revisión de antecedentes",
        "Proceso completado en 24-48 horas"
      ]
    },
    {
      step: "3",
      icon: <Calendar className="w-8 h-8" />,
      title: "Configura horarios y precios",
      description: "Define tu horario semanal, duraciones de servicio y precios 'desde' según el tiempo de trabajo.",
      details: [
        "Sistema de horarios semanales personalizable",
        "Configuración de duraciones específicas",
        "Precios 'desde' que varían según duración",
        "Cobertura por región y comuna"
      ]
    },
    {
      step: "4",
      icon: <Smartphone className="w-8 h-8" />,
      title: "Gestión 100% digital",
      description: "Maneja tu agenda, clientes y servicios completamente desde la plataforma digital.",
      details: [
        "Panel de control profesional completo",
        "Gestión de agenda desde cualquier dispositivo",
        "Comunicación digital con clientes",
        "Sin papeleos ni trámites físicos"
      ]
    },
    {
      step: "5",
      icon: <CheckCircle className="w-8 h-8 text-green-600" />,
      title: "Recibe y gestiona tus trabajos",
      description: "Gestiona tus solicitudes, completa los servicios y construye tu reputación en la plataforma.",
      details: [
        "Historial completo de trabajos realizados",
        "Calificaciones y reseñas de clientes",
        "Reputación visible en tu perfil público",
        "Respaldo digital de todos tus servicios"
      ]
    }
  ]

  const guarantees = [
    {
      icon: <Shield className="w-12 h-12 text-blue-500" />,
      title: "Verificación rigurosa en 24-48h",
      description: "Todos los profesionales tienen cédula de identidad y certificados verificados antes de trabajar en la plataforma."
    },
    {
      icon: <Smartphone className="w-12 h-12 text-purple-500" />,
      title: "Gestión 100% digital",
      description: "Todo se maneja desde la plataforma: agenda, pagos, comunicación. Sin efectivo ni papeleos."
    },
    {
      icon: <FileText className="w-12 h-12 text-orange-500" />,
      title: "Contratos digitales automáticos",
      description: "Cada servicio genera un contrato digital que protege tanto al cliente como al profesional."
    }
  ]

  const faqs = [
    {
      question: "¿Cómo funciona el sistema de verificación de profesionales?",
      answer: "Los profesionales suben su cédula de identidad y certificados. Nuestro equipo los verifica en 24-48 horas validando identidad, antecedentes y certificaciones antes de aprobar su perfil."
    },
    {
      question: "¿Puedo filtrar profesionales por mi ubicación?",
      answer: "Sí, tenemos filtros por región y comuna para toda Chile. También puedes filtrar por calificación, precio, disponibilidad y tipo de servicio específico."
    },
    {
      question: "¿Cómo funcionan los precios 'desde'?",
      answer: "Cada profesional configura precios según la duración del servicio. El precio base es 'desde' y puede variar dependiendo del tiempo que tome completar el trabajo."
    },
    {
      question: "¿Qué pasa si tengo un problema con el servicio?",
      answer: "Si hay problemas con el servicio, contacta nuestro soporte en horarios de oficina (Lunes a Viernes 9:00-18:00, Sábados 9:00-14:00). También puedes dejar una reseña para informar a la comunidad."
    },
    {
      question: "¿Ofrecen servicios de emergencia 24/7?",
      answer: "No, no ofrecemos servicios de emergencia 24/7. Nuestros profesionales trabajan en horarios normales que puedes ver en su disponibilidad al agendar."
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="text-center">
            <h1 className="text-3xl lg:text-4xl mb-4">Cómo Funciona Nuestra Plataforma</h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Proceso 100% digital, seguro y transparente con profesionales verificados
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Tabs for Customer and Professional flow */}
        <Tabs defaultValue="customer" className="mb-16">
          <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto mb-12">
            <TabsTrigger value="customer" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Para Clientes
            </TabsTrigger>
            <TabsTrigger value="professional" className="flex items-center gap-2">
              <Award className="w-4 h-4" />
              Para Profesionales
            </TabsTrigger>
          </TabsList>

          <TabsContent value="customer">
            <div className="text-center mb-12">
              <h2 className="text-3xl lg:text-4xl mb-4">Para Clientes: Encuentra tu Profesional Ideal</h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Busca, filtra y agenda con profesionales verificados de forma completamente digital
              </p>
            </div>

            <div className="space-y-8">
              {customerSteps.map((step, index) => (
                <div key={index} className="flex flex-col lg:flex-row items-start gap-8">
                  <div className="flex-shrink-0 lg:w-1/3">
                    <Card className="text-center hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-2xl mx-auto mb-4">
                          {step.step}
                        </div>
                        <div className="text-primary mb-4">
                          {step.icon}
                        </div>
                        <h3 className="text-xl mb-2">{step.title}</h3>
                        <p className="text-gray-600">{step.description}</p>
                      </CardContent>
                    </Card>
                  </div>
                  
                  <div className="flex-1">
                    <Card>
                      <CardContent className="p-6">
                        <h4 className="text-lg mb-4">Detalles del paso:</h4>
                        <ul className="space-y-2">
                          {step.details.map((detail, detailIndex) => (
                            <li key={detailIndex} className="flex items-start gap-2">
                              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                              <span className="text-gray-700">{detail}</span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="professional">
            <div className="text-center mb-12">
              <h2 className="text-3xl lg:text-4xl mb-4">Para Profesionales: Digitaliza tu Trabajo</h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Veríficate en 24-48 horas y empieza a recibir clientes sin complicaciones
              </p>
            </div>

            <div className="space-y-8">
              {professionalSteps.map((step, index) => (
                <div key={index} className="flex flex-col lg:flex-row items-start gap-8">
                  <div className="flex-shrink-0 lg:w-1/3">
                    <Card className="text-center hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center text-white text-2xl mx-auto mb-4">
                          {step.step}
                        </div>
                        <div className="text-primary mb-4">
                          {step.icon}
                        </div>
                        <h3 className="text-xl mb-2">{step.title}</h3>
                        <p className="text-gray-600">{step.description}</p>
                      </CardContent>
                    </Card>
                  </div>
                  
                  <div className="flex-1">
                    <Card>
                      <CardContent className="p-6">
                        <h4 className="text-lg mb-4">Qué incluye:</h4>
                        <ul className="space-y-2">
                          {step.details.map((detail, detailIndex) => (
                            <li key={detailIndex} className="flex items-start gap-2">
                              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                              <span className="text-gray-700">{detail}</span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* Guarantees Section */}
        <section className="mb-16">
          <h2 className="text-3xl lg:text-4xl text-center mb-12">Nuestras Garantías</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {guarantees.map((guarantee, index) => (
              <Card key={index} className="text-center hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex justify-center mb-4">
                    {guarantee.icon}
                  </div>
                  <h3 className="text-lg mb-3">{guarantee.title}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{guarantee.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* FAQ Section */}
        <section className="mb-16">
          <h2 className="text-3xl lg:text-4xl text-center mb-12">Preguntas Frecuentes</h2>
          <div className="max-w-4xl mx-auto space-y-4">
            {faqs.map((faq, index) => (
              <Card key={index} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <AlertCircle className="w-4 h-4 text-blue-600" />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg mb-2">{faq.question}</h3>
                      <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>


      </div>
    </div>
  )
}