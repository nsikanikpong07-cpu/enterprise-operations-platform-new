import { AuthRateLimitModule } from "./auth-rate-limit.module.js";
import { OrganizationAccessGuard } from "./guards/organization-access.guard.js";
import { AuditModule } from "../audit/audit.module.js";
import { AuditContextInterceptor } from "../audit/providers/audit-context.interceptor.js";
import { APP_INTERCEPTOR } from "@nestjs/core";
import { PasswordMailService } from "./providers/password-mail.service.js";
import { PasswordSecurityService } from "./providers/password-security.service.js";
import { APP_GUARD } from "@nestjs/core";
import { IamAccessGuard } from "./guards/iam-access.guard.js";
import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { JwtModule } from "@nestjs/jwt";

import { IamModule } from "../iam/iam.module.js";
import { AuthController } from "./controllers/auth.controller.js";
import { JwtAuthGuard } from "./guards/jwt-auth.guard.js";
import { AuthService } from "./providers/auth.service.js";
import { CompanyAccessGuard } from "./guards/company-access.guard.js";
import { PermissionsGuard } from "./guards/permissions.guard.js";
@Module({
  imports: [
    IamModule,
    AuthRateLimitModule,
    AuditModule,
    ConfigModule,

    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],

      useFactory: (config: ConfigService) => {
        const secret = config.get<string>("JWT_SECRET");

        if (!secret || secret.length < 64) {
          throw new Error("JWT_SECRET must contain at least 64 characters");
        }

        return {
          secret,

          signOptions: {
            algorithm: "HS256",
            expiresIn: 3600,
            issuer: "enterprise-operations",
            audience: "enterprise-operations-api",
          },

          verifyOptions: {
            algorithms: ["HS256"],
            issuer: "enterprise-operations",
            audience: "enterprise-operations-api",
          },
        };
      },
    }),
  ],

  controllers: [AuthController],

  providers: [
    AuthService,
    { provide: APP_INTERCEPTOR, useClass: AuditContextInterceptor },
    PasswordMailService,
    PasswordSecurityService,
    JwtAuthGuard,
    CompanyAccessGuard,
    PermissionsGuard,
    { provide: APP_GUARD, useClass: IamAccessGuard },
    { provide: APP_GUARD, useClass: OrganizationAccessGuard },
  ],

  exports: [
    AuthService,
    JwtModule,
    JwtAuthGuard,
    CompanyAccessGuard,
    PermissionsGuard,
  ],
})
export class AuthModule {}
