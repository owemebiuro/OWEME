import {
  onClaimCreated,
  onClaimStatusChanged,
} from "@/lib/inngest/functions/claim-lifecycle";
import {
  claimOwnerAlert,
  flightDataRefresh,
  overdueTasksAlert,
} from "@/lib/inngest/functions/scheduled";
import {
  sendOverdueTasksEmail,
  sendUnassignedClaimsEmail,
} from "@/lib/inngest/functions/email-notifications";

export const inngestFunctions = [
  onClaimCreated,
  onClaimStatusChanged,
  overdueTasksAlert,
  flightDataRefresh,
  claimOwnerAlert,
  sendOverdueTasksEmail,
  sendUnassignedClaimsEmail,
];
