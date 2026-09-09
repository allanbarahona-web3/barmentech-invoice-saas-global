import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Request } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import type { ResolvedTenant } from '../tenant/tenant.service';

type AuthenticatedRequest = Request & {
  tenant?: ResolvedTenant;
  user?: {
    id: string;
    email: string;
    fullName: string;
    role: string;
    tenantId: string | null;
  };
};

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  login(
    @Body() dto: LoginDto,
    @Req() request: AuthenticatedRequest,
  ) {
    if (!request.tenant) {
      throw new UnauthorizedException('TENANT_NOT_FOUND');
    }

    return this.authService.login(dto, request.tenant);
  }

  @Post('super-admin/login')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  loginSuperAdmin(
    @Body() dto: LoginDto,
  ) {
    return this.authService.loginSuperAdmin(dto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@Req() request: AuthenticatedRequest) {
    return request.user;
  }
}
