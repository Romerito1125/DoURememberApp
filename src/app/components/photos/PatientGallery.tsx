"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { 
  ChevronLeft, 
  ChevronRight,
  AlertCircle,
  Save,
  Loader2,
  Users,
  MapPin,
  FileText,
  Sparkles,
  Info,
  CheckCircle
} from "lucide-react"
import Header from "@/app/components/header"
import Footer from "@/app/components/footer"
import WelcomeModal from "@/app/components/photos/WelcomeModal"
import { createClient } from "@/utils/supabase/client"

const API_URL = 'http://localhost:3000'

interface Photo {
  idImagen: number
  urlImagen: string
  fechaSubida: string
  idCuidador: string
  DESCRIPCION?: any[]
}

interface SessionImage {
  idSesion: number
  idPaciente: string
  activacion: boolean
  IMAGEN: Photo[]
  fechaCreacion: string
}

type DescriptionStep = 'personas' | 'lugar' | 'contexto' | 'detalles'

const STEPS: { key: DescriptionStep; label: string; icon: any; placeholder: string; tip: string }[] = [
  {
    key: 'personas',
    label: '¿Quiénes están en la imagen?',
    icon: Users,
    placeholder: 'Por ejemplo: "Yo estaba con mi tío Carlos, mi prima Laura y mi hermana Ana. Mi tío tenía unos 50 años..."',
    tip: '💜 Tómate tu tiempo. Menciona los nombres de las personas y cómo se relacionan contigo. ¡Cada detalle es valioso!'
  },
  {
    key: 'lugar',
    label: '¿Dónde fue tomada esta foto?',
    icon: MapPin,
    placeholder: 'Por ejemplo: "Esto fue en la casa de mi abuela en el barrio Granada, Cali, en el patio donde jugábamos..."',
    tip: '🌟 ¡Excelente! Describe el lugar con todos los detalles que recuerdes: ciudad, barrio, nombre del sitio...'
  },
  {
    key: 'contexto',
    label: '¿Qué estaba sucediendo?',
    icon: FileText,
    placeholder: 'Por ejemplo: "Era el cumpleaños 70 de mi abuela. Celebramos toda la familia, había música y bailamos..."',
    tip: '✨ ¡Vas muy bien! Cuéntanos sobre el evento: ¿qué celebraban? ¿Cuándo fue? ¿Qué hacían?'
  },
  {
    key: 'detalles',
    label: 'Otros detalles que recuerdes',
    icon: Sparkles,
    placeholder: 'Por ejemplo: "Hacía mucho calor, todos estaban felices, había torta de chocolate, mi abuela lucía un vestido azul..."',
    tip: '🎉 ¡Último paso! Todo lo que recuerdes es importante: clima, emociones, olores, sabores, colores. ¡Lo estás haciendo excelente!'
  }
]

export default function PatientGalleryWithWelcome() {
  const router = useRouter()
  const [showWelcome, setShowWelcome] = useState(true)
  const [photos, setPhotos] = useState<Photo[]>([])
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0)
  const [currentStep, setCurrentStep] = useState<number>(0)
  const [userId, setUserId] = useState<string | null>(null)
  const [sesionActiva, setSesionActiva] = useState<SessionImage | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState(false)
  
  const [descriptions, setDescriptions] = useState<Record<DescriptionStep, string>>({
    personas: '',
    lugar: '',
    contexto: '',
    detalles: ''
  })

  useEffect(() => {
    initSession()
  }, [])

  const initSession = async () => {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!user || !session?.access_token) {
      alert('Debes iniciar sesión')
      router.push('/authentication/login')
      return
    }

    setUserId(user.id)
    const token = session.access_token

    // Obtener el ID de la sesión desde localStorage
    const sessionId = localStorage.getItem('currentSessionId')
    
    if (!sessionId) {
      setError('No hay sesión activa. Contacta a tu cuidador para que cree y active una sesión.')
      setIsLoading(false)
      return
    }

    // Buscar la sesión específica
    const sesionResponse = await fetch(
      `${API_URL}/api/descripciones-imagenes/buscarSesion/${sessionId}`,
      { headers: { "Authorization": `Bearer ${token}` } }
    )

    if (!sesionResponse.ok) {
      throw new Error('No se pudo cargar la sesión')
    }

    const sesionData = await sesionResponse.json()
    
    console.log('📊 Datos de la sesión:', sesionData) // DEBUG
    
    // Verificar que la sesión esté activada
    if (!sesionData.activacion) {
      setError('Esta sesión no está activada. Contacta a tu cuidador.')
      setIsLoading(false)
      return
    }

    // Verificar que la sesión pertenezca al paciente
    if (sesionData.idPaciente !== user.id) {
      setError('Esta sesión no te pertenece')
      setIsLoading(false)
      return
    }

    setSesionActiva(sesionData)

    // Obtener las imágenes de la sesión - IMPORTANTE: mapear correctamente
    const imagenesSesion = (sesionData.IMAGEN || []).map((img: any) => ({
      idImagen: img.idImagen || img.id_imagen || img.id, // Probar diferentes nombres de campo
      urlImagen: img.urlImagen || img.url_imagen || img.url,
      fechaSubida: img.fechaSubida || img.fecha_subida,
      idCuidador: img.idCuidador || img.id_cuidador || '',
      DESCRIPCION: img.DESCRIPCION || []
    }))
    
    console.log('🖼️ Imágenes mapeadas:', imagenesSesion) // DEBUG
    
    if (imagenesSesion.length === 0) {
      setError('Esta sesión no tiene imágenes asignadas')
      setIsLoading(false)
      return
    }

    setPhotos(imagenesSesion)

    // Encontrar la primera imagen sin descripción
    const primeraImagenSinDescribir = imagenesSesion.findIndex(
      (img: Photo) => !img.DESCRIPCION || img.DESCRIPCION.length === 0
    )

    if (primeraImagenSinDescribir !== -1) {
      setCurrentPhotoIndex(primeraImagenSinDescribir)
    } else {
      // Todas las imágenes ya están descritas
      alert('¡Felicitaciones! Ya completaste todas las descripciones de esta sesión.')
      localStorage.removeItem('currentSessionId')
      router.push('/users/patient')
      return
    }
    
  } catch (error: any) {
    console.error('Error al inicializar:', error)
    setError(error.message || 'Error al cargar la sesión')
  } finally {
    setIsLoading(false)
  }
}

  const handleNextStep = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSaveDescription = async () => {
  if (!sesionActiva || !userId) return

  const hasContent = Object.values(descriptions).some(desc => desc.trim().length > 0)
  if (!hasContent) {
    setError('Debes escribir al menos algo en alguno de los campos antes de guardar')
    setTimeout(() => setError(null), 4000)
    return
  }

  setIsSaving(true)
  setError(null)

  try {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()

    if (!session?.access_token) {
      throw new Error('Sesión no válida')
    }

    const token = session.access_token

    const textoCompleto = `
Personas: ${descriptions.personas || 'No especificado'}

Lugar: ${descriptions.lugar || 'No especificado'}

Contexto: ${descriptions.contexto || 'No especificado'}

Detalles adicionales: ${descriptions.detalles || 'No especificado'}
    `.trim()

    const currentPhoto = photos[currentPhotoIndex]
    
    if (!currentPhoto.idImagen || typeof currentPhoto.idImagen !== 'number' || currentPhoto.idImagen <= 0) {
      console.error('❌ idImagen inválido:', currentPhoto)
      throw new Error(`ID de imagen inválido: ${currentPhoto.idImagen}. Por favor recarga la página.`)
    }

    console.log('📤 Enviando descripción:', {
      texto: textoCompleto.substring(0, 50) + '...',
      idImagen: currentPhoto.idImagen,
      idPaciente: userId
    })

    const payload = {
      texto: textoCompleto,
      idImagen: currentPhoto.idImagen,
      idPaciente: userId
    }

    const response = await fetch(`${API_URL}/api/descripciones-imagenes/crearDescripcion`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error('❌ Error del servidor:', errorData)
      throw new Error(errorData.message || 'Error al guardar descripción')
    }

    const result = await response.json()
    console.log('✅ Descripción guardada:', result)

    // Actualizar el array local de fotos
    const updatedPhotos = [...photos]
    updatedPhotos[currentPhotoIndex] = {
      ...currentPhoto,
      DESCRIPCION: [result] // Agregar la descripción recién creada
    }
    setPhotos(updatedPhotos)

    // Verificar si esta era la última foto
    const nextImageIndex = updatedPhotos.findIndex(
      (img, idx) => idx > currentPhotoIndex && (!img.DESCRIPCION || img.DESCRIPCION.length === 0)
    )

    const esUltimaFoto = nextImageIndex === -1

    // Si completó todas las fotos, actualizar estado de la sesión
    if (esUltimaFoto && sesionActiva) {
      console.log('🎉 Última foto completada, actualizando estado de sesión...')
      
      try {
        const updateResponse = await fetch(
          `${API_URL}/api/descripciones-imagenes/actualizarSesion/${sesionActiva.idSesion}`,
          {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              estado: 'completado'
            })
          }
        )

        if (updateResponse.ok) {
          console.log('✅ Estado de sesión actualizado a completado')
        } else {
          console.error('⚠️ No se pudo actualizar el estado de la sesión')
        }
      } catch (updateError) {
        console.error('⚠️ Error al actualizar estado:', updateError)
        // No lanzar error, la descripción ya se guardó
      }
    }

    // Obtener el mensaje de la IA
    const mensajeIA = result.resultados?.conclusion || "¡Excelente trabajo! Has completado esta descripción."

    setSaveSuccess(true)

    // Mostrar modal con mensaje de la IA
    const modalHtml = `
      <div style="text-align: center; padding: 20px;">
        <div style="font-size: 48px; margin-bottom: 16px;">🌟</div>
        <h3 style="color: #7c3aed; font-size: 24px; font-weight: bold; margin-bottom: 16px;">
          ¡Descripción guardada!
        </h3>
        <div style="background: linear-gradient(135deg, #f3e7ff 0%, #e9d5ff 100%); padding: 20px; border-radius: 12px; margin-bottom: 20px;">
          <p style="color: #581c87; font-size: 16px; line-height: 1.6; margin: 0;">
            ${mensajeIA}
          </p>
        </div>
        <p style="color: #64748b; font-size: 14px; margin-top: 16px;">
          ${esUltimaFoto ? '¡Has completado todas las fotos!' : 'Avanzando a la siguiente foto...'}
        </p>
      </div>
    `

    // Crear y mostrar modal personalizado
    const modalOverlay = document.createElement('div')
    modalOverlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
      animation: fadeIn 0.3s ease;
    `

    const modalContent = document.createElement('div')
    modalContent.style.cssText = `
      background: white;
      border-radius: 16px;
      max-width: 500px;
      width: 90%;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      animation: slideUp 0.3s ease;
    `

    modalContent.innerHTML = modalHtml
    modalOverlay.appendChild(modalContent)
    document.body.appendChild(modalOverlay)

    // Agregar estilos de animación
    const style = document.createElement('style')
    style.textContent = `
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      @keyframes slideUp {
        from { transform: translateY(20px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }
    `
    document.head.appendChild(style)

    setTimeout(() => {
      document.body.removeChild(modalOverlay)
      document.head.removeChild(style)
      
      setDescriptions({
        personas: '',
        lugar: '',
        contexto: '',
        detalles: ''
      })
      setCurrentStep(0)
      setSaveSuccess(false)

      if (esUltimaFoto) {
        localStorage.removeItem('currentSessionId')
        router.push('/users/patient')
      } else {
        setCurrentPhotoIndex(nextImageIndex)
      }
    }, 4000) // 4 segundos para leer el mensaje

  } catch (error: any) {
    console.error('❌ Error al guardar:', error)
    setError(error.message || 'Error al guardar la descripción. Por favor intenta nuevamente.')
  } finally {
    setIsSaving(false)
  }
}

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-50 to-slate-50 flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-purple-600 animate-spin mx-auto mb-4" />
            <p className="text-slate-600">Cargando sesión...</p>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  if (error && !sesionActiva) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-50 to-slate-50 flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center p-6">
          <div className="bg-white rounded-xl shadow-lg p-8 max-w-md">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-slate-800 mb-2 text-center">Sin sesión activa</h2>
            <p className="text-slate-600 text-center mb-6">{error}</p>
            <button
              onClick={() => router.push('/users/patient')}
              className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              Volver al inicio
            </button>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  if (photos.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-50 to-slate-50 flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center p-6">
          <div className="text-center">
            <AlertCircle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
            <p className="text-slate-600">No hay imágenes en esta sesión</p>
            <button
              onClick={() => router.push('/users/patient')}
              className="mt-4 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              Volver al inicio
            </button>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  const currentPhoto = photos[currentPhotoIndex]
  const currentStepData = STEPS[currentStep]
  const Icon = currentStepData.icon

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-slate-50 flex flex-col">
      <Header />

      <WelcomeModal
        isOpen={showWelcome}
        onClose={() => setShowWelcome(false)}
        onStart={() => setShowWelcome(false)}
      />

      <main className="flex-1 container mx-auto px-6 py-12">
        <div className="max-w-6xl mx-auto">
          {/* Progreso */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-2xl font-bold text-slate-800">
                📸 Foto {currentPhotoIndex + 1} de {photos.length}
              </h2>
              <button
                onClick={() => setShowWelcome(true)}
                className="text-purple-600 hover:text-purple-700 text-sm font-medium flex items-center gap-1"
              >
                <Info className="w-4 h-4" />
                Ver instrucciones
              </button>
            </div>
            
            <div className="w-full bg-slate-200 rounded-full h-2 mb-1">
              <div
                className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                style={{ 
                  width: `${((currentPhotoIndex * STEPS.length + currentStep) / (photos.length * STEPS.length)) * 100}%` 
                }}
              />
            </div>
            <p className="text-xs text-slate-500 text-right">
              Progreso total: {Math.round(((currentPhotoIndex * STEPS.length + currentStep) / (photos.length * STEPS.length)) * 100)}%
            </p>
          </div>

          {saveSuccess && (
            <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3 animate-in fade-in duration-300">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
              <div>
                <p className="text-green-800 font-medium">¡Descripción guardada exitosamente!</p>
                <p className="text-green-700 text-sm">Avanzando a la siguiente foto...</p>
              </div>
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-8">
            {/* Imagen */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <img
                src={currentPhoto.urlImagen}
                alt={`Foto ${currentPhotoIndex + 1}`}
                className="w-full h-[500px] object-contain bg-slate-50"
                onError={(e) => {
                  e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Crect fill='%23f1f5f9' width='400' height='400'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%2394a3b8' font-size='16'%3EImagen no disponible%3C/text%3E%3C/svg%3E"
                }}
              />
            </div>

            {/* Formulario de descripción */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center gap-3 mb-6 pb-6 border-b border-slate-200">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <Icon className="w-6 h-6 text-purple-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-slate-800">
                    {currentStepData.label}
                  </h3>
                  <p className="text-sm text-slate-500">
                    Paso {currentStep + 1} de {STEPS.length}
                  </p>
                </div>
              </div>

              <div className="flex gap-2 mb-6">
                {STEPS.map((step, index) => (
                  <div
                    key={step.key}
                    className={`flex-1 h-2 rounded-full transition-all ${
                      index === currentStep
                        ? 'bg-purple-600'
                        : index < currentStep
                        ? 'bg-green-500'
                        : 'bg-slate-200'
                    }`}
                  />
                ))}
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                <p className="text-blue-800 text-sm">{currentStepData.tip}</p>
              </div>

              {error && (
                <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-red-800 text-sm">{error}</p>
                </div>
              )}

              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Escribe aquí:
                </label>
                <textarea
                  value={descriptions[currentStepData.key]}
                  onChange={(e) => {
                    setDescriptions({
                      ...descriptions,
                      [currentStepData.key]: e.target.value
                    })
                    setError(null)
                  }}
                  placeholder={currentStepData.placeholder}
                  rows={8}
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200 focus:outline-none resize-none text-slate-800"
                  disabled={isSaving}
                />
                <p className="text-xs text-slate-500 mt-1">
                  {descriptions[currentStepData.key].length} caracteres
                </p>
              </div>

              <div className="flex gap-3">
                {currentStep > 0 && (
                  <button
                    onClick={handlePrevStep}
                    disabled={isSaving}
                    className="flex-1 px-4 py-3 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <ChevronLeft className="w-5 h-5" />
                    Anterior
                  </button>
                )}

                {currentStep < STEPS.length - 1 ? (
                  <button
                    onClick={handleNextStep}
                    disabled={isSaving}
                    className="flex-1 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    Siguiente
                    <ChevronRight className="w-5 h-5" />
                  </button>
                ) : (
                  <button
                    onClick={handleSaveDescription}
                    disabled={isSaving || saveSuccess}
                    className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Guardando...
                      </>
                    ) : (
                      <>
                        <Save className="w-5 h-5" />
                        Guardar y continuar
                      </>
                    )}
                  </button>
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