"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Header from "@/app/components/header"
import Footer from "@/app/components/footer"
import DeletePhotoModal from "@/app/components/photos/DeletePhotoModal"
import { Plus, Trash2, Image as ImageIcon, CheckCircle, X, Loader2, Calendar } from "lucide-react"
import { createClient } from "@/utils/supabase/client"

const API_URL = 'https://api.devcorebits.com'

interface Photo {
  idImagen: number
  urlImagen: string
  fechaSubida: string
  idCuidador: string
  idAsset?: string
  idPublicImage?: string
  formato?: string
}

export default function PhotosListPage() {
  const router = useRouter()
  const [photos, setPhotos] = useState<Photo[]>([])
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean
    photoId: number
    photoName: string
  }>({
    isOpen: false,
    photoId: 0,
    photoName: "",
  })
  const [showDeleteSuccess, setShowDeleteSuccess] = useState(false)

  useEffect(() => {
    loadPhotos()
  }, [])

  useEffect(() => {
    if (selectedPhoto) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [selectedPhoto])

  const loadPhotos = async () => {
    setIsLoading(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        alert('Debes iniciar sesión')
        router.push('/authentication/login')
        return
      }

      const response = await fetch(
        `${API_URL}/api/descripciones-imagenes/listarImagenes/${user.id}?page=1&limit=100`
      )

      if (!response.ok) throw new Error('Error al cargar imágenes')
      
      const data = await response.json()
      
      // ✅ CORRECCIÓN: Según tu endpoint, la respuesta es { data: [...], meta: {...} }
      setPhotos(data.data || [])
      
    } catch (error) {
      console.error('Error al cargar fotos:', error)
      alert('Error al cargar las imágenes')
    } finally {
      setIsLoading(false)
    }
  }

  const handlePhotoClick = (photo: Photo) => {
    setSelectedPhoto(photo)
  }

  const closePhotoDetail = () => {
    setSelectedPhoto(null)
  }

  const handleDeleteClick = (photo: Photo, e: React.MouseEvent) => {
    e.stopPropagation()
    setDeleteModal({
      isOpen: true,
      photoId: photo.idImagen,
      photoName: `Imagen #${photo.idImagen}`,
    })
  }

  const handleDeleteConfirm = async (photoId: string) => {
    try {
      const response = await fetch(`${API_URL}/descripciones-imagenes/eliminar/${photoId}`, {
        method: 'DELETE'
      })

      if (!response.ok) throw new Error('Error al eliminar imagen')

      // Actualizar lista local
      setPhotos(photos.filter(photo => photo.idImagen !== parseInt(photoId)))

      setDeleteModal({ isOpen: false, photoId: 0, photoName: "" })
      setShowDeleteSuccess(true)
      setTimeout(() => setShowDeleteSuccess(false), 3000)
      
    } catch (error) {
      console.error('Error al eliminar:', error)
      throw error // Propagar el error al modal
    }
  }

  const handleDeleteCancel = () => {
    setDeleteModal({ isOpen: false, photoId: 0, photoName: "" })
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
            <Loader2 className="w-12 h-12 text-purple-600 animate-spin mx-auto mb-4" />
            <p className="text-slate-600">Cargando imágenes...</p>
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
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-slate-800 mb-2">
                Imágenes Familiares
              </h1>
              <p className="text-slate-600">
                Gestiona las fotografías del paciente para las evaluaciones cognitivas.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => router.push("/sessions/create")}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <Calendar className="w-5 h-5" />
                Nueva Sesión
              </button>

              <button
                onClick={() => router.push("/photos/upload")}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Nueva Imagen
              </button>
            </div>
          </div>

          {showDeleteSuccess && (
            <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-start">
              <CheckCircle className="w-5 h-5 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
              <p className="text-green-800">
                La imagen ha sido eliminada exitosamente.
              </p>
            </div>
          )}

          {photos.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
              <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <ImageIcon className="w-10 h-10 text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-800 mb-2">
                No hay imágenes cargadas
              </h3>
              <p className="text-slate-600 mb-6">
                Comienza agregando fotografías familiares para establecer la evaluación base.
              </p>
              <button
                onClick={() => router.push("/photos/upload")}
                className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors inline-flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Cargar Primera Imagen
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {photos.map((photo) => (
                <div
                  key={photo.idImagen}
                  onClick={() => handlePhotoClick(photo)}
                  className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-all cursor-pointer transform hover:scale-[1.02]"
                >
                  <div className="h-48 bg-gradient-to-br from-purple-100 to-purple-200 flex items-center justify-center overflow-hidden">
                    <img 
                      src={photo.urlImagen} 
                      alt={`Imagen ${photo.idImagen}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Crect fill='%23f1f5f9' width='400' height='400'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%2394a3b8' font-size='16'%3EImagen no disponible%3C/text%3E%3C/svg%3E"
                      }}
                    />
                  </div>

                  <div className="p-4">
                    <h3 className="font-semibold text-slate-800 mb-2">
                      Imagen #{photo.idImagen}
                    </h3>
                    
                    <div className="space-y-2 text-sm text-slate-600 mb-4">
                      <p>
                        <span className="font-medium">Formato:</span> {photo.formato?.toUpperCase() || 'N/A'}
                      </p>
                      <p>
                        <span className="font-medium">Subida:</span> {formatDate(photo.fechaSubida)}
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={(e) => handleDeleteClick(photo, e)}
                        className="flex-1 px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors flex items-center justify-center gap-2 text-sm"
                      >
                        <Trash2 className="w-4 h-4" />
                        Eliminar
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Modal de Detalles */}
      {selectedPhoto && (
        <div 
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={closePhotoDetail}
        >
          <div 
            className="bg-white rounded-xl max-w-3xl w-full max-h-[85vh] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-800">Imagen #{selectedPhoto.idImagen}</h2>
              <button
                onClick={closePhotoDetail}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-slate-600" />
              </button>
            </div>

            <div className="overflow-y-auto max-h-[calc(85vh-80px)]">
              <div className="p-6">
                <div className="mb-6 rounded-lg overflow-hidden bg-slate-50">
                  <img
                    src={selectedPhoto.urlImagen}
                    alt={`Imagen ${selectedPhoto.idImagen}`}
                    className="w-full h-auto object-contain max-h-96"
                    onError={(e) => {
                      e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Crect fill='%23f1f5f9' width='400' height='400'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%2394a3b8' font-size='16'%3EImagen no disponible%3C/text%3E%3C/svg%3E"
                    }}
                  />
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                      ID de Imagen
                    </h3>
                    <p className="text-slate-800 text-base">{selectedPhoto.idImagen}</p>
                  </div>

                  <div>
                    <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                      Formato
                    </h3>
                    <p className="text-slate-800 text-base">{selectedPhoto.formato?.toUpperCase() || 'N/A'}</p>
                  </div>

                  <div className="pt-4 border-t border-slate-200">
                    <p className="text-sm text-slate-600">
                      <span className="font-medium">Fecha de carga:</span> {formatDate(selectedPhoto.fechaSubida)}
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 mt-6 pt-6 border-t border-slate-200">
                  <button
                    onClick={() => {
                      closePhotoDetail()
                      handleDeleteClick(selectedPhoto, { stopPropagation: () => {} } as React.MouseEvent)
                    }}
                    className="flex-1 px-4 py-2.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors flex items-center justify-center gap-2 font-medium"
                  >
                    <Trash2 className="w-4 h-4" />
                    Eliminar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <DeletePhotoModal
        isOpen={deleteModal.isOpen}
        photoId={deleteModal.photoId.toString()}
        photoName={deleteModal.photoName}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />

      <Footer />
    </div>
  )
}