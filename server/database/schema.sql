-- JN Venture OS — Database Schema
-- PostgreSQL 14+
--
-- Scope (Session 1): authentication, roles, companies, and investor-company
-- visibility. Sales, returns, distributions, and expenses are modeled here
-- as tables so later sessions can build directly on top without a schema
-- rewrite, but their API routes are not implemented yet.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ---------------------------------------------------------------------------
-- users: every person who can log in. role determines what they can see.
--   admin    — holding company operator. Full visibility and management.
--   investor — sees only the companies they are linked to via
--              investor_companies, and only the figures scoped to their
--              own stake.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name          VARCHAR(150) NOT NULL,
    email         VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role          VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'investor')),
    is_active     BOOLEAN NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- companies: the portfolio companies sitting under the holding structure.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS companies (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name        VARCHAR(200) NOT NULL,
    description TEXT,
    industry    VARCHAR(120),
    currency    VARCHAR(3) NOT NULL DEFAULT 'USD'
                  CHECK (currency IN ('USD', 'INR', 'QAR')),
    status      VARCHAR(20) NOT NULL DEFAULT 'active'
                  CHECK (status IN ('active', 'exited', 'dissolved')),
    created_by  UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- investor_companies: which investors can see which companies, and their
-- ownership stake in each. This is the permissions/visibility join table —
-- an investor with no row for a company cannot see that company at all.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS investor_companies (
    id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    investor_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    company_id            UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    ownership_percentage  NUMERIC(6, 3) NOT NULL DEFAULT 0
                            CHECK (ownership_percentage >= 0 AND ownership_percentage <= 100),
    capital_committed     NUMERIC(14, 2) NOT NULL DEFAULT 0,
    created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (investor_id, company_id)
);

-- ---------------------------------------------------------------------------
-- Forward-looking tables (schema only — no routes yet).
-- Kept here now so the data model for later sessions is agreed up front.
-- ---------------------------------------------------------------------------

-- daily/periodic sales entered per company
CREATE TABLE IF NOT EXISTS sales (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id  UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    sale_date   DATE NOT NULL,
    amount      NUMERIC(14, 2) NOT NULL,
    notes       TEXT,
    created_by  UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- capital returned to the holding company from a portfolio company
CREATE TABLE IF NOT EXISTS returns_received (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id  UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    amount      NUMERIC(14, 2) NOT NULL,
    received_on DATE NOT NULL,
    notes       TEXT,
    created_by  UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- distributions paid out from the holding company to individual investors
CREATE TABLE IF NOT EXISTS distributions (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    investor_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    company_id    UUID REFERENCES companies(id) ON DELETE SET NULL,
    amount        NUMERIC(14, 2) NOT NULL,
    distributed_on DATE NOT NULL,
    notes         TEXT,
    created_by    UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- shared costs run at the holding-company level (not tied to one company)
CREATE TABLE IF NOT EXISTS holding_expenses (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category      VARCHAR(120) NOT NULL,
    amount        NUMERIC(14, 2) NOT NULL,
    expense_date  DATE NOT NULL,
    notes         TEXT,
    created_by    UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- org_settings: a singleton row holding the brand content shown on the
-- investor Home page. Editable by admins from the Settings page.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS org_settings (
    id          INT PRIMARY KEY DEFAULT 1,
    tagline     VARCHAR(300),
    purpose     TEXT,
    vision      TEXT,
    mission     TEXT,
    promise     TEXT,
    brand_story TEXT,
    core_values TEXT,
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    CHECK (id = 1)
);

INSERT INTO org_settings (id, tagline, purpose, vision, mission, promise, brand_story, core_values)
VALUES (
    1,
    'Enduring Trust. Lasting Value.',
    'Build enduring businesses that create generational value.',
    'To become one of the world''s most trusted holding companies, building exceptional businesses that create lasting prosperity for generations.',
    'Invest with discipline, lead with integrity, build enduring partnerships, and create sustainable value across every business we own.',
    'Every decision protects trust before profit.',
    'Evercrest Holdings was founded on one belief: trust is the most valuable asset any business can possess. We acquire, build and grow businesses with patience rather than speculation. Our ambition is not simply to own companies, but to strengthen them and leave them better for future generations.',
    'Trust Above All
Stewardship
Long-Term Thinking
Partnership
Excellence
Accountability
Respect
Sustainable Growth'
)
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- Indexes for the lookups the API will do constantly.
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_investor_companies_investor ON investor_companies(investor_id);
CREATE INDEX IF NOT EXISTS idx_investor_companies_company ON investor_companies(company_id);
CREATE INDEX IF NOT EXISTS idx_sales_company_date ON sales(company_id, sale_date);
CREATE INDEX IF NOT EXISTS idx_returns_company_date ON returns_received(company_id, received_on);
CREATE INDEX IF NOT EXISTS idx_distributions_investor_date ON distributions(investor_id, distributed_on);
