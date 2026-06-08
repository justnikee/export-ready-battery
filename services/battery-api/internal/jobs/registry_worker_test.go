package jobs

import (
	"context"
	"errors"
	"testing"
	"time"

	"github.com/anvayalabs/battery-api/internal/config"
	"github.com/anvayalabs/battery-api/internal/models"
	"github.com/anvayalabs/battery-api/internal/repository"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

// ============================================================================
// RETRY LOGIC TESTS
// ============================================================================

func TestCalculateBackoff(t *testing.T) {
	tests := []struct {
		attempt  int
		expected time.Duration
	}{
		{1, 30 * time.Second},
		{2, 2 * time.Minute},
		{3, 5 * time.Minute},
		{4, 15 * time.Minute},
		{5, 30 * time.Minute},
		{6, 30 * time.Minute},
		{10, 30 * time.Minute},
	}

	for _, tt := range tests {
		t.Run(tt.expected.String(), func(t *testing.T) {
			got := calculateBackoff(tt.attempt)
			assert.Equal(t, tt.expected, got)
		})
	}
}

func TestFailJob_IncrementAttemptsAndSetsNextAttempt(t *testing.T) {
	mockRepo := new(repository.MockRepository)
	cfg := &config.Config{RegistryWorkerCount: 1, RegistryWorkerInterval: time.Hour}
	pool := NewRegistryWorkerPool(mockRepo, cfg)

	jobID := uuid.New()
	batchID := uuid.New()
	tenantID := uuid.New()

	job := models.RegistryJob{
		ID:           jobID.String(),
		RegistryType: "bis",
		BatchID:      batchID.String(),
		TenantID:     tenantID.String(),
		Status:       "pending",
		AttemptCount: 2,
		MaxAttempts:  5,
	}

	mockRepo.On("UpdateRegistryJobStatus",
		mock.Anything,
		jobID,
		"failed",
		3,
		mock.AnythingOfType("*time.Time"),
		"",
		"",
		"",
		"adapter error",
	).Return(nil).Once()

	pool.failJob(context.Background(), jobID, job, errors.New("adapter error"), time.Now())

	mockRepo.AssertExpectations(t)
}

func TestFailJob_DeadAfterMaxAttempts(t *testing.T) {
	mockRepo := new(repository.MockRepository)
	cfg := &config.Config{RegistryWorkerCount: 1, RegistryWorkerInterval: time.Hour}
	pool := NewRegistryWorkerPool(mockRepo, cfg)

	jobID := uuid.New()
	batchID := uuid.New()

	job := models.RegistryJob{
		ID:           jobID.String(),
		RegistryType: "bis",
		BatchID:      batchID.String(),
		TenantID:     uuid.New().String(),
		Status:       "failed",
		AttemptCount: 4,
		MaxAttempts:  5,
	}

	mockRepo.On("UpdateRegistryJobStatus",
		mock.Anything,
		jobID,
		"dead",
		5,
		mock.AnythingOfType("*time.Time"),
		"",
		"",
		"",
		"final failure",
	).Return(nil).Once()

	pool.failJob(context.Background(), jobID, job, errors.New("final failure"), time.Now())

	mockRepo.AssertExpectations(t)
}

// ============================================================================
// WORKER PROCESS JOB TESTS
// ============================================================================

func TestProcessJob_InvalidRegistryType(t *testing.T) {
	mockRepo := new(repository.MockRepository)
	cfg := &config.Config{RegistryWorkerCount: 1, RegistryWorkerInterval: time.Hour}
	pool := NewRegistryWorkerPool(mockRepo, cfg)

	jobID := uuid.New()
	batchID := uuid.New()

	job := models.RegistryJob{
		ID:           jobID.String(),
		RegistryType: "invalid_type",
		BatchID:      batchID.String(),
		TenantID:     uuid.New().String(),
		Status:       "pending",
		AttemptCount: 0,
		MaxAttempts:  5,
	}

	mockRepo.On("UpdateRegistryJobStatus",
		mock.Anything, jobID, "running", 1,
		mock.Anything, "", "", "", "",
	).Return(nil).Once()

	mockRepo.On("UpdateRegistryJobStatus",
		mock.Anything, jobID, "failed", 1,
		mock.AnythingOfType("*time.Time"), "", "", "",
		mock.Anything,
	).Return(nil).Once()

	pool.processJob(context.Background(), job)

	mockRepo.AssertExpectations(t)
}

func TestProcessJob_NilAdapter(t *testing.T) {
	mockRepo := new(repository.MockRepository)
	cfg := &config.Config{RegistryWorkerCount: 1, RegistryWorkerInterval: time.Hour}
	pool := NewRegistryWorkerPool(mockRepo, cfg)

	jobID := uuid.New()
	batchID := uuid.New()

	job := models.RegistryJob{
		ID:           jobID.String(),
		RegistryType: "custom", // not in default adapter registry
		BatchID:      batchID.String(),
		TenantID:     uuid.New().String(),
		Status:       "pending",
		AttemptCount: 0,
		MaxAttempts:  5,
	}

	mockRepo.On("UpdateRegistryJobStatus",
		mock.Anything, jobID, "running", 1,
		mock.Anything, "", "", "", "",
	).Return(nil).Once()

	mockRepo.On("UpdateRegistryJobStatus",
		mock.Anything, jobID, "failed", 1,
		mock.AnythingOfType("*time.Time"), "", "", "",
		mock.Anything,
	).Return(nil).Once()

	pool.processJob(context.Background(), job)

	mockRepo.AssertExpectations(t)
}

func TestExtractBatchMetadata(t *testing.T) {
	batch := &models.Batch{
		BatchName:    "Test Batch",
		ModelName:    "Model X",
		ProductType:  models.ProductTypeBattery,
		MarketRegion: models.MarketRegionIndia,
		Status:       models.BatchStatusActive,
		Specs: models.BatchSpec{
			BISNumber:              "R-12345",
			EPRNumber:              "EPR/01",
			HSNCode:                "8507",
			UN383TestDate:          "2025-06-01",
			UN383LabName:           "TÜV",
			IEC62133TestDate:       "2025-05-01",
			CENotifiedBodyNumber:   "0884",
		},
	}

	m := extractBatchMetadata(batch)

	assert.Equal(t, "Test Batch", m["batch_name"])
	assert.Equal(t, "Model X", m["model_name"])
	assert.Equal(t, string(models.ProductTypeBattery), m["product_type"])
	assert.Equal(t, string(models.MarketRegionIndia), m["market_region"])
	assert.Equal(t, string(models.BatchStatusActive), m["status"])
	assert.Equal(t, "R-12345", m["bis_number"])
	assert.Equal(t, "EPR/01", m["epr_number"])
	assert.Equal(t, "8507", m["hsn_code"])
	assert.Equal(t, "2025-06-01", m["un38_test_date"])
	assert.Equal(t, "TÜV", m["un38_lab_name"])
	assert.Equal(t, "2025-05-01", m["iec62133_test_date"])
	assert.Equal(t, "0884", m["ce_notified_body_number"])
}
