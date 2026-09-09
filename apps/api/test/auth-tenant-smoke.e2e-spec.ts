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

type TenantFixture = {
  id: string;
  subdomain: string;
};

type UserFixture = {
  id: string;
  email: string;
  password: string;
};

describe('Auth and tenant HTTP smoke tests', () => {
  const suffix = randomUUID();
  const tenantPassword = randomUUID();
  const superAdminPassword = randomUUID();
  let fixturePrisma: ApplicationPrismaService | undefined;
  let app: INestApplication | undefined;
  let activeTenant: TenantFixture;
  let inactiveTenant: TenantFixture;
  let tenantAdmin: UserFixture;
  let inactiveUser: UserFixture;
  let inactiveMembershipUser: UserFixture;
  let inactiveTenantUser: UserFixture;
  let superAdmin: UserFixture;

  beforeAll(async () => {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL is required for Auth/Tenant smoke tests');
    }

    fixturePrisma = new ApplicationPrismaService();
    await fixturePrisma.onModuleInit();

    activeTenant = await createTenant('active', true);
    inactiveTenant = await createTenant('inactive', false);

    tenantAdmin = await createUser('tenant-admin', tenantPassword, true);
    inactiveUser = await createUser('inactive-user', tenantPassword, false);
    inactiveMembershipUser = await createUser(
      'inactive-membership',
      tenantPassword,
      true,
    );
    inactiveTenantUser = await createUser('inactive-tenant', tenantPassword, true);
    superAdmin = await createUser(
      'super-admin',
      superAdminPassword,
      true,
      PlatformRole.SUPER_ADMIN,
    );

    await createMembership(activeTenant.id, tenantAdmin.id, true);
    await createMembership(activeTenant.id, inactiveUser.id, true);
    await createMembership(activeTenant.id, inactiveMembershipUser.id, false);
    await createMembership(inactiveTenant.id, inactiveTenantUser.id, true);
  });

  beforeEach(async () => {
    app = await createHttpTestApp({
      imports: [AppModule],
    });
  });

  afterEach(async () => {
    await app?.close();
    app = undefined;
  });

  afterAll(async () => {
    if (!fixturePrisma) {
      return;
    }

    const prisma = fixturePrisma;

    if (activeTenant) {
      await prisma.runWithTenant(activeTenant.id, async () => {
        await prisma.db.tenantMembership.deleteMany({
          where: { tenantId: activeTenant.id },
        });
      });
      await prisma.tenant.delete({ where: { id: activeTenant.id } });
    }

    if (inactiveTenant) {
      await prisma.runWithTenant(inactiveTenant.id, async () => {
        await prisma.db.tenantMembership.deleteMany({
          where: { tenantId: inactiveTenant.id },
        });
      });
      await prisma.tenant.delete({ where: { id: inactiveTenant.id } });
    }

    const userIds = [
      tenantAdmin,
      inactiveUser,
      inactiveMembershipUser,
      inactiveTenantUser,
      superAdmin,
    ]
      .filter((user): user is UserFixture => Boolean(user))
      .map((user) => user.id);

    if (userIds.length > 0) {
      await prisma.user.deleteMany({
        where: { id: { in: userIds } },
      });
    }

    await prisma.$disconnect();
  });

  it('logs in a valid tenant admin', async () => {
    const response = await loginTenant(tenantAdmin.email, tenantAdmin.password);

    expect(response.status).toBe(201);
    expect(response.body.accessToken).toEqual(expect.any(String));
    expect(response.body.user).toMatchObject({
      id: tenantAdmin.id,
      email: tenantAdmin.email,
      role: UserRole.ADMIN,
      tenantId: activeTenant.id,
    });
    expect(response.body.user).not.toHaveProperty('activeJti');
  });

  it('logs in a super admin without tenant resolution', async () => {
    const response = await request(httpServer())
      .post('/auth/super-admin/login')
      .set('Host', 'platform.test.local')
      .send({ email: superAdmin.email, password: superAdmin.password });

    expect(response.status).toBe(201);
    expect(response.body.user).toMatchObject({
      id: superAdmin.id,
      role: PlatformRole.SUPER_ADMIN,
      tenantId: null,
    });
    expect(response.body.user).not.toHaveProperty('activeJti');
  });

  it('returns the tenant JWT identity from GET /auth/me', async () => {
    const login = await loginTenant(tenantAdmin.email, tenantAdmin.password);

    const response = await getMe(login.body.accessToken);

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      id: tenantAdmin.id,
      email: tenantAdmin.email,
      role: UserRole.ADMIN,
      tenantId: activeTenant.id,
    });
    expect(response.body).not.toHaveProperty('activeJti');
  });

  it('rejects GET /auth/me without a token', async () => {
    const response = await request(httpServer())
      .get('/auth/me')
      .set('Host', tenantHost());

    expect(response.status).toBe(401);
  });

  it('rejects GET /auth/me with an invalid token', async () => {
    const response = await getMe('not-a-jwt');

    expect(response.status).toBe(401);
  });

  it('invalidates the prior tenant token after a second login', async () => {
    const firstLogin = await loginTenant(tenantAdmin.email, tenantAdmin.password);
    const secondLogin = await loginTenant(tenantAdmin.email, tenantAdmin.password);

    expect((await getMe(firstLogin.body.accessToken)).status).toBe(401);
    expect((await getMe(secondLogin.body.accessToken)).status).toBe(200);
  });

  it('rejects an inactive user login', async () => {
    const response = await loginTenant(inactiveUser.email, inactiveUser.password);

    expect(response.status).toBe(401);
  });

  it('rejects an inactive tenant membership login', async () => {
    const response = await loginTenant(
      inactiveMembershipUser.email,
      inactiveMembershipUser.password,
    );

    expect(response.status).toBe(401);
  });

  it('rejects login for an inactive tenant', async () => {
    const response = await loginTenant(
      inactiveTenantUser.email,
      inactiveTenantUser.password,
      inactiveTenant.subdomain,
    );

    expect(response.status).toBe(401);
  });

  it('rate limits login after five attempts', async () => {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      expect(
        (
          await loginTenant(tenantAdmin.email, 'incorrect-password')
        ).status,
      ).toBe(401);
    }

    expect(
      (await loginTenant(tenantAdmin.email, 'incorrect-password')).status,
    ).toBe(429);
  });

  async function createTenant(
    label: string,
    isActive: boolean,
  ): Promise<TenantFixture> {
    const tenant = await fixturePrisma!.tenant.create({
      data: {
        name: `Auth Smoke ${label} ${suffix}`,
        subdomain: `auth-smoke-${label}-${suffix}`,
        isActive,
      },
      select: {
        id: true,
        subdomain: true,
      },
    });

    const subdomain = tenant.subdomain;

    if (!subdomain) {
      throw new Error('Auth smoke tenant requires a subdomain');
    }

    return {
      id: tenant.id,
      subdomain,
    };
  }

  async function createUser(
    label: string,
    password: string,
    isActive: boolean,
    platformRole: PlatformRole | null = null,
  ): Promise<UserFixture> {
    const user = await fixturePrisma!.user.create({
      data: {
        email: `auth-smoke-${label}-${suffix}@test.local`,
        fullName: `Auth Smoke ${label}`,
        passwordHash: await hash(password, 10),
        isActive,
        platformRole,
      },
      select: {
        id: true,
        email: true,
      },
    });

    return {
      ...user,
      password,
    };
  }

  async function createMembership(
    tenantId: string,
    userId: string,
    isActive: boolean,
  ): Promise<void> {
    await fixturePrisma!.runWithTenant(tenantId, async () => {
      await fixturePrisma!.db.tenantMembership.create({
        data: {
          tenantId,
          userId,
          role: UserRole.ADMIN,
          isActive,
        },
      });
    });
  }

  function tenantHost(subdomain = activeTenant.subdomain): string {
    return `${subdomain}.test.local`;
  }

  function httpServer() {
    if (!app) {
      throw new Error('HTTP test application is not initialized');
    }

    return app.getHttpServer();
  }

  function loginTenant(
    email: string,
    password: string,
    subdomain = activeTenant.subdomain,
  ) {
    return request(httpServer())
      .post('/auth/login')
      .set('Host', tenantHost(subdomain))
      .send({ email, password });
  }

  function getMe(accessToken: string) {
    return request(httpServer())
      .get('/auth/me')
      .set('Host', tenantHost())
      .set('Authorization', `Bearer ${accessToken}`);
  }
});
