"use client"

import { useRouter } from "next/navigation"
import Image from "next/image"

interface DashboardHeaderProps {
    showLoginButton?: boolean
}

export function DashboardHeader({ showLoginButton = false }: DashboardHeaderProps) {
    const router = useRouter()

    const handleLogoClick = () => {
        router.push('/') 
    }

    const handleLogin = () => {
        router.push('/authentication/login')
    }

    return (
        <div className="flex items-center justify-between">
            {/* LOGO */}
            <div 
                className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
                onClick={handleLogoClick}
            >
                <Image
                    src="/loading.svg"
                    alt="DoURemember Logo"
                    width={42}
                    height={42}
                    className="object-contain"
                    priority
                />
                <h1 className="text-2xl font-bold text-slate-800">DoURemember</h1>
            </div>

            {/* BOTÓN DE INICIAR SESIÓN */}
            {showLoginButton && (
                <button
                    onClick={handleLogin}
                    className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
                >
                    Iniciar Sesión
                </button>
            )}
        </div>
    )
}