'use client'

import { engagements, formatShortCurrency } from '@/lib/engagements-data'
import { Card, CardContent } from '@/components/ui/card'
import {
  FileCheck,
  TrendingUp,
  DollarSign,
  PieChart,
  AlertTriangle,
  CheckCircle2
} from 'lucide-react'

export function KPICards() {
  const total = engagements.length
  const valides = engagements.filter((e) => e.statut === 'Validé').length
  const enRetard = engagements.filter((e) => e.statut === 'En retard').length
  const tauxMoyen = Math.round(engagements.reduce((a, e) => a + e.tauxRealisation, 0) / total)
  const budgetTotal = engagements.reduce((a, e) => a + e.montant, 0)
  const budgetConsomme = engagements.reduce((a, e) => a + e.montantConsomme, 0)

  const cards = [
    {
      title: 'Total Engagements',
      value: total.toString(),
      subtitle: `${valides} validés, ${enRetard} en retard`,
      icon: <FileCheck className="h-5 w-5" />,
      color: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-50 dark:bg-emerald-900/20'
    },
    {
      title: 'Taux de Réalisation',
      value: `${tauxMoyen}%`,
      subtitle: 'Moyenne globale',
      icon: <TrendingUp className="h-5 w-5" />,
      color: 'text-blue-600 dark:text-blue-400',
      bg: 'bg-blue-50 dark:bg-blue-900/20'
    },
    {
      title: 'Budget Total',
      value: formatShortCurrency(budgetTotal) + ' FCFA',
      subtitle: 'Montant engagé',
      icon: <DollarSign className="h-5 w-5" />,
      color: 'text-violet-600 dark:text-violet-400',
      bg: 'bg-violet-50 dark:bg-violet-900/20'
    },
    {
      title: 'Budget Consommé',
      value: formatShortCurrency(budgetConsomme) + ' FCFA',
      subtitle: `${Math.round((budgetConsomme / budgetTotal) * 100)}% du total`,
      icon: <PieChart className="h-5 w-5" />,
      color: 'text-cyan-600 dark:text-cyan-400',
      bg: 'bg-cyan-50 dark:bg-cyan-900/20'
    },
    {
      title: 'En Retard',
      value: enRetard.toString(),
      subtitle: 'Engagements dépassés',
      icon: <AlertTriangle className="h-5 w-5" />,
      color: 'text-red-600 dark:text-red-400',
      bg: 'bg-red-50 dark:bg-red-900/20'
    },
    {
      title: 'Validés',
      value: valides.toString(),
      subtitle: 'Engagements clôturés',
      icon: <CheckCircle2 className="h-5 w-5" />,
      color: 'text-green-600 dark:text-green-400',
      bg: 'bg-green-50 dark:bg-green-900/20'
    }
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {cards.map((card) => (
        <Card key={card.title} className="border-0 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">{card.title}</p>
                <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{card.value}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500">{card.subtitle}</p>
              </div>
              <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${card.bg}`}>
                <span className={card.color}>{card.icon}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
