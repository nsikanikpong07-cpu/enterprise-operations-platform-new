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
  AddCompanyUserDto,
  UpdateCompanyUserDto,
} from '../dto/role.dto.js';
import { CreateUserDto, UpdateUserDto } from '../dto/user.dto.js';
import { UsersService } from '../providers/users.service.js';

@Controller('iam/users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get()
  findAll() {
    return this.users.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.users.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateUserDto) {
    return this.users.create(dto);
  }

  @Patch(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateUserDto) {
    return this.users.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.users.remove(id);
  }

  @Get('companies/:companyId/members')
  findCompanyUsers(@Param('companyId', ParseUUIDPipe) companyId: string) {
    return this.users.findCompanyUsers(companyId);
  }

  @Post('memberships')
  addToCompany(@Body() dto: AddCompanyUserDto) {
    return this.users.addToCompany(dto);
  }

  @Patch('memberships/:id')
  updateCompanyUser(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCompanyUserDto,
  ) {
    return this.users.updateCompanyUser(id, dto);
  }
}
