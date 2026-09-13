import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

import { PrismaModule } from './prisma/prisma.module';
import { AuditModule } from './common/services/audit.module';
import { AuthModule } from './modules/auth/auth.module';
import { TenantsModule } from './modules/tenants/tenants.module';
import { UsersModule } from './modules/users/users.module';
import { CustomersModule } from './modules/customers/customers.module';
import { VehiclesModule } from './modules/vehicles/vehicles.module';
import { ServiceOrdersModule } from './modules/service-orders/service-orders.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { AccountingModule } from './modules/accounting/accounting.module';
import { AppointmentsModule } from './modules/appointments/appointments.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { SettingsModule } from './modules/settings/settings.module';
import { ReportingModule } from './modules/reporting/reporting.module';
import { AuditModule_ } from './modules/audit/audit.module';
import { SyncModule } from './modules/sync/sync.module';
import { VehicleMaintenanceModule } from './modules/vehicle-maintenance/vehicle-maintenance.module';
import { PublicModule } from './modules/public/public.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [
        '../../.env',
        '.env',
      ],
    }),
    ThrottlerModule.forRoot([
      {
        ttl: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
        limit: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
      },
    ]),
    PrismaModule,
    AuditModule,
    AuthModule,
    TenantsModule,
    UsersModule,
    CustomersModule,
    VehiclesModule,
    ServiceOrdersModule,
    InventoryModule,
    AccountingModule,
    AppointmentsModule,
    NotificationsModule,
    SettingsModule,
    ReportingModule,
    AuditModule_,
    SyncModule,
    VehicleMaintenanceModule,
    PublicModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
