import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { basename, extname, join, resolve, sep } from 'node:path';
import { DataSource, In, IsNull, Repository } from 'typeorm';
import { AuditWriterService } from '../../audit/providers/audit-writer.service.js';
import {
  CreateSupplierContactDto,
  CreateSupplierDocumentDto,
  CreateSupplierDto,
  OnboardSupplierDto,
  SupplierWorkspaceContactDto,
  SupplierWorkspaceProfileDto,
  UpdateSupplierDto,
  UpdateSupplierProfileDto,
  UpdateSupplierWorkspaceContactDto,
  SupplierListingDto,
  UpdateSupplierListingDto,
} from '../dto/vendor.dto.js';
import { SupplierCompanyProfile } from '../entities/supplier-company-profile.entity.js';
import { SupplierContact } from '../entities/supplier-contact.entity.js';
import { SupplierDocument } from '../entities/supplier-document.entity.js';
import { Supplier } from '../entities/supplier.entity.js';
import { SupplierListing } from '../entities/supplier-listing.entity.js';
import { SupplierListingPhoto } from '../entities/supplier-listing-photo.entity.js';
import { CertificateOcrService, type UploadedCertificate } from './certificate-ocr.service.js';
import { VerificationCase } from '../entities/verification-case.entity.js';
import { VerificationCheck } from '../entities/verification-check.entity.js';
import { VerificationEvidence } from '../entities/verification-evidence.entity.js';

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
    private readonly dataSource: DataSource,
    private readonly audit: AuditWriterService,
    private readonly certificateOcr: CertificateOcrService,
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

  async workspaceForUser(userId: string) {
    const supplierId = await this.supplierIdForUser(userId);
    const [supplier, contacts, latestCase] = await Promise.all([
      this.suppliers.findOneBy({ id: supplierId }),
      this.contacts.find({
        where: { supplier: { id: supplierId } },
        order: { createdAt: 'ASC' },
      }),
      this.dataSource.query(
        `SELECT c.status, c.expires_at FROM vendor.verification_cases c
         WHERE c.supplier_id = $1 OR c.supplier_company_profile_id IN
           (SELECT p.id FROM vendor.supplier_company_profiles p WHERE p.supplier_id = $1)
         ORDER BY c.opened_at DESC, c.id DESC LIMIT 1`,
        [supplierId],
      ),
    ]);
    if (!supplier) throw new NotFoundException('Supplier account not found');
    const currentCase = latestCase[0] as { status: string; expires_at?: string | Date | null } | undefined;
    let verificationStatus = 'not_verified';
    if (currentCase?.status === 'open' || currentCase?.status === 'in_progress') verificationStatus = 'under_review';
    else if (currentCase?.status === 'rejected') verificationStatus = 'rejected';
    else if (currentCase?.status === 'expired' || (currentCase?.status === 'approved' && currentCase.expires_at && new Date(currentCase.expires_at).getTime() <= Date.now())) verificationStatus = 'expired';
    else if (currentCase?.status === 'approved') verificationStatus = 'verified';
    else if (!currentCase && (await this.documents.count({ where: { supplier: { id: supplierId }, status: 'pending' } }))) verificationStatus = 'under_review';
    return { supplier, contacts, verificationStatus };
  }

  async workspaceDocumentsForUser(userId: string) {
    const supplierId = await this.supplierIdForUser(userId);
    return this.documents.find({
      where: { supplier: { id: supplierId } },
      select: {
        id: true,
        documentType: true,
        documentNumber: true,
        issuedAt: true,
        expiresAt: true,
        status: true,
        createdAt: true,
      },
      order: { createdAt: 'DESC' },
    });
  }

  async uploadWorkspaceCac(userId: string, file: UploadedCertificate) {
    const supplierId = await this.supplierIdForUser(userId);
    return this.persistWorkspaceCac(supplierId, userId, file);
  }

  async createWorkspaceUploadTicket(userId: string) {
    const supplierId = await this.supplierIdForUser(userId);
    const ticket = randomBytes(32).toString('base64url');
    const tokenHash = createHash('sha256').update(ticket).digest('hex');
    await this.dataSource.query(
      `WITH cleanup AS (
         DELETE FROM vendor.supplier_upload_tickets
         WHERE expires_at <= NOW() OR consumed_at < NOW() - INTERVAL '1 day'
       )
       INSERT INTO vendor.supplier_upload_tickets (token_hash, supplier_id, user_id, expires_at)
       VALUES ($1, $2, $3, NOW() + INTERVAL '5 minutes')`,
      [tokenHash, supplierId, userId],
    );
    return { ticket, expiresInSeconds: 300 };
  }

  async uploadWorkspaceCacWithTicket(ticket: string, file: UploadedCertificate) {
    if (!ticket || ticket.length > 128) throw new BadRequestException('A valid upload ticket is required.');
    const tokenHash = createHash('sha256').update(ticket).digest('hex');
    const rows = await this.dataSource.query(
      `SELECT supplier_id, user_id FROM vendor.supplier_upload_tickets
       WHERE token_hash = $1 AND consumed_at IS NULL AND expires_at > NOW()`,
      [tokenHash],
    );
    if (!rows.length) throw new BadRequestException('This upload ticket is invalid or expired. Request a new one.');
    const { supplier_id: supplierId, user_id: userId } = rows[0] as { supplier_id: string; user_id: string };
    return this.persistWorkspaceCac(supplierId, userId, file, tokenHash);
  }

  private async persistWorkspaceCac(supplierId: string, userId: string, file: UploadedCertificate, uploadTicketHash?: string) {
    const extension = basename(file?.originalname ?? '').match(/\.(pdf|png|jpe?g)$/i)?.[0]?.toLowerCase();
    if (!file?.buffer?.length || file.size > 15 * 1024 * 1024 || !extension) {
      throw new BadRequestException('Choose a PDF, JPG, or PNG certificate up to 15 MB.');
    }
    const bytes = file.buffer;
    const valid = extension === '.pdf'
      ? bytes.subarray(0, 5).toString('ascii') === '%PDF-'
      : extension === '.png'
        ? bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
        : bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
    if (!valid) throw new BadRequestException('The file contents do not match its PDF, JPG, or PNG type.');

    const root = resolve(process.env.SUPPLIER_DOCUMENT_STORAGE_DIR ?? join(process.cwd(), 'private', 'supplier-documents'));
    const key = `${supplierId}/${randomUUID()}${extension}`;
    const target = resolve(root, ...key.split('/'));
    if (!target.startsWith(`${root}${sep}`)) throw new BadRequestException('Invalid file location.');
    await mkdir(join(root, supplierId), { recursive: true, mode: 0o700 });
    await writeFile(target, bytes, { flag: 'wx', mode: 0o600 });
    try {
      const document = await this.dataSource.transaction(async (manager) => {
        if (uploadTicketHash) {
          const consumed = await manager.query(
            `UPDATE vendor.supplier_upload_tickets SET consumed_at = NOW()
             WHERE token_hash = $1 AND consumed_at IS NULL AND expires_at > NOW()
             RETURNING supplier_id, user_id`,
            [uploadTicketHash],
          );
          if (!consumed.length || consumed[0].supplier_id !== supplierId || consumed[0].user_id !== userId) {
            throw new BadRequestException('This upload ticket was already used or has expired. Request a new one.');
          }
        }
        const saved = await manager.getRepository(SupplierDocument).save(
          manager.getRepository(SupplierDocument).create({
            supplier: { id: supplierId },
            documentType: 'CAC registration certificate',
            fileUrl: key,
            fileHash: createHash('sha256').update(bytes).digest('hex'),
            status: 'pending',
            uploadedBy: { id: userId },
          }),
        );
        await this.audit.write(manager, {
          action: 'supplier.certificate.uploaded',
          entityType: 'supplier_document',
          entityId: saved.id,
          actorId: userId,
          newValues: { status: 'pending' },
        });
        return saved;
      });
      const verification = await this.processUploadedCac(document.id, supplierId, userId, file);
      return {
        id: document.id,
        documentType: document.documentType,
        status: verification.decision === 'approved' ? 'valid' : verification.decision === 'rejected' ? 'rejected' : 'pending',
        createdAt: document.createdAt,
        verification: {
          status: verification.decision === 'approved' ? 'verified' : verification.decision === 'rejected' ? 'rejected' : 'under_review',
          caseId: verification.caseId,
          ocr: verification.result,
        },
      };
    } catch (error) {
      await rm(target, { force: true });
      throw error;
    }
  }

  private async processUploadedCac(documentId: string, supplierId: string, userId: string, file: UploadedCertificate) {
    let result: Awaited<ReturnType<CertificateOcrService['compareWithQr']>> | {
      comparison: 'manual_review_needed'; decision: 'manual_review'; fields: Record<string, unknown>;
      reasons: string[]; notes: string[]; reviewerDecisionRequired: true; verificationStatusChanged: false;
    };
    try {
      result = await this.certificateOcr.compareWithQr(file);
    } catch (error) {
      // OCR outages and unreadable uploads stay in the reviewer queue instead of blocking upload.
      result = {
        comparison: 'manual_review_needed', decision: 'manual_review', fields: {},
        reasons: [error instanceof Error ? error.message : 'OCR could not complete the comparison.'],
        notes: [], reviewerDecisionRequired: true, verificationStatusChanged: false,
      };
    }
    const now = new Date();
    const status = result.decision === 'approved' ? 'approved' : result.decision === 'rejected' ? 'rejected' : 'open';
    const decisionSource = result.decision === 'approved' ? 'ocr_match' : result.decision === 'rejected' ? 'ocr_mismatch' : 'ocr_review';
    return this.dataSource.transaction(async (manager) => {
      const caseRepo = manager.getRepository(VerificationCase);
      const verificationCase = await caseRepo.save(caseRepo.create({
        supplier: { id: supplierId },
        caseNumber: `VER-${randomUUID()}`,
        verificationType: 'initial',
        decisionSource,
        status,
        openedBy: { id: userId },
        openedAt: now,
        ...(status === 'open' ? {} : { completedAt: now }),
      }));
      const checkRepo = manager.getRepository(VerificationCheck);
      const check = await checkRepo.save(checkRepo.create({
        verificationCase: { id: verificationCase.id },
        checkType: 'cac_ocr_qr_comparison',
        name: 'CAC printed details and QR comparison',
        status: result.decision === 'approved' ? 'passed' : result.decision === 'rejected' ? 'failed' : 'pending',
        isRequired: true,
        checkedAt: now,
        notes: result.reasons.join('; ').slice(0, 2000),
      }));
      await manager.getRepository(VerificationEvidence).save(manager.getRepository(VerificationEvidence).create({
        check: { id: check.id },
        supplierDocument: { id: documentId },
        evidenceType: 'ocr_comparison_result',
        description: JSON.stringify({
          documentId, comparison: result.comparison, decision: result.decision,
          fields: result.fields, reasons: result.reasons, notes: result.notes,
          reviewerDecisionRequired: result.reviewerDecisionRequired,
          verificationStatusChanged: result.verificationStatusChanged,
        }),
        uploadedBy: { id: userId },
      }));
      const documentStatus = result.decision === 'approved' ? 'valid' : result.decision === 'rejected' ? 'rejected' : 'pending';
      await manager.getRepository(SupplierDocument).update({ id: documentId }, { status: documentStatus });
      await this.audit.write(manager, {
        action: result.decision === 'approved' ? 'supplier.certificate.ocr_matched' : result.decision === 'rejected' ? 'supplier.certificate.ocr_mismatch' : 'supplier.certificate.ocr_manual_review',
        entityType: 'verification_case', entityId: verificationCase.id, actorId: userId,
        newValues: { decisionSource, status, supplierId, documentId },
      });
      return { caseId: verificationCase.id, decision: result.decision, result };
    });
  }

  async updateWorkspaceProfile(userId: string, dto: SupplierWorkspaceProfileDto) {
    const supplierId = await this.supplierIdForUser(userId);
    return this.dataSource.transaction(async (manager) => {
      const suppliers = manager.getRepository(Supplier);
      const supplier = await suppliers.findOneBy({ id: supplierId });
      if (!supplier) throw new NotFoundException('Supplier account not found');
      const changedFields = Object.keys(dto).filter((field) =>
        Object.prototype.hasOwnProperty.call(dto, field),
      );
      Object.assign(supplier, dto);
      if (supplier.countryCode) supplier.countryCode = supplier.countryCode.toUpperCase();
      const saved = await suppliers.save(supplier);
      await this.audit.write(manager, {
        action: 'supplier_profile_updated',
        entityType: 'supplier',
        entityId: supplier.id,
        actorId: userId,
        newValues: { changedFields },
      });
      return saved;
    });
  }

  async addWorkspaceContact(userId: string, dto: SupplierWorkspaceContactDto) {
    const supplierId = await this.supplierIdForUser(userId);
    return this.dataSource.transaction(async (manager) => {
      const contacts = manager.getRepository(SupplierContact);
      const current = await contacts.count({ where: { supplier: { id: supplierId } } });
      const isPrimary = current === 0 || dto.isPrimary === true;
      if (isPrimary) {
        await contacts.update({ supplier: { id: supplierId } }, { isPrimary: false });
      }
      const saved = await contacts.save(
        contacts.create({
          ...dto,
          isPrimary,
          supplier: { id: supplierId },
        }),
      );
      await this.audit.write(manager, {
        action: 'supplier_contact_added',
        entityType: 'supplier_contact',
        entityId: saved.id,
        actorId: userId,
        newValues: { name: saved.name },
      });
      return saved;
    });
  }

  async updateWorkspaceContact(
    userId: string,
    contactId: string,
    dto: UpdateSupplierWorkspaceContactDto,
  ) {
    const supplierId = await this.supplierIdForUser(userId);
    return this.dataSource.transaction(async (manager) => {
      const contacts = manager.getRepository(SupplierContact);
      const contact = await contacts.findOne({
        where: { id: contactId, supplier: { id: supplierId } },
      });
      if (!contact) throw new NotFoundException('Contact not found');

      if (dto.isPrimary === true) {
        await contacts.update({ supplier: { id: supplierId } }, { isPrimary: false });
        contact.isPrimary = true;
      } else if (dto.isPrimary === false && contact.isPrimary) {
        const alternatives = await contacts.find({
          where: { supplier: { id: supplierId } },
          order: { createdAt: 'ASC' },
        });
        const nextPrimary = alternatives.find((candidate) => candidate.id !== contact.id);
        if (!nextPrimary) {
          throw new BadRequestException('A primary contact is required. Add another contact first.');
        }
        contact.isPrimary = false;
        await contacts.save(contact);
        nextPrimary.isPrimary = true;
        await contacts.save(nextPrimary);
      }

      Object.assign(contact, dto);
      if (dto.isPrimary === true) contact.isPrimary = true;
      const saved = await contacts.save(contact);
      await this.audit.write(manager, {
        action: 'supplier_contact_updated',
        entityType: 'supplier_contact',
        entityId: saved.id,
        actorId: userId,
        newValues: { name: saved.name },
      });
      return saved;
    });
  }

  async removeWorkspaceContact(userId: string, contactId: string) {
    const supplierId = await this.supplierIdForUser(userId);
    return this.dataSource.transaction(async (manager) => {
      const contacts = manager.getRepository(SupplierContact);
      const contact = await contacts.findOne({
        where: { id: contactId, supplier: { id: supplierId } },
      });
      if (!contact) throw new NotFoundException('Contact not found');

      if (contact.isPrimary) {
        const allContacts = await contacts.find({
          where: { supplier: { id: supplierId } },
          order: { createdAt: 'ASC' },
        });
        const nextPrimary = allContacts.find((candidate) => candidate.id !== contact.id);
        if (!nextPrimary) {
          throw new BadRequestException('Add another contact before removing the primary contact.');
        }
        await contacts.remove(contact);
        nextPrimary.isPrimary = true;
        await contacts.save(nextPrimary);
      } else {
        await contacts.remove(contact);
      }
      await this.audit.write(manager, {
        action: 'supplier_contact_removed',
        entityType: 'supplier_contact',
        entityId: contact.id,
        actorId: userId,
        oldValues: { name: contact.name },
      });
      return { deleted: true };
    });
  }

  async workspaceListingsForUser(userId: string) {
    const supplierId = await this.supplierIdForUser(userId);
    return this.dataSource.getRepository(SupplierListing).find({
      where: { supplier: { id: supplierId }, deletedAt: IsNull() },
      order: { createdAt: 'DESC' },
    });
  }

  async createWorkspaceListing(userId: string, dto: SupplierListingDto) {
    const supplierId = await this.supplierIdForUser(userId);
    await this.assertListingPhotosBelongToSupplier(supplierId, dto.photos ?? []);
    if (dto.pricingModel === 'price_on_request' && dto.price != null) {
      throw new BadRequestException('A price cannot be set when pricing is on request.');
    }
    return this.dataSource.transaction(async (manager) => {
      const repo = manager.getRepository(SupplierListing);
      const listing = repo.create({
        ...dto,
        price: dto.price == null ? null : String(dto.price),
        name: dto.name.trim(),
        category: dto.category.trim(),
        description: dto.description.trim(),
        currency: (dto.currency ?? 'NGN').toUpperCase(),
        photos: dto.photos ?? [],
        status: 'draft',
        supplier: { id: supplierId },
      });
      const saved = await repo.save(listing);
      await this.audit.write(manager, {
        action: 'supplier_listing_created',
        entityType: 'supplier_listing',
        entityId: saved.id,
        actorId: userId,
        newValues: { name: saved.name, listingType: saved.listingType, status: saved.status },
      });
      return saved;
    });
  }

  async updateWorkspaceListing(userId: string, listingId: string, dto: UpdateSupplierListingDto) {
    const listing = await this.workspaceListingForUser(userId, listingId);
    if (listing.status === 'deleted') throw new NotFoundException('Listing not found');
    if (dto.photos) await this.assertListingPhotosBelongToSupplier(await this.supplierIdForUser(userId), dto.photos);
    const pricingModel = dto.pricingModel ?? listing.pricingModel;
    const price = dto.price === undefined ? listing.price : dto.price;
    if (pricingModel === 'price_on_request' && price != null) {
      throw new BadRequestException('A price cannot be set when pricing is on request.');
    }
    Object.assign(listing, dto);
    if (dto.name !== undefined) listing.name = dto.name.trim();
    if (dto.category !== undefined) listing.category = dto.category.trim();
    if (dto.description !== undefined) listing.description = dto.description.trim();
    if (dto.currency !== undefined) listing.currency = dto.currency.toUpperCase();
    if (listing.status === 'active') this.validatePublishableListing(listing);
    return this.dataSource.transaction(async (manager) => {
      const saved = await manager.getRepository(SupplierListing).save(listing);
      await this.audit.write(manager, {
        action: 'supplier_listing_updated',
        entityType: 'supplier_listing',
        entityId: saved.id,
        actorId: userId,
        newValues: { name: saved.name, listingType: saved.listingType, status: saved.status },
      });
      return saved;
    });
  }

  async publishWorkspaceListing(userId: string, listingId: string) {
    const listing = await this.workspaceListingForUser(userId, listingId);
    this.validatePublishableListing(listing);
    listing.status = 'active';
    return this.saveWorkspaceListingState(userId, listing, 'supplier_listing_published');
  }

  async unpublishWorkspaceListing(userId: string, listingId: string) {
    const listing = await this.workspaceListingForUser(userId, listingId);
    if (listing.status === 'deleted') throw new NotFoundException('Listing not found');
    listing.status = 'unpublished';
    return this.saveWorkspaceListingState(userId, listing, 'supplier_listing_unpublished');
  }

  async saveWorkspaceListingDraft(userId: string, listingId: string) {
    const listing = await this.workspaceListingForUser(userId, listingId);
    if (listing.status === 'deleted') throw new NotFoundException('Listing not found');
    listing.status = 'draft';
    return this.saveWorkspaceListingState(userId, listing, 'supplier_listing_saved_as_draft');
  }

  async deleteWorkspaceListing(userId: string, listingId: string) {
    const listing = await this.workspaceListingForUser(userId, listingId);
    listing.status = 'deleted';
    listing.deletedAt = new Date();
    await this.saveWorkspaceListingState(userId, listing, 'supplier_listing_deleted');
    return { deleted: true };
  }

  private async workspaceListingForUser(userId: string, listingId: string) {
    const supplierId = await this.supplierIdForUser(userId);
    const listing = await this.dataSource.getRepository(SupplierListing).findOne({
      where: { id: listingId, supplier: { id: supplierId }, deletedAt: IsNull() },
    });
    if (!listing) throw new NotFoundException('Listing not found');
    return listing;
  }

  async uploadWorkspaceListingPhoto(userId: string, file: UploadedCertificate) {
    const supplierId = await this.supplierIdForUser(userId);
    const extension = this.validateListingPhoto(file);
    const storageKey = `${randomUUID()}${extension}`;
    const root = resolve(process.env.SUPPLIER_LISTING_STORAGE_DIR ?? join(process.cwd(), 'private', 'supplier-listing-photos'));
    await mkdir(root, { recursive: true, mode: 0o700 });
    const filePath = join(root, storageKey);
    await writeFile(filePath, file.buffer, { flag: 'wx', mode: 0o600 });
    try {
      const photo = await this.dataSource.getRepository(SupplierListingPhoto).save(
        this.dataSource.getRepository(SupplierListingPhoto).create({
          supplier: { id: supplierId },
          storageKey,
          contentType: file.mimetype,
          fileHash: createHash('sha256').update(file.buffer).digest('hex'),
        }),
      );
      return { id: photo.id, photoUrl: `/api/supplier-workspace/listing-photos/${photo.id}` };
    } catch (error) {
      await rm(filePath, { force: true }).catch(() => undefined);
      throw error;
    }
  }

  async workspaceListingPhotoForUser(userId: string, photoId: string) {
    const supplierId = await this.supplierIdForUser(userId);
    const photo = await this.dataSource.getRepository(SupplierListingPhoto).findOne({
      where: { id: photoId, supplier: { id: supplierId } },
    });
    if (!photo) throw new NotFoundException('Photo not found');
    const root = resolve(process.env.SUPPLIER_LISTING_STORAGE_DIR ?? join(process.cwd(), 'private', 'supplier-listing-photos'));
    const filePath = resolve(root, basename(photo.storageKey));
    if (!filePath.startsWith(`${root}${sep}`)) throw new BadRequestException('Invalid photo storage location.');
    let buffer: Buffer;
    try { buffer = await readFile(filePath); }
    catch { throw new NotFoundException('Photo file not found'); }
    if (createHash('sha256').update(buffer).digest('hex') !== photo.fileHash.trim()) {
      throw new BadRequestException('Photo file fingerprint does not match its upload record.');
    }
    return { buffer, contentType: photo.contentType };
  }

  private async assertListingPhotosBelongToSupplier(supplierId: string, photoIds: string[]) {
    if (!photoIds.length) return;
    const count = await this.dataSource.getRepository(SupplierListingPhoto).count({
      where: { id: In(photoIds), supplier: { id: supplierId } },
    });
    if (count !== photoIds.length) throw new BadRequestException('One or more photos are unavailable.');
  }

  private validateListingPhoto(file: UploadedCertificate): string {
    if (!file?.buffer?.length || file.size > 5 * 1024 * 1024) {
      throw new BadRequestException('Choose a JPG, PNG or WEBP photo up to 5 MB.');
    }
    const extension = extname(basename(file.originalname)).toLowerCase();
    const signatures: Record<string, { mime: string; valid: boolean }> = {
      '.jpg': { mime: 'image/jpeg', valid: file.buffer[0] === 0xff && file.buffer[1] === 0xd8 && file.buffer[2] === 0xff },
      '.jpeg': { mime: 'image/jpeg', valid: file.buffer[0] === 0xff && file.buffer[1] === 0xd8 && file.buffer[2] === 0xff },
      '.png': { mime: 'image/png', valid: file.buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) },
      '.webp': { mime: 'image/webp', valid: file.buffer.subarray(0, 4).toString('ascii') === 'RIFF' && file.buffer.subarray(8, 12).toString('ascii') === 'WEBP' },
    };
    const match = signatures[extension];
    if (!match || !match.valid || file.mimetype !== match.mime) {
      throw new BadRequestException('Photo contents must be a valid JPG, PNG or WEBP image.');
    }
    return extension;
  }

  private validateListingPrice(pricingModel: string, price?: number) {
    if (pricingModel === 'fixed' && price == null) {
      throw new BadRequestException('Enter a price or choose price on request.');
    }
    if (pricingModel === 'price_on_request' && price != null) {
      throw new BadRequestException('A price cannot be set when pricing is on request.');
    }
  }

  private validatePublishableListing(listing: SupplierListing) {
    if (!listing.name.trim() || !listing.category.trim() || !listing.description.trim()) {
      throw new BadRequestException('Name, category and description are required before publishing.');
    }
    this.validateListingPrice(listing.pricingModel, listing.price == null ? undefined : Number(listing.price));
    if (listing.listingType === 'product' && !listing.unit?.trim()) {
      throw new BadRequestException('Select a unit before publishing this product.');
    }
    if (listing.listingType === 'service' && !listing.serviceArea?.trim()) {
      throw new BadRequestException('Enter a service area before publishing this service.');
    }
  }

  private async saveWorkspaceListingState(userId: string, listing: SupplierListing, action: string) {
    return this.dataSource.transaction(async (manager) => {
      const saved = await manager.getRepository(SupplierListing).save(listing);
      await this.audit.write(manager, {
        action,
        entityType: 'supplier_listing',
        entityId: saved.id,
        actorId: userId,
        newValues: { name: saved.name, status: saved.status },
      });
      return saved;
    });
  }

  private async supplierIdForUser(userId: string): Promise<string> {
    const rows = (await this.dataSource.query(
      'SELECT supplier_id FROM vendor.supplier_accounts WHERE user_id = $1 LIMIT 1',
      [userId],
    )) as Array<{ supplier_id: string }>;
    if (!rows.length) throw new NotFoundException('Supplier account not found');
    return rows[0].supplier_id;
  }
}
