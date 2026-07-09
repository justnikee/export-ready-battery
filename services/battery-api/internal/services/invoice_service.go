package services

import (
	"bytes"
	"fmt"
	"time"

	"github.com/jung-kurt/gofpdf"

	"github.com/anvayalabs/battery-api/internal/models"
)

// GenerateInvoicePDF creates a GST-compliant tax invoice PDF in memory.
func GenerateInvoicePDF(tenant *models.Tenant, pkg QuotaPackage, paymentID string) (*bytes.Buffer, error) {
	pdf := gofpdf.New("P", "mm", "A4", "")
	pdf.SetMargins(15, 15, 15)
	pdf.AddPage()

	// Title
	pdf.SetFont("Arial", "B", 16)
	pdf.CellFormat(0, 10, "TAX INVOICE", "0", 1, "C", false, 0, "")
	pdf.Ln(5)

	// Business details (Seller)
	pdf.SetFont("Arial", "B", 10)
	pdf.Cell(0, 5, "ExportReady Battery Platform")
	pdf.Ln(5)
	pdf.SetFont("Arial", "", 9)
	pdf.Cell(0, 4, "Anvaya Labs Pvt Ltd")
	pdf.Ln(4)
	pdf.Cell(0, 4, "Sector 62, Noida, Uttar Pradesh, 201301")
	pdf.Ln(4)
	pdf.Cell(0, 4, "GSTIN: 09AAICA1234F1Z5")
	pdf.Ln(4)
	pdf.Cell(0, 4, "SAC Code: 997331 (SaaS Software Licensing)")
	pdf.Ln(8)

	// Horizontal rule
	pdf.Line(15, pdf.GetY(), 195, pdf.GetY())
	pdf.Ln(5)

	// Billed To (Buyer) details
	pdf.SetFont("Arial", "B", 10)
	pdf.Cell(90, 5, "BILLED TO:")
	pdf.Cell(90, 5, "INVOICE DETAILS:")
	pdf.Ln(5)

	pdf.SetFont("Arial", "", 9)
	// Column 1: Buyer
	buyerY := pdf.GetY()
	pdf.Cell(90, 4, tenant.CompanyName)
	pdf.Ln(4)
	addr := tenant.Address
	if addr == "" {
		addr = "Not Provided"
	}
	pdf.Cell(90, 4, addr)
	pdf.Ln(4)
	email := tenant.SupportEmail
	if email == "" {
		email = "Not Provided"
	}
	pdf.Cell(90, 4, fmt.Sprintf("Email: %s", email))
	pdf.Ln(8)

	// Column 2: Invoice Details
	pdf.SetY(buyerY)
	pdf.SetX(110)
	pdf.Cell(90, 4, fmt.Sprintf("Invoice No: INV-%s", paymentID))
	pdf.SetY(buyerY + 4)
	pdf.SetX(110)
	pdf.Cell(90, 4, fmt.Sprintf("Invoice Date: %s", time.Now().Format("02 Jan 2006")))
	pdf.SetY(buyerY + 8)
	pdf.SetX(110)
	pdf.Cell(90, 4, fmt.Sprintf("Payment ID: %s", paymentID))
	pdf.SetY(buyerY + 12)
	pdf.SetX(110)
	pdf.Cell(90, 4, "Payment Status: Paid")
	pdf.SetY(buyerY + 18)

	// Table Header
	pdf.SetFont("Arial", "B", 9)
	pdf.SetFillColor(240, 240, 240)
	pdf.CellFormat(80, 7, "Description", "1", 0, "L", true, 0, "")
	pdf.CellFormat(20, 7, "SAC", "1", 0, "C", true, 0, "")
	pdf.CellFormat(25, 7, "Taxable Val", "1", 0, "R", true, 0, "")
	pdf.CellFormat(30, 7, "GST (18%)", "1", 0, "R", true, 0, "")
	pdf.CellFormat(25, 7, "Total (INR)", "1", 1, "R", true, 0, "")

	// Pricing Calculations (18% inclusive GST)
	totalINR := float64(pkg.PriceINR)
	taxableVal := totalINR / 1.18
	gstAmt := totalINR - taxableVal

	// Table Data
	pdf.SetFont("Arial", "", 9)
	pdf.CellFormat(80, 7, fmt.Sprintf("%s (Licence Renewal)", pkg.Name), "1", 0, "L", false, 0, "")
	pdf.CellFormat(20, 7, "997331", "1", 0, "C", false, 0, "")
	pdf.CellFormat(25, 7, fmt.Sprintf("%.2f", taxableVal), "1", 0, "R", false, 0, "")
	pdf.CellFormat(30, 7, fmt.Sprintf("%.2f (CGST 9%% + SGST 9%%)", gstAmt), "1", 0, "R", false, 0, "")
	pdf.CellFormat(25, 7, fmt.Sprintf("%.2f", totalINR), "1", 1, "R", false, 0, "")

	// Total Row
	pdf.SetFont("Arial", "B", 9)
	pdf.CellFormat(125, 7, "Total (Inclusive of GST)", "1", 0, "R", true, 0, "")
	pdf.CellFormat(55, 7, fmt.Sprintf("Rs. %.2f", totalINR), "1", 1, "R", true, 0, "")
	pdf.Ln(10)

	// Declarations / Footer
	pdf.SetFont("Arial", "I", 8)
	pdf.Cell(0, 4, "Declaration: We declare that this invoice shows the actual price of the services described.")
	pdf.Ln(4)
	pdf.Cell(0, 4, "This is a computer-generated invoice and does not require a physical signature.")

	var buf bytes.Buffer
	err := pdf.Output(&buf)
	if err != nil {
		return nil, fmt.Errorf("failed to output PDF: %w", err)
	}

	return &buf, nil
}
