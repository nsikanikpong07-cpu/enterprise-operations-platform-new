import { CreateCompanyDto, CreateDepartmentDto, CreateLocationDto, UpdateCompanyDto, UpdateDepartmentDto, UpdateLocationDto } from '../dto/organization.dto.js';
import { OrganizationService } from '../providers/organization.service.js';
export declare class OrganizationController {
    private readonly organization;
    constructor(organization: OrganizationService);
    findCompanies(): Promise<import("../entities/company.entity.js").Company[]>;
    findCompany(id: string): Promise<import("../entities/company.entity.js").Company>;
    createCompany(dto: CreateCompanyDto): Promise<import("../entities/company.entity.js").Company>;
    updateCompany(id: string, dto: UpdateCompanyDto): Promise<import("../entities/company.entity.js").Company>;
    removeCompany(id: string): Promise<void>;
    findDepartments(companyId: string): Promise<import("../entities/department.entity.js").Department[]>;
    createDepartment(dto: CreateDepartmentDto): Promise<import("../entities/department.entity.js").Department>;
    updateDepartment(id: string, dto: UpdateDepartmentDto): Promise<import("../entities/department.entity.js").Department>;
    removeDepartment(id: string): Promise<void>;
    findLocations(companyId: string): Promise<import("../entities/location.entity.js").Location[]>;
    createLocation(dto: CreateLocationDto): Promise<import("../entities/location.entity.js").Location>;
    updateLocation(id: string, dto: UpdateLocationDto): Promise<import("../entities/location.entity.js").Location>;
    removeLocation(id: string): Promise<void>;
}
