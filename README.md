# OWEME CRM

OWEME is a single-repo Next.js App Router application for the marketing site, CRM, and admin panel.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Supabase Auth and Supabase Postgres
- Prisma in the repository root
- tRPC in the repository root
- Cloudflare R2 for documents and attachments
- Inngest for automations
- Resend for transactional email
- Vercel deployment

This project is not a monorepo. Do not add `apps/web`, `packages/*`, Turbo, or pnpm workspaces unless a future architecture change is explicitly approved.

## Local Development

```bash
npm ci
npm run dev
```

Open `http://localhost:3000`.

Copy `.env.example` to `.env.local` and fill the local values. Real secrets must stay out of git.

### Cloudflare R2 local setup

The app expects these storage variables:

- `R2_ACCOUNT_ID`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `R2_BUCKET_NAME`
- `R2_ENDPOINT` (optional when `R2_ACCOUNT_ID` is set)

If `R2_ENDPOINT` is omitted, OWEME builds it automatically as:

`https://<R2_ACCOUNT_ID>.r2.cloudflarestorage.com`

After changing `.env.local`, restart `npm run dev`.

When R2 is missing in local development:

- server-side document generation can use a local fallback in `.dev-storage/`
- attachments still require real R2 configuration, because browser uploads use presigned URLs

### FlightAware AeroAPI local setup

OWEME uses FlightAware AeroAPI as the main flight data provider for `/sprawdz`, the public claim form, and CRM flight refresh.

Set these variables in `.env.local`:

- `FLIGHTAWARE_AEROAPI_KEY`
- `FLIGHTAWARE_AEROAPI_BASE_URL` (defaults to `https://aeroapi.flightaware.com/aeroapi`)
- `FLIGHTAWARE_AEROAPI_TIMEOUT_MS`
- `FLIGHT_DATA_CACHE_TTL_HOURS`

The API key must stay server-side only. Add the same variables in Vercel for deployed environments.

After changing `.env.local`, restart `npm run dev`.

When FlightAware is unavailable or not configured locally:

- OWEME falls back to cached flight data when available
- otherwise the checker and form can continue in manual mode, so the lead flow is not blocked
- in local development, missing config is reported explicitly in the checker; add `FLIGHTAWARE_AEROAPI_KEY` to `.env.local` and restart `npm run dev`

## Quality Checks

```bash
npm run lint
npm run test:unit
npm run build
```

E2E tests:

```bash
npm run test:e2e
```

Authenticated E2E scenarios require:

- `E2E_DATABASE_URL`
- `OWEME_E2E_EMAIL`
- `OWEME_E2E_PASSWORD`

## Deployment

Production setup is documented in [docs/deployment.md](docs/deployment.md).

For Vercel, keep the root directory set to the repository root and use the standard Next.js framework preset. Do not set root directory to `apps/web`.

## Project Planning

- Current project structure: [docs/project-structure.md](docs/project-structure.md)
- Development roadmap: [docs/development-roadmap.md](docs/development-roadmap.md)
