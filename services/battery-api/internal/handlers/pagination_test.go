package handlers

import (
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestClampLimit(t *testing.T) {
	if got := ClampLimit(0, 50, 200); got != 50 {
		t.Fatalf("default: got %d", got)
	}
	if got := ClampLimit(-1, 50, 200); got != 50 {
		t.Fatalf("negative: got %d", got)
	}
	if got := ClampLimit(25, 50, 200); got != 25 {
		t.Fatalf("in range: got %d", got)
	}
	if got := ClampLimit(1_000_000, 50, 200); got != 200 {
		t.Fatalf("huge must cap at 200, got %d", got)
	}
	if got := ClampLimit(500, 50, 0); got != 200 {
		t.Fatalf("maxLimit 0 → MaxListLimit: got %d", got)
	}
}

func TestParseQueryLimit(t *testing.T) {
	req := httptest.NewRequest(http.MethodGet, "/x?limit=999999", nil)
	if got := ParseQueryLimit(req, 50, MaxListLimit); got != 200 {
		t.Fatalf("got %d", got)
	}
	req = httptest.NewRequest(http.MethodGet, "/x", nil)
	if got := ParseQueryLimit(req, 50, MaxListLimit); got != 50 {
		t.Fatalf("missing limit default: got %d", got)
	}
	req = httptest.NewRequest(http.MethodGet, "/x?limit=10", nil)
	if got := ParseQueryLimit(req, 50, MaxListLimit); got != 10 {
		t.Fatalf("got %d", got)
	}
}

func TestParseQueryPageSize(t *testing.T) {
	req := httptest.NewRequest(http.MethodGet, "/x?page_size=5000", nil)
	if got := ParseQueryPageSize(req, 20, MaxListLimit); got != 200 {
		t.Fatalf("got %d", got)
	}
}

func TestParseQueryOffset(t *testing.T) {
	req := httptest.NewRequest(http.MethodGet, "/x?offset=40", nil)
	if got := ParseQueryOffset(req); got != 40 {
		t.Fatalf("got %d", got)
	}
	req = httptest.NewRequest(http.MethodGet, "/x?offset=-5", nil)
	if got := ParseQueryOffset(req); got != 0 {
		t.Fatalf("negative offset → 0, got %d", got)
	}
}
