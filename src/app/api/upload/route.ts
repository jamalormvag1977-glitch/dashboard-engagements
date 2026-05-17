import { NextResponse } from 'next/server'
import * as XLSX from 'xlsx'
import { put } from '@vercel/blob'
import fs from 'fs'
import path from 'path'

// Column name mapping from French Excel headers to dashboard field names
const COLUMN_MAP: Record<string, string> = {
  'Programme': 'Programme',
  'Projet': 'Projet',
  'ENTITE': 'ENTITE',
  'N° ENGAGEMENT': 'N° ENGAGEMENT',
  'N°ENGAGEMENT': 'N° ENGAGEMENT',
  'N ENGAGEMENT': 'N° ENGAGEMENT',
  'N°Engagement': 'N° ENGAGEMENT',
  'NOMENCLATURE': 'NOMENCLATURE',
  'Nomenclature': 'NOMENCLATURE',
  'DETAIL DESIGNATION': 'DETAIL DESIGNATION',
  'Détail désignation': 'DETAIL DESIGNATION',
  'Detail Designation': 'DETAIL DESIGNATION',
  'DESIGNATION': 'DETAIL DESIGNATION',
  'Désignation': 'DETAIL DESIGNATION',
  'SOURCE FINANCEMENT': 'SOURCE FINANCEMENT',
  'Source de financement': 'SOURCE FINANCEMENT',
  'Source Financement': 'SOURCE FINANCEMENT',
  'REPORTS': 'REPORTS',
  'Reports': 'REPORTS',
  'Crédits de report': 'REPORTS',
  'CONSOLIDES': 'CONSOLIDES',
  'Consolidés': 'CONSOLIDES',
  'Crédits consolidés': 'CONSOLIDES',
  'NOUVEAUX': 'NOUVEAUX',
  'Nouveaux': 'NOUVEAUX',
  'Crédits nouveaux': 'NOUVEAUX',
  'TOTAL CP': 'TOTAL CP',
  'Total CP': 'TOTAL CP',
  'CE CONSOLIDES': 'CE CONSOLIDES',
  'CE CONSOLIDÉS': 'CE CONSOLIDES',
  'CE NOUVEAUX': 'CE NOUVEAUX',
  'TOTAL CE': 'TOTAL CE',
  'Total CE': 'TOTAL CE',
  'ENG REPORT': 'ENG REPORT',
  'Eng. Report': 'ENG REPORT',
  'Eng Report': 'ENG REPORT',
  'ENG CONSOLIDES': 'ENG CONSOLIDES',
  'Eng. Consolidés': 'ENG CONSOLIDES',
  'Eng Consolidés': 'ENG CONSOLIDES',
  'ENG NOUVEAUX': 'ENG NOUVEAUX',
  'Eng. Nouveaux': 'ENG NOUVEAUX',
  'Eng Nouveaux': 'ENG NOUVEAUX',
  'ENG CP TOTAL': 'ENG CP TOTAL',
  'Eng. CP Total': 'ENG CP TOTAL',
  'ENG CE ULT': 'ENG CE ULT',
  'Eng. CE': 'ENG CE ULT',
  'ORD REPORTS': 'ORD REPORTS',
  'Ord. Reports': 'ORD REPORTS',
  'Ord Reports': 'ORD REPORTS',
  'ORD CONSOLIDES': 'ORD CONSOLIDES',
  'Ord. Consolidés': 'ORD CONSOLIDES',
  'ORD NOUVEAUX': 'ORD NOUVEAUX',
  'Ord. Nouveaux': 'ORD NOUVEAUX',
  'ORD TOTAL': 'ORD TOTAL',
  'Ord. Total': 'ORD TOTAL',
  'PAIEMENTS SUR REPORTS': 'PAIEMENTS SUR REPORTS',
  'Paiements Reports': 'PAIEMENTS SUR REPORTS',
  'PAIEMENTS SUR CONSOLIDES': 'PAIEMENTS SUR CONSOLIDES',
  'Paiements Consolidés': 'PAIEMENTS SUR CONSOLIDES',
  'PAIEMENTS SUR NOUVEAUX': 'PAIEMENTS SUR NOUVEAUX',
  'Paiements Nouveaux': 'PAIEMENTS SUR NOUVEAUX',
  'PAIEMENTS TOTAL': 'PAIEMENTS TOTAL',
  'Paiements Total': 'PAIEMENTS TOTAL',
  'TOTAL PREV': 'TOTAL PREV',
  'Total Prév': 'TOTAL PREV',
  'TRESORERIE': 'TRESORERIE',
  'Trésorerie': 'TRESORERIE',
  'SUBVENTION DEMANDEE': 'SUBVENTION DEMANDEE',
  'Subvention demandée': 'SUBVENTION DEMANDEE',
}

// Prevision month mapping
const PREV_MONTHS = ['JANVIER', 'FEVRIER', 'MARS', 'AVRIL', 'MAI', 'JUIN', 'JUILLET', 'AOUT', 'SEPTEMBRE', 'OCTOBRE', 'NOVEMBRE', 'DECEMBRE']
const PREV_TYPES = ['REPORTS', 'CONSOLIDES', 'NOUVEAUX']

function normalizeColumnName(col: string): string {
  // Check direct map first
  if (COLUMN_MAP[col]) return COLUMN_MAP[col]
  // Check case-insensitive
  const lower = col.toLowerCase().trim()
  for (const [key, value] of Object.entries(COLUMN_MAP)) {
    if (key.toLowerCase() === lower) return value
  }
  // Check Prevision columns: "Prév. Reports Cum. Juin" -> "Previsions REPORTS JUIN"
  for (const type of PREV_TYPES) {
    for (const month of PREV_MONTHS) {
      const patterns = [
        `Prév. ${type.charAt(0) + type.slice(1).toLowerCase()} Cum. ${month.charAt(0) + month.slice(1).toLowerCase()}`,
        `Prév ${type} ${month}`,
        `Previsions ${type} ${month}`,
        `Prévisions ${type.charAt(0) + type.slice(1).toLowerCase()} ${month.charAt(0) + month.slice(1).toLowerCase()}`,
        `Prev ${type} ${month}`,
        `Prév. ${type} ${month.charAt(0) + month.slice(1).toLowerCase()}`,
        `Prévisions ${type} cumulées ${month.charAt(0) + month.slice(1).toLowerCase()}`,
      ]
      for (const pattern of patterns) {
        if (lower === pattern.toLowerCase()) return `Previsions ${type} ${month}`
      }
    }
  }
  // Return original if no mapping found
  return col
}

function getDataFilePath(): string {
  const standalonePath = path.join(process.cwd(), '..', '..', 'data', 'dashboard-data.json')
  const directPath = path.join(process.cwd(), 'data', 'dashboard-data.json')
  if (fs.existsSync(standalonePath)) return standalonePath
  if (fs.existsSync(directPath)) return directPath
  return directPath
}

export const maxDuration = 60 // Allow up to 60 seconds for upload processing

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'Aucun fichier fourni' }, { status: 400 })
    }

    // Read file as ArrayBuffer and parse with xlsx
    const buffer = Buffer.from(await file.arrayBuffer())
    const workbook = XLSX.read(buffer, { type: 'buffer' })

    // Use first sheet
    const sheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]

    // Convert to JSON with headers
    const rawData: Record<string, unknown>[] = XLSX.utils.sheet_to_json(worksheet, { defval: 0 })

    if (rawData.length === 0) {
      return NextResponse.json({ error: 'Le fichier est vide ou le format est incorrect' }, { status: 400 })
    }

    // Normalize column names and types
    const normalizedData = rawData.map(row => {
      const normalized: Record<string, unknown> = {}
      for (const [key, value] of Object.entries(row)) {
        const normKey = normalizeColumnName(key)
        // Convert numeric strings to numbers
        if (typeof value === 'string') {
          const num = parseFloat(value.replace(/\s/g, '').replace(',', '.'))
          if (!isNaN(num) && /^[\d\s,.]+$/.test(value.trim())) {
            normalized[normKey] = num
          } else {
            normalized[normKey] = value.trim()
          }
        } else {
          normalized[normKey] = value
        }
      }

      // Ensure Programme and Projet are set
      if (!normalized['Programme'] || normalized['Programme'] === '') {
        normalized['Programme'] = normalized['ENTITE'] || 'Non classé'
      }
      if (!normalized['Projet'] || normalized['Projet'] === '') {
        normalized['Projet'] = normalized['ENTITE'] || 'Non classé'
      }

      // Ensure required numeric fields default to 0
      const requiredNumericFields = [
        'REPORTS', 'CONSOLIDES', 'NOUVEAUX', 'TOTAL CP',
        'CE CONSOLIDES', 'CE NOUVEAUX', 'TOTAL CE',
        'ENG REPORT', 'ENG CONSOLIDES', 'ENG NOUVEAUX', 'ENG CP TOTAL', 'ENG CE ULT',
        'ORD REPORTS', 'ORD CONSOLIDES', 'ORD NOUVEAUX', 'ORD TOTAL',
        'PAIEMENTS SUR REPORTS', 'PAIEMENTS SUR CONSOLIDES', 'PAIEMENTS SUR NOUVEAUX', 'PAIEMENTS TOTAL',
        'TOTAL PREV', 'TRESORERIE', 'SUBVENTION DEMANDEE',
      ]
      for (const field of requiredNumericFields) {
        if (normalized[field] === undefined || normalized[field] === null || isNaN(normalized[field] as number)) {
          normalized[field] = 0
        }
      }

      // Ensure prevision fields
      for (const type of PREV_TYPES) {
        for (const month of PREV_MONTHS) {
          const key = `Previsions ${type} ${month}`
          if (normalized[key] === undefined || normalized[key] === null || isNaN(normalized[key] as number)) {
            normalized[key] = 0
          }
        }
      }

      return normalized
    })

    // Build filters
    const programmes = [...new Set(normalizedData.map(r => r['Programme'] as string).filter(Boolean))].sort()
    const projets = [...new Set(normalizedData.map(r => r['Projet'] as string).filter(Boolean))].sort()
    const entites = [...new Set(normalizedData.map(r => r['ENTITE'] as string).filter(Boolean))].sort()
    const nomenclatures = [...new Set(normalizedData.map(r => String(r['NOMENCLATURE'] || '')).filter(Boolean))].sort()
    const sources = [...new Set(normalizedData.map(r => r['SOURCE FINANCEMENT'] as string).filter(Boolean))].sort()

    const payload = {
      data: normalizedData,
      filters: { programmes, projets, entites, nomenclatures, sources },
      totalCount: normalizedData.length,
      lastUpdated: new Date().toISOString(),
    }

    // Save to Vercel Blob (production)
    const isVercelBlobAvailable = !!process.env.BLOB_READ_WRITE_TOKEN
    if (isVercelBlobAvailable) {
      try {
        await put('dashboard-data.json', JSON.stringify(payload), {
          access: 'public',
          contentType: 'application/json',
          allowOverwrite: true,
        })
        console.log('Data saved to Vercel Blob')
      } catch (blobError) {
        console.error('Blob save failed:', blobError)
      }
    }

    // Also save to local file (development / backup)
    try {
      const dataFile = getDataFilePath()
      const dataDir = path.dirname(dataFile)
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true })
      }
      fs.writeFileSync(dataFile, JSON.stringify(payload), 'utf-8')
      console.log('Data saved to local file')
    } catch (fsError) {
      console.log('Local file save skipped (expected on Vercel)')
    }

    return NextResponse.json({
      success: true,
      count: normalizedData.length,
      lastUpdated: payload.lastUpdated,
      sheetName,
    })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({
      error: `Erreur de traitement: ${(error as Error).message}`,
    }, { status: 500 })
  }
}
