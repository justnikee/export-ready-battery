package models

import "github.com/google/uuid"

const (
	LotScopePack         = "pack"
	LotScopeBatchAll     = "batch_all"
	LotScopeBatchUnknown = "batch_unknown"
)

type ComponentLotRow struct {
	Line         int       `json:"line"`
	BatchID      uuid.UUID `json:"batch_id"`
	Scope        string    `json:"scope"`
	SerialNumber string    `json:"serial_number"`
	Source       string    `json:"source"`
	PartNumber   string    `json:"part_number"`
	LotCode      string    `json:"lot_code"`
}

type ComponentLotIssue struct {
	Line    int    `json:"line"`
	Field   string `json:"field"`
	Message string `json:"message"`
}

type ComponentLotImportInput struct {
	FileName      string
	FileSHA256    string
	Rows          []ComponentLotRow
	Issues        []ComponentLotIssue
	ExpectedToken string
}

type ComponentLotPreviewRow struct {
	ComponentLotRow
	BatchName string `json:"batch_name"`
	Status    string `json:"status"`
}

type ComponentLotImportResult struct {
	Rows         []ComponentLotPreviewRow `json:"rows"`
	Issues       []ComponentLotIssue      `json:"issues"`
	NewRows      int                      `json:"new_rows"`
	ExistingRows int                      `json:"existing_rows"`
	Token        string                   `json:"validation_token,omitempty"`
	ImportID     *uuid.UUID               `json:"import_id,omitempty"`
}
