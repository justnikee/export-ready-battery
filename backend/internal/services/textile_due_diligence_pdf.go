package services

import (
	"bytes"
	"fmt"
	"strings"
	"time"

	"github.com/jung-kurt/gofpdf"

	"anvayalabs-battery/internal/models"
)

// GenerateTextileDueDiligenceReport creates a textile-focused supply-chain dossier PDF.
func GenerateTextileDueDiligenceReport(batch *models.Batch, tenant *models.Tenant) ([]byte, error) {
	tenant.EnsureTextileProfile()
	tenant.EnsureBatteryProfile()
	pdf := gofpdf.New("P", "mm", "A4", "")
	pdf.SetAutoPageBreak(true, 20)
	pdf.SetMargins(18, 20, 18)
	pdf.AddPage()

	pdf.SetFillColor(17, 24, 39)
	pdf.Rect(0, 0, 210, 36, "F")
	pdf.SetTextColor(255, 255, 255)
	pdf.SetFont("Helvetica", "B", 17)
	pdf.SetXY(18, 10)
	pdf.CellFormat(174, 9, "TEXTILE DUE DILIGENCE REPORT", "", 1, "L", false, 0, "")
	pdf.SetFont("Helvetica", "", 10)
	pdf.SetX(18)
	pdf.CellFormat(174, 6, "Supply-chain and material traceability summary", "", 1, "L", false, 0, "")

	pdf.SetY(44)
	sectionTitle := func(title string) {
		pdf.SetFont("Helvetica", "B", 12)
		pdf.SetTextColor(17, 24, 39)
		pdf.CellFormat(174, 7, title, "", 1, "L", false, 0, "")
		pdf.SetDrawColor(209, 213, 219)
		pdf.Line(18, pdf.GetY(), 192, pdf.GetY())
		pdf.Ln(3)
	}
	writeLine := func(label, value string) {
		if strings.TrimSpace(value) == "" {
			return
		}
		pdf.SetFont("Helvetica", "B", 9)
		pdf.SetTextColor(75, 85, 99)
		pdf.CellFormat(46, 6, label+":", "", 0, "L", false, 0, "")
		pdf.SetFont("Helvetica", "", 9)
		pdf.SetTextColor(17, 24, 39)
		pdf.MultiCell(128, 6, value, "", "L", false)
	}

	sectionTitle("Report Identity")
	writeLine("Generated", time.Now().Format("2006-01-02 15:04 UTC"))
	writeLine("Company", tenant.CompanyName)
	writeLine("Batch / Lot", batch.BatchName)
	writeLine("Style / Product", batch.ModelName)
	writeLine("Market Region", string(batch.MarketRegion))

	sectionTitle("Manufacturing Context")
	writeLine("Facility Type", tenant.TextileProfile.FacilityType)
	writeLine("Supply Chain Tier", tenant.TextileProfile.SupplyChainTier)
	writeLine("Material Profile", batch.Specs.MaterialProfile)
	writeLine("Production Stage", batch.Specs.ProductionStage)
	writeLine("Country of Origin", batch.Specs.CountryOfOrigin)
	writeLine("Lot Size", batch.Specs.LotSize)

	sectionTitle("Substance And Certification Disclosure")
	hazardousDeclaration := "No hazardous substances declaration supplied."
	if batch.Specs.HazardousSubstances != nil && strings.TrimSpace(batch.Specs.HazardousSubstances.Declaration) != "" {
		hazardousDeclaration = batch.Specs.HazardousSubstances.Declaration
	}
	writeLine("REACH / SVHC", hazardousDeclaration)
	writeLine("Certifications", textileCertificationsSummary(batch, tenant))

	sectionTitle("Supply Chain Provenance")
	if batch.Specs.SupplyChainProvenance != nil {
		writeLine("Due Diligence Policy", batch.Specs.SupplyChainProvenance.DueDiligencePolicy)
		if len(batch.Specs.SupplyChainProvenance.Tiers) == 0 {
			writeLine("Tier Data", "No structured supplier tiers supplied.")
		} else {
			for index, tier := range batch.Specs.SupplyChainProvenance.Tiers {
				parts := []string{}
				if tier.Material != "" {
					parts = append(parts, tier.Material)
				}
				if tier.SupplierName != "" {
					parts = append(parts, tier.SupplierName)
				}
				if tier.CountryOfOrigin != "" {
					parts = append(parts, tier.CountryOfOrigin)
				}
				if tier.Certified {
					parts = append(parts, "certified")
				}
				if tier.RecycledSource {
					parts = append(parts, "recycled source")
				}
				writeLine(fmt.Sprintf("Tier %d", index+1), strings.Join(parts, " | "))
			}
		}
	} else {
		writeLine("Tier Data", "No structured supply-chain provenance supplied.")
	}

	sectionTitle("Statement")
	pdf.SetFont("Helvetica", "", 9)
	pdf.SetTextColor(17, 24, 39)
	pdf.MultiCell(174, 5,
		"This report summarises the textile lot data, supplier provenance information, and tenant-level disclosure defaults captured in the platform at the time of generation. It is intended to support textile passport exchange, partner review, and audit preparation.",
		"", "L", false,
	)

	var buf bytes.Buffer
	if err := pdf.Output(&buf); err != nil {
		return nil, fmt.Errorf("failed to generate textile due diligence PDF: %w", err)
	}
	return buf.Bytes(), nil
}