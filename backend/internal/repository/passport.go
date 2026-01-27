package repository

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"

	"exportready-battery/internal/models"
)

// CreatePassport creates a single passport
func (r *Repository) CreatePassport(ctx context.Context, passport *models.Passport) error {
	query := `INSERT INTO public.passports (uuid, batch_id, serial_number, manufacture_date, status, created_at) 
	          VALUES ($1, $2, $3, $4, $5, $6)`

	_, err := r.db.Pool.Exec(ctx, query,
		passport.UUID,
		passport.BatchID,
		passport.SerialNumber,
		passport.ManufactureDate,
		passport.Status,
		passport.CreatedAt,
	)
	if err != nil {
		return fmt.Errorf("failed to create passport: %w", err)
	}

	return nil
}

// CreatePassportsBatch inserts multiple passports efficiently using COPY
func (r *Repository) CreatePassportsBatch(ctx context.Context, passports []*models.Passport) (int, error) {
	if len(passports) == 0 {
		return 0, nil
	}

	// Use CopyFrom for bulk insert (much faster than individual inserts)
	columns := []string{"uuid", "batch_id", "serial_number", "manufacture_date", "status", "created_at"}

	rows := make([][]interface{}, len(passports))
	for i, p := range passports {
		rows[i] = []interface{}{p.UUID, p.BatchID, p.SerialNumber, p.ManufactureDate, p.Status, p.CreatedAt}
	}

	copyCount, err := r.db.Pool.CopyFrom(
		ctx,
		pgx.Identifier{"public", "passports"},
		columns,
		pgx.CopyFromRows(rows),
	)
	if err != nil {
		return 0, fmt.Errorf("failed to bulk insert passports: %w", err)
	}

	return int(copyCount), nil
}

// GetPassport retrieves a passport by UUID
func (r *Repository) GetPassport(ctx context.Context, id uuid.UUID) (*models.Passport, error) {
	passport := &models.Passport{}

	query := `SELECT uuid, batch_id, serial_number, manufacture_date, status, created_at 
	          FROM public.passports WHERE uuid = $1`

	err := r.db.Pool.QueryRow(ctx, query, id).Scan(
		&passport.UUID,
		&passport.BatchID,
		&passport.SerialNumber,
		&passport.ManufactureDate,
		&passport.Status,
		&passport.CreatedAt,
	)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, fmt.Errorf("passport not found")
		}
		return nil, fmt.Errorf("failed to get passport: %w", err)
	}

	return passport, nil
}

// GetPassportWithSpecs retrieves a passport with its batch specs (for public page)
func (r *Repository) GetPassportWithSpecs(ctx context.Context, id uuid.UUID) (*models.PassportWithSpecs, error) {
	query := `
		SELECT p.uuid, p.batch_id, p.serial_number, p.manufacture_date, p.status, p.created_at,
		       b.batch_name, b.specs, b.market_region,
		       COALESCE(b.cell_source, ''), COALESCE(b.bill_of_entry_no, ''), COALESCE(b.country_of_origin, ''),
		       b.domestic_value_add, b.pli_compliant, b.customs_date, COALESCE(b.hsn_code, ''),
		       t.company_name, COALESCE(t.address, ''), COALESCE(t.logo_url, ''), COALESCE(t.support_email, ''), COALESCE(t.website, ''),
		       COALESCE(t.epr_registration_number, ''), COALESCE(t.bis_r_number, ''),
		       COALESCE(t.epr_certificate_path, ''), COALESCE(t.bis_certificate_path, ''), COALESCE(t.pli_certificate_path, ''),
		       t.id
		FROM public.passports p
		JOIN public.batches b ON p.batch_id = b.id
		JOIN public.tenants t ON b.tenant_id = t.id
		WHERE p.uuid = $1
	`

	passport := &models.Passport{}
	var batchName string
	var specsJSON []byte
	var marketRegion models.MarketRegion
	var cellSource, billOfEntry, countryOrigin, hsnCode string
	var domesticValueAdd float64
	var pliCompliant bool
	var customsDate *time.Time
	tenant := &models.Tenant{}

	err := r.db.Pool.QueryRow(ctx, query, id).Scan(
		&passport.UUID,
		&passport.BatchID,
		&passport.SerialNumber,
		&passport.ManufactureDate,
		&passport.Status,
		&passport.CreatedAt,
		&batchName,
		&specsJSON,
		&marketRegion,
		&cellSource,
		&billOfEntry,
		&countryOrigin,
		&domesticValueAdd,
		&pliCompliant,
		&customsDate,
		&hsnCode,
		&tenant.CompanyName,
		&tenant.Address,
		&tenant.LogoURL,
		&tenant.SupportEmail,
		&tenant.Website,
		&tenant.EPRRegistrationNumber,
		&tenant.BISRNumber,
		&tenant.EPRCertificatePath,
		&tenant.BISCertificatePath,
		&tenant.PLICertificatePath,
		&tenant.ID,
	)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, fmt.Errorf("passport not found")
		}
		return nil, fmt.Errorf("failed to get passport with specs: %w", err)
	}

	specs := &models.BatchSpec{}
	if len(specsJSON) > 0 {
		if err := json.Unmarshal(specsJSON, specs); err != nil {
			return nil, fmt.Errorf("failed to unmarshal specs: %w", err)
		}
	}

	return &models.PassportWithSpecs{
		Passport:         passport,
		BatchName:        batchName,
		Specs:            specs,
		MarketRegion:     marketRegion,
		Tenant:           tenant,
		CellSource:       cellSource,
		BillOfEntryNo:    billOfEntry,
		CountryOfOrigin:  countryOrigin,
		DomesticValueAdd: domesticValueAdd,
		PLICompliant:     pliCompliant,
		CustomsDate:      customsDate,
		HSNCode:          hsnCode,
	}, nil
}

// GetPassportsByBatch retrieves passports for a batch with pagination
func (r *Repository) GetPassportsByBatch(ctx context.Context, batchID uuid.UUID, limit, offset int) ([]*models.Passport, error) {
	query := `SELECT uuid, batch_id, serial_number, manufacture_date, status, created_at 
	          FROM public.passports WHERE batch_id = $1 ORDER BY serial_number LIMIT $2 OFFSET $3`

	rows, err := r.db.Pool.Query(ctx, query, batchID, limit, offset)
	if err != nil {
		return nil, fmt.Errorf("failed to get passports: %w", err)
	}
	defer rows.Close()

	var passports []*models.Passport
	for rows.Next() {
		passport := &models.Passport{}
		if err := rows.Scan(
			&passport.UUID,
			&passport.BatchID,
			&passport.SerialNumber,
			&passport.ManufactureDate,
			&passport.Status,
			&passport.CreatedAt,
		); err != nil {
			return nil, fmt.Errorf("failed to scan passport: %w", err)
		}
		passports = append(passports, passport)
	}

	return passports, nil
}

// CountPassportsByBatch returns the number of passports in a batch
func (r *Repository) CountPassportsByBatch(ctx context.Context, batchID uuid.UUID) (int, error) {
	var count int
	query := `SELECT COUNT(*) FROM public.passports WHERE batch_id = $1`
	err := r.db.Pool.QueryRow(ctx, query, batchID).Scan(&count)
	if err != nil {
		return 0, fmt.Errorf("failed to count passports: %w", err)
	}
	return count, nil
}

// DuplicateInfo represents info about an existing serial number
type DuplicateInfo struct {
	SerialNumber string `json:"serial_number"`
	BatchID      string `json:"existing_batch_id"`
	BatchName    string `json:"existing_batch"`
}

// FindDuplicateSerials checks if any of the provided serial numbers already exist
func (r *Repository) FindDuplicateSerials(ctx context.Context, serials []string) ([]DuplicateInfo, error) {
	if len(serials) == 0 {
		return nil, nil
	}

	query := `
		SELECT p.serial_number, b.id, b.batch_name
		FROM public.passports p
		JOIN public.batches b ON p.batch_id = b.id
		WHERE p.serial_number = ANY($1)
	`

	rows, err := r.db.Pool.Query(ctx, query, serials)
	if err != nil {
		return nil, fmt.Errorf("failed to find duplicates: %w", err)
	}
	defer rows.Close()

	var duplicates []DuplicateInfo
	for rows.Next() {
		var dup DuplicateInfo
		if err := rows.Scan(&dup.SerialNumber, &dup.BatchID, &dup.BatchName); err != nil {
			return nil, fmt.Errorf("failed to scan duplicate: %w", err)
		}
		duplicates = append(duplicates, dup)
	}

	return duplicates, nil
}

// ============================================================================
// LIFECYCLE METHODS
// ============================================================================

// GetPassportByUUID retrieves a passport by UUID (alias for lifecycle service)
func (r *Repository) GetPassportByUUID(ctx context.Context, id uuid.UUID) (*models.Passport, error) {
	return r.GetPassport(ctx, id)
}

// UpdatePassportStatus updates a passport's status
func (r *Repository) UpdatePassportStatus(ctx context.Context, id uuid.UUID, status string) error {
	query := `UPDATE public.passports SET status = $1 WHERE uuid = $2`
	_, err := r.db.Pool.Exec(ctx, query, status, id)
	if err != nil {
		return fmt.Errorf("failed to update passport status: %w", err)
	}
	return nil
}

// UpdatePassportLifecycle updates lifecycle-specific fields
func (r *Repository) UpdatePassportLifecycle(ctx context.Context, passport *models.Passport) error {
	query := `UPDATE public.passports 
	          SET status = $1, shipped_at = $2, installed_at = $3, returned_at = $4, 
	              state_of_health = $5, owner_id = $6
	          WHERE uuid = $7`
	_, err := r.db.Pool.Exec(ctx, query,
		passport.Status,
		passport.ShippedAt,
		passport.InstalledAt,
		passport.ReturnedAt,
		passport.StateOfHealth,
		passport.OwnerID,
		passport.UUID,
	)
	if err != nil {
		return fmt.Errorf("failed to update passport lifecycle: %w", err)
	}
	return nil
}

// CreatePassportEvent logs a lifecycle event
func (r *Repository) CreatePassportEvent(ctx context.Context, event *models.PassportEvent) error {
	query := `INSERT INTO public.passport_events (id, passport_id, event_type, actor, metadata, created_at) 
	          VALUES ($1, $2, $3, $4, $5, $6)`

	metadataJSON, err := json.Marshal(event.Metadata)
	if err != nil {
		return fmt.Errorf("failed to marshal event metadata: %w", err)
	}

	_, err = r.db.Pool.Exec(ctx, query,
		event.ID,
		event.PassportID,
		event.EventType,
		event.Actor,
		metadataJSON,
		event.CreatedAt,
	)
	if err != nil {
		return fmt.Errorf("failed to create passport event: %w", err)
	}
	return nil
}

// GetPassportEvents retrieves all events for a passport
func (r *Repository) GetPassportEvents(ctx context.Context, passportID uuid.UUID) ([]*models.PassportEvent, error) {
	query := `SELECT id, passport_id, event_type, actor, metadata, created_at 
	          FROM public.passport_events 
	          WHERE passport_id = $1 
	          ORDER BY created_at DESC`

	rows, err := r.db.Pool.Query(ctx, query, passportID)
	if err != nil {
		return nil, fmt.Errorf("failed to get passport events: %w", err)
	}
	defer rows.Close()

	var events []*models.PassportEvent
	for rows.Next() {
		event := &models.PassportEvent{}
		var metadataJSON []byte
		if err := rows.Scan(
			&event.ID,
			&event.PassportID,
			&event.EventType,
			&event.Actor,
			&metadataJSON,
			&event.CreatedAt,
		); err != nil {
			return nil, fmt.Errorf("failed to scan event: %w", err)
		}

		if len(metadataJSON) > 0 {
			if err := json.Unmarshal(metadataJSON, &event.Metadata); err != nil {
				return nil, fmt.Errorf("failed to unmarshal event metadata: %w", err)
			}
		}

		events = append(events, event)
	}

	return events, nil
}
