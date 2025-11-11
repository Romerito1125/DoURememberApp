"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { ArrowLeft, FileText, CheckCircle, AlertCircle, Calendar, User, Brain, Target, Stethoscope, MessageSquare } from "lucide-react"
import Header from "@/app/components/header"
import Footer from "@/app/components/footer"
import { createClient } from "@/utils/supabase/client"

const API_URL = 'http://localhost:3000/api'

interface Descripcion {
  idDescripcion: number
  texto: string
  fecha: string
  idPaciente: string
  idImagen: number
  PUNTAJE: {
    idPuntaje: number
    rateOmision: number
    rateComision: number
    rateExactitud: number
    puntajeCoherencia: number
    puntajeFluidez: number
    puntajeTotal: number
    detallesOmitidos: string[]
    palabrasClaveOmitidas: string[]
    elementosComision: string[]
    aciertos: string[]
    conclusion: string
    fechaCalculo: string
  }[]
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
  urlImagen: string
  fechaSubida: string
  DESCRIPCION: Descripcion | null | undefined
  GROUNDTRUTH: GroundTruth[]
}

interface Session {
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
  idPaciente: string
  IMAGEN: Imagen[]
}

interface Patient {
  idUsuario: string
  nombre: string
  correo: string
}

export default function SessionResponsesPage() {
  const router = useRouter()
  const params = useParams()
  const sessionId = params.id as string

  const [session, setSession] = useState<Session | null>(null)
  const [patient, setPatient] = useState<Patient | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    loadSessionData()
  }, [sessionId])

  const loadSessionData = async () => {
    try {
      const supabase = createClient()
      const { data: { session: authSession } } = await supabase.auth.getSession()

      if (!authSession?.access_token) {
        router.push('/authentication/login')
        return
      }

      const token = authSession.access_token

      const sessionResponse = await fetch(
        `${API_URL}/descripciones-imagenes/buscarSesion/${sessionId}`,
        { headers: { "Authorization": `Bearer ${token}` } }
      )

      if (!sessionResponse.ok) {
        throw new Error('Sesión no encontrada')
      }

      const sessionData = await sessionResponse.json()

      const imagenesConGT = await Promise.all(
        sessionData.IMAGEN.map(async (img: any) => {
          const gtResponse = await fetch(
            `${API_URL}/descripciones-imagenes/buscarGroundTruthImagen/${img.idImagen}`,
            { headers: { "Authorization": `Bearer ${token}` } }
          )

          let groundTruth = null
          if (gtResponse.ok) {
            groundTruth = await gtResponse.json()
          }

          return {
            ...img,
            GROUNDTRUTH: groundTruth ? [groundTruth] : [],
            DESCRIPCION: img.DESCRIPCION
          }
        })
      )

      setSession({
        ...sessionData,
        IMAGEN: imagenesConGT
      })

      const patientResponse = await fetch(
        `${API_URL}/usuarios-autenticacion/buscarUsuario/${sessionData.idPaciente}`,
        { headers: { "Authorization": `Bearer ${token}` } }
      )

      if (patientResponse.ok) {
        const patientData = await patientResponse.json()
        if (patientData.usuarios && patientData.usuarios.length > 0) {
          setPatient(patientData.usuarios[0])
        }
      }

    } catch (error: any) {
      console.error('Error al cargar datos:', error)
      setError(error.message || 'Error al cargar los datos de la sesión')
    } finally {
      setIsLoading(false)
    }
  }

  const getPuntajeColor = (puntaje: number) => {
    if (puntaje >= 0.75) return 'text-green-600 bg-green-50'
    if (puntaje >= 0.45) return 'text-amber-600 bg-amber-50'
    return 'text-red-600 bg-red-50'
  }

  const getPuntajeBorderColor = (puntaje: number) => {
    if (puntaje >= 0.75) return 'border-green-200'
    if (puntaje >= 0.45) return 'border-amber-200'
    return 'border-red-200'
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto px-6 py-8">
          <div className="max-w-6xl mx-auto">
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
              <p className="text-slate-600">Cargando respuestas...</p>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  if (error || !session) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto px-6 py-8">
          <div className="max-w-6xl mx-auto">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 flex items-start">
              <AlertCircle className="w-6 h-6 text-red-600 mr-3 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-red-800 font-medium">Error</p>
                <p className="text-red-700 text-sm mt-1">{error || 'No se pudo cargar la sesión'}</p>
              </div>
            </div>
            <button
              onClick={() => router.push('/users/cuidador')}
              className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Volver al Dashboard
            </button>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  const estaCompletada = session.estado === 'completado'

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header />
      
      <main className="flex-1 container mx-auto px-6 py-8">
        <div className="max-w-6xl mx-auto">
          
          <div className="mb-6">
            <button
              onClick={() => router.push('/users/cuidador')}
              className="flex items-center gap-2 text-purple-600 hover:text-purple-700 mb-4"
            >
              <ArrowLeft className="w-5 h-5" />
              Volver al Dashboard
            </button>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-3xl font-bold text-slate-800 mb-2">
                    Respuestas de la Sesión #{session.idSesion}
                  </h1>
                  {patient && (
                    <p className="text-slate-600">
                      Paciente: <strong>{patient.nombre}</strong>
                    </p>
                  )}
                  <p className="text-sm text-slate-500">
                    Creada el {new Date(session.fechaCreacion).toLocaleDateString('es-ES', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className={`px-4 py-2 rounded-full text-sm font-medium ${
                    estaCompletada ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {estaCompletada ? 'Completada' : 'Pendiente'}
                  </span>
                  {estaCompletada && (
                    <div className={`px-4 py-2 rounded-full text-sm font-medium ${getPuntajeColor(session.sessionTotal)}`}>
                      Puntaje Total: {Math.round(session.sessionTotal * 100)}%
                    </div>
                  )}
                </div>
              </div>

              {estaCompletada && (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  <div className="bg-blue-50 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-blue-600">
                      {Math.round(session.sessionRecall * 100)}%
                    </p>
                    <p className="text-xs text-slate-600">Exactitud</p>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-purple-600">
                      {Math.round(session.sessionCoherencia * 100)}%
                    </p>
                    <p className="text-xs text-slate-600">Coherencia</p>
                  </div>
                  <div className="bg-indigo-50 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-indigo-600">
                      {Math.round(session.sessionFluidez * 100)}%
                    </p>
                    <p className="text-xs text-slate-600">Fluidez</p>
                  </div>
                  <div className="bg-amber-50 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-amber-600">
                      {Math.round(session.sessionOmision * 100)}%
                    </p>
                    <p className="text-xs text-slate-600">Omisión</p>
                  </div>
                  <div className="bg-red-50 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-red-600">
                      {Math.round(session.sessionComision * 100)}%
                    </p>
                    <p className="text-xs text-slate-600">Comisión</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {!estaCompletada && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 mb-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-amber-900 font-semibold mb-1">Sesión Pendiente</p>
                  <p className="text-amber-800 text-sm">
                    El paciente aún no ha completado todas las descripciones de esta sesión. 
                    Las métricas y conclusiones estarán disponibles una vez finalizada.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
            <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Stethoscope className="w-6 h-6 text-blue-600" />
              Notas del Médico
            </h2>
            
            {session.notasMedico && session.notasMedico !== "No hay notas aún" ? (
              <>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">{session.notasMedico}</p>
                  {session.fechaRevisionMedico && (
                    <p className="text-xs text-slate-500 mt-3">
                      Revisado el {new Date(session.fechaRevisionMedico).toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  )}
                </div>
              </>
            ) : (
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-center">
                <AlertCircle className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                <p className="text-slate-600">
                  Aún no hay notas del médico para esta sesión
                </p>
                <p className="text-slate-500 text-sm mt-1">
                  Las notas estarán disponibles una vez que el médico revise la sesión
                </p>
              </div>
            )}
          </div>

          {estaCompletada && session.conclusionNormal && session.conclusionNormal !== "No se ha proporcionado todavía" && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
              <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                <Brain className="w-6 h-6 text-purple-600" />
                Conclusión de la Sesión
              </h2>
              
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <h3 className="font-semibold text-purple-900 mb-2">Resumen del Desempeño:</h3>
                <p className="text-slate-700 leading-relaxed">{session.conclusionNormal}</p>
              </div>

              <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>Nota:</strong> Esta conclusión está diseñada para ser comprensible y motivadora. 
                  El análisis técnico detallado está disponible para el médico tratante.
                </p>
              </div>
            </div>
          )}

          <div className="space-y-6">
              <h2 className="text-2xl font-bold text-slate-800">Descripciones Detalladas</h2>

              {session.IMAGEN.map((imagen, imgIndex) => {
                  const descripcion = imagen.DESCRIPCION
                  const groundTruth = imagen.GROUNDTRUTH?.[0]
                  const textoDescripcion = descripcion?.texto?.trim() // Trim para detectar descripciones vacías
                  const puntaje = descripcion?.PUNTAJE?.[0]

                  // 🛑 CONDICIÓN DE BLOQUEO: NO hay objeto descripción O el texto de la descripción está vacío/es null.
                  if (!descripcion || !textoDescripcion) {
                      return (
                          <div key={imagen.idImagen} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                              <div className="flex gap-6 mb-4">
                                  <img
                                      src={imagen.urlImagen}
                                      alt={`Imagen ${imgIndex + 1}`}
                                      className="w-48 h-48 object-cover rounded-lg"
                                  />
                                  <div className="flex-1">
                                      <h3 className="text-xl font-bold text-slate-800 mb-3">
                                          Imagen {imgIndex + 1}
                                      </h3>
                                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                                          <p className="text-amber-800 text-sm">
                                              El paciente aún no ha descrito esta imagen
                                          </p>
                                      </div>
                                  </div>
                              </div>
                              
                              {groundTruth && (
                                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                      <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                                          <Target className="w-4 h-4" />
                                          Descripción de Referencia:
                                      </h4>
                                      <p className="text-slate-700 text-sm mb-3">{groundTruth.texto}</p>
                                      
                                      {groundTruth.palabrasClave && groundTruth.palabrasClave.length > 0 && (
                                          <div className="mb-3">
                                              <p className="text-xs text-slate-600 mb-1 font-medium">Palabras clave:</p>
                                              <div className="flex flex-wrap gap-1">
                                                  {groundTruth.palabrasClave.map((palabra, idx) => (
                                                      <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
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
                                                  {groundTruth.preguntasGuiaPaciente.map((pregunta, idx) => (
                                                      <li key={idx} className="text-xs text-slate-600 flex items-start gap-2">
                                                          <span className="text-blue-600 font-bold">{idx + 1}.</span>
                                                          <span>{pregunta}</span>
                                                      </li>
                                                  ))}
                                              </ul>
                                          </div>
                                      )}
                                  </div>
                              )}
                          </div>
                      )
                  }

                  // 🟢 BLOQUE DE RENDERIZADO CUANDO LA DESCRIPCIÓN EXISTE (Puntaje es opcional) 🟢
                  return (
                      <div 
                          key={imagen.idImagen}
                          // Si hay puntaje, usa su color de borde, si no, usa un borde neutral.
                          className={`bg-white rounded-xl shadow-sm border-2 p-6 ${puntaje ? getPuntajeBorderColor(puntaje.puntajeTotal) : 'border-slate-200'}`}
                      >
                          <div className="flex gap-6 mb-6">
                              <img
                                  src={imagen.urlImagen}
                                  alt={`Imagen ${imgIndex + 1}`}
                                  className="w-48 h-48 object-cover rounded-lg"
                              />
                              
                              <div className="flex-1">
                                  <h3 className="text-xl font-bold text-slate-800 mb-3">
                                      Imagen {imgIndex + 1}
                                  </h3>
                                  
                                  {/* MUESTRA DETALLES DEL PUNTAJE SOLO SI EXISTE */}
                                  {puntaje ? (
                                      <>
                                          <div className="grid grid-cols-3 gap-2 mb-4">
                                              <div className="bg-slate-50 rounded-lg p-2 text-center">
                                                  <p className="text-lg font-bold text-slate-700">
                                                      {Math.round(puntaje.rateExactitud * 100)}%
                                                  </p>
                                                  <p className="text-xs text-slate-600">Exactitud</p>
                                              </div>
                                              <div className="bg-slate-50 rounded-lg p-2 text-center">
                                                  <p className="text-lg font-bold text-slate-700">
                                                      {Math.round(puntaje.puntajeCoherencia * 100)}%
                                                  </p>
                                                  <p className="text-xs text-slate-600">Coherencia</p>
                                              </div>
                                              <div className="bg-slate-50 rounded-lg p-2 text-center">
                                                  <p className="text-lg font-bold text-slate-700">
                                                      {Math.round(puntaje.puntajeFluidez * 100)}%
                                                  </p>
                                                  <p className="text-xs text-slate-600">Fluidez</p>
                                              </div>
                                          </div>

                                          <div className={`px-4 py-2 rounded-lg inline-block ${getPuntajeColor(puntaje.puntajeTotal)}`}>
                                              <span className="font-bold">Puntaje: {Math.round(puntaje.puntajeTotal * 100)}%</span>
                                          </div>
                                      </>
                                  ) : (
                                      // MUESTRA ESTO SI LA DESCRIPCIÓN EXISTE PERO EL PUNTAJE NO
                                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                                          <p className="text-blue-800 text-sm font-medium">
                                              Descripción pendiente de calificación.
                                          </p>
                                      </div>
                                  )}
                              </div>
                          </div>

                          {groundTruth && (
                              <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
                                  <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                                      <Target className="w-4 h-4" />
                                      Descripción de Referencia:
                                  </h4>
                                  <p className="text-slate-700 text-sm mb-3">{groundTruth.texto}</p>
                                  
                                  {groundTruth.palabrasClave && groundTruth.palabrasClave.length > 0 && (
                                      <div className="mb-3">
                                          <p className="text-xs text-slate-600 mb-1 font-medium">Palabras clave:</p>
                                          <div className="flex flex-wrap gap-1">
                                              {groundTruth.palabrasClave.map((palabra, idx) => (
                                                  <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
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
                                              {groundTruth.preguntasGuiaPaciente.map((pregunta, idx) => (
                                                  <li key={idx} className="text-xs text-slate-600 flex items-start gap-2">
                                                      <span className="text-blue-600 font-bold">{idx + 1}.</span>
                                                      <span>{pregunta}</span>
                                                  </li>
                                              ))}
                                          </ul>
                                      </div>
                                  )}
                              </div>
                          )}

                          {/* 🔑 DESCRIPCIÓN DEL PACIENTE (Siempre se muestra si el texto existe) 🔑 */}
                          <div className="mb-4 bg-slate-50 border border-slate-200 rounded-lg p-4">
                              <h4 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
                                  <MessageSquare className="w-4 h-4" />
                                  Descripción del Paciente:
                              </h4>
                              <p className="text-slate-700">{descripcion.texto}</p>
                              <p className="text-xs text-slate-500 mt-2">
                                  {new Date(descripcion.fecha).toLocaleString('es-ES')}
                              </p>
                          </div>

                          {/* MUESTRA EL DETALLE DE ACIERTOS/COMISIONES SOLO SI EL PUNTAJE EXISTE */}
                          {puntaje && (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  {puntaje.aciertos && puntaje.aciertos.length > 0 && (
                                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                          <h4 className="font-semibold text-green-900 mb-2 flex items-center gap-2">
                                              <CheckCircle className="w-4 h-4" />
                                              Aciertos ({puntaje.aciertos.length})
                                          </h4>
                                          <ul className="space-y-1">
                                              {puntaje.aciertos.map((acierto, idx) => (
                                                  <li key={idx} className="text-sm text-green-800">• {acierto}</li>
                                              ))}
                                          </ul>
                                      </div>
                                  )}

                                  {puntaje.detallesOmitidos && puntaje.detallesOmitidos.length > 0 && (
                                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                                          <h4 className="font-semibold text-amber-900 mb-2 flex items-center gap-2">
                                              <AlertCircle className="w-4 h-4" />
                                              Detalles Omitidos ({puntaje.detallesOmitidos.length})
                                          </h4>
                                          <ul className="space-y-1">
                                              {puntaje.detallesOmitidos.map((detalle, idx) => (
                                                  <li key={idx} className="text-sm text-amber-800">• {detalle}</li>
                                              ))}
                                          </ul>
                                      </div>
                                  )}

                                  {puntaje.palabrasClaveOmitidas && puntaje.palabrasClaveOmitidas.length > 0 && (
                                      <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                                          <h4 className="font-semibold text-orange-900 mb-2">
                                              Palabras Clave Omitidas
                                          </h4>
                                          <div className="flex flex-wrap gap-1">
                                              {puntaje.palabrasClaveOmitidas.map((palabra, idx) => (
                                                  <span key={idx} className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-full">
                                                      {palabra}
                                                  </span>
                                              ))}
                                          </div>
                                      </div>
                                  )}

                                  {puntaje.elementosComision && puntaje.elementosComision.length > 0 && (
                                      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                          <h4 className="font-semibold text-red-900 mb-2 flex items-center gap-2">
                                              <AlertCircle className="w-4 h-4" />
                                              Elementos Incorrectos ({puntaje.elementosComision.length})
                                          </h4>
                                          <ul className="space-y-1">
                                              {puntaje.elementosComision.map((elemento, idx) => (
                                                  <li key={idx} className="text-sm text-red-800">• {elemento}</li>
                                              ))}
                                          </ul>
                                      </div>
                                  )}
                              </div>
                          )}
                          
                          {/* MUESTRA CONCLUSIÓN SOLO SI EL PUNTAJE EXISTE */}
                          {puntaje?.conclusion && (
                              <div className="mt-4 bg-purple-50 border border-purple-200 rounded-lg p-4">
                                  <h4 className="font-semibold text-purple-900 mb-2">Análisis:</h4>
                                  <p className="text-slate-700 text-sm">{puntaje.conclusion}</p>
                              </div>
                          )}
                      </div>
                  )
              })}
          </div>

          <div className="mt-8">
            <button
              onClick={() => router.push('/users/cuidador')}
              className="w-full px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Volver al Dashboard
            </button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}