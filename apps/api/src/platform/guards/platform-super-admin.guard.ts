import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { PlatformRole } from '@prisma/client';
import type { Request } from 'express';

type PlatformRequest = Request & {
  user?: {
    role?: PlatformRole;
    tenantId?: string | null;
  };
};

@Injectable()
export class PlatformSuperAdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<PlatformRequest>();
    const user = request.user;

    if (
      user?.role !== PlatformRole.SUPER_ADMIN ||
      user.tenantId !== null
    ) {
      throw new ForbiddenException('PLATFORM_SUPER_ADMIN_REQUIRED');
    }

    return true;
  }
}
