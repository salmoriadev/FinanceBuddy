/**
 * Centralizes shared CRUD assertions used by application services to enforce
 * consistent error handling and authorization checks across modules.
 */
import { ForbiddenException, NotFoundException } from "@nestjs/common";

export type DeleteManyResult = { count: number };

type CategoryLookupRepository = {
  findCategoryForUser(userId: string, categoryId: string): Promise<{ id: string } | null>;
};

export const DELETED_RESPONSE = { deleted: true } as const;

export const assertResourceFound = <T>(
  resource: T | null,
  message: string,
): T => {
  if (!resource) {
    throw new NotFoundException(message);
  }
  return resource;
};

export const assertResourceDeleted = (
  result: DeleteManyResult,
  message: string,
) => {
  if (result.count === 0) {
    throw new NotFoundException(message);
  }
  return DELETED_RESPONSE;
};

export const assertCategoryAccess = async (
  repository: CategoryLookupRepository,
  userId: string,
  categoryId: string,
) => {
  const category = await repository.findCategoryForUser(userId, categoryId);
  if (!category) {
    throw new ForbiddenException("Category not available for this user");
  }
};
