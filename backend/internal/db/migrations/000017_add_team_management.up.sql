-- Add plan_type to tenants (for seat limits)
ALTER TABLE tenants ADD COLUMN plan_type VARCHAR(20) DEFAULT 'STARTER';

-- Create team_members table for multi-user support
CREATE TABLE team_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'MEMBER',  -- OWNER, ADMIN, MEMBER, VIEWER
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING', -- PENDING, ACTIVE, REVOKED
    invite_token VARCHAR(255),
    invite_expires_at TIMESTAMP,
    user_id UUID,
    created_at TIMESTAMP DEFAULT NOW(),
    accepted_at TIMESTAMP,
    UNIQUE(tenant_id, email)
);

-- Indexes for performance
CREATE INDEX idx_team_members_tenant ON team_members(tenant_id);
CREATE INDEX idx_team_members_email ON team_members(email);
CREATE INDEX idx_team_members_invite_token ON team_members(invite_token);
CREATE INDEX idx_team_members_user_id ON team_members(user_id);

-- Seed existing users as team owners
-- Each user becomes the owner of their tenant
INSERT INTO team_members (tenant_id, email, role, status, user_id, accepted_at)
SELECT t.id, u.email, 'OWNER', 'ACTIVE', u.id, NOW()
FROM users u
JOIN tenants t ON u.tenant_id = t.id;
