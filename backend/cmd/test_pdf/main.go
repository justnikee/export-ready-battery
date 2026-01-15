package main

import (
	"fmt"
	"os"
	"time"

	"github.com/google/uuid"

	"exportready-battery/internal/models"
	"exportready-battery/internal/services"
)

func main() {
	fmt.Println("=== PDF Label Generator Test ===")

	// Create PDF service
	pdfService := services.NewPDFService("https://exportready.app")

	// Create mock tenant with India compliance fields
	tenant := &models.Tenant{
		ID:                    uuid.New(),
		CompanyName:           "Acme Batteries Pvt. Ltd.",
		Address:               "Industrial Area, Phase II, New Delhi",
		SupportEmail:          "support@acmebatteries.in",
		EPRRegistrationNumber: "B-29016/2024-25/CPCB",
		BISRNumber:            "41001234",
		IECCode:               "0504012345",
	}

	// Create mock batch
	batch := &models.Batch{
		ID:        uuid.New(),
		TenantID:  tenant.ID,
		BatchName: "Q1-2026-Production",
		Specs: models.BatchSpec{
			Chemistry:      "Li-ion NMC",
			NominalVoltage: "48V",
			Capacity:       "100Ah",
			Manufacturer:   "Acme Batteries Pvt. Ltd.",
			Weight:         "45kg",
		},
		MarketRegion: models.MarketRegionIndia,
		CellSource:   "DOMESTIC",
		PLICompliant: true,
	}

	// Create 25 mock passports (will span 2 pages: 21 + 4)
	passports := make([]*models.Passport, 25)
	for i := 0; i < 25; i++ {
		passports[i] = &models.Passport{
			UUID:            uuid.New(),
			BatchID:         batch.ID,
			SerialNumber:    fmt.Sprintf("IN-ACM-NMC-2026-%05d", i+1),
			ManufactureDate: time.Now(),
			Status:          models.PassportStatusActive,
			CreatedAt:       time.Now(),
		}
	}

	fmt.Printf("Generating labels for %d passports...\n", len(passports))

	// Generate PDF
	buf, err := pdfService.GenerateLabelSheet(batch, passports, tenant)
	if err != nil {
		fmt.Printf("ERROR: %v\n", err)
		os.Exit(1)
	}

	// Save to file
	outputPath := "test_labels.pdf"
	err = os.WriteFile(outputPath, buf.Bytes(), 0644)
	if err != nil {
		fmt.Printf("ERROR writing file: %v\n", err)
		os.Exit(1)
	}

	// Get file info
	info, err := os.Stat(outputPath)
	if err != nil {
		fmt.Printf("ERROR getting file info: %v\n", err)
		os.Exit(1)
	}

	fmt.Println("=== SUCCESS ===")
	fmt.Printf("Output: %s\n", outputPath)
	fmt.Printf("Size: %d bytes (%.2f KB)\n", info.Size(), float64(info.Size())/1024)
	fmt.Printf("Pages: 2 (21 labels + 4 labels)\n")
	fmt.Println("Open the PDF to verify the layout!")
}
