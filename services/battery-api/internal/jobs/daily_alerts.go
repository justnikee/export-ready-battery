package jobs

import (
	"context"
	"log/slog"
	"time"

	"github.com/anvayalabs/battery-api/internal/services"
)

// StartDailyAlertTicker starts a background goroutine that runs the daily
// compliance alert scan at the specified interval (recommended: 24 hours).
func StartDailyAlertTicker(alertSvc *services.AlertService, interval time.Duration) {
	ticker := time.NewTicker(interval)
	go func() {
		// Run once immediately on startup, then on each tick
		runDailyAlerts(alertSvc)
		for range ticker.C {
			runDailyAlerts(alertSvc)
		}
	}()
}

func runDailyAlerts(alertSvc *services.AlertService) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Minute)
	defer cancel()

	slog.Info("[daily-alerts] starting certificate expiry check")
	if err := alertSvc.CheckCertificateExpiries(ctx, 30); err != nil {
		slog.Error("[daily-alerts] certificate expiry check failed", "error", err)
	} else {
		slog.Info("[daily-alerts] certificate expiry check completed")
	}

	slog.Info("[daily-alerts] starting compliance score check")
	if err := alertSvc.CheckComplianceScores(ctx, 70.0); err != nil {
		slog.Error("[daily-alerts] compliance score check failed", "error", err)
	} else {
		slog.Info("[daily-alerts] compliance score check completed")
	}
}
