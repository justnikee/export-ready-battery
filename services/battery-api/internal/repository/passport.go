package repository

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"log/slog"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"

	"github.com/anvayalabs/battery-api/internal/models"
)

// bulkExecer is satisfied by pgxpool.Pool, pgx.Tx, and pgx.Conn — all three
// support parameterised Exec, which works through PgBouncer transaction poolers
// unlike the COPY binary protocol used by CopyFrom.
type bulkExecer interface {
	Exec(ctx context.Context, sql string, arguments ...any) (pgconn.CommandTag, error)
}

// Keep the old interface name as an alias so callers that still reference it compile.
type copyFromer = bulkExecer

// copyPassports bulk-inserts passports using standard parameterised INSERT statements.
// This is compatible with PgBouncer transaction poolers (Supabase port 6543) unlike
// pgx.CopyFrom which uses the binary COPY protocol that PgBouncer blocks.
func copyPassports(ctx context.Context, exec bulkExecer, passports []*models.Passport) (int, error) {
	if len(passports) == 0 {
		return 0, nil
	}

	const cols = `uuid, batch_id, serial_number, manufacture_date, status, created_at,
	              batch_snapshot, current_owner_identifier, ownership_history,
	              state_of_health, last_soh_update_timestamp,
	              csv_source_filename, csv_row_index`
	const numCols = 13
	// 500 rows × 13 cols = 6 500 params — well under the 65 535 PG limit.
	const chunkSize = 500

	total := 0
	for start := 0; start < len(passports); start += chunkSize {
		end := start + chunkSize
		if end > len(passports) {
			end = len(passports)
		}
		chunk := passports[start:end]

		placeholders := make([]string, len(chunk))
		args := make([]any, 0, len(chunk)*numCols)
		for i, p := range chunk {
			b := i*numCols + 1
			placeholders[i] = fmt.Sprintf(
				"($%d,$%d,$%d,$%d,$%d,$%d,$%d,$%d,$%d,$%d,$%d,$%d,$%d)",
				b, b+1, b+2, b+3, b+4, b+5, b+6, b+7, b+8, b+9, b+10, b+11, b+12,
			)
			args = append(args,
				p.UUID, p.BatchID, p.SerialNumber, p.ManufactureDate, p.Status, p.CreatedAt,
				jsonStringArg(p.BatchSnapshot), p.CurrentOwnerIdentifier, jsonStringArg(p.OwnershipHistory),
				p.StateOfHealth, p.LastSOHUpdateTimestamp,
				p.CSVSourceFilename, p.CSVRowIndex,
			)
		}

		query := fmt.Sprintf("INSERT INTO public.passports (%s) VALUES %s",
			cols, strings.Join(placeholders, ","))
		tag, err := exec.Exec(ctx, query, args...)
		if err != nil {
			var pgErr *pgconn.PgError
			if errors.As(err, &pgErr) {
				slog.Error("copyPassports PG error",
					"severity", pgErr.Severity,
					"code", pgErr.Code,
					"message", pgErr.Message,
					"detail", pgErr.Detail,
					"constraint", pgErr.ConstraintName,
					"column", pgErr.ColumnName,
					"table", pgErr.TableName,
				)
			}
			return total, fmt.Errorf("failed to bulk insert passports: %w", err)
		}
		total += int(tag.RowsAffected())
	}

	return total, nil
}

// copyPassportEvents bulk-inserts passport events using standard parameterised INSERT
// statements. Compatible with PgBouncer transaction poolers (Supabase port 6543).
func copyPassportEvents(ctx context.Context, exec bulkExecer, events []*models.PassportEvent) error {
	if len(events) == 0 {
		return nil
	}

	const cols = `id, passport_id, event_type, action, actor, actor_type, actor_role,
	              actor_identifier, source, status_from, status_to, ip_address,
	              metadata, created_at, hash, previous_hash`
	const numCols = 16
	// 400 rows × 16 cols = 6 400 params — well under the 65 535 PG limit.
	const chunkSize = 400

	for start := 0; start < len(events); start += chunkSize {
		end := start + chunkSize
		if end > len(events) {
			end = len(events)
		}
		chunk := events[start:end]

		placeholders := make([]string, len(chunk))
		args := make([]any, 0, len(chunk)*numCols)
		for i, e := range chunk {
			metadataJSON, err := json.Marshal(e.Metadata)
			if err != nil {
				return fmt.Errorf("failed to marshal metadata for event %d: %w", start+i, err)
			}
			b := i*numCols + 1
			placeholders[i] = fmt.Sprintf(
				"($%d,$%d,$%d,$%d,$%d,$%d,$%d,$%d,$%d,$%d,$%d,$%d,$%d,$%d,$%d,$%d)",
				b, b+1, b+2, b+3, b+4, b+5, b+6, b+7, b+8, b+9, b+10, b+11, b+12, b+13, b+14, b+15,
			)
			args = append(args,
				e.ID, e.PassportID, e.EventType,
				nullableString(string(e.Action)),
				e.Actor, e.ActorType,
				nullableString(string(e.ActorRole)),
				e.ActorID, e.Source, e.StatusFrom, e.StatusTo, e.IPAddress,
				string(metadataJSON), e.CreatedAt, e.Hash, e.PreviousHash,
			)
		}

		query := fmt.Sprintf("INSERT INTO public.passport_events (%s) VALUES %s",
			cols, strings.Join(placeholders, ","))
		_, err := exec.Exec(ctx, query, args...)
		if err != nil {
			var pgErr *pgconn.PgError
			if errors.As(err, &pgErr) {
				slog.Error("copyPassportEvents PG error",
					"severity", pgErr.Severity,
					"code", pgErr.Code,
					"message", pgErr.Message,
					"detail", pgErr.Detail,
					"hint", pgErr.Hint,
					"constraint", pgErr.ConstraintName,
					"column", pgErr.ColumnName,
					"table", pgErr.TableName,
					"schema", pgErr.SchemaName,
				)
			}
			return fmt.Errorf("failed to bulk insert passport events: %w", err)
		}
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
		jsonStringArg(passport.BatchSnapshot),
		passport.CurrentOwnerIdentifier,
		jsonStringArg(passport.OwnershipHistory),
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

	query := `SELECT uuid, batch_id, serial_number, manufacture_date, status, created_at, product_type 
	          FROM public.passports WHERE uuid = $1`

	err := r.db.Pool.QueryRow(ctx, query, id).Scan(
		&passport.UUID,
		&passport.BatchID,
		&passport.SerialNumber,
		&passport.ManufactureDate,
		&passport.Status,
		&passport.CreatedAt,
		&passport.ProductType,
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
		       b.batch_name, COALESCE(b.model_name, ''), COALESCE(b.product_type, 'BATTERY'), b.specs, b.market_region,
       b.manufacturing_start_date, b.manufacturing_end_date,
       COALESCE(b.cell_source, ''), COALESCE(b.bill_of_entry_no, ''), COALESCE(b.country_of_origin, ''),
       b.domestic_value_add, b.pli_compliant, b.customs_date, COALESCE(b.hsn_code, ''), COALESCE(b.dva_source, ''),
		       t.company_name, COALESCE(t.address, ''), COALESCE(t.logo_url, ''), COALESCE(t.support_email, ''), COALESCE(t.website, ''),
		       COALESCE(bp.epr_registration_number, ''), COALESCE(bp.bis_r_number, ''),
		       COALESCE(bp.epr_certificate_path, ''), COALESCE(bp.bis_certificate_path, ''), COALESCE(bp.pli_certificate_path, ''),
		       COALESCE(bp.eu_authorized_representative_name, ''), COALESCE(bp.eu_authorized_representative_address, ''), COALESCE(bp.eu_contact_email, ''),
		       COALESCE(tp.facility_type, ''), COALESCE(tp.supply_chain_tier, ''),
		       t.id,
		       b.carbon_footprint_result
		FROM public.passports p
		JOIN public.batches b ON p.batch_id = b.id
		JOIN public.tenants t ON b.tenant_id = t.id
		LEFT JOIN public.battery_tenant_profiles bp ON bp.tenant_id = t.id
		LEFT JOIN public.textile_tenant_profiles tp ON tp.tenant_id = t.id
		WHERE p.uuid = $1
	`

	passport := &models.Passport{}
	var batchName string
	var modelName string
	var productType models.ProductType
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
	var carbonFootprintResultJSON []byte
	tenant := &models.Tenant{
		BatteryProfile: &models.BatteryTenantProfile{},
	}

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
		&productType,
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
		&tenant.BatteryProfile.EPRRegistrationNumber,
		&tenant.BatteryProfile.BISRNumber,
		&tenant.BatteryProfile.EPRCertificatePath,
		&tenant.BatteryProfile.BISCertificatePath,
		&tenant.BatteryProfile.PLICertificatePath,
		&tenant.BatteryProfile.EUAuthorizedRepresentativeName,
		&tenant.BatteryProfile.EUAuthorizedRepresentativeAddress,
		&tenant.BatteryProfile.EUContactEmail,
		&tenant.ID,
		&carbonFootprintResultJSON,
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

	// If carbon_footprint was not manually entered but a calculator result exists, derive it.
	if specs.CarbonFootprint == "" && len(carbonFootprintResultJSON) > 0 {
		var cr struct {
			TotalKgCO2e  float64 `json:"total_kg_co2e"`
			PerKWhKgCO2e float64 `json:"per_kwh_kg_co2e"`
		}
		if err := json.Unmarshal(carbonFootprintResultJSON, &cr); err != nil {
			slog.Warn("failed to parse carbon_footprint_result JSON", "error", err, "payload", string(carbonFootprintResultJSON))
		} else if cr.TotalKgCO2e > 0 {
			specs.CarbonFootprint = fmt.Sprintf("%.2f kg CO₂e (%.3f kg CO₂e/kWh)", cr.TotalKgCO2e, cr.PerKWhKgCO2e)
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
		ProductType:            productType,
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

// jsonStringArg converts a json.RawMessage to string for pgx SimpleProtocol compatibility.
// pgx v5 encodes json.RawMessage as bytea (\x...) when the target OID is unknown (SimpleProtocol),
// which PostgreSQL rejects for JSONB columns. A plain string is emitted as a quoted SQL literal
// that PostgreSQL happily coerces to JSONB.
func jsonStringArg(raw json.RawMessage) interface{} {
	if len(raw) == 0 {
		return nil
	}
	return string(raw)
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
		string(metadataJSON),
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
	          WHERE uuid = $8
	            AND status = $9`
	tag, err := tx.Exec(ctx, query,
		params.NewStatus,
		params.ShippedAt,
		params.InstalledAt,
		params.RecycledAt,
		nullableString(params.RecyclingStatus),
		nullableString(params.RecyclerEprID),
		params.RecyclingDate,
		params.PassportID,
		params.PreviousStatus,
	)
	if err != nil {
		return fmt.Errorf("failed to update passport status: %w", err)
	}
	if tag.RowsAffected() == 0 {
		return fmt.Errorf("concurrent modification: passport %s status changed before this transition could be applied", params.PassportID)
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
	          ORDER BY created_at ASC, id ASC`

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
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating passport events: %w", err)
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
	          ORDER BY e.created_at ASC, e.id ASC`

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
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating batch events: %w", err)
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

// AppendSoHHistory inserts one SoH reading into the soh_history time-series table.
func (r *Repository) AppendSoHHistory(ctx context.Context, entry models.SoHHistoryEntry) error {
	query := `
		INSERT INTO public.soh_history (id, passport_id, soh, recorded_at, actor, actor_type, source)
		VALUES ($1, $2, $3, $4, $5, $6, $7)`
	_, err := r.db.Pool.Exec(ctx, query,
		entry.ID, entry.PassportID, entry.SoH, entry.RecordedAt,
		entry.Actor, entry.ActorType, entry.Source,
	)
	if err != nil {
		return fmt.Errorf("failed to append soh history: %w", err)
	}
	return nil
}

// GetSoHHistory returns all SoH readings for a passport ordered newest-first.
func (r *Repository) GetSoHHistory(ctx context.Context, passportID uuid.UUID) ([]models.SoHHistoryEntry, error) {
	query := `
		SELECT id, passport_id, soh, recorded_at, actor, actor_type, source
		FROM public.soh_history
		WHERE passport_id = $1
		ORDER BY recorded_at DESC`
	rows, err := r.db.Pool.Query(ctx, query, passportID)
	if err != nil {
		return nil, fmt.Errorf("failed to get soh history: %w", err)
	}
	defer rows.Close()

	var entries []models.SoHHistoryEntry
	for rows.Next() {
		var e models.SoHHistoryEntry
		if err := rows.Scan(&e.ID, &e.PassportID, &e.SoH, &e.RecordedAt, &e.Actor, &e.ActorType, &e.Source); err != nil {
			return nil, fmt.Errorf("failed to scan soh history row: %w", err)
		}
		entries = append(entries, e)
	}
	return entries, rows.Err()
}

// PassportListItem is a lightweight summary for the lifecycle list view.
type PassportListItem struct {
	UUID         string             `json:"uuid"`
	SerialNumber string             `json:"serial_number"`
	Status       string             `json:"status"`
	StateOfHealth *float64           `json:"state_of_health"`
	BatchName    string             `json:"batch_name"`
	UpdatedAt    string             `json:"updated_at"`
	ProductType  models.ProductType `json:"product_type"`
}

// ListPassportsByTenant returns a tenant-scoped paginated list of passports
// with optional status/search/batchID filters. Used by the lifecycle dashboard view.
func (r *Repository) ListPassportsByTenant(ctx context.Context, tenantID uuid.UUID, status, search, batchID string, productType models.ProductType, limit, offset int) ([]*PassportListItem, int, error) {
	countQuery := `
		SELECT COUNT(*)
		FROM public.passports p
		JOIN public.batches b ON b.id = p.batch_id
		WHERE b.tenant_id = $1
		  AND ($2 = '' OR p.status = $2)
		  AND ($3 = '' OR p.serial_number ILIKE '%' || $3 || '%' OR p.uuid::text ILIKE '%' || $3 || '%')
		  AND ($4 = '' OR b.id::text = $4)
		  AND ($5 = '' OR b.product_type = $5)`

	var total int
	if err := r.db.Pool.QueryRow(ctx, countQuery, tenantID, status, search, batchID, productType).Scan(&total); err != nil {
		return nil, 0, fmt.Errorf("failed to count passports: %w", err)
	}

	query := `
		SELECT p.uuid, p.serial_number, p.status, p.state_of_health, b.batch_name,
		       COALESCE(b.product_type, 'BATTERY') AS product_type,
		       GREATEST(p.created_at,
		                COALESCE(p.shipped_at, p.created_at),
		                COALESCE(p.last_soh_update_timestamp, p.created_at)) AS updated_at
		FROM public.passports p
		JOIN public.batches b ON b.id = p.batch_id
		WHERE b.tenant_id = $1
		  AND ($2 = '' OR p.status = $2)
		  AND ($3 = '' OR p.serial_number ILIKE '%' || $3 || '%' OR p.uuid::text ILIKE '%' || $3 || '%')
		  AND ($4 = '' OR b.id::text = $4)
		  AND ($5 = '' OR b.product_type = $5)
		ORDER BY updated_at DESC
		LIMIT $6 OFFSET $7`

	rows, err := r.db.Pool.Query(ctx, query, tenantID, status, search, batchID, productType, limit, offset)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to list passports: %w", err)
	}
	defer rows.Close()

	var items []*PassportListItem
	for rows.Next() {
		item := &PassportListItem{}
		var updatedAt time.Time
		if err := rows.Scan(
			&item.UUID,
			&item.SerialNumber,
			&item.Status,
			&item.StateOfHealth,
			&item.BatchName,
			&item.ProductType,
			&updatedAt,
		); err != nil {
			return nil, 0, fmt.Errorf("failed to scan passport: %w", err)
		}
		item.UpdatedAt = updatedAt.UTC().Format(time.RFC3339)
		items = append(items, item)
	}

	return items, total, nil
}

// GetPassportStatusCounts returns per-status counts for a tenant (optionally filtered by batch).
func (r *Repository) GetPassportStatusCounts(ctx context.Context, tenantID uuid.UUID, batchID string) (map[string]int, error) {
	query := `
		SELECT p.status, COUNT(*)
		FROM public.passports p
		JOIN public.batches b ON b.id = p.batch_id
		WHERE b.tenant_id = $1
		  AND ($2 = '' OR b.id::text = $2)
		GROUP BY p.status`

	rows, err := r.db.Pool.Query(ctx, query, tenantID, batchID)
	if err != nil {
		return nil, fmt.Errorf("failed to count passports by status: %w", err)
	}
	defer rows.Close()

	counts := map[string]int{}
	for rows.Next() {
		var s string
		var n int
		if err := rows.Scan(&s, &n); err != nil {
			return nil, fmt.Errorf("failed to scan status count: %w", err)
		}
		counts[s] = n
	}
	return counts, rows.Err()
}

// AppendGeolocationHistory appends a GPS fix entry to geolocation_history.
// entryJSON must be a JSON array containing one object (same pattern as AppendOwnershipHistory).
func (r *Repository) AppendGeolocationHistory(ctx context.Context, passportID uuid.UUID, entryJSON []byte) error {
	query := `
		UPDATE public.passports
		SET geolocation_history = COALESCE(geolocation_history, '[]'::jsonb) || $2::jsonb
		WHERE uuid = $1`
	_, err := r.db.Pool.Exec(ctx, query, passportID, entryJSON)
	if err != nil {
		return fmt.Errorf("failed to append geolocation history: %w", err)
	}
	return nil
}

// GetPassportIDsByBatch returns all non-terminal passport UUIDs in a batch, scoped to tenant.
// Non-terminal statuses are any status except RECYCLED, RECALLED, and CLOSED.
func (r *Repository) GetPassportIDsByBatch(ctx context.Context, batchID, tenantID uuid.UUID) ([]uuid.UUID, error) {
	const query = `
		SELECT p.uuid
		FROM public.passports p
		JOIN public.batches b ON b.id = p.batch_id
		WHERE p.batch_id = $1
		  AND b.tenant_id = $2
		  AND p.status NOT IN ('RECYCLED', 'RECALLED', 'CLOSED')`
	rows, err := r.db.Pool.Query(ctx, query, batchID, tenantID)
	if err != nil {
		return nil, fmt.Errorf("failed to query passport IDs by batch: %w", err)
	}
	defer rows.Close()
	var ids []uuid.UUID
	for rows.Next() {
		var id uuid.UUID
		if err := rows.Scan(&id); err != nil {
			return nil, fmt.Errorf("failed to scan passport UUID: %w", err)
		}
		ids = append(ids, id)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("row error fetching passport IDs by batch: %w", err)
	}
	return ids, nil
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
