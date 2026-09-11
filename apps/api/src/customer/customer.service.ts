import {
  BadRequestException,
  ConflictException,
  HttpException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  CustomerAddressPurpose,
  CustomerAddressType,
  CustomerType,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  normalizeIdentificationType,
  normalizeIdentificationValue,
  trimToNull,
} from './customer-identification';
import type { CustomerAddressDto } from './dto/customer-address.dto';
import type { CustomerEmailDto } from './dto/customer-email.dto';
import type { CustomerPhoneDto } from './dto/customer-phone.dto';
import type { CreateCustomerDto } from './dto/create-customer.dto';
import type { ListCustomersQueryDto } from './dto/list-customers-query.dto';
import type { UpdateCustomerDto } from './dto/update-customer.dto';

const customerDetailInclude = {
  emails: {
    orderBy: [{ isPrimary: 'desc' }, { id: 'asc' }],
  },
  phones: {
    orderBy: [{ isPrimary: 'desc' }, { id: 'asc' }],
  },
  addresses: {
    orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    include: {
      purposeAssignments: {
        orderBy: [{ purpose: 'asc' }],
      },
    },
  },
} satisfies Prisma.CustomerInclude;

type CustomerWithRelations = Prisma.CustomerGetPayload<{
  include: typeof customerDetailInclude;
}>;

type Identity = {
  identificationType: string;
  identificationValue: string;
  normalizedIdentificationValue: string;
};

type NormalizedEmail = {
  label: string | null;
  email: string;
  isPrimary: boolean;
  isBilling: boolean;
};

type NormalizedPhone = {
  label: string | null;
  phone: string;
  isPrimary: boolean;
};

type NormalizedAddress = {
  type: CustomerAddressType;
  isPrimary: boolean;
  countryCode: string | null;
  region: string | null;
  city: string | null;
  district: string | null;
  postalCode: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  purposes: Array<{
    purpose: CustomerAddressPurpose;
    isPrimaryForPurpose: boolean;
  }>;
};

const legacyPurposePrecedence: CustomerAddressPurpose[] = [
  CustomerAddressPurpose.BUSINESS,
  CustomerAddressPurpose.BILLING,
  CustomerAddressPurpose.SHIPPING,
  CustomerAddressPurpose.OTHER,
];

@Injectable()
export class CustomerService {
  constructor(private readonly prisma: PrismaService) {}

  async create(tenantId: string, dto: CreateCustomerDto) {
    const core = this.buildCreateData(tenantId, dto);
    const emails = this.normalizeEmails(dto.emails ?? []);
    const phones = this.normalizePhones(dto.phones ?? []);
    const addresses = this.normalizeAddresses(dto.addresses ?? []);

    return this.withDatabaseErrorMapping(async () => {
      const customer = await this.prisma.db.customer.create({ data: core });
      await this.replaceEmails(tenantId, customer.id, emails);
      await this.replacePhones(tenantId, customer.id, phones);
      await this.replaceAddresses(tenantId, customer.id, addresses);
      return this.toDetail(await this.findCustomerOrThrow(tenantId, customer.id, false));
    });
  }

  async list(tenantId: string, query: ListCustomersQueryDto) {
    await this.backfillLegacyContacts(tenantId);

    const page = query.page ?? 1;
    const pageSize = Math.min(query.pageSize ?? 20, 100);
    const search = trimToNull(query.search);
    const where: Prisma.CustomerWhereInput = {
      tenantId,
      ...(query.isActive === undefined ? {} : { isActive: query.isActive }),
      ...(search
        ? {
            OR: [
              { displayName: { contains: search, mode: 'insensitive' } },
              { legalName: { contains: search, mode: 'insensitive' } },
              { identificationValue: { contains: search, mode: 'insensitive' } },
              { emails: { some: { email: { contains: search, mode: 'insensitive' } } } },
              { phones: { some: { phone: { contains: search, mode: 'insensitive' } } } },
            ],
          }
        : {}),
    };

    const items = await this.prisma.db.customer.findMany({
      where,
      orderBy: [{ displayName: 'asc' }, { id: 'asc' }],
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        type: true,
        displayName: true,
        identificationType: true,
        identificationValue: true,
        isActive: true,
        emails: {
          orderBy: [{ isPrimary: 'desc' }, { id: 'asc' }],
          take: 1,
          select: { email: true },
        },
        phones: {
          orderBy: [{ isPrimary: 'desc' }, { id: 'asc' }],
          take: 1,
          select: { phone: true },
        },
      },
    });
    const total = await this.prisma.db.customer.count({ where });

    return {
      items: items.map(({ emails, phones, ...customer }) => ({
        ...customer,
        email: emails[0]?.email ?? null,
        phone: phones[0]?.phone ?? null,
      })),
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  async findOne(tenantId: string, id: string) {
    const customer = await this.findCustomerOrThrow(tenantId, id);
    return this.toDetail(customer);
  }

  async update(tenantId: string, id: string, dto: UpdateCustomerDto) {
    const current = await this.findCustomerOrThrow(tenantId, id);
    const data = this.buildUpdateData(current, dto);

    return this.withDatabaseErrorMapping(async () => {
      await this.prisma.db.customer.update({
        where: { id_tenantId: { id, tenantId } },
        data,
      });

      if (dto.emails !== undefined) {
        await this.replaceEmails(tenantId, id, this.normalizeEmails(dto.emails));
      }
      if (dto.phones !== undefined) {
        await this.replacePhones(tenantId, id, this.normalizePhones(dto.phones));
      }
      if (dto.addresses !== undefined) {
        await this.replaceAddresses(
          tenantId,
          id,
          this.normalizeAddresses(dto.addresses),
        );
      }

      return this.findCustomerOrThrow(tenantId, id, false);
    }).then((customer) => this.toDetail(customer));
  }

  async setActive(tenantId: string, id: string, isActive: boolean) {
    await this.findCustomerOrThrow(tenantId, id);
    const customer = await this.prisma.db.customer.update({
      where: { id_tenantId: { id, tenantId } },
      data: { isActive },
      include: customerDetailInclude,
    });
    return this.toDetail(customer);
  }

  private buildCreateData(tenantId: string, dto: CreateCustomerDto) {
    const names = this.normalizedNames(dto);
    this.assertRequiredNames(dto.type, names);

    return {
      tenantId,
      type: dto.type,
      displayName: this.requiredText(dto.displayName, 'INVALID_DISPLAY_NAME'),
      ...names,
      ...this.buildIdentity(dto.identificationType, dto.identificationValue),
      countryCode: this.normalizeCountryCode(dto.countryCode),
    } satisfies Prisma.CustomerUncheckedCreateInput;
  }

  private buildUpdateData(
    current: CustomerWithRelations,
    dto: UpdateCustomerDto,
  ): Prisma.CustomerUpdateInput {
    const type = dto.type ?? current.type;
    const names = this.normalizedNames(dto, current);
    this.assertRequiredNames(type, names);

    return {
      type,
      displayName: this.has(dto, 'displayName')
        ? this.requiredText(dto.displayName, 'INVALID_DISPLAY_NAME')
        : current.displayName,
      ...names,
      ...this.updateIdentity(current, dto),
      countryCode: this.has(dto, 'countryCode')
        ? this.normalizeCountryCode(dto.countryCode)
        : current.countryCode,
    };
  }

  private normalizedNames(
    dto: CreateCustomerDto | UpdateCustomerDto,
    current?: CustomerWithRelations,
  ) {
    return {
      firstName: this.valueOrCurrent(dto, 'firstName', current?.firstName),
      middleName: this.valueOrCurrent(dto, 'middleName', current?.middleName),
      lastName: this.valueOrCurrent(dto, 'lastName', current?.lastName),
      secondLastName: this.valueOrCurrent(dto, 'secondLastName', current?.secondLastName),
      legalName: this.valueOrCurrent(dto, 'legalName', current?.legalName),
      tradeName: this.valueOrCurrent(dto, 'tradeName', current?.tradeName),
    };
  }

  private valueOrCurrent(
    dto: CreateCustomerDto | UpdateCustomerDto,
    key: 'firstName' | 'middleName' | 'lastName' | 'secondLastName' | 'legalName' | 'tradeName',
    current?: string | null,
  ): string | null {
    return this.has(dto, key) ? trimToNull(dto[key]) : (current ?? null);
  }

  private assertRequiredNames(
    type: CustomerType,
    names: ReturnType<CustomerService['normalizedNames']>,
  ): void {
    if (
      (type === CustomerType.PERSON && (!names.firstName || !names.lastName)) ||
      (type === CustomerType.ORGANIZATION && !names.legalName)
    ) {
      throw new BadRequestException('INVALID_CUSTOMER_TYPE_FIELDS');
    }
  }

  private buildIdentity(
    identificationType: string | null | undefined,
    identificationValue: string | null | undefined,
  ): Identity {
    const type = trimToNull(identificationType);
    const value = trimToNull(identificationValue);

    if (!type || !value) {
      throw new BadRequestException('IDENTIFICATION_REQUIRED');
    }

    const normalizedIdentificationValue = normalizeIdentificationValue(value);
    if (!normalizedIdentificationValue) {
      throw new BadRequestException('IDENTIFICATION_REQUIRED');
    }

    return {
      identificationType: normalizeIdentificationType(type),
      identificationValue: value,
      normalizedIdentificationValue,
    };
  }

  private updateIdentity(
    current: CustomerWithRelations,
    dto: UpdateCustomerDto,
  ): Identity {
    if (!this.has(dto, 'identificationType') && !this.has(dto, 'identificationValue')) {
      return {
        identificationType: current.identificationType,
        identificationValue: current.identificationValue,
        normalizedIdentificationValue: current.normalizedIdentificationValue,
      };
    }

    return this.buildIdentity(
      this.has(dto, 'identificationType') ? dto.identificationType : current.identificationType,
      this.has(dto, 'identificationValue') ? dto.identificationValue : current.identificationValue,
    );
  }

  private normalizeEmails(emails: CustomerEmailDto[]): NormalizedEmail[] {
    const normalized = emails.map((email) => ({
      label: trimToNull(email.label),
      email: this.requiredText(email.email, 'INVALID_CUSTOMER_EMAIL'),
      isPrimary: email.isPrimary ?? false,
      isBilling: email.isBilling ?? false,
    }));

    if (normalized.filter((email) => email.isPrimary).length > 1) {
      throw new ConflictException('PRIMARY_EMAIL_CONFLICT');
    }

    return normalized;
  }

  private normalizePhones(phones: CustomerPhoneDto[]): NormalizedPhone[] {
    const normalized = phones.map((phone) => ({
      label: trimToNull(phone.label),
      phone: this.requiredText(phone.phone, 'INVALID_CUSTOMER_PHONE'),
      isPrimary: phone.isPrimary ?? false,
    }));

    if (normalized.filter((phone) => phone.isPrimary).length > 1) {
      throw new ConflictException('PRIMARY_PHONE_CONFLICT');
    }

    return normalized;
  }

  private normalizeAddresses(addresses: CustomerAddressDto[]): NormalizedAddress[] {
    const primaryPurposes = new Set<CustomerAddressPurpose>();

    return addresses.map((address) => {
      const purposes = address.purposes.map((assignment) => ({
        purpose: assignment.purpose,
        isPrimaryForPurpose: assignment.isPrimaryForPurpose ?? false,
      }));
      const purposeSet = new Set(purposes.map((assignment) => assignment.purpose));

      if (purposeSet.size !== purposes.length) {
        throw new BadRequestException('DUPLICATE_ADDRESS_PURPOSE');
      }

      for (const assignment of purposes) {
        if (assignment.isPrimaryForPurpose) {
          if (primaryPurposes.has(assignment.purpose)) {
            throw new ConflictException('PRIMARY_ADDRESS_CONFLICT');
          }
          primaryPurposes.add(assignment.purpose);
        }
      }

      const legacyPurpose = legacyPurposePrecedence.find((purpose) => purposeSet.has(purpose));
      if (!legacyPurpose) {
        throw new BadRequestException('ADDRESS_PURPOSE_REQUIRED');
      }

      return {
        type: legacyPurpose,
        isPrimary: purposes.find((purpose) => purpose.purpose === legacyPurpose)?.isPrimaryForPurpose ?? false,
        countryCode: this.normalizeCountryCode(address.countryCode),
        region: trimToNull(address.region),
        city: trimToNull(address.city),
        district: trimToNull(address.district),
        postalCode: trimToNull(address.postalCode),
        addressLine1: trimToNull(address.addressLine1),
        addressLine2: trimToNull(address.addressLine2),
        purposes,
      };
    });
  }

  private async replaceEmails(
    tenantId: string,
    customerId: string,
    emails: NormalizedEmail[],
  ): Promise<void> {
    await this.prisma.db.customerEmail.deleteMany({ where: { tenantId, customerId } });
    if (emails.length > 0) {
      await this.prisma.db.customerEmail.createMany({
        data: emails.map((email) => ({ ...email, tenantId, customerId })),
      });
    }
  }

  private async replacePhones(
    tenantId: string,
    customerId: string,
    phones: NormalizedPhone[],
  ): Promise<void> {
    await this.prisma.db.customerPhone.deleteMany({ where: { tenantId, customerId } });
    if (phones.length > 0) {
      await this.prisma.db.customerPhone.createMany({
        data: phones.map((phone) => ({ ...phone, tenantId, customerId })),
      });
    }
  }

  private async replaceAddresses(
    tenantId: string,
    customerId: string,
    addresses: NormalizedAddress[],
  ): Promise<void> {
    await this.prisma.db.customerAddress.deleteMany({ where: { tenantId, customerId } });

    for (const address of addresses) {
      const created = await this.prisma.db.customerAddress.create({
        data: {
          tenantId,
          customerId,
          type: address.type,
          isPrimary: address.isPrimary,
          countryCode: address.countryCode,
          region: address.region,
          city: address.city,
          district: address.district,
          postalCode: address.postalCode,
          addressLine1: address.addressLine1,
          addressLine2: address.addressLine2,
        },
        select: { id: true },
      });

      await this.prisma.db.customerAddressPurposeAssignment.createMany({
        data: address.purposes.map((purpose) => ({
          tenantId,
          customerId,
          customerAddressId: created.id,
          ...purpose,
        })),
      });
    }
  }

  private async backfillLegacyContacts(tenantId: string, customerId?: string): Promise<void> {
    const customers = await this.prisma.db.customer.findMany({
      where: {
        tenantId,
        ...(customerId ? { id: customerId } : {}),
        OR: [
          { emails: { none: {} }, OR: [{ email: { not: null } }, { billingEmail: { not: null } }] },
          { phones: { none: {} }, phone: { not: null } },
        ],
      },
      select: {
        id: true,
        email: true,
        billingEmail: true,
        phone: true,
        emails: { select: { id: true } },
        phones: { select: { id: true } },
      },
    });

    const emails: Prisma.CustomerEmailCreateManyInput[] = [];
    const phones: Prisma.CustomerPhoneCreateManyInput[] = [];
    for (const customer of customers) {
      if (customer.emails.length === 0) {
        const email = trimToNull(customer.email);
        const billingEmail = trimToNull(customer.billingEmail);
        if (email) {
          emails.push({
            tenantId,
            customerId: customer.id,
            email,
            label: null,
            isPrimary: true,
            isBilling: email === billingEmail,
          });
        }
        if (billingEmail && billingEmail !== email) {
          emails.push({
            tenantId,
            customerId: customer.id,
            email: billingEmail,
            label: null,
            isPrimary: !email,
            isBilling: true,
          });
        }
      }
      if (customer.phones.length === 0) {
        const phone = trimToNull(customer.phone);
        if (phone) {
          phones.push({ tenantId, customerId: customer.id, phone, label: null, isPrimary: true });
        }
      }
    }

    if (emails.length > 0) {
      await this.prisma.db.customerEmail.createMany({ data: emails });
    }
    if (phones.length > 0) {
      await this.prisma.db.customerPhone.createMany({ data: phones });
    }
  }

  private normalizeCountryCode(value: string | null | undefined): string | null {
    const countryCode = trimToNull(value);
    if (!countryCode) return null;
    if (!/^[a-z]{2}$/i.test(countryCode)) {
      throw new BadRequestException('INVALID_COUNTRY_CODE');
    }
    return countryCode.toLocaleUpperCase('en-US');
  }

  private requiredText(value: string | null | undefined, errorCode: string): string {
    const normalized = trimToNull(value);
    if (!normalized) throw new BadRequestException(errorCode);
    return normalized;
  }

  private async findCustomerOrThrow(
    tenantId: string,
    id: string,
    backfill = true,
  ): Promise<CustomerWithRelations> {
    if (backfill) await this.backfillLegacyContacts(tenantId, id);

    const customer = await this.prisma.db.customer.findFirst({
      where: { id, tenantId },
      include: customerDetailInclude,
    });
    if (!customer) throw new NotFoundException('CUSTOMER_NOT_FOUND');
    return customer;
  }

  private toDetail(customer: CustomerWithRelations) {
    return {
      id: customer.id,
      type: customer.type,
      displayName: customer.displayName,
      firstName: customer.firstName,
      middleName: customer.middleName,
      lastName: customer.lastName,
      secondLastName: customer.secondLastName,
      legalName: customer.legalName,
      tradeName: customer.tradeName,
      identificationType: customer.identificationType,
      identificationValue: customer.identificationValue,
      countryCode: customer.countryCode,
      isActive: customer.isActive,
      createdAt: customer.createdAt,
      updatedAt: customer.updatedAt,
      emails: customer.emails.map(({ id, label, email, isPrimary, isBilling }) => ({ id, label, email, isPrimary, isBilling })),
      phones: customer.phones.map(({ id, label, phone, isPrimary }) => ({ id, label, phone, isPrimary })),
      addresses: customer.addresses.map(({ id, countryCode, region, city, district, postalCode, addressLine1, addressLine2, purposeAssignments }) => ({
        id,
        countryCode,
        region,
        city,
        district,
        postalCode,
        addressLine1,
        addressLine2,
        purposes: purposeAssignments.map(({ purpose, isPrimaryForPurpose }) => ({ purpose, isPrimaryForPurpose })),
      })),
    };
  }

  private has(object: object, key: PropertyKey): boolean {
    return (object as Record<PropertyKey, unknown>)[key] !== undefined;
  }

  private async withDatabaseErrorMapping<T>(callback: () => Promise<T>): Promise<T> {
    try {
      return await callback();
    } catch (error) {
      if (error instanceof HttpException) throw error;
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        const modelName = error.meta?.modelName;
        const target = String(error.meta?.target ?? '');
        if (modelName === 'Customer' || target.includes('identification')) {
          throw new ConflictException('DUPLICATE_CUSTOMER_IDENTIFICATION');
        }
        if (modelName === 'CustomerEmail' || target.includes('customer_emails')) {
          throw new ConflictException('PRIMARY_EMAIL_CONFLICT');
        }
        if (modelName === 'CustomerPhone' || target.includes('customer_phones')) {
          throw new ConflictException('PRIMARY_PHONE_CONFLICT');
        }
        if (modelName === 'CustomerAddressPurposeAssignment' || modelName === 'CustomerAddress' || target.includes('purpose')) {
          throw new ConflictException('PRIMARY_ADDRESS_CONFLICT');
        }
      }
      throw error;
    }
  }
}
