import "server-only";

import ClaimRegisteredEmail from "@/src/emails/claim-registered-email";
import { prisma } from "@/lib/prisma";
import { getAppBaseUrl } from "@/src/lib/resend";
import { sendEmail } from "@/src/server/mail/send-email";
import { getClaimCreatedEmailData } from "@/src/server/mail/templates";

export type SendClaimRegisteredEmailInput = {
  claimId: string;
};

function getClientName(client: { firstName: string; lastName: string }) {
  return `${client.firstName} ${client.lastName}`.trim();
}

export async function sendClaimRegisteredEmail(input: SendClaimRegisteredEmailInput) {
  const claim = await prisma.claim.findUnique({
    where: {
      id: input.claimId,
    },
    select: {
      id: true,
      claimNumber: true,
      client: {
        select: {
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
  });

  if (!claim?.client.email) {
    return {
      ok: false as const,
      error: "Claim client email is missing.",
      logId: null,
    };
  }

  const panelUrl = `${getAppBaseUrl()}/login`;
  const emailData = getClaimCreatedEmailData({
    claimNumber: claim.claimNumber,
  });

  return sendEmail({
    type: "claim.created",
    to: claim.client.email,
    subject: emailData.subject,
    previewText: emailData.previewText,
    react: (
      <ClaimRegisteredEmail
        clientName={getClientName(claim.client)}
        claimNumber={claim.claimNumber}
        panelUrl={panelUrl}
        previewText={emailData.previewText}
        ctaLabel={emailData.ctaLabel}
      />
    ),
    metadata: {
      claimId: claim.id,
      claimNumber: claim.claimNumber,
    },
  });
}
