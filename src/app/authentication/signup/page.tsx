import { Suspense } from "react"
import RegisterForm from "../components/registerForm"

// Componente de loading mientras se cargan los search params
function RegisterFormLoading() {
  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2">
      <div 
        className="hidden lg:block relative bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/images/medicaIndividual.jpg')" }}
      />
      
      <div className="flex items-center justify-center p-8 bg-gradient-to-br from-pink-100 to-indigo-800">
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 border-4 border-purple-500/30 border-t-purple-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-800 text-lg font-medium">Cargando...</p>
        </div>
      </div>
    </div>
  )
}

export default function SignupPage() {
  return (
    <Suspense fallback={<RegisterFormLoading />}>
      <RegisterForm />
    </Suspense>
  )
}