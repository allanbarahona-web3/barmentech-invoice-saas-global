import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { PlatformController } from './platform.controller';
import { PlatformSuperAdminGuard } from './guards/platform-super-admin.guard';
import { PlatformService } from './platform.service';

@Module({
  imports: [AuthModule, PrismaModule],
  controllers: [PlatformController],
  providers: [PlatformService, PlatformSuperAdminGuard],
})
export class PlatformModule {}
