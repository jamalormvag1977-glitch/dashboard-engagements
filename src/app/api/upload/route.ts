import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import * as XLSX from 'xlsx'

// Resolve the correct data file path for both standalone and dev modes
function getDataFilePath(): string {
  const standalonePath = path.join(process.cwd(), '..', '..', 'data', 'dashboard-data.json')
  const directPath = path.join(process.cwd(), 'data', 'dashboard-data.json')
  if (fs.existsSync(standalonePath)) return standalonePath
  if (fs.existsSync(directPath)) return directPath
  return directPath
}

// Known column name mapping: Excel header → normalized name
const KNOWN_COLUMNS: Record<string, string> = {
  'PROJET': 'Programme',
  'GROUPE': 'Projet',
  'SOURCE FINANCEMENT': 'SOURCE FINANCEMENT',
  'NOMENCLATURE': 'NOMENCLATURE',
  'N° ENGAGEMENT': 'N° ENGAGEMENT',
  'ENTITE': 'ENTITE',
  'DETAIL DESIGNATION': 'DETAIL DESIGNATION',
  'REPORTS': 'REPORTS',
  'CONSOLIDES': 'CONSOLIDES',
  'NOUVEAUX': 'NOUVEAUX',
  'CP': 'CP',
  'TOTAL CP': 'TOTAL CP',
  'CE CONSOLIDES': 'CE CONSOLIDES',
  'CE NOUVEAUX': 'CE NOUVEAUX',
  'TOTAL CE': 'TOTAL CE',
  'ENG REPORT': 'ENG REPORT',
  'ENG CONSOLIDES': 'ENG CONSOLIDES',
  'ENG NOUVEAUX': 'ENG NOUVEAUX',
  'ENG CP TOTAL': 'ENG CP TOTAL',
  'ENG CE ULT': 'ENG CE ULT',
  'ORD REPORTS': 'ORD REPORTS',
  'ORD CONSOLIDES': 'ORD CONSOLIDES',
  'ORD NOUVEAUX': 'ORD NOUVEAUX',
  'ORD TOTAL': 'ORD TOTAL',
  'PAIEMENTS SUR REPORTS': 'PAIEMENTS SUR REPORTS',
  'PAIEMENTS SUR CONSOLIDES': 'PAIEMENTS SUR CONSOLIDES',
  'PAIEMENTS SUR NOUVEAUX': 'PAIEMENTS SUR NOUVEAUX',
  'PAIEMENTS TOTAL': 'PAIEMENTS TOTAL',
  'TOTAL PREV': 'TOTAL PREV',
  'SUBVENTION DEMANDEE': 'SUBVENTION DEMANDEE',
  'TRESORERIE': 'TRESORERIE',
}

// Position-based columns that may not have proper headers
// These are extracted by column index (0-based)
const POSITION_COLUMNS: Record<number, { name: string; header: string }> = {
  65: { name: 'SUBVENTION DEMANDEE', header: 'BN' },  // Column BN = index 65 → Subvention demandée
  66: { name: 'TRESORERIE', header: 'BO' },            // Column BO = index 66 → Trésorerie
}

// Month prefixes for prévisions columns
const MONTHS = ['JANVIER', 'FEVRIER', 'MARS', 'AVRIL', 'MAI', 'JUIN', 'JUILLET', 'AOUT', 'SEPTEMBRE', 'OCTOBRE', 'NOVEMBRE', 'DECEMBRE']

// Parse a numeric value from Excel cell
function parseNumber(val: unknown): number | null {
  if (val === null || val === undefined || val === '') return null
  if (typeof val === 'number') return isNaN(val) ? null : val
  const str = String(val).replace(/\s/g, '').replace(/,/g, '.')
  const num = parseFloat(str)
  return isNaN(num) ? null : num
}

// Parse a string value from Excel cell
function parseString(val: unknown): string {
  if (val === null || val === undefined) return ''
  return String(val).trim()
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    if (!file) {
      return NextResponse.json({ error: 'Aucun fichier fourni' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const workbook = XLSX.read(buffer, { type: 'buffer' })

    // Use first sheet
    const sheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]

    // Convert to 2D array for position-based access
    const rawData: unknown[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' })

    if (rawData.length < 2) {
      return NextResponse.json({ error: 'Le fichier est vide ou ne contient pas assez de données' }, { status: 400 })
    }

    // Auto-detect the header row (look for a row containing key columns)
    let headerRowIndex = 0
    for (let i = 0; i < Math.min(rawData.length, 10); i++) {
      const row = rawData[i].map(v => String(v || '').trim().toUpperCase())
      if (row.some(v => v.includes('PROJET')) && row.some(v => v.includes('ENTITE'))) {
        headerRowIndex = i
        break
      }
    }

    // Build header mapping from detected header row
    const headerRow = rawData[headerRowIndex].map(v => String(v || '').trim().toUpperCase())
    const columnMap: Record<number, string> = {}

    // First pass: map known column headers
    headerRow.forEach((header, index) => {
      if (!header) return
      // Direct match
      if (KNOWN_COLUMNS[header]) {
        columnMap[index] = KNOWN_COLUMNS[header]
        return
      }
      // Partial match for month columns
      for (const month of MONTHS) {
        if (header.includes(month)) {
          // Determine the type (REPORTS, CONSOLIDES, NOUVEAUX)
          let prefix = 'Previsions '
          if (header.includes('REPORT')) prefix += 'REPORTS '
          else if (header.includes('CONSOLID')) prefix += 'CONSOLIDES '
          else if (header.includes('NOUVEAU')) prefix += 'NOUVEAUX '
          else return
          columnMap[index] = `${prefix}${month}`
          return
        }
      }
    })

    // Second pass: add position-based columns (BN=index 65, BO=index 66)
    for (const [idxStr, colDef] of Object.entries(POSITION_COLUMNS)) {
      const idx = parseInt(idxStr)
      if (idx < headerRow.length && !columnMap[idx]) {
        columnMap[idx] = colDef.name
      } else if (idx >= headerRow.length) {
        // Column index beyond headers - still add for data rows that might have it
        columnMap[idx] = colDef.name
      }
    }

    console.log('Detected column mapping:', columnMap)

    // Parse data rows
    const dataRows: Record<string, string | number | null>[] = []
    for (let i = headerRowIndex + 1; i < rawData.length; i++) {
      const rawRow = rawData[i]
      if (!rawRow || rawRow.length === 0) continue

      // Skip empty rows (no project name and no entity)
      const projetVal = parseString(rawRow[headerRow.indexOf('PROJET')] || rawRow[0])
      const entiteVal = parseString(rawRow[headerRow.indexOf('ENTITE')] || rawRow[5])
      if (!projetVal && !entiteVal) continue

      const row: Record<string, string | number | null> = {}

      // String fields
      const stringFields = new Set(['Programme', 'Projet', 'SOURCE FINANCEMENT', 'NOMENCLATURE', 'N° ENGAGEMENT', 'ENTITE', 'DETAIL DESIGNATION'])
      const skipFields = new Set(['CP']) // Skip intermediate CP column

      for (const [colIdx, colName] of Object.entries(columnMap)) {
        const idx = parseInt(colIdx)
        const rawValue = idx < rawRow.length ? rawRow[idx] : ''

        if (skipFields.has(colName)) continue

        if (stringFields.has(colName)) {
          row[colName] = parseString(rawValue)
        } else {
          row[colName] = parseNumber(rawValue)
        }
      }

      // Ensure Programme field: use Projet (GROUPE) as fallback if Programme (PROJET) is empty
      if (!row['Programme'] && row['Projet']) {
        row['Programme'] = row['Projet']
      }

      // Ensure Projet field: use ENTITE as fallback if missing
      if (!row['Projet'] || row['Projet'] === '') {
        row['Projet'] = row['ENTITE'] || 'Non classé'
      }

      // Ensure all required numeric fields have default 0
      const requiredNumericFields = [
        'REPORTS', 'CONSOLIDES', 'NOUVEAUX', 'TOTAL CP',
        'CE CONSOLIDES', 'CE NOUVEAUX', 'TOTAL CE',
        'ENG REPORT', 'ENG CONSOLIDES', 'ENG NOUVEAUX', 'ENG CP TOTAL', 'ENG CE ULT',
        'ORD REPORTS', 'ORD CONSOLIDES', 'ORD NOUVEAUX', 'ORD TOTAL',
        'PAIEMENTS SUR REPORTS', 'PAIEMENTS SUR CONSOLIDES', 'PAIEMENTS SUR NOUVEAUX', 'PAIEMENTS TOTAL',
        'TOTAL PREV', 'TRESORERIE', 'SUBVENTION DEMANDEE',
      ]
      for (const field of requiredNumericFields) {
        if (row[field] === undefined || row[field] === null) {
          row[field] = 0
        }
      }

      dataRows.push(row)
    }

    // Build filters from normalized data
    const programmes = [...new Set(dataRows.map(r => r['Programme'] as string).filter(Boolean))].sort()
    const projets = [...new Set(dataRows.map(r => r['Projet'] as string).filter(Boolean))].sort()
    const entites = [...new Set(dataRows.map(r => r['ENTITE'] as string).filter(Boolean))].sort()
    const nomenclatures = [...new Set(dataRows.map(r => String(r['NOMENCLATURE'] || '')).filter(Boolean))].sort()

    const payload = {
      data: dataRows,
      filters: { programmes, projets, entites, nomenclatures },
      totalCount: dataRows.length,
      lastUpdated: new Date().toISOString(),
    }

    // Save to data file(s)
    const dataFile = getDataFilePath()
    const dataDir = path.dirname(dataFile)

    // Auto-backup before overwriting
    if (fs.existsSync(dataFile)) {
      const backupDir = path.join(dataDir, 'backups')
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true })
      }
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19)
      const backupFile = path.join(backupDir, `dashboard-data-pre-upload-${timestamp}.json`)
      fs.copyFileSync(dataFile, backupFile)
      console.log(`Auto-backup created: ${backupFile}`)

      // Keep only last 5 pre-upload backups
      const backups = fs.readdirSync(backupDir)
        .filter(f => f.startsWith('dashboard-data-pre-upload-'))
        .sort()
      if (backups.length > 5) {
        backups.slice(0, backups.length - 5).forEach(f => {
          fs.unlinkSync(path.join(backupDir, f))
        })
      }
    }

    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true })
    }
    fs.writeFileSync(dataFile, JSON.stringify(payload), 'utf-8')

    // Also write to standalone location if different
    const standalonePath = path.join(process.cwd(), '..', '..', 'data', 'dashboard-data.json')
    if (standalonePath !== dataFile) {
      const standaloneDir = path.dirname(standalonePath)
      if (!fs.existsSync(standaloneDir)) {
        fs.mkdirSync(standaloneDir, { recursive: true })
      }
      fs.writeFileSync(standalonePath, JSON.stringify(payload), 'utf-8')
    }

    console.log(`Upload complete: ${dataRows.length} rows, ${Object.keys(columnMap).length} columns mapped`)

    return NextResponse.json({
      success: true,
      count: dataRows.length,
      lastUpdated: payload.lastUpdated,
      columnsMapped: Object.keys(columnMap).length,
    })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: `Erreur lors de l'import : ${(error as Error).message}` },
      { status: 500 }
    )
  }
}
