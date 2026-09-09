import {
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PlatformRole, UserRole } from '@prisma/client';
import { compare } from 'bcryptjs';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service';
import type { ResolvedTenant } from '../tenant/tenant.service';
import type { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async login(dto: LoginDto, tenant: ResolvedTenant) {
    const email = dto.email.trim().toLowerCase();

    const user = await this.prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        fullName: true,
        passwordHash: true,
        isActive: true,
        mustChangePassword: true,
      },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('INVALID_CREDENTIALS');
    }

    const validPassword = await compare(dto.password, user.passwordHash);

    if (!validPassword) {
      throw new UnauthorizedException('INVALID_CREDENTIALS');
    }

    const membership = await this.prisma.runWithTenant(
      tenant.id,
      async () =>
        this.prisma.db.tenantMembership.findUnique({
          where: {
            tenantId_userId: {
              tenantId: tenant.id,
              userId: user.id,
            },
          },
          select: {
            role: true,
            isActive: true,
          },
        }),
    );

    if (!membership || !membership.isActive) {
      throw new UnauthorizedException('INVALID_CREDENTIALS');
    }

    const jti = randomUUID();

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        activeJti: jti,
        activeAt: new Date(),
      },
    });

    const accessToken = await this.jwtService.signAsync(
      {
        sub: user.id,
        email: user.email,
        role: membership.role,
        tenantId: tenant.id,
      },
      {
        jwtid: jti,
      },
    );

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: membership.role,
        tenantId: tenant.id,
        tenantName: tenant.name,
        mustChangePassword: user.mustChangePassword,
      },
    };
  }

  async loginSuperAdmin(dto: LoginDto) {
    const email = dto.email.trim().toLowerCase();

    const user = await this.prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        fullName: true,
        passwordHash: true,
        isActive: true,
        mustChangePassword: true,
        platformRole: true,
      },
    });

    if (
      !user ||
      !user.isActive ||
      user.platformRole !== PlatformRole.SUPER_ADMIN
    ) {
      throw new UnauthorizedException('INVALID_CREDENTIALS');
    }

    const validPassword = await compare(dto.password, user.passwordHash);

    if (!validPassword) {
      throw new UnauthorizedException('INVALID_CREDENTIALS');
    }

    const jti = randomUUID();

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        activeJti: jti,
        activeAt: new Date(),
      },
    });

    const accessToken = await this.jwtService.signAsync(
      {
        sub: user.id,
        email: user.email,
        role: PlatformRole.SUPER_ADMIN,
        tenantId: null,
      },
      {
        jwtid: jti,
      },
    );

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: PlatformRole.SUPER_ADMIN,
        tenantId: null,
        tenantName: null,
        mustChangePassword: user.mustChangePassword,
      },
    };
  }

}
