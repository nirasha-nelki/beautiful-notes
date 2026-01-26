import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

const NOTES_FILE = path.join(process.cwd(), 'data', 'notes.json')

interface Note {
  id: string
  title: string
  preview: string
  date: string
  templateId: string
  accentColor: string
  content?: string
  pages?: any[]
}

// Ensure data directory exists
async function ensureDataDir() {
  const dataDir = path.join(process.cwd(), 'data')
  try {
    await fs.access(dataDir)
  } catch {
    await fs.mkdir(dataDir, { recursive: true })
  }
}

// GET - Load notes
export async function GET() {
  try {
    await ensureDataDir()
    
    try {
      const data = await fs.readFile(NOTES_FILE, 'utf-8')
      const notes = JSON.parse(data)
      return NextResponse.json({ notes })
    } catch (error) {
      // If file doesn't exist, return empty array
      return NextResponse.json({ notes: [] })
    }
  } catch (error) {
    console.error('Error loading notes:', error)
    return NextResponse.json({ error: 'Failed to load notes' }, { status: 500 })
  }
}

// POST - Save notes
export async function POST(request: NextRequest) {
  try {
    await ensureDataDir()
    
    const { notes } = await request.json()
    await fs.writeFile(NOTES_FILE, JSON.stringify(notes, null, 2), 'utf-8')
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error saving notes:', error)
    return NextResponse.json({ error: 'Failed to save notes' }, { status: 500 })
  }
}
