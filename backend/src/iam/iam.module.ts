import { AuditModule } from "../audit/audit.module.js";
import { AdminAccessPolicyService } from "./providers/admin-access-policy.service.js";
import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { Company } from "../organization/entities/company.entity.js";
import { Department } from "../organization/entities/department.entity.js";

import { IamController } from "./controllers/iam.controller.js";
import { RolesController } from "./controllers/roles.controller.js";
import { UsersController } from "./controllers/users.controller.js";

import { CompanyUser } from "./entities/company-user.entity.js";
import { Permission } from "./entities/permission.entity.js";
import { RolePermission } from "./entities/role-permission.entity.js";
import { Role } from "./entities/role.entity.js";
import { UserRole } from "./entities/user-role.entity.js";
import { User } from "./entities/user.entity.js";

import { IamService } from "./providers/iam.service.js";
import {
  PASSWORD_HASHER,
  passwordHasherProvider,
} from "./providers/password-hasher.provider.js";
import { RolesService } from "./providers/roles.service.js";
import { UsersService } from "./providers/users.service.js";

@Module({
  imports: [
    AuditModule,
    TypeOrmModule.forFeature([
      User,
      CompanyUser,
      Role,
      Permission,
      UserRole,
      RolePermission,
      Company,
      Department,
    ]),
  ],

  controllers: [IamController, UsersController, RolesController],

  providers: [
    IamService,
    AdminAccessPolicyService,
    UsersService,
    RolesService,
    passwordHasherProvider,
  ],

  exports: [
    TypeOrmModule,
    IamService,
    UsersService,
    RolesService,
    PASSWORD_HASHER,
  ],
})
export class IamModule {}
