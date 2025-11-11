"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { 
  LogOut, 
  Trophy, 
  Target, 
  Clock, 
  User, 
  Stethoscope, 
  Heart, 
  Camera, 
  Menu, 
  X, 
  Home, 
  FileText, 
  AlertCircle, 
  CheckCircle,
  Activity,
  Award,
  Sparkles
} from "lucide-react"
import { authService } from "@/services/auth.service"
import { createClient } from "@/utils/supabase/client"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DashboardHeader } from "@/components/dashboard-header"
import UserAvatar from "@/components/UserAvatar"

const API_URL = 'http://localhost:3000/api'

interface Session {
  idSesion: number
  estado: 'en_curso' | 'completado' | 'pendiente'
  fechaCreacion: string
  sessionTotal: number
  activacion: boolean
  idPaciente: string
  IMAGEN: Array<{
    urlImagen: string
    idImagen: number
    DESCRIPCION: Array<{
      texto: string
      fecha: string
    }>
  }>
}

interface UserProfile {
  idUsuario: string
  nombre: string
  correo: string
  rol: string
  fechaNacimiento: string
  avatarUrl?: string
}

interface Doctor {
  idUsuario: string
  nombre: string
  correo: string
}

const MOTIVATIONAL_MESSAGES = [
  "¡Excelente trabajo! Cada recuerdo cuenta 🌟",
  "¡Estás haciendo un gran progreso! 💪",
  "¡Sigue así! Tus recuerdos son valiosos 💜",
  "¡Increíble dedicación! 🎯",
  "¡Cada descripción nos ayuda más! ⭐",
  "¡Fantástico! Tu memoria es poderosa 🧠",
  "¡Bravo! Continúa con ese entusiasmo 🎉",
]

export default function PatientDashboard() {
  const router = useRouter()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [doctor, setDoctor] = useState<Doctor | null>(null)
  const [sesionesActivas, setSesionesActivas] = useState<Session[]>([])
  const [sesionesCompletadas, setSesionesCompletadas] = useState<Session[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showPhotoUpload, setShowPhotoUpload] = useState(false)
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [patientName, setPatientName] = useState<string>("")
const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!user || !session?.access_token) {
        router.push('/authentication/login')
        return
      }

      const token = session.access_token

      const perfilResponse = await fetch(
        `${API_URL}/usuarios-autenticacion/buscarUsuario/${user.id}`,
        { headers: { "Authorization": `Bearer ${token}` } }
      )
      
      if (perfilResponse.ok) {
        const perfilData = await perfilResponse.json()
        if (perfilData.usuarios && perfilData.usuarios.length > 0) {
          const usuario = perfilData.usuarios[0]
          
          if (usuario.rol !== 'paciente') {
            alert(`No tienes permisos para acceder a este panel. Tu rol es: ${usuario.rol}`)
            switch (usuario.rol) {
              case 'medico':
                router.push('/users/doctor')
                break
              case 'cuidador':
                router.push('/users/cuidador')
                break
              case 'administrador':
                router.push('/users/admin')
                break
              default:
                router.push('/')
            }
            return
          }
          
          setProfile(usuario)
        }
      }

      const medicoResponse = await fetch(
        `${API_URL}/usuarios-autenticacion/medicoPaciente/${user.id}`,
        { headers: { "Authorization": `Bearer ${token}` } }
      )
      
      if (medicoResponse.ok) {
        const medicoData = await medicoResponse.json()
        setDoctor(medicoData)
      }

      const allSessionsResponse = await fetch(
        `${API_URL}/descripciones-imagenes/listarSesiones?idPaciente=${user.id}&page=1&limit=100`,
        { headers: { "Authorization": `Bearer ${token}` } }
      )
      
      if (allSessionsResponse.ok) {
        const allSessionsData = await allSessionsResponse.json()
        const todasSesiones = allSessionsData.data || []
        
        const sesionesActivasFiltradas = todasSesiones.filter((s: Session) => 
          (s.estado === 'en_curso' || s.estado === 'pendiente') && s.activacion === true
        )
        setSesionesActivas(sesionesActivasFiltradas)

        const sesionesCompletadasFiltradas = todasSesiones.filter((s: Session) => 
          s.estado === 'completado'
        )
        setSesionesCompletadas(sesionesCompletadasFiltradas)
      }

    } catch (error) {
      console.error('Error al cargar datos:', error)
      alert('Error al cargar tus datos. Por favor intenta nuevamente.')
      router.push('/authentication/login')
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = async () => {
    setIsLoggingOut(true)
    
    try {
      await authService.logout()
      localStorage.clear()
      sessionStorage.clear()
      window.location.href = '/authentication/login'
    } catch (error) {
      console.error('Error al cerrar sesión:', error)
      localStorage.clear()
      sessionStorage.clear()
      window.location.href = '/authentication/login'
    } finally {
      setIsLoggingOut(false)
    }
  }

  const handleUploadPhoto = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsUploadingPhoto(true)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      const { data: { session } } = await supabase.auth.getSession()

      if (!user || !session?.access_token) {
        throw new Error('Sesión no válida')
      }

      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch(
        `${API_URL}/descripciones-imagenes/uploadFotoPerfil`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          },
          body: formData
        }
      )

      if (!response.ok) throw new Error('Error al subir foto')

      const data = await response.json()
      
      if (profile) {
        setProfile({
          ...profile,
          avatarUrl: data.urlImagen
        })
      }

      alert('Foto de perfil actualizada exitosamente')
      setShowPhotoUpload(false)
    } catch (error) {
      console.error('Error al subir foto:', error)
      alert('Error al subir la foto de perfil')
    } finally {
      setIsUploadingPhoto(false)
    }
  }

  const handleStartSession = (session: Session) => {
    if (!session.activacion) {
      alert('Esta sesión no está activada aún. Contacta a tu cuidador.')
      return
    }

    const imagenes = session.IMAGEN || []
    const descripcionesCount = imagenes.reduce(
      (count, img) => count + (img.DESCRIPCION?.length || 0), 
      0
    )

    if (descripcionesCount >= imagenes.length && imagenes.length > 0) {
      alert('Ya completaste esta sesión')
      return
    }
    
    localStorage.setItem('currentSessionId', session.idSesion.toString())
    router.push('/photos/patient')
  }

  const handleViewProfile = () => {
    router.push('/users/profile')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">Cargando tu información...</p>
        </div>
      </div>
    )
  }

  const totalSesiones = sesionesActivas.length + sesionesCompletadas.length

  return (
    <div className="bg-gradient-to-br from-pink-100 to-indigo-800">
      {/* Header */}
      <div className="sticky top-0 z-50 backdrop-blur-xl bg-white/80 border-b border-purple-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <DashboardHeader />
        </div>
      </div>

      {/* Layout Principal */}
      <div className="flex">
        {/* Sidebar - Desktop */}
        <aside className="hidden lg:flex w-80 bg-gradient-to-b from-purple-900 via-purple-800 to-indigo-900 min-h-[calc(100vh-73px)] flex-col sticky top-[73px] shadow-2xl">
          <div className="p-8 space-y-8 flex-1">
            {/* Título Sidebar */}
            <div className="border-b border-purple-700 pb-6">
              <h3 className="text-white text-lg font-semibold tracking-wide">
                Información Médica
              </h3>
            </div>

            {/* Médico Asociado */}
            {doctor && (
              <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 shadow-xl">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg flex-shrink-0 border border-white/30">
                    <Stethoscope className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-purple-200 font-medium uppercase tracking-wider mb-2">
                      Médico Tratante
                    </p>
                    <p className="font-bold text-white text-base leading-tight mb-1">
                      {doctor.nombre}
                    </p>
                    <p className="text-sm text-purple-200 truncate">
                      {doctor.correo}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* Contenido Principal */}
        <main className="flex-1 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="space-y-10">
            {/* Card de Perfil Principal */}
            <div className="bg-gradient-to-r from-purple-600 via-purple-700 to-indigo-700 rounded-3xl shadow-2xl overflow-hidden">
              <div className="p-8 sm:p-12">
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-8">
                  {/* Avatar */}
                  <div className="relative">
                    <div className="w-32 h-32 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center border-4 border-white/40 shadow-2xl">
                      {profile?.avatarUrl ? (
                        <img
                          src={profile.avatarUrl}
                          alt="Avatar"
                          className="w-full h-full rounded-2xl object-cover"
                        />
                      ) : (
                        <span className="text-white text-5xl font-bold">
                          {profile?.nombre?.charAt(0)?.toUpperCase() || "?"}
                        </span>
                      )}
                    </div>
                    <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-400 rounded-full border-4 border-white shadow-lg"></div>
                  </div>

                  {/* Info del Perfil */}
                  <div className="flex-1 text-center sm:text-left">
                    <h1 className="text-4xl font-bold text-white mb-3">
                      Bienvenido, {profile?.nombre || "Usuario"}
                    </h1>
                    <p className="text-purple-100 text-lg mb-6">
                      Panel de gestión del paciente
                    </p>
                    
                    <div className="flex flex-wrap gap-3 justify-center sm:justify-start">
                      <Button
                        onClick={handleViewProfile}
                        className="bg-white/20 hover:bg-white/30 text-white border-2 border-white/40 rounded-xl font-semibold px-6 py-3 backdrop-blur-sm transition-all duration-300"
                      >
                        <User className="w-4 h-4 mr-2" />
                        Mi Perfil
                      </Button>
                      <Button
                        onClick={handleLogout}
                        disabled={isLoggingOut}
                        className="bg-white/10 hover:bg-red-500/80 text-white border-2 border-white/40 rounded-xl font-semibold px-6 py-3 backdrop-blur-sm transition-all duration-300 disabled:opacity-50"
                      >
                        {isLoggingOut ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                            Cerrando...
                          </>
                        ) : (
                          <>
                            <LogOut className="w-4 h-4 mr-2" />
                            Cerrar Sesión
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Médico Asociado - Versión Móvil */}
            {doctor && (
              <Card className="lg:hidden bg-gradient-to-br from-purple-50 to-indigo-50 border-2 border-purple-200 rounded-2xl p-6 shadow-lg">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center shadow-md flex-shrink-0">
                    <Stethoscope className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-purple-600 font-semibold uppercase tracking-wide mb-2">
                      Médico Tratante
                    </p>
                    <p className="font-bold text-slate-900 text-base leading-tight mb-1">
                      {doctor.nombre}
                    </p>
                    <p className="text-sm text-slate-600 truncate">
                      {doctor.correo}
                    </p>
                  </div>
                </div>
              </Card>
            )}

            {/* Mensaje de Bienvenida */}
            <Card className="bg-white border border-slate-200 shadow-md rounded-2xl p-8">
              <div className="flex items-start gap-6">
                <div className="w-14 h-14 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0">
                  <Sparkles className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 mb-2">
                    Hola, {profile?.nombre.split(' ')[0]}
                  </h2>
                  <p className="text-slate-600 leading-relaxed">
                    Cada recuerdo que compartes es valioso. Continúa describiendo tus momentos especiales.
                  </p>
                </div>
              </div>
            </Card>

            {/* Estadísticas */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <Card className="bg-gradient-to-br from-purple-600 to-purple-700 border-0 shadow-xl hover:shadow-2xl transition-all duration-300 p-8">
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                      <Target className="w-7 h-7 text-white" />
                    </div>
                    <span className="text-5xl font-bold text-white">{sesionesActivas.length}</span>
                  </div>
                  <p className="text-purple-100 text-sm font-medium">Sesiones Disponibles</p>
                </div>
              </Card>

              <Card className="bg-gradient-to-br from-indigo-600 to-indigo-700 border-0 shadow-xl hover:shadow-2xl transition-all duration-300 p-8">
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                      <Trophy className="w-7 h-7 text-white" />
                    </div>
                    <span className="text-5xl font-bold text-white">{sesionesCompletadas.length}</span>
                  </div>
                  <p className="text-indigo-100 text-sm font-medium">Sesiones Completadas</p>
                </div>
              </Card>

              <Card className="bg-gradient-to-br from-purple-700 to-indigo-800 border-0 shadow-xl hover:shadow-2xl transition-all duration-300 p-8">
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                      <FileText className="w-7 h-7 text-white" />
                    </div>
                    <span className="text-5xl font-bold text-white">{totalSesiones}</span>
                  </div>
                  <p className="text-purple-100 text-sm font-medium">Total de Sesiones</p>
                </div>
              </Card>
            </div>

            {/* Sesiones Activas */}
            <Card className="bg-white border border-slate-200 shadow-md rounded-2xl p-8">
              <div className="flex items-center gap-4 mb-8 pb-6 border-b border-slate-200">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <Target className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900">Sesiones Disponibles</h3>
              </div>
              
              {sesionesActivas.length === 0 ? (
                <div className="text-center py-20">
                  <div className="w-24 h-24 bg-gradient-to-br from-slate-100 to-slate-200 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-inner">
                    <Clock className="w-12 h-12 text-slate-400" />
                  </div>
                  <p className="text-slate-700 mb-2 font-semibold text-xl">No hay sesiones disponibles</p>
                  <p className="text-slate-500 max-w-md mx-auto">
                    Tu cuidador debe crear y activar una sesión para que puedas comenzar
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {sesionesActivas.map((session, index) => {
                    const imagenes = session.IMAGEN || []
                    const descripcionesCount = imagenes.reduce(
                      (count, img) => count + (img.DESCRIPCION?.length || 0), 
                      0
                    )
                    const totalImagenes = imagenes.length
                    const progreso = totalImagenes > 0 ? (descripcionesCount / totalImagenes) * 100 : 0
                    const esNueva = descripcionesCount === 0

                    return (
                      <Card
                        key={session.idSesion}
                        className="border-2 border-slate-200 hover:border-purple-300 rounded-2xl p-8 hover:shadow-xl cursor-pointer bg-white transition-all duration-300"
                        onClick={() => handleStartSession(session)}
                      >
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-6">
                          <div className="flex items-center gap-5">
                            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg ${
                              esNueva 
                                ? 'bg-gradient-to-br from-purple-600 to-indigo-600' 
                                : 'bg-gradient-to-br from-purple-500 to-purple-700'
                            }`}>
                              <Target className="w-8 h-8 text-white" />
                            </div>

                            <div>
                              <h4 className="font-bold text-slate-900 flex items-center gap-3 text-xl mb-1">
                                Sesión {index + 1}
                                {esNueva && (
                                  <span className="px-3 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xs rounded-full font-semibold shadow-md">
                                    Nueva
                                  </span>
                                )}
                              </h4>
                              <p className="text-slate-600 font-medium">
                                {descripcionesCount} de {totalImagenes} fotos descritas
                              </p>
                            </div>
                          </div>

                          <Button className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:from-purple-700 hover:to-indigo-700 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl">
                            {esNueva ? 'Comenzar' : 'Continuar'}
                          </Button>
                        </div>

                        <div className="bg-slate-200 rounded-full h-2.5 overflow-hidden shadow-inner">
                          <div
                            className="bg-gradient-to-r from-purple-600 to-indigo-600 h-2.5 rounded-full transition-all duration-500"
                            style={{ width: `${progreso}%` }}
                          />
                        </div>
                        
                        {progreso > 0 && progreso < 100 && (
                          <p className="text-xs text-purple-700 mt-3 font-semibold flex items-center gap-2">
                            <Activity className="w-4 h-4" />
                            {Math.round(progreso)}% completado
                          </p>
                        )}
                      </Card>
                    )
                  })}
                </div>
              )}
            </Card>

            {/* Sesiones Completadas */}
            {sesionesCompletadas.length > 0 && (
              <Card className="bg-white border border-slate-200 shadow-md rounded-2xl p-8">
                <div className="flex items-center gap-4 mb-8 pb-6 border-b border-slate-200">
                  <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <Trophy className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900">Sesiones Completadas</h3>
                </div>
                
                <div className="space-y-5">
                  {sesionesCompletadas.map((session, index) => (
                    <Card
                      key={session.idSesion}
                      className="border-2 border-indigo-200 rounded-2xl p-6 bg-gradient-to-br from-white to-indigo-50 hover:shadow-lg transition-all duration-300"
                    >
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg">
                            <Trophy className="w-7 h-7 text-white" />
                          </div>

                          <div>
                            <h4 className="font-bold text-slate-900 text-lg mb-1">
                              Sesión {index + 1}
                            </h4>
                            <p className="text-sm text-slate-600">
                              Completada el {new Date(session.fechaCreacion).toLocaleDateString('es-ES', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </p>
                          </div>
                        </div>

                        <span className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl text-sm font-semibold flex items-center gap-2 shadow-md">
                          <CheckCircle className="w-4 h-4" />
                          Completada
                        </span>
                      </div>
                    </Card>
                  ))}
                </div>
              </Card>
            )}

            {/* Consejos */}
            <Card className="bg-gradient-to-br from-purple-50 to-indigo-50 border-2 border-purple-200 rounded-2xl p-8">
              <div className="flex items-start gap-6">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg">
                  <AlertCircle className="w-6 h-6 text-white" />
                </div>
                <div className="text-sm">
                  <p className="font-bold mb-4 text-slate-900 text-lg">Recomendaciones para las sesiones</p>
                  <ul className="space-y-3 text-slate-700">
                    <li className="flex items-start gap-3">
                      <span className="text-purple-600 font-bold mt-0.5">•</span>
                      <span>Tómate tu tiempo para recordar cada detalle</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-purple-600 font-bold mt-0.5">•</span>
                      <span>Las preguntas guía te ayudarán a estructurar tu descripción</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-purple-600 font-bold mt-0.5">•</span>
                      <span>No hay respuestas incorrectas, describe lo que recuerdas</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-purple-600 font-bold mt-0.5">•</span>
                      <span>Puedes pausar y continuar cuando quieras</span>
                    </li>
                  </ul>
                </div>
              </div>
            </Card>
          </div>
        </main>
      </div>
    </div>
  )}