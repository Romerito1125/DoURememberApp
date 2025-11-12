"use client"

import { X, Info, Users, MapPin, FileText, Sparkles, ChevronRight, Heart } from "lucide-react"

interface WelcomeModalProps {
  isOpen: boolean
  onClose: () => void
  onStart: () => void
}

export default function WelcomeModal({ isOpen, onClose, onStart }: WelcomeModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-5 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Heart className="w-8 h-8 text-white" />
            <h2 className="text-2xl font-bold text-white">
              ¡Bienvenido a tu sesión de recuerdos!
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="p-8">
          <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border-2 border-purple-200 rounded-xl p-5 mb-6">
            <div className="flex items-start gap-3">
              <Info className="w-6 h-6 text-purple-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-bold text-purple-900 mb-2 text-lg">
                  ¿Cómo funciona?
                </h3>
                <p className="text-purple-800 leading-relaxed">
                  Verás <strong>3 fotografías especiales</strong> de momentos importantes. 
                  Para cada una, te guiaremos con 4 preguntas sencillas. 
                  <strong className="block mt-2">¡Tómate todo el tiempo que necesites!</strong> 
                  No hay prisa ni respuestas incorrectas.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-4 mb-6">
            <p className="text-amber-900 font-medium text-center">
              💫 <strong>Recuerda:</strong> Cada recuerdo que compartes es valioso. Escribe con naturalidad, como si le contaras a un amigo cercano.
            </p>
          </div>

          <div className="space-y-4 mb-8">
            <h3 className="font-bold text-slate-800 text-xl mb-4 text-center">
              Los 4 pasos que seguiremos juntos:
            </h3>

            {/* Paso 1 */}
            <div className="flex items-start gap-4 p-5 bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl border-2 border-purple-200 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-purple-700 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-slate-800 mb-2 text-lg">
                  1. ¿Quiénes están en la foto?
                </h4>
                <p className="text-slate-700 mb-2 leading-relaxed">
                  Escribe de forma natural. Por ejemplo:
                </p>
                <p className="text-purple-700 italic bg-white/70 p-3 rounded-lg border border-purple-200">
                   Yo estaba con mi tío Carlos y mi prima Laura. Mi tío tenía como 50 años en esa época...
                </p>
                <p className="text-sm text-green-700 font-medium mt-3 flex items-center gap-2">
                  ✨ Consejo: Menciona nombres y cómo se relacionan contigo
                </p>
              </div>
            </div>

            {/* Paso 2 */}
            <div className="flex items-start gap-4 p-5 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl border-2 border-blue-200 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg">
                <MapPin className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-slate-800 mb-2 text-lg">
                  2. ¿Dónde fue tomada?
                </h4>
                <p className="text-slate-700 mb-2 leading-relaxed">
                  Describe el lugar lo más específico posible:
                </p>
                <p className="text-blue-700 italic bg-white/70 p-3 rounded-lg border border-blue-200">
                  Esto fue en la casa de mi abuela en el barrio Granada, Cali. En el patio donde siempre jugábamos...
                </p>
                <p className="text-sm text-green-700 font-medium mt-3 flex items-center gap-2">
                  ✨ Consejo: Mientras más detalles del lugar, ¡mejor!
                </p>
              </div>
            </div>

            {/* Paso 3 */}
            <div className="flex items-start gap-4 p-5 bg-gradient-to-r from-green-50 to-green-100 rounded-xl border-2 border-green-200 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-gradient-to-br from-green-600 to-green-700 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-slate-800 mb-2 text-lg">
                  3. ¿Qué estaba pasando?
                </h4>
                <p className="text-slate-700 mb-2 leading-relaxed">
                  Cuéntanos sobre el momento o evento:
                </p>
                <p className="text-green-700 italic bg-white/70 p-3 rounded-lg border border-green-200">
                  Era el cumpleaños número 70 de mi abuela. Celebramos con toda la familia, había música y bailamos mucho...
                </p>
                <p className="text-sm text-green-700 font-medium mt-3 flex items-center gap-2">
                  ✨ Consejo: ¿Qué se celebraba? ¿Cuándo fue aproximadamente?
                </p>
              </div>
            </div>

            {/* Paso 4 */}
            <div className="flex items-start gap-4 p-5 bg-gradient-to-r from-amber-50 to-amber-100 rounded-xl border-2 border-amber-200 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-gradient-to-br from-amber-600 to-amber-700 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-slate-800 mb-2 text-lg">
                  4. Detalles que recuerdes
                </h4>
                <p className="text-slate-700 mb-2 leading-relaxed">
                  Todo lo que venga a tu mente es importante:
                </p>
                <p className="text-amber-700 italic bg-white/70 p-3 rounded-lg border border-amber-200">
                  Hacía mucho calor ese día, todos estábamos muy felices. Había torta de chocolate que es mi favorita...
                </p>
                <p className="text-sm text-green-700 font-medium mt-3 flex items-center gap-2">
                  ✨ Consejo: Clima, emociones, comida, olores, cualquier detalle cuenta
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-xl p-5 mb-6">
            <div className="text-center">
              <p className="text-green-900 font-bold text-lg mb-2">
                🌟 ¡Lo estás haciendo muy bien!
              </p>
              <p className="text-green-800 leading-relaxed">
                No te preocupes si no recuerdas todo. <strong>No hay respuestas incorrectas.</strong>
                <br />
                Simplemente describe lo que recuerdes con tus propias palabras.
                <br />
                <strong className="text-green-900">¡Cada recuerdo es un tesoro!</strong>
              </p>
            </div>
          </div>

          {/* Botones */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-colors font-semibold border-2 border-slate-200"
            >
              Ver después
            </button>
            <button
              onClick={() => {
                onClose()
                onStart()
              }}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:from-purple-700 hover:to-indigo-700 transition-all font-bold flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              ¡Comenzar ahora!
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}