"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { 
  ArrowLeft, 
  Image as ImageIcon, 
  X, 
  Check,
  AlertCircle,
  Loader2,
  User,
  Calendar
} from "lucide-react"
import { createClient } from "@/utils/supabase/client"

const API_URL = 'http://34.117.162.170'

interface Imagen {
  id: number
  url: string
  descripcion: string
  idCuidador: string
}

interface ImagenSeleccionada extends Imagen {
  descripcionSesion: string
}

interface Paciente {
  id: string
  nombre: string
  correo: string
}

export default function CreateSessionPage() {
  const router = useRouter()
  const supabase = createClient()
  
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [showImagePicker, setShowImagePicker] = useState(false)
  const [imagenesDisponibles, setImagenesDisponibles] = useState<Imagen[]>([])
  const [imagenesSeleccionadas, setImagenesSeleccionadas] = useState<ImagenSeleccionada[]>([])
  const [pacientes, setPacientes] = useState<Paciente[]>([])
  const [pacienteSeleccionado, setPacienteSeleccionado] = useState<string>("")
  const [error, setError] = useState<string>("")
  const [userId, setUserId] = useState<string>("")

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError || !session) {
        router.push('/authentication/login')
        return
      }

      setUserId(session.user.id)

      // Cargar imágenes disponibles del cuidador
      const imagenesResponse = await fetch(
        `${API_URL}/api/descripciones-imagenes/listarImagenes/${session.user.id}?page=1&limit=100`,
        {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          }
        }
      )

      if (imagenesResponse.ok) {
        const imagenesData = await imagenesResponse.json()
        setImagenesDisponibles(imagenesData.data || [])
      }

      // Cargar pacientes asociados al cuidador
      const pacientesResponse = await fetch(
        `${API_URL}/api/usuarios-autenticacion/listarUsuarios?rol=paciente&page=1&limit=50`,
        {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          }
        }
      )

      if (pacientesResponse.ok) {
        const pacientesData = await pacientesResponse.json()
        setPacientes(pacientesData.usuarios || [])
      }

    } catch (error) {
      console.error('Error al cargar datos:', error)
      setError('Error al cargar datos')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSelectImage = (imagen: Imagen) => {
    if (imagenesSeleccionadas.length >= 3) {
      alert('Solo puedes seleccionar máximo 3 imágenes por sesión')
      return
    }

    if (imagenesSeleccionadas.find(img => img.id === imagen.id)) {
      alert('Esta imagen ya está seleccionada')
      return
    }

    setImagenesSeleccionadas([
      ...imagenesSeleccionadas,
      { ...imagen, descripcionSesion: '' }
    ])
    setShowImagePicker(false)
  }

  const handleRemoveImage = (imagenId: number) => {
    setImagenesSeleccionadas(
      imagenesSeleccionadas.filter(img => img.id !== imagenId)
    )
  }

  const handleUpdateDescripcion = (imagenId: number, descripcion: string) => {
    setImagenesSeleccionadas(
      imagenesSeleccionadas.map(img => 
        img.id === imagenId 
          ? { ...img, descripcionSesion: descripcion }
          : img
      )
    )
  }

  const handleCreateSession = async () => {
    // Validaciones
    if (imagenesSeleccionadas.length === 0) {
      setError('Debes seleccionar al menos 1 imagen')
      return
    }

    if (imagenesSeleccionadas.length > 3) {
      setError('Solo puedes seleccionar máximo 3 imágenes')
      return
    }

    if (!pacienteSeleccionado) {
      setError('Debes seleccionar un paciente')
      return
    }

    const hayDescripcionesVacias = imagenesSeleccionadas.some(
      img => !img.descripcionSesion.trim()
    )

    if (hayDescripcionesVacias) {
      setError('Todas las imágenes deben tener una descripción')
      return
    }

    setIsSaving(true)
    setError('')

    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        throw new Error('No hay sesión activa')
      }

      // Generar ID único para la sesión
      const sesionId = Date.now()

      // Crear objeto de sesión
      const nuevaSesion = {
        idSesion: sesionId,
        idPaciente: pacienteSeleccionado,
        idCuidador: userId,
        imagenesIds: imagenesSeleccionadas.map(img => img.id),
        imagenes: imagenesSeleccionadas.map(img => ({
          id: img.id,
          url: img.url,
          descripcionOriginal: img.descripcion,
          descripcionSesion: img.descripcionSesion
        })),
        fechaCreacion: new Date().toISOString(),
        completada: false
      }

      // Guardar en localStorage
      const sesionesExistentes = JSON.parse(localStorage.getItem('sesionesImagenes') || '[]')
      sesionesExistentes.push(nuevaSesion)
      localStorage.setItem('sesionesImagenes', JSON.stringify(sesionesExistentes))

      console.log('✅ Sesión creada:', nuevaSesion)

      alert('¡Sesión creada exitosamente!')
      router.push('/users/cuidador')

    } catch (error: any) {
      console.error('Error al crear sesión:', error)
      setError(error.message || 'Error al crear la sesión')
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-purple-600 animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Cargando datos...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.push('/users/cuidador')}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-800 mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            Volver al panel
          </button>

          <div className="bg-white rounded-lg p-6 shadow-sm border border-slate-200">
            <h1 className="text-3xl font-bold text-slate-800 mb-2">Crear Nueva Sesión</h1>
            <p className="text-slate-600">
              Selecciona hasta 3 imágenes y agrega descripciones para crear una sesión de evaluación
            </p>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-red-800 font-medium">Error</p>
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* Seleccionar Paciente */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-slate-200 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <User className="w-5 h-5 text-purple-600" />
            <h2 className="text-xl font-bold text-slate-800">Seleccionar Paciente</h2>
          </div>

          {pacientes.length === 0 ? (
            <div className="text-center py-8">
              <User className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-600">No hay pacientes disponibles</p>
            </div>
          ) : (
            <select
              value={pacienteSeleccionado}
              onChange={(e) => setPacienteSeleccionado(e.target.value)}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              disabled={isSaving}
            >
              <option value="">Selecciona un paciente</option>
              {pacientes.map((paciente) => (
                <option key={paciente.id} value={paciente.id}>
                  {paciente.nombre} - {paciente.correo}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Imágenes Seleccionadas */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-slate-200 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-purple-600" />
              <h2 className="text-xl font-bold text-slate-800">
                Imágenes Seleccionadas ({imagenesSeleccionadas.length}/3)
              </h2>
            </div>

            {imagenesSeleccionadas.length < 3 && (
              <button
                onClick={() => setShowImagePicker(true)}
                disabled={isSaving}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
              >
                Agregar Imagen
              </button>
            )}
          </div>

          {imagenesSeleccionadas.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-lg">
              <ImageIcon className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-600 mb-4">No has seleccionado ninguna imagen</p>
              <button
                onClick={() => setShowImagePicker(true)}
                disabled={isSaving}
                className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
              >
                Seleccionar Primera Imagen
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {imagenesSeleccionadas.map((imagen, index) => (
                <div
                  key={imagen.id}
                  className="border border-slate-200 rounded-lg p-4 hover:border-purple-300 transition-colors"
                >
                  <div className="flex gap-4">
                    {/* Imagen Preview */}
                    <div className="w-32 h-32 flex-shrink-0 bg-slate-100 rounded-lg overflow-hidden">
                      <img
                        src={imagen.url}
                        alt={`Imagen ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Descripción */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="font-semibold text-slate-800">Imagen {index + 1}</p>
                          <p className="text-sm text-slate-500">
                            Descripción original: {imagen.descripcion}
                          </p>
                        </div>
                        <button
                          onClick={() => handleRemoveImage(imagen.id)}
                          disabled={isSaving}
                          className="text-red-600 hover:text-red-700 disabled:opacity-50"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Descripción para la sesión *
                        </label>
                        <textarea
                          value={imagen.descripcionSesion}
                          onChange={(e) => handleUpdateDescripcion(imagen.id, e.target.value)}
                          placeholder="Escribe la descripción que el paciente deberá recordar..."
                          disabled={isSaving}
                          rows={3}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 disabled:opacity-50"
                        />
                        <p className="text-xs text-slate-500 mt-1">
                          Esta descripción será visible para el paciente después de que complete la sesión
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Botones de Acción */}
        <div className="flex gap-4">
          <button
            onClick={() => router.push('/users/cuidador')}
            disabled={isSaving}
            className="flex-1 px-6 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>

          <button
            onClick={handleCreateSession}
            disabled={isSaving || imagenesSeleccionadas.length === 0}
            className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Creando Sesión...
              </>
            ) : (
              <>
                <Check className="w-5 h-5" />
                Crear Sesión
              </>
            )}
          </button>
        </div>

        {/* Info Box */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Información importante:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Puedes seleccionar entre 1 y 3 imágenes por sesión</li>
                <li>Cada imagen debe tener una descripción para la sesión</li>
                <li>El paciente verá estas imágenes y deberá describirlas</li>
                <li>Después podrás comparar las descripciones del paciente con las tuyas</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Modal: Seleccionar Imagen */}
      {showImagePicker && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-6">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-800">Seleccionar Imagen</h3>
              <button
                onClick={() => setShowImagePicker(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6">
              {imagenesDisponibles.length === 0 ? (
                <div className="text-center py-12">
                  <ImageIcon className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-600 mb-4">No hay imágenes disponibles</p>
                  <button
                    onClick={() => {
                      setShowImagePicker(false)
                      router.push('/photos/upload')
                    }}
                    className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    Subir Primera Imagen
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {imagenesDisponibles
                    .filter(img => !imagenesSeleccionadas.find(selected => selected.id === img.id))
                    .map((imagen) => (
                      <button
                        key={imagen.id}
                        onClick={() => handleSelectImage(imagen)}
                        className="group relative aspect-square bg-slate-100 rounded-lg overflow-hidden border-2 border-transparent hover:border-purple-600 transition-all"
                      >
                        <img
                          src={imagen.url}
                          alt={imagen.descripcion}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <Check className="w-8 h-8 text-white" />
                          </div>
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                          <p className="text-white text-sm font-medium line-clamp-2">
                            {imagen.descripcion}
                          </p>
                        </div>
                      </button>
                    ))}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-200">
              <button
                onClick={() => setShowImagePicker(false)}
                className="w-full px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}