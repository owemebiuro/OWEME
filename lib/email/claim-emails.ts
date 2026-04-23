import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { claimRegisteredEmailTemplate } from "@/lib/email/templates";

export async function sendClaimRegisteredEmail(claimId: string) {
  const claim = await prisma.claim.findFirst({
    where: {
      id: claimId,
      deletedAt: null,
    },
    select: {
      claimNumber: true,
      potentialAmount: true,
      client: {
        select: {
          firstName: true,
          email: true,
        },
      },
      flight: {
        select: {
          flightNumber: true,
          flightDate: true,
          departureAirportCode: true,
          arrivalAirportCode: true,
        },
      },
    },
  });

  if (!claim) {
    console.warn("[Email] Nie znaleziono sprawy do potwierdzenia.", {
      claimId,
    });
    return;
  }

  const template = claimRegisteredEmailTemplate({
    clientFirstName: claim.client.firstName,
    claimNumber: claim.claimNumber,
    flightNumber: claim.flight?.flightNumber ?? null,
    flightDate: claim.flight?.flightDate ?? null,
    route: claim.flight
      ? `${claim.flight.departureAirportCode} → ${claim.flight.arrivalAirportCode}`
      : null,
    potentialAmount: claim.potentialAmount?.toString() ?? null,
  });

  await sendEmail({
    to: claim.client.email,
    subject: template.subject,
    html: template.html,
  });
}
