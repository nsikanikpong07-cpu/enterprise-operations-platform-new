import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditModule } from './audit/audit.module.js';
import { CatalogModule } from './catalog/catalog.module.js';
import { appConfig } from './config/app.config.js';
import { dataSourceOptions } from './database/data-source.js';
import { IamModule } from './iam/iam.module.js';
import { OrganizationModule } from './organization/organization.module.js';
import { ProcurementModule } from './procurement/procurement.module.js';
import { VendorModule } from './vendor/vendor.module.js';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { AuthModule } from './auth/auth.module.js';
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig],
      envFilePath: ['.env', '../.env'],
      cache: true,
      
    }),
    TypeOrmModule.forRoot(dataSourceOptions),
    OrganizationModule,
    IamModule,
    AuthModule,
    CatalogModule,
    VendorModule,
    ProcurementModule,
    AuditModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
