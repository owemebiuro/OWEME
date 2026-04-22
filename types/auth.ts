import type { User, UserRole } from "@prisma/client";

export type { UserRole };

export type AppUser = Pick<
  User,
  "id" | "authUserId" | "email" | "name" | "role" | "isActive"
>;

export type AuthenticatedAppUser = AppUser & {
  authUserId: string | null;
};

export type PermissionAction =
  | "crm:read"
  | "crm:write"
  | "admin:read"
  | "admin:write"
  | "claims:assign"
  | "documents:generate";
