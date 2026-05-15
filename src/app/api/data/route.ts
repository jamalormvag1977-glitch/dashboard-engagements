import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

// Resolve the correct data file path for both standalone and dev modes
function getDataFilePath(): string {
  // In standalone mode, cwd is .next/standalone, so we need to go up to project root
  const standalonePath = path.join(process.cwd(), '..', '..', 'data', 'dashboard-data.json')
  const directPath = path.join(process.cwd(), 'data', 'dashboard-data.json')

  if (fs.existsSync(standalonePath)) return standalonePath
  if (fs.existsSync(directPath)) return directPath

  // Default: try direct path (will be created if needed)
  return directPath
}

// Column name mapping: raw Excel headers → normalized frontend names
const COLUMN_MAP: Record<string, string> = {
  'PROJET': 'Programme',
  'GROUPE': 'Projet',
}

// Normalize a single row's column names
function normalizeRow(row: Record<string, unknown>): Record<string, unknown> {
  const normalized: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(row)) {
    const mappedKey = COLUMN_MAP[key] || key
    normalized[mappedKey] = value
  }
  // Ensure Programme field: if empty, use Projet (GROUPE) as fallback
  if (!normalized['Programme'] && normalized['Projet']) {
    normalized['Programme'] = normalized['Projet']
  }
  return normalized
}

// Normalize all data (rows + filters)
function normalizeData(rawData: { data?: unknown[]; filters?: Record<string, unknown>; lastUpdated?: string; totalCount?: number }) {
  const rows = (rawData.data || []) as Record<string, unknown>[]
  const normalizedRows = rows.map(normalizeRow)

  // Rebuild filters from normalized data
  const programmes = [...new Set(normalizedRows.map(r => r['Programme'] as string).filter(Boolean))].sort()
  const projets = [...new Set(normalizedRows.map(r => r['Projet'] as string).filter(Boolean))].sort()
  const entites = [...new Set(normalizedRows.map(r => r['ENTITE'] as string).filter(Boolean))].sort()
  const nomenclatures = [...new Set(normalizedRows.map(r => String(r['NOMENCLATURE'] || '')).filter(Boolean))].sort()

  return {
    data: normalizedRows,
    filters: { programmes, projets, entites, nomenclatures },
    totalCount: normalizedRows.length,
    lastUpdated: rawData.lastUpdated || new Date().toISOString(),
  }
}

export async function GET() {
  try {
    const dataFile = getDataFilePath()
    if (fs.existsSync(dataFile)) {
      const raw = fs.readFileSync(dataFile, 'utf-8')
      const data = JSON.parse(raw)
      const normalized = normalizeData(data)
      return NextResponse.json(normalized)
    }
    // Fallback to original data
    const fallback = path.join(process.cwd(), 'public', 'data.json')
    if (fs.existsSync(fallback)) {
      const raw = fs.readFileSync(fallback, 'utf-8')
      const data = JSON.parse(raw)
      const normalized = normalizeData(data)
      return NextResponse.json(normalized)
    }
    return NextResponse.json({ data: [], filters: { programmes: [], projets: [], entites: [] }, totalCount: 0 })
  } catch (error) {
    console.error('Error reading data:', error)
    return NextResponse.json({ error: 'Failed to read data' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    // Resolve paths for both source and standalone data files
    const dataFile = getDataFilePath()
    const dataDir = path.dirname(dataFile)
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true })
    }

    // Save the new data
    const payload = {
      data: body.data,
      filters: body.filters,
      totalCount: body.data.length,
      lastUpdated: new Date().toISOString(),
    }

    fs.writeFileSync(dataFile, JSON.stringify(payload), 'utf-8')

    // Also write to the standalone location if different
    const standalonePath = path.join(process.cwd(), '..', '..', 'data', 'dashboard-data.json')
    if (standalonePath !== dataFile) {
      const standaloneDir = path.dirname(standalonePath)
      if (!fs.existsSync(standaloneDir)) {
        fs.mkdirSync(standaloneDir, { recursive: true })
      }
      fs.writeFileSync(standalonePath, JSON.stringify(payload), 'utf-8')
    }

    return NextResponse.json({ success: true, count: body.data.length, lastUpdated: payload.lastUpdated })
  } catch (error) {
    console.error('Error saving data:', error)
    return NextResponse.json({ error: 'Failed to save data' }, { status: 500 })
  }
}
