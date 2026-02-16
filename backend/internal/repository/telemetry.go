package repository

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
)

// TelemetryReading represents a single BMS telemetry data point
type TelemetryReading struct {
	ID            uuid.UUID `json:"id"`
	PassportID    uuid.UUID `json:"passport_id"`
	DeviceTokenID uuid.UUID `json:"device_token_id"`
	StateOfHealth *float64  `json:"state_of_health,omitempty"`
	CycleCount    *int      `json:"cycle_count,omitempty"`
	Temperature   *float64  `json:"temperature,omitempty"`
	Voltage       *float64  `json:"voltage,omitempty"`
	Current       *float64  `json:"current,omitempty"`
	ThermalEvent  bool      `json:"thermal_event"`
	ThermalType   string    `json:"thermal_type,omitempty"`
	Source        string    `json:"source,omitempty"`
	RecordedAt    time.Time `json:"recorded_at"`
	CreatedAt     time.Time `json:"created_at"`
}

// InsertTelemetry inserts a single telemetry reading
func (r *Repository) InsertTelemetry(ctx context.Context, reading *TelemetryReading) error {
	query := `
		INSERT INTO passport_telemetry (
			id, passport_id, device_token_id, state_of_health, cycle_count,
			temperature, voltage, current, thermal_event, thermal_type,
			source, recorded_at, created_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`

	_, err := r.db.Pool.Exec(ctx, query,
		reading.ID, reading.PassportID, reading.DeviceTokenID,
		reading.StateOfHealth, reading.CycleCount,
		reading.Temperature, reading.Voltage, reading.Current,
		reading.ThermalEvent, reading.ThermalType,
		reading.Source, reading.RecordedAt, reading.CreatedAt,
	)
	return err
}

// UpdatePassportDynamicFields updates the passport's telemetry summary columns
func (r *Repository) UpdatePassportDynamicFields(ctx context.Context, passportID uuid.UUID, soh *float64, cycleCount *int, temp *float64, voltage *float64, thermalIncrement int, recordedAt time.Time) error {
	query := `
		UPDATE passports SET
			state_of_health = COALESCE($2, state_of_health),
			last_soh_update_timestamp = CASE WHEN $2 IS NOT NULL THEN $7 ELSE last_soh_update_timestamp END,
			cycle_count = COALESCE($3, cycle_count),
			last_temperature = COALESCE($4, last_temperature),
			last_voltage = COALESCE($5, last_voltage),
			thermal_event_count = thermal_event_count + $6,
			last_telemetry_at = $7
		WHERE uuid = $1`

	_, err := r.db.Pool.Exec(ctx, query,
		passportID, soh, cycleCount, temp, voltage, thermalIncrement, recordedAt,
	)
	return err
}

// GetTelemetryHistory retrieves paginated telemetry history for a passport
func (r *Repository) GetTelemetryHistory(ctx context.Context, passportID uuid.UUID, limit, offset int, from, to *time.Time) ([]*TelemetryReading, int, error) {
	// Count total
	countQuery := `SELECT COUNT(*) FROM passport_telemetry WHERE passport_id = $1`
	args := []interface{}{passportID}
	argIdx := 2

	if from != nil {
		countQuery += fmt.Sprintf(` AND recorded_at >= $%d`, argIdx)
		args = append(args, *from)
		argIdx++
	}
	if to != nil {
		countQuery += fmt.Sprintf(` AND recorded_at <= $%d`, argIdx)
		args = append(args, *to)
		argIdx++
	}

	var total int
	err := r.db.Pool.QueryRow(ctx, countQuery, args...).Scan(&total)
	if err != nil {
		return nil, 0, err
	}

	// Fetch data
	dataQuery := `
		SELECT id, passport_id, device_token_id, state_of_health, cycle_count,
			   temperature, voltage, current, thermal_event, thermal_type,
			   source, recorded_at, created_at
		FROM passport_telemetry WHERE passport_id = $1`

	dataArgs := []interface{}{passportID}
	dataArgIdx := 2

	if from != nil {
		dataQuery += fmt.Sprintf(` AND recorded_at >= $%d`, dataArgIdx)
		dataArgs = append(dataArgs, *from)
		dataArgIdx++
	}
	if to != nil {
		dataQuery += fmt.Sprintf(` AND recorded_at <= $%d`, dataArgIdx)
		dataArgs = append(dataArgs, *to)
		dataArgIdx++
	}

	dataQuery += fmt.Sprintf(` ORDER BY recorded_at DESC LIMIT $%d OFFSET $%d`, dataArgIdx, dataArgIdx+1)
	dataArgs = append(dataArgs, limit, offset)

	rows, err := r.db.Pool.Query(ctx, dataQuery, dataArgs...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var readings []*TelemetryReading
	for rows.Next() {
		rd := &TelemetryReading{}
		if err := rows.Scan(
			&rd.ID, &rd.PassportID, &rd.DeviceTokenID,
			&rd.StateOfHealth, &rd.CycleCount,
			&rd.Temperature, &rd.Voltage, &rd.Current,
			&rd.ThermalEvent, &rd.ThermalType,
			&rd.Source, &rd.RecordedAt, &rd.CreatedAt,
		); err != nil {
			return nil, 0, err
		}
		readings = append(readings, rd)
	}
	return readings, total, rows.Err()
}
