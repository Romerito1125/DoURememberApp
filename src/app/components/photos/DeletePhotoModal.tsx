"use client"

import { useState } from "react"
import { X, AlertTriangle, Trash2 } from "lucide-react"

interface DeletePhotoModalProps {
  isOpen: boolean
  photoId: string
  photoName: string
  onConfirm: (photoId: string) => Promise<void>
  onCancel: () => void
}

export default function DeletePhotoModal({
  isOpen,
  photoId,
  photoName,
  onConfirm,
  onCancel,
}: DeletePhotoModalProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState("")

  if (!isOpen) return null

  const handleConfirm = async () => {
    setIsDeleting(true)
    setError("")

    try {
      await onConfirm(photoId)
    } catch (err) {
      setError(
        err instanceof Error 
          ? err.message 
          : "Error al eliminar la imagen. Por favor intenta nuevamente."
      )
      setIsDeleting(false)
    }
  }

  const handleCancel = () => {
    if (!isDeleting) {
      setError("")
      onCancel()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <h2 className="text-xl font-semibold text-slate-800">
              Confirmar Eliminación
            </h2>
          </div>
          <button
            onClick={handleCancel}
            disabled={isDeleting}
            className="text-slate-400 hover:text-slate-600 transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          <p className="text-slate-700 mb-4">
            ¿Estás seguro de que deseas eliminar la siguiente imagen?
          </p>
          
          <div className="bg-slate-50 rounded-lg p-4 mb-4">
            <p className="font-medium text-slate-800">{photoName}</p>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <p className="text-sm text-amber-800">
              <strong>Advertencia:</strong> Esta acción no se puede deshacer. La imagen y toda su 
              información asociada serán eliminadas permanentemente del sistema.
            </p>
          </div>
        </div>

        <div className="flex gap-3 p-6 bg-slate-50 border-t border-slate-200">
          <button
            onClick={handleCancel}
            disabled={isDeleting}
            className="flex-1 px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={isDeleting}
            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isDeleting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Eliminando...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                Eliminar
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}