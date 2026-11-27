package models

import (
	"time"

	"github.com/google/uuid"
)

type BatteryModel struct {
	ID        uuid.UUID `json:"id"`
	Code      string    `json:"code"`
	Name      string    `json:"name"`
	CreatedAt time.Time `json:"created_at"`
}

// ModelRevisionSpecs captures the intended design, including the planned BOM.
// Voltage and capacity use the same unit-bearing strings as BatchSpec.
type ModelRevisionSpecs struct {
	Chemistry       string                `json:"chemistry"`
	Voltage         string                `json:"voltage"`
	Capacity        string                `json:"capacity"`
	BatteryCategory BatteryCategory       `json:"battery_category,omitempty"`
	IntendedBOM     []IntendedBatteryPart `json:"intended_bom,omitempty"`
}

type IntendedBatteryPart struct {
	PartNumber string `json:"part_number"`
	Name       string `json:"name"`
	Quantity   int    `json:"quantity"`
}

type BatteryModelRevision struct {
	ID             uuid.UUID          `json:"id"`
	ModelID        uuid.UUID          `json:"model_id"`
	RevisionNumber int                `json:"revision_number"`
	Version        int                `json:"version"`
	Specs          ModelRevisionSpecs `json:"specs"`
	CreatedAt      time.Time          `json:"created_at"`
	UpdatedAt      time.Time          `json:"updated_at"`
	ReleasedAt     *time.Time         `json:"released_at"`
	ReleasedBy     *uuid.UUID         `json:"released_by,omitempty"`
}
