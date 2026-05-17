import "server-only";

import crypto from "node:crypto";

import { dispatchEvent } from "@/src/server/events/handlers";
import {
  type AppEventName,
  type AppEventPayload,
  eventSchemas,
} from "@/src/server/events/types";

export async function emitEvent<TName extends AppEventName>(
  name: TName,
  data: AppEventPayload<TName>,
) {
  const parsedData = eventSchemas[name].parse(data) as AppEventPayload<TName>;
  const event = {
    id: crypto.randomUUID(),
    name,
    data: parsedData,
    occurredAt: new Date(),
  };

  console.info("[EVENT] Emituję event serwerowy.", {
    eventId: event.id,
    name,
  });

  return dispatchEvent(event);
}

export type {
  AppEventEnvelope,
  AppEventName,
  AppEventPayload,
  EventDispatchResult,
} from "@/src/server/events/types";
