import { NextRequest, NextResponse } from 'next/server'
import { claimSchema } from '@/lib/schemas'
import { CLAIM_AMOUNTS } from '@/lib/constants'
import type { VerifyResponse } from '@/types/claim'

export async function POST(request: NextRequest) {
  try {
    const body: unknown = await request.json()
    const parsed = claimSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Nieprawidłowe dane', details: parsed.error.issues },
        { status: 400 }
      )
    }

    const { flightNumber, flightDate, disruption } = parsed.data
    const amount = CLAIM_AMOUNTS[disruption].numeric

    const response: VerifyResponse = {
      eligible: true,
      amount,
      currency: 'EUR',
      flightInfo: {
        number: flightNumber.replace(/\s+/g, '').toUpperCase(),
        date: flightDate,
        route: 'WAW — LHR',
      },
      regulation: 'EC261',
    }

    return NextResponse.json(response)
  } catch {
    return NextResponse.json({ error: 'Błąd serwera' }, { status: 500 })
  }
}
