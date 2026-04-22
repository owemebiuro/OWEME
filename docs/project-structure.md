# OWEME Project Structure

OWEME is currently maintained as one root-level Next.js application.

## Current Layout

```txt
app/                App Router routes
components/         Reusable React components
lib/                Integrations and shared helpers
lib/supabase/       Supabase SSR clients and auth proxy logic
lib/server/         Server-only helpers
lib/utils/          Small shared utilities
services/           Business workflows and external integrations
types/              Shared TypeScript types
docs/               Project documentation
public/             Static assets
```

## Routing

- `/` is the marketing landing placeholder.
- `/login` is the Supabase login screen.
- `/crm` is the protected CRM placeholder.
- `/admin` is the protected admin placeholder.

## Architecture Notes

- Keep this repository as a single Next.js app unless a future migration is explicitly requested.
- Keep Supabase code under `lib/supabase/`.
- Put reusable UI in `components/` only when it is shared or improves readability.
- Put domain workflows in `services/` as business logic grows.
- Keep server-only code out of client components.
