"use client"

import React, { useState, useEffect } from "react"
import { X, FileText, Calendar, Brain, AlertCircle, CheckCircle, Eye, Target, MessageSquare } from "lucide-react"
import { Button } from "@/components/ui/button"
import { createClient } from "@/utils/supabase/client"

interface Descripcion {
  texto: string
  fecha: string
}

interface GroundTruth {
  idGroundtruth: number
  texto: string
  fecha: string
  palabrasClave: string[]
  preguntasGuiaPaciente: string[]
}

interface Imagen {
  idImagen: number
  idCuidador: string
  urlImagen: string
  fechaSubida: string
  DESCRIPCION: Descripcion  // Ahora es objeto, no array
  GROUNDTRUTH: GroundTruth  // Ahora es objeto, no array
}

interface Sesion {
  idSesion: number
  estado: string
  fechaCreacion: string
  sessionTotal: number
  sessionRecall: number
  sessionCoherencia: number
  sessionFluidez: number
  sessionComision: number
  sessionOmision: number
  conclusionTecnica: string
  conclusionNormal: string
  notasMedico: string
  fechaRevisionMedico: string | null
  IMAGEN: Imagen[]
}

interface PatientSessionsModalProps {
  isOpen: boolean
  onClose: () => void
  patientId: string
  patientName: string
}

export function PatientSessionsModal({ isOpen, onClose, patientId, patientName }: PatientSessionsModalProps) {
  const [sessions, setSessions] = useState<Sesion[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedSession, setSelectedSession] = useState<Sesion | null>(null)
  const [totalSessions, setTotalSessions] = useState(0)

  useEffect(() => {
    if (isOpen && patientId) {
      loadSessions()
    }
  }, [isOpen, patientId])

  const loadSessions = async () => {
    setIsLoading(true)
    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.access_token) {
        throw new Error('No se encontró token de autenticación')
      }

      const token = session.access_token

      // Usar el endpoint listarSesionesGt con paginación alta para obtener todas
      const response = await fetch(
        `http://api.devcorebits.com/api/descripciones-imagenes/listarSesionesGt?idPaciente=${patientId}&estado_sesion=completado&page=1&limit=100`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      )

      if (!response.ok) {
        throw new Error('Error al cargar sesiones')
      }

      const result = await response.json()
      
      setSessions(result.data || [])
      setTotalSessions(result.meta?.total || 0)
    } catch (error) {
      console.error('Error al cargar sesiones:', error)
      alert('Error al cargar las sesiones del paciente')
    } finally {
      setIsLoading(false)
    }
  }

  const getPuntajeColor = (puntaje: number) => {
    if (puntaje >= 0.75) return 'text-green-600 bg-green-50'
    if (puntaje >= 0.45) return 'text-amber-600 bg-amber-50'
    return 'text-red-600 bg-red-50'
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-xl">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-200 bg-gradient-to-r from-purple-50 to-blue-50">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                <FileText className="w-6 h-6 text-purple-600" />
                Sesiones Completadas
              </h2>
              <p className="text-slate-600 mt-1">Paciente: <strong>{patientName}</strong></p>
              {!isLoading && (
                <p className="text-sm text-slate-500 mt-1">
                  Total: <strong>{totalSessions}</strong> {totalSessions === 1 ? 'sesión' : 'sesiones'}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white rounded-full transition-colors"
            >
              <X className="w-6 h-6 text-slate-600" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-slate-600">Cargando sesiones...</p>
            </div>
          ) : sessions.length === 0 ? (
            <div className="text-center py-12">
              <AlertCircle className="w-16 h-16 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-600 text-lg">No hay sesiones completadas aún</p>
            </div>
          ) : selectedSession ? (
            // Vista detallada de sesión
            <div className="space-y-6">
              <button
                onClick={() => setSelectedSession(null)}
                className="text-purple-600 hover:text-purple-700 font-medium flex items-center gap-2"
              >
                ← Volver a la lista
              </button>

              {/* Header de sesión */}
              <div className="bg-white border-2 border-slate-200 rounded-xl p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-2xl font-bold text-slate-800 mb-2">
                      Sesión #{selectedSession.idSesion}
                    </h3>
                    <p className="text-sm text-slate-500">
                      {new Date(selectedSession.fechaCreacion).toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                  <div className={`px-4 py-2 rounded-full text-sm font-medium ${getPuntajeColor(selectedSession.sessionTotal)}`}>
                    Puntaje Total: {Math.round(selectedSession.sessionTotal * 100)}%
                  </div>
                </div>

                {/* Métricas */}
                <div className="grid grid-cols-5 gap-3">
                  <div className="bg-blue-50 rounded-lg p-3 text-center">
                    <p className="text-xl font-bold text-blue-600">
                      {Math.round(selectedSession.sessionRecall * 100)}%
                    </p>
                    <p className="text-xs text-slate-600">Exactitud</p>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-3 text-center">
                    <p className="text-xl font-bold text-purple-600">
                      {Math.round(selectedSession.sessionCoherencia * 100)}%
                    </p>
                    <p className="text-xs text-slate-600">Coherencia</p>
                  </div>
                  <div className="bg-indigo-50 rounded-lg p-3 text-center">
                    <p className="text-xl font-bold text-indigo-600">
                      {Math.round(selectedSession.sessionFluidez * 100)}%
                    </p>
                    <p className="text-xs text-slate-600">Fluidez</p>
                  </div>
                  <div className="bg-amber-50 rounded-lg p-3 text-center">
                    <p className="text-xl font-bold text-amber-600">
                      {Math.round(selectedSession.sessionOmision * 100)}%
                    </p>
                    <p className="text-xs text-slate-600">Omisión</p>
                  </div>
                  <div className="bg-red-50 rounded-lg p-3 text-center">
                    <p className="text-xl font-bold text-red-600">
                      {Math.round(selectedSession.sessionComision * 100)}%
                    </p>
                    <p className="text-xs text-slate-600">Comisión</p>
                  </div>
                </div>
              </div>

              {/* Notas del médico */}
              {selectedSession.notasMedico && selectedSession.notasMedico !== "No hay notas aún" && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                  <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                    <Brain className="w-5 h-5" />
                    Notas del Médico
                  </h4>
                  <p className="text-slate-700 whitespace-pre-wrap">{selectedSession.notasMedico}</p>
                  {selectedSession.fechaRevisionMedico && (
                    <p className="text-xs text-slate-500 mt-2">
                      Revisado el {new Date(selectedSession.fechaRevisionMedico).toLocaleString('es-ES')}
                    </p>
                  )}
                </div>
              )}

              {/* Conclusión */}
              {selectedSession.conclusionNormal && selectedSession.conclusionNormal !== "No se ha proporcionado todavía" && (
                <div className="bg-purple-50 border border-purple-200 rounded-xl p-6">
                  <h4 className="font-semibold text-purple-900 mb-2">Conclusión de la Sesión:</h4>
                  <p className="text-slate-700 leading-relaxed">{selectedSession.conclusionNormal}</p>
                </div>
              )}

              {/* Respuestas del paciente */}
              <div className="space-y-4">
                <h4 className="text-xl font-bold text-slate-800">Respuestas del Paciente</h4>
                {selectedSession.IMAGEN && selectedSession.IMAGEN.length > 0 ? (
                  selectedSession.IMAGEN.map((imagen, idx) => {
                    // ✅ Acceso directo a objetos, ya no son arrays
                    const descripcion = imagen.DESCRIPCION
                    const groundTruth = imagen.GROUNDTRUTH
                    
                    return (
                      <div key={imagen.idImagen} className="bg-white border-2 border-slate-200 rounded-xl p-6 space-y-4">
                        <div className="flex gap-6">
                          <img
                            src={imagen.urlImagen}
                            alt={`Imagen ${idx + 1}`}
                            className="w-48 h-48 object-cover rounded-lg shadow-md flex-shrink-0"
                          />
                          <div className="flex-1 space-y-4">
                            <h5 className="text-lg font-bold text-slate-800">
                              Imagen {idx + 1}
                            </h5>

                            {/* Ground Truth */}
                            {groundTruth && (
                              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <h6 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                                  <Target className="w-4 h-4" />
                                  Descripción de Referencia:
                                </h6>
                                <p className="text-slate-700 text-sm mb-3">{groundTruth.texto}</p>
                                
                                {groundTruth.palabrasClave && groundTruth.palabrasClave.length > 0 && (
                                  <div className="mb-3">
                                    <p className="text-xs text-slate-600 mb-1 font-medium">Palabras clave:</p>
                                    <div className="flex flex-wrap gap-1">
                                      {groundTruth.palabrasClave.map((palabra, pIdx) => (
                                        <span key={pIdx} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                                          {palabra}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {groundTruth.preguntasGuiaPaciente && groundTruth.preguntasGuiaPaciente.length > 0 && (
                                  <div>
                                    <p className="text-xs text-slate-600 mb-2 font-medium">Preguntas guía usadas:</p>
                                    <ul className="space-y-1">
                                      {groundTruth.preguntasGuiaPaciente.map((pregunta, pIdx) => (
                                        <li key={pIdx} className="text-xs text-slate-600 flex items-start gap-2">
                                          <span className="text-blue-600 font-bold">{pIdx + 1}.</span>
                                          <span>{pregunta}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Descripción del Paciente */}
                            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                              <h6 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
                                <MessageSquare className="w-4 h-4" />
                                Descripción del Paciente:
                              </h6>
                              {descripcion ? (
                                <>
                                  <p className="text-slate-700 leading-relaxed mb-2">{descripcion.texto}</p>
                                  <p className="text-xs text-slate-500">
                                    Respondido el {new Date(descripcion.fecha).toLocaleString('es-ES')}
                                  </p>
                                </>
                              ) : (
                                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                                  <p className="text-amber-800 text-sm">Sin respuesta del paciente</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })
                ) : (
                  <div className="text-center py-8">
                    <AlertCircle className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                    <p className="text-slate-600">No hay imágenes en esta sesión</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            // Lista de sesiones
            <div className="grid gap-4">
              {sessions.map((session) => (
                <div
                  key={session.idSesion}
                  className="bg-white border-2 border-slate-200 rounded-xl p-6 hover:border-purple-300 transition-all cursor-pointer"
                  onClick={() => setSelectedSession(session)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold text-slate-800">
                          Sesión #{session.idSesion}
                        </h3>
                        <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                          Completada
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-slate-600 mb-4">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {new Date(session.fechaCreacion).toLocaleDateString('es-ES')}
                        </span>
                        <span className="flex items-center gap-1">
                          <FileText className="w-4 h-4" />
                          {session.IMAGEN?.length || 0} imágenes
                        </span>
                      </div>

                      <div className="flex gap-2 flex-wrap">
                        {[
                          { label: 'Exactitud', value: session.sessionRecall, color: 'blue' },
                          { label: 'Coherencia', value: session.sessionCoherencia, color: 'purple' },
                          { label: 'Fluidez', value: session.sessionFluidez, color: 'indigo' },
                        ].map((metric) => (
                          <div key={metric.label} className={`bg-${metric.color}-50 rounded-lg px-3 py-2`}>
                            <p className={`text-sm font-bold text-${metric.color}-600`}>
                              {Math.round(metric.value * 100)}%
                            </p>
                            <p className="text-xs text-slate-600">{metric.label}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-3">
                      <div className={`px-4 py-2 rounded-lg text-sm font-bold ${getPuntajeColor(session.sessionTotal)}`}>
                        {Math.round(session.sessionTotal * 100)}%
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="border-purple-300 text-purple-600 hover:bg-purple-50"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Ver Detalles
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}