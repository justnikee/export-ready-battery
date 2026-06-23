CREATE TABLE IF NOT EXISTS regulatory_sources (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            TEXT NOT NULL,
    source_type     TEXT NOT NULL CHECK (source_type IN ('rss', 'api', 'scraper')),
    url             TEXT NOT NULL,
    config          JSONB DEFAULT '{}',
    fetch_interval  TEXT NOT NULL DEFAULT '6h',
    is_active       BOOLEAN NOT NULL DEFAULT true,
    last_fetched_at TIMESTAMPTZ,
    last_etag       TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS regulatory_items (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_id       UUID NOT NULL REFERENCES regulatory_sources(id) ON DELETE CASCADE,
    external_id     TEXT NOT NULL,
    title           TEXT NOT NULL,
    summary         TEXT,
    url             TEXT,
    published_at    TIMESTAMPTZ,
    product_type    TEXT CHECK (product_type IN ('BATTERY', 'TEXTILE', 'GENERAL')),
    market_region   TEXT CHECK (market_region IN ('EU', 'INDIA', 'GLOBAL')),
    urgency         TEXT NOT NULL DEFAULT 'normal' CHECK (urgency IN ('low', 'normal', 'high', 'critical')),
    tags            TEXT[] DEFAULT '{}',
    deadline        DATE,
    raw_content     TEXT,
    classified_at   TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(source_id, external_id)
);

CREATE INDEX IF NOT EXISTS idx_regulatory_items_source_id ON regulatory_items(source_id);
CREATE INDEX IF NOT EXISTS idx_regulatory_items_published_at ON regulatory_items(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_regulatory_items_product_type ON regulatory_items(product_type);
CREATE INDEX IF NOT EXISTS idx_regulatory_items_market_region ON regulatory_items(market_region);
CREATE INDEX IF NOT EXISTS idx_regulatory_items_urgency ON regulatory_items(urgency);
CREATE INDEX IF NOT EXISTS idx_regulatory_items_deadline ON regulatory_items(deadline);
CREATE INDEX IF NOT EXISTS idx_regulatory_items_tags ON regulatory_items USING GIN(tags);

CREATE TABLE IF NOT EXISTS tenant_regulatory_alerts (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id           UUID NOT NULL,
    regulatory_item_id  UUID NOT NULL REFERENCES regulatory_items(id) ON DELETE CASCADE,
    is_read             BOOLEAN NOT NULL DEFAULT false,
    is_dismissed        BOOLEAN NOT NULL DEFAULT false,
    read_at             TIMESTAMPTZ,
    dismissed_at        TIMESTAMPTZ,
    emailed_at          TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(tenant_id, regulatory_item_id)
);

CREATE INDEX IF NOT EXISTS idx_tenant_regulatory_alerts_tenant_id ON tenant_regulatory_alerts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_regulatory_alerts_unread ON tenant_regulatory_alerts(tenant_id) WHERE is_read = false AND is_dismissed = false;
