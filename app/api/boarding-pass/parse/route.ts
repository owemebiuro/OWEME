import { NextRequest, NextResponse } from 'next/server'
import type { ParseResponse } from '@/types/claim'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'Brak pliku' }, { status: 400 })
    }

    const flightDate = new Date().toISOString().split('T')[0]
    const response: ParseResponse & { date: string } = {
      flightNumber: 'LO231',
      flightDate,
      date: flightDate,
      airline: 'LOT Polish Airlines',
      from: 'WAW',
      to: 'LHR',
      confidence: 0.5,
    }

    return NextResponse.json(response)
  } catch {
    return NextResponse.json({ error: 'Błąd parsowania' }, { status: 500 })
  }
}
