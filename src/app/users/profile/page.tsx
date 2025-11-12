"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, User, Mail, Calendar, Shield, Camera, Eye, EyeOff, Lock, Save, Loader2, CheckCircle, AlertCircle, Edit2, X, Trash2, Upload, Check } from "lucide-react"
import Header from "@/app/components/header"
import { DashboardHeader } from "@/components/dashboard-header"
import Footer from "@/app/components/footer"
import { createClient } from "@/utils/supabase/client"

const API_URL = 'https://api.devcorebits.com/api'

interface UserProfile {
  idUsuario: string
  nombre: string
  correo: string
  fechaNacimiento: string | null
  rol: string
  fotoPerfil: string | null
}

export default function ProfilePage() {
  const router = useRouter()
  const supabase = createClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false)
  const [isDeletingPhoto, setIsDeletingPhoto] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  
  const [isEditingEmail, setIsEditingEmail] = useState(false)
  const [isSavingEmail, setIsSavingEmail] = useState(false)
  const [editedEmail, setEditedEmail] = useState("")
  
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [passwordError, setPasswordError] = useState("")

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const { data: { session } } = await supabase.auth.getSession()

      if (!user || !session?.access_token) {
        router.push('/authentication/login')
        return
      }

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
        if (usuario) {
          setProfile(usuario)
          setEditedEmail(usuario.correo)
        }
      }
    } catch (error) {
      console.error('Error al cargar perfil:', error)
      setError('Error al cargar los datos del perfil')
    } finally {
      setIsLoading(false)
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      setError('La imagen no debe superar los 5MB')
      return
    }

    if (!['image/jpeg', 'image/jpg', 'image/png'].includes(file.type)) {
      setError('Solo se permiten imágenes JPG, JPEG o PNG')
      return
    }

    setSelectedFile(file)
    
    const reader = new FileReader()
    reader.onloadend = () => {
      setImagePreview(reader.result as string)
    }
    reader.readAsDataURL(file)
    
    setError("")
  }

  const handleUploadPhoto = async () => {
    if (!selectedFile || !profile) return

    setIsUploadingPhoto(true)
    setError("")
    setSuccess("")

    try {
      const { data: { user } } = await supabase.auth.getUser()
      const { data: { session } } = await supabase.auth.getSession()

      if (!user || !session?.access_token) {
        throw new Error('Sesión no válida')
      }

      const formData = new FormData()
      formData.append('file', selectedFile)

      const response = await fetch(
        `${API_URL}/descripciones-imagenes/uploadFotoPerfil/${user.id}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          },
          body: formData
        }
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Error al subir foto')
      }

      const data = await response.json()
      
      setProfile({ ...profile, fotoPerfil: data.urlImagen })
      setSuccess('Foto de perfil actualizada exitosamente')
      
      setImagePreview(null)
      setSelectedFile(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }

      setTimeout(() => {
        window.location.reload()
      }, 1000)

    } catch (error: any) {
      console.error('Error al subir foto:', error)
      setError(error.message || 'Error al subir la foto de perfil')
    } finally {
      setIsUploadingPhoto(false)
    }
  }

  const handleCancelUpload = () => {
    setSelectedFile(null)
    setImagePreview(null)
    setError("")
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleDeletePhoto = async () => {
    if (!profile?.fotoPerfil) return

    const confirmed = window.confirm('¿Estás seguro de que quieres eliminar tu foto de perfil?')
    if (!confirmed) return

    setIsDeletingPhoto(true)
    setError("")
    setSuccess("")

    try {
      const { data: { user } } = await supabase.auth.getUser()
      const { data: { session } } = await supabase.auth.getSession()

      if (!user || !session?.access_token) {
        throw new Error('Sesión no válida')
      }

      setProfile({ ...profile, fotoPerfil: null })
      setSuccess('Foto de perfil eliminada exitosamente')

      setTimeout(() => {
        window.location.reload()
      }, 1000)

    } catch (error: any) {
      console.error('Error al eliminar foto:', error)
      setError(error.message || 'Error al eliminar la foto de perfil')
    } finally {
      setIsDeletingPhoto(false)
    }
  }

  const handleSaveEmail = async () => {
    if (!editedEmail.trim()) {
      setError('El correo no puede estar vacío')
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(editedEmail)) {
      setError('El correo electrónico no es válido')
      return
    }

    if (editedEmail === profile?.correo) {
      setIsEditingEmail(false)
      return
    }

    setIsSavingEmail(true)
    setError("")
    setSuccess("")

    try {
      const { data: { session } } = await supabase.auth.getSession()

      if (!session?.access_token) {
        throw new Error('Sesión no válida')
      }

      const response = await fetch(
        `${API_URL}/usuarios-autenticacion/actualizarCorreo`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email: editedEmail })
        }
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Error al actualizar correo')
      }

      setProfile(prev => prev ? { ...prev, correo: editedEmail } : null)
      setSuccess('Correo actualizado exitosamente. Por favor verifica tu bandeja de entrada si tienes verificación activada.')
      setIsEditingEmail(false)

    } catch (error: any) {
      console.error('Error al actualizar correo:', error)
      setError(error.message || 'Error al actualizar el correo')
      setEditedEmail(profile?.correo || '')
    } finally {
      setIsSavingEmail(false)
    }
  }

  const handleCancelEmailEdit = () => {
    setEditedEmail(profile?.correo || '')
    setIsEditingEmail(false)
    setError("")
  }

  const handleChangePassword = async () => {
    setPasswordError("")
    setSuccess("")

    if (!newPassword || !confirmPassword) {
      setPasswordError('Todos los campos de contraseña son obligatorios')
      return
    }

    if (newPassword.length < 10) {
      setPasswordError('La nueva contraseña debe tener al menos 10 caracteres')
      return
    }

    if (!/[A-Z]/.test(newPassword)) {
      setPasswordError('La contraseña debe contener al menos una letra mayúscula')
      return
    }

    if (!/[a-z]/.test(newPassword)) {
      setPasswordError('La contraseña debe contener al menos una letra minúscula')
      return
    }

    if (!/[0-9]/.test(newPassword)) {
      setPasswordError('La contraseña debe contener al menos un número')
      return
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(newPassword)) {
      setPasswordError('La contraseña debe contener al menos un carácter especial')
      return
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Las contraseñas no coinciden')
      return
    }

    setIsChangingPassword(true)

    try {
      const { data: { session } } = await supabase.auth.getSession()

      if (!session?.access_token) {
        throw new Error('Sesión no válida')
      }

      const response = await fetch(
        `${API_URL}/usuarios-autenticacion/actualizarContrasena`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ password: newPassword })
        }
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Error al cambiar la contraseña')
      }

      setSuccess('Contraseña cambiada exitosamente')
      setNewPassword("")
      setConfirmPassword("")

    } catch (error: any) {
      console.error('Error al cambiar contraseña:', error)
      setPasswordError(error.message || 'Error al cambiar la contraseña')
    } finally {
      setIsChangingPassword(false)
    }
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

  const passwordValidations = {
    length: newPassword.length >= 10,
    hasUpperCase: /[A-Z]/.test(newPassword),
    hasLowerCase: /[a-z]/.test(newPassword),
    hasNumber: /[0-9]/.test(newPassword),
    hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(newPassword),
    match: newPassword === confirmPassword && confirmPassword.length > 0
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-purple-50 flex flex-col">
        <DashboardHeader />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-purple-600 animate-spin mx-auto mb-4" />
            <p className="text-slate-600">Cargando perfil...</p>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 flex flex-col">
        {/* Header */}
        <div className="sticky top-0 z-50 backdrop-blur-xl bg-white/80 border-b border-purple-100 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <DashboardHeader />
          </div>
        </div>
        
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-red-100 to-red-200 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg">
              <AlertCircle className="w-10 h-10 text-red-600" />
            </div>
            <p className="text-slate-900 font-bold text-xl mb-2">No se pudo cargar el perfil</p>
            <p className="text-slate-600 mb-6">Por favor, intenta nuevamente</p>
            <button
              onClick={() => router.back()}
              className="px-4 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:from-purple-700 hover:to-indigo-700 transition-all flex items-center gap-2 shadow-lg hover:shadow-xl font-medium"
            >
              Volver
            </button>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="bg-gradient-to-br from-pink-100 to-indigo-800">
      {/* Header */}
      <div className="sticky top-0 z-50 backdrop-blur-xl bg-white/80 border-b border-purple-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <DashboardHeader />
        </div>
      </div>
      
      <main className="flex-1 container mx-auto px-4 sm:px-6 py-6">
        <div className="max-w-6xl mx-auto">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-purple-600 hover:text-purple-700 mb-6 transition-colors font-medium"
          >
            <ArrowLeft className="w-5 h-5" />
            Volver
          </button>

          <div className="bg-white rounded-2xl shadow-lg border border-purple-100 p-6 sm:p-8 mb-6">
            <h1 className="text-3xl sm:text-4xl font-bold text-slate-800 mb-2">Mi Perfil</h1>
            <p className="text-slate-600 text-sm sm:text-base">Gestiona tu información personal y configuración</p>
          </div>

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 flex items-start shadow-sm">
              <AlertCircle className="w-5 h-5 text-red-600 mr-3 flex-shrink-0 mt-0.5" />
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-6 bg-green-50 border border-green-200 rounded-xl p-4 flex items-start shadow-sm">
              <CheckCircle className="w-5 h-5 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
              <p className="text-green-800 text-sm">{success}</p>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl shadow-lg border border-purple-100 p-6 sticky top-6">
                <div className="flex flex-col items-center">
                  <div className="relative mb-6">
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-400 via-purple-500 to-indigo-600 rounded-full blur-xl opacity-40 animate-pulse"></div>
                    <div className="relative">
                      {imagePreview ? (
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="w-40 h-40 rounded-full object-cover border-4 border-white shadow-xl"
                        />
                      ) : profile.fotoPerfil ? (
                        <img
                          src={profile.fotoPerfil}
                          alt={profile.nombre}
                          className="w-40 h-40 rounded-full object-cover border-4 border-white shadow-xl"
                        />
                      ) : (
                        <div className="w-40 h-40 rounded-full bg-gradient-to-br from-purple-400 to-indigo-500 flex items-center justify-center text-white text-5xl font-bold shadow-xl border-4 border-white">
                          {getInitials(profile.nombre)}
                        </div>
                      )}
                      
                      {(isUploadingPhoto || isDeletingPhoto) && (
                        <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                          <Loader2 className="w-10 h-10 text-white animate-spin" />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="w-full space-y-3">
                    {!selectedFile ? (
                      <>
                        <label className="block">
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/jpeg,image/jpg,image/png"
                            onChange={handleFileSelect}
                            disabled={isUploadingPhoto || isDeletingPhoto}
                            className="hidden"
                            id="photo-upload"
                          />
                          <label
                            htmlFor="photo-upload"
                            className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium cursor-pointer transition-all ${
                              isUploadingPhoto || isDeletingPhoto
                                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                : 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700 shadow-lg hover:shadow-xl'
                            }`}
                          >
                            <Camera className="w-5 h-5" />
                            {profile.fotoPerfil ? 'Cambiar Foto' : 'Subir Foto'}
                          </label>
                        </label>
                        
                        {profile.fotoPerfil && (
                          <button
                            onClick={handleDeletePhoto}
                            disabled={isUploadingPhoto || isDeletingPhoto}
                            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium transition-all bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Trash2 className="w-5 h-5" />
                            {isDeletingPhoto ? 'Eliminando...' : 'Eliminar Foto'}
                          </button>
                        )}
                        
                        <p className="text-xs text-center text-slate-500">
                          JPG, JPEG o PNG. Máx 5MB
                        </p>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={handleUploadPhoto}
                          disabled={isUploadingPhoto}
                          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium transition-all bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isUploadingPhoto ? (
                            <>
                              <Loader2 className="w-5 h-5 animate-spin" />
                              Subiendo...
                            </>
                          ) : (
                            <>
                              <Upload className="w-5 h-5" />
                              Subir Foto
                            </>
                          )}
                        </button>
                        
                        <button
                          onClick={handleCancelUpload}
                          disabled={isUploadingPhoto}
                          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium transition-all bg-slate-100 text-slate-700 hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <X className="w-5 h-5" />
                          Cancelar
                        </button>
                        
                        <p className="text-xs text-center text-slate-600 break-all">
                          {selectedFile.name} <br/>
                          <span className="text-slate-500">({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)</span>
                        </p>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-2 space-y-6">
              
              <div className="bg-white rounded-2xl shadow-lg border border-purple-100 p-6 sm:p-8">
                <h2 className="text-2xl font-bold text-slate-800 mb-6">Información Personal</h2>
                
                <div className="space-y-5">
                  <div>
                    <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                      <User className="w-4 h-4 text-purple-600" />
                      Nombre Completo
                    </label>
                    <input
                      type="text"
                      value={profile.nombre}
                      disabled
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50 text-slate-800 cursor-not-allowed font-medium"
                    />
                  </div>

                  <div>
                    <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                      <Mail className="w-4 h-4 text-purple-600" />
                      Correo Electrónico
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="email"
                        value={editedEmail}
                        onChange={(e) => setEditedEmail(e.target.value)}
                        disabled={!isEditingEmail || isSavingEmail}
                        className={`flex-1 px-4 py-3 border rounded-xl font-medium transition-all ${
                          isEditingEmail
                            ? 'border-purple-300 bg-white focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none shadow-sm'
                            : 'border-slate-200 bg-slate-50 cursor-not-allowed'
                        } text-slate-800`}
                      />
                      {!isEditingEmail ? (
                        <button
                          onClick={() => setIsEditingEmail(true)}
                          className="px-4 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:from-purple-700 hover:to-indigo-700 transition-all flex items-center gap-2 shadow-lg hover:shadow-xl font-medium"
                        >
                          <Edit2 className="w-4 h-4" />
                          Editar
                        </button>
                      ) : (
                        <>
                          <button
                            onClick={handleSaveEmail}
                            disabled={isSavingEmail}
                            className="px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all flex items-center gap-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                          >
                            {isSavingEmail ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Save className="w-4 h-4" />
                            )}
                          </button>
                          <button
                            onClick={handleCancelEmailEdit}
                            disabled={isSavingEmail}
                            className="px-4 py-3 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {profile.fechaNacimiento && (
                    <div>
                      <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                        <Calendar className="w-4 h-4 text-purple-600" />
                        Fecha de Nacimiento
                      </label>
                      <input
                        type="text"
                        value={new Date(profile.fechaNacimiento).toLocaleDateString('es-ES', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                        disabled
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50 text-slate-800 cursor-not-allowed font-medium"
                      />
                    </div>
                  )}

                  <div>
                    <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                      <Shield className="w-4 h-4 text-purple-600" />
                      Rol
                    </label>
                    <input
                      type="text"
                      value={getRoleLabel(profile.rol)}
                      disabled
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50 text-slate-800 cursor-not-allowed font-medium"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-lg border border-purple-100 p-6 sm:p-8">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Lock className="w-6 h-6 text-purple-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-800">Cambiar Contraseña</h2>
                </div>
                <p className="text-slate-600 text-sm mb-6">Actualiza tu contraseña para mantener tu cuenta segura</p>
                
                {passwordError && (
                  <div className="mb-4 bg-red-50 border border-red-200 rounded-xl p-4 flex items-start shadow-sm">
                    <AlertCircle className="w-5 h-5 text-red-600 mr-3 flex-shrink-0 mt-0.5" />
                    <p className="text-red-800 text-sm">{passwordError}</p>
                  </div>
                )}
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Nueva Contraseña
                    </label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none shadow-sm font-medium text-slate-800"
                        placeholder="Mínimo 10 caracteres"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                      >
                        {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Confirmar Nueva Contraseña
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none shadow-sm font-medium text-slate-800"
                        placeholder="Confirma tu nueva contraseña"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                      >
                        {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  {(newPassword || confirmPassword) && (
                    <div className="bg-slate-50 rounded-xl p-4 space-y-2 border border-slate-200">
                      <p className="text-xs font-semibold text-slate-600 mb-3">Requisitos de la contraseña:</p>
                      
                      <div className={`flex items-center gap-2 text-sm ${passwordValidations.length ? 'text-green-600' : 'text-slate-500'}`}>
                        {passwordValidations.length ? (
                          <Check className="w-4 h-4" />
                        ) : (
                          <div className="w-4 h-4 rounded-full border-2 border-slate-300"></div>
                        )}
                        <span className="font-medium">Mínimo 10 caracteres</span>
                      </div>
                      
                      <div className={`flex items-center gap-2 text-sm ${passwordValidations.hasUpperCase ? 'text-green-600' : 'text-slate-500'}`}>
                        {passwordValidations.hasUpperCase ? (
                          <Check className="w-4 h-4" />
                        ) : (
                          <div className="w-4 h-4 rounded-full border-2 border-slate-300"></div>
                        )}
                        <span className="font-medium">Al menos una mayúscula (A-Z)</span>
                      </div>
                      
                      <div className={`flex items-center gap-2 text-sm ${passwordValidations.hasLowerCase ? 'text-green-600' : 'text-slate-500'}`}>
                        {passwordValidations.hasLowerCase ? (
                          <Check className="w-4 h-4" />
                        ) : (
                          <div className="w-4 h-4 rounded-full border-2 border-slate-300"></div>
                        )}
                        <span className="font-medium">Al menos una minúscula (a-z)</span>
                      </div>
                      
                      <div className={`flex items-center gap-2 text-sm ${passwordValidations.hasNumber ? 'text-green-600' : 'text-slate-500'}`}>
                        {passwordValidations.hasNumber ? (
                          <Check className="w-4 h-4" />
                        ) : (
                          <div className="w-4 h-4 rounded-full border-2 border-slate-300"></div>
                        )}
                        <span className="font-medium">Al menos un número (0-9)</span>
                      </div>
                      
                      <div className={`flex items-center gap-2 text-sm ${passwordValidations.hasSpecialChar ? 'text-green-600' : 'text-slate-500'}`}>
                        {passwordValidations.hasSpecialChar ? (
                          <Check className="w-4 h-4" />
                        ) : (
                          <div className="w-4 h-4 rounded-full border-2 border-slate-300"></div>
                        )}
                        <span className="font-medium">Al menos un carácter especial (!@#$%...)</span>
                      </div>
                      
                      <div className={`flex items-center gap-2 text-sm ${passwordValidations.match ? 'text-green-600' : 'text-slate-500'}`}>
                        {passwordValidations.match ? (
                          <Check className="w-4 h-4" />
                        ) : (
                          <div className="w-4 h-4 rounded-full border-2 border-slate-300"></div>
                        )}
                        <span className="font-medium">Las contraseñas coinciden</span>
                      </div>
                    </div>
                  )}

                  <button
                    onClick={handleChangePassword}
                    disabled={isChangingPassword}
                    className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:from-purple-700 hover:to-indigo-700 transition-all font-medium flex items-center justify-center gap-2 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isChangingPassword ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Cambiando contraseña...
                      </>
                    ) : (
                      <>
                        <Save className="w-5 h-5" />
                        Cambiar Contraseña
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}