"use client"

import { useState, useEffect, useRef } from "react"
import { User, LogOut } from "lucide-react"
import { useRouter } from "next/navigation"
import { createClient } from "@/utils/supabase/client"
import { authService } from "@/services/auth.service"

const API_URL = 'http://api.devcorebits.com/api'

interface UserAvatarProps {
  userName: string
  userRole: string
}

export default function UserAvatar({ userName, userRole }: UserAvatarProps) {
  const router = useRouter()
  const supabase = createClient()
  const [isOpen, setIsOpen] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  

  useEffect(() => {
    loadAvatar()
  }, [])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const loadAvatar = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const { data: { session } } = await supabase.auth.getSession()

      if (!user || !session?.access_token) return

      const response = await fetch(
        `${API_URL}/usuarios-autenticacion/buscarUsuario/${user.id}`,
        {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          }
        }
      )

      if (response.ok) {
        const userData = await response.json()
        const usuario = userData.usuarios?.[0]
        if (usuario?.fotoPerfil) {
          setAvatarUrl(usuario.fotoPerfil)
        }
      }
    } catch (error) {
      console.error('Error al cargar avatar:', error)
    }
  }

  const handleLogout = async () => {
  setIsLoggingOut(true)
  
  try {
    await authService.logout()
    localStorage.clear()
    sessionStorage.clear()
    window.location.href = '/authentication/login'
  } catch (error) {
    console.error('Error al cerrar sesión:', error)
    localStorage.clear()
    sessionStorage.clear()
    window.location.href = '/authentication/login'
  } finally {
    setIsLoggingOut(false)
  }
}

  const handleViewProfile = () => {
    setIsOpen(false)
    router.push('/users/profile')
  }

  const getRoleLabel = (role: string) => {
    const roles: Record<string, string> = {
      'medico': 'Médico',
      'paciente': 'Paciente',
      'cuidador': 'Cuidador',
      'administrador': 'Administrador'
    }
    return roles[role] || role
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-slate-100 transition-colors"
      >
        <div className="text-right">
          <p className="text-sm font-semibold text-slate-800">{userName}</p>
          <p className="text-xs text-slate-500">{getRoleLabel(userRole)}</p>
        </div>
        
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={userName}
            className="w-10 h-10 rounded-full object-cover border-2 border-purple-200"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-indigo-500 flex items-center justify-center text-white font-bold">
            {getInitials(userName)}
          </div>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-slate-200 py-2 z-50">
          <div className="px-4 py-3 border-b border-slate-200">
            <p className="text-sm font-semibold text-slate-800">{userName}</p>
            <p className="text-xs text-slate-500">{getRoleLabel(userRole)}</p>
          </div>

          <button
            onClick={handleViewProfile}
            className="w-full px-4 py-2 text-left hover:bg-slate-50 flex items-center gap-3 text-slate-700 transition-colors"
          >
            <User className="w-4 h-4" />
            <span className="text-sm">Mi Perfil</span>
          </button>

          <div className="border-t border-slate-200 my-2"></div>

          <button
            onClick={handleLogout}
            disabled={isLoggingOut} // <--- CLAVE: Usa el estado para deshabilitar
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center gap-2 font-medium disabled:opacity-70"
          >
            {isLoggingOut ? (
              // Muestra un spinner cuando se está cerrando
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <LogOut className="w-4 h-4" />
            )}
            {isLoggingOut ? 'Cerrando...' : 'Cerrar Sesión'}
          </button>
        </div>
      )}
    </div>
  )
}