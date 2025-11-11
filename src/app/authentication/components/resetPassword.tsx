"use client"

import { useState } from "react"
import { Mail, Lock } from "lucide-react"
import Input from "@/app/components/input"
import { useRouter } from "next/navigation"

interface FormData {
  email: string
  newPassword: string
  confirmNewPassword: string
}

interface FormErrors {
  email?: string
  newPassword?: string
  confirmNewPassword?: string
}

//COMPONENTE Reset Password
function ResetPasswordForm() {
    const [formData, setFormData]= useState<FormData>({
        email:"",
        newPassword:"",
        confirmNewPassword:""
    })
    const [errors, setErrors]= useState<FormErrors>({})
    const [isLoading, setIsLoading]= useState(false)
    const router = useRouter()

    const goToLogin = ()=>{
        router.push("/authentication/login")
    }

    const validate = () =>{
        const newErrors: FormErrors = {}
        if(!formData.email) newErrors.email = "El correo es requerido"
        else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = "Correo inválido"
        if (!formData.newPassword) newErrors.newPassword = "La nueva contraseña es requerida"
        else if (formData.newPassword.length <8) newErrors.newPassword = "La nueva contraseña requiere un mínimo de 8 caracteres"
        else if (!/(?=.*[A-Z])/.test(formData.newPassword)) newErrors.newPassword = "La nueva contraseña debe contener una mayúscula"
        else if (!/(?=.*[!@#$%^&*])/.test(formData.newPassword)) newErrors.newPassword = "La nueva contraseña debe contener un símbolo"

        if (formData.confirmNewPassword !== formData.newPassword) {
            newErrors.confirmNewPassword = "Las contraseñas no coinciden"
        }
        return newErrors
    }

    const handleSubmit = (e: React.FormEvent) =>{
        e.preventDefault()
        const newErrors= validate()
        if (Object.keys(newErrors).length>0){
            setErrors(newErrors)
            return
        }
        setIsLoading(true)
        setTimeout(()=>{
            setIsLoading(false)
            alert("Contraseña restablecida con éxito")
            goToLogin()
        }, 1500)
    }

    return (
      <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2">
        {/* Sección de imagen - lado izquierdo */}
        <div 
          className="hidden lg:block relative bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: "url('/images/familia.jpg')" }}
        />
        
        {/* Sección de formulario - lado derecho */}
        <div className="flex items-center justify-center p-8 bg-gradient-to-br from-pink-100 to-indigo-800">
          <div className="w-full max-w-md bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-8">
            <h2 className="text-3xl font-bold text-slate-800 text-center mb-8">
              Restablecer Contraseña
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-5">
              <Input
                label="Correo Electrónico"
                type="email"
                icon={Mail}
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                error={errors.email}    
              />
              
              <Input
                label="Nueva Contraseña"
                type="password" 
                icon={Lock}
                value={formData.newPassword}
                onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                error={errors.newPassword}    
              />  
              
              <Input
                label="Confirmar Nueva Contraseña"
                type="password" 
                icon={Lock}
                value={formData.confirmNewPassword}
                onChange={(e) => setFormData({ ...formData, confirmNewPassword: e.target.value })}
                error={errors.confirmNewPassword}
              />
              
              <button 
                type="submit" 
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed" 
                disabled={isLoading}
              >
                {isLoading ? "Restableciendo..." : "Restablecer Contraseña"} 
              </button>
              
              <p className="text-center text-slate-600 text-sm mt-6">
                ¿Recordaste tu contraseña?{" "}
                <button 
                  onClick={goToLogin} 
                  className="text-purple-600 hover:text-purple-700 font-medium bg-transparent border-none cursor-pointer" 
                  type="button"
                >
                  Inicia sesión aquí
                </button>
              </p>
            </form>
          </div>
        </div>
      </div>          
    )
}

export default ResetPasswordForm