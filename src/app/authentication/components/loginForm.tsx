"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Mail, Lock, AlertCircle, Loader2 } from "lucide-react"

// Importaciones de componentes externos (asumiendo que existen en tu proyecto)
import Input from "@/app/components/input" 
import GoogleSignInButton from "@/app/components/auth/GoogleSignInButton"
import GoogleOneTap from "@/app/components/auth/GoogleOneTap"
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
  // Inicialización real del cliente Supabase
  const supabase = createClient() 

  useEffect(() => {
    // Lógica para verificar sesión existente
    const checkExistingSession = async () => {
      try {
        console.log('🔍 Verificando sesión existente...')

        // Lógica Supabase (para sesiones de OAuth)
        const { data: { session }, error } = await supabase.auth.getSession()

        if (error) {
          console.error('❌ Error al verificar sesión con Supabase:', error)
          setIsCheckingSession(false)
          return
        }

        let userSession: any = null;

        // PRIORIDAD 1: Sesión de Supabase (si usas Oauth/Social Login)
        if (session) {
            console.log('✅ Sesión activa de Supabase encontrada.')
            userSession = { idUsuario: session.user.id, token: session.access_token };
        } 
        // PRIORIDAD 2: Sesión de Token de la API (si usas login manual y token se guarda en sessionStorage)
        else {
            const storedToken = sessionStorage.getItem('authToken');
            const storedUserId = sessionStorage.getItem('userId');
            if (storedToken && storedUserId) {
                console.log('✅ Sesión activa de API Token encontrada.')
                userSession = { idUsuario: storedUserId, token: storedToken };
            }
        }

        if (userSession) {
          console.log('✅ Sesión activa encontrada, obteniendo datos del usuario...')

          try {
            const userResponse = await fetch(
              `${API_URL}/api/usuarios-autenticacion/buscarUsuario/${userSession.idUsuario}`,
              {
                headers: {
                  'Authorization': `Bearer ${userSession.token}`,
                  'Content-Type': 'application/json',
                }
              }
            )

            if (userResponse.ok) {
              const userData = await userResponse.json()
              const usuario = userData.usuarios?.[0]

              if (usuario) {
                let redirectPath = '/';
                switch (usuario.rol) {
                  case 'medico':
                    redirectPath = '/users/doctor';
                    break
                  case 'paciente':
                    redirectPath = '/users/patient';
                    break
                  case 'cuidador':
                    redirectPath = '/users/cuidador';
                    break
                  case 'administrador':
                    redirectPath = '/users/admin';
                    break
                }
                
                // Aplicar el retraso para asegurar que la nueva ruta lea la sesión correctamente
                console.log(`⏳ Redirigiendo a ${redirectPath} con retraso para asegurar el estado de la sesión...`);
                setTimeout(() => {
                    router.replace(redirectPath);
                }, 300); 

                return
              }
            } else {
              console.log('⚠️ No se pudieron obtener datos del usuario, limpiando sesión...')
              // Limpiar tanto Supabase como sessionStorage
              await supabase.auth.signOut()
              sessionStorage.removeItem('authToken');
              sessionStorage.removeItem('userId');
            }
          } catch (err) {
            console.error('❌ Error al obtener datos del usuario:', err)
            await supabase.auth.signOut()
            sessionStorage.removeItem('authToken');
            sessionStorage.removeItem('userId');
          }
        }

        console.log('ℹ️ No hay sesión activa')
      } catch (error) {
        console.error('❌ Error general al verificar sesión:', error)
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
      // 1. Petición de Login a la API
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
      const token = data.access_token
      const idUsuario = data.user_id

      if (!token || !idUsuario) {
        throw new Error('La respuesta del servidor no contiene token o idUsuario')
      }

      // 2. Almacenar Token y ID (¡Paso crítico antes de la redirección!)
      sessionStorage.setItem('authToken', token)
      sessionStorage.setItem('userId', idUsuario)

      console.log('✅ Login exitoso. Token almacenado en sessionStorage.')
      
      // 3. Obtener información del usuario (Rol)
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

      let redirectPath: string;
      // 4. Determinar la ruta de redirección
      switch (rol) {
        case 'medico':
          redirectPath = '/users/doctor';
          break
        case 'paciente':
          redirectPath = '/users/patient';
          break
        case 'cuidador':
          redirectPath = '/users/cuidador';
          break
        case 'administrador':
          redirectPath = '/users/admin';
          break
        default:
          redirectPath = '/';
      }

      // 5. Redirigir con retraso estratégico para evitar el race condition
      console.log(`⏳ Redirigiendo a ${redirectPath} con retraso de 300ms...`);

      setTimeout(() => {
          router.replace(redirectPath);
      }, 300); 

    } catch (error: any) {
      console.error('❌ Error en login:', error)
      setErrors({
        general: error.message || 'Error al iniciar sesión. Verifica tus credenciales.',
      })
      // Asegurarse de limpiar la sesión si falló a mitad del proceso
      sessionStorage.removeItem('authToken');
      sessionStorage.removeItem('userId');
    } finally {
      setIsLoading(false)
    }
  }


  if (isCheckingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-10 h-10 animate-spin text-purple-600" />
        <p className="ml-3 text-lg text-slate-700">Cargando sesión...</p>
      </div>
    );
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
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
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
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    setFormData({ ...formData, password: e.target.value })
                    if (errors.password) setErrors({ ...errors, password: undefined })
                  }}
                  error={errors.password}
                  placeholder="••••••••"
                  disabled={isLoading}
                />

                <div className="flex items-center justify-between text-sm">
                  <button type="button" onClick={goToResetPassword} className="text-purple-600 hover:text-purple-700 font-medium">
                    ¿Olvidaste tu contraseña?
                  </button>
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

                <div className="text-center text-sm mt-4">
                  <span className="text-slate-600">¿No tienes cuenta? </span>
                  <button type="button" onClick={goToSignUp} className="text-purple-600 hover:text-purple-700 font-medium">
                    Regístrate
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default LoginForm