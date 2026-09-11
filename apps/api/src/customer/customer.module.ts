import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { CustomerController } from './customer.controller';
import { CustomerService } from './customer.service';

@Module({
  imports: [AuthModule, PrismaModule],
  controllers: [CustomerController],
  providers: [CustomerService],
})
export class CustomerModule {}
