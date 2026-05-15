.PHONY: run build test clean deps migrate-up migrate-down migrate-create migrate-force migrate-verify migrate-version migrate-reset

# Load .env file for database URL (from backend for consistency)
include backend/.env
export

# Run the server
run:
	go run backend/cmd/server/main.go

# Build the binary
build:
	cd backend && go build -o ../bin/server ./cmd/server

# Run tests
test:
	cd backend && go test -v ./...

# Clean build artifacts
clean:
	rm -rf bin/
	cd backend && go clean

# Download dependencies
deps:
	cd backend && go mod download && go mod tidy

# Run with hot reload (requires air: go install github.com/air-verse/air@latest)
dev:
	cd backend && air

# ============================================
# Database Migrations (repo-native runner)
# ============================================

# Run all pending migrations
migrate-up:
	cd backend && go run ./cmd/migration_runner up

# Rollback the last migration
migrate-down:
	cd backend && go run ./cmd/migration_runner down

# Rollback ALL migrations (use with caution)
migrate-reset:
	@echo "Use repeated 'make migrate-down' or 'go run ./backend/cmd/migration_runner force <version>' for explicit resets."
	@exit 1

# Show current migration version
migrate-version:
	cd backend && go run ./cmd/migration_runner version

# Force set migration version (use when stuck)
migrate-force:
	@read -p "Enter version to force: " version; \
	cd backend && go run ./cmd/migration_runner force $$version

# Create a new migration file
migrate-create:
	@read -p "Enter migration name: " name; \
	migrate create -ext sql -dir ./backend/internal/db/migrations -seq $$name

# Verify schema matches expected tables/columns
migrate-verify:
	cd backend && go run ./cmd/migrate
