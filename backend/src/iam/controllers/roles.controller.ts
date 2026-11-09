import { ApiBearerAuth, ApiBody, ApiForbiddenResponse } from "@nestjs/swagger";
import { ForbiddenException } from "@nestjs/common";
import { IamScope } from "../../auth/decorators/iam-scope.decorator.js";
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from "@nestjs/common";

import {
  AddCompanyUserDto,
  AssignRoleDto,
  CreateRoleDto,
  GrantPermissionDto,
  UpdateCompanyUserDto,
  UpdateRoleDto,
} from "../dto/role.dto.js";
import { RolesService } from "../providers/roles.service.js";

@IamScope({ kind: "company", location: "query", key: "companyId" })
@ApiBearerAuth()
@Controller("iam")
export class RolesController {
  constructor(private readonly roles: RolesService) {}

  // Roles

  // Example: GET /iam/roles?companyId=<company UUID>
  @Get("roles")
  findAll(@Query("companyId", ParseUUIDPipe) companyId: string) {
    return this.roles.findAll(companyId);
  }

  @IamScope({ kind: "role", location: "params", key: "id" })
  @Get("roles/:id")
  findOne(@Param("id", ParseUUIDPipe) id: string) {
    return this.roles.findOne(id);
  }

  // The request body now includes companyId.
  @IamScope({ kind: "company", location: "body", key: "companyId" })
  @Post("roles")
  @ApiBody({ type: CreateRoleDto })
  create(@Body() dto: CreateRoleDto) {
    return this.roles.create(dto);
  }

  @IamScope({ kind: "role", location: "params", key: "id" })
  @Patch("roles/:id")
  @ApiBody({ type: UpdateRoleDto })
  update(@Param("id", ParseUUIDPipe) id: string, @Body() dto: UpdateRoleDto) {
    return this.roles.update(id, dto);
  }

  @IamScope({ kind: "role", location: "params", key: "id" })
  @Delete("roles/:id")
  remove(@Param("id", ParseUUIDPipe) id: string) {
    return this.roles.remove(id);
  }

  // Permissions

  @Get("permissions")
  findPermissions() {
    return this.roles.findPermissions();
  }

  @IamScope({ kind: "company", location: "query", key: "companyId" })
  @ApiForbiddenResponse({ description: "The platform permission list is read-only; this endpoint always rejects creation." })
  @Post("permissions")
  createPermission() {
    // Permissions are maintained by platform migrations, not company admins.
    throw new ForbiddenException("The platform permission list is read-only");
  }

  @IamScope({ kind: "role", location: "body", key: "roleId" })
  @Post("roles/grant-permission")
  @ApiBody({ type: GrantPermissionDto })
  grantPermission(@Body() dto: GrantPermissionDto) {
    return this.roles.grantPermission(dto);
  }

  @IamScope({ kind: "role", location: "params", key: "id" })
  @Get("roles/:id/permissions")
  rolePermissions(@Param("id", ParseUUIDPipe) id: string) {
    return this.roles.rolePermissionsFor(id);
  }

  // Role assignments

  @IamScope({ kind: "membership", location: "body", key: "companyUserId" })
  @Post("user-roles")
  @ApiBody({ type: AssignRoleDto })
  assignRole(@Body() dto: AssignRoleDto) {
    return this.roles.assignRole(dto);
  }

  @IamScope({ kind: "membership", location: "params", key: "companyUserId" })
  @Get("user-roles/:companyUserId")
  rolesForCompanyUser(@Param("companyUserId", ParseUUIDPipe) id: string) {
    return this.roles.rolesForCompanyUser(id);
  }

  // Company memberships

  @IamScope({ kind: "company", location: "body", key: "companyId" })
  @Post("company-users")
  @ApiBody({ type: AddCompanyUserDto })
  addCompanyUser(@Body() dto: AddCompanyUserDto) {
    return this.roles.addCompanyUser(dto);
  }

  @Get("company-users")
  findCompanyUsers(@Query("companyId", ParseUUIDPipe) companyId: string) {
    return this.roles.findCompanyUsers(companyId);
  }

  @IamScope({ kind: "membership", location: "params", key: "id" })
  @Get("company-users/:id")
  findCompanyUser(@Param("id", ParseUUIDPipe) id: string) {
    return this.roles.findCompanyUser(id);
  }

  @IamScope({ kind: "membership", location: "params", key: "id" })
  @Patch("company-users/:id")
  @ApiBody({ type: UpdateCompanyUserDto })
  updateCompanyUser(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdateCompanyUserDto,
  ) {
    return this.roles.updateCompanyUser(id, dto);
  }

  @IamScope({ kind: "membership", location: "params", key: "id" })
  @Delete("company-users/:id")
  removeCompanyUser(@Param("id", ParseUUIDPipe) id: string) {
    return this.roles.removeCompanyUser(id);
  }

  // Revoke one grant while keeping the shared permission definition.
  @IamScope({ kind: "role", location: "params", key: "roleId" })
  @Delete("roles/:roleId/permissions/:permissionId")
  @HttpCode(HttpStatus.NO_CONTENT)
  revokePermission(
    @Param("roleId", ParseUUIDPipe) roleId: string,
    @Param("permissionId", ParseUUIDPipe) permissionId: string,
  ) {
    return this.roles.revokePermission(roleId, permissionId);
  }

  // Remove one role from one member. Neither record is deleted.
  @IamScope({ kind: "membership", location: "params", key: "companyUserId" })
  @Delete("user-roles/:companyUserId/:roleId")
  @HttpCode(HttpStatus.NO_CONTENT)
  unassignRole(
    @Param("companyUserId", ParseUUIDPipe) companyUserId: string,
    @Param("roleId", ParseUUIDPipe) roleId: string,
  ) {
    return this.roles.unassignRole(companyUserId, roleId);
  }
}
