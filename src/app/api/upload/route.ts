import { NextResponse } from 'next/server'
import * as XLSX from 'xlsx'
import { put } from '@vercel/blob'
import fs from 'fs'
import path from 'path'

// Resolve the correct data file path for both standalone and dev modes
function getDataFilePath(): string {
  const standalonePath = path.join(process.cwd(), '..', '..', 'data', 'dashboard-data.json')
  const directPath = path.join(process.cwd(), 'data', 'dashboard-data.json')
  if (fs.existsSync(standalonePath)) return standalonePath
  if (fs.existsSync(directPath)) return directPath
  return directPath
}

function isVercelBlobAvailable(): boolean {
  return !!process.env.BLOB_READ_WRITE_TOKEN
}

// Normalize a value to a number
function toNum(v: unknown): number {
  if (typeof v === 'number') return isNaN(v) ? 0 : v
  if (typeof v === 'string') {
    const trimmed = v.trim()
    if (trimmed === '' || trimmed === '-' || trimmed === 'N/A') return 0
    const n = parseFloat(trimmed.replace(/\s/g, '').replace(',', '.'))
    return isNaN(n) ? 0 : n
  }
  if (v === null || v === undefined) return 0
  return 0
}

// Normalize a value to string
function toStr(v: unknown): string {
  if (v === null || v === undefined) return ''
  return String(v).trim()
}

// Comprehensive column name mapping - handles various Excel header formats
// Maps actual Excel column headers to the field names used by page.tsx
const COLUMN_MAPPINGS: Record<string, string> = {
  // Programme / Projet identification
  'PROJET': 'Programme',
  'Programme': 'Programme',
  'PROGRAMME': 'Programme',
  'GROUPE': 'Projet',
  'Projet': 'Projet',
  'PROJET DETAIL': 'Projet',
  'Libellé projet': 'Projet',

  // Entity and classification
  'ENTITE': 'ENTITE',
  'Entité': 'ENTITE',
  'Entite': 'ENTITE',
  'ENTITY': 'ENTITE',
  'NOMENCLATURE': 'NOMENCLATURE',
  'Nomenclature': 'NOMENCLATURE',
  'SOURCE FINANCEMENT': 'SOURCE FINANCEMENT',
  'Source de financement': 'SOURCE FINANCEMENT',
  'SOURCE FIN.': 'SOURCE FINANCEMENT',

  // Engagement and designation
  'N° ENGAGEMENT': 'N° ENGAGEMENT',
  "N° d'engagement": 'N° ENGAGEMENT',
  'N°ENGAGEMENT': 'N° ENGAGEMENT',
  'N° ECRITURE': 'N° ENGAGEMENT',
  "N° d'écriture": 'N° ENGAGEMENT',
  'DETAIL DESIGNATION': 'DETAIL DESIGNATION',
  'Détail désignation': 'DETAIL DESIGNATION',
  'Detail Designation': 'DETAIL DESIGNATION',
  'DESIGNATION': 'DETAIL DESIGNATION',
  'Désignation': 'DETAIL DESIGNATION',
  'Designation': 'DETAIL DESIGNATION',

  // Credit columns - Reports
  'REPORTS': 'REPORTS',
  'Crédits de report': 'REPORTS',
  'Credits de report': 'REPORTS',
  'CREDITS REPORTS': 'REPORTS',
  'Crédits de reports': 'REPORTS',

  // Credit columns - Consolidated
  'CONSOLIDES': 'CONSOLIDES',
  'Consolidés': 'CONSOLIDES',
  'Consolides': 'CONSOLIDES',
  'CREDITS CONSOLIDES': 'CONSOLIDES',
  'Crédits consolidés': 'CONSOLIDES',

  // Credit columns - New
  'NOUVEAUX': 'NOUVEAUX',
  'Nouveaux': 'NOUVEAUX',
  'CREDITS NOUVEAUX': 'NOUVEAUX',
  'Crédits nouveaux': 'NOUVEAUX',

  // CP columns
  'CP': 'CP',
  'TOTAL CP': 'TOTAL CP',
  'Total CP': 'TOTAL CP',
  'Total Cp': 'TOTAL CP',

  // CE columns
  'CE CONSOLIDES': 'CE CONSOLIDES',
  'CE Consolidés': 'CE CONSOLIDES',
  'CE CONSOLIDÉS': 'CE CONSOLIDES',
  'CE NOUVEAUX': 'CE NOUVEAUX',
  'CE Nouveaux': 'CE NOUVEAUX',
  'TOTAL CE': 'TOTAL CE',
  'Total CE': 'TOTAL CE',

  // Engagement columns
  'ENG REPORT': 'ENG REPORT',
  'ENG. REPORT': 'ENG REPORT',
  'Engagements sur reports': 'ENG REPORT',
  'ENG CONSOLIDES': 'ENG CONSOLIDES',
  'ENG. CONSOLIDES': 'ENG CONSOLIDES',
  'Engagements consolidés': 'ENG CONSOLIDES',
  'ENG NOUVEAUX': 'ENG NOUVEAUX',
  'ENG. NOUVEAUX': 'ENG NOUVEAUX',
  'Engagements nouveaux': 'ENG NOUVEAUX',
  'ENG CP TOTAL': 'ENG CP TOTAL',
  'Eng. CP Total': 'ENG CP TOTAL',
  'ENG CE ULT': 'ENG CE ULT',
  'Eng. CE Total': 'ENG CE ULT',
  'ENG CE': 'ENG CE ULT',

  // Ordonnancement columns
  'ORD REPORTS': 'ORD REPORTS',
  'ORD. REPORTS': 'ORD REPORTS',
  'Ordonnancement reports': 'ORD REPORTS',
  'ORD CONSOLIDES': 'ORD CONSOLIDES',
  'ORD. CONSOLIDES': 'ORD CONSOLIDES',
  'ORD NOUVEAUX': 'ORD NOUVEAUX',
  'ORD. NOUVEAUX': 'ORD NOUVEAUX',
  'ORD TOTAL': 'ORD TOTAL',
  'ORD. TOTAL': 'ORD TOTAL',

  // Payment columns
  'PAIEMENTS SUR REPORTS': 'PAIEMENTS SUR REPORTS',
  'PAIEMENTS SUR CONSOLIDES': 'PAIEMENTS SUR CONSOLIDES',
  'PAIEMENTS SUR NOUVEAUX': 'PAIEMENTS SUR NOUVEAUX',
  'PAIEMENTS TOTAL': 'PAIEMENTS TOTAL',
  'Paiements total': 'PAIEMENTS TOTAL',

  // Prevision and other columns
  'TOTAL PREV': 'TOTAL PREV',
  'Total Prévisions': 'TOTAL PREV',
  'TRESORERIE': 'TRESORERIE',
  'Trésorerie': 'TRESORERIE',
  'SUBVENTION DEMANDEE': 'SUBVENTION DEMANDEE',
  'Subvention demandée': 'SUBVENTION DEMANDEE',
}

// All numeric field names used by page.tsx
const NUMERIC_FIELDS = new Set([
  'REPORTS', 'CONSOLIDES', 'NOUVEAUX', 'CP', 'TOTAL CP',
  'CE CONSOLIDES', 'CE NOUVEAUX', 'TOTAL CE',
  'ENG REPORT', 'ENG CONSOLIDES', 'ENG NOUVEAUX', 'ENG CP TOTAL', 'ENG CE ULT',
  'ORD REPORTS', 'ORD CONSOLIDES', 'ORD NOUVEAUX', 'ORD TOTAL',
  'PAIEMENTS SUR REPORTS', 'PAIEMENTS SUR CONSOLIDES', 'PAIEMENTS SUR NOUVEAUX', 'PAIEMENTS TOTAL',
  'TOTAL PREV', 'TRESORERIE', 'SUBVENTION DEMANDEE',
])

// Known header keywords for auto-detection
const HEADER_KEYWORDS = [
  'PROJET', 'Programme', 'PROGRAMME', 'ENTITE', 'Entité', 'NOMENCLATURE',
  'REPORTS', 'CONSOLIDES', 'NOUVEAUX', 'TOTAL CP', 'TOTAL CE',
  'DETAIL DESIGNATION', 'Désignation', 'DESIGNATION', 'ENG REPORT',
  'ORD REPORTS', 'ENGAGEMENT', 'ORDONNANCEMENT',
]

// Normalize a single data row
function normalizeRow(row: Record<string, unknown>): Record<string, unknown> {
  const normalized: Record<string, unknown> = { ...row }

  if (!normalized['Programme'] || normalized['Programme'] === '') {
    normalized['Programme'] = normalized['ENTITE'] || 'Non classé'
  }
  if (!normalized['Projet'] || normalized['Projet'] === '') {
    normalized['Projet'] = normalized['ENTITE'] || 'Non classé'
  }

  // Ensure all required numeric fields exist
  for (const field of NUMERIC_FIELDS) {
    if (normalized[field] === undefined || normalized[field] === null || normalized[field] === '') {
      normalized[field] = 0
    }
  }

  // Ensure required string fields
  if (!normalized['ENTITE'] || normalized['ENTITE'] === '') normalized['ENTITE'] = 'Non classé'
  if (!normalized['SOURCE FINANCEMENT'] || normalized['SOURCE FINANCEMENT'] === '') normalized['SOURCE FINANCEMENT'] = 'Non spécifié'

  // Ensure all Prevision fields exist
  const prevMonths = ['JANVIER', 'FEVRIER', 'MARS', 'AVRIL', 'MAI', 'JUIN', 'JUILLET', 'AOUT', 'SEPTEMBRE', 'OCTOBRE', 'NOVEMBRE', 'DECEMBRE']
  const prevTypes = ['REPORTS', 'CONSOLIDES', 'NOUVEAUX']
  for (const t of prevTypes) {
    for (const m of prevMonths) {
      const k = `Previsions ${t} ${m}`
      if (normalized[k] === undefined || normalized[k] === null || normalized[k] === '') {
        normalized[k] = 0
      }
    }
  }

  return normalized
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'Aucun fichier fourni' }, { status: 400 })
    }

    // Read file as buffer
    const buffer = Buffer.from(await file.arrayBuffer())

    // Parse Excel
    const workbook = XLSX.read(buffer, { type: 'buffer' })
    const sheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]

    // Read all rows as arrays
    const allRows: unknown[][] = XLSX.utils.sheet_to_json(worksheet, {
      header: 1,
      defval: '',
      blankrows: false,
    })

    if (allRows.length === 0) {
      return NextResponse.json({ error: 'Le fichier est vide' }, { status: 400 })
    }

    // Auto-detect header row by scanning first 10 rows
    let headerRowIndex = -1
    for (let i = 0; i < Math.min(allRows.length, 10); i++) {
      const row = allRows[i] || []
      const rowStr = row.map(c => String(c || '').trim())
      const matchCount = HEADER_KEYWORDS.filter(h =>
        rowStr.some(cell => cell.toUpperCase() === h.toUpperCase() || cell.toUpperCase().includes(h.toUpperCase()))
      ).length
      if (matchCount >= 3) {
        headerRowIndex = i
        break
      }
    }

    if (headerRowIndex === -1) {
      return NextResponse.json(
        { error: 'En-têtes non trouvés dans le fichier Excel. Vérifiez le format du fichier.' },
        { status: 400 }
      )
    }

    console.log(`[Upload] Detected header row at index ${headerRowIndex}`)

    // Get headers and build column mapping
    const rawHeaders = allRows[headerRowIndex].map((h: unknown) => String(h || '').trim())

    // Map each column index to its normalized field name
    const fieldMap: Record<number, string> = {}
    rawHeaders.forEach((rawHeader: string, colIdx: number) => {
      if (!rawHeader) return

      // Try exact match first
      if (COLUMN_MAPPINGS[rawHeader]) {
        fieldMap[colIdx] = COLUMN_MAPPINGS[rawHeader]
        return
      }

      // Try case-insensitive match
      const upperHeader = rawHeader.toUpperCase()
      for (const [key, value] of Object.entries(COLUMN_MAPPINGS)) {
        if (key.toUpperCase() === upperHeader) {
          fieldMap[colIdx] = value
          return
        }
      }

      // Try partial match for Prevision columns (e.g., "Previsions REPORTS JANVIER")
      if (rawHeader.startsWith('Previsions ') || rawHeader.startsWith('Prévisions ') ||
          upperHeader.startsWith('PREVISIONS ') || upperHeader.startsWith('PRÉVISIONS ')) {
        fieldMap[colIdx] = rawHeader
        return
      }

      // Keep original header as field name if no mapping found
      fieldMap[colIdx] = rawHeader
    })

    console.log('[Upload] Column mapping:', Object.entries(fieldMap).map(([i, f]) => `"${rawHeaders[Number(i)]}" → "${f}"`).join(', '))

    // Parse data rows
    const dataRows = allRows.slice(headerRowIndex + 1).filter((row: unknown[]) =>
      row && row.length > 0 && row.some(c => c !== '' && c !== 0 && c !== null && c !== undefined)
    )

    const normalizedData = dataRows.map((row: unknown[]) => {
      const obj: Record<string, unknown> = {}

      for (const [colIdx, fieldName] of Object.entries(fieldMap)) {
        const rawValue = row[Number(colIdx)]

        if (NUMERIC_FIELDS.has(fieldName) || fieldName.startsWith('Previsions ') || fieldName.startsWith('Prévisions ')) {
          obj[fieldName] = toNum(rawValue)
        } else {
          obj[fieldName] = toStr(rawValue)
        }
      }

      // Ensure Programme and Projet
      if (!obj['Programme'] || obj['Programme'] === '') obj['Programme'] = obj['ENTITE'] || 'Non classé'
      if (!obj['Projet'] || obj['Projet'] === '') obj['Projet'] = obj['ENTITE'] || 'Non classé'

      // Ensure all required numeric fields
      for (const f of NUMERIC_FIELDS) {
        if (obj[f] === undefined || obj[f] === null || obj[f] === '') obj[f] = 0
      }

      // Ensure Prevision fields
      const prevMonths = ['JANVIER', 'FEVRIER', 'MARS', 'AVRIL', 'MAI', 'JUIN', 'JUILLET', 'AOUT', 'SEPTEMBRE', 'OCTOBRE', 'NOVEMBRE', 'DECEMBRE']
      const prevTypes = ['REPORTS', 'CONSOLIDES', 'NOUVEAUX']
      for (const t of prevTypes) {
        for (const m of prevMonths) {
          const k = `Previsions ${t} ${m}`
          if (obj[k] === undefined || obj[k] === null || obj[k] === '') obj[k] = 0
        }
      }

      return obj
    }).filter((row: Record<string, unknown>) =>
      row['ENTITE'] || row['Programme'] || row['NOMENCLATURE'] || row['TOTAL CP']
    )

    // Normalize all rows
    const finalData = normalizedData.map(normalizeRow)

    // Build filters
    const programmes = [...new Set(finalData.map(r => r['Programme'] as string).filter(Boolean))].sort()
    const projets = [...new Set(finalData.map(r => r['Projet'] as string).filter(Boolean))].sort()
    const entites = [...new Set(finalData.map(r => r['ENTITE'] as string).filter(Boolean))].sort()
    const nomenclatures = [...new Set(finalData.map(r => String(r['NOMENCLATURE'] || '')).filter(Boolean))].sort()
    const sources = [...new Set(finalData.map(r => r['SOURCE FINANCEMENT'] as string).filter(Boolean))].sort()

    // Build payload
    const payload = {
      data: finalData,
      filters: { programmes, projets, entites, nomenclatures, sources },
      totalCount: finalData.length,
      lastUpdated: new Date().toISOString(),
    }

    // Log summary for debugging
    const sampleRow = finalData[0]
    if (sampleRow) {
      console.log('[Upload] Sample row keys:', Object.keys(sampleRow).join(', '))
      console.log('[Upload] Sample values:', JSON.stringify({
        Programme: sampleRow['Programme'],
        Projet: sampleRow['Projet'],
        ENTITE: sampleRow['ENTITE'],
        REPORTS: sampleRow['REPORTS'],
        'TOTAL CP': sampleRow['TOTAL CP'],
        'ENG CP TOTAL': sampleRow['ENG CP TOTAL'],
      }))
    }
    console.log(`[Upload] Total rows: ${finalData.length}`)
    console.log(`[Upload] Programmes: ${programmes.length}, Projets: ${projets.length}, Entités: ${entites.length}`)

    // Save to Vercel Blob (production)
    if (isVercelBlobAvailable()) {
      try {
        await put('dashboard-data.json', JSON.stringify(payload), {
          access: 'public',
          contentType: 'application/json',
          allowOverwrite: true,
        })
        console.log('[Upload] Data saved to Vercel Blob')
      } catch (blobError) {
        console.error('[Upload] Blob save failed:', blobError)
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
      console.log('[Upload] Data saved to local file')
    } catch (fsError) {
      console.log('[Upload] Local file save skipped (expected on Vercel)')
    }

    return NextResponse.json({
      success: true,
      count: finalData.length,
      lastUpdated: payload.lastUpdated,
      programmes: programmes.length,
      entites: entites.length,
    })
  } catch (error) {
    console.error('[Upload] Error:', error)
    return NextResponse.json(
      { error: `Erreur lors de l'import: ${(error as Error).message}` },
      { status: 500 }
    )
  }
}
