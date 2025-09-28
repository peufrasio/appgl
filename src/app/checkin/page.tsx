'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function CheckinPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirecionar para a página principal com parâmetro checkin
    router.replace('/?checkin=true')
  }, [router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Redirecionando para o check-in...</p>
      </div>
    </div>
  )
}