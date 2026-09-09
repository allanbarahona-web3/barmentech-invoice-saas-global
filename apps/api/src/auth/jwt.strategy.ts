import {
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { PlatformRole, UserRole } from '@prisma/client';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../prisma/prisma.service';

type JwtPayload = {
  sub: string;
  email: string;
  role: UserRole | PlatformRole;
  tenantId: string | null;
  jti?: string;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        fullName: true,
        isActive: true,
        activeJti: true,
        platformRole: true,
      },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('SESSION_INVALID');
    }

    if (
      !payload.jti ||
      !user.activeJti ||
      payload.jti !== user.activeJti
    ) {
      throw new UnauthorizedException('SESSION_INVALID');
    }

    if (payload.role === PlatformRole.SUPER_ADMIN) {
      if (
        payload.tenantId !== null ||
        user.platformRole !== PlatformRole.SUPER_ADMIN
      ) {
        throw new UnauthorizedException('SESSION_INVALID');
      }

      return {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        isActive: user.isActive,
        role: PlatformRole.SUPER_ADMIN,
        tenantId: null,
      };
    }

    if (!payload.tenantId) {
      throw new UnauthorizedException('SESSION_INVALID');
    }

    const tenantId = payload.tenantId;

    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        id: true,
        isActive: true,
      },
    });

    if (!tenant || !tenant.isActive) {
      throw new UnauthorizedException('SESSION_INVALID');
    }

    const membership = await this.prisma.runWithTenant(
      tenantId,
      async () =>
        this.prisma.db.tenantMembership.findUnique({
          where: {
            tenantId_userId: {
              tenantId,
              userId: user.id,
            },
          },
          select: {
            role: true,
            isActive: true,
          },
        }),
    );

    if (
      !membership ||
      !membership.isActive ||
      membership.role !== payload.role
    ) {
      throw new UnauthorizedException('SESSION_INVALID');
    }

    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      isActive: user.isActive,
      role: membership.role,
      tenantId,
    };
  }
}
