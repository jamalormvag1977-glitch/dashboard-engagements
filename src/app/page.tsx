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
} from 'recharts'
import {
  Home,
  List,
  FolderOpen,
  FileText,
  Bell,
  BarChart3,
  Settings,
  Download,
  Search,
  Upload,
  RefreshCw,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  ChevronRight,
  ChevronDown,
  Menu,
  X,
  AlertTriangle,
  Info,
  Landmark,
  Scale,
  Wallet,
  TrendingUp,
  RotateCcw,
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

// Format number in millions with 1 decimal and M€ suffix (French format)
function formatMillions(value: number | null | undefined): string {
  if (value === null || value === undefined) return '-'
  const millions = value / 1e6
  return millions.toLocaleString('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + ' M\u202F€'
}

// Format number for table cells with French thousands separators
function formatTableCell(value: number | null | undefined): string {
  if (value === null || value === undefined) return '\u2014'
  if (value === 0) return '0'
  return value.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

// Format percentage with French comma decimal
function formatPercent(value: number): string {
  return value.toLocaleString('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + '%'
}

function formatDate(iso: string | null): string {
  if (!iso) return '-'
  const d = new Date(iso)
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

// Navigation items for sidebar
const NAV_ITEMS = [
  { key: 'overview', label: "Vue d'ensemble", icon: Home },
  { key: 'entity', label: 'Par entit\u00e9', icon: List },
  { key: 'program', label: 'Par programme', icon: FolderOpen },
  { key: 'project', label: 'Par projet', icon: FolderOpen },
  { key: 'engagements', label: 'D\u00e9tails engagements', icon: FileText },
  { key: 'ordonnancements', label: 'D\u00e9tails ordonnancements', icon: FileText },
  { key: 'alerts', label: 'Alertes', icon: Bell, hasBadge: true },
  { key: 'reports', label: 'Rapports', icon: BarChart3 },
  { key: 'settings', label: 'Param\u00e8tres', icon: Settings },
]

export default function Dashboard() {
  const [data, setData] = useState<DataRow[]>([])
  const [filters, setFilters] = useState<FilterData>({ projets: [], groupes: [], entites: [] })
  const [loading, setLoading] = useState(true)
  const [selectedProjet, setSelectedProjet] = useState<string>('all')
  const [selectedGroupe, setSelectedGroupe] = useState<string>('all')
  const [selectedEntite, setSelectedEntite] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [uploading, setUploading] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)
  const [refreshStatus, setRefreshStatus] = useState<'idle' | 'checking' | 'updated'>('idle')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [activeNav, setActiveNav] = useState('overview')
  const [expandedEntities, setExpandedEntities] = useState<Set<string>>(new Set())
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())

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
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Upload failed')
      }
      const result = await res.json()
      await fetchData(true)
      alert(`Fichier import\u00e9 avec succ\u00e8s ! ${result.count} lignes charg\u00e9es.`)
    } catch (err) {
      console.error('Upload error:', err)
      alert(`Erreur lors de l'import : ${(err as Error).message}`)
    } finally {
      setUploading(false)
      event.target.value = ''
    }
  }

  const handleResetFilters = () => {
    setSelectedProjet('all')
    setSelectedGroupe('all')
    setSelectedEntite('all')
    setSearchTerm('')
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
        const projet = (row.PROJET || '').toLowerCase()
        if (!designation.includes(search) && !engagement.includes(search) && !projet.includes(search)) return false
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
    const disponible = totalCP - totalEngCP
    return {
      totalCP, totalCE, totalPaiements, totalPrevisions, totalEngCP, totalEngCE,
      totalReports, totalConsolides, totalNouveaux, totalOrd, count: filteredData.length,
      tauxEngagement, tauxPaiement, tauxOrdonnement, disponible,
    }
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
      tauxOrdonnement: v.engCP > 0 ? (v.ord / v.engCP) * 100 : 0,
      tauxPaiement: v.engCP > 0 ? (v.paiements / v.engCP) * 100 : 0,
      disponible: v.cp - v.engCP,
    })).sort((a, b) => b.cp - a.cp)
  }, [filteredData])

  // Analysis by Group (Programme)
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
      tauxOrdonnement: v.engCP > 0 ? (v.ord / v.engCP) * 100 : 0,
      tauxPaiement: v.engCP > 0 ? (v.paiements / v.engCP) * 100 : 0,
      disponible: v.cp - v.engCP,
    })).sort((a, b) => {
      const numA = parseInt(a.name.replace(/\D/g, '')) || 0
      const numB = parseInt(b.name.replace(/\D/g, '')) || 0
      return numA - numB
    })
  }, [filteredData])

  // Top 5 Projects by TOTAL CP
  const topProjects = useMemo(() => {
    return [...filteredData]
      .filter(r => (r['TOTAL CP'] || 0) > 0)
      .sort((a, b) => (b['TOTAL CP'] || 0) - (a['TOTAL CP'] || 0))
      .slice(0, 5)
      .map(r => ({
        name: r.PROJET,
        cp: r['TOTAL CP'] || 0,
        engCP: r['ENG CP TOTAL'] || 0,
        ord: r['ORD TOTAL'] || 0,
        tauxEngagement: (r['TOTAL CP'] || 0) > 0 ? ((r['ENG CP TOTAL'] || 0) / r['TOTAL CP']) * 100 : 0,
        tauxOrdonnement: (r['ENG CP TOTAL'] || 0) > 0 ? ((r['ORD TOTAL'] || 0) / r['ENG CP TOTAL']) * 100 : 0,
        disponible: (r['TOTAL CP'] || 0) - (r['ENG CP TOTAL'] || 0),
      }))
  }, [filteredData])

  // Chart data for entity execution
  const chartDataByEntity = useMemo(() => {
    return analysisByEntity.map(e => ({
      name: e.name,
      Engagements: Math.round(e.engCP / 1e6 * 10) / 10,
      Ordonnancements: Math.round(e.ord / 1e6 * 10) / 10,
      'Budget LFI': Math.round(e.cp / 1e6 * 10) / 10,
    }))
  }, [analysisByEntity])

  // Chart data for programme execution
  const chartDataByProgramme = useMemo(() => {
    return analysisByGroup.map(g => ({
      name: g.name,
      Engagements: Math.round(g.engCP / 1e6 * 10) / 10,
      Ordonnancements: Math.round(g.ord / 1e6 * 10) / 10,
      'Budget LFI': Math.round(g.cp / 1e6 * 10) / 10,
    }))
  }, [analysisByGroup])

  // Chart data for top 5 projects
  const chartDataByProject = useMemo(() => {
    return topProjects.map(p => ({
      name: p.name.length > 25 ? p.name.substring(0, 25) + '...' : p.name,
      Engagements: Math.round(p.engCP / 1e6 * 10) / 10,
      Ordonnancements: Math.round(p.ord / 1e6 * 10) / 10,
      'Budget LFI': Math.round(p.cp / 1e6 * 10) / 10,
    }))
  }, [topProjects])

  // Alerts computation
  const alerts = useMemo(() => {
    const result: { type: 'danger' | 'warning' | 'info'; message: string; detail: string }[] = []

    // Faible taux d'engagement (entities with rate < 40%)
    analysisByEntity.forEach(e => {
      if (e.tauxEngagement < 40 && e.cp > 0) {
        result.push({
          type: 'danger',
          message: `Faible taux d'engagement - ${e.name}`,
          detail: `${formatPercent(e.tauxEngagement)} du budget engag\u00e9`,
        })
      }
    })

    // Retard d'ordonnancement (projects with gap > 20%)
    filteredData.forEach(r => {
      const engRate = (r['TOTAL CP'] || 0) > 0 ? ((r['ENG CP TOTAL'] || 0) / r['TOTAL CP']) * 100 : 0
      const ordRate = (r['ENG CP TOTAL'] || 0) > 0 ? ((r['ORD TOTAL'] || 0) / r['ENG CP TOTAL']) * 100 : 0
      if (engRate - ordRate > 20 && r['ENG CP TOTAL'] > 0) {
        result.push({
          type: 'warning',
          message: `Retard d'ordonnancement - ${r.PROJET}`,
          detail: `\u00c9cart de ${formatPercent(engRate - ordRate)} entre engagement et ordonnancement`,
        })
      }
    })

    // Consommation \u00e9lev\u00e9e (programme > 80% budget used)
    analysisByGroup.forEach(g => {
      const consumption = g.cp > 0 ? (g.ord / g.cp) * 100 : 0
      if (consumption > 80) {
        result.push({
          type: 'info',
          message: `Consommation \u00e9lev\u00e9e - ${g.name}`,
          detail: `${formatPercent(consumption)} du budget consomm\u00e9`,
        })
      }
    })

    // Donn\u00e9es \u00e0 v\u00e9rifier (projects with engagement but no ordonnancement)
    filteredData.forEach(r => {
      if ((r['ENG CP TOTAL'] || 0) > 0 && (r['ORD TOTAL'] || 0) === 0) {
        result.push({
          type: 'info',
          message: `Donn\u00e9es \u00e0 v\u00e9rifier - ${r.PROJET}`,
          detail: 'Engagement sans ordonnancement',
        })
      }
    })

    return result.slice(0, 8)
  }, [analysisByEntity, analysisByGroup, filteredData])

  // Detail table data grouped by Entity > Group > Project
  const detailTableData = useMemo(() => {
    const grouped: Record<string, Record<string, DataRow[]>> = {}
    filteredData.forEach(row => {
      const entity = row.ENTITE
      const group = row.GROUPE
      if (!grouped[entity]) grouped[entity] = {}
      if (!grouped[entity][group]) grouped[entity][group] = []
      grouped[entity][group].push(row)
    })

    const entities = Object.entries(grouped).map(([entityName, groups]) => {
      const entityCP = filteredData.filter(r => r.ENTITE === entityName).reduce((s, r) => s + (r['TOTAL CP'] || 0), 0)
      const entityEngCP = filteredData.filter(r => r.ENTITE === entityName).reduce((s, r) => s + (r['ENG CP TOTAL'] || 0), 0)
      const entityOrd = filteredData.filter(r => r.ENTITE === entityName).reduce((s, r) => s + (r['ORD TOTAL'] || 0), 0)

      const groupsData = Object.entries(groups).map(([groupName, rows]) => {
        const groupCP = rows.reduce((s, r) => s + (r['TOTAL CP'] || 0), 0)
        const groupEngCP = rows.reduce((s, r) => s + (r['ENG CP TOTAL'] || 0), 0)
        const groupOrd = rows.reduce((s, r) => s + (r['ORD TOTAL'] || 0), 0)

        const projects = rows.map(r => ({
          name: r.PROJET,
          cp: r['TOTAL CP'] || 0,
          engCP: r['ENG CP TOTAL'] || 0,
          ord: r['ORD TOTAL'] || 0,
          tauxEngagement: (r['TOTAL CP'] || 0) > 0 ? ((r['ENG CP TOTAL'] || 0) / r['TOTAL CP']) * 100 : 0,
          tauxOrdonnement: (r['ENG CP TOTAL'] || 0) > 0 ? ((r['ORD TOTAL'] || 0) / r['ENG CP TOTAL']) * 100 : 0,
          disponible: (r['TOTAL CP'] || 0) - (r['ENG CP TOTAL'] || 0),
        }))

        return {
          name: groupName,
          cp: groupCP,
          engCP: groupEngCP,
          ord: groupOrd,
          tauxEngagement: groupCP > 0 ? (groupEngCP / groupCP) * 100 : 0,
          tauxOrdonnement: groupEngCP > 0 ? (groupOrd / groupEngCP) * 100 : 0,
          disponible: groupCP - groupEngCP,
          projects,
        }
      })

      return {
        name: entityName,
        cp: entityCP,
        engCP: entityEngCP,
        ord: entityOrd,
        tauxEngagement: entityCP > 0 ? (entityEngCP / entityCP) * 100 : 0,
        tauxOrdonnement: entityEngCP > 0 ? (entityOrd / entityEngCP) * 100 : 0,
        disponible: entityCP - entityEngCP,
        groups: groupsData,
      }
    })

    return entities.sort((a, b) => b.cp - a.cp)
  }, [filteredData])

  const handleExport = () => {
    const headers = ['PROJET', 'GROUPE', 'SOURCE FINANCEMENT', 'NOMENCLATURE', 'N\u00b0 ENGAGEMENT', 'ENTITE', 'DETAIL DESIGNATION', 'TOTAL CP', 'TOTAL CE', 'PAIEMENTS TOTAL', 'TOTAL PREV']
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

  const toggleEntity = (entity: string) => {
    setExpandedEntities(prev => {
      const next = new Set(prev)
      if (next.has(entity)) next.delete(entity)
      else next.add(entity)
      return next
    })
  }

  const toggleGroup = (key: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
          <p className="text-gray-500 text-sm">Chargement des donn\u00e9es...</p>
        </div>
      </div>
    )
  }

  const alertCount = alerts.length

  // Sidebar component
  const Sidebar = () => (
    <div className="h-full flex flex-col bg-[#1e3a5f] text-white">
      {/* Logo Area */}
      <div className="px-5 py-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-white/10 rounded-lg flex items-center justify-center">
            <Landmark className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold leading-tight">Budget</h1>
            <h1 className="text-sm font-bold leading-tight">Investissement</h1>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1">
        <nav className="px-3 py-3 space-y-1">
          {NAV_ITEMS.map(item => {
            const Icon = item.icon
            return (
              <button
                key={item.key}
                onClick={() => setActiveNav(item.key)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  activeNav === item.key
                    ? 'bg-white/10 text-white font-medium'
                    : 'text-white/70 hover:bg-white/5 hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span className="flex-1 text-left">{item.label}</span>
                {item.hasBadge && alertCount > 0 && (
                  <Badge className="bg-red-500 text-white text-[10px] h-5 min-w-[20px] flex items-center justify-center px-1.5">
                    {alertCount}
                  </Badge>
                )}
              </button>
            )
          })}
        </nav>
      </ScrollArea>

      {/* Active Filters */}
      <div className="px-4 py-3 border-t border-white/10 space-y-2">
        <p className="text-[11px] font-semibold text-white/50 uppercase tracking-wider">Filtres actifs</p>
        <div className="flex flex-wrap gap-1.5">
          <Badge className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px]">
            Exercice : 2024
          </Badge>
          <Badge className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px]">
            P\u00e9riode : {new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
          </Badge>
          <Badge className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px]">
            Entit\u00e9 : {selectedEntite === 'all' ? 'Toutes' : selectedEntite}
          </Badge>
          <Badge className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px]">
            Programme : {selectedGroupe === 'all' ? 'Tous' : selectedGroupe}
          </Badge>
        </div>
      </div>

      {/* Last Updated */}
      <div className="px-4 py-3 border-t border-white/10">
        <div className="flex items-center gap-2 text-white/40 text-[11px]">
          <Clock className="w-3 h-3" />
          <span>MAJ : {formatDate(lastUpdated)}</span>
          {refreshStatus === 'checking' && (
            <RefreshCw className="w-3 h-3 animate-spin text-amber-400" />
          )}
          {refreshStatus === 'updated' && (
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
          )}
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-white flex">
      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:flex flex-col flex-shrink-0 transition-all duration-300 ${
          sidebarOpen ? 'w-[260px]' : 'w-0 overflow-hidden'
        }`}
      >
        <Sidebar />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileSidebarOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-[260px]">
            <Sidebar />
          </aside>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto min-w-0">
        {/* Top Header */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
          <div className="px-4 sm:px-6 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {/* Mobile menu button */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="lg:hidden h-8 w-8"
                  onClick={() => setMobileSidebarOpen(true)}
                >
                  <Menu className="w-5 h-5" />
                </Button>
                {/* Desktop sidebar toggle */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="hidden lg:flex h-8 w-8"
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                >
                  <Menu className="w-4 h-4" />
                </Button>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-gray-900">
                    Suivi d&apos;ex\u00e9cution du budget d&apos;investissement
                  </h2>
                  <p className="text-xs text-gray-500 hidden sm:block">
                    Vue consolid\u00e9e par entit\u00e9, programme et projet
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <label htmlFor="excel-upload">
                  <Button
                    className="bg-emerald-600 hover:bg-emerald-700 gap-1 cursor-pointer h-8 text-xs"
                    disabled={uploading}
                    asChild
                  >
                    <span>
                      <Upload className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">{uploading ? 'Import...' : 'Excel'}</span>
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
                <Button variant="outline" size="sm" onClick={handleExport} className="gap-1 h-8 text-xs">
                  <Download className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Exporter</span>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => fetchData(true)}
                  title="Actualiser"
                >
                  <RefreshCw className={`w-4 h-4 ${refreshStatus === 'checking' ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            </div>

            {/* Filter Bar */}
            <div className="flex flex-wrap items-center gap-2 mt-3">
              <Select value={selectedEntite} onValueChange={setSelectedEntite}>
                <SelectTrigger className="bg-white h-8 text-xs w-[140px]">
                  <SelectValue placeholder="Entit\u00e9" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les entit\u00e9s</SelectItem>
                  {filters.entites.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={selectedGroupe} onValueChange={setSelectedGroupe}>
                <SelectTrigger className="bg-white h-8 text-xs w-[150px]">
                  <SelectValue placeholder="Programme" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les programmes</SelectItem>
                  {filters.groupes.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={selectedProjet} onValueChange={setSelectedProjet}>
                <SelectTrigger className="bg-white h-8 text-xs w-[140px]">
                  <SelectValue placeholder="Projet" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les projets</SelectItem>
                  {filters.projets.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>
              <div className="relative w-[180px]">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <Input
                  placeholder="Rechercher..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-8 bg-white h-8 text-xs"
                />
              </div>
              <Button variant="ghost" size="sm" onClick={handleResetFilters} className="gap-1 h-8 text-xs text-gray-600">
                <RotateCcw className="w-3.5 h-3.5" />
                R\u00e9initialiser
              </Button>
              <Badge variant="secondary" className="bg-gray-100 text-gray-600 text-xs">
                {filteredData.length} lignes
              </Badge>
            </div>
          </div>
        </header>

        <div className="p-4 sm:p-6 space-y-6">
          {/* KPI Cards - Row 1 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Budget d'investissement (LFI) */}
            <Card className="border border-gray-100 shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                    <Scale className="w-5 h-5 text-blue-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-500">Budget d&apos;investissement (LFI)</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">{formatMillions(kpis.totalCP)}</p>
                <p className="text-xs text-gray-400 mt-1">100% du budget</p>
              </CardContent>
            </Card>

            {/* Engagements */}
            <Card className="border border-gray-100 shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-emerald-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-500">Engagements</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">{formatMillions(kpis.totalEngCP)}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {formatPercent(kpis.tauxEngagement)} du budget
                </p>
              </CardContent>
            </Card>

            {/* Taux d'engagement */}
            <Card className="border border-gray-100 shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${kpis.tauxEngagement >= 50 ? 'bg-emerald-50' : 'bg-blue-50'}`}>
                    {kpis.tauxEngagement >= 50 ? (
                      <ArrowUpRight className="w-5 h-5 text-emerald-600" />
                    ) : (
                      <ArrowDownRight className="w-5 h-5 text-blue-600" />
                    )}
                  </div>
                  <span className="text-sm font-medium text-gray-500">Taux d&apos;engagement</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">{formatPercent(kpis.tauxEngagement)}</p>
                <Badge className={`mt-1 text-xs ${
                  kpis.tauxEngagement >= 50
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-blue-50 text-blue-700 border-blue-200'
                }`}>
                  {kpis.tauxEngagement >= 50 ? (
                    <ArrowUpRight className="w-3 h-3 mr-1" />
                  ) : (
                    <ArrowDownRight className="w-3 h-3 mr-1" />
                  )}
                  {kpis.tauxEngagement >= 50 ? 'Bon' : '\u00c0 am\u00e9liorer'}
                </Badge>
              </CardContent>
            </Card>
          </div>

          {/* KPI Cards - Row 2 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Ordonnancements */}
            <Card className="border border-gray-100 shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                    <Wallet className="w-5 h-5 text-blue-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-500">Ordonnancements</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">{formatMillions(kpis.totalOrd)}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {kpis.totalCP > 0 ? formatPercent((kpis.totalOrd / kpis.totalCP) * 100) : '0,0%'} du budget
                </p>
              </CardContent>
            </Card>

            {/* Taux d'ordonnancement */}
            <Card className="border border-gray-100 shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${kpis.tauxOrdonnement >= 50 ? 'bg-emerald-50' : 'bg-blue-50'}`}>
                    {kpis.tauxOrdonnement >= 50 ? (
                      <ArrowUpRight className="w-5 h-5 text-emerald-600" />
                    ) : (
                      <ArrowDownRight className="w-5 h-5 text-blue-600" />
                    )}
                  </div>
                  <span className="text-sm font-medium text-gray-500">Taux d&apos;ordonnancement</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">{formatPercent(kpis.tauxOrdonnement)}</p>
                <Badge className={`mt-1 text-xs ${
                  kpis.tauxOrdonnement >= 50
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-blue-50 text-blue-700 border-blue-200'
                }`}>
                  {kpis.tauxOrdonnement >= 50 ? (
                    <ArrowUpRight className="w-3 h-3 mr-1" />
                  ) : (
                    <ArrowDownRight className="w-3 h-3 mr-1" />
                  )}
                  {kpis.tauxOrdonnement >= 50 ? 'Bon' : '\u00c0 am\u00e9liorer'}
                </Badge>
              </CardContent>
            </Card>

            {/* Disponible */}
            <Card className="border border-gray-100 shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-violet-50 flex items-center justify-center">
                    <Landmark className="w-5 h-5 text-violet-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-500">Disponible</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">{formatMillions(kpis.disponible)}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {kpis.totalCP > 0 ? formatPercent((kpis.disponible / kpis.totalCP) * 100) : '0,0%'} du budget
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Charts - Execution by Entity */}
          <Card className="border border-gray-100 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold text-gray-700">
                  Ex\u00e9cution par entit\u00e9 (en M\u202F\u20ac)
                </CardTitle>
                <button className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1">
                  Voir toutes les entit\u00e9s <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={chartDataByEntity.length * 50 + 30}>
                <BarChart data={chartDataByEntity} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: '#6b7280' }} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: '#374151' }} width={60} />
                  <Tooltip
                    formatter={(value: number) => `${value.toLocaleString('fr-FR', { minimumFractionDigits: 1 })} M\u202F\u20ac`}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="Engagements" fill="#10b981" radius={[0, 4, 4, 0]} barSize={12} />
                  <Bar dataKey="Ordonnancements" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={12} />
                  <Bar dataKey="Budget LFI" fill="#94a3b8" radius={[0, 4, 4, 0]} barSize={12} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Charts - Execution by Programme */}
          <Card className="border border-gray-100 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold text-gray-700">
                  Ex\u00e9cution par programme (en M\u202F\u20ac)
                </CardTitle>
                <button className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1">
                  Voir tous les programmes <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={chartDataByProgramme.length * 50 + 30}>
                <BarChart data={chartDataByProgramme} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: '#6b7280' }} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: '#374151' }} width={80} />
                  <Tooltip
                    formatter={(value: number) => `${value.toLocaleString('fr-FR', { minimumFractionDigits: 1 })} M\u202F\u20ac`}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="Engagements" fill="#10b981" radius={[0, 4, 4, 0]} barSize={12} />
                  <Bar dataKey="Ordonnancements" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={12} />
                  <Bar dataKey="Budget LFI" fill="#94a3b8" radius={[0, 4, 4, 0]} barSize={12} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Charts - Top 5 Projects */}
          <Card className="border border-gray-100 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold text-gray-700">
                  Ex\u00e9cution par projet (Top 5) (en M\u202F\u20ac)
                </CardTitle>
                <button className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1">
                  Voir tous les projets <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={chartDataByProject.length * 50 + 30}>
                <BarChart data={chartDataByProject} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: '#6b7280' }} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: '#374151' }} width={120} />
                  <Tooltip
                    formatter={(value: number) => `${value.toLocaleString('fr-FR', { minimumFractionDigits: 1 })} M\u202F\u20ac`}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="Engagements" fill="#10b981" radius={[0, 4, 4, 0]} barSize={12} />
                  <Bar dataKey="Ordonnancements" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={12} />
                  <Bar dataKey="Budget LFI" fill="#94a3b8" radius={[0, 4, 4, 0]} barSize={12} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Detail Table */}
          <Card className="border border-gray-100 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-gray-700">
                D\u00e9tail de l&apos;ex\u00e9cution
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead className="text-xs font-semibold text-gray-600 w-[300px]">Entit\u00e9 / Programme / Projet</TableHead>
                      <TableHead className="text-xs font-semibold text-gray-600 text-right">Budget (LFI) M\u202F\u20ac</TableHead>
                      <TableHead className="text-xs font-semibold text-gray-600 text-right">Engagements M\u202F\u20ac</TableHead>
                      <TableHead className="text-xs font-semibold text-gray-600 text-right">Taux eng. %</TableHead>
                      <TableHead className="text-xs font-semibold text-gray-600 text-right">Ordonn. M\u202F\u20ac</TableHead>
                      <TableHead className="text-xs font-semibold text-gray-600 text-right">Taux ord. %</TableHead>
                      <TableHead className="text-xs font-semibold text-gray-600 text-right">Disponible M\u202F\u20ac</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {detailTableData.map(entity => (
                      <EntityRow
                        key={entity.name}
                        entity={entity}
                        expanded={expandedEntities.has(entity.name)}
                        expandedGroups={expandedGroups}
                        onToggleEntity={() => toggleEntity(entity.name)}
                        onToggleGroup={toggleGroup}
                      />
                    ))}
                    {/* Total Row */}
                    <TableRow className="bg-gray-100 font-bold">
                      <TableCell className="text-xs font-bold text-gray-900">Total</TableCell>
                      <TableCell className="text-xs font-bold text-gray-900 text-right">{formatMillions(kpis.totalCP)}</TableCell>
                      <TableCell className="text-xs font-bold text-gray-900 text-right">{formatMillions(kpis.totalEngCP)}</TableCell>
                      <TableCell className="text-xs font-bold text-right">
                        <span className={kpis.tauxEngagement >= 50 ? 'text-emerald-600' : 'text-red-600'}>
                          {formatPercent(kpis.tauxEngagement)}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs font-bold text-gray-900 text-right">{formatMillions(kpis.totalOrd)}</TableCell>
                      <TableCell className="text-xs font-bold text-right">
                        <span className={kpis.tauxOrdonnement >= 40 ? 'text-blue-600' : 'text-orange-600'}>
                          {formatPercent(kpis.tauxOrdonnement)}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs font-bold text-gray-900 text-right">{formatMillions(kpis.disponible)}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Alerts Section */}
          <Card className="border border-gray-100 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  Alertes et points de vigilance
                </CardTitle>
                <button className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1">
                  Voir toutes <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </CardHeader>
            <CardContent>
              {alerts.length === 0 ? (
                <div className="text-center py-6 text-gray-400 text-sm">
                  Aucune alerte en cours
                </div>
              ) : (
                <div className="space-y-3">
                  {alerts.map((alert, idx) => (
                    <div key={idx} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                        alert.type === 'danger' ? 'bg-red-100' :
                        alert.type === 'warning' ? 'bg-amber-100' :
                        'bg-blue-100'
                      }`}>
                        {alert.type === 'danger' ? (
                          <AlertTriangle className="w-4 h-4 text-red-600" />
                        ) : alert.type === 'warning' ? (
                          <AlertTriangle className="w-4 h-4 text-amber-600" />
                        ) : (
                          <Info className="w-4 h-4 text-blue-600" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium ${
                          alert.type === 'danger' ? 'text-red-800' :
                          alert.type === 'warning' ? 'text-amber-800' :
                          'text-blue-800'
                        }`}>
                          {alert.message}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">{alert.detail}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}

// Entity Row Component for the detail table
function EntityRow({
  entity,
  expanded,
  expandedGroups,
  onToggleEntity,
  onToggleGroup,
}: {
  entity: {
    name: string
    cp: number
    engCP: number
    ord: number
    tauxEngagement: number
    tauxOrdonnement: number
    disponible: number
    groups: {
      name: string
      cp: number
      engCP: number
      ord: number
      tauxEngagement: number
      tauxOrdonnement: number
      disponible: number
      projects: {
        name: string
        cp: number
        engCP: number
        ord: number
        tauxEngagement: number
        tauxOrdonnement: number
        disponible: number
      }[]
    }[]
  }
  expanded: boolean
  expandedGroups: Set<string>
  onToggleEntity: () => void
  onToggleGroup: (key: string) => void
}) {
  return (
    <>
      <TableRow className="bg-white hover:bg-gray-50 cursor-pointer" onClick={onToggleEntity}>
        <TableCell className="text-xs font-semibold text-gray-900">
          <div className="flex items-center gap-2">
            {expanded ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
            {entity.name}
          </div>
        </TableCell>
        <TableCell className="text-xs text-gray-700 text-right">{formatMillions(entity.cp)}</TableCell>
        <TableCell className="text-xs text-gray-700 text-right">{formatMillions(entity.engCP)}</TableCell>
        <TableCell className="text-xs text-right">
          <span className={entity.tauxEngagement >= 50 ? 'text-emerald-600 font-medium' : 'text-red-600 font-medium'}>
            {formatPercent(entity.tauxEngagement)}
          </span>
        </TableCell>
        <TableCell className="text-xs text-gray-700 text-right">{formatMillions(entity.ord)}</TableCell>
        <TableCell className="text-xs text-right">
          <span className={entity.tauxOrdonnement >= 40 ? 'text-blue-600 font-medium' : 'text-orange-600 font-medium'}>
            {formatPercent(entity.tauxOrdonnement)}
          </span>
        </TableCell>
        <TableCell className="text-xs text-gray-700 text-right">{formatMillions(entity.disponible)}</TableCell>
      </TableRow>

      {expanded && entity.groups.map(group => {
        const groupKey = `${entity.name}-${group.name}`
        const isGroupExpanded = expandedGroups.has(groupKey)
        return (
          <GroupRow
            key={groupKey}
            group={group}
            entityName={entity.name}
            expanded={isGroupExpanded}
            onToggle={() => onToggleGroup(groupKey)}
          />
        )
      })}
    </>
  )
}

// Group Row Component
function GroupRow({
  group,
  entityName,
  expanded,
  onToggle,
}: {
  group: {
    name: string
    cp: number
    engCP: number
    ord: number
    tauxEngagement: number
    tauxOrdonnement: number
    disponible: number
    projects: {
      name: string
      cp: number
      engCP: number
      ord: number
      tauxEngagement: number
      tauxOrdonnement: number
      disponible: number
    }[]
  }
  entityName: string
  expanded: boolean
  onToggle: () => void
}) {
  return (
    <>
      <TableRow className="bg-gray-50/50 hover:bg-gray-100/50 cursor-pointer" onClick={onToggle}>
        <TableCell className="text-xs font-medium text-gray-700 pl-8">
          <div className="flex items-center gap-2">
            {expanded ? <ChevronDown className="w-3.5 h-3.5 text-gray-400" /> : <ChevronRight className="w-3.5 h-3.5 text-gray-400" />}
            {group.name}
          </div>
        </TableCell>
        <TableCell className="text-xs text-gray-600 text-right">{formatMillions(group.cp)}</TableCell>
        <TableCell className="text-xs text-gray-600 text-right">{formatMillions(group.engCP)}</TableCell>
        <TableCell className="text-xs text-right">
          <span className={group.tauxEngagement >= 50 ? 'text-emerald-600' : 'text-red-600'}>
            {formatPercent(group.tauxEngagement)}
          </span>
        </TableCell>
        <TableCell className="text-xs text-gray-600 text-right">{formatMillions(group.ord)}</TableCell>
        <TableCell className="text-xs text-right">
          <span className={group.tauxOrdonnement >= 40 ? 'text-blue-600' : 'text-orange-600'}>
            {formatPercent(group.tauxOrdonnement)}
          </span>
        </TableCell>
        <TableCell className="text-xs text-gray-600 text-right">{formatMillions(group.disponible)}</TableCell>
      </TableRow>

      {expanded && group.projects.map(project => (
        <TableRow key={`${entityName}-${group.name}-${project.name}`} className="bg-white hover:bg-gray-50">
          <TableCell className="text-xs text-gray-500 pl-14">
            {project.name}
          </TableCell>
          <TableCell className="text-xs text-gray-500 text-right">{formatMillions(project.cp)}</TableCell>
          <TableCell className="text-xs text-gray-500 text-right">{formatMillions(project.engCP)}</TableCell>
          <TableCell className="text-xs text-right">
            <span className={project.tauxEngagement >= 50 ? 'text-emerald-600' : 'text-red-600'}>
              {formatPercent(project.tauxEngagement)}
            </span>
          </TableCell>
          <TableCell className="text-xs text-gray-500 text-right">{formatMillions(project.ord)}</TableCell>
          <TableCell className="text-xs text-right">
            <span className={project.tauxOrdonnement >= 40 ? 'text-blue-600' : 'text-orange-600'}>
              {formatPercent(project.tauxOrdonnement)}
            </span>
          </TableCell>
          <TableCell className="text-xs text-gray-500 text-right">{formatMillions(project.disponible)}</TableCell>
        </TableRow>
      ))}
    </>
  )
}
