'use client'

import { useAuthStore, UserRole } from '@/lib/auth-store'
import { Badge } from '@/components/ui/badge'
import { Bell, User } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function Header() {
  const role = useAuthStore((s) => s.role)
  const loginTime = useAuthStore((s) => s.loginTime)
  const logout = useAuthStore((s) => s.logout)

  return (
    <header className="flex items-center justify-between px-6 py-3 bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Tableau de Bord des Engagements
        </h2>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Suivi et pilotage des engagements budgétaires
        </p>
      </div>
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5 text-gray-500" />
          <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white font-bold">
            3
          </span>
        </Button>
        <div className="flex items-center gap-2 pl-3 border-l border-gray-200 dark:border-gray-700">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/50">
            <User className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {role === 'admin' ? 'Administrateur' : 'Agent Budget'}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {loginTime ? new Date(loginTime).toLocaleString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : ''}
            </p>
          </div>
          <Badge
            variant="outline"
            className={role === 'admin'
              ? 'border-amber-300 text-amber-600 dark:border-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20'
              : 'border-emerald-300 text-emerald-600 dark:border-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20'
            }
          >
            {role === 'admin' ? 'Admin' : 'Budget'}
          </Badge>
        </div>
      </div>
    </header>
  )
}
