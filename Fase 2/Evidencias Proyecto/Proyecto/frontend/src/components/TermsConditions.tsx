import { Card, CardContent } from "./ui/card"
import { Button } from "./ui/button"
import { Badge } from "./ui/badge"
import { 
  ArrowLeft, 
  FileText, 
  Shield, 
  AlertCircle,
  CheckCircle,
  Users,
  CreditCard,
  Scale,
  Clock,
  Mail
} from "lucide-react"

interface TermsConditionsProps {
  onBack: () => void
}

export default function TermsConditions({ onBack }: TermsConditionsProps) {
  const lastUpdated = "15 de Enero de 2024"

  const sections = [
    {
      id: "aceptacion",
      title: "1. Aceptación de los Términos",
      icon: <CheckCircle className="w-5 h-5 text-green-500" />,
      content: [
        "Al acceder y utilizar la plataforma ServiHogar, usted acepta estar sujeto a estos Términos y Condiciones de Uso.",
        "Si no está de acuerdo con alguna parte de estos términos, no debe utilizar nuestros servicios.",
        "Nos reservamos el derecho de modificar estos términos en cualquier momento, y dichas modificaciones entrarán en vigor inmediatamente después de su publicación en el sitio web.",
        "Es su responsabilidad revisar periódicamente estos términos para mantenerse informado de cualquier cambio."
      ]
    },
    {
      id: "definiciones",
      title: "2. Definiciones",
      icon: <FileText className="w-5 h-5 text-blue-500" />,
      content: [
        "**Plataforma**: Se refiere al sitio web, aplicación móvil y todos los servicios relacionados operados por ServiHogar.",
        "**Usuario/Cliente**: Persona que solicita servicios a través de nuestra plataforma.",
        "**Profesional**: Persona física o jurídica que ofrece servicios a través de nuestra plataforma.",
        "**Servicio**: Cualquier trabajo, reparación o mantenimiento ofrecido por los profesionales registrados.",
        "**Contenido**: Toda información, texto, gráficos, fotos u otro material publicado en la plataforma."
      ]
    },
    {
      id: "servicios",
      title: "3. Descripción de los Servicios",
      icon: <Users className="w-5 h-5 text-purple-500" />,
      content: [
        "ServiHogar es una plataforma digital que conecta clientes con profesionales independientes para servicios del hogar.",
        "No somos empleadores de los profesionales registrados, sino que facilitamos el contacto entre las partes.",
        "Los servicios incluyen pero no se limitan a: gasfitería, limpieza del hogar, jardinería, electricidad, pintura y reparaciones menores.",
        "La calidad, seguridad y ejecución de los servicios es responsabilidad exclusiva del profesional contratado.",
        "Nos reservamos el derecho de modificar, suspender o discontinuar cualquier aspecto de nuestros servicios en cualquier momento."
      ]
    },
    {
      id: "registro",
      title: "4. Registro y Cuentas de Usuario",
      icon: <Shield className="w-5 h-5 text-orange-500" />,
      content: [
        "Para utilizar ciertos servicios de la plataforma, debe crear una cuenta proporcionando información precisa y completa.",
        "Es responsable de mantener la confidencialidad de su contraseña y de todas las actividades que ocurran bajo su cuenta.",
        "Debe notificarnos inmediatamente cualquier uso no autorizado de su cuenta o cualquier otra violación de seguridad.",
        "Nos reservamos el derecho de suspender o terminar cuentas que violen estos términos o que consideremos fraudulentas.",
        "Solo puede tener una cuenta activa y debe ser mayor de 18 años para registrarse."
      ]
    },
    {
      id: "obligaciones-clientes",
      title: "5. Obligaciones de los Clientes",
      icon: <Users className="w-5 h-5 text-green-500" />,
      content: [
        "Proporcionar información veraz y actualizada sobre el servicio requerido.",
        "Estar presente en el domicilio durante la prestación del servicio o designar a un representante autorizado.",
        "Proporcionar acceso seguro al lugar donde se realizará el trabajo.",
        "Pagar el monto acordado por el servicio en los plazos establecidos.",
        "Tratar con respeto a los profesionales y no discriminar por raza, género, religión u otros motivos.",
        "Reportar cualquier problema o incidencia a través de los canales oficiales de la plataforma."
      ]
    },
    {
      id: "obligaciones-profesionales",
      title: "6. Obligaciones de los Profesionales",
      icon: <Shield className="w-5 h-5 text-blue-500" />,
      content: [
        "Proporcionar servicios con el nivel de habilidad, cuidado y profesionalismo esperado en su campo.",
        "Cumplir con las especificaciones acordadas y completar el trabajo en el tiempo establecido.",
        "Mantener certificaciones vigentes y cumplir con todas las regulaciones aplicables.",
        "Tratar la propiedad del cliente con cuidado y respeto.",
        "Mantener la confidencialidad de la información del cliente.",
        "Comunicar proactivamente cualquier problema o cambio necesario en el servicio."
      ]
    },
    {
      id: "pagos",
      title: "7. Pagos y Tarifas",
      icon: <CreditCard className="w-5 h-5 text-green-500" />,
      content: [
        "Los precios de los servicios son establecidos libremente por cada profesional y mostrados en la plataforma.",
        "ServiHogar cobra una comisión por cada transacción exitosa, que se descuenta automáticamente del pago al profesional.",
        "Los pagos se procesan a través de sistemas seguros de terceros y pueden incluir tarjetas de crédito, débito o transferencias.",
        "Los reembolsos se manejan caso por caso según nuestra política de satisfacción al cliente.",
        "En caso de disputa, el pago puede ser retenido hasta que se resuelva el conflicto."
      ]
    },
    {
      id: "cancelaciones",
      title: "8. Cancelaciones y Reprogramaciones",
      icon: <Clock className="w-5 h-5 text-orange-500" />,
      content: [
        "Los clientes pueden cancelar un servicio hasta 2 horas antes del horario programado sin penalización.",
        "Cancelaciones con menos de 2 horas de anticipación pueden estar sujetas a una tarifa de cancelación.",
        "Los profesionales pueden cancelar un servicio con al menos 4 horas de anticipación sin penalización.",
        "En caso de emergencias o condiciones climáticas adversas, las políticas de cancelación pueden ser flexibles.",
        "Las reprogramaciones están sujetas a la disponibilidad tanto del cliente como del profesional."
      ]
    },
    {
      id: "responsabilidades",
      title: "9. Limitación de Responsabilidad",
      icon: <Scale className="w-5 h-5 text-red-500" />,
      content: [
        "ServiHogar actúa únicamente como intermediario entre clientes y profesionales independientes.",
        "No somos responsables por la calidad, seguridad, legalidad o disponibilidad de los servicios ofrecidos por los profesionales.",
        "No garantizamos que los servicios cumplan con sus expectativas específicas o que estén libres de errores.",
        "Nuestra responsabilidad máxima se limita al monto pagado por el servicio específico en cuestión.",
        "No somos responsables por daños indirectos, incidentales, especiales o consecuenciales."
      ]
    },
    {
      id: "propiedad-intelectual",
      title: "10. Propiedad Intelectual",
      icon: <Shield className="w-5 h-5 text-purple-500" />,
      content: [
        "Todo el contenido de la plataforma, incluyendo textos, gráficos, logos, iconos y software, es propiedad de ServiHogar o sus licenciantes.",
        "Los usuarios reciben una licencia limitada para usar la plataforma solo para fines personales y comerciales legítimos.",
        "Está prohibido copiar, modificar, distribuir o crear trabajos derivados del contenido sin autorización expresa.",
        "Los profesionales mantienen la propiedad intelectual de su trabajo, pero otorgan a ServiHogar licencia para mostrar su información en la plataforma."
      ]
    },
    {
      id: "terminacion",
      title: "11. Terminación del Servicio",
      icon: <AlertCircle className="w-5 h-5 text-red-500" />,
      content: [
        "Cualquier parte puede terminar su relación con ServiHogar en cualquier momento con o sin causa.",
        "Nos reservamos el derecho de suspender o terminar cuentas que violen estos términos o nuestras políticas.",
        "Al terminar su cuenta, su derecho a usar la plataforma cesa inmediatamente.",
        "Las disposiciones que por su naturaleza deben sobrevivir a la terminación, continuarán en efecto."
      ]
    },
    {
      id: "ley-aplicable",
      title: "12. Ley Aplicable y Jurisdicción",
      icon: <Scale className="w-5 h-5 text-blue-500" />,
      content: [
        "Estos términos se rigen por las leyes de la República de Chile.",
        "Cualquier disputa relacionada con estos términos será resuelta en los tribunales competentes de Santiago, Chile.",
        "Si alguna disposición de estos términos es declarada inválida, las disposiciones restantes permanecerán en pleno vigor.",
        "Intentaremos resolver las disputas a través de mediación antes de recurrir a procedimientos legales formales."
      ]
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <Button variant="ghost" onClick={onBack} className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver al inicio
          </Button>
          
          <div className="text-center">
            <h1 className="text-4xl lg:text-6xl mb-4">Términos y Condiciones</h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-6">
              Términos de uso de la plataforma ServiHogar - Servicios para el Hogar
            </p>
            <Badge variant="secondary" className="text-sm">
              Última actualización: {lastUpdated}
            </Badge>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Introduction */}
        <Card className="mb-8">
          <CardContent className="p-8">
            <div className="flex items-start gap-4 mb-6">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <FileText className="w-6 h-6 text-blue-600" />
                </div>
              </div>
              <div>
                <h2 className="text-2xl mb-3">Información Importante</h2>
                <p className="text-gray-600 leading-relaxed">
                  Los siguientes términos y condiciones rigen el uso de la plataforma ServiHogar. 
                  Al utilizar nuestros servicios, usted acepta cumplir con estos términos. 
                  Le recomendamos leer cuidadosamente todo el documento.
                </p>
              </div>
            </div>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm text-yellow-800 mb-1">Nota Legal</h3>
                  <p className="text-sm text-yellow-700">
                    Estos términos constituyen un acuerdo legal entre usted y ServiHogar. 
                    Si no está de acuerdo con estos términos, no debe utilizar nuestros servicios.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Terms Sections */}
        <div className="space-y-6">
          {sections.map((section) => (
            <Card key={section.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-8">
                <div className="flex items-start gap-4 mb-6">
                  <div className="flex-shrink-0">
                    {section.icon}
                  </div>
                  <h2 className="text-xl">{section.title}</h2>
                </div>
                
                <div className="space-y-4">
                  {section.content.map((paragraph, index) => (
                    <p key={index} className="text-gray-700 leading-relaxed">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Contact Section */}
        <Card className="mt-12">
          <CardContent className="p-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Mail className="w-8 h-8 text-blue-600" />
              </div>
              <h2 className="text-2xl mb-4">¿Preguntas sobre estos términos?</h2>
              <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
                Si tiene alguna pregunta sobre estos Términos y Condiciones, 
                no dude en contactarnos. Nuestro equipo legal estará encantado de ayudarle.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button variant="outline">
                  <Mail className="w-4 h-4 mr-2" />
                  legal@servihogar.cl
                </Button>
                <Button variant="outline">
                  soporte@servihogar.cl
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary */}
        <div className="mt-12 bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-8">
          <h3 className="text-xl mb-4 text-center">Resumen de Puntos Clave</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-1" />
                <span className="text-sm text-gray-700">ServiHogar es una plataforma de intermediación</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-1" />
                <span className="text-sm text-gray-700">Los profesionales son independientes</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-1" />
                <span className="text-sm text-gray-700">Pagos seguros y protegidos</span>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-1" />
                <span className="text-sm text-gray-700">Política de cancelación flexible</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-1" />
                <span className="text-sm text-gray-700">Resolución de disputas disponible</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-1" />
                <span className="text-sm text-gray-700">Términos sujetos a ley chilena</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}