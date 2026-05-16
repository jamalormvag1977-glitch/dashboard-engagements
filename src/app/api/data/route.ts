import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
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

// Normalize a single row's column names and ensure required fields exist
function normalizeRow(row: Record<string, unknown>): Record<string, unknown> {
  const normalized: Record<string, unknown> = { ...row }

  if (!normalized['Programme'] || normalized['Programme'] === '') {
    normalized['Programme'] = normalized['ENTITE'] || 'Non classé'
  }

  if (!normalized['Projet'] || normalized['Projet'] === '') {
    normalized['Projet'] = normalized['ENTITE'] || 'Non classé'
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
    if (normalized[field] === undefined || normalized[field] === null) {
      normalized[field] = 0
    }
  }

  const requiredStringFields = ['Programme', 'Projet', 'ENTITE', 'SOURCE FINANCEMENT']
  for (const field of requiredStringFields) {
    if (!normalized[field] || normalized[field] === '') {
      normalized[field] = field === 'SOURCE FINANCEMENT' ? 'Non spécifié' : 'Non classé'
    }
  }

  return normalized
}

// Normalize all data (rows + filters)
function normalizeData(rawData: { data?: unknown[]; filters?: Record<string, unknown>; lastUpdated?: string; totalCount?: number }) {
  const rows = (rawData.data || []) as Record<string, unknown>[]
  const normalizedRows = rows.map(normalizeRow)

  const programmes = [...new Set(normalizedRows.map(r => r['Programme'] as string).filter(Boolean))].sort()
  const projets = [...new Set(normalizedRows.map(r => r['Projet'] as string).filter(Boolean))].sort()
  const entites = [...new Set(normalizedRows.map(r => r['ENTITE'] as string).filter(Boolean))].sort()
  const nomenclatures = [...new Set(normalizedRows.map(r => String(r['NOMENCLATURE'] || '')).filter(Boolean))].sort()
  const sources = [...new Set(normalizedRows.map(r => r['SOURCE FINANCEMENT'] as string).filter(Boolean))].sort()

  return {
    data: normalizedRows,
    filters: { programmes, projets, entites, nomenclatures, sources },
    totalCount: normalizedRows.length,
    lastUpdated: rawData.lastUpdated || new Date().toISOString(),
  }
}

export async function GET() {
  try {
    // Try Vercel KV first (production)
    if (isVercelKVAvailable()) {
      const kvData = await kv.get<Record<string, unknown>>('dashboard-data')
      if (kvData) {
        const normalized = normalizeData(kvData as { data?: unknown[]; filters?: Record<string, unknown>; lastUpdated?: string; totalCount?: number })
        return NextResponse.json(normalized)
      }
    }

    // Fallback to local file (development / first run)
    const dataFile = getDataFilePath()
    if (fs.existsSync(dataFile)) {
      const raw = fs.readFileSync(dataFile, 'utf-8')
      const data = JSON.parse(raw)
      const normalized = normalizeData(data)
      return NextResponse.json(normalized)
    }

    // Fallback to public data
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

    const payload = {
      data: body.data,
      filters: body.filters,
      totalCount: body.data.length,
      lastUpdated: new Date().toISOString(),
    }

    // Save to Vercel KV (production)
    if (isVercelKVAvailable()) {
      await kv.set('dashboard-data', payload)
      console.log('Data saved to Vercel KV')
    }

    // Also save to local file (development / backup)
    try {
      const dataFile = getDataFilePath()
      const dataDir = path.dirname(dataFile)
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true })
      }
      fs.writeFileSync(dataFile, JSON.stringify(payload), 'utf-8')
    } catch (fsError) {
      // File system write may fail on Vercel (read-only), that's OK
      console.log('Local file save skipped (expected on Vercel)')
    }

    return NextResponse.json({ success: true, count: body.data.length, lastUpdated: payload.lastUpdated })
  } catch (error) {
    console.error('Error saving data:', error)
    return NextResponse.json({ error: 'Failed to save data' }, { status: 500 })
  }
}
