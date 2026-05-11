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
import { Progress } from '@/components/ui/progress'
import { Switch } from '@/components/ui/switch'
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
  ChevronLeft,
  Menu,
  X,
  AlertTriangle,
  Info,
  Landmark,
  Scale,
  Wallet,
  TrendingUp,
  RotateCcw,
  Database,
  PieChartIcon,
  FileSpreadsheet,
  Zap,
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

// Format number in millions with 1 decimal and M\u202F\u20ac suffix (French format)
function formatMillions(value: number | null | undefined): string {
  if (value === null || value === undefined) return '-'
  const millions = value / 1e6
  return millions.toLocaleString('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + ' M\u202F\u20ac'
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

// Color helper for taux
function tauxColor(value: number): string {
  if (value >= 80) return 'text-emerald-600'
  if (value >= 50) return 'text-amber-600'
  return 'text-red-600'
}

function tauxBgColor(value: number): string {
  if (value >= 80) return 'bg-emerald-500'
  if (value >= 50) return 'bg-amber-500'
  return 'bg-red-500'
}

// Navigation items for sidebar
const NAV_ITEMS = [
  { key: 'overview', label: "Vue d'ensemble", icon: Home },
  { key: 'entity', label: 'Par entit\u00e9', icon: List },
  { key: 'program', label: 'Par projet', icon: FolderOpen },
  { key: 'project', label: 'Par programme', icon: FolderOpen },
  { key: 'engagements', label: 'D\u00e9tails engagements', icon: FileText },
  { key: 'ordonnancements', label: 'D\u00e9tails ordonnancements', icon: FileText },
  { key: 'alerts', label: 'Alertes', icon: Bell, hasBadge: true },
  { key: 'reports', label: 'Rapports', icon: BarChart3 },
  { key: 'settings', label: 'Param\u00e8tres', icon: Settings },
]

const PIE_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']

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
  // New state for views
  const [engPage, setEngPage] = useState(1)
  const [ordPage, setOrdPage] = useState(1)
  const [projectPage, setProjectPage] = useState(1)
  const [projectSearch, setProjectSearch] = useState('')
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [refreshInterval, setRefreshInterval] = useState(30)
  const [numberFormat, setNumberFormat] = useState<'millions' | 'full'>('millions')
  const [defaultPage, setDefaultPage] = useState('overview')

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
    if (!autoRefresh) return
    const interval = setInterval(() => { fetchData(true) }, refreshInterval * 1000)
    return () => clearInterval(interval)
  }, [fetchData, autoRefresh, refreshInterval])

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
        name: r.PROJET || 'Sans nom',
        cp: r['TOTAL CP'] || 0,
        engCP: r['ENG CP TOTAL'] || 0,
        ord: r['ORD TOTAL'] || 0,
        tauxEngagement: (r['TOTAL CP'] || 0) > 0 ? ((r['ENG CP TOTAL'] || 0) / (r['TOTAL CP'] || 0)) * 100 : 0,
        tauxOrdonnement: (r['ENG CP TOTAL'] || 0) > 0 ? ((r['ORD TOTAL'] || 0) / (r['ENG CP TOTAL'] || 0)) * 100 : 0,
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
      name: (p.name || '').length > 25 ? (p.name || '').substring(0, 25) + '...' : (p.name || 'Sans nom'),
      Engagements: Math.round(p.engCP / 1e6 * 10) / 10,
      Ordonnancements: Math.round(p.ord / 1e6 * 10) / 10,
      'Budget LFI': Math.round(p.cp / 1e6 * 10) / 10,
    }))
  }, [topProjects])

  // Alerts computation (limited for overview)
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
      const engRate = (r['TOTAL CP'] || 0) > 0 ? ((r['ENG CP TOTAL'] || 0) / (r['TOTAL CP'] || 0)) * 100 : 0
      const ordRate = (r['ENG CP TOTAL'] || 0) > 0 ? ((r['ORD TOTAL'] || 0) / (r['ENG CP TOTAL'] || 0)) * 100 : 0
      if (engRate - ordRate > 20 && (r['ENG CP TOTAL'] || 0) > 0) {
        result.push({
          type: 'warning',
          message: `Retard d'ordonnancement - ${r.PROJET || 'Sans nom'}`,
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
          message: `Donn\u00e9es \u00e0 v\u00e9rifier - ${r.PROJET || 'Sans nom'}`,
          detail: 'Engagement sans ordonnancement',
        })
      }
    })

    return result.slice(0, 8)
  }, [analysisByEntity, analysisByGroup, filteredData])

  // All alerts (no limit) for the alerts view
  const allAlerts = useMemo(() => {
    const result: { type: 'danger' | 'warning' | 'info'; message: string; detail: string; date?: string }[] = []

    analysisByEntity.forEach(e => {
      if (e.tauxEngagement < 40 && e.cp > 0) {
        result.push({
          type: 'danger',
          message: `Faible taux d'engagement - ${e.name}`,
          detail: `${formatPercent(e.tauxEngagement)} du budget engag\u00e9`,
          date: lastUpdated || undefined,
        })
      }
    })

    filteredData.forEach(r => {
      const engRate = (r['TOTAL CP'] || 0) > 0 ? ((r['ENG CP TOTAL'] || 0) / (r['TOTAL CP'] || 0)) * 100 : 0
      const ordRate = (r['ENG CP TOTAL'] || 0) > 0 ? ((r['ORD TOTAL'] || 0) / (r['ENG CP TOTAL'] || 0)) * 100 : 0
      if (engRate - ordRate > 20 && (r['ENG CP TOTAL'] || 0) > 0) {
        result.push({
          type: 'warning',
          message: `Retard d'ordonnancement - ${r.PROJET || 'Sans nom'}`,
          detail: `\u00c9cart de ${formatPercent(engRate - ordRate)} entre engagement et ordonnancement`,
          date: lastUpdated || undefined,
        })
      }
    })

    analysisByGroup.forEach(g => {
      const consumption = g.cp > 0 ? (g.ord / g.cp) * 100 : 0
      if (consumption > 80) {
        result.push({
          type: 'info',
          message: `Consommation \u00e9lev\u00e9e - ${g.name}`,
          detail: `${formatPercent(consumption)} du budget consomm\u00e9`,
          date: lastUpdated || undefined,
        })
      }
    })

    filteredData.forEach(r => {
      if ((r['ENG CP TOTAL'] || 0) > 0 && (r['ORD TOTAL'] || 0) === 0) {
        result.push({
          type: 'info',
          message: `Donn\u00e9es \u00e0 v\u00e9rifier - ${r.PROJET || 'Sans nom'}`,
          detail: 'Engagement sans ordonnancement',
          date: lastUpdated || undefined,
        })
      }
    })

    return result
  }, [analysisByEntity, analysisByGroup, filteredData, lastUpdated])

  // Engagement breakdown
  const engagementBreakdown = useMemo(() => {
    const engReports = filteredData.reduce((s, r) => s + (r['ENG REPORT'] || 0), 0)
    const engConsolides = filteredData.reduce((s, r) => s + (r['ENG CONSOLIDES'] || 0), 0)
    const engNouveaux = filteredData.reduce((s, r) => s + (r['ENG NOUVEAUX'] || 0), 0)
    const total = engReports + engConsolides + engNouveaux
    return {
      engReports,
      engConsolides,
      engNouveaux,
      total,
      pctReports: total > 0 ? (engReports / total) * 100 : 0,
      pctConsolides: total > 0 ? (engConsolides / total) * 100 : 0,
      pctNouveaux: total > 0 ? (engNouveaux / total) * 100 : 0,
    }
  }, [filteredData])

  // Ordonnancement breakdown
  const ordonnancementBreakdown = useMemo(() => {
    const ordReports = filteredData.reduce((s, r) => s + (r['ORD REPORTS'] || 0), 0)
    const ordConsolides = filteredData.reduce((s, r) => s + (r['ORD CONSOLIDES'] || 0), 0)
    const ordNouveaux = filteredData.reduce((s, r) => s + (r['ORD NOUVEAUX'] || 0), 0)
    const total = ordReports + ordConsolides + ordNouveaux
    return {
      ordReports,
      ordConsolides,
      ordNouveaux,
      total,
      pctReports: total > 0 ? (ordReports / total) * 100 : 0,
      pctConsolides: total > 0 ? (ordConsolides / total) * 100 : 0,
      pctNouveaux: total > 0 ? (ordNouveaux / total) * 100 : 0,
    }
  }, [filteredData])

  // Source financement data
  const sourceFinancementData = useMemo(() => {
    const sources: Record<string, { cp: number; engCP: number; ord: number; count: number }> = {}
    filteredData.forEach(row => {
      const s = row['SOURCE FINANCEMENT'] || 'Non sp\u00e9cifi\u00e9'
      if (!sources[s]) sources[s] = { cp: 0, engCP: 0, ord: 0, count: 0 }
      sources[s].cp += row['TOTAL CP'] || 0
      sources[s].engCP += row['ENG CP TOTAL'] || 0
      sources[s].ord += row['ORD TOTAL'] || 0
      sources[s].count += 1
    })
    return Object.entries(sources).map(([name, v]) => ({
      name,
      ...v,
      tauxEngagement: v.cp > 0 ? (v.engCP / v.cp) * 100 : 0,
      tauxOrdonnement: v.engCP > 0 ? (v.ord / v.engCP) * 100 : 0,
    })).sort((a, b) => b.cp - a.cp)
  }, [filteredData])

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
          name: r.PROJET || 'Sans nom',
          cp: r['TOTAL CP'] || 0,
          engCP: r['ENG CP TOTAL'] || 0,
          ord: r['ORD TOTAL'] || 0,
          tauxEngagement: (r['TOTAL CP'] || 0) > 0 ? ((r['ENG CP TOTAL'] || 0) / (r['TOTAL CP'] || 0)) * 100 : 0,
          tauxOrdonnement: (r['ENG CP TOTAL'] || 0) > 0 ? ((r['ORD TOTAL'] || 0) / (r['ENG CP TOTAL'] || 0)) * 100 : 0,
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

  // Budget structure pie chart data
  const budgetStructureData = useMemo(() => [
    { name: 'Reports', value: Math.round(kpis.totalReports / 1e6 * 10) / 10 },
    { name: 'Consolid\u00e9s', value: Math.round(kpis.totalConsolides / 1e6 * 10) / 10 },
    { name: 'Nouveaux', value: Math.round(kpis.totalNouveaux / 1e6 * 10) / 10 },
  ], [kpis])

  // Projects data for project view
  const allProjectsData = useMemo(() => {
    return [...filteredData]
      .sort((a, b) => (b['TOTAL CP'] || 0) - (a['TOTAL CP'] || 0))
      .map(r => ({
        name: r.PROJET || 'Sans nom',
        projet: r.GROUPE || 'Non classé',
        entite: r.ENTITE || 'Non défini',
        cp: r['TOTAL CP'] || 0,
        engCP: r['ENG CP TOTAL'] || 0,
        ord: r['ORD TOTAL'] || 0,
        tauxEngagement: (r['TOTAL CP'] || 0) > 0 ? ((r['ENG CP TOTAL'] || 0) / (r['TOTAL CP'] || 0)) * 100 : 0,
        tauxOrdonnement: (r['ENG CP TOTAL'] || 0) > 0 ? ((r['ORD TOTAL'] || 0) / (r['ENG CP TOTAL'] || 0)) * 100 : 0,
        disponible: (r['TOTAL CP'] || 0) - (r['ENG CP TOTAL'] || 0),
      }))
  }, [filteredData])

  // Filtered projects for project view
  const filteredProjects = useMemo(() => {
    if (!projectSearch) return allProjectsData
    const s = projectSearch.toLowerCase()
    return allProjectsData.filter(p => p.name.toLowerCase().includes(s))
  }, [allProjectsData, projectSearch])

  // Engagement lines for engagement view
  const engagementLines = useMemo(() => {
    return [...filteredData]
      .filter(r => (r['ENG CP TOTAL'] || 0) > 0)
      .sort((a, b) => (b['ENG CP TOTAL'] || 0) - (a['ENG CP TOTAL'] || 0))
      .map(r => ({
        numEngagement: r['N° ENGAGEMENT'] || '-',
        designation: r['DETAIL DESIGNATION'] || '-',
        entite: r.ENTITE,
        projet: r.GROUPE,
        engReports: r['ENG REPORT'] || 0,
        engConsolides: r['ENG CONSOLIDES'] || 0,
        engNouveaux: r['ENG NOUVEAUX'] || 0,
        engCPTotal: r['ENG CP TOTAL'] || 0,
        tauxEngagement: (r['TOTAL CP'] || 0) > 0 ? ((r['ENG CP TOTAL'] || 0) / (r['TOTAL CP'] || 0)) * 100 : 0,
      }))
  }, [filteredData])

  // Ordonnancement lines for ordonnancement view
  const ordonnancementLines = useMemo(() => {
    return [...filteredData]
      .filter(r => (r['ORD TOTAL'] || 0) > 0)
      .sort((a, b) => (b['ORD TOTAL'] || 0) - (a['ORD TOTAL'] || 0))
      .map(r => ({
        numEngagement: r['N° ENGAGEMENT'] || '-',
        designation: r['DETAIL DESIGNATION'] || '-',
        entite: r.ENTITE,
        projet: r.GROUPE,
        ordReports: r['ORD REPORTS'] || 0,
        ordConsolides: r['ORD CONSOLIDES'] || 0,
        ordNouveaux: r['ORD NOUVEAUX'] || 0,
        ordTotal: r['ORD TOTAL'] || 0,
        tauxOrdonnement: (r['ENG CP TOTAL'] || 0) > 0 ? ((r['ORD TOTAL'] || 0) / (r['ENG CP TOTAL'] || 0)) * 100 : 0,
      }))
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

  // Reset page when changing nav
  const handleNavChange = (key: string) => {
    setActiveNav(key)
    setEngPage(1)
    setOrdPage(1)
    setProjectPage(1)
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

  const alertCount = allAlerts.length

  // Pagination helper
  const paginate = (items: unknown[], page: number, perPage: number) => {
    const start = (page - 1) * perPage
    return items.slice(start, start + perPage)
  }

  const totalPages = (total: number, perPage: number) => Math.max(1, Math.ceil(total / perPage))

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
                onClick={() => handleNavChange(item.key)}
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
            Projet : {selectedGroupe === 'all' ? 'Tous' : selectedGroupe}
          </Badge>
          <Badge className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px]">
            Programme : {selectedProjet === 'all' ? 'Tous' : selectedProjet}
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

  // ==================== VIEW RENDERERS ====================

  const renderOverview = () => (
    <>
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
            <button onClick={() => handleNavChange('entity')} className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1">
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

      {/* Charts - Execution by Projet */}
      <Card className="border border-gray-100 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold text-gray-700">
              Ex\u00e9cution par projet (en M\u202F\u20ac)
            </CardTitle>
            <button onClick={() => handleNavChange('program')} className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1">
              Voir tous les projets <ChevronRight className="w-3 h-3" />
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
              Ex\u00e9cution par programme (Top 5) (en M\u202F\u20ac)
            </CardTitle>
            <button onClick={() => handleNavChange('project')} className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1">
              Voir tous les programmes <ChevronRight className="w-3 h-3" />
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
                  <TableHead className="text-xs font-semibold text-gray-600 w-[300px]">Entit\u00e9 / Projet / Programme</TableHead>
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
            <button onClick={() => handleNavChange('alerts')} className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1">
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
    </>
  )

  const renderEntityView = () => {
    const entityTotalBudget = analysisByEntity.reduce((s, e) => s + e.cp, 0)
    const entityAvgEng = analysisByEntity.length > 0 ? analysisByEntity.reduce((s, e) => s + e.tauxEngagement, 0) / analysisByEntity.length : 0
    const entityAvgOrd = analysisByEntity.length > 0 ? analysisByEntity.reduce((s, e) => s + e.tauxOrdonnement, 0) / analysisByEntity.length : 0

    return (
      <>
        <h2 className="text-lg font-bold text-gray-900">Analyse par Entit\u00e9</h2>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="border border-gray-100 shadow-sm">
            <CardContent className="p-4">
              <span className="text-xs font-medium text-gray-500">Total Budget</span>
              <p className="text-xl font-bold text-gray-900 mt-1">{formatMillions(entityTotalBudget)}</p>
            </CardContent>
          </Card>
          <Card className="border border-gray-100 shadow-sm">
            <CardContent className="p-4">
              <span className="text-xs font-medium text-gray-500">Taux engagement moyen</span>
              <p className={`text-xl font-bold mt-1 ${tauxColor(entityAvgEng)}`}>{formatPercent(entityAvgEng)}</p>
            </CardContent>
          </Card>
          <Card className="border border-gray-100 shadow-sm">
            <CardContent className="p-4">
              <span className="text-xs font-medium text-gray-500">Taux ordonnancement moyen</span>
              <p className={`text-xl font-bold mt-1 ${tauxColor(entityAvgOrd)}`}>{formatPercent(entityAvgOrd)}</p>
            </CardContent>
          </Card>
        </div>

        {/* Chart */}
        <Card className="border border-gray-100 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-gray-700">
              Budget / Engagements / Ordonnancements par entit\u00e9 (en M\u202F\u20ac)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={chartDataByEntity.length * 50 + 30}>
              <BarChart data={chartDataByEntity} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#6b7280' }} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: '#374151' }} width={60} />
                <Tooltip formatter={(value: number) => `${value.toLocaleString('fr-FR', { minimumFractionDigits: 1 })} M\u202F\u20ac`} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="Budget LFI" fill="#94a3b8" radius={[0, 4, 4, 0]} barSize={12} />
                <Bar dataKey="Engagements" fill="#10b981" radius={[0, 4, 4, 0]} barSize={12} />
                <Bar dataKey="Ordonnancements" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={12} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Entity Detail Table */}
        <Card className="border border-gray-100 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-gray-700">D\u00e9tail par entit\u00e9</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="text-xs font-semibold text-gray-600">Entit\u00e9</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-600 text-right">Budget (LFI)</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-600 text-right">Engagements</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-600 text-right">Taux eng.</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-600 text-right">Ordonnancements</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-600 text-right">Taux ord.</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-600 text-right">Disponible</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-600 text-right">Nb lignes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {analysisByEntity.map(e => (
                    <TableRow key={e.name} className="hover:bg-gray-50">
                      <TableCell className="text-xs font-medium text-gray-900">{e.name}</TableCell>
                      <TableCell className="text-xs text-gray-700 text-right">{formatTableCell(e.cp)}</TableCell>
                      <TableCell className="text-xs text-gray-700 text-right">{formatTableCell(e.engCP)}</TableCell>
                      <TableCell className="text-xs text-right">
                        <div className="flex flex-col items-end gap-1">
                          <span className={tauxColor(e.tauxEngagement)}>{formatPercent(e.tauxEngagement)}</span>
                          <div className="w-16 h-1.5 bg-gray-200 rounded-full">
                            <div className={`h-full rounded-full ${tauxBgColor(e.tauxEngagement)}`} style={{ width: `${Math.min(e.tauxEngagement, 100)}%` }} />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-gray-700 text-right">{formatTableCell(e.ord)}</TableCell>
                      <TableCell className="text-xs text-right">
                        <div className="flex flex-col items-end gap-1">
                          <span className={tauxColor(e.tauxOrdonnement)}>{formatPercent(e.tauxOrdonnement)}</span>
                          <div className="w-16 h-1.5 bg-gray-200 rounded-full">
                            <div className={`h-full rounded-full ${tauxBgColor(e.tauxOrdonnement)}`} style={{ width: `${Math.min(e.tauxOrdonnement, 100)}%` }} />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-gray-700 text-right">{formatTableCell(e.disponible)}</TableCell>
                      <TableCell className="text-xs text-gray-500 text-right">{e.count}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </>
    )
  }

  const renderProgramView = () => {
    const progTotalBudget = analysisByGroup.reduce((s, g) => s + g.cp, 0)
    const progAvgEng = analysisByGroup.length > 0 ? analysisByGroup.reduce((s, g) => s + g.tauxEngagement, 0) / analysisByGroup.length : 0
    const progAvgOrd = analysisByGroup.length > 0 ? analysisByGroup.reduce((s, g) => s + g.tauxOrdonnement, 0) / analysisByGroup.length : 0

    return (
      <>
        <h2 className="text-lg font-bold text-gray-900">Analyse par Projet</h2>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="border border-gray-100 shadow-sm">
            <CardContent className="p-4">
              <span className="text-xs font-medium text-gray-500">Total projets</span>
              <p className="text-xl font-bold text-gray-900 mt-1">{formatMillions(progTotalBudget)}</p>
            </CardContent>
          </Card>
          <Card className="border border-gray-100 shadow-sm">
            <CardContent className="p-4">
              <span className="text-xs font-medium text-gray-500">Taux engagement moyen</span>
              <p className={`text-xl font-bold mt-1 ${tauxColor(progAvgEng)}`}>{formatPercent(progAvgEng)}</p>
            </CardContent>
          </Card>
          <Card className="border border-gray-100 shadow-sm">
            <CardContent className="p-4">
              <span className="text-xs font-medium text-gray-500">Taux ordonnancement moyen</span>
              <p className={`text-xl font-bold mt-1 ${tauxColor(progAvgOrd)}`}>{formatPercent(progAvgOrd)}</p>
            </CardContent>
          </Card>
        </div>

        {/* Chart */}
        <Card className="border border-gray-100 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-gray-700">
              Budget / Engagements / Ordonnancements par projet (en M\u202F\u20ac)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={chartDataByProgramme.length * 50 + 30}>
              <BarChart data={chartDataByProgramme} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#6b7280' }} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: '#374151' }} width={80} />
                <Tooltip formatter={(value: number) => `${value.toLocaleString('fr-FR', { minimumFractionDigits: 1 })} M\u202F\u20ac`} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="Budget LFI" fill="#94a3b8" radius={[0, 4, 4, 0]} barSize={12} />
                <Bar dataKey="Engagements" fill="#10b981" radius={[0, 4, 4, 0]} barSize={12} />
                <Bar dataKey="Ordonnancements" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={12} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Programme Detail Table */}
        <Card className="border border-gray-100 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-gray-700">D\u00e9tail par projet</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="text-xs font-semibold text-gray-600">Projet</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-600 text-right">Budget (LFI)</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-600 text-right">Engagements</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-600 text-right">Taux eng.</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-600 text-right">Ordonnancements</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-600 text-right">Taux ord.</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-600 text-right">Disponible</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-600 text-right">Nb lignes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {analysisByGroup.map(g => (
                    <TableRow key={g.name} className="hover:bg-gray-50">
                      <TableCell className="text-xs font-medium text-gray-900">{g.name}</TableCell>
                      <TableCell className="text-xs text-gray-700 text-right">{formatTableCell(g.cp)}</TableCell>
                      <TableCell className="text-xs text-gray-700 text-right">{formatTableCell(g.engCP)}</TableCell>
                      <TableCell className="text-xs text-right">
                        <div className="flex flex-col items-end gap-1">
                          <span className={tauxColor(g.tauxEngagement)}>{formatPercent(g.tauxEngagement)}</span>
                          <div className="w-16 h-1.5 bg-gray-200 rounded-full">
                            <div className={`h-full rounded-full ${tauxBgColor(g.tauxEngagement)}`} style={{ width: `${Math.min(g.tauxEngagement, 100)}%` }} />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-gray-700 text-right">{formatTableCell(g.ord)}</TableCell>
                      <TableCell className="text-xs text-right">
                        <div className="flex flex-col items-end gap-1">
                          <span className={tauxColor(g.tauxOrdonnement)}>{formatPercent(g.tauxOrdonnement)}</span>
                          <div className="w-16 h-1.5 bg-gray-200 rounded-full">
                            <div className={`h-full rounded-full ${tauxBgColor(g.tauxOrdonnement)}`} style={{ width: `${Math.min(g.tauxOrdonnement, 100)}%` }} />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-gray-700 text-right">{formatTableCell(g.disponible)}</TableCell>
                      <TableCell className="text-xs text-gray-500 text-right">{g.count}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </>
    )
  }

  const renderProjectView = () => {
    const totalProjects = filteredProjects.length
    const totalBudget = filteredProjects.reduce((s, p) => s + p.cp, 0)
    const avgEng = totalProjects > 0 ? filteredProjects.reduce((s, p) => s + p.tauxEngagement, 0) / totalProjects : 0
    const PER_PAGE = 15
    const pProjects = paginate(filteredProjects, projectPage, PER_PAGE) as typeof filteredProjects
    const tPages = totalPages(filteredProjects.length, PER_PAGE)

    return (
      <>
        <h2 className="text-lg font-bold text-gray-900">Analyse par Programme</h2>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="border border-gray-100 shadow-sm">
            <CardContent className="p-4">
              <span className="text-xs font-medium text-gray-500">Total programmes</span>
              <p className="text-xl font-bold text-gray-900 mt-1">{totalProjects}</p>
            </CardContent>
          </Card>
          <Card className="border border-gray-100 shadow-sm">
            <CardContent className="p-4">
              <span className="text-xs font-medium text-gray-500">Budget total</span>
              <p className="text-xl font-bold text-gray-900 mt-1">{formatMillions(totalBudget)}</p>
            </CardContent>
          </Card>
          <Card className="border border-gray-100 shadow-sm">
            <CardContent className="p-4">
              <span className="text-xs font-medium text-gray-500">Taux engagement moyen</span>
              <p className={`text-xl font-bold mt-1 ${tauxColor(avgEng)}`}>{formatPercent(avgEng)}</p>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-[300px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Filtrer les programmes par nom..."
            value={projectSearch}
            onChange={e => { setProjectSearch(e.target.value); setProjectPage(1) }}
            className="pl-8 bg-white h-9 text-sm"
          />
        </div>

        {/* Projects Table */}
        <Card className="border border-gray-100 shadow-sm">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="text-xs font-semibold text-gray-600">Programme</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-600">Projet</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-600">Entit\u00e9</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-600 text-right">Budget (LFI)</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-600 text-right">Engagements</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-600 text-right">Taux eng.</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-600 text-right">Ordonnancements</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-600 text-right">Taux ord.</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-600 text-right">Disponible</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pProjects.map((p, idx) => (
                    <TableRow key={`${p.name}-${p.projet}-${p.entite}-${idx}`} className="hover:bg-gray-50">
                      <TableCell className="text-xs font-medium text-gray-900 max-w-[200px] truncate">{p.name}</TableCell>
                      <TableCell className="text-xs text-gray-600">{p.projet || 'Non class\u00e9'}</TableCell>
                      <TableCell className="text-xs text-gray-600">{p.entite}</TableCell>
                      <TableCell className="text-xs text-gray-700 text-right">{formatTableCell(p.cp)}</TableCell>
                      <TableCell className="text-xs text-gray-700 text-right">{formatTableCell(p.engCP)}</TableCell>
                      <TableCell className="text-xs text-right">
                        <span className={tauxColor(p.tauxEngagement)}>{formatPercent(p.tauxEngagement)}</span>
                      </TableCell>
                      <TableCell className="text-xs text-gray-700 text-right">{formatTableCell(p.ord)}</TableCell>
                      <TableCell className="text-xs text-right">
                        <span className={tauxColor(p.tauxOrdonnement)}>{formatPercent(p.tauxOrdonnement)}</span>
                      </TableCell>
                      <TableCell className="text-xs text-gray-700 text-right">{formatTableCell(p.disponible)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Pagination */}
        {tPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500">
              {((projectPage - 1) * PER_PAGE) + 1} - {Math.min(projectPage * PER_PAGE, filteredProjects.length)} sur {filteredProjects.length}
            </p>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="sm" className="h-8 w-8 p-0" disabled={projectPage === 1} onClick={() => setProjectPage(p => p - 1)}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              {Array.from({ length: tPages }, (_, i) => i + 1)
                .filter(p => p === 1 || p === tPages || Math.abs(p - projectPage) <= 1)
                .map((p, i, arr) => (
                  <span key={p} className="flex items-center">
                    {i > 0 && arr[i - 1] !== p - 1 && <span className="text-gray-400 text-xs px-1">...</span>}
                    <Button variant={p === projectPage ? 'default' : 'outline'} size="sm" className={`h-8 w-8 p-0 text-xs ${p === projectPage ? 'bg-emerald-600 hover:bg-emerald-700' : ''}`} onClick={() => setProjectPage(p)}>
                      {p}
                    </Button>
                  </span>
                ))}
              <Button variant="outline" size="sm" className="h-8 w-8 p-0" disabled={projectPage === tPages} onClick={() => setProjectPage(p => p + 1)}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </>
    )
  }

  const renderEngagementsView = () => {
    const totalEngCP = engagementLines.reduce((s, r) => s + r.engCPTotal, 0)
    const totalEngCE = filteredData.reduce((s, r) => s + (r['ENG CE ULT'] || 0), 0)
    const PER_PAGE = 15
    const pLines = paginate(engagementLines, engPage, PER_PAGE) as typeof engagementLines
    const tPages = totalPages(engagementLines.length, PER_PAGE)

    return (
      <>
        <h2 className="text-lg font-bold text-gray-900">D\u00e9tails des Engagements</h2>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="border border-gray-100 shadow-sm">
            <CardContent className="p-4">
              <span className="text-xs font-medium text-gray-500">Total Engagements CP</span>
              <p className="text-xl font-bold text-gray-900 mt-1">{formatMillions(totalEngCP)}</p>
            </CardContent>
          </Card>
          <Card className="border border-gray-100 shadow-sm">
            <CardContent className="p-4">
              <span className="text-xs font-medium text-gray-500">Total Engagements CE</span>
              <p className="text-xl font-bold text-gray-900 mt-1">{formatMillions(totalEngCE)}</p>
            </CardContent>
          </Card>
          <Card className="border border-gray-100 shadow-sm">
            <CardContent className="p-4">
              <span className="text-xs font-medium text-gray-500">Nb engagements</span>
              <p className="text-xl font-bold text-gray-900 mt-1">{engagementLines.length}</p>
            </CardContent>
          </Card>
        </div>

        {/* Breakdown */}
        <Card className="border border-gray-100 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-gray-700">R\u00e9partition des engagements</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-lg bg-blue-50">
                <p className="text-xs font-medium text-blue-600">Eng. Reports</p>
                <p className="text-lg font-bold text-blue-900 mt-1">{formatMillions(engagementBreakdown.engReports)}</p>
                <p className="text-xs text-blue-500 mt-0.5">{formatPercent(engagementBreakdown.pctReports)} du total</p>
              </div>
              <div className="p-4 rounded-lg bg-emerald-50">
                <p className="text-xs font-medium text-emerald-600">Eng. Consolid\u00e9s</p>
                <p className="text-lg font-bold text-emerald-900 mt-1">{formatMillions(engagementBreakdown.engConsolides)}</p>
                <p className="text-xs text-emerald-500 mt-0.5">{formatPercent(engagementBreakdown.pctConsolides)} du total</p>
              </div>
              <div className="p-4 rounded-lg bg-amber-50">
                <p className="text-xs font-medium text-amber-600">Eng. Nouveaux</p>
                <p className="text-lg font-bold text-amber-900 mt-1">{formatMillions(engagementBreakdown.engNouveaux)}</p>
                <p className="text-xs text-amber-500 mt-0.5">{formatPercent(engagementBreakdown.pctNouveaux)} du total</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Engagement Lines Table */}
        <Card className="border border-gray-100 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-gray-700">D\u00e9tail des engagements ({engagementLines.length} lignes)</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="text-xs font-semibold text-gray-600">N\u00b0 Engagement</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-600">D\u00e9signation</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-600">Entit\u00e9</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-600">Projet</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-600 text-right">Eng. Reports</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-600 text-right">Eng. Consolid\u00e9s</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-600 text-right">Eng. Nouveaux</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-600 text-right">Eng. CP Total</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-600 text-right">Taux eng.</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pLines.map((r, idx) => (
                    <TableRow key={`${r.numEngagement}-${idx}`} className="hover:bg-gray-50">
                      <TableCell className="text-xs font-medium text-gray-900">{r.numEngagement}</TableCell>
                      <TableCell className="text-xs text-gray-700 max-w-[200px] truncate">{r.designation}</TableCell>
                      <TableCell className="text-xs text-gray-600">{r.entite}</TableCell>
                      <TableCell className="text-xs text-gray-600">{r.projet || 'Non class\u00e9'}</TableCell>
                      <TableCell className="text-xs text-gray-700 text-right">{formatTableCell(r.engReports)}</TableCell>
                      <TableCell className="text-xs text-gray-700 text-right">{formatTableCell(r.engConsolides)}</TableCell>
                      <TableCell className="text-xs text-gray-700 text-right">{formatTableCell(r.engNouveaux)}</TableCell>
                      <TableCell className="text-xs font-medium text-gray-900 text-right">{formatTableCell(r.engCPTotal)}</TableCell>
                      <TableCell className="text-xs text-right">
                        <span className={tauxColor(r.tauxEngagement)}>{formatPercent(r.tauxEngagement)}</span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Pagination */}
        {tPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500">
              {((engPage - 1) * PER_PAGE) + 1} - {Math.min(engPage * PER_PAGE, engagementLines.length)} sur {engagementLines.length}
            </p>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="sm" className="h-8 w-8 p-0" disabled={engPage === 1} onClick={() => setEngPage(p => p - 1)}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              {Array.from({ length: tPages }, (_, i) => i + 1)
                .filter(p => p === 1 || p === tPages || Math.abs(p - engPage) <= 1)
                .map((p, i, arr) => (
                  <span key={p} className="flex items-center">
                    {i > 0 && arr[i - 1] !== p - 1 && <span className="text-gray-400 text-xs px-1">...</span>}
                    <Button variant={p === engPage ? 'default' : 'outline'} size="sm" className={`h-8 w-8 p-0 text-xs ${p === engPage ? 'bg-emerald-600 hover:bg-emerald-700' : ''}`} onClick={() => setEngPage(p)}>
                      {p}
                    </Button>
                  </span>
                ))}
              <Button variant="outline" size="sm" className="h-8 w-8 p-0" disabled={engPage === tPages} onClick={() => setEngPage(p => p + 1)}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </>
    )
  }

  const renderOrdonnancementsView = () => {
    const totalOrd = ordonnancementLines.reduce((s, r) => s + r.ordTotal, 0)
    const nbOrd = ordonnancementLines.length
    const tauxGlobal = kpis.totalEngCP > 0 ? (totalOrd / kpis.totalEngCP) * 100 : 0
    const PER_PAGE = 15
    const pLines = paginate(ordonnancementLines, ordPage, PER_PAGE) as typeof ordonnancementLines
    const tPages = totalPages(ordonnancementLines.length, PER_PAGE)

    return (
      <>
        <h2 className="text-lg font-bold text-gray-900">D\u00e9tails des Ordonnancements</h2>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="border border-gray-100 shadow-sm">
            <CardContent className="p-4">
              <span className="text-xs font-medium text-gray-500">Total Ordonnancements</span>
              <p className="text-xl font-bold text-gray-900 mt-1">{formatMillions(totalOrd)}</p>
            </CardContent>
          </Card>
          <Card className="border border-gray-100 shadow-sm">
            <CardContent className="p-4">
              <span className="text-xs font-medium text-gray-500">Nb ordonnancements</span>
              <p className="text-xl font-bold text-gray-900 mt-1">{nbOrd}</p>
            </CardContent>
          </Card>
          <Card className="border border-gray-100 shadow-sm">
            <CardContent className="p-4">
              <span className="text-xs font-medium text-gray-500">Taux ordonnancement global</span>
              <p className={`text-xl font-bold mt-1 ${tauxColor(tauxGlobal)}`}>{formatPercent(tauxGlobal)}</p>
            </CardContent>
          </Card>
        </div>

        {/* Breakdown */}
        <Card className="border border-gray-100 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-gray-700">R\u00e9partition des ordonnancements</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-lg bg-blue-50">
                <p className="text-xs font-medium text-blue-600">Ord. Reports</p>
                <p className="text-lg font-bold text-blue-900 mt-1">{formatMillions(ordonnancementBreakdown.ordReports)}</p>
                <p className="text-xs text-blue-500 mt-0.5">{formatPercent(ordonnancementBreakdown.pctReports)} du total</p>
              </div>
              <div className="p-4 rounded-lg bg-emerald-50">
                <p className="text-xs font-medium text-emerald-600">Ord. Consolid\u00e9s</p>
                <p className="text-lg font-bold text-emerald-900 mt-1">{formatMillions(ordonnancementBreakdown.ordConsolides)}</p>
                <p className="text-xs text-emerald-500 mt-0.5">{formatPercent(ordonnancementBreakdown.pctConsolides)} du total</p>
              </div>
              <div className="p-4 rounded-lg bg-amber-50">
                <p className="text-xs font-medium text-amber-600">Ord. Nouveaux</p>
                <p className="text-lg font-bold text-amber-900 mt-1">{formatMillions(ordonnancementBreakdown.ordNouveaux)}</p>
                <p className="text-xs text-amber-500 mt-0.5">{formatPercent(ordonnancementBreakdown.pctNouveaux)} du total</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Ordonnancement Lines Table */}
        <Card className="border border-gray-100 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-gray-700">D\u00e9tail des ordonnancements ({ordonnancementLines.length} lignes)</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="text-xs font-semibold text-gray-600">N\u00b0 Engagement</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-600">D\u00e9signation</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-600">Entit\u00e9</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-600">Projet</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-600 text-right">Ord. Reports</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-600 text-right">Ord. Consolid\u00e9s</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-600 text-right">Ord. Nouveaux</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-600 text-right">Ord. Total</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-600 text-right">Taux ord.</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pLines.map((r, idx) => (
                    <TableRow key={`${r.numEngagement}-${idx}`} className="hover:bg-gray-50">
                      <TableCell className="text-xs font-medium text-gray-900">{r.numEngagement}</TableCell>
                      <TableCell className="text-xs text-gray-700 max-w-[200px] truncate">{r.designation}</TableCell>
                      <TableCell className="text-xs text-gray-600">{r.entite}</TableCell>
                      <TableCell className="text-xs text-gray-600">{r.projet || 'Non class\u00e9'}</TableCell>
                      <TableCell className="text-xs text-gray-700 text-right">{formatTableCell(r.ordReports)}</TableCell>
                      <TableCell className="text-xs text-gray-700 text-right">{formatTableCell(r.ordConsolides)}</TableCell>
                      <TableCell className="text-xs text-gray-700 text-right">{formatTableCell(r.ordNouveaux)}</TableCell>
                      <TableCell className="text-xs font-medium text-gray-900 text-right">{formatTableCell(r.ordTotal)}</TableCell>
                      <TableCell className="text-xs text-right">
                        <span className={tauxColor(r.tauxOrdonnement)}>{formatPercent(r.tauxOrdonnement)}</span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Pagination */}
        {tPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500">
              {((ordPage - 1) * PER_PAGE) + 1} - {Math.min(ordPage * PER_PAGE, ordonnancementLines.length)} sur {ordonnancementLines.length}
            </p>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="sm" className="h-8 w-8 p-0" disabled={ordPage === 1} onClick={() => setOrdPage(p => p - 1)}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              {Array.from({ length: tPages }, (_, i) => i + 1)
                .filter(p => p === 1 || p === tPages || Math.abs(p - ordPage) <= 1)
                .map((p, i, arr) => (
                  <span key={p} className="flex items-center">
                    {i > 0 && arr[i - 1] !== p - 1 && <span className="text-gray-400 text-xs px-1">...</span>}
                    <Button variant={p === ordPage ? 'default' : 'outline'} size="sm" className={`h-8 w-8 p-0 text-xs ${p === ordPage ? 'bg-emerald-600 hover:bg-emerald-700' : ''}`} onClick={() => setOrdPage(p)}>
                      {p}
                    </Button>
                  </span>
                ))}
              <Button variant="outline" size="sm" className="h-8 w-8 p-0" disabled={ordPage === tPages} onClick={() => setOrdPage(p => p + 1)}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </>
    )
  }

  const renderAlertsView = () => {
    const critiques = allAlerts.filter(a => a.type === 'danger')
    const avertissements = allAlerts.filter(a => a.type === 'warning')
    const infos = allAlerts.filter(a => a.type === 'info')

    return (
      <>
        <h2 className="text-lg font-bold text-gray-900">Alertes et Points de Vigilance</h2>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="border border-gray-100 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                </div>
                <span className="text-xs font-medium text-gray-500">Critiques</span>
              </div>
              <p className="text-xl font-bold text-red-600 mt-2">{critiques.length}</p>
            </CardContent>
          </Card>
          <Card className="border border-gray-100 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                </div>
                <span className="text-xs font-medium text-gray-500">Avertissements</span>
              </div>
              <p className="text-xl font-bold text-amber-600 mt-2">{avertissements.length}</p>
            </CardContent>
          </Card>
          <Card className="border border-gray-100 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <Info className="w-4 h-4 text-blue-600" />
                </div>
                <span className="text-xs font-medium text-gray-500">Informations</span>
              </div>
              <p className="text-xl font-bold text-blue-600 mt-2">{infos.length}</p>
            </CardContent>
          </Card>
        </div>

        {/* Critiques Section */}
        {critiques.length > 0 && (
          <Card className="border-l-4 border-l-red-500 border border-gray-100 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-red-800 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Critiques ({critiques.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {critiques.map((alert, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-3 rounded-lg bg-red-50">
                    <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-red-800">{alert.message}</p>
                      <p className="text-xs text-red-600 mt-0.5">{alert.detail}</p>
                      {alert.date && <p className="text-xs text-gray-400 mt-1">{formatDate(alert.date)}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Avertissements Section */}
        {avertissements.length > 0 && (
          <Card className="border-l-4 border-l-amber-500 border border-gray-100 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-amber-800 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Avertissements ({avertissements.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {avertissements.map((alert, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-3 rounded-lg bg-amber-50">
                    <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-amber-800">{alert.message}</p>
                      <p className="text-xs text-amber-600 mt-0.5">{alert.detail}</p>
                      {alert.date && <p className="text-xs text-gray-400 mt-1">{formatDate(alert.date)}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Informations Section */}
        {infos.length > 0 && (
          <Card className="border-l-4 border-l-blue-500 border border-gray-100 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-blue-800 flex items-center gap-2">
                <Info className="w-4 h-4" />
                Informations ({infos.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {infos.map((alert, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-3 rounded-lg bg-blue-50">
                    <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-blue-800">{alert.message}</p>
                      <p className="text-xs text-blue-600 mt-0.5">{alert.detail}</p>
                      {alert.date && <p className="text-xs text-gray-400 mt-1">{formatDate(alert.date)}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {allAlerts.length === 0 && (
          <Card className="border border-gray-100 shadow-sm">
            <CardContent className="py-12 text-center">
              <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
              <p className="text-gray-500">Aucune alerte en cours</p>
            </CardContent>
          </Card>
        )}
      </>
    )
  }

  const renderReportsView = () => {
    return (
      <>
        <h2 className="text-lg font-bold text-gray-900">Rapports et Synth\u00e8ses</h2>

        {/* Key Metrics Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card className="border border-gray-100 shadow-sm">
            <CardContent className="p-4">
              <span className="text-xs font-medium text-gray-500">Budget total</span>
              <p className="text-lg font-bold text-gray-900 mt-1">{formatMillions(kpis.totalCP)}</p>
            </CardContent>
          </Card>
          <Card className="border border-gray-100 shadow-sm">
            <CardContent className="p-4">
              <span className="text-xs font-medium text-gray-500">Engagements</span>
              <p className="text-lg font-bold text-emerald-600 mt-1">{formatMillions(kpis.totalEngCP)}</p>
            </CardContent>
          </Card>
          <Card className="border border-gray-100 shadow-sm">
            <CardContent className="p-4">
              <span className="text-xs font-medium text-gray-500">Ordonnancements</span>
              <p className="text-lg font-bold text-blue-600 mt-1">{formatMillions(kpis.totalOrd)}</p>
            </CardContent>
          </Card>
          <Card className="border border-gray-100 shadow-sm">
            <CardContent className="p-4">
              <span className="text-xs font-medium text-gray-500">Disponible</span>
              <p className="text-lg font-bold text-violet-600 mt-1">{formatMillions(kpis.disponible)}</p>
            </CardContent>
          </Card>
        </div>

        {/* Entity Comparison Table */}
        <Card className="border border-gray-100 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-gray-700">R\u00e9sum\u00e9 comparatif par entit\u00e9</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="text-xs font-semibold text-gray-600">Entit\u00e9</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-600 text-right">Budget</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-600 text-right">Engagements</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-600 text-right">Taux eng.</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-600 text-right">Ordonnancements</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-600 text-right">Taux ord.</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-600 text-right">Disponible</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {analysisByEntity.map(e => (
                    <TableRow key={e.name} className="hover:bg-gray-50">
                      <TableCell className="text-xs font-medium text-gray-900">{e.name}</TableCell>
                      <TableCell className="text-xs text-gray-700 text-right">{formatMillions(e.cp)}</TableCell>
                      <TableCell className="text-xs text-gray-700 text-right">{formatMillions(e.engCP)}</TableCell>
                      <TableCell className="text-xs text-right">
                        <span className={tauxColor(e.tauxEngagement)}>{formatPercent(e.tauxEngagement)}</span>
                      </TableCell>
                      <TableCell className="text-xs text-gray-700 text-right">{formatMillions(e.ord)}</TableCell>
                      <TableCell className="text-xs text-right">
                        <span className={tauxColor(e.tauxOrdonnement)}>{formatPercent(e.tauxOrdonnement)}</span>
                      </TableCell>
                      <TableCell className="text-xs text-gray-700 text-right">{formatMillions(e.disponible)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Budget Structure Pie Chart */}
        <Card className="border border-gray-100 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <PieChartIcon className="w-4 h-4" />
              Structure budg\u00e9taire
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={budgetStructureData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={3}
                    dataKey="value"
                    label={({ name, percent }: { name: string; percent: number }) => `${name} ${(percent * 100).toFixed(1)}%`}
                  >
                    {budgetStructureData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => `${value.toLocaleString('fr-FR', { minimumFractionDigits: 1 })} M\u202F\u20ac`} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-3">
                {budgetStructureData.map((item, idx) => (
                  <div key={item.name} className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }} />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{item.name}</p>
                      <p className="text-xs text-gray-500">{item.value.toLocaleString('fr-FR', { minimumFractionDigits: 1 })} M\u202F\u20ac</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Source de financement */}
        <Card className="border border-gray-100 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-gray-700">Source de financement</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="text-xs font-semibold text-gray-600">Source</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-600 text-right">Budget (LFI)</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-600 text-right">Engagements</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-600 text-right">Taux eng.</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-600 text-right">Ordonnancements</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-600 text-right">Taux ord.</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-600 text-right">Nb lignes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sourceFinancementData.map(s => (
                    <TableRow key={s.name} className="hover:bg-gray-50">
                      <TableCell className="text-xs font-medium text-gray-900">{s.name}</TableCell>
                      <TableCell className="text-xs text-gray-700 text-right">{formatMillions(s.cp)}</TableCell>
                      <TableCell className="text-xs text-gray-700 text-right">{formatMillions(s.engCP)}</TableCell>
                      <TableCell className="text-xs text-right">
                        <span className={tauxColor(s.tauxEngagement)}>{formatPercent(s.tauxEngagement)}</span>
                      </TableCell>
                      <TableCell className="text-xs text-gray-700 text-right">{formatMillions(s.ord)}</TableCell>
                      <TableCell className="text-xs text-right">
                        <span className={tauxColor(s.tauxOrdonnement)}>{formatPercent(s.tauxOrdonnement)}</span>
                      </TableCell>
                      <TableCell className="text-xs text-gray-500 text-right">{s.count}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Export Buttons */}
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" className="gap-2" onClick={handleExport}>
            <FileSpreadsheet className="w-4 h-4" />
            Exporter CSV (donn\u00e9es filtr\u00e9es)
          </Button>
        </div>
      </>
    )
  }

  const renderSettingsView = () => {
    return (
      <>
        <h2 className="text-lg font-bold text-gray-900">Param\u00e8tres</h2>

        {/* Auto-refresh */}
        <Card className="border border-gray-100 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Actualisation automatique
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">Actualisation automatique</p>
                <p className="text-xs text-gray-500">Rafra\u00eechir les donn\u00e9es automatiquement</p>
              </div>
              <Switch checked={autoRefresh} onCheckedChange={setAutoRefresh} />
            </div>
            {autoRefresh && (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">Intervalle</p>
                  <p className="text-xs text-gray-500">Fr\u00e9quence de rafra\u00eechissement</p>
                </div>
                <Select value={String(refreshInterval)} onValueChange={v => setRefreshInterval(Number(v))}>
                  <SelectTrigger className="w-[120px] h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 secondes</SelectItem>
                    <SelectItem value="30">30 secondes</SelectItem>
                    <SelectItem value="60">60 secondes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Display Preferences */}
        <Card className="border border-gray-100 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Pr\u00e9f\u00e9rences d&apos;affichage
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">Format des nombres</p>
                <p className="text-xs text-gray-500">Affichage des montants</p>
              </div>
              <Select value={numberFormat} onValueChange={v => setNumberFormat(v as 'millions' | 'full')}>
                <SelectTrigger className="w-[140px] h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="millions">Millions M\u202F\u20ac</SelectItem>
                  <SelectItem value="full">Complet</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">Page par d\u00e9faut</p>
                <p className="text-xs text-gray-500">Page affich\u00e9e au chargement</p>
              </div>
              <Select value={defaultPage} onValueChange={setDefaultPage}>
                <SelectTrigger className="w-[160px] h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {NAV_ITEMS.map(item => (
                    <SelectItem key={item.key} value={item.key}>{item.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Data Management */}
        <Card className="border border-gray-100 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Database className="w-4 h-4" />
              Gestion des donn\u00e9es
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">Importer un fichier Excel</p>
                <p className="text-xs text-gray-500">Charger de nouvelles donn\u00e9es depuis un fichier .xlsx ou .xls</p>
              </div>
              <label htmlFor="settings-excel-upload">
                <Button className="bg-emerald-600 hover:bg-emerald-700 gap-1 cursor-pointer h-8 text-xs" disabled={uploading} asChild>
                  <span>
                    <Upload className="w-3.5 h-3.5" />
                    {uploading ? 'Import...' : 'Importer'}
                  </span>
                </Button>
              </label>
              <input
                id="settings-excel-upload"
                type="file"
                accept=".xlsx,.xls"
                className="hidden"
                onChange={handleFileUpload}
                disabled={uploading}
              />
            </div>
            <div className="grid grid-cols-2 gap-4 p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="text-xs text-gray-500">Derni\u00e8re mise \u00e0 jour</p>
                <p className="text-sm font-medium text-gray-900">{formatDate(lastUpdated)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Nombre de lignes</p>
                <p className="text-sm font-medium text-gray-900">{data.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* About */}
        <Card className="border border-gray-100 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-gray-700">\u00c0 propos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Version</span>
                <Badge variant="secondary" className="text-xs">1.0.0</Badge>
              </div>
              <p className="text-xs text-gray-500">
                Tableau de bord de suivi d&apos;ex\u00e9cution du budget d&apos;investissement.
                Application d\u00e9di\u00e9e au suivi et \u00e0 l&apos;analyse des engagements, ordonnancements
                et paiements relatifs au budget d&apos;investissement.
              </p>
            </div>
          </CardContent>
        </Card>
      </>
    )
  }

  // Active view renderer
  const renderActiveView = () => {
    switch (activeNav) {
      case 'entity': return renderEntityView()
      case 'program': return renderProgramView()
      case 'project': return renderProjectView()
      case 'engagements': return renderEngagementsView()
      case 'ordonnancements': return renderOrdonnancementsView()
      case 'alerts': return renderAlertsView()
      case 'reports': return renderReportsView()
      case 'settings': return renderSettingsView()
      default: return renderOverview()
    }
  }

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
                    Vue consolid\u00e9e par entit\u00e9, projet et programme
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
                  <SelectValue placeholder="Projet" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les projets</SelectItem>
                  {filters.groupes.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={selectedProjet} onValueChange={setSelectedProjet}>
                <SelectTrigger className="bg-white h-8 text-xs w-[140px]">
                  <SelectValue placeholder="Programme" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les programmes</SelectItem>
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
          {renderActiveView()}
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
