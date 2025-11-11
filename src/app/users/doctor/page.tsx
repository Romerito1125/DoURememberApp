"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { DashboardHeader } from "@/components/dashboard-header"
import { SearchBar } from "@/components/search-bar"
import { AssociatedUsers } from "@/components/associated-users"
import InviteUserModal from "@/app/components/invitations/invitationModal"
import { AssignCaregiverModal } from "@/components/assign-caregiver-modal"
import { QuickStats } from "@/components/quick-stats"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { UserPlus, FileText, LogOut, UserCheck, Users, Activity, User } from "lucide-react"

import BaselineReportsModule from "@/app/components/reports/BaseLineReportsModule"
import BaselineReportsStats from "@/app/components/reports/BaseLineReportsStats"
import { authService } from "@/services/auth.service"
import { assignmentService } from "@/services/assignment.service"

interface Patient {
    idUsuario: string
    nombre: string
    correo: string
    fechaNacimiento?: string
    status: string
}

interface Caregiver {
    idUsuario: string
    nombre: string
    correo: string
    fechaNacimiento?: string
    status: string
}

export default function DoctorPage() {
    const [patients, setPatients] = useState<Patient[]>([])
    const [allCaregivers, setAllCaregivers] = useState<Caregiver[]>([])
    const [isLoading, setIsLoading] = useState<boolean>(true)
    const [doctorName, setDoctorName] = useState<string>("")
    const [doctorId, setDoctorId] = useState<string>("")
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
    const router = useRouter()
    const [searchQuery, setSearchQuery] = useState("")
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false)
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false)
    const [activeView, setActiveView] = useState<"patients" | "reports">("patients")
    const [isLoggingOut, setIsLoggingOut] = useState(false)
    const [refreshKey, setRefreshKey] = useState(0)

    useEffect(() => {
        const initializeData = async () => {
            try {
                const session = await authService.getSession()
                if (session) {
                    setDoctorName(session.nombre)
                    setDoctorId(session.userId)
                    await loadData(session.userId)
                } else {
                    console.error('No hay sesión activa')
                    router.push('/authentication/login')
                }
            } catch (error) {
                console.error('Error al inicializar datos:', error)
                router.push('/authentication/login')
            }
        }

        initializeData()
    }, [])

    const loadData = async (idMedico: string) => {
        setIsLoading(true)
        try {
            const token = await authService.getAccessTokenAsync()
            
            if (!token) {
                console.error('No se encontró token de autenticación')
                return
            }

            const patientsData = await assignmentService.getPatientsByDoctor(idMedico, token)
            setPatients(patientsData.pacientes || [])
            
            const allUsers = await assignmentService.getAllUsers(token)
            const caregivers = allUsers.usuarios?.filter((u: any) => u.rol === 'cuidador') || []
            setAllCaregivers(caregivers)
            
        } catch (error: any) {
            console.error("Error al cargar datos:", error)
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
        } catch(error) {
            console.error("Error al cerrar sesión:", error)
            localStorage.clear()
            sessionStorage.clear()
            window.location.href = '/authentication/login'
        } finally {
            setIsLoggingOut(false)
        }
    }

    const handleViewProfile = ()=>{
        router.push('/users/profile')
    }

    const handleInviteSuccess = () => {
        console.log('✅ Usuario invitado exitosamente')
        setRefreshKey(prev => prev + 1)
        loadData(doctorId)
    }

    const handleAssignSuccess = () => {
        console.log('✅ Cuidador asignado exitosamente')
        setRefreshKey(prev => prev + 1)
        loadData(doctorId)
    }
    
    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-100 via-white to-purple-50">
            <div className="sticky top-0 z-50 backdrop-blur-xl bg-white/90 border-b border-purple-200 shadow-sm">
                <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <DashboardHeader 
                        
                        
                        
                        
                    />
                </div>
            </div>

            <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-10">
                <div className="space-y-8">
                    <Card className="bg-gradient-to-r from-purple-700 via-purple-800 to-violet-900 border-0 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top">
                        <div className="p-6 sm:p-10">
                            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 lg:gap-8">
                                <div className="flex items-center gap-5">
                                    <div className="relative flex-shrink-0">
                                        <div className="w-20 h-20 rounded-2xl bg-white/30 backdrop-blur-sm flex items-center justify-center border-2 border-white/60 shadow-lg ring-4 ring-white/25">
                                            {avatarUrl ? (
                                                <img
                                                    src={avatarUrl || "/placeholder.svg"}
                                                    alt="Doctor"
                                                    className="w-full h-full rounded-2xl object-cover"
                                                />
                                            ) : (
                                                <Activity className="w-10 h-10 text-white" />
                                            )}
                                        </div>
                                        <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-400 rounded-full border-3 border-white shadow-md animate-pulse"></div>
                                    </div>
                                    <div>
                                        <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2 tracking-tight">
                                            Hola, Dr. {doctorName || 'Doctor'}
                                        </h1>
                                        <p className="text-white/90 text-base font-medium">Bienvenido a tu panel de gestión médica</p>
                                    </div>
                                </div>

                                <div className="flex flex-wrap items-center gap-3">
                                    

                                    <Button
                                    onClick={handleViewProfile}
                                    className="bg-white/20 hover:bg-white/30 text-white border-2 border-white/40 backdrop-blur-sm shadow-md hover:shadow-lg transition-all duration-300 font-semibold">
                                        <User className="w-4 h-4 sm:mr-2" />
                                        <span className="hidden sm:inline">Mi Perfil</span>
                                    </Button>
                                    
                                    <Button
                                        onClick={() => setIsInviteModalOpen(true)}
                                        className="bg-white hover:bg-gray-50 text-purple-700 shadow-md hover:shadow-lg transition-all duration-300 font-bold"
                                        size="default"
                                        disabled={isLoggingOut}
                                    >
                                        <UserPlus className="w-4 h-4 sm:mr-2" />
                                        <span className="hidden sm:inline">Invitar Usuario</span>
                                    </Button>

                                    <Button
                                        onClick={handleLogout}
                                        variant="outline"
                                        className="bg-white/15 border-2 border-white/50 text-white hover:bg-red-500 hover:border-red-500 backdrop-blur-sm transition-all duration-300 font-semibold"
                                        size="default"
                                        disabled={isLoggingOut}
                                    >
                                        <LogOut className="w-4 h-4 sm:mr-2" />
                                        {isLoggingOut ? (
                                            <span className="hidden sm:inline">Cerrando...</span>
                                        ) : (
                                            <span className="hidden sm:inline">Cerrar Sesión</span>
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </Card>

                    <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-8">
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom" style={{ animationDelay: "0.1s" }}>
                            <Card className="p-2 bg-white shadow-sm border border-purple-200 rounded-2xl">
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setActiveView("patients")}
                                        className={`flex-1 px-6 py-4 rounded-xl font-bold transition-all duration-300 flex items-center justify-center gap-2.5 ${
                                            activeView === "patients"
                                                ? "bg-gradient-to-r from-purple-500 to-violet-500 text-white shadow-lg"
                                                : "text-purple-600 hover:bg-purple-50 hover:text-purple-700"
                                        }`}
                                    >
                                        <Users className="w-5 h-5" />
                                        Pacientes
                                    </button>

                                    <button
                                        onClick={() => setActiveView("reports")}
                                        className={`flex-1 px-6 py-4 rounded-xl font-bold transition-all duration-300 flex items-center justify-center gap-2.5 ${
                                            activeView === "reports"
                                                ? "bg-gradient-to-r from-purple-500 to-violet-500 text-white shadow-lg"
                                                : "text-purple-600 hover:bg-purple-50 hover:text-purple-700"
                                        }`}
                                    >
                                        <FileText className="w-5 h-5" />
                                        Reportes Base
                                    </button>
                                </div>
                            </Card>

                            {activeView === "patients" ? (
                                <div className="space-y-6">
                                    <AssociatedUsers key={`patients-${refreshKey}`} />
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    <BaselineReportsModule key={`reports-${refreshKey}`} />
                                </div>
                            )}
                        </div>

                        <div
                            className="lg:sticky lg:top-28 h-fit space-y-6 animate-in fade-in slide-in-from-right-4"
                            style={{ animationDelay: "0.2s" }}
                        >
                            {activeView === "reports" && (
                                <div className="animate-in fade-in duration-300">
                                    <BaselineReportsStats key={`stats-${refreshKey}`} />
                                </div>
                            )}
                            <QuickStats key={`quickstats-${refreshKey}`} />
                        </div>
                    </div>
                </div>
            </div>

            <InviteUserModal 
                isOpen={isInviteModalOpen} 
                onClose={() => setIsInviteModalOpen(false)} 
                onSuccess={handleInviteSuccess}
            />

            <AssignCaregiverModal 
                open={isAssignModalOpen} 
                onClose={() => setIsAssignModalOpen(false)} 
                onSuccess={handleAssignSuccess}
                patients={patients}
                caregivers={allCaregivers}
            />
        </div>
    )  
}