import type { INestApplication } from '@nestjs/common';
import {
  CustomerAddressPurpose,
  CustomerType,
  PlatformRole,
  UserRole,
} from '@prisma/client';
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

type TenantFixture = { id: string; subdomain: string };
type UserFixture = { id: string; email: string; password: string };
type AddressPurpose = {
  purpose: CustomerAddressPurpose;
  isPrimaryForPurpose?: boolean;
};

describe('Customer HTTP', () => {
  const suffix = randomUUID();
  const password = randomUUID();
  let fixturePrisma: ApplicationPrismaService | undefined;
  let app: INestApplication | undefined;
  let tenantA: TenantFixture;
  let tenantB: TenantFixture;
  let tenantAdminA: UserFixture;
  let tenantAdminB: UserFixture;
  let superAdmin: UserFixture;

  beforeAll(async () => {
    if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required for Customer HTTP tests');
    fixturePrisma = new ApplicationPrismaService();
    await fixturePrisma.onModuleInit();
    tenantA = await createTenant('a');
    tenantB = await createTenant('b');
    tenantAdminA = await createUser('tenant-admin-a');
    tenantAdminB = await createUser('tenant-admin-b');
    superAdmin = await createUser('super-admin', PlatformRole.SUPER_ADMIN);
    await createMembership(tenantA.id, tenantAdminA.id);
    await createMembership(tenantB.id, tenantAdminB.id);
  });

  beforeEach(async () => {
    app = await createHttpTestApp({ imports: [AppModule] });
  });

  afterEach(async () => {
    await app?.close();
    app = undefined;
  });

  afterAll(async () => {
    if (!fixturePrisma) return;
    try {
      await cleanupTenant(tenantA);
      await cleanupTenant(tenantB);
      const ids = [tenantAdminA, tenantAdminB, superAdmin]
        .filter((user): user is UserFixture => Boolean(user))
        .map((user) => user.id);
      if (ids.length > 0) await fixturePrisma.user.deleteMany({ where: { id: { in: ids } } });
    } finally {
      await fixturePrisma.$disconnect();
    }
  });

  it('requires an authenticated tenant role', async () => {
    const unauthenticated = await request(httpServer()).get('/customers').set('Host', tenantHost(tenantA));
    const superAdminSession = await loginSuperAdmin();
    const platform = await customerRequest(superAdminSession.body.accessToken, tenantA).get('/customers');

    expect(unauthenticated.status).toBe(401);
    expect(platform.status).toBe(403);
  });

  it('creates a Customer with required normalized identification', async () => {
    const session = await loginTenant(tenantAdminA, tenantA);
    const created = await createOrganization(session.body.accessToken, tenantA, {
      identificationType: 'passport',
      identificationValue: ' ab- 12.34 ',
    });
    const missingIdentity = await customerRequest(session.body.accessToken, tenantA)
      .post('/customers')
      .send({ type: CustomerType.ORGANIZATION, displayName: 'Missing identity', legalName: 'Missing identity' });

    expect(created.status).toBe(201);
    expect(created.body).toMatchObject({ identificationType: 'PASSPORT', identificationValue: 'ab- 12.34' });
    expect(created.body).not.toHaveProperty('normalizedIdentificationValue');
    expect(missingIdentity.status).toBe(400);

    const stored = await fixturePrisma!.runWithTenant(tenantA.id, () =>
      fixturePrisma!.db.customer.findUnique({
        where: { id_tenantId: { id: created.body.id, tenantId: tenantA.id } },
        select: { normalizedIdentificationValue: true },
      }),
    );
    expect(stored?.normalizedIdentificationValue).toBe('AB1234');
  });

  it('creates canonical multiple emails and phones and rejects duplicate primaries', async () => {
    const session = await loginTenant(tenantAdminA, tenantA);
    const created = await createOrganization(session.body.accessToken, tenantA, {
      emails: [
        { label: 'General', email: `general-${suffix}@test.local`, isPrimary: true },
        { label: 'Facturación', email: `billing-${suffix}@test.local`, isBilling: true },
      ],
      phones: [
        { label: 'Oficina', phone: '+1 555 0100', isPrimary: true },
        { label: 'Móvil', phone: '+1 555 0101' },
      ],
    });
    const duplicateEmailPrimary = await createOrganization(session.body.accessToken, tenantA, {
      emails: [{ email: `one-${suffix}@test.local`, isPrimary: true }, { email: `two-${suffix}@test.local`, isPrimary: true }],
    });
    const duplicatePhonePrimary = await createOrganization(session.body.accessToken, tenantA, {
      phones: [{ phone: '+1 555 0102', isPrimary: true }, { phone: '+1 555 0103', isPrimary: true }],
    });

    expect(created.status).toBe(201);
    expect(created.body.emails).toEqual(expect.arrayContaining([
      expect.objectContaining({ email: `general-${suffix}@test.local`, isPrimary: true, isBilling: false }),
      expect.objectContaining({ email: `billing-${suffix}@test.local`, isBilling: true }),
    ]));
    expect(created.body.phones).toEqual(expect.arrayContaining([
      expect.objectContaining({ phone: '+1 555 0100', isPrimary: true }),
      expect.objectContaining({ phone: '+1 555 0101' }),
    ]));
    expect(duplicateEmailPrimary.status).toBe(409);
    expect(duplicateEmailPrimary.body.message).toBe('PRIMARY_EMAIL_CONFLICT');
    expect(duplicatePhonePrimary.status).toBe(409);
    expect(duplicatePhonePrimary.body.message).toBe('PRIMARY_PHONE_CONFLICT');
  });

  it('stores multiple purposes on one physical address without duplication', async () => {
    const session = await loginTenant(tenantAdminA, tenantA);
    const purposes: AddressPurpose[] = [
      { purpose: CustomerAddressPurpose.BUSINESS, isPrimaryForPurpose: true },
      { purpose: CustomerAddressPurpose.BILLING, isPrimaryForPurpose: true },
      { purpose: CustomerAddressPurpose.SHIPPING, isPrimaryForPurpose: true },
    ];
    const created = await createOrganization(session.body.accessToken, tenantA, {
      addresses: [{ addressLine1: 'One physical address', purposes }],
    });

    expect(created.status).toBe(201);
    expect(created.body.addresses).toHaveLength(1);
    expect(created.body.addresses[0]).toMatchObject({
      addressLine1: 'One physical address',
      purposes: expect.arrayContaining(purposes),
    });
    expect(created.body.addresses[0]).not.toHaveProperty('type');
    expect(created.body.addresses[0]).not.toHaveProperty('isPrimary');
  });

  it('rejects two primary addresses for the same purpose', async () => {
    const session = await loginTenant(tenantAdminA, tenantA);
    const response = await createOrganization(session.body.accessToken, tenantA, {
      addresses: [
        { addressLine1: 'First', purposes: [{ purpose: CustomerAddressPurpose.BILLING, isPrimaryForPurpose: true }] },
        { addressLine1: 'Second', purposes: [{ purpose: CustomerAddressPurpose.BILLING, isPrimaryForPurpose: true }] },
      ],
    });

    expect(response.status).toBe(409);
    expect(response.body.message).toBe('PRIMARY_ADDRESS_CONFLICT');
  });

  it('replaces supplied collections atomically and preserves omitted collections', async () => {
    const session = await loginTenant(tenantAdminA, tenantA);
    const created = await createOrganization(session.body.accessToken, tenantA, {
      emails: [{ email: `old-${suffix}@test.local`, isPrimary: true }],
      phones: [{ phone: '+1 555 0110', isPrimary: true }],
      addresses: [{ addressLine1: 'Original', purposes: [{ purpose: CustomerAddressPurpose.BUSINESS, isPrimaryForPurpose: true }] }],
    });
    const contactsUpdated = await customerRequest(session.body.accessToken, tenantA)
      .patch(`/customers/${created.body.id}`)
      .send({
        emails: [{ email: `new-${suffix}@test.local`, isPrimary: true, isBilling: true }],
        phones: [{ phone: '+1 555 0111', isPrimary: true }],
      });
    const nameOnlyUpdate = await customerRequest(session.body.accessToken, tenantA)
      .patch(`/customers/${created.body.id}`)
      .send({ displayName: `Updated ${suffix}` });
    const addressesUpdated = await customerRequest(session.body.accessToken, tenantA)
      .patch(`/customers/${created.body.id}`)
      .send({
        addresses: [{ addressLine1: 'Replacement', purposes: [{ purpose: CustomerAddressPurpose.SHIPPING, isPrimaryForPurpose: true }] }],
      });

    expect(contactsUpdated.status).toBe(200);
    expect(contactsUpdated.body.emails).toEqual([expect.objectContaining({ email: `new-${suffix}@test.local`, isBilling: true })]);
    expect(contactsUpdated.body.phones).toEqual([expect.objectContaining({ phone: '+1 555 0111' })]);
    expect(contactsUpdated.body.addresses).toEqual([expect.objectContaining({ addressLine1: 'Original' })]);
    expect(nameOnlyUpdate.status).toBe(200);
    expect(nameOnlyUpdate.body.emails).toEqual([expect.objectContaining({ email: `new-${suffix}@test.local` })]);
    expect(nameOnlyUpdate.body.phones).toEqual([expect.objectContaining({ phone: '+1 555 0111' })]);
    expect(addressesUpdated.status).toBe(200);
    expect(addressesUpdated.body.addresses).toEqual([expect.objectContaining({ addressLine1: 'Replacement' })]);
  });

  it('lists primary relational contacts and searches them without per-row lookups', async () => {
    const session = await loginTenant(tenantAdminA, tenantA);
    const search = `contacts-${suffix}`;
    await createOrganization(session.body.accessToken, tenantA, {
      displayName: `List ${suffix}`,
      emails: [{ email: `${search}@test.local`, isPrimary: true }],
      phones: [{ phone: '+1 555 0120', isPrimary: true }],
    });

    const listed = await customerRequest(session.body.accessToken, tenantA)
      .get('/customers')
      .query({ search, page: 1, pageSize: 20, isActive: true });

    expect(listed.status).toBe(200);
    expect(listed.body.items).toEqual(expect.arrayContaining([
      expect.objectContaining({ displayName: `List ${suffix}`, email: `${search}@test.local`, phone: '+1 555 0120' }),
    ]));
  });

  it('keeps contacts and addresses tenant-isolated and preserves activation behavior', async () => {
    const sessionA = await loginTenant(tenantAdminA, tenantA);
    const sessionB = await loginTenant(tenantAdminB, tenantB);
    const customerB = await createOrganization(sessionB.body.accessToken, tenantB, {
      emails: [{ email: `tenant-b-${suffix}@test.local`, isPrimary: true }],
      addresses: [{ addressLine1: 'Tenant B', purposes: [{ purpose: CustomerAddressPurpose.BUSINESS, isPrimaryForPurpose: true }] }],
    });
    const read = await customerRequest(sessionA.body.accessToken, tenantA).get(`/customers/${customerB.body.id}`);
    const update = await customerRequest(sessionA.body.accessToken, tenantA)
      .patch(`/customers/${customerB.body.id}`)
      .send({ emails: [{ email: `cross-${suffix}@test.local`, isPrimary: true }] });
    const deactivated = await customerRequest(sessionB.body.accessToken, tenantB).patch(`/customers/${customerB.body.id}/deactivate`);
    const activated = await customerRequest(sessionB.body.accessToken, tenantB).patch(`/customers/${customerB.body.id}/activate`);

    expect(customerB.status).toBe(201);
    expect(read.status).toBe(404);
    expect(update.status).toBe(404);
    expect(deactivated.body.isActive).toBe(false);
    expect(activated.body.isActive).toBe(true);
  });

  async function createTenant(label: string): Promise<TenantFixture> {
    const tenant = await fixturePrisma!.tenant.create({
      data: { name: `Customer HTTP ${label} ${suffix}`, subdomain: `customers-${label}-${suffix}`, isActive: true },
      select: { id: true, subdomain: true },
    });
    if (!tenant.subdomain) throw new Error('Customer test tenant requires a subdomain');
    return { id: tenant.id, subdomain: tenant.subdomain };
  }

  async function createUser(label: string, platformRole: PlatformRole | null = null): Promise<UserFixture> {
    const user = await fixturePrisma!.user.create({
      data: { email: `customers-${label}-${suffix}@test.local`, fullName: `Customer Test ${label}`, passwordHash: await hash(password, 10), isActive: true, platformRole },
      select: { id: true, email: true },
    });
    return { ...user, password };
  }

  async function createMembership(tenantId: string, userId: string): Promise<void> {
    await fixturePrisma!.runWithTenant(tenantId, async () => {
      await fixturePrisma!.db.tenantMembership.create({ data: { tenantId, userId, role: UserRole.ADMIN, isActive: true } });
    });
  }

  async function cleanupTenant(tenant: TenantFixture | undefined): Promise<void> {
    if (!tenant) return;
    await fixturePrisma!.runWithTenant(tenant.id, async () => {
      await fixturePrisma!.db.customer.deleteMany({ where: { tenantId: tenant.id } });
      await fixturePrisma!.db.tenantMembership.deleteMany({ where: { tenantId: tenant.id } });
    });
    await fixturePrisma!.tenant.delete({ where: { id: tenant.id } });
  }

  function httpServer() {
    if (!app) throw new Error('HTTP test application is not initialized');
    return app.getHttpServer();
  }

  function tenantHost(tenant: TenantFixture): string {
    return `${tenant.subdomain}.test.local`;
  }

  function customerRequest(accessToken: string, tenant: TenantFixture) {
    const withSession = (method: 'get' | 'post' | 'patch', path: string) =>
      request(httpServer())[method](path).set('Host', tenantHost(tenant)).set('Authorization', `Bearer ${accessToken}`);
    return { get: (path: string) => withSession('get', path), post: (path: string) => withSession('post', path), patch: (path: string) => withSession('patch', path) };
  }

  function loginTenant(user: UserFixture, tenant: TenantFixture) {
    return request(httpServer()).post('/auth/login').set('Host', tenantHost(tenant)).send({ email: user.email, password: user.password });
  }

  function loginSuperAdmin() {
    return request(httpServer()).post('/auth/super-admin/login').set('Host', 'platform.test.local').send({ email: superAdmin.email, password: superAdmin.password });
  }

  function createOrganization(accessToken: string, tenant: TenantFixture, overrides: Record<string, unknown> = {}) {
    const identity = randomUUID();
    return customerRequest(accessToken, tenant).post('/customers').send({
      type: CustomerType.ORGANIZATION,
      displayName: `Organization ${identity}`,
      legalName: `Organization Legal ${identity}`,
      identificationType: 'TAX_ID',
      identificationValue: identity,
      ...overrides,
    });
  }
});
