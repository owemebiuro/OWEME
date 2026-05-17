import "server-only";

import { ClaimStatus, UserRole } from "@prisma/client";
import { z } from "zod";

export const eventSchemas = {
  "claim.created": z.object({
    claimId: z.string().min(1),
  }),
  "claim.status.changed": z.object({
    claimId: z.string().min(1),
    oldStatus: z.enum(ClaimStatus),
    newStatus: z.enum(ClaimStatus),
    actorId: z.string().min(1).optional(),
  }),
  "claim.documents.requested": z.object({
    claimId: z.string().min(1),
    requestedDocuments: z.array(z.string().trim().min(1)).optional(),
  }),
  "auth.user.created": z.object({
    userId: z.string().min(1),
    email: z.string().trim().email().toLowerCase(),
    name: z.string().trim().min(1),
    role: z.enum(UserRole),
    panelUrl: z.string().url().optional(),
  }),
  "auth.password.reset.requested": z.object({
    userId: z.string().min(1),
    email: z.string().trim().email().toLowerCase(),
    name: z.string().trim().min(1),
    resetUrl: z.string().url(),
    actorId: z.string().min(1).optional(),
  }),
  "system.email.test": z.object({
    to: z.string().trim().email().toLowerCase(),
    requestedById: z.string().min(1),
  }),
} as const;

export type AppEventName = keyof typeof eventSchemas;
export type AppEventPayload<TName extends AppEventName> = z.infer<
  (typeof eventSchemas)[TName]
>;

export type AppEventEnvelope<TName extends AppEventName = AppEventName> = {
  id: string;
  name: TName;
  data: AppEventPayload<TName>;
  occurredAt: Date;
};

export type EventDispatchResult = {
  ok: boolean;
  eventId: string;
  handlerCount: number;
  errors: string[];
};
