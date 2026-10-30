-- ==============================================================================
-- BILL A CHICKEN – Multi-Shop Management & Security Database Schema (PostgreSQL / Supabase)
-- ==============================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Shops Table (Stores 20+ Physical Branches)
CREATE TABLE IF NOT EXISTS public.shops (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_number VARCHAR(20) NOT NULL UNIQUE, -- 'Shop 01' ... 'Shop 20'
    name VARCHAR(255) NOT NULL,
    tagline VARCHAR(255) DEFAULT 'Fresh & Tender Chicken Daily',
    address_line1 VARCHAR(255) NOT NULL,
    address_line2 VARCHAR(255),
    phone VARCHAR(50) NOT NULL,
    alt_phone VARCHAR(50),
    fssai VARCHAR(50),
    gstin VARCHAR(50),
    upi_id VARCHAR(100) DEFAULT 'billachicken@upi',
    upi_payee_name VARCHAR(100) DEFAULT 'BILL A CHICKEN',
    default_price_per_kg NUMERIC(10, 2) NOT NULL DEFAULT 250.00,
    printer_width VARCHAR(10) NOT NULL DEFAULT '58mm' CHECK (printer_width IN ('58mm', '80mm')),
    receipt_footer_message TEXT DEFAULT 'THANK YOU! VISIT AGAIN\nHygiene & Freshness Guaranteed',
    receipt_notice TEXT DEFAULT 'Weighment checked at counter. Goods once sold are not returnable.',
    bill_prefix VARCHAR(20) NOT NULL,
    next_bill_sequence INTEGER NOT NULL DEFAULT 1001,
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. Profiles / Users Table (Linked to Supabase Auth auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username VARCHAR(100) NOT NULL UNIQUE,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('owner', 'employee')),
    shop_id UUID REFERENCES public.shops(id) ON DELETE SET NULL, -- NULL for Owner, required for employee
    phone VARCHAR(50),
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. Permanent Bills Table (Read-Only for Employees, Permanent Archival)
CREATE TABLE IF NOT EXISTS public.bills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE RESTRICT,
    bill_number VARCHAR(50) NOT NULL,
    employee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    employee_name VARCHAR(255) NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    date_formatted VARCHAR(20) NOT NULL,
    time_formatted VARCHAR(20) NOT NULL,
    customer_name VARCHAR(255),
    customer_mobile VARCHAR(20),
    subtotal NUMERIC(12, 2) NOT NULL CHECK (subtotal >= 0),
    discount NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (discount >= 0),
    discount_type VARCHAR(10) NOT NULL DEFAULT 'amount' CHECK (discount_type IN ('amount', 'percent')),
    discount_amount NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (discount_amount >= 0),
    grand_total NUMERIC(12, 2) NOT NULL CHECK (grand_total >= 0),
    payment_method VARCHAR(20) NOT NULL CHECK (payment_method IN ('Cash', 'UPI')),
    amount_received NUMERIC(12, 2) NOT NULL DEFAULT 0,
    change_due NUMERIC(12, 2) NOT NULL DEFAULT 0,
    notes TEXT,
    print_count INTEGER NOT NULL DEFAULT 1,
    status VARCHAR(20) NOT NULL DEFAULT 'completed' CHECK (status IN ('completed', 'adjusted')),
    adjustment_reason TEXT,
    adjusted_by VARCHAR(255),
    adjusted_at TIMESTAMPTZ,
    original_bill_data JSONB, -- Permanent immutable snapshot of original transaction
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_shop_bill_number UNIQUE(shop_id, bill_number)
);

-- 5. Bill Items (Dynamic chicken weight entries)
CREATE TABLE IF NOT EXISTS public.bill_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bill_id UUID NOT NULL REFERENCES public.bills(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    weight NUMERIC(10, 3) NOT NULL CHECK (weight >= 0), -- Unlimited weight supported
    price_per_kg NUMERIC(10, 2) NOT NULL CHECK (price_per_kg >= 0),
    total NUMERIC(12, 2) NOT NULL CHECK (total >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 6. Audit Logs Table (Immutable log of all operational & security activities)
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_type VARCHAR(50) NOT NULL,
    user_id UUID,
    username VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL,
    shop_id UUID REFERENCES public.shops(id) ON DELETE SET NULL,
    shop_number VARCHAR(20),
    details TEXT NOT NULL,
    ip_address VARCHAR(50),
    timestamp TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

-- Enable RLS on all tables
ALTER TABLE public.shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bill_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper functions to extract user role and shop_id from auth context
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS VARCHAR AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.current_user_shop_id()
RETURNS UUID AS $$
  SELECT shop_id FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- --- SHOPS POLICIES ---
-- Owner can SELECT, INSERT, UPDATE all shops
CREATE POLICY "Owner full access to shops"
ON public.shops
FOR ALL
TO authenticated
USING (public.current_user_role() = 'owner');

-- Employee can only VIEW their assigned shop
CREATE POLICY "Employee view assigned shop"
ON public.shops
FOR SELECT
TO authenticated
USING (id = public.current_user_shop_id());

-- --- PROFILES POLICIES ---
-- Owner can view and manage all employee profiles
CREATE POLICY "Owner manage profiles"
ON public.profiles
FOR ALL
TO authenticated
USING (public.current_user_role() = 'owner');

-- Users can view their own profile
CREATE POLICY "Users view own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (id = auth.uid());

-- --- BILLS POLICIES (VERY IMPORTANT) ---
-- 1. Owner can view all bills across all 20 shops
CREATE POLICY "Owner view all bills"
ON public.bills
FOR SELECT
TO authenticated
USING (public.current_user_role() = 'owner');

-- 2. Employee can ONLY view bills of their assigned shop
CREATE POLICY "Employee view own shop bills"
ON public.bills
FOR SELECT
TO authenticated
USING (shop_id = public.current_user_shop_id());

-- 3. Employee and Owner can INSERT new bills into their assigned shop
CREATE POLICY "Insert bills permitted"
ON public.bills
FOR INSERT
TO authenticated
WITH CHECK (
  (public.current_user_role() = 'owner') OR 
  (public.current_user_role() = 'employee' AND shop_id = public.current_user_shop_id())
);

-- 4. NO DELETE POLICY AT ALL: Bills can NEVER be deleted! (Permanent Integrity)
-- 5. UPDATE: Only Owner can adjust bills (employees cannot update completed bills)
CREATE POLICY "Owner adjust bills"
ON public.bills
FOR UPDATE
TO authenticated
USING (public.current_user_role() = 'owner')
WITH CHECK (public.current_user_role() = 'owner');

-- --- BILL ITEMS POLICIES ---
CREATE POLICY "View bill items"
ON public.bill_items
FOR SELECT
TO authenticated
USING (
  public.current_user_role() = 'owner' OR
  bill_id IN (SELECT id FROM public.bills WHERE shop_id = public.current_user_shop_id())
);

CREATE POLICY "Insert bill items"
ON public.bill_items
FOR INSERT
TO authenticated
WITH CHECK (
  public.current_user_role() = 'owner' OR
  bill_id IN (SELECT id FROM public.bills WHERE shop_id = public.current_user_shop_id())
);

-- --- AUDIT LOGS POLICIES ---
-- Only Owner can view audit logs
CREATE POLICY "Owner view audit logs"
ON public.audit_logs
FOR SELECT
TO authenticated
USING (public.current_user_role() = 'owner');

-- Any authenticated user can insert an audit log via server RPC
CREATE POLICY "Insert audit logs"
ON public.audit_logs
FOR INSERT
TO authenticated
WITH CHECK (true);

-- ==============================================================================
-- ATOMIC BILL SEQUENCE INCREMENT FUNCTION
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.create_new_shop_bill(
    p_shop_id UUID,
    p_items JSONB,
    p_customer_name TEXT,
    p_customer_mobile TEXT,
    p_subtotal NUMERIC,
    p_discount NUMERIC,
    p_discount_type TEXT,
    p_discount_amount NUMERIC,
    p_grand_total NUMERIC,
    p_payment_method TEXT,
    p_amount_received NUMERIC,
    p_change_due NUMERIC,
    p_notes TEXT
)
RETURNS UUID AS $$
DECLARE
    v_shop RECORD;
    v_bill_number TEXT;
    v_bill_id UUID;
    v_item JSONB;
BEGIN
    -- Lock shop row for atomic sequence update
    SELECT * INTO v_shop FROM public.shops WHERE id = p_shop_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Shop with id % not found', p_shop_id;
    END IF;

    -- Format bill number: e.g. BAC-S01-1001
    v_bill_number := v_shop.bill_prefix || v_shop.next_bill_sequence;

    -- Increment sequence atomically
    UPDATE public.shops 
    SET next_bill_sequence = next_bill_sequence + 1, updated_at = now()
    WHERE id = p_shop_id;

    -- Insert into bills
    INSERT INTO public.bills (
        shop_id, bill_number, employee_id, employee_name,
        date_formatted, time_formatted, customer_name, customer_mobile,
        subtotal, discount, discount_type, discount_amount, grand_total,
        payment_method, amount_received, change_due, notes, print_count, status
    ) VALUES (
        p_shop_id, v_bill_number, auth.uid(),
        (SELECT full_name FROM public.profiles WHERE id = auth.uid()),
        to_char(now(), 'DD/MM/YYYY'), to_char(now(), 'HH12:MI AM'),
        p_customer_name, p_customer_mobile,
        p_subtotal, p_discount, p_discount_type, p_discount_amount, p_grand_total,
        p_payment_method, p_amount_received, p_change_due, p_notes, 1, 'completed'
    ) RETURNING id INTO v_bill_id;

    -- Insert items
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        INSERT INTO public.bill_items (bill_id, name, weight, price_per_kg, total)
        VALUES (
            v_bill_id,
            v_item->>'name',
            (v_item->>'weight')::NUMERIC,
            (v_item->>'pricePerKg')::NUMERIC,
            (v_item->>'total')::NUMERIC
        );
    END LOOP;

    RETURN v_bill_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
