import { PlatformRole, UserRole } from '@prisma/client';
import type { INestApplication } from '@nestjs/common';
import { hash } from 'bcryptjs';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from 'vitest';
import { AppModule } from '../src/app.module';
import { PrismaService as ApplicationPrismaService } from '../src/prisma/prisma.service';
import { createHttpTestApp } from './helpers/create-http-test-app';

type UserFixture = {
  id: string;
  email: string;
  password: string;
};

type DemoTenantFixture = {
  id: string;
  subdomain: string;
};

const platformHost = 'platform.test.local';
const responseFields = [
  'tenantId',
  'tenantName',
  'subdomain',
  'customDomain',
  'isActive',
  'createdAt',
  'updatedAt',
  'countryCode',
  'defaultCurrencyCode',
  'locale',
  'timezone',
].sort();

describe('Platform tenant listing HTTP', () => {
  const suffix = randomUUID();
  const password = randomUUID();
  let fixturePrisma: ApplicationPrismaService | undefined;
  let app: INestApplication | undefined;
  let demoTenant: DemoTenantFixture;
  let tenantAdmin: UserFixture;
  let superAdmin: UserFixture;

  beforeAll(async () => {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL is required for platform tenant tests');
    }

    fixturePrisma = new ApplicationPrismaService();
    await fixturePrisma.onModuleInit();

    const demo = await fixturePrisma.tenant.findUnique({
      where: { subdomain: 'demo' },
      select: { id: true, subdomain: true, name: true },
    });

    if (!demo || !demo.subdomain || demo.name !== 'Demo Invoice') {
      throw new Error('The seeded Demo Invoice tenant is required');
    }

    demoTenant = { id: demo.id, subdomain: demo.subdomain };
    tenantAdmin = await createUser('tenant-admin');
    superAdmin = await createUser('super-admin', PlatformRole.SUPER_ADMIN);

    await fixturePrisma.runWithTenant(demoTenant.id, async () => {
      await fixturePrisma!.db.tenantMembership.create({
        data: {
          tenantId: demoTenant.id,
          userId: tenantAdmin.id,
          role: UserRole.ADMIN,
          isActive: true,
        },
      });
    });
  });

  beforeEach(async () => {
    app = await createHttpTestApp({ imports: [AppModule] });
  });

  afterEach(async () => {
    await app?.close();
    app = undefined;
  });

  afterAll(async () => {
    if (!fixturePrisma) {
      return;
    }

    try {
      if (demoTenant && tenantAdmin) {
        await fixturePrisma.runWithTenant(demoTenant.id, async () => {
          await fixturePrisma!.db.tenantMembership.deleteMany({
            where: {
              tenantId: demoTenant.id,
              userId: tenantAdmin.id,
            },
          });
        });
      }

      const userIds = [tenantAdmin, superAdmin]
        .filter((user): user is UserFixture => Boolean(user))
        .map((user) => user.id);

      if (userIds.length > 0) {
        await fixturePrisma.user.deleteMany({
          where: { id: { in: userIds } },
        });
      }
    } finally {
      await fixturePrisma.$disconnect();
    }
  });

  it('rejects an unauthenticated platform tenant request', async () => {
    const response = await request(httpServer())
      .get('/v1/platform/tenants')
      .set('Host', platformHost);

    expect(response.status).toBe(401);
  });

  it('rejects a tenant ADMIN token', async () => {
    const tenantSession = await loginTenant();

    const response = await request(httpServer())
      .get('/v1/platform/tenants')
      .set('Host', platformHost)
      .set('Authorization', `Bearer ${tenantSession.body.accessToken}`);

    expect(response.status).toBe(403);
  });

  it('returns the approved tenant projection to a SUPER_ADMIN', async () => {
    const superAdminSession = await loginSuperAdmin();

    const response = await request(httpServer())
      .get('/v1/platform/tenants')
      .set('Host', platformHost)
      .set('Authorization', `Bearer ${superAdminSession.body.accessToken}`);

    expect(response.status).toBe(200);

    const demo = response.body.find(
      (tenant: { tenantName?: string }) =>
        tenant.tenantName === 'Demo Invoice',
    );

    expect(demo).toMatchObject({
      tenantId: demoTenant.id,
      tenantName: 'Demo Invoice',
      subdomain: 'demo',
      isActive: true,
      countryCode: 'CR',
      defaultCurrencyCode: 'CRC',
      locale: 'es-CR',
      timezone: 'America/Costa_Rica',
    });
    expect(Object.keys(demo).sort()).toEqual(responseFields);
    expect(demo).not.toHaveProperty('legalName');
    expect(demo).not.toHaveProperty('legalId');
    expect(demo).not.toHaveProperty('contactEmail');
    expect(demo).not.toHaveProperty('memberships');
    expect(demo).not.toHaveProperty('users');
  });

  async function createUser(
    label: string,
    platformRole: PlatformRole | null = null,
  ): Promise<UserFixture> {
    const user = await fixturePrisma!.user.create({
      data: {
        email: `platform-tenants-${label}-${suffix}@test.local`,
        fullName: `Platform Tenants ${label}`,
        passwordHash: await hash(password, 10),
        isActive: true,
        platformRole,
      },
      select: { id: true, email: true },
    });

    return { ...user, password };
  }

  function httpServer() {
    if (!app) {
      throw new Error('HTTP test application is not initialized');
    }

    return app.getHttpServer();
  }

  function loginTenant() {
    return request(httpServer())
      .post('/auth/login')
      .set('Host', `${demoTenant.subdomain}.test.local`)
      .send({ email: tenantAdmin.email, password: tenantAdmin.password });
  }

  function loginSuperAdmin() {
    return request(httpServer())
      .post('/auth/super-admin/login')
      .set('Host', platformHost)
      .send({ email: superAdmin.email, password: superAdmin.password });
  }
});
