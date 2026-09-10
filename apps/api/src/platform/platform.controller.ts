import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { PlatformTenantListItemDto } from './dto/platform-tenant-list-item.dto';
import { PlatformSuperAdminGuard } from './guards/platform-super-admin.guard';
import { PlatformService } from './platform.service';

@Controller('v1/platform')
export class PlatformController {
  constructor(private readonly platformService: PlatformService) {}

  @Get('tenants')
  @UseGuards(JwtAuthGuard, PlatformSuperAdminGuard)
  listTenants(): Promise<PlatformTenantListItemDto[]> {
    return this.platformService.listTenants();
  }
}
