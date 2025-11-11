"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Heart, Users, Calendar, Shield, ArrowRight, Loader2 } from "lucide-react"
import { createClient } from "@/utils/supabase/client"

const API_URL = 'http://localhost:3000/api'

export default function HomePage() {
  const router = useRouter()
  const [isCheckingSession, setIsCheckingSession] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        
        if (session) {
          console.log('✅ Sesión activa en HomePage, redirigiendo...')
          
          try {
            const userResponse = await fetch(
              `${API_URL}/usuarios-autenticacion/buscarUsuario/${session.user.id}`,
              {
                headers: {
                  'Authorization': `Bearer ${session.access_token}`,
                  'Content-Type': 'application/json',
                }
              }
            )

            if (userResponse.ok) {
              const userData = await userResponse.json()
              const usuario = userData.usuarios?.[0]

              if (usuario) {
                switch (usuario.rol) {
                  case 'medico':
                    router.replace('/users/doctor')
                    return
                  case 'paciente':
                    router.replace('/users/patient')
                    return
                  case 'cuidador':
                    router.replace('/users/cuidador')
                    return
                  case 'administrador':
                    router.replace('/users/admin')
                    return
                }
              }
            } else {
              console.log('⚠️ No se pudieron obtener datos, limpiando sesión...')
              await supabase.auth.signOut()
            }
          } catch (err) {
            console.error('Error al verificar usuario:', err)
            await supabase.auth.signOut()
          }
        }
      } catch (error) {
        console.error('Error al verificar sesión:', error)
      } finally {
        setIsCheckingSession(false)
      }
    }

    checkSession()
  }, [router, supabase])

  const handleLogin = () => {
    router.push('/authentication/login')
  }

  if (isCheckingSession) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-purple-600 animate-spin mx-auto mb-4" />
          <p className="text-slate-600 text-lg">Cargando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-100 flex flex-col">
      {/* Header */}
      <header className="bg-white/95 backdrop-blur-sm border-b border-slate-200 shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-3">
                <Image
                src="/loading.svg"
                alt="DoURemember Logo"
                width={42}
                height={42}
                className="object-contain"
                priority
                />
                <h1 className="text-2xl font-bold text-slate-800">
                  
                  </h1>
                  </div>

              <h1 className="text-2xl font-bold text-slate-800">DoURemember</h1>
            </div>
            
            

            <button
              onClick={handleLogin}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
            >
              Iniciar Sesión
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="container mx-auto px-6 py-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="inline-block px-4 py-2 bg-purple-100 rounded-full">
                
              </div>
              
              <h2 className="text-5xl md:text-6xl font-bold text-slate-900 leading-tight">
                Recordar también es cuidarte
                <span className="block text-purple-600">Médica Integral</span>
              </h2>
              
              <p className="text-xl text-slate-600">
                Una aplicación diseñada para fortalecer la 
                comunicación y el acompañamiento de personas con 
                problemas de memoria. Aquí, médicos, 
                cuidadores y pacientes trabajan juntos para recordar lo importante: 
                citas, actividades, y momentos que marcan la vida. Todo en un solo lugar, 
                de forma sencilla y confiable.
              </p>

              <button
                onClick={handleLogin}
                className="inline-flex items-center gap-2 px-8 py-4 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-all shadow-lg hover:shadow-xl text-lg font-semibold group"
              >
                Acceder al Sistema
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

            <div className="bg-white rounded-3xl shadow-xl p-12 relative min-h-[400px] overflow-hidden">
              
                <Image
                  src="/images/Group.png"
                  alt="Contenido Personalizado"
                  fill
                  className="object-cover rounded-3x1"
                  priority
                />
                
              </div>
            </div>
          
        </section>

        {/* Features Section */}
        <section className="bg-white py-20">
          <div className="container mx-auto px-6">
            <div className="text-center mb-16">
              <h3 className="text-4xl font-bold text-slate-900 mb-4">
                Diseñado para Todos los Roles
              </h3>
              <p className="text-xl text-slate-600 max-w-2xl mx-auto">
                Una plataforma integral que se adapta a las necesidades de cada usuario
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {/* Card Para Pacientes */}
              <div className="bg-white rounded-2xl overflow-hidden hover:shadow-lg transition-shadow border border-slate-100">
                <div className="relative h-48 bg-gradient-to-br from-slate-200 to-slate-300">
                  {/* Aquí va tu imagen de fondo */}
                  <img src="/images/Ancianita.png" alt="Pacientes" className="w-full h-full object-cover" /> 
                  
                  {/* Overlay morado con gradiente transparente */}
                  <div className="absolute inset-0 bg-gradient-to-b from-purple-600/40 via-purple-500/30 to-purple-400/20"></div>
                  
                  {/* Icono superpuesto */}
                  <div className="absolute top-6 left-6">
                    <div className="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center">
                      <Users className="w-7 h-7 text-purple-600" />
                    </div>
                  </div>
                </div>
                
                <div className="p-6">
                  <h4 className="text-xl font-bold text-slate-800 mb-3">Para Pacientes</h4>
                  <p className="text-slate-600">
                    Accede a tus citas, realiza evaluaciones cognitivas y mantén un seguimiento 
                    de tu tratamiento médico de forma sencilla.
                  </p>
                </div>
              </div>

              {/* Card Para Cuidadores */}
              <div className="bg-white rounded-2xl overflow-hidden hover:shadow-lg transition-shadow border border-slate-100">
                <div className="relative h-48 bg-gradient-to-br from-slate-200 to-slate-300">
                  {/* Aquí va tu imagen de fondo */}
                  <img src="/images/familia.jpg" alt="Cuidadores" className="w-full h-full object-cover" />
                  
                  {/* Overlay morado con gradiente transparente */}
                  <div className="absolute inset-0 bg-gradient-to-b from-purple-600/40 via-purple-500/30 to-purple-400/20"></div>
                  
                  {/* Icono superpuesto */}
                  <div className="absolute top-6 left-6">
                    <div className="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center">
                      <Heart className="w-7 h-7 text-purple-600" />
                    </div>
                  </div>
                </div>
                
                <div className="p-6">
                  <h4 className="text-xl font-bold text-slate-800 mb-3">Para Cuidadores</h4>
                  <p className="text-slate-600">
                    Gestiona imágenes familiares, crea sesiones de evaluación y monitorea 
                    el progreso de tus pacientes de manera efectiva.
                  </p>
                </div>
              </div>

              {/* Card Para Médicos */}
              <div className="bg-white rounded-2xl overflow-hidden hover:shadow-lg transition-shadow border border-slate-100">
                <div className="relative h-48 bg-gradient-to-br from-slate-200 to-slate-300">
                  {/* Aquí va tu imagen de fondo */}
                  <img src="/images/Doctor.png" alt="Médicos" className="w-full h-full object-cover" /> 
                  
                  {/* Overlay morado con gradiente transparente */}
                  <div className="absolute inset-0 bg-gradient-to-b from-purple-600/40 via-purple-500/30 to-purple-400/20"></div>
                  
                  {/* Icono superpuesto */}
                  <div className="absolute top-6 left-6">
                    <div className="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center">
                      <Calendar className="w-7 h-7 text-purple-600" />
                    </div>
                  </div>
                </div>
                
                <div className="p-6">
                  <h4 className="text-xl font-bold text-slate-800 mb-3">Para Médicos</h4>
                  <p className="text-slate-600">
                    Administra pacientes, genera reportes clínicos y realiza seguimiento 
                    profesional con herramientas especializadas.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Security Badge */}
        
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 mt-auto">
        <div className="container mx-auto px-6 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div>
                <h3 className="font-semibold text-slate-800 mb-4">Información de Contacto</h3>
                <div className="space-y-2 text-sm text-slate-600">
                  <p>+57 310 101 1010</p>
                  <p>contacto@douremember.com</p>
                  <p>UAO, CALI</p>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-slate-800 mb-4">Horarios de Atención</h3>
                <div className="space-y-2 text-sm text-slate-600">
                  <p>Lunes - Viernes: 8:00 AM - 6:00 PM</p>
                  <p>Sábados: 9:00 AM - 2:00 PM</p>
                  <p>Domingos: Cerrado</p>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-200 mt-8 pt-6 text-center">
              <p className="text-sm text-slate-500">
                Aplicación Proyecto Informático - Universidad Autónoma de Occidente © 2025.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}