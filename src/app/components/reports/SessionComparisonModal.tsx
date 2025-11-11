"use client"

import { useState, useEffect } from "react"
import { X, FileText, User, CheckCircle, XCircle, AlertCircle, Loader2, Plus, Trash2 } from "lucide-react"
import { reportsService, DescriptionComparison, SessionDetails } from "@/services/reports.service"

interface SessionComparisonModalProps {
  isOpen: boolean
  onClose: () => void
  sessionId: number
  patientName: string
}

interface DoctorNote {
  id: string
  content: string
  timestamp: Date
}

export default function SessionComparisonModal({ 
  isOpen, 
  onClose, 
  sessionId,
  patientName 
}: SessionComparisonModalProps) {
  const [sessionDetails, setSessionDetails] = useState<SessionDetails | null>(null)
  const [descriptions, setDescriptions] = useState<DescriptionComparison[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeImageIndex, setActiveImageIndex] = useState(0)
  const [doctorNotes, setDoctorNotes] = useState<DoctorNote[]>([])
  const [newNote, setNewNote] = useState("")
  const [isSavingNotes, setIsSavingNotes] = useState(false)

  useEffect(() => {
    if (isOpen && sessionId) {
      loadSessionData()
    }
  }, [isOpen, sessionId])

  const loadSessionData = async () => {
    setIsLoading(true)
    try {
      // Cargar detalles de la sesión con GroundTruth
      const details = await reportsService.getSessionDetails(sessionId)
      console.log("📊 Datos completos de la sesión:", details)
      
      // Debug: Ver estructura de las imágenes
      if (details.IMAGEN && details.IMAGEN.length > 0) {
        console.log("🖼️ Primera imagen:", details.IMAGEN[0])
        console.log("👤 DESCRIPCION:", details.IMAGEN[0].DESCRIPCION)
        console.log("📝 GROUNDTRUTH:", details.IMAGEN[0].GROUNDTRUTH)
      }
      
      setSessionDetails(details)

      // Intentar cargar las notas guardadas como array si existen
      try {
        const savedNotes = details.notasMedico ? JSON.parse(details.notasMedico) : []
        if (Array.isArray(savedNotes)) {
          setDoctorNotes(savedNotes)
        }
      } catch {
        // Si no es un JSON válido, es una nota antigua en texto simple
        if (details.notasMedico) {
          setDoctorNotes([{
            id: Date.now().toString(),
            content: details.notasMedico,
            timestamp: new Date()
          }])
        }
      }

      // Cargar descripciones con puntajes
      const descriptionsData = await reportsService.getSessionDescriptions(sessionId, 1, 10)
      setDescriptions(descriptionsData.data || [])
    } catch (error) {
      console.error("Error al cargar datos de sesión:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddNote = () => {
    if (newNote.trim()) {
      const note: DoctorNote = {
        id: Date.now().toString(),
        content: newNote.trim(),
        timestamp: new Date()
      }
      setDoctorNotes([...doctorNotes, note])
      setNewNote("")
    }
  }

  const handleDeleteNote = (id: string) => {
    setDoctorNotes(doctorNotes.filter(note => note.id !== id))
  }

  const handleSaveNotes = async () => {
    setIsSavingNotes(true)
    try {
      // Guardar las notas como JSON
      const notesJson = JSON.stringify(doctorNotes)
      await reportsService.addDoctorNotes(sessionId, notesJson)
      alert("Notas guardadas exitosamente")
    } catch (error) {
      console.error("Error al guardar notas:", error)
      alert("Error al guardar las notas")
    } finally {
      setIsSavingNotes(false)
    }
  }

  const formatNoteDate = (date: Date) => {
    return new Date(date).toLocaleString('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (!isOpen) return null

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl p-8 max-w-4xl w-full mx-4">
          <div className="flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
            <span className="ml-3 text-gray-700">Cargando datos de la sesión...</span>
          </div>
        </div>
      </div>
    )
  }

  if (!sessionDetails) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl p-8 max-w-4xl w-full mx-4">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Error</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="w-6 h-6" />
            </button>
          </div>
          <p className="text-red-600">No se pudo cargar la información de la sesión</p>
        </div>
      </div>
    )
  }

  const currentImage = sessionDetails.IMAGEN?.[activeImageIndex]
  // ✅ Acceso directo a objetos (igual que en PatientSessionsModal)
  const descripcion = currentImage?.DESCRIPCION
  const groundTruth = currentImage?.GROUNDTRUTH
  const currentDescriptionFull = descriptions.find(d => d.idImagen === currentImage?.idImagen)

  console.log("🎯 Imagen actual:", currentImage)
  console.log("📝 Descripción:", descripcion)
  console.log("✅ GroundTruth:", groundTruth)

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-6xl w-full my-8">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Comparación de Descripciones - {patientName}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Sesión #{sessionId} • {sessionDetails.IMAGEN?.length || 0} imágenes
            </p>
          </div>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Métricas Generales de la Sesión */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="bg-purple-50 rounded-xl p-4">
              <p className="text-xs text-purple-700 font-medium">Total</p>
              <p className="text-2xl font-bold text-purple-900">
                {reportsService.toPercentage(sessionDetails.sessionTotal)}%
              </p>
            </div>
            <div className="bg-blue-50 rounded-xl p-4">
              <p className="text-xs text-blue-700 font-medium">Recall</p>
              <p className="text-2xl font-bold text-blue-900">
                {reportsService.toPercentage(sessionDetails.sessionRecall)}%
              </p>
            </div>
            <div className="bg-green-50 rounded-xl p-4">
              <p className="text-xs text-green-700 font-medium">Coherencia</p>
              <p className="text-2xl font-bold text-green-900">
                {reportsService.toPercentage(sessionDetails.sessionCoherencia)}%
              </p>
            </div>
            <div className="bg-yellow-50 rounded-xl p-4">
              <p className="text-xs text-yellow-700 font-medium">Fluidez</p>
              <p className="text-2xl font-bold text-yellow-900">
                {reportsService.toPercentage(sessionDetails.sessionFluidez)}%
              </p>
            </div>
            <div className="bg-orange-50 rounded-xl p-4">
              <p className="text-xs text-orange-700 font-medium">Omisión</p>
              <p className="text-2xl font-bold text-orange-900">
                {reportsService.toPercentage(sessionDetails.sessionOmision)}%
              </p>
            </div>
            <div className="bg-red-50 rounded-xl p-4">
              <p className="text-xs text-red-700 font-medium">Comisión</p>
              <p className="text-2xl font-bold text-red-900">
                {reportsService.toPercentage(sessionDetails.sessionComision)}%
              </p>
            </div>
          </div>

          {/* Selector de Imágenes */}
          {sessionDetails.IMAGEN && sessionDetails.IMAGEN.length > 0 && (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {sessionDetails.IMAGEN.map((img, index) => (
                <button
                  key={img.idImagen}
                  onClick={() => setActiveImageIndex(index)}
                  className={`flex-shrink-0 relative rounded-xl overflow-hidden border-2 transition-all ${
                    activeImageIndex === index
                      ? "border-purple-600 shadow-lg scale-105"
                      : "border-gray-200 hover:border-purple-300"
                  }`}
                >
                  <img
                    src={img.urlImagen}
                    alt={`Imagen ${index + 1}`}
                    className="w-24 h-24 object-cover"
                  />
                  <div className={`absolute inset-0 ${
                    activeImageIndex === index 
                      ? "bg-purple-600 bg-opacity-20" 
                      : "bg-black bg-opacity-0 hover:bg-opacity-10"
                  }`} />
                  <div className="absolute bottom-1 right-1 bg-white rounded-full px-2 py-0.5 text-xs font-bold">
                    {index + 1}
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Imagen Actual */}
          {currentImage && (
            <div className="bg-gray-50 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <FileText className="w-5 h-5 text-purple-600" />
                <h3 className="text-lg font-bold text-gray-900">
                  Imagen {activeImageIndex + 1} de {sessionDetails.IMAGEN?.length || 0}
                </h3>
              </div>
              
              <div className="mb-6">
                <img
                  src={currentImage.urlImagen}
                  alt="Imagen de la sesión"
                  className="w-full max-h-96 object-contain rounded-xl border border-gray-200"
                />
              </div>

              {/* Comparación de Descripciones */}
              <div className="grid md:grid-cols-2 gap-6">
                {/* GroundTruth (Cuidador) */}
                <div className="bg-blue-50 rounded-xl p-5 border border-blue-200">
                  <div className="flex items-center gap-2 mb-3">
                    <User className="w-5 h-5 text-blue-600" />
                    <h4 className="font-bold text-blue-900">Descripción del Cuidador</h4>
                  </div>
                  {groundTruth ? (
                    <>
                      <p className="text-gray-900 mb-4 text-sm leading-relaxed font-medium">
                        {groundTruth.texto}
                      </p>
                      
                      {groundTruth.palabrasClave && groundTruth.palabrasClave.length > 0 && (
                        <div className="mb-3">
                          <p className="text-xs font-semibold text-blue-800 mb-2">Palabras Clave:</p>
                          <div className="flex flex-wrap gap-2">
                            {groundTruth.palabrasClave.map((palabra, idx) => (
                              <span 
                                key={idx}
                                className="px-2 py-1 bg-blue-100 text-blue-800 rounded-lg text-xs font-medium"
                              >
                                {palabra}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {groundTruth.preguntasGuiaPaciente && groundTruth.preguntasGuiaPaciente.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-blue-800 mb-2">Preguntas Guía:</p>
                          <ul className="space-y-1">
                            {groundTruth.preguntasGuiaPaciente.map((pregunta, idx) => (
                              <li key={idx} className="text-xs text-gray-700 flex items-start gap-2">
                                <span className="text-blue-600 mt-0.5">•</span>
                                <span>{pregunta}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="text-gray-500 text-sm italic">No hay descripción del cuidador disponible</p>
                  )}
                </div>

                {/* Descripción del Paciente */}
                <div className="bg-green-50 rounded-xl p-5 border border-green-200">
                  <div className="flex items-center gap-2 mb-3">
                    <User className="w-5 h-5 text-green-600" />
                    <h4 className="font-bold text-green-900">Descripción del Paciente</h4>
                  </div>
                  {descripcion ? (
                    <>
                      <p className="text-gray-900 text-sm leading-relaxed font-medium mb-3">
                        {descripcion.texto}
                      </p>
                      <p className="text-xs text-gray-500">
                        Respondido el {new Date(descripcion.fecha).toLocaleString('es-ES')}
                      </p>
                    </>
                  ) : (
                    <p className="text-gray-500 text-sm italic">No hay descripción del paciente disponible</p>
                  )}
                </div>
              </div>

              {/* Análisis Detallado */}
              {currentDescriptionFull?.puntaje && (
                <div className="mt-6 bg-white rounded-xl p-5 border border-gray-200">
                  <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-purple-600" />
                    Análisis de la IA
                  </h4>

                  {/* Métricas Individuales */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-600 mb-1">Exactitud</p>
                      <p className="text-lg font-bold text-gray-900">
                        {reportsService.toPercentage(currentDescriptionFull.puntaje.rateExactitud)}%
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-600 mb-1">Omisión</p>
                      <p className="text-lg font-bold text-gray-900">
                        {reportsService.toPercentage(currentDescriptionFull.puntaje.rateOmision)}%
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-600 mb-1">Comisión</p>
                      <p className="text-lg font-bold text-gray-900">
                        {reportsService.toPercentage(currentDescriptionFull.puntaje.rateComision)}%
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-600 mb-1">Coherencia</p>
                      <p className="text-lg font-bold text-gray-900">
                        {reportsService.toPercentage(currentDescriptionFull.puntaje.puntajeCoherencia)}%
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-600 mb-1">Fluidez</p>
                      <p className="text-lg font-bold text-gray-900">
                        {reportsService.toPercentage(currentDescriptionFull.puntaje.puntajeFluidez)}%
                      </p>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
                      <p className="text-xs text-purple-700 mb-1 font-medium">Total</p>
                      <p className="text-lg font-bold text-purple-900">
                        {reportsService.toPercentage(currentDescriptionFull.puntaje.puntajeTotal)}%
                      </p>
                    </div>
                  </div>

                  {/* Aciertos */}
                  {currentDescriptionFull.puntaje.aciertos && currentDescriptionFull.puntaje.aciertos.length > 0 && (
                    <div className="mb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <h5 className="font-semibold text-green-900 text-sm">Aciertos</h5>
                      </div>
                      <ul className="space-y-1 pl-6">
                        {currentDescriptionFull.puntaje.aciertos.map((acierto, idx) => (
                          <li key={idx} className="text-sm text-gray-700 list-disc">
                            {acierto}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Palabras Clave Omitidas */}
                  {currentDescriptionFull.puntaje.palabrasClaveOmitidas && currentDescriptionFull.puntaje.palabrasClaveOmitidas.length > 0 && (
                    <div className="mb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <XCircle className="w-4 h-4 text-red-600" />
                        <h5 className="font-semibold text-red-900 text-sm">Palabras Clave Omitidas</h5>
                      </div>
                      <div className="flex flex-wrap gap-2 pl-6">
                        {currentDescriptionFull.puntaje.palabrasClaveOmitidas.map((palabra, idx) => (
                          <span 
                            key={idx}
                            className="px-2 py-1 bg-red-100 text-red-800 rounded-lg text-xs font-medium"
                          >
                            {palabra}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Detalles Omitidos */}
                  {currentDescriptionFull.puntaje.detallesOmitidos && currentDescriptionFull.puntaje.detallesOmitidos.length > 0 && (
                    <div className="mb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertCircle className="w-4 h-4 text-orange-600" />
                        <h5 className="font-semibold text-orange-900 text-sm">Detalles Omitidos</h5>
                      </div>
                      <ul className="space-y-1 pl-6">
                        {currentDescriptionFull.puntaje.detallesOmitidos.map((detalle, idx) => (
                          <li key={idx} className="text-sm text-gray-700 list-disc">
                            {detalle}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Elementos de Comisión */}
                  {currentDescriptionFull.puntaje.elementosComision && currentDescriptionFull.puntaje.elementosComision.length > 0 && (
                    <div className="mb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <XCircle className="w-4 h-4 text-yellow-600" />
                        <h5 className="font-semibold text-yellow-900 text-sm">Elementos Añadidos (Comisión)</h5>
                      </div>
                      <ul className="space-y-1 pl-6">
                        {currentDescriptionFull.puntaje.elementosComision.map((elemento, idx) => (
                          <li key={idx} className="text-sm text-gray-700 list-disc">
                            {elemento}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Conclusión de la IA */}
                  {currentDescriptionFull.puntaje.conclusion && (
                    <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                      <h5 className="font-semibold text-purple-900 text-sm mb-2">Mensaje para el Paciente</h5>
                      <p className="text-sm text-gray-700 leading-relaxed">
                        {currentDescriptionFull.puntaje.conclusion}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Conclusiones de la Sesión */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-purple-50 rounded-xl p-5 border border-purple-200">
              <h4 className="font-bold text-purple-900 mb-3 flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Conclusión Técnica
              </h4>
              <p className="text-sm text-gray-700 leading-relaxed">
                {sessionDetails.conclusionTecnica || "No disponible"}
              </p>
            </div>

            <div className="bg-blue-50 rounded-xl p-5 border border-blue-200">
              <h4 className="font-bold text-blue-900 mb-3 flex items-center gap-2">
                <User className="w-5 h-5" />
                Conclusión para Cuidador
              </h4>
              <p className="text-sm text-gray-700 leading-relaxed">
                {sessionDetails.conclusionNormal || "No disponible"}
              </p>
            </div>
          </div>

          {/* Notas del Médico - Sistema Mejorado */}
          <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-2xl p-6 border-2 border-yellow-200">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-bold text-yellow-900 text-lg flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Notas del Médico
              </h4>
              {sessionDetails.fechaRevisionMedico && (
                <p className="text-xs text-gray-600">
                  Última revisión: {reportsService.formatDate(sessionDetails.fechaRevisionMedico)}
                </p>
              )}
            </div>

            {/* Lista de Notas Existentes */}
            {doctorNotes.length > 0 && (
              <div className="space-y-3 mb-4">
                {doctorNotes.map((note) => (
                  <div 
                    key={note.id} 
                    className="bg-white rounded-xl p-4 border border-yellow-200 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <p className="text-sm text-gray-900 leading-relaxed mb-2">
                          {note.content}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatNoteDate(note.timestamp)}
                        </p>
                      </div>
                      <button
                        onClick={() => handleDeleteNote(note.id)}
                        className="text-red-400 hover:text-red-600 transition-colors flex-shrink-0"
                        title="Eliminar nota"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Formulario para Nueva Nota */}
            <div className="bg-white rounded-xl p-4 border-2 border-yellow-300">
              <label className="text-sm font-semibold text-yellow-900 mb-2 block">
                Agregar nueva nota:
              </label>
              <textarea
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                className="w-full h-24 px-4 py-3 border border-yellow-300 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-transparent resize-none text-sm text-gray-900 bg-white mb-3"
                placeholder="Escriba sus observaciones sobre esta sesión..."
              />
              <button
                onClick={handleAddNote}
                disabled={!newNote.trim()}
                className="w-full px-4 py-2 bg-yellow-500 text-white rounded-xl hover:bg-yellow-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Agregar Nota
              </button>
            </div>

            {doctorNotes.length === 0 && (
              <p className="text-sm text-gray-500 italic text-center mt-4">
                No hay notas médicas registradas para esta sesión
              </p>
            )}
          </div>

          {/* Botones de Acción */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium"
            >
              Cerrar
            </button>
            <button
              onClick={handleSaveNotes}
              disabled={isSavingNotes || doctorNotes.length === 0}
              className="px-6 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSavingNotes ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4" />
                  Guardar Todas las Notas
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}