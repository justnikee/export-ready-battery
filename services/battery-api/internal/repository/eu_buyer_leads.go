package repository

import (
	"context"

	"github.com/anvayalabs/battery-api/internal/models"
)

// CreateEUBuyerLead inserts a new EU buyer lead into the database.
func (r *Repository) CreateEUBuyerLead(ctx context.Context, lead *models.EUBuyerLead) error {
	query := `
		INSERT INTO eu_buyer_leads (buyer_company_name, contact_name, contact_email, country, indian_suppliers, message, status, created_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
		RETURNING id, created_at
	`
	return r.db.Pool.QueryRow(ctx, query,
		lead.BuyerCompanyName,
		lead.ContactName,
		lead.ContactEmail,
		lead.Country,
		lead.IndianSuppliers,
		lead.Message,
		lead.Status,
	).Scan(&lead.ID, &lead.CreatedAt)
}
