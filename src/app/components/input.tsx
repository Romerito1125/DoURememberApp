"use client"

import { useState } from "react"
import { Eye, EyeOff, AlertCircle } from "lucide-react"

// ============================================
// TIPOS DE PROPS
// ============================================
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
  type?: string
  icon?: React.ElementType
  error?: string
}

// ============================================
// COMPONENTE: Input Reutilizable
// ============================================
function Input({ label, type = "text", icon: Icon, error, ...props }: InputProps) {
  const [showPassword, setShowPassword] = useState(false)
  const inputType = type === "password" && showPassword ? "text" : type

  return (
    <div className="space-y-2">
      {/* Label */}
      <label className="block text-sm font-semibold text-gray-800">
        {label}
      </label>

      {/* Input Wrapper */}
      <div className="relative">
        {/* Icono */}
        {Icon && (
          <Icon className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${error ? 'text-red-500' : 'text-purple-600'}`} />
        )}

        {/* Input */}
        <input
          type={inputType}
          className={`
            w-full pr-12 py-3.5 
            ${Icon ? 'pl-12' : 'pl-4'}
            text-base font-medium text-gray-900
            placeholder:text-gray-400 placeholder:font-normal
            bg-white
            border-2 rounded-xl
            outline-none
            transition-all duration-200
            shadow-sm
            ${error 
              ? 'border-red-400 focus:border-red-500 focus:ring-4 focus:ring-red-100' 
              : 'border-gray-300 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 hover:border-purple-400'
            }
          `}
          {...props}
        />

        {/* Toggle de contraseña */}
        {type === "password" && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors focus:outline-none focus:text-purple-600"
          >
            {showPassword ? (
              <EyeOff className="w-5 h-5" />
            ) : (
              <Eye className="w-5 h-5" />
            )}
          </button>
        )}
      </div>

      {/* Mensaje de error */}
      {error && (
        <p className="text-sm font-medium text-red-600 flex items-center gap-1.5 mt-1.5">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </p>
      )}
    </div>
  )
}

export default Input