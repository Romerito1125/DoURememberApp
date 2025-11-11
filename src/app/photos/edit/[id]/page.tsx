"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import Header from "@/app/components/header"
import Footer from "@/app/components/footer"
import PhotoForm from "@/app/components/photos/PhotoForm"
import Loading from "@/app/components/loading"
import { CheckCircle, AlertCircle } from "lucide-react"
import { createClient } from "@/utils/supabase/client"

const API_URL = 'http://localhost:3000/api'

export default function EditPhotoPage() {
  const router = useRouter()
  const params = useParams()
  const photoId = params.id as string

  const [initialData, setInitialData] = useState<any>(null)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")
  const [notFound, setNotFound] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false)

  useEffect(() => {
    loadPhotoData()
  }, [photoId])

  const loadPhotoData = async () => {
    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()

      if (!session?.access_token) {
        router.push('/authentication/login')
        return
      }

      // Obtener información de la imagen usando buscarImagen
      const imageResponse = await fetch(
        `${API_URL}/descripciones-imagenes/buscarImagen/${photoId}`,
        {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        }
      )

      if (!imageResponse.ok) {
        setNotFound(true)
        setIsLoading(false)
        return
      }

      const imageData = await imageResponse.json()

      // El endpoint buscarImagen ya incluye el GROUNDTRUTH
      const groundTruth = imageData.GROUNDTRUTH?.[0]

      // Parsear el texto del ground truth
      let people = ""
      let location = ""
      let context = ""

      if (groundTruth?.texto) {
        const texto = groundTruth.texto
        const peopleMatch = texto.match(/Personas:\s*([^.]+)/)
        const locationMatch = texto.match(/Lugar:\s*([^.]+)/)
        const contextMatch = texto.match(/Contexto:\s*(.+)/)

        people = peopleMatch ? peopleMatch[1].trim() : ""
        location = locationMatch ? locationMatch[1].trim() : ""
        context = contextMatch ? contextMatch[1].trim() : ""
      }

      setInitialData({
        people,
        location,
        context,
        keywords: groundTruth?.palabrasClave?.join(', ') || "",
        previewUrl: imageData.urlImagen,
        groundTruthId: groundTruth?.idGroundtruth
      })

    } catch (error) {
      console.error('Error al cargar datos:', error)
      setError('Error al cargar los datos de la imagen')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (data: any) => {
    setIsUpdating(true)
    setError("")

    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()

      if (!session?.access_token) {
        throw new Error('Sesión no válida')
      }

      const token = session.access_token

      // Actualizar Ground Truth usando actualizarGroundTruth
      if (initialData.groundTruthId) {
        const palabrasClave = data.keywords 
          ? data.keywords.split(',').map((k: string) => k.trim()).filter((k: string) => k.length > 0)
          : []

        const gtResponse = await fetch(
          `${API_URL}/descripciones-imagenes/actualizarGroundTruth/${initialData.groundTruthId}`,
          {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              id: initialData.groundTruthId,
              texto: `Personas: ${data.people}. Lugar: ${data.location}. Contexto: ${data.context}`,
              palabrasClave: palabrasClave.length > 0 ? palabrasClave : undefined
            })
          }
        )

        if (!gtResponse.ok) {
          const errorData = await gtResponse.json()
          throw new Error(errorData.message || 'Error al actualizar la descripción')
        }
      }

      setSuccess(true)
      setTimeout(() => router.push("/photos/gallery"), 2000)

    } catch (error: any) {
      console.error('Error:', error)
      setError(error.message || 'Error al actualizar la imagen')
    } finally {
      setIsUpdating(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <Loading />
        </main>
        <Footer />
      </div>
    )
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto px-6 py-8">
          <div className="max-w-3xl mx-auto">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 flex items-start">
              <AlertCircle className="w-6 h-6 text-red-600 mr-3" />
              <div>
                <h2 className="text-lg font-semibold text-red-800 mb-2">Imagen no encontrada</h2>
                <p className="text-red-700 mb-4">No se encontró la imagen o no tienes permisos.</p>
                <button
                  onClick={() => router.push("/photos/gallery")}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Volver
                </button>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  if (!initialData) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <Loading />
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-6 py-8">
        <div className="max-w-3xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-800 mb-2">Editar Imagen</h1>
            <p className="text-slate-600">Actualiza la información de la fotografía.</p>
          </div>

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
              <AlertCircle className="w-5 h-5 text-red-600 mr-3" />
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-start">
              <CheckCircle className="w-5 h-5 text-green-600 mr-3" />
              <p className="text-green-800 font-medium">
                ¡Cambios guardados! Redirigiendo...
              </p>
            </div>
          )}

          <PhotoForm
            initialData={initialData}
            onSubmit={handleSubmit}
            onCancel={() => router.push("/photos/gallery")}
            isEditMode={true}
            isUploading={isUpdating}
          />
        </div>
      </main>
      <Footer />
    </div>
  )
}