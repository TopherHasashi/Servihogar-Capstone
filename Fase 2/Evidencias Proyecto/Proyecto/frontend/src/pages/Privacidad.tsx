import { Shield, Lock, Eye, Database, Cookie, UserCheck, Clock, Globe, Bell, Mail } from "lucide-react"

export default function PrivacidadPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <Shield className="w-8 h-8 text-green-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Política de Privacidad</h1>
              <p className="text-gray-600 mt-1">Última actualización: 13 de noviembre de 2025</p>
            </div>
          </div>
          <p className="text-gray-700 mt-4">
            En ServiHogar, nos comprometemos a proteger su privacidad y datos personales de acuerdo con la Ley N° 19.628 
            sobre Protección de la Vida Privada de Chile.
          </p>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow-sm p-8 space-y-8">
          {/* Información Recopilada */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <Database className="w-6 h-6 text-blue-600" />
              <h2 className="text-2xl font-semibold text-gray-900">1. Información que Recopilamos</h2>
            </div>
            
            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="text-lg font-medium text-gray-900 mb-3">1.1 Información Personal</h3>
                <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                  <li>Nombre completo y RUT</li>
                  <li>Dirección de correo electrónico</li>
                  <li>Número de teléfono</li>
                  <li>Dirección física (para clientes)</li>
                  <li>Información bancaria (para profesionales)</li>
                  <li>Fotografía de perfil (opcional)</li>
                </ul>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="text-lg font-medium text-gray-900 mb-3">1.2 Información de Uso</h3>
                <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                  <li>Historial de servicios solicitados o prestados</li>
                  <li>Calificaciones y reseñas</li>
                  <li>Comunicaciones dentro de la plataforma</li>
                  <li>Preferencias de búsqueda y filtros utilizados</li>
                </ul>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="text-lg font-medium text-gray-900 mb-3">1.3 Información Técnica</h3>
                <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                  <li>Dirección IP</li>
                  <li>Tipo de navegador y dispositivo</li>
                  <li>Sistema operativo</li>
                  <li>Páginas visitadas y tiempo de navegación</li>
                  <li>Cookies y tecnologías similares</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Uso de la Información */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <Eye className="w-6 h-6 text-purple-600" />
              <h2 className="text-2xl font-semibold text-gray-900">2. Cómo Utilizamos su Información</h2>
            </div>
            
            <div className="grid gap-4">
              <div className="border-l-4 border-purple-500 pl-4">
                <p className="font-medium text-gray-900">Prestación del servicio</p>
                <p className="text-gray-700">Facilitar la conexión entre clientes y profesionales y coordinar servicios.</p>
              </div>
              <div className="border-l-4 border-purple-500 pl-4">
                <p className="font-medium text-gray-900">Mejora de la plataforma</p>
                <p className="text-gray-700">Analizar patrones de uso para optimizar funcionalidades y experiencia del usuario.</p>
              </div>
              <div className="border-l-4 border-purple-500 pl-4">
                <p className="font-medium text-gray-900">Comunicaciones</p>
                <p className="text-gray-700">Enviar notificaciones sobre servicios, actualizaciones y ofertas relevantes.</p>
              </div>
              <div className="border-l-4 border-purple-500 pl-4">
                <p className="font-medium text-gray-900">Seguridad y prevención de fraude</p>
                <p className="text-gray-700">Verificar identidades, detectar actividades sospechosas y proteger a nuestros usuarios.</p>
              </div>
              <div className="border-l-4 border-purple-500 pl-4">
                <p className="font-medium text-gray-900">Cumplimiento legal</p>
                <p className="text-gray-700">Cumplir con obligaciones legales y resolver disputas.</p>
              </div>
            </div>
          </section>

          {/* Compartir Información */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <UserCheck className="w-6 h-6 text-orange-600" />
              <h2 className="text-2xl font-semibold text-gray-900">3. Compartir Información con Terceros</h2>
            </div>
            
            <div className="space-y-4">
              <div className="bg-orange-50 p-4 rounded-lg">
                <p className="font-medium text-gray-900 mb-2">Con otros usuarios:</p>
                <p className="text-gray-700">
                  Los clientes pueden ver el perfil público de los profesionales (nombre, foto, calificaciones, ubicación general). 
                  Los profesionales pueden ver información de contacto del cliente necesaria para prestar el servicio.
                </p>
              </div>

              <div className="bg-orange-50 p-4 rounded-lg">
                <p className="font-medium text-gray-900 mb-2">Proveedores de servicios:</p>
                <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                  <li><strong>Servicios de hosting:</strong> Para almacenamiento de datos</li>
                  <li><strong>Herramientas de análisis:</strong> Para mejorar nuestros servicios</li>
                  <li><strong>Servicios de email:</strong> Para comunicaciones automatizadas</li>
                </ul>
              </div>

              <div className="bg-orange-50 p-4 rounded-lg">
                <p className="font-medium text-gray-900 mb-2">Autoridades legales:</p>
                <p className="text-gray-700">
                  Podemos divulgar información cuando sea requerido por ley, orden judicial o para proteger nuestros derechos legales.
                </p>
              </div>

              <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
                <p className="text-sm text-red-900">
                  <strong>Nunca vendemos</strong> su información personal a terceros con fines de marketing.
                </p>
              </div>
            </div>
          </section>

          {/* Cookies */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <Cookie className="w-6 h-6 text-yellow-600" />
              <h2 className="text-2xl font-semibold text-gray-900">4. Cookies y Tecnologías Similares</h2>
            </div>
            
            <p className="text-gray-700 mb-4">
              Utilizamos cookies y tecnologías similares para mejorar su experiencia en la plataforma:
            </p>

            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-yellow-600 rounded-full mt-2"></div>
                <div>
                  <p className="font-medium text-gray-900">Cookies esenciales:</p>
                  <p className="text-gray-700">Necesarias para el funcionamiento básico de la plataforma (inicio de sesión, navegación).</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-yellow-600 rounded-full mt-2"></div>
                <div>
                  <p className="font-medium text-gray-900">Cookies de preferencias:</p>
                  <p className="text-gray-700">Recuerdan sus configuraciones y preferencias de idioma/región.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-yellow-600 rounded-full mt-2"></div>
                <div>
                  <p className="font-medium text-gray-900">Cookies analíticas:</p>
                  <p className="text-gray-700">Nos ayudan a entender cómo los usuarios interactúan con la plataforma.</p>
                </div>
              </div>
            </div>

            <p className="text-gray-700 mt-4">
              Puede configurar su navegador para rechazar cookies, pero esto puede afectar algunas funcionalidades de la plataforma.
            </p>
          </section>

          {/* Seguridad */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <Lock className="w-6 h-6 text-green-600" />
              <h2 className="text-2xl font-semibold text-gray-900">5. Seguridad de sus Datos</h2>
            </div>
            
            <div className="bg-green-50 p-6 rounded-lg">
              <p className="text-gray-700 mb-4">
                Implementamos medidas de seguridad técnicas y organizativas para proteger su información:
              </p>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold">✓</span>
                  <span>Encriptación SSL/TLS para todas las transmisiones de datos</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold">✓</span>
                  <span>Contraseñas almacenadas con hash seguro</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold">✓</span>
                  <span>Acceso limitado a datos personales solo para personal autorizado</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold">✓</span>
                  <span>Monitoreo continuo de actividades sospechosas</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold">✓</span>
                  <span>Copias de seguridad regulares</span>
                </li>
              </ul>
              <p className="text-sm text-gray-600 mt-4 italic">
                Sin embargo, ningún sistema es 100% seguro. Le recomendamos usar contraseñas fuertes y no compartir sus credenciales.
              </p>
            </div>
          </section>

          {/* Derechos del Usuario */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <Bell className="w-6 h-6 text-indigo-600" />
              <h2 className="text-2xl font-semibold text-gray-900">6. Sus Derechos (Ley 19.628)</h2>
            </div>
            
            <div className="space-y-4">
              <div className="bg-indigo-50 p-4 rounded-lg">
                <p className="font-medium text-gray-900 mb-2">Derecho de acceso:</p>
                <p className="text-gray-700">Puede solicitar una copia de los datos personales que tenemos sobre usted.</p>
              </div>

              <div className="bg-indigo-50 p-4 rounded-lg">
                <p className="font-medium text-gray-900 mb-2">Derecho de rectificación:</p>
                <p className="text-gray-700">Puede solicitar la corrección de información inexacta o incompleta.</p>
              </div>

              <div className="bg-indigo-50 p-4 rounded-lg">
                <p className="font-medium text-gray-900 mb-2">Derecho de cancelación:</p>
                <p className="text-gray-700">Puede solicitar la eliminación de sus datos personales, salvo obligaciones legales de conservación.</p>
              </div>

              <div className="bg-indigo-50 p-4 rounded-lg">
                <p className="font-medium text-gray-900 mb-2">Derecho de oposición:</p>
                <p className="text-gray-700">Puede oponerse al procesamiento de sus datos para fines de marketing directo.</p>
              </div>

              <div className="bg-indigo-50 p-4 rounded-lg">
                <p className="font-medium text-gray-900 mb-2">Derecho de portabilidad:</p>
                <p className="text-gray-700">Puede solicitar que sus datos sean transferidos a otro servicio en un formato estructurado.</p>
              </div>

              <p className="text-gray-700 mt-4">
                Para ejercer estos derechos, contacte a <a href="mailto:privacidad@servihogar.cl" className="text-blue-600 hover:underline">privacidad@servihogar.cl</a>
              </p>
            </div>
          </section>

          {/* Retención de Datos */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <Clock className="w-6 h-6 text-gray-600" />
              <h2 className="text-2xl font-semibold text-gray-900">7. Retención de Datos</h2>
            </div>
            
            <p className="text-gray-700 mb-4">
              Conservamos su información personal durante el tiempo necesario para cumplir con los fines descritos en esta política:
            </p>

            <div className="grid gap-3">
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded">
                <div className="w-2 h-2 bg-gray-600 rounded-full mt-2"></div>
                <div>
                  <p className="font-medium text-gray-900">Datos de cuenta activa:</p>
                  <p className="text-gray-700">Mientras su cuenta esté activa</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded">
                <div className="w-2 h-2 bg-gray-600 rounded-full mt-2"></div>
                <div>
                  <p className="font-medium text-gray-900">Historial de transacciones:</p>
                  <p className="text-gray-700">7 años (requisito tributario chileno)</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded">
                <div className="w-2 h-2 bg-gray-600 rounded-full mt-2"></div>
                <div>
                  <p className="font-medium text-gray-900">Datos de marketing:</p>
                  <p className="text-gray-700">Hasta que retire su consentimiento</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded">
                <div className="w-2 h-2 bg-gray-600 rounded-full mt-2"></div>
                <div>
                  <p className="font-medium text-gray-900">Cuenta eliminada:</p>
                  <p className="text-gray-700">30 días (período de gracia), luego eliminación permanente salvo obligaciones legales</p>
                </div>
              </div>
            </div>
          </section>

          {/* Transferencias Internacionales */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <Globe className="w-6 h-6 text-blue-600" />
              <h2 className="text-2xl font-semibold text-gray-900">8. Transferencias Internacionales</h2>
            </div>
            
            <p className="text-gray-700 mb-4">
              Sus datos pueden ser transferidos y almacenados en servidores ubicados fuera de Chile, específicamente en:
            </p>

            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
              <li>Estados Unidos (servicios de hosting en la nube)</li>
              <li>Países de la Unión Europea (servicios de análisis)</li>
            </ul>

            <p className="text-gray-700 mt-4">
              Nos aseguramos de que todos los proveedores cumplan con estándares de protección de datos equivalentes a la legislación chilena.
            </p>
          </section>

          {/* Menores de Edad */}
          <section>
            <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded-lg">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">9. Menores de Edad</h2>
              <p className="text-gray-700">
                Nuestros servicios no están dirigidos a menores de 18 años. No recopilamos intencionalmente información personal 
                de menores. Si descubrimos que hemos recopilado información de un menor, la eliminaremos de inmediato.
              </p>
            </div>
          </section>

          {/* Cambios en la Política */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <Bell className="w-6 h-6 text-purple-600" />
              <h2 className="text-2xl font-semibold text-gray-900">10. Cambios en esta Política</h2>
            </div>
            
            <p className="text-gray-700 mb-4">
              Podemos actualizar esta Política de Privacidad ocasionalmente para reflejar cambios en nuestras prácticas o por 
              razones legales. Los cambios significativos serán notificados a través de:
            </p>

            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
              <li>Correo electrónico a su dirección registrada</li>
              <li>Notificación prominente en nuestra plataforma</li>
              <li>Actualización de la fecha "Última actualización" en la parte superior</li>
            </ul>

            <p className="text-gray-700 mt-4">
              Le recomendamos revisar esta política periódicamente.
            </p>
          </section>

          {/* Contacto */}
          <section className="bg-gradient-to-r from-blue-50 to-green-50 p-6 rounded-lg border border-blue-200">
            <div className="flex items-center gap-3 mb-4">
              <Mail className="w-6 h-6 text-blue-600" />
              <h2 className="text-2xl font-semibold text-gray-900">11. Contacto para Privacidad</h2>
            </div>
            
            <p className="text-gray-700 mb-4">
              Para cualquier consulta sobre esta Política de Privacidad o para ejercer sus derechos, puede contactar a nuestro 
              Oficial de Privacidad:
            </p>

            <div className="space-y-2 text-gray-700 bg-white p-4 rounded border border-blue-200">
              <p><strong>Email:</strong> <a href="mailto:privacidad@servihogar.cl" className="text-blue-600 hover:underline">privacidad@servihogar.cl</a></p>
              <p><strong>Teléfono:</strong> <a href="tel:+56912345678" className="text-blue-600 hover:underline">+56 9 1234 5678</a></p>
              <p><strong>Dirección:</strong> Concepción, Región del Biobío, Chile</p>
              <p><strong>Horario de atención:</strong> Lunes a Viernes, 9:00 - 18:00 hrs</p>
            </div>

            <p className="text-sm text-gray-600 mt-4 italic">
              Nos comprometemos a responder a su solicitud dentro de 15 días hábiles conforme a la Ley 19.628.
            </p>
          </section>

          {/* Referencias Legales */}
          <section className="bg-gray-100 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Referencias Legales</h3>
            <p className="text-sm text-gray-700">
              Esta Política de Privacidad cumple con:
            </p>
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 ml-4 mt-2">
              <li>Ley N° 19.628 sobre Protección de la Vida Privada (Chile)</li>
              <li>Ley N° 19.496 sobre Protección de los Derechos de los Consumidores (Chile)</li>
              <li>Ley N° 20.575 sobre Principio de Finalidad en el Tratamiento de Datos Personales</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  )
}
