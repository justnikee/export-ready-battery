-- Add onboarding_completed column to track user setup completion
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;

-- Set existing users who have filled profile as completed
UPDATE tenants SET onboarding_completed = TRUE WHERE address IS NOT NULL AND support_email IS NOT NULL;
