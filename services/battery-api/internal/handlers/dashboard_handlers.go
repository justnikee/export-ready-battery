package handlers

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"strconv"
	"time"

	"github.com/anvayalabs/battery-api/internal/middleware"
	"github.com/anvayalabs/battery-api/internal/models"

	"github.com/google/uuid"
)

// GetDashboardStats handles GET /api/v1/dashboard/stats
func (h *Handler) GetDashboardStats(w http.ResponseWriter, r *http.Request) {
	tenantIDStr := middleware.GetTenantID(r.Context())
	if tenantIDStr == "" {
		respondError(w, http.StatusUnauthorized, "Not authenticated")
		return
	}

	tenantID, err := uuid.Parse(tenantIDStr)
	if err != nil {
		respondError(w, http.StatusUnauthorized, "Invalid tenant context")
		return
	}

	stats, err := h.repo.GetDashboardStats(r.Context(), tenantID, models.ProductType(middleware.GetProductType(r.Context())))
	if err != nil {
		slog.Error("Failed to get dashboard stats", "error", err)
		respondError(w, http.StatusInternalServerError, "Failed to get dashboard stats")
		return
	}

	respondJSON(w, http.StatusOK, stats)
}

// GetRecentBatches handles GET /api/v1/batches/recent
func (h *Handler) GetRecentBatches(w http.ResponseWriter, r *http.Request) {
	tenantIDStr := middleware.GetTenantID(r.Context())
	if tenantIDStr == "" {
		respondError(w, http.StatusUnauthorized, "Not authenticated")
		return
	}

	tenantID, err := uuid.Parse(tenantIDStr)
	if err != nil {
		respondError(w, http.StatusUnauthorized, "Invalid tenant context")
		return
	}

	// Default to 5, max 20
	limit := 5
	if limitStr := r.URL.Query().Get("limit"); limitStr != "" {
		if parsed, err := strconv.Atoi(limitStr); err == nil && parsed > 0 && parsed <= 20 {
			limit = parsed
		}
	}

	batches, err := h.repo.GetRecentBatches(r.Context(), tenantID, limit)
	if err != nil {
		slog.Error("Failed to get recent batches", "error", err)
		respondError(w, http.StatusInternalServerError, "Failed to get recent batches")
		return
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"batches": batches,
		"count":   len(batches),
	})
}

// GetBatchesChartData handles GET /api/v1/batches/chart-data
// Returns the minimal per-batch fields (id, status, created_at, total_passports)
// needed to render the dashboard production chart and compliance score card.
func (h *Handler) GetBatchesChartData(w http.ResponseWriter, r *http.Request) {
	tenantIDStr := middleware.GetTenantID(r.Context())
	if tenantIDStr == "" {
		respondError(w, http.StatusUnauthorized, "Not authenticated")
		return
	}

	tenantID, err := uuid.Parse(tenantIDStr)
	if err != nil {
		respondError(w, http.StatusUnauthorized, "Invalid tenant context")
		return
	}

	limit := 200
	if limitStr := r.URL.Query().Get("limit"); limitStr != "" {
		if parsed, err := strconv.Atoi(limitStr); err == nil && parsed > 0 && parsed <= 200 {
			limit = parsed
		}
	}

	batches, err := h.repo.GetBatchesChartData(r.Context(), tenantID, limit)
	if err != nil {
		slog.Error("Failed to get batches chart data", "error", err)
		respondError(w, http.StatusInternalServerError, "Failed to get batches chart data")
		return
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"batches": batches,
		"count":   len(batches),
	})
}

// GetAnalyticsOverview handles GET /api/v1/analytics/overview
func (h *Handler) GetAnalyticsOverview(w http.ResponseWriter, r *http.Request) {
	tenantIDStr := middleware.GetTenantID(r.Context())
	if tenantIDStr == "" {
		respondError(w, http.StatusUnauthorized, "Not authenticated")
		return
	}

	tenantID, err := uuid.Parse(tenantIDStr)
	if err != nil {
		respondError(w, http.StatusUnauthorized, "Invalid tenant context")
		return
	}

	overview, err := h.repo.GetAnalyticsOverview(r.Context(), tenantID, models.ProductType(middleware.GetProductType(r.Context())))
	if err != nil {
		slog.Error("Failed to get analytics overview", "error", err)
		respondError(w, http.StatusInternalServerError, "Failed to get analytics")
		return
	}

	respondJSON(w, http.StatusOK, overview)
}

// GetScanFeed handles GET /api/v1/scans/feed
func (h *Handler) GetScanFeed(w http.ResponseWriter, r *http.Request) {
	tenantIDStr := middleware.GetTenantID(r.Context())
	if tenantIDStr == "" {
		respondError(w, http.StatusUnauthorized, "Not authenticated")
		return
	}

	tenantID, err := uuid.Parse(tenantIDStr)
	if err != nil {
		respondError(w, http.StatusUnauthorized, "Invalid tenant context")
		return
	}

	// Default to 10
	limit := 10
	if limitStr := r.URL.Query().Get("limit"); limitStr != "" {
		if parsed, err := strconv.Atoi(limitStr); err == nil && parsed > 0 && parsed <= 50 {
			limit = parsed
		}
	}

	feed, err := h.repo.GetScanFeed(r.Context(), tenantID, limit)
	if err != nil {
		slog.Error("Failed to get scan feed", "error", err)
		respondError(w, http.StatusInternalServerError, "Failed to get scan feed")
		return
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"scans": feed,
		"count": len(feed),
	})
}

// scanFeedPollInterval is how often the SSE stream checks for new scans.
// Single-instance-friendly design: each connection polls the DB itself
// rather than relying on a cross-instance pub/sub broadcaster.
const scanFeedPollInterval = 3 * time.Second

// scanFeedKeepAliveInterval is how often a comment line is sent to keep
// the connection alive through proxies/load balancers when there's been
// no real data to send.
const scanFeedKeepAliveInterval = 30 * time.Second

// StreamScanFeed handles GET /api/v1/scans/feed/stream — Server-Sent Events.
// Streams new scans as they're recorded, instead of the client polling
// GET /scans/feed on a timer.
func (h *Handler) StreamScanFeed(w http.ResponseWriter, r *http.Request) {
	tenantIDStr := middleware.GetTenantID(r.Context())
	if tenantIDStr == "" {
		respondError(w, http.StatusUnauthorized, "Not authenticated")
		return
	}
	tenantID, err := uuid.Parse(tenantIDStr)
	if err != nil {
		respondError(w, http.StatusUnauthorized, "Invalid tenant context")
		return
	}

	flusher, ok := w.(http.Flusher)
	if !ok {
		respondError(w, http.StatusInternalServerError, "Streaming not supported")
		return
	}

	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")
	w.Header().Set("X-Accel-Buffering", "no") // disable nginx response buffering
	w.WriteHeader(http.StatusOK)
	flusher.Flush()

	ctx := r.Context()
	cursor := scanFeedCursor{lastSeen: time.Now(), lastSent: time.Now()}

	ticker := time.NewTicker(scanFeedPollInterval)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			var pollErr error
			cursor, pollErr = h.pollAndWriteScans(ctx, w, flusher, tenantID, cursor)
			if pollErr != nil {
				return
			}
		}
	}
}

// scanFeedCursor tracks how far the stream has read and when it last wrote
// anything (including keep-alives), across poll iterations.
type scanFeedCursor struct {
	lastSeen time.Time
	lastSent time.Time
}

// pollAndWriteScans runs a single poll-and-write cycle: fetch anything new
// since cursor.lastSeen, write each as an SSE "data:" line, or write a
// keep-alive comment if nothing's new and the keep-alive interval has
// elapsed. Split out from StreamScanFeed's ticker loop so it can be tested
// directly without waiting on real timers.
func (h *Handler) pollAndWriteScans(ctx context.Context, w io.Writer, flusher http.Flusher, tenantID uuid.UUID, cursor scanFeedCursor) (scanFeedCursor, error) {
	items, err := h.repo.GetScanFeedSince(ctx, tenantID, cursor.lastSeen, 50)
	if err != nil {
		slog.Error("Failed to poll scan feed", "error", err)
		return cursor, nil
	}

	if len(items) == 0 {
		if time.Since(cursor.lastSent) >= scanFeedKeepAliveInterval {
			if _, err := fmt.Fprint(w, ": keep-alive\n\n"); err != nil {
				return cursor, err
			}
			flusher.Flush()
			cursor.lastSent = time.Now()
		}
		return cursor, nil
	}

	for _, item := range items {
		payload, err := json.Marshal(item)
		if err != nil {
			continue
		}
		if _, err := fmt.Fprintf(w, "data: %s\n\n", payload); err != nil {
			return cursor, err
		}
		if item.ScannedAt.After(cursor.lastSeen) {
			cursor.lastSeen = item.ScannedAt
		}
	}
	flusher.Flush()
	cursor.lastSent = time.Now()
	return cursor, nil
}
