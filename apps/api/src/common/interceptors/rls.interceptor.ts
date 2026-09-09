import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, from } from 'rxjs';
import { lastValueFrom } from 'rxjs';
import { PrismaService } from '../../prisma/prisma.service';

type AuthenticatedRequest = {
  user?: {
    tenantId?: string | null;
  };
};

@Injectable()
export class RLSInterceptor implements NestInterceptor {
  constructor(private readonly prisma: PrismaService) {}

  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<unknown> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const tenantId = request.user?.tenantId;

    if (!tenantId) {
      return next.handle();
    }

    return from(
      this.prisma.runWithTenant(
        tenantId,
        async () => lastValueFrom(next.handle()),
      ),
    );
  }
}
