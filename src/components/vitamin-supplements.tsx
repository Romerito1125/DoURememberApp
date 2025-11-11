/**
 * Componente de Suplementos Vitamínicos
 *
 * Muestra una cuadrícula de suplementos vitamínicos con:
 * - Imagen del suplemento
 * - Número de identificación
 * - Nombre del suplemento
 *
 * Es responsive y se adapta de 2 a 3 columnas según el tamaño de pantalla.
 */

import { ArrowUpRight } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

// Array de datos de suplementos
const supplements = [
  { id: "01", name: "Aceite de Pescado", image: "" },
  { id: "02", name: "Vitamina B", image: "" },
  { id: "03", name: "Energizante", image: "" },
  { id: "04", name: "Refuerzo Sanguíneo", image: "" },
  { id: "05", name: "Medicamento Piel", image: "" },
  { id: "06", name: "Medicamento Huesos", image: "" },
]

export function VitaminSupplements() {
  return (
    <Card className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl shadow-sm border-0">
      {/* Encabezado con título y botón */}
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <div>
          <h3 className="text-base sm:text-lg font-semibold text-gray-900">Tus Suplementos Vitamínicos</h3>
          <p className="text-xs sm:text-sm text-gray-500">¡No olvides tomar tus suplementos vitamínicos diarios hoy!</p>
        </div>
        {/* Botón para ver todos los suplementos */}
        <Button variant="ghost" size="icon" className="rounded-full flex-shrink-0">
          <ArrowUpRight className="w-4 h-4 sm:w-5 sm:h-5" />
        </Button>
      </div>

      {/* Grid de suplementos - 2 columnas en móvil, 3 en tablet+ */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
        {supplements.map((supplement) => (
          <div
            key={supplement.id}
            className="flex flex-col items-center p-3 sm:p-4 bg-gray-50 rounded-xl sm:rounded-2xl hover:bg-gray-100 transition-colors"
          >
            {/* Contenedor de imagen del suplemento */}
            <div className="w-16 h-16 sm:w-20 sm:h-20 mb-2 sm:mb-3 flex items-center justify-center">
              <img src={supplement.image || "/placeholder.svg"} alt="" className="w-full h-full object-contain" />
            </div>
            {/* Número de identificación */}
            <span className="text-xs text-gray-400 mb-1">{supplement.id}</span>
            {/* Nombre del suplemento */}
            <span className="text-xs sm:text-sm font-medium text-gray-900 text-center">{supplement.name}</span>
          </div>
        ))}
      </div>
    </Card>
  )
}
