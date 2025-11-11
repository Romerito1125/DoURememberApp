"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Header from "@/app/components/header"
import Footer from "@/app/components/footer"
import { ArrowLeft, FileText, Calendar, User, CheckCircle, Clock, AlertCircle } from "lucide-react"

interface BaselineReport {
  id: string
  patientId: string
  patientName: string
  sessionDate: string
  generatedDate: string
  status: "completed" | "pending" | "error"
  indicators: {
    memoryScore: number
    narrativeCoherence: number
    omissions: number
    memoryErrors: number
  }
  photosDescribed: number
  totalPhotos: number
}

export default function BaselineReportsPage() {
  const router = useRouter()
  const [reports, setReports] = useState<BaselineReport[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadReports()
  }, [])

  const loadReports = () => {
    setIsLoading(true)
    try {
      const stored = localStorage.getItem("baselineReports")
      if (stored) {
        const parsedReports = JSON.parse(stored)
        // Ordenar por fecha más reciente primero
        parsedReports.sort((a: BaselineReport, b: BaselineReport) => 
          new Date(b.generatedDate).getTime() - new Date(a.generatedDate).getTime()
        )
        setReports(parsedReports)
      }
    } catch (error) {
      console.error("Error al cargar reportes:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-5 h-5 text-green-600" />
      case "pending":
        return <Clock className="w-5 h-5 text-amber-600" />
      case "error":
        return <AlertCircle className="w-5 h-5 text-red-600" />
      default:
        return null
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "completed":
        return "Completado"
      case "pending":
        return "Pendiente"
      case "error":
        return "Error"
      default:
        return status
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800 border-green-200"
      case "pending":
        return "bg-amber-100 text-amber-800 border-amber-200"
      case "error":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-600">Cargando reportes...</p>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header />
      
      <main className="flex-1 container mx-auto px-6 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            <button
              onClick={() => router.push("/users/doctor")}
              className="flex items-center gap-2 text-slate-600 hover:text-purple-600 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              Volver al panel
            </button>
          </div>

          {/* Título */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-800 mb-2">
              Reportes de Línea Base
            </h1>
            <p className="text-slate-600">
              Evaluaciones iniciales del estado cognitivo de tus pacientes
            </p>
          </div>

          {/* Lista de reportes */}
          {reports.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
              <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-800 mb-2">
                No hay reportes disponibles
              </h3>
              <p className="text-slate-600 mb-6">
                Los reportes se generan automáticamente cuando un paciente completa su primera sesión
              </p>
              <button
                onClick={() => router.push("/users/doctor")}
                className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Volver al panel
              </button>
            </div>
          ) : (
            <div className="grid gap-4">
              {reports.map((report) => (
                <div
                  key={report.id}
                  className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => router.push(`/reports/baseline/${report.id}`)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                        <FileText className="w-6 h-6 text-purple-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-slate-800">
                          {report.patientName}
                        </h3>
                        <div className="flex items-center gap-4 text-sm text-slate-600 mt-1">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {formatDate(report.sessionDate)}
                          </span>
                          <span className="flex items-center gap-1">
                            <User className="w-4 h-4" />
                            {report.photosDescribed}/{report.totalPhotos} fotos
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className={`flex items-center gap-2 px-3 py-1 rounded-full border ${getStatusColor(report.status)}`}>
                      {getStatusIcon(report.status)}
                      <span className="text-sm font-medium">
                        {getStatusText(report.status)}
                      </span>
                    </div>
                  </div>

                  {report.status === "completed" && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-slate-100">
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Memoria</p>
                        <p className="text-lg font-semibold text-slate-800">
                          {report.indicators.memoryScore}%
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Coherencia</p>
                        <p className="text-lg font-semibold text-slate-800">
                          {report.indicators.narrativeCoherence}%
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Omisiones</p>
                        <p className="text-lg font-semibold text-slate-800">
                          {report.indicators.omissions}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Errores</p>
                        <p className="text-lg font-semibold text-slate-800">
                          {report.indicators.memoryErrors}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}