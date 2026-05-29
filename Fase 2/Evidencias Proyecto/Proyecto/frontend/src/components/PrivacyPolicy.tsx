import { Card, CardContent } from "./ui/card"
import { Button } from "./ui/button"
import { Badge } from "./ui/badge"
import { Separator } from "./ui/separator"
import { 
  ArrowLeft, 
  Shield, 
  Lock, 
  Eye,
  Database,
  Share2,
  CheckCircle,
  Mail,
  Phone,
  Users,
  Trash2,
  UserX,
  FileText,
  Settings
} from "lucide-react"

interface PrivacyPolicyProps {
  onBack: () => void
}

export default function PrivacyPolicy({ onBack }: PrivacyPolicyProps) {
  const lastUpdated = "15 de Enero de 2024"

  const dataTypes = [
    {
      category: "Información Personal",
      icon: <Users className="w-5 h-5 text-blue-500" />,
      items: [
        "Nombre completo y datos de contacto",
        "Dirección de email y número de teléfono",
        "Dirección física para prestación de servicios",
        "Información de identificación (RUT/Cédula)",
        "Fotografía de perfil (opcional)"
      ]
    },
    {
      category: "Información Profesional",
      icon: <Settings className="w-5 h-5 text-green-500" />,
      items: [
        "Experiencia laboral y certificaciones",
        "Servicios que ofrece y tarifas",
        "Horarios de disponibilidad",
        "Calificaciones y reseñas recibidas",
        "Historial de servicios realizados"
      ]
    },
    {
      category: "Información Técnica",
      icon: <Database className="w-5 h-5 text-purple-500" />,
      items: [
        "Dirección IP y datos de conexión",
        "Tipo de dispositivo y navegador utilizado",
        "Cookies y tecnologías similares",
        "Datos de geolocalización (con consentimiento)",
        "Registro de actividad en la plataforma"
      ]
    },
    {
      category: "Información Financiera",
      icon: <Lock className="w-5 h-5 text-orange-500" />,
      items: [
        "Datos de facturación y pago",
        "Historial de transacciones",
        "Información bancaria (encriptada)",
        "Montos cobrados y pagados",
        "Registros de reembolsos y disputas"
      ]
    }
  ]

  const purposes = [
    {
      title: "Prestación del Servicio",
      description: "Conectar clientes con profesionales y facilitar la contratación de servicios.",
      icon: <Users className="w-6 h-6 text-blue-500" />
    },
    {
      title: "Verificación y Seguridad",
      description: "Verificar la identidad de usuarios y mantener la seguridad de la plataforma.",
      icon: <Shield className="w-6 h-6 text-green-500" />
    },
    {
      title: "Procesamiento de Pagos",
      description: "Procesar pagos de forma segura y gestionar transacciones financieras.",
      icon: <Lock className="w-6 h-6 text-purple-500" />
    },
    {
      title: "Comunicación",
      description: "Enviar notificaciones importantes, actualizaciones y comunicaciones del servicio.",
      icon: <Mail className="w-6 h-6 text-orange-500" />
    },
    {
      title: "Mejora del Servicio",
      description: "Analizar el uso de la plataforma para mejorar nuestros servicios y experiencia de usuario.",
      icon: <Settings className="w-6 h-6 text-red-500" />
    },
    {
      title: "Cumplimiento Legal",
      description: "Cumplir con obligaciones legales y regulatorias aplicables.",
      icon: <FileText className="w-6 h-6 text-gray-500" />
    }
  ]

  const rights = [
    {
      right: "Acceso",
      description: "Solicitar información sobre qué datos personales tenemos sobre usted.",
      icon: <Eye className="w-5 h-5 text-blue-500" />
    },
    {
      right: "Rectificación",
      description: "Corregir información personal inexacta o incompleta.",
      icon: <Settings className="w-5 h-5 text-green-500" />
    },
    {
      right: "Eliminación",
      description: "Solicitar la eliminación de sus datos personales bajo ciertas circunstancias.",
      icon: <Trash2 className="w-5 h-5 text-red-500" />
    },
    {
      right: "Oposición",
      description: "Oponerse al procesamiento de sus datos para fines específicos.",
      icon: <UserX className="w-5 h-5 text-orange-500" />
    },
    {
      right: "Portabilidad",
      description: "Recibir sus datos en un formato estructurado y legible por máquina.",
      icon: <Share2 className="w-5 h-5 text-purple-500" />
    },
    {
      right: "Limitación",
      description: "Restringir el procesamiento de sus datos en determinadas situaciones.",
      icon: <Lock className="w-5 h-5 text-gray-500" />
    }
  ]

  const sections = [
    {
      id: "introduccion",
      title: "1. Introducción",
      content: [
        "En ServiHogar, respetamos su privacidad y estamos comprometidos con la protección de sus datos personales. Esta Política de Privacidad explica cómo recopilamos, usamos, compartimos y protegemos su información cuando utiliza nuestra plataforma.",
        "Esta política se aplica a todos los usuarios de ServiHogar, incluyendo clientes que solicitan servicios y profesionales que los proporcionan.",
        "Al utilizar nuestros servicios, usted consiente el procesamiento de sus datos personales de acuerdo con esta política."
      ]
    },
    {
      id: "recopilacion",
      title: "2. Información que Recopilamos",
      content: [
        "Recopilamos información que usted nos proporciona directamente, información que obtenemos automáticamente cuando usa nuestros servicios, e información de terceros cuando es apropiado y legal.",
        "La información que recopilamos incluye datos necesarios para proporcionar nuestros servicios, verificar identidades, procesar pagos y mejorar la experiencia del usuario.",
        "Siempre solicitamos su consentimiento explícito para recopilar información sensible o cuando la ley lo requiere."
      ]
    },
    {
      id: "uso",
      title: "3. Cómo Utilizamos su Información",
      content: [
        "Utilizamos su información personal únicamente para los fines específicos para los cuales fue recopilada y de acuerdo con esta política.",
        "Nunca vendemos su información personal a terceros con fines comerciales.",
        "Podemos usar información agregada y anonimizada para análisis estadísticos y mejora de servicios sin identificar a usuarios individuales.",
        "En caso de cambios significativos en el uso de sus datos, le notificaremos y solicitaremos su consentimiento adicional si es requerido por ley."
      ]
    },
    {
      id: "compartir",
      title: "4. Compartir Información",
      content: [
        "Compartimos información limitada entre clientes y profesionales únicamente para facilitar la prestación de servicios contratados.",
        "Compartimos información con proveedores de servicios de confianza que nos ayudan a operar nuestra plataforma, siempre bajo estrictos acuerdos de confidencialidad.",
        "Podemos compartir información cuando sea requerido por ley, para proteger nuestros derechos legales o en caso de emergencia.",
        "En caso de venta o fusión de la empresa, la información puede ser transferida al nuevo propietario bajo la misma protección de esta política."
      ]
    },
    {
      id: "seguridad",
      title: "5. Seguridad de los Datos",
      content: [
        "Implementamos medidas de seguridad técnicas, físicas y administrativas apropiadas para proteger su información personal contra acceso no autorizado, alteración, divulgación o destrucción.",
        "Utilizamos encriptación SSL/TLS para todas las transmisiones de datos sensibles.",
        "Limitamos el acceso a información personal solo a empleados que necesitan conocerla para realizar sus funciones laborales.",
        "Realizamos auditorías regulares de seguridad y actualizamos nuestras medidas de protección según las mejores prácticas de la industria.",
        "En caso de una violación de datos que pueda afectar sus derechos, le notificaremos dentro de 72 horas según lo requiere la ley."
      ]
    },
    {
      id: "cookies",
      title: "6. Cookies y Tecnologías Similares",
      content: [
        "Utilizamos cookies y tecnologías similares para mejorar su experiencia en nuestra plataforma, recordar sus preferencias y analizar el uso del sitio.",
        "Puede gestionar las preferencias de cookies a través de la configuración de su navegador.",
        "Algunas cookies son esenciales para el funcionamiento de la plataforma y no pueden ser desactivadas.",
        "Utilizamos cookies de análisis para entender cómo los usuarios interactúan con nuestra plataforma y mejorar nuestros servicios."
      ]
    },
    {
      id: "retencion",
      title: "7. Retención de Datos",
      content: [
        "Conservamos su información personal solo durante el tiempo necesario para cumplir con los fines para los cuales fue recopilada.",
        "Los datos de transacciones y servicios se conservan durante al menos 6 años para cumplir con obligaciones contables y fiscales.",
        "Puede solicitar la eliminación de su cuenta y datos asociados en cualquier momento, sujeto a nuestras obligaciones legales de retención.",
        "Los datos anonimizados pueden conservarse indefinidamente para fines de análisis estadístico."
      ]
    },
    {
      id: "menores",
      title: "8. Protección de Menores",
      content: [
        "Nuestros servicios están dirigidos a personas mayores de 18 años y no recopilamos intencionalmente información de menores de edad.",
        "Si descubrimos que hemos recopilado información de un menor de edad, tomaremos medidas inmediatas para eliminar dicha información.",
        "Los padres o tutores que crean que hemos recopilado información de un menor deben contactarnos inmediatamente."
      ]
    },
    {
      id: "transferencias",
      title: "9. Transferencias Internacionales",
      content: [
        "Sus datos personales se procesan principalmente en Chile y están sujetos a las leyes de protección de datos chilenas.",
        "En caso de transferir datos a otros países, nos aseguramos de que existan medidas de protección adecuadas.",
        "Cualquier transferencia internacional cumple con los estándares internacionales de protección de datos."
      ]
    },
    {
      id: "cambios",
      title: "10. Cambios a esta Política",
      content: [
        "Podemos actualizar esta Política de Privacidad periódicamente para reflejar cambios en nuestras prácticas o en la legislación aplicable.",
        "Le notificaremos sobre cambios materiales en esta política a través de email o mediante un aviso prominente en nuestra plataforma.",
        "Su uso continuado de nuestros servicios después de cualquier cambio constituye su aceptación de la política actualizada.",
        "Recomendamos revisar esta política periódicamente para mantenerse informado sobre cómo protegemos su información."
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
            <h1 className="text-4xl lg:text-6xl mb-4">Política de Privacidad</h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-6">
              Cómo recopilamos, utilizamos y protegemos su información personal en ServiHogar
            </p>
            <Badge variant="secondary" className="text-sm">
              Última actualización: {lastUpdated}
            </Badge>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-12 space-y-12">
        {/* Summary Cards */}
        <section>
          <h2 className="text-3xl text-center mb-8">Resumen de Nuestra Política</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="text-center hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <Shield className="w-12 h-12 text-blue-500 mx-auto mb-4" />
                <h3 className="text-lg mb-2">Protección Total</h3>
                <p className="text-sm text-gray-600">
                  Sus datos están protegidos con las mejores medidas de seguridad de la industria.
                </p>
              </CardContent>
            </Card>
            <Card className="text-center hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <Eye className="w-12 h-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg mb-2">Transparencia</h3>
                <p className="text-sm text-gray-600">
                  Siempre sabrá qué datos recopilamos y cómo los utilizamos.
                </p>
              </CardContent>
            </Card>
            <Card className="text-center hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <Users className="w-12 h-12 text-purple-500 mx-auto mb-4" />
                <h3 className="text-lg mb-2">Control Total</h3>
                <p className="text-sm text-gray-600">
                  Usted mantiene el control sobre su información y puede modificarla cuando desee.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Data Types */}
        <section>
          <h2 className="text-3xl text-center mb-8">Tipos de Información que Recopilamos</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {dataTypes.map((type, index) => (
              <Card key={index} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    {type.icon}
                    <h3 className="text-lg">{type.category}</h3>
                  </div>
                  <ul className="space-y-2">
                    {type.items.map((item, itemIndex) => (
                      <li key={itemIndex} className="flex items-start gap-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-700">{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Purposes */}
        <section>
          <h2 className="text-3xl text-center mb-8">¿Para qué Utilizamos su Información?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {purposes.map((purpose, index) => (
              <Card key={index} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6 text-center">
                  <div className="flex justify-center mb-4">
                    {purpose.icon}
                  </div>
                  <h3 className="text-lg mb-3">{purpose.title}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{purpose.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* User Rights */}
        <section>
          <h2 className="text-3xl text-center mb-8">Sus Derechos sobre los Datos</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rights.map((userRight, index) => (
              <Card key={index} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-3">
                    {userRight.icon}
                    <h3 className="text-lg">{userRight.right}</h3>
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed">{userRight.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <div className="mt-8 text-center">
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-6">
                <h3 className="text-lg mb-3">¿Cómo ejercer sus derechos?</h3>
                <p className="text-gray-700 mb-4">
                  Para ejercer cualquiera de estos derechos, simplemente contáctenos a través de:
                </p>
                <div className="flex flex-col sm:flex-row gap-2 justify-center">
                  <Badge variant="outline" className="text-blue-700 border-blue-300">
                    privacidad@servihogar.cl
                  </Badge>
                  <Badge variant="outline" className="text-blue-700 border-blue-300">
                    +56 9 1234 5678
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Detailed Sections */}
        <section>
          <h2 className="text-3xl text-center mb-8">Política Detallada</h2>
          <div className="space-y-6">
            {sections.map((section) => (
              <Card key={section.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-8">
                  <h3 className="text-xl mb-4">{section.title}</h3>
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
        </section>

        {/* Contact Section */}
        <section>
          <Card className="bg-gradient-to-r from-blue-50 to-purple-50">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Mail className="w-8 h-8 text-blue-600" />
              </div>
              <h2 className="text-2xl mb-4">¿Preguntas sobre Privacidad?</h2>
              <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
                Nuestro Oficial de Protección de Datos está disponible para responder cualquier 
                pregunta sobre cómo manejamos su información personal.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button variant="outline">
                  <Mail className="w-4 h-4 mr-2" />
                  privacidad@servihogar.cl
                </Button>
                <Button variant="outline">
                  <Phone className="w-4 h-4 mr-2" />
                  +56 9 1234 5678
                </Button>
              </div>
              
              <Separator className="my-6" />
              
              <div className="text-sm text-gray-600">
                <p className="mb-2">
                  <strong>Oficina de Protección de Datos</strong>
                </p>
                <p>ServiHogar SpA</p>
                <p>Av. Providencia 1234, Oficina 567</p>
                <p>Santiago, Chile</p>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  )
}