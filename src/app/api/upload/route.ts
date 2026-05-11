import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Parse Excel using dynamic import of xlsx
    const XLSX = await import('xlsx')
    const workbook = XLSX.read(buffer, { type: 'buffer' })
    const sheetName = workbook.SheetNames[0]
    const sheet = workbook.Sheets[sheetName]
    const jsonData: (string | number | null)[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 })

    // Row 0 = date header (skip), Row 1 = column headers, Row 2+ = data
    if (jsonData.length < 3) {
      return NextResponse.json({ error: 'File has insufficient data rows' }, { status: 400 })
    }

    const headers: string[] = (jsonData[1] as (string | number | null)[]).map((h: string | number | null, i: number) =>
      h != null ? String(h) : `COL_${i}`
    )

    const rows: Record<string, string | number | null>[] = []
    for (let i = 2; i < jsonData.length; i++) {
      const row: Record<string, string | number | null> = {}
      const rawRow = jsonData[i] as (string | number | null)[]
      if (!rawRow || rawRow.length === 0) continue
      
      headers.forEach((h, j) => {
        let v: string | number | null = rawRow[j] ?? null
        // Convert numeric strings that are actually numbers
        if (typeof v === 'string' && v.trim() !== '' && !isNaN(Number(v)) && v.trim().length < 20) {
          const num = Number(v)
          if (Number.isFinite(num)) v = num
        }
        row[h] = v
      })
      rows.push(row)
    }

    // Extract filter values
    const projets = [...new Set(rows.map(r => r.PROJET).filter(Boolean) as string[])].sort()
    const groupes = [...new Set(rows.map(r => r.GROUPE).filter(Boolean) as string[])].sort((a, b) => {
      const numA = parseInt(a.replace(/\D/g, '')) || 0
      const numB = parseInt(b.replace(/\D/g, '')) || 0
      return numA - numB
    })
    const entites = [...new Set(rows.map(r => r.ENTITE).filter(Boolean) as string[])].sort()

    // Save to data file
    const dataDir = path.join(process.cwd(), 'data')
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true })
    }

    const payload = {
      data: rows,
      filters: { projets, groupes, entites },
      totalCount: rows.length,
      lastUpdated: new Date().toISOString(),
    }

    const dataFile = path.join(dataDir, 'dashboard-data.json')
    fs.writeFileSync(dataFile, JSON.stringify(payload), 'utf-8')

    return NextResponse.json({
      success: true,
      count: rows.length,
      filters: { projets, groupes, entites },
      lastUpdated: payload.lastUpdated,
    })
  } catch (error) {
    console.error('Error processing Excel file:', error)
    return NextResponse.json({ error: 'Failed to process file: ' + (error as Error).message }, { status: 500 })
  }
}
