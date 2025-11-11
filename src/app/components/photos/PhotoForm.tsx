"use client"

import { useState } from "react"
import { Upload, X } from "lucide-react"

interface PhotoFormProps {
  onSubmit: (data: any) => void
  onCancel: () => void
  isUploading: boolean
  preguntasGuia?: string[]
}

export default function PhotoForm({ onSubmit, onCancel, isUploading }: PhotoFormProps) {
  const [imageData, setImageData] = useState("")
  const [fileName, setFileName] = useState("")
  const [people, setPeople] = useState("")
  const [location, setLocation] = useState("")
  const [context, setContext] = useState("")
  const [keywords, setKeywords] = useState("")

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setFileName(file.name)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImageData(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!imageData || !people || !location || !context) {
      alert("Por favor completa todos los campos obligatorios")
      return
    }

    onSubmit({
      imageData,
      fileName,
      people,
      location,
      context,
      keywords
    })

    setImageData("")
    setFileName("")
    setPeople("")
    setLocation("")
    setContext("")
    setKeywords("")
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Seleccionar Imagen *
        </label>
        <input
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          disabled={isUploading}
          className="block w-full text-sm text-slate-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-lg file:border-0
            file:text-sm file:font-semibold
            file:bg-purple-50 file:text-purple-700
            hover:file:bg-purple-100
            disabled:opacity-50 disabled:cursor-not-allowed"
        />
        {imageData && (
          <div className="mt-3 relative">
            <img src={imageData} alt="Preview" className="w-full h-48 object-cover rounded-lg" />
            <button
              type="button"
              onClick={() => { setImageData(""); setFileName("") }}
              className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-800 mb-2">
          Personas en la foto *
        </label>
        <input
          type="text"
          value={people}
          onChange={(e) => setPeople(e.target.value)}
          disabled={isUploading}
          placeholder="Ej: María, Juan, los nietos"
          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none disabled:opacity-50 text-slate-900"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Lugar *
        </label>
        <input
          type="text"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          disabled={isUploading}
          placeholder="Ej: Casa de la abuela, Parque Central"
          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none disabled:opacity-50 text-slate-900"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Contexto / Evento *
        </label>
        <textarea
          value={context}
          onChange={(e) => setContext(e.target.value)}
          disabled={isUploading}
          placeholder="Ej: Cumpleaños número 80, Navidad 2023"
          rows={3}
          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none disabled:opacity-50 text-slate-900"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Palabras Clave (separadas por comas)
        </label>
        <input
          type="text"
          value={keywords}
          onChange={(e) => setKeywords(e.target.value)}
          disabled={isUploading}
          placeholder="Ej: cumpleaños, torta, familia, jardín"
          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none disabled:opacity-50 text-slate-900"
        />
        <p className="text-xs text-slate-500 mt-1">
          Opcional: Estas palabras ayudarán a la IA a evaluar mejor las respuestas del paciente
        </p>
      </div>

      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          disabled={isUploading || !imageData}
          className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <Upload className="w-5 h-5" />
          {isUploading ? "Subiendo..." : "Subir Foto"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={isUploading}
          className="px-6 py-3 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors disabled:opacity-50"
        >
          Cancelar
        </button>
      </div>
    </form>
  )
}