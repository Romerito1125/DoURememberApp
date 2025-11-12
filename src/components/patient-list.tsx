"use client"

import { useState, useEffect } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { PatientSessionDetails } from "./patient-session-details"
import { ChevronRight, UserMinus, BarChart3, Loader2 } from "lucide-react"
import { PatientDetailModal } from "@/components/patient-detail-modal"
import { createClient } from "@/utils/supabase/client"
import { PatientCaregiversModal } from "./patient-caregivers-modal"

const API_URL = 'https://api.devcorebits.com/api'

interface PatientListProps {
    searchQuery?: string
}

interface Patient {
    idPaciente: string
    idUsuario: string // Siempre requerido para compatibilidad con modal
    nombre: string
    correo: string
    edad?: number
    fechaNacimiento?: string // String opcional (el modal lo maneja)
    rol: string
    totalSesiones?: number
    sesionesCompletadas?: number
    sesionesActivas?: number
    cuidador?: {
        idCuidador: string
        nombre: string
        correo: string
    }
    lastSession?: string
}

interface Caregiver {
    idCuidador: string
    nombre: string
    correo: string
    edad?: number
    fechaNacimiento?: string // Opcional como en Patient
    rol: string
    pacientes?: Array<{
        idPaciente: string
        nombre: string
    }>
}

type User = Patient | Caregiver

export function PatientList({ searchQuery = "" }: PatientListProps) {
    const [users, setUsers] = useState<User[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [selectedPatientForCaregivers, setSelectedPatientForCaregivers] = useState<Patient | null>(null)
    const [isCareGiversModalOpen, setIsCareGiversModalOpen] = useState(false)
    const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
    const [selectedPatientForDetails, setSelectedPatientForDetails] = useState<{
        id: string
        name: string
    } | null>(null)

    useEffect(() => {
        loadUsers()
    }, [])

    const loadUsers = async () => {
        setIsLoading(true)
        try {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()
            
            if (!user) {
                console.log('❌ No hay usuario autenticado')
                return
            }

            console.log('👤 Cargando usuarios para médico:', user.id)

            // 1. Obtener pacientes del médico
            const pacientesResponse = await fetch(
                `${API_URL}/usuarios-autenticacion/pacientesDeMedico/${user.id}`
            )
            
            if (!pacientesResponse.ok) {
                throw new Error('Error al obtener pacientes')
            }

            const pacientesData = await pacientesResponse.json()
            const pacientesList = pacientesData.pacientes || []

            console.log('📋 Pacientes obtenidos:', pacientesList.length)
            console.log("pacientesData:", pacientesData)
            console.log("pacientesList:", pacientesList)

            // 2. Para cada paciente, obtener información adicional
            const pacientesConInfo = await Promise.all(
                pacientesList.map(async (paciente: any) => {
                    try {
                        // ✅ Obtener perfil completo del paciente desde buscarUsuario
                        let perfilCompleto = paciente
                        
                        try {
                            const token = await supabase.auth.getSession()
                            const perfilResponse = await fetch(
                                `${API_URL}/usuarios-autenticacion/buscarUsuario/${paciente.idUsuario}`,
                                {
                                    headers: {
                                        'Authorization': `Bearer ${token.data.session?.access_token}`
                                    }
                                }
                            )
                            
                            if (perfilResponse.ok) {
                                const perfilData = await perfilResponse.json()
                                if (perfilData.usuarios && perfilData.usuarios.length > 0) {
                                    perfilCompleto = {
                                        ...paciente,
                                        ...perfilData.usuarios[0],
                                        idUsuario: paciente.idUsuario // Mantener el ID correcto
                                    }
                                }
                            }
                        } catch (error) {
                            console.error(`Error al obtener perfil completo del paciente ${paciente.idUsuario}:`, error)
                        }

                        // Obtener cuidador del paciente
                        let cuidador = null
                        try {
                            const cuidadorResponse = await fetch(
                                `${API_URL}/usuarios-autenticacion/pacienteCuidador/${paciente.idUsuario}`
                            )
                            
                            if (cuidadorResponse.ok) {
                                const cuidadorData = await cuidadorResponse.json()
                                cuidador = cuidadorData.cuidador || null
                            }
                        } catch (error) {
                            console.error(`Error al obtener cuidador del paciente ${paciente.idUsuario}:`, error)
                        }

                        // Obtener cantidad de sesiones del paciente
                        let sesionesInfo = {
                            totalSesiones: 0,
                            sesionesCompletadas: 0,
                            sesionesActivas: 0
                        }

                        try {
                            const sesionesResponse = await fetch(
                                `${API_URL}/descripciones-imagenes/cantidadSesiones/${paciente.idUsuario}`
                            )
                            
                            if (sesionesResponse.ok) {
                                const sesionesData = await sesionesResponse.json()
                                sesionesInfo = {
                                    totalSesiones: sesionesData.total || 0,
                                    sesionesCompletadas: sesionesData.completadas || 0,
                                    sesionesActivas: sesionesData.activas || 0
                                }
                            }
                        } catch (error) {
                            console.error(`Error al obtener sesiones del paciente ${paciente.idUsuario}:`, error)
                        }

                        // ✅ Retornar con toda la información - ASEGURAR idUsuario
                        return {
                            idPaciente: paciente.idUsuario,
                            idUsuario: paciente.idUsuario, // CRÍTICO: Siempre incluir
                            nombre: perfilCompleto.nombre || 'Sin nombre',
                            correo: perfilCompleto.correo || 'Sin correo',
                            edad: perfilCompleto.edad || 0,
                            fechaNacimiento: perfilCompleto.fechaNacimiento || undefined, // Enviar undefined en vez de null
                            rol: 'paciente',
                            cuidador: cuidador,
                            totalSesiones: sesionesInfo.totalSesiones,
                            sesionesCompletadas: sesionesInfo.sesionesCompletadas,
                            sesionesActivas: sesionesInfo.sesionesActivas
                        }
                    } catch (error) {
                        console.error(`Error al procesar paciente ${paciente.idUsuario}:`, error)
                        return {
                            idPaciente: paciente.idUsuario,
                            idUsuario: paciente.idUsuario, // CRÍTICO: Siempre incluir
                            nombre: paciente.nombre || 'Sin nombre',
                            correo: paciente.correo || 'Sin correo',
                            edad: paciente.edad || 0,
                            fechaNacimiento: paciente.fechaNacimiento || undefined,
                            rol: 'paciente',
                            cuidador: null,
                            totalSesiones: 0,
                            sesionesCompletadas: 0,
                            sesionesActivas: 0
                        }
                    }
                })
            )

            // 3. Agrupar cuidadores únicos
            const cuidadoresMap = new Map<string, Caregiver>()
            
            pacientesConInfo.forEach((paciente) => {
                if (paciente.cuidador) {
                    const cuidadorId = paciente.cuidador.idCuidador
                    
                    if (cuidadoresMap.has(cuidadorId)) {
                        const cuidador = cuidadoresMap.get(cuidadorId)!
                        if (!cuidador.pacientes) cuidador.pacientes = []
                        cuidador.pacientes.push({
                            idPaciente: paciente.idPaciente,
                            nombre: paciente.nombre
                        })
                    } else {
                        cuidadoresMap.set(cuidadorId, {
                            idCuidador: cuidadorId,
                            nombre: paciente.cuidador.nombre,
                            correo: paciente.cuidador.correo,
                            edad: 0,
                            rol: 'cuidador',
                            pacientes: [{
                                idPaciente: paciente.idPaciente,
                                nombre: paciente.nombre
                            }]
                        })
                    }
                }
            })

            const cuidadoresList = Array.from(cuidadoresMap.values())

            // 4. Combinar pacientes y cuidadores
            const allUsers: User[] = [...pacientesConInfo, ...cuidadoresList]

            console.log('✅ Usuarios cargados:', {
                pacientes: pacientesConInfo.length,
                cuidadores: cuidadoresList.length,
                total: allUsers.length
            })

            setUsers(allUsers)

        } catch (error) {
            console.error('❌ Error al cargar usuarios:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleOpenCaregiversModal = (patient: Patient) => {
        console.log('🔓 Abriendo modal de cuidadores con paciente:', patient)
        
        // Validación estricta antes de abrir el modal
        if (!patient.idUsuario && !patient.idPaciente) {
            console.error('❌ Error: Paciente sin ID válido')
            alert('Error: No se puede abrir el modal sin un ID de paciente válido')
            return
        }

        // Normalizar datos del paciente para el modal
        const normalizedPatient: Patient = {
            idPaciente: patient.idUsuario || patient.idPaciente,
            idUsuario: patient.idUsuario || patient.idPaciente,
            nombre: patient.nombre,
            correo: patient.correo,
            edad: patient.edad,
            fechaNacimiento: patient.fechaNacimiento, // Puede ser undefined, el modal lo maneja
            rol: patient.rol,
            cuidador: patient.cuidador,
            totalSesiones: patient.totalSesiones,
            sesionesCompletadas: patient.sesionesCompletadas,
            sesionesActivas: patient.sesionesActivas
        }
        
        console.log('✅ Paciente normalizado:', normalizedPatient)
        setSelectedPatientForCaregivers(normalizedPatient)
        setIsCareGiversModalOpen(true)
    }

    const handleCloseCaregiversModal = () => {
        setIsCareGiversModalOpen(false)
        setSelectedPatientForCaregivers(null)
    }

    const handleCaregiversUpdate = () => {
        loadUsers()
    }

    const handleDisassociate = async (userId: string, userRole: string) => {
        if (!confirm("¿Estás seguro de desasociar este usuario?")) {
            return
        }

        try {
            alert("Función de desasociación pendiente de implementación en el backend")
            console.log("Desasociando usuario:", userId, userRole)
        } catch (error) {
            console.error('Error al desasociar:', error)
            alert("Error al desasociar el usuario")
        }
    }

    // Filtrar usuarios según búsqueda
    const filteredUsers = users.filter(user => {
        const searchLower = searchQuery.toLowerCase()
        
        if ('idPaciente' in user) {
            // Es un paciente
            return (
                user.nombre.toLowerCase().includes(searchLower) ||
                user.correo.toLowerCase().includes(searchLower) ||
                user.cuidador?.nombre.toLowerCase().includes(searchLower) ||
                user.cuidador?.correo.toLowerCase().includes(searchLower)
            )
        } else {
            // Es un cuidador
            return (
                user.nombre.toLowerCase().includes(searchLower) ||
                user.correo.toLowerCase().includes(searchLower) ||
                user.pacientes?.some(p => 
                    p.nombre.toLowerCase().includes(searchLower)
                ) || false
            )
        }
    })

    if (isLoading) {
        return (
            <div className="bg-white rounded-3xl shadow-sm p-6 sm:p-8">
                <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                        <Loader2 className="w-12 h-12 text-purple-600 animate-spin mx-auto mb-4" />
                        <p className="text-slate-600">Cargando usuarios...</p>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <>
            <div className="bg-white rounded-3xl shadow-sm p-6 sm:p-8">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">
                        Usuarios Asociados
                    </h2>
                    <span className="text-sm text-gray-500">
                        {filteredUsers.length} usuario{filteredUsers.length !== 1 ? 's' : ''}
                    </span>
                </div>

                {filteredUsers.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-gray-500">
                            {searchQuery ? 'No se encontraron usuarios' : 'No tienes usuarios asociados'}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filteredUsers.map((user, index) => {
                            const isPatient = 'idPaciente' in user
                            const userId = isPatient ? user.idPaciente : (user as Caregiver).idCuidador
                            // Key único para evitar duplicados
                            const uniqueKey = `${isPatient ? 'patient' : 'caregiver'}-${userId}-${index}`
                            
                            return (
                                <div
                                    key={uniqueKey}
                                    className="flex items-center justify-between p-4 rounded-2xl border border-gray-100 hover:border-purple-200 hover:bg-purple-50/30 transition-all duration-300 cursor-pointer"
                                    onClick={() => {
                                        if (isPatient) {
                                            handleOpenCaregiversModal(user as Patient)
                                        }
                                    }}
                                >
                                    <div className="flex items-center gap-4 flex-1">
                                        <Avatar className="w-12 h-12 sm:w-14 sm:h-14">
                                            <AvatarImage src={`/avatars/${user.nombre.toLowerCase().replace(' ', '-')}.jpg`} />
                                            <AvatarFallback className="bg-purple-100 text-purple-600 font-semibold">
                                                {user.nombre.split(' ').map(n => n[0]).join('')}
                                            </AvatarFallback>
                                        </Avatar>

                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-semibold text-gray-900 text-base sm:text-lg">
                                                    {user.nombre}
                                                </h3>
                                                <span className={`text-xs px-2 py-1 rounded-full ${
                                                    isPatient
                                                        ? 'bg-blue-100 text-blue-700' 
                                                        : 'bg-green-100 text-green-700'
                                                }`}>
                                                    {isPatient ? 'Paciente' : 'Cuidador'}
                                                </span>
                                            </div>
                                            
                                            <p className="text-sm text-gray-500">
                                                {user.edad && user.edad > 0 && `${user.edad} años • `}{user.correo}
                                            </p>
                                            
                                            {isPatient && (user as Patient).cuidador && (
                                                <p className="text-xs text-gray-400 mt-1">
                                                    Cuidador: {(user as Patient).cuidador!.nombre}
                                                </p>
                                            )}
                                            
                                            {!isPatient && (user as Caregiver).pacientes && (
                                                <p className="text-xs text-gray-400 mt-1">
                                                    Pacientes: {(user as Caregiver).pacientes!.map(p => p.nombre).join(', ')}
                                                </p>
                                            )}
                                            
                                            {isPatient && (
                                                <div className="flex items-center gap-3 mt-1">
                                                    <p className="text-xs text-purple-600 font-medium">
                                                        {(user as Patient).totalSesiones || 0} sesiones totales
                                                    </p>
                                                    {(user as Patient).sesionesActivas! > 0 && (
                                                        <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full">
                                                            {(user as Patient).sesionesActivas} activas
                                                        </span>
                                                    )}
                                                    {(user as Patient).sesionesCompletadas! > 0 && (
                                                        <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full">
                                                            {(user as Patient).sesionesCompletadas} completadas
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        {isPatient && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    setSelectedPatientForDetails({
                                                        id: (user as Patient).idPaciente,
                                                        name: user.nombre
                                                    })
                                                }}
                                                className="rounded-full hover:bg-purple-100 hover:text-purple-600"
                                                title="Ver sesiones detalladas"
                                            >
                                                <BarChart3 className="w-4 h-4" />
                                            </Button>
                                        )}
                                        
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                handleDisassociate(userId, user.rol)
                                            }}
                                            className="rounded-full hover:bg-red-100 hover:text-red-600"
                                            title="Desasociar"
                                        >
                                            <UserMinus className="w-4 h-4" />
                                        </Button>
                                        
                                        <ChevronRight className="w-5 h-5 text-gray-400" />
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>

            {/* Modal de detalles de sesiones */}
            {selectedPatientForDetails && (
                <PatientSessionDetails
                    patientId={selectedPatientForDetails.id}
                    patientName={selectedPatientForDetails.name}
                    onClose={() => setSelectedPatientForDetails(null)}
                />
            )}

            {/* Modal de cuidadores */}
            {isCareGiversModalOpen && selectedPatientForCaregivers && (
                <PatientCaregiversModal
                    open={isCareGiversModalOpen}
                    onClose={handleCloseCaregiversModal}
                    patient={selectedPatientForCaregivers}
                    onUpdate={handleCaregiversUpdate}
                />
            )}
        </>
    )
}