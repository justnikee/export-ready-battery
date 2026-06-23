package tally

import (
	"context"
	"fmt"
	"log/slog"
	"strings"
	"time"

	"github.com/anvayalabs/battery-api/internal/repository"
)

// StartSyncTicker starts a background goroutine that polls enabled Tally configs
// and syncs stock items + vouchers on the configured frequency (default 5 min).
func StartSyncTicker(repo repository.RepositoryInterface, defaultInterval time.Duration) {
	ticker := time.NewTicker(defaultInterval)
	go func() {
		// Run once immediately, then on each tick
		RunSync(context.Background(), repo)
		for range ticker.C {
			RunSync(context.Background(), repo)
		}
	}()
}

// RunSync iterates over all enabled Tally sync configs and pulls data from each.
func RunSync(ctx context.Context, repo repository.RepositoryInterface) {
	configs, err := repo.ListEnabledTallySyncConfigs(ctx)
	if err != nil {
		slog.Error("[tally-sync] failed to list enabled configs", "error", err)
		return
	}
	if len(configs) == 0 {
		return
	}

	for _, cfg := range configs {
		// Skip if last sync was within frequency window
		if cfg.LastSyncAt != nil {
			minInterval := time.Duration(cfg.SyncFrequencyMinutes) * time.Minute
			if time.Since(*cfg.LastSyncAt) < minInterval {
				continue
			}
		}

		tenantCtx, cancel := context.WithTimeout(ctx, 2*time.Minute)
		if err := syncTenant(tenantCtx, repo, cfg); err != nil {
			slog.Error("[tally-sync] tenant sync failed",
				"tenant_id", cfg.TenantID,
				"host", cfg.TallyHost,
				"error", err,
			)
		}
		cancel()
	}
}

func syncTenant(ctx context.Context, repo repository.RepositoryInterface, cfg *repository.TallySyncConfig) error {
	client := NewClient(cfg.TallyHost, cfg.TallyPort)

	run := &repository.TallySyncRun{
		TenantID:  cfg.TenantID,
		Status:    "running",
		StartedAt: time.Now(),
	}
	if err := repo.CreateTallySyncRun(ctx, run); err != nil {
		return fmt.Errorf("failed to create sync run: %w", err)
	}

	itemsFetched := 0
	itemsStaged := 0

	// Fetch stock items
	stockItems, err := client.RequestStockItems()
	if err != nil {
		_ = repo.UpdateTallySyncRun(ctx, run.ID, "error", err.Error(), itemsFetched, itemsStaged)
		return err
	}
	itemsFetched += len(stockItems)

	for _, si := range stockItems {
		chem := detectChemistryFromStockName(si.Name)
		if chem == "" {
			continue // Skip non-battery items
		}
		qty := si.ClosingQty
		if qty == 0 {
			qty = si.OpeningQty
		}
		stage := &repository.TallySyncStaging{
			TenantID:          cfg.TenantID,
			SyncRunID:         &run.ID,
			SourceType:        "stock_item",
			TallyName:         si.Name,
			TallyParent:       &si.Parent,
			TallyQty:          &qty,
			TallyRate:         &si.ClosingRate,
			TallyAmount:       &si.ClosingAmt,
			DetectedCategory:  &si.Parent,
			DetectedChemistry: &chem,
		}
		if err := repo.CreateTallySyncStaging(ctx, stage); err != nil {
			slog.Warn("[tally-sync] failed to stage stock item", "name", si.Name, "error", err)
			continue
		}
		itemsStaged++
	}

	// Fetch purchase vouchers
	vouchers, err := client.RequestPurchaseVouchers()
	if err != nil {
		_ = repo.UpdateTallySyncRun(ctx, run.ID, "error", err.Error(), itemsFetched, itemsStaged)
		return err
	}
	itemsFetched += len(vouchers)

	for _, v := range vouchers {
		for _, inv := range v.Items {
			chem := detectChemistryFromStockName(inv.StockItem)
			if chem == "" {
				continue
			}
			stage := &repository.TallySyncStaging{
				TenantID:          cfg.TenantID,
				SyncRunID:         &run.ID,
				SourceType:        "voucher",
				TallyName:         inv.StockItem,
				TallyQty:          &inv.Quantity,
				TallyRate:         &inv.Rate,
				TallyAmount:       &inv.Amount,
				TallyParty:        &v.PartyName,
				DetectedCategory:  strPtr("Purchase"),
				DetectedChemistry: &chem,
			}
			if err := repo.CreateTallySyncStaging(ctx, stage); err != nil {
				slog.Warn("[tally-sync] failed to stage voucher item", "name", inv.StockItem, "error", err)
				continue
			}
			itemsStaged++
		}
	}

	if err := repo.UpdateTallySyncRun(ctx, run.ID, "success", "", itemsFetched, itemsStaged); err != nil {
		return fmt.Errorf("failed to update sync run: %w", err)
	}

	now := time.Now()
	if err := repo.UpdateTallySyncLastSync(ctx, cfg.TenantID, now); err != nil {
		slog.Warn("[tally-sync] failed to update last_sync_at", "tenant_id", cfg.TenantID, "error", err)
	}

	slog.Info("[tally-sync] completed",
		"tenant_id", cfg.TenantID,
		"items_fetched", itemsFetched,
		"items_staged", itemsStaged,
	)
	return nil
}

func detectChemistryFromStockName(name string) string {
	n := strings.ToLower(name)
	switch {
	case strings.Contains(n, "lfp") || strings.Contains(n, "lithium iron") || strings.Contains(n, "lifepo4"):
		return "LFP"
	case strings.Contains(n, "nmc") || strings.Contains(n, "nickel manganese"):
		return "NMC"
	case strings.Contains(n, "nca") || strings.Contains(n, "nickel cobalt aluminum"):
		return "NCA"
	case strings.Contains(n, "lead acid") || strings.Contains(n, "lead-acid") || strings.Contains(n, "sla"):
		return "LeadAcid"
	case strings.Contains(n, "graphite"):
		return "Graphite"
	case strings.Contains(n, "cobalt"):
		return "Cobalt"
	case strings.Contains(n, "lithium"):
		return "Lithium"
	case strings.Contains(n, "nickel"):
		return "Nickel"
	case strings.Contains(n, "cell") || strings.Contains(n, "battery"):
		return "LFP" // Default fallback for battery cells
	default:
		return ""
	}
}

func strPtr(s string) *string { return &s }
