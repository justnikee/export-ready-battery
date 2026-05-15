// DANGER: This is a one-off manual migration script.
// It bypasses schema_migrations version tracking and hardcodes SQL inline.
// Use backend/cmd/migration_runner for all normal migration operations.
// Only run this if you know exactly why the normal migrator cannot be used.
package main

import (
	"context"
	"fmt"
	"os"

	"github.com/jackc/pgx/v5"
)

func main() {
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		fmt.Fprintln(os.Stderr, "DATABASE_URL environment variable not set")
		os.Exit(1)
	}

	conn, err := pgx.Connect(context.Background(), dbURL)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Unable to connect to database: %v\n", err)
		os.Exit(1)
	}
	defer conn.Close(context.Background())

	sql := `
-- Phase 7: Magic Link OTP hardening
CREATE TABLE IF NOT EXISTS public.magic_link_otp (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    magic_link_token_hash TEXT        NOT NULL,
    otp_hash              TEXT        NOT NULL,
    attempt_count         INTEGER     NOT NULL DEFAULT 0,
    max_attempts          INTEGER     NOT NULL DEFAULT 5,
    last_resent_at        TIMESTAMPTZ,
    resend_count          INTEGER     NOT NULL DEFAULT 0,
    max_resends           INTEGER     NOT NULL DEFAULT 3,
    created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    used_at               TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_magic_link_otp_token_hash
    ON public.magic_link_otp(magic_link_token_hash);

ALTER TABLE public.magic_link_tokens
    ADD COLUMN IF NOT EXISTS requires_otp   BOOLEAN     NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS last_resent_at TIMESTAMPTZ;
`

	fmt.Println("🔧 Applying magic link OTP migration...")
	_, err = conn.Exec(context.Background(), sql)
	if err != nil {
		fmt.Fprintf(os.Stderr, "❌ Migration failed: %v\n", err)
		os.Exit(1)
	}

	fmt.Println("✅ Migration applied successfully!")
	fmt.Println("   - Created magic_link_otp table")
	fmt.Println("   - Added requires_otp column to magic_link_tokens")
	fmt.Println("   - Added last_resent_at column to magic_link_tokens")
}

// Made with Bob
