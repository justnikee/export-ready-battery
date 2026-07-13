package models

import (
	"time"

	"github.com/google/uuid"
)

// AIRegulationChunk represents a section of a legislative text and its embedding vector.
type AIRegulationChunk struct {
	ID        uuid.UUID `json:"id"`
	SourceDoc string    `json:"source_doc"`
	Title     string    `json:"title"`
	Section   string    `json:"section"`
	Content   string    `json:"content"`
	Embedding []float32 `json:"embedding"`
	CreatedAt time.Time `json:"created_at"`
}
