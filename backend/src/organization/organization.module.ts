import { IamModule } from "../iam/iam.module.js";
import { AuditModule } from "../audit/audit.module.js";
import { AuthRateLimitModule } from "../auth/auth-rate-limit.module.js";
import { RegistrationController } from "./controllers/registration.controller.js";
import { RegistrationService } from "./providers/registration.service.js";
import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { OrganizationController } from "./controllers/organization.controller.js";
import { Company } from "./entities/company.entity.js";
import { Department } from "./entities/department.entity.js";
import { Location } from "./entities/location.entity.js";
import { OrganizationService } from "./providers/organization.service.js";

@Module({
  imports: [
    IamModule,
    AuditModule,
    AuthRateLimitModule,
    TypeOrmModule.forFeature([Company, Department, Location]),
  ],
  controllers: [OrganizationController, RegistrationController],
  providers: [OrganizationService, RegistrationService],
  exports: [TypeOrmModule, OrganizationService],
})
export class OrganizationModule {}
