"use client"
import { useState } from "react"
import { X, User, Mail, AlertCircle, UserPlus, CheckCircle } from "lucide-react"
import { apiService } from "@/services/api";
import { authService } from "@/services/auth.service";

// =============================================
// TIPOS
// =============================================
interface InviteUserModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}
interface FormData {
  nombreCompleto: string
  email: string
  rol: 'paciente' | 'cuidador'
}

// =============================================
// COMPONENTE PRINCIPAL
// =============================================
export default function InviteUserModal({ 
  isOpen, 
  onClose, 
  onSuccess 
}: InviteUserModalProps) {
  const [formData, setFormData] = useState<FormData>({
    nombreCompleto: "",
    email: "",
    rol: "paciente"
  })
  
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  
  // =============================================
  // HANDLERS
  // =============================================
  const handleClose = () => {
    if (!isSubmitting && !isSuccess) {
      setFormData({ nombreCompleto: "", email: "", rol: "paciente" })
      setError("")
      onClose()
    }
  }

  const resetAndClose = () => {
    setFormData({ nombreCompleto: "", email: "", rol: "paciente" })
    setError("")
    setIsSuccess(false)
    onClose()
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    
    // Validaciones
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
      console.log('📧 Enviando invitación...')
      
      // Obtener el ID del médico logueado
      const medicoId = await authService.getCurrentUserId();
      console.log('ID del médico que invita:', medicoId);

      // Payload con IdMedico si se invita a un paciente
      const invitacionData: any = {
        nombreCompleto: formData.nombreCompleto,
        email: formData.email,
        rol: formData.rol
      }
      
      // Solo incluir idMedico en caso de que sea paciente
      if (formData.rol === 'paciente' && medicoId) {
        invitacionData.idMedico = medicoId
        console.log("Incluyendo idMedico en la invitación:", medicoId);
      }
      console.log('Datos de invitación:', invitacionData);

      await apiService.invitarUsuario(invitacionData);
      console.log('✅ Invitación enviada exitosamente')
      
      // Mostrar mensaje de éxito
      setIsSuccess(true)
      
      // Esperar 2 segundos antes de cerrar
      setTimeout(() => {
        onSuccess()
        resetAndClose()
      }, 2000)
      
    } catch (error: any) {
      console.error('❌ Error al enviar invitación:', error)
      setError(error.message || "Error al enviar la invitación")
    } finally {
      setIsSubmitting(false)
    }
  }
  
  // =============================================
  // NO RENDERIZAR SI NO ESTÁ ABIERTO
  // =============================================
  if (!isOpen) return null
  
  // =============================================
  // VISTA DE ÉXITO
  // =============================================
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
                  animation: 'progress 2s ease-in-out forwards',
                  width: '0%'
                }}
              ></div>
            </div>
          </div>
        </div>
        <style jsx>{`
          @keyframes progress {
            from { width: 0%; }
            to { width: 100%; }
          }
        `}</style>
      </div>
    )
  }
  
  // =============================================
  // RENDERIZADO PRINCIPAL
  // =============================================
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
              <h2 className="text-xl font-bold text-white">
                Invitar Usuario
              </h2>
              <p className="text-white/90 text-sm">
                Enviar invitación al equipo
              </p>
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
          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          {/* Nombre Completo */}
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-2">
              <User className="w-4 h-4 inline mr-1" />
              Nombre Completo <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.nombreCompleto}
              onChange={(e) => setFormData({ ...formData, nombreCompleto: e.target.value })}
              placeholder="Juan Pérez García"
              className="w-full px-4 py-2.5 border-2 border-slate-200 rounded-lg focus:border-purple-500 focus:ring-4 focus:ring-purple-100 outline-none transition-all text-slate-800"
              disabled={isSubmitting}
            />
          </div>

          {/* Correo Electrónico */}
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

          {/* Selección de Rol */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Tipo de Usuario <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, rol: 'paciente' })}
                disabled={isSubmitting}
                className={`p-4 border-2 rounded-lg transition-all disabled:opacity-50 ${
                  formData.rol === 'paciente'
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-slate-200 hover:border-purple-300'
                }`}
              >
                <div className="text-center">
                  <div className={`w-10 h-10 mx-auto mb-2 rounded-full flex items-center justify-center ${
                    formData.rol === 'paciente' ? 'bg-gradient-to-br from-purple-500 to-violet-500' : 'bg-slate-200'
                  }`}>
                    <User className={`w-5 h-5 ${
                      formData.rol === 'paciente' ? 'text-white' : 'text-slate-600'
                    }`} />
                  </div>
                  <div className={`font-semibold ${
                    formData.rol === 'paciente' ? 'text-purple-700' : 'text-slate-700'
                  }`}>
                    Paciente
                  </div>
                  <div className="text-xs text-slate-600 mt-1">
                    Recibe atención
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setFormData({ ...formData, rol: 'cuidador' })}
                disabled={isSubmitting}
                className={`p-4 border-2 rounded-lg transition-all disabled:opacity-50 ${
                  formData.rol === 'cuidador'
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-slate-200 hover:border-purple-300'
                }`}
              >
                <div className="text-center">
                  <div className={`w-10 h-10 mx-auto mb-2 rounded-full flex items-center justify-center ${
                    formData.rol === 'cuidador' ? 'bg-gradient-to-br from-purple-500 to-violet-500' : 'bg-slate-200'
                  }`}>
                    <User className={`w-5 h-5 ${
                      formData.rol === 'cuidador' ? 'text-white' : 'text-slate-600'
                    }`} />
                  </div>
                  <div className={`font-semibold ${
                    formData.rol === 'cuidador' ? 'text-purple-700' : 'text-slate-700'
                  }`}>
                    Cuidador
                  </div>
                  <div className="text-xs text-slate-600 mt-1">
                    Cuida pacientes
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Mensaje Informativo */}
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 flex items-start gap-2">
            <UserPlus className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
            <p className="text-purple-800 text-sm">
              Se enviará un correo de invitación al{' '}
              <strong>{formData.rol === 'paciente' ? 'paciente' : 'cuidador'}</strong>
              {' '}con instrucciones para unirse al equipo.
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2.5 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors font-medium disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2.5 bg-gradient-to-r from-purple-500 to-violet-500 text-white rounded-lg hover:from-purple-600 hover:to-violet-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md"
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