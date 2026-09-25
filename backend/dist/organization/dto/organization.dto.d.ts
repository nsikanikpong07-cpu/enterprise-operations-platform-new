export declare class CreateCompanyDto {
    name: string;
    legalName?: string;
    registrationNumber?: string;
    taxIdentificationNumber?: string;
    industry?: string;
    countryCode?: string;
    defaultCurrency?: string;
    timezone?: string;
}
export declare class UpdateCompanyDto {
    name?: string;
    legalName?: string;
    industry?: string;
    status?: string;
}
export declare class CreateDepartmentDto {
    companyId: string;
    name: string;
    code?: string;
    managerId?: string;
}
export declare class UpdateDepartmentDto {
    name?: string;
    code?: string;
    managerId?: string;
}
export declare class CreateLocationDto {
    companyId: string;
    name: string;
    code: string;
    type?: string;
    address?: string;
    city?: string;
    state?: string;
    countryCode?: string;
}
export declare class UpdateLocationDto {
    name?: string;
    address?: string;
    isActive?: boolean;
}
