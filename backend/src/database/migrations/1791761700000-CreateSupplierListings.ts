import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSupplierListings1791761700000 implements MigrationInterface {
  name = 'CreateSupplierListings1791761700000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE vendor.supplier_listings (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        supplier_id uuid NOT NULL REFERENCES vendor.suppliers(id) ON DELETE CASCADE,
        listing_type varchar(20) NOT NULL CHECK (listing_type IN ('product', 'service')),
        name varchar(255) NOT NULL,
        category varchar(150) NOT NULL,
        description text NOT NULL,
        pricing_model varchar(30) NOT NULL DEFAULT 'fixed' CHECK (pricing_model IN ('fixed', 'price_on_request')),
        price numeric(14,2),
        currency char(3) NOT NULL DEFAULT 'NGN',
        unit varchar(80),
        specifications text,
        dimensions varchar(255),
        service_area varchar(255),
        photos jsonb NOT NULL DEFAULT '[]'::jsonb,
        status varchar(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'unpublished', 'deleted')),
        deleted_at timestamptz,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT supplier_listing_price_check CHECK (price IS NULL OR price >= 0),
        CONSTRAINT supplier_listing_active_price_check CHECK (status <> 'active' OR pricing_model <> 'fixed' OR price IS NOT NULL),
        CONSTRAINT supplier_listing_service_area_check CHECK (listing_type <> 'service' OR service_area IS NOT NULL OR status IN ('draft', 'deleted'))
      )
    `);
    await queryRunner.query('CREATE INDEX supplier_listings_supplier_status_idx ON vendor.supplier_listings (supplier_id, status)');
    await queryRunner.query("CREATE INDEX supplier_listings_public_lookup_idx ON vendor.supplier_listings (category, listing_type) WHERE status = 'active' AND deleted_at IS NULL");
    await queryRunner.query(`
      CREATE TABLE vendor.supplier_listing_photos (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        supplier_id uuid NOT NULL REFERENCES vendor.suppliers(id) ON DELETE CASCADE,
        storage_key varchar(255) NOT NULL UNIQUE,
        content_type varchar(50) NOT NULL CHECK (content_type IN ('image/jpeg', 'image/png', 'image/webp')),
        file_hash char(64) NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query('CREATE INDEX supplier_listing_photos_supplier_idx ON vendor.supplier_listing_photos (supplier_id)');
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE vendor.supplier_listing_photos');
    await queryRunner.query('DROP TABLE vendor.supplier_listings');
  }
}
