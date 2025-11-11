"use client"

import { useRouter } from "next/navigation"
import Image from "next/image"

interface HeaderProps {
  showLoginButton?: boolean
}

export default function Header({ showLoginButton = true }: HeaderProps) {
  const router = useRouter()

  const handleLogoClick = () => {
    router.push('/')
  }

  const handleLogin = () => {
    router.push('/authentication/login')
  }

  return (
    <header className="bg-white/95 backdrop-blur-sm border-b border-slate-200 shadow-sm">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div 
            className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={handleLogoClick}
          >
            <Image
              src="/loading.svg"
              alt="DoURemember Logo"
              width={42}
              height={42}
              className="object-contain"
              priority
            />
            <h1 className="text-2xl font-bold text-slate-800">DoURemember</h1>
          </div>

          
        </div>
      </div>
    </header>
  )
}