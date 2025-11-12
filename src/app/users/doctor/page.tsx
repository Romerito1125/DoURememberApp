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
import { UserPlus, FileText, LogOut, Users, Activity, User } from "lucide-react"

import BaselineReportsModule from "@/app/components/reports/BaseLineReportsModule"
import BaselineReportsStats from "@/app/components/reports/BaseLineReportsStats"

const API_URL = process.env.NEXT_PUBLIC_API_URL

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
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false)
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false)
    const [activeView, setActiveView] = useState<"patients" | "reports">("patients")
    const [isLoggingOut, setIsLoggingOut] = useState(false)
    const [refreshKey, setRefreshKey] = useState(0)
    const router = useRouter()

    useEffect(() => {
        const initializeData = async () => {
            try {
                console.log("🔍 Inicializando datos...")

                const token = localStorage.getItem("authToken")
                const idMedico = localStorage.getItem("userId")

                if (!API_URL) {
                    console.error("❌ API_URL no está definido. Revisa tu archivo .env.local")
                    return
                }

                // Si no hay token o ID, redirigimos
                if (!token || !idMedico) {
                    console.warn("⚠️ No hay token o ID de usuario")
                    router.replace("/authentication/login")
                    return
                }

                // ✅ Petición al backend
                const response = await fetch(
                    `${API_URL}/api/usuarios-autenticacion/buscarUsuario/${idMedico}`,
                    {
                        method: "GET",
                        headers: {
                            Authorization: `Bearer ${token}`,
                            "Content-Type": "application/json",
                        },
                    }
                )

                if (response.status === 401) {
                    console.warn("❌ Token expirado o no autorizado")
                    localStorage.clear()
                    sessionStorage.clear()
                    router.replace("/authentication/login")
                    return
                }

                if (!response.ok) {
                    console.error("❌ Error al obtener el usuario:", response.status)
                    return
                }

                const dataUsuario = await response.json()
                console.log("👨‍⚕️ Datos de usuario recibidos:", dataUsuario)

                // 🔹 Adaptación flexible al formato del backend
                const usuario =
                    dataUsuario?.usuarios?.[0] ||
                    dataUsuario?.usuario ||
                    dataUsuario

                if (!usuario) {
                    console.warn("⚠️ No se encontró información del usuario en la respuesta")
                    return
                }

                if (usuario.rol && usuario.rol !== "medico") {
                    alert("Acceso restringido: esta cuenta no es de médico.")
                    router.replace("/authentication/login")
                    return
                }

                // ✅ Guardamos info del doctor
                setDoctorName(usuario.nombre || "Sin nombre")
                const userId = usuario.idUsuario || usuario.id
                setDoctorId(userId)

                console.log("🩺 ID del médico:", userId)

                // ✅ Cargamos datos relacionados
                await loadData(userId)

            } catch (error) {
                console.error("🚨 Error al inicializar datos:", error)
            } finally {
                setIsLoading(false)
            }
        }

        // Espera un tick para que localStorage esté disponible correctamente
        setTimeout(initializeData, 100)
    }, [router])


    const loadData = async (idMedico: string) => {
        setIsLoading(true)
        try {
            const token = localStorage.getItem("authToken")
            if (!token) throw new Error("No se encontró token de autenticación")

            const patientsResponse = await fetch(
                `${API_URL}/api/usuarios-autenticacion/pacientesDeMedico/${idMedico}`,
                {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                }
            )

            if (!patientsResponse.ok) {
                throw new Error("Error al obtener pacientes del médico")
            }

            const patientsData = await patientsResponse.json()

            // 👇 Ajuste importante: asegurar estructura y evitar arrays vacíos
            const pacientes = Array.isArray(patientsData)
                ? patientsData
                : patientsData.pacientes || []

            console.log("👨‍⚕️ Pacientes recibidos:", pacientes)
            setPatients(pacientes)

            // 🔹 Obtener todos los cuidadores
            const allUsersResponse = await fetch(
                `${API_URL}/api/usuarios-autenticacion/buscarUsuarios`,
                {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                }
            )

            if (!allUsersResponse.ok) {
                throw new Error("Error al obtener usuarios")
            }

            const allUsersData = await allUsersResponse.json()
            const caregivers =
                allUsersData.usuarios?.filter((u: any) => u.rol === "cuidador") || []
            setAllCaregivers(caregivers)
        } catch (error) {
            console.error("❌ Error en loadData:", error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleLogout = async () => {
        setIsLoggingOut(true)
        try {
            localStorage.clear()
            sessionStorage.clear()
            document.cookie.split(";").forEach((cookie) => {
                const eqPos = cookie.indexOf("=")
                const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie
                document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`
            })
            window.location.href = "/authentication/login"
        } catch (error) {
            console.error("Error inesperado al cerrar sesión:", error)
            window.location.href = "/authentication/login"
        } finally {
            setIsLoggingOut(false)
        }
    }

    const handleViewProfile = () => router.push("/users/profile")

    const handleInviteSuccess = () => {
        console.log("✅ Usuario invitado exitosamente")
        setRefreshKey((prev) => prev + 1)
        loadData(doctorId)
    }

    const handleAssignSuccess = () => {
        console.log("✅ Cuidador asignado exitosamente")
        setRefreshKey((prev) => prev + 1)
        loadData(doctorId)
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-100 via-white to-purple-50">
            <div className="sticky top-0 z-50 backdrop-blur-xl bg-white/90 border-b border-purple-200 shadow-sm">
                <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <DashboardHeader />
                </div>
            </div>

            <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-10">
                <div className="space-y-8">
                    <Card className="bg-gradient-to-r from-purple-700 via-purple-800 to-violet-900 border-0 shadow-2xl overflow-hidden">
                        <div className="p-6 sm:p-10">
                            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                                <div className="flex items-center gap-5">
                                    <div className="relative flex-shrink-0">
                                        <div className="w-20 h-20 rounded-2xl bg-white/30 flex items-center justify-center border-2 border-white/60 shadow-lg ring-4 ring-white/25">
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
                                    </div>
                                    <div>
                                        <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2 tracking-tight">
                                            Hola, Dr. {doctorName || "Doctor"}
                                        </h1>
                                        <p className="text-white/90 text-base font-medium">
                                            Bienvenido a tu panel de gestión médica
                                        </p>
                                    </div>
                                </div>

                                <div className="flex flex-wrap items-center gap-3">
                                    <Button
                                        onClick={handleViewProfile}
                                        className="bg-white/20 hover:bg-white/30 text-white border-2 border-white/40 backdrop-blur-sm shadow-md hover:shadow-lg font-semibold"
                                    >
                                        <User className="w-4 h-4 sm:mr-2" />
                                        <span className="hidden sm:inline">Mi Perfil</span>
                                    </Button>

                                    <Button
                                        onClick={() => setIsInviteModalOpen(true)}
                                        className="bg-white hover:bg-gray-50 text-purple-700 shadow-md font-bold"
                                        disabled={isLoggingOut}
                                    >
                                        <UserPlus className="w-4 h-4 sm:mr-2" />
                                        <span className="hidden sm:inline">Invitar Usuario</span>
                                    </Button>

                                    <Button
                                        onClick={handleLogout}
                                        variant="outline"
                                        className="bg-white/15 border-2 border-white/50 text-white hover:bg-red-500 hover:border-red-500"
                                        disabled={isLoggingOut}
                                    >
                                        <LogOut className="w-4 h-4 sm:mr-2" />
                                        {isLoggingOut ? "Cerrando..." : "Cerrar Sesión"}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </Card>

                    <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-8">
                        <div className="space-y-6">
                            <Card className="p-2 bg-white shadow-sm border border-purple-200 rounded-2xl">
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setActiveView("patients")}
                                        className={`flex-1 px-6 py-4 rounded-xl font-bold transition-all duration-300 flex items-center justify-center gap-2.5 ${activeView === "patients"
                                            ? "bg-gradient-to-r from-purple-500 to-violet-500 text-white shadow-lg"
                                            : "text-purple-600 hover:bg-purple-50"
                                            }`}
                                    >
                                        <Users className="w-5 h-5" />
                                        Pacientes
                                    </button>

                                    <button
                                        onClick={() => setActiveView("reports")}
                                        className={`flex-1 px-6 py-4 rounded-xl font-bold transition-all duration-300 flex items-center justify-center gap-2.5 ${activeView === "reports"
                                            ? "bg-gradient-to-r from-purple-500 to-violet-500 text-white shadow-lg"
                                            : "text-purple-600 hover:bg-purple-50"
                                            }`}
                                    >
                                        <FileText className="w-5 h-5" />
                                        Reportes Base
                                    </button>
                                </div>
                            </Card>

                            {activeView === "patients" ? (
                                <div className="space-y-6">
                                    <AssociatedUsers
                                        key={`patients-${refreshKey}`}
                                        patients={patients}
                                    />
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    <BaselineReportsModule key={`reports-${refreshKey}`} />
                                </div>
                            )}
                        </div>

                        <div className="lg:sticky lg:top-28 h-fit space-y-6">
                            {activeView === "reports" && (
                                <BaselineReportsStats key={`stats-${refreshKey}`} />
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
