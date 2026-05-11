'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import {
  Building2,
  Users,
  FileText,
  TrendingUp,
  Filter,
  Download,
  ChevronLeft,
  ChevronRight,
  Search,
  BarChart3,
  Upload,
  RefreshCw,
  CheckCircle2,
  Clock,
} from 'lucide-react'

interface DataRow {
  PROJET: string
  GROUPE: string
  'SOURCE FINANCEMENT': string
  NOMENCLATURE: string | number | null
  'N° ENGAGEMENT': string | null
  ENTITE: string
  'DETAIL DESIGNATION': string | null
  REPORTS: number | null
  CONSOLIDES: number | null
  NOUVEAUX: number | null
  CP: number | null
  'TOTAL CP': number | null
  'CE CONSOLIDES': number | null
  'CE NOUVEAUX': number | null
  'TOTAL CE': number | null
  'ENG REPORT': number | null
  'ENG CONSOLIDES': number | null
  'ENG NOUVEAUX': number | null
  'ENG CP TOTAL': number | null
  'ENG CE ULT': number | null
  'ORD REPORTS': number | null
  'ORD CONSOLIDES': number | null
  'ORD NOUVEAUX': number | null
  'ORD TOTAL': number | null
  'PAIEMENTS SUR REPORTS': number | null
  'PAIEMENTS SUR CONSOLIDES': number | null
  'PAIEMENTS SUR NOUVEAUX': number | null
  'PAIEMENTS TOTAL': number | null
  'TOTAL PREV': number | null
  [key: string]: string | number | null
}

interface FilterData {
  projets: string[]
  groupes: string[]
  entites: string[]
}

const CHART_COLORS = [
  '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4',
  '#ec4899', '#14b8a6', '#f97316', '#6366f1', '#84cc16',
]

function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined) return '-'
  if (value === 0) return '0'
  if (Math.abs(value) >= 1e9) return `${(value / 1e9).toFixed(1)} Md`
  if (Math.abs(value) >= 1e6) return `${(value / 1e6).toFixed(2)} M`
  if (Math.abs(value) >= 1e3) return `${(value / 1e3).toFixed(1)} K`
  return value.toLocaleString('fr-FR')
}

function formatNumberFull(value: number | null | undefined): string {
  if (value === null || value === undefined) return '-'
  return value.toLocaleString('fr-FR')
}

function formatDate(iso: string | null): string {
  if (!iso) return '-'
  const d = new Date(iso)
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default function Dashboard() {
  const [data, setData] = useState<DataRow[]>([])
  const [filters, setFilters] = useState<FilterData>({ projets: [], groupes: [], entites: [] })
  const [loading, setLoading] = useState(true)
  const [selectedProjet, setSelectedProjet] = useState<string>('all')
  const [selectedGroupe, setSelectedGroupe] = useState<string>('all')
  const [selectedEntite, setSelectedEntite] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [activeTab, setActiveTab] = useState<'table' | 'charts'>('table')
  const [uploading, setUploading] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)
  const [refreshStatus, setRefreshStatus] = useState<'idle' | 'checking' | 'updated'>('idle')
  const rowsPerPage = 15

  const handleProjetChange = (value: string) => { setSelectedProjet(value); setCurrentPage(1) }
  const handleGroupeChange = (value: string) => { setSelectedGroupe(value); setCurrentPage(1) }
  const handleEntiteChange = (value: string) => { setSelectedEntite(value); setCurrentPage(1) }
  const handleSearchChange = (value: string) => { setSearchTerm(value); setCurrentPage(1) }

  // Fetch data from API
  const fetchData = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true)
      setRefreshStatus('checking')
      const res = await fetch('/api/data')
      if (!res.ok) throw new Error('Failed to fetch')
      const response = await res.json()
      setData(response.data || [])
      setFilters(response.filters || { projets: [], groupes: [], entites: [] })
      setLastUpdated(response.lastUpdated || null)
      setRefreshStatus('updated')
      setTimeout(() => setRefreshStatus('idle'), 2000)
    } catch (err) {
      console.error('Error loading data:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  // Initial load
  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchData(true)
    }, 30000)
    return () => clearInterval(interval)
  }, [fetchData])

  // Handle Excel file upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Upload failed')
      }

      const result = await res.json()

      // Refresh data from server
      await fetchData(true)

      alert(`Fichier importé avec succès ! ${result.count} lignes chargées. Le dashboard de votre directeur sera mis à jour automatiquement.`)
    } catch (err) {
      console.error('Upload error:', err)
      alert(`Erreur lors de l'import : ${(err as Error).message}`)
    } finally {
      setUploading(false)
      // Reset file input
      event.target.value = ''
    }
  }

  const filteredData = useMemo(() => {
    return data.filter(row => {
      if (selectedProjet !== 'all' && row.PROJET !== selectedProjet) return false
      if (selectedGroupe !== 'all' && row.GROUPE !== selectedGroupe) return false
      if (selectedEntite !== 'all' && row.ENTITE !== selectedEntite) return false
      if (searchTerm) {
        const search = searchTerm.toLowerCase()
        const designation = (row['DETAIL DESIGNATION'] || '').toLowerCase()
        const engagement = (row['N° ENGAGEMENT'] || '').toLowerCase()
        if (!designation.includes(search) && !engagement.includes(search)) return false
      }
      return true
    })
  }, [data, selectedProjet, selectedGroupe, selectedEntite, searchTerm])

  // KPI calculations
  const kpis = useMemo(() => {
    const totalCP = filteredData.reduce((sum, r) => sum + (r['TOTAL CP'] || 0), 0)
    const totalCE = filteredData.reduce((sum, r) => sum + (r['TOTAL CE'] || 0), 0)
    const totalPaiements = filteredData.reduce((sum, r) => sum + (r['PAIEMENTS TOTAL'] || 0), 0)
    const totalPrevisions = filteredData.reduce((sum, r) => sum + (r['TOTAL PREV'] || 0), 0)
    const totalEngCP = filteredData.reduce((sum, r) => sum + (r['ENG CP TOTAL'] || 0), 0)
    const totalEngCE = filteredData.reduce((sum, r) => sum + (r['ENG CE ULT'] || 0), 0)
    // Taux d'engagement = Engagements CP / Total CP
    const tauxEngagement = totalCP > 0 ? (totalEngCP / totalCP) * 100 : 0
    // Taux de paiement = Paiements / Engagements CP
    const tauxPaiement = totalEngCP > 0 ? (totalPaiements / totalEngCP) * 100 : 0
    return { totalCP, totalCE, totalPaiements, totalPrevisions, totalEngCP, totalEngCE, count: filteredData.length, tauxEngagement, tauxPaiement }
  }, [filteredData])

  // Chart data
  const chartByGroupe = useMemo(() => {
    const groups: Record<string, { cp: number; ce: number; paiements: number; previsions: number }> = {}
    filteredData.forEach(row => {
      const g = row.GROUPE
      if (!groups[g]) groups[g] = { cp: 0, ce: 0, paiements: 0, previsions: 0 }
      groups[g].cp += row['TOTAL CP'] || 0
      groups[g].ce += row['TOTAL CE'] || 0
      groups[g].paiements += row['PAIEMENTS TOTAL'] || 0
      groups[g].previsions += row['TOTAL PREV'] || 0
    })
    return Object.entries(groups).map(([name, vals]) => ({ name, ...vals })).sort((a, b) => {
      const numA = parseInt(a.name.replace(/\D/g, '')) || 0
      const numB = parseInt(b.name.replace(/\D/g, '')) || 0
      return numA - numB
    })
  }, [filteredData])

  const chartByEntite = useMemo(() => {
    const entities: Record<string, { cp: number; ce: number; paiements: number; previsions: number }> = {}
    filteredData.forEach(row => {
      const e = row.ENTITE
      if (!entities[e]) entities[e] = { cp: 0, ce: 0, paiements: 0, previsions: 0 }
      entities[e].cp += row['TOTAL CP'] || 0
      entities[e].ce += row['TOTAL CE'] || 0
      entities[e].paiements += row['PAIEMENTS TOTAL'] || 0
      entities[e].previsions += row['TOTAL PREV'] || 0
    })
    return Object.entries(entities).map(([name, vals]) => ({ name, ...vals }))
  }, [filteredData])

  const monthlyPrevisions = useMemo(() => {
    const months = [
      { key: 'JANVIER', label: 'Jan' },
      { key: 'FEVRIER', label: 'Fév' },
      { key: 'MARS', label: 'Mar' },
      { key: 'AVRIL', label: 'Avr' },
      { key: 'MAI', label: 'Mai' },
      { key: 'JUIN', label: 'Jun' },
      { key: 'JUILLET', label: 'Jul' },
      { key: 'AOUT', label: 'Aoû' },
      { key: 'SEPTEMBRE', label: 'Sep' },
      { key: 'OCTOBRE', label: 'Oct' },
      { key: 'NOVEMBRE', label: 'Nov' },
      { key: 'DECEMBRE', label: 'Déc' },
    ]
    return months.map(m => {
      const reports = filteredData.reduce((s, r) => s + (r[`Previsions REPORTS ${m.key}`] || 0), 0)
      const consolides = filteredData.reduce((s, r) => s + (r[`Previsions CONSOLIDES ${m.key}`] || 0), 0)
      const nouveaux = filteredData.reduce((s, r) => s + (r[`Previsions NOUVEAUX ${m.key}`] || 0), 0)
      return { name: m.label, Reports: reports, Consolidés: consolides, Nouveaux: nouveaux }
    })
  }, [filteredData])

  const pieDataBySource = useMemo(() => {
    const sources: Record<string, number> = {}
    filteredData.forEach(row => {
      const s = row['SOURCE FINANCEMENT']
      sources[s] = (sources[s] || 0) + (row['TOTAL CP'] || 0)
    })
    return Object.entries(sources).map(([name, value]) => ({ name, value }))
  }, [filteredData])

  const totalPages = Math.ceil(filteredData.length / rowsPerPage)
  const paginatedData = filteredData.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage)

  const handleExport = () => {
    const headers = ['PROJET', 'GROUPE', 'SOURCE FINANCEMENT', 'NOMENCLATURE', 'N° ENGAGEMENT', 'ENTITE', 'DETAIL DESIGNATION', 'TOTAL CP', 'TOTAL CE', 'PAIEMENTS TOTAL', 'TOTAL PREV']
    const csvRows = [headers.join(';')]
    filteredData.forEach(row => {
      const values = headers.map(h => {
        const v = row[h]
        if (v === null || v === undefined) return ''
        return String(v).replace(/;/g, ',')
      })
      csvRows.push(values.join(';'))
    })
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = 'dashboard_export.csv'
    link.click()
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
          <p className="text-gray-500 text-sm">Chargement des données...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-emerald-600 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">Tableau de Bord - Engagements</h1>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Clock className="w-3 h-3" />
                  <span>Dernière mise à jour : {formatDate(lastUpdated)}</span>
                  {refreshStatus === 'checking' && (
                    <span className="text-amber-600 flex items-center gap-1">
                      <RefreshCw className="w-3 h-3 animate-spin" /> Vérification...
                    </span>
                  )}
                  {refreshStatus === 'updated' && (
                    <span className="text-emerald-600 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> À jour
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                {filteredData.length} ligne{filteredData.length > 1 ? 's' : ''}
              </Badge>
              <label htmlFor="excel-upload">
                <Button
                  className="bg-emerald-600 hover:bg-emerald-700 gap-1.5 cursor-pointer"
                  size="sm"
                  disabled={uploading}
                  asChild
                >
                  <span>
                    <Upload className="w-4 h-4" />
                    {uploading ? 'Import en cours...' : '📥 Importer Excel'}
                  </span>
                </Button>
              </label>
              <input
                id="excel-upload"
                type="file"
                accept=".xlsx,.xls"
                className="hidden"
                onChange={handleFileUpload}
                disabled={uploading}
              />
              <Button variant="outline" size="sm" onClick={handleExport} className="gap-1.5">
                <Download className="w-4 h-4" />
                Export CSV
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => fetchData(true)}
                title="Actualiser maintenant"
              >
                <RefreshCw className={`w-4 h-4 ${refreshStatus === 'checking' ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Auto-refresh info banner */}
      <div className="bg-emerald-50 border-b border-emerald-100">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-2">
          <p className="text-xs text-emerald-700 flex items-center gap-2">
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="font-medium">Actualisation automatique toutes les 30 secondes</span>
            <span className="text-emerald-600">— Importez un fichier Excel et le dashboard se met à jour instantanément pour tous les utilisateurs</span>
          </p>
        </div>
      </div>

      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Filters */}
        <Card className="border-gray-200 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Filter className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-semibold text-gray-700">Filtres</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Projet</label>
                <Select value={selectedProjet} onValueChange={handleProjetChange}>
                  <SelectTrigger className="bg-white">
                    <SelectValue placeholder="Tous les projets" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les projets</SelectItem>
                    {filters.projets.map(p => (
                      <SelectItem key={p} value={p}>{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Groupe</label>
                <Select value={selectedGroupe} onValueChange={handleGroupeChange}>
                  <SelectTrigger className="bg-white">
                    <SelectValue placeholder="Tous les groupes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les groupes</SelectItem>
                    {filters.groupes.map(g => (
                      <SelectItem key={g} value={g}>{g}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Entité</label>
                <Select value={selectedEntite} onValueChange={handleEntiteChange}>
                  <SelectTrigger className="bg-white">
                    <SelectValue placeholder="Toutes les entités" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes les entités</SelectItem>
                    {filters.entites.map(e => (
                      <SelectItem key={e} value={e}>{e}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Recherche</label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Désignation ou N° engagement..."
                    value={searchTerm}
                    onChange={e => handleSearchChange(e.target.value)}
                    className="pl-8 bg-white"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
          <Card className="border-gray-200 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                  <FileText className="w-4 h-4 text-emerald-600" />
                </div>
                <span className="text-xs font-medium text-gray-500">Lignes</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{kpis.count}</p>
            </CardContent>
          </Card>
          <Card className="border-gray-200 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                  <Building2 className="w-4 h-4 text-blue-600" />
                </div>
                <span className="text-xs font-medium text-gray-500">Total CP</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{formatNumber(kpis.totalCP)}</p>
            </CardContent>
          </Card>
          <Card className="border-gray-200 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-violet-600" />
                </div>
                <span className="text-xs font-medium text-gray-500">Total CE</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{formatNumber(kpis.totalCE)}</p>
            </CardContent>
          </Card>
          <Card className="border-gray-200 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
                  <Users className="w-4 h-4 text-amber-600" />
                </div>
                <span className="text-xs font-medium text-gray-500">Eng. CP</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{formatNumber(kpis.totalEngCP)}</p>
            </CardContent>
          </Card>
          <Card className="border-gray-200 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-rose-600" />
                </div>
                <span className="text-xs font-medium text-gray-500">Paiements</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{formatNumber(kpis.totalPaiements)}</p>
            </CardContent>
          </Card>
          <Card className="border-gray-200 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-cyan-50 flex items-center justify-center">
                  <BarChart3 className="w-4 h-4 text-cyan-600" />
                </div>
                <span className="text-xs font-medium text-gray-500">Prévisions</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{formatNumber(kpis.totalPrevisions)}</p>
            </CardContent>
          </Card>
          <Card className="border-gray-200 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-indigo-600" />
                </div>
                <span className="text-xs font-medium text-gray-500">Taux Engagement</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{kpis.tauxEngagement.toFixed(1)}%</p>
              <p className="text-[10px] text-gray-400 mt-1">Eng. CP / Total CP</p>
            </CardContent>
          </Card>
          <Card className="border-gray-200 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-pink-50 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-pink-600" />
                </div>
                <span className="text-xs font-medium text-gray-500">Taux Paiement</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{kpis.tauxPaiement.toFixed(1)}%</p>
              <p className="text-[10px] text-gray-400 mt-1">Paiements / Eng. CP</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border-gray-200 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-gray-700">Prévisions Mensuelles</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlyPrevisions} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#6b7280' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} tickFormatter={v => formatNumber(v)} />
                  <Tooltip formatter={(value: number) => formatNumberFull(value)} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="Reports" fill="#10b981" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="Consolidés" fill="#f59e0b" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="Nouveaux" fill="#8b5cf6" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="border-gray-200 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-gray-700">Répartition par Groupe</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartByGroupe} margin={{ top: 10, right: 10, left: 0, bottom: 0 }} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis type="number" tick={{ fontSize: 11, fill: '#6b7280' }} tickFormatter={v => formatNumber(v)} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: '#6b7280' }} width={80} />
                  <Tooltip formatter={(value: number) => formatNumberFull(value)} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="cp" name="CP" fill="#10b981" radius={[0, 2, 2, 0]} />
                  <Bar dataKey="ce" name="CE" fill="#f59e0b" radius={[0, 2, 2, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="border-gray-200 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-gray-700">Répartition par Entité</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartByEntite} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#6b7280' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} tickFormatter={v => formatNumber(v)} />
                  <Tooltip formatter={(value: number) => formatNumberFull(value)} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="cp" name="CP" fill="#10b981" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="ce" name="CE" fill="#f59e0b" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="paiements" name="Paiements" fill="#ef4444" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="border-gray-200 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-gray-700">Source de Financement</CardTitle>
            </CardHeader>
            <CardContent className="pt-0 flex items-center justify-center">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieDataBySource}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    outerRadius={110}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieDataBySource.map((_entry, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatNumberFull(value)} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Tab Toggle */}
        <div className="flex items-center gap-2">
          <Button
            variant={activeTab === 'table' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveTab('table')}
            className={activeTab === 'table' ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
          >
            <BarChart3 className="w-4 h-4 mr-1.5" />
            Tableau de Données
          </Button>
          <Button
            variant={activeTab === 'charts' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveTab('charts')}
            className={activeTab === 'charts' ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
          >
            <TrendingUp className="w-4 h-4 mr-1.5" />
            Plus de Graphiques
          </Button>
        </div>

        {/* Data Table */}
        {activeTab === 'table' && (
          <Card className="border-gray-200 shadow-sm">
            <CardContent className="p-0">
              <ScrollArea className="w-full">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50/80 hover:bg-gray-50/80">
                      <TableHead className="text-xs font-semibold text-gray-600 w-10">#</TableHead>
                      <TableHead className="text-xs font-semibold text-gray-600 min-w-[80px]">Projet</TableHead>
                      <TableHead className="text-xs font-semibold text-gray-600 min-w-[90px]">Groupe</TableHead>
                      <TableHead className="text-xs font-semibold text-gray-600 min-w-[80px]">Source</TableHead>
                      <TableHead className="text-xs font-semibold text-gray-600 min-w-[60px]">Entité</TableHead>
                      <TableHead className="text-xs font-semibold text-gray-600 min-w-[120px]">N° Engagement</TableHead>
                      <TableHead className="text-xs font-semibold text-gray-600 min-w-[250px]">Désignation</TableHead>
                      <TableHead className="text-xs font-semibold text-gray-600 text-right min-w-[100px]">Total CP</TableHead>
                      <TableHead className="text-xs font-semibold text-gray-600 text-right min-w-[100px]">Total CE</TableHead>
                      <TableHead className="text-xs font-semibold text-gray-600 text-right min-w-[100px]">Eng. CP</TableHead>
                      <TableHead className="text-xs font-semibold text-gray-600 text-right min-w-[100px]">Paiements</TableHead>
                      <TableHead className="text-xs font-semibold text-gray-600 text-right min-w-[100px]">Prévisions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedData.map((row, idx) => (
                      <TableRow key={idx} className="hover:bg-emerald-50/30 transition-colors">
                        <TableCell className="text-xs text-gray-400 font-mono">
                          {(currentPage - 1) * rowsPerPage + idx + 1}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`text-xs ${row.PROJET === 'DIAEA' ? 'border-emerald-300 text-emerald-700 bg-emerald-50' : 'border-amber-300 text-amber-700 bg-amber-50'}`}>
                            {row.PROJET}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-gray-700">{row.GROUPE}</TableCell>
                        <TableCell className="text-xs text-gray-700">{row['SOURCE FINANCEMENT']}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-600">
                            {row.ENTITE}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-gray-600 font-mono">{row['N° ENGAGEMENT'] || '-'}</TableCell>
                        <TableCell className="text-xs text-gray-700 max-w-[300px] truncate" title={row['DETAIL DESIGNATION'] || ''}>
                          {row['DETAIL DESIGNATION'] || '-'}
                        </TableCell>
                        <TableCell className="text-xs text-right font-mono text-gray-700">{formatNumber(row['TOTAL CP'])}</TableCell>
                        <TableCell className="text-xs text-right font-mono text-gray-700">{formatNumber(row['TOTAL CE'])}</TableCell>
                        <TableCell className="text-xs text-right font-mono text-gray-700">{formatNumber(row['ENG CP TOTAL'])}</TableCell>
                        <TableCell className="text-xs text-right font-mono text-gray-700">{formatNumber(row['PAIEMENTS TOTAL'])}</TableCell>
                        <TableCell className="text-xs text-right font-mono font-semibold text-emerald-700">{formatNumber(row['TOTAL PREV'])}</TableCell>
                      </TableRow>
                    ))}
                    {paginatedData.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={12} className="text-center py-8 text-gray-400">
                          Aucune donnée trouvée pour les filtres sélectionnés
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>

              {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
                  <p className="text-xs text-gray-500">
                    Affichage {((currentPage - 1) * rowsPerPage) + 1} - {Math.min(currentPage * rowsPerPage, filteredData.length)} sur {filteredData.length} lignes
                  </p>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let page: number
                      if (totalPages <= 5) page = i + 1
                      else if (currentPage <= 3) page = i + 1
                      else if (currentPage >= totalPages - 2) page = totalPages - 4 + i
                      else page = currentPage - 2 + i
                      return (
                        <Button
                          key={page}
                          variant={currentPage === page ? 'default' : 'outline'}
                          size="icon"
                          className={`h-8 w-8 ${currentPage === page ? 'bg-emerald-600 hover:bg-emerald-700' : ''}`}
                          onClick={() => setCurrentPage(page)}
                        >
                          <span className="text-xs">{page}</span>
                        </Button>
                      )
                    })}
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {activeTab === 'charts' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-gray-200 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-gray-700">CP vs CE par Entité</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartByEntite} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#6b7280' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} tickFormatter={v => formatNumber(v)} />
                    <Tooltip formatter={(value: number) => formatNumberFull(value)} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="cp" name="Total CP" fill="#10b981" radius={[2, 2, 0, 0]} />
                    <Bar dataKey="ce" name="Total CE" fill="#f59e0b" radius={[2, 2, 0, 0]} />
                    <Bar dataKey="previsions" name="Prévisions" fill="#8b5cf6" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card className="border-gray-200 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-gray-700">Paiements vs Prévisions par Groupe</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartByGroupe} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#6b7280' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} tickFormatter={v => formatNumber(v)} />
                    <Tooltip formatter={(value: number) => formatNumberFull(value)} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="paiements" name="Paiements" fill="#ef4444" radius={[2, 2, 0, 0]} />
                    <Bar dataKey="previsions" name="Prévisions" fill="#8b5cf6" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-8 border-t border-gray-200 bg-white">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <p className="text-xs text-gray-400 text-center">
            Tableau de Bord - Suivi des Engagements Budgétaires | Actualisation automatique toutes les 30s
          </p>
        </div>
      </footer>
    </div>
  )
}
