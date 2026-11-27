package models

import (
	"time"

	"github.com/google/uuid"
)

type TracePack struct {
	ID         uuid.UUID `json:"id"`
	Serial     string    `json:"serial_number"`
	BatchID    uuid.UUID `json:"batch_id"`
	BatchName  string    `json:"batch_name"`
	BatchState string    `json:"batch_status"`
}

type TraceLot struct {
	ID         uuid.UUID `json:"id"`
	Source     string    `json:"source"`
	PartNumber string    `json:"part_number"`
	LotCode    string    `json:"lot_code"`
}

type TraceEvidence struct {
	Scope      string    `json:"scope"`
	FileName   string    `json:"file_name"`
	SourceRow  int       `json:"source_row"`
	RecordedAt time.Time `json:"recorded_at"`
}

type TracePackLot struct {
	Lot      TraceLot      `json:"lot"`
	Evidence TraceEvidence `json:"evidence"`
}

type TraceLotImpact struct {
	PackID     *uuid.UUID    `json:"pack_id"`
	Serial     *string       `json:"serial_number"`
	BatchID    uuid.UUID     `json:"batch_id"`
	BatchName  string        `json:"batch_name"`
	BatchState string        `json:"batch_status"`
	Evidence   TraceEvidence `json:"evidence"`
}
