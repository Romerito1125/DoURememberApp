"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Calendar, Image as ImageIcon, CheckCircle, AlertCircle, Loader2, Plus, Edit2, FileText } from "lucide-react"
import Header from "@/app/components/header"
import Footer from "@/app/components/footer"
import { createClient } from "@/utils/supabase/client"

const API_URL = 'https://api.devcorebits.com/api'

interface Photo {
  idImagen: number
  urlImagen: string
  fechaSubida: string
  idCuidador: string
  idSesion: number | null
}

interface Patient {
  idUsuario: string
  nombre: string
}

const PREGUNTAS_GUIA_DEFAULT = [
  '¿Quiénes están en la foto?',
  '¿Dónde fue tomada esta foto?',
  '¿Qué evento o momento representa?'
]

export default function CreateSessionPage() {
  const router = useRouter()
  const supabase = createClient()
  const [photos, setPhotos] = useState<Photo[]>([])
  const [patients, setPatients] = useState<Patient[]>([])
  const [selectedPatient, setSelectedPatient] = useState("")
  const [selectedImages, setSelectedImages] = useState<number[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [userId, setUserId] = useState("")
  const [showPreguntasModal, setShowPreguntasModal] = useState(false)
  const [preguntasPersonalizadas, setPreguntasPersonalizadas] = useState<string[]>(PREGUNTAS_GUIA_DEFAULT)
  const [usarPreguntasDefault, setUsarPreguntasDefault] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.access_token) {
        router.push('/authentication/login')
        return
      }

      setUserId(session.user.id)
      const token = session.access_token

      const photosResponse = await fetch(
        `${API_URL}/descripciones-imagenes/listarImagenes/${session.user.id}?page=1&limit=100`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          }
        }
      )

      if (photosResponse.ok) {
        const photosData = await photosResponse.json()
        const availablePhotos = (photosData.data || []).filter((photo: Photo) => photo.idSesion === null)
        setPhotos(availablePhotos)
      }

      const patientsResponse = await fetch(
        `${API_URL}/usuarios-autenticacion/pacienteCuidador/${session.user.id}`,
        { headers: { "Authorization": `Bearer ${token}` } }
      )

      if (patientsResponse.ok) {
        const patientsData = await patientsResponse.json()
        
        const patientsComplete = await Promise.all(
          patientsData.map(async (item: { idPaciente: string }) => {
            const profileResponse = await fetch(
              `${API_URL}/usuarios-autenticacion/buscarUsuario/${item.idPaciente}`,
              { headers: { "Authorization": `Bearer ${token}` } }
            )

            if (profileResponse.ok) {
              const profileData = await profileResponse.json()
              if (profileData.usuarios && profileData.usuarios.length > 0) {
                return profileData.usuarios[0]
              }
            }
            return null
          })
        )

        const validPatients = patientsComplete.filter(p => p !== null)
        setPatients(validPatients)
        
        if (validPatients.length > 0) {
          setSelectedPatient(validPatients[0].idUsuario)
        }
      }

    } catch (error: any) {
      console.error('Error al cargar datos:', error)
      setError('Error al cargar los datos')
    } finally {
      setIsLoading(false)
    }
  }

  const toggleImageSelection = (imageId: number) => {
    setSelectedImages(prev => {
      if (prev.includes(imageId)) {
        return prev.filter(id => id !== imageId)
      } else {
        if (prev.length >= 3) {
          setError('Solo puedes seleccionar 3 imágenes por sesión')
          setTimeout(() => setError(''), 3000)
          return prev
        }
        return [...prev, imageId]
      }
    })
  }

  const handleCreateSession = async () => {
    if (selectedImages.length !== 3) {
      setError('Debes seleccionar exactamente 3 imágenes para crear una sesión')
      return
    }

    if (!selectedPatient) {
      setError('Debes seleccionar un paciente')
      return
    }

    setShowPreguntasModal(true)
  }

  const handleConfirmPreguntas = async () => {
    setIsCreating(true)
    setError('')
    setSuccess('')
    setShowPreguntasModal(false)

    try {
      const { data: { session } } = await supabase.auth.getSession()

      if (!session?.access_token) {
        throw new Error('Sesión no válida')
      }

      const response = await fetch(`${API_URL}/descripciones-imagenes/crearSesion`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          idCuidador: userId,
          imagenesIds: selectedImages
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Error al crear sesión')
      }

      const sesionData = await response.json()

      // Si hay preguntas personalizadas, actualizar el ground truth de cada imagen
      if (!usarPreguntasDefault && preguntasPersonalizadas.length > 0) {
        for (const idImagen of selectedImages) {
          try {
            // Obtener el ground truth actual
            const gtResponse = await fetch(
              `${API_URL}/descripciones-imagenes/buscarGroundTruthImagen/${idImagen}`,
              { headers: { "Authorization": `Bearer ${session.access_token}` } }
            )

            if (gtResponse.ok) {
              const gtData = await gtResponse.json()
              
              // Actualizar con las preguntas personalizadas
              await fetch(
                `${API_URL}/descripciones-imagenes/actualizarGroundTruth/${gtData.idGroundtruth}`,
                {
                  method: 'PATCH',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                  },
                  body: JSON.stringify({
                    preguntasGuiaPaciente: preguntasPersonalizadas
                  })
                }
              )
            }
          } catch (err) {
            console.error('Error al actualizar preguntas:', err)
          }
        }
      }

      setSuccess('¡Sesión creada exitosamente!')
      
      setTimeout(() => {
        router.push('/users/cuidador')
      }, 2000)

    } catch (error: any) {
      console.error('Error:', error)
      setError(error.message || 'Error al crear la sesión')
    } finally {
      setIsCreating(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-purple-600 animate-spin mx-auto mb-4" />
            <p className="text-slate-600">Cargando datos...</p>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  const canCreateSession = selectedImages.length === 3 && selectedPatient && !isCreating
  const imagesRemaining = 3 - selectedImages.length

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-50 backdrop-blur-xl bg-white/80 border-b border-purple-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Header />
        </div>
      </div>
      
      <main className="flex-1 container mx-auto px-6 py-12">
        <div className="max-w-6xl mx-auto">
          {/* Botón Volver */}
          <button
            onClick={() => router.push('/users/cuidador')}
            className="flex items-center gap-2 text-purple-700 hover:text-purple-900 mb-8 transition-colors font-semibold group"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            Volver al Dashboard
          </button>

          {/* Encabezado */}
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8 mb-8">
            <div className="flex items-center gap-4 mb-3">
              <div className="w-14 h-14 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Calendar className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-900">Crear Nueva Sesión</h1>
                <p className="text-slate-600 mt-1">
                  Selecciona exactamente 3 imágenes para crear una sesión de evaluación
                </p>
              </div>
            </div>
          </div>

          {/* Mensajes de Error */}
          {error && (
            <div className="mb-8 bg-gradient-to-r from-red-50 to-red-100 border-2 border-red-300 rounded-2xl p-6 shadow-lg">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-red-200 rounded-xl flex items-center justify-center flex-shrink-0">
                  <AlertCircle className="w-6 h-6 text-red-700" />
                </div>
                <div>
                  <p className="text-red-900 font-bold text-lg mb-1">Error</p>
                  <p className="text-red-800">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Mensajes de Éxito */}
          {success && (
            <div className="mb-8 bg-gradient-to-r from-green-50 to-green-100 border-2 border-green-300 rounded-2xl p-6 shadow-lg">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-green-200 rounded-xl flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-6 h-6 text-green-700" />
                </div>
                <div>
                  <p className="text-green-900 font-bold text-lg mb-1">Éxito</p>
                  <p className="text-green-800">{success}</p>
                </div>
              </div>
            </div>
          )}

          {/* Selector de Paciente */}
          {patients.length > 0 && (
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8 mb-8">
              <label className="block text-base font-bold text-slate-900 mb-3">
                Seleccionar Paciente
              </label>
              <select
                value={selectedPatient}
                onChange={(e) => setSelectedPatient(e.target.value)}
                className="w-full px-4 py-3.5 border-2 border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all text-slate-900 font-medium"
                disabled={isCreating}
              >
                {patients.map(patient => (
                  <option key={patient.idUsuario} value={patient.idUsuario}>
                    {patient.nombre}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Contador de Imágenes */}
          <div className="bg-gradient-to-br from-purple-50 to-indigo-50 border-2 border-purple-300 rounded-2xl p-8 mb-8 shadow-lg">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-6">
              <div>
                <h3 className="text-2xl font-bold text-slate-900 mb-2">
                  Imágenes seleccionadas: {selectedImages.length} / 3
                </h3>
                <p className="text-slate-700 font-medium">
                  {imagesRemaining === 0 
                    ? 'Perfecto, ya puedes crear la sesión'
                    : imagesRemaining === 3
                    ? 'Selecciona 3 imágenes para continuar'
                    : `Te ${imagesRemaining === 1 ? 'falta' : 'faltan'} ${imagesRemaining} ${imagesRemaining === 1 ? 'imagen' : 'imágenes'}`
                  }
                </p>
              </div>
              <div className="flex gap-3">
                {[1, 2, 3].map((num) => (
                  <div
                    key={num}
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-lg shadow-md transition-all ${
                      selectedImages.length >= num
                        ? 'bg-gradient-to-br from-purple-600 to-indigo-600 text-white scale-110'
                        : 'bg-white text-slate-400 border-2 border-slate-200'
                    }`}
                  >
                    {selectedImages.length >= num ? (
                      <CheckCircle className="w-7 h-7" />
                    ) : (
                      num
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 border border-purple-200">
              <p className="text-slate-700 leading-relaxed">
                <span className="font-bold text-slate-900">Importante:</span> Cada sesión debe tener exactamente 3 imágenes. 
                Asegúrate de que cada imagen tenga su descripción de referencia antes de crear la sesión.
              </p>
            </div>
          </div>

          {/* Galería de Imágenes */}
          {photos.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-16 text-center">
              <div className="w-24 h-24 bg-gradient-to-br from-slate-100 to-slate-200 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-inner">
                <ImageIcon className="w-12 h-12 text-slate-400" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-3">
                No hay imágenes disponibles
              </h3>
              <p className="text-slate-600 mb-8 max-w-md mx-auto">
                Debes subir al menos 3 imágenes antes de crear una sesión
              </p>
              <button
                onClick={() => router.push('/photos/upload')}
                className="px-8 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:from-purple-700 hover:to-indigo-700 transition-all duration-300 font-bold shadow-lg hover:shadow-xl"
              >
                Subir Imágenes
              </button>
            </div>
          ) : (
            <>
              <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8 mb-8">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 pb-6 border-b border-slate-200">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-md">
                      <ImageIcon className="w-6 h-6 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900">
                      Selecciona 3 imágenes
                    </h2>
                  </div>
                  <button
                    onClick={() => router.push('/photos/upload')}
                    className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-green-50 to-green-100 text-green-700 border-2 border-green-300 rounded-xl hover:from-green-100 hover:to-green-200 transition-all duration-300 font-semibold shadow-md"
                  >
                    <Plus className="w-5 h-5" />
                    Agregar Más Imágenes
                  </button>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {photos.map((photo) => {
                    const isSelected = selectedImages.includes(photo.idImagen)
                    const selectionIndex = selectedImages.indexOf(photo.idImagen)

                    return (
                      <div
                        key={photo.idImagen}
                        onClick={() => toggleImageSelection(photo.idImagen)}
                        className={`relative cursor-pointer rounded-2xl overflow-hidden border-4 transition-all duration-300 ${
                          isSelected
                            ? 'border-purple-600 shadow-2xl scale-105 ring-4 ring-purple-200'
                            : 'border-slate-200 hover:border-purple-300 hover:shadow-lg'
                        }`}
                      >
                        <img
                          src={photo.urlImagen}
                          alt={`Foto ${photo.idImagen}`}
                          className="w-full h-52 object-cover"
                        />
                        
                        {isSelected && (
                          <div className="absolute top-3 right-3 w-10 h-10 bg-gradient-to-br from-purple-600 to-indigo-600 text-white rounded-xl flex items-center justify-center font-bold shadow-xl border-2 border-white text-lg">
                            {selectionIndex + 1}
                          </div>
                        )}

                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent p-4">
                          <p className="text-white text-sm font-medium">
                            {new Date(photo.fechaSubida).toLocaleDateString('es-ES', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Botón Crear Sesión */}
              <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8">
                <button
                  onClick={handleCreateSession}
                  disabled={!canCreateSession}
                  className={`w-full px-8 py-5 rounded-xl font-bold text-lg flex items-center justify-center gap-3 transition-all duration-300 ${
                    canCreateSession
                      ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700 shadow-lg hover:shadow-2xl transform hover:scale-[1.02]'
                      : 'bg-slate-200 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="w-6 h-6 animate-spin" />
                      Creando sesión...
                    </>
                  ) : (
                    <>
                      <Calendar className="w-6 h-6" />
                      {selectedImages.length === 3 
                        ? 'Crear Sesión'
                        : `Selecciona ${imagesRemaining} ${imagesRemaining === 1 ? 'imagen más' : 'imágenes más'}`
                      }
                    </>
                  )}
                </button>
                
                {selectedImages.length !== 3 && (
                  <p className="text-center text-slate-600 mt-4 font-medium">
                    Debes seleccionar exactamente 3 imágenes para continuar
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      </main>

      {/* Modal de Preguntas */}
      {showPreguntasModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-8 border-b border-slate-200 bg-gradient-to-r from-purple-50 to-indigo-50">
              <div className="flex items-center gap-4 mb-2">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-3xl font-bold text-slate-900">Configurar Preguntas Guía</h2>
              </div>
              <p className="text-slate-600 ml-16">
                Estas preguntas guiarán al paciente durante la sesión
              </p>
            </div>

            <div className="p-8 space-y-6">
              {/* Opción Preguntas Default */}
              <div className={`flex items-start gap-4 p-6 border-2 rounded-2xl cursor-pointer transition-all ${
                usarPreguntasDefault 
                  ? 'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-400 shadow-md' 
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
              onClick={() => setUsarPreguntasDefault(true)}
              >
                <input
                  type="radio"
                  id="preguntasDefault"
                  checked={usarPreguntasDefault}
                  onChange={() => setUsarPreguntasDefault(true)}
                  className="w-5 h-5 text-purple-600 mt-1"
                />
                <label htmlFor="preguntasDefault" className="flex-1 cursor-pointer">
                  <p className="font-bold text-slate-900 text-lg mb-1">Usar preguntas predeterminadas</p>
                  <p className="text-slate-600">Preguntas estándar para todas las imágenes</p>
                </label>
              </div>

              {usarPreguntasDefault && (
                <div className="ml-9 space-y-3 p-6 bg-slate-50 rounded-xl border border-slate-200">
                  {PREGUNTAS_GUIA_DEFAULT.map((pregunta, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <span className="text-purple-600 font-bold text-lg mt-0.5">{idx + 1}.</span>
                      <p className="text-slate-800 font-medium">{pregunta}</p>
                    </div>
                  ))}
                </div>
              )}

              

              {!usarPreguntasDefault && (
                <div className="ml-9 space-y-4">
                  {preguntasPersonalizadas.map((pregunta, idx) => (
                    <div key={idx} className="flex gap-3">
                      <span className="text-purple-600 font-bold text-lg mt-3">{idx + 1}.</span>
                      <textarea
                        value={pregunta}
                        onChange={(e) => {
                          const nuevasPreguntas = [...preguntasPersonalizadas]
                          nuevasPreguntas[idx] = e.target.value
                          setPreguntasPersonalizadas(nuevasPreguntas)
                        }}
                        className="flex-1 px-4 py-3 border-2 border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all text-slate-900"
                        rows={2}
                        placeholder={`Pregunta ${idx + 1}`}
                      />
                    </div>
                  ))}
                  
                  
                </div>
              )}
            </div>

            <div className="p-8 border-t border-slate-200 flex gap-4 bg-slate-50">
              <button
                onClick={() => setShowPreguntasModal(false)}
                className="flex-1 px-6 py-4 bg-white text-slate-700 rounded-xl hover:bg-slate-100 transition-all duration-300 font-bold border-2 border-slate-300"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmPreguntas}
                className="flex-1 px-6 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:from-purple-700 hover:to-indigo-700 transition-all duration-300 font-bold shadow-lg hover:shadow-xl"
              >
                Confirmar y Crear Sesión
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  )
}