'use client'

import { useState } from 'react'
import { useAuthStore } from '@/lib/auth-store'
import { Sidebar } from '@/components/sidebar'
import { Header } from '@/components/header'
import { KPICards } from '@/components/kpi-cards'
import { EngagementsChart } from '@/components/engagements-chart'
import { EngagementsTable } from '@/components/engagements-table'
import { BudgetView } from '@/components/budget-view'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Users, FileText, BarChart3, Settings, Building2, Clock, MapPin } from 'lucide-react'
import { engagements, formatCurrency, formatShortCurrency } from '@/lib/engagements-data'

function DashboardHome() {
  return (
    <div className="space-y-6">
      <KPICards />
      <EngagementsChart />
      <EngagementsTable />
    </div>
  )
}

function EngagementsView() {
  return (
    <div className="space-y-6">
      <EngagementsTable />
    </div>
  )
}

function RapportsView() {
  const total = engagements.length
  const valides = engagements.filter(e => e.statut === 'Validé').length
  const enRetard = engagements.filter(e => e.statut === 'En retard').length
  const tauxMoyen = Math.round(engagements.reduce((a, e) => a + e.tauxRealisation, 0) / total)

  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Rapport de Synthèse
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h3 className="font-medium text-gray-900 dark:text-gray-100">Indicateurs Clés</h3>
              <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-800">
                  <span>Nombre total d&apos;engagements</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">{total}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-800">
                  <span>Engagements validés</span>
                  <span className="font-medium text-green-600 dark:text-green-400">{valides}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-800">
                  <span>Engagements en retard</span>
                  <span className="font-medium text-red-600 dark:text-red-400">{enRetard}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-800">
                  <span>Taux de réalisation moyen</span>
                  <span className="font-medium text-emerald-600 dark:text-emerald-400">{tauxMoyen}%</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-800">
                  <span>Budget total engagé</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">{formatShortCurrency(engagements.reduce((a, e) => a + e.montant, 0))} FCFA</span>
                </div>
                <div className="flex justify-between py-2">
                  <span>Budget consommé</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">{formatShortCurrency(engagements.reduce((a, e) => a + e.montantConsomme, 0))} FCFA</span>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <h3 className="font-medium text-gray-900 dark:text-gray-100">Analyse des Retards</h3>
              <div className="space-y-3">
                {engagements.filter(e => e.statut === 'En retard').map(eng => (
                  <div key={eng.id} className="p-3 rounded-lg bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30">
                    <p className="text-sm font-medium text-red-700 dark:text-red-400">{eng.reference}</p>
                    <p className="text-xs text-red-600 dark:text-red-500 mt-1">{eng.objet}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-red-500 dark:text-red-400 flex items-center gap-1">
                        <Clock className="h-3 w-3" /> Échéance: {new Date(eng.echeance).toLocaleDateString('fr-FR')}
                      </span>
                      <span className="text-xs font-medium text-red-600 dark:text-red-400">{eng.tauxRealisation}% réalisé</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="pt-4">
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
              <FileText className="h-4 w-4 mr-2" /> Exporter le rapport PDF
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function BeneficiairesView() {
  const beneficiaires = [...new Set(engagements.map(e => e.beneficiaire))]
  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Bénéficiaires ({beneficiaires.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {beneficiaires.map(b => {
              const items = engagements.filter(e => e.beneficiaire === b)
              const total = items.reduce((a, e) => a + e.montant, 0)
              const consomme = items.reduce((a, e) => a + e.montantConsomme, 0)
              return (
                <Card key={b} className="border border-gray-200 dark:border-gray-800 shadow-none">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-900/20">
                        <Building2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{b}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{items.length} engagement(s)</p>
                        <div className="flex items-center gap-4 mt-2 text-xs">
                          <span className="text-gray-500">Total: <span className="font-medium text-gray-900 dark:text-gray-100">{formatShortCurrency(total)} FCFA</span></span>
                          <span className="text-gray-500">Consommé: <span className="font-medium text-emerald-600 dark:text-emerald-400">{formatShortCurrency(consomme)} FCFA</span></span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function ParametresView() {
  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Paramètres du système
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="font-medium text-gray-900 dark:text-gray-100">Général</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-800">
                  <span className="text-gray-600 dark:text-gray-400">Version</span>
                  <span className="font-medium">2.1.0</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-800">
                  <span className="text-gray-600 dark:text-gray-400">Environnement</span>
                  <span className="font-medium text-emerald-600">Production</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-800">
                  <span className="text-gray-600 dark:text-gray-400">Dernière mise à jour</span>
                  <span className="font-medium">16/05/2026</span>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <h3 className="font-medium text-gray-900 dark:text-gray-100">Sécurité</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-800">
                  <span className="text-gray-600 dark:text-gray-400">Authentification</span>
                  <span className="font-medium text-emerald-600">Active</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-800">
                  <span className="text-gray-600 dark:text-gray-400">Sessions actives</span>
                  <span className="font-medium">1</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-gray-600 dark:text-gray-400">Rôles configurés</span>
                  <span className="font-medium">2 (Admin, Budget)</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export function Dashboard() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const role = useAuthStore((s) => s.role)

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardHome />
      case 'engagements':
        return <EngagementsView />
      case 'budget':
        return <BudgetView />
      case 'rapports':
        return <RapportsView />
      case 'beneficiaires':
        return <BeneficiairesView />
      case 'parametres':
        return <ParametresView />
      default:
        return <DashboardHome />
    }
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-950">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          {renderContent()}
        </main>
      </div>
    </div>
  )
}
