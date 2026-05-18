'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type UserRole = 'admin' | 'budget'

export interface AuthUser {
  role: UserRole
  isAuthenticated: boolean
}

interface AuthState {
  user: AuthUser | null
  login: (role: UserRole, password: string) => boolean
  logout: () => void
  isAdmin: () => boolean
  isBudget: () => boolean
}

const VALID_CREDENTIALS: Record<UserRole, string> = {
  admin: 'admin2026',
  budget: 'budget2026',
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,

      login: (role: UserRole, password: string): boolean => {
        if (VALID_CREDENTIALS[role] === password) {
          set({
            user: {
              role,
              isAuthenticated: true,
            },
          })
          return true
        }
        return false
      },

      logout: () => {
        set({ user: null })
      },

      isAdmin: () => {
        const state = get()
        return state.user?.role === 'admin' && state.user?.isAuthenticated === true
      },

      isBudget: () => {
        const state = get()
        return state.user?.role === 'budget' && state.user?.isAuthenticated === true
      },
    }),
    {
      name: 'dashboard-engagements-auth',
    }
  )
)
