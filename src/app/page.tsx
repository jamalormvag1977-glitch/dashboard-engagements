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
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
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
  TrendingDown,
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
  AlertTriangle,
  Target,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  PieChart as PieChartIcon,
  Activity,
  Shield,
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

const ENTITY_COLORS: Record<string, string> = {
  DGR: '#10b981',
  DAM: '#3b82f6',
  DDA: '#f59e0b',
  DPF: '#8b5cf6',
  DRH: '#ec4899',
  SAI: '#06b6d4',
  SMG: '#f97316',
}

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

function getRateColor(rate: number): string {
  if (rate >= 80) return 'text-emerald-600'
  if (rate >= 50) return 'text-amber-600'
  return 'text-red-600'
}

function getRateBg(rate: number): string {
  if (rate >= 80) return 'bg-emerald-500'
  if (rate >= 50) return 'bg-amber-500'
  return 'bg-red-500'
}

function getRateBadge(rate: number): string {
  if (rate >= 80) return 'bg-emerald-50 text-emerald-700 border-emerald-200'
  if (rate >= 50) return 'bg-amber-50 text-amber-700 border-amber-200'
  return 'bg-red-50 text-red-700 border-red-200'
}

function RateIcon({ rate }: { rate: number }) {
  if (rate >= 80) return <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600" />
  if (rate >= 50) return <Minus className="w-3.5 h-3.5 text-amber-600" />
  return <ArrowDownRight className="w-3.5 h-3.5 text-red-600" />
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
  const [leftPanelOpen, setLeftPanelOpen] = useState(true)
  const [rightPanelOpen, setRightPanelOpen] = useState(true)
  const rowsPerPage = 15

  const handleProjetChange = (value: string) => { setSelectedProjet(value); setCurrentPage(1) }
  const handleGroupeChange = (value: string) => { setSelectedGroupe(value); setCurrentPage(1) }
  const handleEntiteChange = (value: string) => { setSelectedEntite(value); setCurrentPage(1) }
  const handleSearchChange = (value: string) => { setSearchTerm(value); setCurrentPage(1) }

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

  useEffect(() => { fetchData() }, [fetchData])

  useEffect(() => {
    const interval = setInterval(() => { fetchData(true) }, 30000)
    return () => clearInterval(interval)
  }, [fetchData])

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      if (!res.ok) { const err = await res.json(); throw new Error(err.error || 'Upload failed') }
      const result = await res.json()
      await fetchData(true)
      alert(`Fichier importé avec succès ! ${result.count} lignes chargées.`)
    } catch (err) {
      console.error('Upload error:', err)
      alert(`Erreur lors de l'import : ${(err as Error).message}`)
    } finally {
      setUploading(false)
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
    const totalReports = filteredData.reduce((sum, r) => sum + (r['REPORTS'] || 0), 0)
    const totalConsolides = filteredData.reduce((sum, r) => sum + (r['CONSOLIDES'] || 0), 0)
    const totalNouveaux = filteredData.reduce((sum, r) => sum + (r['NOUVEAUX'] || 0), 0)
    const totalOrd = filteredData.reduce((sum, r) => sum + (r['ORD TOTAL'] || 0), 0)
    const tauxEngagement = totalCP > 0 ? (totalEngCP / totalCP) * 100 : 0
    const tauxPaiement = totalEngCP > 0 ? (totalPaiements / totalEngCP) * 100 : 0
    const tauxOrdonnement = totalEngCP > 0 ? (totalOrd / totalEngCP) * 100 : 0
    const tauxPrevRealise = totalPrevisions > 0 ? (totalPaiements / totalPrevisions) * 100 : 0
    return { totalCP, totalCE, totalPaiements, totalPrevisions, totalEngCP, totalEngCE, totalReports, totalConsolides, totalNouveaux, totalOrd, count: filteredData.length, tauxEngagement, tauxPaiement, tauxOrdonnement, tauxPrevRealise }
  }, [filteredData])

  // Analysis by Entity
  const analysisByEntity = useMemo(() => {
    const entities: Record<string, { cp: number; ce: number; engCP: number; paiements: number; previsions: number; count: number; ord: number }> = {}
    filteredData.forEach(row => {
      const e = row.ENTITE
      if (!entities[e]) entities[e] = { cp: 0, ce: 0, engCP: 0, paiements: 0, previsions: 0, count: 0, ord: 0 }
      entities[e].cp += row['TOTAL CP'] || 0
      entities[e].ce += row['TOTAL CE'] || 0
      entities[e].engCP += row['ENG CP TOTAL'] || 0
      entities[e].paiements += row['PAIEMENTS TOTAL'] || 0
      entities[e].previsions += row['TOTAL PREV'] || 0
      entities[e].count += 1
      entities[e].ord += row['ORD TOTAL'] || 0
    })
    return Object.entries(entities).map(([name, v]) => ({
      name,
      ...v,
      tauxEngagement: v.cp > 0 ? (v.engCP / v.cp) * 100 : 0,
      tauxPaiement: v.engCP > 0 ? (v.paiements / v.engCP) * 100 : 0,
      tauxOrdonnement: v.engCP > 0 ? (v.ord / v.engCP) * 100 : 0,
      partCP: kpis.totalCP > 0 ? (v.cp / kpis.totalCP) * 100 : 0,
    })).sort((a, b) => b.cp - a.cp)
  }, [filteredData, kpis.totalCP])

  // Analysis by Group
  const analysisByGroup = useMemo(() => {
    const groups: Record<string, { cp: number; ce: number; engCP: number; paiements: number; previsions: number; count: number; ord: number }> = {}
    filteredData.forEach(row => {
      const g = row.GROUPE
      if (!groups[g]) groups[g] = { cp: 0, ce: 0, engCP: 0, paiements: 0, previsions: 0, count: 0, ord: 0 }
      groups[g].cp += row['TOTAL CP'] || 0
      groups[g].ce += row['TOTAL CE'] || 0
      groups[g].engCP += row['ENG CP TOTAL'] || 0
      groups[g].paiements += row['PAIEMENTS TOTAL'] || 0
      groups[g].previsions += row['TOTAL PREV'] || 0
      groups[g].count += 1
      groups[g].ord += row['ORD TOTAL'] || 0
    })
    return Object.entries(groups).map(([name, v]) => ({
      name,
      ...v,
      tauxEngagement: v.cp > 0 ? (v.engCP / v.cp) * 100 : 0,
      tauxPaiement: v.engCP > 0 ? (v.paiements / v.engCP) * 100 : 0,
      tauxOrdonnement: v.engCP > 0 ? (v.ord / v.engCP) * 100 : 0,
      partCP: kpis.totalCP > 0 ? (v.cp / kpis.totalCP) * 100 : 0,
    })).sort((a, b) => {
      const numA = parseInt(a.name.replace(/\D/g, '')) || 0
      const numB = parseInt(b.name.replace(/\D/g, '')) || 0
      return numA - numB
    })
  }, [filteredData, kpis.totalCP])

  // Top Engagements by CP amount
  const topEngagements = useMemo(() => {
    return [...filteredData]
      .filter(r => (r['TOTAL CP'] || 0) > 0)
      .sort((a, b) => (b['TOTAL CP'] || 0) - (a['TOTAL CP'] || 0))
      .slice(0, 8)
      .map(r => ({
        designation: (r['DETAIL DESIGNATION'] || '').substring(0, 45) + ((r['DETAIL DESIGNATION'] || '').length > 45 ? '...' : ''),
        fullDesignation: r['DETAIL DESIGNATION'] || '',
        nEngagement: r['N° ENGAGEMENT'] || '-',
        entite: r.ENTITE,
        cp: r['TOTAL CP'] || 0,
        engCP: r['ENG CP TOTAL'] || 0,
        paiements: r['PAIEMENTS TOTAL'] || 0,
        tauxEngagement: (r['TOTAL CP'] || 0) > 0 ? ((r['ENG CP TOTAL'] || 0) / r['TOTAL CP']) * 100 : 0,
        tauxPaiement: (r['ENG CP TOTAL'] || 0) > 0 ? ((r['PAIEMENTS TOTAL'] || 0) / r['ENG CP TOTAL']) * 100 : 0,
      }))
  }, [filteredData])

  // Alerts / Performance warnings
  const alerts = useMemo(() => {
    const result: { type: 'danger' | 'warning' | 'info'; message: string; value: string }[] = []
    if (kpis.tauxEngagement < 30) {
      result.push({ type: 'danger', message: "Taux d'engagement très faible", value: `${kpis.tauxEngagement.toFixed(1)}%` })
    } else if (kpis.tauxEngagement < 50) {
      result.push({ type: 'warning', message: "Taux d'engagement insuffisant", value: `${kpis.tauxEngagement.toFixed(1)}%` })
    }
    if (kpis.tauxPaiement < 30) {
      result.push({ type: 'danger', message: 'Taux de paiement critique', value: `${kpis.tauxPaiement.toFixed(1)}%` })
    } else if (kpis.tauxPaiement < 50) {
      result.push({ type: 'warning', message: 'Taux de paiement faible', value: `${kpis.tauxPaiement.toFixed(1)}%` })
    }
    const notEngaged = kpis.totalCP - kpis.totalEngCP
    if (notEngaged > 0 && kpis.totalCP > 0) {
      result.push({ type: 'info', message: 'CP non engagés', value: formatNumber(notEngaged) })
    }
    const notPaid = kpis.totalEngCP - kpis.totalPaiements
    if (notPaid > 0 && kpis.totalEngCP > 0) {
      result.push({ type: 'info', message: 'Engagements non payés', value: formatNumber(notPaid) })
    }
    if (kpis.tauxEngagement >= 80 && kpis.tauxPaiement >= 80) {
      result.push({ type: 'info', message: 'Performance globale satisfaisante', value: '' })
    }
    analysisByEntity.forEach(e => {
      if (e.tauxPaiement < 20 && e.engCP > 0) {
        result.push({ type: 'warning', message: `${e.name}: paiement très faible`, value: `${e.tauxPaiement.toFixed(0)}%` })
      }
    })
    return result
  }, [kpis, analysisByEntity])

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
      { key: 'JANVIER', label: 'Jan' }, { key: 'FEVRIER', label: 'Fév' }, { key: 'MARS', label: 'Mar' },
      { key: 'AVRIL', label: 'Avr' }, { key: 'MAI', label: 'Mai' }, { key: 'JUIN', label: 'Jun' },
      { key: 'JUILLET', label: 'Jul' }, { key: 'AOUT', label: 'Aoû' }, { key: 'SEPTEMBRE', label: 'Sep' },
      { key: 'OCTOBRE', label: 'Oct' }, { key: 'NOVEMBRE', label: 'Nov' }, { key: 'DECEMBRE', label: 'Déc' },
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
    <div className="min-h-screen bg-gray-50/50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-4 h-4 text-white" />
              </div>
              <div>
                <h1 className="text-base font-bold text-gray-900">Tableau de Bord - Engagements</h1>
                <div className="flex items-center gap-2 text-[11px] text-gray-500">
                  <Clock className="w-3 h-3" />
                  <span>MAJ : {formatDate(lastUpdated)}</span>
                  {refreshStatus === 'checking' && (
                    <span className="text-amber-600 flex items-center gap-1">
                      <RefreshCw className="w-3 h-3 animate-spin" />
                    </span>
                  )}
                  {refreshStatus === 'updated' && (
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs">
                {filteredData.length} lignes
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                className={`h-7 text-xs ${leftPanelOpen ? 'bg-emerald-50 text-emerald-700' : ''}`}
                onClick={() => setLeftPanelOpen(!leftPanelOpen)}
              >
                <Activity className="w-3.5 h-3.5 mr-1" />
                Analyse
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className={`h-7 text-xs ${rightPanelOpen ? 'bg-emerald-50 text-emerald-700' : ''}`}
                onClick={() => setRightPanelOpen(!rightPanelOpen)}
              >
                <Target className="w-3.5 h-3.5 mr-1" />
                Détails
              </Button>
              <label htmlFor="excel-upload">
                <Button className="bg-emerald-600 hover:bg-emerald-700 gap-1 cursor-pointer h-7 text-xs" disabled={uploading} asChild>
                  <span>
                    <Upload className="w-3.5 h-3.5" />
                    {uploading ? 'Import...' : 'Excel'}
                  </span>
                </Button>
              </label>
              <input id="excel-upload" type="file" accept=".xlsx,.xls" className="hidden" onChange={handleFileUpload} disabled={uploading} />
              <Button variant="outline" size="sm" onClick={handleExport} className="gap-1 h-7 text-xs">
                <Download className="w-3.5 h-3.5" /> CSV
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => fetchData(true)} title="Actualiser">
                <RefreshCw className={`w-3.5 h-3.5 ${refreshStatus === 'checking' ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Filters Bar */}
      <div className="bg-white border-b border-gray-100">
        <div className="px-4 sm:px-6 lg:px-8 py-2.5">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <Filter className="w-3.5 h-3.5" />
              <span className="font-medium">Filtres</span>
            </div>
            <div className="flex items-center gap-2 flex-1">
              <Select value={selectedProjet} onValueChange={handleProjetChange}>
                <SelectTrigger className="bg-white h-8 text-xs w-[130px]">
                  <SelectValue placeholder="Projet" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les projets</SelectItem>
                  {filters.projets.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={selectedGroupe} onValueChange={handleGroupeChange}>
                <SelectTrigger className="bg-white h-8 text-xs w-[140px]">
                  <SelectValue placeholder="Groupe" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les groupes</SelectItem>
                  {filters.groupes.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={selectedEntite} onValueChange={handleEntiteChange}>
                <SelectTrigger className="bg-white h-8 text-xs w-[130px]">
                  <SelectValue placeholder="Entité" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les entités</SelectItem>
                  {filters.entites.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}
                </SelectContent>
              </Select>
              <div className="relative flex-1 max-w-xs">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <Input placeholder="Rechercher..." value={searchTerm} onChange={e => handleSearchChange(e.target.value)} className="pl-7 bg-white h-8 text-xs" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Layout with Side Panels */}
      <div className="flex flex-1 overflow-hidden">
        {/* LEFT PANEL - Analyse */}
        {leftPanelOpen && (
          <aside className="w-[300px] min-w-[300px] bg-white border-r border-gray-200 overflow-y-auto">
            <div className="p-3 space-y-3">
              {/* Analyse par Entité */}
              <Card className="border-gray-200 shadow-none">
                <CardHeader className="px-3 pt-3 pb-2">
                  <CardTitle className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-emerald-600" />
                    Analyse par Entité
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-3 pb-3 space-y-2.5">
                  {analysisByEntity.map(entity => (
                    <div key={entity.name} className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: ENTITY_COLORS[entity.name] || '#6b7280' }} />
                          <span className="text-xs font-medium text-gray-700">{entity.name}</span>
                          <span className="text-[10px] text-gray-400">{entity.count} lignes</span>
                        </div>
                        <span className="text-[11px] font-semibold text-gray-600">{formatNumber(entity.cp)}</span>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-gray-400">Engagement</span>
                          <span className={`text-[10px] font-semibold ${getRateColor(entity.tauxEngagement)}`}>
                            {entity.tauxEngagement.toFixed(1)}%
                          </span>
                        </div>
                        <Progress value={Math.min(entity.tauxEngagement, 100)} className="h-1.5" />
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-gray-400">Paiement</span>
                          <span className={`text-[10px] font-semibold ${getRateColor(entity.tauxPaiement)}`}>
                            {entity.tauxPaiement.toFixed(1)}%
                          </span>
                        </div>
                        <Progress value={Math.min(entity.tauxPaiement, 100)} className="h-1.5" />
                      </div>
                      <Separator className="bg-gray-100" />
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Analyse par Groupe */}
              <Card className="border-gray-200 shadow-none">
                <CardHeader className="px-3 pt-3 pb-2">
                  <CardTitle className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-amber-600" />
                    Analyse par Groupe
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-3 pb-3 space-y-2">
                  {analysisByGroup.map(group => (
                    <div key={group.name} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-medium text-gray-700">{group.name}</span>
                          <span className="text-[10px] text-gray-400">({group.count})</span>
                        </div>
                        <span className="text-[11px] font-semibold text-gray-600">{formatNumber(group.cp)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-0.5">
                            <span className="text-[10px] text-gray-400">Eng.</span>
                            <span className={`text-[10px] font-semibold ${getRateColor(group.tauxEngagement)}`}>{group.tauxEngagement.toFixed(1)}%</span>
                          </div>
                          <Progress value={Math.min(group.tauxEngagement, 100)} className="h-1" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-0.5">
                            <span className="text-[10px] text-gray-400">Paie.</span>
                            <span className={`text-[10px] font-semibold ${getRateColor(group.tauxPaiement)}`}>{group.tauxPaiement.toFixed(1)}%</span>
                          </div>
                          <Progress value={Math.min(group.tauxPaiement, 100)} className="h-1" />
                        </div>
                      </div>
                      <Separator className="bg-gray-100" />
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Répartition Budgétaire */}
              <Card className="border-gray-200 shadow-none">
                <CardHeader className="px-3 pt-3 pb-2">
                  <CardTitle className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                    <Wallet className="w-3.5 h-3.5 text-violet-600" />
                    Structure Budgétaire
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-3 pb-3 space-y-2">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-gray-600">Reports</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] font-semibold text-gray-700">{formatNumber(kpis.totalReports)}</span>
                        <span className="text-[10px] text-gray-400">({kpis.totalCP > 0 ? ((kpis.totalReports / kpis.totalCP) * 100).toFixed(1) : 0}%)</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-gray-600">Consolidés</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] font-semibold text-gray-700">{formatNumber(kpis.totalConsolides)}</span>
                        <span className="text-[10px] text-gray-400">({kpis.totalCP > 0 ? ((kpis.totalConsolides / kpis.totalCP) * 100).toFixed(1) : 0}%)</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-gray-600">Nouveaux</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] font-semibold text-gray-700">{formatNumber(kpis.totalNouveaux)}</span>
                        <span className="text-[10px] text-gray-400">({kpis.totalCP > 0 ? ((kpis.totalNouveaux / kpis.totalCP) * 100).toFixed(1) : 0}%)</span>
                      </div>
                    </div>
                  </div>
                  <Separator className="bg-gray-100" />
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-medium text-gray-700">CP non engagés</span>
                    <span className="text-[11px] font-semibold text-amber-600">{formatNumber(kpis.totalCP - kpis.totalEngCP)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-medium text-gray-700">Eng. non payés</span>
                    <span className="text-[11px] font-semibold text-red-600">{formatNumber(kpis.totalEngCP - kpis.totalPaiements)}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </aside>
        )}

        {/* CENTER - Main Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 sm:p-6 space-y-5">
            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              <Card className="border-gray-200 shadow-sm">
                <CardContent className="p-3">
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center">
                      <FileText className="w-3.5 h-3.5 text-emerald-600" />
                    </div>
                    <span className="text-[11px] font-medium text-gray-500">Lignes</span>
                  </div>
                  <p className="text-xl font-bold text-gray-900">{kpis.count}</p>
                </CardContent>
              </Card>
              <Card className="border-gray-200 shadow-sm">
                <CardContent className="p-3">
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center">
                      <Building2 className="w-3.5 h-3.5 text-blue-600" />
                    </div>
                    <span className="text-[11px] font-medium text-gray-500">Total CP</span>
                  </div>
                  <p className="text-xl font-bold text-gray-900">{formatNumber(kpis.totalCP)}</p>
                </CardContent>
              </Card>
              <Card className="border-gray-200 shadow-sm">
                <CardContent className="p-3">
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="w-7 h-7 rounded-lg bg-violet-50 flex items-center justify-center">
                      <TrendingUp className="w-3.5 h-3.5 text-violet-600" />
                    </div>
                    <span className="text-[11px] font-medium text-gray-500">Total CE</span>
                  </div>
                  <p className="text-xl font-bold text-gray-900">{formatNumber(kpis.totalCE)}</p>
                </CardContent>
              </Card>
              <Card className="border-gray-200 shadow-sm">
                <CardContent className="p-3">
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center">
                      <Shield className="w-3.5 h-3.5 text-amber-600" />
                    </div>
                    <span className="text-[11px] font-medium text-gray-500">Eng. CP</span>
                  </div>
                  <p className="text-xl font-bold text-gray-900">{formatNumber(kpis.totalEngCP)}</p>
                  <div className="mt-1 flex items-center gap-1.5">
                    <div className={`text-[11px] font-semibold px-1.5 py-0.5 rounded ${getRateBadge(kpis.tauxEngagement)}`}>
                      {kpis.tauxEngagement.toFixed(1)}%
                    </div>
                    <span className="text-[10px] text-gray-400">taux eng.</span>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-gray-200 shadow-sm">
                <CardContent className="p-3">
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="w-7 h-7 rounded-lg bg-rose-50 flex items-center justify-center">
                      <Wallet className="w-3.5 h-3.5 text-rose-600" />
                    </div>
                    <span className="text-[11px] font-medium text-gray-500">Paiements</span>
                  </div>
                  <p className="text-xl font-bold text-gray-900">{formatNumber(kpis.totalPaiements)}</p>
                  <div className="mt-1 flex items-center gap-1.5">
                    <div className={`text-[11px] font-semibold px-1.5 py-0.5 rounded ${getRateBadge(kpis.tauxPaiement)}`}>
                      {kpis.tauxPaiement.toFixed(1)}%
                    </div>
                    <span className="text-[10px] text-gray-400">taux paie.</span>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-gray-200 shadow-sm">
                <CardContent className="p-3">
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="w-7 h-7 rounded-lg bg-cyan-50 flex items-center justify-center">
                      <BarChart3 className="w-3.5 h-3.5 text-cyan-600" />
                    </div>
                    <span className="text-[11px] font-medium text-gray-500">Prévisions</span>
                  </div>
                  <p className="text-xl font-bold text-gray-900">{formatNumber(kpis.totalPrevisions)}</p>
                  <div className="mt-1 flex items-center gap-1.5">
                    <div className={`text-[11px] font-semibold px-1.5 py-0.5 rounded ${getRateBadge(kpis.tauxPrevRealise)}`}>
                      {kpis.tauxPrevRealise.toFixed(1)}%
                    </div>
                    <span className="text-[10px] text-gray-400">réalisé</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <Card className="border-gray-200 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-semibold text-gray-700">Prévisions Mensuelles</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={monthlyPrevisions} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#6b7280' }} />
                      <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} tickFormatter={v => formatNumber(v)} />
                      <Tooltip formatter={(value: number) => formatNumberFull(value)} />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      <Bar dataKey="Reports" fill="#10b981" radius={[2, 2, 0, 0]} />
                      <Bar dataKey="Consolidés" fill="#f59e0b" radius={[2, 2, 0, 0]} />
                      <Bar dataKey="Nouveaux" fill="#8b5cf6" radius={[2, 2, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="border-gray-200 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-semibold text-gray-700">Répartition par Groupe</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={chartByGroupe} margin={{ top: 10, right: 10, left: 0, bottom: 0 }} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis type="number" tick={{ fontSize: 10, fill: '#6b7280' }} tickFormatter={v => formatNumber(v)} />
                      <YAxis dataKey="name" type="category" tick={{ fontSize: 10, fill: '#6b7280' }} width={80} />
                      <Tooltip formatter={(value: number) => formatNumberFull(value)} />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      <Bar dataKey="cp" name="CP" fill="#10b981" radius={[0, 2, 2, 0]} />
                      <Bar dataKey="ce" name="CE" fill="#f59e0b" radius={[0, 2, 2, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="border-gray-200 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-semibold text-gray-700">Répartition par Entité</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={chartByEntite} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#6b7280' }} />
                      <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} tickFormatter={v => formatNumber(v)} />
                      <Tooltip formatter={(value: number) => formatNumberFull(value)} />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      <Bar dataKey="cp" name="CP" fill="#10b981" radius={[2, 2, 0, 0]} />
                      <Bar dataKey="ce" name="CE" fill="#f59e0b" radius={[2, 2, 0, 0]} />
                      <Bar dataKey="paiements" name="Paiements" fill="#ef4444" radius={[2, 2, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="border-gray-200 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-semibold text-gray-700">Source de Financement</CardTitle>
                </CardHeader>
                <CardContent className="pt-0 flex items-center justify-center">
                  <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                      <Pie
                        data={pieDataBySource}
                        cx="50%"
                        cy="50%"
                        labelLine={true}
                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                        outerRadius={90}
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
              <Button variant={activeTab === 'table' ? 'default' : 'outline'} size="sm" onClick={() => setActiveTab('table')} className={activeTab === 'table' ? 'bg-emerald-600 hover:bg-emerald-700' : ''}>
                <BarChart3 className="w-3.5 h-3.5 mr-1" /> Tableau
              </Button>
              <Button variant={activeTab === 'charts' ? 'default' : 'outline'} size="sm" onClick={() => setActiveTab('charts')} className={activeTab === 'charts' ? 'bg-emerald-600 hover:bg-emerald-700' : ''}>
                <TrendingUp className="w-3.5 h-3.5 mr-1" /> Graphiques
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
                          <TableHead className="text-[11px] font-semibold text-gray-600 w-10">#</TableHead>
                          <TableHead className="text-[11px] font-semibold text-gray-600 min-w-[70px]">Projet</TableHead>
                          <TableHead className="text-[11px] font-semibold text-gray-600 min-w-[80px]">Groupe</TableHead>
                          <TableHead className="text-[11px] font-semibold text-gray-600 min-w-[70px]">Source</TableHead>
                          <TableHead className="text-[11px] font-semibold text-gray-600 min-w-[55px]">Entité</TableHead>
                          <TableHead className="text-[11px] font-semibold text-gray-600 min-w-[110px]">N° Eng.</TableHead>
                          <TableHead className="text-[11px] font-semibold text-gray-600 min-w-[220px]">Désignation</TableHead>
                          <TableHead className="text-[11px] font-semibold text-gray-600 text-right min-w-[90px]">Total CP</TableHead>
                          <TableHead className="text-[11px] font-semibold text-gray-600 text-right min-w-[90px]">Total CE</TableHead>
                          <TableHead className="text-[11px] font-semibold text-gray-600 text-right min-w-[90px]">Eng. CP</TableHead>
                          <TableHead className="text-[11px] font-semibold text-gray-600 text-right min-w-[90px]">Paiements</TableHead>
                          <TableHead className="text-[11px] font-semibold text-gray-600 text-right min-w-[90px]">Prévisions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedData.map((row, idx) => (
                          <TableRow key={idx} className="hover:bg-emerald-50/30 transition-colors">
                            <TableCell className="text-[11px] text-gray-400 font-mono">{(currentPage - 1) * rowsPerPage + idx + 1}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className={`text-[10px] ${row.PROJET === 'DIAEA' ? 'border-emerald-300 text-emerald-700 bg-emerald-50' : 'border-amber-300 text-amber-700 bg-amber-50'}`}>{row.PROJET}</Badge>
                            </TableCell>
                            <TableCell className="text-[11px] text-gray-700">{row.GROUPE}</TableCell>
                            <TableCell className="text-[11px] text-gray-700">{row['SOURCE FINANCEMENT']}</TableCell>
                            <TableCell><Badge variant="secondary" className="text-[10px] bg-gray-100 text-gray-600">{row.ENTITE}</Badge></TableCell>
                            <TableCell className="text-[11px] text-gray-600 font-mono">{row['N° ENGAGEMENT'] || '-'}</TableCell>
                            <TableCell className="text-[11px] text-gray-700 max-w-[280px] truncate" title={row['DETAIL DESIGNATION'] || ''}>{row['DETAIL DESIGNATION'] || '-'}</TableCell>
                            <TableCell className="text-[11px] text-right font-mono text-gray-700">{formatNumber(row['TOTAL CP'])}</TableCell>
                            <TableCell className="text-[11px] text-right font-mono text-gray-700">{formatNumber(row['TOTAL CE'])}</TableCell>
                            <TableCell className="text-[11px] text-right font-mono text-gray-700">{formatNumber(row['ENG CP TOTAL'])}</TableCell>
                            <TableCell className="text-[11px] text-right font-mono text-gray-700">{formatNumber(row['PAIEMENTS TOTAL'])}</TableCell>
                            <TableCell className="text-[11px] text-right font-mono font-semibold text-emerald-700">{formatNumber(row['TOTAL PREV'])}</TableCell>
                          </TableRow>
                        ))}
                        {paginatedData.length === 0 && (
                          <TableRow><TableCell colSpan={12} className="text-center py-8 text-gray-400 text-xs">Aucune donnée trouvée</TableCell></TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between px-4 py-2.5 border-t border-gray-200">
                      <p className="text-[11px] text-gray-500">
                        {((currentPage - 1) * rowsPerPage) + 1} - {Math.min(currentPage * rowsPerPage, filteredData.length)} sur {filteredData.length}
                      </p>
                      <div className="flex items-center gap-1">
                        <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}><ChevronLeft className="w-3.5 h-3.5" /></Button>
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          let page: number
                          if (totalPages <= 5) page = i + 1
                          else if (currentPage <= 3) page = i + 1
                          else if (currentPage >= totalPages - 2) page = totalPages - 4 + i
                          else page = currentPage - 2 + i
                          return <Button key={page} variant={currentPage === page ? 'default' : 'outline'} size="icon" className={`h-7 w-7 ${currentPage === page ? 'bg-emerald-600 hover:bg-emerald-700' : ''}`} onClick={() => setCurrentPage(page)}><span className="text-[11px]">{page}</span></Button>
                        })}
                        <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}><ChevronRight className="w-3.5 h-3.5" /></Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {activeTab === 'charts' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <Card className="border-gray-200 shadow-sm">
                  <CardHeader className="pb-2"><CardTitle className="text-xs font-semibold text-gray-700">CP vs CE par Entité</CardTitle></CardHeader>
                  <CardContent className="pt-0">
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart data={chartByEntite} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#6b7280' }} />
                        <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} tickFormatter={v => formatNumber(v)} />
                        <Tooltip formatter={(value: number) => formatNumberFull(value)} />
                        <Legend wrapperStyle={{ fontSize: 11 }} />
                        <Bar dataKey="cp" name="Total CP" fill="#10b981" radius={[2, 2, 0, 0]} />
                        <Bar dataKey="ce" name="Total CE" fill="#f59e0b" radius={[2, 2, 0, 0]} />
                        <Bar dataKey="previsions" name="Prévisions" fill="#8b5cf6" radius={[2, 2, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
                <Card className="border-gray-200 shadow-sm">
                  <CardHeader className="pb-2"><CardTitle className="text-xs font-semibold text-gray-700">Paiements vs Prévisions par Groupe</CardTitle></CardHeader>
                  <CardContent className="pt-0">
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart data={chartByGroupe} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#6b7280' }} />
                        <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} tickFormatter={v => formatNumber(v)} />
                        <Tooltip formatter={(value: number) => formatNumberFull(value)} />
                        <Legend wrapperStyle={{ fontSize: 11 }} />
                        <Bar dataKey="paiements" name="Paiements" fill="#ef4444" radius={[2, 2, 0, 0]} />
                        <Bar dataKey="previsions" name="Prévisions" fill="#8b5cf6" radius={[2, 2, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </main>

        {/* RIGHT PANEL - Details & Performance */}
        {rightPanelOpen && (
          <aside className="w-[300px] min-w-[300px] bg-white border-l border-gray-200 overflow-y-auto">
            <div className="p-3 space-y-3">
              {/* Global Performance */}
              <Card className="border-gray-200 shadow-none">
                <CardHeader className="px-3 pt-3 pb-2">
                  <CardTitle className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                    <Target className="w-3.5 h-3.5 text-emerald-600" />
                    Performance Globale
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-3 pb-3 space-y-3">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-gray-600">Taux d&apos;engagement</span>
                      <div className="flex items-center gap-1">
                        <RateIcon rate={kpis.tauxEngagement} />
                        <span className={`text-xs font-bold ${getRateColor(kpis.tauxEngagement)}`}>{kpis.tauxEngagement.toFixed(1)}%</span>
                      </div>
                    </div>
                    <Progress value={Math.min(kpis.tauxEngagement, 100)} className="h-2" />
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-gray-600">Taux de paiement</span>
                      <div className="flex items-center gap-1">
                        <RateIcon rate={kpis.tauxPaiement} />
                        <span className={`text-xs font-bold ${getRateColor(kpis.tauxPaiement)}`}>{kpis.tauxPaiement.toFixed(1)}%</span>
                      </div>
                    </div>
                    <Progress value={Math.min(kpis.tauxPaiement, 100)} className="h-2" />
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-gray-600">Taux d&apos;ordonnancement</span>
                      <div className="flex items-center gap-1">
                        <RateIcon rate={kpis.tauxOrdonnement} />
                        <span className={`text-xs font-bold ${getRateColor(kpis.tauxOrdonnement)}`}>{kpis.tauxOrdonnement.toFixed(1)}%</span>
                      </div>
                    </div>
                    <Progress value={Math.min(kpis.tauxOrdonnement, 100)} className="h-2" />
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-gray-600">Prévisions réalisées</span>
                      <div className="flex items-center gap-1">
                        <RateIcon rate={kpis.tauxPrevRealise} />
                        <span className={`text-xs font-bold ${getRateColor(kpis.tauxPrevRealise)}`}>{kpis.tauxPrevRealise.toFixed(1)}%</span>
                      </div>
                    </div>
                    <Progress value={Math.min(kpis.tauxPrevRealise, 100)} className="h-2" />
                  </div>
                </CardContent>
              </Card>

              {/* Alerts */}
              <Card className="border-gray-200 shadow-none">
                <CardHeader className="px-3 pt-3 pb-2">
                  <CardTitle className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                    Alertes & Observations
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-3 pb-3 space-y-1.5">
                  {alerts.length === 0 ? (
                    <p className="text-[11px] text-gray-400 text-center py-2">Aucune alerte</p>
                  ) : alerts.map((alert, i) => (
                    <div key={i} className={`flex items-start gap-2 p-2 rounded-md text-[11px] ${
                      alert.type === 'danger' ? 'bg-red-50' : alert.type === 'warning' ? 'bg-amber-50' : 'bg-emerald-50'
                    }`}>
                      {alert.type === 'danger' ? <ArrowDownRight className="w-3.5 h-3.5 text-red-500 mt-0.5 shrink-0" /> :
                       alert.type === 'warning' ? <AlertTriangle className="w-3.5 h-3.5 text-amber-500 mt-0.5 shrink-0" /> :
                       <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" />}
                      <div className="flex-1">
                        <span className={`font-medium ${alert.type === 'danger' ? 'text-red-700' : alert.type === 'warning' ? 'text-amber-700' : 'text-emerald-700'}`}>
                          {alert.message}
                        </span>
                        {alert.value && <span className="ml-1 font-bold">{alert.value}</span>}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Top Engagements */}
              <Card className="border-gray-200 shadow-none">
                <CardHeader className="px-3 pt-3 pb-2">
                  <CardTitle className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5 text-violet-600" />
                    Top Engagements
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-3 pb-3 space-y-2">
                  {topEngagements.map((eng, i) => (
                    <div key={i} className="space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="text-[10px] font-bold text-gray-400 w-4 shrink-0">{i + 1}</span>
                          <div className="min-w-0">
                            <p className="text-[11px] text-gray-700 truncate" title={eng.fullDesignation}>{eng.designation}</p>
                            <div className="flex items-center gap-1 mt-0.5">
                              <Badge variant="secondary" className="text-[9px] h-4 bg-gray-100 text-gray-500">{eng.entite}</Badge>
                              <span className="text-[9px] text-gray-400 font-mono">{eng.nEngagement}</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-[11px] font-semibold text-gray-700">{formatNumber(eng.cp)}</p>
                          <div className="flex items-center gap-1 justify-end">
                            <span className={`text-[9px] font-semibold ${getRateColor(eng.tauxEngagement)}`}>E:{eng.tauxEngagement.toFixed(0)}%</span>
                            <span className={`text-[9px] font-semibold ${getRateColor(eng.tauxPaiement)}`}>P:{eng.tauxPaiement.toFixed(0)}%</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-1 ml-5">
                        <div className="flex-1">
                          <Progress value={Math.min(eng.tauxEngagement, 100)} className="h-1" />
                        </div>
                        <div className="flex-1">
                          <Progress value={Math.min(eng.tauxPaiement, 100)} className="h-1" />
                        </div>
                      </div>
                      <Separator className="bg-gray-100" />
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Comparative Summary */}
              <Card className="border-gray-200 shadow-none">
                <CardHeader className="px-3 pt-3 pb-2">
                  <CardTitle className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                    <PieChartIcon className="w-3.5 h-3.5 text-cyan-600" />
                    Résumé Comparatif
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-3 pb-3 space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-emerald-50 rounded-lg p-2 text-center">
                      <p className="text-[10px] text-emerald-600 font-medium">CP Engagés</p>
                      <p className="text-sm font-bold text-emerald-700">{formatNumber(kpis.totalEngCP)}</p>
                    </div>
                    <div className="bg-red-50 rounded-lg p-2 text-center">
                      <p className="text-[10px] text-red-600 font-medium">CP Non Engagés</p>
                      <p className="text-sm font-bold text-red-700">{formatNumber(kpis.totalCP - kpis.totalEngCP)}</p>
                    </div>
                    <div className="bg-emerald-50 rounded-lg p-2 text-center">
                      <p className="text-[10px] text-emerald-600 font-medium">Payés</p>
                      <p className="text-sm font-bold text-emerald-700">{formatNumber(kpis.totalPaiements)}</p>
                    </div>
                    <div className="bg-amber-50 rounded-lg p-2 text-center">
                      <p className="text-[10px] text-amber-600 font-medium">En Attente</p>
                      <p className="text-sm font-bold text-amber-700">{formatNumber(kpis.totalEngCP - kpis.totalPaiements)}</p>
                    </div>
                  </div>
                  <Separator className="bg-gray-100" />
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-gray-600">CP / CE Ratio</span>
                      <span className="text-[11px] font-semibold text-gray-700">
                        {kpis.totalCE > 0 ? (kpis.totalCP / kpis.totalCE).toFixed(2) : '-'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-gray-600">Ordonnancements</span>
                      <span className="text-[11px] font-semibold text-gray-700">{formatNumber(kpis.totalOrd)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-gray-600">Reste à payer</span>
                      <span className="text-[11px] font-semibold text-amber-600">{formatNumber(kpis.totalEngCP - kpis.totalPaiements)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </aside>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white">
        <div className="px-4 py-2.5">
          <p className="text-[10px] text-gray-400 text-center">
            Tableau de Bord - Suivi des Engagements Budgétaires | Actualisation automatique 30s
          </p>
        </div>
      </footer>
    </div>
  )
}
