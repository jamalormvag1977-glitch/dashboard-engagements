'use client'

import { useState, useMemo } from 'react'
import { engagements, formatCurrency, StatutEngagement, CategorieEngagement } from '@/lib/engagements-data'
import { useAuthStore, UserRole } from '@/lib/auth-store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import { Search, Filter, Download, Plus, Eye, Edit, Trash2 } from 'lucide-react'

const statutColors: Record<StatutEngagement, string> = {
  'Validé': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800',
  'En cours': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800',
  'En retard': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800',
  'Annulé': 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 border-gray-200 dark:border-gray-700',
  'Planifié': 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800',
}

export function EngagementsTable() {
  const role = useAuthStore((s) => s.role)
  const [search, setSearch] = useState('')
  const [filterStatut, setFilterStatut] = useState<string>('all')
  const [filterCategorie, setFilterCategorie] = useState<string>('all')

  const filtered = useMemo(() => {
    return engagements.filter((e) => {
      const matchSearch =
        search === '' ||
        e.reference.toLowerCase().includes(search.toLowerCase()) ||
        e.objet.toLowerCase().includes(search.toLowerCase()) ||
        e.beneficiaire.toLowerCase().includes(search.toLowerCase())
      const matchStatut = filterStatut === 'all' || e.statut === filterStatut
      const matchCategorie = filterCategorie === 'all' || e.categorie === filterCategorie
      return matchSearch && matchStatut && matchCategorie
    })
  }, [search, filterStatut, filterCategorie])

  const categories: CategorieEngagement[] = ['Infrastructure', 'Éducation', 'Santé', 'Agriculture', 'Transport', 'Énergie']
  const statuts: StatutEngagement[] = ['Validé', 'En cours', 'En retard', 'Annulé', 'Planifié']

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <CardTitle className="text-base font-semibold text-gray-900 dark:text-gray-100">
            Liste des Engagements ({filtered.length})
          </CardTitle>
          {role === 'admin' && (
            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white">
              <Plus className="h-4 w-4 mr-1" /> Nouveau
            </Button>
          )}
        </div>
        <div className="flex flex-col sm:flex-row gap-3 mt-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Rechercher par référence, objet, bénéficiaire..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={filterStatut} onValueChange={setFilterStatut}>
            <SelectTrigger className="w-full sm:w-[160px]">
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              {statuts.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterCategorie} onValueChange={setFilterCategorie}>
            <SelectTrigger className="w-full sm:w-[170px]">
              <SelectValue placeholder="Catégorie" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes catégories</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50 dark:bg-gray-900/50">
                <TableHead className="text-xs font-semibold">Référence</TableHead>
                <TableHead className="text-xs font-semibold">Objet</TableHead>
                <TableHead className="text-xs font-semibold">Bénéficiaire</TableHead>
                <TableHead className="text-xs font-semibold text-right">Montant</TableHead>
                <TableHead className="text-xs font-semibold text-right">Consommé</TableHead>
                <TableHead className="text-xs font-semibold text-center">Réalisation</TableHead>
                <TableHead className="text-xs font-semibold text-center">Statut</TableHead>
                <TableHead className="text-xs font-semibold">Échéance</TableHead>
                {role === 'admin' && <TableHead className="text-xs font-semibold text-center">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((eng) => (
                <TableRow key={eng.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/30 transition-colors">
                  <TableCell className="font-mono text-xs font-medium text-emerald-600 dark:text-emerald-400">
                    {eng.reference}
                  </TableCell>
                  <TableCell className="text-sm max-w-[200px] truncate" title={eng.objet}>
                    {eng.objet}
                  </TableCell>
                  <TableCell className="text-sm text-gray-600 dark:text-gray-400 max-w-[150px] truncate" title={eng.beneficiaire}>
                    {eng.beneficiaire}
                  </TableCell>
                  <TableCell className="text-sm text-right font-medium">
                    {formatCurrency(eng.montant)}
                  </TableCell>
                  <TableCell className="text-sm text-right text-gray-500 dark:text-gray-400">
                    {formatCurrency(eng.montantConsomme)}
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-16 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            eng.tauxRealisation >= 80 ? 'bg-emerald-500' :
                            eng.tauxRealisation >= 50 ? 'bg-amber-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${eng.tauxRealisation}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium w-8 text-right">{eng.tauxRealisation}%</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="outline" className={`text-xs ${statutColors[eng.statut]}`}>
                      {eng.statut}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-gray-500 dark:text-gray-400">
                    {new Date(eng.echeance).toLocaleDateString('fr-FR')}
                  </TableCell>
                  {role === 'admin' && (
                    <TableCell>
                      <div className="flex items-center justify-center gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400 hover:text-blue-600">
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400 hover:text-emerald-600">
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400 hover:text-red-600">
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        {filtered.length === 0 && (
          <div className="text-center py-12 text-gray-400 dark:text-gray-500">
            <Search className="h-10 w-10 mx-auto mb-3 opacity-50" />
            <p className="text-sm">Aucun engagement trouvé</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
