"use client"

import { useState, useEffect } from "react"
import { FileText, TrendingUp, Users, Activity } from "lucide-react"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.devcorebits.com/api"

export default function BaselineReportsStats() {
  const [stats, setStats] = useState({
    totalReports: 0,
    totalSessions: 0,
    avgImprovement: 0,
    patientsWithProgress: 0,
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    setIsLoading(true)
    try {
      const token = localStorage.getItem("authToken")
      if (!token) throw new Error("Token no encontrado. Redirigir al login.")

      // Obtener todos los pacientes
      const pacientesRes = await fetch(`${API_URL}/api/usuarios-autenticacion/buscarUsuarios`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!pacientesRes.ok) {
        const txt = await pacientesRes.text()
        console.error("❌ Error al obtener pacientes:", txt)
        throw new Error("Error al obtener lista de usuarios")
      }

      const dataPacientes = await pacientesRes.json()
      const pacientes = dataPacientes.usuarios?.filter((u: any) => u.rol === "paciente") || []

      if (pacientes.length === 0) {
        console.warn("⚠️ No hay pacientes registrados")
        setStats({ totalReports: 0, totalSessions: 0, avgImprovement: 0, patientsWithProgress: 0 })
        return
      }

      // Traer sesiones para cada paciente
      const reportes = await Promise.all(
        pacientes.map(async (paciente: any) => {
          try {
            const sesionesRes = await fetch(
              `${API_URL}/descripciones-imagenes/api/listarSesionesGt?page=1&limit=4&idPaciente=${paciente.idUsuario}`,
              {
                method: "GET",
                headers: {
                  "Content-Type": "application/json",
                },
              }
            )

            if (!sesionesRes.ok) return null

            const dataSesiones = await sesionesRes.json()
            const sesiones = Array.isArray(dataSesiones.data) ? dataSesiones.data : []
            if (sesiones.length === 0) return null

            const first = sesiones[0]
            const last = sesiones[sesiones.length - 1]
            const improvement = (last.sessionTotal || 0) - (first.sessionTotal || 0)

            return {
              count: sesiones.length,
              firstSessionTotal: first.sessionTotal || 0,
              lastSessionTotal: last.sessionTotal || 0,
              improvement,
            }
          } catch (err) {
            console.error(`Error procesando paciente ${paciente.nombre}:`, err)
            return null
          }
        })
      )

      const validReports = reportes.filter((r) => r !== null)

      const totalReports = validReports.length
      const totalSessions = validReports.reduce((sum, r: any) => sum + (r?.count || 0), 0)
      const improvements = validReports
        .filter((r: any) => r.improvement > 0)
        .map((r: any) => r.improvement)

      const avgImprovement =
        improvements.length > 0 ? improvements.reduce((sum, imp) => sum + imp, 0) / improvements.length : 0

      const patientsWithProgress = improvements.length

      setStats({
        totalReports,
        totalSessions,
        avgImprovement: Math.round(avgImprovement * 100),
        patientsWithProgress,
      })
    } catch (error) {
      console.error("Error al cargar estadísticas:", error)
      setStats({ totalReports: 0, totalSessions: 0, avgImprovement: 0, patientsWithProgress: 0 })
    } finally {
      setIsLoading(false)
    }
  }

  const statItems = [
    {
      label: "Total Reportes",
      value: stats.totalReports,
      icon: FileText,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      label: "Total Sesiones",
      value: stats.totalSessions,
      icon: Activity,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
    {
      label: "Mejora Promedio",
      value: `${stats.avgImprovement}%`,
      icon: TrendingUp,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      label: "Con Progreso",
      value: stats.patientsWithProgress,
      icon: Users,
      color: "text-orange-600",
      bgColor: "bg-orange-100",
    },
  ]

  if (isLoading) {
    return (
      <div className="bg-white rounded-3xl shadow-sm p-6 space-y-4">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Estadísticas</h2>
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-20 bg-gray-200 rounded-2xl"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-3xl shadow-sm p-6 space-y-4">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Estadísticas de Reportes</h2>

      {statItems.map((stat, index) => {
        const Icon = stat.icon
        return (
          <div
            key={index}
            className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50 hover:bg-gray-100 transition-colors"
          >
            <div className={`w-12 h-12 rounded-xl ${stat.bgColor} flex items-center justify-center`}>
              <Icon className={`w-6 h-6 ${stat.color}`} />
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-600">{stat.label}</p>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
