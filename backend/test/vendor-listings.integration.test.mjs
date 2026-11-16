import 'reflect-metadata';
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { embeddedDataSource } from './support/embedded-postgres.mjs';
import { Supplier } from '../dist/vendor/entities/supplier.entity.js';
import { SupplierContact } from '../dist/vendor/entities/supplier-contact.entity.js';
import { SupplierDocument } from '../dist/vendor/entities/supplier-document.entity.js';
import { SupplierCompanyProfile } from '../dist/vendor/entities/supplier-company-profile.entity.js';
import { SuppliersService } from '../dist/vendor/providers/suppliers.service.js';
import { AuditWriterService } from '../dist/audit/providers/audit-writer.service.js';
import { AddOrganizationRegistration1791759600000 } from '../dist/database/migrations/1791759600000-AddOrganizationRegistration.js';

let env, service, supplierId, userId, storagePath, previousStoragePath;

before(async () => {
  env = await embeddedDataSource(
    await readFile(new URL('./support/database-schema.sql', import.meta.url), 'utf8'),
    [fileURLToPath(new URL('../dist/**/*.entity.js', import.meta.url))],
  );
  await new AddOrganizationRegistration1791759600000().up(env.source.createQueryRunner());
  previousStoragePath = process.env.SUPPLIER_LISTING_STORAGE_DIR;
  storagePath = await mkdtemp(join(tmpdir(), 'impressor-listing-photos-'));
  process.env.SUPPLIER_LISTING_STORAGE_DIR = storagePath;
  const [supplier] = await env.source.query("INSERT INTO vendor.suppliers(legal_name) VALUES ('Listing Test Supplies Ltd') RETURNING id");
  const [user] = await env.source.query("INSERT INTO iam.users(email,password_hash,first_name,last_name) VALUES ('listing-owner@example.test','hash','Listing','Owner') RETURNING id");
  supplierId = supplier.id;
  userId = user.id;
  await env.source.query('INSERT INTO vendor.supplier_accounts(supplier_id,user_id) VALUES ($1,$2)', [supplierId, userId]);
  service = new SuppliersService(
    env.source.getRepository(Supplier),
    env.source.getRepository(SupplierCompanyProfile),
    env.source.getRepository(SupplierContact),
    env.source.getRepository(SupplierDocument),
    env.source,
    new AuditWriterService(),
  );
});

after(async () => {
  await env?.close();
  if (previousStoragePath === undefined) delete process.env.SUPPLIER_LISTING_STORAGE_DIR;
  else process.env.SUPPLIER_LISTING_STORAGE_DIR = previousStoragePath;
  if (storagePath) await rm(storagePath, { recursive: true, force: true });
});

test('supplier can save, publish, unpublish, republish and delete its own listing', async () => {
  const created = await service.createWorkspaceListing(userId, {
    listingType: 'product', name: 'A4 Copy Paper', category: 'Office & Stationery',
    description: 'Multipurpose 80 gsm copy paper.', pricingModel: 'fixed',
    currency: 'NGN', photos: [],
  });
  assert.equal(created.status, 'draft');
  assert.equal(created.price, null);
  await assert.rejects(service.publishWorkspaceListing(userId, created.id), /Enter a price/);

  const updated = await service.updateWorkspaceListing(userId, created.id, {
    price: 4850, unit: 'ream', specifications: '80 gsm; 500 sheets',
  });
  assert.equal(Number(updated.price), 4850);
  const published = await service.publishWorkspaceListing(userId, created.id);
  assert.equal(published.status, 'active');
  assert.equal((await service.workspaceListingsForUser(userId)).length, 1);

  assert.equal((await service.unpublishWorkspaceListing(userId, created.id)).status, 'unpublished');
  assert.equal((await service.publishWorkspaceListing(userId, created.id)).status, 'active');
  assert.deepEqual(await service.deleteWorkspaceListing(userId, created.id), { deleted: true });
  assert.equal((await service.workspaceListingsForUser(userId)).length, 0);
  await assert.rejects(service.updateWorkspaceListing(userId, created.id, { name: 'Edited' }), /Listing not found/);
});

test('supplier cannot edit another supplier listing', async () => {
  const created = await service.createWorkspaceListing(userId, {
    listingType: 'service', name: 'Office Cleaning', category: 'Cleaning & Facilities Services',
    description: 'Cleaning visits for business offices.', pricingModel: 'price_on_request',
    currency: 'NGN', serviceArea: 'Eket, Akwa Ibom State', photos: [],
  });
  const [otherSupplier] = await env.source.query("INSERT INTO vendor.suppliers(legal_name) VALUES ('Other Supplier Ltd') RETURNING id");
  const [otherUser] = await env.source.query("INSERT INTO iam.users(email,password_hash,first_name,last_name) VALUES ('other-listing-owner@example.test','hash','Other','Owner') RETURNING id");
  await env.source.query('INSERT INTO vendor.supplier_accounts(supplier_id,user_id) VALUES ($1,$2)', [otherSupplier.id, otherUser.id]);
  await assert.rejects(service.updateWorkspaceListing(otherUser.id, created.id, { name: 'Hijacked' }), /Listing not found/);
});

test('supplier photo uploads are private, validated and can be attached to a listing', async () => {
  const photo = await service.uploadWorkspaceListingPhoto(userId, {
    buffer: Buffer.from([0xff, 0xd8, 0xff, 0x00]), originalname: 'product.jpg', mimetype: 'image/jpeg', size: 4,
  });
  const image = await service.workspaceListingPhotoForUser(userId, photo.id);
  assert.equal(image.contentType, 'image/jpeg');
  assert.deepEqual(image.buffer, Buffer.from([0xff, 0xd8, 0xff, 0x00]));
  await assert.rejects(service.uploadWorkspaceListingPhoto(userId, {
    buffer: Buffer.from('not an image'), originalname: 'product.jpg', mimetype: 'image/jpeg', size: 13,
  }), /valid JPG, PNG or WEBP/);

  const listing = await service.createWorkspaceListing(userId, {
    listingType: 'product', name: 'A4 Paper', category: 'Office & Stationery', description: 'Copy paper.',
    pricingModel: 'fixed', price: 4850, currency: 'NGN', unit: 'ream', photos: [photo.id],
  });
  assert.deepEqual(listing.photos, [photo.id]);
});
