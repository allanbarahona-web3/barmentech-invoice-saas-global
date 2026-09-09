import {
  Injectable,
  NestMiddleware,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import { TenantService, type ResolvedTenant } from './tenant.service';

declare global {
  namespace Express {
    interface Request {
      tenant?: ResolvedTenant;
    }
  }
}

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(private readonly tenantService: TenantService) {}

  async use(req: Request, _res: Response, next: NextFunction): Promise<void> {
    const forwardedHost = req.get('x-forwarded-host');
    const host = forwardedHost || req.get('host') || '';

    try {
      const tenant = await this.tenantService.resolveTenant(host);

      if (!tenant.isActive) {
        throw new UnauthorizedException('TENANT_INACTIVE');
      }

      req.tenant = tenant;
      next();
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      if (error instanceof NotFoundException) {
        throw new UnauthorizedException('TENANT_NOT_FOUND');
      }

      throw error;
    }
  }
}
