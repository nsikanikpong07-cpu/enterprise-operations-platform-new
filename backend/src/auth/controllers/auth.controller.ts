import { ApiBearerAuth, ApiBody } from "@nestjs/swagger";
import type { Request } from "express";
import {
  ChangePasswordDto,
  ForgotPasswordDto,
  ResetPasswordDto,
} from "../dto/password.dto.js";
import { PasswordSecurityService } from "../providers/password-security.service.js";
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
  Post,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";

import { RequirePermissions } from "../decorators/require-permissions.decorator.js";
import { LoginDto } from "../dto/login.dto.js";
import { CompanyAccessGuard } from "../guards/company-access.guard.js";
import {
  JwtAuthGuard,
  type AuthenticatedRequest,
} from "../guards/jwt-auth.guard.js";
import { PermissionsGuard } from "../guards/permissions.guard.js";
import { AuthService } from "../providers/auth.service.js";

@Controller("auth")
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly passwords: PasswordSecurityService,
  ) {}

  // Login is public so users can obtain their access token.
  @Post("login")
  @HttpCode(HttpStatus.OK)
  @ApiBody({ type: LoginDto })
  login(@Body() dto: LoginDto, @Req() request: Request) {
    return this.auth.login(
      dto,
      request.ip ?? request.socket.remoteAddress ?? "unknown",
    );
  }

  // Returns the user identified by the validated token.
  @Get("me")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  me(@Req() request: AuthenticatedRequest) {
    return request.user;
  }

  // Checks authentication and active company membership.
  @Get("company-access")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, CompanyAccessGuard)
  companyAccess(
    @Query("companyId", ParseUUIDPipe) companyId: string,
    @Req() request: AuthenticatedRequest,
  ) {
    return {
      message: "Company access granted",
      companyId,
      userId: request.user.id,
    };
  }

  // Checks run in this order:
  // 1. Validate the token.
  // 2. Verify company membership.
  // 3. Verify create_requisition permission.
  //
  // This endpoint checks access; it does not create a requisition.
  @Get("requisition-access")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, CompanyAccessGuard, PermissionsGuard)
  @RequirePermissions("create_requisition")
  requisitionAccess(
    @Query("companyId", ParseUUIDPipe) companyId: string,
    @Req() request: AuthenticatedRequest,
  ) {
    return {
      message: "Requisition creation permission granted",
      companyId,
      userId: request.user.id,
    };
  }

  // Public recovery endpoints are rate-limited independently of login.
  @Post("forgot-password")
  @HttpCode(HttpStatus.OK)
  @ApiBody({ type: ForgotPasswordDto })
  forgotPassword(@Body() dto: ForgotPasswordDto, @Req() request: Request) {
    return this.passwords.forgot(
      dto.email,
      request.ip ?? request.socket.remoteAddress ?? "unknown",
    );
  }

  @Post("reset-password")
  @HttpCode(HttpStatus.OK)
  @ApiBody({ type: ResetPasswordDto })
  resetPassword(@Body() dto: ResetPasswordDto, @Req() request: Request) {
    return this.passwords.reset(
      dto.token,
      dto.newPassword,
      request.ip ?? request.socket.remoteAddress ?? "unknown",
    );
  }

  @Post("change-password")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBody({ type: ChangePasswordDto })
  changePassword(
    @Body() dto: ChangePasswordDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.passwords.change(
      request.user.id,
      request.tokenVersion,
      dto.currentPassword,
      dto.newPassword,
      request.ip ?? request.socket.remoteAddress ?? "unknown",
    );
  }

  // Logout revokes ALL tokens for this user, not just this browser's token.
  @Post("logout")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  logout(@Req() request: AuthenticatedRequest) {
    return this.passwords.logout(request.user.id, request.tokenVersion);
  }
}
