"use client"

import { useState, useEffect } from "react"
import { X, CheckCircle, AlertCircle } from "lucide-react"
import { createClient } from "@/utils/supabase/client"

const API_URL = 'http://localhost:3000/api'

interface SessionDetailsProps {
  patientId: string
  patientName: string
  onClose: () => void
}

interface SessionWithDetails {
  idSesion: number
  fechaCreacion: string
  estado: string
  descripciones: Array<{
    idDescripcion: number
    texto: string
    idImagen: number
    groundTruth?: {
      texto: string
      palabrasClave: string[]
    }
    imagen: {
      urlImagen: string
    }
    puntajes?: {
      recall: number
      coherencia: number
      fluidez: number
    }
  }>
}

export function PatientSessionDetails({ patientId, patientName, onClose }: SessionDetailsProps) {
  const [sessions, setSessions] = useState<SessionWithDetails[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadSessionDetails()
  }, [patientId])

  const loadSessionDetails = async () => {
  try {
    // ✅ VALIDACIÓN ADICIONAL al inicio
    if (!patientId || patientId === 'undefined' || patientId === 'null') {
      console.error('❌ ID de paciente inválido:', patientId)
      setSessions([])
      return
    }

    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session?.access_token) {
      throw new Error('No hay sesión activa')
    }

    const token = session.access_token

    console.log('🔍 Buscando sesiones para paciente:', patientId)

    // ... resto del código igual
  } catch (error) {
    console.error('Error al cargar detalles:', error)
  } finally {
    setIsLoading(false)
  }
}

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    } catch {
      return dateString
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-6 py-5 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-white">{patientName}</h2>
            <p className="text-purple-100 text-sm">Sesiones completadas y respuestas</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-slate-600">Cargando sesiones...</p>
            </div>
          ) : sessions.length === 0 ? (
            <div className="text-center py-12">
              <AlertCircle className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-600">No hay sesiones completadas aún</p>
            </div>
          ) : (
            <div className="space-y-6">
              {sessions.map((session) => (
                <div
                  key={session.idSesion}
                  className="border-2 border-slate-200 rounded-xl overflow-hidden"
                >
                  {/* Session Header */}
                  <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-bold text-slate-800">Sesión #{session.idSesion}</h3>
                        <p className="text-sm text-slate-600">
                          {formatDate(session.fechaCreacion)}
                        </p>
                      </div>
                      <span className="flex items-center gap-2 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                        <CheckCircle className="w-4 h-4" />
                        Completada
                      </span>
                    </div>
                  </div>

                  {/* Descripciones */}
                  <div className="p-6 space-y-6">
                    {session.descripciones.length === 0 ? (
                      <p className="text-center text-slate-500 py-8">
                        No hay descripciones en esta sesión
                      </p>
                    ) : (
                      session.descripciones.map((desc, index) => (
                        <div
                          key={desc.idDescripcion}
                          className="border border-slate-200 rounded-lg overflow-hidden"
                        >
                          {/* Imagen */}
                          {desc.imagen.urlImagen && (
                            <div className="bg-slate-100 p-4">
                              <img
                                src={desc.imagen.urlImagen}
                                alt={`Foto ${index + 1}`}
                                className="w-full max-h-64 object-contain rounded"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement
                                  target.style.display = 'none'
                                }}
                              />
                            </div>
                          )}

                          {/* Comparativa de descripciones */}
                          <div className="grid md:grid-cols-2 gap-4 p-6">
                            {/* Ground Truth (Cuidador) */}
                            <div className="space-y-2">
                              <div className="flex items-center gap-2 mb-3">
                                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                                <h4 className="font-semibold text-blue-900">
                                  Descripción Original (Cuidador)
                                </h4>
                              </div>
                              
                              {desc.groundTruth ? (
                                <div>
                                  <p className="text-sm text-slate-700 leading-relaxed bg-blue-50 p-4 rounded-lg">
                                    {desc.groundTruth.texto}
                                  </p>
                                  
                                  {desc.groundTruth.palabrasClave && 
                                   desc.groundTruth.palabrasClave.length > 0 && (
                                    <div className="mt-3">
                                      <p className="text-xs text-slate-600 mb-2">
                                        Palabras clave:
                                      </p>
                                      <div className="flex flex-wrap gap-1">
                                        {desc.groundTruth.palabrasClave.map((palabra, i) => (
                                          <span
                                            key={i}
                                            className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs"
                                          >
                                            {palabra}
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <p className="text-sm text-slate-500 italic bg-slate-50 p-4 rounded-lg">
                                  No hay descripción original disponible
                                </p>
                              )}
                            </div>

                            {/* Descripción del Paciente */}
                            <div className="space-y-2">
                              <div className="flex items-center gap-2 mb-3">
                                <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
                                <h4 className="font-semibold text-purple-900">
                                  Descripción del Paciente
                                </h4>
                              </div>
                              
                              <p className="text-sm text-slate-700 leading-relaxed bg-purple-50 p-4 rounded-lg">
                                {desc.texto || 'Sin descripción'}
                              </p>

                              {/* Puntajes */}
                              {desc.puntajes && (
                                <div className="mt-3 space-y-2">
                                  <p className="text-xs text-slate-600 font-medium">Puntajes:</p>
                                  <div className="grid grid-cols-3 gap-2">
                                    <div className="text-center p-2 bg-slate-50 rounded">
                                      <p className="text-xs text-slate-600">Recuerdo</p>
                                      <p className="font-bold text-slate-800">
                                        {Math.round((desc.puntajes.recall || 0) * 100)}%
                                      </p>
                                    </div>
                                    <div className="text-center p-2 bg-slate-50 rounded">
                                      <p className="text-xs text-slate-600">Coherencia</p>
                                      <p className="font-bold text-slate-800">
                                        {Math.round((desc.puntajes.coherencia || 0) * 100)}%
                                      </p>
                                    </div>
                                    <div className="text-center p-2 bg-slate-50 rounded">
                                      <p className="text-xs text-slate-600">Fluidez</p>
                                      <p className="font-bold text-slate-800">
                                        {Math.round((desc.puntajes.fluidez || 0) * 100)}%
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
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