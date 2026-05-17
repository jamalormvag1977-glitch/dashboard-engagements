import { NextResponse } from 'next/server'
import * as XLSX from 'xlsx'
import { put } from '@vercel/blob'
import fs from 'fs'
import path from 'path'

export const maxDuration = 60 // Allow up to 60 seconds for upload processing

// Column name mapping: Excel header → dashboard field name
const COLUMN_MAP: Record<string, string> = {
  'PROJET': 'Programme',
  'GROUPE': 'Projet',
  'Programme': 'Programme',
  'Projet': 'Projet',
  'ENTITE': 'ENTITE',
  'N° ENGAGEMENT': 'N° ENGAGEMENT',
  'N°ENGAGEMENT': 'N° ENGAGEMENT',
  'N ENGAGEMENT': 'N° ENGAGEMENT',
  'NOMENCLATURE': 'NOMENCLATURE',
  'DETAIL DESIGNATION': 'DETAIL DESIGNATION',
  'Détail désignation': 'DETAIL DESIGNATION',
  'Detail Designation': 'DETAIL DESIGNATION',
  'DESIGNATION': 'DETAIL DESIGNATION',
  'Désignation': 'DETAIL DESIGNATION',
  'SOURCE FINANCEMENT': 'SOURCE FINANCEMENT',
  'Source de financement': 'SOURCE FINANCEMENT',
  'REPORTS': 'REPORTS',
  'Reports': 'REPORTS',
  'Crédits de report': 'REPORTS',
  'CONSOLIDES': 'CONSOLIDES',
  'Consolidés': 'CONSOLIDES',
  'NOUVEAUX': 'NOUVEAUX',
  'Nouveaux': 'NOUVEAUX',
  'CP': 'CP',
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
  'ENG NOUVEAUX': 'ENG NOUVEAUX',
  'Eng. Nouveaux': 'ENG NOUVEAUX',
  'ENG CP TOTAL': 'ENG CP TOTAL',
  'Eng. CP Total': 'ENG CP TOTAL',
  'ENG CE ULT': 'ENG CE ULT',
  'Eng. CE': 'ENG CE ULT',
  'ORD REPORTS': 'ORD REPORTS',
  'Ord. Reports': 'ORD REPORTS',
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

// Prevision months
const PREV_MONTHS = ['JANVIER', 'FEVRIER', 'MARS', 'AVRIL', 'MAI', 'JUIN', 'JUILLET', 'AOUT', 'SEPTEMBRE', 'OCTOBRE', 'NOVEMBRE', 'DECEMBRE']
const PREV_TYPES = ['REPORTS', 'CONSOLIDES', 'NOUVEAUX']

function normalizeColumnName(col: string): string {
  const trimmed = col.trim()
  // Check direct map first
  if (COLUMN_MAP[trimmed]) return COLUMN_MAP[trimmed]
  // Check case-insensitive
  const lower = trimmed.toLowerCase()
  for (const [key, value] of Object.entries(COLUMN_MAP)) {
    if (key.toLowerCase() === lower) return value
  }
  // Check Prevision columns
  if (trimmed.startsWith('Previsions ') || trimmed.startsWith('Prévisions ') || trimmed.startsWith('Prév.')) {
    for (const type of PREV_TYPES) {
      for (const month of PREV_MONTHS) {
        const target = `Previsions ${type} ${month}`
        if (trimmed === target) return target
        // Try various formats
        const patterns = [
          `Previsions ${type} ${month}`,
          `Prévisions ${type.charAt(0) + type.slice(1).toLowerCase()} ${month.charAt(0) + month.slice(1).toLowerCase()}`,
          `Prév. ${type.charAt(0) + type.slice(1).toLowerCase()} Cum. ${month.charAt(0) + month.slice(1).toLowerCase()}`,
        ]
        for (const pattern of patterns) {
          if (lower === pattern.toLowerCase()) return target
        }
      }
    }
  }
  return trimmed
}

function toNumber(value: unknown): number {
  if (typeof value === 'number') return value
  if (typeof value === 'string') {
    if (value.trim() === '' || value.trim() === '-') return 0
    const num = parseFloat(value.replace(/\s/g, '').replace(',', '.'))
    return isNaN(num) ? 0 : num
  }
  return 0
}

function toString(value: unknown): string {
  if (value === null || value === undefined) return ''
  return String(value).trim()
}

function getDataFilePath(): string {
  const standalonePath = path.join(process.cwd(), '..', '..', 'data', 'dashboard-data.json')
  const directPath = path.join(process.cwd(), 'data', 'dashboard-data.json')
  if (fs.existsSync(standalonePath)) return standalonePath
  if (fs.existsSync(directPath)) return directPath
  return directPath
}

// Find the header row by looking for known column names
function findHeaderRow(rows: unknown[][]): number {
  const knownHeaders = ['PROJET', 'Programme', 'ENTITE', 'NOMENCLATURE', 'REPORTS', 'TOTAL CP']
  for (let i = 0; i < Math.min(rows.length, 10); i++) {
    const row = rows[i]
    if (!row) continue
    const rowStr = row.map(c => String(c || '').trim().toUpperCase())
    const matchCount = knownHeaders.filter(h => rowStr.includes(h.toUpperCase())).length
    if (matchCount >= 3) return i
  }
  return -1
}

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

    // Read all rows as arrays first (to find header row)
    const allRows: unknown[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '', blankrows: false })

    if (allRows.length === 0) {
      return NextResponse.json({ error: 'Le fichier est vide' }, { status: 400 })
    }

    // Find header row automatically
    const headerRowIndex = findHeaderRow(allRows)
    if (headerRowIndex === -1) {
      return NextResponse.json({ error: 'En-têtes non trouvés. Vérifiez le format du fichier Excel.' }, { status: 400 })
    }

    const headers = allRows[headerRowIndex].map(h => String(h || '').trim())
    const dataRows = allRows.slice(headerRowIndex + 1).filter(row => row && row.length > 0 && row.some(c => c !== '' && c !== 0))

    // Map column index to normalized field name
    const colMap: Record<number, string> = {}
    headers.forEach((h, i) => {
      if (h) {
        colMap[i] = normalizeColumnName(h)
      }
    })

    // Build normalized data
    const normalizedData = dataRows.map(row => {
      const normalized: Record<string, unknown> = {}
      for (const [colIdx, fieldName] of Object.entries(colMap)) {
        const rawValue = row[Number(colIdx)]
        // Determine if this should be a number or string field
        const numericFields = [
          'REPORTS', 'CONSOLIDES', 'NOUVEAUX', 'CP', 'TOTAL CP',
          'CE CONSOLIDES', 'CE NOUVEAUX', 'TOTAL CE',
          'ENG REPORT', 'ENG CONSOLIDES', 'ENG NOUVEAUX', 'ENG CP TOTAL', 'ENG CE ULT',
          'ORD REPORTS', 'ORD CONSOLIDES', 'ORD NOUVEAUX', 'ORD TOTAL',
          'PAIEMENTS SUR REPORTS', 'PAIEMENTS SUR CONSOLIDES', 'PAIEMENTS SUR NOUVEAUX', 'PAIEMENTS TOTAL',
          'TOTAL PREV', 'TRESORERIE', 'SUBVENTION DEMANDEE',
        ]
        if (numericFields.includes(fieldName)) {
          normalized[fieldName] = toNumber(rawValue)
        } else if (fieldName.startsWith('Previsions ')) {
          normalized[fieldName] = toNumber(rawValue)
        } else {
          normalized[fieldName] = toString(rawValue)
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
        if (normalized[field] === undefined || normalized[field] === null) {
          normalized[field] = 0
        }
      }

      // Ensure prevision fields
      for (const type of PREV_TYPES) {
        for (const month of PREV_MONTHS) {
          const key = `Previsions ${type} ${month}`
          if (normalized[key] === undefined || normalized[key] === null) {
            normalized[key] = 0
          }
        }
      }

      return normalized
    }).filter(row => {
      // Filter out completely empty rows
      return row['ENTITE'] || row['Programme'] || row['NOMENCLATURE'] || row['TOTAL CP']
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
      console.log('Data saved to local file:', dataFile)
    } catch (fsError) {
      console.log('Local file save skipped (expected on Vercel)')
    }

    return NextResponse.json({
      success: true,
      count: normalizedData.length,
      lastUpdated: payload.lastUpdated,
      sheetName,
      headerRow: headerRowIndex,
      columnsFound: Object.keys(colMap).length,
    })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({
      error: `Erreur de traitement: ${(error as Error).message}`,
    }, { status: 500 })
  }
}
