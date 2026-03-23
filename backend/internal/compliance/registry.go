package compliance

import (
	"encoding/json"
	"fmt"

	"exportready-battery/internal/models"
)

// routeKey is the map key that uniquely identifies a (ProductType, MarketRegion) pair.
type routeKey struct {
	ProductType  models.ProductType
	MarketRegion models.MarketRegion
}

// Registry maps (ProductType, MarketRegion) pairs to their Validators.
// It is the central router of the compliance engine.
type Registry struct {
	validators map[routeKey]Validator
}

// NewRegistry creates a new empty Registry.
func NewRegistry() *Registry {
	return &Registry{
		validators: make(map[routeKey]Validator),
	}
}

// Register registers a Validator for the given product/market combination.
// Panics on duplicate registration to catch misconfiguration at startup.
func (r *Registry) Register(pt models.ProductType, mr models.MarketRegion, v Validator) {
	k := routeKey{pt, mr}
	if _, exists := r.validators[k]; exists {
		panic(fmt.Sprintf("compliance: duplicate validator registration for product=%s market=%s", pt, mr))
	}
	r.validators[k] = v
}

// Get returns the Validator for the given product/market combination.
func (r *Registry) Get(pt models.ProductType, mr models.MarketRegion) (Validator, error) {
	if v, ok := r.validators[routeKey{pt, mr}]; ok {
		return v, nil
	}
	return nil, fmt.Errorf("compliance: no validator registered for product=%s market=%s", pt, mr)
}

// Validate looks up the correct Validator and runs it against the raw specs JSON.
func (r *Registry) Validate(pt models.ProductType, mr models.MarketRegion, specs json.RawMessage) (Result, error) {
	v, err := r.Get(pt, mr)
	if err != nil {
		return Result{}, err
	}
	return v.Validate(specs)
}

// ValidateBatch looks up the correct validator and, when it implements BatchValidator,
// calls ValidateBatch for full structured context. Falls back to Validate(specs) otherwise.
func (r *Registry) ValidateBatch(pt models.ProductType, mr models.MarketRegion, batch *models.Batch, tenant *models.Tenant) (Result, error) {
	// GLOBAL market: run both India and EU validators and aggregate.
	if mr == models.MarketRegionGlobal {
		return r.validateGlobal(pt, batch, tenant)
	}

	v, err := r.Get(pt, mr)
	if err != nil {
		return Result{}, err
	}
	if bv, ok := v.(BatchValidator); ok {
		return bv.ValidateBatch(batch, tenant)
	}
	specsJSON, err := json.Marshal(batch.Specs)
	if err != nil {
		return Result{}, fmt.Errorf("compliance: failed to marshal batch specs: %w", err)
	}
	return v.Validate(specsJSON)
}

// validateGlobal runs India + EU validators and aggregates the results.
func (r *Registry) validateGlobal(pt models.ProductType, batch *models.Batch, tenant *models.Tenant) (Result, error) {
	indiaResult, err := r.ValidateBatch(pt, models.MarketRegionIndia, batch, tenant)
	if err != nil {
		return Result{}, fmt.Errorf("compliance: global/india validation failed: %w", err)
	}
	euResult, err := r.ValidateBatch(pt, models.MarketRegionEU, batch, tenant)
	if err != nil {
		return Result{}, fmt.Errorf("compliance: global/eu validation failed: %w", err)
	}
	return Aggregate(indiaResult, euResult), nil
}
