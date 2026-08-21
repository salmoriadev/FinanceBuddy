import { PrismaService } from "../src/database/prisma.service";
import { AuthRepository } from "../src/modules/auth/auth.repository";

describe("AuthRepository refresh rotation", () => {
  const replacement = {
    id: "new-token-id",
    userId: "user-1",
    tokenHash: "new-token-hash",
    familyId: "family-1",
    replacedByTokenId: null,
    userAgent: null,
    ipAddress: null,
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + 60_000),
    revokedAt: null,
  };

  const rotationInput = {
    currentTokenId: "old-token-id",
    userId: "user-1",
    familyId: "family-1",
    tokenHash: "new-token-hash",
    expiresAt: replacement.expiresAt,
  };

  it("claims, creates, and links a replacement in one transaction", async () => {
    const transaction = {
      refreshToken: {
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        create: jest.fn().mockResolvedValue(replacement),
        update: jest.fn().mockResolvedValue({}),
      },
    };
    const prisma = {
      $transaction: jest.fn((callback) => callback(transaction)),
    } as unknown as PrismaService;
    const repository = new AuthRepository(prisma);

    await expect(repository.rotateRefreshToken(rotationInput)).resolves.toEqual(
      replacement,
    );

    expect(transaction.refreshToken.updateMany).toHaveBeenCalledWith({
      where: {
        id: "old-token-id",
        userId: "user-1",
        familyId: "family-1",
        revokedAt: null,
      },
      data: { revokedAt: expect.any(Date) },
    });
    expect(transaction.refreshToken.create).toHaveBeenCalledTimes(1);
    expect(transaction.refreshToken.update).toHaveBeenCalledWith({
      where: { id: "old-token-id" },
      data: { replacedByTokenId: "new-token-id" },
    });
  });

  it("does not create a sibling token when the claim loses", async () => {
    const transaction = {
      refreshToken: {
        updateMany: jest.fn().mockResolvedValue({ count: 0 }),
        create: jest.fn(),
        update: jest.fn(),
      },
    };
    const prisma = {
      $transaction: jest.fn((callback) => callback(transaction)),
    } as unknown as PrismaService;
    const repository = new AuthRepository(prisma);

    await expect(repository.rotateRefreshToken(rotationInput)).resolves.toBeNull();
    expect(transaction.refreshToken.create).not.toHaveBeenCalled();
    expect(transaction.refreshToken.update).not.toHaveBeenCalled();
  });
});
