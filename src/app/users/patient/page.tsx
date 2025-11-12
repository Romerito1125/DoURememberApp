"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Target, Trophy, FileText, User, LogOut } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DashboardHeader } from "@/components/dashboard-header"

const API_URL = 'https://api.devcorebits.com/api'

export default function PatientDashboard() {
  const router = useRouter()

  const [profile, setProfile] = useState<any>(null)
  const [doctor, setDoctor] = useState<any>(null)
  const [sesionesActivas, setSesionesActivas] = useState<any[]>([])
  const [sesionesCompletadas, setSesionesCompletadas] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  useEffect(() => {
    let mounted = true

    const initializeData = async () => {
      try {
        const token = localStorage.getItem("authToken")
        const userId = localStorage.getItem("userId")

        if (!token || !userId) {
          router.push('/authentication/login')
          return
        }

        // Perfil del paciente
        const perfilResponse = await fetch(`${API_URL}/usuarios-autenticacion/buscarUsuario/${userId}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (!perfilResponse.ok) throw new Error("Error al obtener perfil")
        const perfilData = await perfilResponse.json()
        const usuario = perfilData?.usuarios?.[0] || perfilData?.usuario || perfilData
        if (!usuario) throw new Error("Usuario no encontrado")
        if (usuario.rol !== "paciente") {
          // Redirección según rol
          switch(usuario.rol) {
            case 'medico': router.push('/users/doctor'); break
            case 'cuidador': router.push('/users/cuidador'); break
            case 'administrador': router.push('/users/admin'); break
            default: router.push('/'); break
          }
          return
        }
        if (mounted) setProfile(usuario)

        // Médico asignado
        const medicoResponse = await fetch(`${API_URL}/usuarios-autenticacion/medicoPaciente/${userId}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (medicoResponse.ok) {
          const medicoData = await medicoResponse.json()
          if (mounted) setDoctor(medicoData)
        }

        // Sesiones del paciente
        const sesionesResponse = await fetch(`${API_URL}/descripciones-imagenes/listarSesiones?idPaciente=${userId}&page=1&limit=100`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (sesionesResponse.ok) {
          const allSessionsData = await sesionesResponse.json()
          const todasSesiones = allSessionsData.data || []

          if (mounted) {
            setSesionesActivas(
              todasSesiones.filter((s: any) => (s.estado === 'en_curso' || s.estado === 'pendiente') && s.activacion === true)
            )
            setSesionesCompletadas(
              todasSesiones.filter((s: any) => s.estado === 'completado')
            )
          }
        }

      } catch (error) {
        console.error("Error inicializando datos:", error)
        localStorage.clear()
        sessionStorage.clear()
        router.push('/authentication/login')
      } finally {
        if (mounted) setIsLoading(false)
      }
    }

    initializeData()
    return () => { mounted = false }
  }, [router])

  const handleLogout = () => {
    setIsLoggingOut(true)
    localStorage.clear()
    sessionStorage.clear()
    window.location.href = '/authentication/login'
  }

  const totalSesiones = sesionesActivas.length + sesionesCompletadas.length

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-indigo-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">Cargando tu información...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gradient-to-br from-pink-100 to-indigo-800 min-h-screen">
      <div className="sticky top-0 z-50 backdrop-blur-xl bg-white/80 border-b border-purple-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <DashboardHeader />
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Perfil */}
        <Card className="bg-gradient-to-r from-purple-600 via-purple-700 to-indigo-700 rounded-3xl shadow-2xl p-8 mb-10">
          <div className="flex flex-col sm:flex-row items-center gap-8">
            <div className="w-32 h-32 rounded-2xl bg-white/20 flex items-center justify-center border-4 border-white/40 shadow-2xl">
              {profile?.avatarUrl ? (
                <img src={profile.avatarUrl} alt="Avatar" className="w-full h-full rounded-2xl object-cover" />
              ) : (
                <span className="text-white text-5xl font-bold">{profile?.nombre?.charAt(0)?.toUpperCase() || '?'}</span>
              )}
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-4xl font-bold text-white mb-2">Bienvenido, {profile?.nombre || 'Usuario'}</h1>
              <p className="text-purple-100 text-lg mb-4">Panel de gestión del paciente</p>
              <div className="flex gap-3 justify-center sm:justify-start">
                <Button onClick={() => router.push('/users/profile')} className="bg-white/20 text-white">Mi Perfil</Button>
                <Button onClick={handleLogout} disabled={isLoggingOut} className="bg-red-500 text-white">
                  {isLoggingOut ? 'Cerrando...' : 'Cerrar Sesión'}
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
          <Card className="bg-gradient-to-br from-purple-600 to-purple-700 p-6 text-white">
            <div className="flex justify-between items-center">
              <Target className="w-8 h-8" />
              <span className="text-3xl font-bold">{sesionesActivas.length}</span>
            </div>
            <p className="mt-2 text-sm">Sesiones Disponibles</p>
          </Card>
          <Card className="bg-gradient-to-br from-indigo-600 to-indigo-700 p-6 text-white">
            <div className="flex justify-between items-center">
              <Trophy className="w-8 h-8" />
              <span className="text-3xl font-bold">{sesionesCompletadas.length}</span>
            </div>
            <p className="mt-2 text-sm">Sesiones Completadas</p>
          </Card>
          <Card className="bg-gradient-to-br from-purple-700 to-indigo-800 p-6 text-white">
            <div className="flex justify-between items-center">
              <FileText className="w-8 h-8" />
              <span className="text-3xl font-bold">{totalSesiones}</span>
            </div>
            <p className="mt-2 text-sm">Total de Sesiones</p>
          </Card>
        </div>
      </main>
    </div>
  )
}
