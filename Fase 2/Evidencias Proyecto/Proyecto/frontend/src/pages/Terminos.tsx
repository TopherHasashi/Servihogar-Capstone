import { Shield, FileText, AlertCircle, CheckCircle2, XCircle } from "lucide-react"

export default function TerminosPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <FileText className="w-8 h-8 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Términos y Condiciones</h1>
              <p className="text-gray-600 mt-1">Última actualización: 13 de noviembre de 2025</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow-sm p-8 space-y-8">
          {/* Introducción */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Introducción y Aceptación</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Bienvenido a ServiHogar. Al acceder y utilizar nuestra plataforma, usted acepta estar sujeto a estos Términos y Condiciones. 
              Si no está de acuerdo con alguna parte de estos términos, no debe utilizar nuestros servicios.
            </p>
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                <p className="text-sm text-blue-900">
                  ServiHogar es una plataforma digital que conecta clientes con profesionales verificados para servicios del hogar en Chile.
                </p>
              </div>
            </div>
          </section>

          {/* Definiciones */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Definiciones</h2>
            <div className="space-y-3">
              <div className="border-l-4 border-gray-300 pl-4">
                <p className="font-medium text-gray-900">Plataforma:</p>
                <p className="text-gray-700">El sitio web y aplicación ServiHogar, incluyendo todas sus funcionalidades.</p>
              </div>
              <div className="border-l-4 border-gray-300 pl-4">
                <p className="font-medium text-gray-900">Usuario:</p>
                <p className="text-gray-700">Cualquier persona que utilice la plataforma, ya sea como Cliente o Profesional.</p>
              </div>
              <div className="border-l-4 border-gray-300 pl-4">
                <p className="font-medium text-gray-900">Cliente:</p>
                <p className="text-gray-700">Persona que solicita servicios a través de la plataforma.</p>
              </div>
              <div className="border-l-4 border-gray-300 pl-4">
                <p className="font-medium text-gray-900">Profesional:</p>
                <p className="text-gray-700">Persona física que ofrece servicios del hogar a través de la plataforma.</p>
              </div>
            </div>
          </section>

          {/* Registro y Cuenta */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Registro y Cuenta de Usuario</h2>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
                <div>
                  <p className="font-medium text-gray-900">Edad mínima:</p>
                  <p className="text-gray-700">Debe ser mayor de 18 años para registrarse y utilizar nuestros servicios.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
                <div>
                  <p className="font-medium text-gray-900">Información veraz:</p>
                  <p className="text-gray-700">Debe proporcionar información precisa, actualizada y completa durante el registro.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
                <div>
                  <p className="font-medium text-gray-900">Seguridad de la cuenta:</p>
                  <p className="text-gray-700">Es responsable de mantener la confidencialidad de su contraseña y de todas las actividades realizadas bajo su cuenta.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
                <div>
                  <p className="font-medium text-gray-900">RUT válido:</p>
                  <p className="text-gray-700">Debe registrarse con un RUT chileno válido para verificación de identidad.</p>
                </div>
              </div>
            </div>
          </section>

          {/* Servicios para Clientes */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Servicios para Clientes</h2>
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">4.1 Búsqueda y Contratación</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                <li>Puede buscar profesionales por región, comuna, servicio, calificación y precio.</li>
                <li>Puede ver la disponibilidad de los profesionales y agendar servicios.</li>
                <li>Debe confirmar los detalles del servicio antes de realizar el pago.</li>
              </ul>

              <h3 className="text-lg font-medium text-gray-900 mt-6">4.2 Pagos</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                <li>Los pagos se procesan a través de Mercado Pago, una plataforma segura de terceros.</li>
                <li>Debe pagar el servicio antes de que este sea realizado.</li>
                <li>Los precios están expresados en pesos chilenos (CLP) e incluyen IVA cuando corresponda.</li>
                <li>ServiHogar cobra una comisión del 10% sobre cada transacción.</li>
              </ul>

              <h3 className="text-lg font-medium text-gray-900 mt-6">4.3 Cancelaciones</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                <li>Puede cancelar un servicio agendado con al menos 24 horas de anticipación para obtener un reembolso completo.</li>
                <li>Cancelaciones con menos de 24 horas de anticipación están sujetas a una penalización del 50%.</li>
                <li>Cancelaciones el mismo día del servicio no son reembolsables.</li>
              </ul>
            </div>
          </section>

          {/* Servicios para Profesionales */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Servicios para Profesionales</h2>
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">5.1 Verificación</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                <li>Todos los profesionales deben pasar por un proceso de verificación antes de ofrecer servicios.</li>
                <li>Debe proporcionar documentación válida (RUT, certificados de capacitación si aplica).</li>
                <li>ServiHogar se reserva el derecho de rechazar o suspender cualquier solicitud de profesional.</li>
              </ul>

              <h3 className="text-lg font-medium text-gray-900 mt-6">5.2 Prestación de Servicios</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                <li>Debe prestar los servicios de manera profesional, puntual y con la calidad esperada.</li>
                <li>Debe respetar los horarios agendados y comunicar cualquier retraso o problema.</li>
                <li>Es responsable de contar con las herramientas y materiales necesarios para el servicio.</li>
              </ul>

              <h3 className="text-lg font-medium text-gray-900 mt-6">5.3 Pagos a Profesionales</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                <li>ServiHogar retiene una comisión del 10% sobre el valor de cada servicio completado.</li>
                <li>Los pagos se transfieren a su cuenta bancaria dentro de 3-5 días hábiles después de completar el servicio.</li>
                <li>Debe proporcionar una cuenta bancaria válida para recibir pagos.</li>
              </ul>
            </div>
          </section>

          {/* Prohibiciones */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Conductas Prohibidas</h2>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <XCircle className="w-5 h-5 text-red-600 mt-1 flex-shrink-0" />
                <p className="text-gray-700">Realizar transacciones fuera de la plataforma para evadir comisiones.</p>
              </div>
              <div className="flex items-start gap-3">
                <XCircle className="w-5 h-5 text-red-600 mt-1 flex-shrink-0" />
                <p className="text-gray-700">Proporcionar información falsa o engañosa.</p>
              </div>
              <div className="flex items-start gap-3">
                <XCircle className="w-5 h-5 text-red-600 mt-1 flex-shrink-0" />
                <p className="text-gray-700">Acosar, amenazar o comportarse de manera inapropiada con otros usuarios.</p>
              </div>
              <div className="flex items-start gap-3">
                <XCircle className="w-5 h-5 text-red-600 mt-1 flex-shrink-0" />
                <p className="text-gray-700">Utilizar la plataforma para actividades ilegales o fraudulentas.</p>
              </div>
              <div className="flex items-start gap-3">
                <XCircle className="w-5 h-5 text-red-600 mt-1 flex-shrink-0" />
                <p className="text-gray-700">Intentar hackear, interferir o dañar el funcionamiento de la plataforma.</p>
              </div>
            </div>
          </section>

          {/* Responsabilidades */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Limitación de Responsabilidad</h2>
            <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded mb-4">
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div className="text-sm text-yellow-900">
                  <p className="font-medium mb-2">ServiHogar actúa como intermediario:</p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>No somos empleadores de los profesionales.</li>
                    <li>No garantizamos la calidad de los servicios prestados.</li>
                    <li>No somos responsables por daños, pérdidas o lesiones durante la prestación del servicio.</li>
                    <li>Los profesionales son contratistas independientes responsables de sus propios impuestos y seguros.</li>
                  </ul>
                </div>
              </div>
            </div>
            <p className="text-gray-700">
              ServiHogar no se hace responsable por disputas entre clientes y profesionales. Recomendamos resolver cualquier 
              inconveniente directamente o contactar a nuestro soporte para mediación.
            </p>
          </section>

          {/* Propiedad Intelectual */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Propiedad Intelectual</h2>
            <p className="text-gray-700 mb-4">
              Todo el contenido de la plataforma, incluyendo logotipos, textos, gráficos, código y diseño, es propiedad de ServiHogar 
              o sus licenciantes y está protegido por las leyes de propiedad intelectual de Chile.
            </p>
            <p className="text-gray-700">
              Queda prohibida la reproducción, distribución, modificación o uso comercial del contenido sin autorización expresa.
            </p>
          </section>

          {/* Modificaciones */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Modificaciones de los Términos</h2>
            <p className="text-gray-700 mb-4">
              ServiHogar se reserva el derecho de modificar estos Términos y Condiciones en cualquier momento. Las modificaciones 
              entrarán en vigencia inmediatamente después de su publicación en la plataforma.
            </p>
            <p className="text-gray-700">
              Es su responsabilidad revisar periódicamente estos términos. El uso continuado de la plataforma después de las 
              modificaciones constituye su aceptación de los nuevos términos.
            </p>
          </section>

          {/* Ley Aplicable */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Ley Aplicable y Jurisdicción</h2>
            <p className="text-gray-700 mb-4">
              Estos Términos y Condiciones se rigen por las leyes de la República de Chile. Cualquier disputa relacionada con estos 
              términos será sometida a la jurisdicción exclusiva de los tribunales de Concepción, Chile.
            </p>
          </section>

          {/* Contacto */}
          <section className="bg-gray-50 p-6 rounded-lg">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Contacto</h2>
            <p className="text-gray-700 mb-4">
              Si tiene preguntas sobre estos Términos y Condiciones, puede contactarnos:
            </p>
            <div className="space-y-2 text-gray-700">
              <p><strong>Email:</strong> legal@servihogar.cl</p>
              <p><strong>Teléfono:</strong> +56 9 1234 5678</p>
              <p><strong>Dirección:</strong> Concepción, Región del Biobío, Chile</p>
              <p><strong>Horario:</strong> Lunes a Viernes, 9:00 - 18:00 hrs</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
