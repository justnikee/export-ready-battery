package repository

import (
	"context"
	"fmt"

	"github.com/anvayalabs/battery-api/internal/models"
)

// GetActiveComplianceRules returns all active compliance rules for a given
// product type and market region. Rules are active when effective_until IS NULL
// and effective_from <= NOW().
func (r *Repository) GetActiveComplianceRules(ctx context.Context, productType, marketRegion string) ([]*models.ComplianceRule, error) {
	query := `
		SELECT id, product_type, market_region, rule_key, rule_type,
		       threshold_value, error_message, required,
		       effective_from, effective_until, version, created_at
		FROM compliance_rules
		WHERE product_type = $1
		  AND market_region = $2
		  AND effective_from <= NOW()
		  AND (effective_until IS NULL OR effective_until > NOW())
		ORDER BY rule_key, version DESC
	`

	rows, err := r.db.Pool.Query(ctx, query, productType, marketRegion)
	if err != nil {
		return nil, fmt.Errorf("failed to query compliance rules: %w", err)
	}
	defer rows.Close()

	var rules []*models.ComplianceRule
	for rows.Next() {
		rule := &models.ComplianceRule{}
		if err := rows.Scan(
			&rule.ID,
			&rule.ProductType,
			&rule.MarketRegion,
			&rule.RuleKey,
			&rule.RuleType,
			&rule.ThresholdValue,
			&rule.ErrorMessage,
			&rule.Required,
			&rule.EffectiveFrom,
			&rule.EffectiveUntil,
			&rule.Version,
			&rule.CreatedAt,
		); err != nil {
			return nil, fmt.Errorf("failed to scan compliance rule: %w", err)
		}
		rules = append(rules, rule)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating compliance rules: %w", err)
	}

	return rules, nil
}

// GetComplianceDeadlines returns all regulatory milestone deadlines for a product type and market region.
func (r *Repository) GetComplianceDeadlines(ctx context.Context, productType, marketRegion string) ([]*models.ComplianceDeadline, error) {
	query := `
		SELECT id, product_type, market_region, milestone_key, label,
		       deadline_date, description, url, version, created_at
		FROM compliance_deadlines
		WHERE product_type = $1
		  AND market_region = $2
		ORDER BY deadline_date ASC
	`

	rows, err := r.db.Pool.Query(ctx, query, productType, marketRegion)
	if err != nil {
		return nil, fmt.Errorf("failed to query compliance deadlines: %w", err)
	}
	defer rows.Close()

	var deadlines []*models.ComplianceDeadline
	for rows.Next() {
		d := &models.ComplianceDeadline{}
		if err := rows.Scan(
			&d.ID,
			&d.ProductType,
			&d.MarketRegion,
			&d.MilestoneKey,
			&d.Label,
			&d.DeadlineDate,
			&d.Description,
			&d.URL,
			&d.Version,
			&d.CreatedAt,
		); err != nil {
			return nil, fmt.Errorf("failed to scan compliance deadline: %w", err)
		}
		deadlines = append(deadlines, d)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating compliance deadlines: %w", err)
	}

	return deadlines, nil
}
