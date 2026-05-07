import { UserRole } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { AppUser } from "@/types/auth";
import { resolveBootstrapAdminUser } from "@/lib/auth-bootstrap";

const { hasPrismaDatabaseUrlMock, prismaMock } = vi.hoisted(() => ({
  hasPrismaDatabaseUrlMock: vi.fn(() => true),
  prismaMock: {
    user: {
      count: vi.fn(),
      create: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock("@/lib/prisma", () => ({
  hasPrismaDatabaseUrl: hasPrismaDatabaseUrlMock,
  prisma: prismaMock,
}));

const authUser = {
  id: "auth-user-1",
  email: "Owner@Oweme.pl",
  user_metadata: { name: "Owner" },
};

const operatorUser: AppUser = {
  id: "app-user-1",
  authUserId: "auth-user-1",
  email: "owner@oweme.pl",
  name: "Owner",
  role: UserRole.OPERATOR,
  isActive: true,
};

describe("resolveBootstrapAdminUser", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    hasPrismaDatabaseUrlMock.mockReturnValue(true);
    delete process.env.OWEME_BOOTSTRAP_ADMIN_EMAILS;
  });

  it("keeps an existing active admin without another database lookup", async () => {
    const adminUser = { ...operatorUser, role: UserRole.ADMIN };

    await expect(resolveBootstrapAdminUser(authUser, adminUser)).resolves.toBe(
      adminUser,
    );
    expect(prismaMock.user.findFirst).not.toHaveBeenCalled();
  });

  it("promotes an existing active non-admin when the email is allowlisted", async () => {
    process.env.OWEME_BOOTSTRAP_ADMIN_EMAILS = "owner@oweme.pl";
    const promotedUser = { ...operatorUser, role: UserRole.ADMIN };

    prismaMock.user.findFirst.mockResolvedValue(operatorUser);
    prismaMock.user.update.mockResolvedValue(promotedUser);

    await expect(
      resolveBootstrapAdminUser(authUser, operatorUser),
    ).resolves.toEqual(promotedUser);
    expect(prismaMock.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: operatorUser.id },
        data: expect.objectContaining({
          role: UserRole.ADMIN,
          isActive: true,
        }),
      }),
    );
  });

  it("leaves an existing non-admin unchanged when bootstrap is not allowed", async () => {
    prismaMock.user.findFirst.mockResolvedValue(operatorUser);
    prismaMock.user.count.mockResolvedValue(5);

    await expect(
      resolveBootstrapAdminUser(authUser, operatorUser),
    ).resolves.toBe(operatorUser);
    expect(prismaMock.user.update).not.toHaveBeenCalled();
  });
});
