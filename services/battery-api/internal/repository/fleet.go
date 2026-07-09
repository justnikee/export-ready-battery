package repository

import (
	"context"
	"fmt"
	"time"

	"github.com/anvayalabs/battery-api/internal/models"
	"github.com/google/uuid"
)

// FleetStats aggregates fleet-wide health and safety signals for the Fleet
// Health dashboard's top cards. Computed with SQL aggregates (not a capped
// client-side fetch) so the numbers stay accurate regardless of fleet size.
type FleetStats struct {
	TotalInService  int       `json:"total_in_service"`
	AvgSoH          *float64  `json:"avg_soh"`
	Below80Count    int       `json:"below_80_count"`
	OpenRecalls     int       `json:"open_recalls"`
	ThermalEvents30d int      `json:"thermal_events_30d"`
	SoHDistribution []SoHBand `json:"soh_distribution"`
}

// SoHBand is a single bucket in the SoH histogram.
type SoHBand struct {
	Band  string `json:"band"`
	Count int    `json:"count"`
}

// GetFleetStats computes fleet-wide SoH/recall/thermal-event aggregates for a tenant.
func (r *Repository) GetFleetStats(ctx context.Context, tenantID uuid.UUID, productType models.ProductType) (*FleetStats, error) {
	query := `
		SELECT
			COUNT(*) FILTER (WHERE p.status = 'IN_SERVICE') AS total_in_service,
			AVG(p.state_of_health) FILTER (WHERE p.status = 'IN_SERVICE') AS avg_soh,
			COUNT(*) FILTER (WHERE p.status = 'IN_SERVICE' AND p.state_of_health < 80) AS below_80,
			COUNT(*) FILTER (WHERE p.status = 'RECALLED') AS open_recalls,
			COUNT(*) FILTER (WHERE p.status = 'IN_SERVICE' AND p.state_of_health >= 90) AS band_90_100,
			COUNT(*) FILTER (WHERE p.status = 'IN_SERVICE' AND p.state_of_health >= 80 AND p.state_of_health < 90) AS band_80_90,
			COUNT(*) FILTER (WHERE p.status = 'IN_SERVICE' AND p.state_of_health >= 70 AND p.state_of_health < 80) AS band_70_80,
			COUNT(*) FILTER (WHERE p.status = 'IN_SERVICE' AND p.state_of_health >= 60 AND p.state_of_health < 70) AS band_60_70,
			COUNT(*) FILTER (WHERE p.status = 'IN_SERVICE' AND p.state_of_health < 60) AS band_below_60
		FROM public.passports p
		JOIN public.batches b ON b.id = p.batch_id
		WHERE b.tenant_id = $1 AND p.deleted_at IS NULL
		  AND ($2 = '' OR b.product_type = $2)`

	stats := &FleetStats{}
	var band90, band80, band70, band60, bandBelow60 int
	if err := r.db.Pool.QueryRow(ctx, query, tenantID, productType).Scan(
		&stats.TotalInService,
		&stats.AvgSoH,
		&stats.Below80Count,
		&stats.OpenRecalls,
		&band90, &band80, &band70, &band60, &bandBelow60,
	); err != nil {
		return nil, fmt.Errorf("failed to compute fleet stats: %w", err)
	}
	stats.SoHDistribution = []SoHBand{
		{Band: "90-100%", Count: band90},
		{Band: "80-90%", Count: band80},
		{Band: "70-80%", Count: band70},
		{Band: "60-70%", Count: band60},
		{Band: "<60%", Count: bandBelow60},
	}

	thermalQuery := `
		SELECT COUNT(*)
		FROM public.passport_telemetry pt
		JOIN public.passports p ON pt.passport_id = p.uuid
		JOIN public.batches b ON p.batch_id = b.id
		WHERE b.tenant_id = $1 AND p.deleted_at IS NULL AND pt.thermal_event = true
		  AND pt.recorded_at >= $2
		  AND ($3 = '' OR b.product_type = $3)`
	if err := r.db.Pool.QueryRow(ctx, thermalQuery, tenantID, time.Now().AddDate(0, 0, -30), productType).Scan(&stats.ThermalEvents30d); err != nil {
		return nil, fmt.Errorf("failed to count thermal events: %w", err)
	}

	return stats, nil
}

// FleetPassportHealth is one row in the worst-health table.
type FleetPassportHealth struct {
	UUID          string   `json:"uuid"`
	SerialNumber  string   `json:"serial_number"`
	BatchName     string   `json:"batch_name"`
	StateOfHealth *float64 `json:"state_of_health"`
	LastReadingAt *string  `json:"last_reading_at"`
}

// GetWorstHealthPassports returns the IN_SERVICE passports with the lowest SoH.
func (r *Repository) GetWorstHealthPassports(ctx context.Context, tenantID uuid.UUID, productType models.ProductType, limit int) ([]FleetPassportHealth, error) {
	if limit <= 0 || limit > 100 {
		limit = 20
	}
	query := `
		SELECT p.uuid, p.serial_number, b.batch_name, p.state_of_health, p.last_soh_update_timestamp
		FROM public.passports p
		JOIN public.batches b ON b.id = p.batch_id
		WHERE b.tenant_id = $1 AND p.deleted_at IS NULL AND p.status = 'IN_SERVICE' AND p.state_of_health IS NOT NULL
		  AND ($3 = '' OR b.product_type = $3)
		ORDER BY p.state_of_health ASC
		LIMIT $2`

	rows, err := r.db.Pool.Query(ctx, query, tenantID, limit, productType)
	if err != nil {
		return nil, fmt.Errorf("failed to list worst-health passports: %w", err)
	}
	defer rows.Close()

	results := make([]FleetPassportHealth, 0, limit)
	for rows.Next() {
		var item FleetPassportHealth
		var lastReading *time.Time
		if err := rows.Scan(&item.UUID, &item.SerialNumber, &item.BatchName, &item.StateOfHealth, &lastReading); err != nil {
			return nil, fmt.Errorf("failed to scan worst-health passport: %w", err)
		}
		if lastReading != nil {
			formatted := lastReading.UTC().Format(time.RFC3339)
			item.LastReadingAt = &formatted
		}
		results = append(results, item)
	}
	return results, rows.Err()
}

// FleetLifecycleEvent is a RECALLED/RECYCLED event surfaced on the fleet timeline.
type FleetLifecycleEvent struct {
	ID           string    `json:"id"`
	PassportID   string    `json:"passport_id"`
	SerialNumber string    `json:"serial_number"`
	BatchName    string    `json:"batch_name"`
	EventType    string    `json:"event_type"`
	CreatedAt    time.Time `json:"created_at"`
}

// GetFleetLifecycleEvents returns RECALLED/RECYCLED passport events across the
// tenant's fleet within the given window, most recent first.
func (r *Repository) GetFleetLifecycleEvents(ctx context.Context, tenantID uuid.UUID, productType models.ProductType, since time.Time, limit int) ([]FleetLifecycleEvent, error) {
	if limit <= 0 || limit > 200 {
		limit = 50
	}
	query := `
		SELECT pe.id, pe.passport_id, p.serial_number, b.batch_name, pe.event_type, pe.created_at
		FROM public.passport_events pe
		JOIN public.passports p ON pe.passport_id = p.uuid
		JOIN public.batches b ON p.batch_id = b.id
		WHERE b.tenant_id = $1 AND pe.event_type IN ('RECALLED', 'RECYCLED') AND pe.created_at >= $2
		  AND ($4 = '' OR b.product_type = $4)
		ORDER BY pe.created_at DESC
		LIMIT $3`

	rows, err := r.db.Pool.Query(ctx, query, tenantID, since, limit, productType)
	if err != nil {
		return nil, fmt.Errorf("failed to list fleet lifecycle events: %w", err)
	}
	defer rows.Close()

	results := make([]FleetLifecycleEvent, 0, limit)
	for rows.Next() {
		var item FleetLifecycleEvent
		if err := rows.Scan(&item.ID, &item.PassportID, &item.SerialNumber, &item.BatchName, &item.EventType, &item.CreatedAt); err != nil {
			return nil, fmt.Errorf("failed to scan fleet lifecycle event: %w", err)
		}
		results = append(results, item)
	}
	return results, rows.Err()
}

// FleetThermalEvent is one individual thermal-event telemetry reading,
// surfaced on the BMS Telemetry dashboard's events feed.
type FleetThermalEvent struct {
	ID           string    `json:"id"`
	PassportID   string    `json:"passport_id"`
	SerialNumber string    `json:"serial_number"`
	BatchID      string    `json:"batch_id"`
	BatchName    string    `json:"batch_name"`
	ThermalType  string    `json:"thermal_type"`
	Temperature  *float64  `json:"temperature"`
	RecordedAt   time.Time `json:"recorded_at"`
}

// GetFleetThermalEvents returns individual thermal-event telemetry readings
// across the tenant's fleet within the given window, most recent first.
// Distinct from FleetStats.ThermalEvents30d, which is just the count — this
// returns the actual rows for a feed.
func (r *Repository) GetFleetThermalEvents(ctx context.Context, tenantID uuid.UUID, productType models.ProductType, since time.Time, limit int) ([]FleetThermalEvent, error) {
	if limit <= 0 || limit > 200 {
		limit = 20
	}
	query := `
		SELECT pt.id, pt.passport_id, p.serial_number, b.id, b.batch_name, pt.thermal_type, pt.temperature, pt.recorded_at
		FROM public.passport_telemetry pt
		JOIN public.passports p ON pt.passport_id = p.uuid
		JOIN public.batches b ON p.batch_id = b.id
		WHERE b.tenant_id = $1 AND p.deleted_at IS NULL AND pt.thermal_event = true
		  AND pt.recorded_at >= $2
		  AND ($4 = '' OR b.product_type = $4)
		ORDER BY pt.recorded_at DESC
		LIMIT $3`

	rows, err := r.db.Pool.Query(ctx, query, tenantID, since, limit, productType)
	if err != nil {
		return nil, fmt.Errorf("failed to list fleet thermal events: %w", err)
	}
	defer rows.Close()

	results := make([]FleetThermalEvent, 0, limit)
	for rows.Next() {
		var item FleetThermalEvent
		if err := rows.Scan(&item.ID, &item.PassportID, &item.SerialNumber, &item.BatchID, &item.BatchName, &item.ThermalType, &item.Temperature, &item.RecordedAt); err != nil {
			return nil, fmt.Errorf("failed to scan fleet thermal event: %w", err)
		}
		results = append(results, item)
	}
	return results, rows.Err()
}

// FleetGeoLocation is the most recent known scan location for an IN_SERVICE passport.
type FleetGeoLocation struct {
	PassportID   string    `json:"passport_id"`
	SerialNumber string    `json:"serial_number"`
	City         string    `json:"city"`
	Country      string    `json:"country"`
	Latitude     float64   `json:"latitude"`
	Longitude    float64   `json:"longitude"`
	ScannedAt    time.Time `json:"scanned_at"`
}

// GetFleetGeoLocations returns the latest known scan location for each
// IN_SERVICE passport in the tenant's fleet (one row per passport).
func (r *Repository) GetFleetGeoLocations(ctx context.Context, tenantID uuid.UUID, productType models.ProductType) ([]FleetGeoLocation, error) {
	query := `
		SELECT DISTINCT ON (s.passport_id)
			s.passport_id, p.serial_number, COALESCE(s.city, ''), COALESCE(s.country, ''),
			COALESCE(s.latitude, 0), COALESCE(s.longitude, 0), s.scanned_at
		FROM public.scan_events s
		JOIN public.passports p ON s.passport_id = p.uuid
		JOIN public.batches b ON p.batch_id = b.id
		WHERE b.tenant_id = $1 AND p.deleted_at IS NULL AND p.status = 'IN_SERVICE'
		  AND ($2 = '' OR b.product_type = $2)
		ORDER BY s.passport_id, s.scanned_at DESC`

	rows, err := r.db.Pool.Query(ctx, query, tenantID, productType)
	if err != nil {
		return nil, fmt.Errorf("failed to list fleet geo locations: %w", err)
	}
	defer rows.Close()

	var results []FleetGeoLocation
	for rows.Next() {
		var item FleetGeoLocation
		if err := rows.Scan(&item.PassportID, &item.SerialNumber, &item.City, &item.Country, &item.Latitude, &item.Longitude, &item.ScannedAt); err != nil {
			return nil, fmt.Errorf("failed to scan fleet geo location: %w", err)
		}
		results = append(results, item)
	}
	return results, rows.Err()
}
