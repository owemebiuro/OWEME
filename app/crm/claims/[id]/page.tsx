import { TRPCError } from "@trpc/server";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ClaimDetailView } from "@/components/claims/detail/ClaimDetailView";
import { requireAuth } from "@/lib/auth-helpers";
import type {
  ClaimDetailData,
  ClaimUserSummary,
} from "@/lib/claims/detail-types";
import { createTRPCCaller } from "@/lib/trpc/server";

type ClaimPageProps = {
  params: Promise<{
    id: string;
  }>;
};

type TRPCCaller = Awaited<ReturnType<typeof createTRPCCaller>>;
type ClaimByIdResult = Awaited<ReturnType<TRPCCaller["claims"]["getById"]>>;
type ActiveUsersResult = Awaited<ReturnType<TRPCCaller["users"]["listActive"]>>;

export async function generateMetadata({
  params,
}: ClaimPageProps): Promise<Metadata> {
  const { id } = await params;

  return {
    title: `Sprawa ${id} | OWEME CRM`,
  };
}

function serializeDate(value: Date | string | null | undefined) {
  if (!value) {
    return null;
  }

  return value instanceof Date ? value.toISOString() : value;
}

function serializeUser(
  user: { id: string; name: string; email: string; role?: ClaimUserSummary["role"] },
): ClaimUserSummary {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    ...(user.role ? { role: user.role } : {}),
  };
}

function serializeClaim(claim: ClaimByIdResult): ClaimDetailData {
  return {
    id: claim.id,
    claimNumber: claim.claimNumber,
    type: claim.type,
    source: claim.source,
    status: claim.status,
    subStatus: claim.subStatus,
    ownerId: claim.ownerId,
    creatorId: claim.creatorId,
    potentialAmount: claim.potentialAmount?.toString() ?? null,
    estimatedFee: claim.estimatedFee?.toString() ?? null,
    commissionModel: claim.commissionModel,
    isCourtStage: claim.isCourtStage,
    isPolishJurisdiction: claim.isPolishJurisdiction,
    dataCompleteness: claim.dataCompleteness,
    qualifiedAt: serializeDate(claim.qualifiedAt),
    closedAt: serializeDate(claim.closedAt),
    closeReason: claim.closeReason,
    createdAt: serializeDate(claim.createdAt) ?? new Date().toISOString(),
    updatedAt: serializeDate(claim.updatedAt) ?? new Date().toISOString(),
    client: {
      id: claim.client.id,
      firstName: claim.client.firstName,
      lastName: claim.client.lastName,
      email: claim.client.email,
      phone: claim.client.phone,
      nationality: claim.client.nationality,
      address: claim.client.address,
      postalCode: claim.client.postalCode,
      city: claim.client.city,
      country: claim.client.country,
      claimsCount: claim.client._count.claims,
    },
    flight: claim.flight
      ? {
          id: claim.flight.id,
          flightNumber: claim.flight.flightNumber,
          flightDate: serializeDate(claim.flight.flightDate) ?? "",
          departureAirportCode: claim.flight.departureAirportCode,
          arrivalAirportCode: claim.flight.arrivalAirportCode,
          scheduledDeparture: serializeDate(claim.flight.scheduledDeparture),
          actualDeparture: serializeDate(claim.flight.actualDeparture),
          scheduledArrival: serializeDate(claim.flight.scheduledArrival),
          actualArrival: serializeDate(claim.flight.actualArrival),
          delayMinutes: claim.flight.delayMinutes,
          flightStatus: claim.flight.flightStatus,
          dataSource: claim.flight.dataSource,
          lastApiRefreshAt: serializeDate(claim.flight.lastApiRefreshAt),
        }
      : null,
    airline: claim.airline
      ? {
          id: claim.airline.id,
          name: claim.airline.name,
          iataCode: claim.airline.iataCode,
          country: claim.airline.country,
        }
      : null,
    owner: claim.owner ? serializeUser(claim.owner) : null,
    creator: serializeUser(claim.creator),
    passengers: claim.passengers.map((passenger) => ({
      id: passenger.id,
      firstName: passenger.firstName,
      lastName: passenger.lastName,
      relationToClient: passenger.relationToClient,
      isPrimary: passenger.isPrimary,
      hasSignedDocs: passenger.hasSignedDocs,
    })),
    documents: claim.documents.map((document) => ({
      id: document.id,
      type: document.type,
      fileName: document.fileName,
      version: document.version,
      status: document.status,
      storageKey: document.storageKey,
      isSigned: document.isSigned,
      signedAt: serializeDate(document.signedAt),
      generatedAt: serializeDate(document.generatedAt) ?? "",
    })),
    attachments: claim.attachments.map((attachment) => ({
      id: attachment.id,
      uploadedById: attachment.uploadedById,
      type: attachment.type,
      fileName: attachment.fileName,
      mimeType: attachment.mimeType,
      sizeBytes: attachment.sizeBytes,
      storageKey: attachment.storageKey,
      verificationStatus: attachment.verificationStatus,
      createdAt: serializeDate(attachment.createdAt) ?? "",
    })),
    notes: claim.notes.map((note) => ({
      id: note.id,
      content: note.content,
      type: note.type,
      visibility: note.visibility,
      metadata: note.metadata,
      createdAt: serializeDate(note.createdAt) ?? "",
      author: serializeUser(note.author),
    })),
    tasks: claim.tasks.map((task) => ({
      id: task.id,
      title: task.title,
      description: task.description,
      dueDate: serializeDate(task.dueDate),
      priority: task.priority,
      status: task.status,
      closedAt: serializeDate(task.closedAt),
      createdAt: serializeDate(task.createdAt) ?? "",
      assignee: task.assignee ? serializeUser(task.assignee) : null,
    })),
    statusHistory: claim.statusHistory.map((entry) => ({
      id: entry.id,
      oldStatus: entry.oldStatus,
      newStatus: entry.newStatus,
      comment: entry.comment,
      createdAt: serializeDate(entry.createdAt) ?? "",
      changedBy: serializeUser(entry.changedBy),
    })),
    assignmentHistory: claim.assignmentHistory.map((entry) => ({
      id: entry.id,
      previousOwnerId: entry.previousOwnerId,
      newOwnerId: entry.newOwnerId,
      createdAt: serializeDate(entry.createdAt) ?? "",
      changedBy: serializeUser(entry.changedBy),
    })),
    payouts: claim.payouts.map((payout) => ({
      id: payout.id,
      amountRecovered: payout.amountRecovered.toString(),
      currency: payout.currency,
      receivedAt: serializeDate(payout.receivedAt) ?? "",
      owemeFee: payout.owemeFee.toString(),
      commissionModel: payout.commissionModel,
      clientAmount: payout.clientAmount.toString(),
      clientPaidAt: serializeDate(payout.clientPaidAt),
      status: payout.status,
      notes: payout.notes,
    })),
  };
}

function AppUserMissingState({ email }: { email: string | undefined }) {
  return (
    <main className="min-h-screen bg-neutral-50 px-6 py-8 text-neutral-950">
      <div className="mx-auto max-w-3xl rounded-lg border border-amber-200 bg-amber-50 p-6">
        <p className="text-sm font-semibold text-amber-700">OWEME CRM</p>
        <h1 className="mt-2 text-2xl font-semibold">
          Brak użytkownika aplikacyjnego
        </h1>
        <p className="mt-3 text-sm leading-6 text-amber-900">
          Sesja Supabase jest aktywna{email ? ` dla ${email}` : ""}, ale karta
          sprawy wymaga powiązanego użytkownika aplikacyjnego CRM.
        </p>
      </div>
    </main>
  );
}

export default async function ClaimPage({ params }: ClaimPageProps) {
  const currentUser = await requireAuth();

  if (!currentUser.appUser) {
    return <AppUserMissingState email={currentUser.authUser.email} />;
  }

  const { id } = await params;
  const trpc = await createTRPCCaller();
  let claim: ClaimByIdResult;
  let owners: ActiveUsersResult;

  try {
    [claim, owners] = await Promise.all([
      trpc.claims.getById({ id }),
      trpc.users.listActive(),
    ]);
  } catch (error) {
    if (error instanceof TRPCError && error.code === "NOT_FOUND") {
      notFound();
    }

    throw error;
  }

  return (
    <main className="min-h-screen bg-neutral-50 text-neutral-950">
      <ClaimDetailView
        claim={serializeClaim(claim)}
        owners={owners}
        currentUser={currentUser.appUser}
      />
    </main>
  );
}
