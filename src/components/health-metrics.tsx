/**
 * Componente de Métricas de Salud
 *
 * Muestra tres tarjetas con información de salud:
 * 1. Ritmo Cardíaco - Con gráfico de línea
 * 2. Células Sanguíneas - Con gráfico de barras
 * 3. Hidratación - Con barra de progreso
 *
 * Es responsive y se adapta de 1 a 3 columnas según el tamaño de pantalla.
 */

import { Heart, Droplet, Activity } from "lucide-react"
import { Card } from "@/components/ui/card"

export function HealthMetrics() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
      {/* Tarjeta de Ritmo Cardíaco */}
      <Card className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl shadow-sm border-0">
        {/* Encabezado con título e icono */}
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <span className="text-xs sm:text-sm text-gray-600">Ritmo Cardíaco</span>
          <Heart className="w-4 h-4 sm:w-5 sm:h-5 text-pink-500" />
        </div>

        {/* Gráfico de línea SVG simulando ritmo cardíaco */}
        <div className="mb-3 sm:mb-4">
          <svg className="w-full h-12 sm:h-16" viewBox="0 0 200 60">
            <path
              d="M 0 30 Q 20 20, 40 30 T 80 30 T 120 30 T 160 30 T 200 30"
              fill="none"
              stroke="rgb(168, 85, 247)"
              strokeWidth="2"
              opacity="0.6"
            />
          </svg>
        </div>

        {/* Valor principal y unidad */}
        <div className="flex items-baseline gap-2">
          <span className="text-2xl sm:text-3xl font-bold text-gray-900">120</span>
          <span className="text-xs sm:text-sm text-gray-500">BPM</span>
        </div>
      </Card>

      {/* Tarjeta de Células Sanguíneas */}
      <Card className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl shadow-sm border-0">
        {/* Encabezado con título e icono */}
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <span className="text-xs sm:text-sm text-gray-600">Células Sanguíneas</span>
          <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-red-500" />
        </div>

        {/* Gráfico de barras verticales */}
        <div className="mb-3 sm:mb-4 flex items-end justify-center gap-1 h-12 sm:h-16">
          {/* Array de alturas para crear el efecto de gráfico de barras */}
          {[40, 60, 45, 70, 55, 80, 50, 65, 75, 60, 85, 70, 55, 65].map((height, i) => (
            <div key={i} className="w-1.5 sm:w-2 bg-red-400 rounded-full" style={{ height: `${height}%` }} />
          ))}
        </div>

        {/* Valor principal y unidad */}
        <div className="flex items-baseline gap-2">
          <span className="text-2xl sm:text-3xl font-bold text-gray-900">9800</span>
          <span className="text-xs sm:text-sm text-gray-500">uL</span>
        </div>
      </Card>

      {/* Tarjeta de Hidratación */}
      <Card className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl shadow-sm border-0 sm:col-span-2 lg:col-span-1">
        {/* Encabezado con título e icono */}
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <span className="text-xs sm:text-sm text-gray-600">Hidratación</span>
          <Droplet className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-500" />
        </div>

        {/* Barra de progreso horizontal */}
        <div className="mb-3 sm:mb-4 flex items-center h-12 sm:h-16">
          <div className="w-full bg-gray-100 rounded-full h-2.5 sm:h-3">
            {/* Barra de progreso rellena al 89% */}
            <div
              className="bg-gradient-to-r from-cyan-400 to-cyan-500 h-2.5 sm:h-3 rounded-full"
              style={{ width: "89%" }}
            />
          </div>
        </div>

        {/* Valor principal y descripción */}
        <div className="flex items-baseline gap-2">
          <span className="text-2xl sm:text-3xl font-bold text-gray-900">89%</span>
          <span className="text-xs sm:text-sm text-gray-500">1.78/2 litros</span>
        </div>
      </Card>
    </div>
  )
}
