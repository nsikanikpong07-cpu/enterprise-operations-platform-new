import { Repository } from 'typeorm';
import { CreateSupplierContactDto, CreateSupplierDocumentDto, CreateSupplierDto, OnboardSupplierDto, UpdateSupplierDto, UpdateSupplierProfileDto } from '../dto/vendor.dto.js';
import { SupplierCompanyProfile } from '../entities/supplier-company-profile.entity.js';
import { SupplierContact } from '../entities/supplier-contact.entity.js';
import { SupplierDocument } from '../entities/supplier-document.entity.js';
import { Supplier } from '../entities/supplier.entity.js';
export declare class SuppliersService {
    private readonly suppliers;
    private readonly profiles;
    private readonly contacts;
    private readonly documents;
    constructor(suppliers: Repository<Supplier>, profiles: Repository<SupplierCompanyProfile>, contacts: Repository<SupplierContact>, documents: Repository<SupplierDocument>);
    findAll(): Promise<Supplier[]>;
    findOne(id: string): Promise<Supplier>;
    create(dto: CreateSupplierDto): Promise<Supplier>;
    update(id: string, dto: UpdateSupplierDto): Promise<Supplier>;
    onboard(dto: OnboardSupplierDto): Promise<SupplierCompanyProfile>;
    profilesForCompany(companyId: string): Promise<SupplierCompanyProfile[]>;
    updateProfile(id: string, dto: UpdateSupplierProfileDto): Promise<SupplierCompanyProfile>;
    addContact(dto: CreateSupplierContactDto): Promise<SupplierContact>;
    contactsFor(supplierId: string): Promise<SupplierContact[]>;
    addDocument(dto: CreateSupplierDocumentDto): Promise<SupplierDocument>;
    documentsFor(supplierId: string): Promise<SupplierDocument[]>;
}
