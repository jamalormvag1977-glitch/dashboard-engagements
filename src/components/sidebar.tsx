'use client'

import { useAuthStore, UserRole } from '@/lib/auth-store'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  FileText,
  DollarSign,
  BarChart3,
  Users,
  Settings,
  LogOut,
  ShieldCheck,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { useState } from 'react'

interface SidebarProps {
  activeTab: string
  onTabChange: (tab: string) => void
}

interface NavItem {
  id: string
  label: string
  icon: React.ReactNode
  roles: UserRole[]
}

const navItems: NavItem[] = [
  { id: 'dashboard', label: 'Tableau de bord', icon: <LayoutDashboard className="h-5 w-5" />, roles: ['admin', 'budget'] },
  { id: 'engagements', label: 'Engagements', icon: <FileText className="h-5 w-5" />, roles: ['admin', 'budget'] },
  { id: 'budget', label: 'Budget', icon: <DollarSign className="h-5 w-5" />, roles: ['admin', 'budget'] },
  { id: 'rapports', label: 'Rapports', icon: <BarChart3 className="h-5 w-5" />, roles: ['admin'] },
  { id: 'beneficiaires', label: 'Bénéficiaires', icon: <Users className="h-5 w-5" />, roles: ['admin'] },
  { id: 'parametres', label: 'Paramètres', icon: <Settings className="h-5 w-5" />, roles: ['admin'] },
]

export function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  const role = useAuthStore((s) => s.role)
  const logout = useAuthStore((s) => s.logout)
  const [collapsed, setCollapsed] = useState(false)

  const visibleItems = navItems.filter((item) => role && item.roles.includes(role))

  return (
    <aside
      className={cn(
        'flex flex-col bg-gray-900 text-white transition-all duration-300 h-screen sticky top-0',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-gray-800">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-600">
          <ShieldCheck className="h-5 w-5 text-white" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <h1 className="text-sm font-bold leading-tight">Dashboard</h1>
            <p className="text-xs text-gray-400">Engagements</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 space-y-1 px-2 overflow-y-auto">
        {visibleItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={cn(
              'flex items-center gap-3 w-full rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
              activeTab === item.id
                ? 'bg-emerald-600 text-white'
                : 'text-gray-300 hover:bg-gray-800 hover:text-white'
            )}
            title={collapsed ? item.label : undefined}
          >
            {item.icon}
            {!collapsed && <span>{item.label}</span>}
          </button>
        ))}
      </nav>

      {/* Role Badge */}
      {!collapsed && role && (
        <div className="px-4 py-2">
          <div className={cn(
            'text-xs font-medium px-2 py-1 rounded-full text-center',
            role === 'admin' ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'
          )}>
            {role === 'admin' ? 'Administrateur' : 'Budget'}
          </div>
        </div>
      )}

      {/* Collapse toggle */}
      <div className="px-2 py-2 border-t border-gray-800">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center gap-3 w-full rounded-lg px-3 py-2 text-sm text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
        >
          {collapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
          {!collapsed && <span>Réduire</span>}
        </button>
      </div>

      {/* Logout */}
      <div className="px-2 py-2 border-t border-gray-800">
        <button
          onClick={logout}
          className="flex items-center gap-3 w-full rounded-lg px-3 py-2 text-sm text-gray-400 hover:bg-red-900/30 hover:text-red-400 transition-colors"
        >
          <LogOut className="h-5 w-5" />
          {!collapsed && <span>Déconnexion</span>}
        </button>
      </div>
    </aside>
  )
}
