"use client"

import { useState, useEffect } from "react"
import { FileText, TrendingUp, Users, Activity } from "lucide-react"
import { reportsService } from "@/services/reports.service"

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
      const reports = await reportsService.getAllPatientsWithReports()
      
      const totalReports = reports.length
      const totalSessions = reports.reduce((sum, r) => sum + r.summary.count, 0)
      
      const improvements = reports
        .filter(r => r.summary.lastSessionTotal > r.summary.firstSessionTotal)
        .map(r => r.summary.lastSessionTotal - r.summary.firstSessionTotal)
      
      const avgImprovement = improvements.length > 0
        ? improvements.reduce((sum, imp) => sum + imp, 0) / improvements.length
        : 0
      
      const patientsWithProgress = improvements.length

      setStats({
        totalReports,
        totalSessions,
        avgImprovement: Number(reportsService.toPercentage(avgImprovement)),
        patientsWithProgress,
      })
    } catch (error) {
      console.error("Error al cargar estadísticas:", error)
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