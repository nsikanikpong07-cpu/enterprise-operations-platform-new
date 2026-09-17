--
-- PostgreSQL database dump
--

\restrict ubQALUFmtjvABfBEQWehVIO2hXtlCakvOnlddYdfVcL6uCtnDtDeTVqDOtTcdgF

-- Dumped from database version 18.6
-- Dumped by pg_dump version 18.6

-- Started on 2026-09-16 14:23:44

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
-- TOC entry 2 (class 3079 OID 17045)
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- TOC entry 5282 (class 0 OID 0)
-- Dependencies: 2
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- TOC entry 278 (class 1255 OID 17244)
-- Name: apply_stock_movement(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.apply_stock_movement() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF NEW.movement_type IN ('STOCK_IN', 'RETURN') THEN
        UPDATE items SET current_quantity = current_quantity + NEW.quantity, updated_at = now() WHERE item_id = NEW.item_id;
    ELSIF NEW.movement_type = 'STOCK_OUT' THEN
        UPDATE items SET current_quantity = current_quantity - NEW.quantity, updated_at = now() WHERE item_id = NEW.item_id;
    ELSIF NEW.movement_type = 'ADJUSTMENT' THEN
        UPDATE items SET current_quantity = current_quantity + NEW.quantity, updated_at = now() WHERE item_id = NEW.item_id;
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.apply_stock_movement() OWNER TO postgres;

--
-- TOC entry 279 (class 1255 OID 17378)
-- Name: enforce_verified_vendor(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.enforce_verified_vendor() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_status VARCHAR(20);
BEGIN
    SELECT status INTO v_status FROM vendors WHERE vendor_id = NEW.supplier_id;
    IF v_status IS DISTINCT FROM 'VERIFIED' THEN
        RAISE EXCEPTION 'Cannot issue a purchase order to vendor %: status is %, must be VERIFIED', NEW.supplier_id, v_status;
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.enforce_verified_vendor() OWNER TO postgres;

--
-- TOC entry 277 (class 1255 OID 17164)
-- Name: recalculate_vendor_score(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.recalculate_vendor_score() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_total INTEGER;
    v_status VARCHAR(20);
BEGIN
    SELECT COALESCE(SUM(latest.score_awarded), 0) INTO v_total
    FROM (
        SELECT DISTINCT ON (check_category) check_category, score_awarded
        FROM verification_logs
        WHERE vendor_id = NEW.vendor_id
        ORDER BY check_category, checked_at DESC
    ) latest;
 
    SELECT status INTO v_status FROM decision_thresholds WHERE v_total BETWEEN min_score AND max_score;
 
    UPDATE vendors
    SET total_score = v_total,
        status = COALESCE(v_status, 'PENDING'),
        registration_valid = (SELECT result = 'PASS' FROM verification_logs WHERE vendor_id = NEW.vendor_id AND check_category = 'Registration' ORDER BY checked_at DESC LIMIT 1),
        tax_valid = (SELECT result = 'PASS' FROM verification_logs WHERE vendor_id = NEW.vendor_id AND check_category = 'Tax' ORDER BY checked_at DESC LIMIT 1),
        bank_match = (SELECT result = 'PASS' FROM verification_logs WHERE vendor_id = NEW.vendor_id AND check_category = 'Bank' ORDER BY checked_at DESC LIMIT 1),
        documents_complete = (SELECT result = 'PASS' FROM verification_logs WHERE vendor_id = NEW.vendor_id AND check_category = 'Documents' ORDER BY checked_at DESC LIMIT 1),
        updated_at = now()
    WHERE vendor_id = NEW.vendor_id;
 
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.recalculate_vendor_score() OWNER TO postgres;

--
-- TOC entry 281 (class 1255 OID 17551)
-- Name: sync_asset_assignment(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.sync_asset_assignment() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF NEW.assignment_status = 'Active' THEN
        UPDATE assets SET assigned_user_id = NEW.assigned_user_id, status = 'Assigned', updated_at = now() WHERE asset_id = NEW.asset_id;
    ELSIF NEW.assignment_status = 'Returned' THEN
        UPDATE assets SET assigned_user_id = NULL, status = 'Unassigned', updated_at = now() WHERE asset_id = NEW.asset_id;
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.sync_asset_assignment() OWNER TO postgres;

--
-- TOC entry 282 (class 1255 OID 17553)
-- Name: sync_asset_service_date(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.sync_asset_service_date() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    UPDATE assets SET expected_service_date = NEW.next_service_date, updated_at = now() WHERE asset_id = NEW.asset_id;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.sync_asset_service_date() OWNER TO postgres;

--
-- TOC entry 280 (class 1255 OID 17475)
-- Name: sync_goods_receipt_to_inventory(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.sync_goods_receipt_to_inventory() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_item_id INTEGER;
    v_received_by INTEGER;
BEGIN
    SELECT poi.item_id INTO v_item_id
    FROM purchase_order_item poi WHERE poi.purchase_order_item_id = NEW.purchase_order_item_id;
 
    SELECT gr.received_by INTO v_received_by
    FROM goods_receipt gr WHERE gr.goods_receipt_id = NEW.goods_receipt_id;
 
    IF NEW.quantity_accepted > 0 THEN
        INSERT INTO stock_movements (item_id, movement_type, quantity, movement_reason, performed_by, reference_number)
        VALUES (v_item_id, 'STOCK_IN', NEW.quantity_accepted, 'Goods receipt', v_received_by,
                'GR-ITEM-' || NEW.goods_receipt_item_id);
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.sync_goods_receipt_to_inventory() OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 240 (class 1259 OID 17314)
-- Name: approval; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.approval (
    approval_id integer NOT NULL,
    requisition_id integer NOT NULL,
    approver_id integer NOT NULL,
    approval_level integer NOT NULL,
    approval_status character varying(30) NOT NULL,
    approval_date timestamp without time zone,
    comments character varying(500),
    rejection_reason character varying(500),
    CONSTRAINT approval_approval_level_check CHECK ((approval_level > 0)),
    CONSTRAINT approval_approval_status_check CHECK (((approval_status)::text = ANY ((ARRAY['Pending'::character varying, 'Approved'::character varying, 'Rejected'::character varying])::text[]))),
    CONSTRAINT chk_approval_rejection_reason CHECK (((((approval_status)::text = 'Rejected'::text) AND (rejection_reason IS NOT NULL)) OR ((approval_status)::text <> 'Rejected'::text)))
);


ALTER TABLE public.approval OWNER TO postgres;

--
-- TOC entry 239 (class 1259 OID 17313)
-- Name: approval_approval_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.approval_approval_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.approval_approval_id_seq OWNER TO postgres;

--
-- TOC entry 5283 (class 0 OID 0)
-- Dependencies: 239
-- Name: approval_approval_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.approval_approval_id_seq OWNED BY public.approval.approval_id;


--
-- TOC entry 252 (class 1259 OID 17500)
-- Name: asset_assignments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.asset_assignments (
    assignment_id integer NOT NULL,
    asset_id integer NOT NULL,
    assigned_user_id integer NOT NULL,
    assignment_date date NOT NULL,
    return_date date,
    assignment_status character varying(20) DEFAULT 'Active'::character varying NOT NULL,
    CONSTRAINT asset_assignments_assignment_status_check CHECK (((assignment_status)::text = ANY ((ARRAY['Active'::character varying, 'Returned'::character varying])::text[]))),
    CONSTRAINT chk_return_after_assignment CHECK (((return_date IS NULL) OR (return_date >= assignment_date))),
    CONSTRAINT chk_status_matches_return CHECK (((((assignment_status)::text = 'Active'::text) AND (return_date IS NULL)) OR (((assignment_status)::text = 'Returned'::text) AND (return_date IS NOT NULL))))
);


ALTER TABLE public.asset_assignments OWNER TO postgres;

--
-- TOC entry 251 (class 1259 OID 17499)
-- Name: asset_assignments_assignment_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.asset_assignments_assignment_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.asset_assignments_assignment_id_seq OWNER TO postgres;

--
-- TOC entry 5284 (class 0 OID 0)
-- Dependencies: 251
-- Name: asset_assignments_assignment_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.asset_assignments_assignment_id_seq OWNED BY public.asset_assignments.assignment_id;


--
-- TOC entry 250 (class 1259 OID 17478)
-- Name: assets; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.assets (
    asset_id integer NOT NULL,
    asset_type character varying(50) NOT NULL,
    location character varying(150) NOT NULL,
    purchase_date date NOT NULL,
    assigned_user_id integer,
    status character varying(30) NOT NULL,
    expected_service_date date,
    expected_lifespan_years integer,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    CONSTRAINT assets_status_check CHECK (((status)::text = ANY ((ARRAY['Unassigned'::character varying, 'Assigned'::character varying, 'In Maintenance'::character varying, 'Retired'::character varying, 'Disposed'::character varying])::text[])))
);


ALTER TABLE public.assets OWNER TO postgres;

--
-- TOC entry 249 (class 1259 OID 17477)
-- Name: assets_asset_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.assets_asset_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.assets_asset_id_seq OWNER TO postgres;

--
-- TOC entry 5285 (class 0 OID 0)
-- Dependencies: 249
-- Name: assets_asset_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.assets_asset_id_seq OWNED BY public.assets.asset_id;


--
-- TOC entry 226 (class 1259 OID 17123)
-- Name: decision_thresholds; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.decision_thresholds (
    status character varying(20) NOT NULL,
    min_score integer NOT NULL,
    max_score integer NOT NULL,
    CONSTRAINT decision_thresholds_status_check CHECK (((status)::text = ANY ((ARRAY['VERIFIED'::character varying, 'FLAGGED'::character varying, 'REJECTED'::character varying])::text[])))
);


ALTER TABLE public.decision_thresholds OWNER TO postgres;

--
-- TOC entry 221 (class 1259 OID 17057)
-- Name: departments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.departments (
    department_id integer NOT NULL,
    department_name character varying(100) NOT NULL
);


ALTER TABLE public.departments OWNER TO postgres;

--
-- TOC entry 220 (class 1259 OID 17056)
-- Name: departments_department_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.departments_department_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.departments_department_id_seq OWNER TO postgres;

--
-- TOC entry 5286 (class 0 OID 0)
-- Dependencies: 220
-- Name: departments_department_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.departments_department_id_seq OWNED BY public.departments.department_id;


--
-- TOC entry 246 (class 1259 OID 17416)
-- Name: goods_receipt; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.goods_receipt (
    goods_receipt_id integer NOT NULL,
    receipt_number character varying(50) NOT NULL,
    purchase_order_id integer NOT NULL,
    received_by integer NOT NULL,
    receipt_date timestamp without time zone NOT NULL,
    delivery_note_number character varying(100),
    receipt_status character varying(30) NOT NULL,
    remarks character varying(500),
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.goods_receipt OWNER TO postgres;

--
-- TOC entry 245 (class 1259 OID 17415)
-- Name: goods_receipt_goods_receipt_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.goods_receipt_goods_receipt_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.goods_receipt_goods_receipt_id_seq OWNER TO postgres;

--
-- TOC entry 5287 (class 0 OID 0)
-- Dependencies: 245
-- Name: goods_receipt_goods_receipt_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.goods_receipt_goods_receipt_id_seq OWNED BY public.goods_receipt.goods_receipt_id;


--
-- TOC entry 248 (class 1259 OID 17445)
-- Name: goods_receipt_item; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.goods_receipt_item (
    goods_receipt_item_id integer NOT NULL,
    goods_receipt_id integer NOT NULL,
    purchase_order_item_id integer NOT NULL,
    quantity_received numeric(15,2) NOT NULL,
    quantity_accepted numeric(15,2) NOT NULL,
    quantity_rejected numeric(15,2) NOT NULL,
    rejection_reason character varying(500),
    condition_status character varying(30) NOT NULL,
    inspection_status character varying(30) NOT NULL,
    received_date timestamp without time zone NOT NULL,
    CONSTRAINT chk_accepted_le_received CHECK ((quantity_accepted <= quantity_received)),
    CONSTRAINT chk_rejected_le_received CHECK ((quantity_rejected <= quantity_received)),
    CONSTRAINT goods_receipt_item_quantity_received_check CHECK ((quantity_received >= (0)::numeric))
);


ALTER TABLE public.goods_receipt_item OWNER TO postgres;

--
-- TOC entry 247 (class 1259 OID 17444)
-- Name: goods_receipt_item_goods_receipt_item_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.goods_receipt_item_goods_receipt_item_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.goods_receipt_item_goods_receipt_item_id_seq OWNER TO postgres;

--
-- TOC entry 5288 (class 0 OID 0)
-- Dependencies: 247
-- Name: goods_receipt_item_goods_receipt_item_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.goods_receipt_item_goods_receipt_item_id_seq OWNED BY public.goods_receipt_item.goods_receipt_item_id;


--
-- TOC entry 229 (class 1259 OID 17167)
-- Name: items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.items (
    item_id integer NOT NULL,
    sku character varying(50) NOT NULL,
    item_name character varying(150) NOT NULL,
    category character varying(50) NOT NULL,
    current_quantity numeric(15,2) DEFAULT 0 NOT NULL,
    reorder_level numeric(15,2) DEFAULT 0 NOT NULL,
    unit character varying(20) NOT NULL,
    location character varying(100) NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    CONSTRAINT items_current_quantity_check CHECK ((current_quantity >= (0)::numeric)),
    CONSTRAINT items_reorder_level_check CHECK ((reorder_level >= (0)::numeric))
);


ALTER TABLE public.items OWNER TO postgres;

--
-- TOC entry 228 (class 1259 OID 17166)
-- Name: items_item_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.items_item_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.items_item_id_seq OWNER TO postgres;

--
-- TOC entry 5289 (class 0 OID 0)
-- Dependencies: 228
-- Name: items_item_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.items_item_id_seq OWNED BY public.items.item_id;


--
-- TOC entry 254 (class 1259 OID 17527)
-- Name: maintenance_records; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.maintenance_records (
    maintenance_id integer NOT NULL,
    asset_id integer NOT NULL,
    last_service_date date NOT NULL,
    next_service_date date,
    service_notes character varying(500),
    performed_by integer,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    CONSTRAINT chk_next_after_last CHECK (((next_service_date IS NULL) OR (next_service_date >= last_service_date)))
);


ALTER TABLE public.maintenance_records OWNER TO postgres;

--
-- TOC entry 253 (class 1259 OID 17526)
-- Name: maintenance_records_maintenance_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.maintenance_records_maintenance_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.maintenance_records_maintenance_id_seq OWNER TO postgres;

--
-- TOC entry 5290 (class 0 OID 0)
-- Dependencies: 253
-- Name: maintenance_records_maintenance_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.maintenance_records_maintenance_id_seq OWNED BY public.maintenance_records.maintenance_id;


--
-- TOC entry 242 (class 1259 OID 17341)
-- Name: purchase_order; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.purchase_order (
    purchase_order_id integer NOT NULL,
    po_number character varying(50) NOT NULL,
    requisition_id integer NOT NULL,
    supplier_id uuid NOT NULL,
    buyer_id integer NOT NULL,
    order_date date NOT NULL,
    expected_delivery_date date,
    currency character(3) NOT NULL,
    total_amount numeric(15,2) NOT NULL,
    status character varying(30) NOT NULL,
    payment_terms character varying(100),
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    CONSTRAINT purchase_order_total_amount_check CHECK ((total_amount >= (0)::numeric))
);


ALTER TABLE public.purchase_order OWNER TO postgres;

--
-- TOC entry 244 (class 1259 OID 17381)
-- Name: purchase_order_item; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.purchase_order_item (
    purchase_order_item_id integer NOT NULL,
    purchase_order_id integer NOT NULL,
    requisition_item_id integer NOT NULL,
    item_id integer NOT NULL,
    description character varying(500) NOT NULL,
    quantity_ordered numeric(15,2) NOT NULL,
    unit_of_measure character varying(20) NOT NULL,
    unit_price numeric(15,2) NOT NULL,
    line_total numeric(15,2) NOT NULL,
    delivery_date date,
    item_status character varying(30) NOT NULL,
    CONSTRAINT purchase_order_item_quantity_ordered_check CHECK ((quantity_ordered > (0)::numeric))
);


ALTER TABLE public.purchase_order_item OWNER TO postgres;

--
-- TOC entry 243 (class 1259 OID 17380)
-- Name: purchase_order_item_purchase_order_item_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.purchase_order_item_purchase_order_item_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.purchase_order_item_purchase_order_item_id_seq OWNER TO postgres;

--
-- TOC entry 5291 (class 0 OID 0)
-- Dependencies: 243
-- Name: purchase_order_item_purchase_order_item_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.purchase_order_item_purchase_order_item_id_seq OWNED BY public.purchase_order_item.purchase_order_item_id;


--
-- TOC entry 241 (class 1259 OID 17340)
-- Name: purchase_order_purchase_order_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.purchase_order_purchase_order_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.purchase_order_purchase_order_id_seq OWNER TO postgres;

--
-- TOC entry 5292 (class 0 OID 0)
-- Dependencies: 241
-- Name: purchase_order_purchase_order_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.purchase_order_purchase_order_id_seq OWNED BY public.purchase_order.purchase_order_id;


--
-- TOC entry 233 (class 1259 OID 17220)
-- Name: reconciliations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.reconciliations (
    reconciliation_id integer NOT NULL,
    item_id integer NOT NULL,
    expected_quantity numeric(15,2) NOT NULL,
    actual_quantity numeric(15,2) NOT NULL,
    difference numeric(15,2) GENERATED ALWAYS AS ((actual_quantity - expected_quantity)) STORED,
    adjustment_reason character varying(255) NOT NULL,
    adjusted_by integer,
    reconciliation_date date DEFAULT CURRENT_DATE NOT NULL
);


ALTER TABLE public.reconciliations OWNER TO postgres;

--
-- TOC entry 232 (class 1259 OID 17219)
-- Name: reconciliations_reconciliation_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.reconciliations_reconciliation_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.reconciliations_reconciliation_id_seq OWNER TO postgres;

--
-- TOC entry 5293 (class 0 OID 0)
-- Dependencies: 232
-- Name: reconciliations_reconciliation_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.reconciliations_reconciliation_id_seq OWNED BY public.reconciliations.reconciliation_id;


--
-- TOC entry 236 (class 1259 OID 17251)
-- Name: requisition; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.requisition (
    requisition_id integer NOT NULL,
    requisition_number character varying(50) NOT NULL,
    requester_id integer NOT NULL,
    department_id integer NOT NULL,
    request_date date NOT NULL,
    required_date date,
    status character varying(30) NOT NULL,
    justification character varying(500) NOT NULL,
    approval_status character varying(30) NOT NULL,
    total_estimated_amount numeric(15,2),
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    CONSTRAINT requisition_approval_status_check CHECK (((approval_status)::text = ANY ((ARRAY['Pending'::character varying, 'Approved'::character varying, 'Rejected'::character varying])::text[]))),
    CONSTRAINT requisition_status_check CHECK (((status)::text = ANY ((ARRAY['Draft'::character varying, 'Submitted'::character varying, 'Pending'::character varying, 'Approved'::character varying, 'Rejected'::character varying, 'Cancelled'::character varying, 'Completed'::character varying])::text[])))
);


ALTER TABLE public.requisition OWNER TO postgres;

--
-- TOC entry 238 (class 1259 OID 17286)
-- Name: requisition_item; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.requisition_item (
    requisition_item_id integer NOT NULL,
    requisition_id integer NOT NULL,
    item_id integer NOT NULL,
    description character varying(500) NOT NULL,
    quantity_requested numeric(15,2) NOT NULL,
    unit_of_measure character varying(20) NOT NULL,
    estimated_unit_price numeric(15,2),
    estimated_total_price numeric(15,2),
    required_date date,
    item_status character varying(30) NOT NULL,
    CONSTRAINT requisition_item_item_status_check CHECK (((item_status)::text = ANY ((ARRAY['Draft'::character varying, 'Submitted'::character varying, 'Pending'::character varying, 'Approved'::character varying, 'Rejected'::character varying, 'Cancelled'::character varying, 'Completed'::character varying])::text[]))),
    CONSTRAINT requisition_item_quantity_requested_check CHECK ((quantity_requested > (0)::numeric))
);


ALTER TABLE public.requisition_item OWNER TO postgres;

--
-- TOC entry 237 (class 1259 OID 17285)
-- Name: requisition_item_requisition_item_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.requisition_item_requisition_item_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.requisition_item_requisition_item_id_seq OWNER TO postgres;

--
-- TOC entry 5294 (class 0 OID 0)
-- Dependencies: 237
-- Name: requisition_item_requisition_item_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.requisition_item_requisition_item_id_seq OWNED BY public.requisition_item.requisition_item_id;


--
-- TOC entry 235 (class 1259 OID 17250)
-- Name: requisition_requisition_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.requisition_requisition_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.requisition_requisition_id_seq OWNER TO postgres;

--
-- TOC entry 5295 (class 0 OID 0)
-- Dependencies: 235
-- Name: requisition_requisition_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.requisition_requisition_id_seq OWNED BY public.requisition.requisition_id;


--
-- TOC entry 225 (class 1259 OID 17112)
-- Name: scoring_rules; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.scoring_rules (
    check_category character varying(30) NOT NULL,
    verification_check character varying(100) NOT NULL,
    condition_description character varying(200) NOT NULL,
    score_points integer NOT NULL,
    CONSTRAINT scoring_rules_check_category_check CHECK (((check_category)::text = ANY ((ARRAY['Registration'::character varying, 'Tax'::character varying, 'Bank'::character varying, 'Documents'::character varying])::text[]))),
    CONSTRAINT scoring_rules_score_points_check CHECK ((score_points >= 0))
);


ALTER TABLE public.scoring_rules OWNER TO postgres;

--
-- TOC entry 231 (class 1259 OID 17193)
-- Name: stock_movements; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.stock_movements (
    movement_id integer NOT NULL,
    item_id integer NOT NULL,
    movement_type character varying(20) NOT NULL,
    quantity numeric(15,2) NOT NULL,
    movement_reason character varying(255),
    performed_by integer,
    reference_number character varying(50),
    movement_date timestamp without time zone DEFAULT now() NOT NULL,
    CONSTRAINT chk_adjustment_reason CHECK ((((movement_type)::text <> 'ADJUSTMENT'::text) OR (movement_reason IS NOT NULL))),
    CONSTRAINT stock_movements_movement_type_check CHECK (((movement_type)::text = ANY ((ARRAY['STOCK_IN'::character varying, 'STOCK_OUT'::character varying, 'ADJUSTMENT'::character varying, 'RETURN'::character varying])::text[]))),
    CONSTRAINT stock_movements_quantity_check CHECK ((quantity <> (0)::numeric))
);


ALTER TABLE public.stock_movements OWNER TO postgres;

--
-- TOC entry 230 (class 1259 OID 17192)
-- Name: stock_movements_movement_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.stock_movements_movement_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.stock_movements_movement_id_seq OWNER TO postgres;

--
-- TOC entry 5296 (class 0 OID 0)
-- Dependencies: 230
-- Name: stock_movements_movement_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.stock_movements_movement_id_seq OWNED BY public.stock_movements.movement_id;


--
-- TOC entry 223 (class 1259 OID 17068)
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    user_id integer NOT NULL,
    full_name character varying(150) NOT NULL,
    email character varying(150),
    department_id integer,
    role character varying(50)
);


ALTER TABLE public.users OWNER TO postgres;

--
-- TOC entry 222 (class 1259 OID 17067)
-- Name: users_user_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_user_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_user_id_seq OWNER TO postgres;

--
-- TOC entry 5297 (class 0 OID 0)
-- Dependencies: 222
-- Name: users_user_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_user_id_seq OWNED BY public.users.user_id;


--
-- TOC entry 255 (class 1259 OID 17555)
-- Name: v_asset_lifecycle_status; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.v_asset_lifecycle_status AS
 SELECT asset_id,
    asset_type,
    location,
    status,
    purchase_date,
    expected_service_date,
    expected_lifespan_years,
    (EXTRACT(year FROM age((CURRENT_DATE)::timestamp with time zone, (purchase_date)::timestamp with time zone)))::integer AS asset_age_years,
        CASE
            WHEN (expected_service_date < CURRENT_DATE) THEN 'SERVICE_OVERDUE'::text
            WHEN (((expected_service_date - CURRENT_DATE) <= 30) AND (expected_service_date >= CURRENT_DATE)) THEN 'SERVICE_DUE'::text
            WHEN ((expected_lifespan_years IS NOT NULL) AND ((EXTRACT(year FROM age((CURRENT_DATE)::timestamp with time zone, (purchase_date)::timestamp with time zone)))::integer >= expected_lifespan_years)) THEN 'REPLACEMENT_WARNING'::text
            ELSE 'OK'::text
        END AS lifecycle_status
   FROM public.assets;


ALTER VIEW public.v_asset_lifecycle_status OWNER TO postgres;

--
-- TOC entry 234 (class 1259 OID 17246)
-- Name: v_stock_status; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.v_stock_status AS
 SELECT item_id,
    sku,
    item_name,
    category,
    current_quantity,
    reorder_level,
    unit,
    location,
        CASE
            WHEN (current_quantity <= reorder_level) THEN 'LOW_STOCK'::text
            ELSE 'IN_STOCK'::text
        END AS status
   FROM public.items;


ALTER VIEW public.v_stock_status OWNER TO postgres;

--
-- TOC entry 224 (class 1259 OID 17083)
-- Name: vendors; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.vendors (
    vendor_id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    company_name character varying(150) NOT NULL,
    registration_number character varying(50),
    tax_id character varying(50),
    bank_name character varying(100),
    bank_account_number character varying(30),
    bank_account_name character varying(150),
    registration_valid boolean DEFAULT false NOT NULL,
    tax_valid boolean DEFAULT false NOT NULL,
    bank_match boolean DEFAULT false NOT NULL,
    documents_complete boolean DEFAULT false NOT NULL,
    total_score integer DEFAULT 0 NOT NULL,
    status character varying(20) DEFAULT 'PENDING'::character varying NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    CONSTRAINT vendors_status_check CHECK (((status)::text = ANY ((ARRAY['PENDING'::character varying, 'VERIFIED'::character varying, 'FLAGGED'::character varying, 'REJECTED'::character varying])::text[]))),
    CONSTRAINT vendors_total_score_check CHECK (((total_score >= 0) AND (total_score <= 100)))
);


ALTER TABLE public.vendors OWNER TO postgres;

--
-- TOC entry 227 (class 1259 OID 17132)
-- Name: verification_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.verification_logs (
    log_id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    vendor_id uuid NOT NULL,
    check_category character varying(30) NOT NULL,
    input_data text NOT NULL,
    rule_checked character varying(150) NOT NULL,
    result character varying(10) NOT NULL,
    score_awarded integer NOT NULL,
    final_outcome character varying(20) DEFAULT 'Pending'::character varying NOT NULL,
    checked_at timestamp without time zone DEFAULT now() NOT NULL,
    CONSTRAINT verification_logs_result_check CHECK (((result)::text = ANY ((ARRAY['PASS'::character varying, 'FAIL'::character varying])::text[]))),
    CONSTRAINT verification_logs_score_awarded_check CHECK ((score_awarded >= 0))
);


ALTER TABLE public.verification_logs OWNER TO postgres;

--
-- TOC entry 4995 (class 2604 OID 17317)
-- Name: approval approval_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.approval ALTER COLUMN approval_id SET DEFAULT nextval('public.approval_approval_id_seq'::regclass);


--
-- TOC entry 5006 (class 2604 OID 17503)
-- Name: asset_assignments assignment_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.asset_assignments ALTER COLUMN assignment_id SET DEFAULT nextval('public.asset_assignments_assignment_id_seq'::regclass);


--
-- TOC entry 5003 (class 2604 OID 17481)
-- Name: assets asset_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assets ALTER COLUMN asset_id SET DEFAULT nextval('public.assets_asset_id_seq'::regclass);


--
-- TOC entry 4967 (class 2604 OID 17060)
-- Name: departments department_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.departments ALTER COLUMN department_id SET DEFAULT nextval('public.departments_department_id_seq'::regclass);


--
-- TOC entry 5000 (class 2604 OID 17419)
-- Name: goods_receipt goods_receipt_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.goods_receipt ALTER COLUMN goods_receipt_id SET DEFAULT nextval('public.goods_receipt_goods_receipt_id_seq'::regclass);


--
-- TOC entry 5002 (class 2604 OID 17448)
-- Name: goods_receipt_item goods_receipt_item_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.goods_receipt_item ALTER COLUMN goods_receipt_item_id SET DEFAULT nextval('public.goods_receipt_item_goods_receipt_item_id_seq'::regclass);


--
-- TOC entry 4981 (class 2604 OID 17170)
-- Name: items item_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.items ALTER COLUMN item_id SET DEFAULT nextval('public.items_item_id_seq'::regclass);


--
-- TOC entry 5008 (class 2604 OID 17530)
-- Name: maintenance_records maintenance_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.maintenance_records ALTER COLUMN maintenance_id SET DEFAULT nextval('public.maintenance_records_maintenance_id_seq'::regclass);


--
-- TOC entry 4996 (class 2604 OID 17344)
-- Name: purchase_order purchase_order_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.purchase_order ALTER COLUMN purchase_order_id SET DEFAULT nextval('public.purchase_order_purchase_order_id_seq'::regclass);


--
-- TOC entry 4999 (class 2604 OID 17384)
-- Name: purchase_order_item purchase_order_item_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.purchase_order_item ALTER COLUMN purchase_order_item_id SET DEFAULT nextval('public.purchase_order_item_purchase_order_item_id_seq'::regclass);


--
-- TOC entry 4988 (class 2604 OID 17223)
-- Name: reconciliations reconciliation_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reconciliations ALTER COLUMN reconciliation_id SET DEFAULT nextval('public.reconciliations_reconciliation_id_seq'::regclass);


--
-- TOC entry 4991 (class 2604 OID 17254)
-- Name: requisition requisition_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.requisition ALTER COLUMN requisition_id SET DEFAULT nextval('public.requisition_requisition_id_seq'::regclass);


--
-- TOC entry 4994 (class 2604 OID 17289)
-- Name: requisition_item requisition_item_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.requisition_item ALTER COLUMN requisition_item_id SET DEFAULT nextval('public.requisition_item_requisition_item_id_seq'::regclass);


--
-- TOC entry 4986 (class 2604 OID 17196)
-- Name: stock_movements movement_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.stock_movements ALTER COLUMN movement_id SET DEFAULT nextval('public.stock_movements_movement_id_seq'::regclass);


--
-- TOC entry 4968 (class 2604 OID 17071)
-- Name: users user_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN user_id SET DEFAULT nextval('public.users_user_id_seq'::regclass);


--
-- TOC entry 5074 (class 2606 OID 17329)
-- Name: approval approval_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.approval
    ADD CONSTRAINT approval_pkey PRIMARY KEY (approval_id);


--
-- TOC entry 5090 (class 2606 OID 17514)
-- Name: asset_assignments asset_assignments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.asset_assignments
    ADD CONSTRAINT asset_assignments_pkey PRIMARY KEY (assignment_id);


--
-- TOC entry 5088 (class 2606 OID 17493)
-- Name: assets assets_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assets
    ADD CONSTRAINT assets_pkey PRIMARY KEY (asset_id);


--
-- TOC entry 5053 (class 2606 OID 17131)
-- Name: decision_thresholds decision_thresholds_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.decision_thresholds
    ADD CONSTRAINT decision_thresholds_pkey PRIMARY KEY (status);


--
-- TOC entry 5040 (class 2606 OID 17066)
-- Name: departments departments_department_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.departments
    ADD CONSTRAINT departments_department_name_key UNIQUE (department_name);


--
-- TOC entry 5042 (class 2606 OID 17064)
-- Name: departments departments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.departments
    ADD CONSTRAINT departments_pkey PRIMARY KEY (department_id);


--
-- TOC entry 5086 (class 2606 OID 17464)
-- Name: goods_receipt_item goods_receipt_item_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.goods_receipt_item
    ADD CONSTRAINT goods_receipt_item_pkey PRIMARY KEY (goods_receipt_item_id);


--
-- TOC entry 5082 (class 2606 OID 17431)
-- Name: goods_receipt goods_receipt_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.goods_receipt
    ADD CONSTRAINT goods_receipt_pkey PRIMARY KEY (goods_receipt_id);


--
-- TOC entry 5084 (class 2606 OID 17433)
-- Name: goods_receipt goods_receipt_receipt_number_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.goods_receipt
    ADD CONSTRAINT goods_receipt_receipt_number_key UNIQUE (receipt_number);


--
-- TOC entry 5059 (class 2606 OID 17188)
-- Name: items items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.items
    ADD CONSTRAINT items_pkey PRIMARY KEY (item_id);


--
-- TOC entry 5061 (class 2606 OID 17190)
-- Name: items items_sku_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.items
    ADD CONSTRAINT items_sku_key UNIQUE (sku);


--
-- TOC entry 5093 (class 2606 OID 17540)
-- Name: maintenance_records maintenance_records_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.maintenance_records
    ADD CONSTRAINT maintenance_records_pkey PRIMARY KEY (maintenance_id);


--
-- TOC entry 5080 (class 2606 OID 17399)
-- Name: purchase_order_item purchase_order_item_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.purchase_order_item
    ADD CONSTRAINT purchase_order_item_pkey PRIMARY KEY (purchase_order_item_id);


--
-- TOC entry 5076 (class 2606 OID 17360)
-- Name: purchase_order purchase_order_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.purchase_order
    ADD CONSTRAINT purchase_order_pkey PRIMARY KEY (purchase_order_id);


--
-- TOC entry 5078 (class 2606 OID 17362)
-- Name: purchase_order purchase_order_po_number_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.purchase_order
    ADD CONSTRAINT purchase_order_po_number_key UNIQUE (po_number);


--
-- TOC entry 5066 (class 2606 OID 17233)
-- Name: reconciliations reconciliations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reconciliations
    ADD CONSTRAINT reconciliations_pkey PRIMARY KEY (reconciliation_id);


--
-- TOC entry 5072 (class 2606 OID 17302)
-- Name: requisition_item requisition_item_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.requisition_item
    ADD CONSTRAINT requisition_item_pkey PRIMARY KEY (requisition_item_id);


--
-- TOC entry 5068 (class 2606 OID 17272)
-- Name: requisition requisition_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.requisition
    ADD CONSTRAINT requisition_pkey PRIMARY KEY (requisition_id);


--
-- TOC entry 5070 (class 2606 OID 17274)
-- Name: requisition requisition_requisition_number_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.requisition
    ADD CONSTRAINT requisition_requisition_number_key UNIQUE (requisition_number);


--
-- TOC entry 5051 (class 2606 OID 17122)
-- Name: scoring_rules scoring_rules_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.scoring_rules
    ADD CONSTRAINT scoring_rules_pkey PRIMARY KEY (check_category);


--
-- TOC entry 5064 (class 2606 OID 17207)
-- Name: stock_movements stock_movements_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.stock_movements
    ADD CONSTRAINT stock_movements_pkey PRIMARY KEY (movement_id);


--
-- TOC entry 5044 (class 2606 OID 17077)
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- TOC entry 5046 (class 2606 OID 17075)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (user_id);


--
-- TOC entry 5049 (class 2606 OID 17110)
-- Name: vendors vendors_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vendors
    ADD CONSTRAINT vendors_pkey PRIMARY KEY (vendor_id);


--
-- TOC entry 5056 (class 2606 OID 17152)
-- Name: verification_logs verification_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.verification_logs
    ADD CONSTRAINT verification_logs_pkey PRIMARY KEY (log_id);


--
-- TOC entry 5057 (class 1259 OID 17191)
-- Name: idx_items_category; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_items_category ON public.items USING btree (category);


--
-- TOC entry 5054 (class 1259 OID 17163)
-- Name: idx_logs_vendor; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_logs_vendor ON public.verification_logs USING btree (vendor_id);


--
-- TOC entry 5062 (class 1259 OID 17218)
-- Name: idx_movements_item; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_movements_item ON public.stock_movements USING btree (item_id);


--
-- TOC entry 5047 (class 1259 OID 17111)
-- Name: idx_vendors_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_vendors_status ON public.vendors USING btree (status);


--
-- TOC entry 5091 (class 1259 OID 17525)
-- Name: uq_one_active_assignment_per_asset; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX uq_one_active_assignment_per_asset ON public.asset_assignments USING btree (asset_id) WHERE ((assignment_status)::text = 'Active'::text);


--
-- TOC entry 5123 (class 2620 OID 17245)
-- Name: stock_movements trg_apply_stock_movement; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_apply_stock_movement AFTER INSERT ON public.stock_movements FOR EACH ROW EXECUTE FUNCTION public.apply_stock_movement();


--
-- TOC entry 5124 (class 2620 OID 17379)
-- Name: purchase_order trg_enforce_verified_vendor; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_enforce_verified_vendor BEFORE INSERT ON public.purchase_order FOR EACH ROW EXECUTE FUNCTION public.enforce_verified_vendor();


--
-- TOC entry 5122 (class 2620 OID 17165)
-- Name: verification_logs trg_recalculate_vendor_score; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_recalculate_vendor_score AFTER INSERT ON public.verification_logs FOR EACH ROW EXECUTE FUNCTION public.recalculate_vendor_score();


--
-- TOC entry 5126 (class 2620 OID 17552)
-- Name: asset_assignments trg_sync_asset_assignment; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_sync_asset_assignment AFTER INSERT OR UPDATE ON public.asset_assignments FOR EACH ROW EXECUTE FUNCTION public.sync_asset_assignment();


--
-- TOC entry 5127 (class 2620 OID 17554)
-- Name: maintenance_records trg_sync_asset_service_date; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_sync_asset_service_date AFTER INSERT ON public.maintenance_records FOR EACH ROW EXECUTE FUNCTION public.sync_asset_service_date();


--
-- TOC entry 5125 (class 2620 OID 17476)
-- Name: goods_receipt_item trg_sync_goods_receipt_to_inventory; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_sync_goods_receipt_to_inventory AFTER INSERT ON public.goods_receipt_item FOR EACH ROW EXECUTE FUNCTION public.sync_goods_receipt_to_inventory();


--
-- TOC entry 5105 (class 2606 OID 17335)
-- Name: approval approval_approver_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.approval
    ADD CONSTRAINT approval_approver_id_fkey FOREIGN KEY (approver_id) REFERENCES public.users(user_id);


--
-- TOC entry 5106 (class 2606 OID 17330)
-- Name: approval approval_requisition_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.approval
    ADD CONSTRAINT approval_requisition_id_fkey FOREIGN KEY (requisition_id) REFERENCES public.requisition(requisition_id) ON DELETE CASCADE;


--
-- TOC entry 5118 (class 2606 OID 17515)
-- Name: asset_assignments asset_assignments_asset_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.asset_assignments
    ADD CONSTRAINT asset_assignments_asset_id_fkey FOREIGN KEY (asset_id) REFERENCES public.assets(asset_id);


--
-- TOC entry 5119 (class 2606 OID 17520)
-- Name: asset_assignments asset_assignments_assigned_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.asset_assignments
    ADD CONSTRAINT asset_assignments_assigned_user_id_fkey FOREIGN KEY (assigned_user_id) REFERENCES public.users(user_id);


--
-- TOC entry 5117 (class 2606 OID 17494)
-- Name: assets assets_assigned_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assets
    ADD CONSTRAINT assets_assigned_user_id_fkey FOREIGN KEY (assigned_user_id) REFERENCES public.users(user_id);


--
-- TOC entry 5115 (class 2606 OID 17465)
-- Name: goods_receipt_item goods_receipt_item_goods_receipt_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.goods_receipt_item
    ADD CONSTRAINT goods_receipt_item_goods_receipt_id_fkey FOREIGN KEY (goods_receipt_id) REFERENCES public.goods_receipt(goods_receipt_id) ON DELETE CASCADE;


--
-- TOC entry 5116 (class 2606 OID 17470)
-- Name: goods_receipt_item goods_receipt_item_purchase_order_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.goods_receipt_item
    ADD CONSTRAINT goods_receipt_item_purchase_order_item_id_fkey FOREIGN KEY (purchase_order_item_id) REFERENCES public.purchase_order_item(purchase_order_item_id);


--
-- TOC entry 5113 (class 2606 OID 17434)
-- Name: goods_receipt goods_receipt_purchase_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.goods_receipt
    ADD CONSTRAINT goods_receipt_purchase_order_id_fkey FOREIGN KEY (purchase_order_id) REFERENCES public.purchase_order(purchase_order_id);


--
-- TOC entry 5114 (class 2606 OID 17439)
-- Name: goods_receipt goods_receipt_received_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.goods_receipt
    ADD CONSTRAINT goods_receipt_received_by_fkey FOREIGN KEY (received_by) REFERENCES public.users(user_id);


--
-- TOC entry 5120 (class 2606 OID 17541)
-- Name: maintenance_records maintenance_records_asset_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.maintenance_records
    ADD CONSTRAINT maintenance_records_asset_id_fkey FOREIGN KEY (asset_id) REFERENCES public.assets(asset_id);


--
-- TOC entry 5121 (class 2606 OID 17546)
-- Name: maintenance_records maintenance_records_performed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.maintenance_records
    ADD CONSTRAINT maintenance_records_performed_by_fkey FOREIGN KEY (performed_by) REFERENCES public.users(user_id);


--
-- TOC entry 5107 (class 2606 OID 17373)
-- Name: purchase_order purchase_order_buyer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.purchase_order
    ADD CONSTRAINT purchase_order_buyer_id_fkey FOREIGN KEY (buyer_id) REFERENCES public.users(user_id);


--
-- TOC entry 5110 (class 2606 OID 17410)
-- Name: purchase_order_item purchase_order_item_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.purchase_order_item
    ADD CONSTRAINT purchase_order_item_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.items(item_id);


--
-- TOC entry 5111 (class 2606 OID 17400)
-- Name: purchase_order_item purchase_order_item_purchase_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.purchase_order_item
    ADD CONSTRAINT purchase_order_item_purchase_order_id_fkey FOREIGN KEY (purchase_order_id) REFERENCES public.purchase_order(purchase_order_id) ON DELETE CASCADE;


--
-- TOC entry 5112 (class 2606 OID 17405)
-- Name: purchase_order_item purchase_order_item_requisition_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.purchase_order_item
    ADD CONSTRAINT purchase_order_item_requisition_item_id_fkey FOREIGN KEY (requisition_item_id) REFERENCES public.requisition_item(requisition_item_id);


--
-- TOC entry 5108 (class 2606 OID 17363)
-- Name: purchase_order purchase_order_requisition_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.purchase_order
    ADD CONSTRAINT purchase_order_requisition_id_fkey FOREIGN KEY (requisition_id) REFERENCES public.requisition(requisition_id);


--
-- TOC entry 5109 (class 2606 OID 17368)
-- Name: purchase_order purchase_order_supplier_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.purchase_order
    ADD CONSTRAINT purchase_order_supplier_id_fkey FOREIGN KEY (supplier_id) REFERENCES public.vendors(vendor_id);


--
-- TOC entry 5099 (class 2606 OID 17239)
-- Name: reconciliations reconciliations_adjusted_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reconciliations
    ADD CONSTRAINT reconciliations_adjusted_by_fkey FOREIGN KEY (adjusted_by) REFERENCES public.users(user_id);


--
-- TOC entry 5100 (class 2606 OID 17234)
-- Name: reconciliations reconciliations_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reconciliations
    ADD CONSTRAINT reconciliations_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.items(item_id);


--
-- TOC entry 5101 (class 2606 OID 17280)
-- Name: requisition requisition_department_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.requisition
    ADD CONSTRAINT requisition_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.departments(department_id);


--
-- TOC entry 5103 (class 2606 OID 17308)
-- Name: requisition_item requisition_item_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.requisition_item
    ADD CONSTRAINT requisition_item_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.items(item_id);


--
-- TOC entry 5104 (class 2606 OID 17303)
-- Name: requisition_item requisition_item_requisition_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.requisition_item
    ADD CONSTRAINT requisition_item_requisition_id_fkey FOREIGN KEY (requisition_id) REFERENCES public.requisition(requisition_id) ON DELETE CASCADE;


--
-- TOC entry 5102 (class 2606 OID 17275)
-- Name: requisition requisition_requester_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.requisition
    ADD CONSTRAINT requisition_requester_id_fkey FOREIGN KEY (requester_id) REFERENCES public.users(user_id);


--
-- TOC entry 5097 (class 2606 OID 17208)
-- Name: stock_movements stock_movements_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.stock_movements
    ADD CONSTRAINT stock_movements_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.items(item_id);


--
-- TOC entry 5098 (class 2606 OID 17213)
-- Name: stock_movements stock_movements_performed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.stock_movements
    ADD CONSTRAINT stock_movements_performed_by_fkey FOREIGN KEY (performed_by) REFERENCES public.users(user_id);


--
-- TOC entry 5094 (class 2606 OID 17078)
-- Name: users users_department_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.departments(department_id);


--
-- TOC entry 5095 (class 2606 OID 17158)
-- Name: verification_logs verification_logs_check_category_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.verification_logs
    ADD CONSTRAINT verification_logs_check_category_fkey FOREIGN KEY (check_category) REFERENCES public.scoring_rules(check_category);


--
-- TOC entry 5096 (class 2606 OID 17153)
-- Name: verification_logs verification_logs_vendor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.verification_logs
    ADD CONSTRAINT verification_logs_vendor_id_fkey FOREIGN KEY (vendor_id) REFERENCES public.vendors(vendor_id) ON DELETE CASCADE;


-- Completed on 2026-09-16 14:23:44

--
-- PostgreSQL database dump complete
--

\unrestrict ubQALUFmtjvABfBEQWehVIO2hXtlCakvOnlddYdfVcL6uCtnDtDeTVqDOtTcdgF

