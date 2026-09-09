import { AsyncLocalStorage } from 'node:async_hooks';
import { Prisma } from '@prisma/client';

export type PrismaRequestContext = {
  tenantId: string | null;
  tx: Prisma.TransactionClient | null;
};

const storage = new AsyncLocalStorage<PrismaRequestContext>();

export function runWithPrismaRequestContext<T>(
  context: PrismaRequestContext,
  callback: () => Promise<T>,
): Promise<T> {
  return storage.run(context, callback);
}

export function getPrismaRequestContext(): PrismaRequestContext {
  return storage.getStore() ?? {
    tenantId: null,
    tx: null,
  };
}
