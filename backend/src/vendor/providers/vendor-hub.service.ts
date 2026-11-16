import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { basename, join, resolve, sep } from 'node:path';
import { DataSource } from 'typeorm';
import { AuditWriterService } from '../../audit/providers/audit-writer.service.js';

type HubFilters = { search?: string; category?: string; location?: string; page?: number; pageSize?: number };

@Injectable()
export class VendorHubService {
  constructor(private readonly db: DataSource, private readonly audit: AuditWriterService) {}

  async search(companyId: string, filters: HubFilters) {
    const page = Math.max(1, Math.floor(filters.page ?? 1));
    const pageSize = Math.min(50, Math.max(1, Math.floor(filters.pageSize ?? 10)));
    const search = filters.search?.trim() || null;
    const category = filters.category?.trim() || null;
    const location = filters.location?.trim() || null;
    const rows = await this.db.query(
      `WITH latest_verification AS (
         SELECT DISTINCT ON (COALESCE(c.supplier_id, p.supplier_id)) COALESCE(c.supplier_id, p.supplier_id) AS supplier_id, c.status, c.expires_at
         FROM vendor.verification_cases c
         LEFT JOIN vendor.supplier_company_profiles p ON p.id = c.supplier_company_profile_id
         WHERE COALESCE(c.supplier_id, p.supplier_id) IS NOT NULL
         ORDER BY COALESCE(c.supplier_id, p.supplier_id), c.opened_at DESC, c.id DESC
       ), eligible AS (
         SELECT s.id, COALESCE(NULLIF(s.trading_name, ''), s.legal_name) AS name,
                s.legal_name, s.registration_number, s.supplier_type, s.country_code,
                v.expires_at AS verification_expires_at
         FROM vendor.suppliers s
         JOIN latest_verification v ON v.supplier_id = s.id
         WHERE s.status = 'active' AND v.status = 'approved' AND (v.expires_at IS NULL OR v.expires_at > NOW())
           AND EXISTS (SELECT 1 FROM vendor.supplier_listings l WHERE l.supplier_id = s.id AND l.status = 'active' AND l.deleted_at IS NULL)
       )
       SELECT e.*, count(*) OVER()::int AS total_count
       FROM eligible e
       WHERE ($1::text IS NULL OR e.name ILIKE '%' || $1 || '%' OR e.registration_number ILIKE '%' || $1 || '%' OR e.supplier_type ILIKE '%' || $1 || '%'
         OR EXISTS (SELECT 1 FROM vendor.supplier_listings l WHERE l.supplier_id=e.id AND l.status='active' AND l.deleted_at IS NULL AND (l.name ILIKE '%' || $1 || '%' OR l.category ILIKE '%' || $1 || '%')))
         AND ($2::text IS NULL OR EXISTS (SELECT 1 FROM vendor.supplier_listings l WHERE l.supplier_id=e.id AND l.status='active' AND l.deleted_at IS NULL AND l.category ILIKE '%' || $2 || '%'))
         AND ($3::text IS NULL OR e.country_code ILIKE '%' || $3 || '%' OR EXISTS (SELECT 1 FROM vendor.supplier_listings l WHERE l.supplier_id=e.id AND l.status='active' AND l.deleted_at IS NULL AND l.service_area ILIKE '%' || $3 || '%'))
         AND NOT EXISTS (SELECT 1 FROM vendor.supplier_company_profiles rel WHERE rel.supplier_id=e.id AND rel.company_id=$6)
       ORDER BY e.name ASC, e.id ASC
       LIMIT $4 OFFSET $5`,
      [search, category, location, pageSize, (page - 1) * pageSize, companyId],
    ) as Array<Record<string, unknown>>;
    const ids = rows.map((row) => String(row.id));
    const offers = ids.length ? await this.db.query(
      `SELECT supplier_id, id, listing_type, name, category, description, pricing_model, price, currency, unit, specifications, dimensions, service_area, photos
       FROM vendor.supplier_listings WHERE supplier_id = ANY($1::uuid[]) AND status='active' AND deleted_at IS NULL
       ORDER BY supplier_id, created_at DESC`, [ids],
    ) as Array<Record<string, unknown>> : [];
    const offersBySupplier = new Map<string, Array<Record<string, unknown>>>();
    for (const offer of offers) {
      const key = String(offer.supplier_id);
      const list = offersBySupplier.get(key) ?? [];
      if (list.length < 2) list.push(this.publicListing(offer));
      offersBySupplier.set(key, list);
    }
    const total = rows.length ? Number(rows[0].total_count) : 0;
    return {
      items: rows.map((row) => ({
        id: row.id,
        name: row.name,
        legalName: row.legal_name,
        registrationNumber: row.registration_number,
        supplierType: row.supplier_type,
        countryCode: row.country_code,
        verificationStatus: 'verified',
        verificationExpiresAt: row.verification_expires_at,
        offerings: offersBySupplier.get(String(row.id)) ?? [],
      })),
      total,
      page,
      pageSize,
    };
  }

  async supplierDetails(companyId: string, supplierId: string) {
    const rows = await this.eligibleSupplier(supplierId);
    if (!rows.length) throw new NotFoundException('Verified supplier not found');
    const offers = await this.db.query(
      `SELECT id, listing_type, name, category, description, pricing_model, price, currency, unit, specifications, dimensions, service_area, photos, created_at
       FROM vendor.supplier_listings WHERE supplier_id=$1 AND status='active' AND deleted_at IS NULL ORDER BY created_at DESC`, [supplierId],
    ) as Array<Record<string, unknown>>;
    const [relationship] = await this.db.query(
      'SELECT id, supplier_code, relationship_status, notes FROM vendor.supplier_company_profiles WHERE supplier_id=$1 AND company_id=$2',
      [supplierId, companyId],
    ) as Array<Record<string, unknown>>;
    return {
      supplier: {
        id: rows[0].id,
        name: rows[0].name,
        legalName: rows[0].legal_name,
        registrationNumber: rows[0].registration_number,
        supplierType: rows[0].supplier_type,
        countryCode: rows[0].country_code,
        verificationStatus: 'verified',
        verificationExpiresAt: rows[0].verification_expires_at,
      },
      relationship: relationship ?? null,
      offerings: offers.map((offer) => this.publicListing(offer)),
    };
  }

  async mySuppliers(companyId: string, filters: HubFilters) {
    const page = Math.max(1, Math.floor(filters.page ?? 1));
    const pageSize = Math.min(50, Math.max(1, Math.floor(filters.pageSize ?? 10)));
    const search = filters.search?.trim() || null;
    const relationship = filters.category?.trim() || null;
    const rows = await this.db.query(
      `WITH latest_verification AS (
         SELECT DISTINCT ON (COALESCE(c.supplier_id, p.supplier_id)) COALESCE(c.supplier_id, p.supplier_id) AS supplier_id, c.status, c.expires_at
         FROM vendor.verification_cases c LEFT JOIN vendor.supplier_company_profiles p ON p.id=c.supplier_company_profile_id
         WHERE COALESCE(c.supplier_id, p.supplier_id) IS NOT NULL
         ORDER BY COALESCE(c.supplier_id, p.supplier_id), c.opened_at DESC, c.id DESC
       )
       SELECT p.id AS profile_id, p.supplier_id, p.supplier_code, p.relationship_status, p.onboarding_status, p.notes,
              s.legal_name, s.trading_name, s.registration_number, s.supplier_type, s.country_code,
              CASE WHEN v.status='approved' AND (v.expires_at IS NULL OR v.expires_at>NOW()) AND s.status='active'
                   THEN 'verified' WHEN v.status='approved' AND v.expires_at<=NOW() THEN 'expired' ELSE 'unverified' END AS platform_verification,
              v.expires_at AS verification_expires_at,
              count(*) OVER()::int AS total_count
       FROM vendor.supplier_company_profiles p
       JOIN vendor.suppliers s ON s.id=p.supplier_id
       LEFT JOIN latest_verification v ON v.supplier_id=s.id
       WHERE p.company_id=$1 AND ($2::text IS NULL OR COALESCE(NULLIF(s.trading_name,''),s.legal_name) ILIKE '%'||$2||'%' OR p.supplier_code ILIKE '%'||$2||'%')
         AND ($3::text IS NULL OR p.relationship_status=$3)
       ORDER BY COALESCE(NULLIF(s.trading_name,''),s.legal_name) ASC, p.id ASC
       LIMIT $4 OFFSET $5`,
      [companyId, search, relationship, pageSize, (page - 1) * pageSize],
    ) as Array<Record<string, unknown>>;
    return {
      items: rows.map((row) => ({
        profileId: row.profile_id, supplierId: row.supplier_id, supplierCode: row.supplier_code,
        name: row.trading_name || row.legal_name, legalName: row.legal_name,
        registrationNumber: row.registration_number, supplierType: row.supplier_type,
        countryCode: row.country_code, platformVerification: row.platform_verification,
        verificationExpiresAt: row.verification_expires_at, relationshipStatus: row.relationship_status,
        onboardingStatus: row.onboarding_status, notes: row.notes,
      })),
      total: rows.length ? Number(rows[0].total_count) : 0, page, pageSize,
    };
  }

  async addSupplier(companyId: string, supplierId: string, userId: string) {
    await this.requireEligibleSupplier(supplierId);
    return this.db.transaction(async (manager) => {
      await manager.query('SELECT pg_advisory_xact_lock(hashtext($1))', [companyId]);
      const existing = await manager.query(
        'SELECT id, supplier_code, relationship_status, notes FROM vendor.supplier_company_profiles WHERE company_id=$1 AND supplier_id=$2',
        [companyId, supplierId],
      ) as Array<Record<string, unknown>>;
      if (existing.length) return { ...existing[0], alreadyAdded: true };
      const countRows = await manager.query('SELECT count(*)::int AS count FROM vendor.supplier_company_profiles WHERE company_id=$1', [companyId]) as Array<{ count: number }>;
      const supplierCode = `SUP-${String(Number(countRows[0].count) + 1).padStart(3, '0')}`;
      const created = await manager.query(
        `INSERT INTO vendor.supplier_company_profiles (supplier_id,company_id,supplier_code,relationship_status,onboarding_status)
         VALUES ($1,$2,$3,'prospective','pending') RETURNING id,supplier_code,relationship_status,notes`,
        [supplierId, companyId, supplierCode],
      ) as Array<Record<string, unknown>>;
      await this.audit.write(manager, {
        action: 'supplier_added_to_company', entityType: 'supplier_company_profile', entityId: String(created[0].id),
        companyId, actorId: userId, newValues: { supplierId, supplierCode, relationshipStatus: 'prospective' },
      });
      return { ...created[0], alreadyAdded: false };
    });
  }

  async updateRelationship(companyId: string, profileId: string, changes: { supplierCode?: string; relationshipStatus?: string; notes?: string }, userId: string) {
    const rows = await this.db.query('SELECT id FROM vendor.supplier_company_profiles WHERE id=$1 AND company_id=$2', [profileId, companyId]);
    if (!rows.length) throw new NotFoundException('Supplier relationship not found');
    const sets: string[] = [];
    const values: unknown[] = [profileId, companyId];
    const fields: Array<[keyof typeof changes, string]> = [['supplierCode', 'supplier_code'], ['relationshipStatus', 'relationship_status'], ['notes', 'notes']];
    for (const [key, column] of fields) {
      if (changes[key] !== undefined) { values.push(changes[key]); sets.push(`${column}=$${values.length}`); }
    }
    if (!sets.length) throw new BadRequestException('Provide a supplier relationship change.');
    const updated = await this.db.transaction(async (manager) => {
      const result = await manager.query(`UPDATE vendor.supplier_company_profiles SET ${sets.join(', ')}, updated_at=NOW() WHERE id=$1 AND company_id=$2 RETURNING id,supplier_code,relationship_status,notes`, values) as Array<Record<string, unknown>>;
      await this.audit.write(manager, {
        action: 'supplier_relationship_updated', entityType: 'supplier_company_profile', entityId: profileId,
        companyId, actorId: userId, newValues: changes,
      });
      return result[0];
    });
    return updated[0];
  }

  async companyListingPhoto(_companyId: string, photoId: string) {
    const rows = await this.db.query(
      `SELECT p.storage_key,p.content_type,p.file_hash
       FROM vendor.supplier_listing_photos p
       JOIN vendor.supplier_listings l ON l.supplier_id=p.supplier_id AND l.photos @> jsonb_build_array(p.id::text)
       WHERE p.id=$1 AND l.status='active' AND l.deleted_at IS NULL
         AND EXISTS (
           SELECT 1 FROM vendor.suppliers s WHERE s.id=l.supplier_id AND s.status='active'
             AND (SELECT c.status FROM vendor.verification_cases c LEFT JOIN vendor.supplier_company_profiles vp ON vp.id=c.supplier_company_profile_id WHERE COALESCE(c.supplier_id,vp.supplier_id)=s.id ORDER BY c.opened_at DESC,c.id DESC LIMIT 1)='approved'
             AND ((SELECT c.expires_at FROM vendor.verification_cases c LEFT JOIN vendor.supplier_company_profiles vp ON vp.id=c.supplier_company_profile_id WHERE COALESCE(c.supplier_id,vp.supplier_id)=s.id ORDER BY c.opened_at DESC,c.id DESC LIMIT 1) IS NULL OR (SELECT c.expires_at FROM vendor.verification_cases c LEFT JOIN vendor.supplier_company_profiles vp ON vp.id=c.supplier_company_profile_id WHERE COALESCE(c.supplier_id,vp.supplier_id)=s.id ORDER BY c.opened_at DESC,c.id DESC LIMIT 1)>NOW())
         ) LIMIT 1`, [photoId],
    ) as Array<{ storage_key: string; content_type: string; file_hash: string }>;
    if (!rows.length) throw new NotFoundException('Published supplier photo not found');
    const root = resolve(process.env.SUPPLIER_LISTING_STORAGE_DIR ?? join(process.cwd(), 'private', 'supplier-listing-photos'));
    const filePath = resolve(root, basename(rows[0].storage_key));
    if (!filePath.startsWith(`${root}${sep}`)) throw new BadRequestException('Invalid photo storage location.');
    const buffer = await readFile(filePath);
    if (createHash('sha256').update(buffer).digest('hex') !== rows[0].file_hash.trim()) throw new ConflictException('Photo fingerprint validation failed.');
    return { buffer, contentType: rows[0].content_type };
  }

  private async eligibleSupplier(supplierId: string) {
    return this.db.query(
      `SELECT s.id, COALESCE(NULLIF(s.trading_name,''),s.legal_name) AS name, s.legal_name, s.registration_number, s.supplier_type, s.country_code, v.expires_at AS verification_expires_at
       FROM vendor.suppliers s JOIN LATERAL (
         SELECT c.status,c.expires_at FROM vendor.verification_cases c LEFT JOIN vendor.supplier_company_profiles p ON p.id=c.supplier_company_profile_id
         WHERE COALESCE(c.supplier_id,p.supplier_id)=s.id ORDER BY c.opened_at DESC,c.id DESC LIMIT 1
       ) v ON true
       WHERE s.id=$1 AND s.status='active' AND v.status='approved' AND (v.expires_at IS NULL OR v.expires_at>NOW())
         AND EXISTS (SELECT 1 FROM vendor.supplier_listings l WHERE l.supplier_id=s.id AND l.status='active' AND l.deleted_at IS NULL)`, [supplierId],
    ) as Promise<Array<Record<string, unknown>>>;
  }

  private async requireEligibleSupplier(supplierId: string) {
    if (!(await this.eligibleSupplier(supplierId)).length) throw new NotFoundException('Verified supplier not found');
  }

  private publicListing(row: Record<string, unknown>) {
    return {
      id: row.id, listingType: row.listing_type, name: row.name, category: row.category,
      description: row.description, pricingModel: row.pricing_model, price: row.price,
      currency: row.currency, unit: row.unit, specifications: row.specifications,
      dimensions: row.dimensions, serviceArea: row.service_area,
      photos: Array.isArray(row.photos) ? row.photos : [],
    };
  }
}
