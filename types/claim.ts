export type DisruptionType = 'delay' | 'cancel' | 'denied' | 'missed'

export interface ClaimFormData {
  flightNumber: string
  flightDate: string
  disruption: DisruptionType
}

export interface ClaimResult {
  eligible: boolean
  amount: number
  currency: 'EUR'
  flightInfo: {
    number: string
    date: string
    route: string | null
  }
  regulation: 'EC261'
}

export interface VerifyRequest {
  flightNumber: string
  flightDate: string
  disruption: DisruptionType
}

export interface VerifyResponse {
  eligible: boolean
  amount: number
  currency: 'EUR'
  flightInfo: {
    number: string
    date: string
    route: string | null
  }
  regulation: 'EC261'
}

export interface SubmitRequest {
  flightNumber: string
  flightDate: string
  disruption: DisruptionType
  passenger: {
    firstName: string
    lastName: string
    email: string
    phone?: string
  }
  boardingPass?: string
}

export interface SubmitResponse {
  claimId: string
  status: 'pending'
}

export interface ParseResponse {
  flightNumber: string
  flightDate: string
  airline: string
  from: string
  to: string
  confidence: number
}
