"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Image as ImageIcon, Trash2, AlertCircle, Calendar, CheckCircle } from "lucide-react"
import Header from "@/app/components/header"
import Footer from "@/app/components/footer"
import { createClient } from "@/utils/supabase/client"

const API_URL = 'http://34.117.162.170/api'

interface Photo {
  idImagen: number
  urlImagen: string
  fechaSubida: string
  idCuidador: string
  idAsset: string
  idPublicImage: string
  idSesion: number | null
  formato: string
}

export default function PhotoGalleryPage() {
  const router = useRouter()
  const supabase = createClient()
  const [photos, setPhotos] = useState<Photo[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [deletingId, setDeletingId] = useState<number | null>(null)

  useEffect(() => {
    loadPhotos()
  }, [])

  const loadPhotos = async () => {
    setIsLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.access_token) {
        router.push('/authentication/login')
        return
      }

      const response = await fetch(
        `${API_URL}/descripciones-imagenes/listarImagenes/${session.user.id}?page=1&limit=100`,
        {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          }
        }
      )

      if (!response.ok) {
        throw new Error('Error al cargar imágenes')
      }

      const data = await response.json()
      setPhotos(data.data || [])
    } catch (error: any) {
      console.error('Error:', error)
      setError('Error al cargar las imágenes')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeletePhoto = async (photoId: number) => {
    if (!confirm('¿Estás seguro de eliminar esta imagen? Esta acción no se puede deshacer.')) {
      return
    }

    setDeletingId(photoId)
    setError("")
    setSuccess("")

    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.access_token) {
        router.push('/authentication/login')
        return
      }

      const response = await fetch(
        `${API_URL}/descripciones-imagenes/eliminar/${photoId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          }
        }
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Error al eliminar la imagen')
      }

      setSuccess('Imagen eliminada exitosamente')
      setPhotos(prev => prev.filter(p => p.idImagen !== photoId))
      
      setTimeout(() => setSuccess(""), 3000)
    } catch (error: any) {
      setError(error.message || 'Error al eliminar la imagen')
    } finally {
      setDeletingId(null)
    }
  }

  const canDeletePhoto = (photo: Photo) => {
    // Solo se puede eliminar si no está asignada a una sesión o si han pasado menos de 24 horas
    const uploadDate = new Date(photo.fechaSubida)
    const now = new Date()
    const hoursDiff = (now.getTime() - uploadDate.getTime()) / (1000 * 60 * 60)
    
    return photo.idSesion === null && hoursDiff < 24
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-600">Cargando galería...</p>
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
        <div className="max-w-7xl mx-auto">
          <button
            onClick={() => router.push('/users/cuidador')}
            className="flex items-center gap-2 text-purple-600 hover:text-purple-700 mb-6 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Volver al Dashboard
          </button>

          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-800 mb-2">Galería de Imágenes</h1>
            <p className="text-slate-600">
              Todas las fotografías que has subido para las sesiones de evaluación
            </p>
          </div>

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
              <AlertCircle className="w-5 h-5 text-red-600 mr-3 flex-shrink-0 mt-0.5" />
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-start">
              <CheckCircle className="w-5 h-5 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
              <p className="text-green-800 text-sm">{success}</p>
            </div>
          )}

          {photos.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
              <ImageIcon className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-800 mb-2">
                No hay imágenes en tu galería
              </h3>
              <p className="text-slate-600 mb-6">
                Comienza subiendo tu primera fotografía familiar
              </p>
              <button
                onClick={() => router.push('/photos/upload')}
                className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Subir Primera Imagen
              </button>
            </div>
          ) : (
            <>
              <div className="flex justify-between items-center mb-6">
                <p className="text-slate-600">
                  <span className="font-semibold text-slate-800">{photos.length}</span> imagen(es) en total
                </p>
                <button
                  onClick={() => router.push('/photos/upload')}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Subir Nueva Imagen
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {photos.map((photo) => {
                  const isDeletable = canDeletePhoto(photo)
                  const isInSession = photo.idSesion !== null

                  return (
                    <div
                      key={photo.idImagen}
                      className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow"
                    >
                      <div className="relative">
                        <img
                          src={photo.urlImagen}
                          alt={`Imagen ${photo.idImagen}`}
                          className="w-full h-64 object-cover"
                        />
                        {isInSession && (
                          <div className="absolute top-2 right-2 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" />
                            En sesión
                          </div>
                        )}
                      </div>

                      <div className="p-4">
                        <div className="flex items-center gap-2 text-xs text-slate-600 mb-3">
                          <Calendar className="w-4 h-4" />
                          <span>{formatDate(photo.fechaSubida)}</span>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="text-xs text-slate-500">
                            Formato: <span className="font-medium text-slate-700 uppercase">{photo.formato}</span>
                          </div>

                          {isDeletable ? (
                            <button
                              onClick={() => handleDeletePhoto(photo.idImagen)}
                              disabled={deletingId === photo.idImagen}
                              className="flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {deletingId === photo.idImagen ? (
                                <>
                                  <div className="w-3 h-3 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                                  <span>Eliminando...</span>
                                </>
                              ) : (
                                <>
                                  <Trash2 className="w-4 h-4" />
                                  <span>Eliminar</span>
                                </>
                              )}
                            </button>
                          ) : (
                            <div className="text-xs text-slate-400 italic">
                              {isInSession ? 'Asignada a sesión' : 'No se puede eliminar'}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-800">
                    <p className="font-semibold mb-1">Información sobre la eliminación de imágenes:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Solo puedes eliminar imágenes que no estén asignadas a ninguna sesión</li>
                      <li>Las imágenes solo se pueden eliminar dentro de las primeras 24 horas después de subirlas</li>
                      <li>Si una imagen está en una sesión completada, no se puede eliminar</li>
                    </ul>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}