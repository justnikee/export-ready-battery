// Package schema provides an in-memory, optionally DB-backed schema registry
// for product Digital Product Passport (DPP) specifications.
//
// On first access the Registry fetches a ProductSchema from the Store (DB) and
// caches it. A static seed is always available as a fallback, ensuring schemas
// work before the database is populated.
package schema

import (
	"context"
	"fmt"
	"sync"

	"github.com/anvayalabs/battery-api/internal/models"
)

// Store is the persistence interface for loading ProductSchemas from the database.
// The DB repository should implement this interface; a nil Store makes the
// Registry operate in seed-only (in-memory) mode — useful for tests.
type Store interface {
	GetActiveSchema(ctx context.Context, productType models.ProductType) (*models.ProductSchema, error)
	GetSchemaByVersion(ctx context.Context, productType models.ProductType, version int) (*models.ProductSchema, error)
}

// cacheKey uniquely identifies a (ProductType, Version) pair.
// Version 0 is a sentinel meaning "latest active".
type cacheKey struct {
	ProductType models.ProductType
	Version     int
}

// Registry is a thread-safe in-memory schema registry.
// It lazily fetches schemas from the Store on first access and caches results.
// Static seeds registered via Seed() act as a guaranteed fallback.
type Registry struct {
	mu    sync.RWMutex
	store Store
	cache map[cacheKey]*models.ProductSchema
	seeds map[cacheKey]*models.ProductSchema
}

// NewRegistry creates a Registry backed by the given Store.
// Pass nil for store to use a seed-only in-memory registry.
func NewRegistry(store Store) *Registry {
	return &Registry{
		cache: make(map[cacheKey]*models.ProductSchema),
		seeds: make(map[cacheKey]*models.ProductSchema),
		store: store,
	}
}

// Seed registers a static in-memory schema.
// Seeds provide a safe fallback when the DB is not yet populated.
// DB entries always take precedence over seeds on cache miss.
func (r *Registry) Seed(s *models.ProductSchema) {
	r.mu.Lock()
	defer r.mu.Unlock()
	r.seeds[cacheKey{s.ProductType, s.Version}] = s
}

// GetActive returns the active (highest-version) schema for a product type.
// Resolution order: in-memory cache → DB store → static seeds.
func (r *Registry) GetActive(ctx context.Context, pt models.ProductType) (*models.ProductSchema, error) {
	// Fast path: check cache under a read lock.
	r.mu.RLock()
	if s, ok := r.cache[cacheKey{pt, 0}]; ok {
		r.mu.RUnlock()
		return s, nil
	}
	r.mu.RUnlock()

	// Try DB store.
	if r.store != nil {
		s, err := r.store.GetActiveSchema(ctx, pt)
		if err == nil && s != nil {
			r.mu.Lock()
			r.cache[cacheKey{pt, 0}] = s
			r.cache[cacheKey{pt, s.Version}] = s
			r.mu.Unlock()
			return s, nil
		}
	}

	// Fallback: return the highest-versioned seed for this product type.
	r.mu.RLock()
	defer r.mu.RUnlock()
	var best *models.ProductSchema
	for k, s := range r.seeds {
		if k.ProductType == pt && (best == nil || s.Version > best.Version) {
			best = s
		}
	}
	if best != nil {
		return best, nil
	}
	return nil, fmt.Errorf("schema: no active schema found for product type %s", pt)
}

// GetByVersion returns a specific schema version for a product type.
// Resolution order: in-memory cache → DB store → static seeds.
func (r *Registry) GetByVersion(ctx context.Context, pt models.ProductType, version int) (*models.ProductSchema, error) {
	r.mu.RLock()
	if s, ok := r.cache[cacheKey{pt, version}]; ok {
		r.mu.RUnlock()
		return s, nil
	}
	r.mu.RUnlock()

	if r.store != nil {
		s, err := r.store.GetSchemaByVersion(ctx, pt, version)
		if err == nil && s != nil {
			r.mu.Lock()
			r.cache[cacheKey{pt, version}] = s
			r.mu.Unlock()
			return s, nil
		}
	}

	r.mu.RLock()
	defer r.mu.RUnlock()
	if s, ok := r.seeds[cacheKey{pt, version}]; ok {
		return s, nil
	}
	return nil, fmt.Errorf("schema: no schema found for product type %s version %d", pt, version)
}

// Invalidate removes a cached entry for a product type and version,
// forcing the next access to re-fetch from the store.
// Also invalidates the "latest" sentinel (version 0).
func (r *Registry) Invalidate(pt models.ProductType, version int) {
	r.mu.Lock()
	defer r.mu.Unlock()
	delete(r.cache, cacheKey{pt, version})
	delete(r.cache, cacheKey{pt, 0})
}
