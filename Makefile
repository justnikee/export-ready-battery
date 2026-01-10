.PHONY: run build test clean deps migrate-up migrate-down migrate-create migrate-force

# Load .env file for database URL (from backend for consistency)
include backend/.env
export

# Run the server
run:
	cd backend && go run ./cmd/server

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
# Database Migrations (golang-migrate)
# Install: go install -tags 'postgres' github.com/golang-migrate/migrate/v4/cmd/migrate@latest
# ============================================

# Run all pending migrations
migrate-up:
	migrate -path ./db/migrations -database "$(DATABASE_URL)" -verbose up

# Rollback the last migration
migrate-down:
	migrate -path ./db/migrations -database "$(DATABASE_URL)" -verbose down 1

# Rollback ALL migrations (use with caution!)
migrate-reset:
	migrate -path ./db/migrations -database "$(DATABASE_URL)" -verbose down -all

# Show current migration version
migrate-version:
	migrate -path ./db/migrations -database "$(DATABASE_URL)" version

# Force set migration version (use when stuck)
migrate-force:
	@read -p "Enter version to force: " version; \
	migrate -path ./db/migrations -database "$(DATABASE_URL)" force $$version

# Create a new migration file
migrate-create:
	@read -p "Enter migration name: " name; \
	migrate create -ext sql -dir ./db/migrations -seq $$name
