# OWEME Deployment Guide

OWEME is deployed as one root-level Next.js application. Do not configure a monorepo root, `apps/web`, pnpm workspaces, or Turbo for this project.

## Vercel

Recommended project settings:

- Framework preset: `Next.js`
- Root directory: repository root, leave empty/default
- Install command: `npm ci`
- Build command: `npm run build`
- Output directory: Vercel default for Next.js
- Node.js version: `20`

The preferred production model is Vercel connected directly to the GitHub repository. The included GitHub Actions deploy workflow can also deploy through Vercel CLI when `VERCEL_TOKEN`, `VERCEL_ORG_ID`, and `VERCEL_PROJECT_ID` are configured.

## Production Environment Variables

Add these variables in Vercel Project Settings for Production.

### Supabase and Database

- `DATABASE_URL` - Supabase Postgres connection string. For Vercel runtime, use the transaction pooler URL, for example:
  `postgresql://postgres.<project-ref>:<password>@<region>.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1`
- `DIRECT_URL` - direct or session-pooler connection used by Prisma schema operations and migrations, for example:
  `postgresql://postgres.<project-ref>:<password>@<region>.pooler.supabase.com:5432/postgres`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` - server-only, used by admin user management. Never expose it to the browser.
- `NEXT_PUBLIC_SITE_URL` - production URL, for example `https://oweme.pl`.

Current `prisma/schema.prisma` uses `DATABASE_URL` plus `directUrl = env("DIRECT_URL")`. There are no Prisma migrations in the repository yet, so the deploy workflow runs `prisma migrate deploy` only after `prisma/migrations` exists.

### Cloudflare R2

- `R2_ACCOUNT_ID`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `R2_BUCKET_NAME` - suggested bucket: `oweme-documents`
- `R2_ENDPOINT` - optional if `R2_ACCOUNT_ID` is set; usually `https://<account-id>.r2.cloudflarestorage.com`
- `R2_PUBLIC_URL` - optional, only if public reads are intentionally enabled

The application validates R2 centrally. In production there is no local fallback:
missing R2 configuration fails fast with a clear storage error.

Recommended R2 CORS for browser uploads via presigned URLs:

```json
[
  {
    "AllowedOrigins": ["https://oweme.pl"],
    "AllowedMethods": ["PUT", "GET", "HEAD"],
    "AllowedHeaders": ["content-type", "content-length", "x-amz-*"],
    "ExposeHeaders": ["etag"],
    "MaxAgeSeconds": 300
  }
]
```

Add preview or local origins only for non-production buckets.

### Inngest

- `INNGEST_SIGNING_KEY`
- `INNGEST_EVENT_KEY`
- `INNGEST_BASE_URL` - optional, only if the current Inngest setup needs an explicit base URL

The App Router endpoint is `app/api/inngest/route.ts`. After production deploy, register or sync the app in Inngest so functions are visible.

### Resend

- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL` - verified sender, for example `OWEME <noreply@oweme.pl>`

Configure and verify the sending domain in Resend before relying on production emails.

### FlightAware AeroAPI

- `FLIGHTAWARE_AEROAPI_KEY`
- `FLIGHTAWARE_AEROAPI_BASE_URL` - default: `https://aeroapi.flightaware.com/aeroapi`
- `FLIGHTAWARE_AEROAPI_TIMEOUT_MS` - default: `10000`
- `FLIGHT_DATA_CACHE_TTL_HOURS` - default: `6`
- `USE_FLIGHT_API_MOCK=false`

The FlightAware key must be configured in `.env.local` for local development and in Vercel Project Settings for deployed environments. After changing `.env.local`, restart `npm run dev`.

## GitHub Actions Secrets

For CI on pull requests, no production secrets are required. The workflow uses safe placeholder values for build-time validation.

For Vercel CLI deploy from GitHub Actions:

- `DATABASE_URL`
- `DIRECT_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `NEXT_PUBLIC_SITE_URL`
- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

For Playwright E2E:

- `E2E_DATABASE_URL` - separate non-production database
- `OWEME_E2E_EMAIL`
- `OWEME_E2E_PASSWORD`

Optional repository variable:

- `E2E_RUN_SEED=true` - runs the current idempotent Prisma seed before E2E. Use only with a disposable test database.

Do not add `NEXTAUTH_SECRET`; OWEME uses Supabase Auth, not NextAuth/Auth.js.

## First Production Setup

1. Create or verify the Supabase project and production Postgres database.
2. Add Vercel production environment variables listed above.
3. Create the Cloudflare R2 bucket and configure CORS.
4. Verify the Resend sending domain and set `RESEND_FROM_EMAIL`.
5. Configure Inngest and confirm `/api/inngest` is reachable after deploy.
6. Deploy from Vercel Git integration or from GitHub Actions with Vercel CLI secrets.
7. Create Supabase Auth users and matching OWEME application users.

## Post-Deploy Smoke Checklist

- `/login` loads and Supabase Auth login works.
- `/crm` redirects unauthenticated users to `/login`.
- `/crm/claims` loads data for an authenticated application user.
- `/crm/admin/users` is accessible only for `ADMIN`.
- A file upload generates a presigned R2 URL and stores the attachment metadata.
- Document generation stores a `.docx` file in R2.
- Inngest functions are visible and can receive events.
- Resend can send a test transactional email.
- `/wiedza` renders published blog posts from the database (or static fallback when DB is empty).
- `/crm/admin/blog` is accessible for `ADMIN` and `EDITOR`; create a post and verify it appears at `/wiedza/<slug>`.

## Current Caveats

- Prisma migrations are not present yet, so deployment skips `prisma migrate deploy` until `prisma/migrations` exists.
- E2E tests need a dedicated Supabase/Auth test setup for full authenticated flows.
- `isActive=false` blocks the application user in OWEME checks, but a complete Supabase Auth-side account blocking strategy still needs a final decision.
