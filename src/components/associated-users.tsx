"use client"

import { useState, useEffect } from "react"
import { Users, UserCircle, Shield, FileText, ChevronDown, ChevronUp, CheckCircle, UserPlus, X, Loader2, Search } from "lucide-react"
import { createClient } from "@/utils/supabase/client"
import { Button } from "@/components/ui/button"
import { PatientSessionsModal } from "@/components/patient-sessions-modal"
import { PatientCaregiversModal } from "./patient-caregivers-modal"
import { assignmentService } from "@/services/assignment.service"
import { authService } from "@/services/auth.service"

const API_URL = 'http://localhost:3000/api'

interface Patient {
  idUsuario: string
  idPaciente?: string
  nombre: string
  correo: string
  edad: number
  fechaNacimiento?: string
  sesionesCompletadas?: number
  cuidador?: {
    idCuidador: string
    nombre: string
    correo: string
  }
}

export function AssociatedUsers() {
  const [patients, setPatients] = useState<Patient[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")

  const [expandedPatient, setExpandedPatient] = useState<string | null>(null)
  const [selectedPatient, setSelectedPatient] = useState<{ id: string, name: string } | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedPatientForCaregivers, setSelectedPatientForCaregivers] = useState<Patient | null>(null)
  const [isCaregiversModalOpen, setIsCaregiversModalOpen] = useState(false)

  useEffect(() => {
    loadPatients()
  }, [])

  const loadPatients = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!user || !session) return

      const token = session.access_token

      // Obtener pacientes del médico
      const response = await fetch(
        `${API_URL}/usuarios-autenticacion/pacientesDeMedico/${user.id}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      )
      
      if (!response.ok) throw new Error('Error al obtener pacientes')
      
      const data = await response.json()
      const pacientesList = data.pacientes || []

      // Para cada paciente, obtener sus cuidadores y sesiones completadas
      const pacientesConDatos = await Promise.all(
        pacientesList.map(async (paciente: any) => {
          try {
            // Obtener cuidadores del paciente usando la misma lógica de PatientList
            const caregiversList = await assignmentService.getCaregiversByPatient(paciente.idUsuario, token)
            
            // Tomar el primer cuidador como cuidador principal (si existe)
            const cuidadorPrincipal = caregiversList.length > 0 ? {
              idCuidador: caregiversList[0].idUsuario || caregiversList[0].idCuidador,
              nombre: caregiversList[0].nombre,
              correo: caregiversList[0].correo
            } : null

            // Obtener sesiones completadas
            let sesionesCompletadas = 0
            try {
              const sesionesResponse = await fetch(
                `${API_URL}/descripciones-imagenes/listarSesionesGt?idPaciente=${paciente.idUsuario}&estado_sesion=completado&page=1&limit=1`,
                {
                  headers: {
                    'Authorization': `Bearer ${token}`
                  }
                }
              )
              
              if (sesionesResponse.ok) {
                const sesionesData = await sesionesResponse.json()
                sesionesCompletadas = sesionesData.meta?.total || 0
              }
            } catch (error) {
              console.error(`Error al obtener sesiones del paciente ${paciente.idUsuario}:`, error)
            }

            return {
              ...paciente,
              cuidador: cuidadorPrincipal,
              sesionesCompletadas
            }
          } catch (error) {
            console.error(`Error al obtener datos del paciente ${paciente.idUsuario}:`, error)
            return {
              ...paciente,
              sesionesCompletadas: 0,
              cuidador: null
            }
          }
        })
      )

      setPatients(pacientesConDatos)

    } catch (error) {
      console.error('Error al cargar pacientes:', error)
    } finally {
      setIsLoading(false)
    }
  }



  const handleViewSessions = (patientId: string, patientName: string) => {
    setSelectedPatient({ id: patientId, name: patientName })
    setIsModalOpen(true)
  }

  const togglePatient = (patientId: string) => {
    setExpandedPatient(expandedPatient === patientId ? null : patientId)
  }

  const handleModalClose = () => {
    setIsModalOpen(false)
    setSelectedPatient(null)
    loadPatients()
  }

  const handleOpenCaregiversModal = (patient: Patient) => {
    console.log('🔓 Abriendo modal de cuidadores con paciente:', patient)
    
    if (!patient.idUsuario) {
      console.error('❌ Error: Paciente sin ID válido')
      alert('Error: No se puede abrir el modal sin un ID de paciente válido')
      return
    }

    const normalizedPatient: Patient = {
      idPaciente: patient.idUsuario,
      idUsuario: patient.idUsuario,
      nombre: patient.nombre,
      correo: patient.correo,
      edad: patient.edad,
      fechaNacimiento: patient.fechaNacimiento,
      cuidador: patient.cuidador,
      sesionesCompletadas: patient.sesionesCompletadas
    }
    
    console.log('✅ Paciente normalizado:', normalizedPatient)
    setSelectedPatientForCaregivers(normalizedPatient)
    setIsCaregiversModalOpen(true)
  }

  const handleCloseCaregiversModal = () => {
    setIsCaregiversModalOpen(false)
    setSelectedPatientForCaregivers(null)
  }

  const handleCaregiversUpdate = () => {
    loadPatients()
  }

  const filteredPatients = patients.filter(patient =>
    patient.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
    patient.correo.toLowerCase().includes(searchQuery.toLowerCase())
)

  if (isLoading) {
  return (
    <div className="bg-white rounded-2xl shadow-xl p-6">
      {/* Sutilmente mejorado a shadow-xl */}
      <h3 className="text-xl font-bold text-slate-800 mb-4">
        Usuarios Asociados
      </h3>
      {/* Título más grande */}
      <div className="animate-pulse space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 bg-slate-200 rounded-xl"></div>
        ))}
      </div>
    </div>
  )
}

return (
  <>
    {/* CARD PRINCIPAL: Más grande y visible con sombra profunda */}
    <div className="bg-white rounded-3xl shadow-2xl p-8 border border-purple-100">
      {/* TÍTULO MEJORADO */}
      <h3 className="text-2xl font-semibold text-gray-900 mb-6 flex items-center gap-3">
        <Users className="w-6 h-6 text-purple-700" />
        Gestión de Pacientes Asociados
      </h3>

      {/* 🔍 IMPLEMENTACIÓN DE LA LUPA/BARRA DE BÚSQUEDA */}
      <div className="relative mb-8">
        <input
          type="text"
          placeholder="Buscar paciente por nombre o correo..."
          value={searchQuery}
          onChange={(e)=>setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-purple-300 rounded-xl focus:border-purple-600 focus:ring-1 focus:ring-purple-600 transition-all duration-200 placeholder-slate-400 text-slate-800 shadow-inner"
        />
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-purple-400" />
      </div>

      {patients.length === 0 ? (
        <div className="text-center py-12 bg-purple-50 rounded-xl border border-dashed border-purple-200">
          <Users className="w-8 h-8 text-purple-400 mx-auto mb-3" />
          <p className="text-slate-600 font-medium">
            Aún no tienes pacientes asociados.
          </p>
        </div>
      ) : (
        <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
          {filteredPatients.map((patient, index) => (
            <div
              key={patient.idUsuario ?? index}
              className="border-2 border-purple-200 rounded-xl overflow-hidden shadow-sm hover:shadow-lg hover:border-purple-500 transition-all duration-300"
            >
              {/* Header del Paciente */}
              <div
                className="p-5 cursor-pointer flex justify-between items-center hover:bg-purple-50/70 transition-colors"
                onClick={() => togglePatient(patient.idUsuario)}
              >
                <div className="flex items-center gap-4 flex-1">
                  {/* Avatar */}
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-200 to-violet-300 rounded-full flex items-center justify-center border-2 border-purple-400">
                    <UserCircle className="w-7 h-7 text-purple-700" />
                  </div>
                  <div className="flex-1">
                    <p className="text-lg font-bold text-slate-900">{patient.nombre}</p>
                    <p className="text-sm text-slate-500">{patient.correo}</p>

                    {/* Contador de sesiones */}
                    <div className="flex items-center gap-1 mt-1">
                      <CheckCircle className="w-3 h-3 text-green-600" />
                      <span className="text-xs text-green-700 font-semibold">
                        {patient.sesionesCompletadas || 0}{' '}
                        {patient.sesionesCompletadas === 1
                          ? 'sesión completada'
                          : 'sesiones completadas'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-sm bg-purple-100 text-purple-800 px-3 py-1.5 rounded-full font-bold shadow-sm">
                    Paciente
                  </span>
                  {expandedPatient === patient.idUsuario ? (
                    <ChevronUp className="w-5 h-5 text-purple-600 transform rotate-180 transition-transform duration-300" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-purple-600 transition-transform duration-300" />
                  )}
                </div>
              </div>

              {/* Contenido Expandible */}
              {expandedPatient === patient.idUsuario && (
                <div className="px-5 pb-5 pt-3 bg-purple-50 border-t-2 border-purple-200 space-y-4">
                  {/* Sección de Cuidadores */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-sm font-bold text-slate-800 flex items-center gap-1">
                        <Shield className="w-4 h-4 text-purple-600" />
                        Cuidador Principal:
                      </p>
                      <Button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleOpenCaregiversModal(patient)
                        }}
                        size="default"
                        variant="outline"
                        className="h-9 text-sm border-purple-400 text-purple-700 hover:bg-purple-100 hover:border-purple-600 font-semibold"
                      >
                        <UserPlus className="w-4 h-4 mr-2" />
                        Gestionar Cuidadores
                      </Button>
                    </div>

                    {patient.cuidador ? (
                      <div className="flex items-center gap-4 bg-white rounded-xl p-4 border border-blue-200 shadow-md">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center border border-blue-300">
                          <Shield className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-md font-semibold text-slate-800">
                            {patient.cuidador.nombre}
                          </p>
                          <p className="text-sm text-slate-500">
                            {patient.cuidador.correo}
                          </p>
                        </div>
                        <span className="text-xs bg-blue-100 text-blue-800 px-3 py-1.5 rounded-full font-bold">
                          Cuidador
                        </span>
                      </div>
                    ) : (
                      <div className="bg-amber-100 border border-amber-300 rounded-xl p-4 flex items-center gap-3">
                        <Shield className="w-5 h-5 text-amber-600 flex-shrink-0" />
                        <p className="text-sm text-amber-800 font-medium">
                          Este paciente aún no tiene un cuidador principal asignado.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Botón Ver Sesiones */}
                  <Button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleViewSessions(patient.idUsuario, patient.nombre)
                    }}
                    className="w-full bg-gradient-to-r from-purple-700 to-violet-800 hover:from-purple-800 hover:to-violet-900 text-white shadow-xl py-3 text-base font-bold transition-all duration-300 rounded-xl"
                    size="default"
                    disabled={!patient.sesionesCompletadas || patient.sesionesCompletadas === 0}
                  >
                    <FileText className="w-5 h-5 mr-2" />
                    {patient.sesionesCompletadas && patient.sesionesCompletadas > 0
                      ? 'Ver Reporte de Sesiones Detalladas'
                      : 'Sin sesiones completadas (Reporte inactivo)'}
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>

    {/* Modal de Sesiones */}
    {selectedPatient && (
      <PatientSessionsModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        patientId={selectedPatient.id}
        patientName={selectedPatient.name}
      />
    )}

    {/* Modal de Cuidadores */}
    {isCaregiversModalOpen && selectedPatientForCaregivers && (
      <PatientCaregiversModal
        open={isCaregiversModalOpen}
        onClose={handleCloseCaregiversModal}
        patient={selectedPatientForCaregivers}
        onUpdate={handleCaregiversUpdate}
      />
    )}
  </>
)

}