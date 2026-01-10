package repository

import (
	"exportready-battery/internal/db"
)

// Repository handles all database operations
type Repository struct {
	db *db.DB
}

// New creates a new Repository
func New(database *db.DB) *Repository {
	return &Repository{db: database}
}
