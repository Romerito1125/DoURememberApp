"use client"

import { useState, useEffect } from "react"
import { Users, Activity, Calendar, TrendingUp } from "lucide-react"
import { createClient } from "@/utils/supabase/client"

const API_URL = 'http://api.devcorebits.com/api'

interface Stats {
  totalPacientes: number
  cantidadSesiones: number
  sesionesActivas: number
  promedioCompletitud: number
}

export function QuickStats() {
  const [stats, setStats] = useState<Stats>({
    totalPacientes: 0,
    cantidadSesiones: 0,
    sesionesActivas: 0,
    promedioCompletitud: 0
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) return

    // Obtener pacientes del médico
    const pacientesResponse = await fetch(
      `${API_URL}/usuarios-autenticacion/pacientesDeMedico/${user.id}`
    )
    
    if (!pacientesResponse.ok) throw new Error('Error al obtener pacientes')
    
    const pacientesData = await pacientesResponse.json()
    const pacientes = pacientesData.pacientes || []
    const totalPacientes = pacientes.length

    // Obtener total de sesiones (usar el primer paciente sólo para este fetch)
    let cantidadSesiones = 0
    if (pacientes.length > 0) {
      const pacientePrimero = pacientes[0]

      const sesionesResponse = await fetch(
        `${API_URL}/descripciones-imagenes/cantidadSesiones/${pacientePrimero.idUsuario}`
      )
      
      if (sesionesResponse.ok) {
        const sesionesData = await sesionesResponse.json()
        cantidadSesiones = sesionesData.total || 0
      }
    }
    
    // Calcular sesiones completadas y activas por paciente
    let sesionesCompletadas = 0
    let sesionesActivas = 0
    
    for (const paciente of pacientes) {
      try {
        const cantidadResponse = await fetch(
          `${API_URL}/descripciones-imagenes/cantidadSesiones/${paciente.idUsuario}`
        )
        
        if (cantidadResponse.ok) {
          const cantidadData = await cantidadResponse.json()
          sesionesCompletadas += cantidadData.completadas || 0
          sesionesActivas += cantidadData.activas || 0
        }
      } catch (error) {
        console.error(`Error al obtener sesiones del paciente ${paciente.idUsuario}:`, error)
      }
    }

    // Calcular promedio de completitud
    const promedioCompletitud = cantidadSesiones > 0 
      ? Math.round((sesionesCompletadas / cantidadSesiones) * 100) 
      : 0

    setStats({
      totalPacientes,
      cantidadSesiones,
      sesionesActivas,
      promedioCompletitud
    })

  } catch (error) {
    console.error('Error al cargar estadísticas:', error)
  } finally {
    setIsLoading(false)
  }
}


  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-slate-200 rounded w-3/4"></div>
          <div className="h-8 bg-slate-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
      <h3 className="text-lg font-semibold text-slate-800 mb-4">Resumen General</h3>
      
      {/* Total Pacientes */}
      <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center">
            <Users className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-sm text-slate-600">Total Pacientes</p>
            <p className="text-2xl font-bold text-slate-800">{stats.totalPacientes}</p>
          </div>
        </div>
      </div>

      {/* Total Sesiones */}
      <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
            <Calendar className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-sm text-slate-600">Total Sesiones</p>
            <p className="text-2xl font-bold text-slate-800">{stats.cantidadSesiones}</p>
          </div>
        </div>
      </div>

      {/* Sesiones Activas */}
      <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-sm text-slate-600">Sesiones Activas</p>
            <p className="text-2xl font-bold text-slate-800">{stats.sesionesActivas}</p>
          </div>
        </div>
      </div>

      {/* Promedio de Completitud */}
      <div className="flex items-center justify-between p-4 bg-amber-50 rounded-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-600 rounded-full flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-sm text-slate-600">Completitud</p>
            <p className="text-2xl font-bold text-slate-800">{stats.promedioCompletitud}%</p>
          </div>
        </div>
      </div>
    </div>
  )
}