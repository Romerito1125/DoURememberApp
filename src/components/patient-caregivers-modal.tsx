"use client"

import { useState, useEffect } from "react"
import { X, Mail, Calendar, Heart, AlertCircle, Loader2, UserPlus, Search, CheckCircle, Cake, Trash2 } from "lucide-react"
import { assignmentService, Usuario } from "@/services/assignment.service"
import { authService } from "@/services/auth.service"
import { Dialog, DialogContent, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

interface Patient extends Usuario {
  idPaciente?: string
}

interface Caregiver extends Usuario {
  // Puedes agregar campos adicionales específicos de cuidador si los necesitas
}

interface PatientCaregiversModalProps {
  open: boolean
  onClose: () => void
  patient: Patient | null
  onUpdate: () => void
}

export function PatientCaregiversModal({ 
  open, 
  onClose, 
  patient,
  onUpdate 
}: PatientCaregiversModalProps) {
  const [assignedCaregivers, setAssignedCaregivers] = useState<Usuario[]>([])
  const [availableCaregivers, setAvailableCaregivers] = useState<any[]>([])
  const [isLoadingCaregivers, setIsLoadingCaregivers] = useState(false)
  const [isLoadingAvailable, setIsLoadingAvailable] = useState(false)
  const [isRemoving, setIsRemoving] = useState<string | null>(null)
  const [isAssigning, setIsAssigning] = useState<string | null>(null)
  const [error, setError] = useState("")
  const [showAssignSection, setShowAssignSection] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  
  // Estados para el modal de confirmación
  const [showConfirmDelete, setShowConfirmDelete] = useState(false)
  const [caregiverToRemove, setCaregiverToRemove] = useState<{id: string, name: string} | null>(null)
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)

  useEffect(() => {
    if (open && patient) {
      console.log('🔍 Modal abierto con paciente:', patient)
      loadAssignedCaregivers()
      setShowAssignSection(false)
      setSearchQuery("")
    }
  }, [open, patient])

  useEffect(() => {
    if (!open) {
      resetModal()
    }
  }, [open])

  useEffect(() => {
    if (showAssignSection) {
      loadAvailableCaregivers()
    }
  }, [showAssignSection])

  const resetModal = () => {
    setAssignedCaregivers([])
    setAvailableCaregivers([])
    setError("")
    setShowAssignSection(false)
    setIsRemoving(null)
    setIsAssigning(null)
    setSearchQuery("")
    setShowConfirmDelete(false)
    setCaregiverToRemove(null)
    setShowSuccessMessage(false)
  }

  const getPatientId = () => {
    if (!patient) return ''
    const id = patient.idPaciente || patient.idUsuario || ''
    console.log('🆔 ID del paciente obtenido:', id)
    return id
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'No especificada'
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      })
    } catch {
      return dateString
    }
  }

  const calculateAge = (fechaNacimiento?: string) => {
    if (!fechaNacimiento) return null
    try {
      const birthDate = new Date(fechaNacimiento)
      const today = new Date()
      let age = today.getFullYear() - birthDate.getFullYear()
      const monthDiff = today.getMonth() - birthDate.getMonth()
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--
      }
      return age
    } catch {
      return null
    }
  }

  const loadAssignedCaregivers = async () => {
    if (!patient) return

    setIsLoadingCaregivers(true)
    setError("")

    try {
      const token = await authService.getAccessTokenAsync()
      if (!token) throw new Error('No hay token de autenticación')

      const patientId = getPatientId()
      console.log('📝 Cargando cuidadores para paciente:', patientId)
      
      const caregiversList = await assignmentService.getCaregiversByPatient(patientId, token)
      
      setAssignedCaregivers(caregiversList)
      console.log('✅ Cuidadores asignados cargados:', caregiversList)
    } catch (err: any) {
      console.error('❌ Error cargando cuidadores:', err)
      setAssignedCaregivers([])
    } finally {
      setIsLoadingCaregivers(false)
    }
  }

  const loadAvailableCaregivers = async () => {
    setIsLoadingAvailable(true)
    setError("")

    try {
      const token = await authService.getAccessTokenAsync()
      if (!token) throw new Error('No hay token de autenticación')

      const allUsersResponse = await assignmentService.getAllUsers(token)
      const allCaregivers = allUsersResponse.usuarios?.filter((u: any) => u.rol === 'cuidador') || []

      const assignedIds = assignedCaregivers.map(c => c.idUsuario || c.idCuidador)
      const available = allCaregivers.filter((c: any) => !assignedIds.includes(c.idUsuario))

      const caregiversWithAvailability = await Promise.all(
        available.map(async (caregiver: any) => {
          try {
            const isAvailable = await assignmentService.canAssignCaregiver(caregiver.idUsuario, token)
            return {
              ...caregiver,
              isAvailable
            }
          } catch {
            return {
              ...caregiver,
              isAvailable: true
            }
          }
        })
      )

      setAvailableCaregivers(caregiversWithAvailability)
      console.log('✅ Cuidadores disponibles:', caregiversWithAvailability)
      
    } catch (err: any) {
      console.error('❌ Error cargando cuidadores disponibles:', err)
      setError('Error al cargar cuidadores disponibles')
    } finally {
      setIsLoadingAvailable(false)
    }
  }

  const handleRemoveCaregiver = async (idCuidador: string) => {
    if (!patient) return

    const caregiver = assignedCaregivers.find(c => (c.idUsuario || c.idCuidador) === idCuidador)
    
    // Mostrar modal de confirmación en lugar de alert
    setCaregiverToRemove({
      id: idCuidador,
      name: caregiver?.nombre || 'este cuidador'
    })
    setShowConfirmDelete(true)
  }

  const confirmRemoveCaregiver = async () => {
    if (!patient || !caregiverToRemove) return

    setIsRemoving(caregiverToRemove.id)
    setError("")
    setShowConfirmDelete(false)

    try {
      const token = await authService.getAccessTokenAsync()
      if (!token) throw new Error('No hay token de autenticación')

      const patientId = getPatientId()
      await assignmentService.removeCaregiverFromPatient(caregiverToRemove.id, patientId, token)
      
      console.log('✅ Cuidador removido exitosamente')
      
      // Mostrar mensaje de éxito
      setShowSuccessMessage(true)
      
      // Esperar 2 segundos antes de recargar
      setTimeout(async () => {
        await loadAssignedCaregivers()
        onUpdate()
        setShowSuccessMessage(false)
        setCaregiverToRemove(null)
      }, 2000)
      
    } catch (err: any) {
      console.error('❌ Error al remover cuidador:', err)
      setError(err.message || 'Error al remover cuidador')
      setCaregiverToRemove(null)
    } finally {
      setIsRemoving(null)
    }
  }

  const cancelRemoveCaregiver = () => {
    setShowConfirmDelete(false)
    setCaregiverToRemove(null)
  }

  const handleAssignCaregiver = async (idCuidador: string) => {
    if (!patient) return

    setIsAssigning(idCuidador)
    setError("")

    try {
      const token = await authService.getAccessTokenAsync()
      if (!token) throw new Error('No hay token de autenticación')

      const patientId = getPatientId()
      console.log('📝 Asignando cuidador:', idCuidador, 'a paciente:', patientId)
      
      await assignmentService.assignCaregiverToPatient(idCuidador, patientId, token)
      
      console.log('✅ Cuidador asignado exitosamente')
      
      setShowAssignSection(false)
      await loadAssignedCaregivers()
      onUpdate()
      
    } catch (err: any) {
      console.error('❌ Error al asignar cuidador:', err)
      setError(err.message || 'Error al asignar cuidador')
    } finally {
      setIsAssigning(null)
    }
  }

  const handleClose = () => {
    if (!isRemoving && !isAssigning && !showConfirmDelete) {
      resetModal()
      onClose()
    }
  }

  if (!open || !patient) return null

  const canAssignMore = assignedCaregivers.length < 3
  const age = patient.edad || calculateAge(patient.fechaNacimiento)

  const filteredCaregivers = availableCaregivers.filter(c => 
    c.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.correo.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const availableFiltered = filteredCaregivers.filter((c: any) => c.isAvailable)
  const unavailableFiltered = filteredCaregivers.filter((c: any) => !c.isAvailable)

  // Modal de confirmación de eliminación
  if (showConfirmDelete && caregiverToRemove) {
    return (
      <Dialog open={true} onOpenChange={cancelRemoveCaregiver}>
        <DialogContent className="max-w-md p-0 border-0 bg-white rounded-2xl">
          <DialogDescription className="sr-only">
            Confirmar desasignación de cuidador
          </DialogDescription>
          
          <div className="bg-gradient-to-r from-red-600 to-red-700 px-6 py-5 rounded-t-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">
                  Confirmar Desasignación
                </h2>
                <p className="text-white/90 text-sm">
                  Esta acción no se puede deshacer
                </p>
              </div>
            </div>
          </div>

          <div className="p-6">
            <p className="text-gray-700 text-center mb-6">
              ¿Estás seguro de desasignar a{' '}
              <strong className="text-gray-900">{caregiverToRemove.name}</strong>{' '}
              de este paciente?
            </p>

            <div className="flex gap-3">
              <Button
                onClick={cancelRemoveCaregiver}
                className="flex-1 bg-white border-2 border-slate-200 text-slate-700 hover:bg-slate-100 rounded-xl px-4 py-2.5 font-medium"
              >
                Cancelar
              </Button>
              <Button
                onClick={confirmRemoveCaregiver}
                className="flex-1 bg-gradient-to-r from-red-600 to-red-700 text-white hover:from-red-700 hover:to-red-800 rounded-xl px-4 py-2.5 font-medium shadow-md flex items-center justify-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Sí, Desasignar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  // Modal de éxito
  if (showSuccessMessage) {
    return (
      <Dialog open={true} onOpenChange={() => {}}>
        <DialogContent className="max-w-md p-0 border-0 bg-white rounded-2xl">
          <DialogDescription className="sr-only">
            Cuidador desasignado exitosamente
          </DialogDescription>
          
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h3 className="text-2xl font-bold text-slate-800 mb-2">
              ¡Cuidador Desasignado!
            </h3>
            <p className="text-slate-600">
              Se ha desasignado a <strong>{caregiverToRemove?.name}</strong> exitosamente.
            </p>
            <div className="mt-4 h-1 bg-slate-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-green-500 to-green-600" 
                style={{
                  animation: 'progress 2s ease-in-out forwards',
                  width: '0%'
                }}
              ></div>
            </div>
          </div>
          <style jsx>{`
            @keyframes progress {
              from { width: 0%; }
              to { width: 100%; }
            }
          `}</style>
        </DialogContent>
      </Dialog>
    )
  }

  return (
  <Dialog open={open} onOpenChange={handleClose}>
    <DialogContent className="max-w-xl max-h-[90vh] overflow-hidden p-0 border-0 bg-white rounded-2xl">
      <DialogDescription className="sr-only">
        Gestionar cuidadores asignados al paciente {patient.nombre}
      </DialogDescription>

      <div className="bg-gradient-to-r from-purple-700 via-purple-800 to-violet-900 px-6 py-5 rounded-t-2xl flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-lg shadow-lg flex-shrink-0 border border-white/30">
            {patient.nombre.split(' ').map((n) => n[0]).join('').toUpperCase()}
          </div>

          <div className="flex-1">
            <h2 className="text-xl font-bold text-white mb-0.5">
              {patient.nombre}
            </h2>
            <span className="inline-block px-3 py-0.5 bg-white/30 text-white rounded-full text-xs font-medium">
              Paciente
            </span>
          </div>
        </div>
      </div>

      <div className="overflow-y-auto max-h-[calc(90vh-140px)]">
        {error && (
          <div className="mx-8 mt-6 bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3 animate-in fade-in duration-200">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        <div className="px-8 py-6">
          <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">
            Información del Paciente
          </h3>

          <div className="space-y-3">
            <div className="flex items-start gap-3 text-sm">
              <div className="text-gray-600 font-medium min-w-[120px]">
                Correo:
              </div>
              <div className="text-gray-900 flex-1 break-all">
                {patient.correo}
              </div>
            </div>

            <div className="flex items-start gap-3 text-sm">
              <div className="text-gray-600 font-medium min-w-[120px]">
                Fecha de Nacimiento:
              </div>
              <div className="text-gray-900 flex-1">
                {formatDate(patient.fechaNacimiento)}
                {age && (
                  <span className="ml-2 text-gray-500">({age} años)</span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-100 mx-8" />

        <div className="px-8 py-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">
              Cuidadores Asignados ({assignedCaregivers.length}/3)
            </h3>

            {!showAssignSection && canAssignMore && !isLoadingCaregivers && (
              <Button
                onClick={() => setShowAssignSection(true)}
                className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl px-6 h-10 font-medium shadow-md flex items-center"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Asignar Cuidador
              </Button>
            )}
          </div>

          {isLoadingCaregivers ? (
            <div className="flex items-center justify-center py-16">
              <div className="text-center">
                <Loader2 className="w-10 h-10 text-purple-600 animate-spin mx-auto mb-3" />
                <p className="text-sm text-gray-600">Cargando cuidadores...</p>
              </div>
            </div>
          ) : showAssignSection ? (
            <div className="space-y-6">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar por nombre o correo..."
                  className="w-full pl-12 pr-4 py-3 border-3 border-slate-200 rounded-xl focus:border-purple-500 focus:ring-4 focus:ring-purple-100 outline-none transition-all text-gray-900 placeholder:text-gray-400"
                  disabled={isLoadingAvailable}
                />
              </div>

              {isLoadingAvailable ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <Loader2 className="w-8 h-8 text-purple-600 animate-spin mx-auto mb-2" />
                    <p className="text-sm text-gray-600">Buscando cuidadores...</p>
                  </div>
                </div>
              ) : filteredCaregivers.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                  <Search className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-600 font-medium">No se encontraron cuidadores</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
                  {availableFiltered.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <p className="text-xs font-bold text-green-700 uppercase tracking-wider">
                          DISPONIBLES ({availableFiltered.length})
                        </p>
                      </div>

                      <div className="space-y-2">
                        {availableFiltered.map((caregiver: any) => (
                          <div
                            key={caregiver.idUsuario}
                            className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-xl hover:bg-green-50 transition-colors shadow-sm"
                          >
                            <div className="flex items-center gap-4 flex-1 min-w-0">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                                {caregiver.nombre
                                  .split(" ")
                                  .map((n: string) => n[0])
                                  .join("")
                                  .toUpperCase()}
                              </div>

                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-gray-900 truncate">{caregiver.nombre}</p>
                                <p className="text-sm text-gray-600 truncate">{caregiver.correo}</p>
                              </div>
                            </div>

                            <Button
                              onClick={() => handleAssignCaregiver(caregiver.idUsuario)}
                              disabled={!!isAssigning}
                              className="bg-green-600 hover:bg-green-700 text-white rounded-xl p-0 w-10 h-10 font-medium flex-shrink-0 ml-4 shadow-md flex items-center justify-center"
                              title="Asignar cuidador"
                            >
                              {isAssigning === caregiver.idUsuario ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                              ) : (
                                <UserPlus className="w-5 h-5" />
                              )}
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {unavailableFiltered.length > 0 && (
                    <div className="pt-4">
                      <div className="flex items-center gap-2 mb-3">
                        <AlertCircle className="w-4 h-4 text-gray-500" />
                        <p className="text-xs font-bold text-gray-600 uppercase tracking-wider">
                          NO DISPONIBLES ({unavailableFiltered.length})
                        </p>
                      </div>

                      <div className="space-y-2 opacity-60">
                        {unavailableFiltered.map((caregiver: any) => (
                          <div
                            key={caregiver.idUsuario}
                            className="flex items-center justify-between p-4 bg-gray-100 border border-gray-200 rounded-xl shadow-inner"
                          >
                            <div className="flex items-center gap-4 flex-1 min-w-0">
                              <div className="w-10 h-10 rounded-full bg-gray-400 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                                {caregiver.nombre
                                  .split(" ")
                                  .map((n: string) => n[0])
                                  .join("")
                                  .toUpperCase()}
                              </div>

                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-gray-700 truncate">{caregiver.nombre}</p>
                                <p className="text-sm text-gray-500 truncate">{caregiver.correo}</p>
                              </div>
                            </div>

                            <span className="text-xs px-3 py-1.5 rounded-full bg-gray-200 text-gray-600 font-medium flex-shrink-0 ml-4">
                              Ya asignado
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {availableFiltered.length === 0 && unavailableFiltered.length > 0 && (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3 mt-4">
                      <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                      <p className="text-amber-800 text-sm">
                        No hay cuidadores disponibles en este momento.
                      </p>
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-end border-t border-gray-100 mt-6 pt-6">
                <Button
                  onClick={() => setShowAssignSection(false)}
                  disabled={!!isAssigning}
                  className="bg-white border-2 border-slate-200 text-slate-700 hover:bg-slate-100 rounded-xl px-6 h-11 font-medium shadow-sm"
                >
                  Cancelar
                </Button>
              </div>
            </div>
          ) : assignedCaregivers.length === 0 ? (
            <div className="text-center py-16 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
              <Heart className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium mb-1">
                Sin cuidadores asignados
              </p>
              <p className="text-sm text-gray-400">
                Este paciente aún no tiene cuidadores
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {assignedCaregivers.map((caregiver) => {
                const caregiverId =
                  caregiver.idUsuario || caregiver.idCuidador || '';
                const initials = caregiver.nombre
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .toUpperCase();

                return (
                  <div
                    key={caregiverId}
                    className="flex items-center gap-4 p-4 bg-white border border-purple-200 rounded-xl hover:bg-purple-50 transition-colors group shadow-sm"
                  >
                    <div className="w-11 h-11 rounded-full bg-gradient-to-br from-purple-500 to-violet-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                      {initials}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900">
                        {caregiver.nombre}
                      </p>
                      <p className="text-sm text-gray-600">
                        {caregiver.correo}
                      </p>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveCaregiver(caregiverId);
                      }}
                      disabled={!!isRemoving}
                      className="p-2 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-50"
                      title="Desasignar cuidador"
                    >
                      {isRemoving === caregiverId ? (
                        <Loader2 className="w-5 h-5 text-red-600 animate-spin" />
                      ) : (
                        <X className="w-5 h-5 text-red-500" />
                      )}
                    </button>
                  </div>
                );
              })}

              {!canAssignMore && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3 mt-4">
                  <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <p className="text-amber-800 text-sm">
                    Este paciente ya tiene el máximo de 3 cuidadores asignados.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="px-8 py-4 border-t border-gray-100 bg-gray-50 flex justify-end rounded-b-2xl">
        <Button
          onClick={handleClose}
          disabled={!!isRemoving || !!isAssigning}
          className="bg-white border-2 border-slate-200 text-slate-700 hover:bg-slate-100 rounded-xl px-8 h-11 font-medium shadow-sm"
        >
          Cerrar
        </Button>
      </div>
    </DialogContent>
  </Dialog>
);

}