import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { CustomerService } from './customer.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { ListCustomersQueryDto } from './dto/list-customers-query.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

type TenantAuthenticatedRequest = Request & {
  user: {
    tenantId: string | null;
  };
};

@Controller('customers')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.BILLING_USER, UserRole.ACCOUNTANT)
@UsePipes(
  new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
  }),
)
export class CustomerController {
  constructor(private readonly customerService: CustomerService) {}

  @Post()
  create(
    @Req() request: TenantAuthenticatedRequest,
    @Body() dto: CreateCustomerDto,
  ) {
    return this.customerService.create(this.tenantId(request), dto);
  }

  @Get()
  list(
    @Req() request: TenantAuthenticatedRequest,
    @Query() query: ListCustomersQueryDto,
  ) {
    return this.customerService.list(this.tenantId(request), query);
  }

  @Get(':id')
  findOne(@Req() request: TenantAuthenticatedRequest, @Param('id') id: string) {
    return this.customerService.findOne(this.tenantId(request), id);
  }

  @Patch(':id')
  update(
    @Req() request: TenantAuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: UpdateCustomerDto,
  ) {
    return this.customerService.update(this.tenantId(request), id, dto);
  }

  @Patch(':id/activate')
  activate(@Req() request: TenantAuthenticatedRequest, @Param('id') id: string) {
    return this.customerService.setActive(this.tenantId(request), id, true);
  }

  @Patch(':id/deactivate')
  deactivate(@Req() request: TenantAuthenticatedRequest, @Param('id') id: string) {
    return this.customerService.setActive(this.tenantId(request), id, false);
  }

  private tenantId(request: TenantAuthenticatedRequest): string {
    if (!request.user.tenantId) {
      throw new Error('Tenant customer endpoint requires a tenant session');
    }

    return request.user.tenantId;
  }
}
