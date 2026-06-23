package jobs

import (
	"context"
	"log/slog"
	"time"

	"github.com/anvayalabs/battery-api/internal/regulatory"
	"github.com/anvayalabs/battery-api/internal/regulatory/fetchers"
	"github.com/anvayalabs/battery-api/internal/repository"
)

// RegulatoryWorker periodically ingests regulatory sources.
type RegulatoryWorker struct {
	ingester *regulatory.Ingester
	interval time.Duration
	quit     chan struct{}
}

// NewRegulatoryWorker creates the worker with default fetchers registered.
func NewRegulatoryWorker(repo repository.RepositoryInterface, interval time.Duration) *RegulatoryWorker {
	ing := regulatory.NewIngester(repo)
	ing.RegisterFetcher("rss", fetchers.NewRSSFetcher())
	ing.RegisterFetcher("api", fetchers.NewRSSFetcher()) // APIs often return RSS/Atom-like XML
	ing.RegisterFetcher("scraper", fetchers.NewScraperFetcher())

	if interval == 0 {
		interval = 6 * time.Hour
	}

	return &RegulatoryWorker{
		ingester: ing,
		interval: interval,
		quit:     make(chan struct{}),
	}
}

// Start begins the background ticker.
func (w *RegulatoryWorker) Start() {
	go w.loop()
	slog.Info("regulatory worker started", "interval", w.interval.String())
}

// Stop gracefully shuts down the worker.
func (w *RegulatoryWorker) Stop() {
	close(w.quit)
	slog.Info("regulatory worker stopped")
}

func (w *RegulatoryWorker) loop() {
	ticker := time.NewTicker(w.interval)
	defer ticker.Stop()

	// Run immediately on startup
	w.run()

	for {
		select {
		case <-w.quit:
			return
		case <-ticker.C:
			w.run()
		}
	}
}

func (w *RegulatoryWorker) run() {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Minute)
	defer cancel()

	slog.Info("[regulatory-worker] starting ingestion cycle")
	if err := w.ingester.RunAll(ctx); err != nil {
		slog.Error("[regulatory-worker] ingestion cycle failed", "error", err)
	} else {
		slog.Info("[regulatory-worker] ingestion cycle completed")
	}
}
