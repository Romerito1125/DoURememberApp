"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Header from "@/app/components/header"
import Footer from "@/app/components/footer"
import PhotoForm from "@/app/components/photos/PhotoForm"
import { CheckCircle, AlertCircle, Image as ImageIcon, Trash2 } from "lucide-react"
import { createClient } from "@/utils/supabase/client"

const API_URL = 'http://localhost:3000/api'

interface UploadedPhoto {
  idImagen: number
  urlImagen: string
  groundTruthData: {
    people: string
    location: string
    context: string
    keywords: string[]
  }
}

async function uploadImage(file: File, userId: string, token: string) {
  const formData = new FormData()
  formData.append('file', file)

  const response = await fetch(`${API_URL}/descripciones-imagenes/uploadImage/${userId}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData
  })

  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.message || 'Error al subir imagen')
  }
  
  return response.json()
}

async function crearGroundTruth(data: {
  texto: string
  idImagen: number
  palabrasClave: string[]
  preguntasGuiaPaciente: string[]
}, token: string) {
  const response = await fetch(`${API_URL}/descripciones-imagenes/crearGroundTruth`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(data)
  })

  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.message || 'Error al crear ground truth')
  }
  
  return response.json()
}

async function eliminarImagen(idImagen: number, token: string) {
  const response = await fetch(`${API_URL}/descripciones-imagenes/eliminar/${idImagen}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })

  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.message || 'Error al eliminar imagen')
  }
  
  return response.json()
}

export default function UploadPhotoPage() {
  const router = useRouter()
  const [uploadedPhotos, setUploadedPhotos] = useState<UploadedPhoto[]>([])
  const [error, setError] = useState("")
  const [isUploading, setIsUploading] = useState(false)
  const [showForm, setShowForm] = useState(true)

  const handleSubmit = async (data: any) => {
    setIsUploading(true)
    setError("")

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!user || !session?.access_token) {
        throw new Error('Debes iniciar sesión para subir fotos')
      }

      const token = session.access_token

      const blob = await fetch(data.imageData).then(r => r.blob())
      const file = new File([blob], data.fileName, { type: 'image/jpeg' })

      const imagenResponse = await uploadImage(file, user.id, token)
      const idImagen = imagenResponse.idImagen

      // Parsear palabras clave desde el input del usuario
      const palabrasClaveUsuario = data.keywords 
        ? data.keywords.split(',').map((k: string) => k.trim()).filter((k: string) => k.length > 0)
        : []

      // Generar palabras clave automáticas como backup
      const palabrasClaveAuto = [
        ...data.people.split(',').map((p: string) => p.trim()).filter((p: string) => p.length > 2),
        ...data.location.split(' ').filter((p: string) => p.length > 2),
        ...data.context.split(' ').slice(0, 5).filter((p: string) => p.length > 2)
      ]

      // Combinar palabras clave del usuario con automáticas (prioridad a las del usuario)
      const palabrasClaveFinal = palabrasClaveUsuario.length > 0 
        ? palabrasClaveUsuario 
        : palabrasClaveAuto.slice(0, 10)

      await crearGroundTruth({
        texto: `Personas: ${data.people}. Lugar: ${data.location}. Contexto: ${data.context}`,
        idImagen,
        palabrasClave: palabrasClaveFinal,
        preguntasGuiaPaciente: [
          '¿Quiénes están en la foto?',
          '¿Dónde fue tomada esta foto?',
          '¿Qué evento o momento representa?'
        ]
      }, token)

      setUploadedPhotos(prev => [...prev, {
        idImagen,
        urlImagen: imagenResponse.urlImagen,
        groundTruthData: {
          people: data.people,
          location: data.location,
          context: data.context,
          keywords: palabrasClaveFinal
        }
      }])

      setShowForm(false)
      setTimeout(() => setShowForm(true), 100)

    } catch (err: any) {
      console.error("Error:", err)
      setError(err.message || "Error al subir la foto. Intenta nuevamente.")
    } finally {
      setIsUploading(false)
    }
  }

  const handleDelete = async (idImagen: number) => {
    if (!confirm('¿Estás seguro de eliminar esta foto?')) return

    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.access_token) {
        throw new Error('Sesión expirada')
      }

      await eliminarImagen(idImagen, session.access_token)
      
      setUploadedPhotos(prev => prev.filter(p => p.idImagen !== idImagen))
    } catch (err: any) {
      setError(err.message || 'Error al eliminar la foto')
    }
  }

  const handleFinish = () => {
    if (uploadedPhotos.length === 0) {
      router.push('/photos/gallery')
    } else {
      router.push('/sessions/create')
    }
  }

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
          {/* Encabezado */}
          <div className="mb-10">
            <h1 className="text-4xl font-bold text-slate-900 mb-3">
              Cargar Imágenes
            </h1>
            <p className="text-slate-600 text-lg">
              Sube las fotos que usarás en las sesiones de evaluación. Puedes subir cuantas necesites.
            </p>
          </div>

          {/* Mensaje de Error */}
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

          {/* Grid Principal */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Columna Izquierda - Formulario */}
            <div className="space-y-6">
              <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8">
                <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-200">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <ImageIcon className="w-6 h-6 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900">
                    Subir Nueva Foto
                  </h2>
                </div>
                
                {showForm && (
                  <PhotoForm
                    onSubmit={handleSubmit}
                    onCancel={() => router.push("/users/cuidador")}
                    isUploading={isUploading}
                  />
                )}

                {isUploading && (
                  <div className="mt-6 bg-gradient-to-r from-purple-50 to-indigo-50 border-2 border-purple-300 rounded-xl p-5">
                    <div className="flex items-center gap-4">
                      <div className="w-6 h-6 border-3 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                      <p className="text-purple-900 font-semibold text-lg">
                        Subiendo imagen...
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Nota Informativa */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-300 rounded-2xl p-6 shadow-md">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-blue-200 rounded-xl flex items-center justify-center flex-shrink-0">
                    <AlertCircle className="w-5 h-5 text-blue-700" />
                  </div>
                  <div>
                    <p className="text-blue-900 font-semibold mb-2">Información importante</p>
                    <p className="text-blue-800 text-sm leading-relaxed">
                      Las fotos se guardarán individualmente. Luego podrás seleccionar hasta 3 fotos para crear una sesión de evaluación.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Columna Derecha - Galería */}
            <div>
              <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8">
                <div className="flex justify-between items-center mb-6 pb-6 border-b border-slate-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-md">
                      <ImageIcon className="w-5 h-5 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900">
                      Fotos Subidas
                    </h2>
                  </div>
                  <span className="px-4 py-2 bg-gradient-to-r from-purple-100 to-indigo-100 text-purple-800 rounded-xl font-bold text-sm border border-purple-200">
                    {uploadedPhotos.length} foto(s)
                  </span>
                </div>

                {uploadedPhotos.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="w-24 h-24 bg-gradient-to-br from-slate-100 to-slate-200 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-inner">
                      <ImageIcon className="w-12 h-12 text-slate-400" />
                    </div>
                    <p className="text-slate-600 font-medium text-lg">
                      Aún no has subido ninguna foto
                    </p>
                    <p className="text-slate-500 text-sm mt-2">
                      Comienza subiendo tu primera imagen
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                    {uploadedPhotos.map((photo) => (
                      <div
                        key={photo.idImagen}
                        className="border-2 border-slate-200 rounded-2xl p-5 hover:border-purple-300 hover:shadow-md transition-all duration-300 bg-gradient-to-br from-white to-slate-50"
                      >
                        <div className="flex gap-5">
                          <div className="flex-shrink-0">
                            <img
                              src={photo.urlImagen}
                              alt="Foto subida"
                              className="w-28 h-28 object-cover rounded-xl shadow-md border-2 border-slate-200"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="space-y-2 mb-3">
                              <p className="text-sm text-slate-800">
                                <span className="font-bold text-slate-900">Personas:</span> {photo.groundTruthData.people}
                              </p>
                              <p className="text-sm text-slate-700">
                                <span className="font-bold text-slate-900">Lugar:</span> {photo.groundTruthData.location}
                              </p>
                              <p className="text-sm text-slate-700">
                                <span className="font-bold text-slate-900">Contexto:</span> {photo.groundTruthData.context}
                              </p>
                            </div>
                            {photo.groundTruthData.keywords.length > 0 && (
                              <div className="flex flex-wrap gap-2 mt-3">
                                {photo.groundTruthData.keywords.map((keyword, idx) => (
                                  <span 
                                    key={idx} 
                                    className="px-3 py-1.5 bg-gradient-to-r from-purple-100 to-indigo-100 text-purple-800 text-xs font-semibold rounded-lg border border-purple-200"
                                  >
                                    {keyword}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                          <button
                            onClick={() => handleDelete(photo.idImagen)}
                            className="flex-shrink-0 w-10 h-10 bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 rounded-xl transition-colors duration-200 flex items-center justify-center border border-red-200"
                            title="Eliminar foto"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {uploadedPhotos.length > 0 && (
                  <div className="mt-8 pt-6 border-t border-slate-200">
                    <button
                      onClick={handleFinish}
                      className="w-full px-6 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:from-purple-700 hover:to-indigo-700 transition-all duration-300 font-bold text-lg shadow-lg hover:shadow-xl"
                    >
                      Finalizar y Crear Sesión
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}