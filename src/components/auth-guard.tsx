'use client'

import { useAuthStore } from '@/lib/auth-store'
import { LoginPage } from '@/components/login-page'

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  if (!isAuthenticated) {
    return <LoginPage />
  }

  return <>{children}</>
}
