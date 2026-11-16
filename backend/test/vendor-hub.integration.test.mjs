import 'reflect-metadata';
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { embeddedDataSource } from './support/embedded-postgres.mjs';
import { VendorHubService } from '../dist/vendor/providers/vendor-hub.service.js';

let env, hub, companyId, platformOriginCompanyId, reviewerId;

before(async () => {
  env = await embeddedDataSource(await readFile(new URL('./support/database-schema.sql', import.meta.url), 'utf8'), [fileURLToPath(new URL('../dist/**/*.entity.js', import.meta.url))]);
  const [company] = await env.source.query("INSERT INTO organization.companies(name) VALUES ('Hub Buyer Ltd') RETURNING id");
  const [originCompany] = await env.source.query("INSERT INTO organization.companies(name) VALUES ('Supplier Origin Ltd') RETURNING id");
  const [reviewer] = await env.source.query("INSERT INTO iam.users(email,password_hash,first_name,last_name) VALUES ('hub-reviewer@example.test','hash','Hub','Reviewer') RETURNING id");
  companyId = company.id;
  platformOriginCompanyId = originCompany.id;
  reviewerId = reviewer.id;
  hub = new VendorHubService(env.source, { write: async () => undefined });
});

after(async () => { await env?.close(); });

async function supplier(name, caseStatus = 'approved', expires = '2099-01-01T00:00:00Z', addBuyerRelationship = false) {
  const [row] = await env.source.query('INSERT INTO vendor.suppliers(legal_name,trading_name,registration_number,supplier_type,country_code) VALUES ($1,$2,$3,$4,$5) RETURNING id', [name, null, `RC-${name.replaceAll(' ','-')}`, 'Office supplies', 'NG']);
  const [profile] = await env.source.query("INSERT INTO vendor.supplier_company_profiles(supplier_id,company_id,relationship_status,onboarding_status) VALUES ($1,$2,'prospective','completed') RETURNING id", [row.id, platformOriginCompanyId]);
  if (addBuyerRelationship) await env.source.query("INSERT INTO vendor.supplier_company_profiles(supplier_id,company_id,relationship_status,onboarding_status) VALUES ($1,$2,'prospective','completed')", [row.id, companyId]);
  await env.source.query("INSERT INTO vendor.verification_cases(supplier_company_profile_id,case_number,verification_type,status,opened_by,expires_at) VALUES ($1,$2,'initial',$3,$4,$5)", [profile.id, `CASE-${name.replaceAll(' ','-')}`, caseStatus, reviewerId, expires]);
  const [listing] = await env.source.query("INSERT INTO vendor.supplier_listings(supplier_id,listing_type,name,category,description,pricing_model,price,currency,unit,status) VALUES ($1,'product','A4 Copy Paper','Office & Stationery','Multipurpose copy paper.','fixed',4850,'NGN','ream','active') RETURNING id", [row.id]);
  return { supplierId: row.id, profileId: profile.id, listingId: listing.id };
}

test('Vendor Hub shows verified published suppliers and company list preserves expired verification', async () => {
  await supplier('Verified Office Supplies');
  const expired = await supplier('Expired Office Supplies', 'approved', '2000-01-01T00:00:00Z', true);
  await supplier('Pending Office Supplies', 'in_progress');

  const hubResult = await hub.search(companyId, { page: 1, pageSize: 10 });
  assert.deepEqual(hubResult.items.map((item) => item.name), ['Verified Office Supplies']);

  const mySuppliers = await hub.mySuppliers(companyId, { page: 1, pageSize: 10 });
  const expiredRecord = mySuppliers.items.find((item) => item.supplierId === expired.supplierId);
  assert.equal(expiredRecord.platformVerification, 'expired');
  assert.equal(expiredRecord.relationshipStatus, 'prospective');
});

test('adding a verified supplier creates a prospective company relationship and cannot add an expired supplier', async () => {
  const verified = await supplier('Addable Services');
  const expired = await supplier('Expired Services', 'approved', '2000-01-01T00:00:00Z');
  const added = await hub.addSupplier(companyId, verified.supplierId, reviewerId);
  assert.equal(added.relationship_status, 'prospective');
  assert.equal(added.supplier_code, 'SUP-002');
  assert.equal((await hub.addSupplier(companyId, verified.supplierId, reviewerId)).alreadyAdded, true);
  await assert.rejects(hub.addSupplier(companyId, expired.supplierId, reviewerId), /Verified supplier not found/);
  const result = await hub.updateRelationship(companyId, String(added.id), { relationshipStatus: 'active', notes: 'Approved for office purchases.' }, reviewerId);
  assert.equal(result.relationship_status, 'active');
});

test('an OCR-matched supplier with no expiry is globally eligible without a company profile', async () => {
  const [matched] = await env.source.query(
    "INSERT INTO vendor.suppliers(legal_name,registration_number,supplier_type,country_code) VALUES ('OCR Matched Supplier','RC-OCR-MATCH','Office supplies','NG') RETURNING id",
  );
  await env.source.query(
    "INSERT INTO vendor.verification_cases(supplier_id,case_number,verification_type,decision_source,status,opened_by,expires_at) VALUES ($1,'CASE-OCR-MATCH','initial','ocr_match','approved',$2,NULL)",
    [matched.id, reviewerId],
  );
  await env.source.query(
    "INSERT INTO vendor.supplier_listings(supplier_id,listing_type,name,category,description,pricing_model,price,currency,unit,status) VALUES ($1,'product','Paper','Office & Stationery','Paper products.','fixed',100,'NGN','ream','active')",
    [matched.id],
  );

  const [uncertain] = await env.source.query(
    "INSERT INTO vendor.suppliers(legal_name,registration_number,supplier_type,country_code) VALUES ('OCR Review Supplier','RC-OCR-REVIEW','Office supplies','NG') RETURNING id",
  );
  await env.source.query(
    "INSERT INTO vendor.verification_cases(supplier_id,case_number,verification_type,decision_source,status,opened_by,expires_at) VALUES ($1,'CASE-OCR-REVIEW','initial','ocr_review','open',$2,NULL)",
    [uncertain.id, reviewerId],
  );
  await env.source.query(
    "INSERT INTO vendor.supplier_listings(supplier_id,listing_type,name,category,description,pricing_model,price,currency,unit,status) VALUES ($1,'product','Paper','Office & Stationery','Paper products.','fixed',100,'NGN','ream','active')",
    [uncertain.id],
  );

  const result = await hub.search(companyId, { page: 1, pageSize: 10 });
  assert.ok(result.items.some((item) => item.id === matched.id));
  assert.ok(!result.items.some((item) => item.id === uncertain.id));
});
