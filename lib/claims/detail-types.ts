import type {
  ApiDataSource,
  AttachmentType,
  ClaimSource,
  ClaimStatus,
  ClaimType,
  CommissionModel,
  DocumentStatus,
  DocumentType,
  FlightStatus,
  NoteType,
  SettlementStatus,
  TaskPriority,
  TaskStatus,
  UserRole,
} from "@prisma/client";

export type ClaimUserSummary = {
  id: string;
  name: string;
  email: string;
  role?: UserRole;
};

export type ClaimDetailData = {
  id: string;
  claimNumber: string;
  type: ClaimType;
  source: ClaimSource;
  status: ClaimStatus;
  subStatus: string | null;
  ownerId: string | null;
  creatorId: string;
  potentialAmount: string | null;
  estimatedFee: string | null;
  commissionModel: CommissionModel;
  isCourtStage: boolean;
  isPolishJurisdiction: boolean;
  dataCompleteness: number;
  qualifiedAt: string | null;
  closedAt: string | null;
  closeReason: string | null;
  createdAt: string;
  updatedAt: string;
  client: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string | null;
    nationality: string | null;
    address: string | null;
    postalCode: string | null;
    city: string | null;
    country: string;
    claimsCount: number;
  };
  flight: {
    id: string;
    flightNumber: string;
    flightDate: string;
    departureAirportCode: string;
    arrivalAirportCode: string;
    scheduledDeparture: string | null;
    actualDeparture: string | null;
    scheduledArrival: string | null;
    actualArrival: string | null;
    delayMinutes: number | null;
    flightStatus: FlightStatus;
    dataSource: ApiDataSource;
    lastApiRefreshAt: string | null;
  } | null;
  airline: {
    id: string;
    name: string;
    iataCode: string;
    country: string | null;
  } | null;
  owner: ClaimUserSummary | null;
  creator: ClaimUserSummary;
  passengers: Array<{
    id: string;
    firstName: string;
    lastName: string;
    relationToClient: string | null;
    isPrimary: boolean;
    hasSignedDocs: boolean;
  }>;
  documents: Array<{
    id: string;
    type: DocumentType;
    fileName: string;
    version: number;
    status: DocumentStatus;
    storageKey: string;
    isSigned: boolean;
    signedAt: string | null;
    generatedAt: string;
  }>;
  attachments: Array<{
    id: string;
    uploadedById: string;
    type: AttachmentType;
    fileName: string;
    mimeType: string;
    sizeBytes: number;
    storageKey: string;
    verificationStatus: string;
    createdAt: string;
  }>;
  notes: Array<{
    id: string;
    content: string;
    type: NoteType;
    visibility: string;
    metadata: unknown;
    createdAt: string;
    author: ClaimUserSummary;
  }>;
  tasks: Array<{
    id: string;
    title: string;
    description: string | null;
    dueDate: string | null;
    priority: TaskPriority;
    status: TaskStatus;
    closedAt: string | null;
    createdAt: string;
    assignee: ClaimUserSummary | null;
  }>;
  statusHistory: Array<{
    id: string;
    oldStatus: ClaimStatus;
    newStatus: ClaimStatus;
    comment: string | null;
    createdAt: string;
    changedBy: ClaimUserSummary;
  }>;
  assignmentHistory: Array<{
    id: string;
    previousOwnerId: string | null;
    newOwnerId: string | null;
    createdAt: string;
    changedBy: ClaimUserSummary;
  }>;
  payouts: Array<{
    id: string;
    amountRecovered: string;
    currency: string;
    receivedAt: string;
    owemeFee: string;
    commissionModel: CommissionModel;
    clientAmount: string;
    clientPaidAt: string | null;
    status: SettlementStatus;
    notes: string | null;
  }>;
};
