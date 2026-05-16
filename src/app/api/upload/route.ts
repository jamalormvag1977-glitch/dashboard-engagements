import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import * as XLSX from 'xlsx'
import { kv } from '@vercel/kv'

// Resolve the correct data file path for both standalone and dev modes
function getDataFilePath(): string {
  const standalonePath = path.join(process.cwd(), '..', '..', 'data', 'dashboard-data.json')
  const directPath = path.join(process.cwd(), 'data', 'dashboard-data.json')
  if (fs.existsSync(standalonePath)) return standalonePath
  if (fs.existsSync(directPath)) return directPath
  return directPath
}

// Check if Vercel KV is available
function isVercelKVAvailable(): boolean {
  return !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN)
}

// Column name mapping: Excel header (uppercase) → normalized field name
const KNOWN_COLUMNS: Record<string, string> = {
  'PROGRAMME': 'Programme',
  'PROJET': 'Projet',
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
const POSITION_COLUMNS: Record<number, { name: string; header: string }> = {
  65: { name: 'SUBVENTION DEMANDEE', header: 'BN' },
  66: { name: 'TRESORERIE', header: 'BO' },
}

// Month prefixes for prévisions columns
const MONTHS = ['JANVIER', 'FEVRIER', 'MARS', 'AVRIL', 'MAI', 'JUIN', 'JUILLET', 'AOUT', 'SEPTEMBRE', 'OCTOBRE', 'NOVEMBRE', 'DECEMBRE']

function parseNumber(val: unknown): number | null {
  if (val === null || val === undefined || val === '') return null
  if (typeof val === 'number') return isNaN(val) ? null : val
  const str = String(val).replace(/\s/g, '').replace(/,/g, '.')
  const num = parseFloat(str)
  return isNaN(num) ? null : num
}

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

    const sheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]

    const rawData: unknown[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' })

    if (rawData.length < 2) {
      return NextResponse.json({ error: 'Le fichier est vide ou ne contient pas assez de données' }, { status: 400 })
    }

    // Auto-detect the header row
    let headerRowIndex = 0
    for (let i = 0; i < Math.min(rawData.length, 10); i++) {
      const row = rawData[i].map(v => String(v || '').trim().toUpperCase())
      if (row.some(v => v.includes('PROJET')) && row.some(v => v.includes('ENTITE'))) {
        headerRowIndex = i
        break
      }
    }

    // Build header mapping
    const headerRow = rawData[headerRowIndex].map(v => String(v || '').trim().toUpperCase())
    const columnMap: Record<number, string> = {}

    headerRow.forEach((header, index) => {
      if (!header) return
      if (KNOWN_COLUMNS[header]) {
        columnMap[index] = KNOWN_COLUMNS[header]
        return
      }
      for (const month of MONTHS) {
        if (header.includes(month)) {
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

    // Position-based columns
    for (const [idxStr, colDef] of Object.entries(POSITION_COLUMNS)) {
      const idx = parseInt(idxStr)
      if (idx < headerRow.length && !columnMap[idx]) {
        columnMap[idx] = colDef.name
      } else if (idx >= headerRow.length) {
        columnMap[idx] = colDef.name
      }
    }

    console.log('Detected column mapping:', columnMap)

    // Parse data rows
    const dataRows: Record<string, string | number | null>[] = []
    for (let i = headerRowIndex + 1; i < rawData.length; i++) {
      const rawRow = rawData[i]
      if (!rawRow || rawRow.length === 0) continue

      const programmeColIdx = Object.entries(columnMap).find(([_, v]) => v === 'Programme')?.[0]
      const projetColIdx = Object.entries(columnMap).find(([_, v]) => v === 'Projet')?.[0]
      const entiteColIdx = Object.entries(columnMap).find(([_, v]) => v === 'ENTITE')?.[0]
      const firstKeyCol = programmeColIdx || projetColIdx || '0'
      const projetVal = parseString(rawRow[parseInt(firstKeyCol)] || rawRow[0])
      const entiteVal = parseString(entiteColIdx ? rawRow[parseInt(entiteColIdx)] : rawRow[5])
      if (!projetVal && !entiteVal) continue

      const row: Record<string, string | number | null> = {}

      const stringFields = new Set(['Programme', 'Projet', 'SOURCE FINANCEMENT', 'NOMENCLATURE', 'N° ENGAGEMENT', 'ENTITE', 'DETAIL DESIGNATION'])
      const skipFields = new Set(['CP'])

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

      if (!row['Programme'] || row['Programme'] === '') {
        row['Programme'] = row['ENTITE'] || 'Non classé'
      }

      if (!row['Projet'] || row['Projet'] === '') {
        row['Projet'] = row['ENTITE'] || 'Non classé'
      }

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

    // Build filters
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

    // Save to Vercel KV (production)
    if (isVercelKVAvailable()) {
      // Auto-backup before overwriting
      const existingData = await kv.get('dashboard-data')
      if (existingData) {
        await kv.set('dashboard-data-backup', existingData)
        console.log('Auto-backup created in Vercel KV')
      }
      await kv.set('dashboard-data', payload)
      console.log(`Data saved to Vercel KV: ${dataRows.length} rows`)
    }

    // Also try saving to local file (development / backup)
    try {
      const dataFile = getDataFilePath()
      const dataDir = path.dirname(dataFile)

      if (fs.existsSync(dataFile)) {
        const backupDir = path.join(dataDir, 'backups')
        if (!fs.existsSync(backupDir)) {
          fs.mkdirSync(backupDir, { recursive: true })
        }
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19)
        const backupFile = path.join(backupDir, `dashboard-data-pre-upload-${timestamp}.json`)
        fs.copyFileSync(dataFile, backupFile)
        console.log(`Auto-backup created: ${backupFile}`)

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
    } catch (fsError) {
      // File system write may fail on Vercel (read-only), that's OK
      console.log('Local file save skipped (expected on Vercel)')
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
