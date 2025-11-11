/**
 * Componente de Últimas Citas
 *
 * Muestra una lista de las últimas citas médicas con:
 * - Avatar del doctor
 * - Nombre del doctor
 * - Especialidad
 * - Fecha de la cita
 * - Botón para ver detalles
 */

"use client"

import { ArrowUpRight } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { useMemo } from "react"

interface LatestAppointmentsProps {
  searchQuery?: string
  filterType?: "todos" | "cardiologo" | "pediatra" | "dentista" | "neurologo"
  sortType?: "fecha" | "nombre" | "especialidad"
}

// Array de datos de citas médicas
const appointments = [
  {
    name: "Dr. Asmira Amri",
    specialty: "Cardiólogo",
    date: "18 Nov 2024",
    dateSort: new Date("2024-11-18"),
    image: "",
  },
  {
    name: "Dra. Casandra",
    specialty: "Pediatra",
    date: "2 Nov 2024",
    dateSort: new Date("2024-11-02"),
    image: "",
  },
  {
    name: "Dr. Imannuel John",
    specialty: "Médico General",
    date: "13 Oct 2024",
    dateSort: new Date("2024-10-13"),
    image: "",
  },
  {
    name: "Dr. Hugo Olafson",
    specialty: "Neurólogo",
    date: "11 Ago 2024",
    dateSort: new Date("2024-08-11"),
    image: "",
  },
]

export function LatestAppointments({
  searchQuery = "",
  filterType = "todos",
  sortType = "fecha",
}: LatestAppointmentsProps) {
  const filteredAndSortedAppointments = useMemo(() => {
    let result = [...appointments]

    // Filtrar por búsqueda
    if (searchQuery) {
      result = result.filter(
        (apt) =>
          apt.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          apt.specialty.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    }

    // Filtrar por especialidad
    if (filterType !== "todos") {
      result = result.filter((apt) => apt.specialty.toLowerCase() === filterType.toLowerCase())
    }

    // Ordenar
    result.sort((a, b) => {
      switch (sortType) {
        case "nombre":
          return a.name.localeCompare(b.name)
        case "especialidad":
          return a.specialty.localeCompare(b.specialty)
        case "fecha":
        default:
          return b.dateSort.getTime() - a.dateSort.getTime()
      }
    })

    return result
  }, [searchQuery, filterType, sortType])

  return (
    <Card className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl shadow-sm border-0">
      {/* Encabezado con título y botón */}
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <div>
          <h3 className="text-base sm:text-lg font-semibold text-gray-900">Últimas Citas</h3>
          <p className="text-xs sm:text-sm text-gray-500">Mantente actualizado sobre tus últimas visitas médicas.</p>
        </div>
        {/* Botón para ver todas las citas */}
        <Button variant="ghost" size="icon" className="rounded-full flex-shrink-0">
          <ArrowUpRight className="w-4 h-4 sm:w-5 sm:h-5" />
        </Button>
      </div>

      {filteredAndSortedAppointments.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500 text-sm">No se encontraron citas que coincidan con los filtros.</p>
        </div>
      ) : (
        // Lista de citas
        <div className="space-y-3 sm:space-y-4">
          {filteredAndSortedAppointments.map((appointment, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-2 sm:p-3 hover:bg-gray-50 rounded-xl sm:rounded-2xl transition-colors"
            >
              {/* Información del doctor */}
              <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                {/* Avatar del doctor */}
                <Avatar className="w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0">
                  <AvatarImage src={appointment.image || "/placeholder.svg"} alt="" />
                  <AvatarFallback>{appointment.name.split(" ")[1][0]}</AvatarFallback>
                </Avatar>
                {/* Nombre, especialidad y fecha */}
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-gray-900 text-sm sm:text-base truncate">{appointment.name}</p>
                  <p className="text-xs sm:text-sm text-gray-500 truncate">
                    {appointment.specialty} • {appointment.date}
                  </p>
                </div>
              </div>
              {/* Botón para ver detalles */}
              <Button variant="ghost" size="icon" className="rounded-full flex-shrink-0">
                <ArrowUpRight className="w-3 h-3 sm:w-4 sm:h-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}
