import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type UserRole = 'admin' | 'budget'

export interface AuthState {
  isAuthenticated: boolean
  role: UserRole | null
  loginTime: string | null
  login: (password: string) => { success: boolean; role: UserRole } | null
  logout: () => void
}

const PASSWORDS: Record<string, UserRole> = {
  admin2026: 'admin',
  budget2026: 'budget'
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      role: null,
      loginTime: null,
      login: (password: string) => {
        const role = PASSWORDS[password]
        if (role) {
          set({
            isAuthenticated: true,
            role,
            loginTime: new Date().toISOString()
          })
          return { success: true, role }
        }
        return null
      },
      logout: () => {
        set({
          isAuthenticated: false,
          role: null,
          loginTime: null
        })
      }
    }),
    {
      name: 'dashboard-auth-storage'
    }
  )
)
