"use client"

import Script from 'next/script'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'

declare global {
  interface Window {
    google: any
  }
}

interface CredentialResponse {
  credential: string
  select_by: string
}

// Generar nonce para Google ID token sign-in
const generateNonce = async (): Promise<string[]> => {
  const nonce = btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32))))
  const encoder = new TextEncoder()
  const encodedNonce = encoder.encode(nonce)
  const hashBuffer = await crypto.subtle.digest('SHA-256', encodedNonce)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashedNonce = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
  return [nonce, hashedNonce]
}

export default function GoogleOneTap() {
  const supabase = createClient()
  const router = useRouter()

  const initializeGoogleOneTap = async () => {
    console.log('🔧 Inicializando Google One Tap')
    
    // Verificar que tenemos el Client ID
    if (!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID) {
      console.error('❌ NEXT_PUBLIC_GOOGLE_CLIENT_ID no está configurado')
      return
    }

    const [nonce, hashedNonce] = await generateNonce()
    console.log('✅ Nonce generado')

    // Verificar si ya hay una sesión activa
    const { data, error } = await supabase.auth.getSession()
    if (error) {
      console.error('❌ Error obteniendo sesión:', error)
    }
    
    if (data.session) {
      console.log('✅ Sesión existente encontrada, redirigiendo...')
      router.push('/')
      return
    }

    // Inicializar Google One Tap
    if (window.google) {
      window.google.accounts.id.initialize({
        client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
        callback: async (response: CredentialResponse) => {
          try {
            console.log('🔐 Respuesta de Google recibida')
            
            // Enviar el ID token a Supabase
            const { data, error } = await supabase.auth.signInWithIdToken({
              provider: 'google',
              token: response.credential,
              nonce,
            })

            if (error) throw error

            console.log('✅ Inicio de sesión exitoso:', data)
            console.log('🎉 Redirigiendo al inicio...')
            
            // Redirigir a la página principal
            router.push('/')
          } catch (error) {
            console.error('❌ Error en inicio de sesión con Google One Tap:', error)
          }
        },
        nonce: hashedNonce,
        use_fedcm_for_prompt: true,
      })
      
      window.google.accounts.id.prompt()
      console.log('✅ Google One Tap UI mostrado')
    }
  }

  // ✅ Wrapper function que NO es async
  const handleScriptLoad = () => {
    initializeGoogleOneTap().catch(error => {
      console.error('❌ Error inicializando Google One Tap:', error)
    })
  }

  return (
    <Script 
      src="https://accounts.google.com/gsi/client" 
      onReady={handleScriptLoad}  // ✅ Ahora usa la función wrapper
      strategy="afterInteractive"
    />
  )
}