import { sendClaimRegisteredEmail as sendTransactionalClaimRegisteredEmail } from "@/src/server/mail/send-claim-registered-email";

export async function sendClaimRegisteredEmail(claimId: string) {
  return sendTransactionalClaimRegisteredEmail({ claimId });
}
