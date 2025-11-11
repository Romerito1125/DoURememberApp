"use client"

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { authService } from '@/services/auth.service'

export default function UsersLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    checkAuth()
  }, [pathname])

  const checkAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()

      /*if (!session) {
        console.log('❌ No hay sesión en layout /users, redirigiendo')
        router.replace('/authentication/login')
        return
      }*/

      // Verificar que el usuario tenga el rol correcto para la ruta
      /*const userRole = authService.getUserRole()
      
      if (pathname.startsWith('/users/doctor') && userRole !== 'medico') {
        console.log('❌ Usuario no es médico')
        router.replace('/')
        return
      }

      if (pathname.startsWith('/users/patient') && userRole !== 'paciente') {
        console.log('❌ Usuario no es paciente')
        router.replace('/')
        return
      }

      if (pathname.startsWith('/users/cuidador') && userRole !== 'cuidador') {
        console.log('❌ Usuario no es cuidador')
        router.replace('/')
        return
      }

      if (pathname.startsWith('/users/admin') && userRole !== 'administrador') {
        console.log('❌ Usuario no es administrador')
        router.replace('/')
        return
      }*/

      setIsChecking(false)

    } catch (error) {
      console.error('Error en checkAuth:', error)
      router.replace('/authentication/login')
    }
  }

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-100 to-slate-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Verificando permisos...</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}