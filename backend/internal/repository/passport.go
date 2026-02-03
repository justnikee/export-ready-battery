package repository

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"

	"exportready-battery/internal/models"
)

// CreatePassport creates a single passport
func (r *Repository) CreatePassport(ctx context.Context, passport *models.Passport) error {
	query := `INSERT INTO public.passports (uuid, batch_id, serial_number, manufacture_date, status, created_at, batch_snapshot, current_owner_identifier, ownership_history, state_of_health, last_soh_update_timestamp, csv_source_filename, csv_row_index) 
	          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`

	_, err := r.db.Pool.Exec(ctx, query,
		passport.UUID,
		passport.BatchID,
		passport.SerialNumber,
		passport.ManufactureDate,
		passport.Status,
		passport.CreatedAt,
		passport.BatchSnapshot,
		passport.CurrentOwnerIdentifier,
		passport.OwnershipHistory,
		passport.StateOfHealth,
		passport.LastSOHUpdateTimestamp,
		passport.CSVSourceFilename,
		passport.CSVRowIndex,
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
	columns := []string{"uuid", "batch_id", "serial_number", "manufacture_date", "status", "created_at", "batch_snapshot", "current_owner_identifier", "ownership_history", "state_of_health", "last_soh_update_timestamp", "csv_source_filename", "csv_row_index"}

	rows := make([][]interface{}, len(passports))
	for i, p := range passports {
		rows[i] = []interface{}{p.UUID, p.BatchID, p.SerialNumber, p.ManufactureDate, p.Status, p.CreatedAt, p.BatchSnapshot, p.CurrentOwnerIdentifier, p.OwnershipHistory, p.StateOfHealth, p.LastSOHUpdateTimestamp, p.CSVSourceFilename, p.CSVRowIndex}
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
		       p.batch_snapshot, p.current_owner_identifier, p.current_owner_email,
		       p.shipped_at, p.installed_at, p.returned_at, p.recycled_at,
		       p.state_of_health, p.last_soh_update_timestamp,
		       p.ownership_history, p.repair_events, p.replacement_events,
		       p.recycling_status, p.recycler_epr_id, p.recycling_date, p.owner_id,
		       b.batch_name, COALESCE(b.model_name, ''), b.specs, b.market_region,
       b.manufacturing_start_date, b.manufacturing_end_date,
       COALESCE(b.cell_source, ''), COALESCE(b.bill_of_entry_no, ''), COALESCE(b.country_of_origin, ''),
       b.domestic_value_add, b.pli_compliant, b.customs_date, COALESCE(b.hsn_code, ''),
		       t.company_name, COALESCE(t.address, ''), COALESCE(t.logo_url, ''), COALESCE(t.support_email, ''), COALESCE(t.website, ''),
		       COALESCE(t.epr_registration_number, ''), COALESCE(t.bis_r_number, ''),
		       COALESCE(t.epr_certificate_path, ''), COALESCE(t.bis_certificate_path, ''), COALESCE(t.pli_certificate_path, ''),
		       COALESCE(t.eu_authorized_representative_name, ''), COALESCE(t.eu_authorized_representative_address, ''), COALESCE(t.eu_contact_email, ''),
		       t.id
		FROM public.passports p
		JOIN public.batches b ON p.batch_id = b.id
		JOIN public.tenants t ON b.tenant_id = t.id
		WHERE p.uuid = $1
	`

	passport := &models.Passport{}
	var batchName string
	var modelName string
	var specsJSON []byte
	var marketRegion models.MarketRegion
	var manufacturingStartDate, manufacturingEndDate *time.Time
	var cellSource, billOfEntry, countryOrigin, hsnCode string
	var domesticValueAdd float64
	var pliCompliant bool
	var customsDate *time.Time
	var batchSnapshotJSON []byte
	var ownershipHistoryJSON []byte
	var repairEventsJSON []byte
	var replacementEventsJSON []byte
	var soh sql.NullFloat64
	var currentOwnerIdentifier sql.NullString
	var currentOwnerEmail sql.NullString
	var recyclingStatus sql.NullString
	var recyclerEprID sql.NullString
	var ownerID *uuid.UUID
	tenant := &models.Tenant{}

	err := r.db.Pool.QueryRow(ctx, query, id).Scan(
		&passport.UUID,
		&passport.BatchID,
		&passport.SerialNumber,
		&passport.ManufactureDate,
		&passport.Status,
		&passport.CreatedAt,
		&batchSnapshotJSON,
		&currentOwnerIdentifier,
		&currentOwnerEmail,
		&passport.ShippedAt,
		&passport.InstalledAt,
		&passport.ReturnedAt,
		&passport.RecycledAt,
		&soh,
		&passport.LastSOHUpdateTimestamp,
		&ownershipHistoryJSON,
		&repairEventsJSON,
		&replacementEventsJSON,
		&recyclingStatus,
		&recyclerEprID,
		&passport.RecyclingDate,
		&ownerID,
		&batchName,
		&modelName,
		&specsJSON,
		&marketRegion,
		&manufacturingStartDate,
		&manufacturingEndDate,
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
		&tenant.EUAuthorizedRepresentativeName,
		&tenant.EUAuthorizedRepresentativeAddress,
		&tenant.EUContactEmail,
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

	if len(batchSnapshotJSON) > 0 {
		passport.BatchSnapshot = batchSnapshotJSON
	}
	if currentOwnerIdentifier.Valid {
		passport.CurrentOwnerIdentifier = currentOwnerIdentifier.String
	}
	if currentOwnerEmail.Valid {
		passport.CurrentOwnerEmail = currentOwnerEmail.String
	}
	if soh.Valid {
		passport.StateOfHealth = &soh.Float64
	}
	if len(ownershipHistoryJSON) > 0 {
		passport.OwnershipHistory = ownershipHistoryJSON
	}
	if len(repairEventsJSON) > 0 {
		passport.RepairEvents = repairEventsJSON
	}
	if len(replacementEventsJSON) > 0 {
		passport.ReplacementEvents = replacementEventsJSON
	}
	if recyclingStatus.Valid {
		passport.RecyclingStatus = recyclingStatus.String
	}
	if recyclerEprID.Valid {
		passport.RecyclerEprID = recyclerEprID.String
	}
	passport.OwnerID = ownerID

	return &models.PassportWithSpecs{
		Passport:               passport,
		BatchName:              batchName,
		ModelName:              modelName,
		Specs:                  specs,
		MarketRegion:           marketRegion,
		Tenant:                 tenant,
		ManufacturingStartDate: manufacturingStartDate,
		ManufacturingEndDate:   manufacturingEndDate,
		CellSource:             cellSource,
		BillOfEntryNo:          billOfEntry,
		CountryOfOrigin:        countryOrigin,
		DomesticValueAdd:       domesticValueAdd,
		PLICompliant:           pliCompliant,
		CustomsDate:            customsDate,
		HSNCode:                hsnCode,
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

// CreatePassportEvent logs a lifecycle event with tamper-proof hash
func (r *Repository) CreatePassportEvent(ctx context.Context, event *models.PassportEvent) error {
	query := `INSERT INTO public.passport_events (id, passport_id, event_type, actor, actor_type, actor_identifier, source, status_from, status_to, ip_address, metadata, created_at, hash, previous_hash) 
	          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`

	metadataJSON, err := json.Marshal(event.Metadata)
	if err != nil {
		return fmt.Errorf("failed to marshal event metadata: %w", err)
	}

	_, err = r.db.Pool.Exec(ctx, query,
		event.ID,
		event.PassportID,
		event.EventType,
		event.Actor,
		event.ActorType,
		event.ActorID,
		event.Source,
		event.StatusFrom,
		event.StatusTo,
		event.IPAddress,
		metadataJSON,
		event.CreatedAt,
		event.Hash,
		event.PreviousHash,
	)
	if err != nil {
		return fmt.Errorf("failed to create passport event: %w", err)
	}
	return nil
}

// GetPassportEvents retrieves all events for a passport with hash chain data
func (r *Repository) GetPassportEvents(ctx context.Context, passportID uuid.UUID) ([]*models.PassportEvent, error) {
	query := `SELECT id, passport_id, event_type, actor,
	                 COALESCE(actor_type, ''), COALESCE(actor_identifier, ''), COALESCE(source, ''),
	                 COALESCE(status_from, ''), COALESCE(status_to, ''), COALESCE(ip_address, ''),
	                 metadata, created_at, COALESCE(hash, ''), COALESCE(previous_hash, '') 
	          FROM public.passport_events 
	          WHERE passport_id = $1 
	          ORDER BY created_at ASC`

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
			&event.ActorType,
			&event.ActorID,
			&event.Source,
			&event.StatusFrom,
			&event.StatusTo,
			&event.IPAddress,
			&metadataJSON,
			&event.CreatedAt,
			&event.Hash,
			&event.PreviousHash,
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

// CreatePassportEventBatch inserts multiple passport events efficiently using COPY
func (r *Repository) CreatePassportEventBatch(ctx context.Context, events []*models.PassportEvent) error {
	if len(events) == 0 {
		return nil
	}

	// Prepare rows for bulk insert
	rows := make([][]interface{}, len(events))
	for i, e := range events {
		metadataJSON, err := json.Marshal(e.Metadata)
		if err != nil {
			return fmt.Errorf("failed to marshal metadata for event %d: %w", i, err)
		}

		rows[i] = []interface{}{
			e.ID,
			e.PassportID,
			e.EventType,
			e.Actor,
			e.ActorType,
			e.ActorID,
			e.Source,
			e.StatusFrom,
			e.StatusTo,
			e.IPAddress,
			metadataJSON,
			e.CreatedAt,
			e.Hash,
			e.PreviousHash,
		}
	}

	columns := []string{"id", "passport_id", "event_type", "actor", "actor_type", "actor_identifier", "source", "status_from", "status_to", "ip_address", "metadata", "created_at", "hash", "previous_hash"}

	_, err := r.db.Pool.CopyFrom(
		ctx,
		pgx.Identifier{"public", "passport_events"},
		columns,
		pgx.CopyFromRows(rows),
	)
	if err != nil {
		return fmt.Errorf("failed to bulk insert passport events: %w", err)
	}

	return nil
}

// UpdatePassportOwnerID updates the owner_id for a passport (used for ownership transfers)
// Named differently from UpdatePassportOwner in magic_link.go which updates owner email
func (r *Repository) UpdatePassportOwnerID(ctx context.Context, passportID uuid.UUID, newOwnerID uuid.UUID) error {
	query := `UPDATE public.passports SET owner_id = $1 WHERE uuid = $2`
	result, err := r.db.Pool.Exec(ctx, query, newOwnerID, passportID)
	if err != nil {
		return fmt.Errorf("failed to update passport owner: %w", err)
	}
	if result.RowsAffected() == 0 {
		return fmt.Errorf("passport not found: %s", passportID)
	}
	return nil
}

// CountPassportsMissingShippedEvent returns count of passports in a batch without a SHIPPED event
func (r *Repository) CountPassportsMissingShippedEvent(ctx context.Context, batchID uuid.UUID) (int, error) {
	var count int
	query := `
		SELECT COUNT(*)
		FROM public.passports p
		WHERE p.batch_id = $1
		  AND NOT EXISTS (
			  SELECT 1 FROM public.passport_events e
			  WHERE e.passport_id = p.uuid AND e.event_type = 'SHIPPED'
		  )
	`
	if err := r.db.Pool.QueryRow(ctx, query, batchID).Scan(&count); err != nil {
		return 0, fmt.Errorf("failed to count missing shipped events: %w", err)
	}
	return count, nil
}

// AppendOwnershipHistory appends a single ownership entry to the passport's ownership_history array
func (r *Repository) AppendOwnershipHistory(ctx context.Context, passportID uuid.UUID, entryJSON []byte) error {
	query := `
		UPDATE public.passports
		SET ownership_history = COALESCE(ownership_history, '[]'::jsonb) || $2::jsonb
		WHERE uuid = $1`
	_, err := r.db.Pool.Exec(ctx, query, passportID, entryJSON)
	if err != nil {
		return fmt.Errorf("failed to append ownership history: %w", err)
	}
	return nil
}

// AppendRepairEvent appends a repair event entry to repair_events
func (r *Repository) AppendRepairEvent(ctx context.Context, passportID uuid.UUID, entryJSON []byte) error {
	query := `
		UPDATE public.passports
		SET repair_events = COALESCE(repair_events, '[]'::jsonb) || $2::jsonb
		WHERE uuid = $1`
	_, err := r.db.Pool.Exec(ctx, query, passportID, entryJSON)
	if err != nil {
		return fmt.Errorf("failed to append repair event: %w", err)
	}
	return nil
}

// AppendReplacementEvent appends a replacement event entry to replacement_events
func (r *Repository) AppendReplacementEvent(ctx context.Context, passportID uuid.UUID, entryJSON []byte) error {
	query := `
		UPDATE public.passports
		SET replacement_events = COALESCE(replacement_events, '[]'::jsonb) || $2::jsonb
		WHERE uuid = $1`
	_, err := r.db.Pool.Exec(ctx, query, passportID, entryJSON)
	if err != nil {
		return fmt.Errorf("failed to append replacement event: %w", err)
	}
	return nil
}

// UpdateStateOfHealth updates SoH and timestamp
func (r *Repository) UpdateStateOfHealth(ctx context.Context, passportID uuid.UUID, soh float64, ts time.Time) error {
	query := `UPDATE public.passports SET state_of_health = $2, last_soh_update_timestamp = $3 WHERE uuid = $1`
	_, err := r.db.Pool.Exec(ctx, query, passportID, soh, ts)
	if err != nil {
		return fmt.Errorf("failed to update state of health: %w", err)
	}
	return nil
}

// SetRecyclingInfo updates India-specific recycling fields
func (r *Repository) SetRecyclingInfo(ctx context.Context, passportID uuid.UUID, status, recyclerEprID string, date time.Time) error {
	query := `
		UPDATE public.passports
		SET recycling_status = $2,
		    recycler_epr_id = $3,
		    recycling_date = $4,
		    recycled_at = NOW()
		WHERE uuid = $1`
	_, err := r.db.Pool.Exec(ctx, query, passportID, status, recyclerEprID, date)
	if err != nil {
		return fmt.Errorf("failed to update recycling info: %w", err)
	}
	return nil
}
