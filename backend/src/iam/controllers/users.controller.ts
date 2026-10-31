import { ApiBearerAuth, ApiBody } from "@nestjs/swagger";
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from "@nestjs/common";
import { IamScope } from "../../auth/decorators/iam-scope.decorator.js";
import { CreateStaffDto } from "../dto/create-staff.dto.js";
import { AddCompanyUserDto, UpdateCompanyUserDto } from "../dto/role.dto.js";
import { UpdateUserDto } from "../dto/user.dto.js";
import { UsersService } from "../providers/users.service.js";

@IamScope({ kind: "company", location: "query", key: "companyId" })
@ApiBearerAuth()
@Controller("iam/users")
export class UsersController {
  constructor(private readonly users: UsersService) {}

  // The old global user list becomes a company-scoped staff list.
  @Get()
  findAll(@Query("companyId", ParseUUIDPipe) companyId: string) {
    return this.users.findAll(companyId);
  }

  @IamScope({ kind: "company", location: "params", key: "companyId" })
  @Get("companies/:companyId/members")
  findCompanyUsers(@Param("companyId", ParseUUIDPipe) companyId: string) {
    return this.users.findCompanyUsers(companyId);
  }

  // Compatibility endpoint for existing test accounts. No public signup.
  @IamScope({ kind: "company", location: "body", key: "companyId" })
  @Post("memberships")
  @ApiBody({ type: AddCompanyUserDto })
  addToCompany(@Body() dto: AddCompanyUserDto) {
    return this.users.addToCompany(dto);
  }

  @IamScope({ kind: "membership", location: "params", key: "id" })
  @Patch("memberships/:id")
  @ApiBody({ type: UpdateCompanyUserDto })
  updateCompanyUser(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdateCompanyUserDto,
  ) {
    return this.users.updateCompanyUser(id, dto);
  }

  @IamScope({ kind: "company", location: "body", key: "companyId" })
  @Post()
  @ApiBody({ type: CreateStaffDto })
  create(@Body() dto: CreateStaffDto) {
    return this.users.create(dto);
  }

  @IamScope({ kind: "user", location: "params", key: "id" })
  @Get(":id")
  findOne(@Param("id", ParseUUIDPipe) id: string) {
    return this.users.findOne(id);
  }

  @IamScope({ kind: "user", location: "params", key: "id" })
  @Patch(":id")
  @ApiBody({ type: UpdateUserDto })
  update(@Param("id", ParseUUIDPipe) id: string, @Body() dto: UpdateUserDto) {
    return this.users.update(id, dto);
  }

  @IamScope({ kind: "user", location: "params", key: "id" })
  @Delete(":id")
  remove(@Param("id", ParseUUIDPipe) id: string) {
    return this.users.remove(id);
  }
}
