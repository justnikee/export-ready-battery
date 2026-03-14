package repository

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"

	"exportready-battery/internal/models"
)

type copyFromer interface {
	CopyFrom(ctx context.Context, tableName pgx.Identifier, columnNames []string, rows pgx.CopyFromSource) (int64, error)
}

func copyPassports(ctx context.Context, exec copyFromer, passports []*models.Passport) (int, error) {
	if len(passports) == 0 {
		return 0, nil
	}

	columns := []string{"uuid", "batch_id", "serial_number", "manufacture_date", "status", "created_at", "batch_snapshot", "current_owner_identifier", "ownership_history", "state_of_health", "last_soh_update_timestamp", "csv_source_filename", "csv_row_index"}

	rows := make([][]interface{}, len(passports))
	for i, p := range passports {
		rows[i] = []interface{}{p.UUID, p.BatchID, p.SerialNumber, p.ManufactureDate, p.Status, p.CreatedAt, p.BatchSnapshot, p.CurrentOwnerIdentifier, p.OwnershipHistory, p.StateOfHealth, p.LastSOHUpdateTimestamp, p.CSVSourceFilename, p.CSVRowIndex}
	}

	copyCount, err := exec.CopyFrom(
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

func copyPassportEvents(ctx context.Context, exec copyFromer, events []*models.PassportEvent) error {
	if len(events) == 0 {
		return nil
	}

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
			nullableString(string(e.Action)),
			e.Actor,
			e.ActorType,
			nullableString(string(e.ActorRole)),
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

	columns := []string{"id", "passport_id", "event_type", "action", "actor", "actor_type", "actor_role", "actor_identifier", "source", "status_from", "status_to", "ip_address", "metadata", "created_at", "hash", "previous_hash"}

	_, err := exec.CopyFrom(
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
	return copyPassports(ctx, r.db.Pool, passports)
}

// CreatePassportsWithEvents inserts passports and genesis events in a single transaction.
func (r *Repository) CreatePassportsWithEvents(ctx context.Context, passports []*models.Passport, events []*models.PassportEvent) (int, error) {
	if len(passports) == 0 {
		return 0, nil
	}
	if len(events) != len(passports) {
		return 0, fmt.Errorf("passports and events length mismatch")
	}

	tx, err := r.db.Pool.BeginTx(ctx, pgx.TxOptions{})
	if err != nil {
		return 0, fmt.Errorf("failed to begin passport transaction: %w", err)
	}
	defer tx.Rollback(ctx)

	insertedCount, err := copyPassports(ctx, tx, passports)
	if err != nil {
		return 0, err
	}

	if err := copyPassportEvents(ctx, tx, events); err != nil {
		return 0, err
	}

	if err := tx.Commit(ctx); err != nil {
		return 0, fmt.Errorf("failed to commit passport transaction: %w", err)
	}

	return insertedCount, nil
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
       b.domestic_value_add, b.pli_compliant, b.customs_date, COALESCE(b.hsn_code, ''), COALESCE(b.dva_source, ''),
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
	var cellSource, billOfEntry, countryOrigin, hsnCode, dvaSource string
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
		&dvaSource,
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
		DVASource:              dvaSource,
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

type execer interface {
	Exec(ctx context.Context, sql string, arguments ...any) (pgconn.CommandTag, error)
}

func nullableString(value string) interface{} {
	if value == "" {
		return nil
	}
	return value
}

func insertPassportEvent(ctx context.Context, exec execer, event *models.PassportEvent) error {
	query := `INSERT INTO public.passport_events (id, passport_id, event_type, action, actor, actor_type, actor_role, actor_identifier, source, status_from, status_to, ip_address, metadata, created_at, hash, previous_hash) 
	          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)`

	metadataJSON, err := json.Marshal(event.Metadata)
	if err != nil {
		return fmt.Errorf("failed to marshal event metadata: %w", err)
	}

	_, err = exec.Exec(ctx, query,
		event.ID,
		event.PassportID,
		event.EventType,
		nullableString(string(event.Action)),
		event.Actor,
		event.ActorType,
		nullableString(string(event.ActorRole)),
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

// ApplyLifecycleTransition persists an audit event and state update atomically.
func (r *Repository) ApplyLifecycleTransition(ctx context.Context, params models.TransitionPersistence) error {
	if params.Event == nil {
		return fmt.Errorf("missing audit event for transition")
	}

	tx, err := r.db.Pool.BeginTx(ctx, pgx.TxOptions{})
	if err != nil {
		return fmt.Errorf("failed to begin transition transaction: %w", err)
	}
	defer tx.Rollback(ctx)

	if err := insertPassportEvent(ctx, tx, params.Event); err != nil {
		return err
	}

	query := `UPDATE public.passports
	          SET status = $1,
	              shipped_at = COALESCE($2, shipped_at),
	              installed_at = COALESCE($3, installed_at),
	              recycled_at = COALESCE($4, recycled_at),
	              recycling_status = COALESCE($5, recycling_status),
	              recycler_epr_id = COALESCE($6, recycler_epr_id),
	              recycling_date = COALESCE($7, recycling_date)
	          WHERE uuid = $8`
	_, err = tx.Exec(ctx, query,
		params.NewStatus,
		params.ShippedAt,
		params.InstalledAt,
		params.RecycledAt,
		nullableString(params.RecyclingStatus),
		nullableString(params.RecyclerEprID),
		params.RecyclingDate,
		params.PassportID,
	)
	if err != nil {
		return fmt.Errorf("failed to update passport status: %w", err)
	}

	if params.MagicLinkTokenHash != "" {
		if params.Event == nil {
			return fmt.Errorf("missing event for magic link token consumption")
		}
		updateTokenQuery := `UPDATE public.magic_link_tokens
	          SET used_at = NOW()
	          WHERE token_hash = $1
	            AND used_at IS NULL
	            AND expires_at > NOW()
	            AND passport_id = $2
	            AND role = $3
	            AND action = $4`
		tag, err := tx.Exec(ctx, updateTokenQuery,
			params.MagicLinkTokenHash,
			params.PassportID,
			string(params.Event.ActorRole),
			string(params.Event.Action),
		)
		if err != nil {
			return fmt.Errorf("failed to mark magic link token as used: %w", err)
		}
		if tag.RowsAffected() == 0 {
			return models.ErrMagicLinkTokenInvalid
		}
	}

	if err := tx.Commit(ctx); err != nil {
		return fmt.Errorf("failed to commit transition transaction: %w", err)
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
	return insertPassportEvent(ctx, r.db.Pool, event)
}

// GetPassportEvents retrieves all events for a passport with hash chain data
func (r *Repository) GetPassportEvents(ctx context.Context, passportID uuid.UUID) ([]*models.PassportEvent, error) {
	query := `SELECT id, passport_id, event_type, COALESCE(action, ''), actor,
	                 COALESCE(actor_type, ''), COALESCE(actor_role, ''), COALESCE(actor_identifier, ''), COALESCE(source, ''),
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
			&event.Action,
			&event.Actor,
			&event.ActorType,
			&event.ActorRole,
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

// GetEventsByBatch retrieves all lifecycle events for passports in a batch, including serial numbers.
func (r *Repository) GetEventsByBatch(ctx context.Context, batchID uuid.UUID) ([]*models.AuditEventRow, error) {
	query := `SELECT e.id, e.passport_id, e.event_type, COALESCE(e.action, ''), e.actor,
	                 COALESCE(e.actor_type, ''), COALESCE(e.actor_role, ''), COALESCE(e.actor_identifier, ''), COALESCE(e.source, ''),
	                 COALESCE(e.status_from, ''), COALESCE(e.status_to, ''), COALESCE(e.ip_address, ''),
	                 e.metadata, e.created_at, COALESCE(e.hash, ''), COALESCE(e.previous_hash, ''),
	                 p.serial_number
	          FROM public.passport_events e
	          JOIN public.passports p ON p.uuid = e.passport_id
	          WHERE p.batch_id = $1
	          ORDER BY e.created_at ASC`

	rows, err := r.db.Pool.Query(ctx, query, batchID)
	if err != nil {
		return nil, fmt.Errorf("failed to get batch events: %w", err)
	}
	defer rows.Close()

	var results []*models.AuditEventRow
	for rows.Next() {
		row := &models.AuditEventRow{}
		var metadataJSON []byte
		if err := rows.Scan(
			&row.ID,
			&row.PassportID,
			&row.EventType,
			&row.Action,
			&row.Actor,
			&row.ActorType,
			&row.ActorRole,
			&row.ActorID,
			&row.Source,
			&row.StatusFrom,
			&row.StatusTo,
			&row.IPAddress,
			&metadataJSON,
			&row.CreatedAt,
			&row.Hash,
			&row.PreviousHash,
			&row.SerialNumber,
		); err != nil {
			return nil, fmt.Errorf("failed to scan audit event row: %w", err)
		}

		if len(metadataJSON) > 0 {
			if err := json.Unmarshal(metadataJSON, &row.Metadata); err != nil {
				return nil, fmt.Errorf("failed to unmarshal event metadata: %w", err)
			}
		}

		results = append(results, row)
	}

	return results, nil
}

// CreatePassportEventBatch inserts multiple passport events efficiently using COPY
func (r *Repository) CreatePassportEventBatch(ctx context.Context, events []*models.PassportEvent) error {
	return copyPassportEvents(ctx, r.db.Pool, events)
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
