package models

import (
	"time"

	"github.com/google/uuid"
)

type ReleaseEvidenceRevision struct {
	ID             uuid.UUID `json:"id"`
	BatchID        uuid.UUID `json:"batch_id"`
	SourceSystem   string    `json:"source_system"`
	RecordRef      string    `json:"record_ref"`
	Revision       int       `json:"revision"`
	Current        bool      `json:"current"`
	SourceRevision string    `json:"source_revision"`
	Disposition    string    `json:"disposition"`
	Reviewer       string    `json:"reviewer"`
	RecordedOn     string    `json:"recorded_on"`
	Scope          string    `json:"scope"`
	SampleSerials  []string  `json:"sample_serials"`
	FileName       string    `json:"file_name"`
	FileSize       int       `json:"file_size"`
	FileSHA256     string    `json:"-"`
	ActorID        uuid.UUID `json:"actor_id"`
	CreatedAt      time.Time `json:"created_at"`
}
