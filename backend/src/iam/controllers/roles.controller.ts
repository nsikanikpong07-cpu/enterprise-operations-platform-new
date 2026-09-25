import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import {
  AssignRoleDto,
  CreatePermissionDto,
  CreateRoleDto,
  GrantPermissionDto,
  UpdateRoleDto,
} from '../dto/role.dto.js';
import { RolesService } from '../providers/roles.service.js';

@Controller('iam')
export class RolesController {
  constructor(private readonly roles: RolesService) {}

  @Get('roles')
  findAll() {
    return this.roles.findAll();
  }

  @Get('roles/:id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.roles.findOne(id);
  }

  @Post('roles')
  create(@Body() dto: CreateRoleDto) {
    return this.roles.create(dto);
  }

  @Patch('roles/:id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateRoleDto) {
    return this.roles.update(id, dto);
  }

  @Delete('roles/:id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.roles.remove(id);
  }

  @Get('permissions')
  findPermissions() {
    return this.roles.findPermissions();
  }

  @Post('permissions')
  createPermission(@Body() dto: CreatePermissionDto) {
    return this.roles.createPermission(dto);
  }

  @Post('roles/grant-permission')
  grantPermission(@Body() dto: GrantPermissionDto) {
    return this.roles.grantPermission(dto);
  }

  @Get('roles/:id/permissions')
  rolePermissions(@Param('id', ParseUUIDPipe) id: string) {
    return this.roles.rolePermissionsFor(id);
  }

  @Post('user-roles')
  assignRole(@Body() dto: AssignRoleDto) {
    return this.roles.assignRole(dto);
  }

  @Get('user-roles/:companyUserId')
  rolesForCompanyUser(@Param('companyUserId', ParseUUIDPipe) id: string) {
    return this.roles.rolesForCompanyUser(id);
  }
}
