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
  TRESORERIE: number | null
  'SUBVENTION DEMANDEE': number | null
  [key: string]: string | number | null
}

interface FilterData {
  programmes: string[]
  projets: string[]
  entites: string[]
  nomenclatures: string[]
  sources: string[]
}

// Format number in millions with 1 decimal (French format)
function formatMillions(value: number | null | undefined): string {
  if (value === null || value === undefined) return '-'
  const millions = value / 1e6
  return millions.toLocaleString('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
}

// Format number for table cells with French thousands separators
function formatTableCell(value: number | null | undefined): string {
  if (value === null || value === undefined) return '—'
  if (value === 0) return '0'
  return value.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

// Format percentage with French comma decimal
function formatPercent(value: number): string {
  return value.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + '%'
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
  { key: 'project', label: 'Par programme', icon: FolderOpen },
  { key: 'program', label: 'Par projet', icon: FolderOpen },
  { key: 'entity', label: 'Par entité', icon: List },
  { key: 'engagements', label: 'Engagement', icon: FileText },
  { key: 'ordonnancements', label: 'Ordonnancement', icon: FileText },
  { key: 'previsions', label: "Prévisions d'ordonnancement", icon: TrendingUp },
  { key: 'assainissement', label: 'Assainissement des reports', icon: RotateCcw },
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
      {formattedValue}{pctText}
    </text>
  )
}

// ═══════════ AUTH: Password protection wrapper ═══════════
const ADMIN_PASSWORD = 'admin2026'      // ← Mot de passe admin (accès complet + import Excel)
const USER_PASSWORD = 'budget2026'      // ← Mot de passe utilisateur (consultation seule, sans import)

function AuthGuard({ children }: { children: React.ReactNode }) {
  const [authRole, setAuthRole] = useState<'admin' | 'user' | null>(null)
  const [authChecked, setAuthChecked] = useState(false)
  const [passwordInput, setPasswordInput] = useState('')
  const [passwordError, setPasswordError] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem('dashboard-auth')
    if (stored === 'admin') setAuthRole('admin')
    else if (stored === 'user') setAuthRole('user')
    setAuthChecked(true)
  }, [])

  if (!authChecked) return null

  if (!authRole) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1e3a5f] via-[#2a4a6f] to-[#1a3050]">
        <div className="w-full max-w-md px-4">
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-8">
              <div className="flex flex-col items-center mb-8">
                <div className="w-16 h-16 bg-[#1e3a5f] rounded-2xl flex items-center justify-center mb-4 shadow-lg">
                  <Landmark className="w-8 h-8 text-white" />
                </div>
                <h1 className="text-xl font-bold text-gray-900 tracking-tight">Budget Investissement</h1>
                <p className="text-sm text-gray-500 mt-1">Tableau de bord — Accès réservé</p>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1.5 block">Mot de passe</label>
                  <Input
                    type="password"
                    placeholder="Entrez le mot de passe"
                    value={passwordInput}
                    onChange={(e) => { setPasswordInput(e.target.value); setPasswordError(false) }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        if (passwordInput === ADMIN_PASSWORD) { setAuthRole('admin'); localStorage.setItem('dashboard-auth', 'admin'); setPasswordError(false); }
                        else if (passwordInput === USER_PASSWORD) { setAuthRole('user'); localStorage.setItem('dashboard-auth', 'user'); setPasswordError(false); }
                        else { setPasswordError(true); }
                      }
                    }}
                    className={`h-12 text-base ${passwordError ? 'border-red-400 focus-visible:ring-red-400' : ''}`}
                  />
                  {passwordError && (
                    <p className="text-sm text-red-500 mt-1.5 font-medium">Mot de passe incorrect. Veuillez réessayer.</p>
                  )}
                </div>
                <Button
                  onClick={() => {
                    if (passwordInput === ADMIN_PASSWORD) { setAuthRole('admin'); localStorage.setItem('dashboard-auth', 'admin'); setPasswordError(false); }
                    else if (passwordInput === USER_PASSWORD) { setAuthRole('user'); localStorage.setItem('dashboard-auth', 'user'); setPasswordError(false); }
                    else { setPasswordError(true); }
                  }}
                  className="w-full h-12 text-base font-bold bg-[#1e3a5f] hover:bg-[#2a4a6f] text-white"
                >
                  Se connecter
                </Button>
              </div>
            </div>
            <div className="bg-gray-50 px-8 py-4 text-center">
              <p className="text-xs text-gray-400">Accès autorisé uniquement sur invitation</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
// ═══════════ END AUTH ═══════════

export default function Dashboard() {
  const [isAdmin, setIsAdmin] = useState(false)
  const [data, setData] = useState<DataRow[]>([])
  const [filters, setFilters] = useState<FilterData>({ programmes: [], projets: [], entites: [], nomenclatures: [], sources: [] })
  const [loading, setLoading] = useState(true)
  const [selectedProgramme, setSelectedProgramme] = useState<string>('all')
  const [selectedProjet, setSelectedProjet] = useState<string>('all')
  const [selectedEntite, setSelectedEntite] = useState<string>('all')
  const [selectedNomenclature, setSelectedNomenclature] = useState<string>('all')
  const [selectedSource, setSelectedSource] = useState<string>('all')
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

  // Check admin role on mount
  useEffect(() => {
    setIsAdmin(localStorage.getItem('dashboard-auth') === 'admin')
  }, [])

  const fetchData = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true)
      setRefreshStatus('checking')
      const res = await fetch('/api/data')
      if (!res.ok) throw new Error('Failed to fetch')
      const response = await res.json()
      setData(response.data || [])
      setFilters(response.filters || { programmes: [], projets: [], entites: [], nomenclatures: [] })
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
    setSelectedNomenclature('all')
    setSelectedSource('all')
    setSearchTerm('')
  }

  const filteredData = useMemo(() => {
    return data.filter(row => {
      if (selectedProgramme !== 'all' && row.Programme !== selectedProgramme) return false
      if (selectedProjet !== 'all' && row.Projet !== selectedProjet) return false
      if (selectedEntite !== 'all' && row.ENTITE !== selectedEntite) return false
      if (selectedNomenclature !== 'all' && String(row.NOMENCLATURE || '') !== selectedNomenclature) return false
      if (selectedSource !== 'all' && row['SOURCE FINANCEMENT'] !== selectedSource) return false
      if (searchTerm) {
        const search = searchTerm.toLowerCase()
        const designation = (row['DETAIL DESIGNATION'] || '').toLowerCase()
        const engagement = (row['N° ENGAGEMENT'] || '').toLowerCase()
        const projet = (row.Programme || '').toLowerCase()
        if (!designation.includes(search) && !engagement.includes(search) && !projet.includes(search)) return false
      }
      return true
    })
  }, [data, selectedProgramme, selectedProjet, selectedEntite, selectedNomenclature, selectedSource, searchTerm])

  // Compute nomenclatures list from data (not stored in filters)
  const nomenclatures = useMemo(() => {
    const set = new Set<string>()
    data.forEach(r => { const n = String(r.NOMENCLATURE || ''); if (n) set.add(n) })
    return Array.from(set).sort()
  }, [data])

  // Compute sources list from data
  const sources = useMemo(() => {
    const set = new Set<string>()
    data.forEach(r => { const s = r['SOURCE FINANCEMENT'] || ''; if (s) set.add(s) })
    return Array.from(set).sort()
  }, [data])

  // Cascading filter options: filter projets/entites based on selected programme
  const filteredProjets = useMemo(() => {
    if (selectedProgramme === 'all') return filters.projets
    const set = new Set<string>()
    data.forEach(r => { if (r.Programme === selectedProgramme && r.Projet) set.add(r.Projet) })
    return Array.from(set).sort()
  }, [data, selectedProgramme, filters.projets])

  const filteredEntites = useMemo(() => {
    const base = data.filter(r => {
      if (selectedProgramme !== 'all' && r.Programme !== selectedProgramme) return false
      if (selectedProjet !== 'all' && r.Projet !== selectedProjet) return false
      return true
    })
    const set = new Set<string>()
    base.forEach(r => { if (r.ENTITE) set.add(r.ENTITE) })
    return Array.from(set).sort()
  }, [data, selectedProgramme, selectedProjet])

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
    const totalOrdConsolides = filteredData.reduce((sum, r) => sum + (r['ORD CONSOLIDES'] || 0), 0)
    const totalOrdNouveaux = filteredData.reduce((sum, r) => sum + (r['ORD NOUVEAUX'] || 0), 0)
    const totalEngReports = filteredData.reduce((sum, r) => sum + (r['ENG REPORT'] || 0), 0)
    const totalEngConsolides = filteredData.reduce((sum, r) => sum + (r['ENG CONSOLIDES'] || 0), 0)
    const totalEngNouveaux = filteredData.reduce((sum, r) => sum + (r['ENG NOUVEAUX'] || 0), 0)
    const tauxEngagement = totalCP > 0 ? (totalEngCP / totalCP) * 100 : 0
    const tauxPaiement = totalCP > 0 ? (totalPaiements / totalCP) * 100 : 0
    const tauxOrdonnement = totalCP > 0 ? (totalOrd / totalCP) * 100 : 0
    const disponible = totalCP - totalEngCP
    const totalTresorerie = filteredData.reduce((sum, r) => sum + (r['TRESORERIE'] || 0), 0)
    const totalSubvention = filteredData.reduce((sum, r) => sum + (r['SUBVENTION DEMANDEE'] || 0), 0)

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
      totalReports, totalConsolides, totalNouveaux, totalOrd, totalOrdReports, totalOrdConsolides, totalOrdNouveaux,
      totalEngReports, totalEngConsolides, totalEngNouveaux, count: filteredData.length,
      tauxEngagement, tauxPaiement, tauxOrdonnement, disponible,
      totalTresorerie, totalSubvention,
      cumulPrevJuin: cumulPrev['JUIN'],
      cumulPrevSeptembre: cumulPrev['SEPTEMBRE'],
      cumulPrevOctobre: cumulPrev['OCTOBRE'],
      cumulPrevNovembre: cumulPrev['NOVEMBRE'],
      cumulPrevDecembre: cumulPrev['DECEMBRE'],
    }
  }, [filteredData])

  // Analysis by Entity
  const analysisByEntity = useMemo(() => {
    const prevMonths = ['JANVIER','FEVRIER','MARS','AVRIL','MAI','JUIN','JUILLET','AOUT','SEPTEMBRE','OCTOBRE','NOVEMBRE','DECEMBRE']
    const entities: Record<string, { cp: number; ce: number; engCP: number; engCE: number; paiements: number; previsions: number; count: number; ord: number; prevByMonth: Record<string, number>; cpReports: number; cpConsolides: number; cpNouveaux: number; engReports: number; engConsolides: number; engNouveaux: number; ordReports: number; ordConsolides: number; ordNouveaux: number }> = {}
    filteredData.forEach(row => {
      const e = row.ENTITE
      if (!entities[e]) entities[e] = { cp: 0, ce: 0, engCP: 0, engCE: 0, paiements: 0, previsions: 0, count: 0, ord: 0, prevByMonth: {}, cpReports: 0, cpConsolides: 0, cpNouveaux: 0, engReports: 0, engConsolides: 0, engNouveaux: 0, ordReports: 0, ordConsolides: 0, ordNouveaux: 0 }
      entities[e].cp += row['TOTAL CP'] || 0
      entities[e].ce += row['TOTAL CE'] || 0
      entities[e].engCP += row['ENG CP TOTAL'] || 0
      entities[e].engCE += row['ENG CE ULT'] || 0
      entities[e].paiements += row['PAIEMENTS TOTAL'] || 0
      entities[e].previsions += row['TOTAL PREV'] || 0
      entities[e].count += 1
      entities[e].ord += row['ORD TOTAL'] || 0
      entities[e].cpReports += row.REPORTS || 0
      entities[e].cpConsolides += row.CONSOLIDES || 0
      entities[e].cpNouveaux += row.NOUVEAUX || 0
      entities[e].engReports += row['ENG REPORT'] || 0
      entities[e].engConsolides += row['ENG CONSOLIDES'] || 0
      entities[e].engNouveaux += row['ENG NOUVEAUX'] || 0
      entities[e].ordReports += row['ORD REPORTS'] || 0
      entities[e].ordConsolides += row['ORD CONSOLIDES'] || 0
      entities[e].ordNouveaux += row['ORD NOUVEAUX'] || 0
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
      cpReports: v.cpReports, cpConsolides: v.cpConsolides, cpNouveaux: v.cpNouveaux,
      engReports: v.engReports, engConsolides: v.engConsolides, engNouveaux: v.engNouveaux,
      ordReports: v.ordReports, ordConsolides: v.ordConsolides, ordNouveaux: v.ordNouveaux,
      tauxEngagement: v.cp > 0 ? (v.engCP / v.cp) * 100 : 0,
      tauxEngagementCE: v.ce > 0 ? (v.engCE / v.ce) * 100 : 0,
      tauxOrdonnement: v.cp > 0 ? (v.ord / v.cp) * 100 : 0,
      tauxPaiement: v.cp > 0 ? (v.paiements / v.cp) * 100 : 0,
      disponible: v.cp - v.engCP,
      cumulPrevJuin: v.prevByMonth['JUIN'] || 0,
      cumulPrevSeptembre: v.prevByMonth['SEPTEMBRE'] || 0,
      cumulPrevOctobre: v.prevByMonth['OCTOBRE'] || 0,
      cumulPrevNovembre: v.prevByMonth['NOVEMBRE'] || 0,
      cumulPrevDecembre: v.prevByMonth['DECEMBRE'] || 0,
    })).sort((a, b) => b.cp - a.cp)
  }, [filteredData])

  // Analysis by Group (Programme)
  const analysisByGroup = useMemo(() => {
    const prevMonths = ['JANVIER','FEVRIER','MARS','AVRIL','MAI','JUIN','JUILLET','AOUT','SEPTEMBRE','OCTOBRE','NOVEMBRE','DECEMBRE']
    const groups: Record<string, { cp: number; ce: number; engCP: number; engCE: number; paiements: number; previsions: number; count: number; ord: number; cpReports: number; cpConsolides: number; cpNouveaux: number; engReports: number; engConsolides: number; engNouveaux: number; ordReports: number; ordConsolides: number; ordNouveaux: number; prevByMonth: Record<string, number> }> = {}
    filteredData.forEach(row => {
      const g = row.Projet
      if (!groups[g]) groups[g] = { cp: 0, ce: 0, engCP: 0, engCE: 0, paiements: 0, previsions: 0, count: 0, ord: 0, cpReports: 0, cpConsolides: 0, cpNouveaux: 0, engReports: 0, engConsolides: 0, engNouveaux: 0, ordReports: 0, ordConsolides: 0, ordNouveaux: 0, prevByMonth: {} }
      groups[g].cp += row['TOTAL CP'] || 0
      groups[g].ce += row['TOTAL CE'] || 0
      groups[g].engCP += row['ENG CP TOTAL'] || 0
      groups[g].engCE += row['ENG CE ULT'] || 0
      groups[g].paiements += row['PAIEMENTS TOTAL'] || 0
      groups[g].previsions += row['TOTAL PREV'] || 0
      groups[g].count += 1
      groups[g].ord += row['ORD TOTAL'] || 0
      groups[g].cpReports += row.REPORTS || 0
      groups[g].cpConsolides += row.CONSOLIDES || 0
      groups[g].cpNouveaux += row.NOUVEAUX || 0
      groups[g].engReports += row['ENG REPORT'] || 0
      groups[g].engConsolides += row['ENG CONSOLIDES'] || 0
      groups[g].engNouveaux += row['ENG NOUVEAUX'] || 0
      groups[g].ordReports += row['ORD REPORTS'] || 0
      groups[g].ordConsolides += row['ORD CONSOLIDES'] || 0
      groups[g].ordNouveaux += row['ORD NOUVEAUX'] || 0
    })
    // Calculate cumulative previsions by group
    Object.keys(groups).forEach(g => {
      const groupRows = filteredData.filter(r => r.Projet === g)
      let cumul = 0
      for (const m of prevMonths) {
        const rep = groupRows.reduce((s, r) => s + (r[`Previsions REPORTS ${m}`] || 0), 0)
        const con = groupRows.reduce((s, r) => s + (r[`Previsions CONSOLIDES ${m}`] || 0), 0)
        const nouv = groupRows.reduce((s, r) => s + (r[`Previsions NOUVEAUX ${m}`] || 0), 0)
        cumul += rep + con + nouv
        groups[g].prevByMonth[m] = cumul
      }
    })
    return Object.entries(groups).map(([name, v]) => ({
      name,
      ...v,
      tauxEngagement: v.cp > 0 ? (v.engCP / v.cp) * 100 : 0,
      tauxEngagementCE: v.ce > 0 ? (v.engCE / v.ce) * 100 : 0,
      tauxOrdonnement: v.cp > 0 ? (v.ord / v.cp) * 100 : 0,
      tauxPaiement: v.cp > 0 ? (v.paiements / v.cp) * 100 : 0,
      disponible: v.cp - v.engCP,
      cumulPrevJuin: v.prevByMonth['JUIN'] || 0,
      cumulPrevSeptembre: v.prevByMonth['SEPTEMBRE'] || 0,
      cumulPrevOctobre: v.prevByMonth['OCTOBRE'] || 0,
      cumulPrevNovembre: v.prevByMonth['NOVEMBRE'] || 0,
      cumulPrevDecembre: v.prevByMonth['DECEMBRE'] || 0,
    })).sort((a, b) => {
      const numA = parseInt(a.name.replace(/\D/g, '')) || 0
      const numB = parseInt(b.name.replace(/\D/g, '')) || 0
      return numA - numB
    })
  }, [filteredData])

  // Analysis by Programme (row.Programme field - actual project names)
  const analysisByProgramme = useMemo(() => {
    const prevMonths = ['JANVIER','FEVRIER','MARS','AVRIL','MAI','JUIN','JUILLET','AOUT','SEPTEMBRE','OCTOBRE','NOVEMBRE','DECEMBRE']
    const groups: Record<string, { cp: number; ce: number; engCP: number; engCE: number; paiements: number; previsions: number; count: number; ord: number; tresorerie: number; subvention: number; cpReports: number; cpConsolides: number; cpNouveaux: number; engReports: number; engConsolides: number; engNouveaux: number; ordReports: number; ordConsolides: number; ordNouveaux: number; prevByMonth: Record<string, number> }> = {}
    filteredData.forEach(row => {
      const g = row.Programme
      if (!groups[g]) groups[g] = { cp: 0, ce: 0, engCP: 0, engCE: 0, paiements: 0, previsions: 0, count: 0, ord: 0, tresorerie: 0, subvention: 0, cpReports: 0, cpConsolides: 0, cpNouveaux: 0, engReports: 0, engConsolides: 0, engNouveaux: 0, ordReports: 0, ordConsolides: 0, ordNouveaux: 0, prevByMonth: {} }
      groups[g].cp += row['TOTAL CP'] || 0
      groups[g].ce += row['TOTAL CE'] || 0
      groups[g].engCP += row['ENG CP TOTAL'] || 0
      groups[g].engCE += row['ENG CE ULT'] || 0
      groups[g].paiements += row['PAIEMENTS TOTAL'] || 0
      groups[g].previsions += row['TOTAL PREV'] || 0
      groups[g].count += 1
      groups[g].ord += row['ORD TOTAL'] || 0
      groups[g].cpReports += row.REPORTS || 0
      groups[g].cpConsolides += row.CONSOLIDES || 0
      groups[g].cpNouveaux += row.NOUVEAUX || 0
      groups[g].engReports += row['ENG REPORT'] || 0
      groups[g].engConsolides += row['ENG CONSOLIDES'] || 0
      groups[g].engNouveaux += row['ENG NOUVEAUX'] || 0
      groups[g].ordReports += row['ORD REPORTS'] || 0
      groups[g].ordConsolides += row['ORD CONSOLIDES'] || 0
      groups[g].ordNouveaux += row['ORD NOUVEAUX'] || 0
      groups[g].tresorerie += row['TRESORERIE'] || 0
      groups[g].subvention += row['SUBVENTION DEMANDEE'] || 0
    })
    // Calculate cumulative previsions by programme
    Object.keys(groups).forEach(g => {
      const groupRows = filteredData.filter(r => r.Programme === g)
      let cumul = 0
      for (const m of prevMonths) {
        const rep = groupRows.reduce((s, r) => s + (r[`Previsions REPORTS ${m}`] || 0), 0)
        const con = groupRows.reduce((s, r) => s + (r[`Previsions CONSOLIDES ${m}`] || 0), 0)
        const nouv = groupRows.reduce((s, r) => s + (r[`Previsions NOUVEAUX ${m}`] || 0), 0)
        cumul += rep + con + nouv
        groups[g].prevByMonth[m] = cumul
      }
    })
    return Object.entries(groups).map(([name, v]) => ({
      name,
      ...v,
      tauxEngagement: v.cp > 0 ? (v.engCP / v.cp) * 100 : 0,
      tauxEngagementCE: v.ce > 0 ? (v.engCE / v.ce) * 100 : 0,
      tauxOrdonnement: v.cp > 0 ? (v.ord / v.cp) * 100 : 0,
      tauxPaiement: v.cp > 0 ? (v.paiements / v.cp) * 100 : 0,
      disponible: v.cp - v.engCP,
      cumulPrevJuin: v.prevByMonth['JUIN'] || 0,
      cumulPrevSeptembre: v.prevByMonth['SEPTEMBRE'] || 0,
      cumulPrevOctobre: v.prevByMonth['OCTOBRE'] || 0,
      cumulPrevNovembre: v.prevByMonth['NOVEMBRE'] || 0,
      cumulPrevDecembre: v.prevByMonth['DECEMBRE'] || 0,
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
        tauxOrdonnement: (r['TOTAL CP'] || 0) > 0 ? ((r['ORD TOTAL'] || 0) / (r['TOTAL CP'] || 0)) * 100 : 0,
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
      tauxOrdonnement: v.cp > 0 ? (v.ord / v.cp) * 100 : 0,
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
          tauxOrdonnement: (r['TOTAL CP'] || 0) > 0 ? ((r['ORD TOTAL'] || 0) / (r['TOTAL CP'] || 0)) * 100 : 0,
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
          tauxOrdonnement: groupCP > 0 ? (groupOrd / groupCP) * 100 : 0,
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
        tauxOrdonnement: entityCP > 0 ? (entityOrd / entityCP) * 100 : 0,
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
        tauxOrdonnement: (r['TOTAL CP'] || 0) > 0 ? ((r['ORD TOTAL'] || 0) / (r['TOTAL CP'] || 0)) * 100 : 0,
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
        nomenclature: r.NOMENCLATURE || '',
        designation: r['DETAIL DESIGNATION'] || '-',
        entite: r.ENTITE,
        projet: r.Projet,
        cp: r['TOTAL CP'] || 0,
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
      .sort((a, b) => (b['ORD TOTAL'] || 0) - (a['ORD TOTAL'] || 0))
      .map(r => ({
        numEngagement: r['N° ENGAGEMENT'] || '-',
        nomenclature: r.NOMENCLATURE || '-',
        designation: r['DETAIL DESIGNATION'] || '-',
        entite: r.ENTITE,
        projet: r.Projet,
        cp: r['TOTAL CP'] || 0,
        ordReports: r['ORD REPORTS'] || 0,
        ordConsolides: r['ORD CONSOLIDES'] || 0,
        ordNouveaux: r['ORD NOUVEAUX'] || 0,
        ordTotal: r['ORD TOTAL'] || 0,
        paiements: r['PAIEMENTS TOTAL'] || 0,
        tauxOrdonnement: (r['TOTAL CP'] || 0) > 0 ? ((r['ORD TOTAL'] || 0) / (r['TOTAL CP'] || 0)) * 100 : 0,
        tauxPaiement: (r['TOTAL CP'] || 0) > 0 ? ((r['PAIEMENTS TOTAL'] || 0) / (r['TOTAL CP'] || 0)) * 100 : 0,
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
        <p className="text-[11px] font-bold text-white/50 uppercase tracking-wider">Filtres actifs</p>
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

      {/* Logout */}
      <div className="px-4 py-3 border-t border-white/10">
        <button
          onClick={() => { localStorage.removeItem('dashboard-auth'); window.location.reload() }}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-white/70 hover:bg-white/5 hover:text-white transition-colors"
        >
          <Info className="w-4 h-4 flex-shrink-0" />
          <span className="flex-1 text-left">Déconnexion</span>
        </button>
      </div>
    </div>
  )

  // ==================== VIEW RENDERERS ====================

  // Shared KPI sections renderer - same indicators as Vue d'ensemble for all sidebar views
  const renderKPISections = (data: {
    totalReports: number; totalConsolides: number; totalNouveaux: number; totalCP: number; totalCE: number;
    totalEngReports: number; totalEngConsolides: number; totalEngNouveaux: number; totalEngCP: number; totalEngCE: number;
    tauxEngagement: number;
    totalOrdReports: number; totalOrdConsolides: number; totalOrdNouveaux: number; totalOrd: number; totalPaiements: number;
    tauxOrdonnement: number; tauxPaiement: number;
    totalTresorerie?: number; totalSubvention?: number;
  }) => (
    <>
      {/* ═══════════ SECTION : CRÉDITS ═══════════ */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-1 h-5 rounded-full bg-gradient-to-b from-blue-500 to-indigo-600" />
          <h3 className="text-sm font-bold text-gray-800 tracking-wide uppercase">Crédits</h3>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-7 gap-4">
          {/* Crédits Reportés */}
          <div className="kpi-card-premium bg-white rounded-xl border border-gray-100 overflow-hidden cursor-default">
            <div className="h-1.5 bg-gradient-to-r from-blue-400 to-blue-600" />
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="kpi-icon-wrap w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center transition-transform">
                  <RotateCcw className="w-5 h-5 text-blue-600" />
                </div>
                <Badge className="bg-blue-50 text-blue-700 border-blue-200 text-[10px] font-bold rounded-full px-2.5">Reports</Badge>
              </div>
              <p className="text-2xl font-black text-gray-900 tracking-tight">{formatMillions(data.totalReports)} M DH</p>
              <p className="text-[11px] text-gray-400 mt-1.5 font-medium">
                {data.totalCP > 0 ? formatPercent((data.totalReports / data.totalCP) * 100) : '0%'} du budget total
              </p>
            </div>
          </div>

          {/* Crédits Consolidés */}
          <div className="kpi-card-premium bg-white rounded-xl border border-gray-100 overflow-hidden cursor-default">
            <div className="h-1.5 bg-gradient-to-r from-amber-400 to-orange-500" />
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="kpi-icon-wrap w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center transition-transform">
                  <Database className="w-5 h-5 text-amber-600" />
                </div>
                <Badge className="bg-amber-50 text-amber-700 border-amber-200 text-[10px] font-bold rounded-full px-2.5">Consolidés</Badge>
              </div>
              <p className="text-2xl font-black text-gray-900 tracking-tight">{formatMillions(data.totalConsolides)} M DH</p>
              <p className="text-[11px] text-gray-400 mt-1.5 font-medium">
                {data.totalCP > 0 ? formatPercent((data.totalConsolides / data.totalCP) * 100) : '0%'} du budget total
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
                <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] font-bold rounded-full px-2.5">Nouveaux</Badge>
              </div>
              <p className="text-2xl font-black text-gray-900 tracking-tight">{formatMillions(data.totalNouveaux)} M DH</p>
              <p className="text-[11px] text-gray-400 mt-1.5 font-medium">
                {data.totalCP > 0 ? formatPercent((data.totalNouveaux / data.totalCP) * 100) : '0%'} du budget total
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
                <Badge className="bg-violet-50 text-violet-700 border-violet-200 text-[10px] font-bold rounded-full px-2.5">CP</Badge>
              </div>
              <p className="text-2xl font-black text-gray-900 tracking-tight">{formatMillions(data.totalCP)} M DH</p>
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
                <Badge className="bg-indigo-50 text-indigo-700 border-indigo-200 text-[10px] font-bold rounded-full px-2.5">CE</Badge>
              </div>
              <p className="text-2xl font-black text-gray-900 tracking-tight">{formatMillions(data.totalCE)} M DH</p>
              <p className="text-[11px] text-gray-400 mt-1.5 font-medium">Crédits d&apos;engagement</p>
            </div>
          </div>

          {/* Trésorerie - Colonne BO */}
          <div className="kpi-card-premium bg-white rounded-xl border border-gray-100 overflow-hidden cursor-default">
            <div className="h-1.5 bg-gradient-to-r from-cyan-400 to-teal-500" />
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="kpi-icon-wrap w-10 h-10 rounded-full bg-cyan-50 flex items-center justify-center transition-transform">
                  <Wallet className="w-5 h-5 text-cyan-600" />
                </div>
                <Badge className="bg-cyan-50 text-cyan-700 border-cyan-200 text-[10px] font-bold rounded-full px-2.5">BO</Badge>
              </div>
              <p className="text-2xl font-black text-gray-900 tracking-tight">{formatMillions(data.totalTresorerie || 0)} M DH</p>
              <p className="text-[11px] text-gray-400 mt-1.5 font-medium">Trésorerie</p>
            </div>
          </div>

          {/* Subvention demandée - Colonne BN */}
          <div className="kpi-card-premium bg-white rounded-xl border border-gray-100 overflow-hidden cursor-default">
            <div className="h-1.5 bg-gradient-to-r from-pink-400 to-rose-500" />
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="kpi-icon-wrap w-10 h-10 rounded-full bg-pink-50 flex items-center justify-center transition-transform">
                  <Landmark className="w-5 h-5 text-pink-600" />
                </div>
                <Badge className="bg-pink-50 text-pink-700 border-pink-200 text-[10px] font-bold rounded-full px-2.5">BN</Badge>
              </div>
              <p className="text-2xl font-black text-gray-900 tracking-tight">{formatMillions(data.totalSubvention || 0)} M DH</p>
              <p className="text-[11px] text-gray-400 mt-1.5 font-medium">Subvention demandée</p>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════ SECTION : ENGAGEMENTS ═══════════ */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-1 h-5 rounded-full bg-gradient-to-b from-emerald-500 to-teal-600" />
          <h3 className="text-sm font-bold text-gray-800 tracking-wide uppercase">Engagements</h3>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Engagement sur Report */}
          <div className="kpi-card-premium bg-white rounded-xl border border-gray-100 overflow-hidden cursor-default">
            <div className="h-1.5 bg-gradient-to-r from-blue-400 to-blue-600" />
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="kpi-icon-wrap w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center transition-transform">
                  <RotateCcw className="w-5 h-5 text-blue-600" />
                </div>
                <Badge className="bg-blue-50 text-blue-700 border-blue-200 text-[10px] font-bold rounded-full px-2.5">Report</Badge>
              </div>
              <p className="text-2xl font-black text-gray-900 tracking-tight">{formatMillions(data.totalEngReports)} M DH</p>
              <p className="text-[11px] text-gray-400 mt-1.5 font-medium">
                {data.totalEngCP > 0 ? formatPercent((data.totalEngReports / data.totalEngCP) * 100) : '0%'} du total engagé
              </p>
            </div>
          </div>

          {/* Engagement sur Consolidés */}
          <div className="kpi-card-premium bg-white rounded-xl border border-gray-100 overflow-hidden cursor-default">
            <div className="h-1.5 bg-gradient-to-r from-amber-400 to-orange-500" />
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="kpi-icon-wrap w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center transition-transform">
                  <Database className="w-5 h-5 text-amber-600" />
                </div>
                <Badge className="bg-amber-50 text-amber-700 border-amber-200 text-[10px] font-bold rounded-full px-2.5">Consolidés</Badge>
              </div>
              <p className="text-2xl font-black text-gray-900 tracking-tight">{formatMillions(data.totalEngConsolides)} M DH</p>
              <p className="text-[11px] text-gray-400 mt-1.5 font-medium">
                {data.totalEngCP > 0 ? formatPercent((data.totalEngConsolides / data.totalEngCP) * 100) : '0%'} du total engagé
              </p>
            </div>
          </div>

          {/* Engagement sur Nouveaux */}
          <div className="kpi-card-premium bg-white rounded-xl border border-gray-100 overflow-hidden cursor-default">
            <div className="h-1.5 bg-gradient-to-r from-emerald-400 to-emerald-600" />
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="kpi-icon-wrap w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center transition-transform">
                  <TrendingUp className="w-5 h-5 text-emerald-600" />
                </div>
                <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] font-bold rounded-full px-2.5">Nouveaux</Badge>
              </div>
              <p className="text-2xl font-black text-gray-900 tracking-tight">{formatMillions(data.totalEngNouveaux)} M DH</p>
              <p className="text-[11px] text-gray-400 mt-1.5 font-medium">
                {data.totalEngCP > 0 ? formatPercent((data.totalEngNouveaux / data.totalEngCP) * 100) : '0%'} du total engagé
              </p>
            </div>
          </div>

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
                    <span className="text-sm font-bold text-gray-700">Engagement CP</span>
                  </div>
                  <p className="text-3xl font-black text-gray-900 tracking-tight">{formatMillions(data.totalEngCP)} M DH</p>
                </div>
                <div className="text-right">
                  <span className={`inline-flex items-center gap-1 text-sm font-bold ${tauxColor(data.tauxEngagement)}`}>
                    {data.tauxEngagement >= 80 ? '✓' : data.tauxEngagement >= 50 ? '⚠' : '✗'}
                    {formatPercent(data.tauxEngagement)}
                  </span>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    {data.tauxEngagement >= 80 ? 'Bon' : data.tauxEngagement >= 50 ? 'Moyen' : 'Faible'}
                  </p>
                </div>
              </div>
              <div className="mt-3">
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`kpi-progress-bar h-full rounded-full ${data.tauxEngagement >= 80 ? 'bg-gradient-to-r from-emerald-400 to-emerald-600' : data.tauxEngagement >= 50 ? 'bg-gradient-to-r from-amber-400 to-amber-500' : 'bg-gradient-to-r from-red-400 to-red-500'}`} style={{ width: `${Math.min(data.tauxEngagement, 100)}%` }} />
                </div>
                <div className="flex justify-between mt-1.5">
                  <span className="text-[10px] text-gray-400">0%</span>
                  <span className="text-[10px] text-gray-400">Reste : {formatMillions(data.totalCP - data.totalEngCP)}</span>
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
                    <span className="text-sm font-bold text-gray-700">Engagement CE</span>
                  </div>
                  <p className="text-3xl font-black text-gray-900 tracking-tight">{formatMillions(data.totalEngCE)} M DH</p>
                </div>
                <div className="text-right">
                  {(() => {
                    const tauxCE = data.totalCE > 0 ? (data.totalEngCE / data.totalCE) * 100 : 0
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
                  const tauxCE = data.totalCE > 0 ? (data.totalEngCE / data.totalCE) * 100 : 0
                  return (
                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className={`kpi-progress-bar h-full rounded-full ${tauxCE >= 80 ? 'bg-gradient-to-r from-emerald-400 to-emerald-600' : tauxCE >= 50 ? 'bg-gradient-to-r from-amber-400 to-amber-500' : 'bg-gradient-to-r from-red-400 to-red-500'}`} style={{ width: `${Math.min(tauxCE, 100)}%` }} />
                    </div>
                  )
                })()}
                <div className="flex justify-between mt-1.5">
                  <span className="text-[10px] text-gray-400">0%</span>
                  <span className="text-[10px] text-gray-400">Reste : {formatMillions(data.totalCE - data.totalEngCE)}</span>
                  <span className="text-[10px] text-gray-400">100%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

    </>
  )

  const renderOverview = () => (
    <>
      {/* ═══════════ SECTION : TRÉSORERIE ET SUBVENTION ═══════════ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="border border-amber-100 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
                <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Trésorerie</p>
                <p className="text-xl font-black text-amber-700">{formatMillions(kpis.totalTresorerie)}</p>
                <p className="text-[9px] text-gray-400">M DH</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border border-orange-100 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center">
                <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Subvention demandée</p>
                <p className="text-xl font-black text-orange-700">{formatMillions(kpis.totalSubvention)}</p>
                <p className="text-[9px] text-gray-400">M DH</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ═══════════ SECTION : PERFORMANCE GLOBALE ═══════════ */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-1 h-5 rounded-full bg-gradient-to-b from-violet-500 to-purple-600" />
          <h3 className="text-sm font-bold text-gray-800 tracking-wide uppercase">Performance Globale</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Gauge - Total CP */}
          <Card className="border border-gray-100 shadow-sm overflow-hidden">
            <CardHeader className="pb-1 pt-3 px-4">
              <CardTitle className="text-xs font-bold text-gray-600 uppercase tracking-wider">Total CP</CardTitle>
            </CardHeader>
            <CardContent className="p-2 flex flex-col items-center">
              <div className="h-[160px] w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Engagé', value: Math.round(kpis.totalEngCP / 1e6 * 10) / 10 },
                        { name: 'Disponible', value: Math.max(0, Math.round((kpis.totalCP - kpis.totalEngCP) / 1e6 * 10) / 10) },
                      ]}
                      cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={3} dataKey="value"
                      startAngle={90} endAngle={-270}
                      stroke="none"
                    >
                      <Cell fill="#6366f1" />
                      <Cell fill="#e0e7ff" />
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-2xl font-black text-gray-900 tracking-tight">{formatMillions(kpis.totalCP)}</span>
                  <span className="text-[10px] text-gray-400 font-medium">M DH</span>
                </div>
              </div>
              <div className="flex items-center gap-3 mt-1 text-[10px]">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-indigo-500" />Engagé</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-indigo-100" />Disponible</span>
              </div>
            </CardContent>
          </Card>

          {/* Gauge - Taux Engagement */}
          <Card className="border border-gray-100 shadow-sm overflow-hidden">
            <CardHeader className="pb-1 pt-3 px-4">
              <CardTitle className="text-xs font-bold text-gray-600 uppercase tracking-wider">Taux Engagement</CardTitle>
            </CardHeader>
            <CardContent className="p-2 flex flex-col items-center">
              <div className="h-[160px] w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Engagé', value: kpis.tauxEngagement },
                        { name: 'Reste', value: Math.max(0, 100 - kpis.tauxEngagement) },
                      ]}
                      cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={3} dataKey="value"
                      startAngle={90} endAngle={-270}
                      stroke="none"
                    >
                      <Cell fill={kpis.tauxEngagement >= 80 ? '#10b981' : kpis.tauxEngagement >= 50 ? '#f59e0b' : '#ef4444'} />
                      <Cell fill="#f3f4f6" />
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className={`text-2xl font-black tracking-tight ${tauxColor(kpis.tauxEngagement)}`}>{formatPercent(kpis.tauxEngagement)}</span>
                  <span className="text-[10px] text-gray-400 font-medium">
                    {kpis.tauxEngagement >= 80 ? 'Bon' : kpis.tauxEngagement >= 50 ? 'Moyen' : 'Faible'}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1 mt-1">
                <span className={`w-2 h-2 rounded-full ${kpis.tauxEngagement >= 80 ? 'bg-emerald-500' : kpis.tauxEngagement >= 50 ? 'bg-amber-500' : 'bg-red-500'}`} />
                <span className="text-[10px] text-gray-400">{formatMillions(kpis.totalEngCP)} M DH engagé</span>
              </div>
            </CardContent>
          </Card>

          {/* Gauge - Taux Ordonnancement */}
          <Card className="border border-gray-100 shadow-sm overflow-hidden">
            <CardHeader className="pb-1 pt-3 px-4">
              <CardTitle className="text-xs font-bold text-gray-600 uppercase tracking-wider">Taux Ordonnancement</CardTitle>
            </CardHeader>
            <CardContent className="p-2 flex flex-col items-center">
              <div className="h-[160px] w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Ordonnancé', value: kpis.tauxOrdonnement },
                        { name: 'Reste', value: Math.max(0, 100 - kpis.tauxOrdonnement) },
                      ]}
                      cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={3} dataKey="value"
                      startAngle={90} endAngle={-270}
                      stroke="none"
                    >
                      <Cell fill={kpis.tauxOrdonnement >= 80 ? '#10b981' : kpis.tauxOrdonnement >= 50 ? '#f59e0b' : '#ef4444'} />
                      <Cell fill="#f3f4f6" />
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className={`text-2xl font-black tracking-tight ${tauxColor(kpis.tauxOrdonnement)}`}>{formatPercent(kpis.tauxOrdonnement)}</span>
                  <span className="text-[10px] text-gray-400 font-medium">
                    {kpis.tauxOrdonnement >= 80 ? 'Bon' : kpis.tauxOrdonnement >= 50 ? 'Moyen' : 'Faible'}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1 mt-1">
                <span className={`w-2 h-2 rounded-full ${kpis.tauxOrdonnement >= 80 ? 'bg-emerald-500' : kpis.tauxOrdonnement >= 50 ? 'bg-amber-500' : 'bg-red-500'}`} />
                <span className="text-[10px] text-gray-400">{formatMillions(kpis.totalOrd)} M DH ordonnancé</span>
              </div>
            </CardContent>
          </Card>

          {/* Gauge - Taux de Paiement */}
          <Card className="border border-gray-100 shadow-sm overflow-hidden">
            <CardHeader className="pb-1 pt-3 px-4">
              <CardTitle className="text-xs font-bold text-gray-600 uppercase tracking-wider">Taux de Paiement</CardTitle>
            </CardHeader>
            <CardContent className="p-2 flex flex-col items-center">
              <div className="h-[160px] w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Payé', value: kpis.tauxPaiement },
                        { name: 'Reste', value: Math.max(0, 100 - kpis.tauxPaiement) },
                      ]}
                      cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={3} dataKey="value"
                      startAngle={90} endAngle={-270}
                      stroke="none"
                    >
                      <Cell fill={kpis.tauxPaiement >= 80 ? '#06b6d4' : kpis.tauxPaiement >= 50 ? '#f59e0b' : '#ef4444'} />
                      <Cell fill="#f3f4f6" />
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className={`text-2xl font-black tracking-tight ${tauxColor(kpis.tauxPaiement)}`}>{formatPercent(kpis.tauxPaiement)}</span>
                  <span className="text-[10px] text-gray-400 font-medium">
                    {kpis.tauxPaiement >= 80 ? 'Bon' : kpis.tauxPaiement >= 50 ? 'Moyen' : 'Faible'}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1 mt-1">
                <span className={`w-2 h-2 rounded-full ${kpis.tauxPaiement >= 80 ? 'bg-cyan-500' : kpis.tauxPaiement >= 50 ? 'bg-amber-500' : 'bg-red-500'}`} />
                <span className="text-[10px] text-gray-400">{formatMillions(kpis.totalPaiements)} M DH payé</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ═══════════ SECTION 1 : CRÉDITS ═══════════ */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-1 h-5 rounded-full bg-gradient-to-b from-blue-500 to-indigo-600" />
          <h3 className="text-sm font-bold text-gray-800 tracking-wide uppercase">Crédits</h3>
          
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-7 gap-4">
          {/* Crédits Reportés */}
          <div className="kpi-card-premium bg-white rounded-xl border border-gray-100 overflow-hidden cursor-default">
            <div className="h-1.5 bg-gradient-to-r from-blue-400 to-blue-600" />
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="kpi-icon-wrap w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center transition-transform">
                  <RotateCcw className="w-5 h-5 text-blue-600" />
                </div>
                <Badge className="bg-blue-50 text-blue-700 border-blue-200 text-[10px] font-bold rounded-full px-2.5">Reports</Badge>
              </div>
              <p className="text-2xl font-black text-gray-900 tracking-tight">{formatMillions(kpis.totalReports)} M DH</p>
              <p className="text-[11px] text-gray-400 mt-1.5 font-medium">
                {kpis.totalCP > 0 ? formatPercent((kpis.totalReports / kpis.totalCP) * 100) : '0%'} du budget total
              </p>
            </div>
          </div>

          {/* Crédits Consolidés */}
          <div className="kpi-card-premium bg-white rounded-xl border border-gray-100 overflow-hidden cursor-default">
            <div className="h-1.5 bg-gradient-to-r from-amber-400 to-orange-500" />
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="kpi-icon-wrap w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center transition-transform">
                  <Database className="w-5 h-5 text-amber-600" />
                </div>
                <Badge className="bg-amber-50 text-amber-700 border-amber-200 text-[10px] font-bold rounded-full px-2.5">Consolidés</Badge>
              </div>
              <p className="text-2xl font-black text-gray-900 tracking-tight">{formatMillions(kpis.totalConsolides)} M DH</p>
              <p className="text-[11px] text-gray-400 mt-1.5 font-medium">
                {kpis.totalCP > 0 ? formatPercent((kpis.totalConsolides / kpis.totalCP) * 100) : '0%'} du budget total
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
                <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] font-bold rounded-full px-2.5">Nouveaux</Badge>
              </div>
              <p className="text-2xl font-black text-gray-900 tracking-tight">{formatMillions(kpis.totalNouveaux)} M DH</p>
              <p className="text-[11px] text-gray-400 mt-1.5 font-medium">
                {kpis.totalCP > 0 ? formatPercent((kpis.totalNouveaux / kpis.totalCP) * 100) : '0%'} du budget total
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
                <Badge className="bg-violet-50 text-violet-700 border-violet-200 text-[10px] font-bold rounded-full px-2.5">CP</Badge>
              </div>
              <p className="text-2xl font-black text-gray-900 tracking-tight">{formatMillions(kpis.totalCP)} M DH</p>
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
                <Badge className="bg-indigo-50 text-indigo-700 border-indigo-200 text-[10px] font-bold rounded-full px-2.5">CE</Badge>
              </div>
              <p className="text-2xl font-black text-gray-900 tracking-tight">{formatMillions(kpis.totalCE)} M DH</p>
              <p className="text-[11px] text-gray-400 mt-1.5 font-medium">Crédits d&apos;engagement</p>
            </div>
          </div>

          {/* Trésorerie - Colonne BO */}
          <div className="kpi-card-premium bg-white rounded-xl border border-gray-100 overflow-hidden cursor-default">
            <div className="h-1.5 bg-gradient-to-r from-cyan-400 to-teal-500" />
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="kpi-icon-wrap w-10 h-10 rounded-full bg-cyan-50 flex items-center justify-center transition-transform">
                  <Wallet className="w-5 h-5 text-cyan-600" />
                </div>
                <Badge className="bg-cyan-50 text-cyan-700 border-cyan-200 text-[10px] font-bold rounded-full px-2.5">BO</Badge>
              </div>
              <p className="text-2xl font-black text-gray-900 tracking-tight">{formatMillions(kpis.totalTresorerie)} M DH</p>
              <p className="text-[11px] text-gray-400 mt-1.5 font-medium">Trésorerie</p>
            </div>
          </div>

          {/* Subvention demandée - Colonne BN */}
          <div className="kpi-card-premium bg-white rounded-xl border border-gray-100 overflow-hidden cursor-default">
            <div className="h-1.5 bg-gradient-to-r from-pink-400 to-rose-500" />
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="kpi-icon-wrap w-10 h-10 rounded-full bg-pink-50 flex items-center justify-center transition-transform">
                  <Landmark className="w-5 h-5 text-pink-600" />
                </div>
                <Badge className="bg-pink-50 text-pink-700 border-pink-200 text-[10px] font-bold rounded-full px-2.5">BN</Badge>
              </div>
              <p className="text-2xl font-black text-gray-900 tracking-tight">{formatMillions(kpis.totalSubvention)} M DH</p>
              <p className="text-[11px] text-gray-400 mt-1.5 font-medium">Subvention demandée</p>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════ SECTION 2 : ENGAGEMENTS ═══════════ */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-1 h-5 rounded-full bg-gradient-to-b from-emerald-500 to-teal-600" />
          <h3 className="text-sm font-bold text-gray-800 tracking-wide uppercase">Engagements</h3>
          
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Engagement sur Report */}
          <div className="kpi-card-premium bg-white rounded-xl border border-gray-100 overflow-hidden cursor-default">
            <div className="h-1.5 bg-gradient-to-r from-blue-400 to-blue-600" />
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="kpi-icon-wrap w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center transition-transform">
                  <RotateCcw className="w-5 h-5 text-blue-600" />
                </div>
                <Badge className="bg-blue-50 text-blue-700 border-blue-200 text-[10px] font-bold rounded-full px-2.5">Report</Badge>
              </div>
              <p className="text-2xl font-black text-gray-900 tracking-tight">{formatMillions(kpis.totalEngReports)} M DH</p>
              <p className="text-[11px] text-gray-400 mt-1.5 font-medium">
                {kpis.totalEngCP > 0 ? formatPercent((kpis.totalEngReports / kpis.totalEngCP) * 100) : '0%'} du total engagé
              </p>
            </div>
          </div>

          {/* Engagement sur Consolidés */}
          <div className="kpi-card-premium bg-white rounded-xl border border-gray-100 overflow-hidden cursor-default">
            <div className="h-1.5 bg-gradient-to-r from-amber-400 to-orange-500" />
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="kpi-icon-wrap w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center transition-transform">
                  <Database className="w-5 h-5 text-amber-600" />
                </div>
                <Badge className="bg-amber-50 text-amber-700 border-amber-200 text-[10px] font-bold rounded-full px-2.5">Consolidés</Badge>
              </div>
              <p className="text-2xl font-black text-gray-900 tracking-tight">{formatMillions(kpis.totalEngConsolides)} M DH</p>
              <p className="text-[11px] text-gray-400 mt-1.5 font-medium">
                {kpis.totalEngCP > 0 ? formatPercent((kpis.totalEngConsolides / kpis.totalEngCP) * 100) : '0%'} du total engagé
              </p>
            </div>
          </div>

          {/* Engagement sur Nouveaux */}
          <div className="kpi-card-premium bg-white rounded-xl border border-gray-100 overflow-hidden cursor-default">
            <div className="h-1.5 bg-gradient-to-r from-emerald-400 to-emerald-600" />
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="kpi-icon-wrap w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center transition-transform">
                  <TrendingUp className="w-5 h-5 text-emerald-600" />
                </div>
                <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] font-bold rounded-full px-2.5">Nouveaux</Badge>
              </div>
              <p className="text-2xl font-black text-gray-900 tracking-tight">{formatMillions(kpis.totalEngNouveaux)} M DH</p>
              <p className="text-[11px] text-gray-400 mt-1.5 font-medium">
                {kpis.totalEngCP > 0 ? formatPercent((kpis.totalEngNouveaux / kpis.totalEngCP) * 100) : '0%'} du total engagé
              </p>
            </div>
          </div>

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
                    <span className="text-sm font-bold text-gray-700">Engagement CP</span>
                  </div>
                  <p className="text-3xl font-black text-gray-900 tracking-tight">{formatMillions(kpis.totalEngCP)} M DH</p>
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
                    <span className="text-sm font-bold text-gray-700">Engagement CE</span>
                  </div>
                  <p className="text-3xl font-black text-gray-900 tracking-tight">{formatMillions(kpis.totalEngCE)} M DH</p>
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

      {/* ═══════════ SECTION 3 : ORDONNANCEMENT ═══════════ */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-1 h-5 rounded-full bg-gradient-to-b from-blue-500 to-cyan-600" />
          <h3 className="text-sm font-bold text-gray-800 tracking-wide uppercase">Ordonnancement</h3>
          
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Ord. sur Reports */}
          <div className="kpi-card-premium bg-white rounded-xl border border-gray-100 overflow-hidden cursor-default">
            <div className="h-1.5 bg-gradient-to-r from-sky-400 to-blue-500" />
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="kpi-icon-wrap w-10 h-10 rounded-full bg-sky-50 flex items-center justify-center transition-transform">
                  <RotateCcw className="w-5 h-5 text-sky-600" />
                </div>
                <Badge className="bg-sky-50 text-sky-700 border-sky-200 text-[10px] font-bold rounded-full px-2.5">Reports</Badge>
              </div>
              <p className="text-2xl font-black text-gray-900 tracking-tight">{formatMillions(kpis.totalOrdReports)} M DH</p>
              <p className="text-[11px] text-gray-400 mt-1.5 font-medium">
                Taux : <span className={tauxColor(kpis.totalEngReports > 0 ? (kpis.totalOrdReports / kpis.totalEngReports) * 100 : 0)}>{formatPercent(kpis.totalEngReports > 0 ? (kpis.totalOrdReports / kpis.totalEngReports) * 100 : 0)}</span> / eng.
              </p>
            </div>
          </div>

          {/* Ord. sur Consolidés */}
          <div className="kpi-card-premium bg-white rounded-xl border border-gray-100 overflow-hidden cursor-default">
            <div className="h-1.5 bg-gradient-to-r from-amber-400 to-orange-500" />
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="kpi-icon-wrap w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center transition-transform">
                  <Database className="w-5 h-5 text-amber-600" />
                </div>
                <Badge className="bg-amber-50 text-amber-700 border-amber-200 text-[10px] font-bold rounded-full px-2.5">Consolidés</Badge>
              </div>
              <p className="text-2xl font-black text-gray-900 tracking-tight">{formatMillions(kpis.totalOrdConsolides)} M DH</p>
              <p className="text-[11px] text-gray-400 mt-1.5 font-medium">
                Taux : <span className={tauxColor(kpis.totalEngConsolides > 0 ? (kpis.totalOrdConsolides / kpis.totalEngConsolides) * 100 : 0)}>{formatPercent(kpis.totalEngConsolides > 0 ? (kpis.totalOrdConsolides / kpis.totalEngConsolides) * 100 : 0)}</span> / eng.
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
                <Badge className="bg-cyan-50 text-cyan-700 border-cyan-200 text-[10px] font-bold rounded-full px-2.5">Nouveaux</Badge>
              </div>
              <p className="text-2xl font-black text-gray-900 tracking-tight">{formatMillions(kpis.totalOrdNouveaux)} M DH</p>
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
                  <span className="text-sm font-bold text-gray-700">Total Ord.</span>
                </div>
                <span className={`inline-flex items-center gap-1 text-sm font-bold ${tauxColor(kpis.tauxOrdonnement)}`}>
                  {kpis.tauxOrdonnement >= 80 ? '✓' : kpis.tauxOrdonnement >= 50 ? '⚠' : '✗'}
                  {formatPercent(kpis.tauxOrdonnement)}
                </span>
              </div>
              <p className="text-2xl font-black text-gray-900 tracking-tight">{formatMillions(kpis.totalOrd)} M DH</p>
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


      {/* ═══════════ SECTION 4 : PAIEMENTS ═══════════ */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-1 h-5 rounded-full bg-gradient-to-b from-cyan-500 to-teal-600" />
          <h3 className="text-sm font-bold text-gray-800 tracking-wide uppercase">Paiements</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Taux de paiement */}
          <div className="kpi-card-premium rounded-xl border border-cyan-100 overflow-hidden cursor-default" style={{ background: 'linear-gradient(135deg, #ffffff 0%, #ecfeff 100%)' }}>
            <div className="h-1.5 bg-gradient-to-r from-cyan-500 to-teal-600" />
            <div className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="kpi-icon-wrap w-11 h-11 rounded-full bg-cyan-100 flex items-center justify-center transition-transform">
                      <Wallet className="w-5 h-5 text-cyan-700" />
                    </div>
                    <span className="text-sm font-bold text-gray-700">Taux de paiement</span>
                  </div>
                  <p className="text-3xl font-black text-gray-900 tracking-tight">{formatMillions(kpis.totalPaiements)} M DH</p>
                </div>
                <div className="text-right">
                  <span className={`inline-flex items-center gap-1 text-sm font-bold ${tauxColor(kpis.tauxPaiement)}`}>
                    {kpis.tauxPaiement >= 80 ? '✓' : kpis.tauxPaiement >= 50 ? '⚠' : '✗'}
                    {formatPercent(kpis.tauxPaiement)}
                  </span>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    {kpis.tauxPaiement >= 80 ? 'Bon' : kpis.tauxPaiement >= 50 ? 'Moyen' : 'Faible'}
                  </p>
                </div>
              </div>
              <div className="mt-3">
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`kpi-progress-bar h-full rounded-full ${kpis.tauxPaiement >= 80 ? 'bg-gradient-to-r from-emerald-400 to-emerald-600' : kpis.tauxPaiement >= 50 ? 'bg-gradient-to-r from-amber-400 to-amber-500' : 'bg-gradient-to-r from-red-400 to-red-500'}`} style={{ width: `${Math.min(kpis.tauxPaiement, 100)}%` }} />
                </div>
                <div className="flex justify-between mt-1.5">
                  <span className="text-[10px] text-gray-400">0%</span>
                  <span className="text-[10px] text-gray-400">Paiement / Total CP</span>
                  <span className="text-[10px] text-gray-400">100%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Reste à payer */}
          <div className="kpi-card-premium rounded-xl border border-red-100 overflow-hidden cursor-default" style={{ background: 'linear-gradient(135deg, #ffffff 0%, #fef2f2 100%)' }}>
            <div className="h-1.5 bg-gradient-to-r from-red-400 to-rose-500" />
            <div className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="kpi-icon-wrap w-11 h-11 rounded-full bg-red-100 flex items-center justify-center transition-transform">
                      <Scale className="w-5 h-5 text-red-700" />
                    </div>
                    <span className="text-sm font-bold text-gray-700">Reste à payer</span>
                  </div>
                  <p className="text-3xl font-black text-gray-900 tracking-tight">{formatMillions(kpis.totalOrd - kpis.totalPaiements)} M DH</p>
                </div>
                <div className="text-right">
                  <span className="inline-flex items-center gap-1 text-sm font-bold text-red-600">
                    {kpis.totalCP > 0 ? formatPercent(((kpis.totalOrd - kpis.totalPaiements) / kpis.totalCP) * 100) : '0%'}
                  </span>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    Reste à payer / Total CP
                  </p>
                </div>
              </div>
              <div className="mt-3">
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="kpi-progress-bar h-full rounded-full bg-gradient-to-r from-red-400 to-rose-500" style={{ width: `${Math.min(kpis.totalCP > 0 ? ((kpis.totalOrd - kpis.totalPaiements) / kpis.totalCP) * 100 : 0, 100)}%` }} />
                </div>
                <div className="flex justify-between mt-1.5">
                  <span className="text-[10px] text-gray-400">0%</span>
                  <span className="text-[10px] text-gray-400">Ord. - Paiement / Total CP</span>
                  <span className="text-[10px] text-gray-400">100%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════ SECTION 4.5 : PRÉVISIONS ORDONNANCEMENT CUMULÉES ═══════════ */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-1 h-5 rounded-full bg-gradient-to-b from-teal-500 to-violet-600" />
          <h3 className="text-sm font-bold text-gray-800 tracking-wide uppercase">Prévisions d&apos;ordonnancement cumulées</h3>
          
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {[
            { label: 'Fin Juin', value: kpis.cumulPrevJuin, color: 'teal', icon: TrendingUp },
            { label: 'Fin Septembre', value: kpis.cumulPrevSeptembre, color: 'cyan', icon: TrendingUp },
            { label: 'Fin Octobre', value: kpis.cumulPrevOctobre, color: 'sky', icon: TrendingUp },
            { label: 'Fin Novembre', value: kpis.cumulPrevNovembre, color: 'indigo', icon: TrendingUp },
            { label: 'Fin Décembre', value: kpis.cumulPrevDecembre, color: 'violet', icon: TrendingUp },
          ].map(({ label, value, color, icon: Icon }) => {
            const taux = kpis.totalCP > 0 ? (value / kpis.totalCP) * 100 : 0
            const colorMap: Record<string, { gradient: string; iconBg: string; iconText: string; badgeBg: string; badgeText: string; badgeBorder: string; barTop: string }> = {
              teal: { gradient: 'from-teal-400 to-teal-600', iconBg: 'bg-teal-50', iconText: 'text-teal-600', badgeBg: 'bg-teal-50', badgeText: 'text-teal-700', badgeBorder: 'border-teal-200', barTop: 'bg-gradient-to-r from-teal-400 to-teal-600' },
              cyan: { gradient: 'from-cyan-400 to-cyan-600', iconBg: 'bg-cyan-50', iconText: 'text-cyan-600', badgeBg: 'bg-cyan-50', badgeText: 'text-cyan-700', badgeBorder: 'border-cyan-200', barTop: 'bg-gradient-to-r from-cyan-400 to-cyan-600' },
              sky: { gradient: 'from-sky-400 to-sky-600', iconBg: 'bg-sky-50', iconText: 'text-sky-600', badgeBg: 'bg-sky-50', badgeText: 'text-sky-700', badgeBorder: 'border-sky-200', barTop: 'bg-gradient-to-r from-sky-400 to-sky-600' },
              indigo: { gradient: 'from-indigo-400 to-indigo-600', iconBg: 'bg-indigo-50', iconText: 'text-indigo-600', badgeBg: 'bg-indigo-50', badgeText: 'text-indigo-700', badgeBorder: 'border-indigo-200', barTop: 'bg-gradient-to-r from-indigo-400 to-indigo-600' },
              violet: { gradient: 'from-violet-400 to-violet-600', iconBg: 'bg-violet-50', iconText: 'text-violet-600', badgeBg: 'bg-violet-50', badgeText: 'text-violet-700', badgeBorder: 'border-violet-200', barTop: 'bg-gradient-to-r from-violet-400 to-violet-600' },
            }
            const c = colorMap[color]
            return (
              <div key={label} className="kpi-card-premium bg-white rounded-xl border border-gray-100 overflow-hidden cursor-default">
                <div className={`h-1.5 bg-gradient-to-r ${c.gradient}`} />
                <div className="p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className={`kpi-icon-wrap w-8 h-8 rounded-full ${c.iconBg} flex items-center justify-center`}>
                      <Icon className={`w-4 h-4 ${c.iconText}`} />
                    </div>
                    <Badge className={`${c.badgeBg} ${c.badgeText} ${c.badgeBorder} text-[9px] font-bold rounded-full px-2`}>{label}</Badge>
                  </div>
                  <p className="text-lg font-black text-gray-900 tracking-tight">{formatMillions(value)} M DH</p>
                  <div className="mt-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-[10px] font-bold ${tauxColor(taux)}`}>
                        {taux >= 80 ? '✓' : taux >= 50 ? '⚠' : '✗'} {formatPercent(taux)}
                      </span>
                      <span className="text-[9px] text-gray-400">/ CP</span>
                    </div>
                    <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className={`kpi-progress-bar h-full rounded-full ${taux >= 80 ? 'bg-gradient-to-r from-emerald-400 to-emerald-600' : taux >= 50 ? 'bg-gradient-to-r from-amber-400 to-amber-500' : 'bg-gradient-to-r from-red-400 to-red-500'}`} style={{ width: `${Math.min(taux, 100)}%` }} />
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ═══════════ TABLEAU : ANALYSE PAR PROGRAMME ═══════════ */}
      <Card className="border border-gray-100 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-1 h-5 rounded-full bg-gradient-to-b from-indigo-500 to-violet-600" />
              <h3 className="text-sm font-bold text-gray-800 tracking-wide uppercase">Analyse par programme</h3>
            </div>
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
                  <TableHead className="text-xs font-bold text-indigo-700">Programme</TableHead>
                  <TableHead className="text-xs font-bold text-indigo-700 text-right">Total CP</TableHead>
                  <TableHead className="text-xs font-bold text-indigo-700 text-right">Eng. CP</TableHead>
                  <TableHead className="text-xs font-bold text-indigo-700 text-right">Taux eng. CP</TableHead>
                  <TableHead className="text-xs font-bold text-indigo-700 text-right">Total CE</TableHead>
                  <TableHead className="text-xs font-bold text-indigo-700 text-right">Eng. CE</TableHead>
                  <TableHead className="text-xs font-bold text-indigo-700 text-right">Taux eng. CE</TableHead>
                  <TableHead className="text-xs font-bold text-indigo-700 text-right">Ordonn.</TableHead>
                  <TableHead className="text-xs font-bold text-indigo-700 text-right">Taux ord.</TableHead>
                  <TableHead className="text-xs font-bold text-indigo-700 text-right">Paiements</TableHead>
                  <TableHead className="text-xs font-bold text-indigo-700 text-right">Taux paiement</TableHead>
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
                    <TableCell className="text-xs text-right"><span className={tauxColor(p.tauxPaiement)}>{formatPercent(p.tauxPaiement)}</span></TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-indigo-50/40 font-bold-total">
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
                  <TableCell className="text-xs font-bold text-right"><span className={tauxColor(kpis.tauxPaiement)}>{formatPercent(kpis.tauxPaiement)}</span></TableCell>
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
            <div className="flex items-center gap-2">
              <div className="w-1 h-5 rounded-full bg-gradient-to-b from-emerald-500 to-teal-600" />
              <h3 className="text-sm font-bold text-gray-800 tracking-wide uppercase">Analyse par projet</h3>
            </div>
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
                  <TableHead className="text-xs font-bold text-emerald-700">Projet</TableHead>
                  <TableHead className="text-xs font-bold text-emerald-700 text-right">Total CP</TableHead>
                  <TableHead className="text-xs font-bold text-emerald-700 text-right">Eng. CP</TableHead>
                  <TableHead className="text-xs font-bold text-emerald-700 text-right">Taux eng. CP</TableHead>
                  <TableHead className="text-xs font-bold text-emerald-700 text-right">Total CE</TableHead>
                  <TableHead className="text-xs font-bold text-emerald-700 text-right">Eng. CE</TableHead>
                  <TableHead className="text-xs font-bold text-emerald-700 text-right">Taux eng. CE</TableHead>
                  <TableHead className="text-xs font-bold text-emerald-700 text-right">Ordonn.</TableHead>
                  <TableHead className="text-xs font-bold text-emerald-700 text-right">Taux ord.</TableHead>
                  <TableHead className="text-xs font-bold text-emerald-700 text-right">Paiements</TableHead>
                  <TableHead className="text-xs font-bold text-emerald-700 text-right">Taux paiement</TableHead>
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
                    <TableCell className="text-xs text-right"><span className={tauxColor(g.tauxPaiement)}>{formatPercent(g.tauxPaiement)}</span></TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-emerald-50/40 font-bold-total">
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
                  <TableCell className="text-xs font-bold text-right"><span className={tauxColor(kpis.tauxPaiement)}>{formatPercent(kpis.tauxPaiement)}</span></TableCell>
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
            <div className="flex items-center gap-2">
              <div className="w-1 h-5 rounded-full bg-gradient-to-b from-slate-500 to-gray-600" />
              <h3 className="text-sm font-bold text-gray-800 tracking-wide uppercase">Analyse par entité</h3>
            </div>
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
                  <TableHead className="text-xs font-bold text-slate-700">Entité</TableHead>
                  <TableHead className="text-xs font-bold text-slate-700 text-right">Total CP</TableHead>
                  <TableHead className="text-xs font-bold text-slate-700 text-right">Eng. CP</TableHead>
                  <TableHead className="text-xs font-bold text-slate-700 text-right">Taux eng. CP</TableHead>
                  <TableHead className="text-xs font-bold text-slate-700 text-right">Total CE</TableHead>
                  <TableHead className="text-xs font-bold text-slate-700 text-right">Eng. CE</TableHead>
                  <TableHead className="text-xs font-bold text-slate-700 text-right">Taux eng. CE</TableHead>
                  <TableHead className="text-xs font-bold text-slate-700 text-right">Ordonn.</TableHead>
                  <TableHead className="text-xs font-bold text-slate-700 text-right">Taux ord.</TableHead>
                  <TableHead className="text-xs font-bold text-slate-700 text-right">Paiements</TableHead>
                  <TableHead className="text-xs font-bold text-slate-700 text-right">Taux paiement</TableHead>
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
                    <TableCell className="text-xs text-right"><span className={tauxColor(e.tauxPaiement)}>{formatPercent(e.tauxPaiement)}</span></TableCell>
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
                  <TableCell className="text-xs font-bold text-right"><span className={tauxColor(kpis.tauxPaiement)}>{formatPercent(kpis.tauxPaiement)}</span></TableCell>
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
                <CardTitle className="text-sm font-bold text-gray-800 tracking-wide uppercase">Prévisions d&apos;ordonnancement cumulées par entité</CardTitle>
                <p className="text-[11px] text-gray-400 mt-0.5">Taux = Prévisions d&apos;ordonnancement cumulées / Crédits Total CP</p>
              </div>
            </div>
            
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-teal-50/60">
                  <TableHead className="text-xs font-bold text-teal-800 min-w-[100px]">Entité</TableHead>
                  <TableHead className="text-xs font-bold text-emerald-700 text-right bg-emerald-50/30">Crédits Total CP</TableHead>
                  <TableHead className="text-xs font-bold text-teal-700 text-center bg-teal-50/30" colSpan={2}>Fin Juin</TableHead>
                  <TableHead className="text-xs font-bold text-cyan-700 text-center bg-cyan-50/30" colSpan={2}>Fin Septembre</TableHead>
                  <TableHead className="text-xs font-bold text-sky-700 text-center bg-sky-50/30" colSpan={2}>Fin Octobre</TableHead>
                  <TableHead className="text-xs font-bold text-indigo-700 text-center bg-indigo-50/30" colSpan={2}>Fin Novembre</TableHead>
                  <TableHead className="text-xs font-bold text-violet-700 text-center bg-violet-50/30" colSpan={2}>Prév. Cumul. Déc.</TableHead>
                </TableRow>
                <TableRow className="bg-teal-50/30">
                  <TableHead className="text-[10px] text-gray-500" />
                  <TableHead className="text-[10px] font-bold text-emerald-600 text-right bg-emerald-50/20">CP</TableHead>
                  <TableHead className="text-[10px] font-bold text-teal-600 text-right">Prév.</TableHead>
                  <TableHead className="text-[10px] font-bold text-teal-600 text-right">Taux</TableHead>
                  <TableHead className="text-[10px] font-bold text-cyan-600 text-right">Prév.</TableHead>
                  <TableHead className="text-[10px] font-bold text-cyan-600 text-right">Taux</TableHead>
                  <TableHead className="text-[10px] font-bold text-sky-600 text-right">Prév.</TableHead>
                  <TableHead className="text-[10px] font-bold text-sky-600 text-right">Taux</TableHead>
                  <TableHead className="text-[10px] font-bold text-indigo-600 text-right">Prév.</TableHead>
                  <TableHead className="text-[10px] font-bold text-indigo-600 text-right">Taux</TableHead>
                  <TableHead className="text-[10px] font-bold text-violet-600 text-right bg-violet-50/20">Prév.</TableHead>
                  <TableHead className="text-[10px] font-bold text-violet-600 text-right bg-violet-50/20">Taux</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {analysisByEntity.map(e => {
                  const tauxDec = e.cp > 0 ? (e.cumulPrevDecembre / e.cp) * 100 : 0
                  const tauxJuin = e.cp > 0 ? (e.cumulPrevJuin / e.cp) * 100 : 0
                  const tauxSept = e.cp > 0 ? (e.cumulPrevSeptembre / e.cp) * 100 : 0
                  const tauxOct = e.cp > 0 ? (e.cumulPrevOctobre / e.cp) * 100 : 0
                  const tauxNov = e.cp > 0 ? (e.cumulPrevNovembre / e.cp) * 100 : 0
                  return (
                    <TableRow key={e.name} className="hover:bg-teal-50/30 transition-colors">
                      <TableCell className="text-xs font-bold text-gray-900">{e.name}</TableCell>
                      <TableCell className="text-xs text-gray-700 text-right font-medium bg-emerald-50/10">{formatMillions(e.cp)}</TableCell>
                      <TableCell className="text-xs text-gray-700 text-right bg-teal-50/20">{formatMillions(e.cumulPrevJuin)}</TableCell>
                      <TableCell className="text-xs text-right bg-teal-50/20">
                        <div className="flex items-center justify-end gap-1">
                          <div className="w-12 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div className={`kpi-progress-bar h-full rounded-full ${tauxJuin >= 80 ? 'bg-gradient-to-r from-emerald-400 to-emerald-600' : tauxJuin >= 50 ? 'bg-gradient-to-r from-amber-400 to-amber-500' : 'bg-gradient-to-r from-red-400 to-red-500'}`} style={{ width: `${Math.min(tauxJuin, 100)}%` }} />
                          </div>
                          <span className={`text-[10px] font-bold ${tauxColor(tauxJuin)}`}>
                            {tauxJuin >= 80 ? '✓' : tauxJuin >= 50 ? '⚠' : e.cp > 0 ? '✗' : '—'}
                          </span>
                          <span className={`text-[10px] font-bold ${tauxColor(tauxJuin)}`}>{e.cp > 0 ? formatPercent(tauxJuin) : '—'}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-gray-700 text-right bg-cyan-50/20">{formatMillions(e.cumulPrevSeptembre)}</TableCell>
                      <TableCell className="text-xs text-right bg-cyan-50/20">
                        <div className="flex items-center justify-end gap-1">
                          <div className="w-12 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div className={`kpi-progress-bar h-full rounded-full ${tauxSept >= 80 ? 'bg-gradient-to-r from-emerald-400 to-emerald-600' : tauxSept >= 50 ? 'bg-gradient-to-r from-amber-400 to-amber-500' : 'bg-gradient-to-r from-red-400 to-red-500'}`} style={{ width: `${Math.min(tauxSept, 100)}%` }} />
                          </div>
                          <span className={`text-[10px] font-bold ${tauxColor(tauxSept)}`}>
                            {tauxSept >= 80 ? '✓' : tauxSept >= 50 ? '⚠' : e.cp > 0 ? '✗' : '—'}
                          </span>
                          <span className={`text-[10px] font-bold ${tauxColor(tauxSept)}`}>{e.cp > 0 ? formatPercent(tauxSept) : '—'}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-gray-700 text-right bg-sky-50/20">{formatMillions(e.cumulPrevOctobre)}</TableCell>
                      <TableCell className="text-xs text-right bg-sky-50/20">
                        <div className="flex items-center justify-end gap-1">
                          <div className="w-12 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div className={`kpi-progress-bar h-full rounded-full ${tauxOct >= 80 ? 'bg-gradient-to-r from-emerald-400 to-emerald-600' : tauxOct >= 50 ? 'bg-gradient-to-r from-amber-400 to-amber-500' : 'bg-gradient-to-r from-red-400 to-red-500'}`} style={{ width: `${Math.min(tauxOct, 100)}%` }} />
                          </div>
                          <span className={`text-[10px] font-bold ${tauxColor(tauxOct)}`}>
                            {tauxOct >= 80 ? '✓' : tauxOct >= 50 ? '⚠' : e.cp > 0 ? '✗' : '—'}
                          </span>
                          <span className={`text-[10px] font-bold ${tauxColor(tauxOct)}`}>{e.cp > 0 ? formatPercent(tauxOct) : '—'}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-gray-700 text-right bg-indigo-50/20">{formatMillions(e.cumulPrevNovembre)}</TableCell>
                      <TableCell className="text-xs text-right bg-indigo-50/20">
                        <div className="flex items-center justify-end gap-1">
                          <div className="w-12 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div className={`kpi-progress-bar h-full rounded-full ${tauxNov >= 80 ? 'bg-gradient-to-r from-emerald-400 to-emerald-600' : tauxNov >= 50 ? 'bg-gradient-to-r from-amber-400 to-amber-500' : 'bg-gradient-to-r from-red-400 to-red-500'}`} style={{ width: `${Math.min(tauxNov, 100)}%` }} />
                          </div>
                          <span className={`text-[10px] font-bold ${tauxColor(tauxNov)}`}>
                            {tauxNov >= 80 ? '✓' : tauxNov >= 50 ? '⚠' : e.cp > 0 ? '✗' : '—'}
                          </span>
                          <span className={`text-[10px] font-bold ${tauxColor(tauxNov)}`}>{e.cp > 0 ? formatPercent(tauxNov) : '—'}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-gray-700 text-right font-medium bg-violet-50/10">{formatMillions(e.cumulPrevDecembre)}</TableCell>
                      <TableCell className="text-xs text-right bg-violet-50/10">
                        <div className="flex items-center justify-end gap-1">
                          <div className="w-12 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div className={`kpi-progress-bar h-full rounded-full ${tauxDec >= 80 ? 'bg-gradient-to-r from-emerald-400 to-emerald-600' : tauxDec >= 50 ? 'bg-gradient-to-r from-amber-400 to-amber-500' : 'bg-gradient-to-r from-red-400 to-red-500'}`} style={{ width: `${Math.min(tauxDec, 100)}%` }} />
                          </div>
                          <span className={`text-[10px] font-bold ${tauxColor(tauxDec)}`}>
                            {tauxDec >= 80 ? '✓' : tauxDec >= 50 ? '⚠' : e.cp > 0 ? '✗' : '—'}
                          </span>
                          <span className={`text-[10px] font-bold ${tauxColor(tauxDec)}`}>{e.cp > 0 ? formatPercent(tauxDec) : '—'}</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
                {/* Total row */}
                <TableRow className="bg-gradient-to-r from-teal-50/60 to-cyan-50/60 font-bold">
                  <TableCell className="text-xs font-bold text-gray-900">TOTAL</TableCell>
                  <TableCell className="text-xs font-bold text-gray-900 text-right bg-emerald-50/20">{formatMillions(kpis.totalCP)}</TableCell>
                  <TableCell className="text-xs font-bold text-gray-900 text-right bg-teal-50/30">{formatMillions(kpis.cumulPrevJuin)}</TableCell>
                  <TableCell className="text-xs text-right bg-teal-50/30">
                    <div className="flex items-center justify-end gap-1">
                      <span className={`text-[10px] font-bold ${tauxColor(kpis.totalCP > 0 ? (kpis.cumulPrevJuin / kpis.totalCP) * 100 : 0)}`}>
                        {(() => { const t = kpis.totalCP > 0 ? (kpis.cumulPrevJuin / kpis.totalCP) * 100 : 0; return t >= 80 ? '✓' : t >= 50 ? '⚠' : '✗' })()}
                      </span>
                      <span className={`text-[10px] font-bold ${tauxColor(kpis.totalCP > 0 ? (kpis.cumulPrevJuin / kpis.totalCP) * 100 : 0)}`}>{kpis.totalCP > 0 ? formatPercent((kpis.cumulPrevJuin / kpis.totalCP) * 100) : '—'}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs font-bold text-gray-900 text-right bg-cyan-50/30">{formatMillions(kpis.cumulPrevSeptembre)}</TableCell>
                  <TableCell className="text-xs text-right bg-cyan-50/30">
                    <div className="flex items-center justify-end gap-1">
                      <span className={`text-[10px] font-bold ${tauxColor(kpis.totalCP > 0 ? (kpis.cumulPrevSeptembre / kpis.totalCP) * 100 : 0)}`}>
                        {(() => { const t = kpis.totalCP > 0 ? (kpis.cumulPrevSeptembre / kpis.totalCP) * 100 : 0; return t >= 80 ? '✓' : t >= 50 ? '⚠' : '✗' })()}
                      </span>
                      <span className={`text-[10px] font-bold ${tauxColor(kpis.totalCP > 0 ? (kpis.cumulPrevSeptembre / kpis.totalCP) * 100 : 0)}`}>{kpis.totalCP > 0 ? formatPercent((kpis.cumulPrevSeptembre / kpis.totalCP) * 100) : '—'}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs font-bold text-gray-900 text-right bg-sky-50/30">{formatMillions(kpis.cumulPrevOctobre)}</TableCell>
                  <TableCell className="text-xs text-right bg-sky-50/30">
                    <div className="flex items-center justify-end gap-1">
                      <span className={`text-[10px] font-bold ${tauxColor(kpis.totalCP > 0 ? (kpis.cumulPrevOctobre / kpis.totalCP) * 100 : 0)}`}>
                        {(() => { const t = kpis.totalCP > 0 ? (kpis.cumulPrevOctobre / kpis.totalCP) * 100 : 0; return t >= 80 ? '✓' : t >= 50 ? '⚠' : '✗' })()}
                      </span>
                      <span className={`text-[10px] font-bold ${tauxColor(kpis.totalCP > 0 ? (kpis.cumulPrevOctobre / kpis.totalCP) * 100 : 0)}`}>{kpis.totalCP > 0 ? formatPercent((kpis.cumulPrevOctobre / kpis.totalCP) * 100) : '—'}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs font-bold text-gray-900 text-right bg-indigo-50/30">{formatMillions(kpis.cumulPrevNovembre)}</TableCell>
                  <TableCell className="text-xs text-right bg-indigo-50/30">
                    <div className="flex items-center justify-end gap-1">
                      <span className={`text-[10px] font-bold ${tauxColor(kpis.totalCP > 0 ? (kpis.cumulPrevNovembre / kpis.totalCP) * 100 : 0)}`}>
                        {(() => { const t = kpis.totalCP > 0 ? (kpis.cumulPrevNovembre / kpis.totalCP) * 100 : 0; return t >= 80 ? '✓' : t >= 50 ? '⚠' : '✗' })()}
                      </span>
                      <span className={`text-[10px] font-bold ${tauxColor(kpis.totalCP > 0 ? (kpis.cumulPrevNovembre / kpis.totalCP) * 100 : 0)}`}>{kpis.totalCP > 0 ? formatPercent((kpis.cumulPrevNovembre / kpis.totalCP) * 100) : '—'}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs font-bold text-gray-900 text-right bg-violet-50/20">{formatMillions(kpis.cumulPrevDecembre)}</TableCell>
                  <TableCell className="text-xs text-right bg-violet-50/20">
                    <div className="flex items-center justify-end gap-1">
                      <span className={`text-[10px] font-bold ${tauxColor(kpis.totalCP > 0 ? (kpis.cumulPrevDecembre / kpis.totalCP) * 100 : 0)}`}>
                        {(() => { const t = kpis.totalCP > 0 ? (kpis.cumulPrevDecembre / kpis.totalCP) * 100 : 0; return t >= 80 ? '✓' : t >= 50 ? '⚠' : '✗' })()}
                      </span>
                      <span className={`text-[10px] font-bold ${tauxColor(kpis.totalCP > 0 ? (kpis.cumulPrevDecembre / kpis.totalCP) * 100 : 0)}`}>{kpis.totalCP > 0 ? formatPercent((kpis.cumulPrevDecembre / kpis.totalCP) * 100) : '—'}</span>
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
    // Totals for Détail par entité table
    const totCP = analysisByEntity.reduce((s, e) => s + e.cp, 0)
    const totEngCP = analysisByEntity.reduce((s, e) => s + e.engCP, 0)
    const totCE = analysisByEntity.reduce((s, e) => s + e.ce, 0)
    const totEngCE = analysisByEntity.reduce((s, e) => s + e.engCE, 0)
    const totOrd = analysisByEntity.reduce((s, e) => s + e.ord, 0)
    const totPaiements = analysisByEntity.reduce((s, e) => s + e.paiements, 0)
    const totPrevisions = analysisByEntity.reduce((s, e) => s + e.previsions, 0)
    const totDisponible = analysisByEntity.reduce((s, e) => s + e.disponible, 0)

    // Color palette for entity cards
    const entityColors = [
      { bg: 'from-blue-500 to-indigo-600', light: 'bg-blue-50', border: 'border-blue-200', accent: 'text-blue-700', bar: 'from-blue-400 to-blue-600', ring: 'ring-blue-200' },
      { bg: 'from-emerald-500 to-teal-600', light: 'bg-emerald-50', border: 'border-emerald-200', accent: 'text-emerald-700', bar: 'from-emerald-400 to-emerald-600', ring: 'ring-emerald-200' },
      { bg: 'from-violet-500 to-purple-600', light: 'bg-violet-50', border: 'border-violet-200', accent: 'text-violet-700', bar: 'from-violet-400 to-violet-600', ring: 'ring-violet-200' },
      { bg: 'from-amber-500 to-orange-600', light: 'bg-amber-50', border: 'border-amber-200', accent: 'text-amber-700', bar: 'from-amber-400 to-amber-600', ring: 'ring-amber-200' },
      { bg: 'from-rose-500 to-pink-600', light: 'bg-rose-50', border: 'border-rose-200', accent: 'text-rose-700', bar: 'from-rose-400 to-rose-600', ring: 'ring-rose-200' },
      { bg: 'from-cyan-500 to-sky-600', light: 'bg-cyan-50', border: 'border-cyan-200', accent: 'text-cyan-700', bar: 'from-cyan-400 to-cyan-600', ring: 'ring-cyan-200' },
      { bg: 'from-fuchsia-500 to-pink-600', light: 'bg-fuchsia-50', border: 'border-fuchsia-200', accent: 'text-fuchsia-700', bar: 'from-fuchsia-400 to-fuchsia-600', ring: 'ring-fuchsia-200' },
      { bg: 'from-lime-500 to-green-600', light: 'bg-lime-50', border: 'border-lime-200', accent: 'text-lime-700', bar: 'from-lime-400 to-lime-600', ring: 'ring-lime-200' },
    ]

    const getEntityColor = (idx: number) => entityColors[idx % entityColors.length]

    const renderMiniBar = (value: number, max: number, colorClass: string) => {
      const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0
      return (
        <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div className={`h-full rounded-full bg-gradient-to-r ${colorClass}`} style={{ width: `${pct}%` }} />
        </div>
      )
    }

    return (
      <>
        {/* ═══════════ SECTION 3 : INDICATEURS PAR ENTITÉ ═══════════ */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-1 h-5 rounded-full bg-gradient-to-b from-violet-500 to-fuchsia-600" />
            <h3 className="text-sm font-bold text-gray-800 tracking-wide uppercase">Indicateurs par entité</h3>
            <span className="text-[11px] text-gray-400 font-medium">({analysisByEntity.length} entités)</span>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {analysisByEntity.map((entity, idx) => {
              const color = getEntityColor(idx)
              const pctBudget = entityTotalBudget > 0 ? (entity.cp / entityTotalBudget) * 100 : 0
              return (
                <div key={entity.name} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                  {/* Entity header */}
                  <div className={`bg-gradient-to-r ${color.bg} px-4 py-3 flex items-center justify-between`}>
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center backdrop-blur-sm">
                        <Landmark className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white leading-tight">{entity.name}</h4>
                        <p className="text-[10px] text-white/70 font-medium">{entity.count} lignes</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-black text-white">{formatMillions(entity.cp)}</p>
                      <p className="text-[10px] text-white/70 font-medium">Total CP</p>
                      <p className="text-xs font-bold text-white/90 mt-0.5">{formatMillions(entity.ce)}</p>
                      <p className="text-[10px] text-white/70 font-medium">CE</p>
                    </div>
                  </div>
                  {/* Key indicators body */}
                  <div className="p-4 space-y-3">
                    {/* Row 1: Engagement & Ordonnancement rates */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className={`${color.light} rounded-lg p-2.5`}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">Eng. CP</span>
                          <span className={`text-xs font-bold ${tauxColor(entity.tauxEngagement)}`}>{formatPercent(entity.tauxEngagement)}</span>
                        </div>
                        {renderMiniBar(entity.tauxEngagement, 100, color.bar)}
                      </div>
                      <div className={`${color.light} rounded-lg p-2.5`}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">Ordonn.</span>
                          <span className={`text-xs font-bold ${tauxColor(entity.tauxOrdonnement)}`}>{formatPercent(entity.tauxOrdonnement)}</span>
                        </div>
                        {renderMiniBar(entity.tauxOrdonnement, 100, color.bar)}
                      </div>
                    </div>
                    {/* Row 2: CE engagement & Paiement rates */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className={`${color.light} rounded-lg p-2.5`}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">Eng. CE</span>
                          <span className={`text-xs font-bold ${tauxColor(entity.tauxEngagementCE)}`}>{entity.ce > 0 ? formatPercent(entity.tauxEngagementCE) : '0,0%'}</span>
                        </div>
                        {renderMiniBar(entity.tauxEngagementCE, 100, color.bar)}
                      </div>
                      <div className={`${color.light} rounded-lg p-2.5`}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">Paiement</span>
                          <span className={`text-xs font-bold ${tauxColor(entity.tauxPaiement)}`}>{formatPercent(entity.tauxPaiement)}</span>
                        </div>
                        {renderMiniBar(entity.tauxPaiement, 100, color.bar)}
                      </div>
                    </div>
                    {/* Row 3: Key financial figures */}
                    <div className="grid grid-cols-3 gap-2 pt-1 border-t border-gray-100">
                      <div className="text-center">
                        <p className="text-[10px] text-gray-400 font-medium">Eng. CP</p>
                        <p className="text-xs font-bold text-gray-800">{formatMillions(entity.engCP)}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-[10px] text-gray-400 font-medium">Ordonn.</p>
                        <p className="text-xs font-bold text-gray-800">{formatMillions(entity.ord)}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-[10px] text-gray-400 font-medium">Disponible</p>
                        <p className={`text-xs font-bold ${entity.disponible >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{formatMillions(entity.disponible)}</p>
                      </div>
                    </div>
                    {/* Row 4: Part du budget */}
                    <div className="flex items-center gap-2 pt-1 border-t border-gray-100">
                      <span className="text-[10px] text-gray-400 font-medium">Part du budget</span>
                      <div className="flex-1">
                        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full bg-gradient-to-r ${color.bar}`} style={{ width: `${Math.min(pctBudget, 100)}%` }} />
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-gray-600">{pctBudget.toFixed(1)}%</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Entity Detail Table */}
        <Card className="border border-gray-100 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold text-gray-800 tracking-wide uppercase">Détail par entité <span className="text-gray-400 font-normal">(MDh)</span></CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="text-xs font-bold text-gray-600">entité</TableHead>
                    <TableHead className="text-xs font-bold text-gray-600 text-right">Total CP</TableHead>
                    <TableHead className="text-xs font-bold text-gray-600 text-right">Eng. CP</TableHead>
                    <TableHead className="text-xs font-bold text-gray-600 text-right">Taux eng. CP</TableHead>
                    <TableHead className="text-xs font-bold text-gray-600 text-right">Total CE</TableHead>
                    <TableHead className="text-xs font-bold text-gray-600 text-right">Eng. CE</TableHead>
                    <TableHead className="text-xs font-bold text-gray-600 text-right">Taux eng. CE</TableHead>
                    <TableHead className="text-xs font-bold text-gray-600 text-right">Ordonn.</TableHead>
                    <TableHead className="text-xs font-bold text-gray-600 text-right">Taux ord.</TableHead>
                    <TableHead className="text-xs font-bold text-gray-600 text-right">Paiements</TableHead>
                    <TableHead className="text-xs font-bold text-gray-600 text-right">Taux paiement</TableHead>
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
                      <TableCell className="text-xs text-gray-700 text-right">{formatMillions(e.ce)}</TableCell>
                      <TableCell className="text-xs text-gray-700 text-right">{formatMillions(e.engCE)}</TableCell>
                      <TableCell className="text-xs text-right">
                        <span className={tauxColor(e.tauxEngagementCE)}>{e.ce > 0 ? formatPercent(e.tauxEngagementCE) : '0,0%'}</span>
                      </TableCell>
                      <TableCell className="text-xs text-gray-700 text-right">{formatMillions(e.ord)}</TableCell>
                      <TableCell className="text-xs text-right">
                        <span className={tauxColor(e.tauxOrdonnement)}>{formatPercent(e.tauxOrdonnement)}</span>
                      </TableCell>
                      <TableCell className="text-xs text-gray-700 text-right">{formatMillions(e.paiements)}</TableCell>
                      <TableCell className="text-xs text-right">
                        <span className={tauxColor(e.tauxPaiement)}>{formatPercent(e.tauxPaiement)}</span>
                      </TableCell>
                    </TableRow>
                  ))}
                  {/* Total Row */}
                  <TableRow className="bg-gray-100 border-t-2 border-gray-300">
                    <TableCell className="text-xs font-bold text-gray-900">Total</TableCell>
                    <TableCell className="text-xs font-bold text-gray-900 text-right">{formatMillions(totCP)}</TableCell>
                    <TableCell className="text-xs font-bold text-gray-900 text-right">{formatMillions(totEngCP)}</TableCell>
                    <TableCell className="text-xs font-bold text-right">
                      <span className={tauxColor(totCP > 0 ? (totEngCP / totCP) * 100 : 0)}>{formatPercent(totCP > 0 ? (totEngCP / totCP) * 100 : 0)}</span>
                    </TableCell>
                    <TableCell className="text-xs font-bold text-gray-900 text-right">{formatMillions(totCE)}</TableCell>
                    <TableCell className="text-xs font-bold text-gray-900 text-right">{formatMillions(totEngCE)}</TableCell>
                    <TableCell className="text-xs font-bold text-right">
                      <span className={tauxColor(totCE > 0 ? (totEngCE / totCE) * 100 : 0)}>{totCE > 0 ? formatPercent((totEngCE / totCE) * 100) : '0%'}</span>
                    </TableCell>
                    <TableCell className="text-xs font-bold text-gray-900 text-right">{formatMillions(totOrd)}</TableCell>
                    <TableCell className="text-xs font-bold text-right">
                      <span className={tauxColor(totCP > 0 ? (totOrd / totCP) * 100 : 0)}>{formatPercent(totCP > 0 ? (totOrd / totCP) * 100 : 0)}</span>
                    </TableCell>
                    <TableCell className="text-xs font-bold text-gray-900 text-right">{formatMillions(totPaiements)}</TableCell>
                    <TableCell className="text-xs font-bold text-right">
                      <span className={tauxColor(totCP > 0 ? (totPaiements / totCP) * 100 : 0)}>{formatPercent(totCP > 0 ? (totPaiements / totCP) * 100 : 0)}</span>
                    </TableCell>
                  </TableRow>
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

    return (
      <>
        {/* ═══════════ SECTION 3 : INDICATEURS PAR PROJET ═══════════ */}
        {(() => {
          const projectColors = [
            { bg: 'from-teal-500 to-emerald-600', light: 'bg-teal-50', bar: 'from-teal-400 to-teal-600' },
            { bg: 'from-blue-500 to-indigo-600', light: 'bg-blue-50', bar: 'from-blue-400 to-blue-600' },
            { bg: 'from-violet-500 to-purple-600', light: 'bg-violet-50', bar: 'from-violet-400 to-violet-600' },
            { bg: 'from-amber-500 to-orange-600', light: 'bg-amber-50', bar: 'from-amber-400 to-amber-600' },
            { bg: 'from-rose-500 to-pink-600', light: 'bg-rose-50', bar: 'from-rose-400 to-rose-600' },
            { bg: 'from-cyan-500 to-sky-600', light: 'bg-cyan-50', bar: 'from-cyan-400 to-cyan-600' },
            { bg: 'from-fuchsia-500 to-pink-600', light: 'bg-fuchsia-50', bar: 'from-fuchsia-400 to-fuchsia-600' },
            { bg: 'from-lime-500 to-green-600', light: 'bg-lime-50', bar: 'from-lime-400 to-lime-600' },
          ]
          const getColor = (idx: number) => projectColors[idx % projectColors.length]
          const renderMiniBar = (value: number, max: number, colorClass: string) => {
            const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0
            return (
              <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className={`h-full rounded-full bg-gradient-to-r ${colorClass}`} style={{ width: `${pct}%` }} />
              </div>
            )
          }
          return (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-1 h-5 rounded-full bg-gradient-to-b from-teal-500 to-emerald-600" />
                <h3 className="text-sm font-bold text-gray-800 tracking-wide uppercase">Indicateurs par projet</h3>
                <span className="text-[11px] text-gray-400 font-medium">({analysisByGroup.length} projets)</span>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {analysisByGroup.map((proj, idx) => {
                  const color = getColor(idx)
                  const pctBudget = progTotalBudget > 0 ? (proj.cp / progTotalBudget) * 100 : 0
                  return (
                    <div key={proj.name} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                      {/* Project header */}
                      <div className={`bg-gradient-to-r ${color.bg} px-4 py-3 flex items-center justify-between`}>
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center backdrop-blur-sm">
                            <FolderOpen className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-white leading-tight">{proj.name}</h4>
                            <p className="text-[10px] text-white/70 font-medium">{proj.count} lignes</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-black text-white">{formatMillions(proj.cp)}</p>
                          <p className="text-[10px] text-white/70 font-medium">Total CP</p>
                          <p className="text-xs font-bold text-white/90 mt-0.5">{formatMillions(proj.ce)}</p>
                          <p className="text-[10px] text-white/70 font-medium">CE</p>
                        </div>
                      </div>
                      {/* Key indicators body */}
                      <div className="p-4 space-y-3">
                        {/* Row 1: Engagement & Ordonnancement rates */}
                        <div className="grid grid-cols-2 gap-3">
                          <div className={`${color.light} rounded-lg p-2.5`}>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">Eng. CP</span>
                              <span className={`text-xs font-bold ${tauxColor(proj.tauxEngagement)}`}>{formatPercent(proj.tauxEngagement)}</span>
                            </div>
                            {renderMiniBar(proj.tauxEngagement, 100, color.bar)}
                          </div>
                          <div className={`${color.light} rounded-lg p-2.5`}>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">Ordonn.</span>
                              <span className={`text-xs font-bold ${tauxColor(proj.tauxOrdonnement)}`}>{formatPercent(proj.tauxOrdonnement)}</span>
                            </div>
                            {renderMiniBar(proj.tauxOrdonnement, 100, color.bar)}
                          </div>
                        </div>
                        {/* Row 2: CE engagement & Paiement rates */}
                        <div className="grid grid-cols-2 gap-3">
                          <div className={`${color.light} rounded-lg p-2.5`}>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">Eng. CE</span>
                              <span className={`text-xs font-bold ${tauxColor(proj.tauxEngagementCE)}`}>{proj.ce > 0 ? formatPercent(proj.tauxEngagementCE) : '0,0%'}</span>
                            </div>
                            {renderMiniBar(proj.tauxEngagementCE, 100, color.bar)}
                          </div>
                          <div className={`${color.light} rounded-lg p-2.5`}>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">Paiement</span>
                              <span className={`text-xs font-bold ${tauxColor(proj.tauxPaiement)}`}>{formatPercent(proj.tauxPaiement)}</span>
                            </div>
                            {renderMiniBar(proj.tauxPaiement, 100, color.bar)}
                          </div>
                        </div>
                        {/* Row 3: Key financial figures */}
                        <div className="grid grid-cols-3 gap-2 pt-1 border-t border-gray-100">
                          <div className="text-center">
                            <p className="text-[10px] text-gray-400 font-medium">Eng. CP</p>
                            <p className="text-xs font-bold text-gray-800">{formatMillions(proj.engCP)}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-[10px] text-gray-400 font-medium">Ordonn.</p>
                            <p className="text-xs font-bold text-gray-800">{formatMillions(proj.ord)}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-[10px] text-gray-400 font-medium">Disponible</p>
                            <p className={`text-xs font-bold ${proj.disponible >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{formatMillions(proj.disponible)}</p>
                          </div>
                        </div>
                        {/* Row 4: Part du budget */}
                        <div className="flex items-center gap-2 pt-1 border-t border-gray-100">
                          <span className="text-[10px] text-gray-400 font-medium">Part du budget</span>
                          <div className="flex-1">
                            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div className={`h-full rounded-full bg-gradient-to-r ${color.bar}`} style={{ width: `${Math.min(pctBudget, 100)}%` }} />
                            </div>
                          </div>
                          <span className="text-[10px] font-bold text-gray-600">{pctBudget.toFixed(1)}%</span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })()}

        {/* Programme Detail Table */}
        <Card className="border border-gray-100 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold text-gray-800 tracking-wide uppercase">Détail par projet</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="text-xs font-bold text-gray-600">Projet</TableHead>
                    <TableHead className="text-xs font-bold text-gray-600 text-right">Total CP</TableHead>
                    <TableHead className="text-xs font-bold text-gray-600 text-right">Eng. CP</TableHead>
                    <TableHead className="text-xs font-bold text-gray-600 text-right">Taux eng. CP</TableHead>
                    <TableHead className="text-xs font-bold text-gray-600 text-right">Total CE</TableHead>
                    <TableHead className="text-xs font-bold text-gray-600 text-right">Eng. CE</TableHead>
                    <TableHead className="text-xs font-bold text-gray-600 text-right">Taux eng. CE</TableHead>
                    <TableHead className="text-xs font-bold text-gray-600 text-right">Ordonn.</TableHead>
                    <TableHead className="text-xs font-bold text-gray-600 text-right">Taux ord.</TableHead>
                    <TableHead className="text-xs font-bold text-gray-600 text-right">Paiements</TableHead>
                    <TableHead className="text-xs font-bold text-gray-600 text-right">Taux paiement</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {analysisByGroup.map(g => (
                    <TableRow key={g.name} className="hover:bg-gray-50">
                      <TableCell className="text-xs font-medium text-gray-900">{g.name}</TableCell>
                      <TableCell className="text-xs text-gray-700 text-right">{formatMillions(g.cp)}</TableCell>
                      <TableCell className="text-xs text-gray-700 text-right">{formatMillions(g.engCP)}</TableCell>
                      <TableCell className="text-xs text-right">
                        <span className={tauxColor(g.tauxEngagement)}>{formatPercent(g.tauxEngagement)}</span>
                      </TableCell>
                      <TableCell className="text-xs text-gray-700 text-right">{formatMillions(g.ce)}</TableCell>
                      <TableCell className="text-xs text-gray-700 text-right">{formatMillions(g.engCE)}</TableCell>
                      <TableCell className="text-xs text-right">
                        <span className={tauxColor(g.tauxEngagementCE)}>{g.ce > 0 ? formatPercent(g.tauxEngagementCE) : '0,0%'}</span>
                      </TableCell>
                      <TableCell className="text-xs text-gray-700 text-right">{formatMillions(g.ord)}</TableCell>
                      <TableCell className="text-xs text-right">
                        <span className={tauxColor(g.tauxOrdonnement)}>{formatPercent(g.tauxOrdonnement)}</span>
                      </TableCell>
                      <TableCell className="text-xs text-gray-700 text-right">{formatMillions(g.paiements)}</TableCell>
                      <TableCell className="text-xs text-right">
                        <span className={tauxColor(g.tauxPaiement)}>{formatPercent(g.tauxPaiement)}</span>
                      </TableCell>
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
    return (
      <>
        {/* ═══════════ SECTION 3 : ANALYSE PAR PROGRAMME ═══════════ */}
        {(() => {
          const progColors = [
            { bg: 'from-indigo-500 to-blue-600', light: 'bg-indigo-50', bar: 'from-indigo-400 to-indigo-600', accent: 'text-indigo-700', accentLight: 'text-indigo-500' },
            { bg: 'from-rose-500 to-pink-600', light: 'bg-rose-50', bar: 'from-rose-400 to-rose-600', accent: 'text-rose-700', accentLight: 'text-rose-500' },
          ]
          const renderMiniBar = (value: number, max: number, colorClass: string) => {
            const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0
            return (
              <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className={`h-full rounded-full bg-gradient-to-r ${colorClass}`} style={{ width: `${pct}%` }} />
              </div>
            )
          }
          const totalBudget = analysisByProgramme.reduce((s, p) => s + p.cp, 0)
          return (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-1 h-5 rounded-full bg-gradient-to-b from-indigo-500 to-purple-600" />
                <h3 className="text-sm font-bold text-gray-800 tracking-wide uppercase">Analyse par programme</h3>
                <span className="text-[11px] text-gray-400 font-medium">({analysisByProgramme.length} programmes)</span>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {analysisByProgramme.map((prog, idx) => {
                  const color = progColors[idx % progColors.length]
                  const pctBudget = totalBudget > 0 ? (prog.cp / totalBudget) * 100 : 0
                  const tauxEngReport = prog.cpReports > 0 ? (prog.engReports / prog.cpReports) * 100 : 0
                  const tauxEngConsolide = prog.cpConsolides > 0 ? (prog.engConsolides / prog.cpConsolides) * 100 : 0
                  const tauxEngNouveau = prog.cpNouveaux > 0 ? (prog.engNouveaux / prog.cpNouveaux) * 100 : 0
                  const tauxOrdReport = prog.cpReports > 0 ? (prog.ordReports / prog.cpReports) * 100 : 0
                  const tauxOrdConsolide = prog.cpConsolides > 0 ? (prog.ordConsolides / prog.cpConsolides) * 100 : 0
                  const tauxOrdNouveau = prog.cpNouveaux > 0 ? (prog.ordNouveaux / prog.cpNouveaux) * 100 : 0
                  return (
                    <div key={prog.name} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                      {/* Programme header */}
                      <div className={`bg-gradient-to-r ${color.bg} px-4 py-3 flex items-center justify-between`}>
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center backdrop-blur-sm">
                            <Landmark className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-white leading-tight">{prog.name}</h4>
                            <p className="text-[10px] text-white/70 font-medium">{prog.count} lignes</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-black text-white">{formatMillions(prog.cp)}</p>
                          <p className="text-[10px] text-white/70 font-medium">Total CP</p>
                          <p className="text-xs font-bold text-white/90 mt-0.5">{formatMillions(prog.ce)}</p>
                          <p className="text-[10px] text-white/70 font-medium">CE</p>
                        </div>
                      </div>

                      {/* Indicators body */}
                      <div className="p-4 space-y-3">
                        {/* Row 1: Crédits breakdown */}
                        <div>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Crédits</p>
                          <div className="grid grid-cols-3 gap-2">
                            <div className={`${color.light} rounded-lg p-2`}>
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-[9px] font-bold text-gray-500 uppercase">Reports</span>
                                <span className="text-[10px] font-bold text-gray-700">{formatMillions(prog.cpReports)}</span>
                              </div>
                              <div className="w-full h-1 bg-gray-200 rounded-full overflow-hidden">
                                <div className={`h-full rounded-full bg-gradient-to-r ${color.bar}`} style={{ width: `${prog.cp > 0 ? Math.min((prog.cpReports / prog.cp) * 100, 100) : 0}%` }} />
                              </div>
                              <p className="text-[9px] text-gray-400 mt-0.5">{prog.cp > 0 ? formatPercent((prog.cpReports / prog.cp) * 100) : '0%'}</p>
                            </div>
                            <div className={`${color.light} rounded-lg p-2`}>
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-[9px] font-bold text-gray-500 uppercase">Consolidés</span>
                                <span className="text-[10px] font-bold text-gray-700">{formatMillions(prog.cpConsolides)}</span>
                              </div>
                              <div className="w-full h-1 bg-gray-200 rounded-full overflow-hidden">
                                <div className={`h-full rounded-full bg-gradient-to-r ${color.bar}`} style={{ width: `${prog.cp > 0 ? Math.min((prog.cpConsolides / prog.cp) * 100, 100) : 0}%` }} />
                              </div>
                              <p className="text-[9px] text-gray-400 mt-0.5">{prog.cp > 0 ? formatPercent((prog.cpConsolides / prog.cp) * 100) : '0%'}</p>
                            </div>
                            <div className={`${color.light} rounded-lg p-2`}>
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-[9px] font-bold text-gray-500 uppercase">Nouveaux</span>
                                <span className="text-[10px] font-bold text-gray-700">{formatMillions(prog.cpNouveaux)}</span>
                              </div>
                              <div className="w-full h-1 bg-gray-200 rounded-full overflow-hidden">
                                <div className={`h-full rounded-full bg-gradient-to-r ${color.bar}`} style={{ width: `${prog.cp > 0 ? Math.min((prog.cpNouveaux / prog.cp) * 100, 100) : 0}%` }} />
                              </div>
                              <p className="text-[9px] text-gray-400 mt-0.5">{prog.cp > 0 ? formatPercent((prog.cpNouveaux / prog.cp) * 100) : '0%'}</p>
                            </div>
                          </div>
                        </div>

                        {/* Row 2: Taux d'engagement */}
                        <div>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Taux d&apos;engagement</p>
                          <div className="grid grid-cols-2 gap-3">
                            <div className={`${color.light} rounded-lg p-2.5`}>
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">Eng. CP</span>
                                <span className={`text-xs font-bold ${tauxColor(prog.tauxEngagement)}`}>{formatPercent(prog.tauxEngagement)}</span>
                              </div>
                              {renderMiniBar(prog.tauxEngagement, 100, color.bar)}
                              <p className="text-[9px] text-gray-400 mt-0.5">{formatMillions(prog.engCP)} M DH</p>
                            </div>
                            <div className={`${color.light} rounded-lg p-2.5`}>
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">Eng. CE</span>
                                <span className={`text-xs font-bold ${tauxColor(prog.tauxEngagementCE)}`}>{prog.ce > 0 ? formatPercent(prog.tauxEngagementCE) : '0%'}</span>
                              </div>
                              {renderMiniBar(prog.tauxEngagementCE, 100, color.bar)}
                              <p className="text-[9px] text-gray-400 mt-0.5">{formatMillions(prog.engCE)} M DH</p>
                            </div>
                          </div>
                        </div>

                        {/* Row 3: Engagement par type */}
                        <div>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Engagement par type</p>
                          <div className="grid grid-cols-3 gap-2">
                            <div className={`${color.light} rounded-lg p-2`}>
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-[9px] font-bold text-gray-500 uppercase">Sur Report</span>
                                <span className={`text-[10px] font-bold ${tauxColor(tauxEngReport)}`}>{formatPercent(tauxEngReport)}</span>
                              </div>
                              <div className="w-full h-1 bg-gray-200 rounded-full overflow-hidden">
                                <div className={`h-full rounded-full bg-gradient-to-r ${color.bar}`} style={{ width: `${Math.min(tauxEngReport, 100)}%` }} />
                              </div>
                              <p className="text-[9px] text-gray-400 mt-0.5">{formatMillions(prog.engReports)} M DH</p>
                            </div>
                            <div className={`${color.light} rounded-lg p-2`}>
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-[9px] font-bold text-gray-500 uppercase">Sur Consol.</span>
                                <span className={`text-[10px] font-bold ${tauxColor(tauxEngConsolide)}`}>{formatPercent(tauxEngConsolide)}</span>
                              </div>
                              <div className="w-full h-1 bg-gray-200 rounded-full overflow-hidden">
                                <div className={`h-full rounded-full bg-gradient-to-r ${color.bar}`} style={{ width: `${Math.min(tauxEngConsolide, 100)}%` }} />
                              </div>
                              <p className="text-[9px] text-gray-400 mt-0.5">{formatMillions(prog.engConsolides)} M DH</p>
                            </div>
                            <div className={`${color.light} rounded-lg p-2`}>
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-[9px] font-bold text-gray-500 uppercase">Sur Nouv.</span>
                                <span className={`text-[10px] font-bold ${tauxColor(tauxEngNouveau)}`}>{formatPercent(tauxEngNouveau)}</span>
                              </div>
                              <div className="w-full h-1 bg-gray-200 rounded-full overflow-hidden">
                                <div className={`h-full rounded-full bg-gradient-to-r ${color.bar}`} style={{ width: `${Math.min(tauxEngNouveau, 100)}%` }} />
                              </div>
                              <p className="text-[9px] text-gray-400 mt-0.5">{formatMillions(prog.engNouveaux)} M DH</p>
                            </div>
                          </div>
                        </div>

                        {/* Row 4: Ordonnancement */}
                        <div>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Ordonnancement</p>
                          <div className="grid grid-cols-2 gap-3 mb-2">
                            <div className={`${color.light} rounded-lg p-2.5`}>
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">Taux ord. CP</span>
                                <span className={`text-xs font-bold ${tauxColor(prog.tauxOrdonnement)}`}>{formatPercent(prog.tauxOrdonnement)}</span>
                              </div>
                              {renderMiniBar(prog.tauxOrdonnement, 100, color.bar)}
                              <p className="text-[9px] text-gray-400 mt-0.5">{formatMillions(prog.ord)} M DH</p>
                            </div>
                            <div className={`${color.light} rounded-lg p-2.5`}>
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">Taux paiement</span>
                                <span className={`text-xs font-bold ${tauxColor(prog.tauxPaiement)}`}>{formatPercent(prog.tauxPaiement)}</span>
                              </div>
                              {renderMiniBar(prog.tauxPaiement, 100, color.bar)}
                              <p className="text-[9px] text-gray-400 mt-0.5">{formatMillions(prog.paiements)} M DH</p>
                            </div>
                          </div>
                          <div className="grid grid-cols-3 gap-2">
                            <div className={`${color.light} rounded-lg p-2`}>
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-[9px] font-bold text-gray-500 uppercase">Ord/Report</span>
                                <span className={`text-[10px] font-bold ${tauxColor(tauxOrdReport)}`}>{formatPercent(tauxOrdReport)}</span>
                              </div>
                              <div className="w-full h-1 bg-gray-200 rounded-full overflow-hidden">
                                <div className={`h-full rounded-full bg-gradient-to-r ${color.bar}`} style={{ width: `${Math.min(tauxOrdReport, 100)}%` }} />
                              </div>
                            </div>
                            <div className={`${color.light} rounded-lg p-2`}>
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-[9px] font-bold text-gray-500 uppercase">Ord/Consol.</span>
                                <span className={`text-[10px] font-bold ${tauxColor(tauxOrdConsolide)}`}>{formatPercent(tauxOrdConsolide)}</span>
                              </div>
                              <div className="w-full h-1 bg-gray-200 rounded-full overflow-hidden">
                                <div className={`h-full rounded-full bg-gradient-to-r ${color.bar}`} style={{ width: `${Math.min(tauxOrdConsolide, 100)}%` }} />
                              </div>
                            </div>
                            <div className={`${color.light} rounded-lg p-2`}>
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-[9px] font-bold text-gray-500 uppercase">Ord/Nouv.</span>
                                <span className={`text-[10px] font-bold ${tauxColor(tauxOrdNouveau)}`}>{formatPercent(tauxOrdNouveau)}</span>
                              </div>
                              <div className="w-full h-1 bg-gray-200 rounded-full overflow-hidden">
                                <div className={`h-full rounded-full bg-gradient-to-r ${color.bar}`} style={{ width: `${Math.min(tauxOrdNouveau, 100)}%` }} />
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Row 5: Résumé financier */}
                        <div className="grid grid-cols-4 gap-2 pt-2 border-t border-gray-100">
                          <div className="text-center">
                            <p className="text-[10px] text-gray-400 font-medium">Total CP</p>
                            <p className="text-xs font-bold text-gray-800">{formatMillions(prog.cp)}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-[10px] text-gray-400 font-medium">Total CE</p>
                            <p className="text-xs font-bold text-gray-800">{formatMillions(prog.ce)}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-[10px] text-gray-400 font-medium">Prévisions</p>
                            <p className="text-xs font-bold text-gray-800">{formatMillions(prog.previsions)}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-[10px] text-gray-400 font-medium">Disponible</p>
                            <p className={`text-xs font-bold ${prog.disponible >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{formatMillions(prog.disponible)}</p>
                          </div>
                        </div>

                        {/* Row 6: Part du budget */}
                        <div className="flex items-center gap-2 pt-1 border-t border-gray-100">
                          <span className="text-[10px] text-gray-400 font-medium">Part du budget</span>
                          <div className="flex-1">
                            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div className={`h-full rounded-full bg-gradient-to-r ${color.bar}`} style={{ width: `${Math.min(pctBudget, 100)}%` }} />
                            </div>
                          </div>
                          <span className="text-[10px] font-bold text-gray-600">{pctBudget.toFixed(1)}%</span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })()}

        {/* ═══════════ TABLEAU D'ANALYSE PAR PROGRAMME ═══════════ */}
        <Card className="border border-gray-100 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold text-gray-800 tracking-wide uppercase">Tableau d&apos;analyse par programme <span className="text-gray-400 font-normal">(MDh)</span></CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="text-xs font-bold text-gray-600" rowSpan={2}>Programme</TableHead>
                    <TableHead className="text-xs font-bold text-blue-700 text-center bg-blue-50/50" colSpan={3}>Crédits</TableHead>
                    <TableHead className="text-xs font-bold text-emerald-700 text-center bg-emerald-50/50" colSpan={5}>Engagements</TableHead>
                    <TableHead className="text-xs font-bold text-indigo-700 text-center bg-indigo-50/50" colSpan={5}>Ordonnancement</TableHead>
                  </TableRow>
                  <TableRow className="bg-gray-50/80">
                    <TableHead className="text-[10px] font-bold text-blue-600 text-right">Reports</TableHead>
                    <TableHead className="text-[10px] font-bold text-blue-600 text-right">Consolidés</TableHead>
                    <TableHead className="text-[10px] font-bold text-blue-600 text-right">Nouveaux</TableHead>
                    <TableHead className="text-[10px] font-bold text-emerald-600 text-right">Eng. CP</TableHead>
                    <TableHead className="text-[10px] font-bold text-emerald-600 text-right">Taux eng. CP</TableHead>
                    <TableHead className="text-[10px] font-bold text-emerald-600 text-right">Sur Report</TableHead>
                    <TableHead className="text-[10px] font-bold text-emerald-600 text-right">Sur Consol.</TableHead>
                    <TableHead className="text-[10px] font-bold text-emerald-600 text-right">Sur Nouv.</TableHead>
                    <TableHead className="text-[10px] font-bold text-indigo-600 text-right">Ord/Report</TableHead>
                    <TableHead className="text-[10px] font-bold text-indigo-600 text-right">Ord/Consol.</TableHead>
                    <TableHead className="text-[10px] font-bold text-indigo-600 text-right">Ord/Nouv.</TableHead>
                    <TableHead className="text-[10px] font-bold text-indigo-600 text-right">Total Ord.</TableHead>
                    <TableHead className="text-[10px] font-bold text-indigo-600 text-right">Taux ord.</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {analysisByProgramme.map(prog => {
                    const tauxEngReport = prog.cpReports > 0 ? (prog.engReports / prog.cpReports) * 100 : 0
                    const tauxEngConsolide = prog.cpConsolides > 0 ? (prog.engConsolides / prog.cpConsolides) * 100 : 0
                    const tauxEngNouveau = prog.cpNouveaux > 0 ? (prog.engNouveaux / prog.cpNouveaux) * 100 : 0
                    const tauxOrdReport = prog.cpReports > 0 ? (prog.ordReports / prog.cpReports) * 100 : 0
                    const tauxOrdConsolide = prog.cpConsolides > 0 ? (prog.ordConsolides / prog.cpConsolides) * 100 : 0
                    const tauxOrdNouveau = prog.cpNouveaux > 0 ? (prog.ordNouveaux / prog.cpNouveaux) * 100 : 0
                    return (
                      <TableRow key={prog.name} className="hover:bg-gray-50">
                        <TableCell className="text-xs font-bold text-gray-900">{prog.name}</TableCell>
                        <TableCell className="text-xs text-gray-700 text-right">{formatMillions(prog.cpReports)}</TableCell>
                        <TableCell className="text-xs text-gray-700 text-right">{formatMillions(prog.cpConsolides)}</TableCell>
                        <TableCell className="text-xs text-gray-700 text-right">{formatMillions(prog.cpNouveaux)}</TableCell>
                        <TableCell className="text-xs text-gray-700 text-right">{formatMillions(prog.engCP)}</TableCell>
                        <TableCell className="text-xs text-right"><span className={tauxColor(prog.tauxEngagement)}>{formatPercent(prog.tauxEngagement)}</span></TableCell>
                        <TableCell className="text-xs text-right"><span className={tauxColor(tauxEngReport)}>{formatPercent(tauxEngReport)}</span></TableCell>
                        <TableCell className="text-xs text-right"><span className={tauxColor(tauxEngConsolide)}>{formatPercent(tauxEngConsolide)}</span></TableCell>
                        <TableCell className="text-xs text-right"><span className={tauxColor(tauxEngNouveau)}>{formatPercent(tauxEngNouveau)}</span></TableCell>
                        <TableCell className="text-xs text-right"><span className={tauxColor(tauxOrdReport)}>{formatPercent(tauxOrdReport)}</span></TableCell>
                        <TableCell className="text-xs text-right"><span className={tauxColor(tauxOrdConsolide)}>{formatPercent(tauxOrdConsolide)}</span></TableCell>
                        <TableCell className="text-xs text-right"><span className={tauxColor(tauxOrdNouveau)}>{formatPercent(tauxOrdNouveau)}</span></TableCell>
                        <TableCell className="text-xs text-gray-700 text-right">{formatMillions(prog.ord)}</TableCell>
                        <TableCell className="text-xs text-right"><span className={tauxColor(prog.tauxOrdonnement)}>{formatPercent(prog.tauxOrdonnement)}</span></TableCell>
                      </TableRow>
                    )
                  })}
                  {/* Total row */}
                  <TableRow className="bg-gray-50 font-bold border-t-2 border-gray-200">
                    {(() => {
                      const tot = analysisByProgramme.reduce((s, p) => ({
                        cpReports: s.cpReports + p.cpReports,
                        cpConsolides: s.cpConsolides + p.cpConsolides,
                        cpNouveaux: s.cpNouveaux + p.cpNouveaux,
                        engCP: s.engCP + p.engCP,
                        engReports: s.engReports + p.engReports,
                        engConsolides: s.engConsolides + p.engConsolides,
                        engNouveaux: s.engNouveaux + p.engNouveaux,
                        ord: s.ord + p.ord,
                        ordReports: s.ordReports + p.ordReports,
                        ordConsolides: s.ordConsolides + p.ordConsolides,
                        ordNouveaux: s.ordNouveaux + p.ordNouveaux,
                        paiements: s.paiements + p.paiements,
                        previsions: s.previsions + p.previsions,
                        disponible: s.disponible + p.disponible,
                        cp: s.cp + p.cp,
                        engCE: s.engCE + p.engCE,
                        ce: s.ce + p.ce,
                      }), { cpReports: 0, cpConsolides: 0, cpNouveaux: 0, engCP: 0, engReports: 0, engConsolides: 0, engNouveaux: 0, ord: 0, ordReports: 0, ordConsolides: 0, ordNouveaux: 0, paiements: 0, previsions: 0, disponible: 0, cp: 0, engCE: 0, ce: 0 })
                      const tTauxEng = tot.cp > 0 ? (tot.engCP / tot.cp) * 100 : 0
                      const tTauxEngReport = tot.cpReports > 0 ? (tot.engReports / tot.cpReports) * 100 : 0
                      const tTauxEngConsolide = tot.cpConsolides > 0 ? (tot.engConsolides / tot.cpConsolides) * 100 : 0
                      const tTauxEngNouveau = tot.cpNouveaux > 0 ? (tot.engNouveaux / tot.cpNouveaux) * 100 : 0
                      const tTauxOrd = tot.cp > 0 ? (tot.ord / tot.cp) * 100 : 0
                      const tTauxOrdReport = tot.cpReports > 0 ? (tot.ordReports / tot.cpReports) * 100 : 0
                      const tTauxOrdConsolide = tot.cpConsolides > 0 ? (tot.ordConsolides / tot.cpConsolides) * 100 : 0
                      const tTauxOrdNouveau = tot.cpNouveaux > 0 ? (tot.ordNouveaux / tot.cpNouveaux) * 100 : 0
                      return (
                        <>
                          <TableCell className="text-xs font-bold text-gray-900">Total</TableCell>
                          <TableCell className="text-xs font-bold text-gray-800 text-right">{formatMillions(tot.cpReports)}</TableCell>
                          <TableCell className="text-xs font-bold text-gray-800 text-right">{formatMillions(tot.cpConsolides)}</TableCell>
                          <TableCell className="text-xs font-bold text-gray-800 text-right">{formatMillions(tot.cpNouveaux)}</TableCell>
                          <TableCell className="text-xs font-bold text-gray-800 text-right">{formatMillions(tot.engCP)}</TableCell>
                          <TableCell className="text-xs text-right"><span className={tauxColor(tTauxEng)}>{formatPercent(tTauxEng)}</span></TableCell>
                          <TableCell className="text-xs text-right"><span className={tauxColor(tTauxEngReport)}>{formatPercent(tTauxEngReport)}</span></TableCell>
                          <TableCell className="text-xs text-right"><span className={tauxColor(tTauxEngConsolide)}>{formatPercent(tTauxEngConsolide)}</span></TableCell>
                          <TableCell className="text-xs text-right"><span className={tauxColor(tTauxEngNouveau)}>{formatPercent(tTauxEngNouveau)}</span></TableCell>
                          <TableCell className="text-xs text-right"><span className={tauxColor(tTauxOrdReport)}>{formatPercent(tTauxOrdReport)}</span></TableCell>
                          <TableCell className="text-xs text-right"><span className={tauxColor(tTauxOrdConsolide)}>{formatPercent(tTauxOrdConsolide)}</span></TableCell>
                          <TableCell className="text-xs text-right"><span className={tauxColor(tTauxOrdNouveau)}>{formatPercent(tTauxOrdNouveau)}</span></TableCell>
                          <TableCell className="text-xs font-bold text-gray-800 text-right">{formatMillions(tot.ord)}</TableCell>
                          <TableCell className="text-xs text-right"><span className={tauxColor(tTauxOrd)}>{formatPercent(tTauxOrd)}</span></TableCell>
                        </>
                      )
                    })()}
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

      </>
    )
  }

  const renderEngagementsView = () => {
    return (
      <>
        {renderKPISections(kpis)}

        {/* ═══════════ Engagement par Programme ═══════════ */}
        <Card className="border border-gray-100 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold text-gray-800 tracking-wide uppercase">Engagements par Programme</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-indigo-50/60">
                    <TableHead className="text-xs font-bold text-indigo-700">Programme</TableHead>
                    <TableHead className="text-xs font-bold text-indigo-700 text-right">Crédits Report</TableHead>
                    <TableHead className="text-xs font-bold text-indigo-700 text-right">Crédits Consolidés</TableHead>
                    <TableHead className="text-xs font-bold text-indigo-700 text-right">Crédits Nouveaux</TableHead>
                    <TableHead className="text-xs font-bold text-indigo-700 text-right">Total CP</TableHead>
                    <TableHead className="text-xs font-bold text-indigo-700 text-right">Eng. Reports</TableHead>
                    <TableHead className="text-xs font-bold text-indigo-700 text-right">% Report</TableHead>
                    <TableHead className="text-xs font-bold text-indigo-700 text-right">Eng. Consolidés</TableHead>
                    <TableHead className="text-xs font-bold text-indigo-700 text-right">% Consolidé</TableHead>
                    <TableHead className="text-xs font-bold text-indigo-700 text-right">Eng. Nouveaux</TableHead>
                    <TableHead className="text-xs font-bold text-indigo-700 text-right">% Nouveaux</TableHead>
                    <TableHead className="text-xs font-bold text-indigo-700 text-right">Eng. CP Total</TableHead>
                    <TableHead className="text-xs font-bold text-indigo-700 text-right">Taux eng. CP</TableHead>
                    <TableHead className="text-xs font-bold text-indigo-700 text-right">Reste à engager CP</TableHead>
                    <TableHead className="text-xs font-bold text-indigo-700 text-right">Total CE</TableHead>
                    <TableHead className="text-xs font-bold text-indigo-700 text-right">Eng. CE</TableHead>
                    <TableHead className="text-xs font-bold text-indigo-700 text-right">% CE</TableHead>
                    <TableHead className="text-xs font-bold text-indigo-700 text-right">Reste à engager CE</TableHead>
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
                            <TableCell className="text-xs font-bold text-emerald-700 text-right">{formatMillions(p.engCP)}</TableCell>
                            <TableCell className="text-xs text-right"><span className={tauxColor(p.tauxEngagement)}>{formatPercent(p.tauxEngagement)}</span></TableCell>
                            <TableCell className="text-xs text-gray-700 text-right">{formatMillions(p.cp - p.engCP)}</TableCell>
                            <TableCell className="text-xs text-gray-700 text-right">{formatMillions(p.ce)}</TableCell>
                            <TableCell className="text-xs font-bold text-teal-700 text-right">{formatMillions(p.engCE)}</TableCell>
                            <TableCell className="text-xs text-right"><span className={tauxColor(p.ce > 0 ? (p.engCE / p.ce) * 100 : 0)}>{formatPercent(p.ce > 0 ? (p.engCE / p.ce) * 100 : 0)}</span></TableCell>
                            <TableCell className="text-xs text-gray-700 text-right">{formatMillions(p.ce - p.engCE)}</TableCell>
                          </TableRow>
                        ))}
                        <TableRow className="bg-indigo-50/40 font-bold-total">
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
            <CardTitle className="text-sm font-bold text-gray-800 tracking-wide uppercase">Engagements par Projet</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-emerald-50/60">
                    <TableHead className="text-xs font-bold text-emerald-700">Projet</TableHead>
                    <TableHead className="text-xs font-bold text-emerald-700 text-right">Crédits Report</TableHead>
                    <TableHead className="text-xs font-bold text-emerald-700 text-right">Crédits Consolidés</TableHead>
                    <TableHead className="text-xs font-bold text-emerald-700 text-right">Crédits Nouveaux</TableHead>
                    <TableHead className="text-xs font-bold text-emerald-700 text-right">Total CP</TableHead>
                    <TableHead className="text-xs font-bold text-emerald-700 text-right">Eng. Reports</TableHead>
                    <TableHead className="text-xs font-bold text-emerald-700 text-right">% Report</TableHead>
                    <TableHead className="text-xs font-bold text-emerald-700 text-right">Eng. Consolidés</TableHead>
                    <TableHead className="text-xs font-bold text-emerald-700 text-right">% Consolidé</TableHead>
                    <TableHead className="text-xs font-bold text-emerald-700 text-right">Eng. Nouveaux</TableHead>
                    <TableHead className="text-xs font-bold text-emerald-700 text-right">% Nouveaux</TableHead>
                    <TableHead className="text-xs font-bold text-emerald-700 text-right">Eng. CP Total</TableHead>
                    <TableHead className="text-xs font-bold text-emerald-700 text-right">Taux eng. CP</TableHead>
                    <TableHead className="text-xs font-bold text-emerald-700 text-right">Reste à engager CP</TableHead>
                    <TableHead className="text-xs font-bold text-emerald-700 text-right">Total CE</TableHead>
                    <TableHead className="text-xs font-bold text-emerald-700 text-right">Eng. CE</TableHead>
                    <TableHead className="text-xs font-bold text-emerald-700 text-right">% CE</TableHead>
                    <TableHead className="text-xs font-bold text-emerald-700 text-right">Reste à engager CE</TableHead>
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
                            <TableCell className="text-xs font-bold text-emerald-700 text-right">{formatMillions(g.engCP)}</TableCell>
                            <TableCell className="text-xs text-right"><span className={tauxColor(g.tauxEngagement)}>{formatPercent(g.tauxEngagement)}</span></TableCell>
                            <TableCell className="text-xs text-gray-700 text-right">{formatMillions(g.cp - g.engCP)}</TableCell>
                            <TableCell className="text-xs text-gray-700 text-right">{formatMillions(g.ce)}</TableCell>
                            <TableCell className="text-xs font-bold text-teal-700 text-right">{formatMillions(g.engCE)}</TableCell>
                            <TableCell className="text-xs text-right"><span className={tauxColor(g.ce > 0 ? (g.engCE / g.ce) * 100 : 0)}>{formatPercent(g.ce > 0 ? (g.engCE / g.ce) * 100 : 0)}</span></TableCell>
                            <TableCell className="text-xs text-gray-700 text-right">{formatMillions(g.ce - g.engCE)}</TableCell>
                          </TableRow>
                        ))}
                        <TableRow className="bg-emerald-50/40 font-bold-total">
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
            <CardTitle className="text-sm font-bold text-gray-800 tracking-wide uppercase">Engagements par Entité</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/60">
                    <TableHead className="text-xs font-bold text-slate-700">Entité</TableHead>
                    <TableHead className="text-xs font-bold text-slate-700 text-right">Crédits Report</TableHead>
                    <TableHead className="text-xs font-bold text-slate-700 text-right">Crédits Consolidés</TableHead>
                    <TableHead className="text-xs font-bold text-slate-700 text-right">Crédits Nouveaux</TableHead>
                    <TableHead className="text-xs font-bold text-slate-700 text-right">Total CP</TableHead>
                    <TableHead className="text-xs font-bold text-slate-700 text-right">Eng. Reports</TableHead>
                    <TableHead className="text-xs font-bold text-slate-700 text-right">% Report</TableHead>
                    <TableHead className="text-xs font-bold text-slate-700 text-right">Eng. Consolidés</TableHead>
                    <TableHead className="text-xs font-bold text-slate-700 text-right">% Consolidé</TableHead>
                    <TableHead className="text-xs font-bold text-slate-700 text-right">Eng. Nouveaux</TableHead>
                    <TableHead className="text-xs font-bold text-slate-700 text-right">% Nouveaux</TableHead>
                    <TableHead className="text-xs font-bold text-slate-700 text-right">Eng. CP Total</TableHead>
                    <TableHead className="text-xs font-bold text-slate-700 text-right">Taux eng. CP</TableHead>
                    <TableHead className="text-xs font-bold text-slate-700 text-right">Reste à engager CP</TableHead>
                    <TableHead className="text-xs font-bold text-slate-700 text-right">Total CE</TableHead>
                    <TableHead className="text-xs font-bold text-slate-700 text-right">Eng. CE</TableHead>
                    <TableHead className="text-xs font-bold text-slate-700 text-right">% CE</TableHead>
                    <TableHead className="text-xs font-bold text-slate-700 text-right">Reste à engager CE</TableHead>
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
                            <TableCell className="text-xs font-bold text-emerald-700 text-right">{formatMillions(e.engCP)}</TableCell>
                            <TableCell className="text-xs text-right"><span className={tauxColor(e.tauxEngagement)}>{formatPercent(e.tauxEngagement)}</span></TableCell>
                            <TableCell className="text-xs text-gray-700 text-right">{formatMillions(e.cp - e.engCP)}</TableCell>
                            <TableCell className="text-xs text-gray-700 text-right">{formatMillions(e.ce)}</TableCell>
                            <TableCell className="text-xs font-bold text-teal-700 text-right">{formatMillions(e.engCE)}</TableCell>
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
            <CardTitle className="text-sm font-bold text-gray-800 tracking-wide uppercase">Détail des engagements <span className="text-gray-400 font-normal">(MDh)</span></CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-blue-50/60">
                    <TableHead className="text-xs font-bold text-blue-700" rowSpan={2}>Projet</TableHead>
                    <TableHead className="text-xs font-bold text-blue-700" rowSpan={2}>Entité</TableHead>
                    <TableHead className="text-xs font-bold text-blue-700" rowSpan={2}>Nomenclature</TableHead>
                    <TableHead className="text-xs font-bold text-blue-700" rowSpan={2}>N° Engagement</TableHead>
                    <TableHead className="text-xs font-bold text-blue-700" rowSpan={2}>Désignation</TableHead>
                    <TableHead className="text-xs font-bold text-blue-700 text-right" rowSpan={2}>Total CP</TableHead>
                    <TableHead className="text-xs font-bold text-center text-emerald-600" colSpan={4}>Engagements</TableHead>
                    <TableHead className="text-xs font-bold text-blue-700 text-right" rowSpan={2}>Taux eng.</TableHead>
                  </TableRow>
                  <TableRow className="bg-blue-50/40">
                    <TableHead className="text-[10px] font-bold text-emerald-500 text-right">Rep.</TableHead>
                    <TableHead className="text-[10px] font-bold text-emerald-500 text-right">Cons.</TableHead>
                    <TableHead className="text-[10px] font-bold text-emerald-500 text-right">Nouv.</TableHead>
                    <TableHead className="text-[10px] font-bold text-emerald-500 text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(() => {
                    let currentProjet = ''
                    const totCP = filteredData.reduce((s, r) => s + (r['TOTAL CP'] || 0), 0)
                    const totEngRep = engagementLines.reduce((s, r) => s + r.engReports, 0)
                    const totEngCons = engagementLines.reduce((s, r) => s + r.engConsolides, 0)
                    const totEngNouv = engagementLines.reduce((s, r) => s + r.engNouveaux, 0)
                    const totEngCPTotal = engagementLines.reduce((s, r) => s + r.engCPTotal, 0)
                    return (
                      <>
                        {engagementLines.map((r, idx) => {
                          const showProjetHeader = (r.projet || 'Non classé') !== currentProjet
                          currentProjet = r.projet || 'Non classé'
                          return (
                            <TableRow key={`${r.numEngagement}-${idx}`} className={`hover:bg-gray-50 ${showProjetHeader && idx > 0 ? 'border-t-2 border-blue-200' : ''}`}>
                              <TableCell className="text-xs font-medium text-gray-900 whitespace-nowrap">{r.projet || 'Non classé'}</TableCell>
                              <TableCell className="text-xs text-gray-600">{r.entite}</TableCell>
                              <TableCell className="text-xs text-blue-600 font-mono whitespace-nowrap">{r.nomenclature}</TableCell>
                              <TableCell className="text-xs font-medium text-gray-900">{r.numEngagement}</TableCell>
                              <TableCell className="text-xs text-gray-700" style={{minWidth:'250px',maxWidth:'400px',whiteSpace:'normal',lineHeight:'1.4'}}>{r.designation}</TableCell>
                              <TableCell className="text-xs text-gray-700 text-right">{formatMillions(r.cp)}</TableCell>
                              <TableCell className="text-xs text-emerald-600 text-right">{formatMillions(r.engReports)}</TableCell>
                              <TableCell className="text-xs text-emerald-600 text-right">{formatMillions(r.engConsolides)}</TableCell>
                              <TableCell className="text-xs text-emerald-600 text-right">{formatMillions(r.engNouveaux)}</TableCell>
                              <TableCell className="text-xs font-bold text-emerald-700 text-right">{formatMillions(r.engCPTotal)}</TableCell>
                              <TableCell className="text-xs text-right">
                                <span className={tauxColor(r.tauxEngagement)}>{formatPercent(r.tauxEngagement)}</span>
                              </TableCell>
                            </TableRow>
                          )
                        })}
                        <TableRow className="bg-blue-50/40 font-bold-total">
                          <TableCell className="text-xs font-bold text-gray-900" colSpan={5}>Total ({engagementLines.length} prestations)</TableCell>
                          <TableCell className="text-xs font-bold text-gray-900 text-right">{formatMillions(totCP)}</TableCell>
                          <TableCell className="text-xs font-bold text-emerald-700 text-right">{formatMillions(totEngRep)}</TableCell>
                          <TableCell className="text-xs font-bold text-emerald-700 text-right">{formatMillions(totEngCons)}</TableCell>
                          <TableCell className="text-xs font-bold text-emerald-700 text-right">{formatMillions(totEngNouv)}</TableCell>
                          <TableCell className="text-xs font-bold text-emerald-700 text-right">{formatMillions(totEngCPTotal)}</TableCell>
                          <TableCell className="text-xs font-bold text-right">
                            <span className={tauxColor(totCP > 0 ? (totEngCPTotal / totCP) * 100 : 0)}>{formatPercent(totCP > 0 ? (totEngCPTotal / totCP) * 100 : 0)}</span>
                          </TableCell>
                        </TableRow>
                      </>
                    )
                  })()}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

      </>
    )
  }

  const renderOrdonnancementsView = () => {
    // Ordonnancement par Programme
    const ordByProgramme = analysisByProgramme.map(p => ({
      name: p.name,
      cp: p.cp,
      ordReports: p.ordReports,
      ordConsolides: p.ordConsolides,
      ordNouveaux: p.ordNouveaux,
      ord: p.ord,
      paiements: p.paiements,
      tauxOrdonnement: p.tauxOrdonnement,
      tauxPaiement: p.tauxPaiement,
    }))
    const totProgCP = ordByProgramme.reduce((s, p) => s + p.cp, 0)
    const totProgOrdRep = ordByProgramme.reduce((s, p) => s + p.ordReports, 0)
    const totProgOrdCons = ordByProgramme.reduce((s, p) => s + p.ordConsolides, 0)
    const totProgOrdNouv = ordByProgramme.reduce((s, p) => s + p.ordNouveaux, 0)
    const totProgOrd = ordByProgramme.reduce((s, p) => s + p.ord, 0)
    const totProgPaiements = ordByProgramme.reduce((s, p) => s + p.paiements, 0)

    // Ordonnancement par Projet
    const ordByProjet = analysisByGroup.map(g => ({
      name: g.name,
      cp: g.cp,
      ordReports: g.ordReports,
      ordConsolides: g.ordConsolides,
      ordNouveaux: g.ordNouveaux,
      ord: g.ord,
      paiements: g.paiements,
      tauxOrdonnement: g.tauxOrdonnement,
      tauxPaiement: g.tauxPaiement,
    }))
    const totProjCP = ordByProjet.reduce((s, p) => s + p.cp, 0)
    const totProjOrdRep = ordByProjet.reduce((s, p) => s + p.ordReports, 0)
    const totProjOrdCons = ordByProjet.reduce((s, p) => s + p.ordConsolides, 0)
    const totProjOrdNouv = ordByProjet.reduce((s, p) => s + p.ordNouveaux, 0)
    const totProjOrd = ordByProjet.reduce((s, p) => s + p.ord, 0)
    const totProjPaiements = ordByProjet.reduce((s, p) => s + p.paiements, 0)

    // Ordonnancement par Entité
    const ordByEntity = analysisByEntity.map(e => ({
      name: e.name,
      cp: e.cp,
      ordReports: e.ordReports,
      ordConsolides: e.ordConsolides,
      ordNouveaux: e.ordNouveaux,
      ord: e.ord,
      paiements: e.paiements,
      tauxOrdonnement: e.tauxOrdonnement,
      tauxPaiement: e.tauxPaiement,
    }))
    const totEntCP = ordByEntity.reduce((s, e) => s + e.cp, 0)
    const totEntOrdRep = ordByEntity.reduce((s, e) => s + e.ordReports, 0)
    const totEntOrdCons = ordByEntity.reduce((s, e) => s + e.ordConsolides, 0)
    const totEntOrdNouv = ordByEntity.reduce((s, e) => s + e.ordNouveaux, 0)
    const totEntOrd = ordByEntity.reduce((s, e) => s + e.ord, 0)
    const totEntPaiements = ordByEntity.reduce((s, e) => s + e.paiements, 0)

    return (
      <>
        {/* ═══════════ TABLEAU 1 : ORDONNANCEMENT PAR PROGRAMME ═══════════ */}
        <Card className="border border-gray-100 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold text-gray-800 tracking-wide uppercase">Ordonnancement par programme <span className="text-gray-400 font-normal">(MDh)</span></CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-indigo-50/60">
                    <TableHead className="text-xs font-bold text-indigo-700" rowSpan={2}>Programme</TableHead>
                    <TableHead className="text-xs font-bold text-indigo-700 text-right" rowSpan={2}>Total CP</TableHead>
                    <TableHead className="text-xs font-bold text-center text-rose-600" colSpan={4}>Ordonnancements</TableHead>
                    <TableHead className="text-xs font-bold text-indigo-700 text-right" rowSpan={2}>Taux ord.</TableHead>
                    <TableHead className="text-xs font-bold text-center text-cyan-600" colSpan={2}>Paiements</TableHead>
                  </TableRow>
                  <TableRow className="bg-indigo-50/40">
                    <TableHead className="text-[10px] font-bold text-rose-500 text-right">Rep.</TableHead>
                    <TableHead className="text-[10px] font-bold text-rose-500 text-right">Cons.</TableHead>
                    <TableHead className="text-[10px] font-bold text-rose-500 text-right">Nouv.</TableHead>
                    <TableHead className="text-[10px] font-bold text-rose-500 text-right">Total</TableHead>
                    <TableHead className="text-[10px] font-bold text-cyan-500 text-right">Montant</TableHead>
                    <TableHead className="text-[10px] font-bold text-cyan-500 text-right">Taux paiem.</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ordByProgramme.map(p => (
                    <TableRow key={p.name} className="hover:bg-gray-50">
                      <TableCell className="text-xs font-medium text-gray-900">{p.name}</TableCell>
                      <TableCell className="text-xs text-gray-700 text-right">{formatMillions(p.cp)}</TableCell>
                      <TableCell className="text-xs text-rose-600 text-right">{formatMillions(p.ordReports)}</TableCell>
                      <TableCell className="text-xs text-rose-600 text-right">{formatMillions(p.ordConsolides)}</TableCell>
                      <TableCell className="text-xs text-rose-600 text-right">{formatMillions(p.ordNouveaux)}</TableCell>
                      <TableCell className="text-xs font-bold text-rose-700 text-right">{formatMillions(p.ord)}</TableCell>
                      <TableCell className="text-xs text-right"><span className={tauxColor(p.tauxOrdonnement)}>{formatPercent(p.tauxOrdonnement)}</span></TableCell>
                      <TableCell className="text-xs text-cyan-700 text-right font-medium">{formatMillions(p.paiements)}</TableCell>
                      <TableCell className="text-xs text-right"><span className={tauxColor(p.tauxPaiement)}>{formatPercent(p.tauxPaiement)}</span></TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-indigo-50/40 font-bold-total">
                    <TableCell className="text-xs font-bold text-gray-900">Total</TableCell>
                    <TableCell className="text-xs font-bold text-gray-900 text-right">{formatMillions(totProgCP)}</TableCell>
                    <TableCell className="text-xs font-bold text-rose-700 text-right">{formatMillions(totProgOrdRep)}</TableCell>
                    <TableCell className="text-xs font-bold text-rose-700 text-right">{formatMillions(totProgOrdCons)}</TableCell>
                    <TableCell className="text-xs font-bold text-rose-700 text-right">{formatMillions(totProgOrdNouv)}</TableCell>
                    <TableCell className="text-xs font-bold text-rose-700 text-right">{formatMillions(totProgOrd)}</TableCell>
                    <TableCell className="text-xs font-bold text-right"><span className={tauxColor(totProgCP > 0 ? (totProgOrd / totProgCP) * 100 : 0)}>{formatPercent(totProgCP > 0 ? (totProgOrd / totProgCP) * 100 : 0)}</span></TableCell>
                    <TableCell className="text-xs font-bold text-cyan-700 text-right">{formatMillions(totProgPaiements)}</TableCell>
                    <TableCell className="text-xs font-bold text-right"><span className={tauxColor(totProgCP > 0 ? (totProgPaiements / totProgCP) * 100 : 0)}>{formatPercent(totProgCP > 0 ? (totProgPaiements / totProgCP) * 100 : 0)}</span></TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* ═══════════ TABLEAU 2 : ORDONNANCEMENT PAR PROJET ═══════════ */}
        <Card className="border border-gray-100 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold text-gray-800 tracking-wide uppercase">Ordonnancement par projet <span className="text-gray-400 font-normal">(MDh)</span></CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-emerald-50/60">
                    <TableHead className="text-xs font-bold text-emerald-700" rowSpan={2}>Projet</TableHead>
                    <TableHead className="text-xs font-bold text-emerald-700 text-right" rowSpan={2}>Total CP</TableHead>
                    <TableHead className="text-xs font-bold text-center text-rose-600" colSpan={4}>Ordonnancements</TableHead>
                    <TableHead className="text-xs font-bold text-emerald-700 text-right" rowSpan={2}>Taux ord.</TableHead>
                    <TableHead className="text-xs font-bold text-center text-cyan-600" colSpan={2}>Paiements</TableHead>
                  </TableRow>
                  <TableRow className="bg-emerald-50/40">
                    <TableHead className="text-[10px] font-bold text-rose-500 text-right">Rep.</TableHead>
                    <TableHead className="text-[10px] font-bold text-rose-500 text-right">Cons.</TableHead>
                    <TableHead className="text-[10px] font-bold text-rose-500 text-right">Nouv.</TableHead>
                    <TableHead className="text-[10px] font-bold text-rose-500 text-right">Total</TableHead>
                    <TableHead className="text-[10px] font-bold text-cyan-500 text-right">Montant</TableHead>
                    <TableHead className="text-[10px] font-bold text-cyan-500 text-right">Taux paiem.</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ordByProjet.map(p => (
                    <TableRow key={p.name} className="hover:bg-gray-50">
                      <TableCell className="text-xs font-medium text-gray-900">{p.name}</TableCell>
                      <TableCell className="text-xs text-gray-700 text-right">{formatMillions(p.cp)}</TableCell>
                      <TableCell className="text-xs text-rose-600 text-right">{formatMillions(p.ordReports)}</TableCell>
                      <TableCell className="text-xs text-rose-600 text-right">{formatMillions(p.ordConsolides)}</TableCell>
                      <TableCell className="text-xs text-rose-600 text-right">{formatMillions(p.ordNouveaux)}</TableCell>
                      <TableCell className="text-xs font-bold text-rose-700 text-right">{formatMillions(p.ord)}</TableCell>
                      <TableCell className="text-xs text-right"><span className={tauxColor(p.tauxOrdonnement)}>{formatPercent(p.tauxOrdonnement)}</span></TableCell>
                      <TableCell className="text-xs text-cyan-700 text-right font-medium">{formatMillions(p.paiements)}</TableCell>
                      <TableCell className="text-xs text-right"><span className={tauxColor(p.tauxPaiement)}>{formatPercent(p.tauxPaiement)}</span></TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-emerald-50/40 font-bold-total">
                    <TableCell className="text-xs font-bold text-gray-900">Total</TableCell>
                    <TableCell className="text-xs font-bold text-gray-900 text-right">{formatMillions(totProjCP)}</TableCell>
                    <TableCell className="text-xs font-bold text-rose-700 text-right">{formatMillions(totProjOrdRep)}</TableCell>
                    <TableCell className="text-xs font-bold text-rose-700 text-right">{formatMillions(totProjOrdCons)}</TableCell>
                    <TableCell className="text-xs font-bold text-rose-700 text-right">{formatMillions(totProjOrdNouv)}</TableCell>
                    <TableCell className="text-xs font-bold text-rose-700 text-right">{formatMillions(totProjOrd)}</TableCell>
                    <TableCell className="text-xs font-bold text-right"><span className={tauxColor(totProjCP > 0 ? (totProjOrd / totProjCP) * 100 : 0)}>{formatPercent(totProjCP > 0 ? (totProjOrd / totProjCP) * 100 : 0)}</span></TableCell>
                    <TableCell className="text-xs font-bold text-cyan-700 text-right">{formatMillions(totProjPaiements)}</TableCell>
                    <TableCell className="text-xs font-bold text-right"><span className={tauxColor(totProjCP > 0 ? (totProjPaiements / totProjCP) * 100 : 0)}>{formatPercent(totProjCP > 0 ? (totProjPaiements / totProjCP) * 100 : 0)}</span></TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* ═══════════ TABLEAU 3 : ORDONNANCEMENT PAR ENTITÉ ═══════════ */}
        <Card className="border border-gray-100 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold text-gray-800 tracking-wide uppercase">Ordonnancement par entité <span className="text-gray-400 font-normal">(MDh)</span></CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/60">
                    <TableHead className="text-xs font-bold text-slate-700" rowSpan={2}>Entité</TableHead>
                    <TableHead className="text-xs font-bold text-slate-700 text-right" rowSpan={2}>Total CP</TableHead>
                    <TableHead className="text-xs font-bold text-center text-rose-600" colSpan={4}>Ordonnancements</TableHead>
                    <TableHead className="text-xs font-bold text-slate-700 text-right" rowSpan={2}>Taux ord.</TableHead>
                    <TableHead className="text-xs font-bold text-center text-cyan-600" colSpan={2}>Paiements</TableHead>
                  </TableRow>
                  <TableRow className="bg-slate-50/40">
                    <TableHead className="text-[10px] font-bold text-rose-500 text-right">Rep.</TableHead>
                    <TableHead className="text-[10px] font-bold text-rose-500 text-right">Cons.</TableHead>
                    <TableHead className="text-[10px] font-bold text-rose-500 text-right">Nouv.</TableHead>
                    <TableHead className="text-[10px] font-bold text-rose-500 text-right">Total</TableHead>
                    <TableHead className="text-[10px] font-bold text-cyan-500 text-right">Montant</TableHead>
                    <TableHead className="text-[10px] font-bold text-cyan-500 text-right">Taux paiem.</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ordByEntity.map(e => (
                    <TableRow key={e.name} className="hover:bg-gray-50">
                      <TableCell className="text-xs font-medium text-gray-900">{e.name}</TableCell>
                      <TableCell className="text-xs text-gray-700 text-right">{formatMillions(e.cp)}</TableCell>
                      <TableCell className="text-xs text-rose-600 text-right">{formatMillions(e.ordReports)}</TableCell>
                      <TableCell className="text-xs text-rose-600 text-right">{formatMillions(e.ordConsolides)}</TableCell>
                      <TableCell className="text-xs text-rose-600 text-right">{formatMillions(e.ordNouveaux)}</TableCell>
                      <TableCell className="text-xs font-bold text-rose-700 text-right">{formatMillions(e.ord)}</TableCell>
                      <TableCell className="text-xs text-right"><span className={tauxColor(e.tauxOrdonnement)}>{formatPercent(e.tauxOrdonnement)}</span></TableCell>
                      <TableCell className="text-xs text-cyan-700 text-right font-medium">{formatMillions(e.paiements)}</TableCell>
                      <TableCell className="text-xs text-right"><span className={tauxColor(e.tauxPaiement)}>{formatPercent(e.tauxPaiement)}</span></TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-slate-50/40 font-bold-total">
                    <TableCell className="text-xs font-bold text-gray-900">Total</TableCell>
                    <TableCell className="text-xs font-bold text-gray-900 text-right">{formatMillions(totEntCP)}</TableCell>
                    <TableCell className="text-xs font-bold text-rose-700 text-right">{formatMillions(totEntOrdRep)}</TableCell>
                    <TableCell className="text-xs font-bold text-rose-700 text-right">{formatMillions(totEntOrdCons)}</TableCell>
                    <TableCell className="text-xs font-bold text-rose-700 text-right">{formatMillions(totEntOrdNouv)}</TableCell>
                    <TableCell className="text-xs font-bold text-rose-700 text-right">{formatMillions(totEntOrd)}</TableCell>
                    <TableCell className="text-xs font-bold text-right"><span className={tauxColor(totEntCP > 0 ? (totEntOrd / totEntCP) * 100 : 0)}>{formatPercent(totEntCP > 0 ? (totEntOrd / totEntCP) * 100 : 0)}</span></TableCell>
                    <TableCell className="text-xs font-bold text-cyan-700 text-right">{formatMillions(totEntPaiements)}</TableCell>
                    <TableCell className="text-xs font-bold text-right"><span className={tauxColor(totEntCP > 0 ? (totEntPaiements / totEntCP) * 100 : 0)}>{formatPercent(totEntCP > 0 ? (totEntPaiements / totEntCP) * 100 : 0)}</span></TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Détail des ordonnancements */}
        <Card className="border border-gray-100 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold text-gray-800 tracking-wide uppercase">Détail des ordonnancements <span className="text-gray-400 font-normal">(MDh)</span></CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-emerald-50/60">
                    <TableHead className="text-xs font-bold text-emerald-700" rowSpan={2}>Projet</TableHead>
                    <TableHead className="text-xs font-bold text-emerald-700" rowSpan={2}>Entité</TableHead>
                    <TableHead className="text-xs font-bold text-emerald-700" rowSpan={2}>Nomenclature</TableHead>
                    <TableHead className="text-xs font-bold text-emerald-700" rowSpan={2}>N° Engagement</TableHead>
                    <TableHead className="text-xs font-bold text-emerald-700" rowSpan={2}>Désignation</TableHead>
                    <TableHead className="text-xs font-bold text-emerald-700 text-right" rowSpan={2}>Total CP</TableHead>
                    <TableHead className="text-xs font-bold text-center text-rose-600" colSpan={4}>Ordonnancements</TableHead>
                    <TableHead className="text-xs font-bold text-emerald-700 text-right" rowSpan={2}>Taux ord.</TableHead>
                    <TableHead className="text-xs font-bold text-center text-cyan-600" colSpan={2}>Paiements</TableHead>
                  </TableRow>
                  <TableRow className="bg-emerald-50/40">
                    <TableHead className="text-[10px] font-bold text-rose-500 text-right">Rep.</TableHead>
                    <TableHead className="text-[10px] font-bold text-rose-500 text-right">Cons.</TableHead>
                    <TableHead className="text-[10px] font-bold text-rose-500 text-right">Nouv.</TableHead>
                    <TableHead className="text-[10px] font-bold text-rose-500 text-right">Total</TableHead>
                    <TableHead className="text-[10px] font-bold text-cyan-500 text-right">Montant</TableHead>
                    <TableHead className="text-[10px] font-bold text-cyan-500 text-right">Taux paiem.</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(() => {
                    let currentProjet = ''
                    const totCP = filteredData.reduce((s, r) => s + (r['TOTAL CP'] || 0), 0)
                    const totOrdRep = ordonnancementLines.reduce((s, r) => s + r.ordReports, 0)
                    const totOrdCons = ordonnancementLines.reduce((s, r) => s + r.ordConsolides, 0)
                    const totOrdNouv = ordonnancementLines.reduce((s, r) => s + r.ordNouveaux, 0)
                    const totOrdTotal = ordonnancementLines.reduce((s, r) => s + r.ordTotal, 0)
                    return (
                      <>
                        {ordonnancementLines.map((r, idx) => {
                          const showProjetHeader = (r.projet || 'Non classé') !== currentProjet
                          currentProjet = r.projet || 'Non classé'
                          return (
                            <TableRow key={`${r.numEngagement}-${idx}`} className={`hover:bg-gray-50 ${showProjetHeader && idx > 0 ? 'border-t-2 border-emerald-200' : ''}`}>
                              <TableCell className="text-xs font-medium text-gray-900 whitespace-nowrap">{r.projet || 'Non classé'}</TableCell>
                              <TableCell className="text-xs text-gray-600">{r.entite}</TableCell>
                              <TableCell className="text-xs text-emerald-600 font-mono whitespace-nowrap">{r.nomenclature}</TableCell>
                              <TableCell className="text-xs font-medium text-gray-900">{r.numEngagement}</TableCell>
                              <TableCell className="text-xs text-gray-700" style={{minWidth:'250px',maxWidth:'400px',whiteSpace:'normal',lineHeight:'1.4'}}>{r.designation}</TableCell>
                              <TableCell className="text-xs text-gray-700 text-right">{formatMillions(r.cp)}</TableCell>
                              <TableCell className="text-xs text-rose-600 text-right">{formatMillions(r.ordReports)}</TableCell>
                              <TableCell className="text-xs text-rose-600 text-right">{formatMillions(r.ordConsolides)}</TableCell>
                              <TableCell className="text-xs text-rose-600 text-right">{formatMillions(r.ordNouveaux)}</TableCell>
                              <TableCell className="text-xs font-bold text-rose-700 text-right">{formatMillions(r.ordTotal)}</TableCell>
                              <TableCell className="text-xs text-right">
                                <span className={tauxColor(r.tauxOrdonnement)}>{formatPercent(r.tauxOrdonnement)}</span>
                              </TableCell>
                              <TableCell className="text-xs text-cyan-700 text-right font-medium">{formatMillions(r.paiements)}</TableCell>
                              <TableCell className="text-xs text-right">
                                <span className={tauxColor(r.tauxPaiement)}>{formatPercent(r.tauxPaiement)}</span>
                              </TableCell>
                            </TableRow>
                          )
                        })}
                        <TableRow className="bg-emerald-50/40 font-bold-total">
                          <TableCell className="text-xs font-bold text-gray-900" colSpan={5}>Total ({ordonnancementLines.length} prestations)</TableCell>
                          <TableCell className="text-xs font-bold text-gray-900 text-right">{formatMillions(totCP)}</TableCell>
                          <TableCell className="text-xs font-bold text-rose-700 text-right">{formatMillions(totOrdRep)}</TableCell>
                          <TableCell className="text-xs font-bold text-rose-700 text-right">{formatMillions(totOrdCons)}</TableCell>
                          <TableCell className="text-xs font-bold text-rose-700 text-right">{formatMillions(totOrdNouv)}</TableCell>
                          <TableCell className="text-xs font-bold text-rose-700 text-right">{formatMillions(totOrdTotal)}</TableCell>
                          <TableCell className="text-xs font-bold text-right">
                            <span className={tauxColor(totCP > 0 ? (totOrdTotal / totCP) * 100 : 0)}>{formatPercent(totCP > 0 ? (totOrdTotal / totCP) * 100 : 0)}</span>
                          </TableCell>
                          <TableCell className="text-xs font-bold text-cyan-700 text-right">{formatMillions(ordonnancementLines.reduce((s, r) => s + r.paiements, 0))}</TableCell>
                          <TableCell className="text-xs font-bold text-right">
                            <span className={tauxColor(totCP > 0 ? (ordonnancementLines.reduce((s, r) => s + r.paiements, 0) / totCP) * 100 : 0)}>{formatPercent(totCP > 0 ? (ordonnancementLines.reduce((s, r) => s + r.paiements, 0) / totCP) * 100 : 0)}</span>
                          </TableCell>
                        </TableRow>
                      </>
                    )
                  })()}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

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
            
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total CP */}
            <div className="kpi-card-premium bg-white rounded-xl border border-gray-100 overflow-hidden cursor-default">
              <div className="h-1.5 bg-gradient-to-r from-blue-400 to-blue-600" />
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="kpi-icon-wrap w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center transition-transform">
                    <Scale className="w-5 h-5 text-blue-600" />
                  </div>
                  <Badge className="bg-blue-50 text-blue-700 border-blue-200 text-[10px] font-bold rounded-full px-2.5">Budget</Badge>
                </div>
                <p className="text-2xl font-black text-gray-900 tracking-tight">{formatMillions(kpis.totalCP)}</p>
                <p className="text-[11px] text-gray-400 mt-1.5 font-medium">Total CP</p>
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
                  <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] font-bold rounded-full px-2.5">Eng.</Badge>
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
                  <Badge className="bg-blue-50 text-blue-700 border-blue-200 text-[10px] font-bold rounded-full px-2.5">Ord.</Badge>
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
                  <Badge className="bg-violet-50 text-violet-700 border-violet-200 text-[10px] font-bold rounded-full px-2.5">Reste</Badge>
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
            <CardTitle className="text-sm font-bold text-gray-800 tracking-wide uppercase">Résumé comparatif par entité</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="text-xs font-bold text-gray-600">entité</TableHead>
                    <TableHead className="text-xs font-bold text-gray-600 text-right">Budget</TableHead>
                    <TableHead className="text-xs font-bold text-gray-600 text-right">Engagements</TableHead>
                    <TableHead className="text-xs font-bold text-gray-600 text-right">Taux eng.</TableHead>
                    <TableHead className="text-xs font-bold text-gray-600 text-right">Ordonnancements</TableHead>
                    <TableHead className="text-xs font-bold text-gray-600 text-right">Taux ord.</TableHead>
                    <TableHead className="text-xs font-bold text-gray-600 text-right">Paiements</TableHead>
                    <TableHead className="text-xs font-bold text-gray-600 text-right">Taux paiement</TableHead>
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
                      <TableCell className="text-xs text-gray-700 text-right">{formatMillions(e.paiements)}</TableCell>
                      <TableCell className="text-xs text-right">
                        <span className={tauxColor(e.tauxPaiement)}>{formatPercent(e.tauxPaiement)}</span>
                      </TableCell>
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
            <CardTitle className="text-sm font-bold text-gray-800 tracking-wide uppercase flex items-center gap-2">
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
                    label={({ name, percent, value }: { name: string; percent: number; value: number }) => `${name} ${value.toLocaleString('fr-FR', { minimumFractionDigits: 1 })} (${(percent * 100).toFixed(1)}%)`}
                  >
                    {budgetStructureData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => `${value.toLocaleString('fr-FR', { minimumFractionDigits: 1 })}`} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-3">
                {budgetStructureData.map((item, idx) => (
                  <div key={item.name} className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }} />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{item.name}</p>
                      <p className="text-xs text-gray-500">{item.value.toLocaleString('fr-FR', { minimumFractionDigits: 1 })}</p>
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
            <CardTitle className="text-sm font-bold text-gray-800 tracking-wide uppercase">Source de financement</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="text-xs font-bold text-gray-600">Source</TableHead>
                    <TableHead className="text-xs font-bold text-gray-600 text-right">Budget (LFI)</TableHead>
                    <TableHead className="text-xs font-bold text-gray-600 text-right">Engagements</TableHead>
                    <TableHead className="text-xs font-bold text-gray-600 text-right">Taux eng.</TableHead>
                    <TableHead className="text-xs font-bold text-gray-600 text-right">Ordonnancements</TableHead>
                    <TableHead className="text-xs font-bold text-gray-600 text-right">Taux ord.</TableHead>
                    <TableHead className="text-xs font-bold text-gray-600 text-right">Nb lignes</TableHead>
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
        <h2 className="text-lg font-bold text-gray-900 tracking-wide uppercase">Paramètres</h2>

        {/* Auto-refresh */}
        <Card className="border border-gray-100 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold text-gray-800 tracking-wide uppercase flex items-center gap-2">
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
            <CardTitle className="text-sm font-bold text-gray-800 tracking-wide uppercase flex items-center gap-2">
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
                  <SelectItem value="millions">Millions</SelectItem>
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
            <CardTitle className="text-sm font-bold text-gray-800 tracking-wide uppercase flex items-center gap-2">
              <Database className="w-4 h-4" />
              Gestion des données
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isAdmin ? (
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
            ) : (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">Importation réservée à l'administrateur</p>
                <p className="text-xs text-gray-500">Seul l'administrateur peut importer des fichiers Excel</p>
              </div>
            </div>
            )}
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
            <CardTitle className="text-sm font-bold text-gray-800 tracking-wide uppercase">À propos</CardTitle>
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

  const renderPrevisionsView = () => {
    return (
      <>
        {/* ═══════════ SECTION 1 : PRÉVISIONS PAR PROGRAMME ═══════════ */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-1 h-5 rounded-full bg-gradient-to-b from-blue-500 to-indigo-600" />
            <h3 className="text-sm font-bold text-gray-800 tracking-wide uppercase">Prévisions d'ordonnancement cumulées</h3>
          </div>
        </div>

        {/* Prévisions par Programme */}
        <Card className="border border-gray-100 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold text-gray-800 tracking-wide uppercase">Prévisions cumulées par programme <span className="text-gray-400 font-normal">(MDh)</span></CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-blue-50/60">
                    <TableHead className="text-xs font-bold text-blue-700">Programme</TableHead>
                    <TableHead className="text-xs font-bold text-blue-700 text-right">Total CP</TableHead>
                    <TableHead className="text-xs font-bold text-blue-700 text-right">Prév. Fin Juin</TableHead>
                    <TableHead className="text-xs font-bold text-blue-700 text-right">Taux Juin</TableHead>
                    <TableHead className="text-xs font-bold text-blue-700 text-right">Prév. Fin Sept.</TableHead>
                    <TableHead className="text-xs font-bold text-blue-700 text-right">Taux Sept.</TableHead>
                    <TableHead className="text-xs font-bold text-blue-700 text-right">Prév. Fin Oct.</TableHead>
                    <TableHead className="text-xs font-bold text-blue-700 text-right">Taux Oct.</TableHead>
                    <TableHead className="text-xs font-bold text-blue-700 text-right">Prév. Fin Nov.</TableHead>
                    <TableHead className="text-xs font-bold text-blue-700 text-right">Taux Nov.</TableHead>
                    <TableHead className="text-xs font-bold text-blue-700 text-right">Prév. Fin Déc.</TableHead>
                    <TableHead className="text-xs font-bold text-blue-700 text-right">Taux Déc.</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(() => {
                    const data = analysisByProgramme.sort((a, b) => b.cumulPrevDecembre - a.cumulPrevDecembre)
                    const totCP = data.reduce((s, p) => s + p.cp, 0)
                    const totJuin = data.reduce((s, p) => s + p.cumulPrevJuin, 0)
                    const totSept = data.reduce((s, p) => s + p.cumulPrevSeptembre, 0)
                    const totOct = data.reduce((s, p) => s + p.cumulPrevOctobre, 0)
                    const totNov = data.reduce((s, p) => s + p.cumulPrevNovembre, 0)
                    const totDec = data.reduce((s, p) => s + p.cumulPrevDecembre, 0)
                    return (
                      <>
                        {data.map(p => (
                          <TableRow key={p.name} className="hover:bg-gray-50">
                            <TableCell className="text-xs font-medium text-gray-900">{p.name}</TableCell>
                            <TableCell className="text-xs text-gray-700 text-right">{formatMillions(p.cp)}</TableCell>
                            <TableCell className="text-xs text-gray-700 text-right">{formatMillions(p.cumulPrevJuin)}</TableCell>
                            <TableCell className="text-xs text-right"><span className={tauxColor(p.cp > 0 ? (p.cumulPrevJuin / p.cp) * 100 : 0)}>{formatPercent(p.cp > 0 ? (p.cumulPrevJuin / p.cp) * 100 : 0)}</span></TableCell>
                            <TableCell className="text-xs text-gray-700 text-right">{formatMillions(p.cumulPrevSeptembre)}</TableCell>
                            <TableCell className="text-xs text-right"><span className={tauxColor(p.cp > 0 ? (p.cumulPrevSeptembre / p.cp) * 100 : 0)}>{formatPercent(p.cp > 0 ? (p.cumulPrevSeptembre / p.cp) * 100 : 0)}</span></TableCell>
                            <TableCell className="text-xs text-gray-700 text-right">{formatMillions(p.cumulPrevOctobre)}</TableCell>
                            <TableCell className="text-xs text-right"><span className={tauxColor(p.cp > 0 ? (p.cumulPrevOctobre / p.cp) * 100 : 0)}>{formatPercent(p.cp > 0 ? (p.cumulPrevOctobre / p.cp) * 100 : 0)}</span></TableCell>
                            <TableCell className="text-xs text-gray-700 text-right">{formatMillions(p.cumulPrevNovembre)}</TableCell>
                            <TableCell className="text-xs text-right"><span className={tauxColor(p.cp > 0 ? (p.cumulPrevNovembre / p.cp) * 100 : 0)}>{formatPercent(p.cp > 0 ? (p.cumulPrevNovembre / p.cp) * 100 : 0)}</span></TableCell>
                            <TableCell className="text-xs text-gray-700 text-right">{formatMillions(p.cumulPrevDecembre)}</TableCell>
                            <TableCell className="text-xs text-right"><span className={tauxColor(p.cp > 0 ? (p.cumulPrevDecembre / p.cp) * 100 : 0)}>{formatPercent(p.cp > 0 ? (p.cumulPrevDecembre / p.cp) * 100 : 0)}</span></TableCell>
                          </TableRow>
                        ))}
                        <TableRow className="bg-blue-50/40 font-bold-total">
                          <TableCell className="text-xs font-bold text-gray-900">Total</TableCell>
                          <TableCell className="text-xs font-bold text-gray-900 text-right">{formatMillions(totCP)}</TableCell>
                          <TableCell className="text-xs font-bold text-gray-900 text-right">{formatMillions(totJuin)}</TableCell>
                          <TableCell className="text-xs font-bold text-right"><span className={tauxColor(totCP > 0 ? (totJuin / totCP) * 100 : 0)}>{formatPercent(totCP > 0 ? (totJuin / totCP) * 100 : 0)}</span></TableCell>
                          <TableCell className="text-xs font-bold text-gray-900 text-right">{formatMillions(totSept)}</TableCell>
                          <TableCell className="text-xs font-bold text-right"><span className={tauxColor(totCP > 0 ? (totSept / totCP) * 100 : 0)}>{formatPercent(totCP > 0 ? (totSept / totCP) * 100 : 0)}</span></TableCell>
                          <TableCell className="text-xs font-bold text-gray-900 text-right">{formatMillions(totOct)}</TableCell>
                          <TableCell className="text-xs font-bold text-right"><span className={tauxColor(totCP > 0 ? (totOct / totCP) * 100 : 0)}>{formatPercent(totCP > 0 ? (totOct / totCP) * 100 : 0)}</span></TableCell>
                          <TableCell className="text-xs font-bold text-gray-900 text-right">{formatMillions(totNov)}</TableCell>
                          <TableCell className="text-xs font-bold text-right"><span className={tauxColor(totCP > 0 ? (totNov / totCP) * 100 : 0)}>{formatPercent(totCP > 0 ? (totNov / totCP) * 100 : 0)}</span></TableCell>
                          <TableCell className="text-xs font-bold text-gray-900 text-right">{formatMillions(totDec)}</TableCell>
                          <TableCell className="text-xs font-bold text-right"><span className={tauxColor(totCP > 0 ? (totDec / totCP) * 100 : 0)}>{formatPercent(totCP > 0 ? (totDec / totCP) * 100 : 0)}</span></TableCell>
                        </TableRow>
                      </>
                    )
                  })()}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Prévisions par Projet */}
        <Card className="border border-gray-100 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold text-gray-800 tracking-wide uppercase">Prévisions cumulées par projet <span className="text-gray-400 font-normal">(MDh)</span></CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-teal-50/60">
                    <TableHead className="text-xs font-bold text-teal-700">Projet</TableHead>
                    <TableHead className="text-xs font-bold text-teal-700 text-right">Total CP</TableHead>
                    <TableHead className="text-xs font-bold text-teal-700 text-right">Prév. Fin Juin</TableHead>
                    <TableHead className="text-xs font-bold text-teal-700 text-right">Taux Juin</TableHead>
                    <TableHead className="text-xs font-bold text-teal-700 text-right">Prév. Fin Sept.</TableHead>
                    <TableHead className="text-xs font-bold text-teal-700 text-right">Taux Sept.</TableHead>
                    <TableHead className="text-xs font-bold text-teal-700 text-right">Prév. Fin Oct.</TableHead>
                    <TableHead className="text-xs font-bold text-teal-700 text-right">Taux Oct.</TableHead>
                    <TableHead className="text-xs font-bold text-teal-700 text-right">Prév. Fin Nov.</TableHead>
                    <TableHead className="text-xs font-bold text-teal-700 text-right">Taux Nov.</TableHead>
                    <TableHead className="text-xs font-bold text-teal-700 text-right">Prév. Fin Déc.</TableHead>
                    <TableHead className="text-xs font-bold text-teal-700 text-right">Taux Déc.</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(() => {
                    const data = analysisByGroup.sort((a, b) => b.cumulPrevDecembre - a.cumulPrevDecembre)
                    const totCP = data.reduce((s, g) => s + g.cp, 0)
                    const totJuin = data.reduce((s, g) => s + g.cumulPrevJuin, 0)
                    const totSept = data.reduce((s, g) => s + g.cumulPrevSeptembre, 0)
                    const totOct = data.reduce((s, g) => s + g.cumulPrevOctobre, 0)
                    const totNov = data.reduce((s, g) => s + g.cumulPrevNovembre, 0)
                    const totDec = data.reduce((s, g) => s + g.cumulPrevDecembre, 0)
                    return (
                      <>
                        {data.map(g => (
                          <TableRow key={g.name} className="hover:bg-gray-50">
                            <TableCell className="text-xs font-medium text-gray-900">{g.name}</TableCell>
                            <TableCell className="text-xs text-gray-700 text-right">{formatMillions(g.cp)}</TableCell>
                            <TableCell className="text-xs text-gray-700 text-right">{formatMillions(g.cumulPrevJuin)}</TableCell>
                            <TableCell className="text-xs text-right"><span className={tauxColor(g.cp > 0 ? (g.cumulPrevJuin / g.cp) * 100 : 0)}>{formatPercent(g.cp > 0 ? (g.cumulPrevJuin / g.cp) * 100 : 0)}</span></TableCell>
                            <TableCell className="text-xs text-gray-700 text-right">{formatMillions(g.cumulPrevSeptembre)}</TableCell>
                            <TableCell className="text-xs text-right"><span className={tauxColor(g.cp > 0 ? (g.cumulPrevSeptembre / g.cp) * 100 : 0)}>{formatPercent(g.cp > 0 ? (g.cumulPrevSeptembre / g.cp) * 100 : 0)}</span></TableCell>
                            <TableCell className="text-xs text-gray-700 text-right">{formatMillions(g.cumulPrevOctobre)}</TableCell>
                            <TableCell className="text-xs text-right"><span className={tauxColor(g.cp > 0 ? (g.cumulPrevOctobre / g.cp) * 100 : 0)}>{formatPercent(g.cp > 0 ? (g.cumulPrevOctobre / g.cp) * 100 : 0)}</span></TableCell>
                            <TableCell className="text-xs text-gray-700 text-right">{formatMillions(g.cumulPrevNovembre)}</TableCell>
                            <TableCell className="text-xs text-right"><span className={tauxColor(g.cp > 0 ? (g.cumulPrevNovembre / g.cp) * 100 : 0)}>{formatPercent(g.cp > 0 ? (g.cumulPrevNovembre / g.cp) * 100 : 0)}</span></TableCell>
                            <TableCell className="text-xs text-gray-700 text-right">{formatMillions(g.cumulPrevDecembre)}</TableCell>
                            <TableCell className="text-xs text-right"><span className={tauxColor(g.cp > 0 ? (g.cumulPrevDecembre / g.cp) * 100 : 0)}>{formatPercent(g.cp > 0 ? (g.cumulPrevDecembre / g.cp) * 100 : 0)}</span></TableCell>
                          </TableRow>
                        ))}
                        <TableRow className="bg-teal-50/40 font-bold-total">
                          <TableCell className="text-xs font-bold text-gray-900">Total</TableCell>
                          <TableCell className="text-xs font-bold text-gray-900 text-right">{formatMillions(totCP)}</TableCell>
                          <TableCell className="text-xs font-bold text-gray-900 text-right">{formatMillions(totJuin)}</TableCell>
                          <TableCell className="text-xs font-bold text-right"><span className={tauxColor(totCP > 0 ? (totJuin / totCP) * 100 : 0)}>{formatPercent(totCP > 0 ? (totJuin / totCP) * 100 : 0)}</span></TableCell>
                          <TableCell className="text-xs font-bold text-gray-900 text-right">{formatMillions(totSept)}</TableCell>
                          <TableCell className="text-xs font-bold text-right"><span className={tauxColor(totCP > 0 ? (totSept / totCP) * 100 : 0)}>{formatPercent(totCP > 0 ? (totSept / totCP) * 100 : 0)}</span></TableCell>
                          <TableCell className="text-xs font-bold text-gray-900 text-right">{formatMillions(totOct)}</TableCell>
                          <TableCell className="text-xs font-bold text-right"><span className={tauxColor(totCP > 0 ? (totOct / totCP) * 100 : 0)}>{formatPercent(totCP > 0 ? (totOct / totCP) * 100 : 0)}</span></TableCell>
                          <TableCell className="text-xs font-bold text-gray-900 text-right">{formatMillions(totNov)}</TableCell>
                          <TableCell className="text-xs font-bold text-right"><span className={tauxColor(totCP > 0 ? (totNov / totCP) * 100 : 0)}>{formatPercent(totCP > 0 ? (totNov / totCP) * 100 : 0)}</span></TableCell>
                          <TableCell className="text-xs font-bold text-gray-900 text-right">{formatMillions(totDec)}</TableCell>
                          <TableCell className="text-xs font-bold text-right"><span className={tauxColor(totCP > 0 ? (totDec / totCP) * 100 : 0)}>{formatPercent(totCP > 0 ? (totDec / totCP) * 100 : 0)}</span></TableCell>
                        </TableRow>
                      </>
                    )
                  })()}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Prévisions par Entité */}
        <Card className="border border-gray-100 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold text-gray-800 tracking-wide uppercase">Prévisions cumulées par entité <span className="text-gray-400 font-normal">(MDh)</span></CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-indigo-50/60">
                    <TableHead className="text-xs font-bold text-indigo-700">Entité</TableHead>
                    <TableHead className="text-xs font-bold text-indigo-700 text-right">Total CP</TableHead>
                    <TableHead className="text-xs font-bold text-indigo-700 text-right">Prév. Fin Juin</TableHead>
                    <TableHead className="text-xs font-bold text-indigo-700 text-right">Taux Juin</TableHead>
                    <TableHead className="text-xs font-bold text-indigo-700 text-right">Prév. Fin Sept.</TableHead>
                    <TableHead className="text-xs font-bold text-indigo-700 text-right">Taux Sept.</TableHead>
                    <TableHead className="text-xs font-bold text-indigo-700 text-right">Prév. Fin Oct.</TableHead>
                    <TableHead className="text-xs font-bold text-indigo-700 text-right">Taux Oct.</TableHead>
                    <TableHead className="text-xs font-bold text-indigo-700 text-right">Prév. Fin Nov.</TableHead>
                    <TableHead className="text-xs font-bold text-indigo-700 text-right">Taux Nov.</TableHead>
                    <TableHead className="text-xs font-bold text-indigo-700 text-right">Prév. Fin Déc.</TableHead>
                    <TableHead className="text-xs font-bold text-indigo-700 text-right">Taux Déc.</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(() => {
                    const data = [...analysisByEntity].sort((a, b) => b.cumulPrevDecembre - a.cumulPrevDecembre)
                    const totCP = data.reduce((s, e) => s + e.cp, 0)
                    const totJuin = data.reduce((s, e) => s + e.cumulPrevJuin, 0)
                    const totSept = data.reduce((s, e) => s + e.cumulPrevSeptembre, 0)
                    const totOct = data.reduce((s, e) => s + e.cumulPrevOctobre, 0)
                    const totNov = data.reduce((s, e) => s + e.cumulPrevNovembre, 0)
                    const totDec = data.reduce((s, e) => s + e.cumulPrevDecembre, 0)
                    return (
                      <>
                        {data.map(e => (
                          <TableRow key={e.name} className="hover:bg-gray-50">
                            <TableCell className="text-xs font-medium text-gray-900">{e.name}</TableCell>
                            <TableCell className="text-xs text-gray-700 text-right">{formatMillions(e.cp)}</TableCell>
                            <TableCell className="text-xs text-gray-700 text-right">{formatMillions(e.cumulPrevJuin)}</TableCell>
                            <TableCell className="text-xs text-right"><span className={tauxColor(e.cp > 0 ? (e.cumulPrevJuin / e.cp) * 100 : 0)}>{formatPercent(e.cp > 0 ? (e.cumulPrevJuin / e.cp) * 100 : 0)}</span></TableCell>
                            <TableCell className="text-xs text-gray-700 text-right">{formatMillions(e.cumulPrevSeptembre)}</TableCell>
                            <TableCell className="text-xs text-right"><span className={tauxColor(e.cp > 0 ? (e.cumulPrevSeptembre / e.cp) * 100 : 0)}>{formatPercent(e.cp > 0 ? (e.cumulPrevSeptembre / e.cp) * 100 : 0)}</span></TableCell>
                            <TableCell className="text-xs text-gray-700 text-right">{formatMillions(e.cumulPrevOctobre)}</TableCell>
                            <TableCell className="text-xs text-right"><span className={tauxColor(e.cp > 0 ? (e.cumulPrevOctobre / e.cp) * 100 : 0)}>{formatPercent(e.cp > 0 ? (e.cumulPrevOctobre / e.cp) * 100 : 0)}</span></TableCell>
                            <TableCell className="text-xs text-gray-700 text-right">{formatMillions(e.cumulPrevNovembre)}</TableCell>
                            <TableCell className="text-xs text-right"><span className={tauxColor(e.cp > 0 ? (e.cumulPrevNovembre / e.cp) * 100 : 0)}>{formatPercent(e.cp > 0 ? (e.cumulPrevNovembre / e.cp) * 100 : 0)}</span></TableCell>
                            <TableCell className="text-xs text-gray-700 text-right">{formatMillions(e.cumulPrevDecembre)}</TableCell>
                            <TableCell className="text-xs text-right"><span className={tauxColor(e.cp > 0 ? (e.cumulPrevDecembre / e.cp) * 100 : 0)}>{formatPercent(e.cp > 0 ? (e.cumulPrevDecembre / e.cp) * 100 : 0)}</span></TableCell>
                          </TableRow>
                        ))}
                        <TableRow className="bg-indigo-50/40 font-bold-total">
                          <TableCell className="text-xs font-bold text-gray-900">Total</TableCell>
                          <TableCell className="text-xs font-bold text-gray-900 text-right">{formatMillions(totCP)}</TableCell>
                          <TableCell className="text-xs font-bold text-gray-900 text-right">{formatMillions(totJuin)}</TableCell>
                          <TableCell className="text-xs font-bold text-right"><span className={tauxColor(totCP > 0 ? (totJuin / totCP) * 100 : 0)}>{formatPercent(totCP > 0 ? (totJuin / totCP) * 100 : 0)}</span></TableCell>
                          <TableCell className="text-xs font-bold text-gray-900 text-right">{formatMillions(totSept)}</TableCell>
                          <TableCell className="text-xs font-bold text-right"><span className={tauxColor(totCP > 0 ? (totSept / totCP) * 100 : 0)}>{formatPercent(totCP > 0 ? (totSept / totCP) * 100 : 0)}</span></TableCell>
                          <TableCell className="text-xs font-bold text-gray-900 text-right">{formatMillions(totOct)}</TableCell>
                          <TableCell className="text-xs font-bold text-right"><span className={tauxColor(totCP > 0 ? (totOct / totCP) * 100 : 0)}>{formatPercent(totCP > 0 ? (totOct / totCP) * 100 : 0)}</span></TableCell>
                          <TableCell className="text-xs font-bold text-gray-900 text-right">{formatMillions(totNov)}</TableCell>
                          <TableCell className="text-xs font-bold text-right"><span className={tauxColor(totCP > 0 ? (totNov / totCP) * 100 : 0)}>{formatPercent(totCP > 0 ? (totNov / totCP) * 100 : 0)}</span></TableCell>
                          <TableCell className="text-xs font-bold text-gray-900 text-right">{formatMillions(totDec)}</TableCell>
                          <TableCell className="text-xs font-bold text-right"><span className={tauxColor(totCP > 0 ? (totDec / totCP) * 100 : 0)}>{formatPercent(totCP > 0 ? (totDec / totCP) * 100 : 0)}</span></TableCell>
                        </TableRow>
                      </>
                    )
                  })()}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Détail des prévisions par prestation */}
        <Card className="border border-gray-100 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold text-gray-800 tracking-wide uppercase">Détail des prévisions par prestation <span className="text-gray-400 font-normal">(MDh)</span></CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-amber-50/60">
                    <TableHead className="text-xs font-bold text-amber-700" rowSpan={2}>Projet</TableHead>
                    <TableHead className="text-xs font-bold text-amber-700" rowSpan={2}>Entité</TableHead>
                    <TableHead className="text-xs font-bold text-amber-700" rowSpan={2}>Nomenclature</TableHead>
                    <TableHead className="text-xs font-bold text-amber-700" rowSpan={2}>N° Engagement</TableHead>
                    <TableHead className="text-xs font-bold text-amber-700" rowSpan={2}>Désignation</TableHead>
                    <TableHead className="text-xs font-bold text-amber-700 text-right" rowSpan={2}>Total CP</TableHead>
                    <TableHead className="text-xs font-bold text-center text-blue-600" colSpan={4}>Fin Juin</TableHead>
                    <TableHead className="text-xs font-bold text-center text-teal-600" colSpan={4}>Fin Sept.</TableHead>
                    <TableHead className="text-xs font-bold text-center text-purple-600" colSpan={4}>Fin Nov.</TableHead>
                    <TableHead className="text-xs font-bold text-center text-indigo-600" colSpan={4}>Fin Déc.</TableHead>
                    <TableHead className="text-xs font-bold text-amber-700 text-right" rowSpan={2}>Taux Déc.</TableHead>
                  </TableRow>
                  <TableRow className="bg-amber-50/40">
                    <TableHead className="text-[10px] font-bold text-blue-500 text-right">Rep.</TableHead>
                    <TableHead className="text-[10px] font-bold text-blue-500 text-right">Cons.</TableHead>
                    <TableHead className="text-[10px] font-bold text-blue-500 text-right">Nouv.</TableHead>
                    <TableHead className="text-[10px] font-bold text-blue-500 text-right">Total</TableHead>
                    <TableHead className="text-[10px] font-bold text-teal-500 text-right">Rep.</TableHead>
                    <TableHead className="text-[10px] font-bold text-teal-500 text-right">Cons.</TableHead>
                    <TableHead className="text-[10px] font-bold text-teal-500 text-right">Nouv.</TableHead>
                    <TableHead className="text-[10px] font-bold text-teal-500 text-right">Total</TableHead>
                    <TableHead className="text-[10px] font-bold text-purple-500 text-right">Rep.</TableHead>
                    <TableHead className="text-[10px] font-bold text-purple-500 text-right">Cons.</TableHead>
                    <TableHead className="text-[10px] font-bold text-purple-500 text-right">Nouv.</TableHead>
                    <TableHead className="text-[10px] font-bold text-purple-500 text-right">Total</TableHead>
                    <TableHead className="text-[10px] font-bold text-indigo-500 text-right">Rep.</TableHead>
                    <TableHead className="text-[10px] font-bold text-indigo-500 text-right">Cons.</TableHead>
                    <TableHead className="text-[10px] font-bold text-indigo-500 text-right">Nouv.</TableHead>
                    <TableHead className="text-[10px] font-bold text-indigo-500 text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(() => {
                    const prevMonths = ['JANVIER','FEVRIER','MARS','AVRIL','MAI','JUIN','JUILLET','AOUT','SEPTEMBRE','OCTOBRE','NOVEMBRE','DECEMBRE']
                    // Build prestation-level data with cumulative prévisions per category
                    const prestations = filteredData.map(row => {
                      let cumulRep = 0, cumulCons = 0, cumulNouv = 0
                      const cumulRepByMonth: Record<string,number> = {}
                      const cumulConsByMonth: Record<string,number> = {}
                      const cumulNouvByMonth: Record<string,number> = {}
                      for (const m of prevMonths) {
                        cumulRep += row[`Previsions REPORTS ${m}`] || 0
                        cumulCons += row[`Previsions CONSOLIDES ${m}`] || 0
                        cumulNouv += row[`Previsions NOUVEAUX ${m}`] || 0
                        cumulRepByMonth[m] = cumulRep
                        cumulConsByMonth[m] = cumulCons
                        cumulNouvByMonth[m] = cumulNouv
                      }
                      const totDec = cumulRep + cumulCons + cumulNouv
                      const cp = row['TOTAL CP'] || 0
                      return {
                        projet: row.Projet || '',
                        entite: row.ENTITE || '',
                        nomenclature: row.NOMENCLATURE || '-',
                        numEngagement: row['N° ENGAGEMENT'] || '-',
                        designation: row['DETAIL DESIGNATION'] || '-',
                        cp,
                        cumulRepByMonth,
                        cumulConsByMonth,
                        cumulNouvByMonth,
                        totDec,
                      }
                    }).filter(p => p.totDec > 0).sort((a, b) => b.totDec - a.totDec)

                    // Totals — use ALL filteredData for Total CP (not just rows with prévisions)
                    const totCP = filteredData.reduce((s, r) => s + (r['TOTAL CP'] || 0), 0)
                    let totRepJuin = 0, totConsJuin = 0, totNouvJuin = 0
                    let totRepSept = 0, totConsSept = 0, totNouvSept = 0
                    let totRepNov = 0, totConsNov = 0, totNouvNov = 0
                    let totRepDec = 0, totConsDec = 0, totNouvDec = 0
                    prestations.forEach(p => {
                      totRepJuin += p.cumulRepByMonth['JUIN'] || 0
                      totConsJuin += p.cumulConsByMonth['JUIN'] || 0
                      totNouvJuin += p.cumulNouvByMonth['JUIN'] || 0
                      totRepSept += p.cumulRepByMonth['SEPTEMBRE'] || 0
                      totConsSept += p.cumulConsByMonth['SEPTEMBRE'] || 0
                      totNouvSept += p.cumulNouvByMonth['SEPTEMBRE'] || 0
                      totRepNov += p.cumulRepByMonth['NOVEMBRE'] || 0
                      totConsNov += p.cumulConsByMonth['NOVEMBRE'] || 0
                      totNouvNov += p.cumulNouvByMonth['NOVEMBRE'] || 0
                      totRepDec += p.cumulRepByMonth['DECEMBRE'] || 0
                      totConsDec += p.cumulConsByMonth['DECEMBRE'] || 0
                      totNouvDec += p.cumulNouvByMonth['DECEMBRE'] || 0
                    })
                    const totPrevDec = totRepDec + totConsDec + totNouvDec
                    const totJuinTotal = totRepJuin + totConsJuin + totNouvJuin
                    const totSeptTotal = totRepSept + totConsSept + totNouvSept
                    const totNovTotal = totRepNov + totConsNov + totNouvNov

                    let currentProjet = ''
                    return (
                      <>
                        {prestations.map((p, i) => {
                          const showProjetHeader = p.projet !== currentProjet
                          currentProjet = p.projet
                          const pTotDec = (p.cumulRepByMonth['DECEMBRE']||0) + (p.cumulConsByMonth['DECEMBRE']||0) + (p.cumulNouvByMonth['DECEMBRE']||0)
                          return (
                            <TableRow key={i} className={`hover:bg-gray-50 ${showProjetHeader && i > 0 ? 'border-t-2 border-amber-200' : ''}`}>
                              <TableCell className="text-xs font-medium text-gray-900 whitespace-nowrap">{p.projet}</TableCell>
                              <TableCell className="text-xs text-gray-600">{p.entite}</TableCell>
                              <TableCell className="text-xs text-amber-600 font-mono whitespace-nowrap">{p.nomenclature}</TableCell>
                              <TableCell className="text-xs font-medium text-gray-900">{p.numEngagement}</TableCell>
                              <TableCell className="text-xs text-gray-700" style={{minWidth:'250px',maxWidth:'400px',whiteSpace:'normal',lineHeight:'1.4'}}>{p.designation}</TableCell>
                              <TableCell className="text-xs text-gray-700 text-right">{formatMillions(p.cp)}</TableCell>
                              <TableCell className="text-xs text-blue-600 text-right">{formatMillions(p.cumulRepByMonth['JUIN']||0)}</TableCell>
                              <TableCell className="text-xs text-blue-600 text-right">{formatMillions(p.cumulConsByMonth['JUIN']||0)}</TableCell>
                              <TableCell className="text-xs text-blue-600 text-right">{formatMillions(p.cumulNouvByMonth['JUIN']||0)}</TableCell>
                              <TableCell className="text-xs font-bold text-blue-700 text-right">{formatMillions((p.cumulRepByMonth['JUIN']||0)+(p.cumulConsByMonth['JUIN']||0)+(p.cumulNouvByMonth['JUIN']||0))}</TableCell>
                              <TableCell className="text-xs text-teal-600 text-right">{formatMillions(p.cumulRepByMonth['SEPTEMBRE']||0)}</TableCell>
                              <TableCell className="text-xs text-teal-600 text-right">{formatMillions(p.cumulConsByMonth['SEPTEMBRE']||0)}</TableCell>
                              <TableCell className="text-xs text-teal-600 text-right">{formatMillions(p.cumulNouvByMonth['SEPTEMBRE']||0)}</TableCell>
                              <TableCell className="text-xs font-bold text-teal-700 text-right">{formatMillions((p.cumulRepByMonth['SEPTEMBRE']||0)+(p.cumulConsByMonth['SEPTEMBRE']||0)+(p.cumulNouvByMonth['SEPTEMBRE']||0))}</TableCell>
                              <TableCell className="text-xs text-purple-600 text-right">{formatMillions(p.cumulRepByMonth['NOVEMBRE']||0)}</TableCell>
                              <TableCell className="text-xs text-purple-600 text-right">{formatMillions(p.cumulConsByMonth['NOVEMBRE']||0)}</TableCell>
                              <TableCell className="text-xs text-purple-600 text-right">{formatMillions(p.cumulNouvByMonth['NOVEMBRE']||0)}</TableCell>
                              <TableCell className="text-xs font-bold text-purple-700 text-right">{formatMillions((p.cumulRepByMonth['NOVEMBRE']||0)+(p.cumulConsByMonth['NOVEMBRE']||0)+(p.cumulNouvByMonth['NOVEMBRE']||0))}</TableCell>
                              <TableCell className="text-xs text-indigo-600 text-right">{formatMillions(p.cumulRepByMonth['DECEMBRE']||0)}</TableCell>
                              <TableCell className="text-xs text-indigo-600 text-right">{formatMillions(p.cumulConsByMonth['DECEMBRE']||0)}</TableCell>
                              <TableCell className="text-xs text-indigo-600 text-right">{formatMillions(p.cumulNouvByMonth['DECEMBRE']||0)}</TableCell>
                              <TableCell className="text-xs font-bold text-indigo-700 text-right">{formatMillions((p.cumulRepByMonth['DECEMBRE']||0)+(p.cumulConsByMonth['DECEMBRE']||0)+(p.cumulNouvByMonth['DECEMBRE']||0))}</TableCell>
                              <TableCell className="text-xs text-right"><span className={tauxColor(p.cp > 0 ? (pTotDec / p.cp) * 100 : 0)}>{formatPercent(p.cp > 0 ? (pTotDec / p.cp) * 100 : 0)}</span></TableCell>
                            </TableRow>
                          )
                        })}
                        <TableRow className="bg-amber-50/40 font-bold-total">
                          <TableCell className="text-xs font-bold text-gray-900" colSpan={5}>Total ({prestations.length} prestations)</TableCell>
                          <TableCell className="text-xs font-bold text-gray-900 text-right">{formatMillions(totCP)}</TableCell>
                          <TableCell className="text-xs font-bold text-blue-700 text-right">{formatMillions(totRepJuin)}</TableCell>
                          <TableCell className="text-xs font-bold text-blue-700 text-right">{formatMillions(totConsJuin)}</TableCell>
                          <TableCell className="text-xs font-bold text-blue-700 text-right">{formatMillions(totNouvJuin)}</TableCell>
                          <TableCell className="text-xs font-bold text-blue-800 text-right">{formatMillions(totJuinTotal)}</TableCell>
                          <TableCell className="text-xs font-bold text-teal-700 text-right">{formatMillions(totRepSept)}</TableCell>
                          <TableCell className="text-xs font-bold text-teal-700 text-right">{formatMillions(totConsSept)}</TableCell>
                          <TableCell className="text-xs font-bold text-teal-700 text-right">{formatMillions(totNouvSept)}</TableCell>
                          <TableCell className="text-xs font-bold text-teal-800 text-right">{formatMillions(totSeptTotal)}</TableCell>
                          <TableCell className="text-xs font-bold text-purple-700 text-right">{formatMillions(totRepNov)}</TableCell>
                          <TableCell className="text-xs font-bold text-purple-700 text-right">{formatMillions(totConsNov)}</TableCell>
                          <TableCell className="text-xs font-bold text-purple-700 text-right">{formatMillions(totNouvNov)}</TableCell>
                          <TableCell className="text-xs font-bold text-purple-800 text-right">{formatMillions(totNovTotal)}</TableCell>
                          <TableCell className="text-xs font-bold text-indigo-700 text-right">{formatMillions(totRepDec)}</TableCell>
                          <TableCell className="text-xs font-bold text-indigo-700 text-right">{formatMillions(totConsDec)}</TableCell>
                          <TableCell className="text-xs font-bold text-indigo-700 text-right">{formatMillions(totNouvDec)}</TableCell>
                          <TableCell className="text-xs font-bold text-indigo-800 text-right">{formatMillions(totPrevDec)}</TableCell>
                          <TableCell className="text-xs font-bold text-right"><span className={tauxColor(totCP > 0 ? (totPrevDec / totCP) * 100 : 0)}>{formatPercent(totCP > 0 ? (totPrevDec / totCP) * 100 : 0)}</span></TableCell>
                        </TableRow>
                      </>
                    )
                  })()}
                </TableBody>
              </Table>
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


    // Group by entity for reports analysis (with prévisions)
    const reportsByEntity = analysisByEntity.map(e => {
      const rows = filteredData.filter(r => r.ENTITE === e.name)
      const reports = rows.reduce((s, r) => s + (r.REPORTS || 0), 0)
      const engReports = rows.reduce((s, r) => s + (r['ENG REPORT'] || 0), 0)
      const ordReports = rows.reduce((s, r) => s + (r['ORD REPORTS'] || 0), 0)
      const paiementsReports = rows.reduce((s, r) => s + (r['PAIEMENTS SUR REPORTS'] || 0), 0)
      const cp = rows.reduce((s, r) => s + (r['TOTAL CP'] || 0), 0)
      // Prévisions cumulées des reports
      const prevMonths = ['JANVIER','FEVRIER','MARS','AVRIL','MAI','JUIN','JUILLET','AOUT','SEPTEMBRE','OCTOBRE','NOVEMBRE','DECEMBRE']
      let cumulRep = 0
      const cumulByMonth: Record<string,number> = {}
      for (const m of prevMonths) {
        cumulRep += rows.reduce((s, r) => s + (r[`Previsions REPORTS ${m}`] || 0), 0)
        cumulByMonth[m] = cumulRep
      }
      return {
        name: e.name,
        reports,
        engReports,
        ordReports,
        paiementsReports,
        cp,
        prevJuin: cumulByMonth['JUIN'] || 0,
        prevSept: cumulByMonth['SEPTEMBRE'] || 0,
        prevOct: cumulByMonth['OCTOBRE'] || 0,
        prevNov: cumulByMonth['NOVEMBRE'] || 0,
        prevDec: cumulByMonth['DECEMBRE'] || 0,
        tauxEngReports: reports > 0 ? (engReports / reports) * 100 : 0,
        tauxOrdReports: engReports > 0 ? (ordReports / engReports) * 100 : 0,
      }
    }).filter(e => e.reports > 0).sort((a, b) => b.reports - a.reports)

    // Group by projet for reports analysis (with prévisions)
    const reportsByProjet = analysisByGroup.map(g => {
      const rows = filteredData.filter(r => r.Projet === g.name)
      const reports = rows.reduce((s, r) => s + (r.REPORTS || 0), 0)
      const engReports = rows.reduce((s, r) => s + (r['ENG REPORT'] || 0), 0)
      const ordReports = rows.reduce((s, r) => s + (r['ORD REPORTS'] || 0), 0)
      const paiementsReports = rows.reduce((s, r) => s + (r['PAIEMENTS SUR REPORTS'] || 0), 0)
      const cp = rows.reduce((s, r) => s + (r['TOTAL CP'] || 0), 0)
      // Prévisions cumulées des reports
      const prevMonths = ['JANVIER','FEVRIER','MARS','AVRIL','MAI','JUIN','JUILLET','AOUT','SEPTEMBRE','OCTOBRE','NOVEMBRE','DECEMBRE']
      let cumulRep = 0
      const cumulByMonth: Record<string,number> = {}
      for (const m of prevMonths) {
        cumulRep += rows.reduce((s, r) => s + (r[`Previsions REPORTS ${m}`] || 0), 0)
        cumulByMonth[m] = cumulRep
      }
      return {
        name: g.name,
        reports,
        engReports,
        ordReports,
        paiementsReports,
        cp,
        prevJuin: cumulByMonth['JUIN'] || 0,
        prevSept: cumulByMonth['SEPTEMBRE'] || 0,
        prevOct: cumulByMonth['OCTOBRE'] || 0,
        prevNov: cumulByMonth['NOVEMBRE'] || 0,
        prevDec: cumulByMonth['DECEMBRE'] || 0,
        tauxEngReports: reports > 0 ? (engReports / reports) * 100 : 0,
        tauxOrdReports: engReports > 0 ? (ordReports / engReports) * 100 : 0,
      }
    }).filter(g => g.reports > 0).sort((a, b) => b.reports - a.reports)

    return (
      <>
        {/* ═══════════ SECTION 1 : REPORTS ═══════════ */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-1 h-5 rounded-full bg-gradient-to-b from-blue-500 to-indigo-600" />
            <h3 className="text-sm font-bold text-gray-800 tracking-wide uppercase">Reports</h3>
            
          </div>
          <div className="grid grid-cols-3 gap-4">
            {/* Crédits reportés */}
            <div className="kpi-card-premium bg-white rounded-xl border border-gray-100 overflow-hidden cursor-default">
              <div className="h-1.5 bg-gradient-to-r from-blue-400 to-blue-600" />
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="kpi-icon-wrap w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center transition-transform">
                    <RotateCcw className="w-5 h-5 text-blue-600" />
                  </div>
                  <Badge className="bg-blue-50 text-blue-700 border-blue-200 text-[10px] font-bold rounded-full px-2.5">Reports</Badge>
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
                  <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] font-bold rounded-full px-2.5">Eng.</Badge>
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
                  <Badge className="bg-violet-50 text-violet-700 border-violet-200 text-[10px] font-bold rounded-full px-2.5">Ord.</Badge>
                </div>
                <p className="text-2xl font-black text-gray-900 tracking-tight">{formatMillions(totalOrdReports)}</p>
                <p className="text-[11px] text-gray-400 mt-1.5 font-medium">Taux : <span className={tauxColor(tauxOrdReports)}>{formatPercent(tauxOrdReports)}</span></p>
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
                      <span className="text-sm font-bold text-gray-700">Taux eng. reports</span>
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
                      <span className="text-sm font-bold text-gray-700">Taux ord. reports</span>
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
            <CardTitle className="text-sm font-bold text-gray-800 tracking-wide uppercase">Assainissement par entité</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-blue-50/60">
                    <TableHead className="text-xs font-bold text-blue-700" rowSpan={2}>Entité</TableHead>
                    <TableHead className="text-xs font-bold text-blue-700 text-right" rowSpan={2}>Crédits Report</TableHead>
                    <TableHead className="text-xs font-bold text-blue-700 text-right" rowSpan={2}>Eng. Reports</TableHead>
                    <TableHead className="text-xs font-bold text-blue-700 text-right" rowSpan={2}>Taux eng.</TableHead>
                    <TableHead className="text-xs font-bold text-blue-700 text-right" rowSpan={2}>Ord. Reports</TableHead>
                    <TableHead className="text-xs font-bold text-blue-700 text-right" rowSpan={2}>Taux ord.</TableHead>
                    <TableHead className="text-xs font-bold text-center text-blue-600" colSpan={2}>Prév. Rep. Cum. Juin</TableHead>
                    <TableHead className="text-xs font-bold text-center text-teal-600" colSpan={2}>Prév. Rep. Cum. Sept.</TableHead>
                    <TableHead className="text-xs font-bold text-center text-orange-600" colSpan={2}>Prév. Rep. Cum. Oct.</TableHead>
                    <TableHead className="text-xs font-bold text-center text-purple-600" colSpan={2}>Prév. Rep. Cum. Nov.</TableHead>
                    <TableHead className="text-xs font-bold text-center text-indigo-600" colSpan={2}>Prév. Rep. Cum. Déc.</TableHead>
                  </TableRow>
                  <TableRow className="bg-blue-50/40">
                    <TableHead className="text-[10px] font-bold text-blue-500 text-right">Prév.</TableHead>
                    <TableHead className="text-[10px] font-bold text-blue-500 text-right">Taux</TableHead>
                    <TableHead className="text-[10px] font-bold text-teal-500 text-right">Prév.</TableHead>
                    <TableHead className="text-[10px] font-bold text-teal-500 text-right">Taux</TableHead>
                    <TableHead className="text-[10px] font-bold text-orange-500 text-right">Prév.</TableHead>
                    <TableHead className="text-[10px] font-bold text-orange-500 text-right">Taux</TableHead>
                    <TableHead className="text-[10px] font-bold text-purple-500 text-right">Prév.</TableHead>
                    <TableHead className="text-[10px] font-bold text-purple-500 text-right">Taux</TableHead>
                    <TableHead className="text-[10px] font-bold text-indigo-500 text-right">Prév.</TableHead>
                    <TableHead className="text-[10px] font-bold text-indigo-500 text-right">Taux</TableHead>
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
                      <TableCell className="text-xs text-blue-600 text-right">{formatMillions(e.prevJuin)}</TableCell>
                      <TableCell className="text-xs text-right"><span className={tauxColor(e.reports > 0 ? (e.prevJuin / e.reports) * 100 : 0)}>{formatPercent(e.reports > 0 ? (e.prevJuin / e.reports) * 100 : 0)}</span></TableCell>
                      <TableCell className="text-xs text-teal-600 text-right">{formatMillions(e.prevSept)}</TableCell>
                      <TableCell className="text-xs text-right"><span className={tauxColor(e.reports > 0 ? (e.prevSept / e.reports) * 100 : 0)}>{formatPercent(e.reports > 0 ? (e.prevSept / e.reports) * 100 : 0)}</span></TableCell>
                      <TableCell className="text-xs text-orange-600 text-right">{formatMillions(e.prevOct)}</TableCell>
                      <TableCell className="text-xs text-right"><span className={tauxColor(e.reports > 0 ? (e.prevOct / e.reports) * 100 : 0)}>{formatPercent(e.reports > 0 ? (e.prevOct / e.reports) * 100 : 0)}</span></TableCell>
                      <TableCell className="text-xs text-purple-600 text-right">{formatMillions(e.prevNov)}</TableCell>
                      <TableCell className="text-xs text-right"><span className={tauxColor(e.reports > 0 ? (e.prevNov / e.reports) * 100 : 0)}>{formatPercent(e.reports > 0 ? (e.prevNov / e.reports) * 100 : 0)}</span></TableCell>
                      <TableCell className="text-xs text-indigo-600 text-right">{formatMillions(e.prevDec)}</TableCell>
                      <TableCell className="text-xs text-right"><span className={tauxColor(e.reports > 0 ? (e.prevDec / e.reports) * 100 : 0)}>{formatPercent(e.reports > 0 ? (e.prevDec / e.reports) * 100 : 0)}</span></TableCell>
                    </TableRow>
                  ))}
                  {(() => {
                    const totReports = reportsByEntity.reduce((s, e) => s + e.reports, 0)
                    const totPrevJuin = reportsByEntity.reduce((s, e) => s + e.prevJuin, 0)
                    const totPrevSept = reportsByEntity.reduce((s, e) => s + e.prevSept, 0)
                    const totPrevOct = reportsByEntity.reduce((s, e) => s + e.prevOct, 0)
                    const totPrevNov = reportsByEntity.reduce((s, e) => s + e.prevNov, 0)
                    const totPrevDec = reportsByEntity.reduce((s, e) => s + e.prevDec, 0)
                    const totPaiementsReports = reportsByEntity.reduce((s, e) => s + e.paiementsReports, 0)
                    return (
                      <TableRow className="bg-blue-50/40 font-bold-total">
                        <TableCell className="text-xs font-bold text-gray-900">TOTAL</TableCell>
                        <TableCell className="text-xs font-bold text-gray-900 text-right">{formatMillions(totalReports)}</TableCell>
                        <TableCell className="text-xs font-bold text-gray-900 text-right">{formatMillions(totalEngReports)}</TableCell>
                        <TableCell className="text-xs font-bold text-right"><span className={tauxColor(tauxEngReports)}>{formatPercent(tauxEngReports)}</span></TableCell>
                        <TableCell className="text-xs font-bold text-gray-900 text-right">{formatMillions(totalOrdReports)}</TableCell>
                        <TableCell className="text-xs font-bold text-right"><span className={tauxColor(tauxOrdReports)}>{formatPercent(tauxOrdReports)}</span></TableCell>
                        <TableCell className="text-xs font-bold text-blue-700 text-right">{formatMillions(totPrevJuin)}</TableCell>
                        <TableCell className="text-xs font-bold text-right"><span className={tauxColor(totReports > 0 ? (totPrevJuin / totReports) * 100 : 0)}>{formatPercent(totReports > 0 ? (totPrevJuin / totReports) * 100 : 0)}</span></TableCell>
                        <TableCell className="text-xs font-bold text-teal-700 text-right">{formatMillions(totPrevSept)}</TableCell>
                        <TableCell className="text-xs font-bold text-right"><span className={tauxColor(totReports > 0 ? (totPrevSept / totReports) * 100 : 0)}>{formatPercent(totReports > 0 ? (totPrevSept / totReports) * 100 : 0)}</span></TableCell>
                        <TableCell className="text-xs font-bold text-orange-700 text-right">{formatMillions(totPrevOct)}</TableCell>
                        <TableCell className="text-xs font-bold text-right"><span className={tauxColor(totReports > 0 ? (totPrevOct / totReports) * 100 : 0)}>{formatPercent(totReports > 0 ? (totPrevOct / totReports) * 100 : 0)}</span></TableCell>
                        <TableCell className="text-xs font-bold text-purple-700 text-right">{formatMillions(totPrevNov)}</TableCell>
                        <TableCell className="text-xs font-bold text-right"><span className={tauxColor(totReports > 0 ? (totPrevNov / totReports) * 100 : 0)}>{formatPercent(totReports > 0 ? (totPrevNov / totReports) * 100 : 0)}</span></TableCell>
                        <TableCell className="text-xs font-bold text-indigo-700 text-right">{formatMillions(totPrevDec)}</TableCell>
                        <TableCell className="text-xs font-bold text-right"><span className={tauxColor(totReports > 0 ? (totPrevDec / totReports) * 100 : 0)}>{formatPercent(totReports > 0 ? (totPrevDec / totReports) * 100 : 0)}</span></TableCell>
                      </TableRow>
                    )
                  })()}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Table by Projet */}
        <Card className="border border-gray-100 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold text-gray-800 tracking-wide uppercase">Assainissement par projet</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-emerald-50/60">
                    <TableHead className="text-xs font-bold text-emerald-700" rowSpan={2}>Projet</TableHead>
                    <TableHead className="text-xs font-bold text-emerald-700 text-right" rowSpan={2}>Crédits Report</TableHead>
                    <TableHead className="text-xs font-bold text-emerald-700 text-right" rowSpan={2}>Eng. Reports</TableHead>
                    <TableHead className="text-xs font-bold text-emerald-700 text-right" rowSpan={2}>Taux eng.</TableHead>
                    <TableHead className="text-xs font-bold text-emerald-700 text-right" rowSpan={2}>Ord. Reports</TableHead>
                    <TableHead className="text-xs font-bold text-emerald-700 text-right" rowSpan={2}>Taux ord.</TableHead>
                    <TableHead className="text-xs font-bold text-center text-blue-600" colSpan={2}>Prév. Rep. Cum. Juin</TableHead>
                    <TableHead className="text-xs font-bold text-center text-teal-600" colSpan={2}>Prév. Rep. Cum. Sept.</TableHead>
                    <TableHead className="text-xs font-bold text-center text-orange-600" colSpan={2}>Prév. Rep. Cum. Oct.</TableHead>
                    <TableHead className="text-xs font-bold text-center text-purple-600" colSpan={2}>Prév. Rep. Cum. Nov.</TableHead>
                    <TableHead className="text-xs font-bold text-center text-indigo-600" colSpan={2}>Prév. Rep. Cum. Déc.</TableHead>
                  </TableRow>
                  <TableRow className="bg-emerald-50/40">
                    <TableHead className="text-[10px] font-bold text-blue-500 text-right">Prév.</TableHead>
                    <TableHead className="text-[10px] font-bold text-blue-500 text-right">Taux</TableHead>
                    <TableHead className="text-[10px] font-bold text-teal-500 text-right">Prév.</TableHead>
                    <TableHead className="text-[10px] font-bold text-teal-500 text-right">Taux</TableHead>
                    <TableHead className="text-[10px] font-bold text-orange-500 text-right">Prév.</TableHead>
                    <TableHead className="text-[10px] font-bold text-orange-500 text-right">Taux</TableHead>
                    <TableHead className="text-[10px] font-bold text-purple-500 text-right">Prév.</TableHead>
                    <TableHead className="text-[10px] font-bold text-purple-500 text-right">Taux</TableHead>
                    <TableHead className="text-[10px] font-bold text-indigo-500 text-right">Prév.</TableHead>
                    <TableHead className="text-[10px] font-bold text-indigo-500 text-right">Taux</TableHead>
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
                      <TableCell className="text-xs text-blue-600 text-right">{formatMillions(g.prevJuin)}</TableCell>
                      <TableCell className="text-xs text-right"><span className={tauxColor(g.reports > 0 ? (g.prevJuin / g.reports) * 100 : 0)}>{formatPercent(g.reports > 0 ? (g.prevJuin / g.reports) * 100 : 0)}</span></TableCell>
                      <TableCell className="text-xs text-teal-600 text-right">{formatMillions(g.prevSept)}</TableCell>
                      <TableCell className="text-xs text-right"><span className={tauxColor(g.reports > 0 ? (g.prevSept / g.reports) * 100 : 0)}>{formatPercent(g.reports > 0 ? (g.prevSept / g.reports) * 100 : 0)}</span></TableCell>
                      <TableCell className="text-xs text-orange-600 text-right">{formatMillions(g.prevOct)}</TableCell>
                      <TableCell className="text-xs text-right"><span className={tauxColor(g.reports > 0 ? (g.prevOct / g.reports) * 100 : 0)}>{formatPercent(g.reports > 0 ? (g.prevOct / g.reports) * 100 : 0)}</span></TableCell>
                      <TableCell className="text-xs text-purple-600 text-right">{formatMillions(g.prevNov)}</TableCell>
                      <TableCell className="text-xs text-right"><span className={tauxColor(g.reports > 0 ? (g.prevNov / g.reports) * 100 : 0)}>{formatPercent(g.reports > 0 ? (g.prevNov / g.reports) * 100 : 0)}</span></TableCell>
                      <TableCell className="text-xs text-indigo-600 text-right">{formatMillions(g.prevDec)}</TableCell>
                      <TableCell className="text-xs text-right"><span className={tauxColor(g.reports > 0 ? (g.prevDec / g.reports) * 100 : 0)}>{formatPercent(g.reports > 0 ? (g.prevDec / g.reports) * 100 : 0)}</span></TableCell>
                    </TableRow>
                  ))}
                  {(() => {
                    const totReports = reportsByProjet.reduce((s, g) => s + g.reports, 0)
                    const totPrevJuin = reportsByProjet.reduce((s, g) => s + g.prevJuin, 0)
                    const totPrevSept = reportsByProjet.reduce((s, g) => s + g.prevSept, 0)
                    const totPrevOct = reportsByProjet.reduce((s, g) => s + g.prevOct, 0)
                    const totPrevNov = reportsByProjet.reduce((s, g) => s + g.prevNov, 0)
                    const totPrevDec = reportsByProjet.reduce((s, g) => s + g.prevDec, 0)
                    const totPaiementsReports = reportsByProjet.reduce((s, g) => s + g.paiementsReports, 0)
                    return (
                      <TableRow className="bg-emerald-50/40 font-bold-total">
                        <TableCell className="text-xs font-bold text-gray-900">TOTAL</TableCell>
                        <TableCell className="text-xs font-bold text-gray-900 text-right">{formatMillions(totalReports)}</TableCell>
                        <TableCell className="text-xs font-bold text-gray-900 text-right">{formatMillions(totalEngReports)}</TableCell>
                        <TableCell className="text-xs font-bold text-right"><span className={tauxColor(tauxEngReports)}>{formatPercent(tauxEngReports)}</span></TableCell>
                        <TableCell className="text-xs font-bold text-gray-900 text-right">{formatMillions(totalOrdReports)}</TableCell>
                        <TableCell className="text-xs font-bold text-right"><span className={tauxColor(tauxOrdReports)}>{formatPercent(tauxOrdReports)}</span></TableCell>
                        <TableCell className="text-xs font-bold text-blue-700 text-right">{formatMillions(totPrevJuin)}</TableCell>
                        <TableCell className="text-xs font-bold text-right"><span className={tauxColor(totReports > 0 ? (totPrevJuin / totReports) * 100 : 0)}>{formatPercent(totReports > 0 ? (totPrevJuin / totReports) * 100 : 0)}</span></TableCell>
                        <TableCell className="text-xs font-bold text-teal-700 text-right">{formatMillions(totPrevSept)}</TableCell>
                        <TableCell className="text-xs font-bold text-right"><span className={tauxColor(totReports > 0 ? (totPrevSept / totReports) * 100 : 0)}>{formatPercent(totReports > 0 ? (totPrevSept / totReports) * 100 : 0)}</span></TableCell>
                        <TableCell className="text-xs font-bold text-orange-700 text-right">{formatMillions(totPrevOct)}</TableCell>
                        <TableCell className="text-xs font-bold text-right"><span className={tauxColor(totReports > 0 ? (totPrevOct / totReports) * 100 : 0)}>{formatPercent(totReports > 0 ? (totPrevOct / totReports) * 100 : 0)}</span></TableCell>
                        <TableCell className="text-xs font-bold text-purple-700 text-right">{formatMillions(totPrevNov)}</TableCell>
                        <TableCell className="text-xs font-bold text-right"><span className={tauxColor(totReports > 0 ? (totPrevNov / totReports) * 100 : 0)}>{formatPercent(totReports > 0 ? (totPrevNov / totReports) * 100 : 0)}</span></TableCell>
                        <TableCell className="text-xs font-bold text-indigo-700 text-right">{formatMillions(totPrevDec)}</TableCell>
                        <TableCell className="text-xs font-bold text-right"><span className={tauxColor(totReports > 0 ? (totPrevDec / totReports) * 100 : 0)}>{formatPercent(totReports > 0 ? (totPrevDec / totReports) * 100 : 0)}</span></TableCell>
                      </TableRow>
                    )
                  })()}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* ═══════════ Analyse assainissement par programme ═══════════ */}
        <Card className="border border-gray-100 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold text-gray-800 tracking-wide uppercase">Assainissement par programme</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-indigo-50/60">
                    <TableHead className="text-xs font-bold text-indigo-700" rowSpan={2}>Programme</TableHead>
                    <TableHead className="text-xs font-bold text-indigo-700 text-right" rowSpan={2}>Crédits Report</TableHead>
                    <TableHead className="text-xs font-bold text-indigo-700 text-right" rowSpan={2}>Eng. Reports</TableHead>
                    <TableHead className="text-xs font-bold text-indigo-700 text-right" rowSpan={2}>Taux eng.</TableHead>
                    <TableHead className="text-xs font-bold text-indigo-700 text-right" rowSpan={2}>Ord. Reports</TableHead>
                    <TableHead className="text-xs font-bold text-indigo-700 text-right" rowSpan={2}>Taux ord.</TableHead>
                    <TableHead className="text-xs font-bold text-center text-blue-600" colSpan={2}>Prév. Rep. Cum. Juin</TableHead>
                    <TableHead className="text-xs font-bold text-center text-teal-600" colSpan={2}>Prév. Rep. Cum. Sept.</TableHead>
                    <TableHead className="text-xs font-bold text-center text-orange-600" colSpan={2}>Prév. Rep. Cum. Oct.</TableHead>
                    <TableHead className="text-xs font-bold text-center text-purple-600" colSpan={2}>Prév. Rep. Cum. Nov.</TableHead>
                    <TableHead className="text-xs font-bold text-center text-indigo-600" colSpan={2}>Prév. Rep. Cum. Déc.</TableHead>
                  </TableRow>
                  <TableRow className="bg-indigo-50/40">
                    <TableHead className="text-[10px] font-bold text-blue-500 text-right">Prév.</TableHead>
                    <TableHead className="text-[10px] font-bold text-blue-500 text-right">Taux</TableHead>
                    <TableHead className="text-[10px] font-bold text-teal-500 text-right">Prév.</TableHead>
                    <TableHead className="text-[10px] font-bold text-teal-500 text-right">Taux</TableHead>
                    <TableHead className="text-[10px] font-bold text-orange-500 text-right">Prév.</TableHead>
                    <TableHead className="text-[10px] font-bold text-orange-500 text-right">Taux</TableHead>
                    <TableHead className="text-[10px] font-bold text-purple-500 text-right">Prév.</TableHead>
                    <TableHead className="text-[10px] font-bold text-purple-500 text-right">Taux</TableHead>
                    <TableHead className="text-[10px] font-bold text-indigo-500 text-right">Prév.</TableHead>
                    <TableHead className="text-[10px] font-bold text-indigo-500 text-right">Taux</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(() => {
                    const prevMonths = ['JANVIER','FEVRIER','MARS','AVRIL','MAI','JUIN','JUILLET','AOUT','SEPTEMBRE','OCTOBRE','NOVEMBRE','DECEMBRE']
                    const reportsByProgramme = analysisByProgramme.map(p => {
                      const rows = filteredData.filter(r => (r.Programme || 'Sans nom') === p.name)
                      const reports = rows.reduce((s, r) => s + (r.REPORTS || 0), 0)
                      const engReports = rows.reduce((s, r) => s + (r['ENG REPORT'] || 0), 0)
                      const ordReports = rows.reduce((s, r) => s + (r['ORD REPORTS'] || 0), 0)
                      const paiementsReports = rows.reduce((s, r) => s + (r['PAIEMENTS SUR REPORTS'] || 0), 0)
                      const cp = rows.reduce((s, r) => s + (r['TOTAL CP'] || 0), 0)
                      let cumulRep = 0
                      const cumulByMonth: Record<string,number> = {}
                      for (const m of prevMonths) {
                        cumulRep += rows.reduce((s, r) => s + (r[`Previsions REPORTS ${m}`] || 0), 0)
                        cumulByMonth[m] = cumulRep
                      }
                      return {
                        name: p.name,
                        reports,
                        engReports,
                        ordReports,
                        paiementsReports,
                        cp,
                        prevJuin: cumulByMonth['JUIN'] || 0,
                        prevSept: cumulByMonth['SEPTEMBRE'] || 0,
                        prevOct: cumulByMonth['OCTOBRE'] || 0,
                        prevNov: cumulByMonth['NOVEMBRE'] || 0,
                        prevDec: cumulByMonth['DECEMBRE'] || 0,
                        tauxEngReports: reports > 0 ? (engReports / reports) * 100 : 0,
                        tauxOrdReports: engReports > 0 ? (ordReports / engReports) * 100 : 0,
                      }
                    }).filter(p => p.reports > 0).sort((a, b) => b.reports - a.reports)

                    const totReports = reportsByProgramme.reduce((s, p) => s + p.reports, 0)
                    const totEngReports = reportsByProgramme.reduce((s, p) => s + p.engReports, 0)
                    const totOrdReports = reportsByProgramme.reduce((s, p) => s + p.ordReports, 0)
                    const totPaiementsReports = reportsByProgramme.reduce((s, p) => s + p.paiementsReports, 0)
                    const totPrevJuin = reportsByProgramme.reduce((s, p) => s + p.prevJuin, 0)
                    const totPrevSept = reportsByProgramme.reduce((s, p) => s + p.prevSept, 0)
                    const totPrevOct = reportsByProgramme.reduce((s, p) => s + p.prevOct, 0)
                    const totPrevNov = reportsByProgramme.reduce((s, p) => s + p.prevNov, 0)
                    const totPrevDec = reportsByProgramme.reduce((s, p) => s + p.prevDec, 0)

                    return (
                      <>
                        {reportsByProgramme.map(p => (
                          <TableRow key={p.name} className="hover:bg-gray-50">
                            <TableCell className="text-xs font-medium text-gray-900">{p.name}</TableCell>
                            <TableCell className="text-xs text-gray-700 text-right">{formatMillions(p.reports)}</TableCell>
                            <TableCell className="text-xs text-gray-700 text-right">{formatMillions(p.engReports)}</TableCell>
                            <TableCell className="text-xs text-right"><span className={tauxColor(p.tauxEngReports)}>{formatPercent(p.tauxEngReports)}</span></TableCell>
                            <TableCell className="text-xs text-gray-700 text-right">{formatMillions(p.ordReports)}</TableCell>
                            <TableCell className="text-xs text-right"><span className={tauxColor(p.tauxOrdReports)}>{formatPercent(p.tauxOrdReports)}</span></TableCell>
                            <TableCell className="text-xs text-blue-600 text-right">{formatMillions(p.prevJuin)}</TableCell>
                            <TableCell className="text-xs text-right"><span className={tauxColor(p.reports > 0 ? (p.prevJuin / p.reports) * 100 : 0)}>{formatPercent(p.reports > 0 ? (p.prevJuin / p.reports) * 100 : 0)}</span></TableCell>
                            <TableCell className="text-xs text-teal-600 text-right">{formatMillions(p.prevSept)}</TableCell>
                            <TableCell className="text-xs text-right"><span className={tauxColor(p.reports > 0 ? (p.prevSept / p.reports) * 100 : 0)}>{formatPercent(p.reports > 0 ? (p.prevSept / p.reports) * 100 : 0)}</span></TableCell>
                            <TableCell className="text-xs text-orange-600 text-right">{formatMillions(p.prevOct)}</TableCell>
                            <TableCell className="text-xs text-right"><span className={tauxColor(p.reports > 0 ? (p.prevOct / p.reports) * 100 : 0)}>{formatPercent(p.reports > 0 ? (p.prevOct / p.reports) * 100 : 0)}</span></TableCell>
                            <TableCell className="text-xs text-purple-600 text-right">{formatMillions(p.prevNov)}</TableCell>
                            <TableCell className="text-xs text-right"><span className={tauxColor(p.reports > 0 ? (p.prevNov / p.reports) * 100 : 0)}>{formatPercent(p.reports > 0 ? (p.prevNov / p.reports) * 100 : 0)}</span></TableCell>
                            <TableCell className="text-xs text-indigo-600 text-right">{formatMillions(p.prevDec)}</TableCell>
                            <TableCell className="text-xs text-right"><span className={tauxColor(p.reports > 0 ? (p.prevDec / p.reports) * 100 : 0)}>{formatPercent(p.reports > 0 ? (p.prevDec / p.reports) * 100 : 0)}</span></TableCell>
                          </TableRow>
                        ))}
                        <TableRow className="bg-indigo-50/40 font-bold-total">
                          <TableCell className="text-xs font-bold text-gray-900">TOTAL</TableCell>
                          <TableCell className="text-xs font-bold text-gray-900 text-right">{formatMillions(totReports)}</TableCell>
                          <TableCell className="text-xs font-bold text-gray-900 text-right">{formatMillions(totEngReports)}</TableCell>
                          <TableCell className="text-xs font-bold text-right"><span className={tauxColor(totReports > 0 ? (totEngReports / totReports) * 100 : 0)}>{formatPercent(totReports > 0 ? (totEngReports / totReports) * 100 : 0)}</span></TableCell>
                          <TableCell className="text-xs font-bold text-gray-900 text-right">{formatMillions(totOrdReports)}</TableCell>
                          <TableCell className="text-xs font-bold text-right"><span className={tauxColor(totEngReports > 0 ? (totOrdReports / totEngReports) * 100 : 0)}>{formatPercent(totEngReports > 0 ? (totOrdReports / totEngReports) * 100 : 0)}</span></TableCell>
                          <TableCell className="text-xs font-bold text-blue-700 text-right">{formatMillions(totPrevJuin)}</TableCell>
                          <TableCell className="text-xs font-bold text-right"><span className={tauxColor(totReports > 0 ? (totPrevJuin / totReports) * 100 : 0)}>{formatPercent(totReports > 0 ? (totPrevJuin / totReports) * 100 : 0)}</span></TableCell>
                          <TableCell className="text-xs font-bold text-teal-700 text-right">{formatMillions(totPrevSept)}</TableCell>
                          <TableCell className="text-xs font-bold text-right"><span className={tauxColor(totReports > 0 ? (totPrevSept / totReports) * 100 : 0)}>{formatPercent(totReports > 0 ? (totPrevSept / totReports) * 100 : 0)}</span></TableCell>
                          <TableCell className="text-xs font-bold text-orange-700 text-right">{formatMillions(totPrevOct)}</TableCell>
                          <TableCell className="text-xs font-bold text-right"><span className={tauxColor(totReports > 0 ? (totPrevOct / totReports) * 100 : 0)}>{formatPercent(totReports > 0 ? (totPrevOct / totReports) * 100 : 0)}</span></TableCell>
                          <TableCell className="text-xs font-bold text-purple-700 text-right">{formatMillions(totPrevNov)}</TableCell>
                          <TableCell className="text-xs font-bold text-right"><span className={tauxColor(totReports > 0 ? (totPrevNov / totReports) * 100 : 0)}>{formatPercent(totReports > 0 ? (totPrevNov / totReports) * 100 : 0)}</span></TableCell>
                          <TableCell className="text-xs font-bold text-indigo-700 text-right">{formatMillions(totPrevDec)}</TableCell>
                          <TableCell className="text-xs font-bold text-right"><span className={tauxColor(totReports > 0 ? (totPrevDec / totReports) * 100 : 0)}>{formatPercent(totReports > 0 ? (totPrevDec / totReports) * 100 : 0)}</span></TableCell>
                        </TableRow>
                      </>
                    )
                  })()}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* ═══════════ Détail des assainissement par prestation ═══════════ */}
        <Card className="border border-gray-100 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold text-gray-800 tracking-wide uppercase">Détail des assainissement par prestation <span className="text-gray-400 font-normal">(MDh)</span></CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-rose-50/60">
                    <TableHead className="text-xs font-bold text-rose-700" rowSpan={2}>Programme</TableHead>
                    <TableHead className="text-xs font-bold text-rose-700" rowSpan={2}>Projet</TableHead>
                    <TableHead className="text-xs font-bold text-rose-700" rowSpan={2}>Entité</TableHead>
                    <TableHead className="text-xs font-bold text-rose-700" rowSpan={2}>Nomenclature</TableHead>
                    <TableHead className="text-xs font-bold text-rose-700" rowSpan={2}>N° Engagement</TableHead>
                    <TableHead className="text-xs font-bold text-rose-700" rowSpan={2}>Désignation</TableHead>
                    <TableHead className="text-xs font-bold text-rose-700 text-right" rowSpan={2}>Crédits Report</TableHead>
                    <TableHead className="text-xs font-bold text-center text-emerald-600" colSpan={2}>Engagement</TableHead>
                    <TableHead className="text-xs font-bold text-center text-blue-600" colSpan={2}>Ordonnancement</TableHead>
                    <TableHead className="text-xs font-bold text-center text-blue-600" colSpan={2}>Prév. Rep. Cum. Juin</TableHead>
                    <TableHead className="text-xs font-bold text-center text-teal-600" colSpan={2}>Prév. Rep. Cum. Sept.</TableHead>
                    <TableHead className="text-xs font-bold text-center text-orange-600" colSpan={2}>Prév. Rep. Cum. Oct.</TableHead>
                    <TableHead className="text-xs font-bold text-center text-purple-600" colSpan={2}>Prév. Rep. Cum. Nov.</TableHead>
                    <TableHead className="text-xs font-bold text-center text-indigo-600" colSpan={2}>Prév. Rep. Cum. Déc.</TableHead>
                  </TableRow>
                  <TableRow className="bg-rose-50/40">
                    <TableHead className="text-[10px] font-bold text-emerald-500 text-right">Eng. Rep.</TableHead>
                    <TableHead className="text-[10px] font-bold text-emerald-500 text-right">Taux eng.</TableHead>
                    <TableHead className="text-[10px] font-bold text-blue-500 text-right">Ord. Rep.</TableHead>
                    <TableHead className="text-[10px] font-bold text-blue-500 text-right">Taux ord.</TableHead>
                    <TableHead className="text-[10px] font-bold text-blue-500 text-right">Prév.</TableHead>
                    <TableHead className="text-[10px] font-bold text-blue-500 text-right">Taux</TableHead>
                    <TableHead className="text-[10px] font-bold text-teal-500 text-right">Prév.</TableHead>
                    <TableHead className="text-[10px] font-bold text-teal-500 text-right">Taux</TableHead>
                    <TableHead className="text-[10px] font-bold text-orange-500 text-right">Prév.</TableHead>
                    <TableHead className="text-[10px] font-bold text-orange-500 text-right">Taux</TableHead>
                    <TableHead className="text-[10px] font-bold text-purple-500 text-right">Prév.</TableHead>
                    <TableHead className="text-[10px] font-bold text-purple-500 text-right">Taux</TableHead>
                    <TableHead className="text-[10px] font-bold text-indigo-500 text-right">Prév.</TableHead>
                    <TableHead className="text-[10px] font-bold text-indigo-500 text-right">Taux</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(() => {
                    const prevMonths = ['JANVIER','FEVRIER','MARS','AVRIL','MAI','JUIN','JUILLET','AOUT','SEPTEMBRE','OCTOBRE','NOVEMBRE','DECEMBRE']
                    const prestations = filteredData
                      .map(row => {
                        const reports = row.REPORTS || 0
                        const engReports = row['ENG REPORT'] || 0
                        const ordReports = row['ORD REPORTS'] || 0
                        // Prévisions cumulées des reports
                        let cumulRep = 0
                        const cumulByMonth: Record<string,number> = {}
                        for (const m of prevMonths) {
                          cumulRep += (row[`Previsions REPORTS ${m}`] || 0)
                          cumulByMonth[m] = cumulRep
                        }
                        return {
                          programme: row.Programme || '',
                          projet: row.Projet || '',
                          entite: row.ENTITE || '',
                          nomenclature: row.NOMENCLATURE || '',
                          numEngagement: row['N° ENGAGEMENT'] || '',
                          designation: row['DETAIL DESIGNATION'] || '-',
                          reports,
                          engReports,
                          ordReports,
                          tauxEngReports: reports > 0 ? (engReports / reports) * 100 : 0,
                          tauxOrdReports: engReports > 0 ? (ordReports / engReports) * 100 : 0,
                          prevJuin: cumulByMonth['JUIN'] || 0,
                          prevSept: cumulByMonth['SEPTEMBRE'] || 0,
                          prevOct: cumulByMonth['OCTOBRE'] || 0,
                          prevNov: cumulByMonth['NOVEMBRE'] || 0,
                          prevDec: cumulByMonth['DECEMBRE'] || 0,
                        }
                      })
                      .filter(p => p.reports > 0)
                      .sort((a, b) => b.reports - a.reports)

                    const totReports = prestations.reduce((s, p) => s + p.reports, 0)
                    const totEngReports = prestations.reduce((s, p) => s + p.engReports, 0)
                    const totOrdReports = prestations.reduce((s, p) => s + p.ordReports, 0)
                    const totPrevJuin = prestations.reduce((s, p) => s + p.prevJuin, 0)
                    const totPrevSept = prestations.reduce((s, p) => s + p.prevSept, 0)
                    const totPrevOct = prestations.reduce((s, p) => s + p.prevOct, 0)
                    const totPrevNov = prestations.reduce((s, p) => s + p.prevNov, 0)
                    const totPrevDec = prestations.reduce((s, p) => s + p.prevDec, 0)

                    let currentProgramme = ''
                    return (
                      <>
                        {prestations.map((p, i) => {
                          const showProgrammeHeader = p.programme !== currentProgramme
                          currentProgramme = p.programme
                          return (
                            <TableRow key={i} className={`hover:bg-gray-50 ${showProgrammeHeader && i > 0 ? 'border-t-2 border-rose-200' : ''}`}>
                              <TableCell className="text-xs font-medium text-gray-900 whitespace-nowrap">{p.programme}</TableCell>
                              <TableCell className="text-xs text-gray-600 whitespace-nowrap">{p.projet}</TableCell>
                              <TableCell className="text-xs text-gray-600">{p.entite}</TableCell>
                              <TableCell className="text-xs text-gray-500 font-mono whitespace-nowrap">{p.nomenclature}</TableCell>
                              <TableCell className="text-xs text-gray-500 whitespace-nowrap">{p.numEngagement}</TableCell>
                              <TableCell className="text-xs text-gray-700" style={{minWidth:'250px',maxWidth:'400px',whiteSpace:'normal',lineHeight:'1.4'}}>{p.designation}</TableCell>
                              <TableCell className="text-xs text-gray-700 text-right">{formatMillions(p.reports)}</TableCell>
                              <TableCell className="text-xs text-emerald-700 text-right">{formatMillions(p.engReports)}</TableCell>
                              <TableCell className="text-xs text-right"><span className={tauxColor(p.tauxEngReports)}>{formatPercent(p.tauxEngReports)}</span></TableCell>
                              <TableCell className="text-xs text-blue-700 text-right">{formatMillions(p.ordReports)}</TableCell>
                              <TableCell className="text-xs text-right"><span className={tauxColor(p.tauxOrdReports)}>{formatPercent(p.tauxOrdReports)}</span></TableCell>
                              <TableCell className="text-xs text-blue-600 text-right">{formatMillions(p.prevJuin)}</TableCell>
                              <TableCell className="text-xs text-right"><span className={tauxColor(p.reports > 0 ? (p.prevJuin / p.reports) * 100 : 0)}>{formatPercent(p.reports > 0 ? (p.prevJuin / p.reports) * 100 : 0)}</span></TableCell>
                              <TableCell className="text-xs text-teal-600 text-right">{formatMillions(p.prevSept)}</TableCell>
                              <TableCell className="text-xs text-right"><span className={tauxColor(p.reports > 0 ? (p.prevSept / p.reports) * 100 : 0)}>{formatPercent(p.reports > 0 ? (p.prevSept / p.reports) * 100 : 0)}</span></TableCell>
                              <TableCell className="text-xs text-orange-600 text-right">{formatMillions(p.prevOct)}</TableCell>
                              <TableCell className="text-xs text-right"><span className={tauxColor(p.reports > 0 ? (p.prevOct / p.reports) * 100 : 0)}>{formatPercent(p.reports > 0 ? (p.prevOct / p.reports) * 100 : 0)}</span></TableCell>
                              <TableCell className="text-xs text-purple-600 text-right">{formatMillions(p.prevNov)}</TableCell>
                              <TableCell className="text-xs text-right"><span className={tauxColor(p.reports > 0 ? (p.prevNov / p.reports) * 100 : 0)}>{formatPercent(p.reports > 0 ? (p.prevNov / p.reports) * 100 : 0)}</span></TableCell>
                              <TableCell className="text-xs text-indigo-600 text-right">{formatMillions(p.prevDec)}</TableCell>
                              <TableCell className="text-xs text-right"><span className={tauxColor(p.reports > 0 ? (p.prevDec / p.reports) * 100 : 0)}>{formatPercent(p.reports > 0 ? (p.prevDec / p.reports) * 100 : 0)}</span></TableCell>
                            </TableRow>
                          )
                        })}
                        <TableRow className="bg-rose-50/40 font-bold">
                          <TableCell className="text-xs font-bold text-gray-900" colSpan={6}>Total ({prestations.length} prestations)</TableCell>
                          <TableCell className="text-xs font-bold text-gray-900 text-right">{formatMillions(totReports)}</TableCell>
                          <TableCell className="text-xs font-bold text-emerald-700 text-right">{formatMillions(totEngReports)}</TableCell>
                          <TableCell className="text-xs font-bold text-right"><span className={tauxColor(totReports > 0 ? (totEngReports / totReports) * 100 : 0)}>{formatPercent(totReports > 0 ? (totEngReports / totReports) * 100 : 0)}</span></TableCell>
                          <TableCell className="text-xs font-bold text-blue-700 text-right">{formatMillions(totOrdReports)}</TableCell>
                          <TableCell className="text-xs font-bold text-right"><span className={tauxColor(totEngReports > 0 ? (totOrdReports / totEngReports) * 100 : 0)}>{formatPercent(totEngReports > 0 ? (totOrdReports / totEngReports) * 100 : 0)}</span></TableCell>
                          <TableCell className="text-xs font-bold text-blue-700 text-right">{formatMillions(totPrevJuin)}</TableCell>
                          <TableCell className="text-xs font-bold text-right"><span className={tauxColor(totReports > 0 ? (totPrevJuin / totReports) * 100 : 0)}>{formatPercent(totReports > 0 ? (totPrevJuin / totReports) * 100 : 0)}</span></TableCell>
                          <TableCell className="text-xs font-bold text-teal-700 text-right">{formatMillions(totPrevSept)}</TableCell>
                          <TableCell className="text-xs font-bold text-right"><span className={tauxColor(totReports > 0 ? (totPrevSept / totReports) * 100 : 0)}>{formatPercent(totReports > 0 ? (totPrevSept / totReports) * 100 : 0)}</span></TableCell>
                          <TableCell className="text-xs font-bold text-orange-700 text-right">{formatMillions(totPrevOct)}</TableCell>
                          <TableCell className="text-xs font-bold text-right"><span className={tauxColor(totReports > 0 ? (totPrevOct / totReports) * 100 : 0)}>{formatPercent(totReports > 0 ? (totPrevOct / totReports) * 100 : 0)}</span></TableCell>
                          <TableCell className="text-xs font-bold text-purple-700 text-right">{formatMillions(totPrevNov)}</TableCell>
                          <TableCell className="text-xs font-bold text-right"><span className={tauxColor(totReports > 0 ? (totPrevNov / totReports) * 100 : 0)}>{formatPercent(totReports > 0 ? (totPrevNov / totReports) * 100 : 0)}</span></TableCell>
                          <TableCell className="text-xs font-bold text-indigo-700 text-right">{formatMillions(totPrevDec)}</TableCell>
                          <TableCell className="text-xs font-bold text-right"><span className={tauxColor(totReports > 0 ? (totPrevDec / totReports) * 100 : 0)}>{formatPercent(totReports > 0 ? (totPrevDec / totReports) * 100 : 0)}</span></TableCell>
                        </TableRow>
                      </>
                    )
                  })()}
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
      case 'previsions': return renderPrevisionsView()
      case 'assainissement': return renderAssainissementView()
      case 'reports': return renderReportsView()
      case 'settings': return renderSettingsView()
      default: return renderOverview()
    }
  }

  return (
    <AuthGuard>
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
                  <h2 className="text-base sm:text-lg font-bold text-gray-900 tracking-wide uppercase">
                    Situation d'exécution du budget d'investissement
                  </h2>
                  <p className="text-xs text-gray-500 hidden sm:block">
                    Vue consolidée par entité, projet et programme
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {isAdmin && (
                  <>
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
                  </>
                )}
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
              {['overview', 'engagements', 'ordonnancements', 'previsions', 'assainissement'].includes(activeNav) && (
              <Select value={selectedSource} onValueChange={setSelectedSource}>
                <SelectTrigger className="bg-white h-8 text-xs w-[140px]">
                  <SelectValue placeholder="Source fin." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes sources</SelectItem>
                  {sources.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
              )}
              {activeNav !== 'program' && activeNav !== 'entity' && (
              <Select value={selectedProgramme} onValueChange={(v) => { setSelectedProgramme(v); setSelectedProjet('all'); setSelectedEntite('all'); }}>
                <SelectTrigger className="bg-white h-8 text-xs w-[140px]">
                  <SelectValue placeholder="Programme" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les programmes</SelectItem>
                  {filters.programmes.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>
              )}
              {activeNav !== 'project' && activeNav !== 'entity' && (
              <Select value={selectedProjet} onValueChange={(v) => { setSelectedProjet(v); setSelectedEntite('all'); }}>
                <SelectTrigger className="bg-white h-8 text-xs w-[150px]">
                  <SelectValue placeholder="Projet" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les projets</SelectItem>
                  {filteredProjets.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                </SelectContent>
              </Select>
              )}
              {activeNav !== 'project' && activeNav !== 'program' && (
              <Select value={selectedEntite} onValueChange={setSelectedEntite}>
                <SelectTrigger className="bg-white h-8 text-xs w-[140px]">
                  <SelectValue placeholder="entité" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les entités</SelectItem>
                  {filteredEntites.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}
                </SelectContent>
              </Select>
              )}
              {activeNav !== 'program' && activeNav !== 'project' && activeNav !== 'entity' && (
              <Select value={selectedNomenclature} onValueChange={setSelectedNomenclature}>
                <SelectTrigger className="bg-white h-8 text-xs w-[140px]">
                  <SelectValue placeholder="Nomenclature" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes nomenclatures</SelectItem>
                  {nomenclatures.map(n => <SelectItem key={n} value={n}>{n}</SelectItem>)}
                </SelectContent>
              </Select>
              )}
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
                {(activeNav === 'reports' || activeNav === 'assainissement')
                  ? `${filteredData.filter(r => (r.REPORTS || 0) > 0).length} lignes (reports)`
                  : `${filteredData.length} lignes`}
              </Badge>
            </div>
          </div>
        </header>

        <div className="p-4 sm:p-6 space-y-6">
          {renderActiveView()}
        </div>
      </main>
    </div>
    </AuthGuard>
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
        <TableCell className="text-xs font-bold text-gray-900">
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
