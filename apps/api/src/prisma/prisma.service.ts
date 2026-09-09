import {
  INestApplication,
  Injectable,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import {
  getPrismaRequestContext,
  runWithPrismaRequestContext,
} from './prisma-request-context';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    const connectionString = process.env.DATABASE_URL;

    if (!connectionString) {
      throw new Error('DATABASE_URL is required');
    }

    const adapter = new PrismaPg({
      connectionString,
    });

    super({
      adapter,
    });
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
    this.logger.log('PrismaService connected');
  }

  async enableShutdownHooks(app: INestApplication): Promise<void> {
    this.$on('beforeExit' as never, async () => {
      await app.close();
    });
  }

  get db(): Prisma.TransactionClient | PrismaClient {
    return getPrismaRequestContext().tx ?? this;
  }

  get currentTenantId(): string | null {
    return getPrismaRequestContext().tenantId;
  }

  async runWithTenant<T>(
    tenantId: string,
    callback: () => Promise<T>,
  ): Promise<T> {
    if (!tenantId || typeof tenantId !== 'string') {
      throw new Error('runWithTenant requires a valid tenantId');
    }

    return this.$transaction(async (tx) => {
      await tx.$executeRaw`
        SELECT set_config('app.current_tenant_id', ${tenantId}, true)
      `;

      return runWithPrismaRequestContext(
        {
          tenantId,
          tx,
        },
        callback,
      );
    });
  }

  async runWithoutTenant<T>(callback: () => Promise<T>): Promise<T> {
    return runWithPrismaRequestContext(
      {
        tenantId: null,
        tx: null,
      },
      callback,
    );
  }
}
