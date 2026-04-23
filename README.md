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
