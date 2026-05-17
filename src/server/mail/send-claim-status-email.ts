import "server-only";

import type { ClaimStatus } from "@prisma/client";
import { createElement } from "react";

import ClaimStatusEmail from "@/src/emails/claim-status-email";
import { prisma } from "@/lib/prisma";
import { getAppBaseUrl } from "@/src/lib/resend";
import { sendEmail } from "@/src/server/mail/send-email";
import { getClaimStatusEmailData } from "@/src/server/mail/templates";

export type SendClaimStatusEmailInput = {
  claimId: string;
  oldStatus: ClaimStatus;
  newStatus: ClaimStatus;
};

function getClientName(client: { firstName: string; lastName: string }) {
  return `${client.firstName} ${client.lastName}`.trim();
}

export async function sendClaimStatusEmail(input: SendClaimStatusEmailInput) {
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
    console.warn("[MAIL] Pomijam email statusowy, bo sprawa nie ma adresu klienta.", {
      claimId: input.claimId,
    });

    return {
      ok: false as const,
      error: "Claim client email is missing.",
      logId: null,
    };
  }

  const panelUrl = `${getAppBaseUrl()}/login`;
  const emailData = getClaimStatusEmailData({
    claimNumber: claim.claimNumber,
    oldStatus: input.oldStatus,
    newStatus: input.newStatus,
  });

  return sendEmail({
    type: "claim.status.changed",
    to: claim.client.email,
    subject: emailData.subject,
    previewText: emailData.previewText,
    react: createElement(ClaimStatusEmail, {
      clientName: getClientName(claim.client),
      claimNumber: claim.claimNumber,
      oldStatus: input.oldStatus,
      newStatus: input.newStatus,
      panelUrl,
      previewText: emailData.previewText,
      oldStatusLabel: emailData.oldStatusLabel,
      newStatusLabel: emailData.newStatusLabel,
      newStatusTone: emailData.newStatusTone,
      statusDescription: emailData.statusDescription,
      nextStep: emailData.nextStep,
      ctaLabel: emailData.ctaLabel,
    }),
    metadata: {
      claimId: claim.id,
      claimNumber: claim.claimNumber,
      oldStatus: input.oldStatus,
      newStatus: input.newStatus,
    },
  });
}
