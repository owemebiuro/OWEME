import "server-only";

import DocumentRequestEmail from "@/src/emails/document-request-email";
import { prisma } from "@/lib/prisma";
import { getAppBaseUrl } from "@/src/lib/resend";
import { sendEmail } from "@/src/server/mail/send-email";
import { getDocumentRequestEmailData } from "@/src/server/mail/templates";

export type SendDocumentRequestEmailInput = {
  claimId: string;
  requestedDocuments?: string[];
};

function getClientName(client: { firstName: string; lastName: string }) {
  return `${client.firstName} ${client.lastName}`.trim();
}

export async function sendDocumentRequestEmail(input: SendDocumentRequestEmailInput) {
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
  const emailData = getDocumentRequestEmailData({
    claimNumber: claim.claimNumber,
  });

  return sendEmail({
    type: "claim.documents.requested",
    to: claim.client.email,
    subject: emailData.subject,
    previewText: emailData.previewText,
    react: (
      <DocumentRequestEmail
        clientName={getClientName(claim.client)}
        claimNumber={claim.claimNumber}
        panelUrl={panelUrl}
        requestedDocuments={input.requestedDocuments}
        previewText={emailData.previewText}
      />
    ),
    metadata: {
      claimId: claim.id,
      claimNumber: claim.claimNumber,
      requestedDocuments: input.requestedDocuments,
    },
  });
}
