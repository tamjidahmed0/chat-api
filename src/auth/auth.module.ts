import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { SessionGuard } from './auth.guard';


@Module({
  providers: [AuthService, SessionGuard],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
