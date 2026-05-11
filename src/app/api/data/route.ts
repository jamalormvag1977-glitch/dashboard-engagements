import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const DATA_FILE = path.join(process.cwd(), 'data', 'dashboard-data.json')

export async function GET() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8')
      const data = JSON.parse(raw)
      return NextResponse.json(data)
    }
    // Fallback to original data
    const fallback = path.join(process.cwd(), 'public', 'data.json')
    if (fs.existsSync(fallback)) {
      const raw = fs.readFileSync(fallback, 'utf-8')
      const data = JSON.parse(raw)
      return NextResponse.json(data)
    }
    return NextResponse.json({ data: [], filters: { projets: [], groupes: [], entites: [] }, totalCount: 0 })
  } catch (error) {
    console.error('Error reading data:', error)
    return NextResponse.json({ error: 'Failed to read data' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    // Ensure data directory exists
    const dataDir = path.dirname(DATA_FILE)
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

    fs.writeFileSync(DATA_FILE, JSON.stringify(payload), 'utf-8')

    return NextResponse.json({ success: true, count: body.data.length, lastUpdated: payload.lastUpdated })
  } catch (error) {
    console.error('Error saving data:', error)
    return NextResponse.json({ error: 'Failed to save data' }, { status: 500 })
  }
}
