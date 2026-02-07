/**
 * Provides small repository-level helpers to keep Prisma data-access methods
 * concise and consistent across modules.
 */
export const runUpdateAndFind = async <T>(
  update: () => Promise<unknown>,
  find: () => Promise<T | null>,
) => {
  await update();
  return find();
};
