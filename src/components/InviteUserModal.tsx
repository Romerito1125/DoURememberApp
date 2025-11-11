"use client"

import { useState } from "react"
import { X, UserPlus, Mail, User, AlertCircle, CheckCircle, Loader2 } from "lucide-react"
import { authService } from "@/services/auth.service"

interface InviteUserModalProps {
  open: boolean
  onClose: () => void
  onSuccess?: () => void
}

export function InviteUserModal({ open, onClose, onSuccess }: InviteUserModalProps) {
  const [formData, setFormData] = useState({
    nombre: "",
    correo: "",
    rol: "paciente" as "paciente" | "cuidador",
    edad: "",
  })
  
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  const [temporaryPassword, setTemporaryPassword] = useState<string | null>(null)

  if (!open) return null

  const validate = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.nombre.trim()) {
      newErrors.nombre = "El nombre es requerido"
    }

    if (!formData.correo.trim()) {
      newErrors.correo = "El correo es requerido"
    } else if (!/\S+@\S+\.\S+/.test(formData.correo)) {
      newErrors.correo = "Correo inválido"
    }

    if (formData.edad && (parseInt(formData.edad) < 0 || parseInt(formData.edad) > 120)) {
      newErrors.edad = "Edad inválida"
    }

    return newErrors
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    setErrors({})
    setSuccess(null)
    setTemporaryPassword(null)

    const newErrors = validate()
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setIsLoading(true)

    try {
      console.log("📧 Invitando usuario...")

      const result = await authService.inviteUser({
        nombre: formData.nombre,
        correo: formData.correo,
        rol: formData.rol,
        edad: formData.edad ? parseInt(formData.edad) : undefined,
      })

      console.log("✅ Usuario invitado:", result)

      setSuccess(`Usuario ${formData.nombre} invitado exitosamente`)
      setTemporaryPassword(result.temporaryPassword)

      // Limpiar formulario
      setFormData({
        nombre: "",
        correo: "",
        rol: "paciente",
        edad: "",
      })

      // Llamar callback de éxito
      if (onSuccess) {
        onSuccess()
      }

      // Cerrar modal después de 5 segundos
      setTimeout(() => {
        handleClose()
      }, 5000)

    } catch (error: any) {
      console.error("❌ Error al invitar usuario:", error)
      setErrors({ general: error.message || "Error al invitar usuario" })
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    if (!isLoading) {
      setFormData({
        nombre: "",
        correo: "",
        rol: "paciente",
        edad: "",
      })
      setErrors({})
      setSuccess(null)
      setTemporaryPassword(null)
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <UserPlus className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Invitar Usuario</h2>
              <p className="text-purple-100 text-sm">Paciente o Cuidador</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Contenido */}
        <div className="p-6">
          {/* Mensaje de éxito */}
          {success && (
            <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start gap-3 mb-3">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-green-800 font-medium">{success}</p>
                  {temporaryPassword && (
                    <div className="mt-3 bg-white rounded-lg p-3 border border-green-200">
                      <p className="text-sm text-slate-700 mb-2">
                        <strong>Contraseña temporal:</strong>
                      </p>
                      <div className="flex items-center gap-2">
                        <code className="bg-slate-100 px-3 py-2 rounded text-sm font-mono text-slate-800 flex-1">
                          {temporaryPassword}
                        </code>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(temporaryPassword)
                            alert("Contraseña copiada al portapapeles")
                          }}
                          className="px-3 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 text-sm"
                        >
                          Copiar
                        </button>
                      </div>
                      <p className="text-xs text-amber-700 mt-2">
                        ⚠️ Comparte esta contraseña de forma segura con el usuario. 
                        En producción, esto se enviará por correo automáticamente.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Error general */}
          {errors.general && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-red-800 text-sm">{errors.general}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Nombre */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Nombre completo <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => {
                    setFormData({ ...formData, nombre: e.target.value })
                    if (errors.nombre) setErrors({ ...errors, nombre: "" })
                  }}
                  placeholder="Juan Pérez"
                  className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none ${
                    errors.nombre ? "border-red-400" : "border-slate-300"
                  }`}
                  disabled={isLoading}
                />
              </div>
              {errors.nombre && (
                <p className="text-red-600 text-sm mt-1">{errors.nombre}</p>
              )}
            </div>

            {/* Correo */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Correo electrónico <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="email"
                  value={formData.correo}
                  onChange={(e) => {
                    setFormData({ ...formData, correo: e.target.value })
                    if (errors.correo) setErrors({ ...errors, correo: "" })
                  }}
                  placeholder="usuario@correo.com"
                  className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none ${
                    errors.correo ? "border-red-400" : "border-slate-300"
                  }`}
                  disabled={isLoading}
                />
              </div>
              {errors.correo && (
                <p className="text-red-600 text-sm mt-1">{errors.correo}</p>
              )}
            </div>

            {/* Rol */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Rol <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.rol}
                onChange={(e) => setFormData({ ...formData, rol: e.target.value as any })}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                disabled={isLoading}
              >
                <option value="paciente">Paciente</option>
                <option value="cuidador">Cuidador</option>
              </select>
            </div>

            {/* Edad (opcional) */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Edad (opcional)
              </label>
              <input
                type="number"
                value={formData.edad}
                onChange={(e) => {
                  setFormData({ ...formData, edad: e.target.value })
                  if (errors.edad) setErrors({ ...errors, edad: "" })
                }}
                placeholder="65"
                min="0"
                max="120"
                className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none ${
                  errors.edad ? "border-red-400" : "border-slate-300"
                }`}
                disabled={isLoading}
              />
              {errors.edad && (
                <p className="text-red-600 text-sm mt-1">{errors.edad}</p>
              )}
            </div>

            {/* Información adicional */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>Nota:</strong> Se generará una contraseña temporal que deberás 
                compartir con el usuario invitado. Ellos podrán cambiarla después del primer login.
              </p>
            </div>

            {/* Botones */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={handleClose}
                disabled={isLoading}
                className="flex-1 px-4 py-2.5 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 px-4 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Invitando...
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    Enviar invitación
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}