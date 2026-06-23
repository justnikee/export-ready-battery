package repository

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
)

// Component represents a single node in the battery BOM hierarchy.
type Component struct {
	ID                   uuid.UUID  `db:"id" json:"id"`
	TenantID             uuid.UUID  `db:"tenant_id" json:"tenant_id"`
	BatchID              *uuid.UUID `db:"batch_id" json:"batch_id,omitempty"`
	ParentID             *uuid.UUID `db:"parent_id" json:"parent_id,omitempty"`
	ComponentType        string     `db:"component_type" json:"component_type"`
	HierarchyLevel       int        `db:"hierarchy_level" json:"hierarchy_level"`
	Name                 string     `db:"name" json:"name"`
	ModelNumber          *string    `db:"model_number" json:"model_number,omitempty"`
	SerialNumber         *string    `db:"serial_number" json:"serial_number,omitempty"`
	LotNumber            *string    `db:"lot_number" json:"lot_number,omitempty"`
	DateOfManufacture    *time.Time `db:"date_of_manufacture" json:"date_of_manufacture,omitempty"`
	Manufacturer         *string    `db:"manufacturer" json:"manufacturer,omitempty"`
	ManufacturerAddress  *string    `db:"manufacturer_address" json:"manufacturer_address,omitempty"`
	ManufacturerEmail    *string    `db:"manufacturer_email" json:"manufacturer_email,omitempty"`
	CountryOfOrigin      *string    `db:"country_of_origin" json:"country_of_origin,omitempty"`
	Chemistry            *string    `db:"chemistry" json:"chemistry,omitempty"`
	CobaltPct            *float64   `db:"cobalt_pct" json:"cobalt_pct,omitempty"`
	LithiumPct           *float64   `db:"lithium_pct" json:"lithium_pct,omitempty"`
	NickelPct            *float64   `db:"nickel_pct" json:"nickel_pct,omitempty"`
	ManganesePct         *float64   `db:"manganese_pct" json:"manganese_pct,omitempty"`
	GraphitePct          *float64   `db:"graphite_pct" json:"graphite_pct,omitempty"`
	LeadPct              *float64   `db:"lead_pct" json:"lead_pct,omitempty"`
	RecycledCobaltPct    *float64   `db:"recycled_cobalt_pct" json:"recycled_cobalt_pct,omitempty"`
	RecycledLithiumPct   *float64   `db:"recycled_lithium_pct" json:"recycled_lithium_pct,omitempty"`
	RecycledNickelPct    *float64   `db:"recycled_nickel_pct" json:"recycled_nickel_pct,omitempty"`
	RecycledLeadPct      *float64   `db:"recycled_lead_pct" json:"recycled_lead_pct,omitempty"`
	WeightKg             *float64   `db:"weight_kg" json:"weight_kg,omitempty"`
	DimensionsMm         *string    `db:"dimensions_mm" json:"dimensions_mm,omitempty"`
	CEMarking            bool       `db:"ce_marking" json:"ce_marking"`
	BISNumber            *string    `db:"bis_number" json:"bis_number,omitempty"`
	HazardousLead        bool       `db:"hazardous_lead" json:"hazardous_lead"`
	HazardousMercury     bool       `db:"hazardous_mercury" json:"hazardous_mercury"`
	HazardousCadmium     bool       `db:"hazardous_cadmium" json:"hazardous_cadmium"`
	CreatedAt            time.Time  `db:"created_at" json:"created_at"`
	UpdatedAt            time.Time  `db:"updated_at" json:"updated_at"`
}

// ComponentTreeNode is a Component with its children loaded recursively.
type ComponentTreeNode struct {
	Component
	Children []*ComponentTreeNode `json:"children,omitempty"`
}

// --- CRUD ---

func (r *Repository) CreateComponent(ctx context.Context, c *Component) error {
	query := `INSERT INTO components (
		id, tenant_id, batch_id, parent_id, component_type, hierarchy_level, name, model_number,
		serial_number, lot_number, date_of_manufacture,
		manufacturer, manufacturer_address, manufacturer_email, country_of_origin,
		chemistry, cobalt_pct, lithium_pct, nickel_pct, manganese_pct, graphite_pct, lead_pct,
		recycled_cobalt_pct, recycled_lithium_pct, recycled_nickel_pct, recycled_lead_pct,
		weight_kg, dimensions_mm, ce_marking, bis_number,
		hazardous_lead, hazardous_mercury, hazardous_cadmium, created_at, updated_at
	) VALUES (
		$1, $2, $3, $4, $5, $6, $7, $8,
		$9, $10, $11,
		$12, $13, $14, $15,
		$16, $17, $18, $19, $20, $21, $22,
		$23, $24, $25, $26,
		$27, $28, $29, $30,
		$31, $32, $33, $34, $35
	)`
	_, err := r.db.Pool.Exec(ctx, query,
		c.ID, c.TenantID, c.BatchID, c.ParentID, c.ComponentType, c.HierarchyLevel, c.Name, c.ModelNumber,
		c.SerialNumber, c.LotNumber, c.DateOfManufacture,
		c.Manufacturer, c.ManufacturerAddress, c.ManufacturerEmail, c.CountryOfOrigin,
		c.Chemistry, c.CobaltPct, c.LithiumPct, c.NickelPct, c.ManganesePct, c.GraphitePct, c.LeadPct,
		c.RecycledCobaltPct, c.RecycledLithiumPct, c.RecycledNickelPct, c.RecycledLeadPct,
		c.WeightKg, c.DimensionsMm, c.CEMarking, c.BISNumber,
		c.HazardousLead, c.HazardousMercury, c.HazardousCadmium, c.CreatedAt, c.UpdatedAt,
	)
	if err != nil {
		return fmt.Errorf("failed to create component: %w", err)
	}
	return nil
}

func (r *Repository) GetComponent(ctx context.Context, id, tenantID uuid.UUID) (*Component, error) {
	query := `SELECT id, tenant_id, batch_id, parent_id, component_type, hierarchy_level, name, model_number,
		serial_number, lot_number, date_of_manufacture,
		manufacturer, manufacturer_address, manufacturer_email, country_of_origin,
		chemistry, cobalt_pct, lithium_pct, nickel_pct, manganese_pct, graphite_pct, lead_pct,
		recycled_cobalt_pct, recycled_lithium_pct, recycled_nickel_pct, recycled_lead_pct,
		weight_kg, dimensions_mm, ce_marking, bis_number,
		hazardous_lead, hazardous_mercury, hazardous_cadmium, created_at, updated_at
		FROM components WHERE id = $1 AND tenant_id = $2`
	c := &Component{}
	err := r.db.Pool.QueryRow(ctx, query, id, tenantID).Scan(
		&c.ID, &c.TenantID, &c.BatchID, &c.ParentID, &c.ComponentType, &c.HierarchyLevel, &c.Name, &c.ModelNumber,
		&c.SerialNumber, &c.LotNumber, &c.DateOfManufacture,
		&c.Manufacturer, &c.ManufacturerAddress, &c.ManufacturerEmail, &c.CountryOfOrigin,
		&c.Chemistry, &c.CobaltPct, &c.LithiumPct, &c.NickelPct, &c.ManganesePct, &c.GraphitePct, &c.LeadPct,
		&c.RecycledCobaltPct, &c.RecycledLithiumPct, &c.RecycledNickelPct, &c.RecycledLeadPct,
		&c.WeightKg, &c.DimensionsMm, &c.CEMarking, &c.BISNumber,
		&c.HazardousLead, &c.HazardousMercury, &c.HazardousCadmium, &c.CreatedAt, &c.UpdatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to get component: %w", err)
	}
	return c, nil
}

func (r *Repository) UpdateComponent(ctx context.Context, c *Component) error {
	query := `UPDATE components SET
		batch_id = $3, parent_id = $4, component_type = $5, hierarchy_level = $6, name = $7, model_number = $8,
		serial_number = $9, lot_number = $10, date_of_manufacture = $11,
		manufacturer = $12, manufacturer_address = $13, manufacturer_email = $14, country_of_origin = $15,
		chemistry = $16, cobalt_pct = $17, lithium_pct = $18, nickel_pct = $19, manganese_pct = $20, graphite_pct = $21, lead_pct = $22,
		recycled_cobalt_pct = $23, recycled_lithium_pct = $24, recycled_nickel_pct = $25, recycled_lead_pct = $26,
		weight_kg = $27, dimensions_mm = $28, ce_marking = $29, bis_number = $30,
		hazardous_lead = $31, hazardous_mercury = $32, hazardous_cadmium = $33
		WHERE id = $1 AND tenant_id = $2`
	_, err := r.db.Pool.Exec(ctx, query,
		c.ID, c.TenantID, c.BatchID, c.ParentID, c.ComponentType, c.HierarchyLevel, c.Name, c.ModelNumber,
		c.SerialNumber, c.LotNumber, c.DateOfManufacture,
		c.Manufacturer, c.ManufacturerAddress, c.ManufacturerEmail, c.CountryOfOrigin,
		c.Chemistry, c.CobaltPct, c.LithiumPct, c.NickelPct, c.ManganesePct, c.GraphitePct, c.LeadPct,
		c.RecycledCobaltPct, c.RecycledLithiumPct, c.RecycledNickelPct, c.RecycledLeadPct,
		c.WeightKg, c.DimensionsMm, c.CEMarking, c.BISNumber,
		c.HazardousLead, c.HazardousMercury, c.HazardousCadmium,
	)
	if err != nil {
		return fmt.Errorf("failed to update component: %w", err)
	}
	return nil
}

func (r *Repository) DeleteComponent(ctx context.Context, id, tenantID uuid.UUID) error {
	_, err := r.db.Pool.Exec(ctx,
		`DELETE FROM components WHERE id = $1 AND tenant_id = $2`,
		id, tenantID,
	)
	if err != nil {
		return fmt.Errorf("failed to delete component: %w", err)
	}
	return nil
}

// --- List by batch ---

func (r *Repository) ListComponentsByBatch(ctx context.Context, batchID, tenantID uuid.UUID) ([]*Component, error) {
	query := `SELECT id, tenant_id, batch_id, parent_id, component_type, hierarchy_level, name, model_number,
		serial_number, lot_number, date_of_manufacture,
		manufacturer, manufacturer_address, manufacturer_email, country_of_origin,
		chemistry, cobalt_pct, lithium_pct, nickel_pct, manganese_pct, graphite_pct, lead_pct,
		recycled_cobalt_pct, recycled_lithium_pct, recycled_nickel_pct, recycled_lead_pct,
		weight_kg, dimensions_mm, ce_marking, bis_number,
		hazardous_lead, hazardous_mercury, hazardous_cadmium, created_at, updated_at
		FROM components WHERE batch_id = $1 AND tenant_id = $2 ORDER BY hierarchy_level, name`
	rows, err := r.db.Pool.Query(ctx, query, batchID, tenantID)
	if err != nil {
		return nil, fmt.Errorf("failed to list components: %w", err)
	}
	defer rows.Close()
	return scanComponents(rows)
}

// --- Tree query ---

func (r *Repository) GetComponentTreeByBatch(ctx context.Context, batchID, tenantID uuid.UUID) ([]*ComponentTreeNode, error) {
	// Fetch all components for this batch
	query := `SELECT id, tenant_id, batch_id, parent_id, component_type, hierarchy_level, name, model_number,
		serial_number, lot_number, date_of_manufacture,
		manufacturer, manufacturer_address, manufacturer_email, country_of_origin,
		chemistry, cobalt_pct, lithium_pct, nickel_pct, manganese_pct, graphite_pct, lead_pct,
		recycled_cobalt_pct, recycled_lithium_pct, recycled_nickel_pct, recycled_lead_pct,
		weight_kg, dimensions_mm, ce_marking, bis_number,
		hazardous_lead, hazardous_mercury, hazardous_cadmium, created_at, updated_at
		FROM components WHERE batch_id = $1 AND tenant_id = $2 ORDER BY hierarchy_level, name`
	rows, err := r.db.Pool.Query(ctx, query, batchID, tenantID)
	if err != nil {
		return nil, fmt.Errorf("failed to list components for tree: %w", err)
	}
	defer rows.Close()

	components, err := scanComponents(rows)
	if err != nil {
		return nil, err
	}

	return buildTree(components), nil
}

func buildTree(components []*Component) []*ComponentTreeNode {
	byID := make(map[uuid.UUID]*ComponentTreeNode)
	var roots []*ComponentTreeNode

	for _, c := range components {
		byID[c.ID] = &ComponentTreeNode{Component: *c, Children: []*ComponentTreeNode{}}
	}

	for _, c := range components {
		node := byID[c.ID]
		if c.ParentID != nil {
			if parent, ok := byID[*c.ParentID]; ok {
				parent.Children = append(parent.Children, node)
			}
		} else {
			roots = append(roots, node)
		}
	}
	return roots
}

func scanComponents(rows pgx.Rows) ([]*Component, error) {
	var components []*Component
	for rows.Next() {
		c := &Component{}
		if err := rows.Scan(
			&c.ID, &c.TenantID, &c.BatchID, &c.ParentID, &c.ComponentType, &c.HierarchyLevel, &c.Name, &c.ModelNumber,
			&c.SerialNumber, &c.LotNumber, &c.DateOfManufacture,
			&c.Manufacturer, &c.ManufacturerAddress, &c.ManufacturerEmail, &c.CountryOfOrigin,
			&c.Chemistry, &c.CobaltPct, &c.LithiumPct, &c.NickelPct, &c.ManganesePct, &c.GraphitePct, &c.LeadPct,
			&c.RecycledCobaltPct, &c.RecycledLithiumPct, &c.RecycledNickelPct, &c.RecycledLeadPct,
			&c.WeightKg, &c.DimensionsMm, &c.CEMarking, &c.BISNumber,
			&c.HazardousLead, &c.HazardousMercury, &c.HazardousCadmium, &c.CreatedAt, &c.UpdatedAt,
		); err != nil {
			return nil, fmt.Errorf("failed to scan component: %w", err)
		}
		components = append(components, c)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("rows error: %w", err)
	}
	return components, nil
}
