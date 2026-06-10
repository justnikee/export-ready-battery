// Command migrate-uploads is a one-off tool that uploads the legacy,
// committed services/battery-api/uploads/{tenant_id}/ files (certificates and
// logos) to Supabase Storage and updates the corresponding tenant records to
// point at the resulting public URLs.
//
// It is idempotent: any file whose DB column already holds an https:// URL is
// skipped. Run it against the target environment's DATABASE_URL / SUPABASE_*
// before removing services/battery-api/uploads from git tracking.
package main

import (
	"context"
	"fmt"
	"log/slog"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/joho/godotenv"

	"github.com/anvayalabs/battery-api/internal/db"
	"github.com/anvayalabs/battery-api/internal/models"
	"github.com/anvayalabs/battery-api/internal/repository"
	"github.com/anvayalabs/battery-api/internal/services"
)

const (
	uploadsDir           = "uploads"
	complianceDocsBucket = "compliance-docs"
)

var certFilenames = map[string]string{
	"bis.pdf": "bis",
	"epr.pdf": "epr",
	"pli.pdf": "pli",
}

func main() {
	_ = godotenv.Load()

	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		fmt.Println("FAIL: DATABASE_URL not set")
		os.Exit(1)
	}
	if os.Getenv("SUPABASE_URL") == "" || os.Getenv("SUPABASE_SERVICE_ROLE_KEY") == "" {
		fmt.Println("FAIL: SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not set")
		os.Exit(1)
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Minute)
	defer cancel()

	database, err := db.Connect(dbURL)
	if err != nil {
		fmt.Printf("FAIL connect: %v\n", err)
		os.Exit(1)
	}
	defer database.Close()

	repo := repository.New(database)
	storage := services.NewStorageService(slog.Default())

	entries, err := os.ReadDir(uploadsDir)
	if err != nil {
		fmt.Printf("FAIL reading %s: %v\n", uploadsDir, err)
		os.Exit(1)
	}

	for _, entry := range entries {
		if !entry.IsDir() {
			continue
		}

		tenantID, err := uuid.Parse(entry.Name())
		if err != nil {
			fmt.Printf("[SKIP] %s — not a tenant UUID directory\n", entry.Name())
			continue
		}

		tenant, err := repo.GetTenant(ctx, tenantID)
		if err != nil {
			fmt.Printf("[ERROR] %s: failed to load tenant: %v\n", tenantID, err)
			continue
		}

		tenantDir := filepath.Join(uploadsDir, entry.Name())
		files, err := os.ReadDir(tenantDir)
		if err != nil {
			fmt.Printf("[ERROR] reading %s: %v\n", tenantDir, err)
			continue
		}

		for _, f := range files {
			if f.IsDir() {
				continue
			}

			name := f.Name()
			lower := strings.ToLower(name)
			switch {
			case certFilenames[lower] != "":
				migrateCertificate(ctx, repo, storage, tenant, tenantDir, name, certFilenames[lower])
			case strings.HasPrefix(lower, "logo."):
				migrateLogo(ctx, repo, storage, tenant, tenantDir, name)
			default:
				fmt.Printf("[SKIP] %s/%s — unrecognized file\n", entry.Name(), name)
			}
		}
	}

	fmt.Println("\nDone. After verifying the migrated URLs, run:")
	fmt.Println("  git rm -r --cached services/battery-api/uploads")
}

func migrateCertificate(ctx context.Context, repo *repository.Repository, storage *services.StorageService, tenant *models.Tenant, tenantDir, filename, docType string) {
	var current string
	if tenant.BatteryProfile != nil {
		switch docType {
		case "bis":
			current = tenant.BatteryProfile.BISCertificatePath
		case "epr":
			current = tenant.BatteryProfile.EPRCertificatePath
		case "pli":
			current = tenant.BatteryProfile.PLICertificatePath
		}
	}
	if strings.HasPrefix(current, "https://") {
		fmt.Printf("[SKIP] %s/%s already migrated (%s)\n", tenant.ID, filename, current)
		return
	}

	data, err := os.ReadFile(filepath.Join(tenantDir, filename))
	if err != nil {
		fmt.Printf("[ERROR] %s/%s: read failed: %v\n", tenant.ID, filename, err)
		return
	}

	storagePath := fmt.Sprintf("%s/certificates/%s.pdf", tenant.ID.String(), docType)
	if err := storage.UploadFileToBucket(ctx, complianceDocsBucket, storagePath, data, "application/pdf"); err != nil {
		fmt.Printf("[ERROR] %s/%s: upload failed: %v\n", tenant.ID, filename, err)
		return
	}

	publicURL := storage.PublicURL(complianceDocsBucket, storagePath)
	if err := repo.UpdateCertificatePath(ctx, tenant.ID, docType, publicURL); err != nil {
		fmt.Printf("[ERROR] %s/%s: db update failed: %v\n", tenant.ID, filename, err)
		return
	}

	fmt.Printf("[OK] %s/%s -> %s\n", tenant.ID, filename, publicURL)
}

func migrateLogo(ctx context.Context, repo *repository.Repository, storage *services.StorageService, tenant *models.Tenant, tenantDir, filename string) {
	if strings.HasPrefix(tenant.LogoURL, "https://") {
		fmt.Printf("[SKIP] %s/%s already migrated (%s)\n", tenant.ID, filename, tenant.LogoURL)
		return
	}

	data, err := os.ReadFile(filepath.Join(tenantDir, filename))
	if err != nil {
		fmt.Printf("[ERROR] %s/%s: read failed: %v\n", tenant.ID, filename, err)
		return
	}

	ext := strings.ToLower(filepath.Ext(filename))
	contentType := "application/octet-stream"
	switch ext {
	case ".png":
		contentType = "image/png"
	case ".jpg", ".jpeg":
		contentType = "image/jpeg"
	}

	storagePath := fmt.Sprintf("%s/logo%s", tenant.ID.String(), ext)
	if err := storage.UploadFileToBucket(ctx, complianceDocsBucket, storagePath, data, contentType); err != nil {
		fmt.Printf("[ERROR] %s/%s: upload failed: %v\n", tenant.ID, filename, err)
		return
	}

	publicURL := storage.PublicURL(complianceDocsBucket, storagePath)
	if err := repo.UpdateLogoURL(ctx, tenant.ID, publicURL); err != nil {
		fmt.Printf("[ERROR] %s/%s: db update failed: %v\n", tenant.ID, filename, err)
		return
	}

	fmt.Printf("[OK] %s/%s -> %s\n", tenant.ID, filename, publicURL)
}
