/**
 * Componente de Barra de Búsqueda
 *
 * Incluye:
 * - Campo de búsqueda con icono
 * - Botón de filtros funcional con opciones
 * - Botón de ordenamiento funcional
 *
 * Es responsive y se adapta a diferentes tamaños de pantalla.
 */

"use client"

import { Search, SlidersHorizontal, ArrowUpDown, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useState } from "react"

type FilterType = "todos" | "cardiologo" | "pediatra" | "dentista" | "neurologo"
type SortType = "fecha" | "nombre" | "especialidad"

interface SearchBarProps {
  onSearch?: (query: string) => void
  onFilter?: (filter: FilterType) => void
  onSort?: (sort: SortType) => void
}

export function SearchBar({ onSearch, onFilter, onSort }: SearchBarProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [showFilters, setShowFilters] = useState(false)
  const [showSort, setShowSort] = useState(false)
  const [activeFilter, setActiveFilter] = useState<FilterType>("todos")
  const [activeSort, setActiveSort] = useState<SortType>("fecha")

  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
    onSearch?.(value)
  }

  const handleFilterSelect = (filter: FilterType) => {
    setActiveFilter(filter)
    onFilter?.(filter)
    setShowFilters(false)
  }

  const handleSortSelect = (sort: SortType) => {
    setActiveSort(sort)
    onSort?.(sort)
    setShowSort(false)
  }

  return (
    <div className="relative">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
        {/* Campo de búsqueda */}
        <div className="relative flex-1 sm:max-w-md">
          {/* Icono de búsqueda posicionado absolutamente */}
          <Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-700" />
          {/* Input de búsqueda con padding para el icono */}
          <Input
            placeholder="Buscar"
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10 sm:pl-11 pr-4 py-4 sm:py-5 rounded-full border-gray-200 bg-white text-sm sm:text-base text-gray-700"
          />
          {searchQuery && (
            <button
              onClick={() => handleSearchChange("")}
              className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Contenedor de botones de filtro y ordenamiento */}
        <div className="flex gap-2 sm:gap-3">
          {/* Botón de Filtros */}
          <div className="relative flex-1 sm:flex-none">
            <Button
              variant="outline"
              onClick={() => {
                setShowFilters(!showFilters)
                setShowSort(false)
              }}
              className={`
                w-full sm:w-auto rounded-full px-4 sm:px-6 border-gray-200 text-sm
                transition-all duration-300
                ${showFilters || activeFilter !== "todos" ? "bg-purple-50 border-purple-200 text-purple-600" : "bg-transparent text-gray-700"}
                hover:bg-purple-50 hover:border-purple-200 hover:text-purple-600
              `}
            >
              <SlidersHorizontal className="w-4 h-4 mr-2" />
              Filtrar
              {activeFilter !== "todos" && <span className="ml-2 w-2 h-2 bg-purple-600 rounded-full" />}
            </Button>

            {showFilters && (
              <div className="absolute top-full mt-2 right-0 sm:left-0 w-48 bg-white rounded-2xl shadow-lg border border-gray-200 p-2 z-10 animate-in fade-in slide-in-from-top-2 duration-200">
                <button
                  onClick={() => handleFilterSelect("todos")}
                  className={`w-full text-left px-4 py-2 rounded-xl text-sm transition-colors text-gray-700  ${
                    activeFilter === "todos" ? "bg-purple-100 text-purple-600 font-medium" : "hover:bg-gray-50"
                  }`}
                >
                  Todos
                </button>
                <button
                  onClick={() => handleFilterSelect("cardiologo")}
                  className={`w-full text-left px-4 py-2 rounded-xl text-sm transition-colors text-gray-700 ${
                    activeFilter === "cardiologo" ? "bg-purple-100 text-purple-600 font-medium" : "hover:bg-gray-50 "
                  }`}
                >
                  Cardiólogo
                </button>
                <button
                  onClick={() => handleFilterSelect("pediatra")}
                  className={`w-full text-left px-4 py-2 rounded-xl text-sm transition-colors text-gray-700 ${
                    activeFilter === "pediatra" ? "bg-purple-100 text-purple-600 font-medium" : "hover:bg-gray-50"
                  }`}
                >
                  Pediatra
                </button>
                <button
                  onClick={() => handleFilterSelect("dentista")}
                  className={`w-full text-left px-4 py-2 rounded-xl text-sm transition-colors text-gray-700 ${
                    activeFilter === "dentista" ? "bg-purple-100 text-purple-600 font-medium" : "hover:bg-gray-50"
                  }`}
                >
                  Dentista
                </button>
                <button
                  onClick={() => handleFilterSelect("neurologo")}
                  className={`w-full text-left px-4 py-2 rounded-xl text-sm transition-colors text-gray-700 ${
                    activeFilter === "neurologo" ? "bg-purple-100 text-purple-600 font-medium" : "hover:bg-gray-50"
                  }`}
                >
                  Neurólogo
                </button>
              </div>
            )}
          </div>

          {/* Botón de Ordenamiento */}
          <div className="relative flex-1 sm:flex-none">
            <Button
              variant="outline"
              onClick={() => {
                setShowSort(!showSort)
                setShowFilters(false)
              }}
              className={`
                w-full sm:w-auto rounded-full px-4 sm:px-6 border-gray-200 text-sm
                transition-all duration-300
                ${showSort ? "bg-purple-50 border-purple-200 text-purple-600" : "bg-transparent text-gray-700"}
                hover:bg-purple-50 hover:border-purple-200 hover:text-purple-600
              `}
            >
              <ArrowUpDown className="w-4 h-4 mr-2" />
              Ordenar
            </Button>

            {showSort && (
              <div className="absolute top-full mt-2 right-0 w-48 bg-white rounded-2xl shadow-lg border border-gray-200 p-2 z-10 animate-in fade-in slide-in-from-top-2 duration-200">
                <button
                  onClick={() => handleSortSelect("fecha")}
                  className={`w-full text-left px-4 py-2 rounded-xl text-sm transition-colors text-gray-700 ${
                    activeSort === "fecha" ? "bg-purple-100 text-purple-600 font-medium" : "hover:bg-gray-50"
                  }`}
                >
                  Por Fecha
                </button>
                <button
                  onClick={() => handleSortSelect("nombre")}
                  className={`w-full text-left px-4 py-2 rounded-xl text-sm transition-colors text-gray-700 ${
                    activeSort === "nombre" ? "bg-purple-100 text-purple-600 font-medium" : "hover:bg-gray-50"
                  }`}
                >
                  Por Nombre
                </button>
                <button
                  onClick={() => handleSortSelect("especialidad")}
                  className={`w-full text-left px-4 py-2 rounded-xl text-sm transition-colors text-gray-700 ${
                    activeSort === "especialidad" ? "bg-purple-100 text-purple-600 font-medium" : "hover:bg-gray-50"
                  }`}
                >
                  Por Especialidad
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {(showFilters || showSort) && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => {
            setShowFilters(false)
            setShowSort(false)
          }}
        />
      )}
    </div>
  )
}
