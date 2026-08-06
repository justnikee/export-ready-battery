package handlers

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/anvayalabs/battery-api/internal/middleware"
	"github.com/anvayalabs/battery-api/internal/repository"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/stretchr/testify/mock"
)

// S-07: MarkAlertRead must pass tenant_id and return 404 for foreign alerts.
func TestMarkAlertRead_ScopesToTenant(t *testing.T) {
	tenantA := uuid.New()
	tenantB := uuid.New()
	alertID := uuid.New()

	mockRepo := new(repository.MockRepository)
	// Own tenant succeeds
	mockRepo.On("MarkAlertRead", mock.Anything, alertID, tenantA).Return(nil).Once()
	// Foreign tenant → no rows
	mockRepo.On("MarkAlertRead", mock.Anything, alertID, tenantB).Return(pgx.ErrNoRows).Once()

	h := &Handler{repo: mockRepo}

	t.Run("own tenant 200", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodPost, "/api/v1/alerts/"+alertID.String()+"/read", nil)
		req.SetPathValue("id", alertID.String())
		req = req.WithContext(context.WithValue(req.Context(), middleware.TenantIDKey, tenantA.String()))
		rr := httptest.NewRecorder()
		h.MarkAlertRead(rr, req)
		if rr.Code != http.StatusOK {
			t.Fatalf("expected 200, got %d: %s", rr.Code, rr.Body.String())
		}
	})

	t.Run("foreign tenant 404", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodPost, "/api/v1/alerts/"+alertID.String()+"/read", nil)
		req.SetPathValue("id", alertID.String())
		req = req.WithContext(context.WithValue(req.Context(), middleware.TenantIDKey, tenantB.String()))
		rr := httptest.NewRecorder()
		h.MarkAlertRead(rr, req)
		if rr.Code != http.StatusNotFound {
			t.Fatalf("expected 404, got %d: %s", rr.Code, rr.Body.String())
		}
	})

	mockRepo.AssertExpectations(t)
}

func TestMarkAlertRead_InvalidIDs(t *testing.T) {
	h := &Handler{repo: new(repository.MockRepository)}

	req := httptest.NewRequest(http.MethodPost, "/api/v1/alerts/not-a-uuid/read", nil)
	req.SetPathValue("id", "not-a-uuid")
	req = req.WithContext(context.WithValue(req.Context(), middleware.TenantIDKey, uuid.New().String()))
	rr := httptest.NewRecorder()
	h.MarkAlertRead(rr, req)
	if rr.Code != http.StatusBadRequest {
		t.Fatalf("expected 400, got %d", rr.Code)
	}
}
