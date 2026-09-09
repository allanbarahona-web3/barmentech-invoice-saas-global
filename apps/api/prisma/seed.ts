import {
  PlatformRole,
  PrismaClient,
  UserRole,
} from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { hash } from 'bcryptjs';
import { loadEnvironmentFile } from '../src/config/load-environment-file';

loadEnvironmentFile();

const connectionString = process.env.DIRECT_DATABASE_URL;

if (!connectionString) {
  throw new Error('DIRECT_DATABASE_URL is required');
}

const adapter = new PrismaPg({
  connectionString,
});

const prisma = new PrismaClient({
  adapter,
});

function getRequiredSeedValue(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is required to run the seed`);
  }

  return value;
}

async function main() {
  const superAdminEmail = getRequiredSeedValue('SEED_SUPER_ADMIN_EMAIL');
  const superAdminPassword = getRequiredSeedValue(
    'SEED_SUPER_ADMIN_PASSWORD',
  );
  const tenantAdminEmail = getRequiredSeedValue('SEED_TENANT_ADMIN_EMAIL');
  const tenantAdminPassword = getRequiredSeedValue(
    'SEED_TENANT_ADMIN_PASSWORD',
  );
  const superAdminPasswordHash = await hash(superAdminPassword, 10);
  const tenantAdminPasswordHash = await hash(tenantAdminPassword, 10);

  const superAdmin = await prisma.user.upsert({
    where: {
      email: superAdminEmail,
    },
    update: {
      fullName: 'BarmenTech Super Admin',
      passwordHash: superAdminPasswordHash,
      isActive: true,
      platformRole: PlatformRole.SUPER_ADMIN,
    },
    create: {
      email: superAdminEmail,
      fullName: 'BarmenTech Super Admin',
      passwordHash: superAdminPasswordHash,
      isActive: true,
      platformRole: PlatformRole.SUPER_ADMIN,
    },
  });

  const tenant = await prisma.tenant.upsert({
    where: {
      subdomain: 'demo',
    },
    update: {
      name: 'Demo Invoice',
      isActive: true,
    },
    create: {
      name: 'Demo Invoice',
      subdomain: 'demo',
      isActive: true,
    },
  });

  await prisma.tenantSettings.upsert({
    where: {
      tenantId: tenant.id,
    },
    update: {
      legalName: 'Demo Invoice',
      countryCode: 'CR',
      defaultCurrencyCode: 'CRC',
      timezone: 'America/Costa_Rica',
      locale: 'es-CR',
    },
    create: {
      tenantId: tenant.id,
      legalName: 'Demo Invoice',
      countryCode: 'CR',
      defaultCurrencyCode: 'CRC',
      timezone: 'America/Costa_Rica',
      locale: 'es-CR',
    },
  });

  const tenantAdmin = await prisma.user.upsert({
    where: {
      email: tenantAdminEmail,
    },
    update: {
      fullName: 'Demo Admin',
      passwordHash: tenantAdminPasswordHash,
      isActive: true,
      platformRole: null,
    },
    create: {
      email: tenantAdminEmail,
      fullName: 'Demo Admin',
      passwordHash: tenantAdminPasswordHash,
      isActive: true,
      platformRole: null,
    },
  });

  await prisma.$transaction(async (tx) => {
    await tx.$executeRaw`
      SELECT set_config('app.current_tenant_id', ${tenant.id}, true)
    `;

    await tx.tenantMembership.upsert({
      where: {
        tenantId_userId: {
          tenantId: tenant.id,
          userId: tenantAdmin.id,
        },
      },
      update: {
        role: UserRole.ADMIN,
        isActive: true,
      },
      create: {
        tenantId: tenant.id,
        userId: tenantAdmin.id,
        role: UserRole.ADMIN,
        isActive: true,
      },
    });
  });

  console.log({
    superAdmin: superAdmin.email,
    tenant: tenant.name,
    tenantAdmin: tenantAdmin.email,
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
