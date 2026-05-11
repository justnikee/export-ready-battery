package main

import (
	"context"
	"log/slog"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"

	"anvayalabs-battery/internal/services"
)

const (
	// ChainVerifyInterval is how often the chain verification job runs.
	ChainVerifyInterval = 6 * time.Hour

	// chainVerifyBatchSize is the number of rows fetched per page.
	chainVerifyBatchSize = 1000
)

// ChainVerifier runs a scheduled job that checks every passport's BLAKE2b
// event chain and records any broken link in audit_chain_alerts.
type ChainVerifier struct {
	pool   *pgxpool.Pool
	svc    *services.LifecycleService
	logger *slog.Logger
}

// NewChainVerifier constructs a ChainVerifier.
func NewChainVerifier(pool *pgxpool.Pool, svc *services.LifecycleService, logger *slog.Logger) *ChainVerifier {
	return &ChainVerifier{pool: pool, svc: svc, logger: logger}
}

// RunOnce executes a single full-scan of all passports.
// It is safe to call concurrently from a ticker and on startup.
func (cv *ChainVerifier) RunOnce(ctx context.Context) {
	start := time.Now()
	cv.logger.Info("chain verification job started")

	checked, failed, err := cv.verifyAll(ctx)
	if err != nil {
		cv.logger.Error("chain verification job aborted", "error", err, "elapsed", time.Since(start))
		return
	}

	cv.cleanupResolvedAlerts(ctx)

	cv.logger.Info("chain verification job finished",
		"checked", checked,
		"failed", failed,
		"elapsed", time.Since(start),
	)
}

// verifyAll pages through all distinct passport_ids that have events and
// verifies each one. Returns total checked and total failed counts.
func (cv *ChainVerifier) verifyAll(ctx context.Context) (checked, failed int, err error) {
	offset := 0
	for {
		rows, qErr := cv.pool.Query(ctx, `
			SELECT DISTINCT pe.passport_id, p.tenant_id
			FROM   passport_events pe
			JOIN   passports p ON p.uuid = pe.passport_id
			ORDER  BY pe.passport_id
			LIMIT  $1 OFFSET $2
		`, chainVerifyBatchSize, offset)
		if qErr != nil {
			return checked, failed, qErr
		}

		type row struct {
			passportID uuid.UUID
			tenantID   uuid.UUID
		}
		var batch []row
		for rows.Next() {
			var r row
			if scanErr := rows.Scan(&r.passportID, &r.tenantID); scanErr != nil {
				rows.Close()
				return checked, failed, scanErr
			}
			batch = append(batch, r)
		}
		rows.Close()
		if rows.Err() != nil {
			return checked, failed, rows.Err()
		}

		if len(batch) == 0 {
			break
		}

		for _, r := range batch {
			if ctx.Err() != nil {
				return checked, failed, ctx.Err()
			}

			checked++
			valid, _, verifyErr := cv.svc.VerifyPassportAuditChain(ctx, r.passportID)
			if verifyErr != nil {
				cv.logger.Warn("chain verify error", "passport_id", r.passportID, "error", verifyErr)
				continue
			}
			if !valid {
				failed++
				cv.insertAlertIfAbsent(ctx, r.tenantID, r.passportID)
			}
		}

		if len(batch) < chainVerifyBatchSize {
			break
		}
		offset += chainVerifyBatchSize
	}
	return checked, failed, nil
}

// insertAlertIfAbsent inserts a new alert row only if no unresolved alert
// already exists for this passport (deduplication guard).
func (cv *ChainVerifier) insertAlertIfAbsent(ctx context.Context, tenantID, passportID uuid.UUID) {
	// Deduplication check
	var exists bool
	if err := cv.pool.QueryRow(ctx, `
		SELECT EXISTS(
			SELECT 1 FROM audit_chain_alerts
			WHERE  passport_id = $1 AND resolved_at IS NULL
		)
	`, passportID).Scan(&exists); err != nil {
		cv.logger.Error("failed to check existing chain alert", "passport_id", passportID, "error", err)
		return
	}
	if exists {
		return
	}

	// Snapshot the current event count for diagnostics
	var eventCount int
	cv.pool.QueryRow(ctx, `
		SELECT COUNT(*) FROM passport_events WHERE passport_id = $1
	`, passportID).Scan(&eventCount) //nolint:errcheck

	_, err := cv.pool.Exec(ctx, `
		INSERT INTO audit_chain_alerts (tenant_id, passport_id, event_count)
		VALUES ($1, $2, $3)
	`, tenantID, passportID, eventCount)
	if err != nil {
		cv.logger.Error("failed to insert chain alert",
			"passport_id", passportID,
			"error", err,
		)
		return
	}

	cv.logger.Warn("chain integrity violation — alert created",
		"passport_id", passportID,
		"event_count", eventCount,
	)
}

// cleanupResolvedAlerts deletes resolved alerts older than the retention window.
func (cv *ChainVerifier) cleanupResolvedAlerts(ctx context.Context) {
	tag, err := cv.pool.Exec(ctx, `
		DELETE FROM audit_chain_alerts
		WHERE resolved_at IS NOT NULL
		  AND resolved_at < NOW() - INTERVAL '90 days'
	`)
	if err != nil {
		cv.logger.Error("failed to clean up resolved chain alerts", "error", err)
		return
	}
	if tag.RowsAffected() > 0 {
		cv.logger.Info("cleaned up resolved chain alerts", "deleted", tag.RowsAffected())
	}
}
