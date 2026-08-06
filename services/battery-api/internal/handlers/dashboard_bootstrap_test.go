package handlers

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/anvayalabs/battery-api/internal/middleware"
	"github.com/anvayalabs/battery-api/internal/models"
	"github.com/anvayalabs/battery-api/internal/repository"
	"github.com/google/uuid"
	"github.com/stretchr/testify/mock"
)

func TestCountStaleDraftBatches(t *testing.T) {
	now := time.Now()
	batches := []*models.BatchChartData{
		{Status: "DRAFT", CreatedAt: now.AddDate(0, 0, -10)},
		{Status: "DRAFT", CreatedAt: now.AddDate(0, 0, -2)}, // too new
		{Status: "ACTIVE", CreatedAt: now.AddDate(0, 0, -30)},
		{Status: "DRAFT", CreatedAt: now.AddDate(0, 0, -8)},
	}
	if n := countStaleDraftBatches(batches, 7); n != 2 {
		t.Fatalf("got %d want 2", n)
	}
	if n := countStaleDraftBatches(nil, 7); n != 0 {
		t.Fatalf("nil: got %d", n)
	}
}

func TestGetDashboardBootstrap_OK(t *testing.T) {
	tenantID := uuid.New()
	repo := new(repository.MockRepository)

	stats := &models.DashboardStats{
		TotalPassports: 10,
		TotalBatches:   2,
		QuotaBalance:   5,
		QuotaLimit:     100,
		QuotaUsed:      95,
		BatchesByStatus: map[string]int{"DRAFT": 1, "ACTIVE": 1},
	}
	chart := []*models.BatchChartData{
		{ID: uuid.New().String(), Status: "DRAFT", CreatedAt: time.Now().AddDate(0, 0, -10), TotalPassports: 0},
		{ID: uuid.New().String(), Status: "ACTIVE", CreatedAt: time.Now(), TotalPassports: 10},
	}
	recent := []*models.BatchSummary{
		{ID: uuid.New().String(), Name: "B1", TotalUnits: 10, Status: "ACTIVE", MarketRegion: models.MarketRegionEU, CreatedAt: time.Now().Format(time.RFC3339)},
	}

	repo.On("GetDashboardStats", mock.Anything, tenantID, mock.Anything).Return(stats, nil)
	repo.On("GetBatchesChartData", mock.Anything, tenantID, 200).Return(chart, nil)
	repo.On("GetRecentBatches", mock.Anything, tenantID, 5).Return(recent, nil)

	h := &Handler{repo: repo}
	req := httptest.NewRequest(http.MethodGet, "/api/v1/dashboard/bootstrap", nil)
	ctx := context.WithValue(req.Context(), middleware.TenantIDKey, tenantID.String())
	ctx = context.WithValue(ctx, middleware.ProductTypeKey, string(models.ProductTypeBattery))
	req = req.WithContext(ctx)

	rr := httptest.NewRecorder()
	h.GetDashboardBootstrap(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", rr.Code, rr.Body.String())
	}
	var body DashboardBootstrap
	if err := json.NewDecoder(rr.Body).Decode(&body); err != nil {
		t.Fatal(err)
	}
	if body.Stats == nil || body.Stats.TotalPassports != 10 {
		t.Fatalf("stats: %+v", body.Stats)
	}
	if len(body.ChartBatches) != 2 {
		t.Fatalf("chart: %d", len(body.ChartBatches))
	}
	if len(body.RecentBatches) != 1 {
		t.Fatalf("recent: %d", len(body.RecentBatches))
	}
	if body.StaleDraftBatchCount != 1 {
		t.Fatalf("stale drafts: got %d want 1", body.StaleDraftBatchCount)
	}
	repo.AssertExpectations(t)
}

func TestGetDashboardBootstrap_Unauthorized(t *testing.T) {
	h := &Handler{repo: new(repository.MockRepository)}
	req := httptest.NewRequest(http.MethodGet, "/api/v1/dashboard/bootstrap", nil)
	rr := httptest.NewRecorder()
	h.GetDashboardBootstrap(rr, req)
	if rr.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401, got %d", rr.Code)
	}
}
