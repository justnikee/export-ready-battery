package regulatory

import (
	"context"
	"fmt"
	"log/slog"
	"time"

	"github.com/anvayalabs/battery-api/internal/models"
	"github.com/anvayalabs/battery-api/internal/repository"
	"github.com/google/uuid"
)

// Fetcher implementations must satisfy this interface.
type Fetcher interface {
	Fetch(ctx context.Context, source *models.RegulatorySource) ([]models.RegulatoryItem, error)
}

// Ingester orchestrates fetching, classification, and tenant alert creation.
type Ingester struct {
	repo      repository.RepositoryInterface
	fetchers  map[models.RegulatorySourceType]Fetcher
	classifier *Classifier
}

// NewIngester creates the regulatory ingestion engine.
func NewIngester(repo repository.RepositoryInterface) *Ingester {
	return &Ingester{
		repo:       repo,
		fetchers:   make(map[models.RegulatorySourceType]Fetcher),
		classifier: NewClassifier(),
	}
}

// RegisterFetcher binds a fetcher to a source type.
func (i *Ingester) RegisterFetcher(t models.RegulatorySourceType, f Fetcher) {
	i.fetchers[t] = f
}

// RunAll iterates active sources, fetches, classifies, stores, and creates alerts.
func (i *Ingester) RunAll(ctx context.Context) error {
	sources, err := i.repo.ListRegulatorySources(ctx, true)
	if err != nil {
		return fmt.Errorf("failed to list sources: %w", err)
	}

	for _, source := range sources {
		if err := i.runSource(ctx, source); err != nil {
			slog.Error("regulatory ingestion failed for source", "source", source.Name, "error", err)
		}
	}
	return nil
}

// RunSource executes a single source by ID (for admin force-fetch).
func (i *Ingester) RunSource(ctx context.Context, sourceID uuid.UUID) error {
	source, err := i.repo.GetRegulatorySourceByID(ctx, sourceID)
	if err != nil {
		return fmt.Errorf("failed to get source: %w", err)
	}
	return i.runSource(ctx, source)
}

func (i *Ingester) runSource(ctx context.Context, source *models.RegulatorySource) error {
	fetcher, ok := i.fetchers[source.SourceType]
	if !ok {
		return fmt.Errorf("no fetcher registered for type %s", source.SourceType)
	}

	slog.Info("regulatory fetch starting", "source", source.Name, "type", source.SourceType)
	items, err := fetcher.Fetch(ctx, source)
	if err != nil {
		return fmt.Errorf("fetch failed: %w", err)
	}

	now := time.Now()
	newCount := 0
	for idx := range items {
		item := &items[idx]
		item.ID = uuid.New()
		item.SourceID = source.ID
		item.CreatedAt = now
		item.UpdatedAt = now

		// Classify
		i.classifier.Classify(item)

		// Upsert
		if err := i.repo.UpsertRegulatoryItem(ctx, item); err != nil {
			slog.Warn("failed to upsert regulatory item", "external_id", item.ExternalID, "error", err)
			continue
		}

		// Resolve the real DB item (on conflict, our generated ID is not the stored one)
		existing, err := i.repo.GetRegulatoryItemBySourceAndExternalID(ctx, item.SourceID, item.ExternalID)
		if err != nil || existing == nil {
			slog.Warn("failed to resolve regulatory item after upsert", "external_id", item.ExternalID, "error", err)
			continue
		}
		newCount++

		// Create tenant alerts
		if err := i.createAlertsForItem(ctx, existing); err != nil {
			slog.Warn("failed to create tenant alerts", "item", existing.ID, "error", err)
		}
	}

	_ = i.repo.UpdateRegulatorySourceFetchMeta(ctx, source.ID, now, source.LastETag)
	slog.Info("regulatory fetch completed", "source", source.Name, "items", len(items), "new", newCount)
	return nil
}

func (i *Ingester) createAlertsForItem(ctx context.Context, item *models.RegulatoryItem) error {
	tenantIDs, err := i.repo.ListTenantsForRegulatoryItem(ctx, item)
	if err != nil {
		return err
	}
	now := time.Now()
	for _, tid := range tenantIDs {
		alert := &models.TenantRegulatoryAlert{
			ID:               uuid.New(),
			TenantID:         tid,
			RegulatoryItemID: item.ID,
			IsRead:           false,
			IsDismissed:      false,
			CreatedAt:        now,
		}
		if err := i.repo.CreateTenantRegulatoryAlert(ctx, alert); err != nil {
			slog.Warn("failed to create alert", "tenant", tid, "item", item.ID, "error", err)
		}
	}
	return nil
}
