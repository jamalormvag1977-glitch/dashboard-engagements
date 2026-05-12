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
  Programme: string
  Projet: string
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
  programmes: string[]
  projets: string[]
  entites: string[]
}

// Format number in millions with 1 decimal and M DH suffix (French format)
function formatMillions(value: number | null | undefined): string {
  if (value === null || value === undefined) return '-'
  const millions = value / 1e6
  return millions.toLocaleString('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + ' M DH'
}

// Format number for table cells with French thousands separators
function formatTableCell(value: number | null | undefined): string {
  if (value === null || value === undefined) return '—'
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
  { key: 'entity', label: 'Par entité', icon: List },
  { key: 'program', label: 'Par projet', icon: FolderOpen },
  { key: 'project', label: 'Par programme', icon: FolderOpen },
  { key: 'engagements', label: 'Détails engagements', icon: FileText },
  { key: 'ordonnancements', label: 'Détails ordonnancements', icon: FileText },
  { key: 'assainissement', label: 'Assainissement des reports', icon: RotateCcw },
  { key: 'reports', label: 'Rapports', icon: BarChart3 },
  { key: 'settings', label: 'Paramètres', icon: Settings },
]

const PIE_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']

// Custom bar label component showing amount and % on each bar
const BarLabel = (props: { x: number; y: number; width: number; height: number; value: number; dataKey: string; payload: Record<string, unknown> }) => {
  const { x, y, width, height, value, dataKey, payload } = props
  if (!value || value === 0) return null
  const formattedValue = value.toLocaleString('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
  let pctText = ''
  if (dataKey === 'Engagements' && payload?.tauxEngagement != null) {
    pctText = ` (${(payload.tauxEngagement as number).toFixed(1)}%)`
  } else if (dataKey === 'Ordonnancements' && payload?.tauxOrdonnement != null) {
    pctText = ` (${(payload.tauxOrdonnement as number).toFixed(1)}%)`
  }
  return (
    <text
      x={x + width + 4}
      y={y + height / 2}
      fill="#374151"
      fontSize={9}
      dominantBaseline="middle"
      textAnchor="start"
    >
      {formattedValue} M DH{pctText}
    </text>
  )
}

export default function Dashboard() {
  const [data, setData] = useState<DataRow[]>([])
  const [filters, setFilters] = useState<FilterData>({ programmes: [], projets: [], entites: [] })
  const [loading, setLoading] = useState(true)
  const [selectedProgramme, setSelectedProgramme] = useState<string>('all')
  const [selectedProjet, setSelectedProjet] = useState<string>('all')
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
      setFilters(response.filters || { programmes: [], projets: [], entites: [] })
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
      alert(`Fichier importé avec succès ! ${result.count} lignes chargées.`)
    } catch (err) {
      console.error('Upload error:', err)
      alert(`Erreur lors de l'import : ${(err as Error).message}`)
    } finally {
      setUploading(false)
      event.target.value = ''
    }
  }

  const handleResetFilters = () => {
    setSelectedProgramme('all')
    setSelectedProjet('all')
    setSelectedEntite('all')
    setSearchTerm('')
  }

  const filteredData = useMemo(() => {
    return data.filter(row => {
      if (selectedProgramme !== 'all' && row.Programme !== selectedProgramme) return false
      if (selectedProjet !== 'all' && row.Projet !== selectedProjet) return false
      if (selectedEntite !== 'all' && row.ENTITE !== selectedEntite) return false
      if (searchTerm) {
        const search = searchTerm.toLowerCase()
        const designation = (row['DETAIL DESIGNATION'] || '').toLowerCase()
        const engagement = (row['N° ENGAGEMENT'] || '').toLowerCase()
        const projet = (row.Programme || '').toLowerCase()
        if (!designation.includes(search) && !engagement.includes(search) && !projet.includes(search)) return false
      }
      return true
    })
  }, [data, selectedProgramme, selectedProjet, selectedEntite, searchTerm])

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
    const totalOrdReports = filteredData.reduce((sum, r) => sum + (r['ORD REPORTS'] || 0), 0)
    const totalOrdNouveaux = filteredData.reduce((sum, r) => sum + (r['ORD NOUVEAUX'] || 0), 0)
    const totalEngReports = filteredData.reduce((sum, r) => sum + (r['ENG REPORT'] || 0), 0)
    const totalEngNouveaux = filteredData.reduce((sum, r) => sum + (r['ENG NOUVEAUX'] || 0), 0)
    const tauxEngagement = totalCP > 0 ? (totalEngCP / totalCP) * 100 : 0
    const tauxPaiement = totalEngCP > 0 ? (totalPaiements / totalEngCP) * 100 : 0
    const tauxOrdonnement = totalEngCP > 0 ? (totalOrd / totalEngCP) * 100 : 0
    const disponible = totalCP - totalEngCP

    // Cumulative forecasts by month
    const prevMonths = ['JANVIER','FEVRIER','MARS','AVRIL','MAI','JUIN','JUILLET','AOUT','SEPTEMBRE','OCTOBRE','NOVEMBRE','DECEMBRE']
    const cumulPrev: Record<string, number> = {}
    let cumul = 0
    for (const m of prevMonths) {
      const rep = filteredData.reduce((s, r) => s + (r[`Previsions REPORTS ${m}`] || 0), 0)
      const con = filteredData.reduce((s, r) => s + (r[`Previsions CONSOLIDES ${m}`] || 0), 0)
      const nouv = filteredData.reduce((s, r) => s + (r[`Previsions NOUVEAUX ${m}`] || 0), 0)
      cumul += rep + con + nouv
      cumulPrev[m] = cumul
    }

    return {
      totalCP, totalCE, totalPaiements, totalPrevisions, totalEngCP, totalEngCE,
      totalReports, totalConsolides, totalNouveaux, totalOrd, totalOrdReports, totalOrdNouveaux,
      totalEngReports, totalEngNouveaux, count: filteredData.length,
      tauxEngagement, tauxPaiement, tauxOrdonnement, disponible,
      cumulPrevJuin: cumulPrev['JUIN'],
      cumulPrevSeptembre: cumulPrev['SEPTEMBRE'],
      cumulPrevOctobre: cumulPrev['OCTOBRE'],
      cumulPrevNovembre: cumulPrev['NOVEMBRE'],
    }
  }, [filteredData])

  // Analysis by Entity
  const analysisByEntity = useMemo(() => {
    const prevMonths = ['JANVIER','FEVRIER','MARS','AVRIL','MAI','JUIN','JUILLET','AOUT','SEPTEMBRE','OCTOBRE','NOVEMBRE','DECEMBRE']
    const entities: Record<string, { cp: number; ce: number; engCP: number; engCE: number; paiements: number; previsions: number; count: number; ord: number; prevByMonth: Record<string, number> }> = {}
    filteredData.forEach(row => {
      const e = row.ENTITE
      if (!entities[e]) entities[e] = { cp: 0, ce: 0, engCP: 0, engCE: 0, paiements: 0, previsions: 0, count: 0, ord: 0, prevByMonth: {} }
      entities[e].cp += row['TOTAL CP'] || 0
      entities[e].ce += row['TOTAL CE'] || 0
      entities[e].engCP += row['ENG CP TOTAL'] || 0
      entities[e].engCE += row['ENG CE ULT'] || 0
      entities[e].paiements += row['PAIEMENTS TOTAL'] || 0
      entities[e].previsions += row['TOTAL PREV'] || 0
      entities[e].count += 1
      entities[e].ord += row['ORD TOTAL'] || 0
    })
    // Calculate cumulative previsions by entity
    Object.keys(entities).forEach(e => {
      const entityRows = filteredData.filter(r => r.ENTITE === e)
      let cumul = 0
      for (const m of prevMonths) {
        const rep = entityRows.reduce((s, r) => s + (r[`Previsions REPORTS ${m}`] || 0), 0)
        const con = entityRows.reduce((s, r) => s + (r[`Previsions CONSOLIDES ${m}`] || 0), 0)
        const nouv = entityRows.reduce((s, r) => s + (r[`Previsions NOUVEAUX ${m}`] || 0), 0)
        cumul += rep + con + nouv
        entities[e].prevByMonth[m] = cumul
      }
    })
    return Object.entries(entities).map(([name, v]) => ({
      name,
      cp: v.cp, ce: v.ce, engCP: v.engCP, engCE: v.engCE,
      paiements: v.paiements, previsions: v.previsions, count: v.count, ord: v.ord,
      tauxEngagement: v.cp > 0 ? (v.engCP / v.cp) * 100 : 0,
      tauxEngagementCE: v.ce > 0 ? (v.engCE / v.ce) * 100 : 0,
      tauxOrdonnement: v.engCP > 0 ? (v.ord / v.engCP) * 100 : 0,
      tauxPaiement: v.engCP > 0 ? (v.paiements / v.engCP) * 100 : 0,
      disponible: v.cp - v.engCP,
      cumulPrevJuin: v.prevByMonth['JUIN'] || 0,
      cumulPrevSeptembre: v.prevByMonth['SEPTEMBRE'] || 0,
      cumulPrevOctobre: v.prevByMonth['OCTOBRE'] || 0,
      cumulPrevNovembre: v.prevByMonth['NOVEMBRE'] || 0,
    })).sort((a, b) => b.cp - a.cp)
  }, [filteredData])

  // Analysis by Group (Programme)
  const analysisByGroup = useMemo(() => {
    const groups: Record<string, { cp: number; ce: number; engCP: number; engCE: number; paiements: number; previsions: number; count: number; ord: number }> = {}
    filteredData.forEach(row => {
      const g = row.Projet
      if (!groups[g]) groups[g] = { cp: 0, ce: 0, engCP: 0, engCE: 0, paiements: 0, previsions: 0, count: 0, ord: 0 }
      groups[g].cp += row['TOTAL CP'] || 0
      groups[g].ce += row['TOTAL CE'] || 0
      groups[g].engCP += row['ENG CP TOTAL'] || 0
      groups[g].engCE += row['ENG CE ULT'] || 0
      groups[g].paiements += row['PAIEMENTS TOTAL'] || 0
      groups[g].previsions += row['TOTAL PREV'] || 0
      groups[g].count += 1
      groups[g].ord += row['ORD TOTAL'] || 0
    })
    return Object.entries(groups).map(([name, v]) => ({
      name,
      ...v,
      tauxEngagement: v.cp > 0 ? (v.engCP / v.cp) * 100 : 0,
      tauxEngagementCE: v.ce > 0 ? (v.engCE / v.ce) * 100 : 0,
      tauxOrdonnement: v.engCP > 0 ? (v.ord / v.engCP) * 100 : 0,
      tauxPaiement: v.engCP > 0 ? (v.paiements / v.engCP) * 100 : 0,
      disponible: v.cp - v.engCP,
    })).sort((a, b) => {
      const numA = parseInt(a.name.replace(/\D/g, '')) || 0
      const numB = parseInt(b.name.replace(/\D/g, '')) || 0
      return numA - numB
    })
  }, [filteredData])

  // Analysis by Programme (row.Programme field - actual project names)
  const analysisByProgramme = useMemo(() => {
    const groups: Record<string, { cp: number; ce: number; engCP: number; engCE: number; paiements: number; previsions: number; count: number; ord: number }> = {}
    filteredData.forEach(row => {
      const g = row.Programme
      if (!groups[g]) groups[g] = { cp: 0, ce: 0, engCP: 0, engCE: 0, paiements: 0, previsions: 0, count: 0, ord: 0 }
      groups[g].cp += row['TOTAL CP'] || 0
      groups[g].ce += row['TOTAL CE'] || 0
      groups[g].engCP += row['ENG CP TOTAL'] || 0
      groups[g].engCE += row['ENG CE ULT'] || 0
      groups[g].paiements += row['PAIEMENTS TOTAL'] || 0
      groups[g].previsions += row['TOTAL PREV'] || 0
      groups[g].count += 1
      groups[g].ord += row['ORD TOTAL'] || 0
    })
    return Object.entries(groups).map(([name, v]) => ({
      name,
      ...v,
      tauxEngagement: v.cp > 0 ? (v.engCP / v.cp) * 100 : 0,
      tauxEngagementCE: v.ce > 0 ? (v.engCE / v.ce) * 100 : 0,
      tauxOrdonnement: v.engCP > 0 ? (v.ord / v.engCP) * 100 : 0,
      tauxPaiement: v.engCP > 0 ? (v.paiements / v.engCP) * 100 : 0,
      disponible: v.cp - v.engCP,
    })).sort((a, b) => b.cp - a.cp)
  }, [filteredData])

  // Top 5 Projects by TOTAL CP
  const topProjects = useMemo(() => {
    return [...filteredData]
      .filter(r => (r['TOTAL CP'] || 0) > 0)
      .sort((a, b) => (b['TOTAL CP'] || 0) - (a['TOTAL CP'] || 0))
      .slice(0, 5)
      .map(r => ({
        name: r.Programme || 'Sans nom',
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
      tauxEngagement: e.tauxEngagement,
      tauxOrdonnement: e.tauxOrdonnement,
    }))
  }, [analysisByEntity])

  // Chart data for programme execution
  const chartDataByProgramme = useMemo(() => {
    return analysisByGroup.map(g => ({
      name: g.name,
      Engagements: Math.round(g.engCP / 1e6 * 10) / 10,
      Ordonnancements: Math.round(g.ord / 1e6 * 10) / 10,
      'Budget LFI': Math.round(g.cp / 1e6 * 10) / 10,
      tauxEngagement: g.tauxEngagement,
      tauxOrdonnement: g.tauxOrdonnement,
    }))
  }, [analysisByGroup])

  // Chart data for top 5 projects
  const chartDataByProject = useMemo(() => {
    return topProjects.map(p => ({
      name: (p.name || '').length > 25 ? (p.name || '').substring(0, 25) + '...' : (p.name || 'Sans nom'),
      Engagements: Math.round(p.engCP / 1e6 * 10) / 10,
      Ordonnancements: Math.round(p.ord / 1e6 * 10) / 10,
      'Budget LFI': Math.round(p.cp / 1e6 * 10) / 10,
      tauxEngagement: p.tauxEngagement,
      tauxOrdonnement: p.tauxOrdonnement,
    }))
  }, [topProjects])


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
      const s = row['SOURCE FINANCEMENT'] || 'Non spécifié'
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
      const group = row.Projet
      if (!grouped[entity]) grouped[entity] = {}
      if (!grouped[entity][group]) grouped[entity][group] = []
      grouped[entity][group].push(row)
    })

    const entities = Object.entries(grouped).map(([entityName, groups]) => {
      const entityRows = filteredData.filter(r => r.ENTITE === entityName)
      const entityCP = entityRows.reduce((s, r) => s + (r['TOTAL CP'] || 0), 0)
      const entityEngCP = entityRows.reduce((s, r) => s + (r['ENG CP TOTAL'] || 0), 0)
      const entityOrd = entityRows.reduce((s, r) => s + (r['ORD TOTAL'] || 0), 0)
      const entityCE = entityRows.reduce((s, r) => s + (r['TOTAL CE'] || 0), 0)
      const entityEngCE = entityRows.reduce((s, r) => s + (r['ENG CE ULT'] || 0), 0)
      const entityPaiements = entityRows.reduce((s, r) => s + (r['PAIEMENTS TOTAL'] || 0), 0)
      const entityPrevisions = entityRows.reduce((s, r) => s + (r['TOTAL PREV'] || 0), 0)

      const groupsData = Object.entries(groups).map(([groupName, rows]) => {
        const groupCP = rows.reduce((s, r) => s + (r['TOTAL CP'] || 0), 0)
        const groupEngCP = rows.reduce((s, r) => s + (r['ENG CP TOTAL'] || 0), 0)
        const groupOrd = rows.reduce((s, r) => s + (r['ORD TOTAL'] || 0), 0)
        const groupCE = rows.reduce((s, r) => s + (r['TOTAL CE'] || 0), 0)
        const groupEngCE = rows.reduce((s, r) => s + (r['ENG CE ULT'] || 0), 0)
        const groupPaiements = rows.reduce((s, r) => s + (r['PAIEMENTS TOTAL'] || 0), 0)
        const groupPrevisions = rows.reduce((s, r) => s + (r['TOTAL PREV'] || 0), 0)

        const projects = rows.map(r => ({
          name: r.Programme || 'Sans nom',
          cp: r['TOTAL CP'] || 0,
          engCP: r['ENG CP TOTAL'] || 0,
          ce: r['TOTAL CE'] || 0,
          engCE: r['ENG CE ULT'] || 0,
          ord: r['ORD TOTAL'] || 0,
          paiements: r['PAIEMENTS TOTAL'] || 0,
          previsions: r['TOTAL PREV'] || 0,
          tauxEngagement: (r['TOTAL CP'] || 0) > 0 ? ((r['ENG CP TOTAL'] || 0) / (r['TOTAL CP'] || 0)) * 100 : 0,
          tauxEngagementCE: (r['TOTAL CE'] || 0) > 0 ? ((r['ENG CE ULT'] || 0) / (r['TOTAL CE'] || 0)) * 100 : 0,
          tauxOrdonnement: (r['ENG CP TOTAL'] || 0) > 0 ? ((r['ORD TOTAL'] || 0) / (r['ENG CP TOTAL'] || 0)) * 100 : 0,
          disponible: (r['TOTAL CP'] || 0) - (r['ENG CP TOTAL'] || 0),
        }))

        return {
          name: groupName,
          cp: groupCP,
          engCP: groupEngCP,
          ce: groupCE,
          engCE: groupEngCE,
          ord: groupOrd,
          paiements: groupPaiements,
          previsions: groupPrevisions,
          tauxEngagement: groupCP > 0 ? (groupEngCP / groupCP) * 100 : 0,
          tauxEngagementCE: groupCE > 0 ? (groupEngCE / groupCE) * 100 : 0,
          tauxOrdonnement: groupEngCP > 0 ? (groupOrd / groupEngCP) * 100 : 0,
          disponible: groupCP - groupEngCP,
          projects,
        }
      })

      return {
        name: entityName,
        cp: entityCP,
        engCP: entityEngCP,
        ce: entityCE,
        engCE: entityEngCE,
        ord: entityOrd,
        paiements: entityPaiements,
        previsions: entityPrevisions,
        tauxEngagement: entityCP > 0 ? (entityEngCP / entityCP) * 100 : 0,
        tauxEngagementCE: entityCE > 0 ? (entityEngCE / entityCE) * 100 : 0,
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
    { name: 'Consolidés', value: Math.round(kpis.totalConsolides / 1e6 * 10) / 10 },
    { name: 'Nouveaux', value: Math.round(kpis.totalNouveaux / 1e6 * 10) / 10 },
  ], [kpis])

  // Projects data for project view
  const allProjectsData = useMemo(() => {
    return [...filteredData]
      .sort((a, b) => (b['TOTAL CP'] || 0) - (a['TOTAL CP'] || 0))
      .map(r => ({
        name: r.Programme || 'Sans nom',
        projet: r.Projet || 'Non classé',
        entite: r.ENTITE || 'Non défini',
        cp: r['TOTAL CP'] || 0,
        engCP: r['ENG CP TOTAL'] || 0,
        ce: r['TOTAL CE'] || 0,
        engCE: r['ENG CE ULT'] || 0,
        ord: r['ORD TOTAL'] || 0,
        paiements: r['PAIEMENTS TOTAL'] || 0,
        previsions: r['TOTAL PREV'] || 0,
        tauxEngagement: (r['TOTAL CP'] || 0) > 0 ? ((r['ENG CP TOTAL'] || 0) / (r['TOTAL CP'] || 0)) * 100 : 0,
        tauxEngagementCE: (r['TOTAL CE'] || 0) > 0 ? ((r['ENG CE ULT'] || 0) / (r['TOTAL CE'] || 0)) * 100 : 0,
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
        projet: r.Projet,
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
        projet: r.Projet,
        ordReports: r['ORD REPORTS'] || 0,
        ordConsolides: r['ORD CONSOLIDES'] || 0,
        ordNouveaux: r['ORD NOUVEAUX'] || 0,
        ordTotal: r['ORD TOTAL'] || 0,
        tauxOrdonnement: (r['ENG CP TOTAL'] || 0) > 0 ? ((r['ORD TOTAL'] || 0) / (r['ENG CP TOTAL'] || 0)) * 100 : 0,
      }))
  }, [filteredData])

  const handleExport = () => {
    const headers = ['Programme', 'Projet', 'SOURCE FINANCEMENT', 'NOMENCLATURE', 'N° ENGAGEMENT', 'ENTITE', 'DETAIL DESIGNATION', 'TOTAL CP', 'TOTAL CE', 'PAIEMENTS TOTAL', 'TOTAL PREV']
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
          <p className="text-gray-500 text-sm">Chargement des données...</p>
        </div>
      </div>
    )
  }

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
            Exercice : 2026
          </Badge>
          <Badge className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px]">
            Période : {new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
          </Badge>
          <Badge className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px]">
            Programme : {selectedProgramme === 'all' ? 'Tous' : selectedProgramme}
          </Badge>
          <Badge className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px]">
            Projet : {selectedProjet === 'all' ? 'Tous' : selectedProjet}
          </Badge>
          <Badge className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px]">
            entité : {selectedEntite === 'all' ? 'Toutes' : selectedEntite}
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
      {/* ═══════════ SECTION 1 : CRÉDITS ═══════════ */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-1 h-5 rounded-full bg-gradient-to-b from-blue-500 to-indigo-600" />
          <h3 className="text-sm font-bold text-gray-800 tracking-wide uppercase">Crédits</h3>
          <span className="text-[11px] text-gray-400 font-medium">(M DH)</span>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Crédits Reportés */}
          <div className="kpi-card-premium bg-white rounded-xl border border-gray-100 overflow-hidden cursor-default">
            <div className="h-1.5 bg-gradient-to-r from-blue-400 to-blue-600" />
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="kpi-icon-wrap w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center transition-transform">
                  <RotateCcw className="w-5 h-5 text-blue-600" />
                </div>
                <Badge className="bg-blue-50 text-blue-700 border-blue-200 text-[10px] font-semibold rounded-full px-2.5">Reports</Badge>
              </div>
              <p className="text-2xl font-black text-gray-900 tracking-tight">{formatMillions(kpis.totalReports)}</p>
              <p className="text-[11px] text-gray-400 mt-1.5 font-medium">
                {kpis.totalCP > 0 ? formatPercent((kpis.totalReports / kpis.totalCP) * 100) : '0,0%'} du budget total
              </p>
            </div>
          </div>

          {/* Crédits Nouveaux */}
          <div className="kpi-card-premium bg-white rounded-xl border border-gray-100 overflow-hidden cursor-default">
            <div className="h-1.5 bg-gradient-to-r from-emerald-400 to-emerald-600" />
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="kpi-icon-wrap w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center transition-transform">
                  <TrendingUp className="w-5 h-5 text-emerald-600" />
                </div>
                <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] font-semibold rounded-full px-2.5">Nouveaux</Badge>
              </div>
              <p className="text-2xl font-black text-gray-900 tracking-tight">{formatMillions(kpis.totalNouveaux)}</p>
              <p className="text-[11px] text-gray-400 mt-1.5 font-medium">
                {kpis.totalCP > 0 ? formatPercent((kpis.totalNouveaux / kpis.totalCP) * 100) : '0,0%'} du budget total
              </p>
            </div>
          </div>

          {/* Total CP */}
          <div className="kpi-card-premium bg-white rounded-xl border border-gray-100 overflow-hidden cursor-default">
            <div className="h-1.5 bg-gradient-to-r from-violet-400 to-violet-600" />
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="kpi-icon-wrap w-10 h-10 rounded-full bg-violet-50 flex items-center justify-center transition-transform">
                  <Scale className="w-5 h-5 text-violet-600" />
                </div>
                <Badge className="bg-violet-50 text-violet-700 border-violet-200 text-[10px] font-semibold rounded-full px-2.5">CP</Badge>
              </div>
              <p className="text-2xl font-black text-gray-900 tracking-tight">{formatMillions(kpis.totalCP)}</p>
              <p className="text-[11px] text-gray-400 mt-1.5 font-medium">Crédits de paiement (LFI)</p>
            </div>
          </div>

          {/* Total CE */}
          <div className="kpi-card-premium bg-white rounded-xl border border-gray-100 overflow-hidden cursor-default">
            <div className="h-1.5 bg-gradient-to-r from-indigo-400 to-indigo-600" />
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="kpi-icon-wrap w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center transition-transform">
                  <Landmark className="w-5 h-5 text-indigo-600" />
                </div>
                <Badge className="bg-indigo-50 text-indigo-700 border-indigo-200 text-[10px] font-semibold rounded-full px-2.5">CE</Badge>
              </div>
              <p className="text-2xl font-black text-gray-900 tracking-tight">{formatMillions(kpis.totalCE)}</p>
              <p className="text-[11px] text-gray-400 mt-1.5 font-medium">Crédits d&apos;engagement</p>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════ SECTION 2 : ENGAGEMENTS ═══════════ */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-1 h-5 rounded-full bg-gradient-to-b from-emerald-500 to-teal-600" />
          <h3 className="text-sm font-bold text-gray-800 tracking-wide uppercase">Engagements</h3>
          <span className="text-[11px] text-gray-400 font-medium">(M DH)</span>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Engagement CP */}
          <div className="kpi-card-premium rounded-xl border border-emerald-100 overflow-hidden cursor-default" style={{ background: 'linear-gradient(135deg, #ffffff 0%, #f0fdf4 100%)' }}>
            <div className="h-1.5 bg-gradient-to-r from-emerald-400 to-teal-500" />
            <div className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="kpi-icon-wrap w-11 h-11 rounded-full bg-emerald-100 flex items-center justify-center transition-transform">
                      <TrendingUp className="w-5 h-5 text-emerald-700" />
                    </div>
                    <span className="text-sm font-semibold text-gray-600">Engagement CP</span>
                  </div>
                  <p className="text-3xl font-black text-gray-900 tracking-tight">{formatMillions(kpis.totalEngCP)}</p>
                </div>
                <div className="text-right">
                  <span className={`inline-flex items-center gap-1 text-sm font-bold ${tauxColor(kpis.tauxEngagement)}`}>
                    {kpis.tauxEngagement >= 80 ? '✓' : kpis.tauxEngagement >= 50 ? '⚠' : '✗'}
                    {formatPercent(kpis.tauxEngagement)}
                  </span>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    {kpis.tauxEngagement >= 80 ? 'Bon' : kpis.tauxEngagement >= 50 ? 'Moyen' : 'Faible'}
                  </p>
                </div>
              </div>
              <div className="mt-3">
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`kpi-progress-bar h-full rounded-full ${kpis.tauxEngagement >= 80 ? 'bg-gradient-to-r from-emerald-400 to-emerald-600' : kpis.tauxEngagement >= 50 ? 'bg-gradient-to-r from-amber-400 to-amber-500' : 'bg-gradient-to-r from-red-400 to-red-500'}`} style={{ width: `${Math.min(kpis.tauxEngagement, 100)}%` }} />
                </div>
                <div className="flex justify-between mt-1.5">
                  <span className="text-[10px] text-gray-400">0%</span>
                  <span className="text-[10px] text-gray-400">Reste : {formatMillions(kpis.disponible)}</span>
                  <span className="text-[10px] text-gray-400">100%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Engagement CE */}
          <div className="kpi-card-premium rounded-xl border border-teal-100 overflow-hidden cursor-default" style={{ background: 'linear-gradient(135deg, #ffffff 0%, #f0fdfa 100%)' }}>
            <div className="h-1.5 bg-gradient-to-r from-teal-400 to-cyan-500" />
            <div className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="kpi-icon-wrap w-11 h-11 rounded-full bg-teal-100 flex items-center justify-center transition-transform">
                      <Landmark className="w-5 h-5 text-teal-700" />
                    </div>
                    <span className="text-sm font-semibold text-gray-600">Engagement CE</span>
                  </div>
                  <p className="text-3xl font-black text-gray-900 tracking-tight">{formatMillions(kpis.totalEngCE)}</p>
                </div>
                <div className="text-right">
                  {(() => {
                    const tauxCE = kpis.totalCE > 0 ? (kpis.totalEngCE / kpis.totalCE) * 100 : 0
                    return (
                      <>
                        <span className={`inline-flex items-center gap-1 text-sm font-bold ${tauxColor(tauxCE)}`}>
                          {tauxCE >= 80 ? '✓' : tauxCE >= 50 ? '⚠' : '✗'}
                          {formatPercent(tauxCE)}
                        </span>
                        <p className="text-[11px] text-gray-400 mt-0.5">
                          {tauxCE >= 80 ? 'Bon' : tauxCE >= 50 ? 'Moyen' : 'Faible'}
                        </p>
                      </>
                    )
                  })()}
                </div>
              </div>
              <div className="mt-3">
                {(() => {
                  const tauxCE = kpis.totalCE > 0 ? (kpis.totalEngCE / kpis.totalCE) * 100 : 0
                  return (
                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className={`kpi-progress-bar h-full rounded-full ${tauxCE >= 80 ? 'bg-gradient-to-r from-emerald-400 to-emerald-600' : tauxCE >= 50 ? 'bg-gradient-to-r from-amber-400 to-amber-500' : 'bg-gradient-to-r from-red-400 to-red-500'}`} style={{ width: `${Math.min(tauxCE, 100)}%` }} />
                    </div>
                  )
                })()}
                <div className="flex justify-between mt-1.5">
                  <span className="text-[10px] text-gray-400">0%</span>
                  <span className="text-[10px] text-gray-400">Reste : {formatMillions(kpis.totalCE - kpis.totalEngCE)}</span>
                  <span className="text-[10px] text-gray-400">100%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════ SECTION 3 : ORDONNANCEMENTS & PAIEMENTS ═══════════ */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-1 h-5 rounded-full bg-gradient-to-b from-blue-500 to-cyan-600" />
          <h3 className="text-sm font-bold text-gray-800 tracking-wide uppercase">Ordonnancements & Paiements</h3>
          <span className="text-[11px] text-gray-400 font-medium">(M DH)</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Ord. sur Reports */}
          <div className="kpi-card-premium bg-white rounded-xl border border-gray-100 overflow-hidden cursor-default">
            <div className="h-1.5 bg-gradient-to-r from-sky-400 to-blue-500" />
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="kpi-icon-wrap w-10 h-10 rounded-full bg-sky-50 flex items-center justify-center transition-transform">
                  <RotateCcw className="w-5 h-5 text-sky-600" />
                </div>
                <Badge className="bg-sky-50 text-sky-700 border-sky-200 text-[10px] font-semibold rounded-full px-2.5">Reports</Badge>
              </div>
              <p className="text-2xl font-black text-gray-900 tracking-tight">{formatMillions(kpis.totalOrdReports)}</p>
              <p className="text-[11px] text-gray-400 mt-1.5 font-medium">
                Taux : <span className={tauxColor(kpis.totalEngReports > 0 ? (kpis.totalOrdReports / kpis.totalEngReports) * 100 : 0)}>{formatPercent(kpis.totalEngReports > 0 ? (kpis.totalOrdReports / kpis.totalEngReports) * 100 : 0)}</span> / eng.
              </p>
            </div>
          </div>

          {/* Ord. sur Nouveaux */}
          <div className="kpi-card-premium bg-white rounded-xl border border-gray-100 overflow-hidden cursor-default">
            <div className="h-1.5 bg-gradient-to-r from-cyan-400 to-teal-500" />
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="kpi-icon-wrap w-10 h-10 rounded-full bg-cyan-50 flex items-center justify-center transition-transform">
                  <TrendingUp className="w-5 h-5 text-cyan-600" />
                </div>
                <Badge className="bg-cyan-50 text-cyan-700 border-cyan-200 text-[10px] font-semibold rounded-full px-2.5">Nouveaux</Badge>
              </div>
              <p className="text-2xl font-black text-gray-900 tracking-tight">{formatMillions(kpis.totalOrdNouveaux)}</p>
              <p className="text-[11px] text-gray-400 mt-1.5 font-medium">
                Taux : <span className={tauxColor(kpis.totalEngNouveaux > 0 ? (kpis.totalOrdNouveaux / kpis.totalEngNouveaux) * 100 : 0)}>{formatPercent(kpis.totalEngNouveaux > 0 ? (kpis.totalOrdNouveaux / kpis.totalEngNouveaux) * 100 : 0)}</span> / eng.
              </p>
            </div>
          </div>

          {/* Total Ordonnancements */}
          <div className="kpi-card-premium rounded-xl border border-blue-100 overflow-hidden cursor-default" style={{ background: 'linear-gradient(135deg, #ffffff 0%, #eff6ff 100%)' }}>
            <div className="h-1.5 bg-gradient-to-r from-blue-500 to-indigo-600" />
            <div className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="kpi-icon-wrap w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center transition-transform">
                    <Wallet className="w-5 h-5 text-blue-700" />
                  </div>
                  <span className="text-sm font-semibold text-gray-600">Total Ord.</span>
                </div>
                <span className={`inline-flex items-center gap-1 text-sm font-bold ${tauxColor(kpis.tauxOrdonnement)}`}>
                  {kpis.tauxOrdonnement >= 80 ? '✓' : kpis.tauxOrdonnement >= 50 ? '⚠' : '✗'}
                  {formatPercent(kpis.tauxOrdonnement)}
                </span>
              </div>
              <p className="text-2xl font-black text-gray-900 tracking-tight">{formatMillions(kpis.totalOrd)}</p>
              <div className="mt-2">
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`kpi-progress-bar h-full rounded-full ${kpis.tauxOrdonnement >= 80 ? 'bg-gradient-to-r from-emerald-400 to-emerald-600' : kpis.tauxOrdonnement >= 50 ? 'bg-gradient-to-r from-amber-400 to-amber-500' : 'bg-gradient-to-r from-red-400 to-red-500'}`} style={{ width: `${Math.min(kpis.tauxOrdonnement, 100)}%` }} />
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-[10px] text-gray-400">{kpis.tauxOrdonnement >= 80 ? 'Bon' : kpis.tauxOrdonnement >= 50 ? 'Moyen' : 'Faible'}</span>
                  <span className="text-[10px] text-gray-400">Paiements : {formatMillions(kpis.totalPaiements)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════ SECTION 4 : PRÉVISIONS & DISPONIBLE ═══════════ */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-1 h-5 rounded-full bg-gradient-to-b from-amber-500 to-orange-600" />
          <h3 className="text-sm font-bold text-gray-800 tracking-wide uppercase">Prévisions & Disponible</h3>
          <span className="text-[11px] text-gray-400 font-medium">(M DH)</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Prévisions */}
          <div className="kpi-card-premium bg-white rounded-xl border border-gray-100 overflow-hidden cursor-default">
            <div className="h-1.5 bg-gradient-to-r from-amber-400 to-orange-500" />
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="kpi-icon-wrap w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center transition-transform">
                  <FileSpreadsheet className="w-5 h-5 text-amber-600" />
                </div>
                <Badge className="bg-amber-50 text-amber-700 border-amber-200 text-[10px] font-semibold rounded-full px-2.5">Prévis.</Badge>
              </div>
              <p className="text-2xl font-black text-gray-900 tracking-tight">{formatMillions(kpis.totalPrevisions)}</p>
              <p className="text-[11px] text-gray-400 mt-1.5 font-medium">
                Réalisation : <span className={tauxColor(kpis.totalPrevisions > 0 ? (kpis.totalOrd / kpis.totalPrevisions) * 100 : 0)}>{kpis.totalPrevisions > 0 ? formatPercent((kpis.totalOrd / kpis.totalPrevisions) * 100) : '0,0%'}</span>
              </p>
            </div>
          </div>

          {/* Écart Prévisions/Réalisé */}
          <div className="kpi-card-premium bg-white rounded-xl border border-gray-100 overflow-hidden cursor-default">
            <div className="h-1.5 bg-gradient-to-r from-orange-400 to-red-400" />
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="kpi-icon-wrap w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center transition-transform">
                  <Info className="w-5 h-5 text-orange-600" />
                </div>
                <Badge className="bg-orange-50 text-orange-700 border-orange-200 text-[10px] font-semibold rounded-full px-2.5">Écart</Badge>
              </div>
              <p className="text-2xl font-black text-gray-900 tracking-tight">{formatMillions(kpis.totalPrevisions - kpis.totalOrd)}</p>
              <p className="text-[11px] text-gray-400 mt-1.5 font-medium">
                {kpis.totalPrevisions > kpis.totalOrd ? 'Prévisions supérieures' : 'Réalisé supérieur'}
              </p>
            </div>
          </div>

          {/* Disponible */}
          <div className="kpi-card-premium bg-white rounded-xl border border-gray-100 overflow-hidden cursor-default">
            <div className="h-1.5 bg-gradient-to-r from-violet-400 to-purple-500" />
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="kpi-icon-wrap w-10 h-10 rounded-full bg-violet-50 flex items-center justify-center transition-transform">
                  <Landmark className="w-5 h-5 text-violet-600" />
                </div>
                <Badge className="bg-violet-50 text-violet-700 border-violet-200 text-[10px] font-semibold rounded-full px-2.5">Reste</Badge>
              </div>
              <p className="text-2xl font-black text-gray-900 tracking-tight">{formatMillions(kpis.disponible)}</p>
              <p className="text-[11px] text-gray-400 mt-1.5 font-medium">
                {kpis.totalCP > 0 ? formatPercent((kpis.disponible / kpis.totalCP) * 100) : '0,0%'} du budget CP
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════ TABLEAU : ANALYSE PAR PROGRAMME ═══════════ */}
      <Card className="border border-gray-100 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold text-gray-700">
              Analyse par programme (M DH)
            </CardTitle>
            <button onClick={() => handleNavChange('project')} className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1">
              Détails <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-indigo-50/60">
                  <TableHead className="text-xs font-semibold text-indigo-700">Programme</TableHead>
                  <TableHead className="text-xs font-semibold text-indigo-700 text-right">Budget CP</TableHead>
                  <TableHead className="text-xs font-semibold text-indigo-700 text-right">Eng. CP</TableHead>
                  <TableHead className="text-xs font-semibold text-indigo-700 text-right">Taux eng. CP</TableHead>
                  <TableHead className="text-xs font-semibold text-indigo-700 text-right">Total CE</TableHead>
                  <TableHead className="text-xs font-semibold text-indigo-700 text-right">Eng. CE</TableHead>
                  <TableHead className="text-xs font-semibold text-indigo-700 text-right">Taux eng. CE</TableHead>
                  <TableHead className="text-xs font-semibold text-indigo-700 text-right">Ordonn.</TableHead>
                  <TableHead className="text-xs font-semibold text-indigo-700 text-right">Taux ord.</TableHead>
                  <TableHead className="text-xs font-semibold text-indigo-700 text-right">Paiements</TableHead>
                  <TableHead className="text-xs font-semibold text-indigo-700 text-right">Prévisions</TableHead>
                  <TableHead className="text-xs font-semibold text-indigo-700 text-right">Disponible</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {analysisByProgramme.map(p => (
                  <TableRow key={p.name} className="hover:bg-gray-50">
                    <TableCell className="text-xs font-medium text-gray-900 max-w-[200px] truncate">{p.name}</TableCell>
                    <TableCell className="text-xs text-gray-700 text-right">{formatMillions(p.cp)}</TableCell>
                    <TableCell className="text-xs text-gray-700 text-right">{formatMillions(p.engCP)}</TableCell>
                    <TableCell className="text-xs text-right"><span className={tauxColor(p.tauxEngagement)}>{formatPercent(p.tauxEngagement)}</span></TableCell>
                    <TableCell className="text-xs text-gray-700 text-right">{formatMillions(p.ce)}</TableCell>
                    <TableCell className="text-xs text-gray-700 text-right">{formatMillions(p.engCE)}</TableCell>
                    <TableCell className="text-xs text-right"><span className={tauxColor(p.tauxEngagementCE)}>{p.ce > 0 ? formatPercent(p.tauxEngagementCE) : '0,0%'}</span></TableCell>
                    <TableCell className="text-xs text-gray-700 text-right">{formatMillions(p.ord)}</TableCell>
                    <TableCell className="text-xs text-right"><span className={tauxColor(p.tauxOrdonnement)}>{formatPercent(p.tauxOrdonnement)}</span></TableCell>
                    <TableCell className="text-xs text-gray-700 text-right">{formatMillions(p.paiements)}</TableCell>
                    <TableCell className="text-xs text-gray-700 text-right">{formatMillions(p.previsions)}</TableCell>
                    <TableCell className="text-xs text-gray-700 text-right">{formatMillions(p.disponible)}</TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-indigo-50/40 font-bold">
                  <TableCell className="text-xs font-bold text-gray-900">TOTAL</TableCell>
                  <TableCell className="text-xs font-bold text-gray-900 text-right">{formatMillions(kpis.totalCP)}</TableCell>
                  <TableCell className="text-xs font-bold text-gray-900 text-right">{formatMillions(kpis.totalEngCP)}</TableCell>
                  <TableCell className="text-xs font-bold text-right"><span className={tauxColor(kpis.tauxEngagement)}>{formatPercent(kpis.tauxEngagement)}</span></TableCell>
                  <TableCell className="text-xs font-bold text-gray-900 text-right">{formatMillions(kpis.totalCE)}</TableCell>
                  <TableCell className="text-xs font-bold text-gray-900 text-right">{formatMillions(kpis.totalEngCE)}</TableCell>
                  <TableCell className="text-xs font-bold text-right"><span className={tauxColor(kpis.totalCE > 0 ? (kpis.totalEngCE / kpis.totalCE) * 100 : 0)}>{kpis.totalCE > 0 ? formatPercent((kpis.totalEngCE / kpis.totalCE) * 100) : '0,0%'}</span></TableCell>
                  <TableCell className="text-xs font-bold text-gray-900 text-right">{formatMillions(kpis.totalOrd)}</TableCell>
                  <TableCell className="text-xs font-bold text-right"><span className={tauxColor(kpis.tauxOrdonnement)}>{formatPercent(kpis.tauxOrdonnement)}</span></TableCell>
                  <TableCell className="text-xs font-bold text-gray-900 text-right">{formatMillions(kpis.totalPaiements)}</TableCell>
                  <TableCell className="text-xs font-bold text-gray-900 text-right">{formatMillions(kpis.totalPrevisions)}</TableCell>
                  <TableCell className="text-xs font-bold text-gray-900 text-right">{formatMillions(kpis.disponible)}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* ═══════════ TABLEAU : ANALYSE PAR PROJET ═══════════ */}
      <Card className="border border-gray-100 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold text-gray-700">
              Analyse par projet (M DH)
            </CardTitle>
            <button onClick={() => handleNavChange('program')} className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1">
              Détails <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-emerald-50/60">
                  <TableHead className="text-xs font-semibold text-emerald-700">Projet</TableHead>
                  <TableHead className="text-xs font-semibold text-emerald-700 text-right">Budget CP</TableHead>
                  <TableHead className="text-xs font-semibold text-emerald-700 text-right">Eng. CP</TableHead>
                  <TableHead className="text-xs font-semibold text-emerald-700 text-right">Taux eng. CP</TableHead>
                  <TableHead className="text-xs font-semibold text-emerald-700 text-right">Total CE</TableHead>
                  <TableHead className="text-xs font-semibold text-emerald-700 text-right">Eng. CE</TableHead>
                  <TableHead className="text-xs font-semibold text-emerald-700 text-right">Taux eng. CE</TableHead>
                  <TableHead className="text-xs font-semibold text-emerald-700 text-right">Ordonn.</TableHead>
                  <TableHead className="text-xs font-semibold text-emerald-700 text-right">Taux ord.</TableHead>
                  <TableHead className="text-xs font-semibold text-emerald-700 text-right">Paiements</TableHead>
                  <TableHead className="text-xs font-semibold text-emerald-700 text-right">Prévisions</TableHead>
                  <TableHead className="text-xs font-semibold text-emerald-700 text-right">Disponible</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {analysisByGroup.map(g => (
                  <TableRow key={g.name} className="hover:bg-gray-50">
                    <TableCell className="text-xs font-medium text-gray-900">{g.name}</TableCell>
                    <TableCell className="text-xs text-gray-700 text-right">{formatMillions(g.cp)}</TableCell>
                    <TableCell className="text-xs text-gray-700 text-right">{formatMillions(g.engCP)}</TableCell>
                    <TableCell className="text-xs text-right"><span className={tauxColor(g.tauxEngagement)}>{formatPercent(g.tauxEngagement)}</span></TableCell>
                    <TableCell className="text-xs text-gray-700 text-right">{formatMillions(g.ce)}</TableCell>
                    <TableCell className="text-xs text-gray-700 text-right">{formatMillions(g.engCE)}</TableCell>
                    <TableCell className="text-xs text-right"><span className={tauxColor(g.tauxEngagementCE)}>{g.ce > 0 ? formatPercent(g.tauxEngagementCE) : '0,0%'}</span></TableCell>
                    <TableCell className="text-xs text-gray-700 text-right">{formatMillions(g.ord)}</TableCell>
                    <TableCell className="text-xs text-right"><span className={tauxColor(g.tauxOrdonnement)}>{formatPercent(g.tauxOrdonnement)}</span></TableCell>
                    <TableCell className="text-xs text-gray-700 text-right">{formatMillions(g.paiements)}</TableCell>
                    <TableCell className="text-xs text-gray-700 text-right">{formatMillions(g.previsions)}</TableCell>
                    <TableCell className="text-xs text-gray-700 text-right">{formatMillions(g.disponible)}</TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-emerald-50/40 font-bold">
                  <TableCell className="text-xs font-bold text-gray-900">TOTAL</TableCell>
                  <TableCell className="text-xs font-bold text-gray-900 text-right">{formatMillions(kpis.totalCP)}</TableCell>
                  <TableCell className="text-xs font-bold text-gray-900 text-right">{formatMillions(kpis.totalEngCP)}</TableCell>
                  <TableCell className="text-xs font-bold text-right"><span className={tauxColor(kpis.tauxEngagement)}>{formatPercent(kpis.tauxEngagement)}</span></TableCell>
                  <TableCell className="text-xs font-bold text-gray-900 text-right">{formatMillions(kpis.totalCE)}</TableCell>
                  <TableCell className="text-xs font-bold text-gray-900 text-right">{formatMillions(kpis.totalEngCE)}</TableCell>
                  <TableCell className="text-xs font-bold text-right"><span className={tauxColor(kpis.totalCE > 0 ? (kpis.totalEngCE / kpis.totalCE) * 100 : 0)}>{kpis.totalCE > 0 ? formatPercent((kpis.totalEngCE / kpis.totalCE) * 100) : '0,0%'}</span></TableCell>
                  <TableCell className="text-xs font-bold text-gray-900 text-right">{formatMillions(kpis.totalOrd)}</TableCell>
                  <TableCell className="text-xs font-bold text-right"><span className={tauxColor(kpis.tauxOrdonnement)}>{formatPercent(kpis.tauxOrdonnement)}</span></TableCell>
                  <TableCell className="text-xs font-bold text-gray-900 text-right">{formatMillions(kpis.totalPaiements)}</TableCell>
                  <TableCell className="text-xs font-bold text-gray-900 text-right">{formatMillions(kpis.totalPrevisions)}</TableCell>
                  <TableCell className="text-xs font-bold text-gray-900 text-right">{formatMillions(kpis.disponible)}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* ═══════════ TABLEAU : ANALYSE PAR ENTITÉ ═══════════ */}
      <Card className="border border-gray-100 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold text-gray-700">
              Analyse par entité (M DH)
            </CardTitle>
            <button onClick={() => handleNavChange('entity')} className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1">
              Détails <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/60">
                  <TableHead className="text-xs font-semibold text-slate-700">Entité</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-700 text-right">Budget CP</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-700 text-right">Eng. CP</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-700 text-right">Taux eng. CP</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-700 text-right">Total CE</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-700 text-right">Eng. CE</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-700 text-right">Taux eng. CE</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-700 text-right">Ordonn.</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-700 text-right">Taux ord.</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-700 text-right">Paiements</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-700 text-right">Prévisions</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-700 text-right">Disponible</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {analysisByEntity.map(e => (
                  <TableRow key={e.name} className="hover:bg-gray-50">
                    <TableCell className="text-xs font-medium text-gray-900">{e.name}</TableCell>
                    <TableCell className="text-xs text-gray-700 text-right">{formatMillions(e.cp)}</TableCell>
                    <TableCell className="text-xs text-gray-700 text-right">{formatMillions(e.engCP)}</TableCell>
                    <TableCell className="text-xs text-right"><span className={tauxColor(e.tauxEngagement)}>{formatPercent(e.tauxEngagement)}</span></TableCell>
                    <TableCell className="text-xs text-gray-700 text-right">{formatMillions(e.ce)}</TableCell>
                    <TableCell className="text-xs text-gray-700 text-right">{formatMillions(e.engCE)}</TableCell>
                    <TableCell className="text-xs text-right"><span className={tauxColor(e.tauxEngagementCE)}>{e.ce > 0 ? formatPercent(e.tauxEngagementCE) : '0,0%'}</span></TableCell>
                    <TableCell className="text-xs text-gray-700 text-right">{formatMillions(e.ord)}</TableCell>
                    <TableCell className="text-xs text-right"><span className={tauxColor(e.tauxOrdonnement)}>{formatPercent(e.tauxOrdonnement)}</span></TableCell>
                    <TableCell className="text-xs text-gray-700 text-right">{formatMillions(e.paiements)}</TableCell>
                    <TableCell className="text-xs text-gray-700 text-right">{formatMillions(e.previsions)}</TableCell>
                    <TableCell className="text-xs text-gray-700 text-right">{formatMillions(e.disponible)}</TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-slate-50/40 font-bold">
                  <TableCell className="text-xs font-bold text-gray-900">TOTAL</TableCell>
                  <TableCell className="text-xs font-bold text-gray-900 text-right">{formatMillions(kpis.totalCP)}</TableCell>
                  <TableCell className="text-xs font-bold text-gray-900 text-right">{formatMillions(kpis.totalEngCP)}</TableCell>
                  <TableCell className="text-xs font-bold text-right"><span className={tauxColor(kpis.tauxEngagement)}>{formatPercent(kpis.tauxEngagement)}</span></TableCell>
                  <TableCell className="text-xs font-bold text-gray-900 text-right">{formatMillions(kpis.totalCE)}</TableCell>
                  <TableCell className="text-xs font-bold text-gray-900 text-right">{formatMillions(kpis.totalEngCE)}</TableCell>
                  <TableCell className="text-xs font-bold text-right"><span className={tauxColor(kpis.totalCE > 0 ? (kpis.totalEngCE / kpis.totalCE) * 100 : 0)}>{kpis.totalCE > 0 ? formatPercent((kpis.totalEngCE / kpis.totalCE) * 100) : '0,0%'}</span></TableCell>
                  <TableCell className="text-xs font-bold text-gray-900 text-right">{formatMillions(kpis.totalOrd)}</TableCell>
                  <TableCell className="text-xs font-bold text-right"><span className={tauxColor(kpis.tauxOrdonnement)}>{formatPercent(kpis.tauxOrdonnement)}</span></TableCell>
                  <TableCell className="text-xs font-bold text-gray-900 text-right">{formatMillions(kpis.totalPaiements)}</TableCell>
                  <TableCell className="text-xs font-bold text-gray-900 text-right">{formatMillions(kpis.totalPrevisions)}</TableCell>
                  <TableCell className="text-xs font-bold text-gray-900 text-right">{formatMillions(kpis.disponible)}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* ═══════════ SECTION 5 : PRÉVISIONS ORDONNANCEMENT CUMULÉES PAR ENTITÉ ═══════════ */}
      <Card className="border border-gray-100 shadow-sm overflow-hidden">
        <CardHeader className="pb-3 bg-gradient-to-r from-teal-50/50 to-cyan-50/50 border-b border-teal-100/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center">
                <FileSpreadsheet className="w-4 h-4 text-white" />
              </div>
              <div>
                <CardTitle className="text-sm font-bold text-gray-800">Prévisions d&apos;ordonnancement cumulées par entité</CardTitle>
                <p className="text-[11px] text-gray-400 mt-0.5">Taux de réalisation = Ordonnancements / Prévisions cumulées</p>
              </div>
            </div>
            <span className="text-[11px] text-gray-400 font-medium">(M DH)</span>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-teal-50/60">
                  <TableHead className="text-xs font-bold text-teal-800 min-w-[100px]">Entité</TableHead>
                  <TableHead className="text-xs font-bold text-teal-800 text-right">Ordonn.</TableHead>
                  <TableHead className="text-xs font-bold text-teal-700 text-center bg-teal-50/30" colSpan={2}>Fin Juin</TableHead>
                  <TableHead className="text-xs font-bold text-cyan-700 text-center bg-cyan-50/30" colSpan={2}>Fin Septembre</TableHead>
                  <TableHead className="text-xs font-bold text-sky-700 text-center bg-sky-50/30" colSpan={2}>Fin Octobre</TableHead>
                  <TableHead className="text-xs font-bold text-indigo-700 text-center bg-indigo-50/30" colSpan={2}>Fin Novembre</TableHead>
                </TableRow>
                <TableRow className="bg-teal-50/30">
                  <TableHead className="text-[10px] text-gray-500" />
                  <TableHead className="text-[10px] text-gray-500 text-right" />
                  <TableHead className="text-[10px] font-semibold text-teal-600 text-right">Prév.</TableHead>
                  <TableHead className="text-[10px] font-semibold text-teal-600 text-right">Taux</TableHead>
                  <TableHead className="text-[10px] font-semibold text-cyan-600 text-right">Prév.</TableHead>
                  <TableHead className="text-[10px] font-semibold text-cyan-600 text-right">Taux</TableHead>
                  <TableHead className="text-[10px] font-semibold text-sky-600 text-right">Prév.</TableHead>
                  <TableHead className="text-[10px] font-semibold text-sky-600 text-right">Taux</TableHead>
                  <TableHead className="text-[10px] font-semibold text-indigo-600 text-right">Prév.</TableHead>
                  <TableHead className="text-[10px] font-semibold text-indigo-600 text-right">Taux</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {analysisByEntity.map(e => {
                  const tauxJuin = e.cumulPrevJuin > 0 ? (e.ord / e.cumulPrevJuin) * 100 : 0
                  const tauxSept = e.cumulPrevSeptembre > 0 ? (e.ord / e.cumulPrevSeptembre) * 100 : 0
                  const tauxOct = e.cumulPrevOctobre > 0 ? (e.ord / e.cumulPrevOctobre) * 100 : 0
                  const tauxNov = e.cumulPrevNovembre > 0 ? (e.ord / e.cumulPrevNovembre) * 100 : 0
                  return (
                    <TableRow key={e.name} className="hover:bg-teal-50/30 transition-colors">
                      <TableCell className="text-xs font-semibold text-gray-900">{e.name}</TableCell>
                      <TableCell className="text-xs text-gray-700 text-right font-medium">{formatMillions(e.ord)}</TableCell>
                      <TableCell className="text-xs text-gray-700 text-right bg-teal-50/20">{formatMillions(e.cumulPrevJuin)}</TableCell>
                      <TableCell className="text-xs text-right bg-teal-50/20">
                        <div className="flex items-center justify-end gap-1">
                          <div className="w-12 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div className={`kpi-progress-bar h-full rounded-full ${tauxJuin >= 80 ? 'bg-gradient-to-r from-emerald-400 to-emerald-600' : tauxJuin >= 50 ? 'bg-gradient-to-r from-amber-400 to-amber-500' : 'bg-gradient-to-r from-red-400 to-red-500'}`} style={{ width: `${Math.min(tauxJuin, 100)}%` }} />
                          </div>
                          <span className={`text-[10px] font-bold ${tauxColor(tauxJuin)}`}>
                            {tauxJuin >= 80 ? '✓' : tauxJuin >= 50 ? '⚠' : e.cumulPrevJuin > 0 ? '✗' : '—'}
                          </span>
                          <span className={`text-[10px] font-semibold ${tauxColor(tauxJuin)}`}>{e.cumulPrevJuin > 0 ? formatPercent(tauxJuin) : '—'}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-gray-700 text-right bg-cyan-50/20">{formatMillions(e.cumulPrevSeptembre)}</TableCell>
                      <TableCell className="text-xs text-right bg-cyan-50/20">
                        <div className="flex items-center justify-end gap-1">
                          <div className="w-12 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div className={`kpi-progress-bar h-full rounded-full ${tauxSept >= 80 ? 'bg-gradient-to-r from-emerald-400 to-emerald-600' : tauxSept >= 50 ? 'bg-gradient-to-r from-amber-400 to-amber-500' : 'bg-gradient-to-r from-red-400 to-red-500'}`} style={{ width: `${Math.min(tauxSept, 100)}%` }} />
                          </div>
                          <span className={`text-[10px] font-bold ${tauxColor(tauxSept)}`}>
                            {tauxSept >= 80 ? '✓' : tauxSept >= 50 ? '⚠' : e.cumulPrevSeptembre > 0 ? '✗' : '—'}
                          </span>
                          <span className={`text-[10px] font-semibold ${tauxColor(tauxSept)}`}>{e.cumulPrevSeptembre > 0 ? formatPercent(tauxSept) : '—'}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-gray-700 text-right bg-sky-50/20">{formatMillions(e.cumulPrevOctobre)}</TableCell>
                      <TableCell className="text-xs text-right bg-sky-50/20">
                        <div className="flex items-center justify-end gap-1">
                          <div className="w-12 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div className={`kpi-progress-bar h-full rounded-full ${tauxOct >= 80 ? 'bg-gradient-to-r from-emerald-400 to-emerald-600' : tauxOct >= 50 ? 'bg-gradient-to-r from-amber-400 to-amber-500' : 'bg-gradient-to-r from-red-400 to-red-500'}`} style={{ width: `${Math.min(tauxOct, 100)}%` }} />
                          </div>
                          <span className={`text-[10px] font-bold ${tauxColor(tauxOct)}`}>
                            {tauxOct >= 80 ? '✓' : tauxOct >= 50 ? '⚠' : e.cumulPrevOctobre > 0 ? '✗' : '—'}
                          </span>
                          <span className={`text-[10px] font-semibold ${tauxColor(tauxOct)}`}>{e.cumulPrevOctobre > 0 ? formatPercent(tauxOct) : '—'}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-gray-700 text-right bg-indigo-50/20">{formatMillions(e.cumulPrevNovembre)}</TableCell>
                      <TableCell className="text-xs text-right bg-indigo-50/20">
                        <div className="flex items-center justify-end gap-1">
                          <div className="w-12 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div className={`kpi-progress-bar h-full rounded-full ${tauxNov >= 80 ? 'bg-gradient-to-r from-emerald-400 to-emerald-600' : tauxNov >= 50 ? 'bg-gradient-to-r from-amber-400 to-amber-500' : 'bg-gradient-to-r from-red-400 to-red-500'}`} style={{ width: `${Math.min(tauxNov, 100)}%` }} />
                          </div>
                          <span className={`text-[10px] font-bold ${tauxColor(tauxNov)}`}>
                            {tauxNov >= 80 ? '✓' : tauxNov >= 50 ? '⚠' : e.cumulPrevNovembre > 0 ? '✗' : '—'}
                          </span>
                          <span className={`text-[10px] font-semibold ${tauxColor(tauxNov)}`}>{e.cumulPrevNovembre > 0 ? formatPercent(tauxNov) : '—'}</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
                {/* Total row */}
                <TableRow className="bg-gradient-to-r from-teal-50/60 to-cyan-50/60 font-bold">
                  <TableCell className="text-xs font-bold text-gray-900">TOTAL</TableCell>
                  <TableCell className="text-xs font-bold text-gray-900 text-right">{formatMillions(kpis.totalOrd)}</TableCell>
                  <TableCell className="text-xs font-bold text-gray-900 text-right bg-teal-50/30">{formatMillions(kpis.cumulPrevJuin)}</TableCell>
                  <TableCell className="text-xs text-right bg-teal-50/30">
                    <div className="flex items-center justify-end gap-1">
                      <span className={`text-[10px] font-bold ${tauxColor(kpis.cumulPrevJuin > 0 ? (kpis.totalOrd / kpis.cumulPrevJuin) * 100 : 0)}`}>
                        {(() => { const t = kpis.cumulPrevJuin > 0 ? (kpis.totalOrd / kpis.cumulPrevJuin) * 100 : 0; return t >= 80 ? '✓' : t >= 50 ? '⚠' : '✗' })()}
                      </span>
                      <span className={`text-[10px] font-bold ${tauxColor(kpis.cumulPrevJuin > 0 ? (kpis.totalOrd / kpis.cumulPrevJuin) * 100 : 0)}`}>{kpis.cumulPrevJuin > 0 ? formatPercent((kpis.totalOrd / kpis.cumulPrevJuin) * 100) : '—'}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs font-bold text-gray-900 text-right bg-cyan-50/30">{formatMillions(kpis.cumulPrevSeptembre)}</TableCell>
                  <TableCell className="text-xs text-right bg-cyan-50/30">
                    <div className="flex items-center justify-end gap-1">
                      <span className={`text-[10px] font-bold ${tauxColor(kpis.cumulPrevSeptembre > 0 ? (kpis.totalOrd / kpis.cumulPrevSeptembre) * 100 : 0)}`}>
                        {(() => { const t = kpis.cumulPrevSeptembre > 0 ? (kpis.totalOrd / kpis.cumulPrevSeptembre) * 100 : 0; return t >= 80 ? '✓' : t >= 50 ? '⚠' : '✗' })()}
                      </span>
                      <span className={`text-[10px] font-bold ${tauxColor(kpis.cumulPrevSeptembre > 0 ? (kpis.totalOrd / kpis.cumulPrevSeptembre) * 100 : 0)}`}>{kpis.cumulPrevSeptembre > 0 ? formatPercent((kpis.totalOrd / kpis.cumulPrevSeptembre) * 100) : '—'}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs font-bold text-gray-900 text-right bg-sky-50/30">{formatMillions(kpis.cumulPrevOctobre)}</TableCell>
                  <TableCell className="text-xs text-right bg-sky-50/30">
                    <div className="flex items-center justify-end gap-1">
                      <span className={`text-[10px] font-bold ${tauxColor(kpis.cumulPrevOctobre > 0 ? (kpis.totalOrd / kpis.cumulPrevOctobre) * 100 : 0)}`}>
                        {(() => { const t = kpis.cumulPrevOctobre > 0 ? (kpis.totalOrd / kpis.cumulPrevOctobre) * 100 : 0; return t >= 80 ? '✓' : t >= 50 ? '⚠' : '✗' })()}
                      </span>
                      <span className={`text-[10px] font-bold ${tauxColor(kpis.cumulPrevOctobre > 0 ? (kpis.totalOrd / kpis.cumulPrevOctobre) * 100 : 0)}`}>{kpis.cumulPrevOctobre > 0 ? formatPercent((kpis.totalOrd / kpis.cumulPrevOctobre) * 100) : '—'}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs font-bold text-gray-900 text-right bg-indigo-50/30">{formatMillions(kpis.cumulPrevNovembre)}</TableCell>
                  <TableCell className="text-xs text-right bg-indigo-50/30">
                    <div className="flex items-center justify-end gap-1">
                      <span className={`text-[10px] font-bold ${tauxColor(kpis.cumulPrevNovembre > 0 ? (kpis.totalOrd / kpis.cumulPrevNovembre) * 100 : 0)}`}>
                        {(() => { const t = kpis.cumulPrevNovembre > 0 ? (kpis.totalOrd / kpis.cumulPrevNovembre) * 100 : 0; return t >= 80 ? '✓' : t >= 50 ? '⚠' : '✗' })()}
                      </span>
                      <span className={`text-[10px] font-bold ${tauxColor(kpis.cumulPrevNovembre > 0 ? (kpis.totalOrd / kpis.cumulPrevNovembre) * 100 : 0)}`}>{kpis.cumulPrevNovembre > 0 ? formatPercent((kpis.totalOrd / kpis.cumulPrevNovembre) * 100) : '—'}</span>
                    </div>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
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
        {/* ═══════════ SECTION 1 : CRÉDITS ═══════════ */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-1 h-5 rounded-full bg-gradient-to-b from-blue-500 to-indigo-600" />
            <h3 className="text-sm font-bold text-gray-800 tracking-wide uppercase">Crédits</h3>
            <span className="text-[11px] text-gray-400 font-medium">(M DH)</span>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Budget CP */}
            <div className="kpi-card-premium bg-white rounded-xl border border-gray-100 overflow-hidden cursor-default">
              <div className="h-1.5 bg-gradient-to-r from-blue-400 to-blue-600" />
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="kpi-icon-wrap w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center transition-transform">
                    <Scale className="w-5 h-5 text-blue-600" />
                  </div>
                  <Badge className="bg-blue-50 text-blue-700 border-blue-200 text-[10px] font-semibold rounded-full px-2.5">Budget</Badge>
                </div>
                <p className="text-2xl font-black text-gray-900 tracking-tight">{formatMillions(entityTotalBudget)}</p>
                <p className="text-[11px] text-gray-400 mt-1.5 font-medium">Budget CP total</p>
              </div>
            </div>

            {/* Total CE */}
            <div className="kpi-card-premium bg-white rounded-xl border border-gray-100 overflow-hidden cursor-default">
              <div className="h-1.5 bg-gradient-to-r from-indigo-400 to-indigo-600" />
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="kpi-icon-wrap w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center transition-transform">
                    <Landmark className="w-5 h-5 text-indigo-600" />
                  </div>
                  <Badge className="bg-indigo-50 text-indigo-700 border-indigo-200 text-[10px] font-semibold rounded-full px-2.5">CE</Badge>
                </div>
                <p className="text-2xl font-black text-gray-900 tracking-tight">{formatMillions(analysisByEntity.reduce((s, e) => s + e.ce, 0))}</p>
                <p className="text-[11px] text-gray-400 mt-1.5 font-medium">Crédits d&apos;engagement</p>
              </div>
            </div>

            {/* Engagements CE */}
            <div className="kpi-card-premium bg-white rounded-xl border border-gray-100 overflow-hidden cursor-default">
              <div className="h-1.5 bg-gradient-to-r from-teal-400 to-teal-600" />
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="kpi-icon-wrap w-10 h-10 rounded-full bg-teal-50 flex items-center justify-center transition-transform">
                    <TrendingUp className="w-5 h-5 text-teal-600" />
                  </div>
                  <Badge className="bg-teal-50 text-teal-700 border-teal-200 text-[10px] font-semibold rounded-full px-2.5">Eng. CE</Badge>
                </div>
                <p className="text-2xl font-black text-gray-900 tracking-tight">{formatMillions(analysisByEntity.reduce((s, e) => s + e.engCE, 0))}</p>
                <p className="text-[11px] text-gray-400 mt-1.5 font-medium">Engagements CE</p>
              </div>
            </div>

            {/* Paiements */}
            <div className="kpi-card-premium bg-white rounded-xl border border-gray-100 overflow-hidden cursor-default">
              <div className="h-1.5 bg-gradient-to-r from-cyan-400 to-cyan-600" />
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="kpi-icon-wrap w-10 h-10 rounded-full bg-cyan-50 flex items-center justify-center transition-transform">
                    <Wallet className="w-5 h-5 text-cyan-600" />
                  </div>
                  <Badge className="bg-cyan-50 text-cyan-700 border-cyan-200 text-[10px] font-semibold rounded-full px-2.5">Paiements</Badge>
                </div>
                <p className="text-2xl font-black text-gray-900 tracking-tight">{formatMillions(analysisByEntity.reduce((s, e) => s + e.paiements, 0))}</p>
                <p className="text-[11px] text-gray-400 mt-1.5 font-medium">Total paiements</p>
              </div>
            </div>
          </div>
        </div>

        {/* ═══════════ SECTION 2 : TAUX D'EXÉCUTION ═══════════ */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-1 h-5 rounded-full bg-gradient-to-b from-emerald-500 to-teal-600" />
            <h3 className="text-sm font-bold text-gray-800 tracking-wide uppercase">Taux d&apos;exécution</h3>
            <span className="text-[11px] text-gray-400 font-medium">(Moyenne toutes entités)</span>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Taux Engagement CP */}
            <div className="kpi-card-premium rounded-xl border border-emerald-100 overflow-hidden cursor-default" style={{ background: 'linear-gradient(135deg, #ffffff 0%, #f0fdf4 100%)' }}>
              <div className="h-1.5 bg-gradient-to-r from-emerald-400 to-teal-500" />
              <div className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="kpi-icon-wrap w-11 h-11 rounded-full bg-emerald-100 flex items-center justify-center transition-transform">
                        <TrendingUp className="w-5 h-5 text-emerald-700" />
                      </div>
                      <span className="text-sm font-semibold text-gray-600">Taux eng. CP moyen</span>
                    </div>
                    <p className="text-3xl font-black text-gray-900 tracking-tight">{formatPercent(entityAvgEng)}</p>
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex items-center gap-1 text-sm font-bold ${tauxColor(entityAvgEng)}`}>
                      {entityAvgEng >= 80 ? '✓' : entityAvgEng >= 50 ? '⚠' : '✗'}
                      {entityAvgEng >= 80 ? 'Bon' : entityAvgEng >= 50 ? 'Moyen' : 'Faible'}
                    </span>
                    <p className="text-[11px] text-gray-400 mt-0.5">{analysisByEntity.length} entités</p>
                  </div>
                </div>
                <div className="mt-3">
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`kpi-progress-bar h-full rounded-full ${entityAvgEng >= 80 ? 'bg-gradient-to-r from-emerald-400 to-emerald-600' : entityAvgEng >= 50 ? 'bg-gradient-to-r from-amber-400 to-amber-500' : 'bg-gradient-to-r from-red-400 to-red-500'}`} style={{ width: `${Math.min(entityAvgEng, 100)}%` }} />
                  </div>
                  <div className="flex justify-between mt-1.5">
                    <span className="text-[10px] text-gray-400">0%</span>
                    <span className="text-[10px] text-gray-400">100%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Taux Ordonnancement */}
            <div className="kpi-card-premium rounded-xl border border-blue-100 overflow-hidden cursor-default" style={{ background: 'linear-gradient(135deg, #ffffff 0%, #eff6ff 100%)' }}>
              <div className="h-1.5 bg-gradient-to-r from-blue-400 to-indigo-500" />
              <div className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="kpi-icon-wrap w-11 h-11 rounded-full bg-blue-100 flex items-center justify-center transition-transform">
                        <Wallet className="w-5 h-5 text-blue-700" />
                      </div>
                      <span className="text-sm font-semibold text-gray-600">Taux ord. moyen</span>
                    </div>
                    <p className="text-3xl font-black text-gray-900 tracking-tight">{formatPercent(entityAvgOrd)}</p>
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex items-center gap-1 text-sm font-bold ${tauxColor(entityAvgOrd)}`}>
                      {entityAvgOrd >= 80 ? '✓' : entityAvgOrd >= 50 ? '⚠' : '✗'}
                      {entityAvgOrd >= 80 ? 'Bon' : entityAvgOrd >= 50 ? 'Moyen' : 'Faible'}
                    </span>
                    <p className="text-[11px] text-gray-400 mt-0.5">{analysisByEntity.length} entités</p>
                  </div>
                </div>
                <div className="mt-3">
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`kpi-progress-bar h-full rounded-full ${entityAvgOrd >= 80 ? 'bg-gradient-to-r from-emerald-400 to-emerald-600' : entityAvgOrd >= 50 ? 'bg-gradient-to-r from-amber-400 to-amber-500' : 'bg-gradient-to-r from-red-400 to-red-500'}`} style={{ width: `${Math.min(entityAvgOrd, 100)}%` }} />
                  </div>
                  <div className="flex justify-between mt-1.5">
                    <span className="text-[10px] text-gray-400">0%</span>
                    <span className="text-[10px] text-gray-400">100%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Entity Detail Table */}
        <Card className="border border-gray-100 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-gray-700">Détail par entité</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="text-xs font-semibold text-gray-600">entité</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-600 text-right">Budget CP</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-600 text-right">Eng. CP</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-600 text-right">Taux eng. CP</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-600 text-right">Total CE</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-600 text-right">Eng. CE</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-600 text-right">Taux eng. CE</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-600 text-right">Ordonn.</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-600 text-right">Taux ord.</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-600 text-right">Paiements</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-600 text-right">Prévisions</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-600 text-right">Disponible</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {analysisByEntity.map(e => (
                    <TableRow key={e.name} className="hover:bg-gray-50">
                      <TableCell className="text-xs font-medium text-gray-900">{e.name}</TableCell>
                      <TableCell className="text-xs text-gray-700 text-right">{formatTableCell(e.cp)}</TableCell>
                      <TableCell className="text-xs text-gray-700 text-right">{formatTableCell(e.engCP)}</TableCell>
                      <TableCell className="text-xs text-right">
                        <span className={tauxColor(e.tauxEngagement)}>{formatPercent(e.tauxEngagement)}</span>
                      </TableCell>
                      <TableCell className="text-xs text-gray-700 text-right">{formatTableCell(e.ce)}</TableCell>
                      <TableCell className="text-xs text-gray-700 text-right">{formatTableCell(e.engCE)}</TableCell>
                      <TableCell className="text-xs text-right">
                        <span className={tauxColor(e.tauxEngagementCE)}>{e.ce > 0 ? formatPercent(e.tauxEngagementCE) : '0,0%'}</span>
                      </TableCell>
                      <TableCell className="text-xs text-gray-700 text-right">{formatTableCell(e.ord)}</TableCell>
                      <TableCell className="text-xs text-right">
                        <span className={tauxColor(e.tauxOrdonnement)}>{formatPercent(e.tauxOrdonnement)}</span>
                      </TableCell>
                      <TableCell className="text-xs text-gray-700 text-right">{formatTableCell(e.paiements)}</TableCell>
                      <TableCell className="text-xs text-gray-700 text-right">{formatTableCell(e.previsions)}</TableCell>
                      <TableCell className="text-xs text-gray-700 text-right">{formatTableCell(e.disponible)}</TableCell>
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
        {/* ═══════════ SECTION 1 : CRÉDITS ═══════════ */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-1 h-5 rounded-full bg-gradient-to-b from-blue-500 to-indigo-600" />
            <h3 className="text-sm font-bold text-gray-800 tracking-wide uppercase">Crédits</h3>
            <span className="text-[11px] text-gray-400 font-medium">(M DH)</span>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Budget */}
            <div className="kpi-card-premium bg-white rounded-xl border border-gray-100 overflow-hidden cursor-default">
              <div className="h-1.5 bg-gradient-to-r from-blue-400 to-blue-600" />
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="kpi-icon-wrap w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center transition-transform">
                    <Scale className="w-5 h-5 text-blue-600" />
                  </div>
                  <Badge className="bg-blue-50 text-blue-700 border-blue-200 text-[10px] font-semibold rounded-full px-2.5">Budget</Badge>
                </div>
                <p className="text-2xl font-black text-gray-900 tracking-tight">{formatMillions(progTotalBudget)}</p>
                <p className="text-[11px] text-gray-400 mt-1.5 font-medium">{analysisByGroup.length} projets</p>
              </div>
            </div>

            {/* Total CE */}
            <div className="kpi-card-premium bg-white rounded-xl border border-gray-100 overflow-hidden cursor-default">
              <div className="h-1.5 bg-gradient-to-r from-indigo-400 to-indigo-600" />
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="kpi-icon-wrap w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center transition-transform">
                    <Landmark className="w-5 h-5 text-indigo-600" />
                  </div>
                  <Badge className="bg-indigo-50 text-indigo-700 border-indigo-200 text-[10px] font-semibold rounded-full px-2.5">CE</Badge>
                </div>
                <p className="text-2xl font-black text-gray-900 tracking-tight">{formatMillions(analysisByGroup.reduce((s, g) => s + g.ce, 0))}</p>
                <p className="text-[11px] text-gray-400 mt-1.5 font-medium">Crédits d&apos;engagement</p>
              </div>
            </div>

            {/* Engagements CE */}
            <div className="kpi-card-premium bg-white rounded-xl border border-gray-100 overflow-hidden cursor-default">
              <div className="h-1.5 bg-gradient-to-r from-teal-400 to-teal-600" />
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="kpi-icon-wrap w-10 h-10 rounded-full bg-teal-50 flex items-center justify-center transition-transform">
                    <TrendingUp className="w-5 h-5 text-teal-600" />
                  </div>
                  <Badge className="bg-teal-50 text-teal-700 border-teal-200 text-[10px] font-semibold rounded-full px-2.5">Eng. CE</Badge>
                </div>
                <p className="text-2xl font-black text-gray-900 tracking-tight">{formatMillions(analysisByGroup.reduce((s, g) => s + g.engCE, 0))}</p>
                <p className="text-[11px] text-gray-400 mt-1.5 font-medium">Engagements CE</p>
              </div>
            </div>

            {/* Paiements */}
            <div className="kpi-card-premium bg-white rounded-xl border border-gray-100 overflow-hidden cursor-default">
              <div className="h-1.5 bg-gradient-to-r from-cyan-400 to-cyan-600" />
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="kpi-icon-wrap w-10 h-10 rounded-full bg-cyan-50 flex items-center justify-center transition-transform">
                    <Wallet className="w-5 h-5 text-cyan-600" />
                  </div>
                  <Badge className="bg-cyan-50 text-cyan-700 border-cyan-200 text-[10px] font-semibold rounded-full px-2.5">Paiements</Badge>
                </div>
                <p className="text-2xl font-black text-gray-900 tracking-tight">{formatMillions(analysisByGroup.reduce((s, g) => s + g.paiements, 0))}</p>
                <p className="text-[11px] text-gray-400 mt-1.5 font-medium">Total paiements</p>
              </div>
            </div>
          </div>
        </div>

        {/* ═══════════ SECTION 2 : TAUX D'EXÉCUTION ═══════════ */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-1 h-5 rounded-full bg-gradient-to-b from-emerald-500 to-teal-600" />
            <h3 className="text-sm font-bold text-gray-800 tracking-wide uppercase">Taux d&apos;exécution</h3>
            <span className="text-[11px] text-gray-400 font-medium">(Moyenne tous projets)</span>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Taux Engagement CP */}
            <div className="kpi-card-premium rounded-xl border border-emerald-100 overflow-hidden cursor-default" style={{ background: 'linear-gradient(135deg, #ffffff 0%, #f0fdf4 100%)' }}>
              <div className="h-1.5 bg-gradient-to-r from-emerald-400 to-teal-500" />
              <div className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="kpi-icon-wrap w-11 h-11 rounded-full bg-emerald-100 flex items-center justify-center transition-transform">
                        <TrendingUp className="w-5 h-5 text-emerald-700" />
                      </div>
                      <span className="text-sm font-semibold text-gray-600">Taux eng. CP moyen</span>
                    </div>
                    <p className="text-3xl font-black text-gray-900 tracking-tight">{formatPercent(progAvgEng)}</p>
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex items-center gap-1 text-sm font-bold ${tauxColor(progAvgEng)}`}>
                      {progAvgEng >= 80 ? '✓' : progAvgEng >= 50 ? '⚠' : '✗'}
                      {progAvgEng >= 80 ? 'Bon' : progAvgEng >= 50 ? 'Moyen' : 'Faible'}
                    </span>
                    <p className="text-[11px] text-gray-400 mt-0.5">{analysisByGroup.length} projets</p>
                  </div>
                </div>
                <div className="mt-3">
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`kpi-progress-bar h-full rounded-full ${progAvgEng >= 80 ? 'bg-gradient-to-r from-emerald-400 to-emerald-600' : progAvgEng >= 50 ? 'bg-gradient-to-r from-amber-400 to-amber-500' : 'bg-gradient-to-r from-red-400 to-red-500'}`} style={{ width: `${Math.min(progAvgEng, 100)}%` }} />
                  </div>
                  <div className="flex justify-between mt-1.5">
                    <span className="text-[10px] text-gray-400">0%</span>
                    <span className="text-[10px] text-gray-400">100%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Taux Ordonnancement */}
            <div className="kpi-card-premium rounded-xl border border-blue-100 overflow-hidden cursor-default" style={{ background: 'linear-gradient(135deg, #ffffff 0%, #eff6ff 100%)' }}>
              <div className="h-1.5 bg-gradient-to-r from-blue-400 to-indigo-500" />
              <div className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="kpi-icon-wrap w-11 h-11 rounded-full bg-blue-100 flex items-center justify-center transition-transform">
                        <Wallet className="w-5 h-5 text-blue-700" />
                      </div>
                      <span className="text-sm font-semibold text-gray-600">Taux ord. moyen</span>
                    </div>
                    <p className="text-3xl font-black text-gray-900 tracking-tight">{formatPercent(progAvgOrd)}</p>
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex items-center gap-1 text-sm font-bold ${tauxColor(progAvgOrd)}`}>
                      {progAvgOrd >= 80 ? '✓' : progAvgOrd >= 50 ? '⚠' : '✗'}
                      {progAvgOrd >= 80 ? 'Bon' : progAvgOrd >= 50 ? 'Moyen' : 'Faible'}
                    </span>
                    <p className="text-[11px] text-gray-400 mt-0.5">{analysisByGroup.length} projets</p>
                  </div>
                </div>
                <div className="mt-3">
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`kpi-progress-bar h-full rounded-full ${progAvgOrd >= 80 ? 'bg-gradient-to-r from-emerald-400 to-emerald-600' : progAvgOrd >= 50 ? 'bg-gradient-to-r from-amber-400 to-amber-500' : 'bg-gradient-to-r from-red-400 to-red-500'}`} style={{ width: `${Math.min(progAvgOrd, 100)}%` }} />
                  </div>
                  <div className="flex justify-between mt-1.5">
                    <span className="text-[10px] text-gray-400">0%</span>
                    <span className="text-[10px] text-gray-400">100%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Programme Detail Table */}
        <Card className="border border-gray-100 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-gray-700">Détail par projet</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="text-xs font-semibold text-gray-600">Projet</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-600 text-right">Budget CP</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-600 text-right">Eng. CP</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-600 text-right">Taux eng. CP</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-600 text-right">Total CE</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-600 text-right">Eng. CE</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-600 text-right">Taux eng. CE</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-600 text-right">Ordonn.</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-600 text-right">Taux ord.</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-600 text-right">Paiements</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-600 text-right">Prévisions</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-600 text-right">Disponible</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {analysisByGroup.map(g => (
                    <TableRow key={g.name} className="hover:bg-gray-50">
                      <TableCell className="text-xs font-medium text-gray-900">{g.name}</TableCell>
                      <TableCell className="text-xs text-gray-700 text-right">{formatTableCell(g.cp)}</TableCell>
                      <TableCell className="text-xs text-gray-700 text-right">{formatTableCell(g.engCP)}</TableCell>
                      <TableCell className="text-xs text-right">
                        <span className={tauxColor(g.tauxEngagement)}>{formatPercent(g.tauxEngagement)}</span>
                      </TableCell>
                      <TableCell className="text-xs text-gray-700 text-right">{formatTableCell(g.ce)}</TableCell>
                      <TableCell className="text-xs text-gray-700 text-right">{formatTableCell(g.engCE)}</TableCell>
                      <TableCell className="text-xs text-right">
                        <span className={tauxColor(g.tauxEngagementCE)}>{g.ce > 0 ? formatPercent(g.tauxEngagementCE) : '0,0%'}</span>
                      </TableCell>
                      <TableCell className="text-xs text-gray-700 text-right">{formatTableCell(g.ord)}</TableCell>
                      <TableCell className="text-xs text-right">
                        <span className={tauxColor(g.tauxOrdonnement)}>{formatPercent(g.tauxOrdonnement)}</span>
                      </TableCell>
                      <TableCell className="text-xs text-gray-700 text-right">{formatTableCell(g.paiements)}</TableCell>
                      <TableCell className="text-xs text-gray-700 text-right">{formatTableCell(g.previsions)}</TableCell>
                      <TableCell className="text-xs text-gray-700 text-right">{formatTableCell(g.disponible)}</TableCell>
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
        {/* ═══════════ SECTION 1 : CRÉDITS ═══════════ */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-1 h-5 rounded-full bg-gradient-to-b from-blue-500 to-indigo-600" />
            <h3 className="text-sm font-bold text-gray-800 tracking-wide uppercase">Crédits</h3>
            <span className="text-[11px] text-gray-400 font-medium">(M DH)</span>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Nb Programmes */}
            <div className="kpi-card-premium bg-white rounded-xl border border-gray-100 overflow-hidden cursor-default">
              <div className="h-1.5 bg-gradient-to-r from-violet-400 to-violet-600" />
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="kpi-icon-wrap w-10 h-10 rounded-full bg-violet-50 flex items-center justify-center transition-transform">
                    <FolderOpen className="w-5 h-5 text-violet-600" />
                  </div>
                  <Badge className="bg-violet-50 text-violet-700 border-violet-200 text-[10px] font-semibold rounded-full px-2.5">Programmes</Badge>
                </div>
                <p className="text-2xl font-black text-gray-900 tracking-tight">{totalProjects}</p>
                <p className="text-[11px] text-gray-400 mt-1.5 font-medium">Programmes budgétaires</p>
              </div>
            </div>

            {/* Budget Total */}
            <div className="kpi-card-premium bg-white rounded-xl border border-gray-100 overflow-hidden cursor-default">
              <div className="h-1.5 bg-gradient-to-r from-blue-400 to-blue-600" />
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="kpi-icon-wrap w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center transition-transform">
                    <Scale className="w-5 h-5 text-blue-600" />
                  </div>
                  <Badge className="bg-blue-50 text-blue-700 border-blue-200 text-[10px] font-semibold rounded-full px-2.5">Budget</Badge>
                </div>
                <p className="text-2xl font-black text-gray-900 tracking-tight">{formatMillions(totalBudget)}</p>
                <p className="text-[11px] text-gray-400 mt-1.5 font-medium">Budget CP total</p>
              </div>
            </div>

            {/* Total CE */}
            <div className="kpi-card-premium bg-white rounded-xl border border-gray-100 overflow-hidden cursor-default">
              <div className="h-1.5 bg-gradient-to-r from-indigo-400 to-indigo-600" />
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="kpi-icon-wrap w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center transition-transform">
                    <Landmark className="w-5 h-5 text-indigo-600" />
                  </div>
                  <Badge className="bg-indigo-50 text-indigo-700 border-indigo-200 text-[10px] font-semibold rounded-full px-2.5">CE</Badge>
                </div>
                <p className="text-2xl font-black text-gray-900 tracking-tight">{formatMillions(filteredProjects.reduce((s, p) => s + p.ce, 0))}</p>
                <p className="text-[11px] text-gray-400 mt-1.5 font-medium">Crédits d&apos;engagement</p>
              </div>
            </div>

            {/* Engagements CE + Paiements */}
            <div className="kpi-card-premium bg-white rounded-xl border border-gray-100 overflow-hidden cursor-default">
              <div className="h-1.5 bg-gradient-to-r from-cyan-400 to-cyan-600" />
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="kpi-icon-wrap w-10 h-10 rounded-full bg-cyan-50 flex items-center justify-center transition-transform">
                    <Wallet className="w-5 h-5 text-cyan-600" />
                  </div>
                  <Badge className="bg-cyan-50 text-cyan-700 border-cyan-200 text-[10px] font-semibold rounded-full px-2.5">Paiements</Badge>
                </div>
                <p className="text-2xl font-black text-gray-900 tracking-tight">{formatMillions(filteredProjects.reduce((s, p) => s + p.paiements, 0))}</p>
                <p className="text-[11px] text-gray-400 mt-1.5 font-medium">Total paiements</p>
              </div>
            </div>
          </div>
        </div>

        {/* ═══════════ SECTION 2 : TAUX D'EXÉCUTION ═══════════ */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-1 h-5 rounded-full bg-gradient-to-b from-emerald-500 to-teal-600" />
            <h3 className="text-sm font-bold text-gray-800 tracking-wide uppercase">Taux d&apos;exécution</h3>
            <span className="text-[11px] text-gray-400 font-medium">(Moyenne tous programmes)</span>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Taux Engagement CP */}
            <div className="kpi-card-premium rounded-xl border border-emerald-100 overflow-hidden cursor-default" style={{ background: 'linear-gradient(135deg, #ffffff 0%, #f0fdf4 100%)' }}>
              <div className="h-1.5 bg-gradient-to-r from-emerald-400 to-teal-500" />
              <div className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="kpi-icon-wrap w-11 h-11 rounded-full bg-emerald-100 flex items-center justify-center transition-transform">
                        <TrendingUp className="w-5 h-5 text-emerald-700" />
                      </div>
                      <span className="text-sm font-semibold text-gray-600">Taux eng. CP moyen</span>
                    </div>
                    <p className="text-3xl font-black text-gray-900 tracking-tight">{formatPercent(avgEng)}</p>
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex items-center gap-1 text-sm font-bold ${tauxColor(avgEng)}`}>
                      {avgEng >= 80 ? '✓' : avgEng >= 50 ? '⚠' : '✗'}
                      {avgEng >= 80 ? 'Bon' : avgEng >= 50 ? 'Moyen' : 'Faible'}
                    </span>
                    <p className="text-[11px] text-gray-400 mt-0.5">{totalProjects} programmes</p>
                  </div>
                </div>
                <div className="mt-3">
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`kpi-progress-bar h-full rounded-full ${avgEng >= 80 ? 'bg-gradient-to-r from-emerald-400 to-emerald-600' : avgEng >= 50 ? 'bg-gradient-to-r from-amber-400 to-amber-500' : 'bg-gradient-to-r from-red-400 to-red-500'}`} style={{ width: `${Math.min(avgEng, 100)}%` }} />
                  </div>
                  <div className="flex justify-between mt-1.5">
                    <span className="text-[10px] text-gray-400">0%</span>
                    <span className="text-[10px] text-gray-400">100%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Engagement CE */}
            <div className="kpi-card-premium rounded-xl border border-teal-100 overflow-hidden cursor-default" style={{ background: 'linear-gradient(135deg, #ffffff 0%, #f0fdfa 100%)' }}>
              <div className="h-1.5 bg-gradient-to-r from-teal-400 to-cyan-500" />
              <div className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="kpi-icon-wrap w-11 h-11 rounded-full bg-teal-100 flex items-center justify-center transition-transform">
                        <Landmark className="w-5 h-5 text-teal-700" />
                      </div>
                      <span className="text-sm font-semibold text-gray-600">Engagements CE</span>
                    </div>
                    <p className="text-3xl font-black text-gray-900 tracking-tight">{formatMillions(filteredProjects.reduce((s, p) => s + p.engCE, 0))}</p>
                  </div>
                  <div className="text-right">
                    {(() => {
                      const totalCE = filteredProjects.reduce((s, p) => s + p.ce, 0)
                      const totalEngCE = filteredProjects.reduce((s, p) => s + p.engCE, 0)
                      const tauxCE = totalCE > 0 ? (totalEngCE / totalCE) * 100 : 0
                      return (
                        <>
                          <span className={`inline-flex items-center gap-1 text-sm font-bold ${tauxColor(tauxCE)}`}>
                            {tauxCE >= 80 ? '✓' : tauxCE >= 50 ? '⚠' : '✗'}
                            {formatPercent(tauxCE)}
                          </span>
                          <p className="text-[11px] text-gray-400 mt-0.5">
                            {tauxCE >= 80 ? 'Bon' : tauxCE >= 50 ? 'Moyen' : 'Faible'}
                          </p>
                        </>
                      )
                    })()}
                  </div>
                </div>
                <div className="mt-3">
                  {(() => {
                    const totalCE = filteredProjects.reduce((s, p) => s + p.ce, 0)
                    const totalEngCE = filteredProjects.reduce((s, p) => s + p.engCE, 0)
                    const tauxCE = totalCE > 0 ? (totalEngCE / totalCE) * 100 : 0
                    return (
                      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className={`kpi-progress-bar h-full rounded-full ${tauxCE >= 80 ? 'bg-gradient-to-r from-emerald-400 to-emerald-600' : tauxCE >= 50 ? 'bg-gradient-to-r from-amber-400 to-amber-500' : 'bg-gradient-to-r from-red-400 to-red-500'}`} style={{ width: `${Math.min(tauxCE, 100)}%` }} />
                      </div>
                    )
                  })()}
                  <div className="flex justify-between mt-1.5">
                    <span className="text-[10px] text-gray-400">0%</span>
                    <span className="text-[10px] text-gray-400">100%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
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
                    <TableHead className="text-xs font-semibold text-gray-600">entité</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-600 text-right">Budget CP</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-600 text-right">Eng. CP</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-600 text-right">Taux eng. CP</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-600 text-right">Total CE</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-600 text-right">Eng. CE</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-600 text-right">Taux eng. CE</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-600 text-right">Ordonn.</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-600 text-right">Taux ord.</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-600 text-right">Paiements</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-600 text-right">Prévisions</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-600 text-right">Disponible</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pProjects.map((p, idx) => (
                    <TableRow key={`${p.name}-${p.projet}-${p.entite}-${idx}`} className="hover:bg-gray-50">
                      <TableCell className="text-xs font-medium text-gray-900 max-w-[200px] truncate">{p.name}</TableCell>
                      <TableCell className="text-xs text-gray-600">{p.projet || 'Non classé'}</TableCell>
                      <TableCell className="text-xs text-gray-600">{p.entite}</TableCell>
                      <TableCell className="text-xs text-gray-700 text-right">{formatTableCell(p.cp)}</TableCell>
                      <TableCell className="text-xs text-gray-700 text-right">{formatTableCell(p.engCP)}</TableCell>
                      <TableCell className="text-xs text-right">
                        <span className={tauxColor(p.tauxEngagement)}>{formatPercent(p.tauxEngagement)}</span>
                      </TableCell>
                      <TableCell className="text-xs text-gray-700 text-right">{formatTableCell(p.ce)}</TableCell>
                      <TableCell className="text-xs text-gray-700 text-right">{formatTableCell(p.engCE)}</TableCell>
                      <TableCell className="text-xs text-right">
                        <span className={tauxColor(p.tauxEngagementCE)}>{p.ce > 0 ? formatPercent(p.tauxEngagementCE) : '0,0%'}</span>
                      </TableCell>
                      <TableCell className="text-xs text-gray-700 text-right">{formatTableCell(p.ord)}</TableCell>
                      <TableCell className="text-xs text-right">
                        <span className={tauxColor(p.tauxOrdonnement)}>{formatPercent(p.tauxOrdonnement)}</span>
                      </TableCell>
                      <TableCell className="text-xs text-gray-700 text-right">{formatTableCell(p.paiements)}</TableCell>
                      <TableCell className="text-xs text-gray-700 text-right">{formatTableCell(p.previsions)}</TableCell>
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
        {/* ═══════════ SECTION 1 : ENGAGEMENTS CP & CE ═══════════ */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-1 h-5 rounded-full bg-gradient-to-b from-emerald-500 to-teal-600" />
            <h3 className="text-sm font-bold text-gray-800 tracking-wide uppercase">Engagements</h3>
            <span className="text-[11px] text-gray-400 font-medium">(M DH)</span>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Engagement CP */}
            <div className="kpi-card-premium rounded-xl border border-emerald-100 overflow-hidden cursor-default" style={{ background: 'linear-gradient(135deg, #ffffff 0%, #f0fdf4 100%)' }}>
              <div className="h-1.5 bg-gradient-to-r from-emerald-400 to-teal-500" />
              <div className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="kpi-icon-wrap w-11 h-11 rounded-full bg-emerald-100 flex items-center justify-center transition-transform">
                        <TrendingUp className="w-5 h-5 text-emerald-700" />
                      </div>
                      <span className="text-sm font-semibold text-gray-600">Engagement CP</span>
                    </div>
                    <p className="text-3xl font-black text-gray-900 tracking-tight">{formatMillions(totalEngCP)}</p>
                  </div>
                  <div className="text-right">
                    {(() => {
                      const tauxEngCP = kpis.totalCP > 0 ? (totalEngCP / kpis.totalCP) * 100 : 0
                      return (
                        <>
                          <span className={`inline-flex items-center gap-1 text-sm font-bold ${tauxColor(tauxEngCP)}`}>
                            {tauxEngCP >= 80 ? '✓' : tauxEngCP >= 50 ? '⚠' : '✗'}
                            {formatPercent(tauxEngCP)}
                          </span>
                          <p className="text-[11px] text-gray-400 mt-0.5">
                            {tauxEngCP >= 80 ? 'Bon' : tauxEngCP >= 50 ? 'Moyen' : 'Faible'}
                          </p>
                        </>
                      )
                    })()}
                  </div>
                </div>
                <div className="mt-3">
                  {(() => {
                    const tauxEngCP = kpis.totalCP > 0 ? (totalEngCP / kpis.totalCP) * 100 : 0
                    return (
                      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className={`kpi-progress-bar h-full rounded-full ${tauxEngCP >= 80 ? 'bg-gradient-to-r from-emerald-400 to-emerald-600' : tauxEngCP >= 50 ? 'bg-gradient-to-r from-amber-400 to-amber-500' : 'bg-gradient-to-r from-red-400 to-red-500'}`} style={{ width: `${Math.min(tauxEngCP, 100)}%` }} />
                      </div>
                    )
                  })()}
                  <div className="flex justify-between mt-1.5">
                    <span className="text-[10px] text-gray-400">0%</span>
                    <span className="text-[10px] text-gray-400">Reste : {formatMillions(kpis.totalCP - totalEngCP)}</span>
                    <span className="text-[10px] text-gray-400">100%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Engagement CE */}
            <div className="kpi-card-premium rounded-xl border border-teal-100 overflow-hidden cursor-default" style={{ background: 'linear-gradient(135deg, #ffffff 0%, #f0fdfa 100%)' }}>
              <div className="h-1.5 bg-gradient-to-r from-teal-400 to-cyan-500" />
              <div className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="kpi-icon-wrap w-11 h-11 rounded-full bg-teal-100 flex items-center justify-center transition-transform">
                        <Landmark className="w-5 h-5 text-teal-700" />
                      </div>
                      <span className="text-sm font-semibold text-gray-600">Engagement CE</span>
                    </div>
                    <p className="text-3xl font-black text-gray-900 tracking-tight">{formatMillions(totalEngCE)}</p>
                  </div>
                  <div className="text-right">
                    {(() => {
                      const tauxEngCE = kpis.totalCE > 0 ? (totalEngCE / kpis.totalCE) * 100 : 0
                      return (
                        <>
                          <span className={`inline-flex items-center gap-1 text-sm font-bold ${tauxColor(tauxEngCE)}`}>
                            {tauxEngCE >= 80 ? '✓' : tauxEngCE >= 50 ? '⚠' : '✗'}
                            {formatPercent(tauxEngCE)}
                          </span>
                          <p className="text-[11px] text-gray-400 mt-0.5">
                            {tauxEngCE >= 80 ? 'Bon' : tauxEngCE >= 50 ? 'Moyen' : 'Faible'}
                          </p>
                        </>
                      )
                    })()}
                  </div>
                </div>
                <div className="mt-3">
                  {(() => {
                    const tauxEngCE = kpis.totalCE > 0 ? (totalEngCE / kpis.totalCE) * 100 : 0
                    return (
                      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className={`kpi-progress-bar h-full rounded-full ${tauxEngCE >= 80 ? 'bg-gradient-to-r from-emerald-400 to-emerald-600' : tauxEngCE >= 50 ? 'bg-gradient-to-r from-amber-400 to-amber-500' : 'bg-gradient-to-r from-red-400 to-red-500'}`} style={{ width: `${Math.min(tauxEngCE, 100)}%` }} />
                      </div>
                    )
                  })()}
                  <div className="flex justify-between mt-1.5">
                    <span className="text-[10px] text-gray-400">0%</span>
                    <span className="text-[10px] text-gray-400">Reste : {formatMillions(kpis.totalCE - totalEngCE)}</span>
                    <span className="text-[10px] text-gray-400">100%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ═══════════ SECTION 2 : NOMBRE & RÉPARTITION ═══════════ */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-1 h-5 rounded-full bg-gradient-to-b from-blue-500 to-indigo-600" />
            <h3 className="text-sm font-bold text-gray-800 tracking-wide uppercase">Volume</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Nb Engagements */}
            <div className="kpi-card-premium bg-white rounded-xl border border-gray-100 overflow-hidden cursor-default">
              <div className="h-1.5 bg-gradient-to-r from-violet-400 to-violet-600" />
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="kpi-icon-wrap w-10 h-10 rounded-full bg-violet-50 flex items-center justify-center transition-transform">
                    <FileText className="w-5 h-5 text-violet-600" />
                  </div>
                  <Badge className="bg-violet-50 text-violet-700 border-violet-200 text-[10px] font-semibold rounded-full px-2.5">Lignes</Badge>
                </div>
                <p className="text-2xl font-black text-gray-900 tracking-tight">{engagementLines.length}</p>
                <p className="text-[11px] text-gray-400 mt-1.5 font-medium">Engagements comptabilisés</p>
              </div>
            </div>

            {/* Eng. Reports */}
            <div className="kpi-card-premium bg-white rounded-xl border border-gray-100 overflow-hidden cursor-default">
              <div className="h-1.5 bg-gradient-to-r from-blue-400 to-blue-600" />
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="kpi-icon-wrap w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center transition-transform">
                    <RotateCcw className="w-5 h-5 text-blue-600" />
                  </div>
                  <Badge className="bg-blue-50 text-blue-700 border-blue-200 text-[10px] font-semibold rounded-full px-2.5">Reports</Badge>
                </div>
                <p className="text-2xl font-black text-gray-900 tracking-tight">{formatMillions(engagementBreakdown.engReports)}</p>
                <p className="text-[11px] text-gray-400 mt-1.5 font-medium">{formatPercent(engagementBreakdown.pctReports)} du total</p>
              </div>
            </div>

            {/* Eng. Nouveaux */}
            <div className="kpi-card-premium bg-white rounded-xl border border-gray-100 overflow-hidden cursor-default">
              <div className="h-1.5 bg-gradient-to-r from-emerald-400 to-emerald-600" />
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="kpi-icon-wrap w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center transition-transform">
                    <TrendingUp className="w-5 h-5 text-emerald-600" />
                  </div>
                  <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] font-semibold rounded-full px-2.5">Nouveaux</Badge>
                </div>
                <p className="text-2xl font-black text-gray-900 tracking-tight">{formatMillions(engagementBreakdown.engNouveaux)}</p>
                <p className="text-[11px] text-gray-400 mt-1.5 font-medium">{formatPercent(engagementBreakdown.pctNouveaux)} du total</p>
              </div>
            </div>
          </div>
        </div>

        {/* ═══════════ Engagement par Programme ═══════════ */}
        <Card className="border border-gray-100 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-gray-700">Engagements par Programme (M DH)</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-indigo-50/60">
                    <TableHead className="text-xs font-semibold text-indigo-700">Programme</TableHead>
                    <TableHead className="text-xs font-semibold text-indigo-700 text-right">Crédits Report</TableHead>
                    <TableHead className="text-xs font-semibold text-indigo-700 text-right">Crédits Consolidés</TableHead>
                    <TableHead className="text-xs font-semibold text-indigo-700 text-right">Crédits Nouveaux</TableHead>
                    <TableHead className="text-xs font-semibold text-indigo-700 text-right">Total CP</TableHead>
                    <TableHead className="text-xs font-semibold text-indigo-700 text-right">Eng. Reports</TableHead>
                    <TableHead className="text-xs font-semibold text-indigo-700 text-right">% Report</TableHead>
                    <TableHead className="text-xs font-semibold text-indigo-700 text-right">Eng. Consolidés</TableHead>
                    <TableHead className="text-xs font-semibold text-indigo-700 text-right">% Consolidé</TableHead>
                    <TableHead className="text-xs font-semibold text-indigo-700 text-right">Eng. Nouveaux</TableHead>
                    <TableHead className="text-xs font-semibold text-indigo-700 text-right">% Nouveaux</TableHead>
                    <TableHead className="text-xs font-semibold text-indigo-700 text-right">Eng. CP Total</TableHead>
                    <TableHead className="text-xs font-semibold text-indigo-700 text-right">Taux eng. CP</TableHead>
                    <TableHead className="text-xs font-semibold text-indigo-700 text-right">Reste à engager CP</TableHead>
                    <TableHead className="text-xs font-semibold text-indigo-700 text-right">Total CE</TableHead>
                    <TableHead className="text-xs font-semibold text-indigo-700 text-right">Eng. CE</TableHead>
                    <TableHead className="text-xs font-semibold text-indigo-700 text-right">% CE</TableHead>
                    <TableHead className="text-xs font-semibold text-indigo-700 text-right">Reste à engager CE</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(() => {
                    const progEng = analysisByProgramme.map(p => {
                      const rows = filteredData.filter(r => (r.Programme || 'Sans nom') === p.name)
                      const engReports = rows.reduce((s, r) => s + (r['ENG REPORT'] || 0), 0)
                      const engConsolides = rows.reduce((s, r) => s + (r['ENG CONSOLIDES'] || 0), 0)
                      const engNouveaux = rows.reduce((s, r) => s + (r['ENG NOUVEAUX'] || 0), 0)
                      const cpReports = rows.reduce((s, r) => s + (r.REPORTS || 0), 0)
                      const cpConsolides = rows.reduce((s, r) => s + (r.CONSOLIDES || 0), 0)
                      const cpNouveaux = rows.reduce((s, r) => s + (r.NOUVEAUX || 0), 0)
                      const ce = rows.reduce((s, r) => s + (r['TOTAL CE'] || 0), 0)
                      const engCE = rows.reduce((s, r) => s + (r['ENG CE ULT'] || 0), 0)
                      return { ...p, engReports, engConsolides, engNouveaux, cpReports, cpConsolides, cpNouveaux, ce, engCE }
                    })
                    const totCP = progEng.reduce((s, p) => s + p.cp, 0)
                    const totCpReports = progEng.reduce((s, p) => s + p.cpReports, 0)
                    const totCpConsolides = progEng.reduce((s, p) => s + p.cpConsolides, 0)
                    const totCpNouveaux = progEng.reduce((s, p) => s + p.cpNouveaux, 0)
                    const totEngReports = progEng.reduce((s, p) => s + p.engReports, 0)
                    const totEngConsolides = progEng.reduce((s, p) => s + p.engConsolides, 0)
                    const totEngNouveaux = progEng.reduce((s, p) => s + p.engNouveaux, 0)
                    const totEngCP = progEng.reduce((s, p) => s + p.engCP, 0)
                    const totCE = progEng.reduce((s, p) => s + p.ce, 0)
                    const totEngCE = progEng.reduce((s, p) => s + p.engCE, 0)
                    return (
                      <>
                        {progEng.map(p => (
                          <TableRow key={p.name} className="hover:bg-gray-50">
                            <TableCell className="text-xs font-medium text-gray-900">{p.name}</TableCell>
                            <TableCell className="text-xs text-gray-700 text-right">{formatMillions(p.cpReports)}</TableCell>
                            <TableCell className="text-xs text-gray-700 text-right">{formatMillions(p.cpConsolides)}</TableCell>
                            <TableCell className="text-xs text-gray-700 text-right">{formatMillions(p.cpNouveaux)}</TableCell>
                            <TableCell className="text-xs text-gray-700 text-right">{formatMillions(p.cp)}</TableCell>
                            <TableCell className="text-xs text-gray-700 text-right">{formatMillions(p.engReports)}</TableCell>
                            <TableCell className="text-xs text-right"><span className={tauxColor(p.cpReports > 0 ? (p.engReports / p.cpReports) * 100 : 0)}>{formatPercent(p.cpReports > 0 ? (p.engReports / p.cpReports) * 100 : 0)}</span></TableCell>
                            <TableCell className="text-xs text-gray-700 text-right">{formatMillions(p.engConsolides)}</TableCell>
                            <TableCell className="text-xs text-right"><span className={tauxColor(p.cpConsolides > 0 ? (p.engConsolides / p.cpConsolides) * 100 : 0)}>{formatPercent(p.cpConsolides > 0 ? (p.engConsolides / p.cpConsolides) * 100 : 0)}</span></TableCell>
                            <TableCell className="text-xs text-gray-700 text-right">{formatMillions(p.engNouveaux)}</TableCell>
                            <TableCell className="text-xs text-right"><span className={tauxColor(p.cpNouveaux > 0 ? (p.engNouveaux / p.cpNouveaux) * 100 : 0)}>{formatPercent(p.cpNouveaux > 0 ? (p.engNouveaux / p.cpNouveaux) * 100 : 0)}</span></TableCell>
                            <TableCell className="text-xs font-semibold text-emerald-700 text-right">{formatMillions(p.engCP)}</TableCell>
                            <TableCell className="text-xs text-right"><span className={tauxColor(p.tauxEngagement)}>{formatPercent(p.tauxEngagement)}</span></TableCell>
                            <TableCell className="text-xs text-gray-700 text-right">{formatMillions(p.cp - p.engCP)}</TableCell>
                            <TableCell className="text-xs text-gray-700 text-right">{formatMillions(p.ce)}</TableCell>
                            <TableCell className="text-xs font-semibold text-teal-700 text-right">{formatMillions(p.engCE)}</TableCell>
                            <TableCell className="text-xs text-right"><span className={tauxColor(p.ce > 0 ? (p.engCE / p.ce) * 100 : 0)}>{formatPercent(p.ce > 0 ? (p.engCE / p.ce) * 100 : 0)}</span></TableCell>
                            <TableCell className="text-xs text-gray-700 text-right">{formatMillions(p.ce - p.engCE)}</TableCell>
                          </TableRow>
                        ))}
                        <TableRow className="bg-indigo-50/40 font-bold">
                          <TableCell className="text-xs font-bold text-gray-900">TOTAL</TableCell>
                          <TableCell className="text-xs font-bold text-gray-900 text-right">{formatMillions(totCpReports)}</TableCell>
                          <TableCell className="text-xs font-bold text-gray-900 text-right">{formatMillions(totCpConsolides)}</TableCell>
                          <TableCell className="text-xs font-bold text-gray-900 text-right">{formatMillions(totCpNouveaux)}</TableCell>
                          <TableCell className="text-xs font-bold text-gray-900 text-right">{formatMillions(totCP)}</TableCell>
                          <TableCell className="text-xs font-bold text-gray-900 text-right">{formatMillions(totEngReports)}</TableCell>
                          <TableCell className="text-xs font-bold text-right"><span className={tauxColor(totCpReports > 0 ? (totEngReports / totCpReports) * 100 : 0)}>{formatPercent(totCpReports > 0 ? (totEngReports / totCpReports) * 100 : 0)}</span></TableCell>
                          <TableCell className="text-xs font-bold text-gray-900 text-right">{formatMillions(totEngConsolides)}</TableCell>
                          <TableCell className="text-xs font-bold text-right"><span className={tauxColor(totCpConsolides > 0 ? (totEngConsolides / totCpConsolides) * 100 : 0)}>{formatPercent(totCpConsolides > 0 ? (totEngConsolides / totCpConsolides) * 100 : 0)}</span></TableCell>
                          <TableCell className="text-xs font-bold text-gray-900 text-right">{formatMillions(totEngNouveaux)}</TableCell>
                          <TableCell className="text-xs font-bold text-right"><span className={tauxColor(totCpNouveaux > 0 ? (totEngNouveaux / totCpNouveaux) * 100 : 0)}>{formatPercent(totCpNouveaux > 0 ? (totEngNouveaux / totCpNouveaux) * 100 : 0)}</span></TableCell>
                          <TableCell className="text-xs font-bold text-emerald-700 text-right">{formatMillions(totEngCP)}</TableCell>
                          <TableCell className="text-xs font-bold text-right"><span className={tauxColor(totCP > 0 ? (totEngCP / totCP) * 100 : 0)}>{formatPercent(totCP > 0 ? (totEngCP / totCP) * 100 : 0)}</span></TableCell>
                          <TableCell className="text-xs font-bold text-gray-900 text-right">{formatMillions(totCP - totEngCP)}</TableCell>
                          <TableCell className="text-xs font-bold text-gray-900 text-right">{formatMillions(totCE)}</TableCell>
                          <TableCell className="text-xs font-bold text-teal-700 text-right">{formatMillions(totEngCE)}</TableCell>
                          <TableCell className="text-xs font-bold text-right"><span className={tauxColor(totCE > 0 ? (totEngCE / totCE) * 100 : 0)}>{formatPercent(totCE > 0 ? (totEngCE / totCE) * 100 : 0)}</span></TableCell>
                          <TableCell className="text-xs font-bold text-gray-900 text-right">{formatMillions(totCE - totEngCE)}</TableCell>
                        </TableRow>
                      </>
                    )
                  })()}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* ═══════════ Engagement par Projet ═══════════ */}
        <Card className="border border-gray-100 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-gray-700">Engagements par Projet (M DH)</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-emerald-50/60">
                    <TableHead className="text-xs font-semibold text-emerald-700">Projet</TableHead>
                    <TableHead className="text-xs font-semibold text-emerald-700 text-right">Crédits Report</TableHead>
                    <TableHead className="text-xs font-semibold text-emerald-700 text-right">Crédits Consolidés</TableHead>
                    <TableHead className="text-xs font-semibold text-emerald-700 text-right">Crédits Nouveaux</TableHead>
                    <TableHead className="text-xs font-semibold text-emerald-700 text-right">Total CP</TableHead>
                    <TableHead className="text-xs font-semibold text-emerald-700 text-right">Eng. Reports</TableHead>
                    <TableHead className="text-xs font-semibold text-emerald-700 text-right">% Report</TableHead>
                    <TableHead className="text-xs font-semibold text-emerald-700 text-right">Eng. Consolidés</TableHead>
                    <TableHead className="text-xs font-semibold text-emerald-700 text-right">% Consolidé</TableHead>
                    <TableHead className="text-xs font-semibold text-emerald-700 text-right">Eng. Nouveaux</TableHead>
                    <TableHead className="text-xs font-semibold text-emerald-700 text-right">% Nouveaux</TableHead>
                    <TableHead className="text-xs font-semibold text-emerald-700 text-right">Eng. CP Total</TableHead>
                    <TableHead className="text-xs font-semibold text-emerald-700 text-right">Taux eng. CP</TableHead>
                    <TableHead className="text-xs font-semibold text-emerald-700 text-right">Reste à engager CP</TableHead>
                    <TableHead className="text-xs font-semibold text-emerald-700 text-right">Total CE</TableHead>
                    <TableHead className="text-xs font-semibold text-emerald-700 text-right">Eng. CE</TableHead>
                    <TableHead className="text-xs font-semibold text-emerald-700 text-right">% CE</TableHead>
                    <TableHead className="text-xs font-semibold text-emerald-700 text-right">Reste à engager CE</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(() => {
                    const projEng = analysisByGroup.map(g => {
                      const rows = filteredData.filter(r => r.Projet === g.name)
                      const engReports = rows.reduce((s, r) => s + (r['ENG REPORT'] || 0), 0)
                      const engConsolides = rows.reduce((s, r) => s + (r['ENG CONSOLIDES'] || 0), 0)
                      const engNouveaux = rows.reduce((s, r) => s + (r['ENG NOUVEAUX'] || 0), 0)
                      const cpReports = rows.reduce((s, r) => s + (r.REPORTS || 0), 0)
                      const cpConsolides = rows.reduce((s, r) => s + (r.CONSOLIDES || 0), 0)
                      const cpNouveaux = rows.reduce((s, r) => s + (r.NOUVEAUX || 0), 0)
                      const ce = rows.reduce((s, r) => s + (r['TOTAL CE'] || 0), 0)
                      const engCE = rows.reduce((s, r) => s + (r['ENG CE ULT'] || 0), 0)
                      return { ...g, engReports, engConsolides, engNouveaux, cpReports, cpConsolides, cpNouveaux, ce, engCE }
                    })
                    const totCP = projEng.reduce((s, g) => s + g.cp, 0)
                    const totCpReports = projEng.reduce((s, g) => s + g.cpReports, 0)
                    const totCpConsolides = projEng.reduce((s, g) => s + g.cpConsolides, 0)
                    const totCpNouveaux = projEng.reduce((s, g) => s + g.cpNouveaux, 0)
                    const totEngReports = projEng.reduce((s, g) => s + g.engReports, 0)
                    const totEngConsolides = projEng.reduce((s, g) => s + g.engConsolides, 0)
                    const totEngNouveaux = projEng.reduce((s, g) => s + g.engNouveaux, 0)
                    const totEngCP = projEng.reduce((s, g) => s + g.engCP, 0)
                    const totCE = projEng.reduce((s, g) => s + g.ce, 0)
                    const totEngCE = projEng.reduce((s, g) => s + g.engCE, 0)
                    return (
                      <>
                        {projEng.map(g => (
                          <TableRow key={g.name} className="hover:bg-gray-50">
                            <TableCell className="text-xs font-medium text-gray-900">{g.name}</TableCell>
                            <TableCell className="text-xs text-gray-700 text-right">{formatMillions(g.cpReports)}</TableCell>
                            <TableCell className="text-xs text-gray-700 text-right">{formatMillions(g.cpConsolides)}</TableCell>
                            <TableCell className="text-xs text-gray-700 text-right">{formatMillions(g.cpNouveaux)}</TableCell>
                            <TableCell className="text-xs text-gray-700 text-right">{formatMillions(g.cp)}</TableCell>
                            <TableCell className="text-xs text-gray-700 text-right">{formatMillions(g.engReports)}</TableCell>
                            <TableCell className="text-xs text-right"><span className={tauxColor(g.cpReports > 0 ? (g.engReports / g.cpReports) * 100 : 0)}>{formatPercent(g.cpReports > 0 ? (g.engReports / g.cpReports) * 100 : 0)}</span></TableCell>
                            <TableCell className="text-xs text-gray-700 text-right">{formatMillions(g.engConsolides)}</TableCell>
                            <TableCell className="text-xs text-right"><span className={tauxColor(g.cpConsolides > 0 ? (g.engConsolides / g.cpConsolides) * 100 : 0)}>{formatPercent(g.cpConsolides > 0 ? (g.engConsolides / g.cpConsolides) * 100 : 0)}</span></TableCell>
                            <TableCell className="text-xs text-gray-700 text-right">{formatMillions(g.engNouveaux)}</TableCell>
                            <TableCell className="text-xs text-right"><span className={tauxColor(g.cpNouveaux > 0 ? (g.engNouveaux / g.cpNouveaux) * 100 : 0)}>{formatPercent(g.cpNouveaux > 0 ? (g.engNouveaux / g.cpNouveaux) * 100 : 0)}</span></TableCell>
                            <TableCell className="text-xs font-semibold text-emerald-700 text-right">{formatMillions(g.engCP)}</TableCell>
                            <TableCell className="text-xs text-right"><span className={tauxColor(g.tauxEngagement)}>{formatPercent(g.tauxEngagement)}</span></TableCell>
                            <TableCell className="text-xs text-gray-700 text-right">{formatMillions(g.cp - g.engCP)}</TableCell>
                            <TableCell className="text-xs text-gray-700 text-right">{formatMillions(g.ce)}</TableCell>
                            <TableCell className="text-xs font-semibold text-teal-700 text-right">{formatMillions(g.engCE)}</TableCell>
                            <TableCell className="text-xs text-right"><span className={tauxColor(g.ce > 0 ? (g.engCE / g.ce) * 100 : 0)}>{formatPercent(g.ce > 0 ? (g.engCE / g.ce) * 100 : 0)}</span></TableCell>
                            <TableCell className="text-xs text-gray-700 text-right">{formatMillions(g.ce - g.engCE)}</TableCell>
                          </TableRow>
                        ))}
                        <TableRow className="bg-emerald-50/40 font-bold">
                          <TableCell className="text-xs font-bold text-gray-900">TOTAL</TableCell>
                          <TableCell className="text-xs font-bold text-gray-900 text-right">{formatMillions(totCpReports)}</TableCell>
                          <TableCell className="text-xs font-bold text-gray-900 text-right">{formatMillions(totCpConsolides)}</TableCell>
                          <TableCell className="text-xs font-bold text-gray-900 text-right">{formatMillions(totCpNouveaux)}</TableCell>
                          <TableCell className="text-xs font-bold text-gray-900 text-right">{formatMillions(totCP)}</TableCell>
                          <TableCell className="text-xs font-bold text-gray-900 text-right">{formatMillions(totEngReports)}</TableCell>
                          <TableCell className="text-xs font-bold text-right"><span className={tauxColor(totCpReports > 0 ? (totEngReports / totCpReports) * 100 : 0)}>{formatPercent(totCpReports > 0 ? (totEngReports / totCpReports) * 100 : 0)}</span></TableCell>
                          <TableCell className="text-xs font-bold text-gray-900 text-right">{formatMillions(totEngConsolides)}</TableCell>
                          <TableCell className="text-xs font-bold text-right"><span className={tauxColor(totCpConsolides > 0 ? (totEngConsolides / totCpConsolides) * 100 : 0)}>{formatPercent(totCpConsolides > 0 ? (totEngConsolides / totCpConsolides) * 100 : 0)}</span></TableCell>
                          <TableCell className="text-xs font-bold text-gray-900 text-right">{formatMillions(totEngNouveaux)}</TableCell>
                          <TableCell className="text-xs font-bold text-right"><span className={tauxColor(totCpNouveaux > 0 ? (totEngNouveaux / totCpNouveaux) * 100 : 0)}>{formatPercent(totCpNouveaux > 0 ? (totEngNouveaux / totCpNouveaux) * 100 : 0)}</span></TableCell>
                          <TableCell className="text-xs font-bold text-emerald-700 text-right">{formatMillions(totEngCP)}</TableCell>
                          <TableCell className="text-xs font-bold text-right"><span className={tauxColor(totCP > 0 ? (totEngCP / totCP) * 100 : 0)}>{formatPercent(totCP > 0 ? (totEngCP / totCP) * 100 : 0)}</span></TableCell>
                          <TableCell className="text-xs font-bold text-gray-900 text-right">{formatMillions(totCP - totEngCP)}</TableCell>
                          <TableCell className="text-xs font-bold text-gray-900 text-right">{formatMillions(totCE)}</TableCell>
                          <TableCell className="text-xs font-bold text-teal-700 text-right">{formatMillions(totEngCE)}</TableCell>
                          <TableCell className="text-xs font-bold text-right"><span className={tauxColor(totCE > 0 ? (totEngCE / totCE) * 100 : 0)}>{formatPercent(totCE > 0 ? (totEngCE / totCE) * 100 : 0)}</span></TableCell>
                          <TableCell className="text-xs font-bold text-gray-900 text-right">{formatMillions(totCE - totEngCE)}</TableCell>
                        </TableRow>
                      </>
                    )
                  })()}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* ═══════════ Engagement par Entité ═══════════ */}
        <Card className="border border-gray-100 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-gray-700">Engagements par Entité (M DH)</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/60">
                    <TableHead className="text-xs font-semibold text-slate-700">Entité</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-700 text-right">Crédits Report</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-700 text-right">Crédits Consolidés</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-700 text-right">Crédits Nouveaux</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-700 text-right">Total CP</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-700 text-right">Eng. Reports</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-700 text-right">% Report</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-700 text-right">Eng. Consolidés</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-700 text-right">% Consolidé</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-700 text-right">Eng. Nouveaux</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-700 text-right">% Nouveaux</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-700 text-right">Eng. CP Total</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-700 text-right">Taux eng. CP</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-700 text-right">Reste à engager CP</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-700 text-right">Total CE</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-700 text-right">Eng. CE</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-700 text-right">% CE</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-700 text-right">Reste à engager CE</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(() => {
                    const entEng = analysisByEntity.map(e => {
                      const rows = filteredData.filter(r => r.ENTITE === e.name)
                      const engReports = rows.reduce((s, r) => s + (r['ENG REPORT'] || 0), 0)
                      const engConsolides = rows.reduce((s, r) => s + (r['ENG CONSOLIDES'] || 0), 0)
                      const engNouveaux = rows.reduce((s, r) => s + (r['ENG NOUVEAUX'] || 0), 0)
                      const cpReports = rows.reduce((s, r) => s + (r.REPORTS || 0), 0)
                      const cpConsolides = rows.reduce((s, r) => s + (r.CONSOLIDES || 0), 0)
                      const cpNouveaux = rows.reduce((s, r) => s + (r.NOUVEAUX || 0), 0)
                      const ce = rows.reduce((s, r) => s + (r['TOTAL CE'] || 0), 0)
                      const engCE = rows.reduce((s, r) => s + (r['ENG CE ULT'] || 0), 0)
                      return { ...e, engReports, engConsolides, engNouveaux, cpReports, cpConsolides, cpNouveaux, ce, engCE }
                    })
                    const totCP = entEng.reduce((s, e) => s + e.cp, 0)
                    const totCpReports = entEng.reduce((s, e) => s + e.cpReports, 0)
                    const totCpConsolides = entEng.reduce((s, e) => s + e.cpConsolides, 0)
                    const totCpNouveaux = entEng.reduce((s, e) => s + e.cpNouveaux, 0)
                    const totEngReports = entEng.reduce((s, e) => s + e.engReports, 0)
                    const totEngConsolides = entEng.reduce((s, e) => s + e.engConsolides, 0)
                    const totEngNouveaux = entEng.reduce((s, e) => s + e.engNouveaux, 0)
                    const totEngCP = entEng.reduce((s, e) => s + e.engCP, 0)
                    const totCE = entEng.reduce((s, e) => s + e.ce, 0)
                    const totEngCE = entEng.reduce((s, e) => s + e.engCE, 0)
                    return (
                      <>
                        {entEng.map(e => (
                          <TableRow key={e.name} className="hover:bg-gray-50">
                            <TableCell className="text-xs font-medium text-gray-900">{e.name}</TableCell>
                            <TableCell className="text-xs text-gray-700 text-right">{formatMillions(e.cpReports)}</TableCell>
                            <TableCell className="text-xs text-gray-700 text-right">{formatMillions(e.cpConsolides)}</TableCell>
                            <TableCell className="text-xs text-gray-700 text-right">{formatMillions(e.cpNouveaux)}</TableCell>
                            <TableCell className="text-xs text-gray-700 text-right">{formatMillions(e.cp)}</TableCell>
                            <TableCell className="text-xs text-gray-700 text-right">{formatMillions(e.engReports)}</TableCell>
                            <TableCell className="text-xs text-right"><span className={tauxColor(e.cpReports > 0 ? (e.engReports / e.cpReports) * 100 : 0)}>{formatPercent(e.cpReports > 0 ? (e.engReports / e.cpReports) * 100 : 0)}</span></TableCell>
                            <TableCell className="text-xs text-gray-700 text-right">{formatMillions(e.engConsolides)}</TableCell>
                            <TableCell className="text-xs text-right"><span className={tauxColor(e.cpConsolides > 0 ? (e.engConsolides / e.cpConsolides) * 100 : 0)}>{formatPercent(e.cpConsolides > 0 ? (e.engConsolides / e.cpConsolides) * 100 : 0)}</span></TableCell>
                            <TableCell className="text-xs text-gray-700 text-right">{formatMillions(e.engNouveaux)}</TableCell>
                            <TableCell className="text-xs text-right"><span className={tauxColor(e.cpNouveaux > 0 ? (e.engNouveaux / e.cpNouveaux) * 100 : 0)}>{formatPercent(e.cpNouveaux > 0 ? (e.engNouveaux / e.cpNouveaux) * 100 : 0)}</span></TableCell>
                            <TableCell className="text-xs font-semibold text-emerald-700 text-right">{formatMillions(e.engCP)}</TableCell>
                            <TableCell className="text-xs text-right"><span className={tauxColor(e.tauxEngagement)}>{formatPercent(e.tauxEngagement)}</span></TableCell>
                            <TableCell className="text-xs text-gray-700 text-right">{formatMillions(e.cp - e.engCP)}</TableCell>
                            <TableCell className="text-xs text-gray-700 text-right">{formatMillions(e.ce)}</TableCell>
                            <TableCell className="text-xs font-semibold text-teal-700 text-right">{formatMillions(e.engCE)}</TableCell>
                            <TableCell className="text-xs text-right"><span className={tauxColor(e.ce > 0 ? (e.engCE / e.ce) * 100 : 0)}>{formatPercent(e.ce > 0 ? (e.engCE / e.ce) * 100 : 0)}</span></TableCell>
                            <TableCell className="text-xs text-gray-700 text-right">{formatMillions(e.ce - e.engCE)}</TableCell>
                          </TableRow>
                        ))}
                        <TableRow className="bg-slate-50/40 font-bold">
                          <TableCell className="text-xs font-bold text-gray-900">TOTAL</TableCell>
                          <TableCell className="text-xs font-bold text-gray-900 text-right">{formatMillions(totCpReports)}</TableCell>
                          <TableCell className="text-xs font-bold text-gray-900 text-right">{formatMillions(totCpConsolides)}</TableCell>
                          <TableCell className="text-xs font-bold text-gray-900 text-right">{formatMillions(totCpNouveaux)}</TableCell>
                          <TableCell className="text-xs font-bold text-gray-900 text-right">{formatMillions(totCP)}</TableCell>
                          <TableCell className="text-xs font-bold text-gray-900 text-right">{formatMillions(totEngReports)}</TableCell>
                          <TableCell className="text-xs font-bold text-right"><span className={tauxColor(totCpReports > 0 ? (totEngReports / totCpReports) * 100 : 0)}>{formatPercent(totCpReports > 0 ? (totEngReports / totCpReports) * 100 : 0)}</span></TableCell>
                          <TableCell className="text-xs font-bold text-gray-900 text-right">{formatMillions(totEngConsolides)}</TableCell>
                          <TableCell className="text-xs font-bold text-right"><span className={tauxColor(totCpConsolides > 0 ? (totEngConsolides / totCpConsolides) * 100 : 0)}>{formatPercent(totCpConsolides > 0 ? (totEngConsolides / totCpConsolides) * 100 : 0)}</span></TableCell>
                          <TableCell className="text-xs font-bold text-gray-900 text-right">{formatMillions(totEngNouveaux)}</TableCell>
                          <TableCell className="text-xs font-bold text-right"><span className={tauxColor(totCpNouveaux > 0 ? (totEngNouveaux / totCpNouveaux) * 100 : 0)}>{formatPercent(totCpNouveaux > 0 ? (totEngNouveaux / totCpNouveaux) * 100 : 0)}</span></TableCell>
                          <TableCell className="text-xs font-bold text-emerald-700 text-right">{formatMillions(totEngCP)}</TableCell>
                          <TableCell className="text-xs font-bold text-right"><span className={tauxColor(totCP > 0 ? (totEngCP / totCP) * 100 : 0)}>{formatPercent(totCP > 0 ? (totEngCP / totCP) * 100 : 0)}</span></TableCell>
                          <TableCell className="text-xs font-bold text-gray-900 text-right">{formatMillions(totCP - totEngCP)}</TableCell>
                          <TableCell className="text-xs font-bold text-gray-900 text-right">{formatMillions(totCE)}</TableCell>
                          <TableCell className="text-xs font-bold text-teal-700 text-right">{formatMillions(totEngCE)}</TableCell>
                          <TableCell className="text-xs font-bold text-right"><span className={tauxColor(totCE > 0 ? (totEngCE / totCE) * 100 : 0)}>{formatPercent(totCE > 0 ? (totEngCE / totCE) * 100 : 0)}</span></TableCell>
                          <TableCell className="text-xs font-bold text-gray-900 text-right">{formatMillions(totCE - totEngCE)}</TableCell>
                        </TableRow>
                      </>
                    )
                  })()}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Engagement Lines Table */}
        <Card className="border border-gray-100 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-gray-700">Détail des engagements ({engagementLines.length} lignes)</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="text-xs font-semibold text-gray-600">N° Engagement</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-600">Désignation</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-600">entité</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-600">Projet</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-600 text-right">Eng. Reports</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-600 text-right">Eng. Consolidés</TableHead>
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
                      <TableCell className="text-xs text-gray-600">{r.projet || 'Non classé'}</TableCell>
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
        {/* ═══════════ SECTION 1 : ORDONNANCEMENT GLOBAL ═══════════ */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-1 h-5 rounded-full bg-gradient-to-b from-blue-500 to-cyan-600" />
            <h3 className="text-sm font-bold text-gray-800 tracking-wide uppercase">Ordonnancements</h3>
            <span className="text-[11px] text-gray-400 font-medium">(M DH)</span>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Total Ordonnancements avec taux */}
            <div className="kpi-card-premium rounded-xl border border-blue-100 overflow-hidden cursor-default" style={{ background: 'linear-gradient(135deg, #ffffff 0%, #eff6ff 100%)' }}>
              <div className="h-1.5 bg-gradient-to-r from-blue-500 to-indigo-600" />
              <div className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="kpi-icon-wrap w-11 h-11 rounded-full bg-blue-100 flex items-center justify-center transition-transform">
                        <Wallet className="w-5 h-5 text-blue-700" />
                      </div>
                      <span className="text-sm font-semibold text-gray-600">Total Ordonnancements</span>
                    </div>
                    <p className="text-3xl font-black text-gray-900 tracking-tight">{formatMillions(totalOrd)}</p>
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex items-center gap-1 text-sm font-bold ${tauxColor(tauxGlobal)}`}>
                      {tauxGlobal >= 80 ? '✓' : tauxGlobal >= 50 ? '⚠' : '✗'}
                      {formatPercent(tauxGlobal)}
                    </span>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      {tauxGlobal >= 80 ? 'Bon' : tauxGlobal >= 50 ? 'Moyen' : 'Faible'}
                    </p>
                  </div>
                </div>
                <div className="mt-3">
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`kpi-progress-bar h-full rounded-full ${tauxGlobal >= 80 ? 'bg-gradient-to-r from-emerald-400 to-emerald-600' : tauxGlobal >= 50 ? 'bg-gradient-to-r from-amber-400 to-amber-500' : 'bg-gradient-to-r from-red-400 to-red-500'}`} style={{ width: `${Math.min(tauxGlobal, 100)}%` }} />
                  </div>
                  <div className="flex justify-between mt-1.5">
                    <span className="text-[10px] text-gray-400">0%</span>
                    <span className="text-[10px] text-gray-400">Reste : {formatMillions(kpis.totalEngCP - totalOrd)}</span>
                    <span className="text-[10px] text-gray-400">100%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Nb Ordonnancements + Volume */}
            <div className="grid grid-cols-2 gap-4">
              {/* Nb Ordonnancements */}
              <div className="kpi-card-premium bg-white rounded-xl border border-gray-100 overflow-hidden cursor-default">
                <div className="h-1.5 bg-gradient-to-r from-violet-400 to-violet-600" />
                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="kpi-icon-wrap w-10 h-10 rounded-full bg-violet-50 flex items-center justify-center transition-transform">
                      <FileText className="w-5 h-5 text-violet-600" />
                    </div>
                    <Badge className="bg-violet-50 text-violet-700 border-violet-200 text-[10px] font-semibold rounded-full px-2.5">Nb</Badge>
                  </div>
                  <p className="text-2xl font-black text-gray-900 tracking-tight">{nbOrd}</p>
                  <p className="text-[11px] text-gray-400 mt-1.5 font-medium">Ordonnancements</p>
                </div>
              </div>

              {/* Paiements */}
              <div className="kpi-card-premium bg-white rounded-xl border border-gray-100 overflow-hidden cursor-default">
                <div className="h-1.5 bg-gradient-to-r from-cyan-400 to-cyan-600" />
                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="kpi-icon-wrap w-10 h-10 rounded-full bg-cyan-50 flex items-center justify-center transition-transform">
                      <Wallet className="w-5 h-5 text-cyan-600" />
                    </div>
                    <Badge className="bg-cyan-50 text-cyan-700 border-cyan-200 text-[10px] font-semibold rounded-full px-2.5">Paiements</Badge>
                  </div>
                  <p className="text-2xl font-black text-gray-900 tracking-tight">{formatMillions(kpis.totalPaiements)}</p>
                  <p className="text-[11px] text-gray-400 mt-1.5 font-medium">Total paiements</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ═══════════ SECTION 2 : RÉPARTITION ═══════════ */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-1 h-5 rounded-full bg-gradient-to-b from-sky-500 to-blue-600" />
            <h3 className="text-sm font-bold text-gray-800 tracking-wide uppercase">Répartition</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Ord. Reports */}
            <div className="kpi-card-premium bg-white rounded-xl border border-gray-100 overflow-hidden cursor-default">
              <div className="h-1.5 bg-gradient-to-r from-sky-400 to-blue-500" />
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="kpi-icon-wrap w-10 h-10 rounded-full bg-sky-50 flex items-center justify-center transition-transform">
                    <RotateCcw className="w-5 h-5 text-sky-600" />
                  </div>
                  <Badge className="bg-sky-50 text-sky-700 border-sky-200 text-[10px] font-semibold rounded-full px-2.5">Reports</Badge>
                </div>
                <p className="text-2xl font-black text-gray-900 tracking-tight">{formatMillions(ordonnancementBreakdown.ordReports)}</p>
                <p className="text-[11px] text-gray-400 mt-1.5 font-medium">{formatPercent(ordonnancementBreakdown.pctReports)} du total</p>
              </div>
            </div>

            {/* Ord. Consolidés */}
            <div className="kpi-card-premium bg-white rounded-xl border border-gray-100 overflow-hidden cursor-default">
              <div className="h-1.5 bg-gradient-to-r from-emerald-400 to-emerald-600" />
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="kpi-icon-wrap w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center transition-transform">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  </div>
                  <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] font-semibold rounded-full px-2.5">Consolidés</Badge>
                </div>
                <p className="text-2xl font-black text-gray-900 tracking-tight">{formatMillions(ordonnancementBreakdown.ordConsolides)}</p>
                <p className="text-[11px] text-gray-400 mt-1.5 font-medium">{formatPercent(ordonnancementBreakdown.pctConsolides)} du total</p>
              </div>
            </div>

            {/* Ord. Nouveaux */}
            <div className="kpi-card-premium bg-white rounded-xl border border-gray-100 overflow-hidden cursor-default">
              <div className="h-1.5 bg-gradient-to-r from-cyan-400 to-teal-500" />
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="kpi-icon-wrap w-10 h-10 rounded-full bg-cyan-50 flex items-center justify-center transition-transform">
                    <TrendingUp className="w-5 h-5 text-cyan-600" />
                  </div>
                  <Badge className="bg-cyan-50 text-cyan-700 border-cyan-200 text-[10px] font-semibold rounded-full px-2.5">Nouveaux</Badge>
                </div>
                <p className="text-2xl font-black text-gray-900 tracking-tight">{formatMillions(ordonnancementBreakdown.ordNouveaux)}</p>
                <p className="text-[11px] text-gray-400 mt-1.5 font-medium">{formatPercent(ordonnancementBreakdown.pctNouveaux)} du total</p>
              </div>
            </div>
          </div>
        </div>

        {/* Prévisions Ordonnancement Cumulés par Projet */}
        <Card className="border border-gray-100 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-gray-700">Prévisions ordonnancement cumulées par projet (M DH)</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-teal-50/60">
                    <TableHead className="text-xs font-semibold text-teal-700">Projet</TableHead>
                    <TableHead className="text-xs font-semibold text-teal-700 text-right">Eng. CP Total</TableHead>
                    <TableHead className="text-xs font-semibold text-teal-700 text-right">Ord. Total</TableHead>
                    <TableHead className="text-xs font-semibold text-teal-700 text-right">Prévisions Tot.</TableHead>
                    <TableHead className="text-xs font-semibold text-teal-700 text-right">Taux réal.</TableHead>
                    <TableHead className="text-xs font-semibold text-teal-700 text-right">Écart</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(() => {
                    const prevByProjet = analysisByGroup.map(g => {
                      const rows = filteredData.filter(r => r.Projet === g.name)
                      const previsions = rows.reduce((s, r) => s + (r['TOTAL PREV'] || 0), 0)
                      return { ...g, previsions }
                    }).filter(g => g.previsions > 0 || g.ord > 0).sort((a, b) => b.previsions - a.previsions)
                    const totalPrev = prevByProjet.reduce((s, g) => s + g.previsions, 0)
                    const totalEngCP = prevByProjet.reduce((s, g) => s + g.engCP, 0)
                    const totalOrd2 = prevByProjet.reduce((s, g) => s + g.ord, 0)
                    return (
                      <>
                        {prevByProjet.map(g => (
                          <TableRow key={g.name} className="hover:bg-gray-50">
                            <TableCell className="text-xs font-medium text-gray-900">{g.name}</TableCell>
                            <TableCell className="text-xs text-gray-700 text-right">{formatMillions(g.engCP)}</TableCell>
                            <TableCell className="text-xs text-gray-700 text-right">{formatMillions(g.ord)}</TableCell>
                            <TableCell className="text-xs text-gray-700 text-right">{formatMillions(g.previsions)}</TableCell>
                            <TableCell className="text-xs text-right">
                              <span className={tauxColor(g.previsions > 0 ? (g.ord / g.previsions) * 100 : 0)}>
                                {formatPercent(g.previsions > 0 ? (g.ord / g.previsions) * 100 : 0)}
                              </span>
                            </TableCell>
                            <TableCell className="text-xs text-gray-700 text-right">{formatMillions(g.previsions - g.ord)}</TableCell>
                          </TableRow>
                        ))}
                        <TableRow className="bg-teal-50/40 font-bold">
                          <TableCell className="text-xs font-bold text-gray-900">TOTAL</TableCell>
                          <TableCell className="text-xs font-bold text-gray-900 text-right">{formatMillions(totalEngCP)}</TableCell>
                          <TableCell className="text-xs font-bold text-gray-900 text-right">{formatMillions(totalOrd2)}</TableCell>
                          <TableCell className="text-xs font-bold text-gray-900 text-right">{formatMillions(totalPrev)}</TableCell>
                          <TableCell className="text-xs font-bold text-right">
                            <span className={tauxColor(totalPrev > 0 ? (totalOrd2 / totalPrev) * 100 : 0)}>
                              {formatPercent(totalPrev > 0 ? (totalOrd2 / totalPrev) * 100 : 0)}
                            </span>
                          </TableCell>
                          <TableCell className="text-xs font-bold text-gray-900 text-right">{formatMillions(totalPrev - totalOrd2)}</TableCell>
                        </TableRow>
                      </>
                    )
                  })()}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Ordonnancement Lines Table */}
        <Card className="border border-gray-100 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-gray-700">Détail des ordonnancements ({ordonnancementLines.length} lignes)</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="text-xs font-semibold text-gray-600">N° Engagement</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-600">Désignation</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-600">entité</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-600">Projet</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-600 text-right">Ord. Reports</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-600 text-right">Ord. Consolidés</TableHead>
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
                      <TableCell className="text-xs text-gray-600">{r.projet || 'Non classé'}</TableCell>
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

  const renderReportsView = () => {
    return (
      <>
        {/* ═══════════ SECTION 1 : SYNTHÈSE GÉNÉRALE ═══════════ */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-1 h-5 rounded-full bg-gradient-to-b from-blue-500 to-indigo-600" />
            <h3 className="text-sm font-bold text-gray-800 tracking-wide uppercase">Synthèse générale</h3>
            <span className="text-[11px] text-gray-400 font-medium">(M DH)</span>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Budget total */}
            <div className="kpi-card-premium bg-white rounded-xl border border-gray-100 overflow-hidden cursor-default">
              <div className="h-1.5 bg-gradient-to-r from-blue-400 to-blue-600" />
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="kpi-icon-wrap w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center transition-transform">
                    <Scale className="w-5 h-5 text-blue-600" />
                  </div>
                  <Badge className="bg-blue-50 text-blue-700 border-blue-200 text-[10px] font-semibold rounded-full px-2.5">Budget</Badge>
                </div>
                <p className="text-2xl font-black text-gray-900 tracking-tight">{formatMillions(kpis.totalCP)}</p>
                <p className="text-[11px] text-gray-400 mt-1.5 font-medium">Budget total CP</p>
              </div>
            </div>

            {/* Engagements */}
            <div className="kpi-card-premium bg-white rounded-xl border border-gray-100 overflow-hidden cursor-default">
              <div className="h-1.5 bg-gradient-to-r from-emerald-400 to-emerald-600" />
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="kpi-icon-wrap w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center transition-transform">
                    <TrendingUp className="w-5 h-5 text-emerald-600" />
                  </div>
                  <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] font-semibold rounded-full px-2.5">Eng.</Badge>
                </div>
                <p className="text-2xl font-black text-gray-900 tracking-tight">{formatMillions(kpis.totalEngCP)}</p>
                <p className="text-[11px] text-gray-400 mt-1.5 font-medium">Total engagements</p>
              </div>
            </div>

            {/* Ordonnancements */}
            <div className="kpi-card-premium bg-white rounded-xl border border-gray-100 overflow-hidden cursor-default">
              <div className="h-1.5 bg-gradient-to-r from-blue-400 to-indigo-600" />
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="kpi-icon-wrap w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center transition-transform">
                    <Wallet className="w-5 h-5 text-blue-600" />
                  </div>
                  <Badge className="bg-blue-50 text-blue-700 border-blue-200 text-[10px] font-semibold rounded-full px-2.5">Ord.</Badge>
                </div>
                <p className="text-2xl font-black text-gray-900 tracking-tight">{formatMillions(kpis.totalOrd)}</p>
                <p className="text-[11px] text-gray-400 mt-1.5 font-medium">Total ordonnancements</p>
              </div>
            </div>

            {/* Disponible */}
            <div className="kpi-card-premium bg-white rounded-xl border border-gray-100 overflow-hidden cursor-default">
              <div className="h-1.5 bg-gradient-to-r from-violet-400 to-purple-500" />
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="kpi-icon-wrap w-10 h-10 rounded-full bg-violet-50 flex items-center justify-center transition-transform">
                    <Landmark className="w-5 h-5 text-violet-600" />
                  </div>
                  <Badge className="bg-violet-50 text-violet-700 border-violet-200 text-[10px] font-semibold rounded-full px-2.5">Reste</Badge>
                </div>
                <p className="text-2xl font-black text-gray-900 tracking-tight">{formatMillions(kpis.disponible)}</p>
                <p className="text-[11px] text-gray-400 mt-1.5 font-medium">Disponible</p>
              </div>
            </div>
          </div>
        </div>

        {/* Entity Comparison Table */}
        <Card className="border border-gray-100 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-gray-700">Résumé comparatif par entité</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="text-xs font-semibold text-gray-600">entité</TableHead>
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
              Structure budgétaire
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
                    label={({ name, percent, value }: { name: string; percent: number; value: number }) => `${name} ${value.toLocaleString('fr-FR', { minimumFractionDigits: 1 })} M DH (${(percent * 100).toFixed(1)}%)`}
                  >
                    {budgetStructureData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => `${value.toLocaleString('fr-FR', { minimumFractionDigits: 1 })} M DH`} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-3">
                {budgetStructureData.map((item, idx) => (
                  <div key={item.name} className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }} />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{item.name}</p>
                      <p className="text-xs text-gray-500">{item.value.toLocaleString('fr-FR', { minimumFractionDigits: 1 })} M DH</p>
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
            Exporter CSV (données filtrées)
          </Button>
        </div>
      </>
    )
  }

  const renderSettingsView = () => {
    return (
      <>
        <h2 className="text-lg font-bold text-gray-900">Paramètres</h2>

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
                <p className="text-xs text-gray-500">Rafraîchir les données automatiquement</p>
              </div>
              <Switch checked={autoRefresh} onCheckedChange={setAutoRefresh} />
            </div>
            {autoRefresh && (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">Intervalle</p>
                  <p className="text-xs text-gray-500">Fréquence de rafraîchissement</p>
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
              Préférences d&apos;affichage
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
                  <SelectItem value="millions">Millions M DH</SelectItem>
                  <SelectItem value="full">Complet</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">Page par défaut</p>
                <p className="text-xs text-gray-500">Page affichée au chargement</p>
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
              Gestion des données
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">Importer un fichier Excel</p>
                <p className="text-xs text-gray-500">Charger de nouvelles données depuis un fichier .xlsx ou .xls</p>
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
                <p className="text-xs text-gray-500">Dernière mise à jour</p>
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
            <CardTitle className="text-sm font-semibold text-gray-700">À propos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Version</span>
                <Badge variant="secondary" className="text-xs">1.0.0</Badge>
              </div>
              <p className="text-xs text-gray-500">
                Tableau de bord de situation d&apos;exécution du budget d&apos;investissement.
                Application dédiée au suivi et à l&apos;analyse des engagements, ordonnancements
                et paiements relatifs au budget d&apos;investissement.
              </p>
            </div>
          </CardContent>
        </Card>
      </>
    )
  }

  const renderAssainissementView = () => {
    // Calculate reports-focused metrics
    const totalReports = filteredData.reduce((s, r) => s + (r.REPORTS || 0), 0)
    const totalEngReports = filteredData.reduce((s, r) => s + (r['ENG REPORT'] || 0), 0)
    const totalOrdReports = filteredData.reduce((s, r) => s + (r['ORD REPORTS'] || 0), 0)
    const tauxEngReports = totalReports > 0 ? (totalEngReports / totalReports) * 100 : 0
    const tauxOrdReports = totalEngReports > 0 ? (totalOrdReports / totalEngReports) * 100 : 0
    const resteEngagerReports = totalReports - totalEngReports
    const resteOrdonnerReports = totalEngReports - totalOrdReports

    // Group by entity for reports analysis
    const reportsByEntity = analysisByEntity.map(e => {
      const rows = filteredData.filter(r => r.ENTITE === e.name)
      const reports = rows.reduce((s, r) => s + (r.REPORTS || 0), 0)
      const engReports = rows.reduce((s, r) => s + (r['ENG REPORT'] || 0), 0)
      const ordReports = rows.reduce((s, r) => s + (r['ORD REPORTS'] || 0), 0)
      const paiementsReports = rows.reduce((s, r) => s + (r['PAIEMENTS SUR REPORTS'] || 0), 0)
      return {
        name: e.name,
        reports,
        engReports,
        ordReports,
        paiementsReports,
        tauxEngReports: reports > 0 ? (engReports / reports) * 100 : 0,
        tauxOrdReports: engReports > 0 ? (ordReports / engReports) * 100 : 0,
        resteEngager: reports - engReports,
        resteOrdonner: engReports - ordReports,
      }
    }).filter(e => e.reports > 0).sort((a, b) => b.reports - a.reports)

    // Group by projet for reports analysis
    const reportsByProjet = analysisByGroup.map(g => {
      const rows = filteredData.filter(r => r.Projet === g.name)
      const reports = rows.reduce((s, r) => s + (r.REPORTS || 0), 0)
      const engReports = rows.reduce((s, r) => s + (r['ENG REPORT'] || 0), 0)
      const ordReports = rows.reduce((s, r) => s + (r['ORD REPORTS'] || 0), 0)
      const paiementsReports = rows.reduce((s, r) => s + (r['PAIEMENTS SUR REPORTS'] || 0), 0)
      return {
        name: g.name,
        reports,
        engReports,
        ordReports,
        paiementsReports,
        tauxEngReports: reports > 0 ? (engReports / reports) * 100 : 0,
        tauxOrdReports: engReports > 0 ? (ordReports / engReports) * 100 : 0,
        resteEngager: reports - engReports,
        resteOrdonner: engReports - ordReports,
      }
    }).filter(g => g.reports > 0).sort((a, b) => b.reports - a.reports)

    return (
      <>
        {/* ═══════════ SECTION 1 : REPORTS ═══════════ */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-1 h-5 rounded-full bg-gradient-to-b from-blue-500 to-indigo-600" />
            <h3 className="text-sm font-bold text-gray-800 tracking-wide uppercase">Reports</h3>
            <span className="text-[11px] text-gray-400 font-medium">(M DH)</span>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Crédits reportés */}
            <div className="kpi-card-premium bg-white rounded-xl border border-gray-100 overflow-hidden cursor-default">
              <div className="h-1.5 bg-gradient-to-r from-blue-400 to-blue-600" />
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="kpi-icon-wrap w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center transition-transform">
                    <RotateCcw className="w-5 h-5 text-blue-600" />
                  </div>
                  <Badge className="bg-blue-50 text-blue-700 border-blue-200 text-[10px] font-semibold rounded-full px-2.5">Reports</Badge>
                </div>
                <p className="text-2xl font-black text-gray-900 tracking-tight">{formatMillions(totalReports)}</p>
                <p className="text-[11px] text-gray-400 mt-1.5 font-medium">Crédits reportés</p>
              </div>
            </div>

            {/* Engagements sur reports */}
            <div className="kpi-card-premium bg-white rounded-xl border border-gray-100 overflow-hidden cursor-default">
              <div className="h-1.5 bg-gradient-to-r from-emerald-400 to-emerald-600" />
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="kpi-icon-wrap w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center transition-transform">
                    <TrendingUp className="w-5 h-5 text-emerald-600" />
                  </div>
                  <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] font-semibold rounded-full px-2.5">Eng.</Badge>
                </div>
                <p className="text-2xl font-black text-gray-900 tracking-tight">{formatMillions(totalEngReports)}</p>
                <p className="text-[11px] text-gray-400 mt-1.5 font-medium">Taux : <span className={tauxColor(tauxEngReports)}>{formatPercent(tauxEngReports)}</span></p>
              </div>
            </div>

            {/* Ordonnancements sur reports */}
            <div className="kpi-card-premium bg-white rounded-xl border border-gray-100 overflow-hidden cursor-default">
              <div className="h-1.5 bg-gradient-to-r from-violet-400 to-violet-600" />
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="kpi-icon-wrap w-10 h-10 rounded-full bg-violet-50 flex items-center justify-center transition-transform">
                    <Wallet className="w-5 h-5 text-violet-600" />
                  </div>
                  <Badge className="bg-violet-50 text-violet-700 border-violet-200 text-[10px] font-semibold rounded-full px-2.5">Ord.</Badge>
                </div>
                <p className="text-2xl font-black text-gray-900 tracking-tight">{formatMillions(totalOrdReports)}</p>
                <p className="text-[11px] text-gray-400 mt-1.5 font-medium">Taux : <span className={tauxColor(tauxOrdReports)}>{formatPercent(tauxOrdReports)}</span></p>
              </div>
            </div>

            {/* Reste à engager */}
            <div className="kpi-card-premium bg-white rounded-xl border border-gray-100 overflow-hidden cursor-default">
              <div className="h-1.5 bg-gradient-to-r from-red-400 to-red-500" />
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="kpi-icon-wrap w-10 h-10 rounded-full bg-red-50 flex items-center justify-center transition-transform">
                    <Landmark className="w-5 h-5 text-red-600" />
                  </div>
                  <Badge className="bg-red-50 text-red-700 border-red-200 text-[10px] font-semibold rounded-full px-2.5">Reste</Badge>
                </div>
                <p className="text-2xl font-black text-gray-900 tracking-tight">{formatMillions(resteEngagerReports)}</p>
                <p className="text-[11px] text-gray-400 mt-1.5 font-medium">Reste à ordonner : {formatMillions(resteOrdonnerReports)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* ═══════════ SECTION 2 : TAUX D'ASSAINISSEMENT ═══════════ */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-1 h-5 rounded-full bg-gradient-to-b from-emerald-500 to-teal-600" />
            <h3 className="text-sm font-bold text-gray-800 tracking-wide uppercase">Taux d&apos;assainissement</h3>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Taux Engagement Reports */}
            <div className="kpi-card-premium rounded-xl border border-emerald-100 overflow-hidden cursor-default" style={{ background: 'linear-gradient(135deg, #ffffff 0%, #f0fdf4 100%)' }}>
              <div className="h-1.5 bg-gradient-to-r from-emerald-400 to-teal-500" />
              <div className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="kpi-icon-wrap w-11 h-11 rounded-full bg-emerald-100 flex items-center justify-center transition-transform">
                        <TrendingUp className="w-5 h-5 text-emerald-700" />
                      </div>
                      <span className="text-sm font-semibold text-gray-600">Taux eng. reports</span>
                    </div>
                    <p className="text-3xl font-black text-gray-900 tracking-tight">{formatPercent(tauxEngReports)}</p>
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex items-center gap-1 text-sm font-bold ${tauxColor(tauxEngReports)}`}>
                      {tauxEngReports >= 80 ? '✓' : tauxEngReports >= 50 ? '⚠' : '✗'}
                      {tauxEngReports >= 80 ? 'Bon' : tauxEngReports >= 50 ? 'Moyen' : 'Faible'}
                    </span>
                    <p className="text-[11px] text-gray-400 mt-0.5">Eng. / Crédits reports</p>
                  </div>
                </div>
                <div className="mt-3">
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`kpi-progress-bar h-full rounded-full ${tauxEngReports >= 80 ? 'bg-gradient-to-r from-emerald-400 to-emerald-600' : tauxEngReports >= 50 ? 'bg-gradient-to-r from-amber-400 to-amber-500' : 'bg-gradient-to-r from-red-400 to-red-500'}`} style={{ width: `${Math.min(tauxEngReports, 100)}%` }} />
                  </div>
                  <div className="flex justify-between mt-1.5">
                    <span className="text-[10px] text-gray-400">0%</span>
                    <span className="text-[10px] text-gray-400">Reste : {formatMillions(resteEngagerReports)}</span>
                    <span className="text-[10px] text-gray-400">100%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Taux Ordonnancement Reports */}
            <div className="kpi-card-premium rounded-xl border border-blue-100 overflow-hidden cursor-default" style={{ background: 'linear-gradient(135deg, #ffffff 0%, #eff6ff 100%)' }}>
              <div className="h-1.5 bg-gradient-to-r from-blue-400 to-indigo-500" />
              <div className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="kpi-icon-wrap w-11 h-11 rounded-full bg-blue-100 flex items-center justify-center transition-transform">
                        <Wallet className="w-5 h-5 text-blue-700" />
                      </div>
                      <span className="text-sm font-semibold text-gray-600">Taux ord. reports</span>
                    </div>
                    <p className="text-3xl font-black text-gray-900 tracking-tight">{formatPercent(tauxOrdReports)}</p>
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex items-center gap-1 text-sm font-bold ${tauxColor(tauxOrdReports)}`}>
                      {tauxOrdReports >= 80 ? '✓' : tauxOrdReports >= 50 ? '⚠' : '✗'}
                      {tauxOrdReports >= 80 ? 'Bon' : tauxOrdReports >= 50 ? 'Moyen' : 'Faible'}
                    </span>
                    <p className="text-[11px] text-gray-400 mt-0.5">Ord. / Eng. reports</p>
                  </div>
                </div>
                <div className="mt-3">
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`kpi-progress-bar h-full rounded-full ${tauxOrdReports >= 80 ? 'bg-gradient-to-r from-emerald-400 to-emerald-600' : tauxOrdReports >= 50 ? 'bg-gradient-to-r from-amber-400 to-amber-500' : 'bg-gradient-to-r from-red-400 to-red-500'}`} style={{ width: `${Math.min(tauxOrdReports, 100)}%` }} />
                  </div>
                  <div className="flex justify-between mt-1.5">
                    <span className="text-[10px] text-gray-400">0%</span>
                    <span className="text-[10px] text-gray-400">Reste : {formatMillions(resteOrdonnerReports)}</span>
                    <span className="text-[10px] text-gray-400">100%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Table by Entity */}
        <Card className="border border-gray-100 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-gray-700">Assainissement par entité (M DH)</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-blue-50/60">
                    <TableHead className="text-xs font-semibold text-blue-700">Entité</TableHead>
                    <TableHead className="text-xs font-semibold text-blue-700 text-right">Crédits Report</TableHead>
                    <TableHead className="text-xs font-semibold text-blue-700 text-right">Eng. Reports</TableHead>
                    <TableHead className="text-xs font-semibold text-blue-700 text-right">Taux eng.</TableHead>
                    <TableHead className="text-xs font-semibold text-blue-700 text-right">Ord. Reports</TableHead>
                    <TableHead className="text-xs font-semibold text-blue-700 text-right">Taux ord.</TableHead>
                    <TableHead className="text-xs font-semibold text-blue-700 text-right">Paiements Reports</TableHead>
                    <TableHead className="text-xs font-semibold text-blue-700 text-right">Reste à engager</TableHead>
                    <TableHead className="text-xs font-semibold text-blue-700 text-right">Reste à ordonner</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reportsByEntity.map(e => (
                    <TableRow key={e.name} className="hover:bg-gray-50">
                      <TableCell className="text-xs font-medium text-gray-900">{e.name}</TableCell>
                      <TableCell className="text-xs text-gray-700 text-right">{formatMillions(e.reports)}</TableCell>
                      <TableCell className="text-xs text-gray-700 text-right">{formatMillions(e.engReports)}</TableCell>
                      <TableCell className="text-xs text-right"><span className={tauxColor(e.tauxEngReports)}>{formatPercent(e.tauxEngReports)}</span></TableCell>
                      <TableCell className="text-xs text-gray-700 text-right">{formatMillions(e.ordReports)}</TableCell>
                      <TableCell className="text-xs text-right"><span className={tauxColor(e.tauxOrdReports)}>{formatPercent(e.tauxOrdReports)}</span></TableCell>
                      <TableCell className="text-xs text-gray-700 text-right">{formatMillions(e.paiementsReports)}</TableCell>
                      <TableCell className="text-xs text-gray-700 text-right">{formatMillions(e.resteEngager)}</TableCell>
                      <TableCell className="text-xs text-gray-700 text-right">{formatMillions(e.resteOrdonner)}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-blue-50/40 font-bold">
                    <TableCell className="text-xs font-bold text-gray-900">TOTAL</TableCell>
                    <TableCell className="text-xs font-bold text-gray-900 text-right">{formatMillions(totalReports)}</TableCell>
                    <TableCell className="text-xs font-bold text-gray-900 text-right">{formatMillions(totalEngReports)}</TableCell>
                    <TableCell className="text-xs font-bold text-right"><span className={tauxColor(tauxEngReports)}>{formatPercent(tauxEngReports)}</span></TableCell>
                    <TableCell className="text-xs font-bold text-gray-900 text-right">{formatMillions(totalOrdReports)}</TableCell>
                    <TableCell className="text-xs font-bold text-right"><span className={tauxColor(tauxOrdReports)}>{formatPercent(tauxOrdReports)}</span></TableCell>
                    <TableCell className="text-xs font-bold text-gray-900 text-right">{formatMillions(filteredData.reduce((s, r) => s + (r['PAIEMENTS SUR REPORTS'] || 0), 0))}</TableCell>
                    <TableCell className="text-xs font-bold text-gray-900 text-right">{formatMillions(resteEngagerReports)}</TableCell>
                    <TableCell className="text-xs font-bold text-gray-900 text-right">{formatMillions(resteOrdonnerReports)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Table by Projet */}
        <Card className="border border-gray-100 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-gray-700">Assainissement par projet (M DH)</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-emerald-50/60">
                    <TableHead className="text-xs font-semibold text-emerald-700">Projet</TableHead>
                    <TableHead className="text-xs font-semibold text-emerald-700 text-right">Crédits Report</TableHead>
                    <TableHead className="text-xs font-semibold text-emerald-700 text-right">Eng. Reports</TableHead>
                    <TableHead className="text-xs font-semibold text-emerald-700 text-right">Taux eng.</TableHead>
                    <TableHead className="text-xs font-semibold text-emerald-700 text-right">Ord. Reports</TableHead>
                    <TableHead className="text-xs font-semibold text-emerald-700 text-right">Taux ord.</TableHead>
                    <TableHead className="text-xs font-semibold text-emerald-700 text-right">Paiements Reports</TableHead>
                    <TableHead className="text-xs font-semibold text-emerald-700 text-right">Reste à engager</TableHead>
                    <TableHead className="text-xs font-semibold text-emerald-700 text-right">Reste à ordonner</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reportsByProjet.map(g => (
                    <TableRow key={g.name} className="hover:bg-gray-50">
                      <TableCell className="text-xs font-medium text-gray-900">{g.name}</TableCell>
                      <TableCell className="text-xs text-gray-700 text-right">{formatMillions(g.reports)}</TableCell>
                      <TableCell className="text-xs text-gray-700 text-right">{formatMillions(g.engReports)}</TableCell>
                      <TableCell className="text-xs text-right"><span className={tauxColor(g.tauxEngReports)}>{formatPercent(g.tauxEngReports)}</span></TableCell>
                      <TableCell className="text-xs text-gray-700 text-right">{formatMillions(g.ordReports)}</TableCell>
                      <TableCell className="text-xs text-right"><span className={tauxColor(g.tauxOrdReports)}>{formatPercent(g.tauxOrdReports)}</span></TableCell>
                      <TableCell className="text-xs text-gray-700 text-right">{formatMillions(g.paiementsReports)}</TableCell>
                      <TableCell className="text-xs text-gray-700 text-right">{formatMillions(g.resteEngager)}</TableCell>
                      <TableCell className="text-xs text-gray-700 text-right">{formatMillions(g.resteOrdonner)}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-emerald-50/40 font-bold">
                    <TableCell className="text-xs font-bold text-gray-900">TOTAL</TableCell>
                    <TableCell className="text-xs font-bold text-gray-900 text-right">{formatMillions(totalReports)}</TableCell>
                    <TableCell className="text-xs font-bold text-gray-900 text-right">{formatMillions(totalEngReports)}</TableCell>
                    <TableCell className="text-xs font-bold text-right"><span className={tauxColor(tauxEngReports)}>{formatPercent(tauxEngReports)}</span></TableCell>
                    <TableCell className="text-xs font-bold text-gray-900 text-right">{formatMillions(totalOrdReports)}</TableCell>
                    <TableCell className="text-xs font-bold text-right"><span className={tauxColor(tauxOrdReports)}>{formatPercent(tauxOrdReports)}</span></TableCell>
                    <TableCell className="text-xs font-bold text-gray-900 text-right">{formatMillions(filteredData.reduce((s, r) => s + (r['PAIEMENTS SUR REPORTS'] || 0), 0))}</TableCell>
                    <TableCell className="text-xs font-bold text-gray-900 text-right">{formatMillions(resteEngagerReports)}</TableCell>
                    <TableCell className="text-xs font-bold text-gray-900 text-right">{formatMillions(resteOrdonnerReports)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
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
      case 'assainissement': return renderAssainissementView()
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
                    Situation d'exécution du budget d'investissement
                  </h2>
                  <p className="text-xs text-gray-500 hidden sm:block">
                    Vue consolidée par entité, projet et programme
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
              <Select value={selectedProgramme} onValueChange={setSelectedProgramme}>
                <SelectTrigger className="bg-white h-8 text-xs w-[140px]">
                  <SelectValue placeholder="Programme" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les programmes</SelectItem>
                  {filters.programmes.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={selectedProjet} onValueChange={setSelectedProjet}>
                <SelectTrigger className="bg-white h-8 text-xs w-[150px]">
                  <SelectValue placeholder="Projet" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les projets</SelectItem>
                  {filters.projets.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={selectedEntite} onValueChange={setSelectedEntite}>
                <SelectTrigger className="bg-white h-8 text-xs w-[140px]">
                  <SelectValue placeholder="entité" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les entités</SelectItem>
                  {filters.entites.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}
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
                Réinitialiser
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
    ce: number
    engCE: number
    ord: number
    paiements: number
    previsions: number
    tauxEngagement: number
    tauxEngagementCE: number
    tauxOrdonnement: number
    disponible: number
    groups: {
      name: string
      cp: number
      engCP: number
      ce: number
      engCE: number
      ord: number
      paiements: number
      previsions: number
      tauxEngagement: number
      tauxEngagementCE: number
      tauxOrdonnement: number
      disponible: number
      projects: {
        name: string
        cp: number
        engCP: number
        ce: number
        engCE: number
        ord: number
        paiements: number
        previsions: number
        tauxEngagement: number
        tauxEngagementCE: number
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
          <span className={tauxColor(entity.tauxEngagement)}>
            {formatPercent(entity.tauxEngagement)}
          </span>
        </TableCell>
        <TableCell className="text-xs text-gray-700 text-right">{formatMillions(entity.ce)}</TableCell>
        <TableCell className="text-xs text-gray-700 text-right">{formatMillions(entity.engCE)}</TableCell>
        <TableCell className="text-xs text-right">
          <span className={tauxColor(entity.tauxEngagementCE)}>{entity.ce > 0 ? formatPercent(entity.tauxEngagementCE) : '0,0%'}</span>
        </TableCell>
        <TableCell className="text-xs text-gray-700 text-right">{formatMillions(entity.ord)}</TableCell>
        <TableCell className="text-xs text-right">
          <span className={tauxColor(entity.tauxOrdonnement)}>
            {formatPercent(entity.tauxOrdonnement)}
          </span>
        </TableCell>
        <TableCell className="text-xs text-gray-700 text-right">{formatMillions(entity.paiements)}</TableCell>
        <TableCell className="text-xs text-gray-700 text-right">{formatMillions(entity.previsions)}</TableCell>
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
    ce: number
    engCE: number
    ord: number
    paiements: number
    previsions: number
    tauxEngagement: number
    tauxEngagementCE: number
    tauxOrdonnement: number
    disponible: number
    projects: {
      name: string
      cp: number
      engCP: number
      ce: number
      engCE: number
      ord: number
      paiements: number
      previsions: number
      tauxEngagement: number
      tauxEngagementCE: number
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
          <span className={tauxColor(group.tauxEngagement)}>
            {formatPercent(group.tauxEngagement)}
          </span>
        </TableCell>
        <TableCell className="text-xs text-gray-600 text-right">{formatMillions(group.ce)}</TableCell>
        <TableCell className="text-xs text-gray-600 text-right">{formatMillions(group.engCE)}</TableCell>
        <TableCell className="text-xs text-right">
          <span className={tauxColor(group.tauxEngagementCE)}>{group.ce > 0 ? formatPercent(group.tauxEngagementCE) : '0,0%'}</span>
        </TableCell>
        <TableCell className="text-xs text-gray-600 text-right">{formatMillions(group.ord)}</TableCell>
        <TableCell className="text-xs text-right">
          <span className={tauxColor(group.tauxOrdonnement)}>
            {formatPercent(group.tauxOrdonnement)}
          </span>
        </TableCell>
        <TableCell className="text-xs text-gray-600 text-right">{formatMillions(group.paiements)}</TableCell>
        <TableCell className="text-xs text-gray-600 text-right">{formatMillions(group.previsions)}</TableCell>
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
            <span className={tauxColor(project.tauxEngagement)}>
              {formatPercent(project.tauxEngagement)}
            </span>
          </TableCell>
          <TableCell className="text-xs text-gray-500 text-right">{formatMillions(project.ce)}</TableCell>
          <TableCell className="text-xs text-gray-500 text-right">{formatMillions(project.engCE)}</TableCell>
          <TableCell className="text-xs text-right">
            <span className={tauxColor(project.tauxEngagementCE)}>{project.ce > 0 ? formatPercent(project.tauxEngagementCE) : '0,0%'}</span>
          </TableCell>
          <TableCell className="text-xs text-gray-500 text-right">{formatMillions(project.ord)}</TableCell>
          <TableCell className="text-xs text-right">
            <span className={tauxColor(project.tauxOrdonnement)}>
              {formatPercent(project.tauxOrdonnement)}
            </span>
          </TableCell>
          <TableCell className="text-xs text-gray-500 text-right">{formatMillions(project.paiements)}</TableCell>
          <TableCell className="text-xs text-gray-500 text-right">{formatMillions(project.previsions)}</TableCell>
          <TableCell className="text-xs text-gray-500 text-right">{formatMillions(project.disponible)}</TableCell>
        </TableRow>
      ))}
    </>
  )
}
