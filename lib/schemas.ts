import { z } from 'zod'

export const claimSchema = z.object({
  flightNumber: z
    .string()
    .min(1, 'Podaj numer lotu')
    .regex(/^[A-Za-z]{2,3}\s?\d{1,4}$/, 'Format: LO231 lub FR 1234'),
  flightDate: z
    .string()
    .min(1, 'Wybierz datę lotu')
    .refine((d) => new Date(d) <= new Date(), {
      message: 'Data nie może być w przyszłości',
    }),
  disruption: z.enum(['delay', 'cancel', 'denied', 'missed'], {
    error: () => 'Wybierz rodzaj zakłócenia',
  }),
})

export const submitClaimSchema = claimSchema.extend({
  passenger: z.object({
    firstName: z.string().min(1, 'Podaj imię'),
    lastName: z.string().min(1, 'Podaj nazwisko'),
    email: z.string().email('Podaj poprawny adres e-mail'),
    phone: z.string().optional(),
  }),
  boardingPass: z.string().optional(),
})

export type ClaimFormData = z.infer<typeof claimSchema>
