package repository

import (
	"context"
	"fmt"

	"github.com/google/uuid"
)

// ============================================================================
// BULK OPERATIONS
// ============================================================================

// BulkUpdatePassportStatus updates the status for multiple passports
func (r *Repository) BulkUpdatePassportStatus(ctx context.Context, passportIDs []uuid.UUID, newStatus string) (int64, error) {
	if len(passportIDs) == 0 {
		return 0, nil
	}

	query := `UPDATE public.passports SET status = $1 WHERE uuid = ANY($2)`

	result, err := r.db.Pool.Exec(ctx, query, newStatus, passportIDs)
	if err != nil {
		return 0, fmt.Errorf("failed to bulk update passport status: %w", err)
	}

	return result.RowsAffected(), nil
}

// BulkDeletePassports deletes multiple passports
func (r *Repository) BulkDeletePassports(ctx context.Context, passportIDs []uuid.UUID) (int64, error) {
	if len(passportIDs) == 0 {
		return 0, nil
	}

	query := `DELETE FROM public.passports WHERE uuid = ANY($1)`

	result, err := r.db.Pool.Exec(ctx, query, passportIDs)
	if err != nil {
		return 0, fmt.Errorf("failed to bulk delete passports: %w", err)
	}

	return result.RowsAffected(), nil
}

// DeleteBatchWithPassports deletes a batch and all its passports, returning the count
func (r *Repository) DeleteBatchWithPassports(ctx context.Context, batchID uuid.UUID) (int64, error) {
	// First count passports
	var passportCount int64
	countQuery := `SELECT COUNT(*) FROM public.passports WHERE batch_id = $1`
	err := r.db.Pool.QueryRow(ctx, countQuery, batchID).Scan(&passportCount)
	if err != nil {
		return 0, fmt.Errorf("failed to count passports: %w", err)
	}

	// Delete passports (will happen via CASCADE, but let's be explicit)
	deletePassportsQuery := `DELETE FROM public.passports WHERE batch_id = $1`
	_, err = r.db.Pool.Exec(ctx, deletePassportsQuery, batchID)
	if err != nil {
		return 0, fmt.Errorf("failed to delete passports: %w", err)
	}

	// Delete batch
	deleteBatchQuery := `DELETE FROM public.batches WHERE id = $1`
	result, err := r.db.Pool.Exec(ctx, deleteBatchQuery, batchID)
	if err != nil {
		return 0, fmt.Errorf("failed to delete batch: %w", err)
	}

	if result.RowsAffected() == 0 {
		return 0, fmt.Errorf("batch not found")
	}

	return passportCount, nil
}

// GetPassportsByIDs retrieves passports by their UUIDs (for validation before bulk ops)
func (r *Repository) GetPassportsByIDs(ctx context.Context, passportIDs []uuid.UUID) ([]*struct {
	UUID    uuid.UUID
	BatchID uuid.UUID
}, error) {
	if len(passportIDs) == 0 {
		return nil, nil
	}

	query := `SELECT uuid, batch_id FROM public.passports WHERE uuid = ANY($1)`

	rows, err := r.db.Pool.Query(ctx, query, passportIDs)
	if err != nil {
		return nil, fmt.Errorf("failed to get passports: %w", err)
	}
	defer rows.Close()

	var passports []*struct {
		UUID    uuid.UUID
		BatchID uuid.UUID
	}

	for rows.Next() {
		p := &struct {
			UUID    uuid.UUID
			BatchID uuid.UUID
		}{}
		if err := rows.Scan(&p.UUID, &p.BatchID); err != nil {
			return nil, fmt.Errorf("failed to scan passport: %w", err)
		}
		passports = append(passports, p)
	}

	return passports, nil
}

// ValidPassportStatuses returns valid passport statuses
func ValidPassportStatuses() []string {
	return []string{"ACTIVE", "RECALLED", "RECYCLED", "END_OF_LIFE"}
}

// IsValidPassportStatus checks if a status is valid
func IsValidPassportStatus(status string) bool {
	for _, s := range ValidPassportStatuses() {
		if s == status {
			return true
		}
	}
	return false
}
