"use client"

import { useState, useEffect } from "react"
import { X, AlertCircle, Heart, Search, Users, CheckCircle, Info } from "lucide-react"
import { assignmentService } from "@/services/assignment.service"
import { authService } from "@/services/auth.service"

interface Patient {
  idUsuario: string
  nombre: string
  correo: string
}

interface Caregiver {
  idUsuario: string
  nombre: string
  correo: string
  status: string
}

interface CaregiverWithAvailability extends Caregiver {
  isAvailable: boolean
  patientsCount: number
}

interface AssignCaregiverModalProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  patients: Patient[]
  caregivers: Caregiver[]
}

export function AssignCaregiverModal({ 
  open, 
  onClose, 
  onSuccess,
  patients,
  caregivers
}: AssignCaregiverModalProps) {
  const [selectedPatient, setSelectedPatient] = useState("")
  const [selectedCaregiver, setSelectedCaregiver] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoadingAvailability, setIsLoadingAvailability] = useState(false)
  const [error, setError] = useState("")
  const [caregiversWithAvailability, setCaregiversWithAvailability] = useState<CaregiverWithAvailability[]>([])
  const [patientCaregiversCount, setPatientCaregiversCount] = useState(0)

  // Cargar disponibilidad de cuidadores cuando se abre el modal
  useEffect(() => {
    if (open && caregivers.length > 0) {
      loadCaregiversAvailability()
    }
  }, [open, caregivers])

  // Cargar conteo de cuidadores del paciente seleccionado
  useEffect(() => {
    if (selectedPatient) {
      loadPatientCaregiversCount(selectedPatient)
    } else {
      setPatientCaregiversCount(0)
    }
  }, [selectedPatient])

  useEffect(() => {
    if (!open) {
      resetForm()
    }
  }, [open])

  const resetForm = () => {
    setSelectedPatient("")
    setSelectedCaregiver("")
    setSearchQuery("")
    setError("")
    setPatientCaregiversCount(0)
  }

  const loadCaregiversAvailability = async () => {
    setIsLoadingAvailability(true)
    try {
      const token = await authService.getAccessTokenAsync()
      if (!token) throw new Error('No hay token')

      const caregiversWithInfo = await Promise.all(
        caregivers.map(async (caregiver) => {
          try {
            const isAvailable = await assignmentService.canAssignCaregiver(caregiver.idUsuario, token)
            return {
              ...caregiver,
              isAvailable,
              patientsCount: isAvailable ? 0 : 1
            }
          } catch {
            return {
              ...caregiver,
              isAvailable: true, // En caso de error, asumir disponible
              patientsCount: 0
            }
          }
        })
      )

      setCaregiversWithAvailability(caregiversWithInfo)
      console.log('✅ Disponibilidad de cuidadores cargada:', caregiversWithInfo)
    } catch (error) {
      console.error('Error cargando disponibilidad:', error)
      // Fallback: asumir que todos están disponibles
      setCaregiversWithAvailability(caregivers.map(c => ({
        ...c,
        isAvailable: true,
        patientsCount: 0
      })))
    } finally {
      setIsLoadingAvailability(false)
    }
  }

  const loadPatientCaregiversCount = async (idPaciente: string) => {
    try {
      const token = await authService.getAccessTokenAsync()
      if (!token) return

      const count = await assignmentService.getPatientCaregiversCount(idPaciente, token)
      setPatientCaregiversCount(count)
      console.log(`✅ Paciente ${idPaciente} tiene ${count} cuidadores`)
    } catch (error) {
      console.error('Error cargando conteo de cuidadores:', error)
      setPatientCaregiversCount(0)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!selectedPatient) {
      setError("Debes seleccionar un paciente")
      return
    }

    if (!selectedCaregiver) {
      setError("Debes seleccionar un cuidador")
      return
    }

    // Validar límite de cuidadores por paciente (máximo 3)
    if (patientCaregiversCount >= 3) {
      setError("Este paciente ya tiene el máximo de 3 cuidadores asignados")
      return
    }

    // Validar que el cuidador esté disponible
    const caregiver = caregiversWithAvailability.find(c => c.idUsuario === selectedCaregiver)
    if (caregiver && !caregiver.isAvailable) {
      setError("Este cuidador ya tiene un paciente asignado (máximo 1 por cuidador)")
      return
    }

    setIsSubmitting(true)

    try {
      const token = await authService.getAccessTokenAsync()
      if (!token) {
        throw new Error('No se encontró token de autenticación')
      }

      await assignmentService.assignCaregiverToPatient(
        selectedCaregiver, 
        selectedPatient,
        token
      )

      console.log('✅ Cuidador asignado exitosamente')
      
      resetForm()
      onSuccess()
      onClose()
      
    } catch (err: any) {
      console.error('❌ Error al asignar cuidador:', err)
      setError(err.message || "Error al asignar cuidador")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    if (!isSubmitting) {
      resetForm()
      onClose()
    }
  }

  if (!open) return null

  const filteredCaregivers = caregiversWithAvailability.filter(c => 
    c.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.correo.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Separar cuidadores disponibles y no disponibles
  const availableCaregivers = filteredCaregivers.filter(c => c.isAvailable)
  const unavailableCaregivers = filteredCaregivers.filter(c => !c.isAvailable)

  const selectedPatientData = patients.find(p => p.idUsuario === selectedPatient)
  const selectedCaregiverData = caregiversWithAvailability.find(c => c.idUsuario === selectedCaregiver)

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">

        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-5 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-white">
              Asignar Cuidador a Paciente
            </h2>
            <p className="text-sm text-blue-100 mt-1">
              Selecciona un paciente y un cuidador disponible
            </p>
          </div>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto flex-1">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2 animate-in fade-in duration-200">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          {/* Seleccionar Paciente */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-3">
              <Users className="w-4 h-4 inline mr-1" />
              Seleccionar Paciente <span className="text-red-500">*</span>
            </label>
            
            {patients.length === 0 ? (
              <div className="text-center py-8 text-gray-500 border-2 border-slate-200 rounded-lg">
                <Users className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>No tienes pacientes registrados</p>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto border-2 border-slate-200 rounded-lg p-2">
                  {patients.map((patient) => (
                    <label
                      key={patient.idUsuario}
                      className={`flex items-center gap-3 p-3 cursor-pointer hover:bg-slate-50 rounded-lg transition-colors ${
                        selectedPatient === patient.idUsuario ? 'bg-blue-50 border-2 border-blue-500' : 'border-2 border-transparent'
                      }`}
                    >
                      <input
                        type="radio"
                        name="patient"
                        value={patient.idUsuario}
                        checked={selectedPatient === patient.idUsuario}
                        onChange={(e) => setSelectedPatient(e.target.value)}
                        className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                        disabled={isSubmitting}
                      />
                      <div className="flex-1">
                        <p className="font-medium text-slate-800">{patient.nombre}</p>
                        <p className="text-sm text-slate-600">{patient.correo}</p>
                      </div>
                    </label>
                  ))}
                </div>

                {/* Info de cuidadores del paciente seleccionado */}
                {selectedPatient && (
                  <div className={`p-3 rounded-lg border-2 flex items-start gap-2 animate-in fade-in duration-200 ${
                    patientCaregiversCount >= 3 
                      ? 'bg-red-50 border-red-200' 
                      : 'bg-blue-50 border-blue-200'
                  }`}>
                    <Info className={`w-4 h-4 flex-shrink-0 mt-0.5 ${
                      patientCaregiversCount >= 3 ? 'text-red-600' : 'text-blue-600'
                    }`} />
                    <p className={`text-sm ${
                      patientCaregiversCount >= 3 ? 'text-red-800' : 'text-blue-800'
                    }`}>
                      Este paciente tiene <strong>{patientCaregiversCount}/3</strong> cuidadores asignados
                      {patientCaregiversCount >= 3 && ' (máximo alcanzado)'}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Seleccionar Cuidador */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-3">
              <Heart className="w-4 h-4 inline mr-1" />
              Seleccionar Cuidador <span className="text-red-500">*</span>
            </label>

            {/* Búsqueda */}
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar cuidador por nombre o correo..."
                className="w-full pl-10 pr-4 py-2.5 border-2 border-slate-200 rounded-lg focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all"
                disabled={isSubmitting || isLoadingAvailability}
              />
            </div>

            {isLoadingAvailability ? (
              <div className="text-center py-8 border-2 border-slate-200 rounded-lg">
                <div className="w-8 h-8 border-2 border-blue-600/30 border-t-blue-600 rounded-full animate-spin mx-auto mb-2"></div>
                <p className="text-sm text-gray-600">Verificando disponibilidad de cuidadores...</p>
              </div>
            ) : caregivers.length === 0 ? (
              <div className="text-center py-8 text-gray-500 border-2 border-slate-200 rounded-lg">
                <Heart className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>No hay cuidadores registrados en el sistema</p>
              </div>
            ) : filteredCaregivers.length === 0 ? (
              <div className="text-center py-8 text-gray-500 border-2 border-slate-200 rounded-lg">
                <Search className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>No se encontraron cuidadores con ese criterio</p>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Cuidadores Disponibles */}
                {availableCaregivers.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-green-700 bg-green-50 px-2 py-1 rounded mb-2 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      DISPONIBLES ({availableCaregivers.length})
                    </p>
                    <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto border-2 border-green-200 rounded-lg p-2">
                      {availableCaregivers.map((caregiver) => (
                        <label
                          key={caregiver.idUsuario}
                          className={`flex items-center gap-3 p-3 cursor-pointer hover:bg-green-50 rounded-lg transition-colors ${
                            selectedCaregiver === caregiver.idUsuario 
                              ? 'bg-green-100 border-2 border-green-500' 
                              : 'border-2 border-transparent'
                          }`}
                        >
                          <input
                            type="radio"
                            name="caregiver"
                            value={caregiver.idUsuario}
                            checked={selectedCaregiver === caregiver.idUsuario}
                            onChange={(e) => setSelectedCaregiver(e.target.value)}
                            className="w-4 h-4 text-green-600 focus:ring-green-500"
                            disabled={isSubmitting}
                          />
                          <div className="flex-1">
                            <p className="font-medium text-slate-800">{caregiver.nombre}</p>
                            <p className="text-sm text-slate-600">{caregiver.correo}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700 font-medium">
                              Disponible
                            </span>
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* Cuidadores No Disponibles */}
                {unavailableCaregivers.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-gray-700 bg-gray-50 px-2 py-1 rounded mb-2 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      NO DISPONIBLES - Ya tienen paciente asignado ({unavailableCaregivers.length})
                    </p>
                    <div className="grid grid-cols-1 gap-2 max-h-32 overflow-y-auto border-2 border-gray-200 rounded-lg p-2 opacity-60">
                      {unavailableCaregivers.map((caregiver) => (
                        <div
                          key={caregiver.idUsuario}
                          className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-not-allowed"
                        >
                          <input
                            type="radio"
                            disabled
                            className="w-4 h-4 text-gray-400"
                          />
                          <div className="flex-1">
                            <p className="font-medium text-slate-600">{caregiver.nombre}</p>
                            <p className="text-sm text-slate-500">{caregiver.correo}</p>
                          </div>
                          <span className="text-xs px-2 py-1 rounded-full bg-gray-200 text-gray-700">
                            Ya asignado (1/1)
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Mensaje si no hay cuidadores disponibles */}
                {availableCaregivers.length === 0 && unavailableCaregivers.length > 0 && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <p className="text-yellow-800 text-sm">
                      No hay cuidadores disponibles. Todos los cuidadores ya tienen un paciente asignado.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Resumen de selección */}
          {selectedPatient && selectedCaregiver && selectedCaregiverData?.isAvailable && (
            <div className="bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-200 rounded-lg p-4 animate-in fade-in duration-200">
              <p className="text-sm text-slate-700 font-medium mb-2 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                Resumen de asignación:
              </p>
              <p className="text-sm text-slate-700">
                <strong className="text-green-700">{selectedCaregiverData?.nombre}</strong> será asignado(a) como cuidador(a) de{' '}
                <strong className="text-blue-700">{selectedPatientData?.nombre}</strong>
              </p>
            </div>
          )}
        </form>

        {/* Actions */}
        <div className="flex gap-3 p-6 border-t border-slate-200 bg-slate-50">
          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            className="flex-1 px-4 py-2.5 bg-white border-2 border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={
              isSubmitting || 
              !selectedPatient || 
              !selectedCaregiver || 
              isLoadingAvailability ||
              patientCaregiversCount >= 3 ||
              !selectedCaregiverData?.isAvailable
            }
            className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Asignando...
              </>
            ) : (
              <>
                <Heart className="w-4 h-4" />
                Asignar Cuidador
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}