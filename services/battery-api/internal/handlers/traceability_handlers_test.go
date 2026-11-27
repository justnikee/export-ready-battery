package handlers

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/anvayalabs/battery-api/internal/middleware"
	"github.com/anvayalabs/battery-api/internal/models"
	"github.com/anvayalabs/battery-api/internal/repository"
	"github.com/anvayalabs/battery-api/internal/services"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/stretchr/testify/mock"
	"github.com/stretchr/testify/require"
)

func TestTraceabilityWorkspaceReads(t *testing.T) {
	tenant, actor, otherTenant, lotID := uuid.New(), uuid.New(), uuid.New(), uuid.New()
	repo := new(repository.MockRepository)
	h := &Handler{repo: repo}
	auth := services.NewAuthService("traceability-test-secret", time.Hour, time.Hour)
	member := true
	guard := middleware.NewAuth(auth)
	activeRole := func(_ context.Context, workspace, user uuid.UUID) (string, error) {
		if !member || workspace != tenant || user != actor {
			return "", pgx.ErrNoRows
		}
		return middleware.RoleViewer, nil
	}
	mux := http.NewServeMux()
	h.RegisterTraceabilityRoutes(mux, func(next http.Handler) http.Handler { return guard.ProtectWorkspace(next, activeRole) })
	token, err := auth.GenerateToken(tenant.String(), actor.String(), "fixture@example.test", middleware.RoleOwner, models.ProductTypeBattery)
	require.NoError(t, err)
	supplier, err := auth.GenerateSupplierToken(tenant.String(), uuid.NewString(), "supplier@example.test")
	require.NoError(t, err)
	check := func(path, token string, status int) *httptest.ResponseRecorder {
		t.Helper()
		req := httptest.NewRequest(http.MethodGet, "/api/v1/traceability/"+path, nil)
		if token != "" {
			req.Header.Set("Authorization", "Bearer "+token)
		}
		res := httptest.NewRecorder()
		mux.ServeHTTP(res, req)
		require.Equal(t, status, res.Code, res.Body.String())
		require.Equal(t, "private, no-store", res.Header().Get("Cache-Control"))
		return res
	}
	check("packs?serial=PACK-001", "", http.StatusUnauthorized)
	check("lots?code=0007", supplier, http.StatusUnauthorized)
	check("packs?serial=%00", token, http.StatusBadRequest)
	check("lots/invalid", token, http.StatusBadRequest)
	repo.On("FindTracePacks", mock.Anything, tenant, "PACK-001", 201, 2).Return([]models.TracePack{}, nil).Once()
	response := check("packs?serial=PACK-001&limit=9999&offset=2&tenant_id="+otherTenant.String(), token, http.StatusOK)
	require.JSONEq(t, `{"items":[],"has_more":false}`, response.Body.String())
	repo.On("GetTraceLot", mock.Anything, tenant, lotID, 51, 0).Return(models.TraceLot{}, nil, pgx.ErrNoRows).Once()
	check("lots/"+lotID.String(), token, http.StatusNotFound)
	member = false
	check("packs?serial=PACK-001", token, http.StatusUnauthorized)
	repo.AssertExpectations(t)
}
