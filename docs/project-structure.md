# OWEME Project Structure

OWEME is maintained as one root-level Next.js App Router application. The repository contains the public website, CRM, admin tools, integrations, database schema, tests, and documentation in a single app.

Do not introduce a monorepo layout, `apps/web`, `packages/*`, Turbo, or pnpm workspaces unless that architecture change is explicitly approved.

## Current Layout

```txt
app/                         App Router pages, layouts, route handlers, and server actions
app/api/                     API route handlers for tRPC, Inngest, flight checks, tracking, and dev storage
app/crm/                     Protected CRM routes
app/crm/admin/               Admin routes for users, settings, logs, backups, and blog management
app/crm/claims/              Claims list, archived claims, and claim detail pages
app/crm/clients/             Client list and client detail pages
app/crm/reports/             CRM reporting pages
app/crm/newsletter/          Newsletter management page
app/sprawdz/                 Public compensation checker
app/formularz/               Public claim submission form
app/sukces/                  Public submission success page
app/wiedza/                  Public knowledge base and blog article pages
app/unsubscribe/             Newsletter unsubscribe page

components/                  Reusable React components
components/admin/            Admin panels and user-management UI
components/analytics/        Analytics dashboard UI
components/blog/             Blog and editor UI
components/checker/          Public compensation checker UI
components/claims/           Claims list, filters, status badges, and detail panels
components/clients/          Client list, filters, and edit/detail UI
components/crm/              CRM shell, sidebar, topbar, and schema mismatch state
components/dashboard/        CRM dashboard panels and metric cards
components/form/             Public application form UI
components/newsletter/       Newsletter CRM UI
components/reports/          Reporting dashboard components
components/search/           Command/search UI

lib/                         Integrations, domain helpers, and shared server/client code
lib/actions/                 Server actions shared by routes
lib/backups/                 Database backup helpers
lib/blog/                    Blog editor domain logic
lib/claims/                  Claims formatting, types, URL filters, and creation helpers
lib/clients/                 Client filtering and shared client types
lib/documents/               Document generation helpers and templates
lib/email/                   Transactional email helpers and templates
lib/flightaware/             FlightAware AeroAPI client, mapper, types, and eligibility logic
lib/inngest/                 Inngest client, events, and workflow functions
lib/newsletter/              Newsletter tokens and segmentation helpers
lib/server/                  Server-only helpers
lib/services/                Flight data and flight API service layer
lib/storage/                 Cloudflare R2 helpers and file validation
lib/supabase/                Supabase SSR clients, admin client, env, and auth proxy logic
lib/trpc/                    tRPC context, root router, permissions, hooks, and domain routers
lib/utils/                   Small shared utilities

prisma/                      Prisma schema, migrations, and seed script
e2e/                         Playwright end-to-end tests
types/                       Shared TypeScript types
services/                    Business workflow notes and future service boundary
docs/                        Project documentation
public/                      Static assets
```

## Main Routes

### Public

- `/` - marketing landing page.
- `/sprawdz` - public flight compensation checker.
- `/formularz` - public claim application form.
- `/sukces` - successful application confirmation page.
- `/wiedza` - public knowledge base.
- `/wiedza/[slug]` - public article page.
- `/unsubscribe` - newsletter unsubscribe page.
- `/login` - Supabase login screen.

### CRM

- `/crm` - protected CRM dashboard.
- `/crm/claims` - active claims list.
- `/crm/claims/archived` - archived claims list.
- `/crm/claims/[id]` - claim detail workspace.
- `/crm/clients` - clients list.
- `/crm/clients/[id]` - client detail workspace.
- `/crm/reports` - reports.
- `/crm/analytics` - analytics dashboard.
- `/crm/newsletter` - newsletter management.

### Admin

- `/crm/admin/users` - application users.
- `/crm/admin/settings` - system settings.
- `/crm/admin/logs` - system logs.
- `/crm/admin/backups` - backups panel.
- `/crm/admin/blog` - blog post management.
- `/crm/admin/blog/editor` - blog editor.

### API

- `/api/trpc/[trpc]` - tRPC endpoint.
- `/api/check-flight` - public flight check endpoint.
- `/api/flight-mock` - local/dev flight mock endpoint.
- `/api/inngest` - Inngest endpoint.
- `/api/tracking/checker` - checker analytics endpoint.
- `/api/dev-storage/[...key]` - local development storage fallback.

## Domain Areas

### Claims

Claims are the core operational object. The domain includes claim intake, qualification, status workflow, ownership, passengers, notes, tasks, documents, attachments, history, and payouts.

Key files:

- `prisma/schema.prisma`
- `lib/claims/*`
- `lib/trpc/routers/claims.router.ts`
- `components/claims/*`
- `app/crm/claims/*`

### Clients

Clients are stored separately from claims and can be reused across multiple claims and passengers.

Key files:

- `lib/clients/*`
- `lib/trpc/routers/clients.router.ts`
- `components/clients/*`
- `app/crm/clients/*`

### Flight Data

FlightAware AeroAPI is the main flight data provider. The public checker and claim form must continue to allow manual submission when external flight data is unavailable.

Key files:

- `lib/flightaware/*`
- `lib/services/flight-data.service.ts`
- `lib/services/flight-api.service.ts`
- `app/api/check-flight/route.ts`

### Documents And Storage

Document generation uses `.docx` templates and stores generated files or attachments through Cloudflare R2. Local development may use `.dev-storage/` for server-side generated documents when R2 is missing.

Key files:

- `lib/documents/*`
- `lib/storage/*`
- `lib/trpc/routers/documents.router.ts`
- `lib/trpc/routers/attachments.router.ts`
- `components/claims/detail/ClaimDocuments.tsx`
- `components/claims/detail/ClaimAttachments.tsx`

### Auth And Permissions

Supabase Auth is the authentication source. The `User` model stores application-level users, roles, active state, and optional `authUserId` mapping.

Key files:

- `lib/supabase/*`
- `lib/auth-helpers.ts`
- `lib/actions/auth.ts`
- `lib/trpc/permissions.ts`
- `lib/trpc/permissions.shared.ts`
- `proxy.ts`

### Automations

Inngest handles scheduled and event-driven workflows. Resend handles transactional email.

Key files:

- `lib/inngest/*`
- `app/api/inngest/route.ts`
- `lib/email/*`

### Newsletter And Blog

The marketing/content area includes blog publishing, newsletter subscribers, segments, templates, campaigns, delivery logs, and tracking.

Key files:

- `lib/blog/*`
- `lib/newsletter/*`
- `lib/trpc/routers/blog.router.ts`
- `lib/trpc/routers/newsletter.router.ts`
- `components/blog/*`
- `components/newsletter/*`
- `app/wiedza/*`
- `app/crm/admin/blog/*`
- `app/crm/newsletter/page.tsx`

## Architecture Notes

- Keep this repository as a single Next.js app unless a future migration is explicitly requested.
- Read the matching Next.js guide in `node_modules/next/dist/docs/` before changing Next.js-specific APIs, routing, rendering, config, or conventions.
- Keep Supabase code under `lib/supabase/`.
- Keep tRPC routers under `lib/trpc/routers/` and compose them through `lib/trpc/root.ts`.
- Put reusable UI in `components/` only when it is shared or improves readability.
- Keep route-specific server actions close to their route when they are not shared.
- Put domain workflows in `lib/services/`, `lib/inngest/`, or focused domain folders under `lib/` as the business logic grows.
- Keep server-only code out of client components.
- Keep public flow resilient: external API failure must not block manual claim submission.
- Store real secrets only in local environment files or deployment provider settings, never in git.
