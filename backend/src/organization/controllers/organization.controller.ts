import type { CompanyAuthenticatedRequest } from "../../auth/guards/company-access.guard.js";
import { ApiBearerAuth } from '@nestjs/swagger';
import {
  Body,
  Req,
  GoneException,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from "@nestjs/common";

import {
  CreateCompanyDto,
  CreateDepartmentDto,
  CreateLocationDto,
  UpdateCompanyDto,
  UpdateDepartmentDto,
  UpdateLocationDto,
} from "../dto/organization.dto.js";
import { OrganizationService } from "../providers/organization.service.js";


@ApiBearerAuth()
@Controller("organization")
export class OrganizationController {
  constructor(private readonly organization: OrganizationService) {}

  // Companies
  @Get("companies")
  findCompanies(@Req() request: CompanyAuthenticatedRequest) {
    return this.organization.findCompanies(
      request.companyMembership!.company.id,
    );
  }

  @Get("companies/:id")
  findCompany(@Param("id", ParseUUIDPipe) id: string) {
    return this.organization.findCompany(id);
  }

  @Post("companies")
  createCompany(@Body() _dto: CreateCompanyDto) {
    throw new GoneException(
      "Use POST /auth/register to create the company and its first administrator together",
    );
  }

  @Patch("companies/:id")
  updateCompany(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdateCompanyDto,
  ) {
    return this.organization.updateCompany(id, dto);
  }

  @Delete("companies/:id")
  removeCompany(@Param("id", ParseUUIDPipe) id: string) {
    return this.organization.removeCompany(id);
  }

  // Departments
  @Get("companies/:companyId/departments")
  findDepartments(@Param("companyId", ParseUUIDPipe) companyId: string) {
    return this.organization.findDepartments(companyId);
  }

  @Post("departments")
  createDepartment(@Body() dto: CreateDepartmentDto) {
    return this.organization.createDepartment(dto);
  }

  @Patch("departments/:id")
  updateDepartment(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdateDepartmentDto,
  ) {
    return this.organization.updateDepartment(id, dto);
  }

  @Delete("departments/:id")
  removeDepartment(@Param("id", ParseUUIDPipe) id: string) {
    return this.organization.removeDepartment(id);
  }

  // Locations
  @Get("companies/:companyId/locations")
  findLocations(@Param("companyId", ParseUUIDPipe) companyId: string) {
    return this.organization.findLocations(companyId);
  }

  @Post("locations")
  createLocation(@Body() dto: CreateLocationDto) {
    return this.organization.createLocation(dto);
  }

  @Patch("locations/:id")
  updateLocation(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdateLocationDto,
  ) {
    return this.organization.updateLocation(id, dto);
  }

  @Delete("locations/:id")
  removeLocation(@Param("id", ParseUUIDPipe) id: string) {
    return this.organization.removeLocation(id);
  }
}
