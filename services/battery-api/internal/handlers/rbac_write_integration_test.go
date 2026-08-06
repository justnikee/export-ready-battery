package handlers

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/anvayalabs/battery-api/internal/middleware"
)

// S-02 contract: VIEWER must not reach tenant mutating handlers when
// protectWrite / RequireWrite wraps the route. MEMBER may.
func TestRequireWrite_Integration_ViewerDeniedMemberAllowed(t *testing.T) {
	innerCalled := 0
	inner := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		innerCalled++
		w.WriteHeader(http.StatusCreated)
	})

	// Same chain as protectWriteOnboard without onboarding (unit-level).
	chain := middleware.RequireWrite(inner)

	// VIEWER
	reqV := httptest.NewRequest(http.MethodPost, "/api/v1/batches", nil)
	reqV = reqV.WithContext(context.WithValue(reqV.Context(), middleware.RoleKey, middleware.RoleViewer))
	rrV := httptest.NewRecorder()
	chain.ServeHTTP(rrV, reqV)
	if rrV.Code != http.StatusForbidden {
		t.Fatalf("VIEWER: expected 403, got %d body=%s", rrV.Code, rrV.Body.String())
	}
	if innerCalled != 0 {
		t.Fatal("VIEWER must not invoke handler")
	}

	// MEMBER
	reqM := httptest.NewRequest(http.MethodPost, "/api/v1/batches", nil)
	reqM = reqM.WithContext(context.WithValue(reqM.Context(), middleware.RoleKey, middleware.RoleMember))
	rrM := httptest.NewRecorder()
	chain.ServeHTTP(rrM, reqM)
	if rrM.Code != http.StatusCreated {
		t.Fatalf("MEMBER: expected 201, got %d", rrM.Code)
	}
	if innerCalled != 1 {
		t.Fatalf("MEMBER: expected handler once, got %d", innerCalled)
	}
}

func TestRequireWrite_Integration_OwnerAdminAllowed(t *testing.T) {
	inner := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	})
	chain := middleware.RequireWrite(inner)

	for _, role := range []string{middleware.RoleOwner, middleware.RoleAdmin} {
		req := httptest.NewRequest(http.MethodPatch, "/api/v1/batches/x", nil)
		req = req.WithContext(context.WithValue(req.Context(), middleware.RoleKey, role))
		rr := httptest.NewRecorder()
		chain.ServeHTTP(rr, req)
		if rr.Code != http.StatusOK {
			t.Errorf("%s: expected 200, got %d", role, rr.Code)
		}
	}
}

func TestRequireWrite_Integration_SupplierDeniedOnTenantWriteChain(t *testing.T) {
	// Suppliers must use RequireRole("supplier") routes, not RequireWrite.
	chain := middleware.RequireWrite(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	}))
	req := httptest.NewRequest(http.MethodPost, "/api/v1/batches", nil)
	req = req.WithContext(context.WithValue(req.Context(), middleware.RoleKey, middleware.RoleSupplier))
	rr := httptest.NewRecorder()
	chain.ServeHTTP(rr, req)
	if rr.Code != http.StatusForbidden {
		t.Fatalf("supplier on tenant write chain: expected 403, got %d", rr.Code)
	}
}
