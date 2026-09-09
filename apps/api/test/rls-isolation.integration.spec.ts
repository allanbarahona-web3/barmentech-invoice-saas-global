import { UserRole } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PrismaService } from '../src/prisma/prisma.service';
import { TenantService } from '../src/tenant/tenant.service';

type TenantFixture = {
  tenant: {
    id: string;
    subdomain: string;
  };
  user: {
    id: string;
  };
  legalName: string;
};

const describeRls =
  process.env.RUN_RLS_INTEGRATION === 'true' ? describe : describe.skip;

describeRls('tenant RLS isolation', () => {
  let prisma: PrismaService;
  let tenantService: TenantService;
  let tenantA: TenantFixture;
  let tenantB: TenantFixture;
  const suffix = randomUUID();

  beforeAll(async () => {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL is required for RLS integration tests');
    }

    prisma = new PrismaService();
    await prisma.onModuleInit();
    tenantService = new TenantService(prisma);

    tenantA = await createTenantFixture('a');
    tenantB = await createTenantFixture('b');
  });

  afterAll(async () => {
    if (prisma) {
      if (tenantA) {
        await deleteTenantFixture(tenantA);
      }

      if (tenantB) {
        await deleteTenantFixture(tenantB);
      }

      await prisma.$disconnect();
    }
  });

  it('returns own rows and hides the other tenant rows in both directions', async () => {
    const resolvedTenantA = await tenantService.resolveTenant(
      `${tenantA.tenant.subdomain}.test.local`,
    );
    const resolvedTenantB = await tenantService.resolveTenant(
      `${tenantB.tenant.subdomain}.test.local`,
    );

    expect(resolvedTenantA.settings?.legalName).toBe(tenantA.legalName);
    expect(resolvedTenantB.settings?.legalName).toBe(tenantB.legalName);

    const tenantAReads = await readTenantRows(tenantA, tenantB);
    expect(tenantAReads.ownSettings?.legalName).toBe(tenantA.legalName);
    expect(tenantAReads.ownMembership?.userId).toBe(tenantA.user.id);
    expect(tenantAReads.otherSettings).toBeNull();
    expect(tenantAReads.otherMembership).toBeNull();

    const tenantBReads = await readTenantRows(tenantB, tenantA);
    expect(tenantBReads.ownSettings?.legalName).toBe(tenantB.legalName);
    expect(tenantBReads.ownMembership?.userId).toBe(tenantB.user.id);
    expect(tenantBReads.otherSettings).toBeNull();
    expect(tenantBReads.otherMembership).toBeNull();
  });

  async function createTenantFixture(label: string): Promise<TenantFixture> {
    const legalName = `RLS Tenant ${label.toUpperCase()} ${suffix}`;
    const tenant = await prisma.tenant.create({
      data: {
        name: legalName,
        subdomain: `rls-${label}-${suffix}`,
        isActive: true,
      },
      select: {
        id: true,
        subdomain: true,
      },
    });
    const user = await prisma.user.create({
      data: {
        email: `rls-${label}-${suffix}@test.local`,
        fullName: `RLS Tenant ${label.toUpperCase()} User`,
        passwordHash: randomUUID(),
      },
      select: {
        id: true,
      },
    });

    const subdomain = tenant.subdomain;

    if (!subdomain) {
      throw new Error('RLS test tenant must have a subdomain');
    }

    await prisma.runWithTenant(tenant.id, async () => {
      await prisma.db.tenantSettings.create({
        data: {
          tenantId: tenant.id,
          legalName,
        },
      });
      await prisma.db.tenantMembership.create({
        data: {
          tenantId: tenant.id,
          userId: user.id,
          role: UserRole.ADMIN,
        },
      });
    });

    return {
      tenant: {
        id: tenant.id,
        subdomain,
      },
      user,
      legalName,
    };
  }

  async function deleteTenantFixture(fixture: TenantFixture): Promise<void> {
    await prisma.runWithTenant(fixture.tenant.id, async () => {
      await prisma.db.tenantMembership.delete({
        where: {
          tenantId_userId: {
            tenantId: fixture.tenant.id,
            userId: fixture.user.id,
          },
        },
      });
      await prisma.db.tenantSettings.delete({
        where: { tenantId: fixture.tenant.id },
      });
    });

    await prisma.user.delete({ where: { id: fixture.user.id } });
    await prisma.tenant.delete({ where: { id: fixture.tenant.id } });
  }

  async function readTenantRows(
    currentTenant: TenantFixture,
    otherTenant: TenantFixture,
  ) {
    return prisma.runWithTenant(currentTenant.tenant.id, async () => {
      const ownSettings = await prisma.db.tenantSettings.findUnique({
        where: { tenantId: currentTenant.tenant.id },
      });
      const ownMembership = await prisma.db.tenantMembership.findUnique({
        where: {
          tenantId_userId: {
            tenantId: currentTenant.tenant.id,
            userId: currentTenant.user.id,
          },
        },
      });
      const otherSettings = await prisma.db.tenantSettings.findUnique({
        where: { tenantId: otherTenant.tenant.id },
      });
      const otherMembership = await prisma.db.tenantMembership.findUnique({
        where: {
          tenantId_userId: {
            tenantId: otherTenant.tenant.id,
            userId: otherTenant.user.id,
          },
        },
      });

      return {
        ownSettings,
        ownMembership,
        otherSettings,
        otherMembership,
      };
    });
  }
});
