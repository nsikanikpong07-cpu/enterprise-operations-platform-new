import { Repository } from 'typeorm';
import { CreateCompanyDto, CreateDepartmentDto, CreateLocationDto, UpdateCompanyDto, UpdateDepartmentDto, UpdateLocationDto } from '../dto/organization.dto.js';
import { Company } from '../entities/company.entity.js';
import { Department } from '../entities/department.entity.js';
import { Location } from '../entities/location.entity.js';
export declare class OrganizationService {
    private readonly companies;
    private readonly departments;
    private readonly locations;
    constructor(companies: Repository<Company>, departments: Repository<Department>, locations: Repository<Location>);
    findCompanies(): Promise<Company[]>;
    findCompany(id: string): Promise<Company>;
    createCompany(dto: CreateCompanyDto): Promise<Company>;
    updateCompany(id: string, dto: UpdateCompanyDto): Promise<Company>;
    removeCompany(id: string): Promise<void>;
    findDepartments(companyId: string): Promise<Department[]>;
    findDepartment(id: string): Promise<Department>;
    createDepartment(dto: CreateDepartmentDto): Promise<Department>;
    updateDepartment(id: string, dto: UpdateDepartmentDto): Promise<Department>;
    removeDepartment(id: string): Promise<void>;
    findLocations(companyId: string): Promise<Location[]>;
    findLocation(id: string): Promise<Location>;
    createLocation(dto: CreateLocationDto): Promise<Location>;
    updateLocation(id: string, dto: UpdateLocationDto): Promise<Location>;
    removeLocation(id: string): Promise<void>;
}
