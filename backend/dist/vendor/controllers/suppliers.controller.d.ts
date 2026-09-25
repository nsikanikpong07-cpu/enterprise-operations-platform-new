import { CreateSupplierContactDto, CreateSupplierDocumentDto, CreateSupplierDto, OnboardSupplierDto, UpdateSupplierDto, UpdateSupplierProfileDto } from '../dto/vendor.dto.js';
import { SuppliersService } from '../providers/suppliers.service.js';
export declare class SuppliersController {
    private readonly suppliers;
    constructor(suppliers: SuppliersService);
    findAll(): Promise<import("../entities/supplier.entity.js").Supplier[]>;
    findOne(id: string): Promise<import("../entities/supplier.entity.js").Supplier>;
    create(dto: CreateSupplierDto): Promise<import("../entities/supplier.entity.js").Supplier>;
    update(id: string, dto: UpdateSupplierDto): Promise<import("../entities/supplier.entity.js").Supplier>;
    onboard(dto: OnboardSupplierDto): Promise<import("../entities/supplier-company-profile.entity.js").SupplierCompanyProfile>;
    profilesForCompany(companyId: string): Promise<import("../entities/supplier-company-profile.entity.js").SupplierCompanyProfile[]>;
    updateProfile(id: string, dto: UpdateSupplierProfileDto): Promise<import("../entities/supplier-company-profile.entity.js").SupplierCompanyProfile>;
    addContact(dto: CreateSupplierContactDto): Promise<import("../entities/supplier-contact.entity.js").SupplierContact>;
    contactsFor(id: string): Promise<import("../entities/supplier-contact.entity.js").SupplierContact[]>;
    addDocument(dto: CreateSupplierDocumentDto): Promise<import("../entities/supplier-document.entity.js").SupplierDocument>;
    documentsFor(id: string): Promise<import("../entities/supplier-document.entity.js").SupplierDocument[]>;
}
