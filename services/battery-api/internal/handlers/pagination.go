package handlers

import (
	"net/http"
	"strconv"
)

// List pagination conventions (P-02 / project API shape).
// Default 50, hard max 200 — never honor unbounded client limit values.
const (
	DefaultListLimit = 50
	MaxListLimit     = 200
)

// ClampLimit returns defaultLimit when n <= 0, else min(n, maxLimit).
// maxLimit defaults to MaxListLimit when <= 0.
func ClampLimit(n, defaultLimit, maxLimit int) int {
	if maxLimit <= 0 {
		maxLimit = MaxListLimit
	}
	if defaultLimit <= 0 {
		defaultLimit = DefaultListLimit
	}
	if n <= 0 {
		return defaultLimit
	}
	if n > maxLimit {
		return maxLimit
	}
	return n
}

// ParseQueryLimit reads ?limit= with default and hard cap (P-02).
func ParseQueryLimit(r *http.Request, defaultLimit, maxLimit int) int {
	n := 0
	if l := r.URL.Query().Get("limit"); l != "" {
		if parsed, err := strconv.Atoi(l); err == nil {
			n = parsed
		}
	}
	return ClampLimit(n, defaultLimit, maxLimit)
}

// ParseQueryPageSize reads ?page_size= (DGFT-style) with default and hard cap.
func ParseQueryPageSize(r *http.Request, defaultSize, maxSize int) int {
	n := 0
	if l := r.URL.Query().Get("page_size"); l != "" {
		if parsed, err := strconv.Atoi(l); err == nil {
			n = parsed
		}
	}
	return ClampLimit(n, defaultSize, maxSize)
}

// ParseQueryOffset reads ?offset=; negative values become 0. No upper cap
// (offset alone does not expand result set size).
func ParseQueryOffset(r *http.Request) int {
	if o := r.URL.Query().Get("offset"); o != "" {
		if parsed, err := strconv.Atoi(o); err == nil && parsed > 0 {
			return parsed
		}
	}
	return 0
}
