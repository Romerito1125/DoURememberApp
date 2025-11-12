"use client"
import { useState } from "react"
import { X, User, Mail, AlertCircle, UserPlus, CheckCircle } from "lucide-react"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.devcorebits.com"

interface InviteUserModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}
interface FormData {
  nombreCompleto: string
  email: string
  rol: "paciente" | "cuidador"
}

export default function InviteUserModal({
  isOpen,
  onClose,
  onSuccess,
}: InviteUserModalProps) {
  const [formData, setFormData] = useState<FormData>({
    nombreCompleto: "",
    email: "",
    rol: "paciente",
  })
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  // =============================
  // Obtener token y userId local
  // =============================
  const getAccessToken = () => {
    if (typeof window === "undefined") return null
    return localStorage.getItem("access_token") || sessionStorage.getItem("access_token")
  }

  const getCurrentUserId = () => {
    if (typeof window === "undefined") return null
    return localStorage.getItem("user_id") || sessionStorage.getItem("user_id")
  }

  // =============================
  // Enviar invitación
  // =============================
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!formData.nombreCompleto.trim()) {
      setError("El nombre completo es requerido")
      return
    }
    if (!formData.email.trim()) {
      setError("El correo electrónico es requerido")
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError("Correo electrónico inválido")
      return
    }

    setIsSubmitting(true)

    try {
      const token = getAccessToken()
      const medicoId = getCurrentUserId()

      const payload: any = {
        nombreCompleto: formData.nombreCompleto,
        email: formData.email,
        rol: formData.rol,
      }

      if (formData.rol === "paciente" && medicoId) {
        payload.idMedico = medicoId
      }

      console.log("📤 Enviando invitación con payload:", payload)

      const response = await fetch(`${API_URL}/api/usuarios-autenticacion/crearInvitacion`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}))
        throw new Error(errData.message || "Error al enviar invitación")
      }

      console.log("✅ Invitación enviada correctamente")
      setIsSuccess(true)
      setTimeout(() => {
        onSuccess()
        resetAndClose()
      }, 2000)
    } catch (err: any) {
      console.error("❌ Error al enviar invitación:", err)
      setError(err.message || "Error al enviar invitación")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    if (!isSubmitting && !isSuccess) {
      resetAndClose()
    }
  }

  const resetAndClose = () => {
    setFormData({ nombreCompleto: "", email: "", rol: "paciente" })
    setError("")
    setIsSuccess(false)
    onClose()
  }

  if (!isOpen) return null

  // =============================
  // Vista de éxito
  // =============================
  if (isSuccess) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h3 className="text-2xl font-bold text-slate-800 mb-2">
              ¡Invitación Enviada!
            </h3>
            <p className="text-slate-600">
              Se ha enviado la invitación a <strong>{formData.email}</strong> exitosamente.
            </p>
            <div className="mt-4 h-1 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-violet-500"
                style={{
                  animation: "progress 2s ease-in-out forwards",
                  width: "0%",
                }}
              ></div>
            </div>
          </div>
        </div>
        <style jsx>{`
          @keyframes progress {
            from {
              width: 0%;
            }
            to {
              width: 100%;
            }
          }
        `}</style>
      </div>
    )
  }

  // =============================
  // Formulario principal
  // =============================
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-700 via-purple-800 to-violet-900 px-6 py-5 rounded-t-2xl flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <UserPlus className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Invitar Usuario</h2>
              <p className="text-white/90 text-sm">Enviar invitación al equipo</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          {/* Nombre */}
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-2">
              <User className="w-4 h-4 inline mr-1" />
              Nombre Completo <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.nombreCompleto}
              onChange={(e) =>
                setFormData({ ...formData, nombreCompleto: e.target.value })
              }
              placeholder="Juan Pérez García"
              className="w-full px-4 py-2.5 border-2 border-slate-200 rounded-lg focus:border-purple-500 focus:ring-4 focus:ring-purple-100 outline-none transition-all text-slate-800"
              disabled={isSubmitting}
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              <Mail className="w-4 h-4 inline mr-1" />
              Correo Electrónico <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="usuario@ejemplo.com"
              className="w-full px-4 py-2.5 border-2 border-slate-200 rounded-lg focus:border-purple-500 focus:ring-4 focus:ring-purple-100 outline-none transition-all text-slate-800"
              disabled={isSubmitting}
            />
          </div>

          {/* Rol */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Tipo de Usuario <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              {["paciente", "cuidador"].map((rol) => (
                <button
                  key={rol}
                  type="button"
                  onClick={() => setFormData({ ...formData, rol: rol as "paciente" | "cuidador" })}
                  disabled={isSubmitting}
                  className={`p-4 border-2 rounded-lg transition-all ${
                    formData.rol === rol
                      ? "border-purple-500 bg-purple-50"
                      : "border-slate-200 hover:border-purple-300"
                  }`}
                >
                  <div className="text-center">
                    <div
                      className={`w-10 h-10 mx-auto mb-2 rounded-full flex items-center justify-center ${
                        formData.rol === rol
                          ? "bg-gradient-to-br from-purple-500 to-violet-500"
                          : "bg-slate-200"
                      }`}
                    >
                      <User
                        className={`w-5 h-5 ${
                          formData.rol === rol ? "text-white" : "text-slate-600"
                        }`}
                      />
                    </div>
                    <div
                      className={`font-semibold ${
                        formData.rol === rol ? "text-purple-700" : "text-slate-700"
                      }`}
                    >
                      {rol.charAt(0).toUpperCase() + rol.slice(1)}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Info */}
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 flex items-start gap-2">
            <UserPlus className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
            <p className="text-purple-800 text-sm">
              Se enviará un correo de invitación al{" "}
              <strong>{formData.rol}</strong> con instrucciones para unirse.
            </p>
          </div>

          {/* Botones */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={handleClose}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2.5 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors font-medium disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2.5 bg-gradient-to-r from-purple-500 to-violet-500 text-white rounded-lg hover:from-purple-600 hover:to-violet-600 transition-colors font-medium disabled:opacity-50 flex items-center justify-center gap-2 shadow-md"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Enviando...
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  Enviar Invitación
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
