/**
 * Componente de Cita Próxima
 *
 * Muestra la información de la próxima cita médica:
 * - Nombre y especialidad del doctor
 * - Foto del doctor
 * - Descripción breve
 * - Fecha, hora y duración
 * - Botón para ver todas las citas
 */

import { MessageCircle, Calendar, Clock } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Image from "next/image"

export function UpcomingAppointment() {
  return (
    <Card className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl shadow-sm border-0 bg-white">
      {/* Encabezado con título y botón de acción */}
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <div>
          <h3 className="text-base sm:text-lg font-semibold text-gray-900">Próxima</h3>
          <p className="text-base sm:text-lg font-semibold text-gray-900">Cita</p>
        </div>
        {/* Botón para expandir/contraer */}
        <Button variant="ghost" size="icon" className="rounded-full">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
          </svg>
        </Button>
      </div>

      {/* Información del Doctor */}
      <div className="mb-4 sm:mb-6">
        <h4 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Dr. Juan Zuluaga</h4>
        {/* Badge con especialidad */}
        <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100 rounded-full px-3 py-1 text-xs sm:text-sm">
          <span className="mr-1">:helmet:</span>
          Ingeneniero
        </Badge>
      </div>

      {/* Imagen del Doctor con botón de mensaje */}
      <div className="mb-4 sm:mb-6 relative">
        {/* Contenedor de imagen con fondo degradado */}
        <div className="w-full h-48 sm:h-64 bg-gradient-to-br from-purple-100 to-purple-50 rounded-2xl sm:rounded-3xl overflow-hidden">
          <Image src="/vercel.svg" alt="" className="w-full h-full object-cover" width={100} height={100}/>
        </div>
        {/* Botón flotante para enviar mensaje */}
        <Button
          size="icon"
          className="absolute bottom-3 right-3 sm:bottom-4 sm:right-4 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-black hover:bg-black/90"
        >
          <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
        </Button>
      </div>

      {/* Descripción del Doctor */}
      <div className="mb-4 sm:mb-6">
        <h5 className="font-semibold text-gray-900 mb-2 sm:mb-3 text-sm sm:text-base">Acerca del Doctor Zuluaga</h5>
        <p className="text-xs sm:text-sm text-gray-600 leading-relaxed mb-2">
          Ingeniero pro</p>
      </div>

      {/* Información de Fecha y Duración */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6 text-xs sm:text-sm">
        {/* Fecha de la cita */}
        <div className="flex items-center gap-2 text-gray-600">
          <Calendar className="w-4 h-4" />
          <span>23 Nov, 12:30 PM</span>
        </div>
        {/* Duración de la cita */}
        <div className="flex items-center gap-2 text-gray-600">
          <Clock className="w-4 h-4" />
          <span>30 Minutos</span>
        </div>
      </div>

      {/* Botón de Acción Principal */}
      <Button className="w-full bg-black hover:bg-black/90 text-white rounded-full py-5 sm:py-6 text-sm sm:text-base font-medium">
        Ver Citas
      </Button>
    </Card>
  )
}
