import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { randomUUID } from 'crypto'
import type { SubmitResponse } from '@/types/claim'

const submitSchema = z.object({
  flightNumber: z.string().min(1),
  flightDate: z.string().min(1),
  disruption: z.enum(['delay', 'cancel', 'denied', 'missed']),
  passenger: z.object({
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    email: z.string().email(),
    phone: z.string().optional(),
  }),
  boardingPass: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = submitSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Nieprawidłowe dane', details: parsed.error.issues },
        { status: 400 }
      )
    }

    const response: SubmitResponse = {
      claimId: randomUUID(),
      status: 'pending',
    }

    return NextResponse.json(response, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Błąd serwera' }, { status: 500 })
  }
}
