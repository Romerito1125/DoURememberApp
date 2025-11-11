"use client"

import { useEffect, useRef } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'

interface CredentialResponse {
  credential: string
  select_by: string
}

declare global {
  interface Window {
    google: any
    handleSignInWithGoogle?: (response: CredentialResponse) => Promise<void>
  }
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

export default function GoogleSignInButton() {
  const supabase = createClient()
  const router = useRouter()
  const buttonContainerRef = useRef<HTMLDivElement>(null)
  const nonceRef = useRef<string>('')

  useEffect(() => {
    const initializeGoogleButton = async () => {
      // Verificar que tenemos el Client ID
      if (!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID) {
        console.error('❌ NEXT_PUBLIC_GOOGLE_CLIENT_ID no está configurado')
        return
      }

      // Generar nonce
      const [nonce, hashedNonce] = await generateNonce()
      nonceRef.current = nonce

      // Definir función de callback global
      window.handleSignInWithGoogle = async (response: CredentialResponse) => {
        try {
          console.log('🔐 Iniciando sesión con Google...')
          
          const { data, error } = await supabase.auth.signInWithIdToken({
            provider: 'google',
            token: response.credential,
            nonce: nonceRef.current,
          })

          if (error) throw error

          console.log('✅ Sesión iniciada:', data)
          router.push('/')
        } catch (error) {
          console.error('❌ Error al iniciar sesión con Google:', error)
          alert('Error al iniciar sesión con Google. Por favor, intenta nuevamente.')
        }
      }

      // Cargar el script de Google si no está cargado
      if (!window.google) {
        const script = document.createElement('script')
        script.src = 'https://accounts.google.com/gsi/client'
        script.async = true
        script.defer = true
        script.onload = () => {
          renderButton(hashedNonce)
        }
        document.body.appendChild(script)
      } else {
        renderButton(hashedNonce)
      }
    }

    const renderButton = (hashedNonce: string) => {
      if (window.google && buttonContainerRef.current) {
        // Limpiar contenedor antes de renderizar
        buttonContainerRef.current.innerHTML = ''

        // Renderizar el botón de Google
        window.google.accounts.id.initialize({
          client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
          callback: window.handleSignInWithGoogle,
          nonce: hashedNonce,
          use_fedcm_for_prompt: true,
        })

        window.google.accounts.id.renderButton(
          buttonContainerRef.current,
          {
            theme: 'outline',
            size: 'large',
            width: '100%',
            text: 'signin_with',
            shape: 'rectangular',
            logo_alignment: 'left',
          }
        )
      }
    }

    initializeGoogleButton()

    // Cleanup
    return () => {
      if (window.handleSignInWithGoogle) {
        delete window.handleSignInWithGoogle
      }
    }
  }, [router, supabase.auth])

  return (
    <div className="w-full">
      <div ref={buttonContainerRef} className="w-full flex justify-center" />
    </div>
  )
}