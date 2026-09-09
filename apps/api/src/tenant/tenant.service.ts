import {
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface ResolvedTenant {
  id: string;
  name: string;
  subdomain: string | null;
  customDomain: string | null;
  isActive: boolean;
  settings: {
    legalName: string | null;
    legalId: string | null;
    countryCode: string | null;
    defaultCurrencyCode: string | null;
    timezone: string | null;
    locale: string | null;
  } | null;
}

type TenantIdentity = Omit<ResolvedTenant, 'settings'>;

@Injectable()
export class TenantService {
  private readonly logger = new Logger(TenantService.name);

  constructor(private readonly prisma: PrismaService) {}

  async resolveTenant(host: string): Promise<ResolvedTenant> {
    const cleanHost = this.normalizeHost(host);

    let tenant = await this.prisma.tenant.findUnique({
      where: { customDomain: cleanHost },
      select: this.tenantIdentitySelect,
    });

    if (tenant) {
      return this.loadResolvedTenant(tenant);
    }

    const subdomain = this.extractSubdomain(cleanHost);

    if (subdomain) {
      tenant = await this.prisma.tenant.findUnique({
        where: { subdomain },
        select: this.tenantIdentitySelect,
      });

      if (tenant) {
        return this.loadResolvedTenant(tenant);
      }
    }

    if (this.isLocalHost(cleanHost)) {
      const preferredSubdomain = String(
        process.env.DEV_DEFAULT_TENANT_SUBDOMAIN ?? '',
      )
        .trim()
        .toLowerCase();

      if (preferredSubdomain) {
        tenant = await this.prisma.tenant.findUnique({
          where: { subdomain: preferredSubdomain },
          select: this.tenantIdentitySelect,
        });

        if (tenant) {
          return this.loadResolvedTenant(tenant);
        }
      }

      tenant = await this.prisma.tenant.findFirst({
        where: { isActive: true },
        orderBy: { createdAt: 'asc' },
        select: this.tenantIdentitySelect,
      });

      if (tenant) {
        this.logger.debug(`Local tenant fallback: ${tenant.name}`);
        return this.loadResolvedTenant(tenant);
      }
    }

    throw new NotFoundException('TENANT_NOT_FOUND');
  }

  async getTenantById(tenantId: string): Promise<ResolvedTenant | null> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: this.tenantIdentitySelect,
    });

    return tenant ? this.loadResolvedTenant(tenant) : null;
  }

  async requireActiveTenant(tenantId: string): Promise<ResolvedTenant> {
    const tenant = await this.getTenantById(tenantId);

    if (!tenant) {
      throw new NotFoundException('TENANT_NOT_FOUND');
    }

    if (!tenant.isActive) {
      throw new NotFoundException('TENANT_INACTIVE');
    }

    return tenant;
  }

  private normalizeHost(host: string): string {
    const value = String(host ?? '')
      .trim()
      .toLowerCase()
      .split(',')[0]
      .trim();

    return value.replace(/:\d+$/, '');
  }

  private extractSubdomain(host: string): string | null {
    if (this.isLocalHost(host)) {
      return null;
    }

    const parts = host.split('.');

    if (parts.length < 3) {
      return null;
    }

    return parts[0] || null;
  }

  private isLocalHost(host: string): boolean {
    return host === 'localhost' || host === '127.0.0.1';
  }

  private async loadResolvedTenant(
    tenant: TenantIdentity,
  ): Promise<ResolvedTenant> {
    const settings = await this.prisma.runWithTenant(
      tenant.id,
      async () =>
        this.prisma.db.tenantSettings.findUnique({
          where: { tenantId: tenant.id },
          select: this.tenantSettingsSelect,
        }),
    );

    return {
      ...tenant,
      settings,
    };
  }

  private readonly tenantIdentitySelect = {
    id: true,
    name: true,
    subdomain: true,
    customDomain: true,
    isActive: true,
  } as const;

  private readonly tenantSettingsSelect = {
    legalName: true,
    legalId: true,
    countryCode: true,
    defaultCurrencyCode: true,
    timezone: true,
    locale: true,
  } as const;
}
