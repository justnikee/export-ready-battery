.PHONY: dev build test migrate-up lint format clean deps

# Load .env file if present
-include .env
export

# ---------------------------------------------------------------------------
# Development
# ---------------------------------------------------------------------------

# Run all Next.js apps in dev mode (Go services must be started separately)
dev:
	pnpm run dev

# ---------------------------------------------------------------------------
# Build
# ---------------------------------------------------------------------------

# Build all Next.js apps via Turbo
build-frontend:
	pnpm run build

# Build all Go services
build-backend:
	@for svc in services/*; do \
	  if [ -f "$$svc/go.mod" ]; then \
	    echo "Building $$svc..."; \
	    (cd "$$svc" && go build ./...); \
	  fi \
	done

# Build everything
build: build-frontend build-backend

# ---------------------------------------------------------------------------
# Test
# ---------------------------------------------------------------------------

# Run frontend tests via Turbo
test-frontend:
	pnpm run test

# Run backend tests in all services
test-backend:
	@for svc in services/*; do \
	  if [ -f "$$svc/go.mod" ]; then \
	    echo "Testing $$svc..."; \
	    (cd "$$svc" && go test ./...); \
	  fi \
	done

# Run all tests
test: test-frontend test-backend

# ---------------------------------------------------------------------------
# Database
# ---------------------------------------------------------------------------

# Run database migrations (battery-api is the canonical migration source)
migrate-up:
	cd services/battery-api && go run ./cmd/migration_runner up

# Apply clean baseline schema to battery Supabase (for new/empty databases)
schema-battery:
	cd services/battery-api && go run ./cmd/apply_schema internal/db/schema_clean.sql

# Apply clean baseline schema to textile Supabase (for new/empty databases)
schema-textile:
	cd services/textile-api && go run ./cmd/apply_schema internal/db/schema_clean.sql

# Reset + reapply schema to battery Supabase (DANGER: drops all data)
schema-reset-battery:
	cd services/battery-api && go run ./cmd/apply_schema internal/db/schema_reset.sql

# Reset + reapply schema to textile Supabase (DANGER: drops all data)
schema-reset-textile:
	cd services/textile-api && go run ./cmd/apply_schema internal/db/schema_reset.sql

# ---------------------------------------------------------------------------
# Lint & Format
# ---------------------------------------------------------------------------

lint:
	pnpm run lint
	@for svc in services/*; do \
	  if [ -f "$$svc/go.mod" ]; then \
	    echo "Linting $$svc..."; \
	    (cd "$$svc" && golangci-lint run ./... || true); \
	  fi \
	done

format:
	pnpm exec prettier --write "apps/**/*.{ts,tsx,md,json}" "packages/**/*.{ts,tsx,md,json}"
	@for svc in services/*; do \
	  if [ -f "$$svc/go.mod" ]; then \
	    echo "Formatting $$svc..."; \
	    (cd "$$svc" && gofmt -w .); \
	  fi \
	done

# ---------------------------------------------------------------------------
# Clean
# ---------------------------------------------------------------------------

clean:
	pnpm run clean 2>/dev/null || true
	rm -rf bin/
	@for svc in services/*; do \
	  if [ -f "$$svc/go.mod" ]; then \
	    (cd "$$svc" && go clean); \
	  fi \
	done

# ---------------------------------------------------------------------------
# Dependencies
# ---------------------------------------------------------------------------

deps:
	pnpm install
	@for svc in services/*; do \
	  if [ -f "$$svc/go.mod" ]; then \
	    echo "Tidying $$svc..."; \
	    (cd "$$svc" && go mod download && go mod tidy); \
	  fi \
	done
