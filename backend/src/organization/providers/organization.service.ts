import {
  ConflictException,
  Injectable,
  NotFoundException,
  ForbiddenException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import {
  Repository,
  DataSource,
  type EntityTarget,
  type ObjectLiteral,
} from "typeorm";
import { CompanyUser } from "../../iam/entities/company-user.entity.js";
import { AuditWriterService } from "../../audit/providers/audit-writer.service.js";
import {
  CreateCompanyDto,
  CreateDepartmentDto,
  CreateLocationDto,
  UpdateCompanyDto,
  UpdateDepartmentDto,
  UpdateLocationDto,
} from "../dto/organization.dto.js";
import { Company } from "../entities/company.entity.js";
import { Department } from "../entities/department.entity.js";
import { Location } from "../entities/location.entity.js";

@Injectable()
export class OrganizationService {
  constructor(
    private readonly db: DataSource,
    private readonly audit: AuditWriterService,
    @InjectRepository(Company)
    private readonly companies: Repository<Company>,
    @InjectRepository(Department)
    private readonly departments: Repository<Department>,
    @InjectRepository(Location)
    private readonly locations: Repository<Location>,
  ) {}

  // Companies
  findCompanies(companyId: string): Promise<Company[]> {
    return this.companies.find({ where: { id: companyId } });
  }

  async findCompany(id: string): Promise<Company> {
    const company = await this.companies.findOneBy({ id });
    if (!company) throw new NotFoundException(`Company ${id} not found`);
    return company;
  }

  createCompany(_dto: CreateCompanyDto): Promise<Company> {
    throw new ConflictException(
      "Use registration to create the company and its first administrator together",
    );
  }

  async updateCompany(id: string, dto: UpdateCompanyDto): Promise<Company> {
    const company = await this.findCompany(id);
    Object.assign(company, this.defined(dto));
    return this.persist(
      Company,
      company,
      company.id,
      "company_updated",
      "company",
    );
  }

  async removeCompany(id: string): Promise<void> {
    await this.findCompany(id);
    throw new ConflictException(
      "Company history is retained. Update status to inactive instead of deleting the company",
    );
  }

  // Departments
  findDepartments(companyId: string): Promise<Department[]> {
    return this.departments.find({ where: { company: { id: companyId } } });
  }

  async findDepartment(id: string): Promise<Department> {
    const dept = await this.departments.findOne({
      where: { id },
      relations: { company: true },
    });
    if (!dept) throw new NotFoundException(`Department ${id} not found`);
    return dept;
  }

  async createDepartment(dto: CreateDepartmentDto): Promise<Department> {
    const { companyId, managerId, ...rest } = dto;
    if (managerId) await this.validateManager(managerId, companyId);
    return this.persist(
      Department,
      this.departments.create({
        ...rest,
        company: { id: companyId },
        manager: managerId ? { id: managerId } : undefined,
      }),
      companyId,
      "department_created",
      "department",
    );
  }

  async updateDepartment(
    id: string,
    dto: UpdateDepartmentDto,
  ): Promise<Department> {
    const dept = await this.findDepartment(id);
    const { managerId, ...rest } = dto;
    Object.assign(dept, this.defined(rest));
    if (managerId) await this.validateManager(managerId, dept.company.id);
    if (managerId !== undefined)
      dept.manager = (
        managerId ? { id: managerId } : null
      ) as Department["manager"];
    return this.persist(
      Department,
      dept,
      dept.company.id,
      "department_updated",
      "department",
    );
  }

  async removeDepartment(id: string): Promise<void> {
    await this.findDepartment(id);
    throw new ConflictException(
      "Department history is retained; department deletion is disabled",
    );
  }

  // Locations
  findLocations(companyId: string): Promise<Location[]> {
    return this.locations.find({ where: { company: { id: companyId } } });
  }

  async findLocation(id: string): Promise<Location> {
    const location = await this.locations.findOne({
      where: { id },
      relations: { company: true },
    });
    if (!location) throw new NotFoundException(`Location ${id} not found`);
    return location;
  }

  createLocation(dto: CreateLocationDto): Promise<Location> {
    const { companyId, ...rest } = dto;
    return this.persist(
      Location,
      this.locations.create({ ...rest, company: { id: companyId } }),
      companyId,
      "location_created",
      "location",
    );
  }

  async updateLocation(id: string, dto: UpdateLocationDto): Promise<Location> {
    const location = await this.findLocation(id);
    Object.assign(location, this.defined(dto));
    return this.persist(
      Location,
      location,
      location.company.id,
      "location_updated",
      "location",
    );
  }

  async removeLocation(id: string): Promise<void> {
    const location = await this.findLocation(id);
    location.isActive = false;
    await this.persist(
      Location,
      location,
      location.company.id,
      "location_deactivated",
      "location",
    );
  }
  // Business change and audit record succeed or roll back together.
  private persist<T extends ObjectLiteral>(
    target: EntityTarget<T>,
    entity: T,
    companyId: string,
    action: string,
    entityType: string,
  ): Promise<T> {
    return this.db
      .transaction(async (manager) => {
        const saved = await manager.save(target, entity);
        await this.audit.write(manager, {
          action,
          entityType,
          entityId: saved.id,
          companyId,
          newValues: {
            name: saved.name,
            status: saved.status,
          },
        });
        return saved;
      })
      .catch((error: unknown) => {
        const code =
          (error as { driverError?: { code?: string }; code?: string })
            ?.driverError?.code ?? (error as { code?: string })?.code;
        if (code === "23505")
          throw new ConflictException(
            "This company already has a record with this name or code",
          );
        throw error;
      });
  }
  private defined(dto: object): object {
    return Object.fromEntries(
      Object.entries(dto).filter(([, value]) => value !== undefined),
    );
  }
  private async validateManager(id: string, companyId: string): Promise<void> {
    const manager = await this.db.getRepository(CompanyUser).findOne({
      where: {
        id,
        company: { id: companyId },
        status: "active",
        user: { status: "active" },
      },
    });
    if (!manager)
      throw new ForbiddenException(
        "Department manager must be an active member of this company",
      );
  }
}
