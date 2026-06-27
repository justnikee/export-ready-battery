package handlers

import (
	"context"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/anvayalabs/battery-api/internal/models"
	"github.com/google/uuid"
)

// scanFeedTestRepo lets each test control exactly what GetScanFeedSince
// returns, independent of real timers — the thing pollAndWriteScans was
// split out of StreamScanFeed to make possible.
type scanFeedTestRepo struct {
	fakeTeamRepo
	items []*models.ScanFeedItem
	err   error
}

func (r *scanFeedTestRepo) GetScanFeedSince(ctx context.Context, tenantID uuid.UUID, since time.Time, limit int) ([]*models.ScanFeedItem, error) {
	return r.items, r.err
}

func newScanFeedTestHandler(repo *scanFeedTestRepo) *Handler {
	h := newSupplierHandler(repo)
	h.repo = repo
	return h
}

func TestPollAndWriteScans_WritesNewScansAsSSE(t *testing.T) {
	now := time.Now()
	repo := &scanFeedTestRepo{
		fakeTeamRepo: *newFakeTeamRepo(),
		items: []*models.ScanFeedItem{
			{City: "Pune", Country: "IN", DeviceType: "mobile", SerialNumber: "IN-TEN-LFP-2026-00001", BatchName: "Batch A", ScannedAt: now},
		},
	}
	h := newScanFeedTestHandler(repo)
	rr := httptest.NewRecorder()
	tenantID := uuid.New()

	cursor := scanFeedCursor{lastSeen: now.Add(-time.Minute), lastSent: now.Add(-time.Minute)}
	newCursor, err := h.pollAndWriteScans(context.Background(), rr, rr, tenantID, cursor)
	if err != nil {
		t.Fatalf("pollAndWriteScans failed: %v", err)
	}

	body := rr.Body.String()
	if !strings.HasPrefix(body, "data: ") {
		t.Fatalf("expected an SSE data line, got %q", body)
	}
	if !strings.Contains(body, "IN-TEN-LFP-2026-00001") {
		t.Fatalf("expected serial number in payload, got %q", body)
	}
	if !newCursor.lastSeen.Equal(now) {
		t.Fatalf("expected cursor.lastSeen advanced to the latest scan's timestamp")
	}
}

func TestPollAndWriteScans_NoNewScans_NoOutputBeforeKeepAliveWindow(t *testing.T) {
	repo := &scanFeedTestRepo{fakeTeamRepo: *newFakeTeamRepo(), items: nil}
	h := newScanFeedTestHandler(repo)
	rr := httptest.NewRecorder()
	tenantID := uuid.New()

	now := time.Now()
	cursor := scanFeedCursor{lastSeen: now, lastSent: now} // just sent — well within keep-alive window
	newCursor, err := h.pollAndWriteScans(context.Background(), rr, rr, tenantID, cursor)
	if err != nil {
		t.Fatalf("pollAndWriteScans failed: %v", err)
	}
	if rr.Body.Len() != 0 {
		t.Fatalf("expected no output when nothing new and keep-alive window hasn't elapsed, got %q", rr.Body.String())
	}
	if !newCursor.lastSent.Equal(cursor.lastSent) {
		t.Fatalf("expected lastSent unchanged when no keep-alive was sent")
	}
}

func TestPollAndWriteScans_NoNewScans_SendsKeepAliveAfterWindow(t *testing.T) {
	repo := &scanFeedTestRepo{fakeTeamRepo: *newFakeTeamRepo(), items: nil}
	h := newScanFeedTestHandler(repo)
	rr := httptest.NewRecorder()
	tenantID := uuid.New()

	cursor := scanFeedCursor{
		lastSeen: time.Now(),
		lastSent: time.Now().Add(-scanFeedKeepAliveInterval - time.Second), // past the keep-alive window
	}
	newCursor, err := h.pollAndWriteScans(context.Background(), rr, rr, tenantID, cursor)
	if err != nil {
		t.Fatalf("pollAndWriteScans failed: %v", err)
	}
	if !strings.Contains(rr.Body.String(), "keep-alive") {
		t.Fatalf("expected a keep-alive comment, got %q", rr.Body.String())
	}
	if newCursor.lastSent.Equal(cursor.lastSent) {
		t.Fatalf("expected lastSent to be refreshed after sending keep-alive")
	}
}

func TestPollAndWriteScans_RepoError_NoOutputNoError(t *testing.T) {
	repo := &scanFeedTestRepo{fakeTeamRepo: *newFakeTeamRepo(), err: context.DeadlineExceeded}
	h := newScanFeedTestHandler(repo)
	rr := httptest.NewRecorder()
	tenantID := uuid.New()

	now := time.Now()
	cursor := scanFeedCursor{lastSeen: now, lastSent: now}
	_, err := h.pollAndWriteScans(context.Background(), rr, rr, tenantID, cursor)
	if err != nil {
		t.Fatalf("expected pollAndWriteScans to swallow repo errors (logged, not fatal to the stream), got %v", err)
	}
	if rr.Body.Len() != 0 {
		t.Fatalf("expected no output on repo error, got %q", rr.Body.String())
	}
}
