# Transactional email OWEME

System mailowy CRM działa wyłącznie po stronie serwera i jest przeznaczony do
maili transakcyjnych: status sprawy, reset hasła, utworzenie konta, prośba o
dokumenty oraz powiadomienia systemowe CRM.

## Preview React Email

```bash
npm run email
```

Komenda uruchamia preview z katalogu `src/emails`.

## Flow

1. Kod CRM emituje event, np. `emitEvent("claim.status.changed", payload)`.
2. `src/server/events` waliduje payload przez Zod.
3. Handler eventu wybiera odpowiedni mail transactional.
4. `src/server/mail/send-email.ts` waliduje odbiorców, sprawdza rate limit,
   tworzy log `email_logs`, wysyła przez Resend z idempotency key i aktualizuje
   log odpowiedzią lub błędem.
5. Resend renderuje szablon React Email po stronie serwera. Klucz API nie jest
   dostępny w kodzie klienta.

## Dodanie template

1. Dodaj komponent w `src/emails`, używając `BaseLayout`.
2. Dodaj dane templatki w `src/server/mail/templates.ts`, jeżeli template ma
   wspólne mapowania lub subject.
3. Dodaj sender w `src/server/mail`, który tworzy komponent React i wywołuje
   `sendEmail`.
4. Dodaj event i handler w `src/server/events`.

## Dodanie eventu

1. Dopisz schemat w `src/server/events/types.ts`.
2. Dopisz handler w `src/server/events/handlers.ts`.
3. W miejscu biznesowym wywołaj `emitEvent("nazwa.eventu", payload)`.

Przykład:

```ts
await emitEvent("claim.status.changed", {
  claimId: claim.id,
  oldStatus: claim.status,
  newStatus: input.status,
  actorId: appUser.id,
});
```

## Test Resend

Endpoint testowy:

```http
POST /api/internal/resend
Content-Type: application/json

{ "to": "admin@oweme.pl" }
```

Endpoint działa tylko dla `ADMIN` i `SUPER_ADMIN`. Gdy `to` nie zostanie
podane, mail testowy idzie na adres zalogowanego admina.

## Produkcja i przyszłe kolejki

Aktualny dispatcher jest synchroniczny, ale interfejs eventów jest gotowy do
podmiany na Inngest, BullMQ, Vercel Queues albo osobny notification service.
Kanały SMS, WhatsApp, Customer.io i webhooki powinny zostać dopięte jako nowe
handlery eventów, bez wywołań bezpośrednio z routerów CRM.
