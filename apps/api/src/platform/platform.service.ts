import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { PlatformTenantListItemDto } from './dto/platform-tenant-list-item.dto';

type PlatformTenantListRow = PlatformTenantListItemDto;

@Injectable()
export class PlatformService {
  constructor(private readonly prisma: PrismaService) {}

  async listTenants(): Promise<PlatformTenantListItemDto[]> {
    const rows = await this.prisma.$queryRaw<PlatformTenantListRow[]>`
      SELECT
        "tenantId",
        "tenantName",
        "subdomain",
        "customDomain",
        "isActive",
        "createdAt",
        "updatedAt",
        "countryCode",
        "defaultCurrencyCode",
        "locale",
        "timezone"
      FROM public.platform_list_tenants_v1()
    `;

    return rows.map((row) => ({
      tenantId: row.tenantId,
      tenantName: row.tenantName,
      subdomain: row.subdomain,
      customDomain: row.customDomain,
      isActive: row.isActive,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      countryCode: row.countryCode,
      defaultCurrencyCode: row.defaultCurrencyCode,
      locale: row.locale,
      timezone: row.timezone,
    }));
  }
}
