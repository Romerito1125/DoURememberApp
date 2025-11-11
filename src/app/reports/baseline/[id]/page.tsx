"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import Header from "@/app/components/header"
import Footer from "@/app/components/footer"
import { 
  ArrowLeft, 
  Download, 
  Calendar, 
  FileText,
  CheckCircle,
  Brain,
  MessageSquare,
  AlertTriangle,
  Loader2,
  Eye,
  MessageSquareText, // Añadido para conclusiones
  ClipboardList // Añadido para notas
} from "lucide-react"
// Importamos SessionDetails que es el tipo de dato que devuelve el baseline
import { reportsService, SessionDetails } from "@/services/reports.service" 
import SessionComparisonModal from "@/app/components/reports/SessionComparisonModal"
// Importamos PatientReport para la descarga, ya que la función de descarga lo requiere.
import { PatientReport } from "@/services/reports.service" 

// Renombramos el componente para reflejar que es un reporte de Baseline
export default function BaselineReportDetailPage() {
  const router = useRouter()
  const params = useParams()
  const patientId = params.id as string

  // Cambiamos el tipo de dato del reporte a SessionDetails
  const [report, setReport] = useState<SessionDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  // Eliminamos los estados de las pestañas, ya que solo mostraremos una vista.
  
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null)
  const [isComparisonModalOpen, setIsComparisonModalOpen] = useState(false)

  // Asumo un nombre temporal de paciente para la UI ya que SessionDetails no lo tiene
  const [patientName, setPatientName] = useState<string>("Cargando...")


  useEffect(() => {
    const patientId = params.id as string; // Obtener el ID
    
    // AÑADE ESTE LOG:
    console.log("ID de Baseline en página de detalle:", patientId)
    
    // Y esta validación:
    if (patientId && patientId !== 'undefined' && patientId.length > 5) {
        loadReport()
    } else {
        console.error("⚠️ ID de paciente no disponible o inválido para el Baseline.")
        setIsLoading(false)
    }
}, [params.id])

  const loadReport = async () => {
    setIsLoading(true)
    try {
      // 1. Cargamos el Baseline (SessionDetails)
      const data = await reportsService.getPatientBaseline(patientId)
      setReport(data)
      if (data) {
         try {
            const fullReport = await reportsService.getPatientReport(patientId) 
            setPatientName(fullReport.patientName || `Paciente ID: ${patientId}`)
         } catch (e) {
            setPatientName(`Paciente ID: ${patientId}`)
         }
      }
    } catch (error) {
      console.error("Error al cargar reporte Baseline:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Mantenemos handleViewSession por si queremos ver el detalle completo del baseline
  const handleViewSession = () => {
    if (!report || !report.idSesion) return
    
    // El baseline es la sesión que queremos ver en el modal
    setSelectedSessionId(report.idSesion)
    setIsComparisonModalOpen(true)
  }

  // La función de descarga asume el formato de PatientReport, la dejamos como estaba
  // ya que PatientReport es un reporte más completo que SessionDetails.
  // Solo ajustamos el nombre del paciente para que coincida.
  const handleDownload = async () => {
    if (!report) return

    try {
      // Obtenemos el reporte completo del backend para el formato de descarga
      const backendReport = await reportsService.getPatientReportFromBackend(patientId)
      
      const content = `
REPORTE BASELINE (SESIÓN INICIAL) - DO U REMEMBER
================================================

INFORMACIÓN DEL PACIENTE
------------------------
ID: ${backendReport.idPaciente}
Nombre: ${patientName} 
Fecha de Generación: ${backendReport.fechaGeneracion}

SESIÓN BASELINE (${report.idSesion})
-----------------
Fecha: ${report.fechaCreacion}
Estado: ${report.estado}

MÉTRICAS CLAVE
--------------
- Total: ${(report.sessionTotal * 100).toFixed(2)}%
- Recall: ${(report.sessionRecall * 100).toFixed(2)}%
- Coherencia: ${(report.sessionCoherencia * 100).toFixed(2)}%
- Fluidez: ${(report.sessionFluidez * 100).toFixed(2)}%
- Omisión: ${(report.sessionOmision * 100).toFixed(2)}%
- Comisión: ${(report.sessionComision * 100).toFixed(2)}%

CONCLUSIONES (Automáticas)
--------------------------
Técnica:
${report.conclusionTecnica}

Normal:
${report.conclusionNormal}

NOTAS DEL MÉDICO
----------------
${report.notasMedico || 'No hay notas del médico registradas.'}
${report.fechaRevisionMedico ? `(Revisado el: ${report.fechaRevisionMedico})` : ''}

IMÁGENES Y DESCRIPCIONES (Ejemplo de la sesión inicial)
------------------------------------------------------
${report.IMAGEN.map((img, imgIndex) => `
IMAGEN #${imgIndex + 1}
URL: ${img.urlImagen}
Ground Truth: ${img.GROUNDTRUTH?.texto || 'N/A'}

Descripciones del Paciente:
${img.DESCRIPCION ? 
    `  - [${reportsService.formatDate(img.DESCRIPCION.fecha)}] ${img.DESCRIPCION.texto}` 
    : '  - No hay descripción registrada.'}
`).join('\n')}

---
Generado por Do U Remember
${new Date().toISOString()}
      `

      const blob = new Blob([content], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      // Usamos el nombre de paciente en el nombre del archivo
      a.download = `baseline-reporte-${patientName}-${new Date().toISOString().split('T')[0]}.txt` 
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Error al descargar el reporte Baseline:", error)
      alert("Error al generar el reporte de línea base para descarga")
    }
  }

  // Esta función ya no es necesaria, la quitamos, ya que no hay tendencias de Baseline
  // const getTrendIcon = (trend: string) => { /* ... */ } 


  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-purple-600 animate-spin mx-auto mb-4" />
            <p className="text-slate-600">Cargando reporte de Línea Base...</p>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  if (!report) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto px-6 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="bg-red-50 border border-red-200 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-red-800 mb-2">Línea Base no encontrada</h2>
              <p className="text-red-700 mb-4">No se pudo cargar la sesión de línea base para el paciente ID: {patientId}.</p>
              <button
                onClick={() => router.push("/users/doctor")}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Volver al panel
              </button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  // Utilidad para obtener color de puntaje (mantenemos la lógica de reportsService)
  const getScoreColor = reportsService.getScoreColor
  const getScoreBgColor = reportsService.getScoreBgColor
  const toPercentage = reportsService.toPercentage
  const formatDate = reportsService.formatDate

  return (
    <>
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Header />
        
        <main className="flex-1 container mx-auto px-6 py-8">
          <div className="max-w-6xl mx-auto">
            {/* Header y Botones */}
            <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <button
                onClick={() => router.push("/users/doctor")}
                className="flex items-center gap-2 text-slate-600 hover:text-purple-600 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                Volver al panel
              </button>
              
              <button
                onClick={handleDownload}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Descargar Baseline
              </button>
            </div>

            {/* Información del paciente y sesión */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-2xl font-bold text-slate-800 mb-2">
                    Línea Base - {patientName}
                  </h1>
                  <div className="flex flex-wrap gap-4 text-sm text-slate-600">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      Fecha de Sesión: {formatDate(report.fechaCreacion)}
                    </span>
                    <span className="flex items-center gap-1">
                      <FileText className="w-4 h-4" />
                      ID Sesión: {report.idSesion}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Contenido Único del Baseline */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <div className="space-y-8">
                
                {/* Indicadores Clave */}
                <section>
                    <h2 className="text-xl font-semibold text-slate-800 mb-4 flex items-center gap-2">
                        <Brain className="w-6 h-6 text-purple-600" />
                        Métricas de Rendimiento
                    </h2>
                    
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                        {/* Total */}
                        <div className={`rounded-lg p-4 text-center ${getScoreBgColor(report.sessionTotal)}`}>
                            <p className="text-xs text-slate-600 mb-1 font-medium">Total</p>
                            <p className={`text-2xl font-bold ${getScoreColor(report.sessionTotal)}`}>
                                {toPercentage(report.sessionTotal)}%
                            </p>
                        </div>

                        {/* Recall */}
                        <div className={`rounded-lg p-4 text-center ${getScoreBgColor(report.sessionRecall)}`}>
                            <p className="text-xs text-slate-600 mb-1 font-medium">Recall</p>
                            <p className={`text-2xl font-bold ${getScoreColor(report.sessionRecall)}`}>
                                {toPercentage(report.sessionRecall)}%
                            </p>
                        </div>
                        
                        {/* Coherencia */}
                        <div className={`rounded-lg p-4 text-center ${getScoreBgColor(report.sessionCoherencia)}`}>
                            <p className="text-xs text-slate-600 mb-1 font-medium">Coherencia</p>
                            <p className={`text-2xl font-bold ${getScoreColor(report.sessionCoherencia)}`}>
                                {toPercentage(report.sessionCoherencia)}%
                            </p>
                        </div>

                        {/* Fluidez */}
                        <div className={`rounded-lg p-4 text-center ${getScoreBgColor(report.sessionFluidez)}`}>
                            <p className="text-xs text-slate-600 mb-1 font-medium">Fluidez</p>
                            <p className={`text-2xl font-bold ${getScoreColor(report.sessionFluidez)}`}>
                                {toPercentage(report.sessionFluidez)}%
                            </p>
                        </div>

                        {/* Omisión */}
                        <div className={`rounded-lg p-4 text-center bg-red-50`}>
                            <p className="text-xs text-slate-600 mb-1 font-medium">Omisión</p>
                            <p className={`text-2xl font-bold text-red-600`}>
                                {toPercentage(report.sessionOmision)}%
                            </p>
                        </div>

                        {/* Comisión */}
                        <div className={`rounded-lg p-4 text-center bg-red-50`}>
                            <p className="text-xs text-slate-600 mb-1 font-medium">Comisión</p>
                            <p className={`text-2xl font-bold text-red-600`}>
                                {toPercentage(report.sessionComision)}%
                            </p>
                        </div>
                    </div>
                </section>

                <hr className="border-slate-200" />

                {/* Conclusiones */}
                <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <h3 className="text-lg font-semibold text-slate-800 mb-3 flex items-center gap-2">
                            <MessageSquareText className="w-5 h-5 text-blue-600" />
                            Conclusión Técnica (IA)
                        </h3>
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-slate-700 whitespace-pre-line">
                            {report.conclusionTecnica}
                        </div>
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-slate-800 mb-3 flex items-center gap-2">
                            <MessageSquareText className="w-5 h-5 text-green-600" />
                            Conclusión Normal (IA)
                        </h3>
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-sm text-slate-700 whitespace-pre-line">
                            {report.conclusionNormal}
                        </div>
                    </div>
                </section>

                {/* Notas del Médico */}
                <section>
                    <h3 className="text-lg font-semibold text-slate-800 mb-3 flex items-center gap-2">
                        <ClipboardList className="w-5 h-5 text-purple-600" />
                        Notas del Médico
                    </h3>
                    <div className="bg-slate-100 rounded-lg p-4 text-sm text-slate-700 border border-slate-200">
                        <p className="whitespace-pre-line">{report.notasMedico || 'No hay notas del médico registradas para esta sesión.'}</p>
                        {report.fechaRevisionMedico && (
                            <p className="mt-2 text-xs text-slate-500">
                                Revisado el: {formatDate(report.fechaRevisionMedico)}
                            </p>
                        )}
                    </div>
                </section>

                <hr className="border-slate-200" />

                {/* Detalle de Imágenes - Mostramos la primera imagen como ejemplo */}
                <section>
                  <h2 className="text-xl font-semibold text-slate-800 mb-4 flex items-center gap-2">
                      <Eye className="w-6 h-6 text-orange-600" />
                      Imágenes de la Sesión de Línea Base ({report.IMAGEN.length} imágenes)
                  </h2>
                  
                  {report.IMAGEN.map((image, index) => {

                      // ⭐ CÓDIGO CORREGIDO: Tratamos image.DESCRIPCION como un OBJETO ÚNICO (no un array)
                      // La descripción existe si image.DESCRIPCION no es null/undefined Y si tiene un campo 'texto' no vacío.
                      const patientDescription = image.DESCRIPCION?.texto?.trim()
                          ? image.DESCRIPCION
                          : null;

                      return (
                          <div key={image.idImagen} className="bg-gray-50 rounded-lg p-4 mb-4 border border-gray-200">
                              <h4 className="font-medium text-slate-700 mb-3">Imagen {index + 1}</h4>
                              <div className="flex flex-col md:flex-row gap-4">
                                  {/* Imagen - Muestra solo la URL */}
                                  <div className="md:w-1/3">
                                      <p className="text-xs text-slate-500 mb-1">URL:</p>
                                      <p className="text-sm text-blue-600 break-all cursor-pointer hover:underline" onClick={() => window.open(image.urlImagen, '_blank')}>
                                          {image.urlImagen}
                                      </p>
                                  </div>
                                  
                                  {/* Ground Truth */}
                                  <div className="md:w-1/3">
                                      <p className="text-xs text-slate-500 mb-1">Ground Truth:</p>
                                      <p className="text-sm text-slate-800 italic">
                                          {image.GROUNDTRUTH?.texto || 'No disponible'}
                                      </p>
                                  </div>

                                  {/* Descripción del Paciente */}
                                  <div className="md:w-1/3">
                                      <p className="text-xs text-slate-500 mb-1">Descripción del Paciente:</p>
                                      {patientDescription ? (
                                          <p className="text-sm text-slate-800 whitespace-pre-line">
                                              {/* Accedemos directamente a patientDescription.texto */}
                                              "{patientDescription.texto}" 
                                              <span className="text-xs text-slate-500 block mt-1">({formatDate(patientDescription.fecha)})</span>
                                          </p>
                                      ) : (
                                          <p className="text-sm text-slate-600">No hay descripción registrada.</p>
                                      )}
                                  </div>
                              </div>
                          </div>
                      )
                  })}
              </section>

                {/* Botón para ver el detalle completo (Mantenemos la funcionalidad) */}
                <div className="pt-4 text-center border-t border-slate-200">
                    <button
                        onClick={handleViewSession}
                        className="px-6 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors font-medium flex items-center gap-2 mx-auto"
                    >
                        <Eye className="w-5 h-5" />
                        Ver Detalle Completo de Sesión
                    </button>
                </div>

              </div>
            </div>
            {/* Fin Contenido Único del Baseline */}

          </div>
        </main>

        <Footer />
      </div>

      {/* Modal de Comparación - Se mantiene por si se quiere ver el detalle de la sesión */}
      {selectedSessionId && (
        <SessionComparisonModal
          isOpen={isComparisonModalOpen}
          onClose={() => {
            setIsComparisonModalOpen(false)
            setSelectedSessionId(null)
          }}
          sessionId={selectedSessionId}
          patientName={patientName}
        />
      )}
    </>
  )
}