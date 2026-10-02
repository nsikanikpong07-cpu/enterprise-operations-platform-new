import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  CreateCompanyDto,
  CreateDepartmentDto,
  CreateLocationDto,
  UpdateCompanyDto,
  UpdateDepartmentDto,
  UpdateLocationDto,
} from '../dto/organization.dto.js';
import { Company } from '../entities/company.entity.js';
import { Department } from '../entities/department.entity.js';
import { Location } from '../entities/location.entity.js';

@Injectable()
export class OrganizationService {
  constructor(
    @InjectRepository(Company)
    private readonly companies: Repository<Company>,
    @InjectRepository(Department)
    private readonly departments: Repository<Department>,
    @InjectRepository(Location)
    private readonly locations: Repository<Location>,
  ) {}

  // Companies
  findCompanies(): Promise<Company[]> {
    return this.companies.find();
  }

  async findCompany(id: string): Promise<Company> {
    const company = await this.companies.findOneBy({ id });
    if (!company) throw new NotFoundException(`Company ${id} not found`);
    return company;
  }

  createCompany(dto: CreateCompanyDto): Promise<Company> {
    return this.companies.save(this.companies.create(dto));
  }

  async updateCompany(id: string, dto: UpdateCompanyDto): Promise<Company> {
    const company = await this.findCompany(id);
    Object.assign(company, dto);
    return this.companies.save(company);
  }

  async removeCompany(id: string): Promise<void> {
    const company = await this.findCompany(id);
    await this.companies.remove(company);
  }

  // Departments
  findDepartments(companyId: string): Promise<Department[]> {
    return this.departments.find({ where: { company: { id: companyId } } });
  }

  async findDepartment(id: string): Promise<Department> {
    const dept = await this.departments.findOneBy({ id });
    if (!dept) throw new NotFoundException(`Department ${id} not found`);
    return dept;
  }

  createDepartment(dto: CreateDepartmentDto): Promise<Department> {
    const { companyId, managerId, ...rest } = dto;
    return this.departments.save(
      this.departments.create({
        ...rest,
        company: { id: companyId },
        manager: managerId ? { id: managerId } : undefined,
      }),
    );
  }

  async updateDepartment(
    id: string,
    dto: UpdateDepartmentDto,
  ): Promise<Department> {
    const dept = await this.findDepartment(id);
    const { managerId, ...rest } = dto;
    Object.assign(dept, rest);
    if (managerId !== undefined)
      dept.manager = { id: managerId } as Department['manager'];
    return this.departments.save(dept);
  }

  async removeDepartment(id: string): Promise<void> {
    const dept = await this.findDepartment(id);
    await this.departments.remove(dept);
  }

  // Locations
  findLocations(companyId: string): Promise<Location[]> {
    return this.locations.find({ where: { company: { id: companyId } } });
  }

  async findLocation(id: string): Promise<Location> {
    const location = await this.locations.findOneBy({ id });
    if (!location) throw new NotFoundException(`Location ${id} not found`);
    return location;
  }

  createLocation(dto: CreateLocationDto): Promise<Location> {
    const { companyId, ...rest } = dto;
    return this.locations.save(
      this.locations.create({ ...rest, company: { id: companyId } }),
    );
  }

  async updateLocation(id: string, dto: UpdateLocationDto): Promise<Location> {
    const location = await this.findLocation(id);
    Object.assign(location, dto);
    return this.locations.save(location);
  }

  async removeLocation(id: string): Promise<void> {
    const location = await this.findLocation(id);
    await this.locations.remove(location);
  }
}
