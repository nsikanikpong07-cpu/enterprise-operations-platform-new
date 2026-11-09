--
-- PostgreSQL database dump
--

\restrict JIXU6yyviMT9ucVzBdxkLzDaqn2m7mtEwi6zkQ343Bvv4S3zoOUrdjLBTo3cX30

-- Dumped from database version 18.4
-- Dumped by pg_dump version 18.4

-- Started on 2026-10-19 11:54:34

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 7 (class 2615 OID 16444)
-- Name: app; Type: SCHEMA; Schema: -; Owner: enterprise_app
--

CREATE SCHEMA app;


ALTER SCHEMA app OWNER TO enterprise_app;

--
-- TOC entry 13 (class 2615 OID 24708)
-- Name: audit; Type: SCHEMA; Schema: -; Owner: enterprise_app
--

CREATE SCHEMA audit;


ALTER SCHEMA audit OWNER TO enterprise_app;

--
-- TOC entry 11 (class 2615 OID 24706)
-- Name: catalog; Type: SCHEMA; Schema: -; Owner: enterprise_app
--

CREATE SCHEMA catalog;


ALTER SCHEMA catalog OWNER TO enterprise_app;

--
-- TOC entry 10 (class 2615 OID 24705)
-- Name: iam; Type: SCHEMA; Schema: -; Owner: enterprise_app
--

CREATE SCHEMA iam;


ALTER SCHEMA iam OWNER TO enterprise_app;

--
-- TOC entry 9 (class 2615 OID 24704)
-- Name: organization; Type: SCHEMA; Schema: -; Owner: enterprise_app
--

CREATE SCHEMA organization;


ALTER SCHEMA organization OWNER TO enterprise_app;

--
-- TOC entry 14 (class 2615 OID 24709)
-- Name: procurement; Type: SCHEMA; Schema: -; Owner: enterprise_app
--

CREATE SCHEMA procurement;


ALTER SCHEMA procurement OWNER TO enterprise_app;

--
-- TOC entry 12 (class 2615 OID 24707)
-- Name: vendor; Type: SCHEMA; Schema: -; Owner: enterprise_app
--

CREATE SCHEMA vendor;


ALTER SCHEMA vendor OWNER TO enterprise_app;

--
-- TOC entry 2 (class 3079 OID 24666)
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;


--
-- TOC entry 5553 (class 0 OID 0)
-- Dependencies: 2
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


--
-- TOC entry 3 (class 3079 OID 25553)
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA app;


--
-- TOC entry 5554 (class 0 OID 0)
-- Dependencies: 3
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- TOC entry 311 (class 1255 OID 25661)
-- Name: reject_audit_mutation(); Type: FUNCTION; Schema: audit; Owner: enterprise_app
--

CREATE FUNCTION audit.reject_audit_mutation() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
      BEGIN
        RAISE EXCEPTION 'Audit records are append-only' USING ERRCODE='55000';
      END;
      $$;


ALTER FUNCTION audit.reject_audit_mutation() OWNER TO enterprise_app;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 228 (class 1259 OID 24637)
-- Name: _prisma_migrations; Type: TABLE; Schema: app; Owner: enterprise_app
--

CREATE TABLE app._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


ALTER TABLE app._prisma_migrations OWNER TO enterprise_app;

--
-- TOC entry 251 (class 1259 OID 25253)
-- Name: audit_logs; Type: TABLE; Schema: audit; Owner: enterprise_app
--

CREATE TABLE audit.audit_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    company_id uuid,
    user_id uuid,
    action character varying(100) NOT NULL,
    entity_type character varying(100) NOT NULL,
    entity_id uuid,
    old_values jsonb,
    new_values jsonb,
    ip_address inet,
    user_agent text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE audit.audit_logs OWNER TO enterprise_app;

--
-- TOC entry 240 (class 1259 OID 24933)
-- Name: item_categories; Type: TABLE; Schema: catalog; Owner: enterprise_app
--

CREATE TABLE catalog.item_categories (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    company_id uuid NOT NULL,
    parent_id uuid,
    name character varying(150) NOT NULL,
    description text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE catalog.item_categories OWNER TO enterprise_app;

--
-- TOC entry 241 (class 1259 OID 24960)
-- Name: items; Type: TABLE; Schema: catalog; Owner: enterprise_app
--

CREATE TABLE catalog.items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    company_id uuid NOT NULL,
    category_id uuid,
    unit_of_measure_id uuid NOT NULL,
    sku character varying(100),
    name character varying(255) NOT NULL,
    description text,
    item_type character varying(30) DEFAULT 'material'::character varying NOT NULL,
    is_stockable boolean DEFAULT true NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT chk_items_item_type CHECK (((item_type)::text = ANY ((ARRAY['material'::character varying, 'service'::character varying, 'asset'::character varying])::text[])))
);


ALTER TABLE catalog.items OWNER TO enterprise_app;

--
-- TOC entry 239 (class 1259 OID 24920)
-- Name: units_of_measure; Type: TABLE; Schema: catalog; Owner: enterprise_app
--

CREATE TABLE catalog.units_of_measure (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    code character varying(20) NOT NULL,
    name character varying(100) NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE catalog.units_of_measure OWNER TO enterprise_app;

--
-- TOC entry 263 (class 1259 OID 25635)
-- Name: auth_mail_outbox; Type: TABLE; Schema: iam; Owner: enterprise_app
--

CREATE TABLE iam.auth_mail_outbox (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    payload text,
    user_id uuid NOT NULL,
    status character varying(20) DEFAULT 'pending'::character varying NOT NULL,
    attempts integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    next_attempt_at timestamp with time zone DEFAULT now() NOT NULL,
    locked_at timestamp with time zone,
    CONSTRAINT auth_mail_outbox_status_check CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'processing'::character varying, 'sent'::character varying, 'cancelled'::character varying])::text[])))
);


ALTER TABLE iam.auth_mail_outbox OWNER TO enterprise_app;

--
-- TOC entry 261 (class 1259 OID 25604)
-- Name: auth_rate_limits; Type: TABLE; Schema: iam; Owner: enterprise_app
--

CREATE TABLE iam.auth_rate_limits (
    key character varying(64) NOT NULL,
    window_start timestamp with time zone NOT NULL,
    attempts integer NOT NULL,
    CONSTRAINT auth_rate_limits_attempts_check CHECK ((attempts >= 0))
);


ALTER TABLE iam.auth_rate_limits OWNER TO enterprise_app;

--
-- TOC entry 233 (class 1259 OID 24778)
-- Name: company_users; Type: TABLE; Schema: iam; Owner: enterprise_app
--

CREATE TABLE iam.company_users (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    company_id uuid NOT NULL,
    user_id uuid NOT NULL,
    department_id uuid,
    employee_number character varying(100),
    job_title character varying(150),
    status character varying(30) DEFAULT 'active'::character varying NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT chk_company_users_status CHECK (((status)::text = ANY ((ARRAY['active'::character varying, 'suspended'::character varying, 'inactive'::character varying])::text[])))
);


ALTER TABLE iam.company_users OWNER TO enterprise_app;

--
-- TOC entry 262 (class 1259 OID 25614)
-- Name: password_reset_tokens; Type: TABLE; Schema: iam; Owner: enterprise_app
--

CREATE TABLE iam.password_reset_tokens (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    token_hash character varying(64) NOT NULL,
    auth_version integer NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    used_at timestamp with time zone
);


ALTER TABLE iam.password_reset_tokens OWNER TO enterprise_app;

--
-- TOC entry 236 (class 1259 OID 24860)
-- Name: permissions; Type: TABLE; Schema: iam; Owner: enterprise_app
--

CREATE TABLE iam.permissions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(150) NOT NULL,
    description text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE iam.permissions OWNER TO enterprise_app;

--
-- TOC entry 238 (class 1259 OID 24897)
-- Name: role_permissions; Type: TABLE; Schema: iam; Owner: enterprise_app
--

CREATE TABLE iam.role_permissions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    role_id uuid NOT NULL,
    permission_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE iam.role_permissions OWNER TO enterprise_app;

--
-- TOC entry 235 (class 1259 OID 24846)
-- Name: roles; Type: TABLE; Schema: iam; Owner: enterprise_app
--

CREATE TABLE iam.roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    company_id uuid NOT NULL
);


ALTER TABLE iam.roles OWNER TO enterprise_app;

--
-- TOC entry 237 (class 1259 OID 24874)
-- Name: user_roles; Type: TABLE; Schema: iam; Owner: enterprise_app
--

CREATE TABLE iam.user_roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    company_user_id uuid NOT NULL,
    role_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE iam.user_roles OWNER TO enterprise_app;

--
-- TOC entry 232 (class 1259 OID 24756)
-- Name: users; Type: TABLE; Schema: iam; Owner: enterprise_app
--

CREATE TABLE iam.users (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    email character varying(255) NOT NULL,
    password_hash text NOT NULL,
    first_name character varying(100) NOT NULL,
    last_name character varying(100) NOT NULL,
    phone character varying(50),
    status character varying(30) DEFAULT 'active'::character varying NOT NULL,
    last_login_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    auth_version integer DEFAULT 0 NOT NULL,
    CONSTRAINT chk_users_status CHECK (((status)::text = ANY ((ARRAY['active'::character varying, 'suspended'::character varying, 'inactive'::character varying])::text[]))),
    CONSTRAINT users_auth_version_check CHECK ((auth_version >= 0))
);


ALTER TABLE iam.users OWNER TO enterprise_app;

--
-- TOC entry 230 (class 1259 OID 24710)
-- Name: companies; Type: TABLE; Schema: organization; Owner: enterprise_app
--

CREATE TABLE organization.companies (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(255) NOT NULL,
    legal_name character varying(255),
    registration_number character varying(100),
    tax_identification_number character varying(100),
    industry character varying(100),
    country_code character(2) DEFAULT 'NG'::bpchar NOT NULL,
    default_currency character(3) DEFAULT 'NGN'::bpchar NOT NULL,
    timezone character varying(100) DEFAULT 'Africa/Lagos'::character varying NOT NULL,
    status character varying(30) DEFAULT 'active'::character varying NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT chk_companies_status CHECK (((status)::text = ANY ((ARRAY['active'::character varying, 'suspended'::character varying, 'inactive'::character varying])::text[])))
);


ALTER TABLE organization.companies OWNER TO enterprise_app;

--
-- TOC entry 231 (class 1259 OID 24734)
-- Name: departments; Type: TABLE; Schema: organization; Owner: enterprise_app
--

CREATE TABLE organization.departments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    company_id uuid NOT NULL,
    name character varying(150) NOT NULL,
    code character varying(50),
    manager_company_user_id uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE organization.departments OWNER TO enterprise_app;

--
-- TOC entry 234 (class 1259 OID 24818)
-- Name: locations; Type: TABLE; Schema: organization; Owner: enterprise_app
--

CREATE TABLE organization.locations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    company_id uuid NOT NULL,
    name character varying(150) NOT NULL,
    code character varying(50) NOT NULL,
    type character varying(50) DEFAULT 'office'::character varying NOT NULL,
    address text,
    city character varying(100),
    state character varying(100),
    country_code character(2),
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT chk_locations_type CHECK (((type)::text = ANY ((ARRAY['office'::character varying, 'warehouse'::character varying, 'branch'::character varying, 'site'::character varying, 'factory'::character varying, 'other'::character varying])::text[])))
);


ALTER TABLE organization.locations OWNER TO enterprise_app;

--
-- TOC entry 254 (class 1259 OID 25360)
-- Name: approvals; Type: TABLE; Schema: procurement; Owner: enterprise_app
--

CREATE TABLE procurement.approvals (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    requisition_id uuid NOT NULL,
    approver_id uuid NOT NULL,
    approval_level integer NOT NULL,
    approval_status character varying(30) DEFAULT 'Pending'::character varying NOT NULL,
    approval_date timestamp with time zone,
    comments character varying(500),
    rejection_reason character varying(500),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT chk_approvals_level CHECK ((approval_level > 0)),
    CONSTRAINT chk_approvals_status CHECK (((approval_status)::text = ANY ((ARRAY['Pending'::character varying, 'Approved'::character varying, 'Rejected'::character varying])::text[])))
);


ALTER TABLE procurement.approvals OWNER TO enterprise_app;

--
-- TOC entry 258 (class 1259 OID 25515)
-- Name: goods_receipt_items; Type: TABLE; Schema: procurement; Owner: enterprise_app
--

CREATE TABLE procurement.goods_receipt_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    goods_receipt_id uuid NOT NULL,
    purchase_order_item_id uuid NOT NULL,
    quantity_received numeric(15,2) NOT NULL,
    quantity_accepted numeric(15,2) NOT NULL,
    quantity_rejected numeric(15,2) DEFAULT 0 NOT NULL,
    rejection_reason character varying(500),
    condition_status character varying(30) DEFAULT 'Good'::character varying NOT NULL,
    inspection_status character varying(30) DEFAULT 'Pending'::character varying NOT NULL,
    received_date timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT chk_gri_accepted_le_received CHECK ((quantity_accepted <= quantity_received)),
    CONSTRAINT chk_gri_accepted_plus_rejected_le_received CHECK (((quantity_accepted + quantity_rejected) <= quantity_received)),
    CONSTRAINT chk_gri_quantity_accepted CHECK ((quantity_accepted >= (0)::numeric)),
    CONSTRAINT chk_gri_quantity_received CHECK ((quantity_received >= (0)::numeric)),
    CONSTRAINT chk_gri_quantity_rejected CHECK ((quantity_rejected >= (0)::numeric)),
    CONSTRAINT chk_gri_rejected_le_received CHECK ((quantity_rejected <= quantity_received))
);


ALTER TABLE procurement.goods_receipt_items OWNER TO enterprise_app;

--
-- TOC entry 257 (class 1259 OID 25484)
-- Name: goods_receipts; Type: TABLE; Schema: procurement; Owner: enterprise_app
--

CREATE TABLE procurement.goods_receipts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    receipt_number character varying(50) NOT NULL,
    purchase_order_id uuid NOT NULL,
    received_by uuid NOT NULL,
    receipt_date timestamp with time zone DEFAULT now() NOT NULL,
    delivery_note_number character varying(100),
    receipt_status character varying(30) DEFAULT 'Pending'::character varying NOT NULL,
    remarks character varying(500),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT chk_goods_receipts_status CHECK (((receipt_status)::text = ANY ((ARRAY['Pending'::character varying, 'Partially Received'::character varying, 'Completed'::character varying])::text[])))
);


ALTER TABLE procurement.goods_receipts OWNER TO enterprise_app;

--
-- TOC entry 256 (class 1259 OID 25439)
-- Name: purchase_order_items; Type: TABLE; Schema: procurement; Owner: enterprise_app
--

CREATE TABLE procurement.purchase_order_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    purchase_order_id uuid NOT NULL,
    requisition_item_id uuid,
    item_id uuid NOT NULL,
    description character varying(500) NOT NULL,
    quantity_ordered numeric(15,2) NOT NULL,
    unit_of_measure_id uuid NOT NULL,
    unit_price numeric(15,2) NOT NULL,
    line_total numeric(15,2) NOT NULL,
    delivery_date date,
    item_status character varying(30) DEFAULT 'Open'::character varying NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT chk_po_items_line_total CHECK ((line_total >= (0)::numeric)),
    CONSTRAINT chk_po_items_quantity_ordered CHECK ((quantity_ordered > (0)::numeric)),
    CONSTRAINT chk_po_items_unit_price CHECK ((unit_price >= (0)::numeric))
);


ALTER TABLE procurement.purchase_order_items OWNER TO enterprise_app;

--
-- TOC entry 255 (class 1259 OID 25390)
-- Name: purchase_orders; Type: TABLE; Schema: procurement; Owner: enterprise_app
--

CREATE TABLE procurement.purchase_orders (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    company_id uuid NOT NULL,
    po_number character varying(50) NOT NULL,
    requisition_id uuid NOT NULL,
    supplier_id uuid NOT NULL,
    buyer_id uuid NOT NULL,
    order_date date DEFAULT CURRENT_DATE NOT NULL,
    expected_delivery_date date,
    currency character(3) DEFAULT 'NGN'::bpchar NOT NULL,
    total_amount numeric(15,2) DEFAULT 0 NOT NULL,
    status character varying(30) DEFAULT 'Draft'::character varying NOT NULL,
    payment_terms character varying(100),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT chk_purchase_orders_status CHECK (((status)::text = ANY ((ARRAY['Draft'::character varying, 'Submitted'::character varying, 'Pending'::character varying, 'Approved'::character varying, 'Rejected'::character varying, 'Cancelled'::character varying, 'Completed'::character varying])::text[]))),
    CONSTRAINT chk_purchase_orders_total_amount CHECK ((total_amount >= (0)::numeric))
);


ALTER TABLE procurement.purchase_orders OWNER TO enterprise_app;

--
-- TOC entry 253 (class 1259 OID 25322)
-- Name: requisition_items; Type: TABLE; Schema: procurement; Owner: enterprise_app
--

CREATE TABLE procurement.requisition_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    requisition_id uuid NOT NULL,
    item_id uuid NOT NULL,
    description character varying(500) NOT NULL,
    quantity_requested numeric(15,2) NOT NULL,
    unit_of_measure_id uuid NOT NULL,
    estimated_unit_price numeric(15,2),
    estimated_total_price numeric(15,2),
    required_date date,
    item_status character varying(30) DEFAULT 'Pending'::character varying NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT chk_requisition_items_estimated_total_price CHECK (((estimated_total_price IS NULL) OR (estimated_total_price >= (0)::numeric))),
    CONSTRAINT chk_requisition_items_estimated_unit_price CHECK (((estimated_unit_price IS NULL) OR (estimated_unit_price >= (0)::numeric))),
    CONSTRAINT chk_requisition_items_quantity_requested CHECK ((quantity_requested > (0)::numeric))
);


ALTER TABLE procurement.requisition_items OWNER TO enterprise_app;

--
-- TOC entry 252 (class 1259 OID 25278)
-- Name: requisitions; Type: TABLE; Schema: procurement; Owner: enterprise_app
--

CREATE TABLE procurement.requisitions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    company_id uuid NOT NULL,
    requisition_number character varying(50) NOT NULL,
    requester_id uuid NOT NULL,
    department_id uuid,
    request_date date DEFAULT CURRENT_DATE NOT NULL,
    required_date date,
    status character varying(30) DEFAULT 'Draft'::character varying NOT NULL,
    justification character varying(500) NOT NULL,
    approval_status character varying(30) DEFAULT 'Pending'::character varying NOT NULL,
    total_estimated_amount numeric(15,2),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT chk_requisitions_approval_status CHECK (((approval_status)::text = ANY ((ARRAY['Pending'::character varying, 'Approved'::character varying, 'Rejected'::character varying])::text[]))),
    CONSTRAINT chk_requisitions_status CHECK (((status)::text = ANY ((ARRAY['Draft'::character varying, 'Submitted'::character varying, 'Pending'::character varying, 'Approved'::character varying, 'Rejected'::character varying, 'Cancelled'::character varying, 'Completed'::character varying])::text[]))),
    CONSTRAINT chk_requisitions_total_estimated_amount CHECK (((total_estimated_amount IS NULL) OR (total_estimated_amount >= (0)::numeric)))
);


ALTER TABLE procurement.requisitions OWNER TO enterprise_app;

--
-- TOC entry 229 (class 1259 OID 24651)
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: enterprise_app
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


ALTER TABLE public._prisma_migrations OWNER TO enterprise_app;

--
-- TOC entry 260 (class 1259 OID 25573)
-- Name: typeorm_migrations; Type: TABLE; Schema: public; Owner: enterprise_app
--

CREATE TABLE public.typeorm_migrations (
    id integer NOT NULL,
    "timestamp" bigint NOT NULL,
    name character varying NOT NULL
);


ALTER TABLE public.typeorm_migrations OWNER TO enterprise_app;

--
-- TOC entry 259 (class 1259 OID 25572)
-- Name: typeorm_migrations_id_seq; Type: SEQUENCE; Schema: public; Owner: enterprise_app
--

CREATE SEQUENCE public.typeorm_migrations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.typeorm_migrations_id_seq OWNER TO enterprise_app;

--
-- TOC entry 5555 (class 0 OID 0)
-- Dependencies: 259
-- Name: typeorm_migrations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: enterprise_app
--

ALTER SEQUENCE public.typeorm_migrations_id_seq OWNED BY public.typeorm_migrations.id;


--
-- TOC entry 243 (class 1259 OID 25017)
-- Name: supplier_company_profiles; Type: TABLE; Schema: vendor; Owner: enterprise_app
--

CREATE TABLE vendor.supplier_company_profiles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    supplier_id uuid NOT NULL,
    company_id uuid NOT NULL,
    supplier_code character varying(100),
    relationship_status character varying(30) DEFAULT 'prospective'::character varying NOT NULL,
    onboarding_status character varying(30) DEFAULT 'pending'::character varying NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT chk_supplier_company_profiles_onboarding_status CHECK (((onboarding_status)::text = ANY ((ARRAY['pending'::character varying, 'in_progress'::character varying, 'completed'::character varying, 'rejected'::character varying])::text[]))),
    CONSTRAINT chk_supplier_company_profiles_relationship_status CHECK (((relationship_status)::text = ANY ((ARRAY['prospective'::character varying, 'active'::character varying, 'suspended'::character varying, 'blocked'::character varying, 'inactive'::character varying])::text[])))
);


ALTER TABLE vendor.supplier_company_profiles OWNER TO enterprise_app;

--
-- TOC entry 244 (class 1259 OID 25052)
-- Name: supplier_contacts; Type: TABLE; Schema: vendor; Owner: enterprise_app
--

CREATE TABLE vendor.supplier_contacts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    supplier_id uuid NOT NULL,
    name character varying(200) NOT NULL,
    email character varying(255),
    phone character varying(50),
    "position" character varying(150),
    is_primary boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE vendor.supplier_contacts OWNER TO enterprise_app;

--
-- TOC entry 245 (class 1259 OID 25074)
-- Name: supplier_documents; Type: TABLE; Schema: vendor; Owner: enterprise_app
--

CREATE TABLE vendor.supplier_documents (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    supplier_id uuid NOT NULL,
    supplier_company_profile_id uuid,
    document_type character varying(100) NOT NULL,
    document_number character varying(150),
    file_url text NOT NULL,
    file_hash character varying(128),
    issued_at date,
    expires_at date,
    status character varying(30) DEFAULT 'pending'::character varying NOT NULL,
    uploaded_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT chk_supplier_documents_status CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'valid'::character varying, 'expired'::character varying, 'rejected'::character varying])::text[])))
);


ALTER TABLE vendor.supplier_documents OWNER TO enterprise_app;

--
-- TOC entry 250 (class 1259 OID 25227)
-- Name: supplier_risk_assessments; Type: TABLE; Schema: vendor; Owner: enterprise_app
--

CREATE TABLE vendor.supplier_risk_assessments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    verification_case_id uuid NOT NULL,
    risk_level character varying(30) NOT NULL,
    risk_score numeric(5,2),
    rationale text,
    assessed_by uuid NOT NULL,
    assessed_at timestamp with time zone DEFAULT now() NOT NULL,
    expires_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT chk_supplier_risk_assessments_risk_level CHECK (((risk_level)::text = ANY ((ARRAY['low'::character varying, 'medium'::character varying, 'high'::character varying, 'critical'::character varying])::text[]))),
    CONSTRAINT chk_supplier_risk_assessments_risk_score CHECK (((risk_score IS NULL) OR ((risk_score >= (0)::numeric) AND (risk_score <= (100)::numeric))))
);


ALTER TABLE vendor.supplier_risk_assessments OWNER TO enterprise_app;

--
-- TOC entry 242 (class 1259 OID 25000)
-- Name: suppliers; Type: TABLE; Schema: vendor; Owner: enterprise_app
--

CREATE TABLE vendor.suppliers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    legal_name character varying(255) NOT NULL,
    trading_name character varying(255),
    registration_number character varying(100),
    tax_identification_number character varying(100),
    supplier_type character varying(50),
    country_code character(2),
    status character varying(30) DEFAULT 'active'::character varying NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT chk_suppliers_status CHECK (((status)::text = ANY ((ARRAY['active'::character varying, 'inactive'::character varying, 'suspended'::character varying])::text[])))
);


ALTER TABLE vendor.suppliers OWNER TO enterprise_app;

--
-- TOC entry 246 (class 1259 OID 25108)
-- Name: verification_cases; Type: TABLE; Schema: vendor; Owner: enterprise_app
--

CREATE TABLE vendor.verification_cases (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    supplier_company_profile_id uuid NOT NULL,
    case_number character varying(100) NOT NULL,
    verification_type character varying(50) DEFAULT 'initial'::character varying NOT NULL,
    status character varying(30) DEFAULT 'open'::character varying NOT NULL,
    opened_by uuid NOT NULL,
    opened_at timestamp with time zone DEFAULT now() NOT NULL,
    completed_at timestamp with time zone,
    expires_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT chk_verification_cases_status CHECK (((status)::text = ANY ((ARRAY['open'::character varying, 'in_progress'::character varying, 'approved'::character varying, 'rejected'::character varying, 'expired'::character varying, 'cancelled'::character varying])::text[]))),
    CONSTRAINT chk_verification_cases_verification_type CHECK (((verification_type)::text = ANY ((ARRAY['initial'::character varying, 'periodic'::character varying, 'renewal'::character varying, 're_verification'::character varying])::text[])))
);


ALTER TABLE vendor.verification_cases OWNER TO enterprise_app;

--
-- TOC entry 247 (class 1259 OID 25142)
-- Name: verification_checks; Type: TABLE; Schema: vendor; Owner: enterprise_app
--

CREATE TABLE vendor.verification_checks (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    verification_case_id uuid NOT NULL,
    check_type character varying(100) NOT NULL,
    name character varying(150) NOT NULL,
    status character varying(30) DEFAULT 'pending'::character varying NOT NULL,
    is_required boolean DEFAULT true NOT NULL,
    checked_by uuid,
    checked_at timestamp with time zone,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT chk_verification_checks_status CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'in_progress'::character varying, 'passed'::character varying, 'failed'::character varying, 'waived'::character varying])::text[])))
);


ALTER TABLE vendor.verification_checks OWNER TO enterprise_app;

--
-- TOC entry 248 (class 1259 OID 25173)
-- Name: verification_evidence; Type: TABLE; Schema: vendor; Owner: enterprise_app
--

CREATE TABLE vendor.verification_evidence (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    verification_check_id uuid NOT NULL,
    supplier_document_id uuid,
    evidence_type character varying(100) NOT NULL,
    file_url text,
    description text,
    uploaded_by uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE vendor.verification_evidence OWNER TO enterprise_app;

--
-- TOC entry 249 (class 1259 OID 25202)
-- Name: verification_reviews; Type: TABLE; Schema: vendor; Owner: enterprise_app
--

CREATE TABLE vendor.verification_reviews (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    verification_case_id uuid NOT NULL,
    reviewer_user_id uuid NOT NULL,
    decision character varying(30) NOT NULL,
    comments text,
    reviewed_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT chk_verification_reviews_decision CHECK (((decision)::text = ANY ((ARRAY['approved'::character varying, 'rejected'::character varying, 'requires_changes'::character varying])::text[])))
);


ALTER TABLE vendor.verification_reviews OWNER TO enterprise_app;

--
-- TOC entry 5171 (class 2604 OID 25576)
-- Name: typeorm_migrations id; Type: DEFAULT; Schema: public; Owner: enterprise_app
--

ALTER TABLE ONLY public.typeorm_migrations ALTER COLUMN id SET DEFAULT nextval('public.typeorm_migrations_id_seq'::regclass);


--
-- TOC entry 5218 (class 2606 OID 24650)
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: app; Owner: enterprise_app
--

ALTER TABLE ONLY app._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- TOC entry 5301 (class 2606 OID 25265)
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: audit; Owner: enterprise_app
--

ALTER TABLE ONLY audit.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- TOC entry 5269 (class 2606 OID 24947)
-- Name: item_categories item_categories_pkey; Type: CONSTRAINT; Schema: catalog; Owner: enterprise_app
--

ALTER TABLE ONLY catalog.item_categories
    ADD CONSTRAINT item_categories_pkey PRIMARY KEY (id);


--
-- TOC entry 5273 (class 2606 OID 24982)
-- Name: items items_pkey; Type: CONSTRAINT; Schema: catalog; Owner: enterprise_app
--

ALTER TABLE ONLY catalog.items
    ADD CONSTRAINT items_pkey PRIMARY KEY (id);


--
-- TOC entry 5265 (class 2606 OID 24932)
-- Name: units_of_measure units_of_measure_code_key; Type: CONSTRAINT; Schema: catalog; Owner: enterprise_app
--

ALTER TABLE ONLY catalog.units_of_measure
    ADD CONSTRAINT units_of_measure_code_key UNIQUE (code);


--
-- TOC entry 5267 (class 2606 OID 24930)
-- Name: units_of_measure units_of_measure_pkey; Type: CONSTRAINT; Schema: catalog; Owner: enterprise_app
--

ALTER TABLE ONLY catalog.units_of_measure
    ADD CONSTRAINT units_of_measure_pkey PRIMARY KEY (id);


--
-- TOC entry 5271 (class 2606 OID 24949)
-- Name: item_categories uq_item_categories_company_name; Type: CONSTRAINT; Schema: catalog; Owner: enterprise_app
--

ALTER TABLE ONLY catalog.item_categories
    ADD CONSTRAINT uq_item_categories_company_name UNIQUE (company_id, name);


--
-- TOC entry 5275 (class 2606 OID 24984)
-- Name: items uq_items_company_sku; Type: CONSTRAINT; Schema: catalog; Owner: enterprise_app
--

ALTER TABLE ONLY catalog.items
    ADD CONSTRAINT uq_items_company_sku UNIQUE (company_id, sku);


--
-- TOC entry 5339 (class 2606 OID 25654)
-- Name: auth_mail_outbox auth_mail_outbox_pkey; Type: CONSTRAINT; Schema: iam; Owner: enterprise_app
--

ALTER TABLE ONLY iam.auth_mail_outbox
    ADD CONSTRAINT auth_mail_outbox_pkey PRIMARY KEY (id);


--
-- TOC entry 5331 (class 2606 OID 25612)
-- Name: auth_rate_limits auth_rate_limits_pkey; Type: CONSTRAINT; Schema: iam; Owner: enterprise_app
--

ALTER TABLE ONLY iam.auth_rate_limits
    ADD CONSTRAINT auth_rate_limits_pkey PRIMARY KEY (key);


--
-- TOC entry 5236 (class 2606 OID 24793)
-- Name: company_users company_users_pkey; Type: CONSTRAINT; Schema: iam; Owner: enterprise_app
--

ALTER TABLE ONLY iam.company_users
    ADD CONSTRAINT company_users_pkey PRIMARY KEY (id);


--
-- TOC entry 5335 (class 2606 OID 25626)
-- Name: password_reset_tokens password_reset_tokens_pkey; Type: CONSTRAINT; Schema: iam; Owner: enterprise_app
--

ALTER TABLE ONLY iam.password_reset_tokens
    ADD CONSTRAINT password_reset_tokens_pkey PRIMARY KEY (id);


--
-- TOC entry 5337 (class 2606 OID 25628)
-- Name: password_reset_tokens password_reset_tokens_token_hash_key; Type: CONSTRAINT; Schema: iam; Owner: enterprise_app
--

ALTER TABLE ONLY iam.password_reset_tokens
    ADD CONSTRAINT password_reset_tokens_token_hash_key UNIQUE (token_hash);


--
-- TOC entry 5253 (class 2606 OID 24873)
-- Name: permissions permissions_name_key; Type: CONSTRAINT; Schema: iam; Owner: enterprise_app
--

ALTER TABLE ONLY iam.permissions
    ADD CONSTRAINT permissions_name_key UNIQUE (name);


--
-- TOC entry 5255 (class 2606 OID 24871)
-- Name: permissions permissions_pkey; Type: CONSTRAINT; Schema: iam; Owner: enterprise_app
--

ALTER TABLE ONLY iam.permissions
    ADD CONSTRAINT permissions_pkey PRIMARY KEY (id);


--
-- TOC entry 5261 (class 2606 OID 24907)
-- Name: role_permissions role_permissions_pkey; Type: CONSTRAINT; Schema: iam; Owner: enterprise_app
--

ALTER TABLE ONLY iam.role_permissions
    ADD CONSTRAINT role_permissions_pkey PRIMARY KEY (id);


--
-- TOC entry 5249 (class 2606 OID 24857)
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: iam; Owner: enterprise_app
--

ALTER TABLE ONLY iam.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id);


--
-- TOC entry 5238 (class 2606 OID 24795)
-- Name: company_users uq_company_users_company_user; Type: CONSTRAINT; Schema: iam; Owner: enterprise_app
--

ALTER TABLE ONLY iam.company_users
    ADD CONSTRAINT uq_company_users_company_user UNIQUE (company_id, user_id);


--
-- TOC entry 5240 (class 2606 OID 24797)
-- Name: company_users uq_company_users_employee_number; Type: CONSTRAINT; Schema: iam; Owner: enterprise_app
--

ALTER TABLE ONLY iam.company_users
    ADD CONSTRAINT uq_company_users_employee_number UNIQUE (company_id, employee_number);


--
-- TOC entry 5242 (class 2606 OID 25590)
-- Name: company_users uq_company_users_user; Type: CONSTRAINT; Schema: iam; Owner: enterprise_app
--

ALTER TABLE ONLY iam.company_users
    ADD CONSTRAINT uq_company_users_user UNIQUE (user_id);


--
-- TOC entry 5263 (class 2606 OID 24909)
-- Name: role_permissions uq_role_permissions_role_permission; Type: CONSTRAINT; Schema: iam; Owner: enterprise_app
--

ALTER TABLE ONLY iam.role_permissions
    ADD CONSTRAINT uq_role_permissions_role_permission UNIQUE (role_id, permission_id);


--
-- TOC entry 5251 (class 2606 OID 25599)
-- Name: roles uq_roles_company_name; Type: CONSTRAINT; Schema: iam; Owner: enterprise_app
--

ALTER TABLE ONLY iam.roles
    ADD CONSTRAINT uq_roles_company_name UNIQUE (company_id, name);


--
-- TOC entry 5257 (class 2606 OID 24886)
-- Name: user_roles uq_user_roles_user_role; Type: CONSTRAINT; Schema: iam; Owner: enterprise_app
--

ALTER TABLE ONLY iam.user_roles
    ADD CONSTRAINT uq_user_roles_user_role UNIQUE (company_user_id, role_id);


--
-- TOC entry 5259 (class 2606 OID 24884)
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: iam; Owner: enterprise_app
--

ALTER TABLE ONLY iam.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (id);


--
-- TOC entry 5232 (class 2606 OID 24777)
-- Name: users users_email_key; Type: CONSTRAINT; Schema: iam; Owner: enterprise_app
--

ALTER TABLE ONLY iam.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- TOC entry 5234 (class 2606 OID 24775)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: iam; Owner: enterprise_app
--

ALTER TABLE ONLY iam.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- TOC entry 5222 (class 2606 OID 24732)
-- Name: companies companies_pkey; Type: CONSTRAINT; Schema: organization; Owner: enterprise_app
--

ALTER TABLE ONLY organization.companies
    ADD CONSTRAINT companies_pkey PRIMARY KEY (id);


--
-- TOC entry 5225 (class 2606 OID 24746)
-- Name: departments departments_pkey; Type: CONSTRAINT; Schema: organization; Owner: enterprise_app
--

ALTER TABLE ONLY organization.departments
    ADD CONSTRAINT departments_pkey PRIMARY KEY (id);


--
-- TOC entry 5244 (class 2606 OID 24838)
-- Name: locations locations_pkey; Type: CONSTRAINT; Schema: organization; Owner: enterprise_app
--

ALTER TABLE ONLY organization.locations
    ADD CONSTRAINT locations_pkey PRIMARY KEY (id);


--
-- TOC entry 5227 (class 2606 OID 24750)
-- Name: departments uq_departments_company_code; Type: CONSTRAINT; Schema: organization; Owner: enterprise_app
--

ALTER TABLE ONLY organization.departments
    ADD CONSTRAINT uq_departments_company_code UNIQUE (company_id, code);


--
-- TOC entry 5229 (class 2606 OID 24748)
-- Name: departments uq_departments_company_name; Type: CONSTRAINT; Schema: organization; Owner: enterprise_app
--

ALTER TABLE ONLY organization.departments
    ADD CONSTRAINT uq_departments_company_name UNIQUE (company_id, name);


--
-- TOC entry 5246 (class 2606 OID 24840)
-- Name: locations uq_locations_company_code; Type: CONSTRAINT; Schema: organization; Owner: enterprise_app
--

ALTER TABLE ONLY organization.locations
    ADD CONSTRAINT uq_locations_company_code UNIQUE (company_id, code);


--
-- TOC entry 5312 (class 2606 OID 25377)
-- Name: approvals approvals_pkey; Type: CONSTRAINT; Schema: procurement; Owner: enterprise_app
--

ALTER TABLE ONLY procurement.approvals
    ADD CONSTRAINT approvals_pkey PRIMARY KEY (id);


--
-- TOC entry 5327 (class 2606 OID 25541)
-- Name: goods_receipt_items goods_receipt_items_pkey; Type: CONSTRAINT; Schema: procurement; Owner: enterprise_app
--

ALTER TABLE ONLY procurement.goods_receipt_items
    ADD CONSTRAINT goods_receipt_items_pkey PRIMARY KEY (id);


--
-- TOC entry 5323 (class 2606 OID 25502)
-- Name: goods_receipts goods_receipts_pkey; Type: CONSTRAINT; Schema: procurement; Owner: enterprise_app
--

ALTER TABLE ONLY procurement.goods_receipts
    ADD CONSTRAINT goods_receipts_pkey PRIMARY KEY (id);


--
-- TOC entry 5325 (class 2606 OID 25504)
-- Name: goods_receipts goods_receipts_receipt_number_key; Type: CONSTRAINT; Schema: procurement; Owner: enterprise_app
--

ALTER TABLE ONLY procurement.goods_receipts
    ADD CONSTRAINT goods_receipts_receipt_number_key UNIQUE (receipt_number);


--
-- TOC entry 5321 (class 2606 OID 25463)
-- Name: purchase_order_items purchase_order_items_pkey; Type: CONSTRAINT; Schema: procurement; Owner: enterprise_app
--

ALTER TABLE ONLY procurement.purchase_order_items
    ADD CONSTRAINT purchase_order_items_pkey PRIMARY KEY (id);


--
-- TOC entry 5317 (class 2606 OID 25415)
-- Name: purchase_orders purchase_orders_pkey; Type: CONSTRAINT; Schema: procurement; Owner: enterprise_app
--

ALTER TABLE ONLY procurement.purchase_orders
    ADD CONSTRAINT purchase_orders_pkey PRIMARY KEY (id);


--
-- TOC entry 5310 (class 2606 OID 25344)
-- Name: requisition_items requisition_items_pkey; Type: CONSTRAINT; Schema: procurement; Owner: enterprise_app
--

ALTER TABLE ONLY procurement.requisition_items
    ADD CONSTRAINT requisition_items_pkey PRIMARY KEY (id);


--
-- TOC entry 5306 (class 2606 OID 25303)
-- Name: requisitions requisitions_pkey; Type: CONSTRAINT; Schema: procurement; Owner: enterprise_app
--

ALTER TABLE ONLY procurement.requisitions
    ADD CONSTRAINT requisitions_pkey PRIMARY KEY (id);


--
-- TOC entry 5314 (class 2606 OID 25379)
-- Name: approvals uq_approvals_requisition_level; Type: CONSTRAINT; Schema: procurement; Owner: enterprise_app
--

ALTER TABLE ONLY procurement.approvals
    ADD CONSTRAINT uq_approvals_requisition_level UNIQUE (requisition_id, approval_level);


--
-- TOC entry 5319 (class 2606 OID 25417)
-- Name: purchase_orders uq_purchase_orders_company_po_number; Type: CONSTRAINT; Schema: procurement; Owner: enterprise_app
--

ALTER TABLE ONLY procurement.purchase_orders
    ADD CONSTRAINT uq_purchase_orders_company_po_number UNIQUE (company_id, po_number);


--
-- TOC entry 5308 (class 2606 OID 25305)
-- Name: requisitions uq_requisitions_company_number; Type: CONSTRAINT; Schema: procurement; Owner: enterprise_app
--

ALTER TABLE ONLY procurement.requisitions
    ADD CONSTRAINT uq_requisitions_company_number UNIQUE (company_id, requisition_number);


--
-- TOC entry 5329 (class 2606 OID 25583)
-- Name: typeorm_migrations PK_bb2f075707dd300ba86d0208923; Type: CONSTRAINT; Schema: public; Owner: enterprise_app
--

ALTER TABLE ONLY public.typeorm_migrations
    ADD CONSTRAINT "PK_bb2f075707dd300ba86d0208923" PRIMARY KEY (id);


--
-- TOC entry 5220 (class 2606 OID 24664)
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: enterprise_app
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- TOC entry 5279 (class 2606 OID 25037)
-- Name: supplier_company_profiles supplier_company_profiles_pkey; Type: CONSTRAINT; Schema: vendor; Owner: enterprise_app
--

ALTER TABLE ONLY vendor.supplier_company_profiles
    ADD CONSTRAINT supplier_company_profiles_pkey PRIMARY KEY (id);


--
-- TOC entry 5285 (class 2606 OID 25068)
-- Name: supplier_contacts supplier_contacts_pkey; Type: CONSTRAINT; Schema: vendor; Owner: enterprise_app
--

ALTER TABLE ONLY vendor.supplier_contacts
    ADD CONSTRAINT supplier_contacts_pkey PRIMARY KEY (id);


--
-- TOC entry 5287 (class 2606 OID 25092)
-- Name: supplier_documents supplier_documents_pkey; Type: CONSTRAINT; Schema: vendor; Owner: enterprise_app
--

ALTER TABLE ONLY vendor.supplier_documents
    ADD CONSTRAINT supplier_documents_pkey PRIMARY KEY (id);


--
-- TOC entry 5299 (class 2606 OID 25242)
-- Name: supplier_risk_assessments supplier_risk_assessments_pkey; Type: CONSTRAINT; Schema: vendor; Owner: enterprise_app
--

ALTER TABLE ONLY vendor.supplier_risk_assessments
    ADD CONSTRAINT supplier_risk_assessments_pkey PRIMARY KEY (id);


--
-- TOC entry 5277 (class 2606 OID 25016)
-- Name: suppliers suppliers_pkey; Type: CONSTRAINT; Schema: vendor; Owner: enterprise_app
--

ALTER TABLE ONLY vendor.suppliers
    ADD CONSTRAINT suppliers_pkey PRIMARY KEY (id);


--
-- TOC entry 5281 (class 2606 OID 25041)
-- Name: supplier_company_profiles uq_supplier_company_profiles_company_code; Type: CONSTRAINT; Schema: vendor; Owner: enterprise_app
--

ALTER TABLE ONLY vendor.supplier_company_profiles
    ADD CONSTRAINT uq_supplier_company_profiles_company_code UNIQUE (company_id, supplier_code);


--
-- TOC entry 5283 (class 2606 OID 25039)
-- Name: supplier_company_profiles uq_supplier_company_profiles_supplier_company; Type: CONSTRAINT; Schema: vendor; Owner: enterprise_app
--

ALTER TABLE ONLY vendor.supplier_company_profiles
    ADD CONSTRAINT uq_supplier_company_profiles_supplier_company UNIQUE (supplier_id, company_id);


--
-- TOC entry 5289 (class 2606 OID 25131)
-- Name: verification_cases verification_cases_case_number_key; Type: CONSTRAINT; Schema: vendor; Owner: enterprise_app
--

ALTER TABLE ONLY vendor.verification_cases
    ADD CONSTRAINT verification_cases_case_number_key UNIQUE (case_number);


--
-- TOC entry 5291 (class 2606 OID 25129)
-- Name: verification_cases verification_cases_pkey; Type: CONSTRAINT; Schema: vendor; Owner: enterprise_app
--

ALTER TABLE ONLY vendor.verification_cases
    ADD CONSTRAINT verification_cases_pkey PRIMARY KEY (id);


--
-- TOC entry 5293 (class 2606 OID 25162)
-- Name: verification_checks verification_checks_pkey; Type: CONSTRAINT; Schema: vendor; Owner: enterprise_app
--

ALTER TABLE ONLY vendor.verification_checks
    ADD CONSTRAINT verification_checks_pkey PRIMARY KEY (id);


--
-- TOC entry 5295 (class 2606 OID 25186)
-- Name: verification_evidence verification_evidence_pkey; Type: CONSTRAINT; Schema: vendor; Owner: enterprise_app
--

ALTER TABLE ONLY vendor.verification_evidence
    ADD CONSTRAINT verification_evidence_pkey PRIMARY KEY (id);


--
-- TOC entry 5297 (class 2606 OID 25216)
-- Name: verification_reviews verification_reviews_pkey; Type: CONSTRAINT; Schema: vendor; Owner: enterprise_app
--

ALTER TABLE ONLY vendor.verification_reviews
    ADD CONSTRAINT verification_reviews_pkey PRIMARY KEY (id);


--
-- TOC entry 5302 (class 1259 OID 25276)
-- Name: idx_audit_logs_company_created; Type: INDEX; Schema: audit; Owner: enterprise_app
--

CREATE INDEX idx_audit_logs_company_created ON audit.audit_logs USING btree (company_id, created_at);


--
-- TOC entry 5303 (class 1259 OID 25277)
-- Name: idx_audit_logs_entity; Type: INDEX; Schema: audit; Owner: enterprise_app
--

CREATE INDEX idx_audit_logs_entity ON audit.audit_logs USING btree (entity_type, entity_id);


--
-- TOC entry 5340 (class 1259 OID 25660)
-- Name: idx_auth_mail_pending; Type: INDEX; Schema: iam; Owner: enterprise_app
--

CREATE INDEX idx_auth_mail_pending ON iam.auth_mail_outbox USING btree (status, next_attempt_at);


--
-- TOC entry 5332 (class 1259 OID 25613)
-- Name: idx_auth_rate_window; Type: INDEX; Schema: iam; Owner: enterprise_app
--

CREATE INDEX idx_auth_rate_window ON iam.auth_rate_limits USING btree (window_start);


--
-- TOC entry 5333 (class 1259 OID 25634)
-- Name: idx_password_reset_user; Type: INDEX; Schema: iam; Owner: enterprise_app
--

CREATE INDEX idx_password_reset_user ON iam.password_reset_tokens USING btree (user_id);


--
-- TOC entry 5247 (class 1259 OID 25597)
-- Name: idx_roles_company_id; Type: INDEX; Schema: iam; Owner: enterprise_app
--

CREATE INDEX idx_roles_company_id ON iam.roles USING btree (company_id);


--
-- TOC entry 5230 (class 1259 OID 25600)
-- Name: uq_users_normalized_email; Type: INDEX; Schema: iam; Owner: enterprise_app
--

CREATE UNIQUE INDEX uq_users_normalized_email ON iam.users USING btree (lower(btrim((email)::text)));


--
-- TOC entry 5223 (class 1259 OID 24733)
-- Name: idx_companies_status; Type: INDEX; Schema: organization; Owner: enterprise_app
--

CREATE INDEX idx_companies_status ON organization.companies USING btree (status);


--
-- TOC entry 5315 (class 1259 OID 25438)
-- Name: idx_purchase_orders_status; Type: INDEX; Schema: procurement; Owner: enterprise_app
--

CREATE INDEX idx_purchase_orders_status ON procurement.purchase_orders USING btree (status);


--
-- TOC entry 5304 (class 1259 OID 25321)
-- Name: idx_requisitions_status; Type: INDEX; Schema: procurement; Owner: enterprise_app
--

CREATE INDEX idx_requisitions_status ON procurement.requisitions USING btree (status);


--
-- TOC entry 5398 (class 2620 OID 25663)
-- Name: audit_logs trg_audit_no_truncate; Type: TRIGGER; Schema: audit; Owner: enterprise_app
--

CREATE TRIGGER trg_audit_no_truncate BEFORE TRUNCATE ON audit.audit_logs FOR EACH STATEMENT EXECUTE FUNCTION audit.reject_audit_mutation();


--
-- TOC entry 5399 (class 2620 OID 25662)
-- Name: audit_logs trg_audit_no_update_delete; Type: TRIGGER; Schema: audit; Owner: enterprise_app
--

CREATE TRIGGER trg_audit_no_update_delete BEFORE DELETE OR UPDATE ON audit.audit_logs FOR EACH ROW EXECUTE FUNCTION audit.reject_audit_mutation();


--
-- TOC entry 5374 (class 2606 OID 25266)
-- Name: audit_logs audit_logs_company_id_fkey; Type: FK CONSTRAINT; Schema: audit; Owner: enterprise_app
--

ALTER TABLE ONLY audit.audit_logs
    ADD CONSTRAINT audit_logs_company_id_fkey FOREIGN KEY (company_id) REFERENCES organization.companies(id);


--
-- TOC entry 5375 (class 2606 OID 25271)
-- Name: audit_logs audit_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: audit; Owner: enterprise_app
--

ALTER TABLE ONLY audit.audit_logs
    ADD CONSTRAINT audit_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES iam.users(id);


--
-- TOC entry 5352 (class 2606 OID 24950)
-- Name: item_categories item_categories_company_id_fkey; Type: FK CONSTRAINT; Schema: catalog; Owner: enterprise_app
--

ALTER TABLE ONLY catalog.item_categories
    ADD CONSTRAINT item_categories_company_id_fkey FOREIGN KEY (company_id) REFERENCES organization.companies(id);


--
-- TOC entry 5353 (class 2606 OID 24955)
-- Name: item_categories item_categories_parent_id_fkey; Type: FK CONSTRAINT; Schema: catalog; Owner: enterprise_app
--

ALTER TABLE ONLY catalog.item_categories
    ADD CONSTRAINT item_categories_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES catalog.item_categories(id);


--
-- TOC entry 5354 (class 2606 OID 24990)
-- Name: items items_category_id_fkey; Type: FK CONSTRAINT; Schema: catalog; Owner: enterprise_app
--

ALTER TABLE ONLY catalog.items
    ADD CONSTRAINT items_category_id_fkey FOREIGN KEY (category_id) REFERENCES catalog.item_categories(id);


--
-- TOC entry 5355 (class 2606 OID 24985)
-- Name: items items_company_id_fkey; Type: FK CONSTRAINT; Schema: catalog; Owner: enterprise_app
--

ALTER TABLE ONLY catalog.items
    ADD CONSTRAINT items_company_id_fkey FOREIGN KEY (company_id) REFERENCES organization.companies(id);


--
-- TOC entry 5356 (class 2606 OID 24995)
-- Name: items items_unit_of_measure_id_fkey; Type: FK CONSTRAINT; Schema: catalog; Owner: enterprise_app
--

ALTER TABLE ONLY catalog.items
    ADD CONSTRAINT items_unit_of_measure_id_fkey FOREIGN KEY (unit_of_measure_id) REFERENCES catalog.units_of_measure(id);


--
-- TOC entry 5397 (class 2606 OID 25655)
-- Name: auth_mail_outbox auth_mail_outbox_user_id_fkey; Type: FK CONSTRAINT; Schema: iam; Owner: enterprise_app
--

ALTER TABLE ONLY iam.auth_mail_outbox
    ADD CONSTRAINT auth_mail_outbox_user_id_fkey FOREIGN KEY (user_id) REFERENCES iam.users(id) ON DELETE CASCADE;


--
-- TOC entry 5343 (class 2606 OID 24798)
-- Name: company_users company_users_company_id_fkey; Type: FK CONSTRAINT; Schema: iam; Owner: enterprise_app
--

ALTER TABLE ONLY iam.company_users
    ADD CONSTRAINT company_users_company_id_fkey FOREIGN KEY (company_id) REFERENCES organization.companies(id);


--
-- TOC entry 5344 (class 2606 OID 24808)
-- Name: company_users company_users_department_id_fkey; Type: FK CONSTRAINT; Schema: iam; Owner: enterprise_app
--

ALTER TABLE ONLY iam.company_users
    ADD CONSTRAINT company_users_department_id_fkey FOREIGN KEY (department_id) REFERENCES organization.departments(id);


--
-- TOC entry 5345 (class 2606 OID 24803)
-- Name: company_users company_users_user_id_fkey; Type: FK CONSTRAINT; Schema: iam; Owner: enterprise_app
--

ALTER TABLE ONLY iam.company_users
    ADD CONSTRAINT company_users_user_id_fkey FOREIGN KEY (user_id) REFERENCES iam.users(id);


--
-- TOC entry 5347 (class 2606 OID 25592)
-- Name: roles fk_roles_company; Type: FK CONSTRAINT; Schema: iam; Owner: enterprise_app
--

ALTER TABLE ONLY iam.roles
    ADD CONSTRAINT fk_roles_company FOREIGN KEY (company_id) REFERENCES organization.companies(id);


--
-- TOC entry 5396 (class 2606 OID 25629)
-- Name: password_reset_tokens password_reset_tokens_user_id_fkey; Type: FK CONSTRAINT; Schema: iam; Owner: enterprise_app
--

ALTER TABLE ONLY iam.password_reset_tokens
    ADD CONSTRAINT password_reset_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES iam.users(id) ON DELETE CASCADE;


--
-- TOC entry 5350 (class 2606 OID 24915)
-- Name: role_permissions role_permissions_permission_id_fkey; Type: FK CONSTRAINT; Schema: iam; Owner: enterprise_app
--

ALTER TABLE ONLY iam.role_permissions
    ADD CONSTRAINT role_permissions_permission_id_fkey FOREIGN KEY (permission_id) REFERENCES iam.permissions(id) ON DELETE CASCADE;


--
-- TOC entry 5351 (class 2606 OID 24910)
-- Name: role_permissions role_permissions_role_id_fkey; Type: FK CONSTRAINT; Schema: iam; Owner: enterprise_app
--

ALTER TABLE ONLY iam.role_permissions
    ADD CONSTRAINT role_permissions_role_id_fkey FOREIGN KEY (role_id) REFERENCES iam.roles(id) ON DELETE CASCADE;


--
-- TOC entry 5348 (class 2606 OID 24887)
-- Name: user_roles user_roles_company_user_id_fkey; Type: FK CONSTRAINT; Schema: iam; Owner: enterprise_app
--

ALTER TABLE ONLY iam.user_roles
    ADD CONSTRAINT user_roles_company_user_id_fkey FOREIGN KEY (company_user_id) REFERENCES iam.company_users(id) ON DELETE CASCADE;


--
-- TOC entry 5349 (class 2606 OID 24892)
-- Name: user_roles user_roles_role_id_fkey; Type: FK CONSTRAINT; Schema: iam; Owner: enterprise_app
--

ALTER TABLE ONLY iam.user_roles
    ADD CONSTRAINT user_roles_role_id_fkey FOREIGN KEY (role_id) REFERENCES iam.roles(id) ON DELETE CASCADE;


--
-- TOC entry 5341 (class 2606 OID 24751)
-- Name: departments departments_company_id_fkey; Type: FK CONSTRAINT; Schema: organization; Owner: enterprise_app
--

ALTER TABLE ONLY organization.departments
    ADD CONSTRAINT departments_company_id_fkey FOREIGN KEY (company_id) REFERENCES organization.companies(id);


--
-- TOC entry 5342 (class 2606 OID 24813)
-- Name: departments fk_departments_manager; Type: FK CONSTRAINT; Schema: organization; Owner: enterprise_app
--

ALTER TABLE ONLY organization.departments
    ADD CONSTRAINT fk_departments_manager FOREIGN KEY (manager_company_user_id) REFERENCES iam.company_users(id);


--
-- TOC entry 5346 (class 2606 OID 24841)
-- Name: locations locations_company_id_fkey; Type: FK CONSTRAINT; Schema: organization; Owner: enterprise_app
--

ALTER TABLE ONLY organization.locations
    ADD CONSTRAINT locations_company_id_fkey FOREIGN KEY (company_id) REFERENCES organization.companies(id);


--
-- TOC entry 5382 (class 2606 OID 25385)
-- Name: approvals approvals_approver_id_fkey; Type: FK CONSTRAINT; Schema: procurement; Owner: enterprise_app
--

ALTER TABLE ONLY procurement.approvals
    ADD CONSTRAINT approvals_approver_id_fkey FOREIGN KEY (approver_id) REFERENCES iam.company_users(id);


--
-- TOC entry 5383 (class 2606 OID 25380)
-- Name: approvals approvals_requisition_id_fkey; Type: FK CONSTRAINT; Schema: procurement; Owner: enterprise_app
--

ALTER TABLE ONLY procurement.approvals
    ADD CONSTRAINT approvals_requisition_id_fkey FOREIGN KEY (requisition_id) REFERENCES procurement.requisitions(id) ON DELETE CASCADE;


--
-- TOC entry 5394 (class 2606 OID 25542)
-- Name: goods_receipt_items goods_receipt_items_goods_receipt_id_fkey; Type: FK CONSTRAINT; Schema: procurement; Owner: enterprise_app
--

ALTER TABLE ONLY procurement.goods_receipt_items
    ADD CONSTRAINT goods_receipt_items_goods_receipt_id_fkey FOREIGN KEY (goods_receipt_id) REFERENCES procurement.goods_receipts(id) ON DELETE CASCADE;


--
-- TOC entry 5395 (class 2606 OID 25547)
-- Name: goods_receipt_items goods_receipt_items_purchase_order_item_id_fkey; Type: FK CONSTRAINT; Schema: procurement; Owner: enterprise_app
--

ALTER TABLE ONLY procurement.goods_receipt_items
    ADD CONSTRAINT goods_receipt_items_purchase_order_item_id_fkey FOREIGN KEY (purchase_order_item_id) REFERENCES procurement.purchase_order_items(id);


--
-- TOC entry 5392 (class 2606 OID 25505)
-- Name: goods_receipts goods_receipts_purchase_order_id_fkey; Type: FK CONSTRAINT; Schema: procurement; Owner: enterprise_app
--

ALTER TABLE ONLY procurement.goods_receipts
    ADD CONSTRAINT goods_receipts_purchase_order_id_fkey FOREIGN KEY (purchase_order_id) REFERENCES procurement.purchase_orders(id);


--
-- TOC entry 5393 (class 2606 OID 25510)
-- Name: goods_receipts goods_receipts_received_by_fkey; Type: FK CONSTRAINT; Schema: procurement; Owner: enterprise_app
--

ALTER TABLE ONLY procurement.goods_receipts
    ADD CONSTRAINT goods_receipts_received_by_fkey FOREIGN KEY (received_by) REFERENCES iam.company_users(id);


--
-- TOC entry 5388 (class 2606 OID 25474)
-- Name: purchase_order_items purchase_order_items_item_id_fkey; Type: FK CONSTRAINT; Schema: procurement; Owner: enterprise_app
--

ALTER TABLE ONLY procurement.purchase_order_items
    ADD CONSTRAINT purchase_order_items_item_id_fkey FOREIGN KEY (item_id) REFERENCES catalog.items(id);


--
-- TOC entry 5389 (class 2606 OID 25464)
-- Name: purchase_order_items purchase_order_items_purchase_order_id_fkey; Type: FK CONSTRAINT; Schema: procurement; Owner: enterprise_app
--

ALTER TABLE ONLY procurement.purchase_order_items
    ADD CONSTRAINT purchase_order_items_purchase_order_id_fkey FOREIGN KEY (purchase_order_id) REFERENCES procurement.purchase_orders(id) ON DELETE CASCADE;


--
-- TOC entry 5390 (class 2606 OID 25469)
-- Name: purchase_order_items purchase_order_items_requisition_item_id_fkey; Type: FK CONSTRAINT; Schema: procurement; Owner: enterprise_app
--

ALTER TABLE ONLY procurement.purchase_order_items
    ADD CONSTRAINT purchase_order_items_requisition_item_id_fkey FOREIGN KEY (requisition_item_id) REFERENCES procurement.requisition_items(id);


--
-- TOC entry 5391 (class 2606 OID 25479)
-- Name: purchase_order_items purchase_order_items_unit_of_measure_id_fkey; Type: FK CONSTRAINT; Schema: procurement; Owner: enterprise_app
--

ALTER TABLE ONLY procurement.purchase_order_items
    ADD CONSTRAINT purchase_order_items_unit_of_measure_id_fkey FOREIGN KEY (unit_of_measure_id) REFERENCES catalog.units_of_measure(id);


--
-- TOC entry 5384 (class 2606 OID 25433)
-- Name: purchase_orders purchase_orders_buyer_id_fkey; Type: FK CONSTRAINT; Schema: procurement; Owner: enterprise_app
--

ALTER TABLE ONLY procurement.purchase_orders
    ADD CONSTRAINT purchase_orders_buyer_id_fkey FOREIGN KEY (buyer_id) REFERENCES iam.company_users(id);


--
-- TOC entry 5385 (class 2606 OID 25418)
-- Name: purchase_orders purchase_orders_company_id_fkey; Type: FK CONSTRAINT; Schema: procurement; Owner: enterprise_app
--

ALTER TABLE ONLY procurement.purchase_orders
    ADD CONSTRAINT purchase_orders_company_id_fkey FOREIGN KEY (company_id) REFERENCES organization.companies(id);


--
-- TOC entry 5386 (class 2606 OID 25423)
-- Name: purchase_orders purchase_orders_requisition_id_fkey; Type: FK CONSTRAINT; Schema: procurement; Owner: enterprise_app
--

ALTER TABLE ONLY procurement.purchase_orders
    ADD CONSTRAINT purchase_orders_requisition_id_fkey FOREIGN KEY (requisition_id) REFERENCES procurement.requisitions(id);


--
-- TOC entry 5387 (class 2606 OID 25428)
-- Name: purchase_orders purchase_orders_supplier_id_fkey; Type: FK CONSTRAINT; Schema: procurement; Owner: enterprise_app
--

ALTER TABLE ONLY procurement.purchase_orders
    ADD CONSTRAINT purchase_orders_supplier_id_fkey FOREIGN KEY (supplier_id) REFERENCES vendor.supplier_company_profiles(id);


--
-- TOC entry 5379 (class 2606 OID 25350)
-- Name: requisition_items requisition_items_item_id_fkey; Type: FK CONSTRAINT; Schema: procurement; Owner: enterprise_app
--

ALTER TABLE ONLY procurement.requisition_items
    ADD CONSTRAINT requisition_items_item_id_fkey FOREIGN KEY (item_id) REFERENCES catalog.items(id);


--
-- TOC entry 5380 (class 2606 OID 25345)
-- Name: requisition_items requisition_items_requisition_id_fkey; Type: FK CONSTRAINT; Schema: procurement; Owner: enterprise_app
--

ALTER TABLE ONLY procurement.requisition_items
    ADD CONSTRAINT requisition_items_requisition_id_fkey FOREIGN KEY (requisition_id) REFERENCES procurement.requisitions(id) ON DELETE CASCADE;


--
-- TOC entry 5381 (class 2606 OID 25355)
-- Name: requisition_items requisition_items_unit_of_measure_id_fkey; Type: FK CONSTRAINT; Schema: procurement; Owner: enterprise_app
--

ALTER TABLE ONLY procurement.requisition_items
    ADD CONSTRAINT requisition_items_unit_of_measure_id_fkey FOREIGN KEY (unit_of_measure_id) REFERENCES catalog.units_of_measure(id);


--
-- TOC entry 5376 (class 2606 OID 25306)
-- Name: requisitions requisitions_company_id_fkey; Type: FK CONSTRAINT; Schema: procurement; Owner: enterprise_app
--

ALTER TABLE ONLY procurement.requisitions
    ADD CONSTRAINT requisitions_company_id_fkey FOREIGN KEY (company_id) REFERENCES organization.companies(id);


--
-- TOC entry 5377 (class 2606 OID 25316)
-- Name: requisitions requisitions_department_id_fkey; Type: FK CONSTRAINT; Schema: procurement; Owner: enterprise_app
--

ALTER TABLE ONLY procurement.requisitions
    ADD CONSTRAINT requisitions_department_id_fkey FOREIGN KEY (department_id) REFERENCES organization.departments(id);


--
-- TOC entry 5378 (class 2606 OID 25311)
-- Name: requisitions requisitions_requester_id_fkey; Type: FK CONSTRAINT; Schema: procurement; Owner: enterprise_app
--

ALTER TABLE ONLY procurement.requisitions
    ADD CONSTRAINT requisitions_requester_id_fkey FOREIGN KEY (requester_id) REFERENCES iam.company_users(id);


--
-- TOC entry 5357 (class 2606 OID 25047)
-- Name: supplier_company_profiles supplier_company_profiles_company_id_fkey; Type: FK CONSTRAINT; Schema: vendor; Owner: enterprise_app
--

ALTER TABLE ONLY vendor.supplier_company_profiles
    ADD CONSTRAINT supplier_company_profiles_company_id_fkey FOREIGN KEY (company_id) REFERENCES organization.companies(id);


--
-- TOC entry 5358 (class 2606 OID 25042)
-- Name: supplier_company_profiles supplier_company_profiles_supplier_id_fkey; Type: FK CONSTRAINT; Schema: vendor; Owner: enterprise_app
--

ALTER TABLE ONLY vendor.supplier_company_profiles
    ADD CONSTRAINT supplier_company_profiles_supplier_id_fkey FOREIGN KEY (supplier_id) REFERENCES vendor.suppliers(id);


--
-- TOC entry 5359 (class 2606 OID 25069)
-- Name: supplier_contacts supplier_contacts_supplier_id_fkey; Type: FK CONSTRAINT; Schema: vendor; Owner: enterprise_app
--

ALTER TABLE ONLY vendor.supplier_contacts
    ADD CONSTRAINT supplier_contacts_supplier_id_fkey FOREIGN KEY (supplier_id) REFERENCES vendor.suppliers(id) ON DELETE CASCADE;


--
-- TOC entry 5360 (class 2606 OID 25098)
-- Name: supplier_documents supplier_documents_supplier_company_profile_id_fkey; Type: FK CONSTRAINT; Schema: vendor; Owner: enterprise_app
--

ALTER TABLE ONLY vendor.supplier_documents
    ADD CONSTRAINT supplier_documents_supplier_company_profile_id_fkey FOREIGN KEY (supplier_company_profile_id) REFERENCES vendor.supplier_company_profiles(id);


--
-- TOC entry 5361 (class 2606 OID 25093)
-- Name: supplier_documents supplier_documents_supplier_id_fkey; Type: FK CONSTRAINT; Schema: vendor; Owner: enterprise_app
--

ALTER TABLE ONLY vendor.supplier_documents
    ADD CONSTRAINT supplier_documents_supplier_id_fkey FOREIGN KEY (supplier_id) REFERENCES vendor.suppliers(id) ON DELETE CASCADE;


--
-- TOC entry 5362 (class 2606 OID 25103)
-- Name: supplier_documents supplier_documents_uploaded_by_fkey; Type: FK CONSTRAINT; Schema: vendor; Owner: enterprise_app
--

ALTER TABLE ONLY vendor.supplier_documents
    ADD CONSTRAINT supplier_documents_uploaded_by_fkey FOREIGN KEY (uploaded_by) REFERENCES iam.users(id);


--
-- TOC entry 5372 (class 2606 OID 25248)
-- Name: supplier_risk_assessments supplier_risk_assessments_assessed_by_fkey; Type: FK CONSTRAINT; Schema: vendor; Owner: enterprise_app
--

ALTER TABLE ONLY vendor.supplier_risk_assessments
    ADD CONSTRAINT supplier_risk_assessments_assessed_by_fkey FOREIGN KEY (assessed_by) REFERENCES iam.users(id);


--
-- TOC entry 5373 (class 2606 OID 25243)
-- Name: supplier_risk_assessments supplier_risk_assessments_verification_case_id_fkey; Type: FK CONSTRAINT; Schema: vendor; Owner: enterprise_app
--

ALTER TABLE ONLY vendor.supplier_risk_assessments
    ADD CONSTRAINT supplier_risk_assessments_verification_case_id_fkey FOREIGN KEY (verification_case_id) REFERENCES vendor.verification_cases(id) ON DELETE CASCADE;


--
-- TOC entry 5363 (class 2606 OID 25137)
-- Name: verification_cases verification_cases_opened_by_fkey; Type: FK CONSTRAINT; Schema: vendor; Owner: enterprise_app
--

ALTER TABLE ONLY vendor.verification_cases
    ADD CONSTRAINT verification_cases_opened_by_fkey FOREIGN KEY (opened_by) REFERENCES iam.users(id);


--
-- TOC entry 5364 (class 2606 OID 25132)
-- Name: verification_cases verification_cases_supplier_company_profile_id_fkey; Type: FK CONSTRAINT; Schema: vendor; Owner: enterprise_app
--

ALTER TABLE ONLY vendor.verification_cases
    ADD CONSTRAINT verification_cases_supplier_company_profile_id_fkey FOREIGN KEY (supplier_company_profile_id) REFERENCES vendor.supplier_company_profiles(id);


--
-- TOC entry 5365 (class 2606 OID 25168)
-- Name: verification_checks verification_checks_checked_by_fkey; Type: FK CONSTRAINT; Schema: vendor; Owner: enterprise_app
--

ALTER TABLE ONLY vendor.verification_checks
    ADD CONSTRAINT verification_checks_checked_by_fkey FOREIGN KEY (checked_by) REFERENCES iam.users(id);


--
-- TOC entry 5366 (class 2606 OID 25163)
-- Name: verification_checks verification_checks_verification_case_id_fkey; Type: FK CONSTRAINT; Schema: vendor; Owner: enterprise_app
--

ALTER TABLE ONLY vendor.verification_checks
    ADD CONSTRAINT verification_checks_verification_case_id_fkey FOREIGN KEY (verification_case_id) REFERENCES vendor.verification_cases(id) ON DELETE CASCADE;


--
-- TOC entry 5367 (class 2606 OID 25192)
-- Name: verification_evidence verification_evidence_supplier_document_id_fkey; Type: FK CONSTRAINT; Schema: vendor; Owner: enterprise_app
--

ALTER TABLE ONLY vendor.verification_evidence
    ADD CONSTRAINT verification_evidence_supplier_document_id_fkey FOREIGN KEY (supplier_document_id) REFERENCES vendor.supplier_documents(id);


--
-- TOC entry 5368 (class 2606 OID 25197)
-- Name: verification_evidence verification_evidence_uploaded_by_fkey; Type: FK CONSTRAINT; Schema: vendor; Owner: enterprise_app
--

ALTER TABLE ONLY vendor.verification_evidence
    ADD CONSTRAINT verification_evidence_uploaded_by_fkey FOREIGN KEY (uploaded_by) REFERENCES iam.users(id);


--
-- TOC entry 5369 (class 2606 OID 25187)
-- Name: verification_evidence verification_evidence_verification_check_id_fkey; Type: FK CONSTRAINT; Schema: vendor; Owner: enterprise_app
--

ALTER TABLE ONLY vendor.verification_evidence
    ADD CONSTRAINT verification_evidence_verification_check_id_fkey FOREIGN KEY (verification_check_id) REFERENCES vendor.verification_checks(id) ON DELETE CASCADE;


--
-- TOC entry 5370 (class 2606 OID 25222)
-- Name: verification_reviews verification_reviews_reviewer_user_id_fkey; Type: FK CONSTRAINT; Schema: vendor; Owner: enterprise_app
--

ALTER TABLE ONLY vendor.verification_reviews
    ADD CONSTRAINT verification_reviews_reviewer_user_id_fkey FOREIGN KEY (reviewer_user_id) REFERENCES iam.users(id);


--
-- TOC entry 5371 (class 2606 OID 25217)
-- Name: verification_reviews verification_reviews_verification_case_id_fkey; Type: FK CONSTRAINT; Schema: vendor; Owner: enterprise_app
--

ALTER TABLE ONLY vendor.verification_reviews
    ADD CONSTRAINT verification_reviews_verification_case_id_fkey FOREIGN KEY (verification_case_id) REFERENCES vendor.verification_cases(id) ON DELETE CASCADE;


--
-- TOC entry 5552 (class 0 OID 0)
-- Dependencies: 8
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: pg_database_owner
--

GRANT ALL ON SCHEMA public TO enterprise_app;


-- Completed on 2026-10-19 11:54:34

--
-- PostgreSQL database dump complete
--

\unrestrict JIXU6yyviMT9ucVzBdxkLzDaqn2m7mtEwi6zkQ343Bvv4S3zoOUrdjLBTo3cX30

