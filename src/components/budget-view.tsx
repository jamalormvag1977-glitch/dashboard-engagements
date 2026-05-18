'use client'

import { engagements, formatCurrency, formatShortCurrency } from '@/lib/engagements-data'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuthStore } from '@/lib/auth-store'
import { Progress } from '@/components/ui/progress'
import { DollarSign, TrendingUp, TrendingDown, Wallet } from 'lucide-react'

export function BudgetView() {
  const role = useAuthStore((s) => s.role)
  const budgetTotal = engagements.reduce((a, e) => a + e.montant, 0)
  const budgetConsomme = engagements.reduce((a, e) => a + e.montantConsomme, 0)
  const tauxConsommation = Math.round((budgetConsomme / budgetTotal) * 100)
  const budgetRestant = budgetTotal - budgetConsomme

  const parCategorie = ['Infrastructure', 'Éducation', 'Santé', 'Agriculture', 'Transport', 'Énergie'].map((cat) => {
    const items = engagements.filter((e) => e.categorie === cat)
    const total = items.reduce((a, e) => a + e.montant, 0)
    const consomme = items.reduce((a, e) => a + e.montantConsomme, 0)
    return { categorie: cat, total, consomme, taux: total > 0 ? Math.round((consomme / total) * 100) : 0, count: items.length }
  })

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Budget Total</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">{formatShortCurrency(budgetTotal)} FCFA</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-50 dark:bg-violet-900/20">
                <Wallet className="h-5 w-5 text-violet-600 dark:text-violet-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Budget Consommé</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">{formatShortCurrency(budgetConsomme)} FCFA</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-900/20">
                <TrendingUp className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
            <div className="mt-3">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-gray-500">Taux de consommation</span>
                <span className="font-medium">{tauxConsommation}%</span>
              </div>
              <Progress value={tauxConsommation} className="h-2" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Budget Restant</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">{formatShortCurrency(budgetRestant)} FCFA</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-50 dark:bg-cyan-900/20">
                <DollarSign className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-gray-900 dark:text-gray-100">
            Budget par catégorie
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {parCategorie.map((cat) => (
            <div key={cat.categorie} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{cat.categorie}</span>
                  <span className="text-xs text-gray-400">({cat.count} engagements)</span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {formatShortCurrency(cat.consomme)} / {formatShortCurrency(cat.total)} FCFA
                  </span>
                  <span className="text-xs text-gray-400 ml-2">{cat.taux}%</span>
                </div>
              </div>
              <Progress value={cat.taux} className="h-2" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
