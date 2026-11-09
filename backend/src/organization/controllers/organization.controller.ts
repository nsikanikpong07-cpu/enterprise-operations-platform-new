import { ApiBearerAuth, ApiBody, ApiOperation, ApiGoneResponse } from "@nestjs/swagger";
import type { CompanyAuthenticatedRequest } from "../../auth/guards/company-access.guard.js";
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

  @ApiOperation({ deprecated: true, description: "Use POST /auth/register instead." })
  @ApiGoneResponse({ description: "Use POST /auth/register to create the company and its first administrator." })
  @Post("companies")
  @ApiBody({ type: CreateCompanyDto })
  createCompany(@Body() _dto: CreateCompanyDto) {
    throw new GoneException(
      "Use POST /auth/register to create the company and its first administrator together",
    );
  }

  @Patch("companies/:id")
  @ApiBody({ type: UpdateCompanyDto })
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
  @ApiBody({ type: CreateDepartmentDto })
  createDepartment(@Body() dto: CreateDepartmentDto) {
    return this.organization.createDepartment(dto);
  }

  @Patch("departments/:id")
  @ApiBody({ type: UpdateDepartmentDto })
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
  @ApiBody({ type: CreateLocationDto })
  createLocation(@Body() dto: CreateLocationDto) {
    return this.organization.createLocation(dto);
  }

  @Patch("locations/:id")
  @ApiBody({ type: UpdateLocationDto })
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
