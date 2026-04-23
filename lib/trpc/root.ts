import { attachmentsRouter } from "@/lib/trpc/routers/attachments.router";
import { blogRouter } from "@/lib/trpc/routers/blog.router";
import { claimsRouter } from "@/lib/trpc/routers/claims.router";
import { clientsRouter } from "@/lib/trpc/routers/clients.router";
import { dashboardRouter } from "@/lib/trpc/routers/dashboard.router";
import { documentsRouter } from "@/lib/trpc/routers/documents.router";
import { flightsRouter } from "@/lib/trpc/routers/flights.router";
import { notesRouter } from "@/lib/trpc/routers/notes.router";
import { reportsRouter } from "@/lib/trpc/routers/reports.router";
import { searchRouter } from "@/lib/trpc/routers/search.router";
import { tasksRouter } from "@/lib/trpc/routers/tasks.router";
import { usersRouter } from "@/lib/trpc/routers/users.router";
import { router } from "@/lib/trpc/trpc";

export const appRouter = router({
  attachments: attachmentsRouter,
  blog: blogRouter,
  claims: claimsRouter,
  clients: clientsRouter,
  flights: flightsRouter,
  documents: documentsRouter,
  users: usersRouter,
  dashboard: dashboardRouter,
  reports: reportsRouter,
  search: searchRouter,
  tasks: tasksRouter,
  notes: notesRouter,
});

export type AppRouter = typeof appRouter;
