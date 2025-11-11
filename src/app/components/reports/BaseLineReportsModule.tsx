"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { 
  FileText, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Eye,
  Download,
  Loader2,
  AlertCircle
} from "lucide-react"
import { reportsService, PatientReport } from "@/services/reports.service"
import SessionComparisonModal from "./SessionComparisonModal"

export default function BaselineReportsModule() {
  const router = useRouter()
  const [reports, setReports] = useState<PatientReport[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedReport, setSelectedReport] = useState<PatientReport | null>(null)
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null)
  const [isComparisonModalOpen, setIsComparisonModalOpen] = useState(false)

  useEffect(() => {
    loadReports()
  }, [])

  const loadReports = async () => {
    setIsLoading(true)
    try {
      const data = await reportsService.getAllPatientsWithReports()
      setReports(data)
    } catch (error) {
      console.error("Error al cargar reportes:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // En BaselineReportsModule.tsx (alrededor de la línea 40)

    // Función auxiliar para una validación simple de UUID (si es posible)
    // Esto es una simplificación, pero detectará valores nulos o cortos.
    const isValidUUIDFormat = (id: string) => {
        // Un UUID típico tiene 36 caracteres (incluyendo guiones)
        if (!id || id.length !== 36) return false; 
        // Podrías añadir un regex más estricto si lo necesitas
        return true; 
    }

    const handleViewDetails = (patientId: string) => {
        // 1. Log para debugging
        console.log("Intentando navegar a Baseline con ID:", patientId)

        // 2. Validación (opcional pero muy recomendable)
        if (!isValidUUIDFormat(patientId)) {
            console.error("⛔️ Error: ID del paciente no tiene formato UUID. Navegación abortada.", patientId)
            alert("El ID del paciente no es válido para ver el reporte de Línea Base.")
            return; 
        }

        // Si el ID es válido, navega
        router.push(`/reports/baseline/${patientId}`)
    }

  const handleViewSession = async (report: PatientReport, sessionIndex: number) => {
    try {
      // Obtener las sesiones completas del paciente
      const sessions = await reportsService.getPatientSessions(report.patientId)
      
      if (sessions[sessionIndex] && sessions[sessionIndex].idSesion) {
        setSelectedReport(report)
        setSelectedSessionId(sessions[sessionIndex].idSesion)
        setIsComparisonModalOpen(true)
      } else {
        alert("No se pudo encontrar el ID de la sesión")
      }
    } catch (error) {
      console.error("Error al abrir sesión:", error)
      alert("Error al cargar los detalles de la sesión")
    }
  }

  const handleDownloadReport = async (patientId: string, patientName: string) => {
    try {
      const report = await reportsService.getPatientReportFromBackend(patientId)
      
      const content = `
REPORTE GENERADO POR EL SISTEMA
=================================

INFORMACIÓN DEL PACIENTE
------------------------
ID: ${report.idPaciente}
Fecha de Generación: ${report.fechaGeneracion}

PERÍODO
-------
Inicio: ${report.periodo.inicio}
Fin: ${report.periodo.fin}
Total de Sesiones: ${report.periodo.totalSesiones}

ESTADÍSTICAS
------------
${Object.entries(report.estadisticas).map(([key, values]: [string, any]) => `
${key.toUpperCase()}:
  - Promedio: ${values.promedio?.toFixed(4) || 'N/A'}
  - Mínimo: ${values.minimo?.toFixed(4) || 'N/A'}
  - Máximo: ${values.maximo?.toFixed(4) || 'N/A'}
`).join('\n')}

TENDENCIAS
----------
${report.tendencias.disponible ? `
Comparación:
  - Primera sesión: ${report.tendencias.comparacion.primera.numero} (${report.tendencias.comparacion.primera.fecha})
  - Última sesión: ${report.tendencias.comparacion.ultima.numero} (${report.tendencias.comparacion.ultima.fecha})

Cambios:
${Object.entries(report.tendencias.cambios).map(([key, cambio]: [string, any]) => `
  ${key}:
    - Absoluto: ${cambio.absoluto}
    - Porcentual: ${cambio.porcentual ? cambio.porcentual + '%' : 'N/A'}
    - Dirección: ${cambio.direccion}
`).join('\n')}
` : report.tendencias.mensaje}

SESIONES DETALLADAS
-------------------
${report.sesiones.map((s: any) => `
Sesión ${s.numero}
Fecha: ${s.fecha}
Métricas:
  - Total: ${s.metricas.total}
  - Recall: ${s.metricas.recall}
  - Coherencia: ${s.metricas.coherencia}
  - Fluidez: ${s.metricas.fluidez}
  - Omisión: ${s.metricas.omision}
  - Comisión: ${s.metricas.comision}
`).join('\n')}

RESUMEN CLÍNICO
---------------
Interpretación:
${report.resumenClinico.interpretacion.map((i: string) => `  - ${i}`).join('\n')}

Recomendaciones:
${report.resumenClinico.recomendaciones.map((r: string) => `  - ${r}`).join('\n')}

---
Generado por Do U Remember
${new Date().toISOString()}
      `

      const blob = new Blob([content], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `reporte-completo-${patientName}-${new Date().toISOString().split('T')[0]}.txt`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Error al descargar reporte:", error)
      alert("Error al generar el reporte completo")
    }
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "improving":
        return <TrendingUp className="w-5 h-5 text-green-600" />
      case "declining":
        return <TrendingDown className="w-5 h-5 text-red-600" />
      default:
        return <Minus className="w-5 h-5 text-gray-600" />
    }
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-3xl shadow-sm p-8">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-purple-600 animate-spin mr-3" />
          <span className="text-gray-700">Cargando reportes...</span>
        </div>
      </div>
    )
  }

  if (reports.length === 0) {
    return (
      <div className="bg-white rounded-3xl shadow-sm p-8">
        <div className="text-center py-12">
          <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            No hay reportes disponibles
          </h3>
          <p className="text-gray-600">
            No se encontraron pacientes con sesiones completadas
          </p>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="bg-white rounded-3xl shadow-sm p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Reportes de Línea Base</h2>
          <p className="text-gray-600 mt-1">
            {reports.length} {reports.length === 1 ? 'paciente' : 'pacientes'} con sesiones completadas
          </p>
        </div>

        <div className="space-y-4">
          {reports.map((report) => (
            <div
              key={report.patientId}
              className="border border-gray-200 rounded-2xl p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {report.patientName}
                  </h3>
                  <div className="flex flex-wrap gap-3 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <FileText className="w-4 h-4" />
                      {report.summary.count} {report.summary.count === 1 ? 'sesión' : 'sesiones'}
                    </span>
                    <span className="flex items-center gap-1">
                      {getTrendIcon(report.summary.trend_sessionTotal)}
                      {reportsService.getTrendText(report.summary.trend_sessionTotal)}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleDownloadReport(report.patientId, report.patientName)}
                    className="px-4 py-2 bg-blue-100 text-blue-700 rounded-xl hover:bg-blue-200 transition-colors font-medium text-sm flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Descargar
                  </button>
                  <button
                    onClick={() => handleViewDetails(report.patientId)}
                    className="px-4 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors font-medium text-sm flex items-center gap-2"
                  >
                    <Eye className="w-4 h-4" />
                    Ver Detalles
                  </button>
                </div>
              </div>

              {/* Métricas Principales */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className={`rounded-xl p-4 ${reportsService.getScoreBgColor(report.summary.avgSessionTotal)}`}>
                  <p className="text-xs text-gray-600 mb-1">Promedio Total</p>
                  <p className={`text-2xl font-bold ${reportsService.getScoreColor(report.summary.avgSessionTotal)}`}>
                    {reportsService.toPercentage(report.summary.avgSessionTotal)}%
                  </p>
                </div>

                <div className={`rounded-xl p-4 ${reportsService.getScoreBgColor(report.summary.avgRecall)}`}>
                  <p className="text-xs text-gray-600 mb-1">Promedio Recall</p>
                  <p className={`text-2xl font-bold ${reportsService.getScoreColor(report.summary.avgRecall)}`}>
                    {reportsService.toPercentage(report.summary.avgRecall)}%
                  </p>
                </div>

                <div className="bg-blue-50 rounded-xl p-4">
                  <p className="text-xs text-gray-600 mb-1">Primera Sesión</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {reportsService.toPercentage(report.summary.firstSessionTotal)}%
                  </p>
                </div>

                <div className="bg-purple-50 rounded-xl p-4">
                  <p className="text-xs text-gray-600 mb-1">Última Sesión</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {reportsService.toPercentage(report.summary.lastSessionTotal)}%
                  </p>
                </div>
              </div>

              {/* Lista de Sesiones */}
              <div className="border-t border-gray-200 pt-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Sesiones Completadas:</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {report.sessions.map((session, index) => (
                    <button
                      key={index}
                      onClick={() => handleViewSession(report, index)}
                      className="bg-gray-50 hover:bg-gray-100 rounded-xl p-3 text-left transition-colors border border-gray-200 hover:border-purple-300"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold text-gray-900">
                          Sesión {index + 1}
                        </span>
                        <Eye className="w-4 h-4 text-purple-600" />
                      </div>
                      <p className="text-xs text-gray-600 mb-2">
                        {reportsService.formatDate(session.fechaInicio || session.fechaCreacion)}
                      </p>
                      <div className="flex items-center gap-2">
                        <div className={`flex-1 h-2 rounded-full ${reportsService.getScoreBgColor(session.sessionTotal)}`}>
                          <div
                            className={`h-full rounded-full ${
                              session.sessionTotal >= 0.75 ? 'bg-green-600' :
                              session.sessionTotal >= 0.45 ? 'bg-yellow-600' :
                              'bg-red-600'
                            }`}
                            style={{ width: `${session.sessionTotal * 100}%` }}
                          />
                        </div>
                        <span className={`text-xs font-bold ${reportsService.getScoreColor(session.sessionTotal)}`}>
                          {reportsService.toPercentage(session.sessionTotal)}%
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal de Comparación */}
      {selectedReport && selectedSessionId && (
        <SessionComparisonModal
          isOpen={isComparisonModalOpen}
          onClose={() => {
            setIsComparisonModalOpen(false)
            setSelectedReport(null)
            setSelectedSessionId(null)
          }}
          sessionId={selectedSessionId}
          patientName={selectedReport.patientName}
        />
      )}
    </>
  )
}