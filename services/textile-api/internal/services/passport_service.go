package services

import (
	"context"
	"fmt"

	"github.com/anvayalabs/textile-api/internal/models"
	"github.com/anvayalabs/textile-api/internal/serial"
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

	// Derive product code from primary fiber for textile
	productCode := derivePrimaryFiberCode(batch.Specs.FiberComposition)

	result, err := s.gen.Generate(
		batch.ProductType,
		batch.MarketRegion,
		serial.Options{
			ManufacturerCode: mfrCode,
			Chemistry:        productCode,
			Sequence:         seq,
		},
	)
	if err != nil {
		return "", fmt.Errorf("passport_service: failed to generate serial: %w", err)
	}
	return result, nil
}

// derivePrimaryFiberCode finds the highest-percentage fiber in the composition
// and returns its 3-letter BPAN fiber code (e.g., "CTN", "POL", "WOL").
func derivePrimaryFiberCode(fc *models.FiberComposition) string {
	if fc == nil {
		return "GEN"
	}
	type fiberEntry struct {
		name string
		pct  float64
	}
	fibers := []fiberEntry{
		{"cotton", fc.CottonPct},
		{"polyester", fc.PolyesterPct},
		{"wool", fc.WoolPct},
		{"silk", fc.SilkPct},
		{"linen", fc.LinenPct},
		{"viscose", fc.ViscosePct},
		{"nylon", fc.NylonPct},
		{"acrylic", fc.AcrylicPct},
		{"hemp", fc.HempPct},
	}
	var maxPct float64
	var primary string
	for _, f := range fibers {
		if f.pct > maxPct {
			maxPct = f.pct
			primary = f.name
		}
	}
	if primary == "" {
		return "GEN"
	}
	return serial.MapFiberCode(primary)
}

// Generator returns the underlying serial.Generator for cases where callers
// need direct access (e.g. for batch serial pre-generation).
func (s *PassportService) Generator() serial.Generator {
	return s.gen
}
