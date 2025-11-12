"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Mail, Lock, AlertCircle, Loader2 } from "lucide-react"
import Input from "@/app/components/input"
import GoogleSignInButton from "@/app/components/auth/GoogleSignInButton"
import GoogleOneTap from "@/app/components/auth/GoogleOneTap"
import { authService } from "@/services/auth.service"
import { createClient } from "@/utils/supabase/client"
import Header from "@/app/components/header"

interface FormData {
  email: string
  password: string
}

interface FormErrors {
  email?: string
  password?: string
  general?: string
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.devcorebits.com'

function LoginForm() {
  const [formData, setFormData] = useState<FormData>({ email: "", password: "" })
  const [errors, setErrors] = useState<FormErrors>({})
  const [isLoading, setIsLoading] = useState(false)
  const [isCheckingSession, setIsCheckingSession] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const checkExistingSession = async () => {
      try {
        console.log('🔍 Verificando sesión existente...')

        const { data: { session }, error } = await supabase.auth.getSession()

        if (error) {
          console.error('❌ Error al verificar sesión:', error)
          setIsCheckingSession(false)
          return
        }

        if (session) {
          console.log('✅ Sesión activa encontrada, obteniendo datos del usuario...')

          try {
            const userResponse = await fetch(
              `${API_URL}/api/usuarios-autenticacion/buscarUsuario/${session.user.id}`,
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
              console.log('⚠️ No se pudieron obtener datos del usuario, limpiando sesión...')
              await supabase.auth.signOut()
            }
          } catch (err) {
            console.error('❌ Error al obtener datos del usuario:', err)
            await supabase.auth.signOut()
          }
        }

        console.log('ℹ️ No hay sesión activa')
      } catch (error) {
        console.error('❌ Error al verificar sesión:', error)
      } finally {
        setIsCheckingSession(false)
      }
    }

    checkExistingSession()
  }, [router, supabase])

  const goToSignUp = () => {
    router.push("/authentication/signup")
  }

  const goToResetPassword = () => {
    router.push("/authentication/reset-password")
  }

  const validate = (): FormErrors => {
    const newErrors: FormErrors = {}

    if (!formData.email) {
      newErrors.email = "El correo es requerido"
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Correo inválido"
    }

    if (!formData.password) {
      newErrors.password = "La contraseña es requerida"
    } else if (formData.password.length < 10) {
      newErrors.password = "La contraseña debe tener mínimo 10 caracteres"
    }

    return newErrors
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setErrors({})

    const newErrors = validate()
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setIsLoading(true)

    try {
      console.log('🔐 Enviando solicitud de login...')
      const response = await fetch(`${API_URL}/api/usuarios-autenticacion/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Credenciales inválidas')
      }

      const data = await response.json()
      const { token, idUsuario } = data

      if (!token || !idUsuario) {
        throw new Error('La respuesta del servidor no contiene token o idUsuario')
      }

      console.log('✅ Login exitoso, guardando token...')
      localStorage.setItem('authToken', token)

      // Buscar el usuario por ID para obtener su rol
      console.log('👤 Obteniendo información del usuario...')
      const userResponse = await fetch(
        `${API_URL}/api/usuarios-autenticacion/buscarUsuario/${idUsuario}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      )

      if (!userResponse.ok) {
        throw new Error('No se pudo obtener información del usuario')
      }

      const userData = await userResponse.json()
      const usuario = userData.usuarios?.[0]

      if (!usuario) {
        throw new Error('Usuario no encontrado en la respuesta')
      }

      const rol = usuario.rol
      console.log(`🎯 Usuario con rol: ${rol}`)

      // Redirigir según el rol
      switch (rol) {
        case 'medico':
          router.replace('/users/doctor')
          break
        case 'paciente':
          router.replace('/users/patient')
          break
        case 'cuidador':
          router.replace('/users/cuidador')
          break
        case 'administrador':
          router.replace('/users/admin')
          break
        default:
          router.replace('/')
      }
    } catch (error: any) {
      console.error('❌ Error en login:', error)
      setErrors({
        general: error.message || 'Error al iniciar sesión. Verifica tus credenciales.',
      })
    } finally {
      setIsLoading(false)
    }
  }


  return (
    <>
      <GoogleOneTap />

      <div className="min-h-screen flex flex-col">
        <Header showLoginButton={false} />

        <div className="flex-1 grid grid-cols-1 lg:grid-cols-2">
          <div
            className="hidden lg:block relative bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: "url('/images/grupoMedicos.jpg')" }}
          />

          <div className="flex items-center justify-center p-8 bg-gradient-to-br from-pink-100 to-indigo-800">
            <div className="w-full max-w-md bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-8">
              <h2 className="text-3xl font-bold text-slate-800 text-center mb-2">
                Bienvenido
              </h2>
              <p className="text-slate-600 text-center mb-8">
                Ingresa a tu cuenta
              </p>

              {errors.general && (
                <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-red-800 text-sm">{errors.general}</p>
                </div>
              )}

              <div className="mb-6">
                <GoogleSignInButton />
              </div>

              <div className="flex items-center my-6">
                <div className="flex-1 border-t border-slate-300"></div>
                <span className="px-4 text-sm text-slate-500">O continúa con email</span>
                <div className="flex-1 border-t border-slate-300"></div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <Input
                  label="Correo electrónico"
                  type="email"
                  icon={Mail}
                  value={formData.email}
                  onChange={(e) => {
                    setFormData({ ...formData, email: e.target.value })
                    if (errors.email) setErrors({ ...errors, email: undefined })
                  }}
                  error={errors.email}
                  placeholder="tu@correo.com"
                  disabled={isLoading}
                />

                <Input
                  label="Contraseña"
                  type="password"
                  icon={Lock}
                  value={formData.password}
                  onChange={(e) => {
                    setFormData({ ...formData, password: e.target.value })
                    if (errors.password) setErrors({ ...errors, password: undefined })
                  }}
                  error={errors.password}
                  placeholder="••••••••"
                  disabled={isLoading}
                />

                <div className="flex items-center justify-between text-sm">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                      disabled={isLoading}
                    />
                    <span className="text-slate-600">Recordarme</span>
                  </label>

                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Iniciando sesión...
                    </>
                  ) : (
                    "Iniciar sesión"
                  )}
                </button>


              </form>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default LoginForm