var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
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
let AppModule = class AppModule {
};
AppModule = __decorate([
    Module({
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
            CatalogModule,
            VendorModule,
            ProcurementModule,
            AuditModule,
        ],
        controllers: [AppController],
        providers: [AppService],
    })
], AppModule);
export { AppModule };
//# sourceMappingURL=app.module.js.map