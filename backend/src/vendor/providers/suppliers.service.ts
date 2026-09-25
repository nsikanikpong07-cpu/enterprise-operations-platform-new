import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  CreateSupplierContactDto,
  CreateSupplierDocumentDto,
  CreateSupplierDto,
  OnboardSupplierDto,
  UpdateSupplierDto,
  UpdateSupplierProfileDto,
} from '../dto/vendor.dto.js';
import { SupplierCompanyProfile } from '../entities/supplier-company-profile.entity.js';
import { SupplierContact } from '../entities/supplier-contact.entity.js';
import { SupplierDocument } from '../entities/supplier-document.entity.js';
import { Supplier } from '../entities/supplier.entity.js';

@Injectable()
export class SuppliersService {
  constructor(
    @InjectRepository(Supplier)
    private readonly suppliers: Repository<Supplier>,
    @InjectRepository(SupplierCompanyProfile)
    private readonly profiles: Repository<SupplierCompanyProfile>,
    @InjectRepository(SupplierContact)
    private readonly contacts: Repository<SupplierContact>,
    @InjectRepository(SupplierDocument)
    private readonly documents: Repository<SupplierDocument>,
  ) {}

  // Suppliers (global registry)
  findAll(): Promise<Supplier[]> {
    return this.suppliers.find();
  }

  async findOne(id: string): Promise<Supplier> {
    const supplier = await this.suppliers.findOneBy({ id });
    if (!supplier) throw new NotFoundException(`Supplier ${id} not found`);
    return supplier;
  }

  create(dto: CreateSupplierDto): Promise<Supplier> {
    return this.suppliers.save(this.suppliers.create(dto));
  }

  async update(id: string, dto: UpdateSupplierDto): Promise<Supplier> {
    const supplier = await this.findOne(id);
    Object.assign(supplier, dto);
    return this.suppliers.save(supplier);
  }

  // Company profiles (per-tenant relationship)
  onboard(dto: OnboardSupplierDto): Promise<SupplierCompanyProfile> {
    const { supplierId, companyId, ...rest } = dto;
    return this.profiles.save(
      this.profiles.create({
        ...rest,
        supplier: { id: supplierId },
        company: { id: companyId },
      }),
    );
  }

  profilesForCompany(companyId: string): Promise<SupplierCompanyProfile[]> {
    return this.profiles.find({
      where: { company: { id: companyId } },
      relations: { supplier: true },
    });
  }

  async updateProfile(
    id: string,
    dto: UpdateSupplierProfileDto,
  ): Promise<SupplierCompanyProfile> {
    const profile = await this.profiles.findOneBy({ id });
    if (!profile)
      throw new NotFoundException(`SupplierCompanyProfile ${id} not found`);
    Object.assign(profile, dto);
    return this.profiles.save(profile);
  }

  // Contacts
  addContact(dto: CreateSupplierContactDto): Promise<SupplierContact> {
    const { supplierId, ...rest } = dto;
    return this.contacts.save(
      this.contacts.create({ ...rest, supplier: { id: supplierId } }),
    );
  }

  contactsFor(supplierId: string): Promise<SupplierContact[]> {
    return this.contacts.find({ where: { supplier: { id: supplierId } } });
  }

  // Documents
  addDocument(dto: CreateSupplierDocumentDto): Promise<SupplierDocument> {
    const { supplierId, companyProfileId, uploadedById, ...rest } = dto;
    return this.documents.save(
      this.documents.create({
        ...rest,
        supplier: { id: supplierId },
        companyProfile: companyProfileId
          ? { id: companyProfileId }
          : undefined,
        uploadedBy: uploadedById ? { id: uploadedById } : undefined,
      }),
    );
  }

  documentsFor(supplierId: string): Promise<SupplierDocument[]> {
    return this.documents.find({ where: { supplier: { id: supplierId } } });
  }
}
