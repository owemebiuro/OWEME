# OWEME Development Roadmap

This roadmap tracks the practical path from the current OWEME CRM state to a production-ready claim handling system.

## Product Goal

Build OWEME as a complete flight compensation platform:

- public acquisition flow for checking and submitting claims,
- protected CRM for operators, lawyers, and administrators,
- document generation and attachment handling,
- automated reminders and notifications,
- newsletter and content tools,
- reporting and analytics for business operations.

## Guiding Principles

- Keep the repository as one root-level Next.js application.
- Prioritize the public claim funnel and CRM claim workflow before secondary growth features.
- Keep manual fallback paths available when external APIs fail.
- Treat claims as the central operational object.
- Keep all role and permission changes explicit and tested.
- Prefer small production-ready increments over broad unfinished features.

## Phase 1: Foundation Stabilization

Priority: high.

Goal: make the existing app reliable enough for focused product work.

### Scope

- Keep project documentation current with the real codebase.
- Verify Supabase Auth and application user mapping through `User.authUserId`.
- Decide and implement the final inactive-user strategy for `User.isActive=false` and Supabase Auth-side blocking.
- Verify Prisma migrations, seed data, and local/preview/production environment expectations.
- Keep deployment documentation aligned with the actual Vercel, Supabase, R2, Resend, Inngest, and FlightAware setup.

### Done When

- New developers can understand the app structure from `docs/project-structure.md`.
- Local setup works from README instructions.
- Production setup has a concrete smoke checklist.
- Disabled users cannot access protected CRM functionality.

## Phase 2: Public Claim Funnel

Priority: high.

Goal: make the public flow reliable from first visit to CRM claim creation.

### Scope

- Polish `/sprawdz` as the quick compensation checker.
- Polish `/formularz` as the main claim submission form.
- Keep FlightAware failure non-blocking by allowing manual claim submission.
- Improve user-facing result states after flight lookup and form submission.
- Track key funnel events: checker visit, flight lookup, form start, form submit, and submission success.
- Ensure submitted claims create complete enough CRM records for operators to continue work.

### Done When

- A client can check a flight and submit a claim without staff assistance.
- A client can submit manually when flight API data is missing or unavailable.
- A new CRM claim contains client, flight, passenger, source, and status data.

## Phase 3: CRM Claim Operations

Priority: high.

Goal: make claims manageable end to end inside the CRM.

### Scope

- Refine `/crm/claims` with filters, saved views, sorting, pagination, archived claims, and quick actions.
- Refine `/crm/claims/[id]` as the main claim workspace.
- Standardize claim status workflow and status transition expectations.
- Add or refine automatic task creation for important status changes.
- Improve notes, task assignment, history, ownership, billing, and settlement visibility.
- Enforce role permissions across claim operations.

### Done When

- Operators can process a new claim through the expected internal workflow.
- Lawyers can identify and handle court-stage claims.
- Read-only users cannot mutate claim data.
- Important claim changes are visible in history or notes.

## Phase 4: Documents And Attachments

Priority: high.

Goal: make documents and files dependable for real claim handling.

### Scope

- Complete `.docx` generation for assignment agreements, powers of attorney, demand letters, replies, lawsuits, and settlement confirmations.
- Standardize document templates and input data.
- Version generated documents.
- Support marking documents as signed.
- Verify R2 upload, presigned URLs, metadata persistence, download, and archive behavior.
- Keep local development fallback clear and limited to safe document-generation scenarios.

### Done When

- Staff can generate required claim documents from CRM data.
- Staff can upload and classify client files.
- Generated and uploaded files are attached to the correct claim and recoverable later.

## Phase 5: Automations

Priority: medium-high.

Goal: reduce manual follow-up and make operational deadlines visible.

### Scope

- Expand Inngest workflows for reminders, follow-ups, notifications, flight refreshes, and campaign scheduling.
- Send transactional emails through Resend for key claim lifecycle events.
- Add retries and useful error reporting for Resend, R2, FlightAware, and Inngest failures.
- Surface automation status or logs to administrators.

### Done When

- Routine reminders and follow-ups do not rely only on manual checking.
- Failed automations are visible and actionable.
- External service failures do not silently lose claim work.

## Phase 6: Newsletter And Content

Priority: medium.

Goal: support OWEME's marketing and education workflows.

### Scope

- Finish newsletter subscriber, segment, template, campaign, and log management.
- Connect real campaign sending through Resend.
- Track opens, clicks, bounces, complaints, and unsubscribes.
- Improve `/wiedza` and article publishing for SEO content.
- Keep blog workflow clear: draft, review, published.

### Done When

- Marketing users can manage content and newsletters from CRM.
- Published articles appear publicly.
- Subscribers can unsubscribe reliably.
- Campaign results are visible.

## Phase 7: Reporting And Analytics

Priority: medium.

Goal: make operational and business performance measurable.

### Scope

- Expand CRM dashboard metrics.
- Add reports for claims by status, source, owner, stage, airline, and date range.
- Add recovered amount and potential amount reporting.
- Add operator and lawyer workload reports.
- Add public funnel analytics.
- Add CSV/XLSX exports where operationally useful.

### Done When

- Administrators can understand pipeline health from CRM.
- Staff can export the core operational data they need.
- Funnel and claim conversion weak points are visible.

## Phase 8: Quality And Release Discipline

Priority: continuous.

Goal: keep the app safe to change as the product grows.

### Scope

- Expand unit tests for permissions, claim logic, FlightAware mapping, eligibility, filters, and validation.
- Expand Playwright tests for authenticated CRM flows.
- Keep `npm run lint`, `npm run test:unit`, and `npm run build` green before release.
- Add smoke checks for production deploys.
- Keep environment documentation synchronized with real requirements.

### Done When

- Core business workflows have regression coverage.
- Production deploys follow a repeatable checklist.
- Known caveats are documented instead of hidden in code.

## Recommended Execution Order

1. Finish foundation stabilization.
2. Complete the public checker-to-claim funnel.
3. Harden CRM claim operations.
4. Complete documents and attachments.
5. Add automations around the claim lifecycle.
6. Expand newsletter and content operations.
7. Expand reporting and exports.
8. Keep quality checks and documentation current throughout.

## Current Next Actions

1. Verify auth and inactive-user behavior.
2. Audit the public `/sprawdz` to `/formularz` to CRM claim creation flow.
3. Define the canonical claim status workflow.
4. Review document generation coverage against the required legal/operational templates.
5. Expand E2E tests for the highest-risk CRM flows.
