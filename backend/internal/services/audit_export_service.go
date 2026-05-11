package services

import (
	"bytes"
	"context"
	"encoding/csv"
	"encoding/json"
	"fmt"
	"time"

	"anvayalabs-battery/internal/models"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/jung-kurt/gofpdf"
)

// AuditExportService generates CSV and PDF exports of passport lifecycle events for a batch.
type AuditExportService struct {
	db *pgxpool.Pool
}

// NewAuditExportService creates a new AuditExportService.
func NewAuditExportService(db *pgxpool.Pool) *AuditExportService {
	return &AuditExportService{db: db}
}

// ──────────────────────────────────────────────────────────────────────────────
// Data fetching
// ──────────────────────────────────────────────────────────────────────────────

// getEventsByBatch queries all passport_events for passports belonging to batchID,
// joined with the passport serial number for human-readable audit rows.
func (s *AuditExportService) getEventsByBatch(ctx context.Context, batchID uuid.UUID) ([]*models.AuditEventRow, error) {
	query := `
		SELECT e.id, e.passport_id, e.event_type, e.action,
		       e.actor, e.actor_type, e.actor_role, e.actor_identifier,
		       e.source, e.status_from, e.status_to, e.ip_address,
		       e.metadata, e.created_at, e.hash, e.previous_hash,
		       p.serial_number
		  FROM public.passport_events e
		  JOIN public.passports p ON p.uuid = e.passport_id
		 WHERE p.batch_id = $1
		 ORDER BY e.created_at ASC`

	rows, err := s.db.Query(ctx, query, batchID)
	if err != nil {
		return nil, fmt.Errorf("query events: %w", err)
	}
	defer rows.Close()

	var results []*models.AuditEventRow
	for rows.Next() {
		row := &models.AuditEventRow{}
		if err := rows.Scan(
			&row.ID, &row.PassportID, &row.EventType, &row.Action,
			&row.Actor, &row.ActorType, &row.ActorRole, &row.ActorID,
			&row.Source, &row.StatusFrom, &row.StatusTo, &row.IPAddress,
			&row.Metadata, &row.CreatedAt, &row.Hash, &row.PreviousHash,
			&row.SerialNumber,
		); err != nil {
			return nil, fmt.Errorf("scan event row: %w", err)
		}
		results = append(results, row)
	}
	return results, rows.Err()
}

// ──────────────────────────────────────────────────────────────────────────────
// CSV Export
// ──────────────────────────────────────────────────────────────────────────────

// ExportAuditTrailCSV generates a CSV containing the full audit trail for a batch.
func (s *AuditExportService) ExportAuditTrailCSV(ctx context.Context, batchID uuid.UUID) ([]byte, error) {
	events, err := s.getEventsByBatch(ctx, batchID)
	if err != nil {
		return nil, err
	}

	var buf bytes.Buffer
	w := csv.NewWriter(&buf)

	header := []string{
		"timestamp", "serial_number", "passport_id", "event_type", "action",
		"status_from", "status_to", "actor", "actor_type", "actor_role",
		"source", "ip_address", "hash", "previous_hash", "metadata",
	}
	if err := w.Write(header); err != nil {
		return nil, fmt.Errorf("write csv header: %w", err)
	}

	for _, e := range events {
		metaStr := ""
		if len(e.Metadata) > 0 {
			if b, err := json.Marshal(e.Metadata); err == nil {
				metaStr = string(b)
			}
		}
		record := []string{
			e.CreatedAt.UTC().Format(time.RFC3339),
			e.SerialNumber,
			e.PassportID.String(),
			e.EventType,
			string(e.Action),
			e.StatusFrom,
			e.StatusTo,
			e.Actor,
			e.ActorType,
			string(e.ActorRole),
			e.Source,
			e.IPAddress,
			e.Hash,
			e.PreviousHash,
			metaStr,
		}
		if err := w.Write(record); err != nil {
			return nil, fmt.Errorf("write csv record: %w", err)
		}
	}

	w.Flush()
	if err := w.Error(); err != nil {
		return nil, fmt.Errorf("flush csv: %w", err)
	}
	return buf.Bytes(), nil
}

// ──────────────────────────────────────────────────────────────────────────────
// PDF Export
// ──────────────────────────────────────────────────────────────────────────────

// ExportAuditTrailPDF generates a PDF report of the audit trail for a batch.
func (s *AuditExportService) ExportAuditTrailPDF(ctx context.Context, batchID uuid.UUID, batch *models.Batch, tenant *models.Tenant) ([]byte, error) {
	events, err := s.getEventsByBatch(ctx, batchID)
	if err != nil {
		return nil, err
	}

	pdf := gofpdf.New("L", "mm", "A4", "") // landscape for wide table
	pdf.SetAutoPageBreak(true, 15)
	pdf.SetMargins(10, 10, 10)

	// ── Title page ──────────────────────────────────────────────────────────
	pdf.AddPage()
	pdf.SetFont("Helvetica", "B", 20)
	pdf.CellFormat(0, 12, "Audit Trail Report", "", 1, "C", false, 0, "")
	pdf.Ln(4)

	pdf.SetFont("Helvetica", "", 11)
	pdf.CellFormat(0, 7, fmt.Sprintf("Batch: %s", batch.BatchName), "", 1, "C", false, 0, "")
	pdf.CellFormat(0, 7, fmt.Sprintf("Tenant: %s", tenant.CompanyName), "", 1, "C", false, 0, "")
	pdf.CellFormat(0, 7, fmt.Sprintf("Generated: %s", time.Now().UTC().Format("2006-01-02 15:04 UTC")), "", 1, "C", false, 0, "")
	pdf.CellFormat(0, 7, fmt.Sprintf("Total Events: %d", len(events)), "", 1, "C", false, 0, "")
	pdf.Ln(6)

	// ── Table header ────────────────────────────────────────────────────────
	cols := []struct {
		label string
		width float64
	}{
		{"Timestamp", 40},
		{"Serial #", 32},
		{"Event Type", 30},
		{"Action", 24},
		{"From → To", 34},
		{"Actor", 40},
		{"Source", 22},
		{"Hash (first 12)", 35},
		{"Prev Hash", 35},
	}

	drawHeader := func() {
		pdf.SetFont("Helvetica", "B", 8)
		pdf.SetFillColor(40, 40, 55)
		pdf.SetTextColor(255, 255, 255)
		for _, c := range cols {
			pdf.CellFormat(c.width, 7, c.label, "1", 0, "C", true, 0, "")
		}
		pdf.Ln(-1)
		pdf.SetTextColor(30, 30, 30)
	}

	drawHeader()

	// ── Table rows ──────────────────────────────────────────────────────────
	pdf.SetFont("Helvetica", "", 7)
	fill := false
	for _, e := range events {
		// Check if we need a new page
		if pdf.GetY() > 185 {
			pdf.AddPage()
			drawHeader()
		}

		if fill {
			pdf.SetFillColor(240, 240, 245)
		} else {
			pdf.SetFillColor(255, 255, 255)
		}

		transition := ""
		if e.StatusFrom != "" || e.StatusTo != "" {
			transition = fmt.Sprintf("%s → %s", e.StatusFrom, e.StatusTo)
		}
		hashShort := e.Hash
		if len(hashShort) > 12 {
			hashShort = hashShort[:12]
		}
		prevHashShort := e.PreviousHash
		if len(prevHashShort) > 12 {
			prevHashShort = prevHashShort[:12]
		}

		pdf.CellFormat(cols[0].width, 6, e.CreatedAt.UTC().Format("2006-01-02 15:04"), "1", 0, "L", fill, 0, "")
		pdf.CellFormat(cols[1].width, 6, e.SerialNumber, "1", 0, "L", fill, 0, "")
		pdf.CellFormat(cols[2].width, 6, e.EventType, "1", 0, "L", fill, 0, "")
		pdf.CellFormat(cols[3].width, 6, string(e.Action), "1", 0, "L", fill, 0, "")
		pdf.CellFormat(cols[4].width, 6, transition, "1", 0, "L", fill, 0, "")
		pdf.CellFormat(cols[5].width, 6, e.Actor, "1", 0, "L", fill, 0, "")
		pdf.CellFormat(cols[6].width, 6, e.Source, "1", 0, "L", fill, 0, "")
		pdf.CellFormat(cols[7].width, 6, hashShort, "1", 0, "L", fill, 0, "")
		pdf.CellFormat(cols[8].width, 6, prevHashShort, "1", 0, "L", fill, 0, "")
		pdf.Ln(-1)

		fill = !fill
	}

	// ── Footer note ─────────────────────────────────────────────────────────
	pdf.Ln(8)
	pdf.SetFont("Helvetica", "I", 8)
	pdf.SetTextColor(120, 120, 120)
	pdf.CellFormat(0, 5, "This report is an immutable record of all lifecycle events. Each event hash forms a tamper-evident chain.", "", 1, "L", false, 0, "")
	pdf.CellFormat(0, 5, fmt.Sprintf("Batch ID: %s  |  Report ID: %s", batchID.String(), uuid.New().String()), "", 1, "L", false, 0, "")

	var buf bytes.Buffer
	if err := pdf.Output(&buf); err != nil {
		return nil, fmt.Errorf("generate pdf: %w", err)
	}
	return buf.Bytes(), nil
}
