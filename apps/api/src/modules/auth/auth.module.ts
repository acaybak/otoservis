import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TrialLicenseGuard } from '../../common/guards/trial-license.guard';

@Module({
  imports: [ConfigModule],
  controllers: [AuthController],
  providers: [
    AuthService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    // JwtAuthGuard kullanıcıyı çözdükten SONRA çalışması için aynı modülde,
    // onun altında kayıtlıdır: deneme süresi dolmuş lisanssız firmaların
    // yazma işlemlerini (yeni kayıt, bulut eşitleme) kilitler.
    {
      provide: APP_GUARD,
      useClass: TrialLicenseGuard,
    },
  ],
  exports: [AuthService],
})
export class AuthModule {}
