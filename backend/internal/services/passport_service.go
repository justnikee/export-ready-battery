package services

import (
	"context"
	"fmt"

	"exportready-battery/internal/models"
	"exportready-battery/internal/serial"
)

// PassportService wraps the serial number generator for passport creation.
// It delegates to serial.BPANGenerator for the canonical BPAN-V2 format.
type PassportService struct {
	gen serial.Generator
}

// NewPassportService creates a PassportService backed by serial.BPANGenerator.
func NewPassportService() *PassportService {
	return &PassportService{gen: serial.NewBPANGenerator()}
}

// GenerateSerial returns a BPAN-V2 serial number for a single passport in the
// given batch. seq is the 1-based position within the batch (used as the
// sequence segment of the serial number).
//
// Example output: IN-TEN-LFP-2026-00042
func (s *PassportService) GenerateSerial(
	_ context.Context,
	batch *models.Batch,
	tenant *models.Tenant,
	seq int,
) (string, error) {
	mfrCode := tenant.ManufacturerCode
	if mfrCode == "" {
		mfrCode = serial.DeriveManufacturerCode(tenant.CompanyName)
	}

	result, err := s.gen.Generate(
		batch.ProductType,
		batch.MarketRegion,
		serial.Options{
			ManufacturerCode: mfrCode,
			Chemistry:        batch.Specs.Chemistry,
			Sequence:         seq,
		},
	)
	if err != nil {
		return "", fmt.Errorf("passport_service: failed to generate serial: %w", err)
	}
	return result, nil
}

// Generator returns the underlying serial.Generator for cases where callers
// need direct access (e.g. for batch serial pre-generation).
func (s *PassportService) Generator() serial.Generator {
	return s.gen
}
