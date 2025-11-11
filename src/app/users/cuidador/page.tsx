"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { 
  Upload, 
  Image as ImageIcon, 
  Calendar, 
  FileText, 
  LogOut,
  Users,
  CheckCircle,
  Clock,
  AlertCircle,
  Power,
  PowerOff,
  User,
  Activity,
  Camera,
  TrendingUp,
  Award
} from "lucide-react"
import { DashboardHeader } from "@/components/dashboard-header"
import { createClient } from "@/utils/supabase/client"
import { authService } from "@/services/auth.service"
import UserAvatar from "@/components/UserAvatar"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
const API_URL = 'http://localhost:3000/api'

interface Stats {
  totalImagenes: number
  totalSesiones: number
  sesionesCompletadas: number
  sesionesPendientes: number
}

interface Session {
  idSesion: number
  estado: 'en_curso' | 'completado' | 'pendiente'
  fechaCreacion: string
  activacion: boolean
  idPaciente: string
  IMAGEN: Array<{
    urlImagen: string
    idImagen: number
    DESCRIPCION: Array<any>
  }>
}

interface Patient {
  idUsuario: string
  nombre: string
}

export default function CuidadorDashboard() {
  const router = useRouter()
  const supabase = createClient()
  const [activeSection, setActiveSection] = useState<"overview" | "images" | "sessions" | "responses">("overview")
  const [stats, setStats] = useState<Stats>({
    totalImagenes: 0,
    totalSesiones: 0,
    sesionesCompletadas: 0,
    sesionesPendientes: 0
  })
  const [sesiones, setSesiones] = useState<Session[]>([])
  const [patients, setPatients] = useState<Patient[]>([])
  const [selectedPatient, setSelectedPatient] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [userName, setUserName] = useState("")
  const [userRole, setUserRole] = useState("")
  const [userId, setUserId] = useState("")
  const [error, setError] = useState("")
  // ✅ Estado para cerrar sesión correctamente
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  // Función para recargar datos cuando vuelve a la página
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && selectedPatient) {
        console.log('🔄 Página visible, recargando datos...')
        refreshSessionsData()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [selectedPatient])

  useEffect(() => {
    loadDashboardData()
  }, [])

  // Función para refrescar solo las sesiones
  const refreshSessionsData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session?.access_token && selectedPatient) {
        await loadSessionsForPatient(selectedPatient, session.access_token)
      }
    } catch (error) {
      console.error('Error al refrescar datos:', error)
    }
  }

  // Función para obtener totales desde el backend
  const loadSessionTotals = async (token: string) => {
    try {
      // Obtener sesiones completadas
      const completadasResponse = await fetch(
        `${API_URL}/descripciones-imagenes/totalSesionCompletadas?estado=completado`,
        { headers: { "Authorization": `Bearer ${token}` } }
      )
      
      if (completadasResponse.ok) {
        const completadasData = await completadasResponse.json()
        
        setStats(prev => ({
          ...prev,
          sesionesCompletadas: completadasData.sesiones || 0
        }))
      }
    } catch (error) {
      console.error('Error al cargar totales:', error)
    }
  }

  const loadDashboardData = async () => {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError || !session) {
        router.push('/authentication/login')
        return
      }

      setUserId(session.user.id)

      const userResponse = await fetch(
        `${API_URL}/usuarios-autenticacion/buscarUsuario/${session.user.id}`,
        {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          }
        }
      )

      if (!userResponse.ok) {
        throw new Error('Error al obtener datos del usuario')
      }

      const userData = await userResponse.json()
      const usuario = userData.usuarios?.[0]

      if (!usuario) {
        throw new Error('No se encontró el usuario')
      }

      if (usuario.rol !== 'cuidador') {
        alert(`No tienes permisos para acceder a este panel. Tu rol es: ${usuario.rol}`)
        
        switch (usuario.rol) {
          case 'medico':
            router.push('/users/doctor')
            break
          case 'paciente':
            router.push('/users/patient')
            break
          case 'administrador':
            router.push('/users/admin')
            break
          default:
            router.push('/')
        }
        return
      }

      setUserName(usuario.nombre || 'Cuidador')
      setUserRole(usuario.rol)

      const imagenesResponse = await fetch(
        `${API_URL}/descripciones-imagenes/listarImagenes/${session.user.id}?page=1&limit=100`,
        {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          }
        }
      )
      
      if (imagenesResponse.ok) {
        const imagenesData = await imagenesResponse.json()
        const totalImagenes = imagenesData.data?.length || 0

        const pacientesResponse = await fetch(
          `${API_URL}/usuarios-autenticacion/pacienteCuidador/${session.user.id}`,
          { headers: { "Authorization": `Bearer ${session.access_token}` } }
        )

        if (pacientesResponse.ok) {
          const pacientesData = await pacientesResponse.json()

          const pacientesCompletos = await Promise.all(
            pacientesData.map(async (item: { idPaciente: string }) => {
              const perfilResponse = await fetch(
                `${API_URL}/usuarios-autenticacion/buscarUsuario/${item.idPaciente}`,
                { headers: { "Authorization": `Bearer ${session.access_token}` } }
              )

              if (perfilResponse.ok) {
                const perfilData = await perfilResponse.json()
                if (perfilData.usuarios && perfilData.usuarios.length > 0) {
                  return perfilData.usuarios[0]
                }
              }
              return null
            })
          )

          const pacientesValidos = pacientesCompletos.filter(p => p !== null)
          setPatients(pacientesValidos)

          if (pacientesValidos.length > 0) {
            setSelectedPatient(pacientesValidos[0].idUsuario)
            await loadSessionsForPatient(pacientesValidos[0].idUsuario, session.access_token)
          }
        }

        setStats(prev => ({
          ...prev,
          totalImagenes
        }))
      }
      
    } catch (error) {
      console.error('Error al cargar datos:', error)
      alert('Error al cargar los datos del panel. Por favor intenta nuevamente.')
      router.push('/authentication/login')
    } finally {
      setIsLoading(false)
    }
  }

  const loadSessionsForPatient = async (idPaciente: string, token: string) => {
    try {
      console.log('📊 Cargando sesiones para paciente:', idPaciente)
      
      const allSessionsResponse = await fetch(
        `${API_URL}/descripciones-imagenes/listarSesiones?idPaciente=${idPaciente}&page=1&limit=100`,
        { 
          headers: { 
            "Authorization": `Bearer ${token}`
          }
        }
      )

      if (!allSessionsResponse.ok) {
        console.error('Error al cargar sesiones')
        return
      }

      const allSessionsData = await allSessionsResponse.json()
      const todasSesiones = allSessionsData.data || []
      
      console.log('📋 Sesiones obtenidas:', todasSesiones.length)
      console.log('📦 Datos completos:', JSON.stringify(todasSesiones, null, 2))
      
      setSesiones(todasSesiones)

      // USAR EL CAMPO estado DEL BACKEND
      const completadas = todasSesiones.filter((s: Session) => 
        s.estado === 'completado'
      ).length

      const pendientes = todasSesiones.filter((s: Session) => 
        s.estado === 'pendiente' || s.estado === 'en_curso'
      ).length

      console.log('📈 Estadísticas desde backend:', {
        total: todasSesiones.length,
        completadas,
        pendientes
      })

      setStats(prev => ({
        ...prev,
        totalSesiones: todasSesiones.length,
        sesionesCompletadas: completadas,
        sesionesPendientes: pendientes
      }))

      // Opcional: Cargar totales del endpoint específico
      await loadSessionTotals(token)

    } catch (error) {
      console.error('Error al cargar sesiones:', error)
    }
  }

  const handlePatientChange = async (idPaciente: string) => {
    setSelectedPatient(idPaciente)
    setIsLoading(true)

    const { data: { session } } = await supabase.auth.getSession()

    if (session?.access_token) {
      await loadSessionsForPatient(idPaciente, session.access_token)
    }

    setIsLoading(false)
  }

  const handleToggleActivation = async (sesion: Session) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()

      if (!session?.access_token) {
        alert('Sesión no válida')
        return
      }

      const nuevoEstado = !sesion.activacion

      const response = await fetch(
        `${API_URL}/descripciones-imagenes/actualizarSesion/${sesion.idSesion}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
          },
          body: JSON.stringify({
            activacion: nuevoEstado
          })
        }
      )

      if (!response.ok) {
        throw new Error('Error al actualizar sesión')
      }

      // Recargar sesiones después de actualizar
      await loadSessionsForPatient(selectedPatient, session.access_token)

      alert(nuevoEstado ? 'Sesión activada exitosamente' : 'Sesión desactivada')

    } catch (error: any) {
      console.error('Error:', error)
      alert('Error al cambiar estado de la sesión')
    }
  }

  // ✅ FUNCIÓN DE LOGOUT CORREGIDA (Del documento 9)
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

  const handleViewResponses = (sesionId: number) => {
    router.push(`/sessions/responses/${sesionId}`)
  }

  const handleCreateSession = () => {
    router.push('/sessions/create')
  }

  const handleUploadPhoto = () => {
    router.push('/photos/upload')
  }

  const handleViewPhotos = () => {
    router.push('/photos/gallery')
  }

  const handleViewProfile = () => {
    router.push('/users/profile')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">Cargando panel...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gradient-to-br from-pink-100 to-indigo-800">
      {/* Header con backdrop blur */}
      <div className="sticky top-0 z-50 backdrop-blur-xl bg-white/80 border-b border-blue-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <DashboardHeader />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-10">
        <div className="space-y-8">
          {/* Card principal del cuidador con gradiente mejorado */}
          <Card className="bg-gradient-to-r from-purple-700 via-purple-800 to-violet-900 border-0 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top">
      <div className="p-6 sm:p-10">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 lg:gap-8">
          <div className="flex items-center gap-5">
            <div className="relative flex-shrink-0">
              {/* Avatar del cuidador */}
              <div className="w-20 h-20 rounded-2xl bg-white/30 backdrop-blur-sm flex items-center justify-center border-2 border-white/60 shadow-lg ring-4 ring-white/25">
                {/* Si usas la letra inicial del nombre como placeholder */}
                
                {/* O puedes usar un ícono específico para cuidador */}
                <User className="w-10 h-10 text-white absolute" />
              </div>

              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-400 rounded-full border-4 border-white shadow-md animate-pulse"></div>
            </div>

            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2 tracking-tight">
                Bienvenido, {userName}
              </h1>
              <p className="text-white/90 text-base font-medium">
                Panel de gestión del cuidador
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Botón Mi Perfil */}
            <Button
              onClick={handleViewProfile}
              className="bg-white/20 hover:bg-white/30 text-white border-2 border-white/40 backdrop-blur-sm shadow-md hover:shadow-lg transition-all duration-300 font-semibold"
            >
              <User className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Mi Perfil</span>
            </Button>

            {/* Botón Cerrar Sesión */}
            <Button
              onClick={handleLogout}
              disabled={isLoggingOut}
              variant="outline"
              className="bg-white/15 border-2 border-white/50 text-white hover:bg-red-500 hover:border-red-500 backdrop-blur-sm transition-all duration-300 font-semibold disabled:opacity-50"
            >
              {isLoggingOut ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin sm:mr-2" />
                  <span className="hidden sm:inline">Cerrando...</span>
                </>
              ) : (
                <>
                  <LogOut className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Cerrar Sesión</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </Card>

          {/* Navegación con tabs mejorados */}
          <Card className="p-2 bg-white shadow-sm border border-slate-200 rounded-2xl animate-in fade-in slide-in-from-bottom" style={{ animationDelay: "0.1s" }}>
            <nav className="flex gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => setActiveSection("overview")}
                className={`flex-1 min-w-fit px-6 py-4 rounded-xl font-bold transition-all duration-300 flex items-center justify-center gap-2.5 ${
                  activeSection === "overview" 
                    ? "bg-gradient-to-r from-purple-500 to-violet-500 text-white shadow-lg" 
                    : "text-purple-600 hover:bg-purple-50 hover:text-purple-700"
                }`}
              >
                <Users className="w-5 h-5" />
                Vista General
              </button>

              <button
                type="button"
                onClick={() => setActiveSection("images")}
                className={`flex-1 min-w-fit px-6 py-4 rounded-xl font-bold transition-all duration-300 flex items-center justify-center gap-2.5 ${
                  activeSection === "images" 
                    ? "bg-gradient-to-r from-purple-500 to-violet-500 text-white shadow-lg" 
                    : "text-purple-600 hover:bg-purple-50 hover:text-purple-700"
                }`}
              >
                <ImageIcon className="w-5 h-5" />
                Gestionar Imágenes
              </button>

              <button
                type="button"
                onClick={() => setActiveSection("sessions")}
                className={`flex-1 min-w-fit px-6 py-4 rounded-xl font-bold transition-all duration-300 flex items-center justify-center gap-2.5 ${
                  activeSection === "sessions" 
                    ? "bg-gradient-to-r from-purple-500 to-violet-500 text-white shadow-lg" 
                    : "text-purple-600 hover:bg-purple-50 hover:text-purple-700"
                }`}
              >
                <Calendar className="w-5 h-5" />
                Sesiones
              </button>

              <button
                type="button"
                onClick={() => setActiveSection("responses")}
                className={`flex-1 min-w-fit px-6 py-4 rounded-xl font-bold transition-all duration-300 flex items-center justify-center gap-2.5 ${
                  activeSection === "responses" 
                    ? "bg-gradient-to-r from-purple-500 to-violet-500 text-white shadow-lg" 
                    : "text-purple-600 hover:bg-purple-50 hover:text-purple-700"
                }`}
              >
                <FileText className="w-5 h-5" />
                Respuestas
              </button>
            </nav>
          </Card>

          {/* Vista General */}
          {activeSection === "overview" && (
            <section className="space-y-6 animate-in fade-in slide-in-from-bottom" style={{ animationDelay: "0.2s" }}>
              {/* Estadísticas con diseño moderno */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="bg-gradient-to-br from-purple-500 to-purple-600 border-0 shadow-xl hover:shadow-2xl transition-all duration-300 p-6">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                      <ImageIcon className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-4xl font-bold text-white">{stats.totalImagenes}</span>
                  </div>
                  <p className="text-purple-100 text-sm font-semibold">Imágenes Subidas</p>
                </Card>

                <Card 
                  onClick={() => setActiveSection("sessions")}
                  className="bg-gradient-to-br from-blue-500 to-blue-600 border-0 shadow-xl hover:shadow-2xl transition-all duration-300 p-6 cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                      <Calendar className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-4xl font-bold text-white">{stats.totalSesiones}</span>
                  </div>
                  <p className="text-blue-100 text-sm font-semibold">Sesiones Creadas</p>
                </Card>

                <Card 
                  onClick={() => setActiveSection("sessions")}
                  className="bg-gradient-to-br from-green-500 to-green-600 border-0 shadow-xl hover:shadow-2xl transition-all duration-300 p-6 cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                      <CheckCircle className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-4xl font-bold text-white">{stats.sesionesCompletadas}</span>
                  </div>
                  <p className="text-green-100 text-sm font-semibold">Sesiones Completadas</p>
                </Card>

                <Card 
                  onClick={() => setActiveSection("sessions")}
                  className="bg-gradient-to-br from-amber-500 to-amber-600 border-0 shadow-xl hover:shadow-2xl transition-all duration-300 p-6 cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                      <Clock className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-4xl font-bold text-white">{stats.sesionesPendientes}</span>
                  </div>
                  <p className="text-amber-100 text-sm font-semibold">Sesiones Pendientes</p>
                </Card>
              </div>

              {/* Accesos Rápidos */}
              <Card className="bg-white border border-slate-100 shadow-lg rounded-2xl p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center shadow-lg">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900">Accesos Rápidos</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <button
                    onClick={handleUploadPhoto}
                    className="group flex items-center gap-4 p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl hover:from-purple-100 hover:to-purple-200 transition-all duration-300 border-2 border-purple-200 hover:border-purple-300 hover:shadow-lg"
                  >
                    <div className="w-14 h-14 bg-gradient-to-br from-purple-600 to-purple-700 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <Upload className="w-7 h-7 text-white" />
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-slate-900 text-lg">Subir Imagen</p>
                      <p className="text-sm text-slate-600">Nueva fotografía</p>
                    </div>
                  </button>

                  <button
                    onClick={handleCreateSession}
                    className="group flex items-center gap-4 p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl hover:from-blue-100 hover:to-blue-200 transition-all duration-300 border-2 border-blue-200 hover:border-blue-300 hover:shadow-lg"
                  >
                    <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <Calendar className="w-7 h-7 text-white" />
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-slate-900 text-lg">Crear Sesión</p>
                      <p className="text-sm text-slate-600">Nueva evaluación</p>
                    </div>
                  </button>

                  <button
                    onClick={handleViewPhotos}
                    className="group flex items-center gap-4 p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-2xl hover:from-green-100 hover:to-green-200 transition-all duration-300 border-2 border-green-200 hover:border-green-300 hover:shadow-lg"
                  >
                    <div className="w-14 h-14 bg-gradient-to-br from-green-600 to-green-700 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <ImageIcon className="w-7 h-7 text-white" />
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-slate-900 text-lg">Ver Imágenes</p>
                      <p className="text-sm text-slate-600">Galería completa</p>
                    </div>
                  </button>
                </div>
              </Card>
            </section>
          )}

          {/* Gestión de Imágenes */}
          {activeSection === "images" && (
            <section className="animate-in fade-in slide-in-from-bottom" style={{ animationDelay: "0.2s" }}>
              <Card className="bg-white border border-slate-100 shadow-lg rounded-2xl p-8">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-purple-600 to-purple-700 rounded-2xl flex items-center justify-center shadow-lg">
                      <ImageIcon className="w-7 h-7 text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-slate-900 mb-1">Gestión de Imágenes</h2>
                      <p className="text-slate-600">Administra las fotografías familiares del paciente</p>
                    </div>
                  </div>
                  <Button
                    onClick={handleUploadPhoto}
                    className="bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 font-bold"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Subir Nueva Imagen
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                  <button
                    onClick={handleViewPhotos}
                    className="group p-8 bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl hover:from-purple-100 hover:to-purple-200 transition-all duration-300 border-2 border-purple-200 hover:border-purple-300 text-left hover:shadow-xl"
                  >
                    <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-purple-700 rounded-2xl flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <ImageIcon className="w-8 h-8 text-white"/>
                      </div>
                    <h3 className="font-bold text-slate-900 mb-2 text-lg">Ver Todas las Imágenes</h3>
                    <p className="text-sm text-slate-600">Accede a la galería completa de fotografías</p>
                  </button>

                  <button
                    onClick={handleUploadPhoto}
                    className="group p-8 bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl hover:from-blue-100 hover:to-blue-200 transition-all duration-300 border-2 border-blue-200 hover:border-blue-300 text-left hover:shadow-xl"
                  >
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <Upload className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="font-bold text-slate-900 mb-2 text-lg">Cargar Nueva Fotografía</h3>
                    <p className="text-sm text-slate-600">Sube una nueva imagen con su contexto</p>
                  </button>
                </div>

                <div className="mt-8 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-2xl p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md">
                      <AlertCircle className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-blue-900 font-semibold mb-1">💡 Consejo Importante</p>
                      <p className="text-blue-800 text-sm leading-relaxed">
                        Las imágenes que subas estarán disponibles para crear sesiones 
                        de evaluación. Asegúrate de agregar descripciones detalladas para obtener mejores resultados.
                      </p>
                    </div>
                  </div>
                </div>
              </Card>
            </section>
          )}

          {/* Gestión de Sesiones */}
          {activeSection === "sessions" && (
            <section className="space-y-6 animate-in fade-in slide-in-from-bottom" style={{ animationDelay: "0.2s" }}>
              <Card className="bg-white border border-slate-100 shadow-lg rounded-2xl p-8">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center shadow-lg">
                      <Calendar className="w-7 h-7 text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-slate-900 mb-1">Gestión de Sesiones</h2>
                      <p className="text-slate-600">Crea y administra sesiones de evaluación para tus pacientes</p>
                    </div>
                  </div>
                  <Button
                    onClick={handleCreateSession}
                    className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 font-bold"
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    Nueva Sesión
                  </Button>
                </div>

                {error && (
                  <div className="mb-6 bg-gradient-to-r from-red-50 to-red-100 border-2 border-red-200 rounded-2xl p-6 flex items-start animate-in fade-in">
                    <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center flex-shrink-0 mr-4">
                      <AlertCircle className="w-6 h-6 text-white" />
                    </div>
                    <p className="text-red-800 font-medium">{error}</p>
                  </div>
                )}

                {patients.length > 0 && (
                  <div className="mb-8">
                    <div className="flex items-center justify-between mb-3">
                      <label className="block text-sm font-bold text-slate-900">
                        Seleccionar Paciente
                      </label>
                      <button
                        onClick={refreshSessionsData}
                        className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-2 font-semibold hover:bg-blue-50 px-3 py-1 rounded-lg transition-colors"
                        title="Refrescar datos"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Actualizar
                      </button>
                    </div>
                    <select
                      value={selectedPatient}
                      onChange={(e) => handlePatientChange(e.target.value)}
                      className="w-full px-5 py-4 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none font-medium text-slate-900 bg-white hover:border-blue-300 transition-colors shadow-sm"
                    >
                      {patients.map(patient => (
                        <option key={patient.idUsuario} value={patient.idUsuario}>
                          {patient.nombre}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </Card>

              {sesiones.length === 0 ? (
                <Card className="bg-white border border-slate-100 shadow-lg rounded-2xl p-16 text-center">
                  <div className="w-20 h-20 bg-gradient-to-br from-slate-100 to-slate-200 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-inner">
                    <Calendar className="w-10 h-10 text-slate-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-3">No hay sesiones creadas</h3>
                  <p className="text-slate-600 mb-8 max-w-md mx-auto">Crea tu primera sesión de evaluación para el paciente</p>
                  <Button
                    onClick={handleCreateSession}
                    className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 font-bold px-8 py-6 text-lg"
                  >
                    <Calendar className="w-5 h-5 mr-2" />
                    Crear Primera Sesión
                  </Button>
                </Card>
              ) : (
                <div className="space-y-6">
                  {sesiones.map((sesion, index) => {
                    const imagenes = sesion.IMAGEN || []
                    const descripcionesCount = imagenes.reduce(
                      (count, img) => count + (img.DESCRIPCION?.length || 0),
                      0
                    )
                    const totalImagenes = imagenes.length
                    const progreso = totalImagenes > 0 ? (descripcionesCount / totalImagenes) * 100 : 0
                    const estaCompletada = sesion.estado === 'completado'

                    return (
                      <Card
                        key={sesion.idSesion}
                        className="bg-white border-2 border-slate-100 hover:border-blue-200 shadow-lg hover:shadow-xl rounded-2xl p-8 transition-all duration-300"
                      >
                        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 mb-6">
                          <div className="flex items-start gap-4">
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg ${
                              estaCompletada 
                                ? 'bg-gradient-to-br from-green-500 to-green-600' 
                                : 'bg-gradient-to-br from-blue-500 to-indigo-600'
                            }`}>
                              {estaCompletada ? (
                                <CheckCircle className="w-7 h-7 text-white" />
                              ) : (
                                <Calendar className="w-7 h-7 text-white" />
                              )}
                            </div>
                            <div>
                              <h3 className="text-xl font-bold text-slate-900 mb-1">
                                Sesión {index + 1}
                              </h3>
                              <p className="text-sm text-slate-600 mb-1">
                                Creada el {new Date(sesion.fechaCreacion).toLocaleDateString('es-ES', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric'
                                })}
                              </p>
                              <p className="text-sm font-medium text-slate-700">
                                {descripcionesCount} de {totalImagenes} fotos descritas
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-4">
                            <div className="text-center">
                              <span
                                className={`px-5 py-2.5 rounded-xl text-sm font-bold shadow-md ${
                                  estaCompletada
                                    ? 'bg-gradient-to-r from-green-500 to-green-600 text-white'
                                    : sesion.activacion
                                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white'
                                    : 'bg-gradient-to-r from-amber-500 to-amber-600 text-white'
                                }`}
                              >
                                {estaCompletada ? 'Completada' : sesion.activacion ? 'Activa' : 'Inactiva'}
                              </span>
                              <p className="text-xs text-slate-500 mt-2 font-medium">
                                {estaCompletada 
                                  ? 'Sesión finalizada'
                                  : sesion.activacion
                                  ? 'El paciente puede verla'
                                  : 'Oculta para el paciente'}
                              </p>
                            </div>

                            {!estaCompletada && (
                              <Button
                                onClick={() => handleToggleActivation(sesion)}
                                className={`p-4 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl ${
                                  sesion.activacion
                                    ? 'bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white'
                                    : 'bg-gradient-to-br from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white'
                                }`}
                                title={sesion.activacion ? 'Desactivar sesión' : 'Activar sesión'}
                              >
                                {sesion.activacion ? (
                                  <PowerOff className="w-6 h-6" />
                                ) : (
                                  <Power className="w-6 h-6" />
                                )}
                              </Button>
                            )}
                          </div>
                        </div>

                        <div className="bg-slate-100 rounded-full h-3 mb-6 overflow-hidden shadow-inner">
                          <div
                            className={`h-3 rounded-full transition-all duration-500 ${
                              estaCompletada 
                                ? 'bg-gradient-to-r from-green-500 to-green-600' 
                                : 'bg-gradient-to-r from-blue-500 to-indigo-600'
                            }`}
                            style={{ width: `${progreso}%` }}
                          />
                        </div>

                        {imagenes.length > 0 && (
                          <div className="flex gap-3 mb-6 overflow-x-auto pb-2">
                            {imagenes.map((img) => (
                              <div key={img.idImagen} className="relative flex-shrink-0 group">
                                <img
                                  src={img.urlImagen}
                                  alt="Imagen de sesión"
                                  className="w-24 h-24 object-cover rounded-2xl border-2 border-slate-200 group-hover:border-blue-300 transition-all duration-300 shadow-md"
                                />
                                {img.DESCRIPCION && img.DESCRIPCION.length > 0 && (
                                  <div className="absolute -top-2 -right-2 bg-gradient-to-br from-green-500 to-green-600 text-white rounded-full w-7 h-7 flex items-center justify-center text-sm font-bold shadow-lg">
                                    ✓
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}

                        <Button
                          onClick={() => handleViewResponses(sesion.idSesion)}
                          className="w-full bg-gradient-to-r from-purple-50 to-purple-100 text-purple-700 hover:from-purple-100 hover:to-purple-200 border-2 border-purple-200 hover:border-purple-300 rounded-xl transition-all duration-300 font-bold py-4 shadow-md hover:shadow-lg"
                        >
                          <FileText className="w-5 h-5 mr-2" />
                          Ver Respuestas del Paciente
                        </Button>
                      </Card>
                    )
                  })}
                </div>
              )}
            </section>
          )}

          {/* Respuestas del Paciente */}
          {activeSection === "responses" && (
            <section className="animate-in fade-in slide-in-from-bottom" style={{ animationDelay: "0.2s" }}>
              <Card className="bg-white border border-slate-100 shadow-lg rounded-2xl p-8">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-14 h-14 bg-gradient-to-br from-purple-600 to-purple-700 rounded-2xl flex items-center justify-center shadow-lg">
                    <FileText className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-1">Respuestas del Paciente</h2>
                    <p className="text-slate-600">Revisa las descripciones y respuestas del paciente a las sesiones</p>
                  </div>
                </div>

                {sesiones.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="w-20 h-20 bg-gradient-to-br from-slate-100 to-slate-200 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-inner">
                      <FileText className="w-10 h-10 text-slate-400" />
                    </div>
                    <p className="text-slate-600 font-medium text-lg">No hay sesiones disponibles aún</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {sesiones.map((sesion, index) => {
                      const imagenes = sesion.IMAGEN || []
                      const descripcionesCount = imagenes.reduce(
                        (count, img) => count + (img.DESCRIPCION?.length || 0),
                        0
                      )
                      const totalImagenes = imagenes.length
                      const estaCompletada = sesion.estado === 'completado'

                      return (
                        <Card
                          key={sesion.idSesion}
                          className="border-2 border-slate-100 hover:border-purple-200 rounded-2xl p-6 transition-all duration-300 hover:shadow-lg bg-gradient-to-br from-white to-slate-50"
                        >
                          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                            <div className="flex items-center gap-3">
                              <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-md ${
                                estaCompletada 
                                  ? 'bg-gradient-to-br from-green-500 to-green-600' 
                                  : 'bg-gradient-to-br from-amber-500 to-amber-600'
                              }`}>
                                {estaCompletada ? (
                                  <CheckCircle className="w-6 h-6 text-white" />
                                ) : (
                                  <Clock className="w-6 h-6 text-white" />
                                )}
                              </div>
                              <div>
                                <h3 className="font-bold text-slate-900 text-lg">Sesión {index + 1}</h3>
                                <p className="text-sm text-slate-600">
                                  {new Date(sesion.fechaCreacion).toLocaleDateString('es-ES')}
                                </p>
                                <p className="text-xs text-slate-500 font-medium mt-1">
                                  {descripcionesCount} de {totalImagenes} respuestas completadas
                                </p>
                              </div>
                            </div>
                            <span className={`px-4 py-2 rounded-xl text-xs font-bold shadow-md ${
                              estaCompletada 
                                ? 'bg-gradient-to-r from-green-500 to-green-600 text-white' 
                                : 'bg-gradient-to-r from-amber-500 to-amber-600 text-white'
                            }`}>
                              {estaCompletada ? 'Completada' : 'Pendiente'}
                            </span>
                          </div>

                          <Button
                            onClick={() => handleViewResponses(sesion.idSesion)}
                            disabled={!estaCompletada}
                            className={`w-full rounded-xl transition-all duration-300 font-bold py-4 shadow-md ${
                              estaCompletada
                                ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white hover:from-purple-700 hover:to-purple-800 hover:shadow-lg'
                                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                            }`}
                          >
                            <FileText className="w-5 h-5 mr-2" />
                            {estaCompletada ? 'Ver Respuestas Completas' : 'Esperando respuestas del paciente'}
                          </Button>
                        </Card>
                      )
                    })}
                  </div>
                )}
              </Card>
            </section>
          )}
        </div>
      </div>
    </div>
  )
}