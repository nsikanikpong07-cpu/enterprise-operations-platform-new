BEGIN;
 
CREATE EXTENSION IF NOT EXISTS pgcrypto;
 
CREATE SCHEMA IF NOT EXISTS organization;
CREATE SCHEMA IF NOT EXISTS iam;
CREATE SCHEMA IF NOT EXISTS catalog;
CREATE SCHEMA IF NOT EXISTS vendor;
CREATE SCHEMA IF NOT EXISTS audit;
CREATE SCHEMA IF NOT EXISTS procurement;
 
 
-- ============================================================
-- ORGANIZATION
-- ============================================================
 
CREATE TABLE organization.companies (
  id                         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name                       varchar(255) NOT NULL,
  legal_name                 varchar(255),
  registration_number        varchar(100),
  tax_identification_number  varchar(100),
  industry                   varchar(100),
  country_code               char(2) NOT NULL DEFAULT 'NG',
  default_currency           char(3) NOT NULL DEFAULT 'NGN',
  timezone                   varchar(100) NOT NULL DEFAULT 'Africa/Lagos',
  status                     varchar(30) NOT NULL DEFAULT 'active',
  created_at                 timestamptz NOT NULL DEFAULT now(),
  updated_at                 timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chk_companies_status CHECK (status IN ('active', 'suspended', 'inactive'))
);
 
CREATE INDEX idx_companies_status ON organization.companies (status);
 
 
-- departments created WITHOUT the manager_company_user_id FK for now
-- (iam.company_users doesn't exist yet -> circular dependency)
CREATE TABLE organization.departments (
  id                        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id                uuid NOT NULL REFERENCES organization.companies (id),
  name                      varchar(150) NOT NULL,
  code                      varchar(50),
  manager_company_user_id   uuid,
  created_at                timestamptz NOT NULL DEFAULT now(),
  updated_at                timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_departments_company_name UNIQUE (company_id, name),
  CONSTRAINT uq_departments_company_code UNIQUE (company_id, code)
);
 
 
-- ============================================================
-- IAM
-- ============================================================
 
CREATE TABLE iam.users (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email          varchar(255) NOT NULL UNIQUE,
  password_hash  text NOT NULL,
  first_name     varchar(100) NOT NULL,
  last_name      varchar(100) NOT NULL,
  phone          varchar(50),
  status         varchar(30) NOT NULL DEFAULT 'active',
  last_login_at  timestamptz,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chk_users_status CHECK (status IN ('active', 'suspended', 'inactive'))
);
 
CREATE TABLE iam.company_users (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id       uuid NOT NULL REFERENCES organization.companies (id),
  user_id          uuid NOT NULL REFERENCES iam.users (id),
  department_id    uuid REFERENCES organization.departments (id),
  employee_number  varchar(100),
  job_title        varchar(150),
  status           varchar(30) NOT NULL DEFAULT 'active',
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_company_users_company_user UNIQUE (company_id, user_id),
  CONSTRAINT uq_company_users_employee_number UNIQUE (company_id, employee_number),
  CONSTRAINT chk_company_users_status CHECK (status IN ('active', 'suspended', 'inactive'))
);
 
-- Now that iam.company_users exists, wire up the circular FK on departments
ALTER TABLE organization.departments
  ADD CONSTRAINT fk_departments_manager
  FOREIGN KEY (manager_company_user_id) REFERENCES iam.company_users (id);
 
CREATE TABLE organization.locations (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id   uuid NOT NULL REFERENCES organization.companies (id),
  name         varchar(150) NOT NULL,
  code         varchar(50) NOT NULL,
  type         varchar(50) NOT NULL DEFAULT 'office',
  address      text,
  city         varchar(100),
  state        varchar(100),
  country_code char(2),
  is_active    boolean NOT NULL DEFAULT true,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_locations_company_code UNIQUE (company_id, code),
  CONSTRAINT chk_locations_type CHECK (type IN ('office', 'warehouse', 'branch', 'site', 'factory', 'other'))
);
 
CREATE TABLE iam.roles (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        varchar(100) NOT NULL UNIQUE,
  description text,
  created_at  timestamptz NOT NULL DEFAULT now()
);
 
CREATE TABLE iam.permissions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        varchar(150) NOT NULL UNIQUE,
  description text,
  created_at  timestamptz NOT NULL DEFAULT now()
);
 
CREATE TABLE iam.user_roles (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_user_id  uuid NOT NULL REFERENCES iam.company_users (id) ON DELETE CASCADE,
  role_id          uuid NOT NULL REFERENCES iam.roles (id) ON DELETE CASCADE,
  created_at       timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_user_roles_user_role UNIQUE (company_user_id, role_id)
);
 
CREATE TABLE iam.role_permissions (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id        uuid NOT NULL REFERENCES iam.roles (id) ON DELETE CASCADE,
  permission_id  uuid NOT NULL REFERENCES iam.permissions (id) ON DELETE CASCADE,
  created_at     timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_role_permissions_role_permission UNIQUE (role_id, permission_id)
);
 
 
-- ============================================================
-- CATALOG
-- ============================================================
 
CREATE TABLE catalog.units_of_measure (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code       varchar(20) NOT NULL UNIQUE,
  name       varchar(100) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
 
CREATE TABLE catalog.item_categories (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id  uuid NOT NULL REFERENCES organization.companies (id),
  parent_id   uuid REFERENCES catalog.item_categories (id),
  name        varchar(150) NOT NULL,
  description text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_item_categories_company_name UNIQUE (company_id, name)
);
 
CREATE TABLE catalog.items (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id          uuid NOT NULL REFERENCES organization.companies (id),
  category_id         uuid REFERENCES catalog.item_categories (id),
  unit_of_measure_id  uuid NOT NULL REFERENCES catalog.units_of_measure (id),
  sku                 varchar(100),
  name                varchar(255) NOT NULL,
  description         text,
  item_type           varchar(30) NOT NULL DEFAULT 'material',
  is_stockable        boolean NOT NULL DEFAULT true,
  is_active           boolean NOT NULL DEFAULT true,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_items_company_sku UNIQUE (company_id, sku),
  CONSTRAINT chk_items_item_type CHECK (item_type IN ('material', 'service', 'asset'))
);
 
 
-- ============================================================
-- VENDOR
-- ============================================================
 
CREATE TABLE vendor.suppliers (
  id                         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  legal_name                 varchar(255) NOT NULL,
  trading_name                varchar(255),
  registration_number        varchar(100),
  tax_identification_number  varchar(100),
  supplier_type              varchar(50),
  country_code               char(2),
  status                     varchar(30) NOT NULL DEFAULT 'active',
  created_at                 timestamptz NOT NULL DEFAULT now(),
  updated_at                 timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chk_suppliers_status CHECK (status IN ('active', 'inactive', 'suspended'))
);
 
CREATE TABLE vendor.supplier_company_profiles (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id           uuid NOT NULL REFERENCES vendor.suppliers (id),
  company_id            uuid NOT NULL REFERENCES organization.companies (id),
  supplier_code         varchar(100),
  relationship_status   varchar(30) NOT NULL DEFAULT 'prospective',
  onboarding_status     varchar(30) NOT NULL DEFAULT 'pending',
  notes                 text,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_supplier_company_profiles_supplier_company UNIQUE (supplier_id, company_id),
  CONSTRAINT uq_supplier_company_profiles_company_code UNIQUE (company_id, supplier_code),
  CONSTRAINT chk_supplier_company_profiles_relationship_status
    CHECK (relationship_status IN ('prospective', 'active', 'suspended', 'blocked', 'inactive')),
  CONSTRAINT chk_supplier_company_profiles_onboarding_status
    CHECK (onboarding_status IN ('pending', 'in_progress', 'completed', 'rejected'))
);
 
CREATE TABLE vendor.supplier_contacts (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id uuid NOT NULL REFERENCES vendor.suppliers (id) ON DELETE CASCADE,
  name        varchar(200) NOT NULL,
  email       varchar(255),
  phone       varchar(50),
  position    varchar(150),
  is_primary  boolean NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);
 
CREATE TABLE vendor.supplier_documents (
  id                            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id                   uuid NOT NULL REFERENCES vendor.suppliers (id) ON DELETE CASCADE,
  supplier_company_profile_id   uuid REFERENCES vendor.supplier_company_profiles (id),
  document_type                 varchar(100) NOT NULL,
  document_number               varchar(150),
  file_url                      text NOT NULL,
  file_hash                     varchar(128),
  issued_at                     date,
  expires_at                    date,
  status                        varchar(30) NOT NULL DEFAULT 'pending',
  uploaded_by                   uuid REFERENCES iam.users (id),
  created_at                    timestamptz NOT NULL DEFAULT now(),
  updated_at                    timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chk_supplier_documents_status CHECK (status IN ('pending', 'valid', 'expired', 'rejected'))
);
 
 
-- Vendor verification
 
CREATE TABLE vendor.verification_cases (
  id                            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_company_profile_id   uuid NOT NULL REFERENCES vendor.supplier_company_profiles (id),
  case_number                   varchar(100) NOT NULL UNIQUE,
  verification_type             varchar(50) NOT NULL DEFAULT 'initial',
  status                        varchar(30) NOT NULL DEFAULT 'open',
  opened_by                     uuid NOT NULL REFERENCES iam.users (id),
  opened_at                     timestamptz NOT NULL DEFAULT now(),
  completed_at                  timestamptz,
  expires_at                    timestamptz,
  created_at                    timestamptz NOT NULL DEFAULT now(),
  updated_at                    timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chk_verification_cases_verification_type
    CHECK (verification_type IN ('initial', 'periodic', 'renewal', 're_verification')),
  CONSTRAINT chk_verification_cases_status
    CHECK (status IN ('open', 'in_progress', 'approved', 'rejected', 'expired', 'cancelled'))
);
 
CREATE TABLE vendor.verification_checks (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  verification_case_id   uuid NOT NULL REFERENCES vendor.verification_cases (id) ON DELETE CASCADE,
  check_type             varchar(100) NOT NULL,
  name                   varchar(150) NOT NULL,
  status                 varchar(30) NOT NULL DEFAULT 'pending',
  is_required            boolean NOT NULL DEFAULT true,
  checked_by             uuid REFERENCES iam.users (id),
  checked_at             timestamptz,
  notes                  text,
  created_at             timestamptz NOT NULL DEFAULT now(),
  updated_at             timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chk_verification_checks_status
    CHECK (status IN ('pending', 'in_progress', 'passed', 'failed', 'waived'))
);
 
CREATE TABLE vendor.verification_evidence (
  id                       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  verification_check_id   uuid NOT NULL REFERENCES vendor.verification_checks (id) ON DELETE CASCADE,
  supplier_document_id    uuid REFERENCES vendor.supplier_documents (id),
  evidence_type           varchar(100) NOT NULL,
  file_url                text,
  description              text,
  uploaded_by              uuid NOT NULL REFERENCES iam.users (id),
  created_at               timestamptz NOT NULL DEFAULT now()
);
 
CREATE TABLE vendor.verification_reviews (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  verification_case_id   uuid NOT NULL REFERENCES vendor.verification_cases (id) ON DELETE CASCADE,
  reviewer_user_id        uuid NOT NULL REFERENCES iam.users (id),
  decision                varchar(30) NOT NULL,
  comments                text,
  reviewed_at             timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chk_verification_reviews_decision
    CHECK (decision IN ('approved', 'rejected', 'requires_changes'))
);
 
CREATE TABLE vendor.supplier_risk_assessments (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  verification_case_id   uuid NOT NULL REFERENCES vendor.verification_cases (id) ON DELETE CASCADE,
  risk_level              varchar(30) NOT NULL,
  risk_score              numeric(5,2),
  rationale               text,
  assessed_by             uuid NOT NULL REFERENCES iam.users (id),
  assessed_at             timestamptz NOT NULL DEFAULT now(),
  expires_at              timestamptz,
  CONSTRAINT chk_supplier_risk_assessments_risk_level
    CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  CONSTRAINT chk_supplier_risk_assessments_risk_score
    CHECK (risk_score IS NULL OR (risk_score >= 0 AND risk_score <= 100))
);
 
 
-- ============================================================
-- AUDIT
-- ============================================================
 
CREATE TABLE audit.audit_logs (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id  uuid REFERENCES organization.companies (id),
  user_id     uuid REFERENCES iam.users (id),
  action      varchar(100) NOT NULL,
  entity_type varchar(100) NOT NULL,
  entity_id   uuid,
  old_values  jsonb,
  new_values  jsonb,
  ip_address  inet,
  user_agent  text,
  created_at  timestamptz NOT NULL DEFAULT now()
);
 
CREATE INDEX idx_audit_logs_company_created ON audit.audit_logs (company_id, created_at);
CREATE INDEX idx_audit_logs_entity ON audit.audit_logs (entity_type, entity_id);
 
 
-- ============================================================
-- PROCUREMENT
-- Requisition -> Approval -> Purchase Order -> Goods Receipt
-- ============================================================
 
CREATE TABLE procurement.requisitions (
  id                       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id               uuid NOT NULL REFERENCES organization.companies (id),
  requisition_number       varchar(50) NOT NULL,
  requester_id             uuid NOT NULL REFERENCES iam.company_users (id),
  department_id            uuid REFERENCES organization.departments (id),
  request_date             date NOT NULL DEFAULT CURRENT_DATE,
  required_date            date,
  status                   varchar(30) NOT NULL DEFAULT 'Draft',
  justification            varchar(500) NOT NULL,
  approval_status          varchar(30) NOT NULL DEFAULT 'Pending',
  total_estimated_amount   decimal(15,2),
  created_at               timestamptz NOT NULL DEFAULT now(),
  updated_at               timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_requisitions_company_number UNIQUE (company_id, requisition_number),
  CONSTRAINT chk_requisitions_status
    CHECK (status IN ('Draft', 'Submitted', 'Pending', 'Approved', 'Rejected', 'Cancelled', 'Completed')),
  CONSTRAINT chk_requisitions_approval_status
    CHECK (approval_status IN ('Pending', 'Approved', 'Rejected')),
  CONSTRAINT chk_requisitions_total_estimated_amount
    CHECK (total_estimated_amount IS NULL OR total_estimated_amount >= 0)
);
 
CREATE INDEX idx_requisitions_status ON procurement.requisitions (status);
 
CREATE TABLE procurement.requisition_items (
  id                       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requisition_id           uuid NOT NULL REFERENCES procurement.requisitions (id) ON DELETE CASCADE,
  item_id                  uuid NOT NULL REFERENCES catalog.items (id),
  description              varchar(500) NOT NULL,
  quantity_requested       decimal(15,2) NOT NULL,
  unit_of_measure_id       uuid NOT NULL REFERENCES catalog.units_of_measure (id),
  estimated_unit_price     decimal(15,2),
  estimated_total_price    decimal(15,2),
  required_date            date,
  item_status              varchar(30) NOT NULL DEFAULT 'Pending',
  created_at               timestamptz NOT NULL DEFAULT now(),
  updated_at               timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chk_requisition_items_quantity_requested CHECK (quantity_requested > 0),
  CONSTRAINT chk_requisition_items_estimated_unit_price
    CHECK (estimated_unit_price IS NULL OR estimated_unit_price >= 0),
  CONSTRAINT chk_requisition_items_estimated_total_price
    CHECK (estimated_total_price IS NULL OR estimated_total_price >= 0)
);
 
CREATE TABLE procurement.approvals (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requisition_id    uuid NOT NULL REFERENCES procurement.requisitions (id) ON DELETE CASCADE,
  approver_id       uuid NOT NULL REFERENCES iam.company_users (id),
  approval_level    int NOT NULL,
  approval_status   varchar(30) NOT NULL DEFAULT 'Pending',
  approval_date     timestamptz,
  comments          varchar(500),
  rejection_reason  varchar(500),
  created_at        timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_approvals_requisition_level UNIQUE (requisition_id, approval_level),
  CONSTRAINT chk_approvals_status CHECK (approval_status IN ('Pending', 'Approved', 'Rejected')),
  CONSTRAINT chk_approvals_level CHECK (approval_level > 0)
);
 
CREATE TABLE procurement.purchase_orders (
  id                       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id               uuid NOT NULL REFERENCES organization.companies (id),
  po_number                varchar(50) NOT NULL,
  requisition_id           uuid NOT NULL REFERENCES procurement.requisitions (id),
  supplier_id              uuid NOT NULL REFERENCES vendor.supplier_company_profiles (id),
  buyer_id                 uuid NOT NULL REFERENCES iam.company_users (id),
  order_date               date NOT NULL DEFAULT CURRENT_DATE,
  expected_delivery_date   date,
  currency                 char(3) NOT NULL DEFAULT 'NGN',
  total_amount             decimal(15,2) NOT NULL DEFAULT 0,
  status                   varchar(30) NOT NULL DEFAULT 'Issued',
  payment_terms            varchar(100),
  created_at               timestamptz NOT NULL DEFAULT now(),
  updated_at               timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_purchase_orders_company_po_number UNIQUE (company_id, po_number),
  CONSTRAINT chk_purchase_orders_status
    CHECK (status IN ('Draft', 'Submitted', 'Pending', 'Approved', 'Rejected', 'Cancelled', 'Completed')),
  CONSTRAINT chk_purchase_orders_total_amount CHECK (total_amount >= 0)
);
 
CREATE INDEX idx_purchase_orders_status ON procurement.purchase_orders (status);
 
CREATE TABLE procurement.purchase_order_items (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_order_id      uuid NOT NULL REFERENCES procurement.purchase_orders (id) ON DELETE CASCADE,
  requisition_item_id    uuid REFERENCES procurement.requisition_items (id),
  item_id                uuid NOT NULL REFERENCES catalog.items (id),
  description            varchar(500) NOT NULL,
  quantity_ordered       decimal(15,2) NOT NULL,
  unit_of_measure_id     uuid NOT NULL REFERENCES catalog.units_of_measure (id),
  unit_price             decimal(15,2) NOT NULL,
  line_total             decimal(15,2) NOT NULL,
  delivery_date          date,
  item_status            varchar(30) NOT NULL DEFAULT 'Open',
  created_at             timestamptz NOT NULL DEFAULT now(),
  updated_at             timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chk_po_items_quantity_ordered CHECK (quantity_ordered > 0),
  CONSTRAINT chk_po_items_unit_price CHECK (unit_price >= 0),
  CONSTRAINT chk_po_items_line_total CHECK (line_total >= 0)
);
 
CREATE TABLE procurement.goods_receipts (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  receipt_number         varchar(50) NOT NULL UNIQUE,
  purchase_order_id      uuid NOT NULL REFERENCES procurement.purchase_orders (id),
  received_by            uuid NOT NULL REFERENCES iam.company_users (id),
  receipt_date           timestamptz NOT NULL DEFAULT now(),
  delivery_note_number   varchar(100),
  receipt_status         varchar(30) NOT NULL DEFAULT 'Pending',
  remarks                varchar(500),
  created_at             timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chk_goods_receipts_status
    CHECK (receipt_status IN ('Pending', 'Partially Received', 'Completed'))
);
 
CREATE TABLE procurement.goods_receipt_items (
  id                        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  goods_receipt_id          uuid NOT NULL REFERENCES procurement.goods_receipts (id) ON DELETE CASCADE,
  purchase_order_item_id    uuid NOT NULL REFERENCES procurement.purchase_order_items (id),
  quantity_received         decimal(15,2) NOT NULL,
  quantity_accepted         decimal(15,2) NOT NULL,
  quantity_rejected         decimal(15,2) NOT NULL DEFAULT 0,
  rejection_reason          varchar(500),
  condition_status          varchar(30) NOT NULL DEFAULT 'Good',
  inspection_status         varchar(30) NOT NULL DEFAULT 'Pending',
  received_date             timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chk_gri_quantity_received CHECK (quantity_received >= 0),
  CONSTRAINT chk_gri_quantity_accepted CHECK (quantity_accepted >= 0),
  CONSTRAINT chk_gri_quantity_rejected CHECK (quantity_rejected >= 0),
  CONSTRAINT chk_gri_accepted_le_received CHECK (quantity_accepted <= quantity_received),
  CONSTRAINT chk_gri_rejected_le_received CHECK (quantity_rejected <= quantity_received),
  CONSTRAINT chk_gri_accepted_plus_rejected_le_received
    CHECK (quantity_accepted + quantity_rejected <= quantity_received)
);
 
COMMIT;
 
