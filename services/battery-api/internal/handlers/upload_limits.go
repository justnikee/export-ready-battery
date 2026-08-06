package handlers

import (
	"errors"
	"fmt"
	"net/http"
	"strings"

	"github.com/anvayalabs/battery-api/internal/limits"
)

// isRequestBodyTooLarge reports MaxBytesReader / oversized multipart errors.
func isRequestBodyTooLarge(err error) bool {
	if err == nil {
		return false
	}
	var maxBytes *http.MaxBytesError
	if errors.As(err, &maxBytes) {
		return true
	}
	msg := err.Error()
	return strings.Contains(strings.ToLower(msg), "request body too large") ||
		strings.Contains(strings.ToLower(msg), "multipart: message too large")
}

// respondIfBodyTooLarge writes 413 when err is an oversize body; returns true if handled.
func respondIfBodyTooLarge(w http.ResponseWriter, err error) bool {
	if !isRequestBodyTooLarge(err) {
		return false
	}
	respondError(w, http.StatusRequestEntityTooLarge,
		fmt.Sprintf("Request body too large. Maximum is %dMB.", limits.MaxRequestBodyMB))
	return true
}

// parseMultipartForm parses multipart with memory cap ≤ global body limit and
// maps oversize errors to HTTP 413 (P-06).
func parseMultipartForm(w http.ResponseWriter, r *http.Request, maxMemory int64) bool {
	if maxMemory <= 0 || maxMemory > limits.MaxRequestBodyBytes {
		maxMemory = limits.MaxRequestBodyBytes
	}
	if err := r.ParseMultipartForm(maxMemory); err != nil {
		if respondIfBodyTooLarge(w, err) {
			return false
		}
		respondError(w, http.StatusBadRequest, "Failed to parse upload form")
		return false
	}
	return true
}
