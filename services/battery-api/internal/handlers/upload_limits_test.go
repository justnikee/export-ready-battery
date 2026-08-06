package handlers

import (
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/anvayalabs/battery-api/internal/limits"
)

func TestIsRequestBodyTooLarge(t *testing.T) {
	if !isRequestBodyTooLarge(&http.MaxBytesError{Limit: limits.MaxRequestBodyBytes}) {
		t.Fatal("MaxBytesError should match")
	}
	if !isRequestBodyTooLarge(fmt.Errorf("http: request body too large")) {
		t.Fatal("message should match")
	}
	if isRequestBodyTooLarge(fmt.Errorf("invalid multipart")) {
		t.Fatal("other errors must not match")
	}
	if isRequestBodyTooLarge(nil) {
		t.Fatal("nil")
	}
}

func TestRespondIfBodyTooLarge_Status413(t *testing.T) {
	rr := httptest.NewRecorder()
	if !respondIfBodyTooLarge(rr, &http.MaxBytesError{Limit: 10}) {
		t.Fatal("expected handled")
	}
	if rr.Code != http.StatusRequestEntityTooLarge {
		t.Fatalf("got %d want 413", rr.Code)
	}
}

func TestCertAndLogoWithinGlobal(t *testing.T) {
	if MaxUploadSize > limits.MaxRequestBodyBytes {
		t.Fatal("cert max exceeds global")
	}
	if limits.MaxLogoUploadBytes > limits.MaxRequestBodyBytes {
		t.Fatal("logo max exceeds global")
	}
	if limits.MaxPassportDocBytes > limits.MaxRequestBodyBytes {
		t.Fatal("passport doc max exceeds global")
	}
}
