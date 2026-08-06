package middleware

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestCanWriteRole(t *testing.T) {
	cases := []struct {
		role string
		want bool
	}{
		{RoleOwner, true},
		{RoleAdmin, true},
		{RoleMember, true},
		{RoleViewer, false},
		{RoleSupplier, false}, // supplier must not use general write middleware
		{"", false},
		{"unknown", false},
	}
	for _, tc := range cases {
		if got := CanWriteRole(tc.role); got != tc.want {
			t.Errorf("CanWriteRole(%q)=%v want %v", tc.role, got, tc.want)
		}
	}
}

func TestRequireWrite_AllowsMember(t *testing.T) {
	called := false
	h := RequireWrite(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		called = true
		w.WriteHeader(http.StatusOK)
	}))

	req := httptest.NewRequest(http.MethodPost, "/api/v1/batches", nil)
	req = req.WithContext(context.WithValue(req.Context(), RoleKey, RoleMember))
	rr := httptest.NewRecorder()
	h.ServeHTTP(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", rr.Code)
	}
	if !called {
		t.Fatal("expected handler to run")
	}
}

func TestRequireWrite_DeniesViewer(t *testing.T) {
	h := RequireWrite(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	}))

	req := httptest.NewRequest(http.MethodPost, "/api/v1/batches", nil)
	req = req.WithContext(context.WithValue(req.Context(), RoleKey, RoleViewer))
	rr := httptest.NewRecorder()
	h.ServeHTTP(rr, req)

	if rr.Code != http.StatusForbidden {
		t.Fatalf("expected 403 for VIEWER, got %d: %s", rr.Code, rr.Body.String())
	}
}

func TestRequireWrite_DeniesSupplierOnTenantWrite(t *testing.T) {
	// Supplier tokens must not pass general RequireWrite — supplier routes
	// use RequireRole("supplier") explicitly instead.
	h := RequireWrite(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	}))

	req := httptest.NewRequest(http.MethodPost, "/api/v1/batches", nil)
	req = req.WithContext(context.WithValue(req.Context(), RoleKey, RoleSupplier))
	rr := httptest.NewRecorder()
	h.ServeHTTP(rr, req)

	if rr.Code != http.StatusForbidden {
		t.Fatalf("expected 403 for supplier on tenant write, got %d", rr.Code)
	}
}

func TestRequireWrite_DeniesEmptyRole(t *testing.T) {
	h := RequireWrite(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	}))

	req := httptest.NewRequest(http.MethodPost, "/api/v1/batches", nil)
	// no RoleKey in context
	rr := httptest.NewRecorder()
	h.ServeHTTP(rr, req)

	if rr.Code != http.StatusForbidden {
		t.Fatalf("expected 403 for empty role, got %d", rr.Code)
	}
}
