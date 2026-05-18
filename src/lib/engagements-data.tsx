export type StatutEngagement = 'Validé' | 'En cours' | 'En retard' | 'Annulé' | 'Planifié'
export type CategorieEngagement = 'Infrastructure' | 'Éducation' | 'Santé' | 'Agriculture' | 'Transport' | 'Énergie'

export interface Engagement {
  id: string
  reference: string
  objet: string
  beneficiaire: string
  montant: number
  montantConsomme: number
  categorie: CategorieEngagement
  statut: StatutEngagement
  echeance: string
  dateCreation: string
  tauxRealisation: number
  description: string
}

export const engagements: Engagement[] = [
  {
    id: '1',
    reference: 'ENG-2026-001',
    objet: 'Construction route nationale RN7',
    beneficiaire: 'Société BTP Atlas',
    montant: 45000000,
    montantConsomme: 32000000,
    categorie: 'Transport',
    statut: 'En cours',
    echeance: '2026-12-31',
    dateCreation: '2025-09-15',
    tauxRealisation: 71,
    description: 'Réhabilitation de 45 km de route nationale reliant deux préfectures'
  },
  {
    id: '2',
    reference: 'ENG-2026-002',
    objet: 'Équipement hôpital régional',
    beneficiaire: 'Ministère de la Santé',
    montant: 28000000,
    montantConsomme: 28000000,
    categorie: 'Santé',
    statut: 'Validé',
    echeance: '2026-03-01',
    dateCreation: '2025-07-20',
    tauxRealisation: 100,
    description: 'Fourniture et installation d\'équipements médicaux pour l\'hôpital régional'
  },
  {
    id: '3',
    reference: 'ENG-2026-003',
    objet: 'Programme alphabétisation rurale',
    beneficiaire: 'ONG Éducation Pour Tous',
    montant: 8500000,
    montantConsomme: 6200000,
    categorie: 'Éducation',
    statut: 'En cours',
    echeance: '2026-06-30',
    dateCreation: '2025-10-01',
    tauxRealisation: 73,
    description: 'Formation de 5000 adultes en zones rurales'
  },
  {
    id: '4',
    reference: 'ENG-2026-004',
    objet: 'Construction barrage hydroélectrique',
    beneficiaire: 'Énergie Nationale SARL',
    montant: 120000000,
    montantConsomme: 45000000,
    categorie: 'Énergie',
    statut: 'En retard',
    echeance: '2026-08-15',
    dateCreation: '2025-01-10',
    tauxRealisation: 38,
    description: 'Barrage de 50 MW sur le fleuve principal'
  },
  {
    id: '5',
    reference: 'ENG-2026-005',
    objet: 'Système irrigation vallée du Sud',
    beneficiaire: 'Coopérative Agricole Soleil',
    montant: 15000000,
    montantConsomme: 15000000,
    categorie: 'Agriculture',
    statut: 'Validé',
    echeance: '2025-12-31',
    dateCreation: '2025-03-15',
    tauxRealisation: 100,
    description: 'Réseau d\'irrigation goutte-à-goutte pour 2000 hectares'
  },
  {
    id: '6',
    reference: 'ENG-2026-006',
    objet: 'Rénovation école primaire centre-ville',
    beneficiaire: 'Mairie de la Commune',
    montant: 5200000,
    montantConsomme: 3900000,
    categorie: 'Éducation',
    statut: 'En cours',
    echeance: '2026-05-01',
    dateCreation: '2025-11-20',
    tauxRealisation: 75,
    description: 'Rénovation complète de 12 salles de classe'
  },
  {
    id: '7',
    reference: 'ENG-2026-007',
    objet: 'Pose de panneaux solaires région Est',
    beneficiaire: 'GreenTech Solutions',
    montant: 22000000,
    montantConsomme: 8800000,
    categorie: 'Énergie',
    statut: 'En cours',
    echeance: '2026-09-30',
    dateCreation: '2025-12-01',
    tauxRealisation: 40,
    description: 'Installation de 5000 panneaux solaires pour électrification rurale'
  },
  {
    id: '8',
    reference: 'ENG-2026-008',
    objet: 'Pont sur le fleuve Komba',
    beneficiaire: 'Société BTP Atlas',
    montant: 35000000,
    montantConsomme: 7000000,
    categorie: 'Infrastructure',
    statut: 'En retard',
    echeance: '2026-04-15',
    dateCreation: '2025-02-10',
    tauxRealisation: 20,
    description: 'Construction d\'un pont de 200m reliant deux districts'
  },
  {
    id: '9',
    reference: 'ENG-2026-009',
    objet: 'Centre de santé maternelle',
    beneficiaire: 'Fondation Santé Mère-Enfant',
    montant: 12000000,
    montantConsomme: 12000000,
    categorie: 'Santé',
    statut: 'Validé',
    echeance: '2026-01-15',
    dateCreation: '2025-05-20',
    tauxRealisation: 100,
    description: 'Construction et équipement d\'un centre de santé maternelle'
  },
  {
    id: '10',
    reference: 'ENG-2026-010',
    objet: 'Distribution semences améliorées',
    beneficiaire: 'Coopérative Agricole Soleil',
    montant: 6800000,
    montantConsomme: 5440000,
    categorie: 'Agriculture',
    statut: 'En cours',
    echeance: '2026-07-31',
    dateCreation: '2026-01-15',
    tauxRealisation: 80,
    description: 'Distribution de semences améliorées à 3000 agriculteurs'
  },
  {
    id: '11',
    reference: 'ENG-2026-011',
    objet: 'Aéroport régional piste secondaire',
    beneficiaire: 'Autorité Aéroportuaire',
    montant: 75000000,
    montantConsomme: 0,
    categorie: 'Transport',
    statut: 'Planifié',
    echeance: '2027-12-31',
    dateCreation: '2026-03-01',
    tauxRealisation: 0,
    description: 'Construction d\'une piste secondaire pour l\'aéroport régional'
  },
  {
    id: '12',
    reference: 'ENG-2026-012',
    objet: 'Réseau fibre optique provincial',
    beneficiaire: 'Telecom National',
    montant: 40000000,
    montantConsomme: 24000000,
    categorie: 'Infrastructure',
    statut: 'En cours',
    echeance: '2026-10-31',
    dateCreation: '2025-06-01',
    tauxRealisation: 60,
    description: 'Déploiement de 500 km de fibre optique dans 3 provinces'
  },
  {
    id: '13',
    reference: 'ENG-2026-013',
    objet: 'Formation professionnelle jeunes',
    beneficiaire: 'Institut Technique National',
    montant: 9500000,
    montantConsomme: 9500000,
    categorie: 'Éducation',
    statut: 'Validé',
    echeance: '2026-02-28',
    dateCreation: '2025-08-15',
    tauxRealisation: 100,
    description: 'Formation de 2000 jeunes dans les métiers du bâtiment'
  },
  {
    id: '14',
    reference: 'ENG-2026-014',
    objet: 'Station de traitement des eaux',
    beneficiaire: 'Eau & Assainissement SA',
    montant: 33000000,
    montantConsomme: 16500000,
    categorie: 'Infrastructure',
    statut: 'En retard',
    echeance: '2026-05-30',
    dateCreation: '2025-04-01',
    tauxRealisation: 50,
    description: 'Construction d\'une station de traitement de 50 000 m³/jour'
  },
  {
    id: '15',
    reference: 'ENG-2026-015',
    objet: 'Campagne vaccination nationale',
    beneficiaire: 'Ministère de la Santé',
    montant: 18000000,
    montantConsomme: 14400000,
    categorie: 'Santé',
    statut: 'En cours',
    echeance: '2026-08-31',
    dateCreation: '2025-09-01',
    tauxRealisation: 80,
    description: 'Vaccination de 2 millions d\'enfants contre la poliomyélite'
  },
  {
    id: '16',
    reference: 'ENG-2026-016',
    objet: 'Marché couvert zone urbaine',
    beneficiaire: 'Mairie de la Commune',
    montant: 11000000,
    montantConsomme: 11000000,
    categorie: 'Infrastructure',
    statut: 'Validé',
    echeance: '2026-01-31',
    dateCreation: '2025-07-01',
    tauxRealisation: 100,
    description: 'Construction d\'un marché couvert de 200 stands'
  },
  {
    id: '17',
    reference: 'ENG-2026-017',
    objet: 'Projet agricole intégré Nord',
    beneficiaire: 'AgriDev International',
    montant: 25000000,
    montantConsomme: 5000000,
    categorie: 'Agriculture',
    statut: 'En retard',
    echeance: '2026-06-15',
    dateCreation: '2025-10-10',
    tauxRealisation: 20,
    description: 'Projet intégré agriculture-élevage dans la région Nord'
  },
  {
    id: '18',
    reference: 'ENG-2026-018',
    objet: 'Ligne électrique haute tension',
    beneficiaire: 'Énergie Nationale SARL',
    montant: 55000000,
    montantConsomme: 22000000,
    categorie: 'Énergie',
    statut: 'En cours',
    echeance: '2027-03-31',
    dateCreation: '2025-11-15',
    tauxRealisation: 40,
    description: 'Construction de 120 km de ligne HT 220kV'
  },
  {
    id: '19',
    reference: 'ENG-2026-019',
    objet: 'Gare routière moderne',
    beneficiaire: 'Autorité Transports Terrestres',
    montant: 20000000,
    montantConsomme: 20000000,
    categorie: 'Transport',
    statut: 'Validé',
    echeance: '2026-02-15',
    dateCreation: '2025-06-10',
    tauxRealisation: 100,
    description: 'Construction d\'une gare routière avec capacité de 50 bus'
  },
  {
    id: '20',
    reference: 'ENG-2026-020',
    objet: 'Étude faisabilité port maritime',
    beneficiaire: 'Maritime Consulting Group',
    montant: 8000000,
    montantConsomme: 2400000,
    categorie: 'Transport',
    statut: 'Annulé',
    echeance: '2026-04-30',
    dateCreation: '2025-08-05',
    tauxRealisation: 30,
    description: 'Étude de faisabilité pour la construction d\'un port en eau profonde'
  }
]

export const engagementsParMois = [
  { mois: 'Jan', crees: 3, valides: 2 },
  { mois: 'Fév', crees: 2, valides: 1 },
  { mois: 'Mar', crees: 4, valides: 3 },
  { mois: 'Avr', crees: 1, valides: 2 },
  { mois: 'Mai', crees: 3, valides: 1 },
  { mois: 'Jun', crees: 2, valides: 4 },
  { mois: 'Jul', crees: 5, valides: 2 },
  { mois: 'Aoû', crees: 2, valides: 3 },
  { mois: 'Sep', crees: 3, valides: 2 },
  { mois: 'Oct', crees: 4, valides: 1 },
  { mois: 'Nov', crees: 2, valides: 3 },
  { mois: 'Déc', crees: 1, valides: 2 }
]

export const evolutionTaux = [
  { mois: 'Jan', taux: 45 },
  { mois: 'Fév', taux: 48 },
  { mois: 'Mar', taux: 52 },
  { mois: 'Avr', taux: 55 },
  { mois: 'Mai', taux: 58 },
  { mois: 'Jun', taux: 62 },
  { mois: 'Jul', taux: 59 },
  { mois: 'Aoû', taux: 63 },
  { mois: 'Sep', taux: 67 },
  { mois: 'Oct', taux: 70 },
  { mois: 'Nov', taux: 72 },
  { mois: 'Déc', taux: 75 }
]

export const repartitionCategorie = [
  { name: 'Infrastructure', value: 3, color: '#10b981' },
  { name: 'Éducation', value: 3, color: '#3b82f6' },
  { name: 'Santé', value: 3, color: '#ef4444' },
  { name: 'Agriculture', value: 3, color: '#f59e0b' },
  { name: 'Transport', value: 4, color: '#8b5cf6' },
  { name: 'Énergie', value: 3, color: '#06b6d4' }
]

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('fr-FR', { style: 'decimal', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount) + ' FCFA'
}

export function formatShortCurrency(amount: number): string {
  if (amount >= 1000000000) return (amount / 1000000000).toFixed(1) + ' Mrd'
  if (amount >= 1000000) return (amount / 1000000).toFixed(1) + ' M'
  if (amount >= 1000) return (amount / 1000).toFixed(0) + ' K'
  return amount.toString()
}
